


/**
 * links.ts = Link Helpers
 *
 * @summary
 * Finds the web addresses in a piece of typed text, so a screen can show
 * them as links while the rest stays text. An address starts with http://,
 * https://, or www., runs to the next space, and drops the punctuation a
 * sentence leaves after it, such as a full stop or a closing bracket that
 * was never opened inside it. Only an address the browser reads as an http
 * or https one with a dotted host becomes a link, so text shaped like any
 * other kind of address stays text.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type LinParTyp = { hreStr : string, texStr : string }; // What: Link Part Type. Why: Text with links in it is drawn as a run of plain pieces and links. How: This holds a piece's words and the address it opens, empty for plain text.

// #endregion Types



// #region Constants

const END_PUN_REG = /[.,!?;:'"*]$/;                       // What: End Punctuation Regular Expression. Why: A sentence's punctuation after an address isn't part of it. How: This matches one such mark at the end.
const HOS_DOT_REG = /^[^.]+(\.[^.]+)+$/;                  // What: Host Dotted Regular Expression. Why: A real site's host has at least two parts. How: This matches parts joined by single dots.
const LIN_PAT_REG = /(?:https?:\/\/|www\.)[^\s<>"]+/gi;   // What: Link Pattern Regular Expression. Why: An address is recognized by how it starts. How: This matches http://, https://, or www. and what follows up to a space, an angle bracket, or a quote.
const WOR_CHA_REG = /[\p{L}\p{N}@]/u;                     // What: Word Character Regular Expression. Why: An address starting inside a word or an email isn't one. How: This matches a letter, a digit, or an at sign.

// #endregion Constants



// #region Helpers

// #region linHreFun

/**
 * linHreFun = Link Hypertext-Reference Function
 *
 * @summary
 * Turns a typed address into the address a link opens, or an empty string
 * when it isn't one worth linking. An address starting with www. opens over
 * https. The browser has to read it as an http or https address whose host
 * has at least two dotted parts.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param linTexStr - Link Text String: The address as typed.
 *
 * @returns The address to open, or an empty string.
 *
 * @example
 * ```ts
 * linHreFun('www.example.com/a') // => 'https://www.example.com/a'
 * ```
 *
*/

const linHreFun = ( linTexStr : string ) : string => { // What: Link Hypertext-Reference Function. Why: Only a real web address should become a link. How: This parses the typed address and checks its scheme and host.


	const urlTexStr = /^www\./i.test( linTexStr ) ? `https://${ linTexStr }` : linTexStr; // What: URL Text String. Why: An address typed from www. has no scheme. How: This puts https in front of one.


	let urlValObj : URL; // What: URL Value Object. Why: The browser's own parser decides what the address is. How: This holds the parsed address.



	try { urlValObj = new URL( urlTexStr ); } // What: Parse Attempt. Why: Text shaped like an address may not be one. How: This parses it.

	catch { return ''; } // What: Parse Catch. Why: Text the browser can't read as an address isn't a link. How: This returns nothing.



	const hosDotBoo = HOS_DOT_REG.test( urlValObj.hostname );                                 // What: Host Dotted Boolean. Why: A host with one part, or an empty part, isn't a site someone meant to share. How: This checks its parts.
	const schWebBoo = urlValObj.protocol === 'http:' || urlValObj.protocol === 'https:';      // What: Scheme Web Boolean. Why: Only web pages open from a message. How: This checks the scheme is http or https.



	return hosDotBoo && schWebBoo ? urlValObj.href : ''; // What: Address Return. Why: The link opens the address as the browser reads it. How: This returns it, or nothing when a check fails.


};

// #endregion linHreFun



// #region linParFun

/**
 * linParFun = Link Parts Function
 *
 * @summary
 * Splits text into the plain pieces and the links it holds, in order, so
 * joining every piece's words gives the text back unchanged. An address
 * that starts inside a word, or that linHreFun turns down, stays part of
 * the plain text around it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param texValStr - Text Value String: The text as typed.
 *
 * @returns The pieces, each with its words and its address, empty for
 *          plain text.
 *
 * @see {@link linParArr}
 *
 * @example
 * ```ts
 * linParFun('See www.a.com.') // => [ 'See ', link 'www.a.com', '.' ]
 * ```
 *
*/

const linParFun = ( texValStr : string ) : LinParTyp[] => { // What: Link Parts Function. Why: A message shows its addresses as links. How: This walks each address found and collects the text between them.


	const linParArr : LinParTyp[] = []; // What: Link Part Array. Why: The pieces are collected in order. How: This starts empty.


	let texStaNum = 0; // What: Text Start Number. Why: The plain text between two links is one piece. How: This is where the text not yet collected starts.


	for ( const linMatObj of texValStr.matchAll( LIN_PAT_REG ) ) { // What: Match Loop. Why: Each address found may become a link. How: This checks each in order.


		const linStaNum = linMatObj.index; // What: Link Start Number. Why: The text before the address is plain. How: This is where the address starts.


		let linTexStr = linMatObj[ 0 ]; // What: Link Text String. Why: Trailing punctuation is trimmed off the address. How: This starts as everything matched.


		while ( END_PUN_REG.test( linTexStr ) || ( linTexStr.endsWith( ')' ) && linTexStr.split( '(' ).length < linTexStr.split( ')' ).length ) ) linTexStr = linTexStr.slice( 0, -1 ); // What: Trim Loop. Why: A sentence's punctuation, or a bracket closing one opened before the address, isn't part of it. How: This drops the last character while it's such a mark.



		const linHreStr = linHreFun( linTexStr );                                                    // What: Link Hypertext-Reference String. Why: Only a real address becomes a link. How: This reads the address to open, empty when it isn't one.
		const worMidBoo = linStaNum > 0 && WOR_CHA_REG.test( texValStr[ linStaNum - 1 ] );           // What: Word Middle Boolean. Why: An address starting inside a word or an email isn't one. How: This checks the character before it.


		if ( linHreStr === '' || worMidBoo ) continue; // What: Plain Guard. Why: Text that isn't a link stays with the text around it. How: This leaves it uncollected, for the next plain piece.



		if ( linStaNum > texStaNum ) linParArr.push( { hreStr : '', texStr : texValStr.slice( texStaNum, linStaNum ) } ); // What: Plain Push Call. Why: The text before the link is its own piece. How: This adds it when there is any.



		linParArr.push( { hreStr : linHreStr, texStr : linTexStr } ); // What: Link Push Call. Why: The address shows as typed and opens as parsed. How: This adds the link.

		texStaNum = linStaNum + linTexStr.length; // What: Start Move Assignment. Why: The next plain piece starts after the link. How: This moves past it.


	}



	if ( texStaNum < texValStr.length ) linParArr.push( { hreStr : '', texStr : texValStr.slice( texStaNum ) } ); // What: Tail Push Call. Why: The text after the last link is plain. How: This adds it when there is any.



	return linParArr; // What: Parts Return. Why: The caller draws each piece. How: This returns them in order.


};

// #endregion linParFun

// #endregion Helpers



// #region Exports

export { linParFun, type LinParTyp }; // What: Named Exports. Why: The linked text component draws the pieces. How: This exports the splitter and its piece type.

// #endregion Exports


