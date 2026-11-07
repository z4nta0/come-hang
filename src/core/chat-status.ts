


// #region Imports

import { eveTitFun } from './text-limits.ts'; // What: Event Title Function. Why: A photos post's title is checked before it's shown. How: This applies the title's limits.
import { texNorFun } from './text-limits.ts'; // What: Text Normalize Function. Why: A photos post's title has to arrive already tidy. How: This tidies it for the comparison.

// #endregion Imports



/**
 * chat-status.ts = Chat Status Lines
 *
 * @summary
 * The form of a status post (ARCHITECTURE.md Sections 10, 11.7, and 20): a
 * chat message saying its sender is on their way, has arrived, or has just
 * shared photos for an event, encrypted like any other message, so Firebase
 * can't tell them apart. Its text is a control character followed by the
 * status's kind, and for photos a second control character before each of
 * its details, the event's ID and its title as it stood. A typed message
 * can't hold a control character, since the chat refuses them, so a status
 * post is never mistaken for one, and one sent by a member is only ever a
 * status line under their own name. A photos post whose details don't read
 * as an event's ID and a title within its limits reads as a status this
 * version can't show.
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

type StaKinTyp = 'arr' | 'way'; // What: Status Kind Type. Why: Sharing's status posts say their sender is on their way or has arrived, with nothing more. How: This types the two kinds, 'way' for leaving and 'arr' for arriving.

// #endregion Types



// #region Constants

const STA_PRE_STR = '\u0001'; // What: Status Prefix String. Why: A status post has to be told from a typed message, which can't hold a control character. How: This is the start-of-heading control character that opens every status post.
const STA_SEP_STR = '\u0002'; // What: Status Separator String. Why: A photos post carries details after its kind, which can't run into each other. How: This is the start-of-text control character that comes before each one.

// #endregion Constants



// #region Helpers

// #region staDetFun

/**
 * staDetFun = Status Details Function
 *
 * @summary
 * Reads a photos post's details: the event's ID and its title. Returns null
 * for any other text, or for a photos post whose ID isn't a document ID, or
 * whose title isn't already tidy and within its limits, since another member
 * wrote it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param texValStr - Text Value String: A message's decrypted text.
 *
 * @returns The event's ID and title, or null.
 *
 * @example
 * ```ts
 * staDetFun(phoTexStr) // => { eveIdeStr : 'Ev7', titTexStr : 'Picnic' }
 * ```
 *
*/

const staDetFun = ( texValStr : string ) : { eveIdeStr : string, titTexStr : string } | null => { // What: Status Details Function. Why: A photos line names its event and can open it. How: This splits and checks the post's details.


	const [ kinValStr, eveIdeStr, titTexStr, ...extValArr ] = texValStr.slice( STA_PRE_STR.length ).split( STA_SEP_STR ); // What: Kind Value String. Why: The kind leads. How: This reads it. // What: Event Identifier String. Why: The event comes first among the details. How: This reads it. // What: Title Text String. Why: The title comes next. How: This reads it. // What: Extra Value Array. Why: A post with more parts than it should isn't one this version wrote. How: This gathers any left over.

	const ideValBoo = eveIdeStr !== undefined && /^[A-Za-z0-9]{1,40}$/.test( eveIdeStr );                         // What: Identifier Valid Boolean. Why: The ID names a document the app opens. How: This allows only a Firestore-style ID.
	const kinPhoBoo = texValStr.startsWith( STA_PRE_STR ) && kinValStr === 'pho';                                 // What: Kind Photos Boolean. Why: Only a photos post has these details. How: This checks the prefix and the kind.
	const titValBoo = titTexStr !== undefined && texNorFun( titTexStr ) === titTexStr && eveTitFun( titTexStr ); // What: Title Valid Boolean. Why: The title shows as the event's name. How: This requires it tidy and within its limits.

	const detValBoo = ideValBoo && kinPhoBoo && titValBoo && extValArr.length === 0; // What: Details Valid Boolean. Why: Every part has to read right. How: This combines the checks.



	return detValBoo ? { eveIdeStr : eveIdeStr!, titTexStr : titTexStr! } : null; // What: Details Return. Why: Only well-formed details are shown. How: This returns them, or null. // What: Non-Null Note. Why: The checks just above require both to be present. How: The ! reads them as present.


};

// #endregion staDetFun



// #region staKinFun

/**
 * staKinFun = Status Kind Function
 *
 * @summary
 * Reads a message's text as a status post. Returns the post's kind, 'pho'
 * only for a photos post whose details read well, or 'unk' for a status post
 * of a kind this version doesn't know or can't show, which a later version
 * may send, or null for an ordinary message.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param texValStr - Text Value String: A message's decrypted text.
 *
 * @returns The status's kind, 'unk', or null.
 *
 * @example
 * ```ts
 * staKinFun('\u0001way') // => 'way'
 * ```
 *
*/

const staKinFun = ( texValStr : string ) : StaKinTyp | 'pho' | 'unk' | null => { // What: Status Kind Function. Why: The chat shows a status post as a line rather than a message. How: This reads its kind from the text.


	if ( !texValStr.startsWith( STA_PRE_STR ) ) return null; // What: Ordinary Guard. Why: A typed message is no status post. How: This returns null without the prefix.



	const kinValStr = texValStr.slice( STA_PRE_STR.length ); // What: Kind Value String. Why: The kind follows the prefix. How: This takes the rest of the text.



	if ( staDetFun( texValStr ) !== null ) return 'pho'; // What: Photos Guard. Why: A photos post carries details after its kind. How: This returns its kind when they read well.



	return kinValStr === 'arr' || kinValStr === 'way' ? kinValStr : 'unk'; // What: Kind Return. Why: A kind from a later version, or a photos post that doesn't read, still shows as a status. How: This returns a known kind, or 'unk'.


};

// #endregion staKinFun



const staPhoFun = ( eveIdeStr : string, titTexStr : string ) : string => STA_PRE_STR + 'pho' + STA_SEP_STR + eveIdeStr + STA_SEP_STR + titTexStr; // What: Status Photos Function. Why: A photos post is sent as an ordinary message's text, naming its event. How: This joins the prefix, the kind, and the event's ID and title, each after a separator.
const staTexFun = ( staKinStr : StaKinTyp ) : string => STA_PRE_STR + staKinStr; // What: Status Text Function. Why: A status post is sent as an ordinary message's text. How: This joins the prefix and the kind.

// #endregion Helpers



// #region Exports

export { staDetFun, staKinFun, type StaKinTyp, staPhoFun, staTexFun }; // What: Named Exports. Why: The chat sends and shows status posts through these. How: This exports the helpers and the kind's type.

// #endregion Exports


