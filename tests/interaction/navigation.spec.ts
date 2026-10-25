


// #region Imports

import { expect      } from '@playwright/test';     // What: Expect. Why: Each check passes only when the page shows what it should. How: This asserts on what each check reads.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: Each check opens and settles its state first. How: This loads it and waits for it.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: The checks reuse the shared states rather than defining their own. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.

// #endregion Imports



/**
 * navigation.spec.ts = Navigation Spec
 *
 * @summary
 * Checks how the app behaves when someone moves through it and uses its
 * controls, in whichever engine the project runs, such as an unknown address
 * opening the app at its root address.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DES_STA_ARR = STA_REC_ARR.filter( ( staRecObj ) => staRecObj.ideStr.endsWith( '-desktop' ) ); // What: Desktop State Array. Why: The skip link is checked once on every page, at desktop size. How: This takes the shared desktop state of each page.
const HOM_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'home-phone' )!;        // What: Home Phone Object. Why: The scroll checks start from the home page at the narrower of its two widths. How: This takes the shared home phone state. // What: Non-Null Note. Why: find's return type allows undefined. How: states.ts always lists the home-phone state.

// #endregion Constants



// #region Module Init

test( 'an unknown address opens the app at its root address', async ( { page : curPagObj } ) => { // What: Unknown Address Test. Why: Every address opens the app, and an address the app doesn't use shouldn't stay in the bar. How: This opens a made-up path with a query and a hash, then checks the address became the root and that the swap added no history entry.


	await curPagObj.addInitScript( () => sessionStorage.setItem( 'history-length-at-load', String( history.length ) ) ); // What: Load Length Record Call. Why: A browser counts its starting page in the history, more in some engines than others, so the check compares against the length before the app runs. How: This saves the tab's history length before the page's own scripts run.

	await curPagObj.goto( '/missing/page?from=test#part' ); // What: Unknown Address Load Call. Why: This is the navigation being checked. How: This opens a path the app doesn't use, with a query and a hash.

	await expect( curPagObj ).toHaveURL( '/' );                                                // What: Root Address Assertion. Why: The bar should show the app's own address, without the unknown path, query, or hash. How: This waits for the address to read the root.
	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Home Heading Assertion. Why: The app itself should be what's showing. How: This reads its one h1.

	expect( await curPagObj.evaluate( () => String( history.length ) === sessionStorage.getItem( 'history-length-at-load' ) ) ).toBe( true ); // What: Replaced Entry Assertion. Why: The root address should replace the unknown one rather than sit after it, so back doesn't return to it. How: This checks the tab's history is as long as it was when the page loaded.


} );



test( 'a reload returns the home page to where it was left', async ( { page : curPagObj } ) => { // What: Reload Position Test. Why: The hook takes over the browser's restoring, so a reload has to find the position it recorded. How: This scrolls the home page down, reloads it, and checks it opens at the same position.


	await curPagObj.setViewportSize( { height : 200, width : HOM_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for a restored position to mean anything. How: This makes the screen too short to show the whole home page.

	await curPagObj.goto( HOM_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the home page. How: This opens the root path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) );           // What: Bottom Scroll Call. Why: The position to return to has to be below the top. How: This jumps to the page's bottom, past any smooth scroll-behavior.
	await curPagObj.evaluate( () => new Promise( ( resProFun ) => requestAnimationFrame( () => requestAnimationFrame( resProFun ) ) ) ); // What: Two Frame Wait. Why: The scroll hook records a position from the scroll event, which the browser dispatches with its next frame, and a visitor never leaves within the same frame as a scroll. How: This waits two animation frames, after which that frame's scroll event has run.


	const leaScrNum = await curPagObj.evaluate( () => window.scrollY ); // What: Leaving Scroll Number. Why: The reload should return the page to this position. How: This reads how far down the page sits before the reload.


	expect( leaScrNum ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without anything restored. How: This checks the page sits below its top.

	await curPagObj.reload(); // What: Page Reload Call. Why: This is the navigation being checked. How: This reloads the home page.

	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBe( leaScrNum ); // What: Reloaded Position Assertion. Why: A reload should open the page where it was left. How: This polls the scroll position until it matches the leaving position.


} );



test( 'a fresh load of an address opens at its top, not where an earlier visit left it', async ( { page : curPagObj } ) => { // What: Fresh Load Test. Why: A new visit in the same tab reuses the first entry's default key, and shouldn't open where the last visit was left. How: This scrolls the home page down, loads its address afresh, and checks it opens at the top, then still does after a reload.


	await curPagObj.setViewportSize( { height : 200, width : HOM_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for a leftover position to mean anything. How: This makes the screen too short to show the whole home page.

	await curPagObj.goto( HOM_PHO_OBJ.patStr ); // What: Page Load Call. Why: The earlier visit starts on the home page. How: This opens the root path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) );           // What: Bottom Scroll Call. Why: The earlier visit has to leave a position below the top. How: This jumps to the page's bottom, past any smooth scroll-behavior.
	await curPagObj.evaluate( () => new Promise( ( resProFun ) => requestAnimationFrame( () => requestAnimationFrame( resProFun ) ) ) ); // What: Two Frame Wait. Why: The scroll hook records a position from the scroll event, which the browser dispatches with its next frame. How: This waits two animation frames, after which that frame's scroll event has run.

	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without a position to forget. How: This checks the page sits below its top.

	await curPagObj.goto( HOM_PHO_OBJ.patStr ); // What: Fresh Load Call. Why: This is the navigation being checked. How: This loads the same address again as a new navigation, not a reload.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Heading Assertion. Why: The position is read once the page has rendered and the hook has run. How: This waits for the home heading.

	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBe( 0 ); // What: Top Assertion. Why: A new visit should open at the top. How: This reads the scroll position once the page shows.

	await curPagObj.reload(); // What: Page Reload Call. Why: The fresh load has to forget the old position in storage too, or a reload before any scroll would bring it back. How: This reloads the page without scrolling it.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Reloaded Heading Assertion. Why: The position is read once the reloaded page has rendered. How: This waits for the home heading.

	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBe( 0 ); // What: Reloaded Top Assertion. Why: The reload should restore the fresh visit's top, not the earlier visit's position. How: This reads the scroll position once the page shows.


} );



test( 'malformed saved scroll positions are ignored rather than breaking the page', async ( { page : curPagObj } ) => { // What: Malformed Storage Test. Why: Session storage can hold something another version or a visitor left, and the scroll hook reads it as the app loads. How: This plants a value that parses but isn't a list of pairs before the app loads, scrolls so the recorder and its save run too, and checks the page raised no error.


	const errLisArr : string[] = []; // What: Error List Array. Why: An uncaught error in the page would mean the hook choked on the stored value. How: This collects every one the page raises.


	curPagObj.on( 'pageerror', ( errCurObj ) => errLisArr.push( errCurObj.message ) ); // What: Page Error Listener. Why: Errors thrown in the page don't fail the test by themselves. How: This records each one's message.

	await curPagObj.addInitScript( () => sessionStorage.setItem( 'scroll-positions', 'null' ) ); // What: Malformed Storage Plant. Why: A stored null parses as JSON, so only the hook's own checks can reject it. How: This writes it before the app's scripts run.

	await curPagObj.setViewportSize( { height : 200, width : HOM_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The recorder and its save should run after the planted value was read, and they only run on a page that scrolls. How: This makes the screen too short to show the whole home page.

	await curPagObj.goto( HOM_PHO_OBJ.patStr ); // What: Page Load Call. Why: The hook reads the planted value as the app loads. How: This opens the root path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) );           // What: Bottom Scroll Call. Why: The recorder writes its record after the planted value was read, so a recorder or save that misbehaved on what the load left in the map would raise an error. How: This jumps to the page's bottom.
	await curPagObj.evaluate( () => new Promise( ( resProFun ) => requestAnimationFrame( () => requestAnimationFrame( resProFun ) ) ) ); // What: Two Frame Wait. Why: The scroll event, and the recorder with it, runs with the next frame. How: This waits two animation frames.

	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll fires no scroll event, so the recorder and its save would never run and the check would cover only the load. How: This checks the page sits below its top.
	expect( errLisArr ).toEqual( [] );                                               // What: No Error Assertion. Why: The page passes only when the hook handled the bad value. How: This compares the collected errors with an empty list, so a failure prints each one.


} );



test( 'a hash added to the address is not overridden by a saved position', async ( { page : curPagObj } ) => { // What: Hash Entry Test. Why: A hash typed into the address adds an entry that shares the first entry's default key, whose saved position mustn't override the hash. How: This scrolls the home page down, adds the main element's hash to the address, and checks the page leaves the saved position for the main element's top, which is the page's own top here, so the check proves the saved position lost rather than which way the page got there.


	await curPagObj.setViewportSize( { height : 200, width : HOM_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to scroll for a saved position to differ from the section. How: This makes the screen too short to show the whole home page.

	await curPagObj.goto( HOM_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the home page, the visit's first entry. How: This opens the root path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) );           // What: Bottom Scroll Call. Why: The first entry needs a saved position below the section. How: This jumps to the page's bottom.
	await curPagObj.evaluate( () => new Promise( ( resProFun ) => requestAnimationFrame( () => requestAnimationFrame( resProFun ) ) ) ); // What: Two Frame Wait. Why: The scroll hook records a position from the scroll event, which the browser dispatches with its next frame. How: This waits two animation frames, after which that frame's scroll event has run.

	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would leave nothing saved to wrongly restore. How: This checks the page sits below its top.

	await curPagObj.evaluate( () => { location.hash = 'main'; } ); // What: Hash Change Call. Why: This is the navigation being checked, the same as typing the hash into the address. How: This adds #main to the address, which the router reports as a POP under the default key.

	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBe( 0 ); // What: Hash Target Assertion. Why: The page should land where the hash points, the main element at the page's top, not return to the saved position. How: This polls the scroll position until it reads 0.


} );



for ( const staRecObj of DES_STA_ARR ) { // What: Skip Link Loop. Why: Every page opens with the skip link. How: This declares one check per page's desktop state.


	test( `the first Tab in ${ staRecObj.ideStr } reaches the skip link, which moves focus to the main content`, async ( { browserName : broNamStr, page : curPagObj } ) => { // What: Skip Link Test. Why: A keyboard user has to be able to jump straight to the content. How: This presses Tab once, checks the skip link holds focus on screen, then clicks it and checks focus moved to the main element with a clean address.


		const skiLinLoc = curPagObj.getByRole( 'link', { name : 'Skip to main content' } ); // What: Skip Link Locator. Why: Each step below reaches the same link. How: This finds it by its role and name.



		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The skip link is checked on each page. How: This loads and settles the page at desktop size.

		await curPagObj.keyboard.press( broNamStr === 'webkit' ? 'Alt+Tab' : 'Tab' ); // What: First Tab Call. Why: The skip link should be the page's first stop. How: This presses Tab, or Alt+Tab in WebKit, whose plain Tab skips links the way Safari does by default.

		await expect( skiLinLoc ).toBeFocused();                   // What: Skip Focus Assertion. Why: The skip link has to be the page's first stop. How: This checks it holds focus after the first Tab.
		await expect( skiLinLoc ).toBeInViewport( { ratio : 1 } ); // What: Skip Shown Assertion. Why: A focused link waiting above the screen would leave a keyboard user lost. How: This checks it has slid fully into view.

		await skiLinLoc.click(); // What: Skip Click Call. Why: This is the action under test. How: This clicks the focused skip link.

		await expect( curPagObj.locator( 'main' ) ).toBeFocused();                     // What: Main Focus Assertion. Why: The jump has to land in the content, so the next Tab continues from there. How: This checks the main element holds focus.
		await expect( curPagObj ).toHaveURL( new RegExp( `${ staRecObj.patStr }$` ) ); // What: Clean Address Assertion. Why: The jump shouldn't leave a hash in the address. How: This checks the address still ends with the page's own path.


	} );


}

// #endregion Module Init


