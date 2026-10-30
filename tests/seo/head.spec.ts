


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the head and the files it links are as they should be. How: This asserts on what each check reads.
import { test   } from '@playwright/test'; // What: Test. Why: Each part of the head is its own test. How: This declares them.


import type { APIRequestContext } from '@playwright/test'; // What: API Request Context. Why: The helper fetches files the way a browser or a scraper would. How: This types the request client.

// #endregion Imports



/**
 * head.spec.ts = Head Spec
 *
 * @summary
 * Checks what the page's head tells browsers, launchers, and link scrapers,
 * in each engine: the icons it links and the web app manifest. Each linked
 * file is fetched from the server and checked as what the head says it is,
 * a PNG by its own stated width and height, so a stale or missing icon fails
 * here rather than on someone's home screen.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region pngSizFun

/**
 * pngSizFun = PNG Size Function
 *
 * @summary
 * Fetches a file and reads it as a PNG: resolves with its width and height
 * from its header, or null when the request fails or the bytes don't start
 * with the PNG signature.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqCotObj - Request Context Object: The client to fetch with.
 * @param patValStr - Path Value String: The file's path on the server.
 *
 * @returns A promise that resolves with the PNG's size as text, or null.
 *
 * @example
 * ```ts
 * pngSizFun(request, '/apple-touch-icon.png') // => '180x180'
 * ```
 *
*/

async function pngSizFun ( reqCotObj : APIRequestContext, patValStr : string ) : Promise< string | null > {


	const resValObj = await reqCotObj.get( patValStr ); // What: Response Value Object. Why: The file has to be served at its path. How: This fetches it.


	if ( !resValObj.ok() ) return null; // What: Failed Request Guard. Why: A missing file has no size. How: This resolves null.



	const bytValBuf = await resValObj.body(); // What: Bytes Value Buffer. Why: The size is read from the PNG's own header. How: This reads the body.


	if ( bytValBuf.subarray( 0, 8 ).toString( 'hex' ) !== '89504e470d0a1a0a' ) return null; // What: Signature Guard. Why: A file that isn't a PNG has no PNG size. How: This compares its first eight bytes with the PNG signature.



	return `${ bytValBuf.readUInt32BE( 16 ) }x${ bytValBuf.readUInt32BE( 20 ) }`; // What: Size Return. Why: The head and the manifest state each icon's size this way. How: This reads the width and height from the header chunk.


}

// #endregion pngSizFun

// #endregion Helpers



// #region Module Init

test( 'the head links the SVG and ICO favicons and the touch icon, each served as what it says it is', async ( { page, request } ) => { // What: Icon Links Test. Why: Browsers, iOS, and some link previews show these icons. How: This reads each icon link from the head and checks the file it points at.


	await page.goto( '/' ); // What: Home Visit. Why: The head is read as the browser sees it. How: This opens the app.

	await expect( page.locator( "link[rel='icon'][type='image/svg+xml']" ) ).toHaveAttribute( 'href', '/favicon.svg' ); // What: SVG Link Assertion. Why: Modern browsers take the vector favicon. How: This checks its link.
	await expect( page.locator( "link[rel='icon']:not( [type] )" ) ).toHaveAttribute( 'href', '/favicon.ico' );         // What: ICO Link Assertion. Why: Other browsers fall back to the ICO. How: This checks its link.
	await expect( page.locator( "link[rel='apple-touch-icon']" ) ).toHaveAttribute( 'href', '/apple-touch-icon.png' );  // What: Touch Icon Link Assertion. Why: iOS reads its home screen icon from this link. How: This checks the link.
	await expect( page.locator( "link[rel='apple-touch-icon']" ) ).toHaveAttribute( 'sizes', '180x180' );               // What: Touch Icon Size Assertion. Why: The link states the size iOS draws at. How: This checks it.


	const svgResObj = await request.get( '/favicon.svg' );                  // What: SVG Response Object. Why: The SVG favicon has to be served. How: This fetches it.
	const icoBytBuf = await ( await request.get( '/favicon.ico' ) ).body(); // What: ICO Bytes Buffer. Why: The ICO's header names its images. How: This fetches its bytes.


	expect( svgResObj.ok() ).toBe( true );                                           // What: SVG Served Assertion. Why: A missing favicon shows a blank tab. How: This checks the request succeeded.
	expect( ( await svgResObj.text() ).includes( '<svg' ) ).toBe( true );            // What: SVG Content Assertion. Why: The file has to be SVG markup, not the app's page. How: This checks it holds an svg element.
	expect( icoBytBuf.subarray( 0, 4 ).toString( 'hex' ) ).toBe( '00000100' );       // What: ICO Header Assertion. Why: The file has to be a real icon file. How: This checks its reserved zero and its icon type.
	expect( icoBytBuf.readUInt16LE( 4 ) ).toBe( 3 );                                 // What: ICO Count Assertion. Why: The ICO holds the mark at 16, 32, and 48px. How: This reads its image count.
	expect( await pngSizFun( request, '/apple-touch-icon.png' ) ).toBe( '180x180' ); // What: Touch Icon Size Assertion. Why: iOS draws the icon at 180px. How: This reads the PNG's own size.


} );



test( 'the manifest names the app and lists icons served at their stated sizes, a maskable one among them', async ( { page, request } ) => { // What: Manifest Test. Why: Installing the app reads its name, display, and icons from the manifest. How: This follows the head's manifest link, then checks the manifest's fields and fetches every icon it lists.


	await page.goto( '/' ); // What: Home Visit. Why: The manifest is found through the head. How: This opens the app.


	const manHreStr = await page.locator( "link[rel='manifest']" ).getAttribute( 'href' ); // What: Manifest Href String. Why: The browser finds the manifest through this link. How: This reads it.


	expect( manHreStr ).toBe( '/manifest.webmanifest' ); // What: Manifest Link Assertion. Why: The link has to point at the hand-written manifest. How: This checks it.


	const manValObj = await ( await request.get( manHreStr! ) ).json() as { display : string, icons : { purpose : string, sizes : string, src : string }[], name : string, start_url : string }; // What: Manifest Value Object. Why: The manifest's fields are checked as installed apps read them. How: This fetches and parses it. // What: Non-Null Note. Why: getAttribute's type allows null. How: The assertion above proved it's the manifest's path. // What: Type Assertion Note. Why: json() returns any. How: The as reads it as the manifest fields this test checks.


	expect( manValObj.name ).toBe( 'Come Hang' );                                                     // What: Name Assertion. Why: The installed app is named Come Hang. How: This reads the name.
	expect( manValObj.display ).toBe( 'standalone' );                                                 // What: Display Assertion. Why: The installed app opens without browser bars. How: This reads the display mode.
	expect( manValObj.start_url ).toBe( '/' );                                                        // What: Start URL Assertion. Why: The app answers at its root. How: This reads the start address.
	expect( manValObj.icons.some( ( icoRecObj ) => icoRecObj.purpose === 'maskable' ) ).toBe( true ); // What: Maskable Assertion. Why: Android launchers crop a maskable icon to their own shape. How: This checks one is listed.


	for ( const icoRecObj of manValObj.icons ) expect( await pngSizFun( request, icoRecObj.src ) ).toBe( icoRecObj.sizes ); // What: Icon Size Loop. Why: Every listed icon has to exist at the size the manifest states. How: This reads each icon's own size.


} );



test( 'the head tints the browser bars to match the header in light and dark mode', async ( { page } ) => { // What: Theme Color Test. Why: Phones tint their bars around the page, which should match the header in either mode. How: This reads both theme color tags and checks each one's mode and color.


	await page.goto( '/' ); // What: Home Visit. Why: The head is read as the browser sees it. How: This opens the app.

	await expect( page.locator( "meta[name='theme-color'][media='(prefers-color-scheme: light)']" ) ).toHaveAttribute( 'content', '#FFFFFF' ); // What: Light Tint Assertion. Why: The light header is white. How: This checks the light tag's color.
	await expect( page.locator( "meta[name='theme-color'][media='(prefers-color-scheme: dark)']" ) ).toHaveAttribute( 'content', '#1B1D38' );  // What: Dark Tint Assertion. Why: The dark header is navy. How: This checks the dark tag's color.


} );

// #endregion Module Init


