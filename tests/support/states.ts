


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: The loading state waits until its loader has appeared. How: This retries its check until the status reads as loading.


import type { Page } from '@playwright/test'; // What: Page. Why: Opening and settling a state drives a Playwright page. How: This types the helpers' page parameters.

// #endregion Imports



/**
 * states.ts = States
 *
 * @summary
 * The page states the suites visit, and the helper that opens one. A state is
 * a page at a width, such as the home page at a phone width. opeStaFun sizes
 * the viewport, loads the page, waits for the fonts, and then waits for the
 * page to stay still so nothing is measured mid-fade.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type StaRecTyp = { // What: State Record Type. Why: Every check reads the same description of a state. How: This names a state, its path, and its viewport.


	heiNum  : number,                        // What: Height Number. Why: The viewport's height decides what's on screen. How: This is the viewport height in CSS pixels.
	ideStr  : string,                        // What: Identifier String. Why: Each test names the state it checks. How: This becomes part of the test title.
	iosBoo? : boolean,                       // What: iOS Boolean. Why: An iPhone in Safari shows the install steps first. How: This makes the page report an iPhone's Safari when true.
	patStr  : string,                        // What: Path String. Why: Each state opens one route. How: This is the path loaded from the suite's server.
	schStr? : 'dark' | 'light',              // What: Scheme String. Why: Every color has a dark value too, which has to pass the same checks. How: This is the phone's color scheme, light when left out.
	steStr? : 'chat' | 'create' | 'delete' | 'edit' | 'event' | 'events' | 'form' | 'group' | 'helping' | 'history' | 'join' | 'legal' | 'loading' | 'map' | 'member' | 'note' | 'offered' | 'paste' | 'people' | 'requests' | 'settings' | 'sheet' | 'waiting', // What: Steps String. Why: A screen past the first is reached by using the app, not by an address, and the waiting screen only by holding the app's check. How: This names the steps that reach it, none when left out.
	widNum  : number                         // What: Width Number. Why: Layouts change with width. How: This is the viewport width in CSS pixels.


};

// #endregion Types



// #region Constants

const INV_PAT_STR = `/join/${ 'A'.repeat( 22 ) }`;                                                                                                     // What: Invite Path String. Why: An iPhone's Safari keeps an invite link's token without reading the invite, so any well-formed one will do. How: This is a link with a token no invite has.
const IOS_UAS_STR = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'; // What: iOS User Agent String. Why: The install states run as an iPhone's Safari. How: This is the user agent that Safari on iOS 18 sends.



// #region STA_REC_ARR

/**
 * STA_REC_ARR = State Record Array
 *
 * @summary
 * Every state the checks visit: each screen at a phone width and a desktop
 * width, some in dark mode too, the chat at a tablet width, the group and
 * event sheets, an item's form, and the event form open on a phone, the
 * People section with two requests waiting, the owner's Settings, its
 * deletion's confirmation, a member's Settings with and without an offer of
 * the group, the Map section while sharing, the join form an invite link
 * opens, a sent request waiting, the privacy policy's sheet in Settings, the
 * static privacy and terms pages, and the waiting screen with its loader
 * showing. Every row shares the {@link
 * StaRecTyp} shape, so its fields carry no comments of their own:
 *
 * - `heiNum` (Number): Height Number, the viewport height in CSS pixels.
 *
 * - `ideStr` (String): Identifier String, the state's name in test titles.
 *
 * - `patStr` (String): Path String, the route loaded from the suite's server.
 *
 * - `schStr` (String, optional): Scheme String, the phone's color scheme,
 *   light when left out.
 *
 * - `steStr` (String, optional): Steps String, the steps that reach the
 *   screen, none when left out.
 *
 * - `widNum` (Number): Width Number, the viewport width in CSS pixels.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const STA_REC_ARR : StaRecTyp[] = [ // What: State Record Array. Why: Every check walks the same list of states, so a new state is added in one place. How: Each row names a state, its path, and its viewport.


	{ heiNum : 900, ideStr : 'welcome-desktop',      patStr : '/',         widNum : 1440                                      }, // What: Welcome Desktop State. Why: The welcome is checked at a desktop width. How: This loads the root at 1,440px.
	{ heiNum : 844, ideStr : 'welcome-phone',        patStr : '/',         widNum : 390                                       }, // What: Welcome Phone State. Why: The welcome is checked at a phone width. How: This loads the root at 390px.
	{ heiNum : 900, ideStr : 'welcome-desktop-dark', patStr : '/',         widNum : 1440, schStr : 'dark'                     }, // What: Welcome Desktop Dark State. Why: Dark mode is checked at a desktop width. How: This loads the root at 1,440px with the phone set to dark.
	{ heiNum : 844, ideStr : 'welcome-phone-dark',   patStr : '/',         widNum : 390,  schStr : 'dark'                     }, // What: Welcome Phone Dark State. Why: Dark mode is checked at a phone width. How: This loads the root at 390px with the phone set to dark.
	{ heiNum : 900, ideStr : 'loading-desktop',      patStr : '/',         widNum : 1440, steStr : 'loading'                  }, // What: Loading Desktop State. Why: The waiting screen is checked with its loader showing. How: This holds the app's check at 1,440px.
	{ heiNum : 844, ideStr : 'loading-phone',        patStr : '/',         widNum : 390,  steStr : 'loading'                  }, // What: Loading Phone State. Why: The loader is checked at a phone width. How: This holds the app's check at 390px.
	{ heiNum : 900, ideStr : 'create-desktop',       patStr : '/',         widNum : 1440, steStr : 'create'                   }, // What: Create Desktop State. Why: The form for starting a group is checked at a desktop width. How: This opens it at 1,440px.
	{ heiNum : 844, ideStr : 'create-phone',         patStr : '/',         widNum : 390,  steStr : 'create'                   }, // What: Create Phone State. Why: The form is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 900, ideStr : 'paste-desktop',        patStr : '/',         widNum : 1440, steStr : 'paste'                    }, // What: Paste Desktop State. Why: The screen for joining with an invite link is checked at a desktop width. How: This opens it from the welcome at 1,440px.
	{ heiNum : 844, ideStr : 'paste-phone',          patStr : '/',         widNum : 390,  steStr : 'paste'                    }, // What: Paste Phone State. Why: The paste screen is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 844, ideStr : 'note-phone',           patStr : '/',         widNum : 390,  steStr : 'note'                     }, // What: Note Phone State. Why: The install note shows where a browser offers its prompt, which the suite's browsers never do. How: This fires a stand-in prompt on the welcome at 390px.
	{ heiNum : 900, ideStr : 'group-desktop',        patStr : '/',         widNum : 1440, steStr : 'group'                    }, // What: Group Desktop State. Why: The group frame is checked with its rail. How: This opens a new group at 1,440px.
	{ heiNum : 844, ideStr : 'group-phone',          patStr : '/',         widNum : 390,  steStr : 'group'                    }, // What: Group Phone State. Why: The group frame is checked with its switcher. How: This opens a new group at 390px.
	{ heiNum : 900, ideStr : 'chat-desktop',         patStr : '/',         widNum : 1440, steStr : 'chat'                     }, // What: Chat Desktop State. Why: A chat with an event and a message is checked at a desktop width. How: This fills a new group's chat at 1,440px.
	{ heiNum : 844, ideStr : 'chat-phone',           patStr : '/',         widNum : 390,  steStr : 'chat'                     }, // What: Chat Phone State. Why: The chat is checked at a phone width. How: This fills a new group's chat at 390px.
	{ heiNum : 844, ideStr : 'chat-phone-dark',      patStr : '/',         widNum : 390,  schStr : 'dark',    steStr : 'chat' }, // What: Chat Phone Dark State. Why: The chat's dark colors are checked too. How: This fills a new group's chat at 390px with the phone set to dark.
	{ heiNum : 844, ideStr : 'sheet-phone',          patStr : '/',         widNum : 390,  steStr : 'sheet'                    }, // What: Sheet Phone State. Why: The group sheet is a modal layer of its own. How: This opens a new group's sheet at 390px.
	{ heiNum : 900, ideStr : 'chat-tablet',          patStr : '/',         widNum : 900,  steStr : 'chat'                     }, // What: Chat Tablet State. Why: Between 720px and 1,100px the rail shows and the event stays pinned. How: This fills a new group's chat at 900px.
	{ heiNum : 844, ideStr : 'event-phone',          patStr : '/',         widNum : 390,  steStr : 'event'                    }, // What: Event Phone State. Why: The pinned event's sheet is a modal layer of its own. How: This opens it at 390px.
	{ heiNum : 900, ideStr : 'events-desktop',       patStr : '/',         widNum : 1440, steStr : 'events'                   }, // What: Events Desktop State. Why: The Events section is checked at a desktop width. How: This opens it in a new group with a planned event at 1,440px.
	{ heiNum : 844, ideStr : 'events-phone',         patStr : '/',         widNum : 390,  steStr : 'events'                   }, // What: Events Phone State. Why: The Events section is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 844, ideStr : 'form-phone',           patStr : '/',         widNum : 390,  steStr : 'form'                     }, // What: Form Phone State. Why: The event form is a modal layer of its own. How: This opens it at 390px.
	{ heiNum : 844, ideStr : 'edit-phone',           patStr : '/',         widNum : 390,  steStr : 'edit'                     }, // What: Edit Phone State. Why: An item's edit form is checked in its sheet. How: This opens the open item's form at 390px.
	{ heiNum : 900, ideStr : 'people-desktop',       patStr : '/',         widNum : 1440, steStr : 'people'                   }, // What: People Desktop State. Why: The People section is checked at a desktop width. How: This opens it in a new group at 1,440px.
	{ heiNum : 844, ideStr : 'people-phone',         patStr : '/',         widNum : 390,  steStr : 'people'                   }, // What: People Phone State. Why: The People section is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 900, ideStr : 'requests-desktop',     patStr : '/',         widNum : 1440, steStr : 'requests'                 }, // What: Requests Desktop State. Why: The waiting list is checked at a desktop width. How: This opens the People section with two requests waiting at 1,440px.
	{ heiNum : 844, ideStr : 'requests-phone',       patStr : '/',         widNum : 390,  steStr : 'requests'                 }, // What: Requests Phone State. Why: The waiting list is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 900, ideStr : 'settings-desktop',     patStr : '/',         widNum : 1440, steStr : 'settings'                 }, // What: Settings Desktop State. Why: The owner's Settings section is checked at a desktop width. How: This opens it in a new group at 1,440px.
	{ heiNum : 844, ideStr : 'settings-phone',       patStr : '/',         widNum : 390,  steStr : 'settings'                 }, // What: Settings Phone State. Why: The owner's Settings section is checked at a phone width. How: This opens it at 390px.
	{ heiNum : 844, ideStr : 'delete-phone',         patStr : '/',         widNum : 390,  steStr : 'delete'                   }, // What: Delete Phone State. Why: The deletion's confirmation is checked with its box. How: This opens it in the owner's Settings at 390px.
	{ heiNum : 844, ideStr : 'legal-phone',          patStr : '/',         widNum : 390,  steStr : 'legal'                    }, // What: Legal Phone State. Why: The privacy policy opens in a sheet from Settings. How: This opens it in the owner's Settings at 390px.
	{ heiNum : 844, ideStr : 'member-phone',         patStr : '/',         widNum : 390,  steStr : 'member'                   }, // What: Member Phone State. Why: A member who isn't the owner sees the settings without the form, and the leave. How: This opens Settings as a member of another's group at 390px.
	{ heiNum : 844, ideStr : 'history-phone',        patStr : '/',         widNum : 390,  steStr : 'history'                  }, // What: History Phone State. Why: A fresh joiner of an older group is offered its earlier chat in a banner atop the chat. How: This joins another's group, made older, at 390px.
	{ heiNum : 844, ideStr : 'helping-phone',        patStr : '/',         widNum : 390,  steStr : 'helping'                  }, // What: Helping Phone State. Why: A member who can help sees another's request in People. How: This joins another's group whose owner asks for history, at 390px.
	{ heiNum : 844, ideStr : 'offered-phone',        patStr : '/',         widNum : 390,  steStr : 'offered'                  }, // What: Offered Phone State. Why: The member an offer names sees its answers. How: This opens Settings as a member offered another's group at 390px.
	{ heiNum : 900, ideStr : 'map-desktop',          patStr : '/',         widNum : 1440, steStr : 'map'                      }, // What: Map Desktop State. Why: The Map section is checked sharing at a desktop width. How: This shares beside an arrived member at 1,440px.
	{ heiNum : 844, ideStr : 'map-phone',            patStr : '/',         widNum : 390,  steStr : 'map'                      }, // What: Map Phone State. Why: The Map section is checked sharing at a phone width. How: This shares beside an arrived member at 390px.
	{ heiNum : 900, ideStr : 'join-desktop',         patStr : '/',         widNum : 1440, steStr : 'join'                     }, // What: Join Desktop State. Why: The form an invite link opens is checked at a desktop width. How: This opens another's link at 1,440px.
	{ heiNum : 844, ideStr : 'join-phone',           patStr : '/',         widNum : 390,  steStr : 'join'                     }, // What: Join Phone State. Why: The join form is checked at a phone width. How: This opens another's link at 390px.
	{ heiNum : 844, ideStr : 'waiting-phone',        patStr : '/',         widNum : 390,  steStr : 'waiting'                  }, // What: Waiting Phone State. Why: A sent request's waiting part is checked with its withdrawal. How: This asks through another's link at 390px.
	{ heiNum : 844, ideStr : 'install-phone',        patStr : '/',         widNum : 390,  iosBoo : true                       }, // What: Install Phone State. Why: An iPhone in Safari shows the install steps before anything else. How: This opens the app as an iPhone's Safari at 390px.
	{ heiNum : 900, ideStr : 'install-tablet',       patStr : '/',         widNum : 1024, iosBoo : true                       }, // What: Install Tablet State. Why: An iPad shows the same steps at a wider width. How: This opens the app as an iPad's Safari at 1,024px.
	{ heiNum : 844, ideStr : 'invited-phone',        patStr : INV_PAT_STR, widNum : 390,  iosBoo : true                       }, // What: Invited Phone State. Why: An invite link opened in an iPhone's Safari keeps its link to copy before the steps. How: This opens a link as an iPhone's Safari at 390px.
	{ heiNum : 900, ideStr : 'privacy-desktop',      patStr : '/privacy',  widNum : 1440                                      }, // What: Privacy Desktop State. Why: The static privacy policy page is checked at a desktop width. How: This loads /privacy at 1,440px.
	{ heiNum : 844, ideStr : 'privacy-phone',        patStr : '/privacy',  widNum : 390                                       }, // What: Privacy Phone State. Why: The policy's page is checked at a phone width. How: This loads /privacy at 390px.
	{ heiNum : 900, ideStr : 'terms-desktop',        patStr : '/terms',    widNum : 1440                                      }, // What: Terms Desktop State. Why: The static terms page is checked at a desktop width. How: This loads /terms at 1,440px.
	{ heiNum : 844, ideStr : 'terms-phone-dark',     patStr : '/terms',    widNum : 390,  schStr : 'dark'                     }  // What: Terms Phone Dark State. Why: The legal pages' dark colors are checked too. How: This loads /terms at 390px with the phone set to dark.


];

// #endregion STA_REC_ARR

// #endregion Constants



// #region Helpers

// #region waiSetFun

/**
 * waiSetFun = Wait Settled Function
 *
 * @summary
 * Waits until the page has stayed still for half a second: no animation or
 * transition running except ones that repeat forever, which never finish and
 * so are skipped (the reduced motion check is what catches one that
 * shouldn't be playing). A single still moment isn't enough, since a fade can
 * start just after the last one ends, so the page has to read as still on five
 * checks in a row, 100ms apart. It fails after 5 seconds rather than hanging.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to wait on.
 *
 * @returns A promise that settles once the page has stopped moving, with no
 *          value.
 *
 * @example
 * ```ts
 * waiSetFun(page) // => Promise<void>
 * ```
 *
*/

async function waiSetFun ( curPagObj : Page ) : Promise< void > {


	const deaTimNum = Date.now() + 5000; // What: Deadline Time Number. Why: A page that never settles should fail rather than hang the run. How: This marks 5 seconds from now.

	let quiCouNum = 0; // What: Quiet Count Number. Why: The page has to stay still across several checks in a row. How: This counts consecutive still checks, starting from none.


	while ( quiCouNum < 5 ) { // What: Settle Check Loop. Why: The page counts as settled only after five still checks in a row. How: This keeps checking until the count reaches five.


		if ( Date.now() > deaTimNum ) throw new Error( 'The page was still animating after 5 seconds.' ); // What: Deadline Guard. Why: A page that keeps moving would otherwise loop forever. How: This fails the check once the deadline passes.



		const stiPagBoo = await curPagObj.evaluate( () => document.getAnimations().every( ( aniCurObj ) => aniCurObj.playState !== 'running' || aniCurObj.effect?.getComputedTiming().iterations === Infinity ) ); // What: Still Page Boolean. Why: Each check asks whether anything that ends is still moving. How: This is true when every running animation or transition is one that repeats forever.


		quiCouNum = stiPagBoo ? quiCouNum + 1 : 0; // What: Quiet Count Update. Why: Any movement restarts the count, so the page has to stay still the whole half second. How: This adds one for a still check and resets to zero otherwise.


		await curPagObj.waitForTimeout( 100 ); // What: Check Pause Wait. Why: The checks have to span time to prove the page stays still. How: This waits 100ms before the next one.


	}


}

// #endregion waiSetFun



// #region datHolFun

/**
 * datHolFun = Database Hold Function
 *
 * @summary
 * Runs in the page before the app loads and holds back the opening of the
 * app's IndexedDB database, which the app reads before choosing a screen, so
 * the waiting screen shows. The open's success is stopped before the app
 * hears it, then sent again after the given delay, or never for a negative
 * one. Other databases, such as Firebase's own, open as usual.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param holMilNum - Hold Milliseconds Number: How long to hold the open, or
 *                    a negative number to hold it for good.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * page.addInitScript(datHolFun, 1500) // => void
 * ```
 *
*/

const datHolFun = ( holMilNum : number ) : void => { // What: Database Hold Function. Why: A launch is usually too quick to see the waiting screen. How: This delays the app's database opening.


	const oriOpeFun = IDBFactory.prototype.open; // What: Original Open Function. Why: Every open still goes through the browser's own. How: This keeps it.



	IDBFactory.prototype.open = function ( this : IDBFactory, datNamStr : string, verValNum? : number ) : IDBOpenDBRequest { // What: Open Override Function. Why: Only the app's database is held. How: This opens as usual and holds the app's open's success.


		const opeReqObj = oriOpeFun.call( this, datNamStr, verValNum ); // What: Open Request Object. Why: The database still opens. How: This asks the browser to open it.


		if ( datNamStr !== 'come-hang' ) return opeReqObj; // What: Other Database Guard. Why: Firebase's databases aren't the app's check. How: This returns them untouched.



		opeReqObj.addEventListener( 'success', ( sucEveObj ) => { // What: Success Hold Listener. Why: The app's own handler, added after this one, mustn't hear the open yet. How: This stops the event and sends it again later, once.


			sucEveObj.stopImmediatePropagation(); // What: Success Stop Call. Why: The app waits while the open is held. How: This keeps the event from the app's handler.


			if ( holMilNum >= 0 ) setTimeout( () => opeReqObj.dispatchEvent( new Event( 'success' ) ), holMilNum ); // What: Success Resend Call. Why: A held open ends after its delay. How: This sends the event again once the delay passes, which this listener, run once, no longer stops.


		}, { once : true } );



		return opeReqObj; // What: Request Return. Why: The app works with the request as usual. How: This returns it.


	};


};

// #endregion datHolFun



// #region chaSteFun

/**
 * chaSteFun = Chat Steps Function
 *
 * @summary
 * Fills a new group's chat the way a member would: plans Friendsgiving at
 * Dana's place two days from now, which the chat pins, with an open item and
 * one the member claimed on its list, and sends a message from the composer.
 * The first send can be refused while the group's membership mirror catches
 * up, which leaves the text in the box, so Enter is pressed again until the
 * message shows in the log.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page showing the new group.
 *
 * @returns A promise that settles once the message shows, with no value.
 *
 * @example
 * ```ts
 * chaSteFun(page) // => Promise<void>
 * ```
 *
*/

async function chaSteFun ( curPagObj : Page ) : Promise< void > {


	await curPagObj.evaluate( async () => { // What: Event Plan Call. Why: Planning through the module is quicker than the form, which its own spec covers. How: This finds the group and plans an event in it.


		const modPatArr = [ '/src/state/events.ts', '/src/state/groups.ts', '/src/state/items.ts' ];                                               // What: Module Path Array. Why: The dev server serves the app's source by path. How: This names the modules used.
		const [ eveModObj, groModObj, iteModObj ] = await Promise.all( modPatArr.map( ( modPatStr ) => import( /* @vite-ignore */ modPatStr ) ) ); // What: Page Modules. Why: The page runs the real modules. How: This imports all three.
		const groIdeStr : string = await new Promise( ( resValFun ) => void groModObj.groWatFun( ( groRecArr : { ideStr : string }[] ) => { if ( groRecArr.length > 0 ) resValFun( groRecArr[ 0 ].ideStr ); } ) ); // What: Group Identifier String. Why: The event is planned in the new group. How: This reads the one group the list reports.
		const staTimNum = Date.now() + 2 * 86400000;                                                                                               // What: Start Time Number. Why: The pinned event is still to come. How: This starts it two days from now.


		const eveIdeStr : string = await eveModObj.eveCreFun( groIdeStr, { desTexStr : 'Bring a chair if you have one.', endTimNum : staTimNum + 4 * 3600000, locTexStr : "Dana's place", staTimNum, titTexStr : 'Friendsgiving' } ); // What: Event Identifier String. Why: The chat pins the group's next event, and its list needs it. How: This plans a four-hour event with a note.


		await iteModObj.iteAddFun( groIdeStr, eveIdeStr, 'Rolls', null ); // What: Open Item Call. Why: The list shows an item anyone can claim. How: This adds it open.

		await iteModObj.iteClaFun( groIdeStr, eveIdeStr, await iteModObj.iteAddFun( groIdeStr, eveIdeStr, 'Pumpkin pie', null ) ); // What: Claimed Item Call. Why: The list shows the member's own claim. How: This adds an item and claims it.


	} );

	await curPagObj.getByLabel( 'Message', { exact : true } ).fill( 'Leaving in 10, the pie is safe.' ); // What: Message Fill Call. Why: The log should hold a message. How: This types one into the composer.

	await expect( async () => { // What: Send Retry Call. Why: A send before the membership mirror catches up is refused and leaves its text. How: This presses Enter until the message shows.


		await curPagObj.getByLabel( 'Message', { exact : true } ).press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it in the composer.

		await expect( curPagObj.getByRole( 'log' ) ).toContainText( 'Leaving in 10, the pie is safe.', { timeout : 2000 } ); // What: Message Shown Assertion. Why: The send landed once the log holds it. How: This waits up to 2 seconds for it.


	} ).toPass(); // What: Retry Settings. Why: The mirror usually catches up within a moment. How: This retries until the message shows or the test times out.


}

// #endregion chaSteFun



// #region memSteFun

/**
 * memSteFun = Member Steps Function
 *
 * @summary
 * Makes the page a member of someone else's group: an owner on a device of
 * their own creates Beach Day as Alice and opens its People section for the
 * link, the page asks to join through it as Sam, and the owner approves, then
 * for the offered steps offers the page the group, and for the map steps
 * plans an event under way and shares their position there as arrived, the
 * way the app does each step.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to make a member, with the
 *                    app loaded.
 * @param steStr    - Steps String: The member steps, map, member, or
 *                    offered.
 *
 * @returns A promise that settles once the page is a member, with no value.
 *
 * @example
 * ```ts
 * memSteFun(page, 'member') // => Promise<void>
 * ```
 *
*/

const memSteFun = async ( curPagObj : Page, steStr : 'helping' | 'history' | 'map' | 'member' | 'offered' ) : Promise< void > => { // What: Member Steps Function. Why: A member's view of a group needs an owner who isn't the page. How: This has another device create the group and approve the page.


	const ownConObj = await curPagObj.context().browser()!.newContext( { baseURL : new URL( curPagObj.url() ).origin } ); // What: Owner Context Object. Why: The owner needs an identity and storage of their own. How: This opens a new browser context on the same server. // What: Non-Null Note. Why: A page from Playwright's own launch always has its browser. How: The ! reads it as present.
	const ownPagObj = await ownConObj.newPage();                                                                       // What: Owner Page Object. Why: The owner acts from their own page. How: This opens one.


	await ownPagObj.goto( '/' ); // What: Owner Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await ownPagObj.evaluate( async ( modPatStr ) => ( await import( /* @vite-ignore */ modPatStr ) ).groCreFun( 'Beach Day', 'Alice' ) as Promise< string >, '/src/state/groups.ts' ); // What: Group Identifier String. Why: The owner approves the member into this group. How: This creates it with the groups module, passing its path since the page can't read the test's variables. // What: Type Assertion Note. Why: groCreFun resolves with the group's ID. How: The as reads it as a string.


	await ownPagObj.goto( '/' ); // What: Owner Reopen Call. Why: The watch started before the identity existed, so the app opens afresh to show the group. How: This opens the app again.

	await ownPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: The link shows in the People section. How: This presses its tab.


	const tokValStr = ( await ownPagObj.getByLabel( 'Invite link', { exact : true } ).inputValue() ).split( '/join/' )[ 1 ]; // What: Token Value String. Why: The page asks through the group's link. How: This reads the link and takes the token from its end.

	const uidMemStr = await curPagObj.evaluate( async ( [ joiPatStr, idePatStr, tokArgStr ] ) => { // What: UID Member String. Why: The owner approves the page by its UID. How: This files the page's request through the joins module, then reads its identity.


		await ( await import( /* @vite-ignore */ joiPatStr ) ).reqCreFun( tokArgStr, 'Sam', '' ); // What: Request Create Call. Why: The page asks to join the way the app does. How: This files the request as Sam.



		return ( await ( await import( /* @vite-ignore */ idePatStr ) ).ideEnsFun() ).uidValStr as string; // What: UID Return. Why: The request made the identity, whose UID the owner needs. How: This reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID as a string.


	}, [ '/src/state/joins.ts', '/src/state/identity.ts', tokValStr ] ); // What: Request Arguments. Why: The page can't read the test's variables. How: This passes both modules' paths and the token.


	await ownPagObj.evaluate( async ( [ modPatStr, groArgStr, uidArgStr ] ) => { await ( await import( /* @vite-ignore */ modPatStr ) ).reqAppFun( groArgStr, uidArgStr ); }, [ '/src/state/joins.ts', groIdeStr, uidMemStr ] ); // What: Approval Call. Why: The owner lets the page in the way the app does. How: This approves its request with the joins module.

	if ( steStr === 'offered' ) await ownPagObj.evaluate( async ( [ modPatStr, groArgStr, uidArgStr ] ) => { await ( await import( /* @vite-ignore */ modPatStr ) ).offMakFun( groArgStr, uidArgStr ); }, [ '/src/state/ownership.ts', groIdeStr, uidMemStr ] ); // What: Offer Call. Why: The offered state shows the page an offer of the group. How: This offers it with the ownership module.

	if ( steStr === 'history' ) await fetch( `http://127.0.0.1:8200/v1/projects/demo-come-hang/databases/(default)/documents/groups/${ groIdeStr }?updateMask.fieldPaths=createdAt`, { body : JSON.stringify( { fields : { createdAt : { timestampValue : new Date( Date.now() - 30 * 86400000 ).toISOString() } } } ), headers : { Authorization : 'Bearer owner' }, method : 'PATCH' } ); // What: Old Group Call. Why: The history state offers the chat from before the join, which needs a group older than it. How: This moves the group's start 30 days back through the emulator's REST address, whose owner credential passes the rules.

	if ( steStr === 'helping' ) await ownPagObj.evaluate( async ( [ modPatStr, groArgStr ] ) => { await ( await import( /* @vite-ignore */ modPatStr ) ).hisAskFun( groArgStr, 'recovery', null ); }, [ '/src/state/history.ts', groIdeStr ] ); // What: Owner Ask Call. Why: The helping state shows another member's request. How: This files a recovery request as the owner.

	if ( steStr === 'helping' ) await curPagObj.evaluate( async ( [ modPatStr, groArgStr, uidArgStr ] ) => { await ( await import( /* @vite-ignore */ modPatStr ) ).mesPutFun( { groIdeStr : groArgStr, mesIdeStr : 'old', senUidStr : uidArgStr, sntTimNum : 1, texValStr : 'Hi' } ); }, [ '/src/platform/chat-store.ts', groIdeStr, uidMemStr ] ); // What: History Seed Call. Why: Send history is offered only to a phone holding the whole range. How: This stores a message older than the owner's join on the page's device.



	if ( steStr === 'map' ) { // What: Map Share Block. Why: The map state shows another member sharing as arrived. How: This gives the owner's device a position, plans an event under way, and shares there as arrived.


		await ownConObj.grantPermissions( [ 'geolocation' ] ); // What: Permission Call. Why: Sharing needs the position. How: This grants it to the owner's device.

		await ownConObj.setGeolocation( { accuracy : 10, latitude : 51.5027, longitude : -0.12 } ); // What: Position Call. Why: The owner is a little north of the page. How: This places their device about 300m away.

		await ownPagObj.evaluate( async ( [ evePatStr, locPatStr, groArgStr ] ) => { // What: Share Call. Why: The owner shares the way the app does. How: This plans the event and starts a session already arrived.


			const staTimNum = Date.now() - 3600000; // What: Start Time Number. Why: The event is under way, so sharing is open. How: This starts it an hour ago.


			const eveIdeStr : string = await ( await import( /* @vite-ignore */ evePatStr ) ).eveCreFun( groArgStr, { desTexStr : '', endTimNum : staTimNum + 4 * 3600000, locTexStr : 'Lake Park', staTimNum, titTexStr : 'Picnic' } ); // What: Event Identifier String. Why: The share belongs to the event. How: This plans a four-hour picnic.


			await ( await import( /* @vite-ignore */ locPatStr ) ).locShaFun( groArgStr, eveIdeStr, true ); // What: Session Start Call. Why: The page sees the owner's share with its badge. How: This shares as arrived.


		}, [ '/src/state/events.ts', '/src/state/location.ts', groIdeStr ] ); // What: Share Arguments. Why: The page can't read the test's variables. How: This passes both modules' paths and the group's ID.


	}



	await ownConObj.close(); // What: Context Close Call. Why: The owner's device isn't needed again, and its share stays until it expires. How: This closes it.


};

// #endregion memSteFun



// #region joiSteFun

/**
 * joiSteFun = Join Steps Function
 *
 * @summary
 * Has another device start Beach Day as Alice and opens its invite link on the
 * page, showing the join form. For the waiting state, the page then asks to
 * join as Dana Lee with a note. Either way it reloads, so the part shows as on
 * a later visit, with nothing focused.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The joiner's page.
 * @param steStr    - Steps String: Which part to stop at.
 *
 * @returns A promise that settles once the part is showing, with no value.
 *
 * @example
 * ```ts
 * joiSteFun(page, 'waiting') // => Promise<void>
 * ```
 *
*/

const joiSteFun = async ( curPagObj : Page, steStr : 'join' | 'waiting' ) : Promise< void > => { // What: Join Steps Function. Why: The join screen is reached through another's invite link. How: This has another device start a group, opens its link, and asks for the waiting state.


	const ownConObj = await curPagObj.context().browser()!.newContext( { baseURL : new URL( curPagObj.url() ).origin } ); // What: Owner Context Object. Why: The owner needs an identity and storage of their own. How: This opens a new browser context on the same server. // What: Non-Null Note. Why: A page from Playwright's own launch always has its browser. How: The ! reads it as present.
	const ownPagObj = await ownConObj.newPage();                                                                       // What: Owner Page Object. Why: The owner acts from their own page. How: This opens one.


	await ownPagObj.goto( '/' ); // What: Owner Load Call. Why: The page needs the app's modules. How: This opens the app.


	await ownPagObj.evaluate( async ( modPatStr ) => ( await import( /* @vite-ignore */ modPatStr ) ).groCreFun( 'Beach Day', 'Alice' ) as Promise< string >, '/src/state/groups.ts' ); // What: Group Create Call. Why: The link opens this group. How: This creates it with the groups module, passing its path since the page can't read the test's variables. // What: Type Assertion Note. Why: groCreFun resolves with the group's ID. How: The as reads it as a string.

	await ownPagObj.goto( '/' ); // What: Owner Reopen Call. Why: The watch started before the identity existed, so the app opens afresh to show the group. How: This opens the app again.

	await ownPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: The link shows in the People section. How: This presses its tab.


	const tokValStr = ( await ownPagObj.getByLabel( 'Invite link', { exact : true } ).inputValue() ).split( '/join/' )[ 1 ]; // What: Token Value String. Why: The page opens the group's link. How: This reads the link and takes the token from its end.


	await ownConObj.close(); // What: Context Close Call. Why: The owner's device isn't needed again. How: This closes it.

	await curPagObj.goto( `/join/${ tokValStr }` ); // What: Link Open Call. Why: The joiner arrives through the link. How: This opens it.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Join Beach Day' } ).waitFor(); // What: Form Wait. Why: The form shows once the invite is read. How: This waits for its heading.



	if ( steStr === 'waiting' ) { // What: Waiting Block. Why: The waiting state shows a sent request. How: This fills in the form and sends it.


		await curPagObj.getByLabel( 'Your full name' ).fill( 'Dana Lee' );                      // What: Name Fill Call. Why: The request needs a name. How: This types it.
		await curPagObj.getByLabel( 'Note to the group (optional)' ).fill( "Sam's cousin" ); // What: Note Fill Call. Why: A note helps place the joiner. How: This types it.

		await curPagObj.getByRole( 'button', { name : 'Ask to join' } ).click(); // What: Ask Click Call. Why: Sending asks to join. How: This presses the button.

		await curPagObj.getByRole( 'heading', { level : 1, name : 'Waiting to join Beach Day' } ).waitFor(); // What: Waiting Wait. Why: The request has to be sent before the reload. How: This waits for the waiting heading.


	}



	await curPagObj.reload(); // What: Part Reload Call. Why: The part is checked as it opens on a later visit, with nothing focused. How: This reloads it, which its entry keeps.

	await curPagObj.getByRole( 'heading', { level : 1, name : steStr === 'join' ? 'Join Beach Day' : 'Waiting to join Beach Day' } ).waitFor(); // What: Reloaded Wait. Why: The part shows once the join's status is read. How: This waits for its heading.


};

// #endregion joiSteFun



// #region reqSteFun

/**
 * reqSteFun = Requests Steps Function
 *
 * @summary
 * Has two people ask to join the group whose People section is showing, each
 * from a device of their own and both at once, through the link the section
 * shows: Dana Lee with a note, and someone using the member's own name, Alice,
 * so the waiting list's warning shows too.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The member's page, showing the
 *                    People section.
 *
 * @returns A promise that settles once both requests are filed, with no
 *          value.
 *
 * @example
 * ```ts
 * reqSteFun(page) // => Promise<void>
 * ```
 *
*/

const reqSteFun = async ( curPagObj : Page ) : Promise< void > => { // What: Requests Steps Function. Why: The waiting list is checked with people waiting, one of them reusing a member's name. How: This files two requests through the group's link, each from a new device.


	const linValStr = await curPagObj.getByLabel( 'Invite link', { exact : true } ).inputValue(); // What: Link Value String. Why: A joiner asks through the group's link. How: This reads it from the section.
	const tokValStr = linValStr.split( '/join/' )[ 1 ];                       // What: Token Value String. Why: A request names the invite it used. How: This takes the token from the link's end.


	await Promise.all( [ [ 'Dana Lee', "Sam's cousin" ], [ 'Alice', '' ] ].map( async ( [ namTexStr, notTexStr ] ) => { // What: Joiner Requests Call. Why: Each joiner is a different person, with an identity of their own, and filing both at once keeps the states quick. How: This files one request per name and note, side by side.


		const joiConObj = await curPagObj.context().browser()!.newContext( { baseURL : new URL( curPagObj.url() ).origin } ); // What: Joiner Context Object. Why: A second identity needs storage of its own. How: This opens a new browser context on the same server. // What: Non-Null Note. Why: A page from Playwright's own launch always has its browser. How: The ! reads it as present.
		const joiPagObj = await joiConObj.newPage();                                                                       // What: Joiner Page Object. Why: The request is filed from the joiner's own page. How: This opens one.


		await joiPagObj.goto( '/' ); // What: Joiner Load Call. Why: The page needs the app's modules. How: This opens the app.

		await joiPagObj.evaluate( async ( [ modPatStr, tokArgStr, namArgStr, notArgStr ] ) => { // What: Request File Call. Why: The joiner asks to join the way the app does. How: This imports the joins module by its path and files the request.


			const joiModObj = await import( /* @vite-ignore */ modPatStr ); // What: Joins Module Object. Why: The page runs the real module. How: This imports it.


			await joiModObj.reqCreFun( tokArgStr, namArgStr, notArgStr ); // What: Request Create Call. Why: The joiner asks with their name and note. How: This files the request through the link's token.


		}, [ '/src/state/joins.ts', tokValStr, namTexStr, notTexStr ] ); // What: Request Arguments. Why: The page can't read the test's variables. How: This passes the module's path, the token, the name, and the note.

		await joiConObj.close(); // What: Context Close Call. Why: The joiner's device isn't needed again. How: This closes it.


	} ) );


};

// #endregion reqSteFun



// #region bipFakFun

/**
 * bipFakFun = Before Install Prompt Fake Function
 *
 * @summary
 * Fires a stand-in for the install prompt a browser such as Chrome offers,
 * whose prompt counts its calls on the window and whose answer is accepted,
 * since the suite's browsers never offer a real one.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to fire it in.
 *
 * @returns A promise that settles once it's fired, with no value.
 *
 * @example
 * ```ts
 * bipFakFun(page) // => Promise<void>
 * ```
 *
*/

const bipFakFun = ( curPagObj : Page ) : Promise< void > => curPagObj.evaluate( () => { // What: Before Install Prompt Fake Function. Why: The note and the button wait for the browser's prompt. How: This fires a stand-in in the page.


	const bipEveObj = new Event( 'beforeinstallprompt', { cancelable : true } ); // What: Before Install Prompt Event Object. Why: The app keeps whatever the browser fires under that name. How: This makes one that can be cancelled, as the real one can.


	Object.assign( bipEveObj, { prompt : async () => { Reflect.set( window, 'proCouNum', Number( Reflect.get( window, 'proCouNum' ) ?? 0 ) + 1 ); }, userChoice : Promise.resolve( { outcome : 'accepted' } ) } ); // What: Prompt Assign Call. Why: The app shows the prompt and reads the answer. How: This adds a prompt that counts its calls and an accepted answer.

	window.dispatchEvent( bipEveObj ); // What: Dispatch Call. Why: The app hears it as the browser's prompt. How: This fires it.


} );

// #endregion bipFakFun



// #region steRunFun

/**
 * steRunFun = Steps Run Function
 *
 * @summary
 * Takes a loaded page to the screen a state names by using the app as a person
 * would: the loading state waits for the loader on a page whose database is
 * held ({@link datHolFun}), the join state opens another device's invite
 * link and the waiting state asks through it ({@link joiSteFun}), the map
 * state joins Beach Day from another device's group ({@link memSteFun}),
 * where the owner shares as arrived, and shares from its Map section, and
 * the member state joins it and opens its Settings section, as does the
 * offered state once the group is offered to it. Otherwise the create state
 * opens the form for starting a group and reloads it, so it shows with
 * nothing focused, the group state creates a group named Beach Day, for the
 * chat state fills its chat ({@link chaSteFun}), as do the edit, event,
 * events, and form states, and then opens the app afresh, so the group shows
 * as it does on a later visit, with nothing focused. The event state then
 * opens the pinned event's sheet, the edit state an item's form in it, the
 * events state the Events section, the form state the section's form, the
 * people state the People section, the requests state that section once two
 * people have asked to join ({@link reqSteFun}), the settings state the
 * Settings section, the delete state its deletion's confirmation, and the
 * sheet state the group sheet from its switcher. A group needs the Firebase
 * Emulators, which the suites that reach one run inside.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to take there.
 * @param steStr    - Steps String: The steps to run.
 *
 * @returns A promise that settles once the screen is showing, with no value.
 *
 * @example
 * ```ts
 * steRunFun(page, 'group') // => Promise<void>
 * ```
 *
*/

async function steRunFun ( curPagObj : Page, steStr : 'chat' | 'create' | 'delete' | 'edit' | 'event' | 'events' | 'form' | 'group' | 'helping' | 'history' | 'join' | 'legal' | 'loading' | 'map' | 'member' | 'note' | 'offered' | 'paste' | 'people' | 'requests' | 'settings' | 'sheet' | 'waiting' ) : Promise< void > {


	if ( steStr === 'loading' ) { // What: Loading Block. Why: The loading state stops at the waiting screen, its database held since before the load. How: This waits for the loader's status and stops.


		await expect( curPagObj.getByRole( 'main' ).getByRole( 'status' ) ).toHaveText( 'Loading' ); // What: Loader Wait. Why: The loader shows once its delay passes. How: This waits for its status message.



		return; // What: Loading Return. Why: Nothing more reaches this screen. How: This returns.


	}



	if ( steStr === 'join' || steStr === 'waiting' ) { await joiSteFun( curPagObj, steStr ); return; } // What: Join Guard. Why: The join states open another's invite link rather than start a group. How: This runs the join steps and returns.



	if ( steStr === 'note' ) { // What: Note Block. Why: The note state shows the install note on the welcome. How: This fires a stand-in prompt, waits for the note, and stops.


		await bipFakFun( curPagObj ); // What: Prompt Fire Call. Why: The note waits for the browser's prompt. How: This fires a stand-in.

		await curPagObj.getByRole( 'heading', { level : 2, name : 'Install Come Hang' } ).waitFor(); // What: Note Wait. Why: The note shows once the prompt is kept. How: This waits for its heading.



		return; // What: Note Return. Why: The note state stops at the welcome. How: This returns.


	}



	if ( steStr === 'paste' ) { // What: Paste Block. Why: The paste state is checked as the screen opens on a reload, with nothing focused, rather than with focus on the heading opening it gave. How: This opens it from the welcome, reloads it, and stops.


		await curPagObj.getByRole( 'button', { name : 'Join with an invite link' } ).click(); // What: Join Click Call. Why: The screen opens from the welcome. How: This presses its button.

		await curPagObj.reload(); // What: Screen Reload Call. Why: The screen is checked as a fresh load, which its history entry keeps. How: This reloads it.

		await curPagObj.getByRole( 'heading', { level : 1, name : 'Join with an invite link' } ).waitFor(); // What: Reloaded Screen Wait. Why: The screen shows once the app has checked for groups. How: This waits for its heading.



		return; // What: Paste Return. Why: The paste state stops at the screen. How: This returns.


	}



	if ( steStr === 'map' ) { // What: Map Block. Why: The map state shows the page sharing beside a member who has arrived. How: This joins the page to the owner's group, gives it a position, shares from the Map section, reloads so nothing is focused, waits for the plot and the resumed share, and stops.


		await memSteFun( curPagObj, 'map' ); // What: Member Steps Call. Why: The page needs another member sharing for an open event. How: This joins it to the owner's group, where the owner shares.

		await curPagObj.context().grantPermissions( [ 'geolocation' ] ); // What: Permission Call. Why: Sharing needs the position. How: This grants it to the page.

		await curPagObj.context().setGeolocation( { accuracy : 10, latitude : 51.5, longitude : -0.12 } ); // What: Position Call. Why: The page is a little south of the owner. How: This places it.

		await curPagObj.goto( '/' ); // What: Fresh Open Call. Why: The watch started before the identity existed, so the app opens afresh to show the group. How: This opens the app again.

		await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Map' } ).click(); // What: Map Click Call. Why: The section opens from its tab. How: This presses it.

		await curPagObj.getByRole( 'button', { name : 'Share my location' } ).click(); // What: Share Click Call. Why: The plot is drawn around the page once it shares. How: This presses the button.

		await curPagObj.getByRole( 'button', { name : 'Stop sharing' } ).waitFor(); // What: Sharing Wait. Why: The share has to start before the reload. How: This waits for the stop.

		await curPagObj.reload(); // What: Section Reload Call. Why: The section is checked as it opens on a later visit, with nothing focused. How: This reloads it, which its history entry keeps, resuming the share.

		await curPagObj.getByRole( 'img', { name : /^Everyone sharing/ } ).waitFor(); // What: Plot Wait. Why: The section has to show the plot before it's checked. How: This waits for it.

		await curPagObj.getByRole( 'button', { name : 'Stop sharing' } ).waitFor(); // What: Resumed Wait. Why: The section has to show the resumed share before it's checked. How: This waits for the stop.



		return; // What: Map Return. Why: The map state stops at the section. How: This returns.


	}



	if ( steStr === 'helping' || steStr === 'history' ) { // What: History Block. Why: The history states show the banner's offer to a fresh joiner, and People's list to a member who can help. How: This joins the page to another's group set up for each, opens the app, and waits for the part.


		await memSteFun( curPagObj, steStr ); // What: Member Steps Call. Why: Both states need the page to be a member of another's group. How: This joins it, with the group made older or the owner asking.

		await curPagObj.goto( '/' ); // What: Fresh Open Call. Why: The watch started before the identity existed. How: This opens the app again on the group's chat.



		if ( steStr === 'history' ) { await curPagObj.getByRole( 'button', { name : 'Ask the group' } ).waitFor(); return; } // What: Offer Guard. Why: The history state stops at the banner's offer. How: This waits for its button and returns.



		await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: Requests are answered in People. How: This opens it.

		await curPagObj.getByRole( 'button', { name : 'Send history to Alice' } ).waitFor(); // What: Send Wait. Why: The row offers to send once the device's coverage is checked. How: This waits for its button.



		return; // What: History Return. Why: The helping state stops at the list. How: This returns.


	}



	if ( steStr === 'member' || steStr === 'offered' ) { // What: Member Block. Why: The member states open Settings in another's group, which they join rather than start, the offered state with the group offered to them. How: This joins through the owner's device, opens the app afresh, presses the tab, reloads the section so nothing is focused, waits for the leave, and stops.


		await memSteFun( curPagObj, steStr ); // What: Member Steps Call. Why: The page has to be a member who isn't the owner, offered the group in the offered state. How: This joins it to another's group.

		await curPagObj.goto( '/' ); // What: Fresh Open Call. Why: The watch started before the identity existed, so the app opens afresh to show the group. How: This opens the app again.

		await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Settings' } ).click(); // What: Settings Click Call. Why: The section opens from its tab. How: This presses it.

		await curPagObj.reload(); // What: Section Reload Call. Why: The section is checked as it opens on a later visit, with nothing focused. How: This reloads it, which its history entry keeps.

		if ( steStr === 'offered' ) await curPagObj.getByRole( 'button', { name : 'Accept' } ).waitFor(); // What: Offer Wait. Why: The offered state has to show the offer before it's checked. How: This waits for its Accept.

		await curPagObj.getByRole( 'button', { name : 'Leave group' } ).waitFor(); // What: Leave Wait. Why: The section has to show the leave before it's checked. How: This waits for its button.



		return; // What: Member Return. Why: The member state stops at the section. How: This returns.


	}



	await curPagObj.getByRole( 'button', { name : 'Start a group' } ).click(); // What: Start Click Call. Why: Every state with steps starts from the form. How: This opens it from the welcome.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Start a group' } ).waitFor(); // What: Form Wait. Why: The form has to be showing before it's used. How: This waits for its heading.


	if ( steStr === 'create' ) { // What: Create Block. Why: The create state is checked as the form opens on a reload, with nothing focused, rather than with focus on the heading opening it gave. How: This reloads the form, which its history entry keeps, and stops.


		await curPagObj.reload(); // What: Form Reload Call. Why: The form is checked as a fresh load of its screen. How: This reloads it.

		await curPagObj.getByRole( 'heading', { level : 1, name : 'Start a group' } ).waitFor(); // What: Reloaded Form Wait. Why: The form shows once the app has checked for groups. How: This waits for its heading.



		return; // What: Create Return. Why: The create state stops at the form. How: This returns.


	}



	await curPagObj.getByLabel( 'Group name' ).fill( 'Beach Day' );          // What: Group Name Fill Call. Why: The group needs a name. How: This types it.
	await curPagObj.getByLabel( 'Your name in this group' ).fill( 'Alice' ); // What: Person Name Fill Call. Why: The creator needs a name in it. How: This types it.

	await curPagObj.getByRole( 'button', { name : 'Create group' } ).click(); // What: Create Click Call. Why: The group is made through the real form. How: This submits it.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ).waitFor(); // What: Group Wait. Why: The group has to exist before the app is opened again. How: This waits for its heading.

	if ( [ 'chat', 'edit', 'event', 'events', 'form' ].includes( steStr ) ) await chaSteFun( curPagObj ); // What: Chat Steps Call. Why: The chat, edit, event, events, and form states show a planned event with its list, and a message. How: This plans one and sends one.

	await curPagObj.goto( '/' ); // What: Fresh Open Call. Why: A later visit shows the group without the focus its creation gave it. How: This opens the app again.

	await curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ).waitFor(); // What: Reopened Group Wait. Why: The group shows once its list has loaded. How: This waits for its heading.


	if ( steStr === 'edit' || steStr === 'event' ) { // What: Event Block. Why: The event state opens the pinned event's sheet, and the edit state an item's form in it. How: This presses the card, waits for the sheet's list, opens the open item's form for the edit state, and stops.


		await curPagObj.getByRole( 'button', { name : /Friendsgiving/ } ).click(); // What: Card Click Call. Why: The sheet opens from the pinned event. How: This presses the card.

		await curPagObj.getByRole( 'dialog', { name : 'Friendsgiving' } ).getByRole( 'button', { name : 'Pumpkin pie (change)' } ).waitFor(); // What: Event Sheet Wait. Why: The sheet has to be open with its list loaded before it's checked. How: This waits for an item in the dialog.


		if ( steStr === 'edit' ) await curPagObj.getByRole( 'button', { name : 'Rolls (change)' } ).click(); // What: Label Click Call. Why: The edit state shows an item's form. How: This opens the open item's form.



		return; // What: Event Return. Why: The event state stops at its sheet. How: This returns.


	}



	if ( steStr === 'events' || steStr === 'form' ) { // What: Events Block. Why: The events states open the Events section, and the form state its form too. How: This presses the tab, reloads the section, waits for its list, opens the form for the form state, and stops.


		await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Events' } ).click(); // What: Events Click Call. Why: The section opens from its tab. How: This presses it.

		await curPagObj.reload(); // What: Section Reload Call. Why: The section is checked as it opens on a later visit, with nothing focused, rather than with focus on the tab that opened it. How: This reloads it, which its history entry keeps.

		await curPagObj.getByRole( 'button', { name : /Friendsgiving/ } ).waitFor(); // What: Events Wait. Why: The section has to show its list before it's checked. How: This waits for the event's card.



		if ( steStr === 'events' ) return; // What: Events Return. Why: The events state stops at the list. How: This returns.



		await curPagObj.getByRole( 'button', { name : 'Plan an event' } ).click(); // What: Plan Click Call. Why: The form opens from its button. How: This presses it.

		await curPagObj.getByRole( 'dialog', { name : 'Plan an event' } ).waitFor(); // What: Form Wait. Why: The form has to be open before it's checked. How: This waits for its sheet.



		return; // What: Form Return. Why: The form state stops at the open form. How: This returns.


	}



	if ( steStr === 'people' || steStr === 'requests' ) { // What: People Block. Why: The people states open the People section, and the requests states have two people ask to join first. How: This presses the tab, files the requests for the requests states, reloads the section so nothing is focused, waits for its members and any requests, and stops.


		await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: The section opens from its tab. How: This presses it.

		if ( steStr === 'requests' ) await reqSteFun( curPagObj ); // What: Requests Steps Call. Why: The waiting list shows only while someone is waiting. How: This has two people ask to join.

		await curPagObj.reload(); // What: Section Reload Call. Why: The section is checked as it opens on a later visit, with nothing focused. How: This reloads it, which its history entry keeps.

		await curPagObj.getByRole( 'heading', { level : 3, name : 'Members (1)' } ).waitFor(); // What: Members Wait. Why: The section has to show its members before it's checked. How: This waits for the counted heading.


		if ( steStr === 'requests' ) await curPagObj.getByRole( 'heading', { level : 3, name : 'Waiting to join (2)' } ).waitFor(); // What: Requests Wait. Why: The waiting list has to show both requests before it's checked. How: This waits for its counted heading.



		return; // What: People Return. Why: The people states stop at the section. How: This returns.


	}



	if ( steStr === 'delete' || steStr === 'legal' || steStr === 'settings' ) { // What: Settings Block. Why: The settings states open the owner's Settings section, the delete state the deletion's confirmation too, and the legal state the privacy policy's sheet. How: This presses the tab, reloads the section so nothing is focused, waits for its form, opens the confirmation or the sheet for those states, and stops.


		await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Settings' } ).click(); // What: Settings Click Call. Why: The section opens from its tab. How: This presses it.

		await curPagObj.reload(); // What: Section Reload Call. Why: The section is checked as it opens on a later visit, with nothing focused. How: This reloads it, which its history entry keeps.

		await curPagObj.getByRole( 'button', { name : 'Save' } ).waitFor(); // What: Form Wait. Why: The section has to show the owner's form before it's checked. How: This waits for its button.


		if ( steStr === 'delete' ) await curPagObj.getByRole( 'button', { name : 'Delete group' } ).click(); // What: Delete Click Call. Why: The delete state shows the confirmation. How: This opens it.



		if ( steStr === 'legal' ) { // What: Legal Block. Why: The legal state shows the privacy policy's sheet. How: This opens it and waits for its text.


			await curPagObj.getByRole( 'button', { name : 'Privacy Policy' } ).click(); // What: Privacy Click Call. Why: The sheet opens from its button. How: This presses it.

			await curPagObj.getByRole( 'dialog', { name : 'Privacy Policy' } ).getByRole( 'heading', { name : 'The short version' } ).waitFor(); // What: Sheet Wait. Why: The sheet has to be open with the policy in it before it's checked. How: This waits for its first section's heading.


		}



		return; // What: Settings Return. Why: The settings states stop at the section. How: This returns.


	}



	if ( steStr !== 'sheet' ) return; // What: Frame Guard. Why: The group and chat states stop at the frame. How: This returns for every state but the sheet's.



	await curPagObj.getByRole( 'button', { name : 'Beach Day' } ).click(); // What: Switcher Click Call. Why: The sheet opens from the group's name. How: This presses the switcher.

	await curPagObj.getByRole( 'dialog', { name : 'Your groups' } ).waitFor(); // What: Sheet Wait. Why: The sheet has to be open before it's checked. How: This waits for the dialog.


}

// #endregion steRunFun



// #region opeStaFun

/**
 * opeStaFun = Open State Function
 *
 * @summary
 * Opens one state on a page and waits until it's settled: sets the phone's
 * color scheme, sizes the viewport, holds the app's database for the loading
 * state, loads the path, waits for the web fonts, runs the state's steps
 * ({@link steRunFun}), then waits until the page stays still ({@link
 * waiSetFun}), so a check never measures a heading halfway through an
 * entrance fade.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open the state on.
 * @param staRecObj - State Record Object: {@link StaRecTyp}
 *
 * @returns A promise that settles once the state is open and settled, with no
 *          value.
 *
 * @example
 * ```ts
 * opeStaFun(page, staRecObj) // => Promise<void>
 * ```
 *
*/

async function opeStaFun ( curPagObj : Page, staRecObj : StaRecTyp ) : Promise< void > {


	await curPagObj.emulateMedia( { colorScheme : staRecObj.schStr ?? 'light' } ); // What: Color Scheme Call. Why: The state's colors depend on the phone's light or dark setting. How: This sets the page's preference before it loads, light unless the state names dark.

	await curPagObj.setViewportSize( { height : staRecObj.heiNum, width : staRecObj.widNum } ); // What: Viewport Size Call. Why: The state's layout depends on its width. How: This sizes the page before it loads, so breakpoints apply from the first paint.

	if ( staRecObj.iosBoo === true ) await curPagObj.addInitScript( ( uasValStr ) => Object.defineProperty( Navigator.prototype, 'userAgent', { get : () => uasValStr } ), IOS_UAS_STR ); // What: iOS Agent Call. Why: The app tells an iPhone by its user agent, which the suite's browsers don't send. How: This makes the page report an iPhone's Safari before it loads.

	if ( staRecObj.steStr === 'loading' ) await curPagObj.addInitScript( datHolFun, -1 ); // What: Database Hold Call. Why: The waiting screen shows only while the app's check is held. How: This holds the app's database for good, before the page loads.

	await curPagObj.goto( staRecObj.patStr ); // What: Page Load Call. Why: Each state starts from a fresh load of its route. How: This opens the path on the suite's server.

	await curPagObj.evaluate( () => document.fonts.ready ); // What: Fonts Ready Wait. Why: Text measured before its web font loads would have the wrong size and wrapping. How: This waits until the fonts the page uses have loaded.

	if ( staRecObj.steStr !== undefined ) await steRunFun( curPagObj, staRecObj.steStr ); // What: Steps Call. Why: A screen past the first is reached by using the app. How: This runs the state's steps, when it has any.

	await waiSetFun( curPagObj ); // What: Settled Page Wait. Why: A check should see the page at rest, not mid-fade. How: This waits until the page stays still for half a second.


}

// #endregion opeStaFun

// #endregion Helpers



// #region Exports

export { bipFakFun, datHolFun, opeStaFun, reqSteFun, STA_REC_ARR, type StaRecTyp }; // What: Named Exports. Why: The suites share these states, their opener, the hold that slows the app's launch, the joiners who ask to join, and the stand-in install prompt. How: This exports the state list, its type, and the four helpers.

// #endregion Exports


