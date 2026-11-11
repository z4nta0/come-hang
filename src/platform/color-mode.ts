


/**
 * color-mode.ts = Color Mode
 *
 * @summary
 * The light or dark choice that can override the phone's own setting. Every
 * color token holds a light and a dark value, and the root element follows
 * the phone unless its data-color-mode-choice attribute names light or dark.
 * The choice is kept on this device in local storage, so it survives a
 * reload and starts the next visit; storage that's blocked or full only
 * means the choice lasts until the page closes. The app applies the kept
 * choice once as it starts, before it first renders. The page's theme color,
 * which tints the browser's bars and an installed app's status and navigation
 * bars, follows the surface color of whichever mode shows.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type ColModTyp = 'dark' | 'light' | 'system'; // What: Color Mode Type. Why: The choice is dark, light, or following the phone. How: This lists the three.

// #endregion Types



// #region Constants

const MOD_STO_STR = 'come-hang-color-mode'; // What: Mode Storage String. Why: The choice has to survive a reload. How: This is the local storage key it's kept under.

// #endregion Constants



// #region Helpers

// #region colModGetFun

/**
 * colModGetFun = Color Mode Get Function
 *
 * @summary
 * Reads the choice kept on this device: dark or light when one was chosen,
 * and system otherwise, including when storage is blocked or holds anything
 * else.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The kept choice, or system.
 *
 * @example
 * ```ts
 * colModGetFun() // => 'system'
 * ```
 *
*/

const colModGetFun = () : ColModTyp => { // What: Color Mode Get Function. Why: Settings show the current choice, and the app applies it as it starts. How: This reads the kept value.


	try { // What: Choice Read Attempt. Why: Storage can be blocked, such as with site data turned off. How: This reads the key and accepts only dark or light.


		const stoValStr = localStorage.getItem( MOD_STO_STR ); // What: Stored Value String. Why: The choice is kept under one key. How: This reads it, or null when none is kept.


		if ( stoValStr === 'dark' || stoValStr === 'light' ) return stoValStr; // What: Kept Choice Return. Why: Only a real choice overrides the phone. How: This returns it.


	}

	catch { return 'system'; } // What: Blocked Storage Fallback. Why: Without storage there's no kept choice. How: This follows the phone.



	return 'system'; // What: System Return. Why: No choice, or an unknown value, means following the phone. How: This returns system.


};

// #endregion colModGetFun



// #region tinSynFun

/**
 * tinSynFun = Tint Sync Function
 *
 * @summary
 * Sets the page's theme color to the surface color of the mode now showing,
 * the color of the app's bars. The head ships a light and a dark theme color
 * tag, each for the device's own scheme, which an installed app reads only
 * once and which can't see a light or dark choice made in the app, so this
 * keeps one tag, drops its scheme, and writes the color resolved from the
 * page. Chrome on Android repaints an installed app's bars when the tag
 * changes. With no theme color tag, or a color it can't read, it changes
 * nothing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * tinSynFun() // => void
 * ```
 *
*/

const tinSynFun = () : void => { // What: Tint Sync Function. Why: The bars around the app should match it in whichever mode shows, as installed apps' do. How: This resolves the surface color and writes it into one theme color tag.


	const metEleArr = [ ...document.querySelectorAll( 'meta[name="theme-color"]' ) ]; // What: Meta Element Array. Why: The head's tags are the ones the browser reads. How: This finds every theme color tag.


	if ( metEleArr.length === 0 ) return; // What: No Tag Guard. Why: A page without a theme color has nothing to keep in step. How: This returns.



	const proSpaEle = document.createElement( 'span' ); // What: Probe Span Element. Why: A custom property holding light-dark() reads back unresolved, while a color property resolves it for the mode showing. How: This makes an element to read it through.


	proSpaEle.style.color = 'var( --bac-sur-col )'; // What: Probe Color Assignment. Why: The bars match the surface the app's bars are drawn in. How: This colors the probe with it. // Background Surface Color = light-dark( #FFFFFF, #1B1D38 )


	document.documentElement.append( proSpaEle ); // What: Probe Append Call. Why: Only an element in the page takes its colors. How: This adds it to the root.


	const chaValArr = getComputedStyle( proSpaEle ).color.match( /\d+/g ); // What: Channel Value Array. Why: The resolved color reads back as rgb( r, g, b ), which a theme color tag takes as hex. How: This reads its numbers, null when there are none.


	proSpaEle.remove(); // What: Probe Remove Call. Why: The probe has done its job. How: This takes it out of the page.



	if ( chaValArr === null || chaValArr.length < 3 ) return; // What: Unread Color Guard. Why: A color that didn't resolve would tint the bars wrongly. How: This leaves the tags as they are.



	const hexValStr = `#${ chaValArr.slice( 0, 3 ).map( ( chaValStr ) => Number( chaValStr ).toString( 16 ).padStart( 2, '0' ) ).join( '' ).toUpperCase() }`; // What: Hex Value String. Why: A theme color tag reads plain hex in every browser. How: This writes each channel as two hex digits.


	metEleArr.slice( 1 ).forEach( ( metEleObj ) => metEleObj.remove() ); // What: Extra Tag Remove Call. Why: A second tag tied to the device's scheme would win whenever the app's choice differs. How: This removes every tag but the first.

	metEleArr[ 0 ].removeAttribute( 'media' ); // What: Media Remove Call. Why: The kept tag holds whatever mode shows, whatever the device's scheme. How: This drops its scheme.

	metEleArr[ 0 ].setAttribute( 'content', hexValStr ); // What: Content Set Call. Why: The browser tints its bars with this color. How: This writes the surface color.


};

// #endregion tinSynFun



// #region colModAppFun

/**
 * colModAppFun = Color Mode Apply Function
 *
 * @summary
 * Applies the choice kept on this device to the page, setting the root's
 * data-color-mode-choice attribute for dark or light and leaving it off for
 * system, then sets the theme color to match, and again whenever the
 * device's own scheme changes. The app calls it once as it starts, before it
 * first renders.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * colModAppFun() // => void
 * ```
 *
*/

const colModAppFun = () : void => { // What: Color Mode Apply Function. Why: A kept choice should hold from the first render. How: This reads the choice and sets the root's attribute to match.


	const colModStr = colModGetFun(); // What: Color Mode String. Why: The kept choice decides the attribute. How: This reads it.


	if ( colModStr !== 'system' ) document.documentElement.dataset.colorModeChoice = colModStr; // What: Choice Attribute Assignment. Why: A kept light or dark choice overrides the phone. How: This sets the attribute, leaving it off to follow the phone.



	tinSynFun(); // What: Tint Sync Call. Why: The bars should match the mode the app opens in. How: This sets the theme color.

	matchMedia( '(prefers-color-scheme: dark)' ).addEventListener( 'change', tinSynFun ); // What: Scheme Change Listener. Why: A page following the device turns light or dark with it, and its bars should too. How: This sets the theme color again on each change.


};

// #endregion colModAppFun



// #region colModSetFun

/**
 * colModSetFun = Color Mode Set Function
 *
 * @summary
 * Applies a choice to the page at once and keeps it on this device: dark or
 * light sets the root's data-color-mode-choice attribute and stores the
 * choice, while system removes both, so the page follows the phone again, and
 * the theme color follows the mode either way. A storage write that fails is
 * logged, and the choice still applies until the page closes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param colModStr - Color Mode String: The choice, dark, light, or system.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * colModSetFun('dark') // => void
 * ```
 *
*/

const colModSetFun = ( colModStr : ColModTyp ) : void => { // What: Color Mode Set Function. Why: Settings let someone pick light, dark, or the phone's setting. How: This applies the choice, then keeps it.


	if ( colModStr === 'system' ) delete document.documentElement.dataset.colorModeChoice; // What: System Attribute Removal. Why: Without the attribute the page follows the phone. How: This removes it.

	else document.documentElement.dataset.colorModeChoice = colModStr; // What: Choice Attribute Assignment. Why: The attribute holds the page to light or dark. How: This sets it to the choice.



	tinSynFun(); // What: Tint Sync Call. Why: The bars should change with the page. How: This sets the theme color for the mode now showing.



	try { // What: Choice Write Attempt. Why: The choice should start the next visit too. How: This stores dark or light, or forgets the key for system.


		if ( colModStr === 'system' ) localStorage.removeItem( MOD_STO_STR ); // What: Choice Removal Call. Why: Following the phone needs no kept value. How: This removes the key.

		else localStorage.setItem( MOD_STO_STR, colModStr ); // What: Choice Store Call. Why: A reload should keep the choice. How: This stores it.


	}

	catch ( errCatObj ) { console.warn( errCatObj ); } // What: Choice Write Failure. Why: Storage can be full or blocked, and the failure should stay visible to anyone debugging. How: This logs it, while the choice still applies to this page.


};

// #endregion colModSetFun

// #endregion Helpers



// #region Exports

export { colModAppFun, colModGetFun, colModSetFun, type ColModTyp }; // What: Named Exports. Why: The app applies the kept choice as it starts, and settings read and change it. How: This exports the three functions and the choice's type.

// #endregion Exports


