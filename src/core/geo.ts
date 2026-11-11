


/**
 * geo.ts = Geography Helpers
 *
 * @summary
 * The math the app does with shared positions, always on the device after
 * each position is decrypted (ARCHITECTURE.md Section 11.4): the distance
 * between two positions, the compass bearing from one to the other, and the
 * short labels a screen shows for both, in miles or kilometers by the
 * device's region. Positions are latitude and longitude in degrees, on a
 * sphere of the Earth's mean radius.
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

type GeoPosTyp = { latNum : number, lngNum : number }; // What: Geography Position Type. Why: Every helper takes positions the same way. How: This types a latitude and longitude in degrees.

// #endregion Types



// #region Constants

const DIR_NAM_ARR = [ 'north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest' ]; // What: Direction Name Array. Why: A bearing reads as one of eight compass directions. How: This lists them clockwise from north, each covering 45 degrees.
const EAR_RAD_NUM = 6371008.8;                                                                                // What: Earth Radius Number. Why: Distances are measured along the Earth's surface. How: This is its mean radius in meters.
const FEE_MET_NUM = 0.3048;                                                                                   // What: Feet Meters Number. Why: Imperial distances are worked out from meters. How: This is one foot in meters, exactly.
const IMP_REG_ARR = [ 'GB', 'LR', 'MM', 'US' ];                                                               // What: Imperial Region Array. Why: These regions give distances in miles, the United Kingdom on its roads. How: This lists their region codes.
const MIL_MET_NUM = 1609.344;                                                                                 // What: Mile Meters Number. Why: Imperial distances are worked out from meters. How: This is one mile in meters, exactly.

// #endregion Constants



// #region Helpers

const radValFun = ( degValNum : number ) : number => degValNum * Math.PI / 180; // What: Radian Value Function. Why: The formulas work in radians. How: This converts degrees.



// #region beaDegFun

/**
 * beaDegFun = Bearing Degrees Function
 *
 * @summary
 * Returns the initial compass bearing from one position to another, in
 * degrees clockwise from north, from 0 up to but not including 360.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param posOneObj - Position One Object: Where the bearing starts.
 * @param posTwoObj - Position Two Object: Where it points.
 *
 * @returns The bearing in degrees.
 *
 * @example
 * ```ts
 * beaDegFun({ latNum : 0, lngNum : 0 }, { latNum : 0, lngNum : 1 }) // => 90
 * ```
 *
*/

const beaDegFun = ( posOneObj : GeoPosTyp, posTwoObj : GeoPosTyp ) : number => { // What: Bearing Degrees Function. Why: The map places each member in their direction from the viewer. How: This computes the great-circle bearing.


	const latOneNum = radValFun( posOneObj.latNum );                    // What: Latitude One Number. Why: The formula reads the start's latitude in radians. How: This converts it.
	const latTwoNum = radValFun( posTwoObj.latNum );                    // What: Latitude Two Number. Why: The formula reads the end's latitude in radians. How: This converts it.
	const lngDifNum = radValFun( posTwoObj.lngNum - posOneObj.lngNum ); // What: Longitude Difference Number. Why: The formula reads how far east the end lies. How: This converts the difference.

	const easParNum = Math.sin( lngDifNum ) * Math.cos( latTwoNum );                                                                    // What: East Part Number. Why: The bearing is an angle from its east and north parts. How: This is its east part.
	const norParNum = Math.cos( latOneNum ) * Math.sin( latTwoNum ) - Math.sin( latOneNum ) * Math.cos( latTwoNum ) * Math.cos( lngDifNum ); // What: North Part Number. Why: The bearing is an angle from its east and north parts. How: This is its north part.



	return ( Math.atan2( easParNum, norParNum ) * 180 / Math.PI + 360 ) % 360; // What: Bearing Return. Why: A compass bearing runs from 0 to 360. How: This turns the angle into degrees and wraps it.


};

// #endregion beaDegFun



const dirTexFun = ( beaDegNum : number ) : string => DIR_NAM_ARR[ Math.round( beaDegNum / 45 ) % 8 ]; // What: Direction Text Function. Why: A bearing reads best as a compass direction. How: This picks the nearest of the eight, each covering 45 degrees.



// #region disMetFun

/**
 * disMetFun = Distance Meters Function
 *
 * @summary
 * Returns the distance between two positions in meters along the Earth's
 * surface, by the haversine formula on a sphere of the Earth's mean radius.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param posOneObj - Position One Object: The first position.
 * @param posTwoObj - Position Two Object: The second position.
 *
 * @returns The distance in meters.
 *
 * @example
 * ```ts
 * disMetFun({ latNum : 0, lngNum : 0 }, { latNum : 0, lngNum : 1 })
 * // => 111195
 * ```
 *
*/

const disMetFun = ( posOneObj : GeoPosTyp, posTwoObj : GeoPosTyp ) : number => { // What: Distance Meters Function. Why: Updates are throttled by distance moved, and the map says how far away each member is. How: This measures the distance between two positions.


	const hafValNum = Math.sin( radValFun( posTwoObj.latNum - posOneObj.latNum ) / 2 ) ** 2 + Math.cos( radValFun( posOneObj.latNum ) ) * Math.cos( radValFun( posTwoObj.latNum ) ) * Math.sin( radValFun( posTwoObj.lngNum - posOneObj.lngNum ) / 2 ) ** 2; // What: Haversine Value Number. Why: The haversine of the central angle sets the distance. How: This combines the latitude and longitude differences.



	return 2 * EAR_RAD_NUM * Math.asin( Math.sqrt( hafValNum ) ); // What: Distance Return. Why: The caller compares or shows it. How: This returns the arc length on the Earth's mean radius in meters.


};

// #endregion disMetFun



// #region disTexFun

/**
 * disTexFun = Distance Text Function
 *
 * @summary
 * Says a distance briefly. In metric, that's whole meters, rounded to the
 * nearest 10, under a kilometer, then kilometers to one decimal place under
 * 10, and whole kilometers beyond. In imperial, it's whole feet, rounded to
 * the nearest 10, under a tenth of a mile, then miles to one decimal place
 * under 10, and whole miles beyond. A distance under 10 meters reads as
 * "nearby" either way.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param disMetNum - Distance Meters Number: The distance in meters.
 * @param impUniBoo - Imperial Units Boolean: Whether to say it in feet and
 *                    miles, false by default.
 *
 * @returns The label.
 *
 * @example
 * ```ts
 * disTexFun(1234, false) // => '1.2 km'
 * ```
 *
*/

const disTexFun = ( disMetNum : number, impUniBoo = false ) : string => { // What: Distance Text Function. Why: The map says how far away each member is, in the units the device's region uses. How: This picks the unit and rounding by the distance and the system.


	if ( disMetNum < 10 ) return 'nearby'; // What: Nearby Guard. Why: A few meters is within a fix's own error. How: This returns "nearby".



	if ( impUniBoo && disMetNum < MIL_MET_NUM * 0.095 ) return `${ Math.round( disMetNum / FEE_MET_NUM / 10 ) * 10 } ft`; // What: Feet Guard. Why: Under a tenth of a mile, feet read best. How: This returns them to the nearest 10, stopping where they'd round to a tenth of a mile.



	if ( impUniBoo && disMetNum < MIL_MET_NUM * 9.95 ) return `${ ( disMetNum / MIL_MET_NUM ).toFixed( 1 ) } mi`; // What: Tenth Miles Guard. Why: Under 10 miles, a tenth still matters. How: This returns miles to one decimal place.



	if ( impUniBoo ) return `${ Math.round( disMetNum / MIL_MET_NUM ) } mi`; // What: Miles Guard. Why: Farther off, whole miles are enough. How: This returns them.



	if ( disMetNum < 995 ) return `${ Math.round( disMetNum / 10 ) * 10 } m`; // What: Meters Guard. Why: Under a kilometer, meters read best. How: This returns them to the nearest 10, stopping where they'd round to 1,000.



	if ( disMetNum < 9950 ) return `${ ( disMetNum / 1000 ).toFixed( 1 ) } km`; // What: Tenths Guard. Why: Under 10 kilometers, a tenth still matters. How: This returns kilometers to one decimal place.



	return `${ Math.round( disMetNum / 1000 ) } km`; // What: Kilometers Return. Why: Farther off, whole kilometers are enough. How: This returns them.


};

// #endregion disTexFun



// #region impUniFun

/**
 * impUniFun = Imperial Units Function
 *
 * @summary
 * Says whether a language tag's region gives distances in miles: the United
 * States, Liberia, Myanmar, and the United Kingdom. A tag naming no region,
 * such as en, takes the region it's most likely used in, so en reads as the
 * United States. A tag that isn't valid reads as metric.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param lanTagStr - Language Tag String: The tag, such as en-US.
 *
 * @returns True when the region uses miles.
 *
 * @example
 * ```ts
 * impUniFun('en-US') // => true
 * ```
 *
*/

const impUniFun = ( lanTagStr : string ) : boolean => { // What: Imperial Units Function. Why: Members in the United States and a few other places think in miles, and everyone else in kilometers. How: This reads the tag's region, filling one in when it's missing.


	try { return IMP_REG_ARR.includes( new Intl.Locale( lanTagStr ).maximize().region ?? '' ); } // What: Region Try. Why: A region decides the units. How: This fills in a missing region and checks the list.

	catch { return false; } // What: Invalid Tag Catch. Why: A tag the browser can't read gives no region. How: This falls back to metric.


};

// #endregion impUniFun

// #endregion Helpers



// #region Exports

export { beaDegFun, dirTexFun, disMetFun, disTexFun, type GeoPosTyp, impUniFun }; // What: Named Exports. Why: Location sharing and the map measure and label positions through these, in the device's units. How: This exports the helpers, the units check, and the position's type.

// #endregion Exports


