


// #region Imports

import { Bytes      } from 'firebase/firestore';      // What: Bytes. Why: An event's encrypted details and IV are stored as Firestore bytes. How: This wraps and reads raw bytes.
import { collection } from 'firebase/firestore';      // What: Collection. Why: A group's events and an event's items are listed together. How: This names a collection.
import { decTexFun  } from '../platform/crypto.ts';   // What: Decrypt Text Function. Why: An event's details are stored encrypted. How: This decrypts them.
import { desNorFun  } from '../core/text-limits.ts';  // What: Description Normalize Function. Why: A description keeps its line breaks while it's tidied. How: This normalizes it.
import { doc        } from 'firebase/firestore';      // What: Doc. Why: Each event is named by path. How: This builds a reference.
import { encTexFun  } from '../platform/crypto.ts';   // What: Encrypt Text Function. Why: An event's details are stored encrypted. How: This encrypts them under the group key.
import { eveDesFun  } from '../core/text-limits.ts';  // What: Event Description Function. Why: A description is checked by the app alone. How: This applies the limits.
import { eveLocFun  } from '../core/text-limits.ts';  // What: Event Location Function. Why: A location is checked by the app alone. How: This applies the limits.
import { eveTitFun  } from '../core/text-limits.ts';  // What: Event Title Function. Why: A title is checked by the app alone. How: This applies the limits.
import { firGetFun  } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Events live in Firestore. How: This returns the services.
import { getDocs    } from 'firebase/firestore';      // What: Get Docs. Why: Events and their items are read together. How: This reads a collection.
import { ideEnsFun  } from './identity.ts';           // What: Identity Ensure Function. Why: An event names its creator. How: This reads the identity.
import { keyLoaFun  } from './groups.ts';             // What: Key Load Function. Why: Details are encrypted with the group key. How: This loads it.
import { setDoc     } from 'firebase/firestore';      // What: Set Doc. Why: A new event is written whole. How: This writes it.
import { texNorFun  } from '../core/text-limits.ts';  // What: Text Normalize Function. Why: A title and location are tidied before they're checked. How: This normalizes them.
import { Timestamp  } from 'firebase/firestore';      // What: Timestamp. Why: An event's times are stored as timestamps. How: This builds and reads them.
import { writeBatch } from 'firebase/firestore';      // What: Write Batch. Why: A changed or cancelled event moves or deletes its items with it. How: This groups the writes.

// #endregion Imports



/**
 * events.ts = Events
 *
 * @summary
 * A group's planned events (ARCHITECTURE.md Sections 5 and 11.5). Any
 * member plans an event, and its creator or the group's owner changes or
 * cancels it. An event's title, description, and location text are tidied,
 * checked, and encrypted together as one bundle under the group key, so
 * Firebase can't tell which are filled in or how long each is, while its
 * start and end stay plaintext for the deletion that follows 48 hours after
 * it ends. Its times are checked as the rules check them: it ends after it
 * starts, lasts at most 7 days, hasn't ended, and starts at most a year
 * ahead. Moving an event's end moves every item's deletion time in the same
 * batch, and cancelling an event deletes its items with it. Any member lists
 * the events with their details decrypted, where details that won't read
 * come back empty.
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

type EveFieTyp = { detailsEnc : Bytes, endAt : Timestamp, expireAt : Timestamp, iv : Bytes, startAt : Timestamp };       // What: Event Fields Type. Why: Planning and changing an event write the same fields. How: This types what eveFieFun builds.
type EveInpTyp = { desTexStr : string, endTimNum : number, locTexStr : string, staTimNum : number, titTexStr : string }; // What: Event Input Type. Why: Planning and changing an event take the same details, with times in milliseconds. How: This types them.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000; // What: Day Milliseconds Number. Why: An event's limits are counted in days. How: This is one day in milliseconds.

// #endregion Constants



// #region Helpers

// #region detParFun

/**
 * detParFun = Details Parse Function
 *
 * @summary
 * Parses a decrypted details bundle into a record of its parts. Another
 * member wrote the bundle, so it's untrusted: text that isn't JSON, or JSON
 * that isn't an object, comes back as an empty record, and the caller still
 * checks each part is text.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param detTexStr - Details Text String: The decrypted bundle.
 *
 * @returns The bundle's parts, or an empty record.
 *
 * @example
 * ```ts
 * detParFun('{"t":"Picnic"}') // => { t : 'Picnic' }
 * ```
 *
*/

const detParFun = ( detTexStr : string ) : Record< string, unknown > => { // What: Details Parse Function. Why: A bad bundle mustn't break the event list. How: This parses it, falling back to an empty record.


	let detValAny : unknown = null; // What: Details Value Any. Why: The parse may fail. How: This starts with nothing parsed.



	try { detValAny = JSON.parse( detTexStr ); } // What: Parse Assignment. Why: The bundle is JSON when a member wrote it through the app. How: This parses it.

	catch { detValAny = null; } // What: Parse Fallback. Why: Text that isn't JSON is ignored, an expected case for untrusted data. How: This keeps nothing parsed.



	return ( detValAny !== null && typeof detValAny === 'object' ? detValAny : {} ) as Record< string, unknown >; // What: Record Return. Why: Only an object has parts. How: This returns it, or an empty record for anything else. // What: Type Assertion Note. Why: A parsed object's keys are unknown. How: The as reads it as a record of unknowns.


};

// #endregion detParFun



// #region eveFieFun

/**
 * eveFieFun = Event Fields Function
 *
 * @summary
 * Builds the fields an event is written with, after tidying and checking
 * its text and times the way the rules and Section 11.10 do: the details
 * bundle encrypted under the group key with a fresh IV, the start and end,
 * and the deletion time 48 hours after the end. Text outside its limits, or
 * times the rules would refuse, reject with a RangeError before anything is
 * written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveInpObj - Event Input Object: The event's details, as typed.
 *
 * @returns A promise that resolves with the fields to write.
 *
 * @example
 * ```ts
 * eveFieFun('Xk3...', { titTexStr : 'Picnic', ... }) // => { detailsEnc, ... }
 * ```
 *
*/

const eveFieFun = async ( groIdeStr : string, eveInpObj : EveInpTyp ) : Promise< EveFieTyp > => { // What: Event Fields Function. Why: Planning and changing an event check and encrypt it the same way. How: This tidies, checks, and encrypts the details and builds the times.


	const desNorStr = desNorFun( eveInpObj.desTexStr ); // What: Description Normalized String. Why: The description is saved tidied. How: This normalizes it, keeping its line breaks.
	const locNorStr = texNorFun( eveInpObj.locTexStr ); // What: Location Normalized String. Why: The location is saved tidied. How: This normalizes it.
	const titNorStr = texNorFun( eveInpObj.titTexStr ); // What: Title Normalized String. Why: The title is saved tidied. How: This normalizes it.

	const desValBoo = eveDesFun( desNorStr ); // What: Description Valid Boolean. Why: The description keeps to its limits. How: This checks it.
	const locValBoo = eveLocFun( locNorStr ); // What: Location Valid Boolean. Why: The location keeps to its limits. How: This checks it.
	const titValBoo = eveTitFun( titNorStr ); // What: Title Valid Boolean. Why: The title keeps to its limits. How: This checks it.

	const texValBoo = desValBoo && locValBoo && titValBoo; // What: Text Valid Boolean. Why: Every field has to pass. How: This combines them.


	if ( !texValBoo ) throw new RangeError( "The event's text is outside its limits." ); // What: Text Guard. Why: The rules can't read encrypted text, so the app holds it to its limits. How: This rejects first.



	const durTimNum = eveInpObj.endTimNum - eveInpObj.staTimNum; // What: Duration Time Number. Why: An event's length is checked. How: This is its end minus its start.

	const endFutBoo = eveInpObj.endTimNum > Date.now();                      // What: End Future Boolean. Why: An event that's over isn't planned or changed. How: This checks it ends after now.
	const lenValBoo = durTimNum <= 7 * DAY_MIL_NUM;                          // What: Length Valid Boolean. Why: An event lasts at most 7 days. How: This checks its duration.
	const ordValBoo = durTimNum > 0;                                         // What: Order Valid Boolean. Why: An event ends after it starts. How: This checks its duration is positive.
	const staNeaBoo = eveInpObj.staTimNum <= Date.now() + 365 * DAY_MIL_NUM; // What: Start Near Boolean. Why: An event starts at most a year ahead, so nothing is kept for years. How: This checks its start.

	const timValBoo = endFutBoo && lenValBoo && ordValBoo && staNeaBoo; // What: Time Valid Boolean. Why: Every time check has to pass. How: This combines them.


	if ( !timValBoo ) throw new RangeError( "The event's times are outside their limits." ); // What: Time Guard. Why: The rules would refuse them. How: This rejects first.



	const detEncObj = await encTexFun( await keyLoaFun( groIdeStr ), JSON.stringify( { d : desNorStr, l : locNorStr, t : titNorStr } ) ); // What: Details Encrypted Object. Why: The three are encrypted together, so Firebase can't tell which are filled in (Section 11.5). How: This encrypts them as one JSON bundle under the group key.



	return { // What: Fields Return. Why: The caller writes these. How: This returns the bundle, its IV, and the times.


		detailsEnc : Bytes.fromUint8Array( detEncObj.cipTexArr ),                   // What: Details Encrypted. Why: The bundle is stored as bytes. How: This wraps it.
		endAt      : Timestamp.fromMillis( eveInpObj.endTimNum ),                   // What: End At. Why: The deletion time follows the end. How: This stores the end.
		expireAt   : Timestamp.fromMillis( eveInpObj.endTimNum + 2 * DAY_MIL_NUM ), // What: Expire At. Why: An event is deleted 48 hours after it ends (Section 5). How: This sets the TTL field to exactly that.
		iv         : Bytes.fromUint8Array( detEncObj.iniVecArr ),                   // What: IV. Why: The bundle decrypts with its IV. How: This wraps it.
		startAt    : Timestamp.fromMillis( eveInpObj.staTimNum )                    // What: Start At. Why: Events are listed by when they start. How: This stores the start.


	};


};

// #endregion eveFieFun



// #region eveCreFun

/**
 * eveCreFun = Event Create Function
 *
 * @summary
 * Plans an event in a group as this identity, named as its creator, and
 * resolves with the event's ID. Rejects with a RangeError for text or times
 * outside their limits, before anything is written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveInpObj - Event Input Object: The event's details, as typed.
 *
 * @returns A promise that resolves with the new event's ID.
 *
 * @example
 * ```ts
 * eveCreFun('Xk3...', { titTexStr : 'Picnic', ... }) // => 'Ev7...'
 * ```
 *
*/

const eveCreFun = async ( groIdeStr : string, eveInpObj : EveInpTyp ) : Promise< string > => { // What: Event Create Function. Why: Any member plans an event (Section 11.5). How: This builds the fields and writes the event under a new ID.


	const eveFieObj = await eveFieFun( groIdeStr, eveInpObj ); // What: Event Fields Object. Why: The event is written checked and encrypted. How: This builds its fields.

	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The event names its creator. How: This reads the identity.

	const eveRefObj = doc( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/events` ) ); // What: Event Reference Object. Why: An event takes Firestore's own random ID. How: This draws one.


	await setDoc( eveRefObj, { ...eveFieObj, createdByUid : uidValStr } ); // What: Event Set Call. Why: The event is planned. How: This writes its fields and creator.



	return eveRefObj.id; // What: Event Return. Why: The app opens the new event. How: This returns its ID.


};

// #endregion eveCreFun



// #region eveDelFun

/**
 * eveDelFun = Event Delete Function
 *
 * @summary
 * Cancels an event as its creator or the group's owner, deleting it and
 * every item on its bring-list in one batch, so nothing waits on a TTL.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 *
 * @returns A promise that settles once the event is gone, with no value.
 *
 * @example
 * ```ts
 * eveDelFun('Xk3...', 'Ev7...') // => Promise<void>
 * ```
 *
*/

const eveDelFun = async ( groIdeStr : string, eveIdeStr : string ) : Promise< void > => { // What: Event Delete Function. Why: The creator or owner cancels an event (Section 11.5). How: This deletes the event and its items together.


	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The cancellation writes Firestore. How: This reads the service.

	const iteSnaObj = await getDocs( collection( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments` ) ); // What: Items Snapshot Object. Why: The items go with the event. How: This reads them.
	const batWriObj = writeBatch( fstDatObj );                                                                             // What: Batch Write Object. Why: The event and its items go together. How: This starts the batch.


	iteSnaObj.docs.forEach( ( iteDocObj ) => batWriObj.delete( iteDocObj.ref ) ); // What: Item Delete Calls. Why: An event's items have no use without it. How: This deletes each one.

	batWriObj.delete( doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` ) ); // What: Event Delete Call. Why: The event is cancelled. How: This deletes it.

	await batWriObj.commit(); // What: Batch Commit Call. Why: Everything goes at once or nothing does. How: This commits the batch.


};

// #endregion eveDelFun



type EveRecTyp = EveInpTyp & { creUidStr : string, eveIdeStr : string }; // What: Event Record Type. Why: The event list shows each event's details and who planned it. How: This types one event as eveLisFun lists it.

// #region eveLisFun

/**
 * eveLisFun = Event List Function
 *
 * @summary
 * Resolves with a group's events, soonest first, each with its details
 * decrypted under the group key. An event past its deletion time is left
 * out, since its TTL deletion can run a day late. Details are untrusted, as
 * any member could have written them, so a bundle that won't decrypt or
 * parse, or a part that isn't text, comes back empty.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the events.
 *
 * @example
 * ```ts
 * eveLisFun('Xk3...') // => [ { titTexStr : 'Picnic', ... } ]
 * ```
 *
*/

const eveLisFun = async ( groIdeStr : string ) : Promise< EveRecTyp[] > => { // What: Event List Function. Why: Members see what's planned. How: This reads the events and decrypts each one's details.


	const groKeyObj = await keyLoaFun( groIdeStr );                                                                                   // What: Group Key Object. Why: The details open with the group key. How: This loads it.
	const eveSnaObj = await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/events` ) );                           // What: Events Snapshot Object. Why: Every event is in the group's collection. How: This reads it.
	const eveDocArr = eveSnaObj.docs.filter( ( eveDocObj ) => ( eveDocObj.get( 'expireAt' ) as Timestamp ).toMillis() > Date.now() ); // What: Event Document Array. Why: An event past its deletion time is over. How: This keeps the rest. // What: Type Assertion Note. Why: The rules store the time as a timestamp. How: The as reads it as one.


	const eveRecArr = await Promise.all( eveDocArr.map( async ( eveDocObj ) : Promise< EveRecTyp > => { // What: Event Record Array. Why: The list shows each event. How: This reads each one into a record, decrypting its details.


		const detTexStr = await decTexFun( groKeyObj, ( eveDocObj.get( 'detailsEnc' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >, ( eveDocObj.get( 'iv' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer > ).catch( () => '{}' ); // What: Details Text String. Why: The details are stored encrypted. How: This decrypts them, standing in an empty bundle when they won't decrypt. // What: Type Assertion Note. Why: The rules store both as bytes, and toUint8Array returns an array over a plain buffer. How: The as read them as such.
		const detRecObj = detParFun( detTexStr ); // What: Details Record Object. Why: The parts are read by key. How: This parses the bundle, standing in an empty record when it isn't a JSON object.



		return { // What: Record Return. Why: Each event becomes one record. How: This returns its fields.


			creUidStr : eveDocObj.get( 'createdByUid' ) as string,              // What: Creator UID String. Why: The creator can change the event. How: This reads who planned it. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
			desTexStr : typeof detRecObj.d === 'string' ? detRecObj.d : '',     // What: Description Text String. Why: The description is shown as text. How: This reads it, empty when it isn't text.
			endTimNum : ( eveDocObj.get( 'endAt' ) as Timestamp ).toMillis(),   // What: End Time Number. Why: The event shows when it ends. How: This reads it in milliseconds. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
			eveIdeStr : eveDocObj.id,                                           // What: Event Identifier String. Why: An event is opened and changed by ID. How: This reads it.
			locTexStr : typeof detRecObj.l === 'string' ? detRecObj.l : '',     // What: Location Text String. Why: The location is shown as text. How: This reads it, empty when it isn't text.
			staTimNum : ( eveDocObj.get( 'startAt' ) as Timestamp ).toMillis(), // What: Start Time Number. Why: Events are listed by when they start. How: This reads it in milliseconds. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
			titTexStr : typeof detRecObj.t === 'string' ? detRecObj.t : ''      // What: Title Text String. Why: The title names the event. How: This reads it, empty when it isn't text.


		};


	} ) );



	return eveRecArr.sort( ( recOneObj, recTwoObj ) => recOneObj.staTimNum - recTwoObj.staTimNum ); // What: Events Return. Why: The next event is listed first. How: This returns the records by start time.


};

// #endregion eveLisFun



// #region eveUpdFun

/**
 * eveUpdFun = Event Update Function
 *
 * @summary
 * Changes an event's details and times as its creator or the group's owner,
 * moving every item's deletion time with the event's in the same batch, as
 * the rules require. Rejects with a RangeError for text or times outside
 * their limits, before anything is written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param eveInpObj - Event Input Object: The event's new details, as typed.
 *
 * @returns A promise that settles once the change lands, with no value.
 *
 * @example
 * ```ts
 * eveUpdFun('Xk3...', 'Ev7...', { titTexStr, ... }) // => Promise<void>
 * ```
 *
*/

const eveUpdFun = async ( groIdeStr : string, eveIdeStr : string, eveInpObj : EveInpTyp ) : Promise< void > => { // What: Event Update Function. Why: The creator or owner changes an event (Section 11.5). How: This writes the new fields and moves the items' deletion time with them.


	const eveFieObj = await eveFieFun( groIdeStr, eveInpObj ); // What: Event Fields Object. Why: The change is written checked and encrypted. How: This builds the fields.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The change writes Firestore. How: This reads the service.

	const iteSnaObj = await getDocs( collection( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments` ) ); // What: Items Snapshot Object. Why: Each item's deletion time follows the event's. How: This reads them.
	const batWriObj = writeBatch( fstDatObj );                                                                             // What: Batch Write Object. Why: The rules check each item against the event as the batch leaves it. How: This starts the batch.


	batWriObj.update( doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` ), eveFieObj ); // What: Event Update Call. Why: The event changes, keeping its creator. How: This writes the new fields.

	iteSnaObj.docs.forEach( ( iteDocObj ) => batWriObj.update( iteDocObj.ref, { expireAt : eveFieObj.expireAt } ) ); // What: Item Update Calls. Why: An item goes when its event does. How: This moves each one's deletion time to the event's.

	await batWriObj.commit(); // What: Batch Commit Call. Why: The event and its items change together. How: This commits the batch.


};

// #endregion eveUpdFun

// #endregion Helpers



// #region Exports

export { eveCreFun, eveDelFun, eveLisFun, type EveInpTyp, type EveRecTyp, eveUpdFun }; // What: Named Exports. Why: The event screens plan, list, change, and cancel events through these. How: This exports the functions and the event types.

// #endregion Exports


