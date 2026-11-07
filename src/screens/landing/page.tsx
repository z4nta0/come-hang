


// #region Imports

import briDarUrl from './bring-dark.webp';  // What: Bring Dark URL. Why: The hero shows the bring-list in dark mode. How: This is the image's built address.
import briLigUrl from './bring-light.webp'; // What: Bring Light URL. Why: The hero shows the bring-list. How: This is the image's built address.
import chaDarUrl from './chat-dark.webp';   // What: Chat Dark URL. Why: The hero shows the chat in dark mode. How: This is the image's built address.
import chaLigUrl from './chat-light.webp';  // What: Chat Light URL. Why: The hero shows the chat. How: This is the image's built address.
import cssModObj from './page.module.css';  // What: CSS Module Object. Why: The landing page is styled in its own module, whose class names Vite hashes. How: Every element reads its class from this object.
import mapDarUrl from './map-dark.webp';    // What: Map Dark URL. Why: The hero shows the Map in dark mode. How: This is the image's built address.
import mapLigUrl from './map-light.webp';   // What: Map Light URL. Why: The hero shows the Map. How: This is the image's built address.


import { BraMarCom    } from '../../ui/brand-mark.tsx';   // What: Brand Mark Component. Why: The page leads with the app's mark. How: This draws it beside the name.
import { ButBasCom    } from '../../ui/button.tsx';       // What: Button Base Component. Why: Starting a group is the page's main action. How: This draws it as the main action button.
import { DEL_STO_STR  } from '../../state/deletion.ts';   // What: Deleted Storage String. Why: The page says the data is gone after a deletion starts the app over. How: This names the note the deletion leaves.
import { IcoSvgCom    } from '../../ui/icon.tsx';         // What: Icon SVG Component. Why: Each promise in the trust section has an icon. How: This draws one.
import { InsNotCom    } from '../../ui/install-note.tsx'; // What: Install Note Component. Why: A browser that can install the app suggests it under the install section. How: This shows the note while the browser offers its prompt.
import { LanRouCom    } from './route.tsx';               // What: Landing Route Component. Why: The page walks through a get-together along a route. How: This draws the route and its stops.
import { LegLinCom    } from '../../legal/links.tsx';     // What: Legal Links Component. Why: Starting or joining a group means agreeing to the terms and the policy. How: This draws the line linking both.
import { MaiAreCom    } from '../../ui/main-area.tsx';    // What: Main Area Component. Why: The page is the screen's main content. How: This holds it in the main landmark.
import { useEffect    } from 'react';                     // What: Use Effect. Why: A deletion's note is read once the page is drawn. How: This runs once.
import { useId        } from 'react';                     // What: Use Identifier. Why: Each question's button names the answer it opens. How: This makes a unique ID for it.
import { useRecGroFun } from '../group-recovery.ts';      // What: Use Recover Groups Function. Why: Someone on a new phone gets their groups back from here. How: This returns the recovery, its progress, and its alert's text.
import { useScrBacFun } from '../../ui/screen.ts';        // What: Use Screen Back Function. Why: Opened from an invite, the page leads back to joining. How: This returns the function that steps back.
import { useScrOpeFun } from '../../ui/screen.ts';        // What: Use Screen Open Function. Why: Starting a group and joining with a link open their own screens. How: This returns the function that opens a screen.
import { useState     } from 'react';                     // What: Use State. Why: A deletion's note and each question's open state change while the page shows. How: This holds each.

// #endregion Imports



/**
 * page.tsx = Landing Page
 *
 * @summary
 * The page a phone holding no identity sees at the app's root (ARCHITECTURE.md
 * Section 14), and the one crawlers read: a hero with the app's mark and
 * name, the headline, the pitch, starting a group, joining with an invite
 * link, and getting groups back on a new phone; the trust section with what
 * stays private; the route through a get-together; how a group starts; the
 * free tier beside the upgrade; installing; a few questions; a closing call
 * to start a group; and a footer with the legal pages and the support email.
 * Nothing on it starts Firebase until the visitor acts, and after a deletion
 * it says the data is gone. Opened from an invite's "What is Come Hang?", its
 * actions lead back to joining the group instead.
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
 * FAQ_REC_ARR = Frequently Asked Question Record Array
 *
 * @summary
 * The questions the page answers, in order. Each row holds the question as
 * its button reads and the answer it opens.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const FAQ_REC_ARR = [ // What: Frequently Asked Question Record Array. Why: The page answers the questions a newcomer asks first. How: This lists each question with its answer.


	{ // What: Free Question Row. Why: Price is the first question. How: This answers it.


		ansStr : 'Yes. Chat, events, bring-lists, photos, and location sharing are free for everyone. The one-time upgrade only raises how many groups you can start, and how many people and photos they hold.',
		queStr : 'Is it really free?'


	},

	{ // What: Lost Phone Question Row. Why: With no account, people wonder what a lost phone costs them. How: This answers it.


		ansStr : "Link a Google account in Settings, and your groups come back on a new device. Earlier chat comes back if a friend's device still has it and sends it.",
		queStr : 'What if I lose my device?'


	},

	{ // What: Location Question Row. Why: Location sharing makes people careful. How: This answers it.


		ansStr : 'Only your group, only around an event, and only while you choose to share it.',
		queStr : 'Who can see my location?'


	},

	{ // What: Groups Question Row. Why: People belong to more than one circle. How: This answers it.


		ansStr : 'Yes. You can be in up to 10 groups for free, and 20 with the upgrade.',
		queStr : 'Can I be in more than one group?'


	}


];



const FAQ_COL_ARR = [ FAQ_REC_ARR.slice( 0, Math.ceil( FAQ_REC_ARR.length / 2 ) ), FAQ_REC_ARR.slice( Math.ceil( FAQ_REC_ARR.length / 2 ) ) ]; // What: Frequently Asked Question Column Array. Why: The questions sit in two columns on a wide screen, each its own list, so opening an answer lengthens only its column. How: This splits the questions in half, the first column taking the extra one when their number is odd.

// #endregion Constants



// #region Components

type FicProTyp = { ansStr : string, queStr : string }; // What: Frequently Asked Item Component Props Type. Why: Each question shows its own words and answer. How: This types FaqIteCom's props.

// #region FaqIteCom

/**
 * FaqIteCom = Frequently Asked Item Component
 *
 * @summary
 * Renders one question as a heading holding a button that opens and closes
 * its answer below, the button saying whether it's open, and the answer
 * growing into place and closing the same way.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.ansStr - Answer String: The answer.
 * @param props.queStr - Question String: The question.
 *
 * @returns The question's list item.
 *
 * @example
 * ```tsx
 * FaqIteCom({ ansStr, queStr }) // => <FaqIteCom />
 * ```
 *
*/

function FaqIteCom ( { ansStr, queStr } : FicProTyp ) : React.JSX.Element {


	const ansIdeStr = useId(); // What: Answer Identifier String. Why: The button names the answer it opens. How: This makes a unique ID for it.

	const [ opeValBoo, setOpeValBoo ] = useState( false ); // What: Open Value Boolean And Setter. Why: Each answer opens on its own. How: This starts closed.



	return (


		<li className={ cssModObj.faqIteIte }>{ /* What: FAQ Item Item Element. Why: Each question is one entry of the list. How: This holds its heading and answer. */ }


			<h3 className={ cssModObj.faqQueHea }>{ /* What: FAQ Question Heading Element. Why: Each question is a heading under the section's, so it can be found by heading. How: This holds its button. */ }


				<button
					className={ cssModObj.faqQueBut }

					type='button'

					aria-controls={ ansIdeStr }
					aria-expanded={ opeValBoo }

					onClick={ () => setOpeValBoo( !opeValBoo ) }
				>{ queStr }</button>{ /* What: FAQ Question Button Element. Why: The answer opens on a tap, and says whether it's open. How: This toggles it. */ }


			</h3>



			<div
				id={ ansIdeStr }

				className={ cssModObj.faqAnsDiv }

				data-answer-open-active={ opeValBoo || undefined }
				inert={ !opeValBoo } // What: Answer Inert Note. Why: A closed answer shouldn't be read or reached, yet stays drawn so it can close smoothly. How: This makes it inert while closed.
			>{ /* What: FAQ Answer Div Element. Why: The answer grows into place below its question. How: This holds it, open while the attribute is set. */ }


				<p className={ cssModObj.faqAnsPar }>{ ansStr }</p>{ /* What: FAQ Answer Paragraph Element. Why: The answer is clipped while its row grows. How: This holds its words. */ }


			</div>


		</li>


	);


}

// #endregion FaqIteCom



type LpcProTyp = { invNamStr? : string, onRecFun : () => void }; // What: Landing Page Component Props Type. Why: Opened from an invite the page leads back to joining its group, and an identity brought back from Google is handed to the screen host. How: This types LanPagCom's props.

// #region LanPagCom

/**
 * LanPagCom = Landing Page Component
 *
 * @summary
 * Renders the landing page in the screen's main area, then its footer. The
 * hero's headline is the screen's one h1. "Start a group" opens the screen
 * for starting one, "Join with an invite link" the screen for pasting one,
 * each as a new history entry, and "Get my groups back" signs in with Google
 * through its popup, its label reading "Signing in…" meanwhile, then calls
 * onRecFun; a sign-in that doesn't go through is announced through the
 * alert. A note left by a deletion is announced through the status once the
 * page is drawn, then cleared. The closing band's button starts a group too.
 * When invNamStr is given, as when the invite form opened the page, the
 * hero's only action and the closing band's button read "Back to joining"
 * the group and step back to the form, and getting groups back isn't
 * offered.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.invNamStr - Invite Name String: The group the invite form is
 *                          for, empty when it isn't known, or none when the
 *                          page wasn't opened from an invite.
 * @param props.onRecFun  - On Recover Function: Called once an identity is
 *                          brought back onto this phone.
 *
 * @returns The page's main area and footer.
 *
 * @example
 * ```tsx
 * LanPagCom({ invNamStr, onRecFun }) // => <LanPagCom />
 * ```
 *
*/

function LanPagCom ( { invNamStr, onRecFun } : LpcProTyp ) : React.JSX.Element {


	const scrBacFun = useScrBacFun(); // What: Screen Back Function. Why: Opened from an invite, the page steps back to the form. How: This reads the function that steps back.
	const scrOpeFun = useScrOpeFun(); // What: Screen Open Function. Why: The buttons open other screens. How: This reads the function that opens one.

	const invBacStr = `Back to joining ${ invNamStr || 'the group' }`; // What: Invite Back String. Why: The way back names the group the invite is for. How: This builds the label, naming the group generally when its name isn't known.

	const { errMesStr, recGroFun, recReqBoo } = useRecGroFun( onRecFun ); // What: Error Message String. Why: A sign-in that doesn't go through is announced. How: This reads the alert's text. // What: Recover Groups Function. Why: The recover button runs it. How: This reads it. // What: Recover Request Boolean. Why: The button says it's working. How: This reads whether a sign-in is out.
	const [ staMesStr, setStaMesStr ]           = useState( '' );            // What: Status Message String And Setter. Why: A deletion that started the app over is announced. How: This holds the status's text, empty when there's none.



	useEffect( () => { // What: Deleted Note Effect. Why: The app just started over after a deletion, which leaves no identity, so the page shows. How: This announces the note once and clears it, so a reload doesn't say it again.


		if ( sessionStorage.getItem( DEL_STO_STR ) === null ) return; // What: No Note Guard. Why: Most visits follow no deletion. How: This returns.



		sessionStorage.removeItem( DEL_STO_STR ); // What: Note Clear Call. Why: The note is said once. How: This removes it.

		setStaMesStr( 'Your data has been deleted from Come Hang and this device.' ); // What: Status Set Call. Why: The person should know the deletion finished. How: This announces it.


	}, [] ); // What: Effect Dependency Array. Why: The note is read once, when the page opens. How: The empty array runs the effect once.



	return (


		<>{ /* What: Landing Page Fragment. Why: The page's main area and its footer sit side by side. How: This groups them without a wrapper. */ }


			<MaiAreCom className={ cssModObj.lanPagMai }>{ /* What: Landing Page Main Area Component. Why: The page is the screen's main content. How: This stacks its sections down the screen. */ }


				<section className={ cssModObj.herSecSec }>{ /* What: Hero Section Section Element. Why: The page opens with what Come Hang is and how to start. How: This holds the text beside the screenshots, stacking them on a phone. */ }


					<div className={ cssModObj.herTexDiv }>{ /* What: Hero Text Div Element. Why: The name, headline, pitch, and actions read as one column. How: This stacks them. */ }


						<p className={ cssModObj.herBraPar }>{ /* What: Hero Brand Paragraph Element. Why: The page leads with the app's mark and name. How: This sets them side by side. */ }


							<BraMarCom className={ cssModObj.herMarSvg } />{ /* What: Hero Mark SVG Element. Why: The mark makes the app recognizable. How: This draws it before the name. */ }

							<span className={ cssModObj.herNamSpa }>Come Hang</span>{ /* What: Hero Name Span Element. Why: The name sits beside the mark as the wordmark. How: This sets it. */ }


						</p>



						<h1 className={ cssModObj.herTitHea }>{ /* What: Hero Title Heading Element. Why: The page's one h1 says what Come Hang is for in three beats. How: This sets each beat on its own line in its own color. */ }


							<span className={ cssModObj.herOneSpa }>Plans made.</span>{ ' ' }<span className={ cssModObj.herTwoSpa }>Fun had.</span>{ ' ' }<span className={ cssModObj.herThrSpa }>Memories created.</span>{ /* What: Hero One Span Element. Why: The first beat is the plan. How: This sets it in ink. */ }{ /* What: Hero Two Span Element. Why: The second beat is the get-together. How: This sets it in periwinkle. */ }{ /* What: Hero Three Span Element. Why: The last beat is what stays. How: This sets it in coral. */ }{ /* What: Space Note. Why: Each beat sits on its own line, but the heading's name has to read as three sentences. How: A space between each beat keeps them apart when read, which a line break in the code would drop. */ }


						</h1>



						<p className={ cssModObj.herPitPar }>Plan get-togethers with your group in one place: chat, set the date, see who's bringing what, and find each other on the day of the event.</p>{ /* What: Hero Pitch Paragraph Element. Why: A first visitor should know what the app does. How: This says it in one sentence. */ }

						<p
							className={ cssModObj.herStaPar }

							role='status'
						>{ staMesStr }</p>{ /* What: Hero Status Paragraph Element. Why: A deletion that started the app over should be told, and a status added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message after a deletion. */ }



						<div className={ cssModObj.herActDiv }>{ /* What: Hero Actions Div Element. Why: Starting and joining sit together. How: This sets them in a row that wraps onto two lines at about 360px wide and below, where each fills its line so both match. */ }


							{ invNamStr === undefined ? ( // What: Invite Mode Check. Why: Opened from an invite, the page's one action leads back to joining. How: This shows starting and joining normally, and the way back otherwise.


								<>{ /* What: Normal Actions Fragment. Why: Starting and joining sit side by side. How: This groups them without a wrapper. */ }


									<ButBasCom
										className={ cssModObj.herStaBut }

										onClick={ () => scrOpeFun( { scrStr : 'create' } ) }
									>Start a group</ButBasCom>{ /* What: Hero Start Button Component. Why: Starting a group is how someone begins. How: This opens the screen for starting one. */ }



									<button
										className={ cssModObj.herJoiBut }

										type='button'

										onClick={ () => scrOpeFun( { scrStr : 'paste' } ) }
									>Join with an invite link</button>{ /* What: Hero Join Button Element. Why: Someone sent a link can join with it here, which on an installed iPhone app is the only way an invite reaches the app. How: This opens the screen for pasting the link. */ }


								</>

							) : <ButBasCom onClick={ scrBacFun }>{ invBacStr }</ButBasCom> }{ /* What: Hero Back Button Component. Why: Someone who came from an invite carries on joining. How: This steps back to the invite form. */ }


						</div>



						{ invNamStr === undefined && <p className={ cssModObj.herRecPar }>New device? <button className={ cssModObj.herRecBut } type='button' onClick={ () => void recGroFun() }>{ recReqBoo ? 'Signing in…' : 'Get my groups back' }</button></p> }{ /* What: Hero Recover Paragraph Element. Why: Someone who used the app on another phone brings their groups here, a smaller action than starting or joining, and not while an invite waits. How: This asks the question and offers the button, which signs in with Google, reading "Signing in…" meanwhile. */ }

						<p
							className={ cssModObj.herErrPar }

							role='alert'
						>{ errMesStr }</p>{ /* What: Hero Error Paragraph Element. Why: A sign-in that doesn't go through has to be told at once, and an alert added only when it speaks is often missed. How: This is in the page and empty from the start, and gains the message when one fails. */ }

						<LegLinCom
							className={ cssModObj.herLegPar }

							actStr='starting or joining a group'
						/>{ /* What: Legal Links Component. Why: The page is where someone first starts or joins a group, and the home page has to link the privacy policy. How: This says doing so means agreeing to the terms and the policy, linking both, below the actions. */ }


					</div>



					<div
						className={ cssModObj.herColDiv }

						aria-hidden='true'
					>{ /* What: Hero Collage Div Element. Why: Three of the app's screens show what it looks like, and the route below describes each, so they're hidden from screen readers here. How: This leans three phones against each other. */ }


						<picture className={ cssModObj.herPhoPic }>{ /* What: Hero Phone Picture Element. Why: The first phone shows the bring-list. How: This picks the dark screenshot in dark mode. */ }


							<source
								media='(prefers-color-scheme: dark)'
								srcSet={ briDarUrl }
							/>{ /* What: Bring Dark Source Element. Why: The screenshot follows the visitor's dark mode. How: This offers the dark one there. */ }

							<img
								className={ cssModObj.herPhoIma }

								alt=''
								height='1266' // What: Image Height. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic height.
								src={ briLigUrl }
								width='585' // What: Image Width. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic width.
							/>{ /* What: Hero Phone Image Element. Why: The screenshot fills its phone. How: This draws it. */ }


						</picture>



						<picture className={ cssModObj.herPhoPic }>{ /* What: Hero Phone Picture Element. Why: The middle phone shows the chat. How: This picks the dark screenshot in dark mode. */ }


							<source
								media='(prefers-color-scheme: dark)'
								srcSet={ chaDarUrl }
							/>{ /* What: Chat Dark Source Element. Why: The screenshot follows the visitor's dark mode. How: This offers the dark one there. */ }

							<img
								className={ cssModObj.herPhoIma }

								alt=''
								height='1266' // What: Image Height. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic height.
								src={ chaLigUrl }
								width='585' // What: Image Width. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic width.
							/>{ /* What: Hero Phone Image Element. Why: The screenshot fills its phone. How: This draws it. */ }


						</picture>



						<picture className={ cssModObj.herPhoPic }>{ /* What: Hero Phone Picture Element. Why: The last phone shows the Map. How: This picks the dark screenshot in dark mode. */ }


							<source
								media='(prefers-color-scheme: dark)'
								srcSet={ mapDarUrl }
							/>{ /* What: Map Dark Source Element. Why: The screenshot follows the visitor's dark mode. How: This offers the dark one there. */ }

							<img
								className={ cssModObj.herPhoIma }

								alt=''
								height='1266' // What: Image Height. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic height.
								src={ mapLigUrl }
								width='585' // What: Image Width. Why: The page shouldn't shift while the image loads. How: This gives its intrinsic width.
							/>{ /* What: Hero Phone Image Element. Why: The screenshot fills its phone. How: This draws it. */ }


						</picture>


					</div>


				</section>



				<section className={ cssModObj.truSecSec }>{ /* What: Trust Section Section Element. Why: Chat, plans, and locations make people careful, so what stays private comes right after the hero. How: This holds the promises on a raised band. */ }


					<div className={ cssModObj.truInnDiv }>{ /* What: Trust Inner Div Element. Why: The band runs full width while its content keeps the page's width. How: This holds the heading, the promises, and the link. */ }


						<h2 className={ cssModObj.truTitHea }>Your group's plans stay with your group.</h2>{ /* What: Trust Title Heading Element. Why: The section's point is said first. How: This sets it as the heading. */ }



						<ul className={ cssModObj.truLisUno }>{ /* What: Trust List Unordered Element. Why: Each promise stands on its own. How: This lists them, two to a row from 720px wide and one below. */ }


							<li className={ cssModObj.truIteIte }>{ /* What: Trust Item Item Element. Why: Encryption is the first promise. How: This holds its icon, title, and sentence. */ }


								<span className={ cssModObj.truIcoSpa }><IcoSvgCom icoNamStr='lock' sizSteStr='bas' /></span>{ /* What: Trust Icon Span Element. Why: An icon marks each promise at a glance. How: This sets a lock in a tinted square. */ }

								<h3 className={ cssModObj.truIteHea }>Encrypted on your device</h3>{ /* What: Trust Item Heading Element. Why: Each promise has a short name. How: This sets it. */ }

								<p className={ cssModObj.truItePar }>Messages, events, bring-lists, names, and locations are locked on your device before they're sent. We can't read them.</p>{ /* What: Trust Item Paragraph Element. Why: The promise is said plainly and exactly. How: This says it. */ }


							</li>



							<li className={ cssModObj.truIteIte }>{ /* What: Trust Item Item Element. Why: Deleting what's delivered is the second promise. How: This holds its icon, title, and sentence. */ }


								<span className={ cssModObj.truIcoSpa }><IcoSvgCom icoNamStr='trash' sizSteStr='bas' /></span>{ /* What: Trust Icon Span Element. Why: An icon marks each promise at a glance. How: This sets a bin in a tinted square. */ }

								<h3 className={ cssModObj.truIteHea }>Gone once delivered</h3>{ /* What: Trust Item Heading Element. Why: Each promise has a short name. How: This sets it. */ }

								<p className={ cssModObj.truItePar }>Messages wait on our server only until everyone in your group has them, then they're deleted. Events disappear 2 days after they end.</p>{ /* What: Trust Item Paragraph Element. Why: The promise is said plainly and exactly. How: This says it. */ }


							</li>



							<li className={ cssModObj.truIteIte }>{ /* What: Trust Item Item Element. Why: Sharing a location by choice is the third promise. How: This holds its icon, title, and sentence. */ }


								<span className={ cssModObj.truIcoSpa }><IcoSvgCom icoNamStr='map' sizSteStr='bas' /></span>{ /* What: Trust Icon Span Element. Why: An icon marks each promise at a glance. How: This sets a map pin in a tinted square. */ }

								<h3 className={ cssModObj.truIteHea }>Location only when it counts</h3>{ /* What: Trust Item Heading Element. Why: Each promise has a short name. How: This sets it. */ }

								<p className={ cssModObj.truItePar }>It's your choice whether to share it, starting 3 hours before an event. No history is kept, and it's deleted within the hour.</p>{ /* What: Trust Item Paragraph Element. Why: The promise is said plainly and exactly. How: This says it. */ }


							</li>



							<li className={ cssModObj.truIteIte }>{ /* What: Trust Item Item Element. Why: No account and no ads is the last promise. How: This holds its icon, title, and sentence. */ }


								<span className={ cssModObj.truIcoSpa }><IcoSvgCom icoNamStr='block' sizSteStr='bas' /></span>{ /* What: Trust Icon Span Element. Why: An icon marks each promise at a glance. How: This sets a crossed circle in a tinted square. */ }

								<h3 className={ cssModObj.truIteHea }>No account, no ads</h3>{ /* What: Trust Item Heading Element. Why: Each promise has a short name. How: This sets it. */ }

								<p className={ cssModObj.truItePar }>No email, no password, no tracking, and no ads.</p>{ /* What: Trust Item Paragraph Element. Why: The promise is said plainly and exactly. How: This says it. */ }


							</li>


						</ul>



						<p className={ cssModObj.truSeePar }><a className={ cssModObj.truSeeAnc } href='/privacy' rel='noopener noreferrer' target='_blank'>See exactly what our server can see</a></p>{ /* What: Trust See Paragraph Element. Why: Being upfront about the little the server reads builds more trust than a blanket claim. How: This links the privacy policy, which lists it, in a new tab. */ }


					</div>


				</section>



				<LanRouCom />{ /* What: Landing Route Component. Why: The page walks through a get-together, from talking it over to everyone arriving. How: This draws the route and its four stops. */ }



				<section className={ cssModObj.staSecSec }>{ /* What: Starts Section Section Element. Why: People want to know how their friends get in. How: This holds the three steps. */ }


					<h2 className={ cssModObj.secTitHea }>Up and running in a minute</h2>{ /* What: Section Title Heading Element. Why: The section's point is said first. How: This sets it as the heading. */ }



					<ol className={ cssModObj.staLisOrd }>{ /* What: Starts List Ordered Element. Why: Starting a group takes three steps in order. How: This numbers them, side by side from 720px wide and stacked below. */ }


						<li className={ cssModObj.staIteIte }>{ /* What: Starts Item Item Element. Why: The first step starts the group. How: This holds its title and sentence. */ }


							<h3 className={ cssModObj.staIteHea }>Start a group</h3>{ /* What: Starts Item Heading Element. Why: Each step has a short name. How: This sets it. */ }

							<p className={ cssModObj.staItePar }>Give it a name and add your own.</p>{ /* What: Starts Item Paragraph Element. Why: Each step says what it takes. How: This says it. */ }


						</li>



						<li className={ cssModObj.staIteIte }>{ /* What: Starts Item Item Element. Why: The second step shares the link. How: This holds its title and sentence. */ }


							<h3 className={ cssModObj.staIteHea }>Share the link</h3>{ /* What: Starts Item Heading Element. Why: Each step has a short name. How: This sets it. */ }

							<p className={ cssModObj.staItePar }>Send it however you like.</p>{ /* What: Starts Item Paragraph Element. Why: Each step says what it takes. How: This says it. */ }


						</li>



						<li className={ cssModObj.staIteIte }>{ /* What: Starts Item Item Element. Why: The last step lets people in. How: This holds its title and sentence. */ }


							<h3 className={ cssModObj.staIteHea }>Let them in</h3>{ /* What: Starts Item Heading Element. Why: Each step has a short name. How: This sets it. */ }

							<p className={ cssModObj.staItePar }>Someone in the group approves each person who asks, so no strangers get in.</p>{ /* What: Starts Item Paragraph Element. Why: Each step says what it takes. How: This says it. */ }


						</li>


					</ol>


				</section>



				<section className={ cssModObj.freSecSec }>{ /* What: Free Section Section Element. Why: The free tier's generosity and the upgrade are said plainly from day one. How: This holds the two plans and their notes on a raised band. */ }


					<div className={ cssModObj.freInnDiv }>{ /* What: Free Inner Div Element. Why: The band runs full width while its content keeps the page's width. How: This holds the heading, the plans, and the notes. */ }


						<h2 className={ cssModObj.secTitHea }>Free for your whole group</h2>{ /* What: Section Title Heading Element. Why: The section's point is said first. How: This sets it as the heading. */ }

						<p className={ cssModObj.freLeaPar }>Chat, events, bring-lists, photos, and location sharing are all free. The upgrade is for people who start more than one group, and gives their groups more room.</p>{ /* What: Free Lead Paragraph Element. Why: Everything that matters is free. How: This says so before the numbers. */ }



						<div className={ cssModObj.freCarDiv }>{ /* What: Free Cards Div Element. Why: The two plans compare side by side. How: This sets them in two columns from 720px wide, stacked below. */ }


							<div className={ cssModObj.plaCarDiv }>{ /* What: Plan Card Div Element. Why: The free plan is one card. How: This holds its name, price, and limits. */ }


								<h3 className={ cssModObj.plaNamHea }>Free</h3>{ /* What: Plan Name Heading Element. Why: Each card names its plan. How: This sets it. */ }

								<p className={ cssModObj.plaPriPar }>$0</p>{ /* What: Plan Price Paragraph Element. Why: The price is the card's biggest number. How: This sets it. */ }



								<dl className={ cssModObj.plaLimDes }>{ /* What: Plan Limits Description Element. Why: The limits read as label and number pairs. How: This lists them. */ }


									<dt className={ cssModObj.plaLimTer }>Groups you start</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>1</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>Groups you're in</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>10</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>People in a group you start</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>20</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>Photos per event in a group you start</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>100</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>Photos each person adds to one</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>30</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }


								</dl>


							</div>



							<div className={ ` ${ cssModObj.plaCarDiv }   ${ cssModObj.plaCarDivUpgrade } ` }>{ /* What: Plan Card Div Element. Why: The upgrade is the other card, outlined in the accent. How: This holds its name, price, and limits. */ }


								<h3 className={ cssModObj.plaNamHea }>Upgrade</h3>{ /* What: Plan Name Heading Element. Why: Each card names its plan. How: This sets it. */ }

								<p className={ cssModObj.plaPriPar }>$9.99 <span className={ cssModObj.plaOncSpa }>once</span></p>{ /* What: Plan Price Paragraph Element. Why: The price is the card's biggest number, and it's paid once. How: This sets it with a small "once". */ }



								<dl className={ cssModObj.plaLimDes }>{ /* What: Plan Limits Description Element. Why: The limits read as label and number pairs. How: This lists them. */ }


									<dt className={ cssModObj.plaLimTer }>Groups you start</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>10</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>Groups you're in</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>20</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>People in a group you start</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>50</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>Photos per event in a group you start</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>300</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }

									<dt className={ cssModObj.plaLimTer }>Photos each person adds to one</dt>{ /* What: Plan Limit Term Element. Why: Each limit names what it counts. How: This sets it. */ }

									<dd className={ cssModObj.plaLimDet }>60</dd>{ /* What: Plan Limit Details Element. Why: Each limit gives its number. How: This sets it. */ }


								</dl>


							</div>


						</div>



						<ul className={ cssModObj.freNotUno }>{ /* What: Free Notes Unordered Element. Why: The upgrade's terms are short and separate. How: This lists them. */ }


							<li className={ cssModObj.freNotIte }>Joining a group is always free.</li>{ /* What: Free Note Item Element. Why: An invited friend never pays to take part. How: This says so. */ }

							<li className={ cssModObj.freNotIte }>$9.99 once. No subscription.</li>{ /* What: Free Note Item Element. Why: The price is paid once. How: This says so. */ }

							<li className={ cssModObj.freNotIte }>Full refund within 14 days.</li>{ /* What: Free Note Item Element. Why: The terms promise a refund on request. How: This says so. */ }

							<li className={ cssModObj.freNotIte }>Needs a linked Google account, so your purchase can't be lost with your device.</li>{ /* What: Free Note Item Element. Why: Buying needs Google linked, which is better said before checkout. How: This says so and why. */ }

							<li className={ cssModObj.freNotIte }>Buy it any time in Settings.</li>{ /* What: Free Note Item Element. Why: The upgrade is bought inside the app. How: This says where. */ }


						</ul>


					</div>


				</section>



				<section className={ cssModObj.insSecSec }>{ /* What: Install Section Section Element. Why: Installing needs no app store, which people may not expect. How: This says so, with the browser's own install note below when it offers one. */ }


					<h2 className={ cssModObj.secTitHea }>No app store needed</h2>{ /* What: Section Title Heading Element. Why: The section's point is said first. How: This sets it as the heading. */ }

					<p className={ cssModObj.insTexPar }>Come Hang runs in your browser. Add it to your home screen and it opens like any other app, with notifications.</p>{ /* What: Install Text Paragraph Element. Why: The visitor learns how installing works. How: This says it. */ }



					<InsNotCom />{ /* What: Install Note Component. Why: A browser that can install the app with one tap suggests it here. How: This shows the note while the browser offers its prompt. */ }


				</section>



				<section className={ cssModObj.faqSecSec }>{ /* What: FAQ Section Section Element. Why: A few questions come up before anyone starts. How: This holds them, each opening its answer. */ }


					<h2 className={ cssModObj.secTitHea }>Questions</h2>{ /* What: Section Title Heading Element. Why: The section's point is said first. How: This sets it as the heading. */ }



					<div className={ cssModObj.faqColDiv }>{ /* What: FAQ Columns Div Element. Why: The questions fill the page's width on a wide screen, each answer opening without moving the other column. How: This sets the two halves side by side from 720px wide and up, one above the other below that, where they read as one list. */ }


						{ FAQ_COL_ARR.map( ( colRecArr, colIndNum ) => ( // What: Column Map. Why: Each half of the questions is its own list. How: This renders one list per column, keyed by its place, since the columns never reorder.


							<ul
								key={ colIndNum }

								className={ cssModObj.faqLisUno }
							>{ /* What: FAQ List Unordered Element. Why: A column's questions read as one list. How: This stacks them. */ }


								{ colRecArr.map( ( faqRecObj ) => <FaqIteCom key={ faqRecObj.queStr } ansStr={ faqRecObj.ansStr } queStr={ faqRecObj.queStr } /> ) }{ /* What: Question Map. Why: Each question is drawn the same way. How: This renders one item per row, keyed by its question. */ }


							</ul>


						) ) }


					</div>


				</section>



				<section className={ cssModObj.cloSecSec }>{ /* What: Close Section Section Element. Why: The page ends with one clear invitation. How: This sets it on a periwinkle band. */ }


					<h2 className={ cssModObj.cloTitHea }>Ready when your group is.</h2>{ /* What: Close Title Heading Element. Why: The invitation is said in one line. How: This sets it as the band's heading. */ }

					<button
						className={ cssModObj.cloStaBut }

						type='button'

						onClick={ () => invNamStr === undefined ? scrOpeFun( { scrStr : 'create' } ) : scrBacFun() } // What: Close Click Handler. Why: Opened from an invite, the button leads back to joining. How: This starts a group normally, and steps back to the form otherwise.
					>{ invNamStr === undefined ? 'Start your group' : invBacStr }</button>{ /* What: Close Start Button Element. Why: Someone who read to the end starts here, or carries on joining. How: This opens the screen for starting a group, or steps back to the invite form, its label saying which. */ }


				</section>


			</MaiAreCom>



			<footer className={ cssModObj.pagFooFoo }>{ /* What: Page Footer Footer Element. Why: The legal pages and a way to write are always at hand. How: This sets the links in a row that wraps where it runs out of room. */ }


				<a className={ cssModObj.fooLinAnc } href='/privacy'>Privacy Policy</a>{ /* What: Footer Link Anchor Element. Why: The policy has its own page. How: This links it. */ }

				<a className={ cssModObj.fooLinAnc } href='/terms'>Terms of Service</a>{ /* What: Footer Link Anchor Element. Why: The terms have their own page. How: This links them. */ }

				<a className={ cssModObj.fooLinAnc } href='mailto:support@comehang.app'>support@comehang.app</a>{ /* What: Footer Link Anchor Element. Why: Someone can write with a question. How: This opens their email to the support address. */ }


			</footer>


		</>


	);


}

// #endregion LanPagCom

// #endregion Components



// #region Exports

export { LanPagCom }; // What: Named Export. Why: The screen host shows the landing page to a phone with no identity. How: This exports LanPagCom.

// #endregion Exports


