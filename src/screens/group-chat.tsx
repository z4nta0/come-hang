


// #region Imports

import cssModObj from './group-chat.module.css'; // What: CSS Module Object. Why: The chat is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { chaMesFun       } from '../core/text-limits.ts';    // What: Chat Message Function. Why: A message with characters the chat refuses is caught before it's sent. How: This checks it.
import { chaSenFun       } from '../state/chat.ts';          // What: Chat Send Function. Why: The composer sends messages. How: This encrypts and sends one.
import { chaWatFun       } from '../state/chat.ts';          // What: Chat Watch Function. Why: Messages show as they're sent. How: This watches the group's chat.
import { eveBloFun       } from '../utils/date.ts';          // What: Event Block Function. Why: The pinned event leads with when it is. How: This gives its date block's lines.
import { EveDetCom       } from './event-details.tsx';       // What: Event Details Component. Why: The next event's sheet and panel show its details and bring-list. How: This draws them.
import { eveLisFun       } from '../state/events.ts';        // What: Event List Function. Why: The group's next event is pinned above the chat. How: This lists the events, soonest first.
import { eveRanFun       } from '../utils/date.ts';          // What: Event Range Function. Why: The pinned event says the hours it runs. How: This formats its range.
import { IcoSvgCom       } from '../ui/icon.tsx';            // What: Icon SVG Component. Why: The send button shows a paper plane. How: This draws it.
import { ideEnsFun       } from '../state/identity.ts';      // What: Identity Ensure Function. Why: A member's own messages show on their side. How: This reads their UID.
import { iniTexFun       } from '../utils/text.ts';          // What: Initials Text Function. Why: Each sender's avatar shows their initials. How: This takes them from the name.
import { KEY_WAI_STR     } from '../state/groups.ts';        // What: Key Waiting String. Why: A group whose key hasn't been shared yet can't show its chat. How: The chat shows this message then.
import { linNorFun       } from '../core/text-limits.ts';    // What: Lines Normalize Function. Why: A message keeps its line breaks while each line is tidied. How: This tidies it as it'll be sent.
import { memLisFun       } from '../state/members.ts';       // What: Member List Function. Why: Each message shows its sender's name and color. How: This lists the members.
import { mesLisFun       } from '../platform/chat-store.ts'; // What: Message List Function. Why: The chat opens with the history kept on the device. How: This reads it.
import { mesTimFun       } from '../utils/date.ts';          // What: Message Time Function. Why: Each message shows when it was sent. How: This labels the time.
import { SheDiaCom       } from '../ui/sheet.tsx';           // What: Sheet Dialog Component. Why: The pinned event opens its details in a sheet. How: This draws it.
import { sloColFun       } from '../ui/member-color.ts';     // What: Slot Color Function. Why: Each sender's avatar wears their color. How: This names it.
import { useEffect       } from 'react';                     // What: Use Effect. Why: The chat loads and watches while it's open. How: This starts and stops the work.
import { useLayoutEffect } from 'react';                     // What: Use Layout Effect. Why: The log should land on the newest message before it's drawn. How: This scrolls right after a change commits.
import { useRef          } from 'react';                     // What: Use Reference. Why: The log's element and whether it sits at its bottom are read outside rendering. How: This holds both.
import { useState        } from 'react';                     // What: Use State. Why: The messages, members, event, and composer change while the chat is open. How: This holds each.


import type { EveRecTyp } from '../state/events.ts';        // What: Event Record Type. Why: The pinned event is one of the group's events. How: This types it.
import type { MemRecTyp } from '../state/members.ts';       // What: Member Record Type. Why: Senders are looked up among the members. How: This types each.
import type { MesRecTyp } from '../platform/chat-store.ts'; // What: Message Record Type. Why: The log shows stored messages. How: This types each.
import type { SheHanTyp } from '../ui/sheet.tsx';           // What: Sheet Handle Type. Why: The pinned event opens its sheet. How: This types the sheet's handle.

// #endregion Imports



/**
 * group-chat.tsx = Group Chat
 *
 * @summary
 * The open group's chat: the group's next event pinned at the top, the log
 * of messages, and the composer at the bottom. The log opens with the
 * history kept on this device, then watches the chat, adding each message
 * as it arrives, and stays at its newest message while someone reads there.
 * Each message from another member shows their avatar in their own color,
 * their name, and its time, while the member's own messages sit on the other
 * side in the accent. A watch the rules refuse, as they do until the group's
 * membership mirror holds this member, starts again a second later, and a
 * group whose key is still waiting to be shared says so instead.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Hooks
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type ChaDatTyp = { chaErrStr : string, eveNexObj : EveRecTyp | null, memRecMap : Map< string, MemRecTyp >, mesAddFun : ( mesRecObj : MesRecTyp ) => void, mesRecArr : MesRecTyp[], uidValStr : string }; // What: Chat Data Type. Why: The chat reads everything it shows from one hook. How: This types what useChaDatFun returns.

// #endregion Types



// #region Constants

const FAI_MES_STR = "The message couldn't be sent. Check your connection and try again."; // What: Failure Message String. Why: A failed send shouldn't leave someone guessing. How: This is the message the composer announces.
const GAP_MIL_NUM = 300000;                                                                 // What: Gap Milliseconds Number. Why: Messages from one sender close together read as one run. How: This is five minutes, the gap that starts a new run.
const RET_MIL_NUM = 1000;                                                                   // What: Retry Milliseconds Number. Why: A refused watch, as before the membership mirror catches up, should try again soon. How: This is how long it waits.

// #endregion Constants



// #region Helpers

const mesMerFun = ( preRecArr : MesRecTyp[], mesRecObj : MesRecTyp ) : MesRecTyp[] => [ ...preRecArr.filter( ( preRecObj ) => preRecObj.mesIdeStr !== mesRecObj.mesIdeStr ), mesRecObj ].sort( ( recOneObj, recTwoObj ) => recOneObj.sntTimNum - recTwoObj.sntTimNum ); // What: Message Merge Function. Why: A message can arrive twice, once as sent and again from the watch with the server's time. How: This replaces any copy by ID and keeps the list in time order.

// #endregion Helpers



// #region Hooks

// #region useChaDatFun

/**
 * useChaDatFun = Use Chat Data Function
 *
 * @summary
 * Loads and watches what a group's chat shows: this member's UID, the
 * members, the next event that hasn't ended, the history kept on the device,
 * and each message the watch hands on, kept in time order without repeats.
 * A message from someone not among the members reads the members again. A
 * refused watch starts again after a second, and a group whose key is
 * waiting to be shared reports KEY_WAI_STR as the chat's error. Use it in a
 * component keyed by the group, so a new group starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group whose chat to load.
 *
 * @returns What the chat shows, and the function that adds a message.
 *
 * @example
 * ```ts
 * useChaDatFun('Xk3...') // => { chaErrStr, eveNexObj, memRecMap, ... }
 * ```
 *
*/

const useChaDatFun = ( groIdeStr : string ) : ChaDatTyp => { // What: Use Chat Data Function. Why: The chat's data comes from several places and changes while it's open. How: This loads each part and keeps the messages current.


	const memUidRef = useRef( new Set< string >() ); // What: Member UID Reference. Why: A sender not yet known means someone joined since the members were read. How: This holds the UIDs read so far.

	const [ chaErrStr, setChaErrStr ] = useState( '' );                                       // What: Chat Error String And Setter. Why: A chat that can't open says why. How: This holds the message, empty while it works.
	const [ eveNexObj, setEveNexObj ] = useState< EveRecTyp | null >( null );                 // What: Event Next Object And Setter. Why: The next event is pinned. How: This holds it, null when none is planned.
	const [ memRecMap, setMemRecMap ] = useState( new Map< string, MemRecTyp >() );           // What: Member Record Map And Setter. Why: Each message looks its sender up. How: This holds the members by UID.
	const [ mesRecArr, setMesRecArr ] = useState< MesRecTyp[] >( [] );                        // What: Message Record Array And Setter. Why: The log shows the messages. How: This holds them in time order.
	const [ uidValStr, setUidValStr ] = useState( '' );                                       // What: UID Value String And Setter. Why: A member's own messages sit on their side. How: This holds their UID, empty until read.



	const mesAddFun = ( mesRecObj : MesRecTyp ) : void => setMesRecArr( ( preRecArr ) => mesMerFun( preRecArr, mesRecObj ) ); // What: Message Add Function. Why: The log gains messages from the watch, the history, and the composer. How: This merges one in.



	useEffect( () => { // What: Chat Load Effect. Why: The chat's parts load once it opens, and the watch runs while it stays open. How: This starts each part and stops the watch and any retry on cleanup.


		let actValBoo = true;     // What: Active Value Boolean. Why: Work finishing after the chat closed mustn't change it. How: This is true until the cleanup runs.
		let retTimNum = 0;        // What: Retry Timer Number. Why: A pending retry should stop with the chat. How: This holds its timer, 0 while none waits.
		let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once it has started. How: This holds it, doing nothing until then.



		const memLoaFun = () : void => void memLisFun( groIdeStr ).then( ( memRecArr ) => { // What: Member Load Function. Why: Senders are shown by name and color, and a newcomer has to be read in. How: This reads the members and keeps them by UID.


			memUidRef.current = new Set( memRecArr.map( ( memRecObj ) => memRecObj.uidValStr ) ); // What: Known UIDs Assignment. Why: Later messages are checked against the members read. How: This keeps their UIDs.

			if ( actValBoo ) setMemRecMap( new Map( memRecArr.map( ( memRecObj ) => [ memRecObj.uidValStr, memRecObj ] ) ) ); // What: Members Set Call. Why: Each message looks its sender up. How: This keeps the members by UID.


		}, ( errCatObj : unknown ) => console.warn( errCatObj ) );



		const watStaFun = () : void => void chaWatFun( groIdeStr, ( mesRecObj ) => { // What: Watch Start Function. Why: Messages show as they arrive, and a refused watch has to start again. How: This watches the chat, adding each message, and schedules another start when it fails.


			if ( !actValBoo ) return; // What: Closed Guard. Why: The chat may have closed. How: This ignores the message.



			if ( !memUidRef.current.has( mesRecObj.senUidStr ) ) memLoaFun(); // What: Newcomer Read Call. Why: A sender not among the members joined after they were read. How: This reads them again.

			setMesRecArr( ( preRecArr ) => mesMerFun( preRecArr, mesRecObj ) ); // What: Message Merge Call. Why: The log shows the message. How: This merges it in.


		}, ( errCatObj ) => { // What: Watch Error Handler. Why: A watch refused before the mirror holds this member has to try again. How: This logs it and starts again after a second.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The refusal stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) retTimNum = window.setTimeout( watStaFun, RET_MIL_NUM ); // What: Retry Call. Why: The mirror usually catches up within a moment. How: This starts the watch again after the wait.


		} ).then( ( stoFunVal ) => { // What: Watch Started Handler. Why: The cleanup has to stop the watch, and a chat closed first stops it at once. How: This keeps the stop, or calls it.


			if ( actValBoo ) stoWatFun = stoFunVal; // What: Stop Keep Call. Why: The cleanup stops the watch. How: This keeps the stop.

			else stoFunVal(); // What: Late Stop Call. Why: The chat closed before the watch started. How: This stops it at once.


		}, ( errCatObj : unknown ) => { // What: Watch Failure Handler. Why: The watch couldn't start, such as while the key waits to be shared. How: This shows the waiting message for a waiting key, and otherwise logs the failure and tries again after a second.


			if ( !actValBoo ) return; // What: Closed Guard. Why: The chat may have closed. How: This ignores the failure.



			if ( errCatObj instanceof Error && errCatObj.message === KEY_WAI_STR ) { setChaErrStr( KEY_WAI_STR ); return; } // What: Waiting Key Guard. Why: A key waiting to be shared won't arrive by retrying soon, and the member should know why the chat is empty. How: This shows the waiting message and stops.



			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			retTimNum = window.setTimeout( watStaFun, RET_MIL_NUM ); // What: Retry Call. Why: A failure such as a dropped connection may pass. How: This starts the watch again after the wait.


		} );



		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: A member's own messages sit on their side. How: This reads their UID.

		void eveLisFun( groIdeStr ).then( ( eveRecArr ) => { if ( actValBoo ) setEveNexObj( eveRecArr.find( ( eveRecObj ) => eveRecObj.endTimNum > Date.now() ) ?? null ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Event Read Call. Why: The next event that hasn't ended is pinned. How: This lists the events, soonest first, and keeps the first one still to come or under way.

		void mesLisFun( groIdeStr ).then( ( stoRecArr ) => { if ( actValBoo ) setMesRecArr( ( preRecArr ) => stoRecArr.reduce( mesMerFun, preRecArr ) ); } ); // What: History Read Call. Why: The chat opens with what the device kept. How: This merges each stored message in.

		memLoaFun(); // What: Member Load Call. Why: Senders are shown by name and color. How: This reads the members.

		watStaFun(); // What: Watch Start Call. Why: New messages show as they're sent. How: This starts the watch.



		return () => { // What: Chat Cleanup. Why: Nothing should keep running once the chat closes. How: This marks it closed and stops the watch and any retry.


			actValBoo = false; // What: Inactive Set. Why: Late results mustn't act. How: This marks the chat closed.

			window.clearTimeout( retTimNum ); // What: Retry Clear Call. Why: A waiting retry would start a watch nobody stops. How: This cancels it.

			stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


		};


	}, [ groIdeStr ] ); // What: Effect Dependency Array. Why: Each group's chat loads afresh. How: groIdeStr changes when another group's chat opens.



	return { chaErrStr, eveNexObj, memRecMap, mesAddFun, mesRecArr, uidValStr }; // What: Chat Data Return. Why: The chat shows each part. How: This returns them.


};

// #endregion useChaDatFun

// #endregion Hooks



// #region Components

type PecProTyp = { eveRecObj : EveRecTyp, onOpeFun : () => void }; // What: Pinned Event Component Props Type. Why: The card shows one event and opens its details. How: This types PinEveCom's props.

// #region PinEveCom

/**
 * PinEveCom = Pinned Event Component
 *
 * @summary
 * Renders the group's next event as a card above the chat: a date block with
 * its month and day, or "Today" and its start hour, beside its title and a
 * line with its hours and, when it has one, its place. The card is a button
 * that opens the event's sheet. From 1,100px wide it hides, since the event
 * panel beside the chat shows the event instead.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.eveRecObj - Event Record Object: The event to pin.
 * @param props.onOpeFun  - On Open Function: Opens the event's sheet.
 *
 * @returns The pinned event's button.
 *
 * @example
 * ```tsx
 * PinEveCom({ eveRecObj, onOpeFun }) // => <PinEveCom />
 * ```
 *
*/

function PinEveCom ( { eveRecObj, onOpeFun } : PecProTyp ) : React.JSX.Element {


	const eveBloObj = eveBloFun( eveRecObj.staTimNum, Date.now() );          // What: Event Block Object. Why: The card leads with when the event is. How: This gives the block's two lines.
	const eveRanStr = eveRanFun( eveRecObj.staTimNum, eveRecObj.endTimNum ); // What: Event Range String. Why: The line leads with the hours. How: This formats them.



	return (


		<button
			className={ cssModObj.pinEveBut }

			type='button'

			aria-haspopup='dialog'

			onClick={ onOpeFun }
		>{ /* What: Pinned Event Button Element. Why: The next event stays in view above the chat, and opens its details and bring-list. How: This lays the date block beside the title and line, on a raised card, below 1,100px wide. */ }


			<span className={ cssModObj.pinDatSpa }>{ /* What: Pinned Date Span Element. Why: The date is the first thing read. How: This stacks the block's small and large lines on a tint. */ }


				<span className={ cssModObj.datTopSpa }>{ eveBloObj.topStr }</span>{ /* What: Date Top Span Element. Why: The month, or "Today", tops the block. How: This shows the small line. */ }

				<span className={ cssModObj.datBotSpa }>{ eveBloObj.botStr }</span>{ /* What: Date Bottom Span Element. Why: The day, or today's start hour, is the block's large line. How: This shows it. */ }


			</span>

			<span className={ cssModObj.pinTitSpa }>{ eveRecObj.titTexStr }</span>{ /* What: Pinned Title Span Element. Why: The event is known by its title. How: This shows it. */ }

			<span className={ cssModObj.pinLinSpa }>{ eveRanStr }{ eveRecObj.locTexStr !== '' && <><span aria-hidden='true'> · </span><span className={ cssModObj.pinHidSpa }>, </span>{ eveRecObj.locTexStr }</> }</span>{ /* What: Pinned Line Span Element. Why: The hours and place say when and where, and a screen reader should hear a comma where sight sees a dot. How: This shows the hours, then the place after a dot hidden from screen readers and a comma hidden from sight, when there is a place. */ }


		</button>


	);


}

// #endregion PinEveCom



type GccProTyp = { groIdeStr : string, groNamStr : string }; // What: Group Chat Component Props Type. Why: The chat belongs to one group, whose name the composer shows. How: This types GroChaCom's props.

// #region GroChaCom

/**
 * GroChaCom = Group Chat Component
 *
 * @summary
 * Renders the open group's chat: the pinned next event when there is one,
 * the log, which is a live region so new messages are announced, and the
 * composer. The log scrolls itself, staying at its newest message while
 * someone reads there and when they send one. Enter sends and Shift+Enter
 * starts a new line. A message with characters the chat refuses, or a send
 * that fails, is announced beside the composer, and the text stays to try
 * again. Key it by the group, so a new group starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groIdeStr - Group Identifier String: The group whose chat it
 *                          is.
 * @param props.groNamStr - Group Name String: The group's name, shown in the
 *                          composer's hint.
 *
 * @returns The chat.
 *
 * @example
 * ```tsx
 * GroChaCom({ groIdeStr, groNamStr }) // => <GroChaCom />
 * ```
 *
*/

function GroChaCom ( { groIdeStr, groNamStr } : GccProTyp ) : React.JSX.Element {


	const logBotRef = useRef( true );                   // What: Log Bottom Reference. Why: The log follows new messages only while someone reads at its end. How: This holds whether it sits at its bottom.
	const logEleRef = useRef< HTMLDivElement >( null ); // What: Log Element Reference. Why: The log scrolls itself. How: This holds its element.
	const sheHanRef = useRef< SheHanTyp >( null );      // What: Sheet Handle Reference. Why: The pinned event opens its sheet. How: This holds the sheet's handle.

	const [ senErrStr, setSenErrStr ] = useState( '' );    // What: Send Error String And Setter. Why: A refused or failed send is announced. How: This holds the message, empty when there's none.
	const [ senReqBoo, setSenReqBoo ] = useState( false ); // What: Send Request Boolean And Setter. Why: A second send while the first is out would send twice. How: This is true while one is out.
	const [ texValStr, setTexValStr ] = useState( '' );    // What: Text Value String And Setter. Why: The composer shows what's typed. How: This holds it.


	const { chaErrStr, eveNexObj, memRecMap, mesAddFun, mesRecArr, uidValStr } = useChaDatFun( groIdeStr ); // What: Chat Data. Why: The chat shows what the hook loads. How: This reads each part.



	useLayoutEffect( () => { // What: Log Follow Effect. Why: Someone reading at the end should see each new message without scrolling. How: This moves the log to its bottom after a change, when it sat there before.


		if ( logBotRef.current && logEleRef.current ) logEleRef.current.scrollTop = logEleRef.current.scrollHeight; // What: Bottom Scroll Call. Why: The newest message is at the bottom. How: This scrolls the log there.


	}, [ mesRecArr ] ); // What: Effect Dependency Array. Why: The log moves when its messages change. How: mesRecArr changes as each one arrives.



	// #region senMesFun

	/**
	 * senMesFun = Send Message Function
	 *
	 * @summary
	 * Sends what's typed: ignores an empty message or one while another is
	 * out, announces a message the chat refuses, and otherwise sends it, adds
	 * it to the log at once, clears the composer, and keeps the log at its
	 * end. A failed send is announced and leaves the text to try again.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the send is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * senMesFun() // => Promise<void>
	 * ```
	 *
	*/

	const senMesFun = async () : Promise< void > => { // What: Send Message Function. Why: The composer sends messages. How: This checks, sends, and shows one.


		const norTexStr = linNorFun( texValStr ); // What: Normalized Text String. Why: The message is checked as it'll be sent. How: This tidies each line.


		if ( senReqBoo || norTexStr === '' ) return; // What: Empty Guard. Why: Nothing is sent twice at once or empty. How: This ignores the send.



		if ( !chaMesFun( norTexStr ) ) { setSenErrStr( "This message has characters that can't be sent." ); return; } // What: Refused Text Guard. Why: The chat refuses invisible and reversing characters, and the sender should know. How: This announces it and stops.



		setSenErrStr( '' ); // What: Error Clear Call. Why: An earlier problem no longer applies. How: This empties the alert.

		setSenReqBoo( true ); // What: Sending Set Call. Why: The composer waits for the send. How: This marks one as out.



		try { // What: Send Try. Why: The message is sent and shown at once. How: This sends it, adds the sender's copy to the log, and clears the composer.


			const mesIdeStr = await chaSenFun( groIdeStr, norTexStr ); // What: Message Identifier String. Why: The watch's copy replaces this one by ID. How: This sends the message.


			logBotRef.current = true; // What: Bottom Set. Why: Someone who sends wants to see their message. How: This keeps the log at its end.

			mesAddFun( { groIdeStr, mesIdeStr, senUidStr : uidValStr, sntTimNum : Date.now(), texValStr : norTexStr } ); // What: Message Add Call. Why: The sender sees their message at once. How: This adds it with this device's time until the watch's copy arrives.

			setTexValStr( '' ); // What: Composer Clear Call. Why: The message is sent. How: This empties the box.


		}

		catch ( errCatObj ) { // What: Send Catch. Why: A failed send has to be told, keeping the text. How: This logs it and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setSenErrStr( FAI_MES_STR ); // What: Failure Announce Call. Why: The sender has to learn it failed. How: This puts the message in the alert.


		}



		setSenReqBoo( false ); // What: Sending Clear Call. Why: The composer can send again. How: This marks the send as done.


	};

	// #endregion senMesFun



	return (


		<div className={ cssModObj.chaRooDiv }>{ /* What: Chat Root Div Element. Why: The pinned event, the log, and the composer fill the content area. How: This stacks them, the log taking the room between. */ }


			<h2 className={ cssModObj.chaTitHea }>Chat</h2>{ /* What: Chat Title Heading Element. Why: The open part of the group needs a heading a screen reader can find. How: This names the chat, hidden from sight. */ }



			{ eveNexObj && ( // What: Pinned Event Check. Why: The next event is pinned only when one is planned. How: This shows its card when there is one.


				<PinEveCom
					eveRecObj={ eveNexObj }

					onOpeFun={ () => sheHanRef.current?.opeFun() } // What: Open Handler. Why: The card opens the event's details over the chat. How: This opens the event's sheet as a modal.
				/> // What: Pinned Event Component. Why: The next event stays in view above the chat below 1,100px wide. How: This shows its card.


			) }



			<div
				ref={ logEleRef }

				className={ cssModObj.chaLogDiv }

				tabIndex={ 0 } // What: Log Tab Index. Why: A keyboard user has to be able to scroll the messages. How: This lets the log take focus, where the arrow keys scroll it.

				aria-label='Messages'
				role='log'

				onScroll={ ( scrEveObj ) => { const logCurEle = scrEveObj.currentTarget; logBotRef.current = logCurEle.scrollHeight - logCurEle.scrollTop - logCurEle.clientHeight < 40; } } // What: Scroll Handler. Why: The log follows new messages only while someone reads at its end. How: This records whether it sits within 40px of its bottom.
			>{ /* What: Chat Log Div Element. Why: The messages scroll on their own between the event and the composer, and new ones are announced. How: This holds them as a live log. */ }


				{ chaErrStr !== '' ? ( // What: Chat Error Check. Why: A chat that can't open says why. How: This shows the reason in place of the messages.


					<p className={ cssModObj.chaEmpPar }>{ chaErrStr }</p> // What: Chat Empty Paragraph Element. Why: The member should know why the chat is empty. How: This shows the reason.


				) : mesRecArr.length === 0 ? ( // What: No Messages Check. Why: An empty chat says so. How: This shows a prompt in place of the messages.


					<p className={ cssModObj.chaEmpPar }>No messages yet. Say hi!</p> // What: Chat Empty Paragraph Element. Why: An empty chat should invite the first message. How: This says nothing's been said.


				) : ( // What: Messages Branch. Why: A chat with messages lists them. How: This renders the list.


					<ol className={ cssModObj.chaMesOrd }>{ /* What: Chat Messages Ordered List Element. Why: The messages read in the order they were sent. How: This lists them, oldest first. */ }


						{ mesRecArr.map( ( mesRecObj, mesIndNum ) => { // What: Message Map. Why: Each message gets its own entry. How: This renders one per message, joining a sender's messages close together into one run.


							const memRecObj = memRecMap.get( mesRecObj.senUidStr );                                                                    // What: Member Record Object. Why: The message shows its sender. How: This looks them up, undefined for someone who left.
							const preRecObj = mesRecArr[ mesIndNum - 1 ] as MesRecTyp | undefined;                                                     // What: Previous Record Object. Why: A message close after its sender's last continues their run. How: This reads the one before it. // What: Type Assertion Note. Why: The first message has none before it. How: The as reads it as possibly missing.
							const conRunBoo = preRecObj?.senUidStr === mesRecObj.senUidStr && mesRecObj.sntTimNum - preRecObj.sntTimNum < GAP_MIL_NUM; // What: Continued Run Boolean. Why: A run shows its sender once. How: This is true when the message before it is the same sender's within five minutes.
							const ownMesBoo = mesRecObj.senUidStr === uidValStr;                                                                       // What: Own Message Boolean. Why: The member's own messages sit on their side. How: This compares the sender with them.
							const senNamStr = memRecObj?.namTexStr || ( memRecObj ? 'Someone' : 'Former member' );                                     // What: Sender Name String. Why: A message names its sender, even one with no name yet or who left. How: This takes their name, or a stand-in.



							return ( // What: Message Return. Why: Each message is one entry. How: This returns its list item.


								<li
									key={ mesRecObj.mesIdeStr }

									className={` ${ cssModObj.chaMesIte }   ${ ownMesBoo ? cssModObj.chaMesIteOwn : '' }   ${ conRunBoo ? cssModObj.chaMesIteRun : '' } `}
								>{ /* What: Chat Message Item Element. Why: A message shows who sent it, when, and what they said. How: This lays the avatar beside the sender, time, and text, on the member's own side for their messages. */ }


									{ !ownMesBoo && !conRunBoo && ( // What: Avatar Check. Why: A run shows its sender's avatar once, and the member's own messages need none. How: This shows it on another member's first message in a run.


										<span
											className={ cssModObj.mesAvaSpa }
											style={{ backgroundColor : memRecObj ? sloColFun( memRecObj.colSloNum ) : undefined }} // What: Avatar Color Note. Why: Each member wears their own color, and someone who left keeps the plain look. How: This reads their slot's token.

											aria-hidden='true'
										>{ iniTexFun( senNamStr ) }</span> // What: Message Avatar Span Element. Why: An avatar in the sender's color tells members apart at a glance, while their name is read beside it. How: This shows their initials, hidden from screen readers.


									) }

									<p className={ cssModObj.mesMetPar }>{ /* What: Message Meta Paragraph Element. Why: Who sent it and when head the message, and a screen reader reads them with it. How: This shows the sender and time, hidden from sight within a run and for the member's own. */ }


										<span className={ cssModObj.mesNamSpa }>{ ownMesBoo ? 'You' : senNamStr }</span>{ /* What: Message Name Span Element. Why: The sender is named. How: This shows their name, or "You". */ }

										<span className={ cssModObj.mesTimSpa }>{ mesTimFun( mesRecObj.sntTimNum, Date.now() ) }</span>{ /* What: Message Time Span Element. Why: The message says when it was sent. How: This shows its time. */ }


									</p>

									<p className={ cssModObj.mesTexPar }>{ mesRecObj.texValStr }</p>{ /* What: Message Text Paragraph Element. Why: The message's words are what was said. How: This shows them, keeping their line breaks, as text rather than markup. */ }


								</li>


							);


						} ) }


					</ol>


				) }


			</div>



			<form
				className={ cssModObj.chaComFor }

				onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void senMesFun(); } } // What: Submit Handler. Why: The message is sent by the app, not by a page load. How: This cancels the browser's submit and runs the app's.
			>{ /* What: Chat Composer Form Element. Why: Members write and send messages at the bottom of the chat. How: This lays the box beside the send button, with the alert below. */ }


				<label
					className={ cssModObj.comLabLab }
					htmlFor='chaMesTex'
				>Message</label>{ /* What: Composer Label Label Element. Why: The box needs a name a screen reader announces. How: This names it, hidden from sight, since its hint shows instead. */ }

				<textarea
					id='chaMesTex'

					className={ cssModObj.comTexTex }

					maxLength={ 2000 }
					placeholder={ `Message ${ groNamStr }` }
					rows={ 1 }
					value={ texValStr }

					aria-describedby='chaSenErr'

					onChange={ ( chaEveObj ) => setTexValStr( chaEveObj.target.value ) }
					onKeyDown={ ( keyEveObj ) => { if ( keyEveObj.key === 'Enter' && !keyEveObj.shiftKey && !keyEveObj.nativeEvent.isComposing ) { keyEveObj.preventDefault(); void senMesFun(); } } } // What: Key Down Handler. Why: Enter sends while Shift+Enter starts a new line, and an input method composing a word keeps its Enter. How: This sends on a plain Enter outside composition.
				/>{ /* What: Composer Text Textarea Element. Why: A message is typed here, over several lines when needed. How: This holds it, at most 2,000 characters. */ }

				<button
					className={ cssModObj.comSenBut }

					type='submit'

					aria-label='Send'
				>{ /* What: Composer Send Button Element. Why: Sending should be a tap away. How: This submits the message. */ }


					<IcoSvgCom
						icoNamStr='send'
						sizSteStr='p01'
					/>{ /* What: Send Icon SVG Component. Why: A paper plane says the button sends. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


				</button>

				<p
					id='chaSenErr'

					className={ cssModObj.comErrPar }

					role='alert'
				>{ senErrStr }</p>{ /* What: Composer Error Paragraph Element. Why: A refused or failed send has to be announced, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when a send fails. */ }


			</form>



			{ eveNexObj && ( // What: Event Panel Check. Why: The panel and the sheet show the next event only when one is planned. How: This adds both when there is one.


				<>


					<aside
						className={ cssModObj.eveNexAsi }

						aria-labelledby='eveNexHea'
					>{ /* What: Event Next Aside Element. Why: A wide screen has room for the next event beside the chat. How: This holds its title and details, from 1,100px wide, and hides below that. */ }


						<h2
							id='eveNexHea'

							className={ cssModObj.nexTitHea }
						>{ eveNexObj.titTexStr }</h2>{ /* What: Next Title Heading Element. Why: The panel is named for its event. How: This shows the event's title. */ }



						<EveDetCom
							key={ eveNexObj.eveIdeStr } // What: Details Key. Why: Another event's list has to start afresh. How: This remounts the details for each event.

							eveRecObj={ eveNexObj }
							groIdeStr={ groIdeStr }
							memRecMap={ memRecMap }
							uidValStr={ uidValStr }
							varStr='pan'
						/>{ /* What: Event Details Component. Why: The panel shows the event's details and bring-list. How: This draws them. */ }


					</aside>



					<SheDiaCom
						ref={ sheHanRef }

						ideStr='eveSheHea'
						titStr={ eveNexObj.titTexStr }
					>{ /* What: Event Sheet Dialog Component. Why: Below 1,100px wide, the pinned card opens the event's details over the chat. How: This holds them in a sheet titled with the event. */ }


						<EveDetCom
							key={ eveNexObj.eveIdeStr } // What: Details Key. Why: Another event's list has to start afresh. How: This remounts the details for each event.

							eveRecObj={ eveNexObj }
							groIdeStr={ groIdeStr }
							memRecMap={ memRecMap }
							uidValStr={ uidValStr }
							varStr='she'
						/>{ /* What: Event Details Component. Why: The sheet shows the event's details and bring-list. How: This draws them. */ }


					</SheDiaCom>


				</>


			) }


		</div>


	);


}

// #endregion GroChaCom

// #endregion Components



// #region Exports

export { GroChaCom }; // What: Named Export. Why: The group frame shows the open group's chat. How: This exports GroChaCom.

// #endregion Exports


