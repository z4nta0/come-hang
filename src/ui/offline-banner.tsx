


// #region Imports

import cssModObj from './offline-banner.module.css'; // What: CSS Module Object. Why: The banner is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { useLayoutEffect } from 'react';            // What: Use Layout Effect. Why: The screen below makes room for the banner before it's drawn. How: This measures the banner after each change of size, before paint.
import { useLinBooFun    } from './online.ts';      // What: Use Link Boolean Function. Why: The banner also shows while the chat can't connect. How: This follows the chat's connection.
import { useOnlBooFun    } from './online.ts';      // What: Use Online Boolean Function. Why: The banner shows while the device is offline. How: This follows the connection.
import { useRef          } from 'react';            // What: Use Reference. Why: The banner's height is measured. How: This holds its element.

// #endregion Imports



/**
 * offline-banner.tsx = Offline Banner
 *
 * @summary
 * The band above every screen while the device is offline (ARCHITECTURE.md
 * Section 14), saying what still works: what's on the device still shows,
 * and messages send once the device is back online. While the device is
 * online but the chat can't reach its database, it says that instead, and
 * that messages send once the chat is back. It's a status region
 * that's always in the page and empty while online, so a screen reader hears
 * the change, and it shares its height with the screens through the
 * `--off-ban-hei` custom property on the body, so a screen exactly the
 * window's height can make room for it.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region OffBanCom

/**
 * OffBanCom = Offline Banner Component
 *
 * @summary
 * Renders the offline status region, holding the banner's words while the
 * device is offline or the chat can't connect, and empty otherwise, and
 * keeps the body's
 * `--off-ban-hei` at its height, 0 while it's empty, removing the property
 * when it goes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The status region.
 *
 * @example
 * ```tsx
 * OffBanCom({}) // => <OffBanCom />
 * ```
 *
*/

function OffBanCom () : React.JSX.Element {


	const banEleRef = useRef< HTMLParagraphElement >( null ); // What: Banner Element Reference. Why: The banner's height is measured. How: This holds its paragraph.
	const linValBoo = useLinBooFun();                         // What: Link Value Boolean. Why: The banner speaks while the chat can't connect. How: This reads the chat's connection.
	const onlValBoo = useOnlBooFun();                         // What: Online Value Boolean. Why: The banner speaks while offline. How: This reads the connection.



	useLayoutEffect( () => { // What: Height Share Effect. Why: A screen exactly the window's height has to shrink by the banner's height to stay on screen. How: This keeps the body's custom property at the banner's height while it's shown.


		const banCurEle = banEleRef.current; // What: Banner Current Element. Why: The observer watches the drawn banner. How: This reads it.


		if ( banCurEle === null ) return; // What: Undrawn Guard. Why: Nothing is measured before the banner is drawn. How: This returns.



		const resObsObj = new ResizeObserver( () => document.body.style.setProperty( '--off-ban-hei', `${ banCurEle.offsetHeight }px` ) ); // What: Resize Observer Object. Why: The banner's height changes as it shows, hides, and wraps. How: This copies it to the body each time.


		resObsObj.observe( banCurEle ); // What: Observe Call. Why: Every change of height should reach the screens. How: This starts watching the banner.



		return () => { // What: Cleanup Return. Why: Nothing should keep room for a banner that's gone. How: This stops watching and removes the property.


			resObsObj.disconnect(); // What: Disconnect Call. Why: The observer shouldn't outlive the banner. How: This stops it.

			document.body.style.removeProperty( '--off-ban-hei' ); // What: Property Remove Call. Why: The screens should take the whole window again. How: This removes the property.


		};


	}, [] ); // What: Effect Dependency Array. Why: The observer is set up once for the banner's life. How: The empty list runs it once.



	return (


		<p
			ref={ banEleRef }

			className={ cssModObj.offBanPar }

			role='status'
		>{ !onlValBoo ? "You're offline. What's on this device still shows, and your messages will send once you're back online." : linValBoo ? '' : "The chat can't connect right now. What's on this device still shows, and your messages will send once it's back." }{ /* What: Banner Words Check. Why: The banner speaks while offline, and while online but the chat can't connect. How: This shows the offline words, else the chat's words when it can't connect, else nothing. */ }</p> // What: Offline Banner Paragraph Element. Why: Someone offline, or whose chat can't connect, should know what still works, and a screen reader should hear it. How: This is a status region in the warning colors, empty while all is well.


	);


}

// #endregion OffBanCom

// #endregion Components



// #region Exports

export { OffBanCom }; // What: Named Export. Why: The app shows the banner above every screen. How: This exports OffBanCom.

// #endregion Exports


