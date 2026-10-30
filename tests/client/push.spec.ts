


// #region Imports

import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: A token the server dropped is cleared. How: This deletes it.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Tokens are aged and cleared by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages stored. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when notifications behaved as they should. How: This asserts on what the pages and the emulators return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and change tokens past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: The removal push needs a group with a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The removal push needs an owner apart from the member. How: This declares tests with a second page.
import { pusLisFun                 } from '../support/pushes.ts';         // What: Push List Function. Why: The removal push is checked. How: This reads what reached a token.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs in the page. How: This calls the app's functions there.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Expiries are read back, and refreshes aged. How: This builds and reads them.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: A refresh is aged by a day. How: This changes it.


import type { Page                 } from '@playwright/test';             // What: Page. Why: Helpers run in either identity's page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and change goes through one. How: This types it.

// #endregion Imports



/**
 * push.spec.ts = Push Spec
 *
 * @summary
 * Checks the app's side of push notifications in a real browser, in each
 * engine, against the Emulator Suite with the real security rules and Cloud
 * Functions. Development stands in for FCM's token, and the tests stand in
 * for the browser's permission prompt, which no engine lets a script answer
 * alike, then run the app's own push module in the page: turning
 * notifications on and the refresh as the app opens, a refused or
 * unsupported browser, turning them off, a permission withdrawn in the
 * browser, and the push a member gets on removal.
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

const DAY_MIL_NUM = 86400000;             // What: Day Milliseconds Number. Why: Refreshes and expiries are counted in days. How: This is one day in milliseconds.
const PUS_MOD_STR = '/src/state/push.ts'; // What: Push Module String. Why: Notifications are managed there. How: This names its path.

// #endregion Constants



// #region Module State

let pusEnvObj : RulesTestEnvironment; // What: Push Environment Object. Why: Every read and change reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const perSetFun = ( pagValObj : Page, staValStr : string, ansValStr : string ) : Promise< void > => pagValObj.evaluate( ( [ staValStr, ansValStr ] ) => { // What: Permission Set Function. Why: No engine lets a script answer the permission prompt alike, and WebKit ignores a granted one. How: This stands in the permission's state and the prompt's answer, which updates the state.


	let curPerStr = staValStr; // What: Current Permission String. Why: The prompt's answer becomes the state, as a browser's does. How: This holds it.

	Object.defineProperty( Notification, 'permission', { configurable : true, get : () => curPerStr } ); // What: Permission Define Call. Why: The app reads the state there. How: This reports the stand-in.

	Notification.requestPermission = async () => ( curPerStr = ansValStr as NotificationPermission ); // What: Prompt Stand-In. Why: The app asks there. How: This answers, keeping the answer as the state. // What: Type Assertion Note. Why: The answer is one of the permission's values. How: The as reads it as one.


}, [ staValStr, ansValStr ] );



const uidGetFun = async ( pagValObj : Page ) : Promise< string > => ( await runPagFun( pagValObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Get Function. Why: The token lives under the identity's account. How: This reads the page's UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.



const tokReaFun = async ( pagValObj : Page ) : Promise< Record< string, unknown > | undefined > => docReaFun( pusEnvObj, `accounts/${ await uidGetFun( pagValObj ) }/pushToken/current` ); // What: Token Read Function. Why: The tests check what the page stored. How: This reads the identity's token document past the rules.

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	pusEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and change reaches the emulator through it. How: This connects to Firestore, where the tokens are.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The tokens and pushes are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await pusEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: Each test's steps start in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'turning notifications on stores the token, and each open rewrites it only when due, changed, or gone', async ( { page } ) => { // What: Enable And Refresh Test. Why: The server pushes to the stored token, which has to stay fresh with few writes (Section 11.1). How: This turns notifications on, refreshes while fresh, aged, changed, and dropped, and checks each write.


	await perSetFun( page, 'default', 'granted' ); // What: Permission Stand-In Call. Why: The person allows notifications. How: This answers the prompt with granted.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusEnaFun' ) ).toBe( 'granted' ); // What: Enabled Check. Why: The prompt was granted. How: This expects granted.



	const tokDatObj = await tokReaFun( page );                                                         // What: Token Data Object. Why: The stored token is checked. How: This reads it.
	const tokValStr = tokDatObj?.token as string;                                                      // What: Token Value String. Why: Later refreshes compare with it. How: This reads it. // What: Type Assertion Note. Why: The rules store the token as a string. How: The as reads it as one.
	const expOffNum = ( tokDatObj?.expireAt as Timestamp ).toMillis() - Date.now() - 60 * DAY_MIL_NUM; // What: Expire Offset Number. Why: The expiry is 60 days out. How: This measures how far it lands from that. // What: Type Assertion Note. Why: The rules store the expiry as a timestamp. How: The as reads it as one.


	expect( tokValStr ).toMatch( /^emulator-[0-9a-f-]{36}$/ );                 // What: Stand-In Check. Why: Development stores its stand-in token. How: This expects its form.
	expect( Math.abs( expOffNum ) ).toBeLessThan( 60000 );                     // What: Expiry Check. Why: A token lasts 60 days from its refresh. How: This expects the expiry within a minute of that.
	expect( await runPagFun( page, PUS_MOD_STR, 'pusActFun' ) ).toBe( true );  // What: Active Check. Why: Notifications are on. How: This expects the state to say so.
	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( false ); // What: Fresh Refresh Check. Why: A token refreshed just now needs no write. How: This expects none.

	await pusEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), `accounts/${ await uidGetFun( page ) }/pushToken/current` ), { updatedAt : Timestamp.fromMillis( Date.now() - 2 * DAY_MIL_NUM ) } ) ); // What: Age Call. Why: A token refreshed two days ago is due. How: This moves its refresh back.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( true );                                              // What: Due Refresh Check. Why: A day-old refresh is rewritten. How: This expects a write.
	expect( Date.now() - ( ( await tokReaFun( page ) )?.updatedAt as Timestamp ).toMillis() ).toBeLessThan( DAY_MIL_NUM ); // What: Refreshed Time Check. Why: The rewrite moves the refresh to now. How: This expects it within the day. // What: Type Assertion Note. Why: The rules store the refresh as a timestamp. How: The as reads it as one.

	await page.evaluate( () => localStorage.setItem( 'come-hang-dev-push-token', 'emulator-rotated' ) ); // What: Rotation Call. Why: FCM can rotate a token at any time. How: This changes the stand-in.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( true ); // What: Changed Refresh Check. Why: A changed token is written at once. How: This expects a write.
	expect( ( await tokReaFun( page ) )?.token ).toBe( 'emulator-rotated' );  // What: Rotated Token Check. Why: The server pushes to the new token. How: This expects it stored.

	await pusEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => deleteDoc( doc( cotAdmObj.firestore(), `accounts/${ await uidGetFun( page ) }/pushToken/current` ) ) ); // What: Drop Call. Why: The server deletes a token FCM rejects. How: This deletes it.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( true ); // What: Restored Refresh Check. Why: Notifications are still on here, so a dropped token comes back. How: This expects a write.
	expect( ( await tokReaFun( page ) )?.token ).toBe( 'emulator-rotated' );  // What: Restored Token Check. Why: The token is stored again. How: This expects it.


} );



pagTesObj( 'a refused or unsupported browser stores nothing', async ( { page } ) => { // What: Refused Test. Why: Notifications need the person's permission and a browser that can show them. How: This refuses the prompt, then removes the Push API, and checks nothing was stored.


	await perSetFun( page, 'default', 'denied' ); // What: Permission Stand-In Call. Why: The person refuses. How: This answers the prompt with denied.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusEnaFun' ) ).toBe( 'denied' ); // What: Refused Check. Why: The answer reaches the caller. How: This expects denied.
	expect( await tokReaFun( page ) ).toBeUndefined();                            // What: Nothing Stored Check. Why: No permission, no token. How: This expects no document.
	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( false );    // What: Refused Refresh Check. Why: Notifications never came on. How: This expects no write.

	await perSetFun( page, 'default', 'granted' ); // What: Grant Stand-In Call. Why: An unsupported browser is refused before it's asked. How: This answers granted, so only the support check can refuse.

	await page.evaluate( () => Reflect.deleteProperty( window, 'PushManager' ) ); // What: Push API Removal. Why: A browser without the Push API can't receive pushes. How: This removes it.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusEnaFun' ) ).toBe( 'unsupported' ); // What: Unsupported Check. Why: The app says pushes can't work here. How: This expects unsupported.
	expect( await tokReaFun( page ) ).toBeUndefined();                                 // What: Still Nothing Check. Why: An unsupported browser stores nothing. How: This expects no document.


} );



pagTesObj( 'turning notifications off, or withdrawing the permission, deletes the token and keeps it off', async ( { page } ) => { // What: Disable Test. Why: The person decides whether they're notified, here or in the browser's settings (Section 11.1). How: This turns notifications off, then withdraws the permission after turning them on again, and checks the token stays gone.


	await perSetFun( page, 'default', 'granted' ); // What: Permission Stand-In Call. Why: The person allows notifications. How: This answers the prompt with granted.

	await runPagFun( page, PUS_MOD_STR, 'pusEnaFun' ); // What: Enable Call. Why: Notifications start on. How: This turns them on.

	await runPagFun( page, PUS_MOD_STR, 'pusDisFun' ); // What: Disable Call. Why: The person turns them off. How: This turns them off.

	expect( await tokReaFun( page ) ).toBeUndefined();                                                    // What: Deleted Check. Why: The server sends nothing without a token. How: This expects no document.
	expect( await page.evaluate( () => localStorage.getItem( 'come-hang-dev-push-token' ) ) ).toBeNull(); // What: Retired Check. Why: The token itself is retired. How: This expects the stand-in gone.
	expect( await runPagFun( page, PUS_MOD_STR, 'pusActFun' ) ).toBe( false );                            // What: Off Check. Why: Notifications are off. How: This expects the state to say so.
	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( false );                            // What: Off Refresh Check. Why: An open mustn't turn them back on, though the browser still allows them. How: This expects no write.
	expect( await tokReaFun( page ) ).toBeUndefined();                                                    // What: Still Off Check. Why: The token stays gone. How: This expects no document.

	await runPagFun( page, PUS_MOD_STR, 'pusEnaFun' ); // What: Re-Enable Call. Why: The withdrawal starts from notifications on. How: This turns them on again.

	await perSetFun( page, 'denied', 'denied' ); // What: Withdrawal Stand-In Call. Why: The person blocks notifications in the browser's settings. How: This sets the state to denied.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( false ); // What: Withdrawn Refresh Check. Why: Nothing is rewritten for a withdrawn permission. How: This expects no write.
	expect( await tokReaFun( page ) ).toBeUndefined();                         // What: Withdrawn Deleted Check. Why: Pushes the browser won't show aren't sent. How: This expects no document.

	await perSetFun( page, 'granted', 'granted' ); // What: Regrant Stand-In Call. Why: Allowing them again in the browser shouldn't turn them on by itself. How: This sets the state back to granted.

	expect( await runPagFun( page, PUS_MOD_STR, 'pusRefFun' ) ).toBe( false ); // What: Regranted Refresh Check. Why: The withdrawal turned notifications off here. How: This expects no write.
	expect( await tokReaFun( page ) ).toBeUndefined();                         // What: Regranted Off Check. Why: They stay off until turned on. How: This expects no document.


} );



pagTesObj( 'a member with notifications on gets the push when removed', async ( { page, secPagObj } ) => { // What: Removal Push Test. Why: The stored token is what the Cloud Functions push to (Section 11.1). How: This turns the member's notifications on, removes them, and waits for the push to their token.


	const { groIdeStr, uidMemStr } = await memSetFun( pusEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs the group and the member. How: This creates the group and lets the member in.


	await perSetFun( secPagObj, 'default', 'granted' ); // What: Permission Stand-In Call. Why: The member allows notifications. How: This answers the prompt with granted.

	await runPagFun( secPagObj, PUS_MOD_STR, 'pusEnaFun' ); // What: Enable Call. Why: The member turns notifications on. How: This stores their token.


	const tokValStr = ( await tokReaFun( secPagObj ) )?.token as string; // What: Token Value String. Why: The push goes to the member's token. How: This reads it. // What: Type Assertion Note. Why: The rules store the token as a string. How: The as reads it as one.


	await runPagFun( page, '/src/state/members.ts', 'memRemFun', groIdeStr, uidMemStr ); // What: Removal Call. Why: A removal pushes the removed member. How: This removes the member as the owner.

	await expect.poll( () => pusLisFun( pusEnvObj, tokValStr ) ).toEqual( [ { body : 'You were removed from this group.', title : 'Beach Day' } ] ); // What: Removal Push Check. Why: The member's phone is told. How: This waits for the push to their stored token.


} );

// #endregion Module Init


