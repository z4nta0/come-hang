


// #region Imports

import { FIR_DAT_OBJ        } from './setup.ts';                   // What: Firestore Database Object. Why: Under the emulator the cutoff is recorded rather than made. How: This writes the record past the rules.
import { FUN_OPT_OBJ        } from './setup.ts';                   // What: Function Options Object. Why: Every function shares the deploy options. How: This spreads them into the trigger's.
import { onMessagePublished } from 'firebase-functions/v2/pubsub'; // What: On Message Published. Why: The budget announces its spending on a Pub/Sub topic. How: This registers the trigger on that topic.

// #endregion Imports



/**
 * billing-cutoff.ts = Billing Cutoff
 *
 * @summary
 * Unlinks the project's billing account once the month's spending passes its
 * budget (ARCHITECTURE.md Section 15), following Google's documented pattern
 * for disabling billing usage with notifications. The project's budget
 * publishes its spending to the billing-cutoff topic several times a day,
 * and this trigger compares the cost with the budget's own amount, so the
 * ceiling is set in the budget rather than in the code. Unlinking stops every
 * paid service in the project at once, an outage instead of a bill, until
 * billing is linked again by hand. Under the emulator, which can't reach
 * Cloud Billing, the cutoff is recorded in an emulatorBillingCutoffs
 * collection instead, where the tests read it.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const BIL_API_STR = 'https://cloudbilling.googleapis.com/v1/projects';                                            // What: Billing API String. Why: A project's billing link is read and changed there. How: This is Cloud Billing's projects address, before the project's ID.
const TOK_URL_STR = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token'; // What: Token URL String. Why: Cloud Billing needs the function's own credentials. How: This is the metadata server's address for the runtime service account's access token.

// #endregion Constants



// #region Helpers

// #region bilOffFun

/**
 * bilOffFun = Billing Off Function
 *
 * @summary
 * Unlinks a project's billing account through Cloud Billing, signed in as the
 * function's runtime service account, which needs permission to change the
 * project's billing. It reads the project's billing first and does nothing
 * when billing is already off, since the budget keeps publishing after a
 * cutoff. A refused request throws, with Cloud Billing's reply in the error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param prjIdeStr - Project Identifier String: The project to cut off.
 *
 * @returns A promise that resolves with whether this call unlinked billing.
 *
 * @example
 * ```ts
 * bilOffFun('come-hang-staging') // => true
 * ```
 *
*/

const bilOffFun = async ( prjIdeStr : string ) : Promise< boolean > => { // What: Billing Off Function. Why: Spending past the budget has to stop. How: This unlinks the project's billing account, once.


	const tokResObj = await fetch( TOK_URL_STR, { headers : { 'Metadata-Flavor' : 'Google' } } ); // What: Token Response Object. Why: Cloud Billing needs a bearer token. How: This asks the metadata server for the service account's.


	if ( !tokResObj.ok ) throw new Error( `Access token refused: ${ tokResObj.status }` ); // What: Token Guard. Why: Without a token nothing can be changed. How: This throws with the status.



	const { access_token : accTokStr } = await tokResObj.json() as { access_token : string }; // What: Access Token String. Why: Every Cloud Billing request carries it. How: This reads it from the reply. // What: Type Assertion Note. Why: The metadata server's token reply always holds access_token. How: The as reads it with that shape.

	const autHeaObj = { Authorization : `Bearer ${ accTokStr }`, 'Content-Type' : 'application/json' }; // What: Authorization Header Object. Why: Both requests sign in the same way. How: This holds the token and the body's type.
	const bilUrlStr = `${ BIL_API_STR }/${ prjIdeStr }/billingInfo`;                                    // What: Billing URL String. Why: Both requests name the project's billing link. How: This builds its address.


	const infResObj = await fetch( bilUrlStr, { headers : autHeaObj } ); // What: Information Response Object. Why: A project already cut off needs nothing more. How: This reads its billing link.


	if ( !infResObj.ok ) throw new Error( `Billing read refused: ${ infResObj.status } ${ await infResObj.text() }` ); // What: Read Guard. Why: The service account may lack permission. How: This throws with Cloud Billing's reply.



	const { billingEnabled : bilEnaBoo } = await infResObj.json() as { billingEnabled? : boolean }; // What: Billing Enabled Boolean. Why: A project already cut off is left alone. How: This reads whether billing is on. // What: Type Assertion Note. Why: Cloud Billing's ProjectBillingInfo carries billingEnabled, left out when it's false. How: The as reads it with that shape.


	if ( !bilEnaBoo ) return false; // What: Already Off Guard. Why: The budget keeps publishing after a cutoff. How: This returns without a change.



	const putResObj = await fetch( bilUrlStr, { body : JSON.stringify( { billingAccountName : '' } ), headers : autHeaObj, method : 'PUT' } ); // What: Put Response Object. Why: An empty account name unlinks billing. How: This sends it.


	if ( !putResObj.ok ) throw new Error( `Billing cutoff refused: ${ putResObj.status } ${ await putResObj.text() }` ); // What: Cutoff Guard. Why: A refused cutoff has to show in the logs. How: This throws with Cloud Billing's reply.



	return true; // What: Cut Off Return. Why: The caller logs the cutoff. How: This reports that billing was unlinked.


};

// #endregion bilOffFun

// #endregion Helpers



// #region Module Init

// #region bilCutFun

/**
 * bilCutFun = Billing Cutoff Function
 *
 * @summary
 * A Pub/Sub trigger on the billing-cutoff topic, which the project's budget
 * publishes to. Once a message's costAmount is greater than its
 * budgetAmount, it unlinks the project's billing, or under the emulator
 * records the cutoff in emulatorBillingCutoffs. A message at or under the
 * budget, or without both numbers, changes nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The event Firebase sends, whose
 *                    message holds the budget's notification as JSON.
 *
 * @returns A promise that settles once the cutoff is made or passed over,
 *          with no value.
 *
 * @example
 * ```ts
 * bilCutFun(eveValObj) // => Promise<void>
 * ```
 *
*/

const bilCutFun = onMessagePublished( { ...FUN_OPT_OBJ, topic : 'billing-cutoff' }, async ( eveValObj ) => { // What: Billing Cutoff Function. Why: Blaze has no spending cap of its own (Section 15). How: This unlinks billing once spending passes the budget.


	const { budgetAmount : budAmoNum, costAmount : cosAmoNum } = eveValObj.data.message.json as { budgetAmount? : unknown, costAmount? : unknown }; // What: Budget Amount Number. Why: The ceiling is the budget's own amount. How: This reads it from the notification. // What: Cost Amount Number. Why: The month's spending is compared with the ceiling. How: This reads it from the notification. // What: Type Assertion Note. Why: A budget notification is a JSON object, its numbers checked below. How: The as reads its two fields as unknown.


	if ( typeof budAmoNum !== 'number' || typeof cosAmoNum !== 'number' || cosAmoNum <= budAmoNum ) return; // What: Under Budget Guard. Why: Only spending past the budget cuts billing off. How: This returns for a malformed message or one at or under the budget.



	const prjIdeStr = process.env.GCLOUD_PROJECT!; // What: Project Identifier String. Why: The cutoff names its own project. How: This reads the ID Firebase sets. // What: Non-Null Note. Why: Firebase sets GCLOUD_PROJECT in every function, the emulator's included. How: The ! reads it as present.


	if ( process.env.FUNCTIONS_EMULATOR === 'true' ) { await FIR_DAT_OBJ.collection( 'emulatorBillingCutoffs' ).add( { budgetAmount : budAmoNum, costAmount : cosAmoNum, projectId : prjIdeStr } ); return; } // What: Emulator Guard. Why: The emulator can't reach Cloud Billing, and the tests need to see the cutoff. How: This records it and returns.



	if ( await bilOffFun( prjIdeStr ) ) console.warn( `Billing cut off for ${ prjIdeStr }: ${ cosAmoNum } spent against a budget of ${ budAmoNum }` ); // What: Cutoff Log. Why: Whoever relinks billing sees why it went. How: This logs the spending once billing is unlinked.


} );

// #endregion bilCutFun

// #endregion Module Init



// #region Exports

export { bilCutFun }; // What: Named Export. Why: The entry deploys it. How: This exports the trigger.

// #endregion Exports


