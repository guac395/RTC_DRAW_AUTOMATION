# Build Troubleshooting Guide

This guide helps resolve common build issues with the Spectrum Web Components migration.

## Common Issues

### 1. `npm install` Fails

**Symptoms:**
- Package installation errors
- Missing dependencies

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### 2. Webpack Build Errors

**Symptoms:**
- `Module not found` errors
- Import/export errors

**Solutions:**
- Verify all `require()` paths in `src/` use relative paths without `./scripts/` prefix
- Check that Spectrum imports are at the top of `src/main.js`
- Ensure external modules (uxp, indesign) are listed in `webpack.config.js` externals

### 3. UXP Loading Errors

**Symptoms:**
- Extension doesn't load in InDesign
- "Invalid manifest" error
- Grey screen in panel

**Solutions:**

**Check you're loading from dist/:**
1. UXP Developer Tool → Add Plugin
2. Navigate to `dist/` directory (NOT root!)
3. Select `manifest.json` in `dist/`

**Verify build completed:**
```bash
ls dist/
# Should see: bundle.js, index.html, manifest.json, styles/, icons/
```

**Check manifest.json has enableSWCSupport:**
```bash
grep enableSWCSupport dist/manifest.json
# Should output: "enableSWCSupport": true
```

### 4. Spectrum Components Don't Render

**Symptoms:**
- Buttons appear as plain text
- No Spectrum styling
- Console errors about custom elements

**Solutions:**

**Check bundle.js loaded:**
Open UXP DevTools console and verify:
```javascript
console.log(document.querySelector('script[src="bundle.js"]'));
// Should not be null
```

**Verify Spectrum imports in bundle:**
```bash
grep -i "spectrum" dist/bundle.js
# Should see spectrum-related code
```

**Check theme wrapper:**
```bash
grep "sp-theme" dist/index.html
# Should see: <sp-theme theme="spectrum" color="lightest" scale="medium">
```

### 5. Buttons Don't Have R&TC Colors

**Symptoms:**
- CTA buttons not burgundy (#800020)
- Primary buttons not navy (#001f3f)

**Solutions:**

**Check CSS customizations:**
```bash
grep "spectrum-global-color" dist/styles/panel.css
# Should see CSS variable overrides
```

**Verify CSS loaded:**
Open panel in InDesign → UXP DevTools → Elements tab → Check `<sp-button>` elements have color styles applied

### 6. Navigation Text Not Changing

**Symptoms:**
- Forward button doesn't change from "Next" to "Done"
- Text changes destroy icons

**Solutions:**

**Check HTML has ID'd spans:**
```bash
grep "nav-forward-text" dist/index.html
# Should see: <span id="nav-forward-text">Next</span>
```

**Check navigation.js caches text elements:**
```bash
grep "forwardTextElement" dist/bundle.js
# Should see references to text element
```

### 7. Module Resolution Errors

**Symptoms:**
- `Cannot find module './scripts/...'`
- Import errors in console

**Solutions:**

**All require() paths should be relative to src/:**
```javascript
// CORRECT (in src/main.js):
require('./config.js')
require('./data/sheetsAPI.js')

// INCORRECT:
require('./scripts/config.js')
require('./scripts/data/sheetsAPI.js')
```

### 8. InDesign API Errors

**Symptoms:**
- `Cannot read property 'activeDocument' of undefined`
- `require is not defined`

**Solutions:**

**Verify UXP/InDesign externals in webpack.config.js:**
```javascript
externals: {
  'uxp': 'commonjs2 uxp',
  'indesign': 'commonjs2 indesign'
}
```

**These modules should NOT be bundled** - they're provided by the InDesign UXP runtime.

## Debugging Steps

### 1. Clean Build

```bash
# Delete dist and node_modules
rm -rf dist node_modules

# Reinstall and rebuild
npm install
npm run build
```

### 2. Check Build Output

```bash
# Build should complete without errors
npm run build

# Verify bundle size (should be ~459KB)
ls -lh dist/bundle.js

# Check for errors in bundle
grep -i "error" dist/bundle.js
```

### 3. Test in Isolation

**Create a minimal test:**
1. Create simple HTML with just one `<sp-button>`
2. Load in UXP Developer Tool
3. If it works, issue is in your code; if not, issue is in setup

### 4. Console Logging

**Add debug logs to src/main.js:**
```javascript
console.log('Spectrum imports loaded');
console.log('Main.js executing');
console.log('appState:', window.appState);
```

**Check logs in UXP DevTools:**
1. Load extension in InDesign
2. UXP Developer Tool → Debug → View Console
3. Look for your log messages

## Getting Help

If issues persist:

1. **Check webpack output** for warnings/errors
2. **Check UXP DevTools console** for runtime errors
3. **Verify versions:**
   ```bash
   node --version  # Should be 14+
   npm --version   # Should be 6+
   ```
4. **Check InDesign version**: Must be 18.5+

## References

- [Spectrum Web Components - UXP Documentation](https://developer.adobe.com/photoshop/uxp/2022/uxp-api/reference-spectrum/swc/)
- [UXP Frequently Asked Questions](https://developer.adobe.com/premiere-pro/uxp/resources/faq/)
- [Webpack Documentation](https://webpack.js.org/concepts/)
