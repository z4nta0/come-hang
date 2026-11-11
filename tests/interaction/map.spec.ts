


// #region Imports

import { docReaFun                 } from '../support/client.ts';         // What: Document Read Function. Why: A share is checked in Firestore. How: This reads documents past the rules.
import { expect                    } from '@playwright/test';             // What: Expect. Why: Each check passes only when the Map section does what it should. How: This asserts on what each check reads.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'; // What: Initialize Test Environment. Why: The checks read Firestore past the rules. How: This connects to the emulator.
import { memSetFun                 } from '../support/client.ts';         // What: Member Setup Function. Why: The map shows one member to another. How: This creates the group and lets the member in.
import { pagTesObj                 } from '../support/client.ts';         // What: Page Test Object. Why: The member shares from a device of their own. How: This declares a test with a second page.
import { runPagFun                 } from '../support/client.ts';         // What: Run Page Function. Why: Groups and events are made the way the app makes them. How: This calls the app's functions in a page.
import { senPolFun                 } from '../support/client.ts';         // What: Send Poll Function. Why: A new member's first post can meet the old mirror for a moment. How: This sends a message until it lands, so later posts don't.
import { test                      } from '@playwright/test';             // What: Test. Why: Each behavior is its own test. How: This declares them.


import type { Page                 } from '@playwright/test';             // What: Page. Why: The helpers drive a page. How: This types it.
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'; // What: Rules Test Environment. Why: The checks read through one. How: This types it.
import type { Timestamp            } from 'firebase/firestore';           // What: Timestamp. Why: A share's update time is read back. How: This types it.

// #endregion Imports



/**
 * map.spec.ts = Map Spec
 *
 * @summary
 * Checks the Map section as people use it, in whichever engine the project
 * runs, against the Emulator Suite: outside an event's window it says when
 * sharing opens, or that no event is coming; within one, a member and the
 * owner share, each seeing the other's distance, direction, freshness, and
 * a link to Google Maps, with the plot drawn around them; saying "I'm on my
 * way" and "I've arrived" posts lines to the chat, marks the share, and
 * moves focus to the note that replaces each button; stopping removes the
 * share; blocked location says what to do; a reload resumes sharing with a
 * fresh fix while keeping what was said; and a member removed while sharing
 * stops sharing with the group.
 *
 * Sections:
 *  - Constants
 *  - Module State
 *  - Helpers
 *  - Module Init
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const EVE_MOD_STR = '/src/state/events.ts'; // What: Events Module String. Why: Sharing belongs to an event. How: This names its path.
const HOU_MIL_NUM = 3600000;                // What: Hour Milliseconds Number. Why: Event times are set in hours. How: This is one hour in milliseconds.

// #endregion Constants



// #region Module State

let mapEnvObj : RulesTestEnvironment; // What: Map Environment Object. Why: The checks read Firestore through it. How: This is set before the first test.

// #endregion Module State



// #region Helpers

const eveCreFun = async ( pagValObj : Page, groIdeStr : string, staOffNum : number, endOffNum : number ) : Promise< void > => { await runPagFun( pagValObj, EVE_MOD_STR, 'eveCreFun', groIdeStr, { desTexStr : '', endTimNum : Date.now() + endOffNum, locTexStr : '', staTimNum : Date.now() + staOffNum, titTexStr : 'Picnic' } ); }; // What: Event Create Function. Why: Sharing is bound by an event's times. How: This plans a picnic in a page, starting and ending the given milliseconds from now.



const posSetFun = async ( pagValObj : Page, latNum : number, lngNum : number ) : Promise< void > => { // What: Position Set Function. Why: A member's device reports where it is. How: This grants geolocation to the page's context and sets its position.


	await pagValObj.context().grantPermissions( [ 'geolocation' ] ); // What: Permission Call. Why: Sharing needs the position. How: This grants it.

	await pagValObj.context().setGeolocation( { accuracy : 10, latitude : latNum, longitude : lngNum } ); // What: Position Call. Why: The device reports this fix. How: This sets it, 10 meters accurate.


};



const secOpeFun = async ( curPagObj : Page, secNamStr : string ) : Promise< void > => { // What: Section Open Function. Why: The tests move between the Map and the chat. How: This presses the section's tab and waits for its heading.


	await curPagObj.getByRole( 'navigation', { name : 'Group sections' } ).getByRole( 'button', { name : secNamStr } ).click(); // What: Tab Click Call. Why: A section opens from its tab. How: This presses it.

	await expect( curPagObj.getByRole( 'heading', { exact : true, level : 2, name : secNamStr } ) ).toBeAttached(); // What: Section Wait. Why: The section has to show before it's used. How: This waits for its heading, which the chat hides from sight.


};

// #endregion Helpers



// #region Module Init

test.beforeAll( async () => { // What: Setup Hook. Why: The tests share one connection to the emulator. How: This connects to Firestore under the demo project.


	mapEnvObj = await initializeTestEnvironment({ // What: Environment Assignment. Why: The checks read through it. How: This connects to Firestore, where the pages write.


		firestore : { host : '127.0.0.1', port : 8200 }, // What: Firestore Options. Why: The documents are read from there. How: This names the address firebase.json gives its emulator.
		projectId : 'demo-come-hang'                     // What: Project Identifier. Why: The dev server's app uses this demo project. How: This names it.


	});


} );



test.afterAll( async () => { // What: Teardown Hook. Why: The connection should close with the suite. How: This cleans it up.


	await mapEnvObj.cleanup(); // What: Cleanup Call. Why: The connection closes. How: This cleans it up.


} );



test( "outside an event's window the map says when sharing opens, or that no event is coming", async ( { page : curPagObj } ) => { // What: Closed Window Test. Why: Sharing opens only 3 hours before an event starts (Section 5). How: This opens the map with no event, then with one 5 hours off, checking each note and that nothing offers sharing.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned for the group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj, 'Map' ); // What: Map Open Call. Why: The checks are in the Map section. How: This opens it.

	await expect( curPagObj.getByText( 'No event is coming up. Plan one in Events, and sharing opens 3 hours before it starts.' ) ).toBeVisible(); // What: No Event Assertion. Why: With nothing planned there's nothing to share for. How: This waits for the note.

	await eveCreFun( curPagObj, groIdeStr, 5 * HOU_MIL_NUM, 6 * HOU_MIL_NUM ); // What: Event Create Call. Why: An event 5 hours off isn't open yet. How: This plans it.

	await curPagObj.reload(); // What: Reload Call. Why: The map reads the events as it opens. How: This opens the app afresh.

	await secOpeFun( curPagObj, 'Map' ); // What: Map Reopen Call. Why: The reload opens the group at its chat. How: This opens the map again.

	await expect( curPagObj.getByText( 'Sharing opens 3 hours before Picnic starts, on ', { exact : false } ) ).toBeVisible(); // What: Opens Assertion. Why: The member should know when they can share. How: This waits for the note naming the event.
	await expect( curPagObj.getByRole( 'button', { name : 'Share my location' } ) ).toHaveCount( 0 );                             // What: No Share Assertion. Why: Sharing isn't offered before the window. How: This expects no button.


} );



pagTesObj( "members share, see each other, and post that they're on their way and have arrived, focus landing on each note", async ( { page : curPagObj, secPagObj } ) => { // What: Sharing Test. Why: On the day, members find each other and tell the group when they leave and arrive (Section 10). How: This shares as the member and the owner, checks each other's rows and the plot, posts both statuses as the member, checking the focus, the owner's chat, and the badge, then stops sharing.


	pagTesObj.setTimeout( 90000 ); // What: Timeout Call. Why: The test runs two phones, two shares, two posts, and the chat. How: This allows a minute and a half.

	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr } = await memSetFun( mapEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The event belongs to the group. How: This creates the group with an owner and a member. // What: UID Member String. Why: The member's share is read back. How: This takes it from the setup.


	await eveCreFun( curPagObj, groIdeStr, -HOU_MIL_NUM, 2 * HOU_MIL_NUM ); // What: Event Create Call. Why: Sharing needs an event under way. How: This plans one that started an hour ago.

	await senPolFun( secPagObj, groIdeStr, 'Hi' ); // What: First Send Call. Why: The member's posts need the mirror to hold them. How: This sends until a message lands.

	await posSetFun( secPagObj, 51.509, -0.12 ); // What: Member Position Call. Why: The member is about a kilometer north of the owner. How: This places their device.

	await posSetFun( curPagObj, 51.5, -0.12 ); // What: Owner Position Call. Why: The owner is the member's point of reference. How: This places their device.

	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member shares from their own device. How: This opens the app on it.

	await secOpeFun( secPagObj, 'Map' ); // What: Member Map Call. Why: Sharing is in the Map section. How: This opens it.


	const arrButObj = secPagObj.getByRole( 'button', { name : "I've arrived" } );      // What: Arrive Button Object. Why: The member arrives later. How: This finds the button.
	const shaButObj = secPagObj.getByRole( 'button', { name : 'Share my location' } ); // What: Share Button Object. Why: The member opts in. How: This finds the button.
	const wayButObj = secPagObj.getByRole( 'button', { name : "I'm on my way" } );    // What: Way Button Object. Why: The member says they're leaving. How: This finds the button.


	await expect( secPagObj.getByRole( 'heading', { level : 3, name : 'Picnic' } ) ).toBeVisible(); // What: Event Assertion. Why: The map belongs to the open event. How: This waits for its heading.
	await expect( secPagObj.getByText( 'Only the group can see it', { exact : false } ) ).toBeVisible(); // What: Note Assertion. Why: The member is told how sharing works before they share (Section 10). How: This waits for the note.

	await shaButObj.click(); // What: Share Click Call. Why: The member shares. How: This presses the button.

	await expect( secPagObj.getByRole( 'main' ).getByRole( 'status' ) ).toHaveText( "You're sharing your location with Beach Day." ); // What: Sharing Status Assertion. Why: The start is announced. How: This reads the status.
	await expect( secPagObj.getByRole( 'button', { name : 'Stop sharing' } ) ).toBeFocused();                                       // What: Toggle Focus Assertion. Why: The one button keeps focus as its label changes. How: This expects it focused.
	await expect( secPagObj.getByText( 'Share your location to see how far away everyone is.' ) ).toHaveCount( 0 );               // What: Plot Shown Assertion. Why: Sharing centers the plot on the member. How: This expects the note gone.

	await curPagObj.goto( '/' ); // What: Owner Open Call. Why: The owner sees the member, then shares too. How: This opens the app.

	await secOpeFun( curPagObj, 'Map' ); // What: Owner Map Call. Why: The owner looks at the map. How: This opens it.


	const memRowObj = curPagObj.getByRole( 'listitem' ).filter( { hasText : 'Dana Lee' } ); // What: Member Row Object. Why: The owner reads the member's row. How: This finds it.


	await expect( memRowObj ).toContainText( 'updated just now' );                                          // What: Fresh Row Assertion. Why: A share says how old it is. How: This expects it fresh.
	await expect( curPagObj.getByText( 'Share your location to see how far away everyone is.' ) ).toBeVisible(); // What: Not Sharing Note Assertion. Why: Without the owner's own share there's nothing to measure from. How: This waits for the note.

	await curPagObj.getByRole( 'button', { name : 'Share my location' } ).click(); // What: Owner Share Click Call. Why: The owner shares too. How: This presses the button.

	await expect( memRowObj ).toContainText( '0.6 mi north · updated' );                                                                             // What: Distance Assertion. Why: The owner sees how far and which way the member is. How: This expects about a kilometer north.
	await expect( curPagObj.getByRole( 'img', { name : 'Everyone sharing', exact : false } ) ).toBeVisible();                                        // What: Plot Assertion. Why: The plot is drawn around the owner. How: This waits for it.
	await expect( curPagObj.getByText( 'The outer ring is 0.6 mi from you.' ) ).toBeVisible();                                                       // What: Scale Assertion. Why: The ring's distance follows the farthest member. How: This reads the caption.
	await expect( memRowObj.getByRole( 'link', { name : 'Open in Google Maps for Dana Lee' } ) ).toHaveAttribute( 'href', /query=51\.509,-0\.12$/ ); // What: Link Assertion. Why: The member's spot opens in Google Maps. How: This expects their coordinates in its address.
	await expect( memRowObj.getByRole( 'link' ) ).toHaveAttribute( 'rel', 'noopener noreferrer' );                                                   // What: Link Safety Assertion. Why: A new tab mustn't reach back. How: This expects the link's rel.

	expect( await curPagObj.evaluate( () => document.documentElement.scrollHeight - window.innerHeight ) ).toBeLessThanOrEqual( 0 ); // What: No Page Scroll Assertion. Why: A row's hidden link text once stretched the page below the app while someone shared. How: This expects the page no taller than the screen.

	await wayButObj.click(); // What: Way Click Call. Why: The member leaves for the event. How: This presses the button.

	await expect( secPagObj.getByText( "You've told the group you're on the way." ) ).toBeFocused(); // What: Way Note Focus Assertion. Why: The note replaces the pressed button. How: This expects it focused.
	await expect( wayButObj ).toHaveCount( 0 );                                                      // What: Way Gone Assertion. Why: Leaving is said once. How: This expects no button.

	await arrButObj.click(); // What: Arrive Click Call. Why: The member arrives. How: This presses the button.

	await expect( secPagObj.getByText( "You've told the group you've arrived." ) ).toBeFocused(); // What: Arrive Note Focus Assertion. Why: The note replaces the pressed button. How: This expects it focused.
	await expect( secPagObj.getByRole( 'main' ).getByRole( 'status' ) ).toHaveText( "Posted to the chat that you've arrived." ); // What: Arrived Status Assertion. Why: The post is announced. How: This reads the status.
	await expect( memRowObj ).toContainText( 'Arrived' );                                          // What: Badge Assertion. Why: The owner sees the arrival on the map. How: This waits for the badge.

	await secOpeFun( curPagObj, 'Chat' ); // What: Owner Chat Call. Why: The posts go to the chat. How: This opens it.

	await expect( curPagObj.getByRole( 'log' ) ).toContainText( 'Dana Lee is on the way' ); // What: Way Line Assertion. Why: The group sees the member leave without opening the map. How: This waits for the line.
	await expect( curPagObj.getByRole( 'log' ) ).toContainText( 'Dana Lee arrived' );       // What: Arrive Line Assertion. Why: The group sees the member arrive. How: This waits for the line.

	await secOpeFun( secPagObj, 'Chat' ); // What: Member Chat Call. Why: The member sees their own posts too. How: This opens their chat.

	await expect( secPagObj.getByRole( 'log' ) ).toContainText( "You're on the way" ); // What: Own Way Line Assertion. Why: The member's own line names them as "You". How: This waits for it.

	await secOpeFun( secPagObj, 'Map' ); // What: Member Map Return Call. Why: Sharing kept running across sections. How: This opens the map again.

	await secPagObj.getByRole( 'button', { name : 'Stop sharing' } ).click(); // What: Stop Click Call. Why: The member stops sharing. How: This presses the button.

	await expect( secPagObj.getByRole( 'main' ).getByRole( 'status' ) ).toHaveText( "You've stopped sharing your location." ); // What: Stopped Status Assertion. Why: The stop is announced. How: This reads the status.
	await expect.poll( () => docReaFun( mapEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidMemStr }` ) ).toBeUndefined();   // What: Share Deleted Assertion. Why: Stopping deletes the share at once (Section 11.4). How: This waits for it to go.


} );



test( 'blocked location says what to do, and the member stays not sharing', async ( { page : curPagObj } ) => { // What: Blocked Test. Why: A member who blocked location should learn how to allow it. How: This stands in a geolocation that refuses, then presses the share, checking the alert and the button.


	await curPagObj.addInitScript( () => { // What: Geolocation Stand-In Call. Why: No engine lets a script answer the location prompt alike. How: This replaces the one-time request with one that refuses as blocked.


		navigator.geolocation.getCurrentPosition = ( _resValFun, rejValFun ) => rejValFun?.( { code : 1, message : 'User denied Geolocation', PERMISSION_DENIED : 1, POSITION_UNAVAILABLE : 2, TIMEOUT : 3 } ); // What: Refusing Request Stand-In. Why: The app asks there. How: This answers with a blocked error.


	} );

	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string; // What: Group Identifier String. Why: The event is planned for the group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.


	await eveCreFun( curPagObj, groIdeStr, HOU_MIL_NUM, 2 * HOU_MIL_NUM ); // What: Event Create Call. Why: Sharing is open within 3 hours of the start. How: This plans one starting in an hour.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj, 'Map' ); // What: Map Open Call. Why: Sharing is in the Map section. How: This opens it.


	const shaButObj = curPagObj.getByRole( 'button', { name : 'Share my location' } ); // What: Share Button Object. Why: The press and the button after it are checked. How: This finds it.


	await shaButObj.click(); // What: Share Click Call. Why: The member tries to share. How: This presses the button.

	await expect( curPagObj.getByRole( 'alert' ) ).toHaveText( "Location is blocked for Come Hang. Allow it in your browser's settings, then try again." ); // What: Blocked Alert Assertion. Why: The member should learn how to allow it. How: This reads the alert.
	await expect( shaButObj ).toBeFocused();                                                                                                              // What: Kept Focus Assertion. Why: The button stays to try again. How: This expects it still focused.


} );



test( 'a reload resumes sharing with a fresh fix and keeps what the member said', async ( { page : curPagObj } ) => { // What: Resume Test. Why: Opening the app sends a fresh fix while sharing (Section 10). How: This shares and posts leaving, reloads, then checks the button, the note, and that the share was sent again.


	await curPagObj.goto( '/' ); // What: Page Load Call. Why: The page needs the app's modules. How: This opens the app.


	const groIdeStr = await runPagFun( curPagObj, '/src/state/groups.ts', 'groCreFun', 'Beach Day', 'Alice' ) as string;     // What: Group Identifier String. Why: The event is planned for the group. How: This creates it. // What: Type Assertion Note. Why: groCreFun resolves with the ID. How: The as reads it as a string.
	const uidValStr = ( await runPagFun( curPagObj, '/src/state/identity.ts', 'ideEnsFun' ) as { uidValStr : string } ).uidValStr; // What: UID Value String. Why: The share is read by the member's UID. How: This reads it. // What: Type Assertion Note. Why: ideEnsFun resolves with the identity's record. How: The as reads its UID.


	await eveCreFun( curPagObj, groIdeStr, HOU_MIL_NUM, 2 * HOU_MIL_NUM ); // What: Event Create Call. Why: Sharing is open within 3 hours of the start. How: This plans one starting in an hour.

	await senPolFun( curPagObj, groIdeStr, 'Hi' ); // What: First Send Call. Why: A new group's posts need the mirror to hold its owner. How: This sends until a message lands.

	await posSetFun( curPagObj, 51.5, -0.12 ); // What: Position Call. Why: The member's device has a position. How: This places it.

	await curPagObj.goto( '/' ); // What: App Open Call. Why: The app shows the new group. How: This opens it.

	await secOpeFun( curPagObj, 'Map' ); // What: Map Open Call. Why: Sharing is in the Map section. How: This opens it.

	await curPagObj.getByRole( 'button', { name : 'Share my location' } ).click(); // What: Share Click Call. Why: The member shares. How: This presses the button.

	await curPagObj.getByRole( 'button', { name : "I'm on my way" } ).click(); // What: Way Click Call. Why: The member says they're leaving. How: This presses the button.

	await expect( curPagObj.getByText( "You've told the group you're on the way." ) ).toBeFocused(); // What: Way Note Assertion. Why: The post landed. How: This waits for its note.


	const firTimNum = ( ( await docReaFun( mapEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ) )?.updatedAt as Timestamp ).toMillis(); // What: First Time Number. Why: The resumed share has to be newer. How: This reads the share's update time. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.


	await curPagObj.waitForTimeout( 1000 ); // What: Gap Wait. Why: The resumed fix's time has to differ from the first. How: This waits a second.

	await curPagObj.reload(); // What: Reload Call. Why: Reopening the app resumes sharing. How: This opens the app afresh.

	await secOpeFun( curPagObj, 'Map' ); // What: Map Reopen Call. Why: The reload opens the group at its chat. How: This opens the map again.

	await expect( curPagObj.getByRole( 'button', { name : 'Stop sharing' } ) ).toBeVisible();                 // What: Resumed Assertion. Why: The member is still sharing. How: This waits for the stop.
	await expect( curPagObj.getByText( "You've told the group you're on the way." ) ).toBeVisible();          // What: Kept Note Assertion. Why: What the member said stays. How: This waits for the note.
	await expect( curPagObj.getByRole( 'button', { name : "I'm on my way" } ) ).toHaveCount( 0 );               // What: No Way Assertion. Why: Leaving isn't offered twice. How: This expects no button.
	await expect.poll( async () => ( ( await docReaFun( mapEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidValStr }` ) )?.updatedAt as Timestamp ).toMillis() ).toBeGreaterThan( firTimNum ); // What: Fresh Fix Assertion. Why: Opening the app sends a fresh fix. How: This waits for a newer update. // What: Type Assertion Note. Why: The rules store it as a timestamp. How: The as reads it as one.


} );

pagTesObj( 'a member removed while sharing stops sharing with the group', async ( { page : curPagObj, secPagObj } ) => { // What: Removal Test. Why: Sharing stops with a group the member loses (Section 5). How: This shares as the member, has the owner remove them, then waits for the member's share to go.


	await curPagObj.goto( '/' ); // What: Owner Page Load Call. Why: The owner's device needs the app's modules. How: This opens the app.


	const { groIdeStr, uidMemStr } = await memSetFun( mapEnvObj, curPagObj, secPagObj ); // What: Group Identifier String. Why: The event belongs to the group. How: This creates the group with an owner and a member. // What: UID Member String. Why: The member is removed and their share read back. How: This takes it from the setup.


	await eveCreFun( curPagObj, groIdeStr, -HOU_MIL_NUM, 2 * HOU_MIL_NUM ); // What: Event Create Call. Why: Sharing needs an event under way. How: This plans one that started an hour ago.

	await posSetFun( secPagObj, 51.5, -0.12 ); // What: Member Position Call. Why: The member's device has a position. How: This places it.

	await secPagObj.goto( '/' ); // What: Member Open Call. Why: The member shares from their own device. How: This opens the app on it.

	await secOpeFun( secPagObj, 'Map' ); // What: Member Map Call. Why: Sharing is in the Map section. How: This opens it.

	await secPagObj.getByRole( 'button', { name : 'Share my location' } ).click(); // What: Share Click Call. Why: The member shares. How: This presses the button.

	await expect( secPagObj.getByRole( 'button', { name : 'Stop sharing' } ) ).toBeVisible(); // What: Sharing Assertion. Why: The share has to start before the removal. How: This waits for the stop.

	await runPagFun( curPagObj, '/src/state/members.ts', 'memRemFun', groIdeStr, uidMemStr ); // What: Removal Call. Why: The owner removes the member. How: This removes them as the app does.

	await expect.poll( () => docReaFun( mapEnvObj, `groups/${ groIdeStr }/liveLocations/${ uidMemStr }` ), { timeout : 15000 } ).toBeUndefined(); // What: Share Gone Assertion. Why: The group stops seeing a member it removed rather than waiting for the share to expire. How: This waits for the member's device to delete it.


} );

// #endregion Module Init


