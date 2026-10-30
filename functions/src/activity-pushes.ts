


// #region Imports

import { FIR_DAT_OBJ       } from './setup.ts';                      // What: Firestore Database Object. Why: Members, names, and requests live in Firestore. How: This reads them past the rules.
import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: Each trigger spreads them into its own.
import { onDocumentCreated } from 'firebase-functions/v2/firestore'; // What: On Document Created. Why: A new join request is a created document. How: This registers a create trigger.
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'; // What: On Document Updated. Why: A key request is stamped on an existing membership. How: This registers an update trigger.
import { onDocumentWritten } from 'firebase-functions/v2/firestore'; // What: On Document Written. Why: A history request becomes pending when filed or released. How: This registers a write trigger.
import { onValueCreated    } from 'firebase-functions/v2/database';  // What: On Value Created. Why: A chat message is created in the Realtime Database. How: This registers a create trigger there.
import { pusSenFun         } from './push.ts';                       // What: Push Send Function. Why: Each activity reaches phones as a push. How: This sends one.
import { REA_DAT_OBJ       } from './setup.ts';                      // What: Realtime Database Object. Why: Presence lives in the Realtime Database. How: This reads it past the rules.

// #endregion Imports



/**
 * activity-pushes.ts = Activity Pushes
 *
 * @summary
 * Pushes for what happens in a group while members are away (ARCHITECTURE.md
 * Sections 6, 11.1, 11.7, 11.9, and 17). None leaves a notice, since the app
 * shows each activity itself, and like every push each carries only the
 * group's name and a fixed sentence, never what anyone wrote. A history
 * request that becomes pending, whether filed or released, pushes every other
 * member. A new join request pushes every member with how many requests are
 * waiting, tagged so it replaces the group's earlier join push on the phone. A
 * new chat message pushes each member still waiting on it who doesn't have the
 * group open by presence, tagged so a busy chat shows as one notification. A
 * member asking for the group's key on a new phone pushes every other member.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

const memUidFun = async ( groIdeStr : string ) : Promise< string[] > => ( await FIR_DAT_OBJ.collection( `groups/${ groIdeStr }/members` ).get() ).docs.map( ( memDocObj ) => memDocObj.id ); // What: Member UID Function. Why: Activity pushes go to the group's members. How: This reads their UIDs.



const namGetFun = async ( groIdeStr : string ) : Promise< string | null > => ( await FIR_DAT_OBJ.doc( `groups/${ groIdeStr }` ).get() ).get( 'name' ) ?? null; // What: Name Get Function. Why: A push's title is the group's name, and a deleted group sends nothing. How: This reads the name, null when the group is gone.



// #region chaPusFun

/**
 * chaPusFun = Chat Push Function
 *
 * @summary
 * Runs when a chat message is created and pushes each member on its
 * waiting-on list who has no presence entry in the group, meaning the group
 * isn't open on their phone, tagged by the chat so later pushes replace it.
 * A message nobody waits on, or in a group that's gone, pushes nobody.
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


	const conIdeStr = eveValObj.params.conIdeStr;                                                         // What: Conversation Identifier String. Why: A group's chat uses the group's ID. How: This reads it from the path.
	const waiUidArr = Object.keys( ( eveValObj.data.val()?.waitingOn ?? {} ) as Record< string, true > ); // What: Waiting UID Array. Why: Only members still waiting on the message need telling. How: This lists them. // What: Type Assertion Note. Why: The rules allow a map of UIDs to true. How: The as reads it as such.


	if ( waiUidArr.length === 0 ) return; // What: Nobody Waiting Guard. Why: A message nobody waits on tells nobody. How: This ends the run.



	const groNamStr = await namGetFun( conIdeStr ); // What: Group Name String. Why: The push's title is the group's name. How: This reads it.


	if ( groNamStr === null ) return; // What: Gone Group Guard. Why: A deleted group sends nothing. How: This ends the run.



	const preUidObj = ( await REA_DAT_OBJ.ref( `presence/${ conIdeStr }` ).get() ).val() ?? {}; // What: Presence UID Object. Why: A member with the group open sees the message already. How: This reads who's online.

	const awaUidArr = waiUidArr.filter( ( waiUidStr ) => !( waiUidStr in preUidObj ) ); // What: Away UID Array. Why: Only members away from the group are pushed. How: This drops those online.



	await Promise.all( awaUidArr.map( ( awaUidStr ) => pusSenFun( awaUidStr, 'chatMessage', groNamStr, { tagStr : `chat-${ conIdeStr }` } ) ) ); // What: Push Send Calls. Why: Each away member learns the chat moved on, as one notification however busy it is. How: This pushes each, tagged by the chat.


} );

// #endregion chaPusFun



// #region hisPusFun

/**
 * hisPusFun = History Push Function
 *
 * @summary
 * Runs on every write to a history request and, when the write leaves it
 * pending, which the rules allow only for a new request or a released claim,
 * pushes every member but the asker. Any other write pushes nobody.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The request before and after the
 *                    write, with the group's ID and the asker's UID in its
 *                    params.
 *
 * @returns A promise that settles once the pushes are sent, with no value.
 *
 * @example
 * ```ts
 * hisPusFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const hisPusFun = onDocumentWritten( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/historyRequests/{uidReqStr}' }, async ( eveValObj ) : Promise< void > => { // What: History Push Function. Why: A request needs a willing helper who's online, so members are told whenever one is open (Section 11.9). How: This pushes every other member when a request turns pending.


	if ( eveValObj.data?.after.get( 'status' ) !== 'pending' ) return; // What: Not Pending Guard. Why: Only a request that has just become pending asks for help, and the rules allow no write that leaves one pending, so a pending result is always new. How: This ends the run for a claim, a fulfilment, or a deletion.



	const groNamStr = ( await namGetFun( eveValObj.params.groIdeStr ) ) ?? '';                                                               // What: Group Name String. Why: The push's title is the group's name. How: This reads it, empty only for a group whose members are already gone, so nobody is pushed.
	const othUidArr = ( await memUidFun( eveValObj.params.groIdeStr ) ).filter( ( memUidStr ) => memUidStr !== eveValObj.params.uidReqStr ); // What: Other UID Array. Why: The asker needn't be told of their own request. How: This lists every other member.



	await Promise.all( othUidArr.map( ( othUidStr ) => pusSenFun( othUidStr, 'historyRequest', groNamStr ) ) ); // What: Push Send Calls. Why: Each member may be the one who can help. How: This pushes each.


} );

// #endregion hisPusFun



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


	await Promise.all( ( await memUidFun( groIdeStr ) ).map( ( memUidStr ) => pusSenFun( memUidStr, 'joinRequest', groNamStr, { bodStr : bodTexStr, tagStr : `join-${ groIdeStr }` } ) ) ); // What: Push Send Calls. Why: Every member can approve, and the phone shows one count however many requests arrive. How: This pushes each member the count, tagged by the group.


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



	await Promise.all( othUidArr.map( ( othUidStr ) => pusSenFun( othUidStr, 'keyRequest', groNamStr ) ) ); // What: Push Send Calls. Why: Any member online can share the key. How: This pushes each.


} );

// #endregion keyPusFun

// #endregion Helpers



// #region Exports

export { chaPusFun, hisPusFun, joiPusFun, keyPusFun }; // What: Named Exports. Why: The entry file exports every function Firebase deploys. How: This exports the four triggers.

// #endregion Exports


