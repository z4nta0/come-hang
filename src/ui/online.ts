


// #region Imports

import { linNowFun            } from '../state/chat-link.ts'; // What: Link Now Function. Why: A chat post is paused while the chat can't reach its database. How: This reads the chat's connection.
import { linSubFun            } from '../state/chat-link.ts'; // What: Link Subscribe Function. Why: Components follow the chat's connection as it changes. How: This listens for it.
import { onlNowFun            } from '../platform/online.ts'; // What: Online Now Function. Why: A change is paused while the device is offline. How: This reads the connection.
import { onlSubFun            } from '../platform/online.ts'; // What: Online Subscribe Function. Why: Components follow the connection as it changes. How: This listens for it.
import { useSyncExternalStore } from 'react';                 // What: Use Sync External Store. Why: The connection lives outside React. How: This reads it and rerenders when it changes.

// #endregion Imports



/**
 * online.ts = Offline Handling
 *
 * @summary
 * How the screens treat a device that's offline (ARCHITECTURE.md Section
 * 14): a change that needs the server is paused, its handler announcing in
 * the screen's own alert that it has to wait, and a component follows the
 * connection through a hook. Chat messages are the exception, waiting on the
 * device to send by themselves. The chat's own connection is followed the
 * same way, since a device can be online while the chat can't reach its
 * database: a chat post is paused then, and messages wait as they do offline.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const LIN_ACT_STR = "The chat can't connect right now, so this has to wait until it's back."; // What: Link Action String. Why: A chat post pressed while the chat can't connect should say why it didn't happen. How: This is the message a paused post announces.
const OFF_ACT_STR = "You're offline, so this has to wait until you're back online.";          // What: Offline Action String. Why: A change pressed while offline should say why it didn't happen. How: This is the message every paused change announces.

// #endregion Constants



// #region Helpers

// #region linGuaFun

/**
 * linGuaFun = Link Guard Function
 *
 * @summary
 * Pauses a chat post while the chat can't reach its database: announces
 * LIN_ACT_STR through the given alert setter and returns true, so the handler
 * returns before starting it. Returns false while the chat is reachable,
 * announcing nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param setErrFun - Set Error Function: The screen's alert setter.
 *
 * @returns Whether the post has to wait.
 *
 * @example
 * ```ts
 * linGuaFun(setErrMesStr) // => false
 * ```
 *
*/

const linGuaFun = ( setErrFun : ( errMesStr : string ) => void ) : boolean => { // What: Link Guard Function. Why: A chat post sent while the chat can't connect would hang. How: This announces the pause and reports it.


	if ( linNowFun() ) return false; // What: Reachable Guard. Why: A post goes ahead while the chat connects. How: This returns false.



	setErrFun( LIN_ACT_STR ); // What: Pause Announce Call. Why: The member should know why nothing happened. How: This shows the message in the screen's alert.



	return true; // What: Paused Return. Why: The handler returns before the post. How: This reports the pause.


};

// #endregion linGuaFun



// #region offGuaFun

/**
 * offGuaFun = Offline Guard Function
 *
 * @summary
 * Pauses a change while the device is offline: announces OFF_ACT_STR
 * through the given alert setter and returns true, so the handler returns
 * before starting it. Returns false while online, announcing nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param setErrFun - Set Error Function: The screen's alert setter.
 *
 * @returns Whether the change has to wait.
 *
 * @example
 * ```ts
 * offGuaFun(setErrMesStr) // => false
 * ```
 *
*/

const offGuaFun = ( setErrFun : ( errMesStr : string ) => void ) : boolean => { // What: Offline Guard Function. Why: A change that needs the server shouldn't hang or fail vaguely offline. How: This announces the pause and reports it.


	if ( onlNowFun() ) return false; // What: Online Guard. Why: An online device goes ahead. How: This returns false.



	setErrFun( OFF_ACT_STR ); // What: Pause Announce Call. Why: The member should know why nothing happened. How: This shows the message in the screen's alert.



	return true; // What: Paused Return. Why: The handler returns before the change. How: This reports the pause.


};

// #endregion offGuaFun

// #endregion Helpers



// #region Hooks

// #region useLinBooFun

/**
 * useLinBooFun = Use Link Boolean Function
 *
 * @summary
 * Returns whether the chat can reach its database, rerendering the component
 * each time that changes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns Whether the chat can reach its database.
 *
 * @example
 * ```ts
 * useLinBooFun() // => true
 * ```
 *
*/

const useLinBooFun = () : boolean => useSyncExternalStore( linSubFun, linNowFun ); // What: Use Link Boolean Function. Why: The banner and the outbox change with the chat's connection. How: This reads it and rerenders when it changes.

// #endregion useLinBooFun



// #region useOnlBooFun

/**
 * useOnlBooFun = Use Online Boolean Function
 *
 * @summary
 * Returns whether the device is online, rerendering the component each time
 * that changes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns Whether the device is online.
 *
 * @example
 * ```ts
 * useOnlBooFun() // => true
 * ```
 *
*/

const useOnlBooFun = () : boolean => useSyncExternalStore( onlSubFun, onlNowFun ); // What: Use Online Boolean Function. Why: The banner and the chat change with the connection. How: This reads it and rerenders when it changes.

// #endregion useOnlBooFun

// #endregion Hooks



// #region Exports

export { linGuaFun, OFF_ACT_STR, offGuaFun, useLinBooFun, useOnlBooFun }; // What: Named Exports. Why: The screens pause changes offline or while the chat can't connect, and follow both connections. How: This exports the offline message, the guards, and the hooks.

// #endregion Exports


