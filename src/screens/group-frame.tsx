


// #region Imports

import cssModObj from './group-frame.module.css'; // What: CSS Module Object. Why: The frame is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';    // What: Button Base Component. Why: The group sheet leads with starting a group. How: This draws its button.
import { IcoSvgCom    } from '../ui/icon.tsx';      // What: Icon SVG Component. Why: The switcher, the sheet's close button, and the rail's new group button show icons. How: This draws them.
import { iniTexFun    } from '../utils/text.ts';    // What: Initials Text Function. Why: The rail shows each group by its initials. How: This takes them from the name.
import { MaiAreCom    } from '../ui/main-area.tsx'; // What: Main Area Component. Why: The open group's content is the screen's main content. How: This holds it in the main landmark.
import { useEffect    } from 'react';               // What: Use Effect. Why: A group just created takes focus on its heading. How: This moves focus once it's drawn.
import { useRef       } from 'react';               // What: Use Reference. Why: The heading takes focus and the sheet opens and closes as an element. How: This holds both elements.
import { useScrOpeFun } from '../ui/screen.ts';     // What: Use Screen Open Function. Why: Choosing a group or starting one opens a screen. How: This returns the function that opens one.
import { useState     } from 'react';               // What: Use State. Why: The sheet plays its closing slide before it closes. How: This holds whether it's closing.


import type { GroRecTyp } from '../state/groups.ts'; // What: Group Record Type. Why: The frame lists the groups and shows one. How: This types each group.

// #endregion Imports



/**
 * group-frame.tsx = Group Frame
 *
 * @summary
 * The frame around an open group. Below 720px wide it has a bar with the
 * group's name, which opens a sheet listing every group and offering to
 * start one; from 720px up, a rail of every group, by initials, sits down the
 * left beside the bar, the name there plain text, and the rail holds the
 * button that starts a group. The group's content fills the main area below
 * the bar. Choosing a group or starting one opens it as a new history entry,
 * and a group just created takes focus on its heading.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type GfcProTyp = { curGroObj : GroRecTyp, focBoo : boolean, groRecArr : GroRecTyp[] }; // What: Group Frame Component Props Type. Why: The frame shows one group among every group, and focuses it when it's new. How: This types GroFraCom's props.

// #region GroFraCom

/**
 * GroFraCom = Group Frame Component
 *
 * @summary
 * Renders the frame around the open group: the rail, the bar with the
 * group's name as the screen's one h1, the main area, and the group sheet,
 * a modal dialog that slides up from the bottom. The sheet closes on its
 * close button, on Escape, on a tap of the dimmed page, or once a group is
 * chosen, sliding back down first. When focBoo is true, the heading takes
 * focus once drawn.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.curGroObj - Current Group Object: The open group.
 * @param props.focBoo    - Focus Boolean: Whether the heading takes focus,
 *                          as it does for a group just created.
 * @param props.groRecArr - Group Record Array: Every group, sorted by name.
 *
 * @returns The frame.
 *
 * @example
 * ```tsx
 * GroFraCom({ curGroObj, focBoo, groRecArr }) // => <GroFraCom />
 * ```
 *
*/

function GroFraCom ( { curGroObj, focBoo, groRecArr } : GfcProTyp ) : React.JSX.Element {


	const diaEleRef = useRef< HTMLDialogElement >( null );  // What: Dialog Element Reference. Why: The sheet opens and closes as a modal dialog. How: This holds its element.
	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: A group just created takes focus on its heading. How: This holds the heading.
	const scrOpeFun = useScrOpeFun();                       // What: Screen Open Function. Why: Choosing a group or starting one opens a screen. How: This reads the function that opens one.

	const [ cloSheBoo, setCloSheBoo ] = useState( false ); // What: Closing Sheet Boolean And Setter. Why: The sheet slides down before it closes. How: This is true while it's sliding.



	useEffect( () => { // What: Heading Focus Effect. Why: A group just created replaces the form that made it, so focus should land on what replaced it. How: This focuses the heading when asked.


		if ( focBoo ) heaEleRef.current?.focus(); // What: Focus Call. Why: The new group is announced and the next Tab starts from it. How: This focuses the heading.


	}, [ curGroObj.ideStr, focBoo ] ); // What: Effect Dependency Array. Why: The focus belongs to the group it was asked for. How: curGroObj.ideStr changes when another group opens, and focBoo when the request to focus does.



	const groOpeFun = ( groIdeStr : string ) : void => { // What: Group Open Function. Why: A group chosen from the rail or the sheet opens. How: This closes the sheet if it's open and opens the group's screen.


		if ( diaEleRef.current?.open ) setCloSheBoo( true ); // What: Sheet Close Call. Why: The sheet shouldn't stay over the group just chosen. How: This starts its closing slide.

		scrOpeFun( { groStr : groIdeStr, scrStr : 'group' } ); // What: Screen Open Call. Why: Each group is its own history entry. How: This opens the group's screen.


	};



	return (


		<div className={ cssModObj.fraRooDiv }>{ /* What: Frame Root Div Element. Why: The rail, bar, and content share one layout. How: This places them, the rail showing at 720px wide and up. */ }


			<nav
				className={ cssModObj.fraRaiNav }

				aria-label='Your groups'
			>{ /* What: Frame Rail Nav Element. Why: On a wide screen every group sits one click away. How: This lists each group by its initials, then the button that starts a group, down the left at 720px wide and up, and hides below that. */ }


				{ groRecArr.map( ( groRecObj ) => ( // What: Rail Group Map. Why: Each group gets its own button. How: This renders one per group.


					<button
						key={ groRecObj.ideStr }

						className={ cssModObj.raiGroBut }

						type='button'

						aria-current={ groRecObj.ideStr === curGroObj.ideStr ? 'true' : undefined } // What: Rail Current State. Why: The open group should be marked, to sight and to a screen reader. How: This sets aria-current on the open group's button.
						title={ groRecObj.namStr }

						onClick={ () => groOpeFun( groRecObj.ideStr ) }
					>{ /* What: Rail Group Button Element. Why: A group's initials fit the rail, while its full name is what's announced and shown on hover. How: This opens the group. */ }


						<span aria-hidden='true'>{ iniTexFun( groRecObj.namStr ) }</span>{ /* What: Rail Initials Span Element. Why: The initials are what fits the tile, and announcing them would only repeat the name badly. How: This shows them, hidden from screen readers. */ }

						<span className={ cssModObj.raiNamSpa }>{ groRecObj.namStr }</span>{ /* What: Rail Name Span Element. Why: A screen reader should announce the group by its full name. How: This holds the name, hidden from sight. */ }


					</button>


				) ) }



				<button
					className={ cssModObj.raiNewBut }

					type='button'

					aria-label='Start a group'
					title='Start a group'

					onClick={ () => scrOpeFun( { scrStr : 'create' } ) }
				>{ /* What: Rail New Button Element. Why: Starting another group is always at hand. How: This opens the screen for starting one. */ }


					<IcoSvgCom
						icoNamStr='plus'
						sizSteStr='p01'
					/>{ /* What: Plus Icon SVG Component. Why: A plus says the button adds a group. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


				</button>


			</nav>



			<header className={ cssModObj.fraBarHed }>{ /* What: Frame Bar Header Element. Why: The open group's name heads the screen. How: This holds the heading across the top. */ }


				<h1
					ref={ heaEleRef }

					className={ cssModObj.fraNamHea }

					tabIndex={ -1 } // What: Heading Tab Index. Why: A group just created moves focus here, but the heading isn't a control. How: This lets it take focus from a script without joining the Tab order.
				>{ /* What: Frame Name Heading Element. Why: The screen's one heading names the open group. How: This shows the name as the switcher below 720px wide, and as plain text from 720px up, where the rail switches groups. */ }


					<button
						className={ cssModObj.fraSwiBut }

						type='button'

						aria-haspopup='dialog'

						onClick={ () => diaEleRef.current?.showModal() } // What: Switcher Click Handler. Why: The sheet holds the page while it's open. How: This opens the dialog as a modal, which makes everything behind it inert.
					>{ /* What: Frame Switcher Button Element. Why: On a phone the group's name is how someone reaches their other groups. How: This opens the group sheet, below 720px wide. */ }


						{ curGroObj.namStr }

						<IcoSvgCom
							icoNamStr='down'
							sizSteStr='bas'
						/>{ /* What: Down Icon SVG Component. Why: A chevron says the name opens a list. How: This draws it at the base step. */ }{ /* Vertical Rhythm Base ~= 14.572px */ }


					</button>

					<span className={ cssModObj.fraNamSpa }>{ curGroObj.namStr }</span>{ /* What: Frame Name Span Element. Why: On a wide screen the name is plain text, since the rail switches groups. How: This shows it from 720px wide and up. */ }


				</h1>


			</header>



			<MaiAreCom className={ cssModObj.fraConMai }>{ /* What: Frame Content Main Area Component. Why: The open group's content is the screen's main content. How: This holds its chat below the bar. */ }


				<h2 className={ cssModObj.chaTitHea }>Chat</h2>{ /* What: Chat Title Heading Element. Why: The content says which part of the group is open. How: This names the chat. */ }

				<p className={ cssModObj.chaEmpPar }>No messages yet.</p>{ /* What: Chat Empty Paragraph Element. Why: An empty chat should say so. How: This tells that nothing has been said yet. */ }


			</MaiAreCom>



			<dialog
				ref={ diaEleRef }

				className={ cssModObj.groSheDia }

				data-sheet-closing={ cloSheBoo || undefined }

				aria-labelledby='sheTitHea'

				onCancel={ ( canEveObj ) => { canEveObj.preventDefault(); setCloSheBoo( true ); } } // What: Cancel Handler. Why: Escape should slide the sheet down like every other way of closing it. How: This stops the dialog closing at once and starts its closing slide.
			>{ /* What: Group Sheet Dialog Element. Why: On a phone, every group and starting a new one sit in a sheet over the page. How: This holds the dimmed page and the sheet, modal while open, sliding down as it closes. */ }


				<div
					className={ cssModObj.sheScrDiv }

					onClick={ () => setCloSheBoo( true ) } // What: Scrim Click Handler. Why: A tap outside the sheet should close it. How: This starts its closing slide.
				/>{ /* What: Sheet Scrim Div Element. Why: The page behind the sheet dims, and a tap on it closes the sheet. How: This covers the screen behind the sheet. */ }



				<div
					className={ cssModObj.shePanDiv }

					onAnimationEnd={ ( aniEveObj ) => { // What: Panel Animation End Handler. Why: The sheet closes once its slide down finishes, which still ends under reduced motion. How: This closes the dialog after the panel's own closing animation.


						if ( aniEveObj.target !== aniEveObj.currentTarget || !cloSheBoo ) return; // What: Closing Guard. Why: Only the panel's own closing slide should close the dialog, not its opening slide or an animation inside it. How: This returns for any other end.



						diaEleRef.current?.close(); // What: Dialog Close Call. Why: The slide has finished. How: This closes the dialog, which returns focus to the button that opened it.

						setCloSheBoo( false ); // What: Closing Clear Call. Why: The next opening should slide up again. How: This marks the sheet as no longer closing.


					} }
				>{ /* What: Sheet Panel Div Element. Why: The sheet's content sits on a surface rising from the bottom. How: This holds the bar, the group list, and the start button. */ }


					<div className={ cssModObj.sheBarDiv }>{ /* What: Sheet Bar Div Element. Why: The sheet's title sits beside its close button. How: This lays them out in one row. */ }


						<h2
							id='sheTitHea'

							className={ cssModObj.sheTitHea }
						>Your groups</h2>{ /* What: Sheet Title Heading Element. Why: The sheet is named for what it lists, and the dialog takes its name from it. How: This names the sheet. */ }

						<button
							className={ cssModObj.sheCloBut }

							type='button'

							aria-label='Close'

							onClick={ () => setCloSheBoo( true ) }
						>{ /* What: Sheet Close Button Element. Why: The sheet needs a visible way out. How: This starts its closing slide. */ }


							<IcoSvgCom
								icoNamStr='close'
								sizSteStr='p01'
							/>{ /* What: Close Icon SVG Component. Why: A cross says the button closes the sheet. How: This draws it at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }


						</button>


					</div>



					<ul className={ cssModObj.sheGroUno }>{ /* What: Sheet Group Unordered List Element. Why: Every group is listed by name. How: This stacks a button for each. */ }


						{ groRecArr.map( ( groRecObj ) => ( // What: Sheet Group Map. Why: Each group gets its own row. How: This renders one per group.


							<li key={ groRecObj.ideStr }>{ /* What: Sheet Group Item Element. Why: Each group is one entry in the list. How: This holds its button. */ }


								<button
									className={ cssModObj.sheGroBut }

									type='button'

									aria-current={ groRecObj.ideStr === curGroObj.ideStr ? 'true' : undefined } // What: Sheet Current State. Why: The open group should be marked, to sight and to a screen reader. How: This sets aria-current on the open group's row.

									onClick={ () => groOpeFun( groRecObj.ideStr ) }
								>{ groRecObj.namStr }</button>{ /* What: Sheet Group Button Element. Why: A group is chosen by its name. How: This opens the group and closes the sheet. */ }


							</li>


						) ) }


					</ul>



					<ButBasCom
						className={ cssModObj.sheNewBut }

						onClick={ () => scrOpeFun( { scrStr : 'create' } ) }
					>Start a group</ButBasCom>{ /* What: Sheet New Button Component. Why: Starting another group is offered beside the list. How: This opens the screen for starting one. */ }


				</div>


			</dialog>


		</div>


	);


}

// #endregion GroFraCom

// #endregion Components



// #region Exports

export { GroFraCom }; // What: Named Export. Why: The screen host frames the open group with it. How: This exports GroFraCom.

// #endregion Exports


