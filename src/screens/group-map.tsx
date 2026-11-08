


// #region Imports

import cssModObj from './group-map.module.css'; // What: CSS Module Object. Why: The section is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.


import { ageTexFun            } from '../utils/date.ts';        // What: Age Text Function. Why: Each shared location says how old it is. How: This labels the age.
import { AvaConCom            } from '../ui/member-avatar.tsx'; // What: Avatar Contents Component. Why: A member's avatar shows their profile photo, or their initials. How: This fills the circle.
import { beaDegFun            } from '../core/geo.ts';          // What: Bearing Degrees Function. Why: The plot and each row place a member in their direction from the viewer. How: This computes the bearing.
import { dayTimFun            } from '../utils/date.ts';        // What: Day Time Function. Why: The section says when sharing opens. How: This writes the weekday and time.
import { dirTexFun            } from '../core/geo.ts';          // What: Direction Text Function. Why: Each row says which way a member is. How: This names the compass direction.
import { disMetFun            } from '../core/geo.ts';          // What: Distance Meters Function. Why: The plot and each row place a member by how far away they are. How: This measures the distance.
import { disTexFun            } from '../core/geo.ts';          // What: Distance Text Function. Why: Each row and the plot's ring say a distance. How: This labels it.
import { eveLisFun            } from '../state/events.ts';      // What: Event List Function. Why: Sharing belongs to the event whose window is open. How: This lists the events, soonest first.
import { eveRanFun            } from '../utils/date.ts';        // What: Event Range Function. Why: The event's part says the hours it runs. How: This formats its range.
import { ideEnsFun            } from '../state/identity.ts';    // What: Identity Ensure Function. Why: The member's own share is the plot's center. How: This reads their UID.
import { iniTexFun            } from '../utils/text.ts';        // What: Initials Text Function. Why: Each avatar and dot shows its member's initials. How: This takes them from the name.
import { KEY_WAI_STR          } from '../state/groups.ts';      // What: Key Waiting String. Why: A group whose key hasn't been shared yet can't show its locations. How: The section shows this message then.
import { locWatFun            } from '../state/location.ts';    // What: Location Watch Function. Why: Members see each other move as updates arrive. How: This watches the shares.
import { memLisFun            } from '../state/members.ts';     // What: Member List Function. Why: Each share shows its member's name and color. How: This lists the members.
import { offGuaFun            } from '../ui/online.ts';         // What: Offline Guard Function. Why: Changes that need the server are paused while offline. How: This announces the pause and reports it.
import { shaGetFun            } from '../state/sharing.ts';     // What: Sharing Get Function. Why: The section shows where the member's sharing stands. How: This reads the record.
import { shaPosFun            } from '../state/sharing.ts';     // What: Sharing Post Function. Why: The member says they're on their way or have arrived. How: This posts it and marks the record.
import { shaStaFun            } from '../state/sharing.ts';     // What: Sharing Start Function. Why: The member opts in to sharing. How: This starts it.
import { shaStoFun            } from '../state/sharing.ts';     // What: Sharing Stop Function. Why: The member can stop sharing. How: This stops it and deletes their share.
import { shaSubFun            } from '../state/sharing.ts';     // What: Sharing Subscribe Function. Why: The section redraws when the record changes, even from elsewhere. How: This listens to it.
import { sloColFun            } from '../ui/member-color.ts';   // What: Slot Color Function. Why: Each avatar and dot wears its member's color. How: This names it.
import { useEffect            } from 'react';                   // What: Use Effect. Why: The section loads and watches while it's open, and focus moves once a post lands. How: This starts and stops the work.
import { useRef               } from 'react';                   // What: Use Reference. Why: Focus moves to the note that replaces a pressed button, and newcomers are spotted among the shares. How: This holds the note and the known UIDs.
import { useState             } from 'react';                   // What: Use State. Why: The events, shares, members, and messages change while the section is open. How: This holds each.
import { useSyncExternalStore } from 'react';                   // What: Use Sync External Store. Why: The sharing record lives outside React and changes from elsewhere. How: This reads it and redraws on each change.


import type { EveRecTyp } from '../state/events.ts';     // What: Event Record Type. Why: Sharing belongs to one of the group's events. How: This types each.
import type { GroRecTyp } from '../state/groups.ts';     // What: Group Record Type. Why: The section belongs to one group. How: This types it.
import type { LocRecTyp } from '../state/location.ts';   // What: Location Record Type. Why: The plot and the list show shared locations. How: This types each.
import type { MemRecTyp } from '../state/members.ts';    // What: Member Record Type. Why: Shares are looked up among the members. How: This types each.
import type { StaKinTyp } from '../core/chat-status.ts'; // What: Status Kind Type. Why: Leaving and arriving post the same way. How: This types which one.

// #endregion Imports



/**
 * group-map.tsx = Group Map
 *
 * @summary
 * The open group's Map section (ARCHITECTURE.md Section 10). From 3 hours
 * before an event starts until it ends, it offers sharing the member's
 * location, saying plainly how updates work, and "I'm on my way" and "I've
 * arrived", each posting a line to the chat. Below, it shows everyone
 * sharing: a plot drawn around the member once they share, and a list with
 * each member's distance and direction, an Arrived badge, how old their
 * position is, and a link that opens it in Google Maps. No street map is
 * drawn, so no other site learns where anyone is unless a member opens a
 * link. Outside an event's window, it says when sharing opens. Each change
 * is announced, and a change that fails says why.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Hooks
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type MapDatTyp = { eveRecArr : EveRecTyp[] | null, locErrStr : string, locRecArr : LocRecTyp[], memRecMap : Map< string, MemRecTyp >, nowTimNum : number, uidValStr : string }; // What: Map Data Type. Why: The section shows what its hook loads. How: This types the events, null until read, the watch's problem, the shares, the members by UID, the time now, and the member's UID.

// #endregion Types



// #region Constants

const FAI_MAP_STR = "That didn't go through. Check your connection and try again.";                    // What: Failure Map String. Why: A change that fails for another reason still has to be told. How: The alert shows this.
const LOC_DEN_STR = "Location is blocked for Come Hang. Allow it in your browser's settings, then try again."; // What: Location Denied String. Why: A blocked location can only be allowed by the member. How: The alert shows this.
const LOC_UNA_STR = "Your location couldn't be found. Try again in a moment.";                        // What: Location Unavailable String. Why: A fix can fail, such as indoors or with no signal. How: The alert shows this.
const LOC_UNS_STR = "This browser can't share a location.";                                            // What: Location Unsupported String. Why: A browser without location can't share. How: The alert shows this.
const MAP_URL_STR = 'https://www.google.com/maps/search/?api=1&query=';                                 // What: Map URL String. Why: A member's position opens in the phone's maps app only when someone asks. How: This is Google Maps' universal search address, which the coordinates follow.
const OPE_WIN_NUM = 3 * 3600000;                                                                        // What: Open Window Number. Why: Sharing opens 3 hours before an event starts (Section 5). How: This is 3 hours in milliseconds.
const PLO_RAD_NUM = 80;                                                                                 // What: Plot Radius Number. Why: The farthest member sits on the plot's ring, inside its edge. How: This is the ring's radius in the plot's own units.
const TIC_MIL_NUM = 30000;                                                                              // What: Tick Milliseconds Number. Why: Ages and the sharing window move with time. How: This redraws the section every 30 seconds.

// #endregion Constants



// #region Helpers

// #region geoErrFun

/**
 * geoErrFun = Geolocation Error Function
 *
 * @summary
 * Picks the message for a share that failed to start: blocked location, a
 * fix that couldn't be found or timed out, or any other failure. A
 * geolocation error is told by its numeric code.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param errCatObj - Error Catch Object: What the start rejected with.
 *
 * @returns The message to show.
 *
 * @example
 * ```ts
 * geoErrFun(errCatObj) // => "Your location couldn't be found. ..."
 * ```
 *
*/

const geoErrFun = ( errCatObj : unknown ) : string => { // What: Geolocation Error Function. Why: A failed share should say what the member can do. How: This reads the error's code.


	const errCodVal = typeof errCatObj === 'object' && errCatObj !== null && 'code' in errCatObj ? errCatObj.code : null; // What: Error Code Value. Why: A geolocation error names its kind by a number. How: This reads the code, null when there's none.


	if ( errCodVal === 1 ) return LOC_DEN_STR; // What: Denied Guard. Why: Code 1 means location is blocked. How: This returns its message.



	if ( errCodVal === 2 || errCodVal === 3 ) return LOC_UNA_STR; // What: Unavailable Guard. Why: Codes 2 and 3 mean no fix, or none in time. How: This returns their message.



	return FAI_MAP_STR; // What: Failure Return. Why: Anything else, such as a refused write, still has to be told. How: This returns the general message.


};

// #endregion geoErrFun

// #endregion Helpers



// #region Hooks

// #region useMapDatFun

/**
 * useMapDatFun = Use Map Data Function
 *
 * @summary
 * Loads the Map section's data for a group and keeps it current: the
 * events, the members, reread when a share's member isn't among them, the
 * member's UID, and the shares as they change, with the time now ticking
 * every 30 seconds. A watch that can't start says why, as when the group's
 * key is waiting to be shared. Everything stops when the section closes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group whose map it is.
 *
 * @returns The section's data.
 *
 * @example
 * ```ts
 * useMapDatFun('Xk3...') // => { eveRecArr, locRecArr, ... }
 * ```
 *
*/

const useMapDatFun = ( groIdeStr : string ) : MapDatTyp => { // What: Use Map Data Function. Why: The section's data comes from several places and changes while it's open. How: This loads each part and keeps the shares and the time current.


	const memUidRef = useRef( new Set< string >() ); // What: Member UID Reference. Why: A share from someone not yet read means they joined since. How: This holds the UIDs read so far.

	const [ eveRecArr, setEveRecArr ] = useState< EveRecTyp[] | null >( null );     // What: Event Record Array And Setter. Why: Sharing belongs to an event. How: This holds the events, null until read.
	const [ locErrStr, setLocErrStr ] = useState( '' );                              // What: Location Error String And Setter. Why: A watch that can't start says why. How: This holds the message, empty while it works.
	const [ locRecArr, setLocRecArr ] = useState< LocRecTyp[] >( [] );               // What: Location Record Array And Setter. Why: The plot and the list show the shares. How: This holds them.
	const [ memRecMap, setMemRecMap ] = useState( new Map< string, MemRecTyp >() );  // What: Member Record Map And Setter. Why: Each share looks its member up. How: This holds the members by UID.
	const [ nowTimNum, setNowTimNum ] = useState( Date.now() );                      // What: Now Time Number And Setter. Why: Ages and the sharing window move with time. How: This holds the time now, ticking forward.
	const [ uidValStr, setUidValStr ] = useState( '' );                              // What: UID Value String And Setter. Why: The member's own share is the plot's center. How: This holds their UID, empty until read.



	useEffect( () => { // What: Map Load Effect. Why: The section's parts load once it opens, and the watch and the tick run while it stays open. How: This starts each part and stops them on cleanup.


		let actValBoo = true;     // What: Active Value Boolean. Why: Work finishing after the section closed mustn't change it. How: This is true until the cleanup runs.
		let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once it has started. How: This holds it, doing nothing until then.



		const memLoaFun = () : void => void memLisFun( groIdeStr ).then( ( memRecArr ) => { // What: Member Load Function. Why: Shares are shown by name and color, and a newcomer has to be read in. How: This reads the members and keeps them by UID.


			memUidRef.current = new Set( memRecArr.map( ( memRecObj ) => memRecObj.uidValStr ) ); // What: Known UIDs Assignment. Why: Later shares are checked against the members read. How: This keeps their UIDs.

			if ( actValBoo ) setMemRecMap( new Map( memRecArr.map( ( memRecObj ) => [ memRecObj.uidValStr, memRecObj ] ) ) ); // What: Members Set Call. Why: Each share looks its member up. How: This keeps the members by UID.


		}, ( errCatObj : unknown ) => console.warn( errCatObj ) );



		const ticTimNum = window.setInterval( () => setNowTimNum( Date.now() ), TIC_MIL_NUM ); // What: Tick Timer Number. Why: Ages and the window move on while the section stays open. How: This sets the time now every 30 seconds.


		void eveLisFun( groIdeStr ).then( ( eveRecVal ) => { if ( actValBoo ) setEveRecArr( eveRecVal ); }, ( errCatObj : unknown ) => { console.warn( errCatObj ); if ( actValBoo ) setEveRecArr( [] ); } ); // What: Event Read Call. Why: Sharing belongs to the event whose window is open. How: This lists the events, soonest first, or none when they can't be read.

		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); } ); // What: UID Read Call. Why: The member's own share is the plot's center. How: This reads their UID.

		memLoaFun(); // What: Member Load Call. Why: Shares are shown by name and color. How: This reads the members.



		void locWatFun( groIdeStr, ( locRecVal ) => { // What: Watch Start Call. Why: Members see each other move as updates arrive. How: This watches the shares, rereading the members for one from a newcomer.


			if ( !actValBoo ) return; // What: Closed Guard. Why: The section may have closed. How: This ignores the shares.



			if ( locRecVal.some( ( locRecObj ) => !memUidRef.current.has( locRecObj.uidValStr ) ) ) memLoaFun(); // What: Newcomer Read Call. Why: A share's member not among those read joined after. How: This reads them again.

			setLocRecArr( locRecVal ); // What: Shares Set Call. Why: The plot and the list show them. How: This keeps them.


		} ).then( ( stoFunVal ) => { // What: Watch Started Handler. Why: The cleanup has to stop the watch, and a section closed first stops it at once. How: This keeps the stop, or calls it.


			if ( actValBoo ) stoWatFun = stoFunVal; // What: Stop Keep Call. Why: The cleanup stops the watch. How: This keeps the stop.

			else stoFunVal(); // What: Late Stop Call. Why: The section closed before the watch started. How: This stops it at once.


		}, ( errCatObj : unknown ) => { // What: Watch Failure Handler. Why: A watch that can't start, such as while the key waits to be shared, has to say so. How: This logs it and shows the waiting message, or a general one.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) setLocErrStr( errCatObj instanceof Error && errCatObj.message === KEY_WAI_STR ? KEY_WAI_STR : "Locations couldn't be loaded. Check your connection, then open the map again." ); // What: Watch Error Set Call. Why: The member should know why no one shows. How: This shows the waiting message for a waiting key, and otherwise a general one.


		} );



		return () => { // What: Map Cleanup. Why: Nothing should keep running once the section closes. How: This marks it closed and stops the watch and the tick.


			actValBoo = false; // What: Inactive Set. Why: Late results mustn't act. How: This marks the section closed.

			window.clearInterval( ticTimNum ); // What: Tick Clear Call. Why: The time needn't move on a closed section. How: This stops the tick.

			stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


		};


	}, [ groIdeStr ] ); // What: Effect Dependency Array. Why: Each group's map loads afresh. How: groIdeStr changes when another group's map opens.



	return { eveRecArr, locErrStr, locRecArr, memRecMap, nowTimNum, uidValStr }; // What: Map Data Return. Why: The section shows each part. How: This returns them.


};

// #endregion useMapDatFun

// #endregion Hooks



// #region Components

type MpcProTyp = { memRecMap : Map< string, MemRecTyp >, othLocArr : LocRecTyp[], ownLocObj : LocRecTyp }; // What: Map Plot Component Props Type. Why: The plot draws the others around the member. How: This types MapPloCom's props.

// #region MapPloCom

/**
 * MapPloCom = Map Plot Component
 *
 * @summary
 * Draws everyone sharing around the member, with north up: the member at
 * the center and each other member a dot in their color with their
 * initials, in their direction and at a distance scaled so the farthest
 * sits on the ring, nearer ones spread out by a square root. The caption
 * says how far the ring is, at least 50 meters. A screen reader hears a
 * summary, since the list below gives each member's distance and
 * direction.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.memRecMap - Member Record Map: The members by UID.
 * @param props.othLocArr - Other Location Array: The other members' shares.
 * @param props.ownLocObj - Own Location Object: The member's own share.
 *
 * @returns The plot.
 *
 * @example
 * ```tsx
 * MapPloCom({ memRecMap, othLocArr, ownLocObj }) // => <MapPloCom />
 * ```
 *
*/

function MapPloCom ( { memRecMap, othLocArr, ownLocObj } : MpcProTyp ) : React.JSX.Element {


	const dotPosArr = othLocArr.map( ( locRecObj ) => ( { beaDegNum : beaDegFun( ownLocObj, locRecObj ), disMetNum : disMetFun( ownLocObj, locRecObj ), locRecObj } ) ); // What: Dot Position Array. Why: Each dot sits by its member's direction and distance. How: This measures both for each share.

	const maxDisNum = Math.max( 50, ...dotPosArr.map( ( dotPosObj ) => dotPosObj.disMetNum ) ); // What: Maximum Distance Number. Why: The farthest member sits on the ring, and a ring of a few meters would only show the fixes' error. How: This takes the largest distance, at least 50 meters.



	return (


		<figure className={ cssModObj.mapPloFig }>{ /* What: Map Plot Figure Element. Why: The plot and its caption read as one. How: This holds the drawing above its caption. */ }


			<svg
				className={ cssModObj.mapPloSvg }

				viewBox='-100 -100 200 200'

				aria-label='Everyone sharing, placed around you with north up. Their distances and directions are listed below.'
				role='img'
			>{ /* What: Map Plot SVG Element. Why: A glance shows where everyone is around the member. How: This draws the rings, the north mark, the dots, and the member at the center. */ }


				<circle
					className={ cssModObj.ploRinCir }

					r={ PLO_RAD_NUM }
					strokeWidth={ 1 }
				/>{ /* What: Plot Ring Circle Element. Why: The ring marks the distance the caption gives. How: This draws it at the plot's radius. */ }

				<circle
					className={ cssModObj.ploRinCir }

					r={ PLO_RAD_NUM / 2 }
					strokeWidth={ 1 }
				/>{ /* What: Plot Ring Circle Element. Why: An inner ring helps judge the nearer dots. How: This draws it at half the radius, a quarter of the distance on the square root scale. */ }

				<text
					className={ cssModObj.ploNorTex }

					fontSize={ 10 }
					y={ -PLO_RAD_NUM - 8 }
				>N</text>{ /* What: Plot North Text Element. Why: The plot is drawn with north up, which the reader needs to know. How: This marks north above the ring. */ }



				{ dotPosArr.map( ( dotPosObj ) => { // What: Dot Map. Why: Each other member gets a dot. How: This places one per share.


					const memRecObj = memRecMap.get( dotPosObj.locRecObj.uidValStr );                    // What: Member Record Object. Why: The dot wears its member's color and initials. How: This looks them up, undefined for someone who left.
					const radValNum = PLO_RAD_NUM * Math.sqrt( dotPosObj.disMetNum / maxDisNum );          // What: Radius Value Number. Why: Nearer members spread out rather than bunching at the center. How: This scales the distance by a square root to the ring.
					const radBeaNum = dotPosObj.beaDegNum * Math.PI / 180;                                // What: Radian Bearing Number. Why: The position is worked out in radians. How: This converts the bearing.



					return ( // What: Dot Return. Why: Each member is one dot. How: This returns its group.


						<g
							key={ dotPosObj.locRecObj.uidValStr }

							transform={ `translate( ${ radValNum * Math.sin( radBeaNum ) } ${ -radValNum * Math.cos( radBeaNum ) } )` } // What: Dot Place Note. Why: North is up and east to the right. How: This moves the dot by the bearing's east and north parts, flipping north since the plot's y runs down.
						>{ /* What: Plot Dot Group Element. Why: A member's dot and initials move together. How: This places them at the member's spot. */ }


							<circle
								className={ cssModObj.ploDotCir }
								style={{ fill : memRecObj ? sloColFun( memRecObj.colSloNum ) : undefined }} // What: Dot Color Note. Why: Each member wears their own color, and someone who left keeps the plain look. How: This reads their slot's token.

								r={ 11 }
								strokeWidth={ 2 }
							/>{ /* What: Plot Dot Circle Element. Why: The dot marks the member. How: This draws a circle in their color. */ }

							<text
								className={ cssModObj.ploIniTex }

								fontSize={ 9 }
							>{ iniTexFun( memRecObj?.namTexStr || '?' ) }</text>{ /* What: Plot Initials Text Element. Why: The initials tell the dots apart. How: This centers them on the dot, or a question mark for someone with no name. */ }


						</g>


					);


				} ) }



				<circle
					className={ cssModObj.ploOwnCir }

					r={ 8 }
					strokeWidth={ 4 }
				/>{ /* What: Plot Own Circle Element. Why: The member is the center everyone's placed around. How: This draws them as a ringed accent dot. */ }


			</svg>

			<figcaption className={ cssModObj.ploCapFig }>The outer ring is { disTexFun( maxDisNum ) } from you.</figcaption>{ /* What: Plot Caption Figcaption Element. Why: The plot's scale changes with the farthest member. How: This says how far the ring is. */ }


		</figure>


	);


}

// #endregion MapPloCom



type GmcProTyp = { curGroObj : GroRecTyp }; // What: Group Map Component Props Type. Why: The section belongs to one group. How: This types GroMapCom's props.

// #region GroMapCom

/**
 * GroMapCom = Group Map Component
 *
 * @summary
 * Renders the open group's Map section. While an event's sharing window is
 * open, from 3 hours before it starts until it ends, a part for that event
 * explains sharing and offers it, then a stop once it runs, and offers
 * "I'm on my way" until it's said and "I've arrived" until that's said,
 * focus moving to the note that replaces each. A part listing everyone
 * sharing for the event follows, with the plot once the member shares.
 * Outside the window, the section says when it opens, or that no event is
 * coming up. Each change is announced, and a failure says why.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.curGroObj - Current Group Object: The open group.
 *
 * @returns The section.
 *
 * @example
 * ```tsx
 * GroMapCom({ curGroObj }) // => <GroMapCom />
 * ```
 *
*/

function GroMapCom ( { curGroObj } : GmcProTyp ) : React.JSX.Element {


	const focPosRef = useRef( false );                   // What: Focus Post Reference. Why: Focus moves to the note only after a post the member made. How: This is true while one is out.
	const posNotRef = useRef< HTMLParagraphElement >( null ); // What: Post Note Reference. Why: The note replaces the pressed button, so it takes focus. How: This holds its element.

	const [ errMesStr, setErrMesStr ] = useState( '' );    // What: Error Message String And Setter. Why: A change that fails is told. How: This holds the alert's text.
	const [ posKinStr, setPosKinStr ] = useState( '' );    // What: Post Kind String And Setter. Why: One post at a time, and its button says it's posting, while a share may start alongside, since a first fix can take a while. How: This holds the post under way, empty when none is.
	const [ shaBusBoo, setShaBusBoo ] = useState( false ); // What: Sharing Busy Boolean And Setter. Why: One start or stop at a time, and the button says it's working. How: This is true while one is out.
	const [ staMesStr, setStaMesStr ] = useState( '' );    // What: Status Message String And Setter. Why: A change that lands is announced. How: This holds the status's text.


	const { eveRecArr, locErrStr, locRecArr, memRecMap, nowTimNum, uidValStr } = useMapDatFun( curGroObj.ideStr ); // What: Map Data. Why: The section shows what the hook loads. How: This reads each part.

	const shaRecObj = useSyncExternalStore( shaSubFun, shaGetFun ); // What: Sharing Record Object. Why: The section shows where the member's sharing stands. How: This reads the record, redrawing on each change.


	const eveNexObj = eveRecArr?.find( ( eveRecObj ) => eveRecObj.endTimNum > nowTimNum ) ?? null;                           // What: Event Next Object. Why: The section says when the next event's sharing opens. How: This finds the first event that hasn't ended, or null.
	const eveOpeObj = eveNexObj && eveNexObj.staTimNum - OPE_WIN_NUM <= nowTimNum ? eveNexObj : null;                         // What: Event Open Object. Why: Sharing belongs to the next event once its window opens. How: This keeps the next event when its window is open, or null.
	const recEveObj = shaRecObj?.groIdeStr === curGroObj.ideStr && shaRecObj.eveIdeStr === eveOpeObj?.eveIdeStr ? shaRecObj : null; // What: Record Event Object. Why: Only a record for this event says where the member stands. How: This keeps the record when it's this event's, or null.

	const shaLocArr = locRecArr.filter( ( locRecObj ) => locRecObj.eveIdeStr === eveOpeObj?.eveIdeStr ); // What: Shared Location Array. Why: Only shares for the open event belong on its map. How: This keeps them.
	const ownLocObj = shaLocArr.find( ( locRecObj ) => locRecObj.uidValStr === uidValStr );              // What: Own Location Object. Why: The member's own share centers the plot and measures the others. How: This finds it, undefined when they aren't sharing.
	const othLocArr = shaLocArr.filter( ( locRecObj ) => locRecObj.uidValStr !== uidValStr );            // What: Other Location Array. Why: The plot draws the others around the member. How: This keeps everyone else's.



	useEffect( () => { // What: Post Focus Effect. Why: A pressed status button goes, and focus mustn't fall to the page. How: This focuses the note that replaces it, once the post the member made lands.


		if ( !focPosRef.current || !posNotRef.current ) return; // What: Owed Guard. Why: Only a post the member just made moves focus, and a share starting alongside can change the record before the note exists. How: This returns until the post is owed focus and its note is drawn.



		focPosRef.current = false; // What: Owed Clear. Why: Focus moves once. How: This clears the flag.

		posNotRef.current.focus(); // What: Note Focus Call. Why: The note replaces the pressed button. How: This focuses it.


	}, [ recEveObj?.arrBoo, recEveObj?.wayBoo ] ); // What: Effect Dependency Array. Why: Focus moves when a post lands. How: recEveObj?.arrBoo and recEveObj?.wayBoo change as each is marked.



	// #region shaTogFun

	/**
	 * shaTogFun = Sharing Toggle Function
	 *
	 * @summary
	 * Starts sharing for the open event, or stops it when it runs, ignoring a
	 * press while another start or stop is out. A start or stop is
	 * announced, and a failure says why, such as location being blocked.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the change is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * shaTogFun() // => Promise<void>
	 * ```
	 *
	*/

	const shaTogFun = async () : Promise< void > => { // What: Sharing Toggle Function. Why: One button starts and stops sharing, keeping focus as its label changes. How: This starts or stops it and tells the result.


		if ( !eveOpeObj || shaBusBoo ) return; // What: Busy Guard. Why: Sharing needs an open event, and one start or stop at a time. How: This ignores the press.



		if ( offGuaFun( setErrMesStr ) ) return; // What: Offline Guard. Why: A change that needs the server can't happen offline, and shouldn't hang or fail vaguely. How: This announces that it has to wait, and returns.



		if ( !( 'geolocation' in navigator ) ) { setErrMesStr( LOC_UNS_STR ); return; } // What: Unsupported Guard. Why: A browser without location can't share. How: This says so and stops.



		setShaBusBoo( true ); // What: Busy Set Call. Why: The button says it's working. How: This marks the change.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier problem no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next announcement should be heard afresh. How: This empties the status.



		try { // What: Toggle Try. Why: A start or stop can fail. How: This runs it and announces the result.


			if ( recEveObj?.shaBoo ) { await shaStoFun(); setStaMesStr( "You've stopped sharing your location." ); } // What: Stop Branch. Why: Sharing runs, so the press stops it. How: This stops it and announces it.

			else { await shaStaFun( curGroObj.ideStr, eveOpeObj.eveIdeStr, eveOpeObj.endTimNum ); setStaMesStr( `You're sharing your location with ${ curGroObj.namStr }.` ); } // What: Start Branch. Why: The member opts in. How: This starts sharing and announces it.


		}

		catch ( errCatObj ) { // What: Toggle Catch. Why: A failure has to be told. How: This logs it and shows why.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			setErrMesStr( geoErrFun( errCatObj ) ); // What: Failure Show Call. Why: The member should know what to do. How: This shows the message for the error.


		}



		setShaBusBoo( false ); // What: Busy Clear Call. Why: Sharing can change again. How: This clears the mark.


	};

	// #endregion shaTogFun



	// #region staPosFun

	/**
	 * staPosFun = Status Post Function
	 *
	 * @summary
	 * Says the member is on their way, or has arrived, for the open event,
	 * ignoring a press while another post is out. The post is announced,
	 * and focus then moves to the note replacing the button, through the post
	 * focus effect. A failure says so.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param staKinStr - Status Kind String: 'way' for leaving, 'arr' for
	 *                    arriving.
	 *
	 * @returns A promise that settles once the post is handled, with no
	 *          value.
	 *
	 * @example
	 * ```ts
	 * staPosFun('way') // => Promise<void>
	 * ```
	 *
	*/

	const staPosFun = async ( staKinStr : StaKinTyp ) : Promise< void > => { // What: Status Post Function. Why: Leaving and arriving post to the chat (Section 10). How: This posts and announces it.


		if ( !eveOpeObj || posKinStr !== '' ) return; // What: Busy Guard. Why: A post needs an open event, and one post at a time. How: This ignores the press.



		if ( offGuaFun( setErrMesStr ) ) return; // What: Offline Guard. Why: A change that needs the server can't happen offline, and shouldn't hang or fail vaguely. How: This announces that it has to wait, and returns.



		setPosKinStr( staKinStr ); // What: Busy Set Call. Why: The button says it's posting. How: This marks the post.

		setErrMesStr( '' ); // What: Error Clear Call. Why: An earlier problem no longer applies. How: This empties the alert.

		setStaMesStr( '' ); // What: Status Clear Call. Why: The next announcement should be heard afresh. How: This empties the status.


		focPosRef.current = true; // What: Focus Owed Set. Why: The record changes as the post lands, before this function resumes, so the effect must already know. How: This owes the note focus.



		try { // What: Post Try. Why: A post can fail. How: This posts and announces it.


			await shaPosFun( curGroObj.ideStr, eveOpeObj.eveIdeStr, eveOpeObj.endTimNum, staKinStr ); // What: Post Call. Why: The group sees it in the chat. How: This posts and marks the record.

			setStaMesStr( staKinStr === 'arr' ? "Posted to the chat that you've arrived." : "Posted to the chat that you're on the way." ); // What: Posted Announce Call. Why: The member should hear it landed. How: This announces it.


		}

		catch ( errCatObj ) { // What: Post Catch. Why: A failure has to be told, and the button stays. How: This logs it, shows why, and clears the owed focus.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			focPosRef.current = false; // What: Focus Owed Clear. Why: The button stays, keeping focus. How: This clears the flag.

			setErrMesStr( FAI_MAP_STR ); // What: Failure Show Call. Why: The member should know it didn't go through. How: This shows the message.


		}



		setPosKinStr( '' ); // What: Busy Clear Call. Why: The member can post again. How: This clears the mark.


	};

	// #endregion staPosFun



	return (


		<div className={ cssModObj.groMapDiv }>{ /* What: Group Map Div Element. Why: The event's sharing and everyone sharing read top to bottom. How: This stacks the heading and the parts inside the gutter. */ }


			<h2 className={ cssModObj.mapTitHea }>Map</h2>{ /* What: Map Title Heading Element. Why: The section needs a heading. How: This names it. */ }



			{ eveRecArr === null ? ( // What: Events Loaded Check. Why: Until the events are read, the window isn't known. How: This says they're being checked, then the event's parts or when sharing opens.


				<p className={ cssModObj.mapNotPar }>Checking for an event…</p> // What: Map Note Paragraph Element. Why: An empty section would read as broken. How: This says the events are being checked.


			) : eveOpeObj === null ? ( // What: Window Closed Check. Why: Sharing opens only near an event. How: This says when it opens, or that no event is coming.


				<p className={ cssModObj.mapNotPar }>{ eveNexObj ? `Sharing opens 3 hours before ${ eveNexObj.titTexStr } starts, on ${ dayTimFun( eveNexObj.staTimNum - OPE_WIN_NUM ) }.` : 'No event is coming up. Plan one in Events, and sharing opens 3 hours before it starts.' }</p> // What: Map Note Paragraph Element. Why: The member should know when they can share. How: This names the next event and when its window opens, or says there's none.


			) : ( // What: Window Open Branch. Why: The event's window is open. How: This shows its part and everyone sharing.


				<>{ /* What: Open Window Fragment. Why: The two parts sit in the section as its own children. How: This groups them without adding an element. */ }


					<section
						className={ cssModObj.mapEveSec }

						aria-labelledby='mapEveHea'
					>{ /* What: Map Event Section Element. Why: Sharing, leaving, and arriving belong to the event. How: This holds its heading, hours, note, and buttons. */ }


						<h3
							id='mapEveHea'

							className={ cssModObj.eveTitHea }
						>{ eveOpeObj.titTexStr }</h3>{ /* What: Event Title Heading Element. Why: The part is named for its event. How: This shows the event's title. */ }

						<p className={ cssModObj.eveRanPar }>{ eveRanFun( eveOpeObj.staTimNum, eveOpeObj.endTimNum ) }</p>{ /* What: Event Range Paragraph Element. Why: The hours say how long sharing lasts. How: This shows them. */ }

						<p className={ cssModObj.eveNotPar }>{ recEveObj?.shaBoo ? 'You’re sharing your location. Keep Come Hang open with the screen on to share as you move, or it updates when you open the app.' : "Share your location so the group can find you. It updates as you move while Come Hang is open with the screen on, and otherwise when you open the app or say you've arrived. Only the group can see it, and it's deleted when the event ends." }</p>{ /* What: Event Note Paragraph Element. Why: The member should know plainly how sharing works before and while they share (Section 10). How: This says it, by whether they're sharing. */ }



						<div className={ cssModObj.eveActDiv }>{ /* What: Event Actions Div Element. Why: The event's buttons sit together, wrapping when the screen is narrow. How: This holds them in a row. */ }


							<button
								className={ cssModObj.actPlaBut }

								type='button'

								onClick={ () => void shaTogFun() }
							>{ shaBusBoo ? 'Working…' : recEveObj?.shaBoo ? 'Stop sharing' : 'Share my location' }</button>{ /* What: Action Plain Button Element. Why: One button starts and stops sharing, and keeps focus as its label changes. How: This toggles it, reading "Working…" while the change is out. */ }


							{ !recEveObj?.wayBoo && !recEveObj?.arrBoo && ( // What: Way Check. Why: Leaving is said once, and not after arriving. How: This offers it until either is said.


								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => void staPosFun( 'way' ) }
								>{ posKinStr === 'way' ? 'Posting…' : "I'm on my way" }</button> // What: Action Plain Button Element. Why: Leaving is a tap, since the app can't watch a phone's position in the background (Section 10). How: This posts it, reading "Posting…" while it's out.


							) }

							{ !recEveObj?.arrBoo && ( // What: Arrive Check. Why: Arriving is said once. How: This offers it until it's said.


								<button
									className={ cssModObj.actPlaBut }

									type='button'

									onClick={ () => void staPosFun( 'arr' ) }
								>{ posKinStr === 'arr' ? 'Posting…' : "I've arrived" }</button> // What: Action Plain Button Element. Why: Arriving tells the group and marks the share (Section 10). How: This posts it, reading "Posting…" while it's out.


							) }


						</div>



						{ ( recEveObj?.wayBoo || recEveObj?.arrBoo ) && ( // What: Post Note Check. Why: Once the member says where they are, the note replaces the button. How: This shows it after a post.


							<p
								ref={ posNotRef }

								className={ cssModObj.evePosPar }

								tabIndex={ -1 } // What: Note Tab Index. Why: Focus moves here once it replaces a button, but the note isn't a control. How: This lets it take focus from a script without joining the Tab order.
							>{ recEveObj.arrBoo ? "You've told the group you've arrived." : "You've told the group you're on the way." }</p> // What: Event Post Paragraph Element. Why: The member should see what they've said. How: This says it, arriving over leaving.


						) }


					</section>



					<section
						className={ cssModObj.mapPeoSec }

						aria-labelledby='mapPeoHea'
					>{ /* What: Map People Section Element. Why: Everyone sharing reads as one part. How: This holds its heading, the plot, and the list. */ }


						<h3
							id='mapPeoHea'

							className={ cssModObj.peoTitHea }
						>Who's sharing</h3>{ /* What: People Title Heading Element. Why: The part needs a heading. How: This names it. */ }



						{ locErrStr !== '' ? ( // What: Watch Error Check. Why: A watch that can't start says why. How: This shows the reason in place of the list.


							<p className={ cssModObj.peoNotPar }>{ locErrStr }</p> // What: People Note Paragraph Element. Why: The member should know why no one shows. How: This shows the reason.


						) : shaLocArr.length === 0 ? ( // What: No Shares Check. Why: An empty list says so. How: This says no one is sharing.


							<p className={ cssModObj.peoNotPar }>No one is sharing yet.</p> // What: People Note Paragraph Element. Why: An empty part should say so. How: This says no one is sharing.


						) : ( // What: Shares Branch. Why: Someone is sharing. How: This shows the plot and the list.


							<>{ /* What: Shares Fragment. Why: The plot, the note, and the list sit in the part as its own children. How: This groups them without adding an element. */ }


								{ ownLocObj ? ( // What: Plot Check. Why: The plot is drawn around the member, so it needs their share. How: This draws it, or says sharing shows how far everyone is.


									<MapPloCom
										memRecMap={ memRecMap }
										othLocArr={ othLocArr }
										ownLocObj={ ownLocObj }
									/> // What: Map Plot Component. Why: A glance shows where everyone is around the member. How: This draws the plot.


								) : ( // What: Not Sharing Branch. Why: Without the member's own share there's no center to measure from. How: This says so.


									<p className={ cssModObj.peoNotPar }>Share your location to see how far away everyone is.</p> // What: People Note Paragraph Element. Why: The member should know why distances are missing. How: This says sharing shows them.


								) }



								<ul className={ cssModObj.peoLisUno }>{ /* What: People List Unordered List Element. Why: Each member sharing gets a row with the details the plot can't hold. How: This lists them, the member first. */ }


									{ [ ...( ownLocObj ? [ ownLocObj ] : [] ), ...othLocArr ].map( ( locRecObj ) => { // What: Share Map. Why: Each member sharing gets a row. How: This renders the member's own share first, then the others'.


										const memRecObj = memRecMap.get( locRecObj.uidValStr );                                  // What: Member Record Object. Why: The row shows its member. How: This looks them up, undefined for someone who left.
										const ownRowBoo = locRecObj.uidValStr === uidValStr;                                     // What: Own Row Boolean. Why: The member's own row says "You" and needs no distance or link. How: This compares the share with them.
										const namValStr = memRecObj?.namTexStr || ( memRecObj ? 'Someone' : 'Former member' );   // What: Name Value String. Why: A row names its member, even one with no name yet or who left. How: This takes their name, or a stand-in.
										const disValNum = ownLocObj && !ownRowBoo ? disMetFun( ownLocObj, locRecObj ) : null; // What: Distance Value Number. Why: The row says how far the member is, when the viewer shares too. How: This measures it, or null.

										const wayTexStr = disValNum === null || !ownLocObj ? '' : `${ disTexFun( disValNum ) }${ disValNum < 10 ? '' : ` ${ dirTexFun( beaDegFun( ownLocObj, locRecObj ) ) }` } · `; // What: Way Text String. Why: The row says how far and which way the member is. How: This gives the distance and compass direction, or "nearby" alone, followed by a dot, or nothing without a distance.



										return ( // What: Row Return. Why: Each share is one row. How: This returns its list item.


											<li
												key={ locRecObj.uidValStr }

												className={ cssModObj.peoRowIte }
											>{ /* What: People Row Item Element. Why: A row shows who, whether they've arrived, where, how fresh, and a way to open their spot. How: This lays the avatar beside the name and details, with the link below. */ }


												<span
													className={ cssModObj.peoAvaSpa }
													style={{ backgroundColor : memRecObj ? sloColFun( memRecObj.colSloNum ) : undefined }} // What: Avatar Color Note. Why: Each member wears their own color, matching their dot, and someone who left keeps the plain look. How: This reads their slot's token.

													aria-hidden='true'
												>{ /* What: People Avatar Span Element. Why: An avatar in the member's color ties the row to their dot. How: This shows their photo or initials, hidden from screen readers, which read the name. */ }


													<AvaConCom
														className={ cssModObj.peoAvaIma }

														avaIdeStr={ memRecObj?.avaIdeStr ?? '' }
														avaIvaArr={ memRecObj?.avaIvaArr ?? null }
														groIdeStr={ curGroObj.ideStr }
														iniTexStr={ iniTexFun( ownRowBoo ? 'You' : namValStr ) }
														uidValStr={ locRecObj.uidValStr }
													/>{ /* What: Avatar Contents Component. Why: A member with a profile photo is shown by it, and anyone else by their initials (Section 21). How: This fills the circle with the photo once it loads, or the initials. */ }


												</span>

												<p className={ cssModObj.peoNamPar }>{ ownRowBoo ? 'You' : namValStr }{ locRecObj.arrBoo && <span className={ cssModObj.peoArrSpa }>Arrived</span> }</p>{ /* What: People Name Paragraph Element. Why: The row names its member, and says when they've arrived. How: This shows the name, with an Arrived badge once they have. */ }

												<p className={ cssModObj.peoDetPar }>{ wayTexStr }updated { ageTexFun( locRecObj.updTimNum, nowTimNum ) }</p>{ /* What: People Details Paragraph Element. Why: The row says where the member is and how old that is, so an old position never passes for live (Section 10). How: This shows the distance and direction when known, then the age. */ }



												{ !ownRowBoo && ( // What: Link Check. Why: The member knows where they are. How: This offers the link on everyone else's row.


													<a
														className={ cssModObj.peoMapAnc }

														href={ `${ MAP_URL_STR }${ locRecObj.latNum },${ locRecObj.lngNum }` }
														rel='noopener noreferrer'
														target='_blank'
													>Open in Google Maps<span className={ cssModObj.visHidSpa }> for { namValStr }</span></a> // What: People Map Anchor Element. Why: Finding someone sometimes needs a real street map, opened only when asked so no other site learns a position otherwise. How: This opens their spot in Google Maps in a new tab, naming them for a screen reader.


												) }


											</li>


										);


									} ) }


								</ul>


							</>


						) }


					</section>


				</>


			) }



			<p
				className={ cssModObj.mapStaPar }

				role='status'
			>{ staMesStr }</p>{ /* What: Map Status Paragraph Element. Why: A change that lands is announced, since the page itself changes silently. How: This holds the status, empty from the first render. */ }

			<p
				className={ cssModObj.mapErrPar }

				role='alert'
			>{ errMesStr }</p>{ /* What: Map Error Paragraph Element. Why: A change that fails has to be told at once. How: This holds the alert, empty from the first render. */ }


		</div>


	);


}

// #endregion GroMapCom

// #endregion Components



// #region Exports

export { GroMapCom }; // What: Named Export. Why: The group frame shows the open group's Map section. How: This exports GroMapCom.

// #endregion Exports


