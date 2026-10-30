


/**
 * date.ts = Date Helpers
 *
 * @summary
 * Turns times in milliseconds into the short labels a screen shows, in the
 * visitor's own language and clock: a message's time, which grows a weekday
 * or a date as it gets older, and an event's date block and time range.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

const dayKeyFun = ( timValNum : number ) : string => new Date( timValNum ).toDateString(); // What: Day Key Function. Why: Two times on the same calendar day share a label's form. How: This names a time's local day.



// #region mesTimFun

/**
 * mesTimFun = Message Time Function
 *
 * @summary
 * Labels when a message was sent, relative to now: its time alone on the
 * same day, its weekday and time within the last six days, and otherwise
 * its date and time, with the year when it isn't this year's.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param sntTimNum - Sent Time Number: When the message was sent, in
 *                    milliseconds.
 * @param nowTimNum - Now Time Number: The current time, in milliseconds.
 *
 * @returns The label.
 *
 * @example
 * ```ts
 * mesTimFun(sntTimNum, Date.now()) // => '3:42 PM'
 * ```
 *
*/

const mesTimFun = ( sntTimNum : number, nowTimNum : number ) : string => { // What: Message Time Function. Why: A message's time reads best as briefly as it can while staying clear. How: This picks the label's form by the message's age.


	const sntDatObj = new Date( sntTimNum ); // What: Sent Date Object. Why: The label is formatted from it. How: This wraps the time.

	const samDayBoo = dayKeyFun( sntTimNum ) === dayKeyFun( nowTimNum );               // What: Same Day Boolean. Why: A message from today needs only its time. How: This compares the two local days.
	const weeAgoBoo = nowTimNum - sntTimNum < 6 * 86400000;                            // What: Week Ago Boolean. Why: A message from this past week reads best by its weekday. How: This is true within six days, 86,400,000 milliseconds each.
	const yeaSamBoo = sntDatObj.getFullYear() === new Date( nowTimNum ).getFullYear(); // What: Year Same Boolean. Why: A date from another year needs its year. How: This compares the two years.



	if ( samDayBoo ) return sntDatObj.toLocaleTimeString( undefined, { hour : 'numeric', minute : '2-digit' } ); // What: Same Day Return. Why: Today's messages show their time alone. How: This formats the hour and minute.



	if ( weeAgoBoo ) return sntDatObj.toLocaleString( undefined, { hour : 'numeric', minute : '2-digit', weekday : 'short' } ); // What: Weekday Return. Why: This past week's messages show their weekday. How: This formats the weekday, hour, and minute.



	return sntDatObj.toLocaleString( undefined, { day : 'numeric', hour : 'numeric', minute : '2-digit', month : 'short', year : yeaSamBoo ? undefined : 'numeric' } ); // What: Date Return. Why: Older messages show their date. How: This formats the month, day, and time, with the year when it differs.


};

// #endregion mesTimFun



// #region eveBloFun

/**
 * eveBloFun = Event Block Function
 *
 * @summary
 * Gives the two lines of an event's date block: "Today" and its start time
 * for an event starting today, and otherwise its month and its day of the
 * month.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param staTimNum - Start Time Number: When the event starts, in
 *                    milliseconds.
 * @param nowTimNum - Now Time Number: The current time, in milliseconds.
 *
 * @returns The block's small top line and large bottom line.
 *
 * @example
 * ```ts
 * eveBloFun(staTimNum, Date.now()) // => { botStr: '8', topStr: 'Nov' }
 * ```
 *
*/

const eveBloFun = ( staTimNum : number, nowTimNum : number ) : { botStr : string, topStr : string } => { // What: Event Block Function. Why: The pinned event leads with when it is. How: This picks the block's lines by whether it starts today.


	const staDatObj = new Date( staTimNum ); // What: Start Date Object. Why: The lines are formatted from it. How: This wraps the time.


	if ( dayKeyFun( staTimNum ) === dayKeyFun( nowTimNum ) ) return { botStr : staDatObj.toLocaleTimeString( undefined, { hour : 'numeric' } ), topStr : 'Today' }; // What: Today Return. Why: On the day itself, the time matters more than the date. How: This returns "Today" over the start hour.



	return { botStr : String( staDatObj.getDate() ), topStr : staDatObj.toLocaleString( undefined, { month : 'short' } ) }; // What: Date Return. Why: A later event shows its date. How: This returns the month over the day of the month.


};

// #endregion eveBloFun



const eveDatFun = ( staTimNum : number, endTimNum : number ) : string => new Intl.DateTimeFormat( undefined, { day : 'numeric', hour : 'numeric', minute : '2-digit', month : 'long', weekday : 'long' } ).formatRange( staTimNum, endTimNum ); // What: Event Date Function. Why: An event's details give its full date and hours. How: This formats the start and end as one range, with the weekday and month spelled out, repeating the date only when it changes.
const eveRanFun = ( staTimNum : number, endTimNum : number ) : string => new Intl.DateTimeFormat( undefined, { hour : 'numeric', minute : '2-digit', weekday : 'short' } ).formatRange( staTimNum, endTimNum );                                 // What: Event Range Function. Why: An event's line says the day and the hours it runs. How: This formats the start and end as one range, which repeats the day only when it changes.

// #endregion Helpers



// #region Exports

export { eveBloFun, eveDatFun, eveRanFun, mesTimFun }; // What: Named Exports. Why: The chat and the event details label messages and events with these. How: This exports the helpers.

// #endregion Exports


