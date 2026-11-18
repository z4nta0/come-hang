


// #region Imports

import { CHP_STO_STR } from './local-db.ts'; // What: Chat-Photo Store String. Why: The chat's photos have their own object store. How: This names it.
import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The chat's photos live in the app's IndexedDB database. How: This opens it.

// #endregion Imports



/**
 * chat-photo-store.ts = Chat Photo Store
 *
 * @summary
 * Keeps on this device the photos sent in its groups' chats (ARCHITECTURE.md
 * Section 22), still encrypted, one record for each group and photo, holding
 * the photo's ciphertext, its IV, and when its message was sent, so a photo
 * downloads once, opens offline, and can be cleared by age. Each read or
 * write closes its connection once its transaction finishes.
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

type CpsRecTyp = { cipBytArr : Uint8Array< ArrayBuffer >, iniVecArr : Uint8Array< ArrayBuffer >, sntTimNum : number }; // What: Chat-Photo-Store Record Type. Why: A kept photo decrypts with its IV and is cleared by its message's age. How: This types the ciphertext, the IV, and the sent time.

// #endregion Types



// #region Helpers

const recValFun = ( recValAny : unknown ) : recValAny is CpsRecTyp => typeof recValAny === 'object' && recValAny !== null && Reflect.get( recValAny, 'cipBytArr' ) instanceof Uint8Array && Reflect.get( recValAny, 'iniVecArr' ) instanceof Uint8Array && typeof Reflect.get( recValAny, 'sntTimNum' ) === 'number'; // What: Record Valid Function. Why: Anything could be stored under a key, and only a record this version wrote is used. How: This checks each field, the object check guarding the rest.



// #region cpsGetFun

/**
 * cpsGetFun = Chat-Photo-Store Get Function
 *
 * @summary
 * Resolves with the photo kept for a group's chat, or null when none is kept
 * or the record isn't one this version wrote.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The group's ID and the photo's,
 *                    joined by a slash.
 *
 * @returns A promise that resolves with the kept photo, or null.
 *
 * @example
 * ```ts
 * cpsGetFun('Xk3.../Pq8...') // => { cipBytArr, iniVecArr, sntTimNum }
 * ```
 *
*/

const cpsGetFun = async ( keyValStr : string ) : Promise< CpsRecTyp | null > => { // What: Chat-Photo-Store Get Function. Why: A photo kept on the device needn't download again. How: This reads its record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Read Promise. Why: IndexedDB reports through events. How: This resolves with the record or rejects with the error.


		const getReqObj = datValObj.transaction( CHP_STO_STR, 'readonly' ).objectStore( CHP_STO_STR ).get( keyValStr ); // What: Get Request Object. Why: Each photo is one record. How: This reads it.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.


		getReqObj.onerror   = () => rejValFun( getReqObj.error );                                          // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.
		getReqObj.onsuccess = () => resValFun( recValFun( getReqObj.result ) ? getReqObj.result : null ); // What: Success Handler. Why: The caller gets only a well-formed record. How: This resolves with it, or null.


	} );


};

// #endregion cpsGetFun



// #region cpsPruFun

/**
 * cpsPruFun = Chat-Photo-Store Prune Function
 *
 * @summary
 * Deletes every kept photo whose message was sent before the time given, in
 * one transaction, and resolves with how many it deleted. A record this
 * version didn't write is deleted too, since nothing can show it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param cutTimNum - Cutoff Time Number: The time, in milliseconds, before
 *                    which photos go.
 *
 * @returns A promise that resolves with the count of photos deleted.
 *
 * @example
 * ```ts
 * cpsPruFun(Date.now() - 90 * 86400000) // => 12
 * ```
 *
*/

const cpsPruFun = async ( cutTimNum : number ) : Promise< number > => { // What: Chat-Photo-Store Prune Function. Why: A device keeps chat photos only as long as its member chose (Section 22). How: This deletes the older ones.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The deletion needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Prune Promise. Why: The deletions count only once their transaction commits. How: This resolves with the count on completion or rejects with the error.


		const traValObj = datValObj.transaction( CHP_STO_STR, 'readwrite' );   // What: Transaction Value Object. Why: Every deletion lands together. How: This opens a read-write one on the store.
		const curReqObj = traValObj.objectStore( CHP_STO_STR ).openCursor(); // What: Cursor Request Object. Why: Each record's time is checked in turn. How: This walks the store.

		let delCouNum = 0; // What: Deleted Count Number. Why: The caller says how many photos went. How: This counts them.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.


		curReqObj.onsuccess = () => { // What: Cursor Handler. Why: The cursor reports one record at a time. How: This deletes an old or unreadable record and moves on.


			const curValObj = curReqObj.result; // What: Cursor Value Object. Why: The record and its key are read from it. How: This reads it, null once the walk ends.


			if ( curValObj === null ) return; // What: Walk End Guard. Why: Every record has been checked. How: This stops.



			if ( !recValFun( curValObj.value ) || curValObj.value.sntTimNum < cutTimNum ) { // What: Old Photo Check. Why: A photo older than the choice, or one nothing can show, goes. How: This deletes it and counts it.


				curValObj.delete(); // What: Record Delete Call. Why: The photo is past its keeping. How: This deletes the record under the cursor.

				delCouNum += 1; // What: Count Assignment. Why: The caller says how many went. How: This counts it.


			}



			curValObj.continue(); // What: Continue Call. Why: The next record is checked. How: This moves the cursor on.


		};

		traValObj.oncomplete = () => resValFun( delCouNum );         // What: Complete Handler. Why: The deletions are on disk only once the transaction commits. How: This resolves with the count then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed deletion has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion cpsPruFun



// #region cpsSetFun

/**
 * cpsSetFun = Chat-Photo-Store Set Function
 *
 * @summary
 * Keeps a chat photo under its key, or forgets it when given null, and
 * resolves once the write is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The group's ID and the photo's,
 *                    joined by a slash.
 * @param recValObj - Record Value Object: The photo's ciphertext, IV, and
 *                    sent time, or null to forget it.
 *
 * @returns A promise that settles once the write is stored, with no value.
 *
 * @example
 * ```ts
 * cpsSetFun('Xk3.../Pq8...', cpsRecObj) // => Promise<void>
 * ```
 *
*/

const cpsSetFun = async ( keyValStr : string, recValObj : CpsRecTyp | null ) : Promise< void > => { // What: Chat-Photo-Store Set Function. Why: A downloaded or sent photo is kept, and a cleared one forgotten. How: This writes or deletes the record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( CHP_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The record is written in one transaction. How: This opens a read-write one on the store.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.


		if ( recValObj === null ) traValObj.objectStore( CHP_STO_STR ).delete( keyValStr ); // What: Delete Call. Why: A cleared photo shouldn't linger on the device. How: This deletes the record.

		else traValObj.objectStore( CHP_STO_STR ).put( recValObj, keyValStr ); // What: Put Call. Why: The photo opens from the device next time. How: This writes it under its key.



		traValObj.oncomplete = () => resValFun();                  // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion cpsSetFun



// #region cpsSizFun

/**
 * cpsSizFun = Chat-Photo-Store Size Function
 *
 * @summary
 * Resolves with how many chat photos this device keeps and their total size
 * in bytes, counting the well-formed records alone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the count and the bytes.
 *
 * @example
 * ```ts
 * cpsSizFun() // => { bytNum : 4200000, couNum : 31 }
 * ```
 *
*/

const cpsSizFun = async () : Promise< { bytNum : number, couNum : number } > => { // What: Chat-Photo-Store Size Function. Why: Settings shows how much room the chat's photos take. How: This totals the kept records.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Read Promise. Why: IndexedDB reports through events. How: This resolves with the totals or rejects with the error.


		const getReqObj = datValObj.transaction( CHP_STO_STR, 'readonly' ).objectStore( CHP_STO_STR ).getAll(); // What: Get Request Object. Why: Every record counts. How: This reads them all.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.


		getReqObj.onerror   = () => rejValFun( getReqObj.error ); // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.
		getReqObj.onsuccess = () => { // What: Success Handler. Why: The totals count the well-formed records. How: This sums their sizes and counts them.


			const recValArr = ( getReqObj.result as unknown[] ).filter( recValFun ); // What: Record Value Array. Why: Only records this version wrote count. How: This keeps those. // What: Type Assertion Note. Why: getAll resolves with an array of whatever was stored. How: The as reads it as unknown values, to be checked.


			resValFun( { bytNum : recValArr.reduce( ( sumValNum, recValObj ) => sumValNum + recValObj.cipBytArr.byteLength, 0 ), couNum : recValArr.length } ); // What: Totals Resolve Call. Why: Settings shows both. How: This sums the ciphertexts' sizes and counts the records.


		};


	} );


};

// #endregion cpsSizFun

// #endregion Helpers



// #region Exports

export { cpsGetFun, cpsPruFun, type CpsRecTyp, cpsSetFun, cpsSizFun }; // What: Named Exports. Why: The chat keeps, shows, and clears its photos, and Settings totals them, through these. How: This exports the get, the prune, the record's type, the set, and the size.

// #endregion Exports


