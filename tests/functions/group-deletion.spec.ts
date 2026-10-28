


// #region Imports

import { connectAuthEmulator       } from 'firebase/auth';                // What: Connect Auth Emulator. Why: Callers sign in against the local emulator. How: This points an Auth instance at it.
import { connectFunctionsEmulator  } from 'firebase/functions';           // What: Connect Functions Emulator. Why: The callable runs in the local emulator. How: This points a Functions instance at it.
import { deleteApp                 } from 'firebase/app';                 // What: Delete App. Why: Each caller's app closes with the suite. How: This shuts one down.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the group is gone, or untouched, as it should be. How: This asserts on what each read returns.
import { get                       } from 'firebase/database';            // What: Get. Why: The group's Realtime Database data is read back. How: This reads a location once.
import { getAuth                   } from 'firebase/auth';                // What: Get Auth. Why: Each caller has an identity. How: This returns an app's Auth instance.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: Documents are read back after the call. How: This reads one document.
import { getFunctions              } from 'firebase/functions';           // What: Get Functions. Why: Each caller calls the function. How: This returns an app's Functions instance in the function's region.
import { httpsCallable             } from 'firebase/functions';           // What: HTTPS Callable. Why: The app deletes a group through a callable. How: This builds the call.
import { initializeApp             } from 'firebase/app';                 // What: Initialize App. Why: Each caller is its own client app. How: This creates one under a name.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests seed and read the emulators past their rules, as the server would. How: This connects to them.
import { listAll                   } from 'firebase/storage';             // What: List All. Why: The group's history transfers are checked for. How: This lists a folder's files.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Every Realtime Database read and write names a location. How: This builds a reference.
import { set                       } from 'firebase/database';            // What: Set. Why: The tests seed the group's chat, presence, and mirror. How: This writes a location.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed the group's documents. How: This writes a document.
import { signInAnonymously         } from 'firebase/auth';                // What: Sign In Anonymously. Why: The app's identities are anonymous until linked. How: This signs a caller in.
import { ref as stoRefFun         } from 'firebase/storage';              // What: Storage Ref Function. Why: Storage's ref shares its name with the Realtime Database's. How: This imports it under its own name to build a file reference.
import { test                      } from '@playwright/test';             // What: Test. Why: Each part of the deletion is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A member's join time is a Firestore timestamp. How: This builds one at a chosen time.
import { uploadBytes               } from 'firebase/storage';             // What: Upload Bytes. Why: The tests seed a history transfer. How: This uploads a file.


import type { FirebaseApp          } from 'firebase/app';                 // What: Firebase App. Why: The suite keeps its callers' apps to close them. How: This types them.
import type { HttpsCallable        } from 'firebase/functions';           // What: HTTPS Callable. Why: Each caller holds the deletion call. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * group-deletion.spec.ts = Group Deletion Spec
 *
 * @summary
 * Checks the group deletion callable end to end in the local Firebase
 * Emulators, which npm run test:functions starts and stops around this
 * suite. Callers sign in anonymously through the Auth emulator and call the
 * function as the app will, while the tests seed and read the group's data
 * past the rules: its Firestore documents, its chat, presence, and mirror in
 * the Realtime Database, and its history transfers in Storage.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type CalRecTyp = { appValObj : FirebaseApp, delCalFun : HttpsCallable, uidValStr : string }; // What: Caller Record Type. Why: A caller's app, call, and UID travel together. How: This types the record calCreFun returns.

// #endregion Types



// #region Constants

const APP_OPT_OBJ = { apiKey : 'demo-key', projectId : 'demo-come-hang' }; // What: App Options Object. Why: A caller's app needs a project, and the emulators accept any key. How: This names the demo project test:functions starts.
const BUC_URL_STR = 'gs://demo-come-hang.appspot.com';                     // What: Bucket URL String. Why: The function deletes from Storage's default bucket, which the emulator names after the project with .appspot.com. How: This names the same bucket for the test's seed and check.

// #endregion Constants



// #region Module State

let aliCalObj : CalRecTyp;            // What: Alice Caller Object. Why: Alice owns the group. How: This is set before the first test.
let bobCalObj : CalRecTyp;            // What: Bob Caller Object. Why: Bob is a member who doesn't own it. How: This is set before the first test.
let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulators through it. How: This is set before the first test.
let sigOutObj : CalRecTyp;            // What: Signed-Out Object. Why: Someone with no sign-in tries the call. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region calCreFun

/**
 * calCreFun = Caller Create Function
 *
 * @summary
 * Creates a client app under its own name, connected to the Auth and
 * Functions emulators, signs it in anonymously unless told not to, and
 * returns its deletion call and UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param appNamStr - App Name String: The client app's name, unique to the
 *                    suite.
 * @param sigInnBoo - Sign In Boolean: Whether the caller signs in, true by
 *                    default.
 *
 * @returns A promise that resolves with the caller's app, call, and UID,
 *          which is empty for a caller who didn't sign in.
 *
 * @example
 * ```ts
 * calCreFun('alice') // => { appValObj, delCalFun, uidValStr }
 * ```
 *
*/

const calCreFun = async ( appNamStr : string, sigInnBoo = true ) : Promise< CalRecTyp > => { // What: Caller Create Function. Why: Each identity calls through its own app. How: This builds, connects, and signs in the app.


	const appValObj = initializeApp( APP_OPT_OBJ, appNamStr );  // What: App Value Object. Why: Each caller is its own client. How: This creates its app.
	const autValObj = getAuth( appValObj );                     // What: Auth Value Object. Why: The caller signs in. How: This is its Auth instance.
	const funValObj = getFunctions( appValObj, 'us-central1' ); // What: Functions Value Object. Why: The callable runs in us-central1. How: This is the caller's Functions instance there.


	connectAuthEmulator( autValObj, 'http://127.0.0.1:8240', { disableWarnings : true } ); // What: Auth Emulator Call. Why: Sign-in must stay local. How: This points Auth at the port firebase.json gives its emulator.

	connectFunctionsEmulator( funValObj, '127.0.0.1', 8230 ); // What: Functions Emulator Call. Why: The call must stay local. How: This points Functions at the port firebase.json gives its emulator.


	const uidValStr = sigInnBoo ? ( await signInAnonymously( autValObj ) ).user.uid : ''; // What: UID Value String. Why: The tests seed the caller's UID as owner or member. How: This signs in and reads it, or leaves it empty.



	return { appValObj, delCalFun : httpsCallable( funValObj, 'delGroFun' ), uidValStr }; // What: Caller Return. Why: Each test calls as this caller. How: This returns the app, the call, and the UID.


};

// #endregion calCreFun



const reaDbsFun = async ( patValStr : string ) : Promise< unknown > => { // What: Read Database Function. Why: Tests check what's left in the Realtime Database. How: This reads a location with the rules off and returns its value.


	let datValAny : unknown = null; // What: Data Value Any. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { datValAny = ( await get( ref( cotAdmObj.database(), patValStr ) ) ).val(); } ); // What: Database Read Call. Why: The rules hide what's being checked. How: This reads it with them off.



	return datValAny; // What: Data Return. Why: The test compares it. How: This returns it.


};



const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check what's left in Firestore. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: The rules hide what's being checked. How: This reads it with them off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined once the document is gone. How: This returns it.


};



// #region seeGroFun

/**
 * seeGroFun = Seed Group Function
 *
 * @summary
 * Seeds a group, gro1, owned by Alice with Bob as a member, holding one of
 * everything the deletion removes: its documents and their collections, its
 * invite, both accounts, its chat, presence, and mirror, and a history
 * transfer. Bob's account and the Realtime Database also hold another group,
 * gro2, which the deletion must leave alone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once everything is written, with no value.
 *
 * @example
 * ```ts
 * seeGroFun() // => Promise<void>
 * ```
 *
*/

const seeGroFun = () => funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Group Function. Why: The main test deletes a full group. How: This writes every part of it with the rules off.


	const fsDatObj = cotAdmObj.firestore(); // What: Firestore Data Object. Why: Most of the group is in Firestore. How: This is Firestore with the rules off.
	const reDatObj = cotAdmObj.database();  // What: Realtime Data Object. Why: The chat, presence, and mirror are in the Realtime Database. How: This is the database with the rules off.


	await setDoc( doc( fsDatObj, 'groups/gro1' ), { chatTtlDays : 30, currentInviteToken : 'tok1', name : 'Picnic', ownerUid : aliCalObj.uidValStr } ); // What: Group Seed. Why: The group being deleted. How: This writes it, owned by Alice.
	await setDoc( doc( fsDatObj, `groups/gro1/members/${ aliCalObj.uidValStr }` ), { joinedAt : Timestamp.fromMillis( 1000 ) } );                       // What: Owner Member Seed. Why: The owner is a member. How: This writes Alice's membership.
	await setDoc( doc( fsDatObj, `groups/gro1/members/${ bobCalObj.uidValStr }` ), { joinedAt : Timestamp.fromMillis( 2000 ) } );                       // What: Bob Member Seed. Why: Another member is told of the deletion. How: This writes Bob's membership.
	await setDoc( doc( fsDatObj, `accounts/${ aliCalObj.uidValStr }` ), { memberGroups : {}, ownedGroups : { gro1 : true } } );                         // What: Owner Account Seed. Why: The owner's slot frees up. How: This writes Alice's account owning gro1.
	await setDoc( doc( fsDatObj, `accounts/${ bobCalObj.uidValStr }` ), { memberGroups : { gro1 : true, gro2 : true }, ownedGroups : {} } );            // What: Bob Account Seed. Why: Only the deleted group leaves his account. How: This writes Bob's account in gro1 and gro2.
	await setDoc( doc( fsDatObj, 'invites/tok1' ), { groupId : 'gro1', groupName : 'Picnic' } );                                                        // What: Invite Seed. Why: The group's link stops working. How: This writes its invite.
	await setDoc( doc( fsDatObj, 'groups/gro1/events/eve1' ), { titleEnc : 'x' } );                                                                     // What: Event Seed. Why: Events go with the group. How: This writes one.
	await setDoc( doc( fsDatObj, 'groups/gro1/events/eve1/assignments/ite1' ), { label : 'x' } );                                                       // What: Item Seed. Why: A collection under a collection goes too. How: This writes one of the event's items.
	await setDoc( doc( fsDatObj, 'groups/gro1/joinRequests/carol' ), { name : 'Carol' } );                                                              // What: Join Request Seed. Why: Pending requests go with the group. How: This writes Carol's.

	await set( ref( reDatObj, 'chats/gro1/messages/msg1' ), { sentAt : 1 } ); // What: Chat Seed. Why: The group's chat goes. How: This writes a message.
	await set( ref( reDatObj, 'chats/gro2/messages/msg1' ), { sentAt : 1 } ); // What: Other Chat Seed. Why: Another group's chat must stay. How: This writes gro2's message.
	await set( ref( reDatObj, 'presence/gro1/bob' ), { online : true } );     // What: Presence Seed. Why: The group's presence goes. How: This marks Bob online.

	await uploadBytes( stoRefFun( cotAdmObj.storage( BUC_URL_STR ), 'groupHistoryTransfers/gro1/bob' ), new Uint8Array( 10 ) );                         // What: Transfer Seed. Why: The group's history transfers go. How: This uploads one.


} );

// #endregion seeGroFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators and three callers. How: This connects, then signs in Alice and Bob and creates a signed-out caller.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read reaches the emulators through it. How: This connects to the three databases the function clears.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: The chat, presence, and mirror live there. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Most of a group lives there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang',                    // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it, matching the project test:functions starts.
		storage   : { host : '127.0.0.1', port : 8220 }  // What: Storage Options. Why: History transfers live there. How: This names the address firebase.json gives its emulator.


	});

	aliCalObj = await calCreFun( 'alice' );         // What: Alice Caller Assignment. Why: Alice owns the group. How: This signs her in.
	bobCalObj = await calCreFun( 'bob' );           // What: Bob Caller Assignment. Why: Bob is a member. How: This signs him in.
	sigOutObj = await calCreFun( 'nobody', false ); // What: Signed-Out Assignment. Why: A caller with no sign-in is refused. How: This creates one without signing in.


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connections should close with the suite. How: This closes the environment and each caller's app.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The environment's connections close. How: This cleans it up.

	for ( const calRecObj of [ aliCalObj, bobCalObj, sigOutObj ] ) await deleteApp( calRecObj.appValObj ); // What: App Delete Loop. Why: Each caller's connections close. How: This deletes each app.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from empty databases and storage. How: This clears all three.


	await funEnvObj.clearDatabase();  // What: Database Clear Call. Why: No test sees another's Realtime Database data. How: This clears it.
	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's documents. How: This clears them.
	await funEnvObj.clearStorage();   // What: Storage Clear Call. Why: No test sees another's files. How: This clears the bucket.


} );



test( 'the owner deletes a group whole, freeing their slot and leaving each other member a notice', async () => { // What: Full Deletion Test. Why: A deleted group leaves nothing behind and nobody is left wondering where it went (Section 9). How: This seeds a full group, deletes it as Alice, then reads back every part.


	await seeGroFun(); // What: Group Seed Call. Why: There has to be a full group to delete. How: This writes one.

	await aliCalObj.delCalFun( { groupId : 'gro1' } ); // What: Delete Call. Why: The owner deletes the group. How: This calls the function as Alice.

	expect( await reaDocFun( 'groups/gro1' ) ).toBeUndefined();                                                    // What: Group Gone. Why: The group itself is deleted. How: This expects no document.
	expect( await reaDocFun( `groups/gro1/members/${ bobCalObj.uidValStr }` ) ).toBeUndefined();                   // What: Membership Gone. Why: Nobody keeps access. How: This expects Bob's member document gone.
	expect( await reaDocFun( 'groups/gro1/events/eve1/assignments/ite1' ) ).toBeUndefined();                       // What: Item Gone. Why: Collections nested under the group go too. How: This expects the item gone.
	expect( await reaDocFun( 'groups/gro1/joinRequests/carol' ) ).toBeUndefined();                                 // What: Join Request Gone. Why: A pending request has nothing left to join. How: This expects Carol's gone.
	expect( await reaDocFun( 'invites/tok1' ) ).toBeUndefined();                                                   // What: Invite Gone. Why: The link opens nothing. How: This expects the invite gone.
	expect( ( await reaDocFun( `accounts/${ aliCalObj.uidValStr }` ) )?.ownedGroups ).toEqual( {} );               // What: Owner Slot Freed. Why: The owner can start a new group. How: This expects gro1 gone from Alice's owned map.
	expect( ( await reaDocFun( `accounts/${ bobCalObj.uidValStr }` ) )?.memberGroups ).toEqual( { gro2 : true } ); // What: Member Slot Freed. Why: Only the deleted group leaves Bob's account. How: This expects gro2 alone in his member map.
	expect( await reaDocFun( `accounts/${ bobCalObj.uidValStr }/notices/groupDeleted-gro1` ) ).toMatchObject( { groupId : 'gro1', groupName : 'Picnic', kind : 'groupDeleted' } ); // What: Member Notice. Why: Bob is told the group was deleted, by name. How: This expects his notice.
	expect( await reaDocFun( `accounts/${ aliCalObj.uidValStr }/notices/groupDeleted-gro1` ) ).toBeUndefined();    // What: No Owner Notice. Why: The owner deleted it themselves. How: This expects Alice has none.
	expect( await reaDbsFun( 'chats/gro1' ) ).toBeNull();                                                          // What: Chat Gone. Why: The group's messages go. How: This expects its chat empty.
	expect( await reaDbsFun( 'presence/gro1' ) ).toBeNull();                                                       // What: Presence Gone. Why: Nobody is online in a deleted group. How: This expects its presence empty.
	expect( await reaDbsFun( 'chats/gro2' ) ).not.toBeNull();                                                      // What: Other Chat Kept. Why: Only the deleted group's data goes. How: This expects gro2's chat still there.

	await expect.poll( () => reaDbsFun( 'mirrors/gro1' ) ).toBeNull(); // What: Mirror Gone. Why: The rules' copy of the membership goes too, and the mirror's own triggers run after the deletion. How: This waits for it to be empty.

	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { expect( ( await listAll( stoRefFun( cotAdmObj.storage( BUC_URL_STR ), 'groupHistoryTransfers/gro1' ) ) ).items ).toHaveLength( 0 ); } ); // What: Transfers Gone. Why: A history bundle mustn't outlive its group. How: This expects the group's folder empty.


} );



test( 'only the signed-in owner deletes a group, by a well-formed ID, and a group already gone is no error', async () => { // What: Refusal Test. Why: Deleting a group is the owner's call alone, and the ID builds paths (Section 9). How: This calls as a member, as nobody, and with a malformed ID, checking each error and that the group stays, then calls for a missing group.


	await seeGroFun(); // What: Group Seed Call. Why: The refused calls must leave a real group untouched. How: This writes one.

	await expect( bobCalObj.delCalFun( { groupId : 'gro1' } ) ).rejects.toMatchObject( { code : 'functions/permission-denied' } );        // What: Member Refused. Why: Only the owner deletes. How: This expects Bob's call refused.
	await expect( sigOutObj.delCalFun( { groupId : 'gro1' } ) ).rejects.toMatchObject( { code : 'functions/unauthenticated' } );          // What: Signed-Out Refused. Why: Only an identity can own a group. How: This expects the signed-out call refused.
	await expect( aliCalObj.delCalFun( { groupId : 'gro1/members' } ) ).rejects.toMatchObject( { code : 'functions/invalid-argument' } ); // What: Path ID Refused. Why: A slash could reach another document. How: This expects an ID with one refused.
	await expect( aliCalObj.delCalFun( {} ) ).rejects.toMatchObject( { code : 'functions/invalid-argument' } );                           // What: Missing ID Refused. Why: The call has to name a group. How: This expects a call without one refused.
	await expect( aliCalObj.delCalFun( { groupId : 'gro9' } ) ).resolves.toBeDefined();                                                   // What: Missing Group Quiet. Why: A group already gone means an earlier call finished. How: This expects the call to succeed.

	expect( await reaDocFun( `groups/gro1/members/${ bobCalObj.uidValStr }` ) ).toBeDefined(); // What: Group Kept. Why: No refused call may have touched the group. How: This expects Bob's membership still there.


} );



test( "the owner's retry finishes a deletion that stopped partway", async () => { // What: Retry Test. Why: A failure partway is completed rather than left half done (Section 9). How: This seeds a group whose first batch already landed, calls again as the owner, and checks the rest is gone.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Partial Seed Call. Why: A stopped deletion leaves the group document and its other collections behind. How: This writes the group, its owner's account, and an event, with no members.


		await setDoc( doc( cotAdmObj.firestore(), 'groups/gro1' ), { chatTtlDays : 30, currentInviteToken : 'tok1', name : 'Picnic', ownerUid : aliCalObj.uidValStr } ); // What: Group Seed. Why: The group document goes last, so it's still there. How: This writes it.
		await setDoc( doc( cotAdmObj.firestore(), `accounts/${ aliCalObj.uidValStr }` ), { memberGroups : {}, ownedGroups : {} } );                                      // What: Owner Account Seed. Why: The first batch already freed the owner's slot. How: This writes Alice's account without gro1.
		await setDoc( doc( cotAdmObj.firestore(), 'groups/gro1/events/eve1' ), { titleEnc : 'x' } );                                                                     // What: Event Seed. Why: The stop came before the other collections went. How: This writes one event.


	} );

	await aliCalObj.delCalFun( { groupId : 'gro1' } ); // What: Retry Call. Why: The owner tries again. How: This calls the function as Alice.

	expect( await reaDocFun( 'groups/gro1/events/eve1' ) ).toBeUndefined(); // What: Event Gone. Why: The retry finishes the collections. How: This expects the event gone.
	expect( await reaDocFun( 'groups/gro1' ) ).toBeUndefined();             // What: Group Gone. Why: The retry ends with the group document. How: This expects it gone.


} );

// #endregion Module Init


