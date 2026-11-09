


// #region Imports

import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when the app treats the lost connection as it should. How: This asserts on what each check reads.
import { runPagFun } from '../support/client.ts'; // What: Run Page Function. Why: Groups, events, and items are made the way the app makes them. How: This calls the app's functions in a page.
import { test      } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The helpers drive a page. How: This types it.

// #endregion Imports



/**
 * offline.spec.ts = Offline Spec
 *
 * @summary
 * Checks how the app treats a device that goes offline, in whichever engine
 * the project runs, against the Emulator Suite: a banner says so, a chat
 * message written meanwhile waits on the device, shown as waiting, and sends
 * in order once the device is back, and a change that needs the server says
 * it has to wait. Playwright's offline mode cuts the page off from the
 * emulators and reports the device offline, as losing a connection does.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region outTexFun

/**
 * outTexFun = Outbox Text Function
 *
 * @summary
 * Resolves with the texts of the messages waiting on the device, oldest
 * first, read straight from the app's IndexedDB database, so the check
 * imports nothing while the page is offline.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page whose device is read.
 *
 * @returns A promise that resolves with the waiting texts.
 *
 * @example
 * ```ts
 * outTexFun(page) // => [ 'First', 'Second' ]
 * ```
 *
*/

const outTexFun = ( curPagObj : Page ) : Promise< string[] > => curPagObj.evaluate( () => new Promise< string[] >( ( resValFun, rejValFun ) => { // What: Outbox Text Function. Why: A waiting message should be kept on the device, not just shown. How: This opens the app's database in the page and lists the outbox's texts by time.


	const opeReqObj = indexedDB.open( 'come-hang' ); // What: Open Request Object. Why: The outbox lives in the app's database. How: This opens it at its current version.


	opeReqObj.onerror = () => rejValFun( opeReqObj.error ); // What: Open Error Handler. Why: A failed open has to fail the check. How: This rejects with the error.

	opeReqObj.onsuccess = () => { // What: Open Success Handler. Why: The outbox is read once the database is open. How: This reads every record and sorts them.


		const getReqObj = opeReqObj.result.transaction( 'outbox', 'readonly' ).objectStore( 'outbox' ).getAll(); // What: Get Request Object. Why: Every waiting message is checked. How: This reads them all.


		getReqObj.onsuccess = () => { // What: Get Success Handler. Why: The check compares the texts in order. How: This sorts the records by time and keeps their texts.


			opeReqObj.result.close(); // What: Close Call. Why: An open connection would block the app's own upgrades. How: This closes it.

			resValFun( ( getReqObj.result as { creTimNum : number, texValStr : string }[] ).sort( ( recOneObj, recTwoObj ) => recOneObj.creTimNum - recTwoObj.creTimNum ).map( ( recValObj ) => recValObj.texValStr ) ); // What: Texts Resolve Call. Why: The test reads the texts in the order they were written. How: This sorts by time and resolves with the texts. // What: Type Assertion Note. Why: The app writes each record with its time and text. How: The as reads them so.


		};


	};


} ) ); // What: Evaluate Close. Why: The read runs in the page. How: This ends the call.

// #endregion outTexFun



// #region groOpeFun

/**
 * groOpeFun = Group Open Function
 *
 * @summary
 * Creates a group, optionally plans a picnic a day from now in it, and opens
 * the app on its chat, sized as a phone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to open.
 * @param eveBoo    - Event Boolean: Whether to plan the picnic, false by
 *                    default.
 *
 * @returns A promise that settles once the chat has loaded, with no value.
 *
 * @example
 * ```ts
 * groOpeFun(page, true) // => Promise<void>
 * ```
 *
*/

const groOpeFun = async ( curPagObj : Page, eveBoo = false ) : Promise< void > => { // What: Group Open Function. Why: Every test starts from a group's chat. How: This creates the group, plans the picnic when asked, and opens the app.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The pinned event opens a sheet on a phone. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as one.
	const staTimNum = Date.now() + 86400000;                                                                             // What: Start Time Number. Why: The event is still to come, so the chat pins it. How: This starts it a day from now.


	if ( eveBoo ) await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ); // What: Event Plan Call. Why: A test changes the event's list. How: This plans the picnic when asked.



	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The chat shows once the group has loaded. How: This waits for its heading.


};

// #endregion groOpeFun

// #endregion Helpers



// #region Module Init

test( 'offline, a banner says so and a message waits on the device, shown as waiting, then sends in order once the device is back', async ( { page : curPagObj } ) => { // What: Outbox Test. Why: A message written offline shouldn't hang or be lost, and the member should know it hasn't gone (Section 14). How: This goes offline, writes two messages, checks the banner, the log, and the device, then goes online and waits for both to send.


	await groOpeFun( curPagObj ); // What: Open Call. Why: The test writes in a group's chat. How: This creates the group and opens it.


	const banTexObj = curPagObj.getByText( "You're offline.", { exact : false } );                 // What: Banner Text Object. Why: The banner's words are checked. How: This finds them.
	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } );        // What: Text Box Object. Why: The messages are typed there. How: This finds the composer.
	const waiIteObj = curPagObj.getByRole( 'listitem' ).filter( { hasText : 'Waiting to send' } ); // What: Waiting Item Object. Why: The log marks a message that hasn't gone. How: This finds those entries.


	await expect( banTexObj ).toHaveCount( 0 ); // What: No Banner Assertion. Why: The banner shows only offline. How: This expects none online.

	await curPagObj.context().setOffline( true ); // What: Offline Call. Why: The device loses its connection. How: This cuts the page off.

	await expect( banTexObj ).toBeVisible(); // What: Banner Assertion. Why: The member should know the device is offline. How: This waits for the banner.

	await texBoxObj.fill( 'First' ); // What: First Fill Call. Why: A message is written offline. How: This types it.

	await texBoxObj.press( 'Enter' ); // What: First Send Call. Why: Enter sends. How: This presses it.

	await expect( texBoxObj ).toHaveValue( '' ); // What: Cleared Box Assertion. Why: The message is kept, so the box is free for the next. How: This waits for it to empty.

	await texBoxObj.fill( 'Second' ); // What: Second Fill Call. Why: A second message waits after the first. How: This types it.

	await texBoxObj.press( 'Enter' ); // What: Second Send Call. Why: Enter sends. How: This presses it.

	await expect( waiIteObj ).toHaveCount( 2 );                 // What: Waiting Count Assertion. Why: Both messages show as waiting. How: This waits for two marked entries.
	await expect( waiIteObj.first() ).toContainText( 'First' ); // What: Waiting Order Assertion. Why: The messages show in the order they were written. How: This expects the first to come first.

	expect( await outTexFun( curPagObj ) ).toEqual( [ 'First', 'Second' ] ); // What: Kept Assertion. Why: A waiting message survives the app closing only when it's kept on the device. How: This reads the outbox, in order.

	await curPagObj.context().setOffline( false ); // What: Online Call. Why: The device comes back. How: This reconnects the page.

	await expect( banTexObj ).toHaveCount( 0 );                                                       // What: Banner Gone Assertion. Why: The banner shows only offline. How: This waits for it to go.
	await expect( waiIteObj ).toHaveCount( 0, { timeout : 15000 } );                                  // What: Sent Assertion. Why: Back online, the waiting messages send, a refused first try going through on a retry. How: This waits up to 15 seconds, past two retries, for no entry to be waiting.
	await expect( curPagObj.getByRole( 'listitem' ).filter( { hasText : 'Second' } ) ).toBeVisible(); // What: Second Sent Assertion. Why: The last message reaches the chat. How: This waits for its entry, which nothing marks as waiting now.

	await expect.poll( () => outTexFun( curPagObj ) ).toEqual( [] ); // What: Emptied Assertion. Why: A sent message leaves the device's outbox. How: This waits for the outbox to empty.


	const iteTexArr = await curPagObj.getByRole( 'listitem' ).allInnerTexts();                // What: Item Text Array. Why: The order is read from the log's entries. How: This reads each entry's text.
	const firIndNum = iteTexArr.findIndex( ( iteTexStr ) => iteTexStr.includes( 'First' ) );  // What: First Index Number. Why: The first message's place in the log is compared. How: This finds its entry.
	const secIndNum = iteTexArr.findIndex( ( iteTexStr ) => iteTexStr.includes( 'Second' ) ); // What: Second Index Number. Why: The second message's place is compared with it. How: This finds its entry.


	expect( firIndNum ).toBeGreaterThanOrEqual( 0 ); // What: First Found Assertion. Why: The first message has to be in the log for its place to mean anything. How: This expects its entry found.
	expect( firIndNum ).toBeLessThan( secIndNum );   // What: Sent Order Assertion. Why: The messages send in the order they were written. How: This expects the first ahead of the second.


} );



test( 'offline, a change that needs the server says it has to wait, and goes through once the device is back', async ( { page : curPagObj } ) => { // What: Paused Change Test. Why: A change offline shouldn't hang or fail vaguely (Section 14). How: This goes offline in an event's list, tries to add an item, checks the message and the list, then adds it online.


	await groOpeFun( curPagObj, true ); // What: Open Call. Why: The test changes an event's list. How: This creates the group with the picnic and opens it.

	await curPagObj.getByRole( 'button', { name : /Picnic/ } ).click(); // What: Card Click Call. Why: The list is in the event's sheet. How: This presses the pinned card.


	const sheDiaObj = curPagObj.getByRole( 'dialog', { name : 'Picnic' } ); // What: Sheet Dialog Object. Why: The list and its messages are in the sheet. How: This finds it by the event's title.
	const addInpObj = sheDiaObj.getByLabel( 'Add to the list' );            // What: Add Input Object. Why: The item is added from the box. How: This finds it.


	await curPagObj.context().setOffline( true ); // What: Offline Call. Why: The device loses its connection. How: This cuts the page off.

	await addInpObj.fill( 'Chips' ); // What: Fill Call. Why: The member tries to add an item. How: This types its label.

	await addInpObj.press( 'Enter' ); // What: Offline Add Call. Why: The change needs the server. How: This presses Enter.

	await expect( sheDiaObj.getByRole( 'alert' ).filter( { hasText : 'offline' } ) ).toHaveText( "You're offline, so this has to wait until you're back online." ); // What: Paused Alert Assertion. Why: The member learns why nothing happened. How: This reads the sheet's alert.
	await expect( sheDiaObj.getByRole( 'listitem' ).filter( { hasText : 'Chips' } ) ).toHaveCount( 0 );                                                             // What: Unchanged List Assertion. Why: The change didn't happen. How: This expects no row for it.

	await curPagObj.context().setOffline( false ); // What: Online Call. Why: The device comes back. How: This reconnects the page.

	await expect( curPagObj.getByText( "You're offline.", { exact : false } ) ).toHaveCount( 0 ); // What: Back Online Wait. Why: The app has to know it's online before the change can go. How: This waits for the banner to go.

	await addInpObj.press( 'Enter' ); // What: Online Add Call. Why: Back online, the change goes through. How: This presses Enter again, the label still typed.

	await expect( sheDiaObj.getByRole( 'listitem' ).filter( { hasText : 'Chips' } ) ).toBeVisible(); // What: Added Assertion. Why: The change lands once online. How: This waits for its row.


} );

// #endregion Module Init


