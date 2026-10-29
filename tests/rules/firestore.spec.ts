


// #region Imports

import { assertFails               } from '@firebase/rules-unit-testing'; // What: Assert Fails. Why: Forbidden reads and writes must be refused. How: This expects a request to be denied.
import { assertSucceeds            } from '@firebase/rules-unit-testing'; // What: Assert Succeeds. Why: An allowed request must go through. How: This expects it to succeed.
import { Bytes                     } from 'firebase/firestore';           // What: Bytes. Why: Keys, IVs, and ciphertext are stored as bytes. How: This builds byte values of a chosen size.
import { collection                } from 'firebase/firestore';           // What: Collection. Why: Listing a collection is checked as its own request. How: This builds a collection reference.
import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: Deletion rules are checked. How: This deletes a document.
import { deleteField               } from 'firebase/firestore';           // What: Delete Field. Why: A leave, removal, or transfer drops an entry from one of an account's group maps. How: This removes a field in an update.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every request names a document. How: This builds a reference.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: Fetch rules are checked. How: This reads one document.
import { getDocs                   } from 'firebase/firestore';           // What: Get Docs. Why: List rules are checked. How: This reads a whole collection.
import { increment                 } from 'firebase/firestore';           // What: Increment. Why: An approval raises the member count the way the app will. How: This asks the server to add to the stored count.
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

const DAY_MIL_NUM = 86400000;                                                      // What: Day Milliseconds Number. Why: A request's expiry is counted in days. How: This is one day in milliseconds.
const GRO_NAM_STR = 'Dinner Club';                                                 // What: Group Name String. Why: Most groups need a name the rules accept. How: This is an ordinary one.
const HIS_REL_OBJ = { claimedAt : null, claimedByUid : null, status : 'pending' }; // What: History Release Object. Why: Every release clears the claim the same way. How: This is the change a release makes.
const HOU_MIL_NUM = 3600000;                                                       // What: Hour Milliseconds Number. Why: A shared location expires an hour after its last update. How: This is one hour in milliseconds.
const LOC_SWI_STR = 'return false; // What: Paywall Locked Return';                // What: Locked Switch String. Why: The locked rules are the real rules with the switch turned on. How: This is the switch's line, which the locked copy replaces.
const NEW_TOK_STR = 'N'.repeat( 22 );                                              // What: New Token String. Why: A rotation moves the group to a second valid token. How: This is 22 base64url characters.
const OFF_END_OBJ = { pendingOfferedAt : null, pendingOwnerUid : null };           // What: Offer End Object. Why: A withdrawal clears the offer, as the decline function does. How: This is the change that does it.
const TOK_ONE_STR = 'abcdefghijABCDEFGHIJ_-';                                      // What: Token One String. Why: Most groups need an invite token the rules accept. How: This is 22 base64url characters.

const HIS_CLA_OBJ = { // What: History Claim Object. Why: Every claim sets the same status and server time. How: This is the change a claim makes, beside the claimant's UID.


	claimedAt : serverTimestamp(),
	status    : 'claimed'


};

// #endregion Constants



// #region Module State

const EVE_END_NUM = Date.now() + 2 * DAY_MIL_NUM;              // What: Event End Number. Why: An event has to end in the future, and its items expire with it. How: This is two days after the suite loads, in milliseconds, shared by every event and item the tests write.
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
 * Builds one of an account's group maps with a given number of entries, for
 * the cap tests to seed. Each key joins the prefix to a two-digit count, and
 * each value is true, as the rules require.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param preStr - Prefix String: What each group ID starts with.
 * @param couNum - Count Number: How many entries to build.
 *
 * @returns The group map.
 *
 * @example
 * ```ts
 * groMapFun('own', 2) // => { own01 : true, own02 : true }
 * ```
 *
*/

const groMapFun = ( preStr : string, couNum : number ) => Object.fromEntries( Array.from( Array( couNum ).keys(), ( keyIndNum ) => [ `${ preStr }${ String( keyIndNum + 1 ).padStart( 2, '0' ) }`, true ] ) ); // What: Group Map Function. Why: The cap tests seed accounts with many groups. How: This builds the entries from the count.

// #endregion groMapFun



// #region seeDocFun

/**
 * seeDocFun = Seed Document Function
 *
 * @summary
 * Writes a document with the rules turned off, so a test can start from a
 * state no client could reach on its own, such as an account already at a
 * cap or a paid flag only the webhook could set. It replaces the whole
 * document, or with updBoo set changes only the fields given.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: Which emulator project to write
 *                    to.
 * @param patValStr - Path Value String: The document's path.
 * @param datValObj - Data Value Object: The document's fields.
 * @param updBoo    - Update Boolean: Whether to change only the given fields
 *                    of an existing document, false by default.
 *
 * @returns A promise that settles once the document is written, with no
 *          value.
 *
 * @example
 * ```ts
 * seeDocFun(tesEnvObj, 'accounts/bob', datValObj, true) // => Promise<void>
 * ```
 *
*/

const seeDocFun = ( envTesObj : RulesTestEnvironment, patValStr : string, datValObj : Record< string, unknown >, updBoo = false ) => envTesObj.withSecurityRulesDisabled( ( cotAdmObj ) => updBoo ? updateDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) : setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Seed Document Function. Why: Tests start from states only the server could write. How: This writes the document with the rules off, replacing it or, when asked, updating it.

// #endregion seeDocFun



type GbfOptTyp = { accObj? : Record< string, unknown >, accStr? : string | null, ideStr? : string, groObj? : Record< string, unknown > | null, invObj? : Record< string, unknown > | null, memObj? : Record< string, unknown > | null, tokStr? : string }; // What: GBF Options Type. Why: Each creation test changes or leaves out one part of the batch. How: This lists the overrides, where null leaves that part out, accStr names the account map the entry goes in, and accObj adds fields to the account write.
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
 * groBatFun(aliStoObj, 'alice', {...}) // => Promise<void>
 * ```
 *
*/

const groBatFun = ( stoConObj : StoConTyp, uidValStr : string, optValObj : GbfOptTyp = {} ) => { // What: Group Batch Function. Why: Most group tests commit the same four writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj );         // What: Batch Write Object. Why: The four writes have to land together. How: This starts the batch.
	const groIdeStr = optValObj.ideStr ?? 'gro1';      // What: Group Identifier String. Why: A test may create several groups. How: This takes the given ID, or gro1.
	const tokValStr = optValObj.tokStr ?? TOK_ONE_STR; // What: Token Value String. Why: A test may need its own token. How: This takes the given token, or the default.

	const groDatObj = { // What: Group Data Object. Why: The group's starting fields, changed where the test asks. How: This merges the overrides over valid defaults.


		chatTtlDays        : 30,
		countedUid         : uidValStr,
		createdAt          : serverTimestamp(),
		currentInviteToken : tokValStr,
		memberCount        : 1,
		name               : GRO_NAM_STR,
		ownerUid           : uidValStr,
		pendingOfferedAt   : null,
		pendingOwnerUid    : null,
		removedUids        : {},

		...optValObj.groObj // What: Group Override Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


	};


	if ( optValObj.groObj !== null ) batWriObj.set( doc( stoConObj, `groups/${ groIdeStr }` ), groDatObj ); // What: Group Write. Why: The group is the batch's center. How: This adds it unless the test leaves it out.



	if ( optValObj.memObj !== null ) batWriObj.set( doc( stoConObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), { joinedAt : serverTimestamp(), lastActiveAt : serverTimestamp(), wrappedGroupKey : bytFilFun( 105 ), ...optValObj.memObj } ); // What: Member Write. Why: The creator is the first member. How: This adds their membership, with a 105-byte wrapped key, unless the test leaves it out.



	if ( optValObj.invObj !== null ) batWriObj.set( doc( stoConObj, `invites/${ tokValStr }` ), { createdAt : serverTimestamp(), groupId : groIdeStr, groupName : groDatObj.name, ...optValObj.invObj } ); // What: Invite Write. Why: A group always has a working invite. How: This adds the first one unless the test leaves it out.



	if ( optValObj.accStr !== null ) batWriObj.update( doc( stoConObj, `accounts/${ uidValStr }` ), { [ `${ optValObj.accStr ?? 'ownedGroups' }.${ groIdeStr }` ] : true, ...optValObj.accObj } ); // What: Account Write. Why: The group takes one of the creator's owned slots. How: This adds the entry to the owned map unless the test names another, plus any extra fields the test adds, unless the test leaves it out.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion groBatFun



// #region reqSetFun

/**
 * reqSetFun = Request Set Function
 *
 * @summary
 * Writes a join request to gro1 as the given identity, the way the app's
 * invite screen will: the typed name and note, the invite token, the
 * server's time, and an expiry 7 days out by the client's clock. Any field
 * can be changed by the overrides, and a field set to undefined is left out.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The joiner's signed-in
 *                    connection.
 * @param uidValStr - UID Value String: The UID the request is filed under.
 * @param ovrValObj - Override Value Object: Fields to change, empty by
 *                    default.
 *
 * @returns A promise that settles once the request is written, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * reqSetFun(bobStoObj, 'bob', { noteText : '' }) // => Promise<void>
 * ```
 *
*/

const reqSetFun = ( stoConObj : StoConTyp, uidValStr : string, ovrValObj : Record< string, unknown > = {} ) => setDoc( doc( stoConObj, `groups/gro1/joinRequests/${ uidValStr }` ), Object.fromEntries( Object.entries( { expireAt : Timestamp.fromMillis( Date.now() + 7 * DAY_MIL_NUM ), inviteToken : TOK_ONE_STR, nameText : 'Bob Jones', noteText : "Dana's cousin", requestedAt : serverTimestamp(), ...ovrValObj } ).filter( ( entValArr ) => entValArr[ 1 ] !== undefined ) ) ); // What: Request Set Function. Why: Most request tests write the same request with one field changed. How: This merges the overrides over valid defaults, drops any left undefined, and writes the request.

// #endregion reqSetFun



// #region seeJoiFun

/**
 * seeJoiFun = Seed Join Function
 *
 * @summary
 * Sets up the state every join test starts from: Alice's group gro1,
 * created through the real batch, and the given joiners' empty accounts and
 * published keys, written with the rules off.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValArr - UID Value Array: The joiners to set up.
 *
 * @returns A promise that settles once everything is written, with no value.
 *
 * @example
 * ```ts
 * seeJoiFun(['bob', 'carol']) // => Promise<void>
 * ```
 *
*/

const seeJoiFun = async ( uidValArr : string[] ) => { // What: Seed Join Function. Why: Every join test starts from a group and some would-be joiners. How: This creates the group and seeds each joiner.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Owner Seed Call. Why: The creation batch adds to an existing account. How: This writes Alice's empty one.


	await groBatFun( accStoFun( 'alice' ), 'alice' ); // What: Group Creation Call. Why: The requests need a group and its invite. How: This creates gro1 through the real rules.



	for ( const uidValStr of uidValArr ) { // What: Joiner Seed Loop. Why: Each joiner needs an account and a key. How: This seeds both for each UID.


		await seeDocFun( tesEnvObj, `accounts/${ uidValStr }`, { memberGroups : {}, ownedGroups : {} } );                                // What: Joiner Account Seed. Why: The belong cap reads the joiner's account. How: This writes an empty one.
		await seeDocFun( tesEnvObj, `users/${ uidValStr }`, { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ); // What: Joiner Key Seed. Why: The approver will need the joiner's key. How: This writes it.


	}


};

// #endregion seeJoiFun



// #region seeReqFun

/**
 * seeReqFun = Seed Request Function
 *
 * @summary
 * Writes, with the rules off, everything a joiner has once their request is
 * pending in gro1: an empty account, a published key, and the request.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: Which emulator project to write
 *                    to.
 * @param uidValStr - UID Value String: The joiner's UID.
 *
 * @returns A promise that settles once everything is written, with no value.
 *
 * @example
 * ```ts
 * seeReqFun(tesEnvObj, 'carol') // => Promise<void>
 * ```
 *
*/

const seeReqFun = async ( envTesObj : RulesTestEnvironment, uidValStr : string ) => { // What: Seed Request Function. Why: Approval and block tests start from a pending request. How: This seeds the joiner's documents and their request.


	await seeDocFun( envTesObj, `accounts/${ uidValStr }`, { memberGroups : {}, ownedGroups : {} } );                                // What: Joiner Account Seed. Why: An approval adds to the joiner's account. How: This writes an empty one.
	await seeDocFun( envTesObj, `users/${ uidValStr }`, { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ); // What: Joiner Key Seed. Why: A joiner has published a key. How: This writes it.
	await seeDocFun( envTesObj, `groups/gro1/joinRequests/${ uidValStr }`, { expireAt : Timestamp.fromMillis( Date.now() + 7 * DAY_MIL_NUM ), inviteToken : TOK_ONE_STR, nameText : 'Bob Jones', requestedAt : Timestamp.fromMillis( 1000 ) } ); // What: Request Seed. Why: The request is what an approval or block answers. How: This writes it.


};

// #endregion seeReqFun



// #region seeAppFun

/**
 * seeAppFun = Seed Approval Function
 *
 * @summary
 * Writes, with the rules off, the state approval tests start from: Alice's
 * group gro1 holding a chosen member count, her membership, her account
 * owning it (paid when asked), its invite, and Bob's pending request.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: Which emulator project to write
 *                    to.
 * @param memCouNum - Member Count Number: The group's member count, 1 by
 *                    default.
 * @param paiOwnBoo - Paid Owner Boolean: Whether Alice has paid, false by
 *                    default.
 *
 * @returns A promise that settles once everything is written, with no value.
 *
 * @example
 * ```ts
 * seeAppFun(locEnvObj, 19, true) // => Promise<void>
 * ```
 *
*/

const seeAppFun = async ( envTesObj : RulesTestEnvironment, memCouNum = 1, paiOwnBoo = false ) => { // What: Seed Approval Function. Why: Approval tests need a group at a chosen count without creating it member by member. How: This seeds the group and its people directly.


	await seeDocFun( envTesObj, 'groups/gro1', { chatTtlDays : 30, countedUid : 'alice', createdAt : Timestamp.fromMillis( 1000 ), currentInviteToken : TOK_ONE_STR, memberCount : memCouNum, name : GRO_NAM_STR, ownerUid : 'alice', pendingOfferedAt : null, pendingOwnerUid : null, removedUids : {} } ); // What: Group Seed. Why: The approval changes this group. How: This writes it at the chosen count.
	await seeDocFun( envTesObj, 'groups/gro1/members/alice', { joinedAt : Timestamp.fromMillis( 1000 ), lastActiveAt : Timestamp.fromMillis( 1000 ), wrappedGroupKey : bytFilFun( 105 ) } ); // What: Owner Member Seed. Why: Alice approves as a member. How: This writes her membership.
	await seeDocFun( envTesObj, 'accounts/alice', paiOwnBoo ? { memberGroups : {}, ownedGroups : { gro1 : true }, paid : true } : { memberGroups : {}, ownedGroups : { gro1 : true } } );    // What: Owner Account Seed. Why: The member cap follows the owner's paid status. How: This writes Alice's account, paid when asked.
	await seeDocFun( envTesObj, `invites/${ TOK_ONE_STR }`, { createdAt : Timestamp.fromMillis( 1000 ), groupId : 'gro1', groupName : GRO_NAM_STR } );                                       // What: Invite Seed. Why: The group has its working invite. How: This writes it.

	await seeReqFun( envTesObj, 'bob' ); // What: Bob Request Seed. Why: Bob is the joiner being approved. How: This seeds his pending request.


};

// #endregion seeAppFun



type AbfOptTyp = { accObj? : Record< string, unknown >, accStr? : string | null, couNum? : number, couStr? : string, groObj? : Record< string, unknown > | null, memObj? : Record< string, unknown > | null, reqBoo? : boolean }; // What: ABF Options Type. Why: Each approval test changes or leaves out one part of the batch. How: This lists the overrides, where null or a false reqBoo leaves that part out, accStr names the account map the entry goes in, and accObj adds fields to the account write.

// #region appBatFun

/**
 * appBatFun = Approval Batch Function
 *
 * @summary
 * Commits the four writes that approve a joiner into gro1, as the app will:
 * the joiner's membership, the group added to their account as a member,
 * the group's count raised by one for them, and their request deleted. Each
 * part can be changed or left out by an option, and the account write can
 * carry extra fields.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The approving member's
 *                    connection.
 * @param uidValStr - UID Value String: The joiner's UID.
 * @param optValObj - Option Value Object: {@link AbfOptTyp}, empty by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * appBatFun(aliStoObj, 'bob', { couNum : 2 }) // => Promise<void>
 * ```
 *
*/

const appBatFun = ( stoConObj : StoConTyp, uidValStr : string, optValObj : AbfOptTyp = {} ) => { // What: Approval Batch Function. Why: Most approval tests commit the same four writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj ); // What: Batch Write Object. Why: The four writes have to land together. How: This starts the batch.


	if ( optValObj.memObj !== null ) batWriObj.set( doc( stoConObj, `groups/gro1/members/${ uidValStr }` ), { joinedAt : serverTimestamp(), lastActiveAt : serverTimestamp(), wrappedGroupKey : bytFilFun( 105 ), ...optValObj.memObj } ); // What: Member Write. Why: The joiner becomes a member. How: This adds their membership unless the test leaves it out.



	if ( optValObj.accStr !== null ) batWriObj.update( doc( stoConObj, `accounts/${ uidValStr }` ), { [ `${ optValObj.accStr ?? 'memberGroups' }.gro1` ] : true, ...optValObj.accObj } ); // What: Account Write. Why: The joiner takes a slot. How: This adds the entry to the member map unless the test names another, plus any extra fields the test adds, unless the test leaves it out.



	if ( optValObj.groObj !== null ) batWriObj.update( doc( stoConObj, 'groups/gro1' ), { countedUid : optValObj.couStr ?? uidValStr, memberCount : increment( optValObj.couNum ?? 1 ), ...optValObj.groObj } ); // What: Group Write. Why: The count rises for the joiner. How: This raises it and names them, unless the test leaves it out.



	if ( optValObj.reqBoo !== false ) batWriObj.delete( doc( stoConObj, `groups/gro1/joinRequests/${ uidValStr }` ) ); // What: Request Delete. Why: An answered request ends. How: This deletes it unless the test keeps it.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion appBatFun



type BbfOptTyp = { delBoo? : boolean, extObj? : Record< string, unknown > }; // What: BBF Options Type. Why: Each block test changes one part of the batch. How: This lists the overrides, where a false delBoo keeps the request and extObj adds group changes.

// #region bloBatFun

/**
 * bloBatFun = Block Batch Function
 *
 * @summary
 * Commits a decline-and-block of a joiner in gro1, as the app will: the
 * joiner's UID added to the blocklist and their request deleted. An option
 * can keep the request or add other group changes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The declining member's
 *                    connection.
 * @param uidValStr - UID Value String: The UID to block.
 * @param optValObj - Option Value Object: {@link BbfOptTyp}, empty by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * bloBatFun(aliStoObj, 'bob', { delBoo : false }) // => Promise<void>
 * ```
 *
*/

const bloBatFun = ( stoConObj : StoConTyp, uidValStr : string, optValObj : BbfOptTyp = {} ) => { // What: Block Batch Function. Why: The block tests commit the same two writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj ); // What: Batch Write Object. Why: The block and the request's end land together. How: This starts the batch.


	batWriObj.update( doc( stoConObj, 'groups/gro1' ), { [ `removedUids.${ uidValStr }` ] : true, ...optValObj.extObj } ); // What: Block Write. Why: The UID joins the blocklist. How: This adds it, with any extra changes the test asks for.


	if ( optValObj.delBoo !== false ) batWriObj.delete( doc( stoConObj, `groups/gro1/joinRequests/${ uidValStr }` ) ); // What: Request Delete. Why: A decline ends the request. How: This deletes it unless the test keeps it.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion bloBatFun



// #region seeTwoFun

/**
 * seeTwoFun = Seed Two Function
 *
 * @summary
 * Sets up the state leave, removal, and rotation tests start from: Alice's
 * group gro1 with Bob approved into it through the real rules, so it holds
 * two members, its working invite, and both accounts' entries.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once the group holds both members, with no
 *          value.
 *
 * @example
 * ```ts
 * seeTwoFun() // => Promise<void>
 * ```
 *
*/

const seeTwoFun = async () => { // What: Seed Two Function. Why: Leaving and removal need a second member. How: This seeds the group and approves Bob into it.


	await seeAppFun( tesEnvObj ); // What: Approval Seed Call. Why: Bob needs a pending request to be approved. How: This seeds the group and his request.

	await appBatFun( accStoFun( 'alice' ), 'bob' ); // What: Approval Call. Why: Bob becomes the second member. How: This approves him as Alice.


};

// #endregion seeTwoFun



type LbfOptTyp = { accBoo? : boolean, accObj? : Record< string, unknown >, groObj? : Record< string, unknown > | null, memBoo? : boolean }; // What: LBF Options Type. Why: Each leave test changes or leaves out one part of the batch. How: This lists the overrides, where false or null leaves that part out and accObj adds fields to the account write.

// #region lefBatFun

/**
 * lefBatFun = Leave Batch Function
 *
 * @summary
 * Commits the three writes that end a membership in gro1 the way leaving
 * does: the member document deleted, the group dropped from the member's
 * account, and the group's count lowered by one for them. Each part can be
 * left out, and the account and group writes' fields changed, by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The connection that writes the
 *                    batch.
 * @param uidValStr - UID Value String: The member whose membership ends.
 * @param optValObj - Option Value Object: {@link LbfOptTyp}, empty by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * lefBatFun(bobStoObj, 'bob', { accBoo : false }) // => Promise<void>
 * ```
 *
*/

const lefBatFun = ( stoConObj : StoConTyp, uidValStr : string, optValObj : LbfOptTyp = {} ) => { // What: Leave Batch Function. Why: Most leave tests commit the same three writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj ); // What: Batch Write Object. Why: The three writes have to land together. How: This starts the batch.


	if ( optValObj.memBoo !== false ) batWriObj.delete( doc( stoConObj, `groups/gro1/members/${ uidValStr }` ) ); // What: Member Delete. Why: The membership ends. How: This deletes it unless the test keeps it.



	if ( optValObj.accBoo !== false ) batWriObj.update( doc( stoConObj, `accounts/${ uidValStr }` ), { 'memberGroups.gro1' : deleteField(), ...optValObj.accObj } ); // What: Account Write. Why: The member's slot frees. How: This drops the entry, with any changes the test adds, unless the test keeps it.



	if ( optValObj.groObj !== null ) batWriObj.update( doc( stoConObj, 'groups/gro1' ), { countedUid : uidValStr, memberCount : increment( -1 ), ...optValObj.groObj } ); // What: Group Write. Why: The count falls for the member. How: This lowers it and names them, with any changes the test adds, unless the test leaves it out.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion lefBatFun



type RbfOptTyp = { accBoo? : boolean, groObj? : Record< string, unknown > | null, memBoo? : boolean, newBoo? : boolean, oldBoo? : boolean, uidStr? : string | null }; // What: RBF Options Type. Why: Each removal or rotation test changes or leaves out one part of the batch. How: This lists the overrides, where false or null leaves that part out, and a null uidStr makes the batch a bare rotation.

// #region remBatFun

/**
 * remBatFun = Remove Batch Function
 *
 * @summary
 * Commits a removal from gro1, as the app will: the member document
 * deleted, the group dropped from their account, and the group's count
 * lowered for them as their UID joins the blocklist, all with the invite
 * rotated, the group naming a new token whose invite is created while the
 * old one is deleted. With a null uidStr the batch is a bare rotation. Each
 * part can be left out, and the group write's fields changed, by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The connection that writes the
 *                    batch.
 * @param optValObj - Option Value Object: {@link RbfOptTyp}, removing Bob by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * remBatFun(aliStoObj, { uidStr : null }) // => Promise<void>
 * ```
 *
*/

const remBatFun = ( stoConObj : StoConTyp, optValObj : RbfOptTyp = {} ) => { // What: Remove Batch Function. Why: The removal and rotation tests commit the same writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj );                                   // What: Batch Write Object. Why: The writes have to land together. How: This starts the batch.
	const uidRemStr = optValObj.uidStr === undefined ? 'bob' : optValObj.uidStr; // What: UID Removed String. Why: Most tests remove Bob, and a rotation removes nobody. How: This takes the given UID, Bob by default, or null.

	const groChaObj = uidRemStr === null                                                                                                     // What: Group Change Object. Why: A removal changes the count and blocklist, and every rotation changes the token. How: This picks the fields for a rotation or a removal.
		? { currentInviteToken : NEW_TOK_STR }                                                                                                  // What: Rotation Fields. Why: A bare rotation changes the token alone. How: This names the new token.
		: { countedUid : uidRemStr, currentInviteToken : NEW_TOK_STR, memberCount : increment( -1 ), [ `removedUids.${ uidRemStr }` ] : true }; // What: Removal Fields. Why: A removal also lowers the count and blocks the member. How: This adds those changes.


	if ( uidRemStr !== null && optValObj.memBoo !== false ) batWriObj.delete( doc( stoConObj, `groups/gro1/members/${ uidRemStr }` ) ); // What: Member Delete. Why: The removed membership ends. How: This deletes it unless the test keeps it.



	if ( uidRemStr !== null && optValObj.accBoo !== false ) batWriObj.update( doc( stoConObj, `accounts/${ uidRemStr }` ), { 'memberGroups.gro1' : deleteField() } ); // What: Account Write. Why: The removed member's slot frees. How: This drops the entry unless the test keeps it.



	if ( optValObj.groObj !== null ) batWriObj.update( doc( stoConObj, 'groups/gro1' ), { ...groChaObj, ...optValObj.groObj } ); // What: Group Write. Why: The group records the change. How: This writes it, with any changes the test adds, unless the test leaves it out.



	if ( optValObj.oldBoo !== false ) batWriObj.delete( doc( stoConObj, `invites/${ TOK_ONE_STR }` ) ); // What: Old Invite Delete. Why: The old link stops working. How: This deletes its invite unless the test keeps it.



	if ( optValObj.newBoo !== false ) batWriObj.set( doc( stoConObj, `invites/${ NEW_TOK_STR }` ), { createdAt : serverTimestamp(), groupId : 'gro1', groupName : GRO_NAM_STR } ); // What: New Invite Write. Why: The group always has a working link. How: This creates the new invite unless the test leaves it out.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion remBatFun



// #region offSetFun

/**
 * offSetFun = Offer Set Function
 *
 * @summary
 * Writes an ownership offer on gro1 the way the app will: the group naming
 * the member offered it, stamped with the server's time. Extra fields can
 * replace or join the offer's own.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The connection that writes the
 *                    offer.
 * @param tarUidStr - Target UID String: The member offered the group.
 * @param groChaObj - Group Change Object: Fields to write beside the offer,
 *                    empty by default.
 *
 * @returns A promise that settles once the offer is written, with no value,
 *          and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * offSetFun(aliStoObj, 'bob') // => Promise<void>
 * ```
 *
*/

const offSetFun = ( stoConObj : StoConTyp, tarUidStr : string, groChaObj : Record< string, unknown > = {} ) => updateDoc( doc( stoConObj, 'groups/gro1' ), { pendingOfferedAt : serverTimestamp(), pendingOwnerUid : tarUidStr, ...groChaObj } ); // What: Offer Set Function. Why: The transfer tests make offers, some with a field changed. How: This writes the offer, with any changes the test adds.

// #endregion offSetFun



type TbfOptTyp = { groObj? : Record< string, unknown > | null, newBoo? : boolean, newObj? : Record< string, unknown >, oldBoo? : boolean, oldObj? : Record< string, unknown > }; // What: TBF Options Type. Why: Each acceptance test changes or leaves out one part of the batch. How: This lists the overrides, where false or null leaves that part out, and newObj or oldObj adds fields to the new or old owner's account write.

// #region takBatFun

/**
 * takBatFun = Take Batch Function
 *
 * @summary
 * Commits the three writes that accept an offer of gro1 from Alice, as the
 * app will: the group naming the accepting member as owner with its offer
 * cleared, the group moved from their member map to their owned map, and
 * moved the other way in Alice's account. Each part can be left out, and
 * each write's fields changed, by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The accepting member's
 *                    connection.
 * @param uidValStr - UID Value String: The member taking the group over.
 * @param optValObj - Option Value Object: {@link TbfOptTyp}, empty by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * takBatFun(bobStoObj, 'bob', { oldBoo : false }) // => Promise<void>
 * ```
 *
*/

const takBatFun = ( stoConObj : StoConTyp, uidValStr : string, optValObj : TbfOptTyp = {} ) => { // What: Take Batch Function. Why: Most acceptance tests commit the same three writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj ); // What: Batch Write Object. Why: The three writes have to land together. How: This starts the batch.


	if ( optValObj.groObj !== null ) batWriObj.update( doc( stoConObj, 'groups/gro1' ), { ownerUid : uidValStr, ...OFF_END_OBJ, ...optValObj.groObj } ); // What: Group Write. Why: The group changes hands and its offer is used up. How: This names the new owner and clears the offer, with any changes the test adds, unless the test leaves it out.



	if ( optValObj.newBoo !== false ) batWriObj.update( doc( stoConObj, `accounts/${ uidValStr }` ), { 'memberGroups.gro1' : deleteField(), 'ownedGroups.gro1' : true, ...optValObj.newObj } ); // What: New Owner Account Write. Why: The new owner takes an owned slot. How: This moves the group to their owned map, with any changes the test adds, unless the test leaves it out.



	if ( optValObj.oldBoo !== false ) batWriObj.update( doc( stoConObj, 'accounts/alice' ), { 'memberGroups.gro1' : true, 'ownedGroups.gro1' : deleteField(), ...optValObj.oldObj } ); // What: Old Owner Account Write. Why: Alice stays a member and frees her owned slot. How: This moves the group to her member map, with any changes the test adds, unless the test leaves it out.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion takBatFun



type SbfOptTyp = { groObj? : Record< string, unknown >, invObj? : Record< string, unknown > | null, othStr? : string, tokStr? : string }; // What: SBF Options Type. Why: Each rename test changes or leaves out one part of the batch. How: This lists the overrides, where a null invObj leaves the invite out, groObj or invObj adds fields to its write, tokStr picks the invite written, and othStr names a second invite the batch renames too.

// #region setBatFun

/**
 * setBatFun = Settings Batch Function
 *
 * @summary
 * Commits a rename of gro1 the way the app will: the group's new name and
 * the current invite's copy of it, in one batch. The invite write can be
 * left out, pointed at another token, or joined by a second invite write,
 * and either write's fields changed, by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoConObj - Store Connection Object: The connection that writes the
 *                    batch.
 * @param namValStr - Name Value String: The group's new name.
 * @param optValObj - Option Value Object: {@link SbfOptTyp}, empty by
 *                    default.
 *
 * @returns A promise that settles once the batch is committed, with no
 *          value, and rejects when the rules refuse it.
 *
 * @example
 * ```ts
 * setBatFun(aliStoObj, 'Supper Club', { invObj : null }) // => Promise<void>
 * ```
 *
*/

const setBatFun = ( stoConObj : StoConTyp, namValStr : string, optValObj : SbfOptTyp = {} ) => { // What: Settings Batch Function. Why: The rename tests commit the same two writes with one part changed. How: This builds and commits the batch.


	const batWriObj = writeBatch( stoConObj ); // What: Batch Write Object. Why: The two writes have to land together. How: This starts the batch.


	batWriObj.update( doc( stoConObj, 'groups/gro1' ), { name : namValStr, ...optValObj.groObj } ); // What: Group Write. Why: The group takes its new name. How: This renames it, with any changes the test adds.



	if ( optValObj.invObj !== null ) batWriObj.update( doc( stoConObj, `invites/${ optValObj.tokStr ?? TOK_ONE_STR }` ), { groupName : namValStr, ...optValObj.invObj } ); // What: Invite Write. Why: The invite screen shows the group's real name. How: This copies the new name onto the invite, with any changes the test adds, unless the test leaves it out.



	if ( optValObj.othStr !== undefined ) batWriObj.update( doc( stoConObj, `invites/${ optValObj.othStr }` ), { groupName : namValStr } ); // What: Other Invite Write. Why: Some tests try renaming a second invite in the batch. How: This copies the new name onto it when the test names one.



	return batWriObj.commit(); // What: Commit Return. Why: The test expects the batch allowed or refused. How: This commits it and returns the promise.


};

// #endregion setBatFun



// #region eveTimFun

/**
 * eveTimFun = Event Times Function
 *
 * @summary
 * Builds an event's three times from its start and end: the two timestamps,
 * plus the TTL field 48 hours after the end, as the rules require.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param staMilNum - Start Milliseconds Number: When the event starts.
 * @param endMilNum - End Milliseconds Number: When the event ends.
 *
 * @returns The event's time fields.
 *
 * @example
 * ```ts
 * eveTimFun(staMilNum, endMilNum) // => { endAt, expireAt, startAt }
 * ```
 *
*/

const eveTimFun = ( staMilNum : number, endMilNum : number ) => ({ // What: Event Times Function. Why: The time tests move an event's start and end, and its expiry has to follow. How: This returns the three time fields.


	endAt    : Timestamp.fromMillis( endMilNum ),
	expireAt : Timestamp.fromMillis( endMilNum + 2 * DAY_MIL_NUM ),
	startAt  : Timestamp.fromMillis( staMilNum )


});

// #endregion eveTimFun



// #region eveDatFun

/**
 * eveDatFun = Event Data Function
 *
 * @summary
 * Builds a valid event for the rules to accept: encrypted details, a 12-byte
 * IV, a day-long span ending at EVE_END_NUM, and the TTL field 48 hours
 * after the end. Fields can be changed or added by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param creUidStr - Creator UID String: Who the event names as its creator.
 * @param eveChaObj - Event Change Object: Fields to change or add, empty by
 *                    default.
 *
 * @returns The event's fields.
 *
 * @example
 * ```ts
 * eveDatFun('bob', { iv : bytFilFun(11) }) // => { createdByUid : 'bob', ... }
 * ```
 *
*/

const eveDatFun = ( creUidStr : string, eveChaObj : Record< string, unknown > = {} ) => ({ // What: Event Data Function. Why: Every event test starts from a valid event. How: This returns its fields with the test's changes.


	...eveTimFun( EVE_END_NUM - DAY_MIL_NUM, EVE_END_NUM ), // What: Event Times Spread. Why: The event spans the day before EVE_END_NUM. How: This adds its start, end, and expiry.

	createdByUid : creUidStr,
	detailsEnc   : bytFilFun( 300 ),
	iv           : bytFilFun( 12 ),

	...eveChaObj // What: Event Change Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


});

// #endregion eveDatFun



// #region iteDatFun

/**
 * iteDatFun = Item Data Function
 *
 * @summary
 * Builds a valid open item for an event built by eveDatFun: an encrypted
 * label, a 12-byte IV, no assignee, and the event's TTL time. Fields can be
 * changed or added by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param iteChaObj - Item Change Object: Fields to change or add, empty by
 *                    default.
 *
 * @returns The item's fields.
 *
 * @example
 * ```ts
 * iteDatFun({ assignedUid : 'carol' }) // => { assignedUid : 'carol', ... }
 * ```
 *
*/

const iteDatFun = ( iteChaObj : Record< string, unknown > = {} ) => ({ // What: Item Data Function. Why: Every item test starts from a valid item. How: This returns its fields with the test's changes.


	assignedUid : null,
	expireAt    : Timestamp.fromMillis( EVE_END_NUM + 2 * DAY_MIL_NUM ),
	iv          : bytFilFun( 12 ),
	labelEnc    : bytFilFun( 60 ),

	...iteChaObj // What: Item Change Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


});

// #endregion iteDatFun



// #region locDatFun

/**
 * locDatFun = Location Data Function
 *
 * @summary
 * Builds a valid shared location for an event: an encrypted position, a
 * 12-byte IV, the server's time as its update time, and an expiry an hour
 * after the phone's own clock. Fields can be changed or added by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveIdeStr - Event Identifier String: The event the location is
 *                    shared for.
 * @param locChaObj - Location Change Object: Fields to change or add, empty
 *                    by default.
 *
 * @returns The location's fields.
 *
 * @example
 * ```ts
 * locDatFun('eve1', { iv : bytFilFun(11) }) // => { eventId : 'eve1', ... }
 * ```
 *
*/

const locDatFun = ( eveIdeStr : string, locChaObj : Record< string, unknown > = {} ) => ({ // What: Location Data Function. Why: Every location test starts from a valid share. How: This returns its fields with the test's changes.


	eventId     : eveIdeStr,
	expireAt    : Timestamp.fromMillis( Date.now() + HOU_MIL_NUM ),
	iv          : bytFilFun( 12 ),
	locationEnc : bytFilFun( 60 ),
	updatedAt   : serverTimestamp(),

	...locChaObj // What: Location Change Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


});

// #endregion locDatFun



// #region hisDatFun

/**
 * hisDatFun = History Data Function
 *
 * @summary
 * Builds a valid new history request: pending and unclaimed, stamped with
 * the server's time, expiring 10 days out by the test's clock, with no range
 * start. Fields can be changed or added by an option, a backlog's range
 * start included.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: The asker.
 * @param kinValStr - Kind Value String: The request's kind, recovery or
 *                    backlog.
 * @param hisChaObj - History Change Object: Fields to change or add, empty by
 *                    default.
 *
 * @returns The request's fields.
 *
 * @example
 * ```ts
 * hisDatFun('bob', 'recovery') // => { kind : 'recovery', ... }
 * ```
 *
*/

const hisDatFun = ( uidValStr : string, kinValStr : string, hisChaObj : Record< string, unknown > = {} ) => ({ // What: History Data Function. Why: Every history test starts from a valid request. How: This returns its fields with the test's changes.


	claimedAt      : null,
	claimedByUid   : null,
	createdAt      : serverTimestamp(),
	expireAt       : Timestamp.fromMillis( Date.now() + 10 * DAY_MIL_NUM ),
	kind           : kinValStr,
	rangeStart     : null,
	requestedByUid : uidValStr,
	status         : 'pending',

	...hisChaObj // What: History Change Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


});

// #endregion hisDatFun

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
		projectId : 'demo-come-hang-firestore'                                // What: Project Identifier. Why: A demo project can never reach a real one, and demo-come-hang's own data belongs to the Storage spec, whose rules read that project's Firestore. How: This names a project of this spec's own.


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



test( 'an identity starts its own empty account, and only it can read the account', async () => { // What: Account Owner Test. Why: Memberships and the paid flag are private. How: This starts Alice's account, then reads it as her and as Bob, checking only she can.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is someone else. How: This acts as him.


	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice' ), { memberGroups : {}, ownedGroups : {} } ) ); // What: Own Account Start. Why: An identity starts its own account. How: This expects an empty one allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'accounts/alice' ) ) );                                          // What: Own Account Read. Why: The owner reads their memberships. How: This expects it allowed.
	await assertFails( getDoc( doc( bobStoObj, 'accounts/alice' ) ) );                                             // What: Other Account Read. Why: Nobody else learns which groups Alice is in. How: This expects Bob refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/bob' ), { memberGroups : {}, ownedGroups : {} } ) );      // What: Other Account Start. Why: Nobody starts another identity's account. How: This expects Alice refused.


} );



test( "an account can't start paid, already in groups, or holding other fields, or grant itself the paid flag", async () => { // What: Account Shape Test. Why: No client may grant itself the paid flag or a membership. How: This tries each forged start, then a paid flag on a real account.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.


	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { memberGroups : {}, ownedGroups : {}, paid : true } ) ); // What: Paid Start. Why: Only the payment webhook sets the paid flag. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { memberGroups : {}, ownedGroups : { gro1 : true } } ) ); // What: Owned Start. Why: Groups join an account only through the batches that create or join one. How: This expects an owned entry refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { memberGroups : { gro1 : true }, ownedGroups : {} } ) ); // What: Member Start. Why: Groups join an account only through the batches that create or join one. How: This expects a member entry refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { ownedGroups : {} } ) );                                 // What: Half Start. Why: An account always holds both group maps. How: This expects one without its member map refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice' ), { memberGroups : {} } ) );                                // What: Other Half Start. Why: An account always holds both group maps. How: This expects one without its owned map refused.
	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice' ), { memberGroups : {}, ownedGroups : {} } ) );           // What: Valid Start. Why: The forged starts above failed only for their forgery. How: This expects the plain start allowed.
	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { paid : true } ) );                                   // What: Paid Update. Why: Only the payment webhook sets the paid flag. How: This expects the change refused.


} );



test( 'an identity publishes its own key at the server time, which anyone signed in can fetch but not list', async () => { // What: User Publish Test. Why: An approving member needs a joiner's key, but nobody should browse every user. How: This publishes Alice's key, then fetches and lists as others, checking a fetch passes and a list fails.


	const aliStoObj = accStoFun( 'alice' );                           // What: Alice Store Object. Why: Alice publishes the key. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );                             // What: Bob Store Object. Why: Bob stands in for an approving member. How: This acts as him.
	const nobStoObj = tesEnvObj.unauthenticatedContext().firestore(); // What: Nobody Store Object. Why: A signed-out request gets nothing. How: This acts as nobody.


	await assertSucceeds( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 65 ) } ) ); // What: Own Key Publish. Why: An identity publishes its key on first sign-in. How: This expects a 65-byte key allowed.
	await assertSucceeds( getDoc( doc( bobStoObj, 'users/alice' ) ) );                                                                 // What: Key Fetch. Why: An approver fetches the joiner's key. How: This expects Bob allowed.
	await assertFails( getDoc( doc( nobStoObj, 'users/alice' ) ) );                                                                    // What: Signed-Out Fetch. Why: Every request needs an identity. How: This expects nobody refused.
	await assertFails( getDocs( collection( bobStoObj, 'users' ) ) );                                                                  // What: User List. Why: Nobody browses every identity. How: This expects listing refused.


} );



test( 'a user document is refused with a forged time, a wrong-sized or text key, an extra field, or another owner', async () => { // What: User Shape Test. Why: A document anyone may fetch must hold only a real key and time. How: This tries each forgery and checks the rules refuse it.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice publishes the key. How: This acts as her.


	await assertFails( setDoc( doc( aliStoObj, 'users/bob' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 65 ) } ) );                 // What: Other Publish. Why: Nobody publishes a key for another identity. How: This expects it refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ) );    // What: Backdated Publish. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), extra : true, publicKey : bytFilFun( 65 ) } ) ); // What: Extra Field Publish. Why: The document holds only its two fields. How: This expects a third refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : 'A'.repeat( 88 ) } ) );              // What: Text Key Publish. Why: A key is stored as bytes. How: This expects its base64 text refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 64 ) } ) );               // What: Short Key Publish. Why: A raw P-256 key is exactly 65 bytes. How: This expects 64 refused.
	await assertFails( setDoc( doc( aliStoObj, 'users/alice' ), { createdAt : serverTimestamp(), publicKey : bytFilFun( 66 ) } ) );               // What: Long Key Publish. Why: The exact size keeps the field from holding anything else. How: This expects 66 refused.


} );



test( 'an identity stores, refreshes, and deletes its own push token, which nobody else reads or writes', async () => { // What: Push Token Test. Why: Pushes reach a phone through its one stored token, which is the owner's alone and expires unless refreshed (Section 14). How: This writes a valid token, then tries each fault, other identities, and a second token, then deletes it, checking which the rules allow.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice registers her phone. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob tries to reach Alice's token. How: This acts as him.

	const tokDatObj = { expireAt : Timestamp.fromMillis( Date.now() + 60 * DAY_MIL_NUM ), token : 'fcm1:APA91b-Token_Value', updatedAt : serverTimestamp() }; // What: Token Data Object. Why: Most writes start from a valid token. How: This holds one expiring 60 days out.


	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), tokDatObj ) );                                                                       // What: Token Stored. Why: The owner registers her phone. How: This expects Alice's write allowed.
	await assertSucceeds( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, token : 'fcm2:APA91b-New' } ) );                                     // What: Token Refreshed. Why: FCM can hand the app a new token. How: This expects Alice's replacement allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ) ) );                                                                                  // What: Owner Read. Why: The app checks what it last stored. How: This expects Alice's read allowed.
	await assertFails( getDoc( doc( bobStoObj, 'accounts/alice/pushToken/current' ) ) );                                                                                     // What: Other Read. Why: Nobody else learns where to push Alice. How: This expects Bob refused.
	await assertFails( setDoc( doc( bobStoObj, 'accounts/alice/pushToken/current' ), tokDatObj ) );                                                                          // What: Other Write. Why: Nobody redirects someone else's pushes. How: This expects Bob refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/second' ), tokDatObj ) );                                                                           // What: Second Token. Why: Each identity has one phone. How: This expects a second token document refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, updatedAt : Timestamp.fromMillis( 1000 ) } ) );                         // What: Forged Time. Why: The refresh time has to be real. How: This expects a chosen time refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, expireAt : Timestamp.fromMillis( Date.now() + 40 * DAY_MIL_NUM ) } ) ); // What: Short Expiry. Why: A token lives 60 days unless refreshed. How: This expects 40 days refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, expireAt : Timestamp.fromMillis( Date.now() + 80 * DAY_MIL_NUM ) } ) ); // What: Long Expiry. Why: A dead token mustn't linger past 60 days. How: This expects 80 days refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, token : '<script>' } ) );                                               // What: Token Form. Why: A token is letters, digits, and a few separators. How: This expects other characters refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, token : 'A'.repeat( 4097 ) } ) );                                       // What: Long Token. Why: Nothing larger than a token belongs here. How: This expects 4,097 characters refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ), { ...tokDatObj, device : 'phone' } ) );                                                 // What: Extra Field. Why: The document holds its three fields alone. How: This expects another one refused.
	await assertFails( deleteDoc( doc( bobStoObj, 'accounts/alice/pushToken/current' ) ) );                                                                                  // What: Other Delete. Why: Nobody turns off someone else's pushes. How: This expects Bob refused.
	await assertSucceeds( deleteDoc( doc( aliStoObj, 'accounts/alice/pushToken/current' ) ) );                                                                               // What: Token Deleted. Why: The owner turns notifications off. How: This expects Alice's delete allowed.


} );



test( 'only the owner replaces its key, the creation time stays put, and nobody deletes it', async () => { // What: User Update Test. Why: A key moves with a linked identity to a new device, and nothing else changes. How: This seeds Alice's document, then changes it as her and as Bob, checking only her change passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the document. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is someone else. How: This acts as him.


	await seeDocFun( tesEnvObj, 'users/alice', { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ); // What: User Seed Call. Why: The changes need a document to change. How: This writes Alice's.

	await assertSucceeds( updateDoc( doc( aliStoObj, 'users/alice' ), { publicKey : bytFilFun( 65 ) } ) );           // What: Own Key Replace. Why: A new device brings a new key. How: This expects it allowed.
	await assertFails( updateDoc( doc( aliStoObj, 'users/alice' ), { createdAt : Timestamp.fromMillis( 2000 ) } ) ); // What: Time Change. Why: The creation time never moves. How: This expects it refused.
	await assertFails( updateDoc( doc( bobStoObj, 'users/alice' ), { publicKey : bytFilFun( 65 ) } ) );              // What: Other Key Replace. Why: Nobody swaps another identity's key. How: This expects Bob refused.
	await assertFails( updateDoc( doc( aliStoObj, 'users/alice' ), { publicKey : bytFilFun( 64 ) } ) );              // What: Short Key Replace. Why: A replacement key keeps the same shape. How: This expects 64 bytes refused.
	await assertFails( deleteDoc( doc( aliStoObj, 'users/alice' ) ) );                                               // What: Own Delete. Why: No rule allows deleting a user document yet. How: This expects it refused.


} );



test( 'an identity creates a group in one batch, which only its members can read, while anyone signed in can fetch its invite', async () => { // What: Group Create Test. Why: The whole creation batch has to go through, and its documents have to stay with the right readers. How: This creates Alice's group, then reads its parts as Alice, Bob, and nobody, checking only Alice gets in.


	const aliStoObj = accStoFun( 'alice' );                           // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );                             // What: Bob Store Object. Why: Bob holds the link but isn't a member. How: This acts as him.
	const nobStoObj = tesEnvObj.unauthenticatedContext().firestore(); // What: Nobody Store Object. Why: A signed-out request gets nothing. How: This acts as nobody.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                           // What: Group Creation. Why: A valid batch creates the group. How: This expects it allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'groups/gro1' ) ) );                 // What: Member Group Read. Why: Members see their group's settings. How: This expects Alice allowed.
	await assertSucceeds( getDocs( collection( aliStoObj, 'groups/gro1/members' ) ) ); // What: Member List Read. Why: Members see who's in the group. How: This expects Alice allowed.
	await assertFails( getDoc( doc( bobStoObj, 'groups/gro1' ) ) );                    // What: Outsider Group Read. Why: A group's settings are for its members. How: This expects Bob refused.
	await assertFails( getDocs( collection( bobStoObj, 'groups/gro1/members' ) ) );    // What: Outsider List Read. Why: Outsiders don't see who's in a group. How: This expects Bob refused.
	await assertSucceeds( getDoc( doc( bobStoObj, `invites/${ TOK_ONE_STR }` ) ) );    // What: Invite Fetch. Why: Whoever holds the link sees which group it opens. How: This expects Bob allowed.
	await assertFails( getDoc( doc( nobStoObj, `invites/${ TOK_ONE_STR }` ) ) );       // What: Signed-Out Invite Fetch. Why: Every request needs an identity. How: This expects nobody refused.
	await assertFails( getDocs( collection( bobStoObj, 'invites' ) ) );                // What: Invite List. Why: Listing would hand out every group's token. How: This expects it refused.


} );



test( 'a group missing any part of its creation batch is refused', async () => { // What: Group Parts Test. Why: None of the four documents may exist without the others. How: This leaves out or changes one part at a time, then commits the whole batch, checking each partial batch fails and the whole one passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : null } ) );           // What: Missing Invite. Why: A group always has a working invite. How: This expects a batch without one refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { memObj : null } ) );           // What: Missing Member. Why: The owner is always a member. How: This expects a batch without the membership refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { accStr : null } ) );           // What: Missing Account Entry. Why: Every owned group takes a slot. How: This expects a batch that skips the account refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : null } ) );           // What: Missing Group. Why: The other parts belong to a group being created. How: This expects them refused on their own.
	await assertFails( groBatFun( aliStoObj, 'alice', { accStr : 'memberGroups' } ) ); // What: Member Account Entry. Why: The creator owns the group, so the slot is an owned one. How: This expects an entry in the member map refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                           // What: Whole Batch. Why: The batches above failed only for their missing part. How: This expects the whole batch allowed.


} );



test( 'a group starts with valid fields, one member, and nothing offered or blocked', async () => { // What: Group Fields Test. Why: A group's starting state and shape can't be forged. How: This changes one field at a time, then commits a valid batch, checking each change fails and the valid batch passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { memberCount : 2 } } ) );                                               // What: Two Members. Why: The creator is the only member. How: This expects a count of 2 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { pendingOfferedAt : serverTimestamp(), pendingOwnerUid : 'bob' } } ) ); // What: Offered Group. Why: Nobody has been offered a new group. How: This expects an offer refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { pendingOfferedAt : serverTimestamp() } } ) );                          // What: Timed Without Offer. Why: An offer's time comes only with an offer. How: This expects a time with nobody named refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { removedUids : { bob : true } } } ) );                                  // What: Blocked UID. Why: Nobody has been removed yet. How: This expects a blocked UID refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { createdAt : Timestamp.fromMillis( 1000 ) } } ) );                      // What: Backdated Group. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { countedUid : 'bob' } } ) );                                            // What: Other Counted. Why: The count's one member is the creator. How: This expects another UID refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { ownerUid : 'bob' } } ) );                                              // What: Other Owner. Why: Nobody creates a group in someone else's name. How: This expects Bob as owner refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : 6 } } ) );                                               // What: Short Retention. Why: Chat retention runs at least 7 days. How: This expects 6 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : 181 } } ) );                                             // What: Long Retention. Why: Chat retention runs at most 180 days. How: This expects 181 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : '30' } } ) );                                            // What: Text Retention. Why: Retention is a whole number of days. How: This expects text refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { extra : true } } ) );                                                  // What: Extra Field. Why: A group holds only its own fields. How: This expects another refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice', { groObj : { chatTtlDays : 7 } } ) );                                            // What: Shortest Retention. Why: The batches above failed only for their one field, and 7 is in range. How: This expects the batch allowed.


} );



test( 'group names allow letters, numbers, basic punctuation, and emoji, up to 50 characters, with single spaces', async () => { // What: Group Name Test. Why: The name is plaintext a stranger sees, so it keeps to readable characters (Section 11.10). How: This creates groups with allowed names, then tries refused ones, checking which pass.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the groups. How: This acts as her.

	const namAllArr = [ // What: Name Allowed Array. Why: Each kind of allowed name needs to pass. How: This lists one of each.


		'Tuesday Book Club 📚',  // What: Emoji Name. Why: Emoji are allowed. How: This ends with one.
		'Café du Monde',        // What: Accented Name. Why: Letters with accents are allowed. How: This holds one.
		'Familia 👨‍👩‍👧',        // What: Joined Emoji Name. Why: Emoji built with joiners are allowed. How: This holds a family emoji.
		'Beach Day 🏖️',         // What: Newer Emoji Name. Why: Emoji added after Unicode 6.0, which the rules' classes miss, are allowed by code point. How: This holds a Unicode 7.0 emoji with its variation selector.
		'Party 🥳 🫠',            // What: Recent Emoji Name. Why: Recent emoji are allowed too. How: This holds Unicode 11.0 and 14.0 emoji.
		'Tokyo 🇯🇵 ☕',           // What: Flag And Symbol Name. Why: Flags and older symbols are allowed. How: This holds a flag and a hot drink.
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


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batches add to an existing account. How: This writes Alice's empty one.


	for ( const [ namIndNum, namValStr ] of namAllArr.entries() ) await assertSucceeds( groBatFun( aliStoObj, 'alice', { ideStr : `all${ namIndNum }`, groObj : { name : namValStr }, tokStr : 'A'.repeat( 21 ) + namIndNum } ) ); // What: Allowed Name Loop. Why: Every allowed kind has to pass. How: This creates one group per name, each with its own ID and token.



	for ( const namValStr of namRefArr ) await assertFails( groBatFun( aliStoObj, 'alice', { groObj : { name : namValStr } } ) ); // What: Refused Name Loop. Why: Every refused kind has to fail. How: This tries each name on the same group, which is never created.


} );



test( "an invite keeps its token's form, its own group, and the group's real name", async () => { // What: Invite Shape Test. Why: A token has to be unguessable, and the invite screen has to show the truth. How: This forges one part of the invite at a time, then commits a valid batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertFails( groBatFun( aliStoObj, 'alice', { tokStr : 'A'.repeat( 21 ) } ) );                             // What: Short Token. Why: A token is 22 characters. How: This expects 21 refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { tokStr : 'A'.repeat( 21 ) + '=' } ) );                       // What: Padded Token. Why: A token uses only base64url characters, with no padding. How: This expects an equals sign refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { groupName : 'Other Club' } } ) );                 // What: Wrong Name Invite. Why: The invite screen has to show the group's real name. How: This expects a different one refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { groupId : 'gro2' } } ) );                         // What: Wrong Group Invite. Why: The group's token has to open that group. How: This expects an invite for another group refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { groupId : 'gro1/members/alice' } } ) );           // What: Path Group Invite. Why: A group ID holding slashes mustn't steer the rules' lookup to another document. How: This expects an ID shaped like a path refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { extra : true } } ) );                             // What: Extra Field Invite. Why: An invite holds exactly its three fields. How: This expects a fourth refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { invObj : { createdAt : Timestamp.fromMillis( 1000 ) } } ) ); // What: Backdated Invite. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                                                         // What: Valid Invite. Why: The batches above failed only for their forged part. How: This expects the plain batch allowed.


} );



test( 'a member document holds a bounded wrapped key and an optional encrypted name with its IV', async () => { // What: Member Shape Test. Why: The membership's encrypted fields keep their sizes, and its times are real. How: This forges one part of the member document at a time, then commits one carrying a name, checking each forgery fails and the named one passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice creates the group. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

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



test( 'while the paywall is open, everyone owns up to 10 groups and belongs to up to 20', async () => { // What: Open Cap Test. Why: Until the paywall is switched on, the paid caps apply to everyone (Section 18). How: This seeds accounts just under and at each cap, then creates a group for each, checking which the caps allow.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : groMapFun( 'own', 9 ) } );                     // What: Nine Owned Seed. Why: The tenth owned group is the last allowed. How: This gives Alice 9.
	await seeDocFun( tesEnvObj, 'accounts/bob', { memberGroups : {}, ownedGroups : groMapFun( 'own', 10 ) } );                      // What: Ten Owned Seed. Why: An eleventh owned group is over the cap. How: This gives Bob 10.
	await seeDocFun( tesEnvObj, 'accounts/carol', { memberGroups : groMapFun( 'mem', 18 ), ownedGroups : groMapFun( 'own', 1 ) } ); // What: Nineteen Belonged Seed. Why: The twentieth group belonged to is the last allowed, counting owned and member groups together. How: This gives Carol 18 member groups and 1 owned.
	await seeDocFun( tesEnvObj, 'accounts/dave', { memberGroups : groMapFun( 'mem', 19 ), ownedGroups : groMapFun( 'own', 1 ) } );  // What: Twenty Belonged Seed. Why: A twenty-first group is over the cap, counting owned and member groups together. How: This gives Dave 19 member groups and 1 owned.

	await assertSucceeds( groBatFun( accStoFun( 'alice' ), 'alice', { ideStr : 'groA', tokStr : 'A'.repeat( 22 ) } ) ); // What: Tenth Owned. Why: 10 owned is the open cap. How: This expects Alice allowed.
	await assertFails( groBatFun( accStoFun( 'bob' ), 'bob', { ideStr : 'groB', tokStr : 'B'.repeat( 22 ) } ) );        // What: Eleventh Owned. Why: 11 owned is over the cap. How: This expects Bob refused.
	await assertSucceeds( groBatFun( accStoFun( 'carol' ), 'carol', { ideStr : 'groC', tokStr : 'C'.repeat( 22 ) } ) ); // What: Twentieth Belonged. Why: 20 groups is the open cap. How: This expects Carol allowed.
	await assertFails( groBatFun( accStoFun( 'dave' ), 'dave', { ideStr : 'groD', tokStr : 'D'.repeat( 22 ) } ) );      // What: Twenty-First Belonged. Why: 21 groups is over the cap. How: This expects Dave refused.


} );



test( 'with the paywall locked, a free identity owns 1 group and belongs to 10, while a paid one gets the paid caps', async () => { // What: Locked Cap Test. Why: Once the paywall is on, the free caps apply until someone buys (Section 18). How: This seeds accounts in the locked project, then creates a group for each, checking which the locked caps allow.


	await seeDocFun( locEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } );                                 // What: Empty Free Seed. Why: A free identity's first owned group is allowed. How: This gives Alice none.
	await seeDocFun( locEnvObj, 'accounts/bob', { memberGroups : {}, ownedGroups : groMapFun( 'own', 1 ) } );                // What: One Owned Free Seed. Why: A second owned group is over the free cap. How: This gives Bob 1.
	await seeDocFun( locEnvObj, 'accounts/carol', { memberGroups : {}, ownedGroups : groMapFun( 'own', 1 ), paid : true } ); // What: One Owned Paid Seed. Why: Paying lifts the owned cap. How: This gives Carol 1 and the paid flag.
	await seeDocFun( locEnvObj, 'accounts/dave', { memberGroups : groMapFun( 'mem', 9 ), ownedGroups : {} } );               // What: Nine Member Free Seed. Why: The tenth group belonged to is the free cap. How: This gives Dave 9.
	await seeDocFun( locEnvObj, 'accounts/erin', { memberGroups : groMapFun( 'mem', 10 ), ownedGroups : {} } );              // What: Ten Member Free Seed. Why: An eleventh group is over the free cap. How: This gives Erin 10.

	await assertSucceeds( groBatFun( locStoFun( 'alice' ), 'alice', { ideStr : 'groA', tokStr : 'A'.repeat( 22 ) } ) ); // What: First Owned Free. Why: One owned group is free. How: This expects Alice allowed.
	await assertFails( groBatFun( locStoFun( 'bob' ), 'bob', { ideStr : 'groB', tokStr : 'B'.repeat( 22 ) } ) );        // What: Second Owned Free. Why: A second owned group needs a purchase. How: This expects Bob refused.
	await assertSucceeds( groBatFun( locStoFun( 'carol' ), 'carol', { ideStr : 'groC', tokStr : 'C'.repeat( 22 ) } ) ); // What: Second Owned Paid. Why: A paid identity may own more. How: This expects Carol allowed.
	await assertSucceeds( groBatFun( locStoFun( 'dave' ), 'dave', { ideStr : 'groD', tokStr : 'D'.repeat( 22 ) } ) );   // What: Tenth Belonged Free. Why: 10 groups is the free cap. How: This expects Dave allowed.
	await assertFails( groBatFun( locStoFun( 'erin' ), 'erin', { ideStr : 'groE', tokStr : 'E'.repeat( 22 ) } ) );      // What: Eleventh Belonged Free. Why: 11 groups is over the free cap. How: This expects Erin refused.


} );



test( "an account's groups change only by one owned entry, as that group is created", async () => { // What: Account Change Test. Why: An account's map is what the caps count, so it can't be padded, borrowed, or used to smuggle in the paid flag. How: This tries account changes outside a creation and extras inside one, then commits a valid batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the account. How: This acts as her.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The changes need an account to change. How: This writes Alice's empty one.
	await seeDocFun( tesEnvObj, 'groups/old1', { chatTtlDays : 30, countedUid : 'alice', createdAt : Timestamp.fromMillis( 1000 ), currentInviteToken : TOK_ONE_STR, memberCount : 1, name : GRO_NAM_STR, ownerUid : 'alice', pendingOfferedAt : null, pendingOwnerUid : null, removedUids : {} } ); // What: Old Group Seed Call. Why: A group that already exists can't be claimed as newly created. How: This writes one owned by Alice.

	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { 'ownedGroups.ghost' : true } ) ); // What: Ghost Entry. Why: An entry is added only as its group is created. How: This expects an entry for a group that doesn't exist refused.
	await assertFails( updateDoc( doc( aliStoObj, 'accounts/alice' ), { 'ownedGroups.old1' : true } ) );  // What: Old Group Entry. Why: Only a group created in the same batch joins the account this way. How: This expects an entry for an existing group refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { accObj : { paid : true } } ) );                   // What: Smuggled Paid Flag. Why: Only the payment webhook sets the paid flag. How: This expects it refused inside a creation batch.
	await assertFails( groBatFun( aliStoObj, 'alice', { accObj : { 'ownedGroups.zzz1' : true } } ) );     // What: Extra Entry. Why: One batch creates one group, so one entry changes. How: This expects a second owned entry refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { accObj : { 'memberGroups.zzz1' : true } } ) );    // What: Other Map Entry. Why: A creation touches only the owned map. How: This expects a member entry beside it refused.
	await assertFails( groBatFun( aliStoObj, 'alice', { accObj : { 'ownedGroups.gro1' : 'owner' } } ) );  // What: Entry Value. Why: Every entry holds true, so nothing rides along in it. How: This expects another value refused.
	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) );                                              // What: Valid Change. Why: The changes above failed only for their forgery. How: This expects the plain batch allowed.


} );



test( 'nobody joins an existing group, or adds a second invite, by writing the documents themselves', async () => { // What: Self Join Test. Why: Every join waits for a member's approval (Section 17), and a group has one working invite. How: This creates Alice's group, then has Bob write his own membership and Alice slip in a second invite, checking both fail.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob holds the link but hasn't been approved. How: This acts as him.


	await seeDocFun( tesEnvObj, 'accounts/alice', { memberGroups : {}, ownedGroups : {} } ); // What: Account Seed Call. Why: The batch adds to an existing account. How: This writes Alice's empty one.

	await assertSucceeds( groBatFun( aliStoObj, 'alice' ) ); // What: Group Creation. Why: The joins below need an existing group. How: This expects Alice's group allowed.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { joinedAt : serverTimestamp(), lastActiveAt : serverTimestamp(), wrappedGroupKey : bytFilFun( 105 ) } ) ); // What: Self Join. Why: A membership comes only from the creation batch, or later from an approval. How: This expects Bob's own membership refused.
	await assertFails( setDoc( doc( aliStoObj, `invites/${ 'B'.repeat( 22 ) }` ), { createdAt : serverTimestamp(), groupId : 'gro1', groupName : GRO_NAM_STR } ) );                     // What: Second Invite. Why: A group's one working invite is the token it names. How: This expects another token for the group refused.


} );



test( "someone holding the invite asks to join, which they and the members can read but outsiders can't", async () => { // What: Request Create Test. Why: A request goes in through the invite and is seen only by the joiner and the approvers (Section 17). How: This files Bob's request, then reads it as Bob, Alice, and Carol.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member who reviews requests. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob asks to join. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol is an outsider. How: This acts as her.


	await seeJoiFun( [ 'bob', 'carol' ] ); // What: Join Seed Call. Why: The request needs a group and a joiner. How: This sets them up.

	await assertSucceeds( reqSetFun( bobStoObj, 'bob' ) );                                  // What: Request Filed. Why: A valid request through the invite goes in. How: This expects Bob allowed.
	await assertSucceeds( getDoc( doc( bobStoObj, 'groups/gro1/joinRequests/bob' ) ) );     // What: Own Request Read. Why: A joiner checks on their request. How: This expects Bob allowed.
	await assertSucceeds( getDocs( collection( aliStoObj, 'groups/gro1/joinRequests' ) ) ); // What: Member List Read. Why: Members review every pending request. How: This expects Alice allowed.
	await assertFails( getDoc( doc( carStoObj, 'groups/gro1/joinRequests/bob' ) ) );        // What: Outsider Read. Why: A request's name and note are for the group. How: This expects Carol refused.
	await assertFails( getDocs( collection( carStoObj, 'groups/gro1/joinRequests' ) ) );    // What: Outsider List. Why: Outsiders don't see who's asking. How: This expects Carol refused.
	await assertSucceeds( reqSetFun( carStoObj, 'carol', { noteText : undefined } ) );      // What: Noteless Request. Why: The note is optional. How: This expects Carol's request without one allowed.


} );



test( "a join request is refused without a working invite, from a blocked, existing, or capped identity, or in someone else's name", async () => { // What: Request Eligibility Test. Why: Only someone holding this group's working invite, who can actually be let in, may ask (Section 17). How: This tries each disqualified request.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is already a member. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob asks to join. How: This acts as him.


	await seeJoiFun( [ 'bob', 'alice', 'carol' ] ); // What: Join Seed Call. Why: The requests need a group and fully set-up joiners, so each refusal below has one cause. How: This sets them up, with Alice's and Carol's keys too.

	await seeDocFun( tesEnvObj, `invites/${ 'B'.repeat( 22 ) }`, { createdAt : Timestamp.fromMillis( 1000 ), groupId : 'gro2', groupName : 'Other Club' } ); // What: Other Invite Seed. Why: Another group's invite mustn't open this one. How: This writes an invite for gro2.
	await seeDocFun( tesEnvObj, 'accounts/dave', { memberGroups : {}, ownedGroups : {} } );                                                                  // What: Keyless Account Seed. Why: Dave has an account but never published a key. How: This writes his empty account alone.

	await assertFails( reqSetFun( bobStoObj, 'bob', { inviteToken : 'C'.repeat( 22 ) } ) ); // What: Missing Invite. Why: A rotated or made-up token opens nothing. How: This expects a token with no invite refused.
	await assertFails( reqSetFun( bobStoObj, 'bob', { inviteToken : 'B'.repeat( 22 ) } ) ); // What: Other Group Invite. Why: An invite opens only its own group. How: This expects gro2's token refused.
	await assertFails( reqSetFun( bobStoObj, 'carol' ) );                                   // What: Other Name Request. Why: Nobody asks in someone else's name. How: This expects Bob filing under Carol refused.
	await assertFails( reqSetFun( aliStoObj, 'alice' ) );                                   // What: Member Request. Why: A member has nothing to ask for. How: This expects Alice refused.
	await assertFails( reqSetFun( accStoFun( 'dave' ), 'dave' ) );                          // What: Keyless Request. Why: The approver needs the joiner's key. How: This expects Dave, with an account but no user document, refused.

	await seeDocFun( tesEnvObj, 'accounts/bob', { memberGroups : groMapFun( 'mem', 20 ), ownedGroups : {} } ); // What: Full Account Seed. Why: A joiner at the cap has no slot for another group. How: This gives Bob 20 groups.

	await assertFails( reqSetFun( bobStoObj, 'bob' ) ); // What: Capped Request. Why: Joining would put Bob over the cap. How: This expects him refused.

	await seeDocFun( tesEnvObj, 'accounts/bob', { memberGroups : {}, ownedGroups : {} } );                                                                    // What: Account Reset Seed. Why: The block check needs Bob otherwise eligible. How: This empties his account again.
	await tesEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'groups/gro1' ), { removedUids : { bob : true } } ) ); // What: Block Seed. Why: A blocked identity can't redeem any link. How: This puts Bob on the group's blocklist.

	await assertFails( reqSetFun( bobStoObj, 'bob' ) ); // What: Blocked Request. Why: Bob was removed and blocked. How: This expects him refused.


} );



test( 'a join request keeps real times, its own fields, and the name and note limits', async () => { // What: Request Shape Test. Why: The name and note are plaintext members read, and the times have to be real (Section 11.10, Section 17). How: This files each allowed request and withdraws it, then tries each refused one, checking which pass.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob asks to join. How: This acts as him.

	const namAllArr = [ // What: Name Allowed Array. Why: Each kind of allowed name needs to pass. How: This lists one of each.


		'José María',        // What: Accented Name. Why: Letters with accents are allowed. How: This holds them.
		"O'Brien-Smith Jr.", // What: Joined Name. Why: Apostrophes, hyphens, and periods are allowed. How: This holds each.
		'李小龙',               // What: Chinese Name. Why: Letters in any script are allowed. How: This is written in Chinese.
		'A'.repeat( 40 )     // What: Longest Name. Why: 40 characters is the limit. How: This is exactly 40.


	];

	const namRefArr = [ // What: Name Refused Array. Why: Each kind of refused name needs to fail. How: This lists one of each.


		'',               // What: Empty Name. Why: A request needs a name. How: This has none.
		'A'.repeat( 41 ), // What: Long Name. Why: 40 characters is the limit. How: This is 41.
		'Bob 2',          // What: Numbered Name. Why: A person's name holds no numbers. How: This holds one.
		'Bob 🙂',          // What: Emoji Name. Why: A person's name holds no emoji. How: This holds one.
		' Bob',           // What: Leading Space Name. Why: Names don't start with a space. How: This does.
		'Bob  Jones',     // What: Doubled Space Name. Why: Words are separated by one space. How: This uses two.
		'Bob\u202EJones'  // What: Direction Override Name. Why: A right-to-left override can disguise a name. How: This holds one.


	];

	const notAllArr = [ // What: Note Allowed Array. Why: Each kind of allowed note needs to pass. How: This lists one of each.


		'',                            // What: Empty Note. Why: An empty note is allowed. How: This has no text.
		'From the Tuesday book club!', // What: Punctuated Note. Why: Letters and basic punctuation are allowed. How: This holds both.
		'A'.repeat( 150 )              // What: Longest Note. Why: 150 characters is the limit. How: This is exactly 150.


	];

	const notRefArr = [ // What: Note Refused Array. Why: Each kind of refused note needs to fail. How: This lists one of each.


		'A'.repeat( 151 ),   // What: Long Note. Why: 150 characters is the limit. How: This is 151.
		'See you there 🎉',   // What: Emoji Note. Why: A note holds no emoji. How: This holds one.
		'Line one\nLine two' // What: Line Break Note. Why: A note is one line. How: This breaks it.


	];


	await seeJoiFun( [ 'bob' ] ); // What: Join Seed Call. Why: The requests need a group and a joiner. How: This sets them up.


	for ( const namValStr of namAllArr ) { // What: Allowed Name Loop. Why: Every allowed name has to pass. How: This files a request with each, then withdraws it so the next can be filed.


		await assertSucceeds( reqSetFun( bobStoObj, 'bob', { nameText : namValStr } ) );       // What: Name Request Filed. Why: The name is allowed. How: This expects the request allowed.
		await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/joinRequests/bob' ) ) ); // What: Name Request Withdrawn. Why: One request per joiner, so the next needs this gone. How: This expects Bob's withdrawal allowed.


	}



	for ( const notValStr of notAllArr ) { // What: Allowed Note Loop. Why: Every allowed note has to pass. How: This files a request with each, then withdraws it.


		await assertSucceeds( reqSetFun( bobStoObj, 'bob', { noteText : notValStr } ) );       // What: Note Request Filed. Why: The note is allowed. How: This expects the request allowed.
		await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/joinRequests/bob' ) ) ); // What: Note Request Withdrawn. Why: The next request needs this gone. How: This expects the withdrawal allowed.


	}



	for ( const namValStr of namRefArr ) await assertFails( reqSetFun( bobStoObj, 'bob', { nameText : namValStr } ) ); // What: Refused Name Loop. Why: Every refused name has to fail. How: This tries each.



	for ( const notValStr of notRefArr ) await assertFails( reqSetFun( bobStoObj, 'bob', { noteText : notValStr } ) ); // What: Refused Note Loop. Why: Every refused note has to fail. How: This tries each.



	await assertFails( reqSetFun( bobStoObj, 'bob', { requestedAt : Timestamp.fromMillis( 1000 ) } ) );                       // What: Backdated Request. Why: The request time has to be the server's. How: This expects a chosen time refused.
	await assertFails( reqSetFun( bobStoObj, 'bob', { expireAt : Timestamp.fromMillis( Date.now() + DAY_MIL_NUM ) } ) );      // What: Early Expiry. Why: A request lasts about 7 days. How: This expects a 1-day expiry refused.
	await assertFails( reqSetFun( bobStoObj, 'bob', { expireAt : Timestamp.fromMillis( Date.now() + 30 * DAY_MIL_NUM ) } ) ); // What: Late Expiry. Why: An ignored request has to clear itself. How: This expects a 30-day expiry refused.
	await assertFails( reqSetFun( bobStoObj, 'bob', { nameText : undefined } ) );                                             // What: Nameless Request. Why: The approver has to see a name. How: This expects a request without one refused.
	await assertFails( reqSetFun( bobStoObj, 'bob', { extra : true } ) );                                                     // What: Extra Field Request. Why: A request holds only its own fields. How: This expects another refused.


} );



test( 'the joiner may withdraw and any member may decline, while nobody else deletes and nobody changes a request', async () => { // What: Request Delete Test. Why: A request ends by the joiner's withdrawal or a member's decline, and its text can't be edited after members have read it (Section 17). How: This files Bob's request, then changes and deletes it as each identity, checking who the rules let through.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member who may decline. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob filed the request. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol is an outsider. How: This acts as her.


	await seeJoiFun( [ 'bob', 'carol' ] ); // What: Join Seed Call. Why: The request needs a group and a joiner. How: This sets them up.

	await assertSucceeds( reqSetFun( bobStoObj, 'bob' ) );                                                             // What: Request Filed. Why: The changes below need a request. How: This expects Bob's allowed.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/joinRequests/bob' ), { nameText : 'Robert Jones' } ) ); // What: Request Edit. Why: The name members reviewed can't change under them. How: This expects Bob's edit refused.
	await assertFails( deleteDoc( doc( carStoObj, 'groups/gro1/joinRequests/bob' ) ) );                                // What: Outsider Delete. Why: Only the joiner and the members end a request. How: This expects Carol refused.
	await assertSucceeds( deleteDoc( doc( aliStoObj, 'groups/gro1/joinRequests/bob' ) ) );                             // What: Member Decline. Why: Any member may decline. How: This expects Alice allowed.
	await assertSucceeds( reqSetFun( bobStoObj, 'bob' ) );                                                             // What: Request Refiled. Why: A declined joiner who isn't blocked may ask again. How: This expects Bob allowed.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/joinRequests/bob' ) ) );                             // What: Own Withdrawal. Why: A joiner may change their mind. How: This expects Bob allowed.


} );



test( 'a member approves a request in one batch, and the joiner becomes a member', async () => { // What: Approval Test. Why: Any member can let a joiner in, and the joiner then reads the group as a member (Section 17). How: This approves Bob as Alice, then reads the group and his account as Bob, checking the approval and his access.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob is the joiner. How: This acts as him.


	await seeAppFun( tesEnvObj ); // What: Approval Seed Call. Why: The approval needs a group and a pending request. How: This seeds them.

	await assertSucceeds( appBatFun( accStoFun( 'alice' ), 'bob' ) );   // What: Bob Approved. Why: A valid approval batch goes through. How: This expects Alice's approval allowed.
	await assertSucceeds( getDoc( doc( bobStoObj, 'groups/gro1' ) ) );  // What: New Member Read. Why: Bob is now a member. How: This expects him allowed to read the group.
	await assertSucceeds( getDoc( doc( bobStoObj, 'accounts/bob' ) ) ); // What: Own Account Read. Why: Bob's account now lists the group. How: This expects him allowed to read it.


} );



test( 'an approval missing or changing any part of its batch is refused', async () => { // What: Approval Parts Test. Why: A membership can't exist without its account entry, count, and answered request, and the batch can't change anything else. How: This changes or leaves out one part at a time, then commits the whole batch, checking each partial batch fails and the whole one passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice approves. How: This acts as her.


	await seeAppFun( tesEnvObj ); // What: Approval Seed Call. Why: The approval needs a group and a pending request. How: This seeds them.

	await assertFails( appBatFun( aliStoObj, 'bob', { memObj : null } ) );                                        // What: Missing Member. Why: The other parts belong to a new membership. How: This expects a batch without it refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { accStr : null } ) );                                        // What: Missing Account Entry. Why: A membership takes a slot. How: This expects a batch that skips the account refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { groObj : null } ) );                                        // What: Missing Count. Why: Every membership is counted. How: This expects a batch that skips the group refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { reqBoo : false } ) );                                       // What: Kept Request. Why: An approved request ends. How: This expects a batch that keeps it refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { accObj : { paid : true } } ) );                             // What: Smuggled Paid Flag. Why: Only the payment webhook sets the paid flag. How: This expects it refused inside an approval.
	await assertFails( appBatFun( aliStoObj, 'bob', { accObj : { 'memberGroups.zzz1' : true } } ) );              // What: Extra Entry. Why: One approval adds one group to the joiner's account. How: This expects a second entry refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { accObj : { 'memberGroups.gro1' : 'owner' } } ) );           // What: Entry Value. Why: Every entry holds true, so nothing rides along in it. How: This expects another value refused.
	await assertFails( updateDoc( doc( aliStoObj, 'accounts/bob' ), { 'memberGroups.gro1' : true } ) );           // What: Account Padding. Why: A member mustn't fill someone's slots without letting them in, which would lock them out of other groups. How: This expects an entry written without the membership refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { accStr : 'ownedGroups' } ) );                               // What: Owner Entry. Why: A joiner is a member, not an owner. How: This expects an entry in the owned map refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { couNum : 2 } ) );                                           // What: Double Count. Why: One approval counts one member. How: This expects a rise of 2 refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { couStr : 'carol' } ) );                                     // What: Other Counted. Why: The count's change is for the joiner. How: This expects another UID refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { groObj : { name : 'New Name' } } ) );                       // What: Smuggled Rename. Why: An approval changes only the count. How: This expects a rename in the batch refused.
	await assertFails( appBatFun( aliStoObj, 'bob', { memObj : { joinedAt : Timestamp.fromMillis( 1000 ) } } ) ); // What: Backdated Join. Why: The join time gates chat history. How: This expects a chosen time refused.
	await assertSucceeds( appBatFun( aliStoObj, 'bob' ) );                                                        // What: Whole Approval. Why: The batches above failed only for their one part. How: This expects the whole batch allowed.


} );



test( 'only a member approves, only a pending request, and never a blocked or capped joiner', async () => { // What: Approval Eligibility Test. Why: Letting someone in is a member's call, answers a real request, and respects the blocklist and the joiner's cap. How: This tries each disqualified approval and checks the rules refuse it.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member. How: This acts as her.


	await seeAppFun( tesEnvObj );                                                                                          // What: Approval Seed Call. Why: The approvals need a group and a pending request. How: This seeds them.

	await seeDocFun( tesEnvObj, 'accounts/carol', { memberGroups : {}, ownedGroups : {} } );                               // What: Outsider Account Seed. Why: Carol is signed in but not a member. How: This writes her account.
	await seeDocFun( tesEnvObj, 'accounts/dave', { memberGroups : {}, ownedGroups : {} } );                                // What: Requestless Account Seed. Why: Dave never asked to join. How: This writes his account alone.
	await seeDocFun( tesEnvObj, 'users/dave', { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ); // What: Requestless Key Seed. Why: Dave's only missing piece is a request. How: This writes his key.

	await assertFails( appBatFun( accStoFun( 'carol' ), 'bob' ) );           // What: Outsider Approval. Why: Only a member lets someone in. How: This expects Carol refused.
	await assertFails( appBatFun( accStoFun( 'bob' ), 'bob' ) );             // What: Self Approval. Why: Nobody lets themselves in. How: This expects Bob refused.
	await assertFails( appBatFun( aliStoObj, 'dave', { reqBoo : false } ) ); // What: Requestless Approval. Why: Only someone who asked is let in. How: This expects Dave refused.

	await seeDocFun( tesEnvObj, 'accounts/bob', { memberGroups : groMapFun( 'mem', 20 ), ownedGroups : {} } ); // What: Full Account Seed. Why: A joiner at the cap has no slot. How: This gives Bob 20 groups.

	await assertFails( appBatFun( aliStoObj, 'bob' ) ); // What: Capped Approval. Why: Joining would put Bob over his cap. How: This expects the approval refused.

	await seeDocFun( tesEnvObj, 'accounts/bob', { memberGroups : {}, ownedGroups : {} } );                                                                    // What: Account Reset Seed. Why: The block check needs Bob otherwise eligible. How: This empties his account again.
	await tesEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'groups/gro1' ), { removedUids : { bob : true } } ) ); // What: Block Seed. Why: A blocked identity stays out. How: This puts Bob on the blocklist.

	await assertFails( appBatFun( aliStoObj, 'bob' ) ); // What: Blocked Approval. Why: Bob is blocked. How: This expects the approval refused.


} );



test( "approvals stop at the owner's member cap, 50 while the paywall is open, and 20 for a free owner or 50 for a paid one once it's locked", async () => { // What: Member Cap Test. Why: A group's size follows its owner's status (Section 18). How: This approves up to each cap and one past it, in both projects.


	await seeAppFun( tesEnvObj, 49 ); // What: Open Seed Call. Why: The fiftieth member is the last allowed while the paywall is open. How: This seeds the group at 49.
	await seeAppFun( locEnvObj, 19 ); // What: Locked Seed Call. Why: The twentieth member is a free owner's last. How: This seeds the locked group at 19.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Open Second Request Seed. Why: A second joiner tests the cap. How: This seeds Carol's request.
	await seeReqFun( locEnvObj, 'carol' ); // What: Locked Second Request Seed. Why: A second joiner tests the cap. How: This seeds Carol's request.

	await assertSucceeds( appBatFun( accStoFun( 'alice' ), 'bob' ) ); // What: Fiftieth Member. Why: 50 is the open cap. How: This expects Bob approved.
	await assertFails( appBatFun( accStoFun( 'alice' ), 'carol' ) );  // What: Fifty-First Member. Why: 51 is over the cap. How: This expects Carol refused.
	await assertSucceeds( appBatFun( locStoFun( 'alice' ), 'bob' ) ); // What: Twentieth Free Member. Why: 20 is a free owner's cap. How: This expects Bob approved.
	await assertFails( appBatFun( locStoFun( 'alice' ), 'carol' ) );  // What: Twenty-First Free Member. Why: 21 is over a free owner's cap. How: This expects Carol refused.

	await locEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'accounts/alice' ), { paid : true } ) ); // What: Owner Paid Seed. Why: Paying lifts the member cap. How: This sets Alice's paid flag.

	await assertSucceeds( appBatFun( locStoFun( 'alice' ), 'carol' ) ); // What: Twenty-First Paid Member. Why: A paid owner's cap is 50. How: This expects Carol approved.


} );



test( 'a member may decline and block a pending requester, and change nothing else on the blocklist', async () => { // What: Block Test. Why: Declining and blocking keeps that identity out for good, but the blocklist can't be used to remove members or block at random (Sections 9 and 17). How: This tries each improper block, then blocks Bob, checking the improper ones fail and the block passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member who declines. How: This acts as her.


	await seeAppFun( tesEnvObj );                                    // What: Block Seed Call. Why: The block needs a group and a pending request. How: This seeds them.

	await seeDocFun( tesEnvObj, 'accounts/carol', { memberGroups : {}, ownedGroups : {} } ); // What: Outsider Account Seed. Why: Carol is signed in but not a member. How: This writes her account.

	await assertFails( bloBatFun( accStoFun( 'carol' ), 'bob' ) );                                  // What: Outsider Block. Why: Only a member declines. How: This expects Carol refused.
	await assertFails( bloBatFun( aliStoObj, 'bob', { delBoo : false } ) );                         // What: Kept Request Block. Why: A block answers the request, which ends. How: This expects a block that keeps it refused.
	await assertFails( bloBatFun( aliStoObj, 'dave', { delBoo : false } ) );                        // What: Requestless Block. Why: Only a pending requester is blocked this way. How: This expects Dave refused.
	await assertFails( bloBatFun( aliStoObj, 'bob', { extObj : { 'removedUids.eve' : true } } ) );  // What: Double Block. Why: One decline blocks one identity. How: This expects a second UID refused.
	await assertFails( bloBatFun( aliStoObj, 'bob', { extObj : { name : 'New Name' } } ) );         // What: Smuggled Rename. Why: A block changes only the blocklist. How: This expects a rename in the batch refused.
	await assertFails( bloBatFun( aliStoObj, 'bob', { extObj : { 'removedUids.bob' : 'yes' } } ) ); // What: Wrong Value Block. Why: The blocklist maps each UID to true. How: This expects another value refused.
	await assertSucceeds( bloBatFun( aliStoObj, 'bob' ) );                                          // What: Bob Blocked. Why: The blocks above failed only for their one part. How: This expects the block allowed.


} );



test( 'a member writes only their own encrypted name and activity time', async () => { // What: Member Update Test. Why: A new member names themselves after joining, while the key and join time stay as granted (Section 17). How: This approves Bob, then changes his membership as him and as Alice, checking which changes pass.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is another member. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is the new member. How: This acts as him.


	await seeAppFun( tesEnvObj ); // What: Approval Seed Call. Why: Bob needs a membership to change. How: This seeds the group and his request.

	await appBatFun( aliStoObj, 'bob' ); // What: Approval Call. Why: Bob becomes a member. How: This approves him.

	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { displayNameEnc : bytFilFun( 40 ), iv : bytFilFun( 12 ) } ) ); // What: Own Name Write. Why: A new member writes their encrypted name. How: This expects Bob allowed.
	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { lastActiveAt : serverTimestamp() } ) );                       // What: Own Activity Write. Why: A member marks when they were last active. How: This expects the server's time allowed.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { lastActiveAt : Timestamp.fromMillis( 9e12 ) } ) );               // What: Forged Activity. Why: The activity time decides when ownership can be claimed. How: This expects a chosen time refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { displayNameEnc : bytFilFun( 137 ) } ) );                         // What: Large Name. Why: A name encrypts to at most 136 bytes. How: This expects 137 refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { wrappedGroupKey : bytFilFun( 104 ) } ) );                        // What: Key Change. Why: The wrapped key is set by whoever let the member in. How: This expects a change refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/members/bob' ), { joinedAt : serverTimestamp() } ) );                              // What: Join Time Change. Why: The join time gates chat history. How: This expects a change refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1/members/bob' ), { displayNameEnc : bytFilFun( 40 ) } ) );                          // What: Other Name Write. Why: Only the member names themselves. How: This expects Alice refused.


} );



test( 'the member count moves only with a membership the same batch creates', async () => { // What: Count Test. Why: An inflated count could block every join, so it can't move on its own. How: This raises the count as Alice for an existing member and for nobody, checking both fail.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member. How: This acts as her.


	await seeAppFun( tesEnvObj ); // What: Count Seed Call. Why: The count needs a group. How: This seeds it.

	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { countedUid : 'alice', memberCount : 2 } ) ); // What: Existing Member Count. Why: Alice's membership isn't new. How: This expects the rise refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { countedUid : 'ghost', memberCount : 2 } ) ); // What: Nobody Count. Why: No membership is being created. How: This expects the rise refused.


} );



test( "a member leaves in one batch, after which they can't read the group", async () => { // What: Leave Test. Why: Every member but the owner can always leave (Section 9). How: This has Bob leave, then reads the group as Bob and Alice.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice stays. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob leaves. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Leaving needs a second member. How: This approves Bob into the group.

	await assertSucceeds( lefBatFun( bobStoObj, 'bob' ) );              // What: Bob Leaves. Why: A valid leave batch goes through. How: This expects it allowed.
	await assertFails( getDoc( doc( bobStoObj, 'groups/gro1' ) ) );     // What: Former Member Read. Why: Bob is no longer a member. How: This expects him refused.
	await assertSucceeds( getDoc( doc( aliStoObj, 'groups/gro1' ) ) );  // What: Remaining Member Read. Why: Alice is still a member. How: This expects her allowed.
	await assertSucceeds( getDoc( doc( bobStoObj, 'accounts/bob' ) ) ); // What: Own Account Read. Why: Bob's account no longer lists the group. How: This expects him allowed to read it.


} );



test( "a leave missing or changing any part is refused, and the owner can't leave or end someone else's membership that way", async () => { // What: Leave Parts Test. Why: A membership can't end without its account entry and count, nor leave the owner's group ownerless (Section 18). How: This changes or leaves out one part at a time, then commits the whole batch.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob leaves. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Leaving needs a second member. How: This approves Bob into the group.

	await tesEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'accounts/bob' ), { 'memberGroups.gro9' : true } ) ); // What: Second Group Seed. Why: The double drop needs a second entry in Bob's account. How: This adds one.

	await assertFails( lefBatFun( bobStoObj, 'bob', { memBoo : false } ) );                                                  // What: Kept Membership. Why: The other parts belong to an ending membership. How: This expects a batch that keeps it refused.
	await assertFails( lefBatFun( bobStoObj, 'bob', { accBoo : false } ) );                                                  // What: Kept Account Entry. Why: The slot frees with the membership. How: This expects a batch that keeps the entry refused.
	await assertFails( lefBatFun( bobStoObj, 'bob', { groObj : null } ) );                                                   // What: Kept Count. Why: Every membership is counted. How: This expects a batch that skips the group refused.
	await assertFails( lefBatFun( bobStoObj, 'bob', { groObj : { memberCount : increment( -2 ) } } ) );                      // What: Double Uncount. Why: One leave uncounts one member. How: This expects a fall of 2 refused.
	await assertFails( lefBatFun( bobStoObj, 'bob', { groObj : { name : 'New Name' } } ) );                                  // What: Smuggled Rename. Why: A leave changes only the count. How: This expects a rename in the batch refused.
	await assertFails( lefBatFun( bobStoObj, 'bob', { accObj : { paid : true } } ) );                                        // What: Smuggled Paid Flag. Why: Only the payment webhook sets the paid flag. How: This expects it refused inside a leave.
	await assertFails( lefBatFun( bobStoObj, 'bob', { accObj : { 'memberGroups.gro9' : deleteField() } } ) );                // What: Double Drop. Why: One leave ends one membership. How: This expects a second dropped entry refused.
	await assertFails( updateDoc( doc( bobStoObj, 'accounts/bob' ), { 'memberGroups.gro1' : deleteField() } ) );             // What: Slot Freed While Staying. Why: A slot frees only as its membership ends, or the caps could be dodged. How: This expects the entry dropped alone refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1' ), { countedUid : 'bob', memberCount : 1 } ) );              // What: Uncount While Staying. Why: The count falls only as a membership ends. How: This expects Bob lowering it alone refused.
	await assertFails( updateDoc( doc( accStoFun( 'carol' ), 'groups/gro1' ), { countedUid : 'carol', memberCount : 1 } ) ); // What: Outsider Uncount. Why: Only a real membership can end, so nobody else can shrink the count. How: This expects Carol, never a member, refused.
	await assertFails( lefBatFun( aliStoObj, 'alice' ) );                                                                    // What: Owner Leave. Why: An owner transfers the group before leaving. How: This expects Alice refused.
	await assertFails( lefBatFun( aliStoObj, 'bob' ) );                                                                      // What: Leave For Another. Why: Ending someone else's membership is a removal, which blocks and rotates. How: This expects Alice leaving Bob out refused.
	await assertSucceeds( lefBatFun( bobStoObj, 'bob' ) );                                                                   // What: Whole Leave. Why: The batches above failed only for their one part. How: This expects the whole batch allowed.


} );



test( 'the owner removes a member in one transaction that blocks them and rotates the invite', async () => { // What: Removal Test. Why: A removed member can't rejoin with the link they had or any later one (Section 9). How: This removes Bob as Alice, then tries the old and new links as Bob and Carol, checking only Carol's request through the new link passes.


	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is removed. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol holds the link and hasn't joined. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Removal needs a second member. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'accounts/carol', { memberGroups : {}, ownedGroups : {} } );                                // What: Carol Account Seed. Why: Carol may ask to join. How: This writes her empty account.
	await seeDocFun( tesEnvObj, 'users/carol', { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } ); // What: Carol Key Seed. Why: A joiner has published a key. How: This writes hers.

	await assertSucceeds( remBatFun( accStoFun( 'alice' ) ) );                              // What: Bob Removed. Why: A valid removal goes through. How: This expects Alice's removal allowed.
	await assertFails( getDoc( doc( bobStoObj, 'groups/gro1' ) ) );                         // What: Removed Member Read. Why: Bob is no longer a member. How: This expects him refused.
	await assertFails( reqSetFun( bobStoObj, 'bob', { inviteToken : NEW_TOK_STR } ) );      // What: Blocked Rejoin. Why: Bob is on the blocklist, even with the new link. How: This expects his request refused.
	await assertFails( reqSetFun( carStoObj, 'carol' ) );                                   // What: Old Link Request. Why: The old link stopped working. How: This expects Carol refused with it.
	await assertSucceeds( reqSetFun( carStoObj, 'carol', { inviteToken : NEW_TOK_STR } ) ); // What: New Link Request. Why: The new link opens the group. How: This expects Carol allowed with it.


} );



test( 'a removal missing any part is refused, and only the owner removes, never themselves', async () => { // What: Removal Parts Test. Why: A removal always blocks, rotates, and frees the slot, and it's the owner's action alone. How: This changes or leaves out one part at a time, then commits the whole transaction, checking each partial one fails and the whole one passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Removal needs a second member. How: This approves Bob into the group.

	await assertFails( remBatFun( aliStoObj, { memBoo : false } ) );                                                                // What: Kept Membership. Why: The removal ends the membership. How: This expects a batch that keeps it refused.
	await assertFails( remBatFun( aliStoObj, { accBoo : false } ) );                                                                // What: Kept Account Entry. Why: The removed member's slot frees. How: This expects a batch that keeps it refused.
	await assertFails( remBatFun( aliStoObj, { groObj : { 'removedUids.bob' : deleteField() } } ) );                                // What: Unblocked Removal. Why: A removal always blocks. How: This expects one that leaves Bob off the blocklist refused.
	await assertFails( remBatFun( aliStoObj, { groObj : { currentInviteToken : TOK_ONE_STR }, newBoo : false, oldBoo : false } ) ); // What: Unrotated Removal. Why: A removal always rotates the link. How: This expects one that keeps the token refused.
	await assertFails( remBatFun( aliStoObj, { oldBoo : false } ) );                                                                // What: Kept Old Invite. Why: The old link has to stop working. How: This expects a batch that keeps its invite refused.
	await assertFails( remBatFun( aliStoObj, { newBoo : false } ) );                                                                // What: Missing New Invite. Why: The group always has a working link. How: This expects a batch without the new invite refused.
	await assertFails( remBatFun( aliStoObj, { groObj : { chatTtlDays : 7 } } ) );                                                  // What: Smuggled Setting. Why: A removal changes only the count, blocklist, and token. How: This expects a retention change in the batch refused.
	await assertFails( remBatFun( aliStoObj, { groObj : { 'removedUids.eve' : true } } ) );                                         // What: Double Block. Why: A removal blocks the removed member alone. How: This expects a second UID refused.
	await assertFails( remBatFun( aliStoObj, { groObj : { 'removedUids.bob' : 'yes' } } ) );                                        // What: Wrong Block Value. Why: The blocklist maps each UID to true. How: This expects another value refused.
	await assertFails( remBatFun( aliStoObj, { accBoo : false, memBoo : false } ) );                                                // What: Block Without Removal. Why: The count and blocklist move only as the membership ends. How: This expects a batch that keeps the membership and entry refused.
	await assertFails( remBatFun( accStoFun( 'bob' ), { uidStr : 'alice' } ) );                                                     // What: Member Removing Owner. Why: Only the owner removes. How: This expects Bob refused.
	await assertFails( remBatFun( aliStoObj, { uidStr : 'alice' } ) );                                                              // What: Owner Self-Removal. Why: An owner transfers the group before leaving. How: This expects Alice refused.
	await assertSucceeds( remBatFun( aliStoObj ) );                                                                                 // What: Whole Removal. Why: The batches above failed only for their one part. How: This expects the whole removal allowed.


} );



test( 'the owner rotates the invite on its own, while nobody else rotates it or retires the current link', async () => { // What: Rotation Test. Why: The owner can revoke an over-shared link at any time, leaving exactly one working link (Section 9). How: This tries improper rotations and deletes, then rotates as Alice and tries both links as Carol, checking only the new link works.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol holds the link and hasn't joined. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: A member other than the owner tries to rotate. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'accounts/carol', { memberGroups : {}, ownedGroups : {} } );                                                                // What: Carol Account Seed. Why: Carol may ask to join. How: This writes her empty account.
	await seeDocFun( tesEnvObj, 'users/carol', { createdAt : Timestamp.fromMillis( 1000 ), publicKey : bytFilFun( 65 ) } );                                 // What: Carol Key Seed. Why: A joiner has published a key. How: This writes hers.
	await seeDocFun( tesEnvObj, `invites/${ 'S'.repeat( 22 ) }`, { createdAt : Timestamp.fromMillis( 1000 ), groupId : 'gro1', groupName : GRO_NAM_STR } ); // What: Stale Invite Seed. Why: An invite the group no longer names can be retired. How: This writes one.

	await assertFails( remBatFun( accStoFun( 'bob' ), { uidStr : null } ) );                      // What: Member Rotation. Why: Only the owner rotates. How: This expects Bob refused.
	await assertFails( remBatFun( aliStoObj, { oldBoo : false, uidStr : null } ) );               // What: Kept Old Invite. Why: The old link has to stop working. How: This expects a rotation that keeps it refused.
	await assertFails( remBatFun( aliStoObj, { newBoo : false, uidStr : null } ) );               // What: Missing New Invite. Why: The group always has a working link. How: This expects a rotation without it refused.
	await assertFails( deleteDoc( doc( accStoFun( 'bob' ), `invites/${ 'S'.repeat( 22 ) }` ) ) ); // What: Member Stale Delete. Why: Only the owner retires a link. How: This expects Bob refused.
	await assertSucceeds( deleteDoc( doc( aliStoObj, `invites/${ 'S'.repeat( 22 ) }` ) ) );       // What: Owner Stale Delete. Why: The owner may retire a link the group no longer names. How: This expects Alice allowed.
	await assertFails( deleteDoc( doc( aliStoObj, `invites/${ TOK_ONE_STR }` ) ) );               // What: Current Invite Delete. Why: The link the group names must keep working. How: This expects deleting it alone refused.
	await assertSucceeds( remBatFun( aliStoObj, { uidStr : null } ) );                            // What: Link Rotated. Why: The rotations above failed only for their one part. How: This expects Alice's rotation allowed.
	await assertFails( reqSetFun( carStoObj, 'carol' ) );                                         // What: Old Link Request. Why: The old link stopped working. How: This expects Carol refused with it.
	await assertSucceeds( reqSetFun( carStoObj, 'carol', { inviteToken : NEW_TOK_STR } ) );       // What: New Link Request. Why: The new link opens the group. How: This expects Carol allowed with it.


} );



test( 'the owner offers the group to a member, who accepts it in one batch, becoming owner while the old owner stays a member', async () => { // What: Transfer Test. Why: Ownership moves only when a member agrees to take it (Section 18). How: This offers the group to Bob as Alice and accepts as Bob, then checks who may rotate the invite and that Alice can now leave.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group, then hands it over. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob takes the group over. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: A transfer needs a member to take the group. How: This approves Bob into the group.

	await assertSucceeds( offSetFun( aliStoObj, 'bob' ) );             // What: Offer Made. Why: The owner may offer the group to a member with a free slot. How: This expects Alice's offer allowed.
	await assertSucceeds( takBatFun( bobStoObj, 'bob' ) );             // What: Offer Accepted. Why: The member offered the group may take it. How: This expects Bob's acceptance allowed.
	await assertFails( remBatFun( aliStoObj, { uidStr : null } ) );    // What: Old Owner Rotation. Why: Owner-only actions move with the group. How: This expects Alice's rotation refused.
	await assertSucceeds( remBatFun( bobStoObj, { uidStr : null } ) ); // What: New Owner Rotation. Why: The new owner holds the owner-only actions. How: This expects Bob's rotation allowed.
	await assertSucceeds( lefBatFun( aliStoObj, 'alice' ) );           // What: Old Owner Leave. Why: Once she's handed the group over, Alice is a member like any other. How: This expects her leave allowed.


} );



test( 'an offer comes only from the owner, to another member, stamped with the real time, and changes nothing else', async () => { // What: Offer Test. Why: An offer is the owner's to make, and its time decides when it lapses. How: This tries each improper offer, then makes a valid one, checking which pass.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is a member who isn't the owner. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: An offer needs a member to name. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'accounts/carol', { memberGroups : {}, ownedGroups : {} } ); // What: Outsider Account Seed. Why: Carol has a free slot but isn't a member. How: This writes her empty account.

	await assertFails( offSetFun( bobStoObj, 'bob' ) );                                                            // What: Member Offer. Why: Only the owner offers the group. How: This expects Bob offering it to himself refused.
	await assertFails( offSetFun( aliStoObj, 'carol' ) );                                                          // What: Outsider Offer. Why: Only a member can take the group over. How: This expects an offer to Carol refused.
	await assertFails( offSetFun( aliStoObj, 'alice' ) );                                                          // What: Self Offer. Why: The owner already owns the group. How: This expects Alice offering it to herself refused.
	await assertFails( offSetFun( aliStoObj, 'bob', { pendingOfferedAt : Timestamp.fromMillis( Date.now() ) } ) ); // What: Chosen Offer Time. Why: The offer's time decides when it lapses. How: This expects a time the client picked refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { pendingOwnerUid : 'bob' } ) );                // What: Untimed Offer. Why: Every offer carries its time. How: This expects an offer without one refused.
	await assertFails( offSetFun( aliStoObj, 'bob', { name : 'New Name' } ) );                                     // What: Smuggled Rename. Why: An offer changes only the offer. How: This expects a rename beside it refused.
	await assertSucceeds( offSetFun( aliStoObj, 'bob' ) );                                                         // What: Valid Offer. Why: The offers above failed only for their one fault. How: This expects Alice's offer to Bob allowed.


} );



test( 'an offer to a member with no free owned slot is refused the moment the owner makes it', async () => { // What: Full Slot Offer Test. Why: An offer that could never be accepted would leave the owner thinking the handover was done (Section 18). How: This fills Bob's owned slots, then tries the offer and checks it fails.


	await seeTwoFun(); // What: Two Member Seed Call. Why: An offer needs a member to name. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'accounts/bob', { ownedGroups : groMapFun( 'own', 10 ) }, true ); // What: Full Slot Seed. Why: Bob already owns as many groups as the open cap allows. How: This gives him 10.

	await assertFails( offSetFun( accStoFun( 'alice' ), 'bob' ) ); // What: Full Slot Offer. Why: Bob couldn't accept, so Alice should know now. How: This expects her offer refused.


} );



test( 'only the owner withdraws an offer from the app, since the member offered it declines through a function', async () => { // What: Offer End Test. Why: The owner can call an offer off, and a decline goes through a Cloud Function so the owner is told (Section 18). How: This tries improper ends and a decline written from the app, then a proper withdrawal, and checks it can't be accepted after.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is offered the group. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: An offer needs a member to name. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins as a third member. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol is a member with no part in the offer. How: This approves her as Alice.

	await offSetFun( aliStoObj, 'bob' ); // What: Offer Call. Why: The ends below need a standing offer. How: This offers the group to Bob.

	await assertFails( updateDoc( doc( accStoFun( 'carol' ), 'groups/gro1' ), OFF_END_OBJ ) );                // What: Other Member End. Why: Only the owner ends an offer from the app. How: This expects Carol refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1' ), OFF_END_OBJ ) );                           // What: App Decline. Why: A decline goes through the decline function, which tells the owner. How: This expects Bob clearing the offer himself refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { ...OFF_END_OBJ, name : 'New Name' } ) ); // What: Smuggled Rename. Why: Withdrawing an offer changes only the offer. How: This expects a rename beside it refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { pendingOwnerUid : null } ) );            // What: Half End. Why: A withdrawn offer leaves no time behind. How: This expects clearing the name alone refused.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1' ), OFF_END_OBJ ) );                        // What: Offer Withdrawn. Why: The owner may call an offer off. How: This expects Alice's withdrawal allowed.
	await assertFails( takBatFun( bobStoObj, 'bob' ) );                                                       // What: Withdrawn Accept. Why: A withdrawn offer can't be accepted. How: This expects Bob's acceptance refused.


} );



test( 'an acceptance missing or changing any part is refused, as is one by anyone but the member offered', async () => { // What: Accept Parts Test. Why: The group, both accounts, and the offer have to move together, or slots and ownership would drift apart. How: This changes or leaves out one part at a time, then commits the whole batch, checking each partial batch fails and the whole one passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is offered the group. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: An offer needs a member to name. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins as a third member. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol is a member the group wasn't offered to. How: This approves her as Alice.

	await offSetFun( aliStoObj, 'bob' ); // What: Offer Call. Why: The acceptances below need a standing offer. How: This offers the group to Bob.

	await seeDocFun( tesEnvObj, 'accounts/alice', { 'ownedGroups.gro9' : true }, true ); // What: Second Owned Seed. Why: The double drop needs Alice to own another group. How: This adds one to her owned map.

	await assertFails( takBatFun( accStoFun( 'carol' ), 'carol' ) );                                         // What: Unoffered Accept. Why: Only the member offered the group takes it. How: This expects Carol refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { groObj : null } ) );                                   // What: Kept Owner. Why: The slots move only as the group changes hands. How: This expects a batch that skips the group refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { newBoo : false } ) );                                  // What: Kept New Account. Why: The new owner takes an owned slot. How: This expects a batch that skips Bob's account refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { oldBoo : false } ) );                                  // What: Kept Old Account. Why: The old owner's slot frees. How: This expects a batch that skips Alice's account refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { groObj : { name : 'New Name' } } ) );                  // What: Smuggled Rename. Why: An acceptance changes only the owner and the offer. How: This expects a rename in the batch refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { groObj : { pendingOwnerUid : 'bob' } } ) );            // What: Kept Offer. Why: An accepted offer is used up. How: This expects a batch that leaves it standing refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { newObj : { paid : true } } ) );                        // What: Smuggled Paid Flag. Why: Only the payment webhook sets the paid flag. How: This expects it refused on Bob's account.
	await assertFails( takBatFun( bobStoObj, 'bob', { oldObj : { paid : true } } ) );                        // What: Smuggled Old Paid Flag. Why: Only the payment webhook sets the paid flag. How: This expects it refused on Alice's account.
	await assertFails( takBatFun( bobStoObj, 'bob', { newObj : { 'memberGroups.gro9' : true } } ) );         // What: Extra New Entry. Why: A transfer moves one group. How: This expects another entry on Bob's account refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { oldObj : { 'memberGroups.gro9' : true } } ) );         // What: Extra Old Entry. Why: A transfer moves one group. How: This expects another entry on Alice's account refused.
	await assertFails( takBatFun( accStoFun( 'carol' ), 'bob' ) );                                           // What: Accept For Another. Why: Only the member offered the group agrees to take it. How: This expects Carol accepting on Bob's behalf refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { groObj : { ownerUid : 'carol' } } ) );                 // What: Hand To Another. Why: The group goes to the member who accepts it. How: This expects Bob making Carol owner refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { newObj : { 'ownedGroups.gro9' : true } } ) );          // What: Extra Owned Entry. Why: A transfer moves one group. How: This expects a second owned entry on Bob's account refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { oldObj : { 'ownedGroups.gro9' : deleteField() } } ) ); // What: Double Old Drop. Why: A transfer frees one of Alice's slots. How: This expects her second owned group dropped too refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { newObj : { 'ownedGroups.gro1' : 'owner' } } ) );       // What: New Entry Value. Why: Every entry holds true. How: This expects another value on Bob's account refused.
	await assertFails( takBatFun( bobStoObj, 'bob', { oldObj : { 'memberGroups.gro1' : 'member' } } ) );     // What: Old Entry Value. Why: Every entry holds true. How: This expects another value on Alice's account refused.
	await assertSucceeds( takBatFun( bobStoObj, 'bob' ) );                                                   // What: Whole Acceptance. Why: The batches above failed only for their one part. How: This expects the whole batch allowed.


} );



test( 'an offer is accepted within 7 days, by a member with a free owned slot who is still in the group', async () => { // What: Accept Window Test. Why: A forgotten offer mustn't be taken up long after the owner moved on, nor push anyone over a cap (Section 18). How: This tries an 8-day-old offer, a full slot, and a 6-day-old offer, then has Bob leave before accepting, checking which acceptances pass.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob is offered the group. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: An offer needs a member to name. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'groups/gro1', { pendingOfferedAt : Timestamp.fromMillis( Date.now() - 8 * DAY_MIL_NUM ), pendingOwnerUid : 'bob' }, true ); // What: Lapsed Offer Seed. Why: An offer lapses after 7 days. How: This dates Bob's offer 8 days back.

	await assertFails( takBatFun( bobStoObj, 'bob' ) ); // What: Lapsed Accept. Why: The offer has lapsed. How: This expects Bob's acceptance refused.

	await seeDocFun( tesEnvObj, 'groups/gro1', { pendingOfferedAt : Timestamp.fromMillis( Date.now() - 6 * DAY_MIL_NUM ) }, true ); // What: Live Offer Seed. Why: An offer made 6 days ago still stands. How: This dates it 6 days back.
	await seeDocFun( tesEnvObj, 'accounts/bob', { ownedGroups : groMapFun( 'own', 10 ) }, true );                                   // What: Full Slot Seed. Why: Bob may have filled his slots since the offer. How: This gives him 10 owned groups.

	await assertFails( takBatFun( bobStoObj, 'bob' ) ); // What: Full Slot Accept. Why: Taking the group would put Bob over the own cap. How: This expects his acceptance refused.

	await seeDocFun( tesEnvObj, 'accounts/bob', { ownedGroups : {} }, true ); // What: Slot Freed Seed. Why: The live offer is accepted once Bob has room. How: This empties his owned map.

	await assertSucceeds( takBatFun( bobStoObj, 'bob' ) ); // What: Live Accept. Why: A 6-day-old offer is within the window. How: This expects Bob's acceptance allowed.


} );



test( "a member who left since the offer can't accept it", async () => { // What: Left Accept Test. Why: Only a current member can take the group over. How: This offers the group to Bob, has him leave, then tries to accept.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob is offered the group, then leaves. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: An offer needs a member to name. How: This approves Bob into the group.

	await offSetFun( accStoFun( 'alice' ), 'bob' ); // What: Offer Call. Why: Bob holds an offer as he leaves. How: This offers him the group as Alice.

	await lefBatFun( bobStoObj, 'bob' ); // What: Leave Call. Why: Bob leaves with the offer standing. How: This commits his leave.

	await assertFails( takBatFun( bobStoObj, 'bob' ) ); // What: Left Accept. Why: Bob is no longer a member. How: This expects his acceptance refused.


} );



test( 'nobody deletes a group, and an account owner reads and dismisses only their own notices, which no client writes', async () => { // What: Deletion And Notice Test. Why: Deleting a group runs as a Cloud Function that clears its whole tree and leaves each member a notice, so clients can neither delete groups nor forge notices (Section 9). How: This tries a client delete, then reads, writes, and deletes a seeded notice as its owner and as someone else, checking which the rules allow.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group and isn't the notice's owner. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob owns the notice. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: The delete needs a group, and Bob an account. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'accounts/bob/notices/not1', { createdAt : Timestamp.fromMillis( 1000 ), expireAt : Timestamp.fromMillis( Date.now() + 30 * DAY_MIL_NUM ), groupId : 'gro2', groupName : GRO_NAM_STR, kind : 'groupDeleted' } ); // What: Notice Seed. Why: A Cloud Function would have written it. How: This writes a deleted group's notice for Bob.

	await assertFails( deleteDoc( doc( aliStoObj, 'groups/gro1' ) ) );                                       // What: Client Group Delete. Why: Only the Cloud Function deletes a group, whole. How: This expects even the owner refused.
	await assertSucceeds( getDoc( doc( bobStoObj, 'accounts/bob/notices/not1' ) ) );                         // What: Own Notice Read. Why: Bob sees what happened while he was away. How: This expects his fetch allowed.
	await assertSucceeds( getDocs( collection( bobStoObj, 'accounts/bob/notices' ) ) );                      // What: Own Notice List. Why: The app shows every waiting notice. How: This expects Bob's listing allowed.
	await assertFails( getDoc( doc( aliStoObj, 'accounts/bob/notices/not1' ) ) );                            // What: Other Notice Read. Why: A notice is its owner's alone. How: This expects Alice refused.
	await assertFails( getDocs( collection( aliStoObj, 'accounts/bob/notices' ) ) );                         // What: Other Notice List. Why: A notice is its owner's alone. How: This expects Alice's listing refused.
	await assertFails( setDoc( doc( bobStoObj, 'accounts/bob/notices/not2' ), { kind : 'groupDeleted' } ) ); // What: Own Notice Write. Why: Only Cloud Functions write notices. How: This expects Bob writing one refused.
	await assertFails( setDoc( doc( aliStoObj, 'accounts/bob/notices/not2' ), { kind : 'groupDeleted' } ) ); // What: Forged Notice. Why: A forged notice could tell Bob a group was deleted when it wasn't. How: This expects Alice writing one refused.
	await assertFails( updateDoc( doc( bobStoObj, 'accounts/bob/notices/not1' ), { kind : 'removed' } ) );   // What: Notice Change. Why: A notice says what really happened. How: This expects Bob changing one refused.
	await assertFails( deleteDoc( doc( aliStoObj, 'accounts/bob/notices/not1' ) ) );                         // What: Other Notice Dismiss. Why: Only its owner dismisses a notice. How: This expects Alice refused.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'accounts/bob/notices/not1' ) ) );                      // What: Own Notice Dismiss. Why: Bob dismisses a notice once he's seen it. How: This expects his delete allowed.


} );



test( "the owner renames the group with the invite's copy of the name in the same batch, and sets its chat retention", async () => { // What: Settings Test. Why: The group's settings are the owner's, and the invite screen has to keep showing the real name (Sections 11.2 and 11.6). How: This renames the group as Alice and sets its retention at both ends of its range.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: The settings belong to a group with members. How: This approves Bob into the group.

	await assertSucceeds( setBatFun( aliStoObj, 'Supper Club' ) );                               // What: Rename. Why: The owner may rename the group. How: This expects the group and invite renamed together.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1' ), { chatTtlDays : 7 } ) );   // What: Shortest Retention. Why: Chat is kept at least 7 days. How: This expects 7 allowed without touching the invite.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1' ), { chatTtlDays : 180 } ) ); // What: Longest Retention. Why: Chat is kept at most 180 days. How: This expects 180 allowed.
	await assertSucceeds( getDoc( doc( accStoFun( 'carol' ), `invites/${ TOK_ONE_STR }` ) ) );   // What: Renamed Invite Read. Why: Someone holding the link still opens the invite after a rename. How: This expects Carol's fetch allowed.


} );



test( 'only the owner changes the settings, to a valid name with the invite matching and a retention of 7 to 180 days, changing nothing else', async () => { // What: Settings Parts Test. Why: A forged name could mislead invitees, and the settings mustn't carry other changes along. How: This tries each improper change, then a valid rename, checking which pass.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is a member who isn't the owner. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: A member other than the owner tries to change the settings. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, `invites/${ 'S'.repeat( 22 ) }`, { createdAt : Timestamp.fromMillis( 1000 ), groupId : 'gro1', groupName : GRO_NAM_STR } ); // What: Stale Invite Seed. Why: A retired invite mustn't take the new name. How: This writes one the group no longer names.

	await assertFails( setBatFun( bobStoObj, 'Supper Club' ) );                                                    // What: Member Rename. Why: Only the owner renames the group. How: This expects Bob refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1' ), { chatTtlDays : 90 } ) );                       // What: Member Retention. Why: Only the owner sets the retention. How: This expects Bob refused.
	await assertFails( setBatFun( aliStoObj, 'Supper Club', { invObj : null } ) );                                 // What: Kept Invite Name. Why: The invite has to show the new name. How: This expects a rename that skips the invite refused.
	await assertFails( setBatFun( aliStoObj, 'Supper Club', { invObj : { groupName : 'Other Club' } } ) );         // What: Mismatched Invite Name. Why: The invite can only show the group's real name. How: This expects a different name on it refused.
	await assertFails( updateDoc( doc( aliStoObj, `invites/${ TOK_ONE_STR }` ), { groupName : 'Supper Club' } ) ); // What: Invite Rename Alone. Why: The invite's name follows the group's. How: This expects the invite renamed without the group refused.
	await assertFails( setBatFun( aliStoObj, 'Supper Club', { othStr : 'S'.repeat( 22 ) } ) );                     // What: Stale Invite Beside. Why: A retired invite is deleted, not kept up to date. How: This expects a rename that also renames the retired one refused.
	await assertFails( updateDoc( doc( bobStoObj, `invites/${ TOK_ONE_STR }` ), { groupName : GRO_NAM_STR } ) );   // What: Member Invite Write. Why: Only the owner writes an invite. How: This expects Bob rewriting its unchanged name refused.
	await assertFails( setBatFun( aliStoObj, 'Supper Club', { tokStr : 'S'.repeat( 22 ) } ) );                     // What: Stale Invite Rename. Why: Only the working invite follows a rename. How: This expects the retired one renamed instead refused.
	await assertFails( setBatFun( aliStoObj, 'x'.repeat( 51 ) ) );                                                 // What: Long Name. Why: A group name has at most 50 characters. How: This expects 51 refused.
	await assertFails( setBatFun( aliStoObj, 'Supper Club', { groObj : { memberCount : 9 } } ) );                  // What: Smuggled Count. Why: A change of settings leaves the count alone. How: This expects a count change beside it refused.
	await assertFails( setBatFun( aliStoObj, 'Supper Club', { invObj : { groupId : 'gro2' } } ) );                 // What: Smuggled Invite Group. Why: An invite's group never changes. How: This expects it moved to another group refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { chatTtlDays : 6 } ) );                        // What: Short Retention. Why: Chat is kept at least 7 days. How: This expects 6 refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { chatTtlDays : 181 } ) );                      // What: Long Retention. Why: Chat is kept at most 180 days. How: This expects 181 refused.
	await assertFails( updateDoc( doc( aliStoObj, 'groups/gro1' ), { chatTtlDays : 30.5 } ) );                     // What: Fractional Retention. Why: Retention counts whole days. How: This expects 30.5 refused.
	await assertSucceeds( setBatFun( aliStoObj, 'Supper Club' ) );                                                 // What: Valid Rename. Why: The changes above failed only for their one fault. How: This expects the plain rename allowed.


} );



test( 'any member plans an event, which only members read, and only its creator or the owner edits or cancels it', async () => { // What: Event Test. Why: Events are the group's, and managing one is its creator's or the owner's (Section 11.5). How: This plans events as Bob, then tries reads, edits, and deletes as each person, checking who the rules let through.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob plans the events. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol is a member who didn't plan them. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob plans as a member who isn't the owner. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins as a third member. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol is a member with no part in the events. How: This approves her as Alice.

	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob' ) ) );                   // What: Event Planned. Why: Any member plans an event. How: This expects Bob's event allowed.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/events/eve2' ), eveDatFun( 'bob' ) ) );                   // What: Second Event Planned. Why: The owner's delete needs an event of its own. How: This expects Bob's second event allowed.
	await assertSucceeds( getDoc( doc( carStoObj, 'groups/gro1/events/eve1' ) ) );                                       // What: Member Event Read. Why: Members see the group's events. How: This expects Carol's fetch allowed.
	await assertSucceeds( getDocs( collection( carStoObj, 'groups/gro1/events' ) ) );                                    // What: Member Event List. Why: The app lists the group's events. How: This expects Carol's listing allowed.
	await assertFails( getDoc( doc( accStoFun( 'dave' ), 'groups/gro1/events/eve1' ) ) );                                // What: Outsider Event Read. Why: Events are for members only. How: This expects Dave refused.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/events/eve1' ), { detailsEnc : bytFilFun( 400 ) } ) );    // What: Member Event Edit. Why: Only the creator or owner edits an event. How: This expects Carol refused.
	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), { detailsEnc : bytFilFun( 400 ) } ) ); // What: Creator Event Edit. Why: The creator edits their event. How: This expects Bob allowed.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1/events/eve1' ), { detailsEnc : bytFilFun( 500 ) } ) ); // What: Owner Event Edit. Why: The owner edits any event. How: This expects Alice allowed.
	await assertFails( deleteDoc( doc( carStoObj, 'groups/gro1/events/eve1' ) ) );                                       // What: Member Event Delete. Why: Only the creator or owner cancels an event. How: This expects Carol refused.
	await assertSucceeds( deleteDoc( doc( aliStoObj, 'groups/gro1/events/eve2' ) ) );                                    // What: Owner Event Delete. Why: The owner cancels any event. How: This expects Alice allowed.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ) ) );                                    // What: Creator Event Delete. Why: The creator cancels their event. How: This expects Bob allowed.


} );



test( 'an event keeps its fields, sizes, real times, and creator', async () => { // What: Event Shape Test. Why: Encrypted details can only be checked by size, and the times decide when the event is deleted (Sections 5 and 11.10). How: This plans an event with one fault at a time, then valid ones at the limits, and edits one into a bad shape, checking which pass.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob plans the events. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob plans as a member. How: This approves Bob into the group.

	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'alice' ) ) );                                                                            // What: Other Creator. Why: Nobody plans an event in someone else's name. How: This expects Alice named as creator refused.
	await assertFails( setDoc( doc( accStoFun( 'dave' ), 'groups/gro1/events/eve1' ), eveDatFun( 'dave' ) ) );                                                                   // What: Outsider Event. Why: Only members plan events. How: This expects Dave refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { detailsEnc : bytFilFun( 2149 ) } ) ) );                                          // What: Long Details. Why: The details fit in 2,148 bytes. How: This expects 2,149 refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { detailsEnc : bytFilFun( 16 ) } ) ) );                                            // What: Empty Details. Why: The details hold at least a title past the 16-byte tag. How: This expects 16 bytes refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { detailsEnc : 'Dinner' } ) ) );                                                   // What: Plaintext Details. Why: The details are encrypted bytes. How: This expects text refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { iv : bytFilFun( 11 ) } ) ) );                                                    // What: Short IV. Why: An IV is 12 bytes. How: This expects 11 refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { extra : true } ) ) );                                                            // What: Extra Field. Why: An event holds exactly its six fields. How: This expects a seventh refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { startAt : Timestamp.fromMillis( EVE_END_NUM ) } ) ) );                           // What: Zero Length. Why: An event ends after it starts. How: This expects a start at its end refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { startAt : Timestamp.fromMillis( EVE_END_NUM - 7 * DAY_MIL_NUM - 1 ) } ) ) );     // What: Long Event. Why: An event lasts at most 7 days. How: This expects 7 days and a millisecond refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', eveTimFun( Date.now() - 2000, Date.now() - 1000 ) ) ) );                           // What: Ended Event. Why: An event that's over is kept only for review. How: This expects one that ended a second ago refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', eveTimFun( Date.now() + 366 * DAY_MIL_NUM, Date.now() + 367 * DAY_MIL_NUM ) ) ) ); // What: Distant Event. Why: An event starts at most a year ahead. How: This expects one 366 days out refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { expireAt : Timestamp.fromMillis( EVE_END_NUM + 2 * DAY_MIL_NUM + 1 ) } ) ) );    // What: Late Expiry. Why: An event is deleted exactly 48 hours after it ends. How: This expects a millisecond later refused.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob', { detailsEnc : bytFilFun( 2148 ) } ) ) );                                       // What: Longest Details. Why: The details may fill 2,148 bytes. How: This expects an event at that size allowed.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/events/eve2' ), eveDatFun( 'bob', eveTimFun( EVE_END_NUM - 7 * DAY_MIL_NUM, EVE_END_NUM ) ) ) );                  // What: Longest Event. Why: An event may last 7 days. How: This expects a week-long event allowed.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), { createdByUid : 'alice' } ) );                                                                   // What: Creator Changed. Why: An event's creator never changes. How: This expects handing it to Alice refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), { detailsEnc : bytFilFun( 2149 ) } ) );                                                           // What: Long Details Edit. Why: An edit keeps the details within 2,148 bytes. How: This expects 2,149 refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), { endAt : Timestamp.fromMillis( EVE_END_NUM - DAY_MIL_NUM / 2 ) } ) );                            // What: Unmatched Expiry Edit. Why: A moved end moves the expiry with it. How: This expects an end moved alone refused.


} );



test( 'a creator who left no longer manages their event, while the owner still can', async () => { // What: Left Creator Test. Why: The owner cleans up after a creator who's gone (Section 11.5). How: This has Bob plan an event and leave, then tries edits as Bob and Alice, checking only Alice's passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob plans the event and leaves. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob plans as a member, then leaves. How: This approves Bob into the group.

	await setDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveDatFun( 'bob' ) ); // What: Event Call. Why: Bob's event outlives his membership. How: This plans it as Bob.

	await lefBatFun( bobStoObj, 'bob' ); // What: Leave Call. Why: Bob leaves the group. How: This commits his leave.

	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), { detailsEnc : bytFilFun( 400 ) } ) ); // What: Left Creator Edit. Why: Bob is no longer a member. How: This expects his edit refused.
	await assertFails( deleteDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ) ) );                                    // What: Left Creator Delete. Why: Bob is no longer a member. How: This expects his delete refused.
	await assertSucceeds( deleteDoc( doc( aliStoObj, 'groups/gro1/events/eve1' ) ) );                                 // What: Owner Cleanup. Why: The owner cancels a left member's event. How: This expects Alice allowed.


} );



test( 'any member adds, claims, releases, reassigns, and removes items, each a valid item that expires with its event', async () => { // What: Item Test. Why: Who's bringing what is the whole group's to sort out, while an item keeps its shape and goes with its event (Sections 7 and 11.5). How: This works through an item's life as each member, then tries each improper item, checking which the rules allow.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is a member. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol is a member. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Items move between members. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins as a third member. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol adds and claims items. How: This approves her as Alice.

	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve1', eveDatFun( 'bob' ) ); // What: Event Seed. Why: Items belong to an event. How: This writes Bob's event.

	await assertSucceeds( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), iteDatFun() ) );                                                  // What: Item Added. Why: Any member adds an item. How: This expects Carol's open item allowed.
	await assertSucceeds( updateDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { assignedUid : 'carol' } ) );                                 // What: Item Claimed. Why: Any member claims an item. How: This expects Carol claiming it allowed.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { assignedUid : 'bob' } ) );                                   // What: Item Reassigned. Why: Any member reassigns an item. How: This expects Alice handing it to Bob allowed.
	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { assignedUid : null } ) );                                    // What: Item Released. Why: A claim can be let go. How: This expects Bob releasing it allowed.
	await assertSucceeds( getDocs( collection( bobStoObj, 'groups/gro1/events/eve1/assignments' ) ) );                                                            // What: Member Item List. Why: Members see who's bringing what. How: This expects Bob's listing allowed.
	await assertFails( getDocs( collection( accStoFun( 'dave' ), 'groups/gro1/events/eve1/assignments' ) ) );                                                     // What: Outsider Item List. Why: Items are for members only. How: This expects Dave refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { assignedUid : 'dave' } ) );                                     // What: Outsider Assigned. Why: Items go to members. How: This expects one assigned to Dave refused.
	await assertFails( setDoc( doc( accStoFun( 'dave' ), 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun() ) );                                           // What: Outsider Item. Why: Only members add items. How: This expects Dave refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { assignedUid : 'dave' } ) ) );                           // What: Outsider Assigned At Creation. Why: An item starts open or with a member. How: This expects a new item assigned to Dave refused.
	await assertFails( updateDoc( doc( accStoFun( 'dave' ), 'groups/gro1/events/eve1/assignments/ite1' ), { labelEnc : bytFilFun( 70 ) } ) );                     // What: Outsider Item Edit. Why: Only members change items. How: This expects Dave's relabel refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve9/assignments/ite2' ), iteDatFun() ) );                                                     // What: Eventless Item. Why: An item belongs to a real event. How: This expects one under a missing event refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { labelEnc : bytFilFun( 167 ) } ) ) );                    // What: Long Label. Why: A label fits in 166 bytes. How: This expects 167 refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { labelEnc : bytFilFun( 16 ) } ) ) );                     // What: Empty Label. Why: A label holds text past the 16-byte tag. How: This expects 16 bytes refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { iv : bytFilFun( 13 ) } ) ) );                           // What: Long IV. Why: An IV is 12 bytes. How: This expects 13 refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { expireAt : Timestamp.fromMillis( EVE_END_NUM ) } ) ) ); // What: Early Item Expiry. Why: An item expires with its event. How: This expects a different time refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { extra : true } ) ) );                                   // What: Extra Item Field. Why: An item holds exactly its four fields. How: This expects a fifth refused.
	await assertFails( setDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite2' ), iteDatFun( { assignedUid : 7 } ) ) );                                // What: Numeric Assignee. Why: An assignee is a UID. How: This expects a number refused.
	await assertSucceeds( deleteDoc( doc( carStoObj, 'groups/gro1/events/eve1/assignments/ite1' ) ) );                                                            // What: Item Removed. Why: Any member removes an item. How: This expects Carol's delete allowed.
	await assertFails( deleteDoc( doc( accStoFun( 'dave' ), 'groups/gro1/events/eve1/assignments/ite3' ) ) );                                                     // What: Outsider Item Delete. Why: Only members remove items. How: This expects Dave refused.


} );



test( "a removed member's claim stays until someone changes it, and an event that moves takes its items' expiry with it", async () => { // What: Item Lifetime Test. Why: A claim isn't silently cleared (Section 7), and items have to keep expiring with their event when it's rescheduled. How: This removes Carol with a claim standing, then moves the event with and without its item.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group and removes Carol. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob planned the event. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob stays a member through the removal. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins, claims an item, and is removed. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol holds a claim as she's removed. How: This approves her as Alice.

	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve1', eveDatFun( 'bob' ) );                                      // What: Event Seed. Why: The item belongs to an event. How: This writes Bob's event.
	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve1/assignments/ite1', iteDatFun( { assignedUid : 'carol' } ) ); // What: Claimed Item Seed. Why: Carol's claim outlives her membership. How: This writes an item she claimed.

	await remBatFun( aliStoObj, { uidStr : 'carol' } ); // What: Removal Call. Why: Carol is removed with her claim standing. How: This removes her as Alice.

	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { labelEnc : bytFilFun( 70 ) } ) );                                       // What: Removed Claim Kept. Why: An edit that leaves the claim alone keeps a removed member's claim. How: This expects Bob relabelling it allowed.
	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1' ), eveTimFun( EVE_END_NUM, EVE_END_NUM + DAY_MIL_NUM ) ) );                                   // What: Event Moved. Why: The creator reschedules the event a day later. How: This expects the move allowed, its expiry following its end.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { labelEnc : bytFilFun( 80 ) } ) );                                          // What: Stale Item Expiry. Why: An item still carrying the old expiry is out of step with its event. How: This expects an edit keeping it refused.
	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/events/eve1/assignments/ite1' ), { expireAt : Timestamp.fromMillis( EVE_END_NUM + 3 * DAY_MIL_NUM ) } ) ); // What: Item Expiry Synced. Why: Any member brings an item back in step with its event. How: This expects the item moved to the event's new expiry allowed.


} );



test( 'a member shares their own location for an event, which only members read, and stops sharing by deleting it', async () => { // What: Location Test. Why: Location is shared with the group for one event at a time, and stopping has to take effect at once (Sections 5 and 10). How: This shares and updates Bob's location, tries reads and writes as each person, then deletes it, checking who the rules let through.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member reading Bob's location. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob shares his location. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob shares with a group that has another member. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve1', eveDatFun( 'alice', eveTimFun( Date.now() + 2 * HOU_MIL_NUM, Date.now() + 5 * HOU_MIL_NUM ) ) ); // What: Event Seed. Why: Sharing opens 3 hours before an event, so one starting in 2 hours is open. How: This writes Alice's event.

	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1' ) ) );                                    // What: Sharing Started. Why: A member shares their own location in the event's window. How: This expects Bob's first share allowed.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { locationEnc : bytFilFun( 70 ) } ) ) ); // What: Location Updated. Why: Each update overwrites the last position. How: This expects Bob's update allowed.
	await assertSucceeds( getDoc( doc( aliStoObj, 'groups/gro1/liveLocations/bob' ) ) );                                                         // What: Member Location Read. Why: Members see where everyone sharing is. How: This expects Alice's fetch allowed.
	await assertSucceeds( getDocs( collection( aliStoObj, 'groups/gro1/liveLocations' ) ) );                                                     // What: Member Location List. Why: The map shows everyone sharing. How: This expects Alice's listing allowed.
	await assertFails( getDoc( doc( accStoFun( 'dave' ), 'groups/gro1/liveLocations/bob' ) ) );                                                  // What: Outsider Location Read. Why: Locations are for the group only. How: This expects Dave refused.
	await assertFails( setDoc( doc( aliStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1' ) ) );                                       // What: Other Member's Location. Why: Nobody shares a location in someone else's name. How: This expects Alice writing Bob's refused.
	await assertFails( deleteDoc( doc( aliStoObj, 'groups/gro1/liveLocations/bob' ) ) );                                                         // What: Other Member's Stop. Why: Only the sharer stops sharing. How: This expects Alice deleting Bob's refused.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ) ) );                                                      // What: Sharing Stopped. Why: Stopping deletes the location at once. How: This expects Bob's delete allowed.


} );



test( 'a shared location keeps its fields and sizes, a real update time, its event window, and an expiry within an hour and before the event ends', async () => { // What: Location Shape Test. Why: An encrypted position can only be checked by size, and its times decide how long anyone sees it (Section 5). How: This shares with one fault at a time across events open, not yet open, ended, and about to end, then valid shares at the limits, checking which pass.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob shares his location. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob shares as a member. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve1', eveDatFun( 'alice', eveTimFun( Date.now() + 2 * HOU_MIL_NUM, Date.now() + 5 * HOU_MIL_NUM ) ) ); // What: Open Event Seed. Why: An event starting in 2 hours is open for sharing. How: This writes it.
	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve2', eveDatFun( 'alice', eveTimFun( Date.now() + 4 * HOU_MIL_NUM, Date.now() + 6 * HOU_MIL_NUM ) ) ); // What: Early Event Seed. Why: An event starting in 4 hours isn't open yet. How: This writes it.
	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve3', eveDatFun( 'alice', eveTimFun( Date.now() - 3 * HOU_MIL_NUM, Date.now() - HOU_MIL_NUM ) ) );     // What: Ended Event Seed. Why: Sharing ends with the event. How: This writes one that ended an hour ago.
	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve4', eveDatFun( 'alice', eveTimFun( Date.now() - HOU_MIL_NUM, Date.now() + HOU_MIL_NUM / 2 ) ) );     // What: Ending Event Seed. Why: A share expires at the event's end when that's sooner than an hour. How: This writes one ending in half an hour.

	await assertFails( setDoc( doc( accStoFun( 'dave' ), 'groups/gro1/liveLocations/dave' ), locDatFun( 'eve1' ) ) );                                                                      // What: Outsider Share. Why: Only members share with the group. How: This expects Dave refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve9' ) ) );                                                                                 // What: Eventless Share. Why: A share is for a real event. How: This expects one naming a missing event refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve2' ) ) );                                                                                 // What: Early Share. Why: Sharing opens 3 hours before an event. How: This expects a share 4 hours ahead refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve3' ) ) );                                                                                 // What: Late Share. Why: Sharing ends with the event. How: This expects a share after the end refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve4' ) ) );                                                                                 // What: Expiry Past End. Why: A share expires by the event's end. How: This expects an hour's expiry on an event ending sooner refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { expireAt : Timestamp.fromMillis( Date.now() + 70 * 60000 ) } ) ) );                 // What: Long Expiry. Why: A share expires within an hour of its update, plus the clock allowance. How: This expects 70 minutes refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { expireAt : Timestamp.fromMillis( Date.now() - 60000 ) } ) ) );                      // What: Expired Share. Why: A share already past its expiry isn't written. How: This expects an expiry a minute ago refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { updatedAt : Timestamp.fromMillis( Date.now() ) } ) ) );                             // What: Chosen Update Time. Why: The staleness label has to be real. How: This expects a time the phone picked refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { locationEnc : bytFilFun( 129 ) } ) ) );                                             // What: Long Location. Why: A position fits in 128 bytes. How: This expects 129 refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { locationEnc : bytFilFun( 16 ) } ) ) );                                              // What: Empty Location. Why: A position holds data past the 16-byte tag. How: This expects 16 bytes refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { iv : bytFilFun( 11 ) } ) ) );                                                       // What: Short IV. Why: An IV is 12 bytes. How: This expects 11 refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { extra : true } ) ) );                                                               // What: Extra Field. Why: A shared location holds exactly its five fields. How: This expects a sixth refused.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve4', { expireAt : Timestamp.fromMillis( Date.now() + HOU_MIL_NUM / 2 - 60000 ) } ) ) ); // What: Expiry Before End. Why: A share on an event ending soon expires by its end. How: This expects an expiry just before the end allowed.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1', { locationEnc : bytFilFun( 128 ) } ) ) );                                          // What: Longest Location. Why: A position may fill 128 bytes. How: This expects 128 allowed.


} );



test( "a member who left can't keep sharing but can still delete their location", async () => { // What: Left Sharer Test. Why: Leaving the group ends sharing, and a person can always take their own location down. How: This has Bob share, leave, then try an update and a delete.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob shares, then leaves. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob shares as a member, then leaves. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'groups/gro1/events/eve1', eveDatFun( 'alice', eveTimFun( Date.now() + 2 * HOU_MIL_NUM, Date.now() + 5 * HOU_MIL_NUM ) ) ); // What: Event Seed. Why: Bob shares for an open event. How: This writes Alice's event.

	await setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1' ) ); // What: Share Call. Why: Bob's location outlives his membership. How: This shares it as Bob.

	await lefBatFun( bobStoObj, 'bob' ); // What: Leave Call. Why: Bob leaves the group. How: This commits his leave.

	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ), locDatFun( 'eve1' ) ) ); // What: Left Sharer Update. Why: Bob is no longer a member. How: This expects his update refused.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/liveLocations/bob' ) ) );                // What: Left Sharer Delete. Why: A person can always take their own location down. How: This expects his delete allowed.


} );



test( 'a member asks once for chat history, which members read, and another member claims, releases, and fulfils it', async () => { // What: History Test. Why: Any member can help another get chat history back, one claimant at a time (Section 11.9). How: This files a recovery as Bob, then claims, releases, reclaims, and fulfils it as the others, checking each step passes.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice claims and then releases the request. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob asks for history. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol claims the request after Alice. How: This acts as her.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob asks as a member. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins as a third member. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol is a second member able to help. How: This approves her as Alice.

	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery' ) ) );                      // What: Request Filed. Why: A member asks for their history back. How: This expects Bob's recovery allowed.
	await assertSucceeds( getDocs( collection( carStoObj, 'groups/gro1/historyRequests' ) ) );                                                  // What: Member Request List. Why: Members see who needs history. How: This expects Carol's listing allowed.
	await assertFails( getDoc( doc( accStoFun( 'dave' ), 'groups/gro1/historyRequests/bob' ) ) );                                               // What: Outsider Request Read. Why: Requests are for the group only. How: This expects Dave refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'bob' } ) );            // What: Self Claim. Why: The asker is the one missing the history. How: This expects Bob claiming his own refused.
	await assertFails( updateDoc( doc( accStoFun( 'dave' ), 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'dave' } ) ); // What: Outsider Claim. Why: Only members hold the group's history. How: This expects Dave's claim refused.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'alice' } ) );       // What: Request Claimed. Why: Any other member claims a pending request. How: This expects Alice's claim allowed.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'carol' } ) );          // What: Second Claim. Why: One claimant at a time keeps one upload per request. How: This expects Carol claiming a claimed request refused.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), HIS_REL_OBJ ) );                                         // What: Early Release. Why: Another member frees a claim only once it has stalled. How: This expects Carol releasing a fresh claim refused.
	await assertSucceeds( updateDoc( doc( aliStoObj, 'groups/gro1/historyRequests/bob' ), HIS_REL_OBJ ) );                                      // What: Claim Released. Why: The claimant may let the claim go at any time. How: This expects Alice's release allowed.
	await assertSucceeds( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'carol' } ) );       // What: Request Reclaimed. Why: A released request can be claimed again. How: This expects Carol's claim allowed.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { status : 'fulfilled' } ) );                            // What: Claimant Fulfils. Why: Only the asker knows the history arrived. How: This expects Carol marking it fulfilled refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), { status : 'done' } ) );                                 // What: Unknown Status. Why: A request is pending, claimed, or fulfilled. How: This expects another status refused.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), { kind : 'backlog', status : 'fulfilled' } ) );          // What: Smuggled Fulfil Kind. Why: Fulfilling changes only the status. How: This expects a kind change beside it refused.
	await assertSucceeds( updateDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), { status : 'fulfilled' } ) );                         // What: Request Fulfilled. Why: The asker marks it done once they have the history. How: This expects Bob's update allowed.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), HIS_REL_OBJ ) );                                         // What: Fulfilled Reopened. Why: A fulfilled request is done, and reopening it would notify the group again. How: This expects Carol releasing it refused.
	await assertFails( deleteDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ) ) );                                                      // What: Other Member Delete. Why: Only the asker clears a request. How: This expects Carol refused.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ) ) );                                                   // What: Request Cleared. Why: The asker clears the request once it's done. How: This expects Bob's delete allowed.


} );



test( 'a history request is filed only by a member in their own name, starting pending, with a real time, a 7 to 14 day expiry, and a range that fits its kind', async () => { // What: History Shape Test. Why: Each request notifies the whole group, and a backlog's range decides how much older chat a newcomer is shown (Section 11.9). How: This files a request with one fault at a time, then valid ones, checking which pass.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Store Object. Why: Bob asks for history. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob asks as a member who joined after the group began. How: This approves Bob into the group.

	await assertFails( setDoc( doc( accStoFun( 'alice' ), 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery' ) ) );                                                            // What: Request For Another. Why: Nobody asks in someone else's name. How: This expects Alice filing Bob's refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'alice', 'recovery' ) ) );                                                                     // What: Other Asker Named. Why: A request names the member it belongs to. How: This expects Bob's request naming Alice refused.
	await assertFails( setDoc( doc( accStoFun( 'dave' ), 'groups/gro1/historyRequests/dave' ), hisDatFun( 'dave', 'recovery' ) ) );                                                           // What: Outsider Request. Why: Only members have history to ask for. How: This expects Dave refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { status : 'claimed' } ) ) );                                               // What: Claimed Start. Why: A request starts pending. How: This expects one filed as claimed refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { claimedByUid : 'alice' } ) ) );                                           // What: Claimant At Start. Why: Nobody has claimed a new request. How: This expects one naming a claimant refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { createdAt : Timestamp.fromMillis( 1000 ) } ) ) );                         // What: Backdated Request. Why: The creation time has to be the server's. How: This expects a chosen time refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { expireAt : Timestamp.fromMillis( Date.now() + 6 * DAY_MIL_NUM ) } ) ) );  // What: Short Expiry. Why: A request stays up at least 7 days. How: This expects 6 refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { expireAt : Timestamp.fromMillis( Date.now() + 15 * DAY_MIL_NUM ) } ) ) ); // What: Long Expiry. Why: A request disappears within 14 days. How: This expects 15 refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'everything' ) ) );                                                                     // What: Unknown Kind. Why: A request is a recovery or a backlog. How: This expects another kind refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { rangeStart : Timestamp.fromMillis( 5000 ) } ) ) );                        // What: Ranged Recovery. Why: A recovery's range is implied by the asker's join. How: This expects one with a range start refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'backlog' ) ) );                                                                        // What: Unranged Backlog. Why: A backlog says how far back it asks. How: This expects one without a range start refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'backlog', { rangeStart : Timestamp.fromMillis( 500 ) } ) ) );                          // What: Backlog Before Group. Why: No chat exists from before the group. How: This expects a range start before its creation refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'backlog', { rangeStart : Timestamp.fromMillis( Date.now() + DAY_MIL_NUM ) } ) ) );     // What: Backlog After Join. Why: A backlog asks for what came before the asker joined. How: This expects a range start after their join refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'recovery', { extra : true } ) ) );                                                     // What: Extra Field. Why: A request holds exactly its eight fields. How: This expects a ninth refused.
	await assertSucceeds( setDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), hisDatFun( 'bob', 'backlog', { rangeStart : Timestamp.fromMillis( 5000 ) } ) ) );                      // What: Valid Backlog. Why: The requests above failed only for their one fault. How: This expects a backlog starting after the group's creation allowed.


} );



test( 'a stalled claim frees after 30 minutes, nobody claims in another name or for an asker who left, and only a claimed request is fulfilled', async () => { // What: History Claim Test. Why: A request mustn't get stuck behind one claimant, and history goes only to someone still in the group (Section 11.9). How: This seeds requests in each state, then tries each claim, release, and fulfilment, checking which the rules allow.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is a member who tries the claims. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob asks for history. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Store Object. Why: Carol frees a stalled claim. How: This acts as her.

	const bacClaObj = { // What: Backdated Claim Object. Why: A claim's time decides when it stalls, so a chosen one is tried. How: This is a claim by Carol dated 31 minutes back.


		claimedAt    : Timestamp.fromMillis( Date.now() - 31 * 60000 ),
		claimedByUid : 'carol',
		status       : 'claimed'


	};

	const staClaObj = { // What: Stalled Claim Object. Why: The seeded request carries a claim made 31 minutes ago. How: This is Alice's claim at that time, on a request filed long before.


		claimedAt    : Timestamp.fromMillis( Date.now() - 31 * 60000 ),
		claimedByUid : 'alice',
		createdAt    : Timestamp.fromMillis( 1000 ),
		status       : 'claimed'


	};


	await seeTwoFun(); // What: Two Member Seed Call. Why: Bob asks as a member. How: This approves Bob into the group.

	await seeReqFun( tesEnvObj, 'carol' ); // What: Carol Request Seed. Why: Carol joins as a third member. How: This seeds her pending request.

	await appBatFun( aliStoObj, 'carol' ); // What: Carol Approval Call. Why: Carol is a member able to free a claim. How: This approves her as Alice.

	await seeDocFun( tesEnvObj, 'groups/gro1/historyRequests/bob', hisDatFun( 'bob', 'recovery', staClaObj ) ); // What: Stalled Claim Seed. Why: A claim made 31 minutes ago has stalled. How: This writes Bob's request claimed by Alice then.

	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), { status : 'pending' } ) );                                       // What: Half Release. Why: A released request carries no claim. How: This expects the status changed alone refused.
	await assertFails( updateDoc( doc( accStoFun( 'dave' ), 'groups/gro1/historyRequests/bob' ), HIS_REL_OBJ ) );                                        // What: Outsider Release. Why: Only members free a stalled claim. How: This expects Dave refused.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_REL_OBJ, kind : 'backlog' } ) );                         // What: Smuggled Release Kind. Why: A release changes only the claim. How: This expects a kind change beside it refused.
	await assertSucceeds( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), HIS_REL_OBJ ) );                                               // What: Stalled Claim Freed. Why: Any member frees a claim after 30 minutes. How: This expects Carol's release allowed.
	await assertFails( updateDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ), { status : 'fulfilled' } ) );                                     // What: Pending Fulfilled. Why: Only a claimed request has been answered. How: This expects Bob fulfilling a pending one refused.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'alice' } ) );                   // What: Claim For Another. Why: Nobody claims in someone else's name. How: This expects Carol claiming as Alice refused.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), bacClaObj ) );                                                    // What: Backdated Claim. Why: A claim's time decides when it stalls. How: This expects a chosen time refused.
	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'carol', kind : 'backlog' } ) ); // What: Smuggled Kind. Why: A claim changes only the claim. How: This expects a kind change beside it refused.

	await lefBatFun( bobStoObj, 'bob' ); // What: Leave Call. Why: Bob leaves with his request still pending. How: This commits his leave.

	await assertFails( updateDoc( doc( carStoObj, 'groups/gro1/historyRequests/bob' ), { ...HIS_CLA_OBJ, claimedByUid : 'carol' } ) ); // What: Claim For Leaver. Why: History goes only to someone still in the group. How: This expects Carol claiming Bob's request refused.
	await assertSucceeds( deleteDoc( doc( bobStoObj, 'groups/gro1/historyRequests/bob' ) ) );                                          // What: Leaver Clears Request. Why: The asker can always withdraw their own request. How: This expects Bob's delete allowed.


} );



test( "a group's claim record is closed to its members, owner included", async () => { // What: Claim Record Test. Why: Only Cloud Functions track who passed on claiming an absent owner's group, so nobody learns who turned it down (Section 18). How: This seeds a record and tries to read, write, and delete it as the owner and a member.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice owns the group. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Store Object. Why: Bob is a member. How: This acts as him.


	await seeTwoFun(); // What: Two Member Seed Call. Why: The record belongs to a real group with members. How: This approves Bob into the group.

	await seeDocFun( tesEnvObj, 'groups/gro1/ownerClaim/current', { exhaustedAt : null, offeredUid : 'bob', passedUids : {} } ); // What: Claim Record Seed. Why: Only the daily run writes the record. How: This writes one with the rules off.

	await assertFails( getDoc( doc( aliStoObj, 'groups/gro1/ownerClaim/current' ) ) );                        // What: Owner Read. Why: The owner doesn't see who passed. How: This expects Alice's read refused.
	await assertFails( getDoc( doc( bobStoObj, 'groups/gro1/ownerClaim/current' ) ) );                        // What: Member Read. Why: Members don't see who passed. How: This expects Bob's read refused.
	await assertFails( setDoc( doc( bobStoObj, 'groups/gro1/ownerClaim/current' ), { offeredUid : null } ) ); // What: Member Write. Why: Nobody steers a claim. How: This expects Bob's write refused.
	await assertFails( deleteDoc( doc( aliStoObj, 'groups/gro1/ownerClaim/current' ) ) );                     // What: Owner Delete. Why: The run ends a claim itself when the owner returns. How: This expects Alice's delete refused.


} );



test( 'a document no rule covers is refused', async () => { // What: Uncovered Document Test. Why: Firestore must refuse anything no rule allows. How: This reads and writes a document in a collection no rule names, as a signed-in identity, checking both fail.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Store Object. Why: Alice is an ordinary signed-in identity. How: This acts as her.


	await assertFails( getDoc( doc( aliStoObj, 'misc/doc1' ) ) );                     // What: Uncovered Read. Why: No rule allows it. How: This expects the read refused.
	await assertFails( setDoc( doc( aliStoObj, 'misc/doc1' ), { startAt : 1000 } ) ); // What: Uncovered Write. Why: No rule allows it. How: This expects the write refused.


} );

// #endregion Module Init


