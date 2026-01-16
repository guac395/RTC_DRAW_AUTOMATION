/**
 * Handicap Rounding Utility
 * Handles handicap rounding for tennis event classes when populating InDesign templates.
 * Ensures displayed handicaps stay within appropriate class boundaries.
 */

/**
 * Class boundaries for tennis events.
 * Min is the lowest handicap allowed in the class.
 * Max is the highest handicap allowed in the class.
 */
const CLASS_BOUNDS = {
    '4th': { min: 40.0, max: 49.0 },
    '4th class': { min: 40.0, max: 49.0 },
    '3rd': { min: 30.0, max: 39.0 },
    '3rd class': { min: 30.0, max: 39.0 },
    '2nd': { min: 20.0, max: 29.0 },
    '2nd class': { min: 20.0, max: 29.0 },
    '1st': { min: null, max: 19.0 },
    '1st class': { min: null, max: 19.0 },
    'club': null, // No rounding for Club Championship
    'club championship': null,
    'championship': null,
    'champ': null,
    'champs': null
};

/**
 * Extracts class bounds from an event name.
 * Looks for class indicators like "4th Class", "3rd", "Club Championship", etc.
 *
 * @param {string} eventName - The event name to parse
 * @returns {Object|null} Bounds object with min/max, or null for no rounding
 */
function getEventClassBounds(eventName) {
    if (!eventName) return null;

    const lowerName = eventName.toLowerCase();

    // Check for Club Championship first (no rounding)
    if (lowerName.includes('club') || lowerName.includes('championship') || lowerName.includes('champ')) {
        return null;
    }

    // Check for class indicators
    for (const [key, bounds] of Object.entries(CLASS_BOUNDS)) {
        if (bounds && lowerName.includes(key)) {
            return bounds;
        }
    }

    // No class found - no rounding
    return null;
}

/**
 * Rounds a handicap to stay within class boundaries.
 * - Plus players (negative internal values) are never rounded
 * - Handicaps <= 19 are never rounded (already 1st Class eligible)
 * - Handicaps above max are capped to max
 * - Handicaps below min are raised to min
 *
 * @param {number} handicap - The handicap to round (internal format, negative = plus player)
 * @param {Object|null} bounds - Class bounds with min/max properties, or null for no rounding
 * @returns {number} The rounded handicap
 */
function roundHandicapForClass(handicap, bounds) {
    // No rounding if no bounds (Club Championship or unknown class)
    if (!bounds) return handicap;

    // Never round plus players (internal negative values)
    if (handicap < 0) return handicap;

    // Never round handicaps <= 19 (1st Class eligible)
    if (handicap <= 19) return handicap;

    // Apply bounds
    let rounded = handicap;

    // Cap at maximum for the class
    if (bounds.max !== null && rounded > bounds.max) {
        rounded = bounds.max;
    }

    // Raise to minimum for the class (if below)
    if (bounds.min !== null && rounded < bounds.min) {
        rounded = bounds.min;
    }

    return rounded;
}

/**
 * Formats a handicap for display.
 * Converts internal representation (negative = plus player) to display format.
 * Internal: -5 -> Display: "+5"
 * Internal: 25 -> Display: "25"
 *
 * @param {number} handicap - The handicap in internal format
 * @returns {string} The formatted handicap for display
 */
function formatHandicapForDisplay(handicap) {
    if (handicap === null || handicap === undefined) {
        return '';
    }

    // Plus players: negative internal value displayed as "+X"
    if (handicap < 0) {
        return `+${Math.abs(handicap)}`;
    }

    // Regular handicaps: display as-is
    return String(handicap);
}

/**
 * Processes a handicap for display in a specific event class.
 * Combines rounding and formatting into a single operation.
 *
 * @param {number} handicap - The raw handicap value
 * @param {string} eventName - The event name to determine class bounds
 * @returns {string} The processed handicap ready for display
 */
function processHandicapForDisplay(handicap, eventName) {
    if (handicap === null || handicap === undefined) {
        return '';
    }

    const bounds = getEventClassBounds(eventName);
    const rounded = roundHandicapForClass(handicap, bounds);
    return formatHandicapForDisplay(rounded);
}

// CommonJS exports for UXP
module.exports = {
    getEventClassBounds,
    roundHandicapForClass,
    formatHandicapForDisplay,
    processHandicapForDisplay,
    CLASS_BOUNDS
};
