


// #region Imports

import { proKeyFun } from './dev-profile.ts'; // What: Profile Key Function. Why: Each development member keeps a database of its own. How: This names the database for this page's member.

// #endregion Imports



/**
 * local-db.ts = Local Database
 *
 * @summary
 * Opens the app's one IndexedDB database on this device, in raw IndexedDB
 * with no wrapper library (ARCHITECTURE.md Section 14), and names its object
 * stores: the keys (key-store.ts), the chat history (chat-store.ts), and the
 * groups' event places (place-store.ts). The database is at version 3, and an
 * upgrade creates whichever stores it doesn't have yet, so a device that
 * opened an earlier version keeps what it holds and gains the stores it
 * lacks. In development, each member the switcher can act as opens a
 * database of its own.
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

const DAT_BAS_STR = proKeyFun( 'come-hang' ); // What: Database Base String. Why: The app's IndexedDB database needs a name of its own, and each development member one apart. How: This names it after the app, with the member's profile appended in development.
const DAT_VER_NUM = 3;                         // What: Database Version Number. Why: Adding the places' store needs an upgrade from version 2. How: This asks for version 3.
const KEY_STO_STR = 'keys';                    // What: Key Store String. Why: Keys live apart from anything else the app stores. How: This names their object store.
const MES_STO_STR = 'messages';                // What: Message Store String. Why: The chat history lives apart from the keys. How: This names its object store.
const PLA_STO_STR = 'places';                  // What: Place Store String. Why: The groups' event places live apart from the keys and the chat. How: This names their object store.

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


		for ( const stoNamStr of [ KEY_STO_STR, MES_STO_STR, PLA_STO_STR ] ) if ( !opeReqObj.result.objectStoreNames.contains( stoNamStr ) ) opeReqObj.result.createObjectStore( stoNamStr ); // What: Store Create Loop. Why: An upgrade keeps the stores already there. How: This creates only the missing ones.


	};

	opeReqObj.onsuccess = () => resValFun( opeReqObj.result ); // What: Success Handler. Why: The caller works with the open database. How: This resolves with it.
	opeReqObj.onerror   = () => rejValFun( opeReqObj.error );  // What: Error Handler. Why: A failed open has to reach the caller. How: This rejects with the error.


} );

// #endregion datOpeFun



// #region datDelFun

/**
 * datDelFun = Database Delete Function
 *
 * @summary
 * Deletes the app's IndexedDB database, with everything in its stores, and
 * resolves once it's gone. Every reader and writer closes its connection
 * when it's done, so the delete waits only for work already under way.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once the database is gone, with no value.
 *
 * @example
 * ```ts
 * datDelFun() // => Promise<void>
 * ```
 *
*/

const datDelFun = () : Promise< void > => new Promise( ( resValFun, rejValFun ) => { // What: Database Delete Function. Why: Deleting someone's data clears what this phone keeps. How: This wraps IndexedDB's delete request in a promise.


	const delReqObj = indexedDB.deleteDatabase( DAT_BAS_STR ); // What: Delete Request Object. Why: The database deletes asynchronously. How: This asks for it to go.


	delReqObj.onsuccess = () => resValFun();                 // What: Success Handler. Why: The caller goes on once it's gone. How: This resolves then.
	delReqObj.onerror   = () => rejValFun( delReqObj.error ); // What: Error Handler. Why: A failed delete has to reach the caller. How: This rejects with the error.


} );

// #endregion datDelFun

// #endregion Helpers



// #region Exports

export { datDelFun, datOpeFun, KEY_STO_STR, MES_STO_STR, PLA_STO_STR }; // What: Named Exports. Why: The key store, the chat history, and the places open the database and name their stores, and deleting someone's data deletes it. How: This exports the opener, the delete, and the store names.

// #endregion Exports


