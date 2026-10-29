


// #region Imports

import { calGroFun   } from './calls.ts';                  // What: Call Group Function. Why: The decline names a group and needs a signed-in caller. How: This checks both.
import { claRefFun   } from './claims.ts';                 // What: Claim Reference Function. Why: Declining a claim offer is recorded as a pass. How: This names the claim record.
import { FieldPath   } from 'firebase-admin/firestore';    // What: Field Path. Why: A UID becomes a key in the claim record's passed map. How: This names that key without reading it as a dotted path.
import { FIR_DAT_OBJ } from './setup.ts';                  // What: Firestore Database Object. Why: The offer and the notice live in Firestore. How: This reaches it past the rules.
import { FUN_OPT_OBJ } from './setup.ts';                  // What: Function Options Object. Why: Every function shares the deploy options. How: The callable takes them.
import { HttpsError  } from 'firebase-functions/v2/https'; // What: HTTPS Error. Why: A refused call tells the app why. How: This throws an error the client receives with its code.
import { notBatFun   } from './notices.ts';                // What: Notice Batch Function. Why: The owner is told of the decline. How: This adds their notice to a batch.
import { onCall      } from 'firebase-functions/v2/https'; // What: On Call. Why: The member offered the group declines from the app. How: This registers a callable function, which checks the caller's sign-in.
import { pusSenFun   } from './push.ts';                   // What: Push Send Function. Why: The owner hears of the decline on their phone. How: This sends the push once the notice has landed.

// #endregion Imports



/**
 * offer-decline.ts = Offer Decline
 *
 * @summary
 * The callable the member offered a group declines through (ARCHITECTURE.md
 * Section 18). A decline and the owner's withdrawal clear the same fields,
 * and a Firestore trigger learns who wrote a change only in production,
 * never in the emulator, so a decline told apart that way could never be
 * tested. So the rules let only the owner end an offer from the app, and a
 * decline comes here, where the server knows the caller: it clears the offer
 * in a transaction, then leaves the owner a notice naming who declined, and
 * a push. A
 * claim offer, made by the daily run for an absent owner, is recorded in its
 * claim record as passed instead, and tells nobody.
 *
 * Sections:
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module Init

// #region decOffFun

/**
 * decOffFun = Decline Offer Function
 *
 * @summary
 * The callable the app calls with { groupId } when the member offered the
 * group turns it down. It refuses a caller with no sign-in and a malformed
 * ID, and refuses as a failed precondition anyone the group isn't offered
 * to, including when the group is gone or the offer already ended.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqValObj - Request Value Object: The call Firebase passes on, with
 *                    the caller's sign-in and the group's ID.
 *
 * @returns A promise that settles once the offer is cleared and the owner
 *          told, with no value.
 *
 * @example
 * ```ts
 * httpsCallable(funObj, 'decOffFun')({ groupId : 'gro1' }) // => Promise<void>
 * ```
 *
*/

const decOffFun = onCall( FUN_OPT_OBJ, async ( reqValObj ) : Promise< void > => { // What: Decline Offer Function. Why: Only the member offered the group declines it, and the owner has to learn of it. How: This clears the offer as that member, then writes the owner's notice.


	const { groIdeStr, uidValStr } = calGroFun( reqValObj ); // What: Call Values. Why: The decline names a group and its caller. How: This checks and reads both.

	const groRefObj = FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: The offer lives on the group. How: This names its document.


	const notSnaObj = await FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Notice Snapshot Object. Why: The offer may change while the decline runs, so it's checked and cleared together. How: This runs both in a transaction and returns the group when its owner needs telling, null otherwise.


		const claSnaObj = await traValObj.get( claRefFun( groIdeStr ) ); // What: Claim Snapshot Object. Why: A claim offer is declined differently. How: This reads the group's claim record inside the transaction.
		const curSnaObj = await traValObj.get( groRefObj );              // What: Current Snapshot Object. Why: Only a standing offer to the caller can be declined. How: This reads the group inside the transaction.


		if ( curSnaObj.get( 'pendingOwnerUid' ) !== uidValStr ) throw new HttpsError( 'failed-precondition', 'No offer of this group stands to you.' ); // What: Offer Guard. Why: Nobody declines an offer made to someone else, or one already ended. How: This refuses unless the offer names the caller.



		traValObj.update( groRefObj, { pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Offer Clear Call. Why: A declined offer is used up. How: This clears both offer fields.



		if ( claSnaObj.get( 'offeredUid' ) !== uidValStr ) return curSnaObj; // What: Owner Offer Return. Why: The owner made this offer, so they're told it was declined. How: This returns the group for the notice.



		traValObj.update( claSnaObj.ref, new FieldPath( 'passedUids', uidValStr ), true, 'offeredUid', null ); // What: Claim Pass Call. Why: Declining a claim offer passes on it, so the next run asks someone else (Section 18). How: This records the pass and clears the record's offer.



		return null; // What: Claim Decline Return. Why: The absent owner is told nothing of a declined claim offer. How: This asks for no notice.


	} );


	if ( !notSnaObj ) return; // What: No Notice Guard. Why: A declined claim offer tells nobody. How: This ends the call.



	const batWriObj = FIR_DAT_OBJ.batch(); // What: Batch Write Object. Why: The notice is written once the decline has landed. How: This starts a batch.


	notBatFun( batWriObj, notSnaObj.get( 'ownerUid' ), 'offerDeclined', groIdeStr, notSnaObj.get( 'name' ), uidValStr ); // What: Declined Notice Call. Why: The owner learns to pick someone else (Section 18). How: This leaves them a notice naming who declined.

	await batWriObj.commit(); // What: Batch Commit Call. Why: The notice has to land. How: This commits it.

	await pusSenFun( notSnaObj.get( 'ownerUid' ), 'offerDeclined', notSnaObj.get( 'name' ) ); // What: Declined Push Call. Why: The owner is told at once too. How: This sends their push, best effort.


} );

// #endregion decOffFun

// #endregion Module Init



// #region Exports

export { decOffFun }; // What: Named Export. Why: The entry file exports every function Firebase deploys. How: This exports the callable.

// #endregion Exports


