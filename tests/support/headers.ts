


// #region Imports

import { fileURLToPath } from 'node:url'; // What: File URL To Path. Why: The headers file sits in public/ at the repo root, two folders above this one. How: This turns that file's URL into a path to read.
import { readFileSync  } from 'node:fs';  // What: Read File Sync. Why: The headers are read from the file Netlify serves them from. How: This reads public/_headers as text.

// #endregion Imports



/**
 * headers.ts = Headers
 *
 * @summary
 * Reads the security headers the app sends from public/_headers, the file
 * Netlify applies to every response once deployed, so the security checks test
 * the real policy rather than a copy of it. Neither the dev server nor vite
 * preview reads that file, so this reader is the only way the tests get its
 * headers.
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

const HEA_PAT_STR = fileURLToPath( new URL( '../../public/_headers', import.meta.url ) ); // What: Headers Path String. Why: The checks read the file Netlify reads. How: This resolves public/_headers from this file's own address.

// #endregion Constants



// #region Helpers

// #region heaAllFun

/**
 * heaAllFun = Headers All Function
 *
 * @summary
 * Returns the headers public/_headers sends with every path, its /* block,
 * keyed by lowercase header name, the way Playwright reports response headers.
 * Netlify's format puts each path on a line of its own and indents that path's
 * headers below it, one Name: value pair per line, with # lines as comments,
 * so this reads the indented lines under /* until the next unindented path
 * line, skipping comments.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The /* block's headers, keyed by lowercase name.
 * @see {@link heaAllObj}
 *
 * @example
 * ```ts
 * heaAllFun() // => { 'x-frame-options' : 'DENY', ... }
 * ```
 *
*/

function heaAllFun () : Record< string, string > {


	const heaAllObj : Record< string, string > = {}; // What: Headers All Object. Why: Each header is looked up by name. How: This collects the /* block's headers.

	let insBloBoo = false; // What: Inside Block Boolean. Why: Only the lines under /* belong to it. How: This turns on at the /* line and off at the next unindented line that names a path.


	for ( const linTexStr of readFileSync( HEA_PAT_STR, 'utf8' ).split( '\n' ) ) { // What: Line Loop. Why: The file is read line by line, the way Netlify reads it. How: This walks every line of public/_headers.


		if ( /^\S/.test( linTexStr ) && !linTexStr.startsWith( '#' ) ) { insBloBoo = linTexStr.trim() === '/*'; continue; } // What: Path Line Guard. Why: An unindented line that isn't a comment names the path the lines below it apply to. How: This notes whether it's /* and moves on.



		const heaMatArr = insBloBoo ? linTexStr.match( /^\s+([^:#\s][^:]*):\s*(.*)$/ ) : null; // What: Header Match Array. Why: Only an indented Name: value line under /* is a header. How: This captures the name and value, or gives null for anything else.


		if ( heaMatArr ) heaAllObj[ heaMatArr[ 1 ].trim().toLowerCase() ] = heaMatArr[ 2 ].trim(); // What: Header Store Check. Why: Playwright reports response headers by lowercase name. How: This stores the header's value under its lowercase name.


	}



	return heaAllObj; // What: Headers All Return. Why: The checks read the policy from it. How: This hands back the collected headers.


}

// #endregion heaAllFun

// #endregion Helpers



// #region Exports

export { heaAllFun }; // What: Named Export. Why: The headers checks and the page checks both read the same policy. How: This exports the function that reads it.

// #endregion Exports


