


// #region Imports

import { FIR_DAT_OBJ       } from './setup.ts';                      // What: Firestore Database Object. Why: Photos and their events live in Firestore. How: This reads, moves, and deletes them.
import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: Each trigger spreads them in.
import { onDocumentDeleted } from 'firebase-functions/v2/firestore'; // What: On Document Deleted. Why: A photo goes with its event, and a full photo with its document. How: This registers triggers for deletions.
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'; // What: On Document Updated. Why: A photo's deletion time follows its event's. How: This registers a trigger for an event's changes.
import { STO_ADM_OBJ       } from './setup.ts';                      // What: Storage Admin Object. Why: Full photos live in Storage. How: This deletes them.


import type { Timestamp } from 'firebase-admin/firestore'; // What: Timestamp. Why: An event's and a photo's deletion times are Firestore timestamps. How: This types them.

// #endregion Imports



/**
 * photos.ts = Event Photos
 *
 * @summary
 * Keeps an event's photos in step with their event (ARCHITECTURE.md Section
 * 20), so the app's own event batches never touch them. When an event's
 * deletion time moves, each of its photos moves with it; when an event is
 * deleted, by its TTL, a cancel, or its group's deletion, its photos and
 * their tallies go; and when a photo's document is deleted, whatever deleted
 * it, its full photo in Storage goes too. It also deletes the photos one
 * identity added to a group, for a data deletion.
 *
 * Firebase may deliver triggers late, out of order, or more than once, so
 * each trigger works from the current state rather than the change it was
 * handed, and doing its work twice changes nothing.
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

// #region uplDelFun

/**
 * uplDelFun = Uploads Delete Function
 *
 * @summary
 * Deletes every photo one identity added to a group's events, each deletion
 * taking its full photo with it through phoFilFun, and resolves once the
 * documents are gone.
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
 * uplDelFun('gro1', 'alice') // => Promise<void>
 * ```
 *
*/

const uplDelFun = async ( groIdeStr : string, uidValStr : string ) : Promise< void > => { // What: Uploads Delete Function. Why: Nothing an identity shared should stay when its data is deleted. How: This deletes its photos in each of the group's events.


	const eveSnaObj = await FIR_DAT_OBJ.collection( `groups/${ groIdeStr }/events` ).get(); // What: Events Snapshot Object. Why: Photos sit under their events. How: This reads the group's events.


	for ( const eveDocObj of eveSnaObj.docs ) { // What: Event Loop. Why: The identity may have added photos to several events. How: This checks each.


		const phoSnaObj = await eveDocObj.ref.collection( 'photos' ).where( 'uploaderUid', '==', uidValStr ).get(); // What: Photos Snapshot Object. Why: Only the identity's own photos go. How: This reads those it uploaded.


		await Promise.all( phoSnaObj.docs.map( ( phoDocObj ) => phoDocObj.ref.delete() ) ); // What: Photo Delete Calls. Why: Each photo goes, and its trigger takes the full photo. How: This deletes every one.


	}


};

// #endregion uplDelFun

// #endregion Helpers



// #region Module Init

// #region phoMovFun

/**
 * phoMovFun = Photos Move Function
 *
 * @summary
 * A Firestore trigger on every change to an event. When the event's
 * deletion time differs from a photo's, it moves that photo's to match, as
 * the event stands when the trigger runs.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The change event Firebase sends,
 *                    whose params name the group and the event.
 *
 * @returns A promise that settles once the photos match, with no value.
 *
 * @example
 * ```ts
 * phoMovFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const phoMovFun = onDocumentUpdated( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/events/{eveIdeStr}' }, async ( eveValObj ) => { // What: Photos Move Function. Why: A photo goes when its event does, and an event's end can move. How: This sets each photo's deletion time to the event's current one.


	const eveRefObj = FIR_DAT_OBJ.doc( `groups/${ eveValObj.params.groIdeStr }/events/${ eveValObj.params.eveIdeStr }` ); // What: Event Reference Object. Why: The photos follow the event as it stands now, not as the change left it. How: This names the event.
	const eveSnaObj = await eveRefObj.get();                                                                                // What: Event Snapshot Object. Why: A later change may have landed since. How: This reads the event's current state.


	if ( !eveSnaObj.exists ) return; // What: Gone Guard. Why: A deleted event's photos are deleted, not moved. How: This returns.



	const expNowObj = eveSnaObj.get( 'expireAt' ) as Timestamp; // What: Expire Now Object. Why: Each photo takes the event's deletion time. How: This reads it. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.

	const phoSnaObj = await eveRefObj.collection( 'photos' ).get(); // What: Photos Snapshot Object. Why: Every photo of the event is checked. How: This reads them.


	await Promise.all( phoSnaObj.docs.filter( ( phoDocObj ) => !( phoDocObj.get( 'expireAt' ) as Timestamp ).isEqual( expNowObj ) ).map( ( phoDocObj ) => phoDocObj.ref.update( { expireAt : expNowObj } ) ) ); // What: Photo Update Calls. Why: Only a photo out of step needs a write. How: This moves each one whose deletion time differs. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.


} );

// #endregion phoMovFun



// #region phoEndFun

/**
 * phoEndFun = Photos End Function
 *
 * @summary
 * A Firestore trigger on an event's deletion. It deletes the event's photos,
 * each taking its full photo with it through phoFilFun, and its tallies.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The delete event Firebase sends,
 *                    whose params name the group and the event.
 *
 * @returns A promise that settles once the photos and tallies are gone, with
 *          no value.
 *
 * @example
 * ```ts
 * phoEndFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const phoEndFun = onDocumentDeleted( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/events/{eveIdeStr}' }, async ( eveValObj ) => { // What: Photos End Function. Why: A photo goes with its event, and Firestore's TTL leaves an event's subcollections behind. How: This deletes the event's photos and tallies.


	const eveRefObj = FIR_DAT_OBJ.doc( `groups/${ eveValObj.params.groIdeStr }/events/${ eveValObj.params.eveIdeStr }` ); // What: Event Reference Object. Why: The photos and tallies sit under the event. How: This names it.


	await FIR_DAT_OBJ.recursiveDelete( eveRefObj.collection( 'photos' ) );     // What: Photos Delete Call. Why: The event's photos go, each trigger taking its full photo. How: This deletes the collection.
	await FIR_DAT_OBJ.recursiveDelete( eveRefObj.collection( 'photoTally' ) ); // What: Tallies Delete Call. Why: The counts have nothing left to count. How: This deletes the collection.


} );

// #endregion phoEndFun



// #region phoFilFun

/**
 * phoFilFun = Photo File Function
 *
 * @summary
 * A Firestore trigger on a photo document's deletion, whatever deleted it,
 * its own TTL included. It deletes the photo's full image from Storage,
 * which is no error when it was never uploaded or is already gone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The delete event Firebase sends,
 *                    whose params name the group, the event, and the photo.
 *
 * @returns A promise that settles once the file is gone, with no value.
 *
 * @example
 * ```ts
 * phoFilFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const phoFilFun = onDocumentDeleted( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/events/{eveIdeStr}/photos/{phoIdeStr}' }, async ( eveValObj ) => { // What: Photo File Function. Why: A full photo mustn't outlive its document. How: This deletes the file at the photo's path.


	await STO_ADM_OBJ.bucket().file( `photos/${ eveValObj.params.groIdeStr }/${ eveValObj.params.eveIdeStr }/${ eveValObj.params.phoIdeStr }` ).delete( { ignoreNotFound : true } ); // What: File Delete Call. Why: The full photo is filed under its group, event, and photo IDs. How: This deletes it, if it's there.


} );

// #endregion phoFilFun

// #endregion Module Init



// #region Exports

export { phoEndFun, phoFilFun, phoMovFun, uplDelFun }; // What: Named Exports. Why: The entry deploys the triggers, and a data deletion removes an identity's photos. How: This exports the three triggers and the uploads delete.

// #endregion Exports


