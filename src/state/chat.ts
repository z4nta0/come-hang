


// #region Imports

import { chaMesFun       } from '../core/text-limits.ts';    // What: Chat Message Function. Why: A message is checked by the app alone. How: This applies the limits.
import { child           } from 'firebase/database';         // What: Child. Why: A message's waiting-on entries sit under it. How: This names one.
import { collection      } from 'firebase/firestore';        // What: Collection. Why: The waiting-on list names every other member. How: This names the members collection.
import { decTexFun       } from '../platform/crypto.ts';     // What: Decrypt Text Function. Why: Messages are stored encrypted. How: This decrypts one.
import { doc             } from 'firebase/firestore';        // What: Doc. Why: The group and this member's membership are read by path. How: This builds a reference.
import { encTexFun       } from '../platform/crypto.ts';     // What: Encrypt Text Function. Why: Messages are sent encrypted. How: This encrypts one under the group key.
import { firGetFun       } from '../platform/firebase.ts';   // What: Firebase Get Function. Why: Chat lives in the Realtime Database, membership in Firestore. How: This returns the services.
import { get             } from 'firebase/database';         // What: Get. Why: A sync reads every message waiting since this member joined. How: This runs the query once.
import { getDoc          } from 'firebase/firestore';        // What: Get Doc. Why: The join time and retention are read from Firestore. How: This reads one document.
import { getDocs         } from 'firebase/firestore';        // What: Get Docs. Why: The members are read together. How: This reads the collection.
import { ideEnsFun       } from './identity.ts';             // What: Identity Ensure Function. Why: Chat acts as this identity. How: This reads it.
import { keyLoaFun       } from './groups.ts';               // What: Key Load Function. Why: Messages are encrypted with the group key. How: This loads it.
import { linNorFun       } from '../core/text-limits.ts';    // What: Lines Normalize Function. Why: A message keeps its line breaks while it's tidied. How: This normalizes it.
import { mesPutFun       } from '../platform/chat-store.ts'; // What: Message Put Function. Why: The device keeps its chat history. How: This stores a message.
import { onChildAdded    } from 'firebase/database';         // What: On Child Added. Why: A watched chat hears each message as it arrives. How: This listens to the query.
import { orderByChild    } from 'firebase/database';         // What: Order By Child. Why: The rules let a member read only messages ordered by when they were sent. How: This orders the query.
import { push            } from 'firebase/database';         // What: Push. Why: Each message takes the database's own time-ordered ID. How: This writes it under a new one.
import { query           } from 'firebase/database';         // What: Query. Why: Reads are a query the rules check. How: This builds it.
import { ref             } from 'firebase/database';         // What: Ref. Why: Messages and their entries are named by path. How: This builds a reference.
import { remove          } from 'firebase/database';         // What: Remove. Why: Waiting-on entries and delivered messages are deleted. How: This deletes one.
import { serverTimestamp } from 'firebase/database';         // What: Server Timestamp. Why: The rules require a message's time to be the server's. How: This asks the server to fill it in.
import { startAt         } from 'firebase/database';         // What: Start At. Why: The rules let a member read from their own join time exactly. How: This starts the query there.


import type { DataSnapshot } from 'firebase/database';         // What: Data Snapshot. Why: Each message arrives as one. How: This types it.
import type { MesRecTyp    } from '../platform/chat-store.ts'; // What: Message Record Type. Why: A handled message is stored and handed on as a record. How: This types it.
import type { Timestamp    } from 'firebase/firestore';        // What: Timestamp. Why: The join time comes back as a timestamp. How: This types it.

// #endregion Imports



/**
 * chat.ts = Chat
 *
 * @summary
 * A group's chat (ARCHITECTURE.md Sections 5 and 11.7). A message is tidied,
 * checked as visible text, encrypted under the group key, and sent with a
 * waiting-on list naming every other member, and the sender's device keeps
 * its own copy. A member reads only from their own join time, as the rules
 * require, by a one-time sync or by watching the chat. Each message read is
 * decrypted and kept on the device, takes this member off its waiting-on
 * list, takes off members who've left, and is deleted from the server once
 * nobody is waiting on it or it's older than the group's chat retention. A
 * message that won't decrypt isn't kept, but is still acknowledged.
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

type ChaCtxTyp = { groIdeStr : string, groKeyObj : CryptoKey, joiTimNum : number, memUidSet : Set< string >, ttlDayNum : number, uidValStr : string }; // What: Chat Context Type. Why: Reading a chat needs the same facts for every message. How: This types what chaCtxFun loads.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: Chat retention is counted in days. How: This is one day in milliseconds.

// #endregion Constants



// #region Helpers

const b64DecFun = ( b64ValStr : string ) : Uint8Array< ArrayBuffer > => Uint8Array.from( atob( b64ValStr ), ( chaValStr ) => chaValStr.charCodeAt( 0 ) ); // What: Base64 Decode Function. Why: A message's ciphertext and IV are stored as base64. How: This turns one back into bytes.
const b64EncFun = ( bytValArr : Uint8Array ) : string => btoa( String.fromCharCode( ...bytValArr ) );                                                     // What: Base64 Encode Function. Why: The rules check a message's ciphertext and IV as base64. How: This turns bytes into it.



const memUidFun = async ( groIdeStr : string ) : Promise< Set< string > > => new Set( ( await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/members` ) ) ).docs.map( ( memDocObj ) => memDocObj.id ) ); // What: Member UID Function. Why: Sending and cleaning up both need who's in the group now. How: This reads the members' UIDs.



// #region chaCtxFun

/**
 * chaCtxFun = Chat Context Function
 *
 * @summary
 * Loads what reading a group's chat needs: this identity's UID, the group
 * key, this member's join time in milliseconds, which the read query has to
 * start at exactly, the current members' UIDs, and the group's chat
 * retention in days.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the chat's context.
 *
 * @example
 * ```ts
 * chaCtxFun('Xk3...') // => { joiTimNum : 1761696000000, ... }
 * ```
 *
*/

const chaCtxFun = async ( groIdeStr : string ) : Promise< ChaCtxTyp > => { // What: Chat Context Function. Why: A sync and a watch read the chat the same way. How: This loads every fact they need.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The chat is read as this identity. How: This reads it.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The join time and retention are in Firestore. How: This reads the service.

	const groKeyObj = await keyLoaFun( groIdeStr );                                                     // What: Group Key Object. Why: Messages open with the group key. How: This loads it.
	const groSnaObj = await getDoc( doc( fstDatObj, `groups/${ groIdeStr }` ) );                        // What: Group Snapshot Object. Why: The retention is a group setting. How: This reads the group.
	const memSnaObj = await getDoc( doc( fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) ); // What: Member Snapshot Object. Why: Reading starts at this member's join time. How: This reads the membership.
	const memUidSet = await memUidFun( groIdeStr );                                                     // What: Member UID Set. Why: Entries for members who left are cleaned up. How: This reads who's in the group.



	return { // What: Context Return. Why: The reader uses every fact. How: This returns them.


		groIdeStr,                                                           // What: Group Identifier String. Why: Messages are stored under their group. How: This holds its ID.
		groKeyObj,                                                           // What: Group Key Object. Why: Messages decrypt with it. How: This holds it.
		joiTimNum : ( memSnaObj.get( 'joinedAt' ) as Timestamp ).toMillis(), // What: Join Time Number. Why: The mirror holds the join time in milliseconds, and the query has to match it. How: This converts it the way the mirror does. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
		memUidSet,                                                           // What: Member UID Set. Why: Departed members are found against it. How: This holds the current UIDs.
		ttlDayNum : groSnaObj.get( 'chatTtlDays' ) as number,                // What: TTL Day Number. Why: A message older than the retention is deleted. How: This reads it. // What: Type Assertion Note. Why: The rules store it as an integer. How: The as reads it as a number.
		uidValStr                                                            // What: UID Value String. Why: This member acknowledges messages as themselves. How: This holds the UID.


	};


};

// #endregion chaCtxFun



// #region mesHanFun

/**
 * mesHanFun = Message Handle Function
 *
 * @summary
 * Handles one message read from the server: decrypts it and keeps it on the
 * device, deletes this member's waiting-on entry, deletes the entries of
 * members who've left, rereading the members first so someone who joined
 * since isn't mistaken for gone, and deletes the message once nobody is
 * waiting on it or it's older than the retention. Resolves with the stored
 * record, or null for a message that won't decrypt, which is still
 * acknowledged. A cleanup another member's device already made, or one the
 * rules refuse while the mirror catches up, is skipped.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param chaCtxObj - Chat Context Object: The chat's context.
 * @param mesSnaObj - Message Snapshot Object: The message as read.
 *
 * @returns A promise that resolves with the stored message, or null.
 *
 * @example
 * ```ts
 * mesHanFun(chaCtxObj, mesSnaObj) // => { texValStr : 'Hi', ... }
 * ```
 *
*/

const mesHanFun = async ( chaCtxObj : ChaCtxTyp, mesSnaObj : DataSnapshot ) : Promise< MesRecTyp | null > => { // What: Message Handle Function. Why: Every message read is kept, acknowledged, and cleaned up the same way (Section 11.7). How: This runs each step for one message.


	const mesValObj = mesSnaObj.val() as { ciphertext : string, iv : string, senderUid : string, sentAt : number, waitingOn? : Record< string, true > };                                     // What: Message Value Object. Why: Each field is read once. How: This reads the message. // What: Type Assertion Note. Why: The rules allow exactly these fields. How: The as reads them as such.
	const texValStr = await decTexFun( chaCtxObj.groKeyObj, b64DecFun( mesValObj.ciphertext ), b64DecFun( mesValObj.iv ) ).catch( () => null );                                              // What: Text Value String. Why: Another member wrote the message, so it may not decrypt. How: This decrypts it, null when it won't.
	const waiUidArr = Object.keys( mesValObj.waitingOn ?? {} ); // What: Waiting UID Array. Why: Whoever is still waiting decides when the message goes. How: This lists them.
	const mesRecObj = texValStr === null ? null : { groIdeStr : chaCtxObj.groIdeStr, mesIdeStr : mesSnaObj.key!, senUidStr : mesValObj.senderUid, sntTimNum : mesValObj.sentAt, texValStr }; // What: Message Record Object. Why: A readable message is kept on the device. How: This builds its record, or null. // What: Non-Null Note. Why: A message under the chat always has a key. How: The ! reads it as present.


	if ( mesRecObj ) await mesPutFun( mesRecObj ); // What: Store Call. Why: The device keeps the history the server won't. How: This stores the message.



	if ( waiUidArr.includes( chaCtxObj.uidValStr ) ) await remove( child( mesSnaObj.ref, `waitingOn/${ chaCtxObj.uidValStr }` ) ); // What: Acknowledge Call. Why: This member has the message now. How: This deletes their own waiting-on entry.



	let othUidArr = waiUidArr.filter( ( waiUidStr ) => waiUidStr !== chaCtxObj.uidValStr ); // What: Other UID Array. Why: The others still waiting decide when the message goes. How: This lists everyone waiting but this member.



	if ( othUidArr.some( ( othUidStr ) => !chaCtxObj.memUidSet.has( othUidStr ) ) ) chaCtxObj.memUidSet = await memUidFun( chaCtxObj.groIdeStr ); // What: Member Refresh Call. Why: Someone may have joined since the members were read, and must not be taken for gone. How: This rereads the members when an entry names someone unknown.



	for ( const othUidStr of othUidArr.filter( ( waiUidStr ) => !chaCtxObj.memUidSet.has( waiUidStr ) ) ) await remove( child( mesSnaObj.ref, `waitingOn/${ othUidStr }` ) ).catch( () => undefined ); // What: Departed Clear Loop. Why: A member who left can't hold up cleanup (Section 5). How: This deletes each departed member's entry, skipping one the rules refuse while the mirror catches up.



	othUidArr = othUidArr.filter( ( othUidStr ) => chaCtxObj.memUidSet.has( othUidStr ) ); // What: Other UID Assignment. Why: Only current members still hold the message up. How: This drops the departed.

	const oldMesBoo = mesValObj.sentAt + chaCtxObj.ttlDayNum * DAY_MIL_NUM < Date.now(); // What: Old Message Boolean. Why: A message past the retention goes whoever's waiting (Section 5). How: This compares its age with the group's days.


	if ( othUidArr.length === 0 || oldMesBoo ) await remove( mesSnaObj.ref ).catch( () => undefined ); // What: Message Delete Call. Why: The server keeps a message only until everyone has it. How: This deletes it, skipping a deletion another device already made.



	return mesRecObj; // What: Record Return. Why: A watcher shows the message. How: This returns the stored record, or null.


};

// #endregion mesHanFun



// #region chaSenFun

/**
 * chaSenFun = Chat Send Function
 *
 * @summary
 * Sends a message to a group's chat, tidied and checked as visible text,
 * encrypted under the group key, stamped with the server's time, and
 * waiting on every other member. The sender's device keeps its own copy.
 * Resolves with the message's ID. A message outside its limits rejects with
 * a RangeError before anything is sent.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param mesTexStr - Message Text String: The message, as typed.
 *
 * @returns A promise that resolves with the message's ID.
 *
 * @example
 * ```ts
 * chaSenFun('Xk3...', 'On my way') // => '-Nx...'
 * ```
 *
*/

const chaSenFun = async ( groIdeStr : string, mesTexStr : string ) : Promise< string > => { // What: Chat Send Function. Why: Members talk in the group's chat (Section 11.7). How: This checks, encrypts, and sends the message, then keeps a copy.


	const mesNorStr = linNorFun( mesTexStr ); // What: Message Normalized String. Why: The message is sent tidied. How: This normalizes it, keeping its line breaks.


	if ( !chaMesFun( mesNorStr ) ) throw new RangeError( 'The message is outside its limits.' ); // What: Message Guard. Why: The rules can only cap an encrypted message's size. How: This rejects it here.



	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The message names its sender. How: This reads the identity.

	const mesEncObj = await encTexFun( await keyLoaFun( groIdeStr ), mesNorStr );                             // What: Message Encrypted Object. Why: Firebase only ever sees ciphertext. How: This encrypts it under the group key.
	const othUidArr = [ ...await memUidFun( groIdeStr ) ].filter( ( memUidStr ) => memUidStr !== uidValStr ); // What: Other UID Array. Why: The message waits on every other member. How: This lists them.

	const mesRefObj = await push( ref( firGetFun().reaDatObj, `chats/${ groIdeStr }/messages` ), { // What: Message Reference Object. Why: The message is sent under a new time-ordered ID. How: This writes it with every field the rules expect.


		ciphertext : b64EncFun( mesEncObj.cipTexArr ),                                           // What: Ciphertext. Why: The rules check it as base64. How: This encodes it.
		iv         : b64EncFun( mesEncObj.iniVecArr ),                                           // What: IV. Why: The message decrypts with it. How: This encodes it.
		senderUid  : uidValStr,                                                                  // What: Sender UID. Why: The rules require the sender's own UID. How: This names them.
		sentAt     : serverTimestamp(),                                                          // What: Sent At. Why: The rules require the server's time. How: This asks the server to fill it in.
		waitingOn  : Object.fromEntries( othUidArr.map( ( othUidStr ) => [ othUidStr, true ] ) ) // What: Waiting On. Why: The message stays until every other member has it. How: This lists them, which the database drops when there's nobody.


	} );


	await mesPutFun({ // What: Store Call. Why: The sender keeps their own message. How: This stores it, timed by the device until a sync reads the server's time.


		groIdeStr,                  // What: Group Identifier String. Why: The message is kept under its group. How: This names it.
		mesIdeStr : mesRefObj.key!, // What: Message Identifier String. Why: A later sync of the same message replaces this copy. How: This uses the server's ID. // What: Non-Null Note. Why: A pushed reference always has a key. How: The ! reads it as present.
		senUidStr : uidValStr,      // What: Sender UID String. Why: The chat shows who sent it. How: This names this identity.
		sntTimNum : Date.now(),     // What: Sent Time Number. Why: The history is ordered by time. How: This uses the device's clock.
		texValStr : mesNorStr       // What: Text Value String. Why: The history shows the text. How: This keeps the tidied message.


	});



	return mesRefObj.key!; // What: Message Return. Why: The app can find the message. How: This returns its ID. // What: Non-Null Note. Why: A pushed reference always has a key. How: The ! reads it as present.


};

// #endregion chaSenFun



// #region chaSynFun

/**
 * chaSynFun = Chat Sync Function
 *
 * @summary
 * Reads every message waiting on the server since this member joined, and
 * handles each in turn, keeping, acknowledging, and cleaning it up. Resolves
 * with how many readable messages it kept.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the number of messages kept.
 *
 * @example
 * ```ts
 * chaSynFun('Xk3...') // => 2
 * ```
 *
*/

const chaSynFun = async ( groIdeStr : string ) : Promise< number > => { // What: Chat Sync Function. Why: Opening the app catches up on what was sent while away. How: This reads from the join time and handles each message.


	const chaCtxObj = await chaCtxFun( groIdeStr ); // What: Chat Context Object. Why: Every message is handled with the same facts. How: This loads them.

	const mesSnaObj = await get( query( ref( firGetFun().reaDatObj, `chats/${ groIdeStr }/messages` ), orderByChild( 'sentAt' ), startAt( chaCtxObj.joiTimNum ) ) ); // What: Messages Snapshot Object. Why: The rules allow reading from the join time exactly. How: This runs that query once.

	const chiSnaArr : DataSnapshot[] = []; // What: Child Snapshot Array. Why: The messages are handled one after another, in order. How: This collects them.


	mesSnaObj.forEach( ( chiSnaObj ) => { chiSnaArr.push( chiSnaObj ); } ); // What: Collect Call. Why: A snapshot's children are only walked through forEach. How: This gathers them in order.


	let kepCouNum = 0; // What: Kept Count Number. Why: The caller learns how many messages arrived. How: This counts the kept ones.



	for ( const chiSnaObj of chiSnaArr ) if ( await mesHanFun( chaCtxObj, chiSnaObj ) ) kepCouNum += 1; // What: Handle Loop. Why: Each message is kept, acknowledged, and cleaned up. How: This handles them in order, counting the readable ones.



	return kepCouNum; // What: Count Return. Why: The caller learns how many arrived. How: This returns the count.


};

// #endregion chaSynFun



// #region chaWatFun

/**
 * chaWatFun = Chat Watch Function
 *
 * @summary
 * Watches a group's chat from this member's join time, handling each
 * message as it arrives, those already waiting first, and handing each
 * readable one to the callback. Resolves with the function that stops
 * watching.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param onMesFun - On Message Function: Called with each kept message.
 *
 * @returns A promise that resolves with the function that stops watching.
 *
 * @example
 * ```ts
 * chaWatFun('Xk3...', (mesRecObj) => show(mesRecObj)) // => () => void
 * ```
 *
*/

const chaWatFun = async ( groIdeStr : string, onMesFun : ( mesRecObj : MesRecTyp ) => void ) : Promise< () => void > => { // What: Chat Watch Function. Why: An open chat shows messages as they're sent. How: This listens from the join time and handles each new one.


	const chaCtxObj = await chaCtxFun( groIdeStr ); // What: Chat Context Object. Why: Every message is handled with the same facts. How: This loads them.

	let queProObj = Promise.resolve(); // What: Queue Promise Object. Why: Messages are handled one at a time, in order. How: This chains each one after the last.



	return onChildAdded( query( ref( firGetFun().reaDatObj, `chats/${ groIdeStr }/messages` ), orderByChild( 'sentAt' ), startAt( chaCtxObj.joiTimNum ) ), ( chiSnaObj ) => { // What: Watch Return. Why: The caller stops watching when the chat closes. How: This listens from the join time and returns the listener's unsubscribe.


		queProObj = queProObj.then( async () => { // What: Queue Assignment. Why: A message's handling has to finish before the next one's starts. How: This chains it after the last.


			const mesRecObj = await mesHanFun( chaCtxObj, chiSnaObj ); // What: Message Record Object. Why: The message is kept, acknowledged, and cleaned up. How: This handles it.


			if ( mesRecObj ) onMesFun( mesRecObj ); // What: Message Callback Call. Why: The chat shows a readable message. How: This hands it on.


		} );


	} );


};

// #endregion chaWatFun

// #endregion Helpers



// #region Exports

export { chaSenFun, chaSynFun, chaWatFun }; // What: Named Exports. Why: The chat screen sends, catches up, and watches through these. How: This exports the functions.

// #endregion Exports


