


// #region Imports

import { collection      } from 'firebase/firestore';        // What: Collection. Why: Members list the group's history requests. How: This names the collection.
import { decTexFun       } from '../platform/crypto.ts';     // What: Decrypt Text Function. Why: A bundle arrives encrypted. How: This decrypts it.
import { deleteDoc       } from 'firebase/firestore';        // What: Delete Doc. Why: A finished or withdrawn request goes. How: This deletes it.
import { deleteObject    } from 'firebase/storage';          // What: Delete Object. Why: A collected bundle goes. How: This deletes the file.
import { doc             } from 'firebase/firestore';        // What: Doc. Why: A request and a membership are named by path. How: This builds a reference.
import { encTexFun       } from '../platform/crypto.ts';     // What: Encrypt Text Function. Why: A bundle is sent encrypted. How: This encrypts it under the group key.
import { firGetFun       } from '../platform/firebase.ts';   // What: Firebase Get Function. Why: Requests live in Firestore and bundles in Storage. How: This returns the services.
import { getBytes        } from 'firebase/storage';          // What: Get Bytes. Why: The asker collects their bundle. How: This downloads it.
import { getDoc          } from 'firebase/firestore';        // What: Get Doc. Why: A request and the asker's join time are read. How: This reads one document.
import { getDocs         } from 'firebase/firestore';        // What: Get Docs. Why: Every open request is listed. How: This reads the collection.
import { ideEnsFun       } from './identity.ts';             // What: Identity Ensure Function. Why: Requests and claims name this identity. How: This reads it.
import { keyLoaFun       } from './groups.ts';               // What: Key Load Function. Why: A bundle is encrypted with the group key. How: This loads it.
import { mesLisFun       } from '../platform/chat-store.ts'; // What: Message List Function. Why: A helper shares what their device holds, and coverage is checked against it. How: This reads the history.
import { mesPutFun       } from '../platform/chat-store.ts'; // What: Message Put Function. Why: Received history joins the device's own. How: This stores a message.
import { onSnapshot      } from 'firebase/firestore';        // What: On Snapshot. Why: The prompts follow the requests as they change. How: This watches the collection.
import { ref             } from 'firebase/storage';          // What: Ref. Why: A bundle's file is named by path. How: This builds its reference.
import { runTransaction  } from 'firebase/firestore';        // What: Run Transaction. Why: A claim takes a request only while it's pending. How: This reads and writes it together.
import { serverTimestamp } from 'firebase/firestore';        // What: Server Timestamp. Why: The rules require the server's time on a request and a claim. How: This asks the server to fill it in.
import { setDoc          } from 'firebase/firestore';        // What: Set Doc. Why: A request is filed whole. How: This writes it.
import { Timestamp       } from 'firebase/firestore';        // What: Timestamp. Why: A request's times are timestamps. How: This builds and reads them.
import { updateDoc       } from 'firebase/firestore';        // What: Update Doc. Why: A claim is released and a request marked fulfilled. How: This updates it.
import { uploadBytes     } from 'firebase/storage';          // What: Upload Bytes. Why: A helper sends the bundle. How: This uploads it.


import type { MesRecTyp     } from '../platform/chat-store.ts'; // What: Message Record Type. Why: A bundle carries message records. How: This types them.
import type { QuerySnapshot } from 'firebase/firestore';        // What: Query Snapshot. Why: A read and a watch both turn a snapshot of the requests into records. How: This types it.

// #endregion Imports



/**
 * history.ts = History
 *
 * @summary
 * Peer-assisted chat history (ARCHITECTURE.md Section 11.9). A member with
 * no history on this device asks the group for it: a recovery, for the chat
 * since they joined, or a backlog, for chat from a chosen start up to when
 * they joined. Another member whose device holds the whole range claims the
 * request, as a compare-and-swap so only one helper wins, and uploads the
 * range as one bundle encrypted under the group key, since the device keeps
 * its history decrypted. The asker downloads the bundle, keeps the messages
 * that fall in the range and are well-formed, marks the request fulfilled,
 * and deletes the bundle and the request. A helper may let a claim go, and
 * any member may free one stalled for 30 minutes. A request is offered only
 * to a device holding none of the group's chat, and members watch the open
 * requests as they change.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type HisKinTyp = 'backlog' | 'recovery';                     // What: History Kind Type. Why: A request asks for older chat or for the asker's own. How: This lists the two kinds.
type RanRecTyp = { begTimNum : number, endTimNum : number }; // What: Range Record Type. Why: A request's range bounds what's sent and kept. How: This types a start, inclusive, and an end, exclusive, in milliseconds.

type HisRecTyp = { claTimNum : number | null, claUidStr : string | null, kinValStr : HisKinTyp, ranTimNum : number | null, staValStr : string, uidReqStr : string }; // What: History Record Type. Why: The app shows each open request and who's helping. How: This types one request as hisLisFun lists it.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: A request expires in days. How: This is one day in milliseconds.

// #endregion Constants



// #region Helpers

// #region hisRecFun

/**
 * hisRecFun = History Records Function
 *
 * @summary
 * Reads a snapshot of a group's history requests into the open ones'
 * records, pending or claimed, each with its asker, kind, start, status, and
 * claim, leaving out a fulfilled one, which is about to go.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param hisSnaObj - Histories Snapshot Object: The requests as read or
 *                    watched.
 *
 * @returns The open requests' records.
 *
 * @example
 * ```ts
 * hisRecFun(hisSnaObj) // => [ { kinValStr : 'recovery', ... } ]
 * ```
 *
*/

const hisRecFun = ( hisSnaObj : QuerySnapshot ) : HisRecTyp[] => hisSnaObj.docs.filter( ( hisDocObj ) => hisDocObj.get( 'status' ) !== 'fulfilled' ).map( ( hisDocObj ) : HisRecTyp => { // What: History Records Function. Why: A read and a watch of the requests report them the same way. How: This keeps the open ones and reads each into a record.


	return { // What: Record Return. Why: Each request becomes one record. How: This returns its fields.


		claTimNum : ( hisDocObj.get( 'claimedAt' ) as Timestamp | null )?.toMillis() ?? null,  // What: Claim Time Number. Why: A claim stalls after 30 minutes. How: This reads when it was claimed, null when it isn't. // What: Type Assertion Note. Why: The rules store a timestamp or null. How: The as reads it as either.
		claUidStr : hisDocObj.get( 'claimedByUid' ) as string | null,                          // What: Claim UID String. Why: The app shows who's helping. How: This reads the claimant, null when unclaimed. // What: Type Assertion Note. Why: The rules store a UID or null. How: The as reads it as either.
		kinValStr : hisDocObj.get( 'kind' ) as HisKinTyp,                                      // What: Kind Value String. Why: The app words each kind its own way. How: This reads it. // What: Type Assertion Note. Why: The rules allow only the two kinds. How: The as reads it as one.
		ranTimNum : ( hisDocObj.get( 'rangeStart' ) as Timestamp | null )?.toMillis() ?? null, // What: Range Time Number. Why: A backlog's start says how far back it asks. How: This reads it, null for a recovery. // What: Type Assertion Note. Why: The rules store a timestamp or null. How: The as reads it as either.
		staValStr : hisDocObj.get( 'status' ) as string,                                       // What: Status Value String. Why: A pending request is open to help. How: This reads it. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
		uidReqStr : hisDocObj.id                                                               // What: UID Requester String. Why: A request is claimed by its asker's UID. How: This reads the document's ID.


	};


} );

// #endregion hisRecFun



// #region hisLisFun

/**
 * hisLisFun = History List Function
 *
 * @summary
 * Resolves with a group's open history requests, pending or claimed, each
 * with its asker, kind, start, status, and claim.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the requests.
 *
 * @example
 * ```ts
 * hisLisFun('Xk3...') // => [ { kinValStr : 'recovery', ... } ]
 * ```
 *
*/

const hisLisFun = async ( groIdeStr : string ) : Promise< HisRecTyp[] > => hisRecFun( await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/historyRequests` ) ) ); // What: History List Function. Why: Members see who needs history, so a willing one can help. How: This reads the open requests.

// #endregion hisLisFun



// #region hisWatFun

/**
 * hisWatFun = History Watch Function
 *
 * @summary
 * Watches a group's open history requests, calling onReqFun with them now
 * and after every change, such as a claim, so a prompt to help goes the
 * moment someone else takes it, and calling onErrFun when the watch is
 * refused. Returns the function that stops it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param onReqFun  - On Requests Function: Called with the open requests.
 * @param onErrFun  - On Error Function: Called when the watch fails, by
 *                    default nothing.
 *
 * @returns The function that stops the watch.
 *
 * @example
 * ```ts
 * hisWatFun('Xk3...', onReqFun, onErrFun) // => () => void
 * ```
 *
*/

const hisWatFun = ( groIdeStr : string, onReqFun : ( hisRecArr : HisRecTyp[] ) => void, onErrFun : ( errValObj : Error ) => void = () => {} ) : () => void => onSnapshot( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/historyRequests` ), ( hisSnaObj ) => onReqFun( hisRecFun( hisSnaObj ) ), onErrFun ); // What: History Watch Function. Why: The prompts follow every request as it's asked, claimed, and answered. How: This watches the collection and reports its open requests.

// #endregion hisWatFun



const hisRefFun = ( groIdeStr : string, uidReqStr : string ) => doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/historyRequests/${ uidReqStr }` ); // What: History Reference Function. Why: Each request is keyed by its asker. How: This names one.



type HisProTyp = { creTimNum : number, joiTimNum : number, kinValStr : HisKinTyp }; // What: History Prompt Type. Why: The chat offers one kind of request, and a backlog's choices run between the group's start and the join. How: This types the kind with both times in milliseconds.

// #region hisProFun

/**
 * hisProFun = History Prompt Function
 *
 * @summary
 * Resolves with the history request to offer this identity in a group, or
 * null for none (Section 11.9). Only a device holding none of the group's
 * chat is offered one: for a day after joining, a backlog of the chat from
 * before the join, unless the group began within a minute of it, as it does
 * for its creator; after that, a recovery of the chat since the join, since
 * the device isn't the one that joined. Resolves null for an identity that
 * isn't a member.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the kind and both times, or null.
 *
 * @example
 * ```ts
 * hisProFun('Xk3...') // => { creTimNum, joiTimNum, kinValStr : 'backlog' }
 * ```
 *
*/

const hisProFun = async ( groIdeStr : string ) : Promise< HisProTyp | null > => { // What: History Prompt Function. Why: The chat offers history only when it's missing, and of the kind that fits. How: This checks the device's history, then the join's and the group's times.


	if ( ( await mesLisFun( groIdeStr ) ).length > 0 ) return null; // What: Held History Guard. Why: A device with chat already has history. How: This offers nothing.



	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The member's own join time decides the kind. How: This reads the identity.

	const [ groSnaObj, memSnaObj ] = await Promise.all( [ getDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }` ) ), getDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) ) ] ); // What: Group Snapshot Object. Why: The group's start bounds a backlog. How: This reads the group. // What: Member Snapshot Object. Why: The join splits the kinds. How: This reads the membership.


	if ( !groSnaObj.exists() || !memSnaObj.exists() ) return null; // What: Not Member Guard. Why: Only a member asks. How: This offers nothing otherwise.



	const creTimNum = ( groSnaObj.get( 'createdAt' ) as Timestamp ).toMillis(); // What: Created Time Number. Why: A backlog reaches back no further than the group's start. How: This reads it. // What: Type Assertion Note. Why: The rules require the server's time on a group. How: The as reads it as a timestamp.
	const joiTimNum = ( memSnaObj.get( 'joinedAt' ) as Timestamp ).toMillis();  // What: Join Time Number. Why: The join splits the kinds. How: This reads it. // What: Type Assertion Note. Why: The rules require the server's time on a membership. How: The as reads it as a timestamp.



	if ( Date.now() - joiTimNum >= DAY_MIL_NUM ) return { creTimNum, joiTimNum, kinValStr : 'recovery' }; // What: Recovery Guard. Why: A device without chat a day after the join isn't the one that joined. How: This offers a recovery.



	return joiTimNum - creTimNum > 60000 ? { creTimNum, joiTimNum, kinValStr : 'backlog' } : null; // What: Backlog Return. Why: A fresh joiner may want what came before, while a creator has nothing before them. How: This offers a backlog when the group began more than a minute before the join.


};

// #endregion hisProFun



// #region hisAskFun

/**
 * hisAskFun = History Ask Function
 *
 * @summary
 * Files this identity's history request in a group, pending and unclaimed,
 * expiring in 10 days: a recovery with no start, or a backlog from the start
 * given. The rules refuse a backlog starting before the group or after this
 * member joined, and a second open request.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param kinValStr - Kind Value String: 'recovery' or 'backlog'.
 * @param ranTimNum - Range Time Number: A backlog's start in milliseconds,
 *                    or null for a recovery.
 *
 * @returns A promise that settles once the request is filed, with no value.
 *
 * @example
 * ```ts
 * hisAskFun('Xk3...', 'recovery', null) // => Promise<void>
 * ```
 *
*/

const hisAskFun = async ( groIdeStr : string, kinValStr : HisKinTyp, ranTimNum : number | null ) : Promise< void > => { // What: History Ask Function. Why: A member with no history on this device asks the group for it (Section 11.9). How: This files their request.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: A request is filed under its asker. How: This reads the identity.


	await setDoc( hisRefFun( groIdeStr, uidValStr ), { // What: Request Set Call. Why: Members see the request and one may answer it. How: This writes every field the rules expect.


		claimedAt      : null,                                                          // What: Claimed At. Why: Nobody has claimed it yet. How: This leaves it empty.
		claimedByUid   : null,                                                          // What: Claimed By UID. Why: Nobody has claimed it yet. How: This leaves it empty.
		createdAt      : serverTimestamp(),                                             // What: Created At. Why: The rules require the server's time. How: This asks the server to fill it in.
		expireAt       : Timestamp.fromMillis( Date.now() + 10 * DAY_MIL_NUM ),         // What: Expire At. Why: An unanswered request quietly goes after 10 days. How: This sets it from the device's clock, which the rules accept within days.
		kind           : kinValStr,                                                     // What: Kind. Why: The kind decides the range. How: This names it.
		rangeStart     : ranTimNum === null ? null : Timestamp.fromMillis( ranTimNum ), // What: Range Start. Why: A backlog starts where the asker chose, and a recovery has no start of its own. How: This stores the start, or null.
		requestedByUid : uidValStr,                                                     // What: Requested By UID. Why: The rules check the asker. How: This names them.
		status         : 'pending'                                                      // What: Status. Why: A new request waits for a helper. How: This starts it pending.


	} );


};

// #endregion hisAskFun



// #region hisClaFun

/**
 * hisClaFun = History Claim Function
 *
 * @summary
 * Claims another member's pending history request as this identity, as a
 * compare-and-swap: the transaction takes the request only while it's
 * pending, so of two helpers at once, one wins and the other rejects with an
 * Error saying someone is already helping.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidReqStr - UID Requester String: The asker's UID.
 *
 * @returns A promise that settles once the claim is this identity's, with
 *          no value.
 *
 * @example
 * ```ts
 * hisClaFun('Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const hisClaFun = async ( groIdeStr : string, uidReqStr : string ) : Promise< void > => { // What: History Claim Function. Why: Only one helper uploads per request (Section 11.9). How: This takes the request only while it's pending.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The claim names this identity. How: This reads it.

	const hisRefObj = hisRefFun( groIdeStr, uidReqStr ); // What: History Reference Object. Why: The request is read and claimed. How: This names it.


	await runTransaction( firGetFun().fstDatObj, async ( traValObj ) => { // What: Claim Transaction. Why: The request has to still be pending when the claim lands. How: This reads it, then claims it, retrying on a conflict.


		const hisSnaObj = await traValObj.get( hisRefObj ); // What: History Snapshot Object. Why: Only a pending request can be claimed. How: This reads it.


		if ( hisSnaObj.get( 'status' ) !== 'pending' ) throw new Error( 'Someone is already helping with that.' ); // What: Pending Guard. Why: Another helper won, or the request is gone. How: This rejects with the message the app shows.



		traValObj.update( hisRefObj, { // What: Claim Update Call. Why: The request is this helper's now. How: This names them with the server's time.


			claimedAt    : serverTimestamp(), // What: Claimed At. Why: A claim stalls after 30 minutes, timed by the server. How: This asks the server to fill it in.
			claimedByUid : uidValStr,         // What: Claimed By UID. Why: The rules let only the claimant upload. How: This names this helper.
			status       : 'claimed'          // What: Status. Why: A claimed request can't be claimed again. How: This marks it claimed.


		} );


	} );


};

// #endregion hisClaFun



// #region hisRelFun

/**
 * hisRelFun = History Release Function
 *
 * @summary
 * Returns a claimed history request to pending, clearing its claim. The
 * claimant may do this at any time, and any other member once the claim is
 * 30 minutes old, which the rules check.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidReqStr - UID Requester String: The asker's UID.
 *
 * @returns A promise that settles once the claim is released, with no
 *          value.
 *
 * @example
 * ```ts
 * hisRelFun('Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const hisRelFun = ( groIdeStr : string, uidReqStr : string ) : Promise< void > => updateDoc( hisRefFun( groIdeStr, uidReqStr ), { claimedAt : null, claimedByUid : null, status : 'pending' } ); // What: History Release Function. Why: A helper may let a claim go, and any member may free one stalled for 30 minutes (Section 11.9). How: This returns the request to pending.

// #endregion hisRelFun



// #region mesValFun

/**
 * mesValFun = Message Valid Function
 *
 * @summary
 * Says whether an entry from a history bundle is a message record inside the
 * request's range. The bundle came from another member, so each field's type
 * is checked before the time is compared.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param entValAny - Entry Value Any: One entry of the bundle.
 * @param ranRecObj - Range Record Object: The request's range.
 *
 * @returns True when the entry is a message record in the range.
 *
 * @example
 * ```ts
 * mesValFun({ mesIdeStr : 'a', ... }, ranRecObj) // => true
 * ```
 *
*/

const mesValFun = ( entValAny : unknown, ranRecObj : RanRecTyp ) : entValAny is MesRecTyp => { // What: Message Valid Function. Why: Only well-formed messages in the range join the device's history. How: This checks the entry's fields, then its time.


	const entRecObj = ( entValAny !== null && typeof entValAny === 'object' ? entValAny : {} ) as Record< string, unknown >; // What: Entry Record Object. Why: The fields are read by key. How: This keeps an object, standing in an empty one for anything else. // What: Type Assertion Note. Why: A parsed object's keys are unknown. How: The as reads it as a record of unknowns.

	const ideStrBoo = typeof entRecObj.mesIdeStr === 'string'; // What: Identifier String Boolean. Why: A message is stored under its ID. How: This checks it's text.
	const senStrBoo = typeof entRecObj.senUidStr === 'string'; // What: Sender String Boolean. Why: A message names its sender. How: This checks it's text.
	const texStrBoo = typeof entRecObj.texValStr === 'string'; // What: Text String Boolean. Why: A message's text is shown as text. How: This checks it's text.
	const timNumBoo = typeof entRecObj.sntTimNum === 'number'; // What: Time Number Boolean. Why: A message is ordered by its time. How: This checks it's a number.

	const fieValBoo = ideStrBoo && senStrBoo && texStrBoo && timNumBoo; // What: Fields Valid Boolean. Why: Every field has to have its type. How: This combines them.


	const ranValBoo = fieValBoo && ( entRecObj.sntTimNum as number ) >= ranRecObj.begTimNum && ( entRecObj.sntTimNum as number ) < ranRecObj.endTimNum; // What: Range Valid Boolean. Why: Only the requested range is kept. How: This compares the time with the range, once the fields are known good, the first check guarding the rest, so the chain stays inline. // What: Type Assertion Note. Why: The field check proved the time is a number. How: The as reads it as one.



	return ranValBoo; // What: Valid Return. Why: The caller keeps or skips the entry. How: This returns the answer.


};

// #endregion mesValFun



// #region ranGetFun

/**
 * ranGetFun = Range Get Function
 *
 * @summary
 * Resolves with a request's range in milliseconds: a recovery runs from the
 * asker's join to any time after, and a backlog from its chosen start up to,
 * but not including, the asker's join. Rejects with an Error when the
 * request or the asker's membership is gone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidReqStr - UID Requester String: The asker's UID.
 *
 * @returns A promise that resolves with the range.
 *
 * @example
 * ```ts
 * ranGetFun('Xk3...', 'u9F...') // => { begTimNum, endTimNum }
 * ```
 *
*/

const ranGetFun = async ( groIdeStr : string, uidReqStr : string ) : Promise< RanRecTyp > => { // What: Range Get Function. Why: The coverage check, the send, and the merge all bound the history the same way. How: This reads the request and the asker's join.


	const hisSnaObj = await getDoc( hisRefFun( groIdeStr, uidReqStr ) );                                            // What: History Snapshot Object. Why: The kind and start are on the request. How: This reads it.
	const memSnaObj = await getDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidReqStr }` ) ); // What: Member Snapshot Object. Why: The range turns on the asker's join. How: This reads their membership.


	if ( !hisSnaObj.exists() || !memSnaObj.exists() ) throw new Error( 'The request is no longer open.' ); // What: Request Guard. Why: A withdrawn request or a departed asker has no range. How: This rejects.



	const joiTimNum = ( memSnaObj.get( 'joinedAt' ) as Timestamp ).toMillis(); // What: Join Time Number. Why: The asker's join splits recovery from backlog. How: This reads it in milliseconds. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.



	return hisSnaObj.get( 'kind' ) === 'recovery' // What: Range Return. Why: Each kind bounds the history its own way. How: This returns the range for the request's kind.
		? { begTimNum : joiTimNum, endTimNum : Infinity }                                                   // What: Recovery Range. Why: A recovery is the asker's own history. How: This runs from their join on.
		: { begTimNum : ( hisSnaObj.get( 'rangeStart' ) as Timestamp ).toMillis(), endTimNum : joiTimNum }; // What: Backlog Range. Why: A backlog is what came before the asker joined. How: This runs from the chosen start to their join. // What: Type Assertion Note. Why: The rules store a backlog's start as a timestamp. How: The as reads it as one.


};

// #endregion ranGetFun



// #region hisCovFun

/**
 * hisCovFun = History Coverage Function
 *
 * @summary
 * Resolves with whether this device's history covers another member's
 * request, so a helper is only offered requests they can fill: true when its
 * earliest stored message for the group is at or before the range's start,
 * or when this member joined at or before the start and the device holds
 * history, since a chat that began after the start has no message that
 * early.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidReqStr - UID Requester String: The asker's UID.
 *
 * @returns A promise that resolves with true when the range is covered.
 *
 * @example
 * ```ts
 * hisCovFun('Xk3...', 'u9F...') // => true
 * ```
 *
*/

const hisCovFun = async ( groIdeStr : string, uidReqStr : string ) : Promise< boolean > => { // What: History Coverage Function. Why: The claim race only runs among helpers who can fill the request (Section 11.9). How: This compares the device's earliest message with the range's start.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: This helper's own join counts toward coverage. How: This reads the identity.

	const ranRecObj = await ranGetFun( groIdeStr, uidReqStr );                                                      // What: Range Record Object. Why: Coverage is judged against the range's start. How: This reads the range.
	const mesRecArr = await mesLisFun( groIdeStr );                                                                 // What: Message Record Array. Why: Coverage is what the device holds. How: This reads the history, oldest first.
	const memSnaObj = await getDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) ); // What: Member Snapshot Object. Why: A helper who was there from the start had every message since. How: This reads this helper's membership.

	const earCovBoo = mesRecArr.length > 0 && mesRecArr[ 0 ].sntTimNum <= ranRecObj.begTimNum;                                // What: Earliest Covers Boolean. Why: A history reaching back to the start covers it. How: This compares the earliest message with the start, the first check guarding the second.
	const joiCovBoo = mesRecArr.length > 0 && ( memSnaObj.get( 'joinedAt' ) as Timestamp ).toMillis() <= ranRecObj.begTimNum; // What: Join Covers Boolean. Why: A chat that began after the start has no message that early, so a helper there from the start with history covers it. How: This compares this helper's join with the start, on a device holding history. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.



	return earCovBoo || joiCovBoo; // What: Coverage Return. Why: Either way, the device can fill the request. How: This returns whether one holds.


};

// #endregion hisCovFun



const traRefFun = ( groIdeStr : string, uidReqStr : string ) => ref( firGetFun().stoValObj, `groupHistoryTransfers/${ groIdeStr }/${ uidReqStr }` );  // What: Transfer Reference Function. Why: Each bundle is keyed like its request. How: This names one.



// #region hisGetFun

/**
 * hisGetFun = History Get Function
 *
 * @summary
 * Collects this identity's answered history request: downloads the bundle,
 * decrypts it, keeps the well-formed messages that fall in the range, marks
 * the request fulfilled, and deletes the bundle and the request. Resolves
 * with how many messages it kept, or null while no bundle has arrived yet.
 * The bundle is untrusted, so an entry that isn't a message record, or lies
 * outside the range, is skipped.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the count kept, or null.
 *
 * @example
 * ```ts
 * hisGetFun('Xk3...') // => 12
 * ```
 *
*/

const hisGetFun = async ( groIdeStr : string ) : Promise< number | null > => { // What: History Get Function. Why: The asker merges the history a helper sent (Section 11.9). How: This downloads, checks, and keeps it, then clears the request.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The bundle is under the asker's UID. How: This reads the identity.

	const traRefObj = traRefFun( groIdeStr, uidValStr ); // What: Transfer Reference Object. Why: The bundle is collected and then deleted. How: This names it.
	const bunBytBuf = await getBytes( traRefObj ).catch( ( errCatObj : { code? : string } ) => { // What: Bundle Bytes Buffer. Why: The helper may not have uploaded yet. How: This downloads the bundle, null when there's none.


		if ( errCatObj.code === 'storage/object-not-found' ) return null; // What: Missing Guard. Why: No bundle yet isn't a failure. How: This resolves null.



		throw errCatObj; // What: Error Rethrow. Why: Any other failure has to reach the caller. How: This passes it on.


	} );


	if ( bunBytBuf === null ) return null; // What: Not Ready Guard. Why: No bundle has arrived. How: This resolves null.



	const ranRecObj = await ranGetFun( groIdeStr, uidValStr );                                                          // What: Range Record Object. Why: Only the requested range is kept. How: This reads it.
	const bunBytArr = new Uint8Array( bunBytBuf );                                                                      // What: Bundle Bytes Array. Why: The IV leads the ciphertext. How: This views the bytes.
	const bunTexStr = await decTexFun( await keyLoaFun( groIdeStr ), bunBytArr.slice( 12 ), bunBytArr.slice( 0, 12 ) ); // What: Bundle Text String. Why: The bundle is encrypted under the group key. How: This decrypts it.
	const entValArr = JSON.parse( bunTexStr ) as unknown;                                                               // What: Entry Value Array. Why: The bundle is a JSON list of messages. How: This parses it, as untrusted data.


	const mesRecArr = ( Array.isArray( entValArr ) ? entValArr : [] ).filter( ( entValAny ) => mesValFun( entValAny, ranRecObj ) ); // What: Message Record Array. Why: A helper's bundle is untrusted, and only the requested range is kept. How: This keeps the entries that are message records inside the range.



	for ( const mesRecObj of mesRecArr ) await mesPutFun( { ...mesRecObj, groIdeStr } ); // What: Store Loop. Why: The history joins the device's own. How: This stores each message under this group.



	await updateDoc( hisRefFun( groIdeStr, uidValStr ), { status : 'fulfilled' } ); // What: Fulfilled Call. Why: The helper learns the history arrived. How: This marks the request fulfilled.

	await deleteObject( traRefObj ); // What: Bundle Delete Call. Why: Nothing is kept on the server once delivered. How: This deletes the bundle.

	await deleteDoc( hisRefFun( groIdeStr, uidValStr ) ); // What: Request Delete Call. Why: A finished request goes. How: This deletes it.



	return mesRecArr.length; // What: Count Return. Why: The app tells the asker what arrived. How: This returns how many messages were kept.


};

// #endregion hisGetFun



// #region hisSenFun

/**
 * hisSenFun = History Send Function
 *
 * @summary
 * Sends the history a claimed request asks for, as its claimant: the
 * device's stored messages inside the request's range, as one JSON bundle
 * encrypted under the group key, its 12-byte IV first, uploaded as generic
 * binary. Resolves with how many messages it sent. The rules refuse an
 * upload by anyone but the claimant.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidReqStr - UID Requester String: The asker's UID.
 *
 * @returns A promise that resolves with the number of messages sent.
 *
 * @example
 * ```ts
 * hisSenFun('Xk3...', 'u9F...') // => 12
 * ```
 *
*/

const hisSenFun = async ( groIdeStr : string, uidReqStr : string ) : Promise< number > => { // What: History Send Function. Why: A helper shares a copy of what their device holds (Section 11.9). How: This encrypts the range as one bundle and uploads it.


	const ranRecObj = await ranGetFun( groIdeStr, uidReqStr ); // What: Range Record Object. Why: Only the requested range is sent. How: This reads it.

	const mesRecArr = ( await mesLisFun( groIdeStr ) ).filter( ( mesRecObj ) => mesRecObj.sntTimNum >= ranRecObj.begTimNum && mesRecObj.sntTimNum < ranRecObj.endTimNum ); // What: Message Record Array. Why: The asker gets the range they asked for. How: This keeps the device's messages inside it, two halves of one check, so they stay inline.
	const bunEncObj = await encTexFun( await keyLoaFun( groIdeStr ), JSON.stringify( mesRecArr ) );                                                                        // What: Bundle Encrypted Object. Why: Storage sees only ciphertext, and only the bundle's size. How: This encrypts the messages as one JSON bundle under the group key.


	await uploadBytes( traRefFun( groIdeStr, uidReqStr ), new Uint8Array( [ ...bunEncObj.iniVecArr, ...bunEncObj.cipTexArr ] ), { contentType : 'application/octet-stream' } ); // What: Upload Call. Why: The asker collects the bundle. How: This uploads the IV and ciphertext as generic binary.



	return mesRecArr.length; // What: Count Return. Why: The helper sees how much they shared. How: This returns how many messages were sent.


};

// #endregion hisSenFun



// #region hisWitFun

/**
 * hisWitFun = History Withdraw Function
 *
 * @summary
 * Withdraws this identity's history request, deleting any bundle already
 * sent for it, then the request.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that settles once the request is gone, with no value.
 *
 * @example
 * ```ts
 * hisWitFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const hisWitFun = async ( groIdeStr : string ) : Promise< void > => { // What: History Withdraw Function. Why: The asker may stop asking. How: This deletes any bundle, then the request.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The request is the asker's own. How: This reads the identity.


	await deleteObject( traRefFun( groIdeStr, uidValStr ) ).catch( () => undefined ); // What: Bundle Delete Call. Why: A sent bundle shouldn't outlive its request. How: This deletes it, skipping a bundle that was never sent.

	await deleteDoc( hisRefFun( groIdeStr, uidValStr ) ); // What: Request Delete Call. Why: The asker stops asking. How: This deletes the request.


};

// #endregion hisWitFun

// #endregion Helpers



// #region Exports

export { hisAskFun, hisClaFun, hisCovFun, hisGetFun, type HisKinTyp, hisLisFun, hisProFun, type HisProTyp, type HisRecTyp, hisRelFun, hisSenFun, hisWatFun, hisWitFun }; // What: Named Exports. Why: The history prompts and the helper's screen drive a request through these. How: This exports the functions and the request types.

// #endregion Exports


