


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the chat shows what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: A message from another member needs a group with two. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member writes from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups and events are made the way the app makes them. How: This calls the app's functions in a page.
import { senPolFun                 } from '../support/client.ts';         // What: Send Poll Function. Why: A send just after joining can meet the old mirror. How: This retries it until it lands.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The composer helper drives a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * chat.spec.ts = Chat Spec
 *
 * @summary
 * Checks the group chat as people use it, in whichever engine the project
 * runs, against the Emulator Suite: another member's message shows their
 * name, initials, and color while the sender sees it as their own, the
 * composer sends on Enter, keeps a Shift+Enter line break, and clears itself,
 * a message with characters the chat refuses is announced and kept, and the
 * group's next event is pinned above the chat.
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

let chaEnvObj : RulesTestEnvironment; // What: Chat Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const groOpeFun = async ( curPagObj : Page ) : Promise< void > => { // What: Group Open Function. Why: Most tests start in a new group's chat. How: This creates a group in the page and opens the app on it.


	await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ); // What: Group Create Call. Why: The chat belongs to a group. How: This creates one.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group's chat. How: This opens it.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The chat shows once the group has loaded. How: This waits for its heading.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	chaEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The member setup reads through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await chaEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj( "another member's message shows their name, initials, and color, and the sender sees it as their own", async ( { page : curPagObj, secPagObj } ) => { // What: Member Message Test. Why: Members tell each other apart by name and color, and a sender knows their own messages (Section 14). How: This has a member send a message, then reads it once on the member's own device, where it arrives twice, and then on the owner's.


	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr } = await memSetFun( chaEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The member writes in this group. How: This creates it with an owner and a member.


	await senPolFun( secPagObj, groIdeStr, 'See you at 4!' ); // What: Member Send Call. Why: The owner should see another member's message. How: This sends it as the member, retrying until it lands.

	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The sender reads their own message, which comes back both from the device's history and, while the owner hasn't read it, from the chat. How: This opens the app on their device before the owner reads.

	await expect( secPagObj.getByRole( 'log' ).getByRole( 'listitem' ).filter( { hasText : 'See you at 4!' } ) ).toContainText( 'You' ); // What: Own Message Assertion. Why: A sender's own message is named as theirs. How: This waits for "You" in its entry.

	await secPagObj.waitForTimeout( 1000 ); // What: Watch Settle Wait. Why: The history's copy and the chat's copy both arrive, and the check below has to see after both. How: This waits a second.

	expect( await secPagObj.getByRole( 'log' ).getByRole( 'listitem' ).count() ).toBe( 1 ); // What: Single Copy Assertion. Why: The two copies are one message. How: This expects one entry.

	await curPagObj.goto( '/' ); // What: Owner Open Call. Why: The owner reads the chat. How: This opens the app on the group.


	const ownIteObj = curPagObj.getByRole( 'log' ).getByRole( 'listitem' ).filter( { hasText : 'See you at 4!' } ); // What: Owner Item Object. Why: The checks read the message's entry. How: This finds it in the owner's log.


	await expect( ownIteObj ).toContainText( 'Dana Lee' );                          // What: Sender Name Assertion. Why: A message names its sender. How: This waits for the member's name.
	await expect( ownIteObj.locator( '[aria-hidden="true"]' ) ).toHaveText( 'DL' ); // What: Initials Assertion. Why: The avatar shows the sender's initials. How: This reads them.

	expect( await ownIteObj.locator( '[aria-hidden="true"]' ).evaluate( ( avaCurEle ) => { // What: Avatar Color Assertion. Why: The member wears the second member color, from the second slot. How: This compares the avatar's background with that token's.


		const proSpaEle = document.createElement( 'span' ); // What: Probe Span Element. Why: A token resolves only on an element. How: This makes one.


		proSpaEle.style.backgroundColor = 'var( --mem-002-col )'; // What: Probe Color Set. Why: The probe takes the token's color. How: This sets it.

		document.body.append( proSpaEle ); // What: Probe Append Call. Why: Only an element in the page resolves its style. How: This adds it.


		const proColStr = getComputedStyle( proSpaEle ).backgroundColor; // What: Probe Color String. Why: The avatar should match it. How: This reads it.


		proSpaEle.remove(); // What: Probe Remove Call. Why: The probe shouldn't stay. How: This removes it.



		return getComputedStyle( avaCurEle ).backgroundColor === proColStr; // What: Match Return. Why: The check passes when they match. How: This compares the two.


	} ) ).toBe( true );



} );



test( 'the composer sends on Enter, keeps a Shift+Enter line break, and clears itself', async ( { page : curPagObj } ) => { // What: Composer Test. Why: Enter sends while Shift+Enter starts a new line, and a sent message leaves the box empty. How: This types two lines, sends them, and checks the log holds both lines and the box is empty.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The test starts in a chat. How: This creates a group and opens it.


	const texBoxObj = curPagObj.getByLabel( 'Message', { exact : true } ); // What: Text Box Object. Why: The message is typed there. How: This finds the composer.


	await texBoxObj.fill( 'Line one' );              // What: First Line Fill Call. Why: The message starts with a line. How: This types it.
	await texBoxObj.press( 'Shift+Enter' );          // What: Line Break Press Call. Why: Shift+Enter starts a new line. How: This presses it.
	await texBoxObj.pressSequentially( 'Line two' ); // What: Second Line Type Call. Why: The message has a second line. How: This types it.

	await expect( async () => { // What: Send Retry Call. Why: A send before the membership mirror catches up is refused and leaves its text. How: This presses Enter until the message shows.


		await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it.

		await expect( curPagObj.getByRole( 'log' ).getByRole( 'listitem' ) ).toHaveCount( 1, { timeout : 2000 } ); // What: Message Shown Assertion. Why: The send landed once the log holds it. How: This waits up to 2 seconds for it.


	} ).toPass(); // What: Retry Settings. Why: The mirror usually catches up within a moment. How: This retries until the message shows.

	await curPagObj.waitForTimeout( 1000 ); // What: Watch Settle Wait. Why: The sender's copy and the watch's copy of the message both arrive, and the check below has to see after both. How: This waits a second.

	expect( await curPagObj.getByRole( 'log' ).getByRole( 'listitem' ).count() ).toBe( 1 );                                               // What: Single Copy Assertion. Why: The sender's copy and the watch's copy are one message. How: This expects one entry once both have arrived.
	expect( await curPagObj.getByRole( 'log' ).getByRole( 'listitem' ).locator( 'p' ).last().textContent() ).toBe( 'Line one\nLine two' ); // What: Line Break Assertion. Why: The message keeps the line break typed into it. How: This reads the message's text.

	await expect( texBoxObj ).toHaveValue( '' );                                               // What: Cleared Box Assertion. Why: A sent message leaves the box empty. How: This reads the box.
	await expect( curPagObj.getByRole( 'region', { name : 'Next event' } ) ).toHaveCount( 0 ); // What: No Pin Assertion. Why: A group with no events pins nothing. How: This expects no pinned event.


} );



test( 'a message with characters the chat refuses is announced and kept', async ( { page : curPagObj } ) => { // What: Refused Message Test. Why: A sender should learn why a message didn't go, without losing it. How: This sends text holding a direction override and checks the alert and the box.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The test starts in a chat. How: This creates a group and opens it.


	const texBoxObj = curPagObj.getByLabel( 'Message', { exact : true } ); // What: Text Box Object. Why: The message is typed there. How: This finds the composer.


	await texBoxObj.fill( 'Hi ‮ there' ); // What: Refused Fill Call. Why: A direction override can disguise a message. How: This types text holding one.

	await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: The message is sent. How: This presses Enter.

	await expect( curPagObj.getByRole( 'alert' ) ).toHaveText( "This message has characters that can't be sent." ); // What: Refusal Announced Assertion. Why: The sender learns why it didn't go. How: This reads the alert.
	await expect( texBoxObj ).toHaveValue( 'Hi ‮ there' );                                                          // What: Text Kept Assertion. Why: A refused message isn't lost. How: This reads the box.


} );



test( "the group's next event is pinned above the chat", async ( { page : curPagObj } ) => { // What: Pinned Event Test. Why: The group's next event stays in view above the chat (Section 14). How: This plans an event and checks its card.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it.
	const staTimNum = Date.now() + 86400000;                                                                            // What: Start Time Number. Why: The pinned event is still to come. How: This starts it a day from now.


	await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ); // What: Event Create Call. Why: The chat pins the next event. How: This plans an hour-long picnic.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The chat shows the event. How: This opens the app on the group.


	const pinSecObj = curPagObj.getByRole( 'region', { name : 'Next event' } ); // What: Pinned Section Object. Why: The checks read the card. How: This finds it.


	await expect( pinSecObj.getByRole( 'heading', { name : 'Picnic' } ) ).toBeVisible(); // What: Title Assertion. Why: The card names the event. How: This waits for its heading.
	await expect( pinSecObj ).toContainText( 'Central Park' );                           // What: Place Assertion. Why: The card says where it is. How: This reads its line.


} );

// #endregion Module Init


