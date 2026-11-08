


// #region Imports

import { chaBriFun } from './chat.ts'; // What: Chat Bring Function. Why: A burst of bring-list changes posts one chat line. How: This posts it.


import type { BriKinTyp } from '../core/chat-status.ts'; // What: Bring Kind Type. Why: A burst either adds to the list or claims from it. How: This types its kind.

// #endregion Imports



/**
 * bring-lines.ts = Bring-List Chat Lines
 *
 * @summary
 * Gathers a member's bring-list changes into chat lines (ARCHITECTURE.md
 * Section 11.5): the items they add to an event's list post one line, and
 * the items they claim another, each once nothing more has changed for 60
 * seconds, or as soon as they leave the list or switch away from the app.
 * An item removed, let go, or handed to someone else before its line posts
 * leaves the line, a claimed item leaves the line about adding it, since
 * bringing it says it's on the list, and a burst left with no items posts
 * nothing. The lines are quiet, so they push nobody.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type BurRecTyp = { eveIdeStr : string, groIdeStr : string, kinValStr : BriKinTyp, labMapObj : Map< string, string >, timNum : number, titTexStr : string }; // What: Burst Record Type. Why: A burst of changes to one event's list posts one line once it's done. How: This types its event, group, kind, its items' labels by ID in the order they came, its timer, and the event's title.

// #endregion Types



// #region Constants

const BUR_MIL_NUM = 60000; // What: Burst Milliseconds Number. Why: Changes made within a minute of each other are one burst. How: This is how long the line waits after the last change.

// #endregion Constants



// #region Module State

const BUR_MAP_OBJ = new Map< string, BurRecTyp >(); // What: Burst Map Object. Why: Each event's adds and claims wait on their own. How: This holds the open bursts by group, event, and kind.

// #endregion Module State



// #region Helpers

const burKeyFun = ( groIdeStr : string, eveIdeStr : string, kinValStr : BriKinTyp ) : string => `${ groIdeStr }/${ eveIdeStr }/${ kinValStr }`; // What: Burst Key Function. Why: A burst belongs to one event's list and one kind of change. How: This joins the three.



// #region burPosFun

/**
 * burPosFun = Burst Post Function
 *
 * @summary
 * Ends a burst: it forgets the burst and, when any item is left in it, posts
 * the chat line naming the event, the count, and the first three labels,
 * logging a post that fails rather than throwing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValStr - Key Value String: The burst's group, event, and kind.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * burPosFun('Xk3.../Ev7.../add') // => void
 * ```
 *
*/

const burPosFun = ( keyValStr : string ) : void => { // What: Burst Post Function. Why: A finished burst tells the group once. How: This forgets the burst and posts its line when it still holds an item.


	const burRecObj = BUR_MAP_OBJ.get( keyValStr ); // What: Burst Record Object. Why: The line names the burst's event and items. How: This reads the burst.


	if ( burRecObj === undefined ) return; // What: Gone Guard. Why: A burst already posted has nothing more to say. How: This returns.



	BUR_MAP_OBJ.delete( keyValStr ); // What: Burst Delete Call. Why: The next change starts a new burst. How: This forgets this one.

	window.clearTimeout( burRecObj.timNum ); // What: Timer Clear Call. Why: A burst posted early shouldn't post again. How: This stops its timer.


	if ( burRecObj.labMapObj.size > 0 ) chaBriFun( burRecObj.groIdeStr, burRecObj.kinValStr, burRecObj.eveIdeStr, burRecObj.titTexStr, [ ...burRecObj.labMapObj.values() ], burRecObj.labMapObj.size ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Line Post Call. Why: The group hears what was added or claimed, and a post that fails shouldn't break anything. How: This posts the line when an item is left, logging a failure.


};

// #endregion burPosFun



// #region briDroFun

/**
 * briDroFun = Bring Drop Function
 *
 * @summary
 * Takes an item out of the bursts waiting to post for its event, of one kind
 * or of both, as when it's removed or let go before its line posts. A burst
 * left empty stays until its time comes, and then posts nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The item's group.
 * @param eveIdeStr - Event Identifier String: The item's event.
 * @param iteIdeStr - Item Identifier String: The item's ID.
 * @param kinValStr - Kind Value String: The burst to take it from, or null
 *                    for both.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * briDroFun('Xk3...', 'Ev7...', 'It2...', null) // => void
 * ```
 *
*/

const briDroFun = ( groIdeStr : string, eveIdeStr : string, iteIdeStr : string, kinValStr : BriKinTyp | null ) : void => { // What: Bring Drop Function. Why: A line shouldn't name an item that's gone or no longer claimed. How: This deletes the item from the matching bursts.


	for ( const kinOneStr of [ 'add', 'cla' ] as const ) if ( kinValStr === null || kinValStr === kinOneStr ) BUR_MAP_OBJ.get( burKeyFun( groIdeStr, eveIdeStr, kinOneStr ) )?.labMapObj.delete( iteIdeStr ); // What: Kind Loop. Why: Either burst may hold the item. How: This deletes it from each kind asked for. // What: Type Assertion Note. Why: The burst key needs each kind's literal type. How: The as const keeps them.


};

// #endregion briDroFun



// #region briAddFun

/**
 * briAddFun = Bring Add Function
 *
 * @summary
 * Counts one landed change into its burst: an item added to the list, or one
 * claimed by the member, kept under its ID with its label, a later label
 * replacing an earlier one. A claim also takes the item out of the burst
 * about adding it. The burst then waits another 60 seconds before it posts.
 * An item with an empty label, one that won't decrypt, is left out.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param kinValStr - Kind Value String: Whether the item was added or
 *                    claimed.
 * @param groIdeStr - Group Identifier String: The item's group.
 * @param eveIdeStr - Event Identifier String: The item's event.
 * @param titTexStr - Title Text String: The event's title, which the line
 *                    names.
 * @param iteIdeStr - Item Identifier String: The item's ID.
 * @param labTexStr - Label Text String: The item's label, tidied.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * briAddFun('add', 'Xk3...', 'Ev7...', 'Picnic', 'It2...', 'Chips') // => void
 * ```
 *
*/

const briAddFun = ( kinValStr : BriKinTyp, groIdeStr : string, eveIdeStr : string, titTexStr : string, iteIdeStr : string, labTexStr : string ) : void => { // What: Bring Add Function. Why: Changes made close together post one line. How: This adds the item to its burst and restarts the burst's wait.


	if ( labTexStr === '' ) return; // What: Unreadable Guard. Why: An item whose label won't decrypt can't be named in a line. How: This returns.



	const keyValStr = burKeyFun( groIdeStr, eveIdeStr, kinValStr );                                                                                   // What: Key Value String. Why: The burst is found by its event and kind. How: This builds its key.
	const burRecObj = BUR_MAP_OBJ.get( keyValStr ) ?? { eveIdeStr, groIdeStr, kinValStr, labMapObj : new Map< string, string >(), timNum : 0, titTexStr }; // What: Burst Record Object. Why: The first change of a burst starts it. How: This reads the open burst, or makes a new one.


	if ( kinValStr === 'cla' ) briDroFun( groIdeStr, eveIdeStr, iteIdeStr, 'add' ); // What: Added Drop Call. Why: Saying the member is bringing an item already says it's on the list. How: This takes a claimed item out of the burst about adding.



	burRecObj.labMapObj.set( iteIdeStr, labTexStr ); // What: Label Set Call. Why: The line names the item. How: This keeps its label under its ID.

	window.clearTimeout( burRecObj.timNum ); // What: Timer Clear Call. Why: Another change extends the burst. How: This stops the waiting timer.


	burRecObj.titTexStr = titTexStr; // What: Title Assignment. Why: The line names the event as it now stands. How: This keeps the latest title.

	burRecObj.timNum = window.setTimeout( () => burPosFun( keyValStr ), BUR_MIL_NUM ); // What: Wait Timer Assignment. Why: More changes may follow within the minute. How: This posts once the wait passes without another change.


	BUR_MAP_OBJ.set( keyValStr, burRecObj ); // What: Burst Keep Call. Why: A new burst has to be found by the next change. How: This keeps it under its key.


};

// #endregion briAddFun



// #region briFluFun

/**
 * briFluFun = Bring Flush Function
 *
 * @summary
 * Ends every open burst now, as when the member leaves the bring-list or
 * switches away from the app, each posting its line when it holds an item.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * briFluFun() // => void
 * ```
 *
*/

const briFluFun = () : void => { for ( const keyValStr of [ ...BUR_MAP_OBJ.keys() ] ) burPosFun( keyValStr ); }; // What: Bring Flush Function. Why: Leaving the list means the member is done for now. How: This posts every open burst, from a copy of the keys since each post deletes its own.

// #endregion briFluFun

// #endregion Helpers



// #region Module Init

document.addEventListener( 'visibilitychange', () => { if ( document.visibilityState === 'hidden' ) briFluFun(); } ); // What: Hidden Flush Listener. Why: A member who switches away from the app is done changing the list for now. How: This ends every open burst when the page is hidden.

// #endregion Module Init



// #region Exports

export { briAddFun, briDroFun, briFluFun }; // What: Named Exports. Why: The bring-list counts each landed change into a line, takes back what's undone, and ends the bursts as the member leaves. How: This exports the three functions.

// #endregion Exports


