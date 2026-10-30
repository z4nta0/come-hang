


// #region Imports

import { Bytes       } from 'firebase/firestore';      // What: Bytes. Why: The new wrap is stored as Firestore bytes, and the public key is read as them. How: This wraps and reads them.
import { collection  } from 'firebase/firestore';      // What: Collection. Why: Requests stand on the group's memberships. How: This names the members collection.
import { deleteField } from 'firebase/firestore';      // What: Delete Field. Why: A shared key ends the request. How: This removes its time.
import { doc         } from 'firebase/firestore';      // What: Doc. Why: The member's public key and membership are named by path. How: This builds a reference.
import { firGetFun   } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: The memberships and keys live in Firestore. How: This returns the services.
import { getDoc      } from 'firebase/firestore';      // What: Get Doc. Why: The member's public key is read before wrapping. How: This reads it.
import { getDocs     } from 'firebase/firestore';      // What: Get Docs. Why: The standing requests are found among the memberships. How: This reads them.
import { keyLoaFun   } from './groups.ts';             // What: Key Load Function. Why: Only a member holding the key can share it. How: This reads this device's key.
import { updateDoc   } from 'firebase/firestore';      // What: Update Doc. Why: Sharing replaces the wrap and ends the request. How: This writes both.
import { wraKeyFun   } from '../platform/crypto.ts';   // What: Wrap Key Function. Why: The key is wrapped for the member's new public key. How: This wraps it.


import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: A request's time is read back. How: This types it.

// #endregion Imports



/**
 * key-share.ts = Key Share
 *
 * @summary
 * Sharing a group's key with a member who recovered their identity onto a
 * new phone (ARCHITECTURE.md Sections 6 and 8). Their new phone has a new
 * key pair, so the wrap made for the old one won't open, and loading the
 * group's key files a request on their membership instead. Any other member
 * lists the standing requests and answers one by wrapping the group key for
 * the member's newly published public key, which replaces the old wrap and
 * ends the request in one write, as the rules require.
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



// #region keyShaFun

/**
 * keyShaFun = Key Share Function
 *
 * @summary
 * Shares the group's key with a member who asked for it: wraps this
 * device's key for the member's published public key, then replaces their
 * wrap and ends their request in one write. Rejects when no request stands,
 * such as when another member answered first, or when this device can't
 * load the key itself.
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

export { keyLisFun, keyShaFun, type KeyReqTyp }; // What: Named Exports. Why: The group screens show and answer key requests. How: This exports both functions and the request's type.

// #endregion Exports


