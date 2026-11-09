


/**
 * browser.ts = Browser Helpers
 *
 * @summary
 * Names the browser a page runs in, such as "Firefox 132.0", from its user
 * agent string, for a support message that should say where a problem
 * happened. A browser it doesn't recognize is reported by its whole user agent
 * string rather than a guess.
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

/**
 * BRO_PAT_ARR = Browser Pattern Array
 *
 * @summary
 * The browsers broNamFun recognizes, checked in order, since several user
 * agents carry another browser's token too: Edge, Opera, and Samsung Internet
 * carry Chrome's, and every iPhone and iPad browser carries Safari's, so each
 * comes before the browser it would otherwise pass for. Every row shares one
 * shape.
 *
 * - `namStr` (String): The browser's name, as the message gives it.
 *
 * - `regObj` (RegExp): The pattern that finds the browser in the user agent
 *   string, capturing its version in its first group.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const BRO_PAT_ARR : { namStr : string, regObj : RegExp }[] = [ // What: Browser Pattern Array. Why: A support message should name the browser rather than carry its whole user agent string. How: This lists each browser's pattern, the more specific first.


	{ namStr : 'Edge',             regObj : /Edg(?:A|iOS)?\/([\d.]+)/     }, // What: Edge Row. Why: Edge's user agent carries Chrome's token, or Safari's on an iPhone. How: This matches its own token on any device.
	{ namStr : 'Opera',            regObj : /OPR\/([\d.]+)/               }, // What: Opera Row. Why: Opera's user agent carries Chrome's token. How: This matches its own token.
	{ namStr : 'Samsung Internet', regObj : /SamsungBrowser\/([\d.]+)/    }, // What: Samsung Internet Row. Why: Samsung's browser carries Chrome's token. How: This matches its own token.
	{ namStr : 'Chrome',           regObj : /(?:Chrome|CriOS)\/([\d.]+)/  }, // What: Chrome Row. Why: Chrome is the browser left once those are ruled out, on an iPhone too. How: This matches its token on any device.
	{ namStr : 'Firefox',          regObj : /(?:Firefox|FxiOS)\/([\d.]+)/ }, // What: Firefox Row. Why: Firefox has its own token, a different one on an iPhone. How: This matches either.
	{ namStr : 'Safari',           regObj : /Version\/([\d.]+).*Safari/   }  // What: Safari Row. Why: Safari gives its version in a separate token from its name. How: This matches that token, last, since other browsers carry Safari's name.


];

// #endregion Constants



// #region Helpers

// #region broNamFun

/**
 * broNamFun = Browser Name Function
 *
 * @summary
 * Names the browser from its user agent string: the first pattern in
 * BRO_PAT_ARR that matches gives the browser's name and its version to two
 * parts, such as "Chrome 142.0". When none matches, the whole user agent
 * string comes back instead.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param useAgeStr - User Agent String: The browser's user agent string.
 *
 * @returns The browser's name and version, or the user agent string.
 *
 * @example
 * ```ts
 * broNamFun(navigator.userAgent) // => 'Firefox 132.0'
 * ```
 *
*/

const broNamFun = ( useAgeStr : string ) : string => { // What: Browser Name Function. Why: A support message should say which browser it came from. How: This returns the first matching browser's name and version, or the user agent string.


	for ( const broPatObj of BRO_PAT_ARR ) { // What: Pattern Loop. Why: The first pattern that matches names the browser, so their order decides. How: This tries each in turn.


		const verValStr = useAgeStr.match( broPatObj.regObj )?.[ 1 ]; // What: Version Value String. Why: A pattern that matches captures the version. How: This reads it, undefined when the pattern doesn't match.


		if ( verValStr !== undefined ) return `${ broPatObj.namStr } ${ verValStr.split( '.' ).slice( 0, 2 ).join( '.' ) }`; // What: Recognized Return. Why: A recognized browser reads best as its name and a short version. How: This returns them, the version cut to two parts.


	}



	return useAgeStr; // What: Unrecognized Return. Why: An unrecognized browser is still worth reporting. How: This returns the whole user agent string.


};

// #endregion broNamFun

// #endregion Helpers



// #region Exports

export { broNamFun }; // What: Named Export. Why: The support form names the browser it's sent from. How: This exports broNamFun.

// #endregion Exports


