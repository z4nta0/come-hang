


// #region Imports

import { assertFails               } from '@firebase/rules-unit-testing'; // What: Assert Fails. Why: Forbidden reads and writes must be refused. How: This expects a request to be denied.
import { assertSucceeds            } from '@firebase/rules-unit-testing'; // What: Assert Succeeds. Why: An allowed request must go through. How: This expects it to succeed.
import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: A test has a member leave. How: This deletes a document.
import { deleteObject              } from 'firebase/storage';             // What: Delete Object. Why: Deletion rules are checked. How: This deletes a file.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The rules read Firestore documents the tests seed. How: This builds a reference.
import { getBytes                  } from 'firebase/storage';             // What: Get Bytes. Why: Download rules are checked. How: This reads a file's contents.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The rules run in the local emulators. How: This connects to them with the project's rules.
import { listAll                   } from 'firebase/storage';             // What: List All. Why: Listing is checked as its own request. How: This lists a folder's files.
import { readFileSync              } from 'node:fs';                      // What: Read File Sync. Why: The emulator is given the real rules file. How: This reads it.
import { ref                       } from 'firebase/storage';             // What: Ref. Why: Every request names a file. How: This builds a reference.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed the documents the rules read. How: This writes a document.
import { stoCleFun                 } from '../support/storage.ts';        // What: Storage Clear Function. Why: Each test starts from an empty bucket. How: This clears it folder by folder.
import { test                      } from '@playwright/test';             // What: Test. Why: Each rule is its own test. How: This declares them.
import { uploadBytes               } from 'firebase/storage';             // What: Upload Bytes. Why: Upload rules are checked. How: This uploads a file's contents.


import type { FirebaseStorage      } from 'firebase/storage';             // What: Firebase Storage. Why: The upload helper takes the identity's storage. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through one. How: This types it.
import type { UploadMetadata       } from 'firebase/storage';             // What: Upload Metadata. Why: The tests vary a file's type and metadata. How: This types them.

// #endregion Imports



/**
 * storage.spec.ts = Storage Rules Spec
 *
 * @summary
 * Checks storage.rules in the local Firebase Emulators, which npm run
 * test:rules starts and stops around this suite, under a demo project that can
 * never reach a real one. Each test acts as a chosen identity, or as nobody
 * signed in, and expects its requests allowed or refused: a chat history
 * transfer uploaded by the claimant of its request, downloaded by its asker,
 * and deleted by either, a member's own profile photo, and an event's full
 * photos, each one bounded binary file.
 *
 * The rules read the history request, the group's members, and each photo's
 * document from Firestore.
 * The Storage emulator reads them from the demo-come-hang project alone, so
 * this suite seeds that project with the rules off, and the Firestore suite
 * keeps its own data under a project of its own.
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

const AVA_MAX_NUM = 64 * 1024;                                    // What: Avatar Maximum Number. Why: A profile photo holds at most 64 KB. How: This is the limit in bytes.
const AVA_PAT_STR = 'avatars/gro1/bob';                           // What: Avatar Path String. Why: The profile photo tests work on Bob's photo in the group. How: This is its Storage path.
const BIN_MET_OBJ = { contentType : 'application/octet-stream' }; // What: Binary Metadata Object. Why: Every file is uploaded as generic binary. How: This is the metadata every valid upload carries.
const HIS_PAT_STR = 'groups/gro1/historyRequests/alice';          // What: History Path String. Why: Every test's transfer answers Alice's request. How: This is its Firestore path.
const PHO_MAX_NUM = 1024 * 1024;                                  // What: Photo Maximum Number. Why: A full photo holds at most 1 MB. How: This is the limit in bytes.
const PHO_PAT_STR = 'photos/gro1/eve1/pho1';                      // What: Photo Path String. Why: The event photo tests work on one full photo. How: This is its Storage path.
const TRA_MAX_NUM = 25 * 1024 * 1024;                             // What: Transfer Maximum Number. Why: A bundle holds at most 25 MB. How: This is the limit in bytes.
const TRA_PAT_STR = 'groupHistoryTransfers/gro1/alice';           // What: Transfer Path String. Why: Every test works on the bundle for Alice's request. How: This is its Storage path.

// #endregion Constants



// #region Module State

const RUL_TEX_STR = readFileSync( 'storage.rules', 'utf8' ); // What: Rules Text String. Why: The emulator loads the real rules. How: This reads the file once.



let stoEnvObj : RulesTestEnvironment; // What: Storage Environment Object. Why: Every test reaches the emulators through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const accStoFun = ( uidValStr : string ) => stoEnvObj.authenticatedContext( uidValStr ).storage(); // What: Account Storage Function. Why: Each test acts as a chosen identity. How: This returns Storage as that identity sees it.



// #region seeDocFun

/**
 * seeDocFun = Seed Document Function
 *
 * @summary
 * Writes a Firestore document with the rules turned off, so a test can set
 * up the members and history request the Storage rules read.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The document's path.
 * @param datValObj - Data Value Object: The document's fields.
 *
 * @returns A promise that settles once the document is written, with no
 *          value.
 *
 * @example
 * ```ts
 * seeDocFun(HIS_PAT_STR, { status : 'claimed' }) // => Promise<void>
 * ```
 *
*/

const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => stoEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Seed Document Function. Why: Tests start from states only the app's other rules could reach. How: This writes the document with the rules off.

// #endregion seeDocFun



// #region seeGroFun

/**
 * seeGroFun = Seed Group Function
 *
 * @summary
 * Seeds the group a transfer belongs to: Alice, Bob, and Carol as members,
 * with Alice's history request claimed by Bob, or in another state a test
 * names.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param hisDatObj - History Data Object: The request's fields, claimed by
 *                    Bob by default.
 *
 * @returns A promise that settles once every document is written, with no
 *          value.
 *
 * @example
 * ```ts
 * seeGroFun({ claimedByUid : null, status : 'pending' }) // => Promise<void>
 * ```
 *
*/

const seeGroFun = async ( hisDatObj : Record< string, unknown > = { claimedByUid : 'bob', status : 'claimed' } ) => { // What: Seed Group Function. Why: Every transfer rule reads the request and the members. How: This writes the three members, then the request.


	await seeDocFun( 'groups/gro1/members/alice', { joinedAt : 1000 } ); // What: Alice Member Seed. Why: Alice asked for history. How: This makes her a member.
	await seeDocFun( 'groups/gro1/members/bob', { joinedAt : 1000 } );   // What: Bob Member Seed. Why: Bob claims the request. How: This makes him a member.
	await seeDocFun( 'groups/gro1/members/carol', { joinedAt : 1000 } ); // What: Carol Member Seed. Why: Carol stands for every other member. How: This makes her a member.
	await seeDocFun( HIS_PAT_STR, hisDatObj );                           // What: Request Seed. Why: The claim decides who uploads. How: This writes Alice's request.


};

// #endregion seeGroFun



// #region remDocFun

/**
 * remDocFun = Remove Document Function
 *
 * @summary
 * Deletes a Firestore document with the rules turned off, so a test can
 * have a member leave the group.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The document's path.
 *
 * @returns A promise that settles once the document is deleted, with no
 *          value.
 *
 * @example
 * ```ts
 * remDocFun('groups/gro1/members/bob') // => Promise<void>
 * ```
 *
*/

const remDocFun = ( patValStr : string ) => stoEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => deleteDoc( doc( cotAdmObj.firestore(), patValStr ) ) ); // What: Remove Document Function. Why: A member leaving is a state the app's other rules reach. How: This deletes the document with the rules off.

// #endregion remDocFun



// #region uplFilFun

/**
 * uplFilFun = Upload File Function
 *
 * @summary
 * Uploads a file as a chosen identity, filled with zeros to a chosen size and
 * carrying chosen metadata, to the bundle for Alice's request unless another
 * path is given.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param stoValObj - Storage Value Object: The identity's Storage.
 * @param bytCouNum - Byte Count Number: The file's size, 10 by default.
 * @param metValObj - Metadata Value Object: The file's metadata, {@link
 *                    BIN_MET_OBJ} by default.
 * @param patValStr - Path Value String: Where the file goes, {@link
 *                    TRA_PAT_STR} by default.
 *
 * @returns A promise that resolves with the upload's result.
 *
 * @example
 * ```ts
 * uplFilFun(accStoFun('bob')) // => { ref, metadata }
 * ```
 *
*/

const uplFilFun = ( stoValObj : FirebaseStorage, bytCouNum = 10, metValObj : UploadMetadata = BIN_MET_OBJ, patValStr = TRA_PAT_STR ) => uploadBytes( ref( stoValObj, patValStr ), new Uint8Array( bytCouNum ), metValObj ); // What: Upload File Function. Why: Most tests upload the same file with one thing changed. How: This uploads zeros of the given size with the given metadata to the given path.

// #endregion uplFilFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects with the real rules.


	stoEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every test reaches the emulators through it. How: This connects to Storage, and to the Firestore its rules read, under the demo project.


		firestore : { host : '127.0.0.1', port : 8200 },                     // What: Firestore Options. Why: The tests seed the documents the rules read. How: This names the address firebase.json gives the emulator.
		projectId : 'demo-come-hang',                                        // What: Project Identifier. Why: A demo project can never reach a real one, and the Storage emulator's rules read this project's Firestore. How: This names it, matching the project test:rules starts.
		storage   : { host : '127.0.0.1', port : 8220, rules : RUL_TEX_STR } // What: Storage Options. Why: The emulator has to check the real rules. How: This names its address, the port firebase.json gives it, and the rules text.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await stoEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from empty storage and documents. How: This clears both.


	await stoEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's documents. How: This clears the project's Firestore.
	await stoCleFun( stoEnvObj );     // What: Storage Clear Call. Why: No test sees another's files. How: This clears the bucket, folders included.


} );



test( 'the claimant uploads a bundle that only its asker downloads, and the asker deletes it', async () => { // What: Transfer Test. Why: History goes from the member who claimed the request to the member who asked, and nobody else sees it (Section 11.9). How: This uploads as each member, downloads as each, then deletes, checking who the rules let through.


	const aliStoObj = accStoFun( 'alice' ); // What: Alice Storage Object. Why: Alice asked for history. How: This acts as her.
	const bobStoObj = accStoFun( 'bob' );   // What: Bob Storage Object. Why: Bob claimed the request. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Storage Object. Why: Carol stands for every other member. How: This acts as her.


	await seeGroFun(); // What: Group Seed Call. Why: The rules read the request and members. How: This writes them, with Bob holding the claim.

	await assertFails( uplFilFun( carStoObj ) );                                                       // What: Other Member Upload. Why: Only the claimant uploads, so one bundle answers each request. How: This expects Carol refused.
	await assertSucceeds( uplFilFun( bobStoObj ) );                                                    // What: Claimant Upload. Why: The claimant shares their history. How: This expects Bob's upload allowed.
	await assertSucceeds( uplFilFun( bobStoObj, 20 ) );                                                // What: Claimant Retry. Why: A claimant replaces an attempt that went wrong. How: This expects Bob's second upload allowed.
	await assertFails( getBytes( ref( carStoObj, TRA_PAT_STR ) ) );                                    // What: Other Member Download. Why: A bundle is for its asker alone. How: This expects Carol refused.
	await assertFails( getBytes( ref( bobStoObj, TRA_PAT_STR ) ) );                                    // What: Claimant Download. Why: The claimant already has the history. How: This expects Bob refused.
	await assertFails( getBytes( ref( stoEnvObj.unauthenticatedContext().storage(), TRA_PAT_STR ) ) ); // What: Signed-Out Download. Why: A bundle needs an identity behind its download. How: This expects nobody signed in refused.
	await assertSucceeds( getBytes( ref( aliStoObj, TRA_PAT_STR ) ) );                                 // What: Asker Download. Why: The asker merges the history into their own device. How: This expects Alice's download allowed.
	await assertFails( listAll( ref( aliStoObj, 'groupHistoryTransfers/gro1' ) ) );                    // What: Transfer Listing. Why: Nobody learns which members asked for history by listing them. How: This expects listing the group's transfers refused.
	await assertFails( deleteObject( ref( carStoObj, TRA_PAT_STR ) ) );                                // What: Other Member Delete. Why: Only the asker and the claimant remove a bundle. How: This expects Carol refused.
	await assertSucceeds( deleteObject( ref( aliStoObj, TRA_PAT_STR ) ) );                             // What: Asker Delete. Why: The asker removes the bundle once it's merged. How: This expects Alice's delete allowed.


} );



test( 'a bundle is one binary file of 1 byte to 25 MB with no custom metadata', async () => { // What: Bundle Shape Test. Why: A bundle is encrypted, so only its size and form can be checked, and plain metadata would sit beside it unencrypted (Section 11.9). How: This uploads with one fault at a time, then at the size limit, checking each fault fails and the limit passes.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Storage Object. Why: Bob uploads the bundles. How: This acts as him.


	await seeGroFun(); // What: Group Seed Call. Why: The rules read the request and members. How: This writes them, with Bob holding the claim.

	await assertFails( uplFilFun( bobStoObj, 10, { contentType : 'text/html' } ) );                               // What: Page Type. Why: A browser could render a file typed as a page. How: This expects an HTML type refused.
	await assertFails( uplFilFun( bobStoObj, 10, { ...BIN_MET_OBJ, customMetadata : { senderName : 'Bob' } } ) ); // What: Custom Metadata. Why: Metadata is stored unencrypted. How: This expects any refused.
	await assertFails( uplFilFun( bobStoObj, 0 ) );                                                               // What: Empty Bundle. Why: A bundle holds at least one message. How: This expects an empty file refused.
	await assertFails( uplFilFun( bobStoObj, TRA_MAX_NUM + 1 ) );                                                 // What: Oversized Bundle. Why: A bundle holds at most 25 MB. How: This expects one byte more refused.
	await assertSucceeds( uplFilFun( bobStoObj, TRA_MAX_NUM ) );                                                  // What: Largest Bundle. Why: A bundle may fill the whole 25 MB. How: This expects one at the limit allowed.


} );



test( 'an upload needs a standing claim, with the claimant and the asker both still in the group', async () => { // What: Claim Test. Why: History is shared only through a live claim and only between current members (Section 11.9). How: This seeds the request in each state that should block an upload, then a claimant's withdrawal, checking each upload fails and the withdrawal passes.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Storage Object. Why: Bob uploads the bundles. How: This acts as him.


	await seeGroFun( { claimedByUid : null, status : 'pending' } ); // What: Pending Seed Call. Why: A request nobody has claimed takes no bundle yet. How: This writes the request unclaimed.

	await assertFails( uplFilFun( bobStoObj ) ); // What: Unclaimed Upload. Why: A member claims a request before sharing. How: This expects Bob refused.

	await seeDocFun( HIS_PAT_STR, { claimedByUid : 'bob', status : 'fulfilled' } ); // What: Fulfilled Seed Call. Why: A finished request takes no new bundle. How: This marks it fulfilled with Bob as its claimant.

	await assertFails( uplFilFun( bobStoObj ) );                        // What: Fulfilled Upload. Why: The asker already has their history. How: This expects Bob refused.
	await assertFails( deleteObject( ref( bobStoObj, TRA_PAT_STR ) ) ); // What: Fulfilled Claimant Delete. Why: Once the claim is over, the bundle is the asker's to remove. How: This expects Bob refused.

	await seeGroFun(); // What: Claimed Seed Call. Why: The remaining checks start from a standing claim. How: This writes the request claimed by Bob.

	await assertSucceeds( uplFilFun( bobStoObj ) );                        // What: Claimant Upload. Why: The claim stands and both are members. How: This expects Bob's upload allowed.
	await assertSucceeds( deleteObject( ref( bobStoObj, TRA_PAT_STR ) ) ); // What: Claimant Withdrawal. Why: A claimant may take back their bundle while the claim stands. How: This expects Bob's delete allowed.

	await remDocFun( 'groups/gro1/members/bob' ); // What: Claimant Leave Call. Why: A claimant can leave the group before uploading. How: This deletes Bob's membership.

	await assertFails( uplFilFun( bobStoObj ) ); // What: Departed Claimant Upload. Why: Someone who has left shares nothing more. How: This expects Bob refused.

	await seeGroFun(); // What: Claimant Return Call. Why: The next checks need Bob back. How: This writes the members and request again.

	await stoEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await uplFilFun( cotAdmObj.storage() ); } ); // What: Bundle Seed Call. Why: The download check needs a bundle in place. How: This uploads one with the rules off.

	await remDocFun( 'groups/gro1/members/alice' ); // What: Asker Leave Call. Why: An asker can leave before collecting. How: This deletes Alice's membership.

	await assertFails( uplFilFun( bobStoObj ) );                               // What: Departed Asker Upload. Why: History goes only to a current member. How: This expects Bob's upload for Alice refused.
	await assertFails( getBytes( ref( accStoFun( 'alice' ), TRA_PAT_STR ) ) ); // What: Departed Asker Download. Why: History goes only to a current member. How: This expects Alice's download refused.


} );



test( 'a member uploads, replaces, and deletes only their own profile photo, which only members download', async () => { // What: Avatar Test. Why: A profile photo is its member's to set, and the group's to see (Section 21). How: This uploads, downloads, and deletes Bob's photo as each person, checking who the rules let through.


	const bobStoObj = accStoFun( 'bob' );   // What: Bob Storage Object. Why: Bob sets his own photo. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Storage Object. Why: Carol stands for every other member. How: This acts as her.
	const davStoObj = accStoFun( 'dave' );  // What: Dave Storage Object. Why: Dave isn't in the group. How: This acts as him.


	await seeGroFun(); // What: Group Seed Call. Why: The rules read the members. How: This writes them.

	await assertFails( uplFilFun( carStoObj, 100, BIN_MET_OBJ, AVA_PAT_STR ) );                        // What: Photo For Another. Why: Only Bob sets his photo. How: This expects Carol refused.
	await assertFails( uplFilFun( davStoObj, 100, BIN_MET_OBJ, 'avatars/gro1/dave' ) );                // What: Outsider Photo. Why: Someone outside the group keeps no photo in it. How: This expects Dave's own refused.
	await assertSucceeds( uplFilFun( bobStoObj, 100, BIN_MET_OBJ, AVA_PAT_STR ) );                     // What: Own Photo Upload. Why: A member sets their own photo. How: This expects Bob allowed.
	await assertSucceeds( uplFilFun( bobStoObj, 200, BIN_MET_OBJ, AVA_PAT_STR ) );                     // What: Own Photo Replaced. Why: A member changes their photo. How: This expects Bob's second upload allowed.
	await assertSucceeds( getBytes( ref( carStoObj, AVA_PAT_STR ) ) );                                 // What: Member Photo Download. Why: Members see each other's photos. How: This expects Carol's download allowed.
	await assertFails( getBytes( ref( davStoObj, AVA_PAT_STR ) ) );                                    // What: Outsider Photo Download. Why: Photos are for the group only. How: This expects Dave refused.
	await assertFails( getBytes( ref( stoEnvObj.unauthenticatedContext().storage(), AVA_PAT_STR ) ) ); // What: Signed-Out Photo Download. Why: A photo needs an identity behind its download. How: This expects nobody signed in refused.
	await assertFails( listAll( ref( carStoObj, 'avatars/gro1' ) ) );                                  // What: Photo Listing. Why: Members find photos through their memberships, never by listing. How: This expects listing the group's photos refused.
	await assertFails( deleteObject( ref( carStoObj, AVA_PAT_STR ) ) );                                // What: Delete For Another. Why: Only Bob removes his photo. How: This expects Carol refused.
	await assertSucceeds( deleteObject( ref( bobStoObj, AVA_PAT_STR ) ) );                             // What: Own Photo Delete. Why: A member removes their photo. How: This expects Bob allowed.

	await remDocFun( 'groups/gro1/members/bob' ); // What: Member Leave Call. Why: A member can leave the group. How: This deletes Bob's membership.

	await assertFails( uplFilFun( bobStoObj, 100, BIN_MET_OBJ, AVA_PAT_STR ) ); // What: Departed Photo Upload. Why: Someone who has left keeps no photo in the group. How: This expects Bob refused.


} );



test( 'a profile photo is one binary file of 17 bytes to 64 KB with no custom metadata', async () => { // What: Avatar Shape Test. Why: A photo is encrypted, so only its size and form can be checked, and plain metadata would sit beside it unencrypted (Section 21). How: This uploads with one fault at a time, then at the size limit, checking each fault fails and the limit passes.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Storage Object. Why: Bob uploads the photos. How: This acts as him.


	await seeGroFun(); // What: Group Seed Call. Why: The rules read the members. How: This writes them.

	await assertFails( uplFilFun( bobStoObj, 100, { contentType : 'image/jpeg' }, AVA_PAT_STR ) );                        // What: Image Type. Why: A browser would render a file typed as an image. How: This expects a JPEG type refused.
	await assertFails( uplFilFun( bobStoObj, 100, { ...BIN_MET_OBJ, customMetadata : { name : 'Bob' } }, AVA_PAT_STR ) ); // What: Custom Metadata. Why: Metadata is stored unencrypted. How: This expects any refused.
	await assertFails( uplFilFun( bobStoObj, 16, BIN_MET_OBJ, AVA_PAT_STR ) );                                            // What: Empty Photo. Why: A photo holds an image beyond its 16-byte tag. How: This expects 16 bytes refused.
	await assertFails( uplFilFun( bobStoObj, AVA_MAX_NUM + 1, BIN_MET_OBJ, AVA_PAT_STR ) );                               // What: Oversized Photo. Why: A 256px photo fits well within 64 KB. How: This expects one byte more refused.
	await assertSucceeds( uplFilFun( bobStoObj, AVA_MAX_NUM, BIN_MET_OBJ, AVA_PAT_STR ) );                                // What: Largest Photo. Why: A photo may fill all 64 KB. How: This expects one at the limit allowed.


} );



test( 'a member uploads a full photo once, after adding its document as its uploader, which only members download', async () => { // What: Photo Test. Why: A full photo belongs to the document its uploader added first, and only Cloud Functions remove one (Section 20). How: This seeds Bob's photo document, then uploads, downloads, and deletes as each person, checking who the rules let through.


	const bobStoObj = accStoFun( 'bob' );   // What: Bob Storage Object. Why: Bob added the photo. How: This acts as him.
	const carStoObj = accStoFun( 'carol' ); // What: Carol Storage Object. Why: Carol stands for every other member. How: This acts as her.


	await seeGroFun(); // What: Group Seed Call. Why: The rules read the members. How: This writes them.

	await seeDocFun( 'groups/gro1/events/eve1/photos/pho1', { uploaderUid : 'bob' } ); // What: Photo Document Seed. Why: The upload follows the document its uploader adds. How: This writes Bob's.

	await assertFails( uplFilFun( carStoObj, 100, BIN_MET_OBJ, PHO_PAT_STR ) );             // What: Upload For Another. Why: Only the photo's uploader adds its full photo. How: This expects Carol refused.
	await assertFails( uplFilFun( bobStoObj, 100, BIN_MET_OBJ, 'photos/gro1/eve1/pho2' ) ); // What: Undocumented Upload. Why: A full photo needs its document first. How: This expects Bob's upload with none refused.
	await assertSucceeds( uplFilFun( bobStoObj, 100, BIN_MET_OBJ, PHO_PAT_STR ) );          // What: Uploader Upload. Why: The uploader adds the full photo. How: This expects Bob allowed.
	await assertFails( uplFilFun( bobStoObj, 200, BIN_MET_OBJ, PHO_PAT_STR ) );             // What: Photo Replaced. Why: A photo never changes once added. How: This expects Bob's second upload refused.
	await assertSucceeds( getBytes( ref( carStoObj, PHO_PAT_STR ) ) );                      // What: Member Download. Why: Members open the event's full photos. How: This expects Carol's download allowed.
	await assertFails( getBytes( ref( accStoFun( 'dave' ), PHO_PAT_STR ) ) );               // What: Outsider Download. Why: Photos are for the group only. How: This expects Dave refused.
	await assertFails( listAll( ref( carStoObj, 'photos/gro1/eve1' ) ) );                   // What: Photo Listing. Why: Members find photos through their documents, never by listing. How: This expects listing the event's photos refused.
	await assertFails( deleteObject( ref( bobStoObj, PHO_PAT_STR ) ) );                     // What: Uploader Delete. Why: A Cloud Function deletes the full photo with its document. How: This expects Bob refused.

	await seeDocFun( 'groups/gro1/events/eve1/photos/pho3', { uploaderUid : 'bob' } ); // What: Second Document Seed. Why: The next check needs a photo still to upload. How: This writes another of Bob's.

	await remDocFun( 'groups/gro1/members/bob' ); // What: Uploader Leave Call. Why: An uploader can leave before the upload finishes. How: This deletes Bob's membership.

	await assertFails( uplFilFun( bobStoObj, 100, BIN_MET_OBJ, 'photos/gro1/eve1/pho3' ) ); // What: Departed Upload. Why: Someone who has left adds nothing more. How: This expects Bob refused.


} );



test( 'a full photo is one binary file of 17 bytes to 1 MB with no custom metadata', async () => { // What: Photo Shape Test. Why: A full photo is encrypted, so only its size and form can be checked, and plain metadata would sit beside it unencrypted (Section 20). How: This uploads with one fault at a time, then at the size limit, checking each fault fails and the limit passes.


	const bobStoObj = accStoFun( 'bob' ); // What: Bob Storage Object. Why: Bob uploads the photos. How: This acts as him.


	await seeGroFun(); // What: Group Seed Call. Why: The rules read the members. How: This writes them.

	await seeDocFun( 'groups/gro1/events/eve1/photos/pho1', { uploaderUid : 'bob' } ); // What: Photo Document Seed. Why: Every upload follows Bob's document. How: This writes it.

	await assertFails( uplFilFun( bobStoObj, 100, { contentType : 'image/jpeg' }, PHO_PAT_STR ) );                           // What: Image Type. Why: A browser would render a file typed as an image. How: This expects a JPEG type refused.
	await assertFails( uplFilFun( bobStoObj, 100, { ...BIN_MET_OBJ, customMetadata : { place : 'Beach' } }, PHO_PAT_STR ) ); // What: Custom Metadata. Why: Metadata is stored unencrypted. How: This expects any refused.
	await assertFails( uplFilFun( bobStoObj, 16, BIN_MET_OBJ, PHO_PAT_STR ) );                                               // What: Empty Photo. Why: A photo holds an image beyond its 16-byte tag. How: This expects 16 bytes refused.
	await assertFails( uplFilFun( bobStoObj, PHO_MAX_NUM + 1, BIN_MET_OBJ, PHO_PAT_STR ) );                                  // What: Oversized Photo. Why: A photo shrunk to 1,600px fits well within 1 MB. How: This expects one byte more refused.
	await assertSucceeds( uplFilFun( bobStoObj, PHO_MAX_NUM, BIN_MET_OBJ, PHO_PAT_STR ) );                                   // What: Largest Photo. Why: A photo may fill the whole 1 MB. How: This expects one at the limit allowed.


} );

// #endregion Module Init


