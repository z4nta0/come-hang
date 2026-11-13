


// #region Imports

import cssModObj from './in-app.module.css'; // What: CSS Module Object. Why: The screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { BraMarCom } from '../ui/brand-mark.tsx';   // What: Brand Mark Component. Why: The screen leads with the app's mark, as the install screen does. How: This draws it above the heading.
import { ButBasCom } from '../ui/button.tsx';       // What: Button Base Component. Why: Leaving the built-in browser is the screen's leading action. How: This draws it as the main button.
import { exiUrlFun } from '../platform/install.ts'; // What: Exit URL Function. Why: The main button leaves the built-in browser. How: This builds the address that does.
import { inaSetFun } from '../platform/install.ts'; // What: In-App Set Function. Why: Carrying on in the built-in browser should hold on later visits. How: This keeps the choice.
import { isaIosFun } from '../platform/install.ts'; // What: Is-An iOS Function. Why: The way out names Safari on an iPhone or iPad. How: This checks for one.
import { MaiAreCom } from '../ui/main-area.tsx';    // What: Main Area Component. Why: The way out is the screen's main content. How: This holds it in the main landmark.
import { useRef    } from 'react';                  // What: Use Reference. Why: The link's field is selected when copying fails. How: This holds it.
import { useState  } from 'react';                  // What: Use State. Why: The copy's result changes what the screen says. How: This holds it.

// #endregion Imports



/**
 * in-app.tsx = In-App Browser
 *
 * @summary
 * The screen shown before anything else in another app's built-in browser,
 * such as Facebook's or Messenger's (ARCHITECTURE.md Section 16). Such a
 * browser keeps its own storage, apart from the device's browser and the
 * installed app, can't install the app, and gets no notifications, so groups
 * joined there would be stranded. It says so and leads with a button that
 * opens the same address outside: on Android, in the installed app or the
 * device's browser, and on an iPhone or iPad, in Safari. Since a built-in
 * browser may refuse that, it also lists the menu steps and offers the link
 * to copy. A quieter button carries on in the built-in browser, saying what
 * that risks.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type IabProTyp = { onConFun : () => void, tokValStr? : string }; // What: In-App Browser Props Type. Why: The screen hands on the choice to carry on, and an invite's token changes where the way out leads. How: This types InaAppCom's props.

// #region InaAppCom

/**
 * InaAppCom = In-App Component
 *
 * @summary
 * Renders the screen in the main area: the mark, the heading, the button
 * that leaves the built-in browser, the reasons, the menu steps with the
 * link to copy, and the way to carry on. The way out leads to an invite's
 * link when a token is given, and to the app's root otherwise. Copying
 * announces itself, or selects the link and says to copy it where the
 * clipboard can't be written. Carrying on keeps the choice on the device and
 * calls onConFun.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.onConFun  - On Continue Function: Called once someone chooses
 *                          to carry on in the built-in browser.
 * @param props.tokValStr - Token Value String: The invite's token when an
 *                          invite link opened the screen, by default none.
 *
 * @returns The screen's main area.
 *
 * @example
 * ```tsx
 * InaAppCom({ onConFun, tokValStr }) // => <InaAppCom />
 * ```
 *
*/

function InaAppCom ( { onConFun, tokValStr } : IabProTyp ) : React.JSX.Element {


	const linInpRef = useRef< HTMLInputElement >( null ); // What: Link Input Reference. Why: The link is selected for copying by hand when the clipboard can't be written. How: This holds its field.

	const [ copStaStr, setCopStaStr ] = useState( '' ); // What: Copy Status String And Setter. Why: A copy, or a failed one, is announced. How: This holds the status's text, empty before a copy.


	const isaIosBoo = isaIosFun();                                              // What: Is-An iOS Boolean. Why: An iPhone or iPad leaves for Safari, by name. How: This checks for one.
	const patValStr = tokValStr === undefined ? '/' : `/join/${ tokValStr }`; // What: Path Value String. Why: An invite should still be open once the browser is left. How: This is the invite's path, or the root without one.
	const linValStr = `${ window.location.origin }${ patValStr }`;             // What: Link Value String. Why: The link can be pasted into the browser by hand. How: This joins the app's address and the path.



	// #region linCopFun

	/**
	 * linCopFun = Link Copy Function
	 *
	 * @summary
	 * Copies the link to the clipboard and announces it, or, where the
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

	const linCopFun = async () : Promise< void > => { // What: Link Copy Function. Why: Where the built-in browser won't let go, the link can still be carried to the browser. How: This puts it on the clipboard.


		try { // What: Copy Try. Why: The clipboard may refuse. How: This writes the link and announces it, with the fallback below.


			await navigator.clipboard.writeText( linValStr ); // What: Clipboard Write Call. Why: The link is pasted into the browser. How: This copies it.

			setCopStaStr( isaIosBoo ? 'Link copied. Paste it into Safari.' : 'Link copied. Paste it into your browser.' ); // What: Copied Status Call. Why: The copy should be confirmed, with what to do next. How: This announces it, naming Safari on an iPhone or iPad.


		}

		catch { // What: Copy Catch. Why: Without the clipboard the link can still be copied by hand. How: This selects it and says so.


			linInpRef.current?.select(); // What: Select Call. Why: Selected text is one tap from Copy. How: This selects the link in its field.

			setCopStaStr( "The link couldn't be copied for you. It's selected above, ready to copy." ); // What: Fallback Status Call. Why: Someone should know to copy it themselves. How: This announces it.


		}


	};

	// #endregion linCopFun



	return (


		<MaiAreCom className={ cssModObj.inaScrMai }>{ /* What: In-App Screen Main Area Component. Why: The way out is the screen's whole content. How: This holds it in one column at the base text width. */ }


			<BraMarCom className={ cssModObj.inaMarSvg } />{ /* What: In-App Mark SVG Element. Why: The mark makes the app recognizable inside another app. How: This draws it at the top. */ }

			<h1 className={ cssModObj.inaTitHea }>{ isaIosBoo ? 'Open Come Hang in Safari' : 'Open Come Hang in your browser' }</h1>{ /* What: In-App Title Heading Element. Why: The screen's one heading says what to do. How: This names Safari on an iPhone or iPad, and the browser elsewhere. */ }



			<div className={ cssModObj.inaOpeDiv }>{ /* What: In-App Open Div Element. Why: Leaving comes first, with what it does. How: This holds the lead, the button, and what the button leads to. */ }


				<p className={ cssModObj.inaLeaPar }>{ tokValStr === undefined ? "You're in another app's built-in browser." : "You've been invited to a group, but you're in another app's built-in browser." }</p>{ /* What: In-App Lead Paragraph Element. Why: Someone should know why the app stopped them, and an invite that it was received. How: This says so, naming the invite when there is one. */ }

				<ButBasCom
					className={ cssModObj.inaOpeBut }

					hreStr={ exiUrlFun( patValStr ) } // What: Exit Address. Why: The address has to leave the built-in browser for the device's own, and a built-in browser hands a tapped link on more readily than a script's. How: This links to the exit address, which keeps an invite's path.
				>{ isaIosBoo ? 'Open in Safari' : 'Open Come Hang' }</ButBasCom>{ /* What: In-App Open Button Component. Why: Leaving is the screen's leading action. How: This links to the address outside, naming Safari on an iPhone or iPad. */ }

				<p className={ cssModObj.inaNotPar }>{ isaIosBoo ? 'Once Safari opens, add Come Hang to your Home Screen from there.' : "This opens the app if it's installed, or your browser if it's not." }</p>{ /* What: In-App Note Paragraph Element. Why: Someone should know where the button leads. How: This says so for an iPhone or iPad and for Android. */ }


			</div>



			<section
				className={ cssModObj.inaWhySec }

				aria-labelledby='inaWhyHea'
			>{ /* What: In-App Why Section Element. Why: Leaving is extra work, so the reasons follow the button. How: This holds the heading and the reasons. */ }


				<h2
					id='inaWhyHea'

					className={ cssModObj.inaWhyHea }
				>Why leave this browser</h2>{ /* What: In-App Why Heading Element. Why: The reasons need a name of their own. How: This names them. */ }

				<ul className={ cssModObj.inaWhyUno }>{ /* What: In-App Why Unordered List Element. Why: The reasons read as a list. How: This holds one item per reason. */ }


					<li>Anything you do here stays inside this app. Your groups and messages won't be in your browser or the Come Hang app.</li>{ /* What: Carry Over Item Element. Why: Joining here would strand the group in another app. How: This says nothing moves across. */ }

					<li>This app can clear what it keeps at any time, which would lose your groups.</li>{ /* What: Deletion Item Element. Why: A built-in browser's data doesn't last. How: This says it can be cleared. */ }

					<li>Come Hang can't be installed or send notifications from here.</li>{ /* What: Notifications Item Element. Why: Messages and join requests reach someone only through the browser or the installed app. How: This says so. */ }


				</ul>


			</section>



			<section
				className={ cssModObj.inaSteSec }

				aria-labelledby='inaSteHea'
			>{ /* What: In-App Steps Section Element. Why: A built-in browser may ignore the button, and its own menu can still open the browser. How: This holds the heading, the steps, the link, its button, and the status. */ }


				<h2
					id='inaSteHea'

					className={ cssModObj.inaSteHea }
				>If nothing happens</h2>{ /* What: In-App Steps Heading Element. Why: The steps need a name of their own. How: This says when they're needed. */ }

				<ol className={ cssModObj.inaSteOrd }>{ /* What: In-App Steps Ordered List Element. Why: The steps go in order. How: This numbers them. */ }


					<li>Tap the menu button, ••• or ⋮, at the top or bottom of the screen.</li>{ /* What: Menu Step Item Element. Why: A built-in browser keeps its way out in its own menu. How: This names the menu's two common looks. */ }

					<li>{ isaIosBoo ? 'Choose "Open in external browser" or "Open in Safari".' : 'Choose "Open in external browser" or "Open in Chrome".' }</li>{ /* What: Open Step Item Element. Why: The menu's item opens the device's browser. How: This names its usual wordings, with Safari on an iPhone or iPad. */ }


				</ol>

				<p className={ cssModObj.inaNotPar }>Or copy the link and paste it into your browser.</p>{ /* What: In-App Note Paragraph Element. Why: A menu without that item still lets the link be carried. How: This offers the copy. */ }

				<label
					className={ cssModObj.inaLinLab }
					htmlFor='inaLinInp'
				>{ tokValStr === undefined ? 'Link' : 'Invite link' }</label>{ /* What: In-App Link Label Element. Why: The field needs a visible name. How: This labels the link, naming an invite's. */ }

				<input
					ref={ linInpRef }
					id='inaLinInp'

					className={ cssModObj.inaLinInp }

					readOnly
					type='text'
					value={ linValStr }

					onFocus={ ( focEveObj ) => { // What: Focus Handler. Why: The link is there to be copied whole. How: This selects it, then brings it into view.


						focEveObj.target.select(); // What: Select Call. Why: Selected text is one tap from Copy. How: This selects the whole link.

						focEveObj.target.scrollIntoView( { block : 'nearest' } ); // What: Scroll Into View Call. Why: WebKit leaves a field that selects its text on focus where it was, which is off screen when it sits low on the page. How: This scrolls it just far enough to show it.


					} }
				/>{ /* What: In-App Link Input Element. Why: The link can be copied by hand where the clipboard can't be written. How: This shows it, read only. */ }

				<button
					className={ cssModObj.inaCopBut }

					type='button'

					onClick={ () => void linCopFun() }
				>Copy link</button>{ /* What: In-App Copy Button Element. Why: Copying is the fallback, quieter than leaving. How: This copies the link. */ }

				<p
					className={ cssModObj.inaStaPar }

					role='status'
				>{ copStaStr }</p>{ /* What: In-App Status Paragraph Element. Why: A copy, or a failed one, should be told, and a region added only when it speaks is often missed. How: This is in the page and empty from the first render. */ }


			</section>



			<section
				className={ cssModObj.inaStaSec }

				aria-labelledby='inaStaHea'
			>{ /* What: In-App Stay Section Element. Why: Someone who wants to stay can, knowing what it risks. How: This holds the heading, the warning, and the button. */ }


				<h2
					id='inaStaHea'

					className={ cssModObj.inaStaHea }
				>Stay here instead?</h2>{ /* What: In-App Stay Heading Element. Why: The way past needs a name of its own. How: This asks the question it answers. */ }

				<p className={ cssModObj.inaNotPar }>You can use Come Hang here, but your groups stay inside this app and may be lost when it clears its data.</p>{ /* What: In-App Note Paragraph Element. Why: Carrying on here has costs someone should know first. How: This says them. */ }

				<button
					className={ cssModObj.inaConBut }

					type='button'

					onClick={ () => { inaSetFun(); onConFun(); } } // What: Continue Handler. Why: The choice should hold on later visits, and the app opens now. How: This keeps it and hands it on.
				>Continue here</button>{ /* What: In-App Continue Button Element. Why: Carrying on here is the quietest choice. How: This carries on. */ }


			</section>


		</MaiAreCom>


	);


}

// #endregion InaAppCom

// #endregion Components



// #region Exports

export { InaAppCom }; // What: Named Export. Why: The screen host shows it in another app's built-in browser. How: This exports InaAppCom.

// #endregion Exports


