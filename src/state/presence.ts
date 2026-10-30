


// #region Imports

import { firGetFun    } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Presence lives in the Realtime Database. How: This returns the services.
import { ideEnsFun    } from './identity.ts';           // What: Identity Ensure Function. Why: A member marks only themselves online. How: This reads the identity.
import { onDisconnect } from 'firebase/database';       // What: On Disconnect. Why: A device that drops off can't clear its own entry. How: This has the server clear it.
import { onValue      } from 'firebase/database';       // What: On Value. Why: Who's online is watched as it changes. How: This listens to the group's presence.
import { ref          } from 'firebase/database';       // What: Ref. Why: Each entry is named by path. How: This builds a reference.
import { remove       } from 'firebase/database';       // What: Remove. Why: Going offline clears the entry. How: This deletes it.
import { set          } from 'firebase/database';       // What: Set. Why: Coming online writes the entry. How: This writes it.

// #endregion Imports



/**
 * presence.ts = Presence
 *
 * @summary
 * Who's online in a group (ARCHITECTURE.md Section 11.8). A member marks
 * themselves online with an entry holding only online: true, which the
 * server clears by itself if the device drops off, and clears it themselves
 * on going offline. Any member watches which members are online. The rules
 * read the membership mirror, so a member who just joined may be refused
 * for the moment the mirror takes to catch up.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region preOnlFun

/**
 * preOnlFun = Presence Online Function
 *
 * @summary
 * Marks this identity online in a group, arranging for the server to clear
 * the entry if the connection drops, and resolves with the function that
 * goes offline, which cancels that arrangement and clears the entry.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the function that goes offline.
 *
 * @example
 * ```ts
 * preOnlFun('Xk3...') // => () => Promise<void>
 * ```
 *
*/

const preOnlFun = async ( groIdeStr : string ) : Promise< () => Promise< void > > => { // What: Presence Online Function. Why: Members see who's around (Section 11.8). How: This writes the entry with a server-side clear on disconnect.


	const preRefObj = ref( firGetFun().reaDatObj, `presence/${ groIdeStr }/${ ( await ideEnsFun() ).uidValStr }` ); // What: Presence Reference Object. Why: The entry is this member's own. How: This names it.
	const disHanObj = onDisconnect( preRefObj );                                                                    // What: Disconnect Handler Object. Why: The clear is arranged before the entry exists, so a drop never leaves it behind. How: This names the entry's disconnect handler.


	await disHanObj.remove(); // What: Disconnect Remove Call. Why: A dropped device shows offline. How: This has the server delete the entry when the connection drops.

	await set( preRefObj, { online : true } ); // What: Online Set Call. Why: The member is online. How: This writes the entry.



	return async () => { // What: Offline Return. Why: The app goes offline when the group closes. How: This returns the function that clears the entry.


		await disHanObj.cancel(); // What: Cancel Call. Why: The entry is cleared now, so the server needn't. How: This cancels the arranged clear.

		await remove( preRefObj ); // What: Offline Remove Call. Why: The member is offline. How: This deletes the entry.


	};


};

// #endregion preOnlFun



// #region preWatFun

/**
 * preWatFun = Presence Watch Function
 *
 * @summary
 * Watches who's online in a group, calling back with the online members'
 * UIDs each time that changes, and returns the function that stops
 * watching. An entry exists only while its member is online, since going
 * offline deletes it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param onPreFun - On Presence Function: Called with the online UIDs.
 *
 * @returns The function that stops watching.
 *
 * @example
 * ```ts
 * preWatFun('Xk3...', (uidValArr) => show(uidValArr)) // => () => void
 * ```
 *
*/

const preWatFun = ( groIdeStr : string, onPreFun : ( uidValArr : string[] ) => void ) : ( () => void ) => onValue( ref( firGetFun().reaDatObj, `presence/${ groIdeStr }` ), ( preSnaObj ) => onPreFun( Object.keys( preSnaObj.val() ?? {} ).sort() ) ); // What: Presence Watch Function. Why: Members see who's around as it changes. How: This listens to the group's entries and calls back with their UIDs, sorted, since an entry exists only while its member is online.

// #endregion preWatFun

// #endregion Helpers



// #region Exports

export { preOnlFun, preWatFun }; // What: Named Exports. Why: A group's screen goes online and shows who else is through these. How: This exports both.

// #endregion Exports


