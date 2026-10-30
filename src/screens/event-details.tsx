


// #region Imports

import cssModObj from './event-details.module.css'; // What: CSS Module Object. Why: The details are styled in their own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Adding to the list is the details' leading action. How: This draws its button.
import { eveDatFun } from '../utils/date.ts';       // What: Event Date Function. Why: The details give the event's full date and hours. How: This formats them.
import { IcoSvgCom } from '../ui/icon.tsx';         // What: Icon SVG Component. Why: Each item's remove button shows a cross. How: This draws it.
import { iniTexFun } from '../utils/text.ts';       // What: Initials Text Function. Why: A claim shows its member's avatar. How: This takes their initials.
import { iteAddFun } from '../state/items.ts';      // What: Item Add Function. Why: Any member adds to the list. How: This adds an open item.
import { iteAsgFun } from '../state/items.ts';      // What: Item Assign Function. Why: A member lets go of what they claimed. How: This opens the item again.
import { iteClaFun } from '../state/items.ts';      // What: Item Claim Function. Why: A member takes an open item. How: This claims it.
import { iteDelFun } from '../state/items.ts';      // What: Item Delete Function. Why: Any member removes an item. How: This deletes it.
import { iteWatFun } from '../state/items.ts';      // What: Item Watch Function. Why: Claims and new items show at once. How: This watches the list.
import { sloColFun } from '../ui/member-color.ts';  // What: Slot Color Function. Why: A claim wears its member's color. How: This names the color.
import { texNorFun } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: An added item is announced as it's stored. How: This tidies its label.
import { useEffect } from 'react';                  // What: Use Effect. Why: The list is watched while the details are shown. How: This starts and stops the watch.
import { useState  } from 'react';                  // What: Use State. Why: The list, the box, and the messages change while the details are shown. How: This holds each.


import type { EveRecTyp } from '../state/events.ts';  // What: Event Record Type. Why: The details show one event. How: This types it.
import type { IteRecTyp } from '../state/items.ts';   // What: Item Record Type. Why: The list shows each item. How: This types it.
import type { MemRecTyp } from '../state/members.ts'; // What: Member Record Type. Why: Each claim names its member. How: This types each.

// #endregion Imports



/**
 * event-details.tsx = Event Details
 *
 * @summary
 * An event's details and its bring-list, shown in the pinned event's sheet
 * and in the wide screen's event panel: the date and hours, the place and
 * notes when there are any, then who's bringing what. Each item shows who
 * claimed it in their color, or that it's open, and offers to claim an open
 * item, to let go of the member's own, and to remove it. The list follows
 * every member's changes as they land. Each change is announced, and one
 * that fails says why.
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

const FAI_ITE_STR = "That didn't go through. Try again."; // What: Failure Item String. Why: A change that fails for any other reason still has to be told. How: The alert shows this.
const LAB_LIM_STR = 'Use 1 to 50 characters.';          // What: Label Limits String. Why: A label outside its limits is refused before it's sent. How: The alert shows this.

// #endregion Constants



// #region Components

type EdcProTyp = { eveRecObj : EveRecTyp, groIdeStr : string, memRecMap : Map< string, MemRecTyp >, uidValStr : string, varStr : 'pan' | 'she' }; // What: Event Details Component Props Type. Why: The details show one event of one group, naming members and marking the member's own claims, in the sheet or the panel. How: This types EveDetCom's props.

// #region EveDetCom

/**
 * EveDetCom = Event Details Component
 *
 * @summary
 * Renders an event's details and its bring-list, watching the list while
 * shown. Claiming, letting go, and removing act on one item, adding takes
 * what's typed, and one change runs at a time. A change that lands is
 * announced through a status region, and one that fails through an alert,
 * saying when someone already claimed the item or a label is outside its
 * limits. A list that can't load says so. The variant keeps the box's ID
 * unique when the sheet and the panel both hold the details. Key it by the
 * event, so another event starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.eveRecObj - Event Record Object: The event to show.
 * @param props.groIdeStr - Group Identifier String: The event's group.
 * @param props.memRecMap - Member Record Map: The group's members, by UID.
 * @param props.uidValStr - UID Value String: This member's UID.
 * @param props.varStr    - Variant String: Where the details sit, pan for
 *                          the panel or she for the sheet.
 *
 * @returns The details.
 *
 * @example
 * ```tsx
 * EveDetCom({ eveRecObj, groIdeStr, ..., varStr }) // => <EveDetCom />
 * ```
 *
*/

function EveDetCom ( { eveRecObj, groIdeStr, memRecMap, uidValStr, varStr } : EdcProTyp ) : React.JSX.Element {


	const addIdeStr = `briAddInp--${ varStr }`; // What: Add Identifier String. Why: The sheet and the panel both hold a box, and IDs have to be unique. How: This names the box with its variant.

	const [ actReqBoo, setActReqBoo ] = useState( false );                      // What: Action Request Boolean And Setter. Why: One change at a time keeps a double tap from acting twice. How: This is true while one is out.
	const [ addTexStr, setAddTexStr ] = useState( '' );                         // What: Add Text String And Setter. Why: The box shows what's typed. How: This holds it.
	const [ errMesStr, setErrMesStr ] = useState( '' );                         // What: Error Message String And Setter. Why: A failed change is announced. How: This holds the alert's text, empty when there's none.
	const [ iteRecArr, setIteRecArr ] = useState< IteRecTyp[] | null >( null ); // What: Item Record Array And Setter. Why: The list shows each item. How: This holds them, null until the first report.
	const [ lisErrBoo, setLisErrBoo ] = useState( false );                      // What: List Error Boolean And Setter. Why: A list that can't load says so. How: This is true once the watch fails.
	const [ staMesStr, setStaMesStr ] = useState( '' );                         // What: Status Message String And Setter. Why: A change that lands is announced. How: This holds the status's text.



	useEffect( () => iteWatFun( groIdeStr, eveRecObj.eveIdeStr, setIteRecArr, ( errCatObj ) => { console.warn( errCatObj ); setLisErrBoo( true ); } ), [ eveRecObj.eveIdeStr, groIdeStr ] ); // What: Item Watch Effect. Why: Every member's change shows while the details are open. How: This watches the list, logs and shows a failure, and stops the watch when the details go. // What: Effect Dependency Note. Why: The watch belongs to one event of one group. How: eveRecObj.eveIdeStr and groIdeStr name it.



	// #region actRunFun

	/**
	 * actRunFun = Action Run Function
	 *
	 * @summary
	 * Runs one change to the list: ignores it while another is out, clears
	 * the messages, then awaits the change, announcing the given status when
	 * it lands. A failure is logged and announced: someone else's claim and a
	 * label outside its limits each say so, and anything else asks to try
	 * again. Resolves true when the change landed.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param actStaFun - Action Start Function: Starts the change.
	 * @param donMesStr - Done Message String: What to announce once it lands.
	 *
	 * @returns A promise that resolves with whether the change landed.
	 *
	 * @example
	 * ```ts
	 * actRunFun(delIteFun, 'Removed Pie.') // => true
	 * ```
	 *
	*/

	const actRunFun = async ( actStaFun : () => Promise< unknown >, donMesStr : string ) : Promise< boolean > => { // What: Action Run Function. Why: Every change to the list runs, and is announced, the same way. How: This runs one and reports how it went.


		if ( actReqBoo ) return false; // What: Busy Guard. Why: A change while another is out could act twice. How: This ignores it.



		setActReqBoo( true ); // What: Busy Set Call. Why: The next change waits for this one. How: This marks one as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next status should be announced afresh. How: This empties the status.



		try { // What: Change Try. Why: A change that lands is announced. How: This awaits it, then announces it.


			await actStaFun(); // What: Change Call. Why: The list changes. How: This runs the change.

			setStaMesStr( donMesStr ); // What: Status Set Call. Why: Every member's view updates, and this member hears what changed. How: This announces it.


		}

		catch ( errCatObj ) { // What: Change Catch. Why: A failed change has to be told. How: This logs it and announces why.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( errCatObj instanceof RangeError ? LAB_LIM_STR : errCatObj instanceof Error && errCatObj.message === 'Someone already claimed that.' ? errCatObj.message : FAI_ITE_STR ); // What: Failure Announce Call. Why: A label outside its limits and someone else's claim each say so, and anything else asks to try again. How: This picks the alert's text by the error.

			setActReqBoo( false ); // What: Busy Clear Call. Why: The member can try again. How: This marks the change as done.



			return false;


		}



		setActReqBoo( false ); // What: Busy Clear Call. Why: The next change can run. How: This marks the change as done.



		return true;


	};

	// #endregion actRunFun



	return (


		<div className={ cssModObj.eveDetDiv }>{ /* What: Event Details Div Element. Why: The details and the list read top to bottom. How: This stacks the facts, the list, and the add form. */ }


			<p className={ cssModObj.detDatPar }>{ eveDatFun( eveRecObj.staTimNum, eveRecObj.endTimNum ) }</p>{ /* What: Details Date Paragraph Element. Why: When the event is comes first. How: This shows its full date and hours. */ }

			{ eveRecObj.locTexStr !== '' && <p className={ cssModObj.detLocPar }>{ eveRecObj.locTexStr }</p> }{ /* What: Details Location Check. Why: An event may have no place yet. How: This shows the place when there is one. */ }

			{ eveRecObj.desTexStr !== '' && <p className={ cssModObj.detDesPar }>{ eveRecObj.desTexStr }</p> }{ /* What: Details Description Check. Why: An event may have no notes. How: This shows the notes, keeping their line breaks, when there are any. */ }

			<h3 className={ cssModObj.briLisHea }>Who's bringing what</h3>{ /* What: Bring List Heading Element. Why: The list needs a heading a screen reader can find. How: This names it. */ }



			{ iteRecArr === null ? ( // What: List Loaded Check. Why: Until the first report, there's nothing to list. How: This shows the loading or failure line, or else the list.


				<p className={ cssModObj.briNotPar }>{ lisErrBoo ? "The list couldn't load." : 'Loading the list…' }</p> // What: Bring Note Paragraph Element. Why: An empty space would read as an empty list. How: This says the list is loading, or that it couldn't.


			) : iteRecArr.length === 0 ? ( // What: List Empty Check. Why: A new event has nothing on its list. How: This invites the first item.


				<p className={ cssModObj.briNotPar }>Nothing on the list yet.</p> // What: Bring Note Paragraph Element. Why: An empty list should say so. How: This shows the note.


			) : (


				<ul className={ cssModObj.briLisUno }>{ /* What: Bring List Unordered List Element. Why: The items read as one list. How: This stacks a row for each. */ }


					{ iteRecArr.map( ( iteRecObj ) => { // What: Item Row Map. Why: Each item gets its own row. How: This renders one per item.


						const asgMemObj = iteRecObj.asgUidStr === null ? undefined : memRecMap.get( iteRecObj.asgUidStr );                                  // What: Assigned Member Object. Why: A claim names its member and wears their color. How: This looks them up, undefined when the item's open or they've left.
						const labShoStr = iteRecObj.labTexStr === '' ? 'An unreadable item' : iteRecObj.labTexStr;                                          // What: Label Shown String. Why: A label that won't decrypt still needs words. How: This names it plainly.
						const ownIteBoo = iteRecObj.asgUidStr === uidValStr;                                                                                // What: Own Item Boolean. Why: The member lets go of what they claimed. How: This is true for their claims.
						const whoNamStr = iteRecObj.asgUidStr === null ? 'Open' : ownIteBoo ? 'You' : asgMemObj ? asgMemObj.namTexStr : 'A removed member'; // What: Who Name String. Why: Each row says who's bringing it. How: This names the member, "You", "Open", or a member who left.



						return (


							<li
								key={ iteRecObj.iteIdeStr }

								className={ cssModObj.briIteIte }
							>{ /* What: Bring Item Item Element. Why: An item shows what it is, who's bringing it, and what can be done. How: This lays the label over who, beside the actions. */ }


								<span className={ cssModObj.iteLabSpa }>{ labShoStr }</span>{ /* What: Item Label Span Element. Why: The label says what to bring. How: This shows it. */ }


								<span className={ cssModObj.iteWhoSpa }>{ /* What: Item Who Span Element. Why: Who's bringing it is read beside their color. How: This shows the avatar and the name, or "Open". */ }


									{ iteRecObj.asgUidStr !== null && ( // What: Avatar Check. Why: Only a claim has a member to show. How: This shows the claimer's avatar.


										<span
											className={ cssModObj.iteAvaSpa }
											style={{ backgroundColor : asgMemObj ? sloColFun( asgMemObj.colSloNum ) : undefined }} // What: Avatar Color Note. Why: Each member wears their own color, and someone who left keeps the plain look. How: This reads their slot's token.

											aria-hidden='true'
										>{ iniTexFun( asgMemObj ? asgMemObj.namTexStr : '?' ) }</span> // What: Item Avatar Span Element. Why: An avatar in the member's color ties the claim to them at a glance, while their name is read beside it. How: This shows their initials, hidden from screen readers.


									) }

									{ whoNamStr }


								</span>



								<span className={ cssModObj.iteActSpa }>{ /* What: Item Actions Span Element. Why: An item's actions sit together at its end. How: This lines them up in a row. */ }


									{ iteRecObj.asgUidStr === null && ( // What: Claim Check. Why: Only an open item can be claimed. How: This offers the claim.


										<button
											className={ cssModObj.iteClaBut }

											type='button'

											onClick={ () => void actRunFun( () => iteClaFun( groIdeStr, eveRecObj.eveIdeStr, iteRecObj.iteIdeStr ), `You're bringing ${ labShoStr }.` ) }
										>I'll bring it<span className={ cssModObj.iteHidSpa }>{ ` (${ labShoStr })` }</span></button> // What: Item Claim Button Element. Why: Taking an item is one tap, and a screen reader hears which item. How: This claims it and announces it.


									) }

									{ ownIteBoo && ( // What: Release Check. Why: Only the member's own claim is theirs to let go. How: This offers to let go.


										<button
											className={ cssModObj.iteRelBut }

											type='button'

											onClick={ () => void actRunFun( () => iteAsgFun( groIdeStr, eveRecObj.eveIdeStr, iteRecObj.iteIdeStr, null ), `${ labShoStr } is open again.` ) }
										>Let go<span className={ cssModObj.iteHidSpa }>{ ` (${ labShoStr })` }</span></button> // What: Item Release Button Element. Why: Plans change, and an item someone can't bring should open up for others. How: This opens it again and announces it.


									) }



									<button
										className={ cssModObj.iteDelBut }

										type='button'

										aria-label={ `Remove ${ labShoStr }` }
										title='Remove'

										onClick={ () => void actRunFun( () => iteDelFun( groIdeStr, eveRecObj.eveIdeStr, iteRecObj.iteIdeStr ), `Removed ${ labShoStr }.` ) }
									>{ /* What: Item Delete Button Element. Why: An item nobody needs comes off the list. How: This removes it and announces it. */ }


										<IcoSvgCom
											icoNamStr='close'
											sizSteStr='bas'
										/>{ /* What: Close Icon SVG Component. Why: A cross says the button removes the item. How: This draws it at the base step. */ }{ /* Vertical Rhythm Base ~= 14.572px */ }


									</button>


								</span>


							</li>


						);


					} ) }


				</ul>


			) }



			<form
				className={ cssModObj.briAddFor }

				noValidate

				onSubmit={ ( subEveObj ) => { // What: Add Submit Handler. Why: Enter or the button adds what's typed. How: This stops the page loading and adds an open item, clearing the box once it lands.


					subEveObj.preventDefault(); // What: Default Stop Call. Why: The form shouldn't load a page. How: This cancels the submit.



					if ( addTexStr.trim() === '' ) return; // What: Empty Guard. Why: An empty box adds nothing. How: This ignores the submit.



					const addLabStr = texNorFun( addTexStr ); // What: Add Label String. Why: The announcement names the item as it's stored. How: This tidies it as the store does.


					void actRunFun( () => iteAddFun( groIdeStr, eveRecObj.eveIdeStr, addTexStr, null ), `Added ${ addLabStr }.` ).then( ( lanValBoo ) => { if ( lanValBoo ) setAddTexStr( '' ); } ); // What: Add Call. Why: The item joins the list open, for anyone to claim. How: This adds it and empties the box once it lands.


				} }
			>{ /* What: Bring Add Form Element. Why: Anyone adds to the list. How: This holds the box and its button. */ }


				<label
					className={ cssModObj.addLabLab }

					htmlFor={ addIdeStr }
				>Add to the list</label>{ /* What: Add Label Label Element. Why: The box needs a visible name. How: This names it. */ }

				<input
					id={ addIdeStr }

					className={ cssModObj.addTexInp }

					autoComplete='off'
					maxLength={ 50 }
					type='text'
					value={ addTexStr }

					onChange={ ( chaEveObj ) => setAddTexStr( chaEveObj.target.value ) }
				/>{ /* What: Add Text Input Element. Why: The member types what to bring. How: This holds it, up to 50 characters. */ }

				<ButBasCom
					className={ cssModObj.addSubBut }

					type='submit'
				>Add</ButBasCom>{ /* What: Add Submit Button Component. Why: Adding needs a visible action. How: This submits the form. */ }


			</form>



			<p
				className={ cssModObj.briStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Bring Status Paragraph Element. Why: A change that lands is announced, since the list itself changes silently. How: This holds the status, empty from the first render. */ }

			<p
				className={ cssModObj.briErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Bring Error Paragraph Element. Why: A change that fails has to be told at once. How: This holds the alert, empty from the first render. */ }


		</div>


	);


}

// #endregion EveDetCom

// #endregion Components



// #region Exports

export { EveDetCom }; // What: Named Export. Why: The pinned event's sheet and the event panel show an event with it. How: This exports EveDetCom.

// #endregion Exports


