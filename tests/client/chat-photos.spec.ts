


// #region Imports

import { DBS_URL_STR               } from '../support/database.ts';       // What: Database URL String. Why: The Realtime Database is read in the instance the app and functions share. How: This names it.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: A tally is seeded by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote in Firestore. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when chat photos behaved as they should. How: This asserts on what the pages and the emulators return.
import { get                       } from 'firebase/database';            // What: Get. Why: The tests read the chat on the server. How: This reads a location once.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulators.
import { joiWaiFun                 } from '../support/client.ts';         // What: Join Wait Function. Why: Messages sent after a join must come after it, though the clock can step back. How: This waits out a step.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: The tests start from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: A photo is sent from one device and fetched on another. How: This declares tests with a second page.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Chat locations are named by path. How: This builds a reference.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { senPolFun                 } from '../support/client.ts';         // What: Send Poll Function. Why: A send just after a join waits for the mirror. How: This retries a message until it lands.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: A tally is seeded at its limit. How: This writes it.
import { stoLisFun                 } from '../support/storage.ts';        // What: Storage List Function. Why: The tests check which photo files are left. How: This lists a folder past the rules.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A seeded tally carries its backstop. How: This builds the time.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * chat-photos.spec.ts = Chat Photos Spec
 *
 * @summary
 * Checks the photos sent in a group's chat (ARCHITECTURE.md Section 22) in a
 * real browser, in each engine, against the Emulator Suite with the real
 * security rules and Cloud Functions. Each test runs the app's own modules:
 * a photo message's text, sending a photo with its caption, the member's
 * device fetching it before its message leaves the server, the server
 * deleting the photo with its message, a day's limit refusing a photo with
 * the time the limits reset, and how long a device keeps its photos.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const CHA_MOD_STR = '/src/state/chat.ts';                // What: Chat Module String. Why: Photos are sent and chat synced there. How: This names its path.
const CHP_MOD_STR = '/src/state/chat-photos.ts';         // What: Chat-Photos Module String. Why: Photos are read from the device there. How: This names its path.
const CPS_MOD_STR = '/src/platform/chat-photo-store.ts'; // What: Chat-Photo-Store Module String. Why: Kept photos are seeded and totaled there. How: This names its path.
const DAY_MIL_NUM = 86400000;                            // What: Day Milliseconds Number. Why: The limits are counted in days. How: This is one day in milliseconds.
const DAY_OFF_NUM = 28800000;                            // What: Day Offset Number. Why: A day of the limits runs from 08:00 UTC. How: This is the 8 hours taken off before days are counted.
const KEP_MOD_STR = '/src/state/photo-keep.ts';          // What: Keep Module String. Why: How long the device keeps photos is chosen there. How: This names its path.
const STA_MOD_STR = '/src/core/chat-status.ts';          // What: Status Module String. Why: A photo message's text is built and read there. How: This names its path.

// #endregion Constants



// #region Module State

let chpEnvObj : RulesTestEnvironment; // What: Chat-Photos Environment Object. Why: Every read and seed reaches the emulators through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const dbsReaFun = async ( patValStr : string ) : Promise< unknown > => { // What: Database Read Function. Why: Tests check what's left on the server. How: This reads a location with the rules off.


	let datValAny : unknown = null; // What: Data Value Any. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await chpEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { datValAny = ( await get( ref( cotAdmObj.database( DBS_URL_STR ), patValStr ) ) ).val(); } ); // What: Database Read Call. Why: Chat isn't readable outside its query. How: This reads with the rules off.



	return datValAny; // What: Data Return. Why: The test compares it, null when it's absent. How: This returns it.


};



const dayKeyFun = () : number => Math.floor( ( Date.now() - DAY_OFF_NUM ) / DAY_MIL_NUM ); // What: Day Key Function. Why: The tallies are named by the day, as the rules count it. How: This counts whole days since 1970 from 8 hours before now.



const getLenFun = ( pagValObj : Page, groIdeStr : string, phoIdeStr : string ) : Promise< number | null > => pagValObj.evaluate( async ( [ modPatStr, groIdeStr, phoIdeStr ] ) => { // What: Get Length Function. Why: A test checks a device holds a photo, and a page can't hand back its bytes whole. How: This reads the photo in the page and returns its size, or null when the device doesn't keep it.


	const bytValArr = await ( await import( /* @vite-ignore */ modPatStr ) ).chpGetFun( groIdeStr, phoIdeStr ) as Uint8Array | null; // What: Bytes Value Array. Why: The photo is read as the chat shows it. How: This decrypts the kept copy. // What: Type Assertion Note. Why: A dynamic import is untyped, and chpGetFun resolves with bytes or null. How: The as reads them so.



	return bytValArr === null ? null : bytValArr.byteLength; // What: Length Return. Why: The test compares sizes. How: This returns the photo's, or null.


}, [ CHP_MOD_STR, groIdeStr, phoIdeStr ] as const ); // What: Get Arguments. Why: The page can't read the test's variables. How: This passes the module's path and the photo's group and ID. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.



const imgSenFun = ( pagValObj : Page, groIdeStr : string, capTexStr : string ) : Promise< { errStr : string } | { mesIdeStr : string, texValStr : string } > => pagValObj.evaluate( async ( [ modPatStr, groIdeStr, capTexStr ] ) => { // What: Image Send Function. Why: A photo is sent from the page the way the composer sends one, and a refusal's message is read. How: This draws a small photo in the page, uploads it and sends its message with the caption, and returns the message, or the error's kind and message.


	const canEleObj = document.createElement( 'canvas' ); // What: Canvas Element Object. Why: The photo is drawn in the page. How: This makes a canvas.


	canEleObj.width  = 40; // What: Width Assignment. Why: A small photo keeps the test quick. How: This sets it 40px wide.
	canEleObj.height = 30; // What: Height Assignment. Why: A small photo keeps the test quick. How: This sets it 30px tall.


	const cotDraObj = canEleObj.getContext( '2d' )!; // What: Context Draw Object. Why: The photo needs something in it. How: This takes the canvas's 2D context. // What: Non-Null Note. Why: A fresh canvas always gives a 2D context. How: The ! reads it as present.


	cotDraObj.fillStyle = 'rgb(74, 79, 201)'; // What: Fill Style Assignment. Why: The fill paints the photo. How: This sets periwinkle.


	cotDraObj.fillRect( 0, 0, 40, 30 ); // What: Fill Call. Why: The photo needs something in it. How: This paints it.


	const filValObj = await new Promise< Blob >( ( resValFun ) => canEleObj.toBlob( ( blbValObj ) => resValFun( blbValObj! ), 'image/jpeg', 0.9 ) ); // What: File Value Object. Why: A picked photo reaches the chat as a file. How: This encodes the canvas as a JPEG. // What: Non-Null Note. Why: The canvas always holds an image to encode. How: The ! reads the blob as present.



	const modValObj = await import( /* @vite-ignore */ modPatStr ); // What: Module Value Object. Why: The photo is sent as the composer sends it. How: This imports the chat.



	try { return await modValObj.chaImgFun( groIdeStr, await modValObj.chaUplFun( groIdeStr, filValObj, capTexStr ), capTexStr ) as { mesIdeStr : string, texValStr : string }; } // What: Send Attempt. Why: The photo is uploaded, then its message sent. How: This runs both and returns the message's ID and text. // What: Type Assertion Note. Why: A dynamic import is untyped, and chaImgFun resolves with the message's ID and text. How: The as reads them so.

	catch ( errCatObj ) { return { errStr : `${ ( errCatObj as Error ).name }:${ ( errCatObj as Error ).message }` }; } // What: Send Catch. Why: A refused photo is checked by its kind and message. How: This returns both. // What: Type Assertion Note. Why: The send rejects with Error objects. How: The as reads their name and message.


}, [ CHA_MOD_STR, groIdeStr, capTexStr ] as const ); // What: Send Arguments. Why: The page can't read the test's variables. How: This passes the module's path, the group, and the caption. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore, the Realtime Database, and Storage under the demo project.


	chpEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulators through it. How: This connects to the databases and the storage.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: Chat is read from there. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Photos' documents and tallies are read and seeded there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang',                    // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.
		storage   : { host : '127.0.0.1', port : 8220 }  // What: Storage Options. Why: Photos' files are listed there. How: This names the address firebase.json gives its emulator.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await chpEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( "a photo message's text reads back with its photo and caption, and a broken one doesn't", async ( { page } ) => { // What: Text Test. Why: A photo message is a status-format text an older version shows as an update, and only a well-formed one shows as a photo (Section 22). How: This builds one, reads it back, and reads back texts that break each part.


	const imgTexStr = await runPagFun( page, STA_MOD_STR, 'imgTexFun', 'Ab3Ab3Ab3Ab3Ab3Ab3Ab', 'AAAAAAAAAAAAAAAA', 'Look!' ) as string; // What: Image Text String. Why: A photo message names its photo, its IV, and its caption. How: This builds one. // What: Type Assertion Note. Why: imgTexFun returns the text. How: The as reads it as a string.


	expect( imgTexStr.startsWith( '\u0001img' ) ).toBe( true );                                                                                          // What: Prefix Assertion. Why: A photo message is a status post's text, which a typed message can't be. How: This expects the prefix and kind.
	expect( await runPagFun( page, STA_MOD_STR, 'imgDetFun', imgTexStr ) ).toEqual( { capTexStr : 'Look!', iniVecStr : 'AAAAAAAAAAAAAAAA', phoIdeStr : 'Ab3Ab3Ab3Ab3Ab3Ab3Ab' } ); // What: Details Assertion. Why: The chat shows the photo and caption. How: This expects each part back.
	expect( await runPagFun( page, STA_MOD_STR, 'staKinFun', imgTexStr ) ).toBe( 'img' );                                                                 // What: Kind Assertion. Why: The chat tells a photo message from a status line. How: This expects its kind.
	expect( await runPagFun( page, STA_MOD_STR, 'imgDetFun', imgTexStr.replace( 'Ab3Ab3Ab3Ab3Ab3Ab3Ab', 'short' ) ) ).toBeNull();                          // What: Short ID Refused. Why: A photo's ID has 20 letters and digits. How: This expects a short one read as no photo.
	expect( await runPagFun( page, STA_MOD_STR, 'imgDetFun', imgTexStr.replace( 'AAAAAAAAAAAAAAAA', 'AAAA' ) ) ).toBeNull();                              // What: Short IV Refused. Why: A photo's IV is 12 bytes. How: This expects a short one read as no photo.
	expect( await runPagFun( page, STA_MOD_STR, 'imgDetFun', imgTexStr.replace( 'Look!', 'hid​den' ) ) ).toBeNull();                                 // What: Hidden Caption Refused. Why: A caption follows a message's limits. How: This expects one hiding a character read as no photo.
	expect( await runPagFun( page, STA_MOD_STR, 'staKinFun', imgTexStr.replace( 'AAAAAAAAAAAAAAAA', 'AAAA' ) ) ).toBe( 'unk' );                           // What: Broken Kind Assertion. Why: A broken photo message still shouldn't vanish. How: This expects it read as an update this version can't show.


} );



pagTesObj( "a photo reaches the member's device before its message leaves the server, and goes from the server with it", async ( { page, secPagObj } ) => { // What: Delivery Test. Why: Every member's device keeps a photo before the server can delete it, and the server keeps it only as long as its message (Section 22). How: This sends a photo as the owner, checks its document, tallies, and file, syncs as the member, and waits for the server to clear them.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( chpEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	await joiWaiFun( chpEnvObj, groIdeStr, uidMemStr ); // What: Join Wait Call. Why: The test machine's clock can step back, so messages sent next must come after the join. How: This waits out a step.

	await senPolFun( page, groIdeStr, 'Hi' ); // What: Mirror Poll Call. Why: A photo is counted before its message is sent, so the mirror should be ready first. How: This sends a message until it lands.


	const imgSenObj = await imgSenFun( page, groIdeStr, '  Look!  ' ) as { mesIdeStr : string, texValStr : string }; // What: Image Sent Object. Why: The owner sends a photo with an untidy caption. How: This sends it. // What: Type Assertion Note. Why: The send succeeds here. How: The as reads its message.

	const imgDetObj = await runPagFun( page, STA_MOD_STR, 'imgDetFun', imgSenObj.texValStr ) as { capTexStr : string, phoIdeStr : string }; // What: Image Details Object. Why: The checks follow the photo by its ID. How: This reads the sent message's details. // What: Type Assertion Note. Why: A sent photo message reads well. How: The as reads its details.

	const dayKeyNum = dayKeyFun(); // What: Day Key Number. Why: The tallies are named by the day. How: This reads today's.


	expect( imgDetObj.capTexStr ).toBe( 'Look!' );                                                                                                                   // What: Caption Tidied. Why: A caption is sent tidied, as a message is. How: This expects the spaces gone.
	expect( await dbsReaFun( `chats/${ groIdeStr }/messages/${ imgSenObj.mesIdeStr }/photoId` ) ).toBe( imgDetObj.phoIdeStr );                                     // What: Photo ID Sent. Why: The server deletes the photo with the message that names it. How: This expects the message to name it in the clear.
	expect( await docReaFun( chpEnvObj, `groups/${ groIdeStr }/chatPhotos/${ imgDetObj.phoIdeStr }` ) ).toMatchObject( { uploaderUid : uidOwnStr } );          // What: Photo Document. Why: The photo is recorded under its sender. How: This expects its document.
	expect( await docReaFun( chpEnvObj, `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-all` ) ).toMatchObject( { count : 1 } );                         // What: Group Tally. Why: The photo counts against the group's day. How: This expects one.
	expect( await docReaFun( chpEnvObj, `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-${ uidOwnStr }` ) ).toMatchObject( { count : 1 } );              // What: Member Tally. Why: The photo counts against the sender's day. How: This expects one.
	expect( await stoLisFun( chpEnvObj, `chatPhotos/${ groIdeStr }` ) ).toEqual( [ imgDetObj.phoIdeStr ] );                                                        // What: Photo File. Why: The photo's file waits on the server for the member. How: This expects it.


	const ownLenNum = await getLenFun( page, groIdeStr, imgDetObj.phoIdeStr ); // What: Owner Length Number. Why: The sender keeps their own photo. How: This reads its size on their device.


	expect( ownLenNum ).toBeGreaterThan( 0 );                                                                             // What: Owner Kept. Why: The sender's device shows their photo without a download. How: This expects it there.
	expect( await getLenFun( secPagObj, groIdeStr, imgDetObj.phoIdeStr ) ).toBeNull();                                    // What: Member Not Yet. Why: The member's device hasn't fetched it. How: This expects nothing there.
	expect( await runPagFun( secPagObj, CHA_MOD_STR, 'chaSynFun', groIdeStr ) ).toBe( 2 );                                // What: Sync Call. Why: The member catches up. How: This expects the message and the photo message kept.
	expect( await getLenFun( secPagObj, groIdeStr, imgDetObj.phoIdeStr ) ).toBe( ownLenNum );                              // What: Member Kept. Why: The member's device fetched the photo before acknowledging it. How: This expects the same photo there.
	expect( await dbsReaFun( `chats/${ groIdeStr }/messages/${ imgSenObj.mesIdeStr }` ) ).toBeNull();                         // What: Message Deleted. Why: Nobody is waiting any more. How: This expects it gone from the server.

	await expect.poll( () => docReaFun( chpEnvObj, `groups/${ groIdeStr }/chatPhotos/${ imgDetObj.phoIdeStr }` ), { timeout : 20000 } ).toBeUndefined(); // What: Document Gone. Why: The photo goes with its message. How: This waits for the trigger to delete its document.
	await expect.poll( () => stoLisFun( chpEnvObj, `chatPhotos/${ groIdeStr }` ), { timeout : 20000 } ).toEqual( [] );                                 // What: File Gone. Why: The photo's file goes with its document. How: This waits for the trigger to delete it.


} );



pagTesObj( "a photo past a day's limit is refused with the time the limits reset, and a caption past a message's limits before anything is counted", async ( { page, secPagObj } ) => { // What: Limits Test. Why: A free group's member sends at most 10 photos a day, and a member at a limit learns when they can send more (Section 22). How: This seeds the owner's tally at its limit, sends a photo, then a photo with a long caption, checking each refusal and that nothing was counted.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( chpEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const dayKeyNum = dayKeyFun(); // What: Day Key Number. Why: The tallies are named by the day. How: This reads today's.


	await joiWaiFun( chpEnvObj, groIdeStr, uidMemStr ); // What: Join Wait Call. Why: The test machine's clock can step back. How: This waits out a step.

	await chpEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-${ uidOwnStr }` ), { count : 10, expireAt : Timestamp.fromMillis( Date.now() + 2 * DAY_MIL_NUM ), lastPhotoId : 'Ab3Ab3Ab3Ab3Ab3Ab3Ab' } ) ); // What: Tally Seed Call. Why: The owner has sent a free group's 10 photos today. How: This writes their tally at the limit, past the rules.


	const limSenObj = await imgSenFun( page, groIdeStr, '' ); // What: Limit Sent Object. Why: An eleventh photo is refused. How: This tries to send it.

	const capSenObj = await imgSenFun( page, groIdeStr, 'a'.repeat( 2001 ) ); // What: Caption Sent Object. Why: A caption past a message's limits is refused. How: This tries to send it.


	expect( limSenObj ).toEqual( { errStr : `RangeError:${ ( dayKeyNum + 1 ) * DAY_MIL_NUM + DAY_OFF_NUM }` } );                                       // What: Limit Refused. Why: The member learns when the limits reset. How: This expects a RangeError carrying the next 08:00 UTC.
	expect( capSenObj ).toEqual( { errStr : 'RangeError:The message is outside its limits.' } );                                                         // What: Caption Refused. Why: A caption follows a message's limits. How: This expects a RangeError naming them.
	expect( await docReaFun( chpEnvObj, `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-all` ) ).toBeUndefined();                                      // What: Group Untouched. Why: A refused photo counts nothing. How: This expects no group tally today.
	expect( await docReaFun( chpEnvObj, `groups/${ groIdeStr }/chatPhotoTally/${ dayKeyNum }-${ uidOwnStr }` ) ).toMatchObject( { count : 10 } ); // What: Member Untouched. Why: A refused photo counts nothing. How: This expects the seeded count.
	expect( await stoLisFun( chpEnvObj, `chatPhotos/${ groIdeStr }` ) ).toEqual( [] );                                                                 // What: No File. Why: A refused photo uploads nothing. How: This expects the folder empty.


} );



pagTesObj( 'a device keeps chat photos 3 months by default, and clears older ones as the span changes', async ( { page } ) => { // What: Keep Test. Why: Most chat photos are shared in passing, so a device keeps them 3 months unless its member chooses longer or always (Section 22). How: This keeps photos of different ages and one this version didn't write, changes the span, and checks which are cleared.


	await page.evaluate( async ( [ modPatStr, dayMilNum ] ) => { // What: Seed Call. Why: Photos of three ages test each span, and kept bytes can't be passed into the page. How: This keeps one at 200 days, one at 100, and one at 1, each with 10 bytes.


		const modValObj = await import( /* @vite-ignore */ modPatStr ); // What: Module Value Object. Why: The photos are kept as the app keeps them. How: This imports the store.



		for ( const [ keyValStr, ageDayNum ] of [ [ 'gro/old', 200 ], [ 'gro/mid', 100 ], [ 'gro/new', 1 ] ] as const ) await modValObj.cpsSetFun( keyValStr, { cipBytArr : new Uint8Array( 10 ), iniVecArr : new Uint8Array( 12 ), sntTimNum : Date.now() - ageDayNum * dayMilNum } ); // What: Seed Loop. Why: Each age is kept in turn. How: This writes each record. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each pair's own types.


	}, [ CPS_MOD_STR, DAY_MIL_NUM ] as const ); // What: Seed Arguments. Why: The page can't read the test's variables. How: This passes the module's path and a day's length. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.



	await runPagFun( page, CPS_MOD_STR, 'cpsSetFun', 'gro/bad', { cipBytArr : [], iniVecArr : [], sntTimNum : 0 } ); // What: Unreadable Seed Call. Why: A record this version didn't write can't show, so it neither counts nor stays. How: This keeps one with plain arrays for bytes.


	expect( await runPagFun( page, KEP_MOD_STR, 'kepGetFun' ) ).toBe( 'm03' );                          // What: Default Assertion. Why: A device keeps photos 3 months unless its member chose otherwise. How: This expects the default.
	expect( await runPagFun( page, CPS_MOD_STR, 'cpsSizFun' ) ).toEqual( { bytNum : 30, couNum : 3 } ); // What: Total Assertion. Why: Settings shows how much room the photos take. How: This expects the three photos and their bytes, without the unreadable one.
	expect( await runPagFun( page, KEP_MOD_STR, 'kepSetFun', 'all' ) ).toBe( 0 );                       // What: Always Assertion. Why: Photos kept always are never cleared by age. How: This expects none cleared.
	expect( await runPagFun( page, KEP_MOD_STR, 'kepGetFun' ) ).toBe( 'all' );                          // What: Kept Choice Assertion. Why: The choice survives. How: This expects it read back.
	expect( await runPagFun( page, KEP_MOD_STR, 'kepSetFun', 'm06' ) ).toBe( 2 );                       // What: Six Months Assertion. Why: A shorter span clears what it no longer keeps. How: This expects the 200-day photo and the unreadable one cleared.
	expect( await runPagFun( page, KEP_MOD_STR, 'kepSetFun', 'm03' ) ).toBe( 1 );                       // What: Three Months Assertion. Why: The default span clears older photos. How: This expects the 100-day photo cleared.
	expect( await runPagFun( page, KEP_MOD_STR, 'kepPruFun' ) ).toBe( 0 );                              // What: Open Prune Assertion. Why: The prune as the app opens clears nothing already cleared. How: This expects none.
	expect( await runPagFun( page, CPS_MOD_STR, 'cpsSizFun' ) ).toEqual( { bytNum : 10, couNum : 1 } ); // What: Left Assertion. Why: Only the recent photo stays. How: This expects it alone.
	expect( await getLenFun( page, 'gro', 'old' ) ).toBeNull();                                         // What: Cleared Photo Assertion. Why: A cleared photo shows as gone. How: This expects nothing kept.

	await page.evaluate( () => localStorage.setItem( 'come-hang-chat-photo-keep', 'forever' ) ); // What: Unknown Choice Call. Why: A kept value that isn't a span mustn't be followed. How: This stores one.

	expect( await runPagFun( page, KEP_MOD_STR, 'kepGetFun' ) ).toBe( 'm03' ); // What: Unknown Choice Assertion. Why: An unknown span falls back to the default. How: This expects 3 months.


} );


