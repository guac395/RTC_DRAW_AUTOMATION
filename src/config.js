/**
 * Configuration file for R&TC Tournament Matcher
 * Credentials are loaded from environment variables for security
 */

const CONFIG = {
    // Google OAuth Credentials - loaded from .env file
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ''
};

// Export for CommonJS (UXP)
module.exports = { CONFIG };
