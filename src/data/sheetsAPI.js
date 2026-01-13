/**
 * Google Sheets API Integration
 * Handles OAuth authentication and data fetching from Google Sheets
 */

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
];
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // For desktop/UXP apps

class GoogleSheetsAPI {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.clientId = null;
        this.clientSecret = null;
        this.isAuthenticated = false;
    }

    /**
     * Initialize with OAuth credentials
     * Client must obtain credentials from Google Cloud Console
     */
    async initialize(credentials) {
        try {
            const creds = typeof credentials === 'string'
                ? JSON.parse(credentials)
                : credentials;

            // Support both formats: direct credentials or credentials file format
            if (creds.installed) {
                this.clientId = creds.installed.client_id;
                this.clientSecret = creds.installed.client_secret;
            } else if (creds.client_id) {
                this.clientId = creds.client_id;
                this.clientSecret = creds.client_secret;
            } else {
                throw new Error('Invalid credentials format');
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Sheets API:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Step 1: Generate authorization URL
     */
    getAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            scope: SCOPES.join(' '),
            access_type: 'offline',
            prompt: 'consent'
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Step 2: Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(authCode) {
        try {
            const params = new URLSearchParams({
                code: authCode,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            });

            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_description || 'Token exchange failed');
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.isAuthenticated = true;

            return { success: true, tokens: data };
        } catch (error) {
            console.error('Token exchange failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const params = new URLSearchParams({
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token'
            });

            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.accessToken = data.access_token;

            return { success: true };
        } catch (error) {
            console.error('Token refresh failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get data from a specific sheet range
     * @param {string} spreadsheetId - The spreadsheet ID
     * @param {string} range - The range to fetch
     * @param {boolean} _retried - Internal flag to prevent infinite recursion
     */
    async getSheetData(spreadsheetId, range, _retried = false) {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Google Sheets');
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            // If token expired, try to refresh (but only once to prevent infinite recursion)
            if (response.status === 401 && !_retried) {
                const refreshResult = await this.refreshAccessToken();
                if (refreshResult.success) {
                    return this.getSheetData(spreadsheetId, range, true);
                }
                // Refresh failed - mark as unauthenticated and throw
                this.isAuthenticated = false;
                throw new Error('Session expired. Please reconnect to Google Sheets.');
            } else if (response.status === 401 && _retried) {
                this.isAuthenticated = false;
                throw new Error('Authentication failed after refresh. Please reconnect.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch sheet data');
            }

            const data = await response.json();
            return {
                success: true,
                values: data.values || [],
                range: data.range
            };
        } catch (error) {
            console.error('Failed to get sheet data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * List all Google Sheets spreadsheets in user's Drive
     * @param {number} pageSize - Number of results to return
     * @param {boolean} _retried - Internal flag to prevent infinite recursion
     */
    async listSpreadsheets(pageSize = 100, _retried = false) {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Google Sheets');
        }

        try {
            const params = new URLSearchParams({
                q: "mimeType='application/vnd.google-apps.spreadsheet'",
                pageSize: pageSize.toString(),
                fields: 'files(id, name, modifiedTime, webViewLink)',
                orderBy: 'modifiedTime desc'
            });

            const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            // If token expired, try to refresh (but only once to prevent infinite recursion)
            if (response.status === 401 && !_retried) {
                const refreshResult = await this.refreshAccessToken();
                if (refreshResult.success) {
                    return this.listSpreadsheets(pageSize, true);
                }
                this.isAuthenticated = false;
                throw new Error('Session expired. Please reconnect to Google Sheets.');
            } else if (response.status === 401 && _retried) {
                this.isAuthenticated = false;
                throw new Error('Authentication failed after refresh. Please reconnect.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to list spreadsheets');
            }

            const data = await response.json();
            return {
                success: true,
                spreadsheets: data.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    modifiedTime: file.modifiedTime,
                    url: file.webViewLink
                }))
            };
        } catch (error) {
            console.error('Failed to list spreadsheets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get spreadsheet metadata (title, sheets list, etc.)
     * @param {string} spreadsheetId - The spreadsheet ID
     * @param {boolean} _retried - Internal flag to prevent infinite recursion
     */
    async getSpreadsheetInfo(spreadsheetId, _retried = false) {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Google Sheets');
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties,sheets.properties`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            // If token expired, try to refresh (but only once to prevent infinite recursion)
            if (response.status === 401 && !_retried) {
                const refreshResult = await this.refreshAccessToken();
                if (refreshResult.success) {
                    return this.getSpreadsheetInfo(spreadsheetId, true);
                }
                this.isAuthenticated = false;
                throw new Error('Session expired. Please reconnect to Google Sheets.');
            } else if (response.status === 401 && _retried) {
                this.isAuthenticated = false;
                throw new Error('Authentication failed after refresh. Please reconnect.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch spreadsheet info');
            }

            const data = await response.json();
            return {
                success: true,
                title: data.properties.title,
                sheets: data.sheets.map(sheet => ({
                    id: sheet.properties.sheetId,
                    title: sheet.properties.title,
                    index: sheet.properties.index
                }))
            };
        } catch (error) {
            console.error('Failed to get spreadsheet info:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save tokens to local storage (for persistence)
     */
    saveTokens() {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            clientId: this.clientId,
            clientSecret: this.clientSecret
        };
    }

    /**
     * Restore tokens from saved data
     */
    restoreTokens(savedData) {
        this.accessToken = savedData.accessToken;
        this.refreshToken = savedData.refreshToken;
        this.clientId = savedData.clientId;
        this.clientSecret = savedData.clientSecret;
        this.isAuthenticated = !!this.accessToken;
    }
}

// Singleton instance
const sheetsAPI = new GoogleSheetsAPI();

// CommonJS export for UXP
module.exports = { sheetsAPI };
