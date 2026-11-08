


// #region Imports

import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The waiting messages live in the app's IndexedDB database. How: This opens it.
import { OUT_STO_STR } from './local-db.ts'; // What: Outbox Store String. Why: The waiting messages have their own object store. How: This names it.

// #endregion Imports



/**
 * outbox-store.ts = Outbox Store
 *
 * @summary
 * Keeps on this device the chat messages written while it was offline
 * (ARCHITECTURE.md Section 14), each under its group and a local ID, so one
 * survives the app closing and sends once the device is back online. A
 * message leaves the store once it's sent. Each read or write closes its
 * connection once its transaction finishes.
 *
 * Sections:
 *  - Types
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type OutRecTyp = { creTimNum : number, groIdeStr : string, locIdeStr : string, texValStr : string }; // What: Outbox Record Type. Why: A waiting message is shown and sent in the order it was written. How: This types its time, group, local ID, and text.

// #endregion Types



// #region Helpers

// #region outLisFun

/**
 * outLisFun = Outbox List Function
 *
 * @summary
 * Resolves with a group's waiting messages, oldest first, leaving out any
 * record this version didn't write.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the waiting messages.
 *
 * @example
 * ```ts
 * outLisFun('Xk3...') // => [{ texValStr : 'On my way', ... }]
 * ```
 *
*/

const outLisFun = async ( groIdeStr : string ) : Promise< OutRecTyp[] > => { // What: Outbox List Function. Why: The chat shows and sends what's waiting. How: This reads the group's records in key order, then sorts them by time.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.


	const recValArr = await new Promise< unknown[] >( ( resValFun, rejValFun ) => { // What: Record Value Array. Why: IndexedDB reports through events. How: This resolves with the group's records or rejects with the error.


		const getReqObj = datValObj.transaction( OUT_STO_STR, 'readonly' ).objectStore( OUT_STO_STR ).getAll( IDBKeyRange.bound( `${ groIdeStr }/`, `${ groIdeStr }/￿` ) ); // What: Get Request Object. Why: Each record's key starts with its group. How: This reads every key in the group's range.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.

		getReqObj.onsuccess = () => resValFun( getReqObj.result ); // What: Success Handler. Why: The caller gets the records. How: This resolves with them.
		getReqObj.onerror   = () => rejValFun( getReqObj.error );  // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.


	} );



	return recValArr.filter( ( recValAny ) : recValAny is OutRecTyp => typeof recValAny === 'object' && recValAny !== null && typeof Reflect.get( recValAny, 'texValStr' ) === 'string' && typeof Reflect.get( recValAny, 'locIdeStr' ) === 'string' && typeof Reflect.get( recValAny, 'creTimNum' ) === 'number' ).sort( ( recOneObj, recTwoObj ) => recOneObj.creTimNum - recTwoObj.creTimNum ); // What: Records Return. Why: Only well-formed records show and send, in the order they were written. How: This keeps those with a text, local ID, and time, each check guarding the next, and sorts them by time.


};

// #endregion outLisFun



// #region outSetFun

/**
 * outSetFun = Outbox Set Function
 *
 * @summary
 * Keeps a waiting message under its group and local ID, or forgets it when
 * given null, and resolves once the write is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The group and local ID, joined by a
 *                    slash.
 * @param recValObj - Record Value Object: The message to keep, or null to
 *                    forget it.
 *
 * @returns A promise that settles once the write is stored, with no value.
 *
 * @example
 * ```ts
 * outSetFun('Xk3.../l1', recValObj) // => Promise<void>
 * ```
 *
*/

const outSetFun = async ( keyValStr : string, recValObj : OutRecTyp | null ) : Promise< void > => { // What: Outbox Set Function. Why: A message waits on the device until it's sent, then goes. How: This writes or deletes its record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( OUT_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The record is written in one transaction. How: This opens a read-write one on the outbox store.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.


		if ( recValObj === null ) traValObj.objectStore( OUT_STO_STR ).delete( keyValStr ); // What: Delete Call. Why: A sent message shouldn't wait any more. How: This deletes its record.

		else traValObj.objectStore( OUT_STO_STR ).put( recValObj, keyValStr ); // What: Put Call. Why: The message waits on the device. How: This writes it under its key.



		traValObj.oncomplete = () => resValFun();                  // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion outSetFun

// #endregion Helpers



// #region Exports

export { outLisFun, type OutRecTyp, outSetFun }; // What: Named Exports. Why: The chat keeps, shows, and sends the waiting messages through these. How: This exports the list, the record's type, and the set.

// #endregion Exports


