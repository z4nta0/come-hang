


// #region Imports

import cssModObj from './install-note.module.css'; // What: CSS Module Object. Why: The note is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom            } from './button.tsx';            // What: Button Base Component. Why: Installing is the note's leading action. How: This draws the Install button.
import { canProFun            } from '../platform/install.ts';  // What: Can Prompt Function. Why: The note shows only while the browser can install. How: This checks for its prompt.
import { insProFun            } from '../platform/install.ts';  // What: Install Prompt Function. Why: The Install button asks the browser to install. How: This shows its prompt.
import { insSubFun            } from '../platform/install.ts';  // What: Install Subscribe Function. Why: The note follows the prompt as it comes and goes. How: This subscribes to it.
import { isaInsFun            } from '../platform/install.ts';  // What: Is-An Installed Function. Why: An installed app needs no note. How: This checks whether it runs installed.
import { notDisFun            } from '../platform/install.ts';  // What: Note Dismissed Function. Why: A note dismissed before stays away. How: This reads the kept dismissal.
import { notHidFun            } from '../platform/install.ts';  // What: Note Hide Function. Why: Not now should hold on later visits. How: This keeps the dismissal.
import { useState             } from 'react';                   // What: Use State. Why: Not now hides the note at once. How: This holds whether it's dismissed.
import { useSyncExternalStore } from 'react';                   // What: Use Sync External Store. Why: The browser's prompt arrives outside React. How: This rerenders the note when it does.

// #endregion Imports



/**
 * install-note.tsx = Install Note
 *
 * @summary
 * The suggestion to install the app on a phone or computer whose browser can
 * install it with one tap, such as Chrome on Android (ARCHITECTURE.md Section
 * 16). There the browser and the installed app share storage, so nothing is
 * lost by waiting, and the note never stands in the way: it shows only while
 * the browser offers its prompt, the app isn't installed, and it hasn't been
 * dismissed, and goes once it's used or dismissed. An iPhone or iPad installs
 * through Safari's own menu and gets the install screen instead.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region InsNotCom

/**
 * InsNotCom = Install Note Component
 *
 * @summary
 * Renders the install note when the browser can install the app and the note
 * hasn't been dismissed, and nothing otherwise: a heading, a line on what
 * installing gives, an Install button that shows the browser's prompt, and
 * Not now, which keeps the dismissal on the device. Either press takes the
 * note away, so focus moves to the main area it sat in.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The note, or nothing.
 *
 * @example
 * ```tsx
 * InsNotCom({}) // => <InsNotCom />
 * ```
 *
*/

function InsNotCom () : React.JSX.Element | null {


	const canProBoo = useSyncExternalStore( insSubFun, canProFun ); // What: Can Prompt Boolean. Why: The note shows only while the browser can install. How: This reads whether its prompt is kept, rerendering when it changes.

	const [ disNotBoo, setDisNotBoo ] = useState( notDisFun ); // What: Dismissed Note Boolean And Setter. Why: A dismissed note stays away. How: This starts from the kept dismissal and turns true on Not now.



	if ( !canProBoo || disNotBoo || isaInsFun() ) return null; // What: Hidden Guard. Why: The note is for a browser that can install an app not yet installed, until it's dismissed. How: This renders nothing otherwise.



	return (


		<section
			className={ cssModObj.insNotSec }

			aria-labelledby='insNotHea'
		>{ /* What: Install Note Section Element. Why: The suggestion reads as one part, apart from the screen's own. How: This holds its heading, line, and buttons. */ }


			<h2
				id='insNotHea'

				className={ cssModObj.insNotHea }
			>Install Come Hang</h2>{ /* What: Install Note Heading Element. Why: The note needs a name of its own. How: This names it. */ }

			<p className={ cssModObj.insNotPar }>Put Come Hang on your home screen, where it opens in its own window like any other app.</p>{ /* What: Install Note Paragraph Element. Why: Someone should know what installing gives before they do it. How: This says it. */ }



			<div className={ cssModObj.insActDiv }>{ /* What: Install Actions Div Element. Why: Installing and dismissing sit together. How: This holds both buttons in a row that wraps. */ }


				<ButBasCom onClick={ () => { document.getElementById( 'main' )?.focus(); void insProFun(); } }>Install</ButBasCom>{ /* What: Install Button Component. Why: Installing should take one tap, and the note goes with the prompt, so focus moves to the main area first. How: This focuses it, then shows the browser's prompt. */ }

				<button
					className={ cssModObj.insLatBut }

					type='button'

					onClick={ () => { notHidFun(); document.getElementById( 'main' )?.focus(); setDisNotBoo( true ); } } // What: Not Now Handler. Why: A dismissed note shouldn't come back, and focus shouldn't fall to the page as it goes. How: This keeps the dismissal, focuses the main area, and hides the note.
				>Not now</button>{ /* What: Install Later Button Element. Why: Installing is never required here, so dismissing is offered beside it. How: This dismisses the note. */ }


			</div>


		</section>


	);


}

// #endregion InsNotCom

// #endregion Components



// #region Exports

export { InsNotCom }; // What: Named Export. Why: The welcome and the join screen show the note. How: This exports InsNotCom.

// #endregion Exports


