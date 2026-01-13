/**
 * Bracket Placement Engine
 * Places participants into bracket positions based on Day/Night availability:
 * - Day (D) players go to top of bracket (lower match numbers)
 * - Night (N) players start at halfway point (higher match numbers)
 * - Overflow stays adjacent to its own section
 * - BYEs fill the gaps
 * - Random ordering within each section
 */

/**
 * Fisher-Yates shuffle for true randomness
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Creates a BYE object
 * @returns {Object} BYE participant object
 */
function createBye() {
    return {
        isBye: true,
        name: 'BYE',
        seed: null
    };
}

/**
 * Places participants by availability (Day/Night) into bracket positions
 *
 * Rules:
 * - Day players fill from top (index 0 downward)
 * - Night players start at halfway point (index halfSize) and fill downward
 * - Day overflow (if Day > halfSize) continues after Day section, pushing Night start down
 * - Night overflow (if Night > halfSize) fills upward from Night start toward Day section
 * - BYEs fill remaining gaps
 *
 * Example: 46 Night, 27 Day in 128-bracket (no overflow):
 * - Indices 0-26: Day players (27)
 * - Indices 27-63: BYEs in Day section (37)
 * - Indices 64-109: Night players (46)
 * - Indices 110-127: BYEs in Night section (18)
 *
 * Example: 66 Night, 32 Day in 128-bracket (Night overflow):
 * - Indices 0-31: Day players (32)
 * - Indices 32-61: BYEs (30)
 * - Indices 62-63: Night overflow (2) - just above Night section
 * - Indices 64-127: Night players (64)
 *
 * Example: 66 Day, 32 Night in 128-bracket (Day overflow):
 * - Indices 0-63: Day players (64)
 * - Indices 64-65: Day overflow (2) - continues after Day section
 * - Indices 66-95: BYEs (30)
 * - Indices 96-127: Night players (32)
 *
 * @param {Array} participants - Array of participant objects with availability
 * @param {number} bracketSize - Total bracket size (8, 16, 32, 64, or 128)
 * @returns {Object} Result with placed participants array
 */
function placeByAvailability(participants, bracketSize) {
    // Separate by availability
    const dayPlayers = [];
    const nightPlayers = [];

    participants.forEach(p => {
        if (p.availability === 'D') {
            dayPlayers.push(p);
        } else if (p.availability === 'N') {
            nightPlayers.push(p);
        }
    });

    // Check if we have availability data
    const hasAvailability = dayPlayers.length > 0 || nightPlayers.length > 0;

    if (!hasAvailability) {
        // No availability data - pure random placement
        return pureRandomPlacement(participants, bracketSize);
    }

    // Calculate half size and BYE count
    const halfSize = bracketSize / 2;
    const totalPlayers = dayPlayers.length + nightPlayers.length;
    const byeCount = bracketSize - totalPlayers;

    // Shuffle each group for randomness
    const shuffledDay = shuffle(dayPlayers);
    const shuffledNight = shuffle(nightPlayers);

    // Create result array
    const result = new Array(bracketSize).fill(null);

    // Calculate overflow
    const dayOverflowCount = Math.max(0, dayPlayers.length - halfSize);
    const nightOverflowCount = Math.max(0, nightPlayers.length - halfSize);

    const dayMainCount = Math.min(dayPlayers.length, halfSize);
    const nightMainCount = Math.min(nightPlayers.length, halfSize);

    // Place Day players from top (index 0 downward)
    let cursor = 0;
    for (let i = 0; i < dayMainCount; i++) {
        result[cursor] = {
            ...shuffledDay[i],
            seed: cursor + 1
        };
        cursor++;
    }

    // Place Day overflow (if any) - continues right after Day main section
    // This pushes into the bottom half
    for (let i = 0; i < dayOverflowCount; i++) {
        result[cursor] = {
            ...shuffledDay[dayMainCount + i],
            seed: cursor + 1
        };
        cursor++;
    }

    // Determine Night section start
    // If there's Day overflow, Night starts after Day overflow
    // Otherwise, Night starts at halfSize
    let nightSectionStart;
    if (dayOverflowCount > 0) {
        // Day overflowed - Night needs to start after Day overflow + BYEs
        // Night fills from bottom up, so we place Night main from the end
        nightSectionStart = bracketSize - nightMainCount;
    } else {
        // No Day overflow - Night starts at halfway point
        nightSectionStart = halfSize;
    }

    // Place Night main players starting at nightSectionStart
    for (let i = 0; i < nightMainCount; i++) {
        const idx = nightSectionStart + i;
        result[idx] = {
            ...shuffledNight[i],
            seed: idx + 1
        };
    }

    // Place Night overflow (if any) - fills upward from Night section start
    // This goes into positions just above Night section
    for (let i = 0; i < nightOverflowCount; i++) {
        const idx = nightSectionStart - 1 - i;
        result[idx] = {
            ...shuffledNight[nightMainCount + i],
            seed: idx + 1
        };
    }

    // Fill remaining positions with BYEs
    for (let i = 0; i < bracketSize; i++) {
        if (result[i] === null) {
            result[i] = createBye();
        }
    }

    return {
        success: true,
        placed: result,
        participantCount: participants.length,
        bracketSize,
        stats: {
            dayPlayers: dayPlayers.length,
            nightPlayers: nightPlayers.length,
            dayMain: dayMainCount,
            dayOverflow: dayOverflowCount,
            nightMain: nightMainCount,
            nightOverflow: nightOverflowCount,
            nightSectionStart: nightSectionStart,
            byeCount: byeCount
        }
    };
}

/**
 * Pure random placement when no availability data exists
 * @param {Array} participants - Array of participant objects
 * @param {number} bracketSize - Total bracket size
 * @returns {Object} Result with randomly placed participants
 */
function pureRandomPlacement(participants, bracketSize) {
    const shuffled = shuffle(participants);
    const result = new Array(bracketSize).fill(null);

    for (let i = 0; i < shuffled.length && i < bracketSize; i++) {
        result[i] = {
            ...shuffled[i],
            seed: i + 1
        };
    }

    // Fill remaining with BYEs
    for (let i = shuffled.length; i < bracketSize; i++) {
        result[i] = createBye();
    }

    return {
        success: true,
        placed: result,
        participantCount: participants.length,
        bracketSize,
        stats: {
            dayPlayers: 0,
            nightPlayers: 0,
            randomPlacement: true,
            byeCount: bracketSize - participants.length
        }
    };
}

/**
 * Main placement function - places participants by availability
 *
 * @param {Array} participants - Array of participant objects
 * @param {number} bracketSize - Total bracket size (8, 16, 32, 64, or 128)
 * @returns {Object} Result object with success status and placed participants
 */
function seedParticipants(participants, bracketSize) {
    try {
        if (!participants || participants.length === 0) {
            return {
                success: false,
                error: 'No participants to place'
            };
        }

        if (!bracketSize || ![8, 16, 32, 64, 128].includes(bracketSize)) {
            return {
                success: false,
                error: 'Invalid bracket size. Must be 8, 16, 32, 64, or 128'
            };
        }

        const result = placeByAvailability(participants, bracketSize);

        return {
            success: result.success,
            seeded: result.placed,  // Keep 'seeded' key for backwards compatibility
            placed: result.placed,
            participantCount: result.participantCount,
            bracketSize: result.bracketSize,
            stats: result.stats
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// CommonJS exports for UXP
module.exports = {
    seedParticipants
};
