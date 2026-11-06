


// #region Imports

import cssModObj from './welcome.module.css'; // What: CSS Module Object. Why: The welcome is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { BraMarCom    } from '../ui/brand-mark.tsx';   // What: Brand Mark Component. Why: The welcome leads with the app's mark. How: This draws it above the heading.
import { ButBasCom    } from '../ui/button.tsx';       // What: Button Base Component. Why: Starting a group is the welcome's main action. How: This draws it as the main action button.
import { InsNotCom    } from '../ui/install-note.tsx'; // What: Install Note Component. Why: A browser that can install the app suggests it here. How: This shows the note while the browser offers its prompt.
import { LegLinCom    } from '../legal/links.tsx';     // What: Legal Links Component. Why: Starting or joining a group means agreeing to the terms and the policy. How: This draws the line linking both.
import { useRecGroFun } from './group-recovery.ts';    // What: Use Recover Groups Function. Why: Someone on a new phone gets their groups back here too. How: This returns the recovery, its progress, and its alert's text.
import { useScrOpeFun } from '../ui/screen.ts';        // What: Use Screen Open Function. Why: The buttons open the screens for starting a group and pasting a link. How: This returns the function that opens a screen.

// #endregion Imports



/**
 * welcome.tsx = Welcome
 *
 * @summary
 * What the app's frame shows when a phone holding an identity is in no group,
 * such as after leaving its last group, while a phone with no identity sees
 * the landing page: the app's mark, a heading saying there's no group yet, a
 * line on what to do, and a button that starts a group, then one that joins
 * with an invite link, centered in the content. Someone who has used the app
 * on another phone gets their groups back through Google instead. A line
 * below the buttons says starting or joining means agreeing to the terms and
 * the privacy policy, linking both, and a browser that can install the app
 * with one tap suggests it in a note below.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type WscProTyp = { onRecFun : () => void }; // What: Welcome Section Component Props Type. Why: The welcome hands on an identity brought back. How: This types WelSecCom's props.

// #region WelSecCom

/**
 * WelSecCom = Welcome Section Component
 *
 * @summary
 * Renders the welcome inside the frame's main area: the mark, a heading
 * saying there's no group yet, the line on what to do, the start button,
 * which opens the screen for starting a group as a new history entry, and the
 * join button, which opens the screen for pasting an invite link the same
 * way. "Get my groups back" signs in with Google through its popup, its label
 * reading "Signing in…" meanwhile, then calls onRecFun; a sign-in that doesn't
 * go through is announced through the alert, saying why where it can. Below
 * the buttons, a line says starting or joining a group means agreeing to the
 * terms and the privacy policy, linking both.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.onRecFun - On Recover Function: Called once an identity is
 *                         brought back onto this phone.
 *
 * @returns The welcome.
 *
 * @example
 * ```tsx
 * WelSecCom({ onRecFun }) // => <WelSecCom />
 * ```
 *
*/

function WelSecCom ( { onRecFun } : WscProTyp ) : React.JSX.Element {


	const scrOpeFun = useScrOpeFun(); // What: Screen Open Function. Why: The start and join buttons open other screens. How: This reads the function that opens one.

	const { errMesStr, recGroFun, recReqBoo } = useRecGroFun( onRecFun ); // What: Error Message String. Why: A sign-in that doesn't go through is announced. How: This reads the alert's text. // What: Recover Groups Function. Why: The recover button runs it. How: This reads it. // What: Recover Request Boolean. Why: The button says it's working. How: This reads whether a sign-in is out.



	return (


		<div className={ cssModObj.welSecDiv }>{ /* What: Welcome Section Div Element. Why: The welcome fills the content while there's no group to show. How: This stacks the mark, heading, line, and buttons in the middle of the content, scrolling when they outgrow it. */ }


			<BraMarCom className={ cssModObj.welMarSvg } />{ /* What: Welcome Mark SVG Element. Why: The mark makes the app recognizable. How: This draws it at the top. */ }



			<h2 className={ cssModObj.welTitHea }>{ "You're not in a group yet" }</h2>{ /* What: Welcome Title Heading Element. Why: The content says at once why there's nothing else to show. How: This heads it, below the frame's one h1. */ }

			<p className={ cssModObj.welTagPar }>Start a group for your get-togethers, or join one with the invite link someone sent you. Chat, Events, Map, and People open once you're in one.</p>{ /* What: Welcome Tagline Paragraph Element. Why: Someone should know what to do next, and why the other tabs are off. How: This says both in one line. */ }



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



			<InsNotCom />{ /* What: Install Note Component. Why: A browser that can install the app with one tap suggests it, never in the way. How: This shows the note below the welcome's own content while the browser offers its prompt. */ }


		</div>


	);


}

// #endregion WelSecCom

// #endregion Components



// #region Exports

export { WelSecCom }; // What: Named Export. Why: The frame shows the welcome while someone is in no group. How: This exports WelSecCom.

// #endregion Exports


