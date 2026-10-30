


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The paid flag is seeded on an account. How: This builds its reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when buying behaved as it should. How: This asserts on what the page returns.
import { gooRunFun                 } from '../support/client.ts';         // What: Google Run Function. Why: Buying needs a Google link. How: This links through the popup.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The paid flag is seeded past the rules, as the webhook writes it. How: This connects to the emulator.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The client suite's tests share its setup. How: This declares the test.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs in the page. How: This calls the app's functions there.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The webhook's write is stood in. How: This writes the account.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The seed goes through one. How: This types it.

// #endregion Imports



/**
 * purchase.spec.ts = Purchase Spec
 *
 * @summary
 * Checks buying the upgrade from the app's side in a real browser, in each
 * engine, against the Emulator Suite with the real Cloud Functions. The
 * emulators carry no Polar settings, so a linked identity's checkout is
 * refused as not set up, which still shows the Google link was accepted,
 * while the functions suite checks the checkout itself. The paid flag the
 * webhook writes is seeded past the rules and read back through the app.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const PUR_MOD_STR = '/src/state/purchase.ts'; // What: Purchase Module String. Why: Buying runs there. How: This names its path.

// #endregion Constants



// #region Module State

let purEnvObj : RulesTestEnvironment; // What: Purchase Environment Object. Why: The seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The test seeds through one connection. How: This connects to Firestore under the demo project.


	purEnvObj = await initializeTestEnvironment( { firestore : { host : '127.0.0.1', port : 8200 }, projectId : 'demo-come-hang' } ); // What: Environment Assignment. Why: The seed reaches the emulator through it. How: This connects to Firestore.


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await purEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'buying needs a Google link, and the paid flag the webhook writes reads as paid', async ( { page } ) => { // What: Purchase Test. Why: Paid status rides on a recoverable UID, and the app shows it (Section 18). How: This tries buying unlinked and linked, then seeds the flag, checking each answer.


	const uidValStr = ( await runPagFun( page, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Value String. Why: The flag is seeded on this identity's account. How: This makes sure it exists and reads its UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	expect( await runPagFun( page, PUR_MOD_STR, 'purPaiFun' ) ).toBe( false );                                   // What: Unpaid Check. Why: An identity starts unpaid. How: This expects false.
	expect( await runPagFun( page, PUR_MOD_STR, 'purBuyFun' ) ).toBe( 'error:functions/failed-precondition' );   // What: Unlinked Check. Why: An unrecoverable identity can't buy. How: This expects the checkout refused.
	expect( await gooRunFun( page, 'gooLinFun', `cara-${ crypto.randomUUID() }@example.com` ) ).toBeUndefined(); // What: Link Check. Why: Linking lets the identity buy. How: This expects the link to go through.
	expect( await runPagFun( page, PUR_MOD_STR, 'purBuyFun' ) ).toBe( 'error:functions/unavailable' );           // What: Linked Check. Why: The link is accepted, and the emulators sell nothing without Polar's settings. How: This expects the not-set-up refusal rather than the unlinked one.

	await purEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), `accounts/${ uidValStr }` ), { memberGroups : {}, ownedGroups : {}, paid : true } ) ); // What: Paid Seed Call. Why: The webhook sets the flag past the rules. How: This writes the account paid.


	expect( await runPagFun( page, PUR_MOD_STR, 'purPaiFun' ) ).toBe( true ); // What: Paid Check. Why: The app shows the upgrade bought. How: This expects true.


} );

// #endregion Module Init


