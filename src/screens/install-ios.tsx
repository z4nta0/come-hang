


// #region Imports

import cssModObj from './install-ios.module.css'; // What: CSS Module Object. Why: The screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { BraMarCom } from '../ui/brand-mark.tsx';        // What: Brand Mark Component. Why: The screen leads with the app's mark, as the welcome does. How: This draws it above the heading.
import { ButBasCom } from '../ui/button.tsx';            // What: Button Base Component. Why: Copying an invite link is the invited screen's leading action. How: This draws it as the main button.
import { IcoSvgCom } from '../ui/icon.tsx';              // What: Icon SVG Component. Why: The first step points at Safari's Share button. How: This draws the share icon beside it.
import { MaiAreCom } from '../ui/main-area.tsx';         // What: Main Area Component. Why: The steps are the screen's main content. How: This holds them in the main landmark.
import { safSetFun } from '../platform/install.ts';      // What: Safari Set Function. Why: Carrying on in Safari should hold on later visits. How: This keeps the choice.
import { useRef    } from 'react';                       // What: Use Reference. Why: The invite link's field is selected when copying fails. How: This holds it.
import { useState  } from 'react';                       // What: Use State. Why: The copy's result changes what the screen says. How: This holds it.

// #endregion Imports



/**
 * install-ios.tsx = Install On iOS
 *
 * @summary
 * The screen an iPhone or iPad shows in Safari before anything else
 * (ARCHITECTURE.md Section 16), since there an installed app keeps its own
 * storage: Safari deletes a site's data after 7 days without a visit, nothing
 * done in Safari moves to the app installed later, and only the installed
 * app gets notifications. It says so, then lists Safari's steps for adding
 * the app to the Home Screen. Opened from an invite link, it says there's an
 * invite without naming the group, since reading it would need a sign-in
 * Safari would keep apart from the app, and offers to copy the link first,
 * with the step of pasting it once the app opens. A quieter button carries
 * on in Safari, saying what that risks.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type IicProTyp = { onConFun : () => void, tokValStr? : string }; // What: Install iOS Component Props Type. Why: The screen hands on the choice to carry on in Safari, and an invite's token changes it. How: This types InsIosCom's props.

// #region InsIosCom

/**
 * InsIosCom = Install iOS Component
 *
 * @summary
 * Renders the install screen in the main area: the mark, the heading, the
 * reasons, and the steps, then the way to carry on in Safari. Given an
 * invite's token, it first shows the invite's link with a button that copies
 * it, announcing the copy, or selects the link and says to copy it where
 * the clipboard can't be written. Carrying on in Safari keeps the choice on
 * the device and calls onConFun.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.onConFun  - On Continue Function: Called once someone chooses
 *                          to carry on in Safari.
 * @param props.tokValStr - Token Value String: The invite's token when an
 *                          invite link opened the screen, by default none.
 *
 * @returns The screen's main area.
 *
 * @example
 * ```tsx
 * InsIosCom({ onConFun, tokValStr }) // => <InsIosCom />
 * ```
 *
*/

function InsIosCom ( { onConFun, tokValStr } : IicProTyp ) : React.JSX.Element {


	const linInpRef = useRef< HTMLInputElement >( null ); // What: Link Input Reference. Why: The link is selected for copying by hand when the clipboard can't be written. How: This holds its field.

	const [ copStaStr, setCopStaStr ] = useState( '' ); // What: Copy Status String And Setter. Why: A copy, or a failed one, is announced. How: This holds the status's text, empty before a copy.


	const linValStr = tokValStr === undefined ? '' : `${ window.location.origin }/join/${ tokValStr }`; // What: Link Value String. Why: The invite is pasted into the installed app as its whole link. How: This rebuilds the link from the app's address and the token.



	// #region linCopFun

	/**
	 * linCopFun = Link Copy Function
	 *
	 * @summary
	 * Copies the invite link to the clipboard and announces it, or, where the
	 * clipboard can't be written, selects the link in its field and says to
	 * copy it from there.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the copy is handled, with no value.
	 *
	 * @example
	 * ```ts
	 * linCopFun() // => Promise<void>
	 * ```
	 *
	*/

	const linCopFun = async () : Promise< void > => { // What: Link Copy Function. Why: The link has to reach the installed app, which can't read Safari's storage. How: This puts it on the clipboard.


		try { // What: Copy Try. Why: The clipboard may refuse. How: This writes the link and announces it, with the fallback below.


			await navigator.clipboard.writeText( linValStr ); // What: Clipboard Write Call. Why: The link is pasted once the app opens. How: This copies it.

			setCopStaStr( 'Link copied. Paste it once the app opens.' ); // What: Copied Status Call. Why: The copy should be confirmed, with what to do next. How: This announces it.


		}

		catch { // What: Copy Catch. Why: Without the clipboard the link can still be copied by hand. How: This selects it and says so.


			linInpRef.current?.select(); // What: Select Call. Why: Selected text is one tap from Copy. How: This selects the link in its field.

			setCopStaStr( "The link couldn't be copied for you. It's selected above, ready to copy." ); // What: Fallback Status Call. Why: Someone should know to copy it themselves. How: This announces it.


		}


	};

	// #endregion linCopFun



	return (


		<MaiAreCom className={ cssModObj.insScrMai }>{ /* What: Install Screen Main Area Component. Why: The steps are the screen's whole content. How: This holds them in one column at the base text width. */ }


			<BraMarCom className={ cssModObj.insMarSvg } />{ /* What: Install Mark SVG Element. Why: The mark makes the app recognizable before it's installed. How: This draws it at the top. */ }

			<h1 className={ cssModObj.insTitHea }>Add Come Hang to your Home Screen</h1>{ /* What: Install Title Heading Element. Why: The screen's one heading says what to do. How: This names the step. */ }



			{ tokValStr !== undefined && ( // What: Invite Block. Why: Someone sent an invite needs its link once the app opens. How: This shows the link and its copy button when an invite link opened the screen.


				<section
					className={ cssModObj.insInvSec }

					aria-labelledby='insInvHea'
				>{ /* What: Install Invite Section Element. Why: The invite is the first thing to keep before installing. How: This holds its heading, note, link, button, and status. */ }


					<h2
						id='insInvHea'

						className={ cssModObj.insInvHea }
					>You've been invited to a group</h2>{ /* What: Install Invite Heading Element. Why: Someone arriving from a link should know it was received. How: This says so without naming the group. */ }

					<p className={ cssModObj.insNotPar }>Copy the link first. Once the app is on your Home Screen, open it, choose "Join with an invite link", and paste it there.</p>{ /* What: Install Note Paragraph Element. Why: The installed app can't see what Safari opened, so the link travels by the clipboard. How: This says how. */ }

					<label
						className={ cssModObj.insLinLab }
						htmlFor='insLinInp'
					>Invite link</label>{ /* What: Install Link Label Element. Why: The field needs a visible name. How: This labels the link. */ }

					<input
						ref={ linInpRef }
						id='insLinInp'

						className={ cssModObj.insLinInp }

						readOnly
						type='text'
						value={ linValStr }

						onFocus={ ( focEveObj ) => focEveObj.target.select() } // What: Focus Handler. Why: The link is there to be copied whole. How: This selects it on focus.
					/>{ /* What: Install Link Input Element. Why: The link can be copied by hand where the clipboard can't be written. How: This shows it, read only. */ }

					<ButBasCom
						className={ cssModObj.insCopBut }

						onClick={ () => void linCopFun() }
					>Copy invite link</ButBasCom>{ /* What: Install Copy Button Component. Why: Copying the link is the first step for someone invited. How: This copies it. */ }

					<p
						className={ cssModObj.insStaPar }

						role='status'
					>{ copStaStr }</p>{ /* What: Install Status Paragraph Element. Why: A copy, or a failed one, should be told, and a region added only when it speaks is often missed. How: This is in the page and empty from the first render. */ }


				</section>


			) }



			<section
				className={ cssModObj.insWhySec }

				aria-labelledby='insWhyHea'
			>{ /* What: Install Why Section Element. Why: Installing is extra work on iPhone, so the reasons come first. How: This holds the heading and the reasons. */ }


				<h2
					id='insWhyHea'

					className={ cssModObj.insWhyHea }
				>Why install first</h2>{ /* What: Install Why Heading Element. Why: The reasons need a name of their own. How: This names them. */ }

				<ul className={ cssModObj.insWhyUno }>{ /* What: Install Why Unordered List Element. Why: The reasons read as a list. How: This holds one item per reason. */ }


					<li>Anything you do here in Safari stays in Safari. If you install later, your groups and messages won't move to the app.</li>{ /* What: Carry Over Item Element. Why: Installing after starting means starting again. How: This says nothing moves across. */ }

					<li>Safari deletes a site's data after 7 days without a visit, which would lose your groups.</li>{ /* What: Deletion Item Element. Why: Data in Safari doesn't last between get-togethers. How: This says when Safari deletes it. */ }

					<li>Notifications only work in the installed app.</li>{ /* What: Notifications Item Element. Why: Messages and join requests reach someone only through the installed app. How: This says so. */ }


				</ul>


			</section>



			<section
				className={ cssModObj.insSteSec }

				aria-labelledby='insSteHea'
			>{ /* What: Install Steps Section Element. Why: Safari can't install the app for someone, only describe how. How: This holds the heading and the steps. */ }


				<h2
					id='insSteHea'

					className={ cssModObj.insSteHea }
				>How to install</h2>{ /* What: Install Steps Heading Element. Why: The steps need a name of their own. How: This names them. */ }

				<ol className={ cssModObj.insSteOrd }>{ /* What: Install Steps Ordered List Element. Why: The steps go in order. How: This numbers them. */ }


					<li>Tap the Share button <IcoSvgCom icoNamStr='share' sizSteStr='bas' /> in Safari's toolbar.</li>{ /* What: Share Step Item Element. Why: Adding to the Home Screen starts from Safari's Share menu. How: This names the button and shows its icon. */ }{ /* Vertical Rhythm Base ~= 14.572px */ }

					<li>Scroll down and tap "Add to Home Screen", then "Add".</li>{ /* What: Add Step Item Element. Why: The menu's item puts the app on the Home Screen. How: This names it and its confirmation. */ }

					<li>{ tokValStr === undefined ? 'Open Come Hang from your Home Screen.' : 'Open Come Hang from your Home Screen, choose "Join with an invite link", and paste the link.' }</li>{ /* What: Open Step Item Element. Why: The app opens from its icon, and someone invited joins from there. How: This adds the paste for an invite. */ }


				</ol>


			</section>



			<section
				className={ cssModObj.insSafSec }

				aria-labelledby='insSafHea'
			>{ /* What: Install Safari Section Element. Why: Someone not ready to install can still look around, knowing what it risks. How: This holds the heading, the warning, and the button. */ }


				<h2
					id='insSafHea'

					className={ cssModObj.insSafHea }
				>Not ready to install?</h2>{ /* What: Install Safari Heading Element. Why: The way past needs a name of its own. How: This asks the question it answers. */ }

				<p className={ cssModObj.insNotPar }>You can use Come Hang in Safari, but your groups stay in Safari, may be deleted after 7 days without a visit, and won't move to the app if you install it later.</p>{ /* What: Install Note Paragraph Element. Why: Carrying on in Safari has costs someone should know first. How: This says each one. */ }

				<button
					className={ cssModObj.insSafBut }

					type='button'

					onClick={ () => { safSetFun(); onConFun(); } } // What: Continue Handler. Why: The choice should hold on later visits, and the app opens now. How: This keeps it and hands it on.
				>Continue in Safari</button>{ /* What: Install Safari Button Element. Why: Carrying on in Safari is the quieter choice. How: This carries on. */ }


			</section>


		</MaiAreCom>


	);


}

// #endregion InsIosCom

// #endregion Components



// #region Exports

export { InsIosCom }; // What: Named Export. Why: The screen host shows it on an iPhone or iPad in Safari. How: This exports InsIosCom.

// #endregion Exports


