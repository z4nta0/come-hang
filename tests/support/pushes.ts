


// #region Imports

import { collection } from 'firebase/firestore'; // What: Collection. Why: The emulator's pushes are read as a collection. How: This builds its reference.
import { doc        } from 'firebase/firestore'; // What: Doc. Why: A token is seeded as one document. How: This builds its reference.
import { getDocs    } from 'firebase/firestore'; // What: Get Docs. Why: Every push the emulator kept is read. How: This reads the collection.
import { setDoc     } from 'firebase/firestore'; // What: Set Doc. Why: A phone's token is seeded. How: This writes the document.
import { Timestamp  } from 'firebase/firestore'; // What: Timestamp. Why: A token carries its refresh and expiry times. How: This builds them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Seeds and reads go through the suite's environment. How: This types it.

// #endregion Imports



/**
 * pushes.ts = Push Checks
 *
 * @summary
 * Helpers for the functions suite's push checks. Under the Functions
 * emulator, the push helper keeps each push it would have sent in an
 * emulatorPushes collection rather than sending it, so a spec seeds a phone's
 * token, sets the change off, and reads back which sentences went to that
 * token.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region pusLisFun

/**
 * pusLisFun = Push List Function
 *
 * @summary
 * Reads every push the emulator kept for one token, with the rules off,
 * and returns each one's title and sentence.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The suite's environment.
 * @param tokValStr - Token Value String: The phone's token.
 *
 * @returns A promise that resolves with each push's title and sentence, in
 *          no set order.
 *
 * @example
 * ```ts
 * pusLisFun(funEnvObj, 'tok-carol') // => [ { body, title } ]
 * ```
 *
*/

const pusLisFun = async ( envTesObj : RulesTestEnvironment, tokValStr : string ) : Promise< { body : string, title : string }[] > => { // What: Push List Function. Why: A spec checks what reached a phone. How: This reads the emulator's kept pushes for one token.


	let pusLisArr : { body : string, title : string }[] = []; // What: Push List Array. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await envTesObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { pusLisArr = ( await getDocs( collection( cotAdmObj.firestore(), 'emulatorPushes' ) ) ).docs.filter( ( pusSnaObj ) => pusSnaObj.get( 'token' ) === tokValStr ).map( ( pusSnaObj ) => pusSnaObj.get( 'notification' ) ); } ); // What: Push Read Call. Why: No rule opens the collection. How: This reads it with the rules off and keeps the token's pushes.



	return pusLisArr; // What: Push List Return. Why: The spec compares them. How: This returns them.


};

// #endregion pusLisFun



const tokSetFun = ( envTesObj : RulesTestEnvironment, uidValStr : string, tokValStr : string ) => envTesObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), `accounts/${ uidValStr }/pushToken/current` ), { expireAt : Timestamp.fromMillis( Date.now() + 60 * 86400000 ), token : tokValStr, updatedAt : Timestamp.now() } ) ); // What: Token Set Function. Why: A push only goes to someone with a stored token. How: This seeds the identity's token, expiring 60 days out, with the rules off.

// #endregion Helpers



// #region Exports

export { pusLisFun, tokSetFun }; // What: Named Exports. Why: Every functions spec checks pushes this way. How: This exports both helpers.

// #endregion Exports


