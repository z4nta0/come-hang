


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



test( 'back from the home page returns the 404 page to where it was left', async ( { browserName : broNamStr, page : curPagObj } ) => { // What: Back Position Test. Why: Back and forward are left to the browser, which should return the visitor to where they were. How: This scrolls the 404 page down, follows its link home, goes back, and checks the 404 page is scrolled down again.


	test.skip( broNamStr === 'firefox', 'Firefox restores the position before the 404 page renders again, capping it at the short home page, an open question in the audit report' ); // What: Firefox Skip Call. Why: Firefox restores the earlier position against the page it's leaving, so with the placeholder home page only 26px tall to scroll, the position comes back capped, which is logged for the user rather than worked around. How: This skips the check in Firefox and says why.



	await curPagObj.setViewportSize( { height : 200, width : NOF_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for a restored position to mean anything. How: This makes the screen too short to show the whole 404 page.

	await curPagObj.goto( NOF_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the 404 page. How: This opens the unknown path.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) ); // What: Bottom Scroll Call. Why: The position to return to has to be below the top. How: This jumps to the page's bottom, past any smooth scroll-behavior.


	const leaScrNum = await curPagObj.evaluate( () => window.scrollY ); // What: Leaving Scroll Number. Why: Back should return the page to this position. How: This reads how far down the page sits before the link is followed.


	expect( leaScrNum ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without anything restored. How: This checks the page sits below its top.

	await curPagObj.getByRole( 'link', { name : 'Go to the home page' } ).click(); // What: Link Click Call. Why: The visitor leaves for the home page. How: This clicks the 404 page's link.

	await expect( curPagObj ).toHaveURL( '/' ); // What: Home Address Assertion. Why: Back has to start from the home page. How: This waits for the address to change.

	await curPagObj.goBack(); // What: Back Navigation Call. Why: This is the navigation being checked. How: This presses the browser's back.

	await expect( curPagObj ).toHaveURL( NOF_PHO_OBJ.patStr );                                               // What: Return Address Assertion. Why: Back should land on the 404 page again. How: This waits for the address to change back.
	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBeGreaterThan( leaScrNum / 2 ); // What: Restored Position Assertion. Why: The browser should return the page near where it was left, not to its top. How: This polls the scroll position until it sits past half the leaving position.


} );



test( "the 404 page's button eases its hover, press, and focus", async ( { page : curPagObj } ) => { // What: Feedback Test. Why: Every interaction should visibly ease rather than snap. How: This reads the button's transitions and checks each look it changes is eased.


	await opeStaFun( curPagObj, NOF_PHO_OBJ ); // What: State Open Call. Why: The button's styles are read on the settled page. How: This loads and settles it.


	const butTraObj = await curPagObj.getByRole( 'link', { name : 'Go to the home page' } ).evaluate( ( butCurEle ) => { // What: Button Transition Object. Why: Each eased property is paired with its duration. How: This reads the computed transition lists and pairs them.


		const styCurObj = getComputedStyle( butCurEle ); // What: Style Current Object. Why: The browser's computed transition is what actually plays. How: This reads the button's computed styles.



		return Object.fromEntries( styCurObj.transitionProperty.split( ', ' ).map( ( proNamStr, proIndNum ) => [ proNamStr, parseFloat( styCurObj.transitionDuration.split( ', ' )[ proIndNum ] ) ] ) ); // What: Property Duration Return. Why: Each property's duration is checked by name. How: This maps each transitioned property to its duration in seconds.


	} );


	expect( butTraObj[ 'background-color' ] ).toBeGreaterThan( 0 ); // What: Hover Color Assertion. Why: The hover's color shift should ease. How: This checks its duration.
	expect( butTraObj[ 'transform' ] ).toBeGreaterThan( 0 );        // What: Lift And Press Assertion. Why: The hover lift and the press both move by transform, which should ease. How: This checks its duration.
	expect( butTraObj[ 'outline-width' ] ).toBeGreaterThan( 0 );    // What: Focus Assertion. Why: The focus ring should grow in rather than snap. How: This checks its duration.


} );



test( "the 404 page's button still lifts under reduced motion, instantly", async ( { page : curPagObj } ) => { // What: Reduced Motion Feedback Test. Why: Under reduced motion the hover lift is still feedback, so it should apply, just without easing. How: This hovers the button with reduced motion requested and checks it moved with nothing animating.


	await curPagObj.emulateMedia( { reducedMotion : 'reduce' } ); // What: Reduced Motion Emulation. Why: The preference has to be set before the page loads. How: This makes the page match prefers-reduced-motion: reduce.

	await opeStaFun( curPagObj, NOF_PHO_OBJ ); // What: State Open Call. Why: The hover is checked on the settled page. How: This loads and settles it.


	const butLinObj = curPagObj.getByRole( 'link', { name : 'Go to the home page' } ); // What: Button Link Object. Why: The hover and both checks use the same button. How: This locates it by its name.


	await butLinObj.hover(); // What: Hover Call. Why: This is the interaction being checked. How: Playwright moves the pointer onto the button.

	await expect( butLinObj ).not.toHaveCSS( 'transform', 'none' );                                    // What: Lifted Assertion. Why: The lift should still apply. How: This checks the button carries a transform.
	expect( await butLinObj.evaluate( ( butCurEle ) => butCurEle.getAnimations().length ) ).toBe( 0 ); // What: No Easing Assertion. Why: The lift should apply at once, with nothing easing it. How: This checks the button holds no running animation or transition.


} );



test( 'the skip link eases its slide, hover, press, and focus', async ( { page : curPagObj } ) => { // What: Skip Link Feedback Test. Why: Every interaction should visibly ease rather than snap, the skip link's slide into view included. How: This focuses the link, reads its transitions, and checks each look it changes is eased.


	const skiLinLoc = curPagObj.getByRole( 'link', { name : 'Skip to main content' } ); // What: Skip Link Locator. Why: The focus and the read below reach the same link. How: This finds it by its role and name.



	await opeStaFun( curPagObj, DES_STA_ARR[ 0 ] ); // What: State Open Call. Why: The link's styles are read on a settled page. How: This loads and settles the first desktop state.

	await skiLinLoc.focus(); // What: Skip Focus Call. Why: The link only shows once it's focused, and its focused rule carries the slide in. How: This focuses it.


	const skiTraObj = await skiLinLoc.evaluate( ( skiCurEle ) => { // What: Skip Transition Object. Why: Each eased property is paired with its duration. How: This reads the computed transition lists and pairs them.


		const styCurObj = getComputedStyle( skiCurEle ); // What: Style Current Object. Why: The browser's computed transition is what actually plays. How: This reads the link's computed styles.



		return Object.fromEntries( styCurObj.transitionProperty.split( ', ' ).map( ( proNamStr, proIndNum ) => [ proNamStr, parseFloat( styCurObj.transitionDuration.split( ', ' )[ proIndNum ] ) ] ) ); // What: Property Duration Return. Why: Each property's duration is checked by name. How: This maps each transitioned property to its duration in seconds.


	} );


	expect( skiTraObj[ 'background-color' ] ).toBeGreaterThan( 0 ); // What: Hover Color Assertion. Why: The hover's color shift should ease. How: This checks its duration.
	expect( skiTraObj[ 'transform' ] ).toBeGreaterThan( 0 );        // What: Slide, Lift, And Press Assertion. Why: The slide into view, the hover lift, and the press all move by transform, which should ease. How: This checks its duration.
	expect( skiTraObj[ 'outline-width' ] ).toBeGreaterThan( 0 );    // What: Focus Assertion. Why: The focus ring should grow in rather than snap. How: This checks its duration.


} );



test( 'the skip link appears and lifts instantly under reduced motion', async ( { page : curPagObj } ) => { // What: Reduced Motion Skip Link Test. Why: Under reduced motion the link should appear without sliding, while its hover lift still applies as feedback. How: This focuses and hovers the link with reduced motion requested and checks each change applies with nothing animating.


	const skiLinLoc = curPagObj.getByRole( 'link', { name : 'Skip to main content' } ); // What: Skip Link Locator. Why: Each step below reaches the same link. How: This finds it by its role and name.



	await curPagObj.emulateMedia( { reducedMotion : 'reduce' } ); // What: Reduced Motion Emulation. Why: The preference has to be set before the page loads. How: This makes the page match prefers-reduced-motion: reduce.

	await opeStaFun( curPagObj, DES_STA_ARR[ 0 ] ); // What: State Open Call. Why: The link is checked on a settled page. How: This loads and settles the first desktop state.

	await skiLinLoc.focus(); // What: Skip Focus Call. Why: Focus is what brings the link into view. How: This focuses it.

	await expect( skiLinLoc ).toBeInViewport( { ratio : 1 } );                                         // What: Skip Shown Assertion. Why: The link should be in view as soon as it's focused. How: This checks the whole link sits on screen.
	expect( await skiLinLoc.evaluate( ( skiCurEle ) => skiCurEle.getAnimations().length ) ).toBe( 0 ); // What: No Slide Assertion. Why: The link should appear at once, with nothing easing it in. How: This checks it holds no running animation or transition.


	const focTraStr = await skiLinLoc.evaluate( ( skiCurEle ) => getComputedStyle( skiCurEle ).transform ); // What: Focused Transform String. Why: The hover lift is judged against the focused position. How: This reads the link's transform before the hover.


	await skiLinLoc.hover(); // What: Hover Call. Why: The lift is the feedback being checked. How: Playwright moves the pointer onto the link.

	await expect( skiLinLoc ).not.toHaveCSS( 'transform', focTraStr );                                 // What: Lifted Assertion. Why: The lift should still apply. How: This checks the transform changed from the focused position.
	expect( await skiLinLoc.evaluate( ( skiCurEle ) => skiCurEle.getAnimations().length ) ).toBe( 0 ); // What: No Easing Assertion. Why: The lift should apply at once, with nothing easing it. How: This checks the link holds no running animation or transition.


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


