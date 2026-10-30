


// #region Imports

import { readFileSync } from 'node:fs'; // What: Read File Sync. Why: The job arrives on standard input. How: This reads it whole.


import type * as PurModTyp from '../../functions/src/purchase.ts'; // What: Purchase Module Type. Why: The functions are loaded at run time from their build, typed by their source. How: This types the module.

// #endregion Imports



/**
 * purchase-child.ts = Purchase Child
 *
 * @summary
 * Runs one of the purchase functions in a Node process of its own, for the
 * functions suite, whose Playwright loader can't link the HTTP functions'
 * module. The parent sends a job as JSON on standard input: the Polar
 * settings to give the environment, then either a webhook delivery, which
 * runs the handler with a stand-in request and response, or a checkout call
 * as an identity, with Polar's API stood in to answer or fail. The result,
 * the webhook's status or the call's value or error code with what Polar
 * was asked, is printed as JSON on the last line. The emulators' addresses
 * come from the parent's environment.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type JobValTyp = { envObj : Record< string, string | null >, heaObj? : Record< string, string >, kinStr : 'call' | 'web', metStr? : string, polOkaBoo? : boolean, rawStr? : string, uidStr? : string }; // What: Job Value Type. Why: The parent describes one run. How: This types the settings, the kind, and each kind's inputs.

// #endregion Types



// #region Constants

const PUR_LIB_STR = '../../functions/lib/purchase.js'; // What: Purchase Library String. Why: The functions run from their build, which npm run test:functions makes first. How: This is its path, from this file.

// #endregion Constants



// #region Module State

const JOB_VAL_OBJ = JSON.parse( readFileSync( 0, 'utf8' ) ) as JobValTyp; // What: Job Value Object. Why: The parent sends the run's details. How: This reads standard input. // What: Type Assertion Note. Why: The parent writes a job of this shape. How: The as reads it so.
const REQ_LIS_ARR : { bodObj : unknown, urlStr : string }[] = [];         // What: Request List Array. Why: The parent checks what Polar was asked. How: This collects each request.

// #endregion Module State



// #region Module Init

for ( const [ envNamStr, envValStr ] of Object.entries( JOB_VAL_OBJ.envObj ) ) { // What: Environment Loop. Why: The functions read Polar's settings from the environment, as deployed. How: This sets each, or unsets one given as null.


	if ( envValStr === null ) delete process.env[ envNamStr ]; // What: Unset Branch. Why: A setting can be missing. How: This unsets it.

	else process.env[ envNamStr ] = envValStr; // What: Set Branch. Why: A setting is given. How: This sets it.


}



globalThis.fetch = async ( urlValAny : unknown, iniValObj? : RequestInit ) => { // What: Polar Stand-In. Why: No real checkout should be made. How: This records each request and answers with a checkout's address, or an error when asked to fail.


	REQ_LIS_ARR.push( { bodObj : JSON.parse( String( iniValObj?.body ) ), urlStr : String( urlValAny ) } ); // What: Request Record Call. Why: The parent checks the request. How: This keeps its address and body.



	return JOB_VAL_OBJ.polOkaBoo === false ? new Response( 'down', { status : 500 } ) : Response.json( { url : 'https://sandbox.polar.sh/checkout/c1' } ); // What: Answer Return. Why: Polar answers or fails. How: This returns the checkout's address, or a 500.


};



const PUR_MOD_OBJ = await import( PUR_LIB_STR ) as typeof PurModTyp; // What: Purchase Module Object. Why: The functions run here. How: This loads their build once the settings are set. // What: Type Assertion Note. Why: The build has no types of its own. How: The as reads it as the source module's shape.


if ( JOB_VAL_OBJ.kinStr === 'web' ) { // What: Webhook Branch. Why: A delivery runs the webhook. How: This calls its handler with stand-ins and prints the status.


	const resRecObj = { stsNum : 0 }; // What: Response Record Object. Why: The parent reads the status. How: This holds it.


	await ( PUR_MOD_OBJ.polWebFun as unknown as ( reqValObj : unknown, resValObj : unknown ) => Promise< void > )( // What: Handler Call. Why: The webhook runs with the parent's request. How: This calls it with a stand-in request and response. // What: Type Assertion Note. Why: An HTTP function is a request handler, which its type hides. How: The as reads it as one.


		{ get : ( heaNamStr : string ) => JOB_VAL_OBJ.heaObj?.[ heaNamStr ], headers : JOB_VAL_OBJ.heaObj, method : JOB_VAL_OBJ.metStr, rawBody : Buffer.from( JOB_VAL_OBJ.rawStr ?? '' ) }, // What: Request Stand-In. Why: The handler reads the method, headers, and raw body. How: This supplies them.
		{ send : () => undefined, status ( stsNum : number ) { resRecObj.stsNum = stsNum; return this; } }                                                                                   // What: Response Stand-In. Why: The parent reads the status. How: This records it and allows a send.


	);


	console.log( JSON.stringify( { stsNum : resRecObj.stsNum } ) ); // What: Status Print. Why: The parent reads the last line. How: This prints the status.


}

else { // What: Call Branch. Why: A checkout call runs the callable. How: This calls its handler as the identity and prints the value or error code, with Polar's requests.


	const resValObj = await PUR_MOD_OBJ.cheCreFun.run( { auth : JOB_VAL_OBJ.uidStr === undefined ? undefined : { token : {}, uid : JOB_VAL_OBJ.uidStr }, data : {}, rawRequest : {} } as never ).then( ( valAny ) => ({ valAny }), ( errCatObj : { code? : string } ) => ({ errCodStr : errCatObj.code }) ); // What: Result Value Object. Why: A refusal is a result the parent checks. How: This runs the handler, settling with its value or its error's code. // What: Type Assertion Note. Why: The handler reads only the sign-in, while the request's type has many more fields. How: The as never lets the stand-in through.


	console.log( JSON.stringify( { ...resValObj, reqLisArr : REQ_LIS_ARR } ) ); // What: Result Print. Why: The parent reads the last line. How: This prints the result and Polar's requests.


}



process.exit( 0 ); // What: Exit Call. Why: The Admin SDK keeps connections open. How: This ends the process once the result is printed.

// #endregion Module Init


