


// #region Imports

import { expect      } from '@playwright/test';     // What: Expect. Why: Each check asserts on the note, the reload, and the update check. How: This compares what each check reads with what it should be.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: Each test starts from one of the suites' shared states. How: This opens one.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: The tests open the chat, photo, and sheet states. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each case of the update flow is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helpers drive a Playwright page. How: This types their page parameter.

// #endregion Imports



/**
 * update.spec.ts = Update Spec
 *
 * @summary
 * Checks how the app takes a newly deployed version, in whichever engine the
 * project runs. The dev server registers no service worker, so an init
 * script fakes the parts the app reads: a worker already controlling the
 * page, a registration whose update call it counts, and the page's
 * visibility, which each test switches. A new version taking control of a
 * visible app shows the update note, whose Reload button reloads; one taking
 * control of a hidden app with nothing being edited reloads it at once, as
 * it does with a field showing its saved value; a draft in the chat's box,
 * a picked photo, or an open sheet makes it wait with the note, the draft's
 * reload coming once the draft is gone; a send on its way holds it until it
 * lands; the app looks for a new version each time it comes back to the
 * foreground; and a worker taking control of a page that had none shows
 * nothing.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

declare global { // What: Global Declaration. Why: The test's own window values have to type check in the page functions. How: This adds them to the browser's Window.


	interface Window { // What: Window Interface. Why: Only an interface merges with the built-in Window. How: This declares the values the init script and the tests set.


		__holEndFun? : () => void; // What: Hold End Function. Why: The held send test lands its send when it chooses. How: The held call stores its resolver here.
		__stiMarBoo? : boolean;    // What: Still Mark Boolean. Why: A reload clears it, so its survival proves none came. How: The waiting tests set it.
		__updCheNum? : number;     // What: Update Check Number. Why: Each return to the app should ask for an update. How: The fake registration counts its update calls here.
		__visStaStr? : string;     // What: Visibility State String. Why: The tests decide when the app counts as hidden. How: The faked visibility reads it.


	}


}

// #endregion Types



// #region Constants

const CHA_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'chat-phone' )!;     // What: Chat Phone Object. Why: Most tests start from a group's chat. How: This finds the shared chat state at phone size. // What: Non-Null Note. Why: The shared states always include chat-phone. How: The ! reads it as found.
const NOT_MES_STR = 'A new version of Come Hang is ready.';                                      // What: Note Message String. Why: The note is found by its message. How: This is the text it shows.
const PHO_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'photo-phone' )!;    // What: Photo Phone Object. Why: A photo picked in the composer is checked from its own state. How: This finds the shared photo state. // What: Non-Null Note. Why: The shared states always include photo-phone. How: The ! reads it as found.
const SET_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'settings-phone' )!; // What: Settings Phone Object. Why: The group's name box starts holding its saved name. How: This finds the shared Settings state. // What: Non-Null Note. Why: The shared states always include settings-phone. How: The ! reads it as found.
const SHE_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'sheet-phone' )!;    // What: Sheet Phone Object. Why: An open sheet is checked from its own state. How: This finds the shared sheet state. // What: Non-Null Note. Why: The shared states always include sheet-phone. How: The ! reads it as found.

// #endregion Constants



// #region Helpers

const conChaFun = ( curPagObj : Page ) => curPagObj.evaluate( () => navigator.serviceWorker.dispatchEvent( new Event( 'controllerchange' ) ) ); // What: Controller Change Function. Why: A new version taking control is what starts the flow. How: This fires the container's controllerchange event.
const stiGetFun = ( curPagObj : Page ) => curPagObj.evaluate( () => window.__stiMarBoo === true );                                              // What: Still Get Function. Why: A page that kept its mark hasn't reloaded. How: This reads the mark.
const stiSetFun = ( curPagObj : Page ) => curPagObj.evaluate( () => { window.__stiMarBoo = true; } );                                           // What: Still Set Function. Why: A reload clears anything the page set. How: This marks the page.



// #region fakWorFun

/**
 * fakWorFun = Fake Worker Function
 *
 * @summary
 * Adds an init script, run before the app's own code on every load, that
 * gives the page a fake controlling worker when asked for one, a fake
 * registration whose update calls it counts in `__updCheNum`, and a
 * visibility state read from `__visStaStr`, visible by default.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to fake the worker on.
 * @param conHasBoo - Controller Has Boolean: Whether a worker controls the
 *                    page at load, false for a page that had none.
 *
 * @returns A promise that settles once the script is added, with no value.
 *
 * @example
 * ```ts
 * await fakWorFun(page, true) // => Promise<void>
 * ```
 *
*/

async function fakWorFun ( curPagObj : Page, conHasBoo : boolean ) : Promise< void > {


	await curPagObj.addInitScript( ( iniConBoo ) => { // What: Fake Worker Script. Why: The dev server registers no worker, so the update flow's inputs are faked. How: This replaces the controller, the registration lookup, and the visibility state before the app loads.


		const worConObj = navigator.serviceWorker; // What: Worker Container Object. Why: The app listens for control changes on it. How: This reads the page's container.


		if ( !worConObj ) return; // What: No Container Guard. Why: A page without the container can't run the flow. How: This stops.



		Object.defineProperty( worConObj, 'controller', { configurable : true, get : () => ( iniConBoo ? {} : null ) } );                                                                           // What: Controller Fake. Why: An update is a new worker replacing one that already controlled the page. How: This reports a controller, or none.
		Object.defineProperty( worConObj, 'getRegistration', { configurable : true, value : async () => ( { update : async () => { window.__updCheNum = ( window.__updCheNum ?? 0 ) + 1; } } ) } ); // What: Registration Fake. Why: The update check asks the registration to look for a new version. How: This returns one whose update call adds one to __updCheNum.
		Object.defineProperty( document, 'visibilityState', { configurable : true, get : () => window.__visStaStr ?? 'visible' } );                                                                 // What: Visibility Fake. Why: Each test decides when the app counts as hidden. How: This reports __visStaStr, visible by default.


	}, conHasBoo ); // What: Script Argument. Why: The page can't read this file's variables. How: This hands in whether a worker controls the page at load.


}

// #endregion fakWorFun



// #region visSetFun

/**
 * visSetFun = Visibility Set Function
 *
 * @summary
 * Sets the faked visibility state and fires the page's visibilitychange
 * event, the way switching away from the app or back to it does.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to switch.
 * @param visStaStr - Visibility State String: 'hidden' or 'visible'.
 *
 * @returns A promise that settles once the event is fired, with no value.
 *
 * @example
 * ```ts
 * await visSetFun(page, 'hidden') // => Promise<void>
 * ```
 *
*/

async function visSetFun ( curPagObj : Page, visStaStr : string ) : Promise< void > {


	await curPagObj.evaluate( ( newStaStr ) => { // What: Visibility Switch Call. Why: The app reacts to the page being hidden or shown. How: This sets the faked state and fires the event.


		window.__visStaStr = newStaStr; // What: Visibility State Assignment. Why: The faked visibility reads it. How: This stores the new state.


		document.dispatchEvent( new Event( 'visibilitychange' ) ); // What: Visibility Event Dispatch. Why: The app listens for this event. How: This fires it on the document.


	}, visStaStr ); // What: Visibility Argument. Why: The page can't read this file's variables. How: This hands in the new state.


}

// #endregion visSetFun



// #region waiCheFun

/**
 * waiCheFun = Wait Check Function
 *
 * @summary
 * Marks the page, hides the app, fires a new version taking control, and
 * checks the page kept its mark, so no reload came, and that the update
 * note shows once the app is visible again. It expects the page already
 * holding whatever should make the update wait.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to check.
 *
 * @returns A promise that settles once the checks pass, with no value.
 *
 * @example
 * ```ts
 * await waiCheFun(page) // => Promise<void>
 * ```
 *
*/

async function waiCheFun ( curPagObj : Page ) : Promise< void > {


	await stiSetFun( curPagObj ); // What: Still Mark Call. Why: A reload would clear the mark. How: This marks the page.

	await visSetFun( curPagObj, 'hidden' ); // What: Hide Call. Why: The app would reload if nothing were being edited. How: This hides it.

	await conChaFun( curPagObj ); // What: Control Change Call. Why: A new version has taken over. How: This fires the event.

	await curPagObj.evaluate( () => new Promise( ( resValFun ) => window.setTimeout( resValFun, 50 ) ) ); // What: Settle Wait. Why: The reload is tried after the current task, so a check made sooner would come before it. How: This waits 50ms in the page.

	expect( await stiGetFun( curPagObj ) ).toBe( true ); // What: No Reload Assertion. Why: What the member was doing must survive. How: This checks the page's mark is still set.

	await visSetFun( curPagObj, 'visible' ); // What: Show Call. Why: The member comes back. How: This shows the app again.

	await expect( curPagObj.getByText( NOT_MES_STR ) ).toBeVisible(); // What: Note Shown Assertion. Why: The update waits for the member. How: This checks the note shows.


}

// #endregion waiCheFun

// #endregion Helpers



// #region Module Init

test( 'a new version reaching a visible app shows the note, whose Reload button reloads', async ( { page : curPagObj } ) => { // What: Visible Update Test. Why: A member using the app chooses when to load a new version. How: This fires a control change with the app visible, checks the note shows, and waits for its Reload button's reload.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, CHA_PHO_OBJ ); // What: Chat Open Call. Why: The note shows over a real screen. How: This opens a group's chat.

	await conChaFun( curPagObj ); // What: Control Change Call. Why: A new version has taken over. How: This fires the event.


	await expect( curPagObj.getByText( NOT_MES_STR ) ).toBeVisible(); // What: Note Shown Assertion. Why: A visible app doesn't reload under the member. How: This checks the note shows.


	await Promise.all( [ curPagObj.waitForEvent( 'load' ), curPagObj.getByRole( 'button', { exact : true, name : 'Reload' } ).click() ] ); // What: Reload Click Call. Why: The button loads the new version. How: This presses it and waits for the page to load again.


} );



test( 'a new version reaching a hidden app with nothing being edited reloads it', async ( { page : curPagObj } ) => { // What: Hidden Update Test. Why: An app out of sight can take the new version unseen. How: This hides the app, fires a control change, and waits for the reload.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, CHA_PHO_OBJ ); // What: Chat Open Call. Why: The chat's box sits empty, as it does after a message is sent. How: This opens a group's chat.

	await curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ).focus(); // What: Box Focus Call. Why: The box keeps focus after a send, and an empty box holds nothing to lose. How: This focuses it.

	await visSetFun( curPagObj, 'hidden' ); // What: Hide Call. Why: The quiet reload happens only out of sight. How: This hides the app.


	await Promise.all( [ curPagObj.waitForEvent( 'load' ), conChaFun( curPagObj ) ] ); // What: Hidden Reload Wait. Why: Nothing is being edited, so the app reloads at once. How: This fires the control change and waits for the page to load again.


} );



test( "a draft in the chat's box makes the update wait, and it reloads once the draft is gone", async ( { page : curPagObj } ) => { // What: Draft Update Test. Why: A half-written message would be lost to a reload. How: This types in the chat's box, moves focus off it, and checks the update waits, then empties the box and waits for the reload on the next hide.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, CHA_PHO_OBJ ); // What: Chat Open Call. Why: The draft is typed in the chat. How: This opens a group's chat.


	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ); // What: Text Box Object. Why: The draft is typed there. How: This finds the composer.


	await texBoxObj.fill( 'See you at' ); // What: Draft Fill Call. Why: A message is half written. How: This types it.

	await texBoxObj.blur(); // What: Box Blur Call. Why: A draft counts even once focus has moved off it. How: This moves focus away.

	await waiCheFun( curPagObj ); // What: Wait Check Call. Why: The draft has to survive. How: This checks no reload comes and the note shows.

	await texBoxObj.fill( '' ); // What: Draft Clear Call. Why: With nothing left to lose, the next hide can reload. How: This empties the box.

	await texBoxObj.blur(); // What: Box Blur Call. Why: The app is left as a member would leave it. How: This moves focus away.


	await Promise.all( [ curPagObj.waitForEvent( 'load' ), visSetFun( curPagObj, 'hidden' ) ] ); // What: Retry Reload Wait. Why: A waiting update is tried again each time the app is hidden. How: This hides the app and waits for the page to load again.


} );



test( "a field showing its saved value, such as the group's name in Settings, doesn't make the update wait", async ( { page : curPagObj } ) => { // What: Saved Value Update Test. Why: A box that starts with what's saved holds nothing new to lose. How: This opens the owner's Settings, where the name box holds the group's name, hides the app, fires a control change, and waits for the reload.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, SET_PHO_OBJ ); // What: Settings Open Call. Why: The name box shows the group's saved name. How: This opens the owner's Settings.

	await expect( curPagObj.getByRole( 'textbox', { exact : true, name : 'Group name' } ) ).not.toHaveValue( '' ); // What: Saved Name Assertion. Why: The test means something only while the box holds text. How: This checks it isn't empty.

	await visSetFun( curPagObj, 'hidden' ); // What: Hide Call. Why: The quiet reload happens only out of sight. How: This hides the app.


	await Promise.all( [ curPagObj.waitForEvent( 'load' ), conChaFun( curPagObj ) ] ); // What: Hidden Reload Wait. Why: The saved name isn't a draft, so the app reloads at once. How: This fires the control change and waits for the page to load again.


} );



test( 'a photo picked in the chat makes the update wait', async ( { page : curPagObj } ) => { // What: Picked Photo Update Test. Why: A picked photo would have to be picked again after a reload. How: This opens the chat with a photo picked and checks the update waits.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, PHO_PHO_OBJ ); // What: Photo Open Call. Why: The photo state leaves a photo picked in the composer. How: This opens it.

	await waiCheFun( curPagObj ); // What: Wait Check Call. Why: The picked photo has to survive. How: This checks no reload comes and the note shows.


} );



test( 'an open sheet makes the update wait', async ( { page : curPagObj } ) => { // What: Open Sheet Update Test. Why: A sheet holds a form or a choice the member is making. How: This opens the sheet state and checks the update waits.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, SHE_PHO_OBJ ); // What: Sheet Open Call. Why: The sheet state leaves a sheet open over the chat. How: This opens it.

	await waiCheFun( curPagObj ); // What: Wait Check Call. Why: The open sheet has to survive. How: This checks no reload comes and the note shows.


} );



test( 'a send on its way makes a hidden app wait, and it reloads once the send lands', async ( { page : curPagObj } ) => { // What: Held Send Update Test. Why: A reload would cut off a message or upload on its way. How: This starts a held call, hides the app, fires a control change, checks no reload comes, then lands the call and waits for the reload.


	await fakWorFun( curPagObj, true ); // What: Worker Fake Call. Why: The flow needs a controlled page. How: This fakes one.

	await opeStaFun( curPagObj, CHA_PHO_OBJ ); // What: Chat Open Call. Why: The app should be in use, with nothing being edited. How: This opens a group's chat.

	await curPagObj.evaluate( async ( modPatStr ) => { // What: Held Call Start. Why: A send on its way holds the reload. How: This wraps a call that lands only when the test says so, and starts it.


		const modValObj = await import( /* @vite-ignore */ modPatStr ) as { updHolFun : ( runFun : () => Promise< void > ) => () => Promise< void > }; // What: Module Value Object. Why: The test holds the reload the way the app's sends do. How: This imports the app's own update module. // What: Type Assertion Note. Why: A dynamic import of a path held in a variable is untyped. How: The as names the one function used.


		void modValObj.updHolFun( () => new Promise( ( resValFun ) => { window.__holEndFun = () => resValFun(); } ) )(); // What: Held Call. Why: The call stands in for a send that hasn't landed. How: This starts it and keeps its resolver on the window.


	}, '/src/platform/update.ts' ); // What: Module Path Argument. Why: The page imports the app's own update module by its path. How: This hands the path in.

	await stiSetFun( curPagObj ); // What: Still Mark Call. Why: A reload would clear the mark. How: This marks the page.

	await visSetFun( curPagObj, 'hidden' ); // What: Hide Call. Why: The app would reload if nothing were on its way. How: This hides it.

	await conChaFun( curPagObj ); // What: Control Change Call. Why: A new version has taken over. How: This fires the event.

	await curPagObj.evaluate( () => new Promise( ( resValFun ) => window.setTimeout( resValFun, 50 ) ) ); // What: Settle Wait. Why: The reload is tried after the current task, so a check made sooner would come before it. How: This waits 50ms in the page.


	expect( await stiGetFun( curPagObj ) ).toBe( true ); // What: No Reload Assertion. Why: The send on its way must survive. How: This checks the page's mark is still set.


	await Promise.all( [ curPagObj.waitForEvent( 'load' ), curPagObj.evaluate( () => window.__holEndFun?.() ) ] ); // What: Landed Reload Wait. Why: Once the send lands, nothing holds the reload. How: This lands the call and waits for the page to load again.


} );



test( 'coming back to the app looks for a new version, and a worker taking control of a page that had none shows nothing', async ( { page : curPagObj } ) => { // What: Update Check Test. Why: An app left open never looks for a new version by itself, and a page that had no worker isn't being updated. How: This shows the app twice and checks each asks for an update, then fires a control change with no earlier controller and checks the note's region stays empty.


	await fakWorFun( curPagObj, false ); // What: Worker Fake Call. Why: The page has no controller at load. How: This fakes the page without one.

	await opeStaFun( curPagObj, CHA_PHO_OBJ ); // What: Chat Open Call. Why: The app should be in use. How: This opens a group's chat.

	await visSetFun( curPagObj, 'hidden' );  // What: Hide Call. Why: The check runs on coming back. How: This hides the app first.
	await visSetFun( curPagObj, 'visible' ); // What: Show Call. Why: Coming back asks for an update. How: This shows the app.
	await visSetFun( curPagObj, 'hidden' );  // What: Hide Again Call. Why: Each return asks again. How: This hides the app once more.
	await visSetFun( curPagObj, 'visible' ); // What: Show Again Call. Why: The second return asks again. How: This shows the app.

	await expect.poll( () => curPagObj.evaluate( () => window.__updCheNum ?? 0 ) ).toBe( 2 ); // What: Update Check Assertion. Why: Each return should look for a new version. How: This waits until two checks were counted.

	await conChaFun( curPagObj ); // What: Control Change Call. Why: A worker taking control of a page that had none fires the same event. How: This fires it with no earlier controller.


	await expect( curPagObj.locator( '[data-element-name-hook~="updNotDiv"]' ) ).toBeEmpty(); // What: No Note Assertion. Why: A page that had no worker isn't being updated. How: This checks the note's region stays empty.


} );

// #endregion Module Init


