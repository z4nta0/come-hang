


// #region Imports

import cssModObj from './paste-invite.module.css'; // What: CSS Module Object. Why: The screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom         } from '../ui/button.tsx';       // What: Button Base Component. Why: Opening the invite is the screen's one action. How: This draws the submit button.
import { IcoSvgCom         } from '../ui/icon.tsx';         // What: Icon SVG Component. Why: The back button shows an arrow. How: This draws it.
import { invTokFun         } from '../core/invite-link.ts'; // What: Invite Token Function. Why: The pasted link holds the invite's token. How: This reads it.
import { MaiAreCom         } from '../ui/main-area.tsx';    // What: Main Area Component. Why: The form is the screen's main content. How: This holds it in the main landmark.
import { useEffect         } from 'react';                  // What: Use Effect. Why: The heading takes focus as the screen opens. How: This moves focus once it's drawn.
import { useNavigationType } from 'react-router';           // What: Use Navigation Type. Why: Only a screen opened from inside the app takes focus, not one reloaded or returned to. How: This reports how the entry was reached.
import { useRef            } from 'react';                  // What: Use Reference. Why: The field takes focus with a problem, and the heading as the screen opens. How: This holds each element.
import { useScrBacFun      } from '../ui/screen.ts';        // What: Use Screen Back Function. Why: The back button leaves the screen. How: This returns the function that goes back.
import { useScrOpeFun      } from '../ui/screen.ts';        // What: Use Screen Open Function. Why: A pasted invite opens its join screen. How: This returns the function that opens a screen.
import { useState          } from 'react';                  // What: Use State. Why: The field and its problem change as someone types and submits. How: This holds each.

// #endregion Imports



/**
 * paste-invite.tsx = Paste Invite
 *
 * @summary
 * The screen for joining with an invite link someone sent (ARCHITECTURE.md
 * Section 16): a back button, its heading, and a form with one field for the
 * link. The link is how an installed app on iPhone reaches an invite, since
 * opening it would land in Safari, whose storage the app doesn't share, and
 * it's offered to everyone from the welcome and the group list. Submitting
 * reads the invite's token from the link, or from a bare token, and opens
 * the join screen for it in this screen's place; anything else says so
 * beside the field and focuses it. Opened from inside the app, the screen
 * moves focus to its heading, since the button that opened it is gone.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region PasInvCom

/**
 * PasInvCom = Paste Invite Component
 *
 * @summary
 * Renders the screen for joining with an invite link and runs its form. A
 * submit finds the token in the field, then replaces this screen's history
 * entry with the join screen's for it, so back returns to wherever the
 * paste was opened from. An empty field, or one holding no invite link,
 * shows its problem and takes focus.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The screen's main area.
 *
 * @example
 * ```tsx
 * PasInvCom({}) // => <PasInvCom />
 * ```
 *
*/

function PasInvCom () : React.JSX.Element {


	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: The heading takes focus as the screen opens. How: This holds it.
	const linInpRef = useRef< HTMLInputElement >( null );   // What: Link Input Reference. Why: The field takes focus when it has a problem. How: This holds its element.
	const navTypStr = useNavigationType();                  // What: Navigation Type String. Why: Only a screen opened from inside the app takes focus. How: This reads PUSH, REPLACE, or POP for the entry.
	const scrBacFun = useScrBacFun();                       // What: Screen Back Function. Why: The back button leaves the screen. How: This reads the function that goes back.
	const scrOpeFun = useScrOpeFun();                       // What: Screen Open Function. Why: A pasted invite opens its join screen. How: This reads the function that opens a screen.

	const [ linErrStr, setLinErrStr ] = useState( '' ); // What: Link Error String And Setter. Why: The field says what's wrong with it. How: This holds its problem, empty when there's none.
	const [ linValStr, setLinValStr ] = useState( '' ); // What: Link Value String And Setter. Why: The field shows what's pasted. How: This holds it as pasted.



	useEffect( () => { // What: Heading Focus Effect. Why: The button that opened the screen is gone, so focus should land on what replaced it, which also announces the screen. How: This focuses the heading when the screen was opened from inside the app.


		if ( navTypStr !== 'POP' ) heaEleRef.current?.focus(); // What: Focus Call. Why: A reload or a step back through history isn't a move from inside the app, and nothing on screen was just pressed. How: This focuses the heading for a PUSH or REPLACE only.


	}, [ navTypStr ] ); // What: Effect Dependency Array. Why: The focus follows how the screen was reached. How: navTypStr changes when the entry was reached another way.



	// #region subForFun

	/**
	 * subForFun = Submit Form Function
	 *
	 * @summary
	 * Handles a submit: reads the token from the field and opens its join
	 * screen in place of this one, or shows the field's problem and focuses
	 * it.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns This function does not return anything.
	 *
	 * @example
	 * ```ts
	 * subForFun() // => void
	 * ```
	 *
	*/

	const subForFun = () : void => { // What: Submit Form Function. Why: Submitting opens the pasted invite. How: This reads the token and opens its screen, or says what's wrong.


		const tokValStr = invTokFun( linValStr ); // What: Token Value String. Why: The join screen opens one invite. How: This reads the token from the field, null when there's none.



		if ( tokValStr !== null ) { scrOpeFun( { scrStr : 'join', tokStr : tokValStr }, true ); return; } // What: Token Guard. Why: A link with a token opens its join screen, and back should skip the paste. How: This replaces the entry with the join screen's and stops.



		setLinErrStr( linValStr.trim() === '' ? 'Paste the invite link you were sent.' : "That isn't an invite link. Check you copied the whole link." ); // What: Link Error Set Call. Why: An empty field and a wrong paste need different help. How: This picks the message for each.

		linInpRef.current?.focus(); // What: Field Focus Call. Why: A screen reader announces the field with its problem, and a keyboard user is put where it is. How: This focuses the field.


	};

	// #endregion subForFun



	return (


		<MaiAreCom className={ cssModObj.pasScrMai }>{ /* What: Paste Screen Main Area Component. Why: The form is the screen's whole content. How: This holds the bar and the form in one centered column. */ }


			<div className={ cssModObj.pasBarDiv }>{ /* What: Paste Bar Div Element. Why: The way back sits beside the screen's heading. How: This lays them out in one row. */ }


				<button
					className={ cssModObj.pasBacBut }

					type='button'

					aria-label='Back'

					onClick={ scrBacFun }
				>{ /* What: Paste Back Button Element. Why: Someone can leave without joining. How: This goes back a screen. */ }


					<IcoSvgCom
						icoNamStr='back'
						sizSteStr='p01'
					/>{ /* What: Back Icon SVG Component. Why: An arrow pointing back says what the button does. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


				</button>

				<h1
					ref={ heaEleRef }

					className={ cssModObj.pasTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Opening the screen moves focus here, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>Join with an invite link</h1>{ /* What: Paste Title Heading Element. Why: The screen's one heading says what it's for. How: This names the screen. */ }


			</div>



			<form
				className={ cssModObj.pasLinFor }

				noValidate

				onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); subForFun(); } } // What: Submit Handler. Why: The link is read by the app, not by a page load. How: This cancels the browser's submit and runs the app's.
			>{ /* What: Paste Link Form Element. Why: Joining with a link asks for the link. How: This holds the field and the button in one column. */ }


				<div className={ cssModObj.pasFieDiv }>{ /* What: Paste Field Div Element. Why: The link's label, field, hint, and problem read as one. How: This stacks them. */ }


					<label
						className={ cssModObj.fieNamLab }
						htmlFor='pasLinInp'
					>Invite link</label>{ /* What: Field Name Label Element. Why: The field needs a visible name. How: This labels the link field. */ }

					<input
						ref={ linInpRef }
						id='pasLinInp'

						className={ cssModObj.fieValInp }

						autoCapitalize='none'
						autoComplete='off'
						spellCheck={ false }
						type='url'
						value={ linValStr }

						aria-describedby='pasLinHin pasLinErr'
						aria-invalid={ linErrStr !== '' } // What: Link Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

						onChange={ ( chaEveObj ) => setLinValStr( chaEveObj.target.value ) }
					/>{ /* What: Field Value Input Element. Why: The invite link is pasted here. How: This holds it as a URL field, without capitals or spelling marks a link doesn't want. */ }

					<p
						id='pasLinHin'

						className={ cssModObj.fieHinPar }
					>Paste the whole link someone sent you. A member of the group lets you in.</p>{ /* What: Field Hint Paragraph Element. Why: Someone should know what to paste and what happens next. How: This says both. */ }

					<p
						id='pasLinErr'

						className={ cssModObj.fieErrPar }
					>{ linErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its field and read with it. How: This shows the field's problem, empty when there's none. */ }


				</div>

				<ButBasCom
					className={ cssModObj.pasSubBut }

					type='submit'
				>Continue</ButBasCom>{ /* What: Paste Submit Button Component. Why: Sending the form opens the invite. How: This submits the form. */ }


			</form>


		</MaiAreCom>


	);


}

// #endregion PasInvCom

// #endregion Components



// #region Exports

export { PasInvCom }; // What: Named Export. Why: The screen host shows it when someone joins with a link. How: This exports PasInvCom.

// #endregion Exports


