


// #region Imports

import { dayRunFun                 } from '../../functions/src/daily-run.ts'; // What: Day Run Function. Why: The emulator can't fire a v2 schedule, so the tests run it themselves. How: This is the deployed schedule, whose run method calls its handler.
import { doc                       } from 'firebase/firestore';               // What: Doc. Why: Every Firestore read and write names a document. How: This builds a reference.
import { expect                    } from '@playwright/test';                 // What: Expect. Why: Each check passes only when the run left each group as it should. How: This asserts on each read and poll.
import { getDoc                    } from 'firebase/firestore';               // What: Get Doc. Why: Groups, claim records, and notices are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';     // What: Initialize Test Environment. Why: The tests seed and read Firestore past its rules, as the server would. How: This connects to the emulator.
import { setDoc                    } from 'firebase/firestore';               // What: Set Doc. Why: The tests seed groups, members, accounts, and claim records. How: This writes a document.
import { test                      } from '@playwright/test';                 // What: Test. Why: Each step of the run is its own test. How: This declares them.
import { Timestamp                 } from 'firebase/firestore';               // What: Timestamp. Why: Offer, join, and activity times are Firestore timestamps. How: This builds them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * daily-run.spec.ts = Daily Run Spec
 *
 * @summary
 * Checks the daily scheduled run end to end in the local Firebase Emulators,
 * which npm run test:functions starts and stops around this suite. The
 * Functions emulator can't fire a v2 schedule, by itself or on request, so
 * each test imports the schedule and calls its handler through its run
 * method, in the test's own process, where the Admin SDK reaches the same
 * emulators through the addresses npm run test:functions sets. Groups are
 * seeded with offer, join, and activity times relative to now, and each run
 * is finished before the test reads what it changed.
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

const DAY_MIL_NUM = 24 * 60 * 60 * 1000;                                                                           // What: Day Milliseconds Number. Why: Every seeded time is some days back. How: This is one day in milliseconds.

// #endregion Constants



// #region Module State

let funEnvObj : RulesTestEnvironment; // What: Functions Environment Object. Why: Every seed and read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const dayAgoFun = ( dayCouNum : number ) => Timestamp.fromMillis( Date.now() - dayCouNum * DAY_MIL_NUM ); // What: Days Ago Function. Why: Every seeded time is some days before the run. How: This returns that time as a timestamp.



const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check groups, claim records, and notices. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await funEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Claim records and notices are closed to clients. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};



const runDayFun = () => dayRunFun.run( { jobName : 'test', scheduleTime : new Date().toISOString() } ); // What: Run Day Function. Why: Each test starts one run and waits for it. How: This calls the schedule's handler through its run method, which settles once the run is done.



const seeDocFun = ( patValStr : string, datValObj : Record< string, unknown > ) => funEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), patValStr ), datValObj ) ); // What: Seed Document Function. Why: Tests start from states only the server or time could reach. How: This writes the document with the rules off.



// #region seeGroFun

/**
 * seeGroFun = Seed Group Function
 *
 * @summary
 * Seeds a group owned by Alice, with an optional standing offer, and a
 * membership for each member given, with its join time and how many days
 * ago that member was last active.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param memDatObj - Member Data Object: Each member's UID mapped to their
 *                    join time in milliseconds and days since their last
 *                    visit.
 * @param offDatObj - Offer Data Object: The standing offer's member and how
 *                    many days ago it was made, none by default.
 *
 * @returns A promise that settles once the group and its members are
 *          written, with no value.
 *
 * @example
 * ```ts
 * seeGroFun('gro1', { alice : [ 1000, 40 ] }) // => Promise<void>
 * ```
 *
*/

const seeGroFun = async ( groIdeStr : string, memDatObj : Record< string, [ number, number ] >, offDatObj? : [ string, number ] ) : Promise< void > => { // What: Seed Group Function. Why: Each case needs a group with its own members and offer. How: This writes the group, then each membership.


	await seeDocFun( `groups/${ groIdeStr }`, { chatTtlDays : 30, name : 'Picnic', ownerUid : 'alice', pendingOfferedAt : offDatObj ? dayAgoFun( offDatObj[ 1 ] ) : null, pendingOwnerUid : offDatObj?.[ 0 ] ?? null } ); // What: Group Seed Call. Why: The group under the run. How: This writes it, owned by Alice, with the offer given or none.



	for ( const [ uidValStr, [ joiMilNum, actDayNum ] ] of Object.entries( memDatObj ) ) await seeDocFun( `groups/${ groIdeStr }/members/${ uidValStr }`, { joinedAt : Timestamp.fromMillis( joiMilNum ), lastActiveAt : dayAgoFun( actDayNum ) } ); // What: Member Seed Loop. Why: The run reads each member's join and activity times. How: This writes each membership.


};

// #endregion seeGroFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	funEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every seed and read reaches the emulator through it. How: This connects to Firestore, which the run reads and writes.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: Every group the run touches lives there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The Functions emulator runs for this demo project alone. How: This names it, matching the project test:functions starts.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await funEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: The run reads every group, so each test starts from an empty Firestore. How: This clears it.


	await funEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test's run sees another's groups. How: This clears them.


} );



test( 'an offer lapses after 7 days, telling the owner, while a lapsed claim offer passes to the next member', async () => { // What: Lapse Test. Why: A forgotten offer mustn't stand forever, and a claim moves on when ignored (Section 18). How: This seeds an old owner offer, a recent one, and an old claim offer, runs the day, and checks each.


	await seeGroFun( 'gro1', { alice : [ 1000, 0 ], bob : [ 2000, 0 ] }, [ 'bob', 8 ] );                      // What: Old Offer Seed. Why: An owner's offer from 8 days ago lapses. How: This writes gro1 offered to Bob 8 days ago.
	await seeGroFun( 'gro2', { alice : [ 1000, 0 ], bob : [ 2000, 0 ] }, [ 'bob', 6 ] );                      // What: Recent Offer Seed. Why: An offer from 6 days ago still stands. How: This writes gro2 offered to Bob 6 days ago.
	await seeGroFun( 'gro3', { alice : [ 1000, 40 ], bob : [ 2000, 0 ], dave : [ 3000, 0 ] }, [ 'bob', 8 ] ); // What: Old Claim Seed. Why: A claim offer from 8 days ago lapses and moves on. How: This writes gro3, its owner away 40 days, offered to Bob 8 days ago.

	await seeDocFun( 'groups/gro3/ownerClaim/current', { exhaustedAt : null, offeredUid : 'bob', passedUids : {} } ); // What: Claim Record Seed. Why: The run tells a claim offer by its record. How: This writes gro3's record naming Bob.

	await runDayFun(); // What: Run Call. Why: The day's run lapses the old offers. How: This starts it.

	expect( ( await reaDocFun( 'groups/gro3' ) )?.pendingOwnerUid ).toBe( 'dave' );                                                     // What: Claim Moved On. Why: Bob passed by letting it lapse, so Dave is next. How: This expects gro3's offer to name Dave.
	expect( await reaDocFun( 'accounts/alice/notices/offerLapsed-gro1' ) ).toMatchObject( { kind : 'offerLapsed', otherUid : 'bob' } ); // What: Lapse Notice. Why: The owner learns their offer ran out. How: This expects Alice's notice naming Bob.
	expect( ( await reaDocFun( 'groups/gro1' ) )?.pendingOwnerUid ).toBeNull();                                                         // What: Old Offer Cleared. Why: A lapsed offer can't be accepted. How: This expects gro1's offer gone.
	expect( ( await reaDocFun( 'groups/gro2' ) )?.pendingOwnerUid ).toBe( 'bob' );                                                      // What: Recent Offer Kept. Why: An offer under 7 days old still stands. How: This expects gro2's offer still Bob's.
	expect( ( await reaDocFun( 'groups/gro3/ownerClaim/current' ) )?.passedUids ).toEqual( { bob : true } );                            // What: Pass Recorded. Why: Bob isn't asked again for this claim. How: This expects him in the passed map.
	expect( await reaDocFun( 'accounts/alice/notices/offerLapsed-gro3' ) ).toBeUndefined();                                             // What: No Claim Lapse Notice. Why: The absent owner has nothing to act on. How: This expects no notice for gro3.


} );



test( "an inactive owner's group goes to the longest-standing active member with a free slot, and waits once everyone has passed", async () => { // What: Claim Test. Why: A group whose owner disappeared needs someone to manage it (Section 18). How: This seeds groups covering each candidate rule and each state of a claim record, runs the day, and checks each.


	await seeDocFun( 'accounts/bob', { memberGroups : {}, ownedGroups : Object.fromEntries( Array.from( Array( 10 ).keys(), ( ownIndNum ) => [ `own${ ownIndNum }`, true ] ) ) } ); // What: Full Account Seed. Why: A member who already owns 10 groups couldn't accept. How: This writes Bob's account owning 10.

	await seeGroFun( 'gro1', { alice : [ 1000, 40 ], bob : [ 2000, 0 ], carol : [ 3000, 0 ], dave : [ 1500, 40 ], erin : [ 2500, 0 ] } ); // What: Pick Group Seed. Why: Dave joined first but is away, Bob next but has no free slot, then Erin, then Carol. How: This writes gro1 with its owner away.
	await seeGroFun( 'gro2', { alice : [ 1000, 5 ], carol : [ 2000, 0 ] } );                                                              // What: Active Owner Seed. Why: An owner seen 5 days ago keeps the group. How: This writes gro2.
	await seeGroFun( 'gro3', { alice : [ 1000, 40 ], carol : [ 2000, 0 ] } );                                                             // What: All Passed Seed. Why: With every candidate passed, the claim waits. How: This writes gro3 with its owner away.
	await seeGroFun( 'gro4', { alice : [ 1000, 40 ], carol : [ 2000, 0 ] } );                                                             // What: Reset Group Seed. Why: A claim exhausted 31 days ago starts over. How: This writes gro4 with its owner away.
	await seeGroFun( 'gro5', { alice : [ 1000, 40 ], carol : [ 2000, 0 ] } );                                                             // What: Waiting Group Seed. Why: A claim exhausted 5 days ago keeps waiting. How: This writes gro5 with its owner away.

	await seeDocFun( 'groups/gro3/ownerClaim/current', { exhaustedAt : null, offeredUid : null, passedUids : { carol : true } } );            // What: Passed Record Seed. Why: Carol already passed on gro3. How: This writes its record.
	await seeDocFun( 'groups/gro4/ownerClaim/current', { exhaustedAt : dayAgoFun( 31 ), offeredUid : null, passedUids : { carol : true } } ); // What: Reset Record Seed. Why: Everyone passed on gro4 31 days ago. How: This writes its record.
	await seeDocFun( 'groups/gro5/ownerClaim/current', { exhaustedAt : dayAgoFun( 5 ), offeredUid : null, passedUids : { carol : true } } );  // What: Waiting Record Seed. Why: Everyone passed on gro5 5 days ago. How: This writes its record.

	await runDayFun(); // What: Run Call. Why: The day's run moves each claim on. How: This starts it.

	expect( ( await reaDocFun( 'groups/gro1' ) )?.pendingOwnerUid ).toBe( 'erin' );                                                                          // What: Erin Picked. Why: Dave is away and Bob has no free slot, so Erin, who joined before Carol, is next in line. How: This expects gro1's offer to name Erin.
	expect( ( await reaDocFun( 'groups/gro4' ) )?.pendingOwnerUid ).toBe( 'carol' );                                                                         // What: Reset Picked. Why: After 30 days everyone is asked again. How: This expects gro4's offer to name Carol.
	expect( ( await reaDocFun( 'groups/gro3/ownerClaim/current' ) )?.exhaustedAt ).toBeInstanceOf( Timestamp );                                              // What: Exhausted Recorded. Why: The run notes when nobody was left. How: This expects gro3's record to carry the time.
	expect( ( await reaDocFun( 'groups/gro1/ownerClaim/current' ) )?.offeredUid ).toBe( 'erin' );                                                            // What: Claim Recorded. Why: A later decline or lapse has to be told from the owner's own offers. How: This expects gro1's record to name Erin.
	expect( ( await reaDocFun( 'groups/gro2' ) )?.pendingOwnerUid ).toBeNull();                                                                              // What: Active Owner Kept. Why: An owner seen in the last 30 days keeps the group. How: This expects gro2 left alone.
	expect( ( await reaDocFun( 'groups/gro3' ) )?.pendingOwnerUid ).toBeNull();                                                                              // What: All Passed Unoffered. Why: Nobody's left who hasn't passed. How: This expects gro3 left alone.
	expect( ( await reaDocFun( 'groups/gro5' ) )?.pendingOwnerUid ).toBeNull();                                                                              // What: Waiting Unoffered. Why: Under 30 days since everyone passed. How: This expects gro5 left alone.
	expect( ( ( await reaDocFun( 'groups/gro5/ownerClaim/current' ) )?.exhaustedAt as Timestamp ).toMillis() ).toBeLessThan( Date.now() - 4 * DAY_MIL_NUM ); // What: Wait Kept. Why: Rewriting the time on each run would put the reset off forever. How: This expects gro5's record still to carry its time from 5 days ago. // What: Type Assertion Note. Why: The seed wrote a timestamp there. How: The as reads it as one.


} );



test( 'an owner who comes back ends the claim and its offer', async () => { // What: Return Test. Why: An owner who returns keeps their group (Section 18). How: This seeds a claim offer on a group whose owner was seen today, runs the day, and checks the claim ended.


	await seeGroFun( 'gro1', { alice : [ 1000, 0 ], bob : [ 2000, 0 ] }, [ 'bob', 1 ] ); // What: Returned Owner Seed. Why: Alice came back while her group was offered to Bob. How: This writes gro1, Alice seen today, offered to Bob a day ago.

	await seeDocFun( 'groups/gro1/ownerClaim/current', { exhaustedAt : null, offeredUid : 'bob', passedUids : {} } ); // What: Claim Record Seed. Why: The offer to Bob was a claim. How: This writes gro1's record naming Bob.

	await runDayFun(); // What: Run Call. Why: The day's run ends claims whose owner came back. How: This starts it.

	expect( await reaDocFun( 'groups/gro1/ownerClaim/current' ) ).toBeUndefined(); // What: Claim Ended. Why: The owner is back. How: This expects the record deleted.
	expect( ( await reaDocFun( 'groups/gro1' ) )?.pendingOwnerUid ).toBeNull();    // What: Claim Offer Withdrawn. Why: Nobody should take the group from an owner who's back. How: This expects the offer cleared.


} );

// #endregion Module Init


