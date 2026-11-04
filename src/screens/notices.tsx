


// #region Imports

import cssModObj from './notices.module.css'; // What: CSS Module Object. Why: The sheet's list is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: "Got it" is the sheet's main action. How: This draws it.
import { memLisFun } from '../state/members.ts';    // What: Member List Function. Why: A notice about an offer names the other member. How: This reads the group's members and their names.
import { mesTimFun } from '../utils/date.ts';       // What: Message Time Function. Why: Each notice says when it happened. How: This labels the time as briefly as it can.
import { notDisFun } from '../state/notices.ts';    // What: Notice Dismiss Function. Why: A notice that's been seen is gone. How: This deletes it.
import { notWatFun } from '../state/notices.ts';    // What: Notice Watch Function. Why: The sheet shows notices waiting at launch and any arriving later. How: This watches them.
import { SheDiaCom } from '../ui/sheet.tsx';        // What: Sheet Dialog Component. Why: The notices open over whatever screen shows. How: This draws the sheet.
import { useEffect } from 'react';                  // What: Use Effect. Why: The notices are watched, their members named, and the sheet opened as they arrive. How: This runs each after rendering.
import { useRef    } from 'react';                  // What: Use Reference. Why: The sheet opens and closes through its handle. How: This holds it.
import { useState  } from 'react';                  // What: Use State. Why: The notices, their members' names, and the ones dismissed change what shows. How: This holds each.


import type { NotRecTyp } from '../state/notices.ts'; // What: Notice Record Type. Why: The sheet reads each notice's fields. How: This types them.
import type { SheHanTyp } from '../ui/sheet.tsx';     // What: Sheet Handle Type. Why: The sheet is opened and closed from here. How: This types its handle.

// #endregion Imports



/**
 * notices.tsx = Notices Sheet
 *
 * @summary
 * The sheet titled "While you were away" (ARCHITECTURE.md Section 11.1),
 * which opens by itself over whatever screen shows when this identity has
 * notices waiting, such as a removal, a deleted group, or an answered offer,
 * and stays live, a notice arriving while it's open joining the list. Each
 * notice reads as a sentence naming its group, and the other member where the
 * group's members can still be read, with when it happened. "Got it", or
 * closing the sheet any other way, dismisses every notice shown, and focus
 * moves to the screen's main area. A notice of a kind the app doesn't know is
 * left alone.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

// #region NOT_MES_OBJ

/**
 * NOT_MES_OBJ = Notice Message Object
 *
 * @summary
 * The message each kind of notice shows, keyed by the kind the functions
 * store. Every row is a function taking the group's name and the other
 * member's name, which is empty when the notice names no one or the name
 * can't be read, and returning the sentence.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const NOT_MES_OBJ : Record< string, ( groNamStr : string, othNamStr : string ) => string > = { // What: Notice Message Object. Why: Each kind of notice says what happened in its own words. How: This maps each kind to its sentence.


	groupDeleted     : ( groNamStr ) => `The owner deleted ${ groNamStr }.`,
	offerAccepted    : ( groNamStr, othNamStr ) => othNamStr === '' ? `Your offer was accepted, so ${ groNamStr } has a new owner.` : `${ othNamStr } accepted your offer and now owns ${ groNamStr }.`,
	offerDeclined    : ( groNamStr, othNamStr ) => othNamStr === '' ? `Your offer of ${ groNamStr } was declined.` : `${ othNamStr } declined your offer of ${ groNamStr }.`,
	offerLapsed      : ( groNamStr, othNamStr ) => othNamStr === '' ? `Your offer of ${ groNamStr } ran out after 7 days.` : `Your offer of ${ groNamStr } to ${ othNamStr } ran out after 7 days.`,
	offerLeft        : ( groNamStr, othNamStr ) => othNamStr === '' ? `The member you offered ${ groNamStr } to left it, so the offer ended.` : `${ othNamStr } left ${ groNamStr }, so your offer to them ended.`,
	ownershipClaimed : ( groNamStr, othNamStr ) => othNamStr === '' ? `A member took over ${ groNamStr } while you were away.` : `${ othNamStr } took over ${ groNamStr } while you were away.`,
	ownershipPassed  : ( groNamStr ) => `The owner of ${ groNamStr } deleted their data, so the group is yours now.`,
	removed          : ( groNamStr ) => `You were removed from ${ groNamStr }.`


};

// #endregion NOT_MES_OBJ

// #endregion Constants



// #region Helpers

const disKeyFun = ( notRecObj : NotRecTyp ) : string => `${ notRecObj.notIdeStr }@${ notRecObj.creTimNum }`; // What: Dismiss Key Function. Why: A later notice of the same kind about the same group reuses the ID, and mustn't count as already dismissed. How: This keys a notice by its ID and its time.

// #endregion Helpers



// #region Components

type NscProTyp = { watVerNum : number }; // What: Notice Sheet Component Props Type. Why: The sheet's watch restarts when the identity may have just been made. How: This types NotSheCom's props.

// #region NotSheCom

/**
 * NotSheCom = Notice Sheet Component
 *
 * @summary
 * Watches this identity's notices and opens the sheet titled "While you were
 * away" once any of a known kind is waiting, listing each one's message and
 * time, newest first, with a "Got it" button that closes it. The sheet
 * shows the list live while it's open. For notices naming another member,
 * the group's members are read once per group, best effort, so a notice
 * about a group the identity can no longer read names no one. However the
 * sheet closes, every notice it showed is dismissed and hidden at once, and
 * focus moves to the main area, since the sheet opened by itself. Changing
 * watVerNum restarts the watch, for an identity made after it started.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.watVerNum - Watch Version Number: The watch's run, which
 *                          restarts it when it changes.
 *
 * @returns The sheet, closed until notices arrive.
 *
 * @example
 * ```tsx
 * NotSheCom({ watVerNum }) // => <NotSheCom />
 * ```
 *
*/

function NotSheCom ( { watVerNum } : NscProTyp ) : React.JSX.Element {


	const reqGroRef = useRef( new Set< string >() ); // What: Requested Groups Reference. Why: A group's members are read once, however many reports name it. How: This holds the IDs of the groups asked for.
	const sheHanRef = useRef< SheHanTyp >( null );   // What: Sheet Handle Reference. Why: The sheet opens when notices arrive and closes from "Got it". How: This holds its handle.

	const [ disKeyArr, setDisKeyArr ] = useState< string[] >( [] );                 // What: Dismissed Key Array And Setter. Why: A dismissed notice should go at once, before its deletion reaches the watch. How: This holds the dismissed notices' keys.
	const [ namMapObj, setNamMapObj ] = useState< Record< string, string > >( {} ); // What: Name Map Object And Setter. Why: A notice names the other member once their group's names are read. How: This maps each group and UID pair to a name, missing a member who can't be named.
	const [ notRecArr, setNotRecArr ] = useState< NotRecTyp[] >( [] );              // What: Notice Record Array And Setter. Why: The sheet shows what the watch reports. How: This holds the latest report.
	const [ opeSheBoo, setOpeSheBoo ] = useState( false );                          // What: Open Sheet Boolean And Setter. Why: The sheet opens once for notices that arrive while it's closed. How: This is true while it's open.

	const visRecArr = notRecArr.filter( ( notRecObj ) => notRecObj.kinValStr in NOT_MES_OBJ && !disKeyArr.includes( disKeyFun( notRecObj ) ) ); // What: Visible Record Array. Why: Only notices the app can word, and not yet dismissed, show. How: This filters the report.



	useEffect( () => { // What: Notice Watch Effect. Why: The notices are watched while the app runs, from the latest run. How: This starts the watch and stops it on cleanup.


		let actValBoo = true;     // What: Active Value Boolean. Why: A report or a stop arriving after cleanup mustn't act. How: This is true until the cleanup runs.
		let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once it has started. How: This holds it, doing nothing until then.


		notWatFun( ( repRecArr ) => { if ( actValBoo ) setNotRecArr( repRecArr ); } ).then( ( stoFunVal ) => { // What: Watch Start Call. Why: Each report updates the sheet. How: This keeps each report while the run is active, and keeps the stop.


			if ( actValBoo ) stoWatFun = stoFunVal; // What: Stop Keep Call. Why: The cleanup stops the watch. How: This keeps the stop.

			else stoFunVal(); // What: Late Stop Call. Why: The run ended before the watch started. How: This stops it at once.


		}, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Watch Failure Handler. Why: A watch that can't start, such as a build without its Firebase config, leaves the sheet closed, but the failure stays visible to someone debugging. How: This logs it.



		return () => { // What: Watch Cleanup. Why: A watch shouldn't outlive the run or the app. How: This marks the run inactive and stops the watch.


			actValBoo = false; // What: Inactive Set. Why: Late reports and stops mustn't act. How: This marks the run done.

			stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


		};


	}, [ watVerNum ] ); // What: Effect Dependency Array. Why: A new run restarts the watch. How: watVerNum changes when the identity may have just been made.



	useEffect( () => { // What: Member Name Effect. Why: A notice about an offer reads better naming the member. How: This reads each new group's members once and maps their names.


		const groIdeArr = [ ...new Set( notRecArr.filter( ( notRecObj ) => notRecObj.othUidStr !== '' ).map( ( notRecObj ) => notRecObj.groIdeStr ) ) ].filter( ( groIdeStr ) => !reqGroRef.current.has( groIdeStr ) ); // What: Group Identifier Array. Why: Only groups whose notices name someone, not asked for yet, need their members. How: This lists them once each.


		for ( const groIdeStr of groIdeArr ) { // What: Group Loop. Why: Each group's members are read on their own. How: This marks each group asked for and reads its members, adding their names.


			reqGroRef.current.add( groIdeStr ); // What: Requested Add Call. Why: A later report shouldn't ask again. How: This marks the group asked for.

			memLisFun( groIdeStr ).then( ( memRecArr ) => setNamMapObj( ( preMapObj ) => ( { ...preMapObj, ...Object.fromEntries( memRecArr.map( ( memRecObj ) : [ string, string ] => [ `${ groIdeStr }/${ memRecObj.uidValStr }`, memRecObj.namTexStr ] ) ) } ) ), ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Member Read Call. Why: The members' names are encrypted with the group's key, and a group the identity can no longer read, such as one it was removed from, names no one, which the messages expect. How: This reads and decrypts them and adds each name to the map, logging a failure.


		}


	}, [ notRecArr ] ); // What: Effect Dependency Array. Why: A new notice may name a member of a group not read yet. How: notRecArr changes with each report.



	useEffect( () => { // What: Sheet Open Effect. Why: Notices waiting, or arriving while the sheet is closed, should be seen at once. How: This opens the sheet once any shows.


		if ( visRecArr.length === 0 || opeSheBoo ) return; // What: Nothing New Guard. Why: An open sheet already shows the list, and an empty one has nothing to say. How: This returns.



		setOpeSheBoo( true ); // What: Open Set Call. Why: The sheet opens once. How: This marks it open.

		sheHanRef.current?.opeFun(); // What: Open Call. Why: The notices should show over the screen. How: This opens the sheet.


	}, [ opeSheBoo, visRecArr.length ] ); // What: Effect Dependency Array. Why: The sheet opens when notices show while it's closed. How: visRecArr.length changes as notices arrive, and opeSheBoo when the sheet closes.



	// #region cloNotFun

	/**
	 * cloNotFun = Close Notices Function
	 *
	 * @summary
	 * Runs once the sheet has closed, however it closed: hides every notice
	 * it showed at once, marks the sheet closed so a later notice opens it
	 * again, deletes each notice shown, logging a failure, and focuses the
	 * screen's main area, since the sheet opened by itself and focus has
	 * nowhere to return.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns This function does not return anything.
	 *
	 * @example
	 * ```ts
	 * cloNotFun() // => void
	 * ```
	 *
	*/

	const cloNotFun = () : void => { // What: Close Notices Function. Why: Closing the sheet any way means its notices were seen, and the sheet opened by itself, so focus has nowhere to return. How: This hides and dismisses each notice shown, marks the sheet closed, and focuses the main area.


		setDisKeyArr( ( preKeyArr ) => [ ...preKeyArr, ...visRecArr.map( disKeyFun ) ] ); // What: Hide Call. Why: The notices go at once, before their deletion reaches the watch. How: This adds their keys to the dismissed ones.

		setOpeSheBoo( false ); // What: Closed Set Call. Why: A later notice should open the sheet again. How: This marks it closed.


		for ( const notRecObj of visRecArr ) notDisFun( notRecObj.notIdeStr ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Dismiss Loop. Why: A seen notice shouldn't show on the next launch. How: This deletes each one, logging a failure.



		document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The screen's content is where someone carries on. How: This focuses the main area, the skip link's target, which takes focus without joining the Tab order.


	};

	// #endregion cloNotFun



	return (


		<SheDiaCom
			ref={ sheHanRef }

			ideStr='notSheHea'
			titStr='While you were away'

			onCloFun={ cloNotFun }
		>{ /* What: Notice Sheet Dialog Component. Why: What happened while someone was away opens over the screen. How: This holds the list and "Got it". */ }


			<ul className={ cssModObj.notLisUno }>{ /* What: Notice List Unordered Element. Why: The notices read as one list. How: This stacks them, newest first. */ }


				{ visRecArr.map( ( notRecObj ) => ( // What: Notice Map. Why: Each notice is one entry. How: This renders an item for each.


					<li
						key={ notRecObj.notIdeStr }

						className={ cssModObj.notRowIte }
					>{ /* What: Notice Row Item Element. Why: A notice's message and time belong together. How: This holds both. */ }


						<p className={ cssModObj.notMesPar }>{ NOT_MES_OBJ[ notRecObj.kinValStr ]( notRecObj.groNamStr, namMapObj[ `${ notRecObj.groIdeStr }/${ notRecObj.othUidStr }` ] ?? '' ) }</p>{ /* What: Notice Message Paragraph Element. Why: The notice says what happened in a sentence. How: This shows its kind's message, naming the group and the other member when known. */ }

						<time
							className={ cssModObj.notDatTim }

							dateTime={ new Date( notRecObj.creTimNum ).toISOString() }
						>{ mesTimFun( notRecObj.creTimNum, Date.now() ) }</time>{ /* What: Notice Date Time Element. Why: Someone should know when it happened. How: This shows the time as briefly as it reads clearly, with the exact time for machines. */ }


					</li>


				) ) }


			</ul>



			<ButBasCom
				className={ cssModObj.notAckBut }

				onClick={ () => sheHanRef.current?.cloFun() }
			>Got it</ButBasCom>{ /* What: Notice Acknowledge Button Component. Why: Someone who has read the notices puts them away. How: This closes the sheet, which dismisses them. */ }


		</SheDiaCom>


	);


}

// #endregion NotSheCom

// #endregion Components



// #region Exports

export { NotSheCom }; // What: Named Export. Why: The screen host shows the sheet over every screen. How: This exports NotSheCom.

// #endregion Exports


