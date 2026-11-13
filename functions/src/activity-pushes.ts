


// #region Imports

import { FieldPath         } from 'firebase-admin/firestore';        // What: Field Path. Why: A group's ID becomes a key in the token's map of chat push times. How: This names that key without reading it as a dotted path.
import { FIR_DAT_OBJ       } from './setup.ts';                      // What: Firestore Database Object. Why: Members, names, and requests live in Firestore. How: This reads them past the rules.
import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: Each trigger spreads them into its own.
import { onDocumentCreated } from 'firebase-functions/v2/firestore'; // What: On Document Created. Why: A new join request is a created document. How: This registers a create trigger.
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'; // What: On Document Updated. Why: A key request is stamped on an existing membership. How: This registers an update trigger.
import { onValueCreated    } from 'firebase-functions/v2/database';  // What: On Value Created. Why: A chat message is created in the Realtime Database. How: This registers a create trigger there.
import { pusSenFun         } from './push.ts';                       // What: Push Send Function. Why: Each activity reaches phones as a push. How: This sends one.
import { REA_DAT_OBJ       } from './setup.ts';                      // What: Realtime Database Object. Why: Presence lives in the Realtime Database. How: This reads it past the rules.

// #endregion Imports



/**
 * activity-pushes.ts = Activity Pushes
 *
 * @summary
 * Pushes for what happens in a group while members are away (ARCHITECTURE.md
 * Sections 6, 11.1, 11.7, and 17). None leaves a notice, since the app
 * shows each activity itself, and like every push each carries only the
 * group's name and a fixed sentence, never what anyone wrote. A new join
 * request pushes every member with how many requests are
 * waiting, tagged so it replaces the group's earlier join push on the phone. A
 * new chat message pushes each member still waiting on it who doesn't have the
 * group open by presence, tagged so a busy chat shows as one notification,
 * and at most once every 2 minutes for each member and group, so a burst of
 * messages never reads to a phone as spam. A
 * member asking for the group's key on a new phone pushes every other member.
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

const THR_MIL_NUM = 2 * 60 * 1000; // What: Throttle Milliseconds Number. Why: A burst of chat messages should buzz a phone once, since Android can block an app that notifies too often. How: This is the 2 minutes a member's chat push in one group waits after the last.

// #endregion Constants



// #region Helpers

const memUidFun = async ( groIdeStr : string ) : Promise< string[] > => ( await FIR_DAT_OBJ.collection( `groups/${ groIdeStr }/members` ).get() ).docs.map( ( memDocObj ) => memDocObj.id ); // What: Member UID Function. Why: Activity pushes go to the group's members. How: This reads their UIDs.



const namGetFun = async ( groIdeStr : string ) : Promise< string | null > => ( await FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` ).get() ).get( 'name' ) ?? null; // What: Name Get Function. Why: A push's title is the group's name, and a deleted group sends nothing. How: This reads the name, null when the group is gone.



// #region thrPasFun

/**
 * thrPasFun = Throttle Pass Function
 *
 * @summary
 * Decides whether a chat push in a group may go to a member now, and records
 * it when it may. The time of the member's last chat push in each group is
 * kept in a map on their push token's document, which a fresh token
 * replaces. A push within THR_MIL_NUM of the last one in the same group is
 * held back, since the notification already showing stands for the burst,
 * and a member with no token is too, since there's nothing to push. Runs as
 * a transaction, so two messages arriving together pass once.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: The member to push.
 * @param groIdeStr - Group Identifier String: The group whose chat moved.
 *
 * @returns A promise that resolves with true when the push may go.
 *
 * @example
 * ```ts
 * thrPasFun('bob', 'gro1') // => true
 * ```
 *
*/

const thrPasFun = ( uidValStr : string, groIdeStr : string ) : Promise< boolean > => FIR_DAT_OBJ.runTransaction( async ( traValObj ) => { // What: Throttle Pass Function. Why: Each member hears of a busy chat once in a while rather than for every message. How: This reads and stamps the member's last chat push for the group in one transaction.


	const tokRefObj = FIR_DAT_OBJ.doc( `accounts/${ uidValStr }/pushToken/current` ); // What: Token Reference Object. Why: The last push times sit beside the token they went to. How: This names the document.

	const tokSnaObj = await traValObj.get( tokRefObj ); // What: Token Snapshot Object. Why: The last push time decides. How: This reads the document in the transaction.


	if ( !tokSnaObj.exists ) return false; // What: No Token Guard. Why: A member without notifications on gets no push anyway. How: This holds it back.



	const lasTimAny : unknown = tokSnaObj.get( new FieldPath( 'chatPushedAt', groIdeStr ) ); // What: Last Time Any. Why: A push within the window is held back. How: This reads the last chat push's time for the group, undefined when there's none.


	if ( typeof lasTimAny === 'number' && Date.now() - lasTimAny < THR_MIL_NUM ) return false; // What: Recent Guard. Why: The notification already showing stands for the burst. How: This holds the push back.



	traValObj.update( tokRefObj, new FieldPath( 'chatPushedAt', groIdeStr ), Date.now() ); // What: Stamp Call. Why: The next push in the group waits from now. How: This records the time.



	return true; // What: Pass Return. Why: The push may go. How: This resolves true.


} );

// #endregion thrPasFun



// #region chaPusFun

/**
 * chaPusFun = Chat Push Function
 *
 * @summary
 * Runs when a chat message is created and pushes each member on its
 * waiting-on list who has no presence entry in the group, meaning the group
 * isn't open on their phone, tagged by the chat so later pushes replace it,
 * and at most once every 2 minutes for each of them, which thrPasFun
 * decides. A message marked quiet, nobody waits on, or in a group that's
 * gone, pushes nobody.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The created message, with the
 *                    conversation's ID in its params.
 *
 * @returns A promise that settles once the pushes are sent, with no value.
 *
 * @example
 * ```ts
 * chaPusFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const chaPusFun = onValueCreated( { ...FUN_OPT_OBJ, ref : '/chats/{conIdeStr}/messages/{mesIdeStr}' }, async ( eveValObj ) : Promise< void > => { // What: Chat Push Function. Why: Members away from the app learn the chat moved on (Section 11.7). How: This pushes the waiting members who don't have the group open.


	if ( eveValObj.data.val()?.quiet === true ) return; // What: Quiet Guard. Why: A bring-list line is news for the chat alone, not a push (Section 11.5). How: This ends the run for a message marked quiet.



	const conIdeStr = eveValObj.params.conIdeStr;                                                         // What: Conversation Identifier String. Why: A group's chat uses the group's ID. How: This reads it from the path.
	const waiUidArr = Object.keys( ( eveValObj.data.val()?.waitingOn ?? {} ) as Record< string, true > ); // What: Waiting UID Array. Why: Only members still waiting on the message need telling. How: This lists them. // What: Type Assertion Note. Why: The rules allow a map of UIDs to true. How: The as reads it as such.


	if ( waiUidArr.length === 0 ) return; // What: Nobody Waiting Guard. Why: A message nobody waits on tells nobody. How: This ends the run.



	const groNamStr = await namGetFun( conIdeStr ); // What: Group Name String. Why: The push's title is the group's name. How: This reads it.


	if ( groNamStr === null ) return; // What: Gone Group Guard. Why: A deleted group sends nothing. How: This ends the run.



	const preUidObj = ( await REA_DAT_OBJ.ref( `presence/${ conIdeStr }` ).get() ).val() ?? {}; // What: Presence UID Object. Why: A member with the group open sees the message already. How: This reads who's online.

	const awaUidArr = waiUidArr.filter( ( waiUidStr ) => !( waiUidStr in preUidObj ) ); // What: Away UID Array. Why: Only members away from the group are pushed. How: This drops those online.



	await Promise.all( awaUidArr.map( async ( awaUidStr ) => { if ( await thrPasFun( awaUidStr, conIdeStr ) ) await pusSenFun( awaUidStr, 'chatMessage', groNamStr, { groIdeStr : conIdeStr, tagStr : `chat-${ conIdeStr }` } ); } ) ); // What: Push Send Calls. Why: Each member away from the group learns the chat moved, at most once every 2 minutes. How: This checks each member's throttle, then pushes those it passes, tagged by the chat so a push replaces the last.


} );

// #endregion chaPusFun



// #region joiPusFun

/**
 * joiPusFun = Join Push Function
 *
 * @summary
 * Runs when a join request is created and pushes every member with how many
 * unexpired requests are waiting, tagged by the group so each push replaces
 * the last on the phone, which shows one notification however many arrive.
 * A request created already expired pushes nobody, and any other counts at
 * least itself.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The created request, with the
 *                    group's ID in its params.
 *
 * @returns A promise that settles once the pushes are sent, with no value.
 *
 * @example
 * ```ts
 * joiPusFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const joiPusFun = onDocumentCreated( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/joinRequests/{uidReqStr}' }, async ( eveValObj ) : Promise< void > => { // What: Join Push Function. Why: Any member may approve, so members learn someone is waiting, without a flood of notifications (Section 17). How: This pushes every member a replacing count.


	if ( ( ( eveValObj.data?.get( 'expireAt' ) as { toMillis : () => number } | undefined )?.toMillis() ?? 0 ) <= Date.now() ) return; // What: Expired Request Guard. Why: A request created already expired leaves nothing to approve, whatever else is waiting. How: This ends the run for it. // What: Type Assertion Note. Why: The rules store the expiry as a timestamp. How: The as reads its conversion, or missing.



	const groIdeStr = eveValObj.params.groIdeStr; // What: Group Identifier String. Why: The pushes and the count are the group's. How: This reads it from the path.

	const groNamStr = ( await namGetFun( groIdeStr ) ) ?? ''; // What: Group Name String. Why: The push's title is the group's name. How: This reads it, empty only for a group whose members are already gone, so nobody is pushed.

	const reqCouNum = ( await FIR_DAT_OBJ.collection( `groups/${ groIdeStr }/joinRequests` ).get() ).docs.filter( ( reqDocObj ) => reqDocObj.get( 'expireAt' ).toMillis() > Date.now() ).length; // What: Request Count Number. Why: The push says how many are waiting. How: This counts the unexpired requests.
	const bodTexStr = reqCouNum === 1 ? 'Someone wants to join.' : `${ reqCouNum } people want to join.`;                                                                                        // What: Body Text String. Why: The push says how many are waiting. How: This words one request or a count.


	await Promise.all( ( await memUidFun( groIdeStr ) ).map( ( memUidStr ) => pusSenFun( memUidStr, 'joinRequest', groNamStr, { bodStr : bodTexStr, groIdeStr, tagStr : `join-${ groIdeStr }` } ) ) ); // What: Push Send Calls. Why: Every member can approve, and the phone shows one count however many requests arrive. How: This pushes each member the count, tagged by the group.


} );

// #endregion joiPusFun



// #region keyPusFun

/**
 * keyPusFun = Key Push Function
 *
 * @summary
 * Runs on every update to a membership and, when the update files a key
 * request, which the rules allow only as the request's own write, pushes
 * every other member. Any other update pushes nobody.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The membership before and after
 *                    the update, with the group's ID and the member's UID in
 *                    its params.
 *
 * @returns A promise that settles once the pushes are sent, with no value.
 *
 * @example
 * ```ts
 * keyPusFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const keyPusFun = onDocumentUpdated( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/members/{uidMemStr}' }, async ( eveValObj ) : Promise< void > => { // What: Key Push Function. Why: A member on a new phone can't read the group until someone online shares its key (Section 6). How: This pushes every other member when a request is filed.


	const reqNewBoo = eveValObj.data?.before.get( 'keyRequestedAt' ) === undefined && eveValObj.data?.after.get( 'keyRequestedAt' ) !== undefined; // What: Request New Boolean. Why: Only a request just filed asks for help, not a name change or an answer. How: This compares the field before and after, both plain reads, so the chain stays inline.


	if ( !reqNewBoo ) return; // What: Not New Guard. Why: Any other update tells nobody. How: This ends the run.



	const groNamStr = ( await namGetFun( eveValObj.params.groIdeStr ) ) ?? '';                                                               // What: Group Name String. Why: The push's title is the group's name. How: This reads it, empty only for a group whose members are already gone, so nobody is pushed.
	const othUidArr = ( await memUidFun( eveValObj.params.groIdeStr ) ).filter( ( memUidStr ) => memUidStr !== eveValObj.params.uidMemStr ); // What: Other UID Array. Why: The member asking has no key to share. How: This lists every other member.



	await Promise.all( othUidArr.map( ( othUidStr ) => pusSenFun( othUidStr, 'keyRequest', groNamStr, { groIdeStr : eveValObj.params.groIdeStr } ) ) ); // What: Push Send Calls. Why: Any member online can share the key. How: This pushes each.


} );

// #endregion keyPusFun

// #endregion Helpers



// #region Exports

export { chaPusFun, joiPusFun, keyPusFun }; // What: Named Exports. Why: The entry file exports every function Firebase deploys. How: This exports the four triggers.

// #endregion Exports


