


// #region Imports

import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when a label reads as it should. How: This asserts on what each check reads.
import { runPagFun } from '../support/client.ts'; // What: Run Page Function. Why: The labels are worked out by the app's own module, in the browser. How: This calls its functions in a page.
import { test      } from '@playwright/test';     // What: Test. Why: Each unit system is its own test. How: This declares them.

// #endregion Imports



/**
 * geo.spec.ts = Geography Spec
 *
 * @summary
 * Checks the map's distance labels in each engine, since each formats
 * numbers and reads language tags itself: metric labels in meters and
 * kilometers, imperial labels in feet and miles, each at the edges where
 * the unit or the rounding changes, and which language tags read as a region
 * that uses miles.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const GEO_MOD_STR = '/src/core/geo.ts'; // What: Geography Module String. Why: The dev server serves the app's source by path. How: This names the module.

// #endregion Constants



// #region Module Init

test( 'metric distances read in meters to the nearest 10, then kilometers to a tenth, then whole kilometers', async ( { page } ) => { // What: Metric Test. Why: Most of the world reads distances in kilometers. How: This labels distances on each side of every change and checks each label.


	await page.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const labTexArr = await Promise.all( [ 5, 123, 994, 996, 1234, 9949, 176000 ].map( ( disMetNum ) => runPagFun( page, GEO_MOD_STR, 'disTexFun', disMetNum, false ) ) ); // What: Label Text Array. Why: Each distance gets its own label. How: This labels each in metric.


	expect( labTexArr ).toEqual( [ 'nearby', '120 m', '990 m', '1.0 km', '1.2 km', '9.9 km', '176 km' ] ); // What: Metric Labels Assertion. Why: Each distance reads in the unit and rounding its size calls for. How: This checks every label.


} );



test( 'imperial distances read in feet to the nearest 10, then miles to a tenth, then whole miles', async ( { page } ) => { // What: Imperial Test. Why: Members in the United States read distances in miles. How: This labels distances on each side of every change and checks each label.


	await page.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const labTexArr = await Promise.all( [ 5, 100, 150, 155, 1000, 16000, 176000 ].map( ( disMetNum ) => runPagFun( page, GEO_MOD_STR, 'disTexFun', disMetNum, true ) ) ); // What: Label Text Array. Why: Each distance gets its own label. How: This labels each in imperial.


	expect( labTexArr ).toEqual( [ 'nearby', '330 ft', '490 ft', '0.1 mi', '0.6 mi', '9.9 mi', '109 mi' ] ); // What: Imperial Labels Assertion. Why: Each distance reads in the unit and rounding its size calls for. How: This checks every label.


} );



test( 'a language tag reads as miles only for a region that uses them, a missing region filled in', async ( { page } ) => { // What: Units Region Test. Why: The map picks its units from the device's language. How: This checks tags with and without a region, and one that isn't valid.


	await page.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const impUniArr = await Promise.all( [ 'en-US', 'en', 'en-GB', 'es-US', 'en-CA', 'de-DE', 'not a tag!' ].map( ( lanTagStr ) => runPagFun( page, GEO_MOD_STR, 'impUniFun', lanTagStr ) ) ); // What: Imperial Units Array. Why: Each tag gets its own answer. How: This checks each.


	expect( impUniArr ).toEqual( [ true, true, true, true, false, false, false ] ); // What: Units Answers Assertion. Why: The United States and the United Kingdom use miles, and a bare en is most likely American, while Canada, Germany, and an invalid tag use kilometers. How: This checks every answer.


} );

// #endregion Module Init


