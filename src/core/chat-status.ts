


// #region Imports

import { eveTitFun } from './text-limits.ts'; // What: Event Title Function. Why: A photos or bring-list post's title is checked before it's shown. How: This applies the title's limits.
import { iteLabFun } from './text-limits.ts'; // What: Item Label Function. Why: A bring-list post's labels are checked before they're shown. How: This applies a label's limits.
import { texNorFun } from './text-limits.ts'; // What: Text Normalize Function. Why: A post's title and labels have to arrive already tidy. How: This tidies them for the comparison.

// #endregion Imports



/**
 * chat-status.ts = Chat Status Lines
 *
 * @summary
 * The form of a status post (ARCHITECTURE.md Sections 10, 11.5, 11.7, and
 * 20): a chat message saying its sender is on their way, has arrived, has
 * just shared photos for an event, or has added to or claimed from an
 * event's bring-list, encrypted like any other message, so Firebase can't
 * read it. Its text is a control character followed by the status's kind,
 * and for photos and the bring-list a second control character before each
 * of its details: the event's ID and its title as it stood, and for the
 * bring-list how many items, then the first one to three labels. A typed
 * message can't hold a control character, since the chat refuses them, so a
 * status post is never mistaken for one, and one sent by a member is only
 * ever a status line under their own name. A post whose details don't read
 * as an event's ID, a title, and labels within their limits reads as a
 * status this version can't show.
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

type BriKinTyp = 'add' | 'cla'; // What: Bring Kind Type. Why: A bring-list post either adds to the list or claims from it. How: This types the two kinds, 'add' for adding and 'cla' for claiming.

type BriDetTyp = { couNum : number, eveIdeStr : string, kinValStr : BriKinTyp, labArr : string[], titTexStr : string }; // What: Bring Details Type. Why: A bring-list line names who changed what, for which event, and how much. How: This types a post's kind, event, title, item count, and the labels it names.



type StaKinTyp = 'arr' | 'way'; // What: Status Kind Type. Why: Sharing's status posts say their sender is on their way or has arrived, with nothing more. How: This types the two kinds, 'way' for leaving and 'arr' for arriving.

// #endregion Types



// #region Constants

const STA_PRE_STR = '\u0001'; // What: Status Prefix String. Why: A status post has to be told from a typed message, which can't hold a control character. How: This is the start-of-heading control character that opens every status post.
const STA_SEP_STR = '\u0002'; // What: Status Separator String. Why: A photos or bring-list post carries details after its kind, which can't run into each other. How: This is the start-of-text control character that comes before each one.

// #endregion Constants



// #region Helpers

// #region briDetFun

/**
 * briDetFun = Bring Details Function
 *
 * @summary
 * Reads a bring-list post's details: its kind, the event's ID and title, how
 * many items it covers, and the labels it names, all of up to three items
 * and the first three of more. Returns null for any other text, or for a
 * bring-list post whose ID isn't a document ID, whose title or labels aren't
 * already tidy and within their limits, or whose count doesn't match its
 * labels, since another member wrote it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param texValStr - Text Value String: A message's decrypted text.
 *
 * @returns The post's details, or null.
 *
 * @example
 * ```ts
 * briDetFun(briTexStr) // => { couNum : 1, eveIdeStr : 'Ev7', ... }
 * ```
 *
*/

const briDetFun = ( texValStr : string ) : BriDetTyp | null => { // What: Bring Details Function. Why: A bring-list line names its event and items and can open the list. How: This splits and checks the post's details.


	const [ kinValStr, eveIdeStr, titTexStr, couTexStr, ...labValArr ] = texValStr.slice( STA_PRE_STR.length ).split( STA_SEP_STR ); // What: Kind Value String. Why: The kind leads. How: This reads it. // What: Event Identifier String. Why: The event comes first among the details. How: This reads it. // What: Title Text String. Why: The title comes next. How: This reads it. // What: Count Text String. Why: The count follows the title. How: This reads it. // What: Label Value Array. Why: The labels close the post. How: This gathers them.

	const couValNum = Number( couTexStr ); // What: Count Value Number. Why: The count decides how many labels the post holds. How: This reads it as a number, NaN when it isn't one.


	const couValBoo = couTexStr !== undefined && /^[1-9][0-9]{0,3}$/.test( couTexStr );                                   // What: Count Valid Boolean. Why: A post covers from 1 to 9,999 items. How: This allows only a whole number written plainly in that range.
	const ideValBoo = eveIdeStr !== undefined && /^[A-Za-z0-9]{1,40}$/.test( eveIdeStr );                                 // What: Identifier Valid Boolean. Why: The ID names a document the app opens. How: This allows only a Firestore-style ID.
	const kinBriBoo = texValStr.startsWith( STA_PRE_STR ) && ( kinValStr === 'add' || kinValStr === 'cla' );              // What: Kind Bring Boolean. Why: Only a bring-list post has these details. How: This checks the prefix and the kind.
	const labValBoo = labValArr.every( ( labValStr ) => texNorFun( labValStr ) === labValStr && iteLabFun( labValStr ) ); // What: Labels Valid Boolean. Why: Each label shows as an item's name. How: This requires every one tidy and within its limits.
	const titValBoo = titTexStr !== undefined && texNorFun( titTexStr ) === titTexStr && eveTitFun( titTexStr );         // What: Title Valid Boolean. Why: The title shows as the event's name. How: This requires it tidy and within its limits.

	const detValBoo = couValBoo && ideValBoo && kinBriBoo && labValBoo && titValBoo && labValArr.length === Math.min( couValNum, 3 ); // What: Details Valid Boolean. Why: Every part has to read right, with as many labels as the count calls for. How: This combines the checks.



	return detValBoo ? { couNum : couValNum, eveIdeStr : eveIdeStr!, kinValStr : kinValStr as BriKinTyp, labArr : labValArr, titTexStr : titTexStr! } : null; // What: Details Return. Why: Only well-formed details are shown. How: This returns them, or null. // What: Non-Null Note. Why: The checks just above require the ID and title to be present. How: The ! reads them as present. // What: Type Assertion Note. Why: The kind check above allows only the two kinds. How: The as reads it as one.


};

// #endregion briDetFun



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
 * only for a photos post and 'add' or 'cla' only for a bring-list post whose
 * details read well, or 'unk' for a status post
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

const staKinFun = ( texValStr : string ) : BriKinTyp | StaKinTyp | 'pho' | 'unk' | null => { // What: Status Kind Function. Why: The chat shows a status post as a line rather than a message. How: This reads its kind from the text.


	if ( !texValStr.startsWith( STA_PRE_STR ) ) return null; // What: Ordinary Guard. Why: A typed message is no status post. How: This returns null without the prefix.



	const kinValStr = texValStr.slice( STA_PRE_STR.length ); // What: Kind Value String. Why: The kind follows the prefix. How: This takes the rest of the text.



	if ( staDetFun( texValStr ) !== null ) return 'pho'; // What: Photos Guard. Why: A photos post carries details after its kind. How: This returns its kind when they read well.



	const briDetObj = briDetFun( texValStr ); // What: Bring Details Object. Why: A bring-list post carries details after its kind too. How: This reads them, null for any other text.


	if ( briDetObj !== null ) return briDetObj.kinValStr; // What: Bring Guard. Why: A bring-list post shows as its own line. How: This returns its kind when its details read well.



	return kinValStr === 'arr' || kinValStr === 'way' ? kinValStr : 'unk'; // What: Kind Return. Why: A kind from a later version, or a photos post that doesn't read, still shows as a status. How: This returns a known kind, or 'unk'.


};

// #endregion staKinFun



const briTexFun = ( kinValStr : BriKinTyp, eveIdeStr : string, titTexStr : string, labArr : string[], couNum : number ) : string => [ STA_PRE_STR + kinValStr, eveIdeStr, titTexStr, String( couNum ), ...labArr.slice( 0, 3 ) ].join( STA_SEP_STR ); // What: Bring Text Function. Why: A bring-list post is sent as an ordinary message's text, naming its event and items. How: This joins the prefix and kind, then the event's ID and title, the count, and the first three labels, each after a separator.
const staPhoFun = ( eveIdeStr : string, titTexStr : string ) : string => STA_PRE_STR + 'pho' + STA_SEP_STR + eveIdeStr + STA_SEP_STR + titTexStr; // What: Status Photos Function. Why: A photos post is sent as an ordinary message's text, naming its event. How: This joins the prefix, the kind, and the event's ID and title, each after a separator.
const staTexFun = ( staKinStr : StaKinTyp ) : string => STA_PRE_STR + staKinStr; // What: Status Text Function. Why: A status post is sent as an ordinary message's text. How: This joins the prefix and the kind.

// #endregion Helpers



// #region Exports

export { briDetFun, type BriDetTyp, type BriKinTyp, briTexFun, staDetFun, staKinFun, type StaKinTyp, staPhoFun, staTexFun }; // What: Named Exports. Why: The chat sends and shows status posts through these. How: This exports the helpers and the kinds' types.

// #endregion Exports


