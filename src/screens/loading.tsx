


// #region Imports

import cssModObj from './loading.module.css'; // What: CSS Module Object. Why: The loader is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { MaiAreCom } from '../ui/main-area.tsx'; // What: Main Area Component. Why: The loader is the screen's content while it waits. How: This holds it in the main landmark.
import { useEffect } from 'react';               // What: Use Effect. Why: The loader shows only once the wait has gone on a moment. How: This starts and clears the timer.
import { useState  } from 'react';               // What: Use State. Why: The loader appears partway through the wait. How: This holds whether it shows yet.

// #endregion Imports



/**
 * loading.tsx = Loading
 *
 * @summary
 * The screen shown while the app checks which groups someone is in. The
 * check usually takes a few milliseconds, so the screen starts blank and
 * shows its loader only once the wait passes 300ms, keeping a quick launch
 * from flashing it. The loader is the mark's three typing dots, bouncing one
 * after another, the middle one coral, with "Loading" told to screen readers
 * through a status message that's in the page from the start.
 *
 * Sections:
 *  - Constants
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const LOA_DEL_NUM = 300; // What: Loader Delay Number. Why: A wait shorter than this would only flash the loader. How: This is how many milliseconds pass before it shows.

// #endregion Constants



// #region Components

// #region LoaScrCom

/**
 * LoaScrCom = Loading Screen Component
 *
 * @summary
 * Renders the waiting screen: a main area holding the app's name as a hidden
 * heading and a status message, which gains "Loading" and the bouncing dots
 * once the wait passes 300ms.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The waiting screen's main area.
 *
 * @example
 * ```tsx
 * LoaScrCom() // => <LoaScrCom />
 * ```
 *
*/

function LoaScrCom () : React.JSX.Element {


	const [ shoLoaBoo, setShoLoaBoo ] = useState( false ); // What: Show Loader Boolean And Setter. Why: The loader waits before it appears. How: This turns true once the delay passes.



	useEffect( () => { // What: Loader Delay Effect. Why: A quick check shouldn't flash the loader. How: This shows it once the delay passes, and the cleanup cancels it when the wait ends first.


		const shoTimNum = window.setTimeout( () => setShoLoaBoo( true ), LOA_DEL_NUM ); // What: Show Timer Number. Why: The loader appears only after the delay. How: This schedules it.



		return () => window.clearTimeout( shoTimNum ); // What: Timer Cleanup Return. Why: A screen that loads before the delay never needs the loader. How: This cancels the timer.


	}, [] ); // What: Effect Dependency Array. Why: The delay starts once, as the wait begins. How: The empty list runs it on mount alone.



	return (


		<MaiAreCom className={ cssModObj.loaScrMai }>{ /* What: Loading Screen Main Area Component. Why: The wait is the screen's whole content. How: This centers the loader in the screen. */ }


			<h1 className={ cssModObj.loaTitHea }>Come Hang</h1>{ /* What: Loading Title Heading Element. Why: Every screen has one heading naming it, which a screen reader can find while the app loads. How: This names the app, hidden from sight. */ }

			<p
				className={ cssModObj.loaStaPar }

				role='status'
			>{ shoLoaBoo ? 'Loading' : '' }</p>{ /* What: Loading Status Paragraph Element. Why: A screen reader should hear that the app is loading, and a status added only when it speaks is often missed. How: This is in the page and empty from the start, hidden from sight, and gains "Loading" with the dots. */ }



			{ shoLoaBoo && ( // What: Loader Visibility Check. Why: The dots show only once the wait passes the delay. How: This renders them when it has.


				<div
					className={ cssModObj.loaDotDiv }

					aria-hidden='true'
				>{ /* What: Loading Dots Div Element. Why: The dots are what someone sees while waiting, and the status already says it in words. How: This lays the three dots out in a row, fading in, hidden from screen readers. */ }


					<span className={ cssModObj.loaDotSpa } />{ /* What: Loading Dot Span Element. Why: The first of the mark's typing dots. How: This draws it in periwinkle, bouncing first. */ }

					<span className={` ${ cssModObj.loaDotSpa }   ${ cssModObj.loaDotSpaSpark } `} />{ /* What: Loading Dot Span Element. Why: The middle dot carries the brand's coral spark, as in the mark. How: This draws it in coral, bouncing second. */ }

					<span className={ cssModObj.loaDotSpa } />{ /* What: Loading Dot Span Element. Why: The last of the mark's typing dots. How: This draws it in periwinkle, bouncing third. */ }


				</div>


			) }


		</MaiAreCom>


	);


}

// #endregion LoaScrCom

// #endregion Components



// #region Exports

export { LoaScrCom }; // What: Named Export. Why: The screen host shows it while the groups load. How: This exports LoaScrCom.

// #endregion Exports


