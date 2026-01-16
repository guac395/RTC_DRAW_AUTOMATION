/**
 * Bracket Placement Engine
 * Places participants into bracket positions using "play-in" style:
 * - Most participants get byes directly to Round 2
 * - Only enough play-in matches occur in Round 1 to fill Round 2
 * - Play-in matches are distributed randomly (not stacked)
 * - Day (D) players go to top of bracket (lower match numbers)
 * - Night (N) players start at halfway point (higher match numbers)
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
 * Places participants by availability (Day/Night) into bracket positions using play-in style.
 *
 * Play-in Style Rules:
 * - If bracket is FULL: All matches are real Round 1 matches (no play-ins needed)
 * - If bracket is PARTIAL: Use play-in style
 *   - Calculate how many play-in matches needed: participants - (bracketSize / 2)
 *   - If ≤ 0: Everyone gets a bye to Round 2
 *   - If > 0: That many play-in matches, rest get byes to Round 2
 *   - Play-in matches are distributed randomly (not stacked at bottom)
 *
 * Day/Night Rules:
 * - Day players go to top half (matches 1 to bracketSize/4)
 * - Night players go to bottom half (matches bracketSize/4+1 to bracketSize/2)
 * - Play-in matches distributed proportionally within each section
 *
 * Example: 73 players in 128-bracket:
 * - Round 2 has 64 slots
 * - Need 9 play-in matches (73 - 64 = 9 eliminations needed)
 * - 18 players randomly selected for play-ins
 * - 55 players get byes to Round 2
 * - Play-in matches spread across bracket, not stacked
 *
 * @param {Array} participants - Array of participant objects with availability
 * @param {number} bracketSize - Total bracket size (8, 16, 32, 64, or 128)
 * @returns {Object} Result with placed participants array
 */
function placeByAvailability(participants, bracketSize) {
    const totalPlayers = participants.length;
    const round1Matches = bracketSize / 2;
    const round2Slots = round1Matches; // Same as bracketSize / 2

    // If bracket is full, use standard placement (all Round 1 matches are real)
    if (totalPlayers === bracketSize) {
        return placeFullBracket(participants, bracketSize);
    }

    // Calculate play-in requirements
    const playInMatchCount = Math.max(0, totalPlayers - round2Slots);
    const playInParticipantCount = playInMatchCount * 2;
    const byeToRound2Count = totalPlayers - playInParticipantCount;

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
        // No availability data - pure random play-in placement
        return pureRandomPlayInPlacement(participants, bracketSize, playInMatchCount);
    }

    // Shuffle each group for randomness
    const shuffledDay = shuffle(dayPlayers);
    const shuffledNight = shuffle(nightPlayers);

    // Calculate how many play-in matches per section (proportional to player count)
    const dayPlayInMatches = Math.round(playInMatchCount * (dayPlayers.length / totalPlayers));
    const nightPlayInMatches = playInMatchCount - dayPlayInMatches;

    // Calculate how many players from each group go to play-ins vs get byes
    const dayPlayInPlayers = Math.min(dayPlayInMatches * 2, dayPlayers.length);
    const nightPlayInPlayers = Math.min(nightPlayInMatches * 2, nightPlayers.length);

    // Adjust if we don't have enough players in one section
    let actualDayPlayIn = dayPlayInPlayers;
    let actualNightPlayIn = nightPlayInPlayers;

    // If one section doesn't have enough, the other takes more
    const totalPlayInNeeded = playInParticipantCount;
    if (actualDayPlayIn + actualNightPlayIn < totalPlayInNeeded) {
        const shortfall = totalPlayInNeeded - (actualDayPlayIn + actualNightPlayIn);
        if (dayPlayers.length - actualDayPlayIn >= shortfall) {
            actualDayPlayIn += shortfall;
        } else if (nightPlayers.length - actualNightPlayIn >= shortfall) {
            actualNightPlayIn += shortfall;
        }
    }

    // Split players into play-in and bye-to-round-2
    const dayPlayInGroup = shuffledDay.slice(0, actualDayPlayIn);
    const dayByeGroup = shuffledDay.slice(actualDayPlayIn);
    const nightPlayInGroup = shuffledNight.slice(0, actualNightPlayIn);
    const nightByeGroup = shuffledNight.slice(actualNightPlayIn);

    // Create result array
    const result = new Array(bracketSize).fill(null);

    // Day section: matches 0 to (round1Matches/2 - 1) → positions 0 to (bracketSize/2 - 1)
    // Night section: matches (round1Matches/2) to (round1Matches - 1) → positions (bracketSize/2) to (bracketSize - 1)
    const halfSize = bracketSize / 2;
    const dayMatchCount = round1Matches / 2;
    const nightMatchCount = round1Matches / 2;

    // Randomly select which match slots in Day section are play-in matches
    const dayMatchSlots = Array.from({ length: dayMatchCount }, (_, i) => i);
    const shuffledDaySlots = shuffle(dayMatchSlots);
    const dayPlayInSlots = shuffledDaySlots.slice(0, Math.ceil(actualDayPlayIn / 2));
    const dayByeSlots = shuffledDaySlots.slice(Math.ceil(actualDayPlayIn / 2));

    // Randomly select which match slots in Night section are play-in matches
    const nightMatchSlots = Array.from({ length: nightMatchCount }, (_, i) => i);
    const shuffledNightSlots = shuffle(nightMatchSlots);
    const nightPlayInSlots = shuffledNightSlots.slice(0, Math.ceil(actualNightPlayIn / 2));
    const nightByeSlots = shuffledNightSlots.slice(Math.ceil(actualNightPlayIn / 2));

    // Place Day play-in matches (two players per match)
    let dayPlayInIdx = 0;
    for (const slot of dayPlayInSlots) {
        const pos1 = slot * 2;
        const pos2 = slot * 2 + 1;
        if (dayPlayInIdx < dayPlayInGroup.length) {
            result[pos1] = { ...dayPlayInGroup[dayPlayInIdx], seed: pos1 + 1 };
            dayPlayInIdx++;
        }
        if (dayPlayInIdx < dayPlayInGroup.length) {
            result[pos2] = { ...dayPlayInGroup[dayPlayInIdx], seed: pos2 + 1 };
            dayPlayInIdx++;
        }
    }

    // Place Day bye-to-round-2 players (one player + one BYE per match)
    let dayByeIdx = 0;
    for (const slot of dayByeSlots) {
        const pos1 = slot * 2;
        const pos2 = slot * 2 + 1;
        if (dayByeIdx < dayByeGroup.length) {
            result[pos1] = { ...dayByeGroup[dayByeIdx], seed: pos1 + 1 };
            result[pos2] = createBye();
            dayByeIdx++;
        } else {
            // No more Day players, fill with BYEs
            result[pos1] = createBye();
            result[pos2] = createBye();
        }
    }

    // Place Night play-in matches (two players per match)
    let nightPlayInIdx = 0;
    for (const slot of nightPlayInSlots) {
        const pos1 = halfSize + slot * 2;
        const pos2 = halfSize + slot * 2 + 1;
        if (nightPlayInIdx < nightPlayInGroup.length) {
            result[pos1] = { ...nightPlayInGroup[nightPlayInIdx], seed: pos1 + 1 };
            nightPlayInIdx++;
        }
        if (nightPlayInIdx < nightPlayInGroup.length) {
            result[pos2] = { ...nightPlayInGroup[nightPlayInIdx], seed: pos2 + 1 };
            nightPlayInIdx++;
        }
    }

    // Place Night bye-to-round-2 players (one player + one BYE per match)
    let nightByeIdx = 0;
    for (const slot of nightByeSlots) {
        const pos1 = halfSize + slot * 2;
        const pos2 = halfSize + slot * 2 + 1;
        if (nightByeIdx < nightByeGroup.length) {
            result[pos1] = { ...nightByeGroup[nightByeIdx], seed: pos1 + 1 };
            result[pos2] = createBye();
            nightByeIdx++;
        } else {
            // No more Night players, fill with BYEs
            result[pos1] = createBye();
            result[pos2] = createBye();
        }
    }

    // Fill any remaining nulls with BYEs (shouldn't happen, but safety)
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
            playInMatches: playInMatchCount,
            playInParticipants: playInParticipantCount,
            byeToRound2: byeToRound2Count,
            dayPlayInMatches: dayPlayInSlots.length,
            nightPlayInMatches: nightPlayInSlots.length,
            byeCount: bracketSize - totalPlayers
        }
    };
}

/**
 * Places a full bracket (all Round 1 matches are real matches)
 * @param {Array} participants - Array of participant objects
 * @param {number} bracketSize - Total bracket size
 * @returns {Object} Result with placed participants
 */
function placeFullBracket(participants, bracketSize) {
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

    const hasAvailability = dayPlayers.length > 0 || nightPlayers.length > 0;

    if (!hasAvailability) {
        // No availability - pure random
        const shuffled = shuffle(participants);
        const result = shuffled.map((p, i) => ({ ...p, seed: i + 1 }));
        return {
            success: true,
            placed: result,
            participantCount: participants.length,
            bracketSize,
            stats: {
                dayPlayers: 0,
                nightPlayers: 0,
                playInMatches: bracketSize / 2,
                fullBracket: true,
                byeCount: 0
            }
        };
    }

    // Shuffle each group
    const shuffledDay = shuffle(dayPlayers);
    const shuffledNight = shuffle(nightPlayers);

    const result = new Array(bracketSize).fill(null);
    const halfSize = bracketSize / 2;

    // Place Day players in top half
    for (let i = 0; i < shuffledDay.length && i < halfSize; i++) {
        result[i] = { ...shuffledDay[i], seed: i + 1 };
    }

    // Place Night players in bottom half
    for (let i = 0; i < shuffledNight.length && i < halfSize; i++) {
        const pos = halfSize + i;
        result[pos] = { ...shuffledNight[i], seed: pos + 1 };
    }

    // Handle overflow (if Day > halfSize or Night > halfSize)
    let overflowCursor = shuffledDay.length < halfSize ? shuffledDay.length : halfSize;

    // Day overflow goes after Day section
    for (let i = halfSize; i < shuffledDay.length; i++) {
        if (result[overflowCursor] === null) {
            result[overflowCursor] = { ...shuffledDay[i], seed: overflowCursor + 1 };
            overflowCursor++;
        }
    }

    // Night overflow fills remaining gaps
    let nightOverflowIdx = halfSize;
    for (let i = halfSize; i < shuffledNight.length; i++) {
        // Find next empty slot
        while (nightOverflowIdx < bracketSize && result[nightOverflowIdx] !== null) {
            nightOverflowIdx++;
        }
        if (nightOverflowIdx < bracketSize) {
            result[nightOverflowIdx] = { ...shuffledNight[i], seed: nightOverflowIdx + 1 };
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
            playInMatches: bracketSize / 2,
            fullBracket: true,
            byeCount: 0
        }
    };
}

/**
 * Pure random play-in placement when no availability data exists
 * Uses play-in style: distributes play-in matches randomly across bracket
 * @param {Array} participants - Array of participant objects
 * @param {number} bracketSize - Total bracket size
 * @param {number} playInMatchCount - Number of play-in matches needed
 * @returns {Object} Result with randomly placed participants
 */
function pureRandomPlayInPlacement(participants, bracketSize, playInMatchCount) {
    const shuffled = shuffle(participants);
    const result = new Array(bracketSize).fill(null);
    const round1Matches = bracketSize / 2;

    // If no play-ins needed (everyone gets a bye)
    if (playInMatchCount <= 0) {
        // Each player gets paired with a BYE
        const matchSlots = Array.from({ length: round1Matches }, (_, i) => i);
        const shuffledSlots = shuffle(matchSlots);

        for (let i = 0; i < shuffled.length && i < round1Matches; i++) {
            const slot = shuffledSlots[i];
            const pos1 = slot * 2;
            result[pos1] = { ...shuffled[i], seed: pos1 + 1 };
            result[pos1 + 1] = createBye();
        }

        // Fill remaining with double BYEs
        for (let i = shuffled.length; i < round1Matches; i++) {
            const slot = shuffledSlots[i];
            const pos1 = slot * 2;
            result[pos1] = createBye();
            result[pos1 + 1] = createBye();
        }
    } else {
        // Play-in style placement
        const playInParticipantCount = playInMatchCount * 2;

        const playInGroup = shuffled.slice(0, playInParticipantCount);
        const byeGroup = shuffled.slice(playInParticipantCount);

        // Randomly select match slots for play-ins
        const matchSlots = Array.from({ length: round1Matches }, (_, i) => i);
        const shuffledSlots = shuffle(matchSlots);
        const playInSlots = shuffledSlots.slice(0, playInMatchCount);
        const byeSlots = shuffledSlots.slice(playInMatchCount);

        // Place play-in matches (two players per match)
        let playInIdx = 0;
        for (const slot of playInSlots) {
            const pos1 = slot * 2;
            const pos2 = slot * 2 + 1;
            if (playInIdx < playInGroup.length) {
                result[pos1] = { ...playInGroup[playInIdx], seed: pos1 + 1 };
                playInIdx++;
            }
            if (playInIdx < playInGroup.length) {
                result[pos2] = { ...playInGroup[playInIdx], seed: pos2 + 1 };
                playInIdx++;
            }
        }

        // Place bye-to-round-2 players (one player + one BYE per match)
        let byeIdx = 0;
        for (const slot of byeSlots) {
            const pos1 = slot * 2;
            const pos2 = slot * 2 + 1;
            if (byeIdx < byeGroup.length) {
                result[pos1] = { ...byeGroup[byeIdx], seed: pos1 + 1 };
                result[pos2] = createBye();
                byeIdx++;
            } else {
                result[pos1] = createBye();
                result[pos2] = createBye();
            }
        }
    }

    // Fill any remaining nulls with BYEs
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
            dayPlayers: 0,
            nightPlayers: 0,
            randomPlacement: true,
            playInMatches: playInMatchCount,
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
