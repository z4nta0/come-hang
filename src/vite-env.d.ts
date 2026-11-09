


/**
 * vite-env.d.ts = Vite Environment
 *
 * @summary
 * Declares the app's own build variables, the version Vite writes in and the
 * ones beside those Vite types for import.meta.env, so reading one is
 * type-checked. Nothing imports this file; TypeScript picks it up as an
 * ambient declaration.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



declare const __APP_VERSION__ : string; // What: App Version. Why: Vite writes the release's version into the app. How: This tells TypeScript the name Vite replaces.



interface ImportMetaEnv { // What: Import Meta Env. Why: TypeScript has to know the app's own build variables. How: This adds them to the environment Vite types.


	readonly VITE_APPCHECK_SITE_KEY?  : string; // What: App Check Site Key. Why: App Check's reCAPTCHA Enterprise needs the project's site key. How: This is the key from the Firebase console, missing in development and wherever App Check is off.
	readonly VITE_FIREBASE_CONFIG?    : string; // What: Firebase Config. Why: A production build learns its Firebase project from Netlify. How: This is the web config as JSON, missing in development.
	readonly VITE_FIREBASE_VAPID_KEY? : string; // What: Firebase VAPID Key. Why: The browser needs the public half of the key pair FCM signs web pushes with. How: This is the key from the project's Cloud Messaging settings, missing in development.


}


