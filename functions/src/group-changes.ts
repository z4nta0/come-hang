


// #region Imports

import { claRefFun         } from './claims.ts';                     // What: Claim Reference Function. Why: An accepted or abandoned claim offer is told apart by the claim record. How: This names it.
import { FIR_DAT_OBJ       } from './setup.ts';                      // What: Firestore Database Object. Why: The trigger writes notices and clears stale offers. How: This reaches Firestore past its rules.
import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: The trigger spreads them in.
import { notBatFun         } from './notices.ts';                    // What: Notice Batch Function. Why: Each change the trigger spots leaves someone a notice. How: This adds one to the batch.
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'; // What: On Document Updated. Why: Every change the trigger reports is an update to a group. How: This registers an update trigger.
import { pusSenFun         } from './push.ts';                       // What: Push Send Function. Why: Each notice the trigger leaves, and each new offer, reaches the person's phone. How: This sends the push once the notices have landed.


import type { DocumentReference } from 'firebase-admin/firestore'; // What: Document Reference. Why: Clearing an offer works on the group's document. How: This types it.

// #endregion Imports



/**
 * group-changes.ts = Group Changes
 *
 * @summary
 * Watches every update to a group document for the changes someone has to
 * be told about while they're away (ARCHITECTURE.md Sections 9, 11.1, and
 * 18), reading each from the group as it was and as it is:
 *  - A removal, where a UID joins the blocklist as the count falls for that
 *    same UID, leaves the removed member a notice.
 *  - The member offered the group leaving or being removed makes the offer
 *    one nobody can accept, so the trigger clears it, and a leave, which the
 *    owner didn't cause, leaves the owner a notice.
 *  - An acceptance, the only change of owner, leaves the old owner a notice,
 *    of the claim kind when the claim record had offered the new owner the
 *    group, and ends any claim. A claim candidate leaving tells the absent
 *    owner nothing.
 *  - A new offer pushes the member offered the group, with no notice, since
 *    they accept in the app.
 * Each notice goes out as a push too once the notices have landed. A decline
 * comes through offer-decline.ts instead, which tells the owner itself, and
 * the owner's own withdrawal leaves no notice. A retried trigger writes the
 * same notices again, which notices.ts makes harmless, and sends its pushes
 * again, which may reach a phone twice.
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

// #region offCleFun

/**
 * offCleFun = Offer Clear Function
 *
 * @summary
 * Clears a group's standing offer when it's still to the given member, in
 * a transaction, so a newer offer made since is never cleared by mistake.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groRefObj - Group Reference Object: The group's document.
 * @param uidValStr - UID Value String: The member the offer went to.
 *
 * @returns A promise that settles once the offer is cleared or found
 *          changed, with no value.
 *
 * @example
 * ```ts
 * offCleFun(groRefObj, 'bob') // => Promise<void>
 * ```
 *
*/

const offCleFun = ( groRefObj : DocumentReference, uidValStr : string ) : Promise< void > => FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Offer Clear Function. Why: An offer to someone no longer in the group can never be accepted. How: This clears it in a transaction when it still names them.


	const groSnaObj = await traValObj.get( groRefObj ); // What: Group Snapshot Object. Why: The offer may have changed since the trigger fired. How: This reads the group inside the transaction.


	if ( groSnaObj.get( 'pendingOwnerUid' ) === uidValStr ) traValObj.update( groRefObj, { pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Offer Clear Call. Why: Only the stale offer goes. How: This clears both offer fields when the offer still names the member.


} );

// #endregion offCleFun

// #endregion Helpers



// #region Module Init

// #region groChaFun

/**
 * groChaFun = Group Change Function
 *
 * @summary
 * A Firestore trigger on every update to a group document. It compares the
 * group before and after the update, writes the notices the change calls
 * for in one batch, and clears an offer whose member has just left the
 * group.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The update event Firebase sends,
 *                    with the group before and after.
 *
 * @returns A promise that settles once the notices are written, with no
 *          value.
 *
 * @example
 * ```ts
 * groChaFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const groChaFun = onDocumentUpdated( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}' }, async ( eveValObj ) : Promise< void > => { // What: Group Change Function. Why: Removals and the end of an offer must reach people who weren't there. How: This compares the group before and after each update.


	const aftDatObj = eveValObj.data?.after.data();  // What: After Data Object. Why: The group as the update left it. How: This reads the after snapshot.
	const befDatObj = eveValObj.data?.before.data(); // What: Before Data Object. Why: The group as it was. How: This reads the before snapshot.


	if ( !aftDatObj || !befDatObj ) return; // What: Missing Data Guard. Why: An update event always carries both, but its type allows neither. How: This ends the call when either is missing.



	const batWriObj = FIR_DAT_OBJ.batch();            // What: Batch Write Object. Why: The change's notices land together. How: This starts the batch.
	const couUidStr = aftDatObj.countedUid as string; // What: Counted UID String. Why: A leave or removal names its member here. How: This reads it. // What: Type Assertion Note. Why: The rules require every group's countedUid to be a string. How: The as reads it as one.
	const groIdeStr = eveValObj.params.groIdeStr;     // What: Group Identifier String. Why: Each notice names the group. How: This reads its ID.
	const groNamStr = aftDatObj.name as string;       // What: Group Name String. Why: Each notice names the group by its name. How: This reads it. // What: Type Assertion Note. Why: The rules require every group's name to be a string. How: The as reads it as one.

	const couDowBoo = aftDatObj.memberCount < befDatObj.memberCount; // What: Count Down Boolean. Why: Only a leave or a removal lowers the count. How: This compares the counts.

	const offAccBoo = aftDatObj.ownerUid !== befDatObj.ownerUid;                                                     // What: Offer Accepted Boolean. Why: Accepting an offer is the only way a group changes owner (Section 18). How: This compares the owners.
	const offLefBoo = couDowBoo && aftDatObj.pendingOwnerUid === couUidStr;                                          // What: Offer Left Boolean. Why: The member offered the group can leave or be removed while the offer stands. How: This checks the count fell for that member.
	const offMadBoo = aftDatObj.pendingOwnerUid !== null && aftDatObj.pendingOwnerUid !== befDatObj.pendingOwnerUid; // What: Offer Made Boolean. Why: The member offered the group gets a push when it's offered (Section 18). How: This checks the offer now names someone it didn't before.
	const remNewBoo = couDowBoo && aftDatObj.removedUids?.[ couUidStr ] === true;                                    // What: Removed New Boolean. Why: Only a removal lowers the count for a UID it blocks, since a blocked joiner was never counted. How: This checks the count fell for a UID now on the blocklist.

	const claSnaObj = offAccBoo || offLefBoo || offMadBoo ? await claRefFun( groIdeStr ).get() : null; // What: Claim Snapshot Object. Why: An acceptance, a leave by the member offered the group, and a new offer each depend on whether the offer is a claim. How: This reads the claim record for those alone.
	const claOffStr = claSnaObj?.get( 'offeredUid' ) as string | null | undefined;                     // What: Claim Offered String. Why: The claim record names who a claim offer went to. How: This reads it, missing when there's no record. // What: Type Assertion Note. Why: Only the daily run writes the record's offeredUid, as a UID or null. How: The as reads it as either, or missing.

	const pusQueArr : [ string, string ][] = []; // What: Push Queue Array. Why: Pushes go out only once the notices have landed. How: This collects each push's UID and kind.



	if ( offAccBoo ) { // What: Acceptance Block. Why: A new owner ends any claim, and a claimed group is reported as a claim. How: This leaves the old owner the right notice and push, and deletes the claim record.


		const accKinStr = claOffStr === aftDatObj.ownerUid ? 'ownershipClaimed' : 'offerAccepted'; // What: Accepted Kind String. Why: The old owner learns the handover finished, or that their group was claimed while they were away (Section 18). How: This picks the claim kind when the claim record offered the new owner the group.


		notBatFun( batWriObj, befDatObj.ownerUid, accKinStr, groIdeStr, groNamStr, aftDatObj.ownerUid ); // What: Accepted Notice Call. Why: The old owner is told when they're next in the app. How: This leaves them a notice naming the new owner.

		pusQueArr.push( [ befDatObj.ownerUid, accKinStr ] ); // What: Accepted Push Queue. Why: The old owner is told at once too. How: This queues their push.

		batWriObj.delete( claRefFun( groIdeStr ) ); // What: Claim Delete Call. Why: The group has an owner again, so any claim is over. How: This deletes the record, which does nothing when there's none.


	}



	if ( offLefBoo && !remNewBoo && claOffStr !== couUidStr ) { // What: Offer Left Block. Why: The owner didn't cause a leave, so they learn their offer ended, unless it was a claim offer they never made. How: This leaves the owner a notice and a push.


		notBatFun( batWriObj, aftDatObj.ownerUid, 'offerLeft', groIdeStr, groNamStr, couUidStr ); // What: Offer Left Notice Call. Why: The owner is told when they're next in the app. How: This leaves them a notice naming who left.

		pusQueArr.push( [ aftDatObj.ownerUid, 'offerLeft' ] ); // What: Offer Left Push Queue. Why: The owner is told at once too. How: This queues their push.


	}



	if ( offMadBoo ) pusQueArr.push( [ aftDatObj.pendingOwnerUid, claOffStr === aftDatObj.pendingOwnerUid ? 'claimMade' : 'offerMade' ] ); // What: Offer Push Queue. Why: The member offered the group learns of it, with no notice, since accepting happens in the app. How: This queues their push, of the claim kind when the claim record names them.



	if ( remNewBoo ) { // What: Removal Block. Why: The group shouldn't just vanish from the removed member's list (Section 9). How: This leaves them a notice and a push.


		notBatFun( batWriObj, couUidStr, 'removed', groIdeStr, groNamStr ); // What: Removal Notice Call. Why: The removed member is told when they're next in the app. How: This leaves them a notice.

		pusQueArr.push( [ couUidStr, 'removed' ] ); // What: Removal Push Queue. Why: The removed member is told at once too. How: This queues their push.


	}



	await batWriObj.commit(); // What: Batch Commit Call. Why: The notices land together. How: This commits them, which does nothing for an update that called for none.

	await Promise.all( pusQueArr.map( ( [ uidValStr, kinValStr ] ) => pusSenFun( uidValStr, kinValStr, groNamStr ) ) ); // What: Push Send Call. Why: Each person told is reached on their phone too. How: This sends every queued push, each one best effort.



	if ( offLefBoo ) await offCleFun( eveValObj.data!.after.ref, couUidStr ); // What: Stale Offer Clear. Why: An offer to someone no longer in the group could never be accepted. How: This clears it. // What: Non-Null Note. Why: The guard above ended the call when the snapshots were missing. How: The ! says the event's data is here.


} );

// #endregion groChaFun

// #endregion Module Init



// #region Exports

export { groChaFun }; // What: Named Export. Why: The entry file exports every function Firebase deploys. How: This exports the trigger.

// #endregion Exports


