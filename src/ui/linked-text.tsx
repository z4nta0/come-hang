


// #region Imports

import cssModObj from './linked-text.module.css'; // What: CSS Module Object. Why: The links are styled in their own module, whose class names Vite hashes. How: Each link reads its classes from this object.


import { linParFun } from '../utils/links.ts'; // What: Link Parts Function. Why: The text's addresses are found before they're drawn. How: This splits the text into plain pieces and links.

// #endregion Imports



/**
 * linked-text.tsx = Linked Text
 *
 * @summary
 * Typed text drawn with its web addresses as links. Each link shows the
 * address as it was typed, opens it in a new tab without telling the site
 * where the visitor came from, and says so to screen readers. Everything
 * else stays plain text, so nothing typed is ever run or read as markup.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region LinTexCom

/**
 * LinTexCom = Linked Text Component
 *
 * @summary
 * Renders text as a run of plain pieces and links, in the order typed, for
 * a parent that holds text. The parent sets the links' colors through the
 * `--lin-tex-col` and `--lin-hov-col` custom properties where the default
 * accent wouldn't show.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.texValStr - Text Value String: The text as typed.
 *
 * @returns The text, its addresses as links.
 *
 * @example
 * ```tsx
 * LinTexCom({ texValStr : 'See www.example.com' }) // => <LinTexCom />
 * ```
 *
*/

function LinTexCom ( { texValStr } : { texValStr : string } ) : React.JSX.Element {


	return (


		<>{ /* What: Linked Text Fragment. Why: The pieces sit in the parent's own run of text. How: This groups them without adding an element. */ }{ linParFun( texValStr ).map( ( linParObj, parIndNum ) => linParObj.hreStr === '' ? linParObj.texStr : <a key={ parIndNum } className={ cssModObj.linTexAnc } href={ linParObj.hreStr } rel='noopener noreferrer' target='_blank'>{ linParObj.texStr }<span className={ cssModObj.linTabSpa }> (opens in a new tab)</span></a> ) }{ /* What: Link Part Map. Why: A plain piece shows as text and an address as a link, with no space added between them. How: This renders each piece in order on one line, since a line break here would change the text's spacing, the link opening its address in a new tab with its note for screen readers. */ }</>


	);


}

// #endregion LinTexCom

// #endregion Components



// #region Exports

export { LinTexCom }; // What: Named Export. Why: The chat draws its messages' words through it. How: This exports LinTexCom.

// #endregion Exports


