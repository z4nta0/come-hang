


/**
 * invite-link.ts = Invite Link
 *
 * @summary
 * The form of an invite (ARCHITECTURE.md Section 9): the 22 base64url
 * characters of its token, and how a token is found in what someone pastes.
 * A paste may be the whole link, `/join/<token>` on any address, with or
 * without anything after it, or the bare token, and anything else holds no
 * token. A token's form is checked before it reaches a document path.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const TOK_FOR_REG = /^[A-Za-z0-9_-]{22}$/;                    // What: Token Form Regular Expression. Why: A token pasted from anywhere becomes part of a document path. How: This allows only the 22 base64url characters every token has.
const TOK_LIN_REG = /\/join\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/; // What: Token Link Regular Expression. Why: A pasted link holds its token after /join/. How: This captures the 22 characters there, ending at the link's end or a slash, query, or fragment.

// #endregion Constants



// #region Helpers

// #region invTokFun

/**
 * invTokFun = Invite Token Function
 *
 * @summary
 * Finds the invite token in pasted text: the text itself, trimmed, when it's
 * a bare token, or the token after `/join/` in a link. Returns null when the
 * text holds neither.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param texValStr - Text Value String: What was pasted.
 *
 * @returns The token, or null.
 *
 * @example
 * ```ts
 * invTokFun('https://comehang.app/join/q2...') // => 'q2...'
 * ```
 *
*/

const invTokFun = ( texValStr : string ) : string | null => { // What: Invite Token Function. Why: Someone joins by pasting the link they were sent. How: This reads the token out of it.


	const texTriStr = texValStr.trim(); // What: Text Trimmed String. Why: A paste often brings spaces or a line break with it. How: This drops them.



	if ( TOK_FOR_REG.test( texTriStr ) ) return texTriStr; // What: Bare Token Guard. Why: A token alone is enough. How: This returns it.



	return TOK_LIN_REG.exec( texTriStr )?.[ 1 ] ?? null; // What: Link Token Return. Why: Most pastes are the whole link. How: This returns the token after /join/, or null when there's none.


};

// #endregion invTokFun

// #endregion Helpers



// #region Exports

export { invTokFun, TOK_FOR_REG }; // What: Named Exports. Why: The paste screen reads a token from a link, and reading an invite checks a token's form. How: This exports the reader and the form.

// #endregion Exports


