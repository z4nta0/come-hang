


// #region Imports

import { avaGetFun } from '../state/avatars.ts';    // What: Avatar Get Function. Why: A member's photo is read from the device or fetched. How: This returns its bytes.
import { imaTypFun } from '../platform/image.ts';   // What: Image Type Function. Why: The photo's address needs its type. How: This reads it from the bytes.
import { useEffect } from 'react';                  // What: Use Effect. Why: The photo loads after the avatar draws, and its address is freed after. How: This runs the load and the cleanup.
import { useState  } from 'react';                  // What: Use State. Why: The avatar switches to the photo once it's in. How: This holds its address.

// #endregion Imports



/**
 * member-avatar.tsx = Member Avatar Contents
 *
 * @summary
 * What fills a member's avatar circle (ARCHITECTURE.md Section 21): their
 * profile photo once it's read from the device or fetched, and their
 * initials until then, or for good when they have no photo. The circle
 * itself, its size and the member's color, belongs to the screen that draws
 * it, so the photo, drawn a little smaller, leaves the color showing as a
 * ring.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type AccProTyp = { avaIdeStr : string, avaIvaArr : Uint8Array< ArrayBuffer > | null, className : string, groIdeStr : string, iniTexStr : string, uidValStr : string }; // What: Avatar Contents Component Props Type. Why: The contents need the member's photo fields, their initials, and the class that sizes the photo. How: This types AvaConCom's props.

// #region AvaConCom

/**
 * AvaConCom = Avatar Contents Component
 *
 * @summary
 * Renders a member's initials, then their photo once it loads, as an image
 * screen readers skip, since the circle sits beside the member's name. A
 * new photo ID loads afresh, a photo that can't be read keeps the initials,
 * and each photo's address is freed when it's replaced or the avatar goes.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.avaIdeStr - Avatar Identifier String: The photo's ID, empty
 *                          when there's none.
 * @param props.avaIvaArr - Avatar IV Array: The photo's IV, or null.
 * @param props.className - Class Name: The class that sizes the photo inside
 *                          its circle.
 * @param props.groIdeStr - Group Identifier String: The member's group.
 * @param props.iniTexStr - Initials Text String: The member's initials.
 * @param props.uidValStr - UID Value String: The member's UID.
 *
 * @returns The photo, or the initials.
 *
 * @example
 * ```tsx
 * AvaConCom({ avaIdeStr, avaIvaArr, className, ... }) // => <AvaConCom />
 * ```
 *
*/

function AvaConCom ( { avaIdeStr, avaIvaArr, className, groIdeStr, iniTexStr, uidValStr } : AccProTyp ) : React.JSX.Element {


	const [ urlRecObj, setUrlRecObj ] = useState< { ideStr : string, urlStr : string } | null >( null ); // What: URL Record Object And Setter. Why: The avatar shows the photo once its address is made. How: This holds the address with the ID it's for.



	useEffect( () => { // What: Photo Load Effect. Why: The photo arrives after the avatar draws. How: This reads it, makes its address, and frees the address on cleanup.


		if ( avaIdeStr === '' ) return; // What: No Photo Guard. Why: A member with no photo keeps their initials. How: This returns.



		let actValBoo = true; // What: Active Value Boolean. Why: A photo arriving after the avatar changed mustn't show. How: This is true until the cleanup runs.
		let urlValStr = '';   // What: URL Value String. Why: The address has to be freed on cleanup. How: This holds it, empty until made.


		void avaGetFun( groIdeStr, uidValStr, avaIdeStr, avaIvaArr ).then( ( bytValArr ) => { // What: Load Call. Why: The photo comes from the device or Storage. How: This makes an address for it while the avatar is still the same.


			if ( !actValBoo || bytValArr === null ) return; // What: Stale Guard. Why: A photo for a changed avatar, or none at all, shows nothing. How: This returns.



			urlValStr = URL.createObjectURL( new Blob( [ bytValArr ], { type : imaTypFun( bytValArr ) } ) ); // What: Address Assignment. Why: An image element reads the photo by address. How: This makes one, typed from the bytes.

			setUrlRecObj( { ideStr : avaIdeStr, urlStr : urlValStr } ); // What: Show Call. Why: The avatar switches to the photo. How: This keeps the address with its ID.


		} );



		return () => { // What: Cleanup Return. Why: A replaced or removed avatar shouldn't keep its photo in memory. How: This marks the load stale and frees any address it made.


			actValBoo = false; // What: Inactive Set. Why: A late photo mustn't show. How: This marks the load stale.

			if ( urlValStr !== '' ) URL.revokeObjectURL( urlValStr ); // What: Address Free Call. Why: An address holds the photo in memory until it's freed. How: This frees one that was made.


		};


	}, [ avaIdeStr, avaIvaArr, groIdeStr, uidValStr ] ); // What: Effect Dependency Array. Why: Another photo, or another member, loads afresh. How: avaIdeStr and avaIvaArr change with the photo, and groIdeStr and uidValStr with the member.



	const shoUrlStr = urlRecObj !== null && urlRecObj.ideStr === avaIdeStr ? urlRecObj.urlStr : ''; // What: Shown URL String. Why: Only the current photo's address shows. How: This reads it, empty while the photo isn't in.


	if ( shoUrlStr === '' ) return <>{ iniTexStr }</>; // What: Initials Guard. Why: The initials show until the photo is in. How: This returns them.



	return (


		<img
			className={ className }

			src={ shoUrlStr }

			alt=''
		/>


	);


}

// #endregion AvaConCom

// #endregion Components



// #region Exports

export { AvaConCom }; // What: Named Export. Why: Each screen's avatar circle shows its member's photo or initials. How: This exports AvaConCom.

// #endregion Exports


