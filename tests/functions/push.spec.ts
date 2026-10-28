


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The token is read back after a send. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the push and the token are as they should be. How: This asserts on what each send and read returns.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The token is read back after a send. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests seed and read tokens past the rules. How: This connects to the emulator.
import { pusSenFun                 } from '../../functions/src/push.ts';  // What: Push Send Function. Why: The helper is checked on its own, with a stand-in for FCM. How: This is the deployed helper.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: A token can change during a send. How: This writes the token document.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior of a send is its own test. How: This declares them.
import { tokSetFun                 } from '../support/pushes.ts';         // What: Token Set Function. Why: Most tests start with a stored token. How: This seeds one.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * push.spec.ts = Push Send Spec
 *
 * @summary
 * Checks the push helper in the test's own process, against the Firestore
 * emulator, with a stand-in sender in place of FCM, since there's no FCM
 * emulator: the stand-in records what it was handed, or rejects as FCM
 * does. The helper sends to the stored token, skips an identity with none,
 * deletes a token FCM rejects as dead, and keeps one that failed for any
 * other reason or that the app replaced during the send.
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

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const reaTokFun = async () : Promise< unknown > => { // What: Read Token Function. Why: Tests check whether Bob's token survived. How: This reads its token field with the rules off, undefined once deleted.


	let tokValAny : unknown; // What: Token Value Any. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { tokValAny = ( await getDoc( doc( cotAdmObj.firestore(), 'accounts/bob/pushToken/current' ) ) ).get( 'token' ); } ); // What: Token Read Call. Why: The token is the owner's alone. How: This reads it with the rules off.



	return tokValAny; // What: Token Return. Why: The test compares it. How: This returns it.


};



const rejFunFun = ( codValStr : string ) => async () => { throw Object.assign( new Error( codValStr ), { code : codValStr } ); }; // What: Reject Function Function. Why: Tests need FCM's failures without FCM. How: This returns a sender that rejects with the given code.

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read reaches the emulator through it. How: This connects to Firestore, where tokens live.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Tokens live there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The helper's Admin SDK uses the project test:functions starts. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from an empty Firestore. How: This clears it.


	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's token. How: This clears it.


} );



test( 'a push goes to the stored token with the group as its title, and nobody without a token is sent one', async () => { // What: Send Test. Why: Pushes reach the one phone each identity registered, saying only what the server can read (Section 14). How: This sends to Bob with a token and to Carol without one, through a stand-in that records each message.


	const senMesArr : unknown[] = []; // What: Sent Message Array. Why: The stand-in records what it was handed. How: This collects each message.


	await tokSetFun( funEnvObj, 'bob', 'tok-bob' ); // What: Token Seed Call. Why: Bob's phone is registered. How: This stores its token.

	await pusSenFun( 'bob', 'removed', 'Picnic', async ( mesValObj ) => { senMesArr.push( mesValObj ); } );   // What: Bob Send Call. Why: Bob has a token. How: This sends him a removal push through the recording stand-in.
	await pusSenFun( 'carol', 'removed', 'Picnic', async ( mesValObj ) => { senMesArr.push( mesValObj ); } ); // What: Carol Send Call. Why: Carol has no token. How: This tries to send her one through the same stand-in.

	expect( senMesArr ).toEqual( [ { notification : { body : 'You were removed from this group.', title : 'Picnic' }, token : 'tok-bob' } ] ); // What: One Message Sent. Why: Only Bob had a phone to reach, and the push carries only the group's name and the kind's sentence. How: This expects his message alone.


} );



test( 'a token FCM rejects as dead is deleted, while any other failure or a token replaced during the send is kept', async () => { // What: Stale Token Test. Why: A dead token would fail every push, but a passing failure or a fresh token mustn't be thrown away (Section 14). How: This sends through stand-ins that fail in each way and reads the token after each.


	await tokSetFun( funEnvObj, 'bob', 'tok-bob' ); // What: Token Seed Call. Why: Bob's phone is registered. How: This stores its token.

	await pusSenFun( 'bob', 'removed', 'Picnic', rejFunFun( 'messaging/internal-error' ) ); // What: Passing Failure Send. Why: FCM can fail for its own reasons. How: This sends through a stand-in rejecting with an internal error.

	expect( await reaTokFun() ).toBe( 'tok-bob' ); // What: Token Kept. Why: The token itself isn't dead. How: This expects it still stored.

	await pusSenFun( 'bob', 'removed', 'Picnic', async () => { // What: Replaced Token Send. Why: The app may store a new token while a push to the old one fails. How: This sends through a stand-in that replaces the token, then rejects the old one as dead.


		await funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), 'accounts/bob/pushToken/current' ), { token : 'tok-new' } ) ); // What: Token Replace Call. Why: The app stored a new token mid-send. How: This writes it with the rules off.

		await rejFunFun( 'messaging/registration-token-not-registered' )(); // What: Dead Rejection Call. Why: FCM rejects the old token. How: This rejects the way FCM does for an unregistered one.


	} );

	expect( await reaTokFun() ).toBe( 'tok-new' ); // What: New Token Kept. Why: The fresh token works. How: This expects it still stored.

	await pusSenFun( 'bob', 'removed', 'Picnic', rejFunFun( 'messaging/registration-token-not-registered' ) ); // What: Dead Token Send. Why: FCM rejects a token that's no longer registered. How: This sends through a stand-in rejecting it that way.

	expect( await reaTokFun() ).toBeUndefined(); // What: Token Deleted. Why: A dead token would fail every push. How: This expects it gone.


} );

// #endregion Module Init


