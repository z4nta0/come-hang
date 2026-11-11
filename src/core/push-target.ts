


/**
 * push-target.ts = Push Target
 *
 * @summary
 * Where a tap on a push leads (ARCHITECTURE.md Section 11.1). A push names
 * its group's ID and the section its news is in, and a tap opens the app at
 * an entry address for them, /open/<group>/<section>, which the app reads as
 * it starts, as it does an invite link. A push that names no group, such as
 * a removal, or whose data isn't in that form, opens the app at its root.
 * The service worker builds the address, so this file reads nothing of the
 * page. Where a tap launches a closed app, the worker also leaves the address
 * for an app that starts at its root to follow, while it's fresh, which this
 * file says for how long.
 *
 * Sections:
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const PUS_IDE_REG = /^[A-Za-z0-9_-]{1,64}$/; // What: Push Identifier Regular Expression. Why: A group's ID and a section's name become parts of the address. How: This allows only letters, digits, hyphens, and underscores, up to 64 of them.
const TAR_LIF_NUM = 60000;                   // What: Target Lifetime Number. Why: An address left by a tap long ago shouldn't move an app opened later. How: This is the minute it's followed for, in milliseconds.

// #endregion Constants



// #region Helpers

// #region tarPatFun

/**
 * tarPatFun = Target Path Function
 *
 * @summary
 * Returns the address a tap on a push opens: /open/<group>/<section> when
 * its data names both in their form, and the root otherwise.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param datValAny - Data Value Any: The push's data, as FCM delivered it.
 *
 * @returns The address to open.
 *
 * @example
 * ```ts
 * tarPatFun({ groupId : 'gro1', section : 'chat' }) // => '/open/gro1/chat'
 * ```
 *
*/

const tarPatFun = ( datValAny : unknown ) : string => { // What: Target Path Function. Why: A tap on a push opens where its news is. How: This builds the entry address from the push's data.


	const groValAny : unknown = Reflect.get( Object( datValAny ), 'groupId' ); // What: Group Value Any. Why: The push names its group. How: This reads it, untyped.
	const secValAny : unknown = Reflect.get( Object( datValAny ), 'section' ); // What: Section Value Any. Why: The push names its section. How: This reads it, untyped.

	const groOkaBoo = typeof groValAny === 'string' && PUS_IDE_REG.test( groValAny ); // What: Group Okay Boolean. Why: Only a well-formed ID may reach the address. How: This checks its type and form.
	const secOkaBoo = typeof secValAny === 'string' && PUS_IDE_REG.test( secValAny ); // What: Section Okay Boolean. Why: Only a well-formed name may reach the address. How: This checks its type and form.



	return groOkaBoo && secOkaBoo ? `/open/${ String( groValAny ) }/${ String( secValAny ) }` : '/'; // What: Path Return. Why: A push naming both opens them, and any other opens the app. How: This builds the entry address, or returns the root.


};

// #endregion tarPatFun

// #endregion Helpers



// #region Exports

export { TAR_LIF_NUM, tarPatFun }; // What: Named Exports. Why: The service worker opens where a tapped push leads, and the app follows an address left for a launch while it's fresh. How: This exports the helper and the address's lifetime.

// #endregion Exports


