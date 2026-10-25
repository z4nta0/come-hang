


// #region Imports

import { assertFails               } from '@firebase/rules-unit-testing'; // What: Assert Fails. Why: Forbidden reads and writes must be refused. How: This expects a request to be denied.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every request names a document. How: This builds a reference.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: Read rules are checked. How: This reads a document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The rules run in the local emulator. How: This connects to it with the project's rules.
import { readFileSync              } from 'node:fs';                      // What: Read File Sync. Why: The emulator is given the real rules file. How: This reads it.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Write rules are checked. How: This writes a document.
import { setLogLevel               } from 'firebase/firestore';           // What: Set Log Level. Why: Every refusal a test expects would otherwise print as a warning. How: This silences the SDK's logging.
import { test                      } from '@playwright/test';             // What: Test. Why: Each rule is its own test. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through it. How: This types it.

// #endregion Imports



/**
 * firestore.spec.ts = Firestore Rules Spec
 *
 * @summary
 * Checks firestore.rules in the local Firebase Emulator, which npm run
 * test:rules starts and stops around this suite, under a demo project that
 * can never reach a real one. No collection has a rule yet, so the one test
 * checks that a signed-in account is refused a read and a write. Each
 * collection's tests join this file as its rules are written.
 *
 * Sections:
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module State

let tesEnvObj : RulesTestEnvironment; // What: Test Environment Object. Why: Every test reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



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



test( 'a signed-in account is refused while no collection has a rule', async () => { // What: Default Refusal Test. Why: Firestore must refuse anything no rule allows. How: This reads and writes a document as a signed-in account.


	const aliStoObj = tesEnvObj.authenticatedContext( 'alice' ).firestore(); // What: Alice Store Object. Why: Alice is an ordinary signed-in account. How: This acts as her.


	await assertFails( getDoc( doc( aliStoObj, 'users/alice' ) ) );                       // What: Own Read Refusal. Why: No rule allows a read yet, not even of her own document. How: This expects the read refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : 1000 } ) ); // What: Own Write Refusal. Why: No rule allows a write yet. How: This expects the write refused.


} );

// #endregion Module Init


