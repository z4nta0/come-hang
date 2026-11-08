


// #region Imports

import cssModObj from './push-nudge.module.css'; // What: CSS Module Object. Why: The card is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';           // What: Button Base Component. Why: Turning notifications on is the card's leading action. How: This draws its button.
import { notSupFun } from '../platform/messaging.ts';   // What: Notification Supported Function. Why: The card offers notifications only where they can work. How: This checks the browser.
import { perStaFun } from '../platform/messaging.ts';   // What: Permission State Function. Why: A browser already answered, allowing or blocking, needn't be asked. How: This reads its answer.
import { proKeyFun } from '../platform/dev-profile.ts'; // What: Profile Key Function. Why: Each development member keeps their own record of the card. How: This names its storage key.
import { pusActFun } from '../state/push.ts';           // What: Push Active Function. Why: A device with notifications on needs no card. How: This reads whether they're on.
import { pusEnaFun } from '../state/push.ts';           // What: Push Enable Function. Why: The card turns notifications on, which asks the browser. How: This asks and stores the token.
import { useEffect } from 'react';                      // What: Use Effect. Why: Whether the card shows is checked as the chat opens. How: This runs the check after rendering.
import { useState  } from 'react';                      // What: Use State. Why: Whether the card shows, its work, and its messages change what shows. How: This holds each.

// #endregion Imports



/**
 * push-nudge.tsx = Push Nudge Card
 *
 * @summary
 * A card above the chat that offers, once on each device, to turn
 * notifications on (ARCHITECTURE.md Section 11.1). It shows only where the
 * browser can show notifications, hasn't answered yet, and the device
 * hasn't turned them on, and it stays, visit after visit, until one of its
 * buttons is pressed, which the device keeps, so it never comes back after.
 * "Turn on notifications" asks the browser, and "Not now" puts the card
 * away, a line below it saying Settings can always turn them on. The answer
 * is announced as the card goes.
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

const NUD_KEY_STR = proKeyFun( 'come-hang-push-nudge-answered' ); // What: Nudge Key String. Why: The card stays until it's answered on a device, and the record has to outlive the visit. How: This names its storage key.

// #endregion Constants



// #region Helpers

const nudKeeFun = () : void => { // What: Nudge Keep Function. Why: A card answered with either button shouldn't come back. How: This keeps the record, keeping nothing where storage is blocked.


	try { localStorage.setItem( NUD_KEY_STR, 'true' ); } // What: Record Write Attempt. Why: A later visit shouldn't show the card again. How: This keeps the record.

	catch { /* What: Blocked Storage. Why: The check already counts blocked storage as answered. How: Nothing is kept. */ }


};

// #endregion Helpers



// #region Components

type PncProTyp = { className : string }; // What: Push Nudge Component Props Type. Why: The chat places the card in its own area. How: This types PusNudCom's props.

// #region PusNudCom

/**
 * PusNudCom = Push Nudge Component
 *
 * @summary
 * Renders the notifications card, when it should show, above a status and
 * an alert that are always in the page. As the chat opens it checks that
 * the card hasn't shown on this device, that the browser can show
 * notifications and hasn't answered, and that they aren't on; then it shows
 * the card. Turning them on asks the browser and puts the card away for
 * good with the answer announced, and a failure keeps the card with an
 * alert. "Not now" puts it away for good. Either way focus moves to the main
 * area as the card goes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.className - Class Name: The class the chat places the card's
 *                          wrapper with.
 *
 * @returns The card's wrapper, holding the card while it shows.
 *
 * @example
 * ```tsx
 * PusNudCom({ className }) // => <PusNudCom />
 * ```
 *
*/

function PusNudCom ( { className } : PncProTyp ) : React.JSX.Element {


	const [ actReqBoo, setActReqBoo ] = useState( false ); // What: Action Request Boolean And Setter. Why: The browser is asked once at a time, and the button says it's working. How: This is true while it's asked.
	const [ errMesStr, setErrMesStr ] = useState( '' );    // What: Error Message String And Setter. Why: A failure to turn them on is announced. How: This holds the alert's text, empty when there's none.
	const [ shoNudBoo, setShoNudBoo ] = useState( false ); // What: Show Nudge Boolean And Setter. Why: The card shows only once it's known it should. How: This is true while it shows.
	const [ staMesStr, setStaMesStr ] = useState( '' );    // What: Status Message String And Setter. Why: The answer is announced as the card goes. How: This holds the status's text.



	useEffect( () => { // What: Show Check Effect. Why: The card shows until it's answered, only where notifications could be turned on and aren't. How: This checks the record, the browser, and the device, then shows the card.


		let shoKeyBoo = false; // What: Shown Key Boolean. Why: A device that answered the card never shows it again, and storage can be blocked. How: This is true once the record is found.



		try { shoKeyBoo = localStorage.getItem( NUD_KEY_STR ) !== null; } // What: Record Read Attempt. Why: The record is kept under its key. How: This reads whether it's there.

		catch { shoKeyBoo = true; } // What: Blocked Storage. Why: A device that can't keep the record would show the card on every visit. How: This counts it as answered.



		if ( shoKeyBoo || pusActFun() ) return; // What: Not Needed Guard. Why: A card answered before, or notifications already on, has nothing to offer. How: This returns.



		let actValBoo = true; // What: Active Value Boolean. Why: An answer arriving after the chat closed mustn't show the card. How: This is true until the cleanup runs.


		void notSupFun().then( ( supValBoo ) => { if ( actValBoo && supValBoo && perStaFun() === 'default' ) setShoNudBoo( true ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Support Check Call. Why: Only a browser that can show notifications, and hasn't been asked, gets the card. How: This shows it then, logging a failed check.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A late answer belongs to a chat that's gone. How: This marks the check inactive.


	}, [] ); // What: Effect Dependency Array. Why: The check runs once as the chat opens. How: The empty list runs it once.



	// #region nudOnnFun

	/**
	 * nudOnnFun = Nudge On Function
	 *
	 * @summary
	 * Turns notifications on from the card, unless it's already asking: asks
	 * the browser, then keeps the card answered and puts it away, moving
	 * focus to the main area, and announces the answer, granted, dismissed,
	 * blocked, or unsupported. A failure keeps the card and announces it
	 * through the alert.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the answer is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * nudOnnFun() // => Promise<void>
	 * ```
	 *
	*/

	const nudOnnFun = async () : Promise< void > => { // What: Nudge On Function. Why: The member chose to be notified. How: This asks the browser and puts the card away with the answer.


		if ( actReqBoo ) return; // What: Busy Guard. Why: One ask at a time. How: This ignores a second press.



		setActReqBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the ask out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer stands. How: This empties the alert.


		let ansValStr = ''; // What: Answer Value String. Why: The browser's answer decides the message. How: This holds it once the ask returns.



		try { ansValStr = await pusEnaFun(); } // What: Ask Try. Why: The browser shows its prompt, and the token is stored once allowed. How: This asks and keeps the answer.

		catch ( errCatObj ) { // What: Ask Catch. Why: A failed ask should be told, with the card left to try again. How: This logs it, frees the button, and says so.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setActReqBoo( false ); // What: Busy Clear Call. Why: The member can try again. How: This marks the ask done.

			setErrMesStr( "Notifications couldn't be turned on. Check your connection and try again." ); // What: Failure Alert Call. Why: The member should know it didn't work. How: This announces it.



			return;


		}



		nudKeeFun(); // What: Keep Call. Why: The browser has answered, so the card shouldn't come back. How: This keeps the record.

		document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The card goes with the button that had focus. How: This focuses the main area, the skip link's target.

		setShoNudBoo( false ); // What: Hide Call. Why: The browser has answered. How: This puts the card away.

		setStaMesStr( ansValStr === 'granted' ? 'Notifications are on for this device.' : ansValStr === 'default' ? 'Notifications are still off. You can turn them on in Settings.' : ansValStr === 'denied' ? 'Your browser is blocking notifications for this app. You can allow them in its site settings.' : "This browser can't show notifications here." ); // What: Answer Status Call. Why: The member hears what happened. How: This words the browser's answer.


	};

	// #endregion nudOnnFun



	const nudHidFun = () : void => { // What: Nudge Hide Function. Why: Notifications are never required, the card shouldn't come back once put away, and focus shouldn't fall to the page as it goes. How: This keeps the card answered, focuses the main area, and puts the card away.


		nudKeeFun(); // What: Keep Call. Why: Not now is an answer, so the card shouldn't come back. How: This keeps the record.

		document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The card goes with the button that had focus. How: This focuses the main area, the skip link's target.

		setShoNudBoo( false ); // What: Hide Call. Why: The member put it away. How: This hides the card.


	};



	return (


		<div className={ className }>{ /* What: Nudge Wrapper Div Element. Why: The status and alert stay in place while the card comes and goes. How: This holds them where the chat places it. */ }


			{ shoNudBoo && ( // What: Card Block. Why: The card shows once, only where it can help. How: This shows it while it should.


				<section
					className={ cssModObj.nudCarSec }

					aria-label='Notifications'
				>{ /* What: Nudge Card Section Element. Why: The offer reads as one part above the chat. How: This holds its lines and its buttons. */ }


					<p className={ cssModObj.nudTexPar }>Want a heads-up when your group's chatting or plans change? Turn on notifications for this device.</p>{ /* What: Nudge Text Paragraph Element. Why: The card says what notifications are for. How: This asks the question. */ }

					<p className={ cssModObj.nudNotPar }>No pressure, you can always turn them on in Settings.</p>{ /* What: Nudge Note Paragraph Element. Why: The member shouldn't feel pushed. How: This says Settings can turn them on later. */ }



					<div className={ cssModObj.nudActDiv }>{ /* What: Nudge Actions Div Element. Why: Turning them on and putting the card away sit together. How: This holds both in a row that wraps. */ }


						<ButBasCom onClick={ () => void nudOnnFun() }>{ actReqBoo ? 'Asking…' : 'Turn on notifications' }</ButBasCom>{ /* What: Button Base Component. Why: Turning them on is the card's leading action, and the label shows while the browser is asked. How: This asks the browser. */ }

						<button
							className={ cssModObj.nudSecBut }

							type='button'

							onClick={ nudHidFun }
						>Not now</button>{ /* What: Nudge Secondary Button Element. Why: Notifications are never required, so putting the card away sits beside turning them on. How: This puts it away. */ }


					</div>


				</section>


			) }



			<p
				className={ cssModObj.nudStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Nudge Status Paragraph Element. Why: The answer is announced, and a region added only when it speaks is often missed. How: This is in the page and empty from the first render. */ }

			<p
				className={ cssModObj.nudStaPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Nudge Status Paragraph Element. Why: A failure is announced at once, and a region added only when it speaks is often missed. How: This is in the page and empty from the first render, the alert beside the status. */ }


		</div>


	);


}

// #endregion PusNudCom

// #endregion Components



// #region Exports

export { PusNudCom }; // What: Named Export. Why: The chat shows the card above its log. How: This exports PusNudCom.

// #endregion Exports


