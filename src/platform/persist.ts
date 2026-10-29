


/**
 * persist.ts = Persist
 *
 * @summary
 * Asks the browser to keep the app's storage (ARCHITECTURE.md Section 14),
 * since the identity's private key and the chat history exist only on this
 * device, and a browser may otherwise clear an origin's storage when space
 * runs low. A browser that already keeps it isn't asked again, and one
 * without the Storage API is skipped. Whether the browser agrees is up to
 * it, and Firefox may ask the person.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region stoPerFun

/**
 * stoPerFun = Storage Persist Function
 *
 * @summary
 * Asks the browser to keep this origin's storage unless it already does,
 * and resolves with whether it now does. Resolves false where the Storage
 * API's persistence calls are missing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true once the storage is kept.
 *
 * @example
 * ```ts
 * stoPerFun() // => true
 * ```
 *
*/

const stoPerFun = async () : Promise< boolean > => { // What: Storage Persist Function. Why: The device holds what can't be recovered from the server. How: This asks the browser to keep it, once.


	if ( !navigator.storage?.persist || !navigator.storage.persisted ) return false; // What: No API Guard. Why: An older browser has nothing to ask. How: This resolves false.



	if ( await navigator.storage.persisted() ) return true; // What: Already Kept Guard. Why: Asking again could prompt again for nothing. How: This resolves true without asking.



	return navigator.storage.persist(); // What: Persist Return. Why: The browser decides. How: This asks and resolves with its answer.


};

// #endregion stoPerFun

// #endregion Helpers



// #region Exports

export { stoPerFun }; // What: Named Export. Why: The bootstrap asks once the identity exists. How: This exports the helper.

// #endregion Exports


