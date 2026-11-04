


// #region Imports

import { collection } from 'firebase/firestore';       // What: Collection. Why: An account's notices are listed together. How: This names the notices collection.
import { deleteDoc  } from 'firebase/firestore';       // What: Delete Doc. Why: A seen notice is dismissed. How: This deletes it.
import { doc        } from 'firebase/firestore';       // What: Doc. Why: A notice is dismissed by path. How: This builds a reference.
import { firGetFun  } from '../platform/firebase.ts';  // What: Firebase Get Function. Why: Notices live in Firestore. How: This returns the services.
import { getDocs    } from 'firebase/firestore';       // What: Get Docs. Why: Every waiting notice is listed. How: This reads the collection.
import { ideEnsFun  } from './identity.ts';            // What: Identity Ensure Function. Why: Notices are under this identity's account. How: This reads its UID.
import { keyGetFun  } from '../platform/key-store.ts'; // What: Key Get Function. Why: Only a phone that has acted holds an identity with notices. How: This reads its record without connecting.
import { onSnapshot } from 'firebase/firestore';       // What: On Snapshot. Why: A notice arriving while the app is open shows at once. How: This listens to the collection.


import type { QueryDocumentSnapshot } from 'firebase/firestore'; // What: Query Document Snapshot. Why: The list and the watch read notices the same way. How: This types one notice's document.
import type { Timestamp             } from 'firebase/firestore'; // What: Timestamp. Why: A notice's times come back as timestamps. How: This types them.

// #endregion Imports



/**
 * notices.ts = Notices
 *
 * @summary
 * The things that happened to this identity while it was away
 * (ARCHITECTURE.md Section 11.1), such as a removal, a deleted group, or an
 * answered offer. Cloud Functions write them to the account's notices, and
 * the app lists the unexpired ones, newest first, each with its kind, the
 * group's ID and its name at the time, and the other person involved where
 * there is one, then deletes each once it's been seen. The app can list them
 * once or watch them, so one arriving while it's open shows at once.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region notDisFun

/**
 * notDisFun = Notice Dismiss Function
 *
 * @summary
 * Dismisses one of this identity's notices by deleting it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param notIdeStr - Notice Identifier String: The notice's ID.
 *
 * @returns A promise that settles once the notice is gone, with no value.
 *
 * @example
 * ```ts
 * notDisFun('removed-Xk3...') // => Promise<void>
 * ```
 *
*/

const notDisFun = async ( notIdeStr : string ) : Promise< void > => deleteDoc( doc( firGetFun().fstDatObj, `accounts/${ ( await ideEnsFun() ).uidValStr }/notices/${ notIdeStr }` ) ); // What: Notice Dismiss Function. Why: A notice is shown until it's seen. How: This deletes it from the account.

// #endregion notDisFun



type NotRecTyp = { creTimNum : number, groIdeStr : string, groNamStr : string, kinValStr : string, notIdeStr : string, othUidStr : string }; // What: Notice Record Type. Why: The app picks a notice's message by kind and names the group. How: This types one notice as the list and the watch report it.

// #region notArrFun

/**
 * notArrFun = Notice Array Function
 *
 * @summary
 * Reads a set of notice documents into records, newest first. A notice past
 * its expiry is left out, since its TTL deletion can run a day late. A
 * notice with no other person involved has an empty othUidStr.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param notDocArr - Notice Document Array: The notices' documents.
 *
 * @returns The unexpired notices' records, newest first.
 *
 * @example
 * ```ts
 * notArrFun(notSnaObj.docs) // => [ { kinValStr : 'removed', ... } ]
 * ```
 *
*/

const notArrFun = ( notDocArr : QueryDocumentSnapshot[] ) : NotRecTyp[] => { // What: Notice Array Function. Why: The list and the watch report notices the same way. How: This keeps the unexpired documents and reads each into a record.


	const curDocArr = notDocArr.filter( ( notDocObj ) => ( notDocObj.get( 'expireAt' ) as Timestamp ).toMillis() > Date.now() ); // What: Current Document Array. Why: An expired notice is over. How: This keeps the unexpired ones. // What: Type Assertion Note. Why: The functions store the expiry as a timestamp. How: The as reads it as one.


	const notRecArr = curDocArr.map( ( notDocObj ) : NotRecTyp => { // What: Notice Record Array. Why: The app shows each notice. How: This reads each one's fields into a record.


		return { // What: Record Return. Why: Each notice becomes one record. How: This returns its fields.


			creTimNum : ( notDocObj.get( 'createdAt' ) as Timestamp ).toMillis(), // What: Created Time Number. Why: Notices are shown newest first. How: This reads the time in milliseconds. // What: Type Assertion Note. Why: The functions store the time as a timestamp. How: The as reads it as one.
			groIdeStr : notDocObj.get( 'groupId' ) as string,                     // What: Group Identifier String. Why: A notice about a group still around can open it. How: This reads its ID. // What: Type Assertion Note. Why: The functions store it as a string. How: The as reads it as one.
			groNamStr : notDocObj.get( 'groupName' ) as string,                   // What: Group Name String. Why: A deleted group can still be named. How: This reads its name at the time. // What: Type Assertion Note. Why: The functions store it as a string. How: The as reads it as one.
			kinValStr : notDocObj.get( 'kind' ) as string,                        // What: Kind Value String. Why: The app picks the message by kind. How: This reads it. // What: Type Assertion Note. Why: The functions store it as a string. How: The as reads it as one.
			notIdeStr : notDocObj.id,                                             // What: Notice Identifier String. Why: A seen notice is dismissed by ID. How: This reads it.
			othUidStr : ( notDocObj.get( 'otherUid' ) ?? '' ) as string           // What: Other UID String. Why: Some notices name the other person involved. How: This reads it, empty when there's none. // What: Type Assertion Note. Why: The functions store it as a string when it's there. How: The as reads it as one.


		};


	} );



	return notRecArr.sort( ( recOneObj, recTwoObj ) => recTwoObj.creTimNum - recOneObj.creTimNum ); // What: Notices Return. Why: The latest news is read first. How: This returns the records newest first.


};

// #endregion notArrFun



// #region notLisFun

/**
 * notLisFun = Notice List Function
 *
 * @summary
 * Resolves with this identity's waiting notices, newest first, read once,
 * as notArrFun reads them.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the notices.
 *
 * @example
 * ```ts
 * notLisFun() // => [ { kinValStr : 'removed', ... } ]
 * ```
 *
*/

const notLisFun = async () : Promise< NotRecTyp[] > => notArrFun( ( await getDocs( collection( firGetFun().fstDatObj, `accounts/${ ( await ideEnsFun() ).uidValStr }/notices` ) ) ).docs ); // What: Notice List Function. Why: A group mustn't just vanish from someone's list without a word (Section 9). How: This reads the account's notices once and keeps the unexpired ones.

// #endregion notLisFun



// #region notWatFun

/**
 * notWatFun = Notice Watch Function
 *
 * @summary
 * Watches this identity's waiting notices, reporting them newest first, as
 * notArrFun reads them, each time one arrives or goes. A phone with no
 * identity, or one whose sign-in was lost, reports nothing and connects to
 * nothing. A watch that fails is logged and stops reporting. Resolves with
 * the function that stops watching.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onNotFun - On Notices Function: Called with the notices each time
 *                   they change.
 *
 * @returns A promise that resolves with the function that stops watching.
 *
 * @example
 * ```ts
 * notWatFun(setNotRecArr) // => () => void
 * ```
 *
*/

const notWatFun = async ( onNotFun : ( notRecArr : NotRecTyp[] ) => void ) : Promise< () => void > => { // What: Notice Watch Function. Why: A notice left while the app is open should show without waiting for the next launch. How: This listens to the account's notices.


	if ( await keyGetFun( 'identity' ) === undefined ) return () => {}; // What: No Identity Guard. Why: A first visit has no notices, and connecting would create the Firebase services on page load. How: This returns a stop that does nothing.



	const { autValObj, fstDatObj } = firGetFun(); // What: Firebase Services. Why: The notices are read through Auth and Firestore. How: This reads both.


	await autValObj.authStateReady(); // What: Auth Ready Call. Why: The signed-in identity is restored from storage asynchronously. How: This waits until Auth knows it.



	const uidValStr = autValObj.currentUser?.uid; // What: UID Value String. Why: The notices are under the signed-in UID. How: This reads it, undefined when nobody is signed in.


	if ( uidValStr === undefined ) return () => {}; // What: Signed Out Guard. Why: An identity whose sign-in was lost has no notices to read. How: This returns a stop that does nothing.



	return onSnapshot( collection( fstDatObj, `accounts/${ uidValStr }/notices` ), ( notSnaObj ) => onNotFun( notArrFun( notSnaObj.docs ) ), ( errCatObj ) => console.warn( errCatObj ) ); // What: Watch Return. Why: Each change reports the notices, and a failure stays visible to someone debugging. How: This listens to the collection and returns its stop.


};

// #endregion notLisFun

// #endregion Helpers



// #region Exports

export { notDisFun, notLisFun, notWatFun, type NotRecTyp }; // What: Named Exports. Why: The notice sheet watches and dismisses notices through these, and a list reads them once. How: This exports the functions and the notice record's type.

// #endregion Exports


