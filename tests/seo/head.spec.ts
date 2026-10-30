


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the head and the files it links are as they should be. How: This asserts on what each check reads.
import { test   } from '@playwright/test'; // What: Test. Why: Each part of the head is its own test. How: This declares them.


import type { APIRequestContext } from '@playwright/test'; // What: API Request Context. Why: The helpers fetch files the way a browser or a scraper would. How: This types the request client.
import type { Page              } from '@playwright/test'; // What: Page. Why: A helper parses fetched HTML in a test's page. How: This types it.

// #endregion Imports



/**
 * head.spec.ts = Head Spec
 *
 * @summary
 * Checks what the page's head tells browsers, launchers, search engines, and
 * link scrapers, in each engine: its title and description as a scraper reads
 * the raw file, its canonical address, the social preview tags and their card,
 * the icons it links, the web app manifest, and the crawler files. Each linked
 * file is fetched from the server and checked as what the head says it is, a
 * PNG by its own stated width and height, so a stale or missing file fails
 * here rather than in a search result, a shared link, or a home screen.
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

// #region rawHeaFun

/**
 * rawHeaFun = Raw Head Function
 *
 * @summary
 * Fetches the page's HTML as a scraper would, without running its scripts,
 * and resolves with what its head says: the title, every description, and
 * the canonical address. The text is parsed in the page's own HTML parser.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The page whose parser reads the HTML.
 * @param reqCotObj - Request Context Object: The client to fetch with.
 *
 * @returns A promise that resolves with the head's title, descriptions, and
 *          canonical address.
 *
 * @example
 * ```ts
 * rawHeaFun(page, request) // => { canHreStr, desTexArr, titTexStr }
 * ```
 *
*/

async function rawHeaFun ( pagValObj : Page, reqCotObj : APIRequestContext ) : Promise< { canHreStr : string | null, desTexArr : string[], titTexStr : string } > {


	const rawHtmStr = await ( await reqCotObj.get( '/' ) ).text(); // What: Raw HTML String. Why: Link checkers and many crawlers read the file and never run the app. How: This fetches it as text.



	return pagValObj.evaluate( ( htmTexStr ) => { // What: Head Read Return. Why: The tags are read the way a parser sees them. How: This parses the text in the page and reads the tags.


		const docValObj = new DOMParser().parseFromString( htmTexStr, 'text/html' ); // What: Document Value Object. Why: The raw text has to become a document to query. How: This parses it as HTML, running nothing.



		return { // What: Head Fields Return. Why: The test checks each field. How: This returns them.


			canHreStr : docValObj.querySelector( "link[rel='canonical']" )?.getAttribute( 'href' ) ?? null,                                                // What: Canonical Href String. Why: Search engines credit the page to this address. How: This reads it, or null when missing.
			desTexArr : [ ...docValObj.querySelectorAll( "meta[name='description']" ) ].map( ( metCurEle ) => metCurEle.getAttribute( 'content' ) ?? '' ), // What: Description Text Array. Why: There should be exactly one description. How: This lists every one.
			titTexStr : docValObj.title // What: Title Text String. Why: Scrapers show this title. How: This reads it.


		};


	}, rawHtmStr );


}

// #endregion rawHeaFun

// #endregion Helpers



// #region Module Init

test( 'the raw page carries the full title, one description of 120 to 125 characters, and the canonical address', async ( { page, request } ) => { // What: Raw Head Test. Why: Link checkers and many crawlers read only the file, never what the app renders. How: This reads the raw page's head and checks the title, the description's count and length, and the canonical address.


	await page.goto( '/' ); // What: Home Visit. Why: The raw HTML is parsed in a page. How: This opens the app.


	const rawHeaObj = await rawHeaFun( page, request ); // What: Raw Head Object. Why: The checks read the head as a scraper does. How: This fetches and parses it.


	expect( rawHeaObj.titTexStr ).toBe( 'Come Hang: plan get-togethers with your group' ); // What: Title Assertion. Why: Search results and cards name the app and what it's for. How: This reads the raw title.
	expect( rawHeaObj.desTexArr.length ).toBe( 1 );                                        // What: One Description Assertion. Why: Two descriptions leave a scraper to guess. How: This counts them.
	expect( rawHeaObj.desTexArr[ 0 ].length ).toBeGreaterThanOrEqual( 120 );               // What: Description Minimum Assertion. Why: Preview checkers flag a description under 120 characters as short. How: This checks its length.
	expect( rawHeaObj.desTexArr[ 0 ].length ).toBeLessThanOrEqual( 125 );                  // What: Description Maximum Assertion. Why: Phone cards cut a summary off around 125 characters. How: This checks its length.
	expect( rawHeaObj.canHreStr ).toBe( 'https://comehang.app/' );                         // What: Canonical Assertion. Why: Search engines credit the app to its live root. How: This reads the canonical address.


} );



test( 'the social preview tags are all present with absolute addresses, and the card is a 1,200x630 PNG under 300 KB', async ( { page, request } ) => { // What: Social Preview Test. Why: A shared link should show a proper card in every app. How: This reads every Open Graph and Twitter tag, checks the addresses are absolute, and fetches the card to check its type, size, and dimensions.


	await page.goto( '/' ); // What: Home Visit. Why: The tags are read as the browser sees them. How: This opens the app.


	const tagValObj = await page.evaluate( () => Object.fromEntries( [ ...document.querySelectorAll( "meta[property^='og:'], meta[name^='twitter:']" ) ].map( ( metCurEle ) => [ metCurEle.getAttribute( 'property' ) ?? metCurEle.getAttribute( 'name' ), metCurEle.getAttribute( 'content' ) ] ) ) ); // What: Tag Value Object. Why: Each tag is checked by its name. How: This maps every Open Graph and Twitter tag to its content.
	const carResObj = await request.get( '/og-image.png' ); // What: Card Response Object. Why: The card has to be served. How: This fetches it from the server's root, where the live address points.


	const carBytBuf = await carResObj.body(); // What: Card Bytes Buffer. Why: The card's size and dimensions are read from its bytes. How: This reads the body.


	expect( Object.keys( tagValObj ).sort() ).toEqual( [ 'og:description', 'og:image', 'og:image:alt', 'og:image:height', 'og:image:type', 'og:image:width', 'og:locale', 'og:site_name', 'og:title', 'og:type', 'og:url', 'twitter:card', 'twitter:description', 'twitter:image', 'twitter:image:alt', 'twitter:title' ] ); // What: Tag Set Assertion. Why: Every app reads its own subset, so each one has to be there. How: This compares the names present with the full set.
	expect( tagValObj[ 'og:image' ] ).toBe( 'https://comehang.app/og-image.png' );                                                          // What: Image Address Assertion. Why: Scrapers need an absolute address. How: This checks the card's address.
	expect( tagValObj[ 'twitter:image' ] ).toBe( tagValObj[ 'og:image' ] );                                                                 // What: Same Image Assertion. Why: Every app should show the same card. How: This compares the two image tags.
	expect( tagValObj[ 'og:url' ] ).toBe( 'https://comehang.app/' );                                                                        // What: URL Assertion. Why: The card credits the app's one address. How: This checks it.
	expect( tagValObj[ 'twitter:card' ] ).toBe( 'summary_large_image' );                                                                    // What: Card Kind Assertion. Why: X shows the large image only when asked. How: This checks the card kind.
	expect( carResObj.ok() ).toBe( true );                                                                                                  // What: Card Served Assertion. Why: A missing card leaves a bare link. How: This checks the request succeeded.
	expect( carBytBuf.length ).toBeLessThan( 300 * 1024 );                                                                                  // What: Card Size Assertion. Why: WhatsApp drops a preview image of 300 KB or more. How: This checks the bytes.
	expect( await pngSizFun( request, '/og-image.png' ) ).toBe( `${ tagValObj[ 'og:image:width' ] }x${ tagValObj[ 'og:image:height' ] }` ); // What: Card Dimensions Assertion. Why: The tags state the card's size, which apps lay out before it loads. How: This compares the PNG's own size with the tags.
	expect( tagValObj[ 'og:image:width' ] ).toBe( '1200' );                                                                                 // What: Card Width Assertion. Why: Cards are 1,200 pixels wide. How: This reads the width tag.


} );



test( 'robots.txt lets crawlers in and names the sitemap, which lists the canonical root', async ( { request } ) => { // What: Crawler Files Test. Why: Search engines read these two files before the pages. How: This fetches both and checks what each says.


	const robTexStr = await ( await request.get( '/robots.txt' ) ).text();  // What: Robots Text String. Why: Crawlers obey this file. How: This fetches it.
	const sitTexStr = await ( await request.get( '/sitemap.xml' ) ).text(); // What: Sitemap Text String. Why: Crawlers find the indexed pages here. How: This fetches it.


	expect( robTexStr ).toContain( 'Allow: /' );                                  // What: Allow Assertion. Why: The public addresses should be found. How: This checks the allow line.
	expect( robTexStr ).toContain( 'Sitemap: https://comehang.app/sitemap.xml' ); // What: Sitemap Line Assertion. Why: Crawlers find the sitemap through robots.txt. How: This checks its absolute address.
	expect( sitTexStr ).toContain( '<loc>https://comehang.app/</loc>' );          // What: Root Entry Assertion. Why: The sitemap lists the canonical root. How: This checks its entry.


} );



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


