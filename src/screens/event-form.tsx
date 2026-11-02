


// #region Imports

import cssModObj from './event-form.module.css'; // What: CSS Module Object. Why: The form is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Saving the event is the form's one action. How: This draws its button.
import { datInpFun } from '../utils/date.ts';       // What: Date Input Function. Why: Changing an event shows its times in the fields. How: This writes a time as a field's value.
import { eveCreFun } from '../state/events.ts';     // What: Event Create Function. Why: The form plans a new event. How: This saves it.
import { eveDesFun } from '../core/text-limits.ts'; // What: Event Description Function. Why: The notes are checked beside their field. How: This applies their limits.
import { eveLocFun } from '../core/text-limits.ts'; // What: Event Location Function. Why: The place is checked beside its field. How: This applies its limits.
import { eveTitFun } from '../core/text-limits.ts'; // What: Event Title Function. Why: The title is checked beside its field. How: This applies its limits.
import { eveUpdFun } from '../state/events.ts';     // What: Event Update Function. Why: The form changes an event. How: This saves the change.
import { inpDatFun } from '../utils/date.ts';       // What: Input Date Function. Why: A field's date and time is checked and saved as a time. How: This reads it.
import { linNorFun } from '../core/text-limits.ts'; // What: Lines Normalize Function. Why: The notes are checked as they'll be saved. How: This tidies each line.
import { texNorFun } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: The title and place are checked as they'll be saved. How: This tidies them.
import { useRef    } from 'react';                  // What: Use Reference. Why: The first field with a problem takes focus. How: This holds each field.
import { useState  } from 'react';                  // What: Use State. Why: The fields, their problems, and the saving state change as someone types and saves. How: This holds each.


import type { EveRecTyp } from '../state/events.ts'; // What: Event Record Type. Why: The form can change an existing event. How: This types it.

// #endregion Imports



/**
 * event-form.tsx = Event Form
 *
 * @summary
 * The form for planning an event or changing one: its title, when it starts
 * and ends, its place, and its notes. Each field says what's wrong with it
 * beside it, a failed save is announced, and the first field with a problem
 * takes focus. The times are checked as the app and the rules check them.
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

const DAY_MIL_NUM = 86400000;                                                            // What: Day Milliseconds Number. Why: An event's limits are counted in days. How: This is one day in milliseconds.
const FAI_MES_STR = "The event couldn't be saved. Check your connection and try again."; // What: Failure Message String. Why: A failed save shouldn't leave someone guessing. How: This is the message the form announces.
const TEX_ERR_STR = 'Use letters, numbers, emoji, and simple punctuation.';              // What: Text Error String. Why: Text with other characters is refused. How: This says what it may hold.

// #endregion Constants



// #region Components

type EfcProTyp = { ctlEle : React.ReactNode, errStr : string, hinStr : string, ideStr : string, labStr : string }; // What: Event Field Component Props Type. Why: Every field has a label, a control, a hint, and a problem. How: This types EveFieCom's props.

// #region EveFieCom

/**
 * EveFieCom = Event Field Component
 *
 * @summary
 * Renders one field of the form: its label above the control, then its hint
 * and its problem. The control is passed in already built, and reads its hint
 * and problem through the IDs the field gives them, ideStr plus Hin or Err.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.ctlEle - Control Element: The field's input or textarea.
 * @param props.errStr - Error String: The field's problem, empty for none.
 * @param props.hinStr - Hint String: What the field takes.
 * @param props.ideStr - Identifier String: The control's ID.
 * @param props.labStr - Label String: The field's name.
 *
 * @returns The field.
 *
 * @example
 * ```tsx
 * EveFieCom({ ctlEle, errStr, hinStr, ideStr, labStr }) // => <EveFieCom />
 * ```
 *
*/

function EveFieCom ( { ctlEle, errStr, hinStr, ideStr, labStr } : EfcProTyp ) : React.JSX.Element {


	return (


		<div className={ cssModObj.forFieDiv }>{ /* What: Form Field Div Element. Why: A field's label, control, hint, and problem read as one. How: This stacks them. */ }


			<label
				className={ cssModObj.fieNamLab }
				htmlFor={ ideStr }
			>{ labStr }</label>{ /* What: Field Name Label Element. Why: The field needs a visible name. How: This labels the control. */ }

			{ ctlEle }

			<p
				id={ `${ ideStr }Hin` }

				className={ cssModObj.fieHinPar }
			>{ hinStr }</p>{ /* What: Field Hint Paragraph Element. Why: The limits are easier met when known. How: This says them. */ }

			<p
				id={ `${ ideStr }Err` }

				className={ cssModObj.fieErrPar }
			>{ errStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its field and read with it. How: This shows the field's problem, empty when there's none. */ }


		</div>


	);


}

// #endregion EveFieCom



type EvfProTyp = { eveRecObj : EveRecTyp | null, groIdeStr : string, onSavFun : ( titTexStr : string ) => void }; // What: Event Form Component Props Type. Why: The form plans a new event or changes one in a group, then reports the save. How: This types EveForCom's props.

// #region EveForCom

/**
 * EveForCom = Event Form Component
 *
 * @summary
 * Renders the form for planning an event, or for changing one when given
 * an event, its fields filled with that event's details. Saving tidies and
 * checks each field: a title is required, both times too, the end after the
 * start, at most 7 days after it, and not yet passed, the start at most a
 * year ahead, and the place and notes within their limits. A field with a
 * problem says so and the first takes focus; otherwise the event is saved
 * and onSavFun hears its title. A failed save is announced, keeping what was
 * typed. Key it by the event, so another event starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.eveRecObj - Event Record Object: The event to change, or null
 *                          to plan a new one.
 * @param props.groIdeStr - Group Identifier String: The event's group.
 * @param props.onSavFun  - On Save Function: Called with the saved title.
 *
 * @returns The form.
 *
 * @example
 * ```tsx
 * EveForCom({ eveRecObj : null, groIdeStr, onSavFun }) // => <EveForCom />
 * ```
 *
*/

function EveForCom ( { eveRecObj, groIdeStr, onSavFun } : EvfProTyp ) : React.JSX.Element {


	const desTexRef = useRef< HTMLTextAreaElement >( null ); // What: Description Textarea Reference. Why: The notes take focus when they have the first problem. How: This holds the box.
	const endInpRef = useRef< HTMLInputElement >( null );    // What: End Input Reference. Why: The end takes focus when it has the first problem. How: This holds the field.
	const locInpRef = useRef< HTMLInputElement >( null );    // What: Location Input Reference. Why: The place takes focus when it has the first problem. How: This holds the field.
	const staInpRef = useRef< HTMLInputElement >( null );    // What: Start Input Reference. Why: The start takes focus when it has the first problem. How: This holds the field.
	const titInpRef = useRef< HTMLInputElement >( null );    // What: Title Input Reference. Why: The title takes focus when it has the first problem. How: This holds the field.

	const [ desErrStr, setDesErrStr ] = useState( '' );                                                // What: Description Error String And Setter. Why: The notes say what's wrong with them. How: This holds the problem, empty when there's none.
	const [ desTexStr, setDesTexStr ] = useState( eveRecObj?.desTexStr ?? '' );                        // What: Description Text String And Setter. Why: The box shows what's typed. How: This holds the notes, starting from the event's.
	const [ endErrStr, setEndErrStr ] = useState( '' );                                                // What: End Error String And Setter. Why: The end says what's wrong with it. How: This holds the problem, empty when there's none.
	const [ endValStr, setEndValStr ] = useState( eveRecObj ? datInpFun( eveRecObj.endTimNum ) : '' ); // What: End Value String And Setter. Why: The field shows the chosen end. How: This holds its value, starting from the event's.
	const [ forErrStr, setForErrStr ] = useState( '' );                                                // What: Form Error String And Setter. Why: A failed save is announced above the button. How: This holds the message, empty until one fails.
	const [ locErrStr, setLocErrStr ] = useState( '' );                                                // What: Location Error String And Setter. Why: The place says what's wrong with it. How: This holds the problem, empty when there's none.
	const [ locTexStr, setLocTexStr ] = useState( eveRecObj?.locTexStr ?? '' );                        // What: Location Text String And Setter. Why: The field shows what's typed. How: This holds the place, starting from the event's.
	const [ senReqBoo, setSenReqBoo ] = useState( false );                                             // What: Send Request Boolean And Setter. Why: A second save while the first is out would save twice. How: This is true while one is out.
	const [ staErrStr, setStaErrStr ] = useState( '' );                                                // What: Start Error String And Setter. Why: The start says what's wrong with it. How: This holds the problem, empty when there's none.
	const [ staValStr, setStaValStr ] = useState( eveRecObj ? datInpFun( eveRecObj.staTimNum ) : '' ); // What: Start Value String And Setter. Why: The field shows the chosen start. How: This holds its value, starting from the event's.
	const [ titErrStr, setTitErrStr ] = useState( '' );                                                // What: Title Error String And Setter. Why: The title says what's wrong with it. How: This holds the problem, empty when there's none.
	const [ titTexStr, setTitTexStr ] = useState( eveRecObj?.titTexStr ?? '' );                        // What: Title Text String And Setter. Why: The field shows what's typed. How: This holds the title, starting from the event's.



	// #region subForFun

	/**
	 * subForFun = Submit Form Function
	 *
	 * @summary
	 * Saves the form: ignores a save while one is out, tidies and checks every
	 * field, and when one has a problem, shows each field's problem and
	 * focuses the first. Otherwise it plans or changes the event and reports
	 * its title, or announces a failed save.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the save is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * subForFun() // => Promise<void>
	 * ```
	 *
	*/

	const subForFun = async () : Promise< void > => { // What: Submit Form Function. Why: Saving checks the fields and saves the event. How: This runs each step of the save.


		if ( senReqBoo ) return; // What: Sending Guard. Why: One save at a time. How: This ignores a save while one is out.



		const desNorStr = linNorFun( desTexStr ); // What: Description Normalized String. Why: The notes are checked as they'll be saved. How: This tidies each line.
		const endTimNum = inpDatFun( endValStr ); // What: End Time Number. Why: The end is checked as a time. How: This reads the field, not a number when it's empty.
		const locNorStr = texNorFun( locTexStr ); // What: Location Normalized String. Why: The place is checked as it'll be saved. How: This tidies it.
		const nowTimNum = Date.now();             // What: Now Time Number. Why: The times are checked against now. How: This reads the clock once.
		const staTimNum = inpDatFun( staValStr ); // What: Start Time Number. Why: The start is checked as a time. How: This reads the field, not a number when it's empty.
		const titNorStr = texNorFun( titTexStr ); // What: Title Normalized String. Why: The title is checked as it'll be saved. How: This tidies it.

		const desProStr = eveDesFun( desNorStr ) ? '' : `${ TEX_ERR_STR } Up to 500 characters.`;                                                                  // What: Description Problem String. Why: Notes outside their limits say so. How: This picks the message, empty when they pass.
		const endProStr = Number.isNaN( endTimNum ) ? 'Choose when it ends.' : endTimNum <= staTimNum ? 'Choose an end after the start.' : endTimNum - staTimNum > 7 * DAY_MIL_NUM ? 'Keep it to 7 days or less.' : endTimNum <= nowTimNum ? "Choose an end that hasn't passed." : ''; // What: End Problem String. Why: An empty, early, long, or past end says what's wrong. How: This picks the message, empty when the end passes.
		const locProStr = eveLocFun( locNorStr ) ? '' : `${ TEX_ERR_STR } Up to 150 characters.`;                                                                  // What: Location Problem String. Why: A place outside its limits says so. How: This picks the message, empty when it passes.
		const staProStr = Number.isNaN( staTimNum ) ? 'Choose when it starts.' : staTimNum > nowTimNum + 365 * DAY_MIL_NUM ? 'Choose a start within a year.' : ''; // What: Start Problem String. Why: An empty or far-off start says what's wrong. How: This picks the message, empty when the start passes.
		const titProStr = titNorStr === '' ? 'Give the event a title.' : eveTitFun( titNorStr ) ? '' : `${ TEX_ERR_STR } Up to 50 characters.`;                    // What: Title Problem String. Why: An empty or out-of-limits title says what's wrong. How: This picks the message, empty when the title passes.


		setForErrStr( '' ); // What: Form Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setDesErrStr( desProStr ); // What: Description Error Set Call. Why: The notes show their problem. How: This records it.

		setEndErrStr( endProStr ); // What: End Error Set Call. Why: The end shows its problem. How: This records it.

		setLocErrStr( locProStr ); // What: Location Error Set Call. Why: The place shows its problem. How: This records it.

		setStaErrStr( staProStr ); // What: Start Error Set Call. Why: The start shows its problem. How: This records it.

		setTitErrStr( titProStr ); // What: Title Error Set Call. Why: The title shows its problem. How: This records it.



		const proFieArr = [ [ titProStr, titInpRef ], [ staProStr, staInpRef ], [ endProStr, endInpRef ], [ locProStr, locInpRef ], [ desProStr, desTexRef ] ] as const; // What: Problem Field Array. Why: Focus goes to the first field with a problem, in the form's order. How: This pairs each field's problem with its element. // What: Type Assertion Note. Why: Each pair holds a message and a reference to a different kind of field. How: The as const keeps each pair a fixed tuple, so its reference reads as a field's.
		const firProArr = proFieArr.find( ( proFieObj ) => proFieObj[ 0 ] !== '' );                                                                                      // What: First Problem Array. Why: Only the first field with a problem takes focus. How: This finds it, undefined when every field passes.



		if ( firProArr ) { firProArr[ 1 ].current?.focus(); return; } // What: Problem Guard. Why: Nothing is saved while a field has a problem, and focus should land where it is. How: This focuses the first field with one and stops.



		const eveInpObj = { desTexStr : desNorStr, endTimNum, locTexStr : locNorStr, staTimNum, titTexStr : titNorStr }; // What: Event Input Object. Why: The save takes the tidied details and times. How: This gathers them.


		setSenReqBoo( true ); // What: Sending Set Call. Why: The button shows the event is being saved. How: This marks the save as out.



		try { // What: Save Try. Why: The saved event is reported. How: This plans or changes it, then reports its title.


			await ( eveRecObj ? eveUpdFun( groIdeStr, eveRecObj.eveIdeStr, eveInpObj ) : eveCreFun( groIdeStr, eveInpObj ) ); // What: Save Call. Why: A new event is planned and an existing one changed. How: This calls whichever fits.

			onSavFun( titNorStr ); // What: Saved Report Call. Why: The screen around the form closes it and announces the save. How: This hands on the title.


		}

		catch ( errCatObj ) { // What: Save Catch. Why: A failed save, such as a dropped connection, has to be told and retried. How: This logs the failure and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setForErrStr( FAI_MES_STR ); // What: Failure Announce Call. Why: Someone has to learn it failed. How: This puts the message in the alert.


		}



		setSenReqBoo( false ); // What: Sending Clear Call. Why: The form can be saved again. How: This marks the save as done.


	};

	// #endregion subForFun



	return (


		<form
			className={ cssModObj.eveForFor }

			noValidate

			onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void subForFun(); } } // What: Submit Handler. Why: The form is checked and saved by the app, not by a page load. How: This cancels the browser's submit and runs the app's.
		>{ /* What: Event Form Form Element. Why: Planning an event asks for its details. How: This holds the fields, the alert, and the button in one column. */ }



			<EveFieCom
				ctlEle={ // What: Control Element. Why: The field's control is built here, where its value and problem live. How: This passes the title field to the field.

					<input
						ref={ titInpRef }
						id='eveTitInp'

						className={ cssModObj.fieValInp }

						autoComplete='off'
						maxLength={ 50 }
						type='text'
						value={ titTexStr }

						aria-describedby='eveTitInpHin eveTitInpErr'
						aria-invalid={ titErrStr !== '' } // What: Title Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setTitTexStr( chaEveObj.target.value ) }
					/> // What: Field Value Input Element. Why: The event's title is typed here. How: This holds it, at most 50 characters.

				}
				errStr={ titErrStr }
				hinStr='Up to 50 characters. Emoji welcome.'
				ideStr='eveTitInp'
				labStr='Title'
			/>{ /* What: Event Field Component. Why: Every event has a title. How: This shows the title field. */ }



			<EveFieCom
				ctlEle={ // What: Control Element. Why: The field's control is built here, where its value and problem live. How: This passes the start field to the field.

					<input
						ref={ staInpRef }
						id='eveStaInp'

						className={ cssModObj.fieValInp }

						type='datetime-local'
						value={ staValStr }

						aria-describedby='eveStaInpHin eveStaInpErr'
						aria-invalid={ staErrStr !== '' } // What: Start Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setStaValStr( chaEveObj.target.value ) }
					/> // What: Field Value Input Element. Why: The event's start is chosen here. How: This holds a date and time.

				}
				errStr={ staErrStr }
				hinStr='Within the next year.'
				ideStr='eveStaInp'
				labStr='Starts'
			/>{ /* What: Event Field Component. Why: Every event has a start. How: This shows the start field. */ }



			<EveFieCom
				ctlEle={ // What: Control Element. Why: The field's control is built here, where its value and problem live. How: This passes the end field to the field.

					<input
						ref={ endInpRef }
						id='eveEndInp'

						className={ cssModObj.fieValInp }

						type='datetime-local'
						value={ endValStr }

						aria-describedby='eveEndInpHin eveEndInpErr'
						aria-invalid={ endErrStr !== '' } // What: End Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setEndValStr( chaEveObj.target.value ) }
					/> // What: Field Value Input Element. Why: The event's end is chosen here. How: This holds a date and time.

				}
				errStr={ endErrStr }
				hinStr='After the start, up to 7 days later.'
				ideStr='eveEndInp'
				labStr='Ends'
			/>{ /* What: Event Field Component. Why: Every event has an end. How: This shows the end field. */ }



			<EveFieCom
				ctlEle={ // What: Control Element. Why: The field's control is built here, where its value and problem live. How: This passes the location field to the field.

					<input
						ref={ locInpRef }
						id='eveLocInp'

						className={ cssModObj.fieValInp }

						autoComplete='off'
						maxLength={ 150 }
						type='text'
						value={ locTexStr }

						aria-describedby='eveLocInpHin eveLocInpErr'
						aria-invalid={ locErrStr !== '' } // What: Location Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setLocTexStr( chaEveObj.target.value ) }
					/> // What: Field Value Input Element. Why: The event's place is typed here. How: This holds it, at most 150 characters.

				}
				errStr={ locErrStr }
				hinStr='Optional, up to 150 characters.'
				ideStr='eveLocInp'
				labStr='Place'
			/>{ /* What: Event Field Component. Why: An event may say where it is. How: This shows the place field. */ }



			<EveFieCom
				ctlEle={ // What: Control Element. Why: The field's control is built here, where its value and problem live. How: This passes the description box to the field.

					<textarea
						ref={ desTexRef }
						id='eveDesTex'

						className={ cssModObj.fieValTex }

						maxLength={ 500 }
						rows={ 3 }
						value={ desTexStr }

						aria-describedby='eveDesTexHin eveDesTexErr'
						aria-invalid={ desErrStr !== '' } // What: Description Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setDesTexStr( chaEveObj.target.value ) }
					/> // What: Field Value Textarea Element. Why: The event's notes are typed here, over several lines. How: This holds them, at most 500 characters.

				}
				errStr={ desErrStr }
				hinStr='Optional, up to 500 characters.'
				ideStr='eveDesTex'
				labStr='Notes'
			/>{ /* What: Event Field Component. Why: An event may carry notes. How: This shows the notes field. */ }



			<p
				className={ cssModObj.forErrPar }

				role='alert'
			>{ forErrStr }</p>{ /* What: Form Error Paragraph Element. Why: A failed save has to be announced, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when a save fails. */ }

			<ButBasCom
				className={ cssModObj.forSubBut }

				type='submit'
			>{ senReqBoo ? 'Saving…' : eveRecObj ? 'Save changes' : 'Plan event' }</ButBasCom>{ /* What: Form Submit Button Component. Why: Sending the form saves the event, and the label shows while it's being saved. How: This submits the form, reading "Saving…" while the save is out. */ }


		</form>


	);


}

// #endregion EveForCom

// #endregion Components



// #region Exports

export { EveForCom }; // What: Named Export. Why: The Events section plans and changes events with it. How: This exports EveForCom.

// #endregion Exports


