


// #region Imports

import { collection   } from 'firebase/firestore';         // What: Collection. Why: Key requests stand on a group's memberships. How: This names the members collection.
import { firGetFun    } from '../platform/firebase.ts';    // What: Firebase Get Function. Why: The memberships live in Firestore. How: This returns the services.
import { hisCovFun    } from './history.ts';               // What: History Coverage Function. Why: A history request waits on a member only when their device holds its range. How: This checks the device's history.
import { hisWatFun    } from './history.ts';               // What: History Watch Function. Why: A history request can arrive at any time. How: This watches a group's requests.
import { keyGetFun    } from '../platform/key-store.ts';   // What: Key Get Function. Why: A key request waits on a member only when their device holds the group's key to share. How: This reads the key without recovering it.
import { OFF_LIF_NUM  } from './ownership.ts';             // What: Offer Life Number. Why: A lapsed offer no longer waits on anyone. How: This is an offer's life.
import { onSnapshot   } from 'firebase/firestore';         // What: On Snapshot. Why: A key request can arrive at any time. How: This listens to the memberships.
import { reqWatFun    } from './joins.ts';                 // What: Request Watch Function. Why: A join request can arrive at any time. How: This watches a group's requests.


import type { GroRecTyp } from './groups.ts';        // What: Group Record Type. Why: An offer stands on a group's record. How: This types the groups.
import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: A key request's time is read back. How: This types it.

// #endregion Imports



/**
 * waiting.ts = Waiting Items
 *
 * @summary
 * Watches what's waiting on this member across their groups (ARCHITECTURE.md
 * Section 11.1): someone asking to join, a member waiting on a new device
 * for the group's key, this member's own new device included, a member
 * asking for chat history this device holds, and an offer of a group to this
 * member. Each item names its group, its kind, the person it's about, and
 * when it began, with a key that tells it apart from an earlier item of the
 * same kind, so the notices sheet shows each one once and the frame marks
 * the sections that hold them. An item leaves as soon as it's answered, by
 * this member or another.
 *
 * Sections:
 *  - Types
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type WaiKinTyp = 'history' | 'join' | 'key' | 'offer'; // What: Waiting Kind Type. Why: Each kind of item opens its own part of a group. How: This names the four kinds.

type WaiRecTyp = { groIdeStr : string, kinValStr : WaiKinTyp, namTexStr : string, seeKeyStr : string, timNum : number, uidValStr : string }; // What: Waiting Record Type. Why: The sheet words an item and opens its part, and the frame counts them. How: This types one item, its name empty where the person's name is read from the members.

// #endregion Types



// #region Helpers

const seeKeyFun = ( groIdeStr : string, kinValStr : WaiKinTyp, uidValStr : string, timNum : number ) : string => `${ groIdeStr }/${ kinValStr }:${ uidValStr }@${ timNum }`; // What: Seen Key Function. Why: A later request from the same person is a new item, and mustn't count as already shown. How: This joins the group, kind, person, and start time.



// #region offLisFun

/**
 * offLisFun = Offer List Function
 *
 * @summary
 * Returns an item for each group whose live offer names this member, dated
 * when the offer was made. An offer past its 7 days, or one in a group the
 * member already owns, isn't waiting on them.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groRecArr - Group Record Array: The member's groups.
 * @param uidValStr - UID Value String: This member's UID.
 * @param nowTimNum - Now Time Number: The time to judge a lapse against, in
 *                    milliseconds.
 *
 * @returns The offers waiting on the member.
 *
 * @example
 * ```ts
 * offLisFun(groRecArr, 'u1', Date.now()) // => [{ kinValStr : 'offer', ... }]
 * ```
 *
*/

const offLisFun = ( groRecArr : GroRecTyp[], uidValStr : string, nowTimNum : number ) : WaiRecTyp[] => groRecArr.filter( ( groRecObj ) => !groRecObj.ownBoo && groRecObj.offUidStr === uidValStr && groRecObj.offTimNum + OFF_LIF_NUM > nowTimNum ).map( ( groRecObj ) => ( { groIdeStr : groRecObj.ideStr, kinValStr : 'offer', namTexStr : '', seeKeyStr : seeKeyFun( groRecObj.ideStr, 'offer', groRecObj.ownUidStr, groRecObj.offTimNum ), timNum : groRecObj.offTimNum, uidValStr : groRecObj.ownUidStr } ) ); // What: Offer List Function. Why: An offer waits on the member it names until it's answered or lapses. How: This keeps the live offers to this member and makes each an item naming the owner.

// #endregion offLisFun



// #region waiWatFun

/**
 * waiWatFun = Waiting Watch Function
 *
 * @summary
 * Watches each group's join requests, key requests, and history requests,
 * and reports every item waiting on this member across the groups whenever
 * any of them changes, until the returned function stops every watch. A key
 * request counts only while this device holds the group's key, the member's
 * own from a new device included, while any other request this member made
 * isn't waiting on them, and a history request counts only while it's
 * unclaimed and this device holds its range. A watch that fails is
 * logged and reports nothing for its part.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeArr - Group Identifier Array: The member's groups' IDs.
 * @param uidValStr - UID Value String: This member's UID.
 * @param onWaiFun  - On Waiting Function: Called with the waiting items.
 *
 * @returns A function that stops every watch.
 *
 * @example
 * ```ts
 * waiWatFun(['Xk3...'], 'u1', setWaiRecArr) // => () => void
 * ```
 *
*/

const waiWatFun = ( groIdeArr : string[], uidValStr : string, onWaiFun : ( waiRecArr : WaiRecTyp[] ) => void ) : () => void => { // What: Waiting Watch Function. Why: The sheet and the frame follow what's waiting as it comes and goes. How: This watches three kinds of request in each group and reports them together.


	const parMapObj = new Map< string, WaiRecTyp[] >(); // What: Part Map Object. Why: Each watch reports its own part, which the report joins. How: This holds each part's items by the group and kind.
	const stoFunArr : ( () => void )[] = [];            // What: Stop Function Array. Why: Every watch stops together. How: This collects their stops.

	let actValBoo = true; // What: Active Value Boolean. Why: A report finishing after the stop mustn't land. How: This is true until the stop runs.



	const parSetFun = ( parKeyStr : string, waiRecArr : WaiRecTyp[] ) : void => { // What: Part Set Function. Why: A part's new items replace its old ones in one report of everything. How: This keeps the part and reports every part, while the watch is active.


		if ( !actValBoo ) return; // What: Stopped Guard. Why: A late part belongs to a stopped watch. How: This returns.



		parMapObj.set( parKeyStr, waiRecArr ); // What: Part Keep Call. Why: The part's latest items are what's waiting. How: This replaces them.


		onWaiFun( [ ...parMapObj.values() ].flat() ); // What: Report Call. Why: The caller sees every item at once. How: This reports the parts joined.


	};



	for ( const groIdeStr of groIdeArr ) { // What: Group Loop. Why: Each group has its own requests. How: This starts three watches per group.


		let hisSeqNum = 0; // What: History Sequence Number. Why: A coverage check finishing after a newer report mustn't replace it. How: This counts the history reports.
		let keySeqNum = 0; // What: Key Sequence Number. Why: A key check finishing after a newer report mustn't replace it. How: This counts the member reports.


		stoFunArr.push( reqWatFun( groIdeStr, ( reqRecArr ) => parSetFun( `${ groIdeStr }/join`, reqRecArr.filter( ( reqRecObj ) => reqRecObj.uidValStr !== uidValStr ).map( ( reqRecObj ) => ( { groIdeStr, kinValStr : 'join', namTexStr : reqRecObj.namTexStr, seeKeyStr : seeKeyFun( groIdeStr, 'join', reqRecObj.uidValStr, reqRecObj.reqTimNum ), timNum : reqRecObj.reqTimNum, uidValStr : reqRecObj.uidValStr } ) ) ), ( errCatObj ) => console.warn( errCatObj ) ) ); // What: Join Watch Call. Why: Someone asking to join waits on every member. How: This watches the group's requests, leaving out one of the member's own, and keeps each as an item named as the joiner asked.

		stoFunArr.push( onSnapshot( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/members` ), ( memSnaObj ) => { // What: Key Watch Call. Why: A member on a new device waits on any device holding the group's key, their own old one included. How: This watches the memberships and keeps each standing request, once the device's key is checked.


			const curSeqNum = ++keySeqNum;                                                                                                                         // What: Current Sequence Number. Why: Only the latest report's check may land. How: This numbers this one.
			const reqDocArr = memSnaObj.docs.filter( ( memDocObj ) => memDocObj.get( 'keyRequestedAt', { serverTimestamps : 'estimate' } ) !== undefined ); // What: Request Document Array. Why: Any standing request waits on a device holding the key, the member's own from their new device included. How: This keeps those memberships, estimating a time the server hasn't confirmed.



			void keyGetFun( `group:${ groIdeStr }` ).then( ( keyValAny ) => { // What: Key Check Call. Why: A device without the key has nothing to share. How: This reads the key and keeps the requests only when it's there.


				if ( curSeqNum !== keySeqNum ) return; // What: Stale Guard. Why: A newer report has its own check. How: This returns.



				parSetFun( `${ groIdeStr }/key`, keyValAny === undefined ? [] : reqDocArr.map( ( reqDocObj ) => { // What: Key Part Call. Why: The device's requests to answer are the group's key part. How: This makes each request an item, or none without the key.


					const reqTimNum = ( reqDocObj.get( 'keyRequestedAt', { serverTimestamps : 'estimate' } ) as Timestamp ).toMillis(); // What: Request Time Number. Why: A later request after a shared key is a new item. How: This reads its time in milliseconds. // What: Type Assertion Note. Why: The rules store the request's time as a timestamp. How: The as reads it as one.



					return { groIdeStr, kinValStr : 'key', namTexStr : '', seeKeyStr : seeKeyFun( groIdeStr, 'key', reqDocObj.id, reqTimNum ), timNum : reqTimNum, uidValStr : reqDocObj.id }; // What: Item Return. Why: Each request is one item, named from the members. How: This returns its fields.


				} ) );


			}, ( errCatObj : unknown ) => console.warn( errCatObj ) );


		}, ( errCatObj ) => console.warn( errCatObj ) ) );

		stoFunArr.push( hisWatFun( groIdeStr, ( hisRecArr ) => { // What: History Watch Call. Why: A member asking for chat history waits on the members who hold it. How: This watches the group's requests and keeps each unclaimed one from another member this device can fill.


			const curSeqNum = ++hisSeqNum;                                                                                                // What: Current Sequence Number. Why: Only the latest report's checks may land. How: This numbers this one.
			const penRecArr = hisRecArr.filter( ( hisRecObj ) => hisRecObj.staValStr === 'pending' && hisRecObj.uidReqStr !== uidValStr ); // What: Pending Record Array. Why: A claimed request has its helper, and the member's own waits on others. How: This keeps the unclaimed ones from other members.



			void Promise.all( penRecArr.map( ( hisRecObj ) => hisCovFun( groIdeStr, hisRecObj.uidReqStr ) ) ).then( ( covValArr ) => { // What: Coverage Check Call. Why: A request the device can't fill isn't waiting on this member. How: This checks each and keeps the ones it covers.


				if ( curSeqNum !== hisSeqNum ) return; // What: Stale Guard. Why: A newer report has its own checks. How: This returns.



				parSetFun( `${ groIdeStr }/history`, penRecArr.flatMap( ( hisRecObj, hisIndNum ) : WaiRecTyp[] => covValArr[ hisIndNum ] ? [ { groIdeStr, kinValStr : 'history', namTexStr : '', seeKeyStr : seeKeyFun( groIdeStr, 'history', hisRecObj.uidReqStr, hisRecObj.ranTimNum ?? 0 ), timNum : hisRecObj.ranTimNum ?? 0, uidValStr : hisRecObj.uidReqStr } ] : [] ) ); // What: History Part Call. Why: The requests this device can fill are the group's history part. How: This makes each one it covers an item, keyed by its range's start, named from the members.


			}, ( errCatObj : unknown ) => console.warn( errCatObj ) );


		}, ( errCatObj ) => console.warn( errCatObj ) ) );


	}



	return () => { // What: Stop Return. Why: The watches shouldn't outlive the groups they follow. How: This marks the watch stopped and stops each one.


		actValBoo = false; // What: Inactive Set. Why: Late parts mustn't report. How: This marks the watch stopped.

		stoFunArr.forEach( ( stoValFun ) => stoValFun() ); // What: Stop Loop Call. Why: Every listener closes. How: This stops each watch.


	};


};

// #endregion waiWatFun

// #endregion Helpers



// #region Exports

export { offLisFun, type WaiKinTyp, type WaiRecTyp, waiWatFun }; // What: Named Exports. Why: The screen host watches what's waiting and adds the offers, and the sheet and the frame read the items. How: This exports the watch, the offer list, and the item types.

// #endregion Exports


