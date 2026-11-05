


// #region Imports

import { chromium      } from '@playwright/test'; // What: Chromium. Why: The screens are captured in a real browser, through the app itself. How: This launches Playwright's Chromium.
import { createServer  } from 'vite';             // What: Create Server. Why: The app runs from its dev server against the emulators. How: This starts one from the project's config.
import { fileURLToPath } from 'node:url';         // What: File URL To Path. Why: The output folder is resolved from this script's own location. How: This turns a file URL into a path.
import { mkdirSync     } from 'node:fs';          // What: Make Directory Sync. Why: The output folder may not exist yet. How: This creates it.
import { writeFileSync } from 'node:fs';          // What: Write File Sync. Why: Each finished image is saved. How: This writes its bytes.


import type { BrowserContext } from '@playwright/test'; // What: Browser Context. Why: Each member acts from a device of their own. How: This types one.
import type { Locator        } from '@playwright/test'; // What: Locator. Why: Each capture waits for something on its screen. How: This types what it waits for.
import type { Page           } from '@playwright/test'; // What: Page. Why: Each member's device has one page. How: This types it.

// #endregion Imports



/**
 * render.mts = Landing Screenshots Renderer
 *
 * @summary
 * Rebuilds the app screenshots the landing page shows (ARCHITECTURE.md
 * Section 14), from a demo group built through the app's own functions in
 * the Emulator Suite, which npm run screenshots starts around it. Five
 * members, each in a browser context of their own, form "Lake Weekend":
 * Alex starts it and lets the others in, plans "Lake day" for Saturday with
 * a partly claimed bring-list and "Game night" after it, and everyone chats.
 * Alex's phone is then captured at the chat, the Events section, and the
 * event's sheet with its bring-list. Last, "Lake day" moves to start within
 * the hour so location sharing opens, the others share from around Miller's
 * Cove, one arrived and one on the way, and Alex's Map is captured. Each
 * screen is captured in light and dark at a phone's width and saved as WebP
 * beside the landing page. Run it whenever the app's screens change.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type MemRecTyp = { arrBoo : boolean, latNum : number, lngNum : number, namStr : string }; // What: Member Record Type. Why: Each member has a name and a place on the day. How: This types one member.

// #endregion Types



// #region Constants

const APP_URL_STR = 'http://localhost:5202/';                                                                // What: App URL String. Why: The members open the app from this script's dev server. How: This is its address.
const HOU_MIL_NUM = 3600000;                                                                                 // What: Hour Milliseconds Number. Why: The events are planned in hours. How: This is one hour in milliseconds.
const OUT_DIR_STR = fileURLToPath( new URL( '../../src/screens/landing/', import.meta.url ) );               // What: Output Directory String. Why: The landing page imports its screenshots from beside it. How: This resolves its folder from this script's.
const WEB_QUA_NUM = 0.9;                                                                                     // What: WebP Quality Number. Why: The screenshots are lossy WebP at the lowest quality that shows no difference at 3x zoom, compared on 2026-11-05, where 0.85 still left faint blotches by borders. How: This is the encoder's quality.

/**
 * MEM_REC_OBJ = Member Record Object
 *
 * @summary
 * The demo group's members by their first name's key, Alex first, as the
 * owner. Each row gives the member's full name and where they are on the
 * day, around Miller's Cove: Alex at the cove itself, Dana arrived along
 * the shore, and the others on their way from farther out.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const MEM_REC_OBJ : Record< 'ale' | 'dan' | 'jor' | 'may' | 'sam', MemRecTyp > = { // What: Member Record Object. Why: Every step names the members the same way. How: This keys each one by name.


	ale : { arrBoo : true,  latNum : 38.1012, lngNum : -92.6831, namStr : 'Alex Rivera' }, // What: Alex Row. Why: Alex starts the group and views the screens. How: This places Alex at the cove.
	dan : { arrBoo : true,  latNum : 38.1030, lngNum : -92.6790, namStr : 'Dana Kim'    }, // What: Dana Row. Why: Dana has arrived. How: This places Dana along the shore from Alex, far enough apart to show on the Map.
	jor : { arrBoo : false, latNum : 38.1210, lngNum : -92.6520, namStr : 'Jordan Lee'  }, // What: Jordan Row. Why: Jordan is a few kilometers out. How: This places Jordan northeast of the cove.
	may : { arrBoo : false, latNum : 38.0930, lngNum : -92.6930, namStr : 'Maya Patel'  }, // What: Maya Row. Why: Maya is nearly there. How: This places Maya just southwest of the cove.
	sam : { arrBoo : false, latNum : 38.0700, lngNum : -92.7400, namStr : 'Sam Ortiz'   }  // What: Sam Row. Why: Sam is on the way from farthest out. How: This places Sam southwest of the cove.


};

// #endregion Constants



// #region Helpers

const runPagFun = ( pagValObj : Page, modPatStr : string, funNamStr : string, ...argValArr : unknown[] ) : Promise< unknown > => pagValObj.evaluate( async ( [ modPatStr, funNamStr, argValArr ] ) => ( await import( /* @vite-ignore */ modPatStr ) )[ funNamStr ]( ...argValArr ), [ modPatStr, funNamStr, argValArr ] as const ); // What: Run Page Function. Why: Each step runs as a member, in their own page, through the app's modules. How: This imports the module in the page and calls the function there. // What: Type Assertion Note. Why: The page's arguments have to keep their order. How: The as const keeps them a tuple.



// #region senRetFun

/**
 * senRetFun = Send Retry Function
 *
 * @summary
 * Sends a chat message as a member, retrying for a few seconds, since a send
 * just after a join can meet the membership mirror before it catches up.
 * Rejects once the tries run out.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The member's page.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param mesTexStr - Message Text String: The message, or a status post's
 *                    text.
 * @param staKinStr - Status Kind String: A status post's kind, empty for an
 *                    ordinary message.
 *
 * @returns A promise that settles once the message is sent, with no value.
 *
 * @example
 * ```ts
 * senRetFun(danPagObj, groIdeStr, "I'm in!", '') // => Promise<void>
 * ```
 *
*/

const senRetFun = async ( pagValObj : Page, groIdeStr : string, mesTexStr : string, staKinStr : string ) : Promise< void > => { // What: Send Retry Function. Why: The mirror usually catches up within seconds of a join. How: This sends until one lands or the tries run out.


	for ( let tryIndNum = 1; ; tryIndNum++ ) { // What: Send Loop. Why: A refusal is expected until the mirror catches up. How: This tries up to 20 times.


		try { return void ( staKinStr ? await runPagFun( pagValObj, '/src/state/chat.ts', 'chaStaFun', groIdeStr, staKinStr ) : await runPagFun( pagValObj, '/src/state/chat.ts', 'chaSenFun', groIdeStr, mesTexStr ) ); } // What: Send Attempt. Why: The message goes out as the member. How: This sends a status post or a message, ending the loop once it lands.

		catch ( errCatObj ) { if ( tryIndNum === 20 ) throw errCatObj; } // What: Refusal Handler. Why: A refusal past the last try is a real failure. How: This rethrows only then.



		await new Promise( ( resValFun ) => setTimeout( resValFun, 500 ) ); // What: Retry Pause. Why: The mirror needs a moment. How: This waits half a second.


	}


};

// #endregion senRetFun



// #region webEncFun

/**
 * webEncFun = WebP Encode Function
 *
 * @summary
 * Turns a PNG capture into a lossy WebP through Chromium's canvas, so no
 * image library is needed. The encoding runs in the page given, which has to
 * be open on any address.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param encPagObj - Encode Page Object: A page to draw in.
 * @param pngBufObj - PNG Buffer Object: The capture.
 *
 * @returns A promise that resolves with the WebP's bytes.
 *
 * @example
 * ```ts
 * webEncFun(encPagObj, pngBufObj) // => Buffer
 * ```
 *
*/

const webEncFun = async ( encPagObj : Page, pngBufObj : Buffer ) : Promise< Buffer > => { // What: WebP Encode Function. Why: The landing page ships WebP, per the images rule. How: This draws the PNG on a canvas and reads it back as WebP.


	const webB64Str = await encPagObj.evaluate( async ( [ pngB64Str, quaValNum ] ) => { // What: WebP Base64 String. Why: The encoded image comes back from the page as text. How: This draws the capture and exports it.


		const imaValObj = new Image(); // What: Image Value Object. Why: The capture is drawn from an image. How: This creates one.


		imaValObj.src = `data:image/png;base64,${ pngB64Str }`; // What: Image Source Assignment. Why: The capture loads from its bytes. How: This sets a data URL.

		await imaValObj.decode(); // What: Decode Call. Why: The image has to be ready before drawing. How: This waits for it.


		const canValEle = document.createElement( 'canvas' ); // What: Canvas Value Element. Why: The canvas encodes WebP. How: This creates one.


		canValEle.height = imaValObj.naturalHeight; // What: Canvas Height Assignment. Why: The image keeps its size. How: This matches its height.
		canValEle.width  = imaValObj.naturalWidth;  // What: Canvas Width Assignment. Why: The image keeps its size. How: This matches its width.

		canValEle.getContext( '2d' )!.drawImage( imaValObj, 0, 0 ); // What: Draw Call. Why: The canvas holds the capture. How: This draws it at full size. // What: Non-Null Note. Why: A canvas always has a 2D context. How: The ! says it's there.



		return canValEle.toDataURL( 'image/webp', quaValNum ).split( ',' )[ 1 ]; // What: WebP Return. Why: The bytes go back to the script. How: This exports WebP and returns its base64.


	}, [ pngBufObj.toString( 'base64' ), WEB_QUA_NUM ] as const ); // What: Encode Arguments. Why: The page can't read the script's variables. How: This passes the capture and the quality. // What: Type Assertion Note. Why: The arguments have to keep their order. How: The as const keeps them a tuple.



	return Buffer.from( webB64Str, 'base64' ); // What: Bytes Return. Why: The caller writes the file. How: This decodes the base64.


};

// #endregion webEncFun

// #endregion Helpers



// #region Module Init

const vitSerObj = await createServer( { logLevel : 'warn', server : { port : 5202, strictPort : true } } ); // What: Vite Server Object. Why: The members load the app's modules from it. How: This starts the dev server on its own port.

await vitSerObj.listen(); // What: Listen Call. Why: The pages need the server answering. How: This starts it listening.


const broInsObj = await chromium.launch(); // What: Browser Instance Object. Why: Every member's device is a context in one browser. How: This launches Chromium.


const conRecObj = {} as Record< keyof typeof MEM_REC_OBJ, BrowserContext >; // What: Context Record Object. Why: Each member keeps their own storage and keys. How: This holds a context per member. // What: Type Assertion Note. Why: The loop below fills every member in. How: The as types it whole from the start.
const pagRecObj = {} as Record< keyof typeof MEM_REC_OBJ, Page >;           // What: Page Record Object. Why: Each member acts from one page. How: This holds a page per member. // What: Type Assertion Note. Why: The loop below fills every member in. How: The as types it whole from the start.



for ( const memKeyStr of Object.keys( MEM_REC_OBJ ) as ( keyof typeof MEM_REC_OBJ )[] ) { // What: Device Loop. Why: Each member opens the app on a phone of their own. How: This makes each context at a phone's size, with location allowed, and opens the app. // What: Type Assertion Note. Why: Object.keys widens the keys to strings. How: The as reads them as the members' keys.


	conRecObj[ memKeyStr ] = await broInsObj.newContext({ // What: Context Assignment. Why: Each member has a phone of their own, at their place on the day. How: This makes the context.


		deviceScaleFactor : 1.5,                                                                                                       // What: Device Scale Factor. Why: The landing page shows the screens small but sharp. How: This captures at one and a half pixels per point.
		geolocation       : { accuracy : 8, latitude : MEM_REC_OBJ[ memKeyStr ].latNum, longitude : MEM_REC_OBJ[ memKeyStr ].lngNum }, // What: Geolocation. Why: Sharing reads the phone's position. How: This places it where the member is.
		permissions       : [ 'geolocation' ],                                                                                         // What: Permissions. Why: Sharing asks for the position. How: This allows it.
		viewport          : { height : 844, width : 390 }                                                                              // What: Viewport. Why: The screens are a phone's. How: This sets a common phone's size.


	});

	pagRecObj[ memKeyStr ] = await conRecObj[ memKeyStr ].newPage(); // What: Page Assignment. Why: The member acts from one page. How: This opens it.

	await pagRecObj[ memKeyStr ].goto( APP_URL_STR ); // What: App Open Call. Why: The app's modules load from the page. How: This opens the app.


}



const { ale : alePagObj, dan : danPagObj, sam : samPagObj } = pagRecObj; // What: Alex Page Object. Why: Alex owns the group and is captured. How: This reads Alex's page. // What: Dana Page Object. Why: Dana plans game night and arrives first. How: This reads Dana's page. // What: Sam Page Object. Why: Sam is on the way. How: This reads Sam's page.


const groIdeStr = await runPagFun( alePagObj, '/src/state/groups.ts', 'groCreFun', 'Lake Weekend', MEM_REC_OBJ.ale.namStr ) as string; // What: Group Identifier String. Why: Every later step acts in the group. How: This creates it as Alex. // What: Type Assertion Note. Why: groCreFun resolves with the group's ID, untyped through the page. How: The as reads it as a string.


const tokValStr = await alePagObj.evaluate( ( [ groArgStr, modPatStr ] ) => new Promise< string >( ( resValFun ) => { // What: Token Value String. Why: The others join through the group's link. How: This watches Alex's groups until the new one shows its token.


	void import( /* @vite-ignore */ modPatStr ).then( ( groModObj ) => groModObj.groWatFun( ( groRecArr : { ideStr : string, tokStr : string }[] ) => { const tokNowStr = groRecArr.find( ( recValObj ) => recValObj.ideStr === groArgStr )?.tokStr; if ( tokNowStr ) resValFun( tokNowStr ); } ) ); // What: Group Watch Call. Why: The token arrives with the group list. How: This resolves once the group shows with one.


} ), [ groIdeStr, '/src/state/groups.ts' ] as const ); // What: Watch Arguments. Why: The page can't read the script's variables. How: This passes the group's ID and the groups module's path. // What: Type Assertion Note. Why: The arguments have to keep their order. How: The as const keeps them a tuple.



const uidRecObj = {} as Record< keyof typeof MEM_REC_OBJ, string >; // What: UID Record Object. Why: Approvals and claims name members by UID. How: This holds each member's. // What: Type Assertion Note. Why: The loop below fills every member in. How: The as types it whole from the start.


uidRecObj.ale = ( await runPagFun( alePagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: Alex UID Assignment. Why: Alex claims an item. How: This reads Alex's UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity, untyped through the page. How: The as reads its UID.



for ( const memKeyStr of [ 'dan', 'may', 'jor', 'sam' ] as const ) { // What: Join Loop. Why: The others ask to join, and Alex lets each in. How: This makes each identity, files its request, and approves it. // What: Type Assertion Note. Why: The keys have to stay the members' own. How: The as const keeps them literal.


	uidRecObj[ memKeyStr ] = ( await runPagFun( pagRecObj[ memKeyStr ], '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Assignment. Why: Alex approves the member by it. How: This makes the identity and reads its UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity, untyped through the page. How: The as reads its UID.

	await runPagFun( pagRecObj[ memKeyStr ], '/src/state/joins.ts', 'reqCreFun', tokValStr, MEM_REC_OBJ[ memKeyStr ].namStr, '' ); // What: Request Call. Why: The member asks to join. How: This files the request with their name.

	await runPagFun( alePagObj, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidRecObj[ memKeyStr ] ); // What: Approval Call. Why: Alex lets them in. How: This approves the request.


}



const satDatObj = new Date(); // What: Saturday Date Object. Why: "Lake day" is on the coming Saturday. How: This starts from today.


satDatObj.setDate( satDatObj.getDate() + ( ( 6 - satDatObj.getDay() + 7 ) % 7 || 7 ) ); // What: Saturday Day Assignment. Why: The screens show a weekend plan. How: This moves to the next Saturday after today.
satDatObj.setHours( 11, 0, 0, 0 );                                                      // What: Saturday Hour Assignment. Why: The group meets at 11. How: This sets 11 AM.


const gamStaNum = satDatObj.getTime() + 6 * 24 * HOU_MIL_NUM + 8 * HOU_MIL_NUM; // What: Game Start Number. Why: "Game night" follows the lake trip. How: This is the Friday after it, at 7 PM.

const lakInpObj = { // What: Lake Input Object. Why: "Lake day" is planned, then moved for the Map. How: This holds its details.


	desTexStr : 'Bring a towel and a chair.',          // What: Description Text String. Why: The sheet shows a note. How: This is it.
	endTimNum : satDatObj.getTime() + 6 * HOU_MIL_NUM, // What: End Time Number. Why: The day ends at 5. How: This is six hours after the start.
	locTexStr : "Miller's Cove",                       // What: Location Text String. Why: Everyone meets there. How: This names it.
	staTimNum : satDatObj.getTime(),                   // What: Start Time Number. Why: The group meets at 11. How: This is Saturday at 11 AM.
	titTexStr : 'Lake day'                             // What: Title Text String. Why: The plan has a name. How: This is it.


};


const lakIdeStr = await runPagFun( alePagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, lakInpObj ) as string; // What: Lake Identifier String. Why: The bring-list and sharing belong to "Lake day". How: This plans it as Alex. // What: Type Assertion Note. Why: eveCreFun resolves with the event's ID, untyped through the page. How: The as reads it as a string.


await runPagFun( danPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : gamStaNum + 4 * HOU_MIL_NUM, locTexStr : "Dana's place", staTimNum : gamStaNum, titTexStr : 'Game night' } ); // What: Game Night Call. Why: The Events section shows more than one plan. How: This plans it as Dana, for four hours.



for ( const [ iteNamStr, memKeyStr ] of [ [ 'Burgers', 'ale' ], [ 'Buns', 'dan' ], [ 'Watermelon', 'may' ], [ 'Speaker', 'jor' ], [ 'Sunscreen', '' ], [ 'Ice', '' ] ] as const ) await runPagFun( alePagObj, '/src/state/items.ts', 'iteAddFun', groIdeStr, lakIdeStr, iteNamStr, memKeyStr ? uidRecObj[ memKeyStr ] : null ); // What: Item Loop. Why: The bring-list shows claims in members' colors and open items. How: This adds each item, claimed or open. // What: Type Assertion Note. Why: The rows' member keys have to stay literal. How: The as const keeps them so.



await new Promise( ( resValFun ) => setTimeout( resValFun, 3000 ) ); // What: Join Settle Pause. Why: Messages count from each member's join time, which a clock stepping back could put after a send. How: This waits 3 seconds past the approvals.



for ( const [ memKeyStr, mesTexStr ] of [ [ 'ale', 'Lake day Saturday? Weather looks perfect' ], [ 'dan', "I'm in! I'll grab buns" ], [ 'may', 'Can someone bring a speaker?' ], [ 'jor', 'On it 🎶' ], [ 'sam', 'What time are we heading out?' ], [ 'ale', "Let's meet there at 11" ] ] as const ) await senRetFun( pagRecObj[ memKeyStr ], groIdeStr, mesTexStr, '' ); // What: Chat Loop. Why: The chat shows the group planning. How: This sends each message as its member, in order. // What: Type Assertion Note. Why: The rows' member keys have to stay literal. How: The as const keeps them so.



const encPagObj = await broInsObj.newPage(); // What: Encode Page Object. Why: The captures are encoded in a page apart from Alex's. How: This opens a blank one.



// #region capSavFun

/**
 * capSavFun = Capture Save Function
 *
 * @summary
 * Captures Alex's screen in light and then dark, once the given element
 * shows and the screen has settled, and saves each as `<name>-light.webp` and
 * `<name>-dark.webp`, logging each file and its size.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param namValStr - Name Value String: The screen's file name.
 * @param waiLocObj - Wait Locator Object: An element that shows once the
 *                    screen is ready.
 *
 * @returns A promise that settles once both files are saved, with no value.
 *
 * @example
 * ```ts
 * capSavFun('chat', alePagObj.getByText('Lake day')) // => Promise<void>
 * ```
 *
*/

const capSavFun = async ( namValStr : string, waiLocObj : Locator ) : Promise< void > => { // What: Capture Save Function. Why: Every screen is saved the same way in both schemes. How: This waits, captures, encodes, and writes each.


	await waiLocObj.waitFor(); // What: Ready Wait. Why: A capture before the screen fills would miss it. How: This waits for the element to show.



	for ( const schValStr of [ 'light', 'dark' ] as const ) { // What: Scheme Loop. Why: The landing page follows the visitor's light or dark setting. How: This captures each. // What: Type Assertion Note. Why: emulateMedia takes only known schemes. How: The as const keeps them literal.


		await alePagObj.emulateMedia( { colorScheme : schValStr, reducedMotion : 'reduce' } ); // What: Scheme Call. Why: The screen shows the scheme, at rest. How: This sets it, with motion off so nothing is caught mid-move.

		await alePagObj.mouse.move( 0, 0 ); // What: Pointer Move Call. Why: A button left hovered would show its hover look. How: This moves the pointer to the corner.

		await alePagObj.evaluate( () => ( document.activeElement as HTMLElement | null )?.blur() ); // What: Blur Call. Why: A button left focused would show its ring. How: This takes focus off it. // What: Type Assertion Note. Why: The focused element is an HTML element whenever one is focused. How: The as reads it as one, or none.

		await alePagObj.waitForTimeout( 600 ); // What: Settle Wait. Why: Colors and fonts settle after the change. How: This waits a moment.


		const webBytObj = await webEncFun( encPagObj, await alePagObj.screenshot() ); // What: WebP Bytes Object. Why: The landing page ships WebP. How: This captures the screen and encodes it.
		const outPatStr = `${ OUT_DIR_STR }${ namValStr }-${ schValStr }.webp`;        // What: Output Path String. Why: Each screen and scheme has its own file. How: This names it.


		writeFileSync( outPatStr, webBytObj ); // What: Write Call. Why: The landing page imports the file. How: This saves it.

		console.log( `Wrote ${ outPatStr } (${ webBytObj.length.toLocaleString( 'en-US' ) } bytes).` ); // What: Result Log Call. Why: The run should say what it wrote. How: This prints the path and size.


	}


};

// #endregion capSavFun



mkdirSync( OUT_DIR_STR, { recursive : true } ); // What: Folder Call. Why: The images are saved beside the landing page. How: This makes the folder when it's missing.



await alePagObj.goto( APP_URL_STR ); // What: Alex Reopen Call. Why: The chat shows the whole conversation from a fresh open. How: This opens the app again.

await capSavFun( 'chat', alePagObj.getByText( "Let's meet there at 11" ) ); // What: Chat Capture Call. Why: Stop 1 and the hero show the chat. How: This saves it.

await alePagObj.getByRole( 'button', { name : 'Events' } ).click(); // What: Events Tab Click. Why: Stop 2 shows the plans. How: This opens the Events section.

await capSavFun( 'events', alePagObj.getByRole( 'main' ).getByText( 'Game night' ) ); // What: Events Capture Call. Why: Stop 2 shows the Events section. How: This saves it.

await alePagObj.getByRole( 'button', { name : 'Chat' } ).click(); // What: Chat Tab Click. Why: The event's sheet opens from the chat's pinned card. How: This returns to the chat.

await alePagObj.getByRole( 'button', { name : /Lake day/ } ).first().click(); // What: Card Click. Why: Stop 3 shows the bring-list. How: This opens the event's sheet.

await capSavFun( 'bring', alePagObj.getByRole( 'dialog' ).getByText( 'Watermelon' ) ); // What: Bring Capture Call. Why: Stop 3 and the hero show the bring-list. How: This saves it.

await alePagObj.keyboard.press( 'Escape' ); // What: Sheet Close Press. Why: The Map is next. How: This closes the sheet.


const mapStaNum = Math.ceil( ( Date.now() + HOU_MIL_NUM / 2 ) / 900000 ) * 900000; // What: Map Start Number. Why: Sharing opens 3 hours before an event starts, so the Map needs "Lake day" soon. How: This starts it on the quarter hour after half an hour from now.


await runPagFun( alePagObj, '/src/state/events.ts', 'eveUpdFun', groIdeStr, lakIdeStr, { ...lakInpObj, endTimNum : mapStaNum + 6 * HOU_MIL_NUM, staTimNum : mapStaNum } ); // What: Event Move Call. Why: The Map shows sharing for an event about to start. How: This moves "Lake day" to start soon.



for ( const memKeyStr of [ 'dan', 'may', 'jor', 'sam' ] as const ) await runPagFun( pagRecObj[ memKeyStr ], '/src/state/location.ts', 'locShaFun', groIdeStr, lakIdeStr, MEM_REC_OBJ[ memKeyStr ].arrBoo ); // What: Share Loop. Why: The Map shows the others around the cove. How: This starts each one's sharing from their device's place, Dana as arrived. // What: Type Assertion Note. Why: The keys have to stay the members' own. How: The as const keeps them literal.


await senRetFun( danPagObj, groIdeStr, '', 'arr' ); // What: Arrival Post Call. Why: The chat shows Dana has arrived. How: This posts the status.
await senRetFun( samPagObj, groIdeStr, '', 'way' ); // What: Way Post Call. Why: The chat shows Sam is on the way. How: This posts the status.

await alePagObj.getByRole( 'button', { name : 'Map' } ).click(); // What: Map Tab Click. Why: Stop 4 shows the Map. How: This opens the Map section.

await alePagObj.getByRole( 'button', { name : 'Share my location' } ).click(); // What: Share Click. Why: Distances show once Alex shares. How: This starts Alex's sharing from the cove.

await capSavFun( 'map', alePagObj.getByRole( 'main' ).getByText( 'Sam Ortiz' ).last() ); // What: Map Capture Call. Why: Stop 4 and the hero show the Map. How: This saves it.

await broInsObj.close(); // What: Browser Close Call. Why: The script should exit once the images are saved. How: This shuts Chromium down.

await vitSerObj.close(); // What: Server Close Call. Why: The dev server isn't needed after. How: This stops it.

// #endregion Module Init


