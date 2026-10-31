


// #region Imports

import { doc                       } from 'firebase/firestore';           // What: Doc. Why: The created documents are read back. How: This builds a reference.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the group was created as it should be. How: This asserts on what the page and the emulator return.
import { getDoc                    } from 'firebase/firestore';           // What: Get Doc. Why: The created documents are read back. How: This reads one document.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The tests read what the page wrote, past the rules. How: This connects to the emulator.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Renaming and deleting run as the page's identity. How: This calls a module's function in the page.
import { test                      } from '@playwright/test';             // What: Test. Why: Each part of creating a group is its own test. How: This declares them.


import type { Bytes                } from 'firebase/firestore';           // What: Bytes. Why: Keys, names, and IVs come back as Firestore bytes. How: This types them.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Every read goes through one. How: This types it.

// #endregion Imports



/**
 * groups.spec.ts = Groups Spec
 *
 * @summary
 * Checks creating a group in a real browser, in each engine, against the
 * Emulator Suite, with the real security rules. Each test opens the app on
 * the dev server, imports the groups module the way the app will, runs it
 * in the page, and reads back what it wrote: the group, the creator's
 * membership, the invite, and the owned slot. A group key deleted from the
 * device is recovered from the member's own wrap, and names are tidied and
 * checked before anything is written.
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

type RunResTyp = { groIdeStr : string, keyRawStr : string, uidValStr : string }; // What: Run Result Type. Why: The page reports what the test needs to read and decrypt. How: This types the record groRunFun resolves with.

// #endregion Types



// #region Module State

let groEnvObj : RulesTestEnvironment; // What: Groups Environment Object. Why: Every read reaches the emulator through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const reaDocFun = async ( patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Read Document Function. Why: Tests check what the page wrote. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await groEnvObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Accounts are readable only by their owner. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};



// #region decNamFun

/**
 * decNamFun = Decrypt Name Function
 *
 * @summary
 * Reads a member's encrypted display name from the emulator and decrypts it
 * in Node with a group key the page reported, as any member's device would.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param resValObj - Result Value Object: What the page reported.
 *
 * @returns A promise that resolves with the decrypted name.
 *
 * @example
 * ```ts
 * decNamFun(resValObj) // => 'Alice'
 * ```
 *
*/

const decNamFun = async ( resValObj : RunResTyp ) : Promise< string > => { // What: Decrypt Name Function. Why: A member's name is stored encrypted under the group key. How: This reads and decrypts it.


	const memDatObj = await reaDocFun( `groups/${ resValObj.groIdeStr }/members/${ resValObj.uidValStr }` ) as Record< string, Bytes >;      // What: Member Data Object. Why: The encrypted name is in the membership. How: This reads it. // What: Type Assertion Note. Why: The fields read here are bytes. How: The as reads them as such.
	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( resValObj.keyRawStr, 'base64' ), 'AES-GCM', false, [ 'decrypt' ] ); // What: Key Value Object. Why: Node decrypts with the page's key. How: This imports it.

	const decTexBuf = await crypto.subtle.decrypt( { iv : memDatObj.iv.toUint8Array() as Uint8Array< ArrayBuffer >, name : 'AES-GCM' }, keyValObj, memDatObj.displayNameEnc.toUint8Array() as Uint8Array< ArrayBuffer > ); // What: Decrypted Text Buffer. Why: The name opens with the group key. How: This decrypts it with its IV. // What: Type Assertion Note. Why: toUint8Array returns an array over a plain buffer. How: The two as read them as such.



	return new TextDecoder().decode( decTexBuf ); // What: Name Return. Why: The test compares the name. How: This decodes it.


};

// #endregion decNamFun



// #region groRunFun

/**
 * groRunFun = Group Run Function
 *
 * @summary
 * Runs in the page: imports the groups module from the dev server, creates
 * a group with the names given, loads its key back through keyLoaFun, and
 * reports the group's ID, the key as base64, and the creator's UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param namValArr - Name Value Array: The group's name and the creator's
 *                    display name, as typed.
 *
 * @returns A promise that resolves with what the page saw.
 *
 * @example
 * ```ts
 * page.evaluate(groRunFun, [ 'Beach Day', 'Alice' ]) // => { groIdeStr, ... }
 * ```
 *
*/

const groRunFun = async ( namValArr : [ string, string ] ) : Promise< RunResTyp > => { // What: Group Run Function. Why: Creation is checked where it really runs. How: This creates a group in the page and reports its key.


	const pagModArr = [ '/src/state/groups.ts', '/src/state/identity.ts' ]; // What: Page Module Array. Why: The dev server serves the app's source by path. How: This names the modules the page uses.

	const [ groModObj, ideModObj ] = await Promise.all( pagModArr.map( ( modPatStr ) => import( /* @vite-ignore */ modPatStr ) ) ); // What: Page Modules. Why: The page runs the real modules. How: This imports both.

	const groIdeStr = await groModObj.groCreFun( ...namValArr ); // What: Group Identifier String. Why: The creation under test. How: This creates the group.
	const groKeyObj = await groModObj.keyLoaFun( groIdeStr );    // What: Group Key Object. Why: The test decrypts with the key the device holds. How: This loads it.
	const { uidValStr } = await ideModObj.ideEnsFun();           // What: UID Value String. Why: The creator's documents are under their UID. How: This reads the identity.

	const keyRawStr = btoa( String.fromCharCode( ...new Uint8Array( await crypto.subtle.exportKey( 'raw', groKeyObj ) ) ) ); // What: Key Raw String. Why: The test decrypts outside the page. How: This exports the group key, extractable by design, as base64.



	return { groIdeStr, keyRawStr, uidValStr }; // What: Result Return. Why: The test reads and decrypts with these. How: This returns the group's ID, its key, and the UID.


};

// #endregion groRunFun

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	groEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: Every read reaches the emulator through it. How: This connects to Firestore, where the group is written.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await groEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The modules run in the app's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.


} );



test( 'creating a group writes the group, its owner with a wrapped key and encrypted name, its invite, and the owned slot', async ( { page } ) => { // What: Creation Test. Why: A group is created whole, through the real rules, readable only with its key (Sections 6 and 11). How: This creates a group in the page, then reads back every document it wrote and checks each one's fields.


	const resValObj = await page.evaluate( groRunFun, [ 'Beach Day 🏖️', 'Ålice' ] as [ string, string ] ); // What: Result Value Object. Why: The creation runs in the page. How: This creates a group there. // What: Type Assertion Note. Why: A literal array types as string[]. How: The as reads it as the two names.


	const accDatObj = await reaDocFun( `accounts/${ resValObj.uidValStr }` );                                                                       // What: Account Data Object. Why: The group takes an owned slot. How: This reads the account.
	const groDatObj = await reaDocFun( `groups/${ resValObj.groIdeStr }` );                                                                         // What: Group Data Object. Why: The group itself. How: This reads it.
	const memDatObj = await reaDocFun( `groups/${ resValObj.groIdeStr }/members/${ resValObj.uidValStr }` ) as ( Record< string, Bytes > & { colorSlot : number } ) | undefined; // What: Member Data Object. Why: The creator's membership. How: This reads it. // What: Type Assertion Note. Why: The fields checked here are bytes, besides the color slot's number. How: The as reads them as such.
	const invDatObj = await reaDocFun( `invites/${ groDatObj?.currentInviteToken }` );                                                              // What: Invite Data Object. Why: The group's first invite. How: This reads the one the group names.

	expect( groDatObj ).toMatchObject( { chatTtlDays : 30, countedUid : resValObj.uidValStr, memberCount : 1, name : 'Beach Day 🏖️', ownerUid : resValObj.uidValStr, pendingOwnerUid : null, removedUids : {} } ); // What: Group Fields. Why: A new group starts with its creator as owner and only member. How: This expects its starting values.
	expect( invDatObj ).toMatchObject( { groupId : resValObj.groIdeStr, groupName : 'Beach Day 🏖️' } ); // What: Invite Fields. Why: The link opens this group and shows its name. How: This expects both.
	expect( accDatObj?.ownedGroups ).toEqual( { [ resValObj.groIdeStr ] : true } );                     // What: Owned Slot. Why: The group counts against the creator's caps. How: This expects it in the owned map alone.
	expect( memDatObj?.wrappedGroupKey.toUint8Array().length ).toBe( 105 );                             // What: Wrap Length. Why: A wrap is the throwaway public key and the wrapped key. How: This expects 105 bytes.
	expect( memDatObj?.colorSlot ).toBe( 0 );                                                           // What: Color Slot. Why: The creator wears the first member color. How: This expects slot 0.
	expect( memDatObj?.iv.toUint8Array().length ).toBe( 12 );                                           // What: IV Length. Why: The name's IV is 12 bytes. How: This expects 12.
	expect( await decNamFun( resValObj ) ).toBe( 'Ålice' );                                             // What: Name Decrypted. Why: The creator's name is stored encrypted and opens with the group key. How: This expects the name back.


} );



test( "a group key lost from the device is recovered from the member's own wrap", async ( { page } ) => { // What: Key Recovery Test. Why: Clearing the device's storage mustn't lose a group the identity still belongs to (Section 6). How: This creates a group, deletes its key from IndexedDB, reloads, and reads the name with the recovered key.


	const resValObj = await page.evaluate( groRunFun, [ 'Picnic', 'Bob' ] as [ string, string ] ); // What: Result Value Object. Why: A group to lose the key of. How: This creates one in the page. // What: Type Assertion Note. Why: A literal array types as string[]. How: The as reads it as the two names.


	await page.evaluate( ( groIdeStr ) => new Promise( ( resValFun ) => { // What: Key Delete Call. Why: The group key can be lost while the identity survives. How: This deletes the group's key record from IndexedDB.


		const opeReqObj = indexedDB.open( 'come-hang' ); // What: Open Request Object. Why: The record lives in the app's database. How: This opens it.


		opeReqObj.onsuccess = () => { // What: Open Handler. Why: The delete runs once the database is open. How: This deletes the record and closes the connection when it's done.


			const traValObj = opeReqObj.result.transaction( 'keys', 'readwrite' ); // What: Transaction Value Object. Why: The delete needs a writable transaction. How: This opens one on the key store.


			traValObj.objectStore( 'keys' ).delete( `group:${ groIdeStr }` ); // What: Record Delete Call. Why: The group's key is the thing lost. How: This deletes its record.

			traValObj.oncomplete = () => { // What: Complete Handler. Why: The page can reload once the delete has landed. How: This closes the connection and settles.


				opeReqObj.result.close(); // What: Close Call. Why: An open connection would hold the database. How: This closes it.

				resValFun( null ); // What: Settle Call. Why: The test waits for the delete. How: This settles the promise.


			};


		};


	} ), resValObj.groIdeStr );

	await page.reload(); // What: Relaunch Call. Why: A lost key is found when the app next opens the group. How: This reloads the page.


	const keyRawStr = await page.evaluate( async ( groIdeStr ) => { // What: Key Raw String. Why: The recovered key has to be the group's key. How: This loads it in the page and reports it as base64.


		const modPatStr = '/src/state/groups.ts';                       // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the groups module.
		const groModObj = await import( /* @vite-ignore */ modPatStr ); // What: Groups Module Object. Why: The page runs the real module. How: This imports it.
		const groKeyObj = await groModObj.keyLoaFun( groIdeStr );       // What: Group Key Object. Why: The key under test, recovered. How: This loads it.



		return btoa( String.fromCharCode( ...new Uint8Array( await crypto.subtle.exportKey( 'raw', groKeyObj ) ) ) ); // What: Key Return. Why: The test decrypts with it. How: This exports it as base64.


	}, resValObj.groIdeStr );

	expect( await decNamFun( { ...resValObj, keyRawStr } ) ).toBe( 'Bob' ); // What: Recovered Name. Why: The recovered key is the group's key. How: This expects the name to decrypt with it.


} );



test( 'names are tidied before saving, and a name outside its limits is refused before anything is written', async ( { page } ) => { // What: Name Test. Why: What a person types usually passes as they meant it, and an encrypted name is held to its limits by the app alone (Section 11.10). How: This creates a group with untidy names, then tries a bad group name and a bad display name, checking the names were saved tidied and the bad ones refused.


	const resValObj = await page.evaluate( groRunFun, [ '  Beach   Day ', '  Alice   Smith ' ] as [ string, string ] ); // What: Result Value Object. Why: Untidy names are tidied, not refused. How: This creates a group with extra spaces. // What: Type Assertion Note. Why: A literal array types as string[]. How: The as reads it as the two names.


	const refValArr = await page.evaluate( async () => { // What: Refusal Value Array. Why: Bad names are refused in the page. How: This tries both and reports each error's type.


		const modPatStr = '/src/state/groups.ts';                       // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the groups module.
		const groModObj = await import( /* @vite-ignore */ modPatStr ); // What: Groups Module Object. Why: The page runs the real module. How: This imports it.



		return Promise.all( [ groModObj.groCreFun( 'Bad <name>', 'Alice' ), groModObj.groCreFun( 'Picnic', 'Alice 2' ) ].map( ( creProObj ) => creProObj.then( () => 'created', ( errCatObj : Error ) => errCatObj.name ) ) ); // What: Refusals Return. Why: Each bad name must be refused as out of limits. How: This tries both and returns each error's name.


	} );

	expect( await decNamFun( resValObj ) ).toBe( 'Alice Smith' );                                                                              // What: Display Name Tidied. Why: Extra spaces go before saving. How: This expects the single-spaced name.
	expect( ( await reaDocFun( `groups/${ resValObj.groIdeStr }` ) )?.name ).toBe( 'Beach Day' );                                              // What: Group Name Tidied. Why: The rules refuse a name with extra spaces, so they go first. How: This expects the single-spaced name.
	expect( refValArr ).toEqual( [ 'RangeError', 'RangeError' ] );                                                                             // What: Bad Names Refused. Why: A group name with symbols and a display name with a number are outside their limits. How: This expects both refused as out of range.
	expect( Object.keys( ( await reaDocFun( `accounts/${ resValObj.uidValStr }` ) )?.ownedGroups ?? {} ) ).toEqual( [ resValObj.groIdeStr ] ); // What: Nothing Else Created. Why: A refused name writes nothing. How: This expects the account to own only the tidy group.


} );


test( 'a device with no identity lists no groups without starting Firebase', async ( { page } ) => { // What: First Visit List Test. Why: A first visit must start nothing, so nothing is created before the app is installed (Section 16). How: This watches the groups on a fresh device and checks it reported none, while Firebase's Auth and Firestore made none of their local databases.


	const [ groLisArr, datNamArr ] = await page.evaluate( async () => { // What: Page Results. Why: The first report is what the welcome screen reads, and Firebase starting would leave its databases behind. How: This watches in the page, then lists the page's databases.


		const modPatStr = '/src/state/groups.ts';                       // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the groups module.
		const groModObj = await import( /* @vite-ignore */ modPatStr ); // What: Groups Module Object. Why: The page runs the real module. How: This imports it.

		const firRepArr = await new Promise( ( resValFun ) => void groModObj.groWatFun( resValFun ) ); // What: First Report Array. Why: A device with no identity reports once. How: This resolves with that report.



		return [ firRepArr, ( await indexedDB.databases() ).map( ( datInfObj ) => datInfObj.name ) ]; // What: Results Return. Why: The test checks both. How: This returns the report and every database's name.


	} );

	expect( groLisArr ).toEqual( [] );                                                                        // What: No Groups. Why: A device that never acted belongs to no group. How: This expects an empty list.
	expect( datNamArr.filter( ( datNamStr ) => /^fire(base|store)/.test( String( datNamStr ) ) ) ).toEqual( [] ); // What: Firebase Not Started. Why: Auth and Firestore open their own databases as they start. How: This expects none of them.


} );



test( 'the group list follows the account as groups are created, renamed, and deleted, sorted by name', async ( { page } ) => { // What: Group List Test. Why: The rail and the group switcher show every group by name and keep up as groups change. How: This creates two groups, watches them, then renames one and deletes the other, checking each report.


	const groIdeArr = await page.evaluate( async () => { // What: Group Identifier Array. Why: The list needs groups to report, and the test changes them later. How: This creates two groups in the page and starts watching.


		const modPatStr = '/src/state/groups.ts';                                // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the groups module.
		const groModObj = await import( /* @vite-ignore */ modPatStr );          // What: Groups Module Object. Why: The page runs the real module. How: This imports it.
		const zebIdeStr = await groModObj.groCreFun( 'Zebra Club', 'Alice' );    // What: Zebra Identifier String. Why: The first group, named to sort last. How: This creates it.
		const appIdeStr = await groModObj.groCreFun( 'Apple Pickers', 'Alice' ); // What: Apple Identifier String. Why: The second group, named to sort first. How: This creates it.


		await groModObj.groWatFun( ( groRecArr : unknown ) => { // What: Watch Call. Why: The test reads the first report and each one after it. How: This keeps the first and the latest on the page's global object.


			if ( !Reflect.has( globalThis, 'groFirArr' ) ) Reflect.set( globalThis, 'groFirArr', groRecArr ); // What: First Report Set. Why: The list shouldn't flash in partly read. How: This keeps the first report.

			Reflect.set( globalThis, 'groLisArr', groRecArr ); // What: Latest Report Set. Why: Each check reads the latest report. How: This keeps it.


		} );



		return [ appIdeStr, zebIdeStr ]; // What: Identifiers Return. Why: The test renames and deletes these. How: This returns both IDs.


	} );

	const repGetFun = () => page.evaluate( () => Reflect.get( globalThis, 'groLisArr' ) ); // What: Report Get Function. Why: Each check polls the latest report. How: This reads it from the page.


	await expect.poll( repGetFun ).toMatchObject( [ { ideStr : groIdeArr[ 0 ], namStr : 'Apple Pickers', ownBoo : true }, { ideStr : groIdeArr[ 1 ], namStr : 'Zebra Club', ownBoo : true } ] ); // What: Sorted List Assertion. Why: Both groups show by name, owned by their creator. How: This waits for the report sorted by name.

	expect( await page.evaluate( () => Reflect.get( globalThis, 'groFirArr' ) ) ).toEqual( await repGetFun() ); // What: Whole First Report Assertion. Why: The first report waits for every group's name. How: This expects it to match the full list.


	await runPagFun( page, '/src/state/groups.ts', 'groSetFun', groIdeArr[ 1 ], 'Aardvarks', 30 ); // What: Rename Call. Why: A rename shows at once. How: This renames the Zebra group so it sorts first.


	await expect.poll( repGetFun ).toMatchObject( [ { ideStr : groIdeArr[ 1 ], namStr : 'Aardvarks', ownBoo : true }, { ideStr : groIdeArr[ 0 ], namStr : 'Apple Pickers', ownBoo : true } ] ); // What: Renamed List Assertion. Why: The new name shows in its sorted place. How: This waits for the report with the renamed group first.


	await runPagFun( page, '/src/state/groups.ts', 'groDelFun', groIdeArr[ 0 ] ); // What: Delete Call. Why: A deleted group leaves the list. How: This deletes the Apple group.


	await expect.poll( repGetFun ).toMatchObject( [ { ideStr : groIdeArr[ 1 ], namStr : 'Aardvarks', ownBoo : true } ] ); // What: Deleted List Assertion. Why: The deleted group drops out. How: This waits for the report with one group left.


} );

// #endregion Module Init


