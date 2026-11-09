


// #region Imports

import briDarUrl from './bring-dark.webp';   // What: Bring Dark URL. Why: Stop 3 shows the bring-list in dark mode. How: This is the image's built address.
import briLigUrl from './bring-light.webp';  // What: Bring Light URL. Why: Stop 3 shows the bring-list. How: This is the image's built address.
import chaDarUrl from './chat-dark.webp';    // What: Chat Dark URL. Why: Stop 1 shows the chat in dark mode. How: This is the image's built address.
import chaLigUrl from './chat-light.webp';   // What: Chat Light URL. Why: Stop 1 shows the chat. How: This is the image's built address.
import cssModObj from './route.module.css';  // What: CSS Module Object. Why: The route is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.
import eveDarUrl from './events-dark.webp';  // What: Events Dark URL. Why: Stop 2 shows the Events section in dark mode. How: This is the image's built address.
import eveLigUrl from './events-light.webp'; // What: Events Light URL. Why: Stop 2 shows the Events section. How: This is the image's built address.
import mapDarUrl from './map-dark.webp';     // What: Map Dark URL. Why: Stop 4 shows the Map in dark mode. How: This is the image's built address.
import mapLigUrl from './map-light.webp';    // What: Map Light URL. Why: Stop 4 shows the Map. How: This is the image's built address.


import { redMotFun } from '../../utils/motion.ts';    // What: Reduced Motion Function. Why: The route's motion follows the scroll, which a stylesheet can't stop. How: This checks the preference first.
import { sloColFun } from '../../ui/member-color.ts'; // What: Slot Color Function. Why: The gathering group wears members' colors, as in the app. How: This turns a slot into its color.
import { useEffect } from 'react';                    // What: Use Effect. Why: The route is measured and follows the scroll once it's drawn. How: This sets that up and tears it down.
import { useRef    } from 'react';                    // What: Use Reference. Why: The route updates its drawing without rendering again. How: This holds its elements.

// #endregion Imports



/**
 * route.tsx = Landing Route
 *
 * @summary
 * The landing page's route through a get-together (ARCHITECTURE.md Section
 * 14): four stops, talking it over, picking the day, who's bringing what,
 * and finding each other, each with its headline, its sentence, and the
 * app's screen, then the arrival. A dotted line wiggles down a spine of
 * numbered pins from the first stop to a check pin at the arrival, drawing
 * itself as the page scrolls, each pin dropping in as the line reaches it.
 * Five members join at the stops, one at the first and more at the later
 * ones, and follow just behind the line's tip, then line up under "You're
 * all here." once it arrives. On a phone the spine runs down the left with
 * each screenshot centered below its stop; from 720px wide the stops' text
 * and screenshots alternate sides of a central spine.
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

/**
 * AVA_REC_ARR = Avatar Record Array
 *
 * @summary
 * The gathering group, in the order they join. Each row gives the member's
 * initial, their color slot, matching the demo group's screenshots, and the
 * stop, counted from 0, where they join.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const AVA_REC_ARR = [ // What: Avatar Record Array. Why: The group gathers along the route, as in the screenshots. How: This lists each member's initial, color slot, and joining stop.


	{ iniStr : 'A', sloNum : 0, stoNum : 0 }, // What: Alex Row. Why: Alex starts the plan. How: This joins at the first stop.
	{ iniStr : 'D', sloNum : 1, stoNum : 1 }, // What: Dana Row. Why: Dana joins once there's a day. How: This joins at the second stop.
	{ iniStr : 'M', sloNum : 2, stoNum : 1 }, // What: Maya Row. Why: Maya joins with Dana. How: This joins at the second stop.
	{ iniStr : 'J', sloNum : 3, stoNum : 2 }, // What: Jordan Row. Why: Jordan joins with the speaker. How: This joins at the third stop.
	{ iniStr : 'S', sloNum : 4, stoNum : 3 }  // What: Sam Row. Why: Sam joins on the day. How: This joins at the last stop.


];

/**
 * STO_REC_ARR = Stop Record Array
 *
 * @summary
 * The route's stops, in order. Each row gives the stop's headline, its
 * sentence, its screenshot's light and dark addresses, and the screenshot's
 * alt text.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const STO_REC_ARR = [ // What: Stop Record Array. Why: Every stop is drawn the same way. How: This lists each one's words and screenshot.


	{ // What: Talk Stop Row. Why: A get-together starts in the chat. How: This describes the first stop.


		altStr : 'The Lake Weekend chat, with Lake day pinned at the top and the group planning it.',
		darUrl : chaDarUrl,
		ligUrl : chaLigUrl,
		texStr : 'Float ideas and hash out the details together, with your next plan pinned at the top of the chat.',
		titStr : 'Talk it over'


	},

	{ // What: Day Stop Row. Why: The plan gets a day. How: This describes the second stop.


		altStr : "The Events section, listing Lake day at Miller's Cove and Game night at Dana's place.",
		darUrl : eveDarUrl,
		ligUrl : eveLigUrl,
		texStr : 'Set the time and place where everyone can see it, and change it when plans shift.',
		titStr : 'Pick the day'


	},

	{ // What: Bring Stop Row. Why: The bring-list sorts who brings what. How: This describes the third stop.


		altStr : "Lake day's bring-list: burgers, buns, watermelon, and a speaker claimed, sunscreen and ice open.",
		darUrl : briDarUrl,
		ligUrl : briLigUrl,
		texStr : 'List what you need and let people claim it, so nobody shows up with the fifth bag of chips.',
		titStr : "Who's bringing what"


	},

	{ // What: Find Stop Row. Why: On the day, everyone finds each other. How: This describes the last stop.


		altStr : 'The Map, with four members around you at different distances while you share your location.',
		darUrl : mapDarUrl,
		ligUrl : mapLigUrl,
		texStr : "On the day, share where you are, see who's on the way, and know when everyone's arrived.",
		titStr : 'Find each other'


	}


];

// #endregion Constants



// #region Components

// #region LanRouCom

/**
 * LanRouCom = Landing Route Component
 *
 * @summary
 * Renders the route's section: its heading, the stops, the arrival, and the
 * gathering group. Once drawn, it measures the pins, builds the line through
 * them, and follows the scroll: the line is drawn up to a tip that moves as
 * the route passes the middle of the screen, each pin drops in once the tip
 * reaches it, and each member pops in at their stop once the tip does, then
 * trails it, until all of them line up under the arrival's heading. It
 * measures again whenever the route changes size. Under reduced motion the
 * line is drawn whole, the pins are in place, and each member sits just past
 * their stop. Without a script the stops and pins show without the line.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The route's section.
 *
 * @example
 * ```tsx
 * LanRouCom() // => <LanRouCom />
 * ```
 *
*/

function LanRouCom () : React.JSX.Element {


	const arrHeaRef = useRef< HTMLHeadingElement >( null );   // What: Arrival Heading Reference. Why: The group lines up under it. How: This holds it.
	const avaEleRef = useRef< ( HTMLSpanElement | null )[] >( [] ); // What: Avatar Element Reference. Why: Each member moves along the line. How: This holds their elements in order.
	const linPatRef = useRef< SVGPathElement >( null );       // What: Line Path Reference. Why: The dotted line is drawn through the pins. How: This holds it.
	const masPatRef = useRef< SVGPathElement >( null );       // What: Mask Path Reference. Why: The line shows only up to its tip. How: This holds the mask's path.
	const rouDivRef = useRef< HTMLDivElement >( null );       // What: Route Div Reference. Why: Everything is measured against the route. How: This holds it.
	const svgEleRef = useRef< SVGSVGElement >( null );        // What: SVG Element Reference. Why: The line's drawing space matches the route. How: This holds it.



	useEffect( () => { // What: Route Drawing Effect. Why: The line, the pins, and the group follow the scroll. How: This measures the route, draws it for the current scroll, and redraws on scroll and resize until cleanup.


		const rouCurEle = rouDivRef.current; // What: Route Current Element. Why: Everything is measured against it. How: This reads it.
		const linCurEle = linPatRef.current; // What: Line Current Element. Why: The line's length places the pins and the group. How: This reads it.
		const masCurEle = masPatRef.current; // What: Mask Current Element. Why: The tip is drawn through the mask. How: This reads it.
		const svgCurEle = svgEleRef.current; // What: SVG Current Element. Why: Its drawing space is sized to the route. How: This reads it.


		if ( !rouCurEle || !linCurEle || !masCurEle || !svgCurEle ) return; // What: Missing Guard. Why: Nothing can be drawn before the elements exist. How: This returns.



		const redValBoo = redMotFun(); // What: Reduced Value Boolean. Why: Someone who asked for less motion sees the finished route. How: This reads the preference once.

		const pinEleArr = [ ...rouCurEle.querySelectorAll< HTMLElement >( '[data-route-pin]' ) ]; // What: Pin Element Array. Why: The line runs through every pin, the arrival's last. How: This finds them by their role attribute, in order.

		let linLenNum = 0;            // What: Line Length Number. Why: The tip and the group are placed along the line. How: This holds its length, set when measured.
		let pinLenArr : number[] = []; // What: Pin Length Array. Why: A pin drops, and a member joins, once the tip reaches its stop. How: This holds each pin's distance along the line.
		let rafIdeNum = 0;            // What: Animation Frame Identifier Number. Why: Scroll events come faster than frames. How: This holds the frame a redraw waits for, 0 when none.



		// #region Route Measuring

		const meaRouFun = () : void => { // What: Measure Route Function. Why: The line has to run through the pins wherever the layout puts them. How: This reads each pin's center, builds the curve, and finds each pin's distance along it.


			const rouRecObj = rouCurEle.getBoundingClientRect(); // What: Route Rect Object. Why: Pins are placed relative to the route. How: This reads its box.

			const pinCenArr = pinEleArr.map( ( pinCurEle ) => { const pinRecObj = pinCurEle.getBoundingClientRect(); return [ pinRecObj.left - rouRecObj.left + pinRecObj.width / 2, pinRecObj.top - rouRecObj.top + pinRecObj.height / 2 ]; } ); // What: Pin Center Array. Why: The line passes through each pin's middle. How: This reads each center in the route's space.
			const wigOffNum = Math.min( 90, rouRecObj.width * 0.12 );                                                                                                                                                                                   // What: Wiggle Offset Number. Why: The line sways between pins rather than running straight. How: This is how far it swings, narrower on a phone.


			svgCurEle.setAttribute( 'viewBox', `0 0 ${ rouRecObj.width } ${ rouRecObj.height }` ); // What: View Box Call. Why: The drawing space matches the route pixel for pixel. How: This sizes it.

			const curPatStr = pinCenArr.slice( 1 ).reduce( ( patAccStr, [ xcoEndNum, ycoEndNum ], pinIndNum ) => { const [ xcoStaNum, ycoStaNum ] = pinCenArr[ pinIndNum ]; const sidValNum = pinIndNum % 2 ? -1 : 1; return `${ patAccStr } C ${ xcoStaNum + sidValNum * wigOffNum } ${ ycoStaNum + ( ycoEndNum - ycoStaNum ) * 0.35 }, ${ xcoEndNum - sidValNum * wigOffNum } ${ ycoStaNum + ( ycoEndNum - ycoStaNum ) * 0.65 }, ${ xcoEndNum } ${ ycoEndNum }`; }, `M ${ pinCenArr[ 0 ][ 0 ] } ${ pinCenArr[ 0 ][ 1 ] }` ); // What: Curve Path String. Why: The line wiggles from pin to pin. How: This joins one curve per pair, swinging to alternate sides.


			linCurEle.setAttribute( 'd', curPatStr ); // What: Line Path Call. Why: The dotted line follows the curve. How: This sets its path.
			masCurEle.setAttribute( 'd', curPatStr ); // What: Mask Path Call. Why: The mask follows the same curve. How: This sets its path.


			linLenNum = linCurEle.getTotalLength(); // What: Line Length Assignment. Why: The tip and the group are placed along it. How: This reads its length.

			masCurEle.style.strokeDasharray = String( linLenNum ); // What: Mask Dash Call. Why: The mask shows the line up to the tip with one dash. How: This makes the dash as long as the line.



			pinLenArr = pinCenArr.map( ( [ xcoPinNum, ycoPinNum ] ) => { // What: Pin Length Assignment. Why: Each pin's place along the line decides when it drops. How: This finds the point on the line nearest each pin.


				let besLenNum = 0;        // What: Best Length Number. Why: The nearest point so far. How: This starts at the line's start.
				let besDisNum = Infinity; // What: Best Distance Number. Why: The nearest point's distance so far. How: This starts at infinity.



				for ( let curLenNum = 0; curLenNum <= linLenNum; curLenNum += 4 ) { // What: Sample Loop. Why: The nearest point is found by stepping along the line. How: This checks a point every 4 pixels.


					const curPoiObj = linCurEle.getPointAtLength( curLenNum );                                     // What: Current Point Object. Why: Each sample is a point on the line. How: This reads it.
					const curDisNum = ( curPoiObj.x - xcoPinNum ) ** 2 + ( curPoiObj.y - ycoPinNum ) ** 2; // What: Current Distance Number. Why: The nearest sample wins. How: This is its squared distance from the pin.


					if ( curDisNum >= besDisNum ) continue; // What: Farther Skip. Why: Only a nearer point counts. How: This moves on.



					besDisNum = curDisNum; // What: Best Distance Assignment. Why: This point is the nearest so far. How: This keeps its distance.
					besLenNum = curLenNum; // What: Best Length Assignment. Why: This point is the nearest so far. How: This keeps its place.


				}



				return besLenNum; // What: Pin Length Return. Why: The pin's place along the line. How: This returns the nearest point's.


			} );


		};

		// #endregion Route Measuring



		// #region Route Drawing

		const plaAvaFun = ( avaCurEle : HTMLSpanElement, xcoValNum : number, ycoValNum : number ) : void => { avaCurEle.style.transform = `translate( ${ xcoValNum }px, ${ ycoValNum }px )`; }; // What: Place Avatar Function. Why: Each member moves to a point in the route's space. How: This translates their element there.



		const draRouFun = () : void => { // What: Draw Route Function. Why: The route reflects how far the page has scrolled. How: This draws the line to its tip, drops the pins it has reached, and places the group.


			rafIdeNum = 0; // What: Frame Clear Assignment. Why: The next scroll may ask for another frame. How: This marks none waiting.


			const rouRecObj = rouCurEle.getBoundingClientRect();                                                                                     // What: Route Rect Object. Why: The tip follows where the route sits on screen. How: This reads its box.
			const proValNum = Math.min( 1, Math.max( 0, ( window.innerHeight * 0.6 - rouRecObj.top ) / rouRecObj.height ) );                          // What: Progress Value Number. Why: The line reaches each part of the route as it passes just below the middle of the screen. How: This is how far through the route that line is, from 0 to 1.
			const tipLenNum = redValBoo ? linLenNum : proValNum * linLenNum;                                                                          // What: Tip Length Number. Why: The line is drawn up to its tip, whole under reduced motion. How: This is the tip's distance along the line.
			const arrRecObj = arrHeaRef.current?.getBoundingClientRect();                                                                             // What: Arrival Rect Object. Why: The group lines up under the arrival's heading. How: This reads its box.
			const arrDonBoo = !redValBoo && tipLenNum >= linLenNum - 1;                                                                               // What: Arrived Done Boolean. Why: Once the line arrives, the group lines up. How: This is true when the tip has reached the end.
			const joiAvaArr = AVA_REC_ARR.filter( ( avaRecObj ) => redValBoo || tipLenNum >= pinLenArr[ avaRecObj.stoNum ] - 2 );                      // What: Joined Avatar Array. Why: A member shows once the tip reaches their stop. How: This keeps those who have joined, in order.


			masCurEle.style.strokeDashoffset = String( linLenNum - tipLenNum ); // What: Mask Offset Call. Why: The line shows up to its tip. How: This slides the mask's dash to end there.

			pinEleArr.forEach( ( pinCurEle, pinIndNum ) => pinCurEle.toggleAttribute( 'data-route-pin-shown', redValBoo || tipLenNum >= pinLenArr[ pinIndNum ] - 2 ) ); // What: Pin Drop Call. Why: Each pin drops in as the line reaches it. How: This marks each pin the tip has passed.



			AVA_REC_ARR.forEach( ( avaRecObj, avaIndNum ) => { // What: Avatar Loop. Why: Each member is placed by whether they've joined and whether the line has arrived. How: This places and shows or hides each one.


				const avaCurEle = avaEleRef.current[ avaIndNum ]; // What: Avatar Current Element. Why: The member's element moves. How: This reads it.
				const joiIndNum = joiAvaArr.indexOf( avaRecObj ); // What: Joined Index Number. Why: Members trail the tip in the order they joined. How: This is their place, -1 before joining.


				if ( !avaCurEle ) return; // What: Missing Guard. Why: Nothing to place before it's drawn. How: This returns.



				avaCurEle.toggleAttribute( 'data-route-avatar-shown', joiIndNum >= 0 ); // What: Avatar Show Call. Why: A member pops in once they've joined. How: This marks them shown.



				if ( arrDonBoo && arrRecObj ) { plaAvaFun( avaCurEle, arrRecObj.left - rouRecObj.left + joiIndNum * avaCurEle.offsetWidth * 0.8, arrRecObj.bottom - rouRecObj.top + avaCurEle.offsetHeight * 0.3 ); return; } // What: Arrived Branch. Why: Once the line arrives, the group lines up under the arrival's heading. How: This places each in an overlapping row and ends there.



				const stoLenNum = pinLenArr[ avaRecObj.stoNum ];                                                                                 // What: Stop Length Number. Why: Before joining, or under reduced motion, a member waits at their stop. How: This is the stop's distance along the line.
				const avaLenNum = joiIndNum < 0 || redValBoo ? stoLenNum + avaCurEle.offsetWidth * ( redValBoo ? 1.2 + joiIndNum * 0.2 : 0 ) : tipLenNum - avaCurEle.offsetWidth * ( 0.3 + joiIndNum ); // What: Avatar Length Number. Why: A waiting member sits at their stop, just past it under reduced motion, and a joined one trails the tip in order. How: This is their distance along the line.
				const avaPoiObj = linCurEle.getPointAtLength( Math.max( 0, Math.min( linLenNum, avaLenNum ) ) );                                 // What: Avatar Point Object. Why: The member sits on the line. How: This reads the point there.


				plaAvaFun( avaCurEle, avaPoiObj.x - avaCurEle.offsetWidth / 2, avaPoiObj.y - avaCurEle.offsetHeight / 2 ); // What: Avatar Place Call. Why: The member is centered on their point. How: This places them there.


			} );


		};



		const reqDraFun = () : void => { if ( rafIdeNum === 0 ) rafIdeNum = requestAnimationFrame( draRouFun ); }; // What: Request Draw Function. Why: The route redraws at most once a frame. How: This asks for a frame unless one is waiting.

		// #endregion Route Drawing



		const resObsObj = new ResizeObserver( () => { meaRouFun(); reqDraFun(); } ); // What: Resize Observer Object. Why: Fonts, images, and the screen's width move the pins. How: This measures and redraws whenever the route changes size.


		rouCurEle.toggleAttribute( 'data-route-drawing-active', true ); // What: Drawing Mark Call. Why: The pins wait to drop only once the script draws the route. How: This marks the route as drawn by script.

		resObsObj.observe( rouCurEle ); // What: Observe Call. Why: The route is measured as it changes size. How: This watches it.

		window.addEventListener( 'scroll', reqDraFun, { passive : true } ); // What: Scroll Listener Call. Why: The route follows the scroll. How: This redraws on each scroll, at most once a frame.



		return () => { // What: Route Cleanup. Why: Nothing should keep drawing once the page is gone. How: This stops the observer, the listener, and any waiting frame.


			resObsObj.disconnect(); // What: Disconnect Call. Why: The route is no longer measured. How: This stops the observer.

			window.removeEventListener( 'scroll', reqDraFun ); // What: Listener Remove Call. Why: The route no longer follows the scroll. How: This removes the listener.

			cancelAnimationFrame( rafIdeNum ); // What: Frame Cancel Call. Why: A waiting redraw belongs to a page that's gone. How: This cancels it.


		};


	}, [] ); // What: Effect Dependency Array. Why: The route is set up once, and measures itself as it changes. How: The empty array runs the effect once.



	return (


		<section className={ cssModObj.rouSecSec }>{ /* What: Route Section Section Element. Why: The page walks through a get-together. How: This holds the heading and the route. */ }


			<h2 className={ cssModObj.rouTitHea }>From "we should hang out" to "I'm here."</h2>{ /* What: Route Title Heading Element. Why: The route runs from the first idea to arriving. How: This says so as its heading. */ }



			<div
				ref={ rouDivRef }

				className={ cssModObj.rouBodDiv }
			>{ /* What: Route Body Div Element. Why: The line, the stops, the arrival, and the group share one space. How: This holds them, the line and the group placed over the stops. */ }


				<svg
					ref={ svgEleRef }

					className={ cssModObj.rouLinSvg }

					aria-hidden='true'
				>{ /* What: Route Line SVG Element. Why: The dotted line is decoration over the stops. How: This holds it and its mask, hidden from screen readers. */ }


					<defs>{ /* What: Route Definitions Element. Why: The mask is defined once. How: This holds it. */ }


						<mask
							id='rouLinMas'

							maskUnits='userSpaceOnUse'
						>{ /* What: Route Line Mask Element. Why: The line shows only up to its tip. How: This masks it with a solid stroke dashed to the tip. */ }


							<path
								ref={ masPatRef }

								className={ cssModObj.rouMasPat }
							/>{ /* What: Route Mask Path Element. Why: The solid stroke reveals the line. How: This follows the line's curve. */ }


						</mask>


					</defs>



					<path
						ref={ linPatRef }

						className={ cssModObj.rouLinPat }

						mask='url(#rouLinMas)'
					/>{ /* What: Route Line Path Element. Why: The route reads as a dotted path on a map. How: This draws the dotted curve through the pins, shown through the mask. */ }


				</svg>



				<ol className={ cssModObj.rouStoOrd }>{ /* What: Route Stops Ordered Element. Why: The stops come in order. How: This lists them down the route. */ }


					{ STO_REC_ARR.map( ( stoRecObj, stoIndNum ) => ( // What: Stop Map. Why: Each stop is drawn the same way. How: This renders one item per row, keyed by its headline.


						<li
							key={ stoRecObj.titStr }

							className={ cssModObj.rouStoIte }
						>{ /* What: Route Stop Item Element. Why: A stop holds its pin, its words, and its screen. How: This places them along the spine. */ }


							<span
								className={ cssModObj.rouPinSpa }

								data-route-pin

								aria-hidden='true'
							><span className={ cssModObj.rouNumSpa }>{ stoIndNum + 1 }</span></span>{ /* What: Route Pin Span Element. Why: Each stop is a numbered pin on the route, which the list's own numbering already gives screen readers. How: This draws the pin with its number, hidden from screen readers. */ }



							<div className={ cssModObj.rouTexDiv }>{ /* What: Route Text Div Element. Why: The stop's headline and sentence read together. How: This stacks them beside the pin. */ }


								<h3 className={ cssModObj.rouStoHea }>{ stoRecObj.titStr }</h3>{ /* What: Route Stop Heading Element. Why: Each stop has a headline. How: This sets it. */ }

								<p className={ cssModObj.rouStoPar }>{ stoRecObj.texStr }</p>{ /* What: Route Stop Paragraph Element. Why: Each stop says plainly what the app does there. How: This says it. */ }


							</div>



							<picture className={ cssModObj.rouPhoPic }>{ /* What: Route Phone Picture Element. Why: Each stop shows the app's screen for it. How: This picks the dark screenshot in dark mode. */ }


								<source
									media='(prefers-color-scheme: dark)'
									srcSet={ stoRecObj.darUrl }
								/>{ /* What: Route Dark Source Element. Why: The screenshot follows the visitor's dark mode. How: This offers the dark one there. */ }

								<img
									className={ cssModObj.rouPhoIma }

									alt={ stoRecObj.altStr }
									height='1266' // What: Image Height. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic height.
									loading='lazy'
									src={ stoRecObj.ligUrl }
									width='585' // What: Image Width. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic width.
								/>{ /* What: Route Phone Image Element. Why: The screenshot fills its phone. How: This draws it, fetched as it nears the screen. */ }


							</picture>


						</li>


					) ) }


				</ol>



				<div className={ cssModObj.rouArrDiv }>{ /* What: Route Arrival Div Element. Why: The route ends with everyone there. How: This holds the check pin and the heading. */ }


					<span
						className={ ` ${ cssModObj.rouPinSpa }   ${ cssModObj.rouPinSpaArrive } ` }

						data-route-pin

						aria-hidden='true'
					><span className={ cssModObj.rouNumSpa }>✓</span></span>{ /* What: Route Pin Span Element. Why: The route ends at a check pin in the accent. How: This draws it, hidden from screen readers. */ }

					<h3
						ref={ arrHeaRef }

						className={ cssModObj.rouArrHea }
					>You're all here.</h3>{ /* What: Route Arrival Heading Element. Why: The route ends with everyone arriving. How: This says so at a stop's size. */ }


				</div>



				{ AVA_REC_ARR.map( ( avaRecObj, avaIndNum ) => ( // What: Avatar Map. Why: The group gathers along the route. How: This renders one avatar per member, keyed by their initial.


					<span
						key={ avaRecObj.iniStr }
						ref={ ( avaCurEle ) => { avaEleRef.current[ avaIndNum ] = avaCurEle; } } // What: Avatar Reference Callback. Why: The script moves each avatar. How: This keeps the element in the member's place.

						className={ cssModObj.rouAvaSpa }
						style={{ backgroundColor : sloColFun( avaRecObj.sloNum ) }} // What: Member Color Note. Why: Each member wears their color, as in the app. How: The slot reads one of the member color tokens.

						aria-hidden='true'
					>{ avaRecObj.iniStr }</span> // What: Route Avatar Span Element. Why: A member of the gathering group, decoration beside the route. How: This draws their initial on their color, hidden from screen readers.


				) ) }


			</div>


		</section>


	);


}

// #endregion LanRouCom

// #endregion Components



// #region Exports

export { LanRouCom }; // What: Named Export. Why: The landing page draws the route. How: This exports LanRouCom.

// #endregion Exports


