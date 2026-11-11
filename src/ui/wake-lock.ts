


// #region Imports

import { useEffect } from 'react'; // What: Use Effect. Why: The lock is held while the caller asks for it, and released after. How: This runs the request and the release around it.

// #endregion Imports



/**
 * wake-lock.ts = Wake Lock
 *
 * @summary
 * Keeps the screen on while a screen asks it to, through the browser's Screen
 * Wake Lock API (ARCHITECTURE.md Section 10). The browser drops the lock
 * whenever the page is hidden, so it's asked for again each time the page
 * comes back into view, and it's released as soon as the screen no longer
 * wants it. A browser without the API keeps the screen as it would anyway.
 *
 * Sections:
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Hooks

// #region useWakLocFun

/**
 * useWakLocFun = Use Wake Lock Function
 *
 * @summary
 * Holds a screen wake lock while wanValBoo is true and the calling component
 * is mounted, asking for it again each time the page comes back into view,
 * and releases it once wanValBoo turns false or the component unmounts. A
 * request the browser refuses is logged, and a browser without the API gets
 * nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param wanValBoo - Want Value Boolean: Whether the screen should stay on.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * useWakLocFun(true) // => void
 * ```
 *
*/

const useWakLocFun = ( wanValBoo : boolean ) : void => { // What: Use Wake Lock Function. Why: Sharing a location as someone moves needs the app open with the screen on. How: This holds the screen on while asked.


	useEffect( () => { // What: Wake Lock Effect. Why: The lock follows whether it's wanted and whether the page shows. How: This asks for it, again on each return to view, and releases it on cleanup.


		if ( !wanValBoo || !( 'wakeLock' in navigator ) ) return; // What: Not Wanted Guard. Why: Only a screen asking for it holds the lock, and a browser without the API can't. How: This returns.



		let actValBoo = true;                           // What: Active Value Boolean. Why: A lock granted after the cleanup mustn't stay held. How: This is true until the cleanup runs.
		let senValObj : WakeLockSentinel | null = null; // What: Sentinel Value Object. Why: The lock is released through its sentinel. How: This holds the current one, null until granted.



		const reqLocFun = () : void => { // What: Request Lock Function. Why: The lock is asked for as the effect starts and each time the page shows again. How: This asks while the page is visible and no lock is held, keeping the one granted.


			if ( document.visibilityState !== 'visible' || ( senValObj !== null && !senValObj.released ) ) return; // What: Not Needed Guard. Why: A hidden page can't hold the lock, and a held lock needs no second. How: This returns.



			navigator.wakeLock.request( 'screen' ).then( ( newSenObj ) => { if ( actValBoo ) senValObj = newSenObj; else void newSenObj.release(); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Lock Request Call. Why: The screen stays on while the lock is held. How: This asks for it, keeping it while the effect runs, releasing one granted too late, and logging a refusal.


		};


		reqLocFun(); // What: First Request Call. Why: The screen should stay on from the start. How: This asks at once.

		document.addEventListener( 'visibilitychange', reqLocFun ); // What: Visibility Listener Call. Why: The browser drops the lock while the page is hidden. How: This asks again each time it shows.



		return () => { // What: Lock Cleanup. Why: The lock shouldn't outlive the screen's wish for it. How: This stops asking and releases the lock held.


			actValBoo = false; // What: Inactive Set. Why: A lock granted later mustn't be kept. How: This marks the effect done.

			document.removeEventListener( 'visibilitychange', reqLocFun ); // What: Visibility Listener Removal. Why: No more requests are wanted. How: This removes the listener.

			senValObj?.release().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Lock Release Call. Why: The screen can sleep again. How: This releases the held lock, logging a failure.


		};


	}, [ wanValBoo ] ); // What: Effect Dependency Array. Why: The lock follows whether it's wanted. How: wanValBoo changes as sharing starts and stops.


};

// #endregion useWakLocFun

// #endregion Hooks



// #region Exports

export { useWakLocFun }; // What: Named Export. Why: The Map keeps the screen on while sharing. How: This exports the hook.

// #endregion Exports


