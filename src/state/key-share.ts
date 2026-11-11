


// #region Imports

import { Bytes       } from 'firebase/firestore';       // What: Bytes. Why: The new wrap is stored as Firestore bytes, and the public key is read as them. How: This wraps and reads them.
import { collection  } from 'firebase/firestore';       // What: Collection. Why: Requests stand on the group's memberships. How: This names the members collection.
import { deleteField } from 'firebase/firestore';       // What: Delete Field. Why: A shared key ends the request. How: This removes its time.
import { doc         } from 'firebase/firestore';       // What: Doc. Why: The member's public key and membership are named by path. How: This builds a reference.
import { firGetFun   } from '../platform/firebase.ts';  // What: Firebase Get Function. Why: The memberships and keys live in Firestore. How: This returns the services.
import { getDoc      } from 'firebase/firestore';       // What: Get Doc. Why: The member's public key is read before wrapping. How: This reads it.
import { getDocs     } from 'firebase/firestore';       // What: Get Docs. Why: The standing requests are found among the memberships. How: This reads them.
import { ideEnsFun   } from './identity.ts';            // What: Identity Ensure Function. Why: A member's own membership is watched for an answered request. How: This reads their UID.
import { keyGetFun   } from '../platform/key-store.ts'; // What: Key Get Function. Why: Only a device holding the group's key can share it. How: This reads the key without recovering it.
import { keyLoaFun   } from './groups.ts';              // What: Key Load Function. Why: Only a member holding the key can share it. How: This reads this device's key.
import { onSnapshot  } from 'firebase/firestore';       // What: On Snapshot. Why: A member waiting for the key learns the moment it's shared. How: This watches their membership.
import { updateDoc   } from 'firebase/firestore';       // What: Update Doc. Why: Sharing replaces the wrap and ends the request. How: This writes both.
import { wraKeyFun   } from '../platform/crypto.ts';    // What: Wrap Key Function. Why: The key is wrapped for the member's new public key. How: This wraps it.


import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: A request's time is read back. How: This types it.

// #endregion Imports



/**
 * key-share.ts = Key Share
 *
 * @summary
 * Sharing a group's key with a member who recovered their identity onto a
 * new device (ARCHITECTURE.md Sections 6 and 8). Their new device has a new
 * key pair, so the wrap made for the old one won't open, and loading the
 * group's key files a request on their membership instead. Any other member
 * lists the standing requests, and the member's own old device, once it has
 * stepped back, watches theirs; either answers one by wrapping the group key
 * for the member's newly published public key, which replaces the old wrap
 * and ends the request in one write, as the rules require, and the new
 * device, watching its membership, learns the request was answered.
 *
 * Sections:
 *  - Types
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type KeyReqTyp = { reqTimNum : number, uidValStr : string }; // What: Key Request Type. Why: A screen shows who's waiting and for how long. How: This types one standing request.

// #endregion Types



// #region Helpers

// #region keyHasFun

/**
 * keyHasFun = Key Has Function
 *
 * @summary
 * Resolves with whether this device keeps the group's key, without trying
 * to recover it from the member's wrap, so it never files a key request.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with true when the device keeps the key.
 *
 * @example
 * ```ts
 * keyHasFun('Xk3...') // => true
 * ```
 *
*/

const keyHasFun = async ( groIdeStr : string ) : Promise< boolean > => ( await keyGetFun( `group:${ groIdeStr }` ) ) !== undefined; // What: Key Has Function. Why: A member's own request is theirs to answer only from a device holding the key. How: This reads the kept key and says whether it's there.

// #endregion keyHasFun



// #region keyArrFun

/**
 * keyArrFun = Key Arrival Function
 *
 * @summary
 * Watches this member's membership of a group and calls onArrFun each time a
 * key request the watch saw standing ends while the membership remains, on a
 * device that doesn't keep the group's key, which is how a shared key
 * arrives. A request ended by the membership going, as when the member
 * leaves, or answered by this very device, calls nothing. Returns the function
 * that stops the watch, which works before the watch has started too.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param onArrFun  - On Arrival Function: Called once the key is shared.
 *
 * @returns The function that stops the watch.
 *
 * @example
 * ```ts
 * keyArrFun('Xk3...', () => ...) // => () => void
 * ```
 *
*/

const keyArrFun = ( groIdeStr : string, onArrFun : () => void ) : () => void => { // What: Key Arrival Function. Why: A device waiting for the key should open the group once it's shared, without a reload. How: This watches the member's own membership for its request ending.


	let actValBoo = true;     // What: Active Value Boolean. Why: A watch starting after the stop mustn't run. How: This is true until the stop.
	let reqSeeBoo = false;    // What: Request Seen Boolean. Why: Only a request that stood and then ended means a shared key. How: This is true while the last report held one.
	let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once the UID is read. How: This holds it, doing nothing until then.



	void ideEnsFun().then( ( { uidValStr } ) => { // What: Watch Start Call. Why: The membership is named by the member's UID. How: This reads it, then watches the membership unless stopped already.


		if ( !actValBoo ) return; // What: Stopped Guard. Why: The watch was stopped before it started. How: This returns.



		stoWatFun = onSnapshot( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), ( memSnaObj ) => { // What: Membership Watch Call. Why: A request is filed and answered on the membership. How: This reports each change, keeping the stop.


			const reqNowBoo = memSnaObj.get( 'keyRequestedAt' ) !== undefined; // What: Request Now Boolean. Why: A request just filed reads as null until the server stamps it, which still counts. How: This is true while one stands.



			if ( reqSeeBoo && !reqNowBoo && memSnaObj.exists() ) void keyHasFun( groIdeStr ).then( ( hasKeyBoo ) => { if ( actValBoo && !hasKeyBoo ) onArrFun(); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Arrival Call. Why: A request that ended with the membership still there was answered with the key, which arrives only on a device without it, not on the member's own old device that answered it. How: This reports it once the device is found not to keep the key, while the watch runs, logging a failed check.



			reqSeeBoo = reqNowBoo; // What: Seen Assignment. Why: The next report compares against this one. How: This keeps whether a request stands.


		}, ( errCatObj ) => console.warn( errCatObj ) ); // What: Watch Failure Handler. Why: A refused watch, such as for a member just removed, leaves the group as it is, but the failure stays visible to someone debugging. How: This logs it.


	}, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Identity Failure Handler. Why: Without an identity there's nothing to watch, but the failure stays visible. How: This logs it.



	return () => { // What: Stop Return. Why: A watch shouldn't outlive the group's screen. How: This marks the watch stopped and stops it.


		actValBoo = false; // What: Inactive Set. Why: A watch starting late mustn't run. How: This marks it stopped.

		stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


	};


};

// #endregion keyArrFun



// #region keyLisFun

/**
 * keyLisFun = Key List Function
 *
 * @summary
 * Resolves with the group's standing key requests, oldest first, each with
 * its member's UID and when it was filed, in milliseconds.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the standing requests.
 *
 * @example
 * ```ts
 * keyLisFun('Xk3...') // => [{ reqTimNum : 1761700000000, uidValStr : 'u1' }]
 * ```
 *
*/

const keyLisFun = async ( groIdeStr : string ) : Promise< KeyReqTyp[] > => { // What: Key List Function. Why: Members see who's waiting for the key, so one of them can share it. How: This reads the memberships with a standing request.


	const memSnaObj = await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/members` ) );     // What: Members Snapshot Object. Why: A request stands on its membership. How: This reads the group's memberships.
	const reqDocArr = memSnaObj.docs.filter( ( memDocObj ) => memDocObj.get( 'keyRequestedAt' ) !== undefined ); // What: Request Document Array. Why: Only memberships with a request are waiting. How: This keeps those.

	const reqRecArr = reqDocArr.map( ( reqDocObj ) => ({ // What: Request Record Array. Why: A screen needs who asked and when. How: This reads each request into a record.


		reqTimNum : ( reqDocObj.get( 'keyRequestedAt' ) as Timestamp ).toMillis(), // What: Request Time Number. Why: Requests are shown oldest first. How: This reads the time in milliseconds. // What: Type Assertion Note. Why: The rules store the request's time as a timestamp. How: The as reads it as one.
		uidValStr : reqDocObj.id                                                   // What: UID Value String. Why: The member who asked is answered by UID. How: This reads the membership's ID.


	}) );



	return reqRecArr.sort( ( reqOneObj, reqTwoObj ) => reqOneObj.reqTimNum - reqTwoObj.reqTimNum ); // What: Oldest First Return. Why: The longest wait is answered first. How: This sorts by time.


};

// #endregion keyLisFun



// #region keyOwnFun

/**
 * keyOwnFun = Key Own Function
 *
 * @summary
 * Watches this member's own key requests across the given groups, the ones
 * their new device files (Section 8), and calls onOwnFun with the groups
 * whose request stands while this device keeps the group's key, in the order
 * given, each time one changes. Returns the function that stops every
 * watch, which works before the watches have started too.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeArr - Group Identifier Array: The member's groups' IDs.
 * @param onOwnFun  - On Own Function: Called with the IDs of the groups
 *                    waiting on this device.
 *
 * @returns The function that stops the watches.
 *
 * @example
 * ```ts
 * keyOwnFun(['Xk3...'], (waiIdeArr) => ...) // => () => void
 * ```
 *
*/

const keyOwnFun = ( groIdeArr : string[], onOwnFun : ( waiIdeArr : string[] ) => void ) : () => void => { // What: Key Own Function. Why: A device that stepped back shares each group's key with the member's new device. How: This watches the member's own memberships for a request this device can answer.


	let actValBoo = true; // What: Active Value Boolean. Why: A report arriving after the stop mustn't land. How: This is true until the stop.


	const stoFunArr : ( () => void )[] = []; // What: Stop Function Array. Why: Each group's watch has its own stop. How: This collects them.
	const waiIdeSet = new Set< string >();     // What: Waiting Identifier Set. Why: Each report changes one group's answer. How: This holds the groups waiting now.



	void ideEnsFun().then( ( { uidValStr } ) => { // What: Watch Start Call. Why: The memberships are named by the member's UID. How: This reads it, then watches each group's unless stopped already.


		if ( !actValBoo ) return; // What: Stopped Guard. Why: The watches were stopped before they started. How: This returns.



		for ( const groIdeStr of groIdeArr ) stoFunArr.push( onSnapshot( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), ( memSnaObj ) => void keyHasFun( groIdeStr ).then( ( hasKeyBoo ) => { // What: Membership Watch Loop. Why: A request can stand or end in any group. How: This watches each membership and checks the device keeps the key on every change.


			if ( !actValBoo ) return; // What: Stopped Guard. Why: A check finishing after the stop mustn't report. How: This returns.



			if ( hasKeyBoo && memSnaObj.get( 'keyRequestedAt' ) !== undefined ) waiIdeSet.add( groIdeStr ); // What: Waiting Add Call. Why: A standing request this device can answer waits on it. How: This adds the group.

			else waiIdeSet.delete( groIdeStr ); // What: Waiting Delete Call. Why: An answered request, or one this device can't answer, doesn't. How: This removes the group.



			onOwnFun( groIdeArr.filter( ( groIdeVal ) => waiIdeSet.has( groIdeVal ) ) ); // What: Waiting Report Call. Why: The screen lists the groups waiting. How: This reports them in the order given.


		} ), ( errCatObj ) => console.warn( errCatObj ) ) ); // What: Watch Failure Handler. Why: A refused watch, such as for a group just left, leaves the rest working, but the failure stays visible to someone debugging. How: This logs it.


	}, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Identity Failure Handler. Why: Without an identity there's nothing to watch, but the failure stays visible. How: This logs it.



	return () => { // What: Stop Return. Why: The watches shouldn't outlive the screen. How: This marks them stopped and stops each.


		actValBoo = false; // What: Inactive Set. Why: Late reports mustn't land. How: This marks the watches stopped.

		stoFunArr.forEach( ( stoFunVal ) => stoFunVal() ); // What: Watch Stop Calls. Why: The listeners close. How: This stops each.


	};


};

// #endregion keyOwnFun



// #region keyShaFun

/**
 * keyShaFun = Key Share Function
 *
 * @summary
 * Shares the group's key with a member who asked for it, this member
 * included when their new device asked: wraps this device's key for the
 * member's published public key, then replaces their wrap and ends their
 * request in one write. Rejects when no request stands, such as when another
 * member answered first, or when this device can't load the key itself.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The member who asked.
 *
 * @returns A promise that settles once the key is shared, with no value.
 *
 * @example
 * ```ts
 * keyShaFun('Xk3...', 'u1') // => Promise<void>
 * ```
 *
*/

const keyShaFun = async ( groIdeStr : string, uidValStr : string ) : Promise< void > => { // What: Key Share Function. Why: A member on a new phone reads the group again once someone shares its key (Section 6). How: This wraps the key for their new public key and answers the request.


	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The public key and the membership live there. How: This reads it.

	const groKeyObj = await keyLoaFun( groIdeStr );                                                             // What: Group Key Object. Why: The key shared is this device's own. How: This loads it.
	const pubKeyObj = ( await getDoc( doc( fstDatObj, `users/${ uidValStr }` ) ) ).get( 'publicKey' ) as Bytes; // What: Public Key Object. Why: The new phone published its new public key. How: This reads it. // What: Type Assertion Note. Why: The rules store the public key as bytes. How: The as reads it as such.
	const wraBytArr = await wraKeyFun( groKeyObj, pubKeyObj.toUint8Array() as Uint8Array< ArrayBuffer > );      // What: Wrapped Bytes Array. Why: Only the member's new private key may open it. How: This wraps the key for the public key. // What: Type Assertion Note. Why: toUint8Array returns an array over a plain buffer. How: The as reads it as such.


	await updateDoc( doc( fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), 'keyRequestedAt', deleteField(), 'wrappedGroupKey', Bytes.fromUint8Array( wraBytArr ) ); // What: Share Write Call. Why: The rules take the new wrap only as the answer to a standing request. How: This replaces the wrap and ends the request together.


};

// #endregion keyShaFun

// #endregion Helpers



// #region Exports

export { keyArrFun, keyHasFun, keyLisFun, keyOwnFun, keyShaFun, type KeyReqTyp }; // What: Named Exports. Why: The group screens show and answer key requests, check this device can, and open a group once its key arrives, and a device that stepped back answers its member's own. How: This exports the functions and the request's type.

// #endregion Exports


