


// #region Imports

import { Bytes           } from 'firebase/firestore';         // What: Bytes. Why: A position is stored as encrypted bytes. How: This wraps and reads them.
import { collection      } from 'firebase/firestore';         // What: Collection. Why: Every member's shared location is read together. How: This names the collection.
import { decTexFun       } from '../platform/crypto.ts';      // What: Decrypt Text Function. Why: A position is stored encrypted. How: This decrypts one.
import { deleteDoc       } from 'firebase/firestore';         // What: Delete Doc. Why: Stopping deletes the shared location at once. How: This deletes it.
import { doc             } from 'firebase/firestore';         // What: Doc. Why: A shared location and its event are named by path. How: This builds a reference.
import { encTexFun       } from '../platform/crypto.ts';      // What: Encrypt Text Function. Why: A position is shared encrypted. How: This encrypts it under the group key.
import { firGetFun       } from '../platform/firebase.ts';    // What: Firebase Get Function. Why: Shared locations live in Firestore. How: This returns the services.
import { getDoc          } from 'firebase/firestore';         // What: Get Doc. Why: The event's times bound a share. How: This reads the event.
import { getDocs         } from 'firebase/firestore';         // What: Get Docs. Why: Every shared location is listed. How: This reads the collection.
import { ideEnsFun       } from './identity.ts';              // What: Identity Ensure Function. Why: A member shares as themselves. How: This reads the identity.
import { jsoObjFun       } from '../utils/json.ts';           // What: JSON Object Function. Why: Another member wrote the content, so it may not be JSON. How: This parses it safely.
import { keyLoaFun       } from './groups.ts';                // What: Key Load Function. Why: Positions are encrypted with the group key. How: This loads it.
import { onSnapshot      } from 'firebase/firestore';         // What: On Snapshot. Why: Members watch each other's locations as they move. How: This listens to the collection.
import { posGetFun       } from '../platform/geolocation.ts'; // What: Position Get Function. Why: Opening the app and arriving send a fresh fix. How: This reads one.
import { posWatFun       } from '../platform/geolocation.ts'; // What: Position Watch Function. Why: A member with the app open shares as they move. How: This watches the position.
import { serverTimestamp } from 'firebase/firestore';         // What: Server Timestamp. Why: The staleness label uses the server's time. How: This asks the server to fill it in.
import { setDoc          } from 'firebase/firestore';         // What: Set Doc. Why: Each update overwrites the last. How: This writes the shared location.
import { Timestamp       } from 'firebase/firestore';         // What: Timestamp. Why: A share's times are timestamps. How: This builds and reads them.


import type { QueryDocumentSnapshot } from 'firebase/firestore'; // What: Query Document Snapshot. Why: The list and the watch decode shared locations the same way. How: This types one.

// #endregion Imports



/**
 * location.ts = Location
 *
 * @summary
 * Location sharing for an event (ARCHITECTURE.md Sections 5, 10, and 11.4).
 * A member shares their position, its accuracy, and whether they've arrived,
 * encrypted together under the group key, for one event, from 3 hours before
 * it starts until it ends. Each update overwrites the last and expires an
 * hour later or at the event's end, whichever is sooner, and stopping
 * deletes it at once. A sharing session sends a fix as it starts, as the
 * device moves while the app is open, whenever the app comes back into
 * view, and on arrival, throttled to an update every 2 minutes or every 100
 * meters, whichever comes first, and never more than every 15 seconds.
 * Members list or watch the shared locations, skipping any past its expiry
 * and any that won't decrypt or isn't a valid position.
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

type LocRecTyp = { accNum : number, arrBoo : boolean, eveIdeStr : string, latNum : number, lngNum : number, uidValStr : string, updTimNum : number }; // What: Location Record Type. Why: Members see where everyone sharing is, how precise, whether they've arrived, and how fresh. How: This types one shared location as the list and watch give it.
type PosInpTyp = { accNum : number, arrBoo : boolean, latNum : number, lngNum : number };                                                             // What: Position Input Type. Why: A share holds a position, its accuracy in meters, and the arrived flag. How: This types what locSetFun sends.

// #endregion Types



// #region Constants

const DIS_MET_NUM = 100;     // What: Distance Meters Number. Why: Moving this far is worth an update. How: This is 100 meters.
const HOU_MIL_NUM = 3600000; // What: Hour Milliseconds Number. Why: A share expires an hour after its update, and opens 3 hours before its event. How: This is one hour in milliseconds.
const MIN_GAP_NUM = 15000;   // What: Minimum Gap Number. Why: Updates never come faster than this, whatever the movement. How: This is 15 seconds.
const UPD_GAP_NUM = 120000;  // What: Update Gap Number. Why: A still member is refreshed this often. How: This is 2 minutes.

// #endregion Constants



// #region Helpers

// #region disMetFun

/**
 * disMetFun = Distance Meters Function
 *
 * @summary
 * Returns the distance between two positions in meters along the Earth's
 * surface, by the haversine formula on a sphere of the Earth's mean radius.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param posOneObj - Position One Object: The first position.
 * @param posTwoObj - Position Two Object: The second position.
 *
 * @returns The distance in meters.
 *
 * @example
 * ```ts
 * disMetFun({ latNum : 0, lngNum : 0 }, { latNum : 0, lngNum : 1 })
 * // => 111195
 * ```
 *
*/

const disMetFun = ( posOneObj : { latNum : number, lngNum : number }, posTwoObj : { latNum : number, lngNum : number } ) : number => { // What: Distance Meters Function. Why: An update is due once the member has moved far enough. How: This measures the distance between two fixes.


	const radValFun = ( degValNum : number ) : number => degValNum * Math.PI / 180; // What: Radian Value Function. Why: The formula works in radians. How: This converts degrees.
	const hafValNum = Math.sin( radValFun( posTwoObj.latNum - posOneObj.latNum ) / 2 ) ** 2 + Math.cos( radValFun( posOneObj.latNum ) ) * Math.cos( radValFun( posTwoObj.latNum ) ) * Math.sin( radValFun( posTwoObj.lngNum - posOneObj.lngNum ) / 2 ) ** 2; // What: Haversine Value Number. Why: The haversine of the central angle sets the distance. How: This combines the latitude and longitude differences.



	return 2 * 6371008.8 * Math.asin( Math.sqrt( hafValNum ) ); // What: Distance Return. Why: The caller compares it with the threshold. How: This returns the arc length on the Earth's mean radius in meters.


};

// #endregion disMetFun



// #region locDecFun

/**
 * locDecFun = Location Decode Function
 *
 * @summary
 * Decodes one shared location for display, or resolves with null for one
 * past its expiry, one that won't decrypt, or one whose content isn't a
 * valid position, since any member could have written it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groKeyObj - Group Key Object: The group's key.
 * @param locDocObj - Location Document Object: The shared location as read.
 *
 * @returns A promise that resolves with the record, or null.
 *
 * @example
 * ```ts
 * locDecFun(groKeyObj, locDocObj) // => { latNum : 51.5, ... }
 * ```
 *
*/

const locDecFun = async ( groKeyObj : CryptoKey, locDocObj : QueryDocumentSnapshot ) : Promise< LocRecTyp | null > => { // What: Location Decode Function. Why: The list and the watch read shared locations the same way. How: This checks the expiry, decrypts, and validates one.


	if ( ( locDocObj.get( 'expireAt' ) as Timestamp ).toMillis() <= Date.now() ) return null; // What: Expired Guard. Why: An expired share may linger until its TTL deletion runs, but it's over. How: This resolves null. // What: Type Assertion Note. Why: The rules store the expiry as a timestamp. How: The as reads it as one.



	const locTexStr = await decTexFun( groKeyObj, ( locDocObj.get( 'locationEnc' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >, ( locDocObj.get( 'iv' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer > ).catch( () => 'null' ); // What: Location Text String. Why: The position is stored encrypted. How: This decrypts it, standing in JSON null when it won't. // What: Type Assertion Note. Why: The rules store both as bytes, and toUint8Array returns an array over a plain buffer. How: The as read them as such.
	const locValObj = jsoObjFun( locTexStr ); // What: Location Value Object. Why: Another member wrote the content. How: This parses it, null when it isn't a JSON object.


	if ( locValObj === null ) return null; // What: Object Guard. Why: Only an object holds a position. How: This resolves null for anything else.



	const accValBoo = typeof locValObj.a === 'number' && locValObj.a >= 0;               // What: Accuracy Valid Boolean. Why: Accuracy is a distance in meters. How: This checks it's a number of zero or more.
	const arrValBoo = typeof locValObj.r === 'boolean';                                  // What: Arrived Valid Boolean. Why: The arrived flag is true or false. How: This checks it's a boolean.
	const latValBoo = typeof locValObj.x === 'number' && Math.abs( locValObj.x ) <= 90;  // What: Latitude Valid Boolean. Why: A latitude runs from -90 to 90. How: This checks its size, which refuses NaN and infinity too.
	const lngValBoo = typeof locValObj.y === 'number' && Math.abs( locValObj.y ) <= 180; // What: Longitude Valid Boolean. Why: A longitude runs from -180 to 180. How: This checks its size, which refuses NaN and infinity too.

	const posValBoo = accValBoo && arrValBoo && latValBoo && lngValBoo; // What: Position Valid Boolean. Why: Every part has to be valid. How: This combines them.


	if ( !posValBoo ) return null; // What: Position Guard. Why: An invalid position isn't shown. How: This resolves null.



	return { // What: Record Return. Why: The caller shows the location. How: This returns its fields.


		accNum    : locValObj.a as number,                                   // What: Accuracy Number. Why: A wide fix is shown as uncertain. How: This reads the accuracy in meters. // What: Type Assertion Note. Why: The check above proved it's a number. How: The as reads it as one.
		arrBoo    : locValObj.r as boolean,                                  // What: Arrived Boolean. Why: An arrived member gets a badge. How: This reads the flag. // What: Type Assertion Note. Why: The check above proved it's a boolean. How: The as reads it as one.
		eveIdeStr : locDocObj.get( 'eventId' ) as string,                    // What: Event Identifier String. Why: A share belongs to one event. How: This reads it. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
		latNum    : locValObj.x as number,                                   // What: Latitude Number. Why: The member is placed on the map. How: This reads the latitude. // What: Type Assertion Note. Why: The check above proved it's a number. How: The as reads it as one.
		lngNum    : locValObj.y as number,                                   // What: Longitude Number. Why: The member is placed on the map. How: This reads the longitude. // What: Type Assertion Note. Why: The check above proved it's a number. How: The as reads it as one.
		uidValStr : locDocObj.id,                                            // What: UID Value String. Why: The location is shown under its member. How: This reads the document's ID, the sharer's UID.
		updTimNum : ( locDocObj.get( 'updatedAt' ) as Timestamp ).toMillis() // What: Update Time Number. Why: Every location shows how old it is (Section 10). How: This reads the server's time of the update. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.


	};


};

// #endregion locDecFun



// #region locDueFun

/**
 * locDueFun = Location Due Function
 *
 * @summary
 * Says whether a new fix is due to be sent, by the throttle: never within 15
 * seconds of the last update, and otherwise once 2 minutes have passed or
 * the member has moved 100 meters. The first fix, with no last one, is due.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param lasPosObj - Last Position Object: The last fix sent, with its time,
 *                    or null before the first.
 * @param nowPosObj - Now Position Object: The new fix, with its time.
 *
 * @returns True when the new fix is due.
 *
 * @example
 * ```ts
 * locDueFun(null, { latNum : 0, lngNum : 0, timNum : 0 }) // => true
 * ```
 *
*/

const locDueFun = ( lasPosObj : { latNum : number, lngNum : number, timNum : number } | null, nowPosObj : { latNum : number, lngNum : number, timNum : number } ) : boolean => { // What: Location Due Function. Why: Updates are throttled by time and distance to save battery and data (Section 5). How: This compares the new fix with the last one sent.


	if ( lasPosObj === null ) return true; // What: First Fix Guard. Why: Nothing has been sent yet. How: This says the first fix is due.



	const gapTimNum = nowPosObj.timNum - lasPosObj.timNum; // What: Gap Time Number. Why: Both limits measure the time since the last update. How: This takes the difference.


	if ( gapTimNum < MIN_GAP_NUM ) return false; // What: Minimum Gap Guard. Why: Updates never come faster than every 15 seconds. How: This says a fix that soon isn't due.



	return gapTimNum >= UPD_GAP_NUM || disMetFun( lasPosObj, nowPosObj ) >= DIS_MET_NUM; // What: Due Return. Why: A fix is due after 2 minutes or 100 meters, whichever comes first. How: This checks both.


};

// #endregion locDueFun



// #region locLisFun

/**
 * locLisFun = Location List Function
 *
 * @summary
 * Resolves with a group's current shared locations, by UID, the order
 * Firestore returns documents in, skipping any past its expiry or not a
 * valid position.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the locations.
 *
 * @example
 * ```ts
 * locLisFun('Xk3...') // => [ { latNum : 51.5, ... } ]
 * ```
 *
*/

const locLisFun = async ( groIdeStr : string ) : Promise< LocRecTyp[] > => { // What: Location List Function. Why: Members see where everyone sharing is. How: This reads and decodes every shared location.


	const groKeyObj = await keyLoaFun( groIdeStr );                                                                  // What: Group Key Object. Why: Positions open with the group key. How: This loads it.
	const locSnaObj = await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/liveLocations` ) );   // What: Locations Snapshot Object. Why: Every share is in the group's collection. How: This reads it.
	const locRecArr = await Promise.all( locSnaObj.docs.map( ( locDocObj ) => locDecFun( groKeyObj, locDocObj ) ) ); // What: Location Record Array. Why: Each share is decoded. How: This decodes them, null for the ones skipped.



	return locRecArr.filter( ( locRecObj ) : locRecObj is LocRecTyp => locRecObj !== null ); // What: Locations Return. Why: The list shows each valid share. How: This drops the skipped ones, keeping Firestore's order by UID.


};

// #endregion locLisFun



// #region locSetFun

/**
 * locSetFun = Location Set Function
 *
 * @summary
 * Shares this identity's position for an event, overwriting any earlier
 * share: the position, rounded to 6 decimal places, about 0.1 meters, its
 * accuracy in whole meters, and the arrived flag, encrypted under the group
 * key, expiring an hour from now or at the event's end, whichever is
 * sooner. Rejects with a RangeError for a position that isn't valid, or
 * outside the sharing window, from 3 hours before the event starts until it
 * ends, and with an Error when the event is gone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event shared for.
 * @param posInpObj - Position Input Object: The position to share.
 *
 * @returns A promise that settles once the share is written, with no value.
 *
 * @example
 * ```ts
 * locSetFun('Xk3...', 'Ev7...', { latNum : 51.5, ... }) // => Promise<void>
 * ```
 *
*/

const locSetFun = async ( groIdeStr : string, eveIdeStr : string, posInpObj : PosInpTyp ) : Promise< void > => { // What: Location Set Function. Why: A member shares where they are for an event (Section 10). How: This checks, encrypts, and writes their share.


	const accValBoo = Number.isFinite( posInpObj.accNum ) && posInpObj.accNum >= 0; // What: Accuracy Valid Boolean. Why: Accuracy is a distance in meters. How: This checks it's a finite number of zero or more.
	const latValBoo = Math.abs( posInpObj.latNum ) <= 90;                           // What: Latitude Valid Boolean. Why: A latitude runs from -90 to 90. How: This checks it's a number, then its size.
	const lngValBoo = Math.abs( posInpObj.lngNum ) <= 180;                          // What: Longitude Valid Boolean. Why: A longitude runs from -180 to 180. How: This checks it's a number, then its size.

	const posValBoo = accValBoo && latValBoo && lngValBoo; // What: Position Valid Boolean. Why: Every part has to be valid. How: This combines them.


	if ( !posValBoo ) throw new RangeError( 'The position is not valid.' ); // What: Position Guard. Why: An invalid position isn't shared. How: This rejects first.



	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The share is written to Firestore. How: This reads the service.

	const eveSnaObj = await getDoc( doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` ) ); // What: Event Snapshot Object. Why: The event's times bound the share. How: This reads it.


	if ( !eveSnaObj.exists() ) throw new Error( 'The event is gone.' ); // What: Event Guard. Why: A cancelled event has nothing to share for. How: This rejects.



	const endTimNum = ( eveSnaObj.get( 'endAt' ) as Timestamp ).toMillis();   // What: End Time Number. Why: Sharing ends with the event, and so does the expiry. How: This reads its end. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
	const staTimNum = ( eveSnaObj.get( 'startAt' ) as Timestamp ).toMillis(); // What: Start Time Number. Why: Sharing opens 3 hours before the event. How: This reads its start. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.

	const nowTimNum = Date.now(); // What: Now Time Number. Why: The window and expiry are measured from now. How: This reads the clock.

	const opeWinBoo = nowTimNum >= staTimNum - 3 * HOU_MIL_NUM; // What: Open Window Boolean. Why: Sharing opens 3 hours before the event. How: This checks now is past that.
	const runWinBoo = nowTimNum < endTimNum;                    // What: Running Window Boolean. Why: Sharing ends with the event. How: This checks the event hasn't ended.

	const winValBoo = opeWinBoo && runWinBoo; // What: Window Valid Boolean. Why: Both bounds have to hold. How: This combines them.


	if ( !winValBoo ) throw new RangeError( 'Sharing is closed for this event.' ); // What: Window Guard. Why: The rules would refuse it. How: This rejects first.



	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: A share is the member's own. How: This reads the identity.

	const locJsoStr = JSON.stringify({ // What: Location JSON String. Why: The position, accuracy, and flag are encrypted together, and rounding keeps them well inside the rules' 128 bytes. How: This writes them as JSON with one-letter keys.


		a : Math.round( posInpObj.accNum ),             // What: Accuracy. Why: Whole meters are precise enough. How: This rounds it.
		r : posInpObj.arrBoo,                           // What: Arrived. Why: The badge shows who's there. How: This holds the flag.
		x : Math.round( posInpObj.latNum * 1e6 ) / 1e6, // What: Latitude. Why: Six decimal places is about 0.1 meters. How: This rounds it.
		y : Math.round( posInpObj.lngNum * 1e6 ) / 1e6  // What: Longitude. Why: Six decimal places is about 0.1 meters. How: This rounds it.


	});

	const locEncObj = await encTexFun( await keyLoaFun( groIdeStr ), locJsoStr ); // What: Location Encrypted Object. Why: Firebase never sees where anyone is. How: This encrypts the JSON under the group key.


	await setDoc( doc( fstDatObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ), { // What: Share Set Call. Why: Each update overwrites the last, so no history builds up (Section 5). How: This writes the share under the member's UID.


		eventId     : eveIdeStr,                                                              // What: Event ID. Why: The rules check the share against its event. How: This names it.
		expireAt    : Timestamp.fromMillis( Math.min( nowTimNum + HOU_MIL_NUM, endTimNum ) ), // What: Expire At. Why: A share goes an hour after its last update or at the event's end, whichever is sooner (Section 5). How: This sets the TTL field to the sooner.
		iv          : Bytes.fromUint8Array( locEncObj.iniVecArr ),                            // What: IV. Why: The position decrypts with it. How: This wraps it.
		locationEnc : Bytes.fromUint8Array( locEncObj.cipTexArr ),                            // What: Location Encrypted. Why: The position is stored encrypted. How: This wraps it.
		updatedAt   : serverTimestamp()                                                       // What: Updated At. Why: The staleness label uses the server's time. How: This asks the server to fill it in.


	} );


};

// #endregion locSetFun



// #region locStoFun

/**
 * locStoFun = Location Stop Function
 *
 * @summary
 * Stops sharing this identity's location in a group by deleting the share,
 * even after leaving the group, which the rules allow.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that settles once the share is gone, with no value.
 *
 * @example
 * ```ts
 * locStoFun('Xk3...') // => Promise<void>
 * ```
 *
*/

const locStoFun = async ( groIdeStr : string ) : Promise< void > => deleteDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/liveLocations/${ ( await ideEnsFun() ).uidValStr }` ) ); // What: Location Stop Function. Why: Stopping sharing deletes the location at once rather than waiting for its expiry (Section 11.4). How: This deletes the member's share.

// #endregion locStoFun



// #region locShaFun

/**
 * locShaFun = Location Share Function
 *
 * @summary
 * Starts a sharing session for an event: sends a fix at once, then sends
 * fixes as the device moves while the app is open and whenever the app
 * comes back into view, throttled by locDueFun, and resolves with two
 * functions. One marks the member arrived and sends a fresh fix at once,
 * the flag staying on for the rest of the session, and the other stops the
 * session and deletes the share. A send the rules refuse, as once the event
 * has ended, is skipped.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event shared for.
 *
 * @returns A promise that resolves with the arrive and stop functions.
 *
 * @example
 * ```ts
 * locShaFun('Xk3...', 'Ev7...') // => { arrFun, stoFun }
 * ```
 *
*/

const locShaFun = async ( groIdeStr : string, eveIdeStr : string ) : Promise< { arrFun : () => Promise< void >, stoFun : () => Promise< void > } > => { // What: Location Share Function. Why: A member shares while the app is open, on each return to it, and on arrival, since browsers can't track in the background (Section 10). How: This runs the watch, the visibility listener, and the arrival.


	let arrValBoo = false;                                                               // What: Arrived Value Boolean. Why: Once arrived, every later fix says so. How: This starts false.
	let lasPosObj : { latNum : number, lngNum : number, timNum : number } | null = null; // What: Last Position Object. Why: The throttle compares each fix with the last one sent. How: This starts empty.


	const senPosFun = async ( posValObj : GeolocationPosition, forBoo : boolean ) : Promise< void > => { // What: Send Position Function. Why: Every source of fixes sends them the same way. How: This throttles unless forced, then shares the fix.


		const nowPosObj = { // What: Now Position Object. Why: The throttle and the share read the fix. How: This takes its coordinates and the time.


			latNum : posValObj.coords.latitude,  // What: Latitude Number. Why: The share and the distance read it. How: This takes the fix's.
			lngNum : posValObj.coords.longitude, // What: Longitude Number. Why: The share and the distance read it. How: This takes the fix's.
			timNum : Date.now()                  // What: Time Number. Why: The throttle measures time since the last send. How: This reads the clock.


		};


		if ( !forBoo && !locDueFun( lasPosObj, nowPosObj ) ) return; // What: Throttle Guard. Why: Updates are throttled by time and distance. How: This skips a fix that isn't due, unless it's forced.



		lasPosObj = nowPosObj; // What: Last Position Assignment. Why: The next fix is compared with this one. How: This records it.

		await locSetFun( groIdeStr, eveIdeStr, { accNum : posValObj.coords.accuracy, arrBoo : arrValBoo, latNum : nowPosObj.latNum, lngNum : nowPosObj.lngNum } ).catch( () => undefined ); // What: Share Call. Why: The fix reaches the group. How: This shares it, skipping a send the rules refuse.


	};



	const visChaFun = () : void => { if ( document.visibilityState === 'visible' ) posGetFun().then( ( posValObj ) => senPosFun( posValObj, true ), () => undefined ); }; // What: Visibility Change Function. Why: Opening the app sends a fresh fix (Section 10). How: This sends one when the page comes into view, skipping a failed fix.


	await senPosFun( await posGetFun(), true ); // What: First Send Call. Why: The group sees the member as sharing starts. How: This sends a fix at once.



	const stoWatFun = posWatFun( ( posValObj ) => { void senPosFun( posValObj, false ); } ); // What: Stop Watch Function. Why: The watch is stopped with the session. How: This watches the position, sending due fixes.


	document.addEventListener( 'visibilitychange', visChaFun ); // What: Visibility Listen Call. Why: Coming back to the app sends a fresh fix. How: This listens for it.



	return { // What: Session Return. Why: The app marks arrival and stops sharing. How: This returns both functions.


		arrFun : async () => { // What: Arrive Function. Why: An "I've arrived" action sends a fix with the badge (Section 10). How: This sets the flag and sends at once.


			arrValBoo = true; // What: Arrived Assignment. Why: This and every later fix carry the badge. How: This sets the flag.

			await senPosFun( await posGetFun(), true ); // What: Arrival Send Call. Why: The group sees the arrival at once. How: This sends a fresh fix, forced past the throttle.


		},

		stoFun : async () => { // What: Stop Function. Why: Stopping ends the session and deletes the share. How: This stops the watch and listener, then deletes.


			stoWatFun(); // What: Watch Stop Call. Why: No more fixes are sent. How: This clears the watch.

			document.removeEventListener( 'visibilitychange', visChaFun ); // What: Visibility Unlisten Call. Why: Returning to the app no longer sends. How: This removes the listener.

			await locStoFun( groIdeStr ); // What: Share Delete Call. Why: The group stops seeing the member at once. How: This deletes the share.


		}


	};


};

// #endregion locShaFun



// #region locWatFun

/**
 * locWatFun = Location Watch Function
 *
 * @summary
 * Watches a group's shared locations, calling back with the current valid
 * ones, by UID, each time any changes, and resolves with the function that
 * stops watching.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param onLocFun - On Location Function: Called with the locations.
 *
 * @returns A promise that resolves with the function that stops watching.
 *
 * @example
 * ```ts
 * locWatFun('Xk3...', (locRecArr) => show(locRecArr)) // => () => void
 * ```
 *
*/

const locWatFun = async ( groIdeStr : string, onLocFun : ( locRecArr : LocRecTyp[] ) => void ) : Promise< () => void > => { // What: Location Watch Function. Why: Members see each other move as updates arrive. How: This listens to the collection and decodes each snapshot.


	const groKeyObj = await keyLoaFun( groIdeStr ); // What: Group Key Object. Why: Positions open with the group key. How: This loads it.



	return onSnapshot( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/liveLocations` ), ( locSnaObj ) => { // What: Watch Return. Why: The caller stops watching when the map closes. How: This listens and returns the unsubscribe.


		void Promise.all( locSnaObj.docs.map( ( locDocObj ) => locDecFun( groKeyObj, locDocObj ) ) ).then( ( locRecArr ) => onLocFun( locRecArr.filter( ( locRecObj ) : locRecObj is LocRecTyp => locRecObj !== null ) ) ); // What: Decode Call. Why: The caller gets valid shares only. How: This decodes each, drops the skipped, and calls back, keeping Firestore's order by UID.


	} );


};

// #endregion locWatFun

// #endregion Helpers



// #region Exports

export { locDueFun, locLisFun, type LocRecTyp, locSetFun, locShaFun, locStoFun, locWatFun, type PosInpTyp }; // What: Named Exports. Why: The event screen shares, lists, watches, and stops locations through these. How: This exports the functions and the record types.

// #endregion Exports


