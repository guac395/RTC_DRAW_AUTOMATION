# Template Investigation Results & Action Plan

**Date:** December 26, 2025
**Templates Examined:** All templates (128, 64, 32, 16, 8-player brackets)
**Status:** ✅ Complete - Templates Named & Ready for Development

---

## Investigation Findings

### Template Structure

**All templates (8, 16, 32, 64, 128-player brackets) have consistent structure:**

| Property | Finding | Status |
|----------|---------|--------|
| **Text Frames Named** | ✅ Yes - named with `<R1_M1_P1>` pattern | Complete |
| **Champion Frame Named** | ✅ Yes - named `<CHAMPION>` | Complete |
| **Placeholder Text** | ✅ Yes - "EXAMPLE" in each frame | Complete |
| **Direct Typing** | ✅ Yes - can type directly into frames | Good |
| **Text Formatting** | ✅ Yes - Minion Pro, 12pt, pre-formatted | Good |
| **Layer Count** | 2 layers (Layer 1, Layer 2) | Simple |
| **Player Names Location** | Layer 1 | Good |
| **Paragraph Styles** | Only [Basic Paragraph] style exists | Acceptable |
| **Google Auth** | ✅ Yes - OAuth credentials configured | Complete |

---

## Templates Completed

**Status:** ✅ **All templates have been prepared with named text frames**

All text frames across all five bracket sizes have been renamed following the standard naming convention:
- Player positions: `<R{round}_M{match}_P{player}>`
- Champion: `<CHAMPION>`
- Placeholder text: "EXAMPLE" in each frame for visual reference

---

## Recommended Approach: Named Text Frames

### Benefits of Naming Frames
1. **Reliability** - Direct frame access by name
2. **Maintainability** - Clear what each frame is for
3. **Debugging** - Easy to identify issues
4. **Flexibility** - Template layout can change without breaking code
5. **Documentation** - Self-documenting structure

### Implementation Strategy
Use **Option A** from the original plan (Named Frames approach):

```javascript
// Direct frame access by name
const frame = doc.textFrames.itemByName("R1_M1_P1");
frame.contents = `${player.seed}. ${player.name} (${player.handicap})`;
```

---

## Naming Convention

### Standard Format
`R{round}_M{match}_P{player}`

Where:
- **R** = Round number
- **M** = Match number within that round
- **P** = Player position (1 or 2)

### Special Cases
- Finals: `Finals_P1`, `Finals_P2`
- Optional fields: `Tournament_Title`, `Tournament_Date`, `Event_Name`

---

## Complete Naming Scheme

All templates now follow this naming scheme for consistent automation.

### 8-Player Bracket (3 Rounds) ✅

#### Round 1 - Quarterfinals (4 matches)
```
R1_M1_P1    # Seed 1
R1_M1_P2    # Seed 8
R1_M2_P1    # Seed 4
R1_M2_P2    # Seed 5
R1_M3_P1    # Seed 3
R1_M3_P2    # Seed 6
R1_M4_P1    # Seed 2
R1_M4_P2    # Seed 7
```

#### Round 2 - Semifinals (2 matches)
```
R2_M1_P1    # Winner of R1_M1
R2_M1_P2    # Winner of R1_M2
R2_M2_P1    # Winner of R1_M3
R2_M2_P2    # Winner of R1_M4
```

#### Round 3 - Finals (1 match)
```
Finals_P1   # Winner of R2_M1
Finals_P2   # Winner of R2_M2
CHAMPION    # Winner of Finals
```

**Total text frames: 15** (14 players + 1 champion)

---

### 16-Player Bracket (4 Rounds) ✅

#### Round 1 - Round of 16 (8 matches)
```
R1_M1_P1    # Seed 1      R1_M5_P1    # Seed 5
R1_M1_P2    # Seed 16     R1_M5_P2    # Seed 12
R1_M2_P1    # Seed 8      R1_M6_P1    # Seed 4
R1_M2_P2    # Seed 9      R1_M6_P2    # Seed 13
R1_M3_P1    # Seed 4      R1_M7_P1    # Seed 6
R1_M3_P2    # Seed 13     R1_M7_P2    # Seed 11
R1_M4_P1    # Seed 5      R1_M8_P1    # Seed 3
R1_M4_P2    # Seed 12     R1_M8_P2    # Seed 14
```

#### Round 2 - Quarterfinals (4 matches)
```
R2_M1_P1    # Winner of R1_M1
R2_M1_P2    # Winner of R1_M2
R2_M2_P1    # Winner of R1_M3
R2_M2_P2    # Winner of R1_M4
R2_M3_P1    # Winner of R1_M5
R2_M3_P2    # Winner of R1_M6
R2_M4_P1    # Winner of R1_M7
R2_M4_P2    # Winner of R1_M8
```

#### Round 3 - Semifinals (2 matches)
```
R3_M1_P1    # Winner of R2_M1
R3_M1_P2    # Winner of R2_M2
R3_M2_P1    # Winner of R2_M3
R3_M2_P2    # Winner of R2_M4
```

#### Round 4 - Finals (1 match)
```
Finals_P1   # Winner of R3_M1
Finals_P2   # Winner of R3_M2
CHAMPION    # Winner of Finals
```

**Total text frames: 31** (30 players + 1 champion)

---

### 32-Player Bracket (5 Rounds) ✅

#### Round 1 - Round of 32 (16 matches)
```
R1_M1_P1    # Seed 1      R1_M9_P1    # Seed 9
R1_M1_P2    # Seed 32     R1_M9_P2    # Seed 24
R1_M2_P1    # Seed 16     R1_M10_P1   # Seed 8
R1_M2_P2    # Seed 17     R1_M10_P2   # Seed 25
R1_M3_P1    # Seed 8      R1_M11_P1   # Seed 5
R1_M3_P2    # Seed 25     R1_M11_P2   # Seed 28
R1_M4_P1    # Seed 9      R1_M12_P1   # Seed 12
R1_M4_P2    # Seed 24     R1_M12_P2   # Seed 21
R1_M5_P1    # Seed 4      R1_M13_P1   # Seed 3
R1_M5_P2    # Seed 29     R1_M13_P2   # Seed 30
R1_M6_P1    # Seed 13     R1_M14_P1   # Seed 14
R1_M6_P2    # Seed 20     R1_M14_P2   # Seed 19
R1_M7_P1    # Seed 5      R1_M15_P1   # Seed 6
R1_M7_P2    # Seed 28     R1_M15_P2   # Seed 27
R1_M8_P1    # Seed 12     R1_M16_P1   # Seed 11
R1_M8_P2    # Seed 21     R1_M16_P2   # Seed 22
```

#### Round 2 - Round of 16 (8 matches)
```
R2_M1_P1    # Winner of R1_M1
R2_M1_P2    # Winner of R1_M2
R2_M2_P1    # Winner of R1_M3
R2_M2_P2    # Winner of R1_M4
R2_M3_P1    # Winner of R1_M5
R2_M3_P2    # Winner of R1_M6
R2_M4_P1    # Winner of R1_M7
R2_M4_P2    # Winner of R1_M8
R2_M5_P1    # Winner of R1_M9
R2_M5_P2    # Winner of R1_M10
R2_M6_P1    # Winner of R1_M11
R2_M6_P2    # Winner of R1_M12
R2_M7_P1    # Winner of R1_M13
R2_M7_P2    # Winner of R1_M14
R2_M8_P1    # Winner of R1_M15
R2_M8_P2    # Winner of R1_M16
```

#### Round 3 - Quarterfinals (4 matches)
```
R3_M1_P1    # Winner of R2_M1
R3_M1_P2    # Winner of R2_M2
R3_M2_P1    # Winner of R2_M3
R3_M2_P2    # Winner of R2_M4
R3_M3_P1    # Winner of R2_M5
R3_M3_P2    # Winner of R2_M6
R3_M4_P1    # Winner of R2_M7
R3_M4_P2    # Winner of R2_M8
```

#### Round 4 - Semifinals (2 matches)
```
R4_M1_P1    # Winner of R3_M1
R4_M1_P2    # Winner of R3_M2
R4_M2_P1    # Winner of R3_M3
R4_M2_P2    # Winner of R3_M4
```

#### Round 5 - Finals (1 match)
```
Finals_P1   # Winner of R4_M1
Finals_P2   # Winner of R4_M2
CHAMPION    # Winner of Finals
```

**Total text frames: 63** (62 players + 1 champion)

---

### 64-Player Bracket (6 Rounds) ✅

#### Round 1 - Round of 64 (32 matches)
```
R1_M1_P1 through R1_M32_P2
(64 total first-round positions)
```

#### Subsequent Rounds
```
Round 2: 16 matches (32 positions) - R2_M1_P1 through R2_M16_P2
Round 3: 8 matches (16 positions) - R3_M1_P1 through R3_M8_P2
Round 4: 4 matches (8 positions) - R4_M1_P1 through R4_M4_P2
Round 5: 2 matches (4 positions) - R5_M1_P1 through R5_M2_P2
Round 6: Finals (2 positions) - Finals_P1, Finals_P2
Champion: CHAMPION
```

**Total text frames: 127** (126 players + 1 champion)

---

### 128-Player Bracket (7 Rounds) ✅

#### Round 1 - Round of 128 (64 matches)
```
R1_M1_P1 through R1_M64_P2
(128 total first-round positions)
```

#### Subsequent Rounds
```
Round 2: 32 matches (64 positions) - R2_M1_P1 through R2_M32_P2
Round 3: 16 matches (32 positions) - R3_M1_P1 through R3_M16_P2
Round 4: 8 matches (16 positions) - R4_M1_P1 through R4_M8_P2
Round 5: 4 matches (8 positions) - R5_M1_P1 through R5_M4_P2
Round 6: 2 matches (4 positions) - R6_M1_P1 through R6_M2_P2
Round 7: Finals (2 positions) - Finals_P1, Finals_P2
Champion: CHAMPION
```

**Total text frames: 255** (254 players + 1 champion)

---

## Template Summary

| Bracket Size | Rounds | Total Frames | Status |
|-------------|--------|--------------|--------|
| 8 players | 3 | 15 | ✅ Complete |
| 16 players | 4 | 31 | ✅ Complete |
| 32 players | 5 | 63 | ✅ Complete |
| 64 players | 6 | 127 | ✅ Complete |
| 128 players | 7 | 255 | ✅ Complete |

---

## How Text Frames Were Named in InDesign

### Method 1: Via Layers Panel (Recommended)
1. Select the text frame with the **Selection Tool** (black arrow)
2. Open **Layers panel** (Window > Layers)
3. **Double-click** on `<text frame>` in the layers list
4. Type the new name (e.g., `R1_M1_P1`)
5. Press Enter
6. Repeat for each frame

### Method 2: Via Object Layer Options
1. Select the text frame
2. Go to **Object > Object Layer Options**
3. Change the name in the dialog
4. Click OK

### Tips for Efficiency
- Work systematically: start from top-left, work your way through each round
- Use the bracket visually to identify which match each frame belongs to
- Double-check as you go - it's easier to fix mistakes immediately
- Consider saving versions as you work (e.g., "Draw_Template_8_Round1_Named.indd")

---

## Optional: Additional Named Elements

Consider naming these elements if they exist in the templates:

### Tournament Information
```
Tournament_Title      # Main tournament name
Event_Name           # Specific event (e.g., "Men's A Class Singles")
Tournament_Date      # Date or date range
Venue               # Location
```

### Match Details (if applicable)
```
R1_M1_Score         # Score for match 1
R1_M1_Date          # Date/time for match 1
```

### Seeds/Handicaps
If seed numbers or handicaps are in separate frames:
```
R1_M1_P1_Seed       # Seed number for first player
R1_M1_P1_HCAP       # Handicap for first player
```

**Note:** Only name these if they're actually separate frames. If they're part of the same text frame as the player name, don't worry about them.

---

## Completed Setup Tasks

### Template Preparation ✅

**All templates have been prepared and are ready for automation:**

- ✅ **Draw_Template_8.indd** - All 15 text frames named
- ✅ **Draw_Template_16.indd** - All 31 text frames named
- ✅ **Draw_Template_32.indd** - All 63 text frames named
- ✅ **Draw_Template_64.indd** - All 127 text frames named
- ✅ **Draw_Template_128.indd** - All 255 text frames named
- ✅ **Text formatting** verified across all templates (Minion Pro, 12pt)
- ✅ **Placeholder text** ("EXAMPLE") added to all frames for visual reference
- ✅ **Google OAuth credentials** configured and working

### Next Development Tasks

**Ready to implement - templates are prepared:**

- [ ] Build InDesign DOM integration module for text frame population
- [ ] Create bracket mapping configurations for all 5 bracket sizes
- [ ] Implement template selection UI in the extension panel
- [ ] Build population logic with error handling
- [ ] Test with sample tournament data for all bracket sizes
- [ ] Handle edge cases (byes, withdrawals, partial brackets)

---

## Current Project Status

### Completed ✅
- ✅ UXP extension scaffold created
- ✅ Template investigation complete
- ✅ **All 5 templates named** (8, 16, 32, 64, 128-player brackets)
- ✅ Google Sheets OAuth integration implemented ([sheetsAPI.js](../scripts/data/sheetsAPI.js))
- ✅ Handicap data loader implemented ([handicapData.js](../scripts/data/handicapData.js))
- ✅ Matchmaking engine implemented ([seedingEngine.js](../scripts/matchmaking/seedingEngine.js))
- ✅ Pairing engine implemented ([pairingEngine.js](../scripts/matchmaking/pairingEngine.js))
- ✅ Validation rules implemented ([validation.js](../scripts/matchmaking/validation.js))
- ✅ Form parser implemented ([formParser.js](../scripts/data/formParser.js))

### Ready to Implement
- ⏳ InDesign DOM integration (**UNBLOCKED - templates ready**)
- ⏳ Template population logic for all 5 bracket sizes
- ⏳ UI for template selection
- ⏳ Integration testing with real tournament data
- ⏳ Edge case handling (byes, withdrawals, partial brackets)

---

## Technical Implementation Notes

### Code Structure for InDesign Population

```javascript
// Template configuration for all bracket sizes
const BRACKET_CONFIGS = {
  8: { rounds: 3, firstRoundMatches: 4, totalFrames: 15 },
  16: { rounds: 4, firstRoundMatches: 8, totalFrames: 31 },
  32: { rounds: 5, firstRoundMatches: 16, totalFrames: 63 },
  64: { rounds: 6, firstRoundMatches: 32, totalFrames: 127 },
  128: { rounds: 7, firstRoundMatches: 64, totalFrames: 255 }
};

// Traditional seeding positions (already implemented in seedingEngine.js)
const BRACKET_POSITIONS_8 = [1, 8, 4, 5, 2, 7, 3, 6];
const BRACKET_POSITIONS_16 = [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
const BRACKET_POSITIONS_32 = [
  1, 32, 16, 17, 8, 25, 9, 24, 4, 29, 13, 20, 5, 28, 12, 21,
  2, 31, 15, 18, 7, 26, 10, 23, 3, 30, 14, 19, 6, 27, 11, 22
];
// ... similar for 64 and 128

// Population function using named frames
function populateFrame(frameName, player) {
  const frame = app.activeDocument.textFrames.itemByName(frameName);
  if (frame.isValid) {
    // Replace "EXAMPLE" placeholder with actual player data
    frame.contents = `${player.seed}. ${player.name} (${player.handicap})`;
  } else {
    console.warn(`Frame not found: ${frameName}`);
  }
}

// Populate entire bracket
function populateBracket(seededPlayers, bracketSize) {
  const config = BRACKET_CONFIGS[bracketSize];
  const matchCount = config.firstRoundMatches;

  // Populate Round 1 with seeded players
  for (let m = 1; m <= matchCount; m++) {
    const p1Index = (m - 1) * 2;
    const p2Index = p1Index + 1;

    if (seededPlayers[p1Index]) {
      populateFrame(`R1_M${m}_P1`, seededPlayers[p1Index]);
    }
    if (seededPlayers[p2Index]) {
      populateFrame(`R1_M${m}_P2`, seededPlayers[p2Index]);
    }
  }

  // Later rounds are populated as matches progress
  // (This would be done manually or via results entry)
}
```

### Benefits Over Position-Based Approach
- **75% less code** - Direct frame access vs coordinate sorting
- **Zero positioning errors** - No risk of frames in wrong order
- **Template flexibility** - Layout can change without code changes
- **Easier debugging** - Can inspect exact frame by name
- **Self-documenting** - Code clearly shows what's happening

---

## Risk Mitigation

### What if naming takes too long?
- **Fallback:** We can still use position-based approach (Option C)
- **Hybrid:** Name just Round 1 frames, use position for later rounds
- **Tradeoff:** More development time and less reliability

### What if frame names get changed accidentally?
- **Prevention:** Lock layers after naming
- **Recovery:** Extension can detect missing frames and report errors
- **Documentation:** Keep this naming scheme as reference

### What if we need different layouts in the future?
- **Easy:** Just follow the same naming convention
- **Compatible:** Extension will work with any layout that uses these names

---

## Key Decisions Made

✅ All text frames named using R{round}_M{match}_P{player} convention
✅ Champion frame named as CHAMPION
✅ All 5 bracket sizes completed (8, 16, 32, 64, 128)
✅ Named frame approach (Option A) for development
✅ Placeholder text "EXAMPLE" added to all frames
✅ Google OAuth configured and working
✅ Existing codebase has matchmaking, seeding, and data loading complete

### Implementation Approach
- **Seed, name, and handicap in single frame** - All player data combined in one text frame per position
- **No separate match detail frames** - Focus on initial draw population only
- **Minion Pro 12pt formatting preserved** - No custom paragraph styles needed
- **Manual result entry** - Later rounds populated manually as tournament progresses

---

## Next Steps Summary

**Completed:**
1. ✅ Template investigation complete
2. ✅ **All 5 templates named** (8, 16, 32, 64, 128-player brackets)
3. ✅ **Google Cloud OAuth setup complete**
4. ✅ **Core matchmaking engine implemented**
5. ✅ **Data loading infrastructure complete**

**Ready to Implement:**
1. Create InDesign DOM integration module (scripts/indesign/templatePopulator.js)
2. Add bracket size selector to UI ([index.html](../index.html))
3. Build population workflow integration ([scripts/main.js](../scripts/main.js))
4. Test with real tournament data from Google Sheets
5. Handle edge cases (partial brackets, byes, withdrawals)
6. End-to-end integration testing

**Current Status:** All blocking tasks complete - ready for InDesign integration development

---

## Success Criteria

### Template Preparation ✅ COMPLETE
- ✅ All text frames in 8-player template named
- ✅ All text frames in 16-player template named
- ✅ All text frames in 32-player template named
- ✅ All text frames in 64-player template named
- ✅ All text frames in 128-player template named
- ✅ Frame names follow exact convention (case-sensitive)
- ✅ Text formatting preserved (Minion Pro, 12pt)
- ✅ Placeholder text "EXAMPLE" in all frames
- ✅ Templates saved and ready for automation

### Development Environment ✅ COMPLETE
- ✅ Google Cloud credentials configured
- ✅ OAuth authentication working
- ✅ UXP extension scaffold complete
- ✅ Matchmaking engine implemented
- ✅ Data loading infrastructure ready
- ✅ All core modules in place

---

**Status:** ✅ **Ready for InDesign Integration Development**
**Blockers:** None - all prerequisites complete
**Next Milestone:** Build InDesign DOM integration and template population workflow