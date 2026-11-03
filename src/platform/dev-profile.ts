


/**
 * dev-profile.ts = Development Profile
 *
 * @summary
 * Names the member a development page acts as, so one browser can be
 * several people (ARCHITECTURE.md Section 14). A page opened with a
 * `dev-member` query parameter acts as that member, and otherwise as the one
 * the tab's session storage names, which the member switcher sets; a page
 * with neither, and every production build, is the device's own identity.
 * Each member keeps apart what a device keeps: its own Firebase app, so its
 * own sign-in and Firestore cache, its own IndexedDB database, and its own
 * local storage keys, each named through proKeyFun. A name outside a few
 * lowercase letters is ignored.
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

const PRO_NAM_REG = /^[a-z]{1,20}$/;        // What: Profile Name Regular Expression. Why: The name becomes part of database and storage names. How: This allows only a few lowercase letters.
const PRO_PAR_STR = 'dev-member';           // What: Profile Parameter String. Why: A seeding frame is told its member in its address. How: This names the query parameter.
const PRO_STO_STR = 'come-hang-dev-member'; // What: Profile Storage String. Why: The member a tab acts as has to survive its reload. How: This is the session storage key it's kept under.

// #endregion Constants



// #region Helpers

// #region proReaFun

/**
 * proReaFun = Profile Read Function
 *
 * @summary
 * Reads the member this page acts as: the address's `dev-member` parameter
 * first, then the tab's session storage, and returns an empty string when
 * neither names a valid member or storage is blocked.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The member's profile name, or an empty string for the device's
 *          own identity.
 *
 * @example
 * ```ts
 * proReaFun() // => 'sam'
 * ```
 *
*/

const proReaFun = () : string => { // What: Profile Read Function. Why: The page has to know whom it acts as before anything opens storage. How: This reads the address, then the tab's storage.


	let proValStr : string | null = new URLSearchParams( location.search ).get( PRO_PAR_STR ); // What: Profile Value String. Why: A seeding frame names its member in its address. How: This reads the parameter, null when absent.



	try { proValStr ??= sessionStorage.getItem( PRO_STO_STR ); } // What: Stored Profile Attempt. Why: The switcher keeps the tab's member there. How: This reads it when the address named none.

	catch { proValStr = null; } // What: Blocked Storage Fallback. Why: Blocked storage shouldn't stop the app. How: This falls back to the device's own identity.



	return proValStr !== null && PRO_NAM_REG.test( proValStr ) ? proValStr : ''; // What: Profile Return. Why: Only a valid name may reach a database's name. How: This returns it, or an empty string.


};

// #endregion proReaFun


const PRO_NAM_STR = import.meta.env.DEV ? proReaFun() : ''; // What: Profile Name String. Why: The member is fixed for the page's life, and a production build is always the device's own identity. How: This reads it once in development and is empty in production.


// #region proKeyFun

/**
 * proKeyFun = Profile Key Function
 *
 * @summary
 * Names something a device keeps for the member this page acts as: the name
 * itself for the device's own identity, and the name with the member's
 * profile appended otherwise, so two members never share it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyNamStr - Key Name String: The name the device's own identity
 *                    uses.
 *
 * @returns The name for this page's member.
 *
 * @example
 * ```ts
 * proKeyFun('come-hang') // => 'come-hang-sam'
 * ```
 *
*/

const proKeyFun = ( keyNamStr : string ) : string => PRO_NAM_STR === '' ? keyNamStr : `${ keyNamStr }-${ PRO_NAM_STR }`; // What: Profile Key Function. Why: Each member keeps its storage apart. How: This appends the profile when there is one.

// #endregion proKeyFun

// #endregion Helpers



// #region Exports

export { PRO_NAM_STR, PRO_PAR_STR, PRO_STO_STR, proKeyFun }; // What: Named Exports. Why: Storage is named per member, and the switcher reads and sets the member. How: This exports the profile, its parameter and storage names, and the naming helper.

// #endregion Exports


