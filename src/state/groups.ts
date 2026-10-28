


// #region Imports

import { Bytes           } from 'firebase/firestore';       // What: Bytes. Why: The wrapped key, encrypted name, and IV are stored as Firestore bytes (Section 6). How: This wraps raw bytes.
import { collection      } from 'firebase/firestore';       // What: Collection. Why: A new group takes Firestore's own ID. How: This names the groups collection.
import { doc             } from 'firebase/firestore';       // What: Doc. Why: Each document the creation writes is named by path. How: This builds a reference.
import { encTexFun       } from '../platform/crypto.ts';    // What: Encrypt Text Function. Why: The creator's display name is stored encrypted. How: This encrypts it with the group key.
import { FieldPath       } from 'firebase/firestore';       // What: Field Path. Why: The group's ID becomes a key in the owned map. How: This names it without reading it as a dotted path.
import { firGetFun       } from '../platform/firebase.ts';  // What: Firebase Get Function. Why: The creation writes to Firestore. How: This returns the services.
import { getDoc          } from 'firebase/firestore';       // What: Get Doc. Why: A lost group key is recovered from the member document. How: This reads it.
import { groKeyFun       } from '../platform/crypto.ts';    // What: Group Key Function. Why: Each new group has its own key. How: This makes one.
import { groNamFun       } from '../core/text-limits.ts';   // What: Group Name Function. Why: A group name is checked before anything is written. How: This applies the limits.
import { ideEnsFun       } from './identity.ts';            // What: Identity Ensure Function. Why: Creating a group is a first group action. How: This makes sure the identity exists.
import { keyGetFun       } from '../platform/key-store.ts'; // What: Key Get Function. Why: A group key is kept on the device. How: This reads it.
import { keyPutFun       } from '../platform/key-store.ts'; // What: Key Put Function. Why: A group key is kept on the device. How: This stores it.
import { perNamFun       } from '../core/text-limits.ts';   // What: Person Name Function. Why: The encrypted display name is checked by the app alone. How: This applies the limits.
import { runTransaction  } from 'firebase/firestore';       // What: Run Transaction. Why: A rotation and a settings change read the group they change. How: This runs the reads and writes together.
import { serverTimestamp } from 'firebase/firestore';       // What: Server Timestamp. Why: The rules require the server's time on every new document. How: This asks the server to fill it in.
import { texNorFun       } from '../core/text-limits.ts';   // What: Text Normalize Function. Why: Typed names are tidied before they're checked. How: This normalizes them.
import { tokCreFun       } from '../platform/crypto.ts';    // What: Token Create Function. Why: Each group starts with an invite link. How: This draws its token.
import { unwKeyFun       } from '../platform/crypto.ts';    // What: Unwrap Key Function. Why: A lost group key is recovered from the member's own wrap. How: This unwraps it.
import { wraKeyFun       } from '../platform/crypto.ts';    // What: Wrap Key Function. Why: The creator's membership holds the group key wrapped for them. How: This wraps it.
import { writeBatch      } from 'firebase/firestore';       // What: Write Batch. Why: A group is created whole or not at all. How: This groups the creation's writes.

// #endregion Imports



/**
 * groups.ts = Groups
 *
 * @summary
 * Creating a group, the owner's changes to it, and reading a group's key back
 * on this device (ARCHITECTURE.md Sections 6, 9, and 11). Creation tidies and
 * checks both names, makes sure the identity exists, makes the group's key and
 * invite token, and writes the whole group in one batch, as the rules require:
 * the group, the creator's membership with the key wrapped for them and their
 * display name encrypted, the group's first invite, and the group in the
 * creator's owned map. The key is then kept on the device under
 * group:{groupId}. A key missing from the device, such as after its storage
 * was cleared, is recovered from the member's own wrap and kept again. The
 * owner rotates the invite link, and renames the group or changes its chat
 * retention, each in one transaction that keeps the invite in step.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region groCreFun

/**
 * groCreFun = Group Create Function
 *
 * @summary
 * Creates a group owned by this identity, with a 30-day chat retention and
 * its first invite, and resolves with the group's ID. Both names are tidied
 * first, and a name outside its limits rejects with a RangeError before
 * anything is created.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groNamStr - Group Name String: The group's name, as typed.
 * @param perNamStr - Person Name String: The creator's display name in this
 *                    group, as typed.
 *
 * @returns A promise that resolves with the new group's ID.
 *
 * @example
 * ```ts
 * groCreFun('Beach Day', 'Alice') // => 'Xk3...'
 * ```
 *
*/

const groCreFun = async ( groNamStr : string, perNamStr : string ) : Promise< string > => { // What: Group Create Function. Why: Creating a group is how anyone starts using the app. How: This checks the names, then writes the group in one batch.


	const groNorStr = texNorFun( groNamStr ); // What: Group Normalized String. Why: The name is saved tidied. How: This normalizes it.
	const perNorStr = texNorFun( perNamStr ); // What: Person Normalized String. Why: The display name is saved tidied. How: This normalizes it.


	if ( !groNamFun( groNorStr ) ) throw new RangeError( 'The group name is outside its limits.' ); // What: Group Name Guard. Why: The rules would refuse it, after the identity had been made. How: This rejects first.



	if ( !perNamFun( perNorStr ) ) throw new RangeError( 'The display name is outside its limits.' ); // What: Person Name Guard. Why: The rules can't check an encrypted name. How: This rejects it here.



	const { keyParObj, uidValStr } = await ideEnsFun(); // What: Identity Values. Why: The creator becomes the owner and first member. How: This makes sure the identity exists and reads it.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The creation writes to Firestore. How: This reads the service.

	const groIdeStr = doc( collection( fstDatObj, 'groups' ) ).id;                                   // What: Group Identifier String. Why: A group takes Firestore's own random ID. How: This draws one without writing.
	const groKeyObj = await groKeyFun();                                                             // What: Group Key Object. Why: The group's content is encrypted under its own key. How: This makes it.
	const ownRawArr = new Uint8Array( await crypto.subtle.exportKey( 'raw', keyParObj.publicKey ) ); // What: Owner Raw Array. Why: The key is wrapped for the creator's own public key. How: This exports it.
	const tokValStr = tokCreFun();                                                                   // What: Token Value String. Why: A group always has a working invite. How: This draws its token.

	const namEncObj = await encTexFun( groKeyObj, perNorStr ); // What: Name Encrypted Object. Why: The display name is stored encrypted (Section 11.3). How: This encrypts it under the group key.
	const wraKeyArr = await wraKeyFun( groKeyObj, ownRawArr ); // What: Wrapped Key Array. Why: The creator reads the group through their own wrap. How: This wraps the key for them.

	const batWriObj = writeBatch( fstDatObj ); // What: Batch Write Object. Why: The rules check each write against the others. How: This starts the batch.


	batWriObj.set( doc( fstDatObj, `groups/${ groIdeStr }` ), { // What: Group Set Call. Why: The group itself, starting with its owner as its one counted member. How: This writes every field the rules expect.


		chatTtlDays        : 30,
		countedUid         : uidValStr,
		createdAt          : serverTimestamp(),
		currentInviteToken : tokValStr,
		memberCount        : 1,
		name               : groNorStr,
		ownerUid           : uidValStr,
		pendingOfferedAt   : null,
		pendingOwnerUid    : null,
		removedUids        : {}


	} );

	batWriObj.set( doc( fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ), { // What: Member Set Call. Why: The creator is the first member. How: This writes their membership with the wrapped key and encrypted name.


		displayNameEnc  : Bytes.fromUint8Array( namEncObj.cipTexArr ),
		iv              : Bytes.fromUint8Array( namEncObj.iniVecArr ),
		joinedAt        : serverTimestamp(),
		lastActiveAt    : serverTimestamp(),
		wrappedGroupKey : Bytes.fromUint8Array( wraKeyArr )


	} );

	batWriObj.set( doc( fstDatObj, `invites/${ tokValStr }` ), { createdAt : serverTimestamp(), groupId : groIdeStr, groupName : groNorStr } ); // What: Invite Set Call. Why: A group always has a working invite, showing its name. How: This writes the first one.

	batWriObj.update( doc( fstDatObj, `accounts/${ uidValStr }` ), new FieldPath( 'ownedGroups', groIdeStr ), true ); // What: Account Update Call. Why: The group takes one of the creator's owned slots (Section 18). How: This adds it to their owned map.

	await batWriObj.commit(); // What: Batch Commit Call. Why: The group exists whole or not at all. How: This commits the batch.

	await keyPutFun( `group:${ groIdeStr }`, groKeyObj ); // What: Key Store Call. Why: The device reads the group with its key. How: This keeps the key under the group's name.



	return groIdeStr; // What: Group Return. Why: The app opens the new group. How: This returns its ID.


};

// #endregion groCreFun



// #region groSetFun

/**
 * groSetFun = Group Settings Function
 *
 * @summary
 * Saves a group's name and chat retention as its owner, in one transaction
 * with the current invite's copy of the name, as the rules require. The
 * name is tidied first, and a name outside its limits, or a retention that
 * isn't a whole number of days from 7 to 180, rejects with a RangeError
 * before anything is written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param groNamStr - Group Name String: The group's name, as typed.
 * @param ttlDayNum - TTL Day Number: How many days chat is kept.
 *
 * @returns A promise that settles once the settings are saved, with no
 *          value.
 *
 * @example
 * ```ts
 * groSetFun('Xk3...', 'Beach Week', 60) // => Promise<void>
 * ```
 *
*/

const groSetFun = async ( groIdeStr : string, groNamStr : string, ttlDayNum : number ) : Promise< void > => { // What: Group Settings Function. Why: The owner renames the group and sets how long its chat is kept (Section 11.2). How: This checks both, then saves them with the invite's copy of the name.


	const groNorStr = texNorFun( groNamStr ); // What: Group Normalized String. Why: The name is saved tidied. How: This normalizes it.


	if ( !groNamFun( groNorStr ) ) throw new RangeError( 'The group name is outside its limits.' ); // What: Group Name Guard. Why: The rules would refuse it. How: This rejects first.



	const ttlIntBoo = Number.isInteger( ttlDayNum ); // What: TTL Integer Boolean. Why: Retention is a whole number of days. How: This checks it.
	const ttlLowBoo = ttlDayNum >= 7;                // What: TTL Low Boolean. Why: Chat is kept at least 7 days. How: This checks the lower bound.
	const ttlTopBoo = ttlDayNum <= 180;              // What: TTL Top Boolean. Why: Chat is kept at most 180 days. How: This checks the upper bound.

	const ttlValBoo = ttlIntBoo && ttlLowBoo && ttlTopBoo; // What: TTL Valid Boolean. Why: Every check has to pass. How: This combines them.


	if ( !ttlValBoo ) throw new RangeError( 'The chat retention is outside its limits.' ); // What: Retention Guard. Why: The rules would refuse it. How: This rejects first.



	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The settings are saved to Firestore. How: This reads the service.

	const groRefObj = doc( fstDatObj, `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: The settings live on the group. How: This names it.


	await runTransaction( fstDatObj, async ( traValObj ) => { // What: Settings Transaction. Why: The invite to update is the one the group names when the change lands. How: This reads the group's token, then writes both together, retrying on a conflict.


		const tokCurStr = ( await traValObj.get( groRefObj ) ).get( 'currentInviteToken' ) as string; // What: Token Current String. Why: The working invite carries a copy of the name. How: This reads its token. // What: Type Assertion Note. Why: The rules store the token as a string. How: The as reads it as one.


		traValObj.update( groRefObj, { chatTtlDays : ttlDayNum, name : groNorStr } ); // What: Group Update Call. Why: The group's settings change. How: This writes the name and retention.

		traValObj.update( doc( fstDatObj, `invites/${ tokCurStr }` ), { groupName : groNorStr } ); // What: Invite Update Call. Why: The invite screen has to show the group's real name (Section 11.6). How: This copies the name to the working invite.


	} );


};

// #endregion groSetFun



// #region invRotFun

/**
 * invRotFun = Invite Rotate Function
 *
 * @summary
 * Replaces a group's invite link as its owner, in one transaction, as the
 * rules require: the group names a fresh token, its invite is created with
 * the group's name, and the old invite is deleted, so the old link stops
 * working and the group still has exactly one. Resolves with the new token.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the new invite token.
 *
 * @example
 * ```ts
 * invRotFun('Xk3...') // => 'q1W...'
 * ```
 *
*/

const invRotFun = async ( groIdeStr : string ) : Promise< string > => { // What: Invite Rotate Function. Why: The owner can revoke the link at any time, such as after it's over-shared (Section 9). How: This swaps the group's invite for a new one in one transaction.


	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The rotation reads and writes Firestore. How: This reads the service.

	const groRefObj = doc( fstDatObj, `groups/${ groIdeStr }` ); // What: Group Reference Object. Why: The group names its token. How: This names the group.
	const tokNewStr = tokCreFun();                               // What: Token New String. Why: The new link needs its own random token. How: This draws it.


	await runTransaction( fstDatObj, async ( traValObj ) => { // What: Rotation Transaction. Why: The old token and the name have to be read as they stand when the rotation lands. How: This reads the group, then writes every change together, retrying on a conflict.


		const groSnaObj = await traValObj.get( groRefObj ); // What: Group Snapshot Object. Why: The old token and the name come from the group. How: This reads it.


		traValObj.update( groRefObj, { currentInviteToken : tokNewStr } ); // What: Group Update Call. Why: The group names its one working link. How: This points it at the new token.

		traValObj.set( doc( fstDatObj, `invites/${ tokNewStr }` ), { // What: Invite Set Call. Why: The new link has to open the group. How: This creates its invite.


			createdAt : serverTimestamp(),                // What: Created At. Why: The rules require the server's time. How: This asks the server to fill it in.
			groupId   : groIdeStr,                        // What: Group ID. Why: The link opens this group. How: This names it.
			groupName : groSnaObj.get( 'name' ) as string // What: Group Name. Why: The invite screen shows the group's name. How: This copies it. // What: Type Assertion Note. Why: The rules store the name as a string. How: The as reads it as one.


		} );

		traValObj.delete( doc( fstDatObj, `invites/${ groSnaObj.get( 'currentInviteToken' ) as string }` ) ); // What: Invite Delete Call. Why: The old link has to stop working. How: This deletes its invite. // What: Type Assertion Note. Why: The rules store the token as a string. How: The as reads it as one.


	} );



	return tokNewStr; // What: Token Return. Why: The owner shares the new link. How: This returns the new token.


};

// #endregion invRotFun



// #region keyLoaFun

/**
 * keyLoaFun = Key Load Function
 *
 * @summary
 * Resolves with this device's key for a group: the one kept on the device,
 * or, when it's missing, the one unwrapped from this identity's member
 * document, which is then kept again. Rejects when this identity isn't a
 * member.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 *
 * @returns A promise that resolves with the group's key.
 *
 * @example
 * ```ts
 * keyLoaFun('Xk3...') // => CryptoKey
 * ```
 *
*/

const keyLoaFun = async ( groIdeStr : string ) : Promise< CryptoKey > => { // What: Key Load Function. Why: Every encrypted read and write in a group needs its key. How: This reads it from the device, or recovers it from the member's wrap.


	const stoKeyAny = await keyGetFun( `group:${ groIdeStr }` ) as CryptoKey | undefined; // What: Stored Key Any. Why: The key is usually kept on the device. How: This reads it. // What: Type Assertion Note. Why: Only this file stores group keys. How: The as reads it as one, or missing.


	if ( stoKeyAny ) return stoKeyAny; // What: Stored Key Guard. Why: A kept key needs no recovery. How: This returns it.



	const { keyParObj, uidValStr } = await ideEnsFun(); // What: Identity Values. Why: The wrap is opened with this identity's private key. How: This reads the identity.

	const memSnaObj = await getDoc( doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/members/${ uidValStr }` ) ); // What: Member Snapshot Object. Why: The member document holds the key wrapped for this identity. How: This reads it.

	const groKeyObj = await unwKeyFun( ( memSnaObj.get( 'wrappedGroupKey' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >, keyParObj ); // What: Group Key Object. Why: The wrap opens with this identity's private key alone. How: This unwraps it. // What: Type Assertion Note. Why: The rules store the wrap as bytes, and toUint8Array returns an array over a plain buffer. How: The two as read them as such.

	await keyPutFun( `group:${ groIdeStr }`, groKeyObj ); // What: Key Store Call. Why: The next read shouldn't need recovery. How: This keeps the key again.



	return groKeyObj; // What: Key Return. Why: The caller encrypts or reads with it. How: This returns the key.


};

// #endregion keyLoaFun

// #endregion Helpers



// #region Exports

export { groCreFun, groSetFun, invRotFun, keyLoaFun }; // What: Named Exports. Why: The group screens create groups, change their settings and link, and read their keys. How: This exports the functions.

// #endregion Exports


