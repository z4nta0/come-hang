


// #region Imports

import { CreGroCom       } from './create-group.tsx';  // What: Create Group Component. Why: Starting a group has its own screen. How: The host shows it when the entry asks for it.
import { GroFraCom       } from './group-frame.tsx';   // What: Group Frame Component. Why: Someone in a group sees it framed with the rest. How: The host shows it for the open group.
import { groWatFun       } from '../state/groups.ts';  // What: Group Watch Function. Why: Which screen shows depends on the groups someone is in. How: This watches them.
import { LoaScrCom       } from './loading.tsx';       // What: Loading Screen Component. Why: Someone waiting on the groups should see the app is working. How: The host shows it while they load.
import { scrReaFun       } from '../ui/scroll-top.ts'; // What: Screen Ready Function. Why: A reload's scroll position can only be restored once the real screen has rendered. How: The host calls it once the groups have loaded.
import { useEffect       } from 'react';               // What: Use Effect. Why: The groups are watched while the host is shown. How: This starts and stops the watch.
import { useLayoutEffect } from 'react';               // What: Use Layout Effect. Why: The scroll hook should hear the screen is ready before the browser draws it. How: This runs right after the real screen commits.
import { useScrOpeFun    } from '../ui/screen.ts';     // What: Use Screen Open Function. Why: A created group opens. How: This returns the function that opens its screen.
import { useScrStaFun    } from '../ui/screen.ts';     // What: Use Screen State Function. Why: The history entry says which screen to show. How: This reads it.
import { useState        } from 'react';               // What: Use State. Why: The groups and the watch's restarts change what shows. How: This holds both.
import { WelScrCom       } from './welcome.tsx';       // What: Welcome Screen Component. Why: Someone in no group sees the welcome. How: The host shows it when there are no groups.


import type { GroRecTyp } from '../state/groups.ts'; // What: Group Record Type. Why: The host reads the groups the watch reports. How: This types them.

// #endregion Imports



/**
 * screen-host.tsx = Screen Host
 *
 * @summary
 * Chooses the screen the app shows at its one address, from the history entry
 * and the groups this identity is in. While the groups load it shows the
 * waiting screen, and once they have, it tells the scroll hook the screen is
 * ready, so a reload can return to where it was. The screen for starting a
 * group shows when the entry asks for it; otherwise someone in no group sees
 * the welcome, and someone in groups sees the group the entry names, or the
 * first group by name when it names none or one they've left. Creating a group
 * restarts the watch, since a first group is also when the identity is made,
 * and opens the new group in place of the form.
 *
 * Sections:
 *  - Hooks
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Hooks

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

// #endregion Hooks



// #region Components

// #region ScrHosCom

/**
 * ScrHosCom = Screen Host Component
 *
 * @summary
 * Renders the screen the history entry and the groups call for: the waiting
 * screen while loading, the screen for starting a group, the welcome, or
 * the group frame. A created group restarts the watch and replaces the
 * form's entry with the new group's, marked to take focus.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The current screen.
 *
 * @example
 * ```tsx
 * ScrHosCom() // => <ScrHosCom />
 * ```
 *
*/

function ScrHosCom () : React.JSX.Element {


	const scrOpeFun = useScrOpeFun(); // What: Screen Open Function. Why: A created group opens. How: This reads the function that opens a screen.
	const scrStaObj = useScrStaFun(); // What: Screen State Object. Why: The entry says which screen to show. How: This reads it, null for the default.

	const [ watVerNum, setWatVerNum ] = useState( 0 ); // What: Watch Version Number And Setter. Why: A first group is created with the identity, which the running watch didn't have. How: This counts the watch's runs.


	const groRecArr = useGroLisFun( watVerNum ); // What: Group Record Array. Why: The groups decide between the welcome and a group. How: This watches them, null while loading.


	useLayoutEffect( () => { // What: Screen Ready Effect. Why: A reload returns to its scroll position only once the real screen is tall enough to reach it. How: This tells the scroll hook the screen is ready once the groups have loaded.


		if ( groRecArr !== null ) scrReaFun(); // What: Ready Call. Why: The real screen has just rendered. How: This settles the hook's wait, which later calls leave as it is.


	}, [ groRecArr ] ); // What: Effect Dependency Array. Why: The screen is ready once the groups arrive. How: groRecArr changes from null to the list when they do.



	if ( groRecArr === null ) return <LoaScrCom />; // What: Loading Return. Why: The screen can't be chosen before the groups are known. How: This shows the waiting screen, whose loader appears only if the wait runs long.



	if ( scrStaObj?.scrStr === 'create' ) return <CreGroCom onCreFun={ ( groIdeStr ) => { setWatVerNum( ( preVerNum ) => preVerNum + 1 ); scrOpeFun( { creBoo : true, groStr : groIdeStr, scrStr : 'group' }, true ); } } />; // What: Create Screen Return. Why: The entry asks for the form, and a created group opens in its place. How: This shows the form, which restarts the watch and replaces its entry with the new group's when it's done.



	if ( groRecArr.length === 0 ) return <WelScrCom />; // What: Welcome Return. Why: Someone in no group starts at the welcome. How: This shows it.



	const curGroObj = groRecArr.find( ( groRecObj ) => groRecObj.ideStr === scrStaObj?.groStr ) ?? groRecArr[ 0 ]; // What: Current Group Object. Why: The entry names a group, which may be one since left. How: This finds it, or takes the first group by name.



	return (


		<GroFraCom
			curGroObj={ curGroObj }
			focBoo={ scrStaObj?.creBoo === true && curGroObj.ideStr === scrStaObj.groStr } // What: Focus Request. Why: Only the group just created takes focus, and only when it's the one shown. How: This is true for the entry its creation opened.
			groRecArr={ groRecArr }
		/> // What: Group Frame Component. Why: Someone in groups sees the open one framed with the rest. How: This shows the current group.


	);


}

// #endregion ScrHosCom

// #endregion Components



// #region Exports

export { ScrHosCom }; // What: Named Export. Why: The app root shows the screen host at its one address. How: This exports ScrHosCom.

// #endregion Exports


