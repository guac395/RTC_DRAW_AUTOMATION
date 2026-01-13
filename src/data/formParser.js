/**
 * Google Form Response Parser
 * Parses tournament entry form responses from Google Sheets
 * Updated to parse event-specific tabs (First Name, Last Name, Email, Phone, Partner)
 */

const {
    parsePartnerString,
    getPartnerForEvent,
    processEntriesForEvent,
    deduplicateDoublesEntries,
    detectEventFromTabName,
    detectSportFromTabName
} = require('./partnerParser.js');

/**
 * Parse event tab data from Google Sheets
 * Format: First Name, Last Name, Email address, Phone Number, [Partner column for doubles]
 * Each row is an individual player
 */
function parseEventTabData(sheetValues, tabName, workbookName = '') {
    if (!sheetValues || sheetValues.length === 0) {
        return { success: false, error: 'No data in sheet' };
    }

    const headers = sheetValues[0];
    const rows = sheetValues.slice(1);

    // Determine if this is a singles or doubles event by checking for partner column
    const hasPartnerColumn = headers.some(h =>
        h.toLowerCase().includes('partner') ||
        h.toLowerCase().includes('doubles')
    );

    const entries = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.trim() === '')) {
            continue;
        }

        const entry = {
            firstName: '',
            lastName: '',
            playerName: '', // Will be "First Last"
            email: '',
            phone: '',
            partnerName: '',
            eventType: hasPartnerColumn ? 'doubles' : 'singles',
            eventName: tabName, // The tab name IS the event name
            _rowIndex: i + 2 // +2 for header row and 1-based indexing
        };

        // Map columns
        headers.forEach((header, colIndex) => {
            const normalized = header.toLowerCase().trim();
            const value = (row[colIndex] || '').toString().trim();

            if (normalized.includes('first') && normalized.includes('name')) {
                entry.firstName = value;
            } else if (normalized.includes('last') && normalized.includes('name')) {
                entry.lastName = value;
            } else if (normalized.includes('email')) {
                entry.email = value;
            } else if (normalized.includes('phone')) {
                entry.phone = value;
            } else if (normalized.includes('partner') || normalized.includes('doubles')) {
                entry.partnerName = value;
            } else if (
                normalized.includes('availability') ||
                normalized.includes('day/night') ||
                normalized.includes('day night') ||
                normalized.includes('session') ||
                normalized === 'd/n' ||
                normalized === 'dn'
            ) {
                const upperValue = value.toUpperCase().trim();
                if (upperValue === 'D' || upperValue === 'DAY') {
                    entry.availability = 'D';
                } else if (upperValue === 'N' || upperValue === 'NIGHT') {
                    entry.availability = 'N';
                }
            }
        });

        // Construct full player name
        entry.playerName = `${entry.firstName} ${entry.lastName}`.trim();

        // Only add entry if we have at least a name
        if (entry.playerName) {
            entries.push(entry);
        }
    }

    // For doubles events, parse the partner strings and deduplicate reciprocal entries
    let processedEntries = entries;
    if (hasPartnerColumn) {
        processedEntries = processEntriesForEvent(entries, tabName);
        processedEntries = deduplicateDoublesEntries(processedEntries);
    }

    const sport = detectSportFromTabName(tabName, workbookName);

    return {
        success: true,
        entries: processedEntries,
        totalCount: processedEntries.length,
        eventType: hasPartnerColumn ? 'doubles' : 'singles',
        eventName: tabName,
        sport: sport,
        detectedEvent: hasPartnerColumn ? detectEventFromTabName(tabName, sport) : null
    };
}


// CommonJS exports for UXP
module.exports = {
    parseEventTabData,
    // Re-export partner parsing utilities
    parsePartnerString,
    getPartnerForEvent
};
