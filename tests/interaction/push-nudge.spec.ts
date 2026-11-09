


// #region Imports

import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when the card shows, goes, and announces as it should. How: This asserts on what each check reads.
import { runPagFun } from '../support/client.ts'; // What: Run Page Function. Why: The chat needs a group, made the way the app makes one. How: This calls the app's function in the page.
import { test      } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helper drives a page. How: This types it.

// #endregion Imports



/**
 * push-nudge.spec.ts = Notifications Card Spec
 *
 * @summary
 * Checks the card above the chat that offers to turn notifications on, in
 * whichever engine the project runs, against the Emulator Suite: it stays
 * visit after visit until it's answered, "Not now" puts it away for good,
 * and turning notifications on asks the browser, announces its answer, and
 * puts the card away. No engine lets a script answer the permission prompt
 * alike, so the browser's permission and prompt are stood in for.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region nudOpeFun

/**
 * nudOpeFun = Nudge Open Function
 *
 * @summary
 * Stands in for the browser's notification permission, unanswered, with a
 * prompt that answers whatever the test has set, denied by default, then
 * creates a group and opens its chat, where the card shows.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open.
 *
 * @returns A promise that settles once the chat has loaded, with no value.
 *
 * @example
 * ```ts
 * nudOpeFun(page) // => Promise<void>
 * ```
 *
*/

const nudOpeFun = async ( curPagObj : Page ) : Promise< void > => { // What: Nudge Open Function. Why: Every test starts from a chat on a device that hasn't answered the card. How: This stands in for the permission, then creates and opens a group.


	await curPagObj.addInitScript( () => { // What: Permission Stand-In Call. Why: No engine lets a script answer the permission prompt alike. How: This stands in the permission's state and a prompt that answers with whatever the test has set, denied by default.


		let curPerStr = 'default'; // What: Current Permission String. Why: The prompt's answer becomes the state, as a browser's does. How: This holds it.


		Object.defineProperty( Notification, 'permission', { configurable : true, get : () => curPerStr } ); // What: Permission Define Call. Why: The app reads the state there. How: This reports the stand-in.

		Notification.requestPermission = async () => ( curPerStr = ( Reflect.get( window, 'ansValStr' ) ?? 'denied' ) as NotificationPermission ); // What: Prompt Stand-In. Why: The app asks there. How: This answers with the test's answer, keeping it as the state. // What: Type Assertion Note. Why: The test sets one of the permission's values. How: The as reads it as one.


	} );

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ); // What: Group Create Call. Why: The card sits above a group's chat. How: This creates one.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The card shows once the chat has loaded. How: This waits for the group's heading.


};

// #endregion nudOpeFun

// #endregion Helpers



// #region Module Init

test( "the card stays visit after visit until it's answered, and Not now puts it away for good", async ( { page : curPagObj } ) => { // What: Not Now Test. Why: Notifications are never required, but the offer shouldn't vanish before the member has seen it (Section 11.1). How: This reloads with the card unanswered, puts it away, then reloads again.


	await nudOpeFun( curPagObj ); // What: Open Call. Why: The card shows above the chat. How: This opens a group on a device that hasn't answered.


	const nudRegObj = curPagObj.getByRole( 'region', { name : 'Notifications' } ); // What: Nudge Region Object. Why: The checks read the card. How: This finds it by its name.


	await expect( nudRegObj ).toBeVisible(); // What: Card Shown Assertion. Why: A device that hasn't answered is offered notifications. How: This waits for the card.

	await curPagObj.reload(); // What: Reload Call. Why: An unanswered card comes back on the next visit. How: This opens the chat again.

	await expect( nudRegObj ).toBeVisible(); // What: Card Kept Assertion. Why: The card stays until it's answered. How: This waits for it again.

	await nudRegObj.getByRole( 'button', { name : 'Not now' } ).click(); // What: Not Now Click Call. Why: The member puts the card away. How: This presses Not now.

	await expect( nudRegObj ).toHaveCount( 0 );                 // What: Card Gone Assertion. Why: Not now puts the card away. How: This waits for it to go.
	await expect( curPagObj.locator( '#main' ) ).toBeFocused(); // What: Main Focus Assertion. Why: Focus shouldn't fall to the page as the card goes. How: This expects the main area focused.

	await curPagObj.reload(); // What: Second Reload Call. Why: An answered card never comes back on this device. How: This opens the chat again.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The card would show once the chat has loaded. How: This waits for the group's heading.
	await expect( nudRegObj ).toHaveCount( 0 );                                                        // What: Card Stays Gone Assertion. Why: Not now is an answer, kept on the device. How: This expects no card.


} );



test( 'turning notifications on from the card asks the browser, announces its answer, and puts the card away', async ( { page : curPagObj } ) => { // What: Turn On Test. Why: The card's main action turns notifications on, and the member hears how it went (Section 11.1). How: This answers the prompt with granted, checks the message, the card, and focus, then reloads.


	await nudOpeFun( curPagObj ); // What: Open Call. Why: The card shows above the chat. How: This opens a group on a device that hasn't answered.


	const nudRegObj = curPagObj.getByRole( 'region', { name : 'Notifications' } ); // What: Nudge Region Object. Why: The checks read the card. How: This finds it by its name.


	await curPagObj.evaluate( () => Reflect.set( window, 'ansValStr', 'granted' ) ); // What: Allow Set Call. Why: The browser allows notifications. How: This sets the stand-in's answer.

	await nudRegObj.getByRole( 'button', { name : 'Turn on notifications' } ).click(); // What: Turn On Click Call. Why: The member turns notifications on from the card. How: This presses the card's main button.

	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'are on' } ) ).toHaveText( 'Notifications are on for this device.' ); // What: On Status Assertion. Why: The answer is announced as the card goes. How: This reads the status.
	await expect( nudRegObj ).toHaveCount( 0 );                                                                                             // What: Card Gone Assertion. Why: The browser has answered. How: This waits for the card to go.
	await expect( curPagObj.locator( '#main' ) ).toBeFocused();                                                                             // What: Main Focus Assertion. Why: Focus shouldn't fall to the page as the card goes. How: This expects the main area focused.

	await curPagObj.reload(); // What: Reload Call. Why: Notifications are on, so there's nothing to offer. How: This opens the chat again.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The card would show once the chat has loaded. How: This waits for the group's heading.
	await expect( nudRegObj ).toHaveCount( 0 );                                                        // What: Card Stays Gone Assertion. Why: An answered card never comes back. How: This expects no card.


} );



test( 'a blocked answer from the card says the browser is blocking notifications, and the card goes', async ( { page : curPagObj } ) => { // What: Blocked Test. Why: A member whose browser blocks notifications should learn where to allow them (Section 11.1). How: This answers the prompt with denied and checks the message and the card.


	await nudOpeFun( curPagObj ); // What: Open Call. Why: The card shows above the chat. How: This opens a group on a device that hasn't answered, whose prompt answers denied.

	await curPagObj.getByRole( 'region', { name : 'Notifications' } ).getByRole( 'button', { name : 'Turn on notifications' } ).click(); // What: Turn On Click Call. Why: The member tries to turn notifications on. How: This presses the card's main button.

	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'blocking' } ) ).toContainText( 'Your browser is blocking notifications' ); // What: Blocked Status Assertion. Why: The member learns the browser is in the way. How: This reads the status.
	await expect( curPagObj.getByRole( 'region', { name : 'Notifications' } ) ).toHaveCount( 0 );                                                 // What: Card Gone Assertion. Why: The browser has answered, even with no. How: This waits for the card to go.


} );

// #endregion Module Init


