


// #region Imports

import { collection } from 'firebase/firestore';      // What: Collection. Why: An account's notices are listed together. How: This names the notices collection.
import { deleteDoc  } from 'firebase/firestore';      // What: Delete Doc. Why: A seen notice is dismissed. How: This deletes it.
import { doc        } from 'firebase/firestore';      // What: Doc. Why: A notice is dismissed by path. How: This builds a reference.
import { firGetFun  } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Notices live in Firestore. How: This returns the services.
import { getDocs    } from 'firebase/firestore';      // What: Get Docs. Why: Every waiting notice is shown. How: This reads the collection.
import { ideEnsFun  } from './identity.ts';           // What: Identity Ensure Function. Why: Notices are under this identity's account. How: This reads its UID.


import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: A notice's times come back as timestamps. How: This types them.

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
 * there is one, then deletes each once it's been seen.
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



type NotRecTyp = { creTimNum : number, groIdeStr : string, groNamStr : string, kinValStr : string, notIdeStr : string, othUidStr : string }; // What: Notice Record Type. Why: The app picks a notice's message by kind and names the group. How: This types one notice as notLisFun lists it.

// #region notLisFun

/**
 * notLisFun = Notice List Function
 *
 * @summary
 * Resolves with this identity's waiting notices, newest first. A notice past
 * its expiry is left out, since its TTL deletion can run a day late. A
 * notice with no other person involved has an empty othUidStr.
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

const notLisFun = async () : Promise< NotRecTyp[] > => { // What: Notice List Function. Why: A group mustn't just vanish from someone's list without a word (Section 9). How: This reads the account's notices and keeps the unexpired ones.


	const notSnaObj = await getDocs( collection( firGetFun().fstDatObj, `accounts/${ ( await ideEnsFun() ).uidValStr }/notices` ) );  // What: Notices Snapshot Object. Why: Every waiting notice is in the account's collection. How: This reads it.
	const notDocArr = notSnaObj.docs.filter( ( notDocObj ) => ( notDocObj.get( 'expireAt' ) as Timestamp ).toMillis() > Date.now() ); // What: Notice Document Array. Why: An expired notice is over. How: This keeps the unexpired ones. // What: Type Assertion Note. Why: The functions store the expiry as a timestamp. How: The as reads it as one.


	const notRecArr = notDocArr.map( ( notDocObj ) : NotRecTyp => { // What: Notice Record Array. Why: The app shows each notice. How: This reads each one's fields into a record.


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

// #endregion notLisFun

// #endregion Helpers



// #region Exports

export { notDisFun, notLisFun, type NotRecTyp }; // What: Named Exports. Why: The notice screen lists and dismisses notices through these. How: This exports the functions and the notice record's type.

// #endregion Exports


