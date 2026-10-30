


// #region Imports

import { createHmac      } from 'node:crypto';               // What: Create HMAC. Why: Polar signs every webhook with a shared secret. How: This computes the expected signature.
import { defineSecret    } from 'firebase-functions/params'; // What: Define Secret. Why: Polar's API token and webhook secret live in Secret Manager, never in the code. How: This declares each.
import { defineString    } from 'firebase-functions/params'; // What: Define String. Why: Each project sells its own product through its own Polar. How: This declares the settings each project's environment file gives.
import { timingSafeEqual } from 'node:crypto';               // What: Timing Safe Equal. Why: A signature compared at varying speed can leak it. How: This compares in constant time.

// #endregion Imports



/**
 * polar.ts = Polar
 *
 * @summary
 * What the purchase functions share about Polar, which sells the one-time
 * upgrade (ARCHITECTURE.md Section 18): each project's settings, the
 * webhook's signature check, and how an order names the identity that
 * bought it. The API token and webhook secret are secrets, and the product,
 * the API's address, and where a buyer returns to are settings each project
 * gives in its environment file, live Polar for the live project and the
 * sandbox for staging. The product has no default, so a project without one
 * sells nothing. A webhook is signed the Standard Webhooks way, over its ID,
 * timestamp, and body, and is refused when unsigned, mismatched, or more
 * than five minutes off the clock.
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

type PolOrdTyp = { customer? : { external_id? : string | null }, id : string, metadata? : Record< string, unknown >, product? : { id? : string }, product_id? : string, status? : string }; // What: Polar Order Type. Why: The webhook reads a few of an order's fields. How: This types those, each optional the way Polar may leave them out.

// #endregion Types



// #region Constants

const API_URL_PAR = defineString( 'POLAR_API_URL', { default : 'https://sandbox-api.polar.sh' } );            // What: API URL Parameter. Why: Staging buys through Polar's sandbox and live through live Polar. How: This reads the project's address, the sandbox unless set.
const POL_TOK_SEC = defineSecret( 'POLAR_ACCESS_TOKEN' );                                                     // What: Polar Token Secret. Why: Creating a checkout needs the organization's token. How: This declares it.
const POL_WEB_SEC = defineSecret( 'POLAR_WEBHOOK_SECRET' );                                                   // What: Polar Webhook Secret. Why: Only a webhook signed with it is Polar's. How: This declares it.
const PRO_IDE_PAR = defineString( 'POLAR_PRODUCT_ID', { default : '' } );                                     // What: Product Identifier Parameter. Why: Only the upgrade's product grants it. How: This reads the project's product, empty until set, so nothing is sold or granted.
const SUC_URL_PAR = defineString( 'POLAR_SUCCESS_URL', { default : 'https://comehang.app/?purchase=done' } ); // What: Success URL Parameter. Why: The buyer comes back to the app, and a fixed address can't be turned into a redirect elsewhere. How: This reads the project's own, marked as a purchase.
const TIM_TOL_NUM = 300;                                                                                      // What: Time Tolerance Number. Why: A replayed old webhook must be refused. How: This allows five minutes, in seconds, between Polar's timestamp and now.

// #endregion Constants



// #region Helpers

// #region ordUidFun

/**
 * ordUidFun = Order UID Function
 *
 * @summary
 * Reads the UID an order's checkout was tagged with: the customer's
 * external ID, or the copy in the order's metadata. Null when neither names
 * one.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ordValObj - Order Value Object: The webhook's order.
 *
 * @returns The UID, or null.
 *
 * @example
 * ```ts
 * ordUidFun(ordValObj) // => 'k3j...'
 * ```
 *
*/

const ordUidFun = ( ordValObj : PolOrdTyp ) : string | null => { // What: Order UID Function. Why: A checkout tags its order with the buyer's UID. How: This reads either tag.


	const extIdeStr = ordValObj.customer?.external_id; // What: External Identifier String. Why: The checkout tags its customer with the UID. How: This reads it.
	const metUidAny = ordValObj.metadata?.firebaseUid; // What: Metadata UID Any. Why: The checkout also copies the UID into the order's metadata. How: This reads it.



	return extIdeStr || ( typeof metUidAny === 'string' && metUidAny ) || null; // What: UID Return. Why: Either tag names the identity. How: This returns the first present, or null.


};

// #endregion ordUidFun



// #region verWebFun

/**
 * verWebFun = Verify Webhook Function
 *
 * @summary
 * Checks a webhook the Standard Webhooks way Polar signs it: the ID,
 * timestamp, and signature headers must all be there, the timestamp within
 * five minutes of now, and one of the listed v1 signatures must match an
 * HMAC-SHA256 of the ID, timestamp, and exact body joined by dots, keyed by
 * the secret's own bytes or, as Polar's SDK also accepts, its base64 bytes
 * after any whsec_ prefix. Returns null when it's genuine, or the reason.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bodTexStr - Body Text String: The request's exact body.
 * @param heaGetFun - Header Get Function: Reads a request header by name.
 * @param webSecStr - Webhook Secret String: The project's webhook secret.
 * @param nowSecNum - Now Seconds Number: The current time in seconds, the
 *                    clock's by default.
 *
 * @returns Null when genuine, or why it was refused.
 *
 * @example
 * ```ts
 * verWebFun(bodTexStr, heaGetFun, webSecStr) // => null
 * ```
 *
*/

const verWebFun = ( bodTexStr : string, heaGetFun : ( heaNamStr : string ) => string | undefined, webSecStr : string, nowSecNum = Math.floor( Date.now() / 1000 ) ) : string | null => { // What: Verify Webhook Function. Why: Only Polar may change who has paid. How: This checks the headers, the time, and the signature.


	const msgIdeStr = heaGetFun( 'webhook-id' );        // What: Message Identifier String. Why: The ID is part of what's signed. How: This reads its header.
	const msgSigStr = heaGetFun( 'webhook-signature' ); // What: Message Signature String. Why: The signatures to check. How: This reads their header.
	const msgTimStr = heaGetFun( 'webhook-timestamp' ); // What: Message Timestamp String. Why: The time is signed and checked for freshness. How: This reads its header.


	if ( !msgIdeStr || !msgSigStr || !msgTimStr ) return 'missing headers'; // What: Missing Header Guard. Why: An unsigned request isn't from Polar. How: This refuses it.



	if ( !( Math.abs( nowSecNum - Number( msgTimStr ) ) <= TIM_TOL_NUM ) ) return 'stale timestamp'; // What: Stale Timestamp Guard. Why: An old webhook could be replayed, and a timestamp that isn't a number is no better. How: This refuses one more than five minutes off, or unreadable.



	const b64RemStr = webSecStr.startsWith( 'whsec_' ) ? webSecStr.slice( 6 ) : webSecStr;                                  // What: Base64 Remainder String. Why: A Standard Webhooks secret may carry a whsec_ prefix before its base64 key. How: This drops it.
	const b64ValBoo = b64RemStr.length > 0 && b64RemStr.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test( b64RemStr );     // What: Base64 Valid Boolean. Why: Only a real base64 string gives a decoded key, the same test Polar's SDK makes. How: This checks its length and characters, plain checks of one string, so the chain stays inline.
	const keyBufArr = [ Buffer.from( webSecStr, 'utf8' ), ...( b64ValBoo ? [ Buffer.from( b64RemStr, 'base64' ) ] : [] ) ]; // What: Key Buffer Array. Why: Polar's SDK accepts a signature made with either key. How: This lists the secret's own bytes and, when valid, its decoded bytes.
	const sigConStr = `${ msgIdeStr }.${ Math.floor( Number( msgTimStr ) ) }.${ bodTexStr }`;                               // What: Signed Content String. Why: Polar signs the ID, the timestamp, and the body joined by dots. How: This builds the same text.
	const expSigArr = keyBufArr.map( ( keyCurBuf ) => createHmac( 'sha256', keyCurBuf ).update( sigConStr ).digest() );     // What: Expected Signature Array. Why: A genuine signature matches one of these. How: This signs the content with each key.

	const sigMatBoo = msgSigStr.split( ' ' ).some( ( sigEntStr ) => { // What: Signature Match Boolean. Why: Any listed v1 signature matching proves the webhook genuine. How: This compares each against every expected one in constant time.


		const [ sigVerStr, sigB64Str ] = sigEntStr.split( ',', 2 ); // What: Signature Version And Value. Why: Each entry is a version, a comma, and the base64 signature. How: This splits them.


		if ( sigVerStr !== 'v1' || !sigB64Str ) return false; // What: Unknown Version Guard. Why: Only v1 signatures are HMAC-SHA256. How: This skips any other entry.



		const sigValBuf = Buffer.from( sigB64Str, 'base64' ); // What: Signature Value Buffer. Why: The signature is compared as bytes. How: This decodes it.



		return expSigArr.some( ( expSigBuf ) => sigValBuf.length === expSigBuf.length && timingSafeEqual( sigValBuf, expSigBuf ) ); // What: Entry Match Return. Why: Lengths must match before a constant-time compare. How: This checks each expected signature.


	} );



	return sigMatBoo ? null : 'signature mismatch'; // What: Result Return. Why: The caller refuses anything but a match, and logs why. How: This returns null for a match, or the reason.


};

// #endregion verWebFun

// #endregion Helpers



// #region Exports

export { API_URL_PAR, ordUidFun, POL_TOK_SEC, POL_WEB_SEC, type PolOrdTyp, PRO_IDE_PAR, SUC_URL_PAR, verWebFun }; // What: Named Exports. Why: The checkout and webhook functions share Polar's settings and checks. How: This exports them.

// #endregion Exports


