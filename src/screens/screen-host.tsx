


// #region Imports

import cssModObj from './screen-host.module.css'; // What: CSS Module Object. Why: The host's status is styled in its own module, whose class names Vite hashes. How: Its element reads its class from this object.


import { actTakFun       } from '../state/identity.ts';        // What: Active Take Function. Why: A device that stepped back can take the identity back. How: This publishes its key again.
import { actWatFun       } from '../state/identity.ts';        // What: Active Watch Function. Why: A device the identity moved away from steps back. How: This watches the published key.
import { chaOutFun       } from '../state/chat.ts';            // What: Chat Outbox Function. Why: Messages written offline go once the device is back. How: This sends a group's outbox.
import { CreGroCom       } from './create-group.tsx';          // What: Create Group Component. Why: Starting a group has its own screen. How: The host shows it when the entry asks for it.
import { GroFraCom       } from './group-frame.tsx';           // What: Group Frame Component. Why: Someone in a group sees it framed with the rest. How: The host shows it for the open group.
import { groWatFun       } from '../state/groups.ts';          // What: Group Watch Function. Why: Which screen shows depends on the groups someone is in. How: This watches them.
import { ideEnsFun       } from '../state/identity.ts';        // What: Identity Ensure Function. Why: What's waiting on the member is judged by their UID. How: This reads it.
import { ideHasFun       } from '../state/deletion.ts';        // What: Identity Has Function. Why: A phone with no identity sees the landing page, and one in no group the welcome. How: This checks without connecting.
import { InsIosCom       } from './install-ios.tsx';           // What: Install iOS Component. Why: An iPhone or iPad in Safari installs before anything else. How: The host shows it until the app is installed or someone carries on in Safari.
import { isaInsFun       } from '../platform/install.ts';      // What: Is-An Installed Function. Why: An installed app needs no install steps. How: This checks whether the app runs installed.
import { isaIosFun       } from '../platform/install.ts';      // What: Is-An iOS Function. Why: Only iOS keeps an installed app's storage apart from Safari's. How: This checks for an iPhone or iPad.
import { JoiGroCom       } from './join-group.tsx';            // What: Join Group Component. Why: An invite link has its own screen. How: The host shows it when the entry asks for it.
import { LanPagCom       } from './landing/page.tsx';          // What: Landing Page Component. Why: A phone with no identity meets Come Hang through its landing page. How: The host shows it when there's no identity.
import { LoaScrCom       } from './loading.tsx';               // What: Loading Screen Component. Why: Someone waiting on the groups should see the app is working. How: The host shows it while they load.
import { MovDevCom       } from './moved.tsx';                 // What: Moved Device Component. Why: A device the identity moved away from shows why, and what it can still do. How: The host shows it while another device is active.
import { NotSheCom       } from './notices.tsx';               // What: Notice Sheet Component. Why: What happened while someone was away shows over whatever screen is up. How: The host shows it once the groups have loaded.
import { offLisFun       } from '../state/waiting.ts';         // What: Offer List Function. Why: An offer of a group waits on the member it names. How: This lists the live ones.
import { outTakFun       } from '../state/google-redirect.ts'; // What: Outcome Take Function. Why: A recovery that left for Google's page finishes as the app reopens. How: This hands the host a finished recovery once.
import { PasInvCom       } from './paste-invite.tsx';          // What: Paste Invite Component. Why: Joining with an invite link has its own screen. How: The host shows it when the entry asks for it.
import { plaPruFun       } from '../platform/place-store.ts';  // What: Place Prune Function. Why: A group's event places shouldn't stay on a device that's no longer in it. How: This removes the places of every group not listed.
import { proSynFun       } from '../state/avatars.ts';         // What: Profile Sync Function. Why: A group joined after the photo was set should hold it too. How: This copies the photo where it's missing.
import { pusRefFun       } from '../state/push.ts';            // What: Push Refresh Function. Why: The active device's token is refreshed as the app opens. How: This rewrites it when it's gone, changed, or a day old.
import { pusRelFun       } from '../state/push.ts';            // What: Push Release Function. Why: Pushes should follow the identity to the device it moved to. How: This deletes the stored token while it's this device's own.
import { safConFun       } from '../platform/install.ts';      // What: Safari Continue Function. Why: Someone who chose to carry on in Safari isn't stopped again. How: This reads the kept choice.
import { scrReaFun       } from '../ui/scroll-top.ts';         // What: Screen Ready Function. Why: A reload's scroll position can only be restored once the real screen has rendered. How: The host calls it once the groups have loaded.
import { shaEndFun       } from '../state/sharing.ts';         // What: Sharing End Function. Why: Sharing stops with a group that's gone. How: This ends it.
import { shaGetFun       } from '../state/sharing.ts';         // What: Sharing Get Function. Why: A current record is checked against the groups. How: This reads it.
import { shaResFun       } from '../state/sharing.ts';         // What: Sharing Resume Function. Why: Sharing kept from before a reload resumes as the app opens. How: This resumes it.
import { useCallback     } from 'react';                       // What: Use Callback. Why: The join screen's effects depend on what the host hands it, which shouldn't change on every render. How: This keeps the same functions between renders.
import { useEffect       } from 'react';                       // What: Use Effect. Why: The groups are watched while the host is shown, a group that's gone is forgotten once the watch drops it, and sharing and the kept places are checked against the groups. How: This starts and stops the watch, clears the group, and checks sharing and the places.
import { useLayoutEffect } from 'react';                       // What: Use Layout Effect. Why: The scroll hook should hear the screen is ready before the browser draws it. How: This runs right after the real screen commits.
import { useOnlBooFun    } from '../ui/online.ts';             // What: Use Online Boolean Function. Why: The outbox sends once the device is online. How: This follows the connection.
import { useRef          } from 'react';                       // What: Use Reference. Why: Carrying on in Safari owes focus to the screen that follows. How: This holds whether it's owed.
import { useScrOpeFun    } from '../ui/screen.ts';             // What: Use Screen Open Function. Why: A created group opens, and so does the next group after one is left or deleted. How: This returns the function that opens a screen.
import { useScrStaFun    } from '../ui/screen.ts';             // What: Use Screen State Function. Why: The history entry says which screen to show. How: This reads it.
import { useState        } from 'react';                       // What: Use State. Why: The groups, the watch's restarts, a group that's gone, and the message about it change what shows. How: This holds each.
import { waiWatFun       } from '../state/waiting.ts';         // What: Waiting Watch Function. Why: Requests waiting on the member mark the frame and open the notices sheet. How: This watches them across the groups.


import type { GroRecTyp } from '../state/groups.ts';  // What: Group Record Type. Why: The host reads the groups the watch reports. How: This types them.
import type { WaiRecTyp } from '../state/waiting.ts'; // What: Waiting Record Type. Why: The host hands the waiting items on. How: This types them.

// #endregion Imports



/**
 * screen-host.tsx = Screen Host
 *
 * @summary
 * Chooses the screen the app shows at its one address, from the history entry
 * and the groups this identity is in. While the groups load it shows the
 * waiting screen, and once they have, it tells the scroll hook the screen is
 * ready, so a reload can return to where it was. The screen for starting a
 * group shows when the entry asks for it; otherwise a phone in no group sees
 * the landing page when it holds no identity, waiting on that check, and
 * otherwise the group frame shows the group the entry names, or the first
 * group by name when it names none or one they've left, or with no group,
 * its welcome or the Settings the entry names.
 * Creating a group restarts the watch, since a first group is also when the
 * identity is made, and opens the new group in place of the form, and getting
 * groups back from the landing page or the welcome restarts it too. The join
 * screen an invite link opens shows whatever the groups, and so does the
 * landing page it opens through "What is Come Hang?", in its invite mode, and
 * once its joiner is in, or leaves it, the watch restarts, since opening the
 * invite made the identity, and the group or the default screen opens in its
 * place. Leaving or deleting a group opens the next group, or the welcome when
 * none is left, and the host announces the change through a status that stays
 * across screens. On an iPhone or iPad in Safari, the install screen shows
 * before any of these, holding an invite link's token to copy, until the app
 * runs installed or someone carries on in Safari, whose main area then takes
 * focus. Once the groups have loaded, the sheet of notices about what happened
 * while someone was away sits over whichever screen shows.
 *
 * Sections:
 *  - Constants
 *  - Hooks
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const RET_MAX_NUM = 5;    // What: Retry Maximum Number. Why: A send that keeps failing shouldn't be tried forever. How: This is how many times in all a group's outbox is sent before it waits for the next change.
const RET_MIL_NUM = 2000; // What: Retry Milliseconds Number. Why: A send refused just after reconnecting goes through once the sign-in catches up. How: This is how long a failed send waits before it's tried again.

// #endregion Constants



// #region Hooks

// #region useActDevFun

/**
 * useActDevFun = Use Active Device Function
 *
 * @summary
 * Follows whether this device is the identity's active one (ARCHITECTURE.md
 * Section 8), watching while the device holds an identity and starting again
 * with each run, since a recovery or a deletion changes it. Returns true or
 * false once the watch reports, and null while it hasn't, or with no
 * identity.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param ideHasBoo - Identity Has Boolean: Whether the device holds an
 *                    identity, null while checking.
 * @param watVerNum - Watch Version Number: The watch's run, which restarts
 *                    the watch when it changes.
 *
 * @returns Whether this device is the active one, or null.
 *
 * @example
 * ```ts
 * useActDevFun(true, 0) // => true
 * ```
 *
*/

const useActDevFun = ( ideHasBoo : boolean | null, watVerNum : number ) : boolean | null => { // What: Use Active Device Function. Why: A device the identity moved away from steps back, and comes back when it's taken back. How: This watches the published key while there's an identity.


	const [ actDevObj, setActDevObj ] = useState< { actBoo : boolean, watVerNum : number } | null >( null ); // What: Active Device Object And Setter. Why: An answer has to be told apart from an earlier run's. How: This holds the latest answer with its run.



	useEffect( () => { // What: Active Watch Effect. Why: Another device can take the identity at any moment. How: This watches while there's an identity, stopping on cleanup.


		if ( ideHasBoo !== true ) return; // What: No Identity Guard. Why: A device without an identity has nothing to watch, and watching would make one. How: This returns.



		let actValBoo = true;     // What: Active Value Boolean. Why: A report or a stop arriving after cleanup mustn't act. How: This is true until the cleanup runs.
		let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once it has started. How: This holds it, doing nothing until then.


		actWatFun( ( actRepBoo ) => { if ( actValBoo ) setActDevObj( { actBoo : actRepBoo, watVerNum } ); } ).then( ( stoFunVal ) => { // What: Watch Start Call. Why: Each report says whether this device is active. How: This keeps each report with its run while it's current, and keeps the stop.


			if ( actValBoo ) stoWatFun = stoFunVal; // What: Stop Keep Call. Why: The cleanup stops the watch. How: This keeps the stop.

			else stoFunVal(); // What: Late Stop Call. Why: The run ended before the watch started. How: This stops it at once.


		}, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Watch Failure Handler. Why: A watch that can't start leaves the device as it is, but the failure stays visible to someone debugging. How: This logs it.



		return () => { // What: Watch Cleanup. Why: A later run replaces this one. How: This marks it inactive and stops the watch.


			actValBoo = false; // What: Inactive Set. Why: Late reports and stops mustn't act. How: This marks the run done.

			stoWatFun(); // What: Watch Stop Call. Why: The listener closes. How: This stops the watch.


		};


	}, [ ideHasBoo, watVerNum ] ); // What: Effect Dependency Array. Why: The watch starts once there's an identity, and again for each run. How: ideHasBoo changes when the check answers, and watVerNum when an identity may have changed.



	return ideHasBoo === true && actDevObj?.watVerNum === watVerNum ? actDevObj.actBoo : null; // What: Active Return. Why: Without an identity, or before this run reports, nothing is known. How: This returns the run's answer, or null.


};

// #endregion useActDevFun



// #region useGroLisFun

/**
 * useGroLisFun = Use Group List Function
 *
 * @summary
 * Watches this identity's groups and returns them sorted by name, or null
 * until the watch for the current run has reported. Changing watVerNum
 * restarts the watch, and a report from an earlier run never counts as the
 * current one, so a restart reads as loading until it reports. A watch that
 * fails to start reads as no groups.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param watVerNum - Watch Version Number: The watch's run, which restarts it
 *                    when it changes.
 *
 * @returns The groups, or null while loading.
 *
 * @example
 * ```ts
 * useGroLisFun(0) // => [ { ideStr, namStr, ownBoo } ]
 * ```
 *
*/

const useGroLisFun = ( watVerNum : number ) : GroRecTyp[] | null => { // What: Use Group List Function. Why: The screen host follows the groups as they change. How: This watches them and keeps each report with the run it came from.


	const [ groLisObj, setGroLisObj ] = useState< { groRecArr : GroRecTyp[], watVerNum : number } | null >( null ); // What: Group List Object And Setter. Why: A report has to be told apart from an earlier run's. How: This holds the latest report with its run.



	useEffect( () => { // What: Group Watch Effect. Why: The groups are watched while the host is shown, from the latest run. How: This starts the watch and stops it on cleanup.


		let actValBoo = true;     // What: Active Value Boolean. Why: A report or a stop arriving after cleanup mustn't act. How: This is true until the cleanup runs.
		let stoWatFun = () => {}; // What: Stop Watch Function. Why: The watch's stop arrives once it has started. How: This holds it, doing nothing until then.


		groWatFun( ( groRecArr ) => { if ( actValBoo ) setGroLisObj( { groRecArr, watVerNum } ); } ).then( ( stoFunVal ) => { // What: Watch Start Call. Why: Each report updates the screen while the host is shown. How: This keeps each report with its run, and keeps the stop, or stops at once when cleanup came first.


			if ( actValBoo ) stoWatFun = stoFunVal; // What: Stop Keep Call. Why: The cleanup stops the watch. How: This keeps the stop.

			else stoFunVal(); // What: Late Stop Call. Why: The host left before the watch started. How: This stops it at once.


		}, ( errCatObj : unknown ) => { // What: Watch Failure Handler. Why: A watch that can't start, such as a build without its Firebase config, shouldn't leave the screen loading forever. How: This logs it and reports no groups.


			console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.

			if ( actValBoo ) setGroLisObj( { groRecArr : [], watVerNum } ); // What: Empty Report Call. Why: The app falls back to the welcome. How: This reports no groups for this run.


		} );



		return () => { // What: Watch Cleanup. Why: A watch shouldn't outlive the run or the host. How: This marks the run inactive and stops the watch.


			actValBoo = false; // What: Inactive Set. Why: Late reports and stops mustn't act. How: This marks the run done.

			stoWatFun(); // What: Watch Stop Call. Why: The listeners close. How: This stops the watch.


		};


	}, [ watVerNum ] ); // What: Effect Dependency Array. Why: A new run restarts the watch. How: watVerNum changes when a group is created.



	return groLisObj?.watVerNum === watVerNum ? groLisObj.groRecArr : null; // What: Groups Return. Why: An earlier run's report isn't the current one. How: This returns the report when it's this run's, or null while loading.


};

// #endregion useGroLisFun



// #region useIdeHasFun

/**
 * useIdeHasFun = Use Identity Has Function
 *
 * @summary
 * Checks whether the phone holds an identity, without connecting, again each
 * time watVerNum changes, since a run restarts whenever an identity may have
 * been made or brought back. Returns null until the current run's check is
 * in.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param watVerNum - Watch Version Number: The watch's run, which repeats
 *                    the check when it changes.
 *
 * @returns Whether the phone holds an identity, or null while checking.
 *
 * @example
 * ```ts
 * useIdeHasFun(0) // => false
 * ```
 *
*/

const useIdeHasFun = ( watVerNum : number ) : boolean | null => { // What: Use Identity Has Function. Why: The landing page and the welcome are told apart by whether the phone holds an identity. How: This checks it each run and keeps the answer with its run.


	const [ ideHasObj, setIdeHasObj ] = useState< { hasBoo : boolean, watVerNum : number } | null >( null ); // What: Identity Has Object And Setter. Why: An answer has to be told apart from an earlier run's. How: This holds the latest answer with its run.



	useEffect( () => { // What: Identity Check Effect. Why: The phone is checked for each run. How: This reads the key store and keeps the answer while the run is current.


		let actValBoo = true; // What: Active Value Boolean. Why: A late answer belongs to a run that's over. How: This is true until the cleanup runs.


		void ideHasFun().then( ( hasValBoo ) => { if ( actValBoo ) setIdeHasObj( { hasBoo : hasValBoo, watVerNum } ); } ); // What: Identity Check Call. Why: The answer picks the screen. How: This checks and keeps the answer with its run.



		return () => { actValBoo = false; }; // What: Check Cleanup. Why: A later run replaces this one. How: This marks it inactive.


	}, [ watVerNum ] ); // What: Effect Dependency Array. Why: A new run checks again. How: watVerNum changes whenever an identity may have changed.



	return ideHasObj?.watVerNum === watVerNum ? ideHasObj.hasBoo : null; // What: Identity Return. Why: An earlier run's answer isn't the current one. How: This returns the answer when it's this run's, or null while checking.


};

// #endregion useIdeHasFun



// #region useOutFluFun

/**
 * useOutFluFun = Use Outbox Flush Function
 *
 * @summary
 * Sends every group's chat messages written offline whenever the device is
 * online and the groups are known, so they go as soon as the connection
 * returns, whichever screen is open (ARCHITECTURE.md Section 14). A send
 * that fails is logged and tried again after RET_MIL_NUM, up to RET_MAX_NUM
 * tries in all while the device stays online, since the first send after
 * reconnecting can be refused while the sign-in catches up (measured
 * 2026-11-09), and after that the messages wait for the next change.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groRecArr - Group Record Array: The member's groups, or null while
 *                    they're unknown.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * useOutFluFun(groRecArr) // => void
 * ```
 *
*/

const useOutFluFun = ( groRecArr : GroRecTyp[] | null ) : void => { // What: Use Outbox Flush Function. Why: Messages written offline should go once the device is back. How: This sends each group's outbox when the device is online.


	const groKeyStr = groRecArr?.map( ( groRecObj ) => groRecObj.ideStr ).sort().join( ',' ) ?? ''; // What: Group Key String. Why: The sends should run only when the groups or the connection change. How: This joins the group IDs into one value to compare.
	const onlValBoo = useOnlBooFun();                                                                // What: Online Value Boolean. Why: Messages can go only while online. How: This follows the connection.



	useEffect( () => { // What: Flush Effect. Why: Coming back online, or a group appearing, may leave messages to send. How: This sends each group's outbox while online, trying a failed one again after a wait.


		if ( !onlValBoo || groKeyStr === '' ) return; // What: Not Ready Guard. Why: Nothing goes offline or without groups. How: This returns.



		const retTimSet = new Set< number >(); // What: Retry Timer Set. Why: Retries still waiting have to stop with the effect. How: This holds their timers.

		let actValBoo = true; // What: Active Value Boolean. Why: A failure arriving after the effect stopped mustn't start a retry. How: This is true until the cleanup.


		const fluGroFun = ( groIdeStr : string, triNum : number ) : void => { // What: Flush Group Function. Why: Each group's messages go to its chat, and a refused send goes through moments later. How: This sends the group's outbox, and on a failure logs it and tries again after RET_MIL_NUM, up to RET_MAX_NUM tries.


			chaOutFun( groIdeStr ).catch( ( errCatObj : unknown ) => { // What: Flush Failure Handler. Why: A failed send stays visible to someone debugging and is tried again. How: This logs it and schedules the next try.


				console.warn( errCatObj ); // What: Failure Log Call. Why: The failure stays visible to someone debugging. How: This logs it.



				if ( !actValBoo || triNum >= RET_MAX_NUM ) return; // What: Stop Guard. Why: A stopped effect tries nothing more, and nor does a send out of tries. How: This returns.



				const retTimNum = window.setTimeout( () => { // What: Retry Timer Number. Why: The next try waits a moment. How: This tries again after RET_MIL_NUM, keeping the timer to cancel.


					retTimSet.delete( retTimNum ); // What: Timer Forget Call. Why: A timer that has run needs no cancelling. How: This drops it from the set.

					fluGroFun( groIdeStr, triNum + 1 ); // What: Retry Call. Why: The send is tried again. How: This flushes the group once more, counting the try.


				}, RET_MIL_NUM ); // What: Retry Wait Argument. Why: The sign-in needs a moment to catch up. How: This waits RET_MIL_NUM.


				retTimSet.add( retTimNum ); // What: Timer Keep Call. Why: The cleanup cancels a retry still waiting. How: This keeps its timer.


			} );


		};


		for ( const groIdeStr of groKeyStr.split( ',' ) ) fluGroFun( groIdeStr, 1 ); // What: Group Loop. Why: Each group's messages go to its chat. How: This flushes each group, as its first try.



		return () => { // What: Cleanup Return. Why: Retries belong to the connection and groups they started under. How: This returns the function that stops them.


			actValBoo = false; // What: Inactive Set. Why: A failure still out mustn't start a retry. How: This marks the effect stopped.


			for ( const retTimNum of retTimSet ) window.clearTimeout( retTimNum ); // What: Timer Loop. Why: A retry still waiting shouldn't run. How: This cancels each.


		};


	}, [ groKeyStr, onlValBoo ] ); // What: Effect Dependency Array. Why: The sends follow the groups and the connection. How: groKeyStr changes with the groups, and onlValBoo when the device goes online or offline.


};

// #endregion useOutFluFun



// #region useProSynFun

/**
 * useProSynFun = Use Profile Sync Function
 *
 * @summary
 * Copies this member's profile photo into any group missing it whenever
 * their set of groups changes, such as after joining one, so one photo
 * shows in every group (ARCHITECTURE.md Section 21). Does nothing while the
 * groups are unknown or there are none, and logs a sync that fails, which
 * the next change tries again.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groRecArr - Group Record Array: The member's groups, or null while
 *                    they're unknown.
 *
 * @returns This function does not return anything.
 *
 * @example
 * ```ts
 * useProSynFun(groRecArr) // => void
 * ```
 *
*/

const useProSynFun = ( groRecArr : GroRecTyp[] | null ) : void => { // What: Use Profile Sync Function. Why: A group joined after the photo was set should show it too. How: This syncs the photo as the groups change.


	const groKeyStr = groRecArr?.map( ( groRecObj ) => groRecObj.ideStr ).sort().join( ',' ) ?? ''; // What: Group Key String. Why: The sync should run only when the groups change. How: This joins their IDs into one value to compare.



	useEffect( () => { // What: Sync Effect. Why: A changed set of groups may hold one missing the photo. How: This syncs once there are groups, logging a failure.


		if ( groKeyStr !== '' ) proSynFun().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Sync Call. Why: Every group should hold the member's newest photo. How: This copies it where it's missing, logging a failure.


	}, [ groKeyStr ] ); // What: Effect Dependency Array. Why: The sync follows the member's groups. How: groKeyStr changes when they do.


};

// #endregion useProSynFun



// #region useWaiLisFun

/**
 * useWaiLisFun = Use Waiting List Function
 *
 * @summary
 * Returns what's waiting on the member across their groups, oldest first:
 * the live offers of a group to them, read from the groups, and the join,
 * key, and history requests they can answer, watched in each group. The
 * member's UID is read once there's a group, and the watch restarts only when
 * the groups themselves change, not with every report of them. With no
 * groups, or before the first report, nothing is waiting.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param groRecArr - Group Record Array: The member's groups, or null while
 *                    loading.
 *
 * @returns The waiting items.
 *
 * @example
 * ```ts
 * useWaiLisFun(groRecArr) // => [{ kinValStr : 'join', ... }]
 * ```
 *
*/

const useWaiLisFun = ( groRecArr : GroRecTyp[] | null ) : WaiRecTyp[] => { // What: Use Waiting List Function. Why: The frame and the notices sheet follow what's waiting on the member. How: This watches the requests and adds the offers.


	const [ uidValStr, setUidValStr ] = useState( '' );                 // What: UID Value String And Setter. Why: The items are judged against the member. How: This holds their UID, empty until read.
	const [ waiRecArr, setWaiRecArr ] = useState< WaiRecTyp[] >( [] ); // What: Waiting Record Array And Setter. Why: The watch reports the requests waiting. How: This holds the latest report.


	const groIdeArr = groRecArr?.map( ( groRecObj ) => groRecObj.ideStr ).sort() ?? []; // What: Group Identifier Array. Why: The watches follow the member's groups. How: This lists their IDs in order.
	const groKeyStr = groIdeArr.join( ',' );                                          // What: Group Key String. Why: The watch should restart only when the groups change. How: This joins the IDs into one value to compare.



	useEffect( () => { // What: UID Read Effect. Why: Only an identity in a group has anything waiting, and reading it otherwise would make one. How: This reads the UID once there's a group.


		if ( groKeyStr === '' ) return; // What: No Group Guard. Why: Nothing waits outside a group. How: This returns.



		let actValBoo = true; // What: Active Value Boolean. Why: A read finishing after the groups changed mustn't land. How: This is true until the cleanup runs.


		void ideEnsFun().then( ( ideRecObj ) => { if ( actValBoo ) setUidValStr( ideRecObj.uidValStr ); }, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: UID Read Call. Why: The items are judged against the member. How: This reads the identity and keeps its UID, logging a failure.



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: A late read belongs to groups since changed. How: This marks it inactive.


	}, [ groKeyStr ] ); // What: Effect Dependency Array. Why: The UID is read for each set of groups. How: groKeyStr changes when the groups do.



	useEffect( () => { // What: Waiting Watch Effect. Why: Requests can arrive and be answered at any time. How: This watches them across the groups, stopping on cleanup.


		if ( groKeyStr === '' || uidValStr === '' ) return; // What: Not Ready Guard. Why: The watch needs the groups and the member. How: This returns until both are known.



		return waiWatFun( groKeyStr.split( ',' ), uidValStr, setWaiRecArr ); // What: Watch Return. Why: The watches stop with the groups they follow. How: This starts them and returns their stop.


	}, [ groKeyStr, uidValStr ] ); // What: Effect Dependency Array. Why: The watch follows the member's groups. How: groKeyStr changes when the groups do, and uidValStr once it's read.



	return [ ...offLisFun( groRecArr ?? [], uidValStr, Date.now() ), ...waiRecArr.filter( ( waiRecObj ) => groIdeArr.includes( waiRecObj.groIdeStr ) ) ].sort( ( recOneObj, recTwoObj ) => recOneObj.timNum - recTwoObj.timNum ); // What: Items Return. Why: The longest wait reads first, and a group just left has nothing waiting. How: This joins the offers and the watched requests still in the groups, oldest first.


};

// #endregion useWaiLisFun

// #endregion Hooks



// #region Components

// #region ScrHosCom

/**
 * ScrHosCom = Screen Host Component
 *
 * @summary
 * Renders the screen the history entry and the groups call for: the waiting
 * screen while loading, the screen for starting a group, the landing page, or
 * the group frame, with no group when the phone is in none, then the notices
 * sheet once the groups have loaded, outside the install screen, and a status
 * region that stays as the screens change. A created group restarts the watch
 * and replaces the form's entry with the new group's, marked to take focus. A
 * group left or deleted is hidden at once, before the watch drops it, its
 * entry replaced with the next group's, or with none when it was the last,
 * marked to take focus, and the status announces the change. Groups brought
 * back from Google restart the watch, the first of them taking focus. On an
 * iPhone or iPad in Safari, the install screen comes first until the app runs
 * installed or someone carries on in Safari, a choice kept on the device,
 * after which the main area takes focus.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The current screen and the status.
 *
 * @example
 * ```tsx
 * ScrHosCom() // => <ScrHosCom />
 * ```
 *
*/

function ScrHosCom () : React.JSX.Element {


	const conFocRef = useRef( false ); // What: Continue Focus Reference. Why: Carrying on in Safari takes away the pressed button, so focus is owed to the screen that follows. How: This is true from the press until the focus is given.
	const scrOpeFun = useScrOpeFun();  // What: Screen Open Function. Why: A created group opens, and so does the next group after one is gone. How: This reads the function that opens a screen.
	const scrStaObj = useScrStaFun();  // What: Screen State Object. Why: The entry says which screen to show. How: This reads it, null for the default.

	const [ annMesStr, setAnnMesStr ] = useState( '' );        // What: Announce Message String And Setter. Why: Leaving or deleting a group takes away the section that did it, so the host has to say what happened. How: This holds the status's text.
	const [ gonIdeStr, setGonIdeStr ] = useState( '' );        // What: Gone Identifier String And Setter. Why: A group just left or deleted shouldn't show while the watch catches up. How: This holds its ID, empty when there's none.
	const [ safConBoo, setSafConBoo ] = useState( safConFun ); // What: Safari Continue Boolean And Setter. Why: Someone on iPhone who chose to carry on in Safari sees the app rather than the install steps. How: This starts from the choice kept on the device and turns true on the choice.
	const [ watVerNum, setWatVerNum ] = useState( 0 );         // What: Watch Version Number And Setter. Why: A first group is created with the identity, which the running watch didn't have. How: This counts the watch's runs.


	const groRecArr = useGroLisFun( watVerNum );                                                    // What: Group Record Array. Why: The groups decide between the first screens and a group. How: This watches them, null while loading.
	const ideHasBoo = useIdeHasFun( watVerNum );                                                    // What: Identity Has Boolean. Why: A phone in no group sees the landing page or the welcome by whether it holds an identity. How: This checks it, null while checking.
	const actDevBoo = useActDevFun( ideHasBoo, watVerNum );                                         // What: Active Device Boolean. Why: A device the identity moved away from shows the moved screen instead. How: This follows whether this device is the active one, null while unknown.
	const visGroArr = groRecArr?.filter( ( groRecObj ) => groRecObj.ideStr !== gonIdeStr ) ?? null; // What: Visible Group Array. Why: A group just left or deleted is gone to the member at once. How: This leaves it out of the groups, null while loading.
	const waiRecArr = useWaiLisFun( visGroArr );                                                    // What: Waiting Record Array. Why: What's waiting on the member marks the frame and opens the notices sheet. How: This watches it across the visible groups.


	useOutFluFun( visGroArr ); // What: Outbox Flush Call. Why: Messages written offline go once the device is back online. How: This sends them whichever screen is open.

	useProSynFun( visGroArr ); // What: Profile Sync Call. Why: One photo shows in every group, including ones joined later. How: This syncs it as the groups change.



	const iosGatBoo = isaIosFun() && !isaInsFun() && !safConBoo; // What: iOS Gate Boolean. Why: On an iPhone or iPad in Safari, installing comes before anything else, since nothing done in Safari moves to the app (Section 16). How: This is true there until the app is installed or someone chooses to carry on in Safari.


	useLayoutEffect( () => { // What: Screen Ready Effect. Why: A reload returns to its scroll position only once the real screen is tall enough to reach it. How: This tells the scroll hook the screen is ready once the groups have loaded.


		if ( groRecArr !== null && ( groRecArr.length > 0 || ideHasBoo !== null ) ) scrReaFun(); // What: Ready Call. Why: The real screen has just rendered, which in no group also waits on the identity check. How: This settles the hook's wait, which later calls leave as it is.


	}, [ groRecArr, ideHasBoo ] ); // What: Effect Dependency Array. Why: The screen is ready once the groups arrive, and in no group once the check does too. How: groRecArr changes from null to the list when they arrive, and ideHasBoo from null to the answer.




	useEffect( () => { // What: Sharing Check Effect. Why: Sharing kept from before a reload resumes once the groups are known, and sharing for a group the member is no longer in ends. How: This resumes the kept record, then ends a current one whose group isn't listed.


		if ( groRecArr === null ) return; // What: Loading Guard. Why: The groups aren't known yet. How: This returns.



		const groIdeArr = groRecArr.map( ( groRecObj ) => groRecObj.ideStr ); // What: Group Identifier Array. Why: Sharing belongs only to the member's groups. How: This lists their IDs.
		const shaRecObj = shaGetFun();                                         // What: Sharing Record Object. Why: A current record may belong to a group that's gone. How: This reads it.


		void shaResFun( groIdeArr ); // What: Resume Call. Why: Opening the app sends a fresh fix while sharing (Section 10). How: This resumes the kept record, once.

		if ( shaRecObj && !groIdeArr.includes( shaRecObj.groIdeStr ) ) void shaEndFun( shaRecObj.groIdeStr ); // What: Gone End Call. Why: A member removed from a group stops sharing with it. How: This ends sharing for a group no longer listed.


	}, [ groRecArr ] ); // What: Effect Dependency Array. Why: Sharing is checked against each report. How: groRecArr changes as the watch reports.




	useEffect( () => { // What: Places Prune Effect. Why: The event places kept for a group the member left, was removed from, or deleted shouldn't stay on the device. How: This removes the places of every group the watch no longer lists.


		if ( groRecArr !== null ) plaPruFun( groRecArr.map( ( groRecObj ) => groRecObj.ideStr ) ).catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Prune Call. Why: Only the member's groups keep their places, and a failed removal shouldn't break the screen. How: This prunes once the groups are known, logging a failure.


	}, [ groRecArr ] ); // What: Effect Dependency Array. Why: The places are checked against each report. How: groRecArr changes as the watch reports.



	useEffect( () => { // What: Active Device Effect. Why: Pushes and a shared location belong to the device the identity is on. How: This refreshes the active device's push token, and on a device that stepped back releases its token and ends its sharing.


		if ( actDevBoo === true ) pusRefFun().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Push Refresh Call. Why: A token left unrefreshed expires, and one another device took over has to come back when this device takes the identity back. How: This refreshes it, logging a failure.



		if ( actDevBoo !== false ) return; // What: Not Stepped Back Guard. Why: Only a device that stepped back gives up its pushes and sharing. How: This returns otherwise.



		const shaRecObj = shaGetFun(); // What: Sharing Record Object. Why: A device that stepped back shouldn't keep sharing where the member is. How: This reads any sharing kept here.


		pusRelFun().catch( ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Push Release Call. Why: Pushes should reach the device the identity moved to. How: This deletes the stored token while it's this device's own, logging a failure.

		if ( shaRecObj ) void shaEndFun( shaRecObj.groIdeStr ); // What: Sharing End Call. Why: Sharing stops with the device that stepped back. How: This ends it.


	}, [ actDevBoo ] ); // What: Effect Dependency Array. Why: The token and sharing follow whether this device is active. How: actDevBoo changes when the watch reports.



	useEffect( () => { // What: Continue Focus Effect. Why: The button that carried on in Safari is gone, so focus should land on the screen that replaced it. How: This focuses the main area once the install screen has gone, when focus is owed.


		if ( !conFocRef.current || iosGatBoo ) return; // What: Owed Guard. Why: Only the press that carried on owes focus, once its screen shows. How: This returns otherwise.



		conFocRef.current = false; // What: Owed Clear Set. Why: The focus is given once. How: This clears the debt.

		document.getElementById( 'main' )?.focus(); // What: Focus Call. Why: The new screen's content is where someone carries on. How: This focuses the main area, the skip link's target, which takes focus without joining the Tab order.


	}, [ iosGatBoo ] ); // What: Effect Dependency Array. Why: Focus moves once the install screen goes. How: iosGatBoo turns false when someone carries on.



	useEffect( () => { // What: Gone Clear Effect. Why: The group is hidden only until the watch drops it, so a group joined again later shows. How: This forgets it once the watch's groups no longer hold it.


		if ( gonIdeStr !== '' && groRecArr?.every( ( groRecObj ) => groRecObj.ideStr !== gonIdeStr ) === true ) setGonIdeStr( '' ); // What: Gone Clear Call. Why: The watch has caught up. How: This clears the ID once no group reported has it.


	}, [ gonIdeStr, groRecArr ] ); // What: Effect Dependency Array. Why: The group is forgotten once the watch drops it. How: gonIdeStr changes when a group goes, and groRecArr when the watch reports.



	// #region gonGroFun

	/**
	 * gonGroFun = Gone Group Function
	 *
	 * @summary
	 * Handles a group the member just left or deleted: hides it, announces the
	 * given message, and replaces the history entry with the next group by
	 * name, or with none when it was the last, so the welcome shows. Either
	 * way the entry asks the screen to take focus on its heading, since the
	 * button that did it is gone.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param gonValStr - Gone Value String: The ID of the group that's gone.
	 * @param mesValStr - Message Value String: What to announce.
	 *
	 * @returns This function does not return anything.
	 *
	 * @example
	 * ```ts
	 * gonGroFun('Xk3...', 'You left Beach Week.') // => void
	 * ```
	 *
	*/

	const gonGroFun = ( gonValStr : string, mesValStr : string ) : void => { // What: Gone Group Function. Why: A group left or deleted is replaced by what the member has left. How: This hides it, announces it, and opens the next screen.


		const nexGroObj = visGroArr?.find( ( groRecObj ) => groRecObj.ideStr !== gonValStr ); // What: Next Group Object. Why: The member carries on in their next group by name. How: This finds the first other group, undefined when none is left.


		setAnnMesStr( mesValStr ); // What: Announce Set Call. Why: The member hears what happened. How: This puts the message in the status.

		setGonIdeStr( gonValStr ); // What: Gone Set Call. Why: The group shouldn't show again while the watch catches up. How: This hides it.

		void shaEndFun( gonValStr ); // What: Sharing End Call. Why: Sharing with a group the member left or deleted has to stop. How: This ends it, when the record is that group's.


		scrOpeFun( nexGroObj === undefined ? { focBoo : true, scrStr : 'group' } : { focBoo : true, groStr : nexGroObj.ideStr, scrStr : 'group' }, true ); // What: Screen Replace Call. Why: Back shouldn't return to a group that's gone. How: This replaces the entry with the next group's, or one naming none, each asking for focus.


	};

	// #endregion gonGroFun



	// #region takDevFun

	/**
	 * takDevFun = Take Device Function
	 *
	 * @summary
	 * Makes this device the identity's active one again, from the moved
	 * screen, then announces it and opens the first group, or the welcome,
	 * with focus on its heading, since the button that did it is gone.
	 * Rejects, changing nothing on screen, when the key can't be published.
	 *
	 * @author z4nta0 <https://github.com/z4nta0>
	 *
	 * @param void - This function takes no parameters.
	 *
	 * @returns A promise that settles once the device is active again, with
	 *          no value.
	 *
	 * @example
	 * ```ts
	 * takDevFun() // => Promise<void>
	 * ```
	 *
	*/

	const takDevFun = async () : Promise< void > => { // What: Take Device Function. Why: Someone can move their identity back to this device. How: This publishes the device's key, announces it, and opens the groups.


		await actTakFun(); // What: Take Call. Why: The device whose key is published is the active one. How: This publishes this device's key.


		setAnnMesStr( 'Come Hang is back on this device.' ); // What: Announce Set Call. Why: The moved screen's button goes with the move. How: This says it worked.

		scrOpeFun( { focBoo : true, scrStr : 'group' }, true ); // What: Screen Replace Call. Why: The screen that follows takes focus on its heading. How: This replaces the entry with the first group's, asking for focus.


	};

	// #endregion takDevFun



	const recGroFun = useCallback( () : void => { // What: Recover Groups Function. Why: An identity brought back from Google comes with its groups, which the running watch didn't know of. How: This restarts the watch, announces the sign-in, and asks the next screen to take focus.


		setWatVerNum( ( preVerNum ) => preVerNum + 1 ); // What: Watch Restart Call. Why: The watch started before the identity came back. How: This starts a new run.

		setAnnMesStr( 'Signed in with Google.' ); // What: Announce Set Call. Why: The welcome's button goes with the sign-in. How: This says it worked.

		scrOpeFun( { focBoo : true, scrStr : 'group' }, true ); // What: Screen Replace Call. Why: The screen that follows, the first group or the welcome again, takes focus on its heading. How: This replaces the entry with one asking for focus.


	}, [ scrOpeFun ] ); // What: Callback Dependency Array. Why: The recovery opens the next screen through the host's opener. How: scrOpeFun is that opener, kept stable by its hook, and the state setters never change.



	useEffect( () => { // What: Redirect Recovery Effect. Why: A recovery whose popup was blocked comes back signed in from Google's page, this device's key pair still to make and its groups to show. How: This takes a finished recovery's outcome once, makes the key pair, and hands over as the popup's recovery does.


		let actValBoo = true; // What: Active Value Boolean. Why: An outcome arriving after the host closed mustn't act. How: This is true until the cleanup runs.


		void outTakFun( 'recover', false, () => { // What: Outcome Take Call. Why: Only a finished recovery has anything to finish. How: This takes it while the host is open, then finishes it.


			if ( !actValBoo ) return false; // What: Closed Guard. Why: A host torn down leaves the outcome for the one that replaces it. How: This passes it by.



			ideEnsFun().then( recGroFun, ( errCatObj : unknown ) => console.warn( errCatObj ) ); // What: Finish Call. Why: The recovered identity needs this device's key pair published, so a member can share each group's key, and its groups come into view announced. How: This runs the bootstrap for it, then restarts the watch and opens the first group, logging a failure.



			return true; // What: Used Return. Why: The recovery is finished once. How: This marks the outcome taken.


		} );



		return () => { actValBoo = false; }; // What: Cleanup Return. Why: An outcome still out shouldn't act after the host closes. How: This marks it closed.


	}, [ recGroFun ] ); // What: Effect Dependency Array. Why: The finished recovery hands over through recGroFun. How: recGroFun stays the same while the opener does, and the outcome is taken only once anyway.



	const tokValStr = scrStaObj?.tokStr; // What: Token Value String. Why: The join screen's entry keeps its token as it changes. How: This reads it, undefined for any other screen.


	const joiEntFun = useCallback( ( groIdeStr? : string, groNamStr? : string ) : void => scrOpeFun( { groStr : groIdeStr, namStr : groNamStr, scrStr : 'join', tokStr : tokValStr }, true ), [ scrOpeFun, tokValStr ] ); // What: Join Entry Function. Why: A reload of the join screen should find a request sent, even after the link changes, and forget one taken back. How: This replaces the entry with the join screen's, holding the group and its name or neither.



	const joiGroFun = useCallback( ( groIdeStr : string, mesValStr : string ) : void => { // What: Join Group Function. Why: A joiner let in sees their group, which the running watch may not know of, since opening the invite made the identity. How: This restarts the watch, announces the message, and replaces the entry with the group's, asking for focus.


		setWatVerNum( ( preVerNum ) => preVerNum + 1 ); // What: Watch Restart Call. Why: The watch may have started before the identity existed. How: This starts a new run.

		setAnnMesStr( mesValStr ); // What: Announce Set Call. Why: The join screen goes with the change. How: This puts the message in the status.

		scrOpeFun( { focBoo : true, groStr : groIdeStr, scrStr : 'group' }, true ); // What: Screen Replace Call. Why: Back shouldn't return to the join screen. How: This replaces the entry with the group's, asking for focus.


	}, [ scrOpeFun ] ); // What: Callback Dependency Array. Why: The function only changes with the opener. How: scrOpeFun stays the same while the router's navigate does.



	const joiLeaFun = useCallback( () : void => { // What: Join Leave Function. Why: Someone leaving the join screen goes to the app, whose watch may predate the identity the invite made, and a group they're let in later should show. How: This restarts the watch and replaces the entry with the default screen's, asking for focus.


		setWatVerNum( ( preVerNum ) => preVerNum + 1 ); // What: Watch Restart Call. Why: The watch may have started before the identity existed. How: This starts a new run.

		scrOpeFun( { focBoo : true, scrStr : 'group' }, true ); // What: Screen Replace Call. Why: The back button is gone, and back shouldn't return to the join screen. How: This replaces the entry with the default screen's, asking for focus.


	}, [ scrOpeFun ] ); // What: Callback Dependency Array. Why: The function only changes with the opener. How: scrOpeFun stays the same while the router's navigate does.



	const scrPicFun = () : React.JSX.Element => { // What: Screen Pick Function. Why: One screen shows at a time, beside the host's status. How: This returns the screen the entry and the groups call for.


		if ( iosGatBoo ) return <InsIosCom tokValStr={ scrStaObj?.scrStr === 'join' ? tokValStr : undefined } onConFun={ () => { conFocRef.current = true; setSafConBoo( true ); } } />; // What: Install Return. Why: On an iPhone or iPad in Safari the install steps come first, with an invite's link kept to copy. How: This shows the install screen, handing it the token of an invite link that opened the app.



		if ( visGroArr === null ) return <LoaScrCom />; // What: Loading Return. Why: The screen can't be chosen before the groups are known. How: This shows the waiting screen, whose loader appears only if the wait runs long.



		if ( actDevBoo === false ) { // What: Moved Block. Why: A device the identity moved away from shows why, whatever the entry asks for. How: This shows the moved screen.


			return (


				<MovDevCom
					groRecArr={ visGroArr }

					onTakFun={ takDevFun }
				/> // What: Moved Device Component. Why: The device stepped back, with the member's groups' keys still to share and the way back. How: This shows the screen with the groups and the take-back.


			);


		}



		if ( scrStaObj?.scrStr === 'join' && tokValStr !== undefined ) { // What: Join Block. Why: An invite link opens its screen whatever groups someone is in. How: This shows it for the entry's token.


			return (


				<JoiGroCom
					key={ tokValStr }

					groIdeStr={ scrStaObj.groStr }
					groNamStr={ scrStaObj.namStr }
					tokValStr={ tokValStr }

					onAnnFun={ setAnnMesStr }
					onEntFun={ joiEntFun }
					onJoiFun={ joiGroFun }
					onLeaFun={ joiLeaFun }
				/> // What: Join Group Component. Why: The join screen runs the request for the link, starting afresh for another one. How: This shows it keyed by the token, with the group the entry remembers and what to do as the join goes on.


			);


		}



		if ( scrStaObj?.scrStr === 'about' ) return <LanPagCom invNamStr={ scrStaObj.namStr ?? '' } onRecFun={ recGroFun } />; // What: About Return. Why: The invite form's "What is Come Hang?" opens the landing page, which leads back to joining. How: This shows it in its invite mode, naming the group the entry carries.



		if ( scrStaObj?.scrStr === 'create' ) return <CreGroCom onCreFun={ ( groIdeStr ) => { setWatVerNum( ( preVerNum ) => preVerNum + 1 ); scrOpeFun( { focBoo : true, groStr : groIdeStr, scrStr : 'group' }, true ); } } />; // What: Create Screen Return. Why: The entry asks for the form, and a created group opens in its place. How: This shows the form, which restarts the watch and replaces its entry with the new group's, asking for focus, when it's done.



		if ( scrStaObj?.scrStr === 'paste' ) return <PasInvCom />; // What: Paste Return. Why: Joining with an invite link has its own screen. How: This shows it when the entry asks for it.



		if ( visGroArr.length === 0 && ideHasBoo === null ) return <LoaScrCom />; // What: Checking Return. Why: The landing page and the welcome are told apart by the identity check. How: This keeps the waiting screen until it's in.



		if ( visGroArr.length === 0 && !ideHasBoo ) return <LanPagCom onRecFun={ recGroFun } />; // What: Landing Return. Why: A phone with no identity meets Come Hang through its landing page, which can bring groups back. How: This shows it, passing what to do once an identity comes back.



		const curGroObj = visGroArr.find( ( groRecObj ) => groRecObj.ideStr === scrStaObj?.groStr ) ?? visGroArr[ 0 ] ?? null; // What: Current Group Object. Why: The entry names a group, which may be one since left, and a phone holding an identity may be in none. How: This finds it, or takes the first group by name, or null with no group.



		return (


			<GroFraCom
				curGroObj={ curGroObj }
				eveIdeStr={ scrStaObj?.groStr === curGroObj?.ideStr ? scrStaObj?.eveStr : undefined } // What: Event Choice. Why: A chat line opens its event in the Events section, only in the group it names. How: This reads the entry's event when it's for the group shown.
				eveParStr={ scrStaObj?.groStr === curGroObj?.ideStr ? scrStaObj?.parStr : undefined } // What: Event Part Choice. Why: A bring-list line opens its event at the list rather than its photos, only in the group it names. How: This reads the entry's part when it's for the group shown.
				focBoo={ scrStaObj?.focBoo === true && ( scrStaObj.groStr === undefined || curGroObj?.ideStr === scrStaObj.groStr ) } // What: Focus Request. Why: Only a group opened by a creation, a leave, a deletion, or getting groups back takes focus, and only the one the entry names, or the first, or the frame with no group, when it names none. How: This is true for the entry that change opened.
				groRecArr={ visGroArr }
				secNamStr={ scrStaObj?.groStr === undefined || scrStaObj.groStr === curGroObj?.ideStr ? scrStaObj?.secStr ?? 'chat' : 'chat' } // What: Section Name Choice. Why: The entry names the open section, and a group opened without one, or one that's gone, starts at its chat, which with no group is the welcome, while an entry naming no group, such as Settings opened before a first group arrived, keeps its section. How: This reads the entry's section when it's for the group shown or for none, else the chat.
				waiRecArr={ waiRecArr }
				waiStr={ scrStaObj?.groStr === curGroObj?.ideStr ? scrStaObj?.waiStr : undefined } // What: Waiting Choice. Why: The notices sheet opens People or Settings at an item, only in the group it names. How: This reads the entry's item when it's for the group shown.

				onGonFun={ gonGroFun }
				onRecFun={ recGroFun }
			/> // What: Group Frame Component. Why: Someone holding an identity sees the open group framed with the rest, or the frame's welcome with none. How: This shows the current group, or the welcome.


		);


	};



	return (


		<>{ /* What: Screen Host Fragment. Why: The screen changes while the status stays. How: This groups them without adding an element. */ }


			{ scrPicFun() }{ /* What: Screen Pick Call. Why: The entry and the groups decide the screen. How: This renders the one they call for. */ }



			{ !iosGatBoo && groRecArr !== null && actDevBoo !== false && ( // What: Notice Sheet Condition. Why: The sheet opens over a real screen, not the install steps or the wait, its watch restarting with the groups' for an identity just made. How: This shows the sheet once the groups have loaded, outside the install screen and a device that stepped back.


				<NotSheCom
					groRecArr={ groRecArr }
					waiRecArr={ waiRecArr }
					watVerNum={ watVerNum }
				/> // What: Notice Sheet Component. Why: What's waiting on the member, and what happened while they were away, opens over the screen. How: This shows the sheet, closed until something arrives.


			) }



			<p
				className={ cssModObj.hosStaPar }

				role='status'
			>{ annMesStr }</p>{ /* What: Host Status Paragraph Element. Why: A group left or deleted takes away the section that would have said so. How: This holds the message, empty from the first render, in the page whatever screen shows. */ }


		</>


	);


}

// #endregion ScrHosCom

// #endregion Components



// #region Exports

export { ScrHosCom }; // What: Named Export. Why: The app root shows the screen host at its one address. How: This exports ScrHosCom.

// #endregion Exports


