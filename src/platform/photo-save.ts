


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
 * ready.
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

type SavPreTyp = { bytArr : Uint8Array< ArrayBuffer >[], filArr : File[], shaBoo : boolean }; // What: Save Prepared Type. Why: Photos are prepared in one step and handed over in another. How: This holds their converted bytes, their files, and whether the device shares them.

// #endregion Types



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



// #region savHanFun

/**
 * savHanFun = Save Hand Function
 *
 * @summary
 * Hands prepared photos to the device. Where they're to be shared, the share
 * sheet is asked for before anything is awaited, since a browser only opens
 * it while a press still counts, so it expects to be called straight from
 * the press. A share the member backs out of is no error. Anywhere else one
 * photo downloads as itself, and several download as one ZIP archive under
 * the given name, so a computer gets one file rather than one download, and
 * in some browsers one tab, per photo.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param savPreObj - Save Prepared Object: The photos, as savPreFun
 *                    prepared them.
 * @param zipNamStr - ZIP Name String: The archive's name, for several
 *                    photos.
 *
 * @returns A promise that settles once the photos are handed over, with no
 *          value.
 *
 * @example
 * ```ts
 * savHanFun(savPreObj, 'come-hang-photos.zip') // => Promise<void>
 * ```
 *
*/

const savHanFun = async ( savPreObj : SavPreTyp, zipNamStr : string ) : Promise< void > => { // What: Save Hand Function. Why: Prepared photos go to the share sheet or a download. How: This shares them where they're to be shared, or downloads them as one file.


	if ( savPreObj.shaBoo ) { // What: Share Check. Why: A phone or tablet saves shared photos to its library. How: This shares them where savPreFun found the device shares files.


		await navigator.share( { files : savPreObj.filArr } ).catch( ( errCatObj : unknown ) => { if ( Reflect.get( Object( errCatObj ), 'name' ) !== 'AbortError' ) throw errCatObj; } ); // What: Share Call. Why: Backing out of the share sheet isn't a failure, and the sheet opens only while the press that asked still counts. How: This shares the files before anything else is awaited, ignoring a cancel.


		return; // What: Shared Return. Why: The share sheet saved them. How: This returns.


	}



	if ( savPreObj.filArr.length === 1 ) { dowFilFun( savPreObj.filArr[ 0 ], savPreObj.filArr[ 0 ].name ); return; } // What: One Photo Guard. Why: A single photo downloads as itself. How: This downloads it and returns.



	dowFilFun( zipBuiFun( savPreObj.filArr.map( ( filValObj, filIndNum ) => ( { bytArr : savPreObj.bytArr[ filIndNum ], namStr : filValObj.name } ) ), new Date() ), zipNamStr ); // What: Archive Download Call. Why: Many photos should download as one file. How: This packs every photo under its name into one archive dated now and downloads it.


};

// #endregion savHanFun



// #region savPreFun

/**
 * savPreFun = Save Prepare Function
 *
 * @summary
 * Gets photos ready to hand to the device: each WebP photo converted to
 * JPEG and a JPEG one kept as it is, each wrapped as a typed file with a
 * plain numbered name, and whether this device shares them, which a touch
 * screen that can share files does, or downloads them. Preparing many
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
 * savPreFun([fulBytArr]) // => { bytArr, filArr, shaBoo }
 * ```
 *
*/

const savPreFun = async ( bytValArr : Uint8Array< ArrayBuffer >[] ) : Promise< SavPreTyp > => { // What: Save Prepare Function. Why: Converting and wrapping photos takes time a share sheet won't wait for. How: This converts each photo, wraps it as a file, and reads whether the device shares files.


	const savBytArr = await Promise.all( bytValArr.map( jpeConFun ) ); // What: Saved Bytes Array. Why: Not every place a saved photo goes can open WebP. How: This converts each WebP photo to JPEG, keeping a JPEG one as it is.
	const filValArr = savBytArr.map( ( bytValObj, filIndNum ) => new File( [ bytValObj ], `come-hang-photo-${ filIndNum + 1 }.${ imaTypFun( bytValObj ) === 'image/jpeg' ? 'jpg' : 'webp' }`, { type : imaTypFun( bytValObj ) } ) ); // What: File Value Array. Why: Each photo is saved as a typed file with a plain name. How: This wraps each photo's bytes, numbered in order.

	const shaFilBoo = !!navigator.canShare?.( { files : filValArr } ) && window.matchMedia( '(pointer: coarse)' ).matches; // What: Share Files Boolean. Why: A phone or tablet saves shared photos to its library, while a computer's share sheet sends them on rather than keeping them. How: This is true where the browser can share these files on a touch screen.



	return { bytArr : savBytArr, filArr : filValArr, shaBoo : shaFilBoo }; // What: Prepared Return. Why: The hand-over needs the files, their bytes, and where they go. How: This returns all three. // What: Prepared Bytes. Why: An archive packs the converted bytes. How: This holds them. // What: Prepared Files. Why: The share sheet and a download take files. How: This holds them. // What: Prepared Share. Why: The hand-over shares or downloads. How: This says which.


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

const savFilFun = async ( bytValArr : Uint8Array< ArrayBuffer >[], zipNamStr : string ) : Promise< void > => savHanFun( await savPreFun( bytValArr ), zipNamStr ); // What: Save Files Function. Why: Photos leave the server with their event, so members keep them on their own device. How: This prepares them and hands them over.

// #endregion savFilFun

// #endregion Helpers



// #region Exports

export { savFilFun, savHanFun, savPreFun, type SavPreTyp }; // What: Named Exports. Why: The event photos and the chat's photos save through them, a whole event's in two steps. How: This exports the one-step save, its two halves, and the prepared photos' type.

// #endregion Exports


