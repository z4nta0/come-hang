


// #region Imports

import { Bytes           } from 'firebase/firestore';      // What: Bytes. Why: The wrapped key, encrypted name, and IV are stored as Firestore bytes (Section 6). How: This wraps raw bytes.
import { collection      } from 'firebase/firestore';      // What: Collection. Why: Members list a group's pending requests. How: This names the requests collection.
import { deleteDoc       } from 'firebase/firestore';      // What: Delete Doc. Why: A joiner withdraws a request, and a member declines one. How: This deletes it.
import { doc             } from 'firebase/firestore';      // What: Doc. Why: Each document a join touches is named by path. How: This builds a reference.
import { encTexFun       } from '../platform/crypto.ts';   // What: Encrypt Text Function. Why: The joiner's name is stored encrypted once they're in. How: This encrypts it with the group key.
import { FieldPath       } from 'firebase/firestore';      // What: Field Path. Why: A group's ID or a UID becomes a key in a map. How: This names it without reading it as a dotted path.
import { firGetFun       } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Every step reads or writes Firestore. How: This returns the services.
import { getDoc          } from 'firebase/firestore';      // What: Get Doc. Why: Invites, public keys, requests, and accounts are read one at a time. How: This reads one document.
import { getDocs         } from 'firebase/firestore';      // What: Get Docs. Why: Members review every pending request. How: This reads the collection.
import { ideEnsFun       } from './identity.ts';           // What: Identity Ensure Function. Why: Asking to join is a first group action, and every other step acts as this identity. How: This makes sure it exists.
import { joiNotFun       } from '../core/text-limits.ts';  // What: Join Note Function. Why: A note is checked before it's sent. How: This applies the limits.
import { keyLoaFun       } from './groups.ts';             // What: Key Load Function. Why: An approver wraps the group's key for the joiner. How: This loads it.
import { perNamFun       } from '../core/text-limits.ts';  // What: Person Name Function. Why: A name is checked before it's sent. How: This applies the limits.
import { runTransaction  } from 'firebase/firestore';      // What: Run Transaction. Why: An approval reads the count it raises. How: This runs the reads and writes together.
import { serverTimestamp } from 'firebase/firestore';      // What: Server Timestamp. Why: The rules require the server's time on a request and a membership. How: This asks the server to fill it in.
import { setDoc          } from 'firebase/firestore';      // What: Set Doc. Why: A joiner files their request. How: This writes it.
import { texNorFun       } from '../core/text-limits.ts';  // What: Text Normalize Function. Why: A typed name and note are tidied before they're checked. How: This normalizes them.
import { Timestamp       } from 'firebase/firestore';      // What: Timestamp. Why: A request's expiry is a time the client sets. How: This builds and reads it.
import { wraKeyFun       } from '../platform/crypto.ts';   // What: Wrap Key Function. Why: The joiner's membership holds the group key wrapped for them. How: This wraps it.
import { writeBatch      } from 'firebase/firestore';      // What: Write Batch. Why: A block and the request's end land together. How: This groups the writes.

// #endregion Imports



/**
 * joins.ts = Joins
 *
 * @summary
 * Joining a group through its invite link (ARCHITECTURE.md Sections 9 and
 * 17). A joiner reads the invite to see the group's name, then files a join
 * request with their name and an optional note, which they can withdraw or
 * check on. Any member lists the pending requests and answers one: an
 * approval is one transaction that wraps the group key for the joiner's
 * published public key, creates their membership with their name encrypted
 * under the group key, adds the group to their account, counts them, and
 * ends the request; a decline ends it, and a block also puts the joiner on
 * the group's blocklist. Once in, the joiner reads the group's key from
 * their own wrap with groups.ts's keyLoaFun.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const DAY_MIL_NUM = 86400000;              // What: Day Milliseconds Number. Why: A request lasts 7 days. How: This is one day in milliseconds.
const TOK_FOR_REG = /^[A-Za-z0-9_-]{22}$/; // What: Token Form Regular Expression. Why: A token pasted from anywhere becomes part of a document path. How: This allows only the 22 base64url characters every token has (Section 11.6).

// #endregion Constants



// #region Helpers

type InvRecTyp = { groIdeStr : string, groNamStr : string }; // What: Invite Record Type. Why: The invite screen shows which group a link opens. How: This types what invGetFun resolves with.

// #region invGetFun

/**
 * invGetFun = Invite Get Function
 *
 * @summary
 * Resolves with the group an invite token opens and its name, or null when
 * the token isn't in a token's form or no invite has it, as after the link
 * was rotated. Makes sure the identity exists first, since reading an
 * invite needs a sign-in.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param tokValStr - Token Value String: The invite token from the link.
 *
 * @returns A promise that resolves with the group's ID and name, or null.
 *
 * @example
 * ```ts
 * invGetFun('q1W...') // => { groIdeStr : 'Xk3...', groNamStr : 'Beach Day' }
 * ```
 *
*/

const invGetFun = async ( tokValStr : string ) : Promise< InvRecTyp | null > => { // What: Invite Get Function. Why: The joiner sees which group they're asking to join before they ask. How: This reads the invite by its token.


	if ( !TOK_FOR_REG.test( tokValStr ) ) return null; // What: Token Form Guard. Why: Anything else could name another path, and no invite has it anyway. How: This resolves null.



	await ideEnsFun(); // What: Identity Ensure Call. Why: The rules let only a signed-in identity read an invite. How: This makes sure one exists.


	const invSnaObj = await getDoc( doc( firGetFun().fstDatObj, `invites/${ tokValStr }` ) ); // What: Invite Snapshot Object. Why: The invite names its group. How: This reads it.


	if ( !invSnaObj.exists() ) return null; // What: Invite Guard. Why: A rotated link has no invite. How: This resolves null.



	return { // What: Invite Return. Why: The invite screen shows the group's name, and the request goes to its ID. How: This returns both.


		groIdeStr : invSnaObj.get( 'groupId' ) as string,  // What: Group Identifier String. Why: The request is filed in this group. How: This reads the invite's group ID. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
		groNamStr : invSnaObj.get( 'groupName' ) as string // What: Group Name String. Why: The joiner sees which group they're asking to join. How: This reads the invite's copy of the name. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.


	};


};

// #endregion invGetFun



// #region reqCreFun

/**
 * reqCreFun = Request Create Function
 *
 * @summary
 * Files this identity's request to join the group an invite token opens,
 * with a 7-day expiry, and resolves with the group's ID. The name and note
 * are tidied first, and either outside its limits rejects with a RangeError
 * before anything is written. A token with no invite rejects with an Error.
 * The rules refuse a joiner who is blocked, already in, or out of slots.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param tokValStr - Token Value String: The invite token from the link.
 * @param perNamStr - Person Name String: The joiner's full name, as typed.
 * @param notValStr - Note Value String: The note to the group, as typed,
 *                    empty for none.
 *
 * @returns A promise that resolves with the group's ID.
 *
 * @example
 * ```ts
 * reqCreFun('q1W...', 'Dana Lee', "Sam's cousin") // => 'Xk3...'
 * ```
 *
*/

const reqCreFun = async ( tokValStr : string, perNamStr : string, notValStr : string ) : Promise< string > => { // What: Request Create Function. Why: Every join waits for a member's approval (Section 17). How: This checks the name and note, then files the request through the invite.


	const notNorStr = texNorFun( notValStr ); // What: Note Normalized String. Why: The note is sent tidied. How: This normalizes it.
	const perNorStr = texNorFun( perNamStr ); // What: Person Normalized String. Why: The name is sent tidied. How: This normalizes it.


	if ( !perNamFun( perNorStr ) ) throw new RangeError( 'The name is outside its limits.' ); // What: Person Name Guard. Why: The rules would refuse it. How: This rejects first.



	if ( !joiNotFun( notNorStr ) ) throw new RangeError( 'The note is outside its limits.' ); // What: Join Note Guard. Why: The rules would refuse it. How: This rejects first.



	const invRecObj = await invGetFun( tokValStr ); // What: Invite Record Object. Why: The request goes to the group the link opens. How: This reads the invite.


	if ( !invRecObj ) throw new Error( 'The invite link is no longer valid.' ); // What: Invite Guard. Why: A rotated link opens nothing. How: This rejects.



	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: A request is filed under its joiner's UID. How: This reads the identity.

	const reqDatObj : Record< string, unknown > = { // What: Request Data Object. Why: The request holds the name, the token, and its times. How: This builds the fields every request has, typed open so a note can join them.


		expireAt    : Timestamp.fromMillis( Date.now() + 7 * DAY_MIL_NUM ), // What: Expire At. Why: An ignored request clears itself after 7 days through its TTL. How: This sets the expiry from the device's clock, which the rules accept within a day either way.
		inviteToken : tokValStr,                                            // What: Invite Token. Why: The rules check the request came through the group's working invite. How: This names the token used.
		nameText    : perNorStr,                                            // What: Name Text. Why: The approver has to recognize the joiner. How: This holds the tidied name.
		requestedAt : serverTimestamp()                                     // What: Requested At. Why: The rules require the server's time. How: This asks the server to fill it in.


	};


	if ( notNorStr !== '' ) reqDatObj.noteText = notNorStr; // What: Note Assignment. Why: A note is optional and is left out when empty. How: This adds it when there is one.



	await setDoc( doc( firGetFun().fstDatObj, `groups/${ invRecObj.groIdeStr }/joinRequests/${ uidValStr }` ), reqDatObj ); // What: Request Set Call. Why: Members see the request and answer it. How: This files it under the joiner's UID.



	return invRecObj.groIdeStr; // What: Group Return. Why: The app checks on the request by group. How: This returns the group's ID.


};

// #endregion reqCreFun



type JoiStaTyp = 'ended' | 'member' | 'pending'; // What: Join Status Type. Why: A joiner's request is waiting, has let them in, or has ended without them. How: This lists the three states.

// #region reqStaFun

/**
 * reqStaFun = Request Status Function
 *
 * @summary
 * Resolves with where this identity's join stands in a group: 'pending'
 * while its unexpired request waits, 'member' once the group is in its
 * account, and 'ended' otherwise, after a decline, a block, a withdrawal,
 * or an expiry. The request is read before the account, so an approval
 * landing between the two reads still shows as pending rather than ended.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group asked to join.
 *
 * @returns A promise that resolves with the join's status.
 *
 * @example
 * ```ts
 * reqStaFun('Xk3...') // => 'pending'
 * ```
 *
*/

const reqStaFun = async ( groIdeStr : string ) : Promise< JoiStaTyp > => { // What: Request Status Function. Why: The joiner's app waits for an answer, then opens the group. How: This reads the request, then the account.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The joiner's request and account are under their UID. How: This reads the identity.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: Both reads go to Firestore. How: This reads the service.

	const reqSnaObj = await getDoc( doc( fstDatObj, `groups/${ groIdeStr }/joinRequests/${ uidValStr }` ) ); // What: Request Snapshot Object. Why: A waiting request means no answer yet. How: This reads it.


	if ( reqSnaObj.exists() && ( reqSnaObj.get( 'expireAt' ) as Timestamp ).toMillis() > Date.now() ) return 'pending'; // What: Pending Guard. Why: An expired request may linger until its TTL deletion runs, but it's over. How: This returns pending for an unexpired one. // What: Type Assertion Note. Why: The rules store the expiry as a timestamp. How: The as reads it as one.



	const accSnaObj = await getDoc( doc( fstDatObj, `accounts/${ uidValStr }` ) ); // What: Account Snapshot Object. Why: An approval adds the group to the joiner's account. How: This reads it.



	return accSnaObj.get( new FieldPath( 'memberGroups', groIdeStr ) ) === true ? 'member' : 'ended'; // What: Status Return. Why: With no request left, the account says whether it ended in a membership. How: This returns member or ended.


};

// #endregion reqStaFun



// #region reqWitFun

/**
 * reqWitFun = Request Withdraw Function
 *
 * @summary
 * Withdraws this identity's join request in a group by deleting it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group asked to join.
 *
 * @returns A promise that settles once the request is gone, with no value.
 *
 * @example
 * ```ts
 * reqWitFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const reqWitFun = async ( groIdeStr : string ) : Promise< void > => deleteDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/joinRequests/${ ( await ideEnsFun() ).uidValStr }` ) ); // What: Request Withdraw Function. Why: A joiner may take back their request (Section 17). How: This deletes their own request in the group.

// #endregion reqWitFun



type ReqRecTyp = { namTexStr : string, notTexStr : string, reqTimNum : number, uidValStr : string }; // What: Request Record Type. Why: An approver sees who is asking, their note, and when. How: This types one pending request as reqLisFun lists it.

// #region reqLisFun

/**
 * reqLisFun = Request List Function
 *
 * @summary
 * Resolves with a group's pending join requests, oldest first, for a member
 * to review. A request past its expiry is left out, since its TTL deletion
 * can run a day late.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the pending requests.
 *
 * @example
 * ```ts
 * reqLisFun('Xk3...') // => [ { namTexStr : 'Dana Lee', ... } ]
 * ```
 *
*/

const reqLisFun = async ( groIdeStr : string ) : Promise< ReqRecTyp[] > => { // What: Request List Function. Why: Any member may answer a request (Section 17). How: This reads the group's requests and keeps the unexpired ones.


	const reqSnaObj = await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/joinRequests` ) );                     // What: Requests Snapshot Object. Why: Every pending request is in the group's collection. How: This reads it.
	const reqDocArr = reqSnaObj.docs.filter( ( reqDocObj ) => ( reqDocObj.get( 'expireAt' ) as Timestamp ).toMillis() > Date.now() ); // What: Request Document Array. Why: An expired request is over. How: This keeps the unexpired ones. // What: Type Assertion Note. Why: The rules store the expiry as a timestamp. How: The as reads it as one.


	const reqRecArr = reqDocArr.map( ( reqDocObj ) : ReqRecTyp => { // What: Request Record Array. Why: The review shows each request. How: This reads each one's fields into a record.


		return { // What: Record Return. Why: Each request becomes one record. How: This returns its fields.


			namTexStr : reqDocObj.get( 'nameText' ) as string,                      // What: Name Text String. Why: The approver recognizes the joiner by it. How: This reads the request's name. // What: Type Assertion Note. Why: The rules store the name as a string. How: The as reads it as one.
			notTexStr : ( reqDocObj.get( 'noteText' ) ?? '' ) as string,            // What: Note Text String. Why: A note helps when the name isn't enough. How: This reads it, empty when there's none. // What: Type Assertion Note. Why: The rules store a note as a string. How: The as reads it as one.
			reqTimNum : ( reqDocObj.get( 'requestedAt' ) as Timestamp ).toMillis(), // What: Request Time Number. Why: The review orders requests by age. How: This reads the time in milliseconds. // What: Type Assertion Note. Why: The rules store the time as a timestamp. How: The as reads it as one.
			uidValStr : reqDocObj.id                                                // What: UID Value String. Why: Answering a request names its joiner. How: This reads the request's ID, the joiner's UID.


		};


	} );



	return reqRecArr.sort( ( recOneObj, recTwoObj ) => recOneObj.reqTimNum - recTwoObj.reqTimNum ); // What: Requests Return. Why: The longest-waiting request is answered first. How: This returns the records oldest first.


};

// #endregion reqLisFun



// #region reqAppFun

/**
 * reqAppFun = Request Approve Function
 *
 * @summary
 * Lets a joiner into a group as one transaction, as the rules require:
 * their membership with the group key wrapped for their published public
 * key and the name from their request encrypted under the group key, the
 * group in their account's member map, the group's count raised with them
 * as the one counted, and their request deleted. Rejects with an Error when
 * the request has already been answered or has expired, and the rules
 * refuse an approval past either side's caps.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param joiUidStr - Joiner UID String: The UID of the person asking.
 *
 * @returns A promise that settles once the joiner is in, with no value.
 *
 * @example
 * ```ts
 * reqAppFun('Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const reqAppFun = async ( groIdeStr : string, joiUidStr : string ) : Promise< void > => { // What: Request Approve Function. Why: An approver is online and holds the group key by definition, so they hand it to the joiner (Section 17). How: This wraps the key for the joiner and lets them in in one transaction.


	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The approval reads and writes Firestore. How: This reads the service.

	const groKeyObj = await keyLoaFun( groIdeStr );                                                                          // What: Group Key Object. Why: The joiner gets the group's own key. How: This loads it.
	const useSnaObj = await getDoc( doc( fstDatObj, `users/${ joiUidStr }` ) );                                              // What: User Snapshot Object. Why: The key is wrapped for the joiner's published public key. How: This reads it.
	const joiRawArr = ( useSnaObj.get( 'publicKey' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >;                 // What: Joiner Raw Array. Why: A wrap is made from the raw key. How: This reads its bytes. // What: Type Assertion Note. Why: The rules store the key as bytes, and toUint8Array returns an array over a plain buffer. How: The two as read them as such.
	const wraKeyArr = await wraKeyFun( groKeyObj, joiRawArr );                                                               // What: Wrapped Key Array. Why: Only the joiner can open their wrap. How: This wraps the key for them.
	const memSnaObj = await getDocs( collection( fstDatObj, `groups/${ groIdeStr }/members` ) );                             // What: Members Snapshot Object. Why: The joiner's color is the lowest slot no member holds (Section 11.3). How: This reads the memberships.
	const useSloSet = new Set( memSnaObj.docs.map( ( memDocObj ) : unknown => memDocObj.get( 'colorSlot' ) ) );              // What: Used Slot Set. Why: A slot already worn isn't free. How: This collects every member's slot.
	const colSloNum = [ ...Array( 50 ).keys() ].find( ( sloIndNum ) => !useSloSet.has( sloIndNum ) ) ?? memSnaObj.size % 50; // What: Color Slot Number. Why: Members should be told apart by color while the group has room, which the 50 member cap always leaves. How: This takes the lowest free slot, wrapping round by the member count should none be free.
	const groRefObj = doc( fstDatObj, `groups/${ groIdeStr }` );                                                             // What: Group Reference Object. Why: The count rises with the membership. How: This names the group.
	const reqRefObj = doc( fstDatObj, `groups/${ groIdeStr }/joinRequests/${ joiUidStr }` );                                 // What: Request Reference Object. Why: The request supplies the name and ends with the approval. How: This names it.


	await runTransaction( fstDatObj, async ( traValObj ) => { // What: Approval Transaction. Why: Two approvals at once must not count the group to the same number. How: This reads the request and the count, then writes every change together, retrying on a conflict.


		const groSnaObj = await traValObj.get( groRefObj ); // What: Group Snapshot Object. Why: The count rises from its current value. How: This reads the group.
		const reqSnaObj = await traValObj.get( reqRefObj ); // What: Request Snapshot Object. Why: Only a waiting request can be approved. How: This reads it.


		if ( !reqSnaObj.exists() || ( reqSnaObj.get( 'expireAt' ) as Timestamp ).toMillis() <= Date.now() ) throw new Error( 'The request is no longer waiting.' ); // What: Request Guard. Why: Another member may have answered it, or it expired. How: This rejects. // What: Type Assertion Note. Why: The rules store the expiry as a timestamp. How: The as reads it as one.



		const namEncObj = await encTexFun( groKeyObj, reqSnaObj.get( 'nameText' ) as string ); // What: Name Encrypted Object. Why: The joiner's name starts as the one they asked with, encrypted, since the request holding it ends now (Section 17). How: This encrypts it under the group key. // What: Type Assertion Note. Why: The rules store the name as a string. How: The as reads it as one.


		traValObj.set( doc( fstDatObj, `groups/${ groIdeStr }/members/${ joiUidStr }` ), { // What: Member Set Call. Why: The joiner becomes a member. How: This writes their membership with the wrapped key, encrypted name, and color slot.


			colorSlot       : colSloNum,
			displayNameEnc  : Bytes.fromUint8Array( namEncObj.cipTexArr ),
			iv              : Bytes.fromUint8Array( namEncObj.iniVecArr ),
			joinedAt        : serverTimestamp(),
			lastActiveAt    : serverTimestamp(),
			wrappedGroupKey : Bytes.fromUint8Array( wraKeyArr )


		} );

		traValObj.update( doc( fstDatObj, `accounts/${ joiUidStr }` ), new FieldPath( 'memberGroups', groIdeStr ), true ); // What: Account Update Call. Why: The group takes one of the joiner's slots (Section 18). How: This adds it to their member map.

		traValObj.update( groRefObj, { // What: Group Update Call. Why: The count includes the joiner. How: This raises it by one and names them as counted.


			countedUid  : joiUidStr,                                       // What: Counted UID. Why: The rules tie the count's change to this membership. How: This names the joiner.
			memberCount : ( groSnaObj.get( 'memberCount' ) as number ) + 1 // What: Member Count. Why: One approval counts one member. How: This raises the count read in the transaction. // What: Type Assertion Note. Why: The rules store the count as an integer. How: The as reads it as a number.


		} );

		traValObj.delete( reqRefObj ); // What: Request Delete Call. Why: An answered request ends, and the plaintext name with it. How: This deletes it.


	} );


};

// #endregion reqAppFun



// #region reqDecFun

/**
 * reqDecFun = Request Decline Function
 *
 * @summary
 * Declines a join request without blocking its sender, by deleting it. The
 * joiner may ask again through a working link.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param joiUidStr - Joiner UID String: The UID of the person asking.
 *
 * @returns A promise that settles once the request is gone, with no value.
 *
 * @example
 * ```ts
 * reqDecFun('Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const reqDecFun = ( groIdeStr : string, joiUidStr : string ) : Promise< void > => deleteDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/joinRequests/${ joiUidStr }` ) ); // What: Request Decline Function. Why: Any member may turn a request down (Section 17). How: This deletes it.

// #endregion reqDecFun



// #region reqBloFun

/**
 * reqBloFun = Request Block Function
 *
 * @summary
 * Declines a join request and blocks its sender in one batch, as the rules
 * require: the joiner's UID is added to the group's blocklist, so that
 * identity can't redeem any of the group's links again, and their request
 * is deleted.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param joiUidStr - Joiner UID String: The UID of the person asking.
 *
 * @returns A promise that settles once the block lands, with no value.
 *
 * @example
 * ```ts
 * reqBloFun('Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const reqBloFun = async ( groIdeStr : string, joiUidStr : string ) : Promise< void > => { // What: Request Block Function. Why: A request from someone unwelcome shouldn't come back with the same identity (Section 17). How: This blocks the sender and ends the request together.


	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The batch writes Firestore. How: This reads the service.

	const batWriObj = writeBatch( fstDatObj ); // What: Batch Write Object. Why: The rules check the block against the request's end. How: This starts the batch.


	batWriObj.update( doc( fstDatObj, `groups/${ groIdeStr }` ), new FieldPath( 'removedUids', joiUidStr ), true ); // What: Block Update Call. Why: The blocklist stops this identity redeeming any link. How: This adds the UID to it.

	batWriObj.delete( doc( fstDatObj, `groups/${ groIdeStr }/joinRequests/${ joiUidStr }` ) ); // What: Request Delete Call. Why: A block answers the request. How: This deletes it.

	await batWriObj.commit(); // What: Batch Commit Call. Why: Both land or neither does. How: This commits the batch.


};

// #endregion reqBloFun

// #endregion Helpers



// #region Exports

export { invGetFun, type JoiStaTyp, reqAppFun, reqBloFun, reqCreFun, reqDecFun, reqLisFun, type ReqRecTyp, reqStaFun, reqWitFun }; // What: Named Exports. Why: The invite, join, and review screens drive joining through these. How: This exports the functions and their record types.

// #endregion Exports


