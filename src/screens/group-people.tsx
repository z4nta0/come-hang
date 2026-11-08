


// #region Imports

import cssModObj from './group-people.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';       // What: Button Base Component. Why: Copying the link and saving a name are the section's leading actions. How: This draws their buttons.
import { HisReqCom    } from './history-requests.tsx'; // What: History Requests Component. Why: Members see who is asking for chat history and can send it. How: This shows the list in People.
import { ideEnsFun    } from '../state/identity.ts';   // What: Identity Ensure Function. Why: The member's own row offers a name change. How: This reads their UID.
import { iniTexFun    } from '../utils/text.ts';       // What: Initials Text Function. Why: Each member's avatar shows their initials. How: This takes them from the name.
import { invRotFun    } from '../state/groups.ts';     // What: Invite Rotate Function. Why: The owner can make a new invite link. How: This swaps the link.
import { keyLisFun    } from '../state/key-share.ts';  // What: Key List Function. Why: Members see who's waiting on a new phone for the group's key (Section 6). How: This reads the standing requests.
import { keyShaFun    } from '../state/key-share.ts';  // What: Key Share Function. Why: Any member shares the key with someone on a new phone. How: This wraps it for their new key.
import { memLisFun    } from '../state/members.ts';    // What: Member List Function. Why: The section lists the group's members. How: This reads them.
import { memRemFun    } from '../state/members.ts';    // What: Member Remove Function. Why: The owner can remove a member. How: This removes them and swaps the link.
import { mesTimFun    } from '../utils/date.ts';       // What: Message Time Function. Why: A request says when it was made. How: This labels the time.
import { namSetFun    } from '../state/members.ts';    // What: Name Set Function. Why: A member changes their own name in the group. How: This saves it.
import { perNamFun    } from '../core/text-limits.ts'; // What: Person Name Function. Why: A name outside its limits is caught before it's sent. How: This checks it.
import { reqAppFun    } from '../state/joins.ts';      // What: Request Approve Function. Why: Any member lets a joiner in (Section 17). How: This approves their request.
import { reqBloFun    } from '../state/joins.ts';      // What: Request Block Function. Why: A request from someone unwelcome is ended for good. How: This blocks its sender.
import { reqDecFun    } from '../state/joins.ts';      // What: Request Decline Function. Why: Any member turns a request down. How: This declines it.
import { reqWatFun    } from '../state/joins.ts';      // What: Request Watch Function. Why: A new request, or one another member answered, shows at once. How: This watches them.
import { sloColFun    } from '../ui/member-color.ts';  // What: Slot Color Function. Why: Each member's avatar wears their color. How: This names it.
import { texNorFun    } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: A name is checked as it'll be saved. How: This tidies it.
import { useEffect    } from 'react';                  // What: Use Effect. Why: The section reads its members and watches its requests, and an edit or an answer moves focus. How: This starts the reads and the watch and moves focus.
import { useIteJumFun } from '../ui/item-jump.ts';     // What: Use Item Jump Function. Why: The notices sheet can open the section at one item waiting on the member. How: This waits for its row and jumps there.
import { useRef       } from 'react';                  // What: Use Reference. Why: Focus moves between a control and the form it opens, and to a heading after an answer. How: This holds the elements.
import { useScrOpeFun } from '../ui/screen.ts';        // What: Use Screen Open Function. Why: A jump done, the entry drops the item it named. How: This returns the function that opens a screen.
import { useState     } from 'react';                  // What: Use State. Why: The members, the open form, and the messages change while the section is open. How: This holds each.


import type { GroRecTyp } from '../state/groups.ts';    // What: Group Record Type. Why: The section shows one group's members and link. How: This types the group.
import type { KeyReqTyp } from '../state/key-share.ts'; // What: Key Request Type. Why: The section lists the members waiting for the key. How: This types each.
import type { MemRecTyp } from '../state/members.ts';   // What: Member Record Type. Why: The section lists the members. How: This types each.
import type { ReqRecTyp } from '../state/joins.ts';     // What: Request Record Type. Why: The section lists the people waiting to join. How: This types each.

// #endregion Imports



/**
 * group-people.tsx = Group People
 *
 * @summary
 * The open group's People section: the invite link, which any member copies
 * and the owner can replace; the people waiting to join, whom any member
 * approves, declines, or blocks; the members waiting on a new phone for the
 * group's key, which any other member shares; the members asking for chat
 * history, which a member whose phone holds it sends; and the members, each
 * with their avatar in their color, the member's own name changeable from
 * their row, and anyone else removable by the owner after confirming. Each
 * change is announced, and one that fails says why.
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

const FAI_PEO_STR = "That didn't go through. Try again.";                   // What: Failure People String. Why: A change that fails for any other reason still has to be told. How: The alert shows this.
const PER_ERR_STR = 'Use letters, spaces, apostrophes, hyphens, and periods.'; // What: Person Error String. Why: A name with other characters is refused. How: This says what it may hold.

// #endregion Constants



// #region Components

type GpcProTyp = { curGroObj : GroRecTyp, waiStr? : string }; // What: Group People Component Props Type. Why: The section shows one group, and can open at one item waiting on the member. How: This types GroPeoCom's props.

// #region GroPeoCom

/**
 * GroPeoCom = Group People Component
 *
 * @summary
 * Renders the open group's People section. The invite link shows in a read-
 * only box with a button that copies it, falling back to selecting it where
 * the browser won't copy, and the owner's button that makes a new link after
 * confirming. While anyone is waiting to join, their requests list oldest
 * first, live, each with its name, its time, its note, and a warning when a
 * member already has that name, and any member approves, declines, or, after
 * confirming, blocks one, or declines them all after confirming; once a
 * request is gone, focus moves to the waiting list's heading, or the members'
 * when none is left. Members waiting on a new phone for the group's key list
 * next, each with a share, focus moving the same way once theirs is answered.
 * The members list in name order, the owner marked, the member's own row
 * offering to change their name in a form that takes and returns focus, and
 * each other row offering the owner a removal after confirming, which also
 * makes a new link. Changes are announced through a status region and failures
 * through an alert, and the members are read again after each change and each
 * change to the requests. When waiStr names a join, key, or history request,
 * the section jumps to its row once it renders and replaces the history
 * entry with one that doesn't name it, announcing a request already answered.
 * Key it by the group, so another group starts afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.curGroObj - Current Group Object: The open group.
 * @param props.waiStr    - Waiting String: A request to jump to, as the
 *                          notices sheet asks, such as `join:u1`.
 *
 * @returns The section.
 *
 * @example
 * ```tsx
 * GroPeoCom({ curGroObj, waiStr }) // => <GroPeoCom />
 * ```
 *
*/

function GroPeoCom ( { curGroObj, waiStr } : GpcProTyp ) : React.JSX.Element {


	const ediButRef = useRef< HTMLButtonElement >( null );  // What: Edit Button Reference. Why: Leaving the name form returns focus to its button. How: This holds the button.
	const focEdiRef = useRef( false );                      // What: Focus Edit Reference. Why: Focus returns to the button once the form has gone. How: This is true while that's owed.
	const focTarRef = useRef( '' );                         // What: Focus Target Reference. Why: A button that opens a confirmation goes with it, and comes back when it closes, so focus has to wait for the control that replaces it. How: This names the control owed focus once it's drawn, empty when none is.
	const focKeyRef = useRef( '' );                         // What: Focus Key Reference. Why: Sharing the key removes the button that did it, so focus is moved once its request is gone. How: This holds the UID being answered, empty when none is.
	const focUidRef = useRef< string[] >( [] );             // What: Focus UID Reference. Why: Answering a request removes the button that did it, so focus is moved once its request is gone. How: This holds the UIDs being answered, empty when none is.
	const invLinRef = useRef< HTMLInputElement >( null );
	const keyHeaRef = useRef< HTMLHeadingElement >( null ); // What: Key Heading Reference. Why: Focus lands on the key list's heading once a request is answered and others wait. How: This holds it.   // What: Invite Link Reference. Why: Where the browser won't copy, the link is selected for the member to copy. How: This holds its box.
	const memHeaRef = useRef< HTMLHeadingElement >( null ); // What: Member Heading Reference. Why: Focus lands on the members' heading once the last request is answered. How: This holds it.
	const namInpRef = useRef< HTMLInputElement >( null );   // What: Name Input Reference. Why: The name form puts the member in its box. How: This holds the box.
	const reqHeaRef = useRef< HTMLHeadingElement >( null ); // What: Request Heading Reference. Why: Focus lands on the waiting list's heading once a request is answered and others wait. How: This holds it.
	const scrOpeFun = useScrOpeFun();                       // What: Screen Open Function. Why: A finished jump drops the item from the history entry. How: This opens a screen.

	const [ actReqBoo, setActReqBoo ] = useState( false );                      // What: Action Request Boolean And Setter. Why: One change at a time keeps a double tap from acting twice. How: This is true while one is out.
	const [ conAllBoo, setConAllBoo ] = useState( false );                      // What: Confirm All Boolean And Setter. Why: Declining every request asks to confirm first. How: This is true while the confirmation shows.
	const [ conBloStr, setConBloStr ] = useState( '' );                         // What: Confirm Block String And Setter. Why: Blocking asks to confirm first. How: This holds the UID being confirmed, empty when none is.
	const [ conRemStr, setConRemStr ] = useState( '' );                         // What: Confirm Remove String And Setter. Why: Removing asks to confirm first. How: This holds the UID being confirmed, empty when none is.
	const [ conRotBoo, setConRotBoo ] = useState( false );                      // What: Confirm Rotate Boolean And Setter. Why: A new link asks to confirm first. How: This is true while the confirmation shows.
	const [ ediNamBoo, setEdiNamBoo ] = useState( false );                      // What: Edit Name Boolean And Setter. Why: The member's row turns into a name form. How: This is true while it shows.
	const [ errMesStr, setErrMesStr ] = useState( '' );                         // What: Error Message String And Setter. Why: A failed change is announced. How: This holds the alert's text, empty when there's none.
	const [ keyReqArr, setKeyReqArr ] = useState< KeyReqTyp[] >( [] ); // What: Key Request Array And Setter. Why: The section lists the members waiting for the key. How: This holds their requests, empty until any are read.
	const [ lisVerNum, setLisVerNum ] = useState( 0 );                          // What: List Version Number And Setter. Why: A change reads the members again. How: This counts the reads asked for.
	const [ memRecArr, setMemRecArr ] = useState< MemRecTyp[] | null >( null ); // What: Member Record Array And Setter. Why: The section lists the members. How: This holds them in name order, null until read.
	const [ namTexStr, setNamTexStr ] = useState( '' );                         // What: Name Text String And Setter. Why: The name box shows what's typed. How: This holds it.
	const [ reqRecArr, setReqRecArr ] = useState< ReqRecTyp[] >( [] );          // What: Request Record Array And Setter. Why: The section lists the people waiting to join. How: This holds their requests, oldest first, empty until any arrive.
	const [ staMesStr, setStaMesStr ] = useState( '' );                         // What: Status Message String And Setter. Why: A change that lands is announced. How: This holds the status's text.
	const [ uidValStr, setUidValStr ] = useState( '' );                         // What: UID Value String And Setter. Why: The member's own row is marked and editable. How: This holds their UID, empty until read.


	const linValStr = `${ window.location.origin }/join/${ curGroObj.tokStr }`; // What: Link Value String. Why: The link opens the group's invite screen. How: This joins the app's address and the group's current token.



	useEffect( () => { // What: Members Load Effect. Why: The section shows the members and the key requests when it opens and after each change. How: This reads the UID, the key requests, and the members.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after a newer one began, or after the section closed, mustn't change it. How: This is true until the cleanup runs.


		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: The member's own row is marked. How: This reads the UID.

		void keyLisFun( curGroObj.ideStr ).then( ( lisReqArr ) => { if ( actValBoo ) setKeyReqArr( lisReqArr ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Key Requests Read Call. Why: A member on a new phone waits for someone to share the key. How: This reads the standing requests, logging a failure.

		void memLisFun( curGroObj.ideStr ).then( ( lisRecArr ) => { if ( actValBoo ) setMemRecArr( [ ...lisRecArr ].sort( ( memOneObj, memTwoObj ) => memOneObj.namTexStr.localeCompare( memTwoObj.namTexStr ) ) ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Members Read Call. Why: The section lists everyone by name. How: This reads the members and sorts them, logging a failure.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A read still out shouldn't land after a newer one began. How: This marks it stale.


	}, [ curGroObj.ideStr, lisVerNum ] ); // What: Effect Dependency Array. Why: The members belong to one group and are read again after each change. How: curGroObj.ideStr names the group, and lisVerNum counts the reads asked for.



	useEffect( () => reqWatFun( curGroObj.ideStr, ( watRecArr ) => { setReqRecArr( watRecArr ); setLisVerNum( ( preVerNum ) => preVerNum + 1 ); }, ( errCatObj ) => console.warn( errCatObj ) ), [ curGroObj.ideStr ] ); // What: Request Watch Effect. Why: A request shows as it arrives, and an approval by any member shows in the members. How: This watches the requests, reads the members again with each change, logs a failure, and stops the watch when the section closes. // What: Effect Dependency Note. Why: The requests belong to one group. How: curGroObj.ideStr names it.



	useIteJumFun( waiStr, ( fouValBoo ) => { // What: Item Jump Call. Why: The notices sheet opens the section at a request waiting on the member. How: This jumps to its row once it renders, then drops it from the entry, saying when it was answered already.


		if ( !fouValBoo ) setStaMesStr( "That's been answered already." ); // What: Answered Status Call. Why: A request someone else answered first has no row to jump to. How: This announces it.


		scrOpeFun( { groStr : curGroObj.ideStr, scrStr : 'group', secStr : 'people' }, true ); // What: Entry Replace Call. Why: A reload or a return shouldn't jump again. How: This replaces the entry with one naming no item.


	} );



	useEffect( () => { // What: Answer Focus Effect. Why: The button that answered a request goes with it, and focus mustn't fall to the page. How: Once every request being answered is gone, this focuses the waiting list's heading, or the members' when none is left.


		if ( focUidRef.current.length === 0 || reqRecArr.some( ( reqRecObj ) => focUidRef.current.includes( reqRecObj.uidValStr ) ) ) return; // What: Waiting Guard. Why: Focus moves only once the answered requests have left the list. How: This returns while none is owed or one still shows.



		focUidRef.current = []; // What: Focus Clear Assignment. Why: The move is owed once. How: This clears the debt.


		( reqRecArr.length > 0 ? reqHeaRef : memHeaRef ).current?.focus(); // What: Heading Focus Call. Why: The next Tab carries on from the part that changed. How: This focuses the waiting list's heading while others wait, else the members'.


	}, [ reqRecArr ] ); // What: Effect Dependency Array. Why: Focus moves once the requests change. How: reqRecArr changes then.



	useEffect( () => { // What: Key Focus Effect. Why: The button that shared the key goes with its request, and focus mustn't fall to the page. How: Once the request answered is gone, this focuses the key list's heading, or the members' when none is left.


		if ( focKeyRef.current === '' || keyReqArr.some( ( keyReqObj ) => keyReqObj.uidValStr === focKeyRef.current ) ) return; // What: Waiting Guard. Why: Focus moves only once the answered request has left the list. How: This returns while none is owed or it still shows.



		focKeyRef.current = ''; // What: Focus Clear Assignment. Why: The move is owed once. How: This clears the debt.


		( keyReqArr.length > 0 ? keyHeaRef : memHeaRef ).current?.focus(); // What: Heading Focus Call. Why: The next Tab carries on from the part that changed. How: This focuses the key list's heading while others wait, else the members'.


	}, [ keyReqArr ] ); // What: Effect Dependency Array. Why: Focus moves once the key requests change. How: keyReqArr changes when they're read again.



	useEffect( () => { // What: Name Focus Effect. Why: Opening the name form puts the member in its box, and leaving it puts them back on its button. How: This focuses whichever the form's state calls for.


		if ( ediNamBoo ) namInpRef.current?.focus(); // What: Box Focus Call. Why: The form opened. How: This focuses the box.

		else if ( focEdiRef.current ) { focEdiRef.current = false; ediButRef.current?.focus(); } // What: Button Focus Call. Why: The form closed and owes its button focus. How: This focuses the button and clears the debt.


	}, [ ediNamBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the form opens and closes. How: ediNamBoo changes then.



	// #region actRunFun

	/**
	 * actRunFun = Action Run Function
	 *
	 * @summary
	 * Runs one change: ignores it while another is out, clears the messages,
	 * then awaits the change, announcing the given status when it lands and
	 * reading the members again. A failure is logged and announced, a name
	 * outside its limits saying what's allowed, and anything else asking to
	 * try again. Resolves true when the change landed.
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
	 * actRunFun(remMemFun, 'Removed Dana.') // => true
	 * ```
	 *
	*/

	const actRunFun = async ( actStaFun : () => Promise< unknown >, donMesStr : string ) : Promise< boolean > => { // What: Action Run Function. Why: Every change in the section runs, and is announced, the same way. How: This runs one and reports how it went.


		if ( actReqBoo ) return false; // What: Busy Guard. Why: A change while another is out could act twice. How: This ignores it.



		setActReqBoo( true ); // What: Busy Set Call. Why: The next change waits for this one. How: This marks one as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next status should be announced afresh. How: This empties the status.



		try { // What: Change Try. Why: A change that lands is announced and shown. How: This awaits it, announces it, and reads the members again.


			await actStaFun(); // What: Change Call. Why: The group changes. How: This runs the change.

			setStaMesStr( donMesStr ); // What: Status Set Call. Why: The member hears what changed. How: This announces it.

			setLisVerNum( ( preVerNum ) => preVerNum + 1 ); // What: List Reread Call. Why: The members show the change. How: This asks for a new read.


		}

		catch ( errCatObj ) { // What: Change Catch. Why: A failed change has to be told. How: This logs it and announces why.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( errCatObj instanceof RangeError ? PER_ERR_STR : FAI_PEO_STR ); // What: Failure Announce Call. Why: A name outside its limits says what's allowed, and anything else asks to try again. How: This picks the alert's text by the error.

			setActReqBoo( false ); // What: Busy Clear Call. Why: The member can try again. How: This marks the change as done.



			return false;


		}



		setActReqBoo( false ); // What: Busy Clear Call. Why: The next change can run. How: This marks the change as done.



		return true;


	};

	// #endregion actRunFun



	// #region focTarFun

	/**
	 * focTarFun = Focus Target Function
	 *
	 * @summary
	 * Returns the ref for a control that may be owed focus as it's drawn,
	 * such as a confirmation's safe answer, or the button that opened it once
	 * the confirmation closes. When the control mounts while focTarRef names
	 * its key, it takes focus and the debt clears, so focus never falls to the
	 * page as one control replaces another.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param tarKeyStr - Target Key String: The control's key, such as
	 *                    'rotate' or 'remove-keep:' and a member's UID.
	 *
	 * @returns The ref callback for the control.
	 *
	 * @example
	 * ```ts
	 * focTarFun('rotate') // => ( butEleObj ) => void
	 * ```
	 *
	*/

	const focTarFun = ( tarKeyStr : string ) => ( butEleObj : HTMLButtonElement | null ) : void => { // What: Focus Target Function. Why: A confirmation replaces its button, and the button replaces the confirmation, each needing focus as it appears. How: This returns a ref that focuses the control when it's owed.


		if ( butEleObj === null || focTarRef.current !== tarKeyStr ) return; // What: Owed Guard. Why: Only the control owed focus takes it, and only once it's drawn. How: This returns otherwise.



		focTarRef.current = ''; // What: Focus Clear Assignment. Why: The move is owed once. How: This clears the debt.

		butEleObj.focus(); // What: Focus Call. Why: The next key press carries on from the control that replaced the one pressed. How: This focuses it.


	};

	// #endregion focTarFun



	// #region linCopFun

	/**
	 * linCopFun = Link Copy Function
	 *
	 * @summary
	 * Copies the invite link and announces it. Where the browser won't copy,
	 * such as without permission, it selects the link in its box instead and
	 * asks the member to copy it themselves.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the copy is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * linCopFun() // => Promise<void>
	 * ```
	 *
	*/

	const linCopFun = async () : Promise< void > => { // What: Link Copy Function. Why: The link is shared by pasting it somewhere else. How: This copies it, or selects it where copying fails.


		setStaMesStr( '' ); // What: Status Clear Call. Why: A second copy should be announced again. How: This empties the status.



		try { // What: Copy Try. Why: The link lands on the clipboard. How: This writes it there and announces it.


			await navigator.clipboard.writeText( linValStr ); // What: Clipboard Write Call. Why: The link is pasted elsewhere. How: This copies it.

			setStaMesStr( 'Link copied.' ); // What: Copied Status Call. Why: The copy happens out of sight. How: This announces it.


		}

		catch { // What: Copy Fallback. Why: A browser may refuse the clipboard. How: This selects the link and asks the member to copy it.


			invLinRef.current?.select(); // What: Link Select Call. Why: A selected link is one keystroke from copied. How: This selects the box's text.

			setStaMesStr( 'Link selected. Copy it to share it.' ); // What: Selected Status Call. Why: The member has to finish the copy. How: This says so.


		}


	};

	// #endregion linCopFun



	// #region namSavFun

	/**
	 * namSavFun = Name Save Function
	 *
	 * @summary
	 * Saves the member's new name: a tidied name outside its limits is refused
	 * with the alert before anything is sent; otherwise it's saved as one
	 * announced change, and once it lands the form closes, owing its button
	 * focus.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the save is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * namSavFun() // => Promise<void>
	 * ```
	 *
	*/

	const namSavFun = async () : Promise< void > => { // What: Name Save Function. Why: A member renames themselves in this group. How: This checks, saves, and closes the form.


		const namNorStr = texNorFun( namTexStr ); // What: Name Normalized String. Why: The name is checked and announced as it'll be saved. How: This tidies it.


		if ( !perNamFun( namNorStr ) ) { setErrMesStr( PER_ERR_STR ); return; } // What: Limits Guard. Why: A name outside its limits is refused before it's sent. How: This announces what's allowed and stops.



		const lanValBoo = await actRunFun( () => namSetFun( curGroObj.ideStr, namTexStr ), `Your name is now ${ namNorStr }.` ); // What: Landed Value Boolean. Why: The form closes only once the name is saved. How: This saves it as one change.


		if ( !lanValBoo ) return; // What: Failed Guard. Why: A failed save keeps the form to fix. How: This returns.



		focEdiRef.current = true; // What: Focus Owed Set. Why: The button takes focus once the form has gone. How: This owes it.

		setEdiNamBoo( false ); // What: Form Close Call. Why: The saved name shows in its row. How: This closes the form.


	};

	// #endregion namSavFun



	// #region reqAnsFun

	/**
	 * reqAnsFun = Request Answer Function
	 *
	 * @summary
	 * Answers one or more join requests as one announced change: it owes
	 * focus a heading once every answered request has left the list, then
	 * runs the answer, clearing the debt should it fail, and hides any
	 * confirmation once it lands.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param uidValArr - UID Value Array: The joiners being answered.
	 * @param actStaFun - Action Start Function: Starts the answer.
	 * @param donMesStr - Done Message String: What to announce once it lands.
	 *
	 * @returns A promise that settles once the answer is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * reqAnsFun(['u9F...'], decStaFun, 'Declined Dana.') // => Promise<void>
	 * ```
	 *
	*/

	const reqAnsFun = async ( uidValArr : string[], actStaFun : () => Promise< unknown >, donMesStr : string ) : Promise< void > => { // What: Request Answer Function. Why: Approving, declining, and blocking each end a request, taking its buttons with it. How: This owes focus a heading, runs the answer, and tidies up after it.


		if ( actReqBoo ) return; // What: Busy Guard. Why: An answer while another change is out could act twice, and mustn't owe focus. How: This ignores it.



		focUidRef.current = uidValArr; // What: Focus Owed Assignment. Why: A deletion can leave the list before the answer resolves. How: This owes focus before it starts.


		const lanValBoo = await actRunFun( actStaFun, donMesStr ); // What: Landed Value Boolean. Why: A failed answer keeps its request and its buttons. How: This runs the answer as one change.


		if ( !lanValBoo ) { focUidRef.current = []; return; } // What: Failed Guard. Why: The request still shows, so no focus is owed. How: This clears the debt and returns.



		setConAllBoo( false ); // What: All Confirm Hide Call. Why: The answer is done. How: This hides the decline-all question.

		setConBloStr( '' ); // What: Block Confirm Hide Call. Why: The answer is done. How: This hides the block question.


	};

	// #endregion reqAnsFun



	return (


		<div className={ cssModObj.groPeoDiv }>{ /* What: Group People Div Element. Why: The link and the members read top to bottom. How: This stacks the heading and the two parts inside the gutter. */ }


			<h2 className={ cssModObj.peoTitHea }>People</h2>{ /* What: People Title Heading Element. Why: The section needs a heading. How: This names it. */ }



			<section
				className={ cssModObj.invLinSec }

				aria-labelledby='invLinHea'
			>{ /* What: Invite Link Section Element. Why: Sharing the link is how people join. How: This holds its heading, note, box, and buttons. */ }


				<h3
					id='invLinHea'

					className={ cssModObj.invTitHea }
				>Invite people</h3>{ /* What: Invite Title Heading Element. Why: The part needs a heading. How: This names it. */ }

				<p className={ cssModObj.invNotPar }>Anyone with this link can ask to join. A member approves each request.</p>{ /* What: Invite Note Paragraph Element. Why: The member should know what the link lets others do. How: This says it. */ }

				<label
					className={ cssModObj.invLabLab }
					htmlFor='invLinInp'
				>Invite link</label>{ /* What: Invite Label Label Element. Why: The box needs a visible name. How: This labels it. */ }

				<input
					ref={ invLinRef }
					id='invLinInp'

					className={ cssModObj.invLinInp }

					readOnly
					type='text'
					value={ linValStr }
				/>{ /* What: Invite Link Input Element. Why: The link is shown in full and can be selected. How: This holds it, read-only. */ }



				<div className={ cssModObj.invActDiv }>{ /* What: Invite Actions Div Element. Why: Copying and replacing the link sit together, or the replacement's confirmation in their place. How: This lays them out in one row that wraps. */ }


					{ conRotBoo ? ( // What: Rotate Confirm Check. Why: A new link stops the old one for everyone who hasn't used it, so it asks first. How: This shows the question and its answers, or else the buttons.


						<>{ /* What: Rotate Confirmation Fragment. Why: The question and its two answers replace the buttons together. How: This groups them without adding an element. */ }


							<p className={ cssModObj.conAskPar }>The old link will stop working. Anyone who hasn't used it yet will need the new one.</p>{ /* What: Confirm Ask Paragraph Element. Why: The owner should know what a new link does. How: This says it. */ }

							<button
								className={ cssModObj.actPlaBut }

								type='button'

								onClick={ () => void actRunFun( () => invRotFun( curGroObj.ideStr ), 'Made a new link.' ).then( () => { focTarRef.current = 'rotate'; setConRotBoo( false ); } ) } // What: Rotate Confirm Handler. Why: The owner confirmed, and the answer goes with the question. How: This makes the new link, announces it, owes its button focus, and hides the question.
							>Make the new link</button>{ /* What: Action Plain Button Element. Why: The new link is made on purpose. How: This makes it. */ }

							<button
								ref={ focTarFun( 'rotate-keep' ) }

								className={ cssModObj.actPlaBut }

								type='button'

								onClick={ () => { focTarRef.current = 'rotate'; setConRotBoo( false ); } } // What: Keep Handler. Why: The owner can change their mind, and the answer goes with the question. How: This owes the button focus and hides the question.
							>Keep this link</button>{ /* What: Action Plain Button Element. Why: The owner can change their mind. How: This hides the question. */ }


						</>


					) : ( // What: Buttons Branch. Why: Without a question showing, the link's buttons show. How: This shows them.


						<>{ /* What: Buttons Fragment. Why: Copying and, for the owner, replacing sit side by side. How: This groups them without adding an element. */ }


							<ButBasCom onClick={ () => void linCopFun() }>Copy link</ButBasCom>{ /* What: Copy Button Component. Why: Copying is the usual way to share the link. How: This copies it. */ }



							{ curGroObj.ownBoo && ( // What: Owner Rotate Check. Why: Only the owner replaces the link (Section 9). How: This offers it to them.


								<button
									ref={ focTarFun( 'rotate' ) }

									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => { focTarRef.current = 'rotate-keep'; setConRotBoo( true ); } } // What: Rotate Click Handler. Why: The button goes with the question it opens, so focus lands on the safe answer. How: This owes Keep this link focus and shows the question.
								>Make a new link</button> // What: Action Plain Button Element. Why: An over-shared link can be replaced. How: This asks to confirm first.


							) }


						</>


					) }


				</div>


			</section>



			{ reqRecArr.length > 0 && ( // What: Requests Check. Why: The waiting list shows only while someone is waiting. How: This shows it when any request is pending.


				<section
					className={ cssModObj.reqLisSec }

					aria-labelledby='reqLisHea'
				>{ /* What: Request List Section Element. Why: The people waiting to join read as one part. How: This holds the heading, the advice, the requests, and, for two or more, the decline-all control. */ }


					<h3
						ref={ reqHeaRef }
						id='reqLisHea'

						className={ cssModObj.reqTitHea }

						tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once a request is answered and others wait, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
					>{ `Waiting to join (${ reqRecArr.length })` }</h3>{ /* What: Request Title Heading Element. Why: The part needs a heading, and the count helps. How: This names it with the number waiting. */ }

					<p className={ cssModObj.reqIntPar }>Approve only people you recognize. If you're not sure, check with them outside the app.</p>{ /* What: Request Intro Paragraph Element. Why: Anyone holding the link can type any name, so a name is only a claim (Section 17). How: This says to approve only people the member knows. */ }



					<ul className={ cssModObj.reqLisUno }>{ /* What: Request List Unordered List Element. Why: The requests read as one list. How: This stacks a row for each, oldest first. */ }


						{ reqRecArr.map( ( reqRecObj ) => { // What: Request Row Map. Why: Each request gets its own row. How: This renders one per request.


							const samNamBoo = memRecArr?.some( ( memRecObj ) => memRecObj.namTexStr.toLocaleLowerCase() === reqRecObj.namTexStr.toLocaleLowerCase() ) === true; // What: Same Name Boolean. Why: A request reusing a member's name may be someone posing as them (Section 17). How: This is true when a member's name matches, ignoring case.



							return (


								<li
									key={ reqRecObj.uidValStr }

									className={ cssModObj.reqRowIte }

									data-waiting-item-key={ `join:${ reqRecObj.uidValStr }` } // What: Waiting Item Key. Why: The notices sheet can jump to this request. How: This names it by kind and joiner.

									tabIndex={ -1 } // What: Row Tab Index. Why: A jump focuses the row so it's announced, but the row isn't a control. How: This lets a script focus it without joining the Tab order.
								>{ /* What: Request Row Item Element. Why: A request shows who is asking, when, any warning, their note, and the answers. How: This stacks them down the row. */ }


									<span className={ cssModObj.reqNamSpa }>{ reqRecObj.namTexStr }</span>{ /* What: Request Name Span Element. Why: The member recognizes the joiner by name. How: This shows the name they asked with. */ }

									<span className={ cssModObj.reqTimSpa }>{ `Asked ${ mesTimFun( reqRecObj.reqTimNum, Date.now() ) }` }</span>{ /* What: Request Time Span Element. Why: A request's age helps place who sent it. How: This says when it was made, as the chat labels its messages. */ }



									{ samNamBoo && ( // What: Same Name Check. Why: The screen points out a request reusing a member's name (Section 17). How: This shows the warning when one does.


										<p className={ cssModObj.reqWarPar }>A member already has this name. Check with them before you approve.</p> // What: Request Warning Paragraph Element. Why: A matching name may be someone else using it. How: This says to check first.


									) }



									{ reqRecObj.notTexStr !== '' && ( // What: Note Check. Why: A note helps when the name isn't enough. How: This shows it when there is one.


										<p className={ cssModObj.reqNotPar }>{ `“${ reqRecObj.notTexStr }”` }</p> // What: Request Note Paragraph Element. Why: The joiner's note says how the group knows them. How: This quotes it.


									) }



									<span className={ cssModObj.reqActSpa }>{ /* What: Request Actions Span Element. Why: The answers sit together below the request, or a block's confirmation in their place. How: This lines them up in a row that wraps. */ }


										{ conBloStr === reqRecObj.uidValStr ? ( // What: Block Confirm Check. Why: A block stops this person asking again, so it asks first. How: This shows the question and its answers, or else the three answers.


											<>{ /* What: Block Confirmation Fragment. Why: The question and its two answers replace the buttons together. How: This groups them without adding an element. */ }


												<span className={ cssModObj.conAskSpa }>{ `Block ${ reqRecObj.namTexStr }? They won't be able to ask to join again.` }</span>{ /* What: Confirm Ask Span Element. Why: The member should know what blocking does. How: This asks, naming the joiner. */ }

												<button
													className={ cssModObj.actDanBut }

													type='button'

													onClick={ () => void reqAnsFun( [ reqRecObj.uidValStr ], () => reqBloFun( curGroObj.ideStr, reqRecObj.uidValStr ), `Blocked ${ reqRecObj.namTexStr }.` ) } // What: Block Confirm Handler. Why: The member confirmed. How: This blocks the joiner and announces it.
												>Yes, block</button>{ /* What: Action Danger Button Element. Why: Blocking is confirmed on purpose. How: This blocks the joiner. */ }

												<button
													ref={ focTarFun( `block-keep:${ reqRecObj.uidValStr }` ) }

													className={ cssModObj.actPlaBut }

													type='button'

													onClick={ () => { focTarRef.current = `block:${ reqRecObj.uidValStr }`; setConBloStr( '' ); } } // What: Don't Block Handler. Why: The member can change their mind, and the answer goes with the question. How: This owes the Block button focus and hides the question.
												>{ "Don't block" }</button>{ /* What: Action Plain Button Element. Why: The member can change their mind. How: This hides the question. */ }


											</>


										) : ( // What: Answers Branch. Why: Without a question showing, the three answers show. How: This shows them.


											<>{ /* What: Answers Fragment. Why: Approving, declining, and blocking sit side by side. How: This groups them without adding an element. */ }


												<ButBasCom onClick={ () => void reqAnsFun( [ reqRecObj.uidValStr ], () => reqAppFun( curGroObj.ideStr, reqRecObj.uidValStr ), `Approved ${ reqRecObj.namTexStr }. They're in the group.` ) }>Approve<span className={ cssModObj.actHidSpa }>{ ` ${ reqRecObj.namTexStr }` }</span></ButBasCom>{ /* What: Approve Button Component. Why: Letting a joiner in is the leading answer, and a screen reader hears who. How: This approves the request. */ }

												<button
													className={ cssModObj.actPlaBut }

													type='button'

													onClick={ () => void reqAnsFun( [ reqRecObj.uidValStr ], () => reqDecFun( curGroObj.ideStr, reqRecObj.uidValStr ), `Declined ${ reqRecObj.namTexStr }.` ) } // What: Decline Handler. Why: A decline ends the request, and the joiner may ask again. How: This declines it and announces it.
												>Decline<span className={ cssModObj.actHidSpa }>{ ` ${ reqRecObj.namTexStr }` }</span></button>{ /* What: Action Plain Button Element. Why: A member turns a request down, and a screen reader hears whose. How: This declines it. */ }

												<button
													ref={ focTarFun( `block:${ reqRecObj.uidValStr }` ) }

													className={ cssModObj.actPlaBut }

													type='button'

													onClick={ () => { focTarRef.current = `block-keep:${ reqRecObj.uidValStr }`; setConBloStr( reqRecObj.uidValStr ); } } // What: Block Click Handler. Why: The button goes with the question it opens, so focus lands on the safe answer. How: This owes Don't block focus and shows the question.
												>Block<span className={ cssModObj.actHidSpa }>{ ` ${ reqRecObj.namTexStr }` }</span></button>{ /* What: Action Plain Button Element. Why: A request from someone unwelcome can be ended for good, and a screen reader hears whose. How: This asks to confirm first. */ }


											</>


										) }


									</span>


								</li>


							);


						} ) }


					</ul>



					{ reqRecArr.length > 1 && ( // What: Decline All Check. Why: A flood through a leaked link is cleared at once (Section 17). How: This offers it when two or more wait.


						<div className={ cssModObj.reqAllDiv }>{ /* What: Request All Div Element. Why: Declining every request sits below the list, or its confirmation in its place. How: This lays them out in one row that wraps. */ }


							{ conAllBoo ? ( // What: All Confirm Check. Why: Declining everyone at once is easy to regret, so it asks first. How: This shows the question and its answers, or else the button.


								<>{ /* What: All Confirmation Fragment. Why: The question and its two answers replace the button together. How: This groups them without adding an element. */ }


									<p className={ cssModObj.conAskPar }>{ `Decline all ${ reqRecArr.length } requests?` }</p>{ /* What: Confirm Ask Paragraph Element. Why: The member should know how many they're declining. How: This asks with the count. */ }

									<button
										className={ cssModObj.actDanBut }

										type='button'

										onClick={ () => void reqAnsFun( reqRecArr.map( ( reqRecObj ) => reqRecObj.uidValStr ), () => Promise.all( reqRecArr.map( ( reqRecObj ) => reqDecFun( curGroObj.ideStr, reqRecObj.uidValStr ) ) ), `Declined ${ reqRecArr.length } requests.` ) } // What: All Confirm Handler. Why: The member confirmed. How: This declines every request shown and announces how many.
									>Yes, decline all</button>{ /* What: Action Danger Button Element. Why: Declining everyone is confirmed on purpose. How: This declines them all. */ }

									<button
										ref={ focTarFun( 'all-keep' ) }

										className={ cssModObj.actPlaBut }

										type='button'

										onClick={ () => { focTarRef.current = 'all'; setConAllBoo( false ); } } // What: Keep Them Handler. Why: The member can change their mind, and the answer goes with the question. How: This owes Decline all focus and hides the question.
									>Keep them</button>{ /* What: Action Plain Button Element. Why: The member can change their mind. How: This hides the question. */ }


								</>


							) : ( // What: Button Branch. Why: Without a question showing, the button shows. How: This shows it.


								<button
									ref={ focTarFun( 'all' ) }

									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => { focTarRef.current = 'all-keep'; setConAllBoo( true ); } } // What: Decline All Click Handler. Why: The button goes with the question it opens, so focus lands on the safe answer. How: This owes Keep them focus and shows the question.
								>Decline all</button> // What: Action Plain Button Element. Why: A flood is cleared in one step. How: This asks to confirm first.


							) }


						</div>


					) }


				</section>


			) }



			{ keyReqArr.some( ( keyReqObj ) => keyReqObj.uidValStr !== uidValStr ) && ( // What: Key Requests Check. Why: The key list shows only while someone else waits for the key, since a member can't answer their own request. How: This shows it when any other member's request stands.


				<section
					className={ cssModObj.keyLisSec }

					aria-labelledby='keyLisHea'
				>{ /* What: Key List Section Element. Why: The members waiting on a new phone read as one part. How: This holds the heading, the note, and the list. */ }


					<h3
						ref={ keyHeaRef }
						id='keyLisHea'

						className={ cssModObj.keyTitHea }

						tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once a request is answered and others wait, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
					>{ "Waiting for the group's key" }</h3>{ /* What: Key Title Heading Element. Why: The part needs a heading. How: This names it. */ }

					<p className={ cssModObj.keyIntPar }>These members got their account back on a new device. Share the key so they can read the group again.</p>{ /* What: Key Intro Paragraph Element. Why: The member should know why someone is waiting (Section 6). How: This says it. */ }



					<ul className={ cssModObj.keyLisUno }>{ /* What: Key List Unordered List Element. Why: The requests read as one list. How: This stacks a row for each. */ }


						{ keyReqArr.filter( ( keyReqObj ) => keyReqObj.uidValStr !== uidValStr ).map( ( keyReqObj ) => { // What: Key Row Map. Why: Each other member waiting gets their own row. How: This renders one per request, leaving out the member's own.


							const keyNamStr = memRecArr?.find( ( memRecObj ) => memRecObj.uidValStr === keyReqObj.uidValStr )?.namTexStr || 'A member'; // What: Key Name String. Why: The member recognizes whom they're sharing with. How: This finds their name, or says a member when it's unread.



							return (


								<li
									key={ keyReqObj.uidValStr }

									className={ cssModObj.keyRowIte }

									data-waiting-item-key={ `key:${ keyReqObj.uidValStr }` } // What: Waiting Item Key. Why: The notices sheet can jump to this request. How: This names it by kind and member.

									tabIndex={ -1 } // What: Row Tab Index. Why: A jump focuses the row so it's announced, but the row isn't a control. How: This lets a script focus it without joining the Tab order.
								>{ /* What: Key Row Item Element. Why: A request shows who is waiting, since when, and the share. How: This stacks them down the row. */ }


									<span className={ cssModObj.keyNamSpa }>{ keyNamStr }</span>{ /* What: Key Name Span Element. Why: The member is known by their name. How: This shows it. */ }

									<span className={ cssModObj.keyTimSpa }>{ `Asked ${ mesTimFun( keyReqObj.reqTimNum, Date.now() ) }` }</span>{ /* What: Key Time Span Element. Why: A request's age helps place it. How: This says when it was made, as the chat labels its messages. */ }

									<button
										className={ cssModObj.actPlaBut }

										type='button'

										onClick={ () => { if ( actReqBoo ) return; focKeyRef.current = keyReqObj.uidValStr; void actRunFun( () => keyShaFun( curGroObj.ideStr, keyReqObj.uidValStr ), `Shared the key with ${ keyNamStr }.` ).then( ( lanValBoo ) => { if ( !lanValBoo ) focKeyRef.current = ''; } ); } } // What: Share Handler. Why: The member on a new phone reads the group again once the key is shared, and the button goes with the request. How: This owes focus a heading, shares the key, and announces it, clearing the debt should it fail.
									>Share the key<span className={ cssModObj.actHidSpa }>{ ` with ${ keyNamStr }` }</span></button>{ /* What: Action Plain Button Element. Why: Sharing is done on purpose, and a screen reader hears with whom. How: This shares the key. */ }


								</li>


							);


						} ) }


					</ul>


				</section>


			) }



			{ uidValStr !== '' && ( // What: History Requests Check. Why: The list leaves out the member's own request, so it waits for the member's UID. How: This shows it once the UID is known.


				<HisReqCom
					groIdeStr={ curGroObj.ideStr }
					memRecArr={ memRecArr }
					uidValStr={ uidValStr }

					onAnnFun={ ( mesValStr ) => { setStaMesStr( '' ); window.setTimeout( () => setStaMesStr( mesValStr ), 0 ); } } // What: Announce Handler. Why: A message repeated from before should still be heard. How: This empties the status, then sets the message a moment later.
				/> // What: History Requests Component. Why: Members see who is missing chat history and can send it (Section 11.9). How: This shows the list, announcing through the section's status.


			) }



			<section
				className={ cssModObj.memLisSec }

				aria-labelledby='memLisHea'
			>{ /* What: Member List Section Element. Why: The group's members read as one part. How: This holds the heading and the list. */ }


				<h3
					ref={ memHeaRef }
					id='memLisHea'

					className={ cssModObj.memTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once the last request is answered, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>{ memRecArr === null ? 'Members' : `Members (${ memRecArr.length })` }</h3>{ /* What: Member Title Heading Element. Why: The part needs a heading, and the count helps. How: This names it, with the count once read. */ }



				{ memRecArr === null ? ( // What: Members Loaded Check. Why: Until the read lands, there's no one to list. How: This says the list is loading, or else shows it.


					<p className={ cssModObj.memNotPar }>Loading members…</p> // What: Member Note Paragraph Element. Why: An empty space would read as broken. How: This says the list is loading.


				) : ( // What: List Branch. Why: The members are read. How: This lists them.


					<ul className={ cssModObj.memLisUno }>{ /* What: Member List Unordered List Element. Why: The members read as one list. How: This stacks a row for each. */ }


						{ memRecArr.map( ( memRecObj ) => { // What: Member Row Map. Why: Each member gets their own row. How: This renders one per member.


							const ownMemBoo = memRecObj.uidValStr === uidValStr;                  // What: Own Member Boolean. Why: The member's own row offers a name change. How: This is true for their row.
							const ownGroBoo = memRecObj.uidValStr === curGroObj.ownUidStr;        // What: Owner Group Boolean. Why: The owner is marked. How: This is true for the owner's row.
							const remAllBoo = curGroObj.ownBoo && !ownMemBoo;                    // What: Remove Allowed Boolean. Why: Only the owner removes, and never themselves (Section 9). How: This is true on the owner's view of others' rows.



							return (


								<li
									key={ memRecObj.uidValStr }

									className={ cssModObj.memRowIte }
								>{ /* What: Member Row Item Element. Why: A member shows their avatar, name, and what can be done. How: This lays the avatar beside the name and the actions, or the name form in their place. */ }


									<span
										className={ cssModObj.memAvaSpa }
										style={{ backgroundColor : sloColFun( memRecObj.colSloNum ) }} // What: Avatar Color Note. Why: Each member wears their own color. How: This reads their slot's token.

										aria-hidden='true'
									>{ iniTexFun( memRecObj.namTexStr ) }</span>{ /* What: Member Avatar Span Element. Why: An avatar in the member's color ties them to their messages and claims, while their name is read beside it. How: This shows their initials, hidden from screen readers. */ }



									{ ownMemBoo && ediNamBoo ? ( // What: Name Form Check. Why: The member changes their name in place. How: This shows the form, or else the name and the row's actions.


										<form
											className={ cssModObj.namEdiFor }

											noValidate

											onKeyDown={ ( keyEveObj ) => { if ( keyEveObj.key === 'Escape' ) { keyEveObj.preventDefault(); focEdiRef.current = true; setEdiNamBoo( false ); } } } // What: Escape Handler. Why: Escape leaves the form. How: This owes its button focus and closes it.
											onSubmit={ ( subEveObj ) => { subEveObj.preventDefault(); void namSavFun(); } } // What: Submit Handler. Why: The name is checked and saved by the app, not by a page load. How: This cancels the browser's submit and saves the name.
										>{ /* What: Name Edit Form Element. Why: The member's name in this group is changed here. How: This holds the box and its two buttons. */ }


											<label
												className={ cssModObj.namLabLab }
												htmlFor='namEdiInp'
											>Your name in this group</label>{ /* What: Name Label Label Element. Why: The box needs a visible name. How: This labels it. */ }

											<input
												ref={ namInpRef }
												id='namEdiInp'

												className={ cssModObj.namEdiInp }

												autoComplete='given-name'
												maxLength={ 40 }
												type='text'
												value={ namTexStr }

												onChange={ ( chaEveObj ) => setNamTexStr( chaEveObj.target.value ) }
											/>{ /* What: Name Edit Input Element. Why: The new name is typed here. How: This holds it, at most 40 characters. */ }

											<ButBasCom
												className={ cssModObj.namSavBut }

												type='submit'
											>Save</ButBasCom>{ /* What: Name Save Button Component. Why: The name is saved on purpose. How: This submits the form. */ }

											<button
												className={ cssModObj.namCanBut }

												type='button'

												onClick={ () => { focEdiRef.current = true; setEdiNamBoo( false ); } } // What: Cancel Handler. Why: The member can leave without a change. How: This owes the button focus and closes the form.
											>Cancel</button>{ /* What: Name Cancel Button Element. Why: Leaving the form is as easy as saving. How: This closes it. */ }


										</form>


									) : ( // What: Row Branch. Why: A member not being renamed shows their name and the row's actions. How: This shows them.


										<>{ /* What: Row Fragment. Why: The name and the actions fill the row's areas as its own children. How: This groups them without adding an element. */ }


											<span className={ cssModObj.memNamSpa }>{ memRecObj.namTexStr }{ ownMemBoo && <span className={ cssModObj.memTagSpa }> (you)</span> }{ ownGroBoo && <span className={ cssModObj.memTagSpa }> · owner</span> }</span>{ /* What: Member Name Span Element. Why: Each member is known by their name, with themselves and the owner marked. How: This shows the name and any marks. */ }



											<span className={ cssModObj.memActSpa }>{ /* What: Member Actions Span Element. Why: A row's actions sit together at its end. How: This lines them up in a row, or a removal's confirmation in their place. */ }


												{ ownMemBoo && ( // What: Rename Check. Why: Only the member changes their own name. How: This offers it on their row.


													<button
														ref={ ediButRef }

														className={ cssModObj.actPlaBut }

														type='button'

														onClick={ () => { setNamTexStr( memRecObj.namTexStr ); setErrMesStr( '' ); setEdiNamBoo( true ); } } // What: Rename Click Handler. Why: The form starts from the member's name, with no failure left from before. How: This fills the box, clears the alert, and opens the form.
													>Change name</button> // What: Action Plain Button Element. Why: A member renames themselves in this group. How: This opens the form.


												) }

												{ remAllBoo && conRemStr !== memRecObj.uidValStr && ( // What: Remove Check. Why: The owner removes anyone else, asking first. How: This offers the removal.


													<button
														ref={ focTarFun( `remove:${ memRecObj.uidValStr }` ) }

														className={ cssModObj.actPlaBut }

														type='button'

														onClick={ () => { focTarRef.current = `remove-keep:${ memRecObj.uidValStr }`; setConRemStr( memRecObj.uidValStr ); } } // What: Remove Click Handler. Why: The button goes with the question it opens, so focus lands on the safe answer. How: This owes Keep focus and shows the question.
													>Remove<span className={ cssModObj.actHidSpa }>{ ` ${ memRecObj.namTexStr }` }</span></button> // What: Action Plain Button Element. Why: The owner removes a member, and a screen reader hears who. How: This asks to confirm first.


												) }

												{ remAllBoo && conRemStr === memRecObj.uidValStr && ( // What: Remove Confirm Check. Why: Removing someone also replaces the link, so it asks first. How: This shows the question and its answers.


													<>{ /* What: Remove Confirmation Fragment. Why: The question and its two answers replace the button together. How: This groups them without adding an element. */ }


														<span className={ cssModObj.conAskSpa }>{ `Remove ${ memRecObj.namTexStr }? This also makes a new invite link.` }</span>{ /* What: Confirm Ask Span Element. Why: The owner should know what removing does. How: This asks, naming the member. */ }

														<button
															className={ cssModObj.actDanBut }

															type='button'

															onClick={ () => void actRunFun( () => memRemFun( curGroObj.ideStr, memRecObj.uidValStr ), `Removed ${ memRecObj.namTexStr }. The invite link changed.` ).then( ( lanValBoo ) => { if ( lanValBoo ) memHeaRef.current?.focus(); else focTarRef.current = `remove:${ memRecObj.uidValStr }`; setConRemStr( '' ); } ) } // What: Remove Confirm Handler. Why: The owner confirmed, and a removed member's row goes with its buttons. How: This removes the member, announces it with the new link, moves focus to the members' heading, or back to the Remove button when it failed, and hides the question.
														>Yes, remove</button>{ /* What: Action Danger Button Element. Why: Removing is confirmed on purpose. How: This removes the member. */ }

														<button
															ref={ focTarFun( `remove-keep:${ memRecObj.uidValStr }` ) }

															className={ cssModObj.actPlaBut }

															type='button'

															onClick={ () => { focTarRef.current = `remove:${ memRecObj.uidValStr }`; setConRemStr( '' ); } } // What: Keep Handler. Why: The owner can change their mind, and the answer goes with the question. How: This owes the Remove button focus and hides the question.
														>Keep</button>{ /* What: Action Plain Button Element. Why: The owner can change their mind. How: This hides the question. */ }


													</>


												) }


											</span>


										</>


									) }


								</li>


							);


						} ) }


					</ul>


				) }


			</section>



			<p
				className={ cssModObj.peoStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: People Status Paragraph Element. Why: A copy or a change is announced, since the page itself changes silently. How: This holds the status, empty from the first render. */ }

			<p
				className={ cssModObj.peoErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: People Error Paragraph Element. Why: A change that fails has to be told at once. How: This holds the alert, empty from the first render. */ }


		</div>


	);


}

// #endregion GroPeoCom

// #endregion Components



// #region Exports

export { GroPeoCom }; // What: Named Export. Why: The group frame shows the People section with it. How: This exports GroPeoCom.

// #endregion Exports


