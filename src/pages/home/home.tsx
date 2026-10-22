


// #region Imports

import cssModObj from './home.module.css'; // What: CSS Module Object. Why: The home page is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.

// #endregion Imports



/**
 * home.tsx = Home
 *
 * @summary
 * The page at the app's root address. For now it's a placeholder naming the
 * app and saying it's being built, centered in the screen; the group list
 * and the install and invite screens replace it as they're built. Its title
 * and description come from index.html.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region HomPagCom

/**
 * HomPagCom = Home Page Component
 *
 * @summary
 * Renders the placeholder home page: the page's one h1 naming the app and a
 * short note saying it's being built, centered both ways in the space the app
 * root gives it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The home page's section.
 *
 * @example
 * ```tsx
 * HomPagCom() // => <HomPagCom />
 * ```
 *
*/

function HomPagCom () : React.JSX.Element {


	return (


		<section className={ cssModObj.homPagSec }>{ /* What: Home Page Section Element. Why: The placeholder should sit in the middle of the screen. How: This fills the app's main element and centers its heading and note both ways. */ }


			<h1 className={ cssModObj.homTitHea }>Come Hang</h1>{ /* What: Home Title Heading Element. Why: Every page needs one heading naming it. How: This names the app. */ }

			<p className={ cssModObj.homNotPar }>Plan get-togethers with your group. The app is still being built, so there's nothing to do here yet.</p>{ /* What: Home Note Paragraph Element. Why: A visitor should know the empty page is expected. How: This says what the app is for and that it isn't ready. */ }


		</section>


	);


}

// #endregion HomPagCom

// #endregion Components



// #region Exports

export { HomPagCom }; // What: Named Export. Why: The router renders the home page at the root address. How: This exports HomPagCom.

// #endregion Exports


