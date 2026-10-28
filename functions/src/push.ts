


// #region Imports

import { FIR_DAT_OBJ  } from './setup.ts';               // What: Firestore Database Object. Why: Tokens live in Firestore, and the emulator's pushes are kept there. How: This reads and writes them past the rules.
import { getMessaging } from 'firebase-admin/messaging'; // What: Get Messaging. Why: Pushes go out through FCM. How: This returns the Admin SDK's messaging service.


import type { Message } from 'firebase-admin/messaging'; // What: Message. Why: A push is one FCM message. How: This types it.

// #endregion Imports



/**
 * push.ts = Push Notifications
 *
 * @summary
 * Sends one push to one identity's phone, through the single token stored
 * under their account (ARCHITECTURE.md Section 14). A push carries only the
 * group's name as its title and a fixed sentence for its kind, since
 * messages and display names are encrypted where the server can't read
 * them. Sending is best effort: an identity with no token gets nothing, a
 * failure is logged rather than thrown, so the notice written beside the
 * push still stands, and a token FCM rejects as no longer registered is
 * deleted, unless the app has replaced it since.
 *
 * There's no FCM emulator, so under the Functions emulator each push is
 * written to an emulatorPushes collection instead of sent, where the tests
 * read what went out. No rule covers that collection, and it's never
 * written outside the emulator.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

/**
 * PUS_TEX_OBJ = Push Text Object
 *
 * @summary
 * Each push kind mapped to the sentence its push shows beneath the group's
 * name. The notice kinds share their names with these keys, and offerMade
 * and claimMade push without a notice, since the person is there to see the
 * offer in the app.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const PUS_TEX_OBJ : Record< string, string > = { // What: Push Text Object. Why: Every push of a kind reads the same. How: This maps each kind to its sentence.


	claimMade        : "This group's owner has been away, and you've been asked to take it over.",
	groupDeleted     : 'The owner deleted this group.',
	offerAccepted    : 'The member you offered this group to accepted it.',
	offerDeclined    : 'The member you offered this group to declined it.',
	offerLapsed      : 'Your offer of this group ran out after 7 days.',
	offerLeft        : 'The member you offered this group to left it.',
	offerMade        : "You've been offered ownership of this group.",
	ownershipClaimed : 'A member took over this group while you were away.',
	removed          : 'You were removed from this group.'


};

const STA_COD_ARR = [ 'messaging/invalid-registration-token', 'messaging/registration-token-not-registered' ]; // What: Stale Code Array. Why: Only these errors mean the token itself is dead, rather than FCM having a bad moment. How: This lists FCM's codes for a token it no longer accepts.

// #endregion Constants



// #region Module State

const DEF_SEN_FUN = process.env.FUNCTIONS_EMULATOR === 'true' // What: Default Send Function. Why: There's no FCM emulator, and a real send from the emulator would fail. How: This picks the emulator outbox under the Functions emulator, and FCM everywhere else.
	? async ( mesValObj : Message ) => { await FIR_DAT_OBJ.collection( 'emulatorPushes' ).add( mesValObj ); } // What: Outbox Sender. Why: The tests need to see what would have gone out. How: This stores the message.
	: async ( mesValObj : Message ) => { await getMessaging().send( mesValObj ); };                           // What: FCM Sender. Why: Real pushes go through FCM. How: This sends the message.

// #endregion Module State



// #region Helpers

// #region pusSenFun

/**
 * pusSenFun = Push Send Function
 *
 * @summary
 * Sends one identity a push of the given kind about a group, if they have a
 * token stored. It never throws: a token FCM rejects as dead is deleted
 * unless it changed since it was read, and any other failure is logged.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: Who the push goes to.
 * @param kinValStr - Kind Value String: Which push it is, picking its
 *                    sentence from {@link PUS_TEX_OBJ}.
 * @param groNamStr - Group Name String: The group's name, as the title.
 * @param senValFun - Send Value Function: What delivers the message, FCM
 *                    by default, or the outbox under the emulator.
 *
 * @returns A promise that settles once the push is sent or given up on,
 *          with no value.
 *
 * @example
 * ```ts
 * pusSenFun('bob', 'removed', 'Picnic') // => Promise<void>
 * ```
 *
*/

const pusSenFun = async ( uidValStr : string, kinValStr : string, groNamStr : string, senValFun : ( mesValObj : Message ) => Promise< void > = DEF_SEN_FUN ) : Promise< void > => { // What: Push Send Function. Why: Every push reaches its phone the same way. How: This reads the token, sends, and cleans up a dead token.


	const tokSnaObj = await FIR_DAT_OBJ.doc( `accounts/${ uidValStr }/pushToken/current` ).get(); // What: Token Snapshot Object. Why: The push goes to the identity's one phone. How: This reads their stored token.


	if ( !tokSnaObj.exists ) return; // What: No Token Guard. Why: Someone without notifications on gets no push. How: This ends the call.



	try { // What: Send Attempt. Why: A send can fail for a dead token or for FCM itself. How: This sends and catches either.


		await senValFun( { notification : { body : PUS_TEX_OBJ[ kinValStr ], title : groNamStr }, token : tokSnaObj.get( 'token' ) } ); // What: Send Call. Why: The phone shows the group's name over the kind's sentence. How: This sends the message to the stored token.


	}

	catch ( errCatObj ) { // What: Send Failure Catch. Why: A push is best effort, and a dead token should go. How: This deletes a rejected token, or logs any other failure.


		console.warn( errCatObj ); // What: Failure Log. Why: A failed push stays visible to anyone debugging. How: This logs it.



		if ( !STA_COD_ARR.includes( ( errCatObj as { code? : string } ).code ?? '' ) ) return; // What: Not Stale Guard. Why: Only a dead token should be deleted. How: This ends the call for any other failure. // What: Type Assertion Note. Why: FCM's errors carry a code, while a caught value is unknown. How: The as reads it as an object that may hold one.



		await tokSnaObj.ref.delete( { lastUpdateTime : tokSnaObj.updateTime! } ).catch( () => undefined ); // What: Stale Token Delete. Why: A dead token would fail every push. How: This deletes it only if it hasn't changed since it was read, ignoring a refusal, which means the app stored a new one. // What: Non-Null Note. Why: A snapshot that exists always has an update time. How: The ! says it's here.


	}


};

// #endregion pusSenFun

// #endregion Helpers



// #region Exports

export { pusSenFun }; // What: Named Export. Why: Every function that tells someone something sends its push this way. How: This exports the helper.

// #endregion Exports


