


/**
 * text-limits.ts = Text Limits
 *
 * @summary
 * The app's side of the text limits (ARCHITECTURE.md Section 11.10). Text
 * a person types is tidied before it's saved: Unicode NFC, no space at
 * either end, and single spaces between words, so what they meant usually
 * passes. Each field's check then mirrors the security rules' own pattern
 * and length, so a plaintext field fails here before the rules would refuse
 * it, and an encrypted one, which the rules can't read, is held to the same
 * limits. Lengths count UTF-16 units, as both JavaScript and the rules do.
 * The rules' Unicode classes follow Unicode 6.0 while JavaScript's are
 * current, so a letter or symbol added to Unicode since can pass here and
 * still be refused by the rules, which is why emoji are listed by code point
 * in both.
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

const GRO_NAM_REG = /^[\p{L}\p{M}\p{N}\p{So}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}\u{200D}\u{E0020}-\u{E007F}.,'’\-&!?():#/+]+( [\p{L}\p{M}\p{N}\p{So}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}\u{200D}\u{E0020}-\u{E007F}.,'’\-&!?():#/+]+)*$/u; // What: Group Name Regular Expression. Why: A group name allows letters, numbers, basic punctuation, and emoji, with single spaces (Section 11.10). How: This is the rules' namGroFun pattern, runs of its character class joined by single spaces, with the emoji blocks listed by code point as the rules list them.
const EVE_DES_REG = new RegExp( `^${ GRO_NAM_REG.source.slice( 1, -1 ) }(\n\n?${ GRO_NAM_REG.source.slice( 1, -1 ) })*$`, 'u' ); // What: Event Description Regular Expression. Why: A description allows the title's set plus line breaks, with at most one blank line between paragraphs (Section 11.10). How: This joins lines of the group name pattern with one or two line breaks.
const JOI_NOT_REG = /^[\p{L}\p{M}\p{N}.,'’\-&!?():#/+]+( [\p{L}\p{M}\p{N}.,'’\-&!?():#/+]+)*$/u;                                 // What: Join Note Regular Expression. Why: A join note is letters and numbers in any script with basic punctuation, and no emoji (Section 11.10). How: This is the rules' notJoiFun pattern, runs of its character class joined by single spaces.
const PER_NAM_REG = /^[\p{L}\p{M}'’\-.]+( [\p{L}\p{M}'’\-.]+)*$/u;                                                               // What: Person Name Regular Expression. Why: A person's name is letters with their accents and a few joining marks, so an approver can recognize it (Section 11.10). How: This is the rules' namPerFun pattern, runs of its character class joined by single spaces.

// #endregion Constants



// #region Helpers

const texNorFun = ( texValStr : string ) : string => texValStr.normalize( 'NFC' ).trim().replace( /\s+/g, ' ' ); // What: Text Normalize Function. Why: What a person types should usually pass the limits as they meant it (Section 11.10). How: This normalizes to NFC, trims the ends, and collapses each run of whitespace to one space.



const desNorFun = ( desValStr : string ) : string => desValStr.normalize( 'NFC' ).split( /\r\n|\r|\n/ ).map( ( linValStr ) => linValStr.trim().replace( /\s+/g, ' ' ) ).join( '\n' ).replace( /\n{3,}/g, '\n\n' ).trim(); // What: Description Normalize Function. Why: A description keeps its line breaks, while each line is tidied like any other text (Section 11.10). How: This normalizes to NFC, trims and single-spaces each line, keeps at most one blank line between paragraphs, and trims the ends.



const eveDesFun = ( desValStr : string ) : boolean => desValStr.length <= 500 && ( desValStr === '' || EVE_DES_REG.test( desValStr ) ); // What: Event Description Function. Why: An event is encrypted, so the rules can't check its description and the app must. How: This is true for an empty description, or up to 500 characters of the description pattern.



const eveLocFun = ( locValStr : string ) : boolean => locValStr.length <= 150 && ( locValStr === '' || GRO_NAM_REG.test( locValStr ) ); // What: Event Location Function. Why: An event is encrypted, so the rules can't check its location text and the app must. How: This is true for an empty location, or up to 150 characters of the group name pattern, the title's set.



const eveTitFun = ( titValStr : string ) : boolean => titValStr.length <= 50 && GRO_NAM_REG.test( titValStr ); // What: Event Title Function. Why: An event is encrypted, so the rules can't check its title and the app must. How: This is true for 1 to 50 characters of the group name pattern, the title's set, which can't match an empty title.



const groNamFun = ( namValStr : string ) : boolean => namValStr.length <= 50 && GRO_NAM_REG.test( namValStr ); // What: Group Name Function. Why: A group name is plaintext the rules check, so it's checked here first. How: This is true for 1 to 50 characters matching the group name pattern, which can't match an empty name.



const iteLabFun = ( labValStr : string ) : boolean => labValStr.length <= 50 && GRO_NAM_REG.test( labValStr ); // What: Item Label Function. Why: An item is encrypted, so the rules can't check its label and the app must. How: This is true for 1 to 50 characters of the group name pattern, the title's set, which can't match an empty label.



const joiNotFun = ( notValStr : string ) : boolean => notValStr.length <= 150 && ( notValStr === '' || JOI_NOT_REG.test( notValStr ) ); // What: Join Note Function. Why: A join note is plaintext the rules check, so it's checked here first. How: This is true for an empty note, or up to 150 characters matching the join note pattern.



const perNamFun = ( namValStr : string ) : boolean => namValStr.length <= 40 && PER_NAM_REG.test( namValStr ); // What: Person Name Function. Why: A display name is encrypted, so the rules can't check it and the app must. How: This is true for 1 to 40 characters matching the person name pattern, which can't match an empty name.

// #endregion Helpers



// #region Exports

export { desNorFun, eveDesFun, eveLocFun, eveTitFun, groNamFun, iteLabFun, joiNotFun, perNamFun, texNorFun }; // What: Named Exports. Why: Every form that saves typed text tidies and checks it this way. How: This exports the helpers.

// #endregion Exports


