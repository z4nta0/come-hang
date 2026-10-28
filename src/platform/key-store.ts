


/**
 * key-store.ts = Key Store
 *
 * @summary
 * Keeps the app's keys on this device in raw IndexedDB, with no wrapper
 * library (ARCHITECTURE.md Section 14). IndexedDB can hold a CryptoKey
 * itself, so a private key made non-extractable is stored without its bytes
 * ever being readable by script, which localStorage couldn't do. Each record
 * sits in one object store under a name of the caller's choosing, and each
 * read or write closes its connection once its transaction finishes.
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

const DAT_BAS_STR = 'come-hang'; // What: Database Base String. Why: The app's IndexedDB database needs a name of its own. How: This names it after the app.
const KEY_STO_STR = 'keys';      // What: Key Store String. Why: Keys live apart from anything else the app stores later. How: This names their object store.

// #endregion Constants



// #region Helpers

// #region datOpeFun

/**
 * datOpeFun = Database Open Function
 *
 * @summary
 * Opens the app's IndexedDB database, creating its key store the first time,
 * and resolves once it's ready.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the open database.
 *
 * @example
 * ```ts
 * datOpeFun() // => IDBDatabase
 * ```
 *
*/

const datOpeFun = () : Promise< IDBDatabase > => new Promise( ( resValFun, rejValFun ) => { // What: Database Open Function. Why: Every read and write needs the open database. How: This wraps IndexedDB's open request in a promise.


	const opeReqObj = indexedDB.open( DAT_BAS_STR, 1 ); // What: Open Request Object. Why: The database opens asynchronously. How: This asks for version 1.


	opeReqObj.onupgradeneeded = () => opeReqObj.result.createObjectStore( KEY_STO_STR ); // What: Upgrade Handler. Why: A new database has no stores yet. How: This creates the key store when the database is first made.
	opeReqObj.onsuccess       = () => resValFun( opeReqObj.result );                     // What: Success Handler. Why: The caller works with the open database. How: This resolves with it.
	opeReqObj.onerror         = () => rejValFun( opeReqObj.error );                      // What: Error Handler. Why: A failed open has to reach the caller. How: This rejects with the error.


} );

// #endregion datOpeFun



// #region keyGetFun

/**
 * keyGetFun = Key Get Function
 *
 * @summary
 * Reads one record from the key store by name, resolving with undefined when
 * there's none.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyNamStr - Key Name String: The record's name.
 *
 * @returns A promise that resolves with the stored record, or undefined.
 *
 * @example
 * ```ts
 * keyGetFun('identity') // => { keyParObj, uidValStr }
 * ```
 *
*/

const keyGetFun = async ( keyNamStr : string ) : Promise< unknown > => { // What: Key Get Function. Why: The app reads its keys back on each launch. How: This reads one record in a read-only transaction.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Read Promise. Why: IndexedDB reports through events. How: This resolves with the record or rejects with the error.


		const getReqObj = datValObj.transaction( KEY_STO_STR, 'readonly' ).objectStore( KEY_STO_STR ).get( keyNamStr ); // What: Get Request Object. Why: One record is read by name. How: This asks the key store for it.

		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.


		getReqObj.onsuccess = () => resValFun( getReqObj.result ); // What: Success Handler. Why: The caller gets the record. How: This resolves with it, undefined when absent.
		getReqObj.onerror   = () => rejValFun( getReqObj.error );  // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion keyGetFun



// #region keyPutFun

/**
 * keyPutFun = Key Put Function
 *
 * @summary
 * Writes one record to the key store under a name, replacing any record
 * already there, and resolves once the write is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyNamStr - Key Name String: The record's name.
 * @param recValAny - Record Value Any: The record, which may hold CryptoKey
 *                    objects.
 *
 * @returns A promise that settles once the record is stored, with no value.
 *
 * @example
 * ```ts
 * keyPutFun('identity', { keyParObj, uidValStr }) // => Promise<void>
 * ```
 *
*/

const keyPutFun = async ( keyNamStr : string, recValAny : unknown ) : Promise< void > => { // What: Key Put Function. Why: A new key has to survive the app closing. How: This writes one record in a read-write transaction.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( KEY_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The write and its completion share one transaction. How: This opens a read-write one on the key store.


		traValObj.objectStore( KEY_STO_STR ).put( recValAny, keyNamStr ); // What: Put Call. Why: The record replaces any earlier one by that name. How: This stores it under the name.

		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the write's transaction finishes.

		traValObj.oncomplete = () => resValFun();                  // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion keyPutFun

// #endregion Helpers



// #region Exports

export { keyGetFun, keyPutFun }; // What: Named Exports. Why: The identity reads and writes its keys here. How: This exports both helpers.

// #endregion Exports


