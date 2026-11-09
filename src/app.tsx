


// #region Imports

import cssModObj from './app.module.css'; // What: CSS Module Object. Why: The screen's container is styled in the app's own module, whose class names Vite hashes. How: The container reads its class from this object.


import { Navigate     } from 'react-router';              // What: Navigate. Why: An address the app doesn't use should give way to the root. How: The catch-all route renders it to replace the address.
import { OffBanCom    } from './ui/offline-banner.tsx';   // What: Offline Banner Component. Why: Every screen shows when the device is offline. How: This draws the banner.
import { Route        } from 'react-router';              // What: Route. Why: Each path the app answers is matched to what it renders. How: This declares one route per path.
import { Routes       } from 'react-router';              // What: Routes. Why: Only one route should render for any path. How: This renders the single route that best matches the path.
import { ScrHosCom    } from './screens/screen-host.tsx'; // What: Screen Host Component. Why: The app's root address shows whichever screen the visit is on. How: The root route renders it.
import { SkiLinCom    } from './ui/skip-link.tsx';        // What: Skip Link Component. Why: Every screen opens with a way for a keyboard user to jump straight to the content. How: The app root renders it first, before the screen.
import { useParams    } from 'react-router';              // What: Use Params. Why: An invite link carries its token in its path. How: The join route reads it.
import { usePusOpeFun } from './ui/push-open.ts';         // What: Use Push Open Function. Why: A push tapped while the app is open opens its group and section. How: This follows the service worker's messages.
import { useScrTopFun } from './ui/scroll-top.ts';        // What: Use Scroll Top Function. Why: A new page should open at its top rather than where the last one was scrolled, and back, forward, and a reload should return to where the visitor was. How: The app root calls it once, and it scrolls on every navigation.


import type { ScrStaTyp } from './ui/screen.ts'; // What: Screen State Type. Why: An invite link opens the join screen through a history entry. How: This types the entry's state.

// #endregion Imports



/**
 * app.tsx = App
 *
 * @summary
 * The app's root component, mounted by main.tsx inside the router: the skip
 * link every screen opens with, then the screen host in the container every
 * screen's layout measures. The app answers at one address, its root: any
 * other path is replaced with the root, so the screen host renders and the
 * address bar never keeps a path the app doesn't use. An invite link,
 * /join/<token>, is replaced with the root the same way, its entry opening
 * the join screen for the token, and so is a tapped push's address,
 * /open/<group>/<section>, whose entry opens the group at the section,
 * which a push tapped while the app is open reaches through the service
 * worker's message. It also opens each screen at its top after
 * a navigation and at the earlier position on back, forward, and a reload.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region JoiEntCom

/**
 * JoiEntCom = Join Entry Component
 *
 * @summary
 * Handles an invite link, /join/<token>, an entry address read once as the
 * app starts (ARCHITECTURE.md Section 14): renders a redirect that replaces
 * the address with the root, adding no history entry, while the entry's state
 * opens the join screen for the link's token.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The redirect to the root.
 *
 * @example
 * ```tsx
 * JoiEntCom() // => <JoiEntCom />
 * ```
 *
*/

function JoiEntCom () : React.JSX.Element {


	const joiStaObj : ScrStaTyp = { scrStr : 'join', tokStr : useParams().tokStr ?? '' }; // What: Join State Object. Why: The root shows the join screen for the link's token. How: This records the screen and the token from the path, empty if it's somehow missing.



	return (


		<Navigate
			replace
			state={ joiStaObj }
			to='/'
		/> // What: Join Redirect Navigate. Why: The invite link's path shouldn't stay in the bar or be returned to. How: This replaces the address with the root, carrying the join screen in the entry's state.


	);


}

// #endregion JoiEntCom



// #region PusEntCom

/**
 * PusEntCom = Push Entry Component
 *
 * @summary
 * Handles the address a tap on a push leads to, /open/<group>/<section>, an
 * entry address like an invite link's (ARCHITECTURE.md Section 11.1):
 * renders a redirect that replaces the address with the root, while the
 * entry's state opens the group at the section. A group the identity isn't
 * in opens its first group instead, and a section this version doesn't know
 * opens the default screen, as any entry's state would.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The redirect to the root.
 *
 * @example
 * ```tsx
 * PusEntCom() // => <PusEntCom />
 * ```
 *
*/

function PusEntCom () : React.JSX.Element {


	const { groStr, secStr } = useParams(); // What: Group String. Why: The push names its group. How: This reads it from the path. // What: Section String. Why: The push names the section its news is in. How: This reads it from the path.


	const pusStaObj = { groStr, scrStr : 'group', secStr }; // What: Push State Object. Why: The root shows the group at the section. How: This records the screen, the group, and the section, which the screen host checks.



	return (


		<Navigate
			replace
			state={ pusStaObj }
			to='/'
		/> // What: Push Redirect Navigate. Why: The push's address shouldn't stay in the bar or be returned to. How: This replaces the address with the root, carrying the group and section in the entry's state.


	);


}

// #endregion PusEntCom



// #region AppRooCom

/**
 * AppRooCom = App Root Component
 *
 * @summary
 * The top of the component tree: renders the skip link first, then the
 * screen host inside the app's container, a one-cell grid that every
 * screen's layout measures its width against. An address the app doesn't use
 * renders a redirect to the root instead, which replaces the address rather
 * than adding a history entry. Each screen holds its own main element, the
 * skip link's target. It calls useScrTopFun once, so every navigation opens
 * the new screen at its top, and back, forward, and a reload return to the
 * earlier position, and usePusOpeFun, so a push tapped while the app is open
 * opens its group and section.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The skip link and the app's container.
 *
 * @example
 * ```tsx
 * AppRooCom() // => <AppRooCom />
 * ```
 *
*/

function AppRooCom () : React.JSX.Element {


	usePusOpeFun(); // What: Push Open Call. Why: A push tapped while the app is open should open its group and section. How: This follows the service worker's messages from the root, which stays mounted.

	useScrTopFun(); // What: Scroll Top Call. Why: Every link to another page should open it at its top, and back, forward, and a reload should return to the earlier position. How: This runs the hook once from the root, which stays mounted across every route.



	return (


		<>{ /* What: App Root Fragment. Why: The skip link and the screen render side by side, the skip link first so it's every screen's first stop. How: This groups them without adding a wrapper element. */ }


			<SkiLinCom />{ /* What: Skip Link Component. Why: A keyboard user should be able to jump straight to the content. How: This renders the skip link, which focuses the main element below. */ }



			<OffBanCom />{ /* What: Offline Banner Component. Why: Someone offline should know what still works before anything else on the screen. How: This shows the banner above every screen while the device is offline. */ }



			<div className={ cssModObj.appRooDiv }>{ /* What: App Root Div Element. Why: Every screen lays out by the room the app has, and fills the screen. How: This holds whichever screen the address matches in a one-cell grid that names itself the app container. */ }


				<Routes>{ /* What: Page Routes. Why: Only one page should render for any path. How: This renders the single route below that best matches the path. */ }


					<Route
						element={ <ScrHosCom /> }
						path='/'
					/>{ /* What: Root Route. Why: The app's one address shows its screens. How: This renders ScrHosCom at the root path. */ }



					<Route
						element={ <JoiEntCom /> }
						path='/join/:tokStr'
					/>{ /* What: Join Route. Why: An invite link opens the join screen, while the address bar keeps only the root. How: This renders JoiEntCom for /join/ and a token. */ }



					<Route
						element={ <PusEntCom /> }
						path='/open/:groStr/:secStr'
					/>{ /* What: Push Route. Why: A tapped push opens its group and section, while the address bar keeps only the root. How: This renders PusEntCom for /open/, a group, and a section. */ }



					<Route
						element={ ( // What: Root Redirect Element. Why: The app answers at one address, so an address it doesn't use shouldn't render anything of its own or stay in the bar. How: This renders a redirect to the root in place of a page.


							<Navigate
								replace
								to='/'
							/> // What: Root Redirect Navigate. Why: The unknown address should give way to the root without leaving a history entry behind it. How: This replaces the address with the root, which the root route then renders.


						) }
						path='*' // What: Catch-All Path. Why: Any address the app doesn't use should give way to the root. How: The asterisk matches every path, but ranks below a more specific route, such as the root path.
					/>{ /* What: Unknown Address Route. Why: Every address should open the app, at its root. How: This renders the root redirect for every other path. */ }


				</Routes>


			</div>


		</>


	);


}

// #endregion AppRooCom

// #endregion Components



// #region Exports

export { AppRooCom }; // What: Named Export. Why: main.tsx is the sole consumer, mounting this as the app's root. How: This exports AppRooCom.

// #endregion Exports


