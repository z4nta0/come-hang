


// #region Imports

import { gooRecFun   } from '../state/identity.ts'; // What: Google Recover Function. Why: Someone on a new phone gets their groups back (Section 8). How: This signs in with Google and remakes the phone's key pair.
import { useCallback } from 'react';                // What: Use Callback. Why: The recovery keeps one function while its state holds. How: This memoizes it.
import { useState    } from 'react';                // What: Use State. Why: The sign-in's progress and failure change while a screen shows. How: This holds each.

// #endregion Imports



/**
 * group-recovery.ts = Group Recovery
 *
 * @summary
 * The hook behind "Get my groups back", which the landing page and the
 * welcome share: it signs in through Google's popup, tracks whether a
 * sign-in is out, and words a failure for the screen's alert.
 *
 * Sections:
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Hooks

type RgrRetTyp = { errMesStr : string, recGroFun : () => Promise< void >, recReqBoo : boolean }; // What: Recover Groups Return Type. Why: A screen shows the button's label and the alert, and calls the recovery. How: This types useRecGroFun's return.

// #region useRecGroFun

/**
 * useRecGroFun = Use Recover Groups Function
 *
 * @summary
 * Returns what a screen needs for "Get my groups back": recGroFun, which
 * ignores a tap while a sign-in is out, signs in through Google's popup,
 * and calls onRecFun once it's done; recReqBoo, true while a sign-in is out,
 * for the button's label; and errMesStr, the alert's text, empty until a
 * sign-in fails. A failure is logged and worded, a closed or blocked popup
 * saying so and anything else asking to try again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onRecFun - On Recover Function: Called once an identity is brought
 *                   back onto this phone.
 *
 * @returns The recovery, whether one is out, and the alert's text.
 *
 * @example
 * ```ts
 * useRecGroFun(onRecFun) // => { errMesStr, recGroFun, recReqBoo }
 * ```
 *
*/

const useRecGroFun = ( onRecFun : () => void ) : RgrRetTyp => { // What: Use Recover Groups Function. Why: Two screens get groups back the same way. How: This holds the sign-in's state and returns the function that runs it.


	const [ errMesStr, setErrMesStr ] = useState( '' );    // What: Error Message String And Setter. Why: A sign-in that doesn't go through is announced. How: This holds the alert's text, empty when there's none.
	const [ recReqBoo, setRecReqBoo ] = useState( false ); // What: Recover Request Boolean And Setter. Why: One sign-in at a time, and the button says it's working. How: This is true while one is out.



	const recGroFun = useCallback( async () : Promise< void > => { // What: Recover Groups Function. Why: Someone on a new phone gets their identity and groups back (Section 8). How: This signs in with Google and hands the identity on.


		if ( recReqBoo ) return; // What: Busy Guard. Why: A second sign-in while one is out would open a second popup. How: This ignores it.



		setRecReqBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the sign-in as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.



		try { await gooRecFun(); } // What: Sign In Try. Why: The identity comes back through Google. How: This signs in and remakes the phone's key pair.

		catch ( errCatObj ) { // What: Sign In Catch. Why: A sign-in that doesn't go through has to be told. How: This logs it, frees the button, and says why.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.


			const errCodAny : unknown = Reflect.get( Object( errCatObj ), 'code' ); // What: Error Code Any. Why: Firebase names each failure by a code, which picks its message. How: This reads it, untyped.


			setRecReqBoo( false ); // What: Busy Clear Call. Why: The visitor can try again. How: This marks the sign-in as done.

			setErrMesStr( errCodAny === 'auth/popup-blocked' ? "Your browser blocked Google's sign-in window. Allow pop-ups for this app, then try again." : errCodAny === 'auth/popup-closed-by-user' || errCodAny === 'auth/cancelled-popup-request' ? "The Google sign-in was closed. Try again when you're ready." : "That didn't go through. Try again." ); // What: Failure Announce Call. Why: The visitor learns why, where the code says. How: This picks the message by the code.



			return;


		}



		onRecFun(); // What: Recovered Call. Why: The identity is back, with whatever groups it had. How: This hands it to the screen host.


	}, [ onRecFun, recReqBoo ] ); // What: Callback Dependency Array. Why: The recovery reads the hand-off and whether one is out. How: onRecFun changes with the host's handler, and recReqBoo as a sign-in starts and ends.



	return { errMesStr, recGroFun, recReqBoo }; // What: Recovery Return. Why: The screen draws the button and the alert, and calls the recovery. How: This returns the three.


};

// #endregion useRecGroFun

// #endregion Hooks



// #region Exports

export { useRecGroFun }; // What: Named Export. Why: The landing page and the welcome get groups back through it. How: This exports useRecGroFun.

// #endregion Exports


