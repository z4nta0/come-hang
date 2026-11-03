


// #region Imports

import { colModAppFun } from '../platform/color-mode.ts'; // What: Color Mode Apply Function. Why: A light or dark choice made in the app should hold on these pages too. How: This is called once below, before the page paints.


import '../styles/fonts.css';  // What: Fonts Stylesheet Import. Why: The page's stylesheets assume the self-hosted font faces are already registered. How: This is imported first, purely for its side effect, so its @font-face rules register before the others.
import '../styles/styles.css'; // What: Styles Stylesheet Import. Why: The page reads the app's own tokens and base element styles. How: This is imported purely for its side effect, the same global stylesheet the app loads.
import './page.css';           // What: Page Stylesheet Import. Why: The page's own layout, skip link, links, and document need their rules. How: This is imported last, purely for its side effect, so its rules build on the global ones.

// #endregion Imports



/**
 * page.ts = Legal Page
 *
 * @summary
 * The script the static /privacy and /terms pages load. Importing their
 * stylesheets here lets the build bundle and fingerprint them the way it does
 * the app's. It applies a light or dark choice kept by the app, and gives the
 * skip link its click handler: a plain click focuses the page's main element
 * without putting #main in the address, while a modified click is left to the
 * browser. Without JavaScript the link still works as an ordinary jump to
 * #main, and the page follows the phone's light or dark setting.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



colModAppFun(); // What: Color Mode Apply Call. Why: The page should open in the light or dark mode chosen in the app. How: This sets the root's attribute from the kept choice.

document.querySelector< HTMLAnchorElement >( '[data-element-name-hook~="skiLinAnc"]' )?.addEventListener( 'click', ( cliEveObj ) => { // What: Skip Link Click Listener. Why: The skip link should move focus to the main content without leaving a hash in the address. How: This handles a plain click on the skip link and leaves any other to the browser.


	const altKeyBoo = cliEveObj.altKey;       // What: Alt Key Boolean. Why: Alt-click downloads the link in some browsers. How: This reads whether Alt was held.
	const conKeyBoo = cliEveObj.ctrlKey;      // What: Control Key Boolean. Why: Ctrl-click opens a new tab elsewhere. How: This reads whether Ctrl was held.
	const metKeyBoo = cliEveObj.metaKey;      // What: Meta Key Boolean. Why: Cmd-click opens a new tab on a Mac. How: This reads whether Cmd was held.
	const othButBoo = cliEveObj.button !== 0; // What: Other Button Boolean. Why: A click with any button but the main one should be left to the browser. How: This checks the click wasn't made with the main button, as a safeguard.
	const shiKeyBoo = cliEveObj.shiftKey;     // What: Shift Key Boolean. Why: Shift-click opens a new window. How: This reads whether Shift was held.

	const modCliBoo = metKeyBoo || conKeyBoo || shiKeyBoo || altKeyBoo || othButBoo; // What: Modified Click Boolean. Why: Any one of these means the visitor asked the browser to open the link its own way. How: This combines them.



	if ( modCliBoo ) return; // What: Modified Click Guard. Why: A modified click should open the link the browser's usual way. How: This leaves any such click alone.



	cliEveObj.preventDefault(); // What: Default Jump Cancel. Why: The default jump would add #main to the address. How: This stops the browser's own navigation.

	document.getElementById( 'main' )?.focus(); // What: Main Focus Call. Why: The next Tab should continue into the document. How: This focuses the main element, which takes focus through its tabindex of -1.


} );


