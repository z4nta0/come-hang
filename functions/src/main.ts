


// #region Imports

import { delGroFun } from './group-deletion.ts'; // What: Delete Group Function. Why: The owner deletes a group through it. How: This is the callable.
import { mirGroFun } from './mirror.ts';         // What: Mirror Group Function. Why: The group's retention is mirrored for the chat rules. How: This is its trigger.
import { mirMemFun } from './mirror.ts';         // What: Mirror Member Function. Why: Membership is mirrored for the chat and presence rules. How: This is its trigger.

// #endregion Imports



/**
 * main.ts = Functions Entry
 *
 * @summary
 * The file Firebase loads to find the project's Cloud Functions, named by
 * package.json's main once compiled. Firebase deploys every function this file
 * exports, under the name it's exported as, so each function module's
 * triggers are gathered here.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



export { delGroFun, mirGroFun, mirMemFun }; // What: Named Exports. Why: Firebase deploys exactly what the entry exports. How: This exports the group deletion callable and the membership mirror's two triggers.


