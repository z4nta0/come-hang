


// #region Imports

import { connectAuthEmulator           } from 'firebase/auth';      // What: Connect Auth Emulator. Why: Development signs in against the local emulator. How: This points Auth at it.
import { connectDatabaseEmulator       } from 'firebase/database';  // What: Connect Database Emulator. Why: Development uses the local Realtime Database. How: This points the database at it.
import { connectFirestoreEmulator      } from 'firebase/firestore'; // What: Connect Firestore Emulator. Why: Development uses the local Firestore. How: This points Firestore at it.
import { connectFunctionsEmulator      } from 'firebase/functions'; // What: Connect Functions Emulator. Why: Development calls the local functions. How: This points Functions at them.
import { connectStorageEmulator        } from 'firebase/storage';   // What: Connect Storage Emulator. Why: Development uses the local Storage. How: This points Storage at it.
import { getAuth                       } from 'firebase/auth';      // What: Get Auth. Why: Every identity signs in through Auth. How: This returns the app's Auth instance.
import { getDatabase                   } from 'firebase/database';  // What: Get Database. Why: Chat and presence live in the Realtime Database. How: This returns the app's database.
import { getFunctions                  } from 'firebase/functions'; // What: Get Functions. Why: Some actions go through callables. How: This returns the app's Functions instance in the functions' region.
import { getStorage                    } from 'firebase/storage';   // What: Get Storage. Why: History transfers live in Storage. How: This returns the app's Storage.
import { initializeApp                 } from 'firebase/app';       // What: Initialize App. Why: Every service hangs off one Firebase app. How: This creates it from the web config.
import { initializeFirestore           } from 'firebase/firestore'; // What: Initialize Firestore. Why: Firestore keeps an offline copy on the device. How: This creates Firestore with its local cache.
import { persistentLocalCache          } from 'firebase/firestore'; // What: Persistent Local Cache. Why: The app works through a dropped connection. How: This keeps Firestore's cache in IndexedDB.
import { persistentMultipleTabManager  } from 'firebase/firestore'; // What: Persistent Multiple Tab Manager. Why: Two tabs of the app may be open at once. How: This lets them share the cache.


import type { Auth            } from 'firebase/auth';      // What: Auth. Why: The services record holds Auth. How: This types it.
import type { Database        } from 'firebase/database';  // What: Database. Why: The services record holds the Realtime Database. How: This types it.
import type { FirebaseOptions } from 'firebase/app';       // What: Firebase Options. Why: The web config has a known shape. How: This types it.
import type { Firestore       } from 'firebase/firestore'; // What: Firestore. Why: The services record holds Firestore. How: This types it.
import type { Functions       } from 'firebase/functions'; // What: Functions. Why: The services record holds Functions. How: This types it.
import type { FirebaseStorage } from 'firebase/storage';   // What: Firebase Storage. Why: The services record holds Storage. How: This types it.

// #endregion Imports



/**
 * firebase.ts = Firebase Services
 *
 * @summary
 * Creates the app's Firebase services the first time something asks for
 * them, never on page load, so a visitor who hasn't acted yet makes no
 * connection, and on iOS nothing is created before the app is installed
 * (ARCHITECTURE.md Section 16). Development, the Vite dev server, always
 * runs against the local Emulator Suite under the demo project, which can
 * never reach a real one (Section 13). A production build reads its web
 * config, which is public by design, from the VITE_FIREBASE_CONFIG
 * environment variable Netlify sets for each environment, and fails with a
 * clear error when it's missing. Everything runs in us-central1, and
 * Firestore keeps its offline cache in IndexedDB.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type FirSerTyp = { autValObj : Auth, funValObj : Functions, fstDatObj : Firestore, reaDatObj : Database, stoValObj : FirebaseStorage }; // What: Firebase Services Type. Why: Callers reach every service through one record. How: This types the record firGetFun returns.

// #endregion Types



// #region Constants

const EMU_CON_OBJ : FirebaseOptions = { apiKey : 'demo-key', authDomain : 'demo-come-hang.firebaseapp.com', databaseURL : 'http://127.0.0.1:8210?ns=demo-come-hang-default-rtdb', projectId : 'demo-come-hang', storageBucket : 'demo-come-hang.appspot.com' }; // What: Emulator Config Object. Why: Development uses the demo project, which only the emulators answer for. How: This names the demo project, its database namespace on the emulator's port, and its default bucket.

// #endregion Constants



// #region Module State

let firSerObj : FirSerTyp | null = null; // What: Firebase Services Object. Why: The services are created once, when first needed. How: This holds them after the first call.

// #endregion Module State



// #region Helpers

// #region firGetFun

/**
 * firGetFun = Firebase Get Function
 *
 * @summary
 * Returns the app's Firebase services, creating them on the first call: in
 * development connected to the emulators on the ports firebase.json gives
 * them, and in production from VITE_FIREBASE_CONFIG. Throws in production
 * when that config is missing, so a misconfigured deploy fails visibly.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The services record, the same one on every call.
 * @see {@link firSerObj}
 *
 * @example
 * ```ts
 * firGetFun() // => { autValObj, fstDatObj, funValObj, reaDatObj, stoValObj }
 * ```
 *
*/

const firGetFun = () : FirSerTyp => { // What: Firebase Get Function. Why: Every Firebase call goes through one set of services. How: This creates them once, then returns them.


	if ( firSerObj ) return firSerObj; // What: Created Guard. Why: The services exist once per page. How: This returns them after the first call.



	const proConStr = import.meta.env.VITE_FIREBASE_CONFIG; // What: Production Config String. Why: A production build is told its project by Netlify. How: This reads the config's JSON from the environment.


	if ( !import.meta.env.DEV && !proConStr ) throw new Error( 'VITE_FIREBASE_CONFIG is not set for this build.' ); // What: Missing Config Guard. Why: A production build without its project can't work, and should say so. How: This throws a clear error.



	const appValObj = initializeApp( import.meta.env.DEV ? EMU_CON_OBJ : JSON.parse( proConStr! ) as FirebaseOptions ); // What: App Value Object. Why: Every service belongs to one app. How: This creates it from the demo config in development and the environment's in production. // What: Non-Null Note. Why: The guard above threw for a production build without the config. How: The ! says it's here. // What: Type Assertion Note. Why: JSON.parse returns any. How: The as reads it as a web config.

	const autValObj = getAuth( appValObj ); // What: Auth Value Object. Why: Identities sign in through it. How: This creates it.
	const funValObj = getFunctions( appValObj, 'us-central1' );                                                                                   // What: Functions Value Object. Why: The functions run in us-central1. How: This creates the instance there.
	const fstDatObj = initializeFirestore( appValObj, { localCache : persistentLocalCache( { tabManager : persistentMultipleTabManager() } ) } ); // What: Firestore Data Object. Why: The app keeps working through a dropped connection, in any number of tabs. How: This creates Firestore with its IndexedDB cache shared between tabs.
	const reaDatObj = getDatabase( appValObj );                                                                                                   // What: Realtime Data Object. Why: Chat and presence live there. How: This creates it.
	const stoValObj = getStorage( appValObj );                                                                                                    // What: Storage Value Object. Why: History transfers live there. How: This creates it.



	if ( import.meta.env.DEV ) { // What: Emulator Block. Why: Development never touches a real project. How: This connects every service to its emulator.


		connectAuthEmulator( autValObj, 'http://127.0.0.1:8240', { disableWarnings : true } ); // What: Auth Emulator Call. Why: Sign-in stays local. How: This uses the Auth emulator's port.
		connectDatabaseEmulator( reaDatObj, '127.0.0.1', 8210 );                               // What: Database Emulator Call. Why: Chat stays local. How: This uses the Realtime Database emulator's port.
		connectFirestoreEmulator( fstDatObj, '127.0.0.1', 8200 );                              // What: Firestore Emulator Call. Why: Documents stay local. How: This uses the Firestore emulator's port.
		connectFunctionsEmulator( funValObj, '127.0.0.1', 8230 );                              // What: Functions Emulator Call. Why: Callables stay local. How: This uses the Functions emulator's port.
		connectStorageEmulator( stoValObj, '127.0.0.1', 8220 );                                // What: Storage Emulator Call. Why: Files stay local. How: This uses the Storage emulator's port.


	}



	firSerObj = { autValObj, fstDatObj, funValObj, reaDatObj, stoValObj }; // What: Services Assignment. Why: Later calls reuse the services. How: This keeps the record.



	return firSerObj; // What: Services Return. Why: The caller uses them. How: This returns the record.


};

// #endregion firGetFun

// #endregion Helpers



// #region Exports

export { firGetFun }; // What: Named Export. Why: Every Firebase call starts here. How: This exports the getter.

// #endregion Exports


