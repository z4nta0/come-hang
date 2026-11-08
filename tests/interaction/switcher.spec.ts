


// #region Imports

import AxeBuiCla from '@axe-core/playwright'; // What: Axe Builder Class. Why: The open switcher is scanned like the app's own states. How: This builds an axe run for the page.


import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the switcher and the seed behave as they should. How: This asserts on what each check reads.
import { test   } from '@playwright/test'; // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helpers drive a page. How: This types it.

// #endregion Imports



/**
 * switcher.spec.ts = Switcher Spec
 *
 * @summary
 * Checks the development member switcher, in whichever engine the project
 * runs, against the Emulator Suite. The app hides the switcher from a driven
 * browser, so each page here reports itself as undriven first. The seed
 * builds the demo group and opens it as Alex, with the chat, the picnic, and
 * Jordan's waiting request in place; switching reloads the tab as each
 * member, who keeps their own identity, while another tab stays the device's
 * own identity. The open switcher passes the axe scan, and the skip link
 * stays the first stop.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region undOpeFun

/**
 * undOpeFun = Undriven Open Function
 *
 * @summary
 * Makes a page report itself as undriven, in every frame it loads, so the
 * app mounts the switcher, then opens the app at its root.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open.
 *
 * @returns A promise that settles once the app has loaded, with no value.
 *
 * @example
 * ```ts
 * undOpeFun(page) // => Promise<void>
 * ```
 *
*/

const undOpeFun = async ( curPagObj : Page ) : Promise< void > => { // What: Undriven Open Function. Why: The switcher only mounts outside a driven browser. How: This hides the driven flag, then opens the app.


	await curPagObj.addInitScript( () => Object.defineProperty( Navigator.prototype, 'webdriver', { get : () => false } ) ); // What: Undriven Script Call. Why: The app reads navigator.webdriver before mounting the switcher. How: This makes it false in every document the page loads.

	await curPagObj.goto( '/' ); // What: Home Visit. Why: The switcher mounts with the app. How: This opens it.


};

// #endregion undOpeFun



// #region memPicFun

/**
 * memPicFun = Member Pick Function
 *
 * @summary
 * Opens the switcher, chooses a member, and waits for the tab to come back
 * acting as them.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The tab that switches.
 * @param namValStr - Name Value String: The member's name, as the switcher
 *                    lists it.
 *
 * @returns A promise that settles once the tab acts as the member, with no
 *          value.
 *
 * @example
 * ```ts
 * memPicFun(page, 'Sam Ortiz') // => Promise<void>
 * ```
 *
*/

const memPicFun = async ( curPagObj : Page, namValStr : string ) : Promise< void > => { // What: Member Pick Function. Why: Several checks switch the tab. How: This chooses the member and waits for the reload.


	await curPagObj.getByRole( 'button', { name : /^Dev: / } ).click();                                             // What: Toggle Click Call. Why: The members are in the sheet. How: This opens it.
	await curPagObj.getByRole( 'dialog', { name : 'Developer tools' } ).getByRole( 'button', { name : namValStr } ).click(); // What: Member Click Call. Why: Choosing a member reloads as them. How: This presses the member's button.

	await expect( curPagObj.getByRole( 'button', { name : `Dev: ${ namValStr }` } ) ).toBeVisible(); // What: Switched Assertion. Why: The toggle names whom the tab acts as after the reload. How: This waits for the member's name on it.


};

// #endregion memPicFun

// #endregion Helpers



// #region Module Init

test( 'the seed builds the demo group as Alex, and switching reloads the tab as each member, who keeps their identity', async ( { page : curPagObj } ) => { // What: Seed And Switch Test. Why: Trying the app as several people is what the switcher is for. How: This seeds, checks the group as Alex and Sam, switches away and back to check Alex's identity was kept in a database of its own, and checks another tab stays the device's own.


	test.setTimeout( 180000 ); // What: Timeout Call. Why: The seed runs four members through the emulators. How: This allows 3 minutes.

	await undOpeFun( curPagObj ); // What: Open Call. Why: The switcher has to show. How: This opens the app undriven.

	await curPagObj.getByRole( 'button', { name : 'Dev: You' } ).click(); // What: Toggle Click Call. Why: The seed starts from the sheet. How: This opens it.


	const devSheLoc = curPagObj.getByRole( 'dialog', { name : 'Developer tools' } ); // What: Development Sheet Locator. Why: The checks read the sheet. How: This finds it by its name.


	await expect( devSheLoc.getByRole( 'button', { name : 'You' } ) ).toHaveAttribute( 'aria-current', 'true' ); // What: Current Mark Assertion. Why: The tab acts as the device's own identity until switched. How: This expects that choice marked.

	await devSheLoc.getByRole( 'button', { name : 'Seed demo group' } ).click(); // What: Seed Click Call. Why: The demo group is built from here. How: This presses the button.

	await expect( devSheLoc.getByRole( 'status' ) ).toHaveText( 'Starting the group as Alex…' ); // What: Stage Assertion. Why: A long seed announces its stages. How: This expects the first one.

	await expect( curPagObj.getByRole( 'button', { name : 'Dev: Alex Kim' } ) ).toBeVisible( { timeout : 150000 } );              // What: Owner Assertion. Why: The finished seed opens the group as its owner. How: This waits for the reload as Alex.
	await expect( curPagObj.getByText( "Count me in. I'll bring drinks." ) ).toBeVisible( { timeout : 30000 } );                    // What: Chat Assertion. Why: The seed starts the chat with each member. How: This expects Sam's reply in Alex's chat.
	await expect( curPagObj.getByRole( 'heading', { name : 'Picnic at the lake' } ) ).toBeVisible();                              // What: Picnic Assertion. Why: The picnic is the next event, shown beside the chat at this width. How: This expects its heading.

	await curPagObj.getByRole( 'dialog', { name : 'While you were away' } ).getByRole( 'button', { name : 'Got it' } ).click(); // What: Sheet Close Call. Why: Jordan's request waits on Alex, so the notices sheet opens over the frame. How: This waits for the sheet and closes it.

	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: Jordan's request waits in the People section. How: This opens it.

	await expect( curPagObj.getByRole( 'button', { name : 'Approve Jordan Lee' } ) ).toBeVisible(); // What: Waiting Request Assertion. Why: The seed leaves Jordan's request for review. How: This expects its approve button.

	await memPicFun( curPagObj, 'Sam Ortiz' ); // What: Sam Switch Call. Why: Each member sees the group as themselves. How: This switches to Sam.

	await expect( curPagObj.getByText( 'Could someone grab a blanket?' ) ).toBeVisible( { timeout : 30000 } ); // What: Sam Chat Assertion. Why: Sam is a member who reads the chat. How: This expects Alex's last message.

	await curPagObj.getByRole( 'dialog', { name : 'While you were away' } ).getByRole( 'button', { name : 'Got it' } ).click(); // What: Sam Sheet Close Call. Why: Jordan's request waits on every member, so Sam's notices sheet opens too. How: This waits for the sheet and closes it.

	await memPicFun( curPagObj, 'You' ); // What: Own Switch Call. Why: The device's own identity belongs to no group. How: This switches back to it.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Plans made. Fun had. Memories created.' } ) ).toBeVisible(); // What: Landing Assertion. Why: The device's own profile holds no identity, so it sees the landing page. How: This expects its heading.

	await memPicFun( curPagObj, 'Alex Kim' ); // What: Alex Return Call. Why: A member keeps their identity while the tab is someone else. How: This switches back to Alex.

	await expect( curPagObj.getByText( "Count me in. I'll bring drinks." ) ).toBeVisible( { timeout : 30000 } ); // What: Kept Identity Assertion. Why: Alex's keys stayed in the browser. How: This expects the chat readable again.

	expect( ( await curPagObj.evaluate( () => indexedDB.databases() ) ).map( ( datRecObj ) => datRecObj.name ) ).toEqual( expect.arrayContaining( [ 'come-hang-alex', 'come-hang-priya', 'come-hang-sam' ] ) ); // What: Own Databases Assertion. Why: Each member keeps their keys apart, or one member's identity would replace another's. How: This expects a database named for each seeded member.


	const secPagObj = await curPagObj.context().newPage(); // What: Second Page Object. Why: Each tab acts as its own member. How: This opens another tab in the same browser.


	await undOpeFun( secPagObj ); // What: Second Open Call. Why: The new tab shows the switcher too. How: This opens it undriven.

	await expect( secPagObj.getByRole( 'button', { name : 'Dev: You' } ) ).toBeVisible(); // What: Other Tab Assertion. Why: A tab's member is kept in its own session storage. How: This expects the new tab to act as the device's own identity.


} );



test( 'the open switcher passes the axe scan, and the skip link stays the first stop', async ( { page : curPagObj } ) => { // What: Switcher Access Test. Why: The tools mustn't hide a problem in the app or bring one of their own. How: This checks the first Tab, opens the sheet, and scans the page.


	await undOpeFun( curPagObj ); // What: Open Call. Why: The switcher has to show. How: This opens the app undriven.

	await curPagObj.keyboard.press( 'Tab' ); // What: Tab Press Call. Why: A keyboard user's first stop is the skip link. How: This presses Tab once.

	await expect( curPagObj.getByRole( 'link', { name : 'Skip to main content' } ) ).toBeFocused(); // What: Skip Link Assertion. Why: The switcher comes after the app in the Tab order. How: This expects the skip link focused.

	await curPagObj.getByRole( 'button', { name : 'Dev: You' } ).click(); // What: Toggle Click Call. Why: The sheet is scanned open. How: This opens it.

	await expect( curPagObj.getByRole( 'dialog', { name : 'Developer tools' } ) ).toBeVisible(); // What: Open Assertion. Why: The scan should read the open sheet. How: This waits for it.


	const axeResObj = await new AxeBuiCla( { page : curPagObj } ).withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice' ] ).analyze(); // What: Axe Result Object. Why: The open switcher is held to the app's own standard. How: This scans the page with the accessibility suite's tags.


	expect( axeResObj.violations.map( ( vioRecObj ) => `${ vioRecObj.id }: ${ vioRecObj.nodes.map( ( nodRecObj ) => nodRecObj.target.join( ' ' ) ).join( ', ' ) }` ) ).toEqual( [] ); // What: No Violations Assertion. Why: The switcher passes only with none. How: This expects each violation's rule and elements listed empty.


} );

// #endregion Module Init


