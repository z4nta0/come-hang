


/**
 * zip.ts = ZIP Archive Helpers
 *
 * @summary
 * Packs files into one ZIP archive in the browser, with no library, so many
 * files download as one. The files are stored rather than compressed, since
 * photos are already compressed and gain nothing from it, which keeps the
 * writer to headers, a checksum, and the bytes themselves. Names are marked
 * as UTF-8, and every file carries the time it's packed.
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

/**
 * CRC_TAB_ARR = CRC Table Array
 *
 * @summary
 * The lookup table for the CRC-32 checksum every file in a ZIP archive
 * carries, one entry for each possible byte, built once from the checksum's
 * reversed polynomial, 0xEDB88320, so each byte of a file costs one lookup.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const CRC_TAB_ARR = Uint32Array.from( Array( 256 ).keys(), ( entIndNum ) => { // What: CRC Table Array. Why: The checksum reads one table entry per byte. How: This builds each entry by running its byte through the polynomial eight times.


	let entValNum = entIndNum; // What: Entry Value Number. Why: Each entry starts from its own byte. How: This holds the value as it's worked.



	for ( let bitIndNum = 0; bitIndNum < 8; bitIndNum++ ) entValNum = entValNum & 1 ? 0xEDB88320 ^ ( entValNum >>> 1 ) : entValNum >>> 1; // What: Bit Loop. Why: Each of the byte's eight bits folds in the polynomial when it's set. How: This shifts the value, mixing in the polynomial for a set low bit.



	return entValNum >>> 0; // What: Entry Return. Why: The table holds unsigned values. How: This returns the entry as one.


} );

// #endregion Constants



// #region Helpers

const crcValFun = ( bytValArr : Uint8Array ) : number => { // What: CRC Value Function. Why: A ZIP archive checks each file against its CRC-32. How: This runs the file's bytes through the table.


	let crcValNum = 0xFFFFFFFF; // What: CRC Value Number. Why: CRC-32 starts with every bit set. How: This holds the running checksum.



	for ( const bytValNum of bytValArr ) crcValNum = CRC_TAB_ARR[ bytValNum ^ ( crcValNum & 0xFF ) ] ^ ( crcValNum >>> 8 ); // What: Byte Loop. Why: Every byte changes the checksum. How: This folds each in through its table entry.



	return ( crcValNum ^ 0xFFFFFFFF ) >>> 0; // What: CRC Return. Why: CRC-32 ends by flipping every bit. How: This returns the flipped value, unsigned.


};



type ZipFilTyp = { bytArr : Uint8Array< ArrayBuffer >, namStr : string }; // What: ZIP File Type. Why: A file goes into the archive as its name and its bytes. How: This pairs them.

// #region zipBuiFun

/**
 * zipBuiFun = ZIP Build Function
 *
 * @summary
 * Packs the files into one ZIP archive, in the order given, each stored as
 * it is under its name, dated with the given time. Each file is written as
 * its header followed by its bytes, then a directory listing every file
 * closes the archive, which is how a ZIP reader finds them. The archive
 * holds at most 65,535 files of under 4 GB in all, the limits of the plain
 * format, which the caller keeps to.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param filValArr - File Value Array: The files, each its name and bytes.
 * @param datValObj - Date Value Object: The time every file is dated with.
 *
 * @returns The archive, typed as a ZIP file.
 *
 * @example
 * ```ts
 * zipBuiFun([{ bytArr, namStr : 'photo-1.webp' }], new Date()) // => Blob
 * ```
 *
*/

const zipBuiFun = ( filValArr : ZipFilTyp[], datValObj : Date ) : Blob => { // What: ZIP Build Function. Why: Many files should download as one. How: This writes each file's header and bytes, then the directory and its end.


	const dosDatNum = ( ( datValObj.getFullYear() - 1980 ) << 9 ) | ( ( datValObj.getMonth() + 1 ) << 5 ) | datValObj.getDate();          // What: DOS Date Number. Why: A ZIP archive dates its files the old DOS way. How: This packs the year since 1980, the month, and the day.
	const dosTimNum = ( datValObj.getHours() << 11 ) | ( datValObj.getMinutes() << 5 ) | ( datValObj.getSeconds() >> 1 );                // What: DOS Time Number. Why: A ZIP archive times its files the old DOS way. How: This packs the hour, the minute, and the second halved.
	const namEncObj = new TextEncoder();                                                                                                 // What: Name Encoder Object. Why: File names are written as UTF-8. How: This encodes them.
	const parValArr : Uint8Array< ArrayBuffer >[] = [];                                                                                   // What: Part Value Array. Why: The archive is built from headers and bytes in order. How: This collects each part.
	const cenValArr : Uint8Array< ArrayBuffer >[] = [];                                                                                   // What: Central Value Array. Why: The directory at the end lists every file. How: This collects its entries.

	let offValNum = 0; // What: Offset Value Number. Why: The directory names where each file's header starts. How: This counts the bytes written so far.



	for ( const filValObj of filValArr ) { // What: File Loop. Why: Every file goes into the archive. How: This writes its header and bytes, and its directory entry.


		const namBytArr = namEncObj.encode( filValObj.namStr ); // What: Name Bytes Array. Why: The headers carry the name as bytes. How: This encodes it.
		const crcValNum = crcValFun( filValObj.bytArr );        // What: CRC Value Number. Why: A reader checks the file against it. How: This works it out.
		const locHeaArr = new Uint8Array( 30 + namBytArr.length ); // What: Local Header Array. Why: Each file's bytes follow a header describing them. How: This makes room for the fixed fields and the name.
		const cenHeaArr = new Uint8Array( 46 + namBytArr.length ); // What: Central Header Array. Why: The directory describes each file again, with where it starts. How: This makes room for the fixed fields and the name.

		const locVieObj = new DataView( locHeaArr.buffer ); // What: Local View Object. Why: The header's fields are little-endian numbers. How: This writes them.
		const cenVieObj = new DataView( cenHeaArr.buffer ); // What: Central View Object. Why: The entry's fields are little-endian numbers. How: This writes them.


		locVieObj.setUint32( 0, 0x04034B50, true );                 // What: Local Signature Call. Why: A reader finds a file's header by it. How: This writes the local header's signature.
		locVieObj.setUint16( 4, 20, true );                         // What: Local Version Call. Why: A reader needs version 2.0 to read a stored file. How: This writes it.
		locVieObj.setUint16( 6, 0x0800, true );                     // What: Local Flags Call. Why: The name may hold more than plain ASCII. How: This marks it as UTF-8.
		locVieObj.setUint16( 8, 0, true );                          // What: Local Method Call. Why: The file is stored, not compressed. How: This writes method 0.
		locVieObj.setUint16( 10, dosTimNum, true );                 // What: Local Time Call. Why: The file is timed as it's packed. How: This writes the DOS time.
		locVieObj.setUint16( 12, dosDatNum, true );                 // What: Local Date Call. Why: The file is dated as it's packed. How: This writes the DOS date.
		locVieObj.setUint32( 14, crcValNum, true );                 // What: Local CRC Call. Why: A reader checks the file. How: This writes its checksum.
		locVieObj.setUint32( 18, filValObj.bytArr.length, true );   // What: Local Compressed Size Call. Why: A stored file's size is unchanged. How: This writes its length.
		locVieObj.setUint32( 22, filValObj.bytArr.length, true );   // What: Local Size Call. Why: A reader knows how much to read. How: This writes its length.
		locVieObj.setUint16( 26, namBytArr.length, true );          // What: Local Name Length Call. Why: The name follows the fixed fields. How: This writes its length.
		locHeaArr.set( namBytArr, 30 );                             // What: Local Name Call. Why: The file is named in its header. How: This copies the name after the fixed fields.


		cenVieObj.setUint32( 0, 0x02014B50, true );                 // What: Central Signature Call. Why: A reader finds a directory entry by it. How: This writes the entry's signature.
		cenVieObj.setUint16( 4, 20, true );                         // What: Central Made By Call. Why: The entry says which version wrote it. How: This writes version 2.0.
		cenVieObj.setUint16( 6, 20, true );                         // What: Central Version Call. Why: A reader needs version 2.0 to read a stored file. How: This writes it.
		cenVieObj.setUint16( 8, 0x0800, true );                     // What: Central Flags Call. Why: The name may hold more than plain ASCII. How: This marks it as UTF-8.
		cenVieObj.setUint16( 10, 0, true );                         // What: Central Method Call. Why: The file is stored, not compressed. How: This writes method 0.
		cenVieObj.setUint16( 12, dosTimNum, true );                 // What: Central Time Call. Why: The entry repeats the file's time. How: This writes the DOS time.
		cenVieObj.setUint16( 14, dosDatNum, true );                 // What: Central Date Call. Why: The entry repeats the file's date. How: This writes the DOS date.
		cenVieObj.setUint32( 16, crcValNum, true );                 // What: Central CRC Call. Why: The entry repeats the checksum. How: This writes it.
		cenVieObj.setUint32( 20, filValObj.bytArr.length, true );   // What: Central Compressed Size Call. Why: A stored file's size is unchanged. How: This writes its length.
		cenVieObj.setUint32( 24, filValObj.bytArr.length, true );   // What: Central Size Call. Why: The entry repeats the size. How: This writes its length.
		cenVieObj.setUint16( 28, namBytArr.length, true );          // What: Central Name Length Call. Why: The name follows the fixed fields. How: This writes its length.
		cenVieObj.setUint32( 42, offValNum, true );                 // What: Central Offset Call. Why: A reader jumps from the directory to the file. How: This writes where its header starts.
		cenHeaArr.set( namBytArr, 46 );                             // What: Central Name Call. Why: The entry names its file. How: This copies the name after the fixed fields.


		parValArr.push( locHeaArr, filValObj.bytArr ); // What: Part Push Call. Why: The file's header comes before its bytes. How: This adds both in order.

		cenValArr.push( cenHeaArr ); // What: Central Push Call. Why: The directory lists the file. How: This adds its entry.


		offValNum += locHeaArr.length + filValObj.bytArr.length; // What: Offset Advance Assignment. Why: The next file starts after this one. How: This adds the header's and the bytes' lengths.


	}



	const cenSizNum = cenValArr.reduce( ( sumValNum, cenHeaArr ) => sumValNum + cenHeaArr.length, 0 ); // What: Central Size Number. Why: The end record gives the directory's size. How: This adds up its entries.
	const endRecArr = new Uint8Array( 22 );                                                         // What: End Record Array. Why: A reader starts from the record at the very end. How: This makes room for its fixed fields.
	const endVieObj = new DataView( endRecArr.buffer );                                             // What: End View Object. Why: The record's fields are little-endian numbers. How: This writes them.


	endVieObj.setUint32( 0, 0x06054B50, true );          // What: End Signature Call. Why: A reader finds the record by it. How: This writes the end record's signature.
	endVieObj.setUint16( 8, filValArr.length, true );    // What: End Disk Count Call. Why: The archive is on one disk. How: This writes how many files it holds there.
	endVieObj.setUint16( 10, filValArr.length, true );   // What: End Total Count Call. Why: A reader knows how many entries to read. How: This writes how many files there are.
	endVieObj.setUint32( 12, cenSizNum, true );          // What: End Size Call. Why: A reader knows how long the directory is. How: This writes its size.
	endVieObj.setUint32( 16, offValNum, true );          // What: End Offset Call. Why: A reader jumps to the directory. How: This writes where it starts, after every file.



	return new Blob( [ ...parValArr, ...cenValArr, endRecArr ], { type : 'application/zip' } ); // What: Archive Return. Why: The caller downloads the archive as one file. How: This joins the files, the directory, and the end record.


};

// #endregion zipBuiFun

// #endregion Helpers



// #region Exports

export { zipBuiFun }; // What: Named Export. Why: Saving many photos packs them into one archive. How: This exports zipBuiFun.

// #endregion Exports


