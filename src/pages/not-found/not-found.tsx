


// #region Imports

import cssModObj from './not-found.module.css'; // What: CSS Module Object. Why: The 404 page is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { Link } from 'react-router'; // What: Link. Why: The way onward moves to the home page without a full page load. How: This renders it as a router link.

// #endregion Imports



/**
 * not-found.tsx = Not Found
 *
 * @summary
 * The page every unknown address lands on: a heading saying the page wasn't
 * found, a short line explaining it, and a way back to the home page,
 * centered in the screen. It names itself in the tab and asks search engines
 * not to index it, since the host answers every unknown address with this
 * page and a 200 status.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region NotFouCom

/**
 * NotFouCom = Not Found Component
 *
 * @summary
 * Renders the 404 page's title and its noindex robots tag, which React moves
 * into the document head, and its section holding the page's one h1, a short
 * line, and a button-styled link back to the home page.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The 404 page's title, robots tag, and section.
 *
 * @example
 * ```tsx
 * NotFouCom() // => <NotFouCom />
 * ```
 *
*/

function NotFouCom () : React.JSX.Element {


	return (


		<>{ /* What: Not Found Fragment. Why: The page's head tags and its content render side by side. How: This groups them without adding an element. */ }


			<title>Page Not Found | Come Hang</title>{ /* What: Page Title Element. Why: A visitor's tab and history should say the address they tried doesn't exist. How: React 19 moves this title into the document head while the page is shown. */ }

			<meta
				name='robots'

				content='noindex'
			/>{ /* What: Robots Meta Element. Why: The host answers every unknown path with the app and a 200 status, so search engines would otherwise index this page under every mistyped address. How: React 19 moves this tag into the document head while the page is shown. */ }



			<section className={ cssModObj.nofPagSec }>{ /* What: Not-Found Page Section Element. Why: The page's message should sit in the middle of the screen. How: This fills the app's main element and centers the heading, the line, and the link both ways. */ }


				<h1 className={ cssModObj.nofTitHea }>Page Not Found</h1>{ /* What: Not-Found Title Heading Element. Why: The heading says the address doesn't lead anywhere. How: This names what happened. */ }

				<p className={ cssModObj.nofNotPar }>The address you followed doesn't lead anywhere in the app. It may be mistyped, or the page may have moved.</p>{ /* What: Not-Found Note Paragraph Element. Why: A short line explains what went wrong. How: This gives the two likely reasons. */ }

				<Link
					className={ cssModObj.butBasAnc }

					to='/'
				>Go to the home page</Link>{ /* What: Button Base Anchor Link. Why: The visitor needs a clear way onward. How: This returns to the home page. */ }


			</section>


		</>


	);


}

// #endregion NotFouCom

// #endregion Components



// #region Exports

export { NotFouCom }; // What: Named Export. Why: The router renders the 404 page for every unknown address. How: This exports NotFouCom.

// #endregion Exports


