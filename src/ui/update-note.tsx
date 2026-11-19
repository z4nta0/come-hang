


// #region Imports

import cssModObj from './update-note.module.css'; // What: CSS Module Object. Why: The note is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom            } from './button.tsx';            // What: Button Base Component. Why: The Reload action is the app's shared main button. How: This draws it.
import { relNowFun            } from '../platform/update.ts';   // What: Reload Now Function. Why: The member chooses when to load the new version. How: The Reload button calls it.
import { updReaFun            } from '../platform/update.ts';   // What: Update Ready Function. Why: The note shows once a new version is ready. How: This reads the flag.
import { updSubFun            } from '../platform/update.ts';   // What: Update Subscribe Function. Why: The note follows the update as it becomes ready. How: This listens for it.
import { useLayoutEffect      } from 'react';                   // What: Use Layout Effect. Why: The screen below makes room for the note before it's drawn. How: This measures the note after each change of size, before paint.
import { useRef               } from 'react';                   // What: Use Reference. Why: The note's height is measured. How: This holds its element.
import { useSyncExternalStore } from 'react';                   // What: Use Sync External Store. Why: The update's state lives outside React. How: This reads it and rerenders when it changes.

// #endregion Imports



/**
 * update-note.tsx = Update Note
 *
 * @summary
 * The band above every screen, below the offline banner, once a new version
 * has taken over while something was being edited, so the update waits for
 * the member instead of reloading under them. It says a new version is ready
 * beside a Reload button. It's a status region that's always in the page and
 * empty until then, so a screen reader hears it arrive, and it shares its
 * height with the screens through the `--upd-not-hei` custom property on the
 * body, the way the offline banner shares its own.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region UpdNotCom

/**
 * UpdNotCom = Update Note Component
 *
 * @summary
 * Renders the update's status region, holding the note and its Reload button
 * once a new version is ready, and empty until then, and keeps the body's
 * `--upd-not-hei` at its height, 0 while it's empty, removing the property
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
 * UpdNotCom({}) // => <UpdNotCom />
 * ```
 *
*/

function UpdNotCom () : React.JSX.Element {


	const notEleRef = useRef< HTMLDivElement >( null );                // What: Note Element Reference. Why: The note's height is measured. How: This holds its region.
	const updReaBoo = useSyncExternalStore( updSubFun, updReaFun ); // What: Update Ready Boolean. Why: The note shows only once a new version is ready. How: This follows the update's flag.



	useLayoutEffect( () => { // What: Height Share Effect. Why: A screen exactly the window's height has to shrink by the note's height to stay on screen. How: This keeps the body's custom property at the note's height while it's shown.


		const notCurEle = notEleRef.current; // What: Note Current Element. Why: The observer watches the drawn note. How: This reads it.


		if ( notCurEle === null ) return; // What: Undrawn Guard. Why: Nothing is measured before the note is drawn. How: This returns.



		const resObsObj = new ResizeObserver( () => document.body.style.setProperty( '--upd-not-hei', `${ notCurEle.offsetHeight }px` ) ); // What: Resize Observer Object. Why: The note's height changes as it shows and wraps. How: This copies it to the body's custom property.


		resObsObj.observe( notCurEle ); // What: Observe Call. Why: Every change of height should reach the screens. How: This starts watching the note.



		return () => { // What: Cleanup Return. Why: Nothing should keep room for a note that's gone. How: This stops watching and removes the property.


			resObsObj.disconnect(); // What: Disconnect Call. Why: The observer shouldn't outlive the note. How: This stops it.

			document.body.style.removeProperty( '--upd-not-hei' ); // What: Property Remove Call. Why: The screens should take the whole window again. How: This removes the property.


		};


	}, [] ); // What: Effect Dependency Array. Why: The observer is set up once for the note's life. How: The empty list runs it once.



	return (


		<div
			ref={ notEleRef }

			className={ cssModObj.updNotDiv }

			data-element-name-hook='updNotDiv'

			role='status'
		>{ /* What: Update Note Div Element. Why: The note has to reach screen reader users, and a region added at the moment it speaks is often missed. How: This stays in the page from the first render, empty until an update is ready, and its tests find it by its hook. */ }


			{ updReaBoo && ( // What: Update Ready Check. Why: The note exists only once a new version is waiting. How: This renders its words and button only while updReaBoo is true.


				<>{ /* What: Update Note Fragment. Why: The words and the button sit side by side in the band. How: This groups them without adding a wrapper element. */ }


					<p className={ cssModObj.updMesPar }>A new version of Come Hang is ready.</p>{ /* What: Update Message Paragraph Element. Why: The note says what's waiting. How: This renders the fixed message. */ }



					<ButBasCom onClick={ relNowFun }>Reload</ButBasCom>{ /* What: Button Base Component. Why: The member chooses when to load the new version, once what they're doing is done. How: This reloads the page when pressed. */ }


				</>


			) }


		</div>


	);


}

// #endregion UpdNotCom

// #endregion Components



// #region Exports

export { UpdNotCom }; // What: Named Export. Why: The app shows the note above every screen. How: This exports UpdNotCom.

// #endregion Exports


