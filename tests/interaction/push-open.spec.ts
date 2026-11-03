


// #region Imports

import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when the push's address opens where it should. How: This asserts on what each check reads.
import { runPagFun } from '../support/client.ts'; // What: Run Page Function. Why: The group is made the way the app does it. How: This calls the app's functions in the page.
import { test      } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.

// #endregion Imports



/**
 * push-open.spec.ts = Push Open Spec
 *
 * @summary
 * Checks where a tapped push leads, in whichever engine the project runs,
 * against the Emulator Suite. The suite's browsers can't tap a notification
 * and the dev server runs no service worker, so the worker's two paths are
 * stood in for: its opening of /open/<group>/<section> for an app that isn't
 * open, and its message naming that address for an app that is. Either one
 * opens the group at the section with the address back at the root, a
 * section this version doesn't know opens the default screen, and a message
 * naming any other address, such as an invite link, is ignored.
 *
 * Sections:
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module Init

test( "a push's address opens its group at the section, and an unknown section opens the default screen", async ( { page } ) => { // What: Address Test. Why: An app opened by a tapped push should land where the news is (Section 11.1). How: This makes a group, opens its People address and checks the section and the root address, then opens an unknown section and checks the chat.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


	const groIdeStr = await runPagFun( page, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The push names this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await page.goto( `/open/${ groIdeStr }/people` ); // What: People Open Call. Why: A tapped join request opens People. How: This opens its address.

	await expect( page.getByRole( 'heading', { level : 2, name : 'People' } ) ).toBeVisible(); // What: People Assertion. Why: The address opens the section its news is in. How: This expects People's heading.
	await expect( page ).toHaveURL( /\/$/ );                                                   // What: Root Assertion. Why: The app answers at its root, and the push's path shouldn't stay in the bar. How: This expects the address to end at the root.

	await page.goto( `/open/${ groIdeStr }/later` ); // What: Unknown Open Call. Why: A push from a later version may name a section this one lacks. How: This opens an unknown one.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Chat' } ) ).toBeVisible(); // What: Default Assertion. Why: An unknown section falls back to the group's chat. How: This expects the chat's heading.


} );



test( "the worker's message opens a push's group and section in an open app, and anything else is ignored", async ( { page } ) => { // What: Message Test. Why: A push tapped while the app is open should move it without a reload, and a message mustn't send it anywhere else. How: This stands in for the worker's message, first naming an invite link and then the group's Settings, checking the chat stays and then Settings opens.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


	const groIdeStr = await runPagFun( page, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The push names this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await page.goto( '/' ); // What: Reopen Call. Why: The watch started before the group existed. How: This opens the app again on its chat.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Chat' } ) ).toBeVisible(); // What: Chat Assertion. Why: The app starts on the group's chat. How: This expects its heading.

	await page.evaluate( ( patValStr ) => navigator.serviceWorker.dispatchEvent( new MessageEvent( 'message', { data : { patStr : patValStr } } ) ), `/join/${ 'A'.repeat( 22 ) }` ); // What: Other Message Call. Why: Only an /open/ address should move the app, not any other address it answers. How: This stands in for a message naming an invite link.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Chat' } ) ).toBeVisible(); // What: Ignored Assertion. Why: The invite link's address is ignored. How: This expects the chat still showing.

	await page.evaluate( ( patValStr ) => navigator.serviceWorker.dispatchEvent( new MessageEvent( 'message', { data : { patStr : patValStr } } ) ), `/open/${ groIdeStr }/settings` ); // What: Settings Message Call. Why: A tapped offer push opens Settings. How: This stands in for the worker's message naming it.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Settings' } ) ).toBeVisible(); // What: Settings Assertion. Why: The message opens the group's Settings. How: This expects its heading.

	await page.goBack(); // What: Back Call. Why: The screen before the push should stay one step back. How: This steps back.

	await expect( page.getByRole( 'heading', { level : 2, name : 'Chat' } ) ).toBeVisible(); // What: Back Assertion. Why: Back returns to the chat. How: This expects its heading.


} );

// #endregion Module Init


