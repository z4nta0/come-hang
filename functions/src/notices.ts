


// #region Imports

import { FieldValue  } from 'firebase-admin/firestore'; // What: Field Value. Why: A notice is stamped with the server's time. How: This supplies the server timestamp.
import { FIR_DAT_OBJ } from './setup.ts';               // What: Firestore Database Object. Why: Notices live under each account in Firestore. How: This names their documents.
import { Timestamp   } from 'firebase-admin/firestore'; // What: Timestamp. Why: A notice expires on its own. How: This builds its expiry time.


import type { WriteBatch } from 'firebase-admin/firestore'; // What: Write Batch. Why: A notice is written in the same batch as the change it reports. How: This types the batch.

// #endregion Imports



/**
 * notices.ts = Account Notices
 *
 * @summary
 * Writes the notices that tell someone what happened to a group while they
 * were away (ARCHITECTURE.md Section 11.1), which only Cloud Functions may
 * write. Each notice names its kind, the group, and the group's name at the
 * time, and expires 30 days later through Firestore's TTL. A notice's ID is
 * its kind and the group's ID, so a retried function writes the same notice
 * once, and a later notice of the same kind about the same group replaces
 * the earlier one.
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

const NOT_LIF_NUM = 30 * 24 * 60 * 60 * 1000; // What: Notice Lifetime Number. Why: A notice never seen shouldn't linger (Section 11.1). How: This is 30 days in milliseconds.

// #endregion Constants



// #region Helpers

// #region notBatFun

/**
 * notBatFun = Notice Batch Function
 *
 * @summary
 * Adds one notice to a write batch, under the given account, so it lands
 * together with the change it reports or not at all.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param batWriObj - Batch Write Object: The batch the notice joins.
 * @param uidValStr - UID Value String: Whose account the notice goes to.
 * @param kinValStr - Kind Value String: Which kind of notice it is, picking
 *                    the message the app shows.
 * @param groIdeStr - Group Identifier String: The group it's about.
 * @param groNamStr - Group Name String: The group's name when it happened.
 * @param othUidStr - Other UID String: The other person involved, such as
 *                    who declined an offer, left out when there's none.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * notBatFun(batWriObj, 'bob', 'removed', 'gro1', 'Picnic') // => void
 * ```
 *
*/

const notBatFun = ( batWriObj : WriteBatch, uidValStr : string, kinValStr : string, groIdeStr : string, groNamStr : string, othUidStr? : string ) : void => { // What: Notice Batch Function. Why: Every notice has the same shape and lifetime. How: This sets one notice document in the batch.


	batWriObj.set( FIR_DAT_OBJ.doc( `accounts/${ uidValStr }/notices/${ kinValStr }-${ groIdeStr }` ), { // What: Notice Set Call. Why: The notice reaches its owner with the change it reports. How: This writes it under their account, named by its kind and group.


		createdAt : FieldValue.serverTimestamp(),                     // What: Created At. Why: The app shows when it happened. How: This stamps the server's time.
		expireAt  : Timestamp.fromMillis( Date.now() + NOT_LIF_NUM ), // What: Expire At. Why: Firestore's TTL deletes a notice nobody saw. How: This sets it 30 days out.
		groupId   : groIdeStr,                                        // What: Group ID. Why: The notice names its group, which may be gone. How: This stores its ID.
		groupName : groNamStr,                                        // What: Group Name. Why: A deleted group can still be named. How: This stores its name at the time.
		kind      : kinValStr,                                        // What: Kind. Why: The app picks its message by kind. How: This stores it.

		...( othUidStr ? { otherUid : othUidStr } : {} ) // What: Other UID Spread. Why: Some notices name the other person involved (Section 11.1). How: This adds otherUid when one was given.


	});


};

// #endregion notBatFun

// #endregion Helpers



// #region Exports

export { notBatFun }; // What: Named Export. Why: Every function that reports a change writes its notices this way. How: This exports the helper.

// #endregion Exports


