


// #region Imports

import cssModObj from './event-details.module.css'; // What: CSS Module Object. Why: The details are styled in their own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Adding to the list and saving an item's edit are the details' leading actions. How: This draws their buttons.
import { eveDatFun } from '../utils/date.ts';       // What: Event Date Function. Why: The details give the event's full date and hours. How: This formats them.
import { IcoSvgCom } from '../ui/icon.tsx';         // What: Icon SVG Component. Why: Each item's remove button shows a cross. How: This draws it.
import { iniTexFun } from '../utils/text.ts';       // What: Initials Text Function. Why: A claim shows its member's avatar. How: This takes their initials.
import { iteAddFun } from '../state/items.ts';      // What: Item Add Function. Why: Any member adds to the list. How: This adds an open item.
import { iteAsgFun } from '../state/items.ts';      // What: Item Assign Function. Why: A member lets go of what they claimed. How: This opens the item again.
import { iteClaFun } from '../state/items.ts';      // What: Item Claim Function. Why: A member takes an open item. How: This claims it.
import { iteDelFun } from '../state/items.ts';      // What: Item Delete Function. Why: Any member removes an item. How: This deletes it.
import { iteRenFun } from '../state/items.ts';      // What: Item Rename Function. Why: Any member relabels an item. How: This saves the new label.
import { iteWatFun } from '../state/items.ts';      // What: Item Watch Function. Why: Claims and new items show at once. How: This watches the list.
import { sloColFun } from '../ui/member-color.ts';  // What: Slot Color Function. Why: A claim wears its member's color. How: This names the color.
import { texNorFun } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: An added item is announced as it's stored. How: This tidies its label.
import { useEffect } from 'react';                  // What: Use Effect. Why: The list is watched while the details are shown, and an item's edit takes and returns focus. How: This starts and stops the watch and moves focus.
import { useRef    } from 'react';                  // What: Use Reference. Why: Focus moves between an item's label and its edit form. How: This holds the elements.
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
 * item, to let go of the member's own, and to remove it, and its label opens
 * a form to relabel or reassign it. The list follows
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
const LAB_LIM_STR = 'Use 1 to 50 characters.';            // What: Label Limits String. Why: A label outside its limits is refused before it's sent. How: The alert shows this.

// #endregion Constants



// #region Components

type IecProTyp = { asgMemObj : MemRecTyp | undefined, ideStr : string, iteRecObj : IteRecTyp, memRecMap : Map< string, MemRecTyp >, onCanFun : () => void, onSavFun : ( labTexStr : string, asgUidStr : string | null ) => void, uidValStr : string }; // What: Item Edit Component Props Type. Why: The form edits one item, offers the group's members, and hands its result back. How: This types IteEdiCom's props.

// #region IteEdiCom

/**
 * IteEdiCom = Item Edit Component
 *
 * @summary
 * Renders the form that takes an item's row while it's edited: its label in
 * a box, which takes focus, and who's bringing it, "Open", "You", or any
 * other member by name, a member who has left kept as "A removed member".
 * Save hands the typed label and the chosen UID, or null for open, to
 * onSavFun, and Cancel or Escape calls onCanFun, Escape kept from closing
 * the sheet around it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.asgMemObj - Assigned Member Object: The item's claimer, or
 *                          undefined when it's open or they've left.
 * @param props.ideStr    - Identifier String: A prefix that keeps the
 *                          form's IDs unique on the page.
 * @param props.iteRecObj - Item Record Object: The item being edited.
 * @param props.memRecMap - Member Record Map: The group's members, by UID.
 * @param props.onCanFun  - On Cancel Function: Called to leave the form.
 * @param props.onSavFun  - On Save Function: Called with the label and UID.
 * @param props.uidValStr - UID Value String: This member's UID.
 *
 * @returns The form.
 *
 * @example
 * ```tsx
 * IteEdiCom({ asgMemObj, ideStr, iteRecObj, ... }) // => <IteEdiCom />
 * ```
 *
*/

function IteEdiCom ( { asgMemObj, ideStr, iteRecObj, memRecMap, onCanFun, onSavFun, uidValStr } : IecProTyp ) : React.JSX.Element {


	const labInpRef = useRef< HTMLInputElement >( null ); // What: Label Input Reference. Why: The box takes focus as the form opens. How: This holds it.

	const [ asgValStr, setAsgValStr ] = useState( iteRecObj.asgUidStr ?? '' ); // What: Assigned Value String And Setter. Why: The choice shows who's bringing it. How: This holds the chosen UID, empty for open.
	const [ labTexStr, setLabTexStr ] = useState( iteRecObj.labTexStr );       // What: Label Text String And Setter. Why: The box shows what's typed. How: This holds the label, starting from the item's.


	const othMemArr = [ ...memRecMap.values() ].filter( ( memRecObj ) => memRecObj.uidValStr !== uidValStr ).sort( ( memOneObj, memTwoObj ) => memOneObj.namTexStr.localeCompare( memTwoObj.namTexStr ) ); // What: Other Member Array. Why: The choice lists everyone else by name, after "You". How: This leaves this member out and sorts the rest.
	const remMemBoo = iteRecObj.asgUidStr !== null && iteRecObj.asgUidStr !== uidValStr && !asgMemObj;                                                                                                     // What: Removed Member Boolean. Why: A claim by someone who left keeps its choice. How: This is true when the claimer isn't a member.



	useEffect( () => labInpRef.current?.focus(), [] ); // What: Box Focus Effect. Why: Choosing to edit puts the member in the box. How: This focuses it once the form shows. // What: Effect Dependency Note. Why: Focus moves once, as the form opens. How: The empty list runs it once.



	return (


		<form
			className={ cssModObj.iteEdiFor }

			noValidate

			onKeyDown={ ( keyEveObj ) => { if ( keyEveObj.key === 'Escape' ) { keyEveObj.preventDefault(); keyEveObj.stopPropagation(); onCanFun(); } } } // What: Escape Handler. Why: Escape leaves the form without closing the sheet around it. How: This stops the key reaching the sheet and cancels the edit.
			onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); onSavFun( labTexStr, asgValStr === '' ? null : asgValStr ); } }                     // What: Submit Handler. Why: Saving hands the edit back. How: This cancels the browser's submit and passes the label and the chosen UID, null for open.
		>{ /* What: Item Edit Form Element. Why: An item's label and who's bringing it are changed in place. How: This holds the two fields and the two buttons, across the whole row. */ }


			<label
				className={ cssModObj.ediLabLab }
				htmlFor={ `${ ideStr }Lab` }
			>Item</label>{ /* What: Edit Label Label Element. Why: The box needs a visible name. How: This labels it. */ }

			<input
				ref={ labInpRef }
				id={ `${ ideStr }Lab` }

				className={ cssModObj.ediLabInp }

				autoComplete='off'
				maxLength={ 50 }
				type='text'
				value={ labTexStr }

				onChange={ ( chaEveObj ) => setLabTexStr( chaEveObj.target.value ) }
			/>{ /* What: Edit Label Input Element. Why: The item's label is changed here. How: This holds it, at most 50 characters. */ }

			<label
				className={ cssModObj.ediWhoLab }
				htmlFor={ `${ ideStr }Who` }
			>Who's bringing it</label>{ /* What: Edit Who Label Element. Why: The choice needs a visible name. How: This labels it. */ }



			<select
				id={ `${ ideStr }Who` }

				className={ cssModObj.ediWhoSel }

				value={ asgValStr }

				onChange={ ( chaEveObj ) => setAsgValStr( chaEveObj.target.value ) }
			>{ /* What: Edit Who Select Element. Why: Any member reassigns an item or opens it. How: This offers "Open", "You", and each other member. */ }


				<option value=''>Open</option>{ /* What: Open Option Element. Why: An item can be left for anyone. How: This chooses no one. */ }

				<option value={ uidValStr }>You</option>{ /* What: You Option Element. Why: The member can take the item. How: This chooses them. */ }

				{ remMemBoo && <option value={ iteRecObj.asgUidStr ?? '' }>A removed member</option> }{ /* What: Removed Option Check. Why: A claim by someone who left keeps its choice. How: This offers it while they hold the item. */ }

				{ othMemArr.map( ( memRecObj ) => ( // What: Member Option Map. Why: Anyone in the group can be given the item. How: This offers each other member by name.


					<option
						key={ memRecObj.uidValStr }

						value={ memRecObj.uidValStr }
					>{ memRecObj.namTexStr }</option> // What: Member Option Element. Why: Each other member can be chosen. How: This names them.


				) ) }


			</select>



			<ButBasCom
				className={ cssModObj.ediSavBut }

				type='submit'
			>Save</ButBasCom>{ /* What: Edit Save Button Component. Why: The change is saved on purpose. How: This submits the form. */ }

			<button
				className={ cssModObj.ediCanBut }

				type='button'

				onClick={ onCanFun }
			>Cancel</button>{ /* What: Edit Cancel Button Element. Why: A member can leave without changing anything. How: This cancels the edit. */ }


		</form>


	);


}

// #endregion IteEdiCom



type EdcProTyp = { eveRecObj : EveRecTyp, groIdeStr : string, memRecMap : Map< string, MemRecTyp >, uidValStr : string, varStr : 'pan' | 'she' }; // What: Event Details Component Props Type. Why: The details show one event of one group, naming members and marking the member's own claims, in the sheet or the panel. How: This types EveDetCom's props.

// #region EveDetCom

/**
 * EveDetCom = Event Details Component
 *
 * @summary
 * Renders an event's details and its bring-list, watching the list while
 * shown. Claiming, letting go, and removing act on one item, adding takes
 * what's typed, and one change runs at a time. Choosing an item's label turns
 * its row into a form for its label and who's bringing it, and once the form
 * saves or cancels, focus returns to the label. A change that lands is
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

	const focIdeRef = useRef( '' );                                     // What: Focus Identifier Reference. Why: Leaving an item's edit returns focus to its label. How: This holds the item's ID until its label shows again.
	const labButRef = useRef( new Map< string, HTMLButtonElement >() ); // What: Label Button Reference. Why: Focus returns to an item's label by its ID. How: This holds each label button by item.

	const [ actReqBoo, setActReqBoo ] = useState( false );                      // What: Action Request Boolean And Setter. Why: One change at a time keeps a double tap from acting twice. How: This is true while one is out.
	const [ addTexStr, setAddTexStr ] = useState( '' );                         // What: Add Text String And Setter. Why: The box shows what's typed. How: This holds it.
	const [ ediIdeStr, setEdiIdeStr ] = useState( '' );                         // What: Edit Identifier String And Setter. Why: One item's row turns into its edit form. How: This holds that item's ID, empty when none is edited.
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



	useEffect( () => { // What: Label Focus Effect. Why: Leaving an item's edit puts focus back on its label, which only exists once the row redraws. How: This focuses the owed label after the edit closes.


		if ( ediIdeStr !== '' || focIdeRef.current === '' ) return; // What: Nothing Owed Guard. Why: Focus moves only once an edit has closed and owes it. How: This returns otherwise.



		labButRef.current.get( focIdeRef.current )?.focus(); // What: Label Focus Call. Why: The member is put back where they started. How: This focuses the item's label.

		focIdeRef.current = ''; // What: Owed Clear. Why: Focus moves once. How: This forgets the item.


	}, [ ediIdeStr ] ); // What: Effect Dependency Array. Why: Focus moves when an edit closes. How: ediIdeStr changes as one opens and closes.



	// #region ediSavFun

	/**
	 * ediSavFun = Edit Save Function
	 *
	 * @summary
	 * Saves an item's edit as one change: relabels it when the tidied label
	 * differs, then reassigns it when the chosen member differs, and announces
	 * the save. Once it lands, the edit closes and focus returns to the
	 * item's label; a failure keeps the form open with the alert saying why.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param iteRecObj - Item Record Object: The item edited.
	 * @param labTexStr - Label Text String: The label, as typed.
	 * @param asgUidStr - Assigned UID String: The chosen member, or null.
	 *
	 * @returns A promise that settles once the save is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * ediSavFun(iteRecObj, 'Pie', null) // => Promise<void>
	 * ```
	 *
	*/

	const ediSavFun = async ( iteRecObj : IteRecTyp, labTexStr : string, asgUidStr : string | null ) : Promise< void > => { // What: Edit Save Function. Why: An item's label and claimer change together from its form. How: This saves what changed and closes the form.


		const labNorStr = texNorFun( labTexStr ); // What: Label Normalized String. Why: The label is compared and announced as it'll be saved. How: This tidies it.


		const lanValBoo = await actRunFun( async () => { // What: Landed Value Boolean. Why: The form closes only once the save lands. How: This runs the save as one change.


			if ( labNorStr !== iteRecObj.labTexStr ) await iteRenFun( groIdeStr, eveRecObj.eveIdeStr, iteRecObj.iteIdeStr, labTexStr ); // What: Rename Call. Why: A changed label is saved. How: This relabels the item.

			if ( asgUidStr !== iteRecObj.asgUidStr ) await iteAsgFun( groIdeStr, eveRecObj.eveIdeStr, iteRecObj.iteIdeStr, asgUidStr ); // What: Assign Call. Why: A changed claimer is saved. How: This reassigns the item, or opens it.


		}, `Saved ${ labNorStr === '' ? 'the item' : labNorStr }.` );



		if ( !lanValBoo ) return; // What: Failed Guard. Why: A failed save keeps the form to fix. How: This returns.



		focIdeRef.current = iteRecObj.iteIdeStr; // What: Focus Owed Set. Why: The label takes focus once the row redraws. How: This owes it to the item.

		setEdiIdeStr( '' ); // What: Edit Close Call. Why: The saved row shows again. How: This closes the form.


	};

	// #endregion ediSavFun



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


								{ ediIdeStr === iteRecObj.iteIdeStr ? ( // What: Edit Check. Why: The item being edited shows its form in place of its row. How: This shows the form, or else the label, who, and actions.


									<IteEdiCom
										asgMemObj={ asgMemObj }
										ideStr={ `iteEdi${ varStr }${ iteRecObj.iteIdeStr }` }
										iteRecObj={ iteRecObj }
										memRecMap={ memRecMap }
										uidValStr={ uidValStr }

										onCanFun={ () => { focIdeRef.current = iteRecObj.iteIdeStr; setErrMesStr( '' ); setEdiIdeStr( '' ); } } // What: Cancel Handler. Why: Leaving the form puts focus back on the item's label and drops any failure it caused. How: This owes the label focus, clears the alert, and closes the form.
										onSavFun={ ( labTexStr, asgUidStr ) => void ediSavFun( iteRecObj, labTexStr, asgUidStr ) }
									/> // What: Item Edit Component. Why: The item's label and claimer are changed in place. How: This shows its form.


								) : ( // What: Row Branch. Why: An item not being edited shows its label, who's bringing it, and its actions. How: This shows them.


									<>{ /* What: Row Fragment. Why: The label, who, and actions fill the row's areas as its own children. How: This groups them without adding an element. */ }


										<button
											ref={ ( butCurEle ) => { if ( butCurEle ) labButRef.current.set( iteRecObj.iteIdeStr, butCurEle ); else labButRef.current.delete( iteRecObj.iteIdeStr ); } } // What: Label Reference Callback. Why: Focus returns to this label after its edit. How: This keeps the button by item while it shows.

											className={ cssModObj.iteLabBut }

											type='button'

											onClick={ () => { setErrMesStr( '' ); setEdiIdeStr( iteRecObj.iteIdeStr ); } } // What: Label Click Handler. Why: Choosing an item's label edits it, with no failure left from before. How: This clears the alert and opens the item's form.
										>{ labShoStr }<span className={ cssModObj.iteHidSpa }> (change)</span></button>{ /* What: Item Label Button Element. Why: The label says what to bring and opens its edit, and a screen reader hears that it changes the item. How: This shows the label and edits the item. */ }


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


									</>


								) }


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


