


// #region Imports

import cssModObj from './docs.module.css'; // What: CSS Module Object. Why: The part is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { PriPolCom } from './text.tsx';      // What: Privacy Policy Component. Why: The sheet shows the policy. How: This renders its body.
import { SheDiaCom } from '../ui/sheet.tsx'; // What: Sheet Dialog Component. Why: A document opens over Settings. How: This draws the sheet.
import { TerSerCom } from './text.tsx';      // What: Terms Service Component. Why: The sheet shows the terms. How: This renders their body.
import { useRef    } from 'react';           // What: Use Reference. Why: The buttons open the sheet. How: This holds its handle.
import { useState  } from 'react';           // What: Use State. Why: The sheet shows whichever document was asked for. How: This holds which one.


import type { SheHanTyp } from '../ui/sheet.tsx'; // What: Sheet Handle Type. Why: The part opens its sheet. How: This types the sheet's handle.

// #endregion Imports



/**
 * docs.tsx = Legal Documents
 *
 * @summary
 * The part of Settings that holds the privacy policy and the terms: a heading,
 * a note, and a button for each document, which opens it in a sheet over the
 * section. The documents are part of the app's own bundle, so they open
 * without a connection, and their text is the same the static pages show.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region LegDocCom

/**
 * LegDocCom = Legal Documents Component
 *
 * @summary
 * Renders the Settings part titled "Privacy and terms" as an h3, with a note
 * and two buttons in a row that wraps. Each button picks its document and
 * opens the one sheet, titled with the document's name, which shows the
 * document's body in an article. Closing the sheet returns focus to the
 * button that opened it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The part and its sheet.
 *
 * @example
 * ```tsx
 * LegDocCom({}) // => <LegDocCom />
 * ```
 *
*/

function LegDocCom () : React.JSX.Element {


	const [ docKinStr, setDocKinStr ] = useState< 'privacy' | 'terms' >( 'privacy' ); // What: Document Kind String And Setter. Why: One sheet shows whichever document was asked for. How: This holds its name, the policy until a button picks.

	const sheHanRef = useRef< SheHanTyp >( null ); // What: Sheet Handle Reference. Why: The buttons open the sheet. How: This holds its handle.



	return (


		<section
			className={ cssModObj.legSetSec }

			aria-labelledby='legSetHea'
		>{ /* What: Legal Settings Section Element. Why: The documents read as one part of Settings. How: This holds its heading, note, buttons, and sheet. */ }


			<h3
				id='legSetHea'

				className={ cssModObj.legTitHea }
			>Privacy and terms</h3>{ /* What: Legal Title Heading Element. Why: The part needs a heading. How: This names it. */ }

			<p className={ cssModObj.legNotPar }>How Come Hang handles your information, and the terms for using it.</p>{ /* What: Legal Note Paragraph Element. Why: A member should know what the two buttons open. How: This says it. */ }

			<div className={ cssModObj.legActDiv }>{ /* What: Legal Actions Div Element. Why: The two documents' buttons sit together. How: This lines them up in a row that wraps. */ }


				<button
					className={ cssModObj.actPlaBut }

					type='button'

					onClick={ () => { setDocKinStr( 'privacy' ); sheHanRef.current?.opeFun(); } } // What: Privacy Click Handler. Why: The sheet should show the policy. How: This picks it and opens the sheet.
				>Privacy Policy</button>{ /* What: Action Plain Button Element. Why: A member can read the policy without leaving the app. How: This opens it in the sheet. */ }

				<button
					className={ cssModObj.actPlaBut }

					type='button'

					onClick={ () => { setDocKinStr( 'terms' ); sheHanRef.current?.opeFun(); } } // What: Terms Click Handler. Why: The sheet should show the terms. How: This picks them and opens the sheet.
				>Terms of Service</button>{ /* What: Action Plain Button Element. Why: A member can read the terms without leaving the app. How: This opens them in the sheet. */ }


			</div>



			<SheDiaCom
				ref={ sheHanRef }

				ideStr='legDocHea'
				titStr={ docKinStr === 'privacy' ? 'Privacy Policy' : 'Terms of Service' }
			>{ /* What: Document Sheet Dialog Component. Why: A document opens over Settings. How: This holds it, titled with its name. */ }


				<article className={ cssModObj.legDocArt }>{ docKinStr === 'privacy' ? <PriPolCom /> : <TerSerCom /> }</article>{ /* What: Legal Document Article Element. Why: The document's prose is styled as one block. How: This holds the body of whichever document was picked. */ }


			</SheDiaCom>


		</section>


	);


}

// #endregion LegDocCom

// #endregion Components



// #region Exports

export { LegDocCom }; // What: Named Export. Why: Settings shows the documents' part. How: This exports LegDocCom.

// #endregion Exports


