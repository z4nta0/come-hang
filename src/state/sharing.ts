


// #region Imports

import { chaStaFun } from './chat.ts';                  // What: Chat Status Function. Why: Leaving and arriving post a status line to the chat. How: This sends one.
import { jsoObjFun } from '../utils/json.ts';           // What: JSON Object Function. Why: The kept record may be damaged or from an older version. How: This parses it safely.
import { locShaFun } from './location.ts';              // What: Location Share Function. Why: Sharing runs as a session of fixes. How: This starts one.
import { proKeyFun } from '../platform/dev-profile.ts'; // What: Profile Key Function. Why: Each development member keeps its own record. How: This names the key for this page's member.


import type { StaKinTyp } from '../core/chat-status.ts'; // What: Status Kind Type. Why: Leaving and arriving post the same way. How: This types which one.

// #endregion Imports



/**
 * sharing.ts = Location Sharing Session
 *
 * @summary
 * This device's part in an event's location sharing (ARCHITECTURE.md
 * Section 10), kept apart from any screen so it runs while the member moves
 * between sections. It holds one record at a time: the group and event,
 * when the event ends, whether the member is sharing, and whether they've
 * said they're on their way or have arrived. The record is kept on the
 * device, so a reload, which reopens the app, resumes sharing with a fresh
 * fix. Saying they're on their way or have arrived posts a status line to
 * the chat, and arriving also marks the share while it runs. Everything
 * ends at the event's end, and when the member's group goes. Screens read
 * the record through shaGetFun and hear changes through shaSubFun.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type ShaRecTyp = { arrBoo : boolean, endTimNum : number, eveIdeStr : string, groIdeStr : string, shaBoo : boolean, wayBoo : boolean }; // What: Sharing Record Type. Why: The device's part in one event's sharing is read by the screens and kept across reloads. How: This types the group, event, end time, and the three flags.

// #endregion Types



// #region Constants

const SHA_STO_STR = proKeyFun( 'come-hang-sharing' ); // What: Sharing Storage String. Why: The record has to survive a reload. How: This is the local storage key it's kept under, apart for each development member.

// #endregion Constants



// #region Module State

const lisFunSet = new Set< () => void >(); // What: Listener Function Set. Why: Screens redraw when the record changes. How: This holds each one's listener.

let endWaiNum = 0;     // What: End Wait Number. Why: Sharing stops when its event ends. How: This holds the timer that waits for it, 0 while none waits.
let resDonBoo = false; // What: Resume Done Boolean. Why: The kept record is resumed once, as the app opens. How: This is true once it has been.

let curRecObj : ShaRecTyp | null = null;                                                          // What: Current Record Object. Why: Screens read the record as it stands. How: This holds it, null when there's none.
let hanSesObj : { arrFun : () => Promise< void >, stoFun : () => Promise< void > } | null = null; // What: Handle Session Object. Why: Arriving and stopping act on the running session. How: This holds its functions, null while none runs.

// #endregion Module State



// #region Helpers

// #region recSavFun

/**
 * recSavFun = Record Save Function
 *
 * @summary
 * Makes a record the current one, or clears it with null: keeps it on the
 * device, sets a timer that ends it at its event's end, and tells every
 * listener. Storage that's blocked only loses the record at the next
 * reload.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param recNewObj - Record New Object: The record, or null for none.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * recSavFun({ arrBoo : false, ... }) // => void
 * ```
 *
*/

const recSavFun = ( recNewObj : ShaRecTyp | null ) : void => { // What: Record Save Function. Why: Every change to the record is kept, timed, and told the same way. How: This stores it, resets the timer, and calls the listeners.


	curRecObj = recNewObj; // What: Current Assignment. Why: Screens read the new record. How: This replaces it.



	try { // What: Store Attempt. Why: Storage can be blocked, such as with site data turned off. How: This writes or removes the key.


		if ( recNewObj ) localStorage.setItem( SHA_STO_STR, JSON.stringify( recNewObj ) ); // What: Record Store Call. Why: A reload resumes the record. How: This keeps it as JSON.

		else localStorage.removeItem( SHA_STO_STR ); // What: Record Removal Call. Why: A cleared record shouldn't come back. How: This removes the key.


	}

	catch ( errCatObj ) { console.warn( errCatObj ); } // What: Blocked Storage Catch. Why: The session still runs without storage. How: This logs the failure.



	window.clearTimeout( endWaiNum ); // What: Timer Clear Call. Why: Only the current record's end matters. How: This cancels the last timer.

	endWaiNum = recNewObj ? window.setTimeout( () => void shaEndFun( recNewObj.groIdeStr ), recNewObj.endTimNum - Date.now() ) : 0; // What: Timer Set Assignment. Why: Sharing ends with its event (Section 5). How: This ends the record at the event's end.



	for ( const lisValFun of lisFunSet ) lisValFun(); // What: Listener Loop. Why: Screens redraw with the new record. How: This calls each listener.


};

// #endregion recSavFun



// #region shaEndFun

/**
 * shaEndFun = Sharing End Function
 *
 * @summary
 * Ends this device's sharing for a group, when the record is that group's:
 * stops a running session, deleting the share, and clears the record. A
 * deletion the rules refuse, as once the group is deleted, is skipped. A
 * record for another group is left alone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group whose sharing ends.
 *
 * @returns A promise that settles once sharing has ended, with no value.
 *
 * @example
 * ```ts
 * shaEndFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const shaEndFun = async ( groIdeStr : string ) : Promise< void > => { // What: Sharing End Function. Why: Sharing ends with its event, and with its group for a member who leaves (Section 5). How: This stops the session and clears the record.


	if ( curRecObj?.groIdeStr !== groIdeStr ) return; // What: Other Group Guard. Why: Only the group's own sharing ends. How: This returns for a record of another group, or none.



	const sesOldObj = hanSesObj; // What: Session Old Object. Why: The session stops after it's let go. How: This holds it.

	hanSesObj = null; // What: Session Clear. Why: Nothing acts on the stopped session. How: This drops it.

	recSavFun( null ); // What: Record Clear Call. Why: The record is over. How: This clears it.

	await sesOldObj?.stoFun().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Session Stop Call. Why: The group stops seeing the member. How: This stops the session and deletes the share, logging a refused deletion.


};

// #endregion shaEndFun



// #region recForFun

/**
 * recForFun = Record For Function
 *
 * @summary
 * Returns the record for an event: the current one when it's that event's,
 * or a new one with every flag off, after ending sharing for any other
 * event.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The event's group.
 * @param eveIdeStr - Event Identifier String: The event.
 * @param endValNum - End Value Number: When the event ends, in
 *                    milliseconds.
 *
 * @returns A promise that resolves with the event's record.
 *
 * @example
 * ```ts
 * recForFun('Xk3...', 'Ev7...', 1767312000000) // => { arrBoo : false, ... }
 * ```
 *
*/

const recForFun = async ( groIdeStr : string, eveIdeStr : string, endValNum : number ) : Promise< ShaRecTyp > => { // What: Record For Function. Why: The device takes part in one event's sharing at a time. How: This returns that event's record, ending any other.


	if ( curRecObj?.groIdeStr === groIdeStr && curRecObj.eveIdeStr === eveIdeStr ) return curRecObj; // What: Same Event Guard. Why: The event's record carries on. How: This returns it.



	if ( curRecObj ) await shaEndFun( curRecObj.groIdeStr ); // What: Other End Call. Why: Sharing for another event stops. How: This ends it.



	return { arrBoo : false, endTimNum : endValNum, eveIdeStr, groIdeStr, shaBoo : false, wayBoo : false }; // What: New Record Return. Why: Nothing's been said or shared for this event yet. How: This returns a record with every flag off.


};

// #endregion recForFun



const recCurFun = ( recEveObj : ShaRecTyp ) : ShaRecTyp => curRecObj?.groIdeStr === recEveObj.groIdeStr && curRecObj.eveIdeStr === recEveObj.eveIdeStr ? curRecObj : recEveObj; // What: Record Current Function. Why: A post can land while a share is starting, so a record read before waiting may be stale. How: This returns the current record when it's still the same event's, or the one given.



const shaGetFun = () : ShaRecTyp | null => curRecObj; // What: Sharing Get Function. Why: Screens show where the member's sharing stands. How: This returns the current record, null when there's none.



const shaSubFun = ( lisValFun : () => void ) : ( () => void ) => { // What: Sharing Subscribe Function. Why: Screens redraw when the record changes. How: This adds the listener and returns its removal.


	lisFunSet.add( lisValFun ); // What: Listener Add Call. Why: The listener hears each change. How: This adds it.



	return () => { lisFunSet.delete( lisValFun ); }; // What: Removal Return. Why: A screen that closes stops listening. How: This returns the removal.


};



// #region shaStaFun

/**
 * shaStaFun = Sharing Start Function
 *
 * @summary
 * Starts sharing this member's location for an event, ending any other event's
 * sharing first, and keeps the record so a reload resumes it. A session
 * already running for the event is left as it is, and an arrival said while it
 * started marks it once it runs. Rejects with the GeolocationPositionError
 * when the device can't give a first fix, as when location is blocked, leaving
 * the member not sharing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The event's group.
 * @param eveIdeStr - Event Identifier String: The event.
 * @param endValNum - End Value Number: When the event ends, in
 *                    milliseconds.
 *
 * @returns A promise that settles once sharing has started, with no value.
 *
 * @example
 * ```ts
 * shaStaFun('Xk3...', 'Ev7...', 1767312000000) // => Promise<void>
 * ```
 *
*/

const shaStaFun = async ( groIdeStr : string, eveIdeStr : string, endValNum : number ) : Promise< void > => { // What: Sharing Start Function. Why: A member opts in to sharing for an event (Section 10). How: This starts the session and keeps the record.


	const recEveObj = await recForFun( groIdeStr, eveIdeStr, endValNum ); // What: Record Event Object. Why: Sharing belongs to the event's record. How: This reads it, ending any other.


	if ( hanSesObj ) return; // What: Running Guard. Why: A session already shares for the event. How: This returns.



	hanSesObj = await locShaFun( groIdeStr, eveIdeStr, recEveObj.arrBoo ); // What: Session Assignment. Why: Arriving and stopping act on the session. How: This starts it, carrying the arrived flag.


	const recNowObj = recCurFun( recEveObj ); // What: Record Now Object. Why: A post may have landed while the share started. How: This reads the record as it stands.


	recSavFun( { ...recNowObj, shaBoo : true } ); // What: Record Save Call. Why: Screens show the member sharing, and a reload resumes it. How: This keeps the record with sharing on.



	if ( recNowObj.arrBoo && !recEveObj.arrBoo ) await hanSesObj.arrFun().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Late Arrive Call. Why: An arrival said while the share started missed the session. How: This marks the share arrived, logging a fix the device couldn't get.


};

// #endregion shaStaFun



// #region shaStoFun

/**
 * shaStoFun = Sharing Stop Function
 *
 * @summary
 * Stops this member's sharing, deleting their share at once, while the
 * record keeps whether they said they're on their way or have arrived.
 * Does nothing when no session runs.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once sharing has stopped, with no value.
 *
 * @example
 * ```ts
 * shaStoFun() // => Promise<void>
 * ```
 *
*/

const shaStoFun = async () : Promise< void > => { // What: Sharing Stop Function. Why: A member can stop sharing whenever they like (Section 11.4). How: This stops the session and keeps the record with sharing off.


	if ( !hanSesObj || !curRecObj ) return; // What: Idle Guard. Why: There's nothing to stop. How: This returns.



	const sesOldObj = hanSesObj; // What: Session Old Object. Why: The session stops after it's let go. How: This holds it.

	hanSesObj = null; // What: Session Clear. Why: Nothing acts on the stopped session. How: This drops it.

	await sesOldObj.stoFun(); // What: Session Stop Call. Why: The group stops seeing the member at once. How: This stops the session and deletes the share.

	recSavFun( { ...curRecObj, shaBoo : false } ); // What: Record Save Call. Why: Screens show the member not sharing, and a reload doesn't resume it. How: This keeps the record with sharing off.


};

// #endregion shaStoFun



// #region shaPosFun

/**
 * shaPosFun = Sharing Post Function
 *
 * @summary
 * Says the member is on their way, or has arrived, for an event: posts the
 * status line to the group's chat, then marks the record as it then stands,
 * and on arriving marks a running share too. Any other event's sharing ends
 * first. Rejects when the post fails, leaving the record as it was.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The event's group.
 * @param eveIdeStr - Event Identifier String: The event.
 * @param endValNum - End Value Number: When the event ends, in
 *                    milliseconds.
 * @param staKinStr - Status Kind String: 'way' for leaving, 'arr' for
 *                    arriving.
 *
 * @returns A promise that settles once the status is posted, with no value.
 *
 * @example
 * ```ts
 * shaPosFun('Xk3...', 'Ev7...', 1767312000000, 'arr') // => Promise<void>
 * ```
 *
*/

const shaPosFun = async ( groIdeStr : string, eveIdeStr : string, endValNum : number, staKinStr : StaKinTyp ) : Promise< void > => { // What: Sharing Post Function. Why: Leaving and arriving each post a status line, and arriving marks the share (Section 10). How: This posts, then marks the record and the share.


	const recEveObj = await recForFun( groIdeStr, eveIdeStr, endValNum ); // What: Record Event Object. Why: The status belongs to the event's record. How: This reads it, ending any other.


	await chaStaFun( groIdeStr, staKinStr ); // What: Status Post Call. Why: The group sees it in the chat without opening the map. How: This posts the status line.


	const recNowObj = recCurFun( recEveObj ); // What: Record Now Object. Why: A share may have started while the post was out. How: This reads the record as it stands.



	if ( staKinStr === 'arr' ) { // What: Arrival Check. Why: An arrival marks the share as well as the record. How: This marks both.


		recSavFun( { ...recNowObj, arrBoo : true } ); // What: Arrived Save Call. Why: Screens show the member arrived, and a resumed share carries the badge. How: This keeps the record arrived.

		await hanSesObj?.arrFun().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Share Arrive Call. Why: The map shows the badge with a fresh fix (Section 10). How: This marks a running share arrived, logging a fix the device couldn't get.


	}

	else recSavFun( { ...recNowObj, wayBoo : true } ); // What: Way Save Call. Why: Screens show the member on their way. How: This keeps the record so.


};

// #endregion shaPosFun



// #region shaResFun

/**
 * shaResFun = Sharing Resume Function
 *
 * @summary
 * Resumes the record kept on this device as the app opens, once its groups
 * are known: a record that's damaged, past its event's end, or for a group
 * the member is no longer in is cleared, and otherwise it becomes current,
 * restarting a share that was running with a fresh fix. A share that can't
 * restart, as when location is now blocked, is kept with sharing off. Runs
 * once, and does nothing when a record is already current.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeArr - Group Identifier Array: The groups the member is in.
 *
 * @returns A promise that settles once the record is resumed, with no
 *          value.
 *
 * @example
 * ```ts
 * shaResFun(['Xk3...']) // => Promise<void>
 * ```
 *
*/

const shaResFun = async ( groIdeArr : string[] ) : Promise< void > => { // What: Sharing Resume Function. Why: Opening the app sends a fresh fix while sharing (Section 10). How: This reads the kept record and restarts its share.


	if ( resDonBoo || curRecObj ) return; // What: Once Guard. Why: The kept record is resumed once, and a record already in use is newer. How: This returns after the first call, or with a current record.



	resDonBoo = true; // What: Done Set. Why: Later group reports needn't read the record again. How: This marks the resume done.

	let stoValStr : string | null = null; // What: Stored Value String. Why: The record is kept as JSON. How: This holds it, null when there's none.



	try { stoValStr = localStorage.getItem( SHA_STO_STR ); } // What: Record Read Attempt. Why: The record is kept under one key. How: This reads it.

	catch { return; } // What: Blocked Storage Fallback. Why: Without storage there's no kept record. How: This returns.



	const stoRecObj = jsoObjFun( stoValStr ?? '' ); // What: Stored Record Object. Why: The kept text may not be a record. How: This parses it, null when it isn't an object.


	if ( !stoRecObj ) { recSavFun( null ); return; } // What: Missing Guard. Why: There's no record, or a damaged one that's over. How: This clears it and returns.



	const booKeyBoo = [ 'arrBoo', 'shaBoo', 'wayBoo' ].every( ( keyValStr ) => typeof stoRecObj[ keyValStr ] === 'boolean' ); // What: Boolean Keys Boolean. Why: The flags have to be flags. How: This checks each is a boolean.
	const endNumBoo = typeof stoRecObj.endTimNum === 'number';                                                                 // What: End Number Boolean. Why: The end time has to be a number. How: This checks its type.
	const strKeyBoo = [ 'eveIdeStr', 'groIdeStr' ].every( ( keyValStr ) => typeof stoRecObj[ keyValStr ] === 'string' );       // What: String Keys Boolean. Why: The IDs have to be strings. How: This checks each is a string.

	const recValBoo = booKeyBoo && endNumBoo && strKeyBoo; // What: Record Valid Boolean. Why: An older or damaged record mustn't be trusted. How: This combines the checks.


	const stoRecVal = stoRecObj as ShaRecTyp; // What: Stored Record Value. Why: A checked record is read as one. How: This names it. // What: Type Assertion Note. Why: The stale guard below reads it only once recValBoo checked every field. How: The as reads it as a record.


	if ( !recValBoo || stoRecVal.endTimNum <= Date.now() || !groIdeArr.includes( stoRecVal.groIdeStr ) ) { recSavFun( null ); return; } // What: Stale Guard. Why: A damaged or ended record, or one for a group the member left, is over. How: This clears it and returns.



	recSavFun( { ...stoRecVal, shaBoo : false } ); // What: Record Resume Call. Why: Screens show what was said, while the share restarts. How: This makes the record current with sharing off.



	if ( stoRecVal.shaBoo ) await shaStaFun( stoRecVal.groIdeStr, stoRecVal.eveIdeStr, stoRecVal.endTimNum ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Share Restart Call. Why: The member was sharing when the app closed. How: This restarts it with a fresh fix, logging a fix the device couldn't get.


};

// #endregion shaResFun

// #endregion Helpers



// #region Exports

export { shaEndFun, shaGetFun, shaPosFun, type ShaRecTyp, shaResFun, shaStaFun, shaStoFun, shaSubFun }; // What: Named Exports. Why: The screens start, stop, resume, and read sharing, and post leaving and arriving, through these. How: This exports the functions and the record's type.

// #endregion Exports


