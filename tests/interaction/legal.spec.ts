


// #region Imports

import { expect      } from '@playwright/test';     // What: Expect. Why: Each check passes only when the legal pages and links behave as they should. How: This asserts on what each check reads.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: The join form and Settings are reached by using the app. How: This opens a shared state.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: The join and Settings states are shared states. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.

// #endregion Imports



/**
 * legal.spec.ts = Legal Spec
 *
 * @summary
 * Checks the privacy policy and the terms where people meet them, in whichever
 * engine the project runs: the welcome and the join form link both static
 * pages in a new tab, Settings opens each document in a sheet that hands focus
 * back to its button when it closes, a link between the documents there
 * switches the sheet, and a static page follows a light or dark choice kept by
 * the app and links to the other page and back to the app.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



test( 'the welcome links the terms and the policy, each opening in a new tab', async ( { page } ) => { // What: Welcome Links Test. Why: Google's verification looks for the policy on the home page, and starting a group means agreeing to both. How: This opens the welcome and checks each link's address and target.


	await page.goto( '/' ); // What: Welcome Visit. Why: The welcome is what a first visit opens. How: This loads the root.


	const priLinObj = page.getByRole( 'link', { name : 'Privacy Policy' } );   // What: Privacy Link Object. Why: The policy's link is checked. How: This finds it by its name.
	const terLinObj = page.getByRole( 'link', { name : 'Terms of Service' } ); // What: Terms Link Object. Why: The terms' link is checked. How: This finds it by its name.


	await expect( priLinObj ).toHaveAttribute( 'href', '/privacy' ); // What: Privacy Address Assertion. Why: The link opens the policy's page. How: This checks its address.
	await expect( priLinObj ).toHaveAttribute( 'target', '_blank' ); // What: Privacy Target Assertion. Why: Reading the policy shouldn't leave the app. How: This checks it opens a new tab.
	await expect( terLinObj ).toHaveAttribute( 'href', '/terms' );   // What: Terms Address Assertion. Why: The link opens the terms' page. How: This checks its address.
	await expect( terLinObj ).toHaveAttribute( 'target', '_blank' ); // What: Terms Target Assertion. Why: Reading the terms shouldn't leave the app. How: This checks they open a new tab.


} );



test( 'the join form links the terms and the policy above its button', async ( { page } ) => { // What: Join Links Test. Why: Someone arriving through an invite link never sees the welcome, so the form says what asking means. How: This opens the join form and checks its two links.


	await opeStaFun( page, STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'join-phone' )! ); // What: Join Open Call. Why: The form opens from another's invite link. How: This opens the shared join state. // What: Non-Null Note. Why: The shared states list join-phone. How: The ! says it's there.


	const forCurObj = page.locator( 'form' ); // What: Form Current Object. Why: The links belong to the request form. How: This finds the form.


	await expect( forCurObj.getByRole( 'link', { name : 'Privacy Policy' } ) ).toHaveAttribute( 'href', '/privacy' ); // What: Privacy Address Assertion. Why: The form links the policy's page. How: This checks the link's address.
	await expect( forCurObj.getByRole( 'link', { name : 'Terms of Service' } ) ).toHaveAttribute( 'href', '/terms' ); // What: Terms Address Assertion. Why: The form links the terms' page. How: This checks the link's address.
	await expect( forCurObj ).toContainText( 'By asking to join, you agree' );                                        // What: Agreement Text Assertion. Why: The line names the step it covers. How: This checks its words.


} );



test( 'Settings opens each document in a sheet that hands focus back to its button', async ( { page } ) => { // What: Settings Sheet Test. Why: A member should be able to read both documents in the app, offline too, and come back to where they were. How: This opens the policy, closes it with Escape, checks focus, then opens the terms.


	await opeStaFun( page, STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'settings-phone' )! ); // What: Settings Open Call. Why: The documents' part is in Settings. How: This opens the owner's Settings. // What: Non-Null Note. Why: The shared states list settings-phone. How: The ! says it's there.

	await page.getByRole( 'button', { name : 'Privacy Policy' } ).click(); // What: Privacy Click Call. Why: The policy opens from its button. How: This presses it.

	await expect( page.getByRole( 'dialog', { name : 'Privacy Policy' } ).getByRole( 'heading', { name : 'The short version' } ) ).toBeVisible(); // What: Policy Shown Assertion. Why: The sheet shows the policy itself. How: This checks its first section's heading is showing.

	await page.keyboard.press( 'Escape' ); // What: Escape Press Call. Why: Escape closes a sheet. How: This presses it.

	await expect( page.getByRole( 'button', { name : 'Privacy Policy' } ) ).toBeFocused(); // What: Focus Return Assertion. Why: Closing a sheet should leave focus where the member was. How: This checks the button that opened it has focus.

	await page.getByRole( 'button', { name : 'Terms of Service' } ).click(); // What: Terms Click Call. Why: The terms open from their button. How: This presses it.

	await expect( page.getByRole( 'dialog', { name : 'Terms of Service' } ).getByRole( 'heading', { name : 'Who can use Come Hang' } ) ).toBeVisible(); // What: Terms Shown Assertion. Why: The same sheet shows the terms when they're asked for. How: This checks their first section's heading is showing.


} );



test( 'in Settings, a link from one document to the other switches the sheet, while a Ctrl or Cmd click opens the page', async ( { page } ) => { // What: Sheet Link Test. Why: Reading the documents in the app shouldn't leave it, while a modified click still works as on any link. How: This opens the terms, Ctrl or Cmd clicks their link to the policy and catches the new tab, then clicks it plainly and checks the sheet.


	await opeStaFun( page, STA_REC_ARR.find( ( staRecObj ) => staRecObj.ideStr === 'settings-phone' )! ); // What: Settings Open Call. Why: The documents' part is in Settings. How: This opens the owner's Settings. // What: Non-Null Note. Why: The shared states list settings-phone. How: The ! says it's there.

	await page.getByRole( 'button', { name : 'Terms of Service' } ).click(); // What: Terms Click Call. Why: The terms link to the policy. How: This opens them in the sheet.


	const terDiaObj = page.getByRole( 'dialog', { name : 'Terms of Service' } ); // What: Terms Dialog Object. Why: The link is pressed inside the terms' sheet. How: This finds the sheet by its name.
	const newTabPro = page.context().waitForEvent( 'page' );                     // What: New Tab Promise. Why: A modified click opens the static page in a new tab. How: This waits for the tab the click opens.


	await terDiaObj.getByRole( 'link', { name : 'Privacy Policy' } ).click( { modifiers : [ 'ControlOrMeta' ] } ); // What: Modified Click Call. Why: A Ctrl or Cmd click should be left to the browser. How: This clicks the link with Ctrl, or Cmd on a Mac.


	const newTabObj = await newTabPro; // What: New Tab Object. Why: The tab is checked once it opens. How: This awaits it.


	await expect( newTabObj ).toHaveURL( /\/privacy$/ ); // What: New Tab Address Assertion. Why: The new tab shows the static policy. How: This checks its address.

	await newTabObj.close(); // What: New Tab Close Call. Why: The rest of the test works in the app's tab. How: This closes the new one.

	await page.bringToFront(); // What: Front Call. Why: Headless Firefox may not refocus the window after another tab. How: This brings the app's tab back.

	await terDiaObj.getByRole( 'link', { name : 'Privacy Policy' } ).click(); // What: Plain Click Call. Why: A plain click should switch the sheet. How: This clicks the link.


	const priDiaObj = page.getByRole( 'dialog', { name : 'Privacy Policy' } ); // What: Privacy Dialog Object. Why: The sheet now holds the policy. How: This finds the sheet by its new name.


	await expect( priDiaObj.getByRole( 'heading', { name : 'The short version' } ) ).toBeInViewport(); // What: Policy Top Assertion. Why: The policy should open at its top. How: This checks its first section's heading is on screen.
	await expect( priDiaObj.getByRole( 'article', { name : 'Privacy Policy' } ) ).toBeFocused();       // What: Article Focus Assertion. Why: Focus moves to the new document, named by the sheet's title, since the link is gone. How: This checks the article has focus.
	await expect( page ).toHaveURL( /\/$/ );                                                           // What: Address Assertion. Why: The app stays where it was. How: This checks the address is still the root.


} );



test( 'a legal page follows the light or dark choice kept by the app, and links to the other page and back to the app', async ( { page } ) => { // What: Static Page Test. Why: Someone who chose dark in the app expects the pages to match, and each page leads on. How: This keeps a dark choice, opens the policy, checks its root, then follows its footer links.


	await page.addInitScript( () => localStorage.setItem( 'come-hang-color-mode', 'dark' ) ); // What: Dark Choice Call. Why: The app keeps a light or dark choice in local storage. How: This keeps dark before each load.

	await page.goto( '/privacy' ); // What: Policy Visit. Why: The policy has its own page. How: This loads it.

	await expect( page.locator( 'html' ) ).toHaveAttribute( 'data-color-mode-choice', 'dark' ); // What: Dark Choice Assertion. Why: The page's script applies the kept choice. How: This checks the root's attribute.

	await page.getByRole( 'contentinfo' ).getByRole( 'link', { name : 'Terms of Service' } ).click(); // What: Terms Click Call. Why: The policy's footer leads to the terms. How: This follows the link.

	await expect( page.getByRole( 'heading', { level : 1, name : 'Terms of Service' } ) ).toBeVisible(); // What: Terms Page Assertion. Why: The link should open the terms' page. How: This checks its title heading.

	await page.getByRole( 'contentinfo' ).getByRole( 'link', { name : 'Open Come Hang' } ).click(); // What: App Click Call. Why: The footer ends with the way back to the app. How: This follows the link.

	await expect( page.getByRole( 'heading', { level : 1, name : 'Come Hang' } ) ).toBeVisible(); // What: Welcome Assertion. Why: The link should open the app. How: This checks the welcome's heading.


} );


