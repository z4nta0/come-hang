


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The deletion is checked in Firestore. How: This reads documents past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the deletion does what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The checks read Firestore past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: An owner's group passes to its member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member joins from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups are made and deleted the way the app does it. How: This calls the app's functions in a page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The checks read through one. How: This types it.

// #endregion Imports



/**
 * delete-data.spec.ts = Delete Data Spec
 *
 * @summary
 * Checks deleting someone's data as people do it, in whichever engine the
 * project runs, against the Emulator Suite: from Settings, the confirmation
 * refuses another word and gives focus back on Escape, then the deletion hands
 * the owner's group to its member, clears the phone, and starts the app over
 * at the landing page, which says so once; and the welcome offers the same
 * deletion to a phone holding an identity in no group.
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

let delEnvObj : RulesTestEnvironment; // What: Delete Environment Object. Why: The checks read Firestore through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region phoReaFun

/**
 * phoReaFun = Phone Read Function
 *
 * @summary
 * Reads what the app keeps on the phone: how many records its IndexedDB
 * database holds across its stores, and its local storage keys. The app
 * opens its database as it starts, so after a deletion the database is
 * there again, empty.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The phone's page.
 *
 * @returns A promise that resolves with the record count and the keys.
 *
 * @example
 * ```ts
 * phoReaFun(page) // => { keyNamArr : [], recCouNum : 0 }
 * ```
 *
*/

const phoReaFun = ( curPagObj : Page ) : Promise< { keyNamArr : string[], recCouNum : number } > => curPagObj.evaluate( async () => { // What: Phone Read Function. Why: A deletion has to clear what the phone keeps. How: This counts the database's records and lists the app's keys.


	const datValObj = await new Promise< IDBDatabase >( ( resValFun, rejValFun ) => { // What: Database Value Object. Why: The app's keys and chat history live in its database. How: This opens it at whatever version it's at.


		const opeReqObj = indexedDB.open( 'come-hang' ); // What: Open Request Object. Why: The database opens asynchronously. How: This asks for it.


		opeReqObj.onsuccess = () => resValFun( opeReqObj.result ); // What: Success Handler. Why: The count needs the open database. How: This resolves with it.
		opeReqObj.onerror   = () => rejValFun( opeReqObj.error );  // What: Error Handler. Why: A failed open has to fail the check. How: This rejects with the error.


	} );

	let recCouNum = 0; // What: Record Count Number. Why: Every store's records are counted together. How: This starts at none.


	for ( const stoNamStr of [ ...datValObj.objectStoreNames ] ) { // What: Store Count Loop. Why: Keys and messages are in separate stores. How: This adds each store's count.


		recCouNum += await new Promise< number >( ( resValFun, rejValFun ) => { // What: Store Count Addition. Why: Each store's records count. How: This waits for the store's count and adds it.


			const couReqObj = datValObj.transaction( stoNamStr ).objectStore( stoNamStr ).count(); // What: Count Request Object. Why: The store counts its records asynchronously. How: This asks for the count.


			couReqObj.onsuccess = () => resValFun( couReqObj.result ); // What: Success Handler. Why: The loop adds the count. How: This resolves with it.
			couReqObj.onerror   = () => rejValFun( couReqObj.error );  // What: Error Handler. Why: A failed count has to fail the check. How: This rejects with the error.


		} );


	}



	datValObj.close(); // What: Database Close Call. Why: An open connection would hold up the app's own work. How: This closes it.



	return { keyNamArr : Object.keys( localStorage ).filter( ( keyNamStr ) => keyNamStr.startsWith( 'come-hang-' ) ), recCouNum }; // What: Phone Return. Why: The test compares both. How: This returns the app's keys and the record count.


} );

// #endregion phoReaFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	delEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The checks read through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await delEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj( 'an owner deletes their data from Settings only once delete is typed, the group passing to its member, and the phone starts over', async ( { page : curPagObj, secPagObj } ) => { // What: Settings Deletion Test. Why: Deleting data is on purpose, keeps the other members' group, and leaves nothing on the phone. How: This sets up a group with a member, refuses a wrong word, deletes, and checks the welcome, the group, and the phone.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( delEnvObj, curPagObj, secPagObj ); // What: Group Setup Values. Why: The group passes to its member, and the owner's documents are checked. How: This makes the group and lets the member in.


	await curPagObj.goto( '/' ); // What: App Open Call. Why: The owner works in the group. How: This opens the app.

	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : 'Settings' } ).click(); // What: Settings Click Call. Why: The deletion is in Settings. How: This presses its tab.


	const delButObj = curPagObj.getByRole( 'button', { name : 'Delete my data' } ); // What: Delete Button Object. Why: The button opens the confirmation, whose answer shares its name. How: This finds whichever shows.
	const delInpObj = curPagObj.getByLabel( 'Type "delete" to confirm' );           // What: Delete Input Object. Why: The word is typed there. How: This finds the box by its label.


	await delButObj.click(); // What: Open Click Call. Why: The owner starts the deletion. How: This opens the confirmation.

	await expect( delInpObj ).toBeFocused(); // What: Box Focus Assertion. Why: Typing the word is the next step. How: This expects the box focused.

	await delInpObj.press( 'Escape' ); // What: Escape Press Call. Why: Escape leaves the confirmation. How: This presses it in the box.

	await expect( delButObj ).toBeFocused(); // What: Return Focus Assertion. Why: Leaving the confirmation returns focus to its button. How: This expects the button focused.

	await delButObj.click(); // What: Reopen Click Call. Why: The owner starts again. How: This opens the confirmation.

	await delInpObj.fill( 'remove' ); // What: Wrong Fill Call. Why: Another word is refused. How: This types one.

	await delButObj.click(); // What: Wrong Submit Call. Why: The confirmation checks the word. How: This presses the answer.

	await expect( curPagObj.locator( '#delWorErr' ) ).toHaveText( 'Type delete to confirm.' ); // What: Mismatch Assertion. Why: The problem is told beside its box. How: This reads it.
	await expect( delInpObj ).toBeFocused();                                                   // What: Mismatch Focus Assertion. Why: The owner fixes the word in the box. How: This expects it focused.

	await curPagObj.evaluate( ( groIdeStr ) => localStorage.setItem( `come-hang-history-hidden-${ groIdeStr }`, 'true' ), groIdeStr ); // What: Kept Key Call. Why: The clear-out is only proven with a key of the identity's to remove. How: This keeps one, as dismissing the history banner would.

	await delInpObj.fill( ' DELETE ' ); // What: Word Fill Call. Why: The word counts whatever its case and the spaces around it. How: This types it in capitals with spaces.

	await delButObj.click(); // What: Confirm Click Call. Why: The owner deletes their data. How: This presses the answer.

	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'deleted' } ) ).toHaveText( 'Your data has been deleted from Come Hang and this phone.', { timeout : 20000 } ); // What: Deleted Status Assertion. Why: The app starts over and says the data is gone. How: This reads the welcome's status, allowing for the server call, the clear-out, and the reload, which WebKit takes longest over.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Plans made. Fun had. Memories created.' } ) ).toBeVisible(); // What: Landing Assertion. Why: The app starts over at the landing page, with no identity left. How: This expects its heading.
	await expect( delButObj ).toHaveCount( 0 );                                                        // What: No Button Assertion. Why: A phone with nothing left has nothing to delete. How: This expects the button gone.

	expect( ( await docReaFun( delEnvObj, `groups/${ groIdeStr }` ) )?.ownerUid ).toBe( uidMemStr ); // What: Handover Assertion. Why: The member keeps the group. How: This reads its owner.
	expect( await docReaFun( delEnvObj, `accounts/${ uidOwnStr }` ) ).toBeUndefined();               // What: Account Gone Assertion. Why: The owner's account goes. How: This expects it gone.
	expect( await docReaFun( delEnvObj, `users/${ uidOwnStr }` ) ).toBeUndefined();                  // What: Public Key Gone Assertion. Why: The owner's public key goes. How: This expects it gone.
	expect( await phoReaFun( curPagObj ) ).toEqual( { keyNamArr : [], recCouNum : 0 } );             // What: Phone Clear Assertion. Why: Nothing of the identity stays on the phone. How: This expects no record in the app's database and no key of the app's.

	await curPagObj.reload(); // What: Reload Call. Why: The note is said once. How: This reloads the landing page.

	await expect( curPagObj.getByRole( 'heading', { level : 1, name : 'Plans made. Fun had. Memories created.' } ) ).toBeVisible();  // What: Reloaded Landing Assertion. Why: The landing page opens again. How: This expects its heading.
	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'deleted' } ) ).toHaveCount( 0 ); // What: Note Gone Assertion. Why: A reload shouldn't say it again. How: This expects no such status.


} );



test( 'the welcome offers a phone with an identity in no group a way to delete its data', async ( { page : curPagObj } ) => { // What: Welcome Deletion Test. Why: An identity in no group can still hold data, with no Settings to reach. How: This makes an identity, deletes its only group, deletes its data from the welcome, and checks the welcome's status and that the public key is gone.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.

	await expect( curPagObj.getByRole( 'button', { name : 'Delete my data' } ) ).toHaveCount( 0 ); // What: First Visit Assertion. Why: A phone that never acted has nothing to delete. How: This expects no button.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: Starting a group makes the identity. How: This creates one as the app does. // What: Type Assertion Note. Why: groCreFun resolves with the group's ID. How: The as reads it as a string.

	const uidOwnStr = ( await docReaFun( delEnvObj, `groups/${ groIdeStr }` ) )?.ownerUid as string; // What: UID Owner String. Why: The identity's documents are checked by its UID. How: This reads the group's owner. // What: Type Assertion Note. Why: The rules store the owner as a string. How: The as reads it as one.


	await runPagFun( curPagObj, '/src/state/groups.ts', 'groDelFun', groIdeStr ); // What: Group Delete Call. Why: The identity stays with no group. How: This deletes its only group.

	await curPagObj.goto( '/' ); // What: Welcome Open Call. Why: Someone in no group sees the welcome. How: This opens the app.

	await curPagObj.getByRole( 'button', { name : 'Delete my data' } ).click(); // What: Open Click Call. Why: The welcome offers the deletion. How: This opens the confirmation.

	await curPagObj.getByLabel( 'Type "delete" to confirm' ).fill( 'delete' ); // What: Word Fill Call. Why: The word confirms. How: This types it.

	await curPagObj.getByRole( 'button', { name : 'Delete my data' } ).click(); // What: Confirm Click Call. Why: The person deletes their data. How: This presses the answer.

	await expect( curPagObj.getByRole( 'status' ).filter( { hasText : 'deleted' } ) ).toHaveText( 'Your data has been deleted from Come Hang and this phone.', { timeout : 20000 } ); // What: Deleted Status Assertion. Why: The app starts over and says so. How: This reads the welcome's status, allowing for the server call, the clear-out, and the reload.

	await expect( curPagObj.getByRole( 'button', { name : 'Delete my data' } ) ).toHaveCount( 0 ); // What: No Button Assertion. Why: Nothing is left to delete. How: This expects the button gone.

	expect( await docReaFun( delEnvObj, `users/${ uidOwnStr }` ) ).toBeUndefined(); // What: Public Key Gone Assertion. Why: The identity's public key goes. How: This expects it gone.


} );

// #endregion Module Init


