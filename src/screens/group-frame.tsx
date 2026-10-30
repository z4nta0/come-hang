


// #region Imports

import cssModObj from './group-frame.module.css'; // What: CSS Module Object. Why: The frame is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';    // What: Button Base Component. Why: The group sheet leads with starting a group. How: This draws its button.
import { GroChaCom    } from './group-chat.tsx';    // What: Group Chat Component. Why: The open group's chat fills the content. How: The frame shows it in the main area.
import { IcoSvgCom    } from '../ui/icon.tsx';      // What: Icon SVG Component. Why: The switcher and the rail's new group button show icons. How: This draws them.
import { iniTexFun    } from '../utils/text.ts';    // What: Initials Text Function. Why: The rail shows each group by its initials. How: This takes them from the name.
import { MaiAreCom    } from '../ui/main-area.tsx'; // What: Main Area Component. Why: The open group's content is the screen's main content. How: This holds it in the main landmark.
import { SheDiaCom    } from '../ui/sheet.tsx';     // What: Sheet Dialog Component. Why: A phone reaches every group through a sheet. How: This draws it.
import { useEffect    } from 'react';               // What: Use Effect. Why: A group just created takes focus on its heading. How: This moves focus once it's drawn.
import { useRef       } from 'react';               // What: Use Reference. Why: The heading takes focus and the sheet opens and closes through its handle. How: This holds the heading and the handle.
import { useScrOpeFun } from '../ui/screen.ts';     // What: Use Screen Open Function. Why: Choosing a group or starting one opens a screen. How: This returns the function that opens one.


import type { GroRecTyp } from '../state/groups.ts'; // What: Group Record Type. Why: The frame lists the groups and shows one. How: This types each group.
import type { SheHanTyp } from '../ui/sheet.tsx';    // What: Sheet Handle Type. Why: The frame opens and closes the group sheet. How: This types its handle.

// #endregion Imports



/**
 * group-frame.tsx = Group Frame
 *
 * @summary
 * The frame around an open group. Below 720px wide it has a bar with the
 * group's name, which opens a sheet listing every group and offering to start
 * one; from 720px up, a rail of every group, by initials, sits down the left
 * beside the bar, the name there plain text, and the rail holds the button
 * that starts a group. The group's content fills the main area below the bar,
 * its chat for now. Choosing a group or starting one opens it as a new history
 * entry, and a group just created takes focus on its heading.
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
 * a modal sheet that slides up from the bottom. The sheet closes on its
 * close button, on Escape, on a tap of the dimmed page, or once a group is
 * chosen, sliding back down first. When focBoo is true, the heading takes
 * focus once drawn, and the history entry is replaced with one that no longer
 * asks, so a reload doesn't take focus again.
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


	const heaEleRef = useRef< HTMLHeadingElement >( null ); // What: Heading Element Reference. Why: A group just created takes focus on its heading. How: This holds the heading.
	const scrOpeFun = useScrOpeFun();                       // What: Screen Open Function. Why: Choosing a group or starting one opens a screen. How: This reads the function that opens one.
	const sheHanRef = useRef< SheHanTyp >( null );          // What: Sheet Handle Reference. Why: The switcher opens the group sheet and a choice closes it. How: This holds the sheet's handle.



	useEffect( () => { // What: Heading Focus Effect. Why: A group just created replaces the form that made it, so focus should land on what replaced it. How: This focuses the heading when asked, then clears the request from the history entry.


		if ( !focBoo ) return; // What: No Request Guard. Why: Only a group just created takes focus. How: This returns otherwise.



		heaEleRef.current?.focus(); // What: Focus Call. Why: The new group is announced and the next Tab starts from it. How: This focuses the heading.

		scrOpeFun( { groStr : curGroObj.ideStr, scrStr : 'group' }, true ); // What: Request Clear Call. Why: The request is for the moment of creation, and a reload or a later visit keeping the same entry shouldn't take focus again. How: This replaces the entry with one that no longer asks.


	}, [ curGroObj.ideStr, focBoo, scrOpeFun ] ); // What: Effect Dependency Array. Why: The focus belongs to the group it was asked for. How: curGroObj.ideStr changes when another group opens, focBoo when the request to focus does, and scrOpeFun only if the router's navigate does.



	const groOpeFun = ( groIdeStr : string ) : void => { // What: Group Open Function. Why: A group chosen from the rail or the sheet opens. How: This closes the sheet if it's open and opens the group's screen.


		sheHanRef.current?.cloFun(); // What: Sheet Close Call. Why: The sheet shouldn't stay over the group just chosen. How: This starts its closing slide, when it's open.

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

						onClick={ () => sheHanRef.current?.opeFun() } // What: Switcher Click Handler. Why: The sheet holds the page while it's open. How: This opens the group sheet as a modal, which makes everything behind it inert.
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



			<MaiAreCom className={ cssModObj.fraConMai }>{ /* What: Frame Content Main Area Component. Why: The open group's content is the screen's main content. How: This holds its chat below the bar, filling the rest of the screen. */ }


				<GroChaCom
					key={ curGroObj.ideStr } // What: Chat Key. Why: Another group's chat has to start afresh rather than show this one's messages. How: This remounts the chat for each group.

					groIdeStr={ curGroObj.ideStr }
					groNamStr={ curGroObj.namStr }
				/>{ /* What: Group Chat Component. Why: The chat is the group's first part. How: This shows the open group's chat. */ }


			</MaiAreCom>



			<SheDiaCom
				ref={ sheHanRef }

				ideStr='groSheHea'
				titStr='Your groups'
			>{ /* What: Group Sheet Dialog Component. Why: On a phone, every group and starting a new one sit in a sheet over the page. How: This holds the group list and the start button. */ }


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


			</SheDiaCom>


		</div>


	);


}

// #endregion GroFraCom

// #endregion Components



// #region Exports

export { GroFraCom }; // What: Named Export. Why: The screen host frames the open group with it. How: This exports GroFraCom.

// #endregion Exports


