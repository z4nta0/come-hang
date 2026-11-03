


// #region Imports

import cssModObj from './switcher.module.css'; // What: CSS Module Object. Why: The switcher is styled in its own module, whose class names Vite hashes. How: This imports the module's class names.


import { ButBasCom   } from '../ui/button.tsx';            // What: Button Base Component. Why: Seeding is the panel's leading action. How: This draws it as the main button.
import { DEV_MEM_ARR } from './seed.ts';                   // What: Development Member Array. Why: The panel lists who can be acted as. How: This names each member and its profile.
import { PRO_NAM_STR } from '../platform/dev-profile.ts';  // What: Profile Name String. Why: The panel marks whom the page acts as now. How: This is the page's profile.
import { PRO_STO_STR } from '../platform/dev-profile.ts';  // What: Profile Storage String. Why: Switching keeps the tab's member through the reload. How: This names its session storage key.
import { seeRunFun   } from './seed.ts';                   // What: Seed Run Function. Why: The panel builds the demo group. How: This runs the seed.
import { SheDiaCom   } from '../ui/sheet.tsx';             // What: Sheet Dialog Component. Why: The panel opens over the app like the app's own sheets. How: This draws it as a sheet.
import { useRef      } from 'react';                       // What: Use Reference. Why: The toggle opens the sheet through its handle. How: This holds the handle.
import { useState    } from 'react';                       // What: Use State. Why: The seed's progress shows while it runs. How: This holds the stage and whether it's running.


import type { SheHanTyp } from '../ui/sheet.tsx'; // What: Sheet Handle Type. Why: The sheet hands back a handle to open it. How: This types the reference.

// #endregion Imports



/**
 * switcher.tsx = Member Switcher
 *
 * @summary
 * The development panel for trying the app as several people from one
 * browser (ARCHITECTURE.md Section 14). A small toggle at the screen's end
 * edge names whom the tab acts as and opens a sheet that lists the members:
 * choosing one keeps it in the tab's session storage and reloads the app at
 * its root as that member, so each tab can be a different person. The sheet
 * also seeds the demo group, announcing each stage, then reloads as Alex, its
 * owner. main.tsx mounts it in development only, outside the app's root, so
 * nothing here reaches a production build.
 *
 * Sections:
 *  - Helpers
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region memSwiFun

/**
 * memSwiFun = Member Switch Function
 *
 * @summary
 * Makes the tab act as a member: keeps the profile in the tab's session
 * storage, or removes it for the device's own identity, then clears the
 * history entry's state at the root and reloads, so no screen of the member
 * before carries over.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param proValStr - Profile Value String: The member's profile, empty for
 *                    the device's own identity.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * memSwiFun('sam') // => void
 * ```
 *
*/

const memSwiFun = ( proValStr : string ) : void => { // What: Member Switch Function. Why: Choosing a member, or finishing the seed, reloads as them. How: This keeps the profile, then reloads at the root.


	if ( proValStr === '' ) sessionStorage.removeItem( PRO_STO_STR ); // What: Own Identity Branch. Why: The device's own identity keeps no profile. How: This removes the kept one.

	else sessionStorage.setItem( PRO_STO_STR, proValStr ); // What: Member Branch. Why: The reload reads the member from the tab's storage. How: This keeps the profile.



	history.replaceState( null, '', '/' ); // What: Entry Clear Call. Why: No screen of the member before should carry over. How: This empties the history entry's state at the root.

	location.reload(); // What: Reload Call. Why: Every storage the app opened belongs to the member before, and WebKit ignored a load of the address already showing. How: This reloads the app afresh.


};

// #endregion memSwiFun

// #endregion Helpers



// #region Components

// #region DevSwiCom

/**
 * DevSwiCom = Development Switcher Component
 *
 * @summary
 * Renders the switcher in a complementary landmark: the toggle, labelled with
 * the member the tab acts as, and the sheet it opens, holding a note, a button
 * per member, the current one marked, the seed button, and the status that
 * announces each stage of the seed. A seed in progress ignores another press
 * and labels the button "Seeding…"; a finished seed reloads as Alex, and a
 * failure is logged and announced.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The switcher's landmark.
 *
 * @example
 * ```tsx
 * DevSwiCom({}) // => <DevSwiCom />
 * ```
 *
*/

function DevSwiCom () : React.JSX.Element {


	const sheHanRef = useRef< SheHanTyp >( null ); // What: Sheet Handle Reference. Why: The toggle opens the sheet. How: This holds the sheet's handle.

	const [ seeRunBoo, setSeeRunBoo ] = useState( false ); // What: Seed Running Boolean And Setter. Why: One seed at a time, and the button says it's working. How: This is true while one runs.
	const [ seeStaStr, setSeeStaStr ] = useState( '' );    // What: Seed Stage String And Setter. Why: The seed takes a while, so each stage is announced. How: This holds the status's text, empty before a seed.


	const curNamStr = DEV_MEM_ARR.find( ( memRecObj ) => memRecObj.proStr === PRO_NAM_STR )?.namStr ?? PRO_NAM_STR; // What: Current Name String. Why: The toggle names whom the tab acts as. How: This finds the member by profile, falling back to the profile for one the list doesn't name.



	// #region seeStaFun

	/**
	 * seeStaFun = Seed Start Function
	 *
	 * @summary
	 * Runs the seed unless one is running, showing each stage in the status,
	 * then reloads as Alex. A failure is logged, the button freed, and the
	 * status says the seed failed.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the seed is handled, with no value.
	 *
	 * @example
	 * ```ts
	 * seeStaFun() // => Promise<void>
	 * ```
	 *
	*/

	const seeStaFun = async () : Promise< void > => { // What: Seed Start Function. Why: The demo group is built from the sheet. How: This runs the seed, then reloads as its owner.


		if ( seeRunBoo ) return; // What: Busy Guard. Why: Two seeds at once would reset each other's members. How: This ignores the press.



		setSeeRunBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the seed as running.



		try { await seeRunFun( setSeeStaStr ); } // What: Seed Try. Why: The group is built member by member. How: This runs the seed, showing each stage.

		catch ( errCatObj ) { // What: Seed Catch. Why: A failed seed has to be told. How: This logs it, frees the button, and says so.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setSeeRunBoo( false ); // What: Busy Clear Call. Why: The seed can be tried again. How: This marks it as done.

			setSeeStaStr( 'The seed failed. Check that the emulators are running, then try again.' ); // What: Failure Status Call. Why: The usual cause is the emulators being down. How: This says so.



			return;


		}



		memSwiFun( 'alex' ); // What: Owner Switch Call. Why: The group opens as its owner, who sees everything. How: This reloads as Alex.


	};

	// #endregion seeStaFun



	return (


		<aside
			className={ cssModObj.devSwiAsi }

			aria-label='Developer tools'
		>{ /* What: Development Switcher Aside Element. Why: The tools sit outside the app's own landmarks, and every part of a page belongs to one. How: This holds the toggle and the sheet in a named complementary landmark. */ }


			<button
				className={ cssModObj.swiTogBut }

				type='button'

				onClick={ () => sheHanRef.current?.opeFun() }
			>{ `Dev: ${ curNamStr }` }</button>{ /* What: Switcher Toggle Button Element. Why: The tools stay one press away, and the label names whom the tab acts as. How: This opens the sheet. */ }



			<SheDiaCom
				ref={ sheHanRef }

				ideStr='swiTitHea'
				titStr='Developer tools'
			>{ /* What: Switcher Sheet Dialog Component. Why: The members and the seed open over the app. How: This draws them in a sheet. */ }


				<p className={ cssModObj.swiNotPar }>Act as a demo member. The app reloads as them, and each keeps their own identity in this browser, one per tab. Seeding starts Alex, Sam, and Priya afresh in a new demo group.</p>{ /* What: Switcher Note Paragraph Element. Why: Switching reloads, which should come as no surprise. How: This says what a choice does. */ }



				<ul className={ cssModObj.swiMemUno }>{ /* What: Switcher Member Unordered List Element. Why: The members read as a list. How: This holds a row per member. */ }


					{ DEV_MEM_ARR.map( ( memRecObj ) => ( // What: Member Rows Map. Why: Each member is one choice. How: This renders a row per member.


						<li key={ memRecObj.proStr }>{ /* What: Member Row List Item Element. Why: Each member is one entry in the list. How: This holds its button. */ }


							<button
								className={ cssModObj.swiMemBut }

								type='button'

								aria-current={ memRecObj.proStr === PRO_NAM_STR || undefined } // What: Current Member Attribute. Why: The member the tab acts as should be marked, for sight and screen readers alike. How: This sets aria-current on that member's button alone.

								onClick={ () => memSwiFun( memRecObj.proStr ) }
							>{ memRecObj.namStr }</button>{ /* What: Switcher Member Button Element. Why: Choosing a member reloads as them. How: This switches the tab to the member. */ }


						</li>


					) ) }


				</ul>



				<ButBasCom
					className={ cssModObj.swiSeeBut }

					onClick={ () => void seeStaFun() }
				>{ seeRunBoo ? 'Seeding…' : 'Seed demo group' }</ButBasCom>{ /* What: Switcher Seed Button Component. Why: Trying the app as several people starts from a group with several people, and the label shows while it's working. How: This runs the seed, which replaces Alex, Sam, and Priya. */ }

				<p
					className={ cssModObj.swiStaPar }

					role='status'
				>{ seeStaStr }</p>{ /* What: Switcher Status Paragraph Element. Why: Each stage of a long seed, and a failure, should be told, and a region added only when it speaks is often missed. How: This is in the page and empty from the first render, gaining each stage's text. */ }


			</SheDiaCom>


		</aside>


	);


}

// #endregion DevSwiCom

// #endregion Components



// #region Exports

export { DevSwiCom }; // What: Named Export. Why: main.tsx mounts the switcher in development. How: This exports DevSwiCom.

// #endregion Exports


