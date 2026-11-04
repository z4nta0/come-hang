


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: A dismissed notice is checked in Firestore. How: This reads documents past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the sheet does what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The checks read Firestore past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: A notice about an offer names a member. How: This creates the group and lets the member in.
import { notSeeFun                 } from '../support/notices.ts';        // What: Notice Seed Function. Why: Only Cloud Functions write notices. How: This leaves one as they would.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member joins from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups and identities are made the way the app does it. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The checks read through one. How: This types it.

// #endregion Imports



/**
 * notices.spec.ts = Notices Spec
 *
 * @summary
 * Checks the sheet of notices as people meet it, in whichever engine the
 * project runs, against the Emulator Suite: notices waiting at launch open
 * the sheet, one arriving while it's open joins the list, newest first, and
 * "Got it" dismisses them all and hands focus to the screen; and Escape
 * dismisses too, a notice about an offer names the member when the group can
 * still be read and words itself without a name when it can't, while a
 * notice of a kind the app doesn't know is left alone.
 *
 * Sections:
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let notEnvObj : RulesTestEnvironment; // What: Notice Environment Object. Why: The checks read Firestore through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	notEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The checks read through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await notEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( 'notices open in a sheet at launch and live, newest first, and "Got it" dismisses them all', async ( { page : curPagObj } ) => { // What: Got It Test. Why: Someone should learn what happened while they were away, and see it once. How: This leaves a notice, opens the app, leaves another while the sheet is open, presses "Got it", and checks both are gone.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ); // What: Group Create Call. Why: The sheet opens over a group, and starting one makes the identity. How: This creates it as the app does.


	const uidValStr = ( await runPagFun( curPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Value String. Why: The notices are under the identity's account. How: This reads its UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity, untyped through the page. How: The as reads its UID.


	await notSeeFun( { ageMilNum : 86400000, groIdeStr : 'gone1', groNamStr : 'Lake Trip', kinValStr : 'groupDeleted', uidValStr } ); // What: Deletion Seed Call. Why: A notice waiting at launch opens the sheet. How: This leaves one a day old.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The notice waits for the next launch. How: This opens the app again.


	const notDiaObj = curPagObj.getByRole( 'dialog', { name : 'While you were away' } ); // What: Notice Dialog Object. Why: The checks read the sheet. How: This finds it by its title.
	const notIteObj = notDiaObj.getByRole( 'listitem' );                                 // What: Notice Item Object. Why: Each notice is an entry of the list. How: This finds them in order.


	await expect( notIteObj ).toHaveCount( 1 ); // What: Launch Count Assertion. Why: The waiting notice shows at launch. How: This expects one entry.

	await notSeeFun( { ageMilNum : 3600000, groIdeStr : 'gone2', groNamStr : 'Book Club', kinValStr : 'removed', uidValStr } ); // What: Removal Seed Call. Why: A notice arriving while the sheet is open joins it. How: This leaves one an hour old.

	await expect( notIteObj ).toHaveCount( 2 );                                            // What: Live Count Assertion. Why: The new notice joins the open sheet. How: This expects two entries.
	await expect( notIteObj.first() ).toContainText( 'You were removed from Book Club.' ); // What: Newest First Assertion. Why: The latest news is read first. How: This expects the removal on top.
	await expect( notIteObj.last() ).toContainText( 'The owner deleted Lake Trip.' );      // What: Older Last Assertion. Why: The day-old notice follows. How: This expects the deletion below.

	await notDiaObj.getByRole( 'button', { name : 'Got it' } ).click(); // What: Got It Click Call. Why: Someone who has read the notices puts them away. How: This presses the button.

	await expect( notDiaObj ).toBeHidden();                                                                                  // What: Closed Assertion. Why: The sheet closes. How: This expects it hidden.
	await expect( curPagObj.locator( '#main' ) ).toBeFocused();                                                              // What: Main Focus Assertion. Why: The sheet opened by itself, so focus goes to the screen. How: This expects the main area focused.
	await expect.poll( () => docReaFun( notEnvObj, `accounts/${ uidValStr }/notices/removed-gone2` ) ).toBeUndefined();      // What: Removal Gone Assertion. Why: A seen notice is deleted. How: This polls until it's gone.
	await expect.poll( () => docReaFun( notEnvObj, `accounts/${ uidValStr }/notices/groupDeleted-gone1` ) ).toBeUndefined(); // What: Deletion Gone Assertion. Why: Every notice shown is dismissed. How: This polls until it's gone.

	await curPagObj.goto( '/' ); // What: Reopen Call. Why: Dismissed notices shouldn't show again. How: This opens the app again.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Assertion. Why: The group shows on its own. How: This expects its heading.


} );



pagTesObj( 'Escape dismisses notices, naming a member the group can still read, and a kind the app does not know is left alone', async ( { page : curPagObj, secPagObj } ) => { // What: Escape Test. Why: Closing the sheet any way means it was seen, and the messages name who they can. How: This leaves an owner a declined offer from their member, an offer ended by someone gone, and an unknown kind, presses Escape, and checks which are gone.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( notEnvObj, curPagObj, secPagObj ); // What: Group Setup Values. Why: The owner's notices name the member, Dana Lee. How: This makes the group and lets the member in.


	await notSeeFun( { ageMilNum : 7200000, groIdeStr, groNamStr : 'Beach Day', kinValStr : 'offerDeclined', othUidStr : uidMemStr, uidValStr : uidOwnStr } ); // What: Declined Seed Call. Why: A member the group lists is named. How: This leaves the owner a decline from the member.
	await notSeeFun( { ageMilNum : 3600000, groIdeStr, groNamStr : 'Beach Day', kinValStr : 'offerLeft',     othUidStr : 'goneUid', uidValStr : uidOwnStr } ); // What: Left Seed Call. Why: Someone who has left can't be named. How: This leaves the owner an offer ended by a UID the group doesn't list.
	await notSeeFun( { ageMilNum : 1800000, groIdeStr, groNamStr : 'Beach Day', kinValStr : 'mystery',       uidValStr : uidOwnStr                        } ); // What: Unknown Seed Call. Why: A kind added later shouldn't break the sheet. How: This leaves the owner a kind the app doesn't know.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The notices wait for the next launch. How: This opens the app again.


	const notDiaObj = curPagObj.getByRole( 'dialog', { name : 'While you were away' } ); // What: Notice Dialog Object. Why: The checks read the sheet. How: This finds it by its title.


	await expect( notDiaObj.getByRole( 'listitem' ) ).toHaveCount( 2 );                                            // What: Known Count Assertion. Why: Only the kinds the app can word show. How: This expects two entries.
	await expect( notDiaObj ).toContainText( 'Dana Lee declined your offer of Beach Day.' );                       // What: Named Assertion. Why: The member the group lists is named. How: This expects the decline with their name.
	await expect( notDiaObj ).toContainText( 'The member you offered Beach Day to left it, so the offer ended.' ); // What: Unnamed Assertion. Why: Someone the group no longer lists is described instead. How: This expects the wording without a name.

	await curPagObj.keyboard.press( 'Escape' ); // What: Escape Press Call. Why: Escape closes the sheet like every other way. How: This presses it.

	await expect( notDiaObj ).toBeHidden(); // What: Closed Assertion. Why: The sheet closes. How: This expects it hidden.

	await expect.poll( () => docReaFun( notEnvObj, `accounts/${ uidOwnStr }/notices/offerDeclined-${ groIdeStr }` ) ).toBeUndefined(); // What: Declined Gone Assertion. Why: Closing the sheet any way dismisses its notices. How: This polls until the decline is gone.
	await expect.poll( () => docReaFun( notEnvObj, `accounts/${ uidOwnStr }/notices/offerLeft-${ groIdeStr }` ) ).toBeUndefined();     // What: Left Gone Assertion. Why: Every notice shown is dismissed. How: This polls until the other is gone.

	expect( await docReaFun( notEnvObj, `accounts/${ uidOwnStr }/notices/mystery-${ groIdeStr }` ) ).toBeDefined(); // What: Unknown Kept Assertion. Why: A notice the sheet didn't show wasn't seen. How: This expects it still there.


} );

// #endregion Module Init


