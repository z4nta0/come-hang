


// #region Imports

import { clearIndexedDbPersistence } from 'firebase/firestore';         // What: Clear IndexedDB Persistence. Why: Firestore keeps its own offline copy on the phone. How: This deletes it once Firestore has stopped.
import { datDelFun                 } from '../platform/local-db.ts';    // What: Database Delete Function. Why: The app's keys and chat history are on the phone. How: This deletes their database.
import { firGetFun                 } from '../platform/firebase.ts';    // What: Firebase Get Function. Why: The deletion runs through Firebase. How: This returns the services.
import { httpsCallable             } from 'firebase/functions';         // What: HTTPS Callable. Why: Only a Cloud Function can hand a group on and delete a sign-in record. How: This calls it.
import { keyGetFun                 } from '../platform/key-store.ts';   // What: Key Get Function. Why: Only a phone that has acted holds an identity. How: This reads its record without connecting.
import { proKeyFun                 } from '../platform/dev-profile.ts'; // What: Profile Key Function. Why: Each development member keeps its own keys. How: This names the keys this one kept.
import { pusActFun                 } from './push.ts';                  // What: Push Active Function. Why: Notifications are turned off only when they're on. How: This reads whether they are.
import { pusDisFun                 } from './push.ts';                  // What: Push Disable Function. Why: The phone's push subscription is the identity's too. How: This turns notifications off.
import { signOut                   } from 'firebase/auth';              // What: Sign Out. Why: Auth keeps the sign-in on the phone. How: This clears it.
import { terminate                 } from 'firebase/firestore';         // What: Terminate. Why: Firestore's offline copy can only be deleted once Firestore stops. How: This stops it.

// #endregion Imports



/**
 * deletion.ts = Deletion
 *
 * @summary
 * Deleting someone's data from the phone they're using (ARCHITECTURE.md
 * Section 14): the Cloud Function deletes what the service keeps, then the
 * phone clears what it keeps itself, its keys, chat history, sign-in,
 * Firestore's offline copy, and the app's local storage, and the app starts
 * over at the welcome, which says the data is gone. A phone whose identity
 * can't sign in any more clears what it keeps all the same. Whether this
 * phone holds an identity at all is read from the phone alone, so asking
 * makes no connection.
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

const DEL_STO_STR = proKeyFun( 'come-hang-data-deleted' ); // What: Deleted Storage String. Why: The welcome says the data is gone after the app starts over, and local storage is cleared with everything else. How: This is the session storage key the deletion leaves for it.

// #endregion Constants



// #region Helpers

// #region ideHasFun

/**
 * ideHasFun = Identity Has Function
 *
 * @summary
 * Resolves with whether this phone holds an identity, read from the phone's
 * own database, so asking makes no connection.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true when the phone holds one.
 *
 * @example
 * ```ts
 * ideHasFun() // => false
 * ```
 *
*/

const ideHasFun = async () : Promise< boolean > => await keyGetFun( 'identity' ) !== undefined; // What: Identity Has Function. Why: The welcome offers to delete data only when there's some. How: This checks for the identity's stored record.

// #endregion ideHasFun



// #region ideDelFun

/**
 * ideDelFun = Identity Delete Function
 *
 * @summary
 * Deletes this phone's identity and everything kept for it. While it can
 * still sign in, notifications are turned off, best effort, and the Cloud
 * Function hands on or deletes its owned groups, leaves the rest, and deletes
 * what the service keeps, which rejects on failure, leaving the phone as it
 * was. Then the phone signs out, stops Firestore and deletes its offline
 * copy, best effort, deletes the app's database, removes the app's local
 * storage keys, leaves the welcome its note, and reloads at the root, which
 * opens the welcome.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles as the app reloads, with no value.
 *
 * @example
 * ```ts
 * ideDelFun() // => Promise<void>
 * ```
 *
*/

const ideDelFun = async () : Promise< void > => { // What: Identity Delete Function. Why: Someone can delete everything of theirs, from the service and the phone (the privacy policy's rights). How: This calls the deletion, clears the phone, and starts the app over.


	const { autValObj, fstDatObj, funValObj } = firGetFun(); // What: Firebase Services. Why: The deletion signs out, stops Firestore, and calls the function. How: This reads all three.


	await autValObj.authStateReady(); // What: Auth Ready Call. Why: The identity is restored asynchronously. How: This waits until Auth knows it.



	if ( autValObj.currentUser ) { // What: Signed In Block. Why: Only an identity that can sign in has data on the service to delete. How: This turns notifications off and calls the function.


		if ( pusActFun() ) { // What: Push Active Block. Why: The phone's push subscription should end with the identity. How: This turns notifications off, best effort.


			try { await pusDisFun(); } // What: Push Disable Attempt. Why: The browser's subscription is retired. How: This turns notifications off.

			catch ( errCatObj ) { console.warn( errCatObj ); } // What: Push Failure Catch. Why: The server deletes the token anyway, so the deletion goes on. How: This logs the failure.


		}



		await httpsCallable( funValObj, 'delDatFun' )(); // What: Delete Call. Why: The service's copy goes first, so a failure leaves the phone able to try again. How: This calls the function.


	}



	await signOut( autValObj ); // What: Sign Out Call. Why: The phone shouldn't keep a sign-in for an identity that's gone. How: This clears Auth's.

	await terminate( fstDatObj ); // What: Terminate Call. Why: Firestore's offline copy can only be deleted once it stops. How: This stops Firestore.



	try { await clearIndexedDbPersistence( fstDatObj ); } // What: Cache Clear Attempt. Why: Firestore's offline copy holds the groups as last read. How: This deletes it.

	catch ( errCatObj ) { console.warn( errCatObj ); } // What: Cache Failure Catch. Why: Another open tab keeps the copy in use, and nothing in it can be read without the identity's keys. How: This logs the failure and goes on.



	await datDelFun(); // What: Database Delete Call. Why: The keys and chat history are the phone's own copy. How: This deletes the app's database.


	const sufValStr = proKeyFun( '' ); // What: Suffix Value String. Why: Each development member's keys end in its profile, and a production build's in nothing. How: This names that ending.


	for ( const keyNamStr of Object.keys( localStorage ) ) if ( keyNamStr.startsWith( 'come-hang-' ) && keyNamStr.endsWith( sufValStr ) ) localStorage.removeItem( keyNamStr ); // What: Key Removal Loop. Why: Choices such as a sharing record or a dismissed banner belong to the identity. How: This removes each key the app kept.



	sessionStorage.setItem( DEL_STO_STR, 'true' ); // What: Note Set Call. Why: The welcome says the data is gone once the app starts over. How: This leaves it a note in the tab's storage.

	history.replaceState( null, '', '/' ); // What: Address Replace Call. Why: The app starts over at its root. How: This replaces the address without a new entry.

	location.reload(); // What: Reload Call. Why: Firestore has stopped, so the app has to start afresh. How: This reloads the page, which opens the welcome.


};

// #endregion ideDelFun

// #endregion Helpers



// #region Exports

export { DEL_STO_STR, ideDelFun, ideHasFun }; // What: Named Exports. Why: Settings and the welcome delete data, and the welcome says when it's gone. How: This exports the delete, the identity check, and the note's key.

// #endregion Exports


