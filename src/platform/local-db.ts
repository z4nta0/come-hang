


/**
 * local-db.ts = Local Database
 *
 * @summary
 * Opens the app's one IndexedDB database on this device, in raw IndexedDB
 * with no wrapper library (ARCHITECTURE.md Section 14), and names its object
 * stores: the keys (key-store.ts) and the chat history (chat-store.ts). The
 * database is at version 2, and an upgrade creates whichever stores it
 * doesn't have yet, so a device that opened version 1, with only the keys,
 * keeps them and gains the chat history.
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
const DAT_VER_NUM = 2;           // What: Database Version Number. Why: Adding the chat history's store needs an upgrade from version 1. How: This asks for version 2.
const KEY_STO_STR = 'keys';      // What: Key Store String. Why: Keys live apart from anything else the app stores. How: This names their object store.
const MES_STO_STR = 'messages';  // What: Message Store String. Why: The chat history lives apart from the keys. How: This names its object store.

// #endregion Constants



// #region Helpers

// #region datOpeFun

/**
 * datOpeFun = Database Open Function
 *
 * @summary
 * Opens the app's IndexedDB database, creating any store it lacks, and
 * resolves once it's ready. The caller closes the connection.
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


	const opeReqObj = indexedDB.open( DAT_BAS_STR, DAT_VER_NUM ); // What: Open Request Object. Why: The database opens asynchronously. How: This asks for the current version.


	opeReqObj.onupgradeneeded = () => { // What: Upgrade Handler. Why: A new or older database lacks some stores. How: This creates each one that's missing.


		for ( const stoNamStr of [ KEY_STO_STR, MES_STO_STR ] ) if ( !opeReqObj.result.objectStoreNames.contains( stoNamStr ) ) opeReqObj.result.createObjectStore( stoNamStr ); // What: Store Create Loop. Why: An upgrade keeps the stores already there. How: This creates only the missing ones.


	};

	opeReqObj.onsuccess = () => resValFun( opeReqObj.result ); // What: Success Handler. Why: The caller works with the open database. How: This resolves with it.
	opeReqObj.onerror   = () => rejValFun( opeReqObj.error );  // What: Error Handler. Why: A failed open has to reach the caller. How: This rejects with the error.


} );

// #endregion datOpeFun

// #endregion Helpers



// #region Exports

export { datOpeFun, KEY_STO_STR, MES_STO_STR }; // What: Named Exports. Why: The key store and the chat history open the database and name their stores. How: This exports the opener and the store names.

// #endregion Exports


