


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
 * landing on the 404 page.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const NOF_PHO_OBJ = STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'not-found-phone' )!; // What: Not-Found Phone Object. Why: Every check here starts from the 404 page, and most people use the app on a phone. How: This takes the shared 404 phone state. // What: Non-Null Note. Why: find's return type allows undefined. How: states.ts always lists the not-found-phone state.

// #endregion Constants



// #region Module Init

test( 'an unknown address shows the 404 page, marked noindex', async ( { page : curPagObj } ) => { // What: Not Found Test. Why: A mistyped or outdated address should land somewhere useful, and never in search results. How: This opens an unknown path and checks the heading, the title, and the robots tag.


	await opeStaFun( curPagObj, NOF_PHO_OBJ ); // What: State Open Call. Why: The checks read the settled 404 page. How: This loads and settles it.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Page Not Found' );     // What: Heading Assertion. Why: The page should say what happened. How: This reads its one h1.
	await expect( curPagObj ).toHaveTitle( 'Page Not Found | Come Hang' );                              // What: Title Assertion. Why: The tab should name the 404 page. How: This reads the document's title.
	await expect( curPagObj.locator( 'meta[name="robots"]' ) ).toHaveAttribute( 'content', 'noindex' ); // What: Robots Assertion. Why: The host answers unknown paths with a 200, so search engines must be told to skip the page. How: This reads the robots tag's content.


} );



test( "the 404 page's link opens the home page at its top", async ( { page : curPagObj } ) => { // What: Way Onward Test. Why: The 404 page's link is its way back into the app, and a new page should open at its top. How: This scrolls the 404 page down, clicks the link, and checks where it landed.


	await curPagObj.setViewportSize( { height : 200, width : NOF_PHO_OBJ.widNum } ); // What: Short Viewport Call. Why: The page has to be scrollable for the scroll reset to mean anything. How: This makes the screen too short to show the whole 404 page.

	await curPagObj.goto( NOF_PHO_OBJ.patStr ); // What: Page Load Call. Why: The check starts on the 404 page. How: This opens the unknown path.

	await curPagObj.getByRole( 'link', { name : 'Go to the home page' } ).click(); // What: Link Click Call. Why: This is the navigation being checked. How: Playwright scrolls the link into view, scrolling the page down, then clicks it.

	await expect( curPagObj ).toHaveURL( '/' );                                                // What: Address Assertion. Why: The link leads to the home page. How: This reads the address.
	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Home Heading Assertion. Why: The home page should be what's showing. How: This reads its one h1.
	await expect( curPagObj.locator( 'meta[name="robots"]' ) ).toHaveCount( 0 );               // What: Robots Removed Assertion. Why: The home page must not keep the 404 page's noindex. How: This checks the tag left with the page.
	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBe( 0 );           // What: Top Assertion. Why: A new page should open at its top. How: This polls the scroll position until it reads zero.


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

	await expect( butLinObj ).not.toHaveCSS( 'transform', 'none' );                                  // What: Lifted Assertion. Why: The lift should still apply. How: This checks the button carries a transform.
	expect( await butLinObj.evaluate( ( butCurEle ) => butCurEle.getAnimations().length ) ).toBe( 0 ); // What: No Easing Assertion. Why: The lift should apply at once, with nothing easing it. How: This checks the button holds no running animation or transition.


} );

// #endregion Module Init


