


// #region Imports

import { AVA_STO_STR } from './local-db.ts'; // What: Avatar Store String. Why: The profile photos have their own object store. How: This names it.
import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The profile photos live in the app's IndexedDB database. How: This opens it.

// #endregion Imports



/**
 * avatar-store.ts = Avatar Store
 *
 * @summary
 * Keeps on this device the members' profile photos (ARCHITECTURE.md Section
 * 21), decrypted, one record for each group and member, holding the photo's
 * ID beside its bytes, so a photo downloads once, shows offline, and is
 * fetched again only when its ID changes. Each read or write closes its
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

type AvsRecTyp = { avaIdeStr : string, bytArr : Uint8Array< ArrayBuffer > }; // What: Avatar Store Record Type. Why: A kept photo is checked against the member's current one by its ID. How: This types the ID and the bytes.

// #endregion Types



// #region Helpers

// #region avsGetFun

/**
 * avsGetFun = Avatar-Store Get Function
 *
 * @summary
 * Resolves with the photo kept for a group's member, or null when none is
 * kept or the record isn't one this version wrote.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The group and the member's UID,
 *                    joined by a slash.
 *
 * @returns A promise that resolves with the kept photo, or null.
 *
 * @example
 * ```ts
 * avsGetFun('Xk3.../u1') // => { avaIdeStr : 'a9...', bytArr }
 * ```
 *
*/

const avsGetFun = async ( keyValStr : string ) : Promise< AvsRecTyp | null > => { // What: Avatar-Store Get Function. Why: A photo kept on the device needn't download again. How: This reads its record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Read Promise. Why: IndexedDB reports through events. How: This resolves with the record or rejects with the error.


		const getReqObj = datValObj.transaction( AVA_STO_STR, 'readonly' ).objectStore( AVA_STO_STR ).get( keyValStr ); // What: Get Request Object. Why: Each member's photo is one record. How: This reads it.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.

		getReqObj.onerror = () => rejValFun( getReqObj.error ); // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.

		getReqObj.onsuccess = () => { // What: Success Handler. Why: The caller gets only a well-formed record. How: This checks the record's fields and resolves with it, or null.


			const recValAny : unknown = getReqObj.result; // What: Record Value Any. Why: Anything could be stored under the key. How: This reads it, untyped.

			const recValBoo = typeof recValAny === 'object' && recValAny !== null && typeof Reflect.get( recValAny, 'avaIdeStr' ) === 'string' && Reflect.get( recValAny, 'bytArr' ) instanceof Uint8Array; // What: Record Valid Boolean. Why: The photo is matched by its ID and shown from its bytes. How: This checks it's an object holding a string ID and a byte array, each check guarding the next, so the chain stays inline.


			resValFun( recValBoo ? recValAny as AvsRecTyp : null ); // What: Resolve Call. Why: The caller gets a usable record or nothing. How: This resolves with it, or null. // What: Type Assertion Note. Why: The checks just above confirm both fields. How: The as reads the record as one.


		};


	} );


};

// #endregion avsGetFun



// #region avsSetFun

/**
 * avsSetFun = Avatar-Store Set Function
 *
 * @summary
 * Keeps a group member's photo under its key, or forgets it when given null,
 * and resolves once the write is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The group and the member's UID,
 *                    joined by a slash.
 * @param recValObj - Record Value Object: The photo's ID and bytes, or null
 *                    to forget it.
 *
 * @returns A promise that settles once the write is stored, with no value.
 *
 * @example
 * ```ts
 * avsSetFun('Xk3.../u1', { avaIdeStr, bytArr }) // => Promise<void>
 * ```
 *
*/

const avsSetFun = async ( keyValStr : string, recValObj : AvsRecTyp | null ) : Promise< void > => { // What: Avatar-Store Set Function. Why: A downloaded photo is kept, and a removed one forgotten. How: This writes or deletes the record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( AVA_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The record is written in one transaction. How: This opens a read-write one on the avatar store.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.


		if ( recValObj === null ) traValObj.objectStore( AVA_STO_STR ).delete( keyValStr ); // What: Delete Call. Why: A removed photo shouldn't linger on the device. How: This deletes the record.

		else traValObj.objectStore( AVA_STO_STR ).put( recValObj, keyValStr ); // What: Put Call. Why: The photo shows from the device next time. How: This writes it under its key.



		traValObj.oncomplete = () => resValFun();                  // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error ); // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion avsSetFun

// #endregion Helpers



// #region Exports

export { avsGetFun, type AvsRecTyp, avsSetFun }; // What: Named Exports. Why: The profile photos are read from and kept on the device through these. How: This exports the get, the record's type, and the set.

// #endregion Exports


