


// #region Imports

import reaPluFun from '@vitejs/plugin-react'; // What: React Plugin Function. Why: Vite needs the React plugin to compile JSX. How: This is called first in the plugins array.


import { defineConfig } from 'vite'; // What: Define Config. Why: Vite's config helper passes the config through with its types. How: This wraps VIT_CON_OBJ.


import type { Plugin } from 'vite'; // What: Plugin. Why: The page minifier is a Vite plugin. How: This types minHtmFun's return, which types its hook.

// #endregion Imports



/**
 * vite.config.ts = Vite Config
 *
 * @summary
 * The build and dev server config. It compiles React, reads CSS module class
 * names as camelCase keys, and, for production builds only, compacts
 * index.html, which Vite processes but never minifies, so the page's comments
 * and indentation stay out of what visitors download. Every other setting
 * stays at Vite's default, including copying the files in public/ (such as
 * Netlify's _redirects) into the build untouched.
 *
 * Sections:
 *  - Helpers
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Helpers

// #region minHtmFun

/**
 * minHtmFun = Minify HTML Function
 *
 * @summary
 * Builds the Vite plugin that compacts the shipped index.html. Vite injects
 * the bundle's script and stylesheet tags into the page but otherwise ships
 * it as written, with every comment and indentation level the formatting
 * rules give it. For production builds only, this strips the page's HTML
 * comments and the comment inside its external script tag, trims every
 * line, and drops blank lines. The
 * newlines between lines are kept, so text wrapped across lines keeps the
 * space between its words. It runs after Vite's own transforms, so the tags
 * Vite injects are compacted too. The dev server serves the page as written.
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

const minHtmFun = () : Plugin => ({ // What: Minify HTML Function. Why: index.html ships as written unless something minifies it. How: This returns a build-only Vite plugin that does.


	apply : 'build',               // What: Apply. Why: The dev server should serve the page as written. How: This runs the plugin only during npm run build.
	name  : 'minify-shipped-page', // What: Name. Why: Vite reports a plugin's warnings and errors under its name. How: This names the plugin.

	transformIndexHtml : { // What: Transform Index HTML Hook. Why: Vite processes index.html but doesn't minify it. How: This compacts the page after Vite's own changes.


		order : 'post', // What: Order. Why: The page should be compacted only after Vite has injected the bundle's script and stylesheet tags. How: This runs after Vite's own transforms.

		handler : ( htmTexStr ) => { // What: Handler. Why: This is the plugin's actual work. How: This strips comments, then drops indentation and blank lines.


			return htmTexStr                                                                               // What: Compacted Page Return. Why: Vite writes whatever this returns as the shipped page. How: This chains each compaction over the page's text.
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



const VIT_CON_OBJ = defineConfig({ // What: Vite Config Object. Why: Vite reads its whole configuration from this file's default export. How: This builds the config, including the minHtmFun plugin above.


	css     : { modules : { localsConvention : 'camelCaseOnly' } }, // What: CSS. Why: CSS modules expose each class name as a camelCase key only, so a modifier class such as .butBasAnc--primary is read as cssModObj.butBasAncPrimary, per the CSS modules rules. How: This sets the locals convention.
	plugins : [ reaPluFun(), minHtmFun() ]                          // What: Plugins. Why: Vite builds the app through these plugins, in this order. How: This lists React and the page minifier.


});

// #endregion Helpers



// #region Exports

export default VIT_CON_OBJ; // What: Default Export. Why: Vite reads its config from this file's default export. How: This exports VIT_CON_OBJ.

// #endregion Exports


