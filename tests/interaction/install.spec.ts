


// #region Imports

import { bipFakFun   } from '../support/states.ts'; // What: Before Install Prompt Fake Function. Why: The suite's browsers never offer an install prompt. How: This fires a stand-in for one.
import { expect      } from '@playwright/test';     // What: Expect. Why: Each check passes only when the install steps behave as they should. How: This asserts on what each check reads.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: The Settings check starts from a group's Settings. How: This opens a shared state.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: The Settings state is one of the shared states. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helper drives a page. How: This types it.

// #endregion Imports



/**
 * install.spec.ts = Install Spec
 *
 * @summary
 * Checks the install steps an iPhone or iPad shows in Safari, in whichever
 * engine the project runs, each page reporting an iPhone's Safari since the
 * app reads the device from its user agent. The steps come before the app,
 * carrying on in Safari opens it with focus on its main area and stays
 * chosen through a reload, and an installed app skips them. An invite link
 * opened there keeps its link to copy and reads nothing, so nothing signs in
 * from Safari's storage. Where a browser offers its own install prompt, a
 * stand-in for it shows the note on the welcome, whose Not now holds through
 * a reload and whose Install shows the prompt, and the Install button in
 * Settings, which shows it too.
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

const IOS_UAS_STR = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'; // What: iOS User Agent String. Why: Each page runs as an iPhone's Safari. How: This is the user agent that Safari on iOS 18 sends.

// #endregion Constants



// #region Helpers

// #region iosOpeFun

/**
 * iosOpeFun = iOS Open Function
 *
 * @summary
 * Makes a page report an iPhone's Safari, and optionally an installed app,
 * in every document it loads, then opens a path at a phone's size.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open.
 * @param patValStr - Path Value String: The path to load.
 * @param insValBoo - Installed Value Boolean: Whether the page reports an
 *                    installed app, by default false.
 *
 * @returns A promise that settles once the path has loaded, with no value.
 *
 * @example
 * ```ts
 * iosOpeFun(page, '/', false) // => Promise<void>
 * ```
 *
*/

const iosOpeFun = async ( curPagObj : Page, patValStr : string, insValBoo = false ) : Promise< void > => { // What: iOS Open Function. Why: Every test runs as an iPhone. How: This sets the agent and the installed flag, then opens the path.


	await curPagObj.addInitScript( ( [ uasValStr, insArgBoo ] ) => { // What: iOS Script Call. Why: The app reads the device and whether it's installed as it starts. How: This reports both in every document the page loads.


		Object.defineProperty( Navigator.prototype, 'userAgent', { get : () => uasValStr } ); // What: Agent Define Call. Why: The app tells an iPhone by its user agent. How: This reports an iPhone's Safari.

		if ( insArgBoo ) Object.defineProperty( Navigator.prototype, 'standalone', { get : () => true } ); // What: Installed Define Call. Why: Safari reports an installed app through navigator.standalone. How: This reports one when asked to.


	}, [ IOS_UAS_STR, insValBoo ] as const ); // What: Script Arguments. Why: The script runs in the page, apart from the test's variables. How: This passes the agent and the installed flag.

	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Viewport Call. Why: The steps are read on a phone. How: This sizes the page as one.

	await curPagObj.goto( patValStr ); // What: Path Visit. Why: Each test starts from a fresh load. How: This opens the path.


};

// #endregion iosOpeFun

// #endregion Helpers



// #region Module Init

test( 'on an iPhone in Safari the install steps come first, and carrying on opens the app and stays chosen', async ( { page } ) => { // What: Safari Steps Test. Why: Nothing done in Safari moves to the app installed later, so installing comes first (Section 16). How: This checks the steps show instead of the welcome, carries on, checks the welcome with its main area focused, then reloads and checks the steps stay away.


	await iosOpeFun( page, '/' ); // What: Open Call. Why: The steps show at the app's root. How: This opens it as an iPhone's Safari.

	await expect( page.getByRole( 'heading', { level : 1, name : 'Add Come Hang to your Home Screen' } ) ).toBeVisible(); // What: Steps Assertion. Why: Installing comes before anything else. How: This expects the install heading.
	await expect( page.getByRole( 'button', { name : 'Start a group' } ) ).toHaveCount( 0 );                               // What: No Welcome Assertion. Why: The welcome waits until someone installs or carries on. How: This expects no start button.

	await page.getByRole( 'button', { name : 'Continue in Safari' } ).click(); // What: Continue Click Call. Why: Someone not ready to install can still look around. How: This presses the button.

	await expect( page.getByRole( 'heading', { exact : true, level : 1, name : 'Come Hang' } ) ).toBeVisible(); // What: Welcome Assertion. Why: Carrying on opens the app. How: This expects the welcome's heading.
	await expect( page.getByRole( 'main' ) ).toBeFocused();                                      // What: Main Focus Assertion. Why: The pressed button is gone, so focus lands on the screen that replaced it. How: This expects the main area focused.

	await page.reload(); // What: Reload Call. Why: The choice should hold on later visits. How: This reloads the app.

	await expect( page.getByRole( 'heading', { exact : true, level : 1, name : 'Come Hang' } ) ).toBeVisible(); // What: Kept Choice Assertion. Why: Someone who chose Safari isn't stopped again. How: This expects the welcome straight away.


} );



test( 'an installed app on iPhone skips the install steps', async ( { page } ) => { // What: Installed Test. Why: An installed app has nothing left to install. How: This opens the app reporting an installed iPhone and checks the welcome shows.


	await iosOpeFun( page, '/', true ); // What: Installed Open Call. Why: The installed app is what the steps lead to. How: This opens it as an installed iPhone app.

	await expect( page.getByRole( 'heading', { exact : true, level : 1, name : 'Come Hang' } ) ).toBeVisible(); // What: Welcome Assertion. Why: The installed app opens straight to the welcome. How: This expects its heading.


} );



test( 'an invite link in iPhone Safari keeps its link to copy and makes no identity', async ( { page } ) => { // What: Invited Steps Test. Why: The installed app can't see what Safari opened, and an identity made in Safari would be stranded there (Section 16). How: This opens a link, checks the invite part shows its link, copies it, and checks neither Auth nor Firestore made a database.


	const tokValStr = 'q2W_e-R4tY6uI8oP0aS3dF'; // What: Token Value String. Why: The link carries its token to the steps. How: This is a well-formed token no invite has, since the steps never read it.


	await iosOpeFun( page, `/join/${ tokValStr }` ); // What: Link Open Call. Why: Most people arrive from a link. How: This opens one as an iPhone's Safari.

	await expect( page.getByRole( 'heading', { level : 2, name : "You've been invited to a group" } ) ).toBeVisible();      // What: Invite Assertion. Why: Someone arriving from a link should know it was received. How: This expects the invite's heading.
	await expect( page.getByLabel( 'Invite link', { exact : true } ) ).toHaveValue( new RegExp( `/join/${ tokValStr }$` ) ); // What: Link Assertion. Why: The link is what the installed app needs. How: This expects the field to hold it.

	await page.getByRole( 'button', { name : 'Copy invite link' } ).click(); // What: Copy Click Call. Why: Copying is the first step for someone invited. How: This presses the button.

	await expect( page.getByRole( 'status' ).filter( { hasText : /Link copied|ready to copy/ } ) ).toBeVisible(); // What: Copy Status Assertion. Why: A copy, or a failed one where the browser refuses the clipboard, is announced. How: This expects either message.


	const datNamArr = ( await page.evaluate( () => indexedDB.databases() ) ).map( ( datRecObj ) => datRecObj.name ); // What: Database Name Array. Why: An identity would leave its databases behind. How: This lists the page's databases.


	expect( datNamArr ).not.toContain( 'firebaseLocalStorageDb' );                                              // What: No Sign-In Assertion. Why: Nothing signs in from Safari's steps. How: This expects no Auth database.
	expect( datNamArr.filter( ( datNamStr ) => datNamStr?.startsWith( 'firestore/' ) === true ) ).toEqual( [] ); // What: No Firestore Assertion. Why: Nothing reads the invite from Safari's steps. How: This expects no Firestore cache.


} );

test( 'a browser that offers its install prompt shows the note, whose Not now holds and whose Install shows the prompt', async ( { page } ) => { // What: Note Test. Why: Where installing takes one tap it's suggested, never in the way (Section 16). How: This fires a stand-in prompt, checks the note, dismisses it and checks it stays gone after a reload, then installs from a fresh device and checks the prompt showed.


	await page.goto( '/' ); // What: Welcome Open Call. Why: The note shows on the welcome. How: This opens the app.

	await bipFakFun( page ); // What: Prompt Fire Call. Why: The note waits for the browser's prompt. How: This fires a stand-in.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Install Come Hang' } ) ).toBeVisible(); // What: Note Assertion. Why: A browser that can install suggests it. How: This expects the note's heading.

	await page.getByRole( 'button', { name : 'Not now' } ).click(); // What: Dismiss Click Call. Why: Installing is never required here. How: This dismisses the note.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Install Come Hang' } ) ).toHaveCount( 0 ); // What: Gone Assertion. Why: A dismissed note goes at once. How: This expects no note.
	await expect( page.getByRole( 'main' ) ).toBeFocused();                                                // What: Focus Assertion. Why: The pressed button went with the note, so focus lands on the main area. How: This expects it focused.

	await page.reload(); // What: Reload Call. Why: The dismissal should hold on later visits. How: This reloads the app.

	await bipFakFun( page ); // What: Second Prompt Fire Call. Why: The browser offers its prompt again on each load. How: This fires another stand-in.

	await expect( page.getByRole( 'heading', { exact : true, level : 1, name : 'Come Hang' } ) ).toBeVisible();          // What: Welcome Assertion. Why: The welcome itself still shows. How: This expects its heading.
	await expect( page.getByRole( 'heading', { level : 2, name : 'Install Come Hang' } ) ).toHaveCount( 0 ); // What: Kept Dismissal Assertion. Why: Not now holds. How: This expects no note.

	await page.evaluate( () => localStorage.clear() ); // What: Storage Clear Call. Why: A device that never dismissed the note is checked next. How: This forgets the dismissal.

	await page.reload(); // What: Fresh Reload Call. Why: The note starts again on a device without the dismissal. How: This reloads the app.

	await bipFakFun( page ); // What: Third Prompt Fire Call. Why: The Install button needs a prompt to show. How: This fires a stand-in.

	await page.getByRole( 'button', { name : 'Install', exact : true } ).click(); // What: Install Click Call. Why: Installing takes one tap. How: This presses Install.

	await expect.poll( () => page.evaluate( () => Reflect.get( window, 'proCouNum' ) ) ).toBe( 1 );            // What: Prompt Assertion. Why: Install shows the browser's prompt. How: This expects the stand-in's prompt called once.
	await expect( page.getByRole( 'heading', { level : 2, name : 'Install Come Hang' } ) ).toHaveCount( 0 ); // What: Used Assertion. Why: A prompt shows once, so the note goes with it. How: This expects no note.


} );



test( 'Settings offers Install while the browser can install, and says how otherwise', async ( { page } ) => { // What: Settings Install Test. Why: The install stays at hand until the app is installed (Section 16). How: This opens Settings, checks the note without a prompt, fires a stand-in, presses Install, and checks the prompt showed and focus moved to the main area.


	await opeStaFun( page, STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'settings-desktop' )! ); // What: Settings Open Call. Why: The install part sits in Settings. How: This opens the owner's Settings. // What: Non-Null Note. Why: The shared states list settings-desktop. How: The ! says it's there.

	await expect( page.getByText( "To install, use your browser's install option" ) ).toBeVisible(); // What: Fallback Assertion. Why: A browser without a prompt is told how else to install. How: This expects the note.

	await bipFakFun( page ); // What: Prompt Fire Call. Why: The button waits for the browser's prompt. How: This fires a stand-in.

	await page.getByRole( 'button', { name : 'Install the app' } ).click(); // What: Install Click Call. Why: Installing takes one tap where the browser allows it. How: This presses the button.

	await expect.poll( () => page.evaluate( () => Reflect.get( window, 'proCouNum' ) ) ).toBe( 1 ); // What: Prompt Assertion. Why: The button shows the browser's prompt. How: This expects the stand-in's prompt called once.
	await expect( page.getByRole( 'button', { name : 'Install the app' } ) ).toHaveCount( 0 );      // What: Gone Assertion. Why: A prompt shows once, so the button goes with it. How: This expects no button.
	await expect( page.getByRole( 'main' ) ).toBeFocused();                                         // What: Focus Assertion. Why: The pressed button is gone, so focus lands on the main area. How: This expects it focused.


} );

// #endregion Module Init


