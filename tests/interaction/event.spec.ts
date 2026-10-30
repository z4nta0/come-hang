


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the event's sheet and panel show what they should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: A claim from another member needs a group with two. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member claims from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups, events, and items are made the way the app makes them. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The event helper drives a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * event.spec.ts = Event Spec
 *
 * @summary
 * Checks the next event's sheet and panel as people use them, in whichever
 * engine the project runs, against the Emulator Suite: on a phone the pinned
 * card opens a sheet with the event's details, where an item is added,
 * claimed, let go, and removed, each change announced; from 1,100px wide a
 * panel replaces the card; a label outside its limits is refused with an
 * alert; and another member's claim shows in the panel as it lands.
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

let eveEnvObj : RulesTestEnvironment; // What: Event Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region evePlaFun

/**
 * evePlaFun = Event Plan Function
 *
 * @summary
 * Plans a picnic a day from now in a group, with a note and one open item on
 * its list, then opens the app on the group, so its chat shows the event.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page whose identity plans it.
 * @param groIdeStr - Group Identifier String: The group to plan it in.
 *
 * @returns A promise that resolves with the event's ID.
 *
 * @example
 * ```ts
 * evePlaFun(page, groIdeStr) // => 'Ev7...'
 * ```
 *
*/

const evePlaFun = async ( curPagObj : Page, groIdeStr : string ) : Promise< string > => { // What: Event Plan Function. Why: Every test starts from a group with a planned event. How: This plans one with an item and opens the app.


	const staTimNum = Date.now() + 86400000; // What: Start Time Number. Why: The event is still to come. How: This starts it a day from now.

	const eveIdeStr = await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : 'Bring a blanket.', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: Items belong to the event. How: This plans an hour-long picnic. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.


	await runPagFun( curPagObj, '/src/state/items.ts', 'iteAddFun', groIdeStr, eveIdeStr, 'Lemonade', null ); // What: Item Add Call. Why: The list starts with an open item. How: This adds it.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The chat shows the event. How: This opens the app on the group.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The event shows once the group has loaded. How: This waits for its heading.



	return eveIdeStr;


};

// #endregion evePlaFun

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



test( 'on a phone the pinned event opens a sheet where items are added, claimed, let go, and removed, each announced', async ( { page : curPagObj } ) => { // What: Event Sheet Test. Why: The next event opens its details and bring-list over the chat (Section 14). How: This opens the sheet from the card, changes an item each way, checking the list and the status after each, then closes the sheet.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The card opens a sheet below 1,100px wide. How: This sizes the page as a phone.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await evePlaFun( curPagObj, groIdeStr ); // What: Event Plan Call. Why: The chat pins the event. How: This plans it and opens the app.

	await curPagObj.getByRole( 'button', { name : /Picnic/ } ).click(); // What: Card Click Call. Why: The card opens the sheet. How: This presses it.


	const sheDiaObj = curPagObj.getByRole( 'dialog', { name : 'Picnic' } ); // What: Sheet Dialog Object. Why: The checks read the sheet. How: This finds it by the event's title.
	const staParObj = sheDiaObj.getByRole( 'status' );                      // What: Status Paragraph Object. Why: Each change is announced. How: This finds the sheet's status.


	await expect( sheDiaObj ).toContainText( 'Central Park' );     // What: Place Assertion. Why: The details say where it is. How: This reads the sheet.
	await expect( sheDiaObj ).toContainText( 'Bring a blanket.' ); // What: Note Assertion. Why: The details show the event's note. How: This reads the sheet.
	await expect( staParObj ).toHaveText( '' );                    // What: Empty Status Assertion. Why: The status is in the page and empty before anything changes, so its first message is heard. How: This reads it.

	await sheDiaObj.getByLabel( 'Add to the list' ).fill( '  Paper   plates ' ); // What: Label Fill Call. Why: An item is added from the box. How: This types an untidy label.

	await sheDiaObj.getByLabel( 'Add to the list' ).press( 'Enter' ); // What: Add Press Call. Why: Enter adds what's typed. How: This presses it in the box.


	const plaIteObj = sheDiaObj.getByRole( 'listitem' ).filter( { hasText : 'Paper plates' } ); // What: Plates Item Object. Why: The next checks read the new item's row. How: This finds it.


	await expect( plaIteObj ).toContainText( 'Open' );                           // What: Added Open Assertion. Why: A new item is open for anyone to claim. How: This waits for its row.
	await expect( staParObj ).toHaveText( 'Added Paper plates.' );               // What: Added Status Assertion. Why: The addition is announced, with its label tidied. How: This reads the status.
	await expect( sheDiaObj.getByLabel( 'Add to the list' ) ).toHaveValue( '' ); // What: Cleared Box Assertion. Why: An added item leaves the box empty. How: This reads the box.

	await plaIteObj.getByRole( 'button', { name : "I'll bring it (Paper plates)" } ).click(); // What: Claim Click Call. Why: The member takes the item. How: This presses its claim button.

	await expect( plaIteObj ).toContainText( 'You' );                        // What: Claimed Assertion. Why: A claim names the member who made it. How: This waits for "You" in the row.
	await expect( staParObj ).toHaveText( "You're bringing Paper plates." ); // What: Claimed Status Assertion. Why: The claim is announced. How: This reads the status.

	await plaIteObj.getByRole( 'button', { name : 'Let go (Paper plates)' } ).click(); // What: Release Click Call. Why: The member lets go of the item. How: This presses its release button.

	await expect( plaIteObj ).toContainText( 'Open' );                     // What: Released Assertion. Why: A released item is open again. How: This waits for "Open" in the row.
	await expect( staParObj ).toHaveText( 'Paper plates is open again.' ); // What: Released Status Assertion. Why: The release is announced. How: This reads the status.

	await plaIteObj.getByRole( 'button', { name : 'Remove Paper plates' } ).click(); // What: Remove Click Call. Why: The member removes the item. How: This presses its remove button.

	await expect( plaIteObj ).toHaveCount( 0 );                      // What: Removed Assertion. Why: A removed item leaves the list. How: This waits for its row to go.
	await expect( staParObj ).toHaveText( 'Removed Paper plates.' ); // What: Removed Status Assertion. Why: The removal is announced. How: This reads the status.

	await sheDiaObj.getByRole( 'button', { name : 'Close' } ).click(); // What: Close Click Call. Why: The sheet closes from its button. How: This presses it.

	await expect( sheDiaObj ).toBeHidden(); // What: Closed Assertion. Why: The sheet slides away. How: This waits for it to close.

	await expect( curPagObj.getByRole( 'button', { name : /Picnic/ } ) ).toBeFocused(); // What: Focus Return Assertion. Why: Closing returns focus to what opened the sheet. How: This expects the card focused.


} );



test( 'from 1,100px wide a panel shows the next event in place of the pinned card', async ( { page : curPagObj } ) => { // What: Event Panel Test. Why: A wide screen has room for the next event beside the chat (Section 14). How: This checks the panel and the card a pixel either side of 1,100px.


	await curPagObj.setViewportSize( { height : 900, width : 1100 } ); // What: Wide Size Call. Why: The panel shows from 1,100px. How: This sizes the page at the breakpoint.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await evePlaFun( curPagObj, groIdeStr ); // What: Event Plan Call. Why: The chat shows the event. How: This plans it and opens the app.


	const panAsiObj = curPagObj.getByRole( 'complementary', { name : 'Picnic' } ); // What: Panel Aside Object. Why: The checks read the panel. How: This finds it by the event's title.
	const pinButObj = curPagObj.getByRole( 'button', { name : /Picnic/ } );        // What: Pinned Button Object. Why: The checks read the card. How: This finds it.


	await expect( panAsiObj ).toContainText( 'Lemonade' ); // What: Panel List Assertion. Why: The panel shows the bring-list. How: This waits for its item.
	await expect( pinButObj ).toBeHidden();                // What: Card Hidden Assertion. Why: The panel already shows the event. How: This expects no card.

	await curPagObj.setViewportSize( { height : 900, width : 1099 } ); // What: Narrower Size Call. Why: Below 1,100px the card returns. How: This narrows the page by a pixel.

	await expect( pinButObj ).toBeVisible(); // What: Card Shown Assertion. Why: The event is pinned again. How: This waits for the card.
	await expect( panAsiObj ).toBeHidden();  // What: Panel Hidden Assertion. Why: The card replaces the panel. How: This expects no panel.


} );



test( 'a label outside its limits is refused with an alert, keeping what was typed', async ( { page : curPagObj } ) => { // What: Label Limits Test. Why: A failed change has to be told, and the text kept to fix (Section 11.10). How: This lifts the box's length cap, adds a label one character too long, and checks the alert, the box, and the list.


	await curPagObj.setViewportSize( { height : 900, width : 1440 } ); // What: Wide Size Call. Why: The panel's form is on screen without opening a sheet. How: This sizes the page as a desktop.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await evePlaFun( curPagObj, groIdeStr ); // What: Event Plan Call. Why: The panel shows the event. How: This plans it and opens the app.


	const panAsiObj = curPagObj.getByRole( 'complementary', { name : 'Picnic' } ); // What: Panel Aside Object. Why: The checks read the panel. How: This finds it.
	const addInpObj = panAsiObj.getByLabel( 'Add to the list' );                   // What: Add Input Object. Why: The long label is typed there. How: This finds the box.


	await addInpObj.evaluate( ( addCurEle ) => addCurEle.removeAttribute( 'maxlength' ) ); // What: Cap Lift Call. Why: The box stops typing at 50 characters, so the app's own check is reached only past it. How: This removes the cap.

	await addInpObj.fill( 'a'.repeat( 51 ) ); // What: Long Label Fill Call. Why: A label has at most 50 characters. How: This types 51.

	await addInpObj.press( 'Enter' ); // What: Add Press Call. Why: The form tries to add it. How: This presses Enter.

	await expect( panAsiObj.getByRole( 'alert' ) ).toHaveText( 'Use 1 to 50 characters.' ); // What: Alert Assertion. Why: The refusal is announced and says what's allowed. How: This reads the alert.
	await expect( addInpObj ).toHaveValue( 'a'.repeat( 51 ) );                              // What: Kept Text Assertion. Why: The text stays to fix. How: This reads the box.
	await expect( panAsiObj.getByRole( 'listitem' ) ).toHaveCount( 1 );                     // What: Unchanged List Assertion. Why: Nothing was added. How: This expects the one item.


} );



pagTesObj( "another member's claim shows in the panel as it lands, in their name", async ( { page : curPagObj, secPagObj } ) => { // What: Live Claim Test. Why: Members see who's bringing what without reopening anything (Section 7). How: This shows the panel as the owner while the member claims the open item from their own device.


	await curPagObj.setViewportSize( { height : 900, width : 1440 } ); // What: Wide Size Call. Why: The panel shows the list without opening a sheet. How: This sizes the page as a desktop.

	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr } = await memSetFun( eveEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The member claims in this group. How: This creates it with an owner and a member.

	const eveIdeStr = await evePlaFun( curPagObj, groIdeStr ); // What: Event Identifier String. Why: The member claims the event's item. How: This plans the event and opens the owner's app.

	const lemIteObj = curPagObj.getByRole( 'complementary', { name : 'Picnic' } ).getByRole( 'listitem' ).filter( { hasText : 'Lemonade' } ); // What: Lemonade Item Object. Why: The checks read the item's row. How: This finds it in the panel.


	await expect( lemIteObj ).toContainText( 'Open' ); // What: Open Assertion. Why: The item starts open. How: This waits for its row.


	const iteRecArr = await runPagFun( secPagObj, '/src/state/items.ts', 'iteLisFun', groIdeStr, eveIdeStr ) as { iteIdeStr : string }[]; // What: Item Record Array. Why: The member claims the item by its ID. How: This lists the event's items as the member. // What: Type Assertion Note. Why: iteLisFun resolves with the item records. How: The as reads each one's ID.


	await runPagFun( secPagObj, '/src/state/items.ts', 'iteClaFun', groIdeStr, eveIdeStr, iteRecArr[ 0 ].iteIdeStr ); // What: Member Claim Call. Why: Another member's claim should reach the owner. How: This claims the item as the member.

	await expect( lemIteObj ).toContainText( 'Dana Lee' );                                        // What: Member Claim Assertion. Why: The claim names the member who made it. How: This waits for their name in the owner's panel.
	await expect( lemIteObj.getByRole( 'button', { name : /I'll bring it/ } ) ).toHaveCount( 0 ); // What: No Claim Button Assertion. Why: A claimed item can't be claimed again. How: This expects no claim button on it.


} );

// #endregion Module Init


