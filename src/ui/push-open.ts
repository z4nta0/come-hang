


// #region Imports

import { useEffect   } from 'react';        // What: Use Effect. Why: The worker's messages are heard while the app is open. How: This listens for them once mounted.
import { useNavigate } from 'react-router'; // What: Use Navigate. Why: A message opens an address inside the app. How: This returns the router's navigate function.

// #endregion Imports



/**
 * push-open.ts = Push Open
 *
 * @summary
 * Follows a tap on a push while the app is already open (ARCHITECTURE.md
 * Section 11.1). The service worker brings the open window forward and
 * sends it the address the push leads to, and the app navigates there
 * inside the router, rather than reloading, so the screen it was on stays
 * one step back. Only an /open/ entry address made of letters, digits,
 * hyphens, and underscores is followed.
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

const OPE_PAT_REG = /^\/open\/[A-Za-z0-9_-]{1,64}\/[A-Za-z0-9_-]{1,64}$/; // What: Open Path Regular Expression. Why: A message names an address inside the app, and nothing else should be navigated to. How: This allows only an /open/ address with a well-formed group and section.

// #endregion Constants



// #region Hooks

// #region usePusOpeFun

/**
 * usePusOpeFun = Use Push Open Function
 *
 * @summary
 * Listens for the service worker's messages while the calling component is
 * mounted, and navigates to the address in each one that names an /open/
 * entry address, adding a history entry. A browser without service workers
 * gets no listener.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * usePusOpeFun() // => void
 * ```
 *
*/

const usePusOpeFun = () : void => { // What: Use Push Open Function. Why: A tapped push should open its group and section in an app already open. How: This follows the worker's messages.


	const navRouFun = useNavigate(); // What: Navigate Router Function. Why: The address opens inside the app. How: This reads the router's navigate.



	useEffect( () => { // What: Message Listen Effect. Why: The worker's messages arrive while the app is open. How: This listens for them and stops on cleanup.


		if ( !( 'serviceWorker' in navigator ) ) return; // What: No Worker Guard. Why: A browser without service workers sends no messages. How: This returns.



		const mesLisFun = ( mesEveObj : MessageEvent ) : void => { // What: Message Listen Function. Why: Each message may name an address. How: This navigates to a well-formed one.


			const patValAny : unknown = Reflect.get( Object( mesEveObj.data ), 'patStr' ); // What: Path Value Any. Why: The message's address is untrusted until checked. How: This reads it, untyped.


			if ( typeof patValAny === 'string' && OPE_PAT_REG.test( patValAny ) ) void navRouFun( patValAny ); // What: Navigate Call. Why: Only an /open/ address should move the app. How: This navigates to it when it's one.


		};


		navigator.serviceWorker.addEventListener( 'message', mesLisFun ); // What: Listen Call. Why: The worker's messages reach the page through its container. How: This adds the listener.



		return () => navigator.serviceWorker.removeEventListener( 'message', mesLisFun ); // What: Listen Cleanup. Why: A listener shouldn't outlive the app. How: This removes it.


	}, [ navRouFun ] ); // What: Effect Dependency Array. Why: The listener navigates with the router's function. How: navRouFun changes only if the router's does.


};

// #endregion usePusOpeFun

// #endregion Hooks



// #region Exports

export { usePusOpeFun }; // What: Named Export. Why: The app root follows the worker's messages. How: This exports the hook.

// #endregion Exports


