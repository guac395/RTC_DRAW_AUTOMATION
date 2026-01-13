# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adobe InDesign UXP extension for automating tournament bracket generation at the Racquet & Tennis Club. The extension connects to Google Sheets to load tournament entries, matches players with their handicaps using fuzzy matching, generates tournament brackets (8/16/32/64/128 players) with multiple seeding algorithms, and populates InDesign templates automatically.

**Key Sports:** Squash (15 events), Court Tennis (13 events), Racquets (7 events)

## Build & Development Commands

### Building
```bash
npm run build          # Production build with webpack
npm run dev            # Development build with watch mode
```

### Loading the Extension
1. Install [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/devtool/)
2. Load extension by pointing to the `dist/` directory (after building)
3. Launch with Adobe InDesign as host application
4. Access via Window > Extensions > Tournament Matcher

### Testing
- Open InDesign, load the extension via UXP Developer Tool
- Use UXP Developer Tool console for debugging (Plugins > Development > Developer Console)
- Check logs: macOS: `~/Library/Logs/Adobe/UXPLogs`

## Architecture

### UXP-Specific Constraints
- **V8 JavaScript engine** runs in InDesign's main thread - synchronous operations >10ms freeze the UI
- **No Node.js binary modules** - only pure JavaScript CommonJS modules
- **Entry-based file system** - use `Entry` objects, not string paths
- **Flexbox-only CSS** - no CSS Grid, no float
- **Spectrum Web Components** enabled via `enableSWCSupport: true` in manifest
- **Network domains** must be explicitly whitelisted in manifest
- Use `await new Promise(r => setTimeout(r, 0))` to yield main thread during heavy loops

### Data Flow Architecture
```
Google Sheets OAuth → Parse Form Responses → Fuzzy Match Handicaps →
Seeding Engine (4 algorithms) → Bracket Generation → Validation →
InDesign Template Population
```

### Module Structure
```
src/
├── main.js                      # Entry point, UI orchestration, global state
├── config.js                    # Google OAuth credentials (hardcoded for single client)
├── navigation.js                # NavigationManager class - handles 3-screen wizard
├── data/
│   ├── sheetsAPI.js             # Google Sheets OAuth + API calls
│   ├── formParser.js            # Parse tournament entry form responses
│   ├── handicapData.js          # Load handicap database, fuzzy name matching
│   └── partnerParser.js         # Doubles partner parsing
├── matchmaking/
│   ├── seedingEngine.js         # 4 algorithms: traditional, random, stratified, balanced
│   ├── pairingEngine.js         # Bracket generation logic (single/double elimination)
│   ├── validation.js            # Entry validation, missing handicaps
│   └── teamHandicap.js          # Doubles team handicap calculation
└── indesign/
    └── templatePopulator.js     # InDesign DOM manipulation, text frame population
```

### State Management
- Global state lives in `window.appState` (main.js:32-46)
- Accessed by NavigationManager and all UI handlers
- State includes: connection status, workbook IDs, form entries, participants with handicaps, generated bracket

### Navigation System
- **NavigationManager** (navigation.js) controls 3-screen wizard:
  1. Connection (OAuth + workbook selection)
  2. Event Selection (load entries, view participants)
  3. Generation (preview, populate InDesign)
- Screen visibility controlled by `showScreen(screenNumber)`, which handles progress bar, button states
- Forward/Back buttons managed by NavigationManager, with validation gates

## InDesign Integration

### Template Requirements
InDesign templates must have **named text frames** following this convention:
- `R{round}_M{match}_P{player}` - e.g., `R1_M1_P1`, `R1_M1_P2`
- Special names: `Finals_P1`, `Finals_P2`, `Semis_M1_P1`, etc.
- Templates: `Draw_Template_8.indd`, `Draw_Template_32.indd`

### Template Population
- `populateDocument()` in templatePopulator.js uses frame cache for O(1) lookups
- Populates player names, seeds, handicaps into text frames
- Validates frames exist before generation
- Returns detailed results (populated count, missing frames, errors)

## Google Sheets Integration

### OAuth Flow
1. User clicks "Connect to Google Sheets"
2. Extension opens browser to Google OAuth consent
3. User authorizes, copies authorization code
4. User pastes code in extension UI
5. Extension exchanges code for access token
6. Token stored in localStorage for persistence

### OAuth Implementation
- Client ID/Secret in config.js (hardcoded for single client deployment)
- OAuth scopes: spreadsheets.readonly, drive.readonly
- Manual code copy/paste (UXP limitation - no automatic redirect)
- Token refresh handled automatically by sheetsAPI.js

### Data Loading
- `sheetsAPI.listSpreadsheets()` - lists all accessible spreadsheets
- `sheetsAPI.getTabNames(workbookId)` - get tabs for selected workbook
- `sheetsAPI.getTabData(workbookId, tabName)` - load tab data as 2D array
- `parseEventTabData(rawData)` - parses form response data into structured entries

## Seeding Algorithms

### 1. Traditional Seeding
Standard tournament seeding (1 vs lowest seed, 2 vs second-lowest, etc.)

### 2. Random Seeding
Completely randomizes bracket positions (used when no handicaps available)

### 3. Stratified Seeding
Divides players into tiers by handicap, randomizes within tiers (reduces first-round blowouts)

### 4. Balanced Seeding
Optimizes bracket balance across halves and quarters (experimental, compute-intensive)

## Handicap Matching

### Fuzzy Matching
- Uses Levenshtein distance for name matching
- Handles variations: "John Smith" vs "J. Smith" vs "Smith, John"
- Configurable threshold in handicapData.js
- Returns match confidence score
- **508+ players** in handicap database

### Name Normalization
- Strips titles (Mr., Mrs., Dr.)
- Converts to lowercase
- Removes special characters
- Handles common abbreviations

## Spectrum Web Components

### Enabled Components
- `<sp-button>` - primary action buttons
- `<sp-action-button>` - navigation buttons (with `quiet` attribute to avoid grey backgrounds)
- `<sp-theme>` - wraps entire UI (theme="spectrum", color="lightest", scale="medium")

### Custom Styling
CSS in styles/panel.css overrides Spectrum colors via CSS custom properties:
- `--spectrum-global-color-static-blue-600` overridden to #800020 (burgundy)
- `--spectrum-global-color-static-blue-700` overridden to #5c0017 (dark burgundy)
- Navy color #001f3f for secondary actions

### Important Note
Spectrum components use Shadow DOM - use `addEventListener()`, not `onclick`, for event handling.

## Webpack Configuration

### Build Process
- Entry: `src/main.js`
- Output: `dist/bundle.js` (IIFE format)
- Target: `web` (browser-like UXP environment)
- Externals: `uxp`, `indesign` (provided by UXP runtime)
- Copies: index.html, manifest.json, styles/, icons/

### Module System
- Source uses CommonJS (`require`/`module.exports`)
- Webpack bundles into single IIFE for UXP panel
- No ES6 modules - UXP only supports CommonJS

## Common Development Patterns

### Accessing InDesign DOM
```javascript
const { app } = require('indesign');
const doc = app.activeDocument;
const textFrames = doc.pages.item(0).textFrames;
```

### Frame Cache Pattern
Build once, lookup many times (O(1) instead of O(pages × frames)):
```javascript
const cache = new Map();
for (let p = 0; p < doc.pages.length; p++) {
    const frames = doc.pages.item(p).textFrames;
    for (let i = 0; i < frames.length; i++) {
        cache.set(frames.item(i).name, frames.item(i));
    }
}
const frame = cache.get('R1_M1_P1');
```

### Validation Before Actions
- Check `appState.connected` before loading data
- Validate handicaps loaded before seeding
- Validate bracket generated before InDesign population
- Check `isDocumentValid()` before InDesign operations

### Error Handling
- Log all errors to console (visible in UXP Developer Tool)
- Show user-friendly messages via `showMessage()` helper
- Return structured error objects: `{ success: false, error: 'message' }`

## Known Limitations & Blockers

### Template Preparation Required
InDesign templates must have text frames manually named before the extension can populate them. This is a one-time setup by the client.

### UXP OAuth Limitations
- No automatic OAuth redirect (security model)
- User must manually copy/paste authorization code
- This is intentional UXP design, not a bug

### Performance Considerations
- Bracket generation for 128 players can take 1-2 seconds
- Use main thread yielding for large brackets
- Frame cache is critical for InDesign performance

## File Locations

### Configuration
- OAuth credentials: `src/config.js`
- Manifest: `manifest.json`
- Webpack config: `webpack.config.js`

### Documentation
- Main README: `docs/README.md`
- UXP Architecture Guide: `docs/UXP_DEVELOPMENT_GUIDE.md`
- Spectrum Migration Guide: `SPECTRUM_MIGRATION_GUIDE.md`
- Template Investigation: `docs/TEMPLATE_INVESTIGATION.md`

### Example Data
- CSV examples: `docs/example_data/`
