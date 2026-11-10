


/**
 * deploy-files.ts = Deploy Files
 *
 * @summary
 * Fills in the hosting files a build ships for its own Firebase project
 * (ARCHITECTURE.md Section 14). public/_headers and public/_redirects name
 * the spots that depend on the project with placeholders, and a build reads
 * its project from VITE_FIREBASE_CONFIG, so each environment's policy names
 * exactly its own project's addresses. The policy opens connect-src to
 * Firestore, Auth, the Realtime Database, Storage, FCM, and the project's
 * Cloud Functions, frame-src to the app itself for the sign-in page Netlify
 * passes through, script-src to the helper Google sign-in loads from
 * apis.google.com, and, with App Check on, connect-src, script-src, and
 * frame-src to reCAPTCHA. The redirects pass /__/auth/ through to the
 * project's sign-in domain, so Google sign-in runs on the app's own domain,
 * which Safari's storage rules require. A build without a project, such as a
 * test build, keeps the strict policy and drops the passthrough. A build
 * Netlify marks with SITE_NOINDEX, the staging site's, also asks search
 * engines to leave every page out, so staging never stands in for the real
 * site.
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

type DepConTyp = { appChkBoo : boolean, datUrlStr : string, proIdeStr : string } | null; // What: Deploy Config Type. Why: The files depend on the project, its database, and whether App Check is on, or on nothing for a build without a project. How: This types the three, or null.

// #endregion Types



// #region Constants

const GOO_SCR_STR = ' https://apis.google.com';                                                   // What: Google Script String. Why: Firebase's Google sign-in loads a helper script from Google before it opens the sign-in page, and fails with an internal error when the policy blocks it (measured on staging, 2026-11-09). How: This names its address, with a leading space.
const NOI_RUL_STR = "\n\n\n\n# What: No Index Rule. Why: The staging site mustn't show up in search beside the real one. How: This asks search engines to leave every path out.\n/*\n\tX-Robots-Tag: noindex\n"; // What: No Index Rule String. Why: A build for the staging site asks search engines to skip it. How: This is the headers block it appends, spaced like the file's own blocks.
const REC_CON_STR = ' https://www.google.com/recaptcha/';                                         // What: reCAPTCHA Connect String. Why: App Check's reCAPTCHA reaches Google from the page, as ease-my-life's live policy allows. How: This names its address, with a leading space.
const REC_FRA_STR = ' https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/'; // What: reCAPTCHA Frame String. Why: App Check's reCAPTCHA runs in a frame from Google. How: This lists its frame addresses, each with a leading space.
const REC_SCR_STR = ' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/';      // What: reCAPTCHA Script String. Why: App Check's reCAPTCHA loads its script from Google. How: This lists its script addresses, each with a leading space.

// #endregion Constants



// #region Helpers

// #region linFilFun

/**
 * linFilFun = Line Fill Function
 *
 * @summary
 * Fills in placeholders on a hosting file's rule lines, leaving its #
 * comment lines as written, since the comments name the placeholders too.
 * Each placeholder is replaced wherever it appears on a rule line.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filTexStr - File Text String: The hosting file as written.
 * @param plaMapObj - Placeholder Map Object: Each placeholder with the text
 *                    it becomes.
 *
 * @returns The file with its rule lines filled in.
 *
 * @example
 * ```ts
 * linFilFun(filTexStr, { '%FIREBASE_FRAME%' : "'none'" }) // => '...'
 * ```
 *
*/

const linFilFun = ( filTexStr : string, plaMapObj : Record< string, string > ) : string => filTexStr.split( '\n' ).map( ( linTexStr ) => linTexStr.startsWith( '#' ) ? linTexStr : Object.entries( plaMapObj ).reduce( ( accTexStr, [ plaKeyStr, plaValStr ] ) => accTexStr.replaceAll( plaKeyStr, plaValStr ), linTexStr ) ).join( '\n' ); // What: Line Fill Function. Why: Only the rules hold real placeholders. How: This replaces each placeholder on every line but the comments.

// #endregion linFilFun



// #region depHeaFun

/**
 * depHeaFun = Deploy Headers Function
 *
 * @summary
 * Fills in the headers file's placeholders: %FIREBASE_CONNECT%,
 * %FIREBASE_FRAME%, and %FIREBASE_SCRIPT%. With a project, connect-src gains
 * its addresses, frame-src the app itself, and script-src Google sign-in's
 * helper, each plus reCAPTCHA's with App Check on; without one, the extra
 * sources are empty and frame-src stays 'none'.
 * The Realtime Database moves a connection to a server of its own under
 * firebaseio.com, so its addresses are allowed across that domain. A build
 * asked to stay out of search also gains a rule sending X-Robots-Tag:
 * noindex on every path.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param heaTexStr - Headers Text String: The headers file as written.
 * @param depConObj - Deploy Config Object: {@link DepConTyp}
 * @param noiIndBoo - No Index Boolean: Whether the build stays out of search,
 *                    false by default.
 *
 * @returns The headers file for the build.
 *
 * @example
 * ```ts
 * depHeaFun(heaTexStr, depConObj, true) // => 'Content-Security-Policy: ...'
 * ```
 *
*/

const depHeaFun = ( heaTexStr : string, depConObj : DepConTyp, noiIndBoo = false ) : string => { // What: Deploy Headers Function. Why: The policy names exactly the build's own project, and staging stays out of search. How: This replaces each placeholder for it, adding the no index rule when asked.


	const robTexStr = noiIndBoo ? `${ heaTexStr.trimEnd() }${ NOI_RUL_STR }` : heaTexStr; // What: Robots Text String. Why: The staging site's build stays out of search. How: This appends the no index rule when asked, after the file's last block.


	if ( depConObj === null ) return linFilFun( robTexStr, { '%FIREBASE_CONNECT%' : '', '%FIREBASE_FRAME%' : "'none'", '%FIREBASE_SCRIPT%' : '' } ); // What: No Project Guard. Why: A build without a project talks to no other origin. How: This keeps the strict policy.



	const datHosStr = new URL( depConObj.datUrlStr ).host; // What: Database Host String. Why: The database's own address is where its connection starts. How: This reads the host from its URL.


	const conSouStr = ` https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://content-firebaseappcheck.googleapis.com https://us-central1-${ depConObj.proIdeStr }.cloudfunctions.net https://${ datHosStr } wss://${ datHosStr } https://*.firebaseio.com wss://*.firebaseio.com${ depConObj.appChkBoo ? REC_CON_STR : '' }`; // What: Connect Sources String. Why: The app reads and writes Firestore, signs in through Auth, chats through the database, moves history through Storage, registers for pushes, gets App Check tokens, and calls the project's functions. How: This lists each address, the functions' and database's named for the project, plus reCAPTCHA's with App Check on.



	return linFilFun( robTexStr, { '%FIREBASE_CONNECT%' : conSouStr, '%FIREBASE_FRAME%' : `'self'${ depConObj.appChkBoo ? REC_FRA_STR : '' }`, '%FIREBASE_SCRIPT%' : `${ GOO_SCR_STR }${ depConObj.appChkBoo ? REC_SCR_STR : '' }` } ); // What: Headers Return. Why: The policy opens exactly what the project needs. How: This fills in the connections, the frames, and the scripts, Google sign-in's helper always and reCAPTCHA's with App Check on.


};

// #endregion depHeaFun

// #region depRedFun

/**
 * depRedFun = Deploy Redirects Function
 *
 * @summary
 * Fills in the redirects file's sign-in passthrough: with a project, the
 * rule naming %FIREBASE_AUTH_HOST% passes /__/auth/ through to the
 * project's firebaseapp.com domain; without one, that rule is dropped.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param redTexStr - Redirects Text String: The redirects file as written.
 * @param depConObj - Deploy Config Object: {@link DepConTyp}
 *
 * @returns The redirects file for the build.
 *
 * @example
 * ```ts
 * depRedFun(redTexStr, depConObj) // => '/__/auth/*    https://...'
 * ```
 *
*/

const depRedFun = ( redTexStr : string, depConObj : DepConTyp ) : string => depConObj === null ? redTexStr.split( '\n' ).filter( ( linTexStr ) => linTexStr.startsWith( '#' ) || !linTexStr.includes( '%FIREBASE_AUTH_HOST%' ) ).join( '\n' ) : linFilFun( redTexStr, { '%FIREBASE_AUTH_HOST%' : `https://${ depConObj.proIdeStr }.firebaseapp.com` } ); // What: Deploy Redirects Function. Why: Sign-in passes through only for a build with a project. How: This drops the passthrough's line without one, or names the project's domain with one.

// #endregion depRedFun

// #region depConFun

/**
 * depConFun = Deploy Config Function
 *
 * @summary
 * Reads what the files depend on from the build's environment: the project
 * and its database from the web config's JSON, and whether App Check is on
 * from its site key. Returns null when there's no config, and throws when
 * the config lacks its project or database, so a broken deploy fails.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param conTexStr - Config Text String: VITE_FIREBASE_CONFIG, or undefined.
 * @param keyTexStr - Key Text String: VITE_APPCHECK_SITE_KEY, or undefined.
 *
 * @returns The deploy config, or null.
 *
 * @example
 * ```ts
 * depConFun(conTexStr, 'key') // => { appChkBoo : true, ... }
 * ```
 *
*/

const depConFun = ( conTexStr : string | undefined, keyTexStr : string | undefined ) : DepConTyp => { // What: Deploy Config Function. Why: The files follow the build's environment. How: This reads the project, its database, and App Check's key.


	if ( !conTexStr ) return null; // What: No Config Guard. Why: A build without a project keeps the strict files. How: This returns null.



	const conValAny : unknown = JSON.parse( conTexStr ); // What: Config Value Any. Why: The config comes from the environment as JSON. How: This parses it, untyped.

	const datUrlAny : unknown = Reflect.get( Object( conValAny ), 'databaseURL' ); // What: Database URL Any. Why: The database's address names its host. How: This reads it, untyped.
	const proIdeAny : unknown = Reflect.get( Object( conValAny ), 'projectId' );   // What: Project Identifier Any. Why: The project names the functions' and sign-in's addresses. How: This reads it, untyped.


	if ( typeof datUrlAny !== 'string' || typeof proIdeAny !== 'string' || !/^[a-z0-9-]{4,40}$/.test( proIdeAny ) ) throw new Error( 'VITE_FIREBASE_CONFIG needs a projectId and a databaseURL.' ); // What: Incomplete Config Guard. Why: A policy built from a broken config would break the app. How: This throws, failing the build.



	return { appChkBoo : !!keyTexStr, datUrlStr : datUrlAny, proIdeStr : proIdeAny }; // What: Config Return. Why: The files need the three. How: This returns them.


};

// #endregion depConFun

// #endregion Helpers



// #region Exports

export { depConFun, type DepConTyp, depHeaFun, depRedFun }; // What: Named Exports. Why: The build writes the files, and the security suite checks what they become. How: This exports the readers and fillers.

// #endregion Exports


