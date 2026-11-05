


/**
 * identities.ts = Identities Support
 *
 * @summary
 * Seeds sign-in records in the Auth emulator with the times a phone left
 * long ago would have, for checks of the daily cleanup of unused
 * identities, and asks whether a record is still there. Records are written
 * with the emulator's server endpoints, owner access standing in for the
 * server's, so a record can be dated in the past, linked to Google, or
 * signed in long ago and refreshed today. It reaches only the emulator.
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

const AUT_PRO_STR = 'http://127.0.0.1:8240/identitytoolkit.googleapis.com/v1/projects/demo-come-hang/accounts'; // What: Auth Project String. Why: Records are written and looked up through the emulator's server endpoints. How: This is their address under the demo project.
const AUT_PUB_STR = 'http://127.0.0.1:8240/identitytoolkit.googleapis.com/v1/accounts';                         // What: Auth Public String. Why: A phone signs in through the client endpoint. How: This is its address.
const DAY_MIL_NUM = 24 * 60 * 60 * 1000;                                                                        // What: Day Milliseconds Number. Why: Records are dated some days back. How: This is one day in milliseconds.
const OWN_HEA_OBJ = { 'Authorization' : 'Bearer owner', 'Content-Type' : 'application/json' };                  // What: Owner Headers Object. Why: The emulator lets owner access write and read any record. How: Each server call sends these.
const TOK_URL_STR = 'http://127.0.0.1:8240/securetoken.googleapis.com/v1/token?key=demo';                       // What: Token URL String. Why: A phone refreshes its sign-in through this endpoint. How: This is its address.

// #endregion Constants



// #region Helpers

type IdeSeeTyp = { dayAgoNum : number, gooLinBoo? : boolean, uidValStr : string }; // What: Identity Seed Type. Why: A seeded record names its UID, how many days ago it was used, and whether Google is linked. How: This types one of ideImpFun's records.

// #region ideImpFun

/**
 * ideImpFun = Identity Import Function
 *
 * @summary
 * Writes sign-in records as a server import would, each created and last
 * signed in the given number of days ago, with no refresh since, and linked
 * to a Google account when asked. Rejects when the emulator refuses them.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ideSeeArr - Identity Seed Array: The records to write, each a
 *                    {@link IdeSeeTyp}.
 *
 * @returns A promise that settles once the records are written, with no
 *          value.
 *
 * @example
 * ```ts
 * ideImpFun([ { dayAgoNum : 200, uidValStr : 'idle1' } ]) // => Promise<void>
 * ```
 *
*/

const ideImpFun = async ( ideSeeArr : IdeSeeTyp[] ) : Promise< void > => { // What: Identity Import Function. Why: A phone left long ago can't be made by waiting. How: This imports records dated in the past.


	const useValArr = ideSeeArr.map( ( ideSeeObj ) => { // What: User Value Array. Why: The import takes each record in the emulator's own form. How: This builds each one.


		const useMilStr = String( Date.now() - ideSeeObj.dayAgoNum * DAY_MIL_NUM ); // What: Use Milliseconds String. Why: The record was made and last used that long ago. How: This is the time, in milliseconds as text.



		return { // What: Record Return. Why: Each seed becomes one record. How: This returns its fields.


			createdAt   : useMilStr,           // What: Created At. Why: The record was made then. How: This dates it.
			lastLoginAt : useMilStr,           // What: Last Login At. Why: It was last signed in then. How: This dates it.
			localId     : ideSeeObj.uidValStr, // What: Local ID. Why: The record's UID. How: This names it.

			...( ideSeeObj.gooLinBoo ? { providerUserInfo : [ { email : `${ ideSeeObj.uidValStr }@example.com`, providerId : 'google.com', rawId : `g-${ ideSeeObj.uidValStr }` } ] } : {} ) // What: Google Spread. Why: A linked identity lists Google among its providers. How: This adds a Google provider when asked.


		};


	} );


	const impResObj = await fetch( `${ AUT_PRO_STR }:batchCreate`, { body : JSON.stringify( { users : useValArr } ), headers : OWN_HEA_OBJ, method : 'POST' } ); // What: Import Response Object. Why: The records are imported together. How: This posts them to the emulator's import endpoint.


	if ( !impResObj.ok ) throw new Error( `The emulator refused the import with ${ impResObj.status }.` ); // What: Refusal Guard. Why: A seed that didn't land would make a check fail for the wrong reason. How: This throws with the status.


};

// #endregion ideImpFun



// #region ideRefFun

/**
 * ideRefFun = Identity Refresh Function
 *
 * @summary
 * Signs a new anonymous identity in, dates its creation and sign-in the
 * given number of days back, then refreshes its sign-in now, the way a
 * phone that's still opened the app looks. Resolves with its UID.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param dayAgoNum - Day Ago Number: How many days ago it signed in.
 *
 * @returns A promise that resolves with the identity's UID.
 *
 * @example
 * ```ts
 * ideRefFun(200) // => 'Ue3k...'
 * ```
 *
*/

const ideRefFun = async ( dayAgoNum : number ) : Promise< string > => { // What: Identity Refresh Function. Why: An identity that signed in long ago but still refreshes is in use. How: This makes one, backdates its sign-in, and refreshes it.


	const sigResObj = await fetch( `${ AUT_PUB_STR }:signUp?key=demo`, { body : JSON.stringify( { returnSecureToken : true } ), headers : { 'Content-Type' : 'application/json' }, method : 'POST' } ); // What: Sign-In Response Object. Why: The identity starts as a phone's anonymous sign-in. How: This signs one up.
	const useMilStr = String( Date.now() - dayAgoNum * DAY_MIL_NUM ); // What: Use Milliseconds String. Why: The sign-in is dated back. How: This is the time, in milliseconds as text.

	const { localId : uidValStr, refreshToken : refTokStr } = await sigResObj.json() as { localId : string, refreshToken : string }; // What: UID Value String. Why: The UID names the record. How: This reads it. // What: Refresh Token String. Why: The token refreshes the sign-in. How: This reads it. // What: Type Assertion Note. Why: The endpoint's JSON is typed as unknown. How: The as reads its two fields.


	await fetch( `${ AUT_PRO_STR }:update`, { body : JSON.stringify( { createdAt : useMilStr, lastLoginAt : useMilStr, localId : uidValStr } ), headers : OWN_HEA_OBJ, method : 'POST' } ); // What: Backdate Call. Why: The identity signed in long ago. How: This rewrites its creation and sign-in times as a server.
	await fetch( TOK_URL_STR, { body : `grant_type=refresh_token&refresh_token=${ refTokStr }`, headers : { 'Content-Type' : 'application/x-www-form-urlencoded' }, method : 'POST' } );    // What: Refresh Call. Why: A phone with the app open refreshes its sign-in. How: This refreshes it now.



	return uidValStr; // What: UID Return. Why: The check asks after this record. How: This returns its UID.


};

// #endregion ideRefFun



// #region ideExiFun

/**
 * ideExiFun = Identity Exists Function
 *
 * @summary
 * Asks the Auth emulator, as a server, whether a sign-in record is still
 * there.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param uidValStr - UID Value String: The record's UID.
 *
 * @returns A promise that resolves with whether the record was found.
 *
 * @example
 * ```ts
 * ideExiFun('idle1') // => false
 * ```
 *
*/

const ideExiFun = async ( uidValStr : string ) : Promise< boolean > => ( await ( await fetch( `${ AUT_PRO_STR }:lookup`, { body : JSON.stringify( { localId : [ uidValStr ] } ), headers : OWN_HEA_OBJ, method : 'POST' } ) ).json() as { users? : unknown[] } ).users !== undefined; // What: Identity Exists Function. Why: A check asks whether a sign-in record is still there. How: This looks it up and says whether it was found. // What: Type Assertion Note. Why: The lookup's JSON is typed as unknown. How: The as reads its users list, missing when nobody was found.

// #endregion ideExiFun

// #endregion Helpers



// #region Exports

export { ideExiFun, ideImpFun, ideRefFun }; // What: Named Exports. Why: The identity cleanup spec seeds and checks sign-in records through these. How: This exports the three helpers.

// #endregion Exports


