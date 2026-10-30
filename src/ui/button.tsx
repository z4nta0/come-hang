


// #region Imports

import cssModObj from './button.module.css'; // What: CSS Module Object. Why: The button is styled in its own module, whose class names Vite hashes. How: The button reads its class from this object.

// #endregion Imports



/**
 * button.tsx = Button
 *
 * @summary
 * The app's main action button: a periwinkle pill with bold text that lifts on
 * hover and presses in, for the one action a screen leads with, such as
 * starting a group. A screen can add its own class to place it.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type BbcProTyp = { children : React.ReactNode, className? : string, onClick? : () => void, type? : 'button' | 'submit' }; // What: Button Base Component Props Type. Why: A button holds its label, may be placed by its screen, and either acts on a click or submits its form. How: This types ButBasCom's props.

// #region ButBasCom

/**
 * ButBasCom = Button Base Component
 *
 * @summary
 * Renders the main action button around its label. A plain button by
 * default, or a form's submit button, it runs its click handler when given
 * one.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.children  - Children: The button's label.
 * @param props.className - Class Name: A screen's own class, to place it,
 *                          empty by default.
 * @param props.onClick   - On Click: What a click does, when the button
 *                          isn't a submit.
 * @param props.type      - Type: button by default, or submit in a form.
 *
 * @returns The button element.
 *
 * @example
 * ```tsx
 * ButBasCom({ children, onClick }) // => <ButBasCom />
 * ```
 *
*/

function ButBasCom ( { children, className = '', onClick, type = 'button' } : BbcProTyp ) : React.JSX.Element {


	return (


		<button
			className={` ${ cssModObj.butBasBut }   ${ className } `}

			type={ type }

			onClick={ onClick }
		>{ children }</button> // What: Button Base Button Element. Why: A screen's leading action has to stand out and respond to touch. How: This renders the label in a periwinkle pill of the button's type.


	);


}

// #endregion ButBasCom

// #endregion Components



// #region Exports

export { ButBasCom }; // What: Named Export. Why: Every screen's leading action uses it. How: This exports ButBasCom.

// #endregion Exports


