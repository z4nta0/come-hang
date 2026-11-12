


// #region Imports

import { CAL_OPT_OBJ  } from './setup.ts';                  // What: Callable Options Object. Why: Every function shares the deploy options, and one the app calls refuses a call without App Check outside the emulator. How: The callable takes them.
import { FieldPath    } from 'firebase-admin/firestore';    // What: Field Path. Why: A group's ID becomes a map key in each account. How: This names that key without reading it as a dotted path.
import { FieldValue   } from 'firebase-admin/firestore';    // What: Field Value. Why: Counts fall and map entries go. How: This supplies the increment and the field delete.
import { FIR_DAT_OBJ  } from './setup.ts';                  // What: Firestore Database Object. Why: Most of an identity's data lives in Firestore. How: This reads and deletes it.
import { groDelRunFun } from './group-deletion.ts';         // What: Group Deletion Run Function. Why: A group its owner was alone in is deleted. How: This runs the deletion's stages.
import { HttpsError   } from 'firebase-functions/v2/https'; // What: HTTPS Error. Why: A refused call tells the app why. How: This throws an error the client receives with its code.
import { ideDelFun    } from './identity-cleanup.ts';       // What: Identity Delete Function. Why: Once the identity is in no group, what's left of it goes. How: This deletes its account, public key, and sign-in record.
import { onCall       } from 'firebase-functions/v2/https'; // What: On Call. Why: Someone deletes their data from the app. How: This registers a callable function, which checks the caller's sign-in.
import { REA_DAT_OBJ  } from './setup.ts';                  // What: Realtime Database Object. Why: Presence lives there. How: This removes the identity's.
import { STO_ADM_OBJ  } from './setup.ts';                  // What: Storage Admin Object. Why: A history transfer the identity asked for lives in Storage. How: This deletes it.
import { uplDelFun    } from './photos.ts';                 // What: Uploads Delete Function. Why: Photos the identity shared are its data too. How: This deletes them in a group.


import type { DocumentSnapshot } from 'firebase-admin/firestore'; // What: Document Snapshot. Why: A group its owner was alone in is handed to the deletion as read. How: This types it.

// #endregion Imports



/**
 * data-deletion.ts = Data Deletion
 *
 * @summary
 * The callable someone deletes their data through, from Settings or the
 * welcome (ARCHITECTURE.md Section 14). A client can't do it alone, since
 * handing a group on writes another member's account, which the rules allow
 * no one, and an identity's sign-in record can only be deleted by a server.
 *
 * For each group the identity owns, its own documents in the group go
 * first, then the group passes to the member who joined it earliest, in one
 * transaction that also takes the owner out, or, when no one else is in it,
 * the group is deleted whole. For each group it belongs to, its own documents
 * go, then its membership. Then its requests to join any group, its account
 * with the notices and push token under it, its public key, and last its
 * sign-in record. Each group leaves the account's maps as it's done, so a
 * retry after a failure picks up where the last call stopped, and once the
 * sign-in record is gone no call can run. The last of it goes through
 * identity-cleanup.ts, which the daily cleanup of unused identities shares.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region perDelFun

/**
 * perDelFun = Personal Delete Function
 *
 * @summary
 * Deletes what an identity keeps in one group besides its membership: its
 * request for chat history, its shared location, its presence, the history
 * transfer it asked for, and the photos it added, each of which may not
 * exist.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The identity being deleted.
 *
 * @returns A promise that settles once each is gone, with no value.
 *
 * @example
 * ```ts
 * perDelFun('gro1', 'alice') // => Promise<void>
 * ```
 *
*/

const perDelFun = async ( groIdeStr : string, uidValStr : string ) : Promise< void > => { // What: Personal Delete Function. Why: Nothing of the identity's should stay in a group it leaves. How: This deletes each of its documents there.


	const groRefObj = FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: The identity's documents sit under the group. How: This names it.


	await groRefObj.collection( 'historyRequests' ).doc( uidValStr ).delete();                                                    // What: History Request Delete Call. Why: A request for chat history is keyed by its asker. How: This deletes the identity's.
	await groRefObj.collection( 'liveLocations' ).doc( uidValStr ).delete();                                                      // What: Location Delete Call. Why: A shared position is keyed by its member. How: This deletes the identity's.
	await REA_DAT_OBJ.ref( `presence/${ groIdeStr }/${ uidValStr }` ).remove();                                                   // What: Presence Remove Call. Why: Whether the identity is online is kept per group. How: This removes its entry.
	await STO_ADM_OBJ.bucket().file( `groupHistoryTransfers/${ groIdeStr }/${ uidValStr }` ).delete( { ignoreNotFound : true } ); // What: Transfer Delete Call. Why: A history bundle is filed under its asker. How: This deletes the identity's, if there is one.
	await uplDelFun( groIdeStr, uidValStr );                                                                                      // What: Uploads Delete Call. Why: The photos the identity added are theirs to take with them. How: This deletes them, their full photos following.


};

// #endregion perDelFun



// #region ownPasFun

/**
 * ownPasFun = Owner Pass Function
 *
 * @summary
 * Hands a group the identity owns to the member who joined it earliest, in
 * one transaction: the group's owner changes, any standing offer clears, the
 * identity's membership goes and the count falls with it as the one counted,
 * and the group moves from the heir's member map to their owned map and out
 * of the identity's owned map. The group change trigger reads that change as
 * a handover by a departing owner and tells the heir. Nothing happens to a
 * group that's gone or has another owner. Resolves with the group as read
 * when no one else is in it, for the caller to delete, and with null
 * otherwise.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The owner being deleted.
 *
 * @returns A promise that resolves with the group to delete, or null.
 *
 * @example
 * ```ts
 * ownPasFun('gro1', 'alice') // => null
 * ```
 *
*/

const ownPasFun = ( groIdeStr : string, uidValStr : string ) : Promise< DocumentSnapshot | null > => FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Owner Pass Function. Why: The other members keep their group when its owner deletes their data. How: This hands it on in a transaction, or returns it for deletion.


	const groRefObj = FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: Every write starts from the group. How: This names it.
	const groSnaObj = await traValObj.get( groRefObj );           // What: Group Snapshot Object. Why: The owner is checked inside the transaction. How: This reads the group.


	if ( !groSnaObj.exists || groSnaObj.get( 'ownerUid' ) !== uidValStr ) return null; // What: Not Owned Guard. Why: A group already gone or handed on needs nothing. How: This returns null.



	const memQueObj = await traValObj.get( groRefObj.collection( 'members' ).orderBy( 'joinedAt' ) ); // What: Member Query Object. Why: The group passes to whoever joined first. How: This reads the members, earliest first.

	const heiSnaObj = memQueObj.docs.find( ( memSnaObj ) => memSnaObj.id !== uidValStr ); // What: Heir Snapshot Object. Why: The owner can't inherit their own group. How: This takes the earliest member who isn't them.


	if ( heiSnaObj === undefined ) return groSnaObj; // What: Alone Guard. Why: A group with no one else in it has nobody to pass to. How: This returns it for deletion.



	traValObj.update( groRefObj, { // What: Group Update Call. Why: The group changes owner and loses the old one together. How: This names the heir, clears any offer, and lowers the count with the old owner as the one counted.


		countedUid       : uidValStr,                  // What: Counted UID. Why: The count's change belongs to the departing owner. How: This names them.
		memberCount      : FieldValue.increment( -1 ), // What: Member Count. Why: The departing owner no longer counts. How: This lowers it by one.
		ownerUid         : heiSnaObj.id,               // What: Owner UID. Why: The heir owns the group now. How: This names them.
		pendingOfferedAt : null,                       // What: Pending Offered At. Why: An offer made by the departing owner can no longer be answered by them. How: This clears it.
		pendingOwnerUid  : null                        // What: Pending Owner UID. Why: The same offer's member goes with it. How: This clears it.


	} );

	traValObj.delete( groRefObj.collection( 'members' ).doc( uidValStr ) ); // What: Member Delete Call. Why: The departing owner leaves the group. How: This deletes their membership.

	traValObj.update( FIR_DAT_OBJ.doc( `accounts/${ heiSnaObj.id }` ), new FieldPath( 'memberGroups', groIdeStr ), FieldValue.delete(), new FieldPath( 'ownedGroups', groIdeStr ), true ); // What: Heir Account Update. Why: A group sits in one of an account's maps, never both (Section 18). How: This moves it from the heir's member map to their owned map.

	traValObj.update( FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ), new FieldPath( 'ownedGroups', groIdeStr ), FieldValue.delete() ); // What: Owner Account Update. Why: A retry shouldn't hand the group on again. How: This drops it from the departing owner's owned map.



	return null; // What: Passed Return. Why: The group lives on with its heir. How: This returns null.


} );

// #endregion ownPasFun



// #region memLeaFun

/**
 * memLeaFun = Member Leave Function
 *
 * @summary
 * Takes the identity out of a group it belongs to, in one transaction, the
 * way a leave does: its membership deleted and the count lowered with it as
 * the one counted, when the membership is still there, and the group dropped
 * from its member map either way.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The member being deleted.
 *
 * @returns A promise that settles once the leave lands, with no value.
 *
 * @example
 * ```ts
 * memLeaFun('gro2', 'alice') // => Promise<void>
 * ```
 *
*/

const memLeaFun = ( groIdeStr : string, uidValStr : string ) : Promise< void > => FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Member Leave Function. Why: Each group the identity belongs to loses it as a leave would. How: This leaves in a transaction.


	const groRefObj = FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` );        // What: Group Reference Object. Why: The count falls with the membership. How: This names the group.
	const memRefObj = groRefObj.collection( 'members' ).doc( uidValStr ); // What: Member Reference Object. Why: The membership is what ends. How: This names it.
	const memSnaObj = await traValObj.get( memRefObj );                  // What: Member Snapshot Object. Why: A count may only fall for a membership that's there. How: This reads it.


	if ( memSnaObj.exists ) { // What: Membership Block. Why: A membership already gone, such as after a removal, has nothing to count. How: This deletes it and lowers the count only when it's there.


		traValObj.delete( memRefObj ); // What: Member Delete Call. Why: The membership ends. How: This deletes it.

		traValObj.update( groRefObj, { countedUid : uidValStr, memberCount : FieldValue.increment( -1 ) } ); // What: Group Update Call. Why: The count no longer includes the member, who is named as the one counted. How: This lowers it and names them.


	}



	traValObj.update( FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ), new FieldPath( 'memberGroups', groIdeStr ), FieldValue.delete() ); // What: Account Update Call. Why: A retry shouldn't leave the group again. How: This drops it from the member map.


} );

// #endregion memLeaFun



// #region joiDelFun

/**
 * joiDelFun = Join Delete Function
 *
 * @summary
 * Deletes every request the identity has made to join a group, which sits
 * under a group it doesn't belong to, so no account lists it. Firestore can
 * only find a document by its ID through its full path, so this reads the
 * IDs of every join request and deletes the identity's. Requests expire after
 * 7 days, which keeps the list short.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: The identity being deleted.
 *
 * @returns A promise that settles once each request is gone, with no value.
 *
 * @example
 * ```ts
 * joiDelFun('alice') // => Promise<void>
 * ```
 *
*/

const joiDelFun = async ( uidValStr : string ) : Promise< void > => { // What: Join Delete Function. Why: A name and note typed to join a group mustn't outlive the identity. How: This finds and deletes the identity's requests.


	const joiQueObj = await FIR_DAT_OBJ.collectionGroup( 'joinRequests' ).select().get(); // What: Join Query Object. Why: The identity's requests can sit under any group. How: This reads every request's ID, without its fields.



	await Promise.all( joiQueObj.docs.filter( ( joiSnaObj ) => joiSnaObj.id === uidValStr ).map( ( joiSnaObj ) => joiSnaObj.ref.delete() ) ); // What: Request Delete Call. Why: A request is keyed by its joiner. How: This deletes each of the identity's.


};

// #endregion joiDelFun

// #endregion Helpers



// #region Module Init

// #region delDatFun

/**
 * delDatFun = Delete Data Function
 *
 * @summary
 * The callable the app calls with no data when someone confirms deleting
 * their data. It refuses a caller who isn't signed in, then hands on or
 * deletes each group they own, leaves each group they belong to, and deletes
 * their join requests, their account with what's under it, their public
 * key, and their sign-in record, in that order. A sign-in record already
 * gone is no error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqValObj - Request Value Object: The call Firebase passes on, with
 *                    the caller's sign-in.
 *
 * @returns A promise that settles once the identity is deleted, with no
 *          value.
 *
 * @example
 * ```ts
 * httpsCallable(funObj, 'delDatFun')() // => Promise<void>
 * ```
 *
*/

const delDatFun = onCall( CAL_OPT_OBJ, async ( reqValObj ) : Promise< void > => { // What: Delete Data Function. Why: Someone can delete everything of theirs the service keeps (the privacy policy's rights). How: This takes them out of every group, then deletes what's left.


	if ( !reqValObj.auth ) throw new HttpsError( 'unauthenticated', 'Sign in first.' ); // What: Sign-In Guard. Why: Only an identity has data to delete. How: This refuses a caller with no sign-in.



	const uidValStr = reqValObj.auth.uid; // What: UID Value String. Why: Everything deleted is the caller's own. How: This reads their UID.

	const accRefObj = FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ); // What: Account Reference Object. Why: The account lists the identity's groups. How: This names it.
	const accSnaObj = await accRefObj.get();                        // What: Account Snapshot Object. Why: The groups are read once, before any changes. How: This reads the account.


	for ( const groIdeStr of Object.keys( accSnaObj.get( 'ownedGroups' ) ?? {} ) ) { // What: Owned Group Loop. Why: Each group the identity owns passes on or goes. How: This deletes its documents there, then hands the group on or deletes it.


		await perDelFun( groIdeStr, uidValStr ); // What: Personal Delete Call. Why: The identity's documents in the group go first, while the account still lists it. How: This deletes them.


		const delSnaObj = await ownPasFun( groIdeStr, uidValStr ); // What: Delete Snapshot Object. Why: A group with no one else in it is deleted rather than handed on. How: This hands the group on, or returns it.


		if ( delSnaObj ) await groDelRunFun( delSnaObj ); // What: Group Delete Call. Why: A group nobody else is in has nobody to keep it. How: This deletes it whole.


	}



	for ( const groIdeStr of Object.keys( accSnaObj.get( 'memberGroups' ) ?? {} ) ) { // What: Member Group Loop. Why: Each group the identity belongs to loses it. How: This deletes its documents there, then leaves.


		await perDelFun( groIdeStr, uidValStr ); // What: Personal Delete Call. Why: The identity's documents in the group go first, while the account still lists it. How: This deletes them.

		await memLeaFun( groIdeStr, uidValStr ); // What: Leave Call. Why: The membership ends as a leave would. How: This leaves.


	}



	await joiDelFun( uidValStr ); // What: Join Delete Call. Why: A request to join holds a typed name and note. How: This deletes the identity's.

	await ideDelFun( uidValStr ); // What: Identity Delete Call. Why: Once the identity is in no group, what's left of it goes. How: This deletes its account, public key, and sign-in record.


} );

// #endregion delDatFun

// #endregion Module Init



// #region Exports

export { delDatFun }; // What: Named Export. Why: The entry file exports every function Firebase deploys. How: This exports the callable.

// #endregion Exports


