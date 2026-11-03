


// #region Imports

import cssModObj from './links.module.css'; // What: CSS Module Object. Why: The line is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.

// #endregion Imports



/**
 * links.tsx = Legal Links
 *
 * @summary
 * The line under a first step, such as starting or joining a group, saying
 * that taking it means agreeing to the terms and the privacy policy, with a
 * link to each. The links open the static pages in a new tab, so a form being
 * filled in stays as it was.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type LlcProTyp = { actStr : string, className? : string }; // What: Legal Links Component Props Type. Why: Each screen names its own step, and its grid places the line. How: This types LegLinCom's props.

// #region LegLinCom

/**
 * LegLinCom = Legal Links Component
 *
 * @summary
 * Renders one paragraph reading "By <the step>, you agree to Come Hang's
 * Terms of Service and Privacy Policy.", each document's name a link to its
 * static page that opens in a new tab. The caller's class joins the
 * paragraph's own, so its grid can place it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.actStr    - Action String: The step that means agreeing, such
 *                          as "asking to join".
 * @param props.className - Class Name: The caller's class for placing the
 *                          line, by default none.
 *
 * @returns The paragraph.
 *
 * @example
 * ```tsx
 * LegLinCom({ actStr, className }) // => <LegLinCom />
 * ```
 *
*/

function LegLinCom ( { actStr, className = '' } : LlcProTyp ) : React.JSX.Element {


	return (


		<p className={ ` ${ cssModObj.legLinPar }   ${ className } ` }>By { actStr }, you agree to Come Hang's <a href='/terms' rel='noopener noreferrer' target='_blank'>Terms of Service</a> and <a href='/privacy' rel='noopener noreferrer' target='_blank'>Privacy Policy</a>.</p> // What: Legal Links Paragraph Element. Why: Someone taking a first step should know it means agreeing to the terms and the policy, and be able to read both. How: This names the step, then links each document's static page in a new tab.


	);


}

// #endregion LegLinCom

// #endregion Components



// #region Exports

export { LegLinCom }; // What: Named Export. Why: The welcome and the join form show the line under their first steps. How: This exports LegLinCom.

// #endregion Exports


