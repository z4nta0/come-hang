


// #region Imports

import { Bytes                     } from 'firebase/firestore';           // What: Bytes. Why: Seeded details are stored as Firestore bytes. How: This wraps them.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Events are seeded by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the events and items changed as they should. How: This asserts on what the pages and the emulator return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { keyRawFun                 } from '../support/client.ts';         // What: Key Raw Function. Why: Seeded details are encrypted with the group key. How: This exports a page's key.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Every test starts from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Events with unusual details are seeded. How: This writes them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Seeded events need their times, and deletion times are read back. How: This builds and reads them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * events.spec.ts = Events Spec
 *
 * @summary
 * Checks a group's events and their bring-lists in a real browser, in each
 * engine, against the Emulator Suite with the real security rules. Each
 * test starts from a group with two identities, the page's own as its owner
 * and a member in a second browser context, and runs the app's own modules
 * in each page: planning, listing, changing, and cancelling events, and
 * adding, claiming, reassigning, relabeling, and removing items. The tests
 * read back what was written, and seed events with details no app would
 * write, encrypted outside the browser.
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

const DAY_MIL_NUM = 86400000;               // What: Day Milliseconds Number. Why: Event times are set in days. How: This is one day in milliseconds.
const EVE_MOD_STR = '/src/state/events.ts'; // What: Events Module String. Why: Events are planned and changed there. How: This names its path.
const ITE_MOD_STR = '/src/state/items.ts';  // What: Items Module String. Why: Items are added and claimed there. How: This names its path.

// #endregion Constants



// #region Module State

let eveEnvObj : RulesTestEnvironment; // What: Events Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region eveSeeFun

/**
 * eveSeeFun = Event Seed Function
 *
 * @summary
 * Writes an event with the rules off, its details bundle encrypted in Node
 * under a group key a page reported, so a test can store details the app
 * would never write, and times of its own choosing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The event's path.
 * @param keyRawStr - Key Raw String: The group key, as base64.
 * @param detTexStr - Details Text String: The bundle's plaintext.
 * @param staTimNum - Start Time Number: The start, in milliseconds.
 * @param expTimNum - Expire Time Number: The deletion time, in milliseconds.
 *
 * @returns A promise that settles once the event is written, with no value.
 *
 * @example
 * ```ts
 * eveSeeFun('groups/Xk3.../events/a', 'q2...', 'x', 0, 1) // => Promise<void>
 * ```
 *
*/

const eveSeeFun = async ( patValStr : string, keyRawStr : string, detTexStr : string, staTimNum : number, expTimNum : number ) : Promise< void > => { // What: Event Seed Function. Why: Untrusted and out-of-order events can't be made through the app. How: This encrypts the bundle in Node and writes the event with the rules off.


	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( keyRawStr, 'base64' ), 'AES-GCM', false, [ 'encrypt' ] );           // What: Key Value Object. Why: The bundle is encrypted with the group's key. How: This imports it.
	const iniVecArr = crypto.getRandomValues( new Uint8Array( 12 ) );                                                                        // What: Initialization Vector Array. Why: Each encryption takes a fresh IV. How: This draws one.
	const cipTexBuf = await crypto.subtle.encrypt( { iv : iniVecArr, name : 'AES-GCM' }, keyValObj, new TextEncoder().encode( detTexStr ) ); // What: Cipher Text Buffer. Why: The bundle is stored encrypted. How: This encrypts it.



	await eveEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Call. Why: The rules check only what the app writes. How: This writes the event with them off.


		await setDoc( doc( cotAdmObj.firestore(), patValStr ), { // What: Event Set Call. Why: The seeded event. How: This writes every field an event has.


			createdByUid : 'seed',
			detailsEnc   : Bytes.fromUint8Array( new Uint8Array( cipTexBuf ) ),
			endAt        : Timestamp.fromMillis( staTimNum + 3600000 ),
			expireAt     : Timestamp.fromMillis( expTimNum ),
			iv           : Bytes.fromUint8Array( iniVecArr ),
			startAt      : Timestamp.fromMillis( staTimNum )


		} );


	} );


};

// #endregion eveSeeFun



// #region iteSeeFun

/**
 * iteSeeFun = Item Seed Function
 *
 * @summary
 * Writes two open items with the rules off under an event's collection: aaa,
 * labeled Zucchini, encrypted in Node under a group key a page reported,
 * and aab, whose label is zeroed bytes that won't decrypt, both with the
 * deletion time given.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param colPatStr - Collection Path String: The event's items' path.
 * @param keyRawStr - Key Raw String: The group key, as base64.
 * @param expTimNum - Expire Time Number: The deletion time, in milliseconds.
 *
 * @returns A promise that settles once both are written, with no value.
 *
 * @example
 * ```ts
 * iteSeeFun('groups/Xk3.../events/Ev7.../assignments', 'q2...', 1)
 * // => Promise<void>
 * ```
 *
*/

const iteSeeFun = async ( colPatStr : string, keyRawStr : string, expTimNum : number ) : Promise< void > => { // What: Item Seed Function. Why: Item order and a bad label can't be set up through the app. How: This encrypts one label in Node and writes both items with the rules off.


	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( keyRawStr, 'base64' ), 'AES-GCM', false, [ 'encrypt' ] );            // What: Key Value Object. Why: The label is encrypted with the group's key. How: This imports it.
	const iniVecArr = crypto.getRandomValues( new Uint8Array( 12 ) );                                                                         // What: Initialization Vector Array. Why: Each encryption takes a fresh IV. How: This draws one.
	const cipTexBuf = await crypto.subtle.encrypt( { iv : iniVecArr, name : 'AES-GCM' }, keyValObj, new TextEncoder().encode( 'Zucchini' ) ); // What: Cipher Text Buffer. Why: The label is stored encrypted. How: This encrypts it.



	await eveEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Call. Why: The seeds skip the app. How: This writes both items with the rules off.


		await setDoc( doc( cotAdmObj.firestore(), `${ colPatStr }/aaa` ), { // What: Zucchini Set Call. Why: The item whose ID sorts first and label last. How: This writes it.


			assignedUid : null,
			expireAt    : Timestamp.fromMillis( expTimNum ),
			iv          : Bytes.fromUint8Array( iniVecArr ),
			labelEnc    : Bytes.fromUint8Array( new Uint8Array( cipTexBuf ) )


		} );

		await setDoc( doc( cotAdmObj.firestore(), `${ colPatStr }/aab` ), { // What: Garbled Set Call. Why: An item whose label won't decrypt. How: This writes zeroed bytes.


			assignedUid : null,
			expireAt    : Timestamp.fromMillis( expTimNum ),
			iv          : Bytes.fromUint8Array( new Uint8Array( 12 ) ),
			labelEnc    : Bytes.fromUint8Array( new Uint8Array( 32 ) )


		} );


	} );


};

// #endregion iteSeeFun

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	eveEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await eveEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a member plans an event every member reads, which its creator or the owner can change', async ( { page, secPagObj } ) => { // What: Plan Test. Why: Any member plans an event, encrypted, and only its creator or the owner changes it (Section 11.5). How: This plans an event as the member, lists it as the owner, changes it as both, and tries a member's change to the owner's event, checking the tidied details, the deletion time, and the refusal.


	const { groIdeStr, uidMemStr } = await memSetFun( eveEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const staTimNum = Date.now() + DAY_MIL_NUM; // What: Start Time Number. Why: The event starts tomorrow. How: This is a day from now.
	const endTimNum = staTimNum + 3600000;      // What: End Time Number. Why: The event lasts an hour. How: This is an hour after the start.

	const eveIdeStr = await runPagFun( secPagObj, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '  Bring   chairs \n\n\n\n  and  shade ', endTimNum, locTexStr : ' Lake  Park ', staTimNum, titTexStr : ' Beach  Day 🏖️ ' } ) as string; // What: Event Identifier String. Why: The member plans the event, with untidy text. How: This creates it. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.


	expect( await runPagFun( page, EVE_MOD_STR, 'eveLisFun', groIdeStr ) ).toEqual( [ { creUidStr : uidMemStr, desTexStr : 'Bring chairs\n\nand shade', endTimNum, eveIdeStr, locTexStr : 'Lake Park', staTimNum, titTexStr : 'Beach Day 🏖️' } ] ); // What: Event Listed. Why: Every member reads the tidied details with the group key. How: This expects the one event as the owner reads it.
	expect( ( ( await docReaFun( eveEnvObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` ) )?.expireAt as Timestamp ).toMillis() ).toBe( endTimNum + 2 * DAY_MIL_NUM );                                                                            // What: Deletion Time. Why: An event is deleted 48 hours after it ends (Section 5). How: This expects exactly that.
	expect( await runPagFun( page, EVE_MOD_STR, 'eveUpdFun', groIdeStr, eveIdeStr, { desTexStr : '', endTimNum, locTexStr : '', staTimNum, titTexStr : 'Beach Week' } ) ).toBeUndefined();                                                          // What: Owner Change. Why: The owner manages every event. How: This expects the owner's change to succeed.
	expect( await runPagFun( secPagObj, EVE_MOD_STR, 'eveUpdFun', groIdeStr, eveIdeStr, { desTexStr : '', endTimNum, locTexStr : '', staTimNum, titTexStr : 'Beach Trip' } ) ).toBeUndefined();                                                     // What: Creator Change. Why: The creator manages their event. How: This expects the member's change to succeed.
	expect( await runPagFun( secPagObj, EVE_MOD_STR, 'eveLisFun', groIdeStr ) ).toMatchObject( [ { creUidStr : uidMemStr, desTexStr : '', titTexStr : 'Beach Trip' } ] );                                                                           // What: Changes Kept. Why: The last change wins, and the creator stays. How: This expects the member's title and the original creator.


	const ownEveStr = await runPagFun( page, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum, locTexStr : '', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Owner Event String. Why: A member can't change an event they didn't plan. How: This plans one as the owner. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.


	expect( await runPagFun( secPagObj, EVE_MOD_STR, 'eveUpdFun', groIdeStr, ownEveStr, { desTexStr : '', endTimNum, locTexStr : '', staTimNum, titTexStr : 'Mine' } ) ).toBe( 'error:permission-denied' ); // What: Member Change Refused. Why: Only the creator or owner changes an event. How: This expects the rules to refuse it.


} );



pagTesObj( "an event's text and times outside their limits are refused before anything is written", async ( { page, secPagObj } ) => { // What: Limits Test. Why: The rules can't read encrypted text, so the app holds it to Section 11.10, and refuses times the rules would. How: This tries each bad field and time, then expects no event.


	const { groIdeStr } = await memSetFun( eveEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group. How: This sets one up.

	const staTimNum = Date.now() + DAY_MIL_NUM; // What: Start Time Number. Why: A valid start to vary from. How: This is a day from now.

	const basInpObj = { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : '', staTimNum, titTexStr : 'Picnic' }; // What: Base Input Object. Why: Each try changes one field of a valid event. How: This holds the valid one.

	const badInpArr = [ // What: Bad Input Array. Why: Each entry breaks one limit. How: This lists the variations.


		{ ...basInpObj, titTexStr : '' },                                                                                  // What: Empty Title. Why: A title has at least 1 character. How: This blanks it.
		{ ...basInpObj, titTexStr : 'a'.repeat( 51 ) },                                                                    // What: Long Title. Why: A title has at most 50 characters. How: This uses 51.
		{ ...basInpObj, desTexStr : 'a'.repeat( 501 ) },                                                                   // What: Long Description. Why: A description has at most 500 characters. How: This uses 501.
		{ ...basInpObj, desTexStr : 'Bring <chairs>' },                                                                    // What: Bad Description. Why: Angle brackets aren't in the title's set. How: This uses them.
		{ ...basInpObj, locTexStr : 'a'.repeat( 151 ) },                                                                   // What: Long Location. Why: A location has at most 150 characters. How: This uses 151.
		{ ...basInpObj, locTexStr : 'Lake <Park>' },                                                                       // What: Bad Location. Why: The location keeps to the title's set. How: This uses angle brackets.
		{ ...basInpObj, endTimNum : staTimNum },                                                                           // What: Zero Length. Why: An event ends after it starts. How: This ends it at its start.
		{ ...basInpObj, endTimNum : staTimNum + 7 * DAY_MIL_NUM + 1 },                                                     // What: Long Event. Why: An event lasts at most 7 days. How: This lasts a moment more.
		{ ...basInpObj, endTimNum : Date.now() - 60000, staTimNum : Date.now() - 3600000 },                                // What: Ended Event. Why: An event that's over isn't planned. How: This ends a minute ago.
		{ ...basInpObj, endTimNum : Date.now() + 366 * DAY_MIL_NUM + 3600000, staTimNum : Date.now() + 366 * DAY_MIL_NUM } // What: Far Event. Why: An event starts at most a year ahead. How: This starts in 366 days.


	];



	for ( const badInpObj of badInpArr ) expect( await runPagFun( page, EVE_MOD_STR, 'eveCreFun', groIdeStr, badInpObj ) ).toBe( 'error:RangeError' ); // What: Bad Inputs Refused. Why: Each breaks a limit. How: This expects a RangeError for every one.



	expect( await runPagFun( page, EVE_MOD_STR, 'eveLisFun', groIdeStr ) ).toEqual( [] ); // What: Nothing Written. Why: A refused event writes nothing. How: This expects no events.


} );



pagTesObj( 'a bring-list item is claimed once, reassigned, relabeled, and follows its event', async ( { page, secPagObj } ) => { // What: Items Test. Why: A claim is a compare-and-swap, any member reassigns, and an item goes when its event does (Sections 7 and 11.5). How: This adds and claims items, tries a second claim, reassigns, relabels, moves the event's end, removes one, and relists with seeded items, checking each change and the list's order.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( eveEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const staTimNum = Date.now() + DAY_MIL_NUM; // What: Start Time Number. Why: The event starts tomorrow. How: This is a day from now.

	const eveIdeStr = await runPagFun( page, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : '', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: Items belong to an event. How: This plans one as the owner. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.
	const desIteStr = await runPagFun( secPagObj, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Dessert', null ) as string;                                                                      // What: Dessert Item String. Why: An open item to claim. How: This adds it as the member. // What: Type Assertion Note. Why: iteAddFun resolves with the ID. How: The as reads it as a string.
	const chiIteStr = await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Chips', uidMemStr ) as string;                                                                        // What: Chips Item String. Why: An item can start assigned. How: This adds it as the owner, for the member. // What: Type Assertion Note. Why: iteAddFun resolves with the ID. How: The as reads it as a string.


	expect( await runPagFun( secPagObj, ITE_MOD_STR, 'iteClaFun', groIdeStr, eveIdeStr, desIteStr ) ).toBeUndefined();                                                                                       // What: Claim Call. Why: The member takes the dessert. How: This expects the claim to succeed.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteClaFun', groIdeStr, eveIdeStr, desIteStr ) ).toBe( 'error:Error' );                                                                                      // What: Second Claim Refused. Why: Someone already claimed it (Section 7). How: This expects an Error.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteAsgFun', groIdeStr, eveIdeStr, desIteStr, uidOwnStr ) ).toBeUndefined();                                                                                 // What: Reassign Call. Why: Any member reassigns anyone's claim. How: This expects the owner to take it over.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteAsgFun', groIdeStr, eveIdeStr, desIteStr, 'nobody' ) ).toBe( 'error:permission-denied' );                                                                // What: Stranger Refused. Why: Only a member is assigned. How: This expects the rules to refuse it.
	expect( await runPagFun( secPagObj, ITE_MOD_STR, 'iteRenFun', groIdeStr, eveIdeStr, desIteStr, ' Apple   pie ' ) ).toBeUndefined();                                                                      // What: Relabel Call. Why: Any member relabels an item. How: This expects the tidied relabel to succeed.
	expect( await runPagFun( secPagObj, ITE_MOD_STR, 'iteRenFun', groIdeStr, eveIdeStr, desIteStr, '' ) ).toBe( 'error:RangeError' );                                                                        // What: Empty Label Refused. Why: A label has at least 1 character. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, ITE_MOD_STR, 'iteLisFun', groIdeStr, eveIdeStr ) ).toEqual( [ { asgUidStr : uidOwnStr, iteIdeStr : desIteStr, labTexStr : 'Apple pie' }, { asgUidStr : uidMemStr, iteIdeStr : chiIteStr, labTexStr : 'Chips' } ] ); // What: Items Listed. Why: The relabel kept the claim, and items list by label. How: This expects both items in label order.
	expect( await runPagFun( secPagObj, ITE_MOD_STR, 'iteAsgFun', groIdeStr, eveIdeStr, desIteStr, null ) ).toBeUndefined();                                                                                 // What: Release Call. Why: Any member releases a claim. How: This expects the item opened.
	expect( await runPagFun( page, EVE_MOD_STR, 'eveUpdFun', groIdeStr, eveIdeStr, { desTexStr : '', endTimNum : staTimNum + 7200000, locTexStr : '', staTimNum, titTexStr : 'Picnic' } ) ).toBeUndefined(); // What: End Moved. Why: The items' deletion time follows the event's. How: This makes the event an hour longer.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteDelFun', groIdeStr, eveIdeStr, chiIteStr ) ).toBeUndefined();                                                                                            // What: Remove Call. Why: Any member removes an item. How: This expects the chips gone.


	const desDatObj = await docReaFun( eveEnvObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments/${ desIteStr }` ); // What: Dessert Data Object. Why: The released item's fields are checked. How: This reads it.


	expect( desDatObj?.assignedUid ).toBeNull();                                                                                          // What: Released. Why: A released item is open. How: This expects no assignee.
	expect( ( desDatObj?.expireAt as Timestamp ).toMillis() ).toBe( staTimNum + 7200000 + 2 * DAY_MIL_NUM );                              // What: Deletion Time Moved. Why: An item goes when its event does. How: This expects the new end plus 48 hours.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteClaFun', groIdeStr, eveIdeStr, chiIteStr ) ).toBe( 'error:invalid-argument' );        // What: Gone Claim Refused. Why: A removed item can't be claimed. How: This expects Firestore's refusal of the update.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'a'.repeat( 51 ), null ) ).toBe( 'error:RangeError' ); // What: Long Label Refused. Why: A label has at most 50 characters. How: This expects a RangeError.



	await iteSeeFun( `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments`, await keyRawFun( page, groIdeStr ), staTimNum + 7200000 + 2 * DAY_MIL_NUM ); // What: Item Seed Call. Why: Items list by label whatever the emulator's ID order, and a label that won't decrypt comes back empty. How: This seeds Zucchini under the first ID and a garbled label under the second.


	expect( await runPagFun( page, ITE_MOD_STR, 'iteLisFun', groIdeStr, eveIdeStr ) ).toMatchObject( [ { iteIdeStr : 'aab', labTexStr : '' }, { labTexStr : 'Apple pie' }, { iteIdeStr : 'aaa', labTexStr : 'Zucchini' } ] ); // What: Items Relisted. Why: The chips are gone, the garbled label reads empty, and the list keeps label order. How: This expects the three items by label.


} );



pagTesObj( "a watched bring-list follows each item's addition, claim, and removal, until the watch stops", async ( { page, secPagObj } ) => { // What: Item Watch Test. Why: A claim or a new item shows to every member at once. How: This watches as the member while the owner adds, claims, and removes items, then stops the watch and checks a later item never reaches it.


	const { groIdeStr, uidOwnStr } = await memSetFun( eveEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const staTimNum = Date.now() + DAY_MIL_NUM; // What: Start Time Number. Why: The event starts tomorrow. How: This is a day from now.

	const eveIdeStr = await runPagFun( page, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : '', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: Items belong to an event. How: This plans one as the owner. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.


	await secPagObj.evaluate( async ( [ modPatStr, watGroStr, watEveStr ] ) => { // What: Watch Call. Why: The member's page watches the list the owner changes. How: This starts the watch and keeps the latest report and its stop on the page's global object.


		const iteModObj = await import( /* @vite-ignore */ modPatStr ); // What: Items Module Object. Why: The page runs the real module. How: This imports it.



		Reflect.set( globalThis, 'iteStoFun', iteModObj.iteWatFun( watGroStr, watEveStr, ( iteRecArr : unknown ) => Reflect.set( globalThis, 'iteLisArr', iteRecArr ) ) ); // What: Watch Start Call. Why: Each check reads the latest report, and the test stops the watch later. How: This starts it, keeping each report and the stop.


	}, [ ITE_MOD_STR, groIdeStr, eveIdeStr ] );



	const repGetFun = () => secPagObj.evaluate( () => Reflect.get( globalThis, 'iteLisArr' ) ); // What: Report Get Function. Why: Each check polls the latest report. How: This reads it from the page.


	await expect.poll( repGetFun ).toEqual( [] ); // What: Empty List Assertion. Why: A new event has nothing on its list. How: This waits for the first, empty report.


	const pieIteStr = await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Pie', null ) as string;   // What: Pie Item String. Why: An addition shows at once. How: This adds an open item as the owner. // What: Type Assertion Note. Why: iteAddFun resolves with the ID. How: The as reads it as a string.
	const bunIteStr = await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Buns', null ) as string;  // What: Buns Item String. Why: A second item checks the order. How: This adds it as the owner. // What: Type Assertion Note. Why: iteAddFun resolves with the ID. How: The as reads it as a string.


	await expect.poll( repGetFun ).toEqual( [ { asgUidStr : null, iteIdeStr : bunIteStr, labTexStr : 'Buns' }, { asgUidStr : null, iteIdeStr : pieIteStr, labTexStr : 'Pie' } ] ); // What: Added List Assertion. Why: Both items show, open, in label order. How: This waits for the report with both.


	await runPagFun( page, ITE_MOD_STR, 'iteClaFun', groIdeStr, eveIdeStr, pieIteStr ); // What: Claim Call. Why: A claim shows at once. How: This claims the pie as the owner.


	await expect.poll( repGetFun ).toEqual( [ { asgUidStr : null, iteIdeStr : bunIteStr, labTexStr : 'Buns' }, { asgUidStr : uidOwnStr, iteIdeStr : pieIteStr, labTexStr : 'Pie' } ] ); // What: Claimed List Assertion. Why: The pie now names the owner. How: This waits for the report with the claim.


	await runPagFun( page, ITE_MOD_STR, 'iteDelFun', groIdeStr, eveIdeStr, bunIteStr ); // What: Remove Call. Why: A removal shows at once. How: This removes the buns as the owner.


	await expect.poll( repGetFun ).toEqual( [ { asgUidStr : uidOwnStr, iteIdeStr : pieIteStr, labTexStr : 'Pie' } ] ); // What: Removed List Assertion. Why: The buns drop out. How: This waits for the report with the pie alone.


	await secPagObj.evaluate( () => ( Reflect.get( globalThis, 'iteStoFun' ) as () => void )() ); // What: Watch Stop Call. Why: A closed bring-list stops listening. How: This calls the watch's stop. // What: Type Assertion Note. Why: The page's global holds the stop the watch returned. How: The as reads it as a function.

	await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Salad', null ); // What: Late Item Call. Why: A stopped watch hears nothing more. How: This adds an item after the stop.


	expect( await runPagFun( secPagObj, ITE_MOD_STR, 'iteLisFun', groIdeStr, eveIdeStr ) ).toHaveLength( 2 );       // What: Late Item Landed. Why: The check below means something only if the item was written. How: This expects the pie and the salad listed.
	expect( await repGetFun() ).toEqual( [ { asgUidStr : uidOwnStr, iteIdeStr : pieIteStr, labTexStr : 'Pie' } ] ); // What: Stopped Report Kept. Why: A stopped watch reports nothing new. How: This expects the last report unchanged.


} );



pagTesObj( 'cancelling an event deletes its items, and unreadable, expired, and out-of-order events list safely', async ( { page, secPagObj } ) => { // What: Cancel And List Test. Why: A cancelled event takes its items, and the list stays safe with untrusted details (Section 11.11). How: This cancels as a member and as the owner, then seeds events with bad details, an expired one, and starts out of ID order, checking the refusal, the deletions, and what the list shows.


	const { groIdeStr } = await memSetFun( eveEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const staTimNum = Date.now() + DAY_MIL_NUM; // What: Start Time Number. Why: The events start tomorrow. How: This is a day from now.

	const eveIdeStr = await runPagFun( page, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : '', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: The event to cancel. How: This plans one as the owner. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.
	const iteIdeStr = await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Dessert', null ) as string;                                                                           // What: Item Identifier String. Why: The item goes with the event. How: This adds one. // What: Type Assertion Note. Why: iteAddFun resolves with the ID. How: The as reads it as a string.


	expect( await runPagFun( secPagObj, EVE_MOD_STR, 'eveDelFun', groIdeStr, eveIdeStr ) ).toBe( 'error:permission-denied' );         // What: Member Cancel Refused. Why: Only the creator or owner cancels an event. How: This expects the rules to refuse it.
	expect( await runPagFun( page, EVE_MOD_STR, 'eveDelFun', groIdeStr, eveIdeStr ) ).toBeUndefined();                                // What: Cancel Call. Why: The owner cancels the event. How: This expects it to succeed.
	expect( await docReaFun( eveEnvObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` ) ).toBeUndefined();                            // What: Event Gone. Why: The event is cancelled. How: This expects no event document.
	expect( await runPagFun( page, ITE_MOD_STR, 'iteAddFun', groIdeStr, eveIdeStr, 'Chips', null ) ).toBe( 'error:Error' );           // What: Cancelled Add Refused. Why: A cancelled event takes no items. How: This expects an Error.
	expect( await docReaFun( eveEnvObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments/${ iteIdeStr }` ) ).toBeUndefined(); // What: Item Gone. Why: An event's items go with it. How: This expects no item document.


	const keyRawStr = await keyRawFun( page, groIdeStr );    // What: Key Raw String. Why: The seeds are encrypted with the group key. How: This exports the owner's key.
	const patBasStr = `groups/${ groIdeStr }/events`;        // What: Path Base String. Why: Every seed is one of the group's events. How: This names the collection's path.
	const expTimNum = staTimNum + 3600000 + 2 * DAY_MIL_NUM; // What: Expire Time Number. Why: A live event's deletion time. How: This is its end plus 48 hours.


	await eveSeeFun( `${ patBasStr }/aaa`, keyRawStr, '{"d":"x","l":"y","t":5}', staTimNum + 3600000, expTimNum ); // What: Mixed Seed Call. Why: A part that isn't text comes back empty while the others read. How: This seeds a numeric title, starting later than bbb despite its ID.

	await eveSeeFun( `${ patBasStr }/bbb`, keyRawStr, 'not json', staTimNum, expTimNum ); // What: Text Seed Call. Why: A bundle that isn't JSON comes back empty. How: This seeds plain text, starting first.

	await eveSeeFun( `${ patBasStr }/ccc`, keyRawStr, 'null', staTimNum + 7200000, expTimNum ); // What: Null Seed Call. Why: JSON that isn't an object comes back empty rather than failing the list. How: This seeds JSON null, starting third.

	await eveSeeFun( `${ patBasStr }/ddd`, keyRawStr, '{"t":"Gone"}', staTimNum, Date.now() - 60000 ); // What: Expired Seed Call. Why: An event past its deletion time is left out. How: This seeds one a minute past it.



	await eveEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Garble Call. Why: Details that won't decrypt come back empty. How: This writes an event with zeroed details.


		await setDoc( doc( cotAdmObj.firestore(), `${ patBasStr }/eee` ), { // What: Garbled Set Call. Why: An event whose bundle won't decrypt. How: This writes zeroed bytes, starting after the rest.


			createdByUid : 'seed',
			detailsEnc   : Bytes.fromUint8Array( new Uint8Array( 32 ) ),
			endAt        : Timestamp.fromMillis( staTimNum + 14400000 ),
			expireAt     : Timestamp.fromMillis( expTimNum ),
			iv           : Bytes.fromUint8Array( new Uint8Array( 12 ) ),
			startAt      : Timestamp.fromMillis( staTimNum + 10800000 )


		} );


	} );


	expect( await runPagFun( page, EVE_MOD_STR, 'eveLisFun', groIdeStr ) ).toMatchObject( [ // What: Events Listed. Why: Bad details list as empty without failing the list, the expired event is left out, and events list by start. How: This expects bbb, aaa, ccc, then eee.


		{ desTexStr : '', eveIdeStr : 'bbb', locTexStr : '', titTexStr : '' },
		{ desTexStr : 'x', eveIdeStr : 'aaa', locTexStr : 'y', titTexStr : '' },
		{ desTexStr : '', eveIdeStr : 'ccc', locTexStr : '', titTexStr : '' },
		{ desTexStr : '', eveIdeStr : 'eee', locTexStr : '', titTexStr : '' }


	] );


} );

// #endregion Module Init


