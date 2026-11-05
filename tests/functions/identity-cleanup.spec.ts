


// #region Imports

import { doc                       } from 'firebase/firestore';               // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { execFile                  } from 'node:child_process';               // What: Exec File. Why: The cleanup runs in a Node process of its own. How: This starts one.
import { expect                    } from '@playwright/test';                 // What: Expect. Why: Each check passes only when the run kept or deleted each identity as it should. How: This asserts on each read.
import { fileURLToPath             } from 'node:url';                         // What: File URL To Path. Why: The child script is found beside this suite. How: This turns its URL into a path.
import { getDoc                    } from 'firebase/firestore';               // What: Get Doc. Why: Accounts, notices, push tokens, and public keys are read back. How: This reads one document.
import { ideExiFun                 } from '../support/identities.ts';         // What: Identity Exists Function. Why: A deleted identity's sign-in record goes too. How: This asks whether one is still there.
import { ideImpFun                 } from '../support/identities.ts';         // What: Identity Import Function. Why: A phone left long ago can't be made by waiting. How: This imports records dated in the past.
import { ideRefFun                 } from '../support/identities.ts';         // What: Identity Refresh Function. Why: An identity that signed in long ago may still be in use. How: This makes one refreshed today.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';     // What: Initialize Test Environment. Why: The tests seed and read Firestore past its rules, as the server would. How: This connects to the emulator.
import { promisify                 } from 'node:util';                        // What: Promisify. Why: A test waits for the child to finish. How: This makes the child's start awaitable.
import { setDoc                    } from 'firebase/firestore';               // What: Set Doc. Why: The tests seed accounts and what's under them. How: This writes a document.
import { test                      } from '@playwright/test';                 // What: Test. Why: Deleting and keeping are separate behaviors. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';               // What: Timestamp. Why: Seeded times are Firestore timestamps. How: This builds them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * identity-cleanup.spec.ts = Identity Cleanup Spec
 *
 * @summary
 * Checks the daily cleanup of unused identities end to end in the local
 * Firebase Emulators, which npm run test:functions starts and stops around
 * this suite. Each test seeds sign-in records dated in the past and the
 * accounts beside them, runs the schedule once in a Node process of its own,
 * tests/support/cleanup-child.ts, since this suite's loader can't link the
 * Admin SDK's Auth module, and reads what the run left: an
 * identity unused for 180 days in no group goes with everything it kept,
 * while one in a group, paid, linked to Google, or used more recently stays.
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

const CHI_PAT_STR = fileURLToPath( new URL( '../support/cleanup-child.ts', import.meta.url ) ); // What: Child Path String. Why: Each run starts the child script. How: This is its path.

// #endregion Constants



// #region Module State

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check what the run kept or deleted. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Accounts and what's under them are closed to other readers. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};



const runCleFun = () => promisify( execFile )( process.execPath, [ CHI_PAT_STR ] ); // What: Run Cleanup Function. Why: Each test starts one run and waits for it. How: This runs the child script with Node, settling once it exits and rejecting when it fails.



const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Seed Document Function. Why: Tests start from accounts the app and the server wrote. How: This writes the document with the rules off.

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read goes through it. How: This connects to Firestore, where the run reads.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The accounts are seeded and read there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The functions run under this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( 'an identity unused for 180 days in no group is deleted with everything it kept, and so is one with no account', async () => { // What: Deletion Test. Why: A wiped or lost phone's identity holds nothing anyone needs. How: This seeds two old identities, one with an account, notice, push token, and public key, runs the cleanup, and checks each is gone.


	await ideImpFun( [ { dayAgoNum : 200, uidValStr : 'idle1' }, { dayAgoNum : 200, uidValStr : 'idle2' } ] ); // What: Old Records Seed. Why: Both phones were last used 200 days ago. How: This imports their sign-in records.

	await seeDocFun( 'accounts/idle1', { memberGroups : {}, ownedGroups : {} } );                                                                                                    // What: Account Seed. Why: An identity whose groups have all ended keeps empty maps. How: This writes the account.
	await seeDocFun( 'accounts/idle1/notices/removed-gro1', { createdAt : Timestamp.now(), expireAt : Timestamp.now(), groupId : 'gro1', groupName : 'Picnic', kind : 'removed' } ); // What: Notice Seed. Why: A notice can outlast its expiry until the TTL runs. How: This writes one under the account.
	await seeDocFun( 'accounts/idle1/pushToken/current', { expireAt : Timestamp.now(), token : 'tok', updatedAt : Timestamp.now() } );                                              // What: Push Token Seed. Why: A token can outlast its expiry until the TTL runs. How: This writes one under the account.
	await seeDocFun( 'users/idle1', { createdAt : Timestamp.now() } );                                                                                                              // What: Public Key Seed. Why: The identity published its key. How: This writes its user document.

	await runCleFun(); // What: Cleanup Run Call. Why: The day's cleanup runs once. How: This runs it and waits.

	expect( await ideExiFun( 'idle1' ) ).toBe( false );                                       // What: Sign-In Gone Assertion. Why: The sign-in record goes last. How: This expects it gone.
	expect( await ideExiFun( 'idle2' ) ).toBe( false );                                       // What: No Account Gone Assertion. Why: An identity whose bootstrap never finished holds nothing. How: This expects its record gone.
	expect( await reaDocFun( 'accounts/idle1' ) ).toBeUndefined();                            // What: Account Gone Assertion. Why: The account goes. How: This expects it gone.
	expect( await reaDocFun( 'accounts/idle1/notices/removed-gro1' ) ).toBeUndefined();       // What: Notice Gone Assertion. Why: What's under the account goes with it. How: This expects the notice gone.
	expect( await reaDocFun( 'accounts/idle1/pushToken/current' ) ).toBeUndefined();          // What: Push Token Gone Assertion. Why: What's under the account goes with it. How: This expects the token gone.
	expect( await reaDocFun( 'users/idle1' ) ).toBeUndefined();                               // What: Public Key Gone Assertion. Why: Nobody is left to wrap a key for. How: This expects it gone.


} );



test( 'an identity in a group, paid, linked to Google, or used within 180 days is kept', async () => { // What: Keeping Test. Why: Only an identity nobody needs is deleted. How: This seeds an old identity of each kept kind and a recent one, runs the cleanup, and checks each record and account is still there.


	await ideImpFun( [ // What: Kept Records Seed. Why: Each kind the cleanup keeps has its own record. How: This imports them.


		{ dayAgoNum : 200, uidValStr : 'keepMember'                   }, // What: Member Record. Why: An old identity still in a group. How: This dates it 200 days back.
		{ dayAgoNum : 200, uidValStr : 'keepOwner'                    }, // What: Owner Record. Why: An old identity that owns a group. How: This dates it 200 days back.
		{ dayAgoNum : 200, uidValStr : 'keepPaid'                     }, // What: Paid Record. Why: An old identity that bought the upgrade. How: This dates it 200 days back.
		{ dayAgoNum : 200, uidValStr : 'keepGoogle', gooLinBoo : true }, // What: Google Record. Why: An old identity linked to Google. How: This dates it 200 days back and links it.
		{ dayAgoNum : 100, uidValStr : 'keepRecent'                   }  // What: Recent Record. Why: An identity used 100 days ago is within the limit. How: This dates it 100 days back.


	] );


	const refUidStr = await ideRefFun( 200 ); // What: Refreshed UID String. Why: A phone that signed in 200 days ago and refreshed today is in use. How: This makes one.


	await seeDocFun( 'accounts/keepGoogle', { memberGroups : {}, ownedGroups : {} } );              // What: Google Account Seed. Why: The linked identity is in no group. How: This writes its empty account.
	await seeDocFun( 'accounts/keepMember', { memberGroups : { gro1 : true }, ownedGroups : {} } ); // What: Member Account Seed. Why: The member's account lists a group. How: This writes it.
	await seeDocFun( 'accounts/keepOwner', { memberGroups : {}, ownedGroups : { gro2 : true } } );  // What: Owner Account Seed. Why: The owner's account lists a group. How: This writes it.
	await seeDocFun( 'accounts/keepPaid', { memberGroups : {}, ownedGroups : {}, paid : true } );   // What: Paid Account Seed. Why: The purchase is on the account. How: This writes it, in no group.
	await seeDocFun( 'accounts/keepRecent', { memberGroups : {}, ownedGroups : {} } );              // What: Recent Account Seed. Why: The recent identity is in no group. How: This writes its empty account.
	await seeDocFun( `accounts/${ refUidStr }`, { memberGroups : {}, ownedGroups : {} } );          // What: Refreshed Account Seed. Why: The refreshed identity is in no group. How: This writes its empty account.

	await runCleFun(); // What: Cleanup Run Call. Why: The day's cleanup runs once. How: This runs it and waits.



	for ( const uidValStr of [ 'keepGoogle', 'keepMember', 'keepOwner', 'keepPaid', 'keepRecent', refUidStr ] ) { // What: Kept Loop. Why: Every one of these identities stays. How: This checks each.


		expect( await ideExiFun( uidValStr ), uidValStr ).toBe( true );                  // What: Sign-In Kept Assertion. Why: The identity can still sign in. How: This expects its record, naming it on a failure.
		expect( await reaDocFun( `accounts/${ uidValStr }` ), uidValStr ).toBeDefined(); // What: Account Kept Assertion. Why: The identity's groups and purchase stay recorded. How: This expects its account, naming it on a failure.


	}


} );

// #endregion Module Init


