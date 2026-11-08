


// #region Imports

import cssModObj from './personal-settings.module.css'; // What: CSS Module Object. Why: The parts are styled in their own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom            } from '../ui/button.tsx';          // What: Button Base Component. Why: Buying the upgrade is the account part's leading action. How: This draws it as the main action button.
import { canProFun            } from '../platform/install.ts';    // What: Can Prompt Function. Why: The Install button shows only while the browser can install. How: This checks for its prompt.
import { colModGetFun         } from '../platform/color-mode.ts'; // What: Color Mode Get Function. Why: The appearance choice starts from the one kept on this phone. How: This reads it.
import { colModSetFun         } from '../platform/color-mode.ts'; // What: Color Mode Set Function. Why: Picking light, dark, or the phone's setting applies at once and is kept. How: This applies and keeps it.
import { DelDatCom            } from './delete-data.tsx';         // What: Delete Data Component. Why: The account part offers to delete the member's data. How: This draws its button and confirmation.
import { gooLinFun            } from '../state/identity.ts';      // What: Google Link Function. Why: Linking Google lets the member get their groups back on a new phone (Section 8). How: This links through Google's popup.
import { gooStaFun            } from '../state/identity.ts';      // What: Google State Function. Why: The account part says whether Google is linked. How: This reads it.
import { insProFun            } from '../platform/install.ts';    // What: Install Prompt Function. Why: The Install button asks the browser to install. How: This shows its prompt.
import { insSubFun            } from '../platform/install.ts';    // What: Install Subscribe Function. Why: The Install button follows the prompt as it comes and goes. How: This subscribes to it.
import { isaInsFun            } from '../platform/install.ts';    // What: Is-An Installed Function. Why: An installed app needs no install part. How: This checks whether it runs installed.
import { isaIosFun            } from '../platform/install.ts';    // What: Is-An iOS Function. Why: An iPhone installs through Safari's own menu. How: This checks for an iPhone or iPad.
import { LegDocCom            } from '../legal/docs.tsx';         // What: Legal Documents Component. Why: Settings holds the privacy policy and the terms. How: This draws their part and its sheet.
import { ProSetCom            } from './profile-settings.tsx';    // What: Profile Settings Component. Why: Settings holds the member's profile photo. How: This draws its part.
import { purBuyFun            } from '../state/purchase.ts';      // What: Purchase Buy Function. Why: The upgrade is bought once (Section 18). How: This asks for the checkout's address.
import { purPaiFun            } from '../state/purchase.ts';      // What: Purchase Paid Function. Why: The account part says whether the upgrade is bought. How: This reads it.
import { pusActFun            } from '../state/push.ts';          // What: Push Active Function. Why: The notifications button says whether they're on. How: This reads the state.
import { pusDisFun            } from '../state/push.ts';          // What: Push Disable Function. Why: The member can turn notifications off. How: This turns them off.
import { pusEnaFun            } from '../state/push.ts';          // What: Push Enable Function. Why: The member can turn notifications on, which asks the browser. How: This asks and stores the token.
import { SupForCom            } from './support-form.tsx';        // What: Support Form Component. Why: About offers a way to write to the maker. How: This draws the form.
import { useEffect            } from 'react';                     // What: Use Effect. Why: The account is read as the parts open, and a link moves focus. How: This starts the read and moves the focus.
import { useRef               } from 'react';                     // What: Use Reference. Why: A link replaces its button, so focus lands on the part's heading. How: This holds the heading.
import { useState             } from 'react';                     // What: Use State. Why: The appearance, notifications, link, and upgrade change while the parts are open. How: This holds each.
import { useSyncExternalStore } from 'react';                     // What: Use Sync External Store. Why: The browser's prompt arrives outside React. How: This rerenders the part when it does.


import type { ColModTyp } from '../platform/color-mode.ts'; // What: Color Mode Type. Why: Each appearance choice names a mode. How: This types it.
import type { SarRetTyp } from './settings-actions.ts';     // What: Settings Actions Return Type. Why: The parts run their changes through the section's runners. How: This types them.

// #endregion Imports



/**
 * personal-settings.tsx = Personal Settings
 *
 * @summary
 * The parts of Settings that belong to this device and the member's account
 * rather than a group, so they show whether or not the member is in one: this
 * device's appearance, notifications, and how to install the app until it's
 * installed; the account's Google link, upgrade, and the deletion of the
 * member's data; About, with a note from the app's maker, its version, links
 * to the maker's website, the source code, and support, and a tip on Ko-fi;
 * and the privacy policy and the terms, each opening in a sheet. Each change
 * is announced, and a change that fails says why, through the status and alert
 * of the Settings section holding them.
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

const BUY_ERR_OBJ : Record< string, string > = { // What: Buy Error Object. Why: A purchase the function refuses says why (Section 18). How: Each key is the function's error code, and its value the message.


	'functions/already-exists'      : 'You already have the upgrade.',                    // What: Already Paid Message. Why: An account buys once. How: This says it's done.
	'functions/failed-precondition' : 'Link a Google account before buying the upgrade.', // What: Not Linked Message. Why: A purchase needs a recoverable sign-in. How: This says to link first.
	'functions/unavailable'         : "Purchases aren't open yet. Try again later."       // What: Unavailable Message. Why: Purchases may not be set up yet. How: This says to wait.


};

const COL_MOD_ARR : { labStr : string, modStr : ColModTyp }[] = [ // What: Color Mode Array. Why: The appearance follows the phone or is set light or dark (Section 14). How: Each row names a choice and its mode.


	{ labStr : 'Match this device', modStr : 'system' }, // What: System Choice. Why: Most people want the device's own setting. How: This names it first.
	{ labStr : 'Light',             modStr : 'light'  }, // What: Light Choice. Why: Someone can keep the app light. How: This names it.
	{ labStr : 'Dark',              modStr : 'dark'   }  // What: Dark Choice. Why: Someone can keep the app dark. How: This names it.


];

const GOO_ERR_OBJ : Record< string, string > = { // What: Google Error Object. Why: A link that doesn't go through says why. How: Each key is Firebase Auth's error code, and its value the message.


	'auth/cancelled-popup-request'   : "The Google sign-in was closed. Try again when you're ready.",                               // What: Cancelled Message. Why: A second popup cancels the first. How: This says to try again.
	'auth/credential-already-in-use' : 'That Google account is already linked to another Come Hang account. Try a different one.',  // What: In Use Message. Why: One Google account recovers one identity. How: This says to pick another.
	'auth/email-already-in-use'      : 'That Google account is already linked to another Come Hang account. Try a different one.',  // What: Email In Use Message. Why: Google's email can belong to one account only. How: This says to pick another.
	'auth/popup-blocked'             : "Your browser blocked Google's sign-in window. Allow pop-ups for this app, then try again.", // What: Blocked Message. Why: The link needs its popup. How: This says to allow it.
	'auth/popup-closed-by-user'      : "The Google sign-in was closed. Try again when you're ready."                                // What: Closed Message. Why: The member closed the popup. How: This says to try again.


};

// #endregion Constants



// #region Components

type PscProTyp = { setActObj : SarRetTyp }; // What: Personal Settings Component Props Type. Why: The parts run their changes through the section that holds them. How: This types PerSetCom's props.

// #region PerSetCom

/**
 * PerSetCom = Personal Settings Component
 *
 * @summary
 * Renders the profile part, the device's part, the account's part, About, and
 * the legal documents' part as siblings in whatever Settings column holds
 * them, running their changes through the section's own runners, so the
 * section's one status and alert announce them. Picking an appearance applies
 * and keeps it at once; the notifications button turns them on or off for this
 * device; Install shows the browser's prompt where it can; Link Google account
 * links through Google's popup, focus then landing on the account part's
 * heading; and Buy the upgrade opens Polar's checkout once Google is linked.
 * About's links and its tip open in a new tab, except the support address,
 * which opens an email. The account is read as the parts open, and the part
 * says it's checking until it's read.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.setActObj - Settings Actions Object: The section's runners
 *                          and messages, from {@link useSetActFun}.
 *
 * @returns The parts.
 *
 * @example
 * ```tsx
 * PerSetCom({ setActObj }) // => <PerSetCom />
 * ```
 *
*/

function PerSetCom ( { setActObj } : PscProTyp ) : React.JSX.Element {


	const accHeaRef = useRef< HTMLHeadingElement >( null ); // What: Account Heading Reference. Why: A link replaces its button, so focus lands on the part's heading. How: This holds it.

	const canProBoo = useSyncExternalStore( insSubFun, canProFun ); // What: Can Prompt Boolean. Why: The Install button shows only while the browser can install. How: This reads whether its prompt is kept, rerendering when it changes.

	const { actKinStr, actRunFun, chaRunFun, focChaRef, setErrMesStr, setStaMesStr } = setActObj; // What: Action Kind String. Why: A button says when its change is out. How: This reads it. // What: Action Run Function. Why: The parts' changes run through it. How: This reads it. // What: Change Run Function. Why: A link gives way to what replaces it. How: This reads it. // What: Focus Change Reference. Why: Focus owed after a change is moved here. How: This reads it. // What: Error Message Setter. Why: A failure is announced. How: This reads it. // What: Status Message Setter. Why: A change that lands is announced. How: This reads it.

	const [ colModStr, setColModStr ] = useState( colModGetFun );           // What: Color Mode String And Setter. Why: The appearance choice shows the mode kept on this phone. How: This holds it, read once as the parts open.
	const [ gooLinBoo, setGooLinBoo ] = useState< boolean | null >( null ); // What: Google Linked Boolean And Setter. Why: The account part offers a link until Google is linked. How: This holds whether it is, null until read.
	const [ pusActBoo, setPusActBoo ] = useState( pusActFun );              // What: Push Active Boolean And Setter. Why: The notifications button says whether they're on for this phone. How: This holds it, read once as the parts open.
	const [ upgPaiBoo, setUpgPaiBoo ] = useState< boolean | null >( null ); // What: Upgrade Paid Boolean And Setter. Why: The account part offers the upgrade until it's bought. How: This holds whether it is, null until read.



	useEffect( () => { // What: Account Load Effect. Why: The account part shows whether Google is linked and the upgrade bought. How: This reads both once the parts open.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the parts closed mustn't change them. How: This is true until the cleanup runs.


		void gooStaFun().then( ( linValBoo ) => { if ( actValBoo ) setGooLinBoo( linValBoo ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Link Read Call. Why: The link is offered until it's made. How: This reads it, logging a failure.

		void purPaiFun().then( ( paiValBoo ) => { if ( actValBoo ) setUpgPaiBoo( paiValBoo ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Paid Read Call. Why: The upgrade is offered until it's bought. How: This reads it, logging a failure.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: Reads still out shouldn't land after the parts close. How: This marks them closed.


	}, [] ); // What: Effect Dependency Array. Why: The account is read once. How: The empty list reads it as the parts open.



	useEffect( () => { // What: Link Focus Effect. Why: Linking Google takes away its button once the part shows the link. How: Once the element owed focus is drawn, this focuses it and clears the debt.


		const tarEleObj = focChaRef.current?.current; // What: Target Element Object. Why: The element owed focus may not be drawn yet. How: This reads it, undefined or null until it is.


		if ( !tarEleObj ) return; // What: Drawn Guard. Why: Focus waits for the element to appear. How: This returns until it has.



		focChaRef.current = null; // What: Focus Clear Assignment. Why: The move is owed once. How: This clears the debt.

		tarEleObj.focus(); // What: Focus Call. Why: The next Tab carries on from the part that changed. How: This focuses it.


	}, [ focChaRef, gooLinBoo ] ); // What: Effect Dependency Array. Why: The heading is owed focus once the link shows. How: gooLinBoo changes when it does, and focChaRef stays the same reference.



	// #region pusTogFun

	/**
	 * pusTogFun = Push Toggle Function
	 *
	 * @summary
	 * Turns notifications for this phone off when they're on, or on when
	 * they're off, as one change. Turning them on asks the browser, and its
	 * answer decides the message: on, still off when the prompt was
	 * dismissed, blocked by the browser, or not possible here, which on an
	 * iPhone means the app isn't on the home screen yet. A change that lands
	 * updates the button, whose label says what it will do next.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the change is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * pusTogFun() // => Promise<void>
	 * ```
	 *
	*/

	const pusTogFun = async () : Promise< void > => { // What: Push Toggle Function. Why: The member decides whether this phone is notified (Section 11.1). How: This turns notifications off or on and says how it went.


		if ( pusActBoo ) { // What: Turn Off Block. Why: Notifications on are turned off. How: This turns them off and says so once it lands.


			if ( await actRunFun( 'push', pusDisFun ) ) { setPusActBoo( false ); setStaMesStr( 'Notifications are off for this device.' ); } // What: Off Call. Why: The button and the member learn the change. How: This turns them off, then updates the state and announces it.



			return;


		}



		let ansValStr = ''; // What: Answer Value String. Why: The browser's answer decides the message. How: This holds it once the change runs.


		const lanValBoo = await actRunFun( 'push', async () => { ansValStr = await pusEnaFun(); } ); // What: Landed Value Boolean. Why: A failure is announced by the change itself. How: This turns them on, keeping the answer.


		if ( !lanValBoo ) return; // What: Failed Guard. Why: The alert already says so. How: This returns.



		setPusActBoo( ansValStr === 'granted' ); // What: State Set Call. Why: Notifications are on only once the browser allows them. How: This keeps whether it did.

		if ( ansValStr === 'granted' ) setStaMesStr( 'Notifications are on for this device.' ); // What: On Status Call. Why: The member hears it worked. How: This announces it.

		else if ( ansValStr === 'default' ) setStaMesStr( 'Notifications are still off.' ); // What: Dismissed Status Call. Why: A dismissed prompt changes nothing. How: This says they're still off.

		else setErrMesStr( ansValStr === 'denied' ? 'Your browser is blocking notifications for this app. Allow them in its site settings, then try again.' : "This browser can't show notifications here. On an iPhone, add the app to your home screen first." ); // What: Refused Alert Call. Why: A block or a browser that can't show them needs the member to act elsewhere. How: This says what to do, by the answer.


	};

	// #endregion pusTogFun



	return (


		<>{ /* What: Personal Settings Fragment. Why: The parts sit in the Settings column beside whatever else it holds. How: This groups them without a wrapper. */ }


			<ProSetCom setActObj={ setActObj } />{ /* What: Profile Settings Component. Why: The member's photo shows in every group they're in, so it sits with their own settings (Section 21). How: This draws the "Your profile" part first. */ }



			<section
				className={ cssModObj.devSetSec }

				aria-labelledby='devSetHea'
			>{ /* What: Device Settings Section Element. Why: The appearance and notifications belong to this phone rather than the group. How: This holds its heading, the choice, the note, and the button. */ }


				<h3
					id='devSetHea'

					className={ cssModObj.devTitHea }
				>This device</h3>{ /* What: Device Title Heading Element. Why: The part needs a heading saying these settings are the phone's own. How: This names it. */ }



				<fieldset className={ cssModObj.devAppFie }>{ /* What: Device Appearance Fieldset Element. Why: The three choices answer one question. How: This groups them under its legend. */ }


					<legend className={ cssModObj.devAppLeg }>Appearance</legend>{ /* What: Device Appearance Legend Element. Why: The choices need a shared name. How: This names them. */ }



					{ COL_MOD_ARR.map( ( colModObj ) => ( // What: Color Mode Map. Why: Each mode is a choice. How: This renders a row per mode.


						<label
							key={ colModObj.modStr }

							className={ cssModObj.devChoLab }
						>{ /* What: Device Choice Label Element. Why: The whole row picks its mode, a bigger target than the circle alone. How: This holds the circle and its name. */ }


							<input
								className={ cssModObj.devChoInp }

								name='colModRad'

								checked={ colModStr === colModObj.modStr }
								type='radio'
								value={ colModObj.modStr }

								onChange={ () => { colModSetFun( colModObj.modStr ); setColModStr( colModObj.modStr ); } } // What: Mode Change Handler. Why: A choice applies at once and stays on this phone. How: This applies and keeps it, then marks it chosen.
							/>{ /* What: Device Choice Input Element. Why: A circle shows the chosen mode. How: This draws it, checked for the kept choice. */ }

							{ colModObj.labStr }{ /* What: Choice Name Text. Why: The circle needs its mode's name beside it, which also names it for a screen reader. How: This prints the row's label. */ }


						</label>


					) ) }


				</fieldset>



				<p className={ cssModObj.devNotPar }>{ pusActBoo ? "This device gets a notification when there's news in your groups, such as a new message." : "Get a notification on this device when there's news in your groups, such as a new message." }</p>{ /* What: Device Note Paragraph Element. Why: The member should know what notifications bring before turning them on or off. How: This says it, by whether they're on. */ }



				<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The notifications button sits below the note. How: This holds it in a row that wraps. */ }


					<button
						className={ cssModObj.actPlaBut }

						type='button'

						onClick={ () => void pusTogFun() }
					>{ actKinStr === 'push' ? 'Working…' : pusActBoo ? 'Turn off notifications' : 'Turn on notifications' }</button>{ /* What: Action Plain Button Element. Why: One button turns notifications on or off, and keeps focus as its label changes. How: This toggles them, reading "Working…" while the change is out. */ }


				</div>



				{ !isaInsFun() && ( // What: Install Block. Why: An app not yet installed says how to install it on this phone. How: This shows the note, and the button where the browser can install.


					<>{ /* What: Install Fragment. Why: The note and its button belong to the part together. How: This groups them without adding an element. */ }


						<p className={ cssModObj.devNotPar }>{ canProBoo ? 'Install Come Hang to open it from your home screen in its own window, like any other app.' : isaIosFun() ? 'To install, tap Safari\'s Share button, then "Add to Home Screen". Groups you have in Safari won\'t move to the installed app.' : "To install, use your browser's install option if it has one, or open Come Hang in Chrome or Edge." }</p>{ /* What: Device Note Paragraph Element. Why: How to install depends on the browser, and on iPhone what Safari holds stays there. How: This says what this browser can do. */ }



						{ canProBoo && ( // What: Install Button Block. Why: Only a browser that offers its prompt can install with a tap. How: This shows the button while it does.


							<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The install button sits below its note. How: This holds it in a row that wraps. */ }


								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => { document.getElementById( 'main' )?.focus(); void insProFun(); } } // What: Install Handler. Why: The button goes with the prompt, so focus shouldn't fall to the page. How: This focuses the main area, then shows the browser's prompt.
								>Install the app</button>{ /* What: Action Plain Button Element. Why: Installing should take one tap where the browser allows it. How: This shows the browser's prompt. */ }


							</div>


						) }


					</>


				) }


			</section>



			<section
				className={ cssModObj.accSetSec }

				aria-labelledby='accSetHea'
			>{ /* What: Account Settings Section Element. Why: Google recovery, the upgrade, and deleting the member's data belong to their account rather than the group or the phone. How: This holds its heading, notes, and buttons. */ }


				<h3
					ref={ accHeaRef }
					id='accSetHea'

					className={ cssModObj.accTitHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once a link replaces its button, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>Your account</h3>{ /* What: Account Title Heading Element. Why: The part needs a heading. How: This names it. */ }



				{ gooLinBoo === null ? ( // What: Account Loaded Check. Why: Until the account is read, there's nothing to say about it. How: This says it's being checked, or else shows the link and the upgrade.


					<p className={ cssModObj.accNotPar }>Checking your account…</p> // What: Account Note Paragraph Element. Why: An empty part would read as broken. How: This says the account is being checked.


				) : ( // What: Account Branch. Why: The account is read. How: This shows the link and the upgrade.


					<>{ /* What: Account Fragment. Why: The notes and buttons sit in the part as its own children. How: This groups them without adding an element. */ }


						<p className={ cssModObj.accNotPar }>{ gooLinBoo ? 'Your account is linked to Google. On a new device, choose "Get my groups back" when you open Come Hang to bring your groups with you.' : "Link a Google account so you can get your groups back on a new device. Google only confirms it's you, and your messages stay encrypted." }</p>{ /* What: Account Note Paragraph Element. Why: The member should know what linking is for, and once it's done, how to use it. How: This says either, by whether Google is linked. */ }



						{ !gooLinBoo && ( // What: Link Check. Why: The link is offered until it's made. How: This shows its button.


							<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The link's button sits below its note. How: This holds it in a row that wraps. */ }


								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => void chaRunFun( 'link', accHeaRef, async () => { await gooLinFun(); setGooLinBoo( true ); }, 'Linked your Google account.', GOO_ERR_OBJ ) } // What: Link Handler. Why: Linking opens Google's sign-in, and the button goes once it's done. How: This links, marks Google linked, owes the heading focus, and announces it, a known failure saying why.
								>{ actKinStr === 'link' ? 'Linking…' : 'Link Google account' }</button>{ /* What: Action Plain Button Element. Why: The link is made on purpose, and the label shows while it's out. How: This links Google, reading "Linking…" while the link is out. */ }


							</div>


						) }



						{ upgPaiBoo !== null && ( // What: Upgrade Check. Why: The upgrade can be described once the account's flag is read. How: This shows its note, and its button when it can be bought.


							<p className={ cssModObj.accNotPar }>{ upgPaiBoo ? 'You have the upgrade: you can own up to 10 groups, belong to up to 20, and have up to 50 members in each group you own.' : `The upgrade is a one-time $9.99 purchase. With it you can own up to 10 groups instead of 1, belong to up to 20 instead of 10, and have up to 50 members in each group you own instead of 20.${ gooLinBoo ? '' : ' Buying it needs a linked Google account, so it follows you to a new device.' }` }</p> // What: Account Note Paragraph Element. Why: The member should know what the upgrade gives and what it needs (Section 18). How: This says whether it's bought, or what it costs and gives, and that it needs Google linked when it isn't.


						) }



						{ gooLinBoo && upgPaiBoo === false && ( // What: Buy Check. Why: The upgrade is bought only with Google linked, and only once. How: This shows its button then.


							<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The upgrade's button sits below its note. How: This holds it in a row that wraps. */ }


								<ButBasCom onClick={ () => void actRunFun( 'buy', async () => { window.location.assign( await purBuyFun() ); }, BUY_ERR_OBJ ) }>{ actKinStr === 'buy' ? 'Opening the checkout…' : 'Buy the upgrade' }</ButBasCom>{ /* What: Buy Button Component. Why: Buying opens Polar's checkout, and the label shows while it's being made. How: This asks for the checkout and goes to it, a known refusal saying why, reading "Opening the checkout…" meanwhile. */ }


							</div>


						) }



						<DelDatCom />{ /* What: Delete Data Component. Why: Someone can delete everything Come Hang keeps for them, which belongs to their account. How: This draws the button and its confirmation at the end of the part. */ }


					</>


				) }


			</section>



			<section
				className={ cssModObj.aboSetSec }

				aria-labelledby='aboSetHea'
			>{ /* What: About Settings Section Element. Why: Someone can learn who makes Come Hang, find its source code, support it, and reach its maker. How: This holds its heading, note, details, and tip. */ }


				<h3
					id='aboSetHea'

					className={ cssModObj.aboTitHea }
				>About</h3>{ /* What: About Title Heading Element. Why: The part needs a heading. How: This names it. */ }

				<p className={ cssModObj.aboNotPar }>You can find out more information about myself by visiting the link below to my personal website, including links to some of my other projects. You will also find the link to this app's source code on GitHub. Its source is available under the PolyForm Noncommercial License 1.0.0, which allows anyone to freely fork and modify the project's source code for any noncommercial purpose (so no selling the software or making money off it in any way), as long as the license and its notice come along with it. Please be responsible with the source code, because I am just one person maintaining the project in their free time trying to make a living. This is not some big company with vast resources trying to extract every dollar that they can.</p>{ /* What: About Note Paragraph Element. Why: The maker introduces themself and the app's license in their own words. How: This points to the links below it. */ }



				<dl className={ cssModObj.aboInfDes }>{ /* What: About Information Description List Element. Why: The app's version and where to find its maker, its source code, and its support read as names and values. How: This pairs them. */ }


					<dt className={ cssModObj.aboKeyTer }>Version</dt>{ /* What: About Key Term Element. Why: The value needs its name. How: This names the version. */ }

					<dd className={ cssModObj.aboValDet }>{ __APP_VERSION__ }</dd>{ /* What: About Value Details Element. Why: Someone reporting a problem can say which release they have. How: This shows the version the build was made from. */ }

					<dt className={ cssModObj.aboKeyTer }>Creator</dt>{ /* What: About Key Term Element. Why: The value needs its name. How: This names the maker's website. */ }


					<dd className={ cssModObj.aboValDet }>{ /* What: About Value Details Element. Why: The note points to the maker's website. How: This links it, opening in a new tab. */ }


						<a
							className={ cssModObj.aboLinAnc }

							href='https://techgeek.dev/'
							rel='noopener noreferrer'
							target='_blank'
						>techgeek.dev</a>{ /* What: About Link Anchor Element. Why: The value is a place to go. How: This links it, opening in a new tab. */ }


					</dd>


					<dt className={ cssModObj.aboKeyTer }>Source code</dt>{ /* What: About Key Term Element. Why: The value needs its name. How: This names the source code. */ }


					<dd className={ cssModObj.aboValDet }>{ /* What: About Value Details Element. Why: The note points to the app's source code. How: This links its repository, opening in a new tab. */ }


						<a
							className={ cssModObj.aboLinAnc }

							href='https://github.com/z4nta0/come-hang'
							rel='noopener noreferrer'
							target='_blank'
						>github.com/z4nta0/come-hang</a>{ /* What: About Link Anchor Element. Why: The value is a place to go. How: This links it, opening in a new tab. */ }


					</dd>


				</dl>



				<p className={ cssModObj.aboNotPar }>Enjoying Come Hang? You can support it with a tip on Ko-fi. It's never required, and always appreciated.</p>{ /* What: About Note Paragraph Element. Why: The app is free, and a tip helps keep it going. How: This invites one, saying it's never required. */ }

				<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The tip's link sits below its note, like the other parts' buttons. How: This holds it in a row that wraps. */ }


					<a
						className={ cssModObj.aboTipAnc }

						href='https://ko-fi.com/techgeekdev'
						rel='noopener noreferrer'
						target='_blank'
					>Buy me a coffee</a>{ /* What: About Tip Anchor Element. Why: A tip is given on Ko-fi, outside the app. How: This opens the maker's Ko-fi page in a new tab, drawn as an outlined pill. */ }


				</div>



				<SupForCom />{ /* What: Support Form Component. Why: Someone can write to the maker without leaving the app. How: This draws the note, the button, and the form it opens, below the tip. */ }


			</section>



			<LegDocCom />{ /* What: Legal Documents Component. Why: The privacy policy and the terms should be readable from inside the app, offline too. How: This draws their part after the account's. */ }


		</>


	);


}

// #endregion PerSetCom

// #endregion Components



// #region Exports

export { PerSetCom }; // What: Named Export. Why: The group's Settings and a phone in no group show these parts. How: This exports PerSetCom.

// #endregion Exports


