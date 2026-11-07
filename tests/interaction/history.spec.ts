


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


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive pages. How: This types them.
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
 * A member whose phone lacks the range is told why there's no button, a
 * member who presses Send history after someone else claimed it is thanked,
 * and a claim stalled for 30 minutes can be freed for someone else.
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

let hisEnvObj : RulesTestEnvironment; // What: History Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region memAddFun

/**
 * memAddFun = Member Add Function
 *
 * @summary
 * Lets a page into the owner's group the way the app does: the page asks
 * through the group's link under the given name, and the owner approves it.
 * Resolves with the new member's UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ownPagObj - Owner Page Object: The owner's page.
 * @param joiPagObj - Joiner Page Object: The page that joins.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param namValStr - Name Value String: The joiner's name.
 *
 * @returns A promise that resolves with the joiner's UID.
 *
 * @example
 * ```ts
 * memAddFun(page, secPagObj, 'Xk3...', 'Dana Lee') // => 'u9F...'
 * ```
 *
*/

const memAddFun = async ( ownPagObj : Page, joiPagObj : Page, groIdeStr : string, namValStr : string ) : Promise< string > => { // What: Member Add Function. Why: Several tests need members besides the owner. How: This files a request through the link and approves it.


	const tokValStr = ( await docReaFun( hisEnvObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                       // What: Token Value String. Why: The joiner joins through the link. How: This reads the token the group names. // What: Type Assertion Note. Why: A group always names its token. How: The as reads it as a string.
	const uidMemStr = ( await runPagFun( joiPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Member String. Why: The owner approves the joiner by UID. How: This makes the joiner's identity and reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await runPagFun( joiPagObj, '/src/state/joins.ts', 'reqCreFun', tokValStr, namValStr, '' ); // What: Request Call. Why: The joiner asks to join. How: This files the request under the name.

	await runPagFun( ownPagObj, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidMemStr ); // What: Approval Call. Why: The owner lets the joiner in. How: This approves the request.



	return uidMemStr; // What: UID Return. Why: Tests act on the member by UID. How: This returns it.


};

// #endregion memAddFun



// #region recSetFun

/**
 * recSetFun = Recovery Setup Function
 *
 * @summary
 * Starts a group as Alice on the owner's page, lets Dana Lee in from the
 * second page, and has Dana ask for a recovery of the chat since she joined.
 * Resolves with the group's ID and Dana's UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ownPagObj - Owner Page Object: The owner's page.
 * @param danPagObj - Dana Page Object: Dana's page.
 *
 * @returns A promise that resolves with the group's ID and Dana's UID.
 *
 * @example
 * ```ts
 * recSetFun(page, secPagObj) // => { groIdeStr, uidDanStr }
 * ```
 *
*/

const recSetFun = async ( ownPagObj : Page, danPagObj : Page ) : Promise< { groIdeStr : string, uidDanStr : string } > => { // What: Recovery Setup Function. Why: Three tests start from Dana's open request. How: This makes the group, lets Dana in, and files her request.


	await ownPagObj.goto( '/' ); // What: Owner Visit. Why: The dev server serves the modules there. How: This opens the app.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The request belongs to this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const uidDanStr = await memAddFun( ownPagObj, danPagObj, groIdeStr, 'Dana Lee' );                                    // What: UID Dana String. Why: Dana asks for history. How: This lets her in and reads her UID.


	await runPagFun( danPagObj, '/src/state/history.ts', 'hisAskFun', groIdeStr, 'recovery', null ); // What: Ask Call. Why: Dana's request is what the others see. How: This files a recovery as Dana.



	return { groIdeStr, uidDanStr }; // What: Setup Return. Why: The test acts on the group and the request. How: This returns both.


};

// #endregion recSetFun

// #endregion Helpers



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
	await expect( secPagObj.getByText( 'You asked the group for chat history. A member whose device holds it can send a copy.' ) ).toBeVisible(); // What: Waiting Assertion. Why: The request waits for a member. How: This expects the banner's waiting line.

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

pagTesObj( 'a member whose phone lacks the range is told so, with no Send button', async ( { page : ownPagObj, secPagObj } ) => { // What: Uncovered Test. Why: Only a phone holding the whole range can fill a request, and a member offered nothing should know why (Section 11.9). How: This has Dana ask while the owner's phone holds no chat, opens People as the owner, and checks the note shows and the button doesn't.


	await recSetFun( ownPagObj, secPagObj ); // What: Setup Call. Why: Dana's request is open. How: This sets it up.

	await ownPagObj.goto( '/' ); // What: Owner Reopen Call. Why: The owner opens the group afresh. How: This opens the app.

	await ownPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: Requests are listed in People. How: This opens it.

	await expect( ownPagObj.getByText( "Your device doesn't hold all of it, so another member will need to send it." ) ).toBeVisible(); // What: Note Assertion. Why: The owner's phone holds no chat, so it can't fill the request. How: This expects the note.
	await expect( ownPagObj.getByRole( 'button', { name : 'Send history to Dana Lee' } ) ).toHaveCount( 0 );                             // What: No Button Assertion. Why: A phone that can't fill the request isn't offered to. How: This expects no button.


} );



pagTesObj( 'a member who presses Send history after someone else claimed it is thanked', async ( { browser, baseURL, page : ownPagObj, secPagObj } ) => { // What: Lost Race Test. Why: Two members may press at once, and only one claim wins (Section 11.9). How: This shows Sam the button, holds his claim's request at the network, has the owner claim while it waits, lets it through, and checks Sam is thanked.


	const samConObj = await browser.newContext( { baseURL } ); // What: Sam Context Object. Why: Sam is a third member on a device of his own. How: This opens a context for him.
	const samPagObj = await samConObj.newPage();               // What: Sam Page Object. Why: Sam acts from his own page. How: This opens one.


	await samPagObj.goto( '/' ); // What: Sam Visit. Why: The dev server serves the modules there. How: This opens the app.


	const { groIdeStr, uidDanStr } = await recSetFun( ownPagObj, secPagObj );          // What: Setup Values. Why: Dana's request is open. How: This sets it up.
	const uidSamStr = await memAddFun( ownPagObj, samPagObj, groIdeStr, 'Sam Ortiz' ); // What: UID Sam String. Why: Sam's phone will hold the chat. How: This lets him in and reads his UID.


	await runPagFun( samPagObj, '/src/platform/chat-store.ts', 'mesPutFun', { groIdeStr, mesIdeStr : 'old', senUidStr : uidSamStr, sntTimNum : 1, texValStr : 'Hi' } ); // What: History Seed Call. Why: Send history is offered only to a phone holding the whole range. How: This stores a message older than Dana's join on Sam's phone.

	await samPagObj.goto( '/' ); // What: Sam Reopen Call. Why: The watch started before Sam was in. How: This opens the app again.

	await samPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: Requests are answered in People. How: This opens it.

	await expect( samPagObj.getByRole( 'button', { name : 'Send history to Dana Lee' } ) ).toBeVisible(); // What: Offered Assertion. Why: Sam's phone covers the request. How: This expects his button.

	let heaResFun = () => {}; // What: Held Resolve Function. Why: The test learns when Sam's claim is held. How: This holds the held promise's resolver, set below.
	let relGatFun = () => {}; // What: Release Gate Function. Why: Sam's claim waits until the owner's lands. How: This holds the gate's opener, set below.


	const gatProObj = new Promise< void >( ( resValFun ) => { relGatFun = resValFun; } ); // What: Gate Promise Object. Why: Sam's held request continues once it settles. How: This keeps its opener.
	const heaProObj = new Promise< void >( ( resValFun ) => { heaResFun = resValFun; } ); // What: Held Promise Object. Why: The test has to know Sam's claim is under way before the owner claims. How: This keeps its resolver.


	await samPagObj.route( /documents:(batchGet|commit)/, async ( rouValObj ) => { heaResFun(); await gatProObj; await rouValObj.continue(); } ); // What: Hold Route Call. Why: Sam's claim has to read the request after the owner's claim lands. How: This holds each of Sam's transaction requests until the gate opens, telling the test once the first is held.


	await samPagObj.getByRole( 'button', { name : 'Send history to Dana Lee' } ).click(); // What: Send Click Call. Why: Sam presses while the request is still open. How: This presses his button.

	await heaProObj; // What: Held Wait. Why: Sam's claim has to be on its way first. How: This waits until its request is held.

	await runPagFun( ownPagObj, '/src/state/history.ts', 'hisClaFun', groIdeStr, uidDanStr ); // What: Owner Claim Call. Why: Someone else claims while Sam's claim waits. How: This claims the request as the owner.

	relGatFun(); // What: Gate Open Call. Why: Sam's claim now reads the request after the owner's. How: This lets his held requests through.

	await expect( samPagObj.getByRole( 'status' ).filter( { hasText : 'Thanks anyway' } ) ).toHaveText( 'Someone else is already sending it. Thanks anyway.' ); // What: Thanks Assertion. Why: A press that lost the race should still be answered. How: This expects the section's status.

	await samConObj.close(); // What: Context Close Call. Why: Sam's context shouldn't outlive the test. How: This closes it.


} );



pagTesObj( 'a claim stalled for 30 minutes can be freed for someone else', async ( { browser, baseURL, page : ownPagObj, secPagObj } ) => { // What: Stalled Claim Test. Why: A claimant who drops away shouldn't block the request (Section 11.9). How: This has the owner claim Dana's request, moves the claim 31 minutes back, has Sam free it from People, and checks the claim's line goes and focus moves to the heading.


	const samConObj = await browser.newContext( { baseURL } ); // What: Sam Context Object. Why: Sam is a third member on a device of his own. How: This opens a context for him.
	const samPagObj = await samConObj.newPage();               // What: Sam Page Object. Why: Sam acts from his own page. How: This opens one.


	await samPagObj.goto( '/' ); // What: Sam Visit. Why: The dev server serves the modules there. How: This opens the app.


	const { groIdeStr, uidDanStr } = await recSetFun( ownPagObj, secPagObj ); // What: Setup Values. Why: Dana's request is open. How: This sets it up.


	await memAddFun( ownPagObj, samPagObj, groIdeStr, 'Sam Ortiz' ); // What: Sam Add Call. Why: Sam frees the claim. How: This lets him in.

	await runPagFun( ownPagObj, '/src/state/history.ts', 'hisClaFun', groIdeStr, uidDanStr ); // What: Owner Claim Call. Why: The owner's claim is the one that stalls. How: This claims the request as the owner.

	await hisEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/historyRequests/${ uidDanStr }` ), { claimedAt : Timestamp.fromMillis( Date.now() - 31 * 60000 ) } ); } ); // What: Stall Call. Why: Only a claim 30 minutes old may be freed by another member. How: This moves the claim 31 minutes back.

	await samPagObj.goto( '/' ); // What: Sam Reopen Call. Why: The watch started before Sam was in. How: This opens the app again.

	await samPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'People' } ).click(); // What: People Click Call. Why: Requests are answered in People. How: This opens it.

	await expect( samPagObj.getByText( 'Alice is sending it.' ) ).toBeVisible(); // What: Claimed Assertion. Why: Others see who has the request. How: This expects the claim's line.

	await samPagObj.getByRole( 'button', { name : 'Let someone else send it to Dana Lee' } ).click(); // What: Free Click Call. Why: The stalled claim is freed. How: This presses the button.

	await expect( samPagObj.getByRole( 'heading', { level : 3, name : 'Asking for chat history' } ) ).toBeFocused(); // What: Focus Assertion. Why: The pressed button goes, so focus lands on the heading. How: This expects it focused.
	await expect( samPagObj.getByText( 'Alice is sending it.' ) ).toHaveCount( 0 );                                 // What: Freed Assertion. Why: The request is open again. How: This expects the claim's line gone.

	await samConObj.close(); // What: Context Close Call. Why: Sam's context shouldn't outlive the test. How: This closes it.


} );

// #endregion Module Init


