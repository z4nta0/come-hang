


// #region Imports

import cssModObj from './welcome.module.css'; // What: CSS Module Object. Why: The welcome screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { BraMarCom    } from '../ui/brand-mark.tsx'; // What: Brand Mark Component. Why: The welcome leads with the app's mark. How: This draws it above the name.
import { ButBasCom    } from '../ui/button.tsx';     // What: Button Base Component. Why: Starting a group is the welcome's one action. How: This draws it as the main action button.
import { MaiAreCom    } from '../ui/main-area.tsx';  // What: Main Area Component. Why: The welcome is the screen's main content. How: This holds it in the main landmark.
import { useScrOpeFun } from '../ui/screen.ts';      // What: Use Screen Open Function. Why: The button opens the screen for starting a group. How: This returns the function that opens it.

// #endregion Imports



/**
 * welcome.tsx = Welcome
 *
 * @summary
 * The screen someone sees before they belong to any group: the app's mark,
 * its name, a line on what it's for, and a button that starts a group,
 * centered in the screen. Nothing on it starts Firebase, so a first visit
 * makes no connection until the visitor acts.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region WelScrCom

/**
 * WelScrCom = Welcome Screen Component
 *
 * @summary
 * Renders the welcome in the screen's main area: the mark, the name as the
 * screen's one h1, the tagline, and the start button, which opens the screen
 * for starting a group as a new history entry.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The welcome's main area.
 *
 * @example
 * ```tsx
 * WelScrCom() // => <WelScrCom />
 * ```
 *
*/

function WelScrCom () : React.JSX.Element {


	const scrOpeFun = useScrOpeFun(); // What: Screen Open Function. Why: The start button opens another screen. How: This reads the function that opens one.



	return (


		<MaiAreCom className={ cssModObj.welScrMai }>{ /* What: Welcome Screen Main Area Component. Why: The welcome is the screen's whole content. How: This stacks the mark, name, tagline, and button in the middle of the screen. */ }


			<BraMarCom className={ cssModObj.welMarSvg } />{ /* What: Welcome Mark SVG Element. Why: The mark makes the app recognizable. How: This draws it at the top. */ }



			<h1 className={ cssModObj.welTitHea }>Come Hang</h1>{ /* What: Welcome Title Heading Element. Why: The screen's one heading names the app. How: This sets the name as the wordmark. */ }

			<p className={ cssModObj.welTagPar }>Plan get-togethers with your group: chat, set the date, see who's bringing what, and find each other on the day.</p>{ /* What: Welcome Tagline Paragraph Element. Why: A first visitor should know what the app is for. How: This says it in one line. */ }



			<ButBasCom
				className={ cssModObj.welStaBut }

				onClick={ () => scrOpeFun( { scrStr : 'create' } ) }
			>Start a group</ButBasCom>{ /* What: Welcome Start Button Component. Why: Starting a group is how someone begins. How: This opens the screen for starting one. */ }


		</MaiAreCom>


	);


}

// #endregion WelScrCom

// #endregion Components



// #region Exports

export { WelScrCom }; // What: Named Export. Why: The screen host shows the welcome to someone in no group. How: This exports WelScrCom.

// #endregion Exports


