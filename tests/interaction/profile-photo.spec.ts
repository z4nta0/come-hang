


// #region Imports

import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the photo is previewed, saved, shown, and removed as it should be. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: Setting up a member reads the group past the rules. How: This connects to the emulator.
import { joiWaiFun                 } from '../support/client.ts';         // What: Join Wait Function. Why: The member reads the owner's message only once it lands after their join by the server's clock. How: This waits until it's safe to send.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Another member has to see the photo. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member watches from a device of their own. How: This declares a test with a second page.
import { test                      } from '@playwright/test';             // What: Test. Why: The suite's hooks are declared on it. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The member setup reads through one. How: This types it.

// #endregion Imports



/**
 * profile-photo.spec.ts = Profile Photo Spec
 *
 * @summary
 * Checks a member's profile photo as people use it, in whichever engine the
 * project runs, against the Emulator Suite: a photo picked in Settings'
 * "Your profile" is previewed, then saved, and shows beside the member's
 * messages on another member's device in place of their initials once that
 * chat opens again, until it's removed and the initials come back.
 *
 * Sections:
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let proEnvObj : RulesTestEnvironment; // What: Profile Environment Object. Why: The member setup reads through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	proEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The member setup reads through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await proEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj( "a photo picked in Settings is previewed, saved, and shown beside the member's messages on another device, until it's removed", async ( { page : curPagObj, secPagObj } ) => { // What: Profile Photo Test. Why: A face tells members apart better than a color, and the member chooses whether to show one (Section 21). How: This sends a message as the owner, sets a photo, watches the member's chat show it, then removes it.


	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr } = await memSetFun( proEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The photo is kept in this group. How: This creates it with an owner and a member. // What: UID Member String. Why: The member's join time is waited out. How: This reads the member's UID.


	await joiWaiFun( proEnvObj, groIdeStr, uidMemStr ); // What: Join Wait Call. Why: A message stamped before the member's join by a clock that stepped back would hide from them. How: This waits out the join.

	await curPagObj.goto( '/' ); // What: Owner Open Call. Why: The owner sends a message, then sets the photo. How: This opens the app on the group.
	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member watches the owner's avatar. How: This opens the app on the group.

	await curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ).fill( 'Hello' ); // What: Message Fill Call. Why: The owner's avatar shows beside their message. How: This types one.

	await curPagObj.getByRole( 'textbox', { exact : true, name : 'Message' } ).press( 'Enter' ); // What: Message Send Call. Why: Enter sends. How: This presses it.



	const pngB64Str = await curPagObj.evaluate( () => { // What: PNG Base64 String. Why: The picker needs a real image the browser can shrink. How: This draws a colored rectangle on a canvas and reads it back as a PNG.


		const canEleObj = document.createElement( 'canvas' ); // What: Canvas Element Object. Why: The image is drawn on one. How: This makes it.

		canEleObj.width  = 300; // What: Width Assignment. Why: A photo wider than tall shows the square crop. How: This sets 300px.
		canEleObj.height = 200; // What: Height Assignment. Why: The crop keeps the middle. How: This sets 200px.


		const conDraObj = canEleObj.getContext( '2d' )!; // What: Context Drawing Object. Why: The rectangle is painted through it. How: This reads the canvas's 2D context. // What: Non-Null Note. Why: A new canvas always gives a 2D context. How: The ! reads it as present.


		conDraObj.fillStyle = '#4a4fc9'; // What: Fill Style Assignment. Why: The image needs some color to encode. How: This picks the app's accent.


		conDraObj.fillRect( 0, 0, 300, 200 ); // What: Fill Call. Why: The whole image is painted. How: This fills it.



		return canEleObj.toDataURL( 'image/png' ).split( ',' )[ 1 ]; // What: Base64 Return. Why: The test hands the bytes to the picker. How: This returns the PNG's base64, after its data URL prefix.


	} );



	const avaSpaObj = secPagObj.getByRole( 'listitem' ).filter( { hasText : 'Hello' } ).locator( '[aria-hidden="true"]' ).first(); // What: Avatar Span Object. Why: The member sees the owner's avatar beside the message. How: This finds the circle in the message's entry.


	await expect( avaSpaObj ).toHaveText( 'A' ); // What: Initials Assertion. Why: With no photo, the avatar shows the owner's initial. How: This waits for "A" beside the message.

	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Settings' } ).click(); // What: Settings Click Call. Why: The photo is set in Settings. How: This presses its tab.

	await curPagObj.getByLabel( 'Choose a profile photo' ).setInputFiles( { buffer : Buffer.from( pngB64Str, 'base64' ), mimeType : 'image/png', name : 'face.png' } ); // What: Pick Call. Why: The browser's picker chooses the photo. How: This sets the drawn PNG on the hidden input.

	await expect( curPagObj.getByRole( 'img', { name : 'Preview of your new profile photo' } ) ).toBeVisible(); // What: Preview Assertion. Why: The member sees the photo before saving it. How: This waits for the preview.

	await curPagObj.getByRole( 'button', { name : 'Save photo' } ).click(); // What: Save Click Call. Why: The member keeps the photo. How: This presses Save photo.

	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'saved' } ) ).toHaveText( 'Your photo is saved in every group.' ); // What: Saved Status Assertion. Why: The save is announced. How: This reads the status.
	await expect( curPagObj.getByRole( 'img', { name : 'Your profile photo' } ) ).toBeVisible();                                         // What: Saved Photo Assertion. Why: The part shows the saved photo. How: This waits for it.

	await secPagObj.reload(); // What: Member Reopen Call. Why: A chat reads its members as it opens, so the photo shows the next time it does (Section 21). How: This opens the member's chat again.

	await expect( avaSpaObj.locator( 'img' ) ).toHaveCount( 1 ); // What: Member Sees Photo Assertion. Why: Every member sees the photo in place of the initials. How: This waits for the image in the member's avatar.

	await curPagObj.getByRole( 'button', { name : 'Remove photo' } ).click(); // What: Remove Click Call. Why: The member goes back to their initials. How: This presses Remove photo.

	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'removed' } ) ).toHaveText( 'Your photo is removed. Your initials show instead.' ); // What: Removed Status Assertion. Why: The removal is announced. How: This reads the status.

	await secPagObj.reload(); // What: Member Reopen Call. Why: The chat reads the removal as it opens. How: This opens the member's chat again.

	await expect( avaSpaObj ).toHaveText( 'A' );                 // What: Initials Back Assertion. Why: Once removed, members see the initials again. How: This waits for "A" in the member's avatar.
	await expect( avaSpaObj.locator( 'img' ) ).toHaveCount( 0 ); // What: Photo Gone Assertion. Why: No copy of the photo is left to show. How: This expects no image in it.


} );

// #endregion Module Init


