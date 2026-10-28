


// #region Imports

import { deleteDoc                 } from 'firebase/firestore';           // What: Delete Doc. Why: Ending a membership or a group has to clear its mirror entry. How: This deletes a document.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Every Firestore write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the mirror holds what Firestore does. How: This asserts on what each poll reads.
import { get                       } from 'firebase/database';            // What: Get. Why: The mirror is read back from the Realtime Database. How: This reads a location once.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests write and read the emulators past their rules, as the server would. How: This connects to them.
import { ref                       } from 'firebase/database';            // What: Ref. Why: Every mirror read names a location. How: This builds a reference.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Creating or changing a membership or a group sets off the triggers. How: This writes a document.
import { test                      } from '@playwright/test';             // What: Test. Why: Each trigger behavior is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: A member's join time is a Firestore timestamp. How: This builds one at a chosen time.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every test reads and writes through one. How: This types it.

// #endregion Imports



/**
 * mirror.spec.ts = Membership Mirror Spec
 *
 * @summary
 * Checks the membership mirror's Cloud Functions end to end in the local
 * Firebase Emulators, which npm run test:functions starts and stops around
 * this suite: a Firestore write sets off the deployed trigger, and the test
 * polls the Realtime Database until the mirror matches, or fails once the
 * poll times out. Each test uses its own group, so a trigger left over from
 * one test can never write into another's.
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

const remDocFun = ( patValStr : string ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => deleteDoc( doc( cotAdmObj.firestore(), patValStr ) ) );                                  // What: Remove Document Function. Why: Tests end memberships and groups as the server would. How: This deletes the document with the rules off.
const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Seed Document Function. Why: Tests write documents as the server would. How: This writes the document with the rules off.



// #region reaMirFun

/**
 * reaMirFun = Read Mirror Function
 *
 * @summary
 * Reads one location of the Realtime Database with the rules turned off,
 * where clients can't read the mirror, so a poll can watch for a trigger's
 * write.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The mirror location's path.
 *
 * @returns A promise that resolves with the location's value, or null when
 *          it's empty.
 *
 * @example
 * ```ts
 * reaMirFun('mirrors/gro1/chatTtlDays') // => 30
 * ```
 *
*/

const reaMirFun = async ( patValStr : string ) : Promise< unknown > => { // What: Read Mirror Function. Why: The tests check what the triggers wrote. How: This reads the location as the server would.


	let mirValAny : unknown = null; // What: Mirror Value Any. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { mirValAny = ( await get( ref( cotAdmObj.database(), patValStr ) ) ).val(); } ); // What: Mirror Read Call. Why: Only the server reads the mirror. How: This reads it with the rules off.



	return mirValAny; // What: Mirror Value Return. Why: The poll compares it. How: This returns it.


};

// #endregion reaMirFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulators. How: This connects to Firestore and the Realtime Database under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every test reaches the emulators through it. How: This connects to both databases the triggers read and write.


		database  : { host : '127.0.0.1', port : 8210 }, // What: Database Options. Why: The mirror lives in the Realtime Database. How: This names the address firebase.json gives its emulator.
		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The triggers fire on Firestore writes. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs the triggers for this demo project alone. How: This names it, matching the project test:functions starts.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( "a member's join time is mirrored in milliseconds and removed when the membership ends", async () => { // What: Member Mirror Test. Why: The chat and presence rules check membership and join time in the mirror (Section 11.7). How: This adds a member, then removes them, polling the mirror after each.


	await seeDocFun( 'groups/gro1/members/alice', { joinedAt : Timestamp.fromMillis( 1234 ) } ); // What: Member Add Call. Why: A new membership has to reach the mirror. How: This creates Alice's member document.

	await expect.poll( () => reaMirFun( 'mirrors/gro1/members/alice' ) ).toBe( 1234 ); // What: Join Time Mirrored. Why: The chat read rule compares a query's start with this number. How: This waits for the join time in milliseconds.

	await remDocFun( 'groups/gro1/members/alice' ); // What: Member Remove Call. Why: An ended membership has to leave the mirror. How: This deletes Alice's member document.

	await expect.poll( () => reaMirFun( 'mirrors/gro1/members/alice' ) ).toBeNull(); // What: Member Unmirrored. Why: Someone who has left must lose chat and presence access. How: This waits for the entry to go.


} );



test( "a group's chat retention is mirrored, follows a change, and is removed with the group", async () => { // What: Retention Mirror Test. Why: The chat delete rule reads the group's retention from the mirror (Section 11.7). How: This creates a group, changes its retention, then deletes it, polling the mirror after each.


	await seeDocFun( 'groups/gro2', { chatTtlDays : 30 } ); // What: Group Create Call. Why: A new group's retention has to reach the mirror. How: This creates the group.

	await expect.poll( () => reaMirFun( 'mirrors/gro2/chatTtlDays' ) ).toBe( 30 ); // What: Retention Mirrored. Why: The chat delete rule reads it. How: This waits for 30 days.

	await seeDocFun( 'groups/gro2', { chatTtlDays : 7 } ); // What: Retention Change Call. Why: The owner can change the retention. How: This sets it to 7 days.

	await expect.poll( () => reaMirFun( 'mirrors/gro2/chatTtlDays' ) ).toBe( 7 ); // What: Retention Followed. Why: The mirror has to follow every change. How: This waits for 7 days.

	await remDocFun( 'groups/gro2' ); // What: Group Delete Call. Why: A deleted group leaves no retention. How: This deletes the group.

	await expect.poll( () => reaMirFun( 'mirrors/gro2/chatTtlDays' ) ).toBeNull(); // What: Retention Unmirrored. Why: Nothing of a deleted group should linger. How: This waits for the entry to go.


} );



test( 'a quick run of membership changes leaves the mirror matching the last one', async () => { // What: Quick Changes Test. Why: Firebase may run triggers late or out of order, and the mirror has to end where Firestore did (Section 11.7). How: This adds, removes, and re-adds a member without waiting, then polls for the final join time, though the emulator runs triggers in order, so it can't produce the out-of-order case the reread loop covers.


	await seeDocFun( 'groups/gro3/members/bob', { joinedAt : Timestamp.fromMillis( 1000 ) } ); // What: First Join Call. Why: The run starts with a membership. How: This creates Bob's member document.

	await remDocFun( 'groups/gro3/members/bob' ); // What: Leave Call. Why: The run ends the membership. How: This deletes it.

	await seeDocFun( 'groups/gro3/members/bob', { joinedAt : Timestamp.fromMillis( 2000 ) } ); // What: Rejoin Call. Why: The run ends on a fresh membership. How: This creates it again with a later join time.

	await expect.poll( () => reaMirFun( 'mirrors/gro3/members/bob' ) ).toBe( 2000 ); // What: Final State Mirrored. Why: The mirror has to end where Firestore did. How: This waits for the rejoin's time.


} );

// #endregion Module Init


