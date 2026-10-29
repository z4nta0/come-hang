


/**
 * geolocation.ts = Geolocation
 *
 * @summary
 * The device's position, through the browser's Geolocation API
 * (ARCHITECTURE.md Section 10). A one-time fix resolves with the position or
 * rejects with the browser's error, such as a refused permission, and a
 * watch reports each new fix until it's stopped. Both ask for the most
 * precise fix the device offers, accepting one up to 15 seconds old.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const POS_OPT_OBJ : PositionOptions = { enableHighAccuracy : true, maximumAge : 15000, timeout : 30000 }; // What: Position Options Object. Why: Members find each other by position, so precision matters more than speed, within reason. How: This asks for a precise fix, accepts one up to 15 seconds old, and gives up after 30.

// #endregion Constants



// #region Helpers

// #region posGetFun

/**
 * posGetFun = Position Get Function
 *
 * @summary
 * Resolves with one fix of the device's position, or rejects with the
 * browser's error when there's no permission or no fix in 30 seconds.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the position.
 *
 * @example
 * ```ts
 * posGetFun() // => GeolocationPosition
 * ```
 *
*/

const posGetFun = () : Promise< GeolocationPosition > => new Promise( ( resValFun, rejValFun ) => navigator.geolocation.getCurrentPosition( resValFun, rejValFun, POS_OPT_OBJ ) ); // What: Position Get Function. Why: Opening the app and arriving each send a fresh fix (Section 10). How: This wraps the browser's one-time request in a promise.

// #endregion posGetFun



// #region posWatFun

/**
 * posWatFun = Position Watch Function
 *
 * @summary
 * Watches the device's position, calling back with each new fix, and
 * returns the function that stops watching. Errors, such as a fix timing
 * out, are skipped, since the watch keeps trying.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onPosFun - On Position Function: Called with each fix.
 *
 * @returns The function that stops watching.
 *
 * @example
 * ```ts
 * posWatFun((posValObj) => send(posValObj)) // => () => void
 * ```
 *
*/

const posWatFun = ( onPosFun : ( posValObj : GeolocationPosition ) => void ) : ( () => void ) => { // What: Position Watch Function. Why: A member with the app open shares as they move (Section 10). How: This watches the position and returns the stop.


	const watIdeNum = navigator.geolocation.watchPosition( onPosFun, () => undefined, POS_OPT_OBJ ); // What: Watch Identifier Number. Why: The watch is stopped by its ID. How: This starts it, skipping errors.



	return () => navigator.geolocation.clearWatch( watIdeNum ); // What: Stop Return. Why: Sharing stops when the member stops it. How: This returns the function that clears the watch.


};

// #endregion posWatFun

// #endregion Helpers



// #region Exports

export { posGetFun, posWatFun }; // What: Named Exports. Why: Location sharing reads the device's position through these. How: This exports both.

// #endregion Exports


