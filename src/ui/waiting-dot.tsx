


// #region Imports

import cssModObj from './waiting-dot.module.css'; // What: CSS Module Object. Why: The dot is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.

// #endregion Imports



/**
 * waiting-dot.tsx = Waiting Dot
 *
 * @summary
 * The coral dot that marks a control leading to something waiting on the
 * member, such as a section tab over a join request, with the words a screen
 * reader adds to the control's name, such as ", 2 waiting". The dot stays in
 * the page while nothing waits, hidden, so it can fade in and out.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type WdcProTyp = { couNum : number, labStr : string, varStr : 'corner' | 'inline' }; // What: Waiting Dot Component Props Type. Why: The dot shows while something waits, says so to a screen reader, and sits on a control's corner or after its text. How: This types WaiDotCom's props.

// #region WaiDotCom

/**
 * WaiDotCom = Waiting Dot Component
 *
 * @summary
 * Renders the dot and its hidden words inside a control. While couNum is
 * above 0 the dot shows and the words read labStr; at 0 the dot fades away
 * and the words are empty, so the control's name is its own. The corner
 * dot sits on the top right of a grid control's first cell, and the inline
 * one follows the control's text.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.couNum - Count Number: How many items wait behind the
 *                       control.
 * @param props.labStr - Label String: The words a screen reader adds while
 *                       any wait, such as ", 2 waiting".
 * @param props.varStr - Variant String: Where the dot sits, `corner` or
 *                       `inline`.
 *
 * @returns The dot and its words.
 *
 * @example
 * ```tsx
 * WaiDotCom({ couNum, labStr, varStr }) // => <WaiDotCom />
 * ```
 *
*/

function WaiDotCom ( { couNum, labStr, varStr } : WdcProTyp ) : React.JSX.Element {


	return (


		<>


			<span
				className={` ${ cssModObj.waiDotSpa }   ${ varStr === 'corner' ? cssModObj.waiDotSpaCorner : cssModObj.waiDotSpaInline } `}

				data-waiting-dot-shown={ couNum > 0 || undefined } // What: Dot Shown State. Why: The dot fades in while something waits and out once nothing does. How: This marks it shown only while the count is above 0.

				aria-hidden='true'
			/>{ /* What: Waiting Dot Span Element. Why: A coral dot says at a glance that something waits behind the control, while the words below say it to a screen reader. How: This draws the dot, hidden from screen readers, in the corner or after the text. */ }

			<span className={ cssModObj.waiLabSpa }>{ couNum > 0 ? labStr : '' }</span>{ /* What: Waiting Label Span Element. Why: A screen reader should hear what the dot shows. How: This holds the words, hidden from sight, empty while nothing waits. */ }


		</>


	);


}

// #endregion WaiDotCom

// #endregion Components



// #region Exports

export { WaiDotCom }; // What: Named Export. Why: The frame's tabs, rail, switcher, and group sheet mark what's waiting. How: This exports WaiDotCom.

// #endregion Exports


