


/**
 * chat-status.ts = Chat Status Lines
 *
 * @summary
 * The form of a status post (ARCHITECTURE.md Sections 10 and 11.7): a chat
 * message saying its sender is on their way or has arrived, encrypted like
 * any other message, so Firebase can't tell the two apart. Its text is a
 * control character followed by the status's kind. A typed message can't
 * hold a control character, since the chat refuses them, so a status post
 * is never mistaken for one, and one sent by a member is only ever a status
 * line under their own name.
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

type StaKinTyp = 'arr' | 'way'; // What: Status Kind Type. Why: A status post says its sender is on their way or has arrived. How: This types the two kinds, 'way' for leaving and 'arr' for arriving.

// #endregion Types



// #region Constants

const STA_PRE_STR = '\u0001'; // What: Status Prefix String. Why: A status post has to be told from a typed message, which can't hold a control character. How: This is the start-of-heading control character that opens every status post.

// #endregion Constants



// #region Helpers

const staTexFun = ( staKinStr : StaKinTyp ) : string => STA_PRE_STR + staKinStr; // What: Status Text Function. Why: A status post is sent as an ordinary message's text. How: This joins the prefix and the kind.



// #region staKinFun

/**
 * staKinFun = Status Kind Function
 *
 * @summary
 * Reads a message's text as a status post. Returns the post's kind, or
 * 'unk' for a status post of a kind this version doesn't know, which a later
 * version may send, or null for an ordinary message.
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

const staKinFun = ( texValStr : string ) : StaKinTyp | 'unk' | null => { // What: Status Kind Function. Why: The chat shows a status post as a line rather than a message. How: This reads its kind from the text.


	if ( !texValStr.startsWith( STA_PRE_STR ) ) return null; // What: Ordinary Guard. Why: A typed message is no status post. How: This returns null without the prefix.



	const kinValStr = texValStr.slice( STA_PRE_STR.length ); // What: Kind Value String. Why: The kind follows the prefix. How: This takes the rest of the text.



	return kinValStr === 'arr' || kinValStr === 'way' ? kinValStr : 'unk'; // What: Kind Return. Why: A kind from a later version still shows as a status. How: This returns a known kind, or 'unk'.


};

// #endregion staKinFun

// #endregion Helpers



// #region Exports

export { staKinFun, type StaKinTyp, staTexFun }; // What: Named Exports. Why: The chat sends and shows status posts through these. How: This exports the helpers and the kind's type.

// #endregion Exports


