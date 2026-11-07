


// #region Imports

import cssModObj from './history-requests.module.css'; // What: CSS Module Object. Why: The list is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { hisClaFun } from '../state/history.ts'; // What: History Claim Function. Why: Sending starts by taking the request, so only one member sends. How: This claims it.
import { hisCovFun } from '../state/history.ts'; // What: History Coverage Function. Why: Only a member whose phone holds the whole range is offered to send. How: This checks the device's history.
import { hisRelFun } from '../state/history.ts'; // What: History Release Function. Why: A claim stalled for 30 minutes can be freed for someone else. How: This releases it.
import { hisSenFun } from '../state/history.ts'; // What: History Send Function. Why: The helper sends the range. How: This uploads it encrypted.
import { hisWatFun } from '../state/history.ts'; // What: History Watch Function. Why: The list follows each request as it's asked, claimed, and answered. How: This watches them.
import { useEffect } from 'react';               // What: Use Effect. Why: The requests are watched, and the device's coverage checked, while the list shows. How: This runs both.
import { useRef    } from 'react';               // What: Use Reference. Why: The heading takes focus when a pressed button goes. How: This holds it.
import { useState  } from 'react';               // What: Use State. Why: The requests, the coverage, the send in progress, and the clock change what shows. How: This holds each.


import type { HisRecTyp } from '../state/history.ts'; // What: History Record Type. Why: The list shows each open request. How: This types them.
import type { MemRecTyp } from '../state/members.ts'; // What: Member Record Type. Why: Each request is shown by its asker's name. How: This types the members.

// #endregion Imports



/**
 * history-requests.tsx = History Requests
 *
 * @summary
 * The People section's list of members asking for chat history their phone
 * is missing (ARCHITECTURE.md Section 11.9), watched live, so a request
 * someone else takes changes at once. Each row names the asker and what they
 * asked for. A pending request offers Send history only to a member whose
 * phone holds the whole range, and says another member will need to send it
 * otherwise; sending claims it first, so only one member sends, and a lost
 * race is announced with thanks. A claimed request says who is sending it,
 * and once the claim has stalled for 30 minutes anyone may let someone else
 * try. The member's own request is left out, since the chat shows it.
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

const STA_MIL_NUM = 1800000; // What: Stall Milliseconds Number. Why: A claim stalled for 30 minutes may be freed by any member (Section 11.9). How: This is 30 minutes in milliseconds.

// #endregion Constants



// #region Components

type HrcProTyp = { groIdeStr : string, memRecArr : MemRecTyp[] | null, onAnnFun : ( mesValStr : string ) => void, uidValStr : string }; // What: History Requests Component Props Type. Why: The list belongs to one group, names askers from its members, announces through the section, and leaves out the member's own. How: This types HisReqCom's props.

// #region HisReqCom

/**
 * HisReqCom = History Requests Component
 *
 * @summary
 * Renders the open history requests from other members, or nothing while
 * there are none. The requests are watched while the list shows, and each
 * pending one's coverage is checked against this device's history once.
 * Send history claims the request, sends the range, and announces how many
 * messages went, or that someone else got there first, or that it failed,
 * releasing the claim; Let someone else send it frees a stalled claim. As a
 * pressed button goes, focus moves to the list's heading. The clock is read
 * again every minute, so a stalled claim's button appears on its own.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groIdeStr - Group Identifier String: The group's ID.
 * @param props.memRecArr - Member Record Array: The members, to name each
 *                          asker, or null while they load.
 * @param props.onAnnFun  - On Announce Function: Called with each message
 *                          the section announces.
 * @param props.uidValStr - UID Value String: This identity's UID, whose own
 *                          request is left out.
 *
 * @returns The list's section, or nothing.
 *
 * @example
 * ```tsx
 * HisReqCom({ groIdeStr, memRecArr, onAnnFun, uidValStr }) // => <HisReqCom />
 * ```
 *
*/

function HisReqCom ( { groIdeStr, memRecArr, onAnnFun, uidValStr } : HrcProTyp ) : React.JSX.Element | null {


	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: The heading takes focus when a pressed button goes. How: This holds it.

	const [ covMapObj, setCovMapObj ] = useState< Record< string, boolean > >( {} ); // What: Coverage Map Object And Setter. Why: Each pending request is offered only where the device holds its range. How: This holds each request's answer by its asker's UID.
	const [ hisRecArr, setHisRecArr ] = useState< HisRecTyp[] >( [] );                // What: History Record Array And Setter. Why: The list shows the open requests. How: This holds them as the watch reports.
	const [ nowTimNum, setNowTimNum ] = useState( Date.now );                         // What: Now Time Number And Setter. Why: A claim's stall is measured against the clock. How: This holds the time, read again every minute.
	const [ senUidStr, setSenUidStr ] = useState( '' );                              // What: Send UID String And Setter. Why: One send at a time, and its row says it's working. How: This holds the asker being sent to, empty when none.



	useEffect( () => hisWatFun( groIdeStr, setHisRecArr, ( errCatObj ) => console.warn( errCatObj ) ), [ groIdeStr ] ); // What: Request Watch Effect. Why: The list follows every request as it changes. How: This watches the group's requests and stops on cleanup, logging a refused watch. // What: Effect Dependency Note. Why: Another group needs its own watch. How: groIdeStr changes with the group.



	useEffect( () => { // What: Clock Effect. Why: A claim becomes free to release 30 minutes after it was made, with nothing else changing. How: This reads the clock every minute.


		const tikIdeNum = window.setInterval( () => setNowTimNum( Date.now() ), 60000 ); // What: Tick Identifier Number. Why: The interval has to be cleared. How: This reads the clock each minute.



		return () => window.clearInterval( tikIdeNum ); // What: Tick Cleanup. Why: A timer shouldn't outlive the list. How: This clears it.


	}, [] ); // What: Effect Dependency Array. Why: The clock runs once for the list's life. How: The empty list starts it once.



	useEffect( () => { // What: Coverage Effect. Why: Only a member who can fill a request is offered to. How: This checks each pending request from another member not checked yet.


		let actValBoo = true; // What: Active Value Boolean. Why: A check finishing after the group changed mustn't count. How: This is true until the cleanup runs.



		for ( const hisRecObj of hisRecArr ) { // What: Coverage Loop. Why: Each new pending request is checked once. How: This walks the requests.


			if ( hisRecObj.uidReqStr === uidValStr || hisRecObj.staValStr !== 'pending' || hisRecObj.uidReqStr in covMapObj ) continue; // What: Checked Guard. Why: The member's own, a claimed one, and one already checked need nothing. How: This skips them.



			void hisCovFun( groIdeStr, hisRecObj.uidReqStr ).then( ( covValBoo ) => { if ( actValBoo ) setCovMapObj( ( preMapObj ) => ( { ...preMapObj, [ hisRecObj.uidReqStr ] : covValBoo } ) ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Coverage Check Call. Why: The answer decides the row's offer. How: This checks the device and records the answer, logging a failure.


		}



		return () => { actValBoo = false; }; // What: Coverage Cleanup. Why: A late answer for an old list shouldn't count. How: This marks the run done.


	}, [ covMapObj, groIdeStr, hisRecArr, uidValStr ] ); // What: Effect Dependency Array. Why: New requests are checked as they arrive. How: hisRecArr changes with the watch, covMapObj as answers land, and the group and identity with the screen.



	// #region senRunFun

	/**
	 * senRunFun = Send Run Function
	 *
	 * @summary
	 * Sends a request's history as this member, unless a send is running:
	 * claims the request, losing politely to someone faster, then sends the
	 * range and announces how many messages went. A failed send releases the
	 * claim so someone else can try, and says so. Focus moves to the heading
	 * as the button goes.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param uidReqStr - UID Requester String: The asker's UID.
	 * @param askNamStr - Asker Name String: The asker's name, for the
	 *                    announcement.
	 *
	 * @returns A promise that settles once the send is handled, with no value.
	 *
	 * @example
	 * ```ts
	 * senRunFun('u9F...', 'Sam Ortiz') // => Promise<void>
	 * ```
	 *
	*/

	const senRunFun = async ( uidReqStr : string, askNamStr : string ) : Promise< void > => { // What: Send Run Function. Why: A member helps by sending what their phone holds. How: This claims, sends, and announces.


		if ( senUidStr !== '' ) return; // What: Busy Guard. Why: One send at a time. How: This ignores a second press.



		setSenUidStr( uidReqStr ); // What: Busy Set Call. Why: The row says it's sending. How: This marks the send as running.

		heaEleRef.current?.focus(); // What: Focus Call. Why: The pressed button goes as the row changes. How: This focuses the heading.



		try { await hisClaFun( groIdeStr, uidReqStr ); } // What: Claim Try. Why: Only one member sends. How: This takes the request.

		catch { // What: Claim Catch. Why: Someone else took it first, the expected end of a race. How: This frees the row and thanks the member.


			setSenUidStr( '' ); // What: Busy Clear Call. Why: Nothing is being sent. How: This clears the mark.

			onAnnFun( 'Someone else is already sending it. Thanks anyway.' ); // What: Lost Race Call. Why: A press that did nothing should still be answered. How: This announces it.



			return;


		}



		try { // What: Send Try. Why: The upload can fail on a dropped connection. How: This sends and announces, with the release below.


			const couNum = await hisSenFun( groIdeStr, uidReqStr ); // What: Count Number. Why: The member hears how much they shared. How: This sends the range and reads how many messages went.


			onAnnFun( `Sent ${ couNum.toLocaleString( 'en-US' ) } ${ couNum === 1 ? 'message' : 'messages' } to ${ askNamStr }.` ); // What: Sent Call. Why: The send should be confirmed. How: This announces the count.


		}

		catch ( errCatObj ) { // What: Send Catch. Why: A failed send shouldn't hold the request. How: This logs it, releases the claim, and says so.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			await hisRelFun( groIdeStr, uidReqStr ).catch( () => undefined ); // What: Release Call. Why: Someone else should be able to try. How: This frees the claim, ignoring a failure the 30 minutes will mend.

			onAnnFun( "The history couldn't be sent. Check your connection and try again." ); // What: Failure Call. Why: The member should know it didn't go. How: This announces it.


		}



		setSenUidStr( '' ); // What: Busy Clear Call. Why: The send is done. How: This clears the mark.


	};

	// #endregion senRunFun


	const othRecArr = hisRecArr.filter( ( hisRecObj ) => hisRecObj.uidReqStr !== uidValStr ); // What: Other Record Array. Why: The member's own request shows in the chat, not here. How: This leaves it out.


	if ( othRecArr.length === 0 ) return null; // What: Empty Guard. Why: The part shows only while someone else is asking. How: This renders nothing otherwise.



	return (


		<section
			className={ cssModObj.hisLisSec }

			aria-labelledby='hisLisHea'
		>{ /* What: History List Section Element. Why: The members asking for history read as one part. How: This holds the heading, the note, and the list. */ }


			<h3
				ref={ heaEleRef }
				id='hisLisHea'

				className={ cssModObj.hisTitHea }

				tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here as a pressed button goes, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
			>Asking for chat history</h3>{ /* What: History Title Heading Element. Why: The part needs a heading. How: This names it. */ }

			<p className={ cssModObj.hisIntPar }>These members are missing chat on their device. A member whose device holds it can send a copy, encrypted so only the group can read it.</p>{ /* What: History Intro Paragraph Element. Why: A member should know what's asked and that sending is safe (Section 11.9). How: This says both. */ }



			<ul className={ cssModObj.hisLisUno }>{ /* What: History List Unordered List Element. Why: The requests read as one list. How: This stacks a row for each. */ }


				{ othRecArr.map( ( hisRecObj ) => { // What: History Row Map. Why: Each request gets its own row. How: This renders one per request.


					const askNamStr = memRecArr?.find( ( memRecObj ) => memRecObj.uidValStr === hisRecObj.uidReqStr )?.namTexStr || 'A member';                       // What: Asker Name String. Why: The member recognizes who is asking. How: This finds their name, or says a member while the names load.
					const claNamStr = memRecArr?.find( ( memRecObj ) => memRecObj.uidValStr === hisRecObj.claUidStr )?.namTexStr || 'A member';                       // What: Claimant Name String. Why: Others see who is sending. How: This finds the claimant's name, or says a member.
					const staOldBoo = hisRecObj.claTimNum !== null && nowTimNum - hisRecObj.claTimNum >= STA_MIL_NUM;                                                   // What: Stalled Old Boolean. Why: A claim 30 minutes old may be freed. How: This compares its time with the clock.



					return (


						<li
							key={ hisRecObj.uidReqStr }

							className={ cssModObj.hisRowIte }
						>{ /* What: History Row Item Element. Why: A request shows who is asking, what for, and what can be done. How: This stacks them down the row. */ }


							<span className={ cssModObj.hisNamSpa }>{ askNamStr }</span>{ /* What: History Name Span Element. Why: The asker is known by their name. How: This shows it. */ }

							<span className={ cssModObj.hisKinSpa }>{ hisRecObj.kinValStr === 'recovery' ? 'Asked for the chat since they joined, on a new device.' : 'Asked for the chat from before they joined.' }</span>{ /* What: History Kind Span Element. Why: The two kinds ask for different chat. How: This says which. */ }



							{ hisRecObj.staValStr === 'claimed' && ( // What: Claimed Check. Why: A claimed request says who is sending it. How: This shows the line, with a release once the claim has stalled.


								<>{ /* What: Claimed Fragment. Why: The line and its button go together. How: This groups them without adding an element. */ }


									<span className={ cssModObj.hisStaSpa }>{ hisRecObj.claUidStr === uidValStr ? ( senUidStr === hisRecObj.uidReqStr ? 'Sending…' : 'You sent it. It arrives when they open the app.' ) : `${ claNamStr } is sending it.` }</span>{ /* What: History Status Span Element. Why: Everyone should see the request is in hand. How: This says who has it, or that the member's own send went. */ }



									{ staOldBoo && hisRecObj.claUidStr !== uidValStr && ( // What: Stalled Check. Why: A claim stalled for 30 minutes shouldn't block the request. How: This offers to free it then.


										<button
											className={ cssModObj.actPlaBut }

											type='button'

											onClick={ () => { heaEleRef.current?.focus(); void hisRelFun( groIdeStr, hisRecObj.uidReqStr ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); } } // What: Release Handler. Why: The button goes as the request reopens, so focus moves first. How: This focuses the heading, then frees the claim, logging a failure.
										>Let someone else send it<span className={ cssModObj.actHidSpa }>{ ` to ${ askNamStr }` }</span></button> // What: Action Plain Button Element. Why: A stalled claim can be freed, and a screen reader hears for whom. How: This releases the claim.


									) }


								</>


							) }



							{ hisRecObj.staValStr === 'pending' && covMapObj[ hisRecObj.uidReqStr ] === true && ( // What: Covered Check. Why: Only a phone holding the whole range is offered to send. How: This shows the button then.


								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => void senRunFun( hisRecObj.uidReqStr, askNamStr ) }
								>Send history<span className={ cssModObj.actHidSpa }>{ ` to ${ askNamStr }` }</span></button> // What: Action Plain Button Element. Why: Sending is done on purpose, and a screen reader hears to whom. How: This sends the history.


							) }



							{ hisRecObj.staValStr === 'pending' && covMapObj[ hisRecObj.uidReqStr ] === false && ( // What: Uncovered Check. Why: A member who can't fill a request should know why there's no button. How: This says so once the check has answered.


								<span className={ cssModObj.hisStaSpa }>{ "Your device doesn't hold all of it, so another member will need to send it." }</span> // What: History Status Span Element. Why: A member who can't send should know why. How: This says another member will need to.


							) }


						</li>


					);


				} ) }


			</ul>


		</section>


	);


}

// #endregion HisReqCom

// #endregion Components



// #region Exports

export { HisReqCom }; // What: Named Export. Why: The People section lists history requests. How: This exports HisReqCom.

// #endregion Exports


