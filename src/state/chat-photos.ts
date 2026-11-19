


// #region Imports

import { chaShrFun       } from '../platform/image.ts';            // What: Chat Shrink Function. Why: A camera's photo is far too large to send to every member. How: This shrinks it to the chat's size.
import { collection      } from 'firebase/firestore';              // What: Collection. Why: A chat photo takes a new ID in the group's collection. How: This names the collection.
import { cpsGetFun       } from '../platform/chat-photo-store.ts'; // What: Chat-Photo-Store Get Function. Why: A photo kept on the device opens without a download. How: This reads it.
import { cpsPruFun       } from '../platform/chat-photo-store.ts'; // What: Chat-Photo-Store Prune Function. Why: Old photos are cleared from the device. How: This deletes the ones sent before a time.
import { cpsSetFun       } from '../platform/chat-photo-store.ts'; // What: Chat-Photo-Store Set Function. Why: A sent or received photo is kept on the device. How: This writes it.
import { decBytFun       } from '../platform/crypto.ts';           // What: Decrypt Bytes Function. Why: A chat photo is kept encrypted. How: This decrypts it.
import { doc             } from 'firebase/firestore';              // What: Doc. Why: A photo and the day's tallies are named by path. How: This builds a reference.
import { encBytFun       } from '../platform/crypto.ts';           // What: Encrypt Bytes Function. Why: A chat photo is sent encrypted. How: This encrypts it under the group key.
import { firGetFun       } from '../platform/firebase.ts';         // What: Firebase Get Function. Why: Chat photos live in Firestore and Storage. How: This returns the services.
import { getBytes        } from 'firebase/storage';                // What: Get Bytes. Why: A member's device fetches each chat photo once. How: This downloads it.
import { ideEnsFun       } from './identity.ts';                   // What: Identity Ensure Function. Why: A photo and the member's tally name the sender. How: This reads the identity.
import { keyLoaFun       } from './groups.ts';                     // What: Key Load Function. Why: Chat photos are encrypted with the group key. How: This loads it.
import { ref             } from 'firebase/storage';                // What: Ref. Why: A chat photo's file is named by path. How: This builds its reference.
import { runTransaction  } from 'firebase/firestore';              // What: Run Transaction. Why: A photo and the day's two counts are written as one, from the counts as they stand. How: This reads and writes them together.
import { serverTimestamp } from 'firebase/firestore';              // What: Server Timestamp. Why: The rules require the server's time on a photo. How: This asks the server to fill it in.
import { Timestamp       } from 'firebase/firestore';              // What: Timestamp. Why: A photo's and the tallies' backstop times are Firestore timestamps. How: This builds them.
import { updHolFun       } from '../platform/update.ts';           // What: Update Hold Function. Why: A quiet update reload mid-send would lose what's being sent. How: This holds the reload while each send or upload runs.
import { uploadBytes     } from 'firebase/storage';                // What: Upload Bytes. Why: The photo's file goes to Storage. How: This uploads it.

// #endregion Imports



/**
 * chat-photos.ts = Chat Photos
 *
 * @summary
 * The photos sent in a group's chat (ARCHITECTURE.md Section 22), one to a
 * message. Sending one shrinks it on the device, encrypts it under the group
 * key, writes, in one transaction, its document and the day's group and member
 * tallies raised for it, uploads the file to Storage, and keeps the encrypted
 * copy on the device. The day runs from 08:00 UTC, counted from the server's
 * time the caller gives, as the rules count it. A member's device fetches each
 * photo it receives once, before it acknowledges the message, and keeps it
 * encrypted, and opens it from there. Decrypted photos are held in memory
 * while the app is open, so a photo is decrypted once, until photos are
 * cleared from the device.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type ChpSenTyp = { iniVecArr : Uint8Array< ArrayBuffer >, phoIdeStr : string }; // What: Chat-Photo Sent Type. Why: The message that carries a photo names it and how it decrypts. How: This types the photo's IV and ID.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: The limits and backstops are counted in days. How: This is one day in milliseconds.
const DAY_OFF_NUM = 28800000; // What: Day Offset Number. Why: A day of the limits runs from 08:00 UTC, so it turns over at night across the US (Section 22). How: This is the 8 hours taken off the time before days are counted.

// #endregion Constants



// #region Module State

const CAC_MAP_OBJ = new Map< string, Uint8Array< ArrayBuffer > >(); // What: Cache Map Object. Why: A photo is decrypted once while the app is open. How: This holds decrypted photos by group and photo.

// #endregion Module State



// #region Helpers

const dayKeyFun = ( srvTimNum : number ) : number => Math.trunc( ( srvTimNum - DAY_OFF_NUM ) / DAY_MIL_NUM );       // What: Day Key Function. Why: The tallies are named by the day, as the rules count it. How: This counts whole days since 1970 from 8 hours before the time given.
const resTimFun = ( srvTimNum : number ) : number => ( dayKeyFun( srvTimNum ) + 1 ) * DAY_MIL_NUM + DAY_OFF_NUM; // What: Reset Time Function. Why: A member who reached a limit is told when they can send more. How: This returns the next day's start, 08:00 UTC, in milliseconds.



// #region chpFetFun

/**
 * chpFetFun = Chat-Photo Fetch Function
 *
 * @summary
 * Makes sure a chat photo a member received is kept on this device, before
 * its message is acknowledged: a photo already kept is left, and any other
 * is downloaded once and kept, still encrypted, with its IV and its
 * message's time. Resolves with 'kept' once it's on the device, or 'gone'
 * when its file is no longer on the server, as for a photo whose sender
 * deleted their data. Rejects when the download fails for any other reason,
 * such as the connection dropping, so the message waits to be read again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param phoIdeStr - Photo Identifier String: The photo's ID.
 * @param iniVecArr - Initialization Vector Array: The photo's IV.
 * @param sntTimNum - Sent Time Number: When its message was sent.
 *
 * @returns A promise that resolves with 'kept' or 'gone'.
 *
 * @example
 * ```ts
 * chpFetFun('Xk3...', 'Pq8...', iniVecArr, 1763000000000) // => 'kept'
 * ```
 *
*/

const chpFetFun = async ( groIdeStr : string, phoIdeStr : string, iniVecArr : Uint8Array< ArrayBuffer >, sntTimNum : number ) : Promise< 'gone' | 'kept' > => { // What: Chat-Photo Fetch Function. Why: Every member's device has a photo before its message leaves the server (Section 22). How: This downloads and keeps it once.


	const keyValStr = `${ groIdeStr }/${ phoIdeStr }`; // What: Key Value String. Why: The photo is kept under its group and ID. How: This builds the key.


	if ( await cpsGetFun( keyValStr ) !== null ) return 'kept'; // What: Kept Guard. Why: A photo already on the device needs no download. How: This resolves at once.



	try { // What: Download Attempt. Why: A file already gone is no failure, while anything else is. How: This downloads inside it.


		const cipBytBuf = await getBytes( ref( firGetFun().stoValObj, `chatPhotos/${ groIdeStr }/${ phoIdeStr }` ) ); // What: Cipher Bytes Buffer. Why: The photo is stored encrypted. How: This downloads it.


		await cpsSetFun( keyValStr, { cipBytArr : new Uint8Array( cipBytBuf ), iniVecArr, sntTimNum } ); // What: Keep Call. Why: The photo opens from the device from now on. How: This keeps it encrypted, with its IV and time.


	}

	catch ( errCatObj ) { // What: Download Failure. Why: A gone file means the photo can't be had, and anything else may pass. How: This resolves 'gone' for a missing file and rethrows the rest.


		if ( Reflect.get( Object( errCatObj ), 'code' ) === 'storage/object-not-found' ) return 'gone'; // What: Gone Guard. Why: A photo deleted from the server won't come back. How: This resolves 'gone'.



		throw errCatObj; // What: Rethrow. Why: The message waits to be read again. How: This passes the failure on.


	}



	return 'kept'; // What: Kept Return. Why: The photo is on the device. How: This resolves 'kept'.


};

// #endregion chpFetFun



// #region chpGetFun

/**
 * chpGetFun = Chat-Photo Get Function
 *
 * @summary
 * Resolves with a chat photo's bytes, decrypted under the group key from the
 * copy kept on this device, or read from memory once opened, or null when
 * this device doesn't keep it, as for a photo cleared from it or one that
 * was gone before it arrived. Rejects when the kept copy won't decrypt.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param phoIdeStr - Photo Identifier String: The photo's ID.
 *
 * @returns A promise that resolves with the photo's bytes, or null.
 *
 * @example
 * ```ts
 * chpGetFun('Xk3...', 'Pq8...') // => Uint8Array
 * ```
 *
*/

const chpGetFun = async ( groIdeStr : string, phoIdeStr : string ) : Promise< Uint8Array< ArrayBuffer > | null > => { // What: Chat-Photo Get Function. Why: A message shows its photo. How: This decrypts the kept copy once.


	const keyValStr = `${ groIdeStr }/${ phoIdeStr }`; // What: Key Value String. Why: The photo is kept and held by its group and ID. How: This builds the key.
	const cacBytArr = CAC_MAP_OBJ.get( keyValStr );    // What: Cached Bytes Array. Why: A photo decrypted once stays decrypted. How: This reads it from memory, undefined the first time.


	if ( cacBytArr !== undefined ) return cacBytArr; // What: Cached Return. Why: A photo already decrypted needs no work. How: This returns it.



	const cpsRecObj = await cpsGetFun( keyValStr ); // What: Chat-Photo-Store Record Object. Why: The photo opens from the device's copy. How: This reads it.


	if ( cpsRecObj === null ) return null; // What: Missing Guard. Why: A photo this device doesn't keep can't show. How: This resolves null.



	const phoBytArr = await decBytFun( await keyLoaFun( groIdeStr ), cpsRecObj.cipBytArr, cpsRecObj.iniVecArr ); // What: Photo Bytes Array. Why: The photo shows decrypted. How: This decrypts it with the group key and its IV.


	CAC_MAP_OBJ.set( keyValStr, phoBytArr ); // What: Cache Set Call. Why: Showing it again shouldn't decrypt it again. How: This keeps it in memory.



	return phoBytArr; // What: Photo Return. Why: The message shows it. How: This returns its bytes.


};

// #endregion chpGetFun



// #region chpPruFun

/**
 * chpPruFun = Chat-Photo Prune Function
 *
 * @summary
 * Deletes from this device every chat photo whose message was sent before
 * the time given, and forgets the photos decrypted in memory, so none of the
 * deleted ones still shows. Resolves with how many it deleted.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param cutTimNum - Cutoff Time Number: The time, in milliseconds, before
 *                    which photos go.
 *
 * @returns A promise that resolves with the count of photos deleted.
 *
 * @example
 * ```ts
 * chpPruFun(Date.now() - 90 * 86400000) // => 12
 * ```
 *
*/

const chpPruFun = async ( cutTimNum : number ) : Promise< number > => { // What: Chat-Photo Prune Function. Why: A device keeps chat photos only as long as its member chose, or until they clear them (Section 22). How: This deletes the older ones and empties the memory.


	const delCouNum = await cpsPruFun( cutTimNum ); // What: Deleted Count Number. Why: The caller says how many went. How: This deletes the older photos, counting them.


	CAC_MAP_OBJ.clear(); // What: Cache Clear Call. Why: A deleted photo mustn't keep showing from memory. How: This forgets every decrypted photo, which the kept ones decrypt again when shown.



	return delCouNum; // What: Count Return. Why: The caller says how many went. How: This returns the count.


};

// #endregion chpPruFun



// #region chpSenFun

/**
 * chpSenFun = Chat-Photo Send Function
 *
 * @summary
 * Gets a picked photo ready to send in a group's chat: shrinks and encrypts
 * it, writes its document and raises the day's group and member tallies in
 * one transaction, uploads its file, and keeps the encrypted copy on this
 * device, timed by the server's time given, and its decrypted bytes in
 * memory. Resolves with the photo's ID and IV for its message. Rejects with
 * a RangeError naming the reset time when the rules refuse the photo, which
 * they do once a day's limit is reached, and with the error itself for any
 * other failure, such as a photo the browser can't decode.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param filValObj - File Value Object: The picked photo.
 * @param srvTimNum - Server Time Number: The server's time as the device
 *                    estimates it, which names the day.
 *
 * @returns A promise that resolves with the photo's ID and IV.
 *
 * @example
 * ```ts
 * chpSenFun('Xk3...', filValObj, 1763000000000) // => { phoIdeStr, ... }
 * ```
 *
*/

const chpSenFun = updHolFun( async ( groIdeStr : string, filValObj : Blob, srvTimNum : number ) : Promise< ChpSenTyp > => { // What: Chat-Photo Send Function. Why: A member attaches a photo to a message (Section 22). How: This shrinks, encrypts, counts, uploads, and keeps it. // What: Update Hold Note. Why: A quiet update reload mid-send would lose what this sends. How: updHolFun holds the reload while each call runs.


	const phoBytArr     = await chaShrFun( filValObj ); // What: Photo Bytes Array. Why: Every member downloads the photo, so it's sent small. How: This shrinks it.
	const { uidValStr } = await ideEnsFun();            // What: UID Value String. Why: The photo and the member's tally name the sender. How: This reads the identity.
	const { fstDatObj } = firGetFun();                  // What: Firestore Data Object. Why: The transaction writes Firestore. How: This reads the service.

	const dayKeyNum = dayKeyFun( srvTimNum );                                                                  // What: Day Key Number. Why: The tallies are named by today. How: This counts it from the server's time.
	const groKeyObj = await keyLoaFun( groIdeStr );                                                           // What: Group Key Object. Why: The photo is encrypted under the group key. How: This loads it.
	const phoEncObj = await encBytFun( groKeyObj, phoBytArr );                                                // What: Photo Encrypted Object. Why: Storage holds only ciphertext. How: This encrypts the photo.
	const phoRefObj = doc( collection( fstDatObj, `groups/${ groIdeStr }/chatPhotos` ) );                     // What: Photo Reference Object. Why: A photo takes Firestore's own random ID, which the tallies and the message name. How: This draws one.
	const talAllRef = doc( fstDatObj, `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-all` );            // What: Tally All Reference. Why: The group's count for the day rises with each photo. How: This names it.
	const talMemRef = doc( fstDatObj, `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-${ uidValStr }` ); // What: Tally Member Reference. Why: The member's own count for the day rises too. How: This names it.
	const talExpObj = Timestamp.fromMillis( Date.now() + 2 * DAY_MIL_NUM );                                   // What: Tally Expire Object. Why: A day's tally is no use once its day is over. How: This sets its backstop 2 days out.



	try { // What: Count Attempt. Why: A refusal here means a day's limit is reached, which the member is told about. How: This writes the photo and its counts inside it.


		await runTransaction( fstDatObj, async ( traValObj ) => { // What: Photo Transaction. Why: The counts have to rise from where they stand when the photo lands. How: This reads both counts, then writes all three, retrying on a conflict.


			const talAllSna = await traValObj.get( talAllRef ); // What: Tally All Snapshot. Why: The group's count rises from its current value. How: This reads it.
			const talMemSna = await traValObj.get( talMemRef ); // What: Tally Member Snapshot. Why: The member's count rises from its current value. How: This reads it.


			traValObj.set( phoRefObj, { // What: Photo Set Call. Why: The photo's document is what its file and the tallies are checked against. How: This writes it in the member's name.


				createdAt   : serverTimestamp(),                                       // What: Created At. Why: The rules require the server's time. How: This asks the server to fill it in.
				expireAt    : Timestamp.fromMillis( Date.now() + 181 * DAY_MIL_NUM ), // What: Expire At. Why: The document's backstop sits a day past the longest chat retention. How: This sets it 181 days out.
				uploaderUid : uidValStr                                                // What: Uploader UID. Why: The photo names who sent it. How: This sets the identity's UID.


			} );

			traValObj.set( talAllRef, { // What: Tally All Set Call. Why: The group's count for the day rises for this photo. How: This writes it one higher, naming the photo.


				count       : ( ( talAllSna.get( 'count' ) as number | undefined ) ?? 0 ) + 1, // What: Count. Why: Each photo raises the group's count by one. How: This adds one to the count, or starts it. // What: Type Assertion Note. Why: The rules keep the count a number. How: The as reads it as one, or missing.
				expireAt    : talExpObj,                                                       // What: Expire At. Why: The tally's backstop. How: This sets it 2 days out.
				lastPhotoId : phoRefObj.id                                                     // What: Last Photo ID. Why: The rise is for this photo. How: This names it.


			} );

			traValObj.set( talMemRef, { // What: Tally Member Set Call. Why: The member's count for the day rises for this photo. How: This writes it one higher, naming the photo.


				count       : ( ( talMemSna.get( 'count' ) as number | undefined ) ?? 0 ) + 1, // What: Count. Why: Each photo raises the member's count by one. How: This adds one to the count, or starts it. // What: Type Assertion Note. Why: The rules keep the count a number. How: The as reads it as one, or missing.
				expireAt    : talExpObj,                                                       // What: Expire At. Why: The tally's backstop. How: This sets it 2 days out.
				lastPhotoId : phoRefObj.id                                                     // What: Last Photo ID. Why: The rise is for this photo. How: This names it.


			} );


		} );


	}

	catch ( errCatObj ) { // What: Count Failure. Why: The member is told when a limit stops them, and anything else passes on as it is. How: This turns a refusal into a RangeError naming the reset time.


		if ( Reflect.get( Object( errCatObj ), 'code' ) === 'permission-denied' ) throw new RangeError( String( resTimFun( srvTimNum ) ) ); // What: Limit Throw. Why: The rules refuse a photo past a day's limit. How: This rejects with the next reset time, in milliseconds, as the message.



		throw errCatObj; // What: Rethrow. Why: Any other failure reaches the caller as it is. How: This passes it on.


	}



	await uploadBytes( ref( firGetFun().stoValObj, `chatPhotos/${ groIdeStr }/${ phoRefObj.id }` ), phoEncObj.cipTexArr, { contentType : 'application/octet-stream' } ); // What: Upload Call. Why: Members fetch the photo from Storage. How: This uploads its ciphertext as generic binary.

	await cpsSetFun( `${ groIdeStr }/${ phoRefObj.id }`, { cipBytArr : phoEncObj.cipTexArr, iniVecArr : phoEncObj.iniVecArr, sntTimNum : srvTimNum } ); // What: Keep Call. Why: The sender keeps their own photo with the chat. How: This keeps it encrypted on the device.


	CAC_MAP_OBJ.set( `${ groIdeStr }/${ phoRefObj.id }`, phoBytArr ); // What: Cache Set Call. Why: The sender's own photo shows without decrypting it back. How: This keeps it in memory.



	return { iniVecArr : phoEncObj.iniVecArr, phoIdeStr : phoRefObj.id }; // What: Sent Return. Why: The message names the photo and how it decrypts. How: This returns its IV and ID.


} );

// #endregion chpSenFun

// #endregion Helpers



// #region Exports

export { chpFetFun, chpGetFun, chpPruFun, chpSenFun, type ChpSenTyp, resTimFun }; // What: Named Exports. Why: The chat sends, fetches, and shows its photos through these, the device clears old ones, and a member at a limit learns when they can send more. How: This exports the functions and the sent photo's type.

// #endregion Exports


