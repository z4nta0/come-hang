


// #region Imports

import AxeBuilder from '@axe-core/playwright'; // What: Axe Builder. Why: axe-core finds the mechanical accessibility failures, such as low contrast, missing names, and misused ARIA. How: This runs its scan against a Playwright page.


import { expect      } from '@playwright/test';     // What: Expect. Why: A state passes only with no violations. How: This asserts the violation list is empty.
import { opeStaFun   } from '../support/states.ts'; // What: Open State Function. Why: Each state has to be opened and settled before it's scanned. How: This loads it and waits for it.
import { STA_REC_ARR } from '../support/states.ts'; // What: State Record Array. Why: Every page state is scanned. How: This lists them.
import { test        } from '@playwright/test';     // What: Test. Why: Each state is its own test. How: This declares them.


import type { Page } from '@playwright/test'; // What: Page. Why: The scan helper drives a Playwright page. How: This types its page parameter.

// #endregion Imports



/**
 * axe.spec.ts = Axe Spec
 *
 * @summary
 * Scans every page state with axe-core against WCAG 2.2 A and AA plus axe's
 * best-practice rules, in whichever engine the project runs. A state passes
 * only with zero violations, and each failure names its rule, its impact,
 * and the elements it found. Anything axe can't decide on its own (its
 * "incomplete" results, such as text over an image) can't fail the run, so
 * it's printed and attached to the test as needing review by hand.
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

type AxeResTyp = Awaited< ReturnType< AxeBuilder[ 'analyze' ] > >; // What: Axe Results Type. Why: The scan's findings are summarized for the report, and axe-core itself is only a dependency of the Playwright integration. How: This reads the type from what AxeBuilder's analyze resolves to.

// #endregion Types



// #region Constants

const AXE_TAG_ARR = [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice' ]; // What: Axe Tag Array. Why: The app targets WCAG 2.2 AA, which includes every earlier A and AA rule, and axe's best practices catch common problems WCAG doesn't name. How: This limits the scan to those rule sets.

// #endregion Constants



// #region Helpers

// #region scaStaFun

/**
 * scaStaFun = Scan State Function
 *
 * @summary
 * Runs axe-core on the page as it stands, limited to the WCAG and
 * best-practice rule sets, and returns its full results. The caller opens
 * and settles the state first, so the scan never sees a page mid-load or
 * mid-animation.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param curPagObj - Current Page Object: The page to scan.
 *
 * @returns The scan's results.
 *
 * @example
 * ```ts
 * scaStaFun(page) // => { violations, incomplete, passes, ... }
 * ```
 *
*/

async function scaStaFun ( curPagObj : Page ) : Promise< AxeResTyp > {


	return new AxeBuilder( { page : curPagObj } ).withTags( AXE_TAG_ARR ).analyze(); // What: Axe Scan Return. Why: The scan's results decide the test. How: This builds an axe run for the page, limits it to the chosen rule sets, and runs it.


}

// #endregion scaStaFun



// #region sumResFun

/**
 * sumResFun = Summarize Results Function
 *
 * @summary
 * Turns one list of axe results into one readable line per rule: the rule's
 * id, its impact where axe gives one, its help text, and the selectors of
 * the elements it flagged. Used for both the violations, which fail the
 * test, and the incomplete results, which are only reported.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param resLisArr - Result List Array: Either the violations or the
 *                    incomplete results of one scan.
 *
 * @returns One line per rule.
 *
 * @example
 * ```ts
 * sumResFun(axeResObj.violations) // => [ 'color-contrast (serious): ...' ]
 * ```
 *
*/

function sumResFun ( resLisArr : AxeResTyp[ 'violations' ] ) : string[] {


	return resLisArr.map( ( resCurObj ) => `${ resCurObj.id } (${ resCurObj.impact || 'no impact' }): ${ resCurObj.help } at ${ resCurObj.nodes.map( ( nodCurObj ) => nodCurObj.target.join( ' ' ) ).join( ', ' ) }` ); // What: Result Lines Return. Why: A failure should say what broke and where without opening the report. How: This joins each rule's id, impact, help, and flagged selectors into one line.


}

// #endregion sumResFun

// #endregion Helpers



// #region Module Init

for ( const staRecObj of STA_REC_ARR ) { // What: State Test Loop. Why: Every page state must pass the scan. How: This declares one axe test per state.


	test( `${ staRecObj.ideStr } has no axe violations`, async ( { page : curPagObj }, tesInfObj ) => { // What: Axe Test. Why: A state passes only with zero axe violations. How: This opens the state, scans it, reports anything needing review, and fails on any violation.


		await opeStaFun( curPagObj, staRecObj ); // What: State Open Call. Why: The scan should see the state settled. How: This loads and settles it.


		const axeResObj = await scaStaFun( curPagObj );      // What: Axe Result Object. Why: Both the violations and the incomplete results come from one scan. How: This scans the page.
		const revLinArr = sumResFun( axeResObj.incomplete ); // What: Review Line Array. Why: Results axe couldn't decide need a person's look. How: This summarizes them.


		for ( const revLinStr of revLinArr ) tesInfObj.annotations.push( { description : revLinStr, type : 'needs review' } ); // What: Review Annotations Loop. Why: The report should list each result needing review beside its test. How: This attaches each line as an annotation.



		if ( revLinArr.length ) console.log( `[${ tesInfObj.project.name }] ${ staRecObj.ideStr } needs review:\n  ${ revLinArr.join( '\n  ' ) }` ); // What: Review Log Call. Why: The terminal run should show what needs a look without opening the report. How: This prints the state's review lines under its project and name.



		expect( sumResFun( axeResObj.violations ) ).toEqual( [] ); // What: No Violations Assertion. Why: The state passes only with zero violations. How: This compares the summarized violations with an empty list, so a failure prints each one.


	} );


}

// #endregion Module Init


