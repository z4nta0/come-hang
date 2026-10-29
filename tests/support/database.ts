


/**
 * database.ts = Database Address
 *
 * @summary
 * Names the Realtime Database instance the emulated app and Cloud Functions
 * share, the project's default instance, where the emulator loads
 * database.rules.json. A test environment's database() otherwise opens a
 * namespace named after the bare project ID, which nothing else uses.
 *
 * Sections:
 *  - Constants
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DBS_URL_STR = 'http://127.0.0.1:8210?ns=demo-come-hang-default-rtdb'; // What: Database URL String. Why: Tests read and seed the instance the app and functions use. How: This names it on the emulator's port.

// #endregion Constants



// #region Exports

export { DBS_URL_STR }; // What: Named Export. Why: Every spec reading the Realtime Database opens the shared instance. How: This exports its address.

// #endregion Exports


