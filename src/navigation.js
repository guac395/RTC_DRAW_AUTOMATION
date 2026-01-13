/**
 * NavigationManager - Handles multi-screen navigation
 * Manages screen transitions, progress tracking, and navigation controls
 */

class NavigationManager {
    constructor() {
        this.currentScreen = 1;
        this.totalScreens = 3;
        this.screens = [];
        this.navigationCallbacks = {};

        // Screen configuration
        this.screenConfig = {
            1: { id: 'connection-section', title: 'Connection', canProceed: () => this.canProceedFromConnection() },
            2: { id: 'event-selection-section', title: 'Event Selection', canProceed: () => this.canProceedFromEventSelection() },
            3: { id: 'participants-section', title: 'Participants', canProceed: () => true }
        };
    }

    /**
     * Initialize navigation system
     */
    initialize() {
        this.cacheElements();
        this.setupEventListeners();
        this.showScreen(1);
        this.updateUI();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            screens: document.querySelectorAll('.screen'),
            btnBack: document.getElementById('nav-btn-back'),
            btnForward: document.getElementById('nav-btn-forward'),
            progressBar: document.getElementById('progress-bar-fill'),
            progressText: document.getElementById('progress-text'),
            screenTitle: document.getElementById('screen-title')
        };

        // Cache text element references for Spectrum buttons (to preserve icons)
        this.forwardTextElement = document.getElementById('nav-forward-text');
        this.backTextElement = document.getElementById('nav-back-text');

        // Store screens array for easy access
        this.screens = Array.from(this.elements.screens);
    }

    /**
     * Setup navigation button event listeners
     */
    setupEventListeners() {
        if (this.elements.btnBack) {
            this.elements.btnBack.addEventListener('click', () => this.goBack());
        }

        if (this.elements.btnForward) {
            this.elements.btnForward.addEventListener('click', () => this.goForward());
        }
    }

    /**
     * Navigate to next screen
     */
    goForward() {
        const currentConfig = this.screenConfig[this.currentScreen];

        // Check if we can proceed from current screen
        if (!currentConfig.canProceed()) {
            this.showValidationError();
            return;
        }

        if (this.currentScreen < this.totalScreens) {
            this.currentScreen++;
            this.showScreen(this.currentScreen);
            this.updateUI();
            this.triggerCallback('forward', this.currentScreen);
        }
    }

    /**
     * Navigate to previous screen
     */
    goBack() {
        if (this.currentScreen > 1) {
            this.currentScreen--;
            this.showScreen(this.currentScreen);
            this.updateUI();
            this.triggerCallback('back', this.currentScreen);
        }
    }

    /**
     * Show specific screen
     */
    showScreen(screenNumber) {
        this.screens.forEach((screen, index) => {
            const screenIndex = index + 1;
            if (screenIndex === screenNumber) {
                screen.classList.remove('hidden');
                screen.classList.add('active');
            } else {
                screen.classList.add('hidden');
                screen.classList.remove('active');
            }
        });
    }

    /**
     * Update navigation UI (buttons, progress bar, title)
     */
    updateUI() {
        // Update back button
        if (this.elements.btnBack) {
            // Hide button on first screen, show on all others
            if (this.currentScreen === 1) {
                this.elements.btnBack.classList.add('hidden');
            } else {
                this.elements.btnBack.classList.remove('hidden');
                this.elements.btnBack.disabled = false;
            }
        }

        // Update forward button
        if (this.elements.btnForward) {
            // Hide button on last screen, show on all others
            if (this.currentScreen === this.totalScreens) {
                this.elements.btnForward.classList.add('hidden');
            } else {
                this.elements.btnForward.classList.remove('hidden');
                this.elements.btnForward.disabled = false;

                // Update button text (use child span to preserve icon)
                if (this.forwardTextElement) {
                    this.forwardTextElement.textContent = 'Next';
                }
            }
        }

        // Update progress bar
        this.updateProgressBar();

        // Update screen title
        this.updateScreenTitle();
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progress = (this.currentScreen / this.totalScreens) * 100;

        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${progress}%`;
        }

        if (this.elements.progressText) {
            this.elements.progressText.textContent = `Step ${this.currentScreen} of ${this.totalScreens}`;
        }
    }

    /**
     * Update screen title
     */
    updateScreenTitle() {
        const config = this.screenConfig[this.currentScreen];
        if (this.elements.screenTitle && config) {
            this.elements.screenTitle.textContent = config.title;
        }
    }

    /**
     * Validation: Can proceed from Connection screen?
     */
    canProceedFromConnection() {
        // Check if connected to Google Sheets
        if (window.appState && window.appState.connected) {
            return true;
        }
        return false;
    }

    /**
     * Validation: Can proceed from Event Selection screen?
     */
    canProceedFromEventSelection() {
        // Check if entries are loaded
        if (window.appState &&
            window.appState.currentParticipants &&
            window.appState.currentParticipants.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * Show validation error message
     */
    showValidationError() {
        const messages = {
            1: 'Please connect to Google Sheets before proceeding',
            2: 'Please select an event and load entries before proceeding'
        };

        const message = messages[this.currentScreen];
        if (message && window.showError) {
            window.showError(message);
        }
    }

    /**
     * Register a callback for navigation events
     */
    onNavigate(event, callback) {
        if (!this.navigationCallbacks[event]) {
            this.navigationCallbacks[event] = [];
        }
        this.navigationCallbacks[event].push(callback);
    }

    /**
     * Trigger navigation callbacks
     */
    triggerCallback(event, screenNumber) {
        const callbacks = this.navigationCallbacks[event];
        if (callbacks && callbacks.length > 0) {
            callbacks.forEach(callback => callback(screenNumber));
        }
    }

}

// Export for CommonJS (UXP)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager };
}
