/**
 * R&TC Tournament Matcher - Main Entry Point
 * UXP Extension for Adobe InDesign
 */

console.log('main.js: Starting module load...');

// Spectrum Web Components are provided by UXP when enableSWCSupport is true in manifest.json
// Do NOT import them here - they are auto-registered by UXP runtime
// The following components are available: sp-theme, sp-button, sp-action-button, etc.

// UXP/CommonJS Module Imports - paths relative to src/ directory
console.log('main.js: Importing modules...');
const { CONFIG } = require('./config.js');
const { sheetsAPI } = require('./data/sheetsAPI.js');
const { parseEventTabData } = require('./data/formParser.js');
const { handicapData } = require('./data/handicapData.js');
const { seedParticipants } = require('./matchmaking/seedingEngine.js');
const { generateBracket, getFlatMatchList, validateBracket, getBracketStats } = require('./matchmaking/pairingEngine.js');
const { validateEntries, generateValidationReport } = require('./matchmaking/validation.js');
// availabilityMatcher.js removed - availability logic now in seedingEngine.js
const { populateDocument, validateTemplateFrames } = require('./indesign/templatePopulator.js');
const { NavigationManager } = require('./navigation.js');

// ============================================================
// SPECTRUM WEB COMPONENTS HELPER FUNCTIONS
// These handle sp-picker quirks in Adobe UXP environment
// NOTE: UXP does NOT support standard Web Components APIs:
//   - customElements.whenDefined() throws error
//   - picker.value getter returns undefined
//   - change events may not fire reliably
// ============================================================

/**
 * Safely clear menu items from an sp-picker while preserving the label slot
 */
function clearPickerChildren(picker) {
    if (!picker) return;
    // Remove only sp-menu-item elements, preserve the label span slot
    const menuItems = picker.querySelectorAll('sp-menu-item');
    menuItems.forEach(item => item.remove());
}

/**
 * Get selected value from sp-picker (UXP-compatible)
 * In UXP, picker.value returns undefined, so we use options array
 */
function getPickerValue(picker) {
    if (!picker) return null;

    // Try options array first (UXP-compatible approach)
    if (typeof picker.selectedIndex === 'number' && picker.selectedIndex >= 0) {
        if (picker.options && picker.options[picker.selectedIndex]) {
            return picker.options[picker.selectedIndex].value;
        }
    }

    // Fallback: try selectedItem
    if (picker.selectedItem && picker.selectedItem.value) {
        return picker.selectedItem.value;
    }

    // Last resort: try value property (may be undefined in UXP)
    return picker.value || null;
}

/**
 * Populate picker with items and attach click handlers
 * Click handlers provide reliable selection detection when change events fail
 */
function populatePickerWithItems(picker, items, clickHandler) {
    if (!picker) return;

    console.log(`Populating picker ${picker.id} with ${items.length} items`);

    // Clear existing children
    clearPickerChildren(picker);

    // Add dynamic items with click handlers
    items.forEach((item) => {
        const menuItem = document.createElement('sp-menu-item');
        menuItem.value = item.value;
        menuItem.textContent = item.text;

        if (clickHandler) {
            menuItem.addEventListener('click', () => {
                console.log(`Menu item clicked: ${item.value} in picker ${picker.id}`);
                // Clear selected from all siblings
                picker.querySelectorAll('sp-menu-item').forEach(mi => mi.removeAttribute('selected'));
                // Mark this item as selected
                menuItem.setAttribute('selected', '');
                picker.value = item.value;
                // Explicitly update picker's displayed label (UXP fix - auto-update doesn't work)
                picker.label = item.text;
                clickHandler(item.value);
            });
        }

        picker.appendChild(menuItem);
    });

    console.log(`Picker ${picker.id} populated with ${picker.children.length} items`);
}

/**
 * Process workbook selection - called by click handler on sp-menu-item
 * This is the reliable path for selection in UXP (change events may not fire)
 */
async function processWorkbookSelection(workbookId) {
    console.log('=== PROCESSING WORKBOOK SELECTION ===');
    console.log('Selected workbook ID:', workbookId);

    // Ignore empty selection
    if (!workbookId) {
        console.log('No workbook selected, ignoring');
        return;
    }

    // Store selection in app state
    appState.eventWorkbookId = workbookId;
    const selectedWorkbook = appState.availableSpreadsheets.find(s => s.id === workbookId);
    appState.eventWorkbookName = selectedWorkbook ? selectedWorkbook.name : null;
    console.log('Selected workbook name:', appState.eventWorkbookName);

    // Load tabs from selected workbook
    showLoading('Loading event tabs...');
    const result = await sheetsAPI.getSpreadsheetInfo(workbookId);

    if (result.success) {
        appState.eventWorkbookTabs = result.sheets;
        populateEventTabSelect(result.sheets);
        elements.selectEventTab.disabled = false;
        hideLoading();

        // Auto-load handicap spreadsheet if not already loaded
        if (!appState.handicapLoaded) {
            await autoLoadHandicapSpreadsheet();
        }
    } else {
        hideLoading();
        showError('Failed to load tabs: ' + result.error);
        elements.selectEventTab.disabled = true;
    }

    console.log('=== WORKBOOK SELECTION PROCESSED ===');
}

/**
 * Process tab selection - called by click handler on sp-menu-item
 * This is the reliable path for selection in UXP (change events may not fire)
 */
function processTabSelection(selectedTab) {
    console.log('=== PROCESSING TAB SELECTION ===');
    console.log('Selected tab:', selectedTab);

    // Ignore empty selection
    if (!selectedTab) {
        console.log('No tab selected, ignoring');
        return;
    }

    // Store selection and enable load button
    appState.selectedEventTab = selectedTab;
    elements.btnLoadEntries.disabled = false;

    console.log('Tab selection stored, Load Entries button enabled');
    console.log('=== TAB SELECTION PROCESSED ===');
}

// UI Elements
let elements = {};

// Navigation Manager
let navigationManager = null;

// Application State (made global for NavigationManager access)
window.appState = {
    connected: false,
    availableSpreadsheets: [],          // All spreadsheets from Drive
    eventWorkbookId: null,               // Selected event workbook ID
    eventWorkbookName: null,             // Selected event workbook name
    eventWorkbookTabs: [],               // Available tabs in event workbook
    selectedEventTab: null,              // Selected event tab name
    handicapWorkbookId: null,            // Selected handicap workbook ID
    handicapWorkbookName: null,          // Selected handicap workbook name
    handicapLoaded: false,               // Whether handicaps are loaded
    formEntries: [],                     // Parsed entries from selected tab
    currentParticipants: [],             // Participants with handicaps matched
    currentBracket: null,                // Generated bracket
    validationResult: null               // Validation results
};

// Create local reference for backward compatibility
const appState = window.appState;

/**
 * Initialize the extension
 */
function initialize() {
    console.log('====================================');
    console.log('Tournament Matcher: Initializing extension...');
    console.log('====================================');
    initializeUI();
    setupEventListeners();
    initializeNavigation();
    checkSavedConnection();
    console.log('====================================');
    console.log('Tournament Matcher: Initialization complete');
    console.log('====================================');
}

/**
 * Initialize navigation system
 */
function initializeNavigation() {
    navigationManager = new NavigationManager();
    navigationManager.initialize();
    console.log('Navigation manager initialized');
}

// Defensive pattern - handles both DOM ready and already-loaded scenarios
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM already loaded (async script scenario)
    initialize();
}

/**
 * Initialize UI element references
 */
function initializeUI() {
    console.log('Initializing UI elements...');
    elements = {
        // Connection
        btnConnect: document.getElementById('btn-connect'),
        connectionStatus: document.getElementById('connection-status'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        authCodeContainer: document.getElementById('auth-code-container'),
        inputAuthCode: document.getElementById('input-auth-code'),
        btnSubmitAuth: document.getElementById('btn-submit-auth'),

        // Event Selection (NEW)
        eventSelectionSection: document.getElementById('event-selection-section'),
        selectEventWorkbook: document.getElementById('select-event-workbook'),
        selectEventTab: document.getElementById('select-event-tab'),

        // Load Entries Button
        btnLoadEntries: document.getElementById('btn-load-entries'),

        // Participants
        participantsSection: document.getElementById('participants-section'),
        participantsList: document.getElementById('participants-list'),
        participantCount: document.getElementById('participant-count'),
        validationWarnings: document.getElementById('validation-warnings'),
        btnGenerate: document.getElementById('btn-generate'),

        // Loading & Messages
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
        errorMessage: document.getElementById('error-message'),
        successMessage: document.getElementById('success-message')
    };
    console.log('UI elements initialized');
    console.log('Workbook picker found:', !!elements.selectEventWorkbook);
    console.log('Tab picker found:', !!elements.selectEventTab);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    console.log('btnConnect element:', elements.btnConnect);

    // Connection
    elements.btnConnect.addEventListener('click', handleConnect);

    // Auth code input - enable/disable submit button based on input
    // Listen for multiple events to catch typing, pasting, and other input methods
    const updateSubmitButtonState = () => {
        const hasText = elements.inputAuthCode.value.trim().length > 0;
        elements.btnSubmitAuth.disabled = !hasText;
    };
    elements.inputAuthCode.addEventListener('input', updateSubmitButtonState);
    elements.inputAuthCode.addEventListener('paste', () => setTimeout(updateSubmitButtonState, 0));
    elements.inputAuthCode.addEventListener('change', updateSubmitButtonState);
    elements.inputAuthCode.addEventListener('keyup', updateSubmitButtonState);

    // NEW: Event Workbook & Tab Selection
    if (elements.selectEventWorkbook) {
        elements.selectEventWorkbook.addEventListener('change', handleEventWorkbookChange);
    }
    if (elements.selectEventTab) {
        elements.selectEventTab.addEventListener('change', handleEventTabChange);
    }
    if (elements.btnLoadEntries) {
        elements.btnLoadEntries.addEventListener('click', handleLoadEntries);
    }

    // Bracket Actions
    elements.btnGenerate.addEventListener('click', handleGenerateBracket);

    // Initialize pickers to show placeholders
    initializePickers();

    console.log('Event listeners attached');
}

/**
 * Initialize picker states to ensure placeholders display correctly
 * Placeholder text is shown via the label attribute on sp-picker elements
 * Note: UXP doesn't support customElements.whenDefined(), so no async waiting
 */
function initializePickers() {
    console.log('=== INITIALIZING PICKERS ===');

    // DEBUG: Component info (UXP may report these differently than standard browsers)
    console.log('Workbook picker element:', elements.selectEventWorkbook);
    console.log('Workbook picker tagName:', elements.selectEventWorkbook?.tagName);
    console.log('Tab picker element:', elements.selectEventTab);
    console.log('Tab picker tagName:', elements.selectEventTab?.tagName);

    // Pickers use label attribute for placeholder text (set in HTML)
    // Real items will be populated after Google auth
    if (elements.selectEventWorkbook) {
        console.log('Workbook picker ready (placeholder via label attribute)');
    } else {
        console.error('Workbook picker element not found!');
    }

    if (elements.selectEventTab) {
        console.log('Tab picker ready (placeholder via label attribute)');
    } else {
        console.error('Tab picker element not found!');
    }

    console.log('=== PICKERS INITIALIZED ===');
}

/**
 * Clear all saved connection data from localStorage
 */
function clearSavedConnectionData() {
    localStorage.removeItem('rtc-sheets-tokens');
    localStorage.removeItem('rtc-sheets-credentials');
    localStorage.removeItem('rtc-selected-spreadsheet');
    localStorage.removeItem('rtc-handicap-workbook');
}

/**
 * Check for saved connection data and attempt to restore session
 */
async function checkSavedConnection() {
    const savedTokens = localStorage.getItem('rtc-sheets-tokens');
    const savedCredentials = localStorage.getItem('rtc-sheets-credentials');

    // Must have both tokens and credentials to attempt reconnection
    if (!savedTokens || !savedCredentials) {
        // No saved session - ensure disconnected state
        setConnectedState(false);
        return;
    }

    try {
        const tokens = JSON.parse(savedTokens);
        const credentials = JSON.parse(savedCredentials);

        sheetsAPI.initialize(credentials);
        sheetsAPI.restoreTokens(tokens);

        // Check if we have valid authentication
        if (!sheetsAPI.isAuthenticated) {
            console.warn('Saved tokens are invalid or expired');
            clearSavedConnectionData();
            setConnectedState(false);
            return;
        }

        // Try to validate the connection by loading spreadsheets
        showLoading('Restoring connection...');
        await loadAndPopulateWorkbooks();

        // loadAndPopulateWorkbooks will call setConnectedState appropriately
        // based on whether spreadsheets were found

    } catch (error) {
        console.error('Failed to restore connection:', error);
        clearSavedConnectionData();
        setConnectedState(false);
        hideLoading();
    }
}

/**
 * Handle Google Sheets connection
 */
async function handleConnect() {
    console.log('Connect button clicked');
    try {
        // Reset connection state when starting new auth flow
        setConnectedState(false);

        showLoading('Connecting to Google Sheets...');

        // Step 1: Use hardcoded credentials from config
        const credentials = {
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            client_secret: CONFIG.GOOGLE_CLIENT_SECRET
        };

        // Validate credentials are configured
        if (!credentials.client_id || credentials.client_id === 'YOUR_CLIENT_ID_HERE') {
            showError('Please configure Google OAuth credentials in scripts/config.js');
            hideLoading();
            return;
        }

        // Initialize API
        const initResult = await sheetsAPI.initialize(credentials);
        if (!initResult.success) {
            showError(`Failed to initialize: ${initResult.error}`);
            hideLoading();
            return;
        }

        // Step 2: Get authorization URL and open in browser
        const authUrl = sheetsAPI.getAuthUrl();
        showInfo(`Opening authorization page...`);

        // Open auth URL (UXP will handle this)
        const { shell } = require('uxp');
        await shell.openExternal(authUrl);

        // Step 3: Show auth code input and hide connect button
        elements.authCodeContainer.classList.remove('hidden');
        elements.btnConnect.classList.add('hidden');
        hideLoading();

        // Setup one-time event listener for auth code submission
        // Wrap in try-catch to prevent unhandled promise rejections
        elements.btnSubmitAuth.onclick = async () => {
            try {
                await completeAuthentication(credentials);
            } catch (error) {
                console.error('Auth submission error:', error);
                showError(`Authentication failed: ${error.message}`);
                hideLoading();
            }
        };

    } catch (error) {
        console.error('Connection error:', error);
        showError(`Connection failed: ${error.message}`);
        hideLoading();
    }
}

/**
 * Complete authentication after user pastes auth code
 */
async function completeAuthentication(credentials) {
    try {
        const authCode = elements.inputAuthCode.value.trim();
        if (!authCode) {
            showError('Please enter the authorization code');
            return;
        }

        showLoading('Completing authentication...');

        // Exchange code for tokens
        const tokenResult = await sheetsAPI.exchangeCodeForTokens(authCode);
        if (!tokenResult.success) {
            showError(`Authentication failed: ${tokenResult.error}`);
            hideLoading();
            return;
        }

        // Save tokens and credentials
        localStorage.setItem('rtc-sheets-tokens', JSON.stringify(sheetsAPI.saveTokens()));
        localStorage.setItem('rtc-sheets-credentials', JSON.stringify(credentials));

        // Hide auth code input
        elements.authCodeContainer.classList.add('hidden');
        elements.inputAuthCode.value = ''; // Clear the input

        // Load available spreadsheets and populate workbook dropdowns
        await loadAndPopulateWorkbooks();

        hideLoading();

    } catch (error) {
        console.error('Authentication completion error:', error);
        showError(`Failed to complete authentication: ${error.message}`);
        hideLoading();
    }
}

/**
 * Load available spreadsheets and populate workbook dropdowns
 */
async function loadAndPopulateWorkbooks() {
    try {
        showLoading('Loading your spreadsheets...');

        // List all spreadsheets from Google Drive
        const listResult = await sheetsAPI.listSpreadsheets();

        if (!listResult.success) {
            showError(`Failed to load spreadsheets: ${listResult.error}`);
            hideLoading();
            return;
        }

        appState.availableSpreadsheets = listResult.spreadsheets;

        // Populate event workbook dropdown with click handlers for reliable selection
        if (elements.selectEventWorkbook) {
            console.log('=== POPULATING WORKBOOK PICKER ===');

            // Filter out spreadsheets with "handicaps" in the name
            const eventSpreadsheets = appState.availableSpreadsheets.filter(sheet =>
                !sheet.name.toLowerCase().includes('handicap')
            );
            console.log('Event spreadsheets to populate:', eventSpreadsheets.length);

            // Build items array (placeholder is handled by label attribute)
            const items = eventSpreadsheets.map(sheet => ({
                value: sheet.id,
                text: sheet.name
            }));

            // Populate with click handler for reliable selection (UXP change events unreliable)
            populatePickerWithItems(elements.selectEventWorkbook, items, processWorkbookSelection);

            console.log('Workbook picker populated with', items.length, 'items');
            console.log('=== WORKBOOK PICKER POPULATED ===');
        }

        if (listResult.spreadsheets.length > 0) {
            setConnectedState(true);
            showSuccess(`Connected to Google Drive - Found ${listResult.spreadsheets.length} spreadsheet(s)`);

            // Load any saved handicap data
            await loadSavedHandicapData();
        } else {
            setConnectedState(false);
            showError('Connected but no spreadsheets found. Please ensure you have Google Sheets in your Drive.');
        }
        hideLoading();

        // Auto-advance to event selection screen only if connected
        if (navigationManager && listResult.spreadsheets.length > 0) {
            setTimeout(() => navigationManager.goForward(), 800);
        }

    } catch (error) {
        console.error('Failed to load workbooks:', error);
        showError(`Failed to load spreadsheets: ${error.message}`);
        clearSavedConnectionData();
        setConnectedState(false);
        hideLoading();
    }
}

/**
 * Load handicap data from saved handicap workbook
 */
async function loadSavedHandicapData() {
    const savedHandicapWorkbook = localStorage.getItem('rtc-handicap-workbook');
    if (!savedHandicapWorkbook) {
        console.log('No saved handicap workbook');
        return;
    }

    try {
        // Fetch all data from first sheet
        const result = await sheetsAPI.getSheetData(savedHandicapWorkbook, 'A:Z');

        if (result.success) {
            const loadResult = handicapData.loadFromSheetValues(result.values);

            if (loadResult.success) {
                appState.handicapWorkbookId = savedHandicapWorkbook;
                appState.handicapLoaded = true;
                console.log(`Restored ${loadResult.playerCount} players with handicap data`);
            } else {
                console.warn(`Failed to load handicap data: ${loadResult.error}`);
            }
        } else {
            console.warn(`Failed to fetch handicap data: ${result.error}`);
        }
    } catch (error) {
        console.warn('Error loading handicap data:', error);
    }
}


/**
 * Handle event workbook selection via change event (backup for click handlers)
 * Note: UXP change events may not fire reliably - click handlers are primary
 */
async function handleEventWorkbookChange(event) {
    console.log('=== WORKBOOK CHANGE EVENT (backup handler) ===');

    // Get value using UXP-compatible approach
    const workbookId = getPickerValue(event.target)
        || event.target.value
        || event.detail?.value
        || event.target.selectedItem?.value;

    console.log('Change event workbookId:', workbookId);

    // Ignore if already processing this workbook (click handler may have already fired)
    if (workbookId && workbookId === appState.eventWorkbookId) {
        console.log('Workbook already selected, skipping duplicate processing');
        return;
    }

    // Delegate to the process function
    if (workbookId) {
        await processWorkbookSelection(workbookId);
    }
}

/**
 * Handle event tab selection via change event (backup for click handlers)
 * Note: UXP change events may not fire reliably - click handlers are primary
 */
function handleEventTabChange(event) {
    console.log('=== TAB CHANGE EVENT (backup handler) ===');

    // Get value using UXP-compatible approach
    const selectedTab = getPickerValue(event.target)
        || event.target.value
        || event.detail?.value
        || event.target.selectedItem?.value;

    console.log('Change event selectedTab:', selectedTab);

    // Ignore if already processing this tab (click handler may have already fired)
    if (selectedTab && selectedTab === appState.selectedEventTab) {
        console.log('Tab already selected, skipping duplicate processing');
        return;
    }

    // Delegate to the process function
    if (selectedTab) {
        processTabSelection(selectedTab);
    }
}

/**
 * Populate event tab dropdown with click handlers for reliable selection
 */
function populateEventTabSelect(sheets) {
    console.log('=== POPULATING TAB PICKER ===');
    console.log('Sheets to populate:', sheets.length);

    // Build items array (placeholder is handled by label attribute)
    const items = sheets.map(sheet => ({
        value: sheet.title,
        text: sheet.title
    }));

    // Populate with click handler for reliable selection (UXP change events unreliable)
    populatePickerWithItems(elements.selectEventTab, items, processTabSelection);

    console.log('Tab picker populated with', items.length, 'items');
    console.log('=== TAB PICKER POPULATED ===');
}

/**
 * Auto-detect and load handicap data from a spreadsheet named "Handicaps"
 */
async function autoLoadHandicapSpreadsheet() {
    const handicapSpreadsheet = appState.availableSpreadsheets.find(sheet =>
        sheet.name.toLowerCase().includes('handicap')
    );

    if (!handicapSpreadsheet) {
        console.log('No handicap spreadsheet found in Drive');
        return false;
    }

    showLoading(`Loading handicaps from "${handicapSpreadsheet.name}"...`);

    try {
        const result = await sheetsAPI.getSheetData(handicapSpreadsheet.id, 'A:Z');

        if (!result.success) {
            hideLoading();
            console.warn('Failed to load handicap spreadsheet:', result.error);
            return false;
        }

        const loadResult = handicapData.loadFromSheetValues(result.values);

        if (loadResult.success) {
            appState.handicapLoaded = true;
            appState.handicapWorkbookId = handicapSpreadsheet.id;
            appState.handicapWorkbookName = handicapSpreadsheet.name;
            hideLoading();
            showSuccess(`Loaded ${loadResult.playerCount} players from "${handicapSpreadsheet.name}"`);
            return true;
        } else {
            hideLoading();
            showError('Failed to parse handicap data');
            return false;
        }
    } catch (error) {
        hideLoading();
        console.error('Error loading handicap spreadsheet:', error);
        return false;
    }
}

/**
 * Set connected/disconnected UI state
 */
function setConnectedState(connected) {
    appState.connected = connected;

    if (connected) {
        elements.statusIndicator.classList.add('connected');
        elements.statusText.textContent = 'Connected to Google Drive';
        elements.btnConnect.classList.add('hidden');
        // Screen visibility now handled by NavigationManager
    } else {
        elements.statusIndicator.classList.remove('connected');
        elements.statusText.textContent = 'Not Connected';
        elements.btnConnect.classList.remove('hidden');
        // Screen visibility now handled by NavigationManager
    }
}


/**
 * Handle load entries - NEW VERSION for tab-based data
 */
async function handleLoadEntries() {
    try {
        // Check prerequisites
        if (!appState.eventWorkbookId || !appState.selectedEventTab) {
            showError('Please select a workbook and event tab');
            return;
        }

        showLoading(`Loading entries from "${appState.selectedEventTab}"...`);

        // Fetch data from selected tab
        const tabRange = `${appState.selectedEventTab}!A:Z`;
        const result = await sheetsAPI.getSheetData(appState.eventWorkbookId, tabRange);

        if (!result.success) {
            showError(`Failed to load entries: ${result.error}`);
            hideLoading();
            return;
        }

        // Parse event tab data (NEW parser) - pass workbook name for sport detection
        console.log('DEBUG sport detection:', {
            workbookName: appState.eventWorkbookName,
            tabName: appState.selectedEventTab,
            workbookNameType: typeof appState.eventWorkbookName
        });
        const parseResult = parseEventTabData(result.values, appState.selectedEventTab, appState.eventWorkbookName);
        console.log('DEBUG detected sport:', parseResult.sport);

        if (!parseResult.success) {
            showError(`Failed to parse entries: ${parseResult.error}`);
            hideLoading();
            return;
        }

        appState.formEntries = parseResult.entries;
        appState.currentSport = parseResult.sport;

        // Check handicap data requirement - only needed for court-tennis
        if (parseResult.sport === 'court-tennis' && !appState.handicapLoaded) {
            showError('Please load handicap data first (required for court-tennis events)');
            hideLoading();
            return;
        }

        // Enrich with handicap data - only for court-tennis
        const eventType = parseResult.eventType; // 'singles' or 'doubles'
        if (parseResult.sport === 'court-tennis') {
            appState.currentParticipants = appState.formEntries.map(entry =>
                enrichWithHandicap(entry, eventType)
            );
        } else {
            // Non-tennis: skip handicap lookup entirely
            appState.currentParticipants = appState.formEntries.map(entry => ({
                ...entry,
                handicap: null,
                handicapFound: false
            }));
        }

        displayParticipants();
        hideLoading();
        showSuccess(`Loaded ${appState.currentParticipants.length} participants from ${appState.selectedEventTab}`);

        // Auto-advance to participants screen
        if (navigationManager) {
            setTimeout(() => navigationManager.goForward(), 800);
        }

    } catch (error) {
        console.error('Load entries error:', error);
        showError(`Failed to load entries: ${error.message}`);
        hideLoading();
    }
}


/**
 * Enrich entry with handicap data
 * For doubles, also looks up partner's handicap for team handicap calculation
 */
function enrichWithHandicap(entry, type) {
    // Use fuzzy matching to find player by name (no sport filter needed - all handicaps in one workbook)
    const player = handicapData.findPlayer(entry.playerName);

    const enriched = {
        ...entry,
        // Set both generic and type-specific handicap properties for validation compatibility
        handicap: player ? (type === 'singles' ? player.singlesHCAP : player.doublesHCAP) : null,
        singlesHandicap: player ? player.singlesHCAP : null,
        doublesHandicap: player ? player.doublesHCAP : null,
        handicapFound: !!player
    };

    // For doubles, also look up partner's handicap
    if (type === 'doubles' && entry.partnerName) {
        const partner = handicapData.findPlayer(entry.partnerName);
        enriched.partnerHandicap = partner ? partner.doublesHCAP : null;
        enriched.partnerHandicapFound = !!partner;
    }

    return enriched;
}

/**
 * Display participants list
 */
function displayParticipants() {
    elements.participantsSection.classList.remove('hidden');
    elements.participantCount.textContent = appState.currentParticipants.length;

    // Clear list
    elements.participantsList.innerHTML = '';

    // Display each participant
    appState.currentParticipants.forEach(participant => {
        const item = createParticipantItem(participant);
        elements.participantsList.appendChild(item);
    });

    // Show validation warnings if any
    displayValidationWarnings();
}

/**
 * Create participant list item
 */
function createParticipantItem(participant) {
    const div = document.createElement('div');
    div.className = 'participant-item';

    const nameDiv = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'participant-name';
    name.textContent = participant.playerName;

    if (participant.partnerName) {
        name.textContent += ` & ${participant.partnerName}`;
    }

    nameDiv.appendChild(name);

    // Only show handicap warning for court-tennis events
    if (!participant.handicapFound && appState.currentSport === 'court-tennis') {
        const warning = document.createElement('div');
        warning.className = 'participant-warning';
        warning.textContent = '⚠ No handicap data found';
        nameDiv.appendChild(warning);
    }

    div.appendChild(nameDiv);

    // Only show handicap column for court-tennis events
    if (appState.currentSport === 'court-tennis') {
        const handicapDiv = document.createElement('div');
        handicapDiv.className = 'participant-handicap';
        handicapDiv.textContent = participant.handicap !== null ? `HCAP: ${participant.handicap}` : 'No HCAP';
        div.appendChild(handicapDiv);
    }

    return div;
}

/**
 * Display validation warnings
 */
function displayValidationWarnings() {
    // Create a basic event object for validation
    const eventInfo = {
        name: appState.selectedEventTab,
        type: 'singles', // Will be determined by parseEventTabData
        sport: appState.currentSport || 'general'
    };

    // Run full validation
    appState.validationResult = validateEntries(appState.currentParticipants, eventInfo);

    const warnings = [];

    // Check for missing handicaps - only for court-tennis
    if (appState.currentSport === 'court-tennis') {
        const missingHandicaps = appState.currentParticipants.filter(p => !p.handicapFound);
        if (missingHandicaps.length > 0) {
            warnings.push(`${missingHandicaps.length} player(s) missing handicap data`);
        }
    }

    // Add other validation errors (excluding missing handicap which is already shown above)
    if (!appState.validationResult.valid) {
        const otherErrors = appState.validationResult.errors.filter(e =>
            !e.errors.some(err => err.includes('Missing handicap'))
        );
        if (otherErrors.length > 0) {
            warnings.push(`${otherErrors.length} other validation error(s) found`);
        }
    }

    if (warnings.length > 0 || !appState.validationResult.valid) {
        elements.validationWarnings.classList.remove('hidden');
        elements.validationWarnings.innerHTML = warnings.map(w =>
            `<div class="warning-item"><span class="warning-icon">⚠</span><span>${w}</span></div>`
        ).join('');

        // Log full validation report to console
        if (!appState.validationResult.valid) {
            console.warn('Validation Report:', generateValidationReport(appState.validationResult));
        }
    } else {
        elements.validationWarnings.classList.add('hidden');
    }
}

/**
 * Small delay helper to allow UI updates between steps
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle generate bracket in InDesign
 */
async function handleGenerateBracket() {
    try {
        // Step 1: Initial validation
        showLoading('Validating event selection...');

        if (!appState.selectedEventTab) {
            showError('No event selected');
            hideLoading();
            return;
        }

        // Validate entries first - just warn in console, don't block
        if (appState.validationResult && !appState.validationResult.valid) {
            console.warn(`Warning: ${appState.validationResult.errors.length} validation errors found. Proceeding with bracket generation anyway.`);
            showInfo(`Warning: ${appState.validationResult.errors.length} validation errors found`);
        }

        // Step 2: Prepare participants
        showLoading('Preparing participants...');
        await delay(100);

        const participants = appState.currentParticipants.map(p => ({
            name: p.playerName + (p.partnerName ? ` & ${p.partnerName}` : ''),
            singlesHandicap: p.eventType === 'singles' ? p.handicap : null,
            doublesHandicap: p.eventType === 'doubles' ? p.handicap : null,
            availability: p.availability,
            rawEntry: p
        }));

        if (participants.length === 0) {
            showError('No participants to seed');
            hideLoading();
            return;
        }

        // Determine bracket size - calculate next power of 2
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));

        // Step 3: Organize participants by availability
        showLoading('Organizing participants by availability...');
        await delay(100);

        // Place participants by availability (Day in top half, Night in bottom half, random within)
        const placementResult = seedParticipants(participants, bracketSize);

        if (!placementResult.success) {
            showError(`Placement failed: ${placementResult.error}`);
            hideLoading();
            return;
        }

        // Log placement stats
        if (placementResult.stats) {
            console.log('Bracket placement stats:', placementResult.stats);
        }

        // Step 4: Generate bracket structure
        showLoading('Generating bracket structure...');
        await delay(100);

        const bracketResult = generateBracket(placementResult.seeded, bracketSize);

        if (!bracketResult.success) {
            showError(`Bracket generation failed: ${bracketResult.error}`);
            hideLoading();
            return;
        }

        appState.currentBracket = bracketResult.bracket;

        // Step 5: Validate bracket
        showLoading('Validating bracket...');
        await delay(100);

        const bracketValidation = validateBracket(appState.currentBracket);
        if (!bracketValidation.valid) {
            console.warn('Bracket validation warnings:', bracketValidation.errors);
        }

        // Get flat match list for template population
        const flatMatches = getFlatMatchList(appState.currentBracket);

        // Log bracket data for reference
        console.log('Bracket ready for InDesign population:', {
            bracket: appState.currentBracket,
            stats: getBracketStats(appState.currentBracket),
            matches: flatMatches
        });

        // Validate that the template has the necessary frames (optional check)
        const validation = validateTemplateFrames(appState.currentBracket.bracketSize);
        if (validation.success) {
            console.log('Template validation:', validation);
            if (validation.missingCount > 0) {
                showWarning(`Template is ${validation.percentComplete}% complete. ${validation.missingCount} frames are missing.`);
            }
        }

        // Step 6: Populate InDesign document
        showLoading('Populating InDesign document...');
        await delay(100);

        // Build event context for handicap rounding
        const eventContext = {
            eventName: appState.selectedEventTab,
            eventType: appState.currentParticipants[0]?.eventType || 'singles',
            isDoubles: appState.selectedEventTab.toLowerCase().includes('doubles')
        };
        const result = populateDocument(appState.currentBracket, flatMatches, eventContext);

        hideLoading();

        if (result.success) {
            showSuccess(result.message);

            // Show detailed results in console
            console.log('Population results:', result);

            // If there are missing frames, show them in console
            if (result.missingFrames && result.missingFrames.length > 0) {
                console.warn('Missing text frames:', result.missingFrames);
                showWarning(`${result.populated} frames populated. ${result.missingFrames.length} frames not found in template.`);
            }

            // If there were errors, show them
            if (result.errors && result.errors.length > 0) {
                console.error('Errors during population:', result.errors);
                showError(`Completed with ${result.errors.length} errors. Check console for details.`);
            }
        } else {
            showError(result.error || 'Failed to populate document');
            console.error('Population error:', result);
        }

    } catch (error) {
        hideLoading();
        showError(`Error generating bracket: ${error.message}`);
        console.error('Generation error:', error);
    }
}

/**
 * UI Helper Functions
 */

function showLoading(message) {
    elements.loadingText.textContent = message;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    elements.successMessage.classList.add('hidden');

    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000);
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successMessage.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');

    setTimeout(() => {
        elements.successMessage.classList.add('hidden');
    }, 3000);
}

function showInfo(message) {
    showSuccess(message);
}

function showWarning(message) {
    elements.successMessage.textContent = message;
    elements.successMessage.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');

    setTimeout(() => {
        elements.successMessage.classList.add('hidden');
    }, 5000);
}

// Make helper functions globally accessible for NavigationManager
window.showError = showError;
window.showSuccess = showSuccess;
window.showInfo = showInfo;
window.showWarning = showWarning;
