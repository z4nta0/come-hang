


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: A membership is changed by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the history or presence behaved as it should. How: This asserts on what the pages and the emulators return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulators.
import { joiWaiFun                 } from '../support/client.ts';         // What: Join Wait Function. Why: Messages sent after a join must come after it, though the clock can step back. How: This waits out a step.
import { keyRawFun                 } from '../support/client.ts';         // What: Key Raw Function. Why: A forged bundle is encrypted with the group key. How: This exports a page's key.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Most tests start from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { ref                       } from 'firebase/storage';             // What: Ref. Why: A forged bundle is uploaded by path. How: This builds its reference.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { senPolFun                 } from '../support/client.ts';         // What: Send Poll Function. Why: A send just after a membership change waits for the mirror. How: This retries a send until it lands.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Join times are read and set. How: This reads and builds them.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: A join time is set past the rules. How: This changes it.
import { uploadBytes               } from 'firebase/storage';             // What: Upload Bytes. Why: A forged bundle is seeded past the rules. How: This uploads it.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The local clear runs in a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * history.spec.ts = History Spec
 *
 * @summary
 * Checks peer-assisted chat history and presence in a real browser, in each
 * engine, against the Emulator Suite with the real security rules and the
 * membership mirror's Cloud Functions. Each test runs the app's own modules
 * in two identities' pages: a member who lost their history, or wants chat
 * from before they joined, asks for it, the other member checks coverage,
 * claims, and sends it, and the asker collects and merges it. A forged
 * bundle shows the asker keeps only well-formed messages in range. Presence
 * is checked online, offline, and when a device drops off.
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

const CHA_MOD_STR = '/src/state/chat.ts';          // What: Chat Module String. Why: Chat is sent and synced there. How: This names its path.
const HIS_MOD_STR = '/src/state/history.ts';       // What: History Module String. Why: History requests are made and answered there. How: This names its path.
const STO_MOD_STR = '/src/platform/chat-store.ts'; // What: Store Module String. Why: The device's history is read there. How: This names its path.

// #endregion Constants



// #region Module State

let hisEnvObj : RulesTestEnvironment; // What: History Environment Object. Why: Every read and seed reaches the emulators through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const texLisFun = async ( pagValObj : Page, groIdeStr : string ) : Promise< string[] > => ( await runPagFun( pagValObj, STO_MOD_STR, 'mesLisFun', groIdeStr ) as { texValStr : string }[] ).map( ( mesRecObj ) => mesRecObj.texValStr ); // What: Text List Function. Why: Tests compare a device's history by its texts. How: This reads the history in a page and keeps each text. // What: Type Assertion Note. Why: mesLisFun resolves with message records. How: The as reads their text.



const locCleFun = ( pagValObj : Page ) : Promise< void > => pagValObj.evaluate( () => new Promise< void >( ( resValFun ) => { // What: Local Clear Function. Why: A member on a new device has no history. How: This empties the page's message store.


	const opeReqObj = indexedDB.open( 'come-hang' ); // What: Open Request Object. Why: The history lives in the app's database. How: This opens it.


	opeReqObj.onsuccess = () => { // What: Open Handler. Why: The clear runs once the database is open. How: This clears the store and closes the connection when it's done.


		const traValObj = opeReqObj.result.transaction( 'messages', 'readwrite' ); // What: Transaction Value Object. Why: The clear needs a writable transaction. How: This opens one on the message store.


		traValObj.objectStore( 'messages' ).clear(); // What: Clear Call. Why: The history is lost. How: This empties the store.

		traValObj.oncomplete = () => { // What: Complete Handler. Why: The test continues once the clear has landed. How: This closes the connection and settles.


			opeReqObj.result.close(); // What: Close Call. Why: An open connection would hold the database. How: This closes it.

			resValFun(); // What: Settle Call. Why: The test waits for the clear. How: This settles the promise.


		};


	};


} ) );

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore and Storage under the demo project.


	hisEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulators through it. How: This connects to both.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Requests are read there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang',                    // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.
		storage   : { host : '127.0.0.1', port : 8220 }  // What: Storage Options. Why: A forged bundle is seeded there. How: This names the address firebase.json gives its emulator.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await hisEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a member who lost their history recovers it from another member, and the request then goes', async ( { page, secPagObj } ) => { // What: Recovery Test. Why: A member on a new device gets back the chat they had (Section 11.9). How: This has the member sync, lose, and ask for their history, the owner check, claim, and send it, and the member collect it, then checks the member's coverage for the owner and a withdrawal.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( hisEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	await joiWaiFun( hisEnvObj, groIdeStr, uidMemStr ); // What: Join Wait Call. Why: The test machine's clock can step back, so messages sent next must come after the join. How: This waits out a step.

	await senPolFun( page, groIdeStr, 'one' ); // What: First Send Call. Why: There has to be history to lose. How: This sends once the mirror is ready.

	await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, 'two' ); // What: Second Send Call. Why: More than one message is recovered. How: This sends another.

	expect( await runPagFun( secPagObj, CHA_MOD_STR, 'chaSynFun', groIdeStr ) ).toBe( 2 ); // What: Member Sync. Why: The member had the history. How: This expects both messages kept.

	await locCleFun( secPagObj ); // What: Lose Call. Why: The member moves to a device with no history. How: This empties the member's store.

	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisAskFun', groIdeStr, 'recovery', null ) ).toBeUndefined();  // What: Ask Call. Why: The member asks for their history. How: This expects the request filed.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisLisFun', groIdeStr ) ).toEqual( [ { claTimNum : null, claUidStr : null, kinValStr : 'recovery', ranTimNum : null, staValStr : 'pending', uidReqStr : uidMemStr } ] ); // What: Request Listed. Why: Members see who needs history. How: This expects the pending recovery.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisCovFun', groIdeStr, uidMemStr ) ).toBe( true );                 // What: Owner Covers. Why: The owner was there first and holds the history. How: This expects coverage.
	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisGetFun', groIdeStr ) ).toBeNull();                         // What: Nothing Yet. Why: No bundle has arrived. How: This expects null.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisClaFun', groIdeStr, uidMemStr ) ).toBeUndefined();              // What: Claim Call. Why: The owner offers to help. How: This expects the claim to succeed.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisSenFun', groIdeStr, uidMemStr ) ).toBe( 2 );                    // What: Send Call. Why: The owner shares the range. How: This expects both messages sent.
	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisGetFun', groIdeStr ) ).toBe( 2 );                          // What: Collect Call. Why: The member merges the history. How: This expects both kept.
	expect( await texLisFun( secPagObj, groIdeStr ) ).toEqual( [ 'one', 'two' ] );                                  // What: History Restored. Why: The member's device has the chat back. How: This expects both texts in order.
	expect( await docReaFun( hisEnvObj, `groups/${ groIdeStr }/historyRequests/${ uidMemStr }` ) ).toBeUndefined(); // What: Request Gone. Why: A finished request is deleted. How: This expects no request.
	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisGetFun', groIdeStr ) ).toBeNull();                         // What: Bundle Gone. Why: A collected bundle is deleted. How: This expects nothing more to collect.



	await runPagFun( page, HIS_MOD_STR, 'hisAskFun', groIdeStr, 'recovery', null ); // What: Owner Ask Call. Why: A member who joined later has to hold older history to help the owner. How: This files the owner's recovery.

	await locCleFun( secPagObj ); // What: Member Clear Call. Why: The coverage checks use times set far apart, since the test machine's clock can step back. How: This empties the member's store.

	await hisEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/members/${ uidMemStr }` ), { joinedAt : Timestamp.fromMillis( Date.now() + 1800000 ) } ); } ); // What: Late Join Call. Why: The member has to have joined after the owner, by a margin no clock step can undo. How: This sets the member's join half an hour from now with the rules off.

	await runPagFun( secPagObj, STO_MOD_STR, 'mesPutFun', { groIdeStr, mesIdeStr : 'new', senUidStr : uidOwnStr, sntTimNum : Date.now() + 3600000, texValStr : 'new' } ); // What: New Seed Call. Why: History starting well after the owner's join doesn't cover it. How: This stores a message timed an hour from now.

	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisCovFun', groIdeStr, uidOwnStr ) ).toBe( false ); // What: Member Lacks Coverage. Why: The member joined after the owner and holds nothing older. How: This expects no coverage for history that starts later.

	await runPagFun( secPagObj, STO_MOD_STR, 'mesPutFun', { groIdeStr, mesIdeStr : 'old', senUidStr : uidOwnStr, sntTimNum : 1, texValStr : 'old' } ); // What: Old Seed Call. Why: History reaching back past the start covers it whoever joined when. How: This stores a message from long ago on the member's device.

	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisCovFun', groIdeStr, uidOwnStr ) ).toBe( true ); // What: Member Covers. Why: The member's history now reaches back past the owner's join. How: This expects coverage.

	expect( await runPagFun( page, HIS_MOD_STR, 'hisWitFun', groIdeStr ) ).toBeUndefined();                         // What: Withdraw Call. Why: An asker may stop asking. How: This expects the withdrawal to succeed.
	expect( await docReaFun( hisEnvObj, `groups/${ groIdeStr }/historyRequests/${ uidOwnStr }` ) ).toBeUndefined(); // What: Withdrawn Gone. Why: A withdrawn request is deleted. How: This expects no request.


} );



pagTesObj( 'a newer member asks for chat from before they joined and gets only that, from one claim', async ( { page, secPagObj } ) => { // What: Backlog Test. Why: A backlog covers only chat from before the asker joined, and one helper claims it at a time (Section 11.9). How: This sends twice before and once after a member joins, has them ask for the backlog from the second message, claims, releases, claims again, and sends.


	const groIdeStr = await runPagFun( page, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The owner chats alone first. How: This creates the group. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await joiWaiFun( hisEnvObj, groIdeStr, ( await docReaFun( hisEnvObj, `groups/${ groIdeStr }` ) )?.ownerUid as string ); // What: Creation Wait Call. Why: A backlog starts no earlier than the group, and the test machine's clock can step back. How: This waits for the clock to pass the owner's join. // What: Type Assertion Note. Why: The rules store the owner as a string. How: The as reads it as one.

	await senPolFun( page, groIdeStr, 'first' ); // What: First Send Call. Why: Chat from before the backlog's start. How: This sends once the mirror is ready.

	await runPagFun( page, CHA_MOD_STR, 'chaSenFun', groIdeStr, 'second' ); // What: Second Send Call. Why: Chat from inside the backlog's range. How: This sends it.


	const groDatObj = await docReaFun( hisEnvObj, `groups/${ groIdeStr }` );                                                       // What: Group Data Object. Why: The member joins through the group's token. How: This reads the group.
	const uidMemStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Member String. Why: The owner approves the member by UID. How: This makes sure the member's identity exists and reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await runPagFun( secPagObj, '/src/state/joins.ts', 'reqCreFun', groDatObj?.currentInviteToken, 'Dana Lee', '' ); // What: Request Call. Why: The member asks to join. How: This files the request.

	await runPagFun( page, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidMemStr ); // What: Approval Call. Why: The owner lets the member in. How: This approves the request.

	await joiWaiFun( hisEnvObj, groIdeStr, uidMemStr ); // What: Join Wait Call. Why: The test machine's clock can step back, so messages sent next must come after the join. How: This waits out a step.

	await expect.poll( () => runPagFun( secPagObj, CHA_MOD_STR, 'chaSynFun', groIdeStr ) ).toBe( 0 ); // What: Member Sync Poll. Why: The member reads once the mirror has them, from their join on. How: This retries until a sync keeps nothing.

	await senPolFun( page, groIdeStr, 'late' ); // What: Late Send Call. Why: Chat after the member joined isn't backlog. How: This sends it.

	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisAskFun', groIdeStr, 'backlog', ( await runPagFun( page, STO_MOD_STR, 'mesLisFun', groIdeStr ) as { sntTimNum : number }[] )[ 1 ].sntTimNum ) ).toBeUndefined(); // What: Ask Call. Why: The member asks for chat from the second message up to their join. How: This expects a backlog starting at the second message's time filed. // What: Type Assertion Note. Why: mesLisFun resolves with message records. How: The as reads their times.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisCovFun', groIdeStr, uidMemStr ) ).toBe( true );                           // What: Owner Covers. Why: The owner was there from the start and holds history. How: This expects coverage.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisClaFun', groIdeStr, uidMemStr ) ).toBeUndefined();                        // What: First Claim. Why: The owner offers to help. How: This expects the claim to succeed.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisClaFun', groIdeStr, uidMemStr ) ).toBe( 'error:Error' );                  // What: Second Claim Refused. Why: Someone is already helping. How: This expects an Error.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisRelFun', groIdeStr, uidMemStr ) ).toBeUndefined();                        // What: Release Call. Why: A helper may let a claim go. How: This expects the release to succeed.
	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisClaFun', groIdeStr, uidMemStr ) ).toBe( 'error:permission-denied' ); // What: Own Claim Refused. Why: The asker can't answer their own request. How: This expects the rules to refuse it.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisClaFun', groIdeStr, uidMemStr ) ).toBeUndefined();                        // What: Claim Again. Why: A released request is open again. How: This expects a new claim.
	expect( await runPagFun( page, HIS_MOD_STR, 'hisSenFun', groIdeStr, uidMemStr ) ).toBe( 1 );                              // What: Send Call. Why: Only the chat before the join is backlog. How: This expects one message sent.
	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisGetFun', groIdeStr ) ).toBe( 1 );                                    // What: Collect Call. Why: The member merges the backlog. How: This expects one kept.
	expect( await texLisFun( secPagObj, groIdeStr ) ).toEqual( [ 'second' ] );                                                // What: Backlog Kept. Why: The member now has the chat from before they joined. How: This expects the second message alone.


} );



pagTesObj( 'a bundle is untrusted, so only well-formed messages in the range are kept', async ( { page, secPagObj } ) => { // What: Untrusted Bundle Test. Why: A bundle comes from another member, so the asker checks every entry (Section 11.11). How: This checks an empty device lacks coverage, claims a request as the owner, seeds a forged bundle with bad entries, and collects it as the member.


	const { groIdeStr, uidMemStr } = await memSetFun( hisEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	await senPolFun( page, groIdeStr, 'ready' ); // What: Ready Send Call. Why: The mirror has to have the member before history is asked for. How: This sends once it does.

	await runPagFun( secPagObj, HIS_MOD_STR, 'hisAskFun', groIdeStr, 'recovery', null ); // What: Ask Call. Why: There has to be a request to answer. How: This files a recovery.

	await locCleFun( page ); // What: Owner Clear Call. Why: A helper there from the start still needs history on the device. How: This empties the owner's store.

	expect( await runPagFun( page, HIS_MOD_STR, 'hisCovFun', groIdeStr, uidMemStr ) ).toBe( false ); // What: Empty Device Lacks Coverage. Why: Joining early covers nothing without history to share. How: This expects no coverage.

	await runPagFun( page, HIS_MOD_STR, 'hisClaFun', groIdeStr, uidMemStr ); // What: Claim Call. Why: Only a claimed request can be fulfilled. How: This claims it as the owner.


	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( await keyRawFun( page, groIdeStr ), 'base64' ), 'AES-GCM', false, [ 'encrypt' ] ); // What: Key Value Object. Why: The forged bundle is encrypted with the group's key. How: This imports it.
	const iniVecArr = crypto.getRandomValues( new Uint8Array( 12 ) );                                                                                       // What: Initialization Vector Array. Why: Each encryption takes a fresh IV. How: This draws one.
	const nowTimNum = ( ( await docReaFun( hisEnvObj, `groups/${ groIdeStr }/members/${ uidMemStr }` ) )?.joinedAt as Timestamp ).toMillis() + 1000;        // What: Now Time Number. Why: A message in range comes after the member's join, whatever the clock does. How: This times it a second after the join. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.

	const entValArr = [ // What: Entry Value Array. Why: Each entry tests one way a bundle can be bad. How: This lists one good entry and several bad ones.


		{ mesIdeStr : 'good', senUidStr : 'x', sntTimNum : nowTimNum, texValStr : 'kept' },               // What: Good Entry. Why: A well-formed message in range is kept. How: This times it now.
		{ mesIdeStr : 'old', senUidStr : 'x', sntTimNum : 0, texValStr : 'too old' },                     // What: Old Entry. Why: A message before the range isn't the asker's to have. How: This times it at zero.
		{ mesIdeStr : 'bad', senUidStr : 'x', sntTimNum : nowTimNum },                                    // What: Textless Entry. Why: A message without text isn't one. How: This leaves the text out.
		{ senUidStr : 'x', sntTimNum : nowTimNum, texValStr : 'no ID' },                                  // What: Unnamed Entry. Why: A message is stored under its ID. How: This leaves the ID out.
		{ mesIdeStr : 'anon', sntTimNum : nowTimNum, texValStr : 'no sender' },                           // What: Senderless Entry. Why: A message names its sender. How: This leaves the sender out.
		{ mesIdeStr : 'str', senUidStr : 'x', sntTimNum : String( nowTimNum ), texValStr : 'text time' }, // What: Text Time Entry. Why: A message's time is a number. How: This gives it as text.
		null,                                                                                             // What: Null Entry. Why: Not every entry is even an object. How: This is null.
		'junk'                                                                                            // What: Junk Entry. Why: A bare string isn't a message either. How: This is one.


	];

	const cipTexBuf = await crypto.subtle.encrypt( { iv : iniVecArr, name : 'AES-GCM' }, keyValObj, new TextEncoder().encode( JSON.stringify( entValArr ) ) ); // What: Cipher Text Buffer. Why: A bundle is encrypted. How: This encrypts the entries as JSON.



	await hisEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await uploadBytes( ref( cotAdmObj.storage( 'gs://demo-come-hang.appspot.com' ), `groupHistoryTransfers/${ groIdeStr }/${ uidMemStr }` ), new Uint8Array( [ ...iniVecArr, ...new Uint8Array( cipTexBuf ) ] ), { contentType : 'application/octet-stream' } ); } ); // What: Forged Upload Call. Why: The forged bundle stands in for a helper's. How: This uploads its IV and ciphertext with the rules off.


	expect( await runPagFun( secPagObj, HIS_MOD_STR, 'hisGetFun', groIdeStr ) ).toBe( 1 ); // What: Collect Call. Why: Only the good entry passes. How: This expects one message kept.
	expect( await texLisFun( secPagObj, groIdeStr ) ).toEqual( [ 'kept' ] );               // What: Good Entry Kept. Why: The bad entries are skipped. How: This expects the good text alone.


} );



pagTesObj( 'a member shows online to the group, and goes offline by choice or when the device drops', async ( { page, secPagObj } ) => { // What: Presence Test. Why: Members see who's around, and a dropped device doesn't stay online (Section 11.8). How: This watches as the owner while the member comes online, goes offline, comes back, and closes their page.


	const { groIdeStr, uidMemStr } = await memSetFun( hisEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	await senPolFun( secPagObj, groIdeStr, 'ready' ); // What: Ready Send Call. Why: The mirror has to have the member before they write presence. How: This sends as the member once it does.



	await page.evaluate( async ( groIdeStr ) => { // What: Watch Call. Why: The owner sees who's online. How: This starts watching in the owner's page, keeping the latest list on the window.


		const modPatStr = '/src/state/presence.ts';                      // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the presence module.
		const preModObj = await import( /* @vite-ignore */ modPatStr );  // What: Presence Module Object. Why: The page runs the real module. How: This imports it.
		const winValObj = window as unknown as { uidValArr : string[] }; // What: Window Value Object. Why: The test reads the list from a later call. How: This views the window with that field. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.


		winValObj.uidValArr = []; // What: List Assignment. Why: Nobody is online before the first update. How: This starts the list empty.

		preModObj.preWatFun( groIdeStr, ( uidValArr : string[] ) => { winValObj.uidValArr = uidValArr; } ); // What: Watch Start Call. Why: The list follows each change. How: This watches the group's presence.


	}, groIdeStr );

	await secPagObj.evaluate( async ( groIdeStr ) => { // What: Online Call. Why: The member comes online. How: This marks them online, keeping the offline function on the window.


		const modPatStr = '/src/state/presence.ts';                     // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the presence module.
		const preModObj = await import( /* @vite-ignore */ modPatStr ); // What: Presence Module Object. Why: The page runs the real module. How: This imports it.


		( window as unknown as { offValFun : () => Promise< void > } ).offValFun = await preModObj.preOnlFun( groIdeStr ); // What: Offline Assignment. Why: The test goes offline from a later call. How: This keeps the offline function on the window. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.


	}, groIdeStr );

	await expect.poll( () => page.evaluate( () => ( window as unknown as { uidValArr : string[] } ).uidValArr ) ).toEqual( [ uidMemStr ] ); // What: Online Poll. Why: The owner sees the member online. How: This waits for the list to name them. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

	await secPagObj.evaluate( () => ( window as unknown as { offValFun : () => Promise< void > } ).offValFun() ); // What: Offline Call. Why: The member goes offline by choice. How: This runs the offline function. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

	await expect.poll( () => page.evaluate( () => ( window as unknown as { uidValArr : string[] } ).uidValArr ) ).toEqual( [] ); // What: Offline Poll. Why: The owner sees the member leave. How: This waits for the list to empty. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

	await secPagObj.evaluate( async ( groIdeStr ) => { await ( await import( /* @vite-ignore */ '/src/state/presence.ts' as string ) ).preOnlFun( groIdeStr ); }, groIdeStr ); // What: Back Online Call. Why: The member comes back before dropping off. How: This marks them online again. // What: Type Assertion Note. Why: A literal path would send the type check looking for a file at the server's root. How: The as reads it as any string, as a variable path would be.

	await expect.poll( () => page.evaluate( () => ( window as unknown as { uidValArr : string[] } ).uidValArr ) ).toEqual( [ uidMemStr ] ); // What: Back Poll. Why: The owner sees the member again. How: This waits for the list to name them. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

	await secPagObj.close(); // What: Drop Call. Why: A device that drops off can't clear its own entry. How: This closes the member's page.

	await expect.poll( () => page.evaluate( () => ( window as unknown as { uidValArr : string[] } ).uidValArr ) ).toEqual( [] ); // What: Drop Poll. Why: The server clears a dropped device's entry. How: This waits for the list to empty. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.


} );

// #endregion Module Init


