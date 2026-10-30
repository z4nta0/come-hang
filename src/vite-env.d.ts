


/**
 * vite-env.d.ts = Vite Environment
 *
 * @summary
 * Declares the app's own build variables beside the ones Vite types for
 * import.meta.env, so reading one is type-checked. Nothing imports this file;
 * TypeScript picks it up as an ambient declaration.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



interface ImportMetaEnv { // What: Import Meta Env. Why: TypeScript has to know the app's own build variables. How: This adds them to the environment Vite types.


	readonly VITE_FIREBASE_CONFIG?    : string; // What: Firebase Config. Why: A production build learns its Firebase project from Netlify. How: This is the web config as JSON, missing in development.
	readonly VITE_FIREBASE_VAPID_KEY? : string; // What: Firebase VAPID Key. Why: The browser needs the public half of the key pair FCM signs web pushes with. How: This is the key from the project's Cloud Messaging settings, missing in development.


}


