


/**
 * main-area.tsx = Main Area
 *
 * @summary
 * The main landmark every screen puts its content in, which the skip link
 * jumps to. It carries the main id the skip link names and can take focus
 * from a script without joining the Tab order, while each screen styles and
 * fills it.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type MacProTyp = { children : React.ReactNode, className : string }; // What: Main Area Component Props Type. Why: Each screen fills and styles its own main area. How: This types MaiAreCom's props.

// #region MaiAreCom

/**
 * MaiAreCom = Main Area Component
 *
 * @summary
 * Renders a screen's main element, the skip link's target, holding the
 * screen's content and styled by the class the screen gives it.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.children  - Children: The screen's content.
 * @param props.className - Class Name: The screen's class for its main area.
 *
 * @returns The main element.
 *
 * @example
 * ```tsx
 * MaiAreCom({ children, className }) // => <MaiAreCom />
 * ```
 *
*/

function MaiAreCom ( { children, className } : MacProTyp ) : React.JSX.Element {


	return (


		<main
			id='main' // What: Main Identifier. Why: The skip link's #main names this element, and as a navigation target its id keeps its plain name. How: This gives the main element the id the skip link points at.

			className={ className }

			tabIndex={ -1 } // What: Main Tab Index. Why: The skip link moves focus here, but the main element isn't a control. How: This lets it take focus from a script without joining the Tab order.
		>{ /* What: Main Area Element. Why: Each screen's content is the page's main landmark. How: This holds the content the screen passes in. */ }


			{ children }


		</main>


	);


}

// #endregion MaiAreCom

// #endregion Components



// #region Exports

export { MaiAreCom }; // What: Named Export. Why: Every screen holds its content in it. How: This exports MaiAreCom.

// #endregion Exports


