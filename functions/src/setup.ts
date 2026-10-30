


// #region Imports

import { getDatabase        } from 'firebase-admin/database';  // What: Get Database. Why: Functions write the Realtime Database's server-only data. How: This returns the default database instance.
import { getDatabaseWithUrl } from 'firebase-admin/database';  // What: Get Database With URL. Why: Under the emulator, the default instance is named by URL. How: This returns the instance at an address.
import { getFirestore       } from 'firebase-admin/firestore'; // What: Get Firestore. Why: Functions read the app's Firestore documents. How: This returns the default database.
import { getStorage         } from 'firebase-admin/storage';   // What: Get Storage. Why: Functions delete files from Cloud Storage. How: This returns the Storage service.
import { initializeApp      } from 'firebase-admin/app';       // What: Initialize App. Why: The Admin SDK needs an app before any service. How: This sets one up from the environment Firebase provides.

// #endregion Imports



/**
 * setup.ts = Functions Setup
 *
 * @summary
 * Sets up what every Cloud Function shares: the Admin SDK, signed in as the
 * project's own service account, so it reads and writes past the security
 * rules, and the options each function is deployed with. Every function runs
 * in us-central1 beside the databases it reacts to, and is capped in how many
 * instances it may start, so a flood of triggers can't run up the bill
 * (ARCHITECTURE.md Section 15).
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const FUN_OPT_OBJ = { maxInstances : 10, region : 'us-central1' }; // What: Function Options Object. Why: Every function runs where the databases are and can't scale without limit. How: Each function spreads these into its own options.

// #endregion Constants



// #region Module State

const ADM_APP_OBJ = initializeApp();                             // What: Admin App Object. Why: The services below need an app. How: This starts one with the project's own credentials.
const DBS_EMU_STR = process.env.FIREBASE_DATABASE_EMULATOR_HOST; // What: Database Emulator String. Why: Under the emulator, the Admin SDK's default namespace isn't the one the rules and the app use. How: This reads the emulator's address, undefined in production.


const FIR_DAT_OBJ = getFirestore(); // What: Firestore Database Object. Why: Functions read Firestore past its rules. How: This is the Admin SDK's Firestore.
const STO_ADM_OBJ = getStorage();   // What: Storage Admin Object. Why: Functions delete files past the Storage rules. How: This is the Admin SDK's Storage, whose default bucket each caller opens.

const REA_DAT_OBJ = DBS_EMU_STR ? getDatabaseWithUrl( `http://${ DBS_EMU_STR }?ns=${ process.env.GCLOUD_PROJECT }-default-rtdb`, ADM_APP_OBJ ) : getDatabase(); // What: Realtime Database Object. Why: Functions write the Realtime Database past its rules, in the project's default instance, which the emulator otherwise names after the bare project ID, apart from the app and the rules file. How: This is the Admin SDK's Realtime Database, pointed at that instance under the emulator.

// #endregion Module State



// #region Exports

export { FIR_DAT_OBJ, FUN_OPT_OBJ, REA_DAT_OBJ, STO_ADM_OBJ }; // What: Named Exports. Why: Every function module reads the shared services and options. How: This exports the three services and the options.

// #endregion Exports


