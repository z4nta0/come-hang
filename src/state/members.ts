


// #region Imports

import { Bytes           } from 'firebase/firestore';       // What: Bytes. Why: An encrypted name and its IV are stored as Firestore bytes. How: This wraps and reads raw bytes.
import { collection      } from 'firebase/firestore';       // What: Collection. Why: Members see who else is in the group. How: This names the members collection.
import { decTexFun       } from '../platform/crypto.ts';    // What: Decrypt Text Function. Why: Names are stored encrypted under the group key. How: This decrypts one.
import { deleteField     } from 'firebase/firestore';       // What: Delete Field. Why: An ended membership leaves its account's map. How: This removes the group's entry.
import { doc             } from 'firebase/firestore';       // What: Doc. Why: Each document a change touches is named by path. How: This builds a reference.
import { encTexFun       } from '../platform/crypto.ts';    // What: Encrypt Text Function. Why: A new name is stored encrypted. How: This encrypts it under the group key.
import { FieldPath       } from 'firebase/firestore';       // What: Field Path. Why: A group's ID or a UID is a key in a map. How: This names it without reading it as a dotted path.
import { firGetFun       } from '../platform/firebase.ts';  // What: Firebase Get Function. Why: Every change reads or writes Firestore. How: This returns the services.
import { getDoc          } from 'firebase/firestore';       // What: Get Doc. Why: A leave checks the owner, and activity checks its last mark. How: This reads one document.
import { getDocs         } from 'firebase/firestore';       // What: Get Docs. Why: Members are listed together. How: This reads the collection.
import { ideEnsFun       } from './identity.ts';            // What: Identity Ensure Function. Why: Each change acts as this identity. How: This reads it.
import { increment       } from 'firebase/firestore';       // What: Increment. Why: Leaves at once mustn't overwrite each other's count. How: This lowers the count on the server.
import { keyDelFun       } from '../platform/key-store.ts'; // What: Key Delete Function. Why: A left group's key has no use on the device. How: This deletes it.
import { keyLoaFun       } from './groups.ts';              // What: Key Load Function. Why: Names are read and written with the group key. How: This loads it.
import { perNamFun       } from '../core/text-limits.ts';   // What: Person Name Function. Why: An encrypted name is checked by the app alone. How: This applies the limits.
import { runTransaction  } from 'firebase/firestore';       // What: Run Transaction. Why: A removal reads the group it changes. How: This runs the reads and writes together.
import { serverTimestamp } from 'firebase/firestore';       // What: Server Timestamp. Why: The rules require the server's time on an activity mark and an invite. How: This asks the server to fill it in.
import { texNorFun       } from '../core/text-limits.ts';   // What: Text Normalize Function. Why: A typed name is tidied before it's checked. How: This normalizes it.
import { tokCreFun       } from '../platform/crypto.ts';    // What: Token Create Function. Why: A removal rotates the invite. How: This draws the new token.
import { updateDoc       } from 'firebase/firestore';       // What: Update Doc. Why: A member changes their own name and activity time. How: This updates their membership.
import { writeBatch      } from 'firebase/firestore';       // What: Write Batch. Why: A leave ends the membership, its account entry, and its count together. How: This groups the writes.


import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: Join and activity times come back as timestamps. How: This types them.

// #endregion Imports



/**
 * members.ts = Members
 *
 * @summary
 * A group's members and the changes to a membership (ARCHITECTURE.md
 * Sections 9, 11.3, and 18). Any member lists the members with their names
 * decrypted under the group key. A member renames themselves, marks
 * themselves active at most once a day, which decides when ownership can be
 * claimed from an absent owner, and leaves, ending their membership, its
 * account entry, and its count together and deleting the group's key from
 * the device. The owner removes a member in one transaction that also
 * blocks them and rotates the invite, so the link they had stops working.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: Activity is marked at most once a day. How: This is one day in milliseconds.

// #endregion Constants



// #region Helpers

type MemRecTyp = { joiTimNum : number, namTexStr : string, uidValStr : string }; // What: Member Record Type. Why: The member list shows each person's name and when they joined. How: This types one member as memLisFun lists them.

// #region memLisFun

/**
 * memLisFun = Member List Function
 *
 * @summary
 * Resolves with a group's members, longest-standing first, each with their
 * name decrypted under the group key. A name that's missing or won't
 * decrypt, such as one a member wrote under the wrong key, comes back
 * empty, so one bad name can't hide the rest.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the members.
 *
 * @example
 * ```ts
 * memLisFun('Xk3...') // => [ { namTexStr : 'Alice', ... } ]
 * ```
 *
*/

const memLisFun = async ( groIdeStr : string ) : Promise< MemRecTyp[] > => { // What: Member List Function. Why: Members see who else is in the group, by the names they chose. How: This reads the memberships and decrypts each name.


	const groKeyObj = await keyLoaFun( groIdeStr );                                                          // What: Group Key Object. Why: The names open with the group key. How: This loads it.
	const memSnaObj = await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/members` ) ); // What: Members Snapshot Object. Why: Every membership is in the group's collection. How: This reads it.


	const memRecArr = await Promise.all( memSnaObj.docs.map( async ( memDocObj ) : Promise< MemRecTyp > => { // What: Member Record Array. Why: The list shows each member. How: This reads each membership into a record, decrypting its name.


		const encBytObj = memDocObj.get( 'displayNameEnc' ) as Bytes | undefined; // What: Encrypted Bytes Object. Why: The name is stored encrypted. How: This reads it, undefined when absent. // What: Type Assertion Note. Why: The rules store the name as bytes when it's there. How: The as reads it as bytes or missing.
		const iniBytObj = memDocObj.get( 'iv' ) as Bytes | undefined;             // What: Initialization Bytes Object. Why: The name decrypts with its IV. How: This reads it, undefined when absent. // What: Type Assertion Note. Why: The rules store the IV as bytes beside the name. How: The as reads it as bytes or missing.
		const namTexStr = encBytObj && iniBytObj ? await decTexFun( groKeyObj, encBytObj.toUint8Array() as Uint8Array< ArrayBuffer >, iniBytObj.toUint8Array() as Uint8Array< ArrayBuffer > ).catch( () => '' ) : ''; // What: Name Text String. Why: A missing or unreadable name shows as no name rather than failing the list. How: This decrypts the name when it's there, empty otherwise or on failure. // What: Type Assertion Note. Why: toUint8Array returns an array over a plain buffer. How: The two as read them as such.



		return { // What: Record Return. Why: Each membership becomes one record. How: This returns its fields.


			joiTimNum : ( memDocObj.get( 'joinedAt', { serverTimestamps : 'estimate' } ) as Timestamp ).toMillis(), // What: Joined Time Number. Why: The list orders members by how long they've been in. How: This reads the join time, estimating one the server hasn't confirmed yet. // What: Type Assertion Note. Why: The rules store the time as a timestamp. How: The as reads it as one.
			namTexStr,                                                                                              // What: Name Text String. Why: Members recognize each other by it. How: This holds the decrypted name, empty when there's none.
			uidValStr : memDocObj.id                                                                                // What: UID Value String. Why: Removing a member names them. How: This reads the membership's ID, the member's UID.


		};


	} ) );



	return memRecArr.sort( ( recOneObj, recTwoObj ) => recOneObj.joiTimNum - recTwoObj.joiTimNum ); // What: Members Return. Why: The longest-standing member is listed first. How: This returns the records by join time.


};

// #endregion memLisFun



// #region namSetFun

/**
 * namSetFun = Name Set Function
 *
 * @summary
 * Changes this identity's display name in a group, tidied and checked, then
 * encrypted under the group key with a fresh IV. A name outside its limits
 * rejects with a RangeError before anything is written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param perNamStr - Person Name String: The new name, as typed.
 *
 * @returns A promise that settles once the name is saved, with no value.
 *
 * @example
 * ```ts
 * namSetFun('Xk3...', 'Dana L.') // => Promise<void>
 * ```
 *
*/

const namSetFun = async ( groIdeStr : string, perNamStr : string ) : Promise< void > => { // What: Name Set Function. Why: A display name is per group and the member's own to choose (Section 11.3). How: This checks the name, then saves it encrypted.


	const perNorStr = texNorFun( perNamStr ); // What: Person Normalized String. Why: The name is saved tidied. How: This normalizes it.


	if ( !perNamFun( perNorStr ) ) throw new RangeError( 'The display name is outside its limits.' ); // What: Person Name Guard. Why: The rules can't check an encrypted name. How: This rejects it here.



	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: A member renames only themselves. How: This reads the identity.

	const namEncObj = await encTexFun( await keyLoaFun( groIdeStr ), perNorStr ); // What: Name Encrypted Object. Why: The name is stored encrypted. How: This encrypts it under the group key.


	await updateDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), { // What: Member Update Call. Why: The new name replaces the old one. How: This writes it with its IV.


		displayNameEnc : Bytes.fromUint8Array( namEncObj.cipTexArr ),
		iv             : Bytes.fromUint8Array( namEncObj.iniVecArr )


	} );


};

// #endregion namSetFun



// #region actMarFun

/**
 * actMarFun = Activity Mark Function
 *
 * @summary
 * Marks this identity active in a group, at most once a day, as the app
 * opens. Reads the membership's last mark and, when it's a day old or more,
 * moves it to the server's time. Resolves with whether it wrote.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with true when the mark moved.
 *
 * @example
 * ```ts
 * actMarFun('Xk3...') // => false
 * ```
 *
*/

const actMarFun = async ( groIdeStr : string ) : Promise< boolean > => { // What: Activity Mark Function. Why: An owner away 30 days can have the group claimed from them, so presence has to be recorded, with few writes (Section 18). How: This moves the mark when it's a day old.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: A member marks only themselves. How: This reads the identity.

	const memRefObj = doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` );    // What: Member Reference Object. Why: The mark is in the membership. How: This names it.
	const lasTimNum = ( ( await getDoc( memRefObj ) ).get( 'lastActiveAt' ) as Timestamp ).toMillis(); // What: Last Time Number. Why: A mark less than a day old needs no write. How: This reads the last mark in milliseconds. // What: Type Assertion Note. Why: The rules store the mark as a timestamp. How: The as reads it as one.


	if ( Date.now() - lasTimNum < DAY_MIL_NUM ) return false; // What: Recent Mark Guard. Why: Writes stay at one a day. How: This resolves false without writing.



	await updateDoc( memRefObj, { lastActiveAt : serverTimestamp() } ); // What: Mark Update Call. Why: The rules accept only the server's time. How: This moves the mark to it.



	return true; // What: Marked Return. Why: The caller learns the mark moved. How: This returns true.


};

// #endregion actMarFun



// #region groLeaFun

/**
 * groLeaFun = Group Leave Function
 *
 * @summary
 * Takes this identity out of a group in one batch, as the rules require: its
 * membership deleted, the group dropped from its account's member map, and
 * the group's count lowered with it as the one counted. Then deletes the
 * group's key from the device. The owner can't leave without transferring
 * the group first, so an owner's leave rejects with an Error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that settles once the leave lands, with no value.
 *
 * @example
 * ```ts
 * groLeaFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const groLeaFun = async ( groIdeStr : string ) : Promise< void > => { // What: Group Leave Function. Why: Every member other than the owner can always leave (Section 9). How: This ends the membership, its entry, and its count together, then forgets the key.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: A member leaves as themselves. How: This reads the identity.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The leave writes Firestore. How: This reads the service.

	const groRefObj = doc( fstDatObj, `groups/${ groIdeStr }` );                 // What: Group Reference Object. Why: The count falls with the membership. How: This names the group.
	const groOwnStr = ( await getDoc( groRefObj ) ).get( 'ownerUid' ) as string; // What: Group Owner String. Why: The owner can't leave. How: This reads who owns the group. // What: Type Assertion Note. Why: The rules store the owner as a string. How: The as reads it as one.


	if ( groOwnStr === uidValStr ) throw new Error( 'The owner transfers the group before leaving.' ); // What: Owner Guard. Why: The rules refuse an owner's leave (Section 18). How: This rejects first.



	const batWriObj = writeBatch( fstDatObj ); // What: Batch Write Object. Why: The rules check each write against the others. How: This starts the batch.


	batWriObj.delete( doc( fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) ); // What: Member Delete Call. Why: The membership ends. How: This deletes it.

	batWriObj.update( doc( fstDatObj, `accounts/${ uidValStr }` ), new FieldPath( 'memberGroups', groIdeStr ), deleteField() ); // What: Account Update Call. Why: The slot frees with the membership (Section 18). How: This drops the group from the member map.

	batWriObj.update( groRefObj, { // What: Group Update Call. Why: The count no longer includes this member. How: This lowers it by one and names them as counted.


		countedUid  : uidValStr,      // What: Counted UID. Why: The rules tie the count's change to this membership. How: This names the member leaving.
		memberCount : increment( -1 ) // What: Member Count. Why: One leave uncounts one member, and leaves at once mustn't overwrite each other. How: This lowers the count on the server.


	} );

	await batWriObj.commit(); // What: Batch Commit Call. Why: The leave lands whole or not at all. How: This commits the batch.

	await keyDelFun( `group:${ groIdeStr }` ); // What: Key Delete Call. Why: A left group's key has no use on the device. How: This deletes it.


};

// #endregion groLeaFun



// #region memRemFun

/**
 * memRemFun = Member Remove Function
 *
 * @summary
 * Removes a member as the group's owner, in one transaction, as the rules
 * require: the membership deleted, the group dropped from the member's
 * account, the count lowered with them as the one counted, their UID added
 * to the blocklist, and the invite rotated, with the new invite created
 * under a fresh token and the old one deleted. Resolves with the new token,
 * so the link can be shared again with anyone still on their way in. The
 * owner can't remove themselves, which rejects with an Error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param remUidStr - Removed UID String: The UID of the member to remove.
 *
 * @returns A promise that resolves with the group's new invite token.
 *
 * @example
 * ```ts
 * memRemFun('Xk3...', 'u9F...') // => 'q1W...'
 * ```
 *
*/

const memRemFun = async ( groIdeStr : string, remUidStr : string ) : Promise< string > => { // What: Member Remove Function. Why: The owner can remove anyone else at any time, and the link they had must stop working (Section 9). How: This ends the membership, blocks it, and rotates the invite in one transaction.


	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The removal reads and writes Firestore. How: This reads the service.

	const groRefObj = doc( fstDatObj, `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: The removal reads and changes the group. How: This names it.
	const tokNewStr = tokCreFun();                               // What: Token New String. Why: The old link stops working. How: This draws the new one.


	await runTransaction( fstDatObj, async ( traValObj ) => { // What: Removal Transaction. Why: The count, token, and name have to be read as they stand when the removal lands. How: This reads the group, then writes every change together, retrying on a conflict.


		const groSnaObj = await traValObj.get( groRefObj ); // What: Group Snapshot Object. Why: The count, token, name, and owner come from the group. How: This reads it.


		if ( groSnaObj.get( 'ownerUid' ) === remUidStr ) throw new Error( 'The owner cannot be removed.' ); // What: Owner Guard. Why: The rules refuse removing the owner (Section 18). How: This rejects first.



		traValObj.delete( doc( fstDatObj, `groups/${ groIdeStr }/members/${ remUidStr }` ) ); // What: Member Delete Call. Why: The membership ends. How: This deletes it.

		traValObj.update( doc( fstDatObj, `accounts/${ remUidStr }` ), new FieldPath( 'memberGroups', groIdeStr ), deleteField() ); // What: Account Update Call. Why: The member's slot frees (Section 18). How: This drops the group from their member map.

		traValObj.update( groRefObj, 'countedUid', remUidStr, 'currentInviteToken', tokNewStr, 'memberCount', ( groSnaObj.get( 'memberCount' ) as number ) - 1, new FieldPath( 'removedUids', remUidStr ), true ); // What: Group Update Call. Why: The count drops, the member is blocked, and the group names its new link. How: This sets the fields as pairs, since the blocklist's key is a field path. // What: Type Assertion Note. Why: The rules store the count as an integer. How: The as reads it as a number.

		traValObj.set( doc( fstDatObj, `invites/${ tokNewStr }` ), { // What: Invite Set Call. Why: The group always has a working link. How: This creates the new one.


			createdAt : serverTimestamp(),                // What: Created At. Why: The rules require the server's time. How: This asks the server to fill it in.
			groupId   : groIdeStr,                        // What: Group ID. Why: The link opens this group. How: This names it.
			groupName : groSnaObj.get( 'name' ) as string // What: Group Name. Why: The invite screen shows the group's name. How: This copies it. // What: Type Assertion Note. Why: The rules store the name as a string. How: The as reads it as one.


		} );

		traValObj.delete( doc( fstDatObj, `invites/${ groSnaObj.get( 'currentInviteToken' ) as string }` ) ); // What: Invite Delete Call. Why: The removed member's link has to stop working. How: This deletes the old invite. // What: Type Assertion Note. Why: The rules store the token as a string. How: The as reads it as one.


	} );



	return tokNewStr; // What: Token Return. Why: The owner shares the new link with anyone still on their way in. How: This returns the new token.


};

// #endregion memRemFun

// #endregion Helpers



// #region Exports

export { actMarFun, groLeaFun, memLisFun, type MemRecTyp, memRemFun, namSetFun }; // What: Named Exports. Why: The member screens list, rename, mark, leave, and remove through these. How: This exports the functions and the member record's type.

// #endregion Exports


