


// #region Imports

import { FIR_DAT_OBJ       } from './setup.ts';                      // What: Firestore Database Object. Why: A chat photo's document lives in Firestore. How: This reads and deletes it.
import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: Each trigger spreads them in.
import { onDocumentDeleted } from 'firebase-functions/v2/firestore'; // What: On Document Deleted. Why: A chat photo's file goes with its document. How: This registers a trigger for a document's deletion.
import { onValueDeleted    } from 'firebase-functions/v2/database';  // What: On Value Deleted. Why: A chat photo goes with its message, which lives in the Realtime Database. How: This registers a trigger for a message's deletion.
import { STO_ADM_OBJ       } from './setup.ts';                      // What: Storage Admin Object. Why: A chat photo's file lives in Storage. How: This deletes it.

// #endregion Imports



/**
 * chat-photos.ts = Chat Photos
 *
 * @summary
 * Keeps a chat photo on the server only as long as its message
 * (ARCHITECTURE.md Section 22). When a message naming a photo is deleted
 * from the Realtime Database, whatever deleted it, the photo's document goes
 * if the message's sender added it, and when a photo's document is
 * deleted, by its message, its own TTL, or a group or data deletion, its
 * file in Storage goes too. It also deletes the chat photos one identity
 * sent in a group, for a data deletion.
 *
 * Firebase may deliver triggers late, out of order, or more than once, so
 * each trigger works from what it can read now, and doing its work twice
 * changes nothing.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region chpDelFun

/**
 * chpDelFun = Chat-Photos Delete Function
 *
 * @summary
 * Deletes every chat photo one identity sent in a group, each deletion
 * taking its file with it through chpFilFun, and resolves once the
 * documents are gone. A message still naming one shows it as no longer
 * available.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The identity whose photos go.
 *
 * @returns A promise that settles once the photos are deleted, with no
 *          value.
 *
 * @example
 * ```ts
 * chpDelFun('gro1', 'alice') // => Promise<void>
 * ```
 *
*/

const chpDelFun = async ( groIdeStr : string, uidValStr : string ) : Promise< void > => { // What: Chat-Photos Delete Function. Why: Nothing an identity shared should stay when its data is deleted. How: This deletes the chat photos it sent in the group.


	const chpSnaObj = await FIR_DAT_OBJ.collection( `groups/${ groIdeStr }/chatPhotos` ).where( 'uploaderUid', '==', uidValStr ).get(); // What: Chat-Photos Snapshot Object. Why: Only the identity's own photos go. How: This reads those it sent.


	await Promise.all( chpSnaObj.docs.map( ( chpDocObj ) => chpDocObj.ref.delete() ) ); // What: Photo Delete Calls. Why: Each photo goes, and its trigger takes the file. How: This deletes every one.


};

// #endregion chpDelFun

// #endregion Helpers



// #region Module Init

// #region chpEndFun

/**
 * chpEndFun = Chat-Photo End Function
 *
 * @summary
 * A Realtime Database trigger on a chat message's deletion, whether every
 * member received it, its retention ran out, or its group was deleted. When
 * the message named a photo, it deletes the photo's document, which takes
 * the file with it through chpFilFun, but only when the message's sender
 * added that photo, so a message can't name someone else's photo to have it
 * deleted. A document already gone is no error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The delete event Firebase sends,
 *                    holding the deleted message, with the conversation's ID
 *                    in its params.
 *
 * @returns A promise that settles once the photo is gone, with no value.
 *
 * @example
 * ```ts
 * chpEndFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const chpEndFun = onValueDeleted( { ...FUN_OPT_OBJ, ref : '/chats/{conIdeStr}/messages/{mesIdeStr}' }, async ( eveValObj ) : Promise< void > => { // What: Chat-Photo End Function. Why: A chat photo stays on the server only until its message goes (Section 22). How: This deletes the photo the deleted message named.


	const mesValObj = ( eveValObj.data.val() ?? {} ) as { photoId? : unknown, senderUid? : unknown }; // What: Message Value Object. Why: The photo's ID and the sender are read once. How: This reads the deleted message. // What: Type Assertion Note. Why: The rules allow a photo ID and require a sender, and an empty value carries neither. How: The as reads both as unknown, to be checked.


	if ( typeof mesValObj.photoId !== 'string' ) return; // What: No Photo Guard. Why: Most messages carry no photo. How: This ends the run.



	const chpRefObj = FIR_DAT_OBJ.doc( `groups/${ eveValObj.params.conIdeStr }/chatPhotos/${ mesValObj.photoId }` ); // What: Chat-Photo Reference Object. Why: A group's chat uses the group's ID, and the photo sits under the group. How: This names its document.

	const chpSnaObj = await chpRefObj.get(); // What: Chat-Photo Snapshot Object. Why: Only the sender's own photo goes. How: This reads who added it.


	if ( chpSnaObj.get( 'uploaderUid' ) !== mesValObj.senderUid ) return; // What: Other Sender Guard. Why: A message naming someone else's photo mustn't delete it, and a gone document has no uploader to match. How: This ends the run unless the sender added it.



	await chpRefObj.delete(); // What: Photo Delete Call. Why: Every member has the photo, or its time is up. How: This deletes the document, whose trigger takes the file.


} );

// #endregion chpEndFun



// #region chpFilFun

/**
 * chpFilFun = Chat-Photo File Function
 *
 * @summary
 * A Firestore trigger on a chat photo document's deletion, whatever deleted
 * it, its own TTL included. It deletes the photo's file from Storage, which
 * is no error when it was never uploaded or is already gone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The delete event Firebase sends,
 *                    whose params name the group and the photo.
 *
 * @returns A promise that settles once the file is gone, with no value.
 *
 * @example
 * ```ts
 * chpFilFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const chpFilFun = onDocumentDeleted( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/chatPhotos/{phoIdeStr}' }, async ( eveValObj ) => { // What: Chat-Photo File Function. Why: A chat photo's file mustn't outlive its document. How: This deletes the file when the document goes.


	await STO_ADM_OBJ.bucket().file( `chatPhotos/${ eveValObj.params.groIdeStr }/${ eveValObj.params.phoIdeStr }` ).delete( { ignoreNotFound : true } ); // What: File Delete Call. Why: The file is filed under the same group and photo IDs. How: This deletes it, ignoring one already gone.


} );

// #endregion chpFilFun

// #endregion Module Init



// #region Exports

export { chpDelFun, chpEndFun, chpFilFun }; // What: Named Exports. Why: The entry deploys the triggers, and a data deletion removes an identity's chat photos. How: This exports the two triggers and the delete.

// #endregion Exports


