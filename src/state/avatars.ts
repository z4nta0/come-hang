


// #region Imports

import { avsGetFun       } from '../platform/avatar-store.ts'; // What: Avatar-Store Get Function. Why: A photo kept on the device needn't download again. How: This reads it.
import { avsSetFun       } from '../platform/avatar-store.ts'; // What: Avatar-Store Set Function. Why: A downloaded photo is kept, and a removed one forgotten. How: This writes or deletes it.
import { Bytes           } from 'firebase/firestore';          // What: Bytes. Why: A photo's IV is stored as Firestore bytes. How: This wraps it.
import { decBytFun       } from '../platform/crypto.ts';       // What: Decrypt Bytes Function. Why: A photo is stored encrypted under the group key. How: This decrypts it.
import { deleteField     } from 'firebase/firestore';          // What: Delete Field. Why: Removing the photo removes its fields from each membership. How: This marks each for deletion.
import { deleteObject    } from 'firebase/storage';            // What: Delete Object. Why: A removed photo's file shouldn't stay in Storage. How: This deletes it.
import { doc             } from 'firebase/firestore';          // What: Doc. Why: The account and each membership are named by path. How: This builds a reference.
import { encBytFun       } from '../platform/crypto.ts';       // What: Encrypt Bytes Function. Why: A photo is shared encrypted under each group's key. How: This encrypts it.
import { firGetFun       } from '../platform/firebase.ts';     // What: Firebase Get Function. Why: Photos live in Storage, their fields in Firestore. How: This returns the services.
import { getBytes        } from 'firebase/storage';            // What: Get Bytes. Why: A member's photo is downloaded to show it. How: This reads its file.
import { getDoc          } from 'firebase/firestore';          // What: Get Doc. Why: The account lists the groups, and each membership holds the photo's fields. How: This reads them.
import { ideEnsFun       } from './identity.ts';               // What: Identity Ensure Function. Why: The photo is this identity's own. How: This reads the UID.
import { keyLoaFun       } from './groups.ts';                 // What: Key Load Function. Why: Each group's copy is encrypted under that group's key. How: This loads it.
import { ref             } from 'firebase/storage';            // What: Ref. Why: A photo's file is named by path. How: This builds a reference.
import { serverTimestamp } from 'firebase/firestore';          // What: Server Timestamp. Why: The newest photo wins when groups disagree. How: This stamps the server's time.
import { updateDoc       } from 'firebase/firestore';          // What: Update Doc. Why: The membership names the photo once its file is up. How: This writes its fields.
import { uploadBytes     } from 'firebase/storage';            // What: Upload Bytes. Why: Each group's copy goes to Storage. How: This writes its file.


import type { Timestamp } from 'firebase/firestore'; // What: Timestamp. Why: A photo's time is read back. How: This types it.

// #endregion Imports



/**
 * avatars.ts = Profile Photos
 *
 * @summary
 * A member's profile photo (ARCHITECTURE.md Section 21): one photo for every
 * group the member is in, cropped square and shrunk on the device, then
 * encrypted under each group's key and stored as that group's copy, the
 * membership naming it by an ID every copy shares, its IV, and when it was
 * set. Setting a photo writes every group's copy, removing it removes every
 * copy, and a sync copies the newest photo into any group missing it, such as
 * one joined since. A photo is shown from the device when kept there under
 * its current ID, and otherwise downloaded, decrypted, and kept.
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type OwnRecTyp = { avaIdeStr : string, avaIvaArr : Uint8Array< ArrayBuffer > | null, avaTimNum : number, groIdeStr : string }; // What: Own Record Type. Why: The sync compares this member's photo across groups. How: This types one group's copy, its ID empty when there's none.

// #endregion Types



// #region Constants

const IDE_ALP_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; // What: Identifier Alphabet String. Why: A photo's ID is 22 characters the rules accept. How: This lists the 64 characters each one is drawn from.

// #endregion Constants



// #region Module State

const DEC_MAP_OBJ = new Map< string, Promise< Uint8Array< ArrayBuffer > | null > >(); // What: Decrypted Map Object. Why: Many avatars of one member show at once, and the photo should be fetched once. How: This holds each photo's fetch by group, member, and ID.

// #endregion Module State



// #region Helpers

const avaPatFun = ( groIdeStr : string, uidValStr : string ) : string => `avatars/${ groIdeStr }/${ uidValStr }`; // What: Avatar Path Function. Why: Each group keeps one copy for each member. How: This names its file.

const ideNewFun = () : string => Array.from( crypto.getRandomValues( new Uint8Array( 22 ) ), ( bytValNum ) => IDE_ALP_STR[ bytValNum % 64 ] ).join( '' ); // What: Identifier New Function. Why: Every copy of one photo shares an ID, which changes with a new photo. How: This draws 22 random characters, 132 bits.



// #region avaGetFun

/**
 * avaGetFun = Avatar Get Function
 *
 * @summary
 * Resolves with a group member's profile photo, from the device when it's
 * kept there under the same ID, and otherwise downloaded, decrypted under the
 * group key, and kept. Resolves null when the member has no photo, or it
 * can't be fetched or won't decrypt, such as just after it changed. A fetch
 * already under way for the same photo is shared.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: The member's UID.
 * @param avaIdeStr - Avatar Identifier String: The photo's ID, empty when
 *                    there's none.
 * @param avaIvaArr - Avatar IV Array: The photo's IV, or null.
 *
 * @returns A promise that resolves with the photo's bytes, or null.
 *
 * @example
 * ```ts
 * avaGetFun('Xk3...', 'u1', 'a9...', avaIvaArr) // => Uint8Array
 * ```
 *
*/

const avaGetFun = ( groIdeStr : string, uidValStr : string, avaIdeStr : string, avaIvaArr : Uint8Array< ArrayBuffer > | null ) : Promise< Uint8Array< ArrayBuffer > | null > => { // What: Avatar Get Function. Why: A member's photo shows wherever their avatar does. How: This reads it from the device or fetches and keeps it.


	if ( avaIdeStr === '' || avaIvaArr === null ) return Promise.resolve( null ); // What: No Photo Guard. Why: A member with no photo shows their initials. How: This resolves null.



	const keyValStr = `${ groIdeStr }/${ uidValStr }`; // What: Key Value String. Why: The device keeps one photo for each group and member. How: This names it.
	const mapKeyStr = `${ keyValStr }@${ avaIdeStr }`;  // What: Map Key String. Why: A fetch is shared only for the same photo. How: This adds its ID.
	const pasProObj = DEC_MAP_OBJ.get( mapKeyStr );     // What: Past Promise Object. Why: A fetch already under way, or done, needn't run again. How: This reads it.


	if ( pasProObj !== undefined ) return pasProObj; // What: Shared Guard. Why: The same photo is fetched once. How: This returns the fetch already made.



	const newProObj = ( async () : Promise< Uint8Array< ArrayBuffer > | null > => { // What: New Promise Object. Why: The photo comes from the device or Storage. How: This tries the device first, then downloads, decrypts, and keeps it.


		const kepRecObj = await avsGetFun( keyValStr ).catch( () => null ); // What: Kept Record Object. Why: A photo kept under the same ID needs no download. How: This reads the device's copy, null on a failure.


		if ( kepRecObj !== null && kepRecObj.avaIdeStr === avaIdeStr ) return kepRecObj.bytArr; // What: Kept Guard. Why: The device already has this photo. How: This returns it.



		try { // What: Fetch Attempt. Why: A photo just changed, or a lost connection, shouldn't break an avatar. How: This downloads and decrypts the photo, null on a failure.


			const cipBytArr = new Uint8Array( await getBytes( ref( firGetFun().stoValObj, avaPatFun( groIdeStr, uidValStr ) ) ) ); // What: Cipher Bytes Array. Why: The photo is stored encrypted. How: This downloads it.
			const bytValArr = await decBytFun( await keyLoaFun( groIdeStr ), cipBytArr, avaIvaArr );                          // What: Bytes Value Array. Why: The photo shows decrypted. How: This decrypts it under the group key.


			avsSetFun( keyValStr, { avaIdeStr, bytArr : bytValArr } ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Keep Call. Why: The next showing, offline too, needs no download. How: This keeps it on the device, logging a failure.



			return bytValArr; // What: Bytes Return. Why: The avatar shows the photo. How: This returns its bytes.


		}

		catch ( errCatObj ) { // What: Fetch Catch. Why: The avatar falls back to initials. How: This logs the failure, forgets the fetch so a later showing tries again, and returns null.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			DEC_MAP_OBJ.delete( mapKeyStr ); // What: Forget Call. Why: A later showing should try again. How: This drops the failed fetch.



			return null; // What: Null Return. Why: The avatar shows initials instead. How: This returns null.


		}


	} )();



	DEC_MAP_OBJ.set( mapKeyStr, newProObj ); // What: Share Call. Why: Other avatars of the same photo wait on this fetch. How: This keeps it under the photo's key.



	return newProObj; // What: Fetch Return. Why: The caller shows the photo once it's in. How: This returns the fetch.


};

// #endregion avaGetFun



// #region ownLisFun

/**
 * ownLisFun = Own List Function
 *
 * @summary
 * Resolves with this member's UID and their photo in each group their
 * account lists, read from each membership, a group that can't be read
 * left out.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the UID and one record per group.
 *
 * @example
 * ```ts
 * ownLisFun() // => { ownRecArr : [...], uidValStr : 'u1' }
 * ```
 *
*/

const ownLisFun = async () : Promise< { ownRecArr : OwnRecTyp[], uidValStr : string } > => { // What: Own List Function. Why: Setting, removing, and syncing the photo work across every group. How: This reads the groups from the account, then each membership's photo.


	const { fstDatObj } = firGetFun();       // What: Firestore Data Object. Why: The account and memberships live there. How: This reads it.
	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The photo is this member's own. How: This reads the identity.

	const accSnaObj = await getDoc( doc( fstDatObj, `accounts/${ uidValStr }` ) ); // What: Account Snapshot Object. Why: The account lists the member's groups. How: This reads it.
	const groIdeArr = [ ...new Set( [ ...Object.keys( accSnaObj.get( 'ownedGroups' ) ?? {} ), ...Object.keys( accSnaObj.get( 'memberGroups' ) ?? {} ) ] ) ]; // What: Group Identifier Array. Why: A group sits in one of the account's two maps. How: This joins both, each group once.


	const ownRecArr = await Promise.all( groIdeArr.map( async ( groIdeStr ) : Promise< OwnRecTyp | null > => { // What: Own Record Array. Why: Each group holds its own copy. How: This reads each membership's photo fields, null for one that can't be read.


		const memSnaObj = await getDoc( doc( fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) ).catch( () => null ); // What: Member Snapshot Object. Why: The membership names the photo. How: This reads it, null when the rules refuse it.


		if ( memSnaObj === null || !memSnaObj.exists() ) return null; // What: Unreadable Guard. Why: A group just left has no membership to read. How: This returns null.



		const avaIdeAny : unknown = memSnaObj.get( 'avatarId' );                                          // What: Avatar Identifier Any. Why: The photo is named by its ID. How: This reads it, untyped.
		const avaIvaAny : unknown = memSnaObj.get( 'avatarIv' );                                          // What: Avatar IV Any. Why: The photo decrypts with its IV. How: This reads it, untyped.
		const avaTimAny : unknown = memSnaObj.get( 'avatarAt', { serverTimestamps : 'estimate' } );       // What: Avatar Time Any. Why: The newest photo wins. How: This reads when it was set, untyped.

		const ideValBoo = typeof avaIdeAny === 'string' && avaIdeAny !== ''; // What: Identifier Valid Boolean. Why: A photo is named by a non-empty ID. How: This checks it.
		const ivaValBoo = avaIvaAny instanceof Bytes;                       // What: IV Valid Boolean. Why: The photo decrypts only with its IV. How: This checks it's bytes.

		const avaValBoo = ideValBoo && ivaValBoo; // What: Avatar Valid Boolean. Why: A photo counts only with both its ID and its IV. How: This combines the checks.


		const avaTimBoo = typeof avaTimAny === 'object' && avaTimAny !== null; // What: Avatar Time Boolean. Why: A time that isn't one reads as the oldest. How: This checks it's an object, as a timestamp is.



		return { // What: Record Return. Why: The group's copy is compared with the others. How: This returns its ID, IV, and time, empty, null, and 0 when there's none.


			avaIdeStr : avaValBoo ? avaIdeAny as string : '',                                                    // What: Avatar Identifier String. Why: Copies are matched by ID. How: This holds it, empty when there's none. // What: Type Assertion Note. Why: avaValBoo confirms it's a string. How: The as reads it as one.
			avaIvaArr : avaValBoo ? ( avaIvaAny as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer > : null,  // What: Avatar IV Array. Why: The newest copy decrypts with it. How: This holds it, null when there's none. // What: Type Assertion Note. Why: avaValBoo confirms it's bytes, and toUint8Array returns an array over a plain buffer. How: The two as read them as such.
			avaTimNum : avaValBoo && avaTimBoo ? ( avaTimAny as Timestamp ).toMillis() : 0,                       // What: Avatar Time Number. Why: The newest copy wins. How: This holds when it was set, 0 when there's no photo. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.
			groIdeStr                                                                                             // What: Group Identifier String. Why: The copy belongs to its group. How: This holds the group's ID.


		};


	} ) );



	return { ownRecArr : ownRecArr.filter( ( ownRecObj ) => ownRecObj !== null ), uidValStr }; // What: List Return. Why: Only readable groups count. How: This returns the UID and the records, leaving out the unreadable ones.


};

// #endregion ownLisFun



// #region avaPutFun

/**
 * avaPutFun = Avatar Put Function
 *
 * @summary
 * Stores one group's copy of this member's photo: encrypts it under the
 * group key, uploads the file, then names it on the membership with its ID,
 * IV, and the server's time, so a reader never meets a name before its file,
 * and keeps it on the device.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param uidValStr - UID Value String: This member's UID.
 * @param avaIdeStr - Avatar Identifier String: The ID every copy shares.
 * @param bytValArr - Bytes Value Array: The photo's bytes.
 *
 * @returns A promise that settles once the copy is stored, with no value.
 *
 * @example
 * ```ts
 * avaPutFun('Xk3...', 'u1', 'a9...', bytValArr) // => Promise<void>
 * ```
 *
*/

const avaPutFun = async ( groIdeStr : string, uidValStr : string, avaIdeStr : string, bytValArr : Uint8Array< ArrayBuffer > ) : Promise< void > => { // What: Avatar Put Function. Why: Each group keeps its own encrypted copy. How: This encrypts, uploads, and names it.


	const encValObj = await encBytFun( await keyLoaFun( groIdeStr ), bytValArr ); // What: Encrypted Value Object. Why: Firebase only ever sees ciphertext. How: This encrypts the photo under the group key with a fresh IV.


	await uploadBytes( ref( firGetFun().stoValObj, avaPatFun( groIdeStr, uidValStr ) ), encValObj.cipTexArr, { contentType : 'application/octet-stream' } ); // What: Upload Call. Why: The file has to be up before the membership names it. How: This writes the encrypted photo as opaque bytes.

	await updateDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), { avatarAt : serverTimestamp(), avatarId : avaIdeStr, avatarIv : Bytes.fromUint8Array( encValObj.iniVecArr ) } ); // What: Name Call. Why: Members find the photo through the membership. How: This writes its time, ID, and IV.

	await avsSetFun( `${ groIdeStr }/${ uidValStr }`, { avaIdeStr, bytArr : bytValArr } ); // What: Keep Call. Why: This device shows the photo without downloading it. How: This keeps it.


};

// #endregion avaPutFun



// #region proSetFun

/**
 * proSetFun = Profile Set Function
 *
 * @summary
 * Sets this member's profile photo, already cropped and shrunk, in every
 * group they're in, storing each group's copy under one new ID. Rejects
 * when the member is in no group, since a copy is kept only in a group, or a
 * copy fails, any copies stored before it standing.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param bytValArr - Bytes Value Array: The photo's bytes.
 *
 * @returns A promise that settles once every copy is stored, with no value.
 *
 * @example
 * ```ts
 * proSetFun(bytValArr) // => Promise<void>
 * ```
 *
*/

const proSetFun = async ( bytValArr : Uint8Array< ArrayBuffer > ) : Promise< void > => { // What: Profile Set Function. Why: One photo shows in every group. How: This stores a copy in each under one new ID.


	const { ownRecArr, uidValStr } = await ownLisFun(); // What: Own Records. Why: Every group gets a copy. How: This reads the groups and the UID.


	if ( ownRecArr.length === 0 ) throw new RangeError( 'A profile photo needs a group to keep it in.' ); // What: No Group Guard. Why: A photo is encrypted under a group's key, so it has nowhere to go outside one. How: This rejects.



	const avaIdeStr = ideNewFun(); // What: Avatar Identifier String. Why: Every copy shares one ID. How: This draws a new one.


	for ( const ownRecObj of ownRecArr ) await avaPutFun( ownRecObj.groIdeStr, uidValStr, avaIdeStr, bytValArr ); // What: Group Loop. Why: Each group gets its copy. How: This stores them one at a time.


};

// #endregion proSetFun



// #region proDelFun

/**
 * proDelFun = Profile Delete Function
 *
 * @summary
 * Removes this member's profile photo from every group they're in: clears
 * its fields on each membership first, so nobody looks for the file, then
 * deletes the file, skipping one already gone, and forgets the device's
 * copy. Rejects when a step fails, the groups before it already cleared.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that settles once every copy is gone, with no value.
 *
 * @example
 * ```ts
 * proDelFun() // => Promise<void>
 * ```
 *
*/

const proDelFun = async () : Promise< void > => { // What: Profile Delete Function. Why: A member can go back to their colored initials. How: This clears and deletes every copy.


	const { ownRecArr, uidValStr } = await ownLisFun(); // What: Own Records. Why: Every group's copy goes. How: This reads the groups and the UID.



	for ( const ownRecObj of ownRecArr ) { // What: Group Loop. Why: Each group's copy goes. How: This clears, deletes, and forgets it in turn.


		await updateDoc( doc( firGetFun().fstDatObj, `groups/${ ownRecObj.groIdeStr }/members/${ uidValStr }` ), { avatarAt : deleteField(), avatarId : deleteField(), avatarIv : deleteField() } ); // What: Clear Call. Why: Members stop looking for the photo. How: This removes its fields.

		await deleteObject( ref( firGetFun().stoValObj, avaPatFun( ownRecObj.groIdeStr, uidValStr ) ) ).catch( ( errCatObj : unknown ) => { if ( ( errCatObj as { code? : string } ).code !== 'storage/object-not-found' ) throw errCatObj; } ); // What: File Delete Call. Why: A removed photo's file shouldn't stay in Storage. How: This deletes it, skipping one already gone. // What: Type Assertion Note. Why: A Storage error carries its code. How: The as reads it.

		await avsSetFun( `${ ownRecObj.groIdeStr }/${ uidValStr }`, null ); // What: Forget Call. Why: The device shouldn't keep the photo. How: This deletes its copy.


	}


};

// #endregion proDelFun



// #region proSynFun

/**
 * proSynFun = Profile Sync Function
 *
 * @summary
 * Brings every group in line with this member's newest photo: finds the
 * copy set most recently, then stores it, under the same ID, in each group
 * whose copy is missing or older, such as one joined since. Does nothing
 * when no group holds a photo. Rejects when the newest copy can't be read
 * or a copy fails. Resolves with the newest photo and how many groups the
 * member is in, which Settings shows.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns A promise that resolves with the newest photo's bytes, null
 *          when there's none, and the number of groups.
 *
 * @example
 * ```ts
 * proSynFun() // => { bytArr : Uint8Array, groCouNum : 2 }
 * ```
 *
*/

const proSynFun = async () : Promise< { bytArr : Uint8Array< ArrayBuffer > | null, groCouNum : number } > => { // What: Profile Sync Function. Why: One photo shows in every group, including groups joined after it was set. How: This copies the newest into any group that lacks it.


	const { ownRecArr, uidValStr } = await ownLisFun(); // What: Own Records. Why: The copies are compared across groups. How: This reads the groups and the UID.

	const newRecObj = ownRecArr.filter( ( ownRecObj ) => ownRecObj.avaIdeStr !== '' ).sort( ( recOneObj, recTwoObj ) => recTwoObj.avaTimNum - recOneObj.avaTimNum )[ 0 ] as OwnRecTyp | undefined; // What: Newest Record Object. Why: The photo set last is the one to keep. How: This takes the copy with the latest time, undefined when no group has one. // What: Type Assertion Note. Why: An empty list has no first entry. How: The as reads it as possibly missing.


	if ( newRecObj === undefined ) return { bytArr : null, groCouNum : ownRecArr.length }; // What: No Photo Guard. Why: A member with no photo has nothing to copy. How: This resolves with no photo and the group count.



	const bytValArr = await avaGetFun( newRecObj.groIdeStr, uidValStr, newRecObj.avaIdeStr, newRecObj.avaIvaArr ); // What: Bytes Value Array. Why: The newest copy is the source for the others. How: This reads it.


	if ( bytValArr === null ) throw new Error( "The profile photo couldn't be read." ); // What: Unread Guard. Why: A photo that can't be read can't be copied. How: This rejects.



	for ( const ownRecObj of ownRecArr ) if ( ownRecObj.avaIdeStr !== newRecObj.avaIdeStr ) await avaPutFun( ownRecObj.groIdeStr, uidValStr, newRecObj.avaIdeStr, bytValArr ); // What: Group Loop. Why: A group missing the photo, or holding an older one, gets the newest. How: This stores it in each such group under the same ID.



	return { bytArr : bytValArr, groCouNum : ownRecArr.length }; // What: Photo Return. Why: Settings shows the member's photo, and whether they're in a group. How: This returns its bytes and the group count.


};

// #endregion proSynFun

// #endregion Helpers



// #region Exports

export { avaGetFun, proDelFun, proSetFun, proSynFun }; // What: Named Exports. Why: Avatars show members' photos, and Settings sets, removes, and syncs this member's own. How: This exports the four functions.

// #endregion Exports


