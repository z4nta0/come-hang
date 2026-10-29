


// #region Imports

import { chaPusFun } from './activity-pushes.ts'; // What: Chat Push Function. Why: Members away from a group learn its chat moved on. How: This is the message trigger.
import { cheCreFun } from './purchase.ts';        // What: Checkout Create Function. Why: Buying the upgrade starts from the app. How: This is the callable that opens a Polar checkout.
import { dayRunFun } from './daily-run.ts';       // What: Day Run Function. Why: Offers lapse and inactive owners' groups are offered on through it. How: This is the schedule.
import { decOffFun } from './offer-decline.ts';   // What: Decline Offer Function. Why: The member offered a group declines through it. How: This is the callable.
import { delGroFun } from './group-deletion.ts';  // What: Delete Group Function. Why: The owner deletes a group through it. How: This is the callable.
import { groChaFun } from './group-changes.ts';   // What: Group Change Function. Why: Removals and ended offers are reported to the people they affect. How: This is its trigger.
import { hisPusFun } from './activity-pushes.ts'; // What: History Push Function. Why: Members learn someone needs chat history. How: This is the history request trigger.
import { joiPusFun } from './activity-pushes.ts'; // What: Join Push Function. Why: Members learn someone is waiting to join. How: This is the join request trigger.
import { keyPusFun } from './activity-pushes.ts'; // What: Key Push Function. Why: Members learn someone on a new phone needs the group's key. How: This is the key request trigger.
import { mirGroFun } from './mirror.ts';          // What: Mirror Group Function. Why: The group's retention is mirrored for the chat rules. How: This is its trigger.
import { mirMemFun } from './mirror.ts';          // What: Mirror Member Function. Why: Membership is mirrored for the chat and presence rules. How: This is its trigger.
import { polWebFun } from './purchase.ts';        // What: Polar Webhook Function. Why: Paid status follows Polar's orders. How: This is the webhook Polar posts to.

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



export { chaPusFun, cheCreFun, dayRunFun, decOffFun, delGroFun, groChaFun, hisPusFun, joiPusFun, keyPusFun, mirGroFun, mirMemFun, polWebFun }; // What: Named Exports. Why: Firebase deploys exactly what the entry exports. How: This exports every callable and trigger.


