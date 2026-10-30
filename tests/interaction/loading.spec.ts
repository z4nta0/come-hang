


// #region Imports

import { datHolFun } from '../support/states.ts'; // What: Database Hold Function. Why: A launch is usually too quick to see the waiting screen. How: This holds the app's database open for a while.
import { expect    } from '@playwright/test';     // What: Expect. Why: Each check passes only when the page shows what it should. How: This asserts on what each check reads.
import { test      } from '@playwright/test';     // What: Test. Why: Each behavior is its own test. How: This declares them.

// #endregion Imports



/**
 * loading.spec.ts = Loading Spec
 *
 * @summary
 * Checks the waiting screen the app shows while it finds out which groups
 * someone is in, in whichever engine the project runs: a quick launch never
 * shows the loader, a slow one shows it and then gives way to the screen,
 * and a slow reload still returns to the position it was left at once the
 * screen has loaded.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



test( 'a quick launch never shows the loader', async ( { page : curPagObj } ) => { // What: Quick Launch Test. Why: A loader that flashed on every launch would only distract. How: This watches the page for the loading status from before it loads, then checks it never appeared.


	await curPagObj.addInitScript( () => new MutationObserver( () => { if ( document.querySelector( '[role="status"]' )?.textContent === 'Loading' ) Reflect.set( globalThis, 'loaSeeBoo', true ); } ).observe( document, { characterData : true, childList : true, subtree : true } ) ); // What: Loader Watch Call. Why: The loader could show and go between two checks. How: This records it on the page's global object if the status ever reads as loading.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The launch is the thing checked. How: This opens the app.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Welcome Wait. Why: The launch is over once the welcome shows. How: This waits for its heading.

	expect( await curPagObj.evaluate( () => Reflect.get( globalThis, 'loaSeeBoo' ) ) ).toBeUndefined(); // What: No Loader Assertion. Why: The check took less than the loader's delay. How: This expects the watch to have recorded nothing.


} );



test( 'a slow launch shows the loader, which gives way to the screen', async ( { page : curPagObj } ) => { // What: Slow Launch Test. Why: Someone waiting should see the app is working, and the loader shouldn't linger. How: This holds the app's check for 1.5 seconds and checks the loader shows, then that the welcome replaces it.


	await curPagObj.addInitScript( datHolFun, 1500 ); // What: Database Hold Call. Why: The check has to outlast the loader's delay. How: This holds the app's database for 1.5 seconds.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The launch is the thing checked. How: This opens the app.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveText( 'Loading' ); // What: Loader Status Assertion. Why: A screen reader should hear the app is loading. How: This waits for the status to say so.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Welcome Assertion. Why: The screen replaces the loader once the check ends. How: This waits for the welcome's heading.

	await expect( curPagObj.getByRole( 'status' ) ).toHaveCount( 0 ); // What: Loader Gone Assertion. Why: The loader shouldn't stay beside the screen. How: This expects its status to be gone.


} );



test( 'a slow reload returns to where it was left once the screen has loaded', async ( { page : curPagObj } ) => { // What: Slow Reload Test. Why: The screen is too short to reach a saved position until it loads, so the restore has to wait for it. How: This scrolls the welcome, reloads it with the app's check held for a second, and checks the position comes back.


	await curPagObj.setViewportSize( { height : 120, width : 390 } ); // What: Short Viewport Call. Why: The page has to be scrollable for a restored position to mean anything. How: This makes the screen too short to show the welcome whole.

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The check starts on the welcome. How: This opens the app.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Welcome Wait. Why: The page can only scroll once the welcome shows. How: This waits for its heading.

	await curPagObj.evaluate( () => window.scrollTo( { behavior : 'instant', left : 0, top : document.body.scrollHeight } ) );           // What: Bottom Scroll Call. Why: The position to return to has to be below the top. How: This jumps to the bottom of the page.
	await curPagObj.evaluate( () => new Promise( ( resProFun ) => requestAnimationFrame( () => requestAnimationFrame( resProFun ) ) ) ); // What: Two Frame Wait. Why: The scroll hook records a position from the scroll event, which the browser fires on the next frame. How: This waits two frames before reading it.


	const leaScrNum = await curPagObj.evaluate( () => window.scrollY ); // What: Leaving Scroll Number. Why: The reload should return the page to this position. How: This reads how far down the page sits before the reload.


	expect( leaScrNum ).toBeGreaterThan( 0 ); // What: Scrolled Assertion. Why: A page that can't scroll would let the check pass without anything restored. How: This checks the page sits below its top.

	await curPagObj.addInitScript( datHolFun, 1000 ); // What: Database Hold Call. Why: The reload's screen should load well after the fonts. How: This holds the app's database for a second on the reload.

	await curPagObj.reload(); // What: Page Reload Call. Why: This is the navigation being checked. How: This reloads the welcome.

	await expect( curPagObj.getByRole( 'heading', { level : 1 } ) ).toHaveText( 'Come Hang' ); // What: Reloaded Welcome Wait. Why: The position is restored once the screen has loaded. How: This waits for the welcome's heading.

	await expect.poll( () => curPagObj.evaluate( () => window.scrollY ) ).toBe( leaScrNum ); // What: Reloaded Position Assertion. Why: A slow reload should still open the page where it was left. How: This polls the scroll position until it matches.


} );


