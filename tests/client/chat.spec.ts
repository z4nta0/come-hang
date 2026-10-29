


// #region Imports

import { DBS_URL_STR               } from '../support/database.ts';       // What: Database URL String. Why: The Realtime Database is read in the instance the app and functions share. How: This names it.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: A membership is backdated by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote in Firestore. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when chat behaved as it should. How: This asserts on what the pages and the emulators return.
import { get                       } from 'firebase/database';            // What: Get. Why: The tests read the chat on the server. How: This reads a location once.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulators.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Most tests start from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Chat locations are named by path. How: This builds a reference.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { set                       } from 'firebase/database';            // What: Set. Why: An old message is seeded. How: This writes it.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A membership is backdated. How: This builds the time.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: A membership is backdated past the rules. How: This changes it.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The send helper runs in either identity's page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * chat.spec.ts = Chat Spec
 *
 * @summary
 * Checks a group's chat in a real browser, in each engine, against the
 * Emulator Suite with the real security rules and the membership mirror's
 * Cloud Functions. Each test runs the app's own modules in two identities'
 * pages: sending, syncing, and watching, the device's history, the
 * waiting-on list, and the server's cleanup once a message has reached
 * everyone, is waiting only on someone who left, or is past the group's
 * retention. Sends retry until the mirror function has caught up with the
 * membership, as the app would meet it just after a join.
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

const CHA_MOD_STR = '/src/state/chat.ts';          // What: Chat Module String. Why: Chat is sent and read there. How: This names its path.
const DAY_MIL_NUM = 86400000;                      // What: Day Milliseconds Number. Why: Backdated times are set in days. How: This is one day in milliseconds.
const HIS_MOD_STR = '/src/platform/chat-store.ts'; // What: History Module String. Why: The device's history is read there. How: This names its path.

// #endregion Constants



// #region Module State

let chaEnvObj : RulesTestEnvironment; // What: Chat Environment Object. Why: Every read and seed reaches the emulators through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const dbsReaFun = async ( patValStr : string ) : Promise< unknown > => { // What: Database Read Function. Why: Tests check what's left on the server. How: This reads a location with the rules off.


	let datValAny : unknown = null; // What: Data Value Any. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await chaEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { datValAny = ( await get( ref( cotAdmObj.database( DBS_URL_STR ), patValStr ) ) ).val(); } ); // What: Database Read Call. Why: Chat isn't readable outside its query. How: This reads with the rules off.



	return datValAny; // What: Data Return. Why: The test compares it, null when it's absent. How: This returns it.


};



// #region senPolFun

/**
 * senPolFun = Send Poll Function
 *
 * @summary
 * Sends a message from a page, retrying while the rules refuse it because
 * the mirror function hasn't yet caught up with the sender's membership,
 * and resolves with the message's ID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The sender's page.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param mesTexStr - Message Text String: The message, as typed.
 *
 * @returns A promise that resolves with the message's ID.
 *
 * @example
 * ```ts
 * senPolFun(page, 'Xk3...', 'Hi') // => '-Nx...'
 * ```
 *
*/

const senPolFun = async ( pagValObj : Page, groIdeStr : string, mesTexStr : string ) : Promise< string > => { // What: Send Poll Function. Why: A send just after a membership change can meet the old mirror for a moment. How: This retries the send until it lands.


	let mesIdeStr = ''; // What: Message Identifier String. Why: The poll keeps the ID of the send that landed. How: This starts empty.


	await expect.poll( async () => { mesIdeStr = await runPagFun( pagValObj, CHA_MOD_STR, 'chaSenFun', groIdeStr, mesTexStr ) as string; return mesIdeStr; } ).not.toMatch( /^error:/ ); // What: Send Poll Call. Why: The send succeeds once the mirror has the sender. How: This retries until no error comes back. // What: Type Assertion Note. Why: chaSenFun resolves with the ID, or runPagFun with an error string. How: The as reads either as a string.



	return mesIdeStr; // What: Message Return. Why: The test finds the message by ID. How: This returns it.


};

// #endregion senPolFun

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore and the Realtime Database under the demo project.


	chaEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulators through it. How: This connects to both databases.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: Chat is read from there. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Memberships are read and backdated there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await chaEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a message reaches the other member, is kept on both devices, and leaves the server once nobody waits', async ( { page, secPagObj } ) => { // What: Delivery Test. Why: The server keeps a message only until everyone has it, while each device keeps its history (Section 5). How: This sends as the owner, checks the waiting-on list, syncs as the member, and checks both histories and the server.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( chaEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const mesIdeStr = await senPolFun( page, groIdeStr, '  Hi @Dana,  50% off "pies" *today* 🎉 ' ); // What: Message Identifier String. Why: The owner sends with punctuation chat needs. How: This sends once the mirror is ready.

	const mesPatStr = `chats/${ groIdeStr }/messages/${ mesIdeStr }`; // What: Message Path String. Why: The message is checked on the server. How: This names it.


	expect( await dbsReaFun( mesPatStr ) ).toMatchObject( { senderUid : uidOwnStr, waitingOn : { [ uidMemStr ] : true } } );                                                                 // What: Message Sent. Why: The message waits on every other member. How: This expects the member on its list.
	expect( await runPagFun( secPagObj, CHA_MOD_STR, 'chaSynFun', groIdeStr ) ).toBe( 1 );                                                                                                   // What: Sync Call. Why: The member catches up. How: This expects one message kept.
	expect( await dbsReaFun( mesPatStr ) ).toBeNull(); // What: Message Deleted. Why: Nobody is waiting any more. How: This expects it gone from the server.
	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'mesLisFun', groIdeStr ) ).toMatchObject( [ { mesIdeStr, senUidStr : uidOwnStr, texValStr : 'Hi @Dana, 50% off "pies" *today* 🎉' } ] ); // What: Member History. Why: The member's device keeps the tidied message. How: This expects it with its sender.
	expect( await runPagFun( page, HIS_MOD_STR, 'mesLisFun', groIdeStr ) ).toMatchObject( [ { mesIdeStr, texValStr : 'Hi @Dana, 50% off "pies" *today* 🎉' } ] );                             // What: Owner History. Why: The sender keeps their own message. How: This expects it.


} );



pagTesObj( 'a message is visible text, tidied, and refused when empty, too long, or hiding characters', async ( { page, secPagObj } ) => { // What: Limits Test. Why: Chat allows any visible text and refuses invisible and direction-reversing characters (Section 11.10). How: This sends text the app refuses, then text it keeps, reads back the tidied result, and checks the history's order.


	const { groIdeStr } = await memSetFun( chaEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group. How: This sets one up.


	await senPolFun( page, groIdeStr, '  a  \n\n\n\n  b ' ); // What: Tidy Send Call. Why: A message is tidied line by line. How: This sends untidy text once the mirror is ready.

	expect( await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, '   ' ) ).toBe( 'error:RangeError' );                                                                                             // What: Empty Refused. Why: A message has at least 1 character. How: This expects a RangeError for spaces alone.
	expect( await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, 'a'.repeat( 2001 ) ) ).toBe( 'error:RangeError' );                                                                                // What: Long Refused. Why: A message has at most 2,000 characters. How: This expects a RangeError.
	expect( await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, 'pay ‮live' ) ).toBe( 'error:RangeError' );                                                                                       // What: Override Refused. Why: A direction override can disguise text. How: This expects a RangeError.
	expect( await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, 'hid​den' ) ).toBe( 'error:RangeError' );                                                                                         // What: Zero Width Refused. Why: An invisible character can hide text. How: This expects a RangeError.
	expect( await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, '👨‍👩‍👧 🏴󠁧󠁢󠁥󠁮󠁧󠁿 می‌خواهم' ) ).not.toMatch( /^error:/ );                                                                            // What: Joiners Kept. Why: Emoji and some scripts need the joiners. How: This expects a family emoji, a flag built from tag characters, and Persian text to send.
	expect( ( await runPagFun( page, HIS_MOD_STR, 'mesLisFun', groIdeStr ) as { texValStr : string }[] ).map( ( mesRecObj ) => mesRecObj.texValStr ) ).toEqual( [ 'a\n\nb', '👨‍👩‍👧 🏴󠁧󠁢󠁥󠁮󠁧󠁿 می‌خواهم' ] ); // What: History Kept. Why: Only the accepted messages were sent, tidied. How: This expects the two in order. // What: Type Assertion Note. Why: mesLisFun resolves with message records. How: The as reads their text.



	for ( const [ mesIdeStr, sntTimNum ] of [ [ 'b', 1 ], [ 'a', 3 ], [ 'd', 2 ], [ 'c', 2 ] ] as const ) await runPagFun( page, HIS_MOD_STR, 'mesPutFun', { groIdeStr : 'order', mesIdeStr, senUidStr : 'x', sntTimNum, texValStr : mesIdeStr } ); // What: Order Seed Loop. Why: The history sorts by time, then ID, whatever order the keys fall in. How: This stores four records under a group of their own, out of order, two sharing a time.



	expect( ( await runPagFun( page, HIS_MOD_STR, 'mesLisFun', 'order' ) as { mesIdeStr : string }[] ).map( ( mesRecObj ) => mesRecObj.mesIdeStr ) ).toEqual( [ 'b', 'c', 'd', 'a' ] ); // What: History Order. Why: The oldest reads first, and a tie goes by ID. How: This expects the records by time, then ID. // What: Type Assertion Note. Why: mesLisFun resolves with message records. How: The as reads their IDs.


} );



pagTesObj( 'a member reads only from when they joined, and a message waiting on someone who left is cleaned up', async ( { page, secPagObj } ) => { // What: Join And Leave Test. Why: Nobody reads chat from before they joined, and someone who left can't hold up cleanup (Sections 5 and 11.7). How: This sends before a member joins, syncs as them, sends again, has them leave, and syncs as the owner.


	const groIdeStr = await runPagFun( page, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The owner chats alone first. How: This creates the group. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.

	const befIdeStr = await senPolFun( page, groIdeStr, 'Before you joined' ); // What: Before Identifier String. Why: A message from before the member joined. How: This sends it.

	const tokValStr = ( await docReaFun( chaEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                     // What: Token Value String. Why: The member joins through the link. How: This reads the token the group names. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
	const uidMemStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Member String. Why: The owner approves the member by UID. How: This makes sure the member's identity exists and reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await runPagFun( secPagObj, '/src/state/joins.ts', 'reqCreFun', tokValStr, 'Dana Lee', '' ); // What: Request Call. Why: The member asks to join. How: This files the request.

	await runPagFun( page, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidMemStr ); // What: Approval Call. Why: The owner lets the member in. How: This approves the request.

	await expect.poll( () => runPagFun( secPagObj, CHA_MOD_STR, 'chaSynFun', groIdeStr ) ).toBe( 0 ); // What: Member Sync Poll. Why: The member can read once the mirror has their join time, and sees nothing from before it. How: This retries until a sync keeps no messages.



	const aftIdeStr = await senPolFun( page, groIdeStr, 'After you joined' ); // What: After Identifier String. Why: A message waiting on the member. How: This sends it.


	expect( await dbsReaFun( `chats/${ groIdeStr }/messages/${ aftIdeStr }/waitingOn` ) ).toEqual( { [ uidMemStr ] : true } ); // What: Member Waited On. Why: The message waits on the member. How: This expects their entry.
	expect( await runPagFun( secPagObj, '/src/state/members.ts', 'groLeaFun', groIdeStr ) ).toBeUndefined();                   // What: Leave Call. Why: The member leaves without reading it. How: This expects the leave to succeed.

	await expect.poll( async () => { await runPagFun( page, CHA_MOD_STR, 'chaSynFun', groIdeStr ); return dbsReaFun( `chats/${ groIdeStr }/messages` ); } ).toBeNull(); // What: Cleanup Poll. Why: The early message waits on nobody, and the later one only on someone who left, so both go once the mirror drops the member. How: This syncs as the owner until no messages are left.



	expect( await runPagFun( page, HIS_MOD_STR, 'mesLisFun', groIdeStr ) ).toMatchObject( [ { mesIdeStr : befIdeStr }, { mesIdeStr : aftIdeStr } ] ); // What: Owner History. Why: The owner keeps both. How: This expects both messages in order.


} );



pagTesObj( 'a message past the retention is deleted though someone still waits, and a watched chat hears new messages', async ( { page, secPagObj } ) => { // What: Retention And Watch Test. Why: The retention is a backstop for a device that never comes back, and an open chat shows messages as they arrive (Section 5). How: This backdates the member's join, seeds an old message waiting on the owner, syncs as the member, then watches as the member while the owner sends.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( chaEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const joiTimNum = Date.now() - 40 * DAY_MIL_NUM; // What: Join Time Number. Why: The member has to have joined before the old message. How: This is 40 days ago.



	await chaEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/members/${ uidMemStr }` ), { joinedAt : Timestamp.fromMillis( joiTimNum ) } ); } ); // What: Backdate Call. Why: The mirror follows the membership's join time. How: This sets it 40 days back with the rules off.


	await expect.poll( () => dbsReaFun( `mirrors/${ groIdeStr }/members/${ uidMemStr }` ) ).toBe( joiTimNum ); // What: Mirror Poll. Why: The member reads from the mirrored join time. How: This waits for the mirror function to copy it.



	await chaEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Old Seed Call. Why: A message past the 30-day retention, still waiting on a current member. How: This writes it with the rules off.


		await set( ref( cotAdmObj.database( DBS_URL_STR ), `chats/${ groIdeStr }/messages/old` ), { // What: Message Set Call. Why: The seeded message. How: This writes every field a message has.


			ciphertext : 'A'.repeat( 24 ),
			iv         : 'A'.repeat( 16 ),
			senderUid  : uidOwnStr,
			sentAt     : Date.now() - 35 * DAY_MIL_NUM,
			waitingOn  : { [ uidOwnStr ] : true }


		} );


	} );


	expect( await runPagFun( secPagObj, CHA_MOD_STR, 'chaSynFun', groIdeStr ) ).toBe( 0 ); // What: Old Sync Call. Why: The seeded message doesn't decrypt, so it isn't kept. How: This expects nothing kept.
	expect( await dbsReaFun( `chats/${ groIdeStr }/messages/old` ) ).toBeNull();           // What: Old Message Deleted. Why: Past the retention, it goes though the owner still waits. How: This expects it gone.



	await secPagObj.evaluate( async ( groIdeStr ) => { // What: Watch Call. Why: An open chat hears new messages. How: This starts watching in the member's page, collecting each message's text.


		const modPatStr = '/src/state/chat.ts';                         // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the chat module.
		const chaModObj = await import( /* @vite-ignore */ modPatStr ); // What: Chat Module Object. Why: The page runs the real module. How: This imports it.
		const texValArr : string[] = [];                                // What: Text Value Array. Why: The test reads what arrived. How: This collects the texts.


		( window as unknown as { texValArr : string[] } ).texValArr = texValArr; // What: Window Assignment. Why: The test reads the texts from a later call. How: This keeps the array on the window. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

		await chaModObj.chaWatFun( groIdeStr, ( mesRecObj : { texValStr : string } ) => texValArr.push( mesRecObj.texValStr ) ); // What: Watch Start Call. Why: Each kept message is collected. How: This watches the chat.


	}, groIdeStr );

	await senPolFun( page, groIdeStr, 'Live now' ); // What: Live Send Call. Why: A message sent while the member watches. How: This sends it.

	await expect.poll( () => secPagObj.evaluate( () => ( window as unknown as { texValArr : string[] } ).texValArr ) ).toEqual( [ 'Live now' ] ); // What: Watch Poll. Why: The watcher hears the new message. How: This waits for it to arrive. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.


} );

// #endregion Module Init


