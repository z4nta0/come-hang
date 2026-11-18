


// #region Imports

import { chpPruFun } from './chat-photos.ts'; // What: Chat-Photo Prune Function. Why: Photos past the member's choice are cleared from the device. How: This deletes the ones sent before a time.

// #endregion Imports



/**
 * photo-keep.ts = Photo Keep
 *
 * @summary
 * How long this device keeps the photos sent in its groups' chats
 * (ARCHITECTURE.md Section 22): 3 months by default, since most chat photos
 * are shared in passing, or 6 months, 1 year, or always, chosen in Settings
 * and kept in local storage. The choice is applied as the app opens, clearing
 * the older photos, and whenever it changes.
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

type PhoKepTyp = 'all' | 'm03' | 'm06' | 'y01'; // What: Photo Keep Type. Why: A device keeps chat photos for one of a few spans. How: This names them, all meaning always.

// #endregion Types



// #region Constants

const DAY_MIL_NUM = 86400000;                    // What: Day Milliseconds Number. Why: Each span is counted in days. How: This is one day in milliseconds.
const KEP_STO_STR = 'come-hang-chat-photo-keep'; // What: Keep Storage String. Why: The choice has to survive a reload. How: This is the local storage key it's kept under.



/**
 * KEP_OPT_ARR = Keep Options Array
 *
 * @summary
 * The spans a device can keep chat photos for, in the order Settings offers
 * them, shortest first, always last.
 *
 *  - `dayNum` (number): How many days a photo is kept, 0 for always.
 *
 *  - `keyStr` (PhoKepTyp): The span's key, kept in local storage.
 *
 *  - `labStr` (string): The span as Settings and the photo viewer name it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const KEP_OPT_ARR : { dayNum : number, keyStr : PhoKepTyp, labStr : string }[] = [ // What: Keep Options Array. Why: Settings lists the spans, and the prune counts each in days. How: This holds each span's days, key, and name.


	{ dayNum : 91,  keyStr : 'm03', labStr : '3 months' }, // What: Three Months Option.
	{ dayNum : 182, keyStr : 'm06', labStr : '6 months' }, // What: Six Months Option.
	{ dayNum : 365, keyStr : 'y01', labStr : '1 year'   }, // What: One Year Option.
	{ dayNum : 0,   keyStr : 'all', labStr : 'Always'   }  // What: Always Option.


];

// #endregion Constants



// #region Helpers

// #region kepGetFun

/**
 * kepGetFun = Keep Get Function
 *
 * @summary
 * Reads how long this device keeps chat photos, 3 months when nothing is
 * kept, the kept value isn't a span, or storage is blocked.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The kept span, or m03.
 *
 * @example
 * ```ts
 * kepGetFun() // => 'm03'
 * ```
 *
*/

const kepGetFun = () : PhoKepTyp => { // What: Keep Get Function. Why: Settings shows the choice, and the prune and the viewer follow it. How: This reads the kept value.


	try { // What: Choice Read Attempt. Why: Storage can be blocked, such as with site data turned off. How: This reads the key and accepts only a span.


		const stoValStr = localStorage.getItem( KEP_STO_STR ); // What: Stored Value String. Why: The choice is kept under one key. How: This reads it, or null when none is kept.

		const kepOptObj = KEP_OPT_ARR.find( ( optValObj ) => optValObj.keyStr === stoValStr ); // What: Keep Option Object. Why: Only a real span is followed. How: This finds the kept one, undefined for anything else.


		if ( kepOptObj !== undefined ) return kepOptObj.keyStr; // What: Kept Choice Return. Why: The member's choice holds. How: This returns it.


	}

	catch { return 'm03'; } // What: Blocked Storage Fallback. Why: Without storage there's no kept choice. How: This keeps the default.



	return 'm03'; // What: Default Return. Why: Most chat photos are shared in passing, so a device keeps them 3 months unless its member chose otherwise (Section 22). How: This returns the default.


};

// #endregion kepGetFun



// #region kepPruFun

/**
 * kepPruFun = Keep Prune Function
 *
 * @summary
 * Clears from this device the chat photos older than its kept span, and
 * resolves with how many it cleared, none when it keeps them always.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the count of photos cleared.
 *
 * @example
 * ```ts
 * kepPruFun() // => 3
 * ```
 *
*/

const kepPruFun = async () : Promise< number > => { // What: Keep Prune Function. Why: A device keeps chat photos only as long as its member chose (Section 22). How: This clears the older ones.


	const dayValNum = KEP_OPT_ARR.find( ( optValObj ) => optValObj.keyStr === kepGetFun() )!.dayNum; // What: Day Value Number. Why: The span decides which photos go. How: This reads its days. // What: Non-Null Note. Why: kepGetFun returns only a key the options hold. How: The ! reads the option as found.



	return dayValNum === 0 ? 0 : chpPruFun( Date.now() - dayValNum * DAY_MIL_NUM ); // What: Prune Return. Why: Photos kept always are never cleared by age. How: This clears those sent before the span began, or none.


};

// #endregion kepPruFun



// #region kepSetFun

/**
 * kepSetFun = Keep Set Function
 *
 * @summary
 * Keeps how long this device keeps chat photos, then clears the photos older
 * than the new span, resolving with how many it cleared. With storage
 * blocked, the choice isn't kept, but the older photos still go.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param kepValStr - Keep Value String: The chosen span.
 *
 * @returns A promise that resolves with the count of photos cleared.
 *
 * @example
 * ```ts
 * kepSetFun('m06') // => 0
 * ```
 *
*/

const kepSetFun = async ( kepValStr : PhoKepTyp ) : Promise< number > => { // What: Keep Set Function. Why: A member chooses how long the device keeps chat photos. How: This keeps the choice and applies it.


	try { localStorage.setItem( KEP_STO_STR, kepValStr ); } // What: Choice Write Attempt. Why: The choice should survive a reload. How: This keeps it under its key.

	catch ( errCatObj ) { console.warn( errCatObj ); } // What: Blocked Storage Catch. Why: The choice still applies now, and the failure should stay visible to someone debugging. How: This logs it.



	const dayValNum = KEP_OPT_ARR.find( ( optValObj ) => optValObj.keyStr === kepValStr )!.dayNum; // What: Day Value Number. Why: The new span decides which photos go. How: This reads its days. // What: Non-Null Note. Why: The type allows only a key the options hold. How: The ! reads the option as found.



	return dayValNum === 0 ? 0 : chpPruFun( Date.now() - dayValNum * DAY_MIL_NUM ); // What: Prune Return. Why: A shorter span clears what it no longer keeps, while always clears nothing. How: This clears those sent before the span began, or none.


};

// #endregion kepSetFun

// #endregion Helpers



// #region Exports

export { kepGetFun, KEP_OPT_ARR, kepPruFun, kepSetFun, type PhoKepTyp }; // What: Named Exports. Why: Settings offers and keeps the choice, the photo viewer names it, and the app applies it as it opens. How: This exports the options, the get, the prune, the set, and the span's type.

// #endregion Exports


