


/**
 * update.ts = App Update Handling
 *
 * @summary
 * Brings a newly deployed version into an open app without losing anything
 * the member is doing. The service worker takes over as soon as a new
 * version installs, since it skips waiting, but the page keeps running the
 * old code until it reloads, and an installed app left open never reloads on
 * its own. So this file asks the browser to look for a new version whenever
 * the app comes back to the foreground, and once a new version has taken
 * control, it reloads the app while it's hidden, but only when nothing would
 * be lost: no sheet open, no text field holding a draft, no photo picked in
 * the chat's composer, and no message or upload on its way. Work
 * on its way holds the reload through updHolFun, which wraps the functions
 * that send it, and the reload is tried again once it lands. While something
 * is being edited, the update is marked ready instead, for the update note to
 * offer a Reload button, and tried again the next time the app is hidden. A
 * worker taking control of a page that had none isn't an update and is
 * ignored.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const TEX_FIE_STR = 'input:is( [type="email"], [type="search"], [type="tel"], [type="text"], [type="url"] ), textarea'; // What: Text Field String. Why: Only fields that take typed text can hold a draft. How: This selects them, leaving out checkboxes, radios, and file pickers.

// #endregion Constants



// #region Module State

const subFunSet = new Set< () => void >(); // What: Subscriber Function Set. Why: The update note has to hear when an update becomes ready. How: Each subscriber is called once the state changes.

let hadConBoo = !!navigator.serviceWorker?.controller; // What: Had Controller Boolean. Why: A worker taking control of a page that had none isn't a new version. How: This records whether a worker controlled the page at load.
let holCouNum = 0;                                     // What: Hold Count Number. Why: A reload while a message or upload is on its way would lose it. How: This counts the sends and uploads still running.
let updReaBoo = false;                                 // What: Update Ready Boolean. Why: The update note shows only once a new version has taken over. How: This turns true when that happens.

// #endregion Module State



// #region Helpers

// #region busNowFun

/**
 * busNowFun = Busy Now Function
 *
 * @summary
 * Reports whether the member may be in the middle of something a reload
 * would throw away: a sheet or other dialog open, an editable text field or
 * text area holding text other than the saved value it names in
 * `data-field-saved-value`, or a photo picked in the chat's composer. A
 * focused field that holds nothing new isn't counted, since the chat's box
 * keeps focus after each message is sent.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns True while any of those holds, false when a reload is safe.
 *
 * @example
 * ```ts
 * busNowFun() // => false
 * ```
 *
*/

const busNowFun = () : boolean => { // What: Busy Now Function. Why: A quiet reload must never throw away what the member is doing. How: This checks the page for anything open, typed, or picked.


	const texFieArr = [ ...document.querySelectorAll< HTMLInputElement | HTMLTextAreaElement >( TEX_FIE_STR ) ]; // What: Text Fields Array. Why: A field can hold a draft without focus, such as a chat message half written. How: This lists the page's text fields and text areas.

	const diaOpeBoo = document.querySelector( 'dialog[open]' ) !== null;                                                                                                // What: Dialog Open Boolean. Why: A sheet holds a form or a choice the member is making. How: This checks a dialog is open.
	const draHasBoo = texFieArr.some( ( fieEleObj ) => !fieEleObj.readOnly && !fieEleObj.disabled && fieEleObj.value !== ( fieEleObj.dataset.fieldSavedValue ?? '' ) ); // What: Draft Has Boolean. Why: Text typed and not yet saved would be lost. How: This checks an editable field holds text other than the saved value it names, or than nothing.
	const phoPicBoo = document.querySelector( '[data-element-name-hook~="comPreDiv"]' ) !== null;                                                                       // What: Photo Picked Boolean. Why: A photo picked for the chat would have to be picked again. How: This checks the composer's preview is shown.

	const busNowBoo = diaOpeBoo || draHasBoo || phoPicBoo; // What: Busy Now Boolean. Why: Any one of these makes a reload unsafe. How: This combines them.



	return busNowBoo; // What: Busy Now Return. Why: The caller decides whether to reload. How: This hands back the combined answer.


};

// #endregion busNowFun



const notSubFun = () => { for ( const curSubFun of subFunSet ) curSubFun(); }; // What: Notify Subscribers Function. Why: The update note has to rerender once an update is ready. How: This calls every subscriber.
const relNowFun = () => window.location.reload();                              // What: Reload Now Function. Why: The new version runs only once the page reloads. How: This reloads the page, which the note's Reload button calls too.



const relSafFun = () => { if ( updReaBoo && document.visibilityState === 'hidden' && holCouNum === 0 && !busNowFun() ) relNowFun(); }; // What: Reload Safe Function. Why: A quiet reload must happen only out of sight, with nothing on its way and nothing being edited. How: This reloads once an update is ready, the app is hidden, the hold count is 0, and busNowFun finds nothing.



const relLatFun = () => window.setTimeout( relSafFun, 0 ); // What: Reload Later Function. Why: Work that starts at the same moment, such as a line posted as the app hides, has to take its hold first. How: This tries the safe reload once the current task and its promises have run.



// #region updHolFun

/**
 * updHolFun = Update Hold Function
 *
 * @summary
 * Wraps a function that sends something to the server and resolves once it
 * lands, returning a function with the same parameters and result that
 * holds the quiet reload while each call runs, then tries the reload once
 * the call settles, whether it succeeded or failed. The hold is taken as the
 * call starts, before its first await.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param runFun - Run Function: The sending function to wrap.
 *
 * @returns The wrapped function.
 *
 * @example
 * ```ts
 * updHolFun(async (groIdeStr) => ...) // => (groIdeStr) => Promise<...>
 * ```
 *
*/

const updHolFun = < T extends unknown[], U >( runFun : ( ...argArr : T ) => Promise< U > ) : ( ( ...argArr : T ) => Promise< U > ) => async ( ...argArr : T ) : Promise< U > => { // What: Update Hold Function. Why: A message or upload cut off by a reload would be lost. How: This counts each call while it runs.


	holCouNum += 1; // What: Hold Take Assignment. Why: The reload waits from the moment the call starts. How: This counts it.



	try { return await runFun( ...argArr ); } // What: Run Attempt. Why: The wrapped function does the work. How: This runs it and returns its result.

	finally { // What: Hold Release Block. Why: A failed call is just as finished as one that landed. How: This releases the hold and tries the reload either way.


		holCouNum -= 1; // What: Hold Release Assignment. Why: The call has finished. How: This uncounts it.


		relLatFun(); // What: Later Reload Call. Why: The last call landing may be all a ready update was waiting for. How: This tries the safe reload.


	}


};

// #endregion updHolFun



const updReaFun = () : boolean => updReaBoo; // What: Update Ready Function. Why: The update note reads whether to show itself. How: This returns the current flag.



const updSubFun = ( newSubFun : () => void ) : ( () => void ) => { // What: Update Subscribe Function. Why: The update note listens for an update becoming ready, in the shape useSyncExternalStore expects. How: This adds the subscriber and returns the function that removes it.


	subFunSet.add( newSubFun ); // What: Subscriber Add Call. Why: The subscriber has to hear later changes. How: This adds it to the set.



	return () => { subFunSet.delete( newSubFun ); }; // What: Unsubscribe Return. Why: A note that unmounts must stop listening. How: This returns a function that removes it.


};

// #endregion Helpers



// #region Module Init

navigator.serviceWorker?.addEventListener( 'controllerchange', () => { // What: Controller Change Listener. Why: A new version taking control of the page is the signal that an update is ready. How: This marks it ready, tells the note, and reloads when that's safe.


	if ( !hadConBoo ) { hadConBoo = true; return; } // What: First Control Guard. Why: A worker taking control of a page that had none isn't a new version. How: This records the controller and stops.



	updReaBoo = true; // What: Update Ready Assignment. Why: A new version now controls the page. How: This marks the update ready.


	notSubFun(); // What: Subscriber Notify Call. Why: The note should offer the reload. How: This tells every subscriber.

	relSafFun(); // What: Safe Reload Call. Why: A hidden app with nothing being edited can take the new version at once. How: This reloads when that holds.


} );



document.addEventListener( 'visibilitychange', () => { // What: Visibility Change Listener. Why: Coming back is the moment to look for a new version, and leaving is the moment to apply one quietly. How: This asks for an update when the app shows, and tries a safe reload when it hides.


	if ( document.visibilityState === 'visible' ) navigator.serviceWorker?.getRegistration().then( ( worRegObj ) => worRegObj?.update() ).catch( () => {} ); // What: Update Check Call. Why: An app left open never checks for a new version by itself. How: This asks the registration to look for one, ignoring a failed check, such as one made offline.

	else relLatFun(); // What: Hidden Reload Call. Why: A hidden app with an update ready and nothing being edited can reload unseen, once anything the app sends as it hides has taken its hold. How: This tries the safe reload after that.


} );

// #endregion Module Init



// #region Exports

export { relNowFun, updHolFun, updReaFun, updSubFun }; // What: Named Exports. Why: The update note reads whether an update is ready and reloads on demand, and the sending functions hold the quiet reload while they run. How: This exports the reload, the hold, the flag, and the subscription.

// #endregion Exports


