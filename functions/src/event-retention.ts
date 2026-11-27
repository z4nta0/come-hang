


// #region Imports

import { FIR_DAT_OBJ       } from './setup.ts';                      // What: Firestore Database Object. Why: A group's events and their items live in Firestore. How: This reads and rewrites them.
import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: The trigger spreads them in.
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'; // What: On Document Updated. Why: The owner's choice is a change to the group. How: This registers an update trigger.
import { Timestamp         } from 'firebase-admin/firestore';        // What: Timestamp. Why: An event's deletion time is a Firestore timestamp. How: This builds the new one.

// #endregion Imports



/**
 * event-retention.ts = Event Retention
 *
 * @summary
 * Keeps a group's events in step with how long its owner chose to keep them
 * once they end (ARCHITECTURE.md Section 23). When a change to the group
 * moves its event retention, each of its events gets a deletion time that
 * many days after its end, with every item of the event moved in the same
 * batch, and its photos follow through photos.ts. An event already past its
 * deletion time is left alone, so a longer choice never brings back one
 * that was due to go.
 *
 * Firebase may deliver triggers late, out of order, or more than once, so
 * the trigger reads the group's choice as it stands when it runs rather
 * than the change it was handed, and doing its work twice changes nothing.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: The retention is counted in days. How: This is one day in milliseconds.
const EVE_DEF_NUM = 7;        // What: Event Default Number. Why: A group that never chose keeps its ended events a week, as the rules read it. How: This is the fallback.

// #endregion Constants



// #region Module Init

// #region eveRetFun

/**
 * eveRetFun = Event Retention Function
 *
 * @summary
 * A Firestore trigger on every change to a group. When the change moves the
 * group's event retention, it rewrites the deletion time of each event not
 * yet past it, and of that event's items, to the group's current choice of
 * days after the event's end. Any other change returns at once.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groValObj - Group Value Object: The change event Firebase sends,
 *                    whose params name the group.
 *
 * @returns A promise that settles once the events match, with no value.
 *
 * @example
 * ```ts
 * eveRetFun(groValObj) // => Promise<void>
 * ```
 *
*/

const eveRetFun = onDocumentUpdated( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}' }, async ( groValObj ) => { // What: Event Retention Function. Why: Events written before the owner's choice still carry the old deletion time. How: This moves each one to the new choice.


	const aftDayNum = ( groValObj.data?.after.get( 'eventTtlDays' ) as number | undefined ) ?? EVE_DEF_NUM;  // What: After Days Number. Why: Only a change of retention moves anything. How: This reads the choice the change left. // What: Type Assertion Note. Why: The rules allow only 1, 3, or 7 there. How: This reads it as a number or nothing.
	const befDayNum = ( groValObj.data?.before.get( 'eventTtlDays' ) as number | undefined ) ?? EVE_DEF_NUM; // What: Before Days Number. Why: Only a change of retention moves anything. How: This reads the choice before the change. // What: Type Assertion Note. Why: The rules allow only 1, 3, or 7 there. How: This reads it as a number or nothing.


	if ( aftDayNum === befDayNum ) return; // What: Unchanged Guard. Why: A rename or a count change leaves every event as it was. How: This returns.



	const groRefObj = FIR_DAT_OBJ.doc( `groups/${ groValObj.params.groIdeStr }` ); // What: Group Reference Object. Why: The events follow the group as it stands now, not as the change left it. How: This names the group.
	const groSnaObj = await groRefObj.get();                                       // What: Group Snapshot Object. Why: A later change may have landed since. How: This reads the group's current state.


	if ( !groSnaObj.exists ) return; // What: Gone Guard. Why: A deleted group's events are deleted, not moved. How: This returns.



	const eveDayNum = ( groSnaObj.get( 'eventTtlDays' ) as number | undefined ) ?? EVE_DEF_NUM; // What: Event Days Number. Why: Every event takes the group's current choice. How: This reads it. // What: Type Assertion Note. Why: The rules allow only 1, 3, or 7 there. How: This reads it as a number or nothing.
	const eveSnaObj = await groRefObj.collection( 'events' ).get();                             // What: Events Snapshot Object. Why: Every event of the group is checked. How: This reads them.
	const nowMilNum = Date.now();                                                               // What: Now Milliseconds Number. Why: An event already past its deletion time stays due. How: Each event's deletion time is compared with it.


	for ( const eveDocObj of eveSnaObj.docs ) { // What: Event Loop. Why: Each event moves on its own, with its items. How: This checks each.


		const endAtsObj = eveDocObj.get( 'endAt' ) as Timestamp;    // What: End At Timestamp Object. Why: The deletion time counts from the end. How: This reads it. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
		const expOldObj = eveDocObj.get( 'expireAt' ) as Timestamp; // What: Expire Old Object. Why: An event already due, or already right, is left alone. How: This reads its deletion time. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.

		const expNewObj = Timestamp.fromMillis( endAtsObj.toMillis() + eveDayNum * DAY_MIL_NUM ); // What: Expire New Object. Why: The event goes the chosen number of days after it ends. How: This counts them from its end.


		if ( expOldObj.toMillis() <= nowMilNum || expOldObj.isEqual( expNewObj ) ) continue; // What: Settled Guard. Why: An event due to go stays due, and one already moved needs nothing. How: This skips it.



		const iteSnaObj = await eveDocObj.ref.collection( 'assignments' ).get(); // What: Items Snapshot Object. Why: Each item's deletion time follows its event's. How: This reads them.
		const batWriObj = FIR_DAT_OBJ.batch();                                   // What: Batch Write Object. Why: The rules check an item against its event, so the two move together. How: This starts the batch.


		batWriObj.update( eveDocObj.ref, { expireAt : expNewObj } ); // What: Event Update Call. Why: The event takes its new deletion time. How: This adds it to the batch.


		for ( const iteDocObj of iteSnaObj.docs ) batWriObj.update( iteDocObj.ref, { expireAt : expNewObj } ); // What: Item Update Loop. Why: Each item goes with its event. How: This adds each to the batch.



		await batWriObj.commit(); // What: Batch Commit Call. Why: The event and its items land together. How: This writes the batch.


	}


} );

// #endregion eveRetFun

// #endregion Module Init



// #region Exports

export { eveRetFun }; // What: Named Export. Why: The entry deploys the trigger. How: This exports eveRetFun.

// #endregion Exports


