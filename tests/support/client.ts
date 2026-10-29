


// #region Imports

import { doc    } from 'firebase/firestore'; // What: Doc. Why: A document is read by path. How: This builds a reference.
import { expect } from '@playwright/test';   // What: Expect. Why: A send is retried until it lands. How: This polls it.
import { getDoc } from 'firebase/firestore'; // What: Get Doc. Why: The tests read back what the pages wrote. How: This reads one document.
import { test   } from '@playwright/test';   // What: Test. Why: The client specs need a second identity beside the page's own. How: This is extended with a second page.


import type { Bytes                } from 'firebase/firestore';           // What: Bytes. Why: A member's encrypted name comes back as Firestore bytes. How: This types it.
import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers run code in either identity's page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: Reads go through the spec's environment. How: This types it.

// #endregion Imports



/**
 * client.ts = Client Checks
 *
 * @summary
 * Helpers for the client suite's checks with more than one identity. A
 * spec's tests take the extended test object, which adds a second page in a
 * browser context of its own, so each page is its own device with its own
 * identity and storage. The helpers call the app's own exported functions in
 * either page, export a group key out of one, read what the pages wrote with
 * the rules off, and decrypt a member's name outside the browser, as any
 * member's device would.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const pagTesObj = test.extend< { secPagObj : Page } >({ // What: Page Test Object. Why: A test with two identities needs a second device, apart from the test's own page. How: This adds a page in a second browser context.


	secPagObj : async ( { baseURL, browser }, useFixFun ) => { // What: Second Page Object. Why: A second context is a second device, with its own identity. How: This opens the app in a new context and closes it after the test.


		const cotValObj = await browser.newContext( { baseURL } ); // What: Context Value Object. Why: A context keeps its own IndexedDB and sign-in. How: This opens one on the dev server.
		const pagValObj = await cotValObj.newPage();               // What: Page Value Object. Why: The second identity's steps run here. How: This opens a page in it.


		await pagValObj.goto( '/' ); // What: Home Visit. Why: The dev server serves the modules there. How: This opens the app.

		await useFixFun( pagValObj ); // What: Fixture Use Call. Why: The test runs with the page. How: This hands it over until the test ends.

		await cotValObj.close(); // What: Context Close Call. Why: The second context shouldn't outlive its test. How: This closes it.


	}


});

// #endregion Constants



// #region Helpers

// #region docReaFun

/**
 * docReaFun = Document Read Function
 *
 * @summary
 * Reads one document from the emulator with the rules off, so a test can
 * check what a page wrote wherever it sits.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The spec's environment.
 * @param patValStr - Path Value String: The document's path.
 *
 * @returns A promise that resolves with the document's fields, or undefined
 *          when it's absent.
 *
 * @example
 * ```ts
 * docReaFun(envTesObj, 'groups/Xk3...') // => { memberCount : 2, ... }
 * ```
 *
*/

const docReaFun = async ( envTesObj : RulesTestEnvironment, patValStr : string ) : Promise< Record< string, unknown > | undefined > => { // What: Document Read Function. Why: Tests check what the pages wrote. How: This reads a document with the rules off and returns its fields.


	let docDatObj : Record< string, unknown > | undefined; // What: Document Data Object. Why: The read happens inside the rules-off callback. How: This carries its result out.


	await envTesObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { docDatObj = ( await getDoc( doc( cotAdmObj.firestore(), patValStr ) ) ).data(); } ); // What: Document Read Call. Why: Accounts and groups aren't readable by the test itself. How: This reads with the rules off.



	return docDatObj; // What: Document Return. Why: The test compares it, undefined when it's absent. How: This returns it.


};

// #endregion docReaFun



// #region decNamFun

/**
 * decNamFun = Decrypt Name Function
 *
 * @summary
 * Reads a member's encrypted display name from the emulator and decrypts it
 * in Node with a group key a page reported, as any member's device would.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The spec's environment.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The member's UID.
 * @param keyRawStr - Key Raw String: The group key, as base64.
 *
 * @returns A promise that resolves with the decrypted name.
 *
 * @example
 * ```ts
 * decNamFun(envTesObj, 'Xk3...', 'u9F...', 'q2...') // => 'Dana Lee'
 * ```
 *
*/

const decNamFun = async ( envTesObj : RulesTestEnvironment, groIdeStr : string, uidValStr : string, keyRawStr : string ) : Promise< string > => { // What: Decrypt Name Function. Why: A member's name is stored encrypted under the group key. How: This reads and decrypts it.


	const memDatObj = await docReaFun( envTesObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) as Record< string, Bytes >;     // What: Member Data Object. Why: The encrypted name is in the membership. How: This reads it. // What: Type Assertion Note. Why: The name and IV are stored as bytes. How: The as reads them as such.
	const keyValObj = await crypto.subtle.importKey( 'raw', Buffer.from( keyRawStr, 'base64' ), 'AES-GCM', false, [ 'decrypt' ] ); // What: Key Value Object. Why: Node decrypts with the page's key. How: This imports it.

	const decTexBuf = await crypto.subtle.decrypt( { iv : memDatObj.iv.toUint8Array() as Uint8Array< ArrayBuffer >, name : 'AES-GCM' }, keyValObj, memDatObj.displayNameEnc.toUint8Array() as Uint8Array< ArrayBuffer > ); // What: Decrypted Text Buffer. Why: The name opens with the group key alone. How: This decrypts it. // What: Type Assertion Note. Why: toUint8Array returns an array over a plain buffer. How: The two as read them as such.



	return new TextDecoder().decode( decTexBuf ); // What: Name Return. Why: The test compares the name. How: This decodes it.


};

// #endregion decNamFun



// #region joiWaiFun

/**
 * joiWaiFun = Join Wait Function
 *
 * @summary
 * Waits until the test machine's clock is 3 seconds past a member's join
 * time. Under WSL2 the system clock steps back by a couple of seconds now
 * and then, when Windows corrects its drift (measured 2026-10-29, at about
 * 2.4 seconds), so a time stamped just after a join can fall before it, and
 * a message sent then would sit outside what the member may read.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The spec's environment.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The member's UID.
 *
 * @returns A promise that settles once the join time has passed, with no
 *          value.
 *
 * @example
 * ```ts
 * joiWaiFun(envTesObj, 'Xk3...', 'u9F...') // => Promise<void>
 * ```
 *
*/

const joiWaiFun = async ( envTesObj : RulesTestEnvironment, groIdeStr : string, uidValStr : string ) : Promise< void > => { // What: Join Wait Function. Why: The test machine's clock can step back by seconds, while production's servers don't. How: This waits out a step for one join.


	const joiTimNum = ( ( await docReaFun( envTesObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) )?.joinedAt as { toMillis : () => number } ).toMillis(); // What: Join Time Number. Why: Messages count from this time. How: This reads the member's join time in milliseconds. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads its conversion.


	await expect.poll( () => Date.now(), { timeout : 15000 } ).toBeGreaterThan( joiTimNum + 3000 ); // What: Clock Poll. Why: A message sent now has to come after the join, even if the clock steps back. How: This waits until the clock is 3 seconds past it, more than the steps measured.


};

// #endregion joiWaiFun



// #region keyRawFun

/**
 * keyRawFun = Key Raw Function
 *
 * @summary
 * Loads a group's key in a page, the way that identity's app would, and
 * resolves with it exported as base64, since a key itself can't leave the
 * page.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The identity's page.
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the key as base64.
 *
 * @example
 * ```ts
 * keyRawFun(page, 'Xk3...') // => 'q2...'
 * ```
 *
*/

const keyRawFun = ( pagValObj : Page, groIdeStr : string ) : Promise< string > => pagValObj.evaluate( async ( groIdeStr ) => { // What: Key Raw Function. Why: Two members have to hold the same group key. How: This loads the key in the page and exports it as base64.


	const modPatStr = '/src/state/groups.ts';                       // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the groups module.
	const groModObj = await import( /* @vite-ignore */ modPatStr ); // What: Groups Module Object. Why: The page runs the real module. How: This imports it.
	const groKeyObj = await groModObj.keyLoaFun( groIdeStr );       // What: Group Key Object. Why: The key this identity holds. How: This loads it.



	return btoa( String.fromCharCode( ...new Uint8Array( await crypto.subtle.exportKey( 'raw', groKeyObj ) ) ) ); // What: Key Return. Why: A key can't leave the page as is. How: This exports it as base64.


}, groIdeStr ); // What: Page Argument. Why: The callback runs in the page, apart from the test's variables. How: This passes the group's ID in.

// #endregion keyRawFun



// #region runPagFun

/**
 * runPagFun = Run Page Function
 *
 * @summary
 * Calls one of the app's exported functions in a page, importing its module
 * from the dev server, and resolves with what it returned, or with a string
 * naming the error it threw: `error:` and the error's Firestore code, or its
 * name when it has none. The return value has to survive the trip out of
 * the page, so a function returning a key goes through keyRawFun instead.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The identity's page.
 * @param modPatStr - Module Path String: The module's path on the dev server.
 * @param funNamStr - Function Name String: The exported function to call.
 * @param argValArr - Argument Value Array: The arguments to call it with.
 *
 * @returns A promise that resolves with the function's result or its error.
 *
 * @example
 * ```ts
 * runPagFun(page, '/src/state/joins.ts', 'reqStaFun', 'Xk3...') // => 'ended'
 * ```
 *
*/

const runPagFun = ( pagValObj : Page, modPatStr : string, funNamStr : string, ...argValArr : unknown[] ) : Promise< unknown > => pagValObj.evaluate( async ( [ modPatStr, funNamStr, argValArr ] ) => { // What: Run Page Function. Why: Each step runs as one identity, where it really runs. How: This imports the module in the page and calls the function there.


	const modValObj = await import( /* @vite-ignore */ modPatStr ); // What: Module Value Object. Why: The page runs the real module. How: This imports it.



	try { return await modValObj[ funNamStr ]( ...argValArr ); } // What: Function Call Return. Why: The step under test runs as this identity. How: This calls the function and returns what it resolves with.

	catch ( errCatObj ) { return `error:${ ( errCatObj as { code? : string } ).code ?? ( errCatObj as Error ).name }`; } // What: Error Return. Why: A refusal is what several tests check for. How: This names the Firestore code, or the error's name. // What: Type Assertion Note. Why: A catch binding is unknown, and Firestore's errors carry a code. How: The two as read it as either.


}, [ modPatStr, funNamStr, argValArr ] as const ); // What: Page Arguments. Why: The callback runs in the page, apart from the test's variables. How: This passes the path, the name, and the arguments in. // What: Type Assertion Note. Why: A plain array would type every entry alike. How: The as const keeps each entry's own type.

// #endregion runPagFun



// #region memSetFun

/**
 * memSetFun = Member Setup Function
 *
 * @summary
 * Creates a group as the owner's page and lets the second page in through
 * the invite and the owner's approval, as the app does. Resolves with the
 * group's ID, the owner's UID, and the member's UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The spec's environment.
 * @param ownPagObj - Owner Page Object: The owner's page.
 * @param memPagObj - Member Page Object: The member's page.
 *
 * @returns A promise that resolves with the group's ID and both UIDs.
 *
 * @example
 * ```ts
 * memSetFun(envTesObj, page, secPagObj) // => { groIdeStr, uidMemStr, ... }
 * ```
 *
*/

const memSetFun = async ( envTesObj : RulesTestEnvironment, ownPagObj : Page, memPagObj : Page ) : Promise< { groIdeStr : string, uidMemStr : string, uidOwnStr : string } > => { // What: Member Setup Function. Why: Every test starts from a group with an owner and a member. How: This creates the group and lets the member in.


	const groIdeStr = await runPagFun( ownPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string;           // What: Group Identifier String. Why: The group under test. How: This creates it as the owner. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const tokValStr = ( await docReaFun( envTesObj, `groups/${ groIdeStr }` ) )?.currentInviteToken as string;                     // What: Token Value String. Why: The member joins through the link. How: This reads the token the group names. // What: Type Assertion Note. Why: The rules store it as a string. How: The as reads it as one.
	const uidMemStr = ( await runPagFun( memPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Member String. Why: The owner answers the member by UID. How: This makes sure the member's identity exists and reads its UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.
	const uidOwnStr = ( await runPagFun( ownPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Owner String. Why: The owner's own membership is checked too. How: This reads the owner's UID. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await runPagFun( memPagObj, '/src/state/joins.ts', 'reqCreFun', tokValStr, 'Dana Lee', '' ); // What: Request Call. Why: The member asks to join. How: This files the request.

	await runPagFun( ownPagObj, '/src/state/joins.ts', 'reqAppFun', groIdeStr, uidMemStr ); // What: Approval Call. Why: The owner lets the member in. How: This approves the request.



	return { groIdeStr, uidMemStr, uidOwnStr }; // What: Setup Return. Why: The test uses all three. How: This returns them.


};

// #endregion memSetFun



// #region senPolFun

/**
 * senPolFun = Send Poll Function
 *
 * @summary
 * Sends a message from a page, retrying while the rules refuse it because
 * the mirror function hasn't yet caught up with the sender's membership,
 * and resolves with the message's ID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param pagValObj - Page Value Object: The sender's page.
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param mesTexStr - Message Text String: The message, as typed.
 *
 * @returns A promise that resolves with the message's ID.
 *
 * @example
 * ```ts
 * senPolFun(page, 'Xk3...', 'Hi') // => '-Nx...'
 * ```
 *
*/

const senPolFun = async ( pagValObj : Page, groIdeStr : string, mesTexStr : string ) : Promise< string > => { // What: Send Poll Function. Why: A send just after a membership change can meet the old mirror for a moment. How: This retries the send until it lands.


	let mesIdeStr = ''; // What: Message Identifier String. Why: The poll keeps the ID of the send that landed. How: This starts empty.


	await expect.poll( async () => { mesIdeStr = await runPagFun( pagValObj, '/src/state/chat.ts', 'chaSenFun', groIdeStr, mesTexStr ) as string; return mesIdeStr; } ).not.toMatch( /^error:/ ); // What: Send Poll Call. Why: The send succeeds once the mirror has the sender. How: This retries until no error comes back. // What: Type Assertion Note. Why: chaSenFun resolves with the ID, or runPagFun with an error string. How: The as reads either as a string.



	return mesIdeStr; // What: Message Return. Why: The test finds the message by ID. How: This returns it.


};

// #endregion senPolFun

// #endregion Helpers



// #region Exports

export { decNamFun, docReaFun, joiWaiFun, keyRawFun, memSetFun, pagTesObj, runPagFun, senPolFun }; // What: Named Exports. Why: Every client spec with two identities checks the pages this way. How: This exports the test object and the helpers.

// #endregion Exports


