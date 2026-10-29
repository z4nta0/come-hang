


// #region Imports

import { Bytes                     } from 'firebase/firestore';           // What: Bytes. Why: Seeded shares are stored as Firestore bytes. How: This wraps them.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Shares are seeded by path. How: This builds a reference.
import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: The tests read what the pages wrote. How: This reads past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when sharing behaved as it should. How: This asserts on what the pages and the emulator return.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read and seed past the rules. How: This connects to the emulator.
import { keyRawFun                 } from '../support/client.ts';         // What: Key Raw Function. Why: Seeded shares are encrypted with the group key. How: This exports a page's key.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: Each test starts from a group with an owner and a member. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: Each test needs a member apart from the owner's page. How: This declares tests with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Each step runs as one identity. How: This calls the app's functions in a page.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Shares no app would write are seeded. How: This writes them.
import { Timestamp                 } from 'firebase/firestore';           // What: Timestamp. Why: Seeded shares need their times, and expiries are read back. How: This builds and reads them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: Helpers run in either identity's page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read and seed goes through one. How: This types it.

// #endregion Imports



/**
 * location.spec.ts = Location Spec
 *
 * @summary
 * Checks location sharing in a real browser, in each engine, against the
 * Emulator Suite with the real security rules. The member's browser context
 * is granted geolocation and given a position, and the tests run the app's
 * own modules in each page: a sharing session that sends, arrives, and
 * stops while the owner lists and watches, the sharing window and expiry,
 * invalid positions, shares no app would write, and the update throttle.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const EVE_MOD_STR = '/src/state/events.ts';   // What: Events Module String. Why: A share belongs to an event. How: This names its path.
const HOU_MIL_NUM = 3600000;                  // What: Hour Milliseconds Number. Why: Event times and expiries are set in hours. How: This is one hour in milliseconds.
const LOC_MOD_STR = '/src/state/location.ts'; // What: Location Module String. Why: Sharing runs there. How: This names its path.

// #endregion Constants



// #region Module State

let locEnvObj : RulesTestEnvironment; // What: Location Environment Object. Why: Every read and seed reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const eveCreFun = async ( pagValObj : Page, groIdeStr : string, staOffNum : number, endOffNum : number ) : Promise< string > => await runPagFun( pagValObj, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : Date.now() + endOffNum, locTexStr : '', staTimNum : Date.now() + staOffNum, titTexStr : 'Picnic' } ) as string; // What: Event Create Function. Why: Sharing is bound by an event's times. How: This plans one in a page, starting and ending the given milliseconds from now. // What: Type Assertion Note. Why: eveCreFun resolves with the ID. How: The as reads it as a string.



const lisGetFun = ( pagValObj : Page ) : Promise< unknown > => pagValObj.evaluate( () => ( window as unknown as { locRecArr : unknown } ).locRecArr ); // What: List Get Function. Why: The watch keeps its latest list on the window. How: This reads it from the page. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.



const posSetFun = async ( pagValObj : Page, latNum : number, lngNum : number ) : Promise< void > => { // What: Position Set Function. Why: A member's device reports where it is. How: This grants geolocation to the page's context and sets its position.


	await pagValObj.context().grantPermissions( [ 'geolocation' ] ); // What: Permission Call. Why: Sharing needs the position. How: This grants it.

	await pagValObj.context().setGeolocation( { accuracy : 10.4, latitude : latNum, longitude : lngNum } ); // What: Position Call. Why: The device reports this fix. How: This sets it, 10.4 meters accurate, so the share's rounding shows.


};



// #region locSeeFun

/**
 * locSeeFun = Location Seed Function
 *
 * @summary
 * Writes a share with the rules off, its content encrypted in Node under a
 * group key a page reported, so a test can store content no app would write,
 * or an expiry already past.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param patValStr - Path Value String: The share's path.
 * @param keyRawStr - Key Raw String: The group key, as base64.
 * @param locTexStr - Location Text String: The content's plaintext.
 * @param expTimNum - Expire Time Number: The expiry, in milliseconds.
 *
 * @returns A promise that settles once the share is written, with no value.
 *
 * @example
 * ```ts
 * locSeeFun('groups/Xk3.../liveLocations/a', 'q2...', '{}', 1)
 * // => Promise<void>
 * ```
 *
*/

const locSeeFun = async ( patValStr : string, keyRawStr : string, locTexStr : string, expTimNum : number ) : Promise< void > => { // What: Location Seed Function. Why: Untrusted and expired shares can't be made through the app. How: This encrypts the content in Node and writes the share with the rules off.


	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( keyRawStr, 'base64' ), 'AES-GCM', false, [ 'encrypt' ] );           // What: Key Value Object. Why: The content is encrypted with the group's key. How: This imports it.
	const iniVecArr = crypto.getRandomValues( new Uint8Array( 12 ) );                                                                        // What: Initialization Vector Array. Why: Each encryption takes a fresh IV. How: This draws one.
	const cipTexBuf = await crypto.subtle.encrypt( { iv : iniVecArr, name : 'AES-GCM' }, keyValObj, new TextEncoder().encode( locTexStr ) ); // What: Cipher Text Buffer. Why: The content is stored encrypted. How: This encrypts it.



	await locEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Seed Call. Why: The rules check only what the app writes. How: This writes the share with them off.


		await setDoc( doc( cotAdmObj.firestore(), patValStr ), { // What: Share Set Call. Why: The seeded share. How: This writes every field a share has.


			eventId     : 'seed',
			expireAt    : Timestamp.fromMillis( expTimNum ),
			iv          : Bytes.fromUint8Array( iniVecArr ),
			locationEnc : Bytes.fromUint8Array( new Uint8Array( cipTexBuf ) ),
			updatedAt   : Timestamp.now()


		} );


	} );


};

// #endregion locSeeFun

// #endregion Helpers



// #region Module Init

pagTesObj.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	locEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read and seed reaches the emulator through it. How: This connects to Firestore, where the shares are.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The shares are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



pagTesObj.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await locEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



pagTesObj.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The owner's steps run in the test's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



pagTesObj( 'a member shares their event-day position, which the group sees and watches, then arrives and stops', async ( { page, secPagObj } ) => { // What: Sharing Test. Why: A member shares for an event, and the group sees it live, with arrival (Section 10). How: This starts a session as the member while the owner watches, then moves a little, moves far, arrives, and stops.


	const { groIdeStr, uidMemStr } = await memSetFun( locEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const eveIdeStr = await eveCreFun( page, groIdeStr, HOU_MIL_NUM, 3 * HOU_MIL_NUM ); // What: Event Identifier String. Why: The share is for an event starting in an hour. How: This plans it.


	await posSetFun( secPagObj, 51.50000004, -0.12 ); // What: Position Set Call. Why: The member's device is somewhere, more precisely than a share keeps. How: This places it.



	await page.evaluate( async ( groIdeStr ) => { // What: Watch Call. Why: The owner sees shares as they change. How: This watches in the owner's page, keeping the latest list on the window.


		const modPatStr = '/src/state/location.ts';                     // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the location module.
		const locModObj = await import( /* @vite-ignore */ modPatStr ); // What: Location Module Object. Why: The page runs the real module. How: This imports it.


		await locModObj.locWatFun( groIdeStr, ( locRecArr : unknown ) => { ( window as unknown as { locRecArr : unknown } ).locRecArr = locRecArr; } ); // What: Watch Start Call. Why: The list follows each change. How: This keeps each new list on the window. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.


	}, groIdeStr );

	await secPagObj.evaluate( async ( [ groIdeStr, eveIdeStr ] ) => { // What: Session Call. Why: The member starts sharing. How: This starts a session, keeping it on the window.


		const modPatStr = '/src/state/location.ts';                     // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the location module.
		const locModObj = await import( /* @vite-ignore */ modPatStr ); // What: Location Module Object. Why: The page runs the real module. How: This imports it.


		( window as unknown as { shaSesObj : unknown } ).shaSesObj = await locModObj.locShaFun( groIdeStr, eveIdeStr ); // What: Session Assignment. Why: Later calls arrive and stop. How: This keeps the session on the window. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.


	}, [ groIdeStr, eveIdeStr ] );


	const shaDatObj = await docReaFun( locEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidMemStr }` ); // What: Share Data Object. Why: The expiry is checked. How: This reads the member's share.

	const expGapNum = ( shaDatObj?.expireAt as Timestamp ).toMillis() - Date.now(); // What: Expire Gap Number. Why: A share expires an hour after its update. How: This measures how far off its expiry is. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.


	expect( expGapNum ).toBeGreaterThan( 0.9 * HOU_MIL_NUM ); // What: Expiry Near An Hour. Why: The share lasts an hour. How: This expects most of an hour left.
	expect( expGapNum ).toBeLessThanOrEqual( HOU_MIL_NUM );   // What: Expiry Within An Hour. Why: The share lasts no more than an hour. How: This expects no more than an hour left.
	expect( await runPagFun( page, LOC_MOD_STR, 'locLisFun', groIdeStr ) ).toMatchObject( [ { accNum : 10, arrBoo : false, eveIdeStr, latNum : 51.5, lngNum : -0.12, uidValStr : uidMemStr } ] ); // What: Share Listed. Why: The group sees the member's position, rounded to 6 decimal places and whole meters. How: This expects it decrypted and rounded.

	await expect.poll( () => lisGetFun( page ) ).toMatchObject( [ { latNum : 51.5, uidValStr : uidMemStr } ] ); // What: Share Watched. Why: The watch hears the share. How: This waits for it.

	await posSetFun( secPagObj, 51.50005, -0.12 ); // What: Short Move Call. Why: A move of a few meters isn't worth an update. How: This moves the device about 5.5 m.

	await secPagObj.waitForTimeout( 2000 ); // What: Settle Wait. Why: An update would have to arrive before the check. How: This gives the watch 2 seconds.

	expect( await lisGetFun( page ) ).toMatchObject( [ { latNum : 51.5 } ] ); // What: Throttled. Why: The short move sent nothing. How: This expects the first position still.

	await posSetFun( secPagObj, 51.51, -0.1 ); // What: Move Call. Why: The member reaches the event. How: This moves the device.

	await secPagObj.evaluate( () => ( window as unknown as { shaSesObj : { arrFun : () => Promise< void > } } ).shaSesObj.arrFun() ); // What: Arrive Call. Why: The member says they've arrived. How: This sends a fresh fix with the badge. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

	await expect.poll( () => lisGetFun( page ) ).toMatchObject( [ { arrBoo : true, latNum : 51.51, lngNum : -0.1 } ] ); // What: Arrival Watched. Why: The group sees the arrival and the new position. How: This waits for both.

	await secPagObj.evaluate( () => ( window as unknown as { shaSesObj : { stoFun : () => Promise< void > } } ).shaSesObj.stoFun() ); // What: Stop Call. Why: The member stops sharing. How: This ends the session. // What: Type Assertion Note. Why: The window has no such field in its type. How: The as reads it as one that does.

	await expect.poll( () => lisGetFun( page ) ).toEqual( [] ); // What: Stop Watched. Why: A stopped share disappears at once. How: This waits for the list to empty.


	expect( await docReaFun( locEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidMemStr }` ) ).toBeUndefined(); // What: Share Deleted. Why: Stopping deletes rather than waiting for the expiry. How: This expects no share.


} );



pagTesObj( 'sharing is refused outside its window or for a bad position, and expires with its event', async ( { page, secPagObj } ) => { // What: Limits Test. Why: Sharing runs only from 3 hours before an event until it ends, and only for a real position (Section 5). How: This shares for a far event, invalid positions, an ended event, and a missing one, then for one ending soon.


	const { groIdeStr, uidMemStr } = await memSetFun( locEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group with a member. How: This sets them up.

	const farIdeStr = await eveCreFun( page, groIdeStr, 4 * HOU_MIL_NUM, 5 * HOU_MIL_NUM ); // What: Far Identifier String. Why: Sharing opens only 3 hours ahead. How: This plans an event 4 hours off.
	const sooIdeStr = await eveCreFun( page, groIdeStr, -HOU_MIL_NUM, HOU_MIL_NUM / 2 );    // What: Soon Identifier String. Why: A share expires at the event's end when that's within the hour. How: This plans an event under way, ending in half an hour.



	await locEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Ended Seed Call. Why: The app can't plan an event that's over. How: This writes one that ended an hour ago, with the rules off.


		await setDoc( doc( cotAdmObj.firestore(), `groups/${ groIdeStr }/events/ended` ), { // What: Event Set Call. Why: The ended event. How: This writes its times, which is all sharing reads.


			endAt   : Timestamp.fromMillis( Date.now() - HOU_MIL_NUM ),
			startAt : Timestamp.fromMillis( Date.now() - 2 * HOU_MIL_NUM )


		} );


	} );



	const gooPosObj = { accNum : 5, arrBoo : false, latNum : 40, lngNum : -70 }; // What: Good Position Object. Why: Each try changes one part of a valid position. How: This holds one.


	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, farIdeStr, gooPosObj ) ).toBe( 'error:RangeError' );                       // What: Early Refused. Why: Sharing isn't open yet. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, sooIdeStr, { ...gooPosObj, latNum : 91 } ) ).toBe( 'error:RangeError' );   // What: Latitude Refused. Why: A latitude runs to 90. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, sooIdeStr, { ...gooPosObj, lngNum : -181 } ) ).toBe( 'error:RangeError' ); // What: Longitude Refused. Why: A longitude runs to 180. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, sooIdeStr, { ...gooPosObj, accNum : -1 } ) ).toBe( 'error:RangeError' );   // What: Accuracy Refused. Why: Accuracy is a distance. How: This expects a RangeError.
	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, 'ended', gooPosObj ) ).toBe( 'error:RangeError' );                         // What: Late Refused. Why: Sharing closes when the event ends. How: This expects a RangeError for an ended event.
	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, 'gone', gooPosObj ) ).toBe( 'error:Error' );                               // What: Missing Event Refused. Why: There's nothing to share for. How: This expects an Error.
	expect( await runPagFun( secPagObj, LOC_MOD_STR, 'locSetFun', groIdeStr, sooIdeStr, gooPosObj ) ).toBeUndefined();                                  // What: Soon Share. Why: Sharing is open during the event. How: This expects the share written.


	const eveDatObj = await docReaFun( locEnvObj, `groups/${ groIdeStr }/events/${ sooIdeStr }` );        // What: Event Data Object. Why: The expiry follows the event's end. How: This reads the event.
	const shaDatObj = await docReaFun( locEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidMemStr }` ); // What: Share Data Object. Why: Its expiry is checked. How: This reads the share.


	expect( ( shaDatObj?.expireAt as Timestamp ).toMillis() ).toBe( ( eveDatObj?.endAt as Timestamp ).toMillis() ); // What: Expires At End. Why: A share is deleted at its event's end, however recent. How: This expects the expiry at the end. // What: Type Assertion Note. Why: The rules store both as timestamps. How: The as reads them as such.


} );



pagTesObj( 'only valid, unexpired shares are listed, whatever another device wrote', async ( { page, secPagObj } ) => { // What: Untrusted Test. Why: Any member writes their own share, so the list checks each one (Section 11.11). How: This seeds shares with bad content and an expired one, then lists as the owner.


	const { groIdeStr } = await memSetFun( locEnvObj, page, secPagObj ); // What: Setup Values. Why: The test needs a group. How: This sets one up.

	const keyRawStr = await keyRawFun( page, groIdeStr );    // What: Key Raw String. Why: The seeds are encrypted with the group key. How: This exports the owner's key.
	const patBasStr = `groups/${ groIdeStr }/liveLocations`; // What: Path Base String. Why: Every seed is a share in the group. How: This names the collection.
	const expTimNum = Date.now() + HOU_MIL_NUM;              // What: Expire Time Number. Why: A live share's expiry. How: This is an hour from now.



	for ( const [ uidValStr, locTexStr, timNum ] of [ // What: Seed Loop. Why: Each seed tests one way a share can be bad. How: This writes them in turn.


		[ 'aaa', '{"a":5,"r":false,"x":1,"y":2}', expTimNum ],         // What: Good Seed. Why: A valid share is listed. How: This holds one.
		[ 'bbb', 'not json', expTimNum ],                              // What: Text Seed. Why: Content that isn't JSON is skipped. How: This holds plain text.
		[ 'ccc', '[1,2]', expTimNum ],                                 // What: Array Seed. Why: JSON that isn't an object is skipped. How: This holds an array.
		[ 'ddd', '{"a":5,"r":false,"x":200,"y":2}', expTimNum ],       // What: Latitude Seed. Why: A latitude past 90 is skipped. How: This holds 200.
		[ 'eee', '{"a":5,"r":false,"x":1,"y":"2"}', expTimNum ],       // What: Longitude Seed. Why: A longitude given as text is skipped. How: This holds a string.
		[ 'fff', '{"a":-5,"r":false,"x":1,"y":2}', expTimNum ],        // What: Accuracy Seed. Why: A negative accuracy is skipped. How: This holds -5.
		[ 'ggg', '{"a":5,"r":"yes","x":1,"y":2}', expTimNum ],         // What: Arrived Seed. Why: A flag that isn't a boolean is skipped. How: This holds a string.
		[ 'hhh', '{"a":5,"r":false,"x":1,"y":2}', Date.now() - 60000 ] // What: Expired Seed. Why: A share past its expiry is skipped. How: This expired a minute ago.


	] as const ) await locSeeFun( `${ patBasStr }/${ uidValStr }`, keyRawStr, locTexStr, timNum ); // What: Seed Call. Why: Each seed is written as a share. How: This encrypts and writes it under its UID. // What: Type Assertion Note. Why: A plain list would type every entry alike. How: The as const keeps each tuple's types.



	await locEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Garbled Seed Call. Why: Content that won't decrypt is skipped. How: This writes zeroed bytes with the rules off.


		await setDoc( doc( cotAdmObj.firestore(), `${ patBasStr }/iii` ), { // What: Share Set Call. Why: The garbled share. How: This writes every field a share has.


			eventId     : 'seed',
			expireAt    : Timestamp.fromMillis( expTimNum ),
			iv          : Bytes.fromUint8Array( new Uint8Array( 12 ) ),
			locationEnc : Bytes.fromUint8Array( new Uint8Array( 32 ) ),
			updatedAt   : Timestamp.now()


		} );


	} );


	expect( await runPagFun( page, LOC_MOD_STR, 'locLisFun', groIdeStr ) ).toMatchObject( [ { accNum : 5, arrBoo : false, latNum : 1, lngNum : 2, uidValStr : 'aaa' } ] ); // What: Good Share Alone. Why: Every other seed is skipped. How: This expects the good share only.


} );



pagTesObj( 'an update is due after 2 minutes or 100 meters, never within 15 seconds', async ( { page } ) => { // What: Throttle Test. Why: Updates are throttled by time and distance to save battery and data (Section 5). How: This asks the throttle about fixes at chosen times and distances.


	const thrResArr = await page.evaluate( async () => { // What: Throttle Result Array. Why: The throttle runs in the page. How: This asks it about each case.


		const modPatStr = '/src/state/location.ts';                     // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the location module.
		const locModObj = await import( /* @vite-ignore */ modPatStr ); // What: Location Module Object. Why: The page runs the real module. How: This imports it.
		const lasPosObj = { latNum : 0, lngNum : 0, timNum : 0 };       // What: Last Position Object. Why: Each case compares with this fix. How: This places it at the origin, at time zero.



		return [ // What: Results Return. Why: The test compares each answer. How: This returns them in order.


			locModObj.locDueFun( null, lasPosObj ),                                            // What: First Case. Why: The first fix is always due. How: This passes no last fix.
			locModObj.locDueFun( lasPosObj, { latNum : 0.01, lngNum : 0, timNum : 10000 } ),   // What: Too Soon Case. Why: Even a kilometer's move waits 15 seconds. How: This moves about 1.1 km after 10 seconds.
			locModObj.locDueFun( lasPosObj, { latNum : 0.0005, lngNum : 0, timNum : 20000 } ), // What: Short Move Case. Why: A small move isn't worth an update. How: This moves about 56 m after 20 seconds.
			locModObj.locDueFun( lasPosObj, { latNum : 0.001, lngNum : 0, timNum : 20000 } ),  // What: Long Move Case. Why: 100 meters is worth an update. How: This moves about 111 m after 20 seconds.
			locModObj.locDueFun( lasPosObj, { latNum : 0, lngNum : 0, timNum : 120000 } )      // What: Long Wait Case. Why: A still member is refreshed after 2 minutes. How: This stays put for 2 minutes.


		];


	} );

	expect( thrResArr ).toEqual( [ true, false, false, true, true ] ); // What: Throttle Answers. Why: Each case has one right answer. How: This expects them in order.


} );

// #endregion Module Init


