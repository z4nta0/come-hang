


// #region Imports

import { firGetFun         } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: The redirect's result is read through Auth. How: This returns the app's Firebase services.
import { getRedirectResult } from 'firebase/auth';           // What: Get Redirect Result. Why: A sign-in that left for Google's page finishes once the app loads again. How: This resolves with it, or rejects with why it failed.

// #endregion Imports



/**
 * google-redirect.ts = Google Redirect
 *
 * @summary
 * Lets Google sign-in fall back from its popup to a full-page redirect
 * (ARCHITECTURE.md Section 8). A browser blocks a popup opened too long after
 * the tap, which an installed app on a phone can reach while Firebase loads
 * its sign-in helper or the app checks the server first, so a sign-in whose
 * popup is blocked leaves for Google's page instead, which no blocker can
 * stop. Before leaving, it notes in session storage which sign-in it was, and
 * once the app loads again the first screen to ask takes the redirect's
 * outcome, success or the reason it failed, once.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type RedOutTyp = { errCodStr : string | null, kinStr : string }; // What: Redirect Outcome Type. Why: A screen announces how a redirect went. How: This holds the sign-in's kind and its failure's code, null when it went through, or empty when the failure had none.

// #endregion Types



// #region Constants

const RED_KEY_STR = 'come-hang-google-redirect'; // What: Redirect Key String. Why: The sign-in's kind has to survive leaving for Google's page. How: This names its session storage entry.

// #endregion Constants



// #region Module State

let outProObj : Promise< RedOutTyp | null > | null = null; // What: Outcome Promise Object. Why: The redirect's result is read once, whichever screen asks first. How: This holds the reading, null until a screen asks.

// #endregion Module State



// #region Helpers

// #region outReaFun

/**
 * outReaFun = Outcome Read Function
 *
 * @summary
 * Reads how a redirect sign-in went, once per page load. With no sign-in
 * noted in session storage, or when Google's page was left without signing
 * in, it resolves with null. Otherwise it removes the note and resolves with
 * the sign-in's kind and, when Auth refused it, the refusal's code.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the outcome, or null.
 *
 * @example
 * ```ts
 * outReaFun() // => { errCodStr : null, kinStr : 'link' }
 * ```
 *
*/

const outReaFun = async () : Promise< RedOutTyp | null > => { // What: Outcome Read Function. Why: A redirect's result arrives on the next load. How: This takes the noted kind and asks Auth how it went.


	let kinStr : string | null; // What: Kind String. Why: Only a sign-in noted before leaving has an outcome to read. How: This holds the noted kind.


	try { kinStr = sessionStorage.getItem( RED_KEY_STR ); sessionStorage.removeItem( RED_KEY_STR ); } // What: Note Take Try. Why: The outcome is read once. How: This reads the note and removes it.

	catch { return null; } // What: Note Take Catch. Why: Storage the browser refuses holds no note. How: This resolves with nothing.



	if ( kinStr === null ) return null; // What: No Note Guard. Why: Without a note, no redirect sign-in happened. How: This resolves with nothing.



	try { // What: Result Try. Why: Auth finishes the sign-in and reports how it went. How: This waits for its result.


		const resValObj = await getRedirectResult( firGetFun().autValObj ); // What: Result Value Object. Why: A completed sign-in returns its credential. How: This reads it, null when Google's page was left without signing in.



		return resValObj === null ? null : { errCodStr : null, kinStr }; // What: Success Return. Why: A finished sign-in is announced as done. How: This returns the kind with no failure, or nothing when it never finished.


	}

	catch ( errCatObj ) { // What: Result Catch. Why: A refused sign-in has to be told, with its reason. How: This logs it and returns its code.


		console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.


		const errCodAny : unknown = Reflect.get( Object( errCatObj ), 'code' ); // What: Error Code Any. Why: Firebase names each failure by a code, which picks its message. How: This reads it, untyped.



		return { errCodStr : typeof errCodAny === 'string' ? errCodAny : '', kinStr }; // What: Failure Return. Why: The screen words the failure. How: This returns the kind and the code, empty when there's none.


	}


};

// #endregion outReaFun



// #region outTakFun

/**
 * outTakFun = Outcome Take Function
 *
 * @summary
 * Hands the redirect's outcome to a screen's apply function when it was this
 * kind of sign-in, and, when asked, only a refused or only a finished one.
 * The outcome counts as taken only once the apply function returns true, so a
 * screen torn down before it could announce it, as one is when the app's
 * entry address gives way to the root, leaves it for the screen that
 * replaces it. Any other outcome, or no redirect at all, never reaches the
 * apply function.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param kinStr - Kind String: The sign-in the screen runs, `link` or
 *                 `recover`.
 * @param errBoo - Error Boolean: True to take only a refused sign-in, false
 *                 only a finished one, null for either.
 * @param appFun - Apply Function: Announces or finishes the outcome, returning
 *                 false when the screen can't, such as once it's gone.
 *
 * @returns A promise that settles once the outcome is handed over or passed
 *          by, with no value.
 *
 * @example
 * ```ts
 * outTakFun('recover', true, appFun) // => Promise<void>
 * ```
 *
*/

const outTakFun = async ( kinStr : string, errBoo : boolean | null, appFun : ( outRecObj : RedOutTyp ) => boolean ) : Promise< void > => { // What: Outcome Take Function. Why: Settings and the recovery screens each announce their own sign-in's result. How: This hands it to the screen of its kind, once one uses it.


	outProObj ??= outReaFun(); // What: Reading Start. Why: The result is read once, whoever asks first. How: This starts the reading if no screen has.


	const outRecObj = await outProObj; // What: Outcome Record Object. Why: The screen needs the result. How: This waits for it.


	if ( outRecObj === null ) return; // What: No Outcome Guard. Why: Most loads follow no redirect. How: This stops there.



	const errMatBoo = errBoo === null || errBoo === ( outRecObj.errCodStr !== null ); // What: Error Match Boolean. Why: A refused and a finished sign-in can belong to different screens. How: This is true when the outcome is the one asked for, or either was.


	if ( outRecObj.kinStr !== kinStr || !errMatBoo || !appFun( outRecObj ) ) return; // What: Not Used Guard. Why: Another screen's outcome isn't this one's, and one this screen couldn't use belongs to the screen after it. How: This stops, leaving the outcome.



	outProObj = Promise.resolve( null ); // What: Taken Mark. Why: The outcome is announced once. How: This leaves nothing for later asks.


};

// #endregion outTakFun



// #region popRedFun

/**
 * popRedFun = Popup Redirect Function
 *
 * @summary
 * Runs a Google sign-in through its popup, and when the browser blocks the
 * popup, notes the sign-in's kind and runs it as a full-page redirect instead,
 * which leaves the page, so the returned promise then doesn't settle before it
 * goes. Any other failure rejects as before. A note the browser can't store
 * still lets the redirect run, its outcome unannounced.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param popFunVal - Popup Function Value: Runs the sign-in in a popup.
 * @param redFunVal - Redirect Function Value: Runs the same sign-in as a
 *                    redirect.
 * @param kinStr    - Kind String: The sign-in, `link` or `recover`, for the
 *                    screen that announces its outcome.
 *
 * @returns A promise that settles once the popup's sign-in is done, with no
 *          value.
 *
 * @example
 * ```ts
 * popRedFun(popFunVal, redFunVal, 'link') // => Promise<void>
 * ```
 *
*/

const popRedFun = async ( popFunVal : () => Promise< unknown >, redFunVal : () => Promise< unknown >, kinStr : string ) : Promise< void > => { // What: Popup Redirect Function. Why: A blocked popup shouldn't leave the sign-in dead. How: This tries the popup and falls back to the redirect.


	try { await popFunVal(); } // What: Popup Try. Why: The popup keeps the app where it is. How: This runs the sign-in in it.

	catch ( errCatObj ) { // What: Popup Catch. Why: Only a blocked popup falls back. How: This rethrows anything else, and otherwise notes the kind and redirects.


		if ( Reflect.get( Object( errCatObj ), 'code' ) !== 'auth/popup-blocked' ) throw errCatObj; // What: Not Blocked Guard. Why: A closed popup or a refused sign-in is the person's answer, not a blocker. How: This passes it on.



		try { sessionStorage.setItem( RED_KEY_STR, kinStr ); } // What: Note Try. Why: The returning page has to know which sign-in this was. How: This stores its kind.

		catch { await redFunVal(); return; } // What: Note Catch. Why: Storage the browser refuses still lets the sign-in go through. How: This redirects without the note.



		await redFunVal(); // What: Redirect Call. Why: A full-page redirect can't be blocked. How: This leaves for Google's page.


	}


};

// #endregion popRedFun

// #endregion Helpers



// #region Exports

export { outTakFun, popRedFun }; // What: Named Exports. Why: The sign-ins fall back through one helper, and their screens take the outcome through another. How: This exports both.

// #endregion Exports


