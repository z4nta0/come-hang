


/**
 * notices.ts = Notices Support
 *
 * @summary
 * Leaves an identity a notice the way the Cloud Functions do, for checks of
 * the sheet that shows them. Only functions may write notices, so the seed
 * goes past the rules through the Firestore emulator's REST API with owner
 * access, with the same fields the functions store and an expiry 30 days
 * out. It reaches only the emulator.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

type NstArgTyp = { ageMilNum : number, groIdeStr : string, groNamStr : string, kinValStr : string, othUidStr? : string, uidValStr : string }; // What: Notice Seed Arguments Type. Why: A notice names its account, kind, group, age, and maybe another person. How: This types notSeeFun's argument.

// #region notSeeFun

/**
 * notSeeFun = Notice Seed Function
 *
 * @summary
 * Writes one notice to an account in the emulator, at the ID the functions
 * give it, `<kind>-<groupId>`, replacing one already there, stamped the given
 * age ago and expiring 30 days from now. The other person's UID is stored
 * only when given. Rejects when the emulator refuses the write.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param notArgObj - Notice Argument Object: {@link NstArgTyp}
 *
 * @returns A promise that settles once the notice is written, with no
 *          value.
 *
 * @example
 * ```ts
 * notSeeFun({ ageMilNum, kinValStr : 'removed', ... }) // => Promise<void>
 * ```
 *
*/

const notSeeFun = async ( notArgObj : NstArgTyp ) : Promise< void > => { // What: Notice Seed Function. Why: Only Cloud Functions write notices, so a check writes one as they would. How: This sets the document through the emulator's REST API.


	const fieValObj : Record< string, unknown > = { // What: Field Value Object. Why: The REST API takes each field with its type. How: This lists the notice's fields as the functions store them.


		createdAt : { timestampValue : new Date( Date.now() - notArgObj.ageMilNum ).toISOString() }, // What: Created At. Why: The sheet orders notices and labels each by its time. How: This stamps it the given age ago.
		expireAt  : { timestampValue : new Date( Date.now() + 30 * 86400000 ).toISOString() },       // What: Expire At. Why: An expired notice isn't shown. How: This sets it 30 days out, as the functions do.
		groupId   : { stringValue : notArgObj.groIdeStr },                                           // What: Group ID. Why: The notice is about a group. How: This stores its ID.
		groupName : { stringValue : notArgObj.groNamStr },                                           // What: Group Name. Why: The message names the group. How: This stores its name.
		kind      : { stringValue : notArgObj.kinValStr },                                           // What: Kind. Why: The message is picked by kind. How: This stores it.

		...( notArgObj.othUidStr === undefined ? {} : { otherUid : { stringValue : notArgObj.othUidStr } } ) // What: Other UID Spread. Why: Only some notices name another person. How: This adds the field when a UID is given.


	};

	const resValObj = await fetch( `http://127.0.0.1:8200/v1/projects/demo-come-hang/databases/(default)/documents/accounts/${ notArgObj.uidValStr }/notices/${ notArgObj.kinValStr }-${ notArgObj.groIdeStr }`, { body : JSON.stringify( { fields : fieValObj } ), headers : { Authorization : 'Bearer owner' }, method : 'PATCH' } ); // What: Response Value Object. Why: The emulator accepts a write past the rules with owner access. How: This sets the document, replacing one at its ID.


	if ( !resValObj.ok ) throw new Error( `The emulator refused the notice with ${ resValObj.status }.` ); // What: Refusal Guard. Why: A seed that didn't land would make a check fail for the wrong reason. How: This throws with the status.


};

// #endregion notSeeFun

// #endregion Helpers



// #region Exports

export { notSeeFun }; // What: Named Export. Why: The notice state and the notice spec seed notices this way. How: This exports notSeeFun.

// #endregion Exports


