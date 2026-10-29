


// #region Imports

import { Bytes              } from 'firebase/firestore';       // What: Bytes. Why: The public key is stored as Firestore bytes, so the rules can check its size (Section 6). How: This wraps the raw key.
import { doc                } from 'firebase/firestore';       // What: Doc. Why: The identity's documents are read and written by path. How: This builds a reference.
import { firGetFun          } from '../platform/firebase.ts';  // What: Firebase Get Function. Why: The identity signs in and publishes through Firebase. How: This returns the services.
import { getDoc             } from 'firebase/firestore';       // What: Get Doc. Why: The bootstrap checks what's already published. How: This reads one document.
import { GoogleAuthProvider } from 'firebase/auth';            // What: Google Auth Provider. Why: Recovery signs in with Google alone for now (Section 8). How: This names the provider.
import { keyGetFun          } from '../platform/key-store.ts'; // What: Key Get Function. Why: A key pair made before is reused. How: This reads it from IndexedDB.
import { keyPutFun          } from '../platform/key-store.ts'; // What: Key Put Function. Why: A new key pair has to survive the app closing. How: This stores it in IndexedDB.
import { linkWithPopup      } from 'firebase/auth';            // What: Link With Popup. Why: An identity is linked to Google from the person's tap. How: This links it through Google's popup.
import { serverTimestamp    } from 'firebase/firestore';       // What: Server Timestamp. Why: The rules require the server's time on a new user document. How: This asks the server to fill it in.
import { setDoc             } from 'firebase/firestore';       // What: Set Doc. Why: The bootstrap creates the user and account documents. How: This writes a document.
import { signInAnonymously  } from 'firebase/auth';            // What: Sign In Anonymously. Why: No signup is required (Section 8). How: This creates an anonymous identity.
import { signInWithPopup    } from 'firebase/auth';            // What: Sign In With Popup. Why: A new phone takes a linked identity back. How: This signs in through Google's popup.
import { updateDoc          } from 'firebase/firestore';       // What: Update Doc. Why: A replaced key pair republishes its public key. How: This updates the user document.

// #endregion Imports



/**
 * identity.ts = Identity
 *
 * @summary
 * Makes sure this device has a working identity before its first group
 * action (ARCHITECTURE.md Sections 6 and 8), and never on page load, so on
 * iOS nothing is created before the app is installed (Section 16). The
 * bootstrap signs in anonymously unless already signed in, keeps an ECDH
 * P-256 key pair in IndexedDB whose private key can't be read by script,
 * publishes the raw public key to users/{uid}, and starts the private
 * accounts/{uid} with no groups. Every step checks what's already there, so
 * calling it again, or after a failure partway, repeats nothing. A key pair
 * stored for a different UID, left by an identity since replaced, is
 * replaced too. Only a pair made now is published, so after a recovery onto
 * a new phone (Section 8), an older phone still signed in to the identity
 * never takes the published key back. Google sign-in links the identity, so
 * it can be recovered on a new phone, where signing in with Google takes it
 * back before the bootstrap makes that phone's key pair.
 *
 * Sections:
 *  - Types
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type IdeRecTyp = { keyParObj : CryptoKeyPair, uidValStr : string }; // What: Identity Record Type. Why: The key pair belongs to one UID, and both are handed to callers. How: This types the stored record and what ideEnsFun resolves with.

// #endregion Types



// #region Module State

let ideProObj : Promise< IdeRecTyp > | null = null; // What: Identity Promise Object. Why: Two actions at once mustn't make two key pairs. How: This holds the one bootstrap in progress or done.

// #endregion Module State



// #region Helpers

// #region ideBooFun

/**
 * ideBooFun = Identity Boot Function
 *
 * @summary
 * Runs the bootstrap's steps in order: sign in, key pair, public key,
 * account. Each step reads first and writes only what's missing or wrong.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the UID and its key pair.
 *
 * @example
 * ```ts
 * ideBooFun() // => { keyParObj, uidValStr }
 * ```
 *
*/

const ideBooFun = async () : Promise< IdeRecTyp > => { // What: Identity Boot Function. Why: The identity's parts have to exist together before any group action. How: This creates whichever are missing.


	const { autValObj, fstDatObj } = firGetFun(); // What: Firebase Services. Why: Sign-in and publishing need Auth and Firestore. How: This reads both.


	await autValObj.authStateReady(); // What: Auth Ready Call. Why: A signed-in identity is restored from storage asynchronously. How: This waits until Auth knows whether there is one.



	const uidValStr = ( autValObj.currentUser ?? ( await signInAnonymously( autValObj ) ).user ).uid; // What: UID Value String. Why: The device keeps one identity. How: This reads the signed-in UID, signing in anonymously when there's none.


	const stoRecAny = await keyGetFun( 'identity' ) as IdeRecTyp | undefined; // What: Stored Record Any. Why: A key pair made before is reused. How: This reads the stored record. // What: Type Assertion Note. Why: Only this file writes the identity record. How: The as reads it as one, or missing.


	const keyNewBoo = stoRecAny?.uidValStr !== uidValStr; // What: Key New Boolean. Why: A stored pair belongs to one UID, and a pair made now has to be published and kept. How: This is true when no pair is stored for this UID.

	const keyParObj = keyNewBoo ? await crypto.subtle.generateKey( { name : 'ECDH', namedCurve : 'P-256' }, false, [ 'deriveBits', 'deriveKey' ] ) : stoRecAny!.keyParObj; // What: Key Pair Object. Why: A group key is wrapped for this identity through ECDH (Section 6). How: This generates a P-256 pair whose private key script can never export, or reuses the stored one. // What: Non-Null Note. Why: A pair that isn't new was stored for this UID. How: The ! says the record is there.



	const pubKeyObj = Bytes.fromUint8Array( new Uint8Array( await crypto.subtle.exportKey( 'raw', keyParObj.publicKey ) ) ); // What: Public Key Object. Why: The rules check the raw 65-byte point (Section 6). How: This exports the public key and wraps it as bytes.
	const useRefObj = doc( fstDatObj, `users/${ uidValStr }` );                                                              // What: User Reference Object. Why: The public key is published there. How: This names the document.
	const useSnaObj = await getDoc( useRefObj );                                                                             // What: User Snapshot Object. Why: The key may already be published. How: This reads the document.


	if ( !useSnaObj.exists() ) await setDoc( useRefObj, { createdAt : serverTimestamp(), publicKey : pubKeyObj } ); // What: User Create Call. Why: Approvers fetch the key to wrap a group key for this identity. How: This creates the document at the server's time.

	else if ( keyNewBoo ) await updateDoc( useRefObj, { publicKey : pubKeyObj } ); // What: Key Replace Call. Why: A new pair, after the device lost its keys or on a phone this identity was recovered onto, needs its public key published, while a phone that kept its pair never takes the key back from a newer one. How: This updates the key, keeping the creation time.



	if ( keyNewBoo ) await keyPutFun( 'identity', { keyParObj, uidValStr } ); // What: New Key Store Call. Why: A new pair has to survive the app closing. How: This stores it with its UID once it's published, so a failure before that makes a fresh pair next time rather than keeping one nobody can wrap for.



	const accRefObj = doc( fstDatObj, `accounts/${ uidValStr }` ); // What: Account Reference Object. Why: Group memberships are recorded there. How: This names the document.


	if ( !( await getDoc( accRefObj ) ).exists() ) await setDoc( accRefObj, { memberGroups : {}, ownedGroups : {} } ); // What: Account Create Call. Why: Creating or joining a group updates the account's maps. How: This starts it empty when it's missing.



	return { keyParObj, uidValStr }; // What: Identity Return. Why: The caller acts as this identity. How: This returns the UID and its key pair.


};

// #endregion ideBooFun



// #region ideEnsFun

/**
 * ideEnsFun = Identity Ensure Function
 *
 * @summary
 * Resolves with this device's identity, running the bootstrap once per page
 * however many callers ask at the same moment. A failed bootstrap is
 * forgotten, so the next call tries again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the UID and its key pair.
 * @see {@link ideProObj}
 *
 * @example
 * ```ts
 * ideEnsFun() // => { keyParObj, uidValStr }
 * ```
 *
*/

const ideEnsFun = () : Promise< IdeRecTyp > => { // What: Identity Ensure Function. Why: Every group action starts from a working identity. How: This shares one bootstrap between callers and forgets a failed one.


	ideProObj ??= ideBooFun().catch( ( errCatObj ) => { // What: Bootstrap Promise Assignment. Why: Callers share the one bootstrap, and a failure shouldn't stick. How: This starts it when none is running and clears it again if it fails.


		ideProObj = null; // What: Bootstrap Reset. Why: The next call should try again. How: This forgets the failed bootstrap.



		throw errCatObj; // What: Failure Rethrow. Why: The caller has to learn the bootstrap failed. How: This passes the error on.


	} );



	return ideProObj; // What: Bootstrap Return. Why: The caller waits on the shared bootstrap. How: This returns it.


};

// #endregion ideEnsFun



// #region gooLinFun

/**
 * gooLinFun = Google Link Function
 *
 * @summary
 * Links this phone's identity to the person's Google account, from their
 * tap, through Google's sign-in popup, so the identity, with its groups, can
 * be recovered on a new phone (Section 8). Rejects with Firebase's error when
 * the popup is closed, or when that Google account is already linked to
 * another identity.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once the identity is linked, with no
 *          value.
 *
 * @example
 * ```ts
 * gooLinFun() // => Promise<void>
 * ```
 *
*/

const gooLinFun = async () : Promise< void > => { // What: Google Link Function. Why: Recovery is opt-in, through Google sign-in alone for now (Section 8). How: This links the identity through the popup.


	await ideEnsFun(); // What: Identity Ensure Call. Why: Only an identity that exists can be linked. How: This makes sure it does.

	await linkWithPopup( firGetFun().autValObj.currentUser!, new GoogleAuthProvider() ); // What: Link Call. Why: The identity keeps its UID, now reachable from Google. How: This links it through the popup. // What: Non-Null Note. Why: The bootstrap just signed the identity in. How: The ! says it's there.


};

// #endregion gooLinFun



// #region gooRecFun

/**
 * gooRecFun = Google Recover Function
 *
 * @summary
 * Takes a linked identity back on this phone, from the person's tap, by
 * signing in with Google through the popup, then runs the bootstrap again,
 * which makes this phone's key pair and publishes it. Each group's key then
 * waits for a member to share it (Section 6). A Google account not linked to
 * any identity becomes a new identity linked from the start. Refuses with an
 * Error, before anything changes, when this phone's identity already belongs
 * to a group, since signing in would leave those groups behind.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the identity signed in.
 *
 * @example
 * ```ts
 * gooRecFun() // => { keyParObj, uidValStr }
 * ```
 *
*/

const gooRecFun = async () : Promise< IdeRecTyp > => { // What: Google Recover Function. Why: Someone on a new phone gets their identity and groups back (Section 8). How: This signs in with Google, then remakes the phone's key pair.


	const { autValObj, fstDatObj } = firGetFun(); // What: Firebase Services. Why: The sign-in and the group check need Auth and Firestore. How: This reads both.


	await autValObj.authStateReady(); // What: Auth Ready Call. Why: This phone may already have an identity. How: This waits until Auth knows.



	const curUidStr = autValObj.currentUser?.uid; // What: Current UID String. Why: An identity already here may belong to groups. How: This reads it, undefined when there's none.

	const accDatObj = curUidStr === undefined ? undefined : ( await getDoc( doc( fstDatObj, `accounts/${ curUidStr }` ) ) ).data(); // What: Account Data Object. Why: The account lists the groups the identity belongs to. How: This reads it, undefined with no identity or account.

	const groCouNum = Object.keys( accDatObj?.memberGroups ?? {} ).length + Object.keys( accDatObj?.ownedGroups ?? {} ).length; // What: Group Count Number. Why: Signing in would leave this identity's groups behind. How: This counts both maps.


	if ( groCouNum > 0 ) throw new Error( "This phone already belongs to a group, so it can't take another identity." ); // What: Groups Here Guard. Why: An identity with groups would be stranded. How: This refuses before signing in.



	await signInWithPopup( autValObj, new GoogleAuthProvider() ); // What: Sign In Call. Why: The linked identity comes back by its Google account. How: This signs in through the popup.

	ideProObj = null; // What: Bootstrap Reset. Why: The bootstrap ran, if at all, for the identity signed out. How: This forgets it.



	return ideEnsFun(); // What: Bootstrap Return. Why: The recovered identity needs this phone's key pair published. How: This runs the bootstrap again and resolves with the identity.


};

// #endregion gooRecFun



// #region gooStaFun

/**
 * gooStaFun = Google State Function
 *
 * @summary
 * Resolves with whether this phone's identity is linked to a Google
 * account, false when there's no identity yet.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with true when the identity is linked.
 *
 * @example
 * ```ts
 * gooStaFun() // => false
 * ```
 *
*/

const gooStaFun = async () : Promise< boolean > => { // What: Google State Function. Why: Settings show whether the identity can be recovered. How: This checks the signed-in identity's providers.


	const { autValObj } = firGetFun(); // What: Auth Value Object. Why: The identity's providers are on Auth's user. How: This reads Auth.


	await autValObj.authStateReady(); // What: Auth Ready Call. Why: The identity is restored asynchronously. How: This waits for it.



	return autValObj.currentUser?.providerData.some( ( proDatObj ) => proDatObj.providerId === 'google.com' ) ?? false; // What: Linked Return. Why: A linked identity lists Google among its providers. How: This looks for it, false with no identity.


};

// #endregion gooStaFun

// #endregion Helpers



// #region Exports

export { gooLinFun, gooRecFun, gooStaFun, ideEnsFun, type IdeRecTyp }; // What: Named Exports. Why: Group actions start from the identity, which Google sign-in links and recovers. How: This exports the ensure function, the Google functions, and the record's type.

// #endregion Exports


