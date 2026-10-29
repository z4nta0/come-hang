


// #region Imports

import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: A leave or removal deletes a membership. How: This deletes a document.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the right person was told, and nobody else. How: This asserts on what each read returns.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: Notices and groups are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests write as the server would. How: This connects to the emulators.
import { pusLisFun                 } from '../support/pushes.ts';         // What: Push List Function. Why: The removal and offer pushes are checked. How: This reads what reached a token.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: The tests seed groups and memberships. How: This writes a document.
import { test                      } from '@playwright/test';             // What: Test. Why: Each kind of change is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Join and offer times are Firestore timestamps. How: This builds them.
import { tokSetFun                 } from '../support/pushes.ts';         // What: Token Set Function. Why: A push only goes to a stored token. How: This seeds one.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: Every change the trigger watches is a group update. How: This updates a document.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * group-changes.spec.ts = Group Changes Spec
 *
 * @summary
 * Checks the group change trigger end to end in the local Firebase
 * Emulators, which npm run test:functions starts and stops around this
 * suite. Removals, leaves, and acceptances are written with the rules off,
 * as their batches would leave the group, and each test then polls for the
 * notices the change should leave.
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

const datDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => updateDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) );                                          // What: Data Document Function. Why: Most changes are written as their batches would leave the group. How: This updates the document with the rules off.
const remDocFun = ( patValStr : string ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => deleteDoc( doc( cotAdmObj.firestore(), patValStr ) ) );                                                                                            // What: Remove Document Function. Why: A leave or removal ends a membership. How: This deletes the document with the rules off.
const seeClaFun = ( groIdeStr : string ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/ownerClaim/current` ), { exhaustedAt : null, offeredUid : 'bob', passedUids : {} } ) ); // What: Seed Claim Function. Why: Some offers to Bob are claims the daily run made. How: This writes a claim record naming Bob with the rules off.



const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check notices and groups. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Notices are readable only by their owner. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};



// #region seeGroFun

/**
 * seeGroFun = Seed Group Function
 *
 * @summary
 * Seeds a group owned by Alice, with Alice, Bob, and Carol as members, and
 * ownership standing offered to Bob, in the shape the rules accept.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID, so each change
 *                    can have a group of its own.
 *
 * @returns A promise that settles once the group is written, with no value.
 *
 * @example
 * ```ts
 * seeGroFun('gro1') // => Promise<void>
 * ```
 *
*/

const seeGroFun = ( groIdeStr : string ) => funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Group Function. Why: Every change starts from a group with a standing offer. How: This writes the group and its three memberships with the rules off.


	const fsDatObj = cotAdmObj.firestore(); // What: Firestore Data Object. Why: The group lives in Firestore. How: This is Firestore with the rules off.


	await setDoc( doc( fsDatObj, `groups/${ groIdeStr }` ), { // What: Group Seed. Why: The group under change. How: This writes every field the rules expect, owned by Alice and offered to Bob.


		chatTtlDays        : 30,
		countedUid         : 'carol',
		createdAt          : Timestamp.fromMillis( 1000 ),
		currentInviteToken : 'tok1',
		memberCount        : 3,
		name               : 'Picnic',
		ownerUid           : 'alice',
		pendingOfferedAt   : Timestamp.now(),
		pendingOwnerUid    : 'bob',
		removedUids        : {}


	});

	for ( const uidValStr of [ 'alice', 'bob', 'carol' ] ) await setDoc( doc( fsDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), { joinedAt : Timestamp.fromMillis( 1000 ) } ); // What: Member Seed Loop. Why: All three are members. How: This writes each membership.


} );

// #endregion seeGroFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed, write, and read reaches the emulators through it. How: This connects to Firestore under the demo project.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The trigger watches Firestore. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it, matching the project test:functions starts.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from an empty Firestore. How: This clears it.


	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's documents. How: This clears them.


} );



test( 'a removed member is told, and the owner is told when the member offered the group leaves, which clears the offer', async () => { // What: Removal And Leave Test. Why: Nobody should find a group gone or an offer silently dead (Sections 9 and 18). How: This removes Carol from one group, then renames it after she dismisses her notice, and has Bob leave another, polling for each notice and the cleared offer.


	await seeGroFun( 'gro1' ); // What: Removal Group Seed. Why: Carol is removed from this one. How: This writes it.
	await seeGroFun( 'gro2' ); // What: Leave Group Seed. Why: Bob leaves this one. How: This writes it.

	await tokSetFun( funEnvObj, 'alice', 'tok-alice' ); // What: Alice Token Seed. Why: The owner's offer push is checked. How: This registers Alice's phone.
	await tokSetFun( funEnvObj, 'carol', 'tok-carol' ); // What: Carol Token Seed. Why: The removal push is checked. How: This registers Carol's phone.

	await remDocFun( 'groups/gro1/members/carol' ); // What: Carol Membership Delete. Why: A removal ends the membership. How: This deletes Carol's.

	await datDocFun( 'groups/gro1', { countedUid : 'carol', memberCount : 2, removedUids : { carol : true } } ); // What: Removal Update. Why: A removal blocks the member as the count falls for them. How: This writes the group as the removal leaves it.

	await expect.poll( async () => ( await reaDocFun( 'accounts/carol/notices/removed-gro1' ) )?.kind ).toBe( 'removed' ); // What: Removal Notice. Why: Carol is told she was removed. How: This waits for her notice.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-carol' ) ).toEqual( [ { body : 'You were removed from this group.', title : 'Picnic' } ] ); // What: Removal Push. Why: Carol is told at once too. How: This waits for her phone's push.

	await remDocFun( 'accounts/carol/notices/removed-gro1' ); // What: Notice Dismiss Call. Why: Carol has read her notice. How: This deletes it.

	await datDocFun( 'groups/gro1', { name : 'Beach Day' } ); // What: Rename Update. Why: A later change to the group isn't another removal. How: This renames the group.

	await remDocFun( 'groups/gro2/members/bob' ); // What: Bob Membership Delete. Why: A leave ends the membership. How: This deletes Bob's.

	await datDocFun( 'groups/gro2', { countedUid : 'bob', memberCount : 2 } ); // What: Leave Update. Why: A leave lowers the count for the member leaving. How: This writes the group as Bob's leave leaves it.

	await expect.poll( async () => ( await reaDocFun( 'accounts/alice/notices/offerLeft-gro2' ) )?.otherUid ).toBe( 'bob' ); // What: Offer Left Notice. Why: Alice learns her offer ended with Bob gone. How: This waits for her notice naming him.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-alice' ) ).toEqual( [ { body : 'The member you offered this group to left it.', title : 'Picnic' } ] ); // What: Offer Left Push. Why: Alice is told at once too. How: This waits for her phone's push.
	await expect.poll( async () => ( await reaDocFun( 'groups/gro2' ) )?.pendingOwnerUid ).toBeNull();                                                          // What: Stale Offer Cleared. Why: An offer to someone gone could never be accepted. How: This waits for the offer to be cleared.

	expect( await reaDocFun( 'accounts/carol/notices/removed-gro1' ) ).toBeUndefined(); // What: No Repeat Notice. Why: The rename didn't remove anyone, and the emulator runs triggers in order, so the rename's has run by now. How: This expects Carol's dismissed notice not written again.


} );



test( 'removing the member offered the group clears the offer without telling the owner, who made the change', async () => { // What: Removed Offer Test. Why: The owner knows what they did, while the offer still has to go (Section 18). How: This removes Bob, then checks his notice, the cleared offer, and that Alice has no offer notice.


	await seeGroFun( 'gro1' ); // What: Group Seed Call. Why: Bob holds the offer and is removed. How: This writes the group.

	await remDocFun( 'groups/gro1/members/bob' ); // What: Bob Membership Delete. Why: A removal ends the membership. How: This deletes Bob's.

	await datDocFun( 'groups/gro1', { countedUid : 'bob', memberCount : 2, removedUids : { bob : true } } ); // What: Removal Update. Why: The owner removes the member offered the group. How: This writes the group as the removal leaves it.

	await expect.poll( async () => ( await reaDocFun( 'groups/gro1' ) )?.pendingOwnerUid ).toBeNull();                   // What: Stale Offer Cleared. Why: An offer to someone gone could never be accepted. How: This waits for the offer to be cleared.
	await expect.poll( async () => ( await reaDocFun( 'accounts/bob/notices/removed-gro1' ) )?.kind ).toBe( 'removed' ); // What: Removal Notice. Why: Bob is told he was removed. How: This waits for his notice.

	expect( await reaDocFun( 'accounts/alice/notices/offerLeft-gro1' ) ).toBeUndefined(); // What: No Owner Notice. Why: The owner removed him themselves. How: This expects Alice has none.


} );



test( 'the old owner is told of an acceptance', async () => { // What: Acceptance Test. Why: Every offer ends in a notice to the owner unless the owner ended it, and a decline tells the owner through its own function (Section 18). How: This accepts the offer, then polls for the old owner's notice.


	await seeGroFun( 'gro1' ); // What: Group Seed Call. Why: Bob accepts this one. How: This writes it.

	await tokSetFun( funEnvObj, 'alice', 'tok-alice' ); // What: Alice Token Seed. Why: The old owner's push is checked. How: This registers Alice's phone.

	await datDocFun( 'groups/gro1', { ownerUid : 'bob', pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Accept Update. Why: An acceptance makes the member offered the group its owner. How: This writes the group as the acceptance leaves it.

	await expect.poll( async () => ( await reaDocFun( 'accounts/alice/notices/offerAccepted-gro1' ) )?.otherUid ).toBe( 'bob' ); // What: Accepted Notice. Why: Alice learns the handover finished. How: This waits for her notice naming Bob.

	await expect.poll( () => pusLisFun( funEnvObj, 'tok-alice' ) ).toEqual( [ { body : 'The member you offered this group to accepted it.', title : 'Picnic' } ] ); // What: Accepted Push. Why: Alice is told at once too. How: This waits for her phone's push.


} );

test( 'an accepted claim tells the old owner their group was claimed and ends the claim, while a claim candidate leaving tells nobody', async () => { // What: Claim Change Test. Why: The absent owner hears only that the group was claimed, never of a claim offer's other ends (Section 18). How: This accepts a claim offer in one group and has the claim candidate leave another, then checks the notices and records.


	await seeGroFun( 'gro1' ); // What: Accept Group Seed. Why: Bob accepts a claim of this one. How: This writes it.
	await seeGroFun( 'gro2' ); // What: Leave Group Seed. Why: Bob leaves this one while it's offered to him as a claim. How: This writes it.

	await seeClaFun( 'gro1' ); // What: Accept Claim Seed. Why: The offer to Bob is a claim. How: This writes gro1's record.
	await seeClaFun( 'gro2' ); // What: Leave Claim Seed. Why: The offer to Bob is a claim. How: This writes gro2's record.

	await datDocFun( 'groups/gro1', { ownerUid : 'bob', pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Accept Update. Why: Bob takes the claimed group. How: This writes the group as the acceptance leaves it.

	await expect.poll( async () => ( await reaDocFun( 'accounts/alice/notices/ownershipClaimed-gro1' ) )?.otherUid ).toBe( 'bob' ); // What: Claimed Notice. Why: The absent owner learns who has their group now. How: This waits for Alice's notice naming Bob.

	expect( await reaDocFun( 'groups/gro1/ownerClaim/current' ) ).toBeUndefined();            // What: Claim Ended. Why: The group has an owner again, and the record goes in the notice's batch. How: This expects the record deleted.
	expect( await reaDocFun( 'accounts/alice/notices/offerAccepted-gro1' ) ).toBeUndefined(); // What: No Accept Notice. Why: A claim is reported as a claim. How: This expects no ordinary acceptance notice.

	await remDocFun( 'groups/gro2/members/bob' ); // What: Bob Membership Delete. Why: The claim candidate leaves. How: This deletes Bob's membership.

	await datDocFun( 'groups/gro2', { countedUid : 'bob', memberCount : 2 } ); // What: Leave Update. Why: A leave lowers the count for the member leaving. How: This writes the group as Bob's leave leaves it.

	await expect.poll( async () => ( await reaDocFun( 'groups/gro2' ) )?.pendingOwnerUid ).toBeNull(); // What: Stale Claim Offer Cleared. Why: An offer to someone gone could never be accepted. How: This waits for the offer to be cleared.

	expect( await reaDocFun( 'accounts/alice/notices/offerLeft-gro2' ) ).toBeUndefined(); // What: No Leave Notice. Why: The absent owner never made the claim offer, and the trigger writes its notices before it clears an offer. How: This expects no notice for gro2.


} );

test( 'a new offer pushes the member offered the group, and a claim offer says it is one', async () => { // What: Offer Push Test. Why: The member offered a group learns of it at once, and a claim asks something different of them (Section 18). How: This makes an ordinary offer in one group and a claim offer in another, then reads the pushes to each phone.


	await seeGroFun( 'gro1' ); // What: Offer Group Seed. Why: Carol is offered this one. How: This writes it.
	await seeGroFun( 'gro2' ); // What: Claim Group Seed. Why: Carol is offered this one as a claim. How: This writes it.

	await tokSetFun( funEnvObj, 'carol', 'tok-carol' ); // What: Carol Token Seed. Why: Carol's pushes are checked. How: This registers her phone.

	await funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), 'groups/gro2/ownerClaim/current' ), { exhaustedAt : null, offeredUid : 'carol', passedUids : {} } ) ); // What: Claim Record Seed. Why: The daily run writes the record with its offer. How: This writes gro2's record naming Carol.

	await datDocFun( 'groups/gro1', { pendingOfferedAt : Timestamp.now(), pendingOwnerUid : 'carol' } ); // What: Offer Update. Why: The owner offers gro1 to Carol. How: This writes the new offer.
	await datDocFun( 'groups/gro2', { pendingOfferedAt : Timestamp.now(), pendingOwnerUid : 'carol' } ); // What: Claim Offer Update. Why: The run offers gro2 to Carol. How: This writes the new offer.

	await expect.poll( async () => ( await pusLisFun( funEnvObj, 'tok-carol' ) ).map( ( pusObj ) => pusObj.body ).sort() ).toEqual( [ "This group's owner has been away, and you've been asked to take it over.", "You've been offered ownership of this group." ] ); // What: Offer Pushes. Why: Carol hears of each offer, the claim told apart. How: This waits for both pushes to her phone.


} );

// #endregion Module Init


