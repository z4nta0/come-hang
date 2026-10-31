


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the People section shows what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Removal and the member's view need a group with two. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member looks from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups are made the way the app makes them. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The section helper drives a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * people.spec.ts = People Spec
 *
 * @summary
 * Checks the People section as people use it, in whichever engine the
 * project runs, against the Emulator Suite: the invite link shows, copies,
 * and is replaced by the owner after confirming; a member changes their own
 * name in a form that takes and returns focus and refuses a name outside its
 * limits; the owner removes a member after confirming, which changes the
 * link; and a member sees neither of the owner's controls.
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

let peoEnvObj : RulesTestEnvironment; // What: People Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const secOpeFun = async ( curPagObj : Page ) : Promise< void > => { // What: Section Open Function. Why: Each test works in the People section. How: This presses its tab and waits for its members.


	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: Tab Click Call. Why: The section opens from its tab. How: This presses it.

	await expect( curPagObj.getByRole( 'heading', { level : 3, name : /^Members \(\d+\)$/ } ) ).toBeVisible(); // What: Section Wait. Why: The section has to show its members before it's used. How: This waits for the counted heading.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	peoEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The member setup reads through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await peoEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( 'the invite link shows and copies, and the owner replaces it after confirming', async ( { page : curPagObj } ) => { // What: Invite Link Test. Why: Sharing the link is how people join, and the owner can replace an over-shared one (Section 9). How: This checks the link names the group's token, copies it, then replaces it and checks the new link.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ); // What: Group Create Call. Why: The link belongs to a group. How: This creates one.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The link is in the People section. How: This opens it.


	const linInpObj = curPagObj.getByLabel( 'Invite link' ); // What: Link Input Object. Why: The checks read the link's box. How: This finds it.
	const oldLinStr = await linInpObj.inputValue();          // What: Old Link String. Why: A new link has to differ from it. How: This reads the box.


	expect( oldLinStr ).toMatch( /\/join\/[\w-]+$/ ); // What: Link Shape Assertion. Why: The link opens the group's invite screen. How: This expects the join path and a token.

	await curPagObj.getByRole( 'button', { name : 'Copy link' } ).click(); // What: Copy Click Call. Why: Copying is how the link is shared. How: This presses the button.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( /^Link (copied\.|selected\. Copy it to share it\.)$/ ); // What: Copy Status Assertion. Why: The copy, or the selection where the browser won't copy, is announced. How: This reads the status.

	await curPagObj.getByRole( 'button', { name : 'Make a new link' } ).click(); // What: New Link Click Call. Why: The owner replaces the link. How: This asks to confirm.

	await expect( curPagObj.getByText( 'The old link will stop working.', { exact : false } ) ).toBeVisible(); // What: Confirm Assertion. Why: The owner is told what a new link does first. How: This waits for the question.

	await curPagObj.getByRole( 'button', { name : 'Make the new link' } ).click(); // What: Confirm Click Call. Why: The owner confirms. How: This presses the answer.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( 'Made a new link.' ); // What: New Link Status Assertion. Why: The replacement is announced. How: This reads the status.
	await expect( linInpObj ).not.toHaveValue( oldLinStr );                           // What: New Link Assertion. Why: The box shows the new link. How: This waits for its value to change.


} );



test( 'a member changes their own name in a form that takes and returns focus and refuses a bad name', async ( { page : curPagObj } ) => { // What: Name Change Test. Why: A display name is per group and the member's own to change (Section 11.3). How: This opens the form, leaves it with Escape, tries a refused name, then saves one, checking the focus, the alert, the status, and the row.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The section is used on a phone. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ); // What: Group Create Call. Why: The name belongs to a group. How: This creates one.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The name is changed in the People section. How: This opens it.

	await curPagObj.getByRole( 'button', { name : 'Change name' } ).click(); // What: Rename Click Call. Why: The form opens from the button. How: This presses it.

	await expect( curPagObj.getByLabel( 'Your name in this group' ) ).toBeFocused();          // What: Box Focus Assertion. Why: The form puts the member in its box. How: This expects it focused.
	await expect( curPagObj.getByLabel( 'Your name in this group' ) ).toHaveValue( 'Alice' ); // What: Box Value Assertion. Why: The form starts from the member's name. How: This reads it.

	await curPagObj.keyboard.press( 'Escape' ); // What: Escape Press Call. Why: Escape leaves the form. How: This presses it.

	await expect( curPagObj.getByRole( 'button', { name : 'Change name' } ) ).toBeFocused(); // What: Button Return Assertion. Why: Leaving the form puts focus back on its button. How: This expects it focused.

	await curPagObj.getByRole( 'button', { name : 'Change name' } ).click(); // What: Rename Reopen Call. Why: The change is made this time. How: This opens the form again.

	await curPagObj.getByLabel( 'Your name in this group' ).fill( 'Al1ce' ); // What: Bad Name Fill Call. Why: A digit isn't allowed in a name. How: This types one.

	await curPagObj.getByRole( 'button', { name : 'Save' } ).click(); // What: Bad Save Call. Why: The refusal is checked. How: This presses Save.

	await expect( curPagObj.getByRole( 'alert' ) ).toHaveText( 'Use letters, spaces, apostrophes, hyphens, and periods.' ); // What: Refused Alert Assertion. Why: A name outside its limits says what's allowed. How: This reads the alert.

	await curPagObj.getByLabel( 'Your name in this group' ).fill( '  Ali  ' ); // What: Name Fill Call. Why: The new name is typed, untidy. How: This types it.

	await curPagObj.getByRole( 'button', { name : 'Save' } ).click(); // What: Save Click Call. Why: The name is saved. How: This presses Save.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( 'Your name is now Ali.' );   // What: Saved Status Assertion. Why: The change is announced, tidied. How: This reads the status.
	await expect( curPagObj.getByRole( 'listitem' ) ).toContainText( 'Ali (you)' );          // What: Renamed Row Assertion. Why: The row shows the new name. How: This waits for it.
	await expect( curPagObj.getByRole( 'button', { name : 'Change name' } ) ).toBeFocused(); // What: Saved Focus Assertion. Why: Saving puts focus back on the button. How: This expects it focused.


} );



pagTesObj( 'the owner removes a member after confirming, which changes the link, and a member sees neither owner control', async ( { page : curPagObj, secPagObj } ) => { // What: Remove Test. Why: Only the owner removes, and a removal replaces the link (Section 9). How: This checks the member's view first, then removes them as the owner, checking the question, the status, the count, and the link.


	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.

	await memSetFun( peoEnvObj, curPagObj, secPagObj ); // What: Member Setup Call. Why: Removal needs a member to remove. How: This creates the group with an owner and a member.

	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member's view is checked first. How: This opens the app on their device.

	await secOpeFun( secPagObj ); // What: Member Section Call. Why: The member looks in the People section. How: This opens it.

	await expect( secPagObj.getByRole( 'button', { name : 'Make a new link' } ) ).toHaveCount( 0 ); // What: No Rotate Assertion. Why: Only the owner replaces the link. How: This expects no button.
	await expect( secPagObj.getByRole( 'button', { name : /^Remove/ } ) ).toHaveCount( 0 );         // What: No Remove Assertion. Why: Only the owner removes members. How: This expects no button.

	await curPagObj.goto( '/' ); // What: Owner Open Call. Why: The owner removes the member. How: This opens the app on their device.

	await secOpeFun( curPagObj ); // What: Owner Section Call. Why: Removal is in the People section. How: This opens it.


	const oldLinStr = await curPagObj.getByLabel( 'Invite link' ).inputValue(); // What: Old Link String. Why: A removal has to change the link. How: This reads it first.


	await curPagObj.getByRole( 'button', { name : 'Remove Dana Lee' } ).click(); // What: Remove Click Call. Why: The owner removes the member. How: This asks to confirm.

	await expect( curPagObj.getByText( 'Remove Dana Lee? This also makes a new invite link.' ) ).toBeVisible(); // What: Confirm Assertion. Why: The owner is told what removing does first. How: This waits for the question.

	await curPagObj.getByRole( 'button', { name : 'Yes, remove' } ).click(); // What: Confirm Click Call. Why: The owner confirms. How: This presses the answer.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( 'Removed Dana Lee. The invite link changed.' ); // What: Removed Status Assertion. Why: The removal is announced with its new link. How: This reads the status.
	await expect( curPagObj.getByRole( 'heading', { level : 3, name : 'Members (1)' } ) ).toBeVisible();        // What: Count Assertion. Why: The member is gone from the list. How: This waits for the count.
	await expect( curPagObj.getByLabel( 'Invite link' ) ).not.toHaveValue( oldLinStr );                         // What: Changed Link Assertion. Why: A removal replaces the link. How: This waits for the box to change.


} );

// #endregion Module Init


