


// #region Imports

import { AppRooCom     } from './app.tsx';        // What: App Root Component. Why: This is the single component the whole app renders as. How: This is rendered inside the router below.
import { BrowserRouter } from 'react-router';     // What: Browser Router. Why: The routes read the real URL path. How: This wraps AppRooCom so every Route inside it can match against the address bar.
import { createRoot    } from 'react-dom/client'; // What: Create Root. Why: This is React's API for creating the root the app renders into. How: This is called once against index.html's appMouDiv element.
import { StrictMode    } from 'react';            // What: Strict Mode. Why: Development builds should flag unsafe patterns early. How: This wraps the whole tree below.


import './styles/styles.css'; // What: Styles Stylesheet Import. Why: This is the app's global stylesheet, holding the tokens and base styles every page relies on. How: This is imported purely for its side effect.

// #endregion Imports



/**
 * main.tsx = Main
 *
 * @summary
 * The app's entry point, loaded by index.html's module script and imported
 * nowhere else. It creates the single React root on index.html's appMouDiv
 * element and renders AppRooCom into it, wrapped in StrictMode for development
 * checks and BrowserRouter for the URL-based routing between the pages.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



createRoot( document.getElementById( 'appMouDiv' )! ).render( // What: Root Render Call. Why: This is the app's only mount, rendering the whole app into index.html's mount element. How: This creates a React root on appMouDiv and renders AppRooCom inside StrictMode and the router. // What: Non-Null Note. Why: getElementById's return type allows null. How: index.html always ships the appMouDiv element, so the lookup can't come back empty.


	<StrictMode>{ /* What: App Strict Mode. Why: Development builds should flag unsafe patterns early. How: This double-invokes renders and effects in development only, and does nothing in production. */ }


		<BrowserRouter>{ /* What: App Browser Router. Why: The routes read the real URL path. How: This provides history-based routing to everything inside AppRooCom. */ }


			<AppRooCom />{ /* What: App Root Component. Why: This is the whole app. How: This renders AppRooCom's routes. */ }


		</BrowserRouter>


	</StrictMode>


);


