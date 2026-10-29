


// #region Imports

import { expect } from '@playwright/test'; // What: Expect. Why: The check passes only when the worker took over and served the app offline. How: This asserts on the page.
import { test   } from '@playwright/test'; // What: Test. Why: The worker's caching is its own test. How: This declares it.

// #endregion Imports



/**
 * offline.spec.ts = Offline Spec
 *
 * @summary
 * Checks the app's service worker in the production build, which the
 * preview server serves, in whichever engine the project runs: it registers
 * on the first visit, controls the page from the next load, and opens the
 * app with no connection, at its root and at an address the app answers
 * without a file of its own.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



test( 'the service worker takes over and opens the app without a connection', async ( { context, page } ) => { // What: Offline Test. Why: The app should open with no signal, as on a trip to a campsite, with what it last had (Section 14). How: This visits, waits for the worker, reloads offline at the root and at an unknown address, and checks the app shows each time.


	await page.goto( '/' ); // What: First Visit. Why: The first visit installs the worker. How: This opens the app.

	await page.evaluate( async () => { await navigator.serviceWorker.ready; } ); // What: Ready Wait. Why: The worker caches the app as it installs, and is ready once active. How: This waits for it.

	await page.reload(); // What: Online Reload. Why: A worker controls a page from its next load. How: This reloads.

	expect( await page.evaluate( () => navigator.serviceWorker.controller !== null ) ).toBe( true ); // What: Control Check. Why: The worker serves the page now. How: This expects a controller.

	await context.setOffline( true ); // What: Offline Call. Why: The app has to open with no connection. How: This cuts the context's network.

	await page.reload(); // What: Offline Reload. Why: The cached page opens the app. How: This reloads with no network.

	await expect( page.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Offline Root Check. Why: The app rendered from the cache. How: This waits for its heading.

	await page.goto( '/somewhere/else' ); // What: Offline Unknown Visit. Why: Every address the app answers is served the app's page, as Netlify does. How: This opens an address with no file of its own.

	await expect( page.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Offline Unknown Check. Why: The worker served the app's page, which replaces the address with its root. How: This waits for the heading.
	await expect( page ).toHaveURL( '/' );                                                // What: Root Address Check. Why: The app keeps no address it doesn't use. How: This waits for the root.


} );


