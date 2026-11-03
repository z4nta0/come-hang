


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The group's start and the owner's join are moved by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The joiner needs the group's link. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the banner and the list behave as they should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The joiner asks from a phone of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: The group and the join are made the way the app does it. How: This calls the app's functions in a page.
import { senPolFun                 } from '../support/client.ts';         // What: Send Poll Function. Why: The owner's messages are the history sent. How: This sends them once the mirror allows.
import { test                      } from '@playwright/test';             // What: Test. Why: The hooks are declared on it. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: The moved times are timestamps. How: This builds them.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: Times are moved past the rules. How: This updates a document.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * history.spec.ts = History Spec
 *
 * @summary
 * Checks asking for and sending chat history as people use it, in whichever
 * engine the project runs, against the Emulator Suite. A fresh joiner of a
 * group that began a month earlier is offered the chat from before they
 * joined in a banner atop the chat, asks for it, and sees the request wait;
 * the owner, whose phone holds that chat, finds the request in People and
 * sends it; and the joiner's chat then shows the owner's messages with a
 * count of what arrived. Not now keeps the banner away through a reload.
 *
 * Sections:
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let hisEnvObj : RulesTestEnvironment; // What: History Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	hisEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await hisEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj( 'a fresh joiner asks for the chat from before they joined, and the owner sends it from People', async ( { page : ownPagObj, secPagObj } ) => { // What: Backlog Test. Why: A joiner may want what was said before them, which only another member's phone holds (Section 11.9). How: This has the owner chat, lets a joiner in, moves the group back a month, asks from the banner, sends from People, and checks the joiner's chat shows the messages with their count.


	await ownPagObj.goto( '/' ); // What: Owner Visit. Why: The dev server serves the modules there. How: This opens the app.

	await secPagObj.goto( '/' ); // What: Joiner Visit. Why: The joiner acts from their own phone. How: This opens the app.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The history belongs to this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await senPolFun( ownPagObj, groIdeStr, 'Who is bringing the grill?' ); // What: First Message Call. Why: The owner's chat before the join is the history asked for. How: This sends it.
	await senPolFun( ownPagObj, groIdeStr, "I'll bring charcoal." );       // What: Second Message Call. Why: A count of more than one shows the plural. How: This sends another.


	const tokValStr = ( await docReaFun( hisEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                       // What: Token Value String. Why: The joiner joins through the link. How: This reads the token the group names. // What: Type Assertion Note. Why: A group always names its token. How: The as reads it as a string.
	const uidMemStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Member String. Why: The owner approves the joiner by UID. How: This makes the joiner's identity and reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.
	const uidOwnStr = ( await runPagFun( ownPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Owner String. Why: The owner's join is moved back with the group. How: This reads the owner's UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await runPagFun( secPagObj, '/src/state/joins.ts', 'reqCreFun', tokValStr, 'Dana Lee', '' ); // What: Request Call. Why: The joiner asks to join. How: This files the request.

	await runPagFun( ownPagObj, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidMemStr ); // What: Approval Call. Why: The owner lets the joiner in. How: This approves the request.

	const oldTimObj = Timestamp.fromMillis( Date.now() - 30 * 86400000 ); // What: Old Time Object. Why: The owner's join has to match the group's start exactly, or the owner wouldn't count as holding everything since it. How: This is one time 30 days back, used for both.


	await hisEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Time Move Call. Why: A backlog needs a group older than the join, and the owner's phone counts as holding it only if the owner joined at its start. How: This moves the group's start and the owner's join a month back.


		await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }` ), { createdAt : oldTimObj } );                       // What: Group Start Call. Why: The group began well before the join. How: This moves its start back 30 days.
		await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/members/${ uidOwnStr }` ), { joinedAt : oldTimObj } ); // What: Owner Join Call. Why: The owner was there from the start. How: This moves their join back 30 days.


	} );


	await secPagObj.goto( '/' ); // What: Joiner Reopen Call. Why: The watch started before the joiner was in. How: This opens the app again on the group's chat.

	await expect( secPagObj.getByText( 'Want to see the chat from before you joined? Ask the group to send it.' ) ).toBeVisible(); // What: Offer Assertion. Why: A fresh joiner of an older group is offered its earlier chat. How: This expects the banner's line.

	await secPagObj.getByRole( 'button', { name : 'Ask the group' } ).click(); // What: Ask Click Call. Why: The joiner asks. How: This presses the button.

	await expect( secPagObj.getByRole( 'region', { name : 'Chat history' } ) ).toBeFocused();                                                    // What: Banner Focus Assertion. Why: The pressed button went, so focus lands on the banner. How: This expects it focused.
	await expect( secPagObj.getByText( 'You asked the group for chat history. A member whose phone holds it can send a copy.' ) ).toBeVisible(); // What: Waiting Assertion. Why: The request waits for a member. How: This expects the banner's waiting line.

	await ownPagObj.goto( '/' ); // What: Owner Reopen Call. Why: The owner opens the group afresh. How: This opens the app.

	await ownPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: Requests are answered in People. How: This opens it.

	await ownPagObj.getByRole( 'button', { name : 'Send history to Dana Lee' } ).click(); // What: Send Click Call. Why: The owner's phone holds the chat asked for. How: This sends it.

	await expect( ownPagObj.getByRole( 'status' ).filter( { hasText : 'Sent' } ) ).toHaveText( 'Sent 2 messages to Dana Lee.' ); // What: Sent Assertion. Why: The owner hears how much went. How: This expects the section's status.

	await expect( secPagObj.getByRole( 'status' ).filter( { hasText : 'Added' } ) ).toHaveText( 'Added 2 messages from the group.', { timeout : 20000 } ); // What: Arrival Assertion. Why: The joiner hears the history arrived, and how much. How: This expects the banner's status within the 5-second checks.
	await expect( secPagObj.getByText( "I'll bring charcoal." ) ).toBeVisible();                                                                         // What: History Assertion. Why: The sent chat shows in the joiner's log. How: This expects the owner's message.


} );



pagTesObj( 'Not now keeps the history banner away through a reload', async ( { page : ownPagObj, secPagObj } ) => { // What: Dismiss Test. Why: History is never required, so a dismissed offer shouldn't keep coming back. How: This lets a joiner into an older group, dismisses the offer, checks focus moved, reloads, and checks the banner stays away.


	await ownPagObj.goto( '/' ); // What: Owner Visit. Why: The dev server serves the modules there. How: This opens the app.

	await secPagObj.goto( '/' ); // What: Joiner Visit. Why: The joiner acts from their own phone. How: This opens the app.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string;                    // What: Group Identifier String. Why: The offer belongs to this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const tokValStr = ( await docReaFun( hisEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                              // What: Token Value String. Why: The joiner joins through the link. How: This reads the token. // What: Type Assertion Note. Why: A group always names its token. How: The as reads it as a string.
	const uidMemStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr;        // What: UID Member String. Why: The owner approves the joiner by UID. How: This reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await runPagFun( secPagObj, '/src/state/joins.ts', 'reqCreFun', tokValStr, 'Dana Lee', '' ); // What: Request Call. Why: The joiner asks to join. How: This files the request.

	await runPagFun( ownPagObj, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidMemStr ); // What: Approval Call. Why: The owner lets the joiner in. How: This approves the request.

	await hisEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }` ), { createdAt : Timestamp.fromMillis( Date.now() - 30 * 86400000 ) } ); } ); // What: Group Start Call. Why: The offer needs a group older than the join. How: This moves its start back 30 days.

	await secPagObj.goto( '/' ); // What: Joiner Reopen Call. Why: The watch started before the joiner was in. How: This opens the app again on the group's chat.

	await secPagObj.getByRole( 'button', { name : 'Not now' } ).click(); // What: Dismiss Click Call. Why: The joiner doesn't want the history. How: This presses Not now.

	await expect( secPagObj.getByRole( 'region', { name : 'Chat history' } ) ).toHaveCount( 0 ); // What: Gone Assertion. Why: A dismissed offer goes at once. How: This expects no banner.
	await expect( secPagObj.getByRole( 'main' ) ).toBeFocused();                               // What: Focus Assertion. Why: The pressed button went with the banner, so focus lands on the main area. How: This expects it focused.

	await secPagObj.reload(); // What: Reload Call. Why: The dismissal should hold. How: This reloads the app.

	await expect( secPagObj.getByRole( 'heading', { level : 2, name : 'Chat' } ) ).toBeAttached(); // What: Chat Assertion. Why: The chat itself still opens. How: This expects its heading.

	expect( await runPagFun( secPagObj, '/src/state/history.ts', 'hisProFun', groIdeStr ) ).toMatchObject( { kinValStr : 'backlog' } ); // What: Offer Ready Assertion. Why: The banner decides only once the offer is read, so the check below waits for the same reads. How: This reads the offer in the page and expects it still there.

	await expect( secPagObj.getByRole( 'region', { name : 'Chat history' } ) ).toHaveCount( 0 ); // What: Kept Assertion. Why: Not now holds although the offer stands. How: This expects no banner.


} );

// #endregion Module Init


