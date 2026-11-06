


// #region Imports

import cssModObj from './solo-settings.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { PerSetCom    } from './personal-settings.tsx'; // What: Personal Settings Component. Why: The phone's and account's parts are all of Settings while there's no group. How: This draws them.
import { useSetActFun } from './settings-actions.ts';   // What: Use Settings Actions Function. Why: The parts' changes run one at a time and are announced. How: This returns the runners and the messages.

// #endregion Imports



/**
 * solo-settings.tsx = Solo Settings
 *
 * @summary
 * The Settings section a phone in no group opens from the frame's tabs: its
 * heading, then the parts that belong to this phone and the account rather
 * than a group, the deletion of the member's data among them, and the legal
 * documents. A group's own Settings adds its parts around the same ones.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region SolSetCom

/**
 * SolSetCom = Solo Settings Component
 *
 * @summary
 * Renders the Settings section for a phone in no group: the heading over the
 * phone's part, the account's part, and the legal documents, read top to
 * bottom in one column, scrolling when they outgrow the content, then the
 * status that announces their changes and the alert that tells a failure.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The section.
 *
 * @example
 * ```tsx
 * SolSetCom() // => <SolSetCom />
 * ```
 *
*/

function SolSetCom () : React.JSX.Element {


	const setActObj = useSetActFun(); // What: Settings Actions Object. Why: The parts run their changes one at a time and are announced here. How: This holds the runners and the messages, passed on to PerSetCom.



	return (


		<div className={ cssModObj.solSetDiv }>{ /* What: Solo Settings Div Element. Why: The heading and the parts read top to bottom. How: This stacks them inside the gutter. */ }


			<h2 className={ cssModObj.setTitHea }>Settings</h2>{ /* What: Settings Title Heading Element. Why: The section needs a heading. How: This names it. */ }



			<PerSetCom setActObj={ setActObj } />{ /* What: Personal Settings Component. Why: This phone's and the account's settings, and the legal documents, belong to no one group. How: This draws their parts below the heading, running their changes through this section. */ }



			<p
				className={ cssModObj.setStaPar }

				role='status'
			>{ setActObj.staMesStr }</p>{ /* What: Settings Status Paragraph Element. Why: A change to these parts is announced, since the page itself changes silently. How: This holds the status, empty from the first render. */ }

			<p
				className={ cssModObj.setErrPar }

				role='alert'
			>{ setActObj.errMesStr }</p>{ /* What: Settings Error Paragraph Element. Why: A change that fails has to be told at once. How: This holds the alert, empty from the first render. */ }


		</div>


	);


}

// #endregion SolSetCom

// #endregion Components



// #region Exports

export { SolSetCom }; // What: Named Export. Why: The frame shows it as Settings while someone is in no group. How: This exports SolSetCom.

// #endregion Exports


