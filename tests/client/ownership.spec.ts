


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: A lapsed offer is seeded by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the handover went as it should. How: This asserts on what the pages and the emulator return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Every test starts from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Notices only functions write are seeded. How: This writes them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A lapsed offer is seeded with an old time. How: This builds it.
import { updateDoc                 } from 'firebase/firestore';           // What: Update Doc. Why: An offer is aged past the rules. How: This changes it.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * ownership.spec.ts = Ownership Spec
 *
 * @summary
 * Checks handing a group over, and the notices it leaves, in a real browser,
 * in each engine, against the Emulator Suite with the real security rules
 * and Cloud Functions. Each test starts from a group with two identities,
 * the page's own as its owner and a member in a second browser context, and
 * runs the app's own modules in each page: the owner offers and withdraws,
 * the member accepts or declines, and the old owner reads and dismisses the
 * notice a Cloud Function leaves them.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const MEM_MOD_STR = '/src/state/members.ts';   // What: Members Module String. Why: A handed-over owner can leave. How: This names the members module's path.
const NOT_MOD_STR = '/src/state/notices.ts';   // What: Notices Module String. Why: An answered offer leaves the owner a notice. How: This names the notices module's path.
const OWN_MOD_STR = '/src/state/ownership.ts'; // What: Ownership Module String. Why: Offers are made and answered there. How: This names the ownership module's path.

// #endregion Constants



// #region Module State

let ownEnvObj : RulesTestEnvironment; // What: Ownership Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	ownEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the pages and functions write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await ownEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a member accepts an offered group, swapping both accounts, and the old owner is told', async ( { page, secPagObj } ) => { // What: Acceptance Test. Why: A group changes hands only when the member offered it agrees, and the old owner learns of it (Section 18). How: This offers and accepts, checks the group and both accounts, then reads and dismisses the old owner's notice.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( ownEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	expect( await runPagFun( page, OWN_MOD_STR, 'offMakFun', groIdeStr, uidMemStr ) ).toBeUndefined(); // What: Offer Call. Why: The owner offers the group. How: This expects the offer to stand.
	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offAccFun', groIdeStr ) ).toBeUndefined();       // What: Accept Call. Why: The member takes the group over. How: This expects the acceptance to succeed.


	const memAccObj = await docReaFun( ownEnvObj, `accounts/${ uidMemStr }` ); // What: Member Account Object. Why: The new owner's slot changes kind. How: This reads their account.
	const ownAccObj = await docReaFun( ownEnvObj, `accounts/${ uidOwnStr }` ); // What: Owner Account Object. Why: The old owner stays as a member. How: This reads their account.


	expect( await docReaFun( ownEnvObj, `groups/${ groIdeStr }` ) ).toMatchObject( { ownerUid : uidMemStr, pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Group Handed Over. Why: The member owns the group and the offer is used up. How: This expects the new owner and no offer.
	expect( memAccObj ).toMatchObject( { memberGroups : {}, ownedGroups : { [ groIdeStr ] : true } } );                                                         // What: New Owner Slot. Why: The group takes one of the new owner's owned slots. How: This expects it in their owned map alone.
	expect( ownAccObj ).toMatchObject( { memberGroups : { [ groIdeStr ] : true }, ownedGroups : {} } );                                                         // What: Old Owner Slot. Why: The old owner stays in as a member. How: This expects it in their member map alone.

	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offAccFun', groIdeStr ) ).toBe( 'error:Error' ); // What: Second Accept Refused. Why: An accepted offer is used up. How: This expects an Error.
	expect( await runPagFun( page, MEM_MOD_STR, 'groLeaFun', groIdeStr ) ).toBeUndefined();            // What: Old Owner Leave. Why: Handing the group over is what lets an owner leave. How: This expects the leave to succeed.

	await expect.poll( () => runPagFun( page, NOT_MOD_STR, 'notLisFun' ) ).toMatchObject( [ { groIdeStr, groNamStr : 'Beach Day', kinValStr : 'offerAccepted', notIdeStr : `offerAccepted-${ groIdeStr }`, othUidStr : uidMemStr } ] ); // What: Notice Listed. Why: The trigger tells the old owner who took the group. How: This polls until the notice arrives.


	expect( await runPagFun( page, NOT_MOD_STR, 'notDisFun', `offerAccepted-${ groIdeStr }` ) ).toBeUndefined(); // What: Dismiss Call. Why: A seen notice goes. How: This expects the dismissal to succeed.
	expect( await runPagFun( page, NOT_MOD_STR, 'notLisFun' ) ).toEqual( [] );                                   // What: Notice Gone. Why: A dismissed notice isn't shown again. How: This expects an empty list.


} );



pagTesObj( 'the owner withdraws an offer, and the member declines another, which tells the owner', async ( { page, secPagObj } ) => { // What: Withdraw And Decline Test. Why: The owner can call an offer off, and the member can turn one down through the function that tells the owner (Section 18). How: This withdraws one offer, declines a second, and checks the owner's notice.


	const { groIdeStr, uidMemStr, uidOwnStr } = await memSetFun( ownEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	await runPagFun( page, OWN_MOD_STR, 'offMakFun', groIdeStr, uidMemStr ); // What: First Offer Call. Why: There has to be an offer to withdraw. How: This makes one.

	expect( await runPagFun( page, OWN_MOD_STR, 'offAccFun', groIdeStr ) ).toBe( 'error:Error' );                  // What: Owner Accept Refused. Why: An offer is taken up only by the member it names. How: This expects an Error.
	expect( await runPagFun( page, OWN_MOD_STR, 'offWitFun', groIdeStr ) ).toBeUndefined();                        // What: Withdraw Call. Why: The owner calls the offer off. How: This expects the withdrawal to succeed.
	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offAccFun', groIdeStr ) ).toBe( 'error:Error' );             // What: Withdrawn Accept Refused. Why: A withdrawn offer can't be taken up. How: This expects an Error.
	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offWitFun', groIdeStr ) ).toBe( 'error:permission-denied' ); // What: Member Withdraw Refused. Why: Only the owner ends an offer from the app, so a decline can't skip telling them. How: This expects the rules to refuse it.

	await runPagFun( page, OWN_MOD_STR, 'offMakFun', groIdeStr, uidMemStr ); // What: Second Offer Call. Why: There has to be an offer to decline. How: This makes one.

	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offDecFun', groIdeStr ) ).toBeUndefined();                                          // What: Decline Call. Why: The member turns the group down. How: This expects the decline to succeed.
	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offDecFun', groIdeStr ) ).toBe( 'error:functions/failed-precondition' );            // What: Second Decline Refused. Why: No offer stands any more. How: This expects the function's refusal.
	expect( await docReaFun( ownEnvObj, `groups/${ groIdeStr }` ) ).toMatchObject( { pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Offer Cleared. Why: A declined offer is over. How: This expects no offer on the group.

	await expect.poll( () => runPagFun( page, NOT_MOD_STR, 'notLisFun' ) ).toMatchObject( [ { groIdeStr, kinValStr : 'offerDeclined' } ] ); // What: Notice Listed. Why: The decline tells the owner. How: This polls until the notice arrives.



	await ownEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Notices Seed Call. Why: The list keeps unexpired notices newest first, whatever the emulator's ID order. How: This writes an older notice whose ID sorts first, and an expired one.


		await setDoc( doc( cotAdmObj.firestore(), `accounts/${ uidOwnStr }/notices/aaa` ), { // What: Older Notice Call. Why: An hour-old notice lists after the new one. How: This writes it with no other person.


			createdAt : Timestamp.fromMillis( Date.now() - 3600000 ),
			expireAt  : Timestamp.fromMillis( Date.now() + 86400000 ),
			groupId   : 'gone',
			groupName : 'Old Group',
			kind      : 'groupDeleted'


		} );

		await setDoc( doc( cotAdmObj.firestore(), `accounts/${ uidOwnStr }/notices/bbb` ), { // What: Expired Notice Call. Why: An expired notice isn't shown. How: This writes one a minute past its expiry.


			createdAt : Timestamp.fromMillis( Date.now() - 86400000 ),
			expireAt  : Timestamp.fromMillis( Date.now() - 60000 ),
			groupId   : 'gone',
			groupName : 'Older Group',
			kind      : 'removed'


		} );


	} );


	expect( await runPagFun( page, NOT_MOD_STR, 'notLisFun' ) ).toMatchObject( [ { kinValStr : 'offerDeclined' }, { groNamStr : 'Old Group', kinValStr : 'groupDeleted', othUidStr : '' } ] ); // What: Notices Listed. Why: The newest leads, the expired one is left out, and a notice with nobody else names no one. How: This expects the decline, then the older notice alone.


} );



pagTesObj( 'a lapsed offer cannot be accepted, and an offer to a member with no free slot is refused', async ( { page, secPagObj } ) => { // What: Refusal Test. Why: An offer lapses after 7 days, and the owner learns at once when a member can't take a group (Section 18). How: This ages an offer, tries to accept it, then offers to a member whose owned slots are full, checking both are refused.


	const { groIdeStr, uidMemStr } = await memSetFun( ownEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.


	await runPagFun( page, OWN_MOD_STR, 'offMakFun', groIdeStr, uidMemStr ); // What: Offer Call. Why: There has to be an offer to age. How: This makes one.



	await ownEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }` ), { pendingOfferedAt : Timestamp.fromMillis( Date.now() - 8 * 86400000 ) } ); } ); // What: Lapsed Seed Call. Why: An 8-day-old offer has lapsed. How: This backdates it with the rules off.


	expect( await runPagFun( secPagObj, OWN_MOD_STR, 'offAccFun', groIdeStr ) ).toBe( 'error:Error' ); // What: Lapsed Accept Refused. Why: A lapsed offer can't be taken up. How: This expects an Error.


	await ownEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { await updateDoc( doc( cotAdmObj.firestore(), `accounts/${ uidMemStr }` ), { ownedGroups : Object.fromEntries( Array.from( Array( 10 ).keys(), ( indValNum ) => [ `own${ indValNum }`, true ] ) ) } ); } ); // What: Full Slots Seed Call. Why: Until the paywall is on, everyone may own 10 groups (Section 18). How: This fills the member's owned map with 10 entries, with the rules off.


	expect( await runPagFun( page, OWN_MOD_STR, 'offMakFun', groIdeStr, uidMemStr ) ).toBe( 'error:permission-denied' ); // What: Full Slot Refused. Why: An offer that could never be accepted is refused as it's made. How: This expects the rules to refuse it.


} );

// #endregion Module Init


