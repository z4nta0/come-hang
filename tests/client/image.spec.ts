


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the saved bytes are what they should be. How: This asserts on what the page reports.
import { test   } from '@playwright/test'; // What: Test. Why: Each kind of photo is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helper acts on a test's page. How: This types it.

// #endregion Imports



/**
 * image.spec.ts = Image Spec
 *
 * @summary
 * Checks how a photo is readied for saving, in a real browser, in each
 * engine, since each decodes and encodes images itself. Each test opens the
 * app on the dev server and runs the image module in the page the way a save
 * does, on a photo it draws and encodes itself: a WebP photo comes back as a
 * JPEG of the same size, while a JPEG, or anything that isn't a WebP, comes
 * back as the same bytes, untouched.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const MOD_PAT_STR = '/src/platform/image.ts'; // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the image module.

// #endregion Constants



// #region Helpers

// #region conRunFun

/**
 * conRunFun = Convert Run Function
 *
 * @summary
 * Runs the image module's conversion in the page on a photo's bytes, and
 * resolves with what came back: whether it's the very bytes it was given,
 * its opening three bytes, and its size once decoded.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page, with the app loaded.
 * @param souKinStr - Source Kind String: The type the page encodes the
 *                    photo it draws as, 'webp', 'jpeg', or 'png'.
 *
 * @returns A promise that resolves with what the conversion gave back.
 *
 * @example
 * ```ts
 * conRunFun(page, 'webp') // => { heaBytArr, heiNum : 8, ... }
 * ```
 *
*/

const conRunFun = ( curPagObj : Page, souKinStr : 'jpeg' | 'png' | 'webp' ) => curPagObj.evaluate( async ( [ modPatStr, souArgStr ] ) => { // What: Convert Run Function. Why: Each test runs the real module where a save does. How: This prepares the photo in the page, converts it, and reports the result.


	const canEleObj = document.createElement( 'canvas' ); // What: Canvas Element Object. Why: The photo is drawn in the page to encode. How: This makes a canvas off the page.


	canEleObj.width  = 12; // What: Canvas Width Assignment. Why: The converted photo's width is checked. How: This sets it 12px wide.
	canEleObj.height = 8;  // What: Canvas Height Assignment. Why: The converted photo's height is checked. How: This sets it 8px tall.


	const cotDraObj = canEleObj.getContext( '2d' )!;              // What: Context Draw Object. Why: The photo is drawn through the canvas's context. How: This takes it. // What: Non-Null Note. Why: A new canvas always gives a 2D context the first time it's asked. How: The ! reads it as present.
	const graValObj = cotDraObj.createLinearGradient( 0, 0, 12, 8 ); // What: Gradient Value Object. Why: A photo has varied color, which a second encoding would change, where a flat fill can come back the same. How: This makes a diagonal gradient across the canvas.


	graValObj.addColorStop( 0, 'rgb(74, 79, 201)' ); // What: Start Stop Call. Why: The gradient needs its first color. How: This starts it periwinkle.
	graValObj.addColorStop( 1, 'rgb(221, 98, 72)' ); // What: End Stop Call. Why: The gradient needs its last color. How: This ends it coral.


	cotDraObj.fillStyle = graValObj; // What: Fill Style Assignment. Why: The fill paints the gradient. How: This sets it.


	cotDraObj.fillRect( 0, 0, 12, 8 ); // What: Fill Call. Why: The photo needs something in it. How: This paints the gradient across it.


	const souBytArr = new Uint8Array( await ( await new Promise< Blob >( ( resValFun ) => canEleObj.toBlob( ( blbValObj ) => resValFun( blbValObj! ), `image/${ souArgStr }`, 0.5 ) ) ).arrayBuffer() ); // What: Source Bytes Array. Why: The conversion is given the kind of photo the test names. How: This encodes the canvas as that type, which every engine the suites run encodes, WebP included, at a quality below the conversion's, so re-encoding would change it. // What: Non-Null Note. Why: The canvas always holds an image to encode. How: The ! reads the blob as present.
	const outBytArr = await ( await import( /* @vite-ignore */ modPatStr ) ).jpeConFun( souBytArr ) as Uint8Array< ArrayBuffer >; // What: Out Bytes Array. Why: The test reads what a save would. How: This converts the photo. // What: Type Assertion Note. Why: A dynamic import is untyped, and jpeConFun resolves with bytes. How: The as reads them so.
	const imaBitObj = await createImageBitmap( new Blob( [ outBytArr ] ) );                                                       // What: Image Bitmap Object. Why: The result's size is read from the image itself. How: This decodes it.



	return { heaBytArr : [ ...outBytArr.subarray( 0, 3 ) ], heiNum : imaBitObj.height, samBytBoo : outBytArr.length === souBytArr.length && outBytArr.every( ( bytValNum, bytIndNum ) => bytValNum === souBytArr[ bytIndNum ] ), widNum : imaBitObj.width }; // What: Result Return. Why: The tests compare the result with the photo given. How: This returns its opening bytes, its size, and whether it's the same bytes.


}, [ MOD_PAT_STR, souKinStr ] as const ); // What: Convert Arguments. Why: The page can't read the test's variables. How: This passes the module's path and the kind. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.

// #endregion conRunFun

// #endregion Helpers



// #region Module Init

test( 'a WebP photo is saved as a JPEG of the same size', async ( { page } ) => { // What: WebP Test. Why: Not every place a saved photo goes can open WebP (Section 20). How: This converts the WebP and checks the result opens as a JPEG and keeps its size.


	await page.goto( '/' ); // What: Home Visit. Why: The page needs the app's modules. How: This opens the app.


	const resValObj = await conRunFun( page, 'webp' ); // What: Result Value Object. Why: The checks read what came back. How: This converts the WebP.


	expect( resValObj.heaBytArr ).toEqual( [ 0xFF, 0xD8, 0xFF ] ); // What: JPEG Assertion. Why: The saved photo is a JPEG. How: This expects JPEG's opening bytes.
	expect( resValObj.samBytBoo ).toBe( false );                   // What: Changed Assertion. Why: The WebP was converted, not passed through. How: This expects different bytes.
	expect( resValObj.widNum ).toBe( 12 );                         // What: Width Assertion. Why: Converting keeps the photo's size. How: This expects its width.
	expect( resValObj.heiNum ).toBe( 8 );                          // What: Height Assertion. Why: Converting keeps the photo's size. How: This expects its height.


} );



test( 'a JPEG photo is saved as the very bytes it was shared as', async ( { page } ) => { // What: JPEG Test. Why: A second encoding would only lose quality (Section 20). How: This passes a JPEG through and checks the same bytes come back.


	await page.goto( '/' ); // What: Home Visit. Why: The page needs the app's modules. How: This opens the app.


	const resValObj = await conRunFun( page, 'jpeg' ); // What: Result Value Object. Why: The checks read what came back. How: This passes the JPEG through.


	expect( resValObj.samBytBoo ).toBe( true ); // What: Same Bytes Assertion. Why: A JPEG is saved untouched. How: This expects the same bytes.


} );



test( "a photo that isn't WebP is saved untouched, whatever it is", async ( { page } ) => { // What: Other Format Test. Why: Only a WebP is converted, so nothing unexpected is re-encoded. How: This passes a PNG through and checks the same bytes come back.


	await page.goto( '/' ); // What: Home Visit. Why: The page needs the app's modules. How: This opens the app.


	const resValObj = await conRunFun( page, 'png' ); // What: Result Value Object. Why: The checks read what came back. How: This passes the PNG through.


	expect( resValObj.samBytBoo ).toBe( true ); // What: Same Bytes Assertion. Why: Anything that isn't WebP is saved untouched. How: This expects the same bytes.


} );

// #endregion Module Init


