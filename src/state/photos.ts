


// #region Imports

import { Bytes           } from 'firebase/firestore';      // What: Bytes. Why: A photo's thumbnail and IVs are stored as Firestore bytes. How: This wraps and reads raw bytes.
import { chaPhoFun       } from './chat.ts';               // What: Chat Photos Function. Why: A burst of shared photos posts one line to the chat. How: This posts it.
import { collection      } from 'firebase/firestore';      // What: Collection. Why: An event's photos are listed together. How: This names the collection.
import { decBytFun       } from '../platform/crypto.ts';   // What: Decrypt Bytes Function. Why: Thumbnails and full photos are stored encrypted. How: This decrypts them.
import { deleteDoc       } from 'firebase/firestore';      // What: Delete Doc. Why: The uploader or owner takes a photo down. How: This deletes its document.
import { doc             } from 'firebase/firestore';      // What: Doc. Why: A photo, its tallies, and its event are named by path. How: This builds a reference.
import { encBytFun       } from '../platform/crypto.ts';   // What: Encrypt Bytes Function. Why: A photo is shared encrypted. How: This encrypts it under the group key.
import { firGetFun       } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Photos live in Firestore and Storage. How: This returns the services.
import { getBytes        } from 'firebase/storage';        // What: Get Bytes. Why: A member opens a full photo. How: This downloads it.
import { ideEnsFun       } from './identity.ts';           // What: Identity Ensure Function. Why: A photo names its uploader. How: This reads the identity.
import { imaShrFun       } from '../platform/image.ts';    // What: Image Shrink Function. Why: A camera's photo is far too large to share. How: This shrinks it and makes its thumbnail.
import { keyLoaFun       } from './groups.ts';             // What: Key Load Function. Why: Photos are encrypted with the group key. How: This loads it.
import { onSnapshot      } from 'firebase/firestore';      // What: On Snapshot. Why: The grid fills in as members share photos. How: This watches the collection.
import { orderBy         } from 'firebase/firestore';      // What: Order By. Why: Photos show in the order they were shared. How: This sorts the watch.
import { query           } from 'firebase/firestore';      // What: Query. Why: The watch is sorted. How: This builds it.
import { ref             } from 'firebase/storage';        // What: Ref. Why: A full photo's file is named by path. How: This builds its reference.
import { runTransaction  } from 'firebase/firestore';      // What: Run Transaction. Why: A photo and its two counts are written as one, from the counts as they stand. How: This reads and writes them together.
import { serverTimestamp } from 'firebase/firestore';      // What: Server Timestamp. Why: The rules require the server's time on a photo. How: This asks the server to fill it in.
import { uploadBytes     } from 'firebase/storage';        // What: Upload Bytes. Why: The full photo goes to Storage. How: This uploads it.


import type { QueryDocumentSnapshot } from 'firebase/firestore'; // What: Query Document Snapshot. Why: A photo record is read from a watched document. How: This types it.
import type { Timestamp             } from 'firebase/firestore'; // What: Timestamp. Why: A photo's time is a Firestore timestamp. How: This types it.

// #endregion Imports



/**
 * photos.ts = Event Photos
 *
 * @summary
 * An event's shared photos (ARCHITECTURE.md Section 20). A member adds a
 * photo by shrinking it on the device, encrypting its full photo and its
 * thumbnail under the group key, and writing, in one transaction, the photo's
 * document with the thumbnail inside it and both of the event's counts
 * raised for it, then uploading the full photo to Storage. Members watch an
 * event's photos with their thumbnails decrypted, open a full photo, and the
 * uploader or the group's owner deletes one. Decrypted photos are kept in
 * memory while the app is open, so a photo is decrypted once.
 *
 * Photos shared close together post one chat line between them: a member's
 * burst of uploads for an event posts it once nothing has been on its way for
 * 60 seconds, or as soon as they leave the photos or switch away from the
 * app, waiting for any upload still on its way. A burst in which nothing was
 * shared posts nothing.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type BurRecTyp = { eveIdeStr : string, fluBoo : boolean, groIdeStr : string, infNum : number, sucBoo : boolean, timNum : number, titTexStr : string };                // What: Burst Record Type. Why: A burst of uploads for one event posts one line once it's done. How: This types its event, whether it was asked to post, how many uploads are on their way, whether any landed, its timer, and the event's title.
type PhoRecTyp = { creTimNum : number, fulIvaArr : Uint8Array< ArrayBuffer >, phoIdeStr : string, thuBytArr : Uint8Array< ArrayBuffer > | null, uplUidStr : string }; // What: Photo Record Type. Why: The grid shows each photo's thumbnail and who shared it, and opening one needs its full photo's IV. How: This types a photo, its thumbnail null when it won't decrypt.

// #endregion Types



// #region Constants

const BUR_MIL_NUM = 60000; // What: Burst Milliseconds Number. Why: Photos shared within a minute of each other are one burst. How: This is how long the line waits after the last upload.

// #endregion Constants



// #region Module State

const BUR_MAP_OBJ = new Map< string, BurRecTyp >();                 // What: Burst Map Object. Why: Each event's burst waits on its own. How: This holds the open bursts by group and event.
const CAC_MAP_OBJ = new Map< string, Uint8Array< ArrayBuffer > >(); // What: Cache Map Object. Why: A photo is decrypted once while the app is open. How: This holds decrypted thumbnails and full photos by path.

// #endregion Module State



// #region Helpers

const phoPatFun = ( groIdeStr : string, eveIdeStr : string, phoIdeStr : string ) : string => `groups/${ groIdeStr }/events/${ eveIdeStr }/photos/${ phoIdeStr }`; // What: Photo Path Function. Why: A photo's document and its full photo share one path. How: This builds it.



// #region burPosFun

/**
 * burPosFun = Burst Post Function
 *
 * @summary
 * Ends a burst: it forgets the burst and, when any of its uploads landed,
 * posts the chat line naming the event, logging a post that fails rather
 * than throwing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The burst's group and event.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * burPosFun('Xk3.../Ev7...') // => void
 * ```
 *
*/

const burPosFun = ( keyValStr : string ) : void => { // What: Burst Post Function. Why: A finished burst tells the group once. How: This forgets the burst and posts its line when something was shared.


	const burRecObj = BUR_MAP_OBJ.get( keyValStr ); // What: Burst Record Object. Why: The line names the burst's event. How: This reads the burst.


	if ( burRecObj === undefined ) return; // What: Gone Guard. Why: A burst already posted has nothing more to say. How: This returns.



	BUR_MAP_OBJ.delete( keyValStr ); // What: Burst Delete Call. Why: The next upload starts a new burst. How: This forgets this one.

	window.clearTimeout( burRecObj.timNum ); // What: Timer Clear Call. Why: A burst posted early shouldn't post again. How: This stops its timer.


	if ( burRecObj.sucBoo ) chaPhoFun( burRecObj.groIdeStr, burRecObj.eveIdeStr, burRecObj.titTexStr ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Line Post Call. Why: The group hears photos were shared, and a post that fails shouldn't break anything. How: This posts the line when anything landed, logging a failure.


};

// #endregion burPosFun



// #region burEndFun

/**
 * burEndFun = Burst End Function
 *
 * @summary
 * Counts one upload of a burst as finished, landed or not. Once nothing is
 * on its way, a burst asked to post posts now, and any other waits 60
 * seconds for more photos before it posts.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The burst's group and event.
 * @param sucValBoo - Success Value Boolean: Whether the upload landed.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * burEndFun('Xk3.../Ev7...', true) // => void
 * ```
 *
*/

const burEndFun = ( keyValStr : string, sucValBoo : boolean ) : void => { // What: Burst End Function. Why: The line waits until the member is done. How: This counts the upload finished and posts now or after the wait once nothing is on its way.


	const burRecObj = BUR_MAP_OBJ.get( keyValStr ); // What: Burst Record Object. Why: The upload belongs to its burst. How: This reads it.


	if ( burRecObj === undefined ) return; // What: Gone Guard. Why: A burst already posted has nothing to count. How: This returns.



	burRecObj.infNum -= 1;                             // What: In Flight Assignment. Why: One less upload is on its way. How: This lowers the count.
	burRecObj.sucBoo  = burRecObj.sucBoo || sucValBoo; // What: Success Assignment. Why: One landed photo is enough for the line. How: This keeps whether any landed.


	if ( burRecObj.infNum > 0 ) return; // What: Waiting Guard. Why: The member isn't done while an upload is on its way. How: This returns until the last finishes.



	if ( burRecObj.fluBoo ) burPosFun( keyValStr ); // What: Asked Post Call. Why: A member who left the photos is done. How: This posts at once.

	else burRecObj.timNum = window.setTimeout( () => burPosFun( keyValStr ), BUR_MIL_NUM ); // What: Wait Timer Assignment. Why: More photos may follow within the minute. How: This posts once the wait passes without another upload.


};

// #endregion burEndFun



// #region phoFluFun

/**
 * phoFluFun = Photos Flush Function
 *
 * @summary
 * Ends every open burst now, as when the member leaves an event's photos or
 * switches away from the app: a burst with nothing on its way posts at once,
 * and one with uploads still on their way posts as the last one finishes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * phoFluFun() // => void
 * ```
 *
*/

const phoFluFun = () : void => { // What: Photos Flush Function. Why: Leaving the photos means the member is done adding them. How: This posts each idle burst and marks each busy one to post when it's done.


	for ( const [ keyValStr, burRecObj ] of BUR_MAP_OBJ ) { // What: Burst Loop. Why: Every open burst ends. How: This goes through each.


		if ( burRecObj.infNum === 0 ) burPosFun( keyValStr ); // What: Idle Post Call. Why: A burst with nothing on its way is done. How: This posts it.

		else burRecObj.fluBoo = true; // What: Busy Mark Assignment. Why: A burst still uploading posts once it's done. How: This asks it to post as its last upload finishes.


	}


};

// #endregion phoFluFun



// #region phoRecFun

/**
 * phoRecFun = Photo Record Function
 *
 * @summary
 * Turns a photo document into a record, decrypting its thumbnail under the
 * group key, or reading it from memory once decrypted. A thumbnail that won't
 * decrypt, as when another member altered it, comes back null.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groKeyObj - Group Key Object: The group's key.
 * @param patValStr - Path Value String: The photo's path.
 * @param phoDocObj - Photo Document Object: The photo's document.
 *
 * @returns A promise that resolves with the record.
 *
 * @example
 * ```ts
 * phoRecFun(groKeyObj, patValStr, phoDocObj) // => { phoIdeStr, ... }
 * ```
 *
*/

const phoRecFun = async ( groKeyObj : CryptoKey, patValStr : string, phoDocObj : QueryDocumentSnapshot ) : Promise< PhoRecTyp > => { // What: Photo Record Function. Why: The grid shows each photo's thumbnail. How: This reads the document and decrypts its thumbnail once.


	const cacThuArr = CAC_MAP_OBJ.get( `${ patValStr }/thumb` ); // What: Cached Thumbnail Array. Why: A thumbnail decrypted once stays decrypted. How: This reads it from memory, undefined the first time.
	const thuBytArr = cacThuArr ?? await decBytFun( groKeyObj, ( phoDocObj.get( 'thumbEnc' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >, ( phoDocObj.get( 'thumbIv' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer > ).catch( () => null ); // What: Thumbnail Bytes Array. Why: The thumbnail is stored encrypted, and one that won't decrypt shouldn't break the grid. How: This decrypts it, null when it won't. // What: Type Assertion Note. Why: The rules store both as bytes, and toUint8Array returns an array over a plain buffer. How: The as read them as such.


	if ( thuBytArr !== null ) CAC_MAP_OBJ.set( `${ patValStr }/thumb`, thuBytArr ); // What: Cache Set Call. Why: The next snapshot shouldn't decrypt it again. How: This keeps it in memory.



	return { // What: Record Return. Why: Each photo becomes one record. How: This returns its fields.


		creTimNum : ( phoDocObj.get( 'createdAt', { serverTimestamps : 'estimate' } ) as Timestamp ).toMillis(), // What: Created Time Number. Why: Photos show in the order they were shared. How: This reads the time, estimating one the server hasn't confirmed yet. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
		fulIvaArr : ( phoDocObj.get( 'fullIv' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >,          // What: Full IV Array. Why: Opening the full photo needs its IV. How: This reads it. // What: Type Assertion Note. Why: The rules store it as bytes, and toUint8Array returns an array over a plain buffer. How: The as read it as such.
		phoIdeStr : phoDocObj.id,                                                                                // What: Photo Identifier String. Why: A photo is opened and deleted by ID. How: This reads it.
		thuBytArr,                                                                                               // What: Thumbnail Bytes Array. Why: The grid shows the thumbnail. How: This passes it on, null when it won't decrypt.
		uplUidStr : phoDocObj.get( 'uploaderUid' ) as string                                                     // What: Uploader UID String. Why: The viewer names who shared it, and they can delete it. How: This reads it. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.


	};


};

// #endregion phoRecFun



// #region phoWatFun

/**
 * phoWatFun = Photos Watch Function
 *
 * @summary
 * Watches an event's photos, oldest first, reporting the records each time
 * they change, with each thumbnail decrypted. A report that finishes after a
 * later one is dropped, so the grid never steps back. Returns the function
 * that stops the watch.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param onPhoFun  - On Photos Function: Called with the records.
 * @param onErrFun  - On Error Function: Called when the watch fails.
 *
 * @returns The function that stops the watch.
 *
 * @example
 * ```ts
 * phoWatFun('Xk3...', 'Ev7...', onPhoFun, onErrFun) // => stoWatFun
 * ```
 *
*/

const phoWatFun = ( groIdeStr : string, eveIdeStr : string, onPhoFun : ( phoRecArr : PhoRecTyp[] ) => void, onErrFun : ( errValObj : Error ) => void ) : () => void => { // What: Photos Watch Function. Why: The grid fills in as members share photos. How: This watches the collection and reports its records in order.


	let seqValNum = 0; // What: Sequence Value Number. Why: Decrypting can finish out of order. How: This numbers each report, so only the latest is passed on.


	const stoWatFun = onSnapshot( query( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/photos` ), orderBy( 'createdAt' ) ), ( phoSnaObj ) => { // What: Stop Watch Function. Why: The watch stops with the grid. How: This starts the watch and keeps its stop.


		seqValNum += 1; // What: Sequence Assignment. Why: This report is now the latest. How: This numbers it.


		const seqNowNum = seqValNum; // What: Sequence Now Number. Why: A later report may finish first. How: This keeps this report's number.


		keyLoaFun( groIdeStr ).then( ( groKeyObj ) => Promise.all( phoSnaObj.docs.map( ( phoDocObj ) => phoRecFun( groKeyObj, phoPatFun( groIdeStr, eveIdeStr, phoDocObj.id ), phoDocObj ) ) ) ).then( ( phoRecArr ) => { if ( seqNowNum === seqValNum ) onPhoFun( phoRecArr ); }, onErrFun ); // What: Records Call. Why: Thumbnails decrypt with the group key, and only the latest report counts. How: This loads the key, builds each record, and reports them when no later report has started.


	}, onErrFun ); // What: Watch Options Note. Why: A refused or dropped watch is reported. How: This passes the error handler.



	return stoWatFun; // What: Stop Return. Why: The caller stops the watch. How: This returns its stop.


};

// #endregion phoWatFun



// #region phoAddFun

/**
 * phoAddFun = Photo Add Function
 *
 * @summary
 * Shares one photo to an event as this identity: shrinks it, encrypts its
 * full photo and thumbnail, writes the photo and raises both of the event's
 * counts in one transaction, from the event's deletion time as it stands,
 * then uploads the full photo. Each call is part of the event's burst, which
 * posts one chat line naming the event once the member is done. Rejects with
 * a RangeError for a file the browser can't open or shrink, and with
 * Firestore's permission-denied error when the event is full or the member
 * has added their share, as the rules refuse.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param titTexStr - Title Text String: The event's title, for the chat
 *                    line.
 * @param filValObj - File Value Object: The picked photo.
 *
 * @returns A promise that settles once the photo is shared, with no value.
 *
 * @example
 * ```ts
 * phoAddFun('Xk3...', 'Ev7...', 'Picnic', filValObj) // => Promise<void>
 * ```
 *
*/

const phoAddFun = async ( groIdeStr : string, eveIdeStr : string, titTexStr : string, filValObj : Blob ) : Promise< void > => { // What: Photo Add Function. Why: A member shares a photo from the event. How: This shrinks, encrypts, writes, and uploads it as part of the event's burst.


	const keyValStr = `${ groIdeStr }/${ eveIdeStr }`;                                                                                             // What: Key Value String. Why: The burst is the event's. How: This names it by group and event.
	const burRecObj = BUR_MAP_OBJ.get( keyValStr ) ?? { eveIdeStr, fluBoo : false, groIdeStr, infNum : 0, sucBoo : false, timNum : 0, titTexStr }; // What: Burst Record Object. Why: A photo joins the event's open burst, or starts one. How: This reads it, or makes a new one.


	burRecObj.infNum   += 1;         // What: In Flight Assignment. Why: One more upload is on its way. How: This raises the count.
	burRecObj.titTexStr = titTexStr; // What: Title Assignment. Why: The line names the event as it's titled now. How: This keeps the latest title.


	window.clearTimeout( burRecObj.timNum ); // What: Timer Clear Call. Why: Another photo means the member isn't done. How: This stops the wait.

	BUR_MAP_OBJ.set( keyValStr, burRecObj ); // What: Burst Set Call. Why: A new burst has to be found by the next photo. How: This keeps it.


	let sucValBoo = false; // What: Success Value Boolean. Why: The burst hears whether this photo landed. How: This is true once it's uploaded.



	try { // What: Share Attempt. Why: The burst has to hear the upload finished, however it ends. How: This shares the photo inside it.


		const { fulBytArr, thuBytArr } = await imaShrFun( filValObj ); // What: Full Bytes Array. Why: Members open the full photo. How: This shrinks it. // What: Thumbnail Bytes Array. Why: The grid shows the thumbnail. How: This makes it.
		const { uidValStr }            = await ideEnsFun();            // What: UID Value String. Why: The photo and the member's count name the uploader. How: This reads the identity.
		const { fstDatObj }            = firGetFun();                  // What: Firestore Data Object. Why: The transaction writes Firestore. How: This reads the service.

		const groKeyObj = await keyLoaFun( groIdeStr );                                                              // What: Group Key Object. Why: The photo is encrypted under the group key. How: This loads it.
		const fulEncObj = await encBytFun( groKeyObj, fulBytArr );                                                   // What: Full Encrypted Object. Why: Storage holds only ciphertext. How: This encrypts the full photo.
		const thuEncObj = await encBytFun( groKeyObj, thuBytArr );                                                   // What: Thumbnail Encrypted Object. Why: Firestore holds only ciphertext. How: This encrypts the thumbnail.
		const eveRefObj = doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` );                           // What: Event Reference Object. Why: The photo takes the event's deletion time. How: This names the event.
		const phoRefObj = doc( collection( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/photos` ) );      // What: Photo Reference Object. Why: A photo takes Firestore's own random ID, which the counts name. How: This draws one.
		const talAllRef = doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/photoTally/all` );            // What: Tally All Reference. Why: The event's count rises with each photo. How: This names it.
		const talMemRef = doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/photoTally/${ uidValStr }` ); // What: Tally Member Reference. Why: The member's own count rises too. How: This names it.


		await runTransaction( fstDatObj, async ( traValObj ) => { // What: Photo Transaction. Why: The counts have to rise from where they stand when the photo lands. How: This reads the event and both counts, then writes all three, retrying on a conflict.


			const eveSnaObj = await traValObj.get( eveRefObj ); // What: Event Snapshot Object. Why: The photo's deletion time is the event's. How: This reads it.
			const talAllSna = await traValObj.get( talAllRef ); // What: Tally All Snapshot. Why: The event's count rises from its current value. How: This reads it.
			const talMemSna = await traValObj.get( talMemRef ); // What: Tally Member Snapshot. Why: The member's count rises from its current value. How: This reads it.


			traValObj.set( phoRefObj, { // What: Photo Set Call. Why: The photo holds its thumbnail, its full photo's IV, and who shared it. How: This writes it, expiring with the event.


				createdAt   : serverTimestamp(),                           // What: Created At. Why: The rules require the server's time. How: This asks the server to fill it in.
				expireAt    : eveSnaObj.get( 'expireAt' ) as Timestamp,    // What: Expire At. Why: A photo goes with its event. How: This copies the event's deletion time. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
				fullIv      : Bytes.fromUint8Array( fulEncObj.iniVecArr ), // What: Full IV. Why: The full photo decrypts with its IV. How: This wraps it.
				thumbEnc    : Bytes.fromUint8Array( thuEncObj.cipTexArr ), // What: Thumbnail Encrypted. Why: The grid's thumbnail sits in the document. How: This wraps its ciphertext.
				thumbIv     : Bytes.fromUint8Array( thuEncObj.iniVecArr ), // What: Thumbnail IV. Why: The thumbnail decrypts with its IV. How: This wraps it.
				uploaderUid : uidValStr                                    // What: Uploader UID. Why: The photo names who shared it. How: This sets the identity's UID.


			} );

			traValObj.set( talAllRef, { // What: Tally All Set Call. Why: The event's count rises for this photo. How: This writes it one higher, naming the photo.


				count       : ( ( talAllSna.get( 'count' ) as number | undefined ) ?? 0 ) + 1, // What: Count. Why: Each photo raises the event's count by one. How: This adds one to the count, or starts it. // What: Type Assertion Note. Why: The rules keep the count a number. How: The as reads it as one, or missing.
				lastPhotoId : phoRefObj.id                                                     // What: Last Photo ID. Why: The rise is for this photo. How: This names it.


			} );

			traValObj.set( talMemRef, { // What: Tally Member Set Call. Why: The member's count rises for this photo. How: This writes it one higher, naming the photo.


				count       : ( ( talMemSna.get( 'count' ) as number | undefined ) ?? 0 ) + 1, // What: Count. Why: Each photo raises the member's count by one. How: This adds one to the count, or starts it. // What: Type Assertion Note. Why: The rules keep the count a number. How: The as reads it as one, or missing.
				lastPhotoId : phoRefObj.id                                                     // What: Last Photo ID. Why: The rise is for this photo. How: This names it.


			} );


		} );


		CAC_MAP_OBJ.set( `${ phoPatFun( groIdeStr, eveIdeStr, phoRefObj.id ) }/full`, fulBytArr ); // What: Full Cache Call. Why: The uploader's own photo opens without downloading it back. How: This keeps it in memory.

		await uploadBytes( ref( firGetFun().stoValObj, `photos/${ groIdeStr }/${ eveIdeStr }/${ phoRefObj.id }` ), fulEncObj.cipTexArr, { contentType : 'application/octet-stream' } ); // What: Upload Call. Why: Members open the full photo from Storage. How: This uploads its ciphertext as generic binary.


		sucValBoo = true; // What: Success Assignment. Why: The burst's line says photos were shared. How: This marks this one landed.


	}

	finally { burEndFun( keyValStr, sucValBoo ); } // What: Burst End Call. Why: The burst waits on every upload, however it ends. How: This counts this one finished.


};

// #endregion phoAddFun



// #region phoGetFun

/**
 * phoGetFun = Photo Get Function
 *
 * @summary
 * Resolves with a photo's full image, downloaded and decrypted under the
 * group key, or read from memory once opened. Rejects when the full photo
 * isn't in Storage yet, as while its upload is still on its way, or won't
 * decrypt.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param phoRecObj - Photo Record Object: The photo to open.
 *
 * @returns A promise that resolves with the full photo's bytes.
 *
 * @example
 * ```ts
 * phoGetFun('Xk3...', 'Ev7...', phoRecObj) // => Uint8Array
 * ```
 *
*/

const phoGetFun = async ( groIdeStr : string, eveIdeStr : string, phoRecObj : PhoRecTyp ) : Promise< Uint8Array< ArrayBuffer > > => { // What: Photo Get Function. Why: A member opens a full photo. How: This downloads and decrypts it once.


	const patValStr = phoPatFun( groIdeStr, eveIdeStr, phoRecObj.phoIdeStr ); // What: Path Value String. Why: The full photo is kept and filed by its path. How: This builds it.
	const cacFulArr = CAC_MAP_OBJ.get( `${ patValStr }/full` );               // What: Cached Full Array. Why: A photo opened once stays open. How: This reads it from memory, undefined the first time.


	if ( cacFulArr !== undefined ) return cacFulArr; // What: Cached Return. Why: A photo already opened needs no download. How: This returns it.



	const cipBytBuf = await getBytes( ref( firGetFun().stoValObj, `photos/${ groIdeStr }/${ eveIdeStr }/${ phoRecObj.phoIdeStr }` ) ); // What: Cipher Bytes Buffer. Why: The full photo is stored encrypted. How: This downloads it.

	const fulBytArr = await decBytFun( await keyLoaFun( groIdeStr ), new Uint8Array( cipBytBuf ), phoRecObj.fulIvaArr ); // What: Full Bytes Array. Why: The photo opens decrypted. How: This decrypts it with the group key and its IV.


	CAC_MAP_OBJ.set( `${ patValStr }/full`, fulBytArr ); // What: Cache Set Call. Why: Opening it again shouldn't download it again. How: This keeps it in memory.



	return fulBytArr; // What: Full Return. Why: The viewer shows it. How: This returns its bytes.


};

// #endregion phoGetFun



const phoDelFun = ( groIdeStr : string, eveIdeStr : string, phoIdeStr : string ) : Promise< void > => deleteDoc( doc( firGetFun().fstDatObj, phoPatFun( groIdeStr, eveIdeStr, phoIdeStr ) ) ); // What: Photo Delete Function. Why: The uploader or owner takes a photo down, and a Cloud Function deletes its full photo. How: This deletes its document.

// #endregion Helpers



// #region Module Init

document.addEventListener( 'visibilitychange', () => { if ( document.visibilityState === 'hidden' ) phoFluFun(); } ); // What: Hidden Flush Listener. Why: A member who switches away from the app is done adding photos for now. How: This ends every open burst when the page is hidden.

// #endregion Module Init



// #region Exports

export { phoAddFun, phoDelFun, phoFluFun, phoGetFun, type PhoRecTyp, phoWatFun }; // What: Named Exports. Why: The event's photos part shares, shows, opens, and deletes photos through these, and ends a burst when the member leaves. How: This exports the functions and the record's type.

// #endregion Exports


