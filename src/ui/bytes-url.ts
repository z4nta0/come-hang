


// #region Imports

import { imaTypFun } from '../platform/image.ts'; // What: Image Type Function. Why: A decrypted photo's bytes carry no type. How: This reads it from their first bytes.
import { useEffect } from 'react';                // What: Use Effect. Why: An address is made for each set of bytes and freed once done. How: This makes and frees it.
import { useState  } from 'react';                // What: Use State. Why: The image reads the address once it's made. How: This holds it.

// #endregion Imports



/**
 * bytes-url.ts = Bytes URL
 *
 * @summary
 * A hook that turns a decrypted photo's bytes into a temporary address an
 * image can show, for the event photos and the chat's photos, freeing it once
 * it's no longer shown.
 *
 * Sections:
 *  - Types
 *  - Hooks
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type UrlRecTyp = { bytArr : Uint8Array< ArrayBuffer >, urlStr : string }; // What: URL Record Type. Why: An address is made a render after its bytes, so a caller has to tell which bytes it shows. How: This pairs the address with the bytes it was made for.

// #endregion Types



// #region Hooks

// #region useBytUrlFun

/**
 * useBytUrlFun = Use Bytes URL Function
 *
 * @summary
 * Turns a photo's bytes into a temporary address an image can show, typed
 * from its first bytes, freeing the address when the bytes change or the
 * caller goes. The address is made a render after the bytes arrive, so it
 * comes paired with the bytes it was made for, letting a caller that
 * switches photos hold back an address left from the last one. Returns null
 * while there are no bytes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: The photo's bytes, or null.
 *
 * @returns The address with its bytes, or null.
 *
 * @example
 * ```ts
 * useBytUrlFun(thuBytArr) // => { bytArr, urlStr : 'blob:...' }
 * ```
 *
*/

const useBytUrlFun = ( bytValArr : Uint8Array< ArrayBuffer > | null ) : UrlRecTyp | null => { // What: Use Bytes URL Function. Why: An image shows a photo by address. How: This makes and frees a temporary address for the bytes.


	const [ urlRecObj, setUrlRecObj ] = useState< UrlRecTyp | null >( null ); // What: URL Record Object And Setter. Why: The image reads the address once it's made. How: This holds it with its bytes, null without bytes.



	useEffect( () => { // What: Address Effect. Why: Each set of bytes needs its own address, freed once it's done. How: This makes one for the bytes and frees it on cleanup.


		if ( bytValArr === null ) { setUrlRecObj( null ); return; } // What: Empty Guard. Why: No bytes means no address. How: This clears it and returns.



		const objUrlStr = URL.createObjectURL( new Blob( [ bytValArr ], { type : imaTypFun( bytValArr ) } ) ); // What: Object URL String. Why: The image needs an address for the photo. How: This makes one, typed from the bytes.


		setUrlRecObj( { bytArr : bytValArr, urlStr : objUrlStr } ); // What: Address Set Call. Why: The image shows the new address. How: This keeps it with the bytes it was made for.



		return () => URL.revokeObjectURL( objUrlStr ); // What: Cleanup Return. Why: An address holds its photo in memory until it's freed. How: This frees it.


	}, [ bytValArr ] ); // What: Effect Dependency Array. Why: New bytes need a new address. How: bytValArr changes with the photo.



	return urlRecObj; // What: Address Return. Why: The caller shows the photo. How: This returns the address with its bytes.


};

// #endregion useBytUrlFun

// #endregion Hooks



// #region Exports

export { type UrlRecTyp, useBytUrlFun }; // What: Named Exports. Why: The event photos and the chat's photos show decrypted photos through the hook. How: This exports it and its record's type.

// #endregion Exports


