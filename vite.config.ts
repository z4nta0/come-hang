


// #region Imports

import reaPluFun from '@vitejs/plugin-react'; // What: React Plugin Function. Why: Vite needs the React plugin to compile JSX. How: This is called first in the plugins array.


import { createElement        } from 'react';             // What: Create Element. Why: A legal document has to become an element before it can be rendered to HTML. How: This is called in legPagFun's page step.
import { defineConfig         } from 'vite';              // What: Define Config. Why: Vite's config helper passes the config through with its types. How: This wraps VIT_CON_OBJ.
import { depConFun            } from './deploy-files.ts'; // What: Deploy Config Function. Why: The hosting files follow the build's project. How: This reads it from the environment.
import { depHeaFun            } from './deploy-files.ts'; // What: Deploy Headers Function. Why: The policy names the build's project. How: This fills in the headers file.
import { depRedFun            } from './deploy-files.ts'; // What: Deploy Redirects Function. Why: Sign-in passes through to the build's project. How: This fills in the redirects file.
import { fileURLToPath        } from 'node:url';          // What: File URL To Path. Why: The legal documents' module is named by a file path. How: This turns its URL beside this config into one.
import { readFileSync         } from 'node:fs';           // What: Read File Sync. Why: The copied hosting files are read back. How: This reads one.
import { renderToStaticMarkup } from 'react-dom/server';  // What: Render To Static Markup. Why: The legal pages carry their document as plain HTML, readable without JavaScript. How: This is called in legPagFun's page step.
import { resolve              } from 'node:path';         // What: Resolve. Why: The hosting files sit in the build's folder. How: This builds their paths.
import { runnerImport         } from 'vite';              // What: Runner Import. Why: The legal documents are TSX, which Node can't load on its own. How: This loads them through Vite's module runner in legPagFun's page step.
import { VitePWA              } from 'vite-plugin-pwa';   // What: Vite PWA. Why: The app's service worker is built with the file list it caches. How: This returns the plugin.
import { writeFileSync        } from 'node:fs';           // What: Write File Sync. Why: The filled-in hosting files replace the copies. How: This writes one.


import type { DepConTyp         } from './deploy-files.ts'; // What: Deploy Config Type. Why: The plugin holds the build's project between hooks. How: This types it.
import type { FunctionComponent } from 'react';             // What: Function Component. Why: The legal documents' module is loaded at run time, so its shape is declared here. How: This types each document in LegTexTyp.
import type { Plugin            } from 'vite';              // What: Plugin. Why: The legal pages step, the page minifier, and the deploy files' writer are Vite plugins. How: This types their return values.

// #endregion Imports



/**
 * vite.config.ts = Vite Config
 *
 * @summary
 * The build and dev server config. It compiles React, reads CSS module class
 * names as camelCase keys, builds the static privacy and terms pages beside
 * the app with their documents rendered in, builds the app's one service
 * worker from src/service-worker.ts, writing the build's file list into it
 * and adding the script that registers it, and, for production builds only,
 * compacts the pages, which Vite processes but never minifies, so their
 * comments and indentation stay out of what visitors download. The web app
 * manifest stays hand-written, so the plugin writes none. Every other setting
 * stays at Vite's default, including copying the files in public/ into the
 * build, after which Netlify's _headers and _redirects are filled in for the
 * build's own Firebase project (deploy-files.ts).
 *
 * Sections:
 *  - Types
 *  - Constants
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Types

type LegTexTyp = Record< 'PriPolCom' | 'TerSerCom', FunctionComponent >; // What: Legal Text Type. Why: legPagFun reads the two documents from the module it loads at run time. How: This types that module's exports.

// #endregion Types



// #region Constants

const LEG_DOC_REG = /data-legal-document-body='(privacy|terms)'\s*>(?=<\/article>)/;     // What: Legal Document Regular Expression. Why: A legal page marks where its document goes. How: This matches the end of an empty article's opening tag that names a document, capturing the name.
const LEG_TEX_PAT = fileURLToPath( new URL( './src/legal/text.tsx', import.meta.url ) ); // What: Legal Text Path. Why: The documents live in one module that Settings shares. How: This is that module's absolute path, built from this config's own address.

// #endregion Constants



// #region Helpers

// #region legPagFun

/**
 * legPagFun = Legal Pages Function
 *
 * @summary
 * Builds the Vite plugin that fills the static legal pages, privacy.html and
 * terms.html, with their documents. Each page holds an empty article whose
 * data-legal-document-body attribute names its document. For a page with
 * one, in dev and in builds, the plugin loads src/legal/text.tsx through
 * Vite's module runner, renders the named component to static HTML, and
 * places it inside the article, so the pages carry the same text as
 * Settings, readable without JavaScript. Every other page passes through
 * unchanged.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The plugin object, for the config's plugins array.
 *
 * @example
 * ```ts
 * legPagFun() // => { name, transformIndexHtml }
 * ```
 *
*/

const legPagFun = () : Plugin => ({ // What: Legal Pages Function. Why: The legal pages' documents have to be rendered in from their shared module. How: This returns the plugin that does it.


	name : 'legal-pages', // What: Name. Why: Vite reports a plugin's warnings and errors under its name. How: This names the plugin.

	transformIndexHtml : async ( htmTexStr ) => { // What: Transform Index HTML Hook. Why: Vite hands every page it serves or builds to this hook. How: This renders a legal page's document into it and returns the page.


		const docMatArr = htmTexStr.match( LEG_DOC_REG ); // What: Document Match Array. Why: Only a page that names a document has one to render. How: This finds the article's marker and captures the document's name.


		if ( !docMatArr ) return htmTexStr; // What: No Document Guard. Why: The app's own page holds no legal document. How: This returns any page without a marker unchanged.



		const { module : legTexObj } = await runnerImport< LegTexTyp >( LEG_TEX_PAT, { configFile : false } ); // What: Legal Text Object. Why: The documents are TSX, which Node can't load on its own. How: This loads the module through Vite's runner, without loading this config again inside it.

		const docComFun = docMatArr[ 1 ] === 'privacy' ? legTexObj.PriPolCom : legTexObj.TerSerCom; // What: Document Component Function. Why: Each page shows its own document. How: This picks the component the marker names.



		return htmTexStr.replace( LEG_DOC_REG, ( matTexStr ) => matTexStr + renderToStaticMarkup( createElement( docComFun ) ) ); // What: Filled Page Return. Why: Vite serves or writes whatever this returns. How: This places the document's static HTML right after the article's opening tag.


	}


});

// #endregion legPagFun



// #region minHtmFun

/**
 * minHtmFun = Minify HTML Function
 *
 * @summary
 * Builds the Vite plugin that compacts the shipped pages. Vite injects the
 * bundle's script and stylesheet tags into each page but otherwise ships it
 * as written, with every comment and indentation level the formatting
 * rules give it. For production builds only, this strips each page's HTML
 * comments and the comment inside its external script tag, trims every
 * line, and drops blank lines. The newlines between lines are kept, so text
 * wrapped across lines keeps the space between its words. It runs after
 * Vite's own transforms, so the tags Vite injects are compacted too. The dev
 * server serves the page as written.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The plugin object, for the config's plugins array.
 *
 * @example
 * ```ts
 * minHtmFun() // => { apply, name, transformIndexHtml }
 * ```
 *
*/

const minHtmFun = () : Plugin => ({ // What: Minify HTML Function. Why: The pages ship as written unless something minifies them. How: This returns a build-only Vite plugin that does.


	apply : 'build',               // What: Apply. Why: The dev server should serve the pages as written. How: This runs the plugin only during npm run build.
	name  : 'minify-shipped-page', // What: Name. Why: Vite reports a plugin's warnings and errors under its name. How: This names the plugin.

	transformIndexHtml : { // What: Transform Index HTML Hook. Why: Vite processes the pages but doesn't minify them. How: This compacts each page after Vite's own changes.


		order : 'post', // What: Order. Why: The page should be compacted only after Vite has injected the bundle's script and stylesheet tags. How: This runs after Vite's own transforms.

		handler : ( htmTexStr ) => { // What: Handler. Why: This is the plugin's actual work. How: This strips comments, then drops indentation and blank lines.


			return htmTexStr                                                                            // What: Compacted Page Return. Why: Vite writes whatever this returns as the shipped page. How: This chains each compaction over the page's text.
				.replace( /(<script\b[^>]*\bsrc=[^>]*>)\s*(?:\/\*[\s\S]*?\*\/\s*)+(<\/script>)/g, '$1$2' ) // What: External Script Comment Strip. Why: An external script's only content is its comment. How: This empties the tag.
				.replace( /<!--[\s\S]*?-->/g, '' )                                                         // What: HTML Comment Strip. Why: Comments mean nothing to the browser. How: This removes every HTML comment.
				.split( '\n' )                                                                             // What: Line Split. Why: Indentation and blank lines are dropped line by line. How: This splits the page into lines.
				.map( ( linTexStr ) => linTexStr.trim() )                                                  // What: Indentation Trim. Why: Indentation means nothing to the browser. How: This trims each line.
				.filter( Boolean )                                                                         // What: Blank Line Filter. Why: Blank lines mean nothing to the browser. How: This drops every empty line.
				.join( '\n' );                                                                             // What: Line Join. Why: The page has to be one string again. How: This rejoins the remaining lines with newlines, which keep the spaces between words in wrapped text.


		}


	}


});

// #endregion minHtmFun



// #region depWriFun

/**
 * depWriFun = Deploy Write Function
 *
 * @summary
 * Returns a build-only Vite plugin that fills in the build's _headers and
 * _redirects for its own Firebase project once the bundle is written,
 * reading the project from VITE_FIREBASE_CONFIG and App Check's key from
 * VITE_APPCHECK_SITE_KEY, as the app does. A build without a project keeps
 * the strict files.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param void - This function takes no parameters.
 *
 * @returns The plugin.
 *
 * @example
 * ```ts
 * depWriFun() // => { apply : 'build', name : 'write-deploy-files', ... }
 * ```
 *
*/

const depWriFun = () : Plugin => { // What: Deploy Write Function. Why: Each environment's hosting files name its own project. How: This returns a plugin that fills them in after the build.


	let depConObj : DepConTyp = null; // What: Deploy Config Object. Why: The project is read once the config resolves, and used once the bundle is written. How: This holds it, null without a project.
	let outDirStr = '';               // What: Output Directory String. Why: The files are rewritten where the build wrote them. How: This holds the build's folder.



	return { // What: Plugin Return. Why: Vite runs the plugin's hooks during the build. How: This returns them.


		apply          : 'build',                                                                                                                                                                    // What: Apply. Why: The dev server serves no hosting files. How: This runs the plugin only during npm run build.
		configResolved : ( conResObj ) => { depConObj = depConFun( conResObj.env.VITE_FIREBASE_CONFIG, conResObj.env.VITE_APPCHECK_SITE_KEY ); outDirStr = resolve( conResObj.root, conResObj.build.outDir ); }, // What: Config Resolved Hook. Why: The project comes from the build's environment. How: This reads it and the output folder.
		name           : 'write-deploy-files',                                                                                                                                                       // What: Name. Why: Vite reports a plugin's warnings and errors under its name. How: This names the plugin.

		closeBundle : () => { // What: Close Bundle Hook. Why: The hosting files are in the build only once public/ has been copied. How: This rewrites both there.


			writeFileSync( resolve( outDirStr, '_headers' ), depHeaFun( readFileSync( resolve( outDirStr, '_headers' ), 'utf8' ), depConObj ) );     // What: Headers Write Call. Why: The policy names the build's project. How: This fills in the headers file.
			writeFileSync( resolve( outDirStr, '_redirects' ), depRedFun( readFileSync( resolve( outDirStr, '_redirects' ), 'utf8' ), depConObj ) ); // What: Redirects Write Call. Why: Sign-in passes through to the build's project. How: This fills in the redirects file.


		}


	};


};

// #endregion depWriFun


const VIT_CON_OBJ = defineConfig({ // What: Vite Config Object. Why: Vite reads its whole configuration from this file's default export. How: This builds the config, including the minHtmFun plugin above.


	build   : { rolldownOptions : { input : [ 'index.html', 'privacy.html', 'terms.html' ] } }, // What: Build. Why: The legal pages are built as pages of their own, beside the app. How: This lists every HTML page the build starts from.
	css     : { modules : { localsConvention : 'camelCaseOnly' } },                            // What: CSS. Why: CSS modules expose each class name as a camelCase key only, so a modifier class such as .butBasAnc--primary is read as cssModObj.butBasAncPrimary, per the CSS modules rules. How: This sets the locals convention.

	plugins : [ // What: Plugins. Why: Vite builds the app through these plugins, in this order. How: This lists React, the legal pages step, the service worker, the page minifier, and the deploy files' writer.


		reaPluFun(), // What: React Plugin Call. Why: JSX has to compile. How: This adds React's plugin.
		legPagFun(), // What: Legal Pages Call. Why: The legal pages need their documents rendered in before the minifier compacts them. How: This adds the legal pages step.

		VitePWA({ // What: Vite PWA Call. Why: Workbox's caching and FCM's push handling share one worker, since a scope holds one (ARCHITECTURE.md Section 14). How: This builds the hand-written worker rather than generating one.


			filename       : 'service-worker.ts',                               // What: Filename. Why: The worker is written in TypeScript beside the app. How: This names it, built to service-worker.js.
			injectManifest : { globPatterns : [ '**/*.{css,html,js,woff2}' ] }, // What: Inject Manifest. Why: The app should open offline in its own fonts, which Workbox's default file list leaves out. How: This precaches the build's stylesheets, pages, scripts, and font files.
			injectRegister : 'script-defer',                                    // What: Inject Register. Why: The worker should register on every load without holding up the page. How: This adds a deferred script that registers it.
			manifest       : false,                                             // What: Manifest. Why: The web app manifest is hand-written static JSON. How: This keeps the plugin from writing one.
			srcDir         : 'src',                                             // What: Source Directory. Why: The worker is compiled like the app's own code. How: This looks for it in src.
			strategies     : 'injectManifest'                                   // What: Strategies. Why: The worker is hand-written, with the build's file list written into it. How: This injects the list rather than generating a worker.


		}),

		minHtmFun(), // What: Minify HTML Call. Why: The shipped pages drop their comments. How: This adds the page minifier.
		depWriFun()  // What: Deploy Write Call. Why: The hosting files name the build's own project. How: This adds the deploy files' writer, last.


	]


});

// #endregion Helpers



// #region Exports

export default VIT_CON_OBJ; // What: Default Export. Why: Vite reads its config from this file's default export. How: This exports VIT_CON_OBJ.

// #endregion Exports


