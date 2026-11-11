


// #region Imports

import { TAR_LIF_NUM } from '../core/push-target.ts';           // What: Target Lifetime Number. Why: Only a fresh address is followed. How: This is how long one stays fresh.
import { tarTakFun   } from '../platform/push-target-store.ts'; // What: Target Take Function. Why: An app a tapped push launched finds the push's address there. How: This takes it, deleting it.
import { useEffect   } from 'react';                            // What: Use Effect. Why: The worker's messages are heard while the app is open, and a launch's address is read once. How: This runs each once mounted.
import { useNavigate } from 'react-router';                     // What: Use Navigate. Why: A message, or an address left for a launch, opens an address inside the app. How: This returns the router's navigate function.

// #endregion Imports



/**
 * push-open.ts = Push Open
 *
 * @summary
 * Follows a tap on a push while the app is already open (ARCHITECTURE.md
 * Section 11.1). The service worker brings the open window forward and
 * sends it the address the push leads to, and the app navigates there
 * inside the router, rather than reloading, so the screen it was on stays
 * one step back. A tap that launches the app leaves its address in the
 * target database as well, since an installed app on an iPad started at its
 * root rather than the address, and the app follows one under a minute old
 * as it starts. Only an /open/ entry address made of letters, digits,
 * hyphens, and underscores is followed.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const OPE_PAT_REG = /^\/open\/[A-Za-z0-9_-]{1,64}\/[A-Za-z0-9_-]{1,64}$/; // What: Open Path Regular Expression. Why: A message names an address inside the app, and nothing else should be navigated to. How: This allows only an /open/ address with a well-formed group and section.

// #endregion Constants



// #region Module State

let tarReaBoo = false; // What: Target Read Boolean. Why: A launch leaves one address, read once however often the app's root mounts, as development's strict mode mounts it twice. How: This is true once the read has started.

// #endregion Module State



// #region Hooks

// #region usePusOpeFun

/**
 * usePusOpeFun = Use Push Open Function
 *
 * @summary
 * Listens for the service worker's messages while the calling component is
 * mounted, and navigates to the address in each one that names an /open/
 * entry address, adding a history entry. As it mounts, it also takes the
 * address a tap that launched the app left in the target database, deleting
 * it, and navigates there in place of the current entry when it's an /open/
 * address under TAR_LIF_NUM old, once per page however often it mounts. A
 * browser without service workers gets no listener, and one without the
 * database reads nothing.
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



	useEffect( () => { // What: Launch Target Effect. Why: A tap that launched the app may have started it at its root, as on an iPad, leaving the push's address behind. How: This takes the address the worker left and follows a fresh one, once.


		if ( tarReaBoo || !( 'indexedDB' in window ) ) return; // What: Read Once Guard. Why: A second read could race the first's navigation, and a browser without IndexedDB has no address left in it. How: This returns once a read has started, or without IndexedDB.



		tarReaBoo = true; // What: Read Started Set. Why: The address is read once per page. How: This marks the read as started.



		void ( async () => { // What: Target Read Call. Why: The database is read asynchronously. How: This takes the address and follows a fresh, well-formed one.


			const tarRecAny = await tarTakFun();                                      // What: Target Record Any. Why: The entry is untrusted until checked. How: This takes it, undefined when none was left.
			const patValAny : unknown = Reflect.get( Object( tarRecAny ), 'patStr' ); // What: Path Value Any. Why: The entry names the address. How: This reads it, untyped.
			const timValAny : unknown = Reflect.get( Object( tarRecAny ), 'timNum' ); // What: Time Value Any. Why: Only a fresh address is followed. How: This reads when it was left, untyped.

			const freTarBoo = typeof timValAny === 'number' && Date.now() - timValAny < TAR_LIF_NUM; // What: Fresh Target Boolean. Why: A tap long ago shouldn't move an app opened later. How: This is true for an address left within the lifetime.


			if ( freTarBoo && typeof patValAny === 'string' && OPE_PAT_REG.test( patValAny ) ) void navRouFun( patValAny, { replace : true } ); // What: Navigate Call. Why: The launch opens where the tapped push leads, without a step back to the root. How: This replaces the entry with the address.


		} )().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Target Failure Handler. Why: An unreadable entry leaves the app where it started, but the failure stays visible to someone debugging. How: This logs it.


	}, [ navRouFun ] ); // What: Effect Dependency Array. Why: The address opens with the router's function. How: navRouFun changes only if the router's does.


};

// #endregion usePusOpeFun

// #endregion Hooks



// #region Exports

export { usePusOpeFun }; // What: Named Export. Why: The app root follows the worker's messages. How: This exports the hook.

// #endregion Exports


