# R&TC Tournament Matcher

Adobe InDesign UXP Extension for automating tournament bracket generation at the Racquet & Tennis Club.

## Current Status - Week 3 Complete

### ✅ Completed
- UXP extension scaffold with UI
- All tournament events defined (35 total events across 3 sports)
- Panel design complete with responsive layout
- Google Sheets OAuth integration module
- Handicap data loader with fuzzy name matching
- Form response parser
- Tournament events data structure
- Seeding engine with 4 algorithms (traditional, random, stratified, balanced)
- Bracket generation for 8/16/32/64/128 player tournaments
- Complete validation system
- HTML and text preview generation
- Google Cloud OAuth credentials configured
- **InDesign document population** - Generate in Document button fully functional
- Template validation and error handling
- Comprehensive user feedback and logging

### 🚀 Ready for Testing
- **InDesign template population** - Requires text frames in templates to be named with convention `R{round}_M{match}_P{player}` (see [WEEK_3_COMPLETION_SUMMARY.md](WEEK_3_COMPLETION_SUMMARY.md) for details)

## Project Structure

```
rtc-tournament-matcher/
├── manifest.json                 # UXP configuration
├── index.html                    # Panel UI
├── icons/                        # Panel icons (23x23)
│   ├── dark.png                 # ✅ Icon added
│   └── light.png                # ✅ Icon added
├── scripts/
│   ├── main.js                  # ✅ Entry point & UI logic
│   ├── data/
│   │   ├── tournamentEvents.js  # ✅ All 35 events defined
│   │   ├── sheetsAPI.js         # ✅ Google Sheets integration
│   │   ├── formParser.js        # ✅ Parse form responses
│   │   └── handicapData.js      # ✅ Player handicap lookup
│   ├── matchmaking/
│   │   ├── seedingEngine.js     # ✅ 4 seeding algorithms
│   │   ├── pairingEngine.js     # ✅ Bracket generation
│   │   ├── validation.js        # ✅ Entry validation
│   │   └── preview.js           # ✅ Bracket preview
│   └── indesign/
│       └── templatePopulator.js # ✅ InDesign document population
└── styles/
    └── panel.css                # ✅ Complete styling
```

## Installation & Testing

### Prerequisites
1. Adobe InDesign 2024 or later
2. UXP Developer Tool

### Setup Steps
1. Install [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/devtool/)
2. Load this extension in UXP Developer Tool
3. Launch with InDesign as the host application

### Testing the Extension
1. Open InDesign
2. Window > Extensions > Tournament Matcher
3. The panel will open on the right side

## Required Actions

### InDesign Template Preparation (Required for Week 3)
Text frames in both InDesign templates need to be named before development can continue.

**Templates to update:**
- Draw_Template_8.indd (14 text frames to name)
- Draw_Template_32.indd (62 text frames to name)

**Naming convention:** `R{round}_M{match}_P{player}` (e.g., R1_M1_P1, R1_M1_P2, Finals_P1, Finals_P2)

**See:** [TEMPLATE_INVESTIGATION.md](TEMPLATE_INVESTIGATION.md) for complete instructions and naming scheme

## Features Completed

### Data Layer
- **Google Sheets Integration**: Full OAuth 2.0 flow for secure access
- **Form Parser**: Automatically parses tournament entry forms
- **Handicap Database**: Loads 508+ players with fuzzy name matching
- **Tournament Events**: All 35 events across Squash, Court Tennis, and Racquets

### User Interface
- **Connection Management**: Connect/disconnect from Google Sheets
- **Tournament Selection**: Sport → Type → Event dropdowns
- **Participant Display**: Lists all entrants with handicaps
- **Validation Warnings**: Shows missing handicaps and data issues
- **Seeding Options**: Traditional, Random, Stratified, Balanced

## Next Steps (Week 3)

### InDesign Integration (Blocked)
- [ ] Name text frames in templates (client action required)
- [ ] InDesign DOM manipulation module
- [ ] Template mapping logic
- [ ] Text frame population
- [ ] Format preservation

## Development Roadmap

| Week | Phase | Status |
|------|-------|--------|
| 1 | Foundation & Data Layer | ✅ Complete |
| 2 | Matchmaking Engine | ✅ Complete |
| 3 | InDesign Integration | ⏸️ Blocked - requires template text frame naming |
| 4 | Testing & Polish | ⏳ Pending Week 3 completion |

## Technical Notes

### UXP Limitations
- OAuth requires user to copy/paste authorization code (no automatic redirect)
- Local storage used for token persistence
- Network requests require explicit permissions in manifest

### Data Flow
```
Google Sheets → OAuth → Parse Responses → Match Handicaps →
Generate Bracket → Validate → Preview → Populate InDesign
```

### Tournament Events Structure

**Squash** (15 events)
- Singles: A (Championship), B, C, D, E, Hardball, 45+, 55+, 65+, Mackay
- Doubles: A (Championship), B, C, D, Century

**Court Tennis** (13 events)
- Singles: First Class, 1, 2, 3, 4, 5
- Doubles: First Class, 1, 2, 3, 4, 5, 120

**Racquets** (7 events)
- Singles: Championship, 1, 2, 3
- Doubles: Championship, 1, 2

## Support

For issues or questions:
1. Check the [implementation plan](IMPLEMENTATION_PLAN.md)
2. Review console logs in UXP Developer Tool
3. Contact developer with error screenshots

## License

Proprietary - Racquet & Tennis Club
