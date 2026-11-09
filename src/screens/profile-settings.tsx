


// #region Imports

import cssModObj from './profile-settings.module.css'; // What: CSS Module Object. Why: The part is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { avaShrFun } from '../platform/image.ts';  // What: Avatar Shrink Function. Why: A picked photo is cropped and shrunk before it's previewed. How: This makes the profile photo.
import { ButBasCom } from '../ui/button.tsx';      // What: Button Base Component. Why: Saving the previewed photo is the part's main action. How: This draws its button.
import { imaTypFun } from '../platform/image.ts';  // What: Image Type Function. Why: The photo's address needs its type. How: This reads it from the bytes.
import { proDelFun } from '../state/avatars.ts';   // What: Profile Delete Function. Why: The member can go back to their initials. How: This removes every copy.
import { proSetFun } from '../state/avatars.ts';   // What: Profile Set Function. Why: The previewed photo is saved to every group. How: This stores each copy.
import { proSynFun } from '../state/avatars.ts';   // What: Profile Sync Function. Why: The part shows the member's photo, which every group should hold. How: This syncs it and reads it.
import { useEffect } from 'react';                 // What: Use Effect. Why: The photo is read as the part opens, and its address freed after. How: This runs each.
import { useRef    } from 'react';                 // What: Use Reference. Why: The file picker opens from a button, and focus moves as the buttons change. How: This holds the picker and the heading.
import { useState  } from 'react';                 // What: Use State. Why: The saved photo, a draft, and the group count change what shows. How: This holds each.


import type { SarRetTyp } from './settings-actions.ts'; // What: Settings Actions Return Type. Why: The part runs its changes through the section's runners. How: This types them.

// #endregion Imports



/**
 * profile-settings.tsx = Profile Settings
 *
 * @summary
 * The "Your profile" part of Settings (ARCHITECTURE.md Section 21), where a
 * member sets the one profile photo every group they're in shows beside
 * their name, in place of their colored initials. A picked photo is cropped
 * square and shrunk on the device and previewed, then saved to every group
 * or set aside, and a saved photo can be changed or removed. With no group,
 * the part says a group comes first, since each copy is kept in a group.
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

const bytBlbFun = ( bytValArr : Uint8Array< ArrayBuffer > ) : Blob => new Blob( [ bytValArr ], { type : imaTypFun( bytValArr ) } ); // What: Bytes Blob Function. Why: An image element reads a photo through an address made from a typed blob. How: This wraps the bytes, typed from their first bytes.

// #endregion Helpers



// #region Hooks

// #region useBytUrlFun

/**
 * useBytUrlFun = Use Bytes URL Function
 *
 * @summary
 * Returns an address an image element can show the bytes from, made when
 * the bytes change and freed when they change again or the part goes, empty
 * while there are none.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: The photo's bytes, or null.
 *
 * @returns The address, empty when there are no bytes.
 *
 * @example
 * ```ts
 * useBytUrlFun(bytValArr) // => 'blob:...'
 * ```
 *
*/

const useBytUrlFun = ( bytValArr : Uint8Array< ArrayBuffer > | null ) : string => { // What: Use Bytes URL Function. Why: The preview shows bytes, which an image reads by address. How: This makes and frees the address with the bytes.


	const [ urlValStr, setUrlValStr ] = useState( '' ); // What: URL Value String And Setter. Why: The preview reads the current address. How: This holds it, empty while there's none.



	useEffect( () => { // What: Address Effect. Why: Each photo needs its own address, freed when it's replaced. How: This makes one for the bytes and frees it on cleanup.


		if ( bytValArr === null ) { setUrlValStr( '' ); return; } // What: No Bytes Guard. Why: With no photo there's nothing to show. How: This empties the address and returns.



		const newUrlStr = URL.createObjectURL( bytBlbFun( bytValArr ) ); // What: New URL String. Why: The image reads the photo by address. How: This makes one.


		setUrlValStr( newUrlStr ); // What: Address Set Call. Why: The preview shows the new photo. How: This keeps its address.



		return () => URL.revokeObjectURL( newUrlStr ); // What: Cleanup Return. Why: An address holds its photo in memory until it's freed. How: This frees it.


	}, [ bytValArr ] ); // What: Effect Dependency Array. Why: A new photo needs a new address. How: bytValArr changes with the photo.



	return urlValStr; // What: Address Return. Why: The preview shows the photo. How: This returns its address.


};

// #endregion useBytUrlFun

// #endregion Hooks



// #region Components

type PrsProTyp = { setActObj : SarRetTyp }; // What: Profile Settings Component Props Type. Why: The part runs its changes through the section that holds it. How: This types ProSetCom's props.

// #region ProSetCom

/**
 * ProSetCom = Profile Settings Component
 *
 * @summary
 * Renders the "Your profile" part: its heading, a note, the photo in a
 * circle once there is one, and its buttons. As it opens it syncs the
 * member's photo across their groups and reads it. Picking a photo crops
 * and shrinks it here and previews it, with "Save photo" storing it in every
 * group and "Cancel" setting it aside; otherwise "Add a photo" or "Change
 * photo" picks one and "Remove photo" removes every copy. A photo the browser
 * can't read is announced through the section's alert, and each change
 * through its runners and status, focus landing on the part's heading as
 * the buttons change. With no group, the part says one comes first.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.setActObj - Settings Actions Object: The section's runners
 *                          and messages, from {@link useSetActFun}.
 *
 * @returns The part.
 *
 * @example
 * ```tsx
 * ProSetCom({ setActObj }) // => <ProSetCom />
 * ```
 *
*/

function ProSetCom ( { setActObj } : PrsProTyp ) : React.JSX.Element {


	const filInpRef = useRef< HTMLInputElement >( null );   // What: File Input Reference. Why: A button opens the hidden file picker. How: This holds the input.
	const proHeaRef = useRef< HTMLHeadingElement >( null ); // What: Profile Heading Reference. Why: Focus lands on the heading as the buttons change. How: This holds it.

	const { actKinStr, actRunFun, setErrMesStr, setStaMesStr } = setActObj; // What: Action Kind String. Why: A button says when its change is out. How: This reads it. // What: Action Run Function. Why: Saving and removing run through the section. How: This reads it. // What: Set Error Message String. Why: A photo that can't be read is announced. How: This reads the alert's setter. // What: Set Status Message String. Why: A change that lands is announced. How: This reads the status's setter.

	const [ draBytArr, setDraBytArr ] = useState< Uint8Array< ArrayBuffer > | null >( null ); // What: Draft Bytes Array And Setter. Why: A picked photo is previewed before it's saved. How: This holds it, null when there's no draft.
	const [ groCouNum, setGroCouNum ] = useState< number | null >( null );                    // What: Group Count Number And Setter. Why: A photo is kept only in a group. How: This holds how many the member is in, null until read.
	const [ proBytArr, setProBytArr ] = useState< Uint8Array< ArrayBuffer > | null >( null ); // What: Profile Bytes Array And Setter. Why: The saved photo shows in the part. How: This holds it, null when there's none.

	const preUrlStr = useBytUrlFun( draBytArr ?? proBytArr ); // What: Preview URL String. Why: The circle shows the draft, or else the saved photo. How: This makes an address for whichever there is.



	useEffect( () => { // What: Profile Load Effect. Why: The part shows the member's photo, and whether they're in a group. How: This syncs the photo across groups and reads it once the part opens.


		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the part closed mustn't change it. How: This is true until the cleanup runs.


		void proSynFun().then( ( synRecObj ) => { // What: Sync Call. Why: The part shows what every group holds. How: This keeps the photo and the count while the part is open.


			if ( !actValBoo ) return; // What: Closed Guard. Why: The part may have closed. How: This ignores the result.



			setProBytArr( synRecObj.bytArr ); // What: Photo Set Call. Why: The circle shows the saved photo. How: This keeps it, null when there's none.

			setGroCouNum( synRecObj.groCouNum ); // What: Count Set Call. Why: The part offers a photo only with a group. How: This keeps the count.


		}, ( errCatObj : unknown ) => { // What: Sync Failure Handler. Why: A failed read shouldn't leave the part waiting, and the failure stays visible. How: This logs it and shows the part without a photo.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) setGroCouNum( 1 ); // What: Count Set Call. Why: A member opening a group's Settings is in one, and can still try to add a photo. How: This shows the buttons while the part is open.


		} );



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A read still out shouldn't land after the part closes. How: This marks it closed.


	}, [] ); // What: Effect Dependency Array. Why: The photo is read once as the part opens. How: The empty list runs it once.



	// #region filPicFun

	/**
	 * filPicFun = File Pick Function
	 *
	 * @summary
	 * Takes the photo picked in the file input, crops and shrinks it on the
	 * device, and keeps it as the draft to preview, moving focus to the
	 * heading as the buttons change. A photo the browser can't read, or
	 * can't make small enough, is announced through the alert instead. The
	 * input is emptied either way, so the same photo can be picked again.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param filLisObj - File List Object: The input's picked files.
	 *
	 * @returns A promise that settles once the photo is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * filPicFun(filLisObj) // => Promise<void>
	 * ```
	 *
	*/

	const filPicFun = async ( filLisObj : FileList | null ) : Promise< void > => { // What: File Pick Function. Why: A picked photo is previewed before it's saved. How: This shrinks it into the draft, or says it can't be used.


		const filValObj = filLisObj?.[ 0 ]; // What: File Value Object. Why: One photo is picked at a time. How: This reads the first file, undefined when none was picked.


		if ( filInpRef.current ) filInpRef.current.value = ''; // What: Input Reset Assignment. Why: Picking the same photo again should still count. How: This empties the input.



		if ( filValObj === undefined ) return; // What: Nothing Picked Guard. Why: A closed picker changes nothing. How: This returns.



		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer stands. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next status should be announced afresh. How: This empties the status.



		try { // What: Shrink Attempt. Why: A photo the browser can't read shouldn't break the part. How: This crops and shrinks it into the draft.


			setDraBytArr( await avaShrFun( filValObj ) ); // What: Draft Set Call. Why: The photo is previewed before it's saved. How: This keeps the shrunk photo as the draft.

			proHeaRef.current?.focus(); // What: Focus Call. Why: The button that opened the picker gives way to Save and Cancel. How: This focuses the heading.


		}

		catch ( errCatObj ) { // What: Shrink Catch. Why: The member should learn the photo can't be used. How: This logs it and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( "That photo couldn't be used. Try a JPEG, PNG, or WebP photo." ); // What: Failure Alert Call. Why: The member can pick another. How: This says what works.


		}


	};

	// #endregion filPicFun



	// #region savRunFun

	/**
	 * savRunFun = Save Run Function
	 *
	 * @summary
	 * Saves the draft to every group as one change, and once it lands keeps
	 * it as the saved photo, drops the draft, announces it, and moves focus
	 * to the heading.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the save is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * savRunFun() // => Promise<void>
	 * ```
	 *
	*/

	const savRunFun = async () : Promise< void > => { // What: Save Run Function. Why: The previewed photo shows in every group once it's saved. How: This stores it and shows it as saved.


		if ( draBytArr === null ) return; // What: No Draft Guard. Why: Only a previewed photo can be saved. How: This returns.



		const lanValBoo = await actRunFun( 'photo', () => proSetFun( draBytArr ) ); // What: Landed Value Boolean. Why: The part changes only once the save lands. How: This runs the save as one change.


		if ( !lanValBoo ) return; // What: Failed Guard. Why: The alert already says so, and the draft stays to try again. How: This returns.



		setProBytArr( draBytArr ); // What: Saved Set Call. Why: The circle now shows the saved photo. How: This keeps it.

		setDraBytArr( null ); // What: Draft Clear Call. Why: Nothing is waiting to be saved. How: This drops the draft.

		setStaMesStr( 'Your photo is saved in every group.' ); // What: Saved Status Call. Why: The member hears it worked. How: This announces it.

		proHeaRef.current?.focus(); // What: Focus Call. Why: Save and Cancel give way to the usual buttons. How: This focuses the heading.


	};

	// #endregion savRunFun



	// #region delRunFun

	/**
	 * delRunFun = Delete Run Function
	 *
	 * @summary
	 * Removes the photo from every group as one change, and once it lands
	 * clears it from the part, announces it, and moves focus to the heading.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the removal is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * delRunFun() // => Promise<void>
	 * ```
	 *
	*/

	const delRunFun = async () : Promise< void > => { // What: Delete Run Function. Why: A member can go back to their colored initials. How: This removes every copy and clears the part.


		const lanValBoo = await actRunFun( 'remove-photo', proDelFun ); // What: Landed Value Boolean. Why: The part changes only once the removal lands. How: This runs it as one change.


		if ( !lanValBoo ) return; // What: Failed Guard. Why: The alert already says so. How: This returns.



		setProBytArr( null ); // What: Saved Clear Call. Why: The circle has nothing to show. How: This drops the saved photo.

		setStaMesStr( 'Your photo is removed. Your initials show instead.' ); // What: Removed Status Call. Why: The member hears it worked. How: This announces it.

		proHeaRef.current?.focus(); // What: Focus Call. Why: Remove photo gives way. How: This focuses the heading.


	};

	// #endregion delRunFun



	const canRunFun = () : void => { // What: Cancel Run Function. Why: A previewed photo can be set aside, and focus shouldn't fall as Save and Cancel go. How: This drops the draft and focuses the heading.


		setDraBytArr( null ); // What: Draft Clear Call. Why: The preview is set aside. How: This drops the draft.

		proHeaRef.current?.focus(); // What: Focus Call. Why: Save and Cancel give way to the usual buttons. How: This focuses the heading.


	};



	return (


		<section
			className={ cssModObj.proSetSec }

			aria-labelledby='proSetHea'
		>{ /* What: Profile Settings Section Element. Why: The member's photo belongs to them in every group, not to one group or this device. How: This holds the heading, the note, the photo, and the buttons. */ }


			<h3
				ref={ proHeaRef }
				id='proSetHea'

				className={ cssModObj.proTitHea }

				tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here as the buttons change, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
			>Your profile</h3>{ /* What: Profile Title Heading Element. Why: The part needs a heading. How: This names it. */ }

			<p className={ cssModObj.proNotPar }>{ groCouNum === 0 ? 'Your profile photo is kept with your groups, so start or join a group to add one.' : draBytArr !== null ? "This is how your photo will look. Save it to show it in every group you're in." : "Your photo shows beside your name in every group you're in. Until you add one, your colored initials show." }</p>{ /* What: Profile Note Paragraph Element. Why: The member should know where the photo shows, or what comes first. How: This says it for the part's state. */ }



			{ preUrlStr !== '' && ( // What: Preview Block. Why: The photo shows once there's a draft or a saved one. How: This shows its circle.


				<img
					className={ cssModObj.proPreIma }

					src={ preUrlStr }

					alt={ draBytArr !== null ? 'Preview of your new profile photo' : 'Your profile photo' } // What: Preview Alternative Text. Why: A screen reader should know whether the photo is saved yet. How: This names the draft or the saved photo.
				/> // What: Profile Preview Image Element. Why: The member sees the photo as members will. How: This draws it in a circle.


			) }



			{ groCouNum !== null && groCouNum > 0 && ( // What: Actions Block. Why: Photos can be picked only once the groups are known, and only with a group to keep them. How: This shows the input and buttons then.


				<div className={ cssModObj.proActDiv }>{ /* What: Profile Actions Div Element. Why: The part's buttons sit together. How: This holds them in a row that wraps. */ }


					<input
						ref={ filInpRef }

						className={ cssModObj.proFilInp }

						accept='image/*'
						type='file'

						aria-label='Choose a profile photo'

						onChange={ ( chaEveObj ) => void filPicFun( chaEveObj.currentTarget.files ) }
					/>{ /* What: Profile File Input Element. Why: The browser's own picker chooses the photo, opened from a button. How: This is hidden and opened by the button beside it. */ }



					{ draBytArr !== null ? ( // What: Draft Check. Why: A previewed photo is saved or set aside. How: This shows Save and Cancel for a draft, and otherwise the usual buttons.


						<>{ /* What: Draft Buttons Fragment. Why: Save and Cancel answer the preview together. How: This groups them. */ }


							<ButBasCom onClick={ () => void savRunFun() }>{ actKinStr === 'photo' ? 'Saving…' : 'Save photo' }</ButBasCom>{ /* What: Button Base Component. Why: Saving is the preview's main action, and the label shows while it's working. How: This saves the photo to every group. */ }

							<button
								className={ cssModObj.proPlaBut }

								type='button'

								onClick={ canRunFun }
							>Cancel</button>{ /* What: Profile Plain Button Element. Why: A preview can be set aside. How: This drops the draft. */ }


						</>


					) : ( // What: Usual Branch. Why: With no draft, a photo is added, changed, or removed. How: This shows those buttons.


						<>{ /* What: Usual Buttons Fragment. Why: Picking and removing sit together. How: This groups them. */ }


							<button
								className={ cssModObj.proPlaBut }

								type='button'

								onClick={ () => filInpRef.current?.click() } // What: Pick Click Handler. Why: The hidden input opens the browser's picker. How: This clicks it.
							>{ proBytArr !== null ? 'Change photo' : 'Add a photo' }</button>{ /* What: Profile Plain Button Element. Why: A photo is picked from the device. How: This opens the picker, naming it for whether there's a photo. */ }

							{ proBytArr !== null && ( // What: Remove Check. Why: Only a saved photo can be removed. How: This shows the button then.


								<button
									className={ cssModObj.proPlaBut }

									type='button'

									onClick={ () => void delRunFun() }
								>{ actKinStr === 'remove-photo' ? 'Removing…' : 'Remove photo' }</button> // What: Profile Plain Button Element. Why: A member can go back to their initials, and the label shows while it's working. How: This removes the photo from every group.


							) }


						</>


					) }


				</div>


			) }


		</section>


	);


}

// #endregion ProSetCom

// #endregion Components



// #region Exports

export { ProSetCom }; // What: Named Export. Why: Settings shows the member's profile part. How: This exports ProSetCom.

// #endregion Exports


