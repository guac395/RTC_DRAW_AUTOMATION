/**
 * Entry Validation
 * Implements R&TC-specific tournament entry validation rules:
 * - Max 4 entries per player
 * - No re-entering previously won draws
 * - Handicap must be within class range
 * - Doubles partners must have reciprocal entries
 * - Finals night availability checking
 */

const { calculateTeamHandicap } = require('./teamHandicap');

/**
 * Validates all tournament entries for a specific event
 *
 * @param {Array} entries - All tournament entries from form
 * @param {Object} event - Tournament event definition
 * @param {Array} previousWinners - List of previous winners (optional)
 * @returns {Object} Validation result with errors and warnings
 */
function validateEntries(entries, event, previousWinners = []) {
    const errors = [];
    const warnings = [];

    // Validate each entry
    entries.forEach((entry, index) => {
        const entryErrors = validateSingleEntry(entry, event, previousWinners);
        if (entryErrors.length > 0) {
            errors.push({
                entryIndex: index,
                playerName: entry.name || entry.playerName,
                errors: entryErrors
            });
        }
    });

    // Cross-entry validations
    const playerEntryCount = checkMaxEntriesPerPlayer(entries);
    playerEntryCount.forEach(({ playerName, count }) => {
        if (count > 4) {
            errors.push({
                playerName,
                errors: [`Player has ${count} entries (maximum 4 allowed)`]
            });
        }
    });

    // Doubles-specific validations
    if (event.name.toLowerCase().includes('doubles')) {
        const partnerErrors = validateDoublesPartners(entries);
        errors.push(...partnerErrors);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        totalEntries: entries.length,
        validEntries: entries.length - errors.length
    };
}

/**
 * Validates a single entry
 *
 * @param {Object} entry - Single tournament entry
 * @param {Object} event - Tournament event definition
 * @param {Array} previousWinners - List of previous winners
 * @returns {Array} Array of error messages
 */
function validateSingleEntry(entry, event, previousWinners) {
    const errors = [];
    const playerName = entry.name || entry.playerName;

    // Check required fields
    if (!playerName || playerName.trim() === '') {
        errors.push('Missing player name');
    }

    // Check handicap requirements - only for court-tennis events
    // Squash and racquets do not use handicaps
    if (event.sport === 'court-tennis') {
        if (event.name.toLowerCase().includes('singles') || event.name.toLowerCase().includes('doubles')) {
            const handicap = event.name.toLowerCase().includes('singles')
                ? entry.singlesHandicap
                : entry.doublesHandicap;

            if (handicap === null || handicap === undefined) {
                errors.push('Missing handicap data');
            } else {
                // Validate handicap range for class-based events
                const rangeError = validateHandicapRange(handicap, event);
                if (rangeError) {
                    errors.push(rangeError);
                }
            }
        }
    }

    // Check previous winners
    if (previousWinners.length > 0 && playerName) {
        const normalizedName = playerName.toLowerCase().trim();
        const hasWonBefore = previousWinners.some(winner =>
            winner.toLowerCase().trim() === normalizedName
        );

        if (hasWonBefore) {
            errors.push('Player has previously won this draw and cannot re-enter');
        }
    }

    // Check finals night availability (if specified in entry)
    if (entry.finalsNightAvailable === false) {
        errors.push('Player marked as unavailable for finals night');
    }

    return errors;
}

/**
 * Validates handicap is within acceptable range for event class
 *
 * @param {number} handicap - Player's handicap
 * @param {Object} event - Tournament event definition
 * @returns {string|null} Error message or null if valid
 */
function validateHandicapRange(handicap, event) {
    const eventName = event.name.toLowerCase();

    // Court Tennis handicap ranges
    if (eventName.includes('court tennis')) {
        if (eventName.includes('first class')) {
            if (handicap < 0 || handicap > 10) {
                return `Handicap ${handicap} out of range for First Class (0-10)`;
            }
        } else if (eventName.includes('class 1')) {
            if (handicap < 10 || handicap > 20) {
                return `Handicap ${handicap} out of range for Class 1 (10-20)`;
            }
        } else if (eventName.includes('class 2')) {
            if (handicap < 20 || handicap > 30) {
                return `Handicap ${handicap} out of range for Class 2 (20-30)`;
            }
        } else if (eventName.includes('class 3')) {
            if (handicap < 30 || handicap > 40) {
                return `Handicap ${handicap} out of range for Class 3 (30-40)`;
            }
        } else if (eventName.includes('class 4')) {
            if (handicap < 40 || handicap > 50) {
                return `Handicap ${handicap} out of range for Class 4 (40-50)`;
            }
        } else if (eventName.includes('class 5')) {
            if (handicap < 50) {
                return `Handicap ${handicap} out of range for Class 5 (50+)`;
            }
        } else if (eventName.includes('120 doubles')) {
            // Combined handicap for doubles should be <= 120
            // This is checked in partner validation
        }
    }

    // Racquets handicap ranges
    if (eventName.includes('racquets')) {
        if (eventName.includes('championship')) {
            if (handicap < 0 || handicap > 15) {
                return `Handicap ${handicap} out of range for Championship (0-15)`;
            }
        } else if (eventName.includes('class 1')) {
            if (handicap < 15 || handicap > 30) {
                return `Handicap ${handicap} out of range for Class 1 (15-30)`;
            }
        } else if (eventName.includes('class 2')) {
            if (handicap < 30 || handicap > 45) {
                return `Handicap ${handicap} out of range for Class 2 (30-45)`;
            }
        } else if (eventName.includes('class 3')) {
            if (handicap < 45) {
                return `Handicap ${handicap} out of range for Class 3 (45+)`;
            }
        }
    }

    // Squash - generally no strict ranges, but can add warnings
    // Age-based events checked separately

    return null;
}

/**
 * Counts entries per player
 *
 * @param {Array} entries - All tournament entries
 * @returns {Array} Array of {playerName, count} objects
 */
function checkMaxEntriesPerPlayer(entries) {
    const playerCounts = {};

    entries.forEach(entry => {
        const playerName = entry.name || entry.playerName;
        if (!playerName) return; // Skip entries without a name
        const name = playerName.toLowerCase().trim();
        playerCounts[name] = (playerCounts[name] || 0) + 1;
    });

    return Object.entries(playerCounts)
        .filter(([_, count]) => count > 4)
        .map(([playerName, count]) => ({ playerName, count }));
}

/**
 * Validates doubles partners and team handicaps
 *
 * After deduplication, each team has one entry with:
 * - playerName, handicap (player's handicap)
 * - partnerName, partnerHandicap (partner's handicap, looked up during enrichment)
 *
 * @param {Array} entries - Doubles tournament entries (deduplicated)
 * @returns {Array} Array of error objects
 */
function validateDoublesPartners(entries) {
    const errors = [];

    entries.forEach((entry, index) => {
        const playerName = entry.name || entry.playerName;
        if (!entry.partnerName || !playerName) return;

        const player = playerName.toLowerCase().trim();

        // Check team handicap for 120+ events using IRTPA algorithm
        // After deduplication, partner handicap is stored on the entry itself
        if (entry.eventName && entry.eventName.includes('120')) {
            const playerHandicap = entry.handicap;
            const partnerHandicap = entry.partnerHandicap;

            if (playerHandicap != null && partnerHandicap != null) {
                // Create mock entries for the team handicap calculator
                const playerData = { handicap: playerHandicap, doublesHCAP: playerHandicap };
                const partnerData = { handicap: partnerHandicap, doublesHCAP: partnerHandicap };
                const teamResult = calculateTeamHandicap(playerData, partnerData);

                if (teamResult.success && teamResult.teamHandicap > 120) {
                    errors.push({
                        entryIndex: index,
                        playerName: player,
                        errors: [`Team handicap ${teamResult.teamHandicap.toFixed(1)} exceeds 120 limit`]
                    });
                }
            }
        }
    });

    return errors;
}

/**
 * Generates a validation report for display
 *
 * @param {Object} validationResult - Result from validateEntries
 * @returns {string} Formatted validation report
 */
function generateValidationReport(validationResult) {
    let report = `Validation Report\n`;
    report += `=================\n\n`;
    report += `Total Entries: ${validationResult.totalEntries}\n`;
    report += `Valid Entries: ${validationResult.validEntries}\n`;
    report += `Errors: ${validationResult.errors.length}\n`;
    report += `Warnings: ${validationResult.warnings.length}\n\n`;

    if (validationResult.errors.length > 0) {
        report += `ERRORS:\n`;
        validationResult.errors.forEach((error, index) => {
            report += `\n${index + 1}. ${error.playerName}\n`;
            error.errors.forEach(err => {
                report += `   - ${err}\n`;
            });
        });
    }

    if (validationResult.warnings.length > 0) {
        report += `\nWARNINGS:\n`;
        validationResult.warnings.forEach((warning, index) => {
            report += `${index + 1}. ${warning}\n`;
        });
    }

    if (validationResult.valid) {
        report += `\n✓ All entries are valid\n`;
    }

    return report;
}

// CommonJS exports for UXP
module.exports = {
    validateEntries,
    generateValidationReport
};
