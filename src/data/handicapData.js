/**
 * Handicap Data Management
 * Loads and manages player handicap data
 */

/**
 * Parses a Real Tennis handicap string to a numeric value.
 *
 * Real Tennis handicap convention:
 * - No symbol (e.g., "30") = positive number (weaker player)
 * - Plus symbol (e.g., "+5") = negative number (elite player, "plus" player)
 *
 * Lower numeric value = better player:
 * - +5 (elite) → stored as -5
 * - 0 (scratch) → stored as 0
 * - 30 (intermediate) → stored as 30
 * - 60 (beginner) → stored as 60
 *
 * @param {string|number} value - The handicap value to parse
 * @returns {number|null} The numeric handicap value, or null if invalid
 */
function parseRealTennisHandicap(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    // If already a number, return as-is (assume already converted)
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }

    const str = value.toString().trim();
    if (str === '') {
        return null;
    }

    // Check for plus sign prefix (elite/plus players)
    if (str.startsWith('+')) {
        const num = parseFloat(str.substring(1));
        return isNaN(num) ? null : -num; // Convert to negative
    }

    // No plus sign = regular handicap (positive number)
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
}

class HandicapDataManager {
    constructor() {
        this.players = [];
        this.playerIndex = new Map(); // For fast lookup by name
        this.isLoaded = false;
    }

    /**
     * Load handicap data from Google Sheets values array
     * Format: Singles HCAP, Doubles HCAP, Last Name, First Name, Email
     * First row is headers
     */
    loadFromSheetValues(sheetValues) {
        try {
            if (!sheetValues || sheetValues.length === 0) {
                throw new Error('No data in sheet');
            }

            const headers = sheetValues[0];
            const rows = sheetValues.slice(1);
            const players = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Skip empty rows
                if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
                    continue;
                }

                const player = {
                    singlesHCAP: null,
                    doublesHCAP: null,
                    firstName: '',
                    lastName: '',
                    name: '',
                    email: '',
                    sports: ['squash', 'court-tennis', 'racquets'] // Default to all sports
                };

                // Map columns by header name
                headers.forEach((header, colIndex) => {
                    const normalized = header.toLowerCase().trim();
                    const value = row[colIndex] ? row[colIndex].toString().trim() : '';

                    if (normalized.includes('singles') && normalized.includes('hcap')) {
                        player.singlesHCAP = parseRealTennisHandicap(value);
                    } else if (normalized.includes('doubles') && normalized.includes('hcap')) {
                        player.doublesHCAP = parseRealTennisHandicap(value);
                    } else if (normalized.includes('last') && normalized.includes('name')) {
                        player.lastName = value;
                    } else if (normalized.includes('first') && normalized.includes('name')) {
                        player.firstName = value;
                    } else if (normalized.includes('email')) {
                        player.email = value;
                    }
                });

                // Construct full name
                player.name = `${player.firstName} ${player.lastName}`.trim();

                // Only add if we have a name
                if (player.name) {
                    players.push(player);
                }
            }

            this.players = players;
            this.buildIndex();
            this.isLoaded = true;

            return {
                success: true,
                playerCount: this.players.length
            };
        } catch (error) {
            console.error('Failed to load handicap data from sheet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Normalize player object to standard format
     */
    normalizePlayer(rawPlayer) {
        return {
            name: this.extractName(rawPlayer),
            singlesHCAP: this.extractHandicap(rawPlayer, 'singles'),
            doublesHCAP: this.extractHandicap(rawPlayer, 'doubles'),
            sports: this.extractSports(rawPlayer),
            email: rawPlayer.email || rawPlayer.Email || null,
            phone: rawPlayer.phone || rawPlayer.Phone || null,
            age: rawPlayer.age || rawPlayer.Age || null
        };
    }

    /**
     * Extract player name from various possible field names
     */
    extractName(player) {
        return player.name || player.Name || player.playerName || player['Player Name'] || '';
    }

    /**
     * Extract handicap value (singles or doubles)
     */
    extractHandicap(player, type) {
        const fields = type === 'singles'
            ? ['singlesHCAP', 'Singles HCAP', 'singles', 'Singles', 'SinglesHandicap']
            : ['doublesHCAP', 'Doubles HCAP', 'doubles', 'Doubles', 'DoublesHandicap'];

        for (const field of fields) {
            if (player[field] !== undefined && player[field] !== null && player[field] !== '') {
                return parseRealTennisHandicap(player[field]);
            }
        }

        return null;
    }

    /**
     * Extract sports for player (some players may only play certain sports)
     */
    extractSports(player) {
        const sportsField = player.sports || player.Sports || player.sport || player.Sport;

        if (!sportsField) {
            // Default: all sports
            return ['squash', 'court-tennis', 'racquets'];
        }

        if (Array.isArray(sportsField)) {
            return sportsField;
        }

        // Parse comma-separated sports
        return sportsField.split(',').map(s => s.trim().toLowerCase());
    }

    /**
     * Build index for fast player lookup
     */
    buildIndex() {
        this.playerIndex.clear();

        this.players.forEach(player => {
            const normalizedName = this.normalizeName(player.name);
            this.playerIndex.set(normalizedName, player);
        });
    }

    /**
     * Find player by name with fuzzy matching
     */
    findPlayer(name, sport = null) {
        const normalized = this.normalizeName(name);

        // Exact match first
        let player = this.playerIndex.get(normalized);

        // Fuzzy match if exact fails
        if (!player) {
            player = this.fuzzyFindPlayer(name);
        }

        // Filter by sport if specified
        if (player && sport && !player.sports.includes(sport)) {
            return null;
        }

        return player;
    }

    /**
     * Fuzzy find player (handles typos, formatting differences)
     */
    fuzzyFindPlayer(searchName) {
        const normalized = this.normalizeName(searchName);

        // Try various matching strategies
        for (const player of this.players) {
            const playerNormalized = this.normalizeName(player.name);

            // Exact match
            if (playerNormalized === normalized) {
                return player;
            }

            // Last name match
            const searchLast = normalized.split(' ').pop();
            const playerLast = playerNormalized.split(' ').pop();
            if (searchLast === playerLast && searchLast.length > 3) {
                return player;
            }

            // Contains match (for partial names)
            if (playerNormalized.includes(normalized) || normalized.includes(playerNormalized)) {
                return player;
            }
        }

        return null;
    }

    /**
     * Normalize name for comparison
     */
    normalizeName(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z\s]/g, '') // Remove non-letters except spaces
            .replace(/\s+/g, ' '); // Normalize spaces
    }

    /**
     * Clear all data
     */
    clear() {
        this.players = [];
        this.playerIndex.clear();
        this.isLoaded = false;
    }
}

// Singleton instance
const handicapData = new HandicapDataManager();

// CommonJS export for UXP
module.exports = { handicapData, parseRealTennisHandicap };
