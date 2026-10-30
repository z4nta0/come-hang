


/**
 * icon.tsx = Icon
 *
 * @summary
 * The app's line icons, drawn inline so they take the color of the text
 * around them and load nothing. Each icon is one path in a 24 unit drawing
 * space, stroked in the current color with round ends, hidden from screen
 * readers, since the control holding it carries the name, and left out of
 * hit testing, so a press lands on the control itself.
 *
 * Sections:
 *  - Constants
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Constants

/**
 * ICO_PAT_OBJ = Icon Path Object
 *
 * @summary
 * Every icon's path data, keyed by the name a control asks for it by. Each
 * row is one SVG path in a 24 unit drawing space, so the rows carry no
 * comments of their own.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/

const ICO_PAT_OBJ = { // What: Icon Path Object. Why: Every icon is drawn the same way from its path alone. How: This maps each icon's name to its path data.


	back  : 'M15 5l-7 7 7 7',
	close : 'M6 6l12 12M18 6L6 18',
	down  : 'M6 9l6 6 6-6',
	plus  : 'M12 5v14M5 12h14',
	send  : 'M4 12l16-8-6 16-2-7z'


};

// #endregion Constants



// #region Components

type IcoProTyp = { icoNamStr : keyof typeof ICO_PAT_OBJ, sizSteStr : string }; // What: Icon Props Type. Why: An icon is chosen by name and sized by a rhythm step. How: This types IcoSvgCom's props.

// #region IcoSvgCom

/**
 * IcoSvgCom = Icon SVG Component
 *
 * @summary
 * Draws one line icon, square at the vertical rhythm step it's given, in the
 * color of the text around it. It's hidden from screen readers, so the
 * control holding it has to carry the name.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.icoNamStr - Icon Name String: Which icon to draw.
 * @param props.sizSteStr - Size Step String: The vertical rhythm step its
 *                          width and height read, such as bas.
 *
 * @returns The icon's SVG element.
 *
 * @example
 * ```tsx
 * IcoSvgCom({ icoNamStr: 'plus', sizSteStr: 'bas' }) // => <IcoSvgCom />
 * ```
 *
*/

function IcoSvgCom ( { icoNamStr, sizSteStr } : IcoProTyp ) : React.JSX.Element {


	const sizValStr = `calc( var( --ver-rhy-${ sizSteStr } ) * 1rem )`; // What: Size Value String. Why: An icon sits on the same scale as the text beside it. How: This builds the length from the step's rhythm token.



	return (


		<svg
			style={{
				height        : sizValStr,
				pointerEvents : 'none', // What: Pointer Events Note. Why: A press scales its button, sliding the icon's lines out from under the pointer, and WebKit then drops the button's pressed look. How: This leaves the icon out of hit testing, so the button itself is what's pressed.
				width         : sizValStr
			}}

			fill='none'
			stroke='currentColor'
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth='2'
			viewBox='0 0 24 24'

			aria-hidden='true'
		>{ /* What: Icon SVG Element. Why: A control shows its icon in its own text color. How: This sizes the drawing space to the step and strokes its path in the current color. */ }


			<path d={ ICO_PAT_OBJ[ icoNamStr ] } />{ /* What: Icon Path Element. Why: Each icon is one shape. How: This draws the named icon's path. */ }


		</svg>


	);


}

// #endregion IcoSvgCom

// #endregion Components



// #region Exports

export { IcoSvgCom }; // What: Named Export. Why: Buttons across the screens draw their icons with it. How: This exports IcoSvgCom.

// #endregion Exports


