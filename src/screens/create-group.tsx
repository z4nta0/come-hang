


// #region Imports

import cssModObj from './create-group.module.css'; // What: CSS Module Object. Why: The screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom         } from '../ui/button.tsx';       // What: Button Base Component. Why: Creating the group is the screen's one action. How: This draws the submit button.
import { groCreFun         } from '../state/groups.ts';     // What: Group Create Function. Why: Submitting the form creates the group. How: This writes it, with the identity it needs.
import { groNamFun         } from '../core/text-limits.ts'; // What: Group Name Function. Why: A name outside its limits is caught before anything is sent. How: This checks it.
import { IcoSvgCom         } from '../ui/icon.tsx';         // What: Icon SVG Component. Why: The back button shows an arrow. How: This draws it.
import { MaiAreCom         } from '../ui/main-area.tsx';    // What: Main Area Component. Why: The form is the screen's main content. How: This holds it in the main landmark.
import { perNamFun         } from '../core/text-limits.ts'; // What: Person Name Function. Why: A display name outside its limits is caught before anything is sent. How: This checks it.
import { texNorFun         } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: Names are checked as they'll be saved. How: This tidies them first.
import { useEffect         } from 'react';                  // What: Use Effect. Why: The heading takes focus as the screen opens. How: This moves focus once it's drawn.
import { useNavigationType } from 'react-router';           // What: Use Navigation Type. Why: Only a screen opened from inside the app takes focus, not one reloaded or returned to. How: This reports how the entry was reached.
import { useRef            } from 'react';                  // What: Use Reference. Why: A field with an error takes focus, and so does the heading. How: This holds each element.
import { useScrBacFun      } from '../ui/screen.ts';        // What: Use Screen Back Function. Why: The back button leaves the screen. How: This returns the function that goes back.
import { useState          } from 'react';                  // What: Use State. Why: The fields, their errors, and the sending state change as someone types and submits. How: This holds each.

// #endregion Imports



/**
 * create-group.tsx = Create Group
 *
 * @summary
 * The screen for starting a group: a back button, its heading, and a form
 * asking for the group's name and the creator's name in it. Both are tidied
 * and checked against their limits as they'll be saved, so a field with a
 * problem says what's wrong and takes focus before anything is sent. While
 * the group is being created the button reads "Creating…", and a failure,
 * such as a dropped connection, is announced above it. A created group
 * hands its ID to the screen host, which opens it. Opened from inside the
 * app, the screen moves focus to its heading, since the button that opened
 * it is gone.
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

const FAI_MES_STR = "The group couldn't be started. Check your connection and try again."; // What: Failure Message String. Why: A failed creation shouldn't leave someone guessing. How: This is the message the form announces.
const GRO_ERR_STR = 'Use letters, numbers, emoji, and simple punctuation.';               // What: Group Error String. Why: A group name with other characters is refused. How: This says what it may hold.
const PER_ERR_STR = 'Use letters, spaces, apostrophes, hyphens, and periods.';            // What: Person Error String. Why: A display name with other characters is refused. How: This says what it may hold.

// #endregion Constants



// #region Components

type CgcProTyp = { onCreFun : ( groIdeStr : string ) => void }; // What: Create Group Component Props Type. Why: The screen host opens a group once it's created. How: This types CreGroCom's one prop.

// #region CreGroCom

/**
 * CreGroCom = Create Group Component
 *
 * @summary
 * Renders the screen for starting a group and runs its form. A submit tidies
 * and checks both names, shows each field's problem and focuses the first
 * field with one, and otherwise creates the group, then calls onCreFun with
 * its ID. A failed creation is announced through the form's alert, and the
 * form can be sent again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.onCreFun - On Create Function: Called with the new group's ID
 *                         once it's created.
 *
 * @returns The screen's main area.
 *
 * @example
 * ```tsx
 * CreGroCom({ onCreFun }) // => <CreGroCom />
 * ```
 *
*/

function CreGroCom ( { onCreFun } : CgcProTyp ) : React.JSX.Element {


	const groInpRef = useRef< HTMLInputElement >( null );   // What: Group Input Reference. Why: The group name field takes focus when it has a problem. How: This holds its element.
	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: The heading takes focus as the screen opens. How: This holds it.
	const navTypStr = useNavigationType();                  // What: Navigation Type String. Why: Only a screen opened from inside the app takes focus. How: This reads PUSH, REPLACE, or POP for the entry.
	const perInpRef = useRef< HTMLInputElement >( null );   // What: Person Input Reference. Why: The display name field takes focus when it has a problem. How: This holds its element.
	const scrBacFun = useScrBacFun();                       // What: Screen Back Function. Why: The back button leaves the screen. How: This reads the function that goes back.

	const [ forErrStr, setForErrStr ] = useState( '' );    // What: Form Error String And Setter. Why: A failed creation is announced above the button. How: This holds the message, empty until one fails.
	const [ groErrStr, setGroErrStr ] = useState( '' );    // What: Group Error String And Setter. Why: The group name field says what's wrong with it. How: This holds its problem, empty when there's none.
	const [ groNamStr, setGroNamStr ] = useState( '' );    // What: Group Name String And Setter. Why: The field shows what's typed. How: This holds the group name as typed.
	const [ perErrStr, setPerErrStr ] = useState( '' );    // What: Person Error String And Setter. Why: The display name field says what's wrong with it. How: This holds its problem, empty when there's none.
	const [ perNamStr, setPerNamStr ] = useState( '' );    // What: Person Name String And Setter. Why: The field shows what's typed. How: This holds the display name as typed.
	const [ senReqBoo, setSenReqBoo ] = useState( false ); // What: Send Request Boolean And Setter. Why: A second submit while the first is out would create two groups. How: This is true while the creation runs.



	useEffect( () => { // What: Heading Focus Effect. Why: The button that opened the screen is gone, so focus should land on what replaced it, which also announces the screen. How: This focuses the heading when the screen was opened from inside the app.


		if ( navTypStr !== 'POP' ) heaEleRef.current?.focus(); // What: Focus Call. Why: A reload or a step back through history isn't a move from inside the app, and nothing on screen was just pressed. How: This focuses the heading for a PUSH or REPLACE only.


	}, [ navTypStr ] ); // What: Effect Dependency Array. Why: The focus follows how the screen was reached. How: navTypStr changes when the entry was reached another way.



	// #region subForFun

	/**
	 * subForFun = Submit Form Function
	 *
	 * @summary
	 * Handles a submit: ignores it while a creation is out, tidies both
	 * names, records each field's problem, and focuses the first field with
	 * one. With no problems, it creates the group and hands its ID to
	 * onCreFun, or announces the failure and lets the form be sent again.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the submit is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * subForFun() // => Promise<void>
	 * ```
	 *
	*/

	const subForFun = async () : Promise< void > => { // What: Submit Form Function. Why: Submitting checks the names and creates the group. How: This runs each step of the submit.


		if ( senReqBoo ) return; // What: Sending Guard. Why: One creation at a time. How: This ignores a submit while one is out.



		const groNorStr = texNorFun( groNamStr ); // What: Group Normalized String. Why: The name is checked as it'll be saved. How: This tidies it.
		const perNorStr = texNorFun( perNamStr ); // What: Person Normalized String. Why: The name is checked as it'll be saved. How: This tidies it.

		const groProStr = groNorStr === '' ? 'Enter a name for the group.' : groNamFun( groNorStr ) ? '' : GRO_ERR_STR; // What: Group Problem String. Why: An empty or out-of-limits name says what's wrong. How: This picks the message, empty when the name passes.
		const perProStr = perNorStr === '' ? 'Enter your name.' : perNamFun( perNorStr ) ? '' : PER_ERR_STR;            // What: Person Problem String. Why: An empty or out-of-limits name says what's wrong. How: This picks the message, empty when the name passes.


		setForErrStr( '' );        // What: Form Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setGroErrStr( groProStr ); // What: Group Error Set Call. Why: The field shows its problem. How: This records it.

		setPerErrStr( perProStr ); // What: Person Error Set Call. Why: The field shows its problem. How: This records it.



		if ( groProStr !== '' || perProStr !== '' ) { // What: Problem Block. Why: Nothing is sent while a field has a problem, and focus should land where it is. How: This focuses the first field with one and stops.


			( groProStr === '' ? perInpRef : groInpRef ).current?.focus(); // What: Field Focus Call. Why: A screen reader announces the field with its problem, and a keyboard user is put where it is. How: This focuses the first field with a problem.



			return; // What: Problem Return. Why: The form isn't sent. How: This stops.


		}



		setSenReqBoo( true ); // What: Sending Set Call. Why: The button shows the group is being created. How: This marks the creation as out.



		try { onCreFun( await groCreFun( groNorStr, perNorStr ) ); } // What: Creation Try. Why: The created group opens. How: This creates it and hands its ID on.

		catch ( errCatObj ) { // What: Creation Catch. Why: A failed creation, such as a dropped connection, has to be told and retried. How: This logs the failure, frees the button, and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setSenReqBoo( false ); // What: Sending Clear Call. Why: The form can be sent again. How: This marks the creation as done.

			setForErrStr( FAI_MES_STR ); // What: Failure Announce Call. Why: Someone has to learn it failed. How: This puts the message in the alert.


		}


	};

	// #endregion subForFun



	return (


		<MaiAreCom className={ cssModObj.creScrMai }>{ /* What: Create Screen Main Area Component. Why: The form is the screen's whole content. How: This holds the bar and the form in one centered column. */ }


			<div className={ cssModObj.creBarDiv }>{ /* What: Create Bar Div Element. Why: The way back sits beside the screen's heading. How: This lays them out in one row. */ }


				<button
					className={ cssModObj.creBacBut }

					type='button'

					aria-label='Back'

					onClick={ scrBacFun }
				>{ /* What: Create Back Button Element. Why: Someone can leave without starting a group. How: This goes back a screen. */ }


					<IcoSvgCom
						icoNamStr='back'
						sizSteStr='p01'
					/>{ /* What: Back Icon SVG Component. Why: An arrow pointing back says what the button does. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


				</button>

				<h1
					ref={ heaEleRef }

					className={ cssModObj.creTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Opening the screen moves focus here, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>Start a group</h1>{ /* What: Create Title Heading Element. Why: The screen's one heading says what it's for. How: This names the screen. */ }


			</div>



			<form
				className={ cssModObj.creGroFor }

				noValidate

				onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void subForFun(); } } // What: Submit Handler. Why: The form is checked and sent by the app, not by a page load. How: This cancels the browser's submit and runs the app's.
			>{ /* What: Create Group Form Element. Why: Starting a group asks for two names. How: This holds the fields, the alert, and the button in one column. */ }


				<div className={ cssModObj.creFieDiv }>{ /* What: Create Field Div Element. Why: The group name's label, field, hint, and problem read as one. How: This stacks them. */ }


					<label
						className={ cssModObj.fieNamLab }
						htmlFor='groNamInp'
					>Group name</label>{ /* What: Field Name Label Element. Why: The field needs a visible name. How: This labels the group name field. */ }

					<input
						ref={ groInpRef }
						id='groNamInp'

						className={ cssModObj.fieValInp }

						autoComplete='off'
						maxLength={ 50 }
						type='text'
						value={ groNamStr }

						aria-describedby='groNamHin groNamErr'
						aria-invalid={ groErrStr !== '' } // What: Group Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setGroNamStr( chaEveObj.target.value ) }
					/>{ /* What: Field Value Input Element. Why: The group's name is typed here. How: This holds it, at most 50 characters. */ }

					<p
						id='groNamHin'

						className={ cssModObj.fieHinPar }
					>Up to 50 characters. Emoji welcome.</p>{ /* What: Field Hint Paragraph Element. Why: The limits are easier met when known. How: This says them. */ }

					<p
						id='groNamErr'

						className={ cssModObj.fieErrPar }
					>{ groErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its field and read with it. How: This shows the field's problem, empty when there's none. */ }


				</div>

				<div className={ cssModObj.creFieDiv }>{ /* What: Create Field Div Element. Why: The display name's label, field, hint, and problem read as one. How: This stacks them. */ }


					<label
						className={ cssModObj.fieNamLab }
						htmlFor='perNamInp'
					>Your name in this group</label>{ /* What: Field Name Label Element. Why: The field needs a visible name. How: This labels the display name field. */ }

					<input
						ref={ perInpRef }
						id='perNamInp'

						className={ cssModObj.fieValInp }

						autoComplete='given-name'
						maxLength={ 40 }
						type='text'
						value={ perNamStr }

						aria-describedby='perNamHin perNamErr'
						aria-invalid={ perErrStr !== '' } // What: Person Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setPerNamStr( chaEveObj.target.value ) }
					/>{ /* What: Field Value Input Element. Why: The creator's name in the group is typed here. How: This holds it, at most 40 characters. */ }

					<p
						id='perNamHin'

						className={ cssModObj.fieHinPar }
					>How the group sees you, up to 40 letters.</p>{ /* What: Field Hint Paragraph Element. Why: The name is per group and has its limits. How: This says both. */ }

					<p
						id='perNamErr'

						className={ cssModObj.fieErrPar }
					>{ perErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its field and read with it. How: This shows the field's problem, empty when there's none. */ }


				</div>

				<p
					className={ cssModObj.forErrPar }

					role='alert'
				>{ forErrStr }</p>{ /* What: Form Error Paragraph Element. Why: A failed creation has to be announced, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when a creation fails. */ }

				<ButBasCom
					className={ cssModObj.creSubBut }

					type='submit'
				>{ senReqBoo ? 'Creating…' : 'Create group' }</ButBasCom>{ /* What: Create Submit Button Component. Why: Sending the form creates the group, and the label shows while it's being created. How: This submits the form, reading "Creating…" while the creation is out. */ }


			</form>


		</MaiAreCom>


	);


}

// #endregion CreGroCom

// #endregion Components



// #region Exports

export { CreGroCom }; // What: Named Export. Why: The screen host shows it when someone starts a group. How: This exports CreGroCom.

// #endregion Exports


