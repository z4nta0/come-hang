


// #region Imports

import { cleanupOutdatedCaches   } from 'workbox-precaching';    // What: Cleanup Outdated Caches. Why: An older version's caches would only take up room. How: This deletes caches an earlier Workbox left.
import { createHandlerBoundToURL } from 'workbox-precaching';    // What: Create Handler Bound To URL. Why: Every address the app answers renders the same page. How: This serves the cached index.html for them.
import { getMessaging            } from 'firebase/messaging/sw'; // What: Get Messaging. Why: FCM delivers pushes to this worker. How: This sets up Messaging's handler, which shows each push.
import { initializeApp           } from 'firebase/app';          // What: Initialize App. Why: Messaging hangs off a Firebase app. How: This creates it from the web config.
import { NavigationRoute         } from 'workbox-routing';       // What: Navigation Route. Why: Opening any of the app's addresses is a page navigation. How: This matches them.
import { precacheAndRoute        } from 'workbox-precaching';    // What: Precache And Route. Why: The app opens without a connection. How: This caches the build's files and serves them from the cache.
import { registerRoute           } from 'workbox-routing';       // What: Register Route. Why: Navigations are served by the app's page. How: This adds the route.


import type { FirebaseOptions } from 'firebase/app'; // What: Firebase Options. Why: The web config has a known shape. How: This types it.

// #endregion Imports



/**
 * service-worker.ts = Service Worker
 *
 * @summary
 * The app's one service worker (ARCHITECTURE.md Section 14), built by
 * vite-plugin-pwa, which writes the build's file list into it. It caches
 * every file the build produced, so the app opens without a connection, and
 * answers every navigation with the app's page, as Netlify does, apart from
 * the legal pages, which are pages of their own. In a production build it
 * also receives FCM's pushes and shows each one, and a tap on one brings the
 * app forward, opening it when it isn't open. The app hands this worker's
 * registration to FCM, so FCM never registers a second worker of its own.
 *
 * Sections:
 *  - Types
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

declare const self : ServiceWorkerGlobalScope; // What: Self. Why: This file runs as a service worker, where self is the worker's global scope. How: This types it so.

// #endregion Types



// #region Module State

const PRO_CON_STR = import.meta.env.VITE_FIREBASE_CONFIG; // What: Production Config String. Why: Only a production build has a project that FCM pushes from. How: This reads the web config Netlify sets, missing in development.

// #endregion Module State



// #region Helpers

// #region appOpeFun

/**
 * appOpeFun = App Open Function
 *
 * @summary
 * Brings the app forward after a tap on a push: focuses a window of the app
 * that's already open, or opens one at its root when none is.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once the app is in front, with no value.
 *
 * @example
 * ```ts
 * appOpeFun() // => Promise<void>
 * ```
 *
*/

const appOpeFun = async () : Promise< void > => { // What: App Open Function. Why: A push is read by opening the app. How: This focuses an open window, or opens one.


	const winCliArr = await self.clients.matchAll( { includeUncontrolled : true, type : 'window' } ); // What: Window Client Array. Why: An open window is reused rather than doubled. How: This lists the app's windows.


	if ( winCliArr.length > 0 ) { await winCliArr[ 0 ].focus(); return; } // What: Open Window Guard. Why: The app is already open. How: This focuses its first window.



	await self.clients.openWindow( '/' ); // What: Window Open Call. Why: The app isn't open. How: This opens it at its root.


};

// #endregion appOpeFun

// #endregion Helpers



// #region Module Init

self.addEventListener( 'notificationclick', ( cliEveObj ) => { // What: Notification Click Listener. Why: FCM's own handler opens only a push's link, and the server has no single address to link, since live and staging differ. How: This closes the notification and brings the app forward.


	cliEveObj.notification.close(); // What: Notification Close Call. Why: A read push shouldn't linger. How: This closes it.

	cliEveObj.waitUntil( appOpeFun() ); // What: Open Wait Call. Why: The browser keeps the worker alive only while it's told to wait. How: This waits for the app to come forward.


} );



cleanupOutdatedCaches(); // What: Cache Cleanup Call. Why: Old caches go once a new version installs. How: This deletes them.

precacheAndRoute( self.__WB_MANIFEST ); // What: Precache Call. Why: The app's files are served without a connection. How: This caches the build's list and serves it.

registerRoute( new NavigationRoute( createHandlerBoundToURL( 'index.html' ), { denylist : [ /^\/(privacy|terms)(\/|$)/ ] } ) ); // What: Navigation Route Call. Why: The app answers at every address it handles, offline too, while the legal pages are their own. How: This serves the cached page for every navigation but theirs.



if ( PRO_CON_STR ) getMessaging( initializeApp( JSON.parse( PRO_CON_STR ) as FirebaseOptions ) ); // What: Messaging Setup Call. Why: FCM's handler has to be listening as the worker starts, to show each push. How: This creates the app and Messaging when the build has a project. // What: Type Assertion Note. Why: JSON.parse returns any. How: The as reads it as a web config.

// #endregion Module Init


