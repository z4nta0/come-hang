


// #region Imports

import cssModObj from './docs.module.css'; // What: CSS Module Object. Why: The part is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { modCliFun } from '../utils/click.ts'; // What: Modified Click Function. Why: A modified click on a document's link is left to the browser. How: This checks the click first.
import { PriPolCom } from './text.tsx';        // What: Privacy Policy Component. Why: The sheet shows the policy. How: This renders its body.
import { SheDiaCom } from '../ui/sheet.tsx';   // What: Sheet Dialog Component. Why: A document opens over Settings. How: This draws the sheet.
import { TerSerCom } from './text.tsx';        // What: Terms Service Component. Why: The sheet shows the terms. How: This renders their body.
import { useEffect } from 'react';             // What: Use Effect. Why: A document opened from the other's link takes focus once it's drawn. How: This moves focus after the switch.
import { useRef    } from 'react';             // What: Use Reference. Why: The buttons open the sheet, and a switch focuses the article. How: This holds the sheet's handle, the article, and whether a switch is owed focus.
import { useState  } from 'react';             // What: Use State. Why: The sheet shows whichever document was asked for. How: This holds which one.


import type { SheHanTyp } from '../ui/sheet.tsx'; // What: Sheet Handle Type. Why: The part opens its sheet. How: This types the sheet's handle.

// #endregion Imports



/**
 * docs.tsx = Legal Documents
 *
 * @summary
 * The part of Settings that holds the privacy policy and the terms: a heading,
 * a note, and a button for each document, which opens it in a sheet over the
 * section. The documents are part of the app's own bundle, so they open
 * without a connection, and their text is the same the static pages show. A
 * link from one document to the other switches the sheet rather than leaving
 * the app.
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
 * button that opened it. A plain click on a document's link to /privacy or
 * /terms switches the sheet to that document, scrolls it back to the top,
 * and focuses the article, which the sheet's title names, since the link
 * pressed is gone. A modified click is left to the browser, which opens the
 * static page its own way.
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

	const artEleRef = useRef< HTMLElement >( null ); // What: Article Element Reference. Why: A switch moves focus to the document and scrolls back to its top. How: This holds the article.
	const focOweRef = useRef( false );               // What: Focus Owed Reference. Why: Only a switch from a link should move focus, not a button opening the sheet. How: This is true from the link's click until the new document is drawn.
	const sheHanRef = useRef< SheHanTyp >( null );   // What: Sheet Handle Reference. Why: The buttons open the sheet. How: This holds its handle.



	// #region docCliFun

	/**
	 * docCliFun = Document Click Function
	 *
	 * @summary
	 * Handles a click anywhere in the sheet's article. A plain click on a link
	 * to /privacy or /terms is cancelled, marks focus as owed, and switches
	 * the sheet to that document. Any other click, a modified one included,
	 * is left alone.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param cliEveObj - Click Event Object: The click on the article.
	 *
	 * @returns This function does not return anything.
	 *
	 * @example
	 * ```ts
	 * docCliFun(cliEveObj) // => void
	 * ```
	 *
	*/

	const docCliFun = ( cliEveObj : React.MouseEvent< HTMLElement > ) : void => { // What: Document Click Function. Why: A link between the documents should stay in the app. How: This switches the sheet for a plain click on one.


		const tarCurEle = cliEveObj.target; // What: Target Current Element. Why: The click may land on a link or on the text around it. How: This reads what was clicked.


		if ( !( tarCurEle instanceof Element ) ) return; // What: Element Guard. Why: Only an element can sit inside a link. How: This returns for anything else.



		const hreValStr = tarCurEle.closest( 'a' )?.getAttribute( 'href' ); // What: Href Value String. Why: The link's address says which document it opens. How: This reads the address of the link clicked, if any.


		if ( hreValStr !== '/privacy' && hreValStr !== '/terms' ) return; // What: Other Link Guard. Why: Only a link to one of the documents switches the sheet. How: This returns for every other click.



		if ( modCliFun( cliEveObj ) ) return; // What: Modified Click Guard. Why: A Ctrl, Cmd, Shift, or Alt click asks the browser to open the page its own way. How: This leaves it alone.



		cliEveObj.preventDefault(); // What: Default Prevent Call. Why: Following the link would leave the app for the static page. How: This cancels it.

		focOweRef.current = true; // What: Focus Owed Assignment. Why: The link pressed is about to be replaced. How: This marks focus as owed to the new document.

		setDocKinStr( hreValStr === '/privacy' ? 'privacy' : 'terms' ); // What: Document Switch Call. Why: The sheet should show the document the link names. How: This picks it.


	};

	// #endregion docCliFun



	useEffect( () => { // What: Document Focus Effect. Why: Focus shouldn't fall to the page when the link pressed is replaced, and the new document should start at its top. How: This scrolls the sheet's panel to the top and focuses the article, once, when a switch owes it.


		if ( !focOweRef.current ) return; // What: Not Owed Guard. Why: A button opening the sheet keeps focus where the sheet puts it. How: This returns unless a link switched the document.



		focOweRef.current = false; // What: Focus Owed Reset. Why: The focus is given once. How: This clears the flag.

		artEleRef.current?.parentElement?.scrollTo( { top : 0 } ); // What: Panel Scroll Call. Why: The new document should open at its title. How: This scrolls the sheet's panel, the article's parent, to the top.

		artEleRef.current?.focus( { preventScroll : true } ); // What: Article Focus Call. Why: A screen reader should hear which document opened, and the next Tab should continue into it. How: This focuses the article, named by the sheet's title, without scrolling away from the top.


	}, [ docKinStr ] ); // What: Effect Dependency Array. Why: Focus is owed only after the document changes. How: docKinStr changes when a link or a button picks the other document.



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


				<article
					ref={ artEleRef }

					className={ cssModObj.legDocArt }

					aria-labelledby='legDocHea'
					tabIndex={ -1 } // What: Article Tab Index. Why: Focus moves here when a link switches the document, but the article isn't a control. How: This lets it take focus from a script without joining the Tab order.

					onClick={ docCliFun }
				>{ docKinStr === 'privacy' ? <PriPolCom /> : <TerSerCom /> }</article>{ /* What: Legal Document Article Element. Why: The document's prose is styled as one block, named by the sheet's title. How: This holds the body of whichever document was picked, and switches documents when one links the other. */ }


			</SheDiaCom>


		</section>


	);


}

// #endregion LegDocCom

// #endregion Components



// #region Exports

export { LegDocCom }; // What: Named Export. Why: Settings shows the documents' part. How: This exports LegDocCom.

// #endregion Exports


