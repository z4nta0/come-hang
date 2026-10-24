


// #region Imports

import { expect      } from '@playwright/test';     // What: Expect. Why: Each state passes only when every control responds. How: This asserts on what each check reads, such as that its problem list is empty.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: Each check opens and settles its state first. How: This loads it and waits for it.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: Every page state is checked. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each check of each state is its own test. How: This declares them.


import type { ElementHandle } from '@playwright/test'; // What: Element Handle. Why: Each control is probed through a handle to its element. How: This types the element handles the control list helper collects and returns.
import type { Page          } from '@playwright/test'; // What: Page. Why: The helpers that drive the page from the test take a Playwright page, while those that run inside it take none. How: This types the driving helpers' page parameters.

// #endregion Imports



/**
 * feedback.spec.ts = Feedback Spec
 *
 * @summary
 * Checks the interaction feedback rule on every page state, in whichever
 * engine the project runs. Each kind of element a visitor interacts with, such
 * as a form field, has to look different in each state it responds to and ease
 * every property that change touches, on it or anything inside it. A control's
 * focus ring has to ease in to full width. Under reduced motion the changes
 * stay but nothing transitions. Every control on the page is found and probed,
 * so one added later is checked without a test of its own. Real clicks are
 * blocked during the checks, so pressing a control never navigates mid-check.
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

type SnaRecTyp = { // What: Snapshot Record Type. Why: An element's look, and whether each part of it would ease, is compared between two moments the same way. How: This holds one value and one duration per probed property.


	durArr : number[], // What: Duration Array. Why: A property that changes has to ease rather than snap. How: This holds each probed property's transition duration in milliseconds, or 0 when no transition covers it, with an inherited color taking its parent's duration and a currentColor border taking the color's when that's longer.
	valArr : string[]  // What: Value Array. Why: Two moments are compared property by property. How: This holds each probed property's computed value.


};

// #endregion Types



// #region Constants

const CON_PRO_ARR = [ 'color', 'background-color', 'border-color', 'transform', 'opacity' ]; // What: Control Property Array. Why: Hover and press feedback changes these, on a control and on what's inside it, such as an icon's lines. How: Each is compared between moments, and each that changes has to be transitioned.
const FIE_PRO_ARR = [ 'border-color', 'outline-color', 'outline-width' ];                    // What: Field Property Array. Why: A field's focus changes its border and its outline. How: Each is compared between rest and focus, and each that changes has to be transitioned.
const SET_WAI_NUM = 400;                                                                     // What: Settle Wait Number. Why: Each look is read once its transition has finished, and the longest interface transition runs about 277ms. How: This is the pause, in milliseconds, after each hover, press, or focus.

// #endregion Constants



// #region Helpers

// #region cliBloFun

/**
 * cliBloFun = Click Block Function
 *
 * @summary
 * Runs inside the page and cancels every click before anything handles it,
 * so pressing a control during a check never follows a link or runs its
 * handler. It listens on the document in the capture phase, ahead of React's
 * own listener on the app's root, and both prevents the click's default and
 * stops it from going any further. Passed to
 * Playwright's evaluate, so it can't read anything from this file.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * page.evaluate(cliBloFun) // => void
 * ```
 *
*/

function cliBloFun () : void {


	document.addEventListener( 'click', ( cliEveObj ) => { // What: Click Block Listener. Why: A press during a check shouldn't do anything. How: This cancels every click in the capture phase, before the page or React sees it.


		cliEveObj.preventDefault(); // What: Default Prevention Call. Why: A link shouldn't navigate mid-check. How: This cancels the click's default.

		cliEveObj.stopPropagation(); // What: Propagation Stop Call. Why: React's handlers, such as the skip link moving focus, shouldn't run either. How: This keeps the click from reaching the app's root.


	}, true ); // What: Capture Phase Flag. Why: The block has to run before anything else sees the click. How: This registers the listener for the capture phase.


}

// #endregion cliBloFun



// #region conLisFun

/**
 * conLisFun = Control List Function
 *
 * @summary
 * Collects every element a visitor can reach on the page as it stands: each
 * element the selector matches that's visible, not taken out of the tab order
 * with tabindex -1, and not inside inert content, such as whatever a modal
 * layer covers, so the same list serves every kind of element the checks
 * probe, such as form fields. Handles are taken once, so restyling while the
 * checks scroll can't shift the list.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to collect from.
 * @param conSelStr - Control Selector String: The elements to collect, such as
 *                    every form field.
 *
 * @returns A promise that resolves with every reachable control.
 * @see {@link conHanArr}
 *
 * @example
 * ```ts
 * conLisFun(page, 'a, button') // => [ ElementHandle, ... ]
 * ```
 *
*/

async function conLisFun ( curPagObj : Page, conSelStr : string ) : Promise< ElementHandle< Element >[] > {


	const conHanArr : ElementHandle< Element >[] = []; // What: Control Handle Array. Why: The reachable controls are gathered one by one. How: This collects them.


	for ( const conCurObj of await curPagObj.$$( conSelStr ) ) { // What: Control Loop. Why: Every control the selector matches is judged on its own. How: This keeps each one a visitor can reach.


		const conReaBoo = await conCurObj.evaluate( ( conCurEle ) => conCurEle.getAttribute( 'tabindex' ) !== '-1' && !conCurEle.closest( '[inert]' ) ); // What: Control Reachable Boolean. Why: A control outside the tab order or inside inert content can't be reached. How: This checks both inside the page.


		if ( conReaBoo && await conCurObj.isVisible() ) conHanArr.push( conCurObj ); // What: Reachable Control Record. Why: Only controls a visitor can see and reach are checked. How: This keeps the control when it's both.


	}



	return conHanArr; // What: Control Handle Return. Why: The checks probe each control in turn. How: This hands back every reachable control's handle.


}

// #endregion conLisFun



// #region snaEleFun

/**
 * snaEleFun = Snapshot Element Function
 *
 * @summary
 * Runs inside the page and records how an element looks right now, and
 * whether each part of that look would ease if it changed: for the element
 * and every element inside it, each probed property's computed value and the
 * duration of the transition covering it, listed by its own name, by a
 * shorthand holding it (background for background-color, border for
 * border-color), or by all, or 0 when none is.
 * The border color reads only the sides actually drawn, those with a width
 * above zero, as one color when they all share it, since an undrawn side's
 * color can change without anything showing.
 * An inner element whose color matches its parent's takes the parent's
 * duration for it, since an inherited color eases with the parent's
 * transition, and a border color matching the element's own color takes the
 * color's duration, since an unset border color is currentColor and follows
 * the color as it eases. Passed to Playwright's evaluate, so it can't read
 * anything from this file.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eleCurEle - Element Current Element: The element to record.
 * @param proNamArr - Property Name Array: The property names to probe.
 *
 * @returns One record per element, the element itself first.
 * @see {@link snaRecArr}
 *
 * @example
 * ```ts
 * handle.evaluate(snaEleFun, CON_PRO_ARR) // => [ { ... } ]
 * ```
 *
*/

function snaEleFun ( eleCurEle : Element, proNamArr : string[] ) : SnaRecTyp[] {


	const parNamObj : Record< string, string > = { 'background-color' : 'background', 'border-color' : 'border' }; // What: Parent Name Object. Why: A transition listed by a shorthand covers the longhands inside it. How: This maps each probed longhand to its shorthand.



	const borValFun = ( styCurObj : CSSStyleDeclaration ) : string => [ ...new Set( [ 'top', 'right', 'bottom', 'left' ].filter( ( sidNamStr ) => styCurObj.getPropertyValue( `border-${ sidNamStr }-width` ) !== '0px' ).map( ( sidNamStr ) => styCurObj.getPropertyValue( `border-${ sidNamStr }-color` ) ) ) ].join( ' ' ); // What: Border Value Function. Why: Only a drawn border's color shows, so an undrawn side changing color isn't feedback. How: This joins the distinct colors of the sides wider than zero, one color when they share it.



	const snaStyFun = ( styCurObj : CSSStyleDeclaration ) : SnaRecTyp => { // What: Snapshot Style Function. Why: Each element is recorded the same way. How: This reads its probed values and the duration covering each.


		const traDurArr = styCurObj.transitionDuration.split( ',' ).map( ( traDurStr ) => parseFloat( traDurStr ) * ( traDurStr.trim().endsWith( 'ms' ) ? 1 : 1000 ) ); // What: Transition Duration Array. Why: A covered property eases only with a duration above zero. How: This reads each listed duration in milliseconds.
		const traNamArr = styCurObj.transitionProperty.split( ',' ).map( ( traNamStr ) => traNamStr.trim() );                                                           // What: Transition Name Array. Why: A property eases only when its transition lists it. How: This reads each listed property name.


		const durProFun = ( proNamStr : string ) : number => { // What: Duration Property Function. Why: Each probed property needs the duration of whichever transition covers it. How: This finds the first listing by its name, its shorthand, or all, and reads its duration, which repeats when fewer durations than names are listed.


			const traIndNum = traNamArr.findIndex( ( traNamStr ) => [ proNamStr, 'all', parNamObj[ proNamStr ] ].includes( traNamStr ) ); // What: Transition Index Number. Why: The covering transition's place picks its duration. How: This finds the first name that covers the property.



			return traIndNum < 0 ? 0 : traDurArr[ traIndNum % traDurArr.length ]; // What: Covering Duration Return. Why: An uncovered property has no transition at all. How: This returns 0 for one, or its listing's duration.


		};



		return { // What: Snapshot Record Return. Why: Each element's record holds its values and durations side by side. How: This reads both for every probed property.


			durArr : proNamArr.map( durProFun ), // What: Duration Array. Why: A property that changes has to ease rather than snap. How: This reads the duration of the transition covering each probed property, or 0 when none does.

			valArr : proNamArr.map( ( proNamStr ) => ( proNamStr === 'border-color' ? borValFun( styCurObj ) : styCurObj.getPropertyValue( proNamStr ) ) ) // What: Value Array. Why: Two moments are compared property by property. How: This reads each probed property's computed value, taking the border color from its drawn sides only.


		};


	};



	const borIndNum = proNamArr.indexOf( 'border-color' );                                          // What: Border Index Number. Why: An unset border color follows the color, so its place is checked against color's. How: This finds its place, or -1 when it isn't probed.
	const colIndNum = proNamArr.indexOf( 'color' );                                                 // What: Color Index Number. Why: Only color is inherited among the probed properties. How: This finds its place, or -1 when it isn't probed.
	const borColBoo = borIndNum >= 0 && colIndNum >= 0;                                             // What: Border Color Boolean. Why: The currentColor check needs both properties probed. How: This is true when the border color and the color are both in the list.
	const eleLisArr = [ eleCurEle, ...eleCurEle.querySelectorAll( '*' ) ];                          // What: Element List Array. Why: A change to an inner element counts as the control's own. How: This lists the element and everything inside it, parents before children.
	const snaRecArr = eleLisArr.map( ( lisCurEle ) => snaStyFun( getComputedStyle( lisCurEle ) ) ); // What: Snapshot Record Array. Why: Each element is recorded. How: This snapshots every listed element's computed styles.


	for ( const [ lisIndNum, lisCurEle ] of eleLisArr.entries() ) { // What: Inherited Color Loop. Why: An inner element whose color comes from its parent eases with the parent's transition. How: This gives each one whose color matches its parent's the parent's duration, in document order, so it passes down every level.


		const parIndNum = lisCurEle.parentElement ? eleLisArr.indexOf( lisCurEle.parentElement ) : -1; // What: Parent Index Number. Why: Only a parent inside the element passes its color down here. How: This finds the parent's place in the list, or -1.


		if ( parIndNum < 0 || colIndNum < 0 ) continue; // What: No Parent Guard. Why: The element itself, and every element when color isn't probed, keeps its own duration. How: This skips them.



		if ( snaRecArr[ lisIndNum ].valArr[ colIndNum ] === snaRecArr[ parIndNum ].valArr[ colIndNum ] ) snaRecArr[ lisIndNum ].durArr[ colIndNum ] = snaRecArr[ parIndNum ].durArr[ colIndNum ]; // What: Inherited Duration Assignment. Why: A color matching the parent's is the parent's, eased by the parent's transition. How: This copies the parent's color duration.


	}



	for ( const snaRecObj of snaRecArr ) if ( borColBoo && snaRecObj.valArr[ borIndNum ] === snaRecObj.valArr[ colIndNum ] ) snaRecObj.durArr[ borIndNum ] = Math.max( snaRecObj.durArr[ borIndNum ], snaRecObj.durArr[ colIndNum ] ); // What: Current Color Border Loop. Why: A border color matching the element's own color is currentColor, which follows the color as it eases, so a text link with no border set doesn't snap one. How: This gives each such border color the longer of its own duration and the color's.



	return snaRecArr; // What: Snapshot Records Return. Why: The caller compares two moments' records. How: This hands back every record.


}

// #endregion snaEleFun



// #region snaProFun

/**
 * snaProFun = Snap Problems Function
 *
 * @summary
 * Compares two snapshots of the same element, taken before and after a
 * change, and returns one problem for each probed property that changed on
 * the element or anything inside it without a transition to ease it, read
 * from the later snapshot, since a change eases with the transition of the
 * state it moves into. A property that snaps on several inner elements is one
 * problem.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param froRecArr - From Record Array: The snapshot before the change.
 * @param tarRecArr - Target Record Array: The snapshot after the change.
 * @param proNamArr - Property Name Array: The probed property names, in the
 *                    snapshots' order.
 * @param desLabStr - Description Label String: The element's name in each
 *                    problem.
 * @param staNamStr - State Name String: The change in each problem, such as
 *                    'when hovered'.
 *
 * @returns One problem per snapped property.
 *
 * @example
 * ```ts
 * snaProFun(resSnaArr, hovSnaArr, CON_PRO_ARR, 'a "Home"', 'when hovered')
 * // => []
 * ```
 *
*/

function snaProFun ( froRecArr : SnaRecTyp[], tarRecArr : SnaRecTyp[], proNamArr : string[], desLabStr : string, staNamStr : string ) : string[] {


	const snaNamSet = new Set< string >(); // What: Snapped Name Set. Why: A property that snaps on several inner elements is one problem. How: This collects each snapped property's name once.


	for ( const [ recIndNum, tarCurObj ] of tarRecArr.entries() ) { // What: Record Compare Loop. Why: Every element of the snapshot has to ease its own changes. How: This compares each later record with the earlier one in its place.


		const froCurObj = froRecArr[ recIndNum ]; // What: From Current Object. Why: The change is read against the same element's earlier record. How: This finds it by place.


		if ( !froCurObj ) continue; // What: Missing Record Guard. Why: An element that appeared with the change has nothing to compare with. How: This skips it.



		for ( const [ proIndNum, proNamStr ] of proNamArr.entries() ) if ( froCurObj.valArr[ proIndNum ] !== tarCurObj.valArr[ proIndNum ] && tarCurObj.durArr[ proIndNum ] === 0 ) snaNamSet.add( proNamStr ); // What: Property Compare Loop. Why: A property that changed with nothing to ease it snaps. How: This records each one whose value changed while its later duration is 0.


	}



	return [ ...snaNamSet ].map( ( proNamStr ) => `${ desLabStr } snaps its ${ proNamStr } ${ staNamStr }` ); // What: Snap Problems Return. Why: Each snapped property should be reported plainly. How: This turns each name into a problem line.


}

// #endregion snaProFun



const valSigFun = ( snaRecArr : SnaRecTyp[] ) : string => JSON.stringify( snaRecArr.map( ( snaRecObj ) => snaRecObj.valArr ) ); // What: Value Signature Function. Why: A look is the same between two moments only when every probed value matches. How: This joins every record's values into one string to compare.



// #region feeProFun

/**
 * feeProFun = Feedback Problems Function
 *
 * @summary
 * Probes every reachable control and returns a problem for each one that gives
 * no feedback, or a single problem when it finds no control at all. Each
 * control is scrolled into view, and one that still waits above the screen
 * until it's focused, such as the skip link, is focused so it slides in, then
 * blurred again once it's probed. Each is read at rest with the pointer away,
 * read again while hovered, and again while the mouse button is held on it,
 * every look read once its transition has settled. A control that looks the
 * same at rest and hovered, or hovered and pressed, is a problem. Normally
 * every property that changes on hover or press, on the control or anything
 * inside it, has to be eased by a transition ({@link snaProFun}), and its
 * transition list must include the focus ring's outline-width, so the ring
 * eases in; under reduced motion every one of its transition durations must be
 * zero instead. The caller blocks real clicks first, so releasing the mouse
 * does nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to probe.
 * @param conSelStr - Control Selector String: The controls to probe, either
 *                    'a, button' for every link and button or a narrower
 *                    selector for one control.
 * @param redMotBoo - Reduced Motion Boolean: Whether the page is emulating
 *                    reduced motion.
 *
 * @returns A promise that resolves with every feedback problem found.
 * @see {@link proLisArr}
 *
 * @example
 * ```ts
 * feeProFun(page, 'a, button', false) // => [] when every control responds
 * ```
 *
*/

async function feeProFun ( curPagObj : Page, conSelStr : string, redMotBoo : boolean ) : Promise< string[] > {


	const proLisArr : string[] = []; // What: Problem List Array. Why: Every problem should be reported, not just the first. How: This collects them.

	const conHanArr = await conLisFun( curPagObj, conSelStr ); // What: Control Handle Array. Why: Every reachable control the selector matches is probed. How: This collects their handles.


	if ( !conHanArr.length ) proLisArr.push( 'no control to probe' ); // What: Empty Probe Check. Why: A probe that finds nothing would pass without checking anything, and a probe of every link and button always finds at least the skip link. How: This records a problem when no control is found.



	for ( const conCurObj of conHanArr ) { // What: Control Probe Loop. Why: Every reachable control has to respond. How: This reads each one the selector matches at rest, hovered, and pressed.


		const conDesStr = await conCurObj.evaluate( ( conCurEle ) => `${ conCurEle.tagName.toLowerCase() } "${ ( conCurEle.getAttribute( 'aria-label' ) || conCurEle.textContent || '' ).trim().slice( 0, 30 ) }"` ); // What: Control Description String. Why: A problem should name the control a person would recognize. How: This joins its tag with its label or text.


		await conCurObj.scrollIntoViewIfNeeded(); // What: Control Scroll Call. Why: A control has to be on screen to hover or press. How: This scrolls it into view.


		const offScrBoo = await conCurObj.evaluate( ( conCurEle ) => conCurEle.getBoundingClientRect().bottom <= 0 ); // What: Off Screen Boolean. Why: A control that waits above the screen until it's focused, such as a skip link, can't be hovered where it rests. How: This is true when its box still sits wholly above the viewport after the scroll.


		if ( offScrBoo ) await conCurObj.focus(); // What: Hidden Control Focus Call. Why: Such a control only comes into view while focused, and is probed there. How: This focuses it, and the rest settle wait below lets it finish sliding in.



		await curPagObj.mouse.move( 0, 0 ); // What: Pointer Away Call. Why: The resting look is read with nothing hovered. How: This moves the pointer to the page's top-left corner.

		await curPagObj.waitForTimeout( SET_WAI_NUM ); // What: Rest Settle Wait. Why: Any earlier hover has to finish fading. How: This pauses for the settle time.


		const resSnaArr = await conCurObj.evaluate( snaEleFun, CON_PRO_ARR ); // What: Rest Snapshot Array. Why: The resting look is what hover is compared with. How: This records the control and everything inside it.


		await conCurObj.hover(); // What: Control Hover Call. Why: Hover feedback is the first thing checked. How: This moves the pointer onto the control.

		await curPagObj.waitForTimeout( SET_WAI_NUM ); // What: Hover Settle Wait. Why: The hover look is read once it has eased in. How: This pauses for the settle time.


		const hovSnaArr = await conCurObj.evaluate( snaEleFun, CON_PRO_ARR ); // What: Hover Snapshot Array. Why: The hovered look is compared with rest and with pressed. How: This records it.


		await curPagObj.mouse.down(); // What: Mouse Down Call. Why: A press shows while the button is held. How: This holds the mouse button down on the control.

		await curPagObj.waitForTimeout( SET_WAI_NUM ); // What: Press Settle Wait. Why: The pressed look is read once it has eased in. How: This pauses for the settle time.


		const preSnaArr = await conCurObj.evaluate( snaEleFun, CON_PRO_ARR );                                            // What: Press Snapshot Array. Why: The pressed look is compared with hovered. How: This records it.
		const traLisStr = await conCurObj.evaluate( ( conCurEle ) => getComputedStyle( conCurEle ).transitionProperty ); // What: Transition List String. Why: The focus ring's ease depends on the control listing its outline. How: This reads the control's transitioned properties.
		const traDurStr = await conCurObj.evaluate( ( conCurEle ) => getComputedStyle( conCurEle ).transitionDuration ); // What: Transition Duration String. Why: Reduced motion should leave nothing moving. How: This reads the control's transition durations.


		await curPagObj.mouse.up(); // What: Mouse Up Call. Why: The press has to end before the next control. How: This releases the button, whose click the caller has blocked.


		if ( offScrBoo ) await conCurObj.evaluate( ( conCurEle ) => { if ( conCurEle instanceof HTMLElement ) conCurEle.blur(); } ); // What: Hidden Control Blur Call. Why: Left focused, the control would stay in view over whatever is probed next. How: This blurs it, and the next rest settle wait lets it slide back out of view.



		if ( valSigFun( resSnaArr ) === valSigFun( hovSnaArr ) ) proLisArr.push( `${ conDesStr } looks the same hovered` ); // What: Hover Check. Why: A hovered control has to respond. How: This records one that doesn't change.



		if ( valSigFun( hovSnaArr ) === valSigFun( preSnaArr ) ) proLisArr.push( `${ conDesStr } looks the same pressed` ); // What: Press Check. Why: A press has to register before anything happens. How: This records one that doesn't change.



		if ( redMotBoo && !/^0s(, 0s)*$/.test( traDurStr ) ) proLisArr.push( `${ conDesStr } still transitions under reduced motion (${ traDurStr })` ); // What: Reduced Motion Check. Why: Asking for less motion should stop every transition. How: This records a control with any duration above zero.

		else if ( !redMotBoo && !traLisStr.includes( 'outline-width' ) ) proLisArr.push( `${ conDesStr } doesn't transition its focus ring` ); // What: Focus Ease Check. Why: The focus ring should ease in rather than snap. How: This records a control whose transition list doesn't include outline-width.



		if ( !redMotBoo ) proLisArr.push( ...snaProFun( resSnaArr, hovSnaArr, CON_PRO_ARR, conDesStr, 'when hovered' ), ...snaProFun( hovSnaArr, preSnaArr, CON_PRO_ARR, conDesStr, 'when pressed' ) ); // What: Snapped Change Check. Why: Every property a hover or press changes should ease rather than snap. How: This records each one that changes without a transition, on the control or anything inside it.


	}



	return proLisArr; // What: Problem List Return. Why: The test prints whatever was found. How: This hands back every problem collected.


}

// #endregion feeProFun



// #region fieProFun

/**
 * fieProFun = Field Problems Function
 *
 * @summary
 * Probes every form field a visitor can reach (each visible input, select,
 * and textarea) and returns a problem for each one that gives no focus
 * feedback. Each field is scrolled into view and read at rest, then focused
 * by keyboard, by stepping back off it with Shift+Tab and onto it again with
 * Tab, and read once its transition has settled. A field the Tab press doesn't
 * land on, or that looks the same focused as at rest (its border color and
 * outline), is a problem. Normally every one of those that changes has to be
 * eased by a transition ({@link snaProFun}), outline-width included, so the
 * ring eases in; under reduced motion every one of its transition durations
 * must be zero instead.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to probe.
 * @param redMotBoo - Reduced Motion Boolean: Whether the page is emulating
 *                    reduced motion.
 *
 * @returns A promise that resolves with every focus feedback problem found.
 * @see {@link proLisArr}
 *
 * @example
 * ```ts
 * fieProFun(page, false) // => [ 'input "email" looks the same focused' ]
 * ```
 *
*/

async function fieProFun ( curPagObj : Page, redMotBoo : boolean ) : Promise< string[] > {


	const proLisArr : string[] = []; // What: Problem List Array. Why: Every problem should be reported, not just the first. How: This collects them.


	for ( const fieCurObj of await conLisFun( curPagObj, 'input, select, textarea' ) ) { // What: Field Probe Loop. Why: Every reachable form field has to show focus. How: This reads each one at rest and focused by keyboard.


		const fieDesStr = await fieCurObj.evaluate( ( fieCurEle ) => `${ fieCurEle.tagName.toLowerCase() } "${ fieCurEle.getAttribute( 'name' ) || '' }"` ); // What: Field Description String. Why: A problem should name the field in terms of the form. How: This joins its tag with the name the form submits it under.


		await fieCurObj.scrollIntoViewIfNeeded(); // What: Field Scroll Call. Why: A field has to be on screen for its look to be read. How: This scrolls it into view.


		const resSnaArr = await fieCurObj.evaluate( snaEleFun, FIE_PRO_ARR ); // What: Rest Snapshot Array. Why: The resting look is what focus is compared with. How: This records the field's border color and outline.


		await fieCurObj.focus(); // What: Field Focus Call. Why: The keyboard steps start from the field itself. How: This focuses it so Shift+Tab steps off it.

		await curPagObj.keyboard.press( 'Shift+Tab' ); // What: Back Tab Press Call. Why: Focus has to arrive by keyboard, the way a keyboard user reaches the field. How: This steps focus back to the stop before the field.
		await curPagObj.keyboard.press( 'Tab' );       // What: Tab Press Call. Why: The field is reached by keyboard. How: This steps focus forward onto the field again.

		await curPagObj.waitForTimeout( SET_WAI_NUM ); // What: Focus Settle Wait. Why: The focused look is read once it has eased in. How: This pauses for the settle time.


		const focFieBoo = await fieCurObj.evaluate( ( fieCurEle ) => fieCurEle === document.activeElement );             // What: Focused Field Boolean. Why: The focused look only counts when the Tab press landed on the field. How: This checks the field holds focus.
		const focSnaArr = await fieCurObj.evaluate( snaEleFun, FIE_PRO_ARR );                                            // What: Focus Snapshot Array. Why: The focused look is compared with rest. How: This records the field's border color and outline.
		const traDurStr = await fieCurObj.evaluate( ( fieCurEle ) => getComputedStyle( fieCurEle ).transitionDuration ); // What: Transition Duration String. Why: Reduced motion should leave nothing moving. How: This reads the field's transition durations.


		if ( !focFieBoo ) proLisArr.push( `${ fieDesStr } isn't reached by Tab` ); // What: Keyboard Reach Check. Why: A keyboard user has to be able to reach every field. How: This records one the Tab press didn't land on.

		else if ( valSigFun( resSnaArr ) === valSigFun( focSnaArr ) ) proLisArr.push( `${ fieDesStr } looks the same focused` ); // What: Focus Check. Why: A focused field has to stand out. How: This records one whose border and outline don't change.



		if ( redMotBoo && !/^0s(, 0s)*$/.test( traDurStr ) ) proLisArr.push( `${ fieDesStr } still transitions under reduced motion (${ traDurStr })` ); // What: Reduced Motion Check. Why: Asking for less motion should stop every transition. How: This records a field with any duration above zero.

		else if ( !redMotBoo && focFieBoo ) proLisArr.push( ...snaProFun( resSnaArr, focSnaArr, FIE_PRO_ARR, fieDesStr, 'when focused' ) ); // What: Snapped Change Check. Why: A field's focus change, its ring included, should ease rather than snap. How: This records each changed border or outline property without a transition, once the Tab press has landed on the field.


	}



	return proLisArr; // What: Problem List Return. Why: The test prints whatever was found. How: This hands back every problem collected.


}

// #endregion fieProFun

// #endregion Helpers



// #region Module Init

for ( const staRecObj of STA_REC_ARR ) { // What: State Test Loop. Why: Every page state is checked. How: This declares each check once per state.


	test( `${ staRecObj.ideStr } gives every control hover, press, and focus feedback`, async ( { page : curPagObj } ) => { // What: Feedback Test. Why: Every interaction should visibly register. How: This opens the state, blocks clicks, probes every control and every form field, and checks it finds no problems.


		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The controls are probed with the state settled. How: This loads and settles it.

		await curPagObj.evaluate( cliBloFun ); // What: Click Block Call. Why: Pressing a control shouldn't navigate or close anything. How: This cancels every click from here on.

		expect( await feeProFun( curPagObj, 'a, button', false ) ).toEqual( [] ); // What: No Feedback Problems Assertion. Why: The state passes only when every control responds. How: This compares the problems with an empty list, so a failure prints each one.
		expect( await fieProFun( curPagObj, false ) ).toEqual( [] );              // What: No Field Problems Assertion. Why: The state passes only when every form field shows focus. How: This compares the problems with an empty list, so a failure prints each one.


	} );



	test( `${ staRecObj.ideStr } draws its focus ring at full width`, async ( { browserName : engNamStr, page : curPagObj } ) => { // What: Focus Ring Test. Why: A keyboard user has to see where focus lands. How: This tabs to the first stop and checks its ring reaches 2px once it has eased in.


		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The walk starts from the state settled. How: This loads and settles it.

		await curPagObj.keyboard.press( engNamStr === 'webkit' ? 'Alt+Tab' : 'Tab' ); // What: First Tab Press Call. Why: The ring shows only for keyboard focus. How: This tabs to the first stop, holding Alt in WebKit, which otherwise skips links the way Safari does.

		await curPagObj.waitForTimeout( SET_WAI_NUM ); // What: Ring Settle Wait. Why: The ring is read once it has grown in. How: This pauses for the settle time.

		expect( await curPagObj.evaluate( () => getComputedStyle( document.activeElement as Element ).outlineWidth ) ).toBe( '2px' ); // What: Full Ring Assertion. Why: The ring has to reach its full width. How: This reads the focused stop's outline width, which the large border width token snaps to 2px. // What: Type Assertion Note. Why: activeElement types as possibly null. How: The Tab press just put focus on a stop.


	} );



	test( `${ staRecObj.ideStr } keeps feedback without motion under reduced motion`, async ( { page : curPagObj } ) => { // What: Reduced Motion Feedback Test. Why: Visitors who ask for less motion still need to see their actions register. How: This probes every control and every form field with reduced motion on and checks it finds no problems.


		await curPagObj.emulateMedia( { reducedMotion : 'reduce' } ); // What: Reduced Motion Emulation. Why: The preference has to be set before the page loads. How: This makes the page match prefers-reduced-motion: reduce.

		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The controls are probed with the state settled. How: This loads and settles it.

		await curPagObj.evaluate( cliBloFun ); // What: Click Block Call. Why: Pressing a control shouldn't navigate or close anything. How: This cancels every click from here on.

		expect( await feeProFun( curPagObj, 'a, button', true ) ).toEqual( [] ); // What: No Reduced Motion Problems Assertion. Why: Every control has to respond without moving. How: This compares the problems with an empty list, so a failure prints each one.
		expect( await fieProFun( curPagObj, true ) ).toEqual( [] );              // What: No Reduced Motion Field Problems Assertion. Why: Every form field has to show focus without moving. How: This compares the problems with an empty list, so a failure prints each one.


	} );


}

// #endregion Module Init


