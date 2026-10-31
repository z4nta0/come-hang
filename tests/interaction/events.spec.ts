


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the Events section shows what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: A member who didn't plan an event needs a group with two. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member looks from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups and events are made the way the app makes them. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * events.spec.ts = Events Spec
 *
 * @summary
 * Checks the Events section as people use it, in whichever engine the
 * project runs, against the Emulator Suite: the form refuses empty and
 * out-of-order fields, focusing the first, and plans an event that's
 * announced and listed; the event's creator changes it and cancels it after
 * confirming, focus landing on the heading; and a member who didn't plan it
 * sees its details without the creator's controls.
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

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: Event times are set in days. How: This is one day in milliseconds.

// #endregion Constants



// #region Module State

let eveEnvObj : RulesTestEnvironment; // What: Events Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region fieValFun

/**
 * fieValFun = Field Value Function
 *
 * @summary
 * Formats a time as a date and time field's value, YYYY-MM-DDTHH:MM in the
 * test's own time zone, which the browser shares.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param timValNum - Time Value Number: The time, in milliseconds.
 *
 * @returns The field's value.
 *
 * @example
 * ```ts
 * fieValFun(Date.now()) // => '2026-11-01T18:00'
 * ```
 *
*/

const fieValFun = ( timValNum : number ) : string => { // What: Field Value Function. Why: The form's time fields are filled as a person would type them. How: This writes the local date and time in the field's form.


	const timDatObj = new Date( timValNum ); // What: Time Date Object. Why: The parts are read in local time. How: This wraps the time.


	const padTwoFun = ( parValNum : number ) : string => String( parValNum ).padStart( 2, '0' ); // What: Pad Two Function. Why: The field's form writes each part in two digits. How: This pads a part with a leading zero.



	return `${ timDatObj.getFullYear() }-${ padTwoFun( timDatObj.getMonth() + 1 ) }-${ padTwoFun( timDatObj.getDate() ) }T${ padTwoFun( timDatObj.getHours() ) }:${ padTwoFun( timDatObj.getMinutes() ) }`; // What: Value Return. Why: The field reads this form. How: This joins the year, month, day, hours, and minutes.


};

// #endregion fieValFun



const secOpeFun = async ( curPagObj : Page ) : Promise< void > => { // What: Section Open Function. Why: Each test works in the Events section. How: This presses its tab and waits for its heading.


	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Events' } ).click(); // What: Tab Click Call. Why: The section opens from its tab. How: This presses it.

	await expect( curPagObj.getByRole( 'heading', { level : 2, name : 'Events' } ) ).toBeVisible(); // What: Section Wait. Why: The section has to show before it's used. How: This waits for its heading.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	eveEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The member setup reads through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await eveEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( 'the form refuses empty and out-of-order fields, then plans an event that is announced and listed', async ( { page : curPagObj } ) => { // What: Plan Test. Why: Any member plans an event, and a problem is told beside its field (Section 14). How: This submits the form empty and then with an end before its start, checking each problem and the focus, then plans the event and checks the status, the list, and the focus.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The section is used on a phone. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ); // What: Group Create Call. Why: Events belong to a group. How: This creates one.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The test plans from the Events section. How: This opens it.

	await expect( curPagObj.getByText( 'Nothing planned yet.' ) ).toBeVisible(); // What: Empty Note Assertion. Why: A new group has nothing planned, and says so. How: This waits for the note.

	await curPagObj.getByRole( 'button', { name : 'Plan an event' } ).click(); // What: Plan Click Call. Why: The form opens from the button. How: This presses it.


	const forDiaObj = curPagObj.getByRole( 'dialog', { name : 'Plan an event' } ); // What: Form Dialog Object. Why: The checks work in the form's sheet. How: This finds it.
	const staTimNum = Date.now() + DAY_MIL_NUM;                                    // What: Start Time Number. Why: The event starts tomorrow. How: This is a day from now.


	await forDiaObj.getByRole( 'button', { name : 'Plan event' } ).click(); // What: Empty Submit Call. Why: An empty form is refused. How: This presses the button with nothing filled in.

	await expect( forDiaObj.getByLabel( 'Title' ) ).toBeFocused();                             // What: Title Focus Assertion. Why: Focus lands on the first field with a problem. How: This expects the title focused.
	await expect( forDiaObj.getByText( 'Give the event a title.' ) ).toBeVisible();            // What: Title Problem Assertion. Why: An empty title says so. How: This waits for its message.
	await expect( forDiaObj.getByText( 'Choose when it starts.' ) ).toBeVisible();             // What: Start Problem Assertion. Why: An empty start says so. How: This waits for its message.
	await expect( forDiaObj.getByLabel( 'Title' ) ).toHaveAttribute( 'aria-invalid', 'true' ); // What: Title Invalid Assertion. Why: A screen reader hears the field has a problem. How: This reads its state.

	await forDiaObj.getByLabel( 'Title' ).fill( '  Beach   picnic ' ); // What: Title Fill Call. Why: A title is required. How: This types an untidy one.

	await forDiaObj.getByLabel( 'Starts' ).fill( fieValFun( staTimNum ) );         // What: Start Fill Call. Why: A start is required. How: This chooses tomorrow.
	await forDiaObj.getByLabel( 'Ends' ).fill( fieValFun( staTimNum - 3600000 ) ); // What: End Fill Call. Why: An end before the start is refused. How: This chooses an hour before it.

	await forDiaObj.getByRole( 'button', { name : 'Plan event' } ).click(); // What: Order Submit Call. Why: The end comes before the start. How: This presses the button.

	await expect( forDiaObj.getByLabel( 'Ends' ) ).toBeFocused();                          // What: End Focus Assertion. Why: The end is now the first field with a problem. How: This expects it focused.
	await expect( forDiaObj.getByText( 'Choose an end after the start.' ) ).toBeVisible(); // What: Order Problem Assertion. Why: An end before the start says so. How: This waits for its message.

	await forDiaObj.getByLabel( 'Ends' ).fill( fieValFun( staTimNum + 3 * 3600000 ) ); // What: End Fix Call. Why: The end comes after the start. How: This chooses three hours after it.

	await forDiaObj.getByRole( 'button', { name : 'Plan event' } ).click(); // What: Plan Submit Call. Why: The form is ready to save. How: This presses the button.

	await expect( forDiaObj ).toBeHidden();                                                                                  // What: Form Closed Assertion. Why: A saved event closes the form. How: This waits for the sheet to close.
	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'Planned' } ) ).toHaveText( 'Planned Beach picnic.' ); // What: Planned Status Assertion. Why: The plan is announced, with its title tidied. How: This reads the status.
	await expect( curPagObj.getByRole( 'button', { name : /Beach picnic/ } ) ).toBeVisible();                                // What: Listed Assertion. Why: The planned event shows in the list. How: This waits for its card.
	await expect( curPagObj.getByRole( 'button', { name : 'Plan an event' } ) ).toBeFocused();                               // What: Focus Return Assertion. Why: Closing the form returns focus to what opened it. How: This expects the plan button focused.


} );



test( "an event's creator changes it, then cancels it after confirming, and focus lands on the heading", async ( { page : curPagObj } ) => { // What: Change And Cancel Test. Why: The creator or owner changes or cancels an event (Section 11.5). How: This plans an event, changes its title from its sheet, then cancels it, checking the status, the sheet, the list, and the focus.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The section is used on a phone. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const staTimNum = Date.now() + DAY_MIL_NUM;                                                                          // What: Start Time Number. Why: The event starts tomorrow. How: This is a day from now.


	await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ); // What: Event Create Call. Why: The test changes an existing event. How: This plans an hour-long picnic.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the group. How: This opens it.

	await secOpeFun( curPagObj ); // What: Section Open Call. Why: The test works in the Events section. How: This opens it.

	await curPagObj.getByRole( 'button', { name : /Picnic/ } ).click(); // What: Card Click Call. Why: The card opens the event's sheet. How: This presses it.


	const detDiaObj = curPagObj.getByRole( 'dialog', { name : 'Picnic' } ); // What: Details Dialog Object. Why: The checks work in the event's sheet. How: This finds it.


	await expect( detDiaObj ).toContainText( 'Central Park' ); // What: Details Assertion. Why: The sheet shows the event's details. How: This reads its place.

	await detDiaObj.getByRole( 'button', { name : 'Change' } ).click(); // What: Change Click Call. Why: The creator changes the event. How: This opens the form over the sheet.


	const forDiaObj = curPagObj.getByRole( 'dialog', { name : 'Change event' } ); // What: Form Dialog Object. Why: The change is made in the form. How: This finds its sheet.


	await expect( forDiaObj.getByLabel( 'Title' ) ).toHaveValue( 'Picnic' );       // What: Filled Title Assertion. Why: The form starts from the event's details. How: This reads the title.
	await expect( forDiaObj.getByLabel( 'Place' ) ).toHaveValue( 'Central Park' ); // What: Filled Place Assertion. Why: The form starts from the event's details. How: This reads the place.

	await forDiaObj.getByLabel( 'Title' ).fill( 'Park picnic' ); // What: Title Change Call. Why: The change is to the title. How: This types the new one.

	await forDiaObj.getByRole( 'button', { name : 'Save changes' } ).click(); // What: Save Click Call. Why: The change is saved. How: This presses the button.

	await expect( forDiaObj ).toBeHidden();                                                                             // What: Form Closed Assertion. Why: A saved change closes the form. How: This waits for its sheet to close.
	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'Saved' } ) ).toHaveText( 'Saved Park picnic.' ); // What: Saved Status Assertion. Why: The change is announced. How: This reads the status.
	await expect( curPagObj.getByRole( 'dialog', { name : 'Park picnic' } ) ).toBeVisible();                            // What: Renamed Sheet Assertion. Why: The open sheet shows the changed event. How: This waits for its new title.

	await curPagObj.getByRole( 'button', { name : 'Cancel event' } ).click(); // What: Cancel Click Call. Why: Cancelling asks to confirm first. How: This presses the button.

	await expect( curPagObj.getByText( 'Cancel Park picnic for everyone?' ) ).toBeVisible(); // What: Confirm Assertion. Why: The member is asked before the event goes. How: This waits for the question.

	await curPagObj.getByRole( 'button', { name : 'Yes, cancel it' } ).click(); // What: Confirm Click Call. Why: The cancel is confirmed. How: This presses the button.

	await expect( curPagObj.getByRole( 'dialog' ) ).toHaveCount( 0 );                                                           // What: Sheet Closed Assertion. Why: A cancelled event's sheet closes. How: This waits for no open dialog.
	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'Cancelled' } ) ).toHaveText( 'Cancelled Park picnic.' ); // What: Cancelled Status Assertion. Why: The cancel is announced. How: This reads the status.
	await expect( curPagObj.getByText( 'Nothing planned yet.' ) ).toBeVisible();                                                // What: Emptied List Assertion. Why: The cancelled event leaves the list. How: This waits for the empty note.
	await expect( curPagObj.getByRole( 'heading', { level : 2, name : 'Events' } ) ).toBeFocused();                             // What: Heading Focus Assertion. Why: The card that opened the sheet is gone, so focus lands on the heading. How: This expects it focused.


} );



pagTesObj( "a member who didn't plan an event sees its details without the creator's controls", async ( { page : curPagObj, secPagObj } ) => { // What: Member View Test. Why: Only the creator or owner changes or cancels an event (Section 11.5). How: This plans an event as the owner and opens it as the member, checking its details show without the controls.


	await secPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The member looks on a phone. How: This sizes their page as one.

	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr } = await memSetFun( eveEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The event is planned in this group. How: This creates it with an owner and a member.

	const staTimNum = Date.now() + DAY_MIL_NUM; // What: Start Time Number. Why: The event starts tomorrow. How: This is a day from now.


	await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ); // What: Event Create Call. Why: The owner plans the event, not the member. How: This plans it as the owner.

	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member looks at the group. How: This opens the app on their device.

	await secOpeFun( secPagObj ); // What: Section Open Call. Why: The member looks in the Events section. How: This opens it.

	await secPagObj.getByRole( 'button', { name : /Picnic/ } ).click(); // What: Card Click Call. Why: The member opens the event. How: This presses its card.


	const detDiaObj = secPagObj.getByRole( 'dialog', { name : 'Picnic' } ); // What: Details Dialog Object. Why: The checks read the event's sheet. How: This finds it.


	await expect( detDiaObj ).toContainText( 'Central Park' );                                   // What: Details Assertion. Why: Any member reads the event. How: This reads its place.
	await expect( detDiaObj.getByRole( 'button', { name : 'Change' } ) ).toHaveCount( 0 );       // What: No Change Assertion. Why: Only the creator or owner changes it. How: This expects no Change button.
	await expect( detDiaObj.getByRole( 'button', { name : 'Cancel event' } ) ).toHaveCount( 0 ); // What: No Cancel Assertion. Why: Only the creator or owner cancels it. How: This expects no Cancel event button.


} );

// #endregion Module Init


