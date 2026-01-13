/**
 * Partner String Parser
 * Parses complex partner response strings to extract event-specific partner names
 * Handles various user input formats for doubles partner listings
 */

/**
 * Event alias mappings for each sport's doubles events
 * Maps user input variations to canonical event names
 */
const EVENT_ALIASES = {
    squash: {
        'a': 'Doubles A',
        'doubles a': 'Doubles A',
        'a draw': 'Doubles A',
        'club': 'Doubles A',
        'club championship': 'Doubles A',
        'champ': 'Doubles A',
        'championship': 'Doubles A',

        'b': 'Doubles B',
        'doubles b': 'Doubles B',
        'b draw': 'Doubles B',

        'c': 'Doubles C',
        'doubles c': 'Doubles C',
        'c draw': 'Doubles C',

        'd': 'Doubles D',
        'doubles d': 'Doubles D',
        'd draw': 'Doubles D',

        'century': 'Doubles Century',
        'cent': 'Doubles Century',
        '100': 'Doubles Century',
        'century class': 'Doubles Century',
        'century doubles': 'Doubles Century',
        'cc': 'Doubles Century', // Note: Could be ambiguous with "Club Championship"
    },

    'court-tennis': {
        'club': 'Doubles Club Championship',
        'club championship': 'Doubles Club Championship',
        'club champs': 'Doubles Club Championship',
        'club champ': 'Doubles Club Championship',
        'champ': 'Doubles Club Championship',
        'champs': 'Doubles Club Championship',
        'championship': 'Doubles Club Championship',
        'ct club': 'Doubles Club Championship',
        'ct champ': 'Doubles Club Championship',
        'cc': 'Doubles Club Championship',

        '1st': 'Doubles 1st Class',
        '1': 'Doubles 1st Class',
        '1st class': 'Doubles 1st Class',
        '1stclass': 'Doubles 1st Class',
        '1st class-': 'Doubles 1st Class',
        'first': 'Doubles 1st Class',
        'first class': 'Doubles 1st Class',
        'class 1': 'Doubles 1st Class',

        '2nd': 'Doubles 2nd Class',
        '2': 'Doubles 2nd Class',
        '2nd class': 'Doubles 2nd Class',
        '2ndclass': 'Doubles 2nd Class',
        '2nd class-': 'Doubles 2nd Class',
        'second': 'Doubles 2nd Class',
        'second class': 'Doubles 2nd Class',
        'class 2': 'Doubles 2nd Class',

        '3rd': 'Doubles 3rd Class',
        '3': 'Doubles 3rd Class',
        '3rd class': 'Doubles 3rd Class',
        '3 rd class': 'Doubles 3rd Class',
        'third': 'Doubles 3rd Class',
        'third class': 'Doubles 3rd Class',
        'class 3': 'Doubles 3rd Class',

        '4th': 'Doubles 4th Class',
        '4': 'Doubles 4th Class',
        '4th class': 'Doubles 4th Class',
        '4 th class': 'Doubles 4th Class',
        'fourth': 'Doubles 4th Class',
        'fourth class': 'Doubles 4th Class',
        'class 4': 'Doubles 4th Class',

        '5th': 'Doubles 5th Class',
        '5': 'Doubles 5th Class',
        '5th class': 'Doubles 5th Class',
        '5 th class': 'Doubles 5th Class',
        'fifth': 'Doubles 5th Class',
        'fifth class': 'Doubles 5th Class',
        'class 5': 'Doubles 5th Class',

        '120': 'Doubles 120+',
        '120+': 'Doubles 120+',
        '120 doubles': 'Doubles 120+',
        'combined 120': 'Doubles 120+',
        '120+doubles': 'Doubles 120+',
    },

    racquets: {
        'club': 'Doubles Club Championship',
        'club championship': 'Doubles Club Championship',
        'club champs': 'Doubles Club Championship',
        'club champ': 'Doubles Club Championship',
        'champ': 'Doubles Club Championship',
        'champs': 'Doubles Club Championship',
        'championship': 'Doubles Club Championship',
        'racq club': 'Doubles Club Championship',
        'racq champ': 'Doubles Club Championship',
        'cc': 'Doubles Club Championship',

        '1st': 'Doubles 1st Class',
        '1': 'Doubles 1st Class',
        '1st class': 'Doubles 1st Class',
        '1st class-': 'Doubles 1st Class',
        '1stclass': 'Doubles 1st Class',
        'first': 'Doubles 1st Class',
        'first class': 'Doubles 1st Class',
        'class 1': 'Doubles 1st Class',

        '2nd': 'Doubles 2nd Class',
        '2': 'Doubles 2nd Class',
        '2nd class': 'Doubles 2nd Class',
        '2nd class-': 'Doubles 2nd Class',
        '2ndclass': 'Doubles 2nd Class',
        'second': 'Doubles 2nd Class',
        'second class': 'Doubles 2nd Class',
        'class 2': 'Doubles 2nd Class',
    }
};

/**
 * Patterns that indicate TBD/incomplete entries
 */
const TBD_PATTERNS = [
    /\btbd\b/i,
    /\blooking\b/i,
    /\bneeded?\b/i,
    /\bpstfp\b/i,  // "Please See The Following Person" or similar abbreviation
    /\bunknown\b/i,
    /\btba\b/i,
    /\bopen\b/i,
    /^n\/?a$/i,                    // N/A
    /\bpro\s*shop\b/i,             // "pro shop" - asking pro shop to find partner
    /\bnot\s+sure\b/i,             // "not sure"
    /\bcan\s+.*\s+find\b/i,        // "can someone find"
];

/**
 * Detect the sport from the workbook name and/or tab name
 * Checks workbook name first, then tab name, then defaults to squash
 */
function detectSportFromTabName(tabName, workbookName = '') {
    const normalizedWorkbook = workbookName.toLowerCase();
    const normalizedTab = tabName.toLowerCase();

    // Check workbook name first (e.g., "Tennis Events", "Squash Tournament")
    if (normalizedWorkbook.includes('squash')) return 'squash';
    if (normalizedWorkbook.includes('racquet')) return 'racquets';
    if (normalizedWorkbook.includes('tennis')) return 'court-tennis';

    // Fall back to tab name
    if (normalizedTab.includes('squash')) return 'squash';
    if (normalizedTab.includes('racquet')) return 'racquets';
    if (normalizedTab.includes('tennis')) return 'court-tennis';

    // Default to squash if unclear
    return 'squash';
}

/**
 * Detect the event class from the tab name
 * Returns the canonical event name if found
 */
function detectEventFromTabName(tabName, sport) {
    const normalized = tabName.toLowerCase();
    const aliases = EVENT_ALIASES[sport] || EVENT_ALIASES.squash;

    // Try to extract event letter/class from tab name first (more specific)
    // e.g., "Squash Events - Doubles B" -> "b"
    const letterMatch = normalized.match(/doubles?\s*([a-e])\b/i);
    if (letterMatch) {
        const letter = letterMatch[1].toLowerCase();
        return aliases[letter] || null;
    }

    // Check for "century" specifically
    if (normalized.includes('century')) {
        return aliases['century'] || null;
    }

    // Check for class numbers (1st, 2nd, etc.)
    const classMatch = normalized.match(/(\d+)(?:st|nd|rd|th)?\s*class/i);
    if (classMatch) {
        return aliases[classMatch[1]] || null;
    }

    // Check for 120+ event
    if (normalized.includes('120')) {
        return aliases['120'] || aliases['120+'] || null;
    }

    // Check for championship
    if (normalized.includes('championship') || normalized.includes('club champ')) {
        return aliases['club championship'] || aliases['championship'] || null;
    }

    return null;
}

/**
 * Check if a string appears to be ONLY a TBD/incomplete entry
 * Returns true only if the entire string is a TBD indicator, not if it contains one
 */
function isTBDEntry(str) {
    if (!str || str.trim() === '') return true;
    const normalized = str.trim().toLowerCase();

    // For short strings (likely just a TBD indicator), check against patterns
    if (normalized.length < 25) {
        return TBD_PATTERNS.some(pattern => pattern.test(normalized));
    }

    // For longer strings, check if it's asking for help finding a partner
    // or is otherwise a non-partner response
    const helpFindingPatterns = [
        /\bnot\s+sure\b/i,
        /\bpro\s*shop\b/i,
        /\bfind\s+(one|a\s+partner|me|someone)\b/i,
        /\blooking\s+for\b/i,
        /\bneed\s+(a\s+)?partner\b/i,
    ];

    if (helpFindingPatterns.some(pattern => pattern.test(normalized))) {
        return true;
    }

    // For longer strings, only return true if it's EXACTLY a TBD pattern
    // (not containing other content like partner names)
    const exactTBDPatterns = [
        /^tbd\.?$/i,
        /^looking\.?$/i,
        /^needed?\.?$/i,
        /^n\/?a$/i,
        /^tba\.?$/i,
        /^unknown\.?$/i,
    ];

    return exactTBDPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Resolve an event alias to its canonical name
 */
function resolveEventAlias(alias, sport) {
    if (!alias) return null;

    const normalized = alias.trim().toLowerCase();
    const sportAliases = EVENT_ALIASES[sport] || EVENT_ALIASES.squash;

    return sportAliases[normalized] || null;
}

/**
 * Parse a partner string to extract event-partner pairs
 *
 * @param {string} partnerString - The raw partner response from the form
 * @param {string} tabName - The tab/event name for context
 * @returns {Object} Parsed result with partners array and metadata
 */
function parsePartnerString(partnerString, tabName) {
    const result = {
        partners: [],        // Array of { event, partnerName, isTBD, confidence }
        rawInput: partnerString,
        tabName: tabName,
        sport: detectSportFromTabName(tabName),
        currentEvent: null,
        warnings: [],
        hasAmbiguity: false
    };

    // Detect current event from tab name
    result.currentEvent = detectEventFromTabName(tabName, result.sport);

    if (!partnerString || partnerString.trim() === '') {
        result.warnings.push('Empty partner field');
        return result;
    }

    const trimmed = partnerString.trim();

    // Check if entire string is TBD
    if (isTBDEntry(trimmed)) {
        result.partners.push({
            event: result.currentEvent,
            partnerName: null,
            isTBD: true,
            confidence: 'high',
            rawSegment: trimmed
        });
        return result;
    }

    // Try different parsing strategies
    const parsed = tryAllParsingStrategies(trimmed, result.sport, result.currentEvent);

    result.partners = parsed.partners;
    result.warnings = result.warnings.concat(parsed.warnings);
    result.hasAmbiguity = parsed.hasAmbiguity;

    return result;
}

/**
 * Try multiple parsing strategies and return the best result
 */
function tryAllParsingStrategies(input, sport, currentEvent) {
    const strategies = [
        parseEventPrefixFormat,      // "B - Ted Danforth, C - Mike"
        parseNameDashEventFormat,    // "David King - 120+, Raphael Corkhill - 5th Class"
        parseWithKeywordFormat,      // "A with Rick Burke and B with Jon" or "120+ w/ Jim"
        parseForTheFormat,           // "Andrew for the B, Ned for C"
        parseTBDEventFormat,         // "TBD (4th Class), TBD for 1st Class"
        parseParentheticalFormat,    // "Peter Hansen (B) / Darren Fogel (Century)"
        parseSlashWithEventFormat,   // "Browning platt / B; Peter Corbett / C"
        parseMixedEventNameFormat,   // "Century Callis, C Tbd, B tbd" or "B TBD C Draw (Rex)"
        parseSimpleListFormat,       // "Jamie Wilson" or "Jamie Wilson, Bob Smith"
    ];

    for (const strategy of strategies) {
        const result = strategy(input, sport, currentEvent);
        if (result.partners.length > 0) {
            return result;
        }
    }

    // Fallback: treat entire string as single partner for current event
    return {
        partners: [{
            event: currentEvent,
            partnerName: cleanPartnerName(input),
            isTBD: false,
            confidence: 'low',
            rawSegment: input
        }],
        warnings: ['Could not parse partner format, treating as single name'],
        hasAmbiguity: true
    };
}

/**
 * Parse format: "B - Ted Danforth, C - Mike Pilkington"
 * Also handles: "CC - Rob Parker, B - Richard Burke"
 * Also handles mixed: "Carter Clarke, Century - Barclay Jones" (name for current event + event-prefixed)
 */
function parseEventPrefixFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Pattern: event indicator followed by dash/colon and name
    // Split on comma first, then parse each segment
    const segments = splitOnDelimiters(input);

    let matchedAny = false;
    const unmatchedSegments = [];

    for (const segment of segments) {
        // Only proceed if there's actually a separator (dash or colon)
        if (!segment.includes('-') && !segment.includes(':')) {
            unmatchedSegments.push(segment);
            continue;
        }

        // Match patterns like "B - Name", "CC - Name", "Century - Name", "1st - Name", "1st class- Name"
        // The dash can be attached to "class" like "1st class-"
        const match = segment.match(/^(\d+(?:st|nd|rd|th)?\s*class-?|[a-z0-9]+(?:\s*(?:class|draw))?)\s*[-:]\s*(.+)$/i);

        if (match) {
            const eventAlias = match[1].trim().replace(/-$/, ''); // Remove trailing dash from event
            const partnerName = match[2].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                    isTBD: isTBDEntry(partnerName),
                    confidence: 'high',
                    rawSegment: segment
                });
            } else {
                unmatchedSegments.push(segment);
            }
        } else {
            unmatchedSegments.push(segment);
        }
    }

    // If we matched some event-prefixed entries, try to parse unmatched segments with mixed format
    if (matchedAny && unmatchedSegments.length > 0) {
        for (const segment of unmatchedSegments) {
            // Try to parse as "120+ Name" or "5th Name" format
            const numericMatch = segment.match(/^(\d+\+?(?:st|nd|rd|th)?)\s+([A-Z][a-zA-Z]+(?:\s+[a-zA-Z]+)*)$/);
            if (numericMatch) {
                const eventAlias = numericMatch[1].trim();
                const partnerName = numericMatch[2].trim();
                const resolvedEvent = resolveEventAlias(eventAlias, sport);

                if (resolvedEvent) {
                    result.partners.push({
                        event: resolvedEvent,
                        partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                        isTBD: isTBDEntry(partnerName),
                        confidence: 'high',
                        rawSegment: segment
                    });
                    continue;
                }
            }

            // Otherwise, if it looks like a name, add for current event
            if (currentEvent && looksLikeName(segment) && !isTBDEntry(segment)) {
                result.partners.push({
                    event: currentEvent,
                    partnerName: cleanPartnerName(segment),
                    isTBD: false,
                    confidence: 'medium',
                    rawSegment: segment
                });
            }
        }
    }

    if (!matchedAny) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Check if a string looks like a person's name
 */
function looksLikeName(str) {
    if (!str || str.length < 2) return false;

    // Names typically start with capital letter and have letters
    const trimmed = str.trim();

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(trimmed)) return false;

    // Should have at least one space (first and last name) or be a single word
    // Avoid matching things like "B" or "CC" alone
    if (trimmed.length < 3) return false;

    // Should not be just a single uppercase letter or common event alias
    if (/^[A-E]$/i.test(trimmed)) return false;
    if (/^(cc|tbd|looking)$/i.test(trimmed)) return false;

    return true;
}

/**
 * Parse format: "David King - 120+, Raphael Corkhill - 5th Class"
 * Name followed by dash and event
 */
function parseNameDashEventFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Split on comma/semicolon first
    const segments = input.split(/[,;]/).map(s => s.trim()).filter(s => s);
    let matchedAny = false;

    for (const segment of segments) {
        // Pattern: Name - Event (where event comes after the dash)
        // Must have name with at least 2 words before the dash
        const match = segment.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–]\s*(\d+\+?|\d+(?:st|nd|rd|th)?\s*(?:class)?|[a-z]+(?:\s+class)?)$/i);

        if (match) {
            const partnerName = match[1].trim();
            const eventAlias = match[2].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: cleanPartnerName(partnerName),
                    isTBD: false,
                    confidence: 'high',
                    rawSegment: segment
                });
            }
        }
    }

    if (!matchedAny) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse format: "TBD (4th Class), TBD (5th Class)" or "TBD for 1st Class"
 */
function parseTBDEventFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Pattern 1: TBD (Event) - TBD followed by event in parentheses
    const parenPattern = /\btbd\s*\(([^)]+)\)/gi;
    let match;
    while ((match = parenPattern.exec(input)) !== null) {
        const eventAlias = match[1].trim();
        const resolvedEvent = resolveEventAlias(eventAlias, sport);

        if (resolvedEvent) {
            result.partners.push({
                event: resolvedEvent,
                partnerName: null,
                isTBD: true,
                confidence: 'high',
                rawSegment: match[0]
            });
        }
    }

    // Pattern 2: TBD for Event
    const forPattern = /\btbd\s+for\s+(\d+(?:st|nd|rd|th)?\s*(?:class)?|[a-z]+(?:\s+class)?)/gi;
    while ((match = forPattern.exec(input)) !== null) {
        const eventAlias = match[1].trim();
        const resolvedEvent = resolveEventAlias(eventAlias, sport);

        if (resolvedEvent) {
            result.partners.push({
                event: resolvedEvent,
                partnerName: null,
                isTBD: true,
                confidence: 'high',
                rawSegment: match[0]
            });
        }
    }

    if (result.partners.length === 0) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse format: "A with Rick Burke and B with Jon Lanman"
 * Also handles: "120 doubles with Mike", "120+ w/ Jim Ayer", "Club Championship with Daelum"
 */
function parseWithKeywordFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Pattern: event "with" or "w/" name
    // Event can be "120 doubles", "120+", "A", "B", "Club Championship", "1st Class", etc.
    const pattern = /(\d+\+?(?:\s*doubles?)?|(?:club\s+)?championship|[a-z0-9]+(?:\s*(?:class|draw))?)\s+(?:with|w\/)\s+([^,]+?)(?=\s+and\s+|\s*,\s*|$)/gi;
    let match;
    let matchedAny = false;

    while ((match = pattern.exec(input)) !== null) {
        const eventAlias = match[1].trim();
        const partnerName = match[2].trim();
        const resolvedEvent = resolveEventAlias(eventAlias, sport);

        if (resolvedEvent) {
            matchedAny = true;
            result.partners.push({
                event: resolvedEvent,
                partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                isTBD: isTBDEntry(partnerName),
                confidence: 'high',
                rawSegment: match[0]
            });
        }
    }

    if (!matchedAny) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse format: "Andrew Braff for the B, Ned Pierrepont for C"
 * Also handles: "Rob Parker for club champs, Chris Oberbeck for first class"
 * Also handles: "century TBD" at end of string
 */
function parseForTheFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Track which events we've found partners for (to avoid duplicates)
    const eventsFound = new Set();

    // Pattern: name "for the" event or name "for" event
    // Event can be: "B", "the B", "club champs", "first class", "1st class", "120+", etc.
    const pattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+for\s+(?:the\s+)?(\d+\+?(?:st|nd|rd|th)?(?:\s*class)?|(?:club\s+)?champs?|(?:first|second|third|fourth|fifth)\s+class|[a-z]+(?:\s+class)?)(?:\s*,|\s+and\s+|$)/gi;
    let match;

    while ((match = pattern.exec(input)) !== null) {
        const partnerName = match[1].trim();
        const eventAlias = match[2].trim();
        const resolvedEvent = resolveEventAlias(eventAlias, sport);

        if (resolvedEvent && !eventsFound.has(resolvedEvent)) {
            eventsFound.add(resolvedEvent);
            result.partners.push({
                event: resolvedEvent,
                partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                isTBD: isTBDEntry(partnerName),
                confidence: 'high',
                rawSegment: match[0]
            });
        }
    }

    // Handle "event TBD" patterns (e.g., "century TBD", "B tbd", "and century TBD")
    // Only add if we haven't already found a partner for that event
    const tbdPattern = /(?:^|,\s*|\band\s+)([a-z0-9]+(?:\s*(?:class|draw))?)\s+(?:tbd|looking|needed?)\b/gi;
    let tbdMatch;
    while ((tbdMatch = tbdPattern.exec(input)) !== null) {
        const eventAlias = tbdMatch[1].trim();
        const resolvedEvent = resolveEventAlias(eventAlias, sport);
        if (resolvedEvent && !eventsFound.has(resolvedEvent)) {
            eventsFound.add(resolvedEvent);
            result.partners.push({
                event: resolvedEvent,
                partnerName: null,
                isTBD: true,
                confidence: 'high',
                rawSegment: tbdMatch[0]
            });
        }
    }

    if (result.partners.length === 0) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse format: "Peter Hansen (B) / Darren Fogel (Century)"
 * Also handles: "Will WInmill (B) Allen Sperry (Century)"
 */
function parseParentheticalFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Pattern: name followed by (event) in parentheses
    const pattern = /([a-z][a-z\s.'-]+?)\s*\(([^)]+)\)/gi;
    let match;
    let matchedAny = false;

    while ((match = pattern.exec(input)) !== null) {
        const partnerName = match[1].trim();
        const eventPart = match[2].trim();

        // The event part might contain additional info like "B - right wall"
        const eventAlias = eventPart.split(/[-–]/)[0].trim();
        const resolvedEvent = resolveEventAlias(eventAlias, sport);

        if (resolvedEvent) {
            matchedAny = true;
            result.partners.push({
                event: resolvedEvent,
                partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                isTBD: isTBDEntry(partnerName),
                confidence: 'high',
                rawSegment: match[0]
            });
        }
    }

    if (!matchedAny) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse format: "Browning platt / B; Peter Corbett / C"
 * Name followed by slash and event
 */
function parseSlashWithEventFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Split on semicolon or comma first
    const segments = input.split(/[;,]/).map(s => s.trim()).filter(s => s);
    let matchedAny = false;

    for (const segment of segments) {
        // Pattern: name / event
        const match = segment.match(/^([^/]+)\s*\/\s*([a-z0-9]+(?:\s*(?:class|draw))?)$/i);

        if (match) {
            const partnerName = match[1].trim();
            const eventAlias = match[2].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                    isTBD: isTBDEntry(partnerName),
                    confidence: 'high',
                    rawSegment: segment
                });
            }
        }
    }

    if (!matchedAny) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse mixed format: "Century Callis, C Tbd, B tbd" or "B TBD C Draw (Rex Riefler)"
 * Also handles: "120+ Will Rand", "120 Chris Moore", "5th Chris Mahan"
 * Handles cases where event letter/name comes before the partner name or TBD
 */
function parseMixedEventNameFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Split on commas and semicolons first
    const segments = input.split(/[,;]/).map(s => s.trim()).filter(s => s);

    let matchedAny = false;

    for (const segment of segments) {
        // Pattern 1: "120+ Name" or "120 Name" or "5th Name" (numeric event followed by name)
        // Name can have lowercase words like "the" in "Winston Simone the younger"
        const numericEventMatch = segment.match(/^(\d+\+?(?:st|nd|rd|th)?)\s+([A-Z][a-zA-Z]+(?:\s+[a-zA-Z]+)*)$/);
        if (numericEventMatch) {
            const eventAlias = numericEventMatch[1].trim();
            const partnerName = numericEventMatch[2].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                    isTBD: isTBDEntry(partnerName),
                    confidence: 'high',
                    rawSegment: segment
                });
                continue;
            }
        }

        // Pattern 2: "Event Name" (e.g., "Century Callis", "B John Smith")
        // Event letter/word at start, followed by name
        const eventFirstMatch = segment.match(/^([a-z0-9]+(?:\s*(?:class|draw))?)\s+([a-z][a-z\s.'-]+)$/i);

        if (eventFirstMatch) {
            const eventAlias = eventFirstMatch[1].trim();
            const partnerOrTBD = eventFirstMatch[2].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: isTBDEntry(partnerOrTBD) ? null : cleanPartnerName(partnerOrTBD),
                    isTBD: isTBDEntry(partnerOrTBD),
                    confidence: 'medium',
                    rawSegment: segment
                });
                continue;
            }
        }

        // Pattern 3: "B TBD" or "Century TBD" or "4th tbd" (short form)
        const tbdMatch = segment.match(/^(\d+(?:st|nd|rd|th)?|[a-z0-9]+(?:\s*(?:class|draw))?)\s+(tbd|looking|needed?)\s*$/i);
        if (tbdMatch) {
            const eventAlias = tbdMatch[1].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: null,
                    isTBD: true,
                    confidence: 'high',
                    rawSegment: segment
                });
                continue;
            }
        }

        // Pattern 4: "C Draw (Rex Riefler)" - event with "Draw" keyword and name in parens
        const drawMatch = segment.match(/^([a-z0-9]+)\s*(?:draw)?\s*\(([^)]+)\)/i);
        if (drawMatch) {
            const eventAlias = drawMatch[1].trim();
            const partnerName = drawMatch[2].trim();
            const resolvedEvent = resolveEventAlias(eventAlias, sport);

            if (resolvedEvent) {
                matchedAny = true;
                result.partners.push({
                    event: resolvedEvent,
                    partnerName: isTBDEntry(partnerName) ? null : cleanPartnerName(partnerName),
                    isTBD: isTBDEntry(partnerName),
                    confidence: 'high',
                    rawSegment: segment
                });
                continue;
            }
        }
    }

    if (!matchedAny) {
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    return result;
}

/**
 * Parse simple format: just a name or comma-separated names
 * Assumes all names are for the current event
 */
function parseSimpleListFormat(input, sport, currentEvent) {
    const result = { partners: [], warnings: [], hasAmbiguity: false };

    // Check if input looks like a simple name (no event indicators)
    const hasEventIndicators = /[-:\/]\s*[a-e]\b|\bwith\b|\bfor\s+(?:the\s+)?[a-e]\b|\([a-e]\)/i.test(input);

    if (hasEventIndicators) {
        // This isn't a simple list, let other parsers handle it
        return { partners: [], warnings: [], hasAmbiguity: false };
    }

    // Treat as simple name(s) for current event
    // Don't split on comma if it looks like a single full name
    const segments = input.includes(',') && !looksLikeSingleName(input)
        ? input.split(',').map(s => s.trim()).filter(s => s)
        : [input.trim()];

    for (const segment of segments) {
        if (segment && !isTBDEntry(segment)) {
            result.partners.push({
                event: currentEvent,
                partnerName: cleanPartnerName(segment),
                isTBD: false,
                confidence: currentEvent ? 'medium' : 'low',
                rawSegment: segment
            });
        } else if (isTBDEntry(segment)) {
            result.partners.push({
                event: currentEvent,
                partnerName: null,
                isTBD: true,
                confidence: 'medium',
                rawSegment: segment
            });
        }
    }

    if (result.partners.length > 1) {
        result.warnings.push('Multiple names without event indicators - assumed all for current event');
        result.hasAmbiguity = true;
    }

    return result;
}

/**
 * Check if a string looks like a single full name (vs. multiple names)
 */
function looksLikeSingleName(input) {
    // If comma is followed by Jr, Sr, III, etc., it's part of the name
    if (/,\s*(jr|sr|ii|iii|iv|esq)/i.test(input)) {
        return true;
    }

    // Count words - a single name typically has 2-3 words
    const words = input.trim().split(/\s+/);
    return words.length <= 3;
}

/**
 * Split input on common delimiters (comma, semicolon, "and")
 */
function splitOnDelimiters(input) {
    // First split on semicolons
    let segments = input.split(';').map(s => s.trim()).filter(s => s);

    // Then split each segment on commas
    segments = segments.flatMap(s => s.split(',').map(x => x.trim()).filter(x => x));

    return segments;
}

/**
 * Clean up a partner name string
 */
function cleanPartnerName(name) {
    if (!name) return null;

    let cleaned = name.trim();

    // Remove common prefixes/suffixes that aren't part of the name
    cleaned = cleaned.replace(/^(and\s+)/i, '');
    cleaned = cleaned.replace(/\s*[-–]\s*(right|left)\s*wall\s*$/i, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Capitalize properly if all lowercase or all uppercase
    if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) {
        cleaned = cleaned.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    return cleaned || null;
}

/**
 * Get the partner for a specific event from parsed results
 *
 * @param {Object} parsedResult - Result from parsePartnerString
 * @param {string} targetEvent - The canonical event name to find partner for
 * @returns {Object|null} Partner info or null if not found
 */
function getPartnerForEvent(parsedResult, targetEvent) {
    if (!parsedResult || !parsedResult.partners) return null;

    // First try exact match
    const exactMatch = parsedResult.partners.find(p => p.event === targetEvent);
    if (exactMatch) return exactMatch;

    // If no match and only one partner with no event specified, use that
    if (parsedResult.partners.length === 1 && parsedResult.partners[0].event === null) {
        return parsedResult.partners[0];
    }

    return null;
}

/**
 * Process all entries and extract event-specific partners
 *
 * @param {Array} entries - Array of player entries with raw partnerName
 * @param {string} tabName - The current tab/event being processed
 * @returns {Array} Entries with parsedPartner field added
 */
function processEntriesForEvent(entries, tabName) {
    const currentEvent = detectEventFromTabName(tabName, detectSportFromTabName(tabName));

    return entries.map(entry => {
        const parsed = parsePartnerString(entry.partnerName || '', tabName);
        const partnerForEvent = getPartnerForEvent(parsed, currentEvent);

        return {
            ...entry,
            parsedPartner: partnerForEvent,
            allParsedPartners: parsed.partners,
            partnerParseWarnings: parsed.warnings,
            hasPartnerAmbiguity: parsed.hasAmbiguity
        };
    });
}

/**
 * Deduplicates doubles entries where both partners submitted forms
 *
 * When both partners submit (e.g., "John Smith" lists "Jane Doe" and
 * "Jane Doe" lists "John Smith"), this keeps only the first occurrence.
 * The first submitter's data (including availability) is preserved.
 *
 * @param {Array} entries - Array of parsed doubles entries
 * @returns {Array} Deduplicated entries (one per team)
 */
function deduplicateDoublesEntries(entries) {
    const seen = new Set();
    const deduplicated = [];

    for (const entry of entries) {
        // Create canonical team key (alphabetically sorted names)
        const player = (entry.playerName || '').toLowerCase().trim();
        const partner = (entry.partnerName || '').toLowerCase().trim();

        // If missing player or partner, keep entry as-is (will be caught by validation)
        if (!player || !partner) {
            deduplicated.push(entry);
            continue;
        }

        const teamKey = [player, partner].sort().join('|');

        if (!seen.has(teamKey)) {
            seen.add(teamKey);
            deduplicated.push(entry);  // First submitter's entry wins
        }
        // Skip duplicate (second partner's submission)
    }

    return deduplicated;
}

// Export for CommonJS (UXP)
module.exports = {
    parsePartnerString,
    getPartnerForEvent,
    processEntriesForEvent,
    deduplicateDoublesEntries,
    detectSportFromTabName,
    detectEventFromTabName,
    resolveEventAlias,
    isTBDEntry,
    cleanPartnerName,
    EVENT_ALIASES
};
