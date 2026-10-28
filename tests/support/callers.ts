


// #region Imports

import { connectAuthEmulator      } from 'firebase/auth';      // What: Connect Auth Emulator. Why: Callers sign in against the local emulator. How: This points an Auth instance at it.
import { connectFunctionsEmulator } from 'firebase/functions'; // What: Connect Functions Emulator. Why: The callables run in the local emulator. How: This points a Functions instance at it.
import { getAuth                  } from 'firebase/auth';      // What: Get Auth. Why: Each caller has an identity. How: This returns an app's Auth instance.
import { getFunctions             } from 'firebase/functions'; // What: Get Functions. Why: Each caller calls a function. How: This returns an app's Functions instance in the functions' region.
import { httpsCallable            } from 'firebase/functions'; // What: HTTPS Callable. Why: The app reaches server actions through callables. How: This builds the call.
import { initializeApp            } from 'firebase/app';       // What: Initialize App. Why: Each caller is its own client app. How: This creates one under a name.
import { signInAnonymously        } from 'firebase/auth';      // What: Sign In Anonymously. Why: The app's identities are anonymous until linked. How: This signs a caller in.


import type { FirebaseApp   } from 'firebase/app';       // What: Firebase App. Why: A suite closes its callers' apps when it ends. How: This types them.
import type { HttpsCallable } from 'firebase/functions'; // What: HTTPS Callable. Why: Each caller holds its call. How: This types it.

// #endregion Imports



/**
 * callers.ts = Callable Callers
 *
 * @summary
 * Builds the signed-in callers the functions suite calls callables as: each
 * one its own client app, signed in anonymously through the Auth emulator
 * and calling through the Functions emulator, as the app will, or left
 * signed out to check a refusal.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type CalRecTyp = { appValObj : FirebaseApp, calValFun : HttpsCallable, uidValStr : string }; // What: Caller Record Type. Why: A caller's app, call, and UID travel together. How: This types the record calCreFun returns.

// #endregion Types



// #region Constants

const APP_OPT_OBJ = { apiKey : 'demo-key', projectId : 'demo-come-hang' }; // What: App Options Object. Why: A caller's app needs a project, and the emulators accept any key. How: This names the demo project test:functions starts.

// #endregion Constants



// #region Helpers

// #region calCreFun

/**
 * calCreFun = Caller Create Function
 *
 * @summary
 * Creates a client app under its own name, connected to the Auth and
 * Functions emulators, signs it in anonymously unless told not to, and
 * returns its app, its call to the named function, and its UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param appNamStr - App Name String: The client app's name, unique to the
 *                    suite.
 * @param funNamStr - Function Name String: The callable the caller calls.
 * @param sigInnBoo - Sign In Boolean: Whether the caller signs in, true by
 *                    default.
 *
 * @returns A promise that resolves with the caller's app, call, and UID,
 *          which is empty for a caller who didn't sign in.
 *
 * @example
 * ```ts
 * calCreFun('alice', 'delGroFun') // => { appValObj, calValFun, uidValStr }
 * ```
 *
*/

const calCreFun = async ( appNamStr : string, funNamStr : string, sigInnBoo = true ) : Promise< CalRecTyp > => { // What: Caller Create Function. Why: Each identity calls through its own app. How: This builds, connects, and signs in the app.


	const appValObj = initializeApp( APP_OPT_OBJ, appNamStr );  // What: App Value Object. Why: Each caller is its own client. How: This creates its app.
	const autValObj = getAuth( appValObj );                     // What: Auth Value Object. Why: The caller signs in. How: This is its Auth instance.
	const funValObj = getFunctions( appValObj, 'us-central1' ); // What: Functions Value Object. Why: The callables run in us-central1. How: This is the caller's Functions instance there.


	connectAuthEmulator( autValObj, 'http://127.0.0.1:8240', { disableWarnings : true } ); // What: Auth Emulator Call. Why: Sign-in must stay local. How: This points Auth at the port firebase.json gives its emulator.

	connectFunctionsEmulator( funValObj, '127.0.0.1', 8230 ); // What: Functions Emulator Call. Why: The call must stay local. How: This points Functions at the port firebase.json gives its emulator.


	const uidValStr = sigInnBoo ? ( await signInAnonymously( autValObj ) ).user.uid : ''; // What: UID Value String. Why: The tests seed the caller's UID into groups. How: This signs in and reads it, or leaves it empty.



	return { appValObj, calValFun : httpsCallable( funValObj, funNamStr ), uidValStr }; // What: Caller Return. Why: Each test calls as this caller. How: This returns the app, the call, and the UID.


};

// #endregion calCreFun

// #endregion Helpers



// #region Exports

export { calCreFun, type CalRecTyp }; // What: Named Exports. Why: Every callable spec builds its callers this way. How: This exports the helper and its record's type.

// #endregion Exports


