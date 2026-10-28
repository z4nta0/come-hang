


// #region Imports

import { calCreFun                 } from '../support/callers.ts';        // What: Caller Create Function. Why: The tests call as signed-in and signed-out callers. How: This builds each one.
import { deleteApp                 } from 'firebase/app';                 // What: Delete App. Why: Each caller's app closes with the suite. How: This shuts one down.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the offer and the owner's notice are as they should be. How: This asserts on each call and read.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The group and the notice are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests seed and read Firestore past its rules. How: This connects to the emulator.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed the group. How: This writes a document.
import { test                      } from '@playwright/test';             // What: Test. Why: Each part of a decline is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Join and offer times are Firestore timestamps. How: This builds them.


import type { CalRecTyp            } from '../support/callers.ts';        // What: Caller Record Type. Why: The suite keeps its callers. How: This types them.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * offer-decline.spec.ts = Offer Decline Spec
 *
 * @summary
 * Checks the offer decline callable end to end in the local Firebase
 * Emulators, which npm run test:functions starts and stops around this
 * suite. Callers sign in anonymously through the Auth emulator and call the
 * function as the app will, while the tests seed and read the group past the
 * rules: a group owned by Alice and offered to Bob, with Carol as another
 * member.
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

let aliCalObj : CalRecTyp;            // What: Alice Caller Object. Why: Alice owns the group. How: This is set before the first test.
let bobCalObj : CalRecTyp;            // What: Bob Caller Object. Why: Bob is offered the group. How: This is set before the first test.
let carCalObj : CalRecTyp;            // What: Carol Caller Object. Why: Carol is a member with no part in the offer. How: This is set before the first test.
let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulator through it. How: This is set before the first test.
let sigOutObj : CalRecTyp;            // What: Signed-Out Object. Why: Someone with no sign-in tries the call. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check the group and the notice. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Notices are readable only by their owner. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};



const seeGroFun = () => funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Group Function. Why: A decline needs a standing offer. How: This writes gro1 owned by Alice and offered to Bob, with three memberships, with the rules off.


	const fsDatObj = cotAdmObj.firestore(); // What: Firestore Data Object. Why: The group lives in Firestore. How: This is Firestore with the rules off.


	await setDoc( doc( fsDatObj, 'groups/gro1' ), { chatTtlDays : 30, memberCount : 3, name : 'Picnic', ownerUid : aliCalObj.uidValStr, pendingOfferedAt : Timestamp.now(), pendingOwnerUid : bobCalObj.uidValStr } ); // What: Group Seed. Why: The group under offer. How: This writes it, owned by Alice and offered to Bob.

	for ( const calRecObj of [ aliCalObj, bobCalObj, carCalObj ] ) await setDoc( doc( fsDatObj, `groups/gro1/members/${ calRecObj.uidValStr }` ), { joinedAt : Timestamp.fromMillis( 1000 ) } ); // What: Member Seed Loop. Why: All three are members. How: This writes each membership.


} );

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator and four callers. How: This connects, then signs in Alice, Bob, and Carol and creates a signed-out caller.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read reaches the emulator through it. How: This connects to Firestore under the demo project.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The offer and the notice live there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it, matching the project test:functions starts.


	});

	aliCalObj = await calCreFun( 'alice', 'decOffFun' );         // What: Alice Caller Assignment. Why: Alice owns the group. How: This signs her in.
	bobCalObj = await calCreFun( 'bob', 'decOffFun' );           // What: Bob Caller Assignment. Why: Bob is offered the group. How: This signs him in.
	carCalObj = await calCreFun( 'carol', 'decOffFun' );         // What: Carol Caller Assignment. Why: Carol is another member. How: This signs her in.
	sigOutObj = await calCreFun( 'nobody', 'decOffFun', false ); // What: Signed-Out Assignment. Why: A caller with no sign-in is refused. How: This creates one without signing in.


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connections should close with the suite. How: This closes the environment and each caller's app.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The environment's connections close. How: This cleans it up.

	for ( const calRecObj of [ aliCalObj, bobCalObj, carCalObj, sigOutObj ] ) await deleteApp( calRecObj.appValObj ); // What: App Delete Loop. Why: Each caller's connections close, freeing its app name for the next spec. How: This deletes each app.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from an empty Firestore. How: This clears it.


	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's documents. How: This clears them.


} );



test( 'the member offered the group declines it, which clears the offer and tells the owner', async () => { // What: Decline Test. Why: The owner has to learn to pick someone else (Section 18). How: This declines as Bob, then reads the group and Alice's notice.


	await seeGroFun(); // What: Group Seed Call. Why: Bob needs a standing offer to decline. How: This writes the group.

	await bobCalObj.calValFun( { groupId : 'gro1' } ); // What: Decline Call. Why: Bob turns the offer down. How: This calls the function as Bob.

	expect( await reaDocFun( 'groups/gro1' ) ).toMatchObject( { pendingOfferedAt : null, pendingOwnerUid : null } );                                                                               // What: Offer Cleared. Why: A declined offer is used up. How: This expects both offer fields cleared.
	expect( await reaDocFun( `accounts/${ aliCalObj.uidValStr }/notices/offerDeclined-gro1` ) ).toMatchObject( { groupName : 'Picnic', kind : 'offerDeclined', otherUid : bobCalObj.uidValStr } ); // What: Owner Notice. Why: Alice learns who declined, and in which group. How: This expects her notice naming Bob.


} );



test( 'only the member offered the group declines it, while a standing offer lasts', async () => { // What: Refusal Test. Why: Nobody turns down an offer made to someone else, and a decline needs one to turn down (Section 18). How: This calls as each wrong caller and with bad IDs, then declines twice.


	await seeGroFun(); // What: Group Seed Call. Why: The refused calls must leave a real offer untouched. How: This writes the group.

	await expect( carCalObj.calValFun( { groupId : 'gro1' } ) ).rejects.toMatchObject( { code : 'functions/failed-precondition' } );      // What: Other Member Refused. Why: Carol wasn't offered the group. How: This expects her call refused.
	await expect( aliCalObj.calValFun( { groupId : 'gro1' } ) ).rejects.toMatchObject( { code : 'functions/failed-precondition' } );      // What: Owner Refused. Why: The owner withdraws rather than declines. How: This expects Alice's call refused.
	await expect( sigOutObj.calValFun( { groupId : 'gro1' } ) ).rejects.toMatchObject( { code : 'functions/unauthenticated' } );          // What: Signed-Out Refused. Why: A decline belongs to an identity. How: This expects the signed-out call refused.
	await expect( bobCalObj.calValFun( { groupId : 'gro1/members' } ) ).rejects.toMatchObject( { code : 'functions/invalid-argument' } ); // What: Path ID Refused. Why: A slash could reach another document. How: This expects an ID with one refused.
	await expect( bobCalObj.calValFun( { groupId : 'gro9' } ) ).rejects.toMatchObject( { code : 'functions/failed-precondition' } );      // What: Missing Group Refused. Why: There's no offer in a group that isn't there. How: This expects the call refused.

	expect( ( await reaDocFun( 'groups/gro1' ) )?.pendingOwnerUid ).toBe( bobCalObj.uidValStr ); // What: Offer Kept. Why: No refused call may touch the offer. How: This expects it still to name Bob.

	await bobCalObj.calValFun( { groupId : 'gro1' } ); // What: First Decline Call. Why: Bob's decline ends the offer. How: This calls as Bob.

	await expect( bobCalObj.calValFun( { groupId : 'gro1' } ) ).rejects.toMatchObject( { code : 'functions/failed-precondition' } ); // What: Second Decline Refused. Why: An offer that ended can't be declined again. How: This expects Bob's second call refused.


} );

// #endregion Module Init


