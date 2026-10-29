


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when recovery behaved as it should. How: This asserts on what the pages and the emulator return.
import { gooRunFun                 } from '../support/client.ts';         // What: Google Run Function. Why: Linking and recovery go through Google's popup. How: This runs one and fills the popup in.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read past the rules. How: This connects to the emulator.
import { keyRawFun                 } from '../support/client.ts';         // What: Key Raw Function. Why: The recovered phone has to hold the group's own key. How: This exports a page's key.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Each test starts from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.


import type { Bytes                } from 'firebase/firestore';           // What: Bytes. Why: Public keys are read back as bytes. How: This types them.
import type { Page                 } from '@playwright/test';             // What: Page. Why: Helpers run in any identity's page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read goes through one. How: This types it.

// #endregion Imports



/**
 * recovery.spec.ts = Recovery Spec
 *
 * @summary
 * Checks recovering an identity onto a new phone in a real browser, in each
 * engine, against the Emulator Suite with the real security rules. Google
 * sign-in runs through the Auth emulator's own popup, which the tests fill
 * in with a unique email each time, since the emulator keeps its accounts
 * between tests. A member links their identity, a new phone signs in with
 * the same account and gets the identity back, its groups wait for the key
 * until another member shares it, and the old phone never takes the key
 * back. Recovery refuses on a phone whose identity has groups, and an
 * account linked to one identity can't link another.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const GRO_MOD_STR = '/src/state/groups.ts';    // What: Groups Module String. Why: A group's key loads there. How: This names its path.
const IDE_MOD_STR = '/src/state/identity.ts';  // What: Identity Module String. Why: Linking and recovery run there. How: This names its path.
const KEY_MOD_STR = '/src/state/key-share.ts'; // What: Key Module String. Why: Key requests are listed and answered there. How: This names its path.

// #endregion Constants



// #region Module State

let recEnvObj : RulesTestEnvironment; // What: Recovery Environment Object. Why: Every read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const mesGetFun = ( pagValObj : Page, modPatStr : string, funNamStr : string, ...argValArr : unknown[] ) : Promise< string > => pagValObj.evaluate( async ( [ modPatStr, funNamStr, argValArr ] ) => ( await import( /* @vite-ignore */ modPatStr ) )[ funNamStr ]( ...argValArr ).then( () => '', ( errCatObj : Error ) => errCatObj.message ), [ modPatStr, funNamStr, argValArr ] as const ); // What: Message Get Function. Why: A refusal's message is what a screen shows, while runPagFun reports only an error's name. How: This calls the function in the page and resolves with its error's message, or empty when it succeeds. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.



const pubGetFun = async ( uidValStr : string ) : Promise< Bytes > => ( await docReaFun( recEnvObj, `users/${ uidValStr }` ) )?.publicKey as Bytes; // What: Public Get Function. Why: Recovery publishes the new phone's key. How: This reads the identity's published key. // What: Type Assertion Note. Why: The rules store the key as bytes. How: The as reads it as such.

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	recEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read reaches the emulator through it. How: This connects to Firestore, where the keys and memberships are.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The keys are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await recEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a linked identity comes back on a new phone, whose groups open once a member shares the key', async ( { baseURL, browser, page, secPagObj } ) => { // What: Recovery Test. Why: Someone who lost their phone gets their identity, groups, and group keys back (Sections 6 and 8). How: This links the member, signs in on a new phone, waits for the key, has the owner share it, and checks the new phone reads with the group's key while the old phone keeps off the published key.


	const { groIdeStr, uidMemStr } = await memSetFun( recEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs the group and the member. How: This creates the group and lets the member in.

	const emaValStr = `dana-${ crypto.randomUUID() }@example.com`; // What: Email Value String. Why: The emulator keeps accounts between tests and engines. How: This makes one nobody else uses.



	expect( await runPagFun( secPagObj, IDE_MOD_STR, 'gooStaFun' ) ).toBe( false ); // What: Unlinked Check. Why: An identity starts unlinked. How: This expects false.
	expect( await gooRunFun( secPagObj, 'gooLinFun', emaValStr ) ).toBeUndefined(); // What: Link Check. Why: The member links their identity. How: This expects the link to go through.
	expect( await runPagFun( secPagObj, IDE_MOD_STR, 'gooStaFun' ) ).toBe( true );  // What: Linked Check. Why: Settings show the identity can be recovered. How: This expects true.


	const oldKeyObj = await pubGetFun( uidMemStr );            // What: Old Key Object. Why: The new phone publishes a key of its own. How: This reads the old phone's.
	const newCotObj = await browser.newContext( { baseURL } ); // What: New Context Object. Why: A new phone has none of the old one's storage. How: This opens a fresh context.
	const newPagObj = await newCotObj.newPage();               // What: New Page Object. Why: The new phone's steps run here. How: This opens a page in it.


	await newPagObj.goto( '/' ); // What: New Phone Visit. Why: The dev server serves the modules there. How: This opens the app.

	expect( ( await gooRunFun( newPagObj, 'gooRecFun', emaValStr ) as { uidValStr : string } ).uidValStr ).toBe( uidMemStr );                          // What: Recovery Check. Why: The same Google account brings back the same identity. How: This expects the member's UID. // What: Type Assertion Note. Why: gooRecFun resolves with the identity's record. How: The as reads its UID.
	expect( ( await pubGetFun( uidMemStr ) ).isEqual( oldKeyObj ) ).toBe( false );                                                                     // What: New Key Check. Why: The new phone's key pair replaced the published key. How: This expects a different key.
	expect( await mesGetFun( newPagObj, GRO_MOD_STR, 'keyLoaFun', groIdeStr ) ).toBe( "This group's key is waiting for a member to share it." );       // What: Waiting Check. Why: The old wrap won't open on the new phone. How: This expects the waiting message.
	expect( await mesGetFun( newPagObj, GRO_MOD_STR, 'keyLoaFun', groIdeStr ) ).toBe( "This group's key is waiting for a member to share it." );       // What: Still Waiting Check. Why: A standing request isn't filed twice, which the rules would refuse. How: This expects the same message again.
	expect( await runPagFun( page, KEY_MOD_STR, 'keyLisFun', groIdeStr ) ).toEqual( [ { reqTimNum : expect.any( Number ), uidValStr : uidMemStr } ] ); // What: Listed Check. Why: The owner sees who's waiting. How: This expects the member's request.

	await runPagFun( page, KEY_MOD_STR, 'keyShaFun', groIdeStr, uidMemStr ); // What: Share Call. Why: The owner holds the key. How: This shares it with the member's new phone.

	expect( ( await docReaFun( recEnvObj, `groups/${ groIdeStr }/members/${ uidMemStr }` ) )?.keyRequestedAt ).toBeUndefined(); // What: Answered Check. Why: Sharing ends the request. How: This expects the request gone.
	expect( await keyRawFun( newPagObj, groIdeStr ) ).toBe( await keyRawFun( page, groIdeStr ) );                               // What: Same Key Check. Why: The new phone reads with the group's own key. How: This compares both phones' keys.


	const newKeyObj = await pubGetFun( uidMemStr ); // What: New Key Object. Why: The old phone mustn't replace the new phone's key. How: This reads the key published now.


	await secPagObj.reload(); // What: Old Phone Reload. Why: The old phone's next start runs the bootstrap again. How: This reloads it.

	await runPagFun( secPagObj, IDE_MOD_STR, 'ideEnsFun' ); // What: Old Bootstrap Call. Why: An old phone still signed in mustn't take the key back. How: This runs its bootstrap.

	expect( ( await pubGetFun( uidMemStr ) ).isEqual( newKeyObj ) ).toBe( true ); // What: Kept Key Check. Why: The newest phone's key stands. How: This expects the published key still the new phone's.

	await newCotObj.close(); // What: Context Close Call. Why: The new phone shouldn't outlive its test. How: This closes it.


} );



pagTesObj( "recovery refuses on a phone whose identity has groups, and an account linked to one identity can't link another", async ( { page, secPagObj } ) => { // What: Refusal Test. Why: Recovery mustn't strand a phone's groups, and one Google account recovers one identity (Section 8). How: This links the member, then tries recovery on the member's phone and the account on the owner's, checking both are refused.


	await memSetFun( recEnvObj, page, secPagObj ); // What: Setup Call. Why: Both identities belong to a group. How: This creates the group and lets the member in.


	const emaValStr = `dana-${ crypto.randomUUID() }@example.com`; // What: Email Value String. Why: The emulator keeps accounts between tests and engines. How: This makes one nobody else uses.


	await gooRunFun( secPagObj, 'gooLinFun', emaValStr ); // What: Link Call. Why: The account is taken by the member. How: This links it.

	expect( await mesGetFun( secPagObj, IDE_MOD_STR, 'gooRecFun' ) ).toBe( "This phone already belongs to a group, so it can't take another identity." ); // What: Groups Here Check. Why: The member's groups would be stranded. How: This expects recovery refused before any popup.
	expect( await gooRunFun( page, 'gooLinFun', emaValStr ) ).toBe( 'error:auth/credential-already-in-use' );                                             // What: Taken Account Check. Why: The account recovers the member's identity. How: This expects the owner's link refused.
	expect( await runPagFun( page, IDE_MOD_STR, 'gooStaFun' ) ).toBe( false );                                                                            // What: Owner Unlinked Check. Why: The refused link changed nothing. How: This expects the owner still unlinked.


} );

// #endregion Module Init


