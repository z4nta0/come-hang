


// #region Imports

import { useCallback } from 'react';        // What: Use Callback. Why: An effect that opens a screen depends on the opener, which shouldn't change on every render. How: This keeps the same function between renders.
import { useLocation } from 'react-router'; // What: Use Location. Why: The open screen is recorded in the history entry's state. How: This reads the current entry.
import { useNavigate } from 'react-router'; // What: Use Navigate. Why: Moving between screens adds or replaces history entries. How: This returns the router's navigate function.

// #endregion Imports



/**
 * screen.ts = Screen
 *
 * @summary
 * The app's screens as history entries rather than paths (ARCHITECTURE.md
 * Section 14): the address stays the root while each entry's state records
 * which screen it shows, so the back gesture walks back through screens. A
 * state read back is untrusted, since an entry can outlive the version of the
 * app that wrote it, so anything that isn't a well-formed screen reads as
 * none, the app's default screen.
 *
 * Sections:
 *  - Types
 *  - Helpers
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type ScrStaTyp = { // What: Screen State Type. Why: Each history entry records the screen it shows. How: This types the state an entry holds.


	creBoo? : boolean,            // What: Created Boolean. Why: A group just created takes focus on its heading. How: This is true on the entry its creation opens.
	groStr? : string,             // What: Group String. Why: A group's screen shows one group. How: This is the group's ID.
	scrStr  : 'create' | 'group'  // What: Screen String. Why: The entry names its screen. How: This is the screen's name.


};

// #endregion Types



// #region Helpers

// #region isaScrFun

/**
 * isaScrFun = Is-A Screen Function
 *
 * @summary
 * Checks a history entry's state is a screen this version knows: an object
 * naming the create or group screen, whose group, when it names one, is a
 * string, and whose created flag, when it has one, is a boolean.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param staValAny - State Value Any: The entry's state, untyped.
 *
 * @returns Whether the state is a well-formed screen.
 *
 * @example
 * ```ts
 * isaScrFun({ scrStr: 'create' }) // => true
 * ```
 *
*/

const isaScrFun = ( staValAny : unknown ) : staValAny is ScrStaTyp => { // What: Is-A Screen Function. Why: A history entry's state can come from an older version of the app. How: This checks each field the screen state holds.


	if ( typeof staValAny !== 'object' || staValAny === null ) return false; // What: Object Guard. Why: Only an object can hold a screen. How: This refuses anything else.



	const creValAny : unknown = Reflect.get( staValAny, 'creBoo' ); // What: Created Value Any. Why: The created flag is optional. How: This reads it, untyped.
	const groValAny : unknown = Reflect.get( staValAny, 'groStr' ); // What: Group Value Any. Why: The group is optional. How: This reads it, untyped.
	const scrValAny : unknown = Reflect.get( staValAny, 'scrStr' ); // What: Screen Value Any. Why: The screen's name decides what shows. How: This reads it, untyped.

	const creOkaBoo = creValAny === undefined || typeof creValAny === 'boolean'; // What: Created Okay Boolean. Why: A flag of any other type isn't one this version wrote. How: This is true when it's absent or a boolean.
	const groOkaBoo = groValAny === undefined || typeof groValAny === 'string';  // What: Group Okay Boolean. Why: A group of any other type isn't one this version wrote. How: This is true when it's absent or a string.
	const scrOkaBoo = scrValAny === 'create' || scrValAny === 'group';           // What: Screen Okay Boolean. Why: Only a known screen can be shown. How: This is true for the create or group screen.



	return creOkaBoo && groOkaBoo && scrOkaBoo; // What: Check Return. Why: The state is a screen only when every field is. How: This combines the three checks.


};

// #endregion isaScrFun

// #endregion Helpers



// #region Hooks

// #region useScrStaFun

/**
 * useScrStaFun = Use Screen State Function
 *
 * @summary
 * Reads the screen the current history entry records, or null when it
 * records none, or anything that isn't a known screen.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The entry's screen state, or null.
 *
 * @example
 * ```ts
 * useScrStaFun() // => { groStr: 'Xk3...', scrStr: 'group' }
 * ```
 *
*/

const useScrStaFun = () : ScrStaTyp | null => { // What: Use Screen State Function. Why: The screen host shows whichever screen the entry records. How: This reads and checks the entry's state.


	const locStaAny : unknown = useLocation().state; // What: Location State Any. Why: The entry's state is where the screen is recorded. How: This reads it, untyped.



	return isaScrFun( locStaAny ) ? locStaAny : null; // What: Screen Return. Why: Only a known screen should be shown. How: This returns the state when it's one, or null.


};

// #endregion useScrStaFun



// #region useScrOpeFun

/**
 * useScrOpeFun = Use Screen Open Function
 *
 * @summary
 * Returns the function that opens a screen: it adds a history entry at the
 * root recording the screen, or replaces the current entry when asked, such
 * as after a form whose screen shouldn't be returned to.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The function that opens a screen.
 *
 * @example
 * ```ts
 * useScrOpeFun()({ scrStr: 'create' }) // => void
 * ```
 *
*/

const useScrOpeFun = () : ( ( scrStaObj : ScrStaTyp, repValBoo? : boolean ) => void ) => { // What: Use Screen Open Function. Why: Every move between screens goes through history the same way. How: This wraps the router's navigate.


	const navRouFun = useNavigate(); // What: Navigate Router Function. Why: A screen opens through a history entry. How: This reads the router's navigate.



	return useCallback( ( scrStaObj : ScrStaTyp, repValBoo = false ) => void navRouFun( '/', { replace : repValBoo, state : scrStaObj } ), [ navRouFun ] ); // What: Screen Open Return. Why: The address stays the root while the entry records the screen. How: This navigates to the root with the screen as its state, replacing the entry when asked, as one function for as long as the router's navigate stays the same, so an effect can depend on it.


};

// #endregion useScrOpeFun



// #region useScrBacFun

/**
 * useScrBacFun = Use Screen Back Function
 *
 * @summary
 * Returns the function a screen's back button runs: it steps back through
 * history when the app added the current entry, and otherwise, on an entry
 * the visit opened with, replaces it with the default screen, so back never
 * leaves the app.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The function that goes back a screen.
 *
 * @example
 * ```ts
 * useScrBacFun()() // => void
 * ```
 *
*/

const useScrBacFun = () : ( () => void ) => { // What: Use Screen Back Function. Why: A back button should match the back gesture without leaving the app. How: This steps back, or opens the default screen on the visit's first entry.


	const locKeyStr = useLocation().key; // What: Location Key String. Why: The visit's first entry has the default key. How: This reads the current entry's key.
	const navRouFun = useNavigate();     // What: Navigate Router Function. Why: Going back is a navigation. How: This reads the router's navigate.



	return () => void ( locKeyStr === 'default' ? navRouFun( '/', { replace : true } ) : navRouFun( -1 ) ); // What: Back Return. Why: Stepping back from the first entry would leave the app. How: This replaces the first entry with the bare root, and otherwise steps back.


};

// #endregion useScrBacFun

// #endregion Hooks



// #region Exports

export { type ScrStaTyp, useScrBacFun, useScrOpeFun, useScrStaFun }; // What: Named Exports. Why: The screens read and move between screens through these. How: This exports the hooks and the state's type.

// #endregion Exports


