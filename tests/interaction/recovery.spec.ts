


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when recovery does what it should. How: This asserts on what each check reads.
import { gooRunFun                 } from '../support/client.ts';         // What: Google Run Function. Why: The member links Google on their first phone. How: This runs the link and fills its popup in.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Recovery needs a member and someone to share the key. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The owner and the member each have a phone. How: This declares a test with a second page.
import { popFilFun                 } from '../support/client.ts';         // What: Popup Fill Function. Why: The new phone signs in through Google's popup. How: This picks the account there.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * recovery.spec.ts = Recovery Spec
 *
 * @summary
 * Checks getting groups back on a new phone as people do it, in whichever
 * engine the project runs, against the Emulator Suite: a member links Google
 * on their first phone, then on a new one a closed sign-in is told, and the
 * next brings the group back, focus landing on it, while its chat waits for
 * the key; the owner opens the request from the sheet of what's waiting and
 * shares the key from the People section, focus moving to the members, and the
 * new phone's open chat loads without a reload.
 *
 * Sections:
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let recEnvObj : RulesTestEnvironment; // What: Recovery Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The test shares one connection to the emulator. How: This connects to Firestore under the demo project.


	recEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The member setup reads through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await recEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj( 'a member gets their groups back on a new phone through Google, and the owner shares the key from People', async ( { browser, page : curPagObj, secPagObj } ) => { // What: Recovery Test. Why: A member who links Google can bring their groups to a new phone, which reads them once a member shares the key (Sections 6 and 8). How: This links the member, closes a first sign-in on a new phone, signs in again, then shares the key as the owner, checking the alert, the status, the focus, and the key note.


	pagTesObj.setTimeout( 90000 ); // What: Timeout Call. Why: The test runs three phones, two sign-ins, and a share. How: This allows a minute and a half.

	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.

	await memSetFun( recEnvObj, curPagObj, secPagObj ); // What: Member Setup Call. Why: The member recovered needs a group and an owner to share its key. How: This creates the group with an owner and a member.


	const emaValStr = `dana-${ crypto.randomUUID() }@example.com`; // What: Email Value String. Why: The Auth emulator keeps each account for the whole run. How: This names a new Google account for the member.


	await gooRunFun( secPagObj, 'gooLinFun', emaValStr ); // What: Link Call. Why: Only a member linked to Google can be recovered. How: This links them on their first phone.


	const newConObj = await browser.newContext( { baseURL : new URL( curPagObj.url() ).origin } ); // What: New Context Object. Why: The new phone starts with no identity of its own. How: This opens a new browser context on the same server.
	const newPagObj = await newConObj.newPage();                                                   // What: New Page Object. Why: The member uses the new phone's page. How: This opens one.

	const recButObj = newPagObj.getByRole( 'button', { name : 'Get my groups back' } ); // What: Recover Button Object. Why: The checks press it twice. How: This finds it.


	await newPagObj.goto( '/' ); // What: New Phone Load Call. Why: The new phone opens at the welcome. How: This opens the app.


	const cloPopPro = newPagObj.waitForEvent( 'popup' ); // What: Closed Popup Promise. Why: The first sign-in is closed. How: This waits for its popup.


	await recButObj.click(); // What: First Recover Click Call. Why: The member starts to sign in. How: This presses the button.

	await ( await cloPopPro ).close(); // What: Popup Close Call. Why: Someone can close the sign-in. How: This closes its popup.

	await expect( newPagObj.getByRole( 'alert' ) ).toHaveText( "The Google sign-in was closed. Try again when you're ready.", { timeout : 15000 } ); // What: Closed Alert Assertion. Why: A closed sign-in says so, once Firebase's polling notices the popup has gone. How: This reads the welcome's alert, allowing 15 seconds.


	const recPopPro = newPagObj.waitForEvent( 'popup' ); // What: Recover Popup Promise. Why: The second sign-in goes through. How: This waits for its popup.


	await recButObj.click(); // What: Second Recover Click Call. Why: The member signs in again. How: This presses the button.

	await popFilFun( await recPopPro, emaValStr ); // What: Popup Fill Call. Why: The member signs in with the linked account. How: This picks it.

	await newPagObj.bringToFront(); // What: Front Call. Why: A browser hands focus back to the app's window once the sign-in closes, which headless Firefox sometimes skips under load (measured 2026-11-01). How: This brings the page to the front, as closing the popup would.

	await expect( newPagObj.getByRole( 'status' ).filter( { hasText : 'Google' } ) ).toHaveText( 'Signed in with Google.' );  // What: Signed In Status Assertion. Why: The sign-in is announced. How: This reads the host's status.
	await expect( newPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeFocused();                       // What: Group Focus Assertion. Why: The group replaces the welcome's button. How: This expects its heading focused.
	await expect( newPagObj.getByText( "This group's key is waiting for a member to share it.", { exact : false } ) ).toBeVisible(); // What: Key Waiting Assertion. Why: The new phone's key pair can't open the old wrap. How: This waits for the chat's note.

	await curPagObj.goto( '/' ); // What: Owner Open Call. Why: The owner shares the key. How: This opens the app on their phone.

	await expect( curPagObj.getByRole( 'dialog', { name : 'While you were away' } ) ).toContainText( "Dana Lee needs Beach Day's key on a new device." ); // What: Waiting Notice Assertion. Why: A key request waits on the owner, so the sheet of what's waiting opens as the app does. How: This waits for the request's sentence.

	await curPagObj.getByRole( 'dialog', { name : 'While you were away' } ).getByRole( 'button', { name : 'Review' } ).click(); // What: Review Click Call. Why: The owner goes straight to the request. How: This presses its Review, which opens the People section at it.

	await expect( curPagObj.getByRole( 'heading', { level : 3, name : "Waiting for the group's key" } ) ).toBeVisible(); // What: Key List Assertion. Why: The owner sees who's waiting. How: This waits for its heading.

	await curPagObj.getByRole( 'button', { name : 'Share the key with Dana Lee' } ).click(); // What: Share Click Call. Why: The owner shares the key. How: This presses the button.

	await expect( curPagObj.getByRole( 'main' ).getByRole( 'status' ) ).toHaveText( 'Shared the key with Dana Lee.' ); // What: Shared Status Assertion. Why: The share is announced. How: This reads the status.
	await expect( curPagObj.getByRole( 'heading', { level : 3, name : /^Members \(\d+\)$/ } ) ).toBeFocused();         // What: Members Focus Assertion. Why: The share's row went with its button, and no one else waits. How: This expects the members' heading focused.

	await expect( newPagObj.getByText( "This group's key is waiting for a member to share it.", { exact : false } ) ).toHaveCount( 0 ); // What: Key Shared Assertion. Why: The shared key opens the chat on the new phone without a reload. How: This waits for the note to go on the page left open.

	await newConObj.close(); // What: Context Close Call. Why: The new phone isn't needed again. How: This closes it.


} );



pagTesObj( "a new device's recovery whose popup the browser blocks goes through Google's page instead, and comes back to the group", async ( { browser, browserName, page : curPagObj, secPagObj } ) => { // What: Redirect Recovery Test. Why: An installed app on a phone can have its sign-in popup blocked, and getting groups back should still work. How: This links a member, then on a new device whose popups fail recovers them through the redirect and checks the group waits for its key.


	pagTesObj.skip( browserName === 'webkit', "The Auth emulator's sign-in page sits on another site, whose stored result WebKit's storage partitioning keeps from the app (measured 2026-11-10); the real site serves that page through its own domain." ); // What: WebKit Skip Call. Why: The redirect's result can't reach the app across sites in WebKit, which only the test setup splits. How: This skips the test there, saying why.



	pagTesObj.setTimeout( 90000 ); // What: Timeout Call. Why: The test runs three devices and two sign-ins. How: This allows a minute and a half.

	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.

	await memSetFun( recEnvObj, curPagObj, secPagObj ); // What: Member Setup Call. Why: The member recovered needs a group. How: This creates the group with an owner and a member.


	const emaValStr = `dana-${ crypto.randomUUID() }@example.com`; // What: Email Value String. Why: The Auth emulator keeps each account for the whole run. How: This names a new Google account for the member.


	await gooRunFun( secPagObj, 'gooLinFun', emaValStr ); // What: Link Call. Why: Only a member linked to Google can be recovered. How: This links them on their first device.


	const newConObj = await browser.newContext( { baseURL : new URL( curPagObj.url() ).origin } ); // What: New Context Object. Why: The new device starts with no identity of its own. How: This opens a new browser context.
	const newPagObj = await newConObj.newPage();                                                   // What: New Page Object. Why: The member uses the new device's page. How: This opens one.


	await newPagObj.addInitScript( () => { window.open = () => null; } ); // What: Popup Block Call. Why: A browser that blocks a popup hands back nothing from window.open. How: This makes every popup on the new device fail that way.

	await newPagObj.goto( '/' ); // What: New Device Load Call. Why: The new device opens at the landing page. How: This opens the app.

	await newPagObj.getByRole( 'button', { name : 'Get my groups back' } ).click(); // What: Recover Click Call. Why: The member starts to sign in. How: This presses the button.

	await newPagObj.waitForURL( /\/emulator\/auth\// ); // What: Redirect Wait. Why: The blocked popup gives way to Google's page in the app's own tab. How: This waits for the Auth emulator's sign-in page.

	await newPagObj.reload(); // What: Page Reload Call. Why: Headless Chromium sometimes leaves the emulator's sign-in page unpainted after the redirect, its buttons never settling (measured 2026-11-10). How: This loads the page again before it's used.

	await popFilFun( newPagObj, emaValStr ); // What: Page Fill Call. Why: The member signs in with the linked account. How: This picks it on the page.

	await expect( newPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible();                                               // What: Group Assertion. Why: The recovered identity's group opens as the app comes back. How: This waits for its heading.
	await expect( newPagObj.getByText( "This group's key is waiting for a member to share it.", { exact : false } ) ).toBeVisible();                // What: Key Waiting Assertion. Why: The new device's key pair was made and published, so the group waits for its key. How: This waits for the chat's note.
	await expect( newPagObj.getByRole( 'status' ).filter( { hasText : 'Google' } ) ).toHaveText( 'Signed in with Google.' );                        // What: Signed In Status Assertion. Why: The finished recovery is announced, as through the popup. How: This reads the host's status.

	await newConObj.close(); // What: Context Close Call. Why: The new device's context isn't the fixture's to close. How: This closes it.


} );

// #endregion Module Init


