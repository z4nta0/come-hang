


// #region Imports

import cssModObj from './moved.module.css'; // What: CSS Module Object. Why: The screen is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom } from '../ui/button.tsx';      // What: Button Base Component. Why: Sharing the keys is the screen's main action. How: This draws the button.
import { ideEnsFun } from '../state/identity.ts';  // What: Identity Ensure Function. Why: The requests shared are this identity's own. How: This reads its UID.
import { keyOwnFun } from '../state/key-share.ts'; // What: Key Own Function. Why: The screen lists the groups the new device is waiting on. How: This watches the member's own requests.
import { keyShaFun } from '../state/key-share.ts'; // What: Key Share Function. Why: Each waiting group's key is shared with the new device. How: This wraps it for the new device's key.
import { MaiAreCom } from '../ui/main-area.tsx';   // What: Main Area Component. Why: The screen's content is its main landmark. How: This holds it.
import { useEffect } from 'react';                 // What: Use Effect. Why: The heading takes focus as the screen opens, and the requests are watched. How: This runs each after rendering.
import { useRef    } from 'react';                 // What: Use Reference. Why: Focus moves to a heading. How: This holds each heading.
import { useState  } from 'react';                 // What: Use State. Why: The waiting groups, the messages, and a change in progress change what shows. How: This holds each.


import type { GroRecTyp } from '../state/groups.ts'; // What: Group Record Type. Why: The screen names the member's groups. How: This types them.

// #endregion Imports



/**
 * moved.tsx = Moved
 *
 * @summary
 * The screen a device shows once the identity has moved to another device
 * (ARCHITECTURE.md Section 8), since one identity is used on one device at a
 * time. It says why the device stepped back, lists the groups whose key the
 * new device is waiting on and this device holds, with one button sharing
 * them all, and offers to use Come Hang on this device instead, which moves
 * the identity back. Its heading takes focus as it opens, since it replaces
 * whatever screen was showing.
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

type MdcProTyp = { groRecArr : GroRecTyp[], onTakFun : () => Promise< void > }; // What: Moved Device Component Props Type. Why: The screen names the member's groups and hands taking the identity back to its host. How: This types MovDevCom's props.

// #endregion Types



// #region Components

// #region MovDevCom

/**
 * MovDevCom = Moved Device Component
 *
 * @summary
 * Renders the screen for a device the identity moved away from. It watches
 * the member's own key requests in their groups and lists each group whose
 * key this device can share, with a button sharing every one; once they're
 * shared, focus moves to the keys' heading, and a failure is announced. The
 * second button asks the host to make this device the active one again,
 * announcing a failure here.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.groRecArr - Group Record Array: The member's groups.
 * @param props.onTakFun  - On Take Function: Makes this device the active
 *                          one again, rejecting when it can't.
 *
 * @returns The screen's main area.
 *
 * @example
 * ```tsx
 * MovDevCom({ groRecArr, onTakFun }) // => <MovDevCom />
 * ```
 *
*/

function MovDevCom ( { groRecArr, onTakFun } : MdcProTyp ) : React.JSX.Element {


	const keyHeaRef = useRef< HTMLHeadingElement >( null ); // What: Key Heading Reference. Why: Focus lands on the keys' heading once they're shared, since the button goes. How: This holds it.
	const titHeaRef = useRef< HTMLHeadingElement >( null ); // What: Title Heading Reference. Why: The heading takes focus as the screen opens. How: This holds it.

	const [ busValBoo, setBusValBoo ] = useState( false );            // What: Busy Value Boolean And Setter. Why: One change runs at a time. How: This is true while one is out.
	const [ errMesStr, setErrMesStr ] = useState( '' );               // What: Error Message String And Setter. Why: A failed change is announced. How: This holds the alert's text, empty when there's none.
	const [ staMesStr, setStaMesStr ] = useState( '' );               // What: Status Message String And Setter. Why: Shared keys are announced. How: This holds the status's text.
	const [ waiIdeArr, setWaiIdeArr ] = useState< string[] >( [] ); // What: Waiting Identifier Array And Setter. Why: The screen lists the groups the new device is waiting on. How: This holds their IDs, none until the watch reports.


	const groKeyStr = groRecArr.map( ( groRecObj ) => groRecObj.ideStr ).join( ',' ); // What: Group Key String. Why: The watch restarts only when the groups change, not with every report of them. How: This joins their IDs.



	useEffect( () => { // What: Heading Focus Effect. Why: The screen replaces whatever was showing, so focus should land on it, which also announces it. How: This focuses the heading once it's drawn.


		titHeaRef.current?.focus(); // What: Focus Call. Why: The device has just stepped back. How: This focuses the heading.


	}, [] ); // What: Effect Dependency Array. Why: Focus moves once, as the screen opens. How: The empty list runs it once.



	useEffect( () => keyOwnFun( groKeyStr === '' ? [] : groKeyStr.split( ',' ), setWaiIdeArr ), [ groKeyStr ] ); // What: Request Watch Effect. Why: The new device files a request as it opens each group. How: This watches the member's own requests across the groups, and stops the watch when the screen closes. // What: Effect Dependency Note. Why: The watch follows the groups. How: groKeyStr changes when they do.



	// #region shaKeyFun

	/**
	 * shaKeyFun = Share Keys Function
	 *
	 * @summary
	 * Shares the key of every group the new device is waiting on, then
	 * announces it and moves focus to the keys' heading, since the button
	 * goes with the list. A failure is logged and announced, keeping the
	 * list. Does nothing while another change is out.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the keys are shared or the failure
	 *          is announced, with no value.
	 *
	 * @example
	 * ```ts
	 * shaKeyFun() // => Promise<void>
	 * ```
	 *
	*/

	const shaKeyFun = async () : Promise< void > => { // What: Share Keys Function. Why: The new device reads the groups once their keys are shared (Section 6). How: This shares each waiting group's key with it.


		if ( busValBoo ) return; // What: Busy Guard. Why: A change while another is out could act twice. How: This ignores it.



		setBusValBoo( true ); // What: Busy Set Call. Why: The next change waits. How: This marks one as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next status should be announced afresh. How: This empties the status.



		try { // What: Share Try. Why: Every waiting group's key has to go. How: This shares them together, then announces it.


			const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The requests are this identity's own. How: This reads its UID.


			await Promise.all( waiIdeArr.map( ( groIdeStr ) => keyShaFun( groIdeStr, uidValStr ) ) ); // What: Share Calls. Why: The new device waits on each group. How: This wraps each key for the new device's published key.


			setStaMesStr( 'Shared the keys. Your new device can read those groups now.' ); // What: Shared Status Call. Why: The member hears it worked. How: This sets the status.

			keyHeaRef.current?.focus(); // What: Heading Focus Call. Why: The button goes with the list. How: This focuses the keys' heading.


		}

		catch ( errCatObj ) { // What: Share Catch. Why: A failed share has to be told. How: This logs it and announces it.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( "The keys couldn't be shared. Check your connection, then try again." ); // What: Failure Announce Call. Why: The member has to learn it failed. How: This sets the alert.


		}



		setBusValBoo( false ); // What: Busy Clear Call. Why: The member can act again. How: This marks the change as done.


	};

	// #endregion shaKeyFun



	// #region takDevFun

	/**
	 * takDevFun = Take Device Function
	 *
	 * @summary
	 * Asks the host to make this device the active one again. A failure is
	 * logged and announced, and the screen stays. Does nothing while another
	 * change is out.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the identity is taken back or the
	 *          failure is announced, with no value.
	 *
	 * @example
	 * ```ts
	 * takDevFun() // => Promise<void>
	 * ```
	 *
	*/

	const takDevFun = async () : Promise< void > => { // What: Take Device Function. Why: Someone can choose to keep using this device. How: This asks the host to take the identity back, announcing a failure.


		if ( busValBoo ) return; // What: Busy Guard. Why: A change while another is out could act twice. How: This ignores it.



		setBusValBoo( true ); // What: Busy Set Call. Why: The next change waits. How: This marks one as out.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier failure no longer applies. How: This empties the alert.



		try { await onTakFun(); } // What: Take Try. Why: The host moves the identity back and shows the groups. How: This waits for it.

		catch ( errCatObj ) { // What: Take Catch. Why: A failed move has to be told. How: This logs it, announces it, and frees the buttons.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( "Come Hang couldn't move back to this device. Check your connection, then try again." ); // What: Failure Announce Call. Why: The member has to learn it failed. How: This sets the alert.

			setBusValBoo( false ); // What: Busy Clear Call. Why: The member can try again. How: This marks the change as done.


		}


	};

	// #endregion takDevFun



	return (


		<MaiAreCom className={ cssModObj.movScrMai }>{ /* What: Moved Screen Main Area Component. Why: The screen's whole content is its main landmark. How: This holds the heading, the note, both parts, and the messages. */ }


			<h1
				ref={ titHeaRef }

				className={ cssModObj.movTitHea }

				tabIndex={ -1 } // What: Heading Tab Index. Why: The screen takes focus here as it opens, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
			>Come Hang is open on another device</h1>{ /* What: Moved Title Heading Element. Why: The screen's one top heading says what happened. How: This names it. */ }

			<p className={ cssModObj.movIntPar }>You got your account back on a new device, so this one has stepped back. Your account works on one device at a time.</p>{ /* What: Moved Intro Paragraph Element. Why: The member should know why the app stopped here (Section 8). How: This says it. */ }



			<section
				className={ cssModObj.movKeySec }

				aria-labelledby='movKeyHea'
			>{ /* What: Moved Key Section Element. Why: Sharing the keys is its own part. How: This holds its heading, note, list, and button. */ }


				<h2
					ref={ keyHeaRef }
					id='movKeyHea'

					className={ cssModObj.movKeyHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: Focus moves here once the keys are shared, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>Your groups' keys</h2>{ /* What: Moved Key Heading Element. Why: The part needs a heading. How: This names it. */ }

				<p className={ cssModObj.movKeyPar }>{ waiIdeArr.length > 0 ? "Your new device can't read these groups until this device shares their keys." : "Your new device isn't waiting on this one for any keys. If it asks, its groups show here." }</p>{ /* What: Moved Key Paragraph Element. Why: The member should know whether the new device needs anything from this one (Section 6). How: This says it is waiting, or that nothing is. */ }



				{ waiIdeArr.length > 0 && ( // What: Waiting Check. Why: The list and its button show only while a group waits. How: This shows them when any does.


					<>{ /* What: Waiting Fragment. Why: The list and its button come and go together. How: This groups them without adding an element. */ }


						<ul className={ cssModObj.movGroUno }>{ /* What: Moved Group Unordered List Element. Why: The waiting groups read as one list. How: This stacks a row for each. */ }


							{ waiIdeArr.map( ( groIdeStr ) => ( // What: Group Row Map. Why: Each waiting group is named. How: This renders one row per group.


								<li
									key={ groIdeStr }

									className={ cssModObj.movGroIte }
								>{ groRecArr.find( ( groRecObj ) => groRecObj.ideStr === groIdeStr )?.namStr ?? 'A group' }</li> // What: Moved Group Item Element. Why: The member recognizes each group by its name. How: This shows it, or says a group while it's unread.


							) ) }


						</ul>



						<ButBasCom onClick={ () => void shaKeyFun() }>Share the keys</ButBasCom>{ /* What: Button Base Component. Why: Sharing every waiting key is the screen's main action. How: This shares them. */ }


					</>


				) }


			</section>



			<section
				className={ cssModObj.movUseSec }

				aria-labelledby='movUseHea'
			>{ /* What: Moved Use Section Element. Why: Moving the account back is its own part. How: This holds its heading, note, and button. */ }


				<h2
					id='movUseHea'

					className={ cssModObj.movUseHea }
				>Use Come Hang here</h2>{ /* What: Moved Use Heading Element. Why: The part needs a heading. How: This names it. */ }

				<p className={ cssModObj.movUsePar }>Move your account back to this device. The other device steps back instead.</p>{ /* What: Moved Use Paragraph Element. Why: The member should know what moving back does. How: This says it. */ }

				<button
					className={ cssModObj.movUseBut }

					type='button'

					onClick={ () => void takDevFun() }
				>Use Come Hang here instead</button>{ /* What: Moved Use Button Element. Why: Moving back is a lighter choice than sharing the keys. How: This asks the host to take the identity back. */ }


			</section>

			<p
				className={ cssModObj.movStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Moved Status Paragraph Element. Why: Shared keys are announced. How: This holds the message, empty from the first render. */ }

			<p
				className={ cssModObj.movErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Moved Error Paragraph Element. Why: A failed change is announced. How: This holds the message, empty from the first render. */ }


		</MaiAreCom>


	);


}

// #endregion MovDevCom

// #endregion Components



// #region Exports

export { MovDevCom }; // What: Named Export. Why: The screen host shows the screen once the identity moves away. How: This exports MovDevCom.

// #endregion Exports


