


// #region Imports

import type * as ChaModTyp from '../state/chat.ts';            // What: Chat Module Type. Why: A frame's chat module is typed from the real one. How: This imports its shape.
import type * as EveModTyp from '../state/events.ts';          // What: Event Module Type. Why: A frame's events module is typed from the real one. How: This imports its shape.
import type * as FirModTyp from '../platform/firebase.ts';     // What: Firebase Module Type. Why: A frame's Firebase module is typed from the real one. How: This imports its shape.
import type * as GroModTyp from '../state/groups.ts';          // What: Group Module Type. Why: A frame's groups module is typed from the real one. How: This imports its shape.
import type * as IdeModTyp from '../state/identity.ts';        // What: Identity Module Type. Why: A frame's identity module is typed from the real one. How: This imports its shape.
import type * as IteModTyp from '../state/items.ts';           // What: Item Module Type. Why: A frame's items module is typed from the real one. How: This imports its shape.
import type * as JoiModTyp from '../state/joins.ts';           // What: Join Module Type. Why: A frame's joins module is typed from the real one. How: This imports its shape.
import type * as ProModTyp from '../platform/dev-profile.ts';  // What: Profile Module Type. Why: A frame's profile module is typed from the real one. How: This imports its shape.

// #endregion Imports



/**
 * seed.ts = Development Seed
 *
 * @summary
 * Builds a demo group in the emulators for trying the app as several people
 * from one browser (ARCHITECTURE.md Section 14). Each member acts in a
 * hidden frame of its own, which loads the app's modules as that member's
 * profile, so every step goes through the app's own functions and each
 * member's keys stay in this browser for the switcher to act as later.
 * Members act one at a time, since each frame's Firestore client holds
 * connections to the emulator. Seeding first signs each seeded member out
 * and forgets what its profile kept, so a second run starts the members
 * afresh. It then creates the
 * group as Alex, lets Sam and Priya in through the invite and Alex's
 * approval, leaves Jordan's request waiting, plans a picnic starting soon,
 * with a partly claimed bring-list, and a game night, and starts the chat.
 * The list of members the switcher offers lives here too. Only the dev
 * server loads this file.
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

type FrmRecTyp = { chaModObj : typeof ChaModTyp, eleFraObj : HTMLIFrameElement, eveModObj : typeof EveModTyp, firModObj : typeof FirModTyp, groModObj : typeof GroModTyp, ideModObj : typeof IdeModTyp, iteModObj : typeof IteModTyp, joiModObj : typeof JoiModTyp, proModObj : typeof ProModTyp, winValObj : Window }; // What: Frame Record Type. Why: Every step acts through one member's frame and its modules. How: This types the frame, its window, and the modules loaded in it.

// #endregion Types



// #region Constants

const HOU_MIL_NUM = 3600000;           // What: Hour Milliseconds Number. Why: The events are planned hours apart. How: This is one hour in milliseconds.
const JOR_NAM_STR = 'Jordan Lee';      // What: Jordan Name String. Why: A request left waiting shows the People section's review. How: This names its sender.
const JOR_PRO_STR = 'jordan';          // What: Jordan Profile String. Why: Jordan acts in a frame of their own, but has nothing to switch to while waiting. How: This names the profile, left out of the switcher's list.
const QUA_MIL_NUM = 900000;            // What: Quarter Milliseconds Number. Why: The picnic starts on a quarter hour, as people plan. How: This is 15 minutes in milliseconds.
const SEN_TRY_NUM = 20;                // What: Send Tries Number. Why: A send just after the joins can meet the membership mirror before it catches up. How: This caps the retries.

/**
 * DEV_MEM_ARR = Development Member Array
 *
 * @summary
 * The members the switcher can act as, in its order: the device's own
 * identity, then the seeded members. Each row names the member and the
 * profile its storage is kept under, empty for the device's own identity.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const DEV_MEM_ARR : { namStr : string, proStr : string }[] = [ // What: Development Member Array. Why: The switcher lists who can be acted as. How: This names each member and its profile.


	{ namStr : 'You',        proStr : ''      }, // What: Own Identity Row. Why: The device's own identity stays one choice away. How: This names it, with no profile.
	{ namStr : 'Alex Kim',   proStr : 'alex'  }, // What: Alex Row. Why: Alex owns the demo group. How: This names Alex and the profile.
	{ namStr : 'Sam Ortiz',  proStr : 'sam'   }, // What: Sam Row. Why: Sam is a member who joined. How: This names Sam and the profile.
	{ namStr : 'Priya Nair', proStr : 'priya' }  // What: Priya Row. Why: Priya is a member who joined. How: This names Priya and the profile.


];

// #endregion Constants



// #region Helpers

// #region modImpFun

/**
 * modImpFun = Module Import Function
 *
 * @summary
 * Imports one of the app's modules inside a frame, so it runs as the
 * frame's member with the frame's own Firebase app and storage, and
 * resolves with the module. Only the Vite dev server serves the source path.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param winValObj - Window Value Object: The frame's window.
 * @param patValStr - Path Value String: The module's source path.
 *
 * @returns A promise that resolves with the frame's copy of the module.
 *
 * @example
 * ```ts
 * modImpFun(winValObj, '/src/state/groups.ts') // => { groCreFun, ... }
 * ```
 *
*/

const modImpFun = < T >( winValObj : Window, patValStr : string ) : Promise< T > => new ( winValObj as unknown as { Function : FunctionConstructor } ).Function( 'patValStr', 'return import( patValStr )' )( patValStr ) as Promise< T >; // What: Module Import Function. Why: A module imported from this page would run as this page's member. How: This builds the import with the frame's own Function, so it resolves in the frame. // What: Type Assertion Note. Why: A frame's window is typed as a plain Window, without its globals, and Function returns any. How: The as reads its Function constructor and the import's promise.

// #endregion modImpFun



// #region frmOpeFun

/**
 * frmOpeFun = Frame Open Function
 *
 * @summary
 * Opens a hidden frame acting as one member's profile, and resolves once
 * the app's modules the seed uses are loaded in it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param proValStr - Profile Value String: The member's profile.
 *
 * @returns A promise that resolves with the frame and its modules.
 *
 * @example
 * ```ts
 * frmOpeFun('sam') // => { chaModObj, eleFraObj, ... }
 * ```
 *
*/

const frmOpeFun = async ( proValStr : string ) : Promise< FrmRecTyp > => { // What: Frame Open Function. Why: Each member acts in a page of its own. How: This adds the frame, waits for it to load, then loads the modules in it.


	const eleFraObj = document.createElement( 'iframe' ); // What: Element Frame Object. Why: The member's page is a frame. How: This creates it.


	eleFraObj.hidden = true;                                                 // What: Hidden Assignment. Why: Nobody needs to see the frame. How: This hides it.
	eleFraObj.src    = `/src/dev/seed-frame.html?dev-member=${ proValStr }`; // What: Source Assignment. Why: The frame acts as the member its address names. How: This loads the empty frame page with the member's profile.


	await new Promise( ( resValFun ) => { // What: Load Wait. Why: Modules load only once the frame's page has. How: This resolves on its load event.


		eleFraObj.addEventListener( 'load', resValFun, { once : true } ); // What: Load Listener Call. Why: The page loads once. How: This resolves the wait then.

		document.body.append( eleFraObj ); // What: Append Call. Why: A frame loads once it's in the page. How: This adds it to the body.


	} );


	const winValObj = eleFraObj.contentWindow!; // What: Window Value Object. Why: The modules load in the frame's window. How: This reads it. // What: Non-Null Note. Why: A frame in the page that has loaded has a window. How: The ! says it's there.



	return { // What: Frame Return. Why: Every step acts through the frame's modules. How: This loads each module in the frame and returns them with the frame.


		chaModObj : await modImpFun< typeof ChaModTyp >( winValObj, '/src/state/chat.ts' ),           // What: Chat Module Object. Why: The members chat. How: This loads the chat module in the frame.
		eleFraObj,                                                                                    // What: Element Frame Object. Why: The frame is removed once its member is done. How: This hands it back.
		eveModObj : await modImpFun< typeof EveModTyp >( winValObj, '/src/state/events.ts' ),         // What: Event Module Object. Why: The members plan events. How: This loads the events module in the frame.
		firModObj : await modImpFun< typeof FirModTyp >( winValObj, '/src/platform/firebase.ts' ),    // What: Firebase Module Object. Why: A reset signs the member out. How: This loads the Firebase module in the frame.
		groModObj : await modImpFun< typeof GroModTyp >( winValObj, '/src/state/groups.ts' ),         // What: Group Module Object. Why: Alex starts the group and reads its link. How: This loads the groups module in the frame.
		ideModObj : await modImpFun< typeof IdeModTyp >( winValObj, '/src/state/identity.ts' ),       // What: Identity Module Object. Why: Each member's UID is read. How: This loads the identity module in the frame.
		iteModObj : await modImpFun< typeof IteModTyp >( winValObj, '/src/state/items.ts' ),          // What: Item Module Object. Why: Alex fills the bring-list. How: This loads the items module in the frame.
		joiModObj : await modImpFun< typeof JoiModTyp >( winValObj, '/src/state/joins.ts' ),          // What: Join Module Object. Why: The members ask to join and Alex approves. How: This loads the joins module in the frame.
		proModObj : await modImpFun< typeof ProModTyp >( winValObj, '/src/platform/dev-profile.ts' ), // What: Profile Module Object. Why: A reset names the member's storage. How: This loads the profile module in the frame.
		winValObj                                                                                     // What: Window Value Object. Why: A reset deletes the member's database through the frame's window. How: This hands it back.


	};


};

// #endregion frmOpeFun



// #region proResFun

/**
 * proResFun = Profile Reset Function
 *
 * @summary
 * Starts a member afresh: signs its frame's identity out, deletes its
 * IndexedDB database with its keys and chat history, and removes its local
 * storage keys, so the next step makes it a new identity.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param fraRecObj - Frame Record Object: The member's frame.
 *
 * @returns A promise that settles once the member is reset, with no value.
 *
 * @example
 * ```ts
 * proResFun(fraRecObj) // => Promise<void>
 * ```
 *
*/

const proResFun = async ( fraRecObj : FrmRecTyp ) : Promise< void > => { // What: Profile Reset Function. Why: A second seed shouldn't build on the first one's members. How: This signs out and forgets what the member kept.


	await fraRecObj.firModObj.firGetFun().autValObj.signOut(); // What: Sign Out Call. Why: The member's next action should make a new identity. How: This signs the frame's identity out.


	await new Promise< void >( ( resValFun, rejValFun ) => { // What: Database Delete Wait. Why: The old keys mustn't outlive their identity. How: This deletes the member's database and waits for it to go.


		const delReqObj = fraRecObj.winValObj.indexedDB.deleteDatabase( fraRecObj.proModObj.proKeyFun( 'come-hang' ) ); // What: Delete Request Object. Why: The member's database is named for its profile. How: This asks for it to be deleted.


		delReqObj.onsuccess = () => resValFun();                 // What: Success Handler. Why: The member starts afresh once it's gone. How: This resolves then.
		delReqObj.onerror   = () => rejValFun( delReqObj.error ); // What: Error Handler. Why: A failed delete has to stop the seed. How: This rejects with the error.


	} );


	const sufValStr = fraRecObj.proModObj.proKeyFun( '' ); // What: Suffix Value String. Why: Every key the member kept ends in its profile. How: This names that ending.



	for ( const keyNamStr of Object.keys( localStorage ) ) if ( keyNamStr.startsWith( 'come-hang-' ) && keyNamStr.endsWith( sufValStr ) ) localStorage.removeItem( keyNamStr ); // What: Key Removal Loop. Why: A kept sharing record or notifications choice belongs to the old identity. How: This removes each of the member's keys.


};

// #endregion proResFun



// #region tokWaiFun

/**
 * tokWaiFun = Token Wait Function
 *
 * @summary
 * Watches the owner's group list until the new group shows with its invite
 * token, then stops watching and resolves with the token.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param fraRecObj - Frame Record Object: The owner's frame.
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the invite token.
 *
 * @example
 * ```ts
 * tokWaiFun(fraRecObj, 'Xk3...') // => 'q2...'
 * ```
 *
*/

const tokWaiFun = async ( fraRecObj : FrmRecTyp, groIdeStr : string ) : Promise< string > => { // What: Token Wait Function. Why: The others join through the group's link. How: This reads its token from the owner's group list.


	let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch ends once the token is read. How: This holds its stop, set once the watch starts.



	const tokValStr = await new Promise< string >( ( resValFun ) => { // What: Token Value String. Why: The token arrives with the group list. How: This resolves once the group shows with one.


		void fraRecObj.groModObj.groWatFun( ( groRecArr ) => { // What: Group Watch Call. Why: The new group shows in the list once its membership is written. How: This checks each update for it.


			const groRecObj = groRecArr.find( ( recValObj ) => recValObj.ideStr === groIdeStr ); // What: Group Record Object. Why: Only the new group's token is wanted. How: This finds it.



			if ( groRecObj?.tokStr ) resValFun( groRecObj.tokStr ); // What: Token Resolve Call. Why: The wait ends with the token. How: This resolves with it once it's there.


		} ).then( ( stoFunVal ) => { stoWatFun = stoFunVal; } ); // What: Stop Keep Call. Why: The watch is stopped once the token is read. How: This keeps its stop.


	} );


	stoWatFun(); // What: Watch Stop Call. Why: The token is read. How: This ends the watch.



	return tokValStr; // What: Token Return. Why: The others join with it. How: This returns it.


};

// #endregion tokWaiFun



// #region senRetFun

/**
 * senRetFun = Send Retry Function
 *
 * @summary
 * Sends a chat message as a frame's member, retrying every half second
 * while the rules refuse it because the membership mirror hasn't caught up
 * with a join, and throws the last refusal after 20 tries.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param fraRecObj - Frame Record Object: The sender's frame.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param mesTexStr - Message Text String: The message.
 *
 * @returns A promise that settles once the message is sent, with no value.
 *
 * @example
 * ```ts
 * senRetFun(fraRecObj, 'Xk3...', 'Hi') // => Promise<void>
 * ```
 *
*/

const senRetFun = async ( fraRecObj : FrmRecTyp, groIdeStr : string, mesTexStr : string ) : Promise< void > => { // What: Send Retry Function. Why: A send just after a join can meet the old mirror for a moment. How: This retries until it lands.


	for ( let tryIndNum = 1; ; tryIndNum++ ) { // What: Send Loop. Why: The mirror usually catches up within seconds. How: This tries until a send lands or the tries run out.


		try { return void await fraRecObj.chaModObj.chaSenFun( groIdeStr, mesTexStr ); } // What: Send Attempt. Why: The message is sent as the member. How: This sends it and ends the loop once it lands.

		catch ( errCatObj ) { if ( tryIndNum === SEN_TRY_NUM ) throw errCatObj; } // What: Refusal Handler. Why: A refusal is expected until the mirror catches up, but not forever. How: This rethrows only the last one.



		await new Promise( ( resValFun ) => setTimeout( resValFun, 500 ) ); // What: Retry Pause. Why: The mirror needs a moment. How: This waits half a second.


	}


};

// #endregion senRetFun



// #region frmUseFun

/**
 * frmUseFun = Frame Use Function
 *
 * @summary
 * Opens a member's frame, runs the steps given as that member, and removes
 * the frame whether they finish or fail, resolving with what the steps
 * resolve with. One frame at a time is open, since each runs a Firestore
 * client that holds connections to the emulator, and with several open at
 * once the browser's limit of 6 connections to a host left requests waiting
 * for a minute.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param proValStr - Profile Value String: The member's profile.
 * @param steValFun - Steps Value Function: The steps, given the member's
 *                    frame.
 *
 * @returns A promise that resolves with what the steps resolve with.
 *
 * @example
 * ```ts
 * frmUseFun('alex', steValFun) // => 'Xk3...'
 * ```
 *
*/

const frmUseFun = async < T >( proValStr : string, steValFun : ( fraRecObj : FrmRecTyp ) => Promise< T > ) : Promise< T > => { // What: Frame Use Function. Why: Each member acts in a frame of its own, one at a time. How: This opens the frame, runs the steps, and removes it.


	const fraRecObj = await frmOpeFun( proValStr ); // What: Frame Record Object. Why: The steps act through the member's frame. How: This opens it.



	try { return await steValFun( fraRecObj ); } // What: Steps Attempt. Why: The steps run as the member. How: This runs them and resolves with their result.

	finally { fraRecObj.eleFraObj.remove(); } // What: Frame Removal. Why: The frame's connections have to close before the next one opens. How: This removes it, done or failed.


};

// #endregion frmUseFun



// #region memAskFun

/**
 * memAskFun = Member Ask Function
 *
 * @summary
 * Starts a member afresh in a frame of its own, makes its identity, and files
 * its request to join through the invite, resolving with its UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param proValStr - Profile Value String: The member's profile.
 * @param tokValStr - Token Value String: The invite's token.
 * @param namValStr - Name Value String: The member's full name.
 * @param notValStr - Note Value String: The note to the group, or empty.
 *
 * @returns A promise that resolves with the member's UID.
 *
 * @example
 * ```ts
 * memAskFun('sam', 'q2...', 'Sam Ortiz', '') // => 'u9F...'
 * ```
 *
*/

const memAskFun = ( proValStr : string, tokValStr : string, namValStr : string, notValStr : string ) : Promise< string > => frmUseFun( proValStr, async ( fraRecObj ) => { // What: Member Ask Function. Why: Each joiner asks the same way. How: This resets the member, then files the request in its frame.


	await proResFun( fraRecObj ); // What: Reset Call. Why: A seed starts its members afresh. How: This forgets the member's old identity.


	const uidValStr = ( await fraRecObj.ideModObj.ideEnsFun() ).uidValStr; // What: UID Value String. Why: The owner approves the member by UID. How: This makes the identity and reads its UID.


	await fraRecObj.joiModObj.reqCreFun( tokValStr, namValStr, notValStr ); // What: Request Call. Why: The member asks to join. How: This files the request with the name and note.



	return uidValStr; // What: UID Return. Why: The owner approves by it, and claims name it. How: This returns it.


} );

// #endregion memAskFun



// #region seeRunFun

/**
 * seeRunFun = Seed Run Function
 *
 * @summary
 * Builds the demo group, reporting each stage through the callback, and
 * resolves once the chat has started. Each member acts in turn in a frame of
 * its own, and a failure rejects with the step's error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onStaFun - On Stage Function: Called with a short line naming each
 *                   stage as it starts.
 *
 * @returns A promise that settles once the group is built, with no value.
 *
 * @example
 * ```ts
 * seeRunFun(setSeeStaStr) // => Promise<void>
 * ```
 *
*/

const seeRunFun = async ( onStaFun : ( staTexStr : string ) => void ) : Promise< void > => { // What: Seed Run Function. Why: Trying the app as several people needs a group with several people in it. How: This runs each member's steps in turn.


	onStaFun( 'Starting the group as Alex…' ); // What: Group Stage Call. Why: The seed takes a while. How: This names the first stage.


	const { aleUidStr, groIdeStr, tokValStr } = await frmUseFun( 'alex', async ( fraRecObj ) => { // What: Alex UID String. Why: Alex brings the sandwiches. How: This reads Alex's new UID. // What: Group Identifier String. Why: Every later step acts in the group. How: This reads the new group's ID. // What: Token Value String. Why: The others join through the link. How: This reads its token.


		await proResFun( fraRecObj ); // What: Reset Call. Why: A seed starts its members afresh. How: This forgets Alex's old identity.


		const groNewStr = await fraRecObj.groModObj.groCreFun( 'Lake Weekend', 'Alex Kim' ); // What: Group New String. Why: The demo group belongs to Alex. How: This creates it as Alex.



		return { aleUidStr : ( await fraRecObj.ideModObj.ideEnsFun() ).uidValStr, groIdeStr : groNewStr, tokValStr : await tokWaiFun( fraRecObj, groNewStr ) }; // What: Group Return. Why: The later stages need the UID, the group, and the link. How: This reads Alex's UID and the group's token.


	} );


	onStaFun( 'Asking to join as Sam, Priya, and Jordan…' ); // What: Ask Stage Call. Why: Each request starts a member afresh. How: This names the stage.


	const samUidStr = await memAskFun( 'sam', tokValStr, 'Sam Ortiz', "Hey, it's Sam from the climbing gym." ); // What: Sam UID String. Why: Alex approves Sam, who brings the drinks. How: This files Sam's request with a note.
	const priUidStr = await memAskFun( 'priya', tokValStr, 'Priya Nair', '' );                                     // What: Priya UID String. Why: Alex approves Priya, who brings the speaker. How: This files Priya's request without a note.


	await memAskFun( JOR_PRO_STR, tokValStr, JOR_NAM_STR, "Alex's cousin, visiting this weekend." ); // What: Jordan Request Call. Why: A waiting request shows the People section's review. How: This files it and leaves it unanswered.

	onStaFun( 'Letting Sam and Priya in and planning the picnic…' ); // What: Plan Stage Call. Why: Alex's part takes a few writes. How: This names the stage.


	await frmUseFun( 'alex', async ( fraRecObj ) => { // What: Alex Plan Call. Why: Alex lets the others in and plans the picnic with its bring-list. How: This acts in Alex's frame.


		await fraRecObj.joiModObj.reqAppFun( groIdeStr, samUidStr ); // What: Sam Approval Call. Why: Alex lets Sam in. How: This approves Sam's request.
		await fraRecObj.joiModObj.reqAppFun( groIdeStr, priUidStr ); // What: Priya Approval Call. Why: Alex lets Priya in. How: This approves Priya's request.


		const picStaNum = Math.ceil( ( Date.now() + 2 * HOU_MIL_NUM ) / QUA_MIL_NUM ) * QUA_MIL_NUM; // What: Picnic Start Number. Why: An event starting within 3 hours opens the Map's sharing. How: This starts it on the quarter hour after 2 hours from now.


		const eveNewStr = await fraRecObj.eveModObj.eveCreFun( groIdeStr, { desTexStr : 'Bring something to sit on. We can swim if it gets warm.', endTimNum : picStaNum + 4 * HOU_MIL_NUM, locTexStr : 'Lakeside Park, north lawn', staTimNum : picStaNum, titTexStr : 'Picnic at the lake' } ); // What: Event New String. Why: The bring-list belongs to the picnic. How: This plans it as Alex.


		await fraRecObj.iteModObj.iteAddFun( groIdeStr, eveNewStr, 'Sandwiches', aleUidStr ); // What: Sandwiches Call. Why: A claimed item shows its bringer. How: This adds it as Alex's.
		await fraRecObj.iteModObj.iteAddFun( groIdeStr, eveNewStr, 'Drinks', samUidStr );     // What: Drinks Call. Why: Another member's claim shows in their color. How: This adds it as Sam's.
		await fraRecObj.iteModObj.iteAddFun( groIdeStr, eveNewStr, 'Speaker', priUidStr );    // What: Speaker Call. Why: Each member has a claim. How: This adds it as Priya's.
		await fraRecObj.iteModObj.iteAddFun( groIdeStr, eveNewStr, 'Blanket', null );         // What: Blanket Call. Why: Open items show the claim button. How: This adds it unclaimed.
		await fraRecObj.iteModObj.iteAddFun( groIdeStr, eveNewStr, 'Sunscreen', null );       // What: Sunscreen Call. Why: More than one item stays open. How: This adds it unclaimed.


	} );


	onStaFun( 'Starting the chat…' ); // What: Chat Stage Call. Why: The chat waits for the joins to settle. How: This names the stage.

	await new Promise( ( resValFun ) => setTimeout( resValFun, 3000 ) ); // What: Join Settle Pause. Why: Messages count from each member's join time, which a clock stepping back could put after a send. How: This waits 3 seconds past the approvals.

	await frmUseFun( 'alex', ( fraRecObj ) => senRetFun( fraRecObj, groIdeStr, "Picnic's on for today! It's in Events." ) ); // What: Alex Opening Call. Why: The chat opens with the plan. How: This sends it as Alex.

	await frmUseFun( 'sam', async ( fraRecObj ) => { // What: Sam Turn Call. Why: Sam replies and plans game night. How: This acts in Sam's frame.


		await senRetFun( fraRecObj, groIdeStr, "Count me in. I'll bring drinks." ); // What: Sam Reply Call. Why: Replies show other members' colors. How: This sends it as Sam.


		const gamDatObj = new Date(); // What: Game Date Object. Why: A second event shows the Events list with more than one. How: This starts from today.


		gamDatObj.setDate( gamDatObj.getDate() + ( ( 12 - gamDatObj.getDay() ) % 7 || 7 ) ); // What: Game Day Assignment. Why: Game night is on a Friday. How: This moves to the next Friday after today.
		gamDatObj.setHours( 19, 0, 0, 0 );                                                    // What: Game Hour Assignment. Why: Game night starts in the evening. How: This sets 7 PM.


		await fraRecObj.eveModObj.eveCreFun( groIdeStr, { desTexStr : '', endTimNum : gamDatObj.getTime() + 4 * HOU_MIL_NUM, locTexStr : "Sam's place", staTimNum : gamDatObj.getTime(), titTexStr : 'Game night' } ); // What: Game Night Call. Why: Any member plans an event, and a second one fills the list. How: This plans it as Sam.


	} );

	await frmUseFun( 'priya', ( fraRecObj ) => senRetFun( fraRecObj, groIdeStr, "I'll bring my speaker for some music." ) ); // What: Priya Reply Call. Why: Each member speaks once. How: This sends it as Priya.
	await frmUseFun( 'alex', ( fraRecObj ) => senRetFun( fraRecObj, groIdeStr, 'Could someone grab a blanket?' ) );           // What: Alex Ask Call. Why: An open item gets a nudge. How: This sends it as Alex.


};

// #endregion seeRunFun

// #endregion Helpers



// #region Exports

export { DEV_MEM_ARR, seeRunFun }; // What: Named Exports. Why: The switcher lists the members and runs the seed. How: This exports the list and the run.

// #endregion Exports


