


// #region Imports

import cssModObj from './support-form.module.css'; // What: CSS Module Object. Why: The form is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { broNamFun } from '../utils/browser.ts'; // What: Browser Name Function. Why: A message says which browser it came from. How: This names it from the user agent string.
import { ButBasCom } from '../ui/button.tsx';    // What: Button Base Component. Why: Sending is the form's leading action. How: This draws its button.
import { useEffect } from 'react';               // What: Use Effect. Why: Opening the form moves focus into it. How: This focuses the subject once the form is open.
import { useRef    } from 'react';               // What: Use Reference. Why: Focus moves between the toggle and the fields. How: This holds them.
import { useState  } from 'react';               // What: Use State. Why: The fields, their problems, and the form's open and sending states change while it's used. How: This holds each.

// #endregion Imports



/**
 * support-form.tsx = Support Form
 *
 * @summary
 * The way to write to Come Hang's maker from inside the app: a note, a
 * "Contact support" button, and below it a short form that grows into place,
 * with a subject, a message, an optional email for a reply, and the app's
 * version and the browser, which go along with the message. It's sent to
 * Netlify Forms, which passes it on, and a message that can't be sent stays
 * in the form beside the support address, with a button that copies it.
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

const EMA_PAT_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // What: Email Pattern Regular Expression. Why: An address given for a reply should at least look like one. How: This asks for something, an at sign, and a domain with a dot, with no spaces.
const FOR_NAM_STR = 'support';                     // What: Form Name String. Why: Netlify files a message under the form whose name it carries. How: This names the support form, matching the hidden copy in index.html.
const SUP_EMA_STR = 'support@comehang.app';        // What: Support Email String. Why: A message that can't be sent can still be written as an email. How: This is the address the failure gives.

// #endregion Constants



// #region Components

// #region SupForCom

/**
 * SupForCom = Support Form Component
 *
 * @summary
 * Renders the support note, the "Contact support" button, which opens and
 * closes the form, saying which through aria-expanded, a status that says a
 * message was sent, and the form below them, inert while closed. Opening it
 * focuses the subject. Send checks that there's a subject and a message, and
 * that an email, if given, looks like one, focusing the first field with a
 * problem; then it posts the fields, the version, and the browser to Netlify
 * Forms, its button reading "Sending…" meanwhile. A sent message empties the
 * form and closes it, focus returning to the button while the status
 * announces it. One that fails stays in the form, and the alert says so,
 * giving the support address with a button that copies it. Cancel closes the
 * form, keeping what was typed, and returns focus to the button. A hidden
 * field only a bot would fill marks the message as spam to Netlify.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The note, the button, the status, and the form.
 *
 * @example
 * ```tsx
 * SupForCom() // => <SupForCom />
 * ```
 *
*/

function SupForCom () : React.JSX.Element {


	const emaInpRef = useRef< HTMLInputElement >( null );    // What: Email Input Reference. Why: An email with a problem takes focus. How: This holds the box.
	const focOpeRef = useRef( false );                       // What: Focus Open Reference. Why: Only opening the form from the button owes focus to the subject. How: This is true until it's given.
	const mesTexRef = useRef< HTMLTextAreaElement >( null ); // What: Message Textarea Reference. Why: A missing message takes focus. How: This holds the box.
	const subInpRef = useRef< HTMLInputElement >( null );    // What: Subject Input Reference. Why: Opening the form focuses the subject, and a missing one takes focus. How: This holds the box.
	const togButRef = useRef< HTMLButtonElement >( null );   // What: Toggle Button Reference. Why: Closing or sending the form returns focus to the button that opened it. How: This holds the button.

	const [ adrCopBoo, setAdrCopBoo ] = useState( false ); // What: Address Copied Boolean And Setter. Why: The copy button says when the address is copied. How: This is true for a moment after a copy.
	const [ botFieStr, setBotFieStr ] = useState( '' );    // What: Bot Field String And Setter. Why: Only a bot fills the hidden field, which marks its message as spam. How: This holds whatever was typed there.
	const [ emaErrStr, setEmaErrStr ] = useState( '' );    // What: Email Error String And Setter. Why: An email that doesn't look like one is said beside its box. How: This holds the problem, empty when there's none.
	const [ emaValStr, setEmaValStr ] = useState( '' );    // What: Email Value String And Setter. Why: Someone who'd like a reply gives an address. How: This holds what's typed.
	const [ forOpeBoo, setForOpeBoo ] = useState( false ); // What: Form Open Boolean And Setter. Why: The form shows only once asked for. How: This is true while it's open.
	const [ mesErrStr, setMesErrStr ] = useState( '' );    // What: Message Error String And Setter. Why: A missing message is said beside its box. How: This holds the problem, empty when there's none.
	const [ mesValStr, setMesValStr ] = useState( '' );    // What: Message Value String And Setter. Why: The message is what's being sent. How: This holds what's typed.
	const [ senFaiBoo, setSenFaiBoo ] = useState( false ); // What: Send Failed Boolean And Setter. Why: A message that can't be sent offers another way to write. How: This is true after a send fails, until the next.
	const [ senReqBoo, setSenReqBoo ] = useState( false ); // What: Send Request Boolean And Setter. Why: A second press mustn't send twice, and the button says it's working. How: This is true while a send is out.
	const [ staMesStr, setStaMesStr ] = useState( '' );    // What: Status Message String And Setter. Why: A sent message is announced. How: This holds the status's text.
	const [ subErrStr, setSubErrStr ] = useState( '' );    // What: Subject Error String And Setter. Why: A missing subject is said beside its box. How: This holds the problem, empty when there's none.
	const [ subValStr, setSubValStr ] = useState( '' );    // What: Subject Value String And Setter. Why: The subject heads the message. How: This holds what's typed.

	const broNamStr = broNamFun( navigator.userAgent ); // What: Browser Name String. Why: The message says which browser it came from, shown so nobody's surprised. How: This names it from the user agent string.



	useEffect( () => { // What: Open Focus Effect. Why: Someone who opens the form should land in its first field. How: Once the form is open and no longer inert, this focuses the subject when focus is owed.


		if ( !forOpeBoo || !focOpeRef.current ) return; // What: Owed Guard. Why: Only an opening from the button owes focus. How: This returns otherwise.



		focOpeRef.current = false; // What: Focus Owed Reset. Why: The focus is given once. How: This clears the debt.

		subInpRef.current?.focus(); // What: Subject Focus Call. Why: The form starts with its subject. How: This focuses the box.


	}, [ forOpeBoo ] ); // What: Effect Dependency Array. Why: Focus is owed only when the form opens. How: forOpeBoo changes when it opens or closes.



	const togForFun = () : void => { // What: Toggle Form Function. Why: The button opens the form, and closes it again. How: This opens it, owing focus to the subject, or closes it.


		focOpeRef.current = !forOpeBoo; // What: Focus Owed Assignment. Why: Only opening moves focus. How: This owes it when the form is about to open.

		setStaMesStr( '' ); // What: Status Clear Call. Why: A sent message's status shouldn't stay beside a new one being written. How: This empties it.

		setForOpeBoo( ( preOpeBoo ) => !preOpeBoo ); // What: Open Toggle Call. Why: The button opens and closes the form. How: This flips its state.


	};



	const canForFun = () : void => { // What: Cancel Form Function. Why: Someone can put the form away without sending, and keep what they wrote for later. How: This closes it and returns focus to the button.


		setForOpeBoo( false ); // What: Close Call. Why: The form goes away. How: This closes it.

		togButRef.current?.focus(); // What: Button Focus Call. Why: Focus shouldn't fall to the page as the form goes inert. How: This returns it to the button.


	};



	const copAdrFun = () : void => { // What: Copy Address Function. Why: Someone whose message can't be sent can paste the address into their email. How: This copies it and says so for a moment.


		void navigator.clipboard?.writeText( SUP_EMA_STR ).then( () => { setAdrCopBoo( true ); setTimeout( () => setAdrCopBoo( false ), 2400 ); }, () => undefined ); // What: Clipboard Write Call. Why: The address goes to the clipboard, and the button confirms it. How: This writes it, then marks it copied for 2.4 seconds, doing nothing where the clipboard is refused.


	};



	// #region senForFun

	/**
	 * senForFun = Send Form Function
	 *
	 * @summary
	 * Checks the form and sends it. It ignores a press while a send is out.
	 * A missing subject or message, or an email that doesn't look like one, is
	 * said beside its field, and focus moves to the first field with a
	 * problem. Otherwise it posts the form to Netlify Forms at the site's
	 * root. A message that's accepted empties the form, closes it, returns
	 * focus to the button, and announces itself; one that isn't, or can't be
	 * sent, is logged and kept, and the alert gives the support address.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the message is sent or kept, with
	 *          no value.
	 *
	 * @example
	 * ```ts
	 * senForFun() // => Promise<void>
	 * ```
	 *
	*/

	const senForFun = async () : Promise< void > => { // What: Send Form Function. Why: The form's message reaches the maker only once it's checked and sent. How: This checks the fields, posts them, and reports how it went.


		if ( senReqBoo ) return; // What: Busy Guard. Why: A second press mustn't send twice. How: This returns while a send is out.



		const emaTriStr = emaValStr.trim(); // What: Email Trimmed String. Why: Stray spaces aren't part of the address. How: This trims them.
		const mesTriStr = mesValStr.trim(); // What: Message Trimmed String. Why: Spaces alone aren't a message. How: This trims them.
		const subTriStr = subValStr.trim(); // What: Subject Trimmed String. Why: Spaces alone aren't a subject. How: This trims them.

		const emaErrVal = emaTriStr !== '' && !EMA_PAT_REG.test( emaTriStr ) ? "That doesn't look like an email address." : ''; // What: Email Error Value. Why: A reply can't reach an address that isn't one, while no address is fine. How: This names the problem, or is empty.
		const mesErrVal = mesTriStr === '' ? 'Add a message.' : '';                                                         // What: Message Error Value. Why: There's nothing to send without a message. How: This names the problem, or is empty.
		const subErrVal = subTriStr === '' ? 'Add a subject.' : '';                                                         // What: Subject Error Value. Why: A subject says what the message is about. How: This names the problem, or is empty.


		setEmaErrStr( emaErrVal ); // What: Email Error Set Call. Why: The email's problem shows beside it. How: This sets it, or clears it.

		setMesErrStr( mesErrVal ); // What: Message Error Set Call. Why: The message's problem shows beside it. How: This sets it, or clears it.

		setSubErrStr( subErrVal ); // What: Subject Error Set Call. Why: The subject's problem shows beside it. How: This sets it, or clears it.


		const firProRef = subErrVal !== '' ? subInpRef : mesErrVal !== '' ? mesTexRef : emaErrVal !== '' ? emaInpRef : null; // What: First Problem Reference. Why: Focus should land on the first field with a problem, in the order they read. How: This picks the subject, the message, or the email, or none.


		if ( firProRef ) { firProRef.current?.focus(); return; } // What: Problem Guard. Why: Nothing is sent while a field has a problem, and focus should land where it is. How: This focuses the field and returns.



		setSenFaiBoo( false ); // What: Failure Clear Call. Why: An earlier failure no longer applies. How: This clears it.

		setSenReqBoo( true ); // What: Busy Set Call. Why: The button says it's sending, and a second press waits. How: This marks the send as out.



		try { // What: Send Try. Why: The message has to reach Netlify. How: This posts it and checks the answer.


			const posBodStr = new URLSearchParams({ // What: Post Body String. Why: Netlify Forms takes a form-encoded post, filed by its form-name, with the hidden field it checks for spam. How: This encodes every field, the version, and the browser.


				'bot-field' : botFieStr,
				browser     : broNamStr,
				email       : emaTriStr,
				'form-name' : FOR_NAM_STR,
				message     : mesTriStr,
				subject     : subTriStr,
				version     : __APP_VERSION__


			}).toString();

			const posResObj = await fetch( '/', { body : posBodStr, headers : { 'Content-Type' : 'application/x-www-form-urlencoded' }, method : 'POST' } ); // What: Post Response Object. Why: Netlify Forms takes the post at the site's root. How: This posts the body as a form.


			if ( !posResObj.ok ) throw new Error( `The support form was refused with status ${ posResObj.status }.` ); // What: Refused Guard. Why: A refused post wasn't delivered. How: This fails the send with its status.



			setEmaValStr( '' ); // What: Email Clear Call. Why: A sent message's fields start empty next time. How: This empties the email.
			setMesValStr( '' ); // What: Message Clear Call. Why: A sent message's fields start empty next time. How: This empties the message.
			setSubValStr( '' ); // What: Subject Clear Call. Why: A sent message's fields start empty next time. How: This empties the subject.

			setForOpeBoo( false ); // What: Close Call. Why: The form's work is done. How: This closes it.

			setStaMesStr( "Message sent. Thank you, I'll read it soon." ); // What: Status Set Call. Why: Someone should hear that their message went. How: This puts the confirmation in the status.

			togButRef.current?.focus(); // What: Button Focus Call. Why: Focus shouldn't fall to the page as the form goes inert. How: This returns it to the button.


		}

		catch ( errCatObj ) { // What: Send Catch. Why: A message that can't be sent has to say so, and keep what was written. How: This logs the failure and shows the alert.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setSenFaiBoo( true ); // What: Failure Set Call. Why: The alert offers another way to write. How: This marks the send as failed.


		}



		setSenReqBoo( false ); // What: Busy Clear Call. Why: The form can be sent again. How: This marks the send as done.


	};

	// #endregion senForFun



	return (


		<>{ /* What: Support Fragment. Why: The note, the button, the status, and the form take their places among the About part's own. How: This groups them without a wrapper. */ }


			<p className={ cssModObj.supNotPar }>Having a problem, or an idea? Send a message, and the app's version and your browser come along with it.</p>{ /* What: Support Note Paragraph Element. Why: Someone should know what the form is for, and what it sends besides their words. How: This says both. */ }


			<div className={ cssModObj.supActDiv }>{ /* What: Support Actions Div Element. Why: The button sits in its own row below the tip, like the other parts' buttons. How: This holds it at its own width. */ }


				<button
					ref={ togButRef }

					className={ cssModObj.supPlaBut }

					type='button'

					aria-controls='supForDiv'
					aria-expanded={ forOpeBoo }

					onClick={ togForFun }
				>Contact support</button>{ /* What: Support Plain Button Element. Why: The form opens on request, and someone can put it away again. How: This opens and closes it, saying which through aria-expanded. */ }


			</div>


			<p
				className={ cssModObj.supStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Support Status Paragraph Element. Why: A sent message should be confirmed, and a status added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the confirmation once a message is sent. */ }



			<div
				id='supForDiv'

				className={ cssModObj.supForDiv }

				data-form-open-active={ forOpeBoo || undefined }

				inert={ !forOpeBoo } // What: Form Inert Note. Why: A closed form shouldn't be read or reached, yet stays drawn so it can close smoothly. How: This makes it inert while closed.
			>{ /* What: Support Form Div Element. Why: The form grows into place below the button and closes the same way. How: This holds it in a row that opens while the form is open. */ }


				<form
					className={ cssModObj.supForFor }

					noValidate

					aria-label='Contact support'

					onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void senForFun(); } } // What: Submit Handler. Why: The form is checked and sent by the app, not by a page load. How: This cancels the browser's submit and sends it.
				>{ /* What: Support Form Form Element. Why: The fields and buttons read as one form, sent with Enter or its button. How: This holds them, named for screen readers. */ }


					<div className={ cssModObj.supFieDiv }>{ /* What: Support Field Div Element. Why: The subject's label, box, and problem belong together. How: This stacks them. */ }


						<label
							className={ cssModObj.fieNamLab }
							htmlFor='supSubInp'
						>Subject</label>{ /* What: Field Name Label Element. Why: The box needs a visible name. How: This names the subject. */ }

						<input
							ref={ subInpRef }
							id='supSubInp'

							className={ cssModObj.fieValInp }

							autoComplete='off'
							maxLength={ 100 }
							type='text'
							value={ subValStr }

							aria-describedby='supSubErr'
							aria-invalid={ subErrStr !== '' } // What: Subject Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

							onChange={ ( chaEveObj ) => setSubValStr( chaEveObj.target.value ) }
						/>{ /* What: Field Value Input Element. Why: The subject says what the message is about. How: This takes up to 100 characters. */ }

						<p
							id='supSubErr'

							className={ cssModObj.fieErrPar }
						>{ subErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A missing subject is said beside its box. How: This shows the problem, hidden while there's none. */ }


					</div>


					<div className={ cssModObj.supFieDiv }>{ /* What: Support Field Div Element. Why: The message's label, box, and problem belong together. How: This stacks them. */ }


						<label
							className={ cssModObj.fieNamLab }
							htmlFor='supMesTex'
						>Message</label>{ /* What: Field Name Label Element. Why: The box needs a visible name. How: This names the message. */ }

						<textarea
							ref={ mesTexRef }
							id='supMesTex'

							className={ cssModObj.fieValTex }

							maxLength={ 2000 }
							rows={ 4 }
							value={ mesValStr }

							aria-describedby='supMesErr'
							aria-invalid={ mesErrStr !== '' } // What: Message Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

							onChange={ ( chaEveObj ) => setMesValStr( chaEveObj.target.value ) }
						/>{ /* What: Field Value Textarea Element. Why: The message needs room for a few lines. How: This takes up to 2,000 characters, four lines tall to start. */ }

						<p
							id='supMesErr'

							className={ cssModObj.fieErrPar }
						>{ mesErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A missing message is said beside its box. How: This shows the problem, hidden while there's none. */ }


					</div>


					<div className={ cssModObj.supFieDiv }>{ /* What: Support Field Div Element. Why: The email's label, box, hint, and problem belong together. How: This stacks them. */ }


						<label
							className={ cssModObj.fieNamLab }
							htmlFor='supEmaInp'
						>Your email (optional)</label>{ /* What: Field Name Label Element. Why: The box needs a visible name, and should say it can be left empty. How: This names the email as optional. */ }

						<input
							ref={ emaInpRef }
							id='supEmaInp'

							className={ cssModObj.fieValInp }

							autoComplete='email'
							maxLength={ 254 }
							type='email'
							value={ emaValStr }

							aria-describedby='supEmaHin supEmaErr'
							aria-invalid={ emaErrStr !== '' } // What: Email Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

							onChange={ ( chaEveObj ) => setEmaValStr( chaEveObj.target.value ) }
						/>{ /* What: Field Value Input Element. Why: Someone who'd like a reply gives an address. How: This takes up to 254 characters, the longest an address can be. */ }

						<p
							id='supEmaHin'

							className={ cssModObj.fieHinPar }
						>Only if you'd like a reply. It's used for nothing else.</p>{ /* What: Field Hint Paragraph Element. Why: People are rightly careful with their address. How: This says it's optional and only for a reply. */ }

						<p
							id='supEmaErr'

							className={ cssModObj.fieErrPar }
						>{ emaErrStr }</p>{ /* What: Field Error Paragraph Element. Why: An address that doesn't look like one is said beside its box. How: This shows the problem, hidden while there's none. */ }


					</div>


					<dl className={ cssModObj.supDiaDes }>{ /* What: Support Diagnostics Description List Element. Why: What goes along with the message is shown, so nothing's sent unseen. How: This pairs each with its name. */ }


						<dt className={ cssModObj.supKeyTer }>Version</dt>{ /* What: Support Key Term Element. Why: The value needs its name. How: This names the version. */ }

						<dd className={ cssModObj.supValDet }>{ __APP_VERSION__ }</dd>{ /* What: Support Value Details Element. Why: A problem often depends on the release. How: This shows the version that's sent. */ }

						<dt className={ cssModObj.supKeyTer }>Browser</dt>{ /* What: Support Key Term Element. Why: The value needs its name. How: This names the browser. */ }

						<dd className={ cssModObj.supValDet }>{ broNamStr }</dd>{ /* What: Support Value Details Element. Why: A problem often depends on the browser. How: This shows the browser that's sent. */ }


					</dl>



					<p
						className={ cssModObj.supHonPar }

						aria-hidden='true'
					>{ /* What: Support Honeypot Paragraph Element. Why: Netlify marks as spam a message whose hidden field is filled, which only a bot does. How: This holds the field, hidden from sight and from screen readers. */ }


						<label>{ /* What: Honeypot Label Element. Why: A bot reads the field's label. How: This names the field. */ }


							Leave this empty

							<input
								name='bot-field'

								autoComplete='off'
								value={ botFieStr }

								tabIndex={ -1 }

								onChange={ ( chaEveObj ) => setBotFieStr( chaEveObj.target.value ) }
							/>{ /* What: Honeypot Input Element. Why: Only a bot fills a field nobody can see or reach. How: This holds what it types, out of the Tab order. */ }


						</label>


					</p>



					<div className={ cssModObj.supFooDiv }>{ /* What: Support Footer Div Element. Why: Sending and cancelling sit together at the end of the form. How: This lines them up in a row that wraps. */ }


						<ButBasCom type='submit'>{ senReqBoo ? 'Sending…' : 'Send' }</ButBasCom>{ /* What: Send Button Component. Why: Sending is the form's leading action, and the button says while it's working. How: This submits the form, reading "Sending…" meanwhile. */ }



						<button
							className={ cssModObj.supPlaBut }

							type='button'

							onClick={ canForFun }
						>Cancel</button>{ /* What: Support Plain Button Element. Why: Someone can put the form away without sending. How: This closes it, keeping what was typed. */ }


					</div>



					<p
						className={ cssModObj.supErrPar }

						role='alert'
					>{ senFaiBoo ? `Your message couldn't be sent, and it's still here. Try again, or write to ${ SUP_EMA_STR }.` : '' }</p>{ /* What: Support Error Paragraph Element. Why: A message that can't be sent has to say so at once, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gives the support address once a send fails. */ }


					{ senFaiBoo && ( // What: Copy Check. Why: The address is worth copying only once a send fails. How: This shows the copy button then.


						<div className={ cssModObj.supCopDiv }>{ /* What: Support Copy Div Element. Why: The copy button sits below the failure that offers it. How: This holds it at its own width. */ }


							<button
								className={ cssModObj.supPlaBut }

								type='button'

								onClick={ copAdrFun }
							>{ adrCopBoo ? 'Copied' : 'Copy address' }</button>{ /* What: Support Plain Button Element. Why: The address goes into an email more easily copied than retyped. How: This copies it, reading "Copied" for a moment. */ }


						</div>


					) }


				</form>


			</div>


		</>


	);


}

// #endregion SupForCom

// #endregion Components



// #region Exports

export { SupForCom }; // What: Named Export. Why: Settings' About part offers the support form. How: This exports SupForCom.

// #endregion Exports


