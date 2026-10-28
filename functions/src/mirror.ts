


// #region Imports

import { FIR_DAT_OBJ       } from './setup.ts';                        // What: Firestore Database Object. Why: The mirror copies Firestore's membership. How: This reads the documents.
import { FUN_OPT_OBJ       } from './setup.ts';                        // What: Function Options Object. Why: Every function shares the deploy options. How: Each trigger spreads them in.
import { onDocumentWritten } from 'firebase-functions/v2/firestore'; // What: On Document Written. Why: The mirror follows every change to a group or a membership. How: This registers a trigger for creates, updates, and deletes.
import { REA_DAT_OBJ       } from './setup.ts';                        // What: Realtime Database Object. Why: The mirror lives in the Realtime Database. How: This writes it.


import type { Timestamp } from 'firebase-admin/firestore'; // What: Timestamp. Why: A member's join time is a Firestore timestamp. How: This types it.

// #endregion Imports



/**
 * mirror.ts = Membership Mirror
 *
 * @summary
 * Keeps /mirrors/{groupId} in the Realtime Database in step with Firestore,
 * since the Realtime Database's rules can't read Firestore (ARCHITECTURE.md
 * Section 11.7). The mirror holds each member's join time in milliseconds,
 * which the chat read rule compares a query's start with, and the group's
 * chat retention in days, which the chat delete rule reads.
 *
 * Firebase may deliver triggers late, out of order, or more than once, so a
 * trigger never copies the change it was handed. It reads the document's
 * current state, writes that, and reads again, repeating until the two
 * reads agree, so the last write always matches what Firestore holds.
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

// #region synValFun

/**
 * synValFun = Sync Value Function
 *
 * @summary
 * Copies one value from Firestore to a Realtime Database location until the
 * copy is current. It reads the value, writes it (removing the location when
 * the value is null), and reads again, repeating while the value changed in
 * between, so a slower trigger can never leave an older value behind a newer
 * one's.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reaValFun - Read Value Function: Reads the value's current state
 *                    from Firestore, null when it's gone.
 * @param patValStr - Path Value String: The Realtime Database location the
 *                    value is copied to.
 *
 * @returns A promise that settles once the copy is current, with no value.
 *
 * @example
 * ```ts
 * synValFun(reaValFun, 'mirrors/gro1/chatTtlDays') // => Promise<void>
 * ```
 *
*/

const synValFun = async ( reaValFun : () => Promise< number | null >, patValStr : string ) : Promise< void > => { // What: Sync Value Function. Why: A trigger's copy has to end matching Firestore whatever order triggers run in. How: This writes and rechecks until a read confirms the write.


	const mirRefObj = REA_DAT_OBJ.ref( patValStr ); // What: Mirror Reference Object. Why: Every write goes to the one location. How: This names it.

	let nowValNum = await reaValFun(); // What: Now Value Number. Why: The copy starts from Firestore's current state. How: This reads it.

	let wriValNum : number | null; // What: Written Value Number. Why: The recheck compares against what was written. How: This holds it.


	do { // What: Sync Loop. Why: The value may change while it's being copied. How: This writes, rereads, and goes round again until the reread matches.


		wriValNum = nowValNum; // What: Written Value Assignment. Why: The recheck compares against it. How: This records the value about to be written.


		await ( wriValNum === null ? mirRefObj.remove() : mirRefObj.set( wriValNum ) ); // What: Mirror Write. Why: A value that's gone leaves no copy behind. How: This removes the location for null and sets it otherwise.


		nowValNum = await reaValFun(); // What: Recheck Read. Why: Another change may have landed during the write. How: This reads Firestore again.


	}

	while ( nowValNum !== wriValNum ); // What: Sync Loop Condition. Why: A reread that differs from the write means another change landed. How: This goes round again until they match.


};

// #endregion synValFun

// #endregion Helpers



// #region Module Init

// #region mirGroFun

/**
 * mirGroFun = Mirror Group Function
 *
 * @summary
 * A Firestore trigger on every write to a group document. It copies the
 * group's chat retention, chatTtlDays, to the mirror, and removes the copy
 * once the group is deleted.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The write event Firebase sends,
 *                    whose params name the group.
 *
 * @returns A promise that settles once the mirror is current, with no value.
 *
 * @example
 * ```ts
 * mirGroFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const mirGroFun = onDocumentWritten( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}' }, ( eveValObj ) => synValFun( async () => { // What: Mirror Group Function. Why: The chat delete rule reads the group's retention from the mirror. How: This syncs chatTtlDays whenever the group is written.


	const groSnaObj = await FIR_DAT_OBJ.doc( `groups/${ eveValObj.params.groIdeStr }` ).get(); // What: Group Snapshot Object. Why: The copy follows the group's current state. How: This reads the group.



	return groSnaObj.exists ? groSnaObj.get( 'chatTtlDays' ) as number : null; // What: Retention Return. Why: A deleted group leaves no retention. How: This returns the days, or null once the group is gone. // What: Type Assertion Note. Why: The rules only let chatTtlDays be a number. How: The as reads it as one.


}, `mirrors/${ eveValObj.params.groIdeStr }/chatTtlDays` ) ); // What: Retention Path. Why: The rules read the retention here. How: This names the group's mirror entry.

// #endregion mirGroFun



// #region mirMemFun

/**
 * mirMemFun = Mirror Member Function
 *
 * @summary
 * A Firestore trigger on every write to a member document. It copies the
 * member's join time, in milliseconds, to the mirror's member list, and
 * removes it once the membership ends.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The write event Firebase sends,
 *                    whose params name the group and the member.
 *
 * @returns A promise that settles once the mirror is current, with no value.
 *
 * @example
 * ```ts
 * mirMemFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const mirMemFun = onDocumentWritten( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/members/{uidValStr}' }, ( eveValObj ) => synValFun( async () => { // What: Mirror Member Function. Why: The chat and presence rules check membership in the mirror. How: This syncs the member's join time whenever their membership is written.


	const memSnaObj = await FIR_DAT_OBJ.doc( `groups/${ eveValObj.params.groIdeStr }/members/${ eveValObj.params.uidValStr }` ).get(); // What: Member Snapshot Object. Why: The copy follows the membership's current state. How: This reads the member document.



	return memSnaObj.exists ? ( memSnaObj.get( 'joinedAt' ) as Timestamp ).toMillis() : null; // What: Join Time Return. Why: The chat read rule compares a query's start with the join time in milliseconds. How: This returns it, or null once the membership ends. // What: Type Assertion Note. Why: The rules set joinedAt to the server's time, a timestamp. How: The as reads it as one.


}, `mirrors/${ eveValObj.params.groIdeStr }/members/${ eveValObj.params.uidValStr }` ) ); // What: Member Path. Why: The rules look each member up by UID. How: This names the member's mirror entry.

// #endregion mirMemFun

// #endregion Module Init



// #region Exports

export { mirGroFun, mirMemFun }; // What: Named Exports. Why: The entry file exports every function Firebase deploys. How: This exports both triggers.

// #endregion Exports


