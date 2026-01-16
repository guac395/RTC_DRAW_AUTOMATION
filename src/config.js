/**
 * Configuration file for R&TC Tournament Matcher
 *
 * For local development, create config.local.js with your credentials.
 */

// Try to load local config first (gitignored)
let CONFIG;
try {
    const localConfig = require('./config.local.js');
    CONFIG = localConfig.CONFIG;
} catch (e) {
    // Fallback to empty defaults if no local config
    CONFIG = {
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: ''
    };
}

// Export for CommonJS (UXP)
module.exports = { CONFIG };
