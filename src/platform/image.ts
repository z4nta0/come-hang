


/**
 * image.ts = Image Shrinking
 *
 * @summary
 * Shrinks a picked photo on the device before it's shared (ARCHITECTURE.md
 * Section 20), through the browser's own image decoder and canvas, with no
 * library. The photo is drawn upright, the way the browser shows it, at up
 * to 1,600px on its long side, and again as a thumbnail of up to 320px, each
 * encoded as WebP where the browser can and JPEG where it can't, at the
 * highest of a few qualities that fits its size limit, drawn smaller still
 * when none does. Drawing it anew leaves behind everything else the file
 * carried, such as the position a camera records. A shared photo's bytes are
 * typed again from their first bytes when they're shown.
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

const FUL_MAX_NUM = 1024 * 1024 - 16;           // What: Full Maximum Number. Why: A full photo has to fit the Storage rules' 1 MB once encrypted, which adds a 16-byte tag. How: This is the most its bytes may be.
const FUL_SID_NUM = 1600;                       // What: Full Side Number. Why: A photo 1,600px on its long side looks sharp on a phone at a fraction of a camera's size. How: This is the long side it's drawn at, at most.
const QUA_STE_ARR = [ 0.82, 0.72, 0.62, 0.52 ]; // What: Quality Steps Array. Why: The best quality that fits the limit should win. How: This lists the qualities tried, highest first.
const THU_MAX_NUM = 40000 - 16;                 // What: Thumbnail Maximum Number. Why: A thumbnail has to fit the Firestore rules' 40,000 bytes once encrypted, which adds a 16-byte tag. How: This is the most its bytes may be.
const THU_SID_NUM = 320;                        // What: Thumbnail Side Number. Why: A thumbnail fills a grid cell on a dense screen. How: This is the long side it's drawn at, at most.

// #endregion Constants



// #region Helpers

// #region blbEncFun

/**
 * blbEncFun = Blob Encode Function
 *
 * @summary
 * Encodes a canvas at one quality, as WebP where the browser can and as JPEG
 * otherwise: a browser that can't encode WebP hands back a PNG instead, which
 * is too large to share, so that answer is encoded again as JPEG.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param canEleObj - Canvas Element Object: The drawn photo.
 * @param quaValNum - Quality Value Number: The quality, from 0 to 1.
 *
 * @returns A promise that resolves with the encoded image.
 *
 * @example
 * ```ts
 * blbEncFun(canEleObj, 0.82) // => Blob
 * ```
 *
*/

const blbEncFun = async ( canEleObj : HTMLCanvasElement, quaValNum : number ) : Promise< Blob > => { // What: Blob Encode Function. Why: WebP is smaller, while Safari only encodes JPEG. How: This tries WebP and falls back to JPEG.


	const blbTypFun = ( typValStr : string ) => new Promise< Blob >( ( resValFun, rejValFun ) => canEleObj.toBlob( ( blbValObj ) => blbValObj ? resValFun( blbValObj ) : rejValFun( new Error( "The photo couldn't be encoded." ) ), typValStr, quaValNum ) ); // What: Blob Type Function. Why: The canvas reports its image through a callback. How: This wraps one encoding in a promise, rejecting when there's none.

	const webBlbObj = await blbTypFun( 'image/webp' ); // What: WebP Blob Object. Why: WebP is the smaller format. How: This asks for it.



	return webBlbObj.type === 'image/webp' ? webBlbObj : blbTypFun( 'image/jpeg' ); // What: Encoded Return. Why: A browser that can't encode WebP answers in another format. How: This keeps the WebP, or encodes JPEG instead.


};

// #endregion blbEncFun



// #region sidFitFun

/**
 * sidFitFun = Side Fit Function
 *
 * @summary
 * Draws an image at up to a long side and encodes it at the highest quality
 * that fits a byte limit, drawing it 80% as large and trying again while
 * none does, down to 160px on its long side, below which it rejects.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param imaEleObj - Image Element Object: The decoded photo.
 * @param sidMaxNum - Side Maximum Number: The long side to draw at, at
 *                    most.
 * @param bytMaxNum - Bytes Maximum Number: The most the result may be.
 *
 * @returns A promise that resolves with the encoded bytes.
 *
 * @example
 * ```ts
 * sidFitFun(imaEleObj, 1600, FUL_MAX_NUM) // => Uint8Array
 * ```
 *
*/

const sidFitFun = async ( imaEleObj : HTMLImageElement, sidMaxNum : number, bytMaxNum : number ) : Promise< Uint8Array< ArrayBuffer > > => { // What: Side Fit Function. Why: A photo has to fit its limit at the best quality it can. How: This tries each quality at each size until one fits.


	const canEleObj = document.createElement( 'canvas' );                          // What: Canvas Element Object. Why: The photo is redrawn to shrink it and leave its metadata behind. How: This makes a canvas off the page.
	const sidLonNum = Math.max( imaEleObj.naturalWidth, imaEleObj.naturalHeight ); // What: Side Long Number. Why: The scale follows the photo's long side. How: This reads it as the browser shows it, upright.

	let sidNowNum = Math.min( sidMaxNum, sidLonNum ); // What: Side Now Number. Why: A photo is never drawn larger than it is. How: This starts at the smaller of the limit and its own long side.


	while ( sidNowNum >= 160 ) { // What: Size Loop. Why: A photo too detailed for any quality at one size may fit smaller. How: This tries each size down to 160px.


		const scaValNum = sidNowNum / sidLonNum; // What: Scale Value Number. Why: Both sides shrink alike. How: This is the long side's share of the photo's.


		canEleObj.width  = Math.max( 1, Math.round( imaEleObj.naturalWidth * scaValNum ) );  // What: Canvas Width Assignment. Why: The canvas takes the drawn size. How: This scales the width, at least 1px.
		canEleObj.height = Math.max( 1, Math.round( imaEleObj.naturalHeight * scaValNum ) ); // What: Canvas Height Assignment. Why: The canvas takes the drawn size. How: This scales the height, at least 1px.


		canEleObj.getContext( '2d' )!.drawImage( imaEleObj, 0, 0, canEleObj.width, canEleObj.height ); // What: Draw Call. Why: The photo is drawn at its new size. How: This paints it across the canvas. // What: Non-Null Note. Why: A new canvas always gives a 2D context the first time it's asked. How: The ! reads it as present.


		for ( const quaValNum of QUA_STE_ARR ) { // What: Quality Loop. Why: The highest quality that fits wins. How: This tries each, highest first.


			const blbValObj = await blbEncFun( canEleObj, quaValNum ); // What: Blob Value Object. Why: Each quality gives a different size. How: This encodes at one.


			if ( blbValObj.size <= bytMaxNum ) return new Uint8Array( await blbValObj.arrayBuffer() ); // What: Fit Return. Why: The first fit is the best quality that fits. How: This returns its bytes.


		}



		sidNowNum = Math.floor( sidNowNum * 0.8 ); // What: Shrink Assignment. Why: No quality fit at this size. How: This draws the next try 80% as large.


	}



	throw new RangeError( "The photo couldn't be made small enough." ); // What: Too Large Throw. Why: A photo that fits no size can't be shared. How: This rejects.


};

// #endregion sidFitFun



// #region imaShrFun

/**
 * imaShrFun = Image Shrink Function
 *
 * @summary
 * Decodes a picked photo the way the browser shows it, upright, and
 * resolves with its full photo and its thumbnail, each encoded within its
 * limit. Rejects when the browser can't decode the file, such as a format
 * it doesn't show, or it can't be made small enough.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filValObj - File Value Object: The picked photo.
 *
 * @returns A promise that resolves with the full photo's and the
 *          thumbnail's bytes.
 *
 * @example
 * ```ts
 * imaShrFun(filValObj) // => { fulBytArr, thuBytArr }
 * ```
 *
*/

const imaShrFun = async ( filValObj : Blob ) : Promise< { fulBytArr : Uint8Array< ArrayBuffer >, thuBytArr : Uint8Array< ArrayBuffer > } > => { // What: Image Shrink Function. Why: A camera's photo is far too large to share. How: This decodes it and encodes a full photo and a thumbnail within their limits.


	const imaEleObj = new Image();                     // What: Image Element Object. Why: An image element decodes the photo upright, as the browser shows it. How: This makes one off the page.
	const objUrlStr = URL.createObjectURL( filValObj ); // What: Object URL String. Why: The image element reads the file by address. How: This makes a temporary one.


	try { // What: Decode Attempt. Why: The temporary address has to be freed however decoding ends. How: This decodes and encodes inside it.


		imaEleObj.src = objUrlStr; // What: Source Assignment. Why: The element loads the file. How: This points it at the address.


		await imaEleObj.decode(); // What: Decode Call. Why: The photo has to be decoded before it's drawn. How: This waits for it, rejecting for a file the browser can't show.


		const fulBytArr = await sidFitFun( imaEleObj, FUL_SID_NUM, FUL_MAX_NUM ); // What: Full Bytes Array. Why: Members open the full photo. How: This encodes it within its limit.
		const thuBytArr = await sidFitFun( imaEleObj, THU_SID_NUM, THU_MAX_NUM ); // What: Thumbnail Bytes Array. Why: Members see the thumbnail in the grid. How: This encodes it within its limit.



		return { fulBytArr, thuBytArr }; // What: Shrunk Return. Why: The full photo and the thumbnail are shared together. How: This returns both.


	}

	finally { URL.revokeObjectURL( objUrlStr ); } // What: Address Free. Why: A temporary address holds the file in memory until it's freed. How: This frees it.


};

// #endregion imaShrFun



const imaTypFun = ( bytValArr : Uint8Array ) : string => bytValArr[ 0 ] === 0xFF && bytValArr[ 1 ] === 0xD8 ? 'image/jpeg' : 'image/webp'; // What: Image Type Function. Why: A shared photo is shown from its bytes, which carry no type. How: This reads JPEG's opening bytes, and WebP otherwise, the only two formats shared.

// #endregion Helpers



// #region Exports

export { imaShrFun, imaTypFun }; // What: Named Exports. Why: Sharing a photo shrinks it, and showing one types its bytes. How: This exports the shrink and the type check.

// #endregion Exports


