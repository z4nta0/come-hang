


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the page shows the colors it should. How: This asserts on what the page reports.
import { test   } from '@playwright/test'; // What: Test. Why: Each part of the color mode is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helpers act on a test's page. How: This types it.

// #endregion Imports



/**
 * color-mode.spec.ts = Color Mode Spec
 *
 * @summary
 * Checks the light and dark modes in a real browser, in each engine, since
 * each resolves light-dark() colors itself. Each test opens the app on the dev
 * server with the phone set to light or dark, reads the page's background,
 * and runs the color mode module in the page the way settings will: the page
 * follows the phone until a choice is made, a choice overrides the phone and
 * lasts through a reload until system is chosen again, and a kept value that
 * isn't a choice is ignored.
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

const DAR_BAC_STR = 'rgb(18, 19, 42)';             // What: Dark Background String. Why: Dark mode is recognized by the page's background. How: This is the page color's dark value, #12132A, as the browser reports it.
const LIG_BAC_STR = 'rgb(244, 244, 250)';          // What: Light Background String. Why: Light mode is recognized by the page's background. How: This is the page color's light value, #F4F4FA, as the browser reports it.
const MOD_PAT_STR = '/src/platform/color-mode.ts'; // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the color mode module.

// #endregion Constants



// #region Helpers

const bacGetFun = ( pagValObj : Page ) : Promise< string > => pagValObj.evaluate( () => getComputedStyle( document.body ).backgroundColor ); // What: Background Get Function. Why: The background shows which mode the page is in. How: This reads the body's computed background color.



const modRunFun = ( pagValObj : Page, funNamStr : string, ...argValArr : unknown[] ) : Promise< unknown > => pagValObj.evaluate( async ( [ modPatStr, funNamStr, argValArr ] ) => ( await import( /* @vite-ignore */ modPatStr ) )[ funNamStr ]( ...argValArr ), [ MOD_PAT_STR, funNamStr, argValArr ] as const ); // What: Module Run Function. Why: Each step runs the real module where settings will. How: This imports the module in the page and calls the named function with the arguments. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.

// #endregion Helpers



// #region Module Init

test( "the page follows the phone's light or dark setting until a choice is made", async ( { page } ) => { // What: Phone Setting Test. Why: With no choice made, the app matches the phone. How: This opens the app with the phone set to light, then dark, and checks the background and the reported choice each time.


	await page.emulateMedia( { colorScheme : 'light' } ); // What: Light Phone Call. Why: The first check is a phone in light mode. How: This sets the page's color scheme preference to light.

	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the app there. How: This opens the app.

	expect( await bacGetFun( page ) ).toBe( LIG_BAC_STR ); // What: Light Background Assertion. Why: A light phone gets the light page. How: This reads the background.

	await page.emulateMedia( { colorScheme : 'dark' } ); // What: Dark Phone Call. Why: The page should follow the phone as it changes. How: This sets the preference to dark.

	expect( await bacGetFun( page ) ).toBe( DAR_BAC_STR );                                                   // What: Dark Background Assertion. Why: A dark phone gets the dark page. How: This reads the background.
	expect( await modRunFun( page, 'colModGetFun' ) ).toBe( 'system' );                                      // What: System Choice Assertion. Why: No choice was made. How: This reads the kept choice.
	expect( await page.evaluate( () => document.documentElement.dataset.colorModeChoice ) ).toBeUndefined(); // What: No Attribute Assertion. Why: Following the phone needs no attribute. How: This reads the root's attribute.


} );



test( "a light or dark choice overrides the phone's setting and lasts through a reload", async ( { page } ) => { // What: Choice Test. Why: Someone can pick a mode whatever the phone says, and it should stay picked. How: This chooses the opposite of the phone's mode both ways, reloads after each, then chooses system and checks the page follows the phone again after a reload.


	await page.emulateMedia( { colorScheme : 'dark' } ); // What: Dark Phone Call. Why: A light choice is checked against a dark phone. How: This sets the preference to dark.

	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the app there. How: This opens the app.

	await modRunFun( page, 'colModSetFun', 'light' ); // What: Light Choice Call. Why: This is the choice being checked. How: This chooses light.

	expect( await bacGetFun( page ) ).toBe( LIG_BAC_STR ); // What: Light Choice Assertion. Why: The choice applies at once. How: This reads the background.

	await page.reload(); // What: Light Reload Call. Why: The choice should outlast the page. How: This reloads it.

	expect( await bacGetFun( page ) ).toBe( LIG_BAC_STR ); // What: Kept Light Assertion. Why: The app applies the kept choice as it starts. How: This reads the background after the reload.

	await page.emulateMedia( { colorScheme : 'light' } ); // What: Light Phone Call. Why: A dark choice is checked against a light phone. How: This sets the preference to light.

	await modRunFun( page, 'colModSetFun', 'dark' ); // What: Dark Choice Call. Why: The other choice has to work too. How: This chooses dark.

	await page.reload(); // What: Dark Reload Call. Why: The choice should outlast the page. How: This reloads it.

	expect( await bacGetFun( page ) ).toBe( DAR_BAC_STR );            // What: Kept Dark Assertion. Why: The dark choice holds against the light phone. How: This reads the background after the reload.
	expect( await modRunFun( page, 'colModGetFun' ) ).toBe( 'dark' ); // What: Dark Choice Read Assertion. Why: Settings show the current choice. How: This reads the kept choice.

	await modRunFun( page, 'colModSetFun', 'system' ); // What: System Choice Call. Why: Following the phone can be chosen again. How: This chooses system.

	expect( await bacGetFun( page ) ).toBe( LIG_BAC_STR );                                                   // What: Followed At Once Assertion. Why: Choosing system applies at once, without a reload. How: This reads the background, which the light phone sets.
	expect( await page.evaluate( () => document.documentElement.dataset.colorModeChoice ) ).toBeUndefined(); // What: Attribute Removed Assertion. Why: Following the phone leaves no attribute behind. How: This reads the root's attribute.

	await page.reload(); // What: System Reload Call. Why: Following the phone should outlast the page too. How: This reloads it.

	expect( await bacGetFun( page ) ).toBe( LIG_BAC_STR );                                            // What: Followed Phone Assertion. Why: With the choice gone, the light phone sets the page. How: This reads the background after the reload.
	expect( await page.evaluate( () => localStorage.getItem( 'come-hang-color-mode' ) ) ).toBeNull(); // What: Forgotten Choice Assertion. Why: Following the phone keeps nothing. How: This reads the storage key.


} );



test( "a kept value that isn't a choice is ignored", async ( { page } ) => { // What: Unknown Value Test. Why: Storage can hold anything another version or a visitor left. How: This keeps an unknown value, opens the app, and checks it follows the phone.


	await page.emulateMedia( { colorScheme : 'light' } ); // What: Light Phone Call. Why: The page should follow the phone. How: This sets the preference to light.

	await page.addInitScript( () => localStorage.setItem( 'come-hang-color-mode', 'purple' ) ); // What: Unknown Value Plant Call. Why: The value has to be kept before the app starts. How: This stores an unknown value before the page's own scripts run.

	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the app there. How: This opens the app.

	expect( await bacGetFun( page ) ).toBe( LIG_BAC_STR );                                                   // What: Light Background Assertion. Why: An unknown value isn't a choice. How: This reads the background.
	expect( await page.evaluate( () => document.documentElement.dataset.colorModeChoice ) ).toBeUndefined(); // What: No Attribute Assertion. Why: An unknown value shouldn't reach the root. How: This reads the root's attribute.


} );

// #endregion Module Init


