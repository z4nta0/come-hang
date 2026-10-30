


// #region Imports

import { chromium      } from '@playwright/test'; // What: Chromium. Why: The card is captured in a real browser so it uses the app's own fonts and tokens. How: This launches Playwright's Chromium.
import { fileURLToPath } from 'node:url';         // What: File URL To Path. Why: The output path is resolved from this script's own location. How: This turns a file URL into a path.
import { statSync      } from 'node:fs';          // What: Stat Sync. Why: The finished image has to stay under the size WhatsApp accepts. How: This reads its size in bytes.

// #endregion Imports



/**
 * render.mts = Social Preview Card Renderer
 *
 * @summary
 * Rebuilds public/og-image.png, the 1,200x630 card shown when a link to the
 * app is shared, from card.html beside this script. It captures card.html in
 * Chromium at the card's exact size, in light mode, once the app's fonts and
 * the mark have loaded, and fails if the file reaches 300 KB, the size at
 * which WhatsApp stops showing it. Run it with npm run og-image whenever the
 * card or the app's look changes, and give a changed image a new filename,
 * since apps cache previews.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const CAR_URL_STR = new URL( './card.html', import.meta.url ).href;                         // What: Card URL String. Why: The card loads its fonts and mark by paths relative to itself. How: This is card.html's own file URL.
const MAX_BYT_NUM = 300 * 1024;                                                             // What: Maximum Bytes Number. Why: WhatsApp drops a preview image of 300 KB or more. How: This is the limit the finished file is checked against.
const OUT_PAT_STR = fileURLToPath( new URL( '../../public/og-image.png', import.meta.url ) ); // What: Output Path String. Why: The tags point at the card in public/. How: This resolves that path from this script's folder.

// #endregion Constants



// #region Module Init

const broInsObj = await chromium.launch();                                                                         // What: Browser Instance Object. Why: The card is drawn by a real browser. How: This launches Chromium.
const carPagObj = await broInsObj.newPage( { colorScheme : 'light', viewport : { height : 630, width : 1200 } } ); // What: Card Page Object. Why: The capture has to be exactly the card's size, in the light colors. How: This opens a 1,200x630 page set to light mode.


await carPagObj.goto( CAR_URL_STR ); // What: Card Load Call. Why: The card has to be on screen before it's captured. How: This opens card.html.

await carPagObj.evaluate( () => Promise.all( [ document.fonts.ready, ...[ ...document.images ].map( ( imaCurEle ) => imaCurEle.decode() ) ] ) ); // What: Fonts And Mark Ready Wait. Why: Text captured before its web font loads would be set in a fallback, and an undecoded mark would be missing. How: This waits for every font face and image.

await carPagObj.screenshot( { path : OUT_PAT_STR } ); // What: Card Capture Call. Why: This writes the finished image. How: This saves the page as a PNG in public/.

await broInsObj.close(); // What: Browser Close Call. Why: The script should exit once the card is saved. How: This shuts Chromium down.


const outBytNum = statSync( OUT_PAT_STR ).size; // What: Output Bytes Number. Why: The card has to stay under WhatsApp's limit. How: This reads the saved file's size.


if ( outBytNum >= MAX_BYT_NUM ) throw new Error( `og-image.png is ${ outBytNum.toLocaleString( 'en-US' ) } bytes, at or over the ${ MAX_BYT_NUM.toLocaleString( 'en-US' ) } byte limit.` ); // What: Size Guard. Why: An image over the limit would quietly drop out of WhatsApp previews. How: This fails the run with the file's size.



console.log( `Wrote ${ OUT_PAT_STR } (${ outBytNum.toLocaleString( 'en-US' ) } bytes).` ); // What: Result Log Call. Why: The run should say what it wrote. How: This prints the path and size.

// #endregion Module Init


