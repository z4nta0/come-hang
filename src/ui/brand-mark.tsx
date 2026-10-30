


/**
 * brand-mark.tsx = Brand Mark
 *
 * @summary
 * The app's mark, a map pin tipped over into a chat bubble with three typing
 * dots, on its periwinkle tile, drawn inline from the source artwork in
 * design/brand/icon.svg. It's inline rather than an image file, since a file
 * this small would be inlined as a data address, which the app's content
 * policy refuses. It keeps the brand's own colors in both light and dark
 * mode, as artwork rather than a themed surface, and is hidden from screen
 * readers, since the app's name always sits beside it.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

type BmcProTyp = { className : string }; // What: Brand Mark Component Props Type. Why: Each screen sizes the mark itself. How: This types BraMarCom's one prop.

// #region BraMarCom

/**
 * BraMarCom = Brand Mark Component
 *
 * @summary
 * Draws the mark on its tile in the brand's fixed colors, sized by the class
 * it's given, and hidden from screen readers.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props.className - Class Name: The class that sizes and places it.
 *
 * @returns The mark's SVG element.
 *
 * @example
 * ```tsx
 * BraMarCom({ className }) // => <BraMarCom />
 * ```
 *
*/

function BraMarCom ( { className } : BmcProTyp ) : React.JSX.Element {


	return (


		<svg
			className={ className }

			viewBox='0 0 64 64'

			aria-hidden='true'
		>{ /* What: Brand Mark SVG Element. Why: The mark is the app's face. How: This draws the artwork in its 64 unit drawing space, its colors fixed as the brand's own, which a presentation attribute can't read from a token. */ }


			<rect
				fill='#4A4FC9'
				height='64'
				rx='14'
				width='64'
			/>{ /* What: Mark Tile Rect Element. Why: The mark sits on the brand's periwinkle. How: This fills the drawing space with a rounded square. */ }



			<g transform='translate(-1.78 1.67)'>{ /* What: Mark Center Group Element. Why: Tilting the pin leaves it off center. How: This shifts the mark and its dots so the tilted shape centers on the tile. */ }


				<path
					d='M32 58 C31.3 54.6 25.35 51 22.5 47.25 C17.75 41 13 33 13 26 a19 19 0 0 1 38 0 C51 40 32 58 32 58 Z'
					fill='#FFFFFF'
					transform='rotate(35 32 30)'
				/>{ /* What: Mark Pin Path Element. Why: One shape reads as both a map pin and a chat bubble. How: This draws the pin, with its subtle cut just above the tip, tipped 35 degrees around the middle of its head. */ }

				<circle
					cx='27.3'
					cy='26.7'
					fill='#4A4FC9'
					r='3.2'
				/>{ /* What: Typing Dot Circle Element. Why: Three dots in the head read as someone typing. How: This draws the first dot in the tile's periwinkle. */ }

				<circle
					cx='34.3'
					cy='26.7'
					fill='#E9735D'
					r='3.2'
				/>{ /* What: Typing Dot Circle Element. Why: The middle dot carries the brand's coral spark. How: This draws the second dot in coral. */ }

				<circle
					cx='41.3'
					cy='26.7'
					fill='#4A4FC9'
					r='3.2'
				/>{ /* What: Typing Dot Circle Element. Why: Three dots in the head read as someone typing. How: This draws the third dot in the tile's periwinkle. */ }


			</g>


		</svg>


	);


}

// #endregion BraMarCom

// #endregion Components



// #region Exports

export { BraMarCom }; // What: Named Export. Why: The welcome screen shows the mark above the app's name. How: This exports BraMarCom.

// #endregion Exports


