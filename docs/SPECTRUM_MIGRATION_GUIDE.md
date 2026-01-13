# Complete Guide: Migrating HTML Buttons to Spectrum Web Components

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Steps](#migration-steps)
4. [Testing & Verification](#testing--verification)
5. [Rollback Procedure](#rollback-procedure)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Guide Does
This guide provides exhaustive, step-by-step instructions for converting all standard HTML `<button>` elements in the R&TC Tournament Matcher UXP plugin to Adobe Spectrum Web Components (`<sp-button>` and `<sp-action-button>`).

### Why Migrate?
- **Solves grey background rendering issues** in Adobe UXP environment
- **Native Adobe UI/UX** consistency across Creative Cloud apps
- **Better accessibility** out-of-the-box
- **Less custom CSS** to maintain
- **Proper UXP rendering** without CSS hacks

### Scope
**Files Modified:** 4
**Buttons Converted:** 7
**Estimated Time:** 2-4 hours
**Risk Level:** Medium

---

## Prerequisites

### Required Knowledge
- Understanding of HTML/CSS
- Familiarity with Adobe UXP plugin structure
- Access to Adobe UXP Developer Tools

### Backup First
```bash
# Create a backup before starting
cp -r /Users/eli/Desktop/RTC_DRAW_AUTOMATION /Users/eli/Desktop/RTC_DRAW_AUTOMATION_BACKUP_$(date +%Y%m%d_%H%M%S)
```

### Required Tools
- Adobe UXP Developer Tool (for testing)
- Code editor (VS Code recommended)
- Adobe InDesign (or target Creative Cloud app)

---

## Migration Steps

## STEP 1: Enable Spectrum Web Components Support

### File: `manifest.json`

**Location:** `/Users/eli/Desktop/RTC_DRAW_AUTOMATION/manifest.json`

**Action:** Add Spectrum support flag to the manifest

**Instructions:**

1. Open `manifest.json`
2. Locate the root JSON object
3. Add the `"enableSWCSupport"` property

**Before:**
```json
{
  "manifestVersion": 5,
  "id": "com.rtc.tournamentmatcher",
  "name": "R&TC Tournament Matcher",
  "version": "1.0.0",
  "main": "index.html",
  "host": {
    "app": "ID",
    "minVersion": "18.0"
  },
  "entrypoints": [
    {
      "type": "panel",
      "id": "tournamentPanel",
      "label": {
        "default": "Tournament Matcher"
      }
    }
  ],
  "requiredPermissions": [
    "network",
    "launchProcess",
    "webview"
  ]
}
```

**After:**
```json
{
  "manifestVersion": 5,
  "id": "com.rtc.tournamentmatcher",
  "name": "R&TC Tournament Matcher",
  "version": "1.0.0",
  "main": "index.html",
  "enableSWCSupport": true,
  "host": {
    "app": "ID",
    "minVersion": "18.0"
  },
  "entrypoints": [
    {
      "type": "panel",
      "id": "tournamentPanel",
      "label": {
        "default": "Tournament Matcher"
      }
    }
  ],
  "requiredPermissions": [
    "network",
    "launchProcess",
    "webview"
  ]
}
```

**Key Changes:**
- Added `"enableSWCSupport": true` after the `main` property
- Position doesn't matter as long as it's in the root object
- Ensure proper JSON syntax (comma after previous property)

**Verification:**
```bash
# Validate JSON syntax
cat manifest.json | python -m json.tool > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

---

## STEP 2: Import Spectrum Web Components

### File: `index.html`

**Location:** `/Users/eli/Desktop/RTC_DRAW_AUTOMATION/index.html`

**Action:** Add Spectrum component imports in the `<head>` section

**Instructions:**

1. Open `index.html`
2. Locate the `<head>` section (around line 3)
3. Add Spectrum imports BEFORE the closing `</head>` tag
4. Add imports AFTER the existing `<link rel="stylesheet" href="styles/panel.css">` line

**Current `<head>` section (lines 1-7):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>R&TC Tournament Matcher</title>
    <link rel="stylesheet" href="styles/panel.css">
</head>
```

**Updated `<head>` section:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>R&TC Tournament Matcher</title>
    <link rel="stylesheet" href="styles/panel.css">

    <!-- Spectrum Web Components -->
    <script type="module" src="https://swc.adobe.com/base/button/index.js"></script>
    <script type="module" src="https://swc.adobe.com/base/action-button/index.js"></script>
    <script type="module" src="https://swc.adobe.com/base/theme/index.js"></script>
    <script type="module" src="https://swc.adobe.com/base/theme/theme-lightest/index.js"></script>
</head>
```

**Alternative: Local Spectrum Imports (if offline compatibility needed):**

If you need offline support, download Spectrum components locally:

```html
<head>
    <meta charset="UTF-8">
    <title>R&TC Tournament Matcher</title>
    <link rel="stylesheet" href="styles/panel.css">

    <!-- Local Spectrum Web Components (if using local files) -->
    <script type="module" src="spectrum-web-components/button.js"></script>
    <script type="module" src="spectrum-web-components/action-button.js"></script>
    <script type="module" src="spectrum-web-components/theme.js"></script>
</head>
```

**Note:** For UXP plugins, CDN imports (https://swc.adobe.com) are recommended and typically work even in offline scenarios due to UXP caching.

---

## STEP 3: Convert HTML Buttons to Spectrum Components

### File: `index.html`

**Location:** `/Users/eli/Desktop/RTC_DRAW_AUTOMATION/index.html`

**Action:** Replace all 7 `<button>` elements with Spectrum equivalents

---

### Button 1: Connect to Google Sheets

**Location:** Line 36 in `index.html`

**Current HTML:**
```html
<button id="btn-connect" class="btn btn-primary">Connect to Google Sheets</button>
```

**Replace with:**
```html
<sp-button id="btn-connect" variant="cta" size="m">Connect to Google Sheets</sp-button>
```

**Attributes Explained:**
- `id="btn-connect"` - Keep same ID for JavaScript compatibility
- `variant="cta"` - Call-to-action style (prominent burgundy/blue button)
- `size="m"` - Medium size (default)
- **Removed:** `class="btn btn-primary"` - No longer needed, Spectrum handles styling

---

### Button 2: Complete Connection (Submit Auth)

**Location:** Line 44 in `index.html`

**Current HTML:**
```html
<button id="btn-submit-auth" class="btn btn-success">Complete Connection</button>
```

**Replace with:**
```html
<sp-button id="btn-submit-auth" variant="primary" size="m">Complete Connection</sp-button>
```

**Attributes Explained:**
- `variant="primary"` - Primary action style (navy/blue)
- Use `primary` instead of `cta` for secondary important actions

---

### Button 3: Load Entries

**Location:** Line 66 in `index.html`

**Current HTML:**
```html
<button id="btn-load-entries" class="btn btn-primary" disabled>Load Entries</button>
```

**Replace with:**
```html
<sp-button id="btn-load-entries" variant="cta" size="m" disabled>Load Entries</sp-button>
```

**Attributes Explained:**
- `disabled` - Keep the disabled attribute (Spectrum handles disabled styling automatically)
- Spectrum will apply proper disabled opacity and cursor styles

---

### Button 4: Preview Bracket

**Location:** Line 90 in `index.html`

**Current HTML:**
```html
<button id="btn-preview" class="btn btn-primary">Preview Bracket</button>
```

**Replace with:**
```html
<sp-button id="btn-preview" variant="cta" size="m">Preview Bracket</sp-button>
```

---

### Button 5: Generate in Document

**Location:** Line 91 in `index.html`

**Current HTML:**
```html
<button id="btn-generate" class="btn btn-success" disabled>Generate in Document</button>
```

**Replace with:**
```html
<sp-button id="btn-generate" variant="primary" size="m" disabled>Generate in Document</sp-button>
```

---

### Button 6: Back Navigation Button

**Location:** Line 105-107 in `index.html`

**Current HTML:**
```html
<button id="nav-btn-back" class="nav-btn nav-btn-back" disabled>
    <span class="nav-arrow">←</span>
    <span>Back</span>
</button>
```

**Replace with:**
```html
<sp-action-button id="nav-btn-back" quiet disabled>
    <span slot="icon">←</span>
    Back
</sp-action-button>
```

**Attributes Explained:**
- `<sp-action-button>` - Used for navigation/icon buttons
- `quiet` - Removes background, shows only on hover (solves grey background issue!)
- `slot="icon"` - Spectrum's way of positioning icon before text
- **Removed:** Nested `<span>` for text, Spectrum handles text directly

**Alternative with SVG icon:**
```html
<sp-action-button id="nav-btn-back" quiet disabled>
    <svg slot="icon" viewBox="0 0 24 24" width="18" height="18">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
    Back
</sp-action-button>
```

---

### Button 7: Forward Navigation Button

**Location:** Line 109-111 in `index.html`

**Current HTML:**
```html
<button id="nav-btn-forward" class="nav-btn nav-btn-forward">
    <span>Forward</span>
    <span class="nav-arrow">→</span>
</button>
```

**Replace with:**
```html
<sp-action-button id="nav-btn-forward" quiet>
    Forward
    <span slot="icon">→</span>
</sp-action-button>
```

**Note:** Icon appears after text when `slot="icon"` comes after the text content.

**Alternative for "Done" state (if button text changes dynamically):**

The JavaScript likely changes this button's text to "Done" on the last screen. Spectrum handles this the same way:

```javascript
// In your JavaScript (no changes needed)
document.getElementById('nav-btn-forward').textContent = 'Done';
// The arrow icon will remain because it's slotted separately
```

If you want the arrow to disappear when it says "Done", update your JavaScript to:

```javascript
const forwardBtn = document.getElementById('nav-btn-forward');
const iconSlot = forwardBtn.querySelector('[slot="icon"]');
if (iconSlot) iconSlot.remove();
forwardBtn.textContent = 'Done';
```

---

### Complete Button Summary Table

| Old ID | Old Classes | New Component | Variant | Size | Disabled | Quiet |
|--------|------------|---------------|---------|------|----------|-------|
| `btn-connect` | `btn btn-primary` | `<sp-button>` | `cta` | `m` | No | No |
| `btn-submit-auth` | `btn btn-success` | `<sp-button>` | `primary` | `m` | No | No |
| `btn-load-entries` | `btn btn-primary` | `<sp-button>` | `cta` | `m` | Yes | No |
| `btn-preview` | `btn btn-primary` | `<sp-button>` | `cta` | `m` | No | No |
| `btn-generate` | `btn btn-success` | `<sp-button>` | `primary` | `m` | Yes | No |
| `nav-btn-back` | `nav-btn nav-btn-back` | `<sp-action-button>` | - | - | Yes | Yes |
| `nav-btn-forward` | `nav-btn nav-btn-forward` | `<sp-action-button>` | - | - | No | Yes |

---

## STEP 4: Update CSS Styles

### File: `styles/panel.css`

**Location:** `/Users/eli/Desktop/RTC_DRAW_AUTOMATION/styles/panel.css`

**Action:** Remove old button CSS and add Spectrum customizations

---

### 4A: Remove Old Button CSS

**Delete the following CSS sections:**

**Section 1: Base Button Styles (lines ~169-207)**

Delete this entire block:
```css
/* Buttons */
.btn {
    padding: 10px 20px;
    border: 2px solid transparent;
    border-radius: 8px;
    background: transparent !important;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    margin-bottom: 8px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    box-shadow: none;
}

.btn:focus {
    outline: none !important;
    box-shadow: none !important;
    border-color: transparent !important;
}

.btn:focus-visible {
    outline: none !important;
    box-shadow: none !important;
}

.btn:active:not(:disabled) {
    transform: scale(0.98);
    box-shadow: none !important;
    outline: none !important;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

**Section 2: Button Variant Styles (lines ~210-283)**

Delete all `.btn-primary`, `.btn-secondary`, `.btn-success` blocks:
```css
.btn-primary {
    background: #800020 !important;
    color: white;
    border-color: #800020;
}

.btn-primary:hover:not(:disabled) {
    background: #5c0017 !important;
    border-color: #5c0017;
}

.btn-primary:focus {
    background: #800020 !important;
    border-color: #800020 !important;
    outline: none !important;
    box-shadow: none !important;
}

.btn-primary:active:not(:disabled) {
    background: #5c0017 !important;
    border-color: #5c0017 !important;
    outline: none !important;
    box-shadow: none !important;
}

.btn-secondary {
    background: #666 !important;
    color: white;
    border-color: #666;
}

.btn-secondary:hover:not(:disabled) {
    background: #555 !important;
    border-color: #555;
}

.btn-secondary:focus {
    background: #666 !important;
    border-color: #666 !important;
    outline: none !important;
    box-shadow: none !important;
}

.btn-secondary:active:not(:disabled) {
    background: #555 !important;
    border-color: #555 !important;
    outline: none !important;
    box-shadow: none !important;
}

.btn-success {
    background: #001f3f !important;
    color: white;
    border-color: #001f3f;
}

.btn-success:hover:not(:disabled) {
    background: #001528 !important;
    border-color: #001528;
}

.btn-success:focus {
    background: #001f3f !important;
    border-color: #001f3f !important;
    outline: none !important;
    box-shadow: none !important;
}

.btn-success:active:not(:disabled) {
    background: #001528 !important;
    border-color: #001528 !important;
    outline: none !important;
    box-shadow: none !important;
}
```

**Section 3: Action Buttons Container (lines ~273-276)**

**KEEP THIS** - It's for layout, not button styling:
```css
.action-buttons {
    margin-top: 20px;
}
```

**Section 4: Navigation Button Styles (lines ~726-808)**

Delete all `.nav-btn`, `.nav-btn-back`, `.nav-btn-forward`, `.nav-arrow` blocks:
```css
.nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: 2px solid #800020;
    border-radius: 12px;
    background: white !important;
    color: #800020;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
    justify-content: center;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    box-shadow: none;
}

.nav-btn:focus {
    outline: none !important;
    box-shadow: none !important;
    background: white !important;
    border-color: #800020 !important;
}

.nav-btn:focus-visible {
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(128, 0, 32, 0.2) !important;
}

.nav-btn:hover:not(:disabled) {
    background: #800020 !important;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(128, 0, 32, 0.3);
}

.nav-btn:active:not(:disabled) {
    transform: translateY(0);
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: #ccc;
    color: #999;
    background: #f5f5f5 !important;
}

.nav-btn-back {
    margin-right: auto;
}

.nav-btn-forward {
    margin-left: auto;
    background: #800020 !important;
    color: white;
}

.nav-btn-forward:hover:not(:disabled) {
    background: #5c0017 !important;
}

.nav-btn-forward:focus {
    background: #800020 !important;
    color: white !important;
    outline: none !important;
    box-shadow: none !important;
}

.nav-btn-forward:focus-visible {
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(128, 0, 32, 0.4) !important;
}

.nav-btn-forward:active:not(:disabled) {
    background: #5c0017 !important;
    outline: none !important;
    box-shadow: none !important;
}

.nav-arrow {
    font-size: 18px;
    font-weight: bold;
}
```

**Section 5: Global Button Reset (lines ~9-28)**

Delete the global button override:
```css
/* Force remove all default button styling */
button {
    background: none !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
}

button:focus,
button:active,
button:focus-visible {
    outline: none !important;
    box-shadow: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
}
```

---

### 4B: Add Spectrum Theme Wrapper

**Location:** Top of `<body>` in `index.html` (line 8)

**Current:**
```html
<body>
    <div id="app">
```

**Updated:**
```html
<body>
    <sp-theme theme="spectrum" color="light" scale="medium">
        <div id="app">
```

**And close the theme wrapper before `</body>`:**

**Current (end of file):**
```html
    </div> <!-- End #app -->
</body>
</html>
```

**Updated:**
```html
        </div> <!-- End #app -->
    </sp-theme>
</body>
</html>
```

---

### 4C: Add Spectrum Customization CSS

**Location:** Add to `styles/panel.css` after the `body` rule

**Add this new CSS block:**
```css
/* Spectrum Web Components Customizations */

/* Override Spectrum CTA button color to burgundy */
sp-button[variant="cta"] {
    --spectrum-global-color-static-blue-600: #800020;
    --spectrum-global-color-static-blue-700: #5c0017;
    --spectrum-alias-background-color-primary-default: #800020;
    --spectrum-alias-background-color-primary-hover: #5c0017;
    --spectrum-alias-background-color-primary-down: #5c0017;
}

/* Override Spectrum primary button color to navy */
sp-button[variant="primary"] {
    --spectrum-global-color-static-blue-600: #001f3f;
    --spectrum-global-color-static-blue-700: #001528;
    --spectrum-alias-background-color-primary-default: #001f3f;
    --spectrum-alias-background-color-primary-hover: #001528;
    --spectrum-alias-background-color-primary-down: #001528;
}

/* Make buttons full width to match previous design */
sp-button {
    width: 100%;
    margin-bottom: 8px;
}

/* Navigation button spacing */
#nav-btn-back {
    margin-right: auto;
}

#nav-btn-forward {
    margin-left: auto;
}

/* Action buttons in the navigation footer */
.nav-footer sp-action-button {
    min-width: 120px;
}

/* Ensure quiet action buttons have proper hover state */
sp-action-button[quiet] {
    --spectrum-actionbutton-background-color-default: transparent;
    --spectrum-actionbutton-background-color-hover: rgba(128, 0, 32, 0.1);
    --spectrum-actionbutton-border-color-default: #800020;
    --spectrum-actionbutton-text-color-default: #800020;
}

/* Disabled state customization */
sp-button:disabled,
sp-action-button:disabled {
    opacity: 0.3;
}
```

**Explanation:**
- Spectrum uses CSS custom properties (variables) for theming
- We override the default blue colors with burgundy (#800020) and navy (#001f3f)
- `--spectrum-global-color-*` variables control the base colors
- `--spectrum-alias-*` variables control specific component states
- Layout properties (width, margin) remain the same as before

---

### 4D: Optional - Navigation Footer Flexbox Adjustment

**Location:** Find the `.nav-footer` CSS rule in `panel.css`

**Current (approximately line 709):**
```css
.nav-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: white;
    border-top: 2px solid #e0e0e0;
    margin-top: auto;
}
```

**No changes needed** - This should work as-is with Spectrum components.

**Verify it looks like this** - if you see any button-specific styling here, remove it:
```css
.nav-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: white;
    border-top: 2px solid #e0e0e0;
    margin-top: auto;
}
```

---

## STEP 5: Update JavaScript (If Needed)

### File: `scripts/navigation.js` or `scripts/main.js`

**Location:** `/Users/eli/Desktop/RTC_DRAW_AUTOMATION/scripts/`

**Action:** Verify button event listeners still work

**Most JavaScript should work without changes** because:
- Element IDs remain the same
- `addEventListener()` works on Spectrum components
- `disabled` attribute works the same way

---

### 5A: Check for `.classList` manipulation

**Search for code like this:**
```javascript
btnConnect.classList.add('btn-primary');
btnConnect.classList.remove('btn-primary');
```

**Replace with Spectrum variant changes:**
```javascript
btnConnect.setAttribute('variant', 'cta');
btnConnect.removeAttribute('variant');
```

**Or simply remove** if no longer needed (Spectrum handles styling).

---

### 5B: Check for button enable/disable logic

**Current code (should work as-is):**
```javascript
document.getElementById('btn-load-entries').disabled = false;
document.getElementById('btn-load-entries').disabled = true;
```

**No changes needed** - `disabled` property works identically on Spectrum components.

---

### 5C: Check for text content changes

**Current code (should work as-is):**
```javascript
document.getElementById('nav-btn-forward').textContent = 'Done';
```

**Potential issue:** This will remove the icon slot if the icon is a child element.

**Fix: Update to preserve icon:**
```javascript
const forwardBtn = document.getElementById('nav-btn-forward');
// Get current text content (not including slotted icon)
const currentText = Array.from(forwardBtn.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent)
    .join('');

// Update only text content
Array.from(forwardBtn.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .forEach(node => node.remove());

forwardBtn.insertBefore(document.createTextNode('Done'), forwardBtn.firstChild);
```

**Or simpler approach - use a data attribute:**

**HTML:**
```html
<sp-action-button id="nav-btn-forward" quiet data-text="Forward">
    <span id="forward-text">Forward</span>
    <span slot="icon">→</span>
</sp-action-button>
```

**JavaScript:**
```javascript
document.getElementById('forward-text').textContent = 'Done';
```

---

### 5D: Search for button style manipulation

**Search for code like:**
```javascript
button.style.backgroundColor = '#800020';
button.style.display = 'none';
```

**For color changes:** Remove - Spectrum handles colors via variants

**For visibility:** Keep as-is:
```javascript
button.style.display = 'none'; // Still works
button.style.visibility = 'hidden'; // Still works
```

---

## STEP 6: Wrap UI in Spectrum Theme

**Already covered in Step 4B** - Ensure the theme wrapper is in place:

**File:** `index.html`

**Verify structure:**
```html
<body>
    <sp-theme theme="spectrum" color="light" scale="medium">
        <div id="app">
            <!-- All your UI content -->
        </div>
    </sp-theme>
</body>
```

**Theme Attributes Explained:**
- `theme="spectrum"` - Use Adobe Spectrum design language
- `color="light"` - Light color scheme (alternatives: `dark`, `darkest`, `lightest`)
- `scale="medium"` - Medium sizing scale (alternatives: `large`)

**To use dark theme:**
```html
<sp-theme theme="spectrum" color="dark" scale="medium">
```

---

## Testing & Verification

### Test Plan

#### Phase 1: Visual Testing

**Checklist:**
- [ ] All 7 buttons render correctly
- [ ] No grey backgrounds/circles visible
- [ ] Burgundy color on CTA buttons (Connect, Load, Preview)
- [ ] Navy color on primary buttons (Submit, Generate)
- [ ] Navigation buttons have proper quiet styling
- [ ] Icons display correctly in navigation buttons
- [ ] Disabled states show reduced opacity
- [ ] Hover states work (color changes)
- [ ] Active/pressed states work (visual feedback)

**How to Test:**
1. Open Adobe InDesign
2. Load the plugin (Window > Extensions > Tournament Matcher)
3. Visually inspect each button
4. Hover over each button to test hover states
5. Click each button to test active states
6. Verify disabled buttons look disabled

---

#### Phase 2: Functional Testing

**Screen 1: Connection**
- [ ] "Connect to Google Sheets" button clickable
- [ ] Button triggers OAuth flow
- [ ] "Complete Connection" button appears after auth
- [ ] Submit button works correctly

**Screen 2: Entry Loading**
- [ ] "Load Entries" button initially disabled
- [ ] "Load Entries" enables after connection
- [ ] Button triggers data load
- [ ] Button shows loading state (if applicable)

**Screen 3: Preview**
- [ ] "Preview Bracket" button clickable
- [ ] Preview displays correctly
- [ ] "Generate in Document" button initially disabled

**Screen 4: Generation**
- [ ] "Generate in Document" button enables after preview
- [ ] Button triggers InDesign generation
- [ ] Success/error states display correctly

**Navigation:**
- [ ] "Back" button initially disabled on screen 1
- [ ] "Back" button enables on screens 2-4
- [ ] "Back" button navigates to previous screen
- [ ] "Forward" button text changes to "Done" on screen 4
- [ ] "Forward" button disabled when validation fails
- [ ] "Forward" button advances to next screen

---

#### Phase 3: Cross-Platform Testing

**Test on:**
- [ ] macOS (primary target)
- [ ] Windows (if applicable)

**Test in:**
- [ ] Adobe InDesign
- [ ] UXP Developer Tool (for debugging)

---

#### Phase 4: Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab key cycles through buttons
- [ ] Enter/Space activates focused button
- [ ] Focus indicator visible (Spectrum default)
- [ ] Disabled buttons not focusable

**Screen Reader:**
- [ ] Button labels readable
- [ ] Disabled state announced
- [ ] Button purpose clear

---

### Debugging Tools

#### UXP Developer Tool

**Launch:**
1. Open Adobe InDesign
2. Go to Plugins > Development > Developer Console
3. Select your plugin
4. Click "Inspect"

**Inspect Spectrum Components:**
```javascript
// In the console
document.querySelector('sp-button[id="btn-connect"]');

// Check computed styles
getComputedStyle(document.querySelector('sp-button[id="btn-connect"]'));

// Check Spectrum variant
document.querySelector('sp-button[id="btn-connect"]').getAttribute('variant');
```

#### Check Spectrum Imports

**Verify in console:**
```javascript
// Check if Spectrum components are defined
console.log(customElements.get('sp-button'));
console.log(customElements.get('sp-action-button'));
console.log(customElements.get('sp-theme'));

// Should output constructor functions, not undefined
```

#### CSS Custom Properties Inspector

**Check theme colors in console:**
```javascript
const btn = document.querySelector('sp-button[variant="cta"]');
const styles = getComputedStyle(btn);
console.log(styles.getPropertyValue('--spectrum-global-color-static-blue-600'));
// Should output: rgb(128, 0, 32) [burgundy]
```

---

## Rollback Procedure

### If Migration Fails

**Option 1: Restore from Backup**
```bash
# Delete current version
rm -rf /Users/eli/Desktop/RTC_DRAW_AUTOMATION

# Restore backup
cp -r /Users/eli/Desktop/RTC_DRAW_AUTOMATION_BACKUP_YYYYMMDD_HHMMSS /Users/eli/Desktop/RTC_DRAW_AUTOMATION
```

**Option 2: Git Revert (if using version control)**
```bash
cd /Users/eli/Desktop/RTC_DRAW_AUTOMATION
git checkout .
git clean -fd
```

**Option 3: Manual Revert**

1. **Revert `manifest.json`:**
   - Remove `"enableSWCSupport": true` line

2. **Revert `index.html`:**
   - Remove Spectrum `<script>` imports from `<head>`
   - Remove `<sp-theme>` wrapper from `<body>`
   - Replace all `<sp-button>` and `<sp-action-button>` tags with original `<button>` tags

3. **Revert `styles/panel.css`:**
   - Remove Spectrum customization CSS
   - Restore original button CSS (`.btn`, `.btn-primary`, etc.)

---

## Troubleshooting

### Issue 1: Buttons Not Rendering

**Symptom:** Buttons are invisible or show as plain text

**Causes:**
1. Spectrum imports not loaded
2. `enableSWCSupport` not in manifest
3. Missing `<sp-theme>` wrapper

**Fixes:**
```javascript
// Check in UXP Developer Console
console.log(customElements.get('sp-button'));
// Should output: function, not undefined

// If undefined, check:
// 1. manifest.json has "enableSWCSupport": true
// 2. index.html has <script> imports in <head>
// 3. Plugin was reloaded after manifest change
```

**Resolution:**
- Reload plugin after adding `enableSWCSupport` to manifest
- Clear UXP cache: Delete `~/Library/Caches/Adobe/UXP`
- Restart Adobe InDesign

---

### Issue 2: Wrong Colors (Blue instead of Burgundy)

**Symptom:** Buttons show default Spectrum blue, not custom burgundy/navy

**Cause:** CSS custom properties not overriding correctly

**Fix:**
```css
/* Ensure this CSS is AFTER Spectrum imports */
/* In panel.css */

sp-button[variant="cta"] {
    --spectrum-global-color-static-blue-600: #800020 !important;
    --spectrum-global-color-static-blue-700: #5c0017 !important;
}
```

**Or use inline styles (not recommended, but works for testing):**
```html
<sp-button variant="cta" style="--spectrum-global-color-static-blue-600: #800020;">
    Connect
</sp-button>
```

---

### Issue 3: Buttons Too Small/Large

**Symptom:** Button sizing doesn't match old design

**Fix:**
```css
/* Adjust Spectrum button sizing */
sp-button {
    --spectrum-button-primary-m-height: 40px;
    --spectrum-button-primary-m-padding-left: 20px;
    --spectrum-button-primary-m-padding-right: 20px;
    font-size: 14px;
}
```

**Or use different size attribute:**
```html
<!-- Try size="l" instead of size="m" -->
<sp-button variant="cta" size="l">Connect</sp-button>
```

---

### Issue 4: Icons Not Showing

**Symptom:** Arrow icons in navigation buttons invisible

**Cause:** Icon slot not properly configured

**Fix:**
```html
<!-- Ensure icon has slot attribute -->
<sp-action-button quiet>
    <span slot="icon">←</span>
    Back
</sp-action-button>

<!-- Or use SVG -->
<sp-action-button quiet>
    <svg slot="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
    Back
</sp-action-button>
```

---

### Issue 5: JavaScript Event Listeners Not Working

**Symptom:** Click events not firing

**Cause:** Spectrum components use Shadow DOM

**Fix:**
```javascript
// Old code (might not work)
document.getElementById('btn-connect').onclick = function() { ... };

// Better approach (works with Shadow DOM)
document.getElementById('btn-connect').addEventListener('click', function() {
    // Your code
});

// Best approach (event delegation)
document.addEventListener('click', function(e) {
    if (e.target.id === 'btn-connect') {
        // Your code
    }
});
```

---

### Issue 6: Disabled Buttons Still Clickable

**Symptom:** Disabled buttons trigger actions

**Cause:** Event listener not checking disabled state

**Fix:**
```javascript
// Add disabled check in handler
document.getElementById('btn-connect').addEventListener('click', function(e) {
    if (this.disabled) return; // Exit if disabled

    // Your code here
});
```

---

### Issue 7: Theme Not Applying

**Symptom:** Buttons render but look wrong

**Cause:** Missing or incorrect `<sp-theme>` wrapper

**Fix:**
```html
<!-- Ensure sp-theme wraps ALL UI content -->
<body>
    <sp-theme theme="spectrum" color="light" scale="medium">
        <div id="app">
            <!-- Everything goes here -->
        </div>
    </sp-theme>
</body>
```

**Alternative themes to try:**
```html
<!-- Lightest theme (most like web Spectrum) -->
<sp-theme theme="spectrum" color="lightest" scale="medium">

<!-- Dark theme -->
<sp-theme theme="spectrum" color="dark" scale="medium">

<!-- Express theme (alternative design system) -->
<sp-theme theme="express" color="light" scale="medium">
```

---

### Issue 8: Buttons Have Grey Backgrounds Still

**Symptom:** Grey backgrounds persist even with Spectrum

**Cause:** UXP rendering quirk or CSS conflict

**Fix 1: Add explicit background override**
```css
sp-button,
sp-action-button {
    background: transparent !important;
}

sp-action-button[quiet] {
    background: transparent !important;
}
```

**Fix 2: Check for conflicting CSS**
```css
/* Search panel.css for any remaining button rules */
/* Remove any lingering .btn or button selectors */
```

**Fix 3: Use static color**
```html
<!-- Force static color (not theme-aware, but guaranteed no grey) -->
<sp-button variant="cta" static="white">Connect</sp-button>
```

---

## Advanced Customization

### Custom Button Variants

If you need additional button styles beyond `cta` and `primary`:

```css
/* Create a custom "danger" variant */
sp-button[variant="negative"] {
    --spectrum-global-color-static-red-600: #d32f2f;
    --spectrum-global-color-static-red-700: #b71c1c;
}
```

```html
<sp-button variant="negative">Delete</sp-button>
```

---

### Loading States

Add loading spinner to buttons during async operations:

**Install progress circle component:**
```html
<script type="module" src="https://swc.adobe.com/base/progress-circle/index.js"></script>
```

**Use in button:**
```html
<sp-button id="btn-connect" variant="cta">
    <sp-progress-circle indeterminate size="s" slot="icon" style="display: none;"></sp-progress-circle>
    <span id="btn-connect-text">Connect</span>
</sp-button>
```

**Toggle loading state with JavaScript:**
```javascript
const btn = document.getElementById('btn-connect');
const spinner = btn.querySelector('sp-progress-circle');
const text = document.getElementById('btn-connect-text');

// Show loading
btn.disabled = true;
spinner.style.display = 'inline-block';
text.textContent = 'Connecting...';

// Hide loading
btn.disabled = false;
spinner.style.display = 'none';
text.textContent = 'Connect';
```

---

### Button Icons (Beyond Arrows)

**Using Spectrum UI Icons:**

```html
<!-- Install icons component -->
<script type="module" src="https://swc.adobe.com/base/icons-workflow/index.js"></script>
```

```html
<sp-action-button quiet>
    <sp-icon-checkmark slot="icon"></sp-icon-checkmark>
    Complete
</sp-action-button>
```

**Available Spectrum icons:** https://opensource.adobe.com/spectrum-web-components/icons-workflow/

---

## Performance Considerations

### Bundle Size Impact

**Before (HTML buttons):** ~0 KB (native HTML)
**After (Spectrum):** ~80-150 KB (component library)

**UXP caching:** Spectrum components are cached after first load, minimal performance impact.

---

### Lazy Loading (Optional)

Load Spectrum only when needed:

```javascript
// In main.js
async function initializeUI() {
    // Load Spectrum dynamically
    await import('https://swc.adobe.com/base/button/index.js');
    await import('https://swc.adobe.com/base/action-button/index.js');
    await import('https://swc.adobe.com/base/theme/index.js');

    // Now render UI
    document.body.innerHTML = `
        <sp-theme theme="spectrum" color="light" scale="medium">
            ${/* your UI */}
        </sp-theme>
    `;
}

initializeUI();
```

---

## Summary Checklist

Before marking migration complete, verify:

- [ ] `manifest.json` has `"enableSWCSupport": true`
- [ ] `index.html` has Spectrum script imports in `<head>`
- [ ] `index.html` has `<sp-theme>` wrapper around `#app`
- [ ] All 7 buttons converted to `<sp-button>` or `<sp-action-button>`
- [ ] Old button CSS removed from `panel.css`
- [ ] New Spectrum customization CSS added to `panel.css`
- [ ] JavaScript event listeners still work
- [ ] All buttons render without grey backgrounds
- [ ] Custom burgundy/navy colors display correctly
- [ ] Navigation buttons show icons correctly
- [ ] Disabled states work properly
- [ ] Hover/active states have proper visual feedback
- [ ] Plugin tested in Adobe InDesign
- [ ] Backup created before migration
- [ ] Documentation updated (if applicable)

---

## Additional Resources

### Official Documentation

- **Spectrum Web Components:** https://opensource.adobe.com/spectrum-web-components/
- **Spectrum Button:** https://opensource.adobe.com/spectrum-web-components/components/button/
- **Spectrum Action Button:** https://opensource.adobe.com/spectrum-web-components/components/action-button/
- **Adobe UXP Documentation:** https://developer.adobe.com/photoshop/uxp/
- **Spectrum Design System:** https://spectrum.adobe.com/

### Code Examples

- **Spectrum Starter Kit:** https://github.com/AdobeDocs/uxp-photoshop/tree/main/code-samples
- **UXP Plugin Samples:** https://github.com/AdobeDocs/uxp-photoshop-plugin-samples

---

## Support

If issues persist after following this guide:

1. **Check UXP Console:** UXP Developer Tool > Console tab for error messages
2. **Validate HTML:** Ensure all Spectrum tags are properly closed
3. **Clear Cache:** Delete `~/Library/Caches/Adobe/UXP` and restart Adobe app
4. **Test in Isolation:** Create a minimal test plugin with just one Spectrum button
5. **Check Spectrum Version:** Ensure using latest Spectrum WC version
6. **Community:** Ask in Adobe UXP Developer Forums

---

**End of Guide**

---

## Appendix: Quick Reference

### Spectrum Component Variants

**sp-button:**
- `variant="cta"` - Primary call to action (use for main actions)
- `variant="primary"` - Important actions
- `variant="secondary"` - Less important actions
- `variant="negative"` - Destructive actions (delete, remove)

**sp-action-button:**
- `quiet` - Minimal styling, no background
- `emphasized` - More prominent
- `selected` - Toggle state (for icon-only buttons)

### Common Attributes

- `size="s|m|l"` - Button size (small, medium, large)
- `disabled` - Disable button interaction
- `static="white|black"` - Force static color (ignore theme)
- `pending` - Show loading state (built-in)

### CSS Custom Properties (Most Common)

```css
--spectrum-global-color-static-blue-600  /* Primary color */
--spectrum-global-color-static-blue-700  /* Hover/active color */
--spectrum-button-primary-m-height       /* Button height */
--spectrum-button-primary-m-padding-left /* Left padding */
--spectrum-button-primary-m-padding-right /* Right padding */
--spectrum-alias-background-color-primary-default /* Background color */
--spectrum-alias-background-color-primary-hover   /* Hover background */
```

### Event Handling

```javascript
// Click event (works same as HTML buttons)
button.addEventListener('click', handler);

// Disabled check
if (button.disabled) return;

// Change variant
button.setAttribute('variant', 'primary');

// Toggle pending state
button.pending = true;
button.pending = false;
```
