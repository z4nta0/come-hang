


// #region Imports

import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when the right section shows and its tab is marked. How: This asserts on what each check reads.
import { runPagFun } from '../support/client.ts'; // What: Run Page Function. Why: The group is made the way the app makes it. How: This calls the app's functions in a page.
import { test      } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The group helper drives a page. How: This types it.

// #endregion Imports



/**
 * sections.spec.ts = Sections Spec
 *
 * @summary
 * Checks a group's section tabs as people use them, in whichever engine the
 * project runs, against the Emulator Suite: a tab opens its section and marks
 * itself, back returns to the section before, on a phone and on a wide
 * screen, and a history entry naming a section this version doesn't know
 * opens the chat.
 *
 * Sections:
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

const groOpeFun = async ( curPagObj : Page ) : Promise< string > => { // What: Group Open Function. Why: Every test starts in a new group. How: This creates one in the page, opens the app on it, and resolves with its ID.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The tabs belong to a group, and an entry can name it. How: This creates one. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The tabs show once the group has loaded. How: This waits for its heading.



	return groIdeStr;


};

// #endregion Helpers



// #region Module Init

for ( const sizRecObj of [ { heiNum : 844, ideStr : 'a phone', widNum : 390 }, { heiNum : 900, ideStr : 'a wide screen', widNum : 1440 } ] ) { // What: Size Loop. Why: The tabs sit along the bottom on a phone and down a column on a wide screen. How: This runs the tab test at each size.


	test( `on ${ sizRecObj.ideStr } a section tab opens its section, and back returns to the one before`, async ( { page : curPagObj } ) => { // What: Section Tab Test. Why: Each section is a tap away, and the back gesture walks back through them (Section 14). How: This opens the events and then the people section from their tabs, then goes back twice, checking the heading and the marked tab each time.


		await curPagObj.setViewportSize( { height : sizRecObj.heiNum, width : sizRecObj.widNum } ); // What: Size Call. Why: The tabs take each layout. How: This sizes the page.

		await groOpeFun( curPagObj ); // What: Group Open Call. Why: The tabs belong to a group. How: This creates one and opens it.


		const secNavObj = curPagObj.getByRole( 'navigation', { name : 'Group sections' } ); // What: Section Nav Object. Why: The checks press and read its tabs. How: This finds it.


		await expect( secNavObj.getByRole( 'button', { name : 'Chat' } ) ).toHaveAttribute( 'aria-current', 'page' ); // What: Chat Current Assertion. Why: A group opens at its chat. How: This expects the chat's tab marked.

		await secNavObj.getByRole( 'button', { name : 'Events' } ).click(); // What: Events Click Call. Why: The events tab opens its section. How: This presses it.

		await expect( curPagObj.getByRole( 'heading', { level : 2, name : 'Events' } ) ).toBeVisible();                   // What: Events Heading Assertion. Why: The section shows. How: This waits for its heading.
		await expect( secNavObj.getByRole( 'button', { name : 'Events' } ) ).toHaveAttribute( 'aria-current', 'page' );   // What: Events Current Assertion. Why: The open section's tab is marked. How: This reads the attribute.
		await expect( secNavObj.getByRole( 'button', { name : 'Chat' } ) ).not.toHaveAttribute( 'aria-current', 'page' ); // What: Chat Unmarked Assertion. Why: Only the open section's tab is marked. How: This reads the attribute.

		await secNavObj.getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: A second section opens on top of the first. How: This presses its tab.

		await expect( curPagObj.getByRole( 'heading', { level : 2, name : 'People' } ) ).toBeVisible(); // What: People Heading Assertion. Why: The section shows. How: This waits for its heading.

		await curPagObj.goBack(); // What: Back Call. Why: Back returns to the section before. How: This goes back once.

		await expect( curPagObj.getByRole( 'heading', { level : 2, name : 'Events' } ) ).toBeVisible(); // What: Back To Events Assertion. Why: The events section was the one before. How: This waits for its heading.

		await curPagObj.goBack(); // What: Second Back Call. Why: Back keeps walking through the sections. How: This goes back again.

		await expect( secNavObj.getByRole( 'button', { name : 'Chat' } ) ).toHaveAttribute( 'aria-current', 'page' ); // What: Back To Chat Assertion. Why: The chat was where the group opened. How: This expects the chat's tab marked again.


	} );


}



test( "a history entry naming a section this version doesn't know opens the chat", async ( { page : curPagObj } ) => { // What: Unknown Section Test. Why: A history entry can outlive the version that wrote it, and its state is untrusted. How: This plants an entry naming an unknown section, reloads, and checks the chat shows.


	const groIdeStr = await groOpeFun( curPagObj ); // What: Group Identifier String. Why: The planted entry names the open group, so only its section is unknown. How: This creates the group and opens it.


	await curPagObj.evaluate( ( entGroStr ) => history.replaceState( { idx : 0, key : 'default', usr : { groStr : entGroStr, scrStr : 'group', secStr : 'bogus' } }, '' ), groIdeStr ); // What: Entry Plant Call. Why: The router reads a screen from its entry's user state. How: This replaces the entry with one naming the group and an unknown section.

	await curPagObj.reload(); // What: Reload Call. Why: The app reads the entry as it starts. How: This reloads the page.

	await expect( curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Chat' } ) ).toHaveAttribute( 'aria-current', 'page' ); // What: Chat Fallback Assertion. Why: An unknown section reads as none, the chat. How: This expects the chat's tab marked.


} );

// #endregion Module Init


