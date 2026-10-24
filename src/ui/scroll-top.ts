


// #region Imports

import { useLayoutEffect   } from 'react';        // What: Use Layout Effect. Why: The page has to move before the browser draws the new route, or the old position would flash first. How: This runs the scroll right after React commits the new page.
import { useLocation       } from 'react-router'; // What: Use Location. Why: The scroll should happen on every navigation, even back to the page already showing. How: Its key changes on each one, and its hash names any section to jump to.
import { useNavigationType } from 'react-router'; // What: Use Navigation Type. Why: Back and forward should return to where the visitor was, not the top. How: This reports a POP for those, which restore their saved position instead.

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
 * names, and to return back and forward to where the visitor was. It restores
 * those positions itself rather than leaving them to the browser, since
 * Firefox restores one while the page being left is still drawn, cutting it
 * short when that page is shorter. Each history entry's position is recorded
 * and saved to session storage as the visitor scrolls, keeping the most
 * recent entries, so a reload returns to it too. A fresh load of an address
 * forgets the position its first entry was left at, since it's a new visit.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Hooks
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const POS_MAX_NUM = 100;                // What: Position Maximum Number. Why: Every navigation adds a history entry, and the whole record is saved on each scroll, so it mustn't grow for as long as a tab stays open. How: This is how many of the most recent entries' positions are kept.
const POS_STO_STR = 'scroll-positions'; // What: Position Storage String. Why: The recorded positions have to survive a reload. How: This is the session storage key they're saved under.

// #endregion Constants



// #region Module State

let scrKeyStr = 'default'; // What: Scroll Key String. Why: A recorded position belongs to the history entry showing when the visitor scrolled. How: This holds the router's location key for that entry, which the hook updates on every navigation, starting from the key React Router gives a first load.

const scrPosMap = new Map< string, number >(); // What: Scroll Position Map. Why: Back, forward, and a reload return to where the visitor was. How: This maps each history entry's location key to its last scroll position, oldest entry first.



try { // What: Saved Positions Read. Why: A reload should find the positions recorded before it, and storage may hold something else entirely. How: This parses the saved pairs and keeps only those with a string key and a finite position.


	const savPosAny : unknown = JSON.parse( sessionStorage.getItem( POS_STO_STR ) || '[]' ); // What: Saved Positions Any. Why: The stored text could be anything another version or a visitor left. How: This parses it without trusting its shape.


	for ( const savEntAny of Array.isArray( savPosAny ) ? savPosAny : [] ) { // What: Saved Entry Loop. Why: Each pair is checked on its own, so one bad entry doesn't lose the rest. How: This walks the parsed list when it is one, and nothing otherwise.


		const entArrBoo = Array.isArray( savEntAny );                                                           // What: Entry Array Boolean. Why: A saved entry is a key and position pair. How: This is true when the entry is a list.
		const entKeyBoo = entArrBoo && typeof savEntAny[ 0 ] === 'string';                                      // What: Entry Key Boolean. Why: A location key is a string. How: This is true when the pair's first item is one.
		const entTopBoo = entArrBoo && typeof savEntAny[ 1 ] === 'number' && Number.isFinite( savEntAny[ 1 ] ); // What: Entry Top Boolean. Why: A scroll position has to be a real number. How: This is true when the pair's second item is a finite number.

		const entValBoo = entKeyBoo && entTopBoo; // What: Entry Valid Boolean. Why: Only a well-formed pair can be restored. How: This combines both checks.


		if ( entValBoo ) scrPosMap.set( savEntAny[ 0 ], savEntAny[ 1 ] ); // What: Valid Entry Record. Why: A well-formed pair is a position worth returning to. How: This adds it to the map in its saved order.


	}


}

catch { scrPosMap.clear(); } // What: Unreadable Positions Fallback. Why: Storage can be blocked, such as when a visitor turns off site data, or hold something that isn't JSON. How: This starts with no saved positions, so pages simply open at their top.



const navEntObj = performance.getEntriesByType( 'navigation' )[ 0 ] as PerformanceNavigationTiming | undefined; // What: Navigation Entry Object. Why: A reload or a return through history should restore the first entry's position, but a fresh load of an address in the same tab starts a new visit under the same default key. How: This reads how the page was loaded. // What: Type Assertion Note. Why: getEntriesByType types its entries as the general PerformanceEntry. How: The navigation type only ever lists a PerformanceNavigationTiming, or nothing in an old engine.


if ( navEntObj?.type === 'navigate' ) scrPosMap.delete( 'default' ); // What: Fresh Load Guard. Why: A new visit shouldn't open where an earlier one was left. How: This forgets the default key's position when the page was loaded fresh.

// #endregion Module State



// #region Hooks

// #region useScrTopFun

/**
 * useScrTopFun = Use Scroll Top Function
 *
 * @summary
 * Scrolls the window to the top after every navigation a link or a redirect
 * makes, including a link to the page already showing, before the new page
 * is drawn. A navigation whose address carries a hash scrolls that section
 * into view instead, when an element with that id exists, following the
 * stylesheet's scroll-behavior. Back, forward, and a reload (a POP) return to
 * the position recorded for that history entry, after its page has rendered,
 * or are handled like any other navigation when none was recorded, such as on
 * a first visit. The jumps to
 * the top and to a recorded position are instant whatever the stylesheet's
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
	const navTypStr = useNavigationType(); // What: Navigation Type String. Why: Back and forward should return to the recorded position rather than the top. How: This holds PUSH, REPLACE, or POP for the latest navigation.


	useLayoutEffect( () => { // What: Scroll Reset Effect. Why: A new page should open at its top, at the section its link names, or on back and forward at the position it was left at. How: This runs after each navigation commits and before the browser paints it.


		scrKeyStr = locCurObj.key; // What: Scroll Key Assignment. Why: Scrolling from here on belongs to the entry now showing. How: This points the scroll recorder at the new location key.



		const savTopNum = scrPosMap.get( locCurObj.key ); // What: Saved Top Number. Why: Back, forward, and a reload return to the entry's recorded position. How: This reads it, or holds undefined when none was recorded.


		if ( navTypStr === 'POP' && savTopNum !== undefined ) { window.scrollTo( { behavior : 'instant', left : 0, top : savTopNum } ); return; } // What: Back And Forward Restore Guard. Why: Back, forward, and a reload should return to where the visitor was, once the earlier page has rendered. How: This jumps to the recorded position and stops, leaving a POP with nothing recorded to the hash and top handling below.



		let ancIdeStr = locCurObj.hash.slice( 1 ); // What: Anchor Identifier String. Why: A link like /#contact names the section to land on. How: This holds the hash without its #, still percent-encoded, or an empty string when there's no hash.



		try { ancIdeStr = decodeURIComponent( ancIdeStr ); } // What: Anchor Decode Attempt. Why: An id with spaces or other special characters arrives percent-encoded in the address. How: This decodes it back to the id the element carries.

		catch { ancIdeStr = ''; } // What: Malformed Escape Fallback. Why: A mistyped or crafted hash such as #%E0 holds an escape that can't be decoded, and the thrown error would take down the whole app. How: This drops the hash, so the page opens at its top instead.



		const ancTarEle = ancIdeStr ? document.getElementById( ancIdeStr ) : null; // What: Anchor Target Element. Why: A link like /#contact should land on its section, not the top. How: This finds the element the decoded hash names, or holds null when there's no usable hash or no such element.


		if ( ancTarEle ) { ancTarEle.scrollIntoView(); return; } // What: Anchor Scroll Guard. Why: A named section takes the place of the top. How: This scrolls it into view, following the stylesheet's scroll-behavior, and stops.



		window.scrollTo( { behavior : 'instant', left : 0, top : 0 } ); // What: Window Top Scroll Call. Why: Every other navigation should open the new page at its top. How: This jumps there at once, overriding any smooth scroll-behavior.


	}, [ locCurObj.key, locCurObj.hash, navTypStr ] ); // What: Effect Dependency Array. Why: The scroll must run once per navigation. How: locCurObj.key changes on every navigation, even to the same address, locCurObj.hash changes which section is the target, and navTypStr says whether a recorded position should be restored.


}

// #endregion useScrTopFun

// #endregion Hooks



// #region Module Init

history.scrollRestoration = 'manual'; // What: Manual Scroll Restoration Assignment. Why: Firefox would otherwise restore a position while the page being left is still drawn, cutting it short, before the hook's own restore runs. How: This stops the browser restoring positions on its own.


window.addEventListener( 'scroll', () => { // What: Scroll Recorder Listener. Why: Back, forward, and a reload return to the position each entry was left at, and a mobile browser can discard a background tab without firing pagehide, so saving only as the page hides could lose it. How: On every scroll event, which the browser fires at most once a frame, this records the position under the showing entry's key, trims the oldest, and saves the positions to session storage.


	scrPosMap.delete( scrKeyStr ); // What: Position Removal Call. Why: Re-adding an entry moves it to the end, so the map stays ordered oldest first. How: This removes the showing entry's old position, if any.

	scrPosMap.set( scrKeyStr, window.scrollY ); // What: Position Record Call. Why: The showing entry's latest position is the one to return to. How: This stores it under the entry's location key, as the newest entry.


	if ( scrPosMap.size > POS_MAX_NUM ) scrPosMap.delete( scrPosMap.keys().next().value! ); // What: Oldest Position Trim. Why: The record shouldn't grow for as long as the tab stays open. How: This drops the oldest entry once there are more than POS_MAX_NUM. // What: Non-Null Note. Why: The iterator's first value types as possibly undefined. How: The map holds more than POS_MAX_NUM entries here, so a first key exists.



	try { sessionStorage.setItem( POS_STO_STR, JSON.stringify( [ ...scrPosMap ] ) ); } // What: Positions Write Attempt. Why: The positions only survive a reload in storage. How: This saves them as a JSON list of key and position pairs, oldest first.

	catch ( errCatObj ) { console.warn( errCatObj ); } // What: Positions Write Failure. Why: Storage can be full or blocked, and the failure should stay visible to anyone debugging. How: This logs it, and back and forward still restore from memory.


} );

// #endregion Module Init



// #region Exports

export { useScrTopFun }; // What: Named Export. Why: app.tsx is the sole consumer, calling the hook once from the app root. How: This exports useScrTopFun.

// #endregion Exports


