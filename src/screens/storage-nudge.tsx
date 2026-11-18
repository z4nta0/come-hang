


// #region Imports

import cssModObj from './storage-nudge.module.css'; // What: CSS Module Object. Why: The card is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';                // What: Button Base Component. Why: Opening Settings is the card's leading action. How: This draws its button.
import { cpsSizFun    } from '../platform/chat-photo-store.ts'; // What: Chat-Photo-Store Size Function. Why: The card shows once the chat photos take a lot of room. How: This totals them.
import { proKeyFun    } from '../platform/dev-profile.ts';      // What: Profile Key Function. Why: Each development member keeps their own record of the card. How: This names its storage key.
import { useEffect    } from 'react';                           // What: Use Effect. Why: Whether the card shows is checked as the chat opens. How: This runs the check after rendering.
import { useScrOpeFun } from '../ui/screen.ts';                 // What: Use Screen Open Function. Why: The card's button opens the group's Settings. How: This returns the function that opens a screen.
import { useState     } from 'react';                           // What: Use State. Why: Whether the card shows changes what shows. How: This holds it.

// #endregion Imports



/**
 * storage-nudge.tsx = Storage Nudge Card
 *
 * @summary
 * A card above the chat saying the device is running short of room
 * (ARCHITECTURE.md Section 22), shown when the browser's estimate has the
 * app using 80% or more of what it allows, or the chat photos pass 500 MB.
 * It stays, visit after visit, until one of its buttons is pressed, which the
 * device keeps, so it never comes back after. "Open Settings" opens the
 * group's Settings, which holds Storage on this device, and "Not now" puts
 * the card away.
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

const NUD_KEY_STR = proKeyFun( 'come-hang-storage-nudge-answered' ); // What: Nudge Key String. Why: The card stays until it's answered on a device, and the record has to outlive the visit. How: This names its storage key.
const PHO_MAX_NUM = 500 * 1024 * 1024;                               // What: Photos Maximum Number. Why: Chat photos past 500 MB take a lot of a device's room, whatever the browser allows (Section 22). How: This is the size, in bytes, past which the card shows.

// #endregion Constants



// #region Helpers

const nudKeeFun = () : void => { // What: Nudge Keep Function. Why: A card answered with either button shouldn't come back. How: This keeps the record, keeping nothing where storage is blocked.


	try { localStorage.setItem( NUD_KEY_STR, 'true' ); } // What: Record Write Attempt. Why: A later visit shouldn't show the card again. How: This keeps the record.

	catch { /* What: Blocked Storage. Why: The check already counts blocked storage as answered. How: Nothing is kept. */ }


};

// #endregion Helpers



// #region Components

type SncProTyp = { className : string, groIdeStr : string }; // What: Storage Nudge Component Props Type. Why: The chat places the card in its own area, and its button opens the group's Settings. How: This types StoNudCom's props.

// #region StoNudCom

/**
 * StoNudCom = Storage Nudge Component
 *
 * @summary
 * Renders the low space card, when it should show. As the chat opens it
 * checks that the card hasn't been answered on this device, then totals the
 * chat photos and reads the browser's estimate, showing the card when the app
 * uses 80% or more of its quota or the photos pass 500 MB. Either button
 * puts it away for good: "Open Settings" opens the group's Settings section,
 * and "Not now" moves focus to the main area as the card goes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.className - Class Name: The class the chat places the card's
 *                          wrapper with.
 * @param props.groIdeStr - Group Identifier String: The group whose Settings
 *                          the card opens.
 *
 * @returns The card's wrapper, holding the card while it shows.
 *
 * @example
 * ```tsx
 * StoNudCom({ className, groIdeStr }) // => <StoNudCom />
 * ```
 *
*/

function StoNudCom ( { className, groIdeStr } : SncProTyp ) : React.JSX.Element {


	const [ shoNudBoo, setShoNudBoo ] = useState( false ); // What: Show Nudge Boolean And Setter. Why: The card shows only once it's known it should. How: This is true while it shows.


	const scrOpeFun = useScrOpeFun(); // What: Screen Open Function. Why: The card opens the group's Settings. How: This reads the function that opens a screen.



	useEffect( () => { // What: Show Check Effect. Why: The card shows until it's answered, only when the device is short of room. How: This checks the record, then the photos' size and the browser's estimate, then shows the card.


		let shoKeyBoo = false; // What: Shown Key Boolean. Why: A device that answered the card never shows it again, and storage can be blocked. How: This is true once the record is found.


		try { shoKeyBoo = localStorage.getItem( NUD_KEY_STR ) !== null; } // What: Record Read Attempt. Why: The record is kept under its key. How: This reads whether it's there.

		catch { shoKeyBoo = true; } // What: Blocked Storage. Why: A device that can't keep the record would show the card on every visit. How: This counts it as answered.



		if ( shoKeyBoo ) return; // What: Answered Guard. Why: A card answered before has nothing more to say. How: This returns.



		let actValBoo = true; // What: Active Value Boolean. Why: A check finishing after the chat closed mustn't show the card. How: This is true until the cleanup runs.


		void Promise.all( [ cpsSizFun(), navigator.storage?.estimate?.().catch( () : StorageEstimate => ( {} ) ) ?? Promise.resolve< StorageEstimate >( {} ) ] ).then( ( [ cpsSizObj, estValObj ] ) => { if ( actValBoo && ( cpsSizObj.bytNum > PHO_MAX_NUM || ( estValObj.quota ?? 0 ) > 0 && ( estValObj.usage ?? 0 ) >= 0.8 * ( estValObj.quota ?? 0 ) ) ) setShoNudBoo( true ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Room Check Call. Why: The card shows when the photos are large or the app is near its quota (Section 22). How: This totals the photos and reads the browser's estimate, an empty one where it has none, and shows the card past either line, logging a failed total.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A late answer belongs to a chat that's gone. How: This marks the check inactive.


	}, [] ); // What: Effect Dependency Array. Why: The check runs once as the chat opens. How: The empty list runs it once.



	return (


		<div className={ className }>{ /* What: Nudge Wrapper Div Element. Why: The card comes and goes where the chat places it. How: This holds it. */ }


			{ shoNudBoo && ( // What: Card Block. Why: The card shows only when the device is short of room. How: This shows it while it should.


				<section
					className={ cssModObj.nudCarSec }

					aria-label='Storage'
				>{ /* What: Nudge Card Section Element. Why: The note reads as one part above the chat. How: This holds its line and its buttons. */ }


					<p className={ cssModObj.nudTexPar }>Chat photos are filling up this device. You can choose how long they stay, or remove older ones, in Settings.</p>{ /* What: Nudge Text Paragraph Element. Why: The member should know why the device is filling and what they can do. How: This says so. */ }

					<div className={ cssModObj.nudActDiv }>{ /* What: Nudge Actions Div Element. Why: Opening Settings and putting the card away sit together. How: This holds both in a row that wraps. */ }


						<ButBasCom onClick={ () => { nudKeeFun(); setShoNudBoo( false ); scrOpeFun( { groStr : groIdeStr, scrStr : 'group', secStr : 'settings' } ); } }>Open Settings</ButBasCom>{ /* What: Button Base Component. Why: Storage on this device is in Settings, and the card shouldn't come back once answered. How: This keeps the card answered, puts it away, and opens the group's Settings. */ }



						<button
							className={ cssModObj.nudSecBut }

							type='button'

							onClick={ () => { nudKeeFun(); document.getElementById( 'main' )?.focus(); setShoNudBoo( false ); } } // What: Hide Handler. Why: The card shouldn't come back once put away, and focus shouldn't fall to the page as it goes. How: This keeps the card answered, focuses the main area, and puts the card away.
						>Not now</button>{ /* What: Nudge Secondary Button Element. Why: The member may not want to clear anything now. How: This puts the card away. */ }


					</div>


				</section>


			) }


		</div>


	);


}

// #endregion StoNudCom

// #endregion Components



// #region Exports

export { StoNudCom }; // What: Named Export. Why: The chat shows the card above its log. How: This exports StoNudCom.

// #endregion Exports


