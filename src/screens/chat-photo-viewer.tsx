


// #region Imports

import cssModObj from './chat-photo-viewer.module.css'; // What: CSS Module Object. Why: The viewer is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { kepGetFun    } from '../state/photo-keep.ts';    // What: Keep Get Function. Why: The viewer says how long the device keeps chat photos. How: This reads the choice.
import { KEP_OPT_ARR  } from '../state/photo-keep.ts';    // What: Keep Options Array. Why: The note names the span the device keeps photos for. How: This lists each span's name.
import { mesTimFun    } from '../utils/date.ts';          // What: Message Time Function. Why: The viewer says when the photo was sent. How: This labels the time briefly.
import { savFilFun    } from '../platform/photo-save.ts'; // What: Save Files Function. Why: A chat photo is kept on the device only for a while, so a member keeps the ones they want. How: This hands it over.
import { SheDiaCom    } from '../ui/sheet.tsx';           // What: Sheet Dialog Component. Why: A tapped photo opens over the chat. How: This draws the viewer's sheet.
import { useBytUrlFun } from '../ui/bytes-url.ts';        // What: Use Bytes URL Function. Why: The image shows a decrypted photo by address. How: This makes and frees one.
import { useState     } from 'react';                     // What: Use State. Why: A save's status and failure are announced. How: This holds each.


import type { SheHanTyp } from '../ui/sheet.tsx'; // What: Sheet Handle Type. Why: The chat opens the viewer through its handle. How: This types it.

// #endregion Imports



/**
 * chat-photo-viewer.tsx = Chat Photo Viewer
 *
 * @summary
 * The sheet a chat photo opens in (ARCHITECTURE.md Section 22): the photo
 * whole, who sent it and when, a button to save it to the device, and a note
 * on how long the device keeps chat photos, which Settings changes.
 *
 * Sections:
 *  - Types
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type CpvRecTyp = { bytArr : Uint8Array< ArrayBuffer >, namStr : string, sntTimNum : number }; // What: Chat-Photo-Viewer Record Type. Why: The viewer shows one photo and who sent it when. How: This types its bytes, the sender's name, empty for the member themselves, and the sent time.

// #endregion Types



// #region Components

type CpvProTyp = { onCloFun : () => void, ref : React.Ref< SheHanTyp >, vieRecObj : CpvRecTyp | null }; // What: Chat-Photo-Viewer Props Type. Why: The chat opens the viewer on a photo and hears when it closes. How: This types ChaPhoVieCom's props.

// #region ChaPhoVieCom

/**
 * ChaPhoVieCom = Chat Photo Viewer Component
 *
 * @summary
 * Renders the viewer's sheet, holding the photo given, or nothing while none
 * is. A save is announced inside the sheet, since the chat behind it is
 * inert, and so is a failure.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.onCloFun  - On Close Function: Runs once the sheet has closed.
 * @param props.ref       - Reference: Takes the sheet's handle, which opens
 *                          and closes it.
 * @param props.vieRecObj - Viewer Record Object: The photo to show, or null.
 *
 * @returns The viewer's sheet.
 *
 * @example
 * ```tsx
 * ChaPhoVieCom({ onCloFun, ref, vieRecObj }) // => <ChaPhoVieCom />
 * ```
 *
*/

function ChaPhoVieCom ( { onCloFun, ref, vieRecObj } : CpvProTyp ) : React.JSX.Element {


	const [ vieErrStr, setVieErrStr ] = useState( '' ); // What: Viewer Error String And Setter. Why: A failed save is told. How: This holds the message, empty when there's none.
	const [ vieStaStr, setVieStaStr ] = useState( '' ); // What: Viewer Status String And Setter. Why: A save is announced. How: This holds the message, empty until one.


	const vieUrlStr = useBytUrlFun( vieRecObj?.bytArr ?? null )?.urlStr ?? null; // What: Viewer URL String. Why: The image shows the photo by address. How: This makes one for its bytes, null while there's no photo.

	const kepKeyStr = kepGetFun();                                                                 // What: Keep Key String. Why: The note follows how long the device keeps photos. How: This reads the choice.
	const kepLabStr = KEP_OPT_ARR.find( ( optValObj ) => optValObj.keyStr === kepKeyStr )!.labStr; // What: Keep Label String. Why: The note names the span. How: This reads its name. // What: Non-Null Note. Why: kepGetFun returns only a key the options hold. How: The ! reads the option as found.



	return (


		<SheDiaCom
			ref={ ref }

			ideStr='chaPhoHea'
			titStr='Photo'

			onCloFun={ () => { setVieErrStr( '' ); setVieStaStr( '' ); onCloFun(); } } // What: Close Handler. Why: The next photo opens without the last one's messages, and the chat follows no photo once closed. How: This clears both messages and tells the chat.
		>{ /* What: Chat Photo Sheet Dialog Component. Why: A tapped chat photo opens over the chat. How: This holds the photo, its line, its save, and the note. */ }


			{ vieRecObj !== null && ( // What: Open Photo Check. Why: The viewer shows a photo only once one was tapped. How: This shows it and its actions.


				<div className={ cssModObj.chpVieDiv }>{ /* What: Chat-Photo Viewer Div Element. Why: The photo, its line, its save, and the note read top to bottom. How: This stacks them. */ }


					<div className={ cssModObj.vieImaDiv }>{ /* What: Viewer Image Div Element. Why: The photo shows whole, however it's shaped. How: This frames it on a quiet tint. */ }


						{ vieUrlStr !== null && <img className={ cssModObj.vieImaIma } alt={ vieRecObj.namStr === '' ? 'Photo you sent' : `Photo sent by ${ vieRecObj.namStr }` } src={ vieUrlStr } /> }{ /* What: Image Check. Why: The address is made a render after the photo arrives. How: This shows the photo once it has one, named for who sent it. */ }


					</div>

					<p className={ cssModObj.vieMetPar }>{ vieRecObj.namStr === '' ? 'You sent this' : `Sent by ${ vieRecObj.namStr }` } <span className={ cssModObj.vieTimSpa }>{ mesTimFun( vieRecObj.sntTimNum, Date.now() ) }</span></p>{ /* What: Viewer Meta Paragraph Element. Why: A photo says who sent it and when. How: This names them, then the time in the muted color. */ }

					<button
						className={ cssModObj.vieSavBut }

						type='button'

						onClick={ () => { setVieErrStr( '' ); savFilFun( [ vieRecObj.bytArr ], '' ).then( () => setVieStaStr( 'Saved the photo.' ), ( errCatObj : unknown ) => { console.warn( errCatObj ); setVieErrStr( "The photo couldn't be saved. Try again." ); } ); } } // What: Save Click Handler. Why: The member keeps the photo, and a failure should say so. How: This saves it, announcing it or the failure.
					>Save to device</button>{ /* What: Viewer Save Button Element. Why: A chat photo stays on the device only for a while, so members keep the ones they want. How: This saves the photo. */ }

					<p className={ cssModObj.vieKepPar }>{ kepKeyStr === 'all' ? 'Chat photos stay on this device until you remove them in Settings.' : `Chat photos stay on this device for ${ kepLabStr }, which you can change in Settings.` }</p>{ /* What: Viewer Keep Paragraph Element. Why: A member should know the photo won't stay forever unless they save it (Section 22). How: This names the device's span, or says photos stay until removed. */ }

					<p
						className={ cssModObj.vieStaPar }

						role='status'
					>{ vieStaStr }</p>{ /* What: Viewer Status Paragraph Element. Why: A save is announced inside the viewer, since the chat behind it is inert. How: This holds the status, empty from the first render. */ }

					<p
						className={ cssModObj.vieErrPar }

						role='alert'
					>{ vieErrStr }</p>{ /* What: Viewer Error Paragraph Element. Why: A failed save has to be told inside the viewer. How: This holds the alert, empty unless one failed. */ }


				</div>


			) }


		</SheDiaCom>


	);


}

// #endregion ChaPhoVieCom

// #endregion Components



// #region Exports

export { ChaPhoVieCom, type CpvRecTyp }; // What: Named Exports. Why: The chat opens its photos in the viewer. How: This exports it and its photo's type.

// #endregion Exports


