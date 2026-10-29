


// #region Imports

import { assertFails               } from '@firebase/rules-unit-testing'; // What: Assert Fails. Why: Forbidden reads and writes must be refused. How: This expects a request to be denied.
import { assertSucceeds            } from '@firebase/rules-unit-testing'; // What: Assert Succeeds. Why: An allowed request must go through. How: This expects it to succeed.
import { get                       } from 'firebase/database';            // What: Get. Why: Read rules are checked. How: This reads a location or a query once.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The rules run in the local emulator. How: This connects to it with the project's rules.
import { orderByChild              } from 'firebase/database';            // What: Order By Child. Why: Chat is read in send order from the reader's join. How: This orders a query by a child's value.
import { query                     } from 'firebase/database';            // What: Query. Why: Chat is read only through a query starting at the reader's join. How: This builds one.
import { readFileSync              } from 'node:fs';                      // What: Read File Sync. Why: The emulator is given the real rules file. How: This reads it.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Every request names a location. How: This builds a reference.
import { remove                    } from 'firebase/database';            // What: Remove. Why: Deletion rules are checked. How: This deletes a location.
import { serverTimestamp           } from 'firebase/database';            // What: Server Timestamp. Why: A message's send time has to be the server's own. How: This asks the server to fill it in.
import { set                       } from 'firebase/database';            // What: Set. Why: Write rules are checked. How: This writes a location.
import { startAt                   } from 'firebase/database';            // What: Start At. Why: A chat query starts at the reader's join. How: This sets where a query begins.
import { test                      } from '@playwright/test';             // What: Test. Why: Each rule is its own test. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through one. How: This types it.

// #endregion Imports



/**
 * database.spec.ts = Realtime Database Rules Spec
 *
 * @summary
 * Checks database.rules.json in the local Firebase Emulator, which npm run
 * test:rules starts and stops around this suite, under a demo project that can
 * never reach a real one. Each test acts as a chosen identity, or as nobody
 * signed in, and expects its requests allowed or refused: chat messages sent,
 * read starting at the reader's join, and cleared once delivered or past the
 * group's retention, and members' presence.
 *
 * The rules read a mirror of each group's members and chat retention, which a
 * Cloud Function keeps in step with Firestore, so the tests seed that mirror
 * directly with the rules off.
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

const ALI_JOI_NUM = 1000;                       // What: Alice Join Number. Why: Alice founded the group, so her chat starts first. How: This is her join time in milliseconds.
const BOB_JOI_NUM = 5000;                       // What: Bob Join Number. Why: Bob joined later, so older chat is closed to him. How: This is his join time in milliseconds.
const DAY_MIL_NUM = 86400000;                   // What: Day Milliseconds Number. Why: Chat retention is counted in days. How: This is one day in milliseconds.
const MSG_ONE_STR = 'chats/gro1/messages/msg1'; // What: Message One String. Why: Most tests send or clear one message. How: This is its path.
const MSG_PAT_STR = 'chats/gro1/messages';      // What: Message Path String. Why: Chat is read as a query over the group's messages. How: This is their path.

// #endregion Constants



// #region Module State

const RUL_TEX_STR = readFileSync( 'database.rules.json', 'utf8' ); // What: Rules Text String. Why: The emulator loads the real rules. How: This reads the file once.



let dbsEnvObj : RulesTestEnvironment; // What: Database Environment Object. Why: Every test reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const accDbsFun = ( uidValStr : string ) => dbsEnvObj.authenticatedContext( uidValStr ).database(); // What: Account Database Function. Why: Each test acts as a chosen identity. How: This returns the database as that identity sees it.



// #region seeDbsFun

/**
 * seeDbsFun = Seed Database Function
 *
 * @summary
 * Writes a location with the rules turned off, so a test can start from a
 * state only a Cloud Function or the passing of time could reach, such as
 * the members mirror or an old message.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The location's path.
 * @param datValAny - Data Value Any: The value to write.
 *
 * @returns A promise that settles once the value is written, with no value.
 *
 * @example
 * ```ts
 * seeDbsFun('mirrors/gro1/chatTtlDays', 30) // => Promise<void>
 * ```
 *
*/

const seeDbsFun = ( patValStr : string, datValAny : unknown ) => dbsEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => set( ref( cotAdmObj.database(), patValStr ), datValAny ) ); // What: Seed Database Function. Why: Tests start from states only the server could write. How: This writes the value with the rules off.

// #endregion seeDbsFun



// #region seeMirFun

/**
 * seeMirFun = Seed Mirror Function
 *
 * @summary
 * Writes the gro1 mirror the Cloud Function keeps: Alice and Bob as members,
 * each under their join time, and a 30-day chat retention.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once the mirror is written, with no value.
 *
 * @example
 * ```ts
 * seeMirFun() // => Promise<void>
 * ```
 *
*/

const seeMirFun = () => seeDbsFun( 'mirrors/gro1', { chatTtlDays : 30, members : { alice : ALI_JOI_NUM, bob : BOB_JOI_NUM } } ); // What: Seed Mirror Function. Why: Every chat and presence rule reads the mirror. How: This writes the group's two members and its retention.

// #endregion seeMirFun



// #region msgDatFun

/**
 * msgDatFun = Message Data Function
 *
 * @summary
 * Builds a valid chat message: base64 ciphertext and a 16-character IV, the
 * sender's UID, the server's time, and who it's still waiting on. Fields can
 * be changed or added by an option.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param senUidStr - Sender UID String: Who sends the message.
 * @param waiMapObj - Waiting Map Object: The members it waits on, each true.
 * @param msgChaObj - Message Change Object: Fields to change or add, empty
 *                    by default.
 *
 * @returns The message's fields.
 *
 * @example
 * ```ts
 * msgDatFun('bob', { alice : true }) // => { senderUid : 'bob', ... }
 * ```
 *
*/

const msgDatFun = ( senUidStr : string, waiMapObj : Record< string, unknown >, msgChaObj : Record< string, unknown > = {} ) => ({ // What: Message Data Function. Why: Every message test starts from a valid message. How: This returns its fields with the test's changes.


	ciphertext : 'A'.repeat( 40 ),
	iv         : 'A'.repeat( 16 ),
	senderUid  : senUidStr,
	sentAt     : serverTimestamp(),
	waitingOn  : waiMapObj,

	...msgChaObj // What: Message Change Spread. Why: A test changes the fields it checks. How: This merges them over the defaults.


});

// #endregion msgDatFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects with the real rules.


	dbsEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every test reaches the emulator through it. How: This connects to the emulator's Realtime Database under the demo project.


		database  : { host : '127.0.0.1', port : 8210, rules : RUL_TEX_STR }, // What: Database Options. Why: The emulator has to check the real rules. How: This names its address, the port firebase.json gives it, and the rules text.
		projectId : 'demo-come-hang'                                          // What: Project Identifier. Why: A demo project can never reach a real one. How: This names it, matching the project test:rules starts.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await dbsEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from an empty database. How: This clears it.


	await dbsEnvObj.clearDatabase(); // What: Clear Call. Why: No test sees another's data. How: This clears the database.


} );



test( 'a member sends a message, members read chat starting at their own join, and each member clears their own wait before anyone deletes it', async () => { // What: Chat Test. Why: Chat is for members, starting when they joined, and a message is deleted once everyone it waits on has it (Sections 5 and 11.7). How: This sends a message as Bob, tries reads as each person, then clears Alice's wait and deletes it.


	const aliDbsObj = accDbsFun( 'alice' ); // What: Alice Database Object. Why: Alice receives the message. How: This acts as her.
	const bobDbsObj = accDbsFun( 'bob' );   // What: Bob Database Object. Why: Bob sends it. How: This acts as him.


	await seeMirFun(); // What: Mirror Seed Call. Why: The rules read the group's members. How: This writes the mirror.

	await assertSucceeds( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true } ) ) );                      // What: Message Sent. Why: A member sends to the group. How: This expects Bob's message, waiting on Alice, allowed.
	await assertSucceeds( get( query( ref( aliDbsObj, MSG_PAT_STR ), orderByChild( 'sentAt' ), startAt( ALI_JOI_NUM ) ) ) ); // What: Chat From Join. Why: A member reads chat starting at their join. How: This expects Alice's query starting there allowed.
	await assertSucceeds( get( query( ref( bobDbsObj, MSG_PAT_STR ), orderByChild( 'sentAt' ), startAt( BOB_JOI_NUM ) ) ) ); // What: Later Chat From Join. Why: A later member reads starting at their own join. How: This expects Bob's query starting there allowed.
	await assertFails( get( query( ref( bobDbsObj, MSG_PAT_STR ), orderByChild( 'sentAt' ), startAt( ALI_JOI_NUM ) ) ) );    // What: Chat Before Join. Why: Older chat comes only through a history request (Section 11.9). How: This expects Bob's query starting before his join refused.
	await assertFails( get( ref( aliDbsObj, MSG_PAT_STR ) ) );                                                               // What: Unbounded Read. Why: Every read has to start exactly at the reader's join. How: This expects reading the whole list refused.
	await assertFails( get( ref( aliDbsObj, MSG_ONE_STR ) ) );                                                               // What: Single Message Read. Why: A message is read through the chat query alone. How: This expects fetching one by key refused.
	await assertFails( get( query( ref( accDbsFun( 'dave' ), MSG_PAT_STR ), orderByChild( 'sentAt' ), startAt( 0 ) ) ) );    // What: Outsider Read. Why: Chat is for members only. How: This expects Dave refused.
	await assertFails( set( ref( aliDbsObj, `${ MSG_ONE_STR }/ciphertext` ), 'B'.repeat( 40 ) ) );                           // What: Message Edit. Why: A sent message never changes. How: This expects Alice rewriting it refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true } ) ) );                         // What: Own Message Rewrite. Why: A sent message never changes, even for its sender. How: This expects Bob sending it again over itself refused.
	await assertFails( remove( ref( bobDbsObj, MSG_ONE_STR ) ) );                                                            // What: Early Delete. Why: A message stays until everyone it waits on has it. How: This expects Bob deleting it while it waits on Alice refused.
	await assertFails( remove( ref( bobDbsObj, `${ MSG_ONE_STR }/waitingOn/alice` ) ) );                                     // What: Other Wait Cleared. Why: Only the member it waits on says they have it. How: This expects Bob clearing Alice's wait refused.
	await assertSucceeds( remove( ref( aliDbsObj, `${ MSG_ONE_STR }/waitingOn/alice` ) ) );                                  // What: Own Wait Cleared. Why: Each member clears their own wait on receiving it. How: This expects Alice's clear allowed.
	await assertFails( set( ref( aliDbsObj, `${ MSG_ONE_STR }/waitingOn/alice` ), true ) );                                  // What: Wait Restored. Why: Putting a wait back would hold the message up forever. How: This expects Alice re-adding her own refused.
	await assertFails( set( ref( aliDbsObj, MSG_ONE_STR ), msgDatFun( 'alice', { bob : true } ) ) );                         // What: Delivered Rewrite. Why: A message nobody waits on may be deleted, never replaced. How: This expects Alice writing over it refused.
	await assertFails( remove( ref( accDbsFun( 'dave' ), MSG_ONE_STR ) ) );                                                  // What: Outsider Delete. Why: Only members clear chat. How: This expects Dave refused.
	await assertSucceeds( remove( ref( bobDbsObj, MSG_ONE_STR ) ) );                                                         // What: Delivered Delete. Why: A message nobody waits on is deleted. How: This expects Bob's delete allowed.


} );



test( 'a message is sent only by a member in their own name, at the server time, waiting only on members, with sized base64 content and nothing else', async () => { // What: Message Shape Test. Why: Encrypted content can only be checked by size and form, and its time and waiting list decide when it's deleted (Section 11.7). How: This sends a message with one fault at a time, then one at the size limit, checking each fault fails and the limit passes.


	const bobDbsObj = accDbsFun( 'bob' ); // What: Bob Database Object. Why: Bob sends the messages. How: This acts as him.


	await seeMirFun(); // What: Mirror Seed Call. Why: The rules read the group's members. How: This writes the mirror.

	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'alice', { alice : true } ) ) );                                           // What: Other Sender. Why: Nobody sends in someone else's name. How: This expects Bob sending as Alice refused.
	await assertFails( set( ref( accDbsFun( 'dave' ), MSG_ONE_STR ), msgDatFun( 'dave', { alice : true } ) ) );                                  // What: Outsider Message. Why: Only members send to the group. How: This expects Dave refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { sentAt : 9000 } ) ) );                          // What: Chosen Send Time. Why: The send time orders chat and starts its retention. How: This expects a time the phone picked refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { dave : true } ) ) );                                              // What: Outsider Waited On. Why: A message waits only on members. How: This expects one waiting on Dave refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : 'yes' } ) ) );                                            // What: Wait Value. Why: Every waiting entry holds true. How: This expects another value refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { ciphertext : 'A'.repeat( 8028 ) } ) ) );        // What: Long Message. Why: A message has at most 2,000 characters, 8,024 base64 characters once encrypted. How: This expects 8,028 refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { ciphertext : 'A'.repeat( 20 ) } ) ) );          // What: Short Message. Why: A message holds at least the 16-byte tag. How: This expects 20 characters refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { ciphertext : `<${ 'A'.repeat( 38 ) }>` } ) ) ); // What: Non-Base64 Message. Why: Ciphertext is stored as base64 text. How: This expects other characters refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { iv : 'A'.repeat( 15 ) } ) ) );                  // What: Short IV. Why: A 12-byte IV is 16 base64 characters. How: This expects 15 refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { iv : `<${ 'A'.repeat( 14 ) }>` } ) ) );         // What: Non-Base64 IV. Why: An IV is stored as base64 text. How: This expects other characters refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { iv : 1234567890123456 } ) ) );                  // What: Number IV. Why: An IV is text, never a number. How: This expects a number refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { ciphertext : 123456789012345678901234 } ) ) );  // What: Number Message. Why: Ciphertext is text, never a number. How: This expects a number refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { extra : true } ) ) );                           // What: Extra Field. Why: A message holds only its own fields. How: This expects another one refused.
	await assertFails( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { iv : null } ) ) );                              // What: Missing IV. Why: Every message carries its IV. How: This expects one without it refused.
	await assertSucceeds( set( ref( bobDbsObj, MSG_ONE_STR ), msgDatFun( 'bob', { alice : true }, { ciphertext : 'A'.repeat( 8024 ) } ) ) );     // What: Longest Message. Why: A message may fill 8,024 characters. How: This expects one at the limit allowed.


} );



test( "any member clears a departed member's wait, and a message past the group's retention is deleted even while it still waits", async () => { // What: Chat Cleanup Test. Why: Someone who left mustn't hold messages forever, and the retention is the backstop for a member who never comes back (Section 5). How: This seeds messages waiting on a departed member and on an absent one, then clears and deletes them as Alice.


	const aliDbsObj = accDbsFun( 'alice' ); // What: Alice Database Object. Why: Alice tidies the chat. How: This acts as her.


	await seeMirFun(); // What: Mirror Seed Call. Why: Carol is absent from the mirror, as a departed member would be. How: This writes Alice and Bob alone.

	await seeDbsFun( MSG_ONE_STR, msgDatFun( 'bob', { carol : true }, { sentAt : Date.now() } ) );                                 // What: Departed Wait Seed. Why: The message still waits on Carol, who has left. How: This writes it with the rules off.
	await seeDbsFun( 'chats/gro1/messages/msg2', msgDatFun( 'bob', { bob : true }, { sentAt : Date.now() - 31 * DAY_MIL_NUM } ) ); // What: Old Message Seed. Why: A message waiting on an absent member is cleared after the retention. How: This writes one sent 31 days ago.
	await seeDbsFun( 'chats/gro1/messages/msg3', msgDatFun( 'bob', { bob : true }, { sentAt : Date.now() - 29 * DAY_MIL_NUM } ) ); // What: Recent Message Seed. Why: A message inside the retention keeps waiting. How: This writes one sent 29 days ago.

	await assertFails( remove( ref( accDbsFun( 'dave' ), `${ MSG_ONE_STR }/waitingOn/carol` ) ) ); // What: Outsider Clears Wait. Why: Only members tidy the chat. How: This expects Dave refused.
	await assertSucceeds( remove( ref( aliDbsObj, `${ MSG_ONE_STR }/waitingOn/carol` ) ) );        // What: Departed Wait Cleared. Why: Someone who left can't hold a message forever. How: This expects Alice clearing Carol's wait allowed.
	await assertFails( remove( ref( aliDbsObj, 'chats/gro1/messages/msg3' ) ) );                   // What: Recent Delete. Why: A message inside the retention waits for its members. How: This expects deleting one from 29 days ago refused.
	await assertSucceeds( remove( ref( aliDbsObj, 'chats/gro1/messages/msg2' ) ) );                // What: Expired Delete. Why: The retention is the backstop for a member who never returns. How: This expects deleting one from 31 days ago allowed.


} );



test( 'a member sets only their own presence as an online flag, which only members read', async () => { // What: Presence Test. Why: Who's online is for the group, and nobody can mark someone else online (Section 11.8). How: This sets presence as each person, with one fault at a time, and reads it as a member and an outsider, checking who the rules let through.


	const bobDbsObj = accDbsFun( 'bob' ); // What: Bob Database Object. Why: Bob sets his presence. How: This acts as him.


	await seeMirFun(); // What: Mirror Seed Call. Why: The rules read the group's members. How: This writes the mirror.

	await assertSucceeds( set( ref( bobDbsObj, 'presence/gro1/bob' ), { online : true } ) );               // What: Own Presence. Why: A member says they're online. How: This expects Bob's flag allowed.
	await assertFails( set( ref( bobDbsObj, 'presence/gro1/alice' ), { online : true } ) );                // What: Other Presence. Why: Nobody marks someone else online. How: This expects Bob setting Alice's refused.
	await assertFails( set( ref( accDbsFun( 'dave' ), 'presence/gro1/dave' ), { online : true } ) );       // What: Outsider Presence. Why: Only members appear online in the group. How: This expects Dave refused.
	await assertFails( set( ref( bobDbsObj, 'presence/gro1/bob' ), { online : 'yes' } ) );                 // What: Presence Value. Why: Presence is a true or false flag. How: This expects text refused.
	await assertFails( set( ref( bobDbsObj, 'presence/gro1/bob' ), { lastSeen : 9000, online : true } ) ); // What: Extra Presence Field. Why: Presence holds the flag alone. How: This expects another field refused.
	await assertSucceeds( get( ref( accDbsFun( 'alice' ), 'presence/gro1' ) ) );                           // What: Member Presence Read. Why: Members see who's online. How: This expects Alice's read allowed.
	await assertFails( get( ref( accDbsFun( 'dave' ), 'presence/gro1' ) ) );                               // What: Outsider Presence Read. Why: Presence is for the group only. How: This expects Dave refused.
	await assertFails( set( ref( bobDbsObj, 'mirrors/gro1/members/dave' ), 9000 ) );                       // What: Mirror Write. Why: Only the Cloud Function keeps the mirror, so nobody can add themselves. How: This expects Bob adding Dave refused.


} );

// #endregion Module Init


