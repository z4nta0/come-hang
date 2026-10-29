


/**
 * json.ts = JSON Helpers
 *
 * @summary
 * Reads JSON that came from somewhere untrusted, such as another member's
 * device, without letting bad input throw. Text that isn't JSON, or JSON
 * that isn't an object, comes back as null, and the caller still checks each
 * field it reads.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region jsoObjFun

/**
 * jsoObjFun = JSON Object Function
 *
 * @summary
 * Parses text as JSON and returns the object it holds, or null when the
 * text isn't JSON or holds a bare string, number, boolean, or null. An array
 * passes as an object, so the caller checks each field it reads.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param jsoTexStr - JSON Text String: The text to parse.
 *
 * @returns The parsed object, or null.
 *
 * @example
 * ```ts
 * jsoObjFun('{"t":"Picnic"}') // => { t : 'Picnic' }
 * ```
 *
*/

const jsoObjFun = ( jsoTexStr : string ) : Record< string, unknown > | null => { // What: JSON Object Function. Why: Untrusted text mustn't break the code reading it. How: This parses it, falling back to null.


	let jsoValAny : unknown = null; // What: JSON Value Any. Why: The parse may fail. How: This starts with nothing parsed.



	try { jsoValAny = JSON.parse( jsoTexStr ); } // What: Parse Assignment. Why: Well-formed text holds JSON. How: This parses it.

	catch { jsoValAny = null; } // What: Parse Fallback. Why: Text that isn't JSON is an expected case for untrusted input. How: This keeps nothing parsed.



	return jsoValAny !== null && typeof jsoValAny === 'object' ? jsoValAny as Record< string, unknown > : null; // What: Object Return. Why: Only an object has fields to read. How: This returns it, or null for anything else, while the caller still checks each field. // What: Type Assertion Note. Why: A parsed object's keys are unknown. How: The as reads it as a record of unknowns.


};

// #endregion jsoObjFun

// #endregion Helpers



// #region Exports

export { jsoObjFun }; // What: Named Export. Why: Code reading another device's JSON parses it safely through this. How: This exports the helper.

// #endregion Exports


