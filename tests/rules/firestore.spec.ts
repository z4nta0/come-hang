


// #region Imports

import { assertFails               } from '@firebase/rules-unit-testing'; // What: Assert Fails. Why: Forbidden reads and writes must be refused. How: This expects a request to be denied.
import { assertSucceeds            } from '@firebase/rules-unit-testing'; // What: Assert Succeeds. Why: An allowed request must go through. How: This expects it to succeed.
import { Bytes                     } from 'firebase/firestore';           // What: Bytes. Why: Keys, IVs, and ciphertext are stored as bytes. How: This builds byte values of a chosen size.
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
import { writeBatch                } from 'firebase/firestore';           // What: Write Batch. Why: A group is created in one batch of four writes. How: This builds the batch.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through one. How: This types it.

// #endregion Imports



/**
 * firestore.spec.ts = Firestore Rules Spec
 *
 * @summary
 * Checks firestore.rules in the local Firebase Emulator, which npm run
 * test:rules starts and stops around this suite, under demo projects that
 * can never reach a real one. Each test acts as a chosen identity, or as
 * nobody signed in, and expects its requests allowed or refused: an identity
 * starting its account and publishing its key, a group created in one batch,
 * and the forgeries and missing parts the rules turn away.
 *
 * The caps are checked twice: in the main project, under the rules as they
 * ship, with the paywall open, and in a second project loaded with the same
 * rules but the paywall's switch turned on.
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

const GRO_NAM_STR = 'Dinner Club';                                  // What: Group Name String. Why: Most groups need a name the rules accept. How: This is an ordinary one.
const LOC_SWI_STR = 'return false; // What: Paywall Locked Return'; // What: Locked Switch String. Why: The locked rules are the real rules with the switch turned on. How: This is the switch's line, which the locked copy replaces.
const TOK_ONE_STR = 'abcdefghijABCDEFGHIJ_-';                       // What: Token One String. Why: Most groups need an invite token the rules accept. How: This is 22 base64url characters.

// #endregion Constants



// #region Module State

const RUL_TEX_STR = readFileSync( 'firestore.rules', 'utf8' ); // What: Rules Text String. Why: Both emulator projects load the real rules. How: This reads the file once.


if ( !RUL_TEX_STR.includes( LOC_SWI_STR ) ) throw new Error( 'the paywall switch line is missing from firestore.rules' ); // What: Switch Guard. Why: The locked copy is only a real test while the switch is found and replaced. How: This stops the suite when the line has changed.



let locEnvObj : RulesTestEnvironment; // What: Locked Environment Object. Why: The locked-paywall tests reach the second project through it. How: This is set before the first test.
let tesEnvObj : RulesTestEnvironment; // What: Test Environment Object. Why: Every other test reaches the main project through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const accStoFun = ( uidValStr : string ) => tesEnvObj.authenticatedContext( uidValStr ).firestore(); // What: Account Store Function. Why: Each test acts as a chosen identity. How: This returns a connection to the main project signed in under that UID.
const bytFilFun = ( lenNum : number ) => Bytes.fromUint8Array( new Uint8Array( lenNum ) );           // What: Bytes Filled Function. Why: Byte fields are checked by size. How: This returns that many zero bytes.
const locStoFun = ( uidValStr : string ) => locEnvObj.authenticatedContext( uidValStr ).firestore(); // What: Locked Store Function. Why: The locked-paywall tests act as chosen identities too. How: This returns a connection to the locked project signed in under that UID.



// #region groMapFun

/**
 * groMapFun = Group Map Function
 *
 * @summary
 * Builds an account's groups map with a given number of entries, all owned
 * or all member entries, for the cap tests to seed. Each key joins the
 * prefix to a two-digit count.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param preStr    - Prefix String: What each group ID starts with.
 * @param couNum    - Count Number: How many entries to build.
 * @param rolValStr - Role Value String: The role every entry gets, owner or
 *                    member.
 *
 * @returns The groups map.
 *
 * @example
 * ```ts
 * groMapFun('own', 2, 'owner') // => { own01 : 'owner', own02 : 'owner' }
 * ```
 *
*/

const groMapFun = ( preStr : string, couNum : number, rolValStr : string ) => Object.fromEntries( Array.from( Array( couNum ).keys(), ( keyIndNum ) => [ `${ preStr }${ String( keyIndNum + 1 ).padStart( 2, '0' ) }`, rolValStr ] ) ); // What: Group Map Function. Why: The cap tests seed accounts with many groups. How: This builds the entries from the count.

// #endregion groMapFun



// #region seeDocFun

/**
 * seeDocFun = Seed Document Function
 *
 * @summary
 * Writes a document with the rules turned off, so a test can start from a
 * state no client could reach on its own, such as an account already at a
 * cap or a paid flag only the webhook could set.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: Which emulator project to write
 *                    to.
 * @param patValStr - Path Value String: The document's path.
 * @param datValObj - Data Value Object: The document's fields.
 *
 * @returns A promise that settles once the document is written, with no
 *          value.
 *
 * @example
 * ```ts
 * seeDocFun(tesEnvObj, 'accounts/alice', { groups : {} }) // => Promise<void>
 * ```
 *
*/

const seeDocFun = ( envTesObj : RulesTestEnvironment, patValStr : string, datValObj : Record< string, unknown > ) => envTesObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Seed Document Function. Why: Tests start from states only the server could write. How: This writes the document with the rules off.

// #endregion seeDocFun



type GbfOptTyp = { accObj? : Record< string, unknown >, accStr? : string | null, ideStr? : string, groObj? : Record< string, unknown > | null, invObj? : Record< string, unknown > | null, memObj? : Record< string, unknown > | null, tokStr? : string }; // What: GBF Options Type. Why: Each creation test changes or leaves out one part of the batch. How: This lists the overrides, where null leaves that part out and accObj adds fields to the account write.
type StoConTyp = ReturnType< ReturnType< RulesTestEnvironment[ 'authenticatedContext' ] >[ 'firestore' ] >; // What: Store Connection Type. Why: A test context's connection has its own type, which the SDK's Firestore type doesn't match. How: This takes the type the context's firestore method returns.

// #region groBatFun

/**
 * groBatFun = Group Batch Function
 *
 * @summary
 * Commits the four writes that create a group, as the app will: the group,
 * the creator's member document, the first invite, and the group added to
 * the creator's account. Each part starts from valid values, which an
 * option can change field by field (merged over the defaults) or leave out
 * entirely (null), and the account write can carry extra fields. The invite
 * copies the group's name unless its own fields say otherwise.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The signed-in connection that
 *                    writes the batch.
 * @param uidValStr - UID Value String: The creator's UID.
 * @param optValObj - Option Value Object: {@link GbfOptTyp}, empty by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * groBatFun(aliStoObj, 'alice', { groObj : { memberCount : 2 } }) // => Promise<void>
 * ```
 *
*/

const groBatFun = ( stoConObj : StoConTyp, uidValStr : string, optValObj : GbfOptTyp = {} ) => { // What: Group Batch Function. Why: Most group tests commit the same four writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj );         // What: Batch Write Object. Why: The four writes have to land together. How: This starts the batch.
	const groIdeStr = optValObj.ideStr ?? 'gro1';      // What: Group Identifier String. Why: A test may create several groups. How: This takes the given ID, or gro1.
	const tokValStr = optValObj.tokStr ?? TOK_ONE_STR; // What: Token Value String. Why: A test may need its own token. How: This takes the given token, or the default.

	const groDatObj = { // What: Group Data Object. Why: The group's starting fields, changed where the test asks. How: This merges the overrides over valid defaults.


		chatTtlDays        : 30,
		createdAt          : serverTimestamp(),
		currentInviteToken : tokValStr,
		memberCount        : 1,
		name               : GRO_NAM_STR,
		ownerUid           : uidValStr,
		pendingOwnerUid    : null,
		removedUids        : {},

		...optValObj.groObj // What: Group Override Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


	};


	if ( optValObj.groObj !== null ) batWriObj.set( doc( stoConObj, `groups/${ groIdeStr }` ), groDatObj ); // What: Group Write. Why: The group is the batch's center. How: This adds it unless the test leaves it out.



	if ( optValObj.memObj !== null ) batWriObj.set( doc( stoConObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), { joinedAt : serverTimestamp(), lastActiveAt : serverTimestamp(), wrappedGroupKey : bytFilFun( 105 ), ...optValObj.memObj } ); // What: Member Write. Why: The creator is the first member. How: This adds their membership, with a 105-byte wrapped key, unless the test leaves it out.



	if ( optValObj.invObj !== null ) batWriObj.set( doc( stoConObj, `invites/${ tokValStr }` ), { createdAt : serverTimestamp(), groupId : groIdeStr, groupName : groDatObj.name, ...optValObj.invObj } ); // What: Invite Write. Why: A group always has a working invite. How: This adds the first one unless the test leaves it out.



	if ( optValObj.accStr !== null ) batWriObj.update( doc( stoConObj, `accounts/${ uidValStr }` ), { [ `groups.${ groIdeStr }` ] : optValObj.accStr ?? 'owner', ...optValObj.accObj } ); // What: Account Write. Why: The group takes one of the creator's owned slots. How: This adds the entry, owner unless the test says otherwise, plus any extra fields the test adds, unless the test leaves it out.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion groBatFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to each emulator project. How: This connects to both, with the real rules and the locked copy.


	setLogLevel( 'silent' ); // What: Log Silence Call. Why: The tests expect refusals, and assertFails already checks each one. How: This stops the SDK printing them.


	locEnvObj = await initializeTestEnvironment({ // What: Locked Environment Assignment. Why: The paywall's locked caps need rules with the switch on. How: This connects to a second demo project loaded with that copy.


		firestore : { host : '127.0.0.1', port : 8200, rules : RUL_TEX_STR.replace( LOC_SWI_STR, 'return true; // What: Paywall Locked Return' ) }, // What: Firestore Options. Why: The locked copy differs from the real rules only in the switch. How: This names the emulator's address and the rules with the switch turned on.
		projectId : 'demo-come-hang-locked' // What: Project Identifier. Why: Each emulator project holds its own rules and data. How: This names the second one.


	});

	tesEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Most tests reach the emulator through it. How: This connects to the emulator's Firestore under the main demo project.


		firestore : { host : '127.0.0.1', port : 8200, rules : RUL_TEX_STR }, // What: Firestore Options. Why: The emulator has to check the real rules. How: This names its address, the port firebase.json gives it, and the rules file's text.
		projectId : 'demo-come-hang'                                          // What: Project Identifier. Why: A demo project can never reach a real one. How: This names it, matching the project test:rules starts the emulator under.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connections should close with the suite. How: This cleans up both.


	await locEnvObj.cleanup(); // What: Locked Cleanup Call. Why: The second project's connection closes too. How: This cleans it up.
	await tesEnvObj.cleanup(); // What: Main Cleanup Call. Why: The main connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from empty databases. How: This clears both projects.


	await locEnvObj.clearFirestore(); // What: Locked Clear Call. Why: The locked project starts empty. How: This clears it.
	await tesEnvObj.clearFirestore(); // What: Main Clear Call. Why: The main project starts empty. How: This clears it.


} );



test( 'an identity starts its own empty account, and only it can read the account', async () => { // What: Account Owner Test. Why: Memberships and the paid flag are private. How: This starts Alice's account, then reads it as her and as Bob.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is someone else. How: This acts as him.


	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : {} } ) ); // What: Own Account Start. Why: An identity starts its own account. How: This expects an empty one allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'accounts/alice' ) ) );                  // What: Own Account Read. Why: The owner reads their memberships. How: This expects it allowed.
	await assertFails( getDoc( doc( bobStoObj, 'accounts/alice' ) ) );                     // What: Other Account Read. Why: Nobody else learns which groups Alice is in. How: This expects Bob refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/bob' ), { groups : {} } ) );      // What: Other Account Start. Why: Nobody starts another identity's account. How: This expects Alice refused.


} );



test( "an account can't start paid, already in groups, or holding other fields, or grant itself the paid flag", async () => { // What: Account Shape Test. Why: No client may grant itself the paid flag or a membership. How: This tries each forged start, then a paid flag on a real account.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.


	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : {}, paid : true } ) );    // What: Paid Start. Why: Only the payment webhook sets the paid flag. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : { gro1 : 'owner' } } ) ); // What: Grouped Start. Why: Groups join an account only through the batches that create or join one. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), {} ) );                              // What: Empty Start. Why: An account always holds its groups map. How: This expects one without it refused.
	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice' ), { groups : {} } ) );              // What: Valid Start. Why: The forged starts above failed only for their forgery. How: This expects the plain start allowed.
	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { paid : true } ) );              // What: Paid Update. Why: Only the payment webhook sets the paid flag. How: This expects the change refused.


} );



test( 'an identity publishes its own key at the server time, which anyone signed in can fetch but not list', async () => { // What: User Publish Test. Why: An approving member needs a joiner's key, but nobody should browse every user. How: This publishes Alice's key, then fetches and lists as others.


	const aliStoObj = accStoFun( 'alice' );                           // What: Alice Store Object. Why: Alice publishes the key. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );                             // What: Bob Store Object. Why: Bob stands in for an approving member. How: This acts as him.
	const nobStoObj = tesEnvObj.unauthenticatedContext().firestore(); // What: Nobody Store Object. Why: A signed-out request gets nothing. How: This acts as nobody.


	await assertSucceeds( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 65 ) } ) ); // What: Own Key Publish. Why: An identity publishes its key on first sign-in. How: This expects a 65-byte key allowed.
	await assertSucceeds( getDoc( doc( bobStoObj, 'users/alice' ) ) );                                                                 // What: Key Fetch. Why: An approver fetches the joiner's key. How: This expects Bob allowed.
	await assertFails( getDoc( doc( nobStoObj, 'users/alice' ) ) );                                                                    // What: Signed-Out Fetch. Why: Every request needs an identity. How: This expects nobody refused.
	await assertFails( getDocs( collection( bobStoObj, 'users' ) ) );                                                                  // What: User List. Why: Nobody browses every identity. How: This expects listing refused.


} );



test( 'a user document is refused with a forged time, a wrong-sized or text key, an extra field, or another owner', async () => { // What: User Shape Test. Why: A document anyone may fetch must hold only a real key and time. How: This tries each forgery.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice publishes the key. How: This acts as her.


	await assertFails( setDoc( doc( aliStoObj, 'users/bob' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 65 ) } ) );                 // What: Other Publish. Why: Nobody publishes a key for another identity. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ) );    // What: Backdated Publish. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), extra : true, publicKey : bytFilFun( 65 ) } ) ); // What: Extra Field Publish. Why: The document holds only its two fields. How: This expects a third refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : 'A'.repeat( 88 ) } ) );              // What: Text Key Publish. Why: A key is stored as bytes. How: This expects its base64 text refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 64 ) } ) );               // What: Short Key Publish. Why: A raw P-256 key is exactly 65 bytes. How: This expects 64 refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 66 ) } ) );               // What: Long Key Publish. Why: The exact size keeps the field from holding anything else. How: This expects 66 refused.


} );



test( 'only the owner replaces its key, the creation time stays put, and nobody deletes it', async () => { // What: User Update Test. Why: A key moves with a linked identity to a new device, and nothing else changes. How: This seeds Alice's document, then changes it as her and as Bob.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the document. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is someone else. How: This acts as him.


	await seeDocFun( tesEnvObj, 'users/alice', { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ); // What: User Seed Call. Why: The changes need a document to change. How: This writes Alice's.

	await assertSucceeds( updateDoc( doc( aliStoObj, 'users/alice' ), { publicKey : bytFilFun( 65 ) } ) );           // What: Own Key Replace. Why: A new device brings a new key. How: This expects it allowed.
	await assertFails( updateDoc( doc( aliStoObj, 'users/alice' ), { createdAt : Timestamp.fromMillis( 2000 ) } ) ); // What: Time Change. Why: The creation time never moves. How: This expects it refused.
	await assertFails( updateDoc( doc( bobStoObj, 'users/alice' ), { publicKey : bytFilFun( 65 ) } ) );              // What: Other Key Replace. Why: Nobody swaps another identity's key. How: This expects Bob refused.
	await assertFails( updateDoc( doc( aliStoObj, 'users/alice' ), { publicKey : bytFilFun( 64 ) } ) );              // What: Short Key Replace. Why: A replacement key keeps the same shape. How: This expects 64 bytes refused.
	await assertFails( deleteDoc( doc( aliStoObj, 'users/alice' ) ) );                                               // What: Own Delete. Why: No rule allows deleting a user document yet. How: This expects it refused.


} );



test( 'an identity creates a group in one batch, which only its members can read, while anyone signed in can fetch its invite', async () => { // What: Group Create Test. Why: The whole creation batch has to go through, and its documents have to stay with the right readers. How: This creates Alice's group, then reads its parts as Alice, Bob, and nobody.


	const aliStoObj = accStoFun( 'alice' );                           // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );                             // What: Bob Store Object. Why: Bob holds the link but isn't a member. How: This acts as him.
	const nobStoObj = tesEnvObj.unauthenticatedContext().firestore(); // What: Nobody Store Object. Why: A signed-out request gets nothing. How: This acts as nobody.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                           // What: Group Creation. Why: A valid batch creates the group. How: This expects it allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'groups/gro1' ) ) );                 // What: Member Group Read. Why: Members see their group's settings. How: This expects Alice allowed.
	await assertSucceeds( getDocs( collection( aliStoObj, 'groups/gro1/members' ) ) ); // What: Member List Read. Why: Members see who's in the group. How: This expects Alice allowed.
	await assertFails( getDoc( doc( bobStoObj, 'groups/gro1' ) ) );                    // What: Outsider Group Read. Why: A group's settings are for its members. How: This expects Bob refused.
	await assertFails( getDocs( collection( bobStoObj, 'groups/gro1/members' ) ) );    // What: Outsider List Read. Why: Outsiders don't see who's in a group. How: This expects Bob refused.
	await assertSucceeds( getDoc( doc( bobStoObj, `invites/${ TOK_ONE_STR }` ) ) );    // What: Invite Fetch. Why: Whoever holds the link sees which group it opens. How: This expects Bob allowed.
	await assertFails( getDoc( doc( nobStoObj, `invites/${ TOK_ONE_STR }` ) ) );       // What: Signed-Out Invite Fetch. Why: Every request needs an identity. How: This expects nobody refused.
	await assertFails( getDocs( collection( bobStoObj, 'invites' ) ) );                // What: Invite List. Why: Listing would hand out every group's token. How: This expects it refused.


} );



test( 'a group missing any part of its creation batch is refused', async () => { // What: Group Parts Test. Why: None of the four documents may exist without the others. How: This leaves out or changes one part at a time, then commits the whole batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : null } ) );     // What: Missing Invite. Why: A group always has a working invite. How: This expects a batch without one refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : null } ) );     // What: Missing Member. Why: The owner is always a member. How: This expects a batch without the membership refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { accStr : null } ) );     // What: Missing Account Entry. Why: Every owned group takes a slot. How: This expects a batch that skips the account refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : null } ) );     // What: Missing Group. Why: The other parts belong to a group being created. How: This expects them refused on their own.
	await assertFails( groBatFun( aliStoObj, 'alice', { accStr : 'member' } ) ); // What: Member Account Entry. Why: The creator owns the group, so the slot is an owned one. How: This expects a member entry refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                     // What: Whole Batch. Why: The batches above failed only for their missing part. How: This expects the whole batch allowed.


} );



test( 'a group starts with valid fields, one member, and nothing offered or blocked', async () => { // What: Group Fields Test. Why: A group's starting state and shape can't be forged. How: This changes one field at a time, then commits a valid batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { memberCount : 2 } } ) );                          // What: Two Members. Why: The creator is the only member. How: This expects a count of 2 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { pendingOwnerUid : 'bob' } } ) );                  // What: Offered Group. Why: Nobody has been offered a new group. How: This expects an offer refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { removedUids : { bob : true } } } ) );             // What: Blocked UID. Why: Nobody has been removed yet. How: This expects a blocked UID refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { createdAt : Timestamp.fromMillis( 1000 ) } } ) ); // What: Backdated Group. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { ownerUid : 'bob' } } ) );                         // What: Other Owner. Why: Nobody creates a group in someone else's name. How: This expects Bob as owner refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : 6 } } ) );                          // What: Short Retention. Why: Chat retention runs at least 7 days. How: This expects 6 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : 181 } } ) );                        // What: Long Retention. Why: Chat retention runs at most 180 days. How: This expects 181 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : '30' } } ) );                       // What: Text Retention. Why: Retention is a whole number of days. How: This expects text refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { extra : true } } ) );                             // What: Extra Field. Why: A group holds only its own fields. How: This expects another refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : 7 } } ) );                       // What: Shortest Retention. Why: The batches above failed only for their one field, and 7 is in range. How: This expects the batch allowed.


} );



test( 'group names allow letters, numbers, basic punctuation, and emoji, up to 50 characters, with single spaces', async () => { // What: Group Name Test. Why: The name is plaintext a stranger sees, so it keeps to readable characters (Section 11.10). How: This creates groups with allowed names, then tries refused ones.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the groups. How: This acts as her.

	const namAllArr = [ // What: Name Allowed Array. Why: Each kind of allowed name needs to pass. How: This lists one of each.


		'Tuesday Book Club 📚',  // What: Emoji Name. Why: Emoji are allowed. How: This ends with one.
		'Café du Monde',        // What: Accented Name. Why: Letters with accents are allowed. How: This holds one.
		'Familia 👨‍👩‍👧',        // What: Joined Emoji Name. Why: Emoji built with joiners are allowed. How: This holds a family emoji.
		'東京の友達',                // What: Japanese Name. Why: Letters in any script are allowed. How: This is written in Japanese.
		"Dana's B-Day (2026)!", // What: Punctuated Name. Why: Basic punctuation and numbers are allowed. How: This holds both.
		'A'.repeat( 50 )        // What: Longest Name. Why: 50 characters is the limit. How: This is exactly 50.


	];

	const namRefArr = [ // What: Name Refused Array. Why: Each kind of refused name needs to fail. How: This lists one of each.


		'',               // What: Empty Name. Why: A group needs a name. How: This has none.
		'A'.repeat( 51 ), // What: Long Name. Why: 50 characters is the limit. How: This is 51.
		' Leading',       // What: Leading Space Name. Why: Names don't start with a space. How: This does.
		'Trailing ',      // What: Trailing Space Name. Why: Names don't end with a space. How: This does.
		'Two  Spaces',    // What: Doubled Space Name. Why: Words are separated by one space. How: This uses two.
		'Line\nBreak',    // What: Line Break Name. Why: A name is one line. How: This breaks it.
		'Right‮left',     // What: Direction Override Name. Why: A right-to-left override can disguise a name. How: This holds one.
		'Zero​width',     // What: Zero-Width Name. Why: An invisible character can disguise a name. How: This holds one.
		'<b>Bold</b>',    // What: Markup Name. Why: Angle brackets aren't basic punctuation. How: This holds markup.
		'Tab\there'       // What: Tab Name. Why: A tab is a control character. How: This holds one.


	];


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batches add to an existing account. How: This writes Alice's empty one.


	for ( const [ namIndNum, namValStr ] of namAllArr.entries() ) await assertSucceeds( groBatFun( aliStoObj, 'alice', { ideStr : `all${ namIndNum }`, groObj : { name : namValStr }, tokStr : 'A'.repeat( 21 ) + namIndNum } ) ); // What: Allowed Name Loop. Why: Every allowed kind has to pass. How: This creates one group per name, each with its own ID and token.



	for ( const namValStr of namRefArr ) await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { name : namValStr } } ) ); // What: Refused Name Loop. Why: Every refused kind has to fail. How: This tries each name on the same group, which is never created.


} );



test( "an invite keeps its token's form, its own group, and the group's real name", async () => { // What: Invite Shape Test. Why: A token has to be unguessable, and the invite screen has to show the truth. How: This forges one part of the invite at a time, then commits a valid batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { tokStr : 'A'.repeat( 21 ) } ) );                             // What: Short Token. Why: A token is 22 characters. How: This expects 21 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { tokStr : 'A'.repeat( 21 ) + '=' } ) );                       // What: Padded Token. Why: A token uses only base64url characters, with no padding. How: This expects an equals sign refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { groupName : 'Other Club' } } ) );                 // What: Wrong Name Invite. Why: The invite screen has to show the group's real name. How: This expects a different one refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { groupId : 'gro2' } } ) );                         // What: Wrong Group Invite. Why: The group's token has to open that group. How: This expects an invite for another group refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { extra : true } } ) );                             // What: Extra Field Invite. Why: An invite holds exactly its three fields. How: This expects a fourth refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { createdAt : Timestamp.fromMillis( 1000 ) } } ) ); // What: Backdated Invite. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                                                         // What: Valid Invite. Why: The batches above failed only for their forged part. How: This expects the plain batch allowed.


} );



test( 'a member document holds a bounded wrapped key and an optional encrypted name with its IV', async () => { // What: Member Shape Test. Why: The membership's encrypted fields keep their sizes, and its times are real. How: This forges one part of the member document at a time, then commits one carrying a name.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { wrappedGroupKey : bytFilFun( 257 ) } } ) );                         // What: Large Wrapped Key. Why: A wrapped key fits in 256 bytes. How: This expects 257 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { wrappedGroupKey : 'key' } } ) );                                    // What: Text Wrapped Key. Why: A wrapped key is bytes. How: This expects text refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { displayNameEnc : bytFilFun( 40 ) } } ) );                           // What: Name Without IV. Why: A name can't be decrypted without its IV. How: This expects a name alone refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { displayNameEnc : bytFilFun( 40 ), iv : bytFilFun( 11 ) } } ) );     // What: Short IV. Why: An AES-GCM IV is 12 bytes. How: This expects 11 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { displayNameEnc : bytFilFun( 137 ), iv : bytFilFun( 12 ) } } ) );    // What: Large Name. Why: A 40-character name encrypts to at most 136 bytes. How: This expects 137 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { joinedAt : Timestamp.fromMillis( 1000 ) } } ) );                    // What: Backdated Join. Why: The join time gates chat history, so it has to be the server's. How: This expects a chosen time refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { lastActiveAt : Timestamp.fromMillis( 1000 ) } } ) );                // What: Backdated Activity. Why: The last active time decides when ownership can be claimed, so it has to be the server's. How: This expects a chosen time refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : { extra : true } } ) );                                               // What: Extra Field. Why: A membership holds only its own fields. How: This expects another refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice', { memObj : { displayNameEnc : bytFilFun( 136 ), iv : bytFilFun( 12 ) } } ) ); // What: Named Member. Why: The creator may write their name right away, and 136 bytes is the limit. How: This expects it allowed.


} );



test( 'while the paywall is open, everyone owns up to 10 groups and belongs to up to 20', async () => { // What: Open Cap Test. Why: Until the paywall is switched on, the paid caps apply to everyone (Section 18). How: This seeds accounts just under and at each cap, then creates a group for each.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : groMapFun( 'own', 9, 'owner' ) } );   // What: Nine Owned Seed. Why: The tenth owned group is the last allowed. How: This gives Alice 9.
	await seeDocFun( tesEnvObj, 'accounts/bob', { groups : groMapFun( 'own', 10, 'owner' ) } );    // What: Ten Owned Seed. Why: An eleventh owned group is over the cap. How: This gives Bob 10.
	await seeDocFun( tesEnvObj, 'accounts/carol', { groups : groMapFun( 'mem', 19, 'member' ) } ); // What: Nineteen Member Seed. Why: The twentieth group belonged to is the last allowed. How: This gives Carol 19.
	await seeDocFun( tesEnvObj, 'accounts/dave', { groups : groMapFun( 'mem', 20, 'member' ) } );  // What: Twenty Member Seed. Why: A twenty-first group is over the cap. How: This gives Dave 20.

	await assertSucceeds( groBatFun( accStoFun( 'alice' ), 'alice', { ideStr : 'groA', tokStr : 'A'.repeat( 22 ) } ) ); // What: Tenth Owned. Why: 10 owned is the open cap. How: This expects Alice allowed.
	await assertFails( groBatFun( accStoFun( 'bob' ), 'bob', { ideStr : 'groB', tokStr : 'B'.repeat( 22 ) } ) );        // What: Eleventh Owned. Why: 11 owned is over the cap. How: This expects Bob refused.
	await assertSucceeds( groBatFun( accStoFun( 'carol' ), 'carol', { ideStr : 'groC', tokStr : 'C'.repeat( 22 ) } ) ); // What: Twentieth Belonged. Why: 20 groups is the open cap. How: This expects Carol allowed.
	await assertFails( groBatFun( accStoFun( 'dave' ), 'dave', { ideStr : 'groD', tokStr : 'D'.repeat( 22 ) } ) );      // What: Twenty-First Belonged. Why: 21 groups is over the cap. How: This expects Dave refused.


} );



test( 'with the paywall locked, a free identity owns 1 group and belongs to 10, while a paid one gets the paid caps', async () => { // What: Locked Cap Test. Why: Once the paywall is on, the free caps apply until someone buys (Section 18). How: This seeds accounts in the locked project, then creates a group for each.


	await seeDocFun( locEnvObj, 'accounts/alice', { groups : {} } );                                          // What: Empty Free Seed. Why: A free identity's first owned group is allowed. How: This gives Alice none.
	await seeDocFun( locEnvObj, 'accounts/bob', { groups : groMapFun( 'own', 1, 'owner' ) } );                // What: One Owned Free Seed. Why: A second owned group is over the free cap. How: This gives Bob 1.
	await seeDocFun( locEnvObj, 'accounts/carol', { groups : groMapFun( 'own', 1, 'owner' ), paid : true } ); // What: One Owned Paid Seed. Why: Paying lifts the owned cap. How: This gives Carol 1 and the paid flag.
	await seeDocFun( locEnvObj, 'accounts/dave', { groups : groMapFun( 'mem', 9, 'member' ) } );              // What: Nine Member Free Seed. Why: The tenth group belonged to is the free cap. How: This gives Dave 9.
	await seeDocFun( locEnvObj, 'accounts/erin', { groups : groMapFun( 'mem', 10, 'member' ) } );             // What: Ten Member Free Seed. Why: An eleventh group is over the free cap. How: This gives Erin 10.

	await assertSucceeds( groBatFun( locStoFun( 'alice' ), 'alice', { ideStr : 'groA', tokStr : 'A'.repeat( 22 ) } ) ); // What: First Owned Free. Why: One owned group is free. How: This expects Alice allowed.
	await assertFails( groBatFun( locStoFun( 'bob' ), 'bob', { ideStr : 'groB', tokStr : 'B'.repeat( 22 ) } ) );        // What: Second Owned Free. Why: A second owned group needs a purchase. How: This expects Bob refused.
	await assertSucceeds( groBatFun( locStoFun( 'carol' ), 'carol', { ideStr : 'groC', tokStr : 'C'.repeat( 22 ) } ) ); // What: Second Owned Paid. Why: A paid identity may own more. How: This expects Carol allowed.
	await assertSucceeds( groBatFun( locStoFun( 'dave' ), 'dave', { ideStr : 'groD', tokStr : 'D'.repeat( 22 ) } ) );   // What: Tenth Belonged Free. Why: 10 groups is the free cap. How: This expects Dave allowed.
	await assertFails( groBatFun( locStoFun( 'erin' ), 'erin', { ideStr : 'groE', tokStr : 'E'.repeat( 22 ) } ) );      // What: Eleventh Belonged Free. Why: 11 groups is over the free cap. How: This expects Erin refused.


} );



test( "an account's groups change only by one owned entry, as that group is created", async () => { // What: Account Change Test. Why: An account's map is what the caps count, so it can't be padded, borrowed, or used to smuggle in the paid flag. How: This tries account changes outside a creation and extras inside one, then commits a valid batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The changes need an account to change. How: This writes Alice's empty one.
	await seeDocFun( tesEnvObj, 'groups/old1', { chatTtlDays : 30, createdAt : Timestamp.fromMillis( 1000 ), currentInviteToken : TOK_ONE_STR, memberCount : 1, name : GRO_NAM_STR, ownerUid : 'alice', pendingOwnerUid : null, removedUids : {} } ); // What: Old Group Seed Call. Why: A group that already exists can't be claimed as newly created. How: This writes one owned by Alice.

	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { 'groups.ghost' : 'owner' } ) ); // What: Ghost Entry. Why: An entry is added only as its group is created. How: This expects an entry for a group that doesn't exist refused.
	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { 'groups.old1' : 'owner' } ) );  // What: Old Group Entry. Why: Only a group created in the same batch joins the account this way. How: This expects an entry for an existing group refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { accObj : { paid : true } } ) );                 // What: Smuggled Paid Flag. Why: Only the payment webhook sets the paid flag. How: This expects it refused inside a creation batch.
	await assertFails( groBatFun( aliStoObj, 'alice', { accObj : { 'groups.zzz1' : 'member' } } ) );    // What: Extra Entry. Why: One batch creates one group, so one entry changes. How: This expects a second entry refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                                            // What: Valid Change. Why: The changes above failed only for their forgery. How: This expects the plain batch allowed.


} );



test( 'nobody joins an existing group, or adds a second invite, by writing the documents themselves', async () => { // What: Self Join Test. Why: Every join waits for a member's approval (Section 17), and a group has one working invite. How: This creates Alice's group, then has Bob write his own membership and Alice slip in a second invite.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob holds the link but hasn't been approved. How: This acts as him.


	await seeDocFun( tesEnvObj, 'accounts/alice', { groups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) ); // What: Group Creation. Why: The joins below need an existing group. How: This expects Alice's group allowed.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { joinedAt : serverTimestamp(), lastActiveAt : serverTimestamp(), wrappedGroupKey : bytFilFun( 105 ) } ) ); // What: Self Join. Why: A membership comes only from the creation batch, or later from an approval. How: This expects Bob's own membership refused.
	await assertFails( setDoc( doc( aliStoObj, `invites/${ 'B'.repeat( 22 ) }` ), { createdAt : serverTimestamp(), groupId : 'gro1', groupName : GRO_NAM_STR } ) );                     // What: Second Invite. Why: A group's one working invite is the token it names. How: This expects another token for the group refused.


} );



test( 'a document no rule covers is refused', async () => { // What: Uncovered Document Test. Why: Firestore must refuse anything no rule allows. How: This reads and writes an event document, which has no rules yet, as a signed-in identity.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is an ordinary signed-in identity. How: This acts as her.


	await assertFails( getDoc( doc( aliStoObj, 'groups/gro1/events/eve1' ) ) );                     // What: Uncovered Read. Why: No rule allows it. How: This expects the read refused.
	await assertFails( setDoc( doc( aliStoObj, 'groups/gro1/events/eve1' ), { startAt : 1000 } ) ); // What: Uncovered Write. Why: No rule allows it. How: This expects the write refused.


} );

// #endregion Module Init


