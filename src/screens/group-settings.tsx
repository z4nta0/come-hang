


// #region Imports

import cssModObj from './group-settings.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Saving the group's settings is the section's leading action. How: This draws its button.
import { groDelFun } from '../state/groups.ts';     // What: Group Delete Function. Why: The owner can delete the group. How: This deletes it for everyone.
import { groLeaFun } from '../state/members.ts';    // What: Group Leave Function. Why: A member other than the owner can leave. How: This ends their membership.
import { groNamFun } from '../core/text-limits.ts'; // What: Group Name Function. Why: A name outside its limits is caught before it's sent. How: This checks it.
import { groSetFun } from '../state/groups.ts';     // What: Group Settings Function. Why: The owner renames the group and sets its chat retention. How: This saves both.
import { texNorFun } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: Names are checked and compared as they'll be saved. How: This tidies them.
import { useEffect } from 'react';                  // What: Use Effect. Why: Opening and closing a confirmation moves focus. How: This moves it once drawn.
import { useRef    } from 'react';                  // What: Use Reference. Why: Focus moves between a button, the confirmation it opens, and a field with a problem. How: This holds the elements.
import { useState  } from 'react';                  // What: Use State. Why: The drafts, the confirmations, and the messages change while the section is open. How: This holds each.


import type { GroRecTyp } from '../state/groups.ts'; // What: Group Record Type. Why: The section shows one group's settings. How: This types the group.

// #endregion Imports



/**
 * group-settings.tsx = Group Settings
 *
 * @summary
 * The open group's Settings section: the group's name and how long the
 * server holds a message someone hasn't received, which the owner changes in
 * a form and everyone else reads, then the way out of the group, a leave for
 * a member and a deletion, confirmed by typing the group's name, for the
 * owner. Each change is announced, a field with a problem says so beside
 * it, and a change that fails says why. A leave or deletion hands the group
 * to the screen host, which opens what's left.
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

const FAI_SET_STR = "That didn't go through. Try again.";                   // What: Failure Settings String. Why: A change that fails still has to be told. How: The alert shows this.
const GRO_ERR_STR = 'Use letters, numbers, emoji, and simple punctuation.'; // What: Group Error String. Why: A group name with other characters is refused. How: This says what it may hold.

const TTL_DAY_ARR = [ 7, 14, 30, 60, 90, 180 ]; // What: TTL Day Array. Why: The retention runs 7 to 180 days (Section 5), and a few steps cover every group's need. How: This lists the choices, in days.

// #endregion Constants



// #region Components

type GscProTyp = { curGroObj : GroRecTyp, onGonFun : ( gonIdeStr : string, mesStr : string ) => void }; // What: Group Settings Component Props Type. Why: The section shows one group and hands it on once it's left or deleted. How: This types GroSetCom's props.

// #region GroSetCom

/**
 * GroSetCom = Group Settings Component
 *
 * @summary
 * Renders the open group's Settings section. The owner sees a form for the
 * group's name and chat retention, the name tidied and checked as it'll be
 * saved, a problem shown beside the field, which then takes focus; everyone
 * else sees both values, with a note that only the owner changes them. A
 * member then sees Leave group, whose confirmation takes focus on its Stay
 * button, and the owner sees why they can't leave and Delete group, whose
 * confirmation asks for the group's name and takes focus in its box. Leaving
 * a confirmation returns focus to the button that opened it. One change runs
 * at a time, its button reading what it's doing; a save is announced through
 * the status and a failure through the alert, while a leave or deletion that
 * lands calls onGonFun with the group's ID and what to announce. Key it by
 * the group, so another group starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.curGroObj - Current Group Object: The open group.
 * @param props.onGonFun  - On Gone Function: Called with the group's ID and
 *                          what to announce once it's left or deleted.
 *
 * @returns The section.
 *
 * @example
 * ```tsx
 * GroSetCom({ curGroObj, onGonFun }) // => <GroSetCom />
 * ```
 *
*/

function GroSetCom ( { curGroObj, onGonFun } : GscProTyp ) : React.JSX.Element {


	const delButRef = useRef< HTMLButtonElement >( null ); // What: Delete Button Reference. Why: Leaving the deletion's confirmation returns focus to its button. How: This holds the button.
	const delInpRef = useRef< HTMLInputElement >( null );  // What: Delete Input Reference. Why: The deletion's confirmation puts the owner in its box. How: This holds the box.
	const focRetRef = useRef( false );                     // What: Focus Return Reference. Why: Focus returns to a button once its confirmation has gone. How: This is true while that's owed.
	const leaButRef = useRef< HTMLButtonElement >( null ); // What: Leave Button Reference. Why: Leaving the leave's confirmation returns focus to its button. How: This holds the button.
	const leaStaRef = useRef< HTMLButtonElement >( null ); // What: Leave Stay Reference. Why: The leave's confirmation puts the member on its safe answer. How: This holds the Stay button.
	const namInpRef = useRef< HTMLInputElement >( null );  // What: Name Input Reference. Why: The name box takes focus when it has a problem. How: This holds the box.

	const [ actKinStr, setActKinStr ] = useState( '' );                  // What: Action Kind String And Setter. Why: One change at a time keeps a double tap from acting twice, and its button says what it's doing. How: This holds the change that's out, save, leave, or delete, empty when none is.
	const [ conDelBoo, setConDelBoo ] = useState( false );               // What: Confirm Delete Boolean And Setter. Why: Deleting asks to confirm by name first. How: This is true while the confirmation shows.
	const [ conLeaBoo, setConLeaBoo ] = useState( false );               // What: Confirm Leave Boolean And Setter. Why: Leaving asks to confirm first. How: This is true while the confirmation shows.
	const [ delErrStr, setDelErrStr ] = useState( '' );                  // What: Delete Error String And Setter. Why: A name that doesn't match is told beside its box. How: This holds the problem, empty when there's none.
	const [ delNamStr, setDelNamStr ] = useState( '' );                  // What: Delete Name String And Setter. Why: The confirmation's box shows what's typed. How: This holds it.
	const [ errMesStr, setErrMesStr ] = useState( '' );                  // What: Error Message String And Setter. Why: A failed change is announced. How: This holds the alert's text, empty when there's none.
	const [ namErrStr, setNamErrStr ] = useState( '' );                  // What: Name Error String And Setter. Why: The name box says what's wrong with it. How: This holds the problem, empty when there's none.
	const [ namTexStr, setNamTexStr ] = useState( curGroObj.namStr );    // What: Name Text String And Setter. Why: The name box shows what's typed, starting from the group's name. How: This holds it.
	const [ staMesStr, setStaMesStr ] = useState( '' );                  // What: Status Message String And Setter. Why: A save that lands is announced. How: This holds the status's text.
	const [ ttlDayNum, setTtlDayNum ] = useState( curGroObj.ttlDayNum ); // What: TTL Day Number And Setter. Why: The retention choice shows what's picked, starting from the group's. How: This holds it, in days.


	const ttlOptArr = TTL_DAY_ARR.includes( curGroObj.ttlDayNum ) ? TTL_DAY_ARR : [ ...TTL_DAY_ARR, curGroObj.ttlDayNum ].sort( ( dayOneNum, dayTwoNum ) => dayOneNum - dayTwoNum ); // What: TTL Option Array. Why: A retention saved outside the usual steps should still show as chosen. How: This adds the group's own value to the steps when it isn't one.



	useEffect( () => { // What: Leave Focus Effect. Why: The button that opened the confirmation goes with it, and comes back when it closes. How: This focuses Stay as it opens, and the button again when it closes owing focus.


		if ( conLeaBoo ) leaStaRef.current?.focus(); // What: Stay Focus Call. Why: The confirmation opened, and its safe answer is the one to land on. How: This focuses Stay.

		else if ( focRetRef.current ) { focRetRef.current = false; leaButRef.current?.focus(); } // What: Button Focus Call. Why: The confirmation closed and owes its button focus. How: This focuses the button and clears the debt.


	}, [ conLeaBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the confirmation opens and closes. How: conLeaBoo changes then.



	useEffect( () => { // What: Delete Focus Effect. Why: The button that opened the confirmation goes with it, and comes back when it closes. How: This focuses the name box as it opens, and the button again when it closes owing focus.


		if ( conDelBoo ) delInpRef.current?.focus(); // What: Box Focus Call. Why: The confirmation opened, and typing the name is the next step. How: This focuses the box.

		else if ( focRetRef.current ) { focRetRef.current = false; delButRef.current?.focus(); } // What: Button Focus Call. Why: The confirmation closed and owes its button focus. How: This focuses the button and clears the debt.


	}, [ conDelBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the confirmation opens and closes. How: conDelBoo changes then.



	// #region actRunFun

	/**
	 * actRunFun = Action Run Function
	 *
	 * @summary
	 * Runs one change: ignores it while another is out, marks which change
	 * is out so its button can say so, clears the messages, then awaits it.
	 * A failure is logged and announced through the alert. Resolves true when
	 * the change landed, leaving the caller to say so, since a leave or
	 * deletion is announced by the screen host.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param actKinVal - Action Kind Value: Which change it is, save, leave,
	 *                    or delete.
	 * @param actStaFun - Action Start Function: Starts the change.
	 *
	 * @returns A promise that resolves with whether the change landed.
	 *
	 * @example
	 * ```ts
	 * actRunFun('save', savStaFun) // => true
	 * ```
	 *
	*/

	const actRunFun = async ( actKinVal : string, actStaFun : () => Promise< unknown > ) : Promise< boolean > => { // What: Action Run Function. Why: Every change in the section runs, and fails, the same way. How: This runs one and reports whether it landed.


		if ( actKinStr !== '' ) return false; // What: Busy Guard. Why: A change while another is out could act twice. How: This ignores it.



		setActKinStr( actKinVal ); // What: Busy Set Call. Why: The next change waits, and this one's button says what it's doing. How: This marks it as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next status should be announced afresh. How: This empties the status.



		try { await actStaFun(); } // What: Change Try. Why: The group changes. How: This runs the change.

		catch ( errCatObj ) { // What: Change Catch. Why: A failed change has to be told. How: This logs it, frees the buttons, and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setActKinStr( '' ); // What: Busy Clear Call. Why: The member can try again. How: This marks the change as done.

			setErrMesStr( FAI_SET_STR ); // What: Failure Announce Call. Why: The member has to learn it failed. How: This puts the message in the alert.



			return false;


		}



		setActKinStr( '' ); // What: Busy Clear Call. Why: The next change can run. How: This marks the change as done.



		return true;


	};

	// #endregion actRunFun



	// #region savSetFun

	/**
	 * savSetFun = Save Settings Function
	 *
	 * @summary
	 * Saves the owner's changes: a tidied name that's empty or outside its
	 * limits is shown beside its box, which takes focus, before anything is
	 * sent; otherwise the name and retention are saved as one change, and once
	 * it lands the box shows the tidied name and the save is announced.
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
	 * savSetFun() // => Promise<void>
	 * ```
	 *
	*/

	const savSetFun = async () : Promise< void > => { // What: Save Settings Function. Why: The owner renames the group and sets its retention. How: This checks the name, then saves both.


		const namNorStr = texNorFun( namTexStr ); // What: Name Normalized String. Why: The name is checked as it'll be saved. How: This tidies it.

		const namProStr = namNorStr === '' ? 'Enter a name for the group.' : groNamFun( namNorStr ) ? '' : GRO_ERR_STR; // What: Name Problem String. Why: An empty or out-of-limits name says what's wrong. How: This picks the message, empty when the name passes.


		setNamErrStr( namProStr ); // What: Name Error Set Call. Why: The box shows its problem, or clears an old one. How: This records it.


		if ( namProStr !== '' ) { namInpRef.current?.focus(); return; } // What: Problem Guard. Why: Nothing is sent while the name has a problem, and focus should land where it is. How: This focuses the box and stops.



		const lanValBoo = await actRunFun( 'save', () => groSetFun( curGroObj.ideStr, namNorStr, ttlDayNum ) ); // What: Landed Value Boolean. Why: Only a save that landed is announced. How: This saves the settings as one change.


		if ( !lanValBoo ) return; // What: Failed Guard. Why: A failed save keeps the form as typed, and the alert says so. How: This returns.



		setNamTexStr( namNorStr ); // What: Name Tidy Call. Why: The box shows the name as it was saved. How: This puts the tidied name in it.

		setStaMesStr( "Saved the group's settings." ); // What: Status Set Call. Why: The owner hears the save landed. How: This announces it.


	};

	// #endregion savSetFun



	// #region delConFun

	/**
	 * delConFun = Delete Confirm Function
	 *
	 * @summary
	 * Handles the deletion's confirmation: a typed name that, once tidied,
	 * isn't the group's name is shown beside the box, which keeps focus;
	 * otherwise the group is deleted as one change, and once it lands
	 * onGonFun hands the group to the screen host with what to announce.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the confirmation is handled, with
	 *          no value.
	 *
	 * @example
	 * ```ts
	 * delConFun() // => Promise<void>
	 * ```
	 *
	*/

	const delConFun = async () : Promise< void > => { // What: Delete Confirm Function. Why: A group is deleted only once its owner types its name. How: This checks the name, then deletes the group.


		if ( texNorFun( delNamStr ) !== curGroObj.namStr ) { setDelErrStr( "That isn't the group's name. Type it as it's shown above." ); delInpRef.current?.focus(); return; } // What: Match Guard. Why: A deletion can't be undone, so it waits for the exact name. How: This says so beside the box, focuses it, and stops.



		setDelErrStr( '' ); // What: Delete Error Clear Call. Why: The name matches. How: This empties its problem.


		const lanValBoo = await actRunFun( 'delete', () => groDelFun( curGroObj.ideStr ) ); // What: Landed Value Boolean. Why: The group is handed on only once it's gone. How: This deletes it as one change.


		if ( lanValBoo ) onGonFun( curGroObj.ideStr, `Deleted ${ curGroObj.namStr }.` ); // What: Gone Call. Why: The section goes with the group, so the host says what happened and opens what's left. How: This hands the group on with the message.


	};

	// #endregion delConFun



	return (


		<div className={ cssModObj.groSetDiv }>{ /* What: Group Settings Div Element. Why: The group's settings and the way out read top to bottom. How: This stacks the heading and the two parts inside the gutter. */ }


			<h2 className={ cssModObj.setTitHea }>Settings</h2>{ /* What: Settings Title Heading Element. Why: The section needs a heading. How: This names it. */ }



			<section
				className={ cssModObj.detSetSec }

				aria-labelledby='detSetHea'
			>{ /* What: Details Settings Section Element. Why: The group's name and retention read as one part. How: This holds its heading and the form, or the values. */ }


				<h3
					id='detSetHea'

					className={ cssModObj.detTitHea }
				>This group</h3>{ /* What: Details Title Heading Element. Why: The part needs a heading. How: This names it. */ }



				{ curGroObj.ownBoo ? ( // What: Owner Form Check. Why: Only the owner renames the group and sets its retention (Section 11.2). How: This shows them the form, or else the values.


					<form
						className={ cssModObj.detSetFor }

						noValidate

						onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void savSetFun(); } } // What: Submit Handler. Why: The settings are checked and saved by the app, not by a page load. How: This cancels the browser's submit and saves them.
					>{ /* What: Details Settings Form Element. Why: The owner changes the group's settings here. How: This holds the two fields and the button. */ }


						<div className={ cssModObj.detFieDiv }>{ /* What: Details Field Div Element. Why: The name's label, box, hint, and problem read as one. How: This stacks them. */ }


							<label
								className={ cssModObj.fieNamLab }
								htmlFor='detNamInp'
							>Group name</label>{ /* What: Field Name Label Element. Why: The box needs a visible name. How: This labels the group name box. */ }

							<input
								ref={ namInpRef }
								id='detNamInp'

								className={ cssModObj.fieValInp }

								autoComplete='off'
								maxLength={ 50 }
								type='text'
								value={ namTexStr }

								aria-describedby='detNamHin detNamErr'
								aria-invalid={ namErrStr !== '' } // What: Name Invalid State. Why: A screen reader says when the box has a problem, and the border turns red. How: This is true while it has one.

								onChange={ ( chaEveObj ) => setNamTexStr( chaEveObj.target.value ) }
							/>{ /* What: Field Value Input Element. Why: The group's name is typed here. How: This holds it, at most 50 characters. */ }

							<p
								id='detNamHin'

								className={ cssModObj.fieHinPar }
							>Up to 50 characters. Emoji welcome. People see it on the invite.</p>{ /* What: Field Hint Paragraph Element. Why: The limits are easier met when known, and the name is shown before anyone joins. How: This says both. */ }

							<p
								id='detNamErr'

								className={ cssModObj.fieErrPar }
							>{ namErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its box and read with it. How: This shows the box's problem, empty when there's none. */ }


						</div>



						<div className={ cssModObj.detFieDiv }>{ /* What: Details Field Div Element. Why: The retention's label, choice, and hint read as one. How: This stacks them. */ }


							<label
								className={ cssModObj.fieNamLab }
								htmlFor='detTtlSel'
							>Hold unreceived messages for</label>{ /* What: Field Name Label Element. Why: The choice needs a visible name. How: This labels the retention choice. */ }

							<select
								id='detTtlSel'

								className={ cssModObj.fieValSel }

								value={ ttlDayNum }

								aria-describedby='detTtlHin'

								onChange={ ( chaEveObj ) => setTtlDayNum( Number( chaEveObj.target.value ) ) } // What: Retention Change Handler. Why: A choice's value arrives as text, and the retention is a number of days. How: This keeps it as a number.
							>{ /* What: Field Value Select Element. Why: The retention is one of a few steps. How: This lists them. */ }


								{ ttlOptArr.map( ( dayValNum ) => ( // What: Retention Option Map. Why: Each step is a choice. How: This renders an option per step.


									<option
										key={ dayValNum }

										value={ dayValNum }
									>{ `${ dayValNum } days` }</option> // What: Retention Option Element. Why: A step reads as a number of days. How: This names it in days.


								) ) }


							</select>

							<p
								id='detTtlHin'

								className={ cssModObj.fieHinPar }
							>{ "How long the server keeps a message for someone who hasn't received it. Phones keep the chat they already have." }</p>{ /* What: Field Hint Paragraph Element. Why: The owner should know what the retention controls (Section 5). How: This says it. */ }


						</div>



						<ButBasCom
							className={ cssModObj.detSavBut }

							type='submit'
						>{ actKinStr === 'save' ? 'Saving…' : 'Save' }</ButBasCom>{ /* What: Details Save Button Component. Why: The settings are saved on purpose, and the label shows while they're being saved. How: This submits the form, reading "Saving…" while the save is out. */ }


					</form>


				) : ( // What: Values Branch. Why: A member who isn't the owner still sees the settings. How: This shows them, with who changes them.


					<>{ /* What: Values Fragment. Why: The note and the values sit in the part as its own children. How: This groups them without adding an element. */ }


						<p className={ cssModObj.detNotPar }>Only the group's owner changes these.</p>{ /* What: Details Note Paragraph Element. Why: A member should know why there's nothing to change. How: This says who changes them. */ }



						<dl className={ cssModObj.detValDes }>{ /* What: Details Value Description List Element. Why: Each setting reads as a name and its value. How: This pairs them. */ }


							<dt className={ cssModObj.detKeyTer }>Group name</dt>{ /* What: Details Key Term Element. Why: The value needs its name. How: This names the group name. */ }

							<dd className={ cssModObj.detValDet }>{ curGroObj.namStr }</dd>{ /* What: Details Value Details Element. Why: The member sees the group's name. How: This shows it. */ }

							<dt className={ cssModObj.detKeyTer }>Unreceived messages held for</dt>{ /* What: Details Key Term Element. Why: The value needs its name. How: This names the retention. */ }

							<dd className={ cssModObj.detValDet }>{ `${ curGroObj.ttlDayNum } days` }</dd>{ /* What: Details Value Details Element. Why: The member sees how long a message waits for them. How: This shows it in days. */ }


						</dl>


					</>


				) }


			</section>



			<section
				className={ cssModObj.endSetSec }

				aria-labelledby='endSetHea'
			>{ /* What: End Settings Section Element. Why: Leaving or deleting the group reads as one part, last. How: This holds its heading, note, and controls. */ }


				<h3
					id='endSetHea'

					className={ cssModObj.endTitHea }
				>{ curGroObj.ownBoo ? 'Delete the group' : 'Leave the group' }</h3>{ /* What: End Title Heading Element. Why: The part needs a heading saying what it does. How: This names the deletion for the owner and the leave for anyone else. */ }



				{ curGroObj.ownBoo ? ( // What: Owner End Check. Why: The owner can't leave, only hand the group over or delete it (Section 18). How: This shows the owner the deletion, or else the leave.


					<>{ /* What: Delete Fragment. Why: The note and the deletion sit in the part as its own children. How: This groups them without adding an element. */ }


						<p className={ cssModObj.endNotPar }>{ "As the owner, you can't leave the group. Hand it to another member first, or delete it. Deleting removes its chat, events, and members for everyone, and can't be undone." }</p>{ /* What: End Note Paragraph Element. Why: The owner should know why there's no leave, and what deleting does. How: This says both. */ }



						{ conDelBoo ? ( // What: Delete Confirm Check. Why: A deletion can't be undone, so it asks for the group's name first. How: This shows the confirmation, or else the button.


							<form
								className={ cssModObj.delConFor }

								noValidate

								onKeyDown={ ( keyEveObj ) => { if ( keyEveObj.key === 'Escape' ) { keyEveObj.preventDefault(); focRetRef.current = true; setConDelBoo( false ); } } } // What: Escape Handler. Why: Escape leaves the confirmation. How: This owes its button focus and closes it.
								onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void delConFun(); } } // What: Submit Handler. Why: The name is checked and the group deleted by the app, not by a page load. How: This cancels the browser's submit and confirms.
							>{ /* What: Delete Confirm Form Element. Why: The owner confirms by typing the group's name (Section 9). How: This holds the question, the box, its problem, and the two answers. */ }


								<p className={ cssModObj.conAskPar }>{ `Delete ${ curGroObj.namStr } for everyone?` }</p>{ /* What: Confirm Ask Paragraph Element. Why: The owner should see which group they're deleting. How: This asks, naming it. */ }

								<label
									className={ cssModObj.fieNamLab }
									htmlFor='delNamInp'
								>{ "Type the group's name to confirm" }</label>{ /* What: Field Name Label Element. Why: The box needs a visible name saying what to type. How: This labels it. */ }

								<input
									ref={ delInpRef }
									id='delNamInp'

									className={ cssModObj.fieValInp }

									autoComplete='off'
									maxLength={ 50 }
									type='text'
									value={ delNamStr }

									aria-describedby='delNamErr'
									aria-invalid={ delErrStr !== '' } // What: Delete Invalid State. Why: A screen reader says when the name doesn't match, and the border turns red. How: This is true while it doesn't.

									onChange={ ( chaEveObj ) => setDelNamStr( chaEveObj.target.value ) }
								/>{ /* What: Field Value Input Element. Why: The group's name is typed here. How: This holds it, at most 50 characters. */ }

								<p
									id='delNamErr'

									className={ cssModObj.fieErrPar }
								>{ delErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A name that doesn't match should be told beside its box and read with it. How: This shows the problem, empty when there's none. */ }



								<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The two answers sit together below the box. How: This lines them up in a row that wraps. */ }


									<button
										className={ cssModObj.actDanBut }

										type='submit'
									>{ actKinStr === 'delete' ? 'Deleting…' : 'Delete for everyone' }</button>{ /* What: Action Danger Button Element. Why: Deleting is confirmed on purpose, and the label shows while it's out. How: This submits the confirmation, reading "Deleting…" while the deletion is out. */ }

									<button
										className={ cssModObj.actPlaBut }

										type='button'

										onClick={ () => { focRetRef.current = true; setConDelBoo( false ); } } // What: Keep Handler. Why: The owner can change their mind. How: This owes the button focus and closes the confirmation.
									>Keep the group</button>{ /* What: Action Plain Button Element. Why: Leaving the confirmation is as easy as confirming. How: This closes it. */ }


								</div>


							</form>


						) : ( // What: Delete Button Branch. Why: Without the confirmation, the deletion is one button. How: This shows it.


							<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The deletion's button sits below the note. How: This holds it in a row that wraps. */ }


								<button
									ref={ delButRef }

									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => { setDelNamStr( '' ); setDelErrStr( '' ); setConDelBoo( true ); } } // What: Delete Click Handler. Why: The confirmation starts empty, with no problem left from before. How: This clears the box and its problem and opens it.
								>Delete group</button>{ /* What: Action Plain Button Element. Why: The owner can delete the group. How: This asks to confirm first. */ }


							</div>


						) }


					</>


				) : ( // What: Leave Branch. Why: Any member but the owner can always leave (Section 9). How: This shows the note and the leave.


					<>{ /* What: Leave Fragment. Why: The note and the leave sit in the part as its own children. How: This groups them without adding an element. */ }


						<p className={ cssModObj.endNotPar }>{ "Leaving takes the group off this phone. To come back, you'll need its link and a member's approval." }</p>{ /* What: End Note Paragraph Element. Why: A member should know what leaving does before they do it. How: This says it. */ }



						<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The leave sits below the note, or its confirmation in its place. How: This lines them up in a row that wraps. */ }


							{ conLeaBoo ? ( // What: Leave Confirm Check. Why: Leaving takes the group away, so it asks first. How: This shows the question and its answers, or else the button.


								<>{ /* What: Leave Confirmation Fragment. Why: The question and its two answers replace the button together. How: This groups them without adding an element. */ }


									<p className={ cssModObj.conAskPar }>{ `Leave ${ curGroObj.namStr }?` }</p>{ /* What: Confirm Ask Paragraph Element. Why: The member should see which group they're leaving. How: This asks, naming it. */ }

									<button
										className={ cssModObj.actDanBut }

										type='button'

										onClick={ () => void actRunFun( 'leave', () => groLeaFun( curGroObj.ideStr ) ).then( ( lanValBoo ) => { if ( lanValBoo ) onGonFun( curGroObj.ideStr, `You left ${ curGroObj.namStr }.` ); } ) } // What: Leave Confirm Handler. Why: The member confirmed, and the section goes with the group. How: This leaves, then hands the group to the host with the message once it lands.
									>{ actKinStr === 'leave' ? 'Leaving…' : 'Yes, leave' }</button>{ /* What: Action Danger Button Element. Why: Leaving is confirmed on purpose, and the label shows while it's out. How: This leaves the group, reading "Leaving…" while the leave is out. */ }

									<button
										ref={ leaStaRef }

										className={ cssModObj.actPlaBut }

										type='button'

										onClick={ () => { focRetRef.current = true; setConLeaBoo( false ); } } // What: Stay Handler. Why: The member can change their mind. How: This owes the button focus and closes the confirmation.
									>Stay</button>{ /* What: Action Plain Button Element. Why: Staying is the safe answer, so focus lands here. How: This closes the confirmation. */ }


								</>


							) : ( // What: Leave Button Branch. Why: Without the confirmation, the leave is one button. How: This shows it.


								<button
									ref={ leaButRef }

									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => setConLeaBoo( true ) }
								>Leave group</button> // What: Action Plain Button Element. Why: A member can leave the group. How: This asks to confirm first.


							) }


						</div>


					</>


				) }


			</section>



			<p
				className={ cssModObj.setStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Settings Status Paragraph Element. Why: A save is announced, since the page itself changes silently. How: This holds the status, empty from the first render. */ }

			<p
				className={ cssModObj.setErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Settings Error Paragraph Element. Why: A change that fails has to be told at once. How: This holds the alert, empty from the first render. */ }


		</div>


	);


}

// #endregion GroSetCom

// #endregion Components



// #region Exports

export { GroSetCom }; // What: Named Export. Why: The group frame shows the Settings section with it. How: This exports GroSetCom.

// #endregion Exports


