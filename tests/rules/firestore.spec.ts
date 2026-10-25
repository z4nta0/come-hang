


// #region Imports

import { assertFails               } from '@firebase/rules-unit-testing'; // What: Assert Fails. Why: Forbidden reads and writes must be refused. How: This expects a request to be denied.
import { assertSucceeds            } from '@firebase/rules-unit-testing'; // What: Assert Succeeds. Why: An allowed request must go through. How: This expects it to succeed.
import { collection                } from 'firebase/firestore';           // What: Collection. Why: Listing a collection is checked as its own request. How: This builds a collection reference.
import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: Deletion rules are checked. How: This deletes a document.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every request names a document. How: This builds a reference.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: Fetch rules are checked. How: This reads one document.
import { getDocs                   } from 'firebase/firestore';           // What: Get Docs. Why: List rules are checked. How: This reads a whole collection.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The rules run in the local emulator. How: This connects to it with the project's rules.
import { readFileSync              } from 'node:fs';                      // What: Read File Sync. Why: The emulator is given the real rules file. How: This reads it.
import { serverTimestamp           } from 'firebase/firestore';           // What: Server Timestamp. Why: A creation time has to be the server's own. How: This asks the server to fill it in.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Create rules are checked. How: This writes a whole document.
import { setLogLevel               } from 'firebase/firestore';           // What: Set Log Level. Why: Every refusal a test expects would otherwise print as a warning. How: This silences the SDK's logging.
import { test                      } from '@playwright/test';             // What: Test. Why: Each rule is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A test needs a fixed time a client might try to pass off as real. How: This builds one.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: Update rules are checked. How: This changes fields of an existing document.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through it. How: This types it.

// #endregion Imports



/**
 * firestore.spec.ts = Firestore Rules Spec
 *
 * @summary
 * Checks firestore.rules in the local Firebase Emulator, which npm run
 * test:rules starts and stops around this suite, under a demo project that
 * can never reach a real one. Each test acts as a chosen identity, or as
 * nobody signed in, and expects its requests allowed or refused: an identity
 * starting its own empty account and publishing its own key, and the forged
 * shapes, times, and other identities' documents the rules turn away.
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

const LON_KEY_STR = 'A'.repeat( 257 ); // What: Long Key String. Why: A key one character over the cap has to be refused. How: This is 257 characters.
const PUB_KEY_STR = 'A'.repeat( 88 );  // What: Public Key String. Why: The tests need a key the rules accept. How: This is 88 characters, the length of a P-256 public key in base64.

// #endregion Constants



// #region Module State

let tesEnvObj : RulesTestEnvironment; // What: Test Environment Object. Why: Every test reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const accStoFun = ( uidValStr : string ) => tesEnvObj.authenticatedContext( uidValStr ).firestore(); // What: Account Store Function. Why: Each test acts as a chosen identity. How: This returns a Firestore connection signed in under that UID.



const seeUseFun = () => tesEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), 'users/alice' ), { createdAt : Timestamp.fromMillis( 1000 ), publicKey : PUB_KEY_STR } ) ); // What: Seed User Function. Why: Update and delete tests need Alice's user document to exist first. How: This writes it with the rules turned off.

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one emulator connection. How: This connects with the real rules.


	setLogLevel( 'silent' ); // What: Log Silence Call. Why: The tests expect refusals, and assertFails already checks each one. How: This stops the SDK printing them.


	tesEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every test reaches the emulator through it. How: This connects to the emulator's Firestore under the demo project.


		firestore : { host : '127.0.0.1', port : 8200, rules : readFileSync( 'firestore.rules', 'utf8' ) }, // What: Firestore Options. Why: The emulator has to check the real rules. How: This names its address, the port firebase.json gives it, and the rules file's text.
		projectId : 'demo-come-hang'                                                                        // What: Project Identifier. Why: A demo project can never reach a real one. How: This names it, matching the project test:rules starts the emulator under.


	});


} );



test.afterAll( () => tesEnvObj.cleanup() ); // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.



test.beforeEach( () => tesEnvObj.clearFirestore() ); // What: Reset Hook. Why: Each test starts from an empty database. How: This clears it.



test( 'an identity starts its own empty account, and only it can read the account', async () => { // What: Account Owner Test. Why: Memberships and the paid flag are private. How: This starts Alice's account, then reads it as her and as Bob.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is someone else. How: This acts as him.


	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : {} } ) ); // What: Own Account Start. Why: An identity starts its own account. How: This expects an empty one allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'accounts/alice' ) ) );                  // What: Own Account Read. Why: The owner reads their memberships. How: This expects it allowed.
	await assertFails( getDoc( doc( bobStoObj, 'accounts/alice' ) ) );                     // What: Other Account Read. Why: Nobody else learns which groups Alice is in. How: This expects Bob refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/bob' ), { groups : {} } ) );      // What: Other Account Start. Why: Nobody starts another identity's account. How: This expects Alice refused.


} );



test( "an account can't start paid, already in groups, or holding other fields, and can't be changed yet", async () => { // What: Account Shape Test. Why: No client may grant itself the paid flag or a membership. How: This tries each forged start, then a change to a real account.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.


	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : {}, paid : true } ) );    // What: Paid Start. Why: Only the payment webhook sets the paid flag. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : { gro1 : 'owner' } } ) ); // What: Grouped Start. Why: Groups join an account only through the batches that create or join one. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), {} ) );                              // What: Empty Start. Why: An account always holds its groups map. How: This expects one without it refused.
	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : {} } ) );              // What: Valid Start. Why: The forged starts above failed only for their forgery. How: This expects the plain start allowed.
	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { paid : true } ) );              // What: Paid Update. Why: No rule lets a client change its account yet. How: This expects the change refused.


} );



test( 'an identity publishes its own key at the server time, which anyone signed in can fetch but not list', async () => { // What: User Publish Test. Why: An approving member needs a joiner's key, but nobody should browse every user. How: This publishes Alice's key, then fetches and lists as others.


	const aliStoObj = accStoFun( 'alice' );                           // What: Alice Store Object. Why: Alice publishes the key. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );                             // What: Bob Store Object. Why: Bob stands in for an approving member. How: This acts as him.
	const nobStoObj = tesEnvObj.unauthenticatedContext().firestore(); // What: Nobody Store Object. Why: A signed-out request gets nothing. How: This acts as nobody.


	await assertSucceeds( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : PUB_KEY_STR } ) ); // What: Own Key Publish. Why: An identity publishes its key on first sign-in. How: This expects it allowed.
	await assertSucceeds( getDoc( doc( bobStoObj, 'users/alice' ) ) );                                                             // What: Key Fetch. Why: An approver fetches the joiner's key. How: This expects Bob allowed.
	await assertFails( getDoc( doc( nobStoObj, 'users/alice' ) ) );                                                                // What: Signed-Out Fetch. Why: Every request needs an identity. How: This expects nobody refused.
	await assertFails( getDocs( collection( bobStoObj, 'users' ) ) );                                                              // What: User List. Why: Nobody browses every identity. How: This expects listing refused.


} );



test( 'a user document is refused with a forged time, a bad key, an extra field, or another owner', async () => { // What: User Shape Test. Why: A document anyone may fetch must hold only a real key and time. How: This tries each forgery.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice publishes the key. How: This acts as her.


	await assertFails( setDoc( doc( aliStoObj, 'users/bob' ), { createdAt : serverTimestamp(), publicKey : PUB_KEY_STR } ) );                 // What: Other Publish. Why: Nobody publishes a key for another identity. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : Timestamp.fromMillis( 1000 ), publicKey : PUB_KEY_STR } ) );    // What: Backdated Publish. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), extra : true, publicKey : PUB_KEY_STR } ) ); // What: Extra Field Publish. Why: The document holds only its two fields. How: This expects a third refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : 5 } ) );                         // What: Number Key Publish. Why: A key is text. How: This expects a number refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : '' } ) );                        // What: Empty Key Publish. Why: An empty key wraps nothing. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : LON_KEY_STR } ) );               // What: Long Key Publish. Why: The cap keeps the field from holding anything else. How: This expects 257 characters refused.


} );



test( 'only the owner replaces its key, the creation time stays put, and nobody deletes it', async () => { // What: User Update Test. Why: A key moves with a linked identity to a new device, and nothing else changes. How: This seeds Alice's document, then changes it as her and as Bob.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the document. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is someone else. How: This acts as him.


	await seeUseFun(); // What: User Seed Call. Why: The changes need a document to change. How: This writes Alice's.

	await assertSucceeds( updateDoc( doc( aliStoObj, 'users/alice' ), { publicKey : 'B'.repeat( 88 ) } ) );          // What: Own Key Replace. Why: A new device brings a new key. How: This expects it allowed.
	await assertFails( updateDoc( doc( aliStoObj, 'users/alice' ), { createdAt : Timestamp.fromMillis( 2000 ) } ) ); // What: Time Change. Why: The creation time never moves. How: This expects it refused.
	await assertFails( updateDoc( doc( bobStoObj, 'users/alice' ), { publicKey : 'C'.repeat( 88 ) } ) );             // What: Other Key Replace. Why: Nobody swaps another identity's key. How: This expects Bob refused.
	await assertFails( deleteDoc( doc( aliStoObj, 'users/alice' ) ) );                                               // What: Own Delete. Why: No rule allows deleting a user document yet. How: This expects it refused.


} );



test( 'a document no rule covers is refused', async () => { // What: Uncovered Document Test. Why: Firestore must refuse anything no rule allows. How: This reads and writes a group document, which has no rules yet, as a signed-in identity.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is an ordinary signed-in identity. How: This acts as her.


	await assertFails( getDoc( doc( aliStoObj, 'groups/gro1' ) ) );                      // What: Uncovered Read. Why: No rule allows it. How: This expects the read refused.
	await assertFails( setDoc( doc( aliStoObj, 'groups/gro1' ), { name : 'Dinner' } ) ); // What: Uncovered Write. Why: No rule allows it. How: This expects the write refused.


} );

// #endregion Module Init


