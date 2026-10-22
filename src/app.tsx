


// #region Imports

import { HomPagCom    } from './pages/home/home.tsx';           // What: Home Page Component. Why: The app's root address is its home page. How: The home route renders it.
import { NotFouCom    } from './pages/not-found/not-found.tsx'; // What: Not Found Component. Why: Unknown addresses need a page of their own. How: The catch-all route renders it.
import { Route        } from 'react-router';                    // What: Route. Why: Each page is matched to its path. How: This declares one route per page.
import { Routes       } from 'react-router';                    // What: Routes. Why: Only one page should render for any path. How: This renders the first route whose path matches.
import { useScrTopFun } from './ui/scroll-top.ts';              // What: Use Scroll Top Function. Why: A new page should open at its top rather than where the last one was scrolled. How: The app root calls it once, and it scrolls on every link-driven navigation.

// #endregion Imports



/**
 * app.tsx = App
 *
 * @summary
 * The app's root component, mounted by main.tsx inside the router: the main
 * landmark holding whichever page the address matches, in a column at least
 * as tall as the screen. It also returns the window to the top after each
 * link-driven navigation. A new page is added as another route here, above
 * the catch-all route that sends every unknown address to the 404 page. The
 * shared navigation joins once the app has pages to move between.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region AppRooCom

/**
 * AppRooCom = App Root Component
 *
 * @summary
 * The top of the component tree: renders the page the address matches
 * inside the main landmark, which fills a column at least as tall as the
 * screen, so a short page such as the 404 page can center itself in it. It
 * calls useScrTopFun once, so every link-driven navigation opens the new page
 * at its top.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The app's main element.
 *
 * @example
 * ```tsx
 * AppRooCom() // => <AppRooCom />
 * ```
 *
*/

function AppRooCom () : React.JSX.Element {


	useScrTopFun(); // What: Scroll Top Call. Why: Every link to another page should open it at its top. How: This runs the hook once from the root, which stays mounted across every route.



	return (


		<main
			style={{
				display       : 'flex',
				flexDirection : 'column',
				minHeight     : '100vh'
			}}
		>{ /* What: App Main Element. Why: Each page's content is the main landmark, and it should fill the screen. How: This holds whichever page the address matches and stacks it as a flex column at least as tall as the screen, so a page can stretch to fill it. */ }


			<Routes>{ /* What: Page Routes. Why: Only one page should render for any path. How: This renders the first route below whose path matches. */ }


				<Route
					element={ <HomPagCom /> }
					path='/'
				/>{ /* What: Home Route. Why: The app's root address is its home page. How: This renders HomPagCom at the root path. */ }



				<Route
					element={ <NotFouCom /> }
					path='*' // What: Catch-All Path. Why: Any address the app doesn't have should land on the 404 page. How: The asterisk matches every path no earlier route claimed.
				/>{ /* What: Not Found Route. Why: Unknown paths need a page of their own. How: This renders NotFouCom for every other path. */ }


			</Routes>


		</main>


	);


}

// #endregion AppRooCom

// #endregion Components



// #region Exports

export { AppRooCom }; // What: Named Export. Why: main.tsx is the sole consumer, mounting this as the app's root. How: This exports AppRooCom.

// #endregion Exports


