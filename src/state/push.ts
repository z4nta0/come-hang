


// #region Imports

import { deleteDoc       } from 'firebase/firestore';       // What: Delete Doc. Why: Turning notifications off removes the stored token. How: This deletes it.
import { doc             } from 'firebase/firestore';       // What: Doc. Why: The token has one fixed document. How: This builds its reference.
import { firGetFun       } from '../platform/firebase.ts';  // What: Firebase Get Function. Why: The token is stored in Firestore. How: This returns the services.
import { getDoc          } from 'firebase/firestore';       // What: Get Doc. Why: A refresh compares with what's stored. How: This reads it.
import { ideEnsFun       } from './identity.ts';            // What: Identity Ensure Function. Why: The token is stored under the identity's account. How: This reads the identity.
import { notSupFun       } from '../platform/messaging.ts'; // What: Notification Supported Function. Why: Notifications are offered only where they work. How: This checks the browser.
import { perAskFun       } from '../platform/messaging.ts'; // What: Permission Ask Function. Why: Turning notifications on asks the person. How: This asks the browser.
import { perStaFun       } from '../platform/messaging.ts'; // What: Permission State Function. Why: A refresh checks the person still allows them. How: This reads the answer.
import { serverTimestamp } from 'firebase/firestore';       // What: Server Timestamp. Why: The rules accept only the server's time for a refresh. How: This stamps it.
import { setDoc          } from 'firebase/firestore';       // What: Set Doc. Why: The token is stored whole. How: This writes it.
import { Timestamp       } from 'firebase/firestore';       // What: Timestamp. Why: The token's expiry is a timestamp. How: This builds it.
import { tokDelFun       } from '../platform/messaging.ts'; // What: Token Delete Function. Why: Turning notifications off retires the token. How: This deletes it.
import { tokGetFun       } from '../platform/messaging.ts'; // What: Token Get Function. Why: The phone is reached by its token. How: This gets it.


import type { DocumentReference } from 'firebase/firestore'; // What: Document Reference. Why: The token's reference is built in one place. How: This types it.

// #endregion Imports



/**
 * push.ts = Push
 *
 * @summary
 * Push notifications for this identity's one phone (ARCHITECTURE.md Section
 * 11.1). Turning them on, from the person's tap, asks the browser's
 * permission and stores the phone's token, with an expiry 60 days out, and
 * turning them off deletes it, retires it, and forgets the choice. The
 * choice is kept on the device, so each time the app opens it refreshes a
 * token that's on, at most once a day or as soon as the token changes, and
 * restores one the server dropped, while one turned off stays off. When the
 * person has withdrawn the permission in the browser's settings, the next
 * open deletes the token and turns notifications off.
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

const DAY_MIL_NUM = 86400000;                 // What: Day Milliseconds Number. Why: The token is refreshed at most once a day. How: This is one day in milliseconds.
const PUS_ENA_KEY = 'come-hang-push-enabled'; // What: Push Enabled Key. Why: Whether notifications are on is the device's choice, kept apart from a token the server may drop. How: This names where local storage keeps it.
const TOK_LIF_NUM = 60 * DAY_MIL_NUM;         // What: Token Lifetime Number. Why: A token nobody refreshed for 60 days is presumed dead, as Firebase advises. How: This is the expiry's distance in milliseconds.

// #endregion Constants



// #region Helpers

const tokRefFun = async () : Promise< DocumentReference > => doc( firGetFun().fstDatObj, `accounts/${ ( await ideEnsFun() ).uidValStr }/pushToken/current` ); // What: Token Reference Function. Why: Every call reaches the same document. How: This names the identity's token document.



const tokSavFun = async ( tokValStr : string ) : Promise< void > => setDoc( await tokRefFun(), { expireAt : Timestamp.fromMillis( Date.now() + TOK_LIF_NUM ), token : tokValStr, updatedAt : serverTimestamp() } ); // What: Token Save Function. Why: The rules accept the token with the server's time and an expiry 50 to 70 days out. How: This writes it with an expiry 60 days out by the device's clock.



// #region pusActFun

/**
 * pusActFun = Push Active Function
 *
 * @summary
 * Returns whether notifications are on for this phone: turned on here, and
 * still allowed by the browser.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns True when notifications are on.
 *
 * @example
 * ```ts
 * pusActFun() // => true
 * ```
 *
*/

const pusActFun = () : boolean => { // What: Push Active Function. Why: A setting shows whether notifications are on. How: This needs the device's choice and the browser's permission.


	const choSetBoo = localStorage.getItem( PUS_ENA_KEY ) !== null; // What: Choice Set Boolean. Why: Notifications are on only once turned on here. How: This checks the device's choice is kept.

	const pusActBoo = choSetBoo && 'Notification' in window && perStaFun() === 'granted'; // What: Push Active Boolean. Why: A choice the browser no longer allows isn't on. How: This adds the permission, read only where the browser has notifications, so the chain stays inline.



	return pusActBoo; // What: Active Return. Why: The caller shows the state. How: This returns it.


};

// #endregion pusActFun



// #region pusDisFun

/**
 * pusDisFun = Push Disable Function
 *
 * @summary
 * Turns notifications off for this phone: deletes the stored token, so no
 * more pushes are sent, retires the token itself, and forgets the choice, so
 * a later open doesn't turn them back on.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once notifications are off, with no value.
 *
 * @example
 * ```ts
 * pusDisFun() // => Promise<void>
 * ```
 *
*/

const pusDisFun = async () : Promise< void > => { // What: Push Disable Function. Why: The person decides whether they're notified. How: This deletes the token, retires it, and forgets the choice.


	localStorage.removeItem( PUS_ENA_KEY ); // What: Choice Remove Call. Why: A later open mustn't restore the token. How: This forgets the choice first.

	await deleteDoc( await tokRefFun() ); // What: Token Delete Call. Why: The server sends nothing without a token. How: This deletes the stored one.

	await tokDelFun(); // What: Token Retire Call. Why: A retired token can't be pushed to even if a copy lingers. How: This retires it.


};

// #endregion pusDisFun



// #region pusEnaFun

/**
 * pusEnaFun = Push Enable Function
 *
 * @summary
 * Turns notifications on for this phone, called from the person's tap,
 * since a browser asks for permission only then. Resolves with unsupported
 * where pushes can't work, which on iOS means the app isn't installed to the
 * home screen yet. Otherwise asks the browser, and once permission is
 * granted stores the phone's token and remembers the choice. Resolves with
 * the browser's answer.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with granted, denied, default, or
 *          unsupported.
 *
 * @example
 * ```ts
 * pusEnaFun() // => 'granted'
 * ```
 *
*/

const pusEnaFun = async () : Promise< NotificationPermission | 'unsupported' > => { // What: Push Enable Function. Why: Members choose to be told what happens while they're away (Section 11.1). How: This asks permission, then stores the token.


	if ( !await notSupFun() ) return 'unsupported'; // What: Unsupported Guard. Why: Asking where pushes can't work would only confuse. How: This resolves unsupported.



	const perValStr = await perAskFun(); // What: Permission Value String. Why: Pushes need the person's permission. How: This asks for it.


	if ( perValStr !== 'granted' ) return perValStr; // What: Refused Guard. Why: Without permission there's nothing to store. How: This resolves with the browser's answer.



	await tokSavFun( await tokGetFun() ); // What: Token Save Call. Why: The server pushes to the stored token. How: This stores the phone's token.

	localStorage.setItem( PUS_ENA_KEY, 'true' ); // What: Choice Set Call. Why: Later opens keep the token fresh. How: This remembers the choice once the token is stored.



	return perValStr; // What: Granted Return. Why: The caller learns notifications are on. How: This resolves granted.


};

// #endregion pusEnaFun



// #region pusRefFun

/**
 * pusRefFun = Push Refresh Function
 *
 * @summary
 * Keeps this phone's token current as the app opens, when notifications are
 * on here. Rewrites the token when it's missing from the server, has
 * changed, or was last refreshed a day ago or more, moving its expiry 60
 * days out. When the browser no longer allows notifications, deletes the
 * token and turns them off instead. Resolves with whether it rewrote the
 * token.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true when the token was rewritten.
 *
 * @example
 * ```ts
 * pusRefFun() // => false
 * ```
 *
*/

const pusRefFun = async () : Promise< boolean > => { // What: Push Refresh Function. Why: A token left unrefreshed expires in 60 days, and FCM may rotate it, so each open checks it, with few writes. How: This rewrites it when it's gone, changed, or a day old.


	if ( localStorage.getItem( PUS_ENA_KEY ) === null ) return false; // What: Turned Off Guard. Why: A phone with notifications off keeps no token. How: This resolves false.



	if ( !pusActFun() ) { // What: Permission Withdrawn Block. Why: Pushes the browser won't show are wasted, and the setting should read off. How: This turns notifications off.


		localStorage.removeItem( PUS_ENA_KEY ); // What: Choice Remove Call. Why: The person withdrew the permission. How: This forgets the choice.

		await deleteDoc( await tokRefFun() ); // What: Token Delete Call. Why: The server should stop pushing. How: This deletes the stored token.



		return false; // What: Withdrawn Return. Why: Nothing was rewritten. How: This resolves false.


	}



	const tokValStr = await tokGetFun();                                     // What: Token Value String. Why: FCM may have rotated the token. How: This reads the current one.
	const tokSnaObj = await getDoc( await tokRefFun() );                     // What: Token Snapshot Object. Why: A refresh compares with what's stored. How: This reads it.
	const updTimObj = tokSnaObj.get( 'updatedAt' ) as Timestamp | undefined; // What: Updated Time Object. Why: A token refreshed in the last day needs no write. How: This reads the last refresh, undefined when the token is gone. // What: Type Assertion Note. Why: The rules store the refresh time as a timestamp. How: The as reads it as one, or missing.

	const samTokBoo = tokSnaObj.get( 'token' ) === tokValStr; // What: Same Token Boolean. Why: A changed token is written at once. How: This compares the stored token with the current one.

	const freTokBoo = samTokBoo && updTimObj !== undefined && Date.now() - updTimObj.toMillis() < DAY_MIL_NUM; // What: Fresh Token Boolean. Why: An unchanged token refreshed in the last day needs no write. How: This adds the refresh's age, read only once a refresh exists, so the chain stays inline.


	if ( freTokBoo ) return false; // What: Fresh Guard. Why: Writes stay at one a day. How: This resolves false without writing.



	await tokSavFun( tokValStr ); // What: Token Save Call. Why: The token is missing, changed, or due. How: This stores it with a new expiry.



	return true; // What: Refreshed Return. Why: The caller learns the token was rewritten. How: This resolves true.


};

// #endregion pusRefFun

// #endregion Helpers



// #region Exports

export { pusActFun, pusDisFun, pusEnaFun, pusRefFun }; // What: Named Exports. Why: The settings and the app's opening manage notifications through these. How: This exports the state check, the switches, and the refresh.

// #endregion Exports


