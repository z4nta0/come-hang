


// #region Imports

import { redMotFun } from '../utils/motion.ts'; // What: Reduced Motion Function. Why: The jump scrolls smoothly unless the member asked for less motion. How: This reads the preference.
import { useEffect } from 'react';              // What: Use Effect. Why: The jump waits for its item to render, and stops when the section goes. How: This runs the wait after rendering.
import { useRef    } from 'react';              // What: Use Reference. Why: The latest end callback is read when the wait ends. How: This holds it.

// #endregion Imports



/**
 * item-jump.ts = Item Jump
 *
 * @summary
 * Takes a member from the notices sheet to one item waiting on them, such
 * as a join request in People: once the item's element renders, marked by
 * its `data-waiting-item-key`, it scrolls into view, takes focus so a screen
 * reader announces it, and flashes a ring through `data-jump-flash-active`,
 * which the global stylesheet's Body State region styles. An item that
 * doesn't appear within a few seconds was answered already.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const JUM_TIC_NUM = 100;  // What: Jump Tick Number. Why: The item's element renders once its data loads, so it's looked for again. How: This is how often, in milliseconds, a literal that only paces the wait.
const JUM_WAI_NUM = 5000; // What: Jump Wait Number. Why: An item answered by someone else never renders, and the wait has to end. How: This is how long it lasts, in milliseconds, a literal safety timeout.

// #endregion Constants



// #region Helpers

// #region jumFlaFun

/**
 * jumFlaFun = Jump Flash Function
 *
 * @summary
 * Scrolls an element into the middle of its scroll area, smoothly unless the
 * member asked for less motion, focuses it without a second scroll, and
 * restarts its flash by marking it `data-jump-flash-active` afresh, the mark
 * clearing once the flash ends, which still happens under reduced motion.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param iteEleObj - Item Element Object: The item's element, focusable.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * jumFlaFun(rowEleObj) // => void
 * ```
 *
*/

const jumFlaFun = ( iteEleObj : HTMLElement ) : void => { // What: Jump Flash Function. Why: The member should see and hear which item they came for. How: This scrolls to it, focuses it, and flashes it.


	iteEleObj.scrollIntoView( { behavior : redMotFun() ? 'instant' : 'smooth', block : 'center' } ); // What: Scroll Call. Why: The item may sit below the fold. How: This brings it to the middle, at once under reduced motion.

	iteEleObj.focus( { preventScroll : true } ); // What: Focus Call. Why: A screen reader announces the item, and the next Tab carries on from it. How: This focuses it without fighting the scroll.

	iteEleObj.removeAttribute( 'data-jump-flash-active' ); // What: Flash Reset Call. Why: A second jump to the same item should flash again. How: This clears an earlier mark.


	void iteEleObj.offsetWidth; // What: Reflow Read. Why: The browser restarts an animation only once it has seen the mark gone. How: This forces a style pass between the two.


	iteEleObj.setAttribute( 'data-jump-flash-active', '' ); // What: Flash Set Call. Why: The ring draws the eye to the item. How: This marks it, which starts the flash.

	iteEleObj.addEventListener( 'animationend', () => iteEleObj.removeAttribute( 'data-jump-flash-active' ), { once : true } ); // What: Flash End Listener. Why: The mark shouldn't outlast its flash. How: This clears it when the animation ends, once.


};

// #endregion jumFlaFun

// #endregion Helpers



// #region Hooks

// #region useIteJumFun

/**
 * useIteJumFun = Use Item Jump Function
 *
 * @summary
 * While waiStr names an item, looks for the element marked with it every
 * 100ms for up to 5 seconds. Once found, it jumps there and flashes it, then
 * calls onEndFun with true; if the time runs out first, it calls onEndFun
 * with false, for an item already answered. It expects the caller to drop
 * waiStr from the screen in onEndFun, so the jump happens once. A new waiStr,
 * or the section going, ends the wait without a call.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param waiStr   - Waiting String: The item's kind and person, such as
 *                   `join:u1`, or undefined when nothing was asked for.
 * @param onEndFun - On End Function: Called once with whether the item was
 *                   found.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * useIteJumFun('join:u1', (fouValBoo) => ...) // => void
 * ```
 *
*/

const useIteJumFun = ( waiStr : string | undefined, onEndFun : ( fouValBoo : boolean ) => void ) : void => { // What: Use Item Jump Function. Why: People and Settings open at the item the sheet named. How: This waits for its element and jumps there.


	const endFunRef = useRef( onEndFun ); // What: End Function Reference. Why: The wait shouldn't restart because the caller made a new callback. How: This holds the latest one.



	useEffect( () => { endFunRef.current = onEndFun; } ); // What: End Function Effect. Why: The wait calls the caller's current callback. How: This keeps it after every render.



	useEffect( () => { // What: Jump Wait Effect. Why: The item's element renders once its section's data loads. How: This looks for it each tick until it appears or the time runs out.


		if ( waiStr === undefined ) return; // What: Nothing Asked Guard. Why: Most visits ask for no item. How: This returns.



		const staTimNum = Date.now(); // What: Start Time Number. Why: The wait ends 5 seconds after it began. How: This records when.



		const ticIdeNum = window.setInterval( () => { // What: Tick Identifier Number. Why: The element is looked for until it's found or the time runs out. How: This checks each tick, keeping the interval to clear it.


			const iteEleObj = document.querySelector< HTMLElement >( `[data-waiting-item-key="${ CSS.escape( waiStr ) }"]` ); // What: Item Element Object. Why: The item is found by its key. How: This looks for the marked element, null until it renders.



			if ( iteEleObj === null && Date.now() - staTimNum < JUM_WAI_NUM ) return; // What: Still Waiting Guard. Why: The item may still be loading. How: This returns until the time runs out.



			window.clearInterval( ticIdeNum ); // What: Tick Stop Call. Why: The wait is over either way. How: This clears the interval.


			if ( iteEleObj !== null ) jumFlaFun( iteEleObj ); // What: Jump Call. Why: The member came for this item. How: This jumps to it when it rendered.


			endFunRef.current( iteEleObj !== null ); // What: End Call. Why: The caller drops the request, and says when the item was answered already. How: This reports whether it was found.


		}, JUM_TIC_NUM );



		return () => window.clearInterval( ticIdeNum ); // What: Cleanup Return. Why: A wait shouldn't outlive its section or its item. How: This clears the interval.


	}, [ waiStr ] ); // What: Effect Dependency Array. Why: Each item asked for gets its own wait. How: waiStr changes when another one is.


};

// #endregion useIteJumFun

// #endregion Hooks



// #region Exports

export { useIteJumFun }; // What: Named Export. Why: People and Settings jump to the item the notices sheet names. How: This exports useIteJumFun.

// #endregion Exports


