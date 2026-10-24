


// #region Imports

import reaPluObj from 'eslint-plugin-react';       // What: React Plugin Object. Why: An undefined component in a JSX tag should fail lint. How: This registers the plugin behind react/jsx-no-undef.
import rehPluObj from 'eslint-plugin-react-hooks'; // What: React-Hooks Plugin Object. Why: Hook calls follow rules plain JS linting can't check. How: Its recommended rules are spread into the hooks config.
import tyeEslObj from 'typescript-eslint';         // What: TypeScript ESLint Object. Why: ESLint's default parser can't read TypeScript's type annotations. How: Its recommended rules are spread into the config, and its parser is set on both configs below.

// #endregion Imports



/**
 * eslint.config.ts = ESLint Config
 *
 * @summary
 * The lint config, reading every file through typescript-eslint's parser so
 * type annotations parse, with typescript-eslint's recommended rules on for
 * every file, letting a binding beside a rest element go unread and a
 * destructuring that reassigns some of its bindings stay let. Every .ts and
 * .tsx file under src/ is checked by react/jsx-no-undef, which catches a
 * component reference a rename missed. ESLint's own no-undef is left off, as
 * typescript-eslint recommends, since TypeScript already reports every
 * undefined name and no-undef can't see TypeScript's type-only names. Every
 * .tsx file, and every .ts file under src/ (where a custom hook can live
 * without JSX), also gets the React Hooks plugin's recommended rules, minus
 * the four React Compiler readiness rules, which only matter to an app built
 * with the React Compiler, which this one isn't. Tests stay out, since
 * Playwright's test.use reads as React's use. Generated output, such as the
 * build folder, is ignored. npm run lint runs it across the repo, and an
 * editor integration can run it per file. Adapted from ease-my-life's own
 * config.
 *
 * Sections:
 *  - Constants
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

const ESL_CON_ARR = [ // What: ESLint Config Array. Why: ESLint reads its flat config as an array of objects, each scoped to the files it lists. How: This holds the generated-output ignore, typescript-eslint's recommended configs and two rule overrides, the src/ undefined-component config, and the hooks config.


	{ ignores : [ 'dist/**', 'tests/output/**' ] }, // What: Ignores Object. Why: The build output and the test suites' reports are generated, not hand-written, so their lint results mean nothing. How: This global ignores entry skips both folders for every config below; one glob each, since braces break ESLint's matching here.
	...tyeEslObj.configs.recommended,               // What: Recommended Configs Spread. Why: typescript-eslint's recommended rules catch TypeScript mistakes the compiler allows, such as an unused variable. How: This spreads its recommended configs in, whose parser and rules apply to every file ESLint lints, while the one that switches off the core rules TypeScript already covers applies to TypeScript files only.

	{ // What: Rule Overrides Object. Why: Two recommended rules flag patterns the formatting rules rely on. How: This re-sets both rules with an option that allows those patterns.


		rules : { // What: Rules. Why: Each override keeps its rule on, just with one option changed. How: This holds both overrides.


			'@typescript-eslint/no-unused-vars' : [ 'error', { ignoreRestSiblings : true } ], // What: Unused Vars Rule. Why: Dropping a field from a copy by destructuring it away beside a rest element leaves that binding unread on purpose. How: This lets a binding next to a rest element go unread.
			'prefer-const'                      : [ 'error', { destructuring : 'all' } ]      // What: Prefer Const Rule. Why: A destructuring that reassigns some of its bindings has to use let for all of them, since one declaration can't mix const and let. How: This only asks for const when every binding in the destructuring could be one.


		}


	},

	{ // What: Source Config Object. Why: A component reference a rename missed should fail lint everywhere under src/. How: This turns on react/jsx-no-undef for every .ts and .tsx file there.


		files   : [ 'src/**/*.ts', 'src/**/*.tsx' ],  // What: Files. Why: Only the app's own source is linted by these rules. How: This lists one glob per extension.
		plugins : { react : reaPluObj },              // What: Plugins. Why: react/jsx-no-undef comes from the React plugin. How: This registers it.
		rules   : { 'react/jsx-no-undef' : 'error' }, // What: Rules. Why: An undefined component in a JSX tag is always a bug, and TypeScript reports every other undefined name. How: This makes the JSX rule an error.

		languageOptions : { // What: Language Options. Why: The parser has to know the syntax the source uses. How: This sets the TypeScript parser and modern module syntax with JSX.


			ecmaVersion   : 'latest',                          // What: Ecma Version. Why: The source uses current JavaScript syntax. How: This parses the latest version.
			parser        : tyeEslObj.parser,                  // What: Parser. Why: The source is TypeScript, which ESLint's default parser can't read. How: This sets typescript-eslint's parser.
			parserOptions : { ecmaFeatures : { jsx : true } }, // What: Parser Options. Why: The .tsx files contain JSX. How: This turns on JSX parsing.
			sourceType    : 'module'                           // What: Source Type. Why: Every source file is an ES module. How: This parses import and export.


		}


	},

	{ // What: Hooks Config Object. Why: Hook calls in components and custom hooks follow rules of their own. How: This adds the React Hooks recommended rules for every .tsx file and every .ts file under src/.


		files   : [ '**/*.tsx', 'src/**/*.ts' ],                    // What: Files. Why: Hooks live in every component file and in custom hooks under src/ written without JSX, while tests stay out, since Playwright's test.use reads as React's use. How: This matches every .tsx file plus the .ts files under src/, as two globs, since braces break ESLint's matching here.
		plugins : { react : reaPluObj, 'react-hooks' : rehPluObj }, // What: Plugins. Why: The hooks rules come from the React Hooks plugin. How: This registers it beside the React plugin.

		languageOptions : { // What: Language Options. Why: These files are TypeScript, the .tsx ones with JSX. How: This sets the TypeScript parser and turns on JSX parsing.


			parser        : tyeEslObj.parser,                 // What: Parser. Why: ESLint's default parser can't read TypeScript. How: This sets typescript-eslint's parser.
			parserOptions : { ecmaFeatures : { jsx : true } } // What: Parser Options. Why: The .tsx files contain JSX. How: This turns on JSX parsing, which typescript-eslint applies by file extension, so the .ts files still parse without it.


		},

		rules : { // What: Rules. Why: The plugin's recommended set is the standard hooks checks, but four of its rules only judge whether a component suits the React Compiler, which this app doesn't use. How: This spreads the recommended set in, then turns those four off.


			...rehPluObj.configs.recommended.rules, // What: Recommended Rules Spread. Why: These are the standard hooks checks, such as exhaustive-deps. How: This spreads the plugin's recommended set in first, so the overrides below win.

			'react-hooks/preserve-manual-memoization' : 'off', // What: Preserve Manual Memoization Rule. Why: It only reports where the compiler would skip a component. How: This turns it off.
			'react-hooks/purity'                      : 'off', // What: Purity Rule. Why: It flags impure calls the compiler can't place, including ones that only run in event handlers. How: This turns it off.
			'react-hooks/refs'                        : 'off', // What: Refs Rule. Why: It flags refs read or written during render, a check aimed at whether the compiler can handle a component. How: This turns it off.
			'react-hooks/set-state-in-effect'         : 'off'  // What: Set State In Effect Rule. Why: Syncing or measuring into state inside an effect is a working React pattern that only costs an extra render outside the compiler. How: This turns it off.


		}


	}


];

// #endregion Constants



// #region Exports

export default ESL_CON_ARR; // What: Default Export. Why: ESLint reads its config from this file's default export. How: This exports ESL_CON_ARR.

// #endregion Exports


