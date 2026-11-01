


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: A save, a deletion, and a leave are checked in Firestore. How: This reads documents past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the Settings section does what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The checks read Firestore past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: A leave needs a member who isn't the owner. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member leaves from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups are made the way the app makes them. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The section helper drives a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The checks read through one. How: This types it.

// #endregion Imports



/**
 * settings.spec.ts = Settings Spec
 *
 * @summary
 * Checks the Settings section as people use it, in whichever engine the
 * project runs, against the Emulator Suite: the owner saves the group's name
 * and chat retention, a bad name refused beside its box, and can't leave;
 * the owner deletes the group only once its name is typed, focus moving into
 * the confirmation and back, then landing on the next group or the welcome;
 * and a member sees the settings without the form, and leaves after
 * confirming, focus moving to Stay and back, then landing on the welcome.
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

let setEnvObj : RulesTestEnvironment; // What: Settings Environment Object. Why: The checks read Firestore through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const secOpeFun = async ( curPagObj : Page ) : Promise< void > => { // What: Section Open Function. Why: Each test works in the Settings section. How: This presses its tab and waits for its first part.


	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Settings' } ).click(); // What: Tab Click Call. Why: The section opens from its tab. How: This presses it.

	await expect( curPagObj.getByRole( 'heading', { level : 3, name : 'This group' } ) ).toBeVisible(); // What: Section Wait. Why: The section has to show before it's used. How: This waits for its first heading.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	setEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The checks read through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await setEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( "the owner saves the group's name and chat retention, a bad name refused beside its box", async ( { page : curPagObj } ) => { // What: Save Test. Why: Only the owner renames the group and sets its retention (Section 11.2). How: This sends an empty name, then a new name and retention, checking the problem, the focus, the status, the bar, and the saved group.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The saved group is read back. How: This creates it as the owner. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The settings are in the Settings section. How: This opens it.


	const namInpObj = curPagObj.getByLabel( 'Group name' ); // What: Name Input Object. Why: The checks type in and read the name box. How: This finds it.


	await expect( curPagObj.getByRole( 'button', { name : 'Leave group' } ) ).toHaveCount( 0 );                 // What: No Leave Assertion. Why: The owner can't leave without handing the group over (Section 18). How: This expects no button.
	await expect( curPagObj.getByText( "As the owner, you can't leave the group.", { exact : false } ) ).toBeVisible(); // What: Owner Note Assertion. Why: The owner is told why there's no leave. How: This waits for the note.

	await namInpObj.fill( '' ); // What: Empty Fill Call. Why: An empty name is refused. How: This clears the box.

	await curPagObj.getByRole( 'button', { name : 'Save' } ).click(); // What: Save Click Call. Why: The form is checked as it's sent. How: This presses Save.

	await expect( curPagObj.locator( '#detNamErr' ) ).toHaveText( 'Enter a name for the group.' ); // What: Problem Assertion. Why: The problem is told beside the box. How: This reads the box's problem.
	await expect( namInpObj ).toBeFocused();                                                       // What: Problem Focus Assertion. Why: Focus lands where the problem is. How: This expects the box focused.
	await expect( namInpObj ).toHaveAttribute( 'aria-invalid', 'true' );                           // What: Invalid Assertion. Why: A screen reader hears the box has a problem. How: This reads its state.

	await namInpObj.fill( '  Beach   Week ' ); // What: Name Fill Call. Why: The name is saved tidied. How: This types it with extra spaces.

	await curPagObj.getByLabel( 'Hold unreceived messages for' ).selectOption( '60' ); // What: Retention Choice Call. Why: The owner sets how long the server holds a message. How: This picks 60 days.

	await curPagObj.getByRole( 'button', { name : 'Save' } ).click(); // What: Save Click Call. Why: The settings are sent. How: This presses Save.

	await expect( curPagObj.getByRole( 'main' ).getByRole( 'status' ) ).toHaveText( "Saved the group's settings." ); // What: Saved Status Assertion. Why: The save is announced. How: This reads the status.
	await expect( namInpObj ).toHaveValue( 'Beach Week' );                                                       // What: Tidied Name Assertion. Why: The box shows the name as it was saved. How: This reads its value.
	await expect( namInpObj ).toHaveAttribute( 'aria-invalid', 'false' );                                         // What: Valid Assertion. Why: The fixed name has no problem. How: This reads its state.
	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Week' } ) ).toBeVisible();          // What: Bar Name Assertion. Why: The group's new name shows at once. How: This reads the bar's heading.

	expect( await docReaFun( setEnvObj, `groups/${ groIdeStr }` ) ).toMatchObject( { chatTtlDays : 60, name : 'Beach Week' } ); // What: Saved Group Assertion. Why: The group holds its new settings. How: This expects both.


} );



test( 'the owner deletes a group only once its name is typed, focus landing on the next group, then the welcome', async ( { page : curPagObj } ) => { // What: Delete Test. Why: A deletion can't be undone, so it waits for the group's name (Section 9), and focus mustn't fall to the page once the group is gone. How: This tries a wrong name and Escape, then deletes both groups in turn, checking the focus, the status, and the deleted group.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The deleted group is read back. How: This creates the first group by name. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Book Club', 'Alice' ); // What: Second Group Call. Why: A deletion lands on the next group when there is one. How: This creates it.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the groups, Beach Day first by name. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The deletion is in the Settings section. How: This opens it.


	const delButObj = curPagObj.getByRole( 'button', { name : 'Delete group' } );              // What: Delete Button Object. Why: The checks open the confirmation and expect focus back on it. How: This finds the button.
	const delInpObj = curPagObj.getByLabel( "Type the group's name to confirm" );              // What: Delete Input Object. Why: The checks type the name and expect focus in the box. How: This finds it.
	const delSubObj = curPagObj.getByRole( 'button', { name : 'Delete for everyone' } );       // What: Delete Submit Object. Why: The checks confirm the deletion. How: This finds the answer.
	const hosStaObj = curPagObj.getByRole( 'status' ).filter( { hasText : 'Deleted' } );       // What: Host Status Object. Why: The section goes with the group, so the host announces the deletion. How: This finds its status by its message.


	await delButObj.click(); // What: Delete Click Call. Why: The owner starts the deletion. How: This opens the confirmation.

	await expect( delInpObj ).toBeFocused(); // What: Box Focus Assertion. Why: Typing the name is the next step. How: This expects the box focused.

	await delInpObj.fill( 'Beach' ); // What: Wrong Fill Call. Why: A name that doesn't match is refused. How: This types part of it.

	await delSubObj.click(); // What: Wrong Submit Call. Why: The confirmation checks the name. How: This presses the answer.

	await expect( curPagObj.locator( '#delNamErr' ) ).toHaveText( "That isn't the group's name. Type it as it's shown above." ); // What: Mismatch Assertion. Why: The problem is told beside the box. How: This reads it.
	await expect( delInpObj ).toBeFocused();                                                                                     // What: Mismatch Focus Assertion. Why: The owner fixes the name where it is. How: This expects the box focused.

	await delInpObj.press( 'Escape' ); // What: Escape Press Call. Why: Escape leaves the confirmation. How: This presses it in the box.

	await expect( delButObj ).toBeFocused(); // What: Return Focus Assertion. Why: Leaving the confirmation returns focus to its button. How: This expects the button focused.

	await delButObj.click(); // What: Reopen Click Call. Why: The owner starts again. How: This opens the confirmation.

	await expect( delInpObj ).toHaveValue( '' ); // What: Fresh Box Assertion. Why: A new confirmation starts empty. How: This reads the box.

	await delInpObj.fill( 'Beach Day' ); // What: Name Fill Call. Why: The exact name confirms. How: This types it.

	await delSubObj.click(); // What: Confirm Click Call. Why: The owner deletes the group. How: This presses the answer.

	await expect( hosStaObj ).toHaveText( 'Deleted Beach Day.' );                                  // What: Deleted Status Assertion. Why: The deletion is announced. How: This reads the host's status.
	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Book Club' } ) ).toBeFocused(); // What: Next Group Focus Assertion. Why: The next group replaces the one deleted. How: This expects its heading focused.

	expect( await docReaFun( setEnvObj, `groups/${ groIdeStr }` ) ).toBeUndefined(); // What: Gone Group Assertion. Why: The deletion reached the server. How: This expects the group gone.

	await secOpeFun( curPagObj ); // What: Second Section Call. Why: The last group is deleted from its own Settings. How: This opens them.

	await delButObj.click(); // What: Second Delete Click Call. Why: The owner deletes the last group too. How: This opens the confirmation.

	await delInpObj.fill( 'Book Club' ); // What: Second Name Fill Call. Why: The exact name confirms. How: This types it.

	await delSubObj.click(); // What: Second Confirm Click Call. Why: The owner deletes it. How: This presses the answer.

	await expect( hosStaObj ).toHaveText( 'Deleted Book Club.' );                                      // What: Second Status Assertion. Why: The deletion is announced. How: This reads the host's status.
	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Come Hang' } ) ).toBeFocused(); // What: Welcome Focus Assertion. Why: With no group left, the welcome replaces it. How: This expects its heading focused.


} );



pagTesObj( 'a member sees the settings without the form and leaves after confirming, focus landing on the welcome', async ( { page : curPagObj, secPagObj } ) => { // What: Leave Test. Why: Any member but the owner can always leave (Section 9), and focus mustn't fall to the page once the group is gone. How: This checks the member's view, opens and closes the confirmation, then leaves, checking the focus, the status, and the membership.


	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr } = await memSetFun( setEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The left membership is read back. How: This creates the group with an owner and a member. // What: UID Member String. Why: The membership is named by the member's UID. How: This takes it from the setup.


	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member leaves from their own device. How: This opens the app on it.

	await secOpeFun( secPagObj ); // What: Member Section Call. Why: The leave is in the Settings section. How: This opens it.


	const leaButObj = secPagObj.getByRole( 'button', { name : 'Leave group' } ); // What: Leave Button Object. Why: The checks open the confirmation and expect focus back on it. How: This finds the button.
	const staButObj = secPagObj.getByRole( 'button', { name : 'Stay' } );        // What: Stay Button Object. Why: The confirmation's safe answer takes focus. How: This finds it.


	await expect( secPagObj.getByRole( 'button', { name : 'Save' } ) ).toHaveCount( 0 );                     // What: No Form Assertion. Why: Only the owner changes the settings. How: This expects no Save.
	await expect( secPagObj.getByText( "Only the group's owner changes these." ) ).toBeVisible();          // What: Owner Note Assertion. Why: The member is told who changes them. How: This waits for the note.
	await expect( secPagObj.getByRole( 'definition' ) ).toHaveText( [ 'Beach Day', '30 days' ] );           // What: Values Assertion. Why: The member still sees the settings. How: This reads both values.
	await expect( secPagObj.getByRole( 'button', { name : 'Delete group' } ) ).toHaveCount( 0 );             // What: No Delete Assertion. Why: Only the owner deletes the group. How: This expects no button.

	await leaButObj.click(); // What: Leave Click Call. Why: The member starts to leave. How: This opens the confirmation.

	await expect( secPagObj.getByText( 'Leave Beach Day?' ) ).toBeVisible(); // What: Question Assertion. Why: The member sees which group they're leaving. How: This waits for the question.
	await expect( staButObj ).toBeFocused();                                  // What: Stay Focus Assertion. Why: Focus lands on the safe answer. How: This expects Stay focused.

	await staButObj.click(); // What: Stay Click Call. Why: The member changes their mind. How: This presses Stay.

	await expect( leaButObj ).toBeFocused(); // What: Return Focus Assertion. Why: Leaving the confirmation returns focus to its button. How: This expects the button focused.

	await leaButObj.click(); // What: Second Leave Click Call. Why: The member leaves after all. How: This opens the confirmation again.

	await secPagObj.getByRole( 'button', { name : 'Yes, leave' } ).click(); // What: Confirm Click Call. Why: The member confirms. How: This presses the answer.

	await expect( secPagObj.getByRole( 'status' ).filter( { hasText : 'You left' } ) ).toHaveText( 'You left Beach Day.' ); // What: Left Status Assertion. Why: The leave is announced. How: This reads the host's status.
	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Come Hang' } ) ).toBeFocused();                     // What: Welcome Focus Assertion. Why: With no group left, the welcome replaces it. How: This expects its heading focused.

	expect( await docReaFun( setEnvObj, `groups/${ groIdeStr }/members/${ uidMemStr }` ) ).toBeUndefined(); // What: Gone Membership Assertion. Why: The leave reached the server. How: This expects the membership gone.


} );

// #endregion Module Init


