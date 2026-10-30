


// #region Imports

import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The chat history lives in the app's IndexedDB database. How: This opens it.
import { MES_STO_STR } from './local-db.ts'; // What: Message Store String. Why: Messages have their own object store. How: This names it.

// #endregion Imports



/**
 * chat-store.ts = Chat Store
 *
 * @summary
 * Keeps each group's chat history on this device (ARCHITECTURE.md Section
 * 5), since the server only holds a message until every member has it.
 * Each message is one record keyed by its group's ID and its own, so a
 * group's history is read as one key range, and a message stored twice
 * replaces itself. Each read or write closes its connection once its
 * transaction finishes.
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

type MesRecTyp = { groIdeStr : string, mesIdeStr : string, senUidStr : string, sntTimNum : number, texValStr : string }; // What: Message Record Type. Why: A stored message keeps its group, ID, sender, time, and text. How: This types one record.

// #endregion Types



// #region Helpers

// #region mesLisFun

/**
 * mesLisFun = Message List Function
 *
 * @summary
 * Resolves with a group's stored messages, oldest first. The store returns
 * a key range in key order and the sort is stable, so messages sent at the
 * same moment keep their ID order.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the messages.
 *
 * @example
 * ```ts
 * mesLisFun('Xk3...') // => [ { texValStr : 'Hi', ... } ]
 * ```
 *
*/

const mesLisFun = async ( groIdeStr : string ) : Promise< MesRecTyp[] > => { // What: Message List Function. Why: The chat shows the device's history. How: This reads the group's key range and sorts it.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.


	const recValArr = await new Promise< MesRecTyp[] >( ( resValFun, rejValFun ) => { // What: Record Value Array. Why: IndexedDB reports through events. How: This resolves with the group's records or rejects with the error.


		const getReqObj = datValObj.transaction( MES_STO_STR, 'readonly' ).objectStore( MES_STO_STR ).getAll( IDBKeyRange.bound( `${ groIdeStr }/`, `${ groIdeStr }/￿` ) ); // What: Get Request Object. Why: A group's records share its ID as their key's start. How: This reads that key range.

		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.


		getReqObj.onsuccess = () => resValFun( getReqObj.result as MesRecTyp[] ); // What: Success Handler. Why: The caller gets the records. How: This resolves with them. // What: Type Assertion Note. Why: Only mesPutFun writes this store. How: The as reads them as message records.
		getReqObj.onerror   = () => rejValFun( getReqObj.error );                 // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.


	} );



	return recValArr.sort( ( recOneObj, recTwoObj ) => recOneObj.sntTimNum - recTwoObj.sntTimNum ); // What: Messages Return. Why: A chat reads oldest first. How: This sorts by time, keeping the store's key order, and so message ID order, for a tie.


};

// #endregion mesLisFun



// #region mesPutFun

/**
 * mesPutFun = Message Put Function
 *
 * @summary
 * Stores one message in the device's chat history, replacing any record of
 * the same message, and resolves once the write is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param mesRecObj - Message Record Object: The message to keep.
 *
 * @returns A promise that settles once it's stored, with no value.
 *
 * @example
 * ```ts
 * mesPutFun({ groIdeStr, mesIdeStr, ... }) // => Promise<void>
 * ```
 *
*/

const mesPutFun = async ( mesRecObj : MesRecTyp ) : Promise< void > => { // What: Message Put Function. Why: A message stays on the device after the server deletes it. How: This writes it under its group and ID.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( MES_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The write and its completion share one transaction. How: This opens a read-write one on the message store.


		traValObj.objectStore( MES_STO_STR ).put( mesRecObj, `${ mesRecObj.groIdeStr }/${ mesRecObj.mesIdeStr }` ); // What: Put Call. Why: The same message stored twice replaces itself. How: This keys it by group and message ID.

		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the write's transaction finishes.

		traValObj.oncomplete = () => resValFun();                  // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion mesPutFun

// #endregion Helpers



// #region Exports

export { mesLisFun, mesPutFun, type MesRecTyp }; // What: Named Exports. Why: The chat keeps and shows its history through these. How: This exports the functions and the record's type.

// #endregion Exports


