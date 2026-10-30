


// #region Imports

import { chromium      } from '@playwright/test'; // What: Chromium. Why: The icons are drawn in a real browser's canvas, the one image tool every machine running the tests already has. How: This launches Playwright's Chromium.
import { fileURLToPath } from 'node:url';         // What: File URL To Path. Why: The folders are resolved from this script's own location. How: This turns a file URL into a path.
import { readFileSync  } from 'node:fs';          // What: Read File Sync. Why: The source artwork is handed to the browser as data. How: This reads it from design/brand.
import { writeFileSync } from 'node:fs';          // What: Write File Sync. Why: Each finished icon is saved into public/. How: This writes its bytes.

// #endregion Imports



/**
 * render.mts = Icon Set Renderer
 *
 * @summary
 * Rebuilds the app's icons in public/ from the SVG sources in design/brand,
 * each drawn straight from the vector at its exact size, so every icon stays
 * crisp. The set is the SVG favicon modern browsers use, a favicon.ico for
 * the /favicon.ico request browsers make on their own, packing the outline
 * alone at 16px and the one-dot mark at 32 and 48px, the web app manifest's
 * icons at 192 and 512px on the rounded tile, a maskable 512px icon whose
 * square tile a launcher crops to its own shape, with the mark shrunk into
 * the safe zone every shape keeps, and an Apple touch icon on a square tile,
 * since iOS rounds the corners itself. Run it with npm run icons whenever the
 * artwork changes.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type IcoRecTyp = { // What: Icon Record Type. Why: Every PNG icon is described the same way. How: This names its file, its size, and how its tile is drawn.


	filStr : string,                           // What: File String. Why: Each icon is saved under its own name in public/. How: This is the file name.
	sizNum : number,                           // What: Size Number. Why: Each icon is square at its own size. How: This is its width and height in pixels.
	tilStr : 'maskable' | 'rounded' | 'square' // What: Tile String. Why: Launchers and iOS shape the tile themselves, while browsers show it as drawn. How: This is rounded as drawn, square for iOS to round, or maskable for a launcher to crop.


};

// #endregion Types



// #region Constants

// #region ICO_REC_ARR

/**
 * ICO_REC_ARR = Icon Record Array
 *
 * @summary
 * The PNG icons rendered from the full mark, in the order they're written.
 * Every row shares one shape, so its fields carry no comments of their own:
 *
 * - `filStr` (String): File String, the icon's file name in public/.
 *
 * - `sizNum` (Number): Size Number, the icon's width and height in pixels.
 *
 * - `tilStr` (String): Tile String, rounded as drawn, square for iOS to
 *   round, or maskable for a launcher to crop.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const ICO_REC_ARR : IcoRecTyp[] = [ // What: Icon Record Array. Why: Every PNG icon the head and the manifest link to is rendered from one list. How: Each row names a file, its size, and its tile.


	{ filStr : 'apple-touch-icon.png',         sizNum : 180, tilStr : 'square'   }, // What: Apple Touch Icon Row. Why: iOS draws the home screen icon at 180px and rounds its corners itself. How: This renders the full mark on a square tile.
	{ filStr : 'favicon-192x192.png',          sizNum : 192, tilStr : 'rounded'  }, // What: Large Icon Row. Why: Android and the manifest use a 192px icon. How: This renders the full mark on its rounded tile.
	{ filStr : 'favicon-512x512.png',          sizNum : 512, tilStr : 'rounded'  }, // What: Extra Large Icon Row. Why: Install screens and splash screens ask for a 512px icon. How: This renders the full mark on its rounded tile.
	{ filStr : 'favicon-maskable-512x512.png', sizNum : 512, tilStr : 'maskable' }  // What: Maskable Icon Row. Why: Android launchers crop an icon to their own shape. How: This renders the mark shrunk into the safe zone on a square tile.


];

// #endregion ICO_REC_ARR



const ICO_SIZ_ARR = [ 16, 32, 48 ];                                               // What: ICO Size Array. Why: favicon.ico should hold the sizes older browsers and Windows pick from. How: Each entry is one square size packed into the file.
const MAS_SCA_NUM = 0.8;                                                          // What: Maskable Scale Number. Why: A launcher may crop the tile to a circle 80% of its width, and the mark's tip reaches past that. How: This shrinks the mark about the tile's center to 80%.
const OUT_DIR_STR = fileURLToPath( new URL( '../../public/', import.meta.url ) ); // What: Output Directory String. Why: Browsers request icons from the app's root. How: This resolves public/ from this script's folder.

// #endregion Constants



// #region Module State

const ICO_SVG_STR = readFileSync( new URL( '../brand/icon.svg', import.meta.url ), 'utf8' );       // What: Icon SVG String. Why: The large icons show the full mark with its typing dots. How: This reads design/brand/icon.svg.
const SMA_SVG_STR = readFileSync( new URL( '../brand/icon-small.svg', import.meta.url ), 'utf8' ); // What: Small SVG String. Why: Icons around 32px show one coral dot in place of three. How: This reads design/brand/icon-small.svg.
const TIN_SVG_STR = readFileSync( new URL( '../brand/icon-tiny.svg', import.meta.url ), 'utf8' );  // What: Tiny SVG String. Why: At 16px only the outline reads. How: This reads design/brand/icon-tiny.svg.

// #endregion Module State



// #region Helpers

// #region tilSvgFun

/**
 * tilSvgFun = Tile SVG Function
 *
 * @summary
 * Returns the source SVG with its tile drawn the way the icon needs it:
 * unchanged for a rounded tile, with square corners for a square one, and
 * for a maskable one with square corners and the mark shrunk to the safe
 * zone about the tile's center. It throws when the source no longer holds
 * the tile or the mark's group in the form it expects, so a changed source
 * can't quietly yield a wrong icon.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param souSvgStr - Source SVG String: The source artwork's text.
 * @param tilStr    - Tile String: Rounded, square, or maskable.
 *
 * @returns The SVG text to draw.
 *
 * @example
 * ```ts
 * tilSvgFun(ICO_SVG_STR, 'square') // => '<?xml ...'
 * ```
 *
*/

function tilSvgFun ( souSvgStr : string, tilStr : IcoRecTyp[ 'tilStr' ] ) : string {


	if ( tilStr === 'rounded' ) return souSvgStr; // What: Rounded Tile Return. Why: A rounded tile is drawn as the source draws it. How: This returns the source unchanged.



	if ( !souSvgStr.includes( "rx='14'" ) || !souSvgStr.includes( "<g transform='translate(-1.78 1.67)'>" ) ) throw new Error( 'The source SVG no longer holds its tile and mark group in the expected form.' ); // What: Source Form Guard. Why: The edits below match the source's exact text. How: This stops the run when either piece has changed.



	const squSvgStr = souSvgStr.replace( "rx='14'", "rx='0'" ); // What: Square SVG String. Why: iOS and launchers shape the tile themselves. How: This squares the tile's corners.



	return tilStr === 'square' ? squSvgStr : squSvgStr.replace( "<g transform='translate(-1.78 1.67)'>", `<g transform='translate(32 32) scale(${ MAS_SCA_NUM }) translate(-32 -32) translate(-1.78 1.67)'>` ); // What: Tile Return. Why: A maskable icon keeps its mark inside the safe zone. How: This returns the square tile, shrinking the mark about the center for a maskable one.


}

// #endregion tilSvgFun

// #endregion Helpers



// #region Module Init

const broInsObj = await chromium.launch();   // What: Browser Instance Object. Why: The icons are drawn in a real browser's canvas. How: This launches Chromium.
const draPagObj = await broInsObj.newPage(); // What: Draw Page Object. Why: The canvas work runs inside a page. How: This opens a blank one.



// #region renPngFun

/**
 * renPngFun = Render PNG Function
 *
 * @summary
 * Draws an SVG at one square size inside the browser and returns the PNG's
 * bytes. The SVG is given that size as its width and height first, so the
 * browser rasterizes the vector at the target size rather than scaling a
 * smaller image.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param svgTexStr - SVG Text String: The artwork to draw.
 * @param icoSizNum - Icon Size Number: The icon's width and height in pixels.
 *
 * @returns A promise that resolves with the finished PNG's bytes.
 *
 * @example
 * ```ts
 * renPngFun(SMA_SVG_STR, 32) // => Buffer
 * ```
 *
*/

async function renPngFun ( svgTexStr : string, icoSizNum : number ) : Promise< Buffer > {


	const sizSvgStr = svgTexStr.replace( '<svg', `<svg width='${ icoSizNum }' height='${ icoSizNum }'` ); // What: Sized SVG String. Why: An SVG with only a view box has no size of its own to draw at. How: This gives its root element the target width and height.


	const pngB64Str = await draPagObj.evaluate( async ( [ souSvgStr, tarSizNum ] ) => { // What: PNG Base64 String. Why: The canvas lives in the page, so the finished image comes back as text. How: This runs the drawing in the page and returns the PNG as base64.


		const souImaObj = new Image(); // What: Source Image Object. Why: The SVG has to be decoded before it's drawn. How: This loads it from its text.


		souImaObj.src = `data:image/svg+xml;base64,${ btoa( souSvgStr ) }`; // What: Source Address Assignment. Why: The image loads from the text handed in. How: This sets it as a base64 data URL.


		await souImaObj.decode(); // What: Source Decode Wait. Why: Drawing an undecoded image draws nothing. How: This waits until it's ready.


		const finCanObj = document.createElement( 'canvas' ); // What: Final Canvas Object. Why: The icon is drawn at its exact size. How: This creates the canvas.


		finCanObj.width  = tarSizNum; // What: Final Width Assignment. Why: The icon is square at its target size. How: This sets the width.
		finCanObj.height = tarSizNum; // What: Final Height Assignment. Why: The icon is square at its target size. How: This sets the height.


		finCanObj.getContext( '2d' )!.drawImage( souImaObj, 0, 0, tarSizNum, tarSizNum ); // What: Icon Draw Call. Why: This draws the icon itself. How: This draws the SVG across the whole canvas. // What: Non-Null Note. Why: getContext can return null for an unsupported type. How: A 2D context is always available on a fresh canvas.



		return finCanObj.toDataURL( 'image/png' ).split( ',' )[ 1 ]; // What: PNG Data Return. Why: The bytes have to leave the page as text. How: This encodes the canvas as a PNG and returns its base64 part.


	}, [ sizSvgStr, icoSizNum ] as const ); // What: Drawing Arguments. Why: The page can't read this script's variables. How: This hands the sized SVG and the target size into the page. // What: Type Assertion Note. Why: Without it the array widens to one mixed type, so the page function's destructured parameters lose their own types. How: as const keeps it a readonly tuple, so each parameter is typed by its position.



	return Buffer.from( pngB64Str, 'base64' ); // What: PNG Bytes Return. Why: The caller writes bytes, not text. How: This decodes the base64 PNG into a buffer.


}

// #endregion renPngFun



writeFileSync( OUT_DIR_STR + 'favicon.svg', SMA_SVG_STR ); // What: SVG Favicon Write Call. Why: Modern browsers draw the vector favicon, sharp at every size. How: This copies the one-dot mark into public/.

for ( const icoRecObj of ICO_REC_ARR ) writeFileSync( OUT_DIR_STR + icoRecObj.filStr, await renPngFun( tilSvgFun( ICO_SVG_STR, icoRecObj.tilStr ), icoRecObj.sizNum ) ); // What: PNG Icon Loop. Why: Each PNG icon is saved under its own name. How: This renders every row's tile from the full mark and writes it into public/.



const icoPngArr = await Promise.all( ICO_SIZ_ARR.map( ( icoSizNum ) => renPngFun( icoSizNum === 16 ? TIN_SVG_STR : SMA_SVG_STR, icoSizNum ) ) ); // What: ICO PNG Array. Why: favicon.ico packs one PNG per size, the outline alone at 16px. How: This renders each of its sizes from the source that suits it.
const icoHeaBuf = Buffer.alloc( 6 + 16 * icoPngArr.length );                                                                              // What: ICO Header Buffer. Why: An ICO file starts with a header and one directory entry per image. How: This allocates both.


icoHeaBuf.writeUInt16LE( 1, 2 );                // What: ICO Type Write. Why: The format marks icons with type 1. How: This writes it after the reserved zero.
icoHeaBuf.writeUInt16LE( icoPngArr.length, 4 ); // What: ICO Count Write. Why: The header says how many images follow. How: This writes the count.


let icoOffNum = icoHeaBuf.length; // What: ICO Offset Number. Why: Each directory entry says where its image starts. How: This begins right after the header and directory.


for ( const [ icoIndNum, icoPngBuf ] of icoPngArr.entries() ) { // What: ICO Entry Loop. Why: Each image needs a directory entry. How: This writes one per size, in order.


	const entOffNum = 6 + 16 * icoIndNum; // What: Entry Offset Number. Why: Each entry has its own place in the directory. How: This finds it.


	icoHeaBuf.writeUInt8( ICO_SIZ_ARR[ icoIndNum ], entOffNum );     // What: Entry Width Write. Why: The entry names the image's width. How: This writes it.
	icoHeaBuf.writeUInt8( ICO_SIZ_ARR[ icoIndNum ], entOffNum + 1 ); // What: Entry Height Write. Why: The entry names the image's height. How: This writes it.

	icoHeaBuf.writeUInt16LE( 1, entOffNum + 4 );  // What: Entry Planes Write. Why: The format expects one color plane. How: This writes it.
	icoHeaBuf.writeUInt16LE( 32, entOffNum + 6 ); // What: Entry Depth Write. Why: The images are full-color PNGs with alpha. How: This writes 32 bits per pixel.

	icoHeaBuf.writeUInt32LE( icoPngBuf.length, entOffNum + 8 ); // What: Entry Size Write. Why: The entry says how many bytes its image takes. How: This writes the PNG's length.
	icoHeaBuf.writeUInt32LE( icoOffNum, entOffNum + 12 );       // What: Entry Offset Write. Why: The entry says where its image starts. How: This writes the running offset.


	icoOffNum += icoPngBuf.length; // What: Offset Advance. Why: The next image starts after this one. How: This adds its length.


}



writeFileSync( OUT_DIR_STR + 'favicon.ico', Buffer.concat( [ icoHeaBuf, ...icoPngArr ] ) ); // What: ICO Write Call. Why: Browsers request /favicon.ico on their own. How: This writes the header, directory, and PNGs as one file.

await broInsObj.close(); // What: Browser Close Call. Why: The script should exit once the icons are saved. How: This shuts Chromium down.

console.log( `Wrote favicon.svg, ${ ICO_REC_ARR.length } PNG icons, and favicon.ico to ${ OUT_DIR_STR }.` ); // What: Result Log Call. Why: The run should say what it wrote. How: This prints the files and folder.

// #endregion Module Init


