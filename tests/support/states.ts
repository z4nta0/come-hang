


// #region Imports

import type { Page } from '@playwright/test'; // What: Page. Why: Opening and settling a state drives a Playwright page. How: This types the helpers' page parameters.

// #endregion Imports



/**
 * states.ts = States
 *
 * @summary
 * The page states the suites visit, and the helper that opens one. A state is
 * a page at a width, such as the home page at a phone width. opeStaFun sizes
 * the viewport, loads the page, waits for the fonts, and then waits for the
 * page to stay still so nothing is measured mid-fade.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type StaRecTyp = { // What: State Record Type. Why: Every check reads the same description of a state. How: This names a state, its path, and its viewport.


	heiNum  : number,                        // What: Height Number. Why: The viewport's height decides what's on screen. How: This is the viewport height in CSS pixels.
	ideStr  : string,                        // What: Identifier String. Why: Each test names the state it checks. How: This becomes part of the test title.
	patStr  : string,                        // What: Path String. Why: Each state opens one route. How: This is the path loaded from the suite's server.
	schStr? : 'dark' | 'light',              // What: Scheme String. Why: Every color has a dark value too, which has to pass the same checks. How: This is the phone's color scheme, light when left out.
	steStr? : 'create' | 'group' | 'sheet', // What: Steps String. Why: A screen past the first is reached by using the app, not by an address. How: This names the steps that reach it, none when left out.
	widNum  : number                         // What: Width Number. Why: Layouts change with width. How: This is the viewport width in CSS pixels.


};

// #endregion Types



// #region Constants

// #region STA_REC_ARR

/**
 * STA_REC_ARR = State Record Array
 *
 * @summary
 * Every state the checks visit: each screen at a phone width and a desktop
 * width, some in dark mode too, and the group sheet open on a phone. Every
 * row shares the {@link StaRecTyp} shape, so its fields carry no comments of
 * their own:
 *
 * - `heiNum` (Number): Height Number, the viewport height in CSS pixels.
 *
 * - `ideStr` (String): Identifier String, the state's name in test titles.
 *
 * - `patStr` (String): Path String, the route loaded from the suite's server.
 *
 * - `schStr` (String, optional): Scheme String, the phone's color scheme,
 *   light when left out.
 *
 * - `steStr` (String, optional): Steps String, the steps that reach the
 *   screen, none when left out.
 *
 * - `widNum` (Number): Width Number, the viewport width in CSS pixels.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const STA_REC_ARR : StaRecTyp[] = [ // What: State Record Array. Why: Every check walks the same list of states, so a new state is added in one place. How: Each row names a state, its path, and its viewport.


	{ heiNum : 900, ideStr : 'welcome-desktop',      patStr : '/', widNum : 1440                                        }, // What: Welcome Desktop State. Why: The welcome is checked at a desktop width. How: This loads the root at 1,440px.
	{ heiNum : 844, ideStr : 'welcome-phone',        patStr : '/', widNum : 390                                         }, // What: Welcome Phone State. Why: The welcome is checked at a phone width. How: This loads the root at 390px.
	{ heiNum : 900, ideStr : 'welcome-desktop-dark', patStr : '/', widNum : 1440, schStr : 'dark'                       }, // What: Welcome Desktop Dark State. Why: Dark mode is checked at a desktop width. How: This loads the root at 1,440px with the phone set to dark.
	{ heiNum : 844, ideStr : 'welcome-phone-dark',   patStr : '/', widNum : 390,  schStr : 'dark'                       }, // What: Welcome Phone Dark State. Why: Dark mode is checked at a phone width. How: This loads the root at 390px with the phone set to dark.
	{ heiNum : 900, ideStr : 'create-desktop',       patStr : '/', widNum : 1440, steStr : 'create'                     }, // What: Create Desktop State. Why: The form for starting a group is checked at a desktop width. How: This opens it at 1,440px.
	{ heiNum : 844, ideStr : 'create-phone',         patStr : '/', widNum : 390,  steStr : 'create'                     }, // What: Create Phone State. Why: The form is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 900, ideStr : 'group-desktop',        patStr : '/', widNum : 1440, steStr : 'group'                      }, // What: Group Desktop State. Why: The group frame is checked with its rail. How: This opens a new group at 1,440px.
	{ heiNum : 844, ideStr : 'group-phone',          patStr : '/', widNum : 390,  steStr : 'group'                      }, // What: Group Phone State. Why: The group frame is checked with its switcher. How: This opens a new group at 390px.
	{ heiNum : 844, ideStr : 'group-phone-dark',     patStr : '/', widNum : 390,  schStr : 'dark', steStr : 'group'     }, // What: Group Phone Dark State. Why: The frame's dark colors are checked too. How: This opens a new group at 390px with the phone set to dark.
	{ heiNum : 844, ideStr : 'sheet-phone',          patStr : '/', widNum : 390,  steStr : 'sheet'                      }  // What: Sheet Phone State. Why: The group sheet is a modal layer of its own. How: This opens a new group's sheet at 390px.


];

// #endregion STA_REC_ARR

// #endregion Constants



// #region Helpers

// #region waiSetFun

/**
 * waiSetFun = Wait Settled Function
 *
 * @summary
 * Waits until the page has stayed still for half a second: no animation or
 * transition running except ones that repeat forever, which never finish and
 * so are skipped (the reduced motion check is what catches one that
 * shouldn't be playing). A single still moment isn't enough, since a fade can
 * start just after the last one ends, so the page has to read as still on five
 * checks in a row, 100ms apart. It fails after 5 seconds rather than hanging.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to wait on.
 *
 * @returns A promise that settles once the page has stopped moving, with no
 *          value.
 *
 * @example
 * ```ts
 * waiSetFun(page) // => Promise<void>
 * ```
 *
*/

async function waiSetFun ( curPagObj : Page ) : Promise< void > {


	const deaTimNum = Date.now() + 5000; // What: Deadline Time Number. Why: A page that never settles should fail rather than hang the run. How: This marks 5 seconds from now.

	let quiCouNum = 0; // What: Quiet Count Number. Why: The page has to stay still across several checks in a row. How: This counts consecutive still checks, starting from none.


	while ( quiCouNum < 5 ) { // What: Settle Check Loop. Why: The page counts as settled only after five still checks in a row. How: This keeps checking until the count reaches five.


		if ( Date.now() > deaTimNum ) throw new Error( 'The page was still animating after 5 seconds.' ); // What: Deadline Guard. Why: A page that keeps moving would otherwise loop forever. How: This fails the check once the deadline passes.



		const stiPagBoo = await curPagObj.evaluate( () => document.getAnimations().every( ( aniCurObj ) => aniCurObj.playState !== 'running' || aniCurObj.effect?.getComputedTiming().iterations === Infinity ) ); // What: Still Page Boolean. Why: Each check asks whether anything that ends is still moving. How: This is true when every running animation or transition is one that repeats forever.


		quiCouNum = stiPagBoo ? quiCouNum + 1 : 0; // What: Quiet Count Update. Why: Any movement restarts the count, so the page has to stay still the whole half second. How: This adds one for a still check and resets to zero otherwise.


		await curPagObj.waitForTimeout( 100 ); // What: Check Pause Wait. Why: The checks have to span time to prove the page stays still. How: This waits 100ms before the next one.


	}


}

// #endregion waiSetFun



// #region steRunFun

/**
 * steRunFun = Steps Run Function
 *
 * @summary
 * Takes a loaded page to the screen a state names by using the app as a
 * person would: the create state opens the form for starting a group and
 * reloads it, so it shows with nothing focused, the group state creates a
 * group named Beach Day and then opens the app afresh, so the group shows as
 * it does on a later visit, with nothing focused, and the sheet state also
 * opens the group sheet from its switcher. A group needs the Firebase
 * Emulators, which the suites that reach one run inside.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to take there.
 * @param steStr    - Steps String: The steps to run.
 *
 * @returns A promise that settles once the screen is showing, with no value.
 *
 * @example
 * ```ts
 * steRunFun(page, 'group') // => Promise<void>
 * ```
 *
*/

async function steRunFun ( curPagObj : Page, steStr : 'create' | 'group' | 'sheet' ) : Promise< void > {


	await curPagObj.getByRole( 'button', { name : 'Start a group' } ).click(); // What: Start Click Call. Why: Every state with steps starts from the form. How: This opens it from the welcome.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Start a group' } ).waitFor(); // What: Form Wait. Why: The form has to be showing before it's used. How: This waits for its heading.


	if ( steStr === 'create' ) { // What: Create Block. Why: The create state is checked as the form opens on a reload, with nothing focused, rather than with focus on the heading opening it gave. How: This reloads the form, which its history entry keeps, and stops.


		await curPagObj.reload(); // What: Form Reload Call. Why: The form is checked as a fresh load of its screen. How: This reloads it.

		await curPagObj.getByRole( 'heading', { level : 1, name : 'Start a group' } ).waitFor(); // What: Reloaded Form Wait. Why: The form shows once the app has checked for groups. How: This waits for its heading.



		return; // What: Create Return. Why: The create state stops at the form. How: This returns.


	}



	await curPagObj.getByLabel( 'Group name' ).fill( 'Beach Day' );          // What: Group Name Fill Call. Why: The group needs a name. How: This types it.
	await curPagObj.getByLabel( 'Your name in this group' ).fill( 'Alice' ); // What: Person Name Fill Call. Why: The creator needs a name in it. How: This types it.

	await curPagObj.getByRole( 'button', { name : 'Create group' } ).click(); // What: Create Click Call. Why: The group is made through the real form. How: This submits it.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ).waitFor(); // What: Group Wait. Why: The group has to exist before the app is opened again. How: This waits for its heading.

	await curPagObj.goto( '/' ); // What: Fresh Open Call. Why: A later visit shows the group without the focus its creation gave it. How: This opens the app again.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ).waitFor(); // What: Reopened Group Wait. Why: The group shows once its list has loaded. How: This waits for its heading.


	if ( steStr === 'group' ) return; // What: Group Guard. Why: The group state stops at the frame. How: This returns.



	await curPagObj.getByRole( 'button', { name : 'Beach Day' } ).click(); // What: Switcher Click Call. Why: The sheet opens from the group's name. How: This presses the switcher.

	await curPagObj.getByRole( 'dialog', { name : 'Your groups' } ).waitFor(); // What: Sheet Wait. Why: The sheet has to be open before it's checked. How: This waits for the dialog.


}

// #endregion steRunFun



// #region opeStaFun

/**
 * opeStaFun = Open State Function
 *
 * @summary
 * Opens one state on a page and waits until it's settled: sets the phone's
 * color scheme, sizes the viewport, loads the path, waits for the web fonts,
 * runs the state's steps ({@link steRunFun}), then waits until the page stays
 * still ({@link waiSetFun}), so a check never measures a heading halfway
 * through an entrance fade.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open the state on.
 * @param staRecObj - State Record Object: {@link StaRecTyp}
 *
 * @returns A promise that settles once the state is open and settled, with no
 *          value.
 *
 * @example
 * ```ts
 * opeStaFun(page, staRecObj) // => Promise<void>
 * ```
 *
*/

async function opeStaFun ( curPagObj : Page, staRecObj : StaRecTyp ) : Promise< void > {


	await curPagObj.emulateMedia( { colorScheme : staRecObj.schStr ?? 'light' } ); // What: Color Scheme Call. Why: The state's colors depend on the phone's light or dark setting. How: This sets the page's preference before it loads, light unless the state names dark.

	await curPagObj.setViewportSize( { height : staRecObj.heiNum, width : staRecObj.widNum } ); // What: Viewport Size Call. Why: The state's layout depends on its width. How: This sizes the page before it loads, so breakpoints apply from the first paint.

	await curPagObj.goto( staRecObj.patStr ); // What: Page Load Call. Why: Each state starts from a fresh load of its route. How: This opens the path on the suite's server.

	await curPagObj.evaluate( () => document.fonts.ready ); // What: Fonts Ready Wait. Why: Text measured before its web font loads would have the wrong size and wrapping. How: This waits until the fonts the page uses have loaded.

	if ( staRecObj.steStr !== undefined ) await steRunFun( curPagObj, staRecObj.steStr ); // What: Steps Call. Why: A screen past the first is reached by using the app. How: This runs the state's steps, when it has any.

	await waiSetFun( curPagObj ); // What: Settled Page Wait. Why: A check should see the page at rest, not mid-fade. How: This waits until the page stays still for half a second.


}

// #endregion opeStaFun

// #endregion Helpers



// #region Exports

export { opeStaFun, STA_REC_ARR, type StaRecTyp }; // What: Named Exports. Why: The suites share these states and their opener. How: This exports the state list, its type, and the helper that opens one.

// #endregion Exports


