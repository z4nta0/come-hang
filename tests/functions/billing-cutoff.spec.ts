


// #region Imports

import { bilCutFun                 } from '../../functions/src/billing-cutoff.ts'; // What: Billing Cutoff Function. Why: The emulator has no Pub/Sub, so the tests deliver the budget's messages themselves. How: This is the deployed trigger, called with each message.
import { collection                } from 'firebase/firestore';                    // What: Collection. Why: The recorded cutoffs are listed. How: This names their collection.
import { expect                    } from '@playwright/test';                      // What: Expect. Why: Each check passes only when the trigger cuts off or holds back as it should. How: This asserts on what each check reads.
import { getDocs                   } from 'firebase/firestore';                    // What: Get Docs. Why: The recorded cutoffs are read back. How: This reads the collection.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';          // What: Initialize Test Environment. Why: The tests read the recorded cutoffs past the rules. How: This connects to the emulator.
import { test                      } from '@playwright/test';                      // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read goes through one. How: This types it.

// #endregion Imports



/**
 * billing-cutoff.spec.ts = Billing Cutoff Spec
 *
 * @summary
 * Checks the billing cutoff against the local Firebase Emulators, which npm
 * run test:functions starts and stops around this suite. The emulators have
 * no Pub/Sub, so each test calls the trigger in its own process with a
 * budget notification shaped like Cloud Billing's, and the trigger, seeing
 * the Functions emulator's flag, records a cutoff in emulatorBillingCutoffs
 * rather than reaching Cloud Billing. The real unlinking is tried on the
 * staging project (ARCHITECTURE.md Section 15).
 *
 * Sections:
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const cutLisFun = async () : Promise< Record< string, unknown >[] > => { // What: Cutoff List Function. Why: Each test checks which cutoffs were made. How: This reads the recorded cutoffs with the rules off.


	let cutLisArr : Record< string, unknown >[] = []; // What: Cutoff List Array. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { cutLisArr = ( await getDocs( collection( cotAdmObj.firestore(), 'emulatorBillingCutoffs' ) ) ).docs.map( ( cutSnaObj ) => cutSnaObj.data() ); } ); // What: Cutoff Read Call. Why: No rule opens the collection. How: This reads it with the rules off.



	return cutLisArr; // What: Cutoffs Return. Why: The test compares them. How: This returns them.


};



const pubMesFun = ( datValObj : Record< string, unknown > ) => bilCutFun( { data : { message : { data : Buffer.from( JSON.stringify( datValObj ) ).toString( 'base64' ), messageId : '1', publishTime : new Date().toISOString() }, subscription : 'test' }, id : '1', source : '//pubsub.googleapis.com/projects/demo-come-hang/topics/billing-cutoff', specversion : '1.0', time : new Date().toISOString(), type : 'google.cloud.pubsub.topic.v1.messagePublished' } as unknown as Parameters< typeof bilCutFun >[ 0 ] ); // What: Publish Message Function. Why: Each test delivers a budget notification as Pub/Sub would. How: This calls the trigger with the notification encoded as a message, settling once it's handled. // What: Type Assertion Note. Why: The event carries every field the trigger reads, but not the full CloudEvent type's optional extras. How: The as reads it as the trigger's event.

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read reaches the emulator through it. How: This connects to Firestore, where the cutoffs are recorded.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The recorded cutoffs live there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it, matching the project test:functions starts.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test counts its own cutoffs. How: This clears Firestore.


	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's cutoffs. How: This clears them.


} );



test( 'spending past the budget cuts billing off, naming the project and the amounts', async () => { // What: Cutoff Test. Why: Blaze has no cap, so spending past the budget has to stop (Section 15). How: This delivers a notification over budget and checks the recorded cutoff.


	await pubMesFun( { alertThresholdExceeded : 1, budgetAmount : 10, budgetDisplayName : 'Staging', costAmount : 10.01, currencyCode : 'USD' } ); // What: Over Budget Call. Why: A cent past the budget is past it. How: This delivers a notification for 10.01 against 10.

	expect( await cutLisFun() ).toEqual( [ { budgetAmount : 10, costAmount : 10.01, projectId : 'demo-come-hang' } ] ); // What: Cutoff Assertion. Why: The cutoff names its project and why. How: This expects the one record.


} );



test( 'spending at or under the budget, or a malformed notification, leaves billing alone', async () => { // What: Hold Back Test. Why: A cutoff takes the whole app down, so only spending past the budget may cause one. How: This delivers notifications under, at, and missing their amounts, and checks that none cuts billing off.


	await pubMesFun( { budgetAmount : 10, costAmount : 4.5 } );   // What: Under Budget Call. Why: Spending under the budget is normal. How: This delivers 4.5 against 10.
	await pubMesFun( { budgetAmount : 10, costAmount : 10 } );    // What: At Budget Call. Why: Reaching the budget isn't passing it. How: This delivers 10 against 10.
	await pubMesFun( { budgetAmount : 10 } );                     // What: No Cost Call. Why: A notification without its cost can't justify a cutoff. How: This delivers one missing costAmount.
	await pubMesFun( { budgetAmount : '10', costAmount : '20' } ); // What: Text Amounts Call. Why: Only numbers are compared. How: This delivers both amounts as text.

	expect( await cutLisFun() ).toEqual( [] ); // What: No Cutoff Assertion. Why: None of these passed the budget. How: This expects no records.


} );

// #endregion Module Init


