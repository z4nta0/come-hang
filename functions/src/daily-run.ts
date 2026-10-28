


// #region Imports

import { claRefFun   } from './claims.ts';                     // What: Claim Reference Function. Why: The run reads and writes each group's claim record. How: This names it.
import { FieldPath   } from 'firebase-admin/firestore';        // What: Field Path. Why: A UID becomes a key in the record's passed map. How: This names that key without reading it as a dotted path.
import { FIR_DAT_OBJ } from './setup.ts';                      // What: Firestore Database Object. Why: Groups, members, and accounts live in Firestore. How: This reads and writes them past the rules.
import { FUN_OPT_OBJ } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: The schedule spreads them in.
import { notBatFun   } from './notices.ts';                    // What: Notice Batch Function. Why: An owner whose offer lapsed is told. How: This adds their notice to a batch.
import { onSchedule  } from 'firebase-functions/v2/scheduler';
import { pusSenFun   } from './push.ts'; // What: On Schedule. Why: The run happens once a day by itself. How: This registers a scheduled function.
import { Timestamp   } from 'firebase-admin/firestore';        // What: Timestamp. Why: The run compares and stores times. How: This builds them from milliseconds.


import type { DocumentReference } from 'firebase-admin/firestore'; // What: Document Reference. Why: Several steps work on one group's document. How: This types it.
import type { DocumentSnapshot  } from 'firebase-admin/firestore'; // What: Document Snapshot. Why: Several steps work from documents as read. How: This types them.

// #endregion Imports



/**
 * daily-run.ts = Daily Run
 *
 * @summary
 * The scheduled function that runs once a day (ARCHITECTURE.md Section 18),
 * in three steps:
 *  1. Every offer standing 7 days lapses. The owner of a lapsed offer they
 *     made is told, while a lapsed claim offer only marks its member as
 *     having passed, since the absent owner has nothing to act on.
 *  2. Every claim whose owner has been active again drops its record, and
 *     its claim offer if one still stands.
 *  3. Every group whose owner hasn't been active for 30 days, with no offer
 *     standing, is offered to the longest-standing member who has been
 *     active in that time, hasn't passed, and has a free owned slot. Once
 *     nobody is left to ask, the record says so, and 30 days later it
 *     clears so the run asks again from the top.
 * The member accepts through the same batch as any transfer, which the
 * group change trigger reports to the old owner as a claim. Each group's
 * step runs in a transaction that rereads the group, so a change made since
 * the run's queries is never overwritten, and a failure in one group is
 * logged without stopping the rest.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DAY_MIL_NUM = 24 * 60 * 60 * 1000; // What: Day Milliseconds Number. Why: Every limit is counted in days. How: This is one day in milliseconds.

const CLA_RES_NUM = 30 * DAY_MIL_NUM; // What: Claim Reset Number. Why: Once everyone has passed, people get a while before being asked again. How: This is 30 days in milliseconds.
const INA_LIM_NUM = 30 * DAY_MIL_NUM; // What: Inactive Limit Number. Why: An owner away this long can have the group claimed (Section 18). How: This is 30 days in milliseconds.
const OFF_LIF_NUM = 7 * DAY_MIL_NUM;  // What: Offer Lifetime Number. Why: An offer lapses after 7 days (Section 18). How: This is 7 days in milliseconds.
const PAY_LOC_BOO = false;            // What: Paywall Locked Boolean. Why: A free owned slot depends on the paywall, which firestore.rules switches in payLocFun. How: This has to match that function's answer, and switches with it.

// #endregion Constants



// #region Helpers

// #region lapOffFun

/**
 * lapOffFun = Lapse Offer Function
 *
 * @summary
 * Lapses one group's offer when it has stood since before the cutoff,
 * clearing it in a transaction that rereads the group, so an offer replaced
 * or ended since the run's query is left alone. A lapsed claim offer marks
 * its member as having passed and tells nobody. Any other lapsed offer
 * leaves the owner a notice naming the member it went to, and a push.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groRefObj - Group Reference Object: The group whose offer lapses.
 * @param cutMilNum - Cut Milliseconds Number: The time an offer has to have
 *                    stood since, in milliseconds.
 *
 * @returns A promise that settles once the offer is lapsed or found
 *          changed, with no value.
 *
 * @example
 * ```ts
 * lapOffFun(groRefObj, Date.now() - OFF_LIF_NUM) // => Promise<void>
 * ```
 *
*/

const lapOffFun = async ( groRefObj : DocumentReference, cutMilNum : number ) : Promise< void > => { // What: Lapse Offer Function. Why: A forgotten offer mustn't stand forever. How: This clears it, recording a claim's pass or noting the owner's notice.


	const notSnaObj = await FIR_DAT_OBJ.runTransaction( async ( traValObj ) : Promise< DocumentSnapshot | null > => { // What: Notice Snapshot Object. Why: The owner's notice is written once the lapse lands. How: This runs the lapse and returns the group when its owner needs telling, null otherwise.


		const claSnaObj = await traValObj.get( claRefFun( groRefObj.id ) ); // What: Claim Snapshot Object. Why: A claim offer lapses differently. How: This reads the group's claim record.
		const groSnaObj = await traValObj.get( groRefObj );                 // What: Group Snapshot Object. Why: The offer may have changed since the query. How: This rereads the group.


		const offTimObj = groSnaObj.get( 'pendingOfferedAt' ) as Timestamp | null | undefined; // What: Offer Time Object. Why: Only an offer standing since before the cutoff lapses. How: This reads when it was made. // What: Type Assertion Note. Why: The rules set the offer time as a timestamp or null. How: The as reads it as either, or missing.



		if ( !offTimObj || offTimObj.toMillis() > cutMilNum ) return null; // What: Changed Offer Guard. Why: An offer ended or made again since the query isn't lapsing. How: This leaves the group alone.



		const penUidStr = groSnaObj.get( 'pendingOwnerUid' ) as string; // What: Pending UID String. Why: The member the offer went to. How: This reads them. // What: Type Assertion Note. Why: The rules set a UID beside every offer time. How: The as reads it as a string.


		traValObj.update( groRefObj, { pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Offer Clear Call. Why: A lapsed offer can't be accepted. How: This clears both offer fields.



		if ( claSnaObj.get( 'offeredUid' ) !== penUidStr ) return groSnaObj; // What: Owner Offer Return. Why: The owner made this offer, so they're told it lapsed. How: This returns the group for the notice.



		traValObj.update( claSnaObj.ref, new FieldPath( 'passedUids', penUidStr ), true, 'offeredUid', null ); // What: Claim Pass Call. Why: A member who lets a claim offer lapse has passed on it, so the next run asks someone else. How: This records the pass and clears the record's offer.



		return null; // What: Claim Lapse Return. Why: The absent owner is told nothing of a lapsed claim offer. How: This asks for no notice.


	} );



	if ( !notSnaObj ) return; // What: No Notice Guard. Why: Most lapses tell nobody. How: This ends the call.



	const batWriObj = FIR_DAT_OBJ.batch(); // What: Batch Write Object. Why: The notice is written once the lapse has landed. How: This starts a batch.


	notBatFun( batWriObj, notSnaObj.get( 'ownerUid' ), 'offerLapsed', groRefObj.id, notSnaObj.get( 'name' ), notSnaObj.get( 'pendingOwnerUid' ) ); // What: Lapsed Notice Call. Why: The owner learns their offer ran out and can make another (Section 18). How: This leaves them a notice naming the member it went to.

	await batWriObj.commit(); // What: Batch Commit Call. Why: The notice has to land. How: This commits it.

	await pusSenFun( notSnaObj.get( 'ownerUid' ), 'offerLapsed', notSnaObj.get( 'name' ) ); // What: Lapsed Push Call. Why: The owner is told at once too. How: This sends their push, best effort.


};

// #endregion lapOffFun



// #region retClaFun

/**
 * retClaFun = Returned Claim Function
 *
 * @summary
 * Ends a claim whose owner has been active again since the inactivity
 * cutoff: it deletes the claim record and withdraws the claim offer if one
 * still stands, in a transaction that rereads the group and the owner's
 * membership. A claim whose owner is still away is left alone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param claSnaObj - Claim Snapshot Object: The claim record as the run
 *                    found it.
 * @param cutMilNum - Cut Milliseconds Number: The time an owner has to have
 *                    been active since to count as back, in milliseconds.
 *
 * @returns A promise that settles once the claim is ended or kept, with no
 *          value.
 *
 * @example
 * ```ts
 * retClaFun(claSnaObj, Date.now() - INA_LIM_NUM) // => Promise<void>
 * ```
 *
*/

const retClaFun = ( claSnaObj : DocumentSnapshot, cutMilNum : number ) : Promise< void > => FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Returned Claim Function. Why: An owner who comes back keeps their group. How: This ends the claim when the owner has been active since the cutoff.


	const groRefObj = claSnaObj.ref.parent.parent!;                                                                          // What: Group Reference Object. Why: The claim belongs to the group above it. How: This climbs to the group's document. // What: Non-Null Note. Why: A claim record always sits in a group's collection. How: The ! says the group reference is there.
	const groSnaObj = await traValObj.get( groRefObj );                                                                      // What: Group Snapshot Object. Why: The owner and any standing offer are read now. How: This reads the group in the transaction.
	const ownSnaObj = await traValObj.get( groRefObj.collection( 'members' ).doc( String( groSnaObj.get( 'ownerUid' ) ) ) ); // What: Owner Snapshot Object. Why: Whether the owner is back is read now. How: This reads the owner's membership in the transaction.


	const lasTimObj = ownSnaObj.get( 'lastActiveAt' ) as Timestamp | undefined; // What: Last Time Object. Why: The owner's last visit decides whether they're back. How: This reads it. // What: Type Assertion Note. Why: The rules set every membership's activity time as a timestamp. How: The as reads it as one, or missing.



	if ( !lasTimObj || lasTimObj.toMillis() < cutMilNum ) return; // What: Still Away Guard. Why: An owner still away keeps the claim going. How: This leaves the claim alone.



	if ( groSnaObj.get( 'pendingOwnerUid' ) === claSnaObj.get( 'offeredUid' ) ) traValObj.update( groRefObj, { pendingOfferedAt : null, pendingOwnerUid : null } ); // What: Claim Offer Withdraw. Why: The owner is back, so nobody should take the group from them. How: This clears the offer when it's still the claim's.



	traValObj.delete( claSnaObj.ref ); // What: Claim Delete Call. Why: The claim is over. How: This deletes its record.


} );

// #endregion retClaFun



const freSloFun = async ( uidValStr : string ) : Promise< boolean > => { // What: Free Slot Function. Why: A member offered a group has to be able to own it, or the rules refuse their acceptance. How: This counts their owned groups against the cap the rules apply.


	const accSnaObj = await FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ).get(); // What: Account Snapshot Object. Why: The owned groups and paid flag live there. How: This reads the account.

	const isaPaiBoo = !PAY_LOC_BOO || accSnaObj.get( 'paid' ) === true;           // What: Is-A Paid Boolean. Why: The cap follows paid status, and everyone counts as paid while the paywall is open. How: This mirrors the rules' isaPaiFun.
	const ownCouNum = Object.keys( accSnaObj.get( 'ownedGroups' ) ?? {} ).length; // What: Owned Count Number. Why: The cap counts groups owned. How: This counts the owned map's entries.



	return ownCouNum < ( isaPaiBoo ? 10 : 1 ); // What: Free Slot Return. Why: Paid users own up to 10 groups and free ones 1, as the rules' ownCapFun says. How: This compares the count with the cap.


};



// #region offClaFun

/**
 * offClaFun = Offer Claim Function
 *
 * @summary
 * Offers an inactive owner's group to the next member in line: the longest
 * standing member, by join time, who has been active since the cutoff,
 * hasn't passed on this claim, and has a free owned slot. With nobody left,
 * it records that everyone has passed. A record marked that way waits 30
 * days, then clears so the next run asks again from the top. The offer and
 * the record are written in a transaction that rereads the group and the
 * owner's membership, so a group whose owner came back or that gained an
 * offer since is left alone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groSnaObj - Group Snapshot Object: The group as the run found it.
 * @param nowMilNum - Now Milliseconds Number: The run's time, in
 *                    milliseconds.
 *
 * @returns A promise that settles once the claim moves on or waits, with no
 *          value.
 *
 * @example
 * ```ts
 * offClaFun(groSnaObj, Date.now()) // => Promise<void>
 * ```
 *
*/

const offClaFun = async ( groSnaObj : DocumentSnapshot, nowMilNum : number ) : Promise< void > => { // What: Offer Claim Function. Why: A group whose owner disappeared needs someone who can manage it (Section 18). How: This picks the next member and offers them the group, or records that nobody is left.


	const claRefObj = claRefFun( groSnaObj.id );             // What: Claim Reference Object. Why: The claim's progress lives there. How: This names the record.
	const cutMilNum = nowMilNum - INA_LIM_NUM;               // What: Cut Milliseconds Number. Why: Activity is judged against 30 days back. How: This is that time.
	const ownUidStr = groSnaObj.get( 'ownerUid' ) as string; // What: Owner UID String. Why: The owner is never offered their own group. How: This reads them. // What: Type Assertion Note. Why: The rules require every group to name its owner. How: The as reads it as a string.

	const [ claSnaObj, memQueObj ] = await Promise.all( [ claRefObj.get(), groSnaObj.ref.collection( 'members' ).get() ] ); // What: Claim And Members. Why: The pick reads who passed and who's in the group. How: This reads both at once.


	const exhTimObj = claSnaObj.get( 'exhaustedAt' ) as Timestamp | null | undefined; // What: Exhausted Time Object. Why: A claim nobody took waits before asking again. How: This reads when everyone had passed. // What: Type Assertion Note. Why: Only this function writes the record, as a timestamp or null. How: The as reads it as either, or missing.

	const resDueBoo = !!exhTimObj && nowMilNum - exhTimObj.toMillis() >= CLA_RES_NUM; // What: Reset Due Boolean. Why: After 30 days the run asks everyone again. How: This checks the wait has passed.



	if ( exhTimObj && !resDueBoo ) return; // What: Waiting Guard. Why: Everyone passed less than 30 days ago. How: This leaves the claim waiting.



	const pasUidObj = resDueBoo ? {} : ( claSnaObj.get( 'passedUids' ) ?? {} ) as Record< string, boolean >; // What: Passed UIDs Object. Why: Members who passed aren't asked again until a reset. How: This reads them, or starts empty after a reset. // What: Type Assertion Note. Why: Only this file and the offer functions write the map, of UIDs to true. How: The as reads it as one.


	const canMemArr = memQueObj.docs.filter( ( memSnaObj ) => { // What: Candidate Member Array. Why: The claim goes to the longest-standing active member who hasn't passed. How: This keeps those members, then sorts them by join time, oldest first.


		const actNowBoo = ( memSnaObj.get( 'lastActiveAt' ) as Timestamp ).toMillis() >= cutMilNum; // What: Active Now Boolean. Why: Only someone still using the app should be handed a group, which also rules out the owner, away since before the cutoff. How: This checks their last visit is since the cutoff. // What: Type Assertion Note. Why: The rules set every membership's activity time as a timestamp. How: The as reads it as one.
		const notPasBoo = !pasUidObj[ memSnaObj.id ];                                               // What: Not Passed Boolean. Why: Someone who passed isn't asked again until a reset. How: This checks the passed map.

		const canMemBoo = actNowBoo && notPasBoo; // What: Candidate Member Boolean. Why: Every check has to pass. How: This combines them.



		return canMemBoo; // What: Candidate Return. Why: The filter keeps the member when they qualify. How: This returns the combined answer.


	} ).sort( ( memOneObj, memTwoObj ) => ( memOneObj.get( 'joinedAt' ) as Timestamp ).toMillis() - ( memTwoObj.get( 'joinedAt' ) as Timestamp ).toMillis() ); // What: Join Order Sort. Why: The longest-standing member is asked first. How: This orders by join time, oldest first. // What: Type Assertion Note. Why: The rules set every join time as a timestamp. How: The as reads each as one.



	let canUidStr : string | null = null; // What: Candidate UID String. Why: The first candidate with a free slot gets the offer. How: This holds them once found.



	for ( const memSnaObj of canMemArr ) { // What: Candidate Loop. Why: A member without a free slot couldn't accept. How: This takes the first with one.


		if ( !( await freSloFun( memSnaObj.id ) ) ) continue; // What: Full Slots Skip. Why: The rules would refuse their acceptance. How: This moves on to the next member.



		canUidStr = memSnaObj.id; // What: Candidate Assignment. Why: This member is next in line and can accept. How: This records them.

		break; // What: Found Break. Why: One offer at a time. How: This stops the search.


	}



	await FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Claim Transaction. Why: The owner may have come back, or an offer appeared, since the run's reads. How: This rereads both before writing.


		const groNowObj = await traValObj.get( groSnaObj.ref );                                          // What: Group Now Object. Why: The group as it is now. How: This rereads it.
		const ownNowObj = await traValObj.get( groSnaObj.ref.collection( 'members' ).doc( ownUidStr ) ); // What: Owner Now Object. Why: The owner's activity as it is now. How: This rereads their membership.

		const ownLasNum = ( ownNowObj.get( 'lastActiveAt' ) as Timestamp | undefined )?.toMillis() ?? 0; // What: Owner Last Number. Why: Only an owner still away loses the group. How: This reads their last visit in milliseconds, as 0 when it's missing. // What: Type Assertion Note. Why: The rules set every membership's activity time as a timestamp. How: The as reads it as one, or missing.

		const offNowBoo = groNowObj.get( 'pendingOwnerUid' ) !== null; // What: Offer Now Boolean. Why: A standing offer has to run its course first. How: This checks for one.
		const ownBacBoo = ownLasNum >= cutMilNum;                      // What: Owner Back Boolean. Why: An owner who came back keeps the group. How: This checks their last visit is since the cutoff.
		const ownNewBoo = groNowObj.get( 'ownerUid' ) !== ownUidStr;   // What: Owner New Boolean. Why: A group that changed hands needs no claim. How: This compares the owners.

		const groChaBoo = offNowBoo || ownBacBoo || ownNewBoo; // What: Group Changed Boolean. Why: Any one of these ends this claim step. How: This combines them.


		if ( groChaBoo ) return; // What: Changed Group Guard. Why: The group no longer needs this step. How: This leaves it alone.



		if ( canUidStr ) traValObj.update( groSnaObj.ref, { pendingOfferedAt : Timestamp.fromMillis( nowMilNum ), pendingOwnerUid : canUidStr } ); // What: Claim Offer Call. Why: The member next in line gets the ordinary offer and its 7 days (Section 18). How: This makes the offer, stamped with the run's time.



		traValObj.set( claRefObj, { exhaustedAt : canUidStr ? null : Timestamp.fromMillis( nowMilNum ), offeredUid : canUidStr, passedUids : pasUidObj } ); // What: Claim Record Call. Why: The next run needs to know who has the offer, who passed, and whether anyone's left. How: This writes the record, marking it exhausted when nobody was found.


	} );


};

// #endregion offClaFun



// #region runDayFun

/**
 * runDayFun = Run Day Function
 *
 * @summary
 * Runs the day's three steps in order: lapsing old offers, ending claims
 * whose owner came back, and offering inactive owners' groups. Lapses go
 * first, so a claim offer that lapsed today moves to the next member in the
 * same run. Each group's step catches and logs its own failure, so one bad
 * group never stops the rest, and tomorrow's run tries it again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param nowMilNum - Now Milliseconds Number: The run's time, in
 *                    milliseconds.
 *
 * @returns A promise that settles once every step has run, with no value.
 *
 * @example
 * ```ts
 * runDayFun(Date.now()) // => Promise<void>
 * ```
 *
*/

const runDayFun = async ( nowMilNum : number ) : Promise< void > => { // What: Run Day Function. Why: The day's offer and claim upkeep happens in one pass. How: This runs the three steps in order.


	const inaCutNum = nowMilNum - INA_LIM_NUM; // What: Inactive Cut Number. Why: Owners away since before this have their groups claimed. How: This is 30 days back.
	const lapCutNum = nowMilNum - OFF_LIF_NUM; // What: Lapse Cut Number. Why: Offers made before this lapse. How: This is 7 days back.


	const lapQueObj = await FIR_DAT_OBJ.collection( 'groups' ).where( 'pendingOfferedAt', '<=', Timestamp.fromMillis( lapCutNum ) ).get(); // What: Lapse Query Object. Why: Only groups with an old offer need lapsing. How: This finds them.


	for ( const groSnaObj of lapQueObj.docs ) await lapOffFun( groSnaObj.ref, lapCutNum ).catch( ( errCatObj ) => console.warn( errCatObj ) ); // What: Lapse Loop. Why: Each old offer lapses on its own. How: This lapses each, logging a failure without stopping.



	const claQueObj = await FIR_DAT_OBJ.collectionGroup( 'ownerClaim' ).get(); // What: Claim Query Object. Why: Every claim under way is checked for a returned owner. How: This reads every claim record.


	for ( const claSnaObj of claQueObj.docs ) await retClaFun( claSnaObj, inaCutNum ).catch( ( errCatObj ) => console.warn( errCatObj ) ); // What: Return Loop. Why: Each claim is checked on its own. How: This ends each whose owner came back, logging a failure without stopping.



	const inaQueObj = await FIR_DAT_OBJ.collectionGroup( 'members' ).where( 'lastActiveAt', '<', Timestamp.fromMillis( inaCutNum ) ).get(); // What: Inactive Query Object. Why: Only a member away 30 days could be an owner to claim from. How: This finds every membership not active since the cutoff.



	for ( const memSnaObj of inaQueObj.docs ) { // What: Inactive Loop. Why: Each away member who owns their group starts or continues a claim. How: This walks the inactive memberships.


		const groSnaObj = await memSnaObj.ref.parent.parent!.get(); // What: Group Snapshot Object. Why: Only an owner's group is claimed, and not while an offer stands. How: This reads the membership's group. // What: Non-Null Note. Why: A member document always sits in a group's collection. How: The ! says the group reference is there.


		if ( groSnaObj.get( 'ownerUid' ) !== memSnaObj.id || groSnaObj.get( 'pendingOwnerUid' ) !== null ) continue; // What: Not Claimable Skip. Why: A member who isn't the owner, or a group with an offer standing, has nothing to claim today. How: This moves on.



		await offClaFun( groSnaObj, nowMilNum ).catch( ( errCatObj ) => console.warn( errCatObj ) ); // What: Claim Step Call. Why: The group moves to the next member in line, or waits. How: This runs the claim step, logging a failure without stopping.


	}


};

// #endregion runDayFun

// #endregion Helpers



// #region Module Init

const dayRunFun = onSchedule( { ...FUN_OPT_OBJ, schedule : 'every day 08:00', timeoutSeconds : 540, timeZone : 'UTC' }, () => runDayFun( Date.now() ) ); // What: Day Run Function. Why: Offers lapse and claims move on without anyone acting (Section 18). How: This runs the day's steps at 08:00 UTC, late night across the US, with up to 9 minutes to finish.

// #endregion Module Init



// #region Exports

export { dayRunFun }; // What: Named Export. Why: The entry file exports every function Firebase deploys. How: This exports the schedule.

// #endregion Exports


