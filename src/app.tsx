


// #region Imports

import cssModObj from './app.module.css'; // What: CSS Module Object. Why: The main element is styled in the app's own module, whose class names Vite hashes. How: The main element reads its class from this object.


import { HomPagCom    } from './pages/home/home.tsx';           // What: Home Page Component. Why: The app's root address is its home page. How: The home route renders it.
import { NotFouCom    } from './pages/not-found/not-found.tsx'; // What: Not Found Component. Why: Unknown addresses need a page of their own. How: The catch-all route renders it.
import { Route        } from 'react-router';                    // What: Route. Why: Each page is matched to its path. How: This declares one route per page.
import { Routes       } from 'react-router';                    // What: Routes. Why: Only one page should render for any path. How: This renders the single route that best matches the path.
import { SkiLinCom    } from './ui/skip-link.tsx';              // What: Skip Link Component. Why: Every screen opens with a way for a keyboard user to jump straight to the content. How: The app root renders it first, before the main element.
import { useScrTopFun } from './ui/scroll-top.ts';              // What: Use Scroll Top Function. Why: A new page should open at its top rather than where the last one was scrolled, and back, forward, and a reload should return to where the visitor was. How: The app root calls it once, and it scrolls on every navigation.

// #endregion Imports



/**
 * app.tsx = App
 *
 * @summary
 * The app's root component, mounted by main.tsx inside the router: the skip
 * link every screen opens with, then the main landmark holding whichever page
 * the address matches, in a one-cell grid at least as tall as the screen. It
 * also opens each page the way a site of real pages does, at its top after a
 * link and at the earlier position on back, forward, and a reload. A new page
 * is added as another route here, above the catch-all route that sends every
 * unknown address to the 404 page. The shared navigation joins once the app
 * has pages to move between.
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
 * The top of the component tree: renders the skip link first, then the page
 * the address matches inside the main landmark, a one-cell grid at least as
 * tall as the screen that stretches the page to fill it, so a short page such
 * as the 404 page can center itself in it. The main element is the skip
 * link's target, so it carries the main id and can take focus without joining
 * the Tab order. It calls useScrTopFun once, so every link-driven navigation
 * opens the new page at its top, and back, forward, and a reload return to
 * the earlier position.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The skip link and the app's main element.
 *
 * @example
 * ```tsx
 * AppRooCom() // => <AppRooCom />
 * ```
 *
*/

function AppRooCom () : React.JSX.Element {


	useScrTopFun(); // What: Scroll Top Call. Why: Every link to another page should open it at its top, and back, forward, and a reload should return to the earlier position. How: This runs the hook once from the root, which stays mounted across every route.



	return (


		<>{ /* What: App Root Fragment. Why: The skip link and the main element render side by side, the skip link first so it's every screen's first stop. How: This groups them without adding a wrapper element. */ }


			<SkiLinCom />{ /* What: Skip Link Component. Why: A keyboard user should be able to jump straight to the content. How: This renders the skip link, which focuses the main element below. */ }



			<main
				id='main' // What: Main Identifier. Why: The skip link's #main names this element, and as a navigation target its id keeps its plain name. How: This gives the main element the id the skip link points at.

				className={ cssModObj.appConMai }

				tabIndex={ -1 } // What: Main Tab Index. Why: The skip link moves focus here, but the main element isn't a control. How: This lets it take focus from a script without joining the Tab order.
			>{ /* What: App Content Main Element. Why: Each page's content is the main landmark, and it should fill the screen. How: This holds whichever page the address matches in a one-cell grid at least as tall as the screen, whose single row stretches the page to fill it, so the page needs no named area. */ }


				<Routes>{ /* What: Page Routes. Why: Only one page should render for any path. How: This renders the single route below that best matches the path. */ }


					<Route
						element={ <HomPagCom /> }
						path='/'
					/>{ /* What: Home Route. Why: The app's root address is its home page. How: This renders HomPagCom at the root path. */ }



					<Route
						element={ <NotFouCom /> }
						path='*' // What: Catch-All Path. Why: Any address the app doesn't have should land on the 404 page. How: The asterisk matches every path, but ranks below a more specific route, such as the root path.
					/>{ /* What: Not Found Route. Why: Unknown paths need a page of their own. How: This renders NotFouCom for every other path. */ }


				</Routes>


			</main>


		</>


	);


}

// #endregion AppRooCom

// #endregion Components



// #region Exports

export { AppRooCom }; // What: Named Export. Why: main.tsx is the sole consumer, mounting this as the app's root. How: This exports AppRooCom.

// #endregion Exports


