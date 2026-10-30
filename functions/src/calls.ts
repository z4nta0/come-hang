


// #region Imports

import { HttpsError } from 'firebase-functions/v2/https'; // What: HTTPS Error. Why: A refused call tells the app why. How: This throws an error the client receives with its code.


import type { CallableRequest } from 'firebase-functions/v2/https'; // What: Callable Request. Why: The checks read a callable's request. How: This types it.

// #endregion Imports



/**
 * calls.ts = Callable Checks
 *
 * @summary
 * The checks every callable about one group starts with: the caller has to
 * be signed in, and the call has to name a group by an ID in the form
 * Firestore's own IDs take, since the ID builds document and storage paths
 * and a slash in it could reach another one.
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

const GRO_IDE_REG = /^[A-Za-z0-9_-]{1,128}$/; // What: Group Identifier Regular Expression. Why: The ID builds paths, so a slash could reach another document. How: This allows the characters Firestore's own IDs use, and nothing else.

// #endregion Constants



// #region Helpers

// #region calGroFun

/**
 * calGroFun = Call Group Function
 *
 * @summary
 * Reads a group callable's request, refusing a caller with no sign-in as
 * unauthenticated and a missing or malformed group ID as an invalid
 * argument, and returns the group's ID and the caller's UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqValObj - Request Value Object: The call Firebase passes on, with
 *                    the caller's sign-in and the data the app sent.
 *
 * @returns The group's ID and the caller's UID.
 *
 * @example
 * ```ts
 * calGroFun(reqValObj) // => { groIdeStr : 'gro1', uidValStr : 'alice' }
 * ```
 *
*/

const calGroFun = ( reqValObj : CallableRequest ) : { groIdeStr : string, uidValStr : string } => { // What: Call Group Function. Why: Every group callable starts with the same checks. How: This checks the sign-in and the ID, then returns both.


	const groIdeAny = ( reqValObj.data as { groupId? : unknown } | null )?.groupId; // What: Group Identifier Any. Why: The app names the group. How: This reads it from the call. // What: Type Assertion Note. Why: A call's data is whatever the client sent. How: The as reads it as an object that may hold a groupId of any type, which the guard below checks.



	if ( !reqValObj.auth ) throw new HttpsError( 'unauthenticated', 'Sign in first.' ); // What: Sign-In Guard. Why: Every group action belongs to an identity. How: This refuses a caller with no sign-in.



	if ( typeof groIdeAny !== 'string' || !GRO_IDE_REG.test( groIdeAny ) ) throw new HttpsError( 'invalid-argument', 'A valid group ID is required.' ); // What: Group Identifier Guard. Why: The ID builds paths, so it has to be one. How: This refuses anything but a well-formed ID.



	return { groIdeStr : groIdeAny, uidValStr : reqValObj.auth.uid }; // What: Call Return. Why: The callable works from the group and the caller. How: This returns both.


};

// #endregion calGroFun

// #endregion Helpers



// #region Exports

export { calGroFun }; // What: Named Export. Why: Every group callable starts with these checks. How: This exports the helper.

// #endregion Exports


