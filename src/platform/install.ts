


/**
 * install.ts = Install
 *
 * @summary
 * What the app knows about being installed to the home screen
 * (ARCHITECTURE.md Section 16): whether this device is an iPhone or iPad,
 * where installing is described rather than offered, whether the app is
 * running installed, and the install prompt a browser such as Chrome offers.
 * The browser hands that prompt over once, so it's kept from the moment the
 * module loads until it's used or the app is installed, and subscribers hear
 * each change. Two choices are kept on the device: that the install note was
 * dismissed, and that someone on iPhone chose to carry on in Safari.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type BipEveTyp = Event & { prompt : () => Promise< void >, userChoice : Promise< { outcome : 'accepted' | 'dismissed' } > }; // What: Before Install Prompt Event Type. Why: The prompt's event isn't in TypeScript's own types. How: This adds the call that shows it and the promise of the person's answer.

// #endregion Types



// #region Constants

const NOT_STO_STR = 'come-hang-install-note';    // What: Note Storage String. Why: A dismissed note shouldn't come back on every visit. How: This is the local storage key the dismissal is kept under.
const SAF_STO_STR = 'come-hang-safari-continue';  // What: Safari Storage String. Why: Someone who chose to carry on in Safari shouldn't be stopped again. How: This is the local storage key the choice is kept under.

// #endregion Constants



// #region Module State

let bipEveObj : BipEveTyp | null = null; // What: Before Install Prompt Event Object. Why: The browser offers its prompt once, before anyone asks to install. How: This keeps the event until it's used.

const insLisSet = new Set< () => void >(); // What: Install Listener Set. Why: Screens change when the prompt arrives or the app is installed. How: This holds each subscriber.

// #endregion Module State



// #region Helpers

// #region isaIosFun

/**
 * isaIosFun = Is-An iOS Function
 *
 * @summary
 * Returns whether this device is an iPhone, iPod, or iPad, where only Safari's
 * own menu installs the app and the installed app keeps storage apart from
 * the browser's. An iPad reports itself as a Mac, so a Mac with a touch
 * screen counts too.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns True on an iPhone, iPod, or iPad.
 *
 * @example
 * ```ts
 * isaIosFun() // => true
 * ```
 *
*/

const isaIosFun = () : boolean => /iPad|iPhone|iPod/.test( navigator.userAgent ) || ( /Macintosh/.test( navigator.userAgent ) && navigator.maxTouchPoints > 1 ); // What: Is-An iOS Function. Why: iOS installs differently from every other system. How: This reads the device from the user agent, with a touch screen telling an iPad from a Mac.

// #endregion isaIosFun

const isaInsFun = () : boolean => matchMedia( '(display-mode: standalone)' ).matches || Reflect.get( navigator, 'standalone' ) === true; // What: Is-An Installed Function. Why: An installed app needs no suggestion to install. How: This is true when the app runs on its own, which iOS also reports through navigator.standalone.
const canProFun = () : boolean => bipEveObj !== null;                                                                                    // What: Can Prompt Function. Why: An Install button only works while the browser's prompt is kept. How: This is true while it is.

// #region insSubFun

/**
 * insSubFun = Install Subscribe Function
 *
 * @summary
 * Calls the listener whenever the prompt arrives or goes, or the app is
 * installed, and returns the function that stops it, the shape React's
 * external store hook takes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param onChaFun - On Change Function: Called after each change.
 *
 * @returns The function that unsubscribes.
 *
 * @example
 * ```ts
 * insSubFun(onChaFun) // => () => void
 * ```
 *
*/

const insSubFun = ( onChaFun : () => void ) : ( () => void ) => { // What: Install Subscribe Function. Why: The note and the Install button follow the prompt. How: This adds the listener and returns its removal.


	insLisSet.add( onChaFun ); // What: Listener Add Call. Why: The listener hears each change. How: This keeps it.



	return () => { insLisSet.delete( onChaFun ); }; // What: Unsubscribe Return. Why: A screen that goes stops listening. How: This returns the removal.


};

// #endregion insSubFun

const insNotFun = () : void => { for ( const insLisFun of insLisSet ) insLisFun(); }; // What: Install Notify Function. Why: Every subscriber hears a change. How: This calls each one.

// #region insProFun

/**
 * insProFun = Install Prompt Function
 *
 * @summary
 * Shows the browser's install prompt, then forgets it, since a prompt shows
 * only once, and resolves with whether the person accepted. Resolves false
 * when there's no prompt to show.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true once the install is accepted.
 *
 * @example
 * ```ts
 * insProFun() // => true
 * ```
 *
*/

const insProFun = async () : Promise< boolean > => { // What: Install Prompt Function. Why: An Install button asks the browser to install the app. How: This shows the kept prompt and reads the answer.


	const proEveObj = bipEveObj; // What: Prompt Event Object. Why: The prompt is used once. How: This takes the kept one.


	if ( proEveObj === null ) return false; // What: No Prompt Guard. Why: There's nothing to show. How: This resolves false.



	bipEveObj = null; // What: Prompt Clear. Why: A prompt can't be shown twice. How: This forgets it.

	insNotFun(); // What: Notify Call. Why: The Install buttons go with the prompt. How: This tells the subscribers.

	await proEveObj.prompt(); // What: Prompt Call. Why: The browser asks the person. How: This shows its prompt.



	return ( await proEveObj.userChoice ).outcome === 'accepted'; // What: Answer Return. Why: The caller says what happened. How: This resolves with whether the person accepted.


};

// #endregion insProFun

// #region stoGetFun

/**
 * stoGetFun = Storage Get Function
 *
 * @summary
 * Returns whether a choice is kept under a local storage key, false when
 * storage is blocked.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyNamStr - Key Name String: The key the choice is kept under.
 *
 * @returns True when the choice is kept.
 *
 * @example
 * ```ts
 * stoGetFun('come-hang-install-note') // => false
 * ```
 *
*/

const stoGetFun = ( keyNamStr : string ) : boolean => { // What: Storage Get Function. Why: Both kept choices are read the same way. How: This reads the key, guarding blocked storage.


	try { return localStorage.getItem( keyNamStr ) !== null; } // What: Read Attempt. Why: The choice is kept under its key. How: This is true when the key holds anything.

	catch { return false; } // What: Blocked Fallback. Why: Blocked storage shouldn't stop the app. How: This treats the choice as not made.


};

// #endregion stoGetFun

const stoSetFun = ( keyNamStr : string ) : void => { // What: Storage Set Function. Why: Both choices are kept the same way. How: This keeps the key, ignoring blocked storage.


	try { localStorage.setItem( keyNamStr, 'true' ); } // What: Write Attempt. Why: The choice should hold on later visits. How: This keeps the key.

	catch { /* What: Blocked Storage. Why: A choice that can't be kept still applies until the page closes. How: Nothing is done. */ }


};

const notDisFun = () : boolean => stoGetFun( NOT_STO_STR ); // What: Note Dismissed Function. Why: A dismissed note stays away. How: This reads the kept dismissal.
const notHidFun = () : void => stoSetFun( NOT_STO_STR );    // What: Note Hide Function. Why: Not now should hold on later visits. How: This keeps the dismissal.
const safConFun = () : boolean => stoGetFun( SAF_STO_STR ); // What: Safari Continue Function. Why: Someone who chose Safari isn't stopped again. How: This reads the kept choice.
const safSetFun = () : void => stoSetFun( SAF_STO_STR );    // What: Safari Set Function. Why: The choice to carry on in Safari should hold on later visits. How: This keeps it.

// #endregion Helpers



// #region Module Init

window.addEventListener( 'beforeinstallprompt', ( eveValObj ) => { // What: Prompt Listener Call. Why: The browser offers its prompt once, early, before anyone asks to install. How: This keeps it and tells the subscribers.


	eveValObj.preventDefault(); // What: Default Prevent Call. Why: The app shows the prompt when someone asks for it, not the browser's own banner. How: This stops the browser's.

	bipEveObj = eveValObj as BipEveTyp; // What: Prompt Keep Assignment. Why: The Install button shows it later. How: This keeps the event. // What: Type Assertion Note. Why: Only the browser's install prompt fires this event, with the prompt and its answer. How: The as reads it as one.

	insNotFun(); // What: Notify Call. Why: The Install buttons can show now. How: This tells the subscribers.


} );

window.addEventListener( 'appinstalled', () => { bipEveObj = null; insNotFun(); } ); // What: Installed Listener Call. Why: Once installed, nothing should suggest installing. How: This forgets the prompt and tells the subscribers.

// #endregion Module Init



// #region Exports

export { canProFun, insProFun, insSubFun, isaInsFun, isaIosFun, notDisFun, notHidFun, safConFun, safSetFun }; // What: Named Exports. Why: The install screen, the note, and Settings read and act on the install through these. How: This exports the checks, the prompt, the subscription, and the kept choices.

// #endregion Exports


