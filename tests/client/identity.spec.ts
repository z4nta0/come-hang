


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The published documents are read back. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the identity is as it should be. How: This asserts on what the page and the emulator return.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The published documents are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read what the page published, past the rules. How: This connects to the emulator.
import { test                      } from '@playwright/test';             // What: Test. Why: Each part of the identity is its own test. How: This declares them.


import type { Bytes                } from 'firebase/firestore';           // What: Bytes. Why: The public key comes back as Firestore bytes. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read goes through one. How: This types it.

// #endregion Imports



/**
 * identity.spec.ts = Identity Spec
 *
 * @summary
 * Checks the identity bootstrap in a real browser, in each engine, since
 * WebCrypto and IndexedDB differ between them. Each test opens the app on
 * the dev server, which runs against the local Emulator Suite, imports the
 * identity module the way the app will, and runs it in the page; the test
 * then reads what it published from the Firestore emulator. A page with no
 * group action is checked to make no Firebase connection at all.
 *
 * Sections:
 *  - Types
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type RunResTyp = { priExpBoo : boolean, pubKeyStr : string, samParBoo : boolean, uidValStr : string }; // What: Run Result Type. Why: The page reports what the bootstrap gave it. How: This types the record ideRunFun resolves with.

// #endregion Types



// #region Module State

let ideEnvObj : RulesTestEnvironment; // What: Identity Environment Object. Why: Every read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

// #region ideRunFun

/**
 * ideRunFun = Identity Run Function
 *
 * @summary
 * Runs in the page: imports the identity module from the dev server, calls
 * ideEnsFun twice at once, and reports the UID, the raw public key in
 * base64, whether both calls got the same key pair, and whether the private
 * key could be exported.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with what the bootstrap gave the page.
 *
 * @example
 * ```ts
 * page.evaluate(ideRunFun) // => { priExpBoo, pubKeyStr, ... }
 * ```
 *
*/

const ideRunFun = async () : Promise< RunResTyp > => { // What: Identity Run Function. Why: The bootstrap is checked where it really runs. How: This calls it in the page and reports its results.


	const modPatStr = '/src/state/identity.ts';                                                             // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the identity module.
	const ideModObj = await import( /* @vite-ignore */ modPatStr );                                         // What: Identity Module Object. Why: The page runs the real module. How: This imports it from the dev server.
	const [ ideOneObj, ideTwoObj ] = await Promise.all( [ ideModObj.ideEnsFun(), ideModObj.ideEnsFun() ] ); // What: Identity One And Two. Why: Two actions at once must share one bootstrap. How: This calls it twice together.
	const rawKeyBuf = await crypto.subtle.exportKey( 'raw', ideOneObj.keyParObj.publicKey );                // What: Raw Key Buffer. Why: The page reports the public key it holds. How: This exports it as the raw point.


	const priExpBoo = await crypto.subtle.exportKey( 'pkcs8', ideOneObj.keyParObj.privateKey ).then( () => true, () => false ); // What: Private Exportable Boolean. Why: The private key must never be readable by script. How: This tries to export it and records whether that worked.



	return { priExpBoo, pubKeyStr : btoa( String.fromCharCode( ...new Uint8Array( rawKeyBuf ) ) ), samParBoo : ideOneObj.keyParObj === ideTwoObj.keyParObj, uidValStr : ideOneObj.uidValStr }; // What: Result Return. Why: The test compares what the page saw. How: This returns the four results, the key as base64.


};

// #endregion ideRunFun



const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check what the page published. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await ideEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: The account is readable only by its owner. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	ideEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read reaches the emulator through it. How: This connects to Firestore, where the identity publishes.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await ideEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( 'opening the app with no group action makes no Firebase connection', async ( { page } ) => { // What: Lazy Connection Test. Why: On iOS nothing may be created before the app is installed, and a visitor who hasn't acted shouldn't connect (Section 16). How: This records every request a page load makes and checks none reach the emulators.


	const reqUrlArr : string[] = []; // What: Request URL Array. Why: Every request the page makes is checked. How: This collects their addresses.


	page.on( 'request', ( reqValObj ) => reqUrlArr.push( reqValObj.url() ) ); // What: Request Listener. Why: A Firebase connection shows up as a request to an emulator port. How: This records each request.

	await page.goto( '/' ); // What: Home Visit. Why: A first visit is the case under test. How: This opens the app.

	await page.waitForLoadState( 'networkidle' ); // What: Idle Wait. Why: A late connection would still count. How: This waits until the page stops making requests.

	expect( reqUrlArr.filter( ( urlValStr ) => /:82[0-4]0\//.test( urlValStr ) ) ).toEqual( [] ); // What: No Emulator Requests. Why: Nothing should connect before a group action. How: This expects no request to any emulator port.


} );



test( 'the identity signs in once, keeps its key pair private and across reloads, replaces a lost one, and publishes its key and an empty account', async ( { page } ) => { // What: Bootstrap Test. Why: Every group action needs the identity's parts, made once and kept (Sections 6 and 8). How: This runs the bootstrap, reloads and runs it again, deletes the key store and runs it once more, and checks what it published each time.


	await page.goto( '/' ); // What: Home Visit. Why: The bootstrap runs in the app's own page. How: This opens it.


	const fstResObj = await page.evaluate( ideRunFun ); // What: First Result Object. Why: The first run creates everything. How: This runs the bootstrap in the page.


	await page.reload(); // What: Reload Call. Why: The identity has to survive the page closing. How: This reloads it.


	const secResObj = await page.evaluate( ideRunFun ); // What: Second Result Object. Why: A later run must reuse what the first made. How: This runs the bootstrap again.


	await page.evaluate( () => new Promise( ( resValFun ) => { indexedDB.deleteDatabase( 'come-hang' ).onsuccess = resValFun; } ) ); // What: Key Store Delete Call. Why: The key pair can be lost while the sign-in survives. How: This deletes the app's key database in the page.

	await page.reload(); // What: Relaunch Call. Why: A lost key store is found when the app next launches. How: This reloads the page.


	const thiResObj = await page.evaluate( ideRunFun ); // What: Third Result Object. Why: A lost key pair is replaced and republished. How: This runs the bootstrap after the loss.


	const accDatObj = await reaDocFun( `accounts/${ fstResObj.uidValStr }` );                                   // What: Account Data Object. Why: The account has to start empty. How: This reads it.
	const useDatObj = await reaDocFun( `users/${ fstResObj.uidValStr }` ) as { publicKey : Bytes } | undefined; // What: User Data Object. Why: The published key has to match the page's. How: This reads it. // What: Type Assertion Note. Why: The rules store the public key as bytes. How: The as reads the one field the test uses.

	expect( fstResObj.samParBoo ).toBe( true );                             // What: Shared Bootstrap. Why: Two actions at once mustn't make two key pairs. How: This expects both calls to have got the same pair.
	expect( fstResObj.priExpBoo ).toBe( false );                            // What: Private Key Sealed. Why: Script must never read the private key. How: This expects its export refused.
	expect( secResObj.uidValStr ).toBe( fstResObj.uidValStr );              // What: Same Identity. Why: The device keeps one identity. How: This expects the reload's UID to match.
	expect( secResObj.pubKeyStr ).toBe( fstResObj.pubKeyStr );              // What: Same Key Pair. Why: The key pair is kept in IndexedDB. How: This expects the reload's public key to match.
	expect( thiResObj.uidValStr ).toBe( fstResObj.uidValStr );              // What: Same Identity After Loss. Why: Losing the key store doesn't lose the sign-in. How: This expects the UID unchanged.
	expect( thiResObj.pubKeyStr ).not.toBe( fstResObj.pubKeyStr );          // What: New Key Pair. Why: A lost private key can't be recovered, so a new pair is made. How: This expects a different public key.
	expect( useDatObj?.publicKey.toBase64() ).toBe( thiResObj.pubKeyStr );  // What: Key Republished. Why: Approvers must wrap group keys with the key the device now holds. How: This expects the published key to be the new one.
	expect( accDatObj ).toEqual( { memberGroups : {}, ownedGroups : {} } ); // What: Empty Account. Why: An identity starts in no groups. How: This expects the account's two empty maps.


} );

// #endregion Module Init


