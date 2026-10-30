


/**
 * member-color.ts = Member Color
 *
 * @summary
 * Names the color a member wears. Each member holds a slot from 0 to 49 for
 * as long as they stay in a group, and each slot reads one of the 50 member
 * color tokens in the global stylesheet.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



const sloColFun = ( colSloNum : number ) : string => `var( --mem-${ String( colSloNum + 1 ).padStart( 3, '0' ) }-col )`; // What: Slot Color Function. Why: A member's slot picks one of the 50 member color tokens. How: This names the token for a slot, slot 0 being --mem-001-col.



export { sloColFun }; // What: Named Export. Why: Avatars and claims across the app wear their member's color. How: This exports sloColFun.


