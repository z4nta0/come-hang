


/**
 * online.ts = Online State
 *
 * @summary
 * Whether this device is online, as the browser reports it, and a way to
 * hear when that changes. The browser counts a device as online once it's on
 * a network, so a network with no way to the internet still reads as online,
 * where the app's changes fail as they would anyway.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

const onlNowFun = () : boolean => navigator.onLine; // What: Online Now Function. Why: Changes that need the server wait while the device is offline. How: This reads the browser's answer.



// #region onlSubFun

/**
 * onlSubFun = Online Subscribe Function
 *
 * @summary
 * Calls the listener each time the device goes online or offline, until the
 * returned function is called, in the shape useSyncExternalStore expects.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onChaFun - On Change Function: Called on each change.
 *
 * @returns The function that stops listening.
 *
 * @example
 * ```ts
 * onlSubFun(() => ...) // => () => void
 * ```
 *
*/

const onlSubFun = ( onChaFun : () => void ) : () => void => { // What: Online Subscribe Function. Why: The banner and the chat's outbox follow the connection. How: This listens for both of the browser's events.


	window.addEventListener( 'online', onChaFun ); // What: Online Listen Call. Why: The device came back. How: This calls the listener then.

	window.addEventListener( 'offline', onChaFun ); // What: Offline Listen Call. Why: The device lost its connection. How: This calls the listener then.



	return () => { // What: Stop Return. Why: A listener shouldn't outlive what it updates. How: This returns the function that removes both.


		window.removeEventListener( 'online', onChaFun ); // What: Online Unlisten Call. Why: The listener goes. How: This removes it.

		window.removeEventListener( 'offline', onChaFun ); // What: Offline Unlisten Call. Why: The listener goes. How: This removes it.


	};


};

// #endregion onlSubFun

// #endregion Helpers



// #region Exports

export { onlNowFun, onlSubFun }; // What: Named Exports. Why: The banner, the outbox, and the change runners read and follow the connection. How: This exports the reading and the subscription.

// #endregion Exports


