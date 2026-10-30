


// #region Imports

import { Bytes                     } from 'firebase/firestore';           // What: Bytes. Why: A garbled name is seeded as bytes. How: This wraps them.
import { decNamFun                 } from '../support/client.ts';         // What: Decrypt Name Function. Why: Names are checked outside the browser. How: This reads and decrypts one.
import { deleteField               } from 'firebase/firestore';           // What: Delete Field. Why: A membership without a name is seeded. How: This removes the name's fields.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: An old activity mark is seeded by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the membership changed as it should. How: This asserts on what the pages and the emulator return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { keyRawFun                 } from '../support/client.ts';         // What: Key Raw Function. Why: A renamed member's name is decrypted with the group key. How: This exports a page's key.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Every test starts from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: An old activity mark is seeded and read back. How: This builds and reads it.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: An activity mark is aged past the rules. How: This changes it.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * members.spec.ts = Members Spec
 *
 * @summary
 * Checks the changes to a group's members and settings in a real browser, in
 * each engine, against the Emulator Suite, with the real security rules. Each
 * test starts from a group with two identities, the page's own as its owner
 * and a member who joined through a second browser context, and runs the app's
 * own modules in each page: listing and renaming members, marking activity,
 * leaving, removing, rotating the link, changing the group's settings, and
 * deleting the group. The tests read back what was written and decrypt names
 * outside the browser.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const GRO_MOD_STR = '/src/state/groups.ts';  // What: Groups Module String. Why: Group creation, settings, and rotation are in the groups module. How: This names its path.
const JOI_MOD_STR = '/src/state/joins.ts';   // What: Joins Module String. Why: The second identity joins through the joins module. How: This names its path.
const MEM_MOD_STR = '/src/state/members.ts'; // What: Members Module String. Why: Membership changes are in the members module. How: This names its path.

// #endregion Constants



// #region Module State

let memEnvObj : RulesTestEnvironment; // What: Members Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	memEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await memEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'members are listed by name, oldest first, and a member renames themselves', async ( { page, secPagObj } ) => { // What: Name Test. Why: Members recognize each other by per-group names only the group can read (Section 11.3). How: This lists both members, renames the second, checks a bad name is refused, then relists with one name garbled, one removed, and the joins reordered.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( memEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with two members. How: This sets them up.


	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'memLisFun', groIdeStr ) ).toEqual( expect.arrayContaining( [ expect.objectContaining( { colSloNum : 0, namTexStr : 'Alice', uidValStr : uidOwnStr } ), expect.objectContaining( { colSloNum : 1, namTexStr : 'Dana Lee', uidValStr : uidMemStr } ) ] ) ); // What: Members Listed. Why: Each member reads the others' names with the group key. How: This expects both, in any order, since the test machine's clock can step back between the two joins, and the order is checked below with set times.
	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'namSetFun', groIdeStr, '  Dana   L. ' ) ).toBeUndefined();        // What: Rename Call. Why: A member chooses their own name. How: This expects the tidied rename to succeed.
	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'namSetFun', groIdeStr, 'Dana 2' ) ).toBe( 'error:RangeError' );   // What: Bad Name Refused. Why: A name is letters, so a number fails. How: This expects a RangeError.
	expect( await decNamFun( memEnvObj, groIdeStr, uidMemStr, await keyRawFun( page, groIdeStr ) ) ).toBe( 'Dana L.' ); // What: Name Decrypted. Why: The owner's key opens the new name, saved tidied. How: This expects the renamed name.



	await memEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Reorder Seed Call. Why: A bad name mustn't hide the others, and the order has to follow join time rather than the emulator's ID order. How: This garbles the owner's name, removes the member's, and moves the member's join a day earlier.


		await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/members/${ uidOwnStr }` ), { displayNameEnc : Bytes.fromUint8Array( new Uint8Array( 32 ) ) } ); // What: Garbled Name Call. Why: A name written under the wrong key won't decrypt. How: This overwrites the owner's with zeros.

		await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/members/${ uidMemStr }` ), { displayNameEnc : deleteField(), iv : deleteField(), joinedAt : Timestamp.fromMillis( Date.now() - 86400000 ) } ); // What: Earlier Join Call. Why: The member now joined first, with no name written. How: This removes their name and backdates their join a day.


	} );


	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'memLisFun', groIdeStr ) ).toEqual( [ expect.objectContaining( { namTexStr : '', uidValStr : uidMemStr } ), expect.objectContaining( { namTexStr : '', uidValStr : uidOwnStr } ) ] ); // What: Members Relisted. Why: The earlier join leads, and a missing or unreadable name comes back empty. How: This expects the member, then the owner, both with no name.


} );



pagTesObj( 'activity is marked at most once a day, to the server time', async ( { page, secPagObj } ) => { // What: Activity Test. Why: The mark decides when ownership can be claimed, and writes stay at one a day (Section 18). How: This marks a fresh membership, then one aged two days, checking only the second writes, to the server's recent time.


	const { groIdeStr, uidMemStr } = await memSetFun( memEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a member. How: This sets one up.

	const memPatStr = `groups/${ groIdeStr }/members/${ uidMemStr }`; // What: Member Path String. Why: The mark is in the membership. How: This names it.


	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'actMarFun', groIdeStr ) ).toBe( false ); // What: Fresh Mark Kept. Why: A member who joined just now is already marked. How: This expects no write.



	await memEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), memPatStr ), { lastActiveAt : Timestamp.fromMillis( Date.now() - 2 * 86400000 ) } ); } ); // What: Aged Mark Seed. Why: A mark two days old is due. How: This backdates it with the rules off.


	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'actMarFun', groIdeStr ) ).toBe( true ); // What: Old Mark Moved. Why: A day-old mark is renewed. How: This expects a write.


	const lasTimNum = ( ( await docReaFun( memEnvObj, memPatStr ) )?.lastActiveAt as Timestamp ).toMillis(); // What: Last Time Number. Why: The new mark has to be the server's recent time. How: This reads it. // What: Type Assertion Note. Why: The rules store the mark as a timestamp. How: The as reads it as one.


	expect( Date.now() - lasTimNum ).toBeLessThan( 60000 ); // What: Mark Recent. Why: The mark moved to now. How: This expects it within a minute.


} );



pagTesObj( "a member leaves, freeing their slot and the device's key, while the owner cannot leave", async ( { page, secPagObj } ) => { // What: Leave Test. Why: Any member but the owner can always leave (Sections 9 and 18). How: This loads the key on the member's device, leaves as the member, and checks the membership, count, account, and key, then tries as the owner.


	const { groIdeStr, uidMemStr } = await memSetFun( memEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a member to leave. How: This sets one up.


	await keyRawFun( secPagObj, groIdeStr ); // What: Key Load Call. Why: The member's device has to hold the key for its deletion to show. How: This loads it from the member's wrap, keeping it on the device.

	expect( await runPagFun( secPagObj, MEM_MOD_STR, 'groLeaFun', groIdeStr ) ).toBeUndefined();                               // What: Leave Call. Why: The member leaves. How: This expects it to succeed.
	expect( await runPagFun( page, MEM_MOD_STR, 'groLeaFun', groIdeStr ) ).toBe( 'error:Error' );                              // What: Owner Leave Refused. Why: The owner transfers the group first. How: This expects an Error.
	expect( await runPagFun( secPagObj, '/src/platform/key-store.ts', 'keyGetFun', `group:${ groIdeStr }` ) ).toBeUndefined(); // What: Key Forgotten. Why: A left group's key has no use on the device. How: This expects its record gone.


	const accDatObj = await docReaFun( memEnvObj, `accounts/${ uidMemStr }` );                      // What: Account Data Object. Why: The slot frees. How: This reads the member's account.
	const groDatObj = await docReaFun( memEnvObj, `groups/${ groIdeStr }` );                        // What: Group Data Object. Why: The count drops. How: This reads the group.
	const memDatObj = await docReaFun( memEnvObj, `groups/${ groIdeStr }/members/${ uidMemStr }` ); // What: Member Data Object. Why: The membership ends. How: This reads where it was.


	expect( accDatObj?.memberGroups ).toEqual( {} );                                  // What: Slot Freed. Why: The group no longer counts against the member's caps. How: This expects an empty member map.
	expect( groDatObj ).toMatchObject( { countedUid : uidMemStr, memberCount : 1 } ); // What: Count Lowered. Why: The group counts one member fewer. How: This expects 1, naming the member.
	expect( memDatObj ).toBeUndefined();                                              // What: Membership Ended. Why: The member is gone. How: This expects no member document.


} );



pagTesObj( 'the owner removes a member, blocking them and rotating the link, but cannot remove themselves', async ( { page, secPagObj } ) => { // What: Removal Test. Why: A removal ends the membership, and the link the member had stops working (Section 9). How: This removes the member, checks every change, then tries to rejoin and to remove the owner.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( memEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a member to remove. How: This sets one up.

	const tokOldStr = ( await docReaFun( memEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string; // What: Token Old String. Why: The old link has to stop working. How: This reads it before the removal. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
	const tokNewStr = await runPagFun( page, MEM_MOD_STR, 'memRemFun', groIdeStr, uidMemStr ) as string;       // What: Token New String. Why: The removal returns the new link to share. How: This removes the member as the owner. // What: Type Assertion Note. Why: memRemFun resolves with the token. How: The as reads it as a string.


	const accDatObj = await docReaFun( memEnvObj, `accounts/${ uidMemStr }` ); // What: Account Data Object. Why: The member's slot frees. How: This reads their account.
	const groDatObj = await docReaFun( memEnvObj, `groups/${ groIdeStr }` );   // What: Group Data Object. Why: The count, blocklist, and link change. How: This reads the group.


	expect( groDatObj ).toMatchObject( { countedUid : uidMemStr, currentInviteToken : tokNewStr, memberCount : 1, removedUids : { [ uidMemStr ] : true } } ); // What: Group Changed. Why: One fewer member, blocked, under a new link. How: This expects each change.
	expect( accDatObj?.memberGroups ).toEqual( {} ); // What: Slot Freed. Why: The group no longer counts against the member's caps. How: This expects an empty member map.
	expect( await docReaFun( memEnvObj, `groups/${ groIdeStr }/members/${ uidMemStr }` ) ).toBeUndefined();                                                   // What: Membership Ended. Why: The member is gone. How: This expects no member document.
	expect( await docReaFun( memEnvObj, `invites/${ tokOldStr }` ) ).toBeUndefined();                                                                         // What: Old Link Gone. Why: The link the member had stops working. How: This expects no old invite.
	expect( await docReaFun( memEnvObj, `invites/${ tokNewStr }` ) ).toMatchObject( { groupId : groIdeStr, groupName : 'Beach Day' } );                       // What: New Link Works. Why: The group always has a link. How: This expects the new invite to open the group.

	expect( await runPagFun( secPagObj, JOI_MOD_STR, 'reqCreFun', tokNewStr, 'Dana Lee', '' ) ).toBe( 'error:permission-denied' ); // What: Rejoin Refused. Why: A removed member is blocked from any link. How: This expects the rules to refuse a request through the new one.
	expect( await runPagFun( page, MEM_MOD_STR, 'memRemFun', groIdeStr, uidOwnStr ) ).toBe( 'error:Error' );                       // What: Owner Removal Refused. Why: The owner can't remove themselves. How: This expects an Error.


} );



pagTesObj( 'the owner rotates the link and changes the settings, which a bad value or a member cannot', async ( { page, secPagObj } ) => { // What: Settings Test. Why: The link and the settings are the owner's to change, and the invite keeps the group's real name (Sections 9 and 11.6). How: This rotates, renames, and sets retention, then tries bad values and a member's change, checking the new link and settings and each refusal.


	const { groIdeStr } = await memSetFun( memEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const tokOldStr = ( await docReaFun( memEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string; // What: Token Old String. Why: The old link has to stop working. How: This reads it before the rotation. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
	const tokNewStr = await runPagFun( page, GRO_MOD_STR, 'invRotFun', groIdeStr ) as string;                  // What: Token New String. Why: The rotation returns the new link. How: This rotates as the owner. // What: Type Assertion Note. Why: invRotFun resolves with the token. How: The as reads it as a string.


	expect( await docReaFun( memEnvObj, `invites/${ tokOldStr }` ) ).toBeUndefined();                                               // What: Old Link Gone. Why: A rotated link stops working. How: This expects no old invite.
	expect( await runPagFun( page, GRO_MOD_STR, 'groSetFun', groIdeStr, '  Beach   Week ', 60 ) ).toBeUndefined();                  // What: Settings Call. Why: The owner renames the group and keeps chat 60 days. How: This expects the change to succeed.
	expect( await runPagFun( secPagObj, JOI_MOD_STR, 'invGetFun', tokNewStr ) ).toEqual( { groIdeStr, groNamStr : 'Beach Week' } ); // What: Invite Renamed. Why: The invite screen shows the real name. How: This expects the new link to show the tidied new name.
	expect( await docReaFun( memEnvObj, `groups/${ groIdeStr }` ) ).toMatchObject( { chatTtlDays : 60, name : 'Beach Week' } );     // What: Settings Saved. Why: The group holds its new settings. How: This expects both.
	expect( await runPagFun( page, GRO_MOD_STR, 'groSetFun', groIdeStr, 'Beach Week', 6 ) ).toBe( 'error:RangeError' );             // What: Short Retention Refused. Why: Chat is kept at least 7 days. How: This expects a RangeError.
	expect( await runPagFun( page, GRO_MOD_STR, 'groSetFun', groIdeStr, 'Beach Week', 181 ) ).toBe( 'error:RangeError' );           // What: Long Retention Refused. Why: Chat is kept at most 180 days. How: This expects a RangeError.
	expect( await runPagFun( page, GRO_MOD_STR, 'groSetFun', groIdeStr, 'Beach Week', 7.5 ) ).toBe( 'error:RangeError' );           // What: Partial Day Refused. Why: Retention is a whole number of days. How: This expects a RangeError.
	expect( await runPagFun( page, GRO_MOD_STR, 'groSetFun', groIdeStr, 'Bad <name>', 30 ) ).toBe( 'error:RangeError' );            // What: Bad Name Refused. Why: A group name allows no angle brackets. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, GRO_MOD_STR, 'groSetFun', groIdeStr, 'Mine Now', 30 ) ).toBe( 'error:permission-denied' );  // What: Member Change Refused. Why: Only the owner changes the settings. How: This expects the rules to refuse it.
	expect( await runPagFun( secPagObj, GRO_MOD_STR, 'invRotFun', groIdeStr ) ).toBe( 'error:permission-denied' );                  // What: Member Rotation Refused. Why: Only the owner rotates the link. How: This expects the rules to refuse it.


} );

pagTesObj( 'the owner deletes the group, telling the member and freeing both slots, which the member cannot do', async ( { page, secPagObj } ) => { // What: Deletion Test. Why: Only the owner deletes a group, and the members it vanishes for are told (Section 9). How: This tries a member's deletion, deletes as the owner, then checks the group, both accounts, the key, and the member's notice.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( memEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	expect( await runPagFun( secPagObj, GRO_MOD_STR, 'groDelFun', groIdeStr ) ).toBe( 'error:functions/permission-denied' );                                              // What: Member Deletion Refused. Why: Only the owner deletes a group. How: This expects the function's refusal.
	expect( await runPagFun( page, GRO_MOD_STR, 'groDelFun', groIdeStr ) ).toBeUndefined();                                                                               // What: Deletion Call. Why: The owner deletes the group. How: This expects the deletion to succeed.
	expect( await runPagFun( page, '/src/platform/key-store.ts', 'keyGetFun', `group:${ groIdeStr }` ) ).toBeUndefined();                                                 // What: Key Forgotten. Why: A deleted group's key has no use on the device. How: This expects its record gone.
	expect( await docReaFun( memEnvObj, `groups/${ groIdeStr }` ) ).toBeUndefined();                                                                                      // What: Group Gone. Why: The group is deleted. How: This expects no group document.
	expect( await docReaFun( memEnvObj, `accounts/${ uidMemStr }` ) ).toMatchObject( { memberGroups : {} } );                                                             // What: Member Slot Freed. Why: The group no longer counts against the member. How: This expects an empty member map.
	expect( await docReaFun( memEnvObj, `accounts/${ uidOwnStr }` ) ).toMatchObject( { ownedGroups : {} } );                                                              // What: Owner Slot Freed. Why: Deleting a group frees its owned slot (Section 18). How: This expects an empty owned map.
	expect( await runPagFun( secPagObj, '/src/state/notices.ts', 'notLisFun' ) ).toMatchObject( [ { groIdeStr, groNamStr : 'Beach Day', kinValStr : 'groupDeleted' } ] ); // What: Member Told. Why: The group mustn't just vanish from the member's list. How: This expects the deletion notice.


} );

// #endregion Module Init


