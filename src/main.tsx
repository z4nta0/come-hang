


// #region Imports

import { AppRooCom     } from './app.tsx';                // What: App Root Component. Why: This is the single component the whole app renders as. How: This is rendered inside the router below.
import { BrowserRouter } from 'react-router';             // What: Browser Router. Why: The routes read the real URL path. How: This wraps AppRooCom so every Route inside it can match against the address bar.
import { colModAppFun  } from './platform/color-mode.ts'; // What: Color Mode Apply Function. Why: A kept light or dark choice should hold from the first render. How: This is called once before the render below.
import { createRoot    } from 'react-dom/client';         // What: Create Root. Why: This is React's API for creating the root the app renders into. How: This is called once against index.html's appMouDiv element.
import { StrictMode    } from 'react';                    // What: Strict Mode. Why: Development builds should flag unsafe patterns early. How: This wraps the whole tree below.


import './styles/fonts.css';  // What: Fonts Stylesheet Import. Why: The app's stylesheets assume the self-hosted font faces are already registered. How: This is imported before styles.css, purely for its side effect, so its @font-face rules register first.
import './styles/styles.css'; // What: Styles Stylesheet Import. Why: This is the app's global stylesheet, holding the tokens and base styles every page relies on. How: This is imported purely for its side effect.

// #endregion Imports



/**
 * main.tsx = Main
 *
 * @summary
 * The app's entry point, loaded by index.html's module script and imported
 * nowhere else. It applies the light or dark choice kept on this device, then
 * creates the single React root on index.html's appMouDiv element and renders
 * AppRooCom into it, wrapped in StrictMode for development checks and
 * BrowserRouter for the URL-based routing between the pages. In development,
 * outside a browser driven by a test, it also mounts the member switcher on a
 * root of its own after the app's, which a production build never loads.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



colModAppFun(); // What: Color Mode Apply Call. Why: The page should open in the chosen light or dark mode rather than switch after it renders. How: This sets the root's attribute from the kept choice before the render below.

createRoot( document.getElementById( 'appMouDiv' )! ).render( // What: Root Render Call. Why: This is the app's only mount, rendering the whole app into index.html's mount element. How: This creates a React root on appMouDiv and renders AppRooCom inside StrictMode and the router. // What: Non-Null Note. Why: getElementById's return type allows null. How: index.html always ships the appMouDiv element, so the lookup can't come back empty.


	<StrictMode>{ /* What: App Strict Mode. Why: Development builds should flag unsafe patterns early. How: This double-invokes renders and effects in development only, and does nothing in production. */ }


		<BrowserRouter>{ /* What: App Browser Router. Why: The routes read the real URL path. How: This provides history-based routing to AppRooCom and everything it renders. */ }


			<AppRooCom />{ /* What: App Root Component. Why: This is the whole app. How: This renders AppRooCom's routes. */ }


		</BrowserRouter>


	</StrictMode>


);



if ( import.meta.env.DEV && !navigator.webdriver ) void import( './dev/switcher.tsx' ).then( ( { DevSwiCom } ) => { // What: Switcher Mount Block. Why: Trying the app as several people needs the switcher, which the suites' driven browsers would only trip over and a production build must never hold. How: This loads it only in development outside a driven browser, a branch the build drops, then renders it on a root of its own.


	const devRooDiv = document.createElement( 'div' ); // What: Development Root Div. Why: The switcher sits apart from the app, after it in the page. How: This creates its mount element.


	document.body.append( devRooDiv ); // What: Append Call. Why: The switcher comes after the app in the page and in the Tab order. How: This adds the mount element at the body's end.

	createRoot( devRooDiv ).render( <DevSwiCom /> ); // What: Switcher Render Call. Why: The switcher is its own small app. How: This renders it into its mount element.


} );


