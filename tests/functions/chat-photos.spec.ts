


// #region Imports

import { BUC_URL_STR               } from '../support/storage.ts';        // What: Bucket URL String. Why: The triggers delete from Storage's default bucket. How: This names it for the tests' seeds.
import { DBS_URL_STR               } from '../support/database.ts';       // What: Database URL String. Why: Messages are seeded in the instance the functions watch. How: This names it.
import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: Deleting a chat photo's document sets off its trigger. How: This deletes a document.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the triggers leave what they should. How: This asserts on what each poll reads.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The photos' documents are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests write and read the emulators past their rules, as the server would. How: This connects to them.
import { ref as datRefFun          } from 'firebase/database';            // What: Database Ref Function. Why: Every message names a path in the Realtime Database, apart from Storage's own ref. How: This builds a reference.
import { ref                       } from 'firebase/storage';             // What: Ref. Why: Every seeded file names a path. How: This builds a reference.
import { remove                    } from 'firebase/database';            // What: Remove. Why: Deleting a message sets off its trigger. How: This deletes one.
import { set                       } from 'firebase/database';            // What: Set. Why: The tests seed messages. How: This writes one.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed the photos' documents. How: This writes a document.
import { stoLisFun                 } from '../support/storage.ts';        // What: Storage List Function. Why: The tests check which files the triggers left. How: This lists a folder's file names.
import { test                      } from '@playwright/test';             // What: Test. Why: Each trigger is its own test. How: This declares them.
import { uploadBytes               } from 'firebase/storage';             // What: Upload Bytes. Why: The tests seed the files the triggers delete. How: This uploads one.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through one. How: This types it.

// #endregion Imports



/**
 * chat-photos.spec.ts = Chat Photo Triggers Spec
 *
 * @summary
 * Checks the Cloud Functions that keep a chat photo on the server only as
 * long as its message (ARCHITECTURE.md Section 22), end to end in the local
 * Firebase Emulators, which npm run test:functions starts and stops around
 * this suite: a photo's document going with the message that names it, but
 * only when the message's sender added it, and a photo's file going with its
 * document. A write sets off the deployed trigger, and the test polls until
 * Storage or Firestore shows its work, or fails once the poll times out.
 * Each test uses its own group, so a trigger left over from one test can
 * never reach another's files.
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

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every test reaches the emulators through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const remMesFun = ( patValStr : string ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => remove( datRefFun( cotAdmObj.database( DBS_URL_STR ), patValStr ) ) );                                      // What: Remove Message Function. Why: Every member receiving a message, or its retention running out, ends in its deletion. How: This deletes the message with the rules off.
const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) );      // What: Seed Document Function. Why: The triggers read and delete the photos' documents. How: This writes one with the rules off.
const seeFilFun = ( patValStr : string ) => funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await uploadBytes( ref( cotAdmObj.storage( BUC_URL_STR ), patValStr ), new Uint8Array( 10 ) ); } ); // What: Seed File Function. Why: The triggers delete the photos' files. How: This uploads a small one with the rules off.



// #region docExiFun

/**
 * docExiFun = Document Exists Function
 *
 * @summary
 * Reads a document with the rules turned off and resolves with whether it
 * exists.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The document's path.
 *
 * @returns A promise that resolves with whether the document exists.
 *
 * @example
 * ```ts
 * docExiFun('groups/gcp1/chatPhotos/chp1') // => true
 * ```
 *
*/

const docExiFun = async ( patValStr : string ) : Promise< boolean > => { // What: Document Exists Function. Why: The tests check which documents a trigger left. How: This reads the document as the server would.


	let exiValBoo = false; // What: Exists Value Boolean. Why: The read happens inside the rules-off callback. How: This carries its result out, starting missing.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { exiValBoo = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).exists(); } ); // What: Document Read Call. Why: The rules hide what's being checked. How: This reads the document with them off and records whether it exists.



	return exiValBoo; // What: Exists Return. Why: The poll compares it. How: This returns it.


};

// #endregion docExiFun



// #region seeMesFun

/**
 * seeMesFun = Seed Message Function
 *
 * @summary
 * Writes a chat message with the rules turned off, from the sender given,
 * naming the photo given, or none when it's null.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The message's path.
 * @param senUidStr - Sender UID String: Who the message names as its sender.
 * @param phoIdeStr - Photo Identifier String: The photo it names, or null.
 *
 * @returns A promise that settles once the message is written, with no
 *          value.
 *
 * @example
 * ```ts
 * seeMesFun('chats/gcp1/messages/m1', 'alice', 'chp1') // => Promise<void>
 * ```
 *
*/

const seeMesFun = ( patValStr : string, senUidStr : string, phoIdeStr : string | null ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => set( datRefFun( cotAdmObj.database( DBS_URL_STR ), patValStr ), { ciphertext : 'x', iv : 'y', quiet : true, senderUid : senUidStr, sentAt : Date.now(), ...( phoIdeStr === null ? {} : { photoId : phoIdeStr } ) } ) ); // What: Seed Message Function. Why: A message's deletion is what the trigger hears. How: This writes one marked quiet, so it pushes nobody, naming the photo when given.

// #endregion seeMesFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore, the Realtime Database, and Storage under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every test reaches the emulators through it. How: This connects to the databases the triggers fire on and the storage they clear.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: The messages are seeded there. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The photos' documents live there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang',                    // What: Project Identifier. Why: The Functions emulator runs the triggers for this demo project alone. How: This names it, matching the project test:functions starts.
		storage   : { host : '127.0.0.1', port : 8220 }  // What: Storage Options. Why: The photos' files live there. How: This names the address firebase.json gives its emulator.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( "a chat photo and its file go when the message naming it is deleted, leaving the chat's other photos", async () => { // What: Message End Trigger Test. Why: A chat photo stays on the server only until its message goes (Section 22). How: This seeds two photos and their messages, deletes one message, and waits for its photo and file alone to go.


	await seeDocFun( 'groups/gcp1/chatPhotos/chp1', { uploaderUid : 'alice' } ); // What: First Photo Seed. Why: Its message is deleted. How: This writes it.
	await seeDocFun( 'groups/gcp1/chatPhotos/chp2', { uploaderUid : 'bob' } );   // What: Second Photo Seed. Why: Its message stays. How: This writes it.

	await seeFilFun( 'chatPhotos/gcp1/chp1' ); // What: First File Seed. Why: The first photo's file goes with it. How: This uploads it.
	await seeFilFun( 'chatPhotos/gcp1/chp2' ); // What: Second File Seed. Why: The second photo's file stays. How: This uploads it.

	await seeMesFun( 'chats/gcp1/messages/m1', 'alice', 'chp1' ); // What: First Message Seed. Why: Alice's message carries her photo. How: This writes it.
	await seeMesFun( 'chats/gcp1/messages/m2', 'bob', 'chp2' );   // What: Second Message Seed. Why: Bob's message carries his. How: This writes it.

	await remMesFun( 'chats/gcp1/messages/m1' ); // What: Message Delete Call. Why: Every member has Alice's message. How: This deletes it.

	await expect.poll( () => stoLisFun( funEnvObj, 'chatPhotos/gcp1' ) ).toEqual( [ 'chp2' ] ); // What: File Gone. Why: The message's photo goes with it, its document taking the file. How: This waits for Bob's file alone to be left.

	expect( await docExiFun( 'groups/gcp1/chatPhotos/chp1' ) ).toBe( false ); // What: Document Gone. Why: The photo's document went first. How: This expects Alice's gone.
	expect( await docExiFun( 'groups/gcp1/chatPhotos/chp2' ) ).toBe( true );  // What: Other Document Kept. Why: Bob's message still waits. How: This expects his still there.


} );



test( "a message naming someone else's photo leaves it when it's deleted, and a message with no photo changes nothing", async () => { // What: Foreign Photo Test. Why: A member could name another's photo on their own message, and its deletion mustn't take the photo (Section 22). How: This deletes a message from Bob naming Alice's photo, one naming none, and one naming a photo never added, then a message of Alice's own whose photo going shows the triggers have run, and checks her first photo is still there.


	await seeDocFun( 'groups/gcp2/chatPhotos/chp1', { uploaderUid : 'alice' } ); // What: Kept Photo Seed. Why: Alice's photo has to stay. How: This writes it.
	await seeDocFun( 'groups/gcp2/chatPhotos/chp2', { uploaderUid : 'alice' } ); // What: Marker Photo Seed. Why: Its going shows the triggers have run. How: This writes another of Alice's.

	await seeFilFun( 'chatPhotos/gcp2/chp1' ); // What: Kept File Seed. Why: Its file has to stay too. How: This uploads it.
	await seeFilFun( 'chatPhotos/gcp2/chp2' ); // What: Marker File Seed. Why: The marker's file goes. How: This uploads it.

	await seeMesFun( 'chats/gcp2/messages/m1', 'bob', 'chp1' );   // What: Foreign Message Seed. Why: Bob's message names Alice's photo. How: This writes it.
	await seeMesFun( 'chats/gcp2/messages/m2', 'bob', null );     // What: Plain Message Seed. Why: A message with no photo has nothing to delete. How: This writes it.
	await seeMesFun( 'chats/gcp2/messages/m3', 'alice', 'chp9' ); // What: Missing Photo Seed. Why: A message whose photo is already gone deletes nothing more. How: This writes one naming a photo that was never added.
	await seeMesFun( 'chats/gcp2/messages/m4', 'alice', 'chp2' ); // What: Marker Message Seed. Why: Alice's own message takes her photo. How: This writes it.

	await remMesFun( 'chats/gcp2/messages/m1' ); // What: Foreign Delete Call. Why: The foreign message is deleted. How: This deletes it.
	await remMesFun( 'chats/gcp2/messages/m2' ); // What: Plain Delete Call. Why: The plain message is deleted. How: This deletes it.
	await remMesFun( 'chats/gcp2/messages/m3' ); // What: Missing Delete Call. Why: The missing photo's message is deleted. How: This deletes it.
	await remMesFun( 'chats/gcp2/messages/m4' ); // What: Marker Delete Call. Why: The marker's deletion comes last. How: This deletes it.

	await expect.poll( () => stoLisFun( funEnvObj, 'chatPhotos/gcp2' ) ).toEqual( [ 'chp1' ] ); // What: Marker Gone. Why: The marker's file going shows the triggers ran. How: This waits for Alice's first file alone to be left.

	expect( await docExiFun( 'groups/gcp2/chatPhotos/chp1' ) ).toBe( true ); // What: Photo Kept. Why: Bob didn't add Alice's photo, so his message's deletion left it. How: This expects her document still there.


} );



test( "a chat photo's file goes when its document is deleted, whatever deleted it", async () => { // What: File Trigger Test. Why: A chat photo's file mustn't outlive its document, however the document went, its TTL included (Section 22). How: This seeds two photos and their files, deletes one document, and waits for its file alone to go.


	await seeDocFun( 'groups/gcp3/chatPhotos/chp1', { uploaderUid : 'alice' } ); // What: First Photo Seed. Why: Its document is deleted. How: This writes it.
	await seeDocFun( 'groups/gcp3/chatPhotos/chp2', { uploaderUid : 'bob' } );   // What: Second Photo Seed. Why: Its document stays. How: This writes it.

	await seeFilFun( 'chatPhotos/gcp3/chp1' ); // What: First File Seed. Why: The first photo's file goes. How: This uploads it.
	await seeFilFun( 'chatPhotos/gcp3/chp2' ); // What: Second File Seed. Why: The second photo's file stays. How: This uploads it.

	await funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => deleteDoc( doc( cotAdmObj.firestore(), 'groups/gcp3/chatPhotos/chp1' ) ) ); // What: Document Delete Call. Why: A TTL or a data deletion takes the document. How: This deletes it with the rules off.

	await expect.poll( () => stoLisFun( funEnvObj, 'chatPhotos/gcp3' ) ).toEqual( [ 'chp2' ] ); // What: File Gone. Why: The deleted photo's file goes with it. How: This waits for the second file alone to be left.


} );

// #endregion Module Init


