


// #region Imports

import { API_URL_PAR } from './polar.ts';                   // What: API URL Parameter. Why: The checkout is created on this project's Polar. How: This is its address.
import { FieldValue  } from 'firebase-admin/firestore';     // What: Field Value. Why: A refund removes the paid flag. How: This deletes the field.
import { FIR_DAT_OBJ } from './setup.ts';                   // What: Firestore Database Object. Why: The paid flag and the handled deliveries live in Firestore. How: This reaches it past the rules.
import { FUN_OPT_OBJ } from './setup.ts';                   // What: Function Options Object. Why: Every function shares the deploy options. How: Both functions spread them into their own.
import { getAuth     } from 'firebase-admin/auth';          // What: Get Auth. Why: Only an identity linked to Google may buy. How: This returns the Admin SDK's Auth.
import { HttpsError  } from 'firebase-functions/v2/https';  // What: HTTPS Error. Why: A refused checkout tells the app why. How: This throws an error the client receives with its code.
import { onCall      } from 'firebase-functions/v2/https';  // What: On Call. Why: The app asks for a checkout as its signed-in identity. How: This registers a callable function, which checks the caller's sign-in.
import { onRequest   } from 'firebase-functions/v2/https';  // What: On Request. Why: Polar posts its webhook to a plain address. How: This registers an HTTP function.
import { ordUidFun   } from './polar.ts';                   // What: Order UID Function. Why: An order names its buyer through the checkout's tags. How: This reads them.
import { POL_TOK_SEC } from './polar.ts';                   // What: Polar Token Secret. Why: Creating a checkout needs the organization's token. How: This is the secret.
import { POL_WEB_SEC } from './polar.ts';                   // What: Polar Webhook Secret. Why: Only a webhook signed with it is Polar's. How: This is the secret.
import { PRO_IDE_PAR } from './polar.ts';                   // What: Product Identifier Parameter. Why: Only the upgrade's product grants it. How: This is the project's product.
import { SUC_URL_PAR } from './polar.ts';                   // What: Success URL Parameter. Why: The buyer returns to the app. How: This is the project's return address.
import { verWebFun   } from './polar.ts';                   // What: Verify Webhook Function. Why: Only Polar may change who has paid. How: This checks the signature.


import type { PolOrdTyp } from './polar.ts'; // What: Polar Order Type. Why: The webhook reads an order's fields. How: This types it.

// #endregion Imports



/**
 * purchase.ts = Purchase
 *
 * @summary
 * The one-time upgrade's two functions (ARCHITECTURE.md Section 18). The
 * checkout callable creates a Polar checkout for the caller, tagged with
 * their UID and prefilled with their Google email, and returns its address:
 * the caller has to be linked to Google, since paid status rides on a UID
 * that has to be recoverable, and mustn't have paid already, and a project
 * without its Polar settings refuses rather than selling nothing. The
 * webhook takes Polar's order events: once the signature checks out, a paid
 * order for the product sets the buyer's paid flag and a fully refunded one
 * removes it. Each delivery's ID is recorded in the same transaction, in a
 * collection no client rule opens, so a replayed event never acts twice,
 * while a failed write leaves Polar free to retry. An event for another
 * product, another kind of event, or an order whose buyer has no account is
 * logged and acknowledged.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region cheCreFun

/**
 * cheCreFun = Checkout Create Function
 *
 * @summary
 * Creates a Polar checkout for the signed-in caller and resolves with its
 * address, which the app opens. Refuses with unauthenticated without a
 * sign-in, failed-precondition for an identity not linked to Google,
 * already-exists for one already paid, unavailable for a project without
 * its Polar token or product, and internal when Polar won't create it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqValObj - Request Value Object: The callable's request, whose
 *                    data is unused.
 *
 * @returns A promise that resolves with the checkout's address.
 *
 * @example
 * ```ts
 * cheCreFun.run(reqValObj) // => { urlValStr : 'https://...' }
 * ```
 *
*/

const cheCreFun = onCall( { ...FUN_OPT_OBJ, secrets : [ POL_TOK_SEC ] }, async ( reqValObj ) : Promise< { urlValStr : string } > => { // What: Checkout Create Function. Why: Buying the upgrade starts from the app (Section 18). How: This checks the caller, then asks Polar for a checkout tagged with their UID.


	if ( !reqValObj.auth ) throw new HttpsError( 'unauthenticated', 'Sign in first.' ); // What: Sign-In Guard. Why: A purchase belongs to an identity. How: This refuses a caller with no sign-in.



	const uidValStr = reqValObj.auth.uid;                                                                    // What: UID Value String. Why: The checkout is tagged with the buyer. How: This reads the caller.
	const useRecObj = await getAuth().getUser( uidValStr );                                                  // What: User Record Object. Why: The caller's providers and email are on their Auth record. How: This reads it.
	const gooProObj = useRecObj.providerData.find( ( proDatObj ) => proDatObj.providerId === 'google.com' ); // What: Google Provider Object. Why: Paid status rides on a UID that has to be recoverable (Section 18). How: This finds the Google link, undefined without one.


	if ( !gooProObj ) throw new HttpsError( 'failed-precondition', 'Link Google sign-in before buying.' ); // What: Unlinked Guard. Why: A purchase on an unrecoverable identity could be lost with the phone. How: This refuses it.



	const accSnaObj = await FIR_DAT_OBJ.doc( `accounts/${ uidValStr }` ).get(); // What: Account Snapshot Object. Why: Someone who has paid needn't pay again. How: This reads their account.


	if ( accSnaObj.get( 'paid' ) === true ) throw new HttpsError( 'already-exists', 'This identity has already bought the upgrade.' ); // What: Paid Guard. Why: A second purchase would buy nothing. How: This refuses it.



	const polTokStr = POL_TOK_SEC.value(); // What: Polar Token String. Why: Polar's API needs the organization's token. How: This reads the secret.
	const proIdeStr = PRO_IDE_PAR.value(); // What: Product Identifier String. Why: The checkout sells the project's product. How: This reads it.


	if ( !polTokStr || !proIdeStr ) throw new HttpsError( 'unavailable', "Purchases aren't set up yet." ); // What: Setup Guard. Why: A project without its token or product can't sell. How: This refuses rather than failing at Polar.



	const polResObj = await fetch( `${ API_URL_PAR.value() }/v1/checkouts/`, { // What: Polar Response Object. Why: Polar creates the checkout. How: This posts the product, the buyer's tags and email, and where to return.


		body : JSON.stringify({ // What: Body. Why: Polar reads the checkout's details as JSON. How: This serializes them.


			customer_email       : gooProObj.email ?? useRecObj.email, // What: Customer Email. Why: The buyer shouldn't retype it. How: This fills in their Google email.
			external_customer_id : uidValStr,                          // What: External Customer Identifier. Why: The webhook finds the buyer by it. How: This is the UID.
			metadata             : { firebaseUid : uidValStr },        // What: Metadata. Why: The order keeps the UID even if the customer record changes. How: This copies it in.
			products             : [ proIdeStr ],                      // What: Products. Why: The checkout sells the upgrade. How: This lists its product.
			success_url          : SUC_URL_PAR.value()                 // What: Success URL. Why: The buyer comes back to the app. How: This is the project's fixed return address.


		}),

		headers : { 'Authorization' : `Bearer ${ polTokStr }`, 'Content-Type' : 'application/json' }, // What: Headers. Why: Polar needs the token and the body's type. How: This sends both.
		method  : 'POST'                                                                              // What: Method. Why: A checkout is created by a post. How: This names it.


	} );


	if ( !polResObj.ok ) { // What: Polar Failure Block. Why: Polar may refuse, and the reason helps whoever debugs it. How: This logs Polar's status and reply, then refuses.


		console.warn( `Polar checkout failed: ${ polResObj.status } ${ await polResObj.text() }` ); // What: Failure Log. Why: The reply says why. How: This logs it.

		throw new HttpsError( 'internal', "The checkout couldn't be opened. Try again in a moment." ); // What: Failure Throw. Why: The app tells the buyer. How: This refuses with a sentence it can show.


	}



	return { urlValStr : ( await polResObj.json() as { url : string } ).url }; // What: Address Return. Why: The app opens Polar's checkout page. How: This returns its address. // What: Type Assertion Note. Why: A created checkout always carries its address. How: The as reads it as such.


} );

// #endregion cheCreFun



// #region polWebFun

/**
 * polWebFun = Polar Webhook Function
 *
 * @summary
 * Handles one of Polar's webhooks (see the file summary). Answers 405 for
 * anything but a POST, 503 when the project has no webhook secret, 403 for a
 * bad signature, 202 for an event it acknowledges without acting on, and
 * 200 once the paid flag is set or removed, or the delivery was already
 * handled.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param reqValObj - Request Value Object: Polar's request.
 * @param resValObj - Response Value Object: The response to answer with.
 *
 * @returns A promise that settles once the response is sent, with no value.
 *
 * @example
 * ```ts
 * polWebFun(reqValObj, resValObj) // => Promise<void>
 * ```
 *
*/

const polWebFun = onRequest( { ...FUN_OPT_OBJ, secrets : [ POL_WEB_SEC ] }, async ( reqValObj, resValObj ) : Promise< void > => { // What: Polar Webhook Function. Why: Paid status follows Polar's orders, and only Polar may change it (Section 18). How: This checks the signature, then sets or removes the buyer's flag once per delivery.


	if ( reqValObj.method !== 'POST' ) { resValObj.status( 405 ).send( 'Use POST.' ); return; } // What: Method Guard. Why: Polar only posts. How: This refuses any other method.



	const webSecStr = POL_WEB_SEC.value(); // What: Webhook Secret String. Why: Signatures are checked against the project's secret. How: This reads it.


	if ( !webSecStr ) { resValObj.status( 503 ).send( 'Webhook not set up.' ); return; } // What: Setup Guard. Why: Without a secret, nothing can be trusted. How: This refuses.



	const bodTexStr = reqValObj.rawBody.toString( 'utf8' );                                           // What: Body Text String. Why: The signature covers the exact text. How: This reads the raw body.
	const verFaiStr = verWebFun( bodTexStr, ( heaNamStr ) => reqValObj.get( heaNamStr ), webSecStr ); // What: Verify Failure String. Why: Only Polar may change who has paid. How: This checks the signature, giving the reason it failed or null.


	if ( verFaiStr ) { // What: Signature Failure Block. Why: A refused webhook should say why in Polar's delivery log and the function's. How: This logs the reason, never the secret, and refuses.


		console.warn( `Webhook refused: ${ verFaiStr }` ); // What: Refusal Log. Why: Whoever debugs a delivery sees why. How: This logs the reason.

		resValObj.status( 403 ).send( `Webhook refused: ${ verFaiStr }.` ); // What: Refusal Response. Why: Polar shows the reply in its delivery log. How: This answers 403 with the reason.



		return; // What: Refused Return. Why: Nothing else runs. How: This ends the call.


	}



	const webEveObj = JSON.parse( bodTexStr ) as { data : PolOrdTyp, type : string }; // What: Webhook Event Object. Why: The event's type and order decide what happens. How: This parses the body. // What: Type Assertion Note. Why: A verified body is Polar's event JSON. How: The as reads it as one.
	const ordUidStr = ordUidFun( webEveObj.data );                                    // What: Order UID String. Why: The flag belongs on the buyer's account. How: This reads the order's tag.

	const paiNowBoo = webEveObj.type === 'order.paid';                                                     // What: Paid Now Boolean. Why: A payment sets the flag. How: This is true for order.paid.
	const proMatBoo = ( webEveObj.data.product_id ?? webEveObj.data.product?.id ) === PRO_IDE_PAR.value(); // What: Product Match Boolean. Why: Only the upgrade's product grants it, and a project without one grants nothing, since no order's product is empty. How: This compares the order's product, read from either field Polar sends it in.
	const refAllBoo = webEveObj.type === 'order.refunded' && webEveObj.data.status === 'refunded';         // What: Refunded All Boolean. Why: Only a full refund takes the upgrade away. How: This is true for a refund that left the order fully refunded.


	if ( ( !paiNowBoo && !refAllBoo ) || !proMatBoo || !ordUidStr ) { // What: Ignored Event Block. Why: Other events and products change nothing, and an untagged order needs a person's attention rather than retries. How: This logs an order it can't act on and acknowledges every one.


		if ( ( paiNowBoo || refAllBoo ) && !( proMatBoo && ordUidStr ) ) console.warn( `Polar order ${ webEveObj.data.id } wasn't applied: its product or buyer didn't match` ); // What: Unapplied Log. Why: A paid or refunded order that changes nothing is worth noticing. How: This logs its ID.

		resValObj.status( 202 ).send(); // What: Ignored Response. Why: Polar should stop sending it. How: This acknowledges it.



		return; // What: Ignored Return. Why: Nothing else runs. How: This ends the call.


	}



	const accRefObj = FIR_DAT_OBJ.doc( `accounts/${ ordUidStr }` );                        // What: Account Reference Object. Why: The paid flag lives on the buyer's account. How: This names it.
	const eveRefObj = FIR_DAT_OBJ.doc( `polarEvents/${ reqValObj.get( 'webhook-id' ) }` ); // What: Event Reference Object. Why: Each delivery acts once. How: This names its record by Polar's delivery ID, which the signature covers.


	const sttValStr = await FIR_DAT_OBJ.runTransaction( async ( traValObj ) : Promise< 'done' | 'missing' | 'repeat' > => { // What: Status Value String. Why: The flag and the delivery's record have to land together, so a failure leaves a retry free to act. How: This checks both in a transaction and returns what it found.


		const accSnaObj = await traValObj.get( accRefObj ); // What: Account Snapshot Object. Why: A buyer with no account can't be flagged. How: This reads it.
		const eveSnaObj = await traValObj.get( eveRefObj ); // What: Event Snapshot Object. Why: A delivery already handled must not act again. How: This reads its record.


		if ( eveSnaObj.exists ) return 'repeat'; // What: Repeat Guard. Why: A replayed event acts once. How: This returns without writing.



		if ( !accSnaObj.exists ) return 'missing'; // What: Missing Guard. Why: There's no account to flag. How: This returns without writing.



		traValObj.update( accRefObj, { paid : paiNowBoo ? true : FieldValue.delete() } );                                          // What: Flag Update Call. Why: Paid status follows the order. How: This sets the flag on payment and removes it on a full refund.
		traValObj.create( eveRefObj, { expireAt : new Date( Date.now() + 86400000 ), handledAt : FieldValue.serverTimestamp() } ); // What: Event Record Call. Why: A replay within Polar's five-minute window is recognized. How: This records the delivery, expiring a day later.



		return 'done'; // What: Done Return. Why: The caller answers Polar. How: This reports the flag changed.


	} );


	if ( sttValStr === 'missing' ) console.warn( `No account for Polar order ${ webEveObj.data.id }` ); // What: Missing Log. Why: The order can be matched by hand from the log. How: This logs its ID.

	resValObj.status( sttValStr === 'missing' ? 202 : 200 ).send(); // What: Result Response. Why: Polar should know it landed, or stop retrying an order with no account. How: This answers 200 when done or already handled, and 202 otherwise.


} );

// #endregion polWebFun

// #endregion Helpers



// #region Exports

export { cheCreFun, polWebFun }; // What: Named Exports. Why: The entry file exports every function Firebase deploys. How: This exports both.

// #endregion Exports


