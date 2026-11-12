


// #region Imports

import { createServer } from 'node:http'; // What: Create Server. Why: A callable is reached over HTTP, where App Check is checked. How: This serves the callables on a local port.
import { readFileSync } from 'node:fs';   // What: Read File Sync. Why: The job arrives on standard input. How: This reads it whole.


import type { AddressInfo     } from 'node:net';  // What: Address Info. Why: The server's port is read once it listens. How: This types its address.
import type { IncomingMessage } from 'node:http'; // What: Incoming Message. Why: Each request is handed to a callable. How: This types it.
import type { ServerResponse  } from 'node:http'; // What: Server Response. Why: Each callable answers through one. How: This types it.

// #endregion Imports



/**
 * app-check-child.ts = App Check Child
 *
 * @summary
 * Runs the functions the app calls in a Node process of their own, for the
 * functions suite, whose Playwright loader can't link the HTTP functions'
 * modules. The parent sends a job as JSON on standard input, saying whether
 * the functions run as under the emulator or as deployed. The child loads
 * their build, serves each over a local HTTP server, calls each with no App
 * Check token and no sign-in, and prints each answer's status and error
 * message as JSON on the last line. The emulators' addresses come from the
 * parent's environment.
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

type CalHanTyp = ( reqValObj : unknown, resValObj : unknown ) => void; // What: Callable Handler Type. Why: A deployed callable is a request handler. How: This types it as one.

// #endregion Types



// #region Constants

const CAL_MOD_ARR = [ // What: Callable Module Array. Why: Every function the app calls is checked. How: This names each one's build and export.


	[ '../../functions/lib/data-deletion.js', 'delDatFun' ],  // What: Data Deletion Row. Why: Deleting someone's data is called by the app. How: This names its build and export.
	[ '../../functions/lib/group-deletion.js', 'delGroFun' ], // What: Group Deletion Row. Why: Deleting a group is called by the app. How: This names its build and export.
	[ '../../functions/lib/offer-decline.js', 'decOffFun' ],  // What: Offer Decline Row. Why: Declining an offer is called by the app. How: This names its build and export.
	[ '../../functions/lib/purchase.js', 'cheCreFun' ]        // What: Purchase Row. Why: Starting a checkout is called by the app. How: This names its build and export.


] as const; // What: Type Assertion Note. Why: Each row's two strings are read as a fixed pair. How: The as const keeps them as a tuple.

// #endregion Constants



// #region Module State

const JOB_VAL_OBJ = JSON.parse( readFileSync( 0, 'utf8' ) ) as { emuValBoo : boolean }; // What: Job Value Object. Why: The parent says how the functions run. How: This reads standard input. // What: Type Assertion Note. Why: The parent writes a job of this shape. How: The as reads it so.

// #endregion Module State



// #region Module Init

if ( JOB_VAL_OBJ.emuValBoo ) process.env.FUNCTIONS_EMULATOR = 'true'; // What: Emulator Branch. Why: Under the emulator, the app calls the functions without App Check. How: This marks the runtime as the emulator does.

else delete process.env.FUNCTIONS_EMULATOR; // What: Deployed Branch. Why: Deployed, the functions run without the emulator's mark. How: This removes it.



const hanValMap = new Map< string, CalHanTyp >(); // What: Handler Value Map. Why: Each request is routed to its callable. How: This holds each handler by its export's name.


for ( const [ libPatStr, expNamStr ] of CAL_MOD_ARR ) hanValMap.set( expNamStr, Reflect.get( await import( libPatStr ) as object, expNamStr ) as CalHanTyp ); // What: Module Loop. Why: The options are read as each module loads, after the mark is set. How: This loads each build and keeps its callable. // What: Type Assertion Note. Why: A dynamic import is untyped, and a callable is a handler. How: The as reads the module as an object and its export as a handler.



const serValObj = createServer( ( reqValObj : IncomingMessage, resValObj : ServerResponse ) => { // What: Server Value Object. Why: A callable reads a request and writes a response the way Express shapes them. How: This reads each body and hands an Express-like request and response to the callable its path names.


	let bodTexStr = ''; // What: Body Text String. Why: The callable reads the parsed body. How: This collects it.


	reqValObj.on( 'data', ( chuValObj : Buffer ) => { bodTexStr += chuValObj.toString(); } ); // What: Data Listener. Why: The body arrives in chunks. How: This joins them.

	reqValObj.on( 'end', () => { // What: End Listener. Why: The callable runs once the body is whole. How: This shapes the request and response and calls it.


		Object.assign( reqValObj, { body : JSON.parse( bodTexStr ), header : ( heaNamStr : string ) => reqValObj.headers[ heaNamStr.toLowerCase() ] } ); // What: Request Shape Call. Why: A callable reads the parsed body and headers by name, as Express gives them. How: This adds both.

		Object.assign( resValObj, { send : ( bodValAny : unknown ) => { resValObj.setHeader( 'Content-Type', 'application/json' ); resValObj.end( JSON.stringify( bodValAny ) ); }, status : ( stsNum : number ) => { resValObj.statusCode = stsNum; return resValObj; } } ); // What: Response Shape Call. Why: A callable answers through Express's status and send. How: This adds both.

		hanValMap.get( reqValObj.url!.slice( 1 ) )!( reqValObj, resValObj ); // What: Handler Call. Why: The callable answers the call. How: This calls the one the path names. // What: Non-Null Note. Why: A server request always has a path, and the child only calls paths it serves. How: The ! reads both as present.


	} );


} );



await new Promise< void >( ( resValFun ) => serValObj.listen( 0, '127.0.0.1', resValFun ) ); // What: Listen Call. Why: The calls need the server up. How: This waits for it on a free port.


const porValNum = ( serValObj.address() as AddressInfo ).port; // What: Port Value Number. Why: The calls go to the server's port. How: This reads it. // What: Type Assertion Note. Why: A server listening on a port reports an address with one. How: The as reads it so.
const resValObj : Record< string, { mesStr : string, stsNum : number } > = {}; // What: Result Value Object. Why: The parent checks each callable's answer. How: This holds each one's status and message by name.


for ( const expNamStr of hanValMap.keys() ) { // What: Call Loop. Why: Every callable is checked. How: This calls each with no App Check token and no sign-in, keeping its answer.


	const ansValObj = await fetch( `http://127.0.0.1:${ porValNum }/${ expNamStr }`, { body : JSON.stringify( { data : {} } ), headers : { 'Content-Type' : 'application/json' }, method : 'POST' } ); // What: Answer Value Object. Why: The call has to look like the app's, short of its tokens. How: This posts an empty call as a callable expects it.


	resValObj[ expNamStr ] = { mesStr : String( Reflect.get( Object( Reflect.get( Object( await ansValObj.json() ), 'error' ) ), 'message' ) ), stsNum : ansValObj.status }; // What: Result Assignment. Why: A refusal for App Check and one for a missing sign-in share a status, so their messages tell them apart. How: This keeps the status and the error's message.


}



console.log( JSON.stringify( resValObj ) ); // What: Result Print. Why: The parent reads the last line. How: This prints every answer.

process.exit( 0 ); // What: Exit Call. Why: The server and the Admin SDK keep the process open. How: This ends it once the result is printed.

// #endregion Module Init


