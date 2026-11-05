


// #region Imports

import cssModObj from './join-group.module.css'; // What: CSS Module Object. Why: The screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { BraMarCom    } from '../ui/brand-mark.tsx';       // What: Brand Mark Component. Why: The invite form shows whose app it is. How: This draws the mark beside the name.
import { ButBasCom    } from '../ui/button.tsx';           // What: Button Base Component. Why: Asking to join, asking again, and trying again are each a phase's leading action. How: This draws them.
import { IcoSvgCom    } from '../ui/icon.tsx';             // What: Icon SVG Component. Why: The back button shows an arrow. How: This draws it.
import { InsNotCom    } from '../ui/install-note.tsx';     // What: Install Note Component. Why: A browser that can install the app suggests it here. How: This shows the note while the browser offers its prompt.
import { invGetFun    } from '../state/joins.ts';          // What: Invite Get Function. Why: The screen names the group its link opens. How: This reads the invite.
import { joiNotFun    } from '../core/text-limits.ts';     // What: Join Note Function. Why: A note outside its limits is caught before anything is sent. How: This checks it.
import { joiWatFun    } from '../state/joins.ts';          // What: Join Watch Function. Why: The group opens as soon as a member lets the joiner in. How: This watches the request.
import { LegLinCom    } from '../legal/links.tsx';         // What: Legal Links Component. Why: Asking to join means agreeing to the terms and the policy. How: This draws the line linking both.
import { MaiAreCom    } from '../ui/main-area.tsx';        // What: Main Area Component. Why: The invite is the screen's main content. How: This holds it in the main landmark.
import { perNamFun    } from '../core/text-limits.ts';     // What: Person Name Function. Why: A name outside its limits is caught before anything is sent. How: This checks it.
import { proKeyFun    } from '../platform/dev-profile.ts'; // What: Profile Key Function. Why: Each development member keeps its own storage. How: This names the draft's key for the current one.
import { reqCreFun    } from '../state/joins.ts';          // What: Request Create Function. Why: Sending the form asks to join. How: This files the request.
import { reqStaFun    } from '../state/joins.ts';          // What: Request Status Function. Why: Opening the link again finds a request already waiting, or a membership. How: This reads where the join stands.
import { reqWitFun    } from '../state/joins.ts';          // What: Request Withdraw Function. Why: A joiner may take their request back. How: This deletes it.
import { texNorFun    } from '../core/text-limits.ts';     // What: Text Normalize Function. Why: The name and note are checked as they'll be saved. How: This tidies them first.
import { useEffect    } from 'react';                      // What: Use Effect. Why: The invite loads as the screen opens, the request is watched while it waits, and the heading takes focus after a change. How: This runs each.
import { useRef       } from 'react';                      // What: Use Reference. Why: A field with an error takes focus, the heading takes focus after a change, and a withdrawal is told from a decline. How: This holds each.
import { useScrOpeFun } from '../ui/screen.ts';            // What: Use Screen Open Function. Why: "What is Come Hang?" opens the landing page. How: This returns the function that opens a screen.
import { useState     } from 'react';                      // What: Use State. Why: The phase, the group, the fields, their errors, and the sending states change as the join goes on. How: This holds each.

// #endregion Imports



/**
 * join-group.tsx = Join Group
 *
 * @summary
 * The screen an invite link opens (ARCHITECTURE.md Sections 9 and 17): the
 * app's mark, name, and headline with a "What is Come Hang?" that opens the
 * landing page, then a back button and a heading over the part the join has
 * reached. It opens the invite
 * to name its group, or says the link no longer works, or that it couldn't be
 * opened with a way to try again. Someone not yet asking gives their full name
 * and an optional note, each checked against its limits before anything is
 * sent, above a line saying that asking means agreeing to the terms and the
 * privacy policy, and a request the group refuses says why. While a request
 * waits the screen says a member will let them in, offers to withdraw it, and
 * watches it: an approval opens the group, and a request that ends without one
 * says so, with a way to ask again. A link opened by a member, or by a joiner
 * already let in, opens the group. What's typed in the form is kept for the
 * session, so a trip to the landing page and back, or a reload, keeps it,
 * until the request is sent. Each change of part moves focus to the
 * heading, since the button pressed is gone. A browser that can install the
 * app with one tap suggests it in a note below.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type JoiPhaTyp = 'ended' | 'failed' | 'form' | 'invalid' | 'loading' | 'waiting'; // What: Join Phase Type. Why: The screen shows one part of the join at a time. How: This names each part.

// #endregion Types



// #region Constants

const FAI_LOA_STR = "The invite couldn't be opened. Check your connection and try again.";                                       // What: Failure Load String. Why: A failed read shouldn't leave someone guessing. How: This is what the screen says.
const FAI_SEN_STR = "The request couldn't be sent. Check your connection and try again.";                                       // What: Failure Send String. Why: A failed request shouldn't leave someone guessing. How: This is the message the alert announces.
const FAI_WIT_STR = "The request couldn't be withdrawn. Check your connection and try again.";                                  // What: Failure Withdraw String. Why: A failed withdrawal shouldn't leave someone guessing. How: This is the message the alert announces.
const NOT_ERR_STR = 'Use letters, numbers, and simple punctuation, with no emoji.';                                             // What: Note Error String. Why: A note with other characters is refused. How: This says what it may hold.
const PER_ERR_STR = 'Use letters, spaces, apostrophes, hyphens, and periods.';                                                  // What: Person Error String. Why: A name with other characters is refused. How: This says what it may hold.
const REF_REQ_STR = "The group didn't take the request. You may not be able to join it, or you're in as many groups as you can be."; // What: Refused Request String. Why: The rules refuse a joiner who is blocked, already in, or out of slots, and can't say which. How: This names the likely reasons.

// #endregion Constants



// #region Helpers

// #region draGetFun

/**
 * draGetFun = Draft Get Function
 *
 * @summary
 * Reads the form's kept draft from session storage, where the form leaves
 * it as it's typed. Anything that isn't a draft this screen wrote, or
 * storage that can't be read, reads as an empty draft.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param draKeyStr - Draft Key String: The draft's storage key.
 *
 * @returns The kept note and name, empty where there's none.
 *
 * @example
 * ```ts
 * draGetFun('come-hang-join-draft-Xk3...') // => { notStr, perStr }
 * ```
 *
*/

const draGetFun = ( draKeyStr : string ) : { notStr : string, perStr : string } => { // What: Draft Get Function. Why: A trip to the landing page and back, or a reload, keeps what was typed. How: This reads the kept draft, checking each field.


	let draValAny : unknown = null; // What: Draft Value Any. Why: The kept draft is read as untrusted. How: This holds it, null when there's none.



	try { draValAny = JSON.parse( sessionStorage.getItem( draKeyStr ) ?? 'null' ); } // What: Draft Read Try. Why: The draft is kept as JSON. How: This reads and parses it.

	catch { draValAny = null; } // What: Draft Read Catch. Why: Storage that can't be read, or a draft that isn't JSON, means none. How: This reads it as empty.



	const notValAny : unknown = typeof draValAny === 'object' && draValAny !== null ? Reflect.get( draValAny, 'notStr' ) : undefined; // What: Note Value Any. Why: The note is checked before it's used. How: This reads it from an object, untyped.
	const perValAny : unknown = typeof draValAny === 'object' && draValAny !== null ? Reflect.get( draValAny, 'perStr' ) : undefined; // What: Person Value Any. Why: The name is checked before it's used. How: This reads it from an object, untyped.



	return { notStr : typeof notValAny === 'string' ? notValAny : '', perStr : typeof perValAny === 'string' ? perValAny : '' }; // What: Draft Return. Why: The form starts from what was typed. How: This returns each field when it's a string, and empty otherwise.


};

// #endregion draGetFun

// #endregion Helpers



// #region Components

type JgcProTyp = { // What: Join Group Component Props Type. Why: The screen opens one invite and hands its outcomes to the screen host. How: This types JoiGroCom's props.


	groIdeStr? : string,                                               // What: Group Identifier String. Why: A request already sent is checked by its group, even after the link changes. How: This is the group the entry remembers, when there is one.
	groNamStr? : string,                                               // What: Group Name String. Why: A waiting request still names its group after the link changes. How: This is the name the entry remembers, when there is one.
	onAnnFun   : ( mesValStr : string ) => void,                       // What: On Announce Function. Why: A withdrawal is said aloud while the screen stays. How: The screen host announces it.
	onEntFun   : ( groIdeStr? : string, groNamStr? : string ) => void, // What: On Entry Function. Why: A reload should find a request sent, and forget one taken back. How: The screen host records the group in the entry, or clears it.
	onJoiFun   : ( groIdeStr : string, mesValStr : string ) => void,   // What: On Join Function. Why: Someone let in sees their group. How: The screen host opens it and announces the message.
	onLeaFun   : () => void,                                           // What: On Leave Function. Why: Someone can leave the screen without joining. How: The screen host opens the app's default screen.
	tokValStr  : string                                                // What: Token Value String. Why: The screen opens one invite. How: This is the token from the link.


};

// #region JoiGroCom

/**
 * JoiGroCom = Join Group Component
 *
 * @summary
 * Renders the screen an invite link opens and runs the join. As it opens, a
 * group the entry remembers is checked first, so a waiting or ended request
 * shows even after its link changes; otherwise the invite is read, a dead
 * link shows as such, and the join's status picks the form, the waiting part,
 * or onJoiFun for a member. A sent request is recorded through onEntFun and
 * waits, watched until an approval calls onJoiFun or its end shows the ended
 * part. A withdrawal clears the entry through onEntFun, announces itself
 * through onAnnFun, and returns to the form. The back button calls onLeaFun.
 * Key it by the token, so another link starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groIdeStr - Group Identifier String: The group the entry
 *                          remembers asking to join, when there is one.
 * @param props.groNamStr - Group Name String: That group's name, when the
 *                          entry has it.
 * @param props.onAnnFun  - On Announce Function: Called with a message to
 *                          announce.
 * @param props.onEntFun  - On Entry Function: Called with the group and its
 *                          name once a request is sent, and with neither
 *                          once it's withdrawn or asked again.
 * @param props.onJoiFun  - On Join Function: Called with the group's ID and a
 *                          message once the joiner is in it.
 * @param props.onLeaFun  - On Leave Function: Called when the back button is
 *                          pressed.
 * @param props.tokValStr - Token Value String: The invite link's token.
 *
 * @returns The screen's main area.
 *
 * @example
 * ```tsx
 * JoiGroCom({ onJoiFun, onLeaFun, tokValStr, ... }) // => <JoiGroCom />
 * ```
 *
*/

function JoiGroCom ( { groIdeStr, groNamStr, onAnnFun, onEntFun, onJoiFun, onLeaFun, tokValStr } : JgcProTyp ) : React.JSX.Element {


	const draKeyStr = proKeyFun( `come-hang-join-draft-${ tokValStr }` ); // What: Draft Key String. Why: What's typed is kept per invite, for the session. How: This names its session storage key, per development member too.
	const focHeaRef = useRef( false );                                    // What: Focus Heading Reference. Why: The heading takes focus after a change of part, but not as the screen first opens. How: This is true while a change owes it focus.
	const heaEleRef = useRef< HTMLHeadingElement >( null );               // What: Heading Element Reference. Why: The heading takes focus after a change of part. How: This holds it.
	const notInpRef = useRef< HTMLInputElement >( null );                 // What: Note Input Reference. Why: The note field takes focus when it has a problem. How: This holds its element.
	const perInpRef = useRef< HTMLInputElement >( null );                 // What: Person Input Reference. Why: The name field takes focus when it has a problem. How: This holds its element.
	const scrOpeFun = useScrOpeFun();                                     // What: Screen Open Function. Why: "What is Come Hang?" opens the landing page. How: This reads the function that opens a screen.
	const witRunRef = useRef( false );                                    // What: Withdraw Running Reference. Why: The watch sees a withdrawn request end, which isn't a decline. How: This is true while a withdrawal runs.

	const [ curGroStr, setCurGroStr ] = useState( groIdeStr ?? '' );                     // What: Current Group String And Setter. Why: The request and its watch belong to the invite's group. How: This holds its ID, empty until known.
	const [ curNamStr, setCurNamStr ] = useState( groNamStr ?? '' );                     // What: Current Name String And Setter. Why: Every part names the group. How: This holds its name, empty until known.
	const [ errMesStr, setErrMesStr ] = useState( '' );                                  // What: Error Message String And Setter. Why: A failed send or withdrawal is announced. How: This holds the alert's text, empty until one fails.
	const [ loaVerNum, setLoaVerNum ] = useState( 0 );                                   // What: Load Version Number And Setter. Why: Trying again and asking again read the invite afresh. How: This counts the loads.
	const [ notErrStr, setNotErrStr ] = useState( '' );                                  // What: Note Error String And Setter. Why: The note field says what's wrong with it. How: This holds its problem, empty when there's none.
	const [ notValStr, setNotValStr ] = useState( () => draGetFun( draKeyStr ).notStr ); // What: Note Value String And Setter. Why: The field shows what's typed, kept through a trip away. How: This holds the note as typed, starting from the kept draft.
	const [ perErrStr, setPerErrStr ] = useState( '' );                                  // What: Person Error String And Setter. Why: The name field says what's wrong with it. How: This holds its problem, empty when there's none.
	const [ perNamStr, setPerNamStr ] = useState( () => draGetFun( draKeyStr ).perStr ); // What: Person Name String And Setter. Why: The field shows what's typed, kept through a trip away. How: This holds the name as typed, starting from the kept draft.
	const [ phaValStr, setPhaValStr ] = useState< JoiPhaTyp >( 'loading' );              // What: Phase Value String And Setter. Why: The screen shows one part of the join. How: This holds it, loading until the invite is read.
	const [ senReqBoo, setSenReqBoo ] = useState( false );                               // What: Send Request Boolean And Setter. Why: A second submit while the first is out would send twice. How: This is true while the request is being sent.
	const [ witBusBoo, setWitBusBoo ] = useState( false );                               // What: Withdraw Busy Boolean And Setter. Why: The button shows the withdrawal is out. How: This is true while it runs.



	useEffect( () => { // What: Draft Keep Effect. Why: A trip to the landing page and back, or a reload, should keep what was typed. How: This writes the name and note to session storage as they change.


		try { sessionStorage.setItem( draKeyStr, JSON.stringify( { notStr : notValStr, perStr : perNamStr } ) ); } // What: Draft Write Try. Why: The draft is kept as JSON. How: This writes it.

		catch { return; } // What: Draft Write Catch. Why: Storage that can't be written only costs the kept draft. How: This leaves it.


	}, [ draKeyStr, notValStr, perNamStr ] ); // What: Effect Dependency Array. Why: The draft follows what's typed. How: notValStr and perNamStr change as each field does, and draKeyStr with the invite.



	useEffect( () => { // What: Invite Load Effect. Why: The screen opens on where the join stands. How: This checks a remembered group, then the invite, and picks the part or opens the group.


		let actValBoo = true; // What: Active Value Boolean. Why: A load finishing after the screen moves on mustn't act. How: This is true until cleanup.



		// #region loaRunFun

		/**
		 * loaRunFun = Load Run Function
		 *
		 * @summary
		 * Finds where the join stands: a group the entry remembers is checked
		 * first, opening it for a member and showing the waiting or ended part
		 * for its request. Otherwise the invite is read, a dead link shows as
		 * such, and its group's status opens the group for a member, or shows
		 * the waiting part or the form. Nothing acts once the effect has been
		 * cleaned up.
		 *
		 * @author z4nta0 <https://github.com/z4nta0>
		 *
		 * @param void - This function takes no parameters.
		 *
		 * @returns A promise that settles once the part is picked, with no
		 *          value.
		 *
		 * @example
		 * ```ts
		 * loaRunFun() // => Promise<void>
		 * ```
		 *
		*/

		const loaRunFun = async () : Promise< void > => { // What: Load Run Function. Why: The checks run in order, each waiting on the last. How: This runs them.


			if ( groIdeStr !== undefined ) { // What: Remembered Group Block. Why: A request sent from this screen is checked by its group, which outlives a changed link. How: This reads its status and acts on all but a request gone after a withdrawal.


				const entStaStr = await reqStaFun( groIdeStr ); // What: Entry Status String. Why: The remembered request may be waiting, answered, or gone. How: This reads it.


				if ( !actValBoo ) return; // What: Active Guard. Why: The screen moved on. How: This returns.



				if ( entStaStr === 'member' ) { onJoiFun( groIdeStr, `You're in ${ groNamStr ?? 'the group' }.` ); return; } // What: Member Guard. Why: A member let in while away goes straight to the group. How: This opens it and returns.



				setPhaValStr( entStaStr === 'pending' ? 'waiting' : 'ended' ); // What: Phase Set Call. Why: The request still waits, or ended without an approval. How: This shows the waiting or the ended part.



				return; // What: Remembered Return. Why: The invite isn't needed for a request already sent. How: This stops.


			}



			const invRecObj = await invGetFun( tokValStr ); // What: Invite Record Object. Why: The screen names the group the link opens. How: This reads the invite.


			if ( !actValBoo ) return; // What: Active Guard. Why: The screen moved on. How: This returns.



			if ( !invRecObj ) { setPhaValStr( 'invalid' ); return; } // What: Invite Guard. Why: A link replaced by a newer one opens nothing. How: This shows the dead link and returns.



			const invStaStr = await reqStaFun( invRecObj.groIdeStr ); // What: Invite Status String. Why: Someone may have asked already, or be in. How: This reads where the join stands.


			if ( !actValBoo ) return; // What: Active Guard. Why: The screen moved on. How: This returns.



			if ( invStaStr === 'member' ) { onJoiFun( invRecObj.groIdeStr, `You're already in ${ invRecObj.groNamStr }.` ); return; } // What: Member Guard. Why: A member opening the link wants the group. How: This opens it and returns.



			setCurGroStr( invRecObj.groIdeStr ); // What: Group Set Call. Why: The request and its watch belong to this group. How: This records its ID.

			setCurNamStr( invRecObj.groNamStr ); // What: Name Set Call. Why: Every part names the group. How: This records its name.

			setPhaValStr( invStaStr === 'pending' ? 'waiting' : 'form' ); // What: Phase Set Call. Why: A request already sent waits, and anyone else is asked for their name. How: This shows the waiting part or the form.


		};

		// #endregion loaRunFun



		loaRunFun().catch( ( errCatObj : unknown ) => { // What: Load Run Call. Why: A read that fails, such as a dropped connection, should say so and offer a retry. How: This runs the load, logging a failure and showing the failed part.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) setPhaValStr( 'failed' ); // What: Failed Set Call. Why: The screen says it couldn't open the invite. How: This shows the failed part.


		} );



		return () => { actValBoo = false; }; // What: Load Cleanup. Why: A load outliving its run mustn't act. How: This marks the run inactive.


	}, [ groIdeStr, groNamStr, loaVerNum, onJoiFun, tokValStr ] ); // What: Effect Dependency Array. Why: The load runs again for a remembered group, a retry, or another token. How: groIdeStr and groNamStr change as a request is sent or cleared, loaVerNum on a retry or a new ask, onJoiFun with the host, and tokValStr with the link.



	useEffect( () => { // What: Request Watch Effect. Why: A member's answer reaches the joiner while the waiting part shows. How: This watches the request, opening the group on an approval and showing the ended part on any other end.


		if ( phaValStr !== 'waiting' || curGroStr === '' ) return; // What: Waiting Guard. Why: Only a waiting request is watched. How: This returns otherwise.



		let actValBoo = true;     // What: Active Value Boolean. Why: A report or a stop arriving after cleanup mustn't act. How: This is true until cleanup.
		let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once it has started. How: This holds it, doing nothing until then.


		joiWatFun( curGroStr, ( joiStaStr ) => { // What: Watch Start Call. Why: Each change to the request may be its answer. How: This acts on each status while the effect runs.


			if ( !actValBoo ) return; // What: Active Guard. Why: The screen moved on. How: This returns.



			if ( joiStaStr === 'member' ) onJoiFun( curGroStr, `You're in ${ curNamStr }.` ); // What: Approval Call. Why: The joiner was let in. How: This opens the group and announces it.

			else if ( joiStaStr === 'ended' && !witRunRef.current ) { focHeaRef.current = true; setPhaValStr( 'ended' ); } // What: Ended Call. Why: A request declined, blocked, or expired has to say so, while a withdrawal goes to the form instead. How: This owes the heading focus and shows the ended part, unless a withdrawal is running.


		}, ( errValObj ) => console.warn( errValObj ) ).then( ( stoFunVal ) => { // What: Watch Started Handler. Why: The cleanup stops the watch, and a failure stays visible to someone debugging. How: This logs a failure, and keeps the stop, or stops at once when cleanup came first.


			if ( actValBoo ) stoWatFun = stoFunVal; // What: Stop Keep Call. Why: The cleanup stops the watch. How: This keeps the stop.

			else stoFunVal(); // What: Late Stop Call. Why: The screen moved on before the watch started. How: This stops it at once.


		}, ( errCatObj : unknown ) => console.warn( errCatObj ) );



		return () => { // What: Watch Cleanup. Why: The watch shouldn't outlive the waiting part. How: This marks the run inactive and stops the watch.


			actValBoo = false; // What: Inactive Set. Why: Late reports and stops mustn't act. How: This marks the run done.

			stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


		};


	}, [ curGroStr, curNamStr, onJoiFun, phaValStr ] ); // What: Effect Dependency Array. Why: The watch follows the waiting part and its group. How: phaValStr changes as the part does, curGroStr and curNamStr as the group is known, and onJoiFun with the host.



	useEffect( () => { // What: Heading Focus Effect. Why: The button that changed the part is gone, so focus should land on the heading, which also announces the part. How: This focuses the heading when a change owes it focus.


		if ( !focHeaRef.current ) return; // What: Owed Guard. Why: Opening the screen from a link isn't a change, and nothing was just pressed. How: This returns when focus isn't owed.



		focHeaRef.current = false; // What: Owed Clear Set. Why: The focus is given once. How: This clears the debt.

		heaEleRef.current?.focus(); // What: Focus Call. Why: The heading names the new part. How: This focuses it.


	}, [ phaValStr ] ); // What: Effect Dependency Array. Why: Focus follows a change of part. How: phaValStr changes when the part does.



	// #region subForFun

	/**
	 * subForFun = Submit Form Function
	 *
	 * @summary
	 * Handles a submit: ignores it while a request is out, tidies the name and
	 * note, records each field's problem, and focuses the first field with
	 * one. With no problems, it sends the request, records its group through
	 * onEntFun, and shows the waiting part, its heading owed focus. A link
	 * that stopped working shows the dead link, and any other failure is
	 * announced, the refusal the rules give saying why, so the form can be
	 * sent again.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the submit is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * subForFun() // => Promise<void>
	 * ```
	 *
	*/

	const subForFun = async () : Promise< void > => { // What: Submit Form Function. Why: Submitting checks the name and note and asks to join. How: This runs each step of the submit.


		if ( senReqBoo ) return; // What: Sending Guard. Why: One request at a time. How: This ignores a submit while one is out.



		const notNorStr = texNorFun( notValStr ); // What: Note Normalized String. Why: The note is checked as it'll be saved. How: This tidies it.
		const perNorStr = texNorFun( perNamStr ); // What: Person Normalized String. Why: The name is checked as it'll be saved. How: This tidies it.

		const notProStr = joiNotFun( notNorStr ) ? '' : NOT_ERR_STR;                                         // What: Note Problem String. Why: An out-of-limits note says what's wrong, and an empty one is fine. How: This picks the message, empty when the note passes.
		const perProStr = perNorStr === '' ? 'Enter your name.' : perNamFun( perNorStr ) ? '' : PER_ERR_STR; // What: Person Problem String. Why: An empty or out-of-limits name says what's wrong. How: This picks the message, empty when the name passes.


		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setNotErrStr( notProStr ); // What: Note Error Set Call. Why: The field shows its problem. How: This records it.

		setPerErrStr( perProStr ); // What: Person Error Set Call. Why: The field shows its problem. How: This records it.



		if ( notProStr !== '' || perProStr !== '' ) { // What: Problem Block. Why: Nothing is sent while a field has a problem, and focus should land where it is. How: This focuses the first field with one and stops.


			( perProStr === '' ? notInpRef : perInpRef ).current?.focus(); // What: Field Focus Call. Why: A screen reader announces the field with its problem, and a keyboard user is put where it is. How: This focuses the first field with a problem.



			return; // What: Problem Return. Why: The form isn't sent. How: This stops.


		}



		setSenReqBoo( true ); // What: Sending Set Call. Why: The button shows the request is being sent. How: This marks it as out.



		try { // What: Request Try. Why: The request is filed, and the screen waits on it. How: This sends it, records its group, and shows the waiting part.


			const sntGroStr = await reqCreFun( tokValStr, perNorStr, notNorStr ); // What: Sent Group String. Why: The request is watched in its group. How: This files it and reads the group's ID.


			onEntFun( sntGroStr, curNamStr ); // What: Entry Record Call. Why: A reload should find the request waiting even if the link changes. How: This records the group and its name in the entry.

			focHeaRef.current = true; // What: Focus Owed Set. Why: The form and its button are gone. How: This owes the heading focus.

			setPhaValStr( 'waiting' ); // What: Waiting Set Call. Why: The request waits for a member. How: This shows the waiting part.

			sessionStorage.removeItem( draKeyStr ); // What: Draft Clear Call. Why: A sent request needs no draft. How: This forgets it.


		}

		catch ( errCatObj ) { // What: Request Catch. Why: A failed request has to be told, and a dead link shown as one. How: This logs the failure, then shows the dead link or announces why.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			const errCodAny : unknown = Reflect.get( Object( errCatObj ), 'code' ); // What: Error Code Any. Why: A dead link and the rules' refusal each carry a code, which picks what follows. How: This reads it, untyped.


			if ( errCodAny === 'invite/not-found' ) { focHeaRef.current = true; setPhaValStr( 'invalid' ); } // What: Dead Link Call. Why: The link was replaced while the form was open. How: This owes the heading focus and shows the dead link.

			else setErrMesStr( errCodAny === 'permission-denied' ? REF_REQ_STR : FAI_SEN_STR ); // What: Failure Announce Call. Why: Someone has to learn it failed, and a refusal can say why. How: This puts the refusal's or the general message in the alert.


		}



		setSenReqBoo( false ); // What: Sending Clear Call. Why: The form can be sent again if it's still showing. How: This marks the request as done.


	};

	// #endregion subForFun



	// #region witReqFun

	/**
	 * witReqFun = Withdraw Request Function
	 *
	 * @summary
	 * Takes the waiting request back: deletes it, while the watch knows not to
	 * read its end as a decline, then clears the entry through onEntFun,
	 * announces it through onAnnFun, and shows the form, its heading owed
	 * focus. A failure is announced, and the request stays waiting.
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
	 * witReqFun() // => Promise<void>
	 * ```
	 *
	*/

	const witReqFun = async () : Promise< void > => { // What: Withdraw Request Function. Why: A joiner may change their mind. How: This deletes the request and returns to the form.


		if ( witBusBoo ) return; // What: Busy Guard. Why: One withdrawal at a time. How: This ignores a press while one is out.



		witRunRef.current = true; // What: Running Set. Why: The request's end is a withdrawal, not a decline. How: This tells the watch.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setWitBusBoo( true ); // What: Busy Set Call. Why: The button shows the withdrawal is out. How: This marks it as running.



		try { // What: Withdraw Try. Why: The request goes, and the form comes back. How: This deletes it, clears the entry, announces it, and shows the form.


			await reqWitFun( curGroStr ); // What: Withdraw Call. Why: The members stop seeing the request. How: This deletes it.


			onEntFun(); // What: Entry Clear Call. Why: A reload shouldn't find the request. How: This clears the group from the entry.

			onAnnFun( 'You withdrew your request.' ); // What: Announce Call. Why: The withdrawal should be heard as well as seen. How: This announces it.

			focHeaRef.current = true; // What: Focus Owed Set. Why: The withdraw button is gone. How: This owes the heading focus.

			setPhaValStr( 'form' ); // What: Form Set Call. Why: Someone who took their request back can ask again. How: This shows the form.


		}

		catch ( errCatObj ) { // What: Withdraw Catch. Why: A failed withdrawal has to be told. How: This logs it and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( FAI_WIT_STR ); // What: Failure Announce Call. Why: Someone has to learn it failed. How: This puts the message in the alert.


		}



		witRunRef.current = false; // What: Running Clear Set. Why: A later end is the group's answer. How: This tells the watch.

		setWitBusBoo( false ); // What: Busy Clear Call. Why: The button can be pressed again if it's still showing. How: This marks it as done.


	};

	// #endregion witReqFun



	const relInvFun = () : void => { // What: Reload Invite Function. Why: Trying again and asking again read the invite afresh. How: This forgets the remembered group, shows the loading part, and starts another load.


		onEntFun(); // What: Entry Clear Call. Why: Asking again starts from the link, not the request that ended. How: This clears the group from the entry.

		focHeaRef.current = true; // What: Focus Owed Set. Why: The button pressed is gone. How: This owes the heading focus.

		setPhaValStr( 'loading' ); // What: Loading Set Call. Why: The invite is read again. How: This shows the loading part.

		setLoaVerNum( ( preVerNum ) => preVerNum + 1 ); // What: Load Restart Call. Why: The load effect reads the invite afresh. How: This starts another load.


	};



	const groTexStr = curNamStr === '' ? 'the group' : curNamStr; // What: Group Text String. Why: Every part names the group, even when its name is somehow missing. How: This is its name, or "the group".

	const heaTexObj : Record< JoiPhaTyp, string > = { // What: Heading Text Object. Why: The heading names the part the join has reached. How: This holds each part's heading by its phase.


		ended   : 'Your request has ended',           // What: Ended Heading. Why: The request is over without an approval. How: This says so.
		failed  : 'Join a group',                     // What: Failed Heading. Why: The group isn't known when the invite couldn't be read. How: This names the screen.
		form    : `You're invited to ${ groTexStr }`, // What: Form Heading. Why: The joiner sees which group invited them, warmly. How: This names it.
		invalid : "This invite link doesn't work",    // What: Invalid Heading. Why: The link opens nothing. How: This says so.
		loading : 'Join a group',                     // What: Loading Heading. Why: The group isn't known yet. How: This names the screen.
		waiting : `Waiting to join ${ groTexStr }`    // What: Waiting Heading. Why: The joiner sees what they're waiting on. How: This names the group.


	};



	return (


		<MaiAreCom className={ cssModObj.joiScrMai }>{ /* What: Join Screen Main Area Component. Why: The join is the screen's whole content. How: This holds the bar, the part, and the alert in one centered column. */ }


			<div className={ cssModObj.joiBraDiv }>{ /* What: Join Brand Div Element. Why: Someone who's never heard of Come Hang should see whose app this is before giving their name. How: This holds the mark and name, the headline, and the way to the landing page. */ }


				<p className={ cssModObj.joiBraPar }>{ /* What: Join Brand Paragraph Element. Why: The mark and the name read as the wordmark. How: This sets them side by side. */ }


					<BraMarCom className={ cssModObj.joiMarSvg } />{ /* What: Join Mark SVG Element. Why: The mark makes the app recognizable. How: This draws it before the name. */ }

					<span className={ cssModObj.joiNamSpa }>Come Hang</span>{ /* What: Join Name Span Element. Why: The name sits beside the mark. How: This sets it. */ }


				</p>



				<p className={ cssModObj.joiTagPar }>Plans made. Fun had. Memories created.</p>{ /* What: Join Tagline Paragraph Element. Why: The landing page's headline says what the app is for in a line. How: This repeats it. */ }

				<button
					className={ cssModObj.joiWhaBut }

					type='button'

					onClick={ () => scrOpeFun( { namStr : curNamStr, scrStr : 'about' } ) }
				>What is Come Hang?</button>{ /* What: Join What Button Element. Why: Someone who wants more before joining can read about the app and come back. How: This opens the landing page as a new entry, naming the group to go back to joining. */ }


			</div>



			<div className={ cssModObj.joiBarDiv }>{ /* What: Join Bar Div Element. Why: The way back sits beside the screen's heading. How: This lays them out in one row. */ }


				<button
					className={ cssModObj.joiBacBut }

					type='button'

					aria-label='Back'

					onClick={ onLeaFun }
				>{ /* What: Join Back Button Element. Why: Someone can leave without joining. How: This opens the app's default screen. */ }


					<IcoSvgCom
						icoNamStr='back'
						sizSteStr='p01'
					/>{ /* What: Back Icon SVG Component. Why: An arrow pointing back says what the button does. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


				</button>

				<h1
					ref={ heaEleRef }

					className={ cssModObj.joiTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: A change of part moves focus here, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>{ heaTexObj[ phaValStr ] }</h1>{ /* What: Join Title Heading Element. Why: The screen's one heading names the part the join has reached. How: This shows the phase's heading. */ }


			</div>



			<div className={ cssModObj.joiBodDiv }>{ /* What: Join Body Div Element. Why: Each part of the join shows its own text and actions. How: This holds the current part's content in one column. */ }


				{ phaValStr === 'loading' && <p>Opening the invite…</p> }{ /* What: Loading Text Paragraph. Why: The invite takes a moment to read. How: This says it's opening while the part is loading. */ }



				{ phaValStr === 'failed' && ( // What: Failed Part Check. Why: A read that failed says so and offers a retry. How: This shows the message and the button while the part is failed.


					<>{ /* What: Failed Part Fragment. Why: The message and the retry sit side by side in the body. How: This groups them without adding an element. */ }


						<p>{ FAI_LOA_STR }</p>{ /* What: Join Text Paragraph Element. Why: A failed read shouldn't leave someone guessing. How: This says what happened and what to do. */ }

						<ButBasCom
							className={ cssModObj.joiActBut }

							onClick={ relInvFun }
						>Try again</ButBasCom>{ /* What: Join Action Button Component. Why: A dropped connection may come back. How: This reads the invite again. */ }


					</>


				) }



				{ phaValStr === 'invalid' && ( // What: Invalid Part Check. Why: A link replaced by a newer one says what to do instead. How: This shows the advice and the way out while the part is invalid.


					<>{ /* What: Invalid Part Fragment. Why: The advice and the way out sit side by side in the body. How: This groups them without adding an element. */ }


						<p>It may have been replaced with a newer one. Ask someone in the group to send you the current link.</p>{ /* What: Join Text Paragraph Element. Why: A dead link usually means a newer one exists. How: This says so and who to ask. */ }

						<ButBasCom
							className={ cssModObj.joiActBut }

							onClick={ onLeaFun }
						>Go to Come Hang</ButBasCom>{ /* What: Join Action Button Component. Why: Someone with a dead link still has somewhere to go. How: This opens the app's default screen. */ }


					</>


				) }



				{ phaValStr === 'form' && ( // What: Form Part Check. Why: Someone not yet asking is asked for their name. How: This shows the note and the form while the part is the form.


					<>{ /* What: Form Part Fragment. Why: The explanation and the form sit side by side in the body. How: This groups them without adding an element. */ }


						<p>A member of the group lets you in once you ask. Tell them who you are, so they know it's you.</p>{ /* What: Join Text Paragraph Element. Why: Every join waits for a member's approval (Section 17). How: This says so before the form. */ }



						<form
							className={ cssModObj.joiReqFor }

							noValidate

							onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void subForFun(); } } // What: Submit Handler. Why: The form is checked and sent by the app, not by a page load. How: This cancels the browser's submit and runs the app's.
						>{ /* What: Join Request Form Element. Why: Asking to join takes a name and an optional note. How: This holds the fields and the button in one column. */ }


							<div className={ cssModObj.joiFieDiv }>{ /* What: Join Field Div Element. Why: The name's label, field, hint, and problem read as one. How: This stacks them. */ }


								<label
									className={ cssModObj.fieNamLab }
									htmlFor='joiNamInp'
								>Your full name</label>{ /* What: Field Name Label Element. Why: The field needs a visible name. How: This labels the name field. */ }

								<input
									ref={ perInpRef }
									id='joiNamInp'

									className={ cssModObj.fieValInp }

									autoComplete='name'
									maxLength={ 40 }
									type='text'
									value={ perNamStr }

									aria-describedby='joiNamHin joiNamErr'
									aria-invalid={ perErrStr !== '' } // What: Person Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

									onChange={ ( chaEveObj ) => setPerNamStr( chaEveObj.target.value ) }
								/>{ /* What: Field Value Input Element. Why: The joiner's name is typed here. How: This holds it, at most 40 characters. */ }

								<p
									id='joiNamHin'

									className={ cssModObj.fieHinPar }
								>The name the group knows you by, first and last, up to 40 letters.</p>{ /* What: Field Hint Paragraph Element. Why: The approver has to recognize the name, which has its limits. How: This says both. */ }

								<p
									id='joiNamErr'

									className={ cssModObj.fieErrPar }
								>{ perErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its field and read with it. How: This shows the field's problem, empty when there's none. */ }


							</div>

							<div className={ cssModObj.joiFieDiv }>{ /* What: Join Field Div Element. Why: The note's label, field, hint, and problem read as one. How: This stacks them. */ }


								<label
									className={ cssModObj.fieNamLab }
									htmlFor='joiNotInp'
								>Note to the group (optional)</label>{ /* What: Field Name Label Element. Why: The field needs a visible name, which says it can be left empty. How: This labels the note field. */ }

								<input
									ref={ notInpRef }
									id='joiNotInp'

									className={ cssModObj.fieValInp }

									autoComplete='off'
									maxLength={ 150 }
									type='text'
									value={ notValStr }

									aria-describedby='joiNotHin joiNotErr'
									aria-invalid={ notErrStr !== '' } // What: Note Invalid State. Why: A screen reader says when the field has a problem, and the border turns red. How: This is true while it has one.

									onChange={ ( chaEveObj ) => setNotValStr( chaEveObj.target.value ) }
								/>{ /* What: Field Value Input Element. Why: The joiner's note is typed here. How: This holds it, at most 150 characters. */ }

								<p
									id='joiNotHin'

									className={ cssModObj.fieHinPar }
								>Something that helps them place you, like "Dana's cousin", up to 150 characters.</p>{ /* What: Field Hint Paragraph Element. Why: A note helps when the name alone isn't enough, and has its limits. How: This gives an example and the limit. */ }

								<p
									id='joiNotErr'

									className={ cssModObj.fieErrPar }
								>{ notErrStr }</p>{ /* What: Field Error Paragraph Element. Why: A problem should be told beside its field and read with it. How: This shows the field's problem, empty when there's none. */ }


							</div>



							<LegLinCom actStr='asking to join' />{ /* What: Legal Links Component. Why: Someone arriving through an invite link never sees the welcome, so the form says what asking means. How: This says asking means agreeing to the terms and the policy, linking both, above the button. */ }



							<ButBasCom
								className={ cssModObj.joiActBut }

								type='submit'
							>{ senReqBoo ? 'Sending…' : 'Ask to join' }</ButBasCom>{ /* What: Join Action Button Component. Why: Sending the form asks to join, and the label shows while it's out. How: This submits the form, reading "Sending…" while the request is out. */ }


						</form>


					</>


				) }



				{ phaValStr === 'waiting' && ( // What: Waiting Part Check. Why: A sent request waits for a member, and can be taken back. How: This shows what happens next and the withdrawal while the part is waiting.


					<>{ /* What: Waiting Part Fragment. Why: The explanation and the withdrawal sit side by side in the body. How: This groups them without adding an element. */ }


						<p>Your request is with the group. Any member can let you in, and this screen opens the group as soon as they do. A request lasts 7 days.</p>{ /* What: Join Text Paragraph Element. Why: The joiner should know what they're waiting for and how long it lasts. How: This says it. */ }

						<button
							className={ cssModObj.actPlaBut }

							type='button'

							onClick={ () => void witReqFun() }
						>{ witBusBoo ? 'Withdrawing…' : 'Withdraw request' }</button>{ /* What: Action Plain Button Element. Why: A joiner may take their request back, and the label shows while it's out. How: This withdraws it, reading "Withdrawing…" meanwhile. */ }


					</>


				) }



				{ phaValStr === 'ended' && ( // What: Ended Part Check. Why: A request that ended without an approval says so and offers another try. How: This shows what may have happened and the way to ask again while the part is ended.


					<>{ /* What: Ended Part Fragment. Why: The explanation and the way to ask again sit side by side in the body. How: This groups them without adding an element. */ }


						<p>{ `Your request to join ${ groTexStr } ended without an approval. A member may have declined it, or it ran out after 7 days.` }</p>{ /* What: Join Text Paragraph Element. Why: The joiner can't be told which, since a decline and an expiry look the same to them. How: This names both. */ }

						<ButBasCom
							className={ cssModObj.joiActBut }

							onClick={ relInvFun }
						>Ask again</ButBasCom>{ /* What: Join Action Button Component. Why: A request that ran out, or one declined by mistake, can be sent again. How: This reads the invite afresh, which shows the form for a working link. */ }


					</>


				) }


			</div>



			<p
				className={ cssModObj.joiErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Join Error Paragraph Element. Why: A failed send or withdrawal has to be announced, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when one fails. */ }



			<InsNotCom />{ /* What: Install Note Component. Why: A browser that can install the app with one tap suggests it, never in the way. How: This shows the note below the screen's own content while the browser offers its prompt. */ }


		</MaiAreCom>


	);


}

// #endregion JoiGroCom

// #endregion Components



// #region Exports

export { JoiGroCom }; // What: Named Export. Why: The screen host shows it when an invite link opens the app. How: This exports JoiGroCom.

// #endregion Exports


