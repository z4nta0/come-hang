


/**
 * text.ts = Text Helpers
 *
 * @summary
 * Small helpers for showing text, such as the initials that stand in for a
 * name where there's only room for a letter or two. They split text by
 * what a reader sees as one character, so an emoji or an accented letter is
 * never cut in half.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

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

// #endregion Helpers



// #region Exports

export { iniTexFun }; // What: Named Export. Why: The group rail shows each group by its initials. How: This exports iniTexFun.

// #endregion Exports


