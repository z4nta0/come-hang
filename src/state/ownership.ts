


// #region Imports

import { deleteField     } from 'firebase/firestore';      // What: Delete Field. Why: An accepted group leaves one map in each account. How: This removes the entry.
import { doc             } from 'firebase/firestore';      // What: Doc. Why: Each document an offer touches is named by path. How: This builds a reference.
import { FieldPath       } from 'firebase/firestore';      // What: Field Path. Why: A group's ID is a key in an account's maps. How: This names it without reading it as a dotted path.
import { firGetFun       } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Every step reads or writes through Firebase. How: This returns the services.
import { httpsCallable   } from 'firebase/functions';      // What: HTTPS Callable. Why: A decline goes through a Cloud Function that tells the owner (Section 18). How: This calls it.
import { ideEnsFun       } from './identity.ts';           // What: Identity Ensure Function. Why: An acceptance acts as this identity. How: This reads it.
import { runTransaction  } from 'firebase/firestore';      // What: Run Transaction. Why: An acceptance reads the offer it takes up. How: This runs the reads and writes together.
import { serverTimestamp } from 'firebase/firestore';      // What: Server Timestamp. Why: An offer lapses 7 days after the server's time of it. How: This asks the server to fill it in.
import { updateDoc       } from 'firebase/firestore';      // What: Update Doc. Why: The owner makes and withdraws offers on the group. How: This updates it.


import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: An offer's time comes back as a timestamp. How: This types it.

// #endregion Imports



/**
 * ownership.ts = Ownership
 *
 * @summary
 * Handing a group to another member (ARCHITECTURE.md Section 18). The owner
 * offers the group to a member, which the rules refuse when that member has
 * no free owned slot, and can withdraw the offer. The member offered it
 * accepts within 7 days, in one transaction that makes them the owner,
 * clears the offer, and swaps the group between the two accounts' maps, or
 * declines through the decOffFun Cloud Function, which also tells the owner.
 * An offer the daily run makes to claim an absent owner's group is accepted
 * and declined the same way.
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

const OFF_LIF_NUM = 7 * 86400000; // What: Offer Life Number. Why: An offer lapses 7 days after it's made. How: This is 7 days in milliseconds.

// #endregion Constants



// #region Helpers

// #region offAccFun

/**
 * offAccFun = Offer Accept Function
 *
 * @summary
 * Takes up an offer of a group made to this identity, in one transaction,
 * as the rules require: the group names this identity its owner with the
 * offer cleared, this account moves the group from its member map to its
 * owned map, and the old owner's account moves it the other way, so they
 * stay in the group as a member. Rejects with an Error when no live offer
 * to this identity stands, and the rules refuse one past this identity's
 * owned cap.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group offered.
 *
 * @returns A promise that settles once this identity owns the group, with no
 *          value.
 *
 * @example
 * ```ts
 * offAccFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const offAccFun = async ( groIdeStr : string ) : Promise< void > => { // What: Offer Accept Function. Why: Ownership moves only when the member offered it agrees (Section 18). How: This makes this identity the owner and swaps both accounts' entries in one transaction.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The acceptance makes this identity the owner. How: This reads it.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The acceptance reads and writes Firestore. How: This reads the service.

	const groRefObj = doc( fstDatObj, `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: The offer is on the group. How: This names it.


	await runTransaction( fstDatObj, async ( traValObj ) => { // What: Acceptance Transaction. Why: The offer and the old owner have to be read as they stand when the handover lands. How: This reads the group, then writes every change together, retrying on a conflict.


		const groSnaObj = await traValObj.get( groRefObj );                        // What: Group Snapshot Object. Why: The offer and the old owner come from the group. How: This reads it.
		const offTimObj = groSnaObj.get( 'pendingOfferedAt' ) as Timestamp | null; // What: Offer Time Object. Why: An offer lapses after 7 days. How: This reads when it was made, null with none. // What: Type Assertion Note. Why: The rules store the time as a timestamp or null. How: The as reads it as either.
		const offUidBoo = groSnaObj.get( 'pendingOwnerUid' ) === uidValStr;        // What: Offer UID Boolean. Why: Only the member offered the group takes it up. How: This checks the offer names this identity.
		const oldOwnStr = groSnaObj.get( 'ownerUid' ) as string;                   // What: Old Owner String. Why: The old owner's account changes too. How: This reads who owns the group now. // What: Type Assertion Note. Why: The rules store the owner as a string. How: The as reads it as one.

		const offLivBoo = offTimObj !== null && offTimObj.toMillis() + OFF_LIF_NUM > Date.now(); // What: Offer Live Boolean. Why: A lapsed offer can't be taken up. How: This checks an offer stands and is under 7 days old, the first check guarding the second, so the chain stays inline.


		if ( !offLivBoo || !offUidBoo ) throw new Error( 'No live offer of this group stands to you.' ); // What: Offer Guard. Why: The rules would refuse it. How: This rejects first.



		traValObj.update( groRefObj, { ownerUid : uidValStr, pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Group Update Call. Why: The group changes hands and the offer is used up. How: This names this identity owner and clears the offer.

		traValObj.update( doc( fstDatObj, `accounts/${ uidValStr }` ), new FieldPath( 'memberGroups', groIdeStr ), deleteField(), new FieldPath( 'ownedGroups', groIdeStr ), true ); // What: Own Account Update Call. Why: The group now takes one of this identity's owned slots. How: This moves it from the member map to the owned map.

		traValObj.update( doc( fstDatObj, `accounts/${ oldOwnStr }` ), new FieldPath( 'memberGroups', groIdeStr ), true, new FieldPath( 'ownedGroups', groIdeStr ), deleteField() ); // What: Old Account Update Call. Why: The old owner stays in the group as a member, and may be away (Section 18). How: This moves it from their owned map to their member map.


	} );


};

// #endregion offAccFun



// #region offDecFun

/**
 * offDecFun = Offer Decline Function
 *
 * @summary
 * Declines an offer of a group made to this identity, through the decOffFun
 * Cloud Function, which clears the offer and tells the owner. Rejects with
 * the function's error, coded functions/failed-precondition, when no offer
 * stands to this identity.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group offered.
 *
 * @returns A promise that settles once the offer is declined, with no value.
 *
 * @example
 * ```ts
 * offDecFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const offDecFun = async ( groIdeStr : string ) : Promise< void > => { await httpsCallable( firGetFun().funValObj, 'decOffFun' )( { groupId : groIdeStr } ); }; // What: Offer Decline Function. Why: A decline has to reach the owner as a notice, which only a Cloud Function can write (Section 18). How: This calls decOffFun with the group's ID.

// #endregion offDecFun



// #region offMakFun

/**
 * offMakFun = Offer Make Function
 *
 * @summary
 * Offers a group to one of its members as its owner, stamped with the
 * server's time, replacing any offer already standing. The rules refuse an
 * offer to a member with no free owned slot, which rejects with Firestore's
 * permission-denied.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param tarUidStr - Target UID String: The member offered the group.
 *
 * @returns A promise that settles once the offer stands, with no value.
 *
 * @example
 * ```ts
 * offMakFun('Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const offMakFun = ( groIdeStr : string, tarUidStr : string ) : Promise< void > => updateDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }` ), { // What: Offer Make Function. Why: Nobody is handed a group without agreeing, so the owner offers it first (Section 18). How: This names the member and stamps the time.


	pendingOfferedAt : serverTimestamp(), // What: Pending Offered At. Why: The offer lapses 7 days after the server's time of it. How: This asks the server to fill it in.
	pendingOwnerUid  : tarUidStr          // What: Pending Owner UID. Why: The offer names who may accept. How: This names the member.


} );

// #endregion offMakFun



// #region offWitFun

/**
 * offWitFun = Offer Withdraw Function
 *
 * @summary
 * Withdraws a group's standing offer as its owner by clearing it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that settles once the offer is gone, with no value.
 *
 * @example
 * ```ts
 * offWitFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const offWitFun = ( groIdeStr : string ) : Promise< void > => updateDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }` ), { pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Offer Withdraw Function. Why: The owner can call an offer off at once (Section 18). How: This clears both offer fields.

// #endregion offWitFun

// #endregion Helpers



// #region Exports

export { offAccFun, offDecFun, offMakFun, offWitFun }; // What: Named Exports. Why: The group settings and the offer screen drive a handover through these. How: This exports the functions.

// #endregion Exports


