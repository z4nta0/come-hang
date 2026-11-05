


// #region Imports

import type * as IdeModTyp from '../../functions/src/identity-cleanup.ts'; // What: Identity Module Type. Why: The schedule is loaded at run time from its build, typed by its source. How: This types the module.

// #endregion Imports



/**
 * cleanup-child.ts = Cleanup Child
 *
 * @summary
 * Runs the daily cleanup of unused identities once, in a Node process of its
 * own, for the functions suite, whose Playwright loader can't link the
 * Admin SDK's Auth module. The emulator can't fire a v2 schedule, so this
 * calls the schedule's handler through its run method, then exits once the
 * run is done. The emulators' addresses come from the parent's environment.
 *
 * Sections:
 *  - Constants
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const CLE_LIB_STR = '../../functions/lib/identity-cleanup.js'; // What: Cleanup Library String. Why: The functions run from their build, which npm run test:functions makes first. How: This is its path, from this file.

// #endregion Constants



// #region Module Init

const CLE_MOD_OBJ = await import( CLE_LIB_STR ) as typeof IdeModTyp; // What: Cleanup Module Object. Why: The schedule runs here. How: This loads its build. // What: Type Assertion Note. Why: The build has no types of its own. How: The as reads it as the source module's shape.


await CLE_MOD_OBJ.ideCleFun.run( { jobName : 'test', scheduleTime : new Date().toISOString() } ); // What: Cleanup Run Call. Why: The test checks what one day's cleanup leaves. How: This calls the schedule's handler, which settles once the run is done.

process.exit( 0 ); // What: Exit Call. Why: The Admin SDK keeps connections open. How: This ends the process once the run is done.

// #endregion Module Init


