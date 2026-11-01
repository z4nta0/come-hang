


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: A block is checked in the group's blocklist. How: This reads the group past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the People section shows what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Removal and the member's view need a group with two. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member looks from a device of their own. How: This declares a test with a second page.
import { reqSteFun                 } from '../support/states.ts';         // What: Requests Steps Function. Why: The waiting list needs people asking to join. How: This has two ask through the group's link.
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
 * link; a member sees neither of the owner's controls; and any member
 * answers the people waiting to join, approving, blocking after confirming,
 * declining, and declining all after confirming, focus landing on a heading
 * after each.
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



test( 'a member approves a request and blocks another after confirming, focus landing on a heading after each', async ( { page : curPagObj } ) => { // What: Approve And Block Test. Why: Any member answers a request, the screen warns of a reused name (Section 17), and focus mustn't fall to the page when a request's buttons go. How: This has two people ask, checks the note and the warning, approves one and blocks the other, checking the status, the counts, the blocklist, and the focus.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The blocklist is read from the group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The requests are answered in the People section. How: This opens it.

	await reqSteFun( curPagObj ); // What: Requests Call. Why: Two people ask to join, one using the member's name. How: This files their requests.

	await expect( curPagObj.getByRole( 'heading', { level : 3, name : 'Waiting to join (2)' } ) ).toBeVisible(); // What: List Assertion. Why: Both requests show as they arrive, without a reload. How: This waits for the counted heading.


	const aliRowObj = curPagObj.getByRole( 'listitem' ).filter( { hasText : 'Asked' } ).filter( { hasText : 'Alice' } ); // What: Alice Row Object. Why: The checks read the request reusing the member's name. How: This finds its row among the requests.
	const danRowObj = curPagObj.getByRole( 'listitem' ).filter( { hasText : 'Dana Lee' } );                             // What: Dana Row Object. Why: The checks read Dana's request. How: This finds its row.
	const warTexStr = 'A member already has this name. Check with them before you approve.';                            // What: Warning Text String. Why: Both rows are checked for it. How: This is the warning's text.


	await expect( danRowObj ).toContainText( '“Sam\'s cousin”' ); // What: Note Assertion. Why: The joiner's note helps place them. How: This expects it quoted in their row.
	await expect( danRowObj ).not.toContainText( warTexStr );    // What: No Warning Assertion. Why: A name no member has isn't flagged. How: This expects no warning in Dana's row.
	await expect( aliRowObj ).toContainText( warTexStr );        // What: Warning Assertion. Why: A request reusing a member's name is pointed out. How: This expects the warning in its row.

	await curPagObj.getByRole( 'button', { name : 'Approve Dana Lee' } ).click(); // What: Approve Click Call. Why: The member lets Dana in. How: This presses the button.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( "Approved Dana Lee. They're in the group." );    // What: Approved Status Assertion. Why: The approval is announced. How: This reads the status.
	await expect( curPagObj.getByRole( 'heading', { level : 3, name : 'Members (2)' } ) ).toBeVisible();         // What: Members Count Assertion. Why: The new member joins the list. How: This waits for the count.
	await expect( curPagObj.getByRole( 'heading', { level : 3, name : 'Waiting to join (1)' } ) ).toBeFocused(); // What: Waiting Focus Assertion. Why: The approve button went with its request, and another still waits. How: This expects the waiting list's heading focused.

	await curPagObj.getByRole( 'button', { name : 'Block Alice' } ).click(); // What: Block Click Call. Why: The member blocks the one reusing their name. How: This asks to confirm.

	await expect( curPagObj.getByText( "Block Alice? They won't be able to ask to join again." ) ).toBeVisible(); // What: Confirm Assertion. Why: The member is told what blocking does first. How: This waits for the question.

	await curPagObj.getByRole( 'button', { name : 'Yes, block' } ).click(); // What: Confirm Click Call. Why: The member confirms. How: This presses the answer.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( 'Blocked Alice.' );                          // What: Blocked Status Assertion. Why: The block is announced. How: This reads the status.
	await expect( curPagObj.getByRole( 'heading', { level : 3, name : /^Waiting to join/ } ) ).toHaveCount( 0 ); // What: List Gone Assertion. Why: The list shows only while someone waits. How: This expects no heading.
	await expect( curPagObj.getByRole( 'heading', { level : 3, name : 'Members (2)' } ) ).toBeFocused();     // What: Members Focus Assertion. Why: With no one waiting, focus lands on the members. How: This expects their heading focused.

	expect( Object.keys( ( await docReaFun( peoEnvObj, `groups/${ groIdeStr }` ) )?.removedUids as object ) ).toHaveLength( 1 ); // What: Blocklist Assertion. Why: A block keeps that identity from asking again. How: This expects one UID on the group's blocklist. // What: Type Assertion Note. Why: The rules store the blocklist as a map. How: The as reads it as an object.


} );



pagTesObj( 'any member declines a request, and declines them all after confirming', async ( { page : curPagObj, secPagObj } ) => { // What: Decline Test. Why: Any member, not only the owner, turns requests down, and a flood is cleared at once (Section 17). How: This has the member decline one request, then decline the rest together, checking the status, the question, the counts, and the focus.


	test.setTimeout( 60000 ); // What: Timeout Set Call. Why: A member joins and four people ask, each from a device of their own, which can outlast the default 30 seconds on a busy run. How: This allows 60 seconds.



	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.

	await memSetFun( peoEnvObj, curPagObj, secPagObj ); // What: Member Setup Call. Why: The answers come from a member who isn't the owner. How: This creates the group with an owner and a member.

	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member answers from their own device. How: This opens the app on it.

	await secOpeFun( secPagObj ); // What: Member Section Call. Why: The requests are answered in the People section. How: This opens it.

	await reqSteFun( secPagObj ); // What: First Requests Call. Why: The member has requests to answer. How: This has two people ask.

	await expect( secPagObj.getByRole( 'heading', { level : 3, name : 'Waiting to join (2)' } ) ).toBeVisible(); // What: List Assertion. Why: Both requests show. How: This waits for the counted heading.

	await secPagObj.getByRole( 'button', { name : 'Decline Alice' } ).click(); // What: Decline Click Call. Why: The member turns one request down. How: This presses the button.

	await expect( secPagObj.getByRole( 'status' ) ).toHaveText( 'Declined Alice.' );                                // What: Declined Status Assertion. Why: The decline is announced. How: This reads the status.
	await expect( secPagObj.getByRole( 'heading', { level : 3, name : 'Waiting to join (1)' } ) ).toBeFocused(); // What: Waiting Focus Assertion. Why: The decline button went with its request. How: This expects the waiting list's heading focused.
	await expect( secPagObj.getByRole( 'button', { name : 'Decline all' } ) ).toHaveCount( 0 );                   // What: No All Assertion. Why: Declining all is offered only for two or more. How: This expects no button.

	await reqSteFun( secPagObj ); // What: Second Requests Call. Why: A flood is cleared at once. How: This has two more people ask.

	await expect( secPagObj.getByRole( 'heading', { level : 3, name : 'Waiting to join (3)' } ) ).toBeVisible(); // What: Grown List Assertion. Why: The new requests join the list as they arrive. How: This waits for the count.

	await secPagObj.getByRole( 'button', { name : 'Decline all' } ).click(); // What: All Click Call. Why: The member clears the list. How: This asks to confirm.

	await expect( secPagObj.getByText( 'Decline all 3 requests?' ) ).toBeVisible(); // What: Confirm Assertion. Why: The member is told how many first. How: This waits for the question.

	await secPagObj.getByRole( 'button', { name : 'Yes, decline all' } ).click(); // What: Confirm Click Call. Why: The member confirms. How: This presses the answer.

	await expect( secPagObj.getByRole( 'status' ) ).toHaveText( 'Declined 3 requests.' );                      // What: All Status Assertion. Why: Declining all is announced with the count. How: This reads the status.
	await expect( secPagObj.getByRole( 'heading', { level : 3, name : /^Waiting to join/ } ) ).toHaveCount( 0 ); // What: List Gone Assertion. Why: No one is waiting. How: This expects no heading.
	await expect( secPagObj.getByRole( 'heading', { level : 3, name : 'Members (2)' } ) ).toBeFocused();     // What: Members Focus Assertion. Why: With no one waiting, focus lands on the members. How: This expects their heading focused.


} );

// #endregion Module Init


