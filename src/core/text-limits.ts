


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
const JOI_NOT_REG = /^[\p{L}\p{M}\p{N}.,'’\-&!?():#/+]+( [\p{L}\p{M}\p{N}.,'’\-&!?():#/+]+)*$/u; // What: Join Note Regular Expression. Why: A join note is letters and numbers in any script with basic punctuation, and no emoji (Section 11.10). How: This is the rules' notJoiFun pattern, runs of its character class joined by single spaces.
const PER_NAM_REG = /^[\p{L}\p{M}'’\-.]+( [\p{L}\p{M}'’\-.]+)*$/u;                               // What: Person Name Regular Expression. Why: A person's name is letters with their accents and a few joining marks, so an approver can recognize it (Section 11.10). How: This is the rules' namPerFun pattern, runs of its character class joined by single spaces.

// #endregion Constants



// #region Helpers

const texNorFun = ( texValStr : string ) : string => texValStr.normalize( 'NFC' ).trim().replace( /\s+/g, ' ' ); // What: Text Normalize Function. Why: What a person types should usually pass the limits as they meant it (Section 11.10). How: This normalizes to NFC, trims the ends, and collapses each run of whitespace to one space.



const groNamFun = ( namValStr : string ) : boolean => namValStr.length <= 50 && GRO_NAM_REG.test( namValStr ); // What: Group Name Function. Why: A group name is plaintext the rules check, so it's checked here first. How: This is true for 1 to 50 characters matching the group name pattern, which can't match an empty name.



const joiNotFun = ( notValStr : string ) : boolean => notValStr.length <= 150 && ( notValStr === '' || JOI_NOT_REG.test( notValStr ) ); // What: Join Note Function. Why: A join note is plaintext the rules check, so it's checked here first. How: This is true for an empty note, or up to 150 characters matching the join note pattern.



const perNamFun = ( namValStr : string ) : boolean => namValStr.length <= 40 && PER_NAM_REG.test( namValStr ); // What: Person Name Function. Why: A display name is encrypted, so the rules can't check it and the app must. How: This is true for 1 to 40 characters matching the person name pattern, which can't match an empty name.

// #endregion Helpers



// #region Exports

export { groNamFun, joiNotFun, perNamFun, texNorFun }; // What: Named Exports. Why: Every form that saves typed text tidies and checks it this way. How: This exports the helpers.

// #endregion Exports


