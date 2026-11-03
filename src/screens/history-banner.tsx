


// #region Imports

import cssModObj from './history-banner.module.css'; // What: CSS Module Object. Why: The banner is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';           // What: Button Base Component. Why: Asking is the banner's leading action. How: This draws it as the main button.
import { hisAskFun } from '../state/history.ts';        // What: History Ask Function. Why: The member asks the group for history. How: This files the request.
import { hisGetFun } from '../state/history.ts';        // What: History Get Function. Why: The sent history is collected once it arrives. How: This downloads and keeps it.
import { hisProFun } from '../state/history.ts';        // What: History Prompt Function. Why: The banner offers history only when this phone is missing it. How: This decides what to offer.
import { hisWatFun } from '../state/history.ts';        // What: History Watch Function. Why: The member's own request is followed as it's claimed. How: This watches the requests.
import { hisWitFun } from '../state/history.ts';        // What: History Withdraw Function. Why: The member may stop asking. How: This withdraws the request.
import { proKeyFun } from '../platform/dev-profile.ts'; // What: Profile Key Function. Why: Each development member keeps their own dismissal. How: This names the storage key.
import { useEffect } from 'react';                      // What: Use Effect. Why: The offer, the request, and its collection run while the chat is open. How: This runs each.
import { useRef    } from 'react';                      // What: Use Reference. Why: The banner takes focus as a pressed button goes. How: This holds it.
import { useState  } from 'react';                      // What: Use State. Why: The offer, the request, the choice, and the status change what shows. How: This holds each.


import type { HisProTyp } from '../state/history.ts'; // What: History Prompt Type. Why: The banner shows what it's offered. How: This types it.
import type { HisRecTyp } from '../state/history.ts'; // What: History Record Type. Why: The banner follows the member's own request. How: This types it.

// #endregion Imports



/**
 * history-banner.tsx = History Banner
 *
 * @summary
 * The banner atop a group's chat that offers chat history a phone is missing
 * (ARCHITECTURE.md Section 11.9). It shows only when this phone holds none of
 * the group's chat: right after joining it offers the chat from before the
 * join, with a choice of everything, the last month, or the last week where
 * the group reaches back that far, and later it offers the chat since the
 * join, as on a new phone. Not now is kept on the device. Once asked, it
 * follows the request, offering to withdraw it, and while a member is
 * sending, checks every 5 seconds for the copy, adding it to the chat when
 * it arrives and saying how many messages came. A status region stays in
 * place while the banner changes.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type RanChoTyp = 'all' | 'month' | 'week'; // What: Range Choice Type. Why: A backlog reaches back to the group's start, a month, or a week. How: This names the three.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: The month and week choices count back in days. How: This is one day in milliseconds.

/**
 * RAN_CHO_ARR = Range Choice Array
 *
 * @summary
 * The backlog's choices in the order offered, each with its label and how
 * many days before the join it reaches back, null for everything since the
 * group began.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const RAN_CHO_ARR : { dayNum : number | null, labStr : string, ranStr : RanChoTyp }[] = [ // What: Range Choice Array. Why: The member picks how far back to ask. How: This lists each choice.


	{ dayNum : null, labStr : 'Everything',     ranStr : 'all'   }, // What: Everything Row. Why: The default asks for all of it. How: This reaches back to the group's start.
	{ dayNum : 30,   labStr : 'The last month', ranStr : 'month' }, // What: Month Row. Why: A member may want less. How: This reaches back 30 days before the join.
	{ dayNum : 7,    labStr : 'The last week',  ranStr : 'week'  }  // What: Week Row. Why: Or less still. How: This reaches back 7 days before the join.


];

// #endregion Constants



// #region Components

type HbcProTyp = { className : string, groIdeStr : string, onHisFun : () => void, uidValStr : string }; // What: History Banner Component Props Type. Why: The banner is placed by the chat, belongs to one group, tells the chat when history arrives, and follows the member's own request. How: This types HisBanCom's props.

// #region HisBanCom

/**
 * HisBanCom = History Banner Component
 *
 * @summary
 * Renders the history banner in a wrapper the chat places, which always
 * holds the status region: the member's own request when there is one, with
 * its progress and Withdraw, or else the offer when this phone is missing
 * the chat and it hasn't been dismissed, with Ask the group and Not now. A
 * claimed request is collected every 5 seconds until the copy arrives, then
 * onHisFun is called and the count announced. Asking moves focus to the
 * banner as its button goes, and withdrawing or dismissing moves it to the
 * main area as the banner goes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.className - Class Name: The chat's class that places the
 *                          banner.
 * @param props.groIdeStr - Group Identifier String: The group's ID.
 * @param props.onHisFun  - On History Function: Called once sent history
 *                          has been added to the device.
 * @param props.uidValStr - UID Value String: This identity's UID, empty
 *                          until it's read.
 *
 * @returns The banner's wrapper.
 *
 * @example
 * ```tsx
 * HisBanCom({ className, groIdeStr, onHisFun, uidValStr }) // => <HisBanCom />
 * ```
 *
*/

function HisBanCom ( { className, groIdeStr, onHisFun, uidValStr } : HbcProTyp ) : React.JSX.Element {


	const banEleRef = useRef< HTMLElement >( null );                          // What: Banner Element Reference. Why: The banner takes focus as the Ask button goes. How: This holds its section.
	const hidKeyStr = proKeyFun( `come-hang-history-hidden-${ groIdeStr }` ); // What: Hidden Key String. Why: Not now is kept per group on the device. How: This names its storage key.
	const hisCalRef = useRef( onHisFun );                                     // What: History Callback Reference. Why: The chat hands a new callback each render, which mustn't restart the collection. How: This holds the latest one.

	const [ actReqBoo, setActReqBoo ] = useState( false );                             // What: Action Request Boolean And Setter. Why: One action at a time, and its button says it's working. How: This is true while one runs.
	const [ hidBanBoo, setHidBanBoo ] = useState( () => { try { return localStorage.getItem( hidKeyStr ) !== null; } catch { return false; } } ); // What: Hidden Banner Boolean And Setter. Why: A dismissed offer stays away. How: This starts from the kept dismissal, false when storage is blocked.
	const [ hisProObj, setHisProObj ] = useState< HisProTyp | null >( null );          // What: History Prompt Object And Setter. Why: The banner shows what it's offered. How: This holds the offer, null while there's none.
	const [ ownRecObj, setOwnRecObj ] = useState< HisRecTyp | null >( null );          // What: Own Record Object And Setter. Why: The member's own request shows its progress. How: This holds it, null while there's none.
	const [ ranChoStr, setRanChoStr ] = useState< RanChoTyp >( 'all' );                // What: Range Choice String And Setter. Why: The member picks how far back to ask. How: This holds the choice, everything by default.
	const [ staMesStr, setStaMesStr ] = useState( '' );                                // What: Status Message String And Setter. Why: Each change is announced, and arrival is confirmed. How: This holds the status's text.



	useEffect( () => { hisCalRef.current = onHisFun; } ); // What: Callback Keep Effect. Why: Collection calls the chat's latest callback. How: This keeps it after each render.



	useEffect( () => { // What: Offer Effect. Why: The offer depends on what this phone holds as the chat opens. How: This asks once per group.


		let actValBoo = true; // What: Active Value Boolean. Why: An answer for an old group mustn't count. How: This is true until the cleanup runs.


		void hisProFun( groIdeStr ).then( ( proValObj ) => { if ( actValBoo ) setHisProObj( proValObj ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Offer Call. Why: The banner offers what fits. How: This decides and records it, logging a failure.



		return () => { actValBoo = false; }; // What: Offer Cleanup. Why: A late answer shouldn't count. How: This marks the run done.


	}, [ groIdeStr ] ); // What: Effect Dependency Array. Why: Each group has its own offer. How: groIdeStr changes with the group.



	useEffect( () => { // What: Request Watch Effect. Why: The member's own request is followed as it's claimed. How: This watches the group's requests once the UID is known.


		if ( uidValStr === '' ) return; // What: UID Guard. Why: The member's own request is found by UID. How: This waits for it.



		return hisWatFun( groIdeStr, ( hisRecArr ) => setOwnRecObj( hisRecArr.find( ( hisRecObj ) => hisRecObj.uidReqStr === uidValStr ) ?? null ), ( errCatObj ) => console.warn( errCatObj ) ); // What: Watch Return. Why: The watch stops with the chat. How: This keeps the member's own request from each report and returns the stop.


	}, [ groIdeStr, uidValStr ] ); // What: Effect Dependency Array. Why: The watch follows the group and the member. How: Either changes with the screen.



	useEffect( () => { // What: Collect Effect. Why: Nothing tells the asker when the copy lands, so a claimed request is checked for it. How: This tries to collect at once and every 5 seconds while the request is claimed.


		if ( ownRecObj?.staValStr !== 'claimed' ) return; // What: Claimed Guard. Why: Only a claimed request can have a copy waiting. How: This returns otherwise.



		let tryRunBoo = false; // What: Try Running Boolean. Why: Two tries at once could both collect the copy. How: This is true while one is out.


		const colTryFun = () : void => { // What: Collect Try Function. Why: The copy may not be there yet. How: This tries to collect it unless a try is out, acting once it arrives.


			if ( tryRunBoo ) return; // What: Running Guard. Why: One try at a time. How: This skips a tick while one is out.



			tryRunBoo = true; // What: Running Set. Why: The next tick waits for this try. How: This marks it out.

			void hisGetFun( groIdeStr ).then( ( couNum ) => { // What: Collect Call. Why: Collecting also marks the request fulfilled, which ends this effect before the result lands, so a collected copy is acted on whatever the effect's state. How: This collects, then reports a copy that arrived.


				tryRunBoo = false; // What: Running Clear. Why: The try is done. How: This frees the next tick.



				if ( couNum === null ) return; // What: Not Yet Guard. Why: No copy has arrived. How: This returns.



				setHisProObj( null ); // What: Offer Clear Call. Why: This phone now holds history. How: This drops the offer.

				setStaMesStr( `Added ${ couNum.toLocaleString( 'en-US' ) } ${ couNum === 1 ? 'message' : 'messages' } from the group.` ); // What: Arrival Status Call. Why: The member should know history arrived and how much. How: This announces the count.

				hisCalRef.current(); // What: History Call. Why: The chat shows what arrived. How: This tells it to read the history again.


			}, ( errCatObj : unknown ) => { tryRunBoo = false; console.warn( errCatObj ); } ); // What: Failure Handler. Why: A failed try shouldn't stop the next. How: This frees the next tick and logs the failure.


		};


		colTryFun(); // What: First Try Call. Why: The copy may already be there. How: This tries at once.


		const tryIdeNum = window.setInterval( colTryFun, 5000 ); // What: Try Identifier Number. Why: The interval has to be cleared. How: This tries every 5 seconds.



		return () => window.clearInterval( tryIdeNum ); // What: Collect Cleanup. Why: Tries shouldn't outlive the claim or the chat. How: This clears the interval.


	}, [ groIdeStr, ownRecObj?.staValStr ] ); // What: Effect Dependency Array. Why: Collection runs while the request is claimed. How: The status changes as it's claimed or released, and the group with the screen.



	// #region askRunFun

	/**
	 * askRunFun = Ask Run Function
	 *
	 * @summary
	 * Files the offered request, unless an action is running: a recovery, or
	 * a backlog reaching back to the chosen start, never before the group's.
	 * Focus moves to the banner as the button goes, and the watch then shows
	 * the request; a refusal is announced.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the request is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * askRunFun() // => Promise<void>
	 * ```
	 *
	*/

	const askRunFun = async () : Promise< void > => { // What: Ask Run Function. Why: The member asks the group for what their phone is missing. How: This files the request.


		if ( actReqBoo || hisProObj === null ) return; // What: Busy Guard. Why: One action at a time, and only with an offer. How: This ignores the press otherwise.



		const dayNum = RAN_CHO_ARR.find( ( ranRecObj ) => ranRecObj.ranStr === ranChoStr )?.dayNum ?? null;                // What: Day Number. Why: The choice sets how far back to ask. How: This reads its days, null for everything.
		const ranTimNum = dayNum === null ? hisProObj.creTimNum : hisProObj.joiTimNum - dayNum * DAY_MIL_NUM;              // What: Range Time Number. Why: A backlog starts at the chosen point. How: This counts back from the join, or starts at the group's start.


		setActReqBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the action as running.



		try { await hisAskFun( groIdeStr, hisProObj.kinValStr, hisProObj.kinValStr === 'backlog' ? Math.max( ranTimNum, hisProObj.creTimNum ) : null ); } // What: Ask Try. Why: The group hears the request. How: This files it, a backlog's start never before the group's.

		catch ( errCatObj ) { // What: Ask Catch. Why: A refused request should be told. How: This logs it, frees the button, and says so.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setActReqBoo( false ); // What: Busy Clear Call. Why: The member can try again. How: This marks the action done.

			setStaMesStr( "The request couldn't be sent. Check your connection and try again." ); // What: Failure Status Call. Why: The member should know it didn't go. How: This announces it.



			return;


		}



		banEleRef.current?.focus(); // What: Focus Call. Why: The Ask button goes as the banner shows the request. How: This focuses the banner.

		setActReqBoo( false ); // What: Busy Clear Call. Why: The request is filed. How: This marks the action done.

		setStaMesStr( 'Asked the group for chat history.' ); // What: Asked Status Call. Why: The change is announced. How: This says so.


	};

	// #endregion askRunFun



	// #region witRunFun

	/**
	 * witRunFun = Withdraw Run Function
	 *
	 * @summary
	 * Withdraws the member's request, unless an action is running, then
	 * dismisses the offer for this visit so it doesn't return at once, moves
	 * focus to the main area as the banner goes, and announces it; a failure
	 * is announced instead.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the withdrawal is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * witRunFun() // => Promise<void>
	 * ```
	 *
	*/

	const witRunFun = async () : Promise< void > => { // What: Withdraw Run Function. Why: The member may stop asking. How: This withdraws the request.


		if ( actReqBoo ) return; // What: Busy Guard. Why: One action at a time. How: This ignores the press.



		setActReqBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the action as running.



		try { await hisWitFun( groIdeStr ); } // What: Withdraw Try. Why: The request goes. How: This withdraws it.

		catch ( errCatObj ) { // What: Withdraw Catch. Why: A failed withdrawal should be told. How: This logs it, frees the button, and says so.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setActReqBoo( false ); // What: Busy Clear Call. Why: The member can try again. How: This marks the action done.

			setStaMesStr( "The request couldn't be withdrawn. Check your connection and try again." ); // What: Failure Status Call. Why: The member should know it's still there. How: This announces it.



			return;


		}



		document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The banner goes with the request. How: This focuses the main area.

		setActReqBoo( false ); // What: Busy Clear Call. Why: The withdrawal is done. How: This marks the action done.

		setHidBanBoo( true ); // What: Hide Call. Why: The offer shouldn't come straight back after a withdrawal. How: This hides it for this visit.

		setStaMesStr( 'Withdrew the request for chat history.' ); // What: Withdrawn Status Call. Why: The change is announced. How: This says so.


	};

	// #endregion witRunFun


	const hidRunFun = () : void => { // What: Hide Run Function. Why: A dismissed offer shouldn't come back, and focus shouldn't fall to the page as the banner goes. How: This keeps the dismissal, focuses the main area, and hides the banner.


		try { localStorage.setItem( hidKeyStr, 'true' ); } // What: Keep Attempt. Why: Not now should hold on later visits. How: This keeps the dismissal.

		catch { /* What: Blocked Storage. Why: The dismissal still holds for this visit. How: Nothing is kept. */ }



		document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The banner goes. How: This focuses the main area.

		setHidBanBoo( true ); // What: Hide Call. Why: The offer goes at once. How: This hides the banner.


	};



	const ranOptArr = hisProObj === null ? [] : RAN_CHO_ARR.filter( ( ranRecObj ) => ranRecObj.dayNum === null || hisProObj.joiTimNum - ranRecObj.dayNum * DAY_MIL_NUM > hisProObj.creTimNum ); // What: Range Option Array. Why: A choice reaching no further than everything would mean the same. How: This keeps everything and each choice that starts after the group's start.



	return (


		<div className={ className }>{ /* What: Banner Wrapper Div Element. Why: The status stays in place while the banner comes and goes. How: This holds both where the chat places it. */ }



			{ ownRecObj !== null && ( // What: Request Block. Why: The member's own request shows its progress. How: This shows the banner for it.


				<section
					ref={ banEleRef }

					className={ cssModObj.hisBanSec }

					tabIndex={ -1 } // What: Banner Tab Index. Why: Focus moves here as the Ask button goes, but the banner isn't a control. How: This lets it take focus from a script without joining the Tab order.

					aria-label='Chat history'
				>{ /* What: History Banner Section Element. Why: The request reads as one part above the chat. How: This holds its line and its button. */ }


					<p className={ cssModObj.hisTexPar }>{ ownRecObj.staValStr === 'claimed' ? "A member is sending your chat history. It's added here as soon as it arrives." : 'You asked the group for chat history. A member whose phone holds it can send a copy.' }</p>{ /* What: History Text Paragraph Element. Why: The member should know where the request stands. How: This says whether it waits or is being sent. */ }

					<button
						className={ cssModObj.hisSecBut }

						type='button'

						onClick={ () => void witRunFun() }
					>{ actReqBoo ? 'Withdrawing…' : 'Withdraw' }</button>{ /* What: History Secondary Button Element. Why: The member may stop asking, and the label shows while it's working. How: This withdraws the request. */ }


				</section>


			) }



			{ ownRecObj === null && hisProObj !== null && !hidBanBoo && ( // What: Offer Block. Why: A phone missing the chat is offered it until the offer is dismissed. How: This shows the banner for the offer.


				<section
					ref={ banEleRef }

					className={ cssModObj.hisBanSec }

					tabIndex={ -1 } // What: Banner Tab Index. Why: Focus can be moved here, but the banner isn't a control. How: This lets it take focus from a script without joining the Tab order.

					aria-label='Chat history'
				>{ /* What: History Banner Section Element. Why: The offer reads as one part above the chat. How: This holds its line, its choices, and its buttons. */ }


					<p className={ cssModObj.hisTexPar }>{ hisProObj.kinValStr === 'backlog' ? 'Want to see the chat from before you joined? Ask the group to send it.' : "This phone has none of this group's chat. Ask the group to send the chat since you joined?" }</p>{ /* What: History Text Paragraph Element. Why: The member should know what they'd be asking for. How: This words the offer for its kind. */ }



					{ hisProObj.kinValStr === 'backlog' && ranOptArr.length > 1 && ( // What: Choices Block. Why: A member asking for older chat picks how far back. How: This shows the choices when more than everything fits.


						<fieldset className={ cssModObj.hisRanFie }>{ /* What: History Range Fieldset Element. Why: The choices answer one question. How: This groups them under its legend. */ }


							<legend className={ cssModObj.hisRanLeg }>How far back</legend>{ /* What: History Range Legend Element. Why: The choices need a shared name. How: This names them. */ }



							{ ranOptArr.map( ( ranRecObj ) => ( // What: Choice Map. Why: Each reach is one choice. How: This renders a row per choice.


								<label
									key={ ranRecObj.ranStr }

									className={ cssModObj.hisChoLab }
								>{ /* What: History Choice Label Element. Why: The whole row picks its reach, a bigger target than the circle alone. How: This holds the circle and its name. */ }


									<input
										className={ cssModObj.hisChoInp }

										name='hisRanRad'

										checked={ ranChoStr === ranRecObj.ranStr }
										type='radio'
										value={ ranRecObj.ranStr }

										onChange={ () => setRanChoStr( ranRecObj.ranStr ) }
									/>{ /* What: History Choice Input Element. Why: A circle shows the chosen reach. How: This draws it, checked for the choice. */ }

									{ ranRecObj.labStr }{ /* What: Choice Name Text. Why: The circle needs its reach's name beside it, which also names it for a screen reader. How: This prints the row's label. */ }


								</label>


							) ) }


						</fieldset>


					) }



					<div className={ cssModObj.hisActDiv }>{ /* What: History Actions Div Element. Why: Asking and dismissing sit together. How: This holds both in a row that wraps. */ }


						<ButBasCom onClick={ () => void askRunFun() }>{ actReqBoo ? 'Asking…' : 'Ask the group' }</ButBasCom>{ /* What: Button Base Component. Why: Asking is the banner's leading action, and the label shows while it's working. How: This files the request. */ }

						<button
							className={ cssModObj.hisSecBut }

							type='button'

							onClick={ hidRunFun }
						>Not now</button>{ /* What: History Secondary Button Element. Why: History is never required, so dismissing sits beside asking. How: This dismisses the offer. */ }


					</div>


				</section>


			) }



			<p
				className={ cssModObj.hisStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: History Status Paragraph Element. Why: Each change is announced and arrival confirmed, and a region added only when it speaks is often missed. How: This is in the page and empty from the first render, showing its text below the banner. */ }


		</div>


	);


}

// #endregion HisBanCom

// #endregion Components



// #region Exports

export { HisBanCom }; // What: Named Export. Why: The chat shows the banner above its log. How: This exports HisBanCom.

// #endregion Exports


