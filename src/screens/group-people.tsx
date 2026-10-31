


// #region Imports

import cssModObj from './group-people.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Copying the link and saving a name are the section's leading actions. How: This draws their buttons.
import { ideEnsFun } from '../state/identity.ts';   // What: Identity Ensure Function. Why: The member's own row offers a name change. How: This reads their UID.
import { iniTexFun } from '../utils/text.ts';       // What: Initials Text Function. Why: Each member's avatar shows their initials. How: This takes them from the name.
import { invRotFun } from '../state/groups.ts';     // What: Invite Rotate Function. Why: The owner can make a new invite link. How: This swaps the link.
import { memLisFun } from '../state/members.ts';    // What: Member List Function. Why: The section lists the group's members. How: This reads them.
import { memRemFun } from '../state/members.ts';    // What: Member Remove Function. Why: The owner can remove a member. How: This removes them and swaps the link.
import { namSetFun } from '../state/members.ts';    // What: Name Set Function. Why: A member changes their own name in the group. How: This saves it.
import { perNamFun } from '../core/text-limits.ts'; // What: Person Name Function. Why: A name outside its limits is caught before it's sent. How: This checks it.
import { sloColFun } from '../ui/member-color.ts';  // What: Slot Color Function. Why: Each member's avatar wears their color. How: This names it.
import { texNorFun } from '../core/text-limits.ts'; // What: Text Normalize Function. Why: A name is checked as it'll be saved. How: This tidies it.
import { useEffect } from 'react';                  // What: Use Effect. Why: The section reads its members when it opens and after each change, and an edit moves focus. How: This starts the reads and moves focus.
import { useRef    } from 'react';                  // What: Use Reference. Why: Focus moves between a control and the form it opens. How: This holds the elements.
import { useState  } from 'react';                  // What: Use State. Why: The members, the open form, and the messages change while the section is open. How: This holds each.


import type { GroRecTyp } from '../state/groups.ts';  // What: Group Record Type. Why: The section shows one group's members and link. How: This types the group.
import type { MemRecTyp } from '../state/members.ts'; // What: Member Record Type. Why: The section lists the members. How: This types each.

// #endregion Imports



/**
 * group-people.tsx = Group People
 *
 * @summary
 * The open group's People section: the invite link, which any member copies
 * and the owner can replace, and the members, each with their avatar in
 * their color, the member's own name changeable from their row, and anyone
 * else removable by the owner after confirming. Each change is announced,
 * and one that fails says why.
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

type GpcProTyp = { curGroObj : GroRecTyp }; // What: Group People Component Props Type. Why: The section shows one group. How: This types GroPeoCom's one prop.

// #region GroPeoCom

/**
 * GroPeoCom = Group People Component
 *
 * @summary
 * Renders the open group's People section. The invite link shows in a
 * read-only box with a button that copies it, falling back to selecting it
 * where the browser won't copy, and the owner's button that makes a new
 * link after confirming. The members list in name order, the owner marked,
 * the member's own row offering to change their name in a form that takes
 * and returns focus, and each other row offering the owner a removal after
 * confirming, which also makes a new link. Changes are announced through a
 * status region and failures through an alert, and the members are read
 * again after each change. Key it by the group, so another group starts
 * afresh.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.curGroObj - Current Group Object: The open group.
 *
 * @returns The section.
 *
 * @example
 * ```tsx
 * GroPeoCom({ curGroObj }) // => <GroPeoCom />
 * ```
 *
*/

function GroPeoCom ( { curGroObj } : GpcProTyp ) : React.JSX.Element {


	const ediButRef = useRef< HTMLButtonElement >( null ); // What: Edit Button Reference. Why: Leaving the name form returns focus to its button. How: This holds the button.
	const focEdiRef = useRef( false );                     // What: Focus Edit Reference. Why: Focus returns to the button once the form has gone. How: This is true while that's owed.
	const invLinRef = useRef< HTMLInputElement >( null );  // What: Invite Link Reference. Why: Where the browser won't copy, the link is selected for the member to copy. How: This holds its box.
	const namInpRef = useRef< HTMLInputElement >( null );  // What: Name Input Reference. Why: The name form puts the member in its box. How: This holds the box.

	const [ actReqBoo, setActReqBoo ] = useState( false );                                    // What: Action Request Boolean And Setter. Why: One change at a time keeps a double tap from acting twice. How: This is true while one is out.
	const [ conRemStr, setConRemStr ] = useState( '' );                                       // What: Confirm Remove String And Setter. Why: Removing asks to confirm first. How: This holds the UID being confirmed, empty when none is.
	const [ conRotBoo, setConRotBoo ] = useState( false );                                    // What: Confirm Rotate Boolean And Setter. Why: A new link asks to confirm first. How: This is true while the confirmation shows.
	const [ ediNamBoo, setEdiNamBoo ] = useState( false );                                    // What: Edit Name Boolean And Setter. Why: The member's row turns into a name form. How: This is true while it shows.
	const [ errMesStr, setErrMesStr ] = useState( '' );                                       // What: Error Message String And Setter. Why: A failed change is announced. How: This holds the alert's text, empty when there's none.
	const [ lisVerNum, setLisVerNum ] = useState( 0 );                                        // What: List Version Number And Setter. Why: A change reads the members again. How: This counts the reads asked for.
	const [ memRecArr, setMemRecArr ] = useState< MemRecTyp[] | null >( null );               // What: Member Record Array And Setter. Why: The section lists the members. How: This holds them in name order, null until read.
	const [ namTexStr, setNamTexStr ] = useState( '' );                                       // What: Name Text String And Setter. Why: The name box shows what's typed. How: This holds it.
	const [ staMesStr, setStaMesStr ] = useState( '' );                                       // What: Status Message String And Setter. Why: A change that lands is announced. How: This holds the status's text.
	const [ uidValStr, setUidValStr ] = useState( '' );                                       // What: UID Value String And Setter. Why: The member's own row is marked and editable. How: This holds their UID, empty until read.


	const linValStr = `${ window.location.origin }/join/${ curGroObj.tokStr }`; // What: Link Value String. Why: The link opens the group's invite screen. How: This joins the app's address and the group's current token.



	useEffect( () => { // What: Members Load Effect. Why: The section shows the members when it opens and after each change. How: This reads the UID and the members.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after a newer one began, or after the section closed, mustn't change it. How: This is true until the cleanup runs.


		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: The member's own row is marked. How: This reads the UID.

		void memLisFun( curGroObj.ideStr ).then( ( lisRecArr ) => { if ( actValBoo ) setMemRecArr( [ ...lisRecArr ].sort( ( memOneObj, memTwoObj ) => memOneObj.namTexStr.localeCompare( memTwoObj.namTexStr ) ) ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Members Read Call. Why: The section lists everyone by name. How: This reads the members and sorts them, logging a failure.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A read still out shouldn't land after a newer one began. How: This marks it stale.


	}, [ curGroObj.ideStr, lisVerNum ] ); // What: Effect Dependency Array. Why: The members belong to one group and are read again after each change. How: curGroObj.ideStr names the group, and lisVerNum counts the reads asked for.



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

								onClick={ () => void actRunFun( () => invRotFun( curGroObj.ideStr ), 'Made a new link.' ).then( () => setConRotBoo( false ) ) } // What: Rotate Confirm Handler. Why: The owner confirmed. How: This makes the new link, announces it, and hides the question.
							>Make the new link</button>{ /* What: Action Plain Button Element. Why: The new link is made on purpose. How: This makes it. */ }

							<button
								className={ cssModObj.actPlaBut }

								type='button'

								onClick={ () => setConRotBoo( false ) }
							>Keep this link</button>{ /* What: Action Plain Button Element. Why: The owner can change their mind. How: This hides the question. */ }


						</>


					) : ( // What: Buttons Branch. Why: Without a question showing, the link's buttons show. How: This shows them.


						<>{ /* What: Buttons Fragment. Why: Copying and, for the owner, replacing sit side by side. How: This groups them without adding an element. */ }


							<ButBasCom onClick={ () => void linCopFun() }>Copy link</ButBasCom>{ /* What: Copy Button Component. Why: Copying is the usual way to share the link. How: This copies it. */ }



							{ curGroObj.ownBoo && ( // What: Owner Rotate Check. Why: Only the owner replaces the link (Section 9). How: This offers it to them.


								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => setConRotBoo( true ) }
								>Make a new link</button> // What: Action Plain Button Element. Why: An over-shared link can be replaced. How: This asks to confirm first.


							) }


						</>


					) }


				</div>


			</section>



			<section
				className={ cssModObj.memLisSec }

				aria-labelledby='memLisHea'
			>{ /* What: Member List Section Element. Why: The group's members read as one part. How: This holds the heading and the list. */ }


				<h3
					id='memLisHea'

					className={ cssModObj.memTitHea }
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
														className={ cssModObj.actPlaBut }

														type='button'

														onClick={ () => setConRemStr( memRecObj.uidValStr ) }
													>Remove<span className={ cssModObj.memHidSpa }>{ ` ${ memRecObj.namTexStr }` }</span></button> // What: Action Plain Button Element. Why: The owner removes a member, and a screen reader hears who. How: This asks to confirm first.


												) }

												{ remAllBoo && conRemStr === memRecObj.uidValStr && ( // What: Remove Confirm Check. Why: Removing someone also replaces the link, so it asks first. How: This shows the question and its answers.


													<>{ /* What: Remove Confirmation Fragment. Why: The question and its two answers replace the button together. How: This groups them without adding an element. */ }


														<span className={ cssModObj.conAskSpa }>{ `Remove ${ memRecObj.namTexStr }? This also makes a new invite link.` }</span>{ /* What: Confirm Ask Span Element. Why: The owner should know what removing does. How: This asks, naming the member. */ }

														<button
															className={ cssModObj.actDanBut }

															type='button'

															onClick={ () => void actRunFun( () => memRemFun( curGroObj.ideStr, memRecObj.uidValStr ), `Removed ${ memRecObj.namTexStr }. The invite link changed.` ).then( () => setConRemStr( '' ) ) } // What: Remove Confirm Handler. Why: The owner confirmed. How: This removes the member, announces it with the new link, and hides the question.
														>Yes, remove</button>{ /* What: Action Danger Button Element. Why: Removing is confirmed on purpose. How: This removes the member. */ }

														<button
															className={ cssModObj.actPlaBut }

															type='button'

															onClick={ () => setConRemStr( '' ) }
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


