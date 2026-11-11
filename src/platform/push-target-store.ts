


/**
 * push-target-store.ts = Push Target Store
 *
 * @summary
 * Hands a tapped push's address from the service worker to the app it
 * launches (ARCHITECTURE.md Section 11.1). An installed app on an iPad opened
 * at its root rather than the address the worker opened it at, so the worker
 * also keeps the address, with the time, in a small IndexedDB database of its
 * own, which both the worker and the page can open, and the app takes it as
 * it starts. IndexedDB holds it where WebKit's cache dropped an entry across
 * a reload (measured 2026-11-11). One address is kept, the latest replacing
 * any before it, and taking it deletes it.
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

const TAR_DAT_STR = 'come-hang-push-target'; // What: Target Database String. Why: The address lives apart from the app's own database, which the worker doesn't open. How: This names its database.
const TAR_KEY_STR = 'current';               // What: Target Key String. Why: One address is kept at a time. How: This is the key it's stored under.
const TAR_STO_STR = 'target';                // What: Target Store String. Why: The database holds one store. How: This names it.

// #endregion Constants



// #region Helpers

// #region tarOpeFun

/**
 * tarOpeFun = Target Open Function
 *
 * @summary
 * Opens the target database, creating its one store the first time, and
 * resolves with the connection, which the caller closes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the open database.
 *
 * @example
 * ```ts
 * tarOpeFun() // => IDBDatabase
 * ```
 *
*/

const tarOpeFun = () : Promise< IDBDatabase > => new Promise( ( resValFun, rejValFun ) => { // What: Target Open Function. Why: The worker and the page both read and write the address. How: This opens the database, making its store when it's new.


	const opeReqObj = indexedDB.open( TAR_DAT_STR, 1 ); // What: Open Request Object. Why: The database is opened at its first version. How: This asks for it.


	opeReqObj.onupgradeneeded = () => opeReqObj.result.createObjectStore( TAR_STO_STR ); // What: Upgrade Handler. Why: A new database has no store yet. How: This creates it.
	opeReqObj.onsuccess = () => resValFun( opeReqObj.result );                           // What: Success Handler. Why: The caller uses the connection. How: This resolves with it.
	opeReqObj.onerror = () => rejValFun( opeReqObj.error );                              // What: Error Handler. Why: A database that won't open has to fail the call. How: This rejects with the error.


} );

// #endregion tarOpeFun



// #region tarPutFun

/**
 * tarPutFun = Target Put Function
 *
 * @summary
 * Keeps a tapped push's address with the time it was kept, replacing any
 * address kept before, and resolves once it's stored.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The address the push leads to.
 *
 * @returns A promise that settles once the address is stored, with no value.
 *
 * @example
 * ```ts
 * tarPutFun('/open/gro1/chat') // => Promise<void>
 * ```
 *
*/

const tarPutFun = async ( patValStr : string ) : Promise< void > => { // What: Target Put Function. Why: The worker leaves the address for the app it launches. How: This stores it with the time.


	const datValObj = await tarOpeFun(); // What: Database Value Object. Why: The address is stored there. How: This opens it.



	await new Promise< void >( ( resValFun, rejValFun ) => { // What: Store Wait. Why: The write is done only once its transaction completes. How: This waits for that.


		const traValObj = datValObj.transaction( TAR_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The address is written in one transaction. How: This opens it.


		traValObj.objectStore( TAR_STO_STR ).put( { patStr : patValStr, timNum : Date.now() }, TAR_KEY_STR ); // What: Put Call. Why: The app checks the address and how fresh it is. How: This writes both under the one key.


		traValObj.oncomplete = () => resValFun();               // What: Complete Handler. Why: The address is stored. How: This resolves.
		traValObj.onerror = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed write has to fail the call. How: This rejects with the error.


	} ).finally( () => datValObj.close() ); // What: Close Call. Why: An open connection would block a later upgrade. How: This closes it either way.


};

// #endregion tarPutFun



// #region tarTakFun

/**
 * tarTakFun = Target Take Function
 *
 * @summary
 * Takes the kept address, deleting it, and resolves with what was stored,
 * the address and the time it was kept, read as untrusted, or undefined when
 * nothing was kept.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the stored record, or undefined.
 *
 * @example
 * ```ts
 * tarTakFun() // => { patStr : '/open/gro1/chat', timNum : 1762800000000 }
 * ```
 *
*/

const tarTakFun = async () : Promise< unknown > => { // What: Target Take Function. Why: The app follows an address once. How: This reads and deletes it in one transaction.


	const datValObj = await tarOpeFun(); // What: Database Value Object. Why: The address is read there. How: This opens it.



	return new Promise< unknown >( ( resValFun, rejValFun ) => { // What: Take Wait. Why: The read counts only once its transaction completes with the delete. How: This waits for that.


		const traValObj = datValObj.transaction( TAR_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The read and the delete happen together. How: This opens one transaction for both.
		const stoValObj = traValObj.objectStore( TAR_STO_STR );              // What: Store Value Object. Why: Both steps act on the one store. How: This reads it.
		const getReqObj = stoValObj.get( TAR_KEY_STR );                       // What: Get Request Object. Why: The address is read before it goes. How: This asks for it.


		stoValObj.delete( TAR_KEY_STR ); // What: Delete Call. Why: An address is followed once. How: This deletes it in the same transaction.


		traValObj.oncomplete = () => resValFun( getReqObj.result ); // What: Complete Handler. Why: The caller checks what was stored. How: This resolves with it, undefined when nothing was.
		traValObj.onerror = () => rejValFun( traValObj.error );     // What: Error Handler. Why: A failed take has to fail the call. How: This rejects with the error.


	} ).finally( () => datValObj.close() ); // What: Close Call. Why: An open connection would block a later upgrade. How: This closes it either way.


};

// #endregion tarTakFun

// #endregion Helpers



// #region Exports

export { tarPutFun, tarTakFun }; // What: Named Exports. Why: The worker keeps a tapped push's address, and the app takes it as it starts. How: This exports both.

// #endregion Exports


