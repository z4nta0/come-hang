


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
 * JPEG as it's saved, and a JPEG one kept as it is.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



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



// #region savFilFun

/**
 * savFilFun = Save Files Function
 *
 * @summary
 * Hands photos to the device, each WebP photo converted to JPEG first and a
 * JPEG one kept as it is. On a touch screen that can share files, the share
 * sheet takes them, which on a phone saves them to its photo library,
 * and a share the member backs out of is no error. Anywhere else one photo
 * downloads as itself, and several download as one ZIP archive under the
 * given name, so a computer gets one file rather than one download, and in
 * some browsers one tab, per photo.
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

const savFilFun = async ( bytValArr : Uint8Array< ArrayBuffer >[], zipNamStr : string ) : Promise< void > => { // What: Save Files Function. Why: Photos leave the server with their event, so members keep them on their own device. How: This shares them on a touch screen, or downloads them as one file.


	const savBytArr = await Promise.all( bytValArr.map( jpeConFun ) ); // What: Saved Bytes Array. Why: Not every place a saved photo goes can open WebP. How: This converts each WebP photo to JPEG, keeping a JPEG one as it is.
	const filValArr = savBytArr.map( ( bytValObj, filIndNum ) => new File( [ bytValObj ], `come-hang-photo-${ filIndNum + 1 }.${ imaTypFun( bytValObj ) === 'image/jpeg' ? 'jpg' : 'webp' }`, { type : imaTypFun( bytValObj ) } ) ); // What: File Value Array. Why: Each photo is saved as a typed file with a plain name. How: This wraps each photo's bytes, numbered in order.



	if ( navigator.canShare?.( { files : filValArr } ) && window.matchMedia( '(pointer: coarse)' ).matches ) { // What: Share Check. Why: A phone or tablet saves shared photos to its library, while a computer's share sheet sends them on rather than keeping them. How: This shares them where the browser can share files on a touch screen.


		await navigator.share( { files : filValArr } ).catch( ( errCatObj : unknown ) => { if ( Reflect.get( Object( errCatObj ), 'name' ) !== 'AbortError' ) throw errCatObj; } ); // What: Share Call. Why: Backing out of the share sheet isn't a failure. How: This shares the files, ignoring a cancel.


		return; // What: Shared Return. Why: The share sheet saved them. How: This returns.


	}



	if ( filValArr.length === 1 ) { dowFilFun( filValArr[ 0 ], filValArr[ 0 ].name ); return; } // What: One Photo Guard. Why: A single photo downloads as itself. How: This downloads it and returns.



	dowFilFun( zipBuiFun( filValArr.map( ( filValObj, filIndNum ) => ( { bytArr : savBytArr[ filIndNum ], namStr : filValObj.name } ) ), new Date() ), zipNamStr ); // What: Archive Download Call. Why: Many photos should download as one file. How: This packs every photo under its name into one archive dated now and downloads it.


};

// #endregion savFilFun

// #endregion Helpers



// #region Exports

export { savFilFun }; // What: Named Export. Why: The event photos and the chat's photos save through it. How: This exports savFilFun.

// #endregion Exports


