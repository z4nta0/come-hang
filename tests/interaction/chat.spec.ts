


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the chat shows what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: A message from another member needs a group with two. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member writes from a device of their own. How: This declares a test with a second page.
import { readFile                  } from 'node:fs/promises';             // What: Read File. Why: A saved chat photo is checked by its bytes. How: This reads the downloaded file.
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
 * a chat longer than its log opens at the newest message and reads back to
 * the first, a message with characters the chat refuses is announced and
 * kept, and the group's next event is pinned above the chat.
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


	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ); // What: Text Box Object. Why: The message is typed there. How: This finds the composer.


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

	await expect( texBoxObj ).toHaveValue( '' );                           // What: Cleared Box Assertion. Why: A sent message leaves the box empty. How: This reads the box.
	await expect( curPagObj.getByRole( 'complementary' ) ).toHaveCount( 0 ); // What: No Event Assertion. Why: A group with no events shows no event panel. How: This expects none at the test's desktop width.


} );



test( 'a chat longer than its log opens at the newest message and scrolls back to the first', async ( { page : curPagObj } ) => { // What: Long Chat Test. Why: A member has to be able to read back through the chat, which a list spilling past the log's top couldn't. How: This sends more messages than a phone's log holds, checks the newest is in view and the first isn't, then moves the log to its start with the keyboard and checks the first comes into view.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Viewport Call. Why: A phone's log is the shortest. How: This sizes the page as one.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The test starts in a chat. How: This creates a group and opens it.


	const logEleObj = curPagObj.getByRole( 'log' );                                         // What: Log Element Object. Why: The checks read the log and its messages. How: This finds the log.
	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ); // What: Text Box Object. Why: The messages are typed there. How: This finds the composer.


	await texBoxObj.fill( 'Message 1' ); // What: First Fill Call. Why: The chat starts with its first message. How: This types it.

	await expect( async () => { // What: Send Retry Call. Why: A send before the membership mirror catches up is refused and leaves its text. How: This presses Enter until the message shows.


		await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it.

		await expect( logEleObj.getByRole( 'listitem' ) ).toHaveCount( 1, { timeout : 2000 } ); // What: Message Shown Assertion. Why: The send landed once the log holds it. How: This waits up to 2 seconds for it.


	} ).toPass(); // What: Retry Settings. Why: The mirror usually catches up within a moment. How: This retries until the message shows.



	for ( let mesNumNum = 2; mesNumNum <= 25; mesNumNum++ ) { // What: Message Loop. Why: The chat has to outgrow the log. How: This sends 24 more messages, each once the one before has shown.


		await texBoxObj.fill( `Message ${ mesNumNum }` ); // What: Message Fill Call. Why: Each message is told apart by its number. How: This types it.

		await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it.

		await expect( logEleObj.getByRole( 'listitem' ) ).toHaveCount( mesNumNum ); // What: Message Count Assertion. Why: The next message waits for this one. How: This waits for the log to hold it.


	}



	await expect( logEleObj.getByRole( 'listitem' ).last() ).toBeInViewport();      // What: Newest Shown Assertion. Why: The chat opens at its newest message. How: This expects the last entry on screen.
	await expect( logEleObj.getByRole( 'listitem' ).first() ).not.toBeInViewport(); // What: First Hidden Assertion. Why: The chat has outgrown its log. How: This expects the first entry off screen.

	await logEleObj.press( 'Home' ); // What: Home Press Call. Why: A keyboard user reads back from the log's start. How: This focuses the log and moves it to the top.

	await expect( logEleObj.getByRole( 'listitem' ).first() ).toBeInViewport(); // What: First Shown Assertion. Why: Every message can be read back to, which a list spilling past the log's top couldn't. How: This expects the first entry on screen.


} );



test( "a browser that once saw the database's WebSocket fail still connects the chat over WebSockets, never long polling", async ( { page : curPagObj } ) => { // What: WebSocket Test. Why: The database remembers a failed WebSocket in the browser's storage and then starts with long polling, whose scripts the live site's policy blocks, which once left a browser's chat unable to send or receive. How: This plants that memory before the app loads, records any long polling request, sends a message, and checks it lands with no long polling.


	const lonPolArr : string[] = []; // What: Long Polling Array. Why: Any long polling request means the database fell back. How: This collects their addresses.


	curPagObj.on( 'request', ( reqValObj ) => { if ( reqValObj.url().includes( '/.lp?' ) ) lonPolArr.push( reqValObj.url() ); } ); // What: Request Listener. Why: The database's long polling asks for its own address's .lp path. How: This records each such request.

	await curPagObj.addInitScript( () => localStorage.setItem( 'firebase:previous_websocket_failure', 'true' ) ); // What: Failure Memory Call. Why: A browser that once saw the WebSocket fail keeps this in its storage. How: This plants it before every load.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The test starts in a chat. How: This creates a group and opens it.


	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ); // What: Text Box Object. Why: The message is typed there. How: This finds the composer.


	await texBoxObj.fill( 'Still here' ); // What: Message Fill Call. Why: The chat has to send. How: This types a message.

	await expect( async () => { // What: Send Retry Call. Why: A send before the membership mirror catches up is refused and leaves its text. How: This presses Enter until the message shows.


		await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it.

		await expect( curPagObj.getByRole( 'log' ).getByRole( 'listitem' ) ).toHaveCount( 1, { timeout : 2000 } ); // What: Message Shown Assertion. Why: The send landed once the log holds it. How: This waits up to 2 seconds for it.


	} ).toPass(); // What: Retry Settings. Why: The mirror usually catches up within a moment. How: This retries until the message shows.

	expect( lonPolArr ).toEqual( [] ); // What: No Long Polling Assertion. Why: The database stays on WebSockets whatever the browser remembers. How: This expects no long polling request.


} );



test( 'a message with characters the chat refuses is announced and kept', async ( { page : curPagObj } ) => { // What: Refused Message Test. Why: A sender should learn why a message didn't go, without losing it. How: This sends text holding a direction override and checks the alert and the box.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The test starts in a chat. How: This creates a group and opens it.


	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ); // What: Text Box Object. Why: The message is typed there. How: This finds the composer.


	await texBoxObj.fill( 'Hi ‮ there' ); // What: Refused Fill Call. Why: A direction override can disguise a message. How: This types text holding one.

	await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: The message is sent. How: This presses Enter.

	await expect( curPagObj.getByRole( 'alert' ).filter( { hasText : 'characters' } ) ).toHaveText( "This message has characters that can't be sent." ); // What: Refusal Announced Assertion. Why: The sender learns why it didn't go. How: This reads the alert.
	await expect( texBoxObj ).toHaveValue( 'Hi ‮ there' );                                                                                               // What: Text Kept Assertion. Why: A refused message isn't lost. How: This reads the box.


} );



test( "the group's next event is pinned above the chat on a phone", async ( { page : curPagObj } ) => { // What: Pinned Event Test. Why: The group's next event stays in view above the chat (Section 14). How: This plans an event and checks its card at a phone width.


	await curPagObj.setViewportSize( { height : 844, width : 390 } ); // What: Phone Size Call. Why: The card pins the event below 1,100px wide. How: This sizes the page as a phone.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it.
	const staTimNum = Date.now() + 86400000;                                                                            // What: Start Time Number. Why: The pinned event is still to come. How: This starts it a day from now.


	await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3600000, locTexStr : 'Central Park', staTimNum, titTexStr : 'Picnic' } ); // What: Event Create Call. Why: The chat pins the next event. How: This plans an hour-long picnic.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The chat shows the event. How: This opens the app on the group.


	const pinButObj = curPagObj.getByRole( 'button', { name : /Picnic/ } ); // What: Pinned Button Object. Why: The checks read the card. How: This finds it by the event's title.


	await expect( pinButObj ).toBeVisible();                   // What: Card Assertion. Why: The card names the event. How: This waits for it.
	await expect( pinButObj ).toContainText( 'Central Park' ); // What: Place Assertion. Why: The card says where it is. How: This reads its line.


} );



test( 'a picked photo is previewed, sent with its caption, shown in the chat, and opens whole to save', async ( { page : curPagObj } ) => { // What: Chat Photo Test. Why: A member attaches a photo to a message, sees it in the chat, and keeps the ones they want (Section 22). How: This picks a drawn photo, removes it, picks it again, sends it with a caption, opens it in the viewer, and saves it, then checks a photo can't be sent offline.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The test starts in a chat. How: This creates a group and opens it.


	const pngB64Str = await curPagObj.evaluate( () => { // What: PNG Base64 String. Why: The picker needs a real image the browser can shrink. How: This draws a two-color rectangle on a canvas and reads it back as a PNG.


		const canEleObj = document.createElement( 'canvas' ); // What: Canvas Element Object. Why: The photo is drawn in the page. How: This makes a canvas off the page.


		canEleObj.width  = 400; // What: Canvas Width Assignment. Why: The photo needs a size. How: This makes it 400px wide.
		canEleObj.height = 300; // What: Canvas Height Assignment. Why: The photo needs a size. How: This makes it 300px tall.


		canEleObj.getContext( '2d' )!.fillRect( 0, 0, 200, 300 ); // What: Fill Call. Why: The photo needs something in it. How: This fills its left half black. // What: Non-Null Note. Why: A new canvas always gives a 2D context the first time it's asked. How: The ! reads it as present.



		return canEleObj.toDataURL( 'image/png' ).split( ',' )[ 1 ]; // What: Base64 Return. Why: The test hands the bytes to the picker. How: This returns the PNG's base64, after its data URL prefix.


	} );



	const filInpObj = curPagObj.locator( 'form input[type="file"]' );                                                  // What: File Input Object. Why: The photo button opens this hidden picker. How: This finds it in the composer.
	const filValObj = { buffer : Buffer.from( pngB64Str, 'base64' ), mimeType : 'image/png', name : 'look.png' };     // What: File Value Object. Why: The picker is handed the drawn photo. How: This holds it as a file.
	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } );                              // What: Text Box Object. Why: The caption is typed there. How: This finds the composer.


	await filInpObj.setInputFiles( filValObj ); // What: Photo Pick Call. Why: The member picks a photo. How: This hands the picker the drawn photo.

	await expect( curPagObj.getByRole( 'img', { name : 'Photo to send' } ) ).toBeVisible();     // What: Preview Assertion. Why: A picked photo shows before it's sent. How: This waits for its preview.
	await expect( curPagObj.getByRole( 'button', { name : 'Change the photo' } ) ).toBeVisible(); // What: Change Assertion. Why: With a photo picked, the button changes it. How: This reads its name.
	await expect( texBoxObj ).toHaveAttribute( 'placeholder', 'Add a caption' );                 // What: Caption Hint Assertion. Why: With a photo picked, the box takes its caption. How: This reads its hint.

	await curPagObj.getByRole( 'button', { name : 'Remove the photo' } ).click(); // What: Remove Click Call. Why: A member can change their mind. How: This removes the photo.

	await expect( curPagObj.getByRole( 'img', { name : 'Photo to send' } ) ).toHaveCount( 0 ); // What: Removed Assertion. Why: A removed photo leaves the composer. How: This expects no preview.

	await filInpObj.setInputFiles( filValObj ); // What: Photo Repick Call. Why: The same photo is picked again, which the emptied picker still registers. How: This hands it over again.

	await texBoxObj.fill( 'Look!' ); // What: Caption Fill Call. Why: A photo can carry words. How: This types the caption.


	const phoButObj = curPagObj.getByRole( 'button', { name : 'Open your photo' } ); // What: Photo Button Object. Why: The sent photo shows in the chat and opens. How: This finds it by its name.


	await expect( async () => { // What: Send Retry Call. Why: A send just after the group is made is refused until its membership mirror catches up, keeping the photo, which a retry sends without uploading it again. How: This presses Enter until the photo shows.


		await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: Enter sends the photo as it sends a message. How: This presses it.

		await expect( phoButObj ).toBeVisible( { timeout : 3000 } ); // What: Photo Shown Wait. Why: The send landed once the photo shows. How: This waits up to 3 seconds for it.


	} ).toPass(); // What: Retry Settings. Why: The mirror usually catches up within a moment. How: This retries until the photo shows or the test times out.



	await expect( phoButObj ).toBeVisible();                                                                         // What: Photo Shown Assertion. Why: The sender sees their photo at once. How: This waits for it in the chat.
	await expect( curPagObj.getByRole( 'log', { name : 'Messages' } ) ).toContainText( 'Look!' );                    // What: Caption Shown Assertion. Why: The caption shows with the photo. How: This reads the log.
	await expect( curPagObj.getByRole( 'img', { name : 'Photo to send' } ) ).toHaveCount( 0 );                     // What: Cleared Assertion. Why: A sent photo leaves the composer. How: This expects no preview.
	await expect( texBoxObj ).toHaveValue( '' );                                                                     // What: Box Cleared Assertion. Why: The caption is sent. How: This reads the box.

	await phoButObj.click(); // What: Photo Click Call. Why: A tapped photo opens whole. How: This presses it.


	const vieDiaObj = curPagObj.getByRole( 'dialog', { name : 'Photo' } ); // What: Viewer Dialog Object. Why: The checks read the viewer. How: This finds it by its title.


	await expect( vieDiaObj.getByRole( 'img', { name : 'Photo you sent' } ) ).toBeVisible();                            // What: Viewer Photo Assertion. Why: The viewer shows the photo whole. How: This waits for it.
	await expect( vieDiaObj ).toContainText( 'Chat photos stay on this device for 3 months, which you can change in Settings.' ); // What: Keep Note Assertion. Why: A member learns the photo won't stay forever. How: This reads the note.


	const dowValPro = curPagObj.waitForEvent( 'download' ); // What: Download Value Promise. Why: A computer's browser downloads a saved photo. How: This waits for the download the save starts.


	await vieDiaObj.getByRole( 'button', { name : 'Save to device' } ).click(); // What: Save Click Call. Why: The member keeps the photo. How: This presses Save to device.


	const dowValObj = await dowValPro;                          // What: Download Value Object. Why: The saved file is checked. How: This waits for the download.
	const savBytArr = await readFile( await dowValObj.path() ); // What: Saved Bytes Array. Why: The file is checked by its bytes. How: This reads the downloaded file.


	expect( dowValObj.suggestedFilename() ).toBe( 'come-hang-photo-1.jpg' );   // What: JPEG Name Assertion. Why: The file is named as what it is. How: This expects a .jpg name.
	expect( [ ...savBytArr.subarray( 0, 3 ) ] ).toEqual( [ 0xFF, 0xD8, 0xFF ] ); // What: JPEG Bytes Assertion. Why: The saved photo is a JPEG, whatever was sent. How: This expects JPEG's opening bytes.

	await vieDiaObj.getByRole( 'button', { name : 'Close' } ).click(); // What: Close Click Call. Why: The composer is used next. How: This closes the viewer.

	await expect( vieDiaObj ).toBeHidden(); // What: Closed Assertion. Why: The chat stays inert until the viewer's slide ends, so a key pressed sooner is lost. How: This waits for the viewer to go.

	await curPagObj.context().setOffline( true ); // What: Offline Call. Why: A photo has to upload to be sent. How: This cuts the page off.

	await filInpObj.setInputFiles( filValObj ); // What: Offline Pick Call. Why: The member picks a photo while offline. How: This hands it over.

	await texBoxObj.press( 'Enter' ); // What: Offline Send Call. Why: The member tries to send it. How: This presses Enter.

	await expect( curPagObj.getByRole( 'alert' ).filter( { hasText : 'online' } ) ).toHaveText( "Photos send only while you're online. Try again once you're connected." ); // What: Offline Refusal Assertion. Why: The member learns the photo has to wait for a connection. How: This reads the alert.
	await expect( curPagObj.getByRole( 'img', { name : 'Photo to send' } ) ).toBeVisible();                                                                                     // What: Photo Kept Assertion. Why: A photo that couldn't go isn't lost. How: This expects its preview still there.

	await curPagObj.context().setOffline( false ); // What: Online Call. Why: The page shouldn't stay cut off. How: This reconnects it.


} );



test( "a photo sent while an event runs can go to the event's photos instead, its caption as a message", async ( { page : curPagObj } ) => { // What: Event Photo Test. Why: While an event runs, a member can add a photo to its photos rather than the chat, by choice (Section 22). How: This plans an event under way, picks a photo, picks the event, and sends it with words, checking the photos line, the message, and that no chat photo was sent.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned in this group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const staTimNum = Date.now() - 3600000;                                                                             // What: Start Time Number. Why: The event is under way. How: This starts it an hour ago.


	await runPagFun( curPagObj, '/src/state/events.ts', 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : staTimNum + 3 * 3600000, locTexStr : '', staTimNum, titTexStr : 'Picnic' } ); // What: Event Create Call. Why: The choice shows only while an event runs. How: This plans a three-hour picnic under way.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The chat reads the event. How: This opens the app on the group.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Beach Day' } ) ).toBeVisible(); // What: Group Wait. Why: The chat shows once the group has loaded. How: This waits for its heading.


	const pngB64Str = await curPagObj.evaluate( () => { // What: PNG Base64 String. Why: The picker needs a real image the browser can shrink. How: This draws a two-color rectangle on a canvas and reads it back as a PNG.


		const canEleObj = document.createElement( 'canvas' ); // What: Canvas Element Object. Why: The photo is drawn in the page. How: This makes a canvas off the page.


		canEleObj.width  = 400; // What: Canvas Width Assignment. Why: The photo needs a size. How: This makes it 400px wide.
		canEleObj.height = 300; // What: Canvas Height Assignment. Why: The photo needs a size. How: This makes it 300px tall.


		canEleObj.getContext( '2d' )!.fillRect( 0, 0, 200, 300 ); // What: Fill Call. Why: The photo needs something in it. How: This fills its left half black. // What: Non-Null Note. Why: A new canvas always gives a 2D context the first time it's asked. How: The ! reads it as present.



		return canEleObj.toDataURL( 'image/png' ).split( ',' )[ 1 ]; // What: Base64 Return. Why: The test hands the bytes to the picker. How: This returns the PNG's base64, after its data URL prefix.


	} );



	const logDivObj = curPagObj.getByRole( 'log', { name : 'Messages' } );                // What: Log Div Object. Why: The checks read the chat. How: This finds the log.
	const texBoxObj = curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ); // What: Text Box Object. Why: The words are typed there. How: This finds the composer.


	await curPagObj.locator( 'form input[type="file"]' ).setInputFiles( { buffer : Buffer.from( pngB64Str, 'base64' ), mimeType : 'image/png', name : 'picnic.png' } ); // What: Photo Pick Call. Why: The member picks a photo. How: This hands the picker the drawn photo.

	await curPagObj.getByRole( 'checkbox', { name : "Add to Picnic's photos instead" } ).check(); // What: Event Check Call. Why: The member sends the photo to the event. How: This ticks the choice.

	await texBoxObj.fill( 'Look!' ); // What: Words Fill Call. Why: What's typed still reaches the chat. How: This types it.

	await texBoxObj.press( 'Enter' ); // What: Enter Press Call. Why: Enter sends. How: This presses it.

	await expect( logDivObj ).toContainText( 'You just uploaded photos for Picnic' );               // What: Photos Line Assertion. Why: The photo joined the event's photos, which the chat says. How: This waits for the line.
	await expect( logDivObj ).toContainText( 'Look!' );                                             // What: Message Assertion. Why: The words go as a message of their own. How: This reads the log.
	await expect( curPagObj.getByRole( 'button', { name : 'Open your photo' } ) ).toHaveCount( 0 ); // What: No Chat Photo Assertion. Why: The photo went to the event, not the chat. How: This expects no photo in the log.
	await expect( curPagObj.getByRole( 'img', { name : 'Photo to send' } ) ).toHaveCount( 0 );      // What: Cleared Assertion. Why: A shared photo leaves the composer. How: This expects no preview.


} );



test( 'a device short of room shows the storage card until it opens Settings, and never again after', async ( { page : curPagObj } ) => { // What: Storage Card Test. Why: A device whose app is near its quota should hear the chat photos can be cleared, once (Section 22). How: This has the browser report 90% used, checks the card, opens Settings from it, and checks the card stays away after a reload.


	await curPagObj.addInitScript( () => { // What: Estimate Stand-In Call. Why: No engine lets a test fill its quota, and WebKit can hand a later page a manager without a stub set on the manager itself. How: This reports 900 MB used of 1 GB before the app loads, on the manager's prototype where there is one, or on a stand-in manager where there's none.


		const estValFun = async () : Promise< StorageEstimate > => ( { quota : 1000000000, usage : 900000000 } ); // What: Estimate Value Function. Why: The app asks what it uses. How: This answers 900 MB of 1 GB.


		if ( 'StorageManager' in window ) Object.defineProperty( StorageManager.prototype, 'estimate', { configurable : true, value : estValFun } ); // What: Prototype Define Call. Why: Every manager the page gets reads its estimate from here. How: This replaces it with the stand-in.

		else Object.defineProperty( navigator, 'storage', { configurable : true, value : { estimate : estValFun } } ); // What: Manager Define Call. Why: The app reads the estimate through the navigator. How: This adds a stand-in manager where the browser has none.


	} );

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await groOpeFun( curPagObj ); // What: Group Open Call. Why: The card shows above the chat. How: This creates a group and opens it.


	const stoCarObj = curPagObj.getByRole( 'region', { name : 'Storage' } ); // What: Storage Card Object. Why: The checks read the card. How: This finds it by its name.


	await expect( stoCarObj ).toContainText( 'Chat photos are filling up this device.' ); // What: Card Assertion. Why: A device at 90% shows the card. How: This waits for its note.

	await stoCarObj.getByRole( 'button', { name : 'Open Settings' } ).click(); // What: Open Click Call. Why: Storage on this device is in Settings. How: This presses the card's button.

	await expect( curPagObj.getByRole( 'region', { name : 'Storage on this device' } ) ).toBeVisible(); // What: Settings Assertion. Why: The card leads to the storage part. How: This waits for it in the Settings section.

	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Chat' } ).click(); // What: Chat Click Call. Why: The card is checked in the chat again. How: This goes back to the chat.

	await curPagObj.reload(); // What: Reload Call. Why: An answered card shouldn't come back on a later visit. How: This opens the chat afresh.

	await expect( curPagObj.getByRole( 'log', { name : 'Messages' } ) ).toBeVisible(); // What: Chat Wait. Why: The card would show with the chat. How: This waits for the log.
	await expect( stoCarObj ).toHaveCount( 0 );                                    // What: Gone Assertion. Why: The answer is kept on the device. How: This expects no card.


} );

// #endregion Module Init


