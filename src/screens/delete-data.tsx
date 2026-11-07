


// #region Imports

import cssModObj from './delete-data.module.css'; // What: CSS Module Object. Why: The part is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ideDelFun } from '../state/deletion.ts'; // What: Identity Delete Function. Why: Confirming deletes the data. How: This deletes it and starts the app over.
import { useEffect } from 'react';                // What: Use Effect. Why: Focus moves as the confirmation opens and closes. How: This moves it once drawn.
import { useRef    } from 'react';                // What: Use Reference. Why: Focus moves between the button and the box. How: This holds both, and whether focus is owed.
import { useState  } from 'react';                // What: Use State. Why: The confirmation, the typed word, and the progress change while the part shows. How: This holds each.

// #endregion Imports



/**
 * delete-data.tsx = Delete Data
 *
 * @summary
 * The "Delete my data" button and its confirmation, shared by Settings and
 * the welcome. The confirmation says what deleting does, asks for the word
 * delete, and runs the deletion, which ends by starting the app over at the
 * welcome. A problem with the word is told beside the box, and a deletion
 * that fails is announced, leaving everything as it was to try again.
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

const DEL_POI_ARR = [ // What: Delete Point Array. Why: Someone should know everything deleting does before they confirm. How: Each entry is one consequence, in the order it happens.


	"You leave every group you're in.",

	"The photos you've shared are deleted.",

	'Each group you own passes to the member who joined it earliest, or is deleted if no one else is in it.',

	'Your Google link and the upgrade go too, if you have them.',

	'Everything Come Hang keeps on this device is cleared.'


];

// #endregion Constants



// #region Components

type DdcProTyp = { className? : string }; // What: Delete Data Component Props Type. Why: Each screen places the part in its own layout. How: This types DelDatCom's props.

// #region DelDatCom

/**
 * DelDatCom = Delete Data Component
 *
 * @summary
 * Renders a "Delete my data" button, which opens the confirmation in its
 * place: a note listing what deleting does, a box for the word delete with
 * its problem below it, and the "Delete my data" and "Keep my data" answers.
 * Opening it puts focus in the box, and keeping the data or pressing Escape
 * closes it and returns focus to the button. Confirming checks the word,
 * ignoring case and spaces around it, then runs the deletion, the answer
 * reading "Deleting…" until the app starts over, or until a failure is
 * announced through the part's alert.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.className - Class Name: The caller's class for placing the
 *                          part, by default none.
 *
 * @returns The part.
 *
 * @example
 * ```tsx
 * DelDatCom({ className }) // => <DelDatCom />
 * ```
 *
*/

function DelDatCom ( { className = '' } : DdcProTyp ) : React.JSX.Element {


	const [ conDelBoo, setConDelBoo ] = useState( false ); // What: Confirm Delete Boolean And Setter. Why: Deleting asks to confirm first. How: This is true while the confirmation shows.
	const [ delBusBoo, setDelBusBoo ] = useState( false ); // What: Delete Busy Boolean And Setter. Why: A deletion can't be asked for twice at once, and its answer shows it's under way. How: This is true while it runs.
	const [ errMesStr, setErrMesStr ] = useState( '' );    // What: Error Message String And Setter. Why: A deletion that fails is announced. How: This holds the message, empty when there's none.
	const [ worErrStr, setWorErrStr ] = useState( '' );    // What: Word Error String And Setter. Why: A word that doesn't match is told beside its box. How: This holds the problem, empty when there's none.
	const [ worValStr, setWorValStr ] = useState( '' );    // What: Word Value String And Setter. Why: The box is controlled. How: This holds what's typed.

	const delButRef = useRef< HTMLButtonElement >( null ); // What: Delete Button Reference. Why: Focus returns to the button when the confirmation closes. How: This holds it.
	const focRetRef = useRef( false );                     // What: Focus Return Reference. Why: Focus returns to the button only after the confirmation was open. How: This is true while that's owed.
	const worInpRef = useRef< HTMLInputElement >( null );  // What: Word Input Reference. Why: Opening the confirmation and a wrong word put focus in the box. How: This holds it.



	useEffect( () => { // What: Confirmation Focus Effect. Why: Focus follows the confirmation as it opens and closes. How: This focuses the box once it opens, or the button once it closes when focus is owed.


		if ( conDelBoo ) worInpRef.current?.focus(); // What: Box Focus Call. Why: Typing the word is the next step. How: This focuses the box.

		else if ( focRetRef.current ) { focRetRef.current = false; delButRef.current?.focus(); } // What: Button Focus Call. Why: The confirmation closed and owes its button focus. How: This focuses the button.


	}, [ conDelBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the confirmation opens and closes. How: conDelBoo changes then.



	// #region conDelFun

	/**
	 * conDelFun = Confirm Delete Function
	 *
	 * @summary
	 * Runs when the confirmation is submitted. While a deletion runs it does
	 * nothing. A word other than delete, ignoring case and the spaces around
	 * it, is told beside the box, which takes focus. Otherwise it clears any
	 * failure and runs the deletion, which ends by starting the app over; a
	 * failure is logged and announced, and the answer reads as before.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the deletion has failed or the app
	 *          is starting over, with no value.
	 *
	 * @example
	 * ```ts
	 * conDelFun() // => Promise<void>
	 * ```
	 *
	*/

	const conDelFun = async () : Promise< void > => { // What: Confirm Delete Function. Why: The deletion runs only once the word is typed. How: This checks it, then deletes.


		if ( delBusBoo ) return; // What: Busy Guard. Why: A deletion already running shouldn't start again. How: This returns.



		if ( worValStr.trim().toLowerCase() !== 'delete' ) { setWorErrStr( 'Type delete to confirm.' ); worInpRef.current?.focus(); return; } // What: Match Guard. Why: Deleting everything should be on purpose. How: This tells the problem and focuses the box when the word doesn't match.



		setWorErrStr( '' ); // What: Problem Clear Call. Why: The word matched. How: This clears any problem.

		setErrMesStr( '' ); // What: Failure Clear Call. Why: A new try starts clean. How: This clears any earlier failure.

		setDelBusBoo( true ); // What: Busy Set Call. Why: The answer shows the deletion is under way. How: This marks it running.



		try { await ideDelFun(); } // What: Delete Attempt. Why: The data goes, and the app starts over. How: This runs the deletion.

		catch ( errCatObj ) { // What: Failure Catch. Why: A deletion that fails leaves everything as it was, to try again. How: This logs it, announces it, and lets the answer be pressed again.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( "Your data couldn't be deleted. Check your connection and try again." ); // What: Failure Announce Call. Why: The person should know nothing changed. How: This announces it.

			setDelBusBoo( false ); // What: Busy Clear Call. Why: The person can try again. How: This marks it done.


		}


	};

	// #endregion conDelFun



	return (


		<div className={ ` ${ cssModObj.delDatDiv }   ${ className } ` }>{ /* What: Delete Data Div Element. Why: The button, or the confirmation in its place, and the alert sit together wherever the screen places them. How: This holds them in one column. */ }


			{ conDelBoo ? ( // What: Confirm Check. Why: Deleting everything asks to confirm first. How: This shows the confirmation, or else the button.


				<form
					className={ cssModObj.delConFor }

					noValidate

					onKeyDown={ ( keyEveObj ) => { if ( keyEveObj.key === 'Escape' && !delBusBoo ) { keyEveObj.preventDefault(); focRetRef.current = true; setConDelBoo( false ); } } } // What: Escape Handler. Why: Escape leaves the confirmation, unless the deletion is already running. How: This owes the button focus and closes it.
					onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void conDelFun(); } } // What: Submit Handler. Why: The word is checked and the data deleted by the app, not by a page load. How: This cancels the browser's submit and confirms.
				>{ /* What: Delete Confirm Form Element. Why: The person confirms by typing a word, as an owner deleting a group types its name. How: This holds the note, the list, the box, its problem, and the two answers. */ }


					<p className={ cssModObj.conAskPar }>Delete all your data?</p>{ /* What: Confirm Ask Paragraph Element. Why: The question names what's about to happen. How: This asks it. */ }

					<ul className={ cssModObj.delPoiUno }>{ /* What: Delete Points Unordered Element. Why: Every consequence should be read before confirming. How: This lists them. */ }


						{ DEL_POI_ARR.map( ( poiTexStr ) => ( // What: Point Map. Why: Each consequence is its own item. How: This draws one per entry.


							<li
								key={ poiTexStr }

								className={ cssModObj.delPoiIte }
							>{ poiTexStr }</li> // What: Delete Point Item Element. Why: Each consequence reads on its own. How: This holds one.


						) ) }


					</ul>

					<p className={ cssModObj.delNotPar }>{ "Messages you've sent stay on other members' devices. This can't be undone." }</p>{ /* What: Delete Note Paragraph Element. Why: Deleting can't reach other phones or be reversed. How: This says both. */ }

					<label
						className={ cssModObj.fieNamLab }
						htmlFor='delWorInp'
					>Type "delete" to confirm</label>{ /* What: Field Name Label Element. Why: The box needs a visible name saying what to type. How: This labels it. */ }

					<input
						ref={ worInpRef }
						id='delWorInp'

						className={ cssModObj.fieValInp }

						autoComplete='off'
						maxLength={ 20 }
						type='text'
						value={ worValStr }

						aria-describedby='delWorErr'
						aria-invalid={ worErrStr !== '' } // What: Word Invalid State. Why: A screen reader says when the word doesn't match, and the border turns red. How: This is true while it doesn't.

						onChange={ ( chaEveObj ) => setWorValStr( chaEveObj.target.value ) }
					/>{ /* What: Field Value Input Element. Why: The word is typed here. How: This holds it, at most 20 characters. */ }

					<p
						id='delWorErr'

						className={ cssModObj.fieErrPar }
					>{ worErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A word that doesn't match should be told beside its box and read with it. How: This shows the problem, empty when there's none. */ }

					<div className={ cssModObj.delActDiv }>{ /* What: Delete Actions Div Element. Why: The two answers sit together below the box. How: This lines them up in a row that wraps. */ }


						<button
							className={ cssModObj.actDanBut }

							type='submit'
						>{ delBusBoo ? 'Deleting…' : 'Delete my data' }</button>{ /* What: Action Danger Button Element. Why: Deleting is confirmed on purpose, and the label shows while it runs. How: This submits the confirmation, reading "Deleting…" while it runs. */ }

						<button
							className={ cssModObj.actPlaBut }

							type='button'

							onClick={ () => { if ( !delBusBoo ) { focRetRef.current = true; setConDelBoo( false ); } } } // What: Keep Handler. Why: The person can change their mind until the deletion starts. How: This owes the button focus and closes the confirmation unless the deletion is running.
						>Keep my data</button>{ /* What: Action Plain Button Element. Why: Keeping the data is as easy as deleting it, until the deletion starts. How: This closes the confirmation. */ }


					</div>


				</form>


			) : ( // What: Button Branch. Why: Without the confirmation, deleting is one button. How: This shows it.


				<button
					ref={ delButRef }

					className={ cssModObj.actPlaBut }

					type='button'

					onClick={ () => { setWorValStr( '' ); setWorErrStr( '' ); setErrMesStr( '' ); setConDelBoo( true ); } } // What: Open Handler. Why: The confirmation starts empty, with no problem left from before. How: This clears the box, its problem, and any failure, and opens it.
				>Delete my data</button> // What: Action Plain Button Element. Why: Someone can delete everything of theirs. How: This asks to confirm first.


			) }


			<p
				className={ cssModObj.delErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Delete Error Paragraph Element. Why: A deletion that fails has to be told at once, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when one fails. */ }


		</div>


	);


}

// #endregion DelDatCom

// #endregion Components



// #region Exports

export { DelDatCom }; // What: Named Export. Why: Settings and the welcome offer to delete data. How: This exports DelDatCom.

// #endregion Exports


