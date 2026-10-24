


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
 * landing on the 404 page or the skip link moving focus to the content.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DES_STA_ARR = STA_REC_ARR.filter( ( staRecObj ) => staRecObj.ideStr.endsWith( '-desktop' ) ); // What: Desktop State Array. Why: The skip link is checked once on every page, at the size a keyboard user most often browses at. How: This takes the shared desktop state of each page.
const NOF_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'not-found-phone' )!;   // What: Not-Found Phone Object. Why: The 404 page checks start from it, since most people use the app on a phone. How: This takes the shared 404 phone state. // What: Non-Null Note. Why: find's return type allows undefined. How: states.ts always lists the not-found-phone state.

// #endregion Constants



// #region Module Init

test( 'an unknown address shows the 404 page, marked noindex', async ( { page : curPagObj } ) => { // What: Not Found Test. Why: A mistyped or outdated address should land somewhere useful, and never in search results. How: This opens an unknown path and checks the heading, the title, and the robots tag.


	await opeStaFun( curPagObj, NOF_PHO_OBJ ); // What: State Open Call. Why: The checks read the settled 404 page. How: This loads and settles it.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Page Not Found' );     // What: Heading Assertion. Why: The page should say what happened. How: This reads its one h1.
	await expect( curPagObj ).toHaveTitle( 'Page Not Found | Come Hang' );                              // What: Title Assertion. Why: The tab should name the 404 page. How: This reads the document's title.
	await expect( curPagObj.locator( 'meta[name="robots"]' ) ).toHaveAttribute( 'content', 'noindex' ); // What: Robots Assertion. Why: The host answers unknown paths with a 200, so search engines must be told to skip the page. How: This reads the robots tag's content.


} );



test( "the 404 page's link opens the home page at its top", async ( { page : curPagObj } ) => { // What: Way Onward Test. Why: The 404 page's link is its way back into the app, and a new page should open at its top. How: This scrolls the 404 page down, clicks the link, and checks the home page is already at its top when it shows.


	await curPagObj.setViewportSize( { height : 200, width : NOF_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for the scroll reset to mean anything. How: This makes the screen too short to show the whole 404 page.

	await curPagObj.goto( NOF_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the 404 page. How: This opens the unknown path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) ); // What: Bottom Scroll Call. Why: The reset only proves something if the page starts scrolled down. How: This jumps to the page's bottom, past any smooth scroll-behavior.

	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without the reset. How: This checks the page sits below its top.

	await curPagObj.getByRole( 'link', { name : 'Go to the home page' } ).click(); // What: Link Click Call. Why: This is the navigation being checked. How: Playwright clicks the link, already in view at the page's bottom.

	await expect( curPagObj ).toHaveURL( '/' );                                                // What: Address Assertion. Why: The link leads to the home page. How: This reads the address.
	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Home Heading Assertion. Why: The home page should be what's showing. How: This reads its one h1.
	await expect( curPagObj.locator( 'meta[name="robots"]' ) ).toHaveCount( 0 );               // What: Robots Removed Assertion. Why: The home page must not keep the 404 page's noindex. How: This checks the tag left with the page.
	expect( await curPagObj.evaluate( () => window.scrollY ) ).toBe( 0 );                      // What: Top Assertion. Why: A new page should open at its top at once, not glide there under the stylesheet's smooth scroll-behavior. How: This reads the scroll position once, as soon as the home page shows, which a smooth scroll still under way would fail.


} );



test( 'back from the home page returns the 404 page to where it was left', async ( { page : curPagObj } ) => { // What: Back Position Test. Why: Back and forward are left to the browser, which should return the visitor to where they were. How: This scrolls the 404 page down, follows its link home, goes back, and checks the 404 page is scrolled down again.


	await curPagObj.setViewportSize( { height : 200, width : NOF_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for a restored position to mean anything. How: This makes the screen too short to show the whole 404 page.

	await curPagObj.goto( NOF_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the 404 page. How: This opens the unknown path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) ); // What: Bottom Scroll Call. Why: The position to return to has to be below the top. How: This jumps to the page's bottom, past any smooth scroll-behavior.

	await curPagObj.evaluate( () => new Promise( ( resFun ) => requestAnimationFrame( () => requestAnimationFrame( resFun ) ) ) ); // What: Two Frame Wait. Why: The scroll hook records a position from the scroll event, which the browser dispatches with its next frame, and a visitor never leaves within the same frame as a scroll. How: This waits two animation frames, after which that frame's scroll event has run.


	const leaScrNum = await curPagObj.evaluate( () => window.scrollY ); // What: Leaving Scroll Number. Why: Back should return the page to this position. How: This reads how far down the page sits before the link is followed.


	expect( leaScrNum ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without anything restored. How: This checks the page sits below its top.

	await curPagObj.getByRole( 'link', { name : 'Go to the home page' } ).click(); // What: Link Click Call. Why: The visitor leaves for the home page. How: This clicks the 404 page's link.

	await expect( curPagObj ).toHaveURL( '/' ); // What: Home Address Assertion. Why: Back has to start from the home page. How: This waits for the address to change.

	await curPagObj.goBack(); // What: Back Navigation Call. Why: This is the navigation being checked. How: This presses the browser's back.

	await expect( curPagObj ).toHaveURL( NOF_PHO_OBJ.patStr );                               // What: Return Address Assertion. Why: Back should land on the 404 page again. How: This waits for the address to change back.
	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBe( leaScrNum ); // What: Restored Position Assertion. Why: Back should return the page exactly where it was left, in every engine, even though the home page is too short to scroll that far. How: This polls the scroll position until it matches the leaving position.


} );



test( 'a reload returns the 404 page to where it was left', async ( { page : curPagObj } ) => { // What: Reload Position Test. Why: The hook takes over the browser's restoring, so a reload has to find the position it recorded. How: This scrolls the 404 page down, reloads it, and checks it opens at the same position.


	await curPagObj.setViewportSize( { height : 200, width : NOF_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for a restored position to mean anything. How: This makes the screen too short to show the whole 404 page.

	await curPagObj.goto( NOF_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the 404 page. How: This opens the unknown path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) ); // What: Bottom Scroll Call. Why: The position to return to has to be below the top. How: This jumps to the page's bottom, past any smooth scroll-behavior.

	await curPagObj.evaluate( () => new Promise( ( resFun ) => requestAnimationFrame( () => requestAnimationFrame( resFun ) ) ) ); // What: Two Frame Wait. Why: The scroll hook records a position from the scroll event, which the browser dispatches with its next frame, and a visitor never leaves within the same frame as a scroll. How: This waits two animation frames, after which that frame's scroll event has run.


	const leaScrNum = await curPagObj.evaluate( () => window.scrollY ); // What: Leaving Scroll Number. Why: The reload should return the page to this position. How: This reads how far down the page sits before the reload.


	expect( leaScrNum ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without anything restored. How: This checks the page sits below its top.

	await curPagObj.reload(); // What: Page Reload Call. Why: This is the navigation being checked. How: This reloads the 404 page.

	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBe( leaScrNum ); // What: Reloaded Position Assertion. Why: A reload should open the page where it was left. How: This polls the scroll position until it matches the leaving position.


} );



for ( const staRecObj of DES_STA_ARR ) { // What: Skip Link Loop. Why: Every page opens with the skip link. How: This declares one check per page's desktop state.


	test( `the first Tab in ${ staRecObj.ideStr } reaches the skip link, which moves focus to the main content`, async ( { browserName : broNamStr, page : curPagObj } ) => { // What: Skip Link Test. Why: A keyboard user has to be able to jump straight to the content. How: This presses Tab once, checks the skip link holds focus on screen, then clicks it and checks focus moved to the main element with a clean address.


		const skiLinLoc = curPagObj.getByRole( 'link', { name : 'Skip to main content' } ); // What: Skip Link Locator. Why: Each step below reaches the same link. How: This finds it by its role and name.



		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The skip link is checked on each page. How: This loads and settles the page at desktop size.

		await curPagObj.keyboard.press( broNamStr === 'webkit' ? 'Alt+Tab' : 'Tab' ); // What: First Tab Call. Why: The skip link should be the page's first stop. How: This presses Tab, or Alt+Tab in WebKit, whose plain Tab skips links the way Safari does by default.

		await expect( skiLinLoc ).toBeFocused();                   // What: Skip Focus Assertion. Why: The skip link has to be the page's first stop. How: This checks it holds focus after the first Tab.
		await expect( skiLinLoc ).toBeInViewport( { ratio : 1 } ); // What: Skip Shown Assertion. Why: A focused link waiting above the screen would leave a keyboard user lost. How: This checks it has slid fully into view.

		await skiLinLoc.click(); // What: Skip Click Call. Why: This is the action under test. How: This clicks the focused skip link.

		await expect( curPagObj.locator( 'main' ) ).toBeFocused();                   // What: Main Focus Assertion. Why: The jump has to land in the content, so the next Tab continues from there. How: This checks the main element holds focus.
		await expect( curPagObj ).toHaveURL( new RegExp( `${ staRecObj.patStr }$` ) ); // What: Clean Address Assertion. Why: The jump shouldn't leave a hash in the address. How: This checks the address still ends with the page's own path.


	} );


}

// #endregion Module Init


