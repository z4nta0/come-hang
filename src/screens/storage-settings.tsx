


// #region Imports

import cssModObj from './storage-settings.module.css'; // What: CSS Module Object. Why: The part is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { chpPruFun   } from '../state/chat-photos.ts';         // What: Chat-Photo Prune Function. Why: A member clears old chat photos from the device. How: This deletes the ones sent before a time.
import { cpsSizFun   } from '../platform/chat-photo-store.ts'; // What: Chat-Photo-Store Size Function. Why: The part says how much room the chat photos take. How: This totals them.
import { kepGetFun   } from '../state/photo-keep.ts';          // What: Keep Get Function. Why: The choice starts from the one kept on this device. How: This reads it.
import { KEP_OPT_ARR } from '../state/photo-keep.ts';          // What: Keep Options Array. Why: The part offers each span. How: This lists them.
import { kepSetFun   } from '../state/photo-keep.ts';          // What: Keep Set Function. Why: Picking a span applies at once and is kept. How: This keeps it and clears what it no longer keeps.
import { useEffect   } from 'react';                           // What: Use Effect. Why: The sizes are read as the part opens and after each change, and focus moves as the confirmation opens and closes. How: This runs each.
import { useRef      } from 'react';                           // What: Use Reference. Why: Focus returns to the button the confirmation replaced, and moves to its answer as it opens. How: This holds both and whether focus is owed.
import { useState    } from 'react';                           // What: Use State. Why: The choices, the sizes, and the confirmation change while the part is open. How: This holds each.


import type { PhoKepTyp } from '../state/photo-keep.ts'; // What: Photo Keep Type. Why: The kept choice is one of the spans. How: This types it.
import type { SarRetTyp } from './settings-actions.ts';  // What: Settings Actions Return Type. Why: The part runs its changes through the section's runners. How: This types them.

// #endregion Imports



/**
 * storage-settings.tsx = Storage Settings
 *
 * @summary
 * The "Storage on this device" part of Settings (ARCHITECTURE.md Section
 * 22): how many chat photos this device keeps and the room they take,
 * beside what the browser says the app uses of what it allows, how long the
 * device keeps chat photos, and a one-time clean-up of older ones, confirmed
 * first. Removing a photo leaves its message.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type RemKeyTyp = 'all' | 'd30' | 'd90'; // What: Remove Key Type. Why: The clean-up removes photos past one of a few ages. How: This names them, all meaning every photo.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: The clean-up's ages are counted in days. How: This is one day in milliseconds.



/**
 * REM_OPT_ARR = Remove Options Array
 *
 * @summary
 * The ages the one-time clean-up offers, in the order the part lists them.
 *
 *  - `ageStr` (string): The age as the confirmation's question names it.
 *
 *  - `dayNum` (number): How many days old a photo has to be to go, 0 for
 *    every photo.
 *
 *  - `keyStr` (RemKeyTyp): The age's key.
 *
 *  - `labStr` (string): The age as its choice names it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const REM_OPT_ARR : { ageStr : string, dayNum : number, keyStr : RemKeyTyp, labStr : string }[] = [ // What: Remove Options Array. Why: The part lists the ages, and the confirmation and the clean-up read the one picked. How: This holds each age's words, days, and key.


	{ ageStr : 'chat photos older than 30 days', dayNum : 30, keyStr : 'd30', labStr : 'Older than 30 days' }, // What: Thirty Days Option.
	{ ageStr : 'chat photos older than 90 days', dayNum : 90, keyStr : 'd90', labStr : 'Older than 90 days' }, // What: Ninety Days Option.
	{ ageStr : 'every chat photo',               dayNum : 0,  keyStr : 'all', labStr : 'All of them'        }  // What: Every Photo Option.


];

// #endregion Constants



// #region Helpers

const sizTexFun = ( bytNum : number ) : string => bytNum < 1048576 ? `${ Math.max( 1, Math.round( bytNum / 1024 ) ).toLocaleString( 'en-US' ) } KB` : bytNum < 1073741824 ? `${ ( bytNum / 1048576 ).toLocaleString( 'en-US', { maximumFractionDigits : 1 } ) } MB` : `${ ( bytNum / 1073741824 ).toLocaleString( 'en-US', { maximumFractionDigits : 1 } ) } GB`; // What: Size Text Function. Why: A size reads best in the unit that fits it. How: This words bytes as KB, at least 1, below a megabyte, as MB below a gigabyte, and as GB above, to one decimal place.

// #endregion Helpers



// #region Components

type SscProTyp = { setActObj : SarRetTyp }; // What: Storage Settings Component Props Type. Why: The part runs its changes through the section that holds it. How: This types StoSetCom's props.

// #region StoSetCom

/**
 * StoSetCom = Storage Settings Component
 *
 * @summary
 * Renders the "Storage on this device" part: a line on how many chat photos
 * this device keeps and their size, with what the browser says the app uses of
 * what it allows where it says, the "Keep chat photos" choice, which applies
 * at once and clears what it no longer keeps, and the one-time clean-up, whose
 * "Remove chat photos" opens a confirmation in its place. Each change is
 * announced through the section's status, and the sizes are read again after
 * it. Focus moves to the confirmation's "Keep them" as it opens, and back to
 * "Remove chat photos" as it closes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.setActObj - Settings Actions Object: The section's runners,
 *                          which a change runs through.
 *
 * @returns The part.
 *
 * @example
 * ```tsx
 * StoSetCom({ setActObj }) // => <StoSetCom />
 * ```
 *
*/

function StoSetCom ( { setActObj } : SscProTyp ) : React.JSX.Element {


	const { actKinStr, actRunFun, setStaMesStr } = setActObj; // What: Action Kind String. Why: A button says when its change is out. How: This reads it. // What: Action Run Function. Why: The changes run through the section. How: This reads it. // What: Set Status Message String. Why: A change that lands is announced. How: This reads the status's setter.


	const focRetRef = useRef( false );                    // What: Focus Return Reference. Why: Only a confirmation the member closed owes "Remove chat photos" focus. How: This holds whether it's owed.
	const keeButRef = useRef< HTMLButtonElement >( null ); // What: Keep Button Reference. Why: The confirmation opens with focus on its safe answer. How: This holds "Keep them".
	const remButRef = useRef< HTMLButtonElement >( null ); // What: Remove Button Reference. Why: Focus returns to "Remove chat photos" once the confirmation closes. How: This holds it.

	const [ conAskBoo, setConAskBoo ] = useState( false );                                                                                 // What: Confirm Ask Boolean And Setter. Why: Removing photos is confirmed first. How: This is true while the confirmation shows.
	const [ kepKeyStr, setKepKeyStr ] = useState< PhoKepTyp >( kepGetFun );                                                                // What: Keep Key String And Setter. Why: The choice shows the span kept on this device. How: This holds it.
	const [ remKeyStr, setRemKeyStr ] = useState< RemKeyTyp >( 'd30' );                                                                    // What: Remove Key String And Setter. Why: The clean-up removes photos past the age picked. How: This holds it, 30 days at first.
	const [ sizRecObj, setSizRecObj ] = useState< { bytNum : number, couNum : number, quoNum : number, usaNum : number } | null >( null ); // What: Size Record Object And Setter. Why: The line says how much room the photos and the app take. How: This holds the photos' bytes and count, and the browser's quota and use, 0 where it doesn't say, null until read.
	const [ sizTicNum, setSizTicNum ] = useState( 0 );                                                                                     // What: Size Tick Number And Setter. Why: The sizes change after a change. How: This counts the changes, so the sizes are read again after each.


	const remOptObj = REM_OPT_ARR.find( ( optValObj ) => optValObj.keyStr === remKeyStr )!; // What: Remove Option Object. Why: The confirmation and the clean-up follow the age picked. How: This finds it. // What: Non-Null Note. Why: The type allows only a key the options hold. How: The ! reads the option as found.



	useEffect( () => { // What: Size Read Effect. Why: The line shows the room the photos and the app take. How: This totals the photos and asks the browser for its estimate where it can give one, keeping both while the part is open.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the part closed mustn't change it. How: This is true until the cleanup runs.


		void Promise.all( [ cpsSizFun(), navigator.storage?.estimate?.().catch( () : StorageEstimate => ( {} ) ) ?? Promise.resolve< StorageEstimate >( {} ) ] ).then( ( [ cpsSizObj, estValObj ] ) => { if ( actValBoo ) setSizRecObj( { ...cpsSizObj, quoNum : estValObj.quota ?? 0, usaNum : estValObj.usage ?? 0 } ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Size Read Call. Why: Both sizes read together. How: This totals the photos and reads the browser's estimate, an empty one where it has none or it fails, logging a failed total.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: Late reads mustn't land. How: This marks the part closed.


	}, [ sizTicNum ] ); // What: Effect Dependency Array. Why: The sizes are read again after each change. How: sizTicNum counts the changes.



	useEffect( () => { // What: Confirmation Focus Effect. Why: Focus follows the confirmation as it opens and closes. How: This focuses "Keep them" once it opens, or "Remove chat photos" once it closes when focus is owed.


		if ( conAskBoo ) keeButRef.current?.focus(); // What: Keep Focus Call. Why: The safe answer is the first stop. How: This focuses "Keep them".

		else if ( focRetRef.current ) { focRetRef.current = false; remButRef.current?.focus(); } // What: Remove Focus Call. Why: The confirmation closed and owes its button focus. How: This focuses "Remove chat photos".


	}, [ conAskBoo ] ); // What: Effect Dependency Array. Why: Focus moves as the confirmation opens or closes. How: conAskBoo changes then.



	const kepChaFun = async ( kepValStr : PhoKepTyp ) : Promise< void > => { // What: Keep Change Function. Why: Picking a span applies at once, clears what it no longer keeps, and is announced. How: This runs the change through the section and words its result.


		if ( actKinStr !== '' ) return; // What: Busy Guard. Why: The section runs one change at a time, and a span shown as chosen but never kept would mislead. How: This ignores the pick while another change is out.



		let delCouNum = 0; // What: Deleted Count Number. Why: The status says how many photos went. How: This carries the count out of the change.



		setKepKeyStr( kepValStr ); // What: Choice Set Call. Why: The span is kept before its older photos are cleared, so it shows as chosen at once. How: This marks it.



		if ( !await actRunFun( 'keep-photos', async () => { delCouNum = await kepSetFun( kepValStr ); } ) ) return; // What: Change Guard. Why: A clearing that fails is announced by the section and shouldn't be called done. How: This keeps the span and clears older photos, returning when it fails.



		const kepLabStr = KEP_OPT_ARR.find( ( optValObj ) => optValObj.keyStr === kepValStr )!.labStr; // What: Keep Label String. Why: The status names the new span. How: This reads its name. // What: Non-Null Note. Why: The type allows only a key the options hold. How: The ! reads the option as found.


		setStaMesStr( `${ kepValStr === 'all' ? 'Chat photos now stay on this device until you remove them.' : `Chat photos now stay on this device for ${ kepLabStr }.` }${ delCouNum === 0 ? '' : delCouNum === 1 ? ' 1 older photo was removed.' : ` ${ delCouNum.toLocaleString( 'en-US' ) } older photos were removed.` }` ); // What: Status Call. Why: The member hears the change and what it cleared. How: This names the span, then how many photos went when any did.

		setSizTicNum( ( preTicNum ) => preTicNum + 1 ); // What: Size Tick Call. Why: Clearing photos changes the room they take. How: This reads the sizes again.


	};



	const remRunFun = async () : Promise< void > => { // What: Remove Run Function. Why: The confirmed clean-up removes the older photos and is announced. How: This runs it through the section, closes the confirmation, and words its result.


		let delCouNum = 0; // What: Deleted Count Number. Why: The status says how many photos went. How: This carries the count out of the change.



		if ( !await actRunFun( 'remove-photos', async () => { delCouNum = await chpPruFun( remOptObj.dayNum === 0 ? Number.POSITIVE_INFINITY : Date.now() - remOptObj.dayNum * DAY_MIL_NUM ); } ) ) return; // What: Change Guard. Why: A failed clean-up is announced by the section and leaves the confirmation open to try again. How: This removes the photos sent before the age picked, or every photo, returning when it fails.



		focRetRef.current = true; // What: Focus Owed Assignment. Why: The confirmation closes, taking its focused answer. How: This owes "Remove chat photos" focus.

		setConAskBoo( false ); // What: Confirmation Close Call. Why: The clean-up is done. How: This brings back "Remove chat photos".

		setStaMesStr( delCouNum === 0 ? 'No photos needed removing from this device.' : delCouNum === 1 ? '1 photo was removed from this device. Its message stays in the chat.' : `${ delCouNum.toLocaleString( 'en-US' ) } photos were removed from this device. Their messages stay in the chat.` ); // What: Status Call. Why: The member hears what the clean-up did. How: This says how many photos went.

		setSizTicNum( ( preTicNum ) => preTicNum + 1 ); // What: Size Tick Call. Why: Removing photos changes the room they take. How: This reads the sizes again.


	};



	return (


		<section
			className={ cssModObj.stoSetSec }

			aria-labelledby='stoSetHea'
		>{ /* What: Storage Settings Section Element. Why: The chat photos kept on this device are the device's own to manage (Section 22). How: This holds the heading, the sizes, the choice, and the clean-up. */ }


			<h3
				id='stoSetHea'

				className={ cssModObj.stoTitHea }
			>Storage on this device</h3>{ /* What: Storage Title Heading Element. Why: The part needs a heading saying it's about this device's storage. How: This names it. */ }

			<p className={ cssModObj.stoNotPar }>{ sizRecObj === null ? 'Checking how much room chat photos take…' : `${ sizRecObj.couNum === 0 ? 'No chat photos are kept on this device.' : `${ sizRecObj.couNum === 1 ? '1 chat photo takes' : `${ sizRecObj.couNum.toLocaleString( 'en-US' ) } chat photos take` } up ${ sizTexFun( sizRecObj.bytNum ) } on this device.` }${ sizRecObj.quoNum > 0 ? ` Come Hang uses ${ sizTexFun( sizRecObj.usaNum ) } of the ${ sizTexFun( sizRecObj.quoNum ) } your browser allows it.` : '' }` }</p>{ /* What: Storage Note Paragraph Element. Why: A member deciding what to keep should see what the photos take, and the browser's room where it says. How: This counts the photos and their size, then the app's use of the browser's quota, or says it's checking. */ }



			<fieldset className={ cssModObj.stoChoFie }>{ /* What: Storage Choice Fieldset Element. Why: The spans answer one question. How: This groups them under its legend. */ }


				<legend className={ cssModObj.stoChoLeg }>Keep chat photos</legend>{ /* What: Storage Choice Legend Element. Why: The choices need a shared name. How: This names them. */ }



				{ KEP_OPT_ARR.map( ( optValObj ) => ( // What: Keep Option Map. Why: Each span is a choice. How: This renders a row per span.


					<label
						key={ optValObj.keyStr }

						className={ cssModObj.stoChoLab }
					>{ /* What: Storage Choice Label Element. Why: The whole row picks its span, a bigger target than the circle alone. How: This holds the circle and its name. */ }


						<input
							className={ cssModObj.stoChoInp }

							name='kepPhoRad'

							checked={ kepKeyStr === optValObj.keyStr }
							type='radio'
							value={ optValObj.keyStr }

							onChange={ () => void kepChaFun( optValObj.keyStr ) } // What: Keep Change Handler. Why: A span applies at once and stays on this device. How: This keeps it and clears what it no longer keeps.
						/>{ /* What: Storage Choice Input Element. Why: A circle shows the chosen span. How: This draws it, checked for the kept span. */ }

						{ optValObj.labStr }{ /* What: Choice Name Text. Why: The circle needs its span's name beside it, which also names it for a screen reader. How: This prints the row's label. */ }


					</label>


				) ) }


			</fieldset>



			<p className={ cssModObj.stoNotPar }>Photos older than this are removed from this device as the app opens. Their messages stay in the chat.</p>{ /* What: Storage Note Paragraph Element. Why: A member should know when the choice applies and that it spares the messages. How: This says so. */ }



			{ conAskBoo ? ( // What: Confirmation Check. Why: Removing photos is confirmed first, in the clean-up's place. How: This shows the question and its answers, or the clean-up.


				<div className={ cssModObj.stoConDiv }>{ /* What: Storage Confirm Div Element. Why: The question reads above its answers. How: This stacks them. */ }


					<p className={ cssModObj.conAskPar }>{ `Remove ${ remOptObj.ageStr } from this device? Their messages stay in the chat.` }</p>{ /* What: Confirm Ask Paragraph Element. Why: The member should know what goes and what stays before confirming. How: This asks, naming the age picked. */ }

					<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The two answers sit together. How: This holds them in a row that wraps. */ }


						<button
							className={ cssModObj.actDanBut }

							type='button'

							onClick={ () => void remRunFun() }
						>{ actKinStr === 'remove-photos' ? 'Removing…' : 'Remove them' }</button>{ /* What: Action Danger Button Element. Why: Removing photos can't be undone, so it looks it, and its label shows while it works. How: This removes the photos. */ }

						<button
							ref={ keeButRef }

							className={ cssModObj.actPlaBut }

							type='button'

							onClick={ () => { if ( actKinStr !== 'remove-photos' ) { focRetRef.current = true; setConAskBoo( false ); } } } // What: Keep Handler. Why: The member can change their mind until the clean-up starts. How: This owes "Remove chat photos" focus and closes the confirmation unless the clean-up is running.
						>Keep them</button>{ /* What: Action Plain Button Element. Why: Keeping the photos is as easy as removing them. How: This closes the confirmation. */ }


					</div>


				</div>


			) : ( // What: Clean-Up Branch. Why: Without a confirmation showing, the clean-up offers its ages. How: This shows them and "Remove chat photos".


				<>{ /* What: Clean-Up Fragment. Why: The ages and their button belong to the part together. How: This groups them without adding an element. */ }


					<fieldset className={ cssModObj.stoChoFie }>{ /* What: Storage Choice Fieldset Element. Why: The ages answer one question. How: This groups them under its legend. */ }


						<legend className={ cssModObj.stoChoLeg }>Remove chat photos now</legend>{ /* What: Storage Choice Legend Element. Why: The ages need a shared name. How: This names them. */ }



						{ REM_OPT_ARR.map( ( optValObj ) => ( // What: Remove Option Map. Why: Each age is a choice. How: This renders a row per age.


							<label
								key={ optValObj.keyStr }

								className={ cssModObj.stoChoLab }
							>{ /* What: Storage Choice Label Element. Why: The whole row picks its age. How: This holds the circle and its name. */ }


								<input
									className={ cssModObj.stoChoInp }

									name='remPhoRad'

									checked={ remKeyStr === optValObj.keyStr }
									type='radio'
									value={ optValObj.keyStr }

									onChange={ () => setRemKeyStr( optValObj.keyStr ) }
								/>{ /* What: Storage Choice Input Element. Why: A circle shows the age picked. How: This draws it, checked for the one picked. */ }

								{ optValObj.labStr }{ /* What: Choice Name Text. Why: The circle needs its age's name beside it, which also names it for a screen reader. How: This prints the row's label. */ }


							</label>


						) ) }


					</fieldset>



					<div className={ cssModObj.endActDiv }>{ /* What: End Actions Div Element. Why: The clean-up's button sits below its ages. How: This holds it in a row that wraps. */ }


						<button
							ref={ remButRef }

							className={ cssModObj.actPlaBut }

							type='button'

							onClick={ () => setConAskBoo( true ) }
						>Remove chat photos</button>{ /* What: Action Plain Button Element. Why: A clean-up can't be undone, so it asks first. How: This opens the confirmation. */ }


					</div>


				</>


			) }


		</section>


	);


}

// #endregion StoSetCom

// #endregion Components



// #region Exports

export { StoSetCom }; // What: Named Export. Why: Settings holds the storage part. How: This exports it.

// #endregion Exports


