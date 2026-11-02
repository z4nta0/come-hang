


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when sharing behaved as it should. How: This asserts on what the pages and the emulator return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read past the rules. How: This connects to the emulator.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs in the page. How: This calls the app's functions there.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read goes through one. How: This types it.

// #endregion Imports



/**
 * sharing.spec.ts = Sharing Spec
 *
 * @summary
 * Checks the sharing session and status posts in a real browser, in each
 * engine, against the Emulator Suite, running the app's own modules in the
 * page: a status post's text is read back by its kind, and a typed message
 * can't pass for one; ending a group's sharing deletes the share and forgets
 * the record, while ending another group's leaves it; and sharing ends by
 * itself when its event ends.
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

const SHA_MOD_STR = '/src/state/sharing.ts'; // What: Sharing Module String. Why: The session runs there. How: This names its path.

// #endregion Constants



// #region Module State

let shaEnvObj : RulesTestEnvironment; // What: Sharing Environment Object. Why: Every read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region shaSetFun

/**
 * shaSetFun = Sharing Setup Function
 *
 * @summary
 * Sets up a page to share: creates a group as Alice, plans a picnic that
 * started an hour ago and ends the given milliseconds from now, and grants
 * the page a position. Resolves with the group's and event's IDs and the
 * member's UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The page that shares.
 * @param endOffNum - End Offset Number: How long until the event ends, in
 *                    milliseconds.
 *
 * @returns A promise that resolves with the IDs and the event's end.
 *
 * @example
 * ```ts
 * shaSetFun(page, 3600000) // => { eveIdeStr, groIdeStr, ... }
 * ```
 *
*/

const shaSetFun = async ( pagValObj : Page, endOffNum : number ) : Promise< { endTimNum : number, eveIdeStr : string, groIdeStr : string, uidValStr : string } > => { // What: Sharing Setup Function. Why: Every test shares for an event under way. How: This creates the group and event and grants a position.


	const endTimNum = Date.now() + endOffNum;                                                                                                                                                               // What: End Time Number. Why: The event's end bounds the share. How: This sets it the given time from now.
	const groIdeStr = await runPagFun( pagValObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string;                                                                                    // What: Group Identifier String. Why: The share belongs to a group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const eveIdeStr = await runPagFun( pagValObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum, locTexStr : '', staTimNum : Date.now() - 3600000, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: The share belongs to an event under way. How: This plans one that started an hour ago. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.
	const uidValStr = ( await runPagFun( pagValObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr;                                                                          // What: UID Value String. Why: The share is read by the member's UID. How: This reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await pagValObj.context().grantPermissions( [ 'geolocation' ] ); // What: Permission Call. Why: Sharing needs the position. How: This grants it.

	await pagValObj.context().setGeolocation( { accuracy : 10, latitude : 51.5, longitude : -0.12 } ); // What: Position Call. Why: The device reports a fix. How: This sets it.



	return { endTimNum, eveIdeStr, groIdeStr, uidValStr }; // What: Setup Return. Why: The test shares for the event and reads the share. How: This returns the IDs and the end.


};

// #endregion shaSetFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	shaEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read reaches the emulator through it. How: This connects to Firestore, where the shares are.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The shares are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await shaEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



test( "a status post's text reads back by its kind, and a typed message can't pass for one", async ( { page } ) => { // What: Status Text Test. Why: A status post is told from a typed message only by its control character prefix (Section 11.7). How: This builds each kind, reads them and others back, and sends a typed message with the prefix.


	const { groIdeStr } = await shaSetFun( page, 3600000 ); // What: Group Identifier String. Why: A typed message needs a group to be refused in. How: This sets one up.


	expect( await runPagFun( page, '/src/core/chat-status.ts', 'staTexFun', 'way' ) ).toBe( '\u0001way' );       // What: Way Text Assertion. Why: Leaving is sent as the prefix and its kind. How: This builds it.
	expect( await runPagFun( page, '/src/core/chat-status.ts', 'staKinFun', '\u0001arr' ) ).toBe( 'arr' );       // What: Arrive Kind Assertion. Why: An arrival reads back as its kind. How: This reads it.
	expect( await runPagFun( page, '/src/core/chat-status.ts', 'staKinFun', '\u0001lat' ) ).toBe( 'unk' );       // What: Unknown Kind Assertion. Why: A kind from a later version still reads as a status. How: This reads one this version doesn't know.
	expect( await runPagFun( page, '/src/core/chat-status.ts', 'staKinFun', 'way' ) ).toBeNull();                // What: Typed Kind Assertion. Why: A typed message is no status post, whatever it says. How: This reads one with no prefix.
	expect( await runPagFun( page, '/src/state/chat.ts', 'chaSenFun', groIdeStr, '\u0001way' ) ).toBe( 'error:RangeError' ); // What: Typed Prefix Refused. Why: A typed message can't hold the control character that marks a status post. How: This expects the send refused before anything is sent.


} );



test( "ending a group's sharing deletes the share and forgets the record, while another group's is left", async ( { page } ) => { // What: End Test. Why: Sharing stops with a group the member leaves or loses (Section 5). How: This shares, ends another group's sharing, then the group's own, checking the share, the record, and what's kept on the device.


	const { endTimNum, eveIdeStr, groIdeStr, uidValStr } = await shaSetFun( page, 3600000 ); // What: Setup Values. Why: The test shares for an event. How: This sets them up.


	await runPagFun( page, SHA_MOD_STR, 'shaStaFun', groIdeStr, eveIdeStr, endTimNum ); // What: Start Call. Why: The member shares. How: This starts the session.

	await runPagFun( page, SHA_MOD_STR, 'shaEndFun', 'otherGroup' ); // What: Other End Call. Why: Another group's end mustn't touch this sharing. How: This ends a group the record isn't for.

	expect( await runPagFun( page, SHA_MOD_STR, 'shaGetFun' ) ).toMatchObject( { groIdeStr, shaBoo : true } );                       // What: Record Kept Assertion. Why: Sharing goes on. How: This expects the record still sharing.
	expect( await docReaFun( shaEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ) ).toBeDefined();                        // What: Share Kept Assertion. Why: The share stays. How: This expects it there.
	expect( await page.evaluate( () => localStorage.getItem( 'come-hang-sharing' ) ) ).toContain( groIdeStr );                         // What: Kept Record Assertion. Why: A reload would resume it. How: This expects the record on the device.

	await runPagFun( page, SHA_MOD_STR, 'shaEndFun', groIdeStr ); // What: End Call. Why: The group is gone to the member. How: This ends its sharing.

	expect( await runPagFun( page, SHA_MOD_STR, 'shaGetFun' ) ).toBeNull();                                         // What: Record Gone Assertion. Why: The record is over. How: This expects none.
	expect( await docReaFun( shaEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ) ).toBeUndefined();      // What: Share Deleted Assertion. Why: The group stops seeing the member at once. How: This expects no share.
	expect( await page.evaluate( () => localStorage.getItem( 'come-hang-sharing' ) ) ).toBeNull();                   // What: Forgotten Assertion. Why: A reload mustn't bring it back. How: This expects nothing kept.


} );



test( 'sharing ends by itself when its event ends', async ( { page } ) => { // What: Event End Test. Why: Sharing always ends with its event (Section 5). How: This shares for an event ending in a few seconds, then waits for the record and the share to go.


	const { endTimNum, eveIdeStr, groIdeStr, uidValStr } = await shaSetFun( page, 6000 ); // What: Setup Values. Why: The event ends in 6 seconds. How: This sets them up.


	await runPagFun( page, SHA_MOD_STR, 'shaStaFun', groIdeStr, eveIdeStr, endTimNum ); // What: Start Call. Why: The member shares. How: This starts the session.

	expect( await docReaFun( shaEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ) ).toBeDefined(); // What: Shared Assertion. Why: The share exists before the end. How: This expects it there.

	await expect.poll( () => runPagFun( page, SHA_MOD_STR, 'shaGetFun' ), { timeout : 15000 } ).toBeNull();                                     // What: Record Ended Assertion. Why: The record ends with its event. How: This waits for it to go.
	await expect.poll( () => docReaFun( shaEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ), { timeout : 15000 } ).toBeUndefined(); // What: Share Ended Assertion. Why: The share goes at once rather than waiting for its expiry. How: This waits for it to go.


} );

// #endregion Module Init


