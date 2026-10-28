


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The tests read and seed documents by path. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the join went as it should. How: This asserts on what the pages and the emulator return.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The tests read back what the pages wrote. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: An expired request can't be filed through the rules. How: This seeds one.
import { test                      } from '@playwright/test';             // What: Test. Why: The tests need a second identity beside the page's own. How: This is extended with a joiner's page.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A seeded request needs its times. How: This builds them.


import type { Bytes                } from 'firebase/firestore';           // What: Bytes. Why: The joiner's encrypted name comes back as Firestore bytes. How: This types it.
import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers run code in either identity's page. How: This types it.
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

const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check what the pages wrote. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await joiEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Accounts and groups aren't readable by the test itself. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};



// #region runPagFun

/**
 * runPagFun = Run Page Function
 *
 * @summary
 * Calls one of the app's exported functions in a page, importing its module
 * from the dev server, and resolves with what it returned, or with a string
 * naming the error it threw: `error:` and the error's Firestore code, or its
 * name when it has none. The return value has to survive the trip out of
 * the page, so a function returning a key goes through keyRawFun instead.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The identity's page.
 * @param modPatStr - Module Path String: The module's path on the dev server.
 * @param funNamStr - Function Name String: The exported function to call.
 * @param argValArr - Argument Value Array: The arguments to call it with.
 *
 * @returns A promise that resolves with the function's result or its error.
 *
 * @example
 * ```ts
 * runPagFun(page, '/src/state/joins.ts', 'reqStaFun', 'Xk3...') // => 'ended'
 * ```
 *
*/

const runPagFun = ( pagValObj : Page, modPatStr : string, funNamStr : string, ...argValArr : unknown[] ) : Promise< unknown > => pagValObj.evaluate( async ( [ modPatStr, funNamStr, argValArr ] ) => { // What: Run Page Function. Why: Each step runs as one identity, where it really runs. How: This imports the module in the page and calls the function there.


	const modValObj = await import( /* @vite-ignore */ modPatStr ); // What: Module Value Object. Why: The page runs the real module. How: This imports it.



	try { return await modValObj[ funNamStr ]( ...argValArr ); } // What: Function Call Return. Why: The step under test runs as this identity. How: This calls the function and returns what it resolves with.

	catch ( errCatObj ) { return `error:${ ( errCatObj as { code? : string } ).code ?? ( errCatObj as Error ).name }`; } // What: Error Return. Why: A refusal is what several tests check for. How: This names the Firestore code, or the error's name. // What: Type Assertion Note. Why: A catch binding is unknown, and Firestore's errors carry a code. How: The two as read it as either.


}, [ modPatStr, funNamStr, argValArr ] as const ); // What: Page Arguments. Why: The callback runs in the page, apart from the test's variables. How: This passes the path, the name, and the arguments in. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.

// #endregion runPagFun



const keyRawFun = ( pagValObj : Page, groIdeStr : string ) : Promise< string > => pagValObj.evaluate( async ( groIdeStr ) => { // What: Key Raw Function. Why: The owner and the joiner have to hold the same group key. How: This loads the key in the page and exports it as base64.


	const modPatStr = '/src/state/groups.ts';                       // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the groups module.
	const groModObj = await import( /* @vite-ignore */ modPatStr ); // What: Groups Module Object. Why: The page runs the real module. How: This imports it.
	const groKeyObj = await groModObj.keyLoaFun( groIdeStr );       // What: Group Key Object. Why: The key this identity holds. How: This loads it.



	return btoa( String.fromCharCode( ...new Uint8Array( await crypto.subtle.exportKey( 'raw', groKeyObj ) ) ) ); // What: Key Return. Why: A key can't leave the page as is. How: This exports it as base64.


}, groIdeStr ); // What: Page Argument. Why: The callback runs in the page, apart from the test's variables. How: This passes the group's ID in.



// #region decNamFun

/**
 * decNamFun = Decrypt Name Function
 *
 * @summary
 * Reads a member's encrypted display name from the emulator and decrypts it
 * in Node with a group key a page reported, as any member's device would.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The member's UID.
 * @param keyRawStr - Key Raw String: The group key, as base64.
 *
 * @returns A promise that resolves with the decrypted name.
 *
 * @example
 * ```ts
 * decNamFun('Xk3...', 'u9F...', 'q2...') // => 'Dana Lee'
 * ```
 *
*/

const decNamFun = async ( groIdeStr : string, uidValStr : string, keyRawStr : string ) : Promise< string > => { // What: Decrypt Name Function. Why: A member's name is stored encrypted under the group key. How: This reads and decrypts it.


	const memDatObj = await reaDocFun( `groups/${ groIdeStr }/members/${ uidValStr }` ) as Record< string, Bytes >;                // What: Member Data Object. Why: The encrypted name is in the membership. How: This reads it. // What: Type Assertion Note. Why: The name and IV are stored as bytes. How: The as reads them as such.
	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( keyRawStr, 'base64' ), 'AES-GCM', false, [ 'decrypt' ] ); // What: Key Value Object. Why: Node decrypts with the page's key. How: This imports it.

	const decTexBuf = await crypto.subtle.decrypt( { iv : memDatObj.iv.toUint8Array() as Uint8Array< ArrayBuffer >, name : 'AES-GCM' }, keyValObj, memDatObj.displayNameEnc.toUint8Array() as Uint8Array< ArrayBuffer > ); // What: Decrypted Text Buffer. Why: The name opens with the group key alone. How: This decrypts it. // What: Type Assertion Note. Why: toUint8Array returns an array over a plain buffer. How: The two as read them as such.



	return new TextDecoder().decode( decTexBuf ); // What: Name Return. Why: The test compares the name. How: This decodes it.


};

// #endregion decNamFun



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
 * @param joiPagObj - Joiner Page Object: The joiner's page.
 *
 * @returns A promise that resolves with the group's ID, the token, and the
 *          joiner's UID.
 *
 * @example
 * ```ts
 * groSetFun(page, joiPagObj) // => { groIdeStr, tokValStr, uidJoiStr }
 * ```
 *
*/

const groSetFun = async ( ownPagObj : Page, joiPagObj : Page ) : Promise< { groIdeStr : string, tokValStr : string, uidJoiStr : string } > => { // What: Group Setup Function. Why: Every test starts from a group and a joiner. How: This creates the group and reads what the tests need.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string;           // What: Group Identifier String. Why: The group joined. How: This creates it as the owner. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const tokValStr = ( await reaDocFun( `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                                // What: Token Value String. Why: The joiner asks through the group's link. How: This reads the token the group names. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
	const uidJoiStr = ( await runPagFun( joiPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Joiner String. Why: The owner answers the joiner by UID. How: This makes sure the joiner's identity exists and reads its UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.



	return { groIdeStr, tokValStr, uidJoiStr }; // What: Setup Return. Why: The test uses all three. How: This returns them.


};

// #endregion groSetFun

// #endregion Helpers



// #region Module Init

const joiTesObj = test.extend< { joiPagObj : Page } >({ // What: Joins Test Object. Why: Each test needs a joiner with storage of their own, apart from the owner's page. How: This adds a page in a second browser context.


	joiPagObj : async ( { baseURL, browser }, useFixFun ) => { // What: Joiner Page Object. Why: A second context is a second device, with its own identity. How: This opens the app in a new context and closes it after the test.


		const cotValObj = await browser.newContext( { baseURL } ); // What: Context Value Object. Why: A context keeps its own IndexedDB and sign-in. How: This opens one on the dev server.
		const pagValObj = await cotValObj.newPage();               // What: Page Value Object. Why: The joiner's steps run here. How: This opens a page in it.


		await pagValObj.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.

		await useFixFun( pagValObj ); // What: Fixture Use Call. Why: The test runs with the page. How: This hands it over until the test ends.

		await cotValObj.close(); // What: Context Close Call. Why: The joiner's context shouldn't outlive its test. How: This closes it.


	}


});



joiTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	joiEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



joiTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await joiEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



joiTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



joiTesObj( 'a member approves a request filed through the invite, letting the joiner in with the group key and their name', async ( { joiPagObj, page } ) => { // What: Approval Test. Why: Every join waits for a member, who hands the joiner the group key (Section 17). How: This files a request as the joiner, approves it as the owner, and checks the membership, the key, the name, the count, and the request's end.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, joiPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.


	expect( await runPagFun( joiPagObj, joiModStr, 'invGetFun', tokValStr ) ).toEqual( { groIdeStr, groNamStr : 'Beach Day' } );  // What: Invite Read. Why: The joiner sees the group's name before asking. How: This expects the invite to name the group.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, '  Dana   Lee ', "Sam's cousin" ) ).toBe( groIdeStr ); // What: Request Filed. Why: The joiner asks with their name and a note. How: This expects the request filed in the group.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'pending' );                                  // What: Pending Status. Why: The joiner waits for an answer. How: This expects pending.



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


	const accDatObj = await reaDocFun( `accounts/${ uidJoiStr }` );                           // What: Account Data Object. Why: The group takes one of the joiner's slots. How: This reads their account.
	const groDatObj = await reaDocFun( `groups/${ groIdeStr }` );                             // What: Group Data Object. Why: The count includes the joiner. How: This reads the group.
	const keyJoiStr = await keyRawFun( joiPagObj, groIdeStr );                                // What: Key Joiner String. Why: The joiner opens their wrap with their own key alone. How: This loads the key in the joiner's page.
	const keyOwnStr = await keyRawFun( page, groIdeStr );                                     // What: Key Owner String. Why: The joiner's key has to be the group's key. How: This loads the owner's.
	const reqDatObj = await reaDocFun( `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ); // What: Request Data Object. Why: An answered request ends, and its plaintext name with it. How: This reads where it was.


	expect( await runPagFun( joiPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'member' ); // What: Member Status. Why: The joiner's app opens the group once they're in. How: This expects member.
	expect( keyJoiStr ).toBe( keyOwnStr );                                                      // What: Same Key. Why: The joiner reads the group with its own key. How: This expects the two keys to match.
	expect( await decNamFun( groIdeStr, uidJoiStr, keyJoiStr ) ).toBe( 'Dana Lee' );            // What: Name Decrypted. Why: The joiner's name is stored encrypted under the group key. How: This expects the requested name back.
	expect( groDatObj ).toMatchObject( { countedUid : uidJoiStr, memberCount : 2 } );           // What: Count Raised. Why: The group counts its new member. How: This expects 2, naming the joiner.
	expect( accDatObj?.memberGroups ).toEqual( { [ groIdeStr ] : true } );                      // What: Member Slot. Why: The group counts against the joiner's caps. How: This expects it in their member map.
	expect( reqDatObj ).toBeUndefined();                                                        // What: Request Ended. Why: The approval answers it. How: This expects it gone.

	expect( await runPagFun( page, joiModStr, 'reqAppFun', groIdeStr, uidJoiStr ) ).toBe( 'error:Error' ); // What: Second Approval Refused. Why: An answered request can't let someone in twice. How: This expects the approval rejected.


} );



joiTesObj( 'a request is checked before it is sent, leaves out an empty note, and can be withdrawn', async ( { joiPagObj, page } ) => { // What: Request Test. Why: A bad name, note, or link fails before anything is written, and a joiner may take a request back (Section 17). How: This tries bad links and text, then files a request and withdraws it.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, joiPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.


	expect( await runPagFun( joiPagObj, joiModStr, 'invGetFun', 'groups/x' ) ).toBeNull();                                           // What: Bad Token Form. Why: A token can't name another path. How: This expects null without a read.
	expect( await runPagFun( joiPagObj, joiModStr, 'invGetFun', 'A'.repeat( 22 ) ) ).toBeNull();                                     // What: Missing Invite. Why: A rotated link opens nothing. How: This expects null.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', 'A'.repeat( 22 ), 'Dana', '' ) ).toBe( 'error:Error' );              // What: Dead Link Refused. Why: A request needs a working invite. How: This expects an Error.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana 2', '' ) ).toBe( 'error:RangeError' );              // What: Bad Name Refused. Why: A name is letters, so a number fails. How: This expects a RangeError.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '🎉' ) ).toBe( 'error:RangeError' );               // What: Emoji Note Refused. Why: A note allows no emoji. How: This expects a RangeError.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', 'a'.repeat( 151 ) ) ).toBe( 'error:RangeError' ); // What: Long Note Refused. Why: A note has at most 150 characters. How: This expects a RangeError.
	expect( await reaDocFun( `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ) ).toBeUndefined();                                // What: Nothing Filed. Why: A refused request writes nothing. How: This expects no request.

	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '  ' ) ).toBe( groIdeStr ); // What: Request Filed. Why: A blank note is no note. How: This expects the request filed.


	const reqDatObj = await reaDocFun( `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ); // What: Request Data Object. Why: An empty note is left out. How: This reads the request.


	expect( reqDatObj ).toMatchObject( { inviteToken : tokValStr, nameText : 'Dana' } ); // What: Request Fields. Why: The request names the token and the name. How: This expects both.
	expect( reqDatObj ).not.toHaveProperty( 'noteText' );                                // What: Note Left Out. Why: The rules allow no empty note field to ride along. How: This expects no note.

	expect( await runPagFun( joiPagObj, joiModStr, 'reqWitFun', groIdeStr ) ).toBeUndefined(); // What: Withdraw Call. Why: The joiner takes the request back. How: This expects it to succeed.

	expect( await runPagFun( joiPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' ); // What: Ended Status. Why: A withdrawn request is over. How: This expects ended.


} );



joiTesObj( 'a decline ends a request, and a block also keeps its sender from asking again', async ( { joiPagObj, page } ) => { // What: Decline Test. Why: Any member may decline a request, or decline and block its sender (Section 17). How: This declines one request, then blocks a second, and tries a third.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, joiPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.


	await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '' ); // What: First Request. Why: There has to be a request to decline. How: This files one.

	expect( await runPagFun( page, joiModStr, 'reqDecFun', groIdeStr, uidJoiStr ) ).toBeUndefined();         // What: Decline Call. Why: The owner turns the request down. How: This expects it to succeed.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' );               // What: Declined Status. Why: A declined request is over. How: This expects ended.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '' ) ).toBe( groIdeStr ); // What: Second Request. Why: A plain decline doesn't block. How: This expects a new request filed.

	expect( await runPagFun( page, joiModStr, 'reqBloFun', groIdeStr, uidJoiStr ) ).toBeUndefined(); // What: Block Call. Why: The owner blocks the sender. How: This expects it to succeed.


	const groDatObj = await reaDocFun( `groups/${ groIdeStr }` ); // What: Group Data Object. Why: The block lands in the group's blocklist. How: This reads the group.


	expect( groDatObj?.removedUids ).toEqual( { [ uidJoiStr ] : true } );                                                    // What: Blocklist Entry. Why: The sender can't redeem any of the group's links. How: This expects their UID listed.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' );                               // What: Blocked Status. Why: A blocked request is over. How: This expects ended.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqCreFun', tokValStr, 'Dana', '' ) ).toBe( 'error:permission-denied' ); // What: Third Request Refused. Why: A blocked identity can't ask again. How: This expects the rules to refuse it.


} );



joiTesObj( 'an expired request is left out of the review, no longer waits, and cannot be approved', async ( { joiPagObj, page } ) => { // What: Expiry Test. Why: A request past its 7 days is over, though its TTL deletion can run a day late. How: This seeds an expired request, then lists, checks, and approves it.


	const { groIdeStr, tokValStr, uidJoiStr } = await groSetFun( page, joiPagObj ); // What: Setup Values. Why: The test needs a group and a joiner. How: This sets them up.

	const joiModStr = '/src/state/joins.ts'; // What: Joins Module String. Why: Every join step is in the joins module. How: This names its path.



	await joiEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Expired Seed Call. Why: The rules refuse filing an expired request. How: This writes one with the rules off.


		await setDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ), { // What: Request Set Call. Why: The joiner's request, a minute past its expiry. How: This writes it.


			expireAt    : Timestamp.fromMillis( Date.now() - 60000 ),
			inviteToken : tokValStr,
			nameText    : 'Dana',
			requestedAt : Timestamp.fromMillis( Date.now() - 7 * 86400000 )


		} );


	} );


	expect( await runPagFun( page, joiModStr, 'reqLisFun', groIdeStr ) ).toEqual( [] );                    // What: Left Out. Why: An expired request isn't reviewed. How: This expects an empty list.
	expect( await runPagFun( joiPagObj, joiModStr, 'reqStaFun', groIdeStr ) ).toBe( 'ended' );             // What: Expired Status. Why: An expired request no longer waits. How: This expects ended.
	expect( await runPagFun( page, joiModStr, 'reqAppFun', groIdeStr, uidJoiStr ) ).toBe( 'error:Error' ); // What: Approval Refused. Why: An expired request can't let anyone in. How: This expects the approval rejected.
	expect( await reaDocFun( `groups/${ groIdeStr }/members/${ uidJoiStr }` ) ).toBeUndefined();           // What: No Membership. Why: The refused approval wrote nothing. How: This expects no member document.


} );

// #endregion Module Init


