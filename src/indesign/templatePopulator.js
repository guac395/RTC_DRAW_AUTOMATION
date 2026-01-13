/**
 * Template Populator
 * Handles InDesign document manipulation for tournament bracket generation
 * Populates named text frames with player names, seeds, and handicaps
 */

const { app } = require('indesign');

/**
 * Builds a cache of all named text frames in the document for fast lookup.
 * This prevents O(pages × frames) lookup on every frame access.
 *
 * @param {Document} doc - InDesign document
 * @returns {Map<string, TextFrame>} Map of frame names to frame objects
 */
function buildFrameCache(doc) {
    const cache = new Map();

    try {
        // Cache frames from all pages
        const pages = doc.pages;
        for (let p = 0; p < pages.length; p++) {
            const page = pages.item(p);
            const pageFrames = page.textFrames;

            if (!pageFrames || pageFrames.length === 0) continue;

            for (let i = 0; i < pageFrames.length; i++) {
                const frame = pageFrames.item(i);
                if (frame && frame.name) {
                    cache.set(frame.name, frame);
                }
            }
        }

        // Also cache document-level text frames
        const docFrames = doc.textFrames;
        if (docFrames && docFrames.length > 0) {
            for (let i = 0; i < docFrames.length; i++) {
                const frame = docFrames.item(i);
                if (frame && frame.name && !cache.has(frame.name)) {
                    cache.set(frame.name, frame);
                }
            }
        }
    } catch (error) {
        console.error('Error building frame cache:', error);
    }

    return cache;
}

/**
 * Validates that the document is still open and accessible
 *
 * @returns {boolean} True if document is valid
 */
function isDocumentValid() {
    try {
        return app && app.activeDocument && app.activeDocument.pages.length > 0;
    } catch (e) {
        return false;
    }
}

/**
 * Populates InDesign document with bracket data
 * Uses named text frames following the convention: R{round}_M{match}_P{player}
 *
 * @param {Object} bracket - Complete bracket structure from pairingEngine
 * @param {Array} flatMatches - Flattened match list from getFlatMatchList()
 * @returns {Object} Result with success status and details
 */
function populateDocument(bracket, flatMatches) {
    try {
        // Validate InDesign is available
        if (!isDocumentValid()) {
            return {
                success: false,
                error: 'No active InDesign document found. Please open the tournament template.'
            };
        }

        const doc = app.activeDocument;
        const results = {
            success: true,
            populated: 0,
            skipped: 0,
            errors: [],
            missingFrames: []
        };

        // Build frame cache once for O(1) lookups instead of O(pages × frames) per frame
        const frameCache = buildFrameCache(doc);
        console.log(`Frame cache built with ${frameCache.size} named frames`);

        // Iterate through all matches and populate text frames
        for (let index = 0; index < flatMatches.length; index++) {
            // Check if document is still valid (user might have closed it)
            if (!isDocumentValid()) {
                return {
                    success: false,
                    error: 'Document was closed during population. Partial data may have been written.',
                    populated: results.populated,
                    partial: true
                };
            }

            const match = flatMatches[index];
            const roundNum = match.roundNumber;
            const matchNum = match.matchNumber;

            // Populate player 1
            if (match.player1) {
                const frameNameP1 = `<R${roundNum}_M${matchNum}_P1>`;
                const player1Result = populateTextFrameCached(frameCache, frameNameP1, match.player1);
                updateResults(results, player1Result, frameNameP1);
            }

            // Populate player 2
            if (match.player2) {
                const frameNameP2 = `<R${roundNum}_M${matchNum}_P2>`;
                const player2Result = populateTextFrameCached(frameCache, frameNameP2, match.player2);
                updateResults(results, player2Result, frameNameP2);
            }

            // Optionally populate seed frames if they exist
            if (match.player1 && match.player1.seed) {
                const seedFrameP1 = `<R${roundNum}_M${matchNum}_P1_SEED>`;
                const seedResult1 = populateSimpleTextFrameCached(frameCache, seedFrameP1, `(${match.player1.seed})`);
                if (seedResult1.success) results.populated++;
            }

            if (match.player2 && match.player2.seed) {
                const seedFrameP2 = `<R${roundNum}_M${matchNum}_P2_SEED>`;
                const seedResult2 = populateSimpleTextFrameCached(frameCache, seedFrameP2, `(${match.player2.seed})`);
                if (seedResult2.success) results.populated++;
            }
        }

        // Add summary to results
        results.message = `Successfully populated ${results.populated} text frames`;
        if (results.skipped > 0) {
            results.message += `, skipped ${results.skipped} (BYE or empty)`;
        }
        if (results.missingFrames.length > 0) {
            results.message += `. Warning: ${results.missingFrames.length} frames not found in template`;
        }

        return results;

    } catch (error) {
        return {
            success: false,
            error: `InDesign error: ${error.message}`,
            details: error.toString()
        };
    }
}

/**
 * Populates a single text frame with player information
 *
 * @param {Document} doc - InDesign document
 * @param {string} frameName - Name of the text frame to populate
 * @param {Object} player - Player object with name, seed, handicap
 * @returns {Object} Result with success status
 */
function populateTextFrame(doc, frameName, player) {
    try {
        // Skip BYE players
        if (player.isBye) {
            return { success: true, skipped: true, reason: 'BYE' };
        }

        // Find the text frame by name
        const frame = findTextFrame(doc, frameName);

        if (!frame) {
            return { success: false, missing: true };
        }

        // Format player text based on available data
        let playerText = player.name;

        // Add handicap if available (singles or doubles)
        const handicap = player.singlesHandicap || player.doublesHandicap;
        if (handicap !== null && handicap !== undefined) {
            playerText += ` (${handicap})`;
        }

        // Set the text content
        frame.contents = playerText;

        return { success: true, populated: true };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Populates a text frame with simple text (for seeds, labels, etc.)
 *
 * @param {Document} doc - InDesign document
 * @param {string} frameName - Name of the text frame
 * @param {string} text - Text to insert
 * @returns {Object} Result with success status
 */
function populateSimpleTextFrame(doc, frameName, text) {
    try {
        const frame = findTextFrame(doc, frameName);

        if (!frame) {
            return { success: false, missing: true };
        }

        frame.contents = text;
        return { success: true };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Populates a single text frame with player information using cached frame lookup
 *
 * @param {Map} frameCache - Cached map of frame names to frame objects
 * @param {string} frameName - Name of the text frame to populate
 * @param {Object} player - Player object with name, seed, handicap
 * @returns {Object} Result with success status
 */
function populateTextFrameCached(frameCache, frameName, player) {
    try {
        // Skip BYE players
        if (player.isBye) {
            return { success: true, skipped: true, reason: 'BYE' };
        }

        // Get frame from cache (O(1) lookup)
        const frame = frameCache.get(frameName);

        if (!frame) {
            return { success: false, missing: true };
        }

        // Format player text based on available data
        let playerText = player.name;

        // Add handicap if available (singles or doubles)
        const handicap = player.singlesHandicap || player.doublesHandicap;
        if (handicap !== null && handicap !== undefined) {
            playerText += ` (${handicap})`;
        }

        // Set the text content
        frame.contents = playerText;

        return { success: true, populated: true };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Populates a text frame with simple text using cached frame lookup
 *
 * @param {Map} frameCache - Cached map of frame names to frame objects
 * @param {string} frameName - Name of the text frame
 * @param {string} text - Text to insert
 * @returns {Object} Result with success status
 */
function populateSimpleTextFrameCached(frameCache, frameName, text) {
    try {
        const frame = frameCache.get(frameName);

        if (!frame) {
            return { success: false, missing: true };
        }

        frame.contents = text;
        return { success: true };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Finds a text frame by name in the document
 * Searches through all pages and text frames
 *
 * @param {Document} doc - InDesign document
 * @param {string} frameName - Name to search for
 * @returns {TextFrame|null} The found text frame or null
 */
function findTextFrame(doc, frameName) {
    try {
        // Search through all pages for the text frame
        const pages = doc.pages;

        for (let p = 0; p < pages.length; p++) {
            const page = pages.item(p);
            const pageFrames = page.textFrames;

            // Check if pageFrames collection exists and has items
            if (!pageFrames || pageFrames.length === 0) {
                continue;
            }

            for (let i = 0; i < pageFrames.length; i++) {
                const frame = pageFrames.item(i);
                if (frame && frame.name === frameName) {
                    return frame;
                }
            }
        }

        // Also search in document-level text frames
        const docFrames = doc.textFrames;
        if (docFrames && docFrames.length > 0) {
            for (let i = 0; i < docFrames.length; i++) {
                const frame = docFrames.item(i);
                if (frame && frame.name === frameName) {
                    return frame;
                }
            }
        }

        return null;

    } catch (error) {
        console.error(`Error finding frame ${frameName}:`, error);
        return null;
    }
}

/**
 * Updates results object based on individual frame population result
 *
 * @param {Object} results - Cumulative results object
 * @param {Object} frameResult - Individual frame result
 * @param {string} frameName - Name of the frame
 */
function updateResults(results, frameResult, frameName) {
    if (frameResult.populated) {
        results.populated++;
    } else if (frameResult.skipped) {
        results.skipped++;
    } else if (frameResult.missing) {
        results.missingFrames.push(frameName);
    } else if (frameResult.error) {
        results.errors.push({ frame: frameName, error: frameResult.error });
    }
}

/**
 * Clears all bracket text frames in the document
 * Useful for resetting the template before populating with new data
 *
 * @returns {Object} Result with success status
 */
function clearBracketFrames() {
    try {
        if (!app || !app.activeDocument) {
            return {
                success: false,
                error: 'No active InDesign document found'
            };
        }

        const doc = app.activeDocument;
        let clearedCount = 0;

        // Pattern to match bracket frame names: <R{num}_M{num}_P{num}>
        const bracketFramePattern = /^<R\d+_M\d+_P\d+(_SEED)?>$/;

        const pages = doc.pages;
        for (let p = 0; p < pages.length; p++) {
            const page = pages.item(p);
            const pageFrames = page.textFrames;

            if (!pageFrames || pageFrames.length === 0) continue;

            for (let i = 0; i < pageFrames.length; i++) {
                const frame = pageFrames.item(i);
                if (frame && bracketFramePattern.test(frame.name)) {
                    frame.contents = '';
                    clearedCount++;
                }
            }
        }

        return {
            success: true,
            cleared: clearedCount,
            message: `Cleared ${clearedCount} bracket text frames`
        };

    } catch (error) {
        return {
            success: false,
            error: `Error clearing frames: ${error.message}`
        };
    }
}

/**
 * Validates that the active document has the necessary named text frames
 * Only checks Round 1 frames since subsequent rounds are handled manually
 *
 * @param {number} bracketSize - Expected bracket size (8, 16, 32, 64, 128)
 * @returns {Object} Validation report
 */
function validateTemplateFrames(bracketSize) {
    try {
        if (!app || !app.activeDocument) {
            return {
                success: false,
                error: 'No active InDesign document found'
            };
        }

        const doc = app.activeDocument;
        const expectedFrames = [];
        const foundFrames = [];
        const missingFrames = [];

        // Only check Round 1 frames - subsequent rounds are handled manually
        const matchesInRound1 = bracketSize / 2;
        for (let m = 1; m <= matchesInRound1; m++) {
            expectedFrames.push(`<R1_M${m}_P1>`);
            expectedFrames.push(`<R1_M${m}_P2>`);
        }

        // Check which frames exist
        expectedFrames.forEach(frameName => {
            const frame = findTextFrame(doc, frameName);
            if (frame) {
                foundFrames.push(frameName);
            } else {
                missingFrames.push(frameName);
            }
        });

        return {
            success: true,
            bracketSize,
            expectedCount: expectedFrames.length,
            foundCount: foundFrames.length,
            missingCount: missingFrames.length,
            missingFrames: missingFrames.slice(0, 20), // Limit to first 20 for readability
            percentComplete: Math.round((foundFrames.length / expectedFrames.length) * 100)
        };

    } catch (error) {
        return {
            success: false,
            error: `Validation error: ${error.message}`
        };
    }
}

// CommonJS exports for UXP
module.exports = {
    populateDocument,
    clearBracketFrames,
    validateTemplateFrames,
    populateTextFrame,
    populateSimpleTextFrame,
    populateTextFrameCached,
    populateSimpleTextFrameCached,
    findTextFrame,
    buildFrameCache,
    isDocumentValid
};
