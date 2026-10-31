


// #region Imports

import cssModObj from './group-events.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Planning an event is the section's leading action. How: This draws its button.
import { eveBloFun } from '../utils/date.ts';       // What: Event Block Function. Why: Each card leads with when its event is. How: This gives its date block's lines.
import { eveDelFun } from '../state/events.ts';     // What: Event Delete Function. Why: The creator or owner cancels an event. How: This deletes it and its items.
import { EveDetCom } from './event-details.tsx';    // What: Event Details Component. Why: An event's sheet shows its details and bring-list. How: This draws them.
import { EveForCom } from './event-form.tsx';       // What: Event Form Component. Why: Events are planned and changed through a form. How: This draws it.
import { eveLisFun } from '../state/events.ts';     // What: Event List Function. Why: The section lists the group's events. How: This reads them, soonest first.
import { eveRanFun } from '../utils/date.ts';       // What: Event Range Function. Why: Each card says the hours its event runs. How: This formats its range.
import { ideEnsFun } from '../state/identity.ts';   // What: Identity Ensure Function. Why: An event's creator can change it. How: This reads the member's UID.
import { memLisFun } from '../state/members.ts';    // What: Member List Function. Why: The bring-list names who's bringing each item. How: This lists the members.
import { SheDiaCom } from '../ui/sheet.tsx';        // What: Sheet Dialog Component. Why: An event's details and the form open over the list. How: This draws each sheet.
import { useEffect } from 'react';                  // What: Use Effect. Why: The section loads its parts when it opens. How: This starts the work.
import { useRef    } from 'react';                  // What: Use Reference. Why: The sheets open through their handles, and the heading takes focus after a cancel. How: This holds each.
import { useState  } from 'react';                  // What: Use State. Why: The events, the open event, and the messages change while the section is open. How: This holds each.


import type { EveRecTyp } from '../state/events.ts';  // What: Event Record Type. Why: The section lists and opens events. How: This types each.
import type { MemRecTyp } from '../state/members.ts'; // What: Member Record Type. Why: The bring-list looks members up. How: This types each.
import type { SheHanTyp } from '../ui/sheet.tsx';     // What: Sheet Handle Type. Why: The section opens and closes its sheets. How: This types their handles.

// #endregion Imports



/**
 * group-events.tsx = Group Events
 *
 * @summary
 * The open group's Events section: a button to plan an event and a card for
 * each event that hasn't ended, soonest first. A card opens a sheet with the
 * event's details and bring-list, where its creator or the group's owner can
 * change it, in a form sheet over it, or cancel it after confirming. Each
 * plan, change, and cancel is announced, and the list reads the events again.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type GecProTyp = { groIdeStr : string, ownBoo : boolean }; // What: Group Events Component Props Type. Why: The section belongs to one group, whose owner can change any event. How: This types GroEveCom's props.

// #region GroEveCom

/**
 * GroEveCom = Group Events Component
 *
 * @summary
 * Renders the open group's Events section. It lists the events that haven't
 * ended, soonest first, saying when the list is loading, empty, or can't
 * load. A card opens the event's sheet, whose Change button, shown to the
 * event's creator and the group's owner, opens the form over it, and whose
 * Cancel event button asks to confirm, then cancels the event, closes the
 * sheet, and moves focus to the section's heading, since the card that
 * opened the sheet is gone. Plan an event opens the empty form. A save or a
 * cancel is announced through a status region and the list reads the events
 * again, and a failed cancel through an alert in the sheet. Key it by the
 * group, so another group starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groIdeStr - Group Identifier String: The open group's ID.
 * @param props.ownBoo    - Owner Boolean: Whether this member owns the
 *                          group.
 *
 * @returns The section.
 *
 * @example
 * ```tsx
 * GroEveCom({ groIdeStr, ownBoo }) // => <GroEveCom />
 * ```
 *
*/

function GroEveCom ( { groIdeStr, ownBoo } : GecProTyp ) : React.JSX.Element {


	const detHanRef = useRef< SheHanTyp >( null );          // What: Details Handle Reference. Why: A card opens its event's sheet, and a cancel closes it. How: This holds that sheet's handle.
	const focHeaRef = useRef( false );                      // What: Focus Heading Reference. Why: After a cancel, focus lands on the heading once the sheet has gone. How: This is true while that's owed.
	const forHanRef = useRef< SheHanTyp >( null );          // What: Form Handle Reference. Why: Planning or changing opens the form's sheet, and a save closes it. How: This holds that sheet's handle.
	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: The heading takes focus after a cancel. How: This holds it.

	const [ canConBoo, setCanConBoo ] = useState( false );                                    // What: Cancel Confirm Boolean And Setter. Why: Cancelling asks to confirm first. How: This is true while the confirmation shows.
	const [ canErrStr, setCanErrStr ] = useState( '' );                                       // What: Cancel Error String And Setter. Why: A failed cancel is announced in the sheet. How: This holds the message, empty when there's none.
	const [ eveRecArr, setEveRecArr ] = useState< EveRecTyp[] | null >( null );               // What: Event Record Array And Setter. Why: The section lists the events. How: This holds those that haven't ended, null until read.
	const [ forEveObj, setForEveObj ] = useState< EveRecTyp | null >( null );                 // What: Form Event Object And Setter. Why: The form plans a new event or changes this one. How: This holds the event being changed, null for a new one.
	const [ forKeyNum, setForKeyNum ] = useState( 0 );                                        // What: Form Key Number And Setter. Why: Each opening of the form starts afresh. How: This counts the openings, keying the form.
	const [ lisErrBoo, setLisErrBoo ] = useState( false );                                    // What: List Error Boolean And Setter. Why: A list that can't load says so. How: This is true once a read fails.
	const [ lisVerNum, setLisVerNum ] = useState( 0 );                                        // What: List Version Number And Setter. Why: A save or cancel reads the events again. How: This counts the reads asked for.
	const [ memRecMap, setMemRecMap ] = useState( new Map< string, MemRecTyp >() );           // What: Member Record Map And Setter. Why: The bring-list names each claim's member. How: This holds the members by UID.
	const [ selIdeStr, setSelIdeStr ] = useState( '' );                                       // What: Selected Identifier String And Setter. Why: The sheet shows the event a card opened, read fresh from the list. How: This holds its ID, empty when none is open.
	const [ staMesStr, setStaMesStr ] = useState( '' );                                       // What: Status Message String And Setter. Why: A plan, change, or cancel is announced. How: This holds the status's text.
	const [ uidValStr, setUidValStr ] = useState( '' );                                       // What: UID Value String And Setter. Why: An event's creator can change it, and the bring-list marks the member's own claims. How: This holds the UID, empty until read.


	const selEveObj = eveRecArr?.find( ( eveRecObj ) => eveRecObj.eveIdeStr === selIdeStr ) ?? null; // What: Selected Event Object. Why: The sheet shows the open event as the list last read it. How: This finds it, null when none is open or it's gone.
	const ediAllBoo = selEveObj !== null && ( ownBoo || selEveObj.creUidStr === uidValStr );         // What: Edit Allowed Boolean. Why: Only the creator or the owner changes or cancels an event. How: This is true for them.



	useEffect( () => { // What: People Load Effect. Why: The bring-list needs the member's UID and the group's members. How: This reads both once the section opens.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the section closed mustn't change it. How: This is true until the cleanup runs.


		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: The creator's controls and own claims depend on it. How: This reads the UID.

		void memLisFun( groIdeStr ).then( ( memRecArr ) => { if ( actValBoo ) setMemRecMap( new Map( memRecArr.map( ( memRecObj ) => [ memRecObj.uidValStr, memRecObj ] ) ) ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Members Read Call. Why: Claims are shown by name and color. How: This reads the members and keeps them by UID, logging a failure.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: Reads still out shouldn't land after the section closes. How: This marks the section closed.


	}, [ groIdeStr ] ); // What: Effect Dependency Array. Why: The people belong to one group. How: groIdeStr names it.



	useEffect( () => { // What: Events Load Effect. Why: The list reads the events when it opens and after each change. How: This reads them and keeps those that haven't ended.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after another began, or after the section closed, mustn't change it. How: This is true until the cleanup runs.


		void eveLisFun( groIdeStr ).then( ( lisRecArr ) => { // What: Events Read Call. Why: The section shows what's planned. How: This lists the events, soonest first.


			if ( !actValBoo ) return; // What: Stale Guard. Why: A newer read or a closed section wins. How: This ignores the result.



			setEveRecArr( lisRecArr.filter( ( eveRecObj ) => eveRecObj.endTimNum > Date.now() ) ); // What: Events Set Call. Why: An event that has ended is no longer planned. How: This keeps those still to come or under way.

			setLisErrBoo( false ); // What: List Error Clear Call. Why: A read that worked replaces an earlier failure. How: This clears the flag.


		}, ( errCatObj : unknown ) => { // What: Read Failure Handler. Why: A list that can't load should say so. How: This logs the failure and flags it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) setLisErrBoo( true ); // What: List Error Set Call. Why: The section says the list couldn't load. How: This sets the flag while the read is current.


		} );



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A read still out shouldn't land after a newer one began. How: This marks it stale.


	}, [ groIdeStr, lisVerNum ] ); // What: Effect Dependency Array. Why: The list belongs to one group and is read again after each change. How: groIdeStr names the group, and lisVerNum counts the reads asked for.



	// #region canEveFun

	/**
	 * canEveFun = Cancel Event Function
	 *
	 * @summary
	 * Cancels the open event after its confirmation: deletes it with its
	 * items, closes the sheet, owes the heading focus once the sheet has
	 * gone, announces the cancel, and reads the events again. A failed cancel
	 * is logged and announced in the sheet, which stays open.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the cancel is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * canEveFun() // => Promise<void>
	 * ```
	 *
	*/

	const canEveFun = async () : Promise< void > => { // What: Cancel Event Function. Why: The creator or owner cancels an event. How: This deletes it and tells everyone looking.


		if ( !selEveObj ) return; // What: No Event Guard. Why: Only an open event is cancelled. How: This returns otherwise.



		setCanErrStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.



		try { // What: Cancel Try. Why: A cancelled event leaves the list for everyone. How: This deletes it and closes its sheet.


			await eveDelFun( groIdeStr, selEveObj.eveIdeStr ); // What: Delete Call. Why: The event and its items go. How: This cancels it.

			focHeaRef.current = true; // What: Focus Owed Set. Why: The card that opened the sheet is gone, so focus would fall to the page. How: This asks the sheet's close to focus the heading.

			detHanRef.current?.cloFun(); // What: Sheet Close Call. Why: The cancelled event's sheet has nothing left to show. How: This slides it down.

			setStaMesStr( `Cancelled ${ selEveObj.titTexStr }.` ); // What: Status Set Call. Why: The cancel is announced. How: This names the event.

			setLisVerNum( ( preVerNum ) => preVerNum + 1 ); // What: List Reread Call. Why: The list drops the cancelled event. How: This asks for a new read.


		}

		catch ( errCatObj ) { // What: Cancel Catch. Why: A failed cancel has to be told. How: This logs it and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setCanErrStr( "The event couldn't be cancelled. Try again." ); // What: Failure Announce Call. Why: The member has to learn it failed. How: This puts the message in the sheet's alert.


		}


	};

	// #endregion canEveFun



	return (


		<div className={ cssModObj.groEveDiv }>{ /* What: Group Events Div Element. Why: The section's bar and list read top to bottom. How: This stacks them inside the gutter. */ }


			<div className={ cssModObj.eveBarDiv }>{ /* What: Events Bar Div Element. Why: The section's heading sits beside its leading action. How: This lays them out in one row. */ }


				<h2
					ref={ heaEleRef }

					className={ cssModObj.eveTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here after a cancel, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>Events</h2>{ /* What: Events Title Heading Element. Why: The section needs a heading. How: This names it. */ }



				<ButBasCom
					className={ cssModObj.eveNewBut }

					onClick={ () => { setForEveObj( null ); setForKeyNum( ( preKeyNum ) => preKeyNum + 1 ); forHanRef.current?.opeFun(); } } // What: Plan Click Handler. Why: Planning starts from an empty form. How: This clears any event being changed, starts the form afresh, and opens its sheet.
				>Plan an event</ButBasCom>{ /* What: Events New Button Component. Why: Any member plans an event. How: This opens the form. */ }


			</div>



			{ eveRecArr === null || eveRecArr.length === 0 ? ( // What: List Empty Check. Why: An empty space would read as broken. How: This says the list is loading, couldn't load, or is empty, or else shows the cards.


				<p className={ cssModObj.eveNotPar }>{ eveRecArr !== null ? 'Nothing planned yet.' : lisErrBoo ? "The events couldn't load." : 'Loading events…' }</p> // What: Events Note Paragraph Element. Why: The list's state should be said. How: This shows the note that fits.


			) : ( // What: List Branch. Why: Events to show get their cards. How: This shows the list.


				<ul className={ cssModObj.eveLisUno }>{ /* What: Events List Unordered List Element. Why: The events read as one list. How: This stacks a card for each. */ }


					{ eveRecArr.map( ( eveRecObj ) => { // What: Event Card Map. Why: Each event gets its own card. How: This renders one per event.


						const eveBloObj = eveBloFun( eveRecObj.staTimNum, Date.now() );              // What: Event Block Object. Why: The card leads with when the event is. How: This gives the block's two lines.
						const eveRanStr = eveRanFun( eveRecObj.staTimNum, eveRecObj.endTimNum ); // What: Event Range String. Why: The line leads with the hours. How: This formats them.



						return (


							<li key={ eveRecObj.eveIdeStr }>{ /* What: Event Item Element. Why: Each event is one entry in the list. How: This holds its card. */ }


								<button
									className={ cssModObj.eveCarBut }

									type='button'

									aria-haspopup='dialog'

									onClick={ () => { setSelIdeStr( eveRecObj.eveIdeStr ); setCanConBoo( false ); setCanErrStr( '' ); detHanRef.current?.opeFun(); } } // What: Card Click Handler. Why: A card opens its event's details with no confirmation or failure left from before. How: This picks the event, resets the cancel, and opens the sheet.
								>{ /* What: Event Card Button Element. Why: Each event is a card that opens its details and bring-list. How: This lays the date block beside the title and line. */ }


									<span className={ cssModObj.carDatSpa }>{ /* What: Card Date Span Element. Why: The date is the first thing read. How: This stacks the block's small and large lines on a tint. */ }


										<span className={ cssModObj.datTopSpa }>{ eveBloObj.topStr }</span>{ /* What: Date Top Span Element. Why: The month, or "Today", tops the block. How: This shows the small line. */ }

										<span className={ cssModObj.datBotSpa }>{ eveBloObj.botStr }</span>{ /* What: Date Bottom Span Element. Why: The day, or today's start hour, is the block's large line. How: This shows it. */ }


									</span>

									<span className={ cssModObj.carTitSpa }>{ eveRecObj.titTexStr }</span>{ /* What: Card Title Span Element. Why: The event is known by its title. How: This shows it. */ }

									<span className={ cssModObj.carLinSpa }>{ eveRanStr }{ eveRecObj.locTexStr !== '' && <><span aria-hidden='true'> · </span><span className={ cssModObj.carHidSpa }>, </span>{ eveRecObj.locTexStr }</> }</span>{ /* What: Card Line Span Element. Why: The hours and place say when and where, and a screen reader should hear a comma where sight sees a dot. How: This shows the hours, then the place after a dot hidden from screen readers and a comma hidden from sight, when there is a place. */ }


								</button>


							</li>


						);


					} ) }


				</ul>


			) }



			<p
				className={ cssModObj.eveStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Events Status Paragraph Element. Why: A plan, change, or cancel is announced, since the list itself changes silently. How: This holds the status, empty from the first render. */ }



			<SheDiaCom
				ref={ detHanRef }

				ideStr='eveDetHea'
				titStr={ selEveObj?.titTexStr ?? '' }

				onCloFun={ () => { if ( focHeaRef.current ) { focHeaRef.current = false; heaEleRef.current?.focus(); } } } // What: Details Close Handler. Why: After a cancel the card that opened the sheet is gone. How: This focuses the heading when a cancel owes it.
			>{ /* What: Event Sheet Dialog Component. Why: A card opens its event's details over the list. How: This holds the creator's controls and the details, titled with the event. */ }


				{ selEveObj && ( // What: Open Event Check. Why: The sheet shows an event only once a card picked one. How: This shows its controls and details.


					<> // What: Open Event Fragment. Why: The controls, the alert, and the details show together for the open event. How: This groups them without adding an element.


						{ ediAllBoo && ( // What: Edit Controls Check. Why: Only the event's creator or the group's owner changes or cancels it. How: This shows their controls.


							<div className={ cssModObj.eveActDiv }>{ /* What: Event Actions Div Element. Why: Changing and cancelling sit together above the details. How: This lays them out in one row, or the cancel's confirmation in their place. */ }


								{ canConBoo ? ( // What: Confirm Check. Why: Cancelling removes the event and its list for everyone, so it asks first. How: This shows the confirmation, or else the two controls.


									<> // What: Confirmation Fragment. Why: The question and its two answers replace the controls together. How: This groups them without adding an element.


										<p className={ cssModObj.conAskPar }>{ `Cancel ${ selEveObj.titTexStr } for everyone?` }</p>{ /* What: Confirm Ask Paragraph Element. Why: The member should know what cancelling does. How: This asks, naming the event. */ }

										<button
											className={ cssModObj.actDanBut }

											type='button'

											onClick={ () => void canEveFun() }
										>Yes, cancel it</button>{ /* What: Action Danger Button Element. Why: Cancelling is confirmed on purpose. How: This cancels the event. */ }

										<button
											className={ cssModObj.actPlaBut }

											type='button'

											onClick={ () => setCanConBoo( false ) }
										>Keep it</button>{ /* What: Action Plain Button Element. Why: A member can change their mind. How: This hides the confirmation. */ }


									</>


								) : ( // What: Controls Branch. Why: Without a confirmation showing, the creator or owner sees both controls. How: This shows them.


									<> // What: Controls Fragment. Why: Changing and cancelling sit side by side. How: This groups them without adding an element.


										<button
											className={ cssModObj.actPlaBut }

											type='button'

											aria-haspopup='dialog'

											onClick={ () => { setForEveObj( selEveObj ); setForKeyNum( ( preKeyNum ) => preKeyNum + 1 ); forHanRef.current?.opeFun(); } } // What: Change Click Handler. Why: Changing starts from the event's own details. How: This fills the form with the event, starts it afresh, and opens its sheet over this one.
										>Change</button>{ /* What: Action Plain Button Element. Why: The creator or owner changes the event. How: This opens the form. */ }

										<button
											className={ cssModObj.actPlaBut }

											type='button'

											onClick={ () => setCanConBoo( true ) }
										>Cancel event</button>{ /* What: Action Plain Button Element. Why: The creator or owner cancels the event. How: This asks to confirm first. */ }


									</>


								) }


							</div>


						) }

						<p
							className={ cssModObj.canErrPar }

							role='alert'
						>{ canErrStr }</p>{ /* What: Cancel Error Paragraph Element. Why: A failed cancel has to be told at once. How: This holds the alert, empty unless a cancel failed. */ }



						<EveDetCom
							key={ selEveObj.eveIdeStr } // What: Details Key. Why: Another event's list has to start afresh. How: This remounts the details for each event.

							eveRecObj={ selEveObj }
							groIdeStr={ groIdeStr }
							memRecMap={ memRecMap }
							uidValStr={ uidValStr }
							varStr='she'
						/>{ /* What: Event Details Component. Why: The sheet shows the event's details and bring-list. How: This draws them. */ }


					</>


				) }


			</SheDiaCom>



			<SheDiaCom
				ref={ forHanRef }

				ideStr='eveForHea'
				titStr={ forEveObj ? 'Change event' : 'Plan an event' }
			>{ /* What: Form Sheet Dialog Component. Why: Planning or changing an event opens a form over the page. How: This holds the form, titled for what it does. */ }


				<EveForCom
					key={ forKeyNum } // What: Form Key. Why: Each opening starts with fresh fields. How: This remounts the form for each opening.

					eveRecObj={ forEveObj }
					groIdeStr={ groIdeStr }

					onSavFun={ ( titTexStr ) => { forHanRef.current?.cloFun(); setStaMesStr( forEveObj ? `Saved ${ titTexStr }.` : `Planned ${ titTexStr }.` ); setLisVerNum( ( preVerNum ) => preVerNum + 1 ); } } // What: Save Handler. Why: A saved event closes the form, is announced, and shows in the list. How: This closes the sheet, announces the plan or change, and reads the events again.
				/>{ /* What: Event Form Component. Why: The sheet's content is the form. How: This draws it for a new event or the one being changed. */ }


			</SheDiaCom>


		</div>


	);


}

// #endregion GroEveCom

// #endregion Components



// #region Exports

export { GroEveCom }; // What: Named Export. Why: The group frame shows the Events section with it. How: This exports GroEveCom.

// #endregion Exports


