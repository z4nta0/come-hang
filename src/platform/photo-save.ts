


// #region Imports

import { imaTypFun } from './image.ts';       // What: Image Type Function. Why: A shared photo's bytes carry no type. How: This reads it from their first bytes.
import { jpeConFun } from './image.ts';       // What: JPEG Convert Function. Why: A saved photo should open wherever it goes. How: This converts a WebP photo to JPEG and leaves a JPEG as it is.
import { zipBuiFun } from '../utils/zip.ts'; // What: ZIP Build Function. Why: Several photos download to a computer as one file. How: This packs them into one archive.

// #endregion Imports



/**
 * photo-save.ts = Photo Save
 *
 * @summary
 * Hands shared photos to the device (ARCHITECTURE.md Sections 20 and 22),
 * since they leave the server: the share sheet on a touch screen, which
 * saves them to the photo library, and a download on a computer, one photo
 * as itself and several as one ZIP archive. A WebP photo is converted to
 * JPEG as it's saved, and a JPEG one kept as it is. Preparing the photos is
 * kept apart from handing them over, since a browser opens its share sheet
 * only shortly after a press, and many photos take longer than that to get
 * ready. Shared photos go in batches of at most 10 files and 40 MB, one
 * batch per press, since Chrome refuses a share of more than 10 files or
 * 50 MB.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type SavPreTyp = { batArr : File[][], bytArr : Uint8Array< ArrayBuffer >[], filArr : File[], shaBoo : boolean }; // What: Save Prepared Type. Why: Photos are prepared in one step and handed over in another, a batch at a time where they're shared. How: This holds their files in batches, their converted bytes, their files in one list, and whether the device shares them.

// #endregion Types



// #region Constants

const BAT_BYT_NUM = 40 * 1024 * 1024; // What: Batch Bytes Number. Why: Chrome refuses a share past 50 MB, so a batch stays safely under it. How: This is 40 MB in bytes.
const BAT_FIL_NUM = 10;               // What: Batch Files Number. Why: Chrome refuses a share of more than 10 files. How: This is the most files in one batch.

// #endregion Constants



// #region Helpers

// #region dowFilFun

/**
 * dowFilFun = Download File Function
 *
 * @summary
 * Downloads a file under the given name through a link off the page, freeing
 * the link's temporary address a minute later, once the download has had
 * time to read it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param blbValObj - Blob Value Object: The file's contents.
 * @param namValStr - Name Value String: The name it's saved under.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * dowFilFun(zipBlbObj, 'come-hang-lake-day-photos.zip') // => void
 * ```
 *
*/

const dowFilFun = ( blbValObj : Blob, namValStr : string ) : void => { // What: Download File Function. Why: A computer keeps photos as downloads. How: This clicks a link to the file off the page.


	const ancEleObj = document.createElement( 'a' );    // What: Anchor Element Object. Why: A download starts from a link. How: This makes one off the page.
	const objUrlStr = URL.createObjectURL( blbValObj ); // What: Object URL String. Why: The link needs an address for the file. How: This makes a temporary one.


	ancEleObj.download = namValStr; // What: Download Assignment. Why: The file keeps its name. How: This names it.
	ancEleObj.href     = objUrlStr; // What: Address Assignment. Why: The link points at the file. How: This sets its address.


	ancEleObj.click(); // What: Download Click Call. Why: The download starts as if the link were tapped. How: This clicks it.


	window.setTimeout( () => URL.revokeObjectURL( objUrlStr ), 60000 ); // What: Address Free Call. Why: The download needs the address a little while. How: This frees it a minute later.


};

// #endregion dowFilFun



// #region filBatFun

/**
 * filBatFun = Files Batch Function
 *
 * @summary
 * Splits files, in order, into the batches a share sheet takes: each holds
 * at most 10 files and at most 40 MB, except that a file bigger than that on
 * its own still gets a batch to itself.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filValArr - File Value Array: The files, in order.
 *
 * @returns The batches, in order.
 *
 * @see {@link filBatArr}
 *
 * @example
 * ```ts
 * filBatFun(filValArr) // => [ [ file1, ..., file10 ], [ file11, file12 ] ]
 * ```
 *
*/

const filBatFun = ( filValArr : File[] ) : File[][] => { // What: Files Batch Function. Why: A share of too many files, or too many bytes, is refused. How: This fills each batch until the next file would pass either limit.


	const filBatArr : File[][] = []; // What: File Batch Array. Why: The batches are collected in order. How: This starts empty.


	let batBytNum = 0; // What: Batch Bytes Number. Why: A batch closes before it passes the size limit. How: This counts the open batch's bytes.


	for ( const filValObj of filValArr ) { // What: File Loop. Why: Each file joins the open batch or starts the next. How: This places each in order.


		const lasBatArr = filBatArr.at( -1 ); // What: Last Batch Array. Why: A file joins the open batch while it fits. How: This reads the latest batch, undefined before the first.

		const batFulBoo = lasBatArr === undefined || lasBatArr.length >= BAT_FIL_NUM || batBytNum + filValObj.size > BAT_BYT_NUM; // What: Batch Full Boolean. Why: A file that would pass either limit starts a new batch. How: This is true with no batch yet, a batch of 10, or one the file would take past 40 MB.


		if ( batFulBoo ) filBatArr.push( [ filValObj ] ); // What: New Batch Call. Why: The file doesn't fit the open batch. How: This starts the next batch with it.

		else lasBatArr.push( filValObj ); // What: Join Batch Call. Why: The file fits the open batch. How: This adds it.


		batBytNum = batFulBoo ? filValObj.size : batBytNum + filValObj.size; // What: Bytes Count Assignment. Why: The count follows the open batch. How: This restarts it for a new batch, or adds the file's size.


	}



	return filBatArr; // What: Batches Return. Why: The hand-over shares one batch per press. How: This returns them in order.


};

// #endregion filBatFun



// #region savHanFun

/**
 * savHanFun = Save Hand Function
 *
 * @summary
 * Hands prepared photos to the device. Where they're to be shared, one
 * batch goes to the share sheet, asked for before anything is awaited,
 * since a browser only opens it while a press still counts, so it expects
 * to be called straight from the press. A share the member backs out of is
 * no error, and resolves false so the caller can offer the batch again.
 * Anywhere else one photo downloads as itself, and several download as one
 * ZIP archive under the given name, so a computer gets one file rather than
 * one download, and in some browsers one tab, per photo.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param savPreObj - Save Prepared Object: The photos, as savPreFun
 *                    prepared them.
 * @param zipNamStr - ZIP Name String: The archive's name, for several
 *                    photos.
 * @param batIndNum - Batch Index Number: Which batch to share, 0 by
 *                    default, unused for a download.
 *
 * @returns A promise that resolves with true once the photos are handed
 *          over, or false when the member backed out of the share sheet.
 *
 * @example
 * ```ts
 * savHanFun(savPreObj, 'come-hang-photos.zip', 1) // => true
 * ```
 *
*/

const savHanFun = async ( savPreObj : SavPreTyp, zipNamStr : string, batIndNum = 0 ) : Promise< boolean > => { // What: Save Hand Function. Why: Prepared photos go to the share sheet or a download. How: This shares one batch where they're to be shared, or downloads them all as one file.


	if ( savPreObj.shaBoo ) return navigator.share( { files : savPreObj.batArr[ batIndNum ] } ).then( () => true, ( errCatObj : unknown ) => { if ( Reflect.get( Object( errCatObj ), 'name' ) !== 'AbortError' ) throw errCatObj; return false; } ); // What: Share Return. Why: A phone or tablet saves shared photos to its library, the sheet opens only while the press that asked still counts, and backing out of it isn't a failure. How: This shares the batch before anything is awaited, resolving true once shared and false for a cancel.



	if ( savPreObj.filArr.length === 1 ) { dowFilFun( savPreObj.filArr[ 0 ], savPreObj.filArr[ 0 ].name ); return true; } // What: One Photo Guard. Why: A single photo downloads as itself. How: This downloads it and returns.



	dowFilFun( zipBuiFun( savPreObj.filArr.map( ( filValObj, filIndNum ) => ( { bytArr : savPreObj.bytArr[ filIndNum ], namStr : filValObj.name } ) ), new Date() ), zipNamStr ); // What: Archive Download Call. Why: Many photos should download as one file. How: This packs every photo under its name into one archive dated now and downloads it.



	return true; // What: Handed Return. Why: The download has started. How: This returns true.


};

// #endregion savHanFun



// #region savPreFun

/**
 * savPreFun = Save Prepare Function
 *
 * @summary
 * Gets photos ready to hand to the device: each WebP photo converted to
 * JPEG and a JPEG one kept as it is, each wrapped as a typed file with a
 * plain numbered name and sorted into the batches a share sheet takes,
 * and whether this device shares them, which a touch screen that can share
 * files does, or downloads them. Preparing many
 * photos takes a while, so it's kept apart from the hand-over, which has
 * to follow a press closely.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: Each photo's bytes.
 *
 * @returns A promise that resolves with the prepared photos.
 *
 * @example
 * ```ts
 * savPreFun([fulBytArr]) // => { batArr, bytArr, filArr, shaBoo }
 * ```
 *
*/

const savPreFun = async ( bytValArr : Uint8Array< ArrayBuffer >[] ) : Promise< SavPreTyp > => { // What: Save Prepare Function. Why: Converting and wrapping photos takes time a share sheet won't wait for. How: This converts each photo, wraps it as a file, and reads whether the device shares files.


	const savBytArr = await Promise.all( bytValArr.map( jpeConFun ) ); // What: Saved Bytes Array. Why: Not every place a saved photo goes can open WebP. How: This converts each WebP photo to JPEG, keeping a JPEG one as it is.
	const filValArr = savBytArr.map( ( bytValObj, filIndNum ) => new File( [ bytValObj ], `come-hang-photo-${ filIndNum + 1 }.${ imaTypFun( bytValObj ) === 'image/jpeg' ? 'jpg' : 'webp' }`, { type : imaTypFun( bytValObj ) } ) ); // What: File Value Array. Why: Each photo is saved as a typed file with a plain name. How: This wraps each photo's bytes, numbered in order.

	const shaFilBoo = !!navigator.canShare?.( { files : filValArr } ) && window.matchMedia( '(pointer: coarse)' ).matches; // What: Share Files Boolean. Why: A phone or tablet saves shared photos to its library, while a computer's share sheet sends them on rather than keeping them. How: This is true where the browser can share these files on a touch screen.



	return { batArr : filBatFun( filValArr ), bytArr : savBytArr, filArr : filValArr, shaBoo : shaFilBoo }; // What: Prepared Return. Why: The hand-over needs the files, their bytes, and where they go. How: This returns all four. // What: Prepared Batches. Why: A share takes a batch at a time. How: This splits the files. // What: Prepared Bytes. Why: An archive packs the converted bytes. How: This holds them. // What: Prepared Files. Why: A download takes every file. How: This holds them. // What: Prepared Share. Why: The hand-over shares or downloads. How: This says which.


};

// #endregion savPreFun



// #region savFilFun

/**
 * savFilFun = Save Files Function
 *
 * @summary
 * Prepares photos and hands them to the device in one go, for a photo or
 * two already loaded, where preparing is quick enough that the press that
 * asked still counts when the share sheet is opened.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: Each photo's bytes.
 * @param zipNamStr - ZIP Name String: The archive's name, for several photos.
 *
 * @returns A promise that settles once the photos are handed over, with no
 *          value.
 *
 * @example
 * ```ts
 * savFilFun([fulBytArr], 'come-hang-photos.zip') // => Promise<void>
 * ```
 *
*/

const savFilFun = async ( bytValArr : Uint8Array< ArrayBuffer >[], zipNamStr : string ) : Promise< void > => { await savHanFun( await savPreFun( bytValArr ), zipNamStr ); }; // What: Save Files Function. Why: Photos leave the server with their event, so members keep them on their own device. How: This prepares them and hands them over.

// #endregion savFilFun

// #endregion Helpers



// #region Exports

export { savFilFun, savHanFun, savPreFun, type SavPreTyp }; // What: Named Exports. Why: The event photos and the chat's photos save through them, a whole event's in two steps. How: This exports the one-step save, its two halves, and the prepared photos' type.

// #endregion Exports


