


// #region Imports

import { deleteToken  } from 'firebase/messaging'; // What: Delete Token. Why: Turning notifications off retires the phone's token with FCM. How: This deletes it.
import { firGetFun    } from './firebase.ts';      // What: Firebase Get Function. Why: Messaging is created from the app's Firebase app. How: This returns the services.
import { getMessaging } from 'firebase/messaging'; // What: Get Messaging. Why: Tokens come from FCM's Messaging service. How: This returns it for the app.
import { getToken     } from 'firebase/messaging'; // What: Get Token. Why: The phone is reached through its FCM token. How: This asks FCM for it.
import { isSupported  } from 'firebase/messaging'; // What: Is Supported. Why: Some browsers can't receive web pushes. How: This asks FCM whether this one can.

// #endregion Imports



/**
 * messaging.ts = Messaging
 *
 * @summary
 * The browser's side of push notifications (ARCHITECTURE.md Section 11.1):
 * whether this browser can receive them, asking permission, and the token
 * FCM reaches this phone by. A production build asks FCM for the token
 * through the app's one service worker, which shows the pushes, with the web
 * push key Netlify sets in VITE_FIREBASE_VAPID_KEY. There's no FCM emulator,
 * so development stands in a token of the same form, kept on the device
 * until it's deleted, and the Cloud Functions emulator records the pushes
 * sent to it instead of sending them.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DEV_TOK_KEY = 'come-hang-dev-push-token'; // What: Development Token Key. Why: The stand-in token lasts as long as a real one would, until it's deleted. How: This names where development keeps it in local storage.

// #endregion Constants



// #region Helpers

// #region notSupFun

/**
 * notSupFun = Notification Supported Function
 *
 * @summary
 * Resolves with whether this browser can receive pushes: it needs
 * notifications, a service worker, and the Push API, and in production FCM
 * has to agree. A browser on iOS has them only once the app is installed to
 * the home screen.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true when pushes can work here.
 *
 * @example
 * ```ts
 * notSupFun() // => true
 * ```
 *
*/

const notSupFun = async () : Promise< boolean > => { // What: Notification Supported Function. Why: The app offers notifications only where they can work. How: This checks the browser's APIs, then FCM in production.


	const apiAllBoo = 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator; // What: APIs All Boolean. Why: A push needs all three. How: This checks each is present, and its operands are plain presence checks, so the chain stays inline.



	return apiAllBoo && ( import.meta.env.DEV || await isSupported() ); // What: Supported Return. Why: FCM knows its own limits, while development never reaches it. How: This asks FCM only in production, once the APIs are there.


};

// #endregion notSupFun



// #region perAskFun

/**
 * perAskFun = Permission Ask Function
 *
 * @summary
 * Asks the browser for permission to show notifications and resolves with
 * the answer. A browser shows the prompt only while the person's tap is
 * being handled, so this is called from one, and a browser that was already
 * answered resolves with that answer without asking again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with granted, denied, or default.
 *
 * @example
 * ```ts
 * perAskFun() // => 'granted'
 * ```
 *
*/

const perAskFun = () : Promise< NotificationPermission > => Notification.requestPermission(); // What: Permission Ask Function. Why: Notifications need the person's permission. How: This asks the browser.

// #endregion perAskFun



// #region perStaFun

/**
 * perStaFun = Permission State Function
 *
 * @summary
 * Returns the browser's current answer on notifications without asking: one
 * given earlier, or default when the person hasn't answered.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns Granted, denied, or default.
 *
 * @example
 * ```ts
 * perStaFun() // => 'default'
 * ```
 *
*/

const perStaFun = () : NotificationPermission => Notification.permission; // What: Permission State Function. Why: The app checks the answer on each open, since the person can change it in the browser's settings. How: This reads it.

// #endregion perStaFun



// #region tokDelFun

/**
 * tokDelFun = Token Delete Function
 *
 * @summary
 * Retires this phone's token, so FCM refuses pushes to it and the next
 * token is a new one: through FCM in production, and by forgetting the
 * stand-in in development.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once the token is retired, with no value.
 *
 * @example
 * ```ts
 * tokDelFun() // => Promise<void>
 * ```
 *
*/

const tokDelFun = async () : Promise< void > => { // What: Token Delete Function. Why: Turning notifications off shouldn't leave a live token behind. How: This retires it where it came from.


	if ( import.meta.env.DEV ) { // What: Development Branch. Why: Development's token is a stand-in on the device. How: This forgets it.


		localStorage.removeItem( DEV_TOK_KEY ); // What: Stand-In Remove Call. Why: The next token should be a new one, as FCM's would. How: This removes the stand-in.



		return; // What: Development Return. Why: There's no FCM to tell. How: This ends the call.


	}



	await deleteToken( getMessaging( firGetFun().appValObj ) ); // What: FCM Delete Call. Why: FCM stops accepting pushes to the token. How: This deletes it.


};

// #endregion tokDelFun



// #region tokGetFun

/**
 * tokGetFun = Token Get Function
 *
 * @summary
 * Resolves with the token FCM reaches this phone by, which needs the
 * notification permission already granted. In production it asks FCM
 * through the app's service worker once that worker is active, and rejects
 * when the build has no web push key. FCM returns the same token until it
 * rotates one. Development returns its stand-in, making one the first time.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the token.
 *
 * @example
 * ```ts
 * tokGetFun() // => 'dX3k...:APA91b...'
 * ```
 *
*/

const tokGetFun = async () : Promise< string > => { // What: Token Get Function. Why: Cloud Functions push to the phone by its token. How: This asks FCM, or returns development's stand-in.


	if ( import.meta.env.DEV ) { // What: Development Branch. Why: There's no FCM emulator. How: This keeps a stand-in of a real token's form.


		const tokValStr = localStorage.getItem( DEV_TOK_KEY ) ?? `emulator-${ crypto.randomUUID() }`; // What: Token Value String. Why: The stand-in stays the same until it's deleted, like FCM's. How: This reads it, or makes one.

		localStorage.setItem( DEV_TOK_KEY, tokValStr ); // What: Stand-In Set Call. Why: A new stand-in has to last. How: This keeps it.



		return tokValStr; // What: Stand-In Return. Why: The caller stores the token. How: This returns the stand-in.


	}



	const vapKeyStr = import.meta.env.VITE_FIREBASE_VAPID_KEY; // What: VAPID Key String. Why: FCM signs web pushes with the project's key pair, whose public half the browser needs. How: This reads it from the build's environment.


	if ( !vapKeyStr ) throw new Error( 'VITE_FIREBASE_VAPID_KEY is not set for this build.' ); // What: Missing Key Guard. Why: A build without the key can't receive pushes, and should say so. How: This throws a clear error.



	return getToken( getMessaging( firGetFun().appValObj ), { serviceWorkerRegistration : await navigator.serviceWorker.ready, vapidKey : vapKeyStr } ); // What: FCM Token Return. Why: The app's one service worker shows the pushes, so FCM mustn't register a second. How: This asks FCM for the token through the active worker.


};

// #endregion tokGetFun

// #endregion Helpers



// #region Exports

export { notSupFun, perAskFun, perStaFun, tokDelFun, tokGetFun }; // What: Named Exports. Why: Turning notifications on and keeping the token fresh go through these. How: This exports the support check, the permission calls, and the token calls.

// #endregion Exports


