


// #region Imports

import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when the text splits as it should. How: This asserts on what each check reads.
import { runPagFun } from '../support/client.ts'; // What: Run Page Function. Why: The addresses are parsed by the browser's own URL reader. How: This calls the app's module in a page.
import { test      } from '@playwright/test';     // What: Test. Why: Each kind of text is its own test. How: This declares them.

// #endregion Imports



/**
 * links.spec.ts = Links Spec
 *
 * @summary
 * Checks the helper that finds web addresses in typed text, in each engine,
 * since each parses addresses itself: which text becomes a link, what a
 * link opens, and which text stays plain, such as an address with a scheme
 * a message shouldn't open.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const LIN_MOD_STR = '/src/utils/links.ts'; // What: Links Module String. Why: The helper lives there. How: This names its path.

// #endregion Constants



// #region Module Init

test( 'a web address in text becomes a link, shown as typed, without the punctuation after it', async ( { page } ) => { // What: Link Parts Test. Why: A shared address should open when pressed, and a sentence's punctuation isn't part of it. How: This splits text with addresses in it and checks each piece's words and address.


	await page.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	expect( await runPagFun( page, LIN_MOD_STR, 'linParFun', 'Menu: https://example.com/menu?a=1.' ) ).toEqual( [ { hreStr : '', texStr : 'Menu: ' }, { hreStr : 'https://example.com/menu?a=1', texStr : 'https://example.com/menu?a=1' }, { hreStr : '', texStr : '.' } ] ); // What: Sentence Link. Why: The full stop ends the sentence, not the address. How: This expects the text, the link, and the full stop.
	expect( await runPagFun( page, LIN_MOD_STR, 'linParFun', '(www.example.org) soon' ) ).toEqual( [ { hreStr : '', texStr : '(' }, { hreStr : 'https://www.example.org/', texStr : 'www.example.org' }, { hreStr : '', texStr : ') soon' } ] );                               // What: Bare Address Link. Why: An address typed from www. opens over https, and a bracket opened before it isn't part of it. How: This expects the link between the brackets.
	expect( await runPagFun( page, LIN_MOD_STR, 'linParFun', 'https://example.org/wiki/Park_(city)' ) ).toEqual( [ { hreStr : 'https://example.org/wiki/Park_(city)', texStr : 'https://example.org/wiki/Park_(city)' } ] );                                                  // What: Bracketed Address Link. Why: A bracket opened inside the address belongs to it. How: This expects the whole address as one link.


} );



test( 'text that is not an http or https address with a dotted host stays plain', async ( { page } ) => { // What: Plain Text Test. Why: A message opens web pages only, and never runs what was typed. How: This splits text shaped like other addresses and checks it comes back as one plain piece.


	await page.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	for ( const plaTexStr of [ 'javascript:alert(1)', 'ftp://example.com/file', 'http://localhost', 'www. nothing', 'me@www.example.com', 'See you at 7' ] ) { // What: Plain Text Loop. Why: Each is text a link must not be made from. How: This checks each in turn.


		expect( await runPagFun( page, LIN_MOD_STR, 'linParFun', plaTexStr ) ).toEqual( [ { hreStr : '', texStr : plaTexStr } ] ); // What: Plain Piece. Why: Nothing in the text is a link. How: This expects one plain piece holding all of it.


	}


} );

// #endregion Module Init


