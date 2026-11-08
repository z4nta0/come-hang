


/**
 * text.ts = Text Helpers
 *
 * @summary
 * Small helpers for text, such as the initials that stand in for a name
 * where there's only room for a letter or two, a plain piece of a file name,
 * or a short list of names read as a phrase. Initials split text by what a
 * reader sees as one character, so an emoji or an accented letter is never
 * cut in half.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region filNamFun

/**
 * filNamFun = File Name Function
 *
 * @summary
 * Turns text into a piece of a file name that every system accepts: its
 * accents and apostrophes dropped, lowercased, and every run of anything but
 * a letter or a digit made one hyphen, with none left at either end, at most
 * 40 characters long. Text with nothing left, such as one made only of
 * emoji, gives an empty piece, for the caller to fill.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param texValStr - Text Value String: The text to name a file after.
 *
 * @returns The piece of the name, which may be empty.
 *
 * @example
 * ```ts
 * filNamFun('Café night!') // => 'cafe-night'
 * ```
 *
*/

const filNamFun = ( texValStr : string ) : string => { // What: File Name Function. Why: A downloaded file is named after what it holds, which may carry accents, spaces, or symbols. How: This keeps plain letters and digits, joined by hyphens.


	const plaTexStr = texValStr.normalize( 'NFKD' ).replace( /[\u0300-\u036f'\u2019]/g, '' ).toLowerCase(); // What: Plain Text String. Why: An accented letter should keep its plain letter, and an apostrophe shouldn't split a word. How: This splits each letter from its accent, drops the accents and apostrophes, and lowercases the rest.



	return plaTexStr.replace( /[^a-z0-9]+/g, '-' ).replace( /^-+|-+$/g, '' ).slice( 0, 40 ).replace( /-+$/, '' ); // What: Name Return. Why: A name piece should read plainly and stay short. How: This makes each run of other characters a hyphen, trims hyphens from both ends, and cuts it to 40 characters, trimming a hyphen the cut leaves.


};

// #endregion filNamFun



// #region iniTexFun

/**
 * iniTexFun = Initials Text Function
 *
 * @summary
 * Returns up to two initials for a name: the first character of its first
 * two words, uppercased, or the first character alone for a one-word name.
 * A character here is what a reader sees as one, so a name starting with an
 * emoji keeps the whole emoji.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param namValStr - Name Value String: The name to take initials from.
 *
 * @returns The initials, empty for an empty name.
 *
 * @example
 * ```ts
 * iniTexFun('Beach Day crew') // => 'BD'
 * ```
 *
*/

const iniTexFun = ( namValStr : string ) : string => { // What: Initials Text Function. Why: A narrow spot, such as a rail button, shows a name by its initials. How: This joins the first character of the first two words.


	const graSegObj = new Intl.Segmenter( undefined, { granularity : 'grapheme' } ); // What: Grapheme Segmenter Object. Why: An emoji or an accented letter can span several code points. How: This splits text where a reader sees characters.



	return namValStr.split( ' ' ).filter( ( worValStr ) => worValStr !== '' ).slice( 0, 2 ).map( ( worValStr ) => [ ...graSegObj.segment( worValStr ) ][ 0 ].segment.toUpperCase() ).join( '' ); // What: Initials Return. Why: Two initials fit a small square. How: This takes the first two words and returns each one's first character, uppercased, joined.


};

// #endregion iniTexFun



// #region lisPhrFun

/**
 * lisPhrFun = List Phrase Function
 *
 * @summary
 * Reads a list of names as an English phrase: one alone, two joined by
 * "and", three with commas and a final "and", and past three the first two
 * then how many more, from the total. It expects at least one name, and up
 * to three, or the first three when the total is higher.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param namValArr - Name Value Array: The names to read, in order.
 * @param totValNum - Total Value Number: How many names there are in all.
 *
 * @returns The phrase.
 *
 * @example
 * ```ts
 * lisPhrFun(['Chips', 'Salsa', 'Dip'], 5) // => 'Chips, Salsa, and 3 more'
 * ```
 *
*/

const lisPhrFun = ( namValArr : string[], totValNum : number ) : string => { // What: List Phrase Function. Why: A line naming a few things reads better as a sentence than as a list. How: This joins the names the way English does, counting the rest past three.


	if ( totValNum > 3 ) return `${ namValArr[ 0 ] }, ${ namValArr[ 1 ] }, and ${ ( totValNum - 2 ).toLocaleString( 'en-US' ) } more`; // What: Many Return. Why: A long list would crowd the line. How: This names the first two and counts the rest.



	if ( namValArr.length === 3 ) return `${ namValArr[ 0 ] }, ${ namValArr[ 1 ] }, and ${ namValArr[ 2 ] }`; // What: Three Return. Why: Three names read with commas and a final "and". How: This joins them so.



	return namValArr.join( ' and ' ); // What: Few Return. Why: One name stands alone and two are joined by "and". How: This joins them.


};

// #endregion lisPhrFun

// #endregion Helpers



// #region Exports

export { filNamFun, iniTexFun, lisPhrFun }; // What: Named Exports. Why: The group rail shows each group by its initials, a download is named after what it holds, and a chat line names a few items. How: This exports the three.

// #endregion Exports


