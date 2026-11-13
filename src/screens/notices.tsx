


// #region Imports

import cssModObj from './notices.module.css'; // What: CSS Module Object. Why: The sheet's list is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';          // What: Button Base Component. Why: "Got it" is the sheet's main action. How: This draws it.
import { memLisFun    } from '../state/members.ts';       // What: Member List Function. Why: A notice or a waiting item names a member. How: This reads the group's members and their names.
import { mesTimFun    } from '../utils/date.ts';          // What: Message Time Function. Why: Each notice says when it happened. How: This labels the time as briefly as it can.
import { notDisFun    } from '../state/notices.ts';       // What: Notice Dismiss Function. Why: A notice that's been seen is gone. How: This deletes it.
import { notWatFun    } from '../state/notices.ts';       // What: Notice Watch Function. Why: The sheet shows notices waiting at launch and any arriving later. How: This watches them.
import { seeLisFun    } from '../platform/seen-store.ts'; // What: Seen List Function. Why: An item shown before shouldn't open the sheet again. How: This reads the items this device has shown.
import { seeSetFun    } from '../platform/seen-store.ts'; // What: Seen Set Function. Why: The items the sheet shows are remembered. How: This keeps their keys on the device.
import { SheDiaCom    } from '../ui/sheet.tsx';           // What: Sheet Dialog Component. Why: The notices open over whatever screen shows. How: This draws the sheet.
import { useEffect    } from 'react';                     // What: Use Effect. Why: The notices are watched, the shown items read and kept, names read, and the sheet opened as entries arrive. How: This runs each after rendering.
import { useRef       } from 'react';                     // What: Use Reference. Why: The sheet opens and closes through its handle, and remembers a Review and the names asked for. How: This holds each.
import { useScrOpeFun } from '../ui/screen.ts';           // What: Use Screen Open Function. Why: A Review opens its item's section. How: This returns the function that opens a screen.
import { useScrStaFun } from '../ui/screen.ts';           // What: Use Screen State Function. Why: An item already on screen needn't open the sheet. How: This reads the screen showing.
import { useState     } from 'react';                     // What: Use State. Why: The notices, the names, the ones dismissed, and the items shown change what shows. How: This holds each.


import type { GroRecTyp } from '../state/groups.ts';  // What: Group Record Type. Why: The items name their groups. How: This types the groups.
import type { NotRecTyp } from '../state/notices.ts'; // What: Notice Record Type. Why: The sheet reads each notice's fields. How: This types them.
import type { SecNamTyp } from '../ui/screen.ts';     // What: Section Name Type. Why: Each item opens one section. How: This types its name.
import type { SheHanTyp } from '../ui/sheet.tsx';     // What: Sheet Handle Type. Why: The sheet is opened and closed from here. How: This types its handle.
import type { WaiRecTyp } from '../state/waiting.ts'; // What: Waiting Record Type. Why: The sheet shows what's waiting on the member. How: This types each item.

// #endregion Imports



/**
 * notices.tsx = Notices Sheet
 *
 * @summary
 * The sheet titled "While you were away" (ARCHITECTURE.md Section 11.1),
 * which opens by itself over whatever screen shows when something waits on
 * the member that this device hasn't shown, such as a join request, or this
 * identity has notices waiting, such as a removal, and stays live, an entry
 * arriving while it's open joining its list. A waiting item reads as a
 * sentence with a Review button that opens its section at the item, and a
 * notice as a sentence with when it happened, each naming its group and the
 * person where the group's members can still be read. "Got it", or closing
 * the sheet any other way, dismisses every notice shown and keeps every item
 * shown as seen on the device, and focus moves to the screen's main area. A
 * sheet whose entries all go while it's open, such as a request another
 * member answered, closes by itself. A notice of a kind the app doesn't know
 * is left alone.
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

const secWaiFun = ( waiRecObj : WaiRecTyp ) : SecNamTyp => waiRecObj.kinValStr === 'offer' ? 'settings' : 'people'; // What: Section Waiting Function. Why: An offer is answered in Settings and every request in People. How: This names the section an item opens.



// #region waiMesFun

/**
 * waiMesFun = Waiting Message Function
 *
 * @summary
 * Returns the sentence a waiting item shows, naming its group and the person
 * it's about: the joiner as they asked, and otherwise the member by the name
 * read from the group, or a stand-in while it can't be read.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param waiRecObj - Waiting Record Object: The item.
 * @param groNamStr - Group Name String: The item's group's name.
 * @param memNamStr - Member Name String: The person's name read from the
 *                    group, empty when it can't be read.
 *
 * @returns The sentence.
 *
 * @example
 * ```ts
 * waiMesFun(waiRecObj, 'Lake Weekend', 'Sam') // => 'Sam wants to join ...'
 * ```
 *
*/

const waiMesFun = ( waiRecObj : WaiRecTyp, groNamStr : string, memNamStr : string ) : string => { // What: Waiting Message Function. Why: Each kind of item says what's waiting in its own words. How: This picks the sentence by kind.


	const perNamStr = waiRecObj.namTexStr || memNamStr; // What: Person Name String. Why: A joiner names themself in the request, while a member's name is read from the group. How: This takes whichever is there, empty when neither is.



	if ( waiRecObj.kinValStr === 'join' ) return `${ perNamStr } wants to join ${ groNamStr }.`; // What: Join Return. Why: Someone is asking to be let in. How: This names them and the group.



	if ( waiRecObj.kinValStr === 'key' ) return `${ perNamStr || 'A member' } needs ${ groNamStr }'s key on a new device.`; // What: Key Return. Why: A member recovered onto a new device can't read the group until the key is shared. How: This names them, or a member, and the group.



	return `${ perNamStr || 'The owner' } offered you ${ groNamStr }.`; // What: Offer Return. Why: The owner wants to hand the group over. How: This names them, or the owner, and the group.


};

// #endregion waiMesFun

// #endregion Helpers



// #region Components

type NscProTyp = { groRecArr : GroRecTyp[], waiRecArr : WaiRecTyp[], watVerNum : number }; // What: Notice Sheet Component Props Type. Why: The sheet names the groups, shows what's waiting on the member, and restarts its watch when the identity may have just been made. How: This types NotSheCom's props.

// #region NotSheCom

/**
 * NotSheCom = Notice Sheet Component
 *
 * @summary
 * Watches this identity's notices and opens the sheet titled "While you were
 * away" once any of a known kind is waiting, or anything in waiRecArr this
 * device hasn't shown yet. Its "Waiting on you" part lists each new item as
 * a sentence with a Review button, oldest first, and its "What happened"
 * part each notice's message and time, newest first, with headings only
 * when both show, and a "Got it" button that closes it. The sheet shows both
 * lists live while it's open, closing by itself once both are empty. An
 * item already on screen, in the People or Settings section that holds it,
 * counts as shown without opening the sheet.
 * Names are read from each group's members, again whenever an entry names
 * someone not read yet, best effort, so a group the identity can no longer
 * read names no one. However the sheet closes, every notice it showed is
 * dismissed and hidden at once and every item it showed is kept as shown on
 * the device, and focus moves to the main area, since the sheet opened by
 * itself; a Review closes it first and then opens the item's section at the
 * item instead. Changing watVerNum restarts the watch, for an identity made
 * after it started.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groRecArr - Group Record Array: The member's groups, which
 *                          name the items.
 * @param props.waiRecArr - Waiting Record Array: What's waiting on the
 *                          member.
 * @param props.watVerNum - Watch Version Number: The watch's run, which
 *                          restarts it when it changes.
 *
 * @returns The sheet, closed until something arrives.
 *
 * @example
 * ```tsx
 * NotSheCom({ groRecArr, waiRecArr, watVerNum }) // => <NotSheCom />
 * ```
 *
*/

function NotSheCom ( { groRecArr, waiRecArr, watVerNum } : NscProTyp ) : React.JSX.Element {


	const revTarRef = useRef< WaiRecTyp | null >( null ); // What: Review Target Reference. Why: A Review opens its item only once the sheet has closed, so the jump never meets the sheet's hold on the page. How: This holds the item, null when none was chosen.
	const reqKeyRef = useRef( new Set< string >() );       // What: Requested Keys Reference. Why: A group's members are read again only for someone not asked about yet. How: This holds each group and UID pair asked for.
	const scrOpeFun = useScrOpeFun();                      // What: Screen Open Function. Why: A Review opens the item's section. How: This opens a screen.
	const scrStaObj = useScrStaFun();                      // What: Screen State Object. Why: An item already on screen needn't open the sheet. How: This reads the screen showing.
	const sheHanRef = useRef< SheHanTyp >( null );         // What: Sheet Handle Reference. Why: The sheet opens when something arrives and closes from "Got it". How: This holds its handle.

	const [ disKeyArr, setDisKeyArr ] = useState< string[] >( [] );                 // What: Dismissed Key Array And Setter. Why: A dismissed notice should go at once, before its deletion reaches the watch. How: This holds the dismissed notices' keys.
	const [ namMapObj, setNamMapObj ] = useState< Record< string, string > >( {} ); // What: Name Map Object And Setter. Why: An entry names a member once their group's names are read. How: This maps each group and UID pair to a name, missing a member who can't be named.
	const [ notRecArr, setNotRecArr ] = useState< NotRecTyp[] >( [] );              // What: Notice Record Array And Setter. Why: The sheet shows what the watch reports. How: This holds the latest report.
	const [ opeSheBoo, setOpeSheBoo ] = useState( false );                          // What: Open Sheet Boolean And Setter. Why: The sheet opens once for what arrives while it's closed. How: This is true while it's open.
	const [ seeKeyArr, setSeeKeyArr ] = useState< string[] | null >( null );        // What: Seen Key Array And Setter. Why: An item shown before shouldn't open the sheet again. How: This holds the shown items' keys, null until read from the device.


	const curSecStr = scrStaObj?.scrStr === 'group' ? scrStaObj.secStr : undefined;                                                                                                                                           // What: Current Section String. Why: An item is already in view in the section showing it. How: This reads the open section, undefined off a group's screen.
	const visRecArr = notRecArr.filter( ( notRecObj ) => notRecObj.kinValStr in NOT_MES_OBJ && !disKeyArr.includes( disKeyFun( notRecObj ) ) );                                                                                // What: Visible Record Array. Why: Only notices the app can word, and not yet dismissed, show. How: This filters the report.
	const vieWaiArr = waiRecArr.filter( ( waiRecObj ) => !opeSheBoo && scrStaObj?.groStr === waiRecObj.groIdeStr && curSecStr === secWaiFun( waiRecObj ) );                                                                   // What: Viewed Waiting Array. Why: An item already on screen while the sheet is closed is as good as shown. How: This keeps the items in the group and section showing.
	const newWaiArr = seeKeyArr === null ? [] : waiRecArr.filter( ( waiRecObj ) => !seeKeyArr.includes( waiRecObj.seeKeyStr ) && !vieWaiArr.includes( waiRecObj ) );                                                          // What: New Waiting Array. Why: The sheet shows only items this device hasn't shown, once it knows which. How: This keeps the unshown ones not already on screen, none while the record loads.

	const bthParBoo = newWaiArr.length > 0 && visRecArr.length > 0; // What: Both Parts Boolean. Why: Headings help only when both parts show. How: This is true when items and notices both do.



	useEffect( () => { // What: Seen Read Effect. Why: The items shown before decide what opens the sheet. How: This reads them from the device once, counting none on a failure.


		void seeLisFun().then( setSeeKeyArr, ( errCatObj : unknown ) => { console.warn( errCatObj ); setSeeKeyArr( [] ); } ); // What: Seen Read Call. Why: A failed read shouldn't hold the sheet back forever. How: This keeps the keys, or none after logging the failure.


	}, [] ); // What: Effect Dependency Array. Why: The record is read once for the sheet's life. How: The empty list runs it once.



	useEffect( () => { // What: Viewed Keep Effect. Why: An item seen in its section shouldn't open the sheet once the member moves on. How: This adds the items on screen to the shown ones and keeps them on the device.


		if ( seeKeyArr === null || vieWaiArr.every( ( waiRecObj ) => seeKeyArr.includes( waiRecObj.seeKeyStr ) ) ) return; // What: Nothing New Guard. Why: Only an item not kept yet needs keeping, once the record is read. How: This returns otherwise.



		const nexKeyArr = [ ...seeKeyArr, ...vieWaiArr.map( ( waiRecObj ) => waiRecObj.seeKeyStr ).filter( ( seeKeyStr ) => !seeKeyArr.includes( seeKeyStr ) ) ]; // What: Next Key Array. Why: The items on screen join the ones kept. How: This adds the new keys.


		setSeeKeyArr( nexKeyArr ); // What: Seen Set Call. Why: The sheet reads the keys at once. How: This keeps them.

		seeSetFun( nexKeyArr ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Seen Save Call. Why: A launch later shouldn't show them again. How: This keeps them on the device, logging a failure.


	}, [ seeKeyArr, vieWaiArr ] ); // What: Effect Dependency Array. Why: An item comes into view as the member moves or as it arrives. How: vieWaiArr changes with the screen and the items, and seeKeyArr once read or kept.



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



	useEffect( () => { // What: Member Name Effect. Why: An entry reads better naming the member. How: This reads the members of each group naming someone not asked about yet, and maps their names.


		const neeKeyArr = [ ...notRecArr.filter( ( notRecObj ) => notRecObj.othUidStr !== '' ).map( ( notRecObj ) => `${ notRecObj.groIdeStr }/${ notRecObj.othUidStr }` ), ...waiRecArr.filter( ( waiRecObj ) => waiRecObj.namTexStr === '' ).map( ( waiRecObj ) => `${ waiRecObj.groIdeStr }/${ waiRecObj.uidValStr }` ) ].filter( ( neeKeyStr ) => !reqKeyRef.current.has( neeKeyStr ) ); // What: Needed Key Array. Why: Only someone an entry names, not asked about yet, needs their group read. How: This lists each group and UID pair still to ask for.


		neeKeyArr.forEach( ( neeKeyStr ) => reqKeyRef.current.add( neeKeyStr ) ); // What: Requested Add Call. Why: A later report shouldn't ask again for the same person. How: This marks each pair asked for.



		for ( const groIdeStr of new Set( neeKeyArr.map( ( neeKeyStr ) => neeKeyStr.split( '/' )[ 0 ] ) ) ) { // What: Group Loop. Why: Each group's members are read on their own, once per report however many it names. How: This reads each group's members, adding their names.


			memLisFun( groIdeStr ).then( ( memRecArr ) => setNamMapObj( ( preMapObj ) => ( { ...preMapObj, ...Object.fromEntries( memRecArr.map( ( memRecObj ) : [ string, string ] => [ `${ groIdeStr }/${ memRecObj.uidValStr }`, memRecObj.namTexStr ] ) ) } ) ), ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Member Read Call. Why: The members' names are encrypted with the group's key, and a group the identity can no longer read, such as one it was removed from, names no one, which the messages expect. How: This reads and decrypts them and adds each name to the map, logging a failure.


		}


	}, [ notRecArr, waiRecArr ] ); // What: Effect Dependency Array. Why: A new entry may name someone not read yet. How: notRecArr and waiRecArr change with each report.



	useEffect( () => { // What: Sheet Open Effect. Why: Notices and items waiting, or arriving while the sheet is closed, should be seen at once. How: This opens the sheet once any shows.


		if ( visRecArr.length + newWaiArr.length === 0 || opeSheBoo ) return; // What: Nothing New Guard. Why: An open sheet already shows the lists, and an empty one has nothing to say. How: This returns.



		setOpeSheBoo( true ); // What: Open Set Call. Why: The sheet opens once. How: This marks it open.

		sheHanRef.current?.opeFun(); // What: Open Call. Why: The entries should show over the screen. How: This opens the sheet.


	}, [ newWaiArr.length, opeSheBoo, visRecArr.length ] ); // What: Effect Dependency Array. Why: The sheet opens when entries show while it's closed. How: newWaiArr.length and visRecArr.length change as entries arrive, and opeSheBoo when the sheet closes.



	useEffect( () => { // What: Sheet Empty Effect. Why: An item can be answered by another member while the sheet shows it, and a sheet left with nothing in it has nothing to say. How: This closes the sheet once every entry it showed has gone.


		if ( opeSheBoo && visRecArr.length + newWaiArr.length === 0 ) sheHanRef.current?.cloFun(); // What: Empty Close Call. Why: Only an open sheet that emptied needs closing. How: This starts its closing slide, which runs the usual close.


	}, [ newWaiArr.length, opeSheBoo, visRecArr.length ] ); // What: Effect Dependency Array. Why: The sheet empties as entries go while it's open. How: newWaiArr.length and visRecArr.length change as entries go, and opeSheBoo as it opens.



	// #region cloNotFun

	/**
	 * cloNotFun = Close Notices Function
	 *
	 * @summary
	 * Runs once the sheet has closed, however it closed: dismisses and hides
	 * every notice it showed, keeps every item it showed as shown on the
	 * device, dropping the kept items no longer waiting, and marks the sheet
	 * closed. A Review chosen in it then opens the item's section at the
	 * item; otherwise focus moves to the main area, since the sheet opened by
	 * itself and focus has nowhere to return.
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

	const cloNotFun = () : void => { // What: Close Notices Function. Why: Closing the sheet any way means its entries were seen. How: This dismisses the notices, keeps the items, and opens a Review's item or focuses the main area.


		const nexKeyArr = [ ...( seeKeyArr ?? [] ).filter( ( seeKeyStr ) => waiRecArr.some( ( waiRecObj ) => waiRecObj.seeKeyStr === seeKeyStr ) ), ...newWaiArr.map( ( waiRecObj ) => waiRecObj.seeKeyStr ) ]; // What: Next Key Array. Why: The record keeps what's still waiting and was shown, so it doesn't grow forever. How: This keeps the shown keys still waiting and adds the ones just shown.
		const revTarObj = revTarRef.current;                                                                                                                                                                              // What: Review Target Object. Why: A Review chosen in the sheet opens its item now. How: This reads it.


		setDisKeyArr( ( preKeyArr ) => [ ...preKeyArr, ...visRecArr.map( disKeyFun ) ] ); // What: Hide Call. Why: The notices go at once, before their deletion reaches the watch. How: This adds their keys to the dismissed ones.

		setOpeSheBoo( false ); // What: Closed Set Call. Why: Something later should open the sheet again. How: This marks it closed.

		setSeeKeyArr( nexKeyArr ); // What: Seen Set Call. Why: The items shown shouldn't open the sheet again. How: This keeps their keys.


		revTarRef.current = null; // What: Target Clear Assignment. Why: The next close starts with no Review chosen. How: This clears it.



		for ( const notRecObj of visRecArr ) notDisFun( notRecObj.notIdeStr ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Dismiss Loop. Why: A seen notice shouldn't show on the next launch. How: This deletes each one, logging a failure.



		seeSetFun( nexKeyArr ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Seen Save Call. Why: A launch later shouldn't show the items again. How: This keeps the keys on the device, logging a failure.


		if ( revTarObj !== null ) scrOpeFun( { groStr : revTarObj.groIdeStr, scrStr : 'group', secStr : secWaiFun( revTarObj ), waiStr : `${ revTarObj.kinValStr }:${ revTarObj.uidValStr }` } ); // What: Review Open Call. Why: The member chose an item to act on. How: This opens its section as a new entry, naming the item to jump to.

		else document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The screen's content is where someone carries on. How: This focuses the main area, the skip link's target, which takes focus without joining the Tab order.


	};

	// #endregion cloNotFun



	return (


		<SheDiaCom
			ref={ sheHanRef }

			ideStr='notSheHea'
			titStr='While you were away'

			onCloFun={ cloNotFun }
		>{ /* What: Notice Sheet Dialog Component. Why: What's waiting on someone, and what happened while they were away, opens over the screen. How: This holds both parts and "Got it". */ }


			<div className={ cssModObj.notParDiv }>{ /* What: Notice Parts Div Element. Why: What's waiting and what happened are two parts of the sheet. How: This stacks them, what's waiting first. */ }


				{ newWaiArr.length > 0 && ( // What: Waiting Part Check. Why: The part shows only while something new waits. How: This shows it then.


					<section
						className={ cssModObj.notParSec }

						aria-labelledby={ bthParBoo ? 'notWaiHea' : undefined } // What: Part Label Reference. Why: The part is named by its heading, which shows only beside the other part. How: This points at the heading when it's there.
					>{ /* What: Notice Part Section Element. Why: What's waiting on the member reads as one part. How: This holds its heading and its list. */ }


						{ bthParBoo && <h3 id='notWaiHea' className={ cssModObj.notParHea }>Waiting on you</h3> }{ /* What: Notice Part Heading Check. Why: The part needs naming only beside the other. How: This shows the heading when both show. */ }



						<ul className={ cssModObj.notLisUno }>{ /* What: Notice List Unordered Element. Why: The items read as one list. How: This stacks them, oldest first. */ }


							{ newWaiArr.map( ( waiRecObj ) => ( // What: Waiting Map. Why: Each item is one entry. How: This renders an item for each.


								<li
									key={ waiRecObj.seeKeyStr }

									className={ cssModObj.notRowIte }
								>{ /* What: Notice Row Item Element. Why: An item's sentence and its Review belong together. How: This holds both. */ }


									<p className={ cssModObj.notMesPar }>{ waiMesFun( waiRecObj, groRecArr.find( ( groRecObj ) => groRecObj.ideStr === waiRecObj.groIdeStr )?.namStr ?? 'a group', namMapObj[ `${ waiRecObj.groIdeStr }/${ waiRecObj.uidValStr }` ] ?? '' ) }</p>{ /* What: Notice Message Paragraph Element. Why: The item says what's waiting. How: This shows its sentence, naming the group and the person, or stand-ins while they can't be read. */ }

									<button
										className={ cssModObj.notRevBut }

										type='button'

										aria-label={ `Review: ${ waiMesFun( waiRecObj, groRecArr.find( ( groRecObj ) => groRecObj.ideStr === waiRecObj.groIdeStr )?.namStr ?? 'a group', namMapObj[ `${ waiRecObj.groIdeStr }/${ waiRecObj.uidValStr }` ] ?? '' ) }` } // What: Review Label. Why: Several Review buttons should each say which item they open. How: This joins the word and the item's sentence.

										onClick={ () => { revTarRef.current = waiRecObj; sheHanRef.current?.cloFun(); } } // What: Review Click Handler. Why: The item opens only once the sheet has closed. How: This keeps the item to open and starts the sheet's closing slide.
									>Review</button>{ /* What: Notice Review Button Element. Why: The member goes straight to the item to act on it. How: This closes the sheet and opens the item's section at the item. */ }


								</li>


							) ) }


						</ul>


					</section>


				) }



				{ visRecArr.length > 0 && ( // What: Notices Part Check. Why: The part shows only while notices wait. How: This shows it then.


					<section
						className={ cssModObj.notParSec }

						aria-labelledby={ bthParBoo ? 'notHapHea' : undefined } // What: Part Label Reference. Why: The part is named by its heading, which shows only beside the other part. How: This points at the heading when it's there.
					>{ /* What: Notice Part Section Element. Why: What happened while the member was away reads as one part. How: This holds its heading and its list. */ }


						{ bthParBoo && <h3 id='notHapHea' className={ cssModObj.notParHea }>What happened</h3> }{ /* What: Notice Part Heading Check. Why: The part needs naming only beside the other. How: This shows the heading when both show. */ }



						<ul className={ cssModObj.notLisUno }>{ /* What: Notice List Unordered Element. Why: The notices read as one list. How: This stacks them, newest first. */ }


							{ visRecArr.map( ( notRecObj ) => ( // What: Notice Map. Why: Each notice is one entry. How: This renders an item for each.


								<li
									key={ notRecObj.notIdeStr }

									className={ cssModObj.notRowIte }
								>{ /* What: Notice Row Item Element. Why: A notice's message and time belong together. How: This holds both. */ }


									<p className={ cssModObj.notMesPar }>{ NOT_MES_OBJ[ notRecObj.kinValStr ]( notRecObj.groNamStr, namMapObj[ `${ notRecObj.groIdeStr }/${ notRecObj.othUidStr }` ] ?? '' ) }</p>{ /* What: Notice Message Paragraph Element. Why: The notice says what happened. How: This shows its kind's sentence, naming the group and, once read, the other member. */ }

									<time
										className={ cssModObj.notDatTim }

										dateTime={ new Date( notRecObj.creTimNum ).toISOString() }
									>{ mesTimFun( notRecObj.creTimNum, Date.now() ) }</time>{ /* What: Notice Date Time Element. Why: Someone should know when it happened. How: This shows the time as briefly as it reads clearly, with the exact time for machines. */ }


								</li>


							) ) }


						</ul>


					</section>


				) }


			</div>



			<ButBasCom
				className={ cssModObj.notAckBut }

				onClick={ () => sheHanRef.current?.cloFun() }
			>Got it</ButBasCom>{ /* What: Notice Acknowledge Button Component. Why: Someone who has read the sheet puts it away. How: This closes the sheet, which dismisses the notices and keeps the items as shown. */ }


		</SheDiaCom>


	);


}

// #endregion NotSheCom

// #endregion Components



// #region Exports

export { NotSheCom }; // What: Named Export. Why: The screen host shows the sheet over every screen. How: This exports NotSheCom.

// #endregion Exports


