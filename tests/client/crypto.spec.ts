


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: Each check passes only when the encryption behaves as Section 6 says. How: This asserts on what the page reports.
import { test   } from '@playwright/test'; // What: Test. Why: Each part of the encryption is its own test. How: This declares them.

// #endregion Imports



/**
 * crypto.spec.ts = Crypto Spec
 *
 * @summary
 * Checks the app's encryption in a real browser, in each engine, since each
 * has its own WebCrypto. Each test opens the app on the dev server, imports
 * the crypto module the way the app will, runs it in the page, and reports
 * what it saw: a group key wrapped for one member opens for that member
 * alone, text encrypts under a fresh IV and decrypts only unaltered with its
 * key, and invite tokens keep their form without repeating.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



test.beforeEach( async ( { page } ) => { // What: Page Hook. Why: The module runs in the app's own page. How: This opens the app before each test.


	await page.goto( '/' ); // What: Home Visit. Why: The dev server serves the module there. How: This opens the app.


} );



test( 'a group key wrapped for one member opens for that member alone, as a fresh 105-byte wrap each time', async ( { page } ) => { // What: Wrap Test. Why: Only the member a wrap was made for can read the group, whoever wrapped it (Section 6). How: This wraps a key for one member, then unwraps it as them, as someone else, and from a tampered wrap.


	const resValObj = await page.evaluate( async () => { // What: Result Value Object. Why: The wrap is checked where it really runs. How: This runs the module in the page and reports what it saw.


		const modPatStr = '/src/platform/crypto.ts';                                                     // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the crypto module.
		const cryModObj = await import( /* @vite-ignore */ modPatStr );                                  // What: Crypto Module Object. Why: The page runs the real module. How: This imports it.
		const memParObj = await crypto.subtle.generateKey( { name : 'ECDH', namedCurve : 'P-256' }, false, [ 'deriveBits', 'deriveKey' ] ) as CryptoKeyPair; // What: Member Pair Object. Why: The member's key pair is made as the identity makes it. How: This generates one. // What: Type Assertion Note. Why: generateKey's type allows a single key, which ECDH never returns. How: The as reads it as a pair.
		const othParObj = await crypto.subtle.generateKey( { name : 'ECDH', namedCurve : 'P-256' }, false, [ 'deriveBits', 'deriveKey' ] ) as CryptoKeyPair; // What: Other Pair Object. Why: Someone else must not open the wrap. How: This generates a second pair. // What: Type Assertion Note. Why: generateKey's type allows a single key, which ECDH never returns. How: The as reads it as a pair.
		const groKeyObj = await cryModObj.groKeyFun();                                                   // What: Group Key Object. Why: A group key is what gets wrapped. How: This makes one.
		const memRawArr = new Uint8Array( await crypto.subtle.exportKey( 'raw', memParObj.publicKey ) ); // What: Member Raw Array. Why: A wrap is made from the published raw key. How: This exports the member's.
		const wraOneArr = await cryModObj.wraKeyFun( groKeyObj, memRawArr );                             // What: Wrap One Array. Why: The wrap under test. How: This wraps the group key for the member.
		const wraTwoArr = await cryModObj.wraKeyFun( groKeyObj, memRawArr );                             // What: Wrap Two Array. Why: Each wrap uses its own one-time key. How: This wraps the same key again.
		const unwKeyObj = await cryModObj.unwKeyFun( wraOneArr, memParObj );                             // What: Unwrapped Key Object. Why: The member opens the wrap. How: This unwraps it with their pair.
		const tamWraArr = wraOneArr.slice();                                                             // What: Tampered Wrap Array. Why: An altered wrap must not open. How: This copies the wrap to alter.


		tamWraArr[ 100 ] ^= 1; // What: Tamper Flip. Why: One flipped bit is enough. How: This flips a bit in the wrapped key's bytes.


		const groRawStr = btoa( String.fromCharCode( ...new Uint8Array( await crypto.subtle.exportKey( 'raw', groKeyObj ) ) ) ); // What: Group Raw String. Why: The unwrapped key has to be the same key. How: This exports the original as base64.
		const unwRawStr = btoa( String.fromCharCode( ...new Uint8Array( await crypto.subtle.exportKey( 'raw', unwKeyObj ) ) ) ); // What: Unwrapped Raw String. Why: The unwrapped key stays extractable, so the member can wrap it for a joiner. How: This exports it as base64.

		const othOpeBoo = await cryModObj.unwKeyFun( wraOneArr, othParObj ).then( () => true, () => false ); // What: Other Opened Boolean. Why: Someone else's key must not open the wrap. How: This tries and records whether it worked.
		const tamOpeBoo = await cryModObj.unwKeyFun( tamWraArr, memParObj ).then( () => true, () => false ); // What: Tampered Opened Boolean. Why: An altered wrap must not open. How: This tries and records whether it worked.



		return { othOpeBoo, samKeyBoo : groRawStr === unwRawStr, samWraBoo : wraOneArr.join() === wraTwoArr.join(), tamOpeBoo, wraLenNum : wraOneArr.length }; // What: Result Return. Why: The test compares what the page saw. How: This returns each finding.


	} );

	expect( resValObj.wraLenNum ).toBe( 105 );   // What: Wrap Length. Why: A wrap is the 65-byte throwaway public key and the 40-byte wrapped key. How: This expects 105 bytes.
	expect( resValObj.samKeyBoo ).toBe( true );  // What: Same Key. Why: The member gets the group key back. How: This expects the unwrapped key to match.
	expect( resValObj.samWraBoo ).toBe( false ); // What: Fresh Wraps. Why: Each wrap uses its own one-time key. How: This expects two wraps of one key to differ.
	expect( resValObj.othOpeBoo ).toBe( false ); // What: Other Refused. Why: A wrap is for one member. How: This expects someone else's unwrap to fail.
	expect( resValObj.tamOpeBoo ).toBe( false ); // What: Tamper Refused. Why: AES-KW checks the wrap's integrity. How: This expects the altered wrap to fail.


} );



test( 'text encrypts under a fresh IV and decrypts only unaltered with its own key', async ( { page } ) => { // What: Text Test. Why: Firebase only ever sees ciphertext, and a changed message must not pass for the real one (Section 6). How: This encrypts one text twice and decrypts it with the right key, the wrong key, and an altered ciphertext.


	const resValObj = await page.evaluate( async () => { // What: Result Value Object. Why: The encryption is checked where it really runs. How: This runs the module in the page and reports what it saw.


		const modPatStr = '/src/platform/crypto.ts';                             // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the crypto module.
		const cryModObj = await import( /* @vite-ignore */ modPatStr );          // What: Crypto Module Object. Why: The page runs the real module. How: This imports it.
		const keyOneObj = await cryModObj.groKeyFun();                           // What: Key One Object. Why: The text's own group key. How: This makes one.
		const keyTwoObj = await cryModObj.groKeyFun();                           // What: Key Two Object. Why: Another group's key must not read it. How: This makes a second.
		const encOneObj = await cryModObj.encTexFun( keyOneObj, 'Héllo, Ål 👋' ); // What: Encrypted One Object. Why: The text under test, with accents and an emoji. How: This encrypts it.
		const encTwoObj = await cryModObj.encTexFun( keyOneObj, 'Héllo, Ål 👋' ); // What: Encrypted Two Object. Why: Each encryption takes a fresh IV. How: This encrypts the same text again.
		const tamCipArr = encOneObj.cipTexArr.slice();                           // What: Tampered Cipher Array. Why: An altered ciphertext must not decrypt. How: This copies it to alter.


		tamCipArr[ 0 ] ^= 1; // What: Tamper Flip. Why: One flipped bit is enough. How: This flips a bit of the ciphertext.


		const decTexStr = await cryModObj.decTexFun( keyOneObj, encOneObj.cipTexArr, encOneObj.iniVecArr );                                 // What: Decrypted Text String. Why: The right key reads it back. How: This decrypts it.
		const othDecBoo = await cryModObj.decTexFun( keyTwoObj, encOneObj.cipTexArr, encOneObj.iniVecArr ).then( () => true, () => false ); // What: Other Decrypted Boolean. Why: Another key must not read it. How: This tries and records whether it worked.
		const tamDecBoo = await cryModObj.decTexFun( keyOneObj, tamCipArr, encOneObj.iniVecArr ).then( () => true, () => false );           // What: Tampered Decrypted Boolean. Why: AES-GCM's tag catches a change. How: This tries and records whether it worked.



		return { cipLenNum : encOneObj.cipTexArr.length, decTexStr, ivlLenNum : encOneObj.iniVecArr.length, othDecBoo, samCipBoo : encOneObj.cipTexArr.join() === encTwoObj.cipTexArr.join(), samIvlBoo : encOneObj.iniVecArr.join() === encTwoObj.iniVecArr.join(), tamDecBoo }; // What: Result Return. Why: The test compares what the page saw. How: This returns each finding.


	} );

	expect( resValObj.decTexStr ).toBe( 'Héllo, Ål 👋' );                                         // What: Round Trip. Why: The right key reads the text back exactly. How: This expects the original text.
	expect( resValObj.cipLenNum ).toBe( new TextEncoder().encode( 'Héllo, Ål 👋' ).length + 16 ); // What: Cipher Length. Why: AES-GCM adds a 16-byte tag, which the rules' size caps allow for (Section 11.10). How: This expects the text's bytes plus 16.
	expect( resValObj.ivlLenNum ).toBe( 12 );                                                    // What: IV Length. Why: The rules store a 12-byte IV. How: This expects 12 bytes.
	expect( resValObj.samIvlBoo ).toBe( false );                                                 // What: Fresh IVs. Why: Reusing an IV under one key breaks AES-GCM. How: This expects two encryptions' IVs to differ.
	expect( resValObj.samCipBoo ).toBe( false );                                                 // What: Fresh Ciphertexts. Why: The same text mustn't look the same twice. How: This expects the ciphertexts to differ.
	expect( resValObj.othDecBoo ).toBe( false );                                                 // What: Other Refused. Why: Another group's key must not read it. How: This expects the decryption to fail.
	expect( resValObj.tamDecBoo ).toBe( false );                                                 // What: Tamper Refused. Why: A changed message mustn't pass for the real one. How: This expects the decryption to fail.


} );



test( 'an invite token is 22 base64url characters and never repeats', async ( { page } ) => { // What: Token Test. Why: A token is 128 random bits the rules check by form (Section 11.6). How: This makes 1,000 tokens in the page and checks their form and uniqueness.


	const tokValArr = await page.evaluate( async () => { // What: Token Value Array. Why: The tokens are made where they really are. How: This runs the module in the page and returns its tokens.


		const modPatStr = '/src/platform/crypto.ts';                    // What: Module Path String. Why: The dev server serves the app's source by path. How: This names the crypto module.
		const cryModObj = await import( /* @vite-ignore */ modPatStr ); // What: Crypto Module Object. Why: The page runs the real module. How: This imports it.



		return Array.from( { length : 1000 }, () => cryModObj.tokCreFun() as string ); // What: Tokens Return. Why: Many tokens show the form holds and none repeat. How: This makes 1,000. // What: Type Assertion Note. Why: A dynamic import's module is untyped. How: The as reads each token as a string.


	} );

	expect( tokValArr.filter( ( tokValStr ) => !/^[A-Za-z0-9_-]{22}$/.test( tokValStr ) ) ).toEqual( [] ); // What: Token Form. Why: The rules accept only 22 base64url characters. How: This expects every token to match.
	expect( new Set( tokValArr ).size ).toBe( 1000 );                                                      // What: No Repeats. Why: Two groups must never share a link. How: This expects 1,000 distinct tokens.


} );


