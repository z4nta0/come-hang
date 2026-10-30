


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: The loading state waits until its loader has appeared. How: This retries its check until the status reads as loading.


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
	steStr? : 'chat' | 'create' | 'group' | 'loading' | 'sheet', // What: Steps String. Why: A screen past the first is reached by using the app, not by an address, and the waiting screen only by holding the app's check. How: This names the steps that reach it, none when left out.
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
 * width, some in dark mode too, the group sheet open on a phone, and the
 * waiting screen with its loader showing. Every
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
	{ heiNum : 900, ideStr : 'loading-desktop',      patStr : '/', widNum : 1440, steStr : 'loading'                    }, // What: Loading Desktop State. Why: The waiting screen is checked with its loader showing. How: This holds the app's check at 1,440px.
	{ heiNum : 844, ideStr : 'loading-phone',        patStr : '/', widNum : 390,  steStr : 'loading'                    }, // What: Loading Phone State. Why: The loader is checked at a phone width. How: This holds the app's check at 390px.
	{ heiNum : 900, ideStr : 'create-desktop',       patStr : '/', widNum : 1440, steStr : 'create'                     }, // What: Create Desktop State. Why: The form for starting a group is checked at a desktop width. How: This opens it at 1,440px.
	{ heiNum : 844, ideStr : 'create-phone',         patStr : '/', widNum : 390,  steStr : 'create'                     }, // What: Create Phone State. Why: The form is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 900, ideStr : 'group-desktop',        patStr : '/', widNum : 1440, steStr : 'group'                      }, // What: Group Desktop State. Why: The group frame is checked with its rail. How: This opens a new group at 1,440px.
	{ heiNum : 844, ideStr : 'group-phone',          patStr : '/', widNum : 390,  steStr : 'group'                      }, // What: Group Phone State. Why: The group frame is checked with its switcher. How: This opens a new group at 390px.
	{ heiNum : 900, ideStr : 'chat-desktop',         patStr : '/', widNum : 1440, steStr : 'chat'                       }, // What: Chat Desktop State. Why: A chat with an event and a message is checked at a desktop width. How: This fills a new group's chat at 1,440px.
	{ heiNum : 844, ideStr : 'chat-phone',           patStr : '/', widNum : 390,  steStr : 'chat'                       }, // What: Chat Phone State. Why: The chat is checked at a phone width. How: This fills a new group's chat at 390px.
	{ heiNum : 844, ideStr : 'chat-phone-dark',      patStr : '/', widNum : 390,  schStr : 'dark', steStr : 'chat'      }, // What: Chat Phone Dark State. Why: The chat's dark colors are checked too. How: This fills a new group's chat at 390px with the phone set to dark.
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



// #region datHolFun

/**
 * datHolFun = Database Hold Function
 *
 * @summary
 * Runs in the page before the app loads and holds back the opening of the
 * app's IndexedDB database, which the app reads before choosing a screen, so
 * the waiting screen shows. The open's success is stopped before the app
 * hears it, then sent again after the given delay, or never for a negative
 * one. Other databases, such as Firebase's own, open as usual.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param holMilNum - Hold Milliseconds Number: How long to hold the open, or
 *                    a negative number to hold it for good.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * page.addInitScript(datHolFun, 1500) // => void
 * ```
 *
*/

const datHolFun = ( holMilNum : number ) : void => { // What: Database Hold Function. Why: A launch is usually too quick to see the waiting screen. How: This delays the app's database opening.


	const oriOpeFun = IDBFactory.prototype.open; // What: Original Open Function. Why: Every open still goes through the browser's own. How: This keeps it.



	IDBFactory.prototype.open = function ( this : IDBFactory, datNamStr : string, verValNum? : number ) : IDBOpenDBRequest { // What: Open Override Function. Why: Only the app's database is held. How: This opens as usual and holds the app's open's success.


		const opeReqObj = oriOpeFun.call( this, datNamStr, verValNum ); // What: Open Request Object. Why: The database still opens. How: This asks the browser to open it.


		if ( datNamStr !== 'come-hang' ) return opeReqObj; // What: Other Database Guard. Why: Firebase's databases aren't the app's check. How: This returns them untouched.



		opeReqObj.addEventListener( 'success', ( sucEveObj ) => { // What: Success Hold Listener. Why: The app's own handler, added after this one, mustn't hear the open yet. How: This stops the event and sends it again later, once.


			sucEveObj.stopImmediatePropagation(); // What: Success Stop Call. Why: The app waits while the open is held. How: This keeps the event from the app's handler.


			if ( holMilNum >= 0 ) setTimeout( () => opeReqObj.dispatchEvent( new Event( 'success' ) ), holMilNum ); // What: Success Resend Call. Why: A held open ends after its delay. How: This sends the event again once the delay passes, which this listener, run once, no longer stops.


		}, { once : true } );



		return opeReqObj; // What: Request Return. Why: The app works with the request as usual. How: This returns it.


	};


};

// #endregion datHolFun



// #region chaSteFun

/**
 * chaSteFun = Chat Steps Function
 *
 * @summary
 * Fills a new group's chat the way a member would: plans Friendsgiving at
 * Dana's place two days from now, which the chat pins, and sends a message
 * from the composer. The first send can be refused while the group's
 * membership mirror catches up, which leaves the text in the box, so Enter
 * is pressed again until the message shows in the log.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page showing the new group.
 *
 * @returns A promise that settles once the message shows, with no value.
 *
 * @example
 * ```ts
 * chaSteFun(page) // => Promise<void>
 * ```
 *
*/

async function chaSteFun ( curPagObj : Page ) : Promise< void > {


	await curPagObj.evaluate( async () => { // What: Event Plan Call. Why: There's no screen for planning events yet, so the module plans it, as the app would. How: This finds the group and plans an event in it.


		const modPatArr = [ '/src/state/events.ts', '/src/state/groups.ts' ];                                               // What: Module Path Array. Why: The dev server serves the app's source by path. How: This names the modules used.
		const [ eveModObj, groModObj ] = await Promise.all( modPatArr.map( ( modPatStr ) => import( /* @vite-ignore */ modPatStr ) ) ); // What: Page Modules. Why: The page runs the real modules. How: This imports both.
		const groIdeStr : string = await new Promise( ( resValFun ) => void groModObj.groWatFun( ( groRecArr : { ideStr : string }[] ) => { if ( groRecArr.length > 0 ) resValFun( groRecArr[ 0 ].ideStr ); } ) ); // What: Group Identifier String. Why: The event is planned in the new group. How: This reads the one group the list reports.
		const staTimNum = Date.now() + 2 * 86400000;                                                                         // What: Start Time Number. Why: The pinned event is still to come. How: This starts it two days from now.


		await eveModObj.eveCreFun( groIdeStr, { desTexStr : '', endTimNum : staTimNum + 4 * 3600000, locTexStr : "Dana's place", staTimNum, titTexStr : 'Friendsgiving' } ); // What: Event Create Call. Why: The chat pins the group's next event. How: This plans a four-hour event.


	} );

	await curPagObj.getByLabel( 'Message', { exact : true } ).fill( 'Leaving in 10, the pie is safe.' ); // What: Message Fill Call. Why: The log should hold a message. How: This types one into the composer.

	await expect( async () => { // What: Send Retry Call. Why: A send before the membership mirror catches up is refused and leaves its text. How: This presses Enter until the message shows.


		await curPagObj.getByLabel( 'Message', { exact : true } ).press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it in the composer.

		await expect( curPagObj.getByRole( 'log' ) ).toContainText( 'Leaving in 10, the pie is safe.', { timeout : 2000 } ); // What: Message Shown Assertion. Why: The send landed once the log holds it. How: This waits up to 2 seconds for it.


	} ).toPass(); // What: Retry Settings. Why: The mirror usually catches up within a moment. How: This retries until the message shows or the test times out.


}

// #endregion chaSteFun



// #region steRunFun

/**
 * steRunFun = Steps Run Function
 *
 * @summary
 * Takes a loaded page to the screen a state names by using the app as a person
 * would: the loading state waits for the loader on a page whose database is
 * held ({@link datHolFun}), the create state opens the form for starting a
 * group and reloads it, so it shows with nothing focused, the group state
 * creates a group named Beach Day, for the chat state fills its chat ({@link
 * chaSteFun}), and then opens the app afresh, so the group shows as it does on
 * a later visit, with nothing focused, and the sheet state also opens the
 * group sheet from its switcher. A group needs the Firebase Emulators, which
 * the suites that reach one run inside.
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

async function steRunFun ( curPagObj : Page, steStr : 'chat' | 'create' | 'group' | 'loading' | 'sheet' ) : Promise< void > {


	if ( steStr === 'loading' ) { // What: Loading Block. Why: The loading state stops at the waiting screen, its database held since before the load. How: This waits for the loader's status and stops.


		await expect( curPagObj.getByRole( 'status' ) ).toHaveText( 'Loading' ); // What: Loader Wait. Why: The loader shows once its delay passes. How: This waits for its status message.



		return; // What: Loading Return. Why: Nothing more reaches this screen. How: This returns.


	}



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

	if ( steStr === 'chat' ) await chaSteFun( curPagObj ); // What: Chat Steps Call. Why: The chat state shows a planned event and a message. How: This plans one and sends one.

	await curPagObj.goto( '/' ); // What: Fresh Open Call. Why: A later visit shows the group without the focus its creation gave it. How: This opens the app again.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ).waitFor(); // What: Reopened Group Wait. Why: The group shows once its list has loaded. How: This waits for its heading.


	if ( steStr !== 'sheet' ) return; // What: Frame Guard. Why: The group and chat states stop at the frame. How: This returns for every state but the sheet's.



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
 * color scheme, sizes the viewport, holds the app's database for the loading
 * state, loads the path, waits for the web fonts, runs the state's steps
 * ({@link steRunFun}), then waits until the page stays still ({@link
 * waiSetFun}), so a check never measures a heading halfway through an
 * entrance fade.
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

	if ( staRecObj.steStr === 'loading' ) await curPagObj.addInitScript( datHolFun, -1 ); // What: Database Hold Call. Why: The waiting screen shows only while the app's check is held. How: This holds the app's database for good, before the page loads.

	await curPagObj.goto( staRecObj.patStr ); // What: Page Load Call. Why: Each state starts from a fresh load of its route. How: This opens the path on the suite's server.

	await curPagObj.evaluate( () => document.fonts.ready ); // What: Fonts Ready Wait. Why: Text measured before its web font loads would have the wrong size and wrapping. How: This waits until the fonts the page uses have loaded.

	if ( staRecObj.steStr !== undefined ) await steRunFun( curPagObj, staRecObj.steStr ); // What: Steps Call. Why: A screen past the first is reached by using the app. How: This runs the state's steps, when it has any.

	await waiSetFun( curPagObj ); // What: Settled Page Wait. Why: A check should see the page at rest, not mid-fade. How: This waits until the page stays still for half a second.


}

// #endregion opeStaFun

// #endregion Helpers



// #region Exports

export { datHolFun, opeStaFun, STA_REC_ARR, type StaRecTyp }; // What: Named Exports. Why: The suites share these states, their opener, and the hold that slows the app's launch. How: This exports the state list, its type, and the two helpers.

// #endregion Exports


