


// #region Imports

import { decNamFun                 } from '../support/client.ts';         // What: Decrypt Name Function. Why: The joiner's name is checked outside the browser. How: This reads and decrypts it.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The tests read and seed documents by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the join went as it should. How: This asserts on what the pages and the emulator return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { keyRawFun                 } from '../support/client.ts';         // What: Key Raw Function. Why: The owner and the joiner have to hold the same group key. How: This exports a page's key.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a joiner apart from the owner's page. How: This declares tests with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: An expired request can't be filed through the rules. How: This seeds one.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A seeded request needs its times. How: This builds them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The setup runs in both identities' pages. How: This types them.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * joins.spec.ts = Joins Spec
 *
 * @summary
 * Checks joining a group in a real browser, in each engine, against the
 * Emulator Suite, with the real security rules. Each test has two
 * identities, the page's own as the group's owner and a joiner in a second
 * browser context with its own storage, and runs the app's own modules in
 * each page: the joiner reads the invite and asks to join, and the owner
 * reviews and answers the request. The tests read back what was written and
 * decrypt the joiner's name outside the browser.
 *
 * Sections:
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let joiEnvObj : RulesTestEnvironment; // What: Joins Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region groSetFun

/**
 * groSetFun = Group Setup Function
 *
 * @summary
 * Creates a group as the owner's page and reads back its ID, its working
 * invite token, and the joiner's UID, which the joiner's page makes sure
 * exists.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ownPagObj - Owner Page Object: The owner's page.
 * @param secPagObj - Joiner Page Object: The joiner's page.
 *
 * @returns A promise that resolves with the group's ID, the token, and the
 *          joiner's UID.
 *
 * @example
 * ```ts
 * groSetFun(page, secPagObj) // => { groIdeStr, tokValStr, uidJoiStr }
 * ```
 *
*/

const groSetFun = async ( ownPagObj : Page, secPagObj : Page ) : Promise< { groIdeStr : string, tokValStr : string, uidJoiStr : string } > => { // What: Group Setup Function. Why: Every test starts from a group and a joiner. How: This creates the group and reads what the tests need.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string;           // What: Group Identifier String. Why: The group joined. How: This creates it as the owner. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const tokValStr = ( await docReaFun( joiEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                     // What: Token Value String. Why: The joiner asks through the group's link. How: This reads the token the group names. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
	const uidJoiStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Joiner String. Why: The owner answers the joiner by UID. How: This makes sure the joiner's identity exists and reads its UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.



	return { groIdeStr, tokValStr, uidJoiStr }; // What: Setup Return. Why: The test uses all three. How: This returns them.


};

// #endregion groSetFun

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	joiEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await joiEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a member approves a request filed through the invite, letting the joiner in with the group key and their name', async ( { secPagObj, page } ) => { // What: Approval Test. Why: Every join waits for a member, who hands the joiner the group key (Section 17). How: This files a request as the joiner, approves it as the owner, and checks the membership, the key, the name, the count, and the request's end.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, secPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.


	expect( await runPagFun( secPagObj, joiModStr, 'invGetFun', tokValStr ) ).toEqual( { groIdeStr, groNamStr : 'Beach Day' } );  // What: Invite Read. Why: The joiner sees the group's name before asking. How: This expects the invite to name the group.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, '  Dana   Lee ', "Sam's cousin" ) ).toBe( groIdeStr ); // What: Request Filed. Why: The joiner asks with their name and a note. How: This expects the request filed in the group.
	expect( await runPagFun( secPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'pending' );                                  // What: Pending Status. Why: The joiner waits for an answer. How: This expects pending.



	await joiEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Earlier Seed Call. Why: The review lists the longest-waiting request first, and the emulator returns requests by ID. How: This writes an older request whose ID sorts after any UID.


		await setDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/joinRequests/${ 'z'.repeat( 30 ) }` ), { // What: Request Set Call. Why: A request an hour older than the joiner's. How: This writes it.


			expireAt    : Timestamp.fromMillis( Date.now() + 86400000 ),
			inviteToken : tokValStr,
			nameText    : 'Earl',
			requestedAt : Timestamp.fromMillis( Date.now() - 3600000 )


		} );


	} );


	expect( await runPagFun( page, joiModStr, 'reqLisFun', groIdeStr ) ).toMatchObject( [ { namTexStr : 'Earl', notTexStr : '' }, { namTexStr : 'Dana Lee', notTexStr : "Sam's cousin", uidValStr : uidJoiStr } ] ); // What: Requests Listed. Why: The owner reviews each tidied name and note, oldest first. How: This expects the older request, then the joiner's.

	expect( await runPagFun( page, joiModStr, 'reqAppFun', groIdeStr, uidJoiStr ) ).toBeUndefined(); // What: Approval Call. Why: The owner lets the joiner in. How: This expects the approval to succeed.


	const accDatObj = await docReaFun( joiEnvObj, `accounts/${ uidJoiStr }` );                           // What: Account Data Object. Why: The group takes one of the joiner's slots. How: This reads their account.
	const groDatObj = await docReaFun( joiEnvObj, `groups/${ groIdeStr }` );                             // What: Group Data Object. Why: The count includes the joiner. How: This reads the group.
	const keyJoiStr = await keyRawFun( secPagObj, groIdeStr );                                           // What: Key Joiner String. Why: The joiner opens their wrap with their own key alone. How: This loads the key in the joiner's page.
	const keyOwnStr = await keyRawFun( page, groIdeStr );                                                // What: Key Owner String. Why: The joiner's key has to be the group's key. How: This loads the owner's.
	const reqDatObj = await docReaFun( joiEnvObj, `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ); // What: Request Data Object. Why: An answered request ends, and its plaintext name with it. How: This reads where it was.


	expect( await runPagFun( secPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'member' ); // What: Member Status. Why: The joiner's app opens the group once they're in. How: This expects member.
	expect( keyJoiStr ).toBe( keyOwnStr );                                                      // What: Same Key. Why: The joiner reads the group with its own key. How: This expects the two keys to match.
	expect( await decNamFun( joiEnvObj, groIdeStr, uidJoiStr, keyJoiStr ) ).toBe( 'Dana Lee' ); // What: Name Decrypted. Why: The joiner's name is stored encrypted under the group key. How: This expects the requested name back.
	expect( groDatObj ).toMatchObject( { countedUid : uidJoiStr, memberCount : 2 } );           // What: Count Raised. Why: The group counts its new member. How: This expects 2, naming the joiner.
	expect( accDatObj?.memberGroups ).toEqual( { [ groIdeStr ] : true } );                      // What: Member Slot. Why: The group counts against the joiner's caps. How: This expects it in their member map.
	expect( reqDatObj ).toBeUndefined();                                                        // What: Request Ended. Why: The approval answers it. How: This expects it gone.

	expect( await runPagFun( page, joiModStr, 'reqAppFun', groIdeStr, uidJoiStr ) ).toBe( 'error:Error' ); // What: Second Approval Refused. Why: An answered request can't let someone in twice. How: This expects the approval rejected.


} );



pagTesObj( 'a request is checked before it is sent, leaves out an empty note, and can be withdrawn', async ( { secPagObj, page } ) => { // What: Request Test. Why: A bad name, note, or link fails before anything is written, and a joiner may take a request back (Section 17). How: This tries bad links and text, then files a request and withdraws it, checking each refusal, the request's fields, and its end.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, secPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.


	expect( await runPagFun( secPagObj, joiModStr, 'invGetFun', 'groups/x' ) ).toBeNull();                                           // What: Bad Token Form. Why: A token can't name another path. How: This expects null without a read.
	expect( await runPagFun( secPagObj, joiModStr, 'invGetFun', 'A'.repeat( 22 ) ) ).toBeNull();                                     // What: Missing Invite. Why: A rotated link opens nothing. How: This expects null.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', 'A'.repeat( 22 ), 'Dana', '' ) ).toBe( 'error:Error' );              // What: Dead Link Refused. Why: A request needs a working invite. How: This expects an Error.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana 2', '' ) ).toBe( 'error:RangeError' );              // What: Bad Name Refused. Why: A name is letters, so a number fails. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '🎉' ) ).toBe( 'error:RangeError' );               // What: Emoji Note Refused. Why: A note allows no emoji. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', 'a'.repeat( 151 ) ) ).toBe( 'error:RangeError' ); // What: Long Note Refused. Why: A note has at most 150 characters. How: This expects a RangeError.
	expect( await docReaFun( joiEnvObj, `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ) ).toBeUndefined();                     // What: Nothing Filed. Why: A refused request writes nothing. How: This expects no request.

	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '  ' ) ).toBe( groIdeStr ); // What: Request Filed. Why: A blank note is no note. How: This expects the request filed.


	const reqDatObj = await docReaFun( joiEnvObj, `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ); // What: Request Data Object. Why: An empty note is left out. How: This reads the request.


	expect( reqDatObj ).toMatchObject( { inviteToken : tokValStr, nameText : 'Dana' } ); // What: Request Fields. Why: The request names the token and the name. How: This expects both.
	expect( reqDatObj ).not.toHaveProperty( 'noteText' );                                // What: Note Left Out. Why: The rules allow no empty note field to ride along. How: This expects no note.

	expect( await runPagFun( secPagObj, joiModStr, 'reqWitFun', groIdeStr ) ).toBeUndefined(); // What: Withdraw Call. Why: The joiner takes the request back. How: This expects it to succeed.

	expect( await runPagFun( secPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' ); // What: Ended Status. Why: A withdrawn request is over. How: This expects ended.


} );



pagTesObj( 'a decline ends a request, and a block also keeps its sender from asking again', async ( { secPagObj, page } ) => { // What: Decline Test. Why: Any member may decline a request, or decline and block its sender (Section 17). How: This declines one request, then blocks a second, and tries a third, checking the blocklist and the final refusal.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, secPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.


	await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '' ); // What: First Request. Why: There has to be a request to decline. How: This files one.

	expect( await runPagFun( page, joiModStr, 'reqDecFun', groIdeStr, uidJoiStr ) ).toBeUndefined();         // What: Decline Call. Why: The owner turns the request down. How: This expects it to succeed.
	expect( await runPagFun( secPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' );               // What: Declined Status. Why: A declined request is over. How: This expects ended.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '' ) ).toBe( groIdeStr ); // What: Second Request. Why: A plain decline doesn't block. How: This expects a new request filed.

	expect( await runPagFun( page, joiModStr, 'reqBloFun', groIdeStr, uidJoiStr ) ).toBeUndefined(); // What: Block Call. Why: The owner blocks the sender. How: This expects it to succeed.


	const groDatObj = await docReaFun( joiEnvObj, `groups/${ groIdeStr }` ); // What: Group Data Object. Why: The block lands in the group's blocklist. How: This reads the group.


	expect( groDatObj?.removedUids ).toEqual( { [ uidJoiStr ] : true } );                                                    // What: Blocklist Entry. Why: The sender can't redeem any of the group's links. How: This expects their UID listed.
	expect( await runPagFun( secPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' );                               // What: Blocked Status. Why: A blocked request is over. How: This expects ended.
	expect( await runPagFun( secPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '' ) ).toBe( 'error:permission-denied' ); // What: Third Request Refused. Why: A blocked identity can't ask again. How: This expects the rules to refuse it.


} );



pagTesObj( 'an expired request is left out of the review, no longer waits, and cannot be approved', async ( { secPagObj, page } ) => { // What: Expiry Test. Why: A request past its 7 days is over, though its TTL deletion can run a day late. How: This seeds an expired request, then lists, checks, and approves it.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, secPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.



	await joiEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Expired Seed Call. Why: The rules refuse filing an expired request. How: This writes one with the rules off.


		await setDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ), { // What: Request Set Call. Why: The joiner's request, a minute past its expiry. How: This writes it.


			expireAt    : Timestamp.fromMillis( Date.now() - 60000 ),
			inviteToken : tokValStr,
			nameText    : 'Dana',
			requestedAt : Timestamp.fromMillis( Date.now() - 7 * 86400000 )


		} );


	} );


	expect( await runPagFun( page, joiModStr, 'reqLisFun', groIdeStr ) ).toEqual( [] );                     // What: Left Out. Why: An expired request isn't reviewed. How: This expects an empty list.
	expect( await runPagFun( secPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' );              // What: Expired Status. Why: An expired request no longer waits. How: This expects ended.
	expect( await runPagFun( page, joiModStr, 'reqAppFun', groIdeStr, uidJoiStr ) ).toBe( 'error:Error' );  // What: Approval Refused. Why: An expired request can't let anyone in. How: This expects the approval rejected.
	expect( await docReaFun( joiEnvObj, `groups/${ groIdeStr }/members/${ uidJoiStr }` ) ).toBeUndefined(); // What: No Membership. Why: The refused approval wrote nothing. How: This expects no member document.


} );

// #endregion Module Init


