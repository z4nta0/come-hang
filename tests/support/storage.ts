


// #region Imports

import { deleteObject } from 'firebase/storage'; // What: Delete Object. Why: The reset deletes every file. How: This deletes one.
import { listAll      } from 'firebase/storage'; // What: List All. Why: The reset and the checks read a folder's contents. How: This lists its files and folders.
import { ref          } from 'firebase/storage'; // What: Ref. Why: Every listing names a folder. How: This builds a reference.


import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The helpers reach Storage past its rules through one. How: This types it.
import type { StorageReference     } from 'firebase/storage';             // What: Storage Reference. Why: The reset walks a bucket folder by folder. How: This types each folder.

// #endregion Imports



/**
 * storage.ts = Storage Helpers
 *
 * @summary
 * Clears and reads Cloud Storage in the emulator, past the rules, for the
 * specs that upload files. The test environment's own clearStorage lists
 * only the top level of the bucket it opens by default, gs://demo-come-hang,
 * without its folders, so a file in a folder lasted into the next test
 * (measured 2026-11-09), and the Cloud Functions' bucket was never cleared
 * at all. This file names the functions' bucket and clears a bucket folder by
 * folder.
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

const BUC_URL_STR = 'gs://demo-come-hang.appspot.com'; // What: Bucket URL String. Why: The Cloud Functions read and delete files in Storage's default bucket, which the emulator names after the project with .appspot.com. How: This names the same bucket for the specs' seeds and checks.

// #endregion Constants



// #region Helpers

// #region stoCleFun

/**
 * stoCleFun = Storage Clear Function
 *
 * @summary
 * Deletes every file in a bucket, inside folders too, with the rules turned
 * off, so each test starts from an empty bucket.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The test environment that
 *                    reaches the emulator.
 * @param bucUrlStr - Bucket URL String: The bucket to clear, the
 *                    environment's own by default.
 *
 * @returns A promise that settles once the bucket is empty, with no value.
 *
 * @example
 * ```ts
 * stoCleFun(funEnvObj, BUC_URL_STR) // => Promise<void>
 * ```
 *
*/

const stoCleFun = ( envTesObj : RulesTestEnvironment, bucUrlStr? : string ) : Promise< void > => envTesObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { // What: Storage Clear Function. Why: Each test starts from an empty bucket. How: This deletes every file from the root down, with the rules off.


	const delFolFun = async ( folRefObj : StorageReference ) : Promise< void > => { // What: Delete Folder Function. Why: Files sit in nested folders. How: This lists a folder, deleting its files and walking each folder inside it.


		const { items : filRefArr, prefixes : folRefArr } = await listAll( folRefObj ); // What: File Reference Array. Why: The folder's own files are deleted. How: This reads them from the listing. // What: Folder Reference Array. Why: Each folder inside is walked in turn. How: This reads them from the listing.


		await Promise.all( [ ...filRefArr.map( ( filRefObj ) => deleteObject( filRefObj ) ), ...folRefArr.map( delFolFun ) ] ); // What: Delete Call. Why: The folder empties at once. How: This deletes its files and walks its folders together, settling once all finish.


	};


	await delFolFun( ref( cotAdmObj.storage( bucUrlStr ) ) ); // What: Root Delete Call. Why: The walk starts from the bucket's root. How: This deletes everything under it.


} );

// #endregion stoCleFun



// #region stoLisFun

/**
 * stoLisFun = Storage List Function
 *
 * @summary
 * Resolves with the names of the files directly in one folder of the
 * functions' bucket, sorted, read with the rules turned off.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param envTesObj - Environment Test Object: The test environment that
 *                    reaches the emulator.
 * @param folPatStr - Folder Path String: The folder to list.
 *
 * @returns A promise that resolves with the file names.
 *
 * @example
 * ```ts
 * stoLisFun(funEnvObj, 'avatars/gro1') // => [ 'alice', 'bob' ]
 * ```
 *
*/

const stoLisFun = async ( envTesObj : RulesTestEnvironment, folPatStr : string ) : Promise< string[] > => { // What: Storage List Function. Why: The checks compare which files a function left. How: This lists the folder past the rules and returns its file names.


	let namValArr : string[] = []; // What: Name Value Array. Why: The listing happens inside the rules-off callback. How: This carries its result out.


	await envTesObj.withSecurityRulesDisabled( async ( cotAdmObj ) => { namValArr = ( await listAll( ref( cotAdmObj.storage( BUC_URL_STR ), folPatStr ) ) ).items.map( ( filRefObj ) => filRefObj.name ).sort(); } ); // What: Listing Call. Why: The rules hide what's being checked. How: This lists the folder with them off, keeping each file's name in order.



	return namValArr; // What: Names Return. Why: The test compares them. How: This returns them.


};

// #endregion stoLisFun

// #endregion Helpers



// #region Exports

export { BUC_URL_STR, stoCleFun, stoLisFun }; // What: Named Exports. Why: The specs that upload files clear and read Storage through these. How: This exports the functions' bucket, the clear, and the listing.

// #endregion Exports


