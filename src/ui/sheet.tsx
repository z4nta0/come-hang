


// #region Imports

import cssModObj from './sheet.module.css'; // What: CSS Module Object. Why: The sheet is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { IcoSvgCom           } from './icon.tsx'; // What: Icon SVG Component. Why: The sheet's close button shows a cross. How: This draws it.
import { useImperativeHandle } from 'react';      // What: Use Imperative Handle. Why: The screen that owns a sheet opens and closes it. How: This hands that screen the two functions.
import { useRef              } from 'react';      // What: Use Reference. Why: The sheet opens and closes as a dialog element. How: This holds it.
import { useState            } from 'react';      // What: Use State. Why: The sheet plays its closing slide before it closes. How: This holds whether it's closing.

// #endregion Imports



/**
 * sheet.tsx = Sheet
 *
 * @summary
 * A modal sheet that rises from the bottom of the screen over a dimmed page:
 * a bar with its title and a close button, then whatever the screen puts in
 * it. The screen that owns it opens and closes it through a handle.
 *
 * Sections:
 *  - Types
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type SheHanTyp = { cloFun : () => void, opeFun : () => void }; // What: Sheet Handle Type. Why: The screen that owns a sheet opens and closes it. How: This types the two functions the sheet hands it.

// #endregion Types



// #region Components

type SdcProTyp = { children : React.ReactNode, ideStr : string, onCloFun? : () => void, ref : React.Ref< SheHanTyp >, titStr : string }; // What: Sheet Dialog Component Props Type. Why: A sheet holds its screen's content under a title, hands its screen a handle, and may tell it when it has closed. How: This types SheDiaCom's props.

// #region SheDiaCom

/**
 * SheDiaCom = Sheet Dialog Component
 *
 * @summary
 * Renders a sheet as a modal dialog: a scrim dimming the page and a panel
 * that slides up from the bottom, holding a bar with the title and a close
 * button above the children, which stack a tier 3 space apart. The dialog
 * takes its name from the title. The handle's opeFun opens it as a modal,
 * making the page behind it inert, and its cloFun slides it down, as do the
 * close button, Escape, and a tap of the dimmed page. Once the panel's
 * closing slide ends the dialog closes, returning focus to whatever opened
 * it, and onCloFun runs, so a screen whose opener has gone can place focus
 * itself. The closing slide still ends under reduced motion.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.children - Children: What the sheet holds below its bar.
 * @param props.ideStr   - Identifier String: The title's ID, unique on the
 *                         page, which names the dialog.
 * @param props.onCloFun - On Close Function: Runs once the sheet has closed,
 *                         by default nothing.
 * @param props.ref      - Reference: Receives the sheet's handle.
 * @param props.titStr   - Title String: The sheet's title.
 *
 * @returns The sheet's dialog.
 *
 * @example
 * ```tsx
 * SheDiaCom({ children, ideStr, onCloFun, ref, titStr }) // => <SheDiaCom />
 * ```
 *
*/

function SheDiaCom ( { children, ideStr, onCloFun = () => {}, ref, titStr } : SdcProTyp ) : React.JSX.Element {


	const diaEleRef = useRef< HTMLDialogElement >( null ); // What: Dialog Element Reference. Why: The sheet opens and closes as a modal dialog. How: This holds its element.

	const [ cloSheBoo, setCloSheBoo ] = useState( false ); // What: Closing Sheet Boolean And Setter. Why: The sheet slides down before it closes. How: This is true while it's sliding.



	useImperativeHandle( ref, () => ( { // What: Handle Setup Call. Why: The screen that owns the sheet opens and closes it. How: This hands it the two functions.


		cloFun : () => { if ( diaEleRef.current?.open ) setCloSheBoo( true ); }, // What: Close Function. Why: A choice made in the sheet closes it. How: This starts the closing slide, when the sheet is open.
		opeFun : () => diaEleRef.current?.showModal()                            // What: Open Function. Why: The sheet holds the page while it's open. How: This opens the dialog as a modal, which makes everything behind it inert.


	} ), [] ); // What: Handle Dependency Array. Why: The handle never changes. How: The empty list builds it once.



	return (


		<dialog
			ref={ diaEleRef }

			className={ cssModObj.sheModDia }

			data-sheet-closing={ cloSheBoo || undefined }

			aria-labelledby={ ideStr }

			onCancel={ ( canEveObj ) => { canEveObj.preventDefault(); setCloSheBoo( true ); } } // What: Cancel Handler. Why: Escape should slide the sheet down like every other way of closing it. How: This stops the dialog closing at once and starts its closing slide.
		>{ /* What: Sheet Modal Dialog Element. Why: A sheet sits over the page and holds it while open. How: This holds the dimmed page and the panel, modal while open, sliding down as it closes. */ }


			<div
				className={ cssModObj.sheScrDiv }

				onClick={ () => setCloSheBoo( true ) } // What: Scrim Click Handler. Why: A tap outside the sheet should close it. How: This starts its closing slide.
			/>{ /* What: Sheet Scrim Div Element. Why: The page behind the sheet dims, and a tap on it closes the sheet. How: This covers the screen behind the sheet. */ }



			<div
				className={ cssModObj.shePanDiv }

				onAnimationEnd={ ( aniEveObj ) => { // What: Panel Animation End Handler. Why: The sheet closes once its slide down finishes, which still ends under reduced motion. How: This closes the dialog after the panel's own closing animation.


					if ( aniEveObj.target !== aniEveObj.currentTarget || !cloSheBoo ) return; // What: Closing Guard. Why: Only the panel's own closing slide should close the dialog, not its opening slide or an animation inside it. How: This returns for any other end.



					diaEleRef.current?.close(); // What: Dialog Close Call. Why: The slide has finished. How: This closes the dialog, which returns focus to whatever opened it.

					setCloSheBoo( false ); // What: Closing Clear Call. Why: The next opening should slide up again. How: This marks the sheet as no longer closing.

					onCloFun(); // What: Closed Report Call. Why: A screen may need to place focus once the sheet has gone. How: This tells it the sheet has closed.


				} }
			>{ /* What: Sheet Panel Div Element. Why: The sheet's content sits on a surface rising from the bottom. How: This holds the bar above the children. */ }


				<div className={ cssModObj.sheBarDiv }>{ /* What: Sheet Bar Div Element. Why: The sheet's title sits beside its close button. How: This lays them out in one row. */ }


					<h2
						id={ ideStr }

						className={ cssModObj.sheTitHea }
					>{ titStr }</h2>{ /* What: Sheet Title Heading Element. Why: The sheet is named for what it holds, and the dialog takes its name from it. How: This names the sheet. */ }

					<button
						className={ cssModObj.sheCloBut }

						type='button'

						aria-label='Close'

						onClick={ () => setCloSheBoo( true ) }
					>{ /* What: Sheet Close Button Element. Why: The sheet needs a visible way out. How: This starts its closing slide. */ }


						<IcoSvgCom
							icoNamStr='close'
							sizSteStr='p01'
						/>{ /* What: Close Icon SVG Component. Why: A cross says the button closes the sheet. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


					</button>


				</div>



				{ children }{ /* What: Sheet Children. Why: Each sheet holds its own screen's content. How: This shows it below the bar. */ }


			</div>


		</dialog>


	);


}

// #endregion SheDiaCom

// #endregion Components



// #region Exports

export { SheDiaCom, type SheHanTyp }; // What: Named Exports. Why: Screens show their sheets with it and open them through the handle. How: This exports the component and the handle's type.

// #endregion Exports


