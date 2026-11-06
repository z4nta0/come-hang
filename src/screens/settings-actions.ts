


// #region Imports

import { useRef   } from 'react'; // What: Use Reference. Why: A change that takes away its button owes focus to what replaces it. How: This holds the element owed it.
import { useState } from 'react'; // What: Use State. Why: Which change is out and the messages change while a part is open. How: This holds each.

// #endregion Imports



/**
 * settings-actions.ts = Settings Actions
 *
 * @summary
 * The hook a Settings section runs its changes through, the group's own and
 * the phone's and account's parts alike, which it hands its result: one
 * change at a time, its button
 * saying it's working, a failure announced through the part's alert, and a
 * change that takes away its button owing focus to what replaces it. The
 * section draws one status and alert from what it returns, and each part
 * moves the owed focus once its change shows.
 *
 * Sections:
 *  - Constants
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const FAI_SET_STR = "That didn't go through. Try again."; // What: Failure Settings String. Why: A change that fails for a reason no map names still has to be told. How: This is the message then.

// #endregion Constants



// #region Hooks

type SarRetTyp = { actKinStr : string, actRunFun : ( actKinVal : string, actStaFun : () => Promise< unknown >, errMapObj? : Record< string, string > ) => Promise< boolean >, chaRunFun : ( actKinVal : string, tarRefObj : React.RefObject< HTMLElement | null >, actStaFun : () => Promise< unknown >, donMesStr : string, errMapObj? : Record< string, string > ) => Promise< void >, errMesStr : string, focChaRef : React.RefObject< React.RefObject< HTMLElement | null > | null >, setErrMesStr : ( mesValStr : string ) => void, setStaMesStr : ( mesValStr : string ) => void, staMesStr : string }; // What: Settings Actions Return Type. Why: A part reads which change is out and its messages, runs its changes, and moves owed focus. How: This types useSetActFun's return.

// #region useSetActFun

/**
 * useSetActFun = Use Settings Actions Function
 *
 * @summary
 * Returns what a part of Settings needs to run its changes. actRunFun runs
 * one change: it ignores it while another is out, marks which change is out
 * in actKinStr so its button can say so, clears the messages, then awaits
 * it; a failure is logged and put in errMesStr, with the given map's message
 * for its code, or else asking to try again; it resolves true when the
 * change landed, leaving the caller to say so. chaRunFun runs a change that
 * takes away the button pressed: it owes focus the given element through
 * focChaRef, which the part moves once the screen shows the change, clears
 * the debt should the change fail, and puts the given message in staMesStr
 * once it lands. The setters let a part announce what a change meant.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns Which change is out, both runners, the messages and their
 *          setters, and the focus owed.
 *
 * @example
 * ```ts
 * useSetActFun() // => { actKinStr, actRunFun, chaRunFun, ... }
 * ```
 *
*/

const useSetActFun = () : SarRetTyp => { // What: Use Settings Actions Function. Why: Every part of Settings runs its changes the same way. How: This holds which change is out and the messages, and returns the runners.


	const focChaRef = useRef< React.RefObject< HTMLElement | null > | null >( null ); // What: Focus Change Reference. Why: A change's buttons give way only once the screen shows it, which can come before or after the write settles. How: This holds the element owed focus, null when none is.

	const [ actKinStr, setActKinStr ] = useState( '' ); // What: Action Kind String And Setter. Why: One change at a time keeps a double tap from acting twice, and its button says what it's doing. How: This holds the change that's out, empty when none is.
	const [ errMesStr, setErrMesStr ] = useState( '' ); // What: Error Message String And Setter. Why: A failed change is announced. How: This holds the alert's text, empty when there's none.
	const [ staMesStr, setStaMesStr ] = useState( '' ); // What: Status Message String And Setter. Why: A change that lands is announced. How: This holds the status's text.



	// #region actRunFun

	/**
	 * actRunFun = Action Run Function
	 *
	 * @summary
	 * Runs one change: ignores it while another is out, marks which change
	 * is out so its button can say so, clears the messages, then awaits it.
	 * A failure is logged and announced through the alert, with the given
	 * map's message for its code, or else asking to try again.
	 * Resolves true when the change landed, leaving the caller to say so,
	 * since a leave or deletion is announced by the screen host.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param actKinVal - Action Kind Value: Which change it is, such as save
	 *                    or leave.
	 * @param actStaFun - Action Start Function: Starts the change.
	 * @param errMapObj - Error Map Object: The message to announce for each
	 *                    error code it names, none by default.
	 *
	 * @returns A promise that resolves with whether the change landed.
	 *
	 * @example
	 * ```ts
	 * actRunFun('save', savStaFun) // => true
	 * ```
	 *
	*/

	const actRunFun = async ( actKinVal : string, actStaFun : () => Promise< unknown >, errMapObj : Record< string, string > = {} ) : Promise< boolean > => { // What: Action Run Function. Why: Every change runs one at a time and reports a failure the same way. How: This marks it out, runs it, and announces a failure.


		if ( actKinStr !== '' ) return false; // What: Busy Guard. Why: A change while another is out could act twice. How: This ignores it.



		setActKinStr( actKinVal ); // What: Busy Set Call. Why: The next change waits, and this one's button says what it's doing. How: This marks it as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next status should be announced afresh. How: This empties the status.



		try { await actStaFun(); } // What: Change Try. Why: The change has to happen. How: This runs it.

		catch ( errCatObj ) { // What: Change Catch. Why: A failed change has to be told. How: This logs it, frees the buttons, and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setActKinStr( '' ); // What: Busy Clear Call. Why: The member can try again. How: This marks the change as done.

			const errCodAny : unknown = Reflect.get( Object( errCatObj ), 'code' ); // What: Error Code Any. Why: Firebase names each failure by a code, which picks its message. How: This reads it, untyped.


			setErrMesStr( typeof errCodAny === 'string' && Object.hasOwn( errMapObj, errCodAny ) ? errMapObj[ errCodAny ] : FAI_SET_STR ); // What: Failure Announce Call. Why: The member has to learn it failed, and why where the map says. How: This puts the map's message, or the general one, in the alert.



			return false;


		}



		setActKinStr( '' ); // What: Busy Clear Call. Why: The next change can run. How: This marks the change as done.



		return true;


	};

	// #endregion actRunFun



	// #region chaRunFun

	/**
	 * chaRunFun = Change Run Function
	 *
	 * @summary
	 * Runs a change that takes away the button pressed, such as an offer or a
	 * Google link, as one change: it owes focus the given element, which takes
	 * it once the screen shows the change, then runs the change, clearing the
	 * debt should it fail, and announces the given message once it lands. A
	 * failure whose code the given map names is announced with its message.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param actKinVal - Action Kind Value: Which change it is, such as offer
	 *                    or accept.
	 * @param tarRefObj - Target Reference Object: The element owed focus once
	 *                    the change shows.
	 * @param actStaFun - Action Start Function: Starts the change.
	 * @param donMesStr - Done Message String: What to announce once it lands.
	 * @param errMapObj - Error Map Object: The message to announce for each
	 *                    error code it names, none by default.
	 *
	 * @returns A promise that settles once the change is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * chaRunFun('withdraw', offButRef, witStaFun, ...) // => Promise<void>
	 * ```
	 *
	*/

	const chaRunFun = async ( actKinVal : string, tarRefObj : React.RefObject< HTMLElement | null >, actStaFun : () => Promise< unknown >, donMesStr : string, errMapObj : Record< string, string > = {} ) : Promise< void > => { // What: Change Run Function. Why: A change that takes away its button has to move focus once the screen shows it. How: This owes focus, runs the change, and announces it.


		if ( actKinStr !== '' ) return; // What: Busy Guard. Why: A change while another is out could act twice, and mustn't owe focus. How: This ignores it.



		focChaRef.current = tarRefObj; // What: Focus Owed Assignment. Why: The screen can show the change before the write settles. How: This owes focus before it starts.


		const lanValBoo = await actRunFun( actKinVal, actStaFun, errMapObj ); // What: Landed Value Boolean. Why: A failed change keeps its buttons. How: This runs it as one change.


		if ( !lanValBoo ) { focChaRef.current = null; return; } // What: Failed Guard. Why: The button pressed still shows, so no focus is owed. How: This clears the debt and returns.



		setStaMesStr( donMesStr ); // What: Status Set Call. Why: The member hears the change landed. How: This announces it.


	};

	// #endregion chaRunFun



	return { actKinStr, actRunFun, chaRunFun, errMesStr, focChaRef, setErrMesStr, setStaMesStr, staMesStr }; // What: Actions Return. Why: The part draws its buttons and messages and runs its changes. How: This returns them all.


};

// #endregion useSetActFun

// #endregion Hooks



// #region Exports

export { type SarRetTyp, useSetActFun }; // What: Named Exports. Why: Every part of Settings runs its changes through the hook, and the phone's and account's parts take its result. How: This exports the hook and its return's type.

// #endregion Exports


