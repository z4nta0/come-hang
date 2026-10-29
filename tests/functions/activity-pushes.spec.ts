


// #region Imports

import { DBS_URL_STR               } from '../support/database.ts';       // What: Database URL String. Why: Chat and presence are seeded in the instance the functions read. How: This names it.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore seed names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the right members were pushed. How: This asserts on the pushes the emulator kept.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests write as the app would, past the rules. How: This connects to the emulators.
import { pusLisFun                 } from '../support/pushes.ts';         // What: Push List Function. Why: The pushes are checked. How: This reads what reached a token.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Chat and presence are seeded by path. How: This builds a reference.
import { set                       } from 'firebase/database';            // What: Set. Why: A message and presence are seeded. How: This writes them.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Groups, members, and requests are seeded. How: This writes them.
import { test                      } from '@playwright/test';             // What: Test. Why: Each kind of activity push is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A join request's expiry is a timestamp. How: This builds it.
import { tokSetFun                 } from '../support/pushes.ts';         // What: Token Set Function. Why: A push only goes to a stored token. How: This seeds one.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: A history request is claimed and released. How: This changes it.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * activity-pushes.spec.ts = Activity Pushes Spec
 *
 * @summary
 * Checks the activity pushes end to end in the Functions, Firestore, and
 * Realtime Database emulators. Each test seeds a group named Picnic with
 * members and their phones' tokens, then writes as the app would, past the
 * rules, and reads which pushes the emulator kept for each token: history
 * requests as they become pending, join requests with their count and
 * replacing tag, and chat messages to waiting members who don't have the
 * group open.
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

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulators through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const docSetFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Document Set Function. Why: Tests write as the app would, without the rules in the way. How: This writes a document with the rules off.



const seeGroFun = async ( uidValArr : string[] ) : Promise< void > => { // What: Seed Group Function. Why: Every test starts from a group with members and their phones. How: This seeds gro1, named Picnic, a membership and a token for each UID.


	await docSetFun( 'groups/gro1', { name : 'Picnic' } ); // What: Group Seed Call. Why: A push's title is the group's name. How: This writes the group's name.



	for ( const uidValStr of uidValArr ) { // What: Member Seed Loop. Why: Each member can be pushed. How: This writes a membership and a token for each.


		await docSetFun( `groups/gro1/members/${ uidValStr }`, { joinedAt : Timestamp.now() } ); // What: Member Seed Call. Why: Pushes go to members. How: This writes the membership.

		await tokSetFun( funEnvObj, uidValStr, `tok-${ uidValStr }` ); // What: Token Seed Call. Why: A push only goes to a stored token. How: This stores the member's.


	}


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore and the Realtime Database under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read reaches the emulators through it. How: This connects to both databases.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: Chat and presence are seeded there. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The groups and requests are seeded there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from empty databases. How: This clears both.


	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's documents or pushes. How: This clears them.

	await funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => set( ref( cotAdmObj.database( DBS_URL_STR ) ), null ) ); // What: Database Clear Call. Why: No test sees another's chat or presence. How: This clears the shared instance.


} );



test( 'a history request becoming pending pushes every other member, and a claim pushes nobody', async () => { // What: History Push Test. Why: A request needs an online helper, so members hear of it whenever it opens (Section 11.9). How: This files a request, claims it, releases it, and checks each member's pushes.


	await seeGroFun( [ 'alice', 'bob', 'carol' ] ); // What: Group Seed Call. Why: The test needs three members. How: This seeds them.

	await docSetFun( 'groups/gro1/historyRequests/bob', { status : 'pending' } ); // What: Request Call. Why: Bob asks for history. How: This files his request.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-alice' ) ).toEqual( [ { body : 'A member is asking for chat history they missed.', title : 'Picnic' } ] ); // What: Alice Pushed. Why: Alice may be the one who can help. How: This waits for her push.
	await expect.poll( () => pusLisFun( funEnvObj, 'tok-carol' ) ).toHaveLength( 1 );                                                                              // What: Carol Pushed. Why: Carol may help too. How: This waits for her push.

	await funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'groups/gro1/historyRequests/bob' ), { status : 'claimed' } ) ); // What: Claim Call. Why: A claimed request needs no more help. How: This claims it.

	await new Promise( ( resValFun ) => setTimeout( resValFun, 2000 ) ); // What: Claim Settle Wait. Why: A push from the claim would arrive within this time. How: This waits 2 seconds.

	expect( await pusLisFun( funEnvObj, 'tok-alice' ) ).toHaveLength( 1 ); // What: Claim Silent. Why: A claimed request needs no more help. How: This expects no push beyond the first.

	await funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), 'groups/gro1/historyRequests/bob' ), { status : 'pending' } ) ); // What: Release Call. Why: A released request needs help again. How: This returns it to pending.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-alice' ) ).toHaveLength( 2 ); // What: Alice Pushed Again. Why: The release opens the request again, while the claim announced nothing. How: This waits for exactly a second push.

	await new Promise( ( resValFun ) => setTimeout( resValFun, 2000 ) ); // What: Release Settle Wait. Why: Any further push would arrive within this time. How: This waits 2 seconds.


	expect( await pusLisFun( funEnvObj, 'tok-alice' ) ).toHaveLength( 2 ); // What: Alice Twice. Why: Only the filing and the release push. How: This expects exactly two.
	expect( await pusLisFun( funEnvObj, 'tok-bob' ) ).toEqual( [] );       // What: Asker Not Pushed. Why: Bob needn't hear of his own request. How: This expects none for him.


} );



test( 'a join request pushes every member a count that replaces the last, and an expired one pushes nobody', async () => { // What: Join Push Test. Why: Members get one replacing notification however many people ask (Section 17). How: This files an expired request, then two live ones, and checks the pushes.


	await seeGroFun( [ 'alice', 'bob' ] ); // What: Group Seed Call. Why: The test needs two members. How: This seeds them.

	await docSetFun( 'groups/gro1/joinRequests/old', { expireAt : Timestamp.fromMillis( Date.now() - 60000 ) } ); // What: Expired Request Call. Why: A request already expired leaves nothing to approve. How: This files one a minute past its expiry.

	await docSetFun( 'groups/gro1/joinRequests/dana', { expireAt : Timestamp.fromMillis( Date.now() + 86400000 ) } ); // What: First Request Call. Why: Dana asks to join. How: This files her request.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-bob' ) ).toEqual( [ { body : 'Someone wants to join.', tag : 'join-gro1', title : 'Picnic' } ] ); // What: First Push. Why: Every member can approve, and the expired request isn't counted or pushed. How: This waits for one push saying someone wants to join.

	await docSetFun( 'groups/gro1/joinRequests/erin', { expireAt : Timestamp.fromMillis( Date.now() + 86400000 ) } ); // What: Second Request Call. Why: Erin asks too. How: This files her request.

	await expect.poll( async () => ( await pusLisFun( funEnvObj, 'tok-alice' ) ).map( ( pusValObj ) => pusValObj.body ).sort() ).toEqual( [ '2 people want to join.', 'Someone wants to join.' ] ); // What: Count Push. Why: The second push replaces the first with the count. How: This waits for both of Alice's pushes.


} );



test( 'a chat message pushes each waiting member away from the group, and nobody once the group is gone', async () => { // What: Chat Push Test. Why: Members away from the app learn the chat moved on, while one with the group open is left alone (Section 11.7). How: This seeds presence and messages, then checks the pushes.


	await seeGroFun( [ 'alice', 'bob', 'carol' ] ); // What: Group Seed Call. Why: The test needs three members. How: This seeds them.



	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Chat Seed Call. Why: Carol has the group open, and Alice sends a message both others wait on. How: This writes Carol's presence, then the message.


		await set( ref( cotAdmObj.database( DBS_URL_STR ), 'presence/gro1/carol' ), { online : true } ); // What: Presence Seed Call. Why: Carol has the group open. How: This marks her online.

		await set( ref( cotAdmObj.database( DBS_URL_STR ), 'chats/gro1/messages/m1' ), { ciphertext : 'x', iv : 'y', senderUid : 'alice', sentAt : Date.now(), waitingOn : { bob : true, carol : true } } ); // What: Message Seed Call. Why: A message Bob and Carol haven't received. How: This writes it.

		await set( ref( cotAdmObj.database( DBS_URL_STR ), 'chats/gone/messages/m2' ), { ciphertext : 'x', iv : 'y', senderUid : 'alice', sentAt : Date.now(), waitingOn : { bob : true } } ); // What: Gone Seed Call. Why: A message in a group that's gone pushes nobody. How: This writes one with no group behind it.


	} );


	await expect.poll( () => pusLisFun( funEnvObj, 'tok-bob' ) ).toEqual( [ { body : 'New messages.', tag : 'chat-gro1', title : 'Picnic' } ] ); // What: Bob Pushed. Why: Bob is away and waiting. How: This waits for one tagged push.


	expect( await pusLisFun( funEnvObj, 'tok-carol' ) ).toEqual( [] ); // What: Carol Not Pushed. Why: Carol has the group open. How: This expects none for her.
	expect( await pusLisFun( funEnvObj, 'tok-alice' ) ).toEqual( [] ); // What: Sender Not Pushed. Why: Alice isn't waiting on her own message. How: This expects none for her.


} );

// #endregion Module Init


