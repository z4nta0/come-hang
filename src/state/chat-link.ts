


// #region Imports

import { firGetFun } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: The chat's connection is the Realtime Database's. How: This reaches the database.
import { onValue   } from 'firebase/database';       // What: On Value. Why: The database reports its own connection. How: This listens to it.
import { ref       } from 'firebase/database';       // What: Reference. Why: The connection is read at a path of its own. How: This names the path.

// #endregion Imports



/**
 * chat-link.ts = Chat Link
 *
 * @summary
 * Whether the chat can reach its database (ARCHITECTURE.md Section 14). A
 * device can be online while the chat's connection is stuck, as one Pixel's
 * was, and a message sent then hangs rather than failing. The Realtime
 * Database reports its own connection at `.info/connected`, so this module
 * watches it once something starts the watch, and counts the chat as
 * unreachable only after the connection has been down for LIN_GRA_NUM, so a
 * launch or a brief drop never shows. Until the watch starts, and while the
 * connection is up, the chat counts as reachable.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const LIN_GRA_NUM = 10000; // What: Link Grace Number. Why: The database takes a moment to connect at launch and after a drop, which shouldn't read as a fault. How: This is how long, in milliseconds, the connection has to stay down before the chat counts as unreachable.

// #endregion Constants



// #region Module State

const linLisSet = new Set< () => void >(); // What: Link Listener Set. Why: The banner, the chat, and the outbox follow the connection. How: This holds their listeners.

let graTimNum : number | undefined = undefined; // What: Grace Timer Number. Why: A connection that comes back in time cancels the wait. How: This holds the timer, undefined when none waits.
let linReaBoo = true;                           // What: Link Reachable Boolean. Why: Until the connection is known to be stuck, the chat goes ahead as usual. How: This is true until the grace runs out with the connection down.
let watStaBoo = false;                          // What: Watch Started Boolean. Why: The database is watched once, and only by a device that uses the chat. How: This is true once the watch starts.

// #endregion Module State



// #region Helpers

// #region linSetFun

/**
 * linSetFun = Link Set Function
 *
 * @summary
 * Records whether the chat can reach its database, telling every listener
 * when that changes and nothing when it doesn't.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reaValBoo - Reachable Value Boolean: Whether the chat can reach it.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * linSetFun(false) // => void
 * ```
 *
*/

const linSetFun = ( reaValBoo : boolean ) : void => { // What: Link Set Function. Why: The listeners follow each change. How: This records it and tells them.


	if ( linReaBoo === reaValBoo ) return; // What: Unchanged Guard. Why: A listener is told only of a change. How: This returns.



	linReaBoo = reaValBoo; // What: Reachable Assignment. Why: Readers see the new state. How: This records it.

	linLisSet.forEach( ( onChaFun ) => onChaFun() ); // What: Change Tell Call. Why: The banner, the chat, and the outbox act on it. How: This tells each listener.


};

// #endregion linSetFun



const linNowFun = () : boolean => linReaBoo; // What: Link Now Function. Why: A send checks the connection first. How: This reads whether the chat can reach its database.



// #region linStaFun

/**
 * linStaFun = Link Start Function
 *
 * @summary
 * Starts watching the database's connection, once however often it's
 * called: each time it reports down, a timer waits LIN_GRA_NUM before
 * counting the chat as unreachable, and each time it reports up, the timer
 * stops and the chat counts as reachable again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * linStaFun() // => void
 * ```
 *
*/

const linStaFun = () : void => { // What: Link Start Function. Why: A device using the chat should notice when its connection is stuck. How: This watches the database's connection, once.


	if ( watStaBoo ) return; // What: Started Guard. Why: One watch is enough. How: This returns once it runs.



	watStaBoo = true; // What: Started Set. Why: Later calls do nothing. How: This marks the watch as running.

	onValue( ref( firGetFun().reaDatObj, '.info/connected' ), ( conSnaObj ) => { // What: Connection Listen Call. Why: The database reports each change of its connection. How: This listens for it and acts on each.


		window.clearTimeout( graTimNum ); // What: Timer Clear Call. Why: A new report replaces any wait. How: This stops the timer.


		if ( conSnaObj.val() === true ) { linSetFun( true ); return; } // What: Connected Guard. Why: A connected chat is reachable. How: This records it and returns.



		graTimNum = window.setTimeout( () => linSetFun( false ), LIN_GRA_NUM ); // What: Grace Timer Assignment. Why: A connection down for a moment shouldn't count. How: This counts the chat as unreachable once it's been down for LIN_GRA_NUM.


	} );


};

// #endregion linStaFun



// #region linSubFun

/**
 * linSubFun = Link Subscribe Function
 *
 * @summary
 * Calls the listener each time the chat becomes reachable or unreachable,
 * until the returned function is called, in the shape useSyncExternalStore
 * expects.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onChaFun - On Change Function: Called on each change.
 *
 * @returns The function that stops listening.
 *
 * @example
 * ```ts
 * linSubFun(() => ...) // => () => void
 * ```
 *
*/

const linSubFun = ( onChaFun : () => void ) : () => void => { // What: Link Subscribe Function. Why: Components follow the connection as it changes. How: This adds the listener and returns its removal.


	linLisSet.add( onChaFun ); // What: Listener Add Call. Why: The listener hears each change. How: This keeps it.



	return () => { linLisSet.delete( onChaFun ); }; // What: Stop Return. Why: A listener shouldn't outlive what it updates. How: This returns the function that removes it.


};

// #endregion linSubFun

// #endregion Helpers



// #region Exports

export { linNowFun, linStaFun, linSubFun }; // What: Named Exports. Why: The screens start the watch, check the connection, and follow it. How: This exports the reading, the start, and the subscription.

// #endregion Exports


