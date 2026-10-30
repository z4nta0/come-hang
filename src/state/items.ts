


// #region Imports

import { Bytes          } from 'firebase/firestore';      // What: Bytes. Why: An item's encrypted label and IV are stored as Firestore bytes. How: This wraps and reads raw bytes.
import { collection     } from 'firebase/firestore';      // What: Collection. Why: An event's items are listed together. How: This names the items collection.
import { decTexFun      } from '../platform/crypto.ts';   // What: Decrypt Text Function. Why: A label is stored encrypted. How: This decrypts it.
import { deleteDoc      } from 'firebase/firestore';      // What: Delete Doc. Why: Any member removes an item. How: This deletes it.
import { doc            } from 'firebase/firestore';      // What: Doc. Why: Each item and its event are named by path. How: This builds a reference.
import { encTexFun      } from '../platform/crypto.ts';   // What: Encrypt Text Function. Why: A label is stored encrypted. How: This encrypts it under the group key.
import { firGetFun      } from '../platform/firebase.ts'; // What: Firebase Get Function. Why: Items live in Firestore. How: This returns the services.
import { getDocs        } from 'firebase/firestore';      // What: Get Docs. Why: An event's items are read together. How: This reads the collection.
import { ideEnsFun      } from './identity.ts';           // What: Identity Ensure Function. Why: A claim names this identity. How: This reads it.
import { iteLabFun      } from '../core/text-limits.ts';  // What: Item Label Function. Why: A label is checked by the app alone. How: This applies the limits.
import { keyLoaFun      } from './groups.ts';             // What: Key Load Function. Why: Labels are encrypted with the group key. How: This loads it.
import { onSnapshot     } from 'firebase/firestore';      // What: On Snapshot. Why: The bring-list follows claims and new items as they land. How: This listens to the items.
import { runTransaction } from 'firebase/firestore';      // What: Run Transaction. Why: Each item write reads its event's deletion time, and a claim reads the item it takes. How: This runs the reads and writes together.
import { texNorFun      } from '../core/text-limits.ts';  // What: Text Normalize Function. Why: A label is tidied before it's checked. How: This normalizes it.


import type { DocumentReference     } from 'firebase/firestore'; // What: Document Reference. Why: The expiry helper reads an event by reference. How: This types it.
import type { QueryDocumentSnapshot } from 'firebase/firestore'; // What: Query Document Snapshot. Why: The list and the watch read each item from a listed document. How: This types it.
import type { Timestamp             } from 'firebase/firestore'; // What: Timestamp. Why: An event's deletion time comes back as a timestamp. How: This types it.
import type { Transaction           } from 'firebase/firestore'; // What: Transaction. Why: The expiry helper reads inside a caller's transaction. How: This types it.

// #endregion Imports



/**
 * items.ts = Items
 *
 * @summary
 * An event's bring-list, who's bringing what (ARCHITECTURE.md Sections 7 and
 * 11.5). Any member adds an item, open or already assigned to a member,
 * relabels it, claims an open one, reassigns or releases anyone's claim,
 * and removes it. A label is tidied, checked, and encrypted under the group
 * key. A claim is a compare-and-swap, so of two members claiming one item
 * at once, one wins and the other is told someone already has it. Every
 * write reads the event in its transaction and stamps the item with the
 * event's deletion time, as the rules require, which also brings an item
 * left out of step back in line, and a write to an item whose event is gone
 * rejects. Any member lists or watches the items with their labels
 * decrypted, where a label that won't decrypt comes back empty.
 *
 * Sections:
 *  - Types
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type IteRecTyp = { asgUidStr : string | null, iteIdeStr : string, labTexStr : string }; // What: Item Record Type. Why: The bring-list shows each item's label and who's bringing it. How: This types one item as iteLisFun and iteWatFun list it.

// #endregion Types



// #region Helpers

// #region expReaFun

/**
 * expReaFun = Expiry Read Function
 *
 * @summary
 * Reads an event's deletion time inside a transaction, so an item's write
 * carries the event's time as the write lands. Rejects with an Error when
 * the event is gone, since its items are then read-only.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param traValObj - Transaction Value Object: The caller's transaction.
 * @param eveRefObj - Event Reference Object: The item's event.
 *
 * @returns A promise that resolves with the event's deletion time.
 *
 * @example
 * ```ts
 * expReaFun(traValObj, eveRefObj) // => Timestamp
 * ```
 *
*/

const expReaFun = async ( traValObj : Transaction, eveRefObj : DocumentReference ) : Promise< Timestamp > => { // What: Expiry Read Function. Why: An item's deletion time has to match its event's (Section 11.5). How: This reads the event in the transaction.


	const eveSnaObj = await traValObj.get( eveRefObj ); // What: Event Snapshot Object. Why: The event holds the deletion time. How: This reads it.


	if ( !eveSnaObj.exists() ) throw new Error( 'The event is gone.' ); // What: Event Guard. Why: A cancelled event's items can't change. How: This rejects.



	return eveSnaObj.get( 'expireAt' ) as Timestamp; // What: Expiry Return. Why: The caller stamps the item with it. How: This returns the event's deletion time. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.


};

// #endregion expReaFun



const iteRefFun = ( groIdeStr : string, eveIdeStr : string, iteIdeStr : string ) : DocumentReference => doc( firGetFun().fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments/${ iteIdeStr }` ); // What: Item Reference Function. Why: Every item write names its item. How: This builds the item's reference.



// #region labEncFun

/**
 * labEncFun = Label Encrypt Function
 *
 * @summary
 * Tidies and checks an item's label, then encrypts it under the group key,
 * resolving with the encrypted label and its IV as Firestore bytes. A label
 * outside its limits rejects with a RangeError before anything is written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param labTexStr - Label Text String: The label, as typed.
 *
 * @returns A promise that resolves with the label's fields.
 *
 * @example
 * ```ts
 * labEncFun('Xk3...', 'Dessert') // => { iv, labelEnc }
 * ```
 *
*/

const labEncFun = async ( groIdeStr : string, labTexStr : string ) : Promise< { iv : Bytes, labelEnc : Bytes } > => { // What: Label Encrypt Function. Why: Adding and relabeling an item check and encrypt the label the same way. How: This tidies, checks, and encrypts it.


	const labNorStr = texNorFun( labTexStr ); // What: Label Normalized String. Why: The label is saved tidied. How: This normalizes it.


	if ( !iteLabFun( labNorStr ) ) throw new RangeError( 'The item label is outside its limits.' ); // What: Label Guard. Why: The rules can't read an encrypted label. How: This rejects it here.



	const labEncObj = await encTexFun( await keyLoaFun( groIdeStr ), labNorStr ); // What: Label Encrypted Object. Why: The label is stored encrypted. How: This encrypts it under the group key.



	return { // What: Fields Return. Why: The caller writes both. How: This returns them as bytes.


		iv       : Bytes.fromUint8Array( labEncObj.iniVecArr ), // What: IV. Why: The label decrypts with its IV. How: This wraps it.
		labelEnc : Bytes.fromUint8Array( labEncObj.cipTexArr )  // What: Label Encrypted. Why: The label is stored as bytes. How: This wraps it.


	};


};

// #endregion labEncFun



// #region iteAddFun

/**
 * iteAddFun = Item Add Function
 *
 * @summary
 * Adds an item to an event's bring-list, open or assigned to a member, and
 * resolves with its ID. A label outside its limits rejects with a
 * RangeError, an event that's gone with an Error, and the rules refuse an
 * assignee who isn't a member.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param labTexStr - Label Text String: The label, as typed.
 * @param asgUidStr - Assigned UID String: Who brings it, or null for open.
 *
 * @returns A promise that resolves with the new item's ID.
 *
 * @example
 * ```ts
 * iteAddFun('Xk3...', 'Ev7...', 'Dessert', null) // => 'It2...'
 * ```
 *
*/

const iteAddFun = async ( groIdeStr : string, eveIdeStr : string, labTexStr : string, asgUidStr : string | null ) : Promise< string > => { // What: Item Add Function. Why: Any member adds to the bring-list (Section 11.5). How: This encrypts the label and writes the item with its event's deletion time.


	const labFieObj = await labEncFun( groIdeStr, labTexStr ); // What: Label Fields Object. Why: The label is written checked and encrypted. How: This builds its fields.

	const { fstDatObj } = firGetFun(); // What: Firestore Data Object. Why: The item is written to Firestore. How: This reads the service.

	const eveRefObj = doc( fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }` );   // What: Event Reference Object. Why: The item takes its event's deletion time. How: This names the event.
	const iteRefObj = doc( collection( fstDatObj, `${ eveRefObj.path }/assignments` ) ); // What: Item Reference Object. Why: An item takes Firestore's own random ID. How: This draws one.


	await runTransaction( fstDatObj, async ( traValObj ) => { // What: Item Transaction. Why: The item's deletion time has to be the event's as the write lands. How: This reads the event's time and writes the item with it.


		const expTimObj = await expReaFun( traValObj, eveRefObj ); // What: Expiry Time Object. Why: The item takes its event's deletion time. How: This reads it.


		traValObj.set( iteRefObj, { ...labFieObj, assignedUid : asgUidStr, expireAt : expTimObj } ); // What: Item Set Call. Why: The item joins the bring-list. How: This writes its label, assignee, and deletion time.


	} );



	return iteRefObj.id; // What: Item Return. Why: The app shows the new item. How: This returns its ID.


};

// #endregion iteAddFun



// #region iteAsgFun

/**
 * iteAsgFun = Item Assign Function
 *
 * @summary
 * Reassigns an item to a member, or releases it with null, whoever held it,
 * which is how the group hands on a removed member's claims (Section 7). An
 * event that's gone rejects with an Error, and the rules refuse an assignee
 * who isn't a member.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param iteIdeStr - Item Identifier String: The item's ID.
 * @param asgUidStr - Assigned UID String: The new assignee, or null.
 *
 * @returns A promise that settles once the item changes, with no value.
 *
 * @example
 * ```ts
 * iteAsgFun('Xk3...', 'Ev7...', 'It2...', null) // => Promise<void>
 * ```
 *
*/

const iteAsgFun = async ( groIdeStr : string, eveIdeStr : string, iteIdeStr : string, asgUidStr : string | null ) : Promise< void > => { // What: Item Assign Function. Why: Any member reassigns or releases anyone's claim (Section 11.5). How: This sets the assignee with the event's deletion time.


	const iteRefObj = iteRefFun( groIdeStr, eveIdeStr, iteIdeStr ); // What: Item Reference Object. Why: The item changes. How: This names it.


	await runTransaction( firGetFun().fstDatObj, async ( traValObj ) => { // What: Assign Transaction. Why: The item's deletion time has to be the event's as the write lands. How: This reads the event's time and sets the assignee with it.


		const expTimObj = await expReaFun( traValObj, iteRefObj.parent.parent! ); // What: Expiry Time Object. Why: The item takes its event's deletion time. How: This reads it. // What: Non-Null Note. Why: An item's collection always sits under its event. How: The ! reads the event's reference as present.


		traValObj.update( iteRefObj, { assignedUid : asgUidStr, expireAt : expTimObj } ); // What: Assign Update Call. Why: The item changes hands. How: This sets the assignee with the deletion time.


	} );


};

// #endregion iteAsgFun



// #region iteClaFun

/**
 * iteClaFun = Item Claim Function
 *
 * @summary
 * Claims an open item for this identity as a compare-and-swap (Section 7):
 * the transaction reads the item and takes it only while nobody holds it,
 * so of two claims at once, one wins and the other rejects with an Error
 * saying someone already claimed it. An event that's gone rejects with an
 * Error too, and an item that's gone with Firestore's invalid-argument.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param iteIdeStr - Item Identifier String: The item's ID.
 *
 * @returns A promise that settles once the item is this identity's, with no
 *          value.
 *
 * @example
 * ```ts
 * iteClaFun('Xk3...', 'Ev7...', 'It2...') // => Promise<void>
 * ```
 *
*/

const iteClaFun = async ( groIdeStr : string, eveIdeStr : string, iteIdeStr : string ) : Promise< void > => { // What: Item Claim Function. Why: Two people claiming one thing mustn't silently overwrite each other (Section 7). How: This takes the item only while it's open, in one transaction.


	const { uidValStr } = await ideEnsFun(); // What: UID Value String. Why: The claim names this identity. How: This reads it.

	const iteRefObj = iteRefFun( groIdeStr, eveIdeStr, iteIdeStr ); // What: Item Reference Object. Why: The item is read and taken. How: This names it.


	await runTransaction( firGetFun().fstDatObj, async ( traValObj ) => { // What: Claim Transaction. Why: The item has to still be open when the claim lands. How: This reads the event and the item, then takes it, retrying on a conflict.


		const expTimObj = await expReaFun( traValObj, iteRefObj.parent.parent! ); // What: Expiry Time Object. Why: The item's deletion time has to be the event's. How: This reads it. // What: Non-Null Note. Why: An item's collection always sits under its event. How: The ! reads the event's reference as present.
		const iteSnaObj = await traValObj.get( iteRefObj );                       // What: Item Snapshot Object. Why: Only an open item can be claimed. How: This reads it.


		if ( iteSnaObj.get( 'assignedUid' ) ) throw new Error( 'Someone already claimed that.' ); // What: Claimed Guard. Why: A claim never takes an item someone else holds (Section 7). How: This rejects when the item names an assignee, while a removed item, with none, falls through to the update, which Firestore refuses.



		traValObj.update( iteRefObj, { assignedUid : uidValStr, expireAt : expTimObj } ); // What: Claim Update Call. Why: The item is this identity's now. How: This names them with the event's deletion time.


	} );


};

// #endregion iteClaFun



// #region iteDelFun

/**
 * iteDelFun = Item Delete Function
 *
 * @summary
 * Removes an item from an event's bring-list by deleting it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param iteIdeStr - Item Identifier String: The item's ID.
 *
 * @returns A promise that settles once the item is gone, with no value.
 *
 * @example
 * ```ts
 * iteDelFun('Xk3...', 'Ev7...', 'It2...') // => Promise<void>
 * ```
 *
*/

const iteDelFun = ( groIdeStr : string, eveIdeStr : string, iteIdeStr : string ) : Promise< void > => deleteDoc( iteRefFun( groIdeStr, eveIdeStr, iteIdeStr ) ); // What: Item Delete Function. Why: Any member removes an item (Section 11.5). How: This deletes it.

// #endregion iteDelFun



const iteRecFun = async ( groKeyObj : CryptoKey, iteDocObj : QueryDocumentSnapshot ) : Promise< IteRecTyp > => { // What: Item Record Function. Why: The list and the watch read an item the same way. How: This reads its fields, decrypting its label.


	return { // What: Record Return. Why: Each item becomes one record. How: This returns its fields.


		asgUidStr : iteDocObj.get( 'assignedUid' ) as string | null, // What: Assigned UID String. Why: The list shows who's bringing it. How: This reads the assignee, null when it's open. // What: Type Assertion Note. Why: The rules store a UID or null. How: The as reads it as either.
		iteIdeStr : iteDocObj.id,                                    // What: Item Identifier String. Why: An item is claimed and changed by ID. How: This reads it.
		labTexStr : await decTexFun( groKeyObj, ( iteDocObj.get( 'labelEnc' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer >, ( iteDocObj.get( 'iv' ) as Bytes ).toUint8Array() as Uint8Array< ArrayBuffer > ).catch( () => '' ) // What: Label Text String. Why: The label says what to bring. How: This decrypts it, empty when it won't. // What: Type Assertion Note. Why: The rules store both as bytes, and toUint8Array returns an array over a plain buffer. How: The as read them as such.


	};


};



const iteSorFun = ( iteRecArr : IteRecTyp[] ) : IteRecTyp[] => iteRecArr.sort( ( recOneObj, recTwoObj ) => recOneObj.labTexStr.localeCompare( recTwoObj.labTexStr ) ); // What: Item Sort Function. Why: A list in label order is easy to scan. How: This sorts the records by label.



// #region iteLisFun

/**
 * iteLisFun = Item List Function
 *
 * @summary
 * Resolves with an event's items, by label, each with its label decrypted
 * under the group key and its assignee, or null when it's open. A label
 * that won't decrypt comes back empty, so one bad item can't hide the rest.
 * The assignee may be someone since removed, whom the app shows as a
 * removed member.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 *
 * @returns A promise that resolves with the items.
 *
 * @example
 * ```ts
 * iteLisFun('Xk3...', 'Ev7...') // => [ { labTexStr : 'Dessert', ... } ]
 * ```
 *
*/

const iteLisFun = async ( groIdeStr : string, eveIdeStr : string ) : Promise< IteRecTyp[] > => { // What: Item List Function. Why: Members see who's bringing what. How: This reads the items and decrypts each label.


	const groKeyObj = await keyLoaFun( groIdeStr );                                                                                    // What: Group Key Object. Why: The labels open with the group key. How: This loads it.
	const iteSnaObj = await getDocs( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments` ) ); // What: Items Snapshot Object. Why: Every item is in the event's collection. How: This reads it.



	return iteSorFun( await Promise.all( iteSnaObj.docs.map( ( iteDocObj ) => iteRecFun( groKeyObj, iteDocObj ) ) ) ); // What: Items Return. Why: The list shows each item in label order. How: This reads every item into a record and returns them sorted.


};

// #endregion iteLisFun



// #region iteRenFun

/**
 * iteRenFun = Item Rename Function
 *
 * @summary
 * Relabels an item, leaving its claim as it was, even a removed member's. A
 * label outside its limits rejects with a RangeError, and an event that's
 * gone with an Error.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param iteIdeStr - Item Identifier String: The item's ID.
 * @param labTexStr - Label Text String: The new label, as typed.
 *
 * @returns A promise that settles once the label changes, with no value.
 *
 * @example
 * ```ts
 * iteRenFun('Xk3...', 'Ev7...', 'It2...', 'Pie') // => Promise<void>
 * ```
 *
*/

const iteRenFun = async ( groIdeStr : string, eveIdeStr : string, iteIdeStr : string, labTexStr : string ) : Promise< void > => { // What: Item Rename Function. Why: Any member relabels an item (Section 11.5). How: This encrypts the new label and writes it with the event's deletion time.


	const labFieObj = await labEncFun( groIdeStr, labTexStr ); // What: Label Fields Object. Why: The label is written checked and encrypted. How: This builds its fields.

	const iteRefObj = iteRefFun( groIdeStr, eveIdeStr, iteIdeStr ); // What: Item Reference Object. Why: The item changes. How: This names it.


	await runTransaction( firGetFun().fstDatObj, async ( traValObj ) => { // What: Rename Transaction. Why: The item's deletion time has to be the event's as the write lands. How: This reads the event's time and writes the label with it.


		const expTimObj = await expReaFun( traValObj, iteRefObj.parent.parent! ); // What: Expiry Time Object. Why: The item takes its event's deletion time. How: This reads it. // What: Non-Null Note. Why: An item's collection always sits under its event. How: The ! reads the event's reference as present.


		traValObj.update( iteRefObj, { ...labFieObj, expireAt : expTimObj } ); // What: Rename Update Call. Why: The label changes, and the claim stays as it was. How: This writes the label with the deletion time.


	} );


};

// #endregion iteRenFun


// #region iteWatFun

/**
 * iteWatFun = Item Watch Function
 *
 * @summary
 * Watches an event's bring-list, calling back with every item, by label, as
 * iteLisFun lists them, at first and after each change, such as a claim or
 * a new item. A change that lands while the last one is still decrypting
 * replaces it, so the callback never goes back to an older list. A key that
 * won't load or a refused watch calls the error callback, and the watch
 * stops. The returned function stops the watch.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groIdeStr - Group Identifier String: The group's ID.
 * @param eveIdeStr - Event Identifier String: The event's ID.
 * @param onIteFun  - On Items Function: Called with the items.
 * @param onErrFun  - On Error Function: Called when the watch fails, by
 *                    default nothing.
 *
 * @returns A function that stops the watch.
 *
 * @example
 * ```ts
 * iteWatFun('Xk3...', 'Ev7...', setIteArr) // => () => void
 * ```
 *
*/

const iteWatFun = ( groIdeStr : string, eveIdeStr : string, onIteFun : ( iteRecArr : IteRecTyp[] ) => void, onErrFun : ( errValObj : Error ) => void = () => {} ) : () => void => { // What: Item Watch Function. Why: A claim or a new item shows to everyone at once. How: This listens to the event's items and reports them decrypted.


	let runNum = 0;     // What: Run Number. Why: Only the newest change's list is reported. How: This counts the changes.
	let stoBoo = false; // What: Stopped Boolean. Why: The watch can stop while the key is still loading. How: This marks it stopped.

	let stoFun : () => void = () => {}; // What: Stop Function. Why: The listener starts once the key loads. How: This holds its stop, a no-op until then.



	keyLoaFun( groIdeStr ).then( ( groKeyObj ) => { // What: Key Load Call. Why: The labels open with the group key. How: This loads it, then listens.



		if ( stoBoo ) return;



		stoFun = onSnapshot( collection( firGetFun().fstDatObj, `groups/${ groIdeStr }/events/${ eveIdeStr }/assignments` ), async ( iteSnaObj ) => { // What: Items Watch Call. Why: Every change to the list reaches the watcher. How: This listens to the event's items.


			const curRunNum = ++runNum; // What: Current Run Number. Why: A later change may land while this one decrypts. How: This numbers this change.

			const iteRecArr = await Promise.all( iteSnaObj.docs.map( ( iteDocObj ) => iteRecFun( groKeyObj, iteDocObj ) ) ); // What: Item Record Array. Why: The callback takes readable items. How: This reads every item into a record.



			if ( stoBoo || curRunNum !== runNum ) return;



			onIteFun( iteSorFun( iteRecArr ) ); // What: Items Report Call. Why: The bring-list shows the change. How: This reports the records in label order.


		}, onErrFun );


	} ).catch( onErrFun ); // What: Key Error Catch. Why: A group key that won't load leaves nothing to show. How: This reports the failure.



	return () => { // What: Stop Return. Why: The bring-list stops listening when it closes. How: This marks the watch stopped and ends the listener.


		stoBoo = true; // What: Stopped Assignment. Why: A key still loading mustn't start a listener. How: This marks the watch stopped.

		stoFun(); // What: Listener Stop Call. Why: An open listener keeps reading. How: This ends it.


	};


};

// #endregion iteWatFun

// #endregion Helpers



// #region Exports

export { iteAddFun, iteAsgFun, iteClaFun, iteDelFun, iteLisFun, type IteRecTyp, iteRenFun, iteWatFun }; // What: Named Exports. Why: The bring-list drives every item change and its watch through these. How: This exports the functions and the item record's type.

// #endregion Exports


