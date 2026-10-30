


// #region Imports

import { FIR_DAT_OBJ } from './setup.ts'; // What: Firestore Database Object. Why: The claim record lives in Firestore. How: This names its document.

// #endregion Imports



/**
 * claims.ts = Ownership Claims
 *
 * @summary
 * Names the server-only record of an inactive owner's group being offered
 * around (ARCHITECTURE.md Section 18): groups/{groupId}/ownerClaim/current,
 * holding who the claim offer went to (offeredUid), who has passed on it
 * (passedUids), and when everyone eligible had passed (exhaustedAt). No
 * rule matches it, so clients can neither read nor write it, and group
 * deletion removes it with the group's other collections.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

const claRefFun = ( groIdeStr : string ) => FIR_DAT_OBJ.doc( `groups/${ groIdeStr }/ownerClaim/current` ); // What: Claim Reference Function. Why: The daily run, the group change trigger, and the decline all read or write the record. How: This returns its document for a group.

// #endregion Helpers



// #region Exports

export { claRefFun }; // What: Named Export. Why: Every function that touches a claim finds its record this way. How: This exports the helper.

// #endregion Exports


