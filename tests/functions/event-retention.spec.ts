


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the trigger leaves what it should. How: This asserts on what each poll reads.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The events' deletion times are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The test writes and reads the emulators past their rules, as the server would. How: This connects to them.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The test seeds documents and changes the group's retention. How: This writes a document.
import { test                      } from '@playwright/test';             // What: Test. Why: The trigger's work is one test. How: This declares it.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Deletion times are Firestore timestamps. How: This builds and reads them.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: A change of retention is an update to the group. How: This changes one field.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The test reads and writes through one. How: This types it.

// #endregion Imports



/**
 * event-retention.spec.ts = Event Retention Trigger Spec
 *
 * @summary
 * Checks the Cloud Function that moves a group's events to its owner's new
 * event retention, end to end in the local Firebase Emulators, which npm run
 * test:functions starts and stops around this suite: an event still to go
 * takes the new deletion time, with its items and photos, while one already
 * past its deletion time is left due. A Firestore write sets off the
 * deployed trigger, and the test polls until Firestore shows its work, or
 * fails once the poll times out.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DAY_MIL_NUM = 86400000;                      // What: Day Milliseconds Number. Why: Retentions are counted in days. How: This is one day in milliseconds.
const EVE_END_NUM = Date.now() + DAY_MIL_NUM;      // What: Event End Number. Why: The live event ends tomorrow, so every retention leaves it still to go. How: This is a day from now.
const OLD_END_NUM = Date.now() - 10 * DAY_MIL_NUM; // What: Old End Number. Why: The due event ended long enough ago that a week's retention has passed. How: This is 10 days ago.

// #endregion Constants



// #region Module State

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: The test reaches the emulators through it. How: This is set before the test.

// #endregion Module State



// #region Helpers

const expGetFun = async ( patValStr : string ) : Promise< number > => { // What: Expire Get Function. Why: Each check reads a document's deletion time. How: This reads it with the rules off, in milliseconds.


	let expMilNum = 0; // What: Expire Milliseconds Number. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { expMilNum = ( ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).get( 'expireAt' ) as Timestamp ).toMillis(); } ); // What: Expire Read Call. Why: The rules hide what's checked. How: This reads the deletion time with them off. // What: Type Assertion Note. Why: Every seeded document carries a timestamp there. How: The as reads it as one.



	return expMilNum; // What: Expire Return. Why: The poll compares it. How: This returns it.


};



const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) );                           // What: Seed Document Function. Why: The test seeds the group and its events. How: This writes a document with the rules off.
const setDayFun = ( dayValNum : number ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'groups/ger1' ), { eventTtlDays : dayValNum } ) ); // What: Set Days Function. Why: Each step changes the group's retention. How: This updates the field with the rules off.

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The test shares one connection to the emulators. How: This connects to Firestore under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The test reaches the emulators through it. How: This connects to the database the trigger fires on.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The trigger fires on a group's changes. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs the triggers for this demo project alone. How: This names it, matching the project test:functions starts.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( "a change of event retention moves each event still to go, with its items and photos, and leaves one already due", async () => { // What: Event Retention Trigger Test. Why: Events planned before the owner's choice carry the old deletion time (Section 23). How: This seeds a live and a due event, shortens and then lengthens the retention, and checks each deletion time.


	const oldExpNum = OLD_END_NUM + 7 * DAY_MIL_NUM;                         // What: Old Expire Number. Why: The due event's deletion time passed 3 days ago. How: This is its end plus a week.
	const weeExpObj = Timestamp.fromMillis( EVE_END_NUM + 7 * DAY_MIL_NUM ); // What: Week Expire Object. Why: The live event starts out kept a week. How: This is its end plus 7 days.


	await seeDocFun( 'groups/ger1', { eventTtlDays : 7, name : 'Retention' } );                                                                  // What: Group Seed. Why: The trigger watches the group. How: This writes it, keeping events a week.
	await seeDocFun( 'groups/ger1/events/eve1', { endAt : Timestamp.fromMillis( EVE_END_NUM ), expireAt : weeExpObj } );                         // What: Live Event Seed. Why: An event still to go moves. How: This writes one ending tomorrow.
	await seeDocFun( 'groups/ger1/events/eve1/assignments/ite1', { expireAt : weeExpObj } );                                                     // What: Item Seed. Why: An item goes with its event. How: This writes one.
	await seeDocFun( 'groups/ger1/events/eve1/photos/pho1', { expireAt : weeExpObj, uploaderUid : 'alice' } );                                   // What: Photo Seed. Why: A photo goes with its event. How: This writes one.
	await seeDocFun( 'groups/ger1/events/eve2', { endAt : Timestamp.fromMillis( OLD_END_NUM ), expireAt : Timestamp.fromMillis( oldExpNum ) } ); // What: Due Event Seed. Why: An event past its deletion time stays due. How: This writes one that ended 10 days ago.

	await setDayFun( 1 ); // What: Shorten Call. Why: The owner keeps ended events a day. How: This sets the retention to 1.

	await expect.poll( () => expGetFun( 'groups/ger1/events/eve1' ) ).toBe( EVE_END_NUM + DAY_MIL_NUM );                  // What: Event Shortened. Why: The live event goes a day after it ends. How: This waits for its end plus a day.
	await expect.poll( () => expGetFun( 'groups/ger1/events/eve1/assignments/ite1' ) ).toBe( EVE_END_NUM + DAY_MIL_NUM ); // What: Item Shortened. Why: The item goes with its event. How: This waits for the same time.
	await expect.poll( () => expGetFun( 'groups/ger1/events/eve1/photos/pho1' ) ).toBe( EVE_END_NUM + DAY_MIL_NUM );      // What: Photo Shortened. Why: The photo goes with its event. How: This waits for the same time.

	await setDayFun( 3 ); // What: Lengthen Call. Why: The owner keeps ended events 3 days. How: This sets the retention to 3.

	await expect.poll( () => expGetFun( 'groups/ger1/events/eve1' ) ).toBe( EVE_END_NUM + 3 * DAY_MIL_NUM );                  // What: Event Lengthened. Why: The live event goes 3 days after it ends. How: This waits for its end plus 3 days.
	await expect.poll( () => expGetFun( 'groups/ger1/events/eve1/assignments/ite1' ) ).toBe( EVE_END_NUM + 3 * DAY_MIL_NUM ); // What: Item Lengthened. Why: The item goes with its event. How: This waits for the same time.

	expect( await expGetFun( 'groups/ger1/events/eve2' ) ).toBe( oldExpNum ); // What: Due Event Kept. Why: A longer retention never brings back an event that was due to go. How: This expects its old deletion time.


} );

// #endregion Module Init


