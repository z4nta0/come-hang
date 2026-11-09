


// #region Imports

import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The seen items live in the app's IndexedDB database. How: This opens it.
import { SEE_STO_STR } from './local-db.ts'; // What: Seen Store String. Why: The seen items have their own object store. How: This names it.

// #endregion Imports



/**
 * seen-store.ts = Seen Store
 *
 * @summary
 * Keeps on this device the keys of the waiting items the notices sheet has
 * already shown, such as a join request, so an item someone hasn't acted on
 * opens the sheet once rather than on every launch. The keys are one record,
 * replaced whole on each write, so a caller keeps only the items still
 * waiting. Each read or write closes its connection once its transaction
 * finishes.
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

const SEE_KEY_STR = 'items'; // What: Seen Key String. Why: Every seen item is kept in one record. How: This names it.

// #endregion Constants



// #region Helpers

// #region seeLisFun

/**
 * seeLisFun = Seen List Function
 *
 * @summary
 * Resolves with the keys of the waiting items this device has shown, or an
 * empty list when it has shown none, leaving out anything in the record that
 * isn't a string.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the keys.
 *
 * @example
 * ```ts
 * seeLisFun() // => ['Xk3.../join:u1@1761700000000']
 * ```
 *
*/

const seeLisFun = async () : Promise< string[] > => { // What: Seen List Function. Why: The sheet opens only for items it hasn't shown. How: This reads the record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Read Promise. Why: IndexedDB reports through events. How: This resolves with the keys or rejects with the error.


		const getReqObj = datValObj.transaction( SEE_STO_STR, 'readonly' ).objectStore( SEE_STO_STR ).get( SEE_KEY_STR ); // What: Get Request Object. Why: The keys are one record. How: This reads it.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.

		getReqObj.onsuccess = () => resValFun( Array.isArray( getReqObj.result ) ? getReqObj.result.filter( ( keyValAny : unknown ) => typeof keyValAny === 'string' ) : [] ); // What: Success Handler. Why: The caller gets only well-formed keys. How: This resolves with the record's strings, or nothing.
		getReqObj.onerror   = () => rejValFun( getReqObj.error );                                                                                                            // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion seeLisFun



// #region seeSetFun

/**
 * seeSetFun = Seen Set Function
 *
 * @summary
 * Replaces the record of shown items with the given keys and resolves once
 * the write is committed, so a key left out, such as an item no longer
 * waiting, is forgotten.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValArr - Key Value Array: The keys of the shown items to keep.
 *
 * @returns A promise that settles once the keys are stored, with no value.
 *
 * @example
 * ```ts
 * seeSetFun(['Xk3.../join:u1@1761700000000']) // => Promise<void>
 * ```
 *
*/

const seeSetFun = async ( keyValArr : string[] ) : Promise< void > => { // What: Seen Set Function. Why: An item the sheet has shown shouldn't open it again. How: This writes the keys as the one record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( SEE_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The record is written in one transaction. How: This opens a read-write one on the seen store.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.

		traValObj.objectStore( SEE_STO_STR ).put( keyValArr, SEE_KEY_STR ); // What: Put Call. Why: The new keys replace the old record. How: This writes them under the record's key.

		traValObj.oncomplete = () => resValFun();                    // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error );   // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion seeSetFun

// #endregion Helpers



// #region Exports

export { seeLisFun, seeSetFun }; // What: Named Exports. Why: The notices sheet reads and keeps the items it has shown. How: This exports the list and the set.

// #endregion Exports


