


// #region Imports

import { createHmac                } from 'node:crypto';                  // What: Create HMAC. Why: Test webhooks are signed the way Polar signs them. How: This computes their signatures.
import { doc                       } from 'firebase/firestore';           // What: Doc. Why: Accounts are seeded and read by path. How: This builds a reference.
import { execFile                  } from 'node:child_process';           // What: Exec File. Why: The functions run in a Node process of their own. How: This starts one.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the functions answered and wrote as they should. How: This asserts on statuses, refusals, and accounts.
import { fileURLToPath             } from 'node:url';                     // What: File URL To Path. Why: The child script is found beside the suite. How: This turns its address into a path.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The paid flag is read back. How: This reads an account.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests seed and read past the rules, as the server would. How: This connects to the emulator.
import { setDoc                    } from 'firebase/firestore';           // What: Set Doc. Why: Accounts are seeded. How: This writes them.
import { test                      } from '@playwright/test';             // What: Test. Why: Each side of a purchase is its own test. How: This declares them.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every seed and read goes through one. How: This types it.

// #endregion Imports



/**
 * purchase.spec.ts = Purchase Spec
 *
 * @summary
 * Checks the purchase functions against the Firestore and Auth emulators,
 * which npm run test:functions starts. Playwright's loader can't link the
 * HTTP functions' module, so each run happens in a Node process of its own,
 * tests/support/purchase-child.ts, given Polar's settings through its
 * environment as a deployed function receives them. The webhook gets
 * deliveries signed here the way Polar signs them, and the checkout callable
 * runs with Polar's API stood in, reporting what it was asked. Identities
 * are made through the Auth emulator's own sign-in endpoints, anonymous or
 * linked to Google.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const AUT_URL_STR = 'http://127.0.0.1:8240/identitytoolkit.googleapis.com/v1/accounts';          // What: Auth URL String. Why: Identities are made through the Auth emulator's endpoints. How: This is their address.
const CHI_PAT_STR = fileURLToPath( new URL( '../support/purchase-child.ts', import.meta.url ) ); // What: Child Path String. Why: Each run starts the child script. How: This is its path.
const PRO_IDE_STR = 'prod-upgrade';                                                              // What: Product Identifier String. Why: Only the upgrade's product grants it. How: This is the test project's product.
const WEB_KEY_BUF = Buffer.from( 'come-hang-test-webhook-key-32byt' );                           // What: Webhook Key Buffer. Why: Test deliveries are signed with the project's secret. How: This is its key's bytes, given to the function as a whsec_ secret.

const ENV_SET_OBJ = { // What: Environment Settings Object. Why: Each run gets the project's Polar settings, as a deployed function does. How: This lists them.


	POLAR_ACCESS_TOKEN   : 'polar-test-token',                               // What: Token Setting. Why: The checkout needs a token to call Polar. How: This is a stand-in.
	POLAR_API_URL        : 'https://sandbox-api.polar.sh',                   // What: API Setting. Why: Staging buys through the sandbox. How: This names it.
	POLAR_PRODUCT_ID     : PRO_IDE_STR,                                      // What: Product Setting. Why: The project sells one product. How: This names it.
	POLAR_SUCCESS_URL    : 'https://comehang.app/?purchase=done',            // What: Success Setting. Why: The buyer returns to the app. How: This names its address.
	POLAR_WEBHOOK_SECRET : `whsec_${ WEB_KEY_BUF.toString( 'base64' ) }`     // What: Secret Setting. Why: Deliveries are checked against it. How: This gives the test key in Polar's whsec_ form.


};

// #endregion Constants



// #region Module State

let purEnvObj : RulesTestEnvironment; // What: Purchase Environment Object. Why: Every seed and read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

type ChiResTyp = { errCodStr? : string, reqLisArr? : { bodObj : unknown, urlStr : string }[], stsNum? : number, valAny? : unknown }; // What: Child Result Type. Why: Both kinds of run report through one shape. How: This types the webhook's status and the call's value, error code, and Polar requests.

// #region chiRunFun

/**
 * chiRunFun = Child Run Function
 *
 * @summary
 * Runs one job in the child script and resolves with the result it prints
 * on its last line. The job's settings start from the project's, with any
 * overrides, where null unsets one.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param jobValObj - Job Value Object: The run's kind and inputs.
 * @param envOvrObj - Environment Override Object: Settings to change, none
 *                    by default.
 *
 * @returns A promise that resolves with the child's result.
 *
 * @example
 * ```ts
 * chiRunFun({ kinStr : 'call', uidStr : 'u1' }) // => { valAny, reqLisArr }
 * ```
 *
*/

const chiRunFun = ( jobValObj : Record< string, unknown >, envOvrObj : Record< string, string | null > = {} ) : Promise< ChiResTyp > => new Promise( ( resValFun, rejValFun ) => { // What: Child Run Function. Why: Playwright's loader can't link the functions, while a plain Node process can. How: This runs the child with the job on its input and parses its last line.


	const chiProObj = execFile( process.execPath, [ CHI_PAT_STR ], ( errCatObj, outTexStr ) => { // What: Child Process Object. Why: Each run gets a fresh process with its own settings. How: This starts the child script with Node and collects its output.


		if ( errCatObj ) { rejValFun( errCatObj ); return; } // What: Failure Guard. Why: A crash in the child is a test failure. How: This rejects with it.



		resValFun( JSON.parse( outTexStr.trim().split( '\n' ).at( -1 )! ) as ChiResTyp ); // What: Result Call. Why: The child prints its result last. How: This parses that line. // What: Non-Null Note. Why: A child that exited cleanly printed a line. How: The ! says it's there. // What: Type Assertion Note. Why: The child prints a result of this shape. How: The as reads it so.


	} );


	chiProObj.stdin!.end( JSON.stringify( { envObj : { ...ENV_SET_OBJ, ...envOvrObj }, ...jobValObj } ) ); // What: Job Send Call. Why: The child reads its job from its input. How: This writes the job with its settings and closes the input. // What: Non-Null Note. Why: execFile opens the child's input by default. How: The ! says it's there.


} );

// #endregion chiRunFun



const accSeeFun = ( uidValStr : string, accDatObj : Record< string, unknown > = {} ) => purEnvObj.withSecurityRulesDisabled( ( cotAdmObj ) => setDoc( doc( cotAdmObj.firestore(), `accounts/${ uidValStr }` ), { memberGroups : {}, ownedGroups : {}, ...accDatObj } ) ); // What: Account Seed Function. Why: The flag lands on an existing account. How: This writes an empty one, with any extra fields.



const calRunFun = ( uidValStr? : string, envOvrObj : Record< string, string | null > = {}, polOkaBoo = true ) => chiRunFun( { kinStr : 'call', polOkaBoo, uidStr : uidValStr }, envOvrObj ); // What: Call Run Function. Why: Each checkout check calls as one identity. How: This runs the callable in the child, with Polar answering or failing.



const ideMakFun = async ( gooEmaStr? : string ) : Promise< string > => { // What: Identity Make Function. Why: The checkout needs anonymous and Google-linked callers. How: This signs one up through the Auth emulator and resolves with its UID.


	const gooTokStr = JSON.stringify( { email : gooEmaStr, email_verified : true, sub : `g-${ gooEmaStr }` } ); // What: Google Token String. Why: The Auth emulator takes an unsigned token as Google's. How: This builds one for the email.

	const ideResObj = await fetch( gooEmaStr === undefined ? `${ AUT_URL_STR }:signUp?key=fake` : `${ AUT_URL_STR }:signInWithIdp?key=fake`, { // What: Identity Response Object. Why: Each kind of identity comes from its own endpoint. How: This signs up anonymously, or in with Google.


		body    : JSON.stringify( gooEmaStr === undefined ? {} : { postBody : `id_token=${ gooTokStr }&providerId=google.com`, requestUri : 'http://localhost', returnSecureToken : true } ), // What: Body. Why: Google's sign-in carries its token. How: This sends it, or nothing for an anonymous sign-up.
		headers : { 'Content-Type' : 'application/json' },                                                                                                                                    // What: Headers. Why: The body is JSON. How: This says so.
		method  : 'POST'                                                                                                                                                                      // What: Method. Why: A sign-up is a post. How: This names it.


	} );



	return ( await ideResObj.json() as { localId : string } ).localId; // What: UID Return. Why: The test calls as this identity. How: This returns its UID. // What: Type Assertion Note. Why: A sign-up answers with the new UID. How: The as reads it.


};



const paiGetFun = async ( uidValStr : string ) : Promise< unknown > => { // What: Paid Get Function. Why: Tests check the flag the webhook wrote. How: This reads the account's paid field with the rules off.


	let paiValAny : unknown; // What: Paid Value Any. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await purEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { paiValAny = ( await getDoc( doc( cotAdmObj.firestore(), `accounts/${ uidValStr }` ) ) ).get( 'paid' ); } ); // What: Account Read Call. Why: The test checks the flag. How: This reads it with the rules off.



	return paiValAny; // What: Paid Return. Why: The test compares it, undefined when absent. How: This returns it.


};



// #region webSenFun

/**
 * webSenFun = Webhook Send Function
 *
 * @summary
 * Sends the webhook one delivery the way Polar would: the event as JSON,
 * signed over its delivery ID, timestamp, and body with the test key, run
 * in the child, then resolves with the status it answered. Options send
 * another method, sign with another key, move the timestamp, leave the
 * signature's header off, or change the settings.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param eveValObj - Event Value Object: The event's type and order.
 * @param msgIdeStr - Message Identifier String: The delivery's ID.
 * @param optValObj - Option Value Object: The method, key, timestamp
 *                    offset in seconds, whether to sign, and settings to
 *                    change, POST with the test key, now, signed, and none
 *                    by default.
 *
 * @returns A promise that resolves with the status code.
 *
 * @example
 * ```ts
 * webSenFun({ data, type : 'order.paid' }, 'msg1') // => 200
 * ```
 *
*/

const webSenFun = async ( eveValObj : Record< string, unknown >, msgIdeStr : string, optValObj : { envObj? : Record< string, string | null >, keyBuf? : Buffer, metStr? : string, offNum? : number, sigBoo? : boolean } = {} ) : Promise< number | undefined > => { // What: Webhook Send Function. Why: Every webhook test sends a delivery and reads the answer. How: This signs one and runs the handler with it.


	const bodTexStr = JSON.stringify( eveValObj );                                                                                                         // What: Body Text String. Why: The signature covers the exact body. How: This serializes the event.
	const timValStr = String( Math.floor( Date.now() / 1000 ) + ( optValObj.offNum ?? 0 ) );                                                               // What: Time Value String. Why: The timestamp is signed and checked. How: This is now in seconds, moved by any offset.
	const sigValStr = createHmac( 'sha256', optValObj.keyBuf ?? WEB_KEY_BUF ).update( `${ msgIdeStr }.${ timValStr }.${ bodTexStr }` ).digest( 'base64' ); // What: Signature Value String. Why: Polar signs the ID, time, and body with the secret's key. How: This signs them.

	const heaValObj = { 'webhook-id' : msgIdeStr, 'webhook-timestamp' : timValStr, ...( optValObj.sigBoo === false ? {} : { 'webhook-signature' : `v1,${ sigValStr }` } ) }; // What: Header Value Object. Why: The signature travels in three headers. How: This sets them, leaving the signature off an unsigned delivery.



	return ( await chiRunFun( { heaObj : heaValObj, kinStr : 'web', metStr : optValObj.metStr ?? 'POST', rawStr : bodTexStr }, optValObj.envObj ) ).stsNum; // What: Status Return. Why: The test checks the answer. How: This runs the delivery in the child and returns its status.


};

// #endregion webSenFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	purEnvObj = await initializeTestEnvironment( { firestore : { host : '127.0.0.1', port : 8200 }, projectId : 'demo-come-hang' } ); // What: Environment Assignment. Why: Every seed and read reaches the emulator through it. How: This connects to Firestore under the demo project.


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await purEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async () => { // What: Reset Hook. Why: Each test starts from empty documents. How: This clears Firestore.


	await purEnvObj.clearFirestore(); // What: Firestore Clear Call. Why: No test sees another's accounts or deliveries. How: This clears them.


} );



test( 'a paid order sets the flag once per delivery, and a full refund removes it', async () => { // What: Paid Flag Test. Why: Paid status follows Polar's orders, and a replay mustn't undo a refund (Section 18). How: This delivers a payment, a partial and a full refund, and the payment again under its old ID, checking the answers and the flag.


	const ordValObj = { customer : { external_id : 'bob' }, id : 'ord1', product_id : PRO_IDE_STR }; // What: Order Value Object. Why: Every delivery is about Bob's order. How: This is its fields.


	await accSeeFun( 'bob' ); // What: Account Seed Call. Why: Bob has an account. How: This seeds it unpaid.

	expect( await webSenFun( { data : ordValObj, type : 'order.paid' }, 'msg1' ) ).toBe( 200 );                                           // What: Paid Answer Check. Why: The payment is applied. How: This expects 200.
	expect( await paiGetFun( 'bob' ) ).toBe( true );                                                                                      // What: Paid Flag Check. Why: Bob has paid. How: This expects the flag set.
	expect( await webSenFun( { data : { ...ordValObj, status : 'partially_refunded' }, type : 'order.refunded' }, 'msg2' ) ).toBe( 202 ); // What: Partial Answer Check. Why: A partial refund keeps the upgrade. How: This expects it acknowledged.
	expect( await paiGetFun( 'bob' ) ).toBe( true );                                                                                      // What: Partial Flag Check. Why: Nothing changed. How: This expects the flag still set.
	expect( await webSenFun( { data : { ...ordValObj, status : 'refunded' }, type : 'order.refunded' }, 'msg3' ) ).toBe( 200 );           // What: Refund Answer Check. Why: A full refund is applied. How: This expects 200.
	expect( await paiGetFun( 'bob' ) ).toBeUndefined();                                                                                   // What: Refund Flag Check. Why: The upgrade is taken back. How: This expects the flag gone.
	expect( await webSenFun( { data : ordValObj, type : 'order.paid' }, 'msg1' ) ).toBe( 200 );                                           // What: Replay Answer Check. Why: A delivery already handled is acknowledged. How: This expects 200 for the payment's ID again.
	expect( await paiGetFun( 'bob' ) ).toBeUndefined();                                                                                   // What: Replay Flag Check. Why: A replayed payment mustn't undo the refund. How: This expects the flag still gone.


} );



test( "the webhook refuses unsigned, mis-signed, or stale deliveries, and acknowledges orders it can't apply without acting", async () => { // What: Webhook Refusal Test. Why: Only Polar may grant the upgrade, and only for its product and a known buyer (Section 18). How: This sends deliveries with each fault and orders that don't match, checking each answer and that Bob stays unpaid.


	const ordValObj = { customer : { external_id : 'bob' }, id : 'ord1', product_id : PRO_IDE_STR }; // What: Order Value Object. Why: Most deliveries are about Bob's order. How: This is its fields.
	const paiEveObj = { data : ordValObj, type : 'order.paid' };                                     // What: Paid Event Object. Why: A payment is what a forger would send. How: This is the event.


	await accSeeFun( 'bob' ); // What: Account Seed Call. Why: Bob has an account. How: This seeds it unpaid.

	expect( await webSenFun( paiEveObj, 'm1', { metStr : 'GET' } ) ).toBe( 405 );                                                           // What: Method Check. Why: Polar only posts. How: This expects a GET refused.
	expect( await webSenFun( paiEveObj, 'm2', { envObj : { POLAR_WEBHOOK_SECRET : null } } ) ).toBe( 503 );                                 // What: Unset Check. Why: Nothing can be trusted without a secret. How: This expects 503 with it unset.
	expect( await webSenFun( paiEveObj, 'm3', { sigBoo : false } ) ).toBe( 403 );                                                           // What: Unsigned Check. Why: An unsigned delivery isn't Polar's. How: This expects one with its ID and time but no signature refused.
	expect( await webSenFun( paiEveObj, 'm4', { keyBuf : Buffer.from( 'not-the-key' ) } ) ).toBe( 403 );                                    // What: Wrong Key Check. Why: Only the project's secret signs. How: This expects another key refused.
	expect( await webSenFun( paiEveObj, 'm5', { offNum : -600 } ) ).toBe( 403 );                                                            // What: Stale Check. Why: An old delivery could be replayed. How: This expects one ten minutes old refused.
	expect( await webSenFun( { data : { ...ordValObj, product_id : 'other' }, type : 'order.paid' }, 'm6' ) ).toBe( 202 );                  // What: Other Product Check. Why: Only the upgrade's product grants it. How: This expects another product acknowledged.
	expect( await webSenFun( paiEveObj, 'm7', { envObj : { POLAR_PRODUCT_ID : null } } ) ).toBe( 202 );                                     // What: No Product Check. Why: A project with no product grants nothing. How: This expects the order acknowledged with the product unset.
	expect( await webSenFun( { data : ordValObj, type : 'checkout.created' }, 'm8' ) ).toBe( 202 );                                         // What: Other Event Check. Why: Only payments and refunds change anything. How: This expects another event acknowledged.
	expect( await webSenFun( { data : { id : 'ord2', product_id : PRO_IDE_STR }, type : 'order.paid' }, 'm9' ) ).toBe( 202 );               // What: Untagged Check. Why: An order naming no buyer can't be applied. How: This expects it acknowledged.
	expect( await webSenFun( { data : { ...ordValObj, customer : { external_id : 'ghost' } }, type : 'order.paid' }, 'm10' ) ).toBe( 202 ); // What: Unknown Buyer Check. Why: A buyer with no account can't be flagged. How: This expects it acknowledged.
	expect( await paiGetFun( 'bob' ) ).toBeUndefined();                                                                                     // What: Still Unpaid Check. Why: None of those may grant the upgrade. How: This expects no flag.


} );



test( "the checkout opens for a Google-linked identity that hasn't paid, tagged with its UID, and refuses everyone else", async () => { // What: Checkout Test. Why: Paid status rides on a recoverable UID, and the webhook finds the buyer by its tag (Section 18). How: This calls as nobody, an anonymous identity, a paid one, and an unpaid linked one with Polar unset, answering, and failing, checking each refusal and what Polar was asked.


	const anoUidStr = await ideMakFun();                                             // What: Anonymous UID String. Why: An unlinked identity can't buy. How: This makes one.
	const gooUidStr = await ideMakFun( `bob-${ crypto.randomUUID() }@example.com` ); // What: Google UID String. Why: A linked identity can buy. How: This makes one with a unique email.
	const paiUidStr = await ideMakFun( `amy-${ crypto.randomUUID() }@example.com` ); // What: Paid UID String. Why: A linked identity that has paid can't buy again. How: This makes one.


	await accSeeFun( paiUidStr, { paid : true } ); // What: Paid Seed Call. Why: Amy has bought. How: This seeds her paid.

	expect( ( await calRunFun() ).errCodStr ).toBe( 'unauthenticated' );                                               // What: Signed Out Check. Why: A purchase belongs to an identity. How: This expects a call with no sign-in refused.
	expect( ( await calRunFun( anoUidStr ) ).errCodStr ).toBe( 'failed-precondition' );                                // What: Unlinked Check. Why: An unrecoverable identity can't buy. How: This expects the anonymous one refused.
	expect( ( await calRunFun( paiUidStr ) ).errCodStr ).toBe( 'already-exists' );                                     // What: Paid Check. Why: A second purchase buys nothing. How: This expects Amy refused.
	expect( ( await calRunFun( gooUidStr, { POLAR_PRODUCT_ID : null } ) ).errCodStr ).toBe( 'unavailable' );          // What: No Product Check. Why: Nothing can be sold without the product. How: This expects the call refused with it unset.
	expect( ( await calRunFun( gooUidStr, { POLAR_ACCESS_TOKEN : null } ) ).errCodStr ).toBe( 'unavailable' );        // What: No Token Check. Why: Polar can't be asked without the token. How: This expects the call refused with it unset.
	expect( ( await calRunFun( gooUidStr, {}, false ) ).errCodStr ).toBe( 'internal' );                                // What: Polar Failure Check. Why: The app tells the buyer to try again. How: This expects the call refused when Polar fails.
	expect( await calRunFun( gooUidStr ) ).toEqual( { reqLisArr : [ { bodObj : { customer_email : expect.stringMatching( /^bob-/ ), external_customer_id : gooUidStr, metadata : { firebaseUid : gooUidStr }, products : [ PRO_IDE_STR ], success_url : 'https://comehang.app/?purchase=done' }, urlStr : 'https://sandbox-api.polar.sh/v1/checkouts/' } ], valAny : { urlValStr : 'https://sandbox.polar.sh/checkout/c1' } } ); // What: Checkout Check. Why: The app opens the checkout, the webhook finds the buyer by the tags, and the buyer returns to the app. How: This expects the address and one request to Polar with the product, tags, email, and return address.


} );

// #endregion Module Init


