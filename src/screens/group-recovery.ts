


// #region Imports

import { gooRecFun   } from '../state/identity.ts';        // What: Google Recover Function. Why: Someone on a new phone gets their groups back (Section 8). How: This signs in with Google and remakes the phone's key pair.
import { outTakFun   } from '../state/google-redirect.ts'; // What: Outcome Take Function. Why: A recovery that left for Google's page finishes as the app reopens. How: This hands the screen its outcome once.
import { useCallback } from 'react';                       // What: Use Callback. Why: The recovery keeps one function while its state holds. How: This memoizes it.
import { useEffect   } from 'react';                       // What: Use Effect. Why: A redirected recovery's outcome is read as the screen opens. How: This runs the read after the screen draws.
import { useState    } from 'react';                       // What: Use State. Why: The sign-in's progress and failure change while a screen shows. How: This holds each.

// #endregion Imports



/**
 * group-recovery.ts = Group Recovery
 *
 * @summary
 * The hook behind "Get my groups back", which the landing page and the
 * welcome share: it signs in through Google's popup, or a full-page redirect
 * when the popup is blocked, tracks whether a sign-in is out, and words a
 * failure for the screen's alert, a redirect's once the screen opens again.
 *
 * Sections:
 *  - Helpers
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

const recMesFun = ( errCodAny : unknown ) : string => errCodAny === 'auth/popup-blocked' // What: Recover Message Function. Why: A sign-in through the popup or the redirect words its failure the same way. How: This picks the message by Firebase's code.
	? "Your browser blocked Google's sign-in window. Allow pop-ups for this app, then try again."                       // What: Blocked Message. Why: A blocked popup is fixed in the browser's settings. How: This says so.
	: errCodAny === 'auth/popup-closed-by-user' || errCodAny === 'auth/cancelled-popup-request' // What: Closed Check. Why: A closed sign-in is the visitor's choice, not a fault. How: This checks both of its codes.
		? "The Google sign-in was closed. Try again when you're ready."                                                  // What: Closed Message. Why: The visitor can simply try again. How: This says so.
		: "That didn't go through. Try again.";                                                                           // What: General Message. Why: Any other failure still has to be told. How: This asks to try again.

// #endregion Helpers



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
 * sign-in fails, or a redirected one comes back refused. A failure is logged
 * and worded, a closed or blocked popup saying so and anything else asking to
 * try again.
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



	useEffect( () => { // What: Redirect Outcome Effect. Why: A recovery whose popup was blocked left for Google's page, and a refusal there has to be told when this screen opens again. How: This takes the recovery's outcome once and announces a failure.


		let actValBoo = true; // What: Active Value Boolean. Why: An outcome arriving after the screen closed mustn't change it. How: This is true until the cleanup runs.


		void outTakFun( 'recover', true, ( outRecObj ) => { if ( actValBoo ) setErrMesStr( recMesFun( outRecObj.errCodStr ) ); return actValBoo; } ); // What: Outcome Take Call. Why: A refused recovery is told here, while the screen host finishes one that went through. How: This takes only a refusal while the screen is open, and announces its reason.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: An outcome still out shouldn't land after the screen closes. How: This marks it closed.


	}, [] ); // What: Effect Dependency Array. Why: The outcome is taken once. How: The empty list takes it as the screen opens.



	const recGroFun = useCallback( async () : Promise< void > => { // What: Recover Groups Function. Why: Someone on a new phone gets their identity and groups back (Section 8). How: This signs in with Google and hands the identity on.


		if ( recReqBoo ) return; // What: Busy Guard. Why: A second sign-in while one is out would open a second popup. How: This ignores it.



		setRecReqBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the sign-in as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.



		try { await gooRecFun(); } // What: Sign In Try. Why: The identity comes back through Google. How: This signs in and remakes the phone's key pair.

		catch ( errCatObj ) { // What: Sign In Catch. Why: A sign-in that doesn't go through has to be told. How: This logs it, frees the button, and says why.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.


			const errCodAny : unknown = Reflect.get( Object( errCatObj ), 'code' ); // What: Error Code Any. Why: Firebase names each failure by a code, which picks its message. How: This reads it, untyped.


			setRecReqBoo( false ); // What: Busy Clear Call. Why: The visitor can try again. How: This marks the sign-in as done.

			setErrMesStr( recMesFun( errCodAny ) ); // What: Failure Announce Call. Why: The visitor learns why, where the code says. How: This words the failure by its code.



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


