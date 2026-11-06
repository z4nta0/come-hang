


// #region Imports

import cssModObj from './screen-host.module.css'; // What: CSS Module Object. Why: The host's status is styled in its own module, whose class names Vite hashes. How: Its element reads its class from this object.


import { CreGroCom       } from './create-group.tsx';     // What: Create Group Component. Why: Starting a group has its own screen. How: The host shows it when the entry asks for it.
import { GroFraCom       } from './group-frame.tsx';      // What: Group Frame Component. Why: Someone in a group sees it framed with the rest. How: The host shows it for the open group.
import { groWatFun       } from '../state/groups.ts';     // What: Group Watch Function. Why: Which screen shows depends on the groups someone is in. How: This watches them.
import { ideHasFun       } from '../state/deletion.ts';   // What: Identity Has Function. Why: A phone with no identity sees the landing page, and one in no group the welcome. How: This checks without connecting.
import { InsIosCom       } from './install-ios.tsx';      // What: Install iOS Component. Why: An iPhone or iPad in Safari installs before anything else. How: The host shows it until the app is installed or someone carries on in Safari.
import { isaInsFun       } from '../platform/install.ts'; // What: Is-An Installed Function. Why: An installed app needs no install steps. How: This checks whether the app runs installed.
import { isaIosFun       } from '../platform/install.ts'; // What: Is-An iOS Function. Why: Only iOS keeps an installed app's storage apart from Safari's. How: This checks for an iPhone or iPad.
import { JoiGroCom       } from './join-group.tsx';       // What: Join Group Component. Why: An invite link has its own screen. How: The host shows it when the entry asks for it.
import { LanPagCom       } from './landing/page.tsx';     // What: Landing Page Component. Why: A phone with no identity meets Come Hang through its landing page. How: The host shows it when there's no identity.
import { LoaScrCom       } from './loading.tsx';          // What: Loading Screen Component. Why: Someone waiting on the groups should see the app is working. How: The host shows it while they load.
import { NotSheCom       } from './notices.tsx';          // What: Notice Sheet Component. Why: What happened while someone was away shows over whatever screen is up. How: The host shows it once the groups have loaded.
import { PasInvCom       } from './paste-invite.tsx';     // What: Paste Invite Component. Why: Joining with an invite link has its own screen. How: The host shows it when the entry asks for it.
import { safConFun       } from '../platform/install.ts'; // What: Safari Continue Function. Why: Someone who chose to carry on in Safari isn't stopped again. How: This reads the kept choice.
import { scrReaFun       } from '../ui/scroll-top.ts';    // What: Screen Ready Function. Why: A reload's scroll position can only be restored once the real screen has rendered. How: The host calls it once the groups have loaded.
import { shaEndFun       } from '../state/sharing.ts';    // What: Sharing End Function. Why: Sharing stops with a group that's gone. How: This ends it.
import { shaGetFun       } from '../state/sharing.ts';    // What: Sharing Get Function. Why: A current record is checked against the groups. How: This reads it.
import { shaResFun       } from '../state/sharing.ts';    // What: Sharing Resume Function. Why: Sharing kept from before a reload resumes as the app opens. How: This resumes it.
import { useCallback     } from 'react';                  // What: Use Callback. Why: The join screen's effects depend on what the host hands it, which shouldn't change on every render. How: This keeps the same functions between renders.
import { useEffect       } from 'react';                  // What: Use Effect. Why: The groups are watched while the host is shown, a group that's gone is forgotten once the watch drops it, and sharing is checked against the groups. How: This starts and stops the watch, clears the group, and checks sharing.
import { useLayoutEffect } from 'react';                  // What: Use Layout Effect. Why: The scroll hook should hear the screen is ready before the browser draws it. How: This runs right after the real screen commits.
import { useRef          } from 'react';                  // What: Use Reference. Why: Carrying on in Safari owes focus to the screen that follows. How: This holds whether it's owed.
import { useScrOpeFun    } from '../ui/screen.ts';        // What: Use Screen Open Function. Why: A created group opens, and so does the next group after one is left or deleted. How: This returns the function that opens a screen.
import { useScrStaFun    } from '../ui/screen.ts';        // What: Use Screen State Function. Why: The history entry says which screen to show. How: This reads it.
import { useState        } from 'react';                  // What: Use State. Why: The groups, the watch's restarts, a group that's gone, and the message about it change what shows. How: This holds each.


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
	const visGroArr = groRecArr?.filter( ( groRecObj ) => groRecObj.ideStr !== gonIdeStr ) ?? null; // What: Visible Group Array. Why: A group just left or deleted is gone to the member at once. How: This leaves it out of the groups, null while loading.

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



	const recGroFun = () : void => { // What: Recover Groups Function. Why: An identity brought back from Google comes with its groups, which the running watch didn't know of. How: This restarts the watch, announces the sign-in, and asks the next screen to take focus.


		setWatVerNum( ( preVerNum ) => preVerNum + 1 ); // What: Watch Restart Call. Why: The watch started before the identity came back. How: This starts a new run.

		setAnnMesStr( 'Signed in with Google.' ); // What: Announce Set Call. Why: The welcome's button goes with the sign-in. How: This says it worked.

		scrOpeFun( { focBoo : true, scrStr : 'group' }, true ); // What: Screen Replace Call. Why: The screen that follows, the first group or the welcome again, takes focus on its heading. How: This replaces the entry with one asking for focus.


	};



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
				focBoo={ scrStaObj?.focBoo === true && ( scrStaObj.groStr === undefined || curGroObj?.ideStr === scrStaObj.groStr ) } // What: Focus Request. Why: Only a group opened by a creation, a leave, a deletion, or getting groups back takes focus, and only the one the entry names, or the first, or the frame with no group, when it names none. How: This is true for the entry that change opened.
				groRecArr={ visGroArr }
				secNamStr={ scrStaObj?.groStr === undefined || scrStaObj.groStr === curGroObj?.ideStr ? scrStaObj?.secStr ?? 'chat' : 'chat' } // What: Section Name Choice. Why: The entry names the open section, and a group opened without one, or one that's gone, starts at its chat, which with no group is the welcome, while an entry naming no group, such as Settings opened before a first group arrived, keeps its section. How: This reads the entry's section when it's for the group shown or for none, else the chat.

				onGonFun={ gonGroFun }
				onRecFun={ recGroFun }
			/> // What: Group Frame Component. Why: Someone holding an identity sees the open group framed with the rest, or the frame's welcome with none. How: This shows the current group, or the welcome.


		);


	};



	return (


		<>{ /* What: Screen Host Fragment. Why: The screen changes while the status stays. How: This groups them without adding an element. */ }


			{ scrPicFun() }{ /* What: Screen Pick Call. Why: The entry and the groups decide the screen. How: This renders the one they call for. */ }



			{ !iosGatBoo && groRecArr !== null && <NotSheCom watVerNum={ watVerNum } /> }{ /* What: Notice Sheet Condition. Why: Notices open over a real screen, not the install steps or the wait, and the sheet's watch restarts with the groups' for an identity just made. How: This shows the sheet once the groups have loaded, outside the install screen. */ }



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


