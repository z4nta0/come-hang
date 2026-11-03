


/**
 * click.ts = Click
 *
 * @summary
 * Helpers for reading a click. A link the page handles itself, such as a skip
 * link, should act only on a plain click and leave every other kind to the
 * browser, which opens a modified click its usual way.
 *
 * Sections:
 *  - Types
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type CliEveTyp = Pick< MouseEvent, 'altKey' | 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' >; // What: Click Event Type. Why: Both a DOM click and a React click carry these fields. How: This picks them from the DOM's mouse event, which React's matches.

// #endregion Types



// #region Helpers

// #region modCliFun

/**
 * modCliFun = Modified Click Function
 *
 * @summary
 * Whether a click is one the browser should handle itself: a press of any
 * button but the main one, or a click with Alt, Ctrl, Cmd, or Shift held,
 * which opens a link in a new tab, a new window, or as a download. A handler
 * returns early when this is true, before cancelling the default.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param cliEveObj - Click Event Object: The click, a DOM or React mouse
 *                    event.
 *
 * @returns Whether the click is a modified one.
 *
 * @example
 * ```ts
 * modCliFun(cliEveObj) // => true for a Ctrl click
 * ```
 *
*/

const modCliFun = ( { altKey : altKeyBoo, button : butIndNum, ctrlKey : ctrKeyBoo, metaKey : metKeyBoo, shiftKey : shiKeyBoo } : CliEveTyp ) : boolean => butIndNum !== 0 || altKeyBoo || ctrKeyBoo || metKeyBoo || shiKeyBoo; // What: Modified Click Function. Why: A modified click belongs to the browser. How: This is true for any button but the main one, or with a modifier key held.

// #endregion modCliFun

// #endregion Helpers



// #region Exports

export { modCliFun }; // What: Named Export. Why: Every self-handled link shares one check. How: This exports modCliFun by name.

// #endregion Exports


