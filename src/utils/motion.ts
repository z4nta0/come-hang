


/**
 * motion.ts = Motion Helpers
 *
 * @summary
 * Helpers for motion that script drives itself, which a stylesheet's
 * reduced-motion query can't stop.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region redMotFun

/**
 * redMotFun = Reduced Motion Function
 *
 * @summary
 * Says whether the visitor has asked for less motion, read at the moment
 * it's called.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns Whether the reduced-motion preference is set.
 *
 * @example
 * ```ts
 * redMotFun() // => false
 * ```
 *
*/

const redMotFun = () : boolean => window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches; // What: Reduced Motion Function. Why: Motion a script drives has to stop for someone who asked for less. How: This reads the reduced-motion preference, true when it's set.

// #endregion redMotFun

// #endregion Helpers



// #region Exports

export { redMotFun }; // What: Named Export. Why: Script-driven motion checks the preference first. How: This exports redMotFun.

// #endregion Exports


