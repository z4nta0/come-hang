


// #region Imports

import { doc           } from 'firebase/firestore';      // What: Doc. Why: The paid flag is on the identity's account. How: This builds its reference.
import { firGetFun     } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: The checkout is a callable and the flag is in Firestore. How: This returns the services.
import { getDoc        } from 'firebase/firestore';      // What: Get Doc. Why: The flag is read from the account. How: This reads it.
import { httpsCallable } from 'firebase/functions';      // What: HTTPS Callable. Why: Polar's checkout is created by a Cloud Function, which holds the token. How: This calls it.
import { ideEnsFun     } from './identity.ts';           // What: Identity Ensure Function. Why: The account belongs to the identity. How: This reads it.

// #endregion Imports



/**
 * purchase.ts = Purchase
 *
 * @summary
 * The one-time upgrade from the app's side (ARCHITECTURE.md Section 18).
 * Buying asks the cheCreFun Cloud Function for a Polar checkout and resolves
 * with its address, which the app opens; the function refuses an identity
 * not linked to Google or already paid, rejecting with its code. Polar sends
 * the buyer back to the app's root with ?purchase=done, and its webhook sets
 * the paid flag on the identity's account, which the app reads.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region purBuyFun

/**
 * purBuyFun = Purchase Buy Function
 *
 * @summary
 * Starts buying the upgrade and resolves with the address of Polar's
 * checkout, which the app opens. Rejects with the function's code:
 * failed-precondition for an identity not linked to Google,
 * already-exists for one already paid, and unavailable while purchases
 * aren't set up.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the checkout's address.
 *
 * @example
 * ```ts
 * purBuyFun() // => 'https://polar.sh/checkout/...'
 * ```
 *
*/

const purBuyFun = async () : Promise< string > => { // What: Purchase Buy Function. Why: Owning more groups is bought once (Section 18). How: This asks the function for a checkout.


	await ideEnsFun(); // What: Identity Ensure Call. Why: Only a signed-in identity can buy. How: This makes sure it exists.



	return ( await httpsCallable< unknown, { urlValStr : string } >( firGetFun().funValObj, 'cheCreFun' )() ).data.urlValStr; // What: Address Return. Why: The app opens Polar's checkout. How: This calls the function and returns its address.


};

// #endregion purBuyFun



// #region purPaiFun

/**
 * purPaiFun = Purchase Paid Function
 *
 * @summary
 * Resolves with whether this identity has bought the upgrade, from the paid
 * flag only the payment webhook writes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true once paid.
 *
 * @example
 * ```ts
 * purPaiFun() // => false
 * ```
 *
*/

const purPaiFun = async () : Promise< boolean > => ( await getDoc( doc( firGetFun().fstDatObj, `accounts/${ ( await ideEnsFun() ).uidValStr }` ) ) ).get( 'paid' ) === true; // What: Purchase Paid Function. Why: Settings show whether the upgrade is bought, and the app checks it on returning from the checkout. How: This reads the account's flag.

// #endregion purPaiFun

// #endregion Helpers



// #region Exports

export { purBuyFun, purPaiFun }; // What: Named Exports. Why: Settings start a purchase and show its state. How: This exports both.

// #endregion Exports


