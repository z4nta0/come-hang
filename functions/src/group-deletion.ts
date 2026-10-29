


// #region Imports

import { calGroFun   } from './calls.ts';                  // What: Call Group Function. Why: The deletion names a group and needs a signed-in caller. How: This checks both.
import { FieldPath   } from 'firebase-admin/firestore';    // What: Field Path. Why: A group's ID becomes a map key in each account. How: This names that key without reading it as a dotted path.
import { FieldValue  } from 'firebase-admin/firestore';    // What: Field Value. Why: The group is dropped from each account's maps. How: This supplies the field delete.
import { FIR_DAT_OBJ } from './setup.ts';                  // What: Firestore Database Object. Why: Most of a group lives in Firestore. How: This reads and deletes it.
import { FUN_OPT_OBJ } from './setup.ts';                  // What: Function Options Object. Why: Every function shares the deploy options. How: The callable takes them.
import { HttpsError  } from 'firebase-functions/v2/https'; // What: HTTPS Error. Why: A refused call tells the app why. How: This throws an error the client receives with its code.
import { notBatFun   } from './notices.ts';                // What: Notice Batch Function. Why: Every other member is told the group was deleted. How: This adds their notice to the first batch.
import { onCall      } from 'firebase-functions/v2/https'; // What: On Call. Why: The owner asks for the deletion from the app. How: This registers a callable function, which checks the caller's sign-in.
import { pusSenFun   } from './push.ts';                   // What: Push Send Function. Why: Every other member hears of the deletion on their phone. How: This sends each push once the first batch has landed.
import { REA_DAT_OBJ } from './setup.ts';                  // What: Realtime Database Object. Why: A group's chat, presence, and mirror live there. How: This deletes them.
import { STO_ADM_OBJ } from './setup.ts';                  // What: Storage Admin Object. Why: A group's history transfers live in Storage. How: This deletes them.


import type { DocumentSnapshot } from 'firebase-admin/firestore'; // What: Document Snapshot. Why: The first batch works from the group as read. How: This types it.

// #endregion Imports



/**
 * group-deletion.ts = Group Deletion
 *
 * @summary
 * The callable function the owner deletes a group through (ARCHITECTURE.md
 * Section 9). A client can't, since no rule allows deleting a group document
 * and a big group's documents wouldn't fit one batch anyway.
 *
 * The first batch deletes every member document, which closes the whole group
 * to every reader at once, since every rule checks membership. The same batch
 * drops the group from every account and leaves each other member a notice,
 * and each gets a push once it lands. The group's other Firestore collections
 * go next, then its chat, presence, and mirror in the Realtime Database and
 * its history transfers in Storage, and the group document goes last. A
 * failure partway leaves the group document, so the owner's retry passes the
 * owner check and finishes the job, and once the group document is gone a call
 * does nothing.
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

// #region firBatFun

/**
 * firBatFun = First Batch Function
 *
 * @summary
 * Writes the deletion's first batch: every member document deleted, the
 * group dropped from the owner's owned map and every other member's member
 * map, a notice left for every other member, and the group's working invite
 * deleted. With the member cap at 50, the batch stays far under Firestore's
 * 500 writes. On a retry the member documents are already gone, so only the
 * owner's account and the invite are written again, which changes nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groSnaObj - Group Snapshot Object: The group being deleted.
 *
 * @returns A promise that resolves with the UIDs of the members left a
 *          notice, once the batch is committed.
 *
 * @example
 * ```ts
 * firBatFun(groSnaObj) // => [ 'bob', 'carol' ]
 * ```
 *
*/

const firBatFun = async ( groSnaObj : DocumentSnapshot ) : Promise< string[] > => { // What: First Batch Function. Why: Members lose access, their accounts let go of the group, and they're told, all at once. How: This builds and commits the batch.


	const batWriObj = FIR_DAT_OBJ.batch();                               // What: Batch Write Object. Why: Every write lands together or not at all. How: This starts the batch.
	const groIdeStr = groSnaObj.id;                                      // What: Group Identifier String. Why: Each write names the group. How: This reads its ID.
	const groNamStr = groSnaObj.get( 'name' ) as string;                 // What: Group Name String. Why: A notice names the deleted group. How: This reads its name. // What: Type Assertion Note. Why: The rules require every group's name to be a string. How: The as reads it as one.
	const memQueObj = await groSnaObj.ref.collection( 'members' ).get(); // What: Member Query Object. Why: Every membership ends. How: This reads the member documents.
	const ownUidStr = groSnaObj.get( 'ownerUid' ) as string;             // What: Owner UID String. Why: The owner gets no notice and owns the group rather than belonging to it. How: This reads the owner. // What: Type Assertion Note. Why: The rules require every group to name its owner. How: The as reads it as a string.


	for ( const memSnaObj of memQueObj.docs ) { // What: Member Loop. Why: Each member's access, account entry, and notice is handled in turn. How: This walks the member documents.


		batWriObj.delete( memSnaObj.ref ); // What: Member Delete Call. Why: The rules give a member nothing once their member document is gone. How: This deletes it.



		if ( memSnaObj.id === ownUidStr ) continue; // What: Owner Skip. Why: The owner's account is handled below, and they need no notice of their own deletion. How: This moves on to the next member.



		batWriObj.update( FIR_DAT_OBJ.doc( `accounts/${ memSnaObj.id }` ), new FieldPath( 'memberGroups', groIdeStr ), FieldValue.delete() ); // What: Member Account Update. Why: A deleted group no longer counts against the member's caps. How: This drops it from their member map.

		notBatFun( batWriObj, memSnaObj.id, 'groupDeleted', groIdeStr, groNamStr ); // What: Deletion Notice Call. Why: The group shouldn't just vanish from their list. How: This leaves them a notice naming it.


	}



	batWriObj.update( FIR_DAT_OBJ.doc( `accounts/${ ownUidStr }` ), new FieldPath( 'ownedGroups', groIdeStr ), FieldValue.delete() ); // What: Owner Account Update. Why: The owner's slot frees up for a new group. How: This drops it from their owned map.

	batWriObj.delete( FIR_DAT_OBJ.doc( `invites/${ groSnaObj.get( 'currentInviteToken' ) }` ) ); // What: Invite Delete Call. Why: A link to a deleted group should open nothing. How: This deletes the working invite, since a rotation already deleted every older one.

	await batWriObj.commit(); // What: Batch Commit Call. Why: The writes land together. How: This commits them.



	return memQueObj.docs.map( ( memSnaObj ) => memSnaObj.id ).filter( ( uidValStr ) => uidValStr !== ownUidStr ); // What: Notified Return. Why: Each member left a notice gets a push too. How: This returns every member's UID but the owner's.


};

// #endregion firBatFun

// #endregion Helpers



// #region Module Init

// #region delGroFun

/**
 * delGroFun = Delete Group Function
 *
 * @summary
 * The callable the app calls with { groupId } when the owner confirms a
 * deletion. It refuses a caller who isn't signed in and a malformed ID,
 * through calGroFun, and anyone but the owner, each with its own error code,
 * and succeeds quietly when the group is already gone, which is also how a
 * finished retry ends.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqValObj - Request Value Object: The call Firebase passes on, with
 *                    the caller's sign-in and the group's ID.
 *
 * @returns A promise that settles once the group is deleted, with no value.
 *
 * @example
 * ```ts
 * httpsCallable(funObj, 'delGroFun')({ groupId : 'gro1' }) // => Promise<void>
 * ```
 *
*/

const delGroFun = onCall( FUN_OPT_OBJ, async ( reqValObj ) : Promise< void > => { // What: Delete Group Function. Why: Only the owner deletes a group, and only a server can delete all of it. How: This checks the caller, then deletes the group in stages.


	const { groIdeStr, uidValStr } = calGroFun( reqValObj ); // What: Call Values. Why: The deletion names a group and its caller. How: This checks and reads both.

	const groRefObj = FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: Every stage starts from the group. How: This names its document.
	const groSnaObj = await groRefObj.get();                      // What: Group Snapshot Object. Why: The owner check reads the group. How: This reads it.


	if ( !groSnaObj.exists ) return; // What: Already Deleted Guard. Why: The group document goes last, so its absence means the deletion finished. How: This ends the call quietly.



	if ( groSnaObj.get( 'ownerUid' ) !== uidValStr ) throw new HttpsError( 'permission-denied', "Only the group's owner can delete it." ); // What: Owner Guard. Why: Deleting a group is the owner's call alone (Section 9). How: This refuses anyone else.



	const notUidArr = await firBatFun( groSnaObj ); // What: Notified UID Array. Why: Members lose access and are told before anything else goes. How: This commits the first batch and keeps who it told.


	await Promise.all( notUidArr.map( ( uidValStr ) => pusSenFun( uidValStr, 'groupDeleted', groSnaObj.get( 'name' ) ) ) ); // What: Deletion Push Call. Why: Each member is told at once too, by the group's name. How: This sends each their push, best effort.


	for ( const colRefObj of await groRefObj.listCollections() ) await FIR_DAT_OBJ.recursiveDelete( colRefObj ); // What: Collection Delete Loop. Why: Events, their items, requests, and locations all go, including any collection added later. How: This deletes each of the group's collections with everything under it.



	await REA_DAT_OBJ.ref().update({ // What: Realtime Delete Call. Why: The group's chat, presence, and mirror go with it. How: This removes all three in one update.


		[ `chats/${ groIdeStr }` ]    : null, // What: Chat Path. Why: The group's chat uses its ID as the conversation ID. How: This removes the chat.
		[ `mirrors/${ groIdeStr }` ]  : null, // What: Mirror Path. Why: The rules' copy of the membership goes too. How: This removes the mirror.
		[ `presence/${ groIdeStr }` ] : null  // What: Presence Path. Why: Nobody is online in a deleted group. How: This removes its presence.


	});

	await STO_ADM_OBJ.bucket().deleteFiles( { prefix : `groupHistoryTransfers/${ groIdeStr }/` } ); // What: Transfer Delete Call. Why: A history bundle mustn't outlive its group. How: This deletes every file under the group's folder.

	await groRefObj.delete(); // What: Group Delete Call. Why: The group document goes last, so a retry can still check the owner. How: This deletes it.


} );

// #endregion delGroFun

// #endregion Module Init



// #region Exports

export { delGroFun }; // What: Named Export. Why: The entry file exports every function Firebase deploys. How: This exports the callable.

// #endregion Exports


