


// #region Imports

import { expect      } from '@playwright/test';     // What: Expect. Why: Each check passes only with no problems found. How: This asserts each problem list is empty.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: Each check opens and settles its state first. How: This loads it and waits for it.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: Every page state is checked. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each check of each state is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helpers that drive a Playwright page need its type. How: This types their page parameters.

// #endregion Imports



/**
 * scripted.spec.ts = Scripted Spec
 *
 * @summary
 * The accessibility checks axe-core can't make, run on every page state in
 * whichever engine the project runs. They read what a scan can't, such as a
 * Tab walk through the page. Most checks list every problem they find, by
 * element.
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

const GLY_DEC_REG = /[←↑→↓·•]|\p{Extended_Pictographic}/u; // What: Glyph Decorative Regular Expression. Why: A decorative glyph inside a name is read aloud as noise, such as a right arrow. How: This matches the arrows and dots a decorative glyph would add to a name, plus any emoji or pictograph.
const REF_WID_NUM = 320;                                   // What: Reflow Width Number. Why: WCAG's reflow criterion asks for no sideways scrolling at 320 CSS pixels, the width of 1,280px at 400% zoom. How: This is the viewport width the reflow check opens each state at.
const TAB_MAX_NUM = 80;                                    // What: Tab Maximum Number. Why: A keyboard trap would otherwise keep the walk going forever. How: This caps the walk at far more Tab presses than the app has stops.

// #endregion Constants



// #region Helpers

// #region motRecFun

/**
 * motRecFun = Motion Recorder Function
 *
 * @summary
 * Runs inside the page from before it loads, as an init script, and records
 * every animation or transition longer than 1ms that plays, so a motion that
 * starts and finishes before the check reads the page still fails it. Each
 * frame it sweeps document.getAnimations(), which holds whatever is playing at
 * that moment. It also listens on the document for animationstart,
 * transitionrun, and transitionstart, in the capture phase so nothing on the
 * page can stop it hearing one, which catches a motion that starts and ends
 * between two frames. An event carries no duration, so the listener reads the
 * one the target's computed style gives that animation's name or that
 * transition's property. Each motion is labelled by its animation name or
 * transition property and the element it ran on, by its tag, its classes, and
 * any pseudo-element, and kept once however often it's seen. The 1ms floor
 * skips the .01ms reduced-motion exits the page waits on. The sweep is kept on
 * the window as __motPolFun, which runs one last sweep and returns every
 * label, so the check also catches anything still playing when it reads.
 * Passed to Playwright's addInitScript, so it can't read anything from this
 * file.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * page.addInitScript(motRecFun) // => void
 * ```
 *
*/

function motRecFun () : void {


	const motLabSet = new Set< string >(); // What: Motion Label Set. Why: Each motion that plays has to be kept until the check reads it, once however many frames it spans. How: This collects one label per motion, dropping repeats.


	const durMilFun = ( durCurStr : string ) : number => parseFloat( durCurStr ) * ( durCurStr.trim().endsWith( 'ms' ) ? 1 : 1000 ); // What: Duration Milliseconds Function. Why: Computed durations come in seconds or milliseconds. How: This converts one to milliseconds.
	const eleDesFun = ( tarEleObj : Element | null, pseEleStr : string | null ) : string => `${ tarEleObj ? tarEleObj.tagName.toLowerCase() : 'no element' }${ Array.from( tarEleObj?.classList || [] ).map( ( claNamStr ) => `.${ claNamStr }` ).join( '' ) }${ pseEleStr || '' }`; // What: Element Description Function. Why: A failure should say what moved. How: This joins the element's tag, each of its classes, and the pseudo-element the motion ran on, if any.



	const polAniFun = () : string[] => { // What: Poll Animation Function. Why: A motion that lasts across frames shows up in getAnimations while it plays. How: This labels every animation or transition the page holds that lasts longer than 1ms, and returns every label recorded so far.


		for ( const aniCurObj of document.getAnimations() ) { // What: Animation Loop. Why: Each motion is judged on its own. How: This reads each one's effect, duration, and name.


			const aniEffObj = aniCurObj.effect as KeyframeEffect | null; // What: Animation Effect Object. Why: The duration and the element moving live on the effect. How: This reads it. // What: Type Assertion Note. Why: effect types as AnimationEffect, which has no target. How: Every CSS animation and transition runs a keyframe effect.


			if ( !aniEffObj || !( Number( aniEffObj.getTiming().duration ) > 1 ) ) continue; // What: Short Motion Guard. Why: Only motion longer than 1ms counts, which leaves out the .01ms reduced-motion exits. How: This skips an animation with no effect, or whose duration is 1ms or less, or auto.



			motLabSet.add( `${ ( aniCurObj as CSSAnimation ).animationName || ( aniCurObj as CSSTransition ).transitionProperty || 'script animation' } on ${ eleDesFun( aniEffObj.target, aniEffObj.pseudoElement ) }` ); // What: Motion Label Add Call. Why: Each long motion should be named in the failure. How: This records its animation name or transition property and its element. // What: Type Assertion Note. Why: getAnimations returns plain Animation objects, which don't type their CSS names. How: Each one is read as a CSS animation, then a CSS transition, falling back to a generic label when neither name exists.


		}



		return Array.from( motLabSet ); // What: Motion Label Return. Why: The check reads every label from outside the page. How: This hands back the labels as an array.


	};



	const fraLooFun = () : void => { // What: Frame Loop Function. Why: getAnimations only shows what's playing at the moment it's read. How: This sweeps once per frame and schedules itself for the next.


		polAniFun(); // What: Animation Poll Call. Why: Whatever plays this frame should be recorded. How: This sweeps the page's animations.

		requestAnimationFrame( fraLooFun ); // What: Next Frame Call. Why: The sweep has to run on every frame until the check reads it. How: This schedules the loop again.


	};


	Reflect.set( window, '__motPolFun', polAniFun ); // What: Motion Poll Global Set. Why: The check runs a last sweep and reads the labels from outside the page. How: This puts the sweep on the window.

	requestAnimationFrame( fraLooFun ); // What: Frame Loop Start Call. Why: The sweep has to start with the page's first frame. How: This schedules the loop's first pass.


	for ( const eveTypStr of [ 'animationstart', 'transitionrun', 'transitionstart' ] ) document.addEventListener( eveTypStr, ( motEveObj ) => { // What: Motion Event Loop. Why: A motion that starts and ends between two frames never shows up in a sweep. How: This listens for each event an animation or transition fires as it begins, on the document in the capture phase, catching every element's events before they reach it.


		const isaTraBoo = motEveObj.type !== 'animationstart';                                                                                          // What: Is-A Transition Boolean. Why: Animations and transitions keep their names and durations in different properties. How: This is true for the two transition events.
		const tarEleObj = motEveObj.target as Element;                                                                                                  // What: Target Element Object. Why: The motion's duration is read from the element running it. How: This reads the event's target. // What: Type Assertion Note. Why: Event targets type as EventTarget. How: These events only fire on elements.
		const pseEleStr = ( motEveObj as AnimationEvent ).pseudoElement || null;                                                                        // What: Pseudo Element String. Why: A motion can run on an element's pseudo-element, whose styles are its own. How: This reads the event's pseudo-element, or null for the element itself. // What: Type Assertion Note. Why: The listener types its event as a plain Event. How: Both animation and transition events carry pseudoElement, read here through the animation event's type.
		const motNamStr = isaTraBoo ? ( motEveObj as TransitionEvent ).propertyName : ( motEveObj as AnimationEvent ).animationName;                    // What: Motion Name String. Why: The duration belongs to one animation name or one transition property. How: This reads the transition's property or the animation's name. // What: Type Assertion Note. Why: The listener types its event as a plain Event. How: isaTraBoo says which kind of event it is.
		const motStyObj = getComputedStyle( tarEleObj, pseEleStr );                                                                                     // What: Motion Style Object. Why: The event doesn't carry the motion's duration. How: This reads the computed styles of the element, or of its pseudo-element.
		const namLisArr = ( isaTraBoo ? motStyObj.transitionProperty : motStyObj.animationName ).split( ',' ).map( ( namCurStr ) => namCurStr.trim() ); // What: Name List Array. Why: An element can list several animations or transitioned properties. How: This splits the list that matches the event's kind.
		const durLisArr = ( isaTraBoo ? motStyObj.transitionDuration : motStyObj.animationDuration ).split( ',' ).map( durMilFun );                     // What: Duration List Array. Why: Each name in the list has its own duration. How: This splits the matching duration list and converts each to milliseconds.
		const namIndNum = namLisArr.includes( motNamStr ) ? namLisArr.lastIndexOf( motNamStr ) : namLisArr.lastIndexOf( 'all' );                        // What: Name Index Number. Why: The motion's duration sits at its name's place in the list, and a later entry wins over an earlier one. How: This finds the last entry naming the motion, or the last all entry for a transition, or -1.
		const motDurNum = namIndNum < 0 ? Math.max( ...durLisArr ) : durLisArr[ namIndNum % durLisArr.length ];                                         // What: Motion Duration Number. Why: The check needs the motion's own duration. How: This reads the duration at its name's place, wrapping round a shorter duration list as CSS does, or the longest one listed when no entry names it.


		if ( motDurNum > 1 ) motLabSet.add( `${ motNamStr } on ${ eleDesFun( tarEleObj, pseEleStr ) }` ); // What: Long Motion Add Call. Why: Each long motion should be named in the failure, with the same label a sweep gives it. How: This records its name and element when it lasts longer than 1ms.


	}, true ); // What: Capture Phase Flag. Why: The recorder has to see each motion event before anything on the page can stop it. How: This registers the listener for the capture phase.


}

// #endregion motRecFun



// #region namProFun

/**
 * namProFun = Name Problems Function
 *
 * @summary
 * Reads the page's accessibility tree, the same tree a screen reader reads,
 * and returns a problem for every link or button with no name, and for every
 * one whose name contains a decorative glyph that should have been hidden.
 * Elements hidden from assistive technology don't appear in the tree, so the
 * decorative elements hidden from it are never counted.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to read.
 *
 * @returns A promise that resolves with every naming problem found.
 * @see {@link proLisArr}
 *
 * @example
 * ```ts
 * namProFun(page) // => [ '- button has no name' ]
 * ```
 *
*/

async function namProFun ( curPagObj : Page ) : Promise< string[] > {


	const ariSnaStr = await curPagObj.locator( 'body' ).ariaSnapshot();    // What: ARIA Snapshot String. Why: The accessibility tree shows each control's role and announced name. How: This reads the body's tree as text, one node per line.
	const conLinArr = ariSnaStr.match( /- (link|button)\b[^\n]*/g ) || []; // What: Control Line Array. Why: Only links and buttons are checked here. How: This keeps every tree line for one of those roles.

	const proLisArr : string[] = []; // What: Problem List Array. Why: Every problem should be reported, not just the first. How: This collects them.


	for ( const conLinStr of conLinArr ) { // What: Control Line Loop. Why: Each link and button is judged on its own. How: This reads each line's name and records what's wrong with it.


		const conNamStr = ( conLinStr.match( /"([^"]*)"/ ) || [] )[ 1 ] || ''; // What: Control Name String. Why: The announced name sits in quotes after the role. How: This takes the quoted text, or an empty name when there's none.


		if ( !conNamStr.trim() ) proLisArr.push( `${ conLinStr } has no name` ); // What: Missing Name Check. Why: A control with no name is announced as just its role. How: This records the line when its name is empty.

		else if ( GLY_DEC_REG.test( conNamStr ) ) proLisArr.push( `${ conLinStr } has a decorative glyph in its name` ); // What: Glyph Name Check. Why: A decorative arrow in a name is read aloud. How: This records the line when its name contains one.


	}



	return proLisArr; // What: Problem List Return. Why: The test prints whatever was found. How: This hands back every problem collected.


}

// #endregion namProFun



// #region scrSetFun

/**
 * scrSetFun = Scroll Settled Function
 *
 * @summary
 * Runs inside the page and resolves once the page has stopped scrolling,
 * meaning its scroll position hasn't changed for 15 frames in a row (about a
 * quarter of a second), or after 2 seconds at most. WebKit scrolls a focused
 * text field into view a few frames after focusing it rather than at once,
 * so measuring a stop straight after the Tab press would find it still off
 * screen. Passed to Playwright's evaluate, so it can't read anything from
 * this file.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once scrolling has stopped, with no value.
 *
 * @example
 * ```ts
 * page.evaluate(scrSetFun) // => Promise<void>
 * ```
 *
*/

function scrSetFun () : Promise< void > {


	return new Promise( ( resSetFun ) => { // What: Settle Promise Return. Why: The walk waits on the page's frames. How: This resolves from inside a frame loop once scrolling has stopped.


		const staTimNum = performance.now(); // What: Start Time Number. Why: A page that never stops scrolling shouldn't hang the walk. How: This records when the wait began.

		let preScrNum = scrollY; // What: Previous Scroll Number. Why: Each frame is compared with the one before. How: This holds the last frame's scroll position.
		let staFraNum = 0;       // What: Stable Frame Number. Why: Scrolling has settled only after several unchanged frames. How: This counts them in a row.


		const fraCheFun = () => { // What: Frame Check Function. Why: Scrolling is judged once per frame. How: This counts unchanged frames and resolves after 15 of them or 2 seconds.


			staFraNum = scrollY === preScrNum ? staFraNum + 1 : 0; // What: Stable Frame Update. Why: Any movement restarts the count. How: This adds one for an unchanged frame and resets it otherwise.

			preScrNum = scrollY; // What: Previous Scroll Update. Why: The next frame is compared with this one. How: This stores this frame's position.



			if ( staFraNum >= 15 || performance.now() - staTimNum > 2000 ) { resSetFun(); return; } // What: Settled Guard. Why: The wait ends once scrolling has stopped, or after 2 seconds. How: This resolves the promise and stops the loop.



			requestAnimationFrame( fraCheFun ); // What: Next Frame Call. Why: Scrolling is checked again next frame. How: This schedules the check.


		};


		requestAnimationFrame( fraCheFun ); // What: First Frame Call. Why: The loop starts on the next frame. How: This schedules the first check.


	} );


}

// #endregion scrSetFun



type StoInfTyp = { // What: Stop Information Type. Why: The keyboard walk judges each stop outside the page. How: This describes what the page reports about one stop.


	covBoo : boolean, // What: Covered Boolean. Why: A stop hidden behind another element can't be seen while focused. How: This is true when something else sits on top of the stop's center.
	desStr : string,  // What: Description String. Why: A problem should name the element a person would recognize. How: This joins the stop's tag and its label or text.
	indBoo : boolean, // What: Indicator Boolean. Why: A keyboard user has to see where focus is. How: This is true when focusing the stop changes how it looks.
	ordNum : number,  // What: Order Number. Why: Focus order is compared with document order. How: This is the stop's position among every element in the page.
	visBoo : boolean  // What: Visible Boolean. Why: A stop off screen leaves a keyboard user lost. How: This is true when the stop has a size and overlaps the viewport.


};

// #region stoInfFun

/**
 * stoInfFun = Stop Information Function
 *
 * @summary
 * Runs inside the page after each Tab press and describes the focused stop, or
 * returns null once focus has left the page: onto the body, to nothing, or out
 * of the document entirely. (Firefox does none of these after its last stop;
 * keyProFun catches it there instead, when focus stays on the same stop.) The
 * focus indicator is judged by blurring the stop for a moment and comparing
 * the styles a focus indicator usually changes (outline, shadow, border,
 * background, color, and underline), then focusing it again so the walk
 * continues from it. A stop that slides into view on focus, such as a skip
 * link, is measured once its slide finishes. Coverage is judged by asking
 * which element sits at the stop's center: anything other than the stop or
 * one of its own descendants means the stop is hidden behind it. Passed to
 * Playwright's evaluate, so it can't read anything from this file.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the stop's description, or null when
 *          the walk has ended.
 *
 * @example
 * ```ts
 * page.evaluate(stoInfFun) // => { covBoo, desStr, indBoo, ordNum, visBoo }
 * ```
 *
*/

async function stoInfFun () : Promise< StoInfTyp | null > {


	// #region Walk End Detection

	const actCurEle = document.activeElement as HTMLElement | null; // What: Active Current Element. Why: The stop is whatever holds focus after the press. How: This reads the focused element. // What: Type Assertion Note. Why: activeElement types as Element, which has no blur or focus. How: Every element that can hold focus in this app is an HTMLElement.

	const actBodBoo = actCurEle === document.body; // What: Active Body Boolean. Why: Focus resting on the body means no stop holds it. How: This compares the focused element with the body.
	const actMisBoo = !actCurEle;                  // What: Active Missing Boolean. Why: Some engines report no focused element at all once focus leaves. How: This is true when there is none.
	const docBluBoo = !document.hasFocus();        // What: Document Blurred Boolean. Why: Focus can leave for the browser's own interface. How: This is true when the document no longer has focus.

	const walDonBoo = actMisBoo || actBodBoo || docBluBoo; // What: Walk Done Boolean. Why: Any of the three means the walk has left the page. How: This combines them.


	if ( walDonBoo ) return null; // What: Walk End Guard. Why: Focus on the body, nowhere, or outside the document means the walk has left the page. How: This returns null to end the walk.

	// #endregion Walk End Detection



	// #region Focus Indicator Check

	const sigStyFun = () => { // What: Signature Style Function. Why: A focus indicator is any visible change between focused and unfocused. How: This reads the stop's styles as one string to compare.


		const styCurObj = getComputedStyle( actCurEle ); // What: Style Current Object. Why: The stop's styles are compared as they're drawn now. How: This reads its computed styles.



		return [ styCurObj.outlineStyle, styCurObj.outlineWidth, styCurObj.outlineColor, styCurObj.boxShadow, styCurObj.borderColor, styCurObj.backgroundColor, styCurObj.color, styCurObj.textDecorationLine ].join( '|' ); // What: Signature Return. Why: Two looks compare as one string. How: This joins every style a focus indicator usually changes.


	};


	const focSigStr = sigStyFun(); // What: Focused Signature String. Why: The stop's look while focused is the first half of the comparison. How: This reads it before anything changes.


	actCurEle.blur(); // What: Stop Blur Call. Why: The unfocused look is the other half of the comparison. How: This removes focus for a moment.


	const bluSigStr = sigStyFun(); // What: Blurred Signature String. Why: The stop's unfocused look completes the comparison. How: This reads the same styles after the blur.


	actCurEle.focus(); // What: Stop Refocus Call. Why: The walk continues from this stop. How: This puts focus back where the Tab press left it.


	const sliTraArr = actCurEle.getAnimations().filter( ( aniCurObj ) => aniCurObj instanceof CSSTransition && aniCurObj.transitionProperty === 'transform' ); // What: Slide Transition Array. Why: A stop that slides into view on focus, such as a skip link, has to be judged where it lands. How: This keeps the stop's running transform transitions.


	await Promise.allSettled( sliTraArr.map( ( sliCurObj ) => sliCurObj.finished ) ); // What: Slide Settled Wait. Why: Measuring mid-slide would find the stop partly off screen. How: This waits until each slide has finished, or been cancelled.

	// #endregion Focus Indicator Check



	// #region Stop Geometry And Label

	const recCurObj = actCurEle.getBoundingClientRect();                                                                       // What: Rect Current Object. Why: A focused stop has to be on screen and uncovered. How: This measures the stop.
	const topCurEle = document.elementFromPoint( recCurObj.left + recCurObj.width / 2, recCurObj.top + recCurObj.height / 2 ); // What: Top Current Element. Why: Whatever is drawn on top at the stop's center is what a person sees there. How: This asks the page which element sits at that point.



	const ariLabStr = actCurEle.getAttribute( 'aria-label' ); // What: ARIA Label String. Why: A stop's own label names it best. How: This reads its aria-label, or null.
	const eleIdeStr = actCurEle.id;                           // What: Element Identifier String. Why: A form field without a label is still recognizable by its id. How: This reads the stop's id, empty when it has none.
	const eleTexStr = actCurEle.textContent;                  // What: Element Text String. Why: A link or button is usually named by its text. How: This reads the stop's text.

	const stoLabStr = ariLabStr || eleIdeStr || eleTexStr || ''; // What: Stop Label String. Why: A problem should name the stop the way a person would recognize it. How: This takes the label, then the id, then the text, then nothing.


	const botBelBoo = recCurObj.bottom > 0;        // What: Bottom Below Boolean. Why: A stop entirely above the viewport is off screen. How: This is true when its bottom edge sits below the viewport's top.
	const heiPosBoo = recCurObj.height > 0;        // What: Height Positive Boolean. Why: A stop with no height can't be seen. How: This is true when it has some height.
	const lefInsBoo = recCurObj.left < innerWidth; // What: Left Inside Boolean. Why: A stop entirely right of the viewport is off screen. How: This is true when its left edge sits inside the viewport's width.
	const rigInsBoo = recCurObj.right > 0;         // What: Right Inside Boolean. Why: A stop entirely left of the viewport is off screen. How: This is true when its right edge sits past the viewport's left.
	const topAboBoo = recCurObj.top < innerHeight; // What: Top Above Boolean. Why: A stop entirely below the viewport is off screen. How: This is true when its top edge sits above the viewport's bottom.
	const widPosBoo = recCurObj.width > 0;         // What: Width Positive Boolean. Why: A stop with no width can't be seen. How: This is true when it has some width.

	const visStoBoo = botBelBoo && heiPosBoo && lefInsBoo && rigInsBoo && topAboBoo && widPosBoo; // What: Visible Stop Boolean. Why: A focused stop has to be on screen. How: This is true when it has a size and overlaps the viewport.

	// #endregion Stop Geometry And Label



	return { // What: Stop Information Return. Why: The walk judges each stop outside the page. How: This hands back the stop's coverage, description, indicator, position, and visibility.


		covBoo : !!topCurEle && !actCurEle.contains( topCurEle ),                               // What: Covered Boolean. Why: The stop is hidden when something else is on top of it. How: This is true when the top element at its center is neither the stop nor inside it.
		desStr : `${ actCurEle.tagName.toLowerCase() } "${ stoLabStr.trim().slice( 0, 40 ) }"`, // What: Description String. Why: A problem should name the element a person would recognize. How: This joins the tag with the first 40 characters of its label, id, or text.
		indBoo : focSigStr !== bluSigStr,                                                       // What: Indicator Boolean. Why: A keyboard user has to see where focus is. How: This is true when focusing the stop changes how it looks.
		ordNum : Array.prototype.indexOf.call( document.querySelectorAll( '*' ), actCurEle ),   // What: Order Number. Why: Focus order is compared with document order. How: This is the stop's position among every element in the page.
		visBoo : visStoBoo                                                                      // What: Visible Boolean. Why: A stop off screen leaves a keyboard user lost. How: This reads whether the stop has a size and overlaps the viewport.


	};


}

// #endregion stoInfFun



// #region keyProFun

/**
 * keyProFun = Keyboard Problems Function
 *
 * @summary
 * Walks the page with the Tab key from the top and returns every problem:
 * any element with a positive tabindex, which overrides the document order,
 * and every stop that comes earlier in the document than the stop before
 * it, sits off screen, is covered by something else, or looks the same
 * focused and unfocused. The walk ends when focus leaves the page, comes
 * back to the first stop, or stays on the same stop after a press, which is
 * how Firefox leaves its last stop; one that hasn't ended within TAB_MAX_NUM
 * presses counts as a keyboard trap. WebKit only tabs to links with Alt
 * held, the way Safari does by default, so the walk presses Alt+Tab there.
 * The caller requests reduced motion first, so the page jumps to each stop
 * instead of gliding and focus styles appear at once, and each press waits
 * for scrolling to settle, so every stop is measured where and how it ends
 * up.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to walk.
 * @param engNamStr - Engine Name String: The browser the project runs in.
 *
 * @returns A promise that resolves with every keyboard problem found.
 * @see {@link proLisArr}
 *
 * @example
 * ```ts
 * keyProFun(page, 'webkit') // => [ 'input "email" has no visible ...' ]
 * ```
 *
*/

async function keyProFun ( curPagObj : Page, engNamStr : string ) : Promise< string[] > {


	const posTabNum = await curPagObj.locator( '[tabindex]' ).evaluateAll( ( tabEleArr ) => tabEleArr.filter( ( tabCurEle ) => Number( tabCurEle.getAttribute( 'tabindex' ) ) > 0 ).length ); // What: Positive Tabindex Number. Why: A positive tabindex pulls an element ahead of the document order. How: This counts every element carrying one.
	const tabKeyStr = engNamStr === 'webkit' ? 'Alt+Tab' : 'Tab'; // What: Tab Key String. Why: WebKit skips links on a plain Tab, the way Safari does by default. How: This picks Alt+Tab there and Tab everywhere else.

	const proLisArr : string[] = posTabNum ? [ `${ posTabNum } element(s) use a positive tabindex` ] : []; // What: Problem List Array. Why: Every problem should be reported, not just the first. How: This starts with the positive tabindex count, when there is one, and collects the rest during the walk.

	let firStoStr = ''; // What: First Stop String. Why: Focus coming back to the first stop means the walk went all the way around. How: This holds the first stop's description.
	let preOrdNum = -1; // What: Previous Order Number. Why: Each stop must come later in the document than the last. How: This holds the previous stop's position among every element.


	for ( let tabCouNum = 0; tabCouNum < TAB_MAX_NUM; tabCouNum++ ) { // What: Tab Walk Loop. Why: Every stop is checked in the order a keyboard user meets it. How: This presses Tab once per pass, up to the cap.


		await curPagObj.keyboard.press( tabKeyStr ); // What: Tab Press Call. Why: Each pass moves focus to the next stop. How: This presses the engine's Tab key.

		await curPagObj.evaluate( scrSetFun ); // What: Scroll Settled Wait. Why: Some engines scroll a focused field into view a few frames late. How: This waits until the page has stopped scrolling.


		const stoInfObj = await curPagObj.evaluate( stoInfFun );                                          // What: Stop Information Object. Why: The stop is described and measured inside the page. How: This runs stoInfFun there.
		const walEndBoo = !stoInfObj || stoInfObj.desStr === firStoStr || stoInfObj.ordNum === preOrdNum; // What: Walk Ended Boolean. Why: Focus leaving the page, coming back around, or staying put means every stop was visited. How: This checks each in turn, the later two only once a stop exists, so the chain stays inline. // What: Firefox Walk End Note. Why: Firefox moves focus out to its own interface after the last stop but still reports that stop as focused. How: Focus staying on the same stop after a press is read as the walk leaving the page.


		if ( walEndBoo ) return proLisArr; // What: Walk End Guard. Why: A walk that reaches its end has found every problem there is. How: This returns them, ending the walk.



		if ( !firStoStr ) firStoStr = stoInfObj.desStr; // What: First Stop Record. Why: The walk ends if focus comes back to it. How: This remembers the first stop's description.



		if ( stoInfObj.ordNum <= preOrdNum ) proLisArr.push( `${ stoInfObj.desStr } comes before the previous stop in the document` ); // What: Order Check. Why: Focus should move forward through the page. How: This records a stop that jumps backwards.



		if ( !stoInfObj.visBoo ) proLisArr.push( `${ stoInfObj.desStr } is focused but not on screen` ); // What: On Screen Check. Why: A keyboard user can't act on what they can't see. How: This records a stop with no size or outside the viewport.

		else if ( stoInfObj.covBoo ) proLisArr.push( `${ stoInfObj.desStr } is focused but covered by another element` ); // What: Covered Check. Why: A stop hidden behind something else can't be seen either. How: This records an on-screen stop with another element on top of it.



		if ( !stoInfObj.indBoo ) proLisArr.push( `${ stoInfObj.desStr } has no visible focus indicator` ); // What: Indicator Check. Why: A keyboard user has to see where focus is. How: This records a stop that looks the same focused and unfocused.



		preOrdNum = stoInfObj.ordNum; // What: Previous Order Update. Why: The next stop is compared with this one. How: This stores this stop's position.


	}



	proLisArr.push( `focus never left the page within ${ TAB_MAX_NUM } presses, a likely keyboard trap` ); // What: Trap Record Call. Why: A keyboard user must always be able to Tab away. How: The loop returns as soon as the walk ends, so reaching this line means it never did.



	return proLisArr; // What: Problem List Return. Why: The test prints whatever was found. How: This hands back every problem collected.


}

// #endregion keyProFun

// #endregion Helpers



// #region Module Init

for ( const staRecObj of STA_REC_ARR ) { // What: State Test Loop. Why: Every check runs on every page state. How: This declares each check once per state.


	test( `${ staRecObj.ideStr } names every link and button cleanly`, async ( { page : curPagObj } ) => { // What: Names Test. Why: Every control must be announced by a clean name. How: This opens the state and checks its accessibility tree.


		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The tree should be read with the state settled. How: This loads and settles it.

		expect( await namProFun( curPagObj ) ).toEqual( [] ); // What: No Name Problems Assertion. Why: The state passes only with clean names. How: This compares the problems with an empty list, so a failure prints each one.


	} );



	test( `${ staRecObj.ideStr } walks cleanly with the keyboard`, async ( { browserName : engNamStr, page : curPagObj } ) => { // What: Keyboard Test. Why: Everything has to be usable without a mouse. How: This opens the state under reduced motion, walks it with Tab, and checks that every stop is reachable, in order, on screen, uncovered, and visibly focused.


		test.slow(); // What: Slow Test Mark. Why: A full walk measures every stop and can run past the default 30-second timeout, as it did in Firefox in tonys-toppers when every suite shared the machine. How: This triples this test's timeout.

		await curPagObj.emulateMedia( { reducedMotion : 'reduce' } ); // What: Reduced Motion Emulation. Why: A smooth scroll or a focus transition still running would be measured halfway. How: This makes the page match prefers-reduced-motion, which turns both off.

		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The walk should start from the state settled. How: This loads and settles it.

		expect( await keyProFun( curPagObj, engNamStr ) ).toEqual( [] ); // What: No Keyboard Problems Assertion. Why: The state passes only when every stop is reachable, in order, on screen, uncovered, and visibly focused. How: This compares the problems with an empty list, so a failure prints each one.


	} );



	test( `${ staRecObj.ideStr } reflows at ${ REF_WID_NUM }px without scrolling sideways`, async ( { page : curPagObj } ) => { // What: Reflow Test. Why: Zoomed-in visitors read in one column without scrolling sideways. How: This opens the state at the reflow width and compares the page's scroll width with its visible width.


		await opeStaFun( curPagObj, { ...staRecObj, widNum : REF_WID_NUM } ); // What: Narrow State Open Call. Why: Reflow is judged at WCAG's narrowest width. How: This opens the state with its width replaced by the reflow width.

		expect( await curPagObj.evaluate( () => document.documentElement.scrollWidth - document.documentElement.clientWidth ) ).toBeLessThanOrEqual( 0 ); // What: No Sideways Scroll Assertion. Why: The page passes only when nothing reaches past the viewport's width. How: This subtracts the visible width from the scrollable width, which stays at zero without sideways scrolling.


	} );



	test( `${ staRecObj.ideStr } plays no motion under reduced motion`, async ( { page : curPagObj } ) => { // What: Reduced Motion Test. Why: Visitors who ask for less motion shouldn't see the page animate. How: This requests reduced motion, installs motRecFun before the page loads, opens the state, and checks the recorder found no animation or transition longer than 1ms from the first frame to a last sweep, ones that started and finished between frames included.


		await curPagObj.emulateMedia( { reducedMotion : 'reduce' } ); // What: Reduced Motion Emulation. Why: The preference has to be set before the page loads. How: This makes the page match prefers-reduced-motion: reduce.

		await curPagObj.addInitScript( motRecFun ); // What: Motion Recorder Install Call. Why: A motion that finishes before the page settles drops out of getAnimations, so reading it only at the end would miss it. How: This runs motRecFun in the page before it loads, recording every motion over 1ms from the start.

		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: Entrance animations are the motion being checked. How: This loads the state and waits for it to settle.

		expect( await curPagObj.evaluate( () => ( Reflect.get( window, '__motPolFun' ) as () => string[] )() ) ).toEqual( [] ); // What: No Motion Assertion. Why: The state passes only when nothing longer than 1ms played as it opened. How: This runs the recorder's last sweep, which also covers what the page still holds and so replaces a separate check of the settled page, and compares every label it recorded with an empty list, so a failure names each motion and its element. // What: Type Assertion Note. Why: Reflect.get types the global as unknown. How: motRecFun stores its sweep there, which returns a string array.


	} );


}

// #endregion Module Init


