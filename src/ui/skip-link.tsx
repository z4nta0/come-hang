


// #region Imports

import cssModObj from './skip-link.module.css'; // What: CSS Module Object. Why: The skip link is styled in its own module, whose class names Vite hashes. How: Its anchor reads its class from this object.


import { modCliFun } from '../utils/click.ts'; // What: Modified Click Function. Why: A modified click on the skip link is left to the browser. How: This checks the click first in its handler.

// #endregion Imports



/**
 * skip-link.tsx = Skip Link
 *
 * @summary
 * The link every screen opens with, which takes a keyboard user straight to
 * the main content. It waits above the top edge of the screen until it's
 * focused, then slides into view, and a plain click moves focus to the main
 * element without putting #main in the address. A click with a modifier key
 * held is left to the browser, which opens the link its own way.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region SkiLinCom

/**
 * SkiLinCom = Skip Link Component
 *
 * @summary
 * Renders the skip link, which the app root places first, before the main
 * element, so it's the first stop on every screen. Its href is the bare
 * #main, so it means whichever screen is showing. A plain click cancels the
 * browser's own jump, which would leave the hash in the address, and focuses
 * the main element instead, so the next Tab continues into the content.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The skip link's anchor.
 *
 * @example
 * ```tsx
 * SkiLinCom() // => <SkiLinCom />
 * ```
 *
*/

function SkiLinCom () : React.JSX.Element {


	return (


		<a
			className={ cssModObj.skiLinAnc }

			href='#main'

			onClick={ ( cliEveObj ) => { // What: Skip Click Handler. Why: The jump should land in the content without leaving a hash in the address. How: This leaves a modified click to the browser, and otherwise cancels the default and focuses the main element.


				if ( modCliFun( cliEveObj ) ) return; // What: Modified Click Guard. Why: A click with a modifier key held, or with any button but the main one, asks the browser to handle the link its own way. How: This returns before the default is cancelled.



				cliEveObj.preventDefault(); // What: Default Prevent Call. Why: The browser's own jump would put #main in the address. How: This cancels it.

				document.getElementById( 'main' )?.focus(); // What: Main Focus Call. Why: Focus has to land in the content, so the next Tab continues from there. How: This focuses the main element, which also brings it into view.


			} }
		>Skip to main content</a> // What: Skip Link Anchor Element. Why: A keyboard user shouldn't have to Tab through everything before the content to reach it. How: This is the screen's first stop, waiting above the screen until it's focused, when it slides into view, and its click moves focus to the main element.


	);


}

// #endregion SkiLinCom

// #endregion Components



// #region Exports

export { SkiLinCom }; // What: Named Export. Why: The app root renders the skip link first on every screen. How: This exports SkiLinCom.

// #endregion Exports


