


// #region Imports

import { calCreFun                 } from '../support/callers.ts';        // What: Caller Create Function. Why: The tests call as signed-in and signed-out callers. How: This builds each one.
import { collection                } from 'firebase/firestore';           // What: Collection. Why: The deleted account's notices are a collection. How: This names it.
import { DBS_URL_STR               } from '../support/database.ts';       // What: Database URL String. Why: Presence is read in the instance the app and functions share. How: This names it.
import { deleteApp                 } from 'firebase/app';                 // What: Delete App. Why: Each caller's app closes with the suite. How: This shuts one down.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the data is gone, handed on, or untouched, as it should be. How: This asserts on what each check reads.
import { get                       } from 'firebase/database';            // What: Get. Why: Presence is read back. How: This reads a location once.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: Documents are read back after the call. How: This reads one document.
import { getDocs                   } from 'firebase/firestore';           // What: Get Docs. Why: The deleted account's notices are checked for. How: This reads a collection.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests seed and read the emulators past their rules, as the server would. How: This connects to them.
import { listAll                   } from 'firebase/storage';             // What: List All. Why: The deleted identity's history transfer is checked for. How: This lists a folder's files.
import { pusLisFun                 } from '../support/pushes.ts';         // What: Push List Function. Why: The heir's push is checked. How: This reads what reached a token.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Every Realtime Database read and write names a location. How: This builds a reference.
import { set                       } from 'firebase/database';            // What: Set. Why: The tests seed presence. How: This writes a location.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed the identity's documents. How: This writes a document.
import { ref as stoRefFun          } from 'firebase/storage';             // What: Storage Ref Function. Why: Storage's ref shares its name with the Realtime Database's. How: This imports it under a name of its own.
import { test                      } from '@playwright/test';             // What: Test. Why: Each part of the deletion is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A member's join time is a Firestore timestamp. How: This builds one at a chosen time.
import { tokSetFun                 } from '../support/pushes.ts';         // What: Token Set Function. Why: A push only goes to a stored token. How: This seeds one.
import { uploadBytes               } from 'firebase/storage';             // What: Upload Bytes. Why: The tests seed a history transfer. How: This uploads a file.


import type { CalRecTyp            } from '../support/callers.ts';        // What: Caller Record Type. Why: The suite keeps its callers. How: This types them.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * data-deletion.spec.ts = Data Deletion Spec
 *
 * @summary
 * Checks the data deletion callable end to end in the local Firebase
 * Emulators, which npm run test:functions starts and stops around this
 * suite. Callers sign in anonymously through the Auth emulator and call the
 * function as the app will, while the tests seed and read past the rules.
 * Alice owns a group with Bob and Carol in it, belongs to Bob's group, owns
 * a group she's alone in, and has asked to join a fourth, and the deletion
 * must leave each group right and nothing of hers behind.
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

const AUT_LOO_STR = 'http://127.0.0.1:8240/identitytoolkit.googleapis.com/v1/projects/demo-come-hang/accounts:lookup'; // What: Auth Lookup String. Why: Whether a sign-in record is gone is asked of the Auth emulator as a server would. How: This is its lookup address.
const BUC_URL_STR = 'gs://demo-come-hang.appspot.com';                                                                 // What: Bucket URL String. Why: The function deletes from Storage's default bucket, which the emulator names after the project. How: This names the same bucket for the seed and the check.

// #endregion Constants



// #region Module State

let aliCalObj : CalRecTyp;            // What: Alice Caller Object. Why: Alice deletes her data. How: This is set before the first test.
let bobCalObj : CalRecTyp;            // What: Bob Caller Object. Why: Bob joined Alice's group first, so it passes to him. How: This is set before the first test.
let carCalObj : CalRecTyp;            // What: Carol Caller Object. Why: Carol joined later, and was offered the group. How: This is set before the first test.
let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulators through it. How: This is set before the first test.
let sigOutObj : CalRecTyp;            // What: Signed-Out Object. Why: Someone with no sign-in tries the call. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check what's left in Firestore. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: The rules hide what's being checked. How: This reads it with them off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined once the document is gone. How: This returns it.


};



// #region seeAllFun

/**
 * seeAllFun = Seed All Function
 *
 * @summary
 * Seeds Alice's world: gro1, which she owns, with Bob, who joined before
 * Carol, and a standing offer to Carol; gro2, Bob's, which she belongs to;
 * gro3, which she owns alone; gro4, which she and Erin have asked to join;
 * her location, history request, presence, and history transfer in gro1;
 * every account, her notice and public key, and phones for Alice and Bob.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once everything is written, with no value.
 *
 * @example
 * ```ts
 * seeAllFun() // => Promise<void>
 * ```
 *
*/

const seeAllFun = async () : Promise< void > => { // What: Seed All Function. Why: The deletion is checked against every kind of thing an identity leaves. How: This writes each with the rules off.


	const aliUidStr = aliCalObj.uidValStr; // What: Alice UID String. Why: Most seeds name Alice. How: This reads her UID.
	const bobUidStr = bobCalObj.uidValStr; // What: Bob UID String. Why: Bob owns gro2 and inherits gro1. How: This reads his UID.
	const carUidStr = carCalObj.uidValStr; // What: Carol UID String. Why: Carol is in gro1 and was offered it. How: This reads her UID.



	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Call. Why: The seeds bypass the rules, as the server would. How: This writes every document, location, and file.


		const fsDatObj = cotAdmObj.firestore(); // What: Firestore Data Object. Why: Most of the seed is in Firestore. How: This is Firestore with the rules off.


		await setDoc( doc( fsDatObj, 'groups/gro1' ), { chatTtlDays : 30, countedUid : aliUidStr, currentInviteToken : 'tok1', memberCount : 3, name : 'Picnic', ownerUid : aliUidStr, pendingOfferedAt : Timestamp.now(), pendingOwnerUid : carUidStr } ); // What: Shared Group Seed. Why: Alice's group with others in it passes on. How: This writes it, owned by Alice, offered to Carol.
		await setDoc( doc( fsDatObj, `groups/gro1/members/${ aliUidStr }` ), { joinedAt : Timestamp.fromMillis( 1000 ) } );                                      // What: Alice Member Seed. Why: The owner is a member. How: This writes her membership, first.
		await setDoc( doc( fsDatObj, `groups/gro1/members/${ bobUidStr }` ), { joinedAt : Timestamp.fromMillis( 2000 ) } );                                      // What: Bob Member Seed. Why: Bob joined second, so he inherits. How: This writes his membership.
		await setDoc( doc( fsDatObj, `groups/gro1/members/${ carUidStr }` ), { joinedAt : Timestamp.fromMillis( 3000 ) } );                                      // What: Carol Member Seed. Why: Carol joined later, so she doesn't. How: This writes her membership.
		await setDoc( doc( fsDatObj, 'groups/gro2' ), { chatTtlDays : 30, countedUid : bobUidStr, memberCount : 2, name : 'Hike', ownerUid : bobUidStr, pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Member Group Seed. Why: Alice leaves a group she belongs to. How: This writes Bob's group.
		await setDoc( doc( fsDatObj, `groups/gro2/members/${ aliUidStr }` ), { joinedAt : Timestamp.fromMillis( 2000 ) } );                                      // What: Alice Member Seed. Why: Alice belongs to gro2. How: This writes her membership.
		await setDoc( doc( fsDatObj, `groups/gro2/members/${ bobUidStr }` ), { joinedAt : Timestamp.fromMillis( 1000 ) } );                                      // What: Bob Member Seed. Why: Bob owns gro2. How: This writes his membership.
		await setDoc( doc( fsDatObj, 'groups/gro3' ), { chatTtlDays : 30, countedUid : aliUidStr, currentInviteToken : 'tok3', memberCount : 1, name : 'Solo', ownerUid : aliUidStr, pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Alone Group Seed. Why: A group Alice is alone in is deleted. How: This writes it.
		await setDoc( doc( fsDatObj, `groups/gro3/members/${ aliUidStr }` ), { joinedAt : Timestamp.fromMillis( 1000 ) } );                                      // What: Alice Member Seed. Why: Alice is gro3's only member. How: This writes her membership.
		await setDoc( doc( fsDatObj, 'groups/gro4/joinRequests/erin' ), { nameText : 'Erin' } );                                                                 // What: Other Request Seed. Why: Someone else's request must stay. How: This writes Erin's.
		await setDoc( doc( fsDatObj, `groups/gro4/joinRequests/${ aliUidStr }` ), { nameText : 'Alice' } );                                                      // What: Alice Request Seed. Why: A typed name sits under a group nobody lists for her. How: This writes her request.
		await setDoc( doc( fsDatObj, `groups/gro1/liveLocations/${ aliUidStr }` ), { eventId : 'eve1' } );                                                       // What: Location Seed. Why: Her shared position goes. How: This writes it.
		await setDoc( doc( fsDatObj, `groups/gro1/historyRequests/${ aliUidStr }` ), { kind : 'recovery' } );                                                    // What: History Request Seed. Why: Her request for chat goes. How: This writes it.
		await setDoc( doc( fsDatObj, `accounts/${ aliUidStr }` ), { memberGroups : { gro2 : true }, ownedGroups : { gro1 : true, gro3 : true }, paid : true } ); // What: Alice Account Seed. Why: The account lists what she's in. How: This writes it.
		await setDoc( doc( fsDatObj, `accounts/${ aliUidStr }/notices/removed-gro9` ), { kind : 'removed' } );                                                   // What: Alice Notice Seed. Why: What's under her account goes with it. How: This writes a notice.
		await setDoc( doc( fsDatObj, `accounts/${ bobUidStr }` ), { memberGroups : { gro1 : true }, ownedGroups : { gro2 : true } } );                           // What: Bob Account Seed. Why: Bob's maps change as he inherits. How: This writes his account.
		await setDoc( doc( fsDatObj, `accounts/${ carUidStr }` ), { memberGroups : { gro1 : true }, ownedGroups : {} } );                                        // What: Carol Account Seed. Why: Carol's account mustn't change. How: This writes it.
		await setDoc( doc( fsDatObj, `users/${ aliUidStr }` ), { publicKey : 'x' } );                                                                            // What: Alice User Seed. Why: Her public key goes. How: This writes it.

		await set( ref( cotAdmObj.database( DBS_URL_STR ), `presence/gro1/${ aliUidStr }` ), { online : true } ); // What: Presence Seed. Why: Her presence goes. How: This marks her online.

		await uploadBytes( stoRefFun( cotAdmObj.storage( BUC_URL_STR ), `groupHistoryTransfers/gro1/${ aliUidStr }` ), new Uint8Array( 10 ) ); // What: Transfer Seed. Why: The bundle she asked for goes. How: This uploads it.


	} );

	await tokSetFun( funEnvObj, aliUidStr, 'tok-alice' ); // What: Alice Token Seed. Why: Her phone's token goes with her account. How: This registers it.
	await tokSetFun( funEnvObj, bobUidStr, 'tok-bob' );   // What: Bob Token Seed. Why: The heir's push is checked. How: This registers his phone.


};

// #endregion seeAllFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators and their callers. How: This connects, then signs in Alice, Bob, and Carol and creates a signed-out caller.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read reaches the emulators through it. How: This connects to the three databases the function clears.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: Presence lives there. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Most of an identity's data lives there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang',                    // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it, matching the project test:functions starts.
		storage   : { host : '127.0.0.1', port : 8220 }  // What: Storage Options. Why: History transfers live there. How: This names the address firebase.json gives its emulator.


	});

	aliCalObj = await calCreFun( 'alice', 'delDatFun' );         // What: Alice Caller Assignment. Why: Alice deletes her data. How: This signs her in.
	bobCalObj = await calCreFun( 'bob', 'delDatFun' );           // What: Bob Caller Assignment. Why: Bob inherits. How: This signs him in.
	carCalObj = await calCreFun( 'carol', 'delDatFun' );         // What: Carol Caller Assignment. Why: Carol stays a member. How: This signs her in.
	sigOutObj = await calCreFun( 'nobody', 'delDatFun', false ); // What: Signed-Out Assignment. Why: A caller with no sign-in is refused. How: This creates one without signing in.


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connections should close with the suite. How: This closes the environment and each caller's app.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The environment's connections close. How: This cleans it up.

	for ( const calRecObj of [ aliCalObj, bobCalObj, carCalObj, sigOutObj ] ) await deleteApp( calRecObj.appValObj ); // What: App Delete Loop. Why: Each caller's connections close. How: This deletes each app.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from empty databases and storage, whatever earlier specs left. How: This clears all three.


	await funEnvObj.clearDatabase();  // What: Database Clear Call. Why: No test sees another's Realtime Database data. How: This clears it.
	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's documents, such as a member an earlier spec left in gro1. How: This clears them.
	await funEnvObj.clearStorage();   // What: Storage Clear Call. Why: No test sees another's files. How: This clears the bucket.


} );



test( 'deleting data hands on, leaves, and deletes every group as it should, and leaves nothing of the identity behind', async () => { // What: Full Deletion Test. Why: Someone's data goes entirely, while the people they share groups with keep them (the privacy policy's rights). How: This seeds Alice's world, deletes her data, checks every group and every trace, then calls again.


	await seeAllFun(); // What: Seed Call. Why: There has to be data to delete. How: This writes Alice's world.

	await aliCalObj.calValFun(); // What: Delete Call. Why: Alice deletes her data. How: This calls the function as her.


	const aliUidStr = aliCalObj.uidValStr; // What: Alice UID String. Why: Most checks name Alice. How: This reads her UID.
	const bobUidStr = bobCalObj.uidValStr; // What: Bob UID String. Why: Bob's account and group are checked. How: This reads his UID.
	const carUidStr = carCalObj.uidValStr; // What: Carol UID String. Why: Carol's account is checked. How: This reads her UID.


	expect( await reaDocFun( 'groups/gro1' ) ).toMatchObject( { countedUid : aliUidStr, memberCount : 2, ownerUid : bobUidStr, pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Handover Assertion. Why: The group passes to the earliest member, with the offer cleared and Alice uncounted. How: This reads the group.
	expect( await reaDocFun( `groups/gro1/members/${ aliUidStr }` ) ).toBeUndefined();                                                         // What: Shared Membership Gone. Why: Alice leaves the group she handed on. How: This expects her membership gone.
	expect( await reaDocFun( `accounts/${ bobUidStr }` ) ).toMatchObject( { memberGroups : {}, ownedGroups : { gro1 : true, gro2 : true } } ); // What: Heir Account Assertion. Why: The group moves to the heir's owned map. How: This reads his maps.
	expect( await reaDocFun( `accounts/${ carUidStr }` ) ).toMatchObject( { memberGroups : { gro1 : true }, ownedGroups : {} } );              // What: Other Account Assertion. Why: Carol is still just a member. How: This reads her maps.
	expect( await reaDocFun( 'groups/gro2' ) ).toMatchObject( { countedUid : aliUidStr, memberCount : 1, ownerUid : bobUidStr } );             // What: Leave Assertion. Why: Alice leaves the group she belongs to, uncounted. How: This reads it.
	expect( await reaDocFun( `groups/gro2/members/${ aliUidStr }` ) ).toBeUndefined();                                                         // What: Member Membership Gone. Why: Her membership ends. How: This expects it gone.
	expect( await reaDocFun( 'groups/gro3' ) ).toBeUndefined();                                                                                // What: Alone Group Gone. Why: A group nobody else is in is deleted. How: This expects it gone.
	expect( await reaDocFun( 'invites/tok3' ) ).toBeUndefined();                                                                               // What: Alone Invite Gone. Why: Its link opens nothing. How: This expects its invite gone.
	expect( await reaDocFun( `groups/gro4/joinRequests/${ aliUidStr }` ) ).toBeUndefined();                                                    // What: Request Gone. Why: Her typed name goes. How: This expects her request gone.
	expect( await reaDocFun( 'groups/gro4/joinRequests/erin' ) ).toBeDefined();                                                                // What: Other Request Kept. Why: Only her data goes. How: This expects Erin's request still there.
	expect( await reaDocFun( `groups/gro1/liveLocations/${ aliUidStr }` ) ).toBeUndefined();                                                   // What: Location Gone. Why: Her position goes. How: This expects it gone.
	expect( await reaDocFun( `groups/gro1/historyRequests/${ aliUidStr }` ) ).toBeUndefined();                                                 // What: History Request Gone. Why: Her request goes. How: This expects it gone.
	expect( await reaDocFun( `accounts/${ aliUidStr }` ) ).toBeUndefined();                                                                    // What: Account Gone. Why: Her account goes. How: This expects it gone.
	expect( await reaDocFun( `accounts/${ aliUidStr }/pushToken/current` ) ).toBeUndefined();                                                  // What: Token Gone. Why: Her phone's token goes with the account. How: This expects it gone.
	expect( await reaDocFun( `users/${ aliUidStr }` ) ).toBeUndefined();                                                                       // What: Public Key Gone. Why: Her public key goes. How: This expects it gone.

	await expect.poll( () => reaDocFun( `accounts/${ bobUidStr }/notices/ownershipPassed-gro1` ) ).toMatchObject( { groupId : 'gro1', groupName : 'Picnic', kind : 'ownershipPassed' } ); // What: Heir Notice Assertion. Why: Bob learns the group is his, from the trigger that runs after the handover. How: This waits for his notice.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-bob' ) ).toEqual( [ { body : 'The owner deleted their data, so this group is yours now.', title : 'Picnic' } ] ); // What: Heir Push Assertion. Why: Bob is told at once too. How: This waits for his phone's push.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Leftover Check Call. Why: Nothing may have been written back under Alice's account, and her presence and transfer go. How: This reads each with the rules off.


		expect( ( await getDocs( collection( cotAdmObj.firestore(), `accounts/${ aliUidStr }/notices` ) ) ).docs ).toHaveLength( 0 );       // What: No Notices Left. Why: The trigger tells the heir, never the departed owner. How: This expects her notices empty.
		expect( ( await get( ref( cotAdmObj.database( DBS_URL_STR ), `presence/gro1/${ aliUidStr }` ) ) ).val() ).toBeNull();               // What: Presence Gone. Why: Whether she's online goes. How: This expects her entry empty.
		expect( ( await listAll( stoRefFun( cotAdmObj.storage( BUC_URL_STR ), 'groupHistoryTransfers/gro1' ) ) ).items ).toHaveLength( 0 ); // What: Transfer Gone. Why: Her bundle goes. How: This expects the folder empty.


	} );


	const looResObj = await fetch( AUT_LOO_STR, { body : JSON.stringify( { localId : [ aliUidStr ] } ), headers : { 'Authorization' : 'Bearer owner', 'Content-Type' : 'application/json' }, method : 'POST' } ); // What: Lookup Response Object. Why: Her sign-in record goes last. How: This asks the Auth emulator for it as a server.


	expect( ( await looResObj.json() as { users? : unknown[] } ).users ).toBeUndefined(); // What: Sign-In Gone Assertion. Why: No record of her sign-in may stay. How: This expects the lookup to find nobody. // What: Type Assertion Note. Why: The lookup's JSON is typed as unknown. How: The as reads its users list.

	await expect( aliCalObj.calValFun() ).resolves.toBeDefined(); // What: Repeat Call Assertion. Why: A call after the data is gone, such as a retry whose answer was lost, has nothing left to do. How: This expects a second call to succeed quietly.


} );



test( 'only a signed-in caller deletes data', async () => { // What: Refusal Test. Why: Only an identity has data to delete. How: This calls with no sign-in and checks the error.


	await expect( sigOutObj.calValFun() ).rejects.toMatchObject( { code : 'functions/unauthenticated' } ); // What: Signed-Out Refused. Why: There's no identity to delete. How: This expects the call refused.


} );


