


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the way out behaves as it should. How: This asserts on what each check reads.
import { test   } from '@playwright/test'; // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helper drives a page. How: This types it.

// #endregion Imports



/**
 * in-app.spec.ts = In-App Spec
 *
 * @summary
 * Checks the screen another app's built-in browser shows first, in whichever
 * engine the project runs, each page reporting Facebook's browser on an
 * iPhone or Messenger's on Android, since the app reads the browser from its
 * user agent. The screen comes before the install steps, its main button
 * links to Safari on an iPhone and to an intent link on Android, each keeping
 * an invite's path, the link can be copied, and carrying on opens the app
 * with focus on its main area and stays chosen through a reload.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const FAI_UAS_STR = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 [FBAN/FBIOS;FBAV/480.0.0.0;FBDV/iPhone15,2;FBSN/iOS;FBSV/18.0;FBLC/en_US]'; // What: Facebook-iOS User Agent String. Why: The iPhone checks run as Facebook's browser. How: This is the shape of the user agent Facebook's browser sends on an iPhone.
const INV_PAT_STR = `/join/${ 'A'.repeat( 22 ) }`; // What: Invite Path String. Why: The way out keeps an invite's path without reading the invite, so any well-formed token will do. How: This is a link with a token no invite has.
const MEA_UAS_STR = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/480.0.0.0;]';   // What: Messenger-Android User Agent String. Why: The Android checks run as Messenger's browser. How: This is the shape of the user agent Messenger's browser sends on Android.

// #endregion Constants



// #region Helpers

// #region inaOpeFun

/**
 * inaOpeFun = In-App Open Function
 *
 * @summary
 * Makes a page report a built-in browser's user agent in every document it
 * loads, then opens a path at a phone's size.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open.
 * @param uasValStr - User Agent Value String: The agent the page reports.
 * @param patValStr - Path Value String: The path to load.
 *
 * @returns A promise that settles once the path has loaded, with no value.
 *
 * @example
 * ```ts
 * inaOpeFun(page, FAI_UAS_STR, '/') // => Promise<void>
 * ```
 *
*/

const inaOpeFun = async ( curPagObj : Page, uasValStr : string, patValStr : string ) : Promise< void > => { // What: In-App Open Function. Why: Every test runs as a built-in browser. How: This sets the agent, then opens the path.


	await curPagObj.addInitScript( ( uasArgStr ) => Object.defineProperty( Navigator.prototype, 'userAgent', { get : () => uasArgStr } ), uasValStr ); // What: Agent Script Call. Why: The app tells a built-in browser by its user agent, which the suite's browsers don't send. How: This reports the agent in every document the page loads.

	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Viewport Call. Why: Built-in browsers run on phones. How: This sizes the page as one.

	await curPagObj.goto( patValStr ); // What: Path Visit. Why: Each test starts from a fresh load. How: This opens the path.


};

// #endregion inaOpeFun

// #endregion Helpers



// #region Module Init

test( "an invite link in Facebook's browser on an iPhone leads to Safari, keeping the invite, before the install steps", async ( { page } ) => { // What: iPhone Way Out Test. Why: Nothing done in a built-in browser reaches Safari or the app, and it can't install (Section 16). How: This opens a link as Facebook's browser, checks the screen shows instead of the install steps, and checks its button links to Safari at the invite's path.


	await inaOpeFun( page, FAI_UAS_STR, INV_PAT_STR ); // What: Open Call. Why: An invite is the common way into a built-in browser. How: This opens one as Facebook's browser on an iPhone.

	await expect( page.getByRole( 'heading', { level : 1, name : 'Open Come Hang in Safari' } ) ).toBeVisible();          // What: Way Out Assertion. Why: Leaving comes before anything else. How: This expects the screen's heading.
	await expect( page.getByRole( 'heading', { name : 'Add Come Hang to your Home Screen' } ) ).toHaveCount( 0 ); // What: No Install Assertion. Why: A built-in browser can't install, so its steps would mislead. How: This expects no install heading.
	await expect( page.getByText( "You've been invited to a group" ) ).toBeVisible();                              // What: Invite Lead Assertion. Why: Someone arriving from a link should know it was received. How: This expects the lead to name the invite.


	const hosValStr = await page.evaluate( () => location.host );                    // What: Host Value String. Why: The way out names the suite's own server. How: This reads it from the page.
	const schValStr = await page.evaluate( () => location.protocol.slice( 0, -1 ) ); // What: Scheme Value String. Why: The way out keeps the server's scheme. How: This reads it from the page.


	await expect( page.getByRole( 'link', { name : 'Open in Safari' } ) ).toHaveAttribute( 'href', `x-safari-${ schValStr }://${ hosValStr }${ INV_PAT_STR }` ); // What: Safari Link Assertion. Why: Safari opens its own links from other apps, and the invite should still be open there. How: This expects the button to link to Safari at the invite's path.


} );



test( "Messenger's browser on Android leads out through an intent link, and the link can be copied", async ( { page } ) => { // What: Android Way Out Test. Why: An intent link hands the address to the device, which opens it in the installed app or the browser (Section 16). How: This opens the root as Messenger's browser, checks the heading and the intent link, then copies the link and checks the copy is announced.


	await inaOpeFun( page, MEA_UAS_STR, '/' ); // What: Open Call. Why: The way out is checked without an invite too. How: This opens the root as Messenger's browser on Android.

	await expect( page.getByRole( 'heading', { level : 1, name : 'Open Come Hang in your browser' } ) ).toBeVisible(); // What: Way Out Assertion. Why: Leaving comes before anything else. How: This expects the screen's heading, naming the browser.


	const hosValStr = await page.evaluate( () => location.host );                    // What: Host Value String. Why: The way out names the suite's own server. How: This reads it from the page.
	const schValStr = await page.evaluate( () => location.protocol.slice( 0, -1 ) ); // What: Scheme Value String. Why: The intent link names the server's scheme. How: This reads it from the page.


	await expect( page.getByRole( 'link', { name : 'Open Come Hang' } ) ).toHaveAttribute( 'href', `intent://${ hosValStr }/#Intent;scheme=${ schValStr };end` ); // What: Intent Link Assertion. Why: An intent link naming no app lets the installed app or the browser take the address. How: This expects the button to link to one at the root.

	await page.getByRole( 'button', { name : 'Copy link' } ).click(); // What: Copy Click Call. Why: A built-in browser may ignore the button, so the link can be carried by hand. How: This presses the copy button.

	await expect( page.getByRole( 'status' ).filter( { hasText : /Link copied|ready to copy/ } ) ).toBeVisible(); // What: Copy Status Assertion. Why: A copy, or a failed one where the browser refuses the clipboard, is announced. How: This expects either message.


} );



test( 'carrying on in a built-in browser opens the app without the install steps, and stays chosen', async ( { page } ) => { // What: Continue Test. Why: Someone who wants to stay can, and shouldn't be stopped again. How: This opens the root as Facebook's browser on an iPhone, carries on, checks the landing page with its main area focused and no install steps, then reloads and checks the screen stays away.


	await inaOpeFun( page, FAI_UAS_STR, '/' ); // What: Open Call. Why: Carrying on is checked from the root. How: This opens it as Facebook's browser on an iPhone.

	await page.getByRole( 'button', { name : 'Continue here' } ).click(); // What: Continue Click Call. Why: Someone may choose to stay. How: This presses the button.

	await expect( page.getByRole( 'heading', { exact : true, level : 1, name : 'Plans made. Fun had. Memories created.' } ) ).toBeVisible(); // What: Landing Assertion. Why: Carrying on opens the app, past the install steps a built-in browser can't follow. How: This expects the landing page's heading.
	await expect( page.getByRole( 'main' ) ).toBeFocused();                                                                                  // What: Main Focus Assertion. Why: The pressed button is gone, so focus lands on the screen that replaced it. How: This expects the main area focused.

	await page.reload(); // What: Reload Call. Why: The choice should hold on later visits. How: This reloads the app.

	await expect( page.getByRole( 'heading', { exact : true, level : 1, name : 'Plans made. Fun had. Memories created.' } ) ).toBeVisible(); // What: Kept Choice Assertion. Why: Someone who chose to stay isn't stopped again. How: This expects the landing page straight away.


} );

// #endregion Module Init


