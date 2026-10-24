


// #region Imports

import { defineConfig  } from '@playwright/test'; // What: Define Config. Why: Playwright's config helper passes the config through with its types. How: This wraps the exported config object.
import { fileURLToPath } from 'node:url';         // What: File URL To Path. Why: The dev server has to start from the repo root, one folder above this file. How: This turns that folder's URL into a path for webServer.cwd.

// #endregion Imports



/**
 * playwright.config.ts = Playwright Config
 *
 * @summary
 * The config behind npm test and its suites, each run against the real app in
 * all three of Playwright's engines (Chromium, Firefox, and WebKit), one
 * project per suite and engine, since a check that passes in one engine proves
 * nothing about the others. Chromium runs as Chrome's full headless mode
 * rather than Playwright's headless shell. Each suite is a folder under
 * tests/, such as accessibility, which the pre-commit check runs. Playwright
 * starts the Vite dev server on port 5198 for the run and stops it
 * afterwards, so a dev server already running on the usual 5173, or a sibling
 * project's suites on 5190 through 5197, are never touched. Reports and
 * failure screenshots land in tests/output, which git ignores.
 *
 * Sections:
 *  - Constants
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const ENG_NAM_ARR = [ // What: Engine Name Array. Why: Every suite runs in all three engines. How: Each entry is a Playwright browser name, crossed with each suite into one project apiece. // What: Type Assertion Note. Why: Each name has to type as one of Playwright's browser names, not a plain string. How: The closing as const keeps each entry's literal type for the projects' browserName.


	'chromium', // What: Chromium Engine. Why: Chrome and Edge render with it. How: This is Playwright's Chromium build.
	'firefox',  // What: Firefox Engine. Why: Firefox renders with its own engine, Gecko. How: This is Playwright's Firefox build.
	'webkit'    // What: WebKit Engine. Why: Safari, and every browser on iOS, renders with it. How: This is Playwright's WebKit build.


] as const;

const ROO_DIR_STR = fileURLToPath( new URL( '..', import.meta.url ) ); // What: Root Directory String. Why: The dev server must run from the repo root, where vite.config.ts lives. How: This resolves the folder above tests/.
const SER_URL_STR = 'http://localhost:5198';                           // What: Server URL String. Why: Every suite opens the app from the same dev server. How: This is the address Playwright waits on and every page's baseURL.

const SUI_NAM_ARR = [ // What: Suite Name Array. Why: Each suite lives in its own folder and runs as its own projects. How: Each entry names a folder under tests/, crossed with each engine into one project apiece.


	'accessibility', // What: Accessibility Suite. Why: The pre-commit accessibility scan runs from here. How: This names tests/accessibility.
	'interaction'    // What: Interaction Suite. Why: How moving between pages and using controls behaves is checked from here. How: This names tests/interaction.


];

const PLA_CON_OBJ = defineConfig({ // What: Playwright Config Object. Why: Playwright reads its whole setup from this file's default export. How: This holds the shared page settings, one project per suite and engine, the reporters, and the dev server.


	fullyParallel : false,            // What: Fully Parallel. Why: Each spec file walks its states in order. How: This keeps a file's tests running in sequence, while separate files may still run in parallel.
	outputDir     : 'output/results', // What: Output Directory. Why: Failure screenshots and traces need a home git ignores. How: This writes them under tests/output/results.
	testDir       : '.',              // What: Test Directory. Why: Each project picks its own folder below. How: This roots test discovery at tests/.
	workers       : 3,                // What: Workers. Why: The engines are independent, but each worker drives a full browser. How: This runs up to three spec files at once.

	projects : SUI_NAM_ARR.flatMap( ( suiNamStr ) => ENG_NAM_ARR.map( ( engNamStr ) => ({ // What: Projects. Why: Each suite runs on its own in each engine. How: This crosses every suite with every engine into a project named after both, runnable alone with --project.


		name      : `${ suiNamStr }-${ engNamStr }`, // What: Name. Why: A failure has to say which suite and engine it came from. How: This names the project after both.
		testMatch : `${ suiNamStr }/**/*.spec.ts`,   // What: Test Match. Why: Each suite lives in its own folder. How: This runs every spec in the suite's folder under tests/.

		use : { // What: Use. Why: The project has to launch its own engine. How: This sets the browser it runs in, and Chromium's channel.


			browserName : engNamStr,                                        // What: Browser Name. Why: Each project runs in one engine. How: This names that engine's Playwright browser.
			channel     : engNamStr === 'chromium' ? 'chromium' : undefined // What: Channel. Why: Chromium's default headless shell sometimes opened a modified click's new tab without Playwright ever reporting it, failing about 1 run in 10 in reese-roofing. How: This runs Chromium as Chrome's full headless mode instead, and leaves Firefox and WebKit on their only builds.


		}


	}) ) ),

	reporter : [ // What: Reporter. Why: A run needs a live summary in the terminal and a browsable report afterwards. How: This prints a line per test and writes an HTML report to tests/output/report.


		[ 'list' ],                                                    // What: List Reporter. Why: The terminal shows each test as it finishes. How: This is Playwright's list reporter.
		[ 'html', { open : 'never', outputFolder : 'output/report' } ] // What: HTML Reporter. Why: A failure is easier to read with its screenshot and trace. How: This writes the report to tests/output/report without opening a browser.


	],

	use : { // What: Use. Why: Every suite shares the same page setup. How: This sets the base URL, locale, and failure artifacts.


		baseURL    : SER_URL_STR,        // What: Base URL. Why: Specs navigate with short paths. How: This points every page.goto at the dev server.
		locale     : 'en-US',            // What: Locale. Why: The app is written in US English. How: This runs every page in it.
		screenshot : 'only-on-failure',  // What: Screenshot. Why: A failing check is easier to diagnose from what was on screen. How: This saves a screenshot only when a test fails.
		trace      : 'retain-on-failure' // What: Trace. Why: A failure can be stepped through afterwards. How: This keeps the Playwright trace only for failing tests.


	},

	webServer : { // What: Web Server. Why: The suites need the app running, without touching any dev server already open. How: This starts Vite on its own strict port from the repo root and stops it when the run ends.


		command             : 'npx vite --port 5198 --strictPort', // What: Command. Why: A strict port fails loudly instead of drifting onto another server's port. How: This starts the Vite dev server on 5198.
		cwd                 : ROO_DIR_STR,                         // What: Current Working Directory. Why: Vite reads its config from the repo root. How: This starts the command there.
		reuseExistingServer : false,                               // What: Reuse Existing Server. Why: A leftover server could be running other code. How: This always starts a fresh one.
		timeout             : 60000,                               // What: Timeout. Why: The first start can take a while on a cold cache. How: This waits up to a minute for the server to answer.
		url                 : SER_URL_STR                          // What: URL. Why: Playwright starts the tests only once the app answers. How: This is the address it polls.


	}


});

// #endregion Constants



// #region Exports

export default PLA_CON_OBJ; // What: Default Export. Why: Playwright reads its config from this file's default export. How: This exports PLA_CON_OBJ.

// #endregion Exports


