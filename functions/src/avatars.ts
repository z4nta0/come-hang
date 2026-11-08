


// #region Imports

import { FUN_OPT_OBJ       } from './setup.ts';                      // What: Function Options Object. Why: Every function shares the deploy options. How: This spreads them into the trigger's.
import { onDocumentDeleted } from 'firebase-functions/v2/firestore'; // What: On Document Deleted. Why: A profile photo goes with its membership. How: This registers the delete trigger.
import { STO_ADM_OBJ       } from './setup.ts';                      // What: Storage Admin Object. Why: Profile photos live in Storage. How: This deletes one.

// #endregion Imports



/**
 * avatars.ts = Profile Photo Cleanup
 *
 * @summary
 * Deletes a member's profile photo from a group once their membership ends
 * (ARCHITECTURE.md Section 21), however it ended: they left, were removed,
 * deleted their data, or the group was deleted. Only the member writes their
 * photo, so nobody else can delete it once they're gone, which is why the
 * trigger does.
 *
 * Sections:
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Module Init

// #region avaFilFun

/**
 * avaFilFun = Avatar File Function
 *
 * @summary
 * A Firestore trigger on a membership's deletion, whatever deleted it. It
 * deletes the member's profile photo in that group from Storage, which is no
 * error when they never set one or it's already gone.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The delete event Firebase sends,
 *                    whose params name the group and the member.
 *
 * @returns A promise that settles once the file is gone, with no value.
 *
 * @example
 * ```ts
 * avaFilFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const avaFilFun = onDocumentDeleted( { ...FUN_OPT_OBJ, document : 'groups/{groIdeStr}/members/{uidValStr}' }, async ( eveValObj ) => { // What: Avatar File Function. Why: A profile photo mustn't outlive its membership. How: This deletes the file at the member's path.


	await STO_ADM_OBJ.bucket().file( `avatars/${ eveValObj.params.groIdeStr }/${ eveValObj.params.uidValStr }` ).delete( { ignoreNotFound : true } ); // What: File Delete Call. Why: The photo is filed under its group and member. How: This deletes it, if it's there.


} );

// #endregion avaFilFun

// #endregion Module Init



// #region Exports

export { avaFilFun }; // What: Named Export. Why: The entry deploys the trigger. How: This exports avaFilFun.

// #endregion Exports


