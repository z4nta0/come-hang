


// #region Imports

import { BUC_URL_STR               } from '../support/storage.ts';        // What: Bucket URL String. Why: The triggers delete from Storage's default bucket. How: This names it for the tests' seeds.
import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: Ending a membership, a photo, or an event sets off its trigger. How: This deletes a document.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the triggers leave what they should. How: This asserts on what each poll reads.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The photos' documents are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests write and read the emulators past their rules, as the server would. How: This connects to them.
import { ref                       } from 'firebase/storage';             // What: Ref. Why: Every seeded file names a path. How: This builds a reference.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed documents and move an event. How: This writes a document.
import { stoLisFun                 } from '../support/storage.ts';        // What: Storage List Function. Why: The tests check which files the triggers left. How: This lists a folder's file names.
import { test                      } from '@playwright/test';             // What: Test. Why: Each trigger is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Deletion times are Firestore timestamps. How: This builds and recognizes them.
import { uploadBytes               } from 'firebase/storage';             // What: Upload Bytes. Why: The tests seed the files the triggers delete. How: This uploads one.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through one. How: This types it.

// #endregion Imports



/**
 * photos.spec.ts = Photo Triggers Spec
 *
 * @summary
 * Checks the Cloud Functions that keep photos in step with what owns them,
 * end to end in the local Firebase Emulators, which npm run test:functions
 * starts and stops around this suite: a profile photo going with its
 * membership, a full photo with its document, an event's photos and tallies
 * with the event, and its photos' deletion time following the event's. A
 * Firestore write sets off the deployed trigger, and the test polls until
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

const remDocFun = ( patValStr : string ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => deleteDoc( doc( cotAdmObj.firestore(), patValStr ) ) );                                                     // What: Remove Document Function. Why: A deletion sets off the trigger under test. How: This deletes the document with the rules off.
const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) );      // What: Seed Document Function. Why: The tests write what the triggers read. How: This writes the document with the rules off.
const seeFilFun = ( patValStr : string ) => funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await uploadBytes( ref( cotAdmObj.storage( BUC_URL_STR ), patValStr ), new Uint8Array( 10 ) ); } ); // What: Seed File Function. Why: The triggers delete files the tests put in place. How: This uploads ten zero bytes to the path in the functions' bucket.



type DocStaTyp = { exiBoo : boolean, expNum : number | null }; // What: Document State Type. Why: A check reads whether a document is there and its deletion time. How: This types both, the time null when there's none.

// #region reaDocFun

/**
 * reaDocFun = Read Document Function
 *
 * @summary
 * Reads a document with the rules turned off and resolves with whether it
 * exists and its deletion time in milliseconds, null when it has none.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The document's path.
 *
 * @returns A promise that resolves with the document's state.
 *
 * @example
 * ```ts
 * reaDocFun('groups/gpd1/events/eve1/photos/pho1') // => { expNum, exiBoo }
 * ```
 *
*/

const reaDocFun = async ( patValStr : string ) : Promise< DocStaTyp > => { // What: Read Document Function. Why: The tests check which documents a trigger left and their deletion times. How: This reads the document as the server would.


	let docStaObj : DocStaTyp = { exiBoo : false, expNum : null }; // What: Document State Object. Why: The read happens inside the rules-off callback. How: This carries its result out, starting missing.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Document Read Call. Why: The rules hide what's being checked. How: This reads the document with them off.


		const docSnaObj = await getDoc( doc( cotAdmObj.firestore(), patValStr ) ); // What: Document Snapshot Object. Why: Its existence and time are read. How: This fetches it.
		const expValAny : unknown = docSnaObj.get( 'expireAt' );                   // What: Expire Value Any. Why: Not every document has a deletion time. How: This reads it, untyped.


		docStaObj = { exiBoo : docSnaObj.exists(), expNum : expValAny instanceof Timestamp ? expValAny.toMillis() : null }; // What: State Assignment. Why: The test reads both. How: This records whether it exists and its time, when it's a timestamp.


	} );



	return docStaObj; // What: State Return. Why: The poll compares it. How: This returns it.


};

// #endregion reaDocFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore and Storage under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every test reaches the emulators through it. How: This connects to the database the triggers fire on and the storage they clear.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The triggers fire on Firestore deletes and changes. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang',                    // What: Project Identifier. Why: The Functions emulator runs the triggers for this demo project alone. How: This names it, matching the project test:functions starts.
		storage   : { host : '127.0.0.1', port : 8220 }  // What: Storage Options. Why: The photos' files live there. How: This names the address firebase.json gives its emulator.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( "a profile photo goes when its membership ends, leaving the group's other photos and the member's in other groups", async () => { // What: Avatar Trigger Test. Why: Only the member writes their photo, so once they're gone nobody else can delete it (Section 21). How: This seeds two members' photos and one in another group, ends one membership, and waits for that photo alone to go.


	await seeDocFun( 'groups/gpa1/members/alice', { joinedAt : Timestamp.fromMillis( 1000 ) } ); // What: Alice Member Seed. Why: Her membership ends. How: This writes it.
	await seeDocFun( 'groups/gpa1/members/bob', { joinedAt : Timestamp.fromMillis( 2000 ) } );   // What: Bob Member Seed. Why: His membership stays. How: This writes it.

	await seeFilFun( 'avatars/gpa1/alice' ); // What: Alice Avatar Seed. Why: Her photo goes with her membership. How: This uploads it.
	await seeFilFun( 'avatars/gpa1/bob' );   // What: Bob Avatar Seed. Why: Another member's photo stays. How: This uploads it.
	await seeFilFun( 'avatars/gpa2/alice' ); // What: Other Group Avatar Seed. Why: Her copy in a group she's still in stays. How: This uploads it.

	await remDocFun( 'groups/gpa1/members/alice' ); // What: Membership End Call. Why: Leaving, removal, and deletion all end in the document's deletion. How: This deletes Alice's membership.

	await expect.poll( () => stoLisFun( funEnvObj, 'avatars/gpa1' ) ).toEqual( [ 'bob' ] ); // What: Avatar Gone. Why: Her photo mustn't outlive her membership. How: This waits for Bob's alone to be left.

	expect( await stoLisFun( funEnvObj, 'avatars/gpa2' ) ).toEqual( [ 'alice' ] ); // What: Other Group Avatar Kept. Why: Each group keeps its own copy for its own members. How: This expects hers in gpa2 still there.


} );



test( "a full photo goes when its photo's document is deleted, leaving the event's other photos", async () => { // What: Full Photo Trigger Test. Why: A full photo mustn't outlive its document, however the document went (Section 20). How: This seeds two photos with their files, deletes one document, and waits for its file alone to go.


	await seeDocFun( 'groups/gpb1/events/eve1/photos/pho1', { uploaderUid : 'alice' } ); // What: First Photo Seed. Why: Its document is deleted. How: This writes it.
	await seeDocFun( 'groups/gpb1/events/eve1/photos/pho2', { uploaderUid : 'bob' } );   // What: Second Photo Seed. Why: Its document stays. How: This writes it.

	await seeFilFun( 'photos/gpb1/eve1/pho1' ); // What: First File Seed. Why: The first photo's full image goes. How: This uploads it.
	await seeFilFun( 'photos/gpb1/eve1/pho2' ); // What: Second File Seed. Why: The second photo's full image stays. How: This uploads it.

	await remDocFun( 'groups/gpb1/events/eve1/photos/pho1' ); // What: Photo Delete Call. Why: The uploader or owner took the photo down. How: This deletes its document.

	await expect.poll( () => stoLisFun( funEnvObj, 'photos/gpb1/eve1' ) ).toEqual( [ 'pho2' ] ); // What: Full Photo Gone. Why: The deleted photo's image goes with it. How: This waits for the second photo's alone to be left.


} );



test( "an event's photos, their full photos, and its tallies go with the event, leaving other events' photos", async () => { // What: Event End Trigger Test. Why: Firestore's TTL leaves an event's subcollections behind, so the photos would outlive it (Section 20). How: This seeds two events with photos and one with tallies, deletes that event, and waits for its photos, files, and tallies to go.


	await seeDocFun( 'groups/gpc1/events/eve1', { titleEnc : 'x' } );                    // What: Ending Event Seed. Why: Its photos go with it. How: This writes it.
	await seeDocFun( 'groups/gpc1/events/eve1/photos/pho1', { uploaderUid : 'alice' } ); // What: First Photo Seed. Why: The event's photos go. How: This writes one.
	await seeDocFun( 'groups/gpc1/events/eve1/photos/pho2', { uploaderUid : 'bob' } );   // What: Second Photo Seed. Why: Every one of them goes. How: This writes another.
	await seeDocFun( 'groups/gpc1/events/eve1/photoTally/all', { count : 2 } );          // What: Tally Seed. Why: The counts have nothing left to count. How: This writes the event's.
	await seeDocFun( 'groups/gpc1/events/eve2', { titleEnc : 'x' } );                    // What: Other Event Seed. Why: Another event's photos stay. How: This writes it.
	await seeDocFun( 'groups/gpc1/events/eve2/photos/pho3', { uploaderUid : 'alice' } ); // What: Other Photo Seed. Why: It belongs to the event that stays. How: This writes it.

	await seeFilFun( 'photos/gpc1/eve1/pho1' ); // What: First File Seed. Why: The event's full photos go. How: This uploads one.
	await seeFilFun( 'photos/gpc1/eve1/pho2' ); // What: Second File Seed. Why: Every one of them goes. How: This uploads another.
	await seeFilFun( 'photos/gpc1/eve2/pho3' ); // What: Other File Seed. Why: The staying event's full photo stays. How: This uploads it.

	await remDocFun( 'groups/gpc1/events/eve1' ); // What: Event Delete Call. Why: A TTL, a cancel, or the group's deletion ends an event. How: This deletes the event's document alone.

	await expect.poll( () => stoLisFun( funEnvObj, 'photos/gpc1/eve1' ) ).toEqual( [] );                                   // What: Full Photos Gone. Why: Each photo's image goes with it. How: This waits for the event's folder to empty.
	await expect.poll( async () => ( await reaDocFun( 'groups/gpc1/events/eve1/photos/pho1' ) ).exiBoo ).toBe( false );    // What: First Photo Gone. Why: The event's photos go. How: This waits for its document to go.
	await expect.poll( async () => ( await reaDocFun( 'groups/gpc1/events/eve1/photos/pho2' ) ).exiBoo ).toBe( false );    // What: Second Photo Gone. Why: Every one of them goes. How: This waits for its document to go.
	await expect.poll( async () => ( await reaDocFun( 'groups/gpc1/events/eve1/photoTally/all' ) ).exiBoo ).toBe( false ); // What: Tally Gone. Why: The counts go too. How: This waits for the event's tally to go.

	expect( ( await reaDocFun( 'groups/gpc1/events/eve2/photos/pho3' ) ).exiBoo ).toBe( true ); // What: Other Photo Kept. Why: Only the deleted event's photos go. How: This expects the other event's photo still there.
	expect( await stoLisFun( funEnvObj, 'photos/gpc1/eve2' ) ).toEqual( [ 'pho3' ] );           // What: Other File Kept. Why: Its full photo stays too. How: This expects the other event's file still there.


} );



test( "an event's photos take its new deletion time when the event's end moves", async () => { // What: Event Move Trigger Test. Why: A photo goes when its event does, and an event's end can move (Section 20). How: This seeds an event and two photos with its deletion time, moves the event's, and waits for both photos to follow.


	await seeDocFun( 'groups/gpd1/events/eve1', { expireAt : Timestamp.fromMillis( 2e12 ) } );                                    // What: Event Seed. Why: The photos follow its deletion time. How: This writes it.
	await seeDocFun( 'groups/gpd1/events/eve1/photos/pho1', { expireAt : Timestamp.fromMillis( 2e12 ), uploaderUid : 'alice' } ); // What: First Photo Seed. Why: It starts in step with the event. How: This writes it with the event's time.
	await seeDocFun( 'groups/gpd1/events/eve1/photos/pho2', { expireAt : Timestamp.fromMillis( 2e12 ), uploaderUid : 'bob' } );   // What: Second Photo Seed. Why: Every photo follows. How: This writes another.

	await seeDocFun( 'groups/gpd1/events/eve1', { expireAt : Timestamp.fromMillis( 2.1e12 ) } ); // What: Event Move Call. Why: The event's end moved, and its deletion time with it. How: This rewrites the event with a later time.

	await expect.poll( async () => ( await reaDocFun( 'groups/gpd1/events/eve1/photos/pho1' ) ).expNum ).toBe( 2.1e12 ); // What: First Photo Moved. Why: A photo goes with its event. How: This waits for its time to match the event's.
	await expect.poll( async () => ( await reaDocFun( 'groups/gpd1/events/eve1/photos/pho2' ) ).expNum ).toBe( 2.1e12 ); // What: Second Photo Moved. Why: Every photo follows. How: This waits for its time to match too.


} );

// #endregion Module Init


