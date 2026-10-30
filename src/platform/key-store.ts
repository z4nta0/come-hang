


// #region Imports

import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The keys live in the app's IndexedDB database. How: This opens it.
import { KEY_STO_STR } from './local-db.ts'; // What: Key Store String. Why: Keys have their own object store. How: This names it.

// #endregion Imports



/**
 * key-store.ts = Key Store
 *
 * @summary
 * Keeps the app's keys on this device in raw IndexedDB, with no wrapper
 * library (ARCHITECTURE.md Section 14). IndexedDB can hold a CryptoKey
 * itself, so a private key made non-extractable is stored without its bytes
 * ever being readable by script, which localStorage couldn't do. Each record
 * sits in one object store under a name of the caller's choosing, and each
 * read, write, or delete closes its connection once its transaction
 * finishes. The database itself is opened by local-db.ts, which this store
 * shares with the chat history.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region keyDelFun

/**
 * keyDelFun = Key Delete Function
 *
 * @summary
 * Deletes one record from the key store by name, doing nothing when there's
 * none, and resolves once the delete is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyNamStr - Key Name String: The record's name.
 *
 * @returns A promise that settles once the record is gone, with no value.
 *
 * @example
 * ```ts
 * keyDelFun('group:Xk3...') // => Promise<void>
 * ```
 *
*/

const keyDelFun = async ( keyNamStr : string ) : Promise< void > => { // What: Key Delete Function. Why: A key the device no longer needs, such as a left group's, shouldn't stay behind. How: This deletes one record in a read-write transaction.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The delete needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Delete Promise. Why: A delete counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( KEY_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The delete and its completion share one transaction. How: This opens a read-write one on the key store.


		traValObj.objectStore( KEY_STO_STR ).delete( keyNamStr ); // What: Delete Call. Why: The record goes by name. How: This deletes it, which is no error when it's absent.

		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the delete's transaction finishes.

		traValObj.oncomplete = () => resValFun();                  // What: Complete Handler. Why: The record is gone only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed delete has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion keyDelFun



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

export { keyDelFun, keyGetFun, keyPutFun }; // What: Named Exports. Why: The identity and the groups keep their keys here. How: This exports the helpers.

// #endregion Exports


