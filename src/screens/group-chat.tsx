


// #region Imports

import cssModObj from './group-chat.module.css'; // What: CSS Module Object. Why: The chat is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { AvaConCom       } from '../ui/member-avatar.tsx';     // What: Avatar Contents Component. Why: A member's avatar shows their profile photo, or their initials. How: This fills the circle.
import { briDetFun       } from '../core/chat-status.ts';      // What: Bring Details Function. Why: A bring-list line names its event and items. How: This reads the post's details.
import { briFluFun       } from '../state/bring-lines.ts';     // What: Bring Flush Function. Why: Closing the event's sheet ends the member's bursts of list changes. How: This posts their chat lines.
import { chaImgFun       } from '../state/chat.ts';            // What: Chat Image Function. Why: The composer sends a photo with an optional caption. How: This sends it, counted against the day's limits.
import { chaMesFun       } from '../core/text-limits.ts';      // What: Chat Message Function. Why: A message with characters the chat refuses is caught before it's sent. How: This checks it.
import { ChaPhoVieCom    } from './chat-photo-viewer.tsx';     // What: Chat Photo Viewer Component. Why: A tapped photo opens whole, to save. How: This draws its sheet.
import { chaQueFun       } from '../state/chat.ts';            // What: Chat Queue Function. Why: A message written offline waits on the device. How: This keeps it to send later.
import { chaSenFun       } from '../state/chat.ts';            // What: Chat Send Function. Why: The composer sends messages. How: This encrypts and sends one.
import { chaUplFun       } from '../state/chat.ts';            // What: Chat Upload Function. Why: A photo is counted and uploaded once, however many times its message is tried. How: This checks the caption and uploads the photo.
import { chaWatFun       } from '../state/chat.ts';            // What: Chat Watch Function. Why: Messages show as they're sent. How: This watches the group's chat.
import { chpGetFun       } from '../state/chat-photos.ts';     // What: Chat-Photo Get Function. Why: A photo message shows its photo. How: This decrypts the copy kept on the device.
import { eveBloFun       } from '../utils/date.ts';            // What: Event Block Function. Why: The pinned event leads with when it is. How: This gives its date block's lines.
import { EveDetCom       } from './event-details.tsx';         // What: Event Details Component. Why: The next event's sheet and panel show its details and bring-list. How: This draws them.
import { eveLisFun       } from '../state/events.ts';          // What: Event List Function. Why: The group's next event is pinned above the chat. How: This lists the events, soonest first.
import { eveRanFun       } from '../utils/date.ts';            // What: Event Range Function. Why: The pinned event says the hours it runs. How: This formats its range.
import { IcoSvgCom       } from '../ui/icon.tsx';              // What: Icon SVG Component. Why: The send button shows a paper plane. How: This draws it.
import { ideEnsFun       } from '../state/identity.ts';        // What: Identity Ensure Function. Why: A member's own messages show on their side. How: This reads their UID.
import { imgDetFun       } from '../core/chat-status.ts';      // What: Image Details Function. Why: A photo message names its photo and caption. How: This reads them.
import { iniTexFun       } from '../utils/text.ts';            // What: Initials Text Function. Why: Each sender's avatar shows their initials. How: This takes them from the name.
import { KEY_WAI_STR     } from '../state/groups.ts';          // What: Key Waiting String. Why: A group whose key hasn't been shared yet can't show its chat. How: The chat shows this message then.
import { linNorFun       } from '../core/text-limits.ts';      // What: Lines Normalize Function. Why: A message keeps its line breaks while each line is tidied. How: This tidies it as it'll be sent.
import { linNowFun       } from '../state/chat-link.ts';       // What: Link Now Function. Why: A message sent while the chat can't connect would hang. How: This reads the chat's connection.
import { lisPhrFun       } from '../utils/text.ts';            // What: List Phrase Function. Why: A bring-list line names its items as a phrase. How: This joins them the way English does.
import { memLisFun       } from '../state/members.ts';         // What: Member List Function. Why: Each message shows its sender's name and color. How: This lists the members.
import { mesLisFun       } from '../platform/chat-store.ts';   // What: Message List Function. Why: The chat opens with the history kept on the device. How: This reads it.
import { mesTimFun       } from '../utils/date.ts';            // What: Message Time Function. Why: Each message shows when it was sent. How: This labels the time.
import { onlNowFun       } from '../platform/online.ts';       // What: Online Now Function. Why: A message written offline waits rather than hanging. How: This reads the connection.
import { outLisFun       } from '../platform/outbox-store.ts'; // What: Outbox List Function. Why: The log shows the messages still waiting to send. How: This reads them.
import { outSubFun       } from '../state/chat.ts';            // What: Outbox Subscribe Function. Why: The waiting messages change as they're kept and sent. How: This follows them.
import { phoAddFun       } from '../state/photos.ts';          // What: Photo Add Function. Why: A chat photo can go to an event's photos instead (Section 22). How: This shares it to the event.
import { phoFluFun       } from '../state/photos.ts';          // What: Photos Flush Function. Why: Closing the event's sheet, or sending a photo to the event, ends the member's burst of photos. How: This posts its chat line.
import { PusNudCom       } from './push-nudge.tsx';            // What: Push Nudge Component. Why: The chat offers notifications once on a device. How: This draws the card.
import { SheDiaCom       } from '../ui/sheet.tsx';             // What: Sheet Dialog Component. Why: The pinned event opens its details in a sheet. How: This draws it.
import { sloColFun       } from '../ui/member-color.ts';       // What: Slot Color Function. Why: Each sender's avatar and status dot wear their color. How: This names it.
import { staDetFun       } from '../core/chat-status.ts';      // What: Status Details Function. Why: A photos line names its event. How: This reads the post's details.
import { staKinFun       } from '../core/chat-status.ts';      // What: Status Kind Function. Why: A status post shows as a line rather than a message. How: This reads its kind.
import { StoNudCom       } from './storage-nudge.tsx';         // What: Storage Nudge Component. Why: The chat says when chat photos are filling the device. How: This draws the card.
import { useBytUrlFun    } from '../ui/bytes-url.ts';          // What: Use Bytes URL Function. Why: A message's image shows its decrypted photo by address. How: This makes and frees one.
import { useEffect       } from 'react';                       // What: Use Effect. Why: The chat loads and watches while it's open. How: This starts and stops the work.
import { useLayoutEffect } from 'react';                       // What: Use Layout Effect. Why: The log should land on the newest message before it's drawn. How: This scrolls right after a change commits.
import { useRef          } from 'react';                       // What: Use Reference. Why: The log's element and whether it sits at its bottom are read outside rendering. How: This holds both.
import { useScrOpeFun    } from '../ui/screen.ts';             // What: Use Screen Open Function. Why: A photos or bring-list line opens its event's photos or list in the Events section. How: This returns the function that opens a screen.
import { useState        } from 'react';                       // What: Use State. Why: The messages, members, event, and composer change while the chat is open. How: This holds each.


import type { ChpSenTyp } from '../state/chat-photos.ts';     // What: Chat-Photo Sent Type. Why: An uploaded photo is kept for a retry. How: This types its ID and IV.
import type { CpvRecTyp } from './chat-photo-viewer.tsx';     // What: Chat-Photo-Viewer Record Type. Why: The viewer opens on one photo. How: This types it.
import type { EveRecTyp } from '../state/events.ts';          // What: Event Record Type. Why: The pinned event is one of the group's events. How: This types it.
import type { MemRecTyp } from '../state/members.ts';         // What: Member Record Type. Why: Senders are looked up among the members. How: This types each.
import type { MesRecTyp } from '../platform/chat-store.ts';   // What: Message Record Type. Why: The log shows stored messages. How: This types each.
import type { OutRecTyp } from '../platform/outbox-store.ts'; // What: Outbox Record Type. Why: The log shows waiting messages. How: This types each.
import type { SheHanTyp } from '../ui/sheet.tsx';             // What: Sheet Handle Type. Why: The pinned event opens its sheet. How: This types the sheet's handle.

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
 * side in the accent, and a status post, saying someone is on their way or
 * has arrived, shows as a centered line. A watch the rules refuse, as they
 * do until the group's membership mirror holds this member, starts again a
 * second later, and a group whose key is still waiting to be shared says so
 * instead.
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

type ChaDatTyp = { chaErrStr : string, eveIdeArr : string[], eveNexObj : EveRecTyp | null, eveRunObj : EveRecTyp | null, memRecMap : Map< string, MemRecTyp >, mesAddFun : ( mesRecObj : MesRecTyp ) => void, mesRecArr : MesRecTyp[], uidValStr : string }; // What: Chat Data Type. Why: The chat reads everything it shows from one hook. How: This types what useChaDatFun returns.

// #endregion Types



// #region Constants

const FAI_MES_STR = "The message couldn't be sent. Check your connection and try again.";     // What: Failure Message String. Why: A failed send shouldn't leave someone guessing. How: This is the message the composer announces.
const EVE_FUL_STR = "No more photos fit. An event holds 100 photos and each person can add 30, or 300 and 60 when the group's owner has the upgrade."; // What: Event Full String. Why: The rules refuse a photo past either of an event's caps. How: This is the message the composer announces, giving both caps for both plans.
const FAI_PHO_STR = "The photo couldn't be sent. Check your connection and try again.";       // What: Failure Photo String. Why: A failed photo shouldn't leave someone guessing. How: This is the message the composer announces.
const GAP_MIL_NUM = 300000;                                                                   // What: Gap Milliseconds Number. Why: Messages from one sender close together read as one run. How: This is five minutes, the gap that starts a new run.
const OFF_PHO_STR = "Photos send only while you're online. Try again once you're connected."; // What: Offline Photo String. Why: A photo has to upload to be counted and sent, so it can't wait on the device the way a message can. How: This is the message the composer announces.
const RET_MIL_NUM = 1000;                                                                     // What: Retry Milliseconds Number. Why: A refused watch, as before the membership mirror catches up, should try again soon. How: This is how long it waits.



const STA_LIN_OBJ = { // What: Status Line Object. Why: Each kind of status post reads as its own line, naming its sender, or "You" for the member's own. How: This maps each kind to a function of the sender's name, empty for the member themselves, and the post's text, which a photos or bring-list line reads its details from.


	add : ( namValStr : string, texValStr : string ) : string => `${ namValStr === '' ? 'You' : namValStr } added ${ lisPhrFun( briDetFun( texValStr )!.labArr, briDetFun( texValStr )!.couNum ) } to ${ briDetFun( texValStr )!.titTexStr }'s list`, // What: Added Line. Why: A burst of items added to an event's list is said once (Section 11.5). How: This names who added them, the items, and the event's title as it stood. // What: Non-Null Note. Why: The line is chosen only for a post whose details read well. How: The ! reads them as present.
	arr : ( namValStr : string ) : string => namValStr === '' ? 'You arrived' : `${ namValStr } arrived`,                                                                     // What: Arrived Line. Why: An arrival is said plainly. How: This names who arrived.
	cla : ( namValStr : string, texValStr : string ) : string => `${ namValStr === '' ? "You're" : `${ namValStr } is` } bringing ${ lisPhrFun( briDetFun( texValStr )!.labArr, briDetFun( texValStr )!.couNum ) } to ${ briDetFun( texValStr )!.titTexStr }`, // What: Claimed Line. Why: A burst of items claimed from an event's list is said once (Section 11.5). How: This names who's bringing them, the items, and the event's title as it stood. // What: Non-Null Note. Why: The line is chosen only for a post whose details read well. How: The ! reads them as present.
	pho : ( namValStr : string, texValStr : string ) : string => `${ namValStr === '' ? 'You' : namValStr } just uploaded photos for ${ staDetFun( texValStr )!.titTexStr }`, // What: Photos Line. Why: A burst of shared photos is said once, naming the event (Section 20). How: This names who shared them and the event's title as it stood. // What: Non-Null Note. Why: A post reads as the photos kind only once its details read well. How: The ! reads them as present.
	unk : ( namValStr : string ) : string => `${ namValStr === '' ? 'You' : namValStr } posted an update this version of Come Hang can't show`,                               // What: Unknown Line. Why: A later version may post a kind this one doesn't know, which still shouldn't vanish. How: This says an update was posted.
	way : ( namValStr : string ) : string => namValStr === '' ? "You're on the way" : `${ namValStr } is on the way`                                                          // What: Way Line. Why: Leaving is said plainly. How: This names who's on the way.


};

// #endregion Constants



// #region Helpers

const limMesFun = ( resTimNum : number ) : string => `Today's photo limit has been reached. More photos can be sent from ${ new Date( resTimNum ).toLocaleTimeString( [], { hour : 'numeric', minute : '2-digit' } ) }.`; // What: Limit Message Function. Why: A member at a day's limit should know when they can send more (Section 22). How: This words the message with the reset's time on the device's clock.



const mesMerFun = ( preRecArr : MesRecTyp[], mesRecObj : MesRecTyp ) : MesRecTyp[] => [ ...preRecArr.filter( ( preRecObj ) => preRecObj.mesIdeStr !== mesRecObj.mesIdeStr ), mesRecObj ].sort( ( recOneObj, recTwoObj ) => recOneObj.sntTimNum - recTwoObj.sntTimNum ); // What: Message Merge Function. Why: A message can arrive twice, once as sent and again from the watch with the server's time. How: This replaces any copy by ID and keeps the list in time order.



const staOnlFun = ( texValStr : string ) : Exclude< ReturnType< typeof staKinFun >, 'img' > => { // What: Status Only Function. Why: A photo message is written like a status post but shows as a message. How: This reads a post's status kind, null for a photo message as for a typed one.


	const staKinStr = staKinFun( texValStr ); // What: Status Kind String. Why: The kind decides how the post shows. How: This reads it.



	return staKinStr === 'img' ? null : staKinStr; // What: Kind Return. Why: Only a real status post shows as a line. How: This returns the kind, or null for a photo message.


};

// #endregion Helpers



// #region Hooks

// #region useChaDatFun

/**
 * useChaDatFun = Use Chat Data Function
 *
 * @summary
 * Loads and watches what a group's chat shows: this member's UID, the members,
 * the next event that hasn't ended, the latest to have started, the history
 * kept on the device, and each message the watch hands on, kept in time order
 * without repeats. A message from someone not among the members reads the
 * members again. A refused watch starts again after a second, and a group
 * whose key is waiting to be shared reports KEY_WAI_STR as the chat's error.
 * Use it in a component keyed by the group, so a new group starts afresh.
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
	const [ eveIdeArr, setEveIdeArr ] = useState< string[] >( [] );                           // What: Event Identifier Array And Setter. Why: A photos line opens its event only while the event still exists. How: This holds the IDs of the events not yet deleted.
	const [ eveNexObj, setEveNexObj ] = useState< EveRecTyp | null >( null );                 // What: Event Next Object And Setter. Why: The next event is pinned. How: This holds it, null when none is planned.
	const [ eveRunObj, setEveRunObj ] = useState< EveRecTyp | null >( null );                 // What: Event Running Object And Setter. Why: A chat photo can go to an event's photos from its start until it's deleted (Section 22). How: This holds the latest event to have started that still exists, null when none has.
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



		const watStaFun = () : void => void chaWatFun( groIdeStr, ( mesRecObj ) => { // What: Watch Start Function. Why: Messages show as they arrive, and a refused watch has to start again. How: This watches the chat, adding each message, reads the device's history again once it runs, and schedules another start when it fails.


			if ( !actValBoo ) return; // What: Closed Guard. Why: The chat may have closed. How: This ignores the message.



			if ( !memUidRef.current.has( mesRecObj.senUidStr ) ) memLoaFun(); // What: Newcomer Read Call. Why: A sender not among the members joined after they were read. How: This reads them again.

			setMesRecArr( ( preRecArr ) => mesMerFun( preRecArr, mesRecObj ) ); // What: Message Merge Call. Why: The log shows the message. How: This merges it in.


		}, ( errCatObj ) => { // What: Watch Error Handler. Why: A watch refused before the mirror holds this member has to try again. How: This logs it and starts again after a second.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The refusal stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) retTimNum = window.setTimeout( watStaFun, RET_MIL_NUM ); // What: Retry Call. Why: The mirror usually catches up within a moment. How: This starts the watch again after the wait.


		} ).then( ( stoFunVal ) => { // What: Watch Started Handler. Why: The cleanup has to stop the watch, a chat closed first stops it at once, and a message this device sent before the watch ran had no watch to reach. How: This keeps the stop, or calls it, and reads the device's history again.


			if ( !actValBoo ) { stoFunVal(); return; } // What: Late Stop Guard. Why: The chat closed before the watch started. How: This stops it at once and returns.



			stoWatFun = stoFunVal; // What: Stop Keep Assignment. Why: The cleanup stops the watch. How: This keeps the stop.


			void mesLisFun( groIdeStr ).then( ( stoRecArr ) => { if ( actValBoo ) setMesRecArr( ( preRecArr ) => stoRecArr.reduce( mesMerFun, preRecArr ) ); } ); // What: History Reread Call. Why: A message this device sent before the watch ran, as the outbox does on coming back online, was kept on the device with no watch to hand it to, and in a group of one the server deletes it at once, so only the device still has it (measured 2026-11-11). How: Once the watch runs, this merges the device's history in again, which merging by ID keeps from repeating.


		}, ( errCatObj : unknown ) => { // What: Watch Failure Handler. Why: The watch couldn't start, such as while the key waits to be shared. How: This shows the waiting message for a waiting key, and otherwise logs the failure and tries again after a second.


			if ( !actValBoo ) return; // What: Closed Guard. Why: The chat may have closed. How: This ignores the failure.



			if ( errCatObj instanceof Error && errCatObj.message === KEY_WAI_STR ) { setChaErrStr( KEY_WAI_STR ); return; } // What: Waiting Key Guard. Why: A key waiting to be shared won't arrive by retrying soon, and the member should know why the chat is empty. How: This shows the waiting message and stops.



			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			retTimNum = window.setTimeout( watStaFun, RET_MIL_NUM ); // What: Retry Call. Why: A failure such as a dropped connection may pass. How: This starts the watch again after the wait.


		} );



		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: A member's own messages sit on their side. How: This reads their UID.

		void eveLisFun( groIdeStr ).then( ( eveRecArr ) => { // What: Event Read Call. Why: The next event that hasn't ended is pinned, and photos lines open events that still exist. How: This lists the events, soonest first, and keeps the first one still to come or under way, and every event's ID.


			if ( !actValBoo ) return; // What: Stale Guard. Why: The chat may have closed. How: This ignores the result.



			setEveIdeArr( eveRecArr.map( ( eveRecObj ) => eveRecObj.eveIdeStr ) ); // What: Identifiers Set Call. Why: A photos line opens its event while it's listed. How: This keeps every event's ID.

			setEveNexObj( eveRecArr.find( ( eveRecObj ) => eveRecObj.endTimNum > Date.now() ) ?? null ); // What: Next Set Call. Why: The next event is pinned. How: This keeps the first still to come or under way.

			setEveRunObj( eveRecArr.filter( ( eveRecObj ) => eveRecObj.staTimNum <= Date.now() ).at( -1 ) ?? null ); // What: Running Set Call. Why: A chat photo can join the photos of an event that has started, until it's deleted 48 hours after it ends. How: This keeps the latest to have started of the events still listed.


		}, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Read Failure Handler. Why: The failure stays visible to someone debugging. How: This logs it.

		void mesLisFun( groIdeStr ).then( ( stoRecArr ) => { if ( actValBoo ) setMesRecArr( ( preRecArr ) => stoRecArr.reduce( mesMerFun, preRecArr ) ); } ); // What: History Read Call. Why: The chat opens with what the device kept. How: This merges each stored message in.

		memLoaFun(); // What: Member Load Call. Why: Senders are shown by name and color. How: This reads the members.

		watStaFun(); // What: Watch Start Call. Why: New messages show as they're sent. How: This starts the watch.



		return () => { // What: Chat Cleanup. Why: Nothing should keep running once the chat closes. How: This marks it closed and stops the watch and any retry.


			actValBoo = false; // What: Inactive Set. Why: Late results mustn't act. How: This marks the chat closed.

			window.clearTimeout( retTimNum ); // What: Retry Clear Call. Why: A waiting retry would start a watch nobody stops. How: This cancels it.

			stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


		};


	}, [ groIdeStr ] ); // What: Effect Dependency Array. Why: Each group's chat loads afresh. How: groIdeStr changes when another group's chat opens.



	return { chaErrStr, eveIdeArr, eveNexObj, eveRunObj, memRecMap, mesAddFun, mesRecArr, uidValStr }; // What: Chat Data Return. Why: The chat shows each part. How: This returns them.


};

// #endregion useChaDatFun

// #endregion Hooks



// #region Components

type CicProTyp = { groIdeStr : string, namStr : string, onLoaFun : () => void, onOpeFun : ( bytArr : Uint8Array< ArrayBuffer > ) => void, phoIdeStr : string }; // What: Chat Image Component Props Type. Why: A message's photo is found by its group and ID, named for its sender, and opens its viewer. How: This types ChaImaCom's props.

// #region ChaImaCom

/**
 * ChaImaCom = Chat Image Component
 *
 * @summary
 * Renders a photo message's photo, decrypted from the copy kept on this
 * device, as a button that opens it whole. While it decrypts it says so, and
 * once the device no longer keeps it, cleared by age or by the member, or
 * never fetched, it says the photo isn't on this device.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groIdeStr - Group Identifier String: The group whose chat it
 *                          is.
 * @param props.namStr    - Name String: The sender's name, empty for the
 *                          member themselves.
 * @param props.onLoaFun  - On Load Function: Runs once the image has loaded
 *                          and taken its height.
 * @param props.onOpeFun  - On Open Function: Opens the viewer on the photo's
 *                          bytes.
 * @param props.phoIdeStr - Photo Identifier String: The photo's ID.
 *
 * @returns The photo's button, or a note in its place.
 *
 * @example
 * ```tsx
 * ChaImaCom({ groIdeStr, namStr, onLoaFun, ... }) // => <ChaImaCom />
 * ```
 *
*/

function ChaImaCom ( { groIdeStr, namStr, onLoaFun, onOpeFun, phoIdeStr } : CicProTyp ) : React.JSX.Element {


	const [ phoBytArr, setPhoBytArr ] = useState< Uint8Array< ArrayBuffer > | null | undefined >( undefined ); // What: Photo Bytes Array And Setter. Why: The photo shows once decrypted, or a note once it's known to be gone. How: This holds the bytes, null when the device doesn't keep it, and undefined while it decrypts.


	const phoUrlObj = useBytUrlFun( phoBytArr ?? null ); // What: Photo URL Object. Why: The image shows the photo by address. How: This makes one for its bytes, null until then.



	useEffect( () => { // What: Photo Load Effect. Why: The photo is read from the device as the message shows. How: This decrypts it, keeping the result while the message is shown, and logs a failure as a photo not kept.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the message is gone mustn't change it. How: This is true until the cleanup runs.


		chpGetFun( groIdeStr, phoIdeStr ).then( ( bytValArr ) => { if ( actValBoo ) setPhoBytArr( bytValArr ); }, ( errCatObj : unknown ) => { console.warn( errCatObj ); if ( actValBoo ) setPhoBytArr( null ); } ); // What: Photo Read Call. Why: The kept copy is decrypted once and held. How: This keeps the bytes, or null when none is kept or it fails.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: Late reads mustn't land. How: This marks the message gone.


	}, [ groIdeStr, phoIdeStr ] ); // What: Effect Dependency Array. Why: Each photo is read once. How: groIdeStr and phoIdeStr name it.



	if ( phoBytArr === null ) return <p className={ cssModObj.mesNotPar }>This photo is no longer on this device.</p>; // What: Gone Return. Why: A photo cleared from the device, or never fetched, still leaves its message. How: This says it isn't here.



	if ( phoBytArr === undefined || phoUrlObj?.bytArr !== phoBytArr ) return <p className={ cssModObj.mesNotPar }>Loading the photo…</p>; // What: Loading Return. Why: The photo takes a moment to decrypt and get its address. How: This says it's on its way.



	return (


		<button
			className={ cssModObj.mesPhoBut }

			type='button'

			aria-haspopup='dialog'
			aria-label={ namStr === '' ? 'Open your photo' : `Open ${ namStr }'s photo` }

			onClick={ () => onOpeFun( phoBytArr ) }
		>{ /* What: Message Photo Button Element. Why: A chat photo shows small in the log and opens whole to save. How: This holds the image and opens the viewer on its bytes. */ }


			<img
				className={ cssModObj.mesPhoIma }

				alt=''
				src={ phoUrlObj.urlStr }

				onLoad={ onLoaFun } // What: Load Handler. Why: The image takes its height only once loaded, which can push the log's end out of view. How: This tells the chat, which keeps the log at its end when it sat there.
			/>{ /* What: Message Photo Image Element. Why: The member sees the photo in the chat, while the button names it. How: This shows it, hidden from screen readers by its empty alt. */ }


		</button>


	);


}

// #endregion ChaImaCom



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



type GccProTyp = { groIdeStr : string, groNamStr : string, ownBoo : boolean }; // What: Group Chat Component Props Type. Why: The chat belongs to one group, whose name the composer shows and whose owner can delete any photo of the next event. How: This types GroChaCom's props.

// #region GroChaCom

/**
 * GroChaCom = Group Chat Component
 *
 * @summary
 * Renders the open group's chat: the pinned next event when there is one,
 * the log, which is a live region so new messages and status lines are
 * announced, and the composer. The log scrolls itself, staying at its newest
 * message while someone reads there and when they send one. Enter sends and
 * Shift+Enter starts a new line. A message with characters the chat
 * refuses, or a send that fails, is announced beside the composer, and the
 * text stays to try again. Key it by the group, so a new group starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groIdeStr - Group Identifier String: The group whose chat it
 *                          is.
 * @param props.groNamStr - Group Name String: The group's name, shown in the
 *                          composer's hint.
 * @param props.ownBoo    - Owner Boolean: Whether the member owns the
 *                          group, so can delete any of the event's photos.
 *
 * @returns The chat.
 *
 * @example
 * ```tsx
 * GroChaCom({ groIdeStr, groNamStr, ownBoo }) // => <GroChaCom />
 * ```
 *
*/

function GroChaCom ( { groIdeStr, groNamStr, ownBoo } : GccProTyp ) : React.JSX.Element {


	const filInpRef = useRef< HTMLInputElement >( null );                                // What: File Input Reference. Why: The photo button opens the device's photo picker. How: This holds the hidden file input it clicks.
	const logBotRef = useRef( true );                                                    // What: Log Bottom Reference. Why: The log follows new messages only while someone reads at its end. How: This holds whether it sits at its bottom.
	const logEleRef = useRef< HTMLDivElement >( null );                                  // What: Log Element Reference. Why: The log scrolls itself. How: This holds its element.
	const sheHanRef = useRef< SheHanTyp >( null );                                       // What: Sheet Handle Reference. Why: The pinned event opens its sheet. How: This holds the sheet's handle.
	const uplSenRef = useRef< { chpSenObj : ChpSenTyp, filObj : File } | null >( null ); // What: Upload Sent Reference. Why: A photo whose message was refused, such as just after a group is made, is sent again without being counted again. How: This holds the last uploaded photo with the file it came from.
	const vieHanRef = useRef< SheHanTyp >( null );                                       // What: Viewer Handle Reference. Why: A tapped photo opens its viewer. How: This holds the viewer's handle.

	const [ penRecArr, setPenRecArr ] = useState< OutRecTyp[] >( [] );                                 // What: Pending Record Array And Setter. Why: Messages written offline show in the log until they're sent. How: This holds the group's waiting messages, oldest first.
	const [ eveAddBoo, setEveAddBoo ] = useState( false );                                             // What: Event Add Boolean And Setter. Why: A photo can go to the running event's photos instead of the chat. How: This is true while the member has picked that.
	const [ phoSelObj, setPhoSelObj ] = useState< { filObj : File, urlStr : string } | null >( null ); // What: Photo Selected Object And Setter. Why: A picked photo shows above the box until it's sent or removed. How: This holds the file and its preview's address, null when none is picked.
	const [ vieRecObj, setVieRecObj ] = useState< CpvRecTyp | null >( null );                          // What: Viewer Record Object And Setter. Why: The viewer shows the photo tapped. How: This holds it, null while the viewer is closed.
	const [ senErrStr, setSenErrStr ] = useState( '' );                                                // What: Send Error String And Setter. Why: A refused or failed send is announced. How: This holds the message, empty when there's none.
	const [ senReqBoo, setSenReqBoo ] = useState( false );                                             // What: Send Request Boolean And Setter. Why: A second send while the first is out would send twice. How: This is true while one is out.
	const [ texValStr, setTexValStr ] = useState( '' );                                                // What: Text Value String And Setter. Why: The composer shows what's typed. How: This holds it.


	const scrOpeFun = useScrOpeFun(); // What: Screen Open Function. Why: A photos line opens its event in the Events section. How: This reads the function that opens a screen.

	const { chaErrStr, eveIdeArr, eveNexObj, eveRunObj, memRecMap, mesAddFun, mesRecArr, uidValStr } = useChaDatFun( groIdeStr ); // What: Chat Data. Why: The chat shows what the hook loads. How: This reads each part.



	useLayoutEffect( () => { // What: Log Follow Effect. Why: Someone reading at the end should see each new message without scrolling. How: This moves the log to its bottom after a change, when it sat there before.


		if ( logBotRef.current && logEleRef.current ) logEleRef.current.scrollTop = logEleRef.current.scrollHeight; // What: Bottom Scroll Call. Why: The newest message is at the bottom. How: This scrolls the log there.


	}, [ mesRecArr, penRecArr ] ); // What: Effect Dependency Array. Why: The log moves when its messages change. How: mesRecArr changes as each one arrives, and penRecArr as one waits or sends.



	const logEndFun = () : void => { if ( logBotRef.current && logEleRef.current ) logEleRef.current.scrollTop = logEleRef.current.scrollHeight; }; // What: Log End Function. Why: A photo takes its height only once loaded, which can push the newest message out of view. How: This moves the log to its bottom again when it sat there.



	useEffect( () => () => { if ( phoSelObj !== null ) URL.revokeObjectURL( phoSelObj.urlStr ); }, [ phoSelObj ] ); // What: Preview Free Effect. Why: A picked photo's preview address holds the file in memory until freed. How: This frees it once the photo is replaced, removed, or sent, or the chat closes.



	useEffect( () => { // What: Outbox Watch Effect. Why: The log shows the group's waiting messages until they're sent. How: This reads them now and again after each change to the outbox, stopping with the chat.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the chat closed mustn't change it. How: This is true until the cleanup runs.



		const outLoaFun = () : void => void outLisFun( groIdeStr ).then( ( outRecArr ) => { if ( actValBoo ) setPenRecArr( outRecArr ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Outbox Load Function. Why: The waiting messages change as they're kept and sent. How: This reads them while the chat is open, logging a failure.


		outLoaFun(); // What: Load Call. Why: Messages may be waiting from before. How: This reads them now.


		const stoSubFun = outSubFun( outLoaFun ); // What: Stop Subscribe Function. Why: The log follows each change. How: This reads them again on each, keeping the stop.



		return () => { // What: Cleanup Return. Why: A closed chat shouldn't keep reading. How: This marks it closed and stops following.


			actValBoo = false; // What: Inactive Set. Why: Late reads mustn't land. How: This marks the chat closed.

			stoSubFun(); // What: Stop Call. Why: The listener goes. How: This stops following.


		};


	}, [ groIdeStr ] ); // What: Effect Dependency Array. Why: Each group has its own waiting messages. How: groIdeStr changes when another group's chat opens.



	// #region senMesFun

	/**
	 * senMesFun = Send Message Function
	 *
	 * @summary
	 * Sends what's typed, with the picked photo when there is one: ignores an
	 * empty message or one while another is out, announces a message the chat
	 * refuses, and otherwise sends it, adds it to the log at once, clears the
	 * composer, and keeps the log at its end. While the device is offline, or
	 * the chat can't reach its database, it keeps a message on the device to
	 * send later instead, where the log shows it waiting, while a photo says
	 * it has to wait for a connection. A photo past the day's limits says when
	 * more can be sent. A failed send is announced and leaves the text and the
	 * photo to try again.
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

	const senMesFun = async () : Promise< void > => { // What: Send Message Function. Why: The composer sends messages and photos. How: This checks, sends, and shows one.


		const norTexStr = linNorFun( texValStr ); // What: Normalized Text String. Why: The message is checked as it'll be sent. How: This tidies each line.


		if ( senReqBoo || ( norTexStr === '' && phoSelObj === null ) ) return; // What: Empty Guard. Why: Nothing is sent twice at once or empty, while a photo needs no caption. How: This ignores the send.



		if ( norTexStr !== '' && !chaMesFun( norTexStr ) ) { setSenErrStr( "This message has characters that can't be sent." ); return; } // What: Refused Text Guard. Why: The chat refuses invisible and reversing characters, and the sender should know. How: This announces it and stops.



		setSenErrStr( '' ); // What: Error Clear Call. Why: An earlier problem no longer applies. How: This empties the alert.

		setSenReqBoo( true ); // What: Sending Set Call. Why: The composer waits for the send. How: This marks one as out.



		try { // What: Send Try. Why: The message or photo is sent and shown at once. How: This sends it, adds the sender's copy to the log, and clears the composer, or keeps a message to send later while offline.


			const offValBoo = !onlNowFun() || !linNowFun(); // What: Offline Value Boolean. Why: A send would hang until the device or the chat's connection is back, and be lost if the app closed first. How: This is true while either is down.


			if ( phoSelObj !== null && offValBoo ) setSenErrStr( OFF_PHO_STR ); // What: Offline Photo Branch. Why: A photo has to upload to be counted, so it can't wait on the device. How: This says it has to wait, keeping it picked.

			else if ( phoSelObj !== null && eveAddBoo && eveRunObj !== null ) { // What: Event Photo Branch. Why: A member can add the photo to the running event's photos instead, where it joins the grid and its limits (Section 22). How: This shares it to the event, ends the burst so its line posts, and sends what's typed as a message of its own.


				await phoAddFun( groIdeStr, eveRunObj.eveIdeStr, eveRunObj.titTexStr, phoSelObj.filObj ); // What: Event Add Call. Why: The photo joins the event's photos. How: This shrinks, encrypts, counts, and uploads it.

				phoFluFun(); // What: Burst End Call. Why: The chat says the member shared photos for the event. How: This posts the burst's line.


				if ( norTexStr !== '' ) mesAddFun( { groIdeStr, mesIdeStr : await chaSenFun( groIdeStr, norTexStr ), senUidStr : ( await ideEnsFun() ).uidValStr, sntTimNum : Date.now(), texValStr : norTexStr } ); // What: Caption Send Call. Why: What was typed with the photo still reaches the chat. How: This sends it as a message and shows the sender's copy.


				logBotRef.current = true; // What: Bottom Set. Why: Someone who sends wants to see the line. How: This keeps the log at its end.

				setPhoSelObj( null ); // What: Photo Clear Call. Why: The photo is shared. How: This removes it from the composer.

				setTexValStr( '' ); // What: Composer Clear Call. Why: The text is sent. How: This empties the box.


			}

			else if ( phoSelObj !== null ) { // What: Photo Branch. Why: A picked photo is sent with what's typed as its caption. How: This sends it and shows the sender's copy.


				const chpSenObj = uplSenRef.current?.filObj === phoSelObj.filObj ? uplSenRef.current.chpSenObj : await chaUplFun( groIdeStr, phoSelObj.filObj, norTexStr ); // What: Chat-Photo Sent Object. Why: A photo already uploaded for a message that didn't go needn't count again. How: This reuses that upload for the same file, or uploads it.


				uplSenRef.current = { chpSenObj, filObj : phoSelObj.filObj }; // What: Upload Keep Assignment. Why: The message may still be refused. How: This keeps the upload for a retry.


				const cifResObj = await chaImgFun( groIdeStr, chpSenObj, norTexStr ); // What: Chat-Image-Function Result Object. Why: The watch's copy replaces this one by ID. How: This sends the message naming the photo.


				logBotRef.current = true; // What: Bottom Set. Why: Someone who sends wants to see their photo. How: This keeps the log at its end.

				mesAddFun( { groIdeStr, mesIdeStr : cifResObj.mesIdeStr, senUidStr : ( await ideEnsFun() ).uidValStr, sntTimNum : Date.now(), texValStr : cifResObj.texValStr } ); // What: Message Add Call. Why: The sender sees their photo at once, as theirs even before the chat has read their UID. How: This adds it under the identity's UID with this device's time until the watch's copy arrives.

				setPhoSelObj( null ); // What: Photo Clear Call. Why: The photo is sent. How: This removes it from the composer.

				setTexValStr( '' ); // What: Composer Clear Call. Why: The caption is sent. How: This empties the box.


			}

			else if ( offValBoo ) { // What: Offline Branch. Why: A message shouldn't hang or be lost while the connection is down. How: This keeps it on the device instead, where the log shows it waiting.


				await chaQueFun( groIdeStr, norTexStr ); // What: Queue Call. Why: The message sends once the device is back online. How: This keeps it on the device, which the outbox watch shows.

				logBotRef.current = true; // What: Bottom Set. Why: Someone who writes wants to see their message. How: This keeps the log at its end.

				setTexValStr( '' ); // What: Composer Clear Call. Why: The message is kept. How: This empties the box.


			}

			else { // What: Online Branch. Why: A message sends at once while connected. How: This sends it and shows the sender's copy.


				const mesIdeStr = await chaSenFun( groIdeStr, norTexStr ); // What: Message Identifier String. Why: The watch's copy replaces this one by ID. How: This sends the message.


				logBotRef.current = true; // What: Bottom Set. Why: Someone who sends wants to see their message. How: This keeps the log at its end.

				mesAddFun( { groIdeStr, mesIdeStr, senUidStr : ( await ideEnsFun() ).uidValStr, sntTimNum : Date.now(), texValStr : norTexStr } ); // What: Message Add Call. Why: The sender sees their message at once, as theirs even before the chat has read their UID. How: This adds it under the identity's UID with this device's time until the watch's copy arrives.

				setTexValStr( '' ); // What: Composer Clear Call. Why: The message is sent. How: This empties the box.


			}


		}

		catch ( errCatObj ) { // What: Send Catch. Why: A failed send has to be told, keeping the text and the photo. How: This logs it and announces it, saying when more photos can be sent once a day's limit is reached.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.


			const resTimNum = errCatObj instanceof RangeError ? Number( errCatObj.message ) : Number.NaN; // What: Reset Time Number. Why: A photo past a day's limit is refused with the time the limits reset. How: This reads that time, not a number for any other failure.


			setSenErrStr( Number.isFinite( resTimNum ) ? limMesFun( resTimNum ) : Reflect.get( Object( errCatObj ), 'code' ) === 'permission-denied' && eveAddBoo ? EVE_FUL_STR : phoSelObj !== null ? FAI_PHO_STR : FAI_MES_STR ); // What: Failure Announce Call. Why: The sender has to learn it failed, and why when they can. How: This puts the limit's message, an event's full photos, or the photo's or the message's failure, in the alert.


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



			<div className={ cssModObj.chaNudDiv }>{ /* What: Chat Nudge Div Element. Why: The chat's cards sit between the pinned event and the log, taking no room while none shows. How: This stacks them in their own area. */ }


				<PusNudCom className={ cssModObj.pusNudDiv } />{ /* What: Push Nudge Component. Why: A device that hasn't been asked about notifications is offered them once, with no pressure (Section 11.1). How: This shows the card first among the chat's cards. */ }



				<StoNudCom
					className={ cssModObj.stoNudDiv }
					groIdeStr={ groIdeStr }
				/>{ /* What: Storage Nudge Component. Why: A device short of room should hear the chat photos can be cleared (Section 22). How: This shows the card below the notifications card when it should. */ }


			</div>



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


				) : mesRecArr.length === 0 && penRecArr.length === 0 ? ( // What: No Messages Check. Why: An empty chat says so. How: This shows a prompt in place of the messages.


					<p className={ cssModObj.chaEmpPar }>No messages yet. Say hi!</p> // What: Chat Empty Paragraph Element. Why: An empty chat should invite the first message. How: This says nothing's been said.


				) : ( // What: Messages Branch. Why: A chat with messages lists them. How: This renders the list.


					<ol className={ cssModObj.chaMesOrd }>{ /* What: Chat Messages Ordered List Element. Why: The messages read in the order they were sent. How: This lists them, oldest first. */ }


						{ mesRecArr.map( ( mesRecObj, mesIndNum ) => { // What: Message Map. Why: Each message gets its own entry. How: This renders one per message, joining a sender's messages close together into one run.


							const memRecObj = memRecMap.get( mesRecObj.senUidStr );                                                                  // What: Member Record Object. Why: The message shows its sender. How: This looks them up, undefined for someone who left.
							const ownMesBoo = mesRecObj.senUidStr === uidValStr;                                                                     // What: Own Message Boolean. Why: The member's own messages sit on their side. How: This compares the sender with them.
							const preRecObj = mesRecArr[ mesIndNum - 1 ] as MesRecTyp | undefined;                                                   // What: Previous Record Object. Why: A message close after its sender's last continues their run. How: This reads the one before it. // What: Type Assertion Note. Why: The first message has none before it. How: The as reads it as possibly missing.
							const senNamStr = memRecObj?.namTexStr || ( memRecObj ? 'Someone' : 'Former member' );                                   // What: Sender Name String. Why: A message names its sender, even one with no name yet or who left. How: This takes their name, or a stand-in.
							const staKinStr = staOnlFun( mesRecObj.texValStr );                                                                      // What: Status Kind String. Why: A status post shows as a line rather than a message. How: This reads its kind, null for a typed message or a photo.
							const briDetObj = staKinStr === 'add' || staKinStr === 'cla' ? briDetFun( mesRecObj.texValStr ) : null;                  // What: Bring Details Object. Why: A bring-list line opens its event at the list. How: This reads the post's details, null for any other line.
							const phoDetObj = staKinStr === 'pho' ? staDetFun( mesRecObj.texValStr ) : null;                                         // What: Photos Details Object. Why: A photos line opens its event. How: This reads the post's event, null for any other line.
							const linEveStr = phoDetObj?.eveIdeStr ?? briDetObj?.eveIdeStr;                                                          // What: Line Event String. Why: A photos or bring-list line leads to its event. How: This reads the event's ID, undefined for any other line.
							const staLinStr = staKinStr === null ? '' : STA_LIN_OBJ[ staKinStr ]( ownMesBoo ? '' : senNamStr, mesRecObj.texValStr ); // What: Status Line String. Why: A status post reads as its line. How: This words it for its kind, empty for a typed message.



							if ( staKinStr !== null ) return ( // What: Status Return. Why: A status post says who's on their way, has arrived, just shared photos, or added to or claimed from a list, in a line of its own. How: This returns its list item.


								<li
									key={ mesRecObj.mesIdeStr }

									className={ cssModObj.chaStaIte }
								>{ /* What: Chat Status Item Element. Why: Leaving, arriving, shared photos, and bring-list changes show at a glance in the chat (Sections 10, 11.5, and 20). How: This centers the sender's color dot beside the line and its time. */ }


									<span
										className={ cssModObj.staDotSpa }
										style={{ backgroundColor : memRecObj ? sloColFun( memRecObj.colSloNum ) : undefined }} // What: Dot Color Note. Why: A status line wears its member's color, and someone who left keeps the plain look. How: This reads their slot's token.

										aria-hidden='true'
									/>{ /* What: Status Dot Span Element. Why: The member's color ties the line to them at a glance. How: This draws a small circle, hidden from screen readers, which read the name. */ }

									<p className={ cssModObj.staTexPar }>{ linEveStr !== undefined && eveIdeArr.includes( linEveStr ) ? <button className={ cssModObj.staEveBut } type='button' onClick={ () => scrOpeFun( { eveStr : linEveStr, groStr : groIdeStr, parStr : briDetObj !== null ? 'list' : undefined, scrStr : 'group', secStr : 'events' } ) }>{ staLinStr }</button> : staLinStr } <span className={ cssModObj.staTimSpa }>{ mesTimFun( mesRecObj.sntTimNum, Date.now() ) }</span></p>{ /* What: Status Text Paragraph Element. Why: The line says who and what, then when, and a photos or bring-list line leads to its photos or list while its event still exists (Sections 11.5 and 20). How: This shows the line for its kind, as a button that opens the event in the Events section at its photos or list for such a line whose event is still listed, and the time after it. */ }


								</li>


							);



							const imgDetObj = imgDetFun( mesRecObj.texValStr );                                                                                      // What: Image Details Object. Why: A photo message shows its photo and caption. How: This reads them, null for a typed message.
							const preStaBoo = preRecObj !== undefined && staOnlFun( preRecObj.texValStr ) !== null;                                                  // What: Previous Status Boolean. Why: A status line between two messages breaks their run. How: This is true when the one before is a status post.
							const conRunBoo = !preStaBoo && preRecObj?.senUidStr === mesRecObj.senUidStr && mesRecObj.sntTimNum - preRecObj.sntTimNum < GAP_MIL_NUM; // What: Continued Run Boolean. Why: A run shows its sender once. How: This is true when the message before it is the same sender's, not a status post, within five minutes.



							return ( // What: Message Return. Why: Each message is one entry. How: This returns its list item.


								<li
									key={ mesRecObj.mesIdeStr }

									className={` ${ cssModObj.chaMesIte }   ${ ownMesBoo ? cssModObj.chaMesIteOwn : '' }   ${ conRunBoo ? cssModObj.chaMesIteRun : '' }   ${ imgDetObj !== null ? cssModObj.chaMesItePhoto : '' } `}
								>{ /* What: Chat Message Item Element. Why: A message shows who sent it, when, and what they said or the photo they sent. How: This lays the avatar beside the sender, time, and text or photo, on the member's own side for their messages. */ }


									{ !ownMesBoo && !conRunBoo && ( // What: Avatar Check. Why: A run shows its sender's avatar once, and the member's own messages need none. How: This shows it on another member's first message in a run.


										<span
											className={ cssModObj.mesAvaSpa }
											style={{ backgroundColor : memRecObj ? sloColFun( memRecObj.colSloNum ) : undefined }} // What: Avatar Color Note. Why: Each member wears their own color, and someone who left keeps the plain look. How: This reads their slot's token.

											aria-hidden='true'
										>{ /* What: Message Avatar Span Element. Why: An avatar in the sender's color tells members apart at a glance, while their name is read beside it. How: This shows their photo or initials, hidden from screen readers. */ }


											<AvaConCom
												className={ cssModObj.mesAvaIma }

												avaIdeStr={ memRecObj?.avaIdeStr ?? '' }
												avaIvaArr={ memRecObj?.avaIvaArr ?? null }
												groIdeStr={ groIdeStr }
												iniTexStr={ iniTexFun( senNamStr ) }
												uidValStr={ mesRecObj.senUidStr }
											/>{ /* What: Avatar Contents Component. Why: A member with a profile photo is shown by it, and anyone else by their initials (Section 21). How: This fills the circle with the photo once it loads, or the initials. */ }


										</span>


									) }

									<p className={ cssModObj.mesMetPar }>{ /* What: Message Meta Paragraph Element. Why: Who sent it and when head the message, and a screen reader reads them with it. How: This shows the sender and time, hidden from sight within a run and for the member's own. */ }


										<span className={ cssModObj.mesNamSpa }>{ ownMesBoo ? 'You' : senNamStr }</span>{ /* What: Message Name Span Element. Why: The sender is named. How: This shows their name, or "You". */ }

										<span className={ cssModObj.mesTimSpa }>{ mesTimFun( mesRecObj.sntTimNum, Date.now() ) }</span>{ /* What: Message Time Span Element. Why: The message says when it was sent. How: This shows its time. */ }


									</p>



									{ imgDetObj === null ? ( // What: Photo Check. Why: A photo message shows its photo where a message shows its words. How: This shows the words of a typed message, or the photo and its caption.


										<p className={ cssModObj.mesTexPar }>{ mesRecObj.texValStr }</p> // What: Message Text Paragraph Element. Why: The message's words are what was said. How: This shows them, keeping their line breaks, as text rather than markup.


									) : ( // What: Photo Branch. Why: A photo message's bubble holds the photo above its caption. How: This renders them.


										<div className={ cssModObj.mesPhoDiv }>{ /* What: Message Photo Div Element. Why: A photo and its caption read as one bubble. How: This stacks them on the bubble's color. */ }


											<ChaImaCom
												groIdeStr={ groIdeStr }
												namStr={ ownMesBoo ? '' : senNamStr }
												phoIdeStr={ imgDetObj.phoIdeStr }

												onLoaFun={ logEndFun }
												onOpeFun={ ( bytArr ) => { setVieRecObj( { bytArr, namStr : ownMesBoo ? '' : senNamStr, sntTimNum : mesRecObj.sntTimNum } ); vieHanRef.current?.opeFun(); } } // What: Open Handler. Why: A tapped photo opens whole over the chat. How: This sets the viewer's photo and opens it.
											/>{ /* What: Chat Image Component. Why: The photo shows from the copy kept on this device (Section 22). How: This shows it as a button that opens the viewer, or a note when it's gone. */ }



											{ imgDetObj.capTexStr !== '' && <p className={ cssModObj.mesCapPar }>{ imgDetObj.capTexStr }</p> }{ /* What: Caption Check. Why: A photo may be sent with words. How: This shows the caption below it, keeping its line breaks, as text. */ }


										</div>


									) }


								</li>


							);


						} ) }



						{ penRecArr.map( ( penRecObj ) => ( // What: Waiting Map. Why: Messages written offline show after the sent ones until they go. How: This renders each as the member's own message, marked as waiting.


							<li
								key={ penRecObj.locIdeStr }

								className={` ${ cssModObj.chaMesIte }   ${ cssModObj.chaMesIteOwn }   ${ cssModObj.chaMesItePending } `}
							>{ /* What: Chat Message Item Pending Element. Why: A waiting message reads as the member's own, with a note that it hasn't gone. How: This holds the meta line, the bubble, and the note. */ }


								<p className={ cssModObj.mesMetPar }>{ /* What: Message Meta Paragraph Element. Why: A screen reader hears who wrote it, as with a sent message. How: This names the member, hidden from sight like their other messages'. */ }


									<span className={ cssModObj.mesNamSpa }>You</span>{ /* What: Message Name Span Element. Why: The writer is named. How: This says "You". */ }


								</p>

								<p className={ cssModObj.mesTexPar }>{ penRecObj.texValStr }</p>{ /* What: Message Text Paragraph Element. Why: The waiting message's words show as written. How: This shows them as text. */ }

								<p className={ cssModObj.mesPenPar }>Waiting to send</p>{ /* What: Message Pending Paragraph Element. Why: The member should know the message hasn't gone yet. How: This says it's waiting. */ }


							</li>


						) ) }


					</ol>


				) }


			</div>



			<form
				className={ cssModObj.chaComFor }

				onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void senMesFun(); } } // What: Submit Handler. Why: The message is sent by the app, not by a page load. How: This cancels the browser's submit and runs the app's.
			>{ /* What: Chat Composer Form Element. Why: Members write and send messages and photos at the bottom of the chat. How: This lays the photo button, the box, and the send button in a row, a picked photo above them and the alert below. */ }


				{ phoSelObj !== null && ( // What: Preview Check. Why: A picked photo shows before it's sent, so the member can see it's the right one or remove it. How: This shows its preview while one is picked.


					<div
						className={ cssModObj.comPreDiv }

						data-element-name-hook='comPreDiv'
					>{ /* What: Composer Preview Div Element. Why: The picked photo, a note while it sends, and its remove button sit together above the box. How: This lays them in a row, and the update's busy check finds it by its hook, so a quiet reload waits while a photo is picked. */ }


						<img
							className={ cssModObj.comPreIma }

							alt='Photo to send'
							src={ phoSelObj.urlStr }
						/>{ /* What: Composer Preview Image Element. Why: The member sees the photo they picked. How: This shows it small. */ }

						<span className={ cssModObj.comPreSpa }>{ senReqBoo ? 'Sending the photo…' : '' }</span>{ /* What: Composer Preview Span Element. Why: A photo takes a moment to shrink and upload, and the member should see it's on its way. How: This says so while it sends, and is empty otherwise. */ }

						<button
							className={ cssModObj.comRemBut }

							disabled={ senReqBoo }
							type='button'

							aria-label='Remove the photo'

							onClick={ () => setPhoSelObj( null ) }
						>{ /* What: Composer Remove Button Element. Why: A member can change their mind about a picked photo. How: This removes it, off while it sends. */ }


							<IcoSvgCom
								icoNamStr='close'
								sizSteStr='bas'
							/>{ /* What: Close Icon SVG Component. Why: A cross says the button removes the photo. How: This draws it at the base step. */ }{ /* Vertical Rhythm Base ~= 14.572px */ }


						</button>



						{ eveRunObj !== null && ( // What: Event Choice Check. Why: A photo can go to an event's photos only from its start until it's deleted (Section 22). How: This offers the choice while such an event exists.


							<label className={ cssModObj.comEveLab }>{ /* What: Composer Event Label Element. Why: The whole row picks the event, a bigger target than the box alone. How: This holds the box and its words. */ }


								<input
									className={ cssModObj.comEveInp }

									checked={ eveAddBoo }
									disabled={ senReqBoo }
									type='checkbox'

									onChange={ ( chaEveObj ) => setEveAddBoo( chaEveObj.target.checked ) }
								/>{ /* What: Composer Event Input Element. Why: A box shows whether the photo goes to the event. How: This draws it, off while the photo sends. */ }

								{ `Add to ${ eveRunObj.titTexStr }'s photos instead` }{ /* What: Event Choice Text. Why: The box needs words saying where the photo goes, which also name it for a screen reader. How: This names the event. */ }


							</label>


						) }


					</div>


				) }



				<input
					ref={ filInpRef }

					accept='image/*'
					hidden
					type='file'

					onChange={ ( chaEveObj ) => { const filValObj = chaEveObj.target.files?.[ 0 ]; chaEveObj.target.value = ''; if ( filValObj !== undefined ) { setEveAddBoo( false ); setSenErrStr( '' ); setPhoSelObj( { filObj : filValObj, urlStr : URL.createObjectURL( filValObj ) } ); } } } // What: Change Handler. Why: A picked photo shows above the box, goes to the chat unless the member picks the event, and picking the same photo again should still register. How: This takes the first file, empties the input, and keeps the file with a preview address, aimed at the chat.
				/>{ /* What: Photo File Input Element. Why: The device's own picker chooses a photo, from the library or the camera. How: This is hidden, opened by the photo button, and takes images. */ }

				<button
					className={ cssModObj.comPhoBut }

					type='button'

					aria-label={ phoSelObj === null ? 'Add a photo' : 'Change the photo' }

					onClick={ () => filInpRef.current?.click() }
				>{ /* What: Composer Photo Button Element. Why: A member attaches a photo to a message (Section 22). How: This opens the device's photo picker. */ }


					<IcoSvgCom
						icoNamStr='photo'
						sizSteStr='p01'
					/>{ /* What: Photo Icon SVG Component. Why: A picture says the button adds a photo. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


				</button>

				<label
					className={ cssModObj.comLabLab }
					htmlFor='chaMesTex'
				>Message</label>{ /* What: Composer Label Label Element. Why: The box needs a name a screen reader announces. How: This names it, hidden from sight, since its hint shows instead. */ }

				<textarea
					id='chaMesTex'

					className={ cssModObj.comTexTex }

					maxLength={ 2000 }
					placeholder={ phoSelObj === null ? `Message ${ groNamStr }` : 'Add a caption' }
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
							ownBoo={ ownBoo }
							uidValStr={ uidValStr }
							varStr='pan'
						/>{ /* What: Event Details Component. Why: The panel shows the event's details and bring-list. How: This draws them. */ }


					</aside>



					<SheDiaCom
						ref={ sheHanRef }

						ideStr='eveSheHea'
						titStr={ eveNexObj.titTexStr }

						onCloFun={ () => { // What: Sheet Close Handler. Why: Closing the event means the member is done adding photos and changing the list, which the details stay mounted through. How: This ends the bursts of photos and list changes, posting their chat lines.


							phoFluFun(); // What: Photos Flush Call. Why: The details stay mounted through the close, so leaving them can't end the burst. How: This posts the photos line now.

							briFluFun(); // What: Bring Flush Call. Why: The same holds for the list's changes. How: This posts the list lines now.


						} }
					>{ /* What: Event Sheet Dialog Component. Why: Below 1,100px wide, the pinned card opens the event's details over the chat. How: This holds them in a sheet titled with the event. */ }


						<EveDetCom
							key={ eveNexObj.eveIdeStr } // What: Details Key. Why: Another event's list has to start afresh. How: This remounts the details for each event.

							eveRecObj={ eveNexObj }
							groIdeStr={ groIdeStr }
							memRecMap={ memRecMap }
							ownBoo={ ownBoo }
							uidValStr={ uidValStr }
							varStr='she'
						/>{ /* What: Event Details Component. Why: The sheet shows the event's details and bring-list. How: This draws them. */ }


					</SheDiaCom>


				</>


			) }



			<ChaPhoVieCom
				ref={ vieHanRef }

				vieRecObj={ vieRecObj }

				onCloFun={ () => setVieRecObj( null ) } // What: Viewer Close Handler. Why: A closed viewer holds no photo. How: This clears it.
			/>{ /* What: Chat Photo Viewer Component. Why: A tapped chat photo opens whole over the chat, to save. How: This draws its sheet. */ }


		</div>


	);


}

// #endregion GroChaCom

// #endregion Components



// #region Exports

export { GroChaCom }; // What: Named Export. Why: The group frame shows the open group's chat. How: This exports GroChaCom.

// #endregion Exports


