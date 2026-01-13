/**
 * Pairing Engine
 * Generates tournament brackets from seeded participants
 * Handles 8, 16, 32, 64, and 128 player brackets with bye assignment
 */

/**
 * Generates a tournament bracket from seeded participants
 *
 * @param {Array} seededParticipants - Array of seeded participants (from seedingEngine)
 * @param {number} bracketSize - Total bracket size (8, 16, 32, 64, or 128)
 * @returns {Object} Bracket structure with all rounds and matches
 */
function generateBracket(seededParticipants, bracketSize) {
    try {
        if (!seededParticipants || seededParticipants.length === 0) {
            return {
                success: false,
                error: 'No participants provided'
            };
        }

        if (![8, 16, 32, 64, 128].includes(bracketSize)) {
            return {
                success: false,
                error: 'Invalid bracket size. Must be 8, 16, 32, 64, or 128'
            };
        }

        // Assign byes if needed
        const participantsWithByes = assignByes(seededParticipants, bracketSize);

        // Build bracket structure
        const bracket = buildBracketStructure(participantsWithByes, bracketSize);

        return {
            success: true,
            bracket,
            bracketSize,
            participantCount: seededParticipants.filter(p => p !== null).length,
            byeCount: participantsWithByes.filter(p => p && p.isBye).length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Assigns byes to fill bracket to proper size
 * Now preserves existing positions from seedingEngine (which handles Day/Night placement with BYEs)
 * Only fills null positions with BYEs if any remain
 *
 * @param {Array} participants - Array of participants (may already include BYEs from seedingEngine)
 * @param {number} bracketSize - Target bracket size
 * @returns {Array} Participants with any remaining nulls filled with BYEs
 */
function assignByes(participants, bracketSize) {
    // If the array already has BYEs (from seedingEngine), preserve positions
    const hasByes = participants.some(p => p && p.isBye);

    if (hasByes) {
        // seedingEngine already placed BYEs - just ensure array is correct size
        const result = new Array(bracketSize).fill(null);
        for (let i = 0; i < Math.min(participants.length, bracketSize); i++) {
            result[i] = participants[i];
        }
        // Fill any remaining nulls with BYEs (shouldn't happen, but safety check)
        for (let i = 0; i < bracketSize; i++) {
            if (result[i] === null) {
                result[i] = {
                    isBye: true,
                    name: 'BYE',
                    seed: null
                };
            }
        }
        return result;
    }

    // Legacy behavior: no BYEs from seedingEngine, place participants at top
    const actualParticipants = participants.filter(p => p !== null && p !== undefined);

    // If bracket is full, no byes needed
    if (actualParticipants.length === bracketSize) {
        return actualParticipants;
    }

    // Create new array with participants at top, BYEs at bottom
    const result = new Array(bracketSize).fill(null);

    // Place all actual participants at the beginning (top of bracket)
    for (let i = 0; i < actualParticipants.length; i++) {
        result[i] = actualParticipants[i];
    }

    // Place BYEs at the end (bottom of bracket)
    for (let i = actualParticipants.length; i < bracketSize; i++) {
        result[i] = {
            isBye: true,
            name: 'BYE',
            seed: null
        };
    }

    return result;
}

/**
 * Builds the bracket structure with Round 1 only
 * Subsequent rounds are handled manually outside the plugin
 *
 * @param {Array} participants - Array of participants with byes
 * @param {number} bracketSize - Bracket size (8, 16, or 32)
 * @returns {Object} Bracket structure with Round 1 only
 */
function buildBracketStructure(participants, bracketSize) {
    const bracket = {
        rounds: [],
        bracketSize,
        participantCount: participants.filter(p => !p.isBye).length
    };

    // Build only Round 1 - subsequent rounds are handled manually
    const round1 = buildRound1(participants);
    bracket.rounds.push(round1);

    return bracket;
}

/**
 * Builds the first round with actual participants
 *
 * @param {Array} participants - Array of participants
 * @returns {Object} Round 1 structure
 */
function buildRound1(participants) {
    const matches = [];
    const matchCount = participants.length / 2;

    for (let i = 0; i < matchCount; i++) {
        const player1 = participants[i * 2];
        const player2 = participants[i * 2 + 1];

        const match = {
            matchNumber: i + 1,
            player1: player1 || null,
            player2: player2 || null,
            winner: null
        };

        // Auto-advance if opponent is bye
        if (player1 && player2 && player2.isBye) {
            match.winner = player1;
        } else if (player2 && player1 && player1.isBye) {
            match.winner = player2;
        }

        matches.push(match);
    }

    return {
        roundNumber: 1,
        roundName: getRoundName(1, participants.length),
        matches
    };
}

/**
 * Gets the name for a round based on its position
 *
 * @param {number} roundNum - Round number (1-based)
 * @returns {string} Round name
 */
function getRoundName(roundNum) {
    return `Round ${roundNum}`;
}

/**
 * Gets a flat list of all matches across all rounds
 * Useful for template population
 *
 * @param {Object} bracket - Bracket structure from generateBracket
 * @returns {Array} Flat array of all matches with round info
 */
function getFlatMatchList(bracket) {
    const matches = [];

    bracket.rounds.forEach(round => {
        round.matches.forEach(match => {
            matches.push({
                ...match,
                roundNumber: round.roundNumber,
                roundName: round.roundName
            });
        });
    });

    return matches;
}

/**
 * Validates bracket structure
 * Ensures Round 1 matches are properly sized
 *
 * @param {Object} bracket - Bracket structure to validate
 * @returns {Object} Validation result
 */
function validateBracket(bracket) {
    const errors = [];

    // Check that Round 1 exists
    if (bracket.rounds.length !== 1) {
        errors.push(`Expected 1 round (Round 1 only), found ${bracket.rounds.length}`);
    }

    // Validate Round 1
    if (bracket.rounds[0]) {
        const round1 = bracket.rounds[0];
        const expectedMatches = bracket.bracketSize / 2;
        if (round1.matches.length !== expectedMatches) {
            errors.push(`Round 1: Expected ${expectedMatches} matches, found ${round1.matches.length}`);
        }

        // Check for null matches in Round 1
        const nullMatches = round1.matches.filter(m => !m.player1 && !m.player2).length;
        if (nullMatches > 0) {
            errors.push(`Round 1: Found ${nullMatches} empty matches`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Gets bracket statistics
 * Only tracks Round 1 since subsequent rounds are handled manually
 *
 * @param {Object} bracket - Bracket structure
 * @returns {Object} Statistics about the bracket
 */
function getBracketStats(bracket) {
    const round1 = bracket.rounds[0];
    const totalMatches = round1 ? round1.matches.length : 0;
    const completedMatches = round1 ? round1.matches.filter(m => m.winner).length : 0;

    return {
        bracketSize: bracket.bracketSize,
        participantCount: bracket.participantCount,
        totalRounds: 1,
        totalMatches,
        completedMatches,
        remainingMatches: totalMatches - completedMatches,
        currentRound: 1
    };
}

// CommonJS exports for UXP
module.exports = {
    generateBracket,
    getFlatMatchList,
    validateBracket,
    getBracketStats
};
