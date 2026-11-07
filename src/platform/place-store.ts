


// #region Imports

import { datOpeFun   } from './local-db.ts'; // What: Database Open Function. Why: The places live in the app's IndexedDB database. How: This opens it.
import { PLA_STO_STR } from './local-db.ts'; // What: Place Store String. Why: Places have their own object store. How: This names it.

// #endregion Imports



/**
 * place-store.ts = Place Store
 *
 * @summary
 * Keeps each group's event places on this device, so the event form can
 * suggest where the group has met before, since the server deletes an event
 * 48 hours after it ends (ARCHITECTURE.md Section 5). Each group's places are
 * one record under its ID, most recent first, at most 20, with no two that
 * differ only in case. Only the places are kept, nothing else about an
 * event, and a group the device no longer belongs to has its record removed.
 * Each read or write closes its connection once its transaction finishes.
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

const PLA_MAX_NUM = 20; // What: Place Maximum Number. Why: A suggestion list longer than a group's usual spots only gets in the way. How: This caps each group's record.

// #endregion Constants



// #region Helpers

// #region plaMerFun

/**
 * plaMerFun = Place Merge Function
 *
 * @summary
 * Puts the new places ahead of the stored ones, in their given order, drops
 * any place that repeats an earlier one in a different case, and keeps the
 * first 20. A stored value that isn't a list of text counts as no places.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param newPlaArr - New Places Array: The places to put first.
 * @param oldValUnk - Old Value Unknown: The group's stored record, if any.
 *
 * @returns The merged places.
 *
 * @example
 * ```ts
 * plaMerFun(['The park'], ['the Park', "Dana's"]) // => ['The park', "Dana's"]
 * ```
 *
*/

const plaMerFun = ( newPlaArr : string[], oldValUnk : unknown ) : string[] => { // What: Place Merge Function. Why: A write adds places without repeating one. How: This joins the lists, removes repeats, and caps the result.


	const oldPlaArr = Array.isArray( oldValUnk ) ? oldValUnk.filter( ( oldValAny ) => typeof oldValAny === 'string' ) : []; // What: Old Places Array. Why: Only text is a place. How: This keeps the stored record's text, or nothing.
	const seeKeySet = new Set< string >(); // What: Seen Key Set. Why: A place already kept in another case is a repeat. How: This holds each kept place in lower case.



	return [ ...newPlaArr, ...oldPlaArr ].filter( ( plaValStr ) => { // What: Merged Return. Why: The newest spelling of a place wins. How: This keeps each place whose lower case hasn't been seen, in order.


		const keyValStr = plaValStr.toLowerCase(); // What: Key Value String. Why: Places that differ only in case are one place. How: This lowers it.


		if ( plaValStr === '' || seeKeySet.has( keyValStr ) ) return false; // What: Repeat Guard. Why: An empty place or a repeat isn't kept. How: This drops it.



		seeKeySet.add( keyValStr ); // What: Seen Add Call. Why: A later repeat should be dropped. How: This records the place.



		return true; // What: Keep Return. Why: A new place is kept. How: This keeps it.


	} ).slice( 0, PLA_MAX_NUM ); // What: Cap Note. Why: Only the most recent places are suggested. How: This keeps the first 20.


};

// #endregion plaMerFun



// #region plaAddFun

/**
 * plaAddFun = Place Add Function
 *
 * @summary
 * Adds places to a group's record on this device, ahead of the ones already
 * there, and resolves once the write is committed. It expects each place
 * already tidied and within the place's limits. An empty list writes
 * nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param newPlaArr - New Places Array: The places to keep, most recent
 *                    first.
 *
 * @returns A promise that settles once the places are stored, with no value.
 *
 * @example
 * ```ts
 * plaAddFun('Xk3...', ['The park']) // => Promise<void>
 * ```
 *
*/

const plaAddFun = async ( groIdeStr : string, newPlaArr : string[] ) : Promise< void > => { // What: Place Add Function. Why: The device remembers where a group's events are. How: This merges the places into the group's record in one read-write transaction.


	if ( newPlaArr.length === 0 ) return; // What: Empty Guard. Why: No places means nothing to write. How: This returns.



	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The write needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Write Promise. Why: A write counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( PLA_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The read and the write share one transaction, so a second write can't slip between them. How: This opens a read-write one on the place store.
		const stoValObj = traValObj.objectStore( PLA_STO_STR );             // What: Store Value Object. Why: The record is read and written in the same store. How: This opens it.
		const getReqObj = stoValObj.get( groIdeStr );                       // What: Get Request Object. Why: New places join the ones kept. How: This reads the group's record.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.

		getReqObj.onsuccess  = () => stoValObj.put( plaMerFun( newPlaArr, getReqObj.result ), groIdeStr ); // What: Read Handler. Why: The merged list replaces the record. How: This writes it under the group's ID.
		traValObj.oncomplete = () => resValFun();                                                          // What: Complete Handler. Why: The record is on disk only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error );                                         // What: Error Handler. Why: A failed write has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion plaAddFun



// #region plaLisFun

/**
 * plaLisFun = Place List Function
 *
 * @summary
 * Resolves with a group's places kept on this device, most recent first, or
 * an empty list when it has none.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the places.
 *
 * @example
 * ```ts
 * plaLisFun('Xk3...') // => ['The park', "Dana's"]
 * ```
 *
*/

const plaLisFun = async ( groIdeStr : string ) : Promise< string[] > => { // What: Place List Function. Why: The event form suggests the group's places. How: This reads the group's record.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The read needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Read Promise. Why: IndexedDB reports through events. How: This resolves with the places or rejects with the error.


		const getReqObj = datValObj.transaction( PLA_STO_STR, 'readonly' ).objectStore( PLA_STO_STR ).get( groIdeStr ); // What: Get Request Object. Why: A group's places are one record. How: This reads it by the group's ID.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the read's transaction finishes.

		getReqObj.onsuccess = () => resValFun( plaMerFun( [], getReqObj.result ) ); // What: Success Handler. Why: The caller gets only well-formed places. How: This resolves with the record read as a list.
		getReqObj.onerror   = () => rejValFun( getReqObj.error );                   // What: Error Handler. Why: A failed read has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion plaLisFun



// #region plaPruFun

/**
 * plaPruFun = Place Prune Function
 *
 * @summary
 * Removes the place records of every group not in the given list, such as
 * one the member left, was removed from, or deleted, and resolves once the
 * removal is committed.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeArr - Group Identifier Array: The groups the member is in.
 *
 * @returns A promise that settles once the other records are gone, with no
 *          value.
 *
 * @example
 * ```ts
 * plaPruFun(['Xk3...']) // => Promise<void>
 * ```
 *
*/

const plaPruFun = async ( groIdeArr : string[] ) : Promise< void > => { // What: Place Prune Function. Why: A group's places shouldn't outlast the member's place in it. How: This deletes every record whose group isn't listed, in one read-write transaction.


	const datValObj = await datOpeFun(); // What: Database Value Object. Why: The removal needs the open database. How: This opens it.



	return new Promise( ( resValFun, rejValFun ) => { // What: Removal Promise. Why: A removal counts only once its transaction commits. How: This resolves on the transaction's completion or rejects with its error.


		const traValObj = datValObj.transaction( PLA_STO_STR, 'readwrite' ); // What: Transaction Value Object. Why: The keys are read and the records deleted together. How: This opens a read-write one on the place store.
		const stoValObj = traValObj.objectStore( PLA_STO_STR );             // What: Store Value Object. Why: The keys and records are in one store. How: This opens it.
		const keyReqObj = stoValObj.getAllKeys();                           // What: Key Request Object. Why: Each record is named by its group. How: This reads every key.


		datValObj.close(); // What: Close Call. Why: An open connection would block the database being deleted or upgraded. How: This closes it once the transaction finishes.

		keyReqObj.onsuccess  = () => keyReqObj.result.forEach( ( keyValObj ) => { if ( !groIdeArr.includes( String( keyValObj ) ) ) stoValObj.delete( keyValObj ); } ); // What: Keys Handler. Why: Only the member's groups keep their places. How: This deletes each record whose group isn't listed.
		traValObj.oncomplete = () => resValFun();                                                                                                                         // What: Complete Handler. Why: The records are gone only once the transaction commits. How: This resolves then.
		traValObj.onerror    = () => rejValFun( traValObj.error );                                                                                                        // What: Error Handler. Why: A failed removal has to reach the caller. How: This rejects with the error.


	} );


};

// #endregion plaPruFun

// #endregion Helpers



// #region Exports

export { plaAddFun, plaLisFun, plaPruFun }; // What: Named Exports. Why: The events keep their places, the event form suggests them, and the app removes a gone group's. How: This exports the add, the list, and the prune.

// #endregion Exports


