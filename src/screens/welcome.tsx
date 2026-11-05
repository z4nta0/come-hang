


// #region Imports

import cssModObj from './welcome.module.css'; // What: CSS Module Object. Why: The welcome screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { BraMarCom    } from '../ui/brand-mark.tsx';   // What: Brand Mark Component. Why: The welcome leads with the app's mark. How: This draws it above the name.
import { ButBasCom    } from '../ui/button.tsx';       // What: Button Base Component. Why: Starting a group is the welcome's one action. How: This draws it as the main action button.
import { DelDatCom    } from './delete-data.tsx';      // What: Delete Data Component. Why: Someone in no group still has data to delete. How: This draws its button and confirmation.
import { InsNotCom    } from '../ui/install-note.tsx'; // What: Install Note Component. Why: A browser that can install the app suggests it here. How: This shows the note while the browser offers its prompt.
import { LegLinCom    } from '../legal/links.tsx';     // What: Legal Links Component. Why: Starting or joining a group means agreeing to the terms and the policy. How: This draws the line linking both.
import { MaiAreCom    } from '../ui/main-area.tsx';    // What: Main Area Component. Why: The welcome is the screen's main content. How: This holds it in the main landmark.
import { useEffect    } from 'react';                  // What: Use Effect. Why: The welcome takes focus when it replaces a group just left or deleted. How: This runs once it's drawn.
import { useRecGroFun } from './group-recovery.ts';    // What: Use Recover Groups Function. Why: Someone on a new phone gets their groups back here too. How: This returns the recovery, its progress, and its alert's text.
import { useRef       } from 'react';                  // What: Use Reference. Why: The heading takes focus. How: This holds it.
import { useScrOpeFun } from '../ui/screen.ts';        // What: Use Screen Open Function. Why: The button opens the screen for starting a group, and a focus request is cleared from the entry. How: This returns the function that opens a screen.

// #endregion Imports



/**
 * welcome.tsx = Welcome
 *
 * @summary
 * The screen a phone holding an identity in no group sees, such as after
 * leaving its last group, while a phone with no identity sees the landing
 * page: the app's mark, its name, a line on what it's for, and a button that
 * starts a group, then one that joins with an invite link, centered in the
 * screen. Someone who has used the app on another phone gets their groups
 * back through Google instead. A line below the buttons says starting or
 * joining means agreeing to the terms and the privacy policy, linking both,
 * a browser that can install the app with one tap suggests it in a note
 * below, and a way to delete the identity's data comes last.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type WscProTyp = { focBoo : boolean, onRecFun : () => void }; // What: Welcome Screen Component Props Type. Why: The welcome takes focus when it replaces the last group, and hands on an identity brought back. How: This types WelScrCom's props.

// #region WelScrCom

/**
 * WelScrCom = Welcome Screen Component
 *
 * @summary
 * Renders the welcome in the screen's main area: the mark, the name as the
 * screen's one h1, the tagline, the start button, which opens the screen for
 * starting a group as a new history entry, and the join button, which opens
 * the screen for pasting an invite link the same way. When focBoo is true, as
 * when the welcome replaces the last group, left or deleted, the heading takes
 * focus once drawn, and the history entry is replaced with one that no longer
 * asks, so a reload doesn't take focus again. "Get my groups back" signs in
 * with Google through its popup, its label reading "Signing in…" meanwhile,
 * then calls onRecFun; a sign-in that doesn't go through is announced
 * through the alert, saying why where it can. Below the buttons, a line says
 * starting or joining a group means agreeing to the terms and the privacy
 * policy, linking both, and the part for deleting data comes last.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.focBoo   - Focus Boolean: Whether the heading takes focus.
 * @param props.onRecFun - On Recover Function: Called once an identity is
 *                         brought back onto this phone.
 *
 * @returns The welcome's main area.
 *
 * @example
 * ```tsx
 * WelScrCom({ focBoo, onRecFun }) // => <WelScrCom />
 * ```
 *
*/

function WelScrCom ( { focBoo, onRecFun } : WscProTyp ) : React.JSX.Element {


	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: The heading takes focus when the welcome replaces the last group. How: This holds it.
	const scrOpeFun = useScrOpeFun();                       // What: Screen Open Function. Why: The start button opens another screen, and a focus request is cleared. How: This reads the function that opens one.

	const { errMesStr, recGroFun, recReqBoo } = useRecGroFun( onRecFun ); // What: Error Message String. Why: A sign-in that doesn't go through is announced. How: This reads the alert's text. // What: Recover Groups Function. Why: The recover button runs it. How: This reads it. // What: Recover Request Boolean. Why: The button says it's working. How: This reads whether a sign-in is out.



	useEffect( () => { // What: Heading Focus Effect. Why: The button that left or deleted the last group is gone, so focus should land on what replaced it. How: This focuses the heading when asked, then clears the request from the history entry.


		if ( !focBoo ) return; // What: No Request Guard. Why: Only a welcome replacing the last group takes focus. How: This returns otherwise.



		heaEleRef.current?.focus(); // What: Focus Call. Why: The welcome is announced and the next Tab starts from it. How: This focuses the heading.

		scrOpeFun( { scrStr : 'group' }, true ); // What: Request Clear Call. Why: A reload keeping the same entry shouldn't take focus again. How: This replaces the entry with one that no longer asks.


	}, [ focBoo, scrOpeFun ] ); // What: Effect Dependency Array. Why: Focus moves when it's asked for. How: focBoo changes when the request does, and scrOpeFun only if the router's navigate does.



	return (


		<MaiAreCom className={ cssModObj.welScrMai }>{ /* What: Welcome Screen Main Area Component. Why: The welcome is the screen's whole content. How: This stacks the mark, name, tagline, and button in the middle of the screen. */ }


			<BraMarCom className={ cssModObj.welMarSvg } />{ /* What: Welcome Mark SVG Element. Why: The mark makes the app recognizable. How: This draws it at the top. */ }



			<h1
				ref={ heaEleRef }

				className={ cssModObj.welTitHea }

				tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here when the welcome replaces the last group, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
			>Come Hang</h1>{ /* What: Welcome Title Heading Element. Why: The screen's one heading names the app. How: This sets the name as the wordmark. */ }

			<p className={ cssModObj.welTagPar }>Plan get-togethers with your group: chat, set the date, see who's bringing what, and find each other on the day.</p>{ /* What: Welcome Tagline Paragraph Element. Why: A first visitor should know what the app is for. How: This says it in one line. */ }



			<ButBasCom
				className={ cssModObj.welStaBut }

				onClick={ () => scrOpeFun( { scrStr : 'create' } ) }
			>Start a group</ButBasCom>{ /* What: Welcome Start Button Component. Why: Starting a group is how someone begins. How: This opens the screen for starting one. */ }

			<button
				className={ cssModObj.welJoiBut }

				type='button'

				onClick={ () => scrOpeFun( { scrStr : 'paste' } ) }
			>Join with an invite link</button>{ /* What: Welcome Join Button Element. Why: Someone sent a link can join with it here, which on an installed iPhone app is the only way an invite reaches the app. How: This opens the screen for pasting the link. */ }

			<button
				className={ cssModObj.welRecBut }

				type='button'

				onClick={ () => void recGroFun() }
			>{ recReqBoo ? 'Signing in…' : 'Get my groups back' }</button>{ /* What: Welcome Recover Button Element. Why: Someone who used the app on another phone brings their groups here, and the label shows while it's working. How: This signs in with Google, reading "Signing in…" meanwhile. */ }

			<p
				className={ cssModObj.welErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Welcome Error Paragraph Element. Why: A sign-in that doesn't go through has to be told at once, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when one fails. */ }



			<LegLinCom
				className={ cssModObj.welLegPar }

				actStr='starting or joining a group'
			/>{ /* What: Legal Links Component. Why: The welcome is where someone first starts or joins a group, and the home page has to link the privacy policy. How: This says doing so means agreeing to the terms and the policy, linking both, below the buttons. */ }



			<InsNotCom />{ /* What: Install Note Component. Why: A browser that can install the app with one tap suggests it, never in the way. How: This shows the note below the screen's own content while the browser offers its prompt. */ }



			<DelDatCom className={ cssModObj.welDelDiv } />{ /* What: Delete Data Component. Why: A phone holding an identity in no group still has data to delete, such as a Google link or the upgrade, with no Settings to reach. How: This shows the button and its confirmation last. */ }


		</MaiAreCom>


	);


}

// #endregion WelScrCom

// #endregion Components



// #region Exports

export { WelScrCom }; // What: Named Export. Why: The screen host shows the welcome to someone in no group. How: This exports WelScrCom.

// #endregion Exports


