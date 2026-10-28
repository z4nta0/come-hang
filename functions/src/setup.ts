


// #region Imports

import { getDatabase   } from 'firebase-admin/database';  // What: Get Database. Why: Functions write the Realtime Database's server-only data. How: This returns the default database instance.
import { getFirestore  } from 'firebase-admin/firestore'; // What: Get Firestore. Why: Functions read the app's Firestore documents. How: This returns the default database.
import { initializeApp } from 'firebase-admin/app';       // What: Initialize App. Why: The Admin SDK needs an app before any service. How: This sets one up from the environment Firebase provides.

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

initializeApp(); // What: App Initialize Call. Why: The services below need an app. How: This starts one with the project's own credentials.


const FIR_DAT_OBJ = getFirestore(); // What: Firestore Database Object. Why: Functions read Firestore past its rules. How: This is the Admin SDK's Firestore.
const REA_DAT_OBJ = getDatabase();  // What: Realtime Database Object. Why: Functions write the Realtime Database past its rules. How: This is the Admin SDK's Realtime Database.

// #endregion Module State



// #region Exports

export { FIR_DAT_OBJ, FUN_OPT_OBJ, REA_DAT_OBJ }; // What: Named Exports. Why: Every function module reads the shared services and options. How: This exports all three.

// #endregion Exports


