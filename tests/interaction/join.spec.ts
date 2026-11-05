


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: A withdrawn request is checked gone. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the join screen shows what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read past the rules. How: This connects to the emulator.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The joiner asks from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: The group is made, and a joiner blocked, the way the app does it. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read goes through one. How: This types it.

// #endregion Imports



/**
 * join.spec.ts = Join Spec
 *
 * @summary
 * Checks joining through an invite link as people use it, in whichever
 * engine the project runs, against the Emulator Suite: the link opens the
 * join screen with the address at the root, the form refuses a missing name,
 * a sent request waits through a reload after its link is replaced, and a
 * member's approval opens the group, which the link then opens straight
 * away; a dead link says so and leads to the app; a withdrawal returns to the
 * form and a decline shows the request ended, with a way to ask again; and a
 * blocked joiner's request is refused with a reason. Focus lands on the
 * heading after each change.
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

let joiEnvObj : RulesTestEnvironment; // What: Join Environment Object. Why: Every read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region invSetFun

/**
 * invSetFun = Invite Setup Function
 *
 * @summary
 * Has a page start Beach Day as Alice, opens it afresh, and reads its invite
 * link from the People section, which stays open. Resolves with the group's
 * ID and the link's token.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ownPagObj - Owner Page Object: The page that starts the group.
 *
 * @returns A promise that resolves with the group's ID and the token.
 *
 * @example
 * ```ts
 * invSetFun(page) // => { groIdeStr : 'Xk3...', tokValStr : 'q1W...' }
 * ```
 *
*/

const invSetFun = async ( ownPagObj : Page ) : Promise< { groIdeStr : string, tokValStr : string } > => { // What: Invite Setup Function. Why: Every test joins a group through its link. How: This starts the group and reads the link.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The joiner asks to join this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await ownPagObj.goto( '/' ); // What: Owner Reopen Call. Why: The watch started before the identity existed, so the app opens afresh to show the group. How: This opens the app again.

	await ownPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: The link shows in the People section, where requests are answered. How: This presses its tab.


	const tokValStr = ( await ownPagObj.getByLabel( 'Invite link', { exact : true } ).inputValue() ).split( '/join/' )[ 1 ]; // What: Token Value String. Why: The joiner opens the group's link. How: This reads the link and takes the token from its end.



	return { groIdeStr, tokValStr }; // What: Setup Return. Why: The test opens the link and reads the group. How: This returns both.


};

// #endregion invSetFun



const reqSenFun = async ( joiPagObj : Page ) : Promise< void > => { // What: Request Send Function. Why: Several tests ask to join the same way. How: This fills in Dana's name and note, sends them, and waits for the waiting part.


	await joiPagObj.getByLabel( 'Your full name' ).fill( 'Dana Lee' );                      // What: Name Fill Call. Why: The approver recognizes the joiner by it. How: This types it.
	await joiPagObj.getByLabel( 'Note to the group (optional)' ).fill( "Sam's cousin" ); // What: Note Fill Call. Why: A note helps place the joiner. How: This types it.

	await joiPagObj.getByRole( 'button', { name : 'Ask to join' } ).click(); // What: Ask Click Call. Why: Sending asks to join. How: This presses the button.

	await expect( joiPagObj.getByRole( 'heading', { level : 1, name : 'Waiting to join Beach Day' } ) ).toBeFocused(); // What: Waiting Assertion. Why: The form goes once the request is sent, and focus lands on what replaced it. How: This expects the waiting heading focused.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	joiEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read reaches the emulator through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await joiEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'an invite link opens the join screen at the root, and an approval opens the group', async ( { page : ownPagObj, secPagObj } ) => { // What: Approval Test. Why: Joining is how people reach a group, and every join waits for a member (Section 17). How: This opens the link, tries an empty name, asks, has the owner replace the link, reloads, has the owner approve, and checks the group opens, then opens the new link as a member.


	const { groIdeStr, tokValStr } = await invSetFun( ownPagObj ); // What: Setup Values. Why: The joiner opens the group's link, which the owner later replaces. How: This starts the group and reads both.


	await secPagObj.goto( `/join/${ tokValStr }` ); // What: Link Open Call. Why: The joiner arrives through the link. How: This opens it.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Join Beach Day' } ) ).toBeVisible(); // What: Form Assertion. Why: The joiner sees which group they're asking to join. How: This expects the heading naming it.
	expect( new URL( secPagObj.url() ).pathname ).toBe( '/' );                                            // What: Root Assertion. Why: The app answers at its root, and the link's path shouldn't stay in the bar. How: This expects the root.

	await secPagObj.getByRole( 'button', { name : 'Ask to join' } ).click(); // What: Empty Ask Call. Why: A request needs a name. How: This sends the form empty.

	await expect( secPagObj.getByLabel( 'Your full name' ) ).toBeFocused();                                       // What: Name Focus Assertion. Why: Focus lands on the field with the problem. How: This expects the name field focused.
	await expect( secPagObj.getByLabel( 'Your full name' ) ).toHaveAccessibleDescription( /Enter your name\./ ); // What: Name Error Assertion. Why: The field says what's wrong and a screen reader reads it with the field. How: This expects the message in its description.

	await reqSenFun( secPagObj ); // What: Request Send Call. Why: The joiner asks to join. How: This sends Dana's request.

	await runPagFun( ownPagObj, '/src/state/groups.ts', 'invRotFun', groIdeStr ); // What: Link Replace Call. Why: A request made with an old link stays until it's answered (Section 17). How: This has the owner replace the link the joiner used.

	await secPagObj.reload(); // What: Waiting Reload Call. Why: A reload shouldn't lose the request, even after its link was replaced. How: This reloads the screen, whose entry remembers the group.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Waiting to join Beach Day' } ) ).toBeVisible(); // What: Reloaded Assertion. Why: The request still waits. How: This expects the waiting heading.

	await ownPagObj.getByRole( 'button', { name : 'Approve Dana Lee' } ).click(); // What: Approve Click Call. Why: A member lets the joiner in. How: This presses the button.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeFocused(); // What: Group Focus Assertion. Why: An approval opens the group for the joiner, focus landing on its heading. How: This expects the group's heading focused.
	await expect( secPagObj.getByRole( 'status' ).filter( { hasText : "You're in" } ) ).toHaveText( "You're in Beach Day." ); // What: Join Status Assertion. Why: The change is announced. How: This expects the host's status.

	const newTokStr = ( await ownPagObj.getByLabel( 'Invite link', { exact : true } ).inputValue() ).split( '/join/' )[ 1 ]; // What: New Token String. Why: A member opening the group's current link should land in the group. How: This reads the replaced link's token.


	await secPagObj.goto( `/join/${ newTokStr }` ); // What: Link Reopen Call. Why: A member may open the link again. How: This opens the current one.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible();                              // What: Member Group Assertion. Why: A member opening the link wants the group. How: This expects the group's heading.
	await expect( secPagObj.getByRole( 'status' ).filter( { hasText : 'already' } ) ).toHaveText( "You're already in Beach Day." ); // What: Already Status Assertion. Why: The member learns why no form shows. How: This expects the host's status.


} );



test( 'a dead link says so and leads to the app', async ( { page } ) => { // What: Dead Link Test. Why: A link replaced by a newer one, or a mangled one, opens nothing (Section 9). How: This opens a well-formed and a malformed token, checking each says the link doesn't work, then leaves through the button.


	await page.goto( `/join/${ 'A'.repeat( 22 ) }` ); // What: Missing Link Open Call. Why: A token with no invite is a replaced link. How: This opens one.

	await expect( page.getByRole( 'heading', { level : 1, name : "This invite link doesn't work" } ) ).toBeVisible(); // What: Missing Assertion. Why: The screen says the link opens nothing. How: This expects its heading.

	await page.goto( '/join/groups' ); // What: Malformed Link Open Call. Why: A mangled token could name another path. How: This opens one.

	await expect( page.getByRole( 'heading', { level : 1, name : "This invite link doesn't work" } ) ).toBeVisible(); // What: Malformed Assertion. Why: A mangled link opens nothing either. How: This expects the same heading.

	await page.getByRole( 'button', { name : 'Go to Come Hang' } ).click(); // What: Leave Click Call. Why: Someone with a dead link still has somewhere to go. How: This presses the button.

	await expect( page.getByRole( 'heading', { level : 1, name : 'Come Hang' } ) ).toBeFocused(); // What: Welcome Focus Assertion. Why: Someone in no group lands on the welcome, focus on its heading, since the button went. How: This expects the welcome's heading focused.


} );



pagTesObj( "a pasted invite link opens its join screen, and a paste that holds none says what's wrong", async ( { page : ownPagObj, secPagObj } ) => { // What: Paste Test. Why: An installed iPhone app reaches an invite only through a pasted link, and anyone may join that way (Section 16). How: This opens the paste screen from the welcome, sends it empty and with plain text, checking each problem, then pastes the whole link and checks the join screen opens, with back skipping the paste.


	const { tokValStr } = await invSetFun( ownPagObj ); // What: Token Value String. Why: The joiner pastes the group's link. How: This starts the group and reads its token.


	const linInpLoc = secPagObj.getByLabel( 'Invite link', { exact : true } ); // What: Link Input Locator. Why: The checks read and fill the field. How: This finds it by its label.


	await secPagObj.goto( '/' ); // What: Landing Open Call. Why: The paste starts from the landing page. How: This opens the app.

	await secPagObj.getByRole( 'button', { name : 'Join with an invite link' } ).click(); // What: Join Click Call. Why: The landing page offers joining with a link. How: This presses its button.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Join with an invite link' } ) ).toBeFocused(); // What: Heading Focus Assertion. Why: The button that opened the screen is gone, so focus lands on the heading. How: This expects it focused.

	await secPagObj.getByRole( 'button', { name : 'Continue' } ).click(); // What: Empty Continue Call. Why: A paste needs a link. How: This sends the form empty.

	await expect( linInpLoc ).toBeFocused();                                                          // What: Empty Focus Assertion. Why: Focus lands on the field with the problem. How: This expects the field focused.
	await expect( linInpLoc ).toHaveAccessibleDescription( /Paste the invite link you were sent\./ ); // What: Empty Error Assertion. Why: The field says what's missing. How: This expects the message in its description.

	await linInpLoc.fill( 'See you at the beach' ); // What: Text Fill Call. Why: A paste of the wrong thing holds no token. How: This types a message instead of a link.

	await secPagObj.getByRole( 'button', { name : 'Continue' } ).click(); // What: Text Continue Call. Why: The paste is read. How: This sends the form.

	await expect( linInpLoc ).toHaveAccessibleDescription( /That isn't an invite link\./ ); // What: Wrong Paste Assertion. Why: A paste holding no link says so. How: This expects that message in the field's description.

	await linInpLoc.fill( ` https://comehang.app/join/${ tokValStr } ` ); // What: Link Fill Call. Why: A paste often brings spaces, and the link may name the live address. How: This pastes the whole link with spaces around it.

	await secPagObj.getByRole( 'button', { name : 'Continue' } ).click(); // What: Link Continue Call. Why: The link opens its invite. How: This sends the form.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Join Beach Day' } ) ).toBeVisible(); // What: Join Screen Assertion. Why: The pasted link opens the group's join screen. How: This expects the heading naming the group.

	await secPagObj.goBack(); // What: Back Call. Why: The join screen took the paste's place, so back returns to where it was opened. How: This steps back.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Plans made. Fun had. Memories created.' } ) ).toBeVisible(); // What: Landing Assertion. Why: Back skips the paste screen. How: This expects the landing page's heading.


} );



pagTesObj( 'a withdrawal returns to the form, and a decline ends the request with a way to ask again', async ( { page : ownPagObj, secPagObj } ) => { // What: Withdraw And Decline Test. Why: A joiner may take a request back, and a member may turn one down (Section 17). How: This asks and withdraws, checking the request is gone, then asks again and has the owner decline, then asks again from the ended part.


	const { groIdeStr, tokValStr } = await invSetFun( ownPagObj ); // What: Setup Values. Why: The joiner opens the group's link, and the request is read in the group. How: This starts the group and reads both.


	await secPagObj.goto( `/join/${ tokValStr }` ); // What: Link Open Call. Why: The joiner arrives through the link. How: This opens it.

	await reqSenFun( secPagObj ); // What: Request Send Call. Why: There has to be a request to withdraw. How: This sends Dana's request.

	await secPagObj.getByRole( 'button', { name : 'Withdraw request' } ).click(); // What: Withdraw Click Call. Why: The joiner takes the request back. How: This presses the button.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Join Beach Day' } ) ).toBeFocused();                                    // What: Form Focus Assertion. Why: The form comes back, focus on its heading, since the button went. How: This expects the heading focused.
	await expect( secPagObj.getByRole( 'status' ).filter( { hasText : 'withdrew' } ) ).toHaveText( 'You withdrew your request.' ); // What: Withdraw Status Assertion. Why: The withdrawal is announced. How: This expects the host's status.

	const uidJoiStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Joiner String. Why: The request is read by the joiner's UID. How: This reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.

	expect( await docReaFun( joiEnvObj, `groups/${ groIdeStr }/joinRequests/${ uidJoiStr }` ) ).toBeUndefined(); // What: Request Gone Assertion. Why: The members stop seeing a withdrawn request. How: This expects none.

	await reqSenFun( secPagObj ); // What: Second Send Call. Why: There has to be a request to decline. How: This sends Dana's request again.

	await ownPagObj.getByRole( 'button', { name : 'Decline Dana Lee' } ).click(); // What: Decline Click Call. Why: A member turns the request down. How: This presses the button.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Your request has ended' } ) ).toBeFocused(); // What: Ended Focus Assertion. Why: The joiner learns at once, focus on the heading, since the withdrawal went. How: This expects the ended heading focused.

	await secPagObj.getByRole( 'button', { name : 'Ask again' } ).click(); // What: Ask Again Click Call. Why: A declined joiner may ask again. How: This presses the button.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Join Beach Day' } ) ).toBeFocused(); // What: Form Again Assertion. Why: The form comes back for a working link, focus on its heading. How: This expects the heading focused.


} );



pagTesObj( "a blocked joiner's request ends, and asking again is refused with a reason", async ( { page : ownPagObj, secPagObj } ) => { // What: Block Test. Why: A blocked joiner can't ask again, and the screen should say why it failed (Section 17). How: This asks, has the owner block the request, then asks again from the ended part and checks the alert.


	const { groIdeStr, tokValStr } = await invSetFun( ownPagObj ); // What: Setup Values. Why: The joiner opens the group's link, and the owner blocks them in the group. How: This starts the group and reads both.


	await secPagObj.goto( `/join/${ tokValStr }` ); // What: Link Open Call. Why: The joiner arrives through the link. How: This opens it.

	await reqSenFun( secPagObj ); // What: Request Send Call. Why: There has to be a request to block. How: This sends Dana's request.

	const uidJoiStr = ( await runPagFun( secPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Joiner String. Why: The owner blocks the joiner by UID. How: This reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.

	await runPagFun( ownPagObj, '/src/state/joins.ts', 'reqBloFun', groIdeStr, uidJoiStr ); // What: Block Call. Why: The owner ends the request for good. How: This blocks the joiner the way the app does.

	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Your request has ended' } ) ).toBeFocused(); // What: Ended Assertion. Why: A block ends the request like a decline. How: This expects the ended heading focused.

	await secPagObj.getByRole( 'button', { name : 'Ask again' } ).click(); // What: Ask Again Click Call. Why: The joiner tries again. How: This presses the button.

	await secPagObj.getByLabel( 'Your full name' ).fill( 'Dana Lee' ); // What: Name Fill Call. Why: The form needs a name to send. How: This types it.

	await secPagObj.getByRole( 'button', { name : 'Ask to join' } ).click(); // What: Ask Click Call. Why: The rules refuse a blocked joiner. How: This sends the request.

	await expect( secPagObj.getByRole( 'alert' ) ).toHaveText( /^The group didn't take the request\./ ); // What: Refused Assertion. Why: A refusal says why. How: This expects the alert's message.
	await expect( secPagObj.getByRole( 'heading', { level : 1, name : 'Join Beach Day' } ) ).toBeVisible(); // What: Form Kept Assertion. Why: A refused request leaves the form. How: This expects its heading still showing.


} );

// #endregion Module Init


