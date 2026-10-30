


/**
 * crypto.ts = Crypto
 *
 * @summary
 * The app's encryption, all through the browser's own WebCrypto
 * (ARCHITECTURE.md Section 6). Each group has one AES-GCM key, which encrypts
 * the group's content with a fresh 12-byte IV each time. A group key is
 * wrapped for each member with a one-time key: the wrapper makes a throwaway
 * ECDH P-256 key pair, derives a key-wrapping key from it and the member's
 * public key through HKDF-SHA-256, bound to both public keys, and wraps the
 * group key with AES-KW. The stored wrap is the throwaway public key's raw
 * 65 bytes followed by the 40-byte wrapped key, 105 bytes in all, and only
 * the member's own private key can undo it, whoever wrapped it.
 *
 * A group key stays extractable, since any member may wrap it for a joiner
 * (Section 17), while an identity's private key never is. Invite tokens are
 * 128 random bits in 22 base64url characters (Section 11.6).
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

const ECD_ALG_OBJ = { name : 'ECDH', namedCurve : 'P-256' };                   // What: ECDH Algorithm Object. Why: Every identity and throwaway key is a P-256 ECDH key (Section 6). How: This names the curve.
const PUB_LEN_NUM = 65;                                                        // What: Public Length Number. Why: A wrap starts with the throwaway public key. How: This is the raw P-256 point's length in bytes.
const WRA_INF_ARR = new TextEncoder().encode( 'come-hang group key wrap v1' ); // What: Wrap Info Array. Why: A key derived for wrapping must never match one derived for anything else. How: This labels the derivation, ahead of both public keys.

// #endregion Constants



// #region Helpers

// #region kekDerFun

/**
 * kekDerFun = Key-Encryption-Key Derive Function
 *
 * @summary
 * Derives the AES-KW key that wraps or unwraps a group key, from one side's
 * private key and the other side's public key, through ECDH then
 * HKDF-SHA-256. The derivation is bound to both public keys, throwaway first,
 * so a wrap only unwraps for the member it was made for.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param priKeyObj - Private Key Object: The deriving side's private key.
 * @param pubKeyObj - Public Key Object: The other side's public key.
 * @param ephRawArr - Ephemeral Raw Array: The throwaway public key's raw
 *                    bytes.
 * @param memRawArr - Member Raw Array: The member's public key's raw bytes.
 *
 * @returns A promise that resolves with the AES-KW key.
 *
 * @example
 * ```ts
 * kekDerFun(priKeyObj, pubKeyObj, ephRawArr, memRawArr) // => CryptoKey
 * ```
 *
*/

const kekDerFun = async ( priKeyObj : CryptoKey, pubKeyObj : CryptoKey, ephRawArr : Uint8Array< ArrayBuffer >, memRawArr : Uint8Array< ArrayBuffer > ) : Promise< CryptoKey > => { // What: Key-Encryption-Key Derive Function. Why: Wrapping and unwrapping derive the same key from opposite halves. How: This runs ECDH, then HKDF, into an AES-KW key.


	const sharedBuf = await crypto.subtle.deriveBits( { name : 'ECDH', public : pubKeyObj }, priKeyObj, 256 ); // What: Shared Buffer. Why: Both sides reach the same secret from opposite halves. How: This runs ECDH for 256 bits.
	const hkdKeyObj = await crypto.subtle.importKey( 'raw', sharedBuf, 'HKDF', false, [ 'deriveKey' ] );       // What: HKDF Key Object. Why: A raw ECDH secret isn't used as a key directly. How: This imports it as HKDF input.

	const infValArr = new Uint8Array( [ ...WRA_INF_ARR, ...ephRawArr, ...memRawArr ] ); // What: Info Value Array. Why: The derived key belongs to this one pair of public keys. How: This joins the label and both keys.



	return crypto.subtle.deriveKey( { hash : 'SHA-256', info : infValArr, name : 'HKDF', salt : new Uint8Array() }, hkdKeyObj, { length : 256, name : 'AES-KW' }, false, [ 'unwrapKey', 'wrapKey' ] ); // What: Derived Key Return. Why: AES-KW wraps one key with another. How: This derives a 256-bit AES-KW key that can't be exported.


};

// #endregion kekDerFun



const groKeyFun = () : Promise< CryptoKey > => crypto.subtle.generateKey( { length : 256, name : 'AES-GCM' }, true, [ 'decrypt', 'encrypt' ] ) as Promise< CryptoKey >; // What: Group Key Function. Why: Each group encrypts its content with one key. How: This generates a 256-bit AES-GCM key, extractable so any member can wrap it for a joiner. // What: Type Assertion Note. Why: generateKey's type allows a key pair, which a symmetric algorithm never returns. How: The as reads it as one key.



// #region wraKeyFun

/**
 * wraKeyFun = Wrap Key Function
 *
 * @summary
 * Wraps a group key for one member with a one-time key, given the member's
 * raw public key as published in users/{uid}, and returns the 105-byte wrap
 * their member document stores.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groKeyObj - Group Key Object: The group key being wrapped.
 * @param memRawArr - Member Raw Array: The member's raw 65-byte public key.
 *
 * @returns A promise that resolves with the throwaway public key followed
 *          by the wrapped key.
 *
 * @example
 * ```ts
 * wraKeyFun(groKeyObj, memRawArr) // => Uint8Array(105)
 * ```
 *
*/

const wraKeyFun = async ( groKeyObj : CryptoKey, memRawArr : Uint8Array< ArrayBuffer > ) : Promise< Uint8Array< ArrayBuffer > > => { // What: Wrap Key Function. Why: A member can only read the group once its key is wrapped for them (Section 6). How: This wraps it with a one-time key.


	const ephParObj = await crypto.subtle.generateKey( ECD_ALG_OBJ, false, [ 'deriveBits' ] ) as CryptoKeyPair; // What: Ephemeral Pair Object. Why: Each wrap uses its own throwaway key, so no wrap depends on who made it. How: This generates one whose private half is never exported. // What: Type Assertion Note. Why: generateKey's type allows a single key, which ECDH never returns. How: The as reads it as a pair.
	const ephRawArr = new Uint8Array( await crypto.subtle.exportKey( 'raw', ephParObj.publicKey ) );            // What: Ephemeral Raw Array. Why: The member needs the throwaway public key to unwrap. How: This exports it as the raw point.
	const memKeyObj = await crypto.subtle.importKey( 'raw', memRawArr, ECD_ALG_OBJ, false, [] );                // What: Member Key Object. Why: ECDH takes the member's key as a CryptoKey. How: This imports their raw public key.

	const kekValObj = await kekDerFun( ephParObj.privateKey, memKeyObj, ephRawArr, memRawArr ); // What: Key-Encryption-Key Value Object. Why: The wrapping key comes from the throwaway private key and the member's public key. How: This derives it.

	const wraKeyBuf = await crypto.subtle.wrapKey( 'raw', groKeyObj, kekValObj, 'AES-KW' ); // What: Wrapped Key Buffer. Why: The group key travels wrapped. How: This wraps its raw bytes with AES-KW, 40 bytes for a 256-bit key.



	return new Uint8Array( [ ...ephRawArr, ...new Uint8Array( wraKeyBuf ) ] ); // What: Wrap Return. Why: The member document stores both halves as one value. How: This joins the throwaway public key and the wrapped key.


};

// #endregion wraKeyFun



// #region unwKeyFun

/**
 * unwKeyFun = Unwrap Key Function
 *
 * @summary
 * Unwraps a group key from a member document's wrap with the member's own
 * private key, giving back an extractable AES-GCM key, so this member can
 * wrap it for a joiner in turn. Rejects when the wrap wasn't made for this
 * key pair.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param wraBytArr - Wrap Bytes Array: The 105-byte wrap.
 * @param keyParObj - Key Pair Object: The member's own key pair.
 *
 * @returns A promise that resolves with the group key.
 *
 * @example
 * ```ts
 * unwKeyFun(wraBytArr, keyParObj) // => CryptoKey
 * ```
 *
*/

const unwKeyFun = async ( wraBytArr : Uint8Array< ArrayBuffer >, keyParObj : CryptoKeyPair ) : Promise< CryptoKey > => { // What: Unwrap Key Function. Why: A member reads the group with the key wrapped for them. How: This rederives the wrapping key and unwraps.


	const ephRawArr = wraBytArr.slice( 0, PUB_LEN_NUM );                                             // What: Ephemeral Raw Array. Why: The wrap starts with the throwaway public key. How: This takes its 65 bytes.
	const ephKeyObj = await crypto.subtle.importKey( 'raw', ephRawArr, ECD_ALG_OBJ, false, [] );     // What: Ephemeral Key Object. Why: ECDH takes the throwaway key as a CryptoKey. How: This imports it.
	const memRawArr = new Uint8Array( await crypto.subtle.exportKey( 'raw', keyParObj.publicKey ) ); // What: Member Raw Array. Why: The derivation is bound to the member's own public key. How: This exports it.

	const kekValObj = await kekDerFun( keyParObj.privateKey, ephKeyObj, ephRawArr, memRawArr ); // What: Key-Encryption-Key Value Object. Why: The member's private key and the throwaway public key give the same wrapping key. How: This derives it.



	return crypto.subtle.unwrapKey( 'raw', wraBytArr.slice( PUB_LEN_NUM ), kekValObj, 'AES-KW', 'AES-GCM', true, [ 'decrypt', 'encrypt' ] ); // What: Unwrapped Key Return. Why: The member encrypts and reads with the group key, and may wrap it for a joiner. How: This unwraps the rest of the bytes into an extractable AES-GCM key.


};

// #endregion unwKeyFun



// #region encTexFun

/**
 * encTexFun = Encrypt Text Function
 *
 * @summary
 * Encrypts text with a group key under AES-GCM and a fresh random 12-byte
 * IV, returning both for storage.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param keyValObj - Key Value Object: The group key.
 * @param texValStr - Text Value String: The text to encrypt.
 *
 * @returns A promise that resolves with the ciphertext and its IV.
 *
 * @example
 * ```ts
 * encTexFun(keyValObj, 'Alice') // => { cipTexArr, iniVecArr }
 * ```
 *
*/

const encTexFun = async ( keyValObj : CryptoKey, texValStr : string ) : Promise< { cipTexArr : Uint8Array< ArrayBuffer >, iniVecArr : Uint8Array< ArrayBuffer > } > => { // What: Encrypt Text Function. Why: Firebase only ever sees ciphertext for content (Section 6). How: This encrypts with a fresh IV.


	const iniVecArr = crypto.getRandomValues( new Uint8Array( 12 ) ); // What: Initialization Vector Array. Why: AES-GCM needs a fresh IV for every encryption under one key. How: This draws 12 random bytes.


	const cipTexArr = new Uint8Array( await crypto.subtle.encrypt( { iv : iniVecArr, name : 'AES-GCM' }, keyValObj, new TextEncoder().encode( texValStr ) ) ); // What: Cipher Text Array. Why: The text is stored encrypted, with its 16-byte tag. How: This encrypts its UTF-8 bytes.



	return { cipTexArr, iniVecArr }; // What: Encrypted Return. Why: Both are stored together. How: This returns the ciphertext and its IV.


};

// #endregion encTexFun



const decTexFun = async ( keyValObj : CryptoKey, cipTexArr : Uint8Array< ArrayBuffer >, iniVecArr : Uint8Array< ArrayBuffer > ) : Promise< string > => new TextDecoder().decode( await crypto.subtle.decrypt( { iv : iniVecArr, name : 'AES-GCM' }, keyValObj, cipTexArr ) ); // What: Decrypt Text Function. Why: Members read what the group key encrypted. How: This decrypts and decodes it, rejecting when the key, IV, or ciphertext doesn't match.



const tokCreFun = () : string => btoa( String.fromCharCode( ...crypto.getRandomValues( new Uint8Array( 16 ) ) ) ).replace( /\+/g, '-' ).replace( /\//g, '_' ).replace( /=+$/, '' ); // What: Token Create Function. Why: An invite token is 128 random bits nobody can guess (Section 11.6). How: This draws 16 random bytes and writes them as 22 base64url characters.

// #endregion Helpers



// #region Exports

export { decTexFun, encTexFun, groKeyFun, tokCreFun, unwKeyFun, wraKeyFun }; // What: Named Exports. Why: Every encrypted feature uses these. How: This exports them.

// #endregion Exports


