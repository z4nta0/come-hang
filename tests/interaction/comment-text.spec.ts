


// #region Imports

import { expect      } from '@playwright/test';     // What: Expect. Why: Each check passes only when no comment shows on the page. How: This asserts on the page's text.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: Each state is opened as the other suites open it. How: This loads and settles a state.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: Every state is checked. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each state is its own test. How: This declares them.

// #endregion Imports



/**
 * comment-text.spec.ts = Comment Text Spec
 *
 * @summary
 * Checks that no code comment reaches the page, in whichever engine the
 * project runs. A comment written with // after a container's opening tag,
 * or a fragment's, is JSX text rather than a comment, so it renders as
 * visible words. Every state is opened and its text searched for the
 * comment template's first label.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



for ( const staRecObj of STA_REC_ARR ) { // What: State Loop. Why: A stray comment can sit on any screen. How: This declares a test per state.


	test( `${ staRecObj.ideStr } shows no comment text`, async ( { page : curPagObj } ) => { // What: Comment Text Test. Why: A comment rendered as text is a visible bug. How: This opens the state and searches its text for a comment's label.


		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The text is read with the state settled. How: This loads and settles it.

		expect( await curPagObj.evaluate( () => document.body.innerText ) ).not.toContain( 'What:' ); // What: No Comment Assertion. Why: Every comment opens with this label, which no screen shows. How: This expects the page's text to be without it.


	} );


}


