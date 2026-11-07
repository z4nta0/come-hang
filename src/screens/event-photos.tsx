


// #region Imports

import cssModObj from './event-photos.module.css'; // What: CSS Module Object. Why: The photos part is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';        // What: Button Base Component. Why: Adding photos is the part's main action. How: This draws its button.
import { imaTypFun    } from '../platform/image.ts';    // What: Image Type Function. Why: A shared photo's bytes carry no type. How: This reads it from their first bytes.
import { mesTimFun    } from '../utils/date.ts';        // What: Message Time Function. Why: The viewer says when a photo was shared. How: This labels the time briefly.
import { phoAddFun    } from '../state/photos.ts';      // What: Photo Add Function. Why: A member shares photos from the event. How: This shrinks, encrypts, and shares one.
import { phoDelFun    } from '../state/photos.ts';      // What: Photo Delete Function. Why: The uploader or owner takes a photo down. How: This deletes it.
import { phoFluFun    } from '../state/photos.ts';      // What: Photos Flush Function. Why: Leaving the photos means the member is done adding them. How: This ends the burst, posting its chat line.
import { phoGetFun    } from '../state/photos.ts';      // What: Photo Get Function. Why: The viewer shows the full photo. How: This downloads and decrypts it.
import { phoWatFun    } from '../state/photos.ts';      // What: Photos Watch Function. Why: The grid fills in as members share. How: This watches the event's photos.
import { redMotFun    } from '../utils/motion.ts';      // What: Reduced Motion Function. Why: A jump to the photos scrolls smoothly unless the member asked for less motion. How: This reads the preference.
import { SheDiaCom    } from '../ui/sheet.tsx';         // What: Sheet Dialog Component. Why: A tapped photo opens over the page. How: This draws the viewer's sheet.
import { useEffect    } from 'react';                   // What: Use Effect. Why: The photos are watched while shown, and a full photo loads as it's opened. How: This starts and stops each.
import { useRef       } from 'react';                   // What: Use Reference. Why: The viewer opens through its handle, and Add photos opens the file picker. How: This holds both.
import { useState     } from 'react';                   // What: Use State. Why: The photos, uploads, the open photo, and the messages change as the member acts. How: This holds each.


import type { EveRecTyp } from '../state/events.ts';  // What: Event Record Type. Why: The part belongs to one event. How: This types it.
import type { MemRecTyp } from '../state/members.ts'; // What: Member Record Type. Why: The viewer names who shared each photo. How: This types the members.
import type { PhoRecTyp } from '../state/photos.ts';  // What: Photo Record Type. Why: The grid and the viewer show photo records. How: This types them.
import type { SheHanTyp } from '../ui/sheet.tsx';     // What: Sheet Handle Type. Why: A thumbnail opens the viewer. How: This types its handle.

// #endregion Imports



/**
 * event-photos.tsx = Event Photos Part
 *
 * @summary
 * The Photos part of an event's details (ARCHITECTURE.md Section 20): a
 * heading, the event's photos as a grid of thumbnails that fills in as
 * members share them, and Add photos, which opens the device's photo picker
 * once the event has started. Each picked photo is shrunk, encrypted, and
 * shared in turn, the status saying how many were added and the alert why
 * one wasn't. A thumbnail opens a viewer sheet showing the full photo, who
 * shared it and when, the previous and next photos, Save to device, and,
 * for the member who shared it or the group's owner, Delete after a
 * confirmation. Save all hands every photo to the device at once. Leaving
 * the part ends the member's burst of uploads, so the chat hears of them.
 *
 * Sections:
 *  - Helpers
 *  - Hooks
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region errMesFun

/**
 * errMesFun = Error Message Function
 *
 * @summary
 * Words a failed share for the alert: a file the browser couldn't open or
 * shrink, a share the rules refused because the event is full or the member
 * has added their share, or anything else, which asks to try again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param errCatObj - Error Caught Object: What the share rejected with.
 *
 * @returns The alert's text.
 *
 * @example
 * ```ts
 * errMesFun(new RangeError()) // => "One of those files couldn't be..."
 * ```
 *
*/

const errMesFun = ( errCatObj : unknown ) : string => { // What: Error Message Function. Why: A share that fails should say why. How: This picks the alert's words by what failed.


	if ( errCatObj instanceof RangeError ) return "One of those files couldn't be opened as a photo."; // What: Unopened Return. Why: A format the browser can't show, or a photo it can't shrink, can't be shared. How: This says so.



	if ( Reflect.get( Object( errCatObj ), 'code' ) === 'permission-denied' ) return "No more photos fit. An event holds 100 photos and each person can add 30, or 300 and 60 when the group's owner has the upgrade."; // What: Full Return. Why: The rules refuse a photo past either cap. How: This gives both caps for both plans.



	return "A photo couldn't be shared. Check your connection and try again."; // What: Other Return. Why: Anything else is most likely the connection. How: This asks to try again.


};

// #endregion errMesFun



// #region savFilFun

/**
 * savFilFun = Save Files Function
 *
 * @summary
 * Hands photos to the device: through the share sheet where the browser can
 * share files, which on a phone saves them to its photo library, and as
 * downloads otherwise. A share the member backs out of is no error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: Each photo's bytes.
 *
 * @returns A promise that settles once the photos are handed over, with no
 *          value.
 *
 * @example
 * ```ts
 * savFilFun([fulBytArr]) // => Promise<void>
 * ```
 *
*/

const savFilFun = async ( bytValArr : Uint8Array< ArrayBuffer >[] ) : Promise< void > => { // What: Save Files Function. Why: Photos leave the server with their event, so members keep them on their own device. How: This shares them as files, or downloads them.


	const filValArr = bytValArr.map( ( bytValObj, filIndNum ) => new File( [ bytValObj ], `come-hang-photo-${ filIndNum + 1 }.${ imaTypFun( bytValObj ) === 'image/jpeg' ? 'jpg' : 'webp' }`, { type : imaTypFun( bytValObj ) } ) ); // What: File Value Array. Why: Each photo is saved as a typed file with a plain name. How: This wraps each photo's bytes, numbered in order.



	if ( navigator.canShare?.( { files : filValArr } ) ) { // What: Share Check. Why: A phone saves shared photos to its library. How: This shares them where the browser can share files.


		await navigator.share( { files : filValArr } ).catch( ( errCatObj : unknown ) => { if ( Reflect.get( Object( errCatObj ), 'name' ) !== 'AbortError' ) throw errCatObj; } ); // What: Share Call. Why: Backing out of the share sheet isn't a failure. How: This shares the files, ignoring a cancel.


		return; // What: Shared Return. Why: The share sheet saved them. How: This returns.


	}



	for ( const filValObj of filValArr ) { // What: Download Loop. Why: A browser that can't share files downloads them. How: This downloads each.


		const ancEleObj = document.createElement( 'a' );       // What: Anchor Element Object. Why: A download starts from a link. How: This makes one off the page.
		const objUrlStr = URL.createObjectURL( filValObj );    // What: Object URL String. Why: The link needs an address for the file. How: This makes a temporary one.


		ancEleObj.download = filValObj.name; // What: Download Assignment. Why: The file keeps its name. How: This names it.
		ancEleObj.href     = objUrlStr;      // What: Address Assignment. Why: The link points at the file. How: This sets its address.


		ancEleObj.click(); // What: Download Click Call. Why: The download starts as if the link were tapped. How: This clicks it.


		window.setTimeout( () => URL.revokeObjectURL( objUrlStr ), 60000 ); // What: Address Free Call. Why: The download needs the address a little while. How: This frees it a minute later.


	}


};

// #endregion savFilFun

// #endregion Helpers



// #region Hooks

// #region useBytUrlFun

/**
 * useBytUrlFun = Use Bytes URL Function
 *
 * @summary
 * Turns a photo's bytes into a temporary address an image can show, typed
 * from its first bytes, freeing the address when the bytes change or the
 * caller goes. Returns null while there are no bytes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: The photo's bytes, or null.
 *
 * @returns The address, or null.
 *
 * @example
 * ```ts
 * useBytUrlFun(thuBytArr) // => 'blob:...'
 * ```
 *
*/

const useBytUrlFun = ( bytValArr : Uint8Array< ArrayBuffer > | null ) : string | null => { // What: Use Bytes URL Function. Why: An image shows a photo by address. How: This makes and frees a temporary address for the bytes.


	const [ urlValStr, setUrlValStr ] = useState< string | null >( null ); // What: URL Value String And Setter. Why: The image reads the address once it's made. How: This holds it, null without bytes.



	useEffect( () => { // What: Address Effect. Why: Each set of bytes needs its own address, freed once it's done. How: This makes one for the bytes and frees it on cleanup.


		if ( bytValArr === null ) { setUrlValStr( null ); return; } // What: Empty Guard. Why: No bytes means no address. How: This clears it and returns.



		const objUrlStr = URL.createObjectURL( new Blob( [ bytValArr ], { type : imaTypFun( bytValArr ) } ) ); // What: Object URL String. Why: The image needs an address for the photo. How: This makes one, typed from the bytes.


		setUrlValStr( objUrlStr ); // What: Address Set Call. Why: The image shows the new address. How: This keeps it.



		return () => URL.revokeObjectURL( objUrlStr ); // What: Cleanup Return. Why: An address holds its photo in memory until it's freed. How: This frees it.


	}, [ bytValArr ] ); // What: Effect Dependency Array. Why: New bytes need a new address. How: bytValArr changes with the photo.



	return urlValStr; // What: Address Return. Why: The caller shows the photo. How: This returns the address.


};

// #endregion useBytUrlFun

// #endregion Hooks



// #region Components

type PtcProTyp = { bytValArr : Uint8Array< ArrayBuffer > | null }; // What: Photo Thumbnail Component Props Type. Why: A thumbnail shows its decrypted bytes. How: This types PhoThuCom's props.

// #region PhoThuCom

/**
 * PhoThuCom = Photo Thumbnail Component
 *
 * @summary
 * Renders one thumbnail filling its tile, from its bytes, or nothing while
 * there are none, as for a thumbnail that won't decrypt. The image is
 * decorative, since its button names the photo.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.bytValArr - Bytes Value Array: The thumbnail's bytes, or
 *                          null.
 *
 * @returns The thumbnail, or nothing.
 *
 * @example
 * ```tsx
 * PhoThuCom({ bytValArr }) // => <PhoThuCom />
 * ```
 *
*/

function PhoThuCom ( { bytValArr } : PtcProTyp ) : React.JSX.Element | null {


	const urlValStr = useBytUrlFun( bytValArr ); // What: URL Value String. Why: The image shows the thumbnail by address. How: This makes one for the bytes.



	return urlValStr === null ? null : <img className={ cssModObj.phoThuIma } alt='' src={ urlValStr } />; // What: Thumbnail Return. Why: A thumbnail without bytes leaves its tile plain. How: This returns the image, or nothing.


}

// #endregion PhoThuCom



type EpcProTyp = { eveRecObj : EveRecTyp, groIdeStr : string, jumBoo : boolean, memRecMap : Map< string, MemRecTyp >, ownBoo : boolean, uidValStr : string, varStr : 'pan' | 'she' }; // What: Event Photos Component Props Type. Why: The part shows one event's photos, names who shared them, lets the uploader or owner delete one, and can open scrolled into view, in the sheet or the panel. How: This types EvePhoCom's props.

// #region EvePhoCom

/**
 * EvePhoCom = Event Photos Component
 *
 * @summary
 * Renders an event's Photos part, watching its photos while shown. Add
 * photos shows once the event has started, and shares each picked photo in
 * turn, stopping at the first the rules refuse as over a cap. A thumbnail
 * opens the viewer, which loads the full photo, steps to the previous and
 * next, saves the photo, and deletes it for its uploader or the owner after
 * a confirmation. The part's status and alert announce the uploads, and the
 * viewer's own announce what happens inside it, since the part behind the
 * viewer is inert while it's open. The variant keeps the viewer's IDs unique
 * when the sheet and the panel both hold the part. Asked to jump, it scrolls
 * itself into view as it opens. Leaving the part ends the member's burst of
 * uploads.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.eveRecObj - Event Record Object: The event.
 * @param props.groIdeStr - Group Identifier String: The event's group.
 * @param props.jumBoo    - Jump Boolean: Whether the part scrolls into view
 *                          as it opens, as from a chat line about photos.
 * @param props.memRecMap - Member Record Map: The group's members, by UID.
 * @param props.ownBoo    - Owner Boolean: Whether the member owns the
 *                          group.
 * @param props.uidValStr - UID Value String: This member's UID.
 * @param props.varStr    - Variant String: Where the part sits, pan for the
 *                          panel or she for the sheet.
 *
 * @returns The part.
 *
 * @example
 * ```tsx
 * EvePhoCom({ eveRecObj, groIdeStr, ..., varStr }) // => <EvePhoCom />
 * ```
 *
*/

function EvePhoCom ( { eveRecObj, groIdeStr, jumBoo, memRecMap, ownBoo, uidValStr, varStr } : EpcProTyp ) : React.JSX.Element {


	const filInpRef = useRef< HTMLInputElement >( null ); // What: File Input Reference. Why: Add photos opens the hidden file picker. How: This holds it.
	const secEleRef = useRef< HTMLElement >( null );      // What: Section Element Reference. Why: A jump scrolls the part into view. How: This holds its section.
	const vieHanRef = useRef< SheHanTyp >( null );        // What: Viewer Handle Reference. Why: A thumbnail opens the viewer, and a delete closes it. How: This holds its handle.

	const [ addCouNum, setAddCouNum ] = useState( 0 );                                            // What: Add Count Number And Setter. Why: The status says how many photos are on their way. How: This holds the count.
	const [ delConBoo, setDelConBoo ] = useState( false );                                        // What: Delete Confirm Boolean And Setter. Why: Deleting a photo asks first. How: This is true while the confirmation shows.
	const [ errMesStr, setErrMesStr ] = useState( '' );                                           // What: Error Message String And Setter. Why: A share that fails is announced. How: This holds the alert's text.
	const [ fulBytArr, setFulBytArr ] = useState< Uint8Array< ArrayBuffer > | null >( null );     // What: Full Bytes Array And Setter. Why: The viewer shows the full photo once it's loaded. How: This holds its bytes, null until then.
	const [ fulErrBoo, setFulErrBoo ] = useState( false );                                        // What: Full Error Boolean And Setter. Why: A full photo still on its way says so. How: This is true when it couldn't load.
	const [ lisErrBoo, setLisErrBoo ] = useState( false );                                        // What: List Error Boolean And Setter. Why: Photos that can't load say so. How: This is true once the watch fails.
	const [ phoRecArr, setPhoRecArr ] = useState< PhoRecTyp[] | null >( null );                   // What: Photo Record Array And Setter. Why: The grid shows each photo. How: This holds them, null until the first report.
	const [ staMesStr, setStaMesStr ] = useState( '' );                                           // What: Status Message String And Setter. Why: Shared photos are announced. How: This holds the status's text.
	const [ vieErrStr, setVieErrStr ] = useState( '' );                                           // What: Viewer Error String And Setter. Why: A failed delete or save is announced inside the viewer. How: This holds its alert's text.
	const [ vieIdeStr, setVieIdeStr ] = useState( '' );                                           // What: Viewer Identifier String And Setter. Why: The viewer follows one photo, even as others come and go. How: This holds its ID, empty when none is open.
	const [ vieStaStr, setVieStaStr ] = useState( '' );                                           // What: Viewer Status String And Setter. Why: A save is announced inside the viewer. How: This holds its status's text.


	const staOpeBoo = eveRecObj.staTimNum <= Date.now();                                                   // What: Started Open Boolean. Why: Photos open once the event starts (Section 20). How: This compares its start with now.
	const vieIndNum = phoRecArr?.findIndex( ( phoRecObj ) => phoRecObj.phoIdeStr === vieIdeStr ) ?? -1;   // What: Viewer Index Number. Why: The viewer's place in the photos picks its title and neighbors. How: This finds the open photo, -1 when none is.
	const vieRecObj = vieIndNum >= 0 ? phoRecArr![ vieIndNum ] : null;                                     // What: Viewer Record Object. Why: The viewer shows the open photo. How: This reads it, null when none is open. // What: Non-Null Note. Why: An index of 0 or more was found in the photos. How: The ! reads them as present.

	const vieUrlStr = useBytUrlFun( fulBytArr ?? vieRecObj?.thuBytArr ?? null ); // What: Viewer URL String. Why: The viewer shows the thumbnail until the full photo arrives. How: This makes an address for whichever it has.



	useEffect( () => phoWatFun( groIdeStr, eveRecObj.eveIdeStr, setPhoRecArr, ( errCatObj ) => { console.warn( errCatObj ); setLisErrBoo( true ); } ), [ eveRecObj.eveIdeStr, groIdeStr ] ); // What: Photos Watch Effect. Why: Every member's photos show while the part is open. How: This watches them, logs and shows a failure, and stops the watch when the part goes. // What: Effect Dependency Note. Why: The watch belongs to one event of one group. How: eveRecObj.eveIdeStr and groIdeStr name it.



	useEffect( () => { // What: Jump Effect. Why: A chat line about photos opens its event at them. How: This scrolls the part to the top of its sheet a frame after it opens, smoothly unless the member asked for less motion.


		if ( !jumBoo ) return; // What: Stay Guard. Why: An event opened from its card starts at its top. How: This returns.



		const fraIdeNum = requestAnimationFrame( () => secEleRef.current?.scrollIntoView( { behavior : redMotFun() ? 'instant' : 'smooth', block : 'start' } ) ); // What: Frame Identifier Number. Why: The sheet has to have laid out before it can scroll. How: This scrolls on the next frame, keeping the request to cancel it.



		return () => cancelAnimationFrame( fraIdeNum ); // What: Cleanup Return. Why: A part gone before the frame mustn't scroll. How: This cancels the request.


	}, [ jumBoo ] ); // What: Effect Dependency Array. Why: The jump happens as the part opens asked to. How: jumBoo changes with the ask.



	useEffect( () => () => phoFluFun(), [] ); // What: Leave Flush Effect. Why: Leaving the photos means the member is done adding them, so the chat hears now. How: This ends the bursts when the part goes. // What: Effect Dependency Note. Why: It runs only as the part leaves. How: The empty array keeps it to the cleanup.



	useEffect( () => { // What: Full Load Effect. Why: The viewer shows the full photo, which loads as it's opened. How: This downloads and decrypts it, dropping an answer that arrives after another photo opened.


		let actValBoo = true; // What: Active Value Boolean. Why: A photo that loads after another opened mustn't replace it. How: This is true until the cleanup runs.


		setFulBytArr( null ); // What: Full Clear Call. Why: The last photo shouldn't show under a new one. How: This clears it.

		setFulErrBoo( false ); // What: Error Clear Call. Why: A new photo starts without the last one's failure. How: This clears it.


		if ( vieRecObj !== null ) phoGetFun( groIdeStr, eveRecObj.eveIdeStr, vieRecObj ).then( ( bytValArr ) => { if ( actValBoo ) setFulBytArr( bytValArr ); }, ( errCatObj : unknown ) => { console.warn( errCatObj ); if ( actValBoo ) setFulErrBoo( true ); } ); // What: Full Read Call. Why: The full photo replaces its thumbnail once it's in. How: This loads it, logging a failure and saying so.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A late answer belongs to a photo no longer open. How: This marks the effect inactive.


	// eslint-disable-next-line react-hooks/exhaustive-deps -- What: Deliberate Dependency Narrowing. Why: The full photo belongs to the open photo alone, and its record is rebuilt with every report. How: Only the photo's ID re-runs the load.
	}, [ vieRecObj?.phoIdeStr ] ); // What: Effect Dependency Array. Why: The full photo is loaded again only when another photo opens. How: vieRecObj's ID changes with the open photo.



	// #region addFilFun

	/**
	 * addFilFun = Add Files Function
	 *
	 * @summary
	 * Shares the picked photos one at a time, in the order picked, counting
	 * them on their way. Once done, the status says how many were added, and
	 * the alert says why one wasn't, stopping at the first the rules refuse,
	 * since every later one would be refused too.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param filValArr - File Value Array: The picked photos.
	 *
	 * @returns A promise that settles once every photo is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * addFilFun([filValObj]) // => Promise<void>
	 * ```
	 *
	*/

	const addFilFun = async ( filValArr : File[] ) : Promise< void > => { // What: Add Files Function. Why: A member shares several photos at once. How: This shares each in turn and announces how it went.


		let errValStr = ''; // What: Error Value String. Why: The first failure is announced. How: This holds its words, empty while none failed.
		let sucCouNum = 0;  // What: Success Count Number. Why: The status says how many landed. How: This counts them.


		setErrMesStr( '' ); // What: Error Clear Call. Why: A new batch starts without the last one's failure. How: This clears the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The status speaks again once this batch is done. How: This clears it.

		setAddCouNum( ( preCouNum ) => preCouNum + filValArr.length ); // What: Count Raise Call. Why: The status says how many are on their way. How: This adds the batch.


		for ( const filValObj of filValArr ) { // What: Share Loop. Why: Photos are shared one at a time, so a phone's memory holds one at a time. How: This shares each in turn.


			try { // What: Share Attempt. Why: One photo that fails shouldn't hide the rest. How: This shares it inside a try.


				await phoAddFun( groIdeStr, eveRecObj.eveIdeStr, eveRecObj.titTexStr, filValObj ); // What: Share Call. Why: The photo joins the event. How: This shrinks, encrypts, and shares it.


				sucCouNum += 1; // What: Success Count Assignment. Why: The status counts it. How: This adds one.


			}

			catch ( errCatObj ) { // What: Share Catch. Why: A failed photo is told, and the rest carry on. How: This logs it and keeps the first failure's words.


				console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

				errValStr = errValStr || errMesFun( errCatObj ); // What: Error Value Assignment. Why: The first failure says why. How: This keeps its words.


			}

			finally { setAddCouNum( ( preCouNum ) => preCouNum - 1 ); } // What: Count Lower Call. Why: This photo is no longer on its way. How: This lowers the count.



			if ( errValStr !== '' && errValStr === errMesFun( { code : 'permission-denied' } ) ) break; // What: Full Break. Why: Once a cap is reached, every later photo would be refused too. How: This stops the batch.


		}



		if ( sucCouNum > 0 ) setStaMesStr( sucCouNum === 1 ? 'Added a photo.' : `Added ${ sucCouNum } photos.` ); // What: Status Set Call. Why: Shared photos are announced, since the grid changes silently. How: This says how many.

		setErrMesStr( errValStr ); // What: Error Set Call. Why: A failure is told at once. How: This sets the alert, empty when none failed.


	};

	// #endregion addFilFun



	// #region delPhoFun

	/**
	 * delPhoFun = Delete Photo Function
	 *
	 * @summary
	 * Deletes the open photo for everyone and closes the viewer, announcing
	 * it in the part's status, or announces a failure inside the viewer,
	 * keeping it open.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the delete is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * delPhoFun() // => Promise<void>
	 * ```
	 *
	*/

	const delPhoFun = async () : Promise< void > => { // What: Delete Photo Function. Why: The uploader or owner takes a photo down. How: This deletes it and closes the viewer, or says it failed.


		if ( vieRecObj === null ) return; // What: Closed Guard. Why: Only an open photo is deleted. How: This returns.



		try { // What: Delete Attempt. Why: A failed delete should say so. How: This deletes inside a try.


			await phoDelFun( groIdeStr, eveRecObj.eveIdeStr, vieRecObj.phoIdeStr ); // What: Delete Call. Why: The photo goes for everyone. How: This deletes it.


			setStaMesStr( 'Deleted the photo.' ); // What: Status Set Call. Why: The grid changes silently. How: This announces the delete.

			vieHanRef.current?.cloFun(); // What: Viewer Close Call. Why: A deleted photo has nothing left to show. How: This closes the viewer.


		}

		catch ( errCatObj ) { // What: Delete Catch. Why: A failed delete has to be told. How: This logs it and announces it inside the viewer.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setVieErrStr( "The photo couldn't be deleted. Check your connection and try again." ); // What: Error Set Call. Why: A failed delete is told inside the viewer. How: This sets its alert.


		}


	};

	// #endregion delPhoFun



	// #region savAllFun

	/**
	 * savAllFun = Save All Function
	 *
	 * @summary
	 * Loads every photo's full image and hands them all to the device at
	 * once, announcing a failure in the part's alert.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the photos are handed over, with
	 *          no value.
	 *
	 * @example
	 * ```ts
	 * savAllFun() // => Promise<void>
	 * ```
	 *
	*/

	const savAllFun = async () : Promise< void > => { // What: Save All Function. Why: A member keeps every photo of the event before it's deleted. How: This loads each and saves them together.


		setErrMesStr( '' ); // What: Error Clear Call. Why: A new save starts without an old failure. How: This clears the alert.



		try { // What: Save Attempt. Why: A failed save should say so. How: This saves inside a try.


			await savFilFun( await Promise.all( ( phoRecArr ?? [] ).map( ( phoRecObj ) => phoGetFun( groIdeStr, eveRecObj.eveIdeStr, phoRecObj ) ) ) ); // What: Save Call. Why: Every photo is saved together. How: This loads each full photo, then saves them.


		}

		catch ( errCatObj ) { // What: Save Catch. Why: A failed save has to be told. How: This logs it and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( "The photos couldn't be saved. Some may still be on their way, so try again in a moment." ); // What: Error Set Call. Why: A failed save is told at once. How: This sets the alert.


		}


	};

	// #endregion savAllFun



	const opeVieFun = ( phoIdeStr : string ) : void => { setDelConBoo( false ); setVieErrStr( '' ); setVieStaStr( '' ); setVieIdeStr( phoIdeStr ); vieHanRef.current?.opeFun(); }; // What: Open Viewer Function. Why: A thumbnail opens its photo with nothing left from the last one. How: This resets the viewer, picks the photo, and opens the sheet.



	const vieNamFun = ( phoRecObj : PhoRecTyp ) : string => phoRecObj.uplUidStr === uidValStr ? 'you' : memRecMap.get( phoRecObj.uplUidStr )?.namTexStr || ( memRecMap.has( phoRecObj.uplUidStr ) ? 'someone' : 'a former member' ); // What: Viewer Name Function. Why: A photo names who shared it, even someone with no name yet or who left. How: This returns "you", their name, or a stand-in.



	return (


		<section
			ref={ secEleRef }

			className={ cssModObj.evePhoSec }

			aria-labelledby={ `phoParHea--${ varStr }` }
		>{ /* What: Event Photos Section Element. Why: The photos are their own part of the event's details. How: This stacks the heading and actions, the grid, and the messages. */ }


			<div className={ cssModObj.phoTopDiv }>{ /* What: Photos Top Div Element. Why: The heading and its actions read as one line. How: This lays them in a row, wrapping onto a second line where they run out of room. */ }


				<h3
					id={ `phoParHea--${ varStr }` }

					className={ cssModObj.phoParHea }
				>Photos</h3>{ /* What: Photos Part Heading Element. Why: The part needs a heading a screen reader can find. How: This names it. */ }



				{ staOpeBoo && ( // What: Add Check. Why: Photos open once the event starts. How: This offers Add photos then.


					<ButBasCom onClick={ () => filInpRef.current?.click() }>Add photos</ButBasCom> // What: Photos Add Button Component. Why: A member shares photos from the event once it has started. How: This opens the device's photo picker.


				) }



				{ phoRecArr !== null && phoRecArr.length > 0 && ( // What: Save All Check. Why: There's nothing to save until there are photos. How: This offers Save all once there are some.


					<button
						className={ cssModObj.phoSavBut }

						type='button'

						onClick={ () => void savAllFun() }
					>Save all</button> // What: Photos Save Button Element. Why: Photos leave the server with the event, so members keep them. How: This saves every photo to the device.


				) }


			</div>



			<input
				ref={ filInpRef }

				className={ cssModObj.phoFilInp }

				accept='image/*'
				multiple
				type='file'

				aria-hidden='true'
				tabIndex={ -1 }

				onChange={ ( chaEveObj ) => { const filValArr = [ ...chaEveObj.target.files ?? [] ]; chaEveObj.target.value = ''; if ( filValArr.length > 0 ) void addFilFun( filValArr ); } } // What: Pick Change Handler. Why: The picked photos are shared, and picking the same ones again should still work. How: This copies the files, empties the picker, and shares them.
			/>{ /* What: Photos File Input Element. Why: The device's own picker chooses photos, and Add photos stands in for its plain look. How: This is hidden from sight, screen readers, and the Tab order. */ }



			{ phoRecArr === null || phoRecArr.length === 0 ? ( // What: Grid Empty Check. Why: An empty space would read as broken. How: This says the photos are loading, couldn't load, or that there are none, or else shows the grid.


				<p className={ cssModObj.phoNotPar }>{ phoRecArr !== null ? ( staOpeBoo ? 'No photos yet.' : 'Photos open once the event starts.' ) : lisErrBoo ? "The photos couldn't load." : 'Loading photos…' }</p> // What: Photos Note Paragraph Element. Why: The grid's state should be said. How: This shows the note that fits.


			) : ( // What: Grid Branch. Why: Photos to show get their tiles. How: This shows the grid.


				<ul className={ cssModObj.phoGriUno }>{ /* What: Photos Grid Unordered List Element. Why: The photos read as one list. How: This lays them three to a row, a short last row centered. */ }


					{ phoRecArr.map( ( phoRecObj, phoIndNum ) => ( // What: Thumbnail Map. Why: Each photo gets its own tile. How: This renders one per photo.


						<li
							key={ phoRecObj.phoIdeStr }

							className={ cssModObj.phoTilIte }
						>{ /* What: Photo Tile Item Element. Why: Each photo is one entry in the grid. How: This holds its button. */ }


							<button
								className={ cssModObj.phoTilBut }

								type='button'

								aria-haspopup='dialog'
								aria-label={ `Photo ${ phoIndNum + 1 }, shared by ${ vieNamFun( phoRecObj ) }` }

								onClick={ () => opeVieFun( phoRecObj.phoIdeStr ) }
							>{ /* What: Photo Tile Button Element. Why: A photo opens in the viewer, and a screen reader hears whose it is. How: This fills the tile with the thumbnail and opens the viewer. */ }


								<PhoThuCom bytValArr={ phoRecObj.thuBytArr } />{ /* What: Photo Thumbnail Component. Why: The tile shows the photo. How: This draws its thumbnail. */ }


							</button>


						</li>


					) ) }


				</ul>


			) }



			<p
				className={ cssModObj.phoStaPar }

				role='status'
			>{ addCouNum > 0 ? `Adding ${ addCouNum === 1 ? 'a photo' : `${ addCouNum } photos` }…` : staMesStr }</p>{ /* What: Photos Status Paragraph Element. Why: Uploads take a moment and the grid changes silently. How: This says how many are on their way, then how many were added. */ }

			<p
				className={ cssModObj.phoErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Photos Error Paragraph Element. Why: A share or save that fails has to be told at once. How: This holds the alert, empty from the first render. */ }



			<SheDiaCom
				ref={ vieHanRef }

				ideStr={ `phoVieHea--${ varStr }` }
				titStr={ vieRecObj !== null && phoRecArr !== null ? `Photo ${ vieIndNum + 1 } of ${ phoRecArr.length }` : 'Photo' } // What: Viewer Title Note. Why: The viewer says where in the photos it is, and an empty title would be an empty heading while it's closed. How: This counts the open photo, or falls back to a general title.

				onCloFun={ () => setVieIdeStr( '' ) } // What: Viewer Close Handler. Why: A closed viewer follows no photo. How: This clears the open photo.
			>{ /* What: Photo Viewer Sheet Dialog Component. Why: A tapped thumbnail opens its photo over the page. How: This holds the photo, its details, and its actions, titled with its place among the photos. */ }


				{ vieRecObj !== null && ( // What: Open Photo Check. Why: The viewer shows a photo only once a thumbnail picked one. How: This shows it and its actions.


					<div className={ cssModObj.phoVieDiv }>{ /* What: Photo Viewer Div Element. Why: The photo, its line, and its actions read top to bottom. How: This stacks them. */ }


						<div className={ cssModObj.vieImaDiv }>{ /* What: Viewer Image Div Element. Why: The photo shows whole, however it's shaped. How: This frames it on a sunken tint. */ }


							{ vieUrlStr !== null && ( // What: Image Check. Why: A photo whose thumbnail won't decrypt has nothing to show until its full photo arrives. How: This shows whichever it has.


								<img
									className={ cssModObj.vieImaIma }

									alt={ `Photo shared by ${ vieNamFun( vieRecObj ) }` }
									src={ vieUrlStr }
								/> // What: Viewer Image Image Element. Why: The member sees the photo. How: This shows the full photo, or its thumbnail until then.


							) }


						</div>



						<p className={ cssModObj.vieMetPar }>{ vieRecObj.uplUidStr === uidValStr ? 'You shared this' : `Shared by ${ vieNamFun( vieRecObj ) }` } <span className={ cssModObj.vieTimSpa }>{ mesTimFun( vieRecObj.creTimNum, Date.now() ) }</span></p>{ /* What: Viewer Meta Paragraph Element. Why: A photo says who shared it and when. How: This names them, then the time in the muted color. */ }

						{ fulBytArr === null && <p className={ cssModObj.vieNotPar }>{ fulErrBoo ? 'The full photo is still on its way, so try again in a moment.' : 'Loading the full photo…' }</p> }{ /* What: Viewer Note Check. Why: The thumbnail stands in until the full photo arrives, which may still be uploading. How: This says it's loading, or still on its way. */ }



						<div className={ cssModObj.vieNavDiv }>{ /* What: Viewer Navigation Div Element. Why: Stepping through the photos is quicker than closing and reopening. How: This lays the two buttons side by side. */ }


							<button
								className={ cssModObj.viePlaBut }

								disabled={ vieIndNum === 0 }
								type='button'

								onClick={ () => { setDelConBoo( false ); setVieErrStr( '' ); setVieStaStr( '' ); setVieIdeStr( phoRecArr![ vieIndNum - 1 ].phoIdeStr ); } } // What: Previous Click Handler. Why: The viewer steps back with nothing left from this photo. How: This resets the viewer and opens the photo before. // What: Non-Null Note. Why: A photo is open, so the photos are in. How: The ! reads them as present.
							>Previous</button>{ /* What: Viewer Plain Button Element. Why: The member steps back through the photos. How: This opens the one before, off at the first. */ }

							<button
								className={ cssModObj.viePlaBut }

								disabled={ phoRecArr === null || vieIndNum === phoRecArr.length - 1 }
								type='button'

								onClick={ () => { setDelConBoo( false ); setVieErrStr( '' ); setVieStaStr( '' ); setVieIdeStr( phoRecArr![ vieIndNum + 1 ].phoIdeStr ); } } // What: Next Click Handler. Why: The viewer steps on with nothing left from this photo. How: This resets the viewer and opens the photo after. // What: Non-Null Note. Why: A photo is open, so the photos are in. How: The ! reads them as present.
							>Next</button>{ /* What: Viewer Plain Button Element. Why: The member steps on through the photos. How: This opens the one after, off at the last. */ }


						</div>



						<div className={ cssModObj.vieActDiv }>{ /* What: Viewer Actions Div Element. Why: Saving and deleting sit together below the photo. How: This lays them in one row, or the delete's confirmation in their place. */ }


							{ delConBoo ? ( // What: Confirm Check. Why: Deleting removes the photo for everyone, so it asks first. How: This shows the confirmation, or else the actions.


								<>{ /* What: Confirmation Fragment. Why: The question and its two answers replace the actions together. How: This groups them without adding an element. */ }


									<p className={ cssModObj.vieAskPar }>Delete this photo for everyone?</p>{ /* What: Viewer Ask Paragraph Element. Why: The member should know what deleting does. How: This asks. */ }

									<button
										className={ cssModObj.vieDanBut }

										type='button'

										onClick={ () => void delPhoFun() }
									>Yes, delete it</button>{ /* What: Viewer Danger Button Element. Why: Deleting is confirmed on purpose. How: This deletes the photo. */ }

									<button
										className={ cssModObj.viePlaBut }

										type='button'

										onClick={ () => setDelConBoo( false ) }
									>Keep it</button>{ /* What: Viewer Plain Button Element. Why: A member can change their mind. How: This hides the confirmation. */ }


								</>


							) : ( // What: Actions Branch. Why: Without a confirmation showing, the photo's actions show. How: This shows them.


								<>{ /* What: Actions Fragment. Why: Saving and, for the uploader or owner, deleting sit side by side. How: This groups them without adding an element. */ }


									<button
										className={ cssModObj.viePlaBut }

										disabled={ fulBytArr === null }
										type='button'

										onClick={ () => { setVieErrStr( '' ); savFilFun( [ fulBytArr! ] ).then( () => setVieStaStr( 'Saved the photo.' ), ( errCatObj : unknown ) => { console.warn( errCatObj ); setVieErrStr( "The photo couldn't be saved. Try again." ); } ); } } // What: Save Click Handler. Why: The member keeps the photo, and a failure should say so. How: This saves the full photo, announcing it or the failure. // What: Non-Null Note. Why: The button is off until the full photo has loaded. How: The ! reads it as present.
									>Save to device</button>{ /* What: Viewer Plain Button Element. Why: Photos leave the server with the event, so members keep the ones they want. How: This saves the full photo, off until it's loaded. */ }



									{ ( ownBoo || vieRecObj.uplUidStr === uidValStr ) && ( // What: Delete Check. Why: Only the member who shared a photo, or the group's owner, deletes it. How: This offers Delete to them.


										<button
											className={ cssModObj.viePlaBut }

											type='button'

											onClick={ () => setDelConBoo( true ) }
										>Delete</button> // What: Viewer Plain Button Element. Why: The uploader or owner takes a photo down. How: This asks to confirm first.


									) }


								</>


							) }


						</div>



						<p
							className={ cssModObj.vieStaPar }

							role='status'
						>{ vieStaStr }</p>{ /* What: Viewer Status Paragraph Element. Why: A save is announced inside the viewer, since the page behind it is inert. How: This holds the status, empty from the first render. */ }

						<p
							className={ cssModObj.vieErrPar }

							role='alert'
						>{ vieErrStr }</p>{ /* What: Viewer Error Paragraph Element. Why: A failed save or delete has to be told inside the viewer. How: This holds the alert, empty unless one failed. */ }


					</div>


				) }


			</SheDiaCom>


		</section>


	);


}

// #endregion EvePhoCom

// #endregion Components



// #region Exports

export { EvePhoCom }; // What: Named Export. Why: An event's details show its photos. How: This exports EvePhoCom.

// #endregion Exports


