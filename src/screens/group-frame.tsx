


// #region Imports

import cssModObj from './group-frame.module.css'; // What: CSS Module Object. Why: The frame is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ButBasCom    } from '../ui/button.tsx';    // What: Button Base Component. Why: The group sheet leads with starting a group. How: This draws its button.
import { GroChaCom    } from './group-chat.tsx';    // What: Group Chat Component. Why: The open group's chat fills the content. How: The frame shows it in the main area.
import { GroEveCom    } from './group-events.tsx';  // What: Group Events Component. Why: The Events section lists and plans the group's events. How: The frame shows it when that section is open.
import { IcoSvgCom    } from '../ui/icon.tsx';      // What: Icon SVG Component. Why: The switcher and the rail's new group button show icons. How: This draws them.
import { iniTexFun    } from '../utils/text.ts';    // What: Initials Text Function. Why: The rail shows each group by its initials. How: This takes them from the name.
import { MaiAreCom    } from '../ui/main-area.tsx'; // What: Main Area Component. Why: The open group's content is the screen's main content. How: This holds it in the main landmark.
import { SheDiaCom    } from '../ui/sheet.tsx';     // What: Sheet Dialog Component. Why: A phone reaches every group through a sheet. How: This draws it.
import { useEffect    } from 'react';               // What: Use Effect. Why: A group just created takes focus on its heading. How: This moves focus once it's drawn.
import { useRef       } from 'react';               // What: Use Reference. Why: The heading takes focus and the sheet opens and closes through its handle. How: This holds the heading and the handle.
import { useScrOpeFun } from '../ui/screen.ts';     // What: Use Screen Open Function. Why: Choosing a group, a section, or starting a group opens a screen. How: This returns the function that opens one.


import type { GroRecTyp } from '../state/groups.ts'; // What: Group Record Type. Why: The frame lists the groups and shows one. How: This types each group.
import type { SecNamTyp } from '../ui/screen.ts';    // What: Section Name Type. Why: The frame shows one of the group's sections. How: This types its name.
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
 * that starts a group. The group's sections, from its chat to its settings,
 * run along the bottom below 720px and down a column beside the rail from
 * 720px, and the open section fills the main area below the bar. Choosing a
 * group, a section, or starting a group opens it as a new history entry, and
 * a group just created takes focus on its heading.
 *
 * Sections:
 *  - Constants
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

type SecTabTyp = { icoNamStr : SecNamTyp, labStr : string }; // What: Section Tab Type. Why: Each tab names its section and label. How: This types one row of SEC_TAB_ARR.

const SEC_TAB_ARR : SecTabTyp[] = [ // What: Section Tab Array. Why: Every group has the same sections, in the same order. How: Each row names a section, which is also its icon's name, and its label.


	{ icoNamStr : 'chat',     labStr : 'Chat'     }, // What: Chat Tab. Why: The chat is where a group talks. How: This names it.
	{ icoNamStr : 'events',   labStr : 'Events'   }, // What: Events Tab. Why: Events are planned there. How: This names it.
	{ icoNamStr : 'map',      labStr : 'Map'      }, // What: Map Tab. Why: Members find each other there on the day. How: This names it.
	{ icoNamStr : 'people',   labStr : 'People'   }, // What: People Tab. Why: The members and joining live there. How: This names it.
	{ icoNamStr : 'settings', labStr : 'Settings' }  // What: Settings Tab. Why: The group's settings live there. How: This names it.


];

// #endregion Constants



// #region Components

type SscProTyp = { labStr : string }; // What: Section Soon Component Props Type. Why: The placeholder names its section. How: This types SecSooCom's one prop.

// #region SecSooCom

/**
 * SecSooCom = Section Soon Component
 *
 * @summary
 * Renders a section that isn't built yet: its name as a heading and a short
 * line saying it's on its way, so each tab leads somewhere while the
 * sections are built one at a time.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.labStr - Label String: The section's name.
 *
 * @returns The placeholder.
 *
 * @example
 * ```tsx
 * SecSooCom({ labStr : 'Map' }) // => <SecSooCom />
 * ```
 *
*/

function SecSooCom ( { labStr } : SscProTyp ) : React.JSX.Element {


	return (


		<div className={ cssModObj.secSooDiv }>{ /* What: Section Soon Div Element. Why: An unbuilt section still needs a heading and a word about it. How: This stacks them at the top of the content. */ }


			<h2>{ labStr }</h2>{ /* What: Section Soon Heading Element. Why: The section is named for a screen reader and for sight. How: This shows its name. */ }

			<p className={ cssModObj.secSooPar }>This part of the group is on its way.</p>{ /* What: Section Soon Paragraph Element. Why: An empty screen would read as broken. How: This says the section is coming. */ }


		</div>


	);


}

// #endregion SecSooCom



type GfcProTyp = { curGroObj : GroRecTyp, focBoo : boolean, groRecArr : GroRecTyp[], secNamStr : SecNamTyp }; // What: Group Frame Component Props Type. Why: The frame shows one section of one group among every group, and focuses it when it's new. How: This types GroFraCom's props.

// #region GroFraCom

/**
 * GroFraCom = Group Frame Component
 *
 * @summary
 * Renders the frame around the open group: the rail, the bar with the
 * group's name as the screen's one h1, the section tabs, the main area
 * showing the open section, and the group sheet,
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
 * @param props.secNamStr - Section Name String: The section to show.
 *
 * @returns The frame.
 *
 * @example
 * ```tsx
 * GroFraCom({ curGroObj, focBoo, groRecArr, secNamStr }) // => <GroFraCom />
 * ```
 *
*/

function GroFraCom ( { curGroObj, focBoo, groRecArr, secNamStr } : GfcProTyp ) : React.JSX.Element {


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



			<nav
				className={ cssModObj.fraSecNav }

				aria-label='Group sections'
			>{ /* What: Frame Section Nav Element. Why: Every part of the group sits one tap away. How: This lists a button for each section, along the bottom below 720px wide and down a column beside the rail from 720px. */ }


				{ SEC_TAB_ARR.map( ( secTabObj ) => ( // What: Section Tab Map. Why: Each section gets its own button. How: This renders one per section.


					<button
						key={ secTabObj.icoNamStr }

						className={ cssModObj.secTabBut }

						type='button'

						aria-current={ secTabObj.icoNamStr === secNamStr ? 'page' : undefined } // What: Section Current State. Why: The open section should be marked, to sight and to a screen reader. How: This sets aria-current on its button.

						onClick={ () => scrOpeFun( { groStr : curGroObj.ideStr, scrStr : 'group', secStr : secTabObj.icoNamStr } ) }
					>{ /* What: Section Tab Button Element. Why: A section opens with a tap, and back returns to the last one. How: This opens the section as a new history entry. */ }


						<IcoSvgCom
							icoNamStr={ secTabObj.icoNamStr }
							sizSteStr='p01'
						/>{ /* What: Section Icon SVG Component. Why: An icon makes each tab quick to find. How: This draws the section's icon at step p01. */ }{ /* Vertical Rhythm Base Plus 1 ~= 19.304px */ }

						{ secTabObj.labStr }


					</button>


				) ) }


			</nav>



			<MaiAreCom className={ cssModObj.fraConMai }>{ /* What: Frame Content Main Area Component. Why: The open section is the screen's main content. How: This holds it below the bar, filling the rest of the screen. */ }


				{ secNamStr === 'chat' ? ( // What: Chat Section Check. Why: The chat and events are built, and the other sections are on their way. How: This shows the chat, the Events section, or the open section's placeholder.


					<GroChaCom
						key={ curGroObj.ideStr } // What: Chat Key. Why: Another group's chat has to start afresh rather than show this one's messages. How: This remounts the chat for each group.

						groIdeStr={ curGroObj.ideStr }
						groNamStr={ curGroObj.namStr }
					/> // What: Group Chat Component. Why: The chat is the group's first section. How: This shows the open group's chat.


				) : secNamStr === 'events' ? ( // What: Events Section Check. Why: The Events section is built. How: This shows it.


					<GroEveCom
						key={ curGroObj.ideStr } // What: Events Key. Why: Another group's events have to start afresh. How: This remounts the section for each group.

						groIdeStr={ curGroObj.ideStr }
						ownBoo={ curGroObj.ownBoo }
					/> // What: Group Events Component. Why: The group plans its events here. How: This shows the open group's Events section.


				) : ( // What: Placeholder Branch. Why: A section still to build should lead somewhere. How: This shows its placeholder.


					<SecSooCom labStr={ SEC_TAB_ARR.find( ( secTabObj ) => secTabObj.icoNamStr === secNamStr )!.labStr } /> // What: Section Soon Component. Why: Each tab should lead somewhere while its section is built. How: This shows the open section's placeholder. // What: Non-Null Note. Why: Every section name has a tab. How: The ! reads the found tab as present.


				) }


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


