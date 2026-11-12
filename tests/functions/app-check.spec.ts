


// #region Imports

import { execFile      } from 'node:child_process'; // What: Exec File. Why: The functions run in a Node process of their own. How: This starts one.
import { expect        } from '@playwright/test';   // What: Expect. Why: Each check passes only when the callables answered as they should. How: This asserts on their answers.
import { fileURLToPath } from 'node:url';           // What: File URL To Path. Why: The child script is found beside the suite. How: This turns its address into a path.
import { test          } from '@playwright/test';   // What: Test. Why: Each way the functions run is its own test. How: This declares them.

// #endregion Imports



/**
 * app-check.spec.ts = App Check Spec
 *
 * @summary
 * Checks that the functions the app calls refuse a call without an App
 * Check token as deployed, and take one under the emulator, where the app
 * runs without App Check (ARCHITECTURE.md Section 14). Playwright's loader
 * can't link the HTTP functions' modules, so the calls are made in
 * tests/support/app-check-child.ts, which serves the functions' build over a
 * local HTTP server and calls each with no App Check token and no sign-in. A
 * refusal for App Check and one for the missing sign-in share a status, so
 * the error's message tells them apart.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type AnsRecTyp = Record< string, { mesStr : string, stsNum : number } >; // What: Answer Record Type. Why: The child reports each callable's answer by name. How: This types the record.

// #endregion Types



// #region Constants

const CAL_NAM_ARR = [ 'cheCreFun', 'decOffFun', 'delDatFun', 'delGroFun' ];                     // What: Callable Name Array. Why: Every function the app calls is checked. How: This lists their exports.
const CHI_PAT_STR = fileURLToPath( new URL( '../support/app-check-child.ts', import.meta.url ) ); // What: Child Path String. Why: Each run starts the child script. How: This is its path.

// #endregion Constants



// #region Helpers

// #region chiRunFun

/**
 * chiRunFun = Child Run Function
 *
 * @summary
 * Runs the child script with the functions as under the emulator or as
 * deployed, and resolves with the answers it prints on its last line.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param emuValBoo - Emulator Value Boolean: Whether the functions run as
 *                    under the emulator.
 *
 * @returns A promise that resolves with each callable's answer.
 *
 * @example
 * ```ts
 * chiRunFun(false) // => { delGroFun : { mesStr : 'Unauthenticated', stsNum : 401 }, ... }
 * ```
 *
*/

const chiRunFun = ( emuValBoo : boolean ) : Promise< AnsRecTyp > => new Promise( ( resValFun, rejValFun ) => { // What: Child Run Function. Why: Playwright's loader can't link the functions, which a plain Node process can. How: This runs the child and parses its last line.


	const chiProObj = execFile( process.execPath, [ CHI_PAT_STR ], ( errCatObj, outTexStr ) => { // What: Child Process Object. Why: Each run needs a fresh process, since the options are read as the functions load. How: This starts the child script with Node and collects its output.


		if ( errCatObj ) { rejValFun( errCatObj ); return; } // What: Failure Guard. Why: A crash in the child is a test failure. How: This rejects with it.



		resValFun( JSON.parse( outTexStr.trim().split( '\n' ).at( -1 )! ) as AnsRecTyp ); // What: Result Call. Why: The child prints its answers last. How: This parses that line. // What: Non-Null Note. Why: A child that exited cleanly printed a line. How: The ! says so. // What: Type Assertion Note. Why: JSON.parse returns any. How: The as reads the child's record.


	} );


	chiProObj.stdin!.end( JSON.stringify( { emuValBoo } ) ); // What: Job Send Call. Why: The child reads its job from its input. How: This writes the job and closes the input. // What: Non-Null Note. Why: execFile opens the child's input by default. How: The ! reads it as present.


} );

// #endregion chiRunFun

// #endregion Helpers



// #region Module Init

test( 'as deployed, every function the app calls refuses a call without an App Check token', async () => { // What: Deployed Test. Why: A function the app calls should answer only the app itself (Section 14). How: This calls each as deployed with no token and checks each refuses it for App Check.


	const ansRecObj = await chiRunFun( false ); // What: Answer Record Object. Why: Each callable's answer is checked. How: This runs them as deployed.


	expect( Object.keys( ansRecObj ).sort() ).toEqual( CAL_NAM_ARR ); // What: Callables Assertion. Why: Every callable has to be checked. How: This expects all four answered.


	for ( const calNamStr of CAL_NAM_ARR ) expect( ansRecObj[ calNamStr ] ).toEqual( { mesStr : 'Unauthenticated', stsNum : 401 } ); // What: Refusal Loop. Why: Each refuses before its own code runs, which would say to sign in. How: This expects App Check's refusal from each.


} );



test( 'under the emulator, every function the app calls takes a call without an App Check token', async () => { // What: Emulator Test. Why: The app runs without App Check in development and the suites. How: This calls each as under the emulator with no token and checks each reaches its own sign-in check.


	const ansRecObj = await chiRunFun( true ); // What: Answer Record Object. Why: Each callable's answer is checked. How: This runs them as under the emulator.


	expect( Object.keys( ansRecObj ).sort() ).toEqual( CAL_NAM_ARR ); // What: Callables Assertion. Why: Every callable has to be checked. How: This expects all four answered.


	for ( const calNamStr of CAL_NAM_ARR ) expect( ansRecObj[ calNamStr ] ).toEqual( { mesStr : 'Sign in first.', stsNum : 401 } ); // What: Sign-In Loop. Why: Past App Check, each callable's own code asks for a sign-in. How: This expects that answer from each.


} );

// #endregion Module Init


