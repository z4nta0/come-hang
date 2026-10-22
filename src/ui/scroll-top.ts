


// #region Imports

import { useLayoutEffect   } from 'react';        // What: Use Layout Effect. Why: The page has to move before the browser draws the new route, or the old position would flash first. How: This runs the scroll right after React commits the new page.
import { useLocation       } from 'react-router'; // What: Use Location. Why: The scroll should happen on every navigation, even back to the page already showing. How: Its key changes on each one, and its hash names any section to jump to.
import { useNavigationType } from 'react-router'; // What: Use Navigation Type. Why: Back and forward should return to where the visitor was, not the top. How: This reports a POP for those, which the scroll skips.

// #endregion Imports



/**
 * scroll-top.ts = Scroll To Top
 *
 * @summary
 * A client-side router swaps pages without loading a new document, so the
 * browser never resets the scroll position the way a real page load does: a
 * link clicked at the bottom of one page opens the next one scrolled just as
 * far down. This file holds the hook the app root calls to put every
 * link-driven navigation back at the top, or at the section a link's hash
 * names, while leaving back and forward to the browser's own restoring.
 *
 * Sections:
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Hooks

// #region useScrTopFun

/**
 * useScrTopFun = Use Scroll Top Function
 *
 * @summary
 * Scrolls the window to the top after every navigation a link or a redirect
 * makes, including a link to the page already showing, before the new page
 * is drawn. A navigation whose address carries a hash scrolls that section
 * into view instead, when an element with that id exists. Back and forward
 * (a POP) are skipped, so the browser can return the visitor to where they
 * were. The jump to the top is instant whatever the stylesheet's
 * scroll-behavior says, since a smooth scroll down a whole page reads as
 * motion rather than as arriving on a new page. Call it once, in a
 * component inside the router that stays mounted across routes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * useScrTopFun() // => void
 * ```
 *
*/

function useScrTopFun () : void {


	const locCurObj = useLocation();       // What: Location Current Object. Why: Each navigation needs telling apart, and a hash can name a section. How: This holds the current address, whose key changes on every navigation.
	const navTypStr = useNavigationType(); // What: Navigation Type String. Why: Back and forward should keep the browser's restored position. How: This holds PUSH, REPLACE, or POP for the latest navigation.


	useLayoutEffect( () => { // What: Scroll Reset Effect. Why: A new page should open at its top, or at the section its link names. How: This runs after each navigation commits and before the browser paints it.


		if ( navTypStr === 'POP' ) return; // What: Back And Forward Guard. Why: The browser restores the visitor's earlier position on back and forward. How: This leaves those navigations alone.



		const ancTarEle = locCurObj.hash ? document.getElementById( decodeURIComponent( locCurObj.hash.slice( 1 ) ) ) : null; // What: Anchor Target Element. Why: A link like /#contact should land on its section, not the top. How: This finds the element the hash names, or holds null when there's no hash or no such element.


		if ( ancTarEle ) { ancTarEle.scrollIntoView(); return; } // What: Anchor Scroll Guard. Why: A named section takes the place of the top. How: This scrolls it into view, following the stylesheet's scroll-behavior, and stops.



		window.scrollTo( { behavior : 'instant', left : 0, top : 0 } ); // What: Window Top Scroll Call. Why: Every other navigation should open the new page at its top. How: This jumps there at once, overriding any smooth scroll-behavior.


	}, [ locCurObj.key, locCurObj.hash, navTypStr ] ); // What: Effect Dependency Array. Why: The scroll must run once per navigation. How: locCurObj.key changes on every navigation, even to the same address, locCurObj.hash changes which section is the target, and navTypStr says whether the browser is restoring a position.


}

// #endregion useScrTopFun

// #endregion Hooks



// #region Exports

export { useScrTopFun }; // What: Named Exports. Why: app.tsx is the sole consumer, calling the hook once from the app root. How: This exports useScrTopFun.

// #endregion Exports


