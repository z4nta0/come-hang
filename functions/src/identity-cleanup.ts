


// #region Imports

import { FIR_DAT_OBJ } from './setup.ts';                      // What: Firestore Database Object. Why: An identity's account says whether it's in a group or paid. How: This reads and deletes it past the rules.
import { FUN_OPT_OBJ } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: The schedule spreads them in.
import { getAuth     } from 'firebase-admin/auth';             // What: Get Auth. Why: Every identity has a sign-in record, which says when it was last used, and each deleted one goes. How: This returns Auth, which lists and deletes them.
import { onSchedule  } from 'firebase-functions/v2/scheduler'; // What: On Schedule. Why: The cleanup happens once a day by itself. How: This registers a scheduled function.


import type { UserRecord } from 'firebase-admin/auth'; // What: User Record. Why: The cleanup reads each sign-in record's times and providers. How: This types one.

// #endregion Imports



/**
 * identity-cleanup.ts = Identity Cleanup
 *
 * @summary
 * A scheduled function that runs once a day (ARCHITECTURE.md Section 8),
 * deleting identities nobody uses: a phone wiped or lost without deleting its
 * data leaves its account, public key, and sign-in record behind. An identity
 * is deleted once its phone hasn't refreshed its sign-in for 180 days, which
 * the app does at least hourly while it's open, and only when it's in no
 * group, has no purchase, and has no Google account linked, since a linked
 * identity can still be recovered, and a purchase is never thrown away. An
 * identity with no account at all, whose bootstrap never finished, holds
 * nothing and goes too. The last of an identity is deleted the same way when
 * someone deletes their data, which shares that step from here.
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

const IDL_LIM_NUM = 180 * 24 * 60 * 60 * 1000; // What: Idle Limit Number. Why: An identity unused this long, in no group, belongs to a phone that's gone, well past every other limit (notices last 30 days, push tokens 60). How: This is 180 days in milliseconds.

// #endregion Constants



// #region Helpers

// #region ideDelFun

/**
 * ideDelFun = Identity Delete Function
 *
 * @summary
 * Deletes what's left of an identity once it's in no group: its account with
 * the notices and push token under it, its public key, and last its sign-in
 * record, with any linked Google account, so a retry can still sign in until
 * the rest is gone. Each may already be gone, which is no error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: The identity being deleted.
 *
 * @returns A promise that settles once each is gone, with no value.
 *
 * @example
 * ```ts
 * ideDelFun('alice') // => Promise<void>
 * ```
 *
*/

const ideDelFun = async ( uidValStr : string ) : Promise< void > => { // What: Identity Delete Function. Why: Deleting one's data and the daily cleanup of unused identities end the same way. How: This deletes the account, the public key, and the sign-in record, in that order.


	await FIR_DAT_OBJ.recursiveDelete( FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ) ); // What: Account Delete Call. Why: The account, its notices, and its push token go. How: This deletes the account with everything under it.

	await FIR_DAT_OBJ.doc( `users/${ uidValStr }` ).delete(); // What: User Delete Call. Why: The public key has no one left to wrap a key for. How: This deletes it.



	try { await getAuth().deleteUser( uidValStr ); } // What: Sign-In Delete Attempt. Why: The sign-in record, with any linked Google account, goes last, so a retry can still sign in until it's done. How: This deletes it.

	catch ( errCatObj ) { if ( Reflect.get( Object( errCatObj ), 'code' ) !== 'auth/user-not-found' ) throw errCatObj; } // What: Missing Record Catch. Why: A record already gone means an earlier call finished. How: This ignores that error and passes on any other.


};

// #endregion ideDelFun



// #region idlDelFun

/**
 * idlDelFun = Idle Delete Function
 *
 * @summary
 * Deletes one unused identity when its account still shows it in no group
 * and unpaid, checked and deleted in a transaction, so a group joined or an
 * upgrade bought since the run read the sign-in record keeps the identity.
 * An identity with no account is deleted too. The rest goes through
 * ideDelFun, which finishes even after a retry.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: The unused identity.
 *
 * @returns A promise that settles once the identity is deleted or kept, with
 *          no value.
 *
 * @example
 * ```ts
 * idlDelFun('alice') // => Promise<void>
 * ```
 *
*/

const idlDelFun = async ( uidValStr : string ) : Promise< void > => { // What: Idle Delete Function. Why: An unused identity in no group holds nothing anyone needs. How: This deletes its account when it's still empty and unpaid, then the rest.


	const emtAccBoo = await FIR_DAT_OBJ.runTransaction( async ( traValObj ) : Promise< boolean > => { // What: Empty Account Boolean. Why: Only an identity in no group and unpaid is deleted. How: This rereads the account in a transaction, deletes it when it qualifies, and says whether it did.


		const accSnaObj = await traValObj.get( FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ) ); // What: Account Snapshot Object. Why: The account lists the groups and the purchase. How: This reads it in the transaction.
		const groCouNum = Object.keys( accSnaObj.get( 'memberGroups' ) ?? {} ).length + Object.keys( accSnaObj.get( 'ownedGroups' ) ?? {} ).length; // What: Group Count Number. Why: An identity in a group is still someone's member. How: This counts both maps, 0 with no account.


		if ( groCouNum > 0 || accSnaObj.get( 'paid' ) === true ) return false; // What: Kept Guard. Why: A member's identity stays, and a purchase is never thrown away. How: This leaves the account alone.



		traValObj.delete( accSnaObj.ref ); // What: Account Delete Call. Why: The empty account goes before anything can be added to it. How: This deletes it in the transaction.



		return true; // What: Deleted Return. Why: The rest of the identity follows. How: This says the account went.


	} );


	if ( emtAccBoo ) await ideDelFun( uidValStr ); // What: Identity Delete Call. Why: The notices, push token, public key, and sign-in record go with the account. How: This deletes them.


};

// #endregion idlDelFun



const lasUseFun = ( useRecObj : UserRecord ) : number => { // What: Last Use Function. Why: An anonymous identity signs in once and then only refreshes its sign-in while the app is open. How: This reads the last refresh in milliseconds, falling back to the last sign-in, then the creation, when there's none.


	const creTimStr = useRecObj.metadata.creationTime;    // What: Creation Time String. Why: A record always has one. How: This reads it.
	const refTimStr = useRecObj.metadata.lastRefreshTime; // What: Refresh Time String. Why: The app refreshes its sign-in while it's open. How: This reads the last refresh, missing when there's been none.
	const sigTimStr = useRecObj.metadata.lastSignInTime;  // What: Sign-In Time String. Why: An identity that never refreshed was last used when it signed in. How: This reads it.

	const lasUseStr = refTimStr || sigTimStr || creTimStr; // What: Last Use String. Why: The most recent kind of use that's recorded decides. How: This takes the refresh, then the sign-in, then the creation.



	return Date.parse( lasUseStr ); // What: Last Use Return. Why: The cutoff is compared in milliseconds. How: This parses the time.


};



// #region runCleFun

/**
 * runCleFun = Run Cleanup Function
 *
 * @summary
 * Walks every sign-in record, a page at a time, and deletes each identity
 * not used since 180 days before the run, unless a Google account is linked
 * to it, in which case it's kept. Each identity's deletion catches and logs
 * its own failure, so one never stops the rest, and the next run tries it
 * again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param nowMilNum - Now Milliseconds Number: The run's time, in
 *                    milliseconds.
 *
 * @returns A promise that settles once every record has been checked, with
 *          no value.
 *
 * @example
 * ```ts
 * runCleFun(Date.now()) // => Promise<void>
 * ```
 *
*/

const runCleFun = async ( nowMilNum : number ) : Promise< void > => { // What: Run Cleanup Function. Why: Identities left behind by wiped or lost phones mustn't pile up. How: This deletes each one unused for 180 days that qualifies.


	const cutMilNum = nowMilNum - IDL_LIM_NUM; // What: Cut Milliseconds Number. Why: Identities unused since before this are deleted. How: This is 180 days back.



	let pagTokStr : string | undefined; // What: Page Token String. Why: Sign-in records are listed a page at a time. How: This holds where the next page starts, undefined for the first.


	do { // What: Page Loop. Why: There may be more records than one page holds. How: This handles a page, then moves to the next until none is left.


		const lisResObj = await getAuth().listUsers( 1000, pagTokStr ); // What: List Result Object. Why: Each page brings its records and where the next starts. How: This lists up to 1,000 records.


		for ( const useRecObj of lisResObj.users ) { // What: Record Loop. Why: Each identity is judged on its own. How: This walks the page's records.


			const gooLinBoo = useRecObj.providerData.some( ( proDatObj ) => proDatObj.providerId === 'google.com' ); // What: Google Linked Boolean. Why: A linked identity can still be recovered on a new phone (Section 8). How: This looks for Google among its providers.


			if ( gooLinBoo || lasUseFun( useRecObj ) >= cutMilNum ) continue; // What: Kept Skip. Why: A linked identity, or one used within 180 days, stays. How: This moves on to the next record.



			await idlDelFun( useRecObj.uid ).catch( ( errCatObj ) => console.warn( errCatObj ) ); // What: Idle Delete Call. Why: The identity goes when its account still qualifies. How: This deletes it, logging a failure without stopping.


		}



		pagTokStr = lisResObj.pageToken; // What: Page Token Assignment. Why: The next page starts where this one ended. How: This stores its token, undefined after the last page.


	}

	while ( pagTokStr !== undefined ); // What: More Pages Check. Why: The last page has no token after it. How: This repeats while one is left.


};

// #endregion runCleFun

// #endregion Helpers



// #region Module Init

const ideCleFun = onSchedule( { ...FUN_OPT_OBJ, schedule : 'every day 09:00', timeoutSeconds : 540, timeZone : 'UTC' }, () => runCleFun( Date.now() ) ); // What: Identity Cleanup Function. Why: Identities left behind by wiped or lost phones are deleted without anyone acting (Section 8). How: This runs the cleanup at 09:00 UTC, an hour after the daily run, with up to 9 minutes to finish.

// #endregion Module Init



// #region Exports

export { ideCleFun, ideDelFun }; // What: Named Exports. Why: The entry file exports every function Firebase deploys, and deleting one's data ends the way the cleanup does. How: This exports the schedule and the identity deletion.

// #endregion Exports


