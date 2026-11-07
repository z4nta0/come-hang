


// #region Imports

import cssModObj from './group-settings.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';        // What: Button Base Component. Why: Saving the group's settings and accepting an offer are the section's leading actions. How: This draws their buttons.
import { dayDatFun    } from '../utils/date.ts';        // What: Day Date Function. Why: An offer says the day it lapses. How: This writes the day in full.
import { groDelFun    } from '../state/groups.ts';      // What: Group Delete Function. Why: The owner can delete the group. How: This deletes it for everyone.
import { groLeaFun    } from '../state/members.ts';     // What: Group Leave Function. Why: A member other than the owner can leave. How: This ends their membership.
import { groNamFun    } from '../core/text-limits.ts';  // What: Group Name Function. Why: A name outside its limits is caught before it's sent. How: This checks it.
import { groSetFun    } from '../state/groups.ts';      // What: Group Settings Function. Why: The owner renames the group and sets its chat retention. How: This saves both.
import { ideEnsFun    } from '../state/identity.ts';    // What: Identity Ensure Function. Why: The member an offer names answers it. How: This reads their UID.
import { memLisFun    } from '../state/members.ts';     // What: Member List Function. Why: The owner offers the group to a member by name. How: This reads the members.
import { OFF_LIF_NUM  } from '../state/ownership.ts';   // What: Offer Life Number. Why: An offer lapses 7 days after it's made. How: This gives that life.
import { offAccFun    } from '../state/ownership.ts';   // What: Offer Accept Function. Why: The member offered the group can take it. How: This makes them its owner.
import { offDecFun    } from '../state/ownership.ts';   // What: Offer Decline Function. Why: The member offered the group can turn it down. How: This declines and tells the owner.
import { offMakFun    } from '../state/ownership.ts';   // What: Offer Make Function. Why: The owner hands the group over by offering it (Section 18). How: This makes the offer.
import { offWitFun    } from '../state/ownership.ts';   // What: Offer Withdraw Function. Why: The owner can call an offer off. How: This withdraws it.
import { PerSetCom    } from './personal-settings.tsx'; // What: Personal Settings Component. Why: The phone's and account's parts sit in the group's Settings too. How: This draws them.
import { texNorFun    } from '../core/text-limits.ts';  // What: Text Normalize Function. Why: Names are checked and compared as they'll be saved. How: This tidies them.
import { useEffect    } from 'react';                   // What: Use Effect. Why: The section reads the members, and a confirmation or an offer moves focus. How: This starts the read and moves focus once drawn.
import { useRef       } from 'react';                   // What: Use Reference. Why: Focus moves between a button, what replaces it, and a field with a problem. How: This holds the elements.
import { useSetActFun } from './settings-actions.ts';   // What: Use Settings Actions Function. Why: The group's changes run one at a time and are announced. How: This returns the runners and the messages.
import { useState     } from 'react';                   // What: Use State. Why: The drafts, the members, the confirmations, and the messages change while the section is open. How: This holds each.


import type { GroRecTyp } from '../state/groups.ts';  // What: Group Record Type. Why: The section shows one group's settings. How: This types the group.
import type { MemRecTyp } from '../state/members.ts'; // What: Member Record Type. Why: The owner picks a member to offer the group to. How: This types each.

// #endregion Imports



/**
 * group-settings.tsx = Group Settings
 *
 * @summary
 * The open group's Settings section: the group's name and how long the server
 * holds a message someone hasn't received, which the owner changes in a form
 * and everyone else reads; handing the group over, which the owner offers to a
 * member and the member accepts or declines; the parts that belong to this
 * phone and the account, from personal-settings.tsx; then the way out of
 * the group, a leave for a member and a deletion, confirmed by typing the
 * group's name, for the owner. Each change is announced, a field with a
 * problem says so beside it, and a change that fails says why. A leave or
 * deletion hands the group to the screen host, which opens what's left.
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

const ACC_DEN_STR = "You can't take on another group right now. Delete or hand over a group you own first."; // What: Accept Denied String. Why: The rules refuse an acceptance past the member's owned cap (Section 18). How: The alert shows this.
const GRO_ERR_STR = 'Use letters, numbers, emoji, and simple punctuation.';                                  // What: Group Error String. Why: A group name with other characters is refused. How: This says what it may hold.
const OFF_DEN_STR = "That member can't take on another group right now. Offer it to someone else.";          // What: Offer Denied String. Why: The rules refuse an offer to a member with no free owned slot, without saying more about their account (Section 18). How: The alert shows this.

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
 * confirmation asks for the group's name and takes focus in its box. Leaving a
 * confirmation returns focus to the button that opened it. Between them, the
 * owner offers the group to a member chosen by name, then sees whom it's
 * offered to and when it lapses, with a withdrawal, while the member offered
 * it sees an accept and a decline; focus lands on what replaces the button
 * pressed once the group shows the change. Then come this phone's and the
 * account's parts and the legal documents ({@link PerSetCom}), which run
 * their own changes and messages. One change runs at a time, its
 * button reading what it's doing; a change is announced through the status and
 * a failure through the alert, a refused offer or acceptance saying why, while
 * a leave or deletion that lands calls onGonFun with the group's ID and what
 * to announce. Key it by the group, so another group starts afresh.
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


	const delButRef = useRef< HTMLButtonElement >( null );  // What: Delete Button Reference. Why: Leaving the deletion's confirmation returns focus to its button. How: This holds the button.
	const delInpRef = useRef< HTMLInputElement >( null );   // What: Delete Input Reference. Why: The deletion's confirmation puts the owner in its box. How: This holds the box.
	const endHeaRef = useRef< HTMLHeadingElement >( null ); // What: End Heading Reference. Why: A declined offer takes its part away, so focus lands on the next part's heading. How: This holds it.
	const focRetRef = useRef( false );                      // What: Focus Return Reference. Why: Focus returns to a button once its confirmation has gone. How: This is true while that's owed.
	const hanHeaRef = useRef< HTMLHeadingElement >( null ); // What: Handover Heading Reference. Why: An accepted offer replaces its buttons, so focus lands on the part's heading. How: This holds it.
	const leaButRef = useRef< HTMLButtonElement >( null );  // What: Leave Button Reference. Why: Leaving the leave's confirmation returns focus to its button. How: This holds the button.
	const leaStaRef = useRef< HTMLButtonElement >( null );  // What: Leave Stay Reference. Why: The leave's confirmation puts the member on its safe answer. How: This holds the Stay button.
	const namInpRef = useRef< HTMLInputElement >( null );   // What: Name Input Reference. Why: The name box takes focus when it has a problem. How: This holds the box.
	const offButRef = useRef< HTMLButtonElement >( null );  // What: Offer Button Reference. Why: A withdrawn offer brings the offer back, which takes focus. How: This holds its button.
	const witButRef = useRef< HTMLButtonElement >( null );  // What: Withdraw Button Reference. Why: An offer made replaces its form with the withdrawal, which takes focus. How: This holds its button.

	const setActObj = useSetActFun(); // What: Settings Actions Object. Why: The group's changes and the phone's and account's run one at a time and share one status and alert. How: This holds the runners and the messages, passed on to PerSetCom.

	const { actKinStr, actRunFun, chaRunFun, errMesStr, focChaRef, setStaMesStr, staMesStr } = setActObj; // What: Action Kind String. Why: A button says when its change is out. How: This reads it. // What: Action Run Function. Why: The group's changes run through it. How: This reads it. // What: Change Run Function. Why: An offer's or an answer's buttons give way to what replaces them. How: This reads it. // What: Error Message String. Why: A failed change is announced. How: This reads the alert's text. // What: Focus Change Reference. Why: Focus owed after a change is moved here. How: This reads it. // What: Status Message Setter. Why: A save is announced. How: This reads it. // What: Status Message String. Why: A change that lands is announced. How: This reads the status's text.

	const [ conDelBoo, setConDelBoo ] = useState( false );                      // What: Confirm Delete Boolean And Setter. Why: Deleting asks to confirm by name first. How: This is true while the confirmation shows.
	const [ conLeaBoo, setConLeaBoo ] = useState( false );                      // What: Confirm Leave Boolean And Setter. Why: Leaving asks to confirm first. How: This is true while the confirmation shows.
	const [ delErrStr, setDelErrStr ] = useState( '' );                         // What: Delete Error String And Setter. Why: A name that doesn't match is told beside its box. How: This holds the problem, empty when there's none.
	const [ delNamStr, setDelNamStr ] = useState( '' );                         // What: Delete Name String And Setter. Why: The confirmation's box shows what's typed. How: This holds it.
	const [ memRecArr, setMemRecArr ] = useState< MemRecTyp[] | null >( null ); // What: Member Record Array And Setter. Why: The owner offers the group to a member by name, and the offer names whom it's to. How: This holds the members, null until read.
	const [ namErrStr, setNamErrStr ] = useState( '' );                         // What: Name Error String And Setter. Why: The name box says what's wrong with it. How: This holds the problem, empty when there's none.
	const [ namTexStr, setNamTexStr ] = useState( curGroObj.namStr );           // What: Name Text String And Setter. Why: The name box shows what's typed, starting from the group's name. How: This holds it.
	const [ offTarStr, setOffTarStr ] = useState( '' );                         // What: Offer Target String And Setter. Why: The offer's choice shows the member picked. How: This holds their UID, empty until one is picked.
	const [ ttlDayNum, setTtlDayNum ] = useState( curGroObj.ttlDayNum );        // What: TTL Day Number And Setter. Why: The retention choice shows what's picked, starting from the group's. How: This holds it, in days.
	const [ uidValStr, setUidValStr ] = useState( '' );                         // What: UID Value String And Setter. Why: The member an offer names sees its answers. How: This holds their UID, empty until read.


	const ttlOptArr = TTL_DAY_ARR.includes( curGroObj.ttlDayNum ) ? TTL_DAY_ARR : [ ...TTL_DAY_ARR, curGroObj.ttlDayNum ].sort( ( dayOneNum, dayTwoNum ) => dayOneNum - dayTwoNum ); // What: TTL Option Array. Why: A retention saved outside the usual steps should still show as chosen. How: This adds the group's own value to the steps when it isn't one.



	const offEndNum = curGroObj.offTimNum + OFF_LIF_NUM;                                                                        // What: Offer End Number. Why: An offer lapses 7 days after it's made. How: This adds its life to its time.
	const offLivBoo = curGroObj.offUidStr !== '' && offEndNum > Date.now();                                                       // What: Offer Live Boolean. Why: A lapsed offer can't be accepted, and the daily run clears it later (Section 18). How: This is true while one stands and hasn't lapsed.
	const othMemArr = ( memRecArr ?? [] ).filter( ( memRecObj ) => memRecObj.uidValStr !== curGroObj.ownUidStr );                // What: Other Member Array. Why: The owner offers the group to someone else. How: This leaves the owner out of the members.
	const offMemStr = othMemArr.find( ( memRecObj ) => memRecObj.uidValStr === curGroObj.offUidStr )?.namTexStr || 'a member'; // What: Offer Member String. Why: The owner sees whom the offer is to. How: This finds their name, or says a member when it's unread.
	const offPicStr = othMemArr.some( ( memRecObj ) => memRecObj.uidValStr === offTarStr ) ? offTarStr : othMemArr[ 0 ]?.uidValStr ?? ''; // What: Offer Picked String. Why: The choice starts on the first member, and a member who has left can't stay picked. How: This takes the pick while it's a member, else the first.

	const offYouBoo = offLivBoo && curGroObj.offUidStr === uidValStr; // What: Offer You Boolean. Why: Only the member an offer names answers it. How: This is true when the live offer names this identity.



	useEffect( () => { // What: Members Load Effect. Why: The offer names members, and a handover changes who owns the group. How: This reads the UID and the members, again when the owner changes.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after a newer one began, or after the section closed, mustn't change it. How: This is true until the cleanup runs.


		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: The member offered the group answers it. How: This reads the UID.

		void memLisFun( curGroObj.ideStr ).then( ( lisRecArr ) => { if ( actValBoo ) setMemRecArr( [ ...lisRecArr ].sort( ( memOneObj, memTwoObj ) => memOneObj.namTexStr.localeCompare( memTwoObj.namTexStr ) ) ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Members Read Call. Why: The owner picks a member by name. How: This reads the members and sorts them, logging a failure.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A read still out shouldn't land after a newer one began. How: This marks it stale.


	}, [ curGroObj.ideStr, curGroObj.ownUidStr ] ); // What: Effect Dependency Array. Why: The members belong to one group, and a handover changes whose view this is. How: curGroObj.ideStr names the group, and curGroObj.ownUidStr changes with its owner.



	useEffect( () => { // What: Change Focus Effect. Why: Making, withdrawing, accepting, or declining an offer takes away the button pressed once the screen shows the change. How: Once the element owed focus is drawn, this focuses it and clears the debt.


		const tarEleObj = focChaRef.current?.current; // What: Target Element Object. Why: The element owed focus may not be drawn yet. How: This reads it, undefined or null until it is.


		if ( !tarEleObj ) return; // What: Drawn Guard. Why: Focus waits for the element to appear. How: This returns until it has.



		focChaRef.current = null; // What: Focus Clear Assignment. Why: The move is owed once. How: This clears the debt.

		tarEleObj.focus(); // What: Focus Call. Why: The next Tab carries on from the part that changed. How: This focuses it.


	}, [ curGroObj.offUidStr, curGroObj.ownBoo, focChaRef, memRecArr ] ); // What: Effect Dependency Array. Why: The element owed focus appears once the offer, the owner, or the members change. How: curGroObj.offUidStr changes with an offer, curGroObj.ownBoo with an acceptance, gooLinBoo with a link, and memRecArr when the members are read again.



	useEffect( () => { // What: Leave Focus Effect. Why: The button that opened the confirmation goes with it, and comes back when it closes. How: This focuses Stay as it opens, and the button again when it closes owing focus.


		if ( conLeaBoo ) leaStaRef.current?.focus(); // What: Stay Focus Call. Why: The confirmation opened, and its safe answer is the one to land on. How: This focuses Stay.

		else if ( focRetRef.current ) { focRetRef.current = false; leaButRef.current?.focus(); } // What: Button Focus Call. Why: The confirmation closed and owes its button focus. How: This focuses the button and clears the debt.


	}, [ conLeaBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the confirmation opens and closes. How: conLeaBoo changes then.



	useEffect( () => { // What: Delete Focus Effect. Why: The button that opened the confirmation goes with it, and comes back when it closes. How: This focuses the name box as it opens, and the button again when it closes owing focus.


		if ( conDelBoo ) delInpRef.current?.focus(); // What: Box Focus Call. Why: The confirmation opened, and typing the name is the next step. How: This focuses the box.

		else if ( focRetRef.current ) { focRetRef.current = false; delButRef.current?.focus(); } // What: Button Focus Call. Why: The confirmation closed and owes its button focus. How: This focuses the button and clears the debt.


	}, [ conDelBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the confirmation opens and closes. How: conDelBoo changes then.



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
							>{ "How long the server keeps a message for someone who hasn't received it. Devices keep the chat they already have." }</p>{ /* What: Field Hint Paragraph Element. Why: The owner should know what the retention controls (Section 5). How: This says it. */ }


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



			{ ( curGroObj.ownBoo || offYouBoo ) && ( // What: Handover Check. Why: Only the owner hands the group over, and only the member offered it answers (Section 18). How: This shows the part to them.


				<section
					className={ cssModObj.hanSetSec }

					aria-labelledby='hanSetHea'
				>{ /* What: Handover Settings Section Element. Why: Handing the group to another member reads as one part. How: This holds its heading, note, and controls. */ }


					<h3
						ref={ hanHeaRef }
						id='hanSetHea'

						className={ cssModObj.hanTitHea }

						tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once an accepted offer replaces its buttons, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
					>{ curGroObj.ownBoo ? 'Hand over the group' : "You're offered this group" }</h3>{ /* What: Handover Title Heading Element. Why: The part needs a heading saying what it's for. How: This names the handover for the owner and the offer for the member it names. */ }



					{ !curGroObj.ownBoo ? ( // What: Offered Check. Why: The member offered the group answers it. How: This shows them the offer, or else the owner's controls.


						<>{ /* What: Offered Fragment. Why: The note and the answers sit in the part as its own children. How: This groups them without adding an element. */ }


							<p className={ cssModObj.hanNotPar }>{ `If you accept, you become the owner of ${ curGroObj.namStr }, and the owner now stays in it as a member. The offer lapses on ${ dayDatFun( offEndNum ) }.` }</p>{ /* What: Handover Note Paragraph Element. Why: The member should know what accepting does and how long they have. How: This says both, naming the day it lapses. */ }



							<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The two answers sit together below the note. How: This lines them up in a row that wraps. */ }


								<ButBasCom onClick={ () => void chaRunFun( 'accept', hanHeaRef, () => offAccFun( curGroObj.ideStr ), `You now own ${ curGroObj.namStr }.`, { 'permission-denied' : ACC_DEN_STR } ) }>{ actKinStr === 'accept' ? 'Accepting…' : 'Accept' }</ButBasCom>{ /* What: Accept Button Component. Why: Taking the group is the offer's leading answer, and the label shows while it's out. How: This accepts, owing the heading focus, reading "Accepting…" while the acceptance is out. */ }

								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => void chaRunFun( 'decline', endHeaRef, () => offDecFun( curGroObj.ideStr ), 'Declined the offer.' ) } // What: Decline Handler. Why: The member can turn the group down, which tells the owner, and the part goes with the offer. How: This declines, owing the next part's heading focus, and announces it.
								>{ actKinStr === 'decline' ? 'Declining…' : 'Decline' }</button>{ /* What: Action Plain Button Element. Why: Declining is the lighter answer, and the label shows while it's out. How: This declines the offer, reading "Declining…" while the decline is out. */ }


							</div>


						</>


					) : offLivBoo ? ( // What: Standing Offer Check. Why: An owner with an offer out sees where it stands (Section 18). How: This shows whom it's to and when it lapses, or else the offer's form.


						<>{ /* What: Standing Fragment. Why: The note and the withdrawal sit in the part as its own children. How: This groups them without adding an element. */ }


							<p className={ cssModObj.hanNotPar }>{ `Offered to ${ offMemStr }. The group moves to them once they accept, and the offer lapses on ${ dayDatFun( offEndNum ) }.` }</p>{ /* What: Handover Note Paragraph Element. Why: The owner should see the handover isn't done until it's accepted. How: This names the member and the day it lapses. */ }



							<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The withdrawal sits below the note. How: This holds it in a row that wraps. */ }


								<button
									ref={ witButRef }

									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => void chaRunFun( 'withdraw', offButRef, () => offWitFun( curGroObj.ideStr ), 'Withdrew the offer.' ) } // What: Withdraw Handler. Why: The owner can call the offer off at once, and the button goes with it. How: This withdraws it, owing the offer's button focus, and announces it.
								>{ actKinStr === 'withdraw' ? 'Withdrawing…' : 'Withdraw the offer' }</button>{ /* What: Action Plain Button Element. Why: An offer is withdrawn on purpose, and the label shows while it's out. How: This withdraws it, reading "Withdrawing…" while the withdrawal is out. */ }


							</div>


						</>


					) : memRecArr === null ? ( // What: Members Loaded Check. Why: Until the members are read, there's no one to offer the group to. How: This says they're loading, or else shows the form.


						<p className={ cssModObj.hanNotPar }>Loading members…</p> // What: Handover Note Paragraph Element. Why: An empty part would read as broken. How: This says the members are loading.


					) : othMemArr.length === 0 ? ( // What: No Members Check. Why: A group of one has no one to hand to. How: This says so, or else shows the form.


						<p className={ cssModObj.hanNotPar }>Once someone else joins, you can offer them the group.</p> // What: Handover Note Paragraph Element. Why: The owner should know why there's no choice. How: This says when there will be.


					) : ( // What: Offer Form Branch. Why: The owner offers the group to a member. How: This shows the note and the form.


						<>{ /* What: Offer Fragment. Why: The note and the form sit in the part as its own children. How: This groups them without adding an element. */ }


							<p className={ cssModObj.hanNotPar }>The group moves to the member you choose only once they accept, and you stay in it as a member.</p>{ /* What: Handover Note Paragraph Element. Why: The owner should know an offer isn't a handover until it's accepted. How: This says so. */ }



							<form
								className={ cssModObj.hanOffFor }

								noValidate

								onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void chaRunFun( 'offer', witButRef, () => offMakFun( curGroObj.ideStr, offPicStr ), `Offered ${ curGroObj.namStr } to ${ othMemArr.find( ( memRecObj ) => memRecObj.uidValStr === offPicStr )?.namTexStr || 'a member' }.`, { 'permission-denied' : OFF_DEN_STR } ); } } // What: Submit Handler. Why: The offer is made by the app, not by a page load, and the form goes with it. How: This cancels the browser's submit, then offers the group to the member picked, owing the withdrawal focus, and announces whom it's to.
							>{ /* What: Handover Offer Form Element. Why: The owner picks whom to offer the group to. How: This holds the choice and the button. */ }


								<label
									className={ cssModObj.fieNamLab }
									htmlFor='hanTarSel'
								>Offer the group to</label>{ /* What: Field Name Label Element. Why: The choice needs a visible name. How: This labels it. */ }

								<select
									id='hanTarSel'

									className={ cssModObj.fieValSel }

									value={ offPicStr }

									onChange={ ( chaEveObj ) => setOffTarStr( chaEveObj.target.value ) }
								>{ /* What: Field Value Select Element. Why: The group goes to one of its other members. How: This lists them by name. */ }


									{ othMemArr.map( ( memRecObj ) => ( // What: Member Option Map. Why: Each other member is a choice. How: This renders an option per member.


										<option
											key={ memRecObj.uidValStr }

											value={ memRecObj.uidValStr }
										>{ memRecObj.namTexStr || 'A member' }</option> // What: Member Option Element. Why: A member is chosen by name. How: This names them, or says a member when the name is unread.


									) ) }


								</select>



								<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The offer's button sits below the choice. How: This holds it in a row that wraps. */ }


									<button
										ref={ offButRef }

										className={ cssModObj.actPlaBut }

										type='submit'
									>{ actKinStr === 'offer' ? 'Offering…' : 'Offer the group' }</button>{ /* What: Action Plain Button Element. Why: The offer is made on purpose, and the label shows while it's out. How: This submits the form, reading "Offering…" while the offer is out. */ }


								</div>


							</form>


						</>


					) }


				</section>


			) }



			<PerSetCom setActObj={ setActObj } />{ /* What: Personal Settings Component. Why: This phone's and the account's settings, and the legal documents, belong to no one group. How: This draws their parts above the way out of the group. */ }



			<section
				className={ cssModObj.endSetSec }

				aria-labelledby='endSetHea'
			>{ /* What: End Settings Section Element. Why: Leaving or deleting the group reads as one part, last. How: This holds its heading, note, and controls. */ }


				<h3
					ref={ endHeaRef }
					id='endSetHea'

					className={ cssModObj.endTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once a declined offer takes its part away, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>{ curGroObj.ownBoo ? 'Delete the group' : 'Leave the group' }</h3>{ /* What: End Title Heading Element. Why: The part needs a heading saying what it does. How: This names the deletion for the owner and the leave for anyone else. */ }



				{ curGroObj.ownBoo ? ( // What: Owner End Check. Why: The owner can't leave, only hand the group over or delete it (Section 18). How: This shows the owner the deletion, or else the leave.


					<>{ /* What: Delete Fragment. Why: The note and the deletion sit in the part as its own children. How: This groups them without adding an element. */ }


						<p className={ cssModObj.endNotPar }>{ "As the owner, you can't leave the group. Hand it to another member first, or delete it. Deleting removes its chat, events, photos, and members for everyone, and can't be undone." }</p>{ /* What: End Note Paragraph Element. Why: The owner should know why there's no leave, and what deleting does. How: This says both. */ }



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


						<p className={ cssModObj.endNotPar }>{ "Leaving takes the group off this device. To come back, you'll need its link and a member's approval." }</p>{ /* What: End Note Paragraph Element. Why: A member should know what leaving does before they do it. How: This says it. */ }



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
			>{ staMesStr }</p>{ /* What: Settings Status Paragraph Element. Why: A save or a change to the offer is announced, since the page itself changes silently. How: This holds the status, empty from the first render. */ }

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


