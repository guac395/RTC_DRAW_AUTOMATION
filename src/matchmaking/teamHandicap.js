/**
 * Team Handicap Calculator
 * Implements the IRTPA standard algorithm for calculating doubles team handicaps.
 * Source: https://www.irtpa.com/doubles-handicap-calculator/
 */

/**
 * IRTPA adjustment factor lookup table.
 * Key: absolute difference between player handicaps
 * Value: adjustment factor to add to better player's handicap
 */
const ADJUSTMENT_TABLE = {
    1: 0.5, 2: 1.0, 3: 1.4, 4: 1.8, 5: 2.1, 6: 2.4, 7: 2.6, 8: 2.8, 9: 3.0, 10: 3.2,
    11: 3.4, 12: 3.6, 13: 3.8, 14: 4.0, 15: 4.2, 16: 4.4, 17: 4.6, 18: 4.8, 19: 5.0, 20: 5.2,
    21: 5.4, 22: 5.6, 23: 5.8, 24: 6.0, 25: 6.2, 26: 6.4, 27: 6.6, 28: 6.8, 29: 7.0, 30: 7.2,
    31: 7.4, 32: 7.6, 33: 7.8, 34: 8.0, 35: 8.2, 36: 8.4, 37: 8.6, 38: 8.8, 39: 9.0, 40: 9.2,
    41: 9.4, 42: 9.6, 43: 9.8, 44: 10.0, 45: 10.2, 46: 10.4, 47: 10.6, 48: 10.8, 49: 10.9, 50: 11.0,
    51: 11.1, 52: 11.2, 53: 11.3, 54: 11.4, 55: 11.5, 56: 11.6, 57: 11.7, 58: 11.8, 59: 11.9, 60: 12.0
};

/**
 * Gets the effective handicap for a player.
 * Uses the better (lower) of their singles or doubles handicap.
 * Falls back to whichever handicap is available if only one exists.
 *
 * @param {Object} player - Player object with handicap properties
 * @returns {number|null} The effective handicap or null if none available
 */
function getPlayerEffectiveHandicap(player) {
    const singles = player.singlesHCAP ?? player.singlesHandicap ?? null;
    const doubles = player.doublesHCAP ?? player.doublesHandicap ?? null;

    if (singles !== null && doubles !== null) {
        return Math.min(singles, doubles);
    }
    return singles ?? doubles ?? null;
}

/**
 * Gets the adjustment factor for a given handicap difference.
 * Differences of 0 return 0, differences >= 60 are capped at 12.0.
 *
 * @param {number} difference - Absolute difference between two handicaps
 * @returns {number} The adjustment factor
 */
function getAdjustmentFactor(difference) {
    if (difference === 0) return 0;
    if (difference >= 60) return 12.0;
    return ADJUSTMENT_TABLE[difference] ?? 12.0;
}

/**
 * Calculates the team handicap for a doubles pair using the IRTPA algorithm.
 *
 * Algorithm:
 * 1. Get effective handicap for each player (better of singles/doubles)
 * 2. Calculate the absolute difference between handicaps
 * 3. Look up the adjustment factor from the table
 * 4. Add adjustment factor to the better player's handicap
 *
 * @param {Object} playerA - First player object with handicap properties
 * @param {Object} playerB - Second player object with handicap properties
 * @returns {Object} Result with team handicap and calculation details
 */
function calculateTeamHandicap(playerA, playerB) {
    const handicapA = getPlayerEffectiveHandicap(playerA);
    const handicapB = getPlayerEffectiveHandicap(playerB);

    if (handicapA === null || handicapB === null) {
        return {
            success: false,
            error: 'Missing handicap data for one or both players',
            playerAHandicap: handicapA,
            playerBHandicap: handicapB
        };
    }

    const difference = Math.abs(handicapA - handicapB);
    const adjustment = getAdjustmentFactor(difference);
    const betterHandicap = Math.min(handicapA, handicapB);
    const teamHandicap = betterHandicap + adjustment;

    return {
        success: true,
        teamHandicap,
        playerAHandicap: handicapA,
        playerBHandicap: handicapB,
        difference,
        adjustment,
        betterHandicap
    };
}

/**
 * Validates the algorithm with the example from the IRTPA specification.
 * Player A: 32, Player B: 45 -> Team Handicap: 35.8
 *
 * @returns {Object} Validation result
 */
function validateAlgorithm() {
    const playerA = { doublesHCAP: 32 };
    const playerB = { doublesHCAP: 45 };
    const result = calculateTeamHandicap(playerA, playerB);

    const expected = {
        difference: 13,
        adjustment: 3.8,
        teamHandicap: 35.8
    };

    const isValid = result.success &&
        result.difference === expected.difference &&
        result.adjustment === expected.adjustment &&
        result.teamHandicap === expected.teamHandicap;

    return {
        isValid,
        expected,
        actual: result,
        message: isValid
            ? 'Algorithm validation passed'
            : 'Algorithm validation FAILED'
    };
}

// CommonJS exports for UXP
module.exports = {
    calculateTeamHandicap,
    getPlayerEffectiveHandicap,
    getAdjustmentFactor,
    validateAlgorithm,
    ADJUSTMENT_TABLE
};
