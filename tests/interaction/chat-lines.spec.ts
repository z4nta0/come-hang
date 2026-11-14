


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the chat shows the lines it should and the line opens the list. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { joiWaiFun                 } from '../support/client.ts';         // What: Join Wait Function. Why: The member's own lines have to land after their join by the server's clock. How: This waits until it's safe to send.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: The lines go from one member to another. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member changes the list from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: The event and its first item are made the way the app makes them. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: The single-page test and the suite's hooks are declared on it. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * chat-lines.spec.ts = Chat Lines Spec
 *
 * @summary
 * Checks the chat lines that lead to an event, in whichever engine the
 * project runs, against the Emulator Suite: items added and claimed in one
 * visit post one line for each kind once the member leaves the list, leaving
 * out what they took back, and another member's tap on a line opens the
 * event at its list, while a photos line opens it at its photos.
 *
 * Sections:
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let briEnvObj : RulesTestEnvironment; // What: Bring Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	briEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The member setup reads through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await briEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj( 'items added and claimed post one line for each kind once the member leaves the list, leaving out what they took back, and a line opens the event at its list', async ( { page : curPagObj, secPagObj } ) => { // What: Bring Lines Test. Why: The group hears what's on the list and who's bringing what without a line for every change (Section 11.5). How: This changes the list as the member, closes it, checks both chats for the two lines, then opens the list from the owner's.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Owner Size Call. Why: On a phone the line opens the event's sheet. How: This sizes the owner's page as one.
	await secPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Member Size Call. Why: On a phone the list sits in a sheet, which closing ends the visit. How: This sizes the member's page as one.

	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr } = await memSetFun( briEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The event is planned in this group. How: This creates it with an owner and a member. // What: UID Member String. Why: The member's join time is waited out. How: This reads the member's UID.

	const staTimNum = Date.now() + 86400000; // What: Start Time Number. Why: The event is still to come, so the chat pins it. How: This starts it a day from now.
	const eveIdeStr = await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: The list belongs to this event. How: This plans it as the owner. // What: Type Assertion Note. Why: eveCreFun resolves with the new event's ID. How: The as reads it as one.


	await runPagFun( curPagObj, '/src/state/items.ts', 'iteAddFun', groIdeStr, eveIdeStr, 'Lemonade', null ); // What: Item Add Call. Why: The member claims an item already on the list. How: This adds it, open.

	for ( const labTexStr of Array.from( Array( 12 ).keys(), ( iteIndNum ) => `Cups ${ iteIndNum + 1 }` ) ) await runPagFun( curPagObj, '/src/state/items.ts', 'iteAddFun', groIdeStr, eveIdeStr, labTexStr, null ); // What: Long List Loop. Why: Opening at the list has to differ from opening at the top or the photos, which a short sheet shows all at once. How: This adds twelve more open items.



	await secPagObj.addInitScript( () => window.addEventListener( 'visibilitychange', ( visEveObj ) => visEveObj.stopImmediatePropagation(), true ) ); // What: Visibility Block Call. Why: Headless pages can turn hidden on their own, and a hidden page posts its lines too, so only leaving the list may post them here. How: This stops the page hearing that it's hidden, ahead of the app's own listener.

	await joiWaiFun( briEnvObj, groIdeStr, uidMemStr ); // What: Join Wait Call. Why: A line stamped before the member's join by a clock that stepped back would hide from their own chat. How: This waits out the join.

	await curPagObj.goto( '/' ); // What: Owner Open Call. Why: The owner watches the chat. How: This opens the app on the group.
	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member changes the list. How: This opens the app on the group.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Owner Group Wait. Why: The chat shows once the group has loaded. How: This waits for its heading.
	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Member Group Wait. Why: The pinned event shows once the group has loaded. How: This waits for its heading.

	await secPagObj.getByRole( 'button', { name : /Picnic/ } ).click(); // What: Card Click Call. Why: The member opens the event's list. How: This presses the pinned card.


	const sheDiaObj = secPagObj.getByRole( 'dialog', { name : 'Picnic' } ); // What: Sheet Dialog Object. Why: The list's rows and buttons are in the sheet. How: This finds it by the event's title.
	const addInpObj = sheDiaObj.getByLabel( 'Add to the list' );            // What: Add Input Object. Why: The member adds items from the box. How: This finds it in the sheet.
	const staParObj = sheDiaObj.getByRole( 'status' ).first();              // What: Status Paragraph Object. Why: The sheet takes one change at a time, so each is waited out by its announcement. How: This finds the list's status, the sheet's first, ahead of the Photos part's.


	await addInpObj.fill( 'Chips' ); // What: Chips Fill Call. Why: The first item is added. How: This types its label.

	await addInpObj.press( 'Enter' ); // What: Chips Add Call. Why: Enter adds what's typed. How: This presses it.

	await expect( staParObj ).toHaveText( 'Added Chips.' ); // What: Chips Added Wait. Why: The sheet ignores a change while one is out. How: This waits for the addition's announcement.

	await addInpObj.fill( 'Salsa' ); // What: Salsa Fill Call. Why: A second item is added, to be taken back. How: This types its label.

	await addInpObj.press( 'Enter' ); // What: Salsa Add Call. Why: Enter adds what's typed. How: This presses it.

	await expect( staParObj ).toHaveText( 'Added Salsa.' ); // What: Salsa Added Wait. Why: The sheet ignores a change while one is out. How: This waits for the addition's announcement.

	await sheDiaObj.getByRole( 'button', { name : 'Remove Salsa' } ).click(); // What: Salsa Remove Click Call. Why: An item taken back before the line posts leaves it. How: This removes it.

	await expect( staParObj ).toHaveText( 'Removed Salsa.' ); // What: Salsa Removed Wait. Why: The sheet ignores a change while one is out. How: This waits for the removal's announcement.

	await sheDiaObj.getByRole( 'button', { name : "I'll bring it (Lemonade)" } ).click(); // What: Claim Click Call. Why: A claim posts a line of its own kind. How: This takes the item.

	await expect( staParObj ).toHaveText( "You're bringing Lemonade." ); // What: Claim Wait. Why: The sheet closes once the claim lands. How: This waits for the claim's announcement.

	await expect( curPagObj.getByRole( 'button', { name : /to Picnic/ } ) ).toHaveCount( 0 ); // What: No Early Line Assertion. Why: Changes wait for the member to finish rather than posting one by one. How: This expects no line in the owner's chat while the list is open.

	await sheDiaObj.getByRole( 'button', { name : 'Close' } ).click(); // What: Close Click Call. Why: Leaving the list ends the visit, which posts its lines. How: This closes the sheet.

	await expect( secPagObj.getByRole( 'button', { name : "You added Chips to Picnic's list" } ) ).toBeVisible();      // What: Own Added Line. Why: The member's own line names them as "You", and only what stayed on the list. How: This waits for it in their chat.
	await expect( secPagObj.getByRole( 'button', { name : "You're bringing Lemonade to Picnic" } ) ).toBeVisible();    // What: Own Claimed Line. Why: A claim posts its own line. How: This waits for it in their chat.
	await expect( curPagObj.getByRole( 'button', { name : "Dana Lee added Chips to Picnic's list" } ) ).toBeVisible(); // What: Member Added Line. Why: Others see the line in the member's name. How: This waits for it in the owner's chat.
	await expect( curPagObj.getByRole( 'button', { name : /Salsa/ } ) ).toHaveCount( 0 );                              // What: No Removed Item Line. Why: An item taken back isn't named. How: This expects no line naming it.

	await curPagObj.getByRole( 'button', { name : 'Dana Lee is bringing Lemonade to Picnic' } ).click(); // What: Line Click Call. Why: A line about the list leads to it. How: This presses the claimed line.


	const lisHeaObj = curPagObj.getByRole( 'heading', { name : "Who's bringing what" } ); // What: List Heading Object. Why: The list's heading is where the sheet should open. How: This finds it.
	const ownDiaObj = curPagObj.getByRole( 'dialog', { name : 'Picnic' } );               // What: Owner Dialog Object. Why: The heading's place is measured from the owner's sheet. How: This finds the sheet by the event's title.


	await expect( ownDiaObj ).toBeVisible(); // What: Sheet Opened Assertion. Why: The line opens the event. How: This waits for its sheet.

	await expect.poll( async () => ( ( await lisHeaObj.boundingBox() )?.y ?? 9999 ) - ( ( await ownDiaObj.boundingBox() )?.y ?? 0 ) ).toBeLessThan( 150 ); // What: List Top Assertion. Why: A line about the list opens the event at it, past its details, where the heading would otherwise sit about 250px down. How: This waits for the heading to come within 150px of the sheet's top.

	expect( ( ( await lisHeaObj.boundingBox() )?.y ?? -9999 ) - ( ( await ownDiaObj.boundingBox() )?.y ?? 0 ) ).toBeGreaterThanOrEqual( 0 ); // What: List Shown Assertion. Why: A jump past the list, to the photos further down, would also leave its heading near the top, but above the sheet. How: This expects the heading at or below the sheet's top edge.


} );



test( 'a photos line opens its event at its photos', async ( { page : curPagObj } ) => { // What: Photos Line Test. Why: A line saying photos were shared leads to them (Section 20). How: This plans an event with a long list, posts a photos line as the owner, presses it, and waits for the photos to come into view.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: On a phone the line opens the event's sheet. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as one.
	const staTimNum = Date.now() + 86400000;                                                                             // What: Start Time Number. Why: The event is still to come, so the Events section lists it. How: This starts it a day from now.
	const eveIdeStr = await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ) as string; // What: Event Identifier String. Why: The line names this event. How: This plans it. // What: Type Assertion Note. Why: eveCreFun resolves with the new event's ID. How: The as reads it as one.


	for ( const labTexStr of Array.from( Array( 12 ).keys(), ( iteIndNum ) => `Cups ${ iteIndNum + 1 }` ) ) await runPagFun( curPagObj, '/src/state/items.ts', 'iteAddFun', groIdeStr, eveIdeStr, labTexStr, null ); // What: Long List Loop. Why: The photos sit below the list, off the screen until the sheet scrolls to them. How: This adds twelve open items.



	await joiWaiFun( briEnvObj, groIdeStr, ( await runPagFun( curPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr ); // What: Join Wait Call. Why: A line stamped before the owner's join by a clock that stepped back would hide from their own chat. How: This reads the owner's UID and waits out their join. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's UID. How: The as reads it so.

	await runPagFun( curPagObj, '/src/state/chat.ts', 'chaPhoFun', groIdeStr, eveIdeStr, 'Picnic' ); // What: Photos Line Call. Why: The line is posted as the app posts it after a burst of uploads. How: This posts it as the owner.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The chat shows the line. How: This opens the app on the group.

	await curPagObj.getByRole( 'button', { name : 'You just uploaded photos for Picnic' } ).click(); // What: Line Click Call. Why: A photos line leads to the photos. How: This presses it.

	await expect( curPagObj.getByRole( 'dialog', { name : 'Picnic' } ).getByRole( 'heading', { name : 'Photos' } ) ).toBeInViewport(); // What: Photos Shown Assertion. Why: The line opens the event at its photos, which start below the screen past the long list. How: This waits for the photos' heading to come into view.


} );



test( 'a status line that wraps keeps its dot beside its first row', async ( { page : curPagObj } ) => { // What: Wrapped Line Dot Test. Why: A dot centered on a wrapped line's whole block sits halfway down it, apart from where the line starts. How: This posts a photos line long enough to wrap on a phone and checks the dot's middle is level with the first row's middle.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: A line wraps soonest on a phone. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the new group's ID. How: The as reads it so.
	const staTimNum = Date.now() + 86400000;                                                                             // What: Start Time Number. Why: The event is still to come. How: This starts it a day from now.
	const titTexStr = 'Family Thanksgiving Dinner At The Lake House';                                                     // What: Title Text String. Why: The line has to wrap onto more than one row. How: This is a long event title the line names.
	const eveIdeStr = await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr } ) as string; // What: Event Identifier String. Why: The photos line names its event. How: This plans one with the long title. // What: Type Assertion Note. Why: eveCreFun resolves with the new event's ID. How: The as reads it so.


	await joiWaiFun( briEnvObj, groIdeStr, ( await runPagFun( curPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr ); // What: Join Wait Call. Why: A line stamped before the owner's join by a clock that stepped back wouldn't show. How: This waits until the clock is past the join. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity. How: The as reads its UID.

	await runPagFun( curPagObj, '/src/state/chat.ts', 'chaPhoFun', groIdeStr, eveIdeStr, titTexStr ); // What: Photos Line Call. Why: The line is posted as the app posts it. How: This posts it as the owner.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The chat shows the line. How: This opens the app on the group.

	await curPagObj.getByRole( 'button', { name : `You just uploaded photos for ${ titTexStr }` } ).waitFor(); // What: Line Wait Call. Why: The line is measured once it shows. How: This waits for its button.


	const posValObj = await curPagObj.getByRole( 'button', { name : `You just uploaded photos for ${ titTexStr }` } ).evaluate( ( butCurEle ) => { // What: Position Value Object. Why: The dot is checked against the line's first row. How: This measures the dot, the line, and the line's height in the page.


		const parCurEle = butCurEle.closest( 'p' )!;                              // What: Paragraph Current Element. Why: The line's rows are the paragraph's. How: This finds it. // What: Non-Null Note. Why: The button sits in the line's paragraph. How: The ! reads it as present.
		const dotCurEle = parCurEle.previousElementSibling!;                      // What: Dot Current Element. Why: The dot sits just before the line. How: This takes the paragraph's sibling. // What: Non-Null Note. Why: Every status line has its dot first. How: The ! reads it as present.
		const dotRecObj = dotCurEle.getBoundingClientRect();                      // What: Dot Rectangle Object. Why: The dot's middle is compared. How: This measures it.
		const linHeiNum = parseFloat( getComputedStyle( parCurEle ).lineHeight ); // What: Line Height Number. Why: The first row is one line tall. How: This reads the paragraph's line height in pixels.
		const parRecObj = parCurEle.getBoundingClientRect();                      // What: Paragraph Rectangle Object. Why: The first row starts at the paragraph's top. How: This measures it.


		return { dotMidNum : dotRecObj.top + dotRecObj.height / 2, linHeiNum, parHeiNum : parRecObj.height, rowMidNum : parRecObj.top + linHeiNum / 2 }; // What: Positions Return. Why: The test compares them. How: This returns the dot's middle, the line height, the paragraph's height, and the first row's middle.


	} );


	expect( posValObj.parHeiNum ).toBeGreaterThan( posValObj.linHeiNum * 2 );                 // What: Wrapped Assertion. Why: The check means something only for a line that wraps. How: This expects the line taller than two rows.
	expect( Math.abs( posValObj.dotMidNum - posValObj.rowMidNum ) ).toBeLessThan( 1.5 ); // What: Dot Level Assertion. Why: The dot sits beside the line's first row. How: This expects its middle within 1.5px of the first row's.


} );

// #endregion Module Init


