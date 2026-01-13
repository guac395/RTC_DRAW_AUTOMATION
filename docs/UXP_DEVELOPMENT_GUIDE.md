# Adobe UXP Architecture & Development: Technical Reference

## 1. Architectural Core
* **Engine:** V8 JavaScript engine embedded directly in host process ("Direct-Link").
* **Threading:** Shared main thread. Synchronous logic > tens of ms **will freeze the host UI**.
* **Rendering:** Native layout engine (not Chromium). Translates HTML/CSS to native OS widgets.
* **Module System:** Supports CommonJS (`require`). Resolves strictly local. **No Global NPM/No Binary Node Modules**.



---

## 2. Manifest V5 (Security & Permissions)
All capabilities must be explicitly declared in `manifest.json`.
* **Entry Points:** * `panel`: Persistent, dockable UI.
    * `command`: Headless execution; can trigger modal dialogs.
* **Network:** `network.domains` must use full domains or `*.domain.com`. Wildcards (`https://*`) are prohibited.
* **File System:** `localFileSystem` must be set to `request` (user picker) or `plugin` (private storage).

---

## 3. File System (Storage API)
UXP uses an **Entry-based** security model. String paths (e.g., `C:/files/`) are generally invalid.
* **Flow:** Request Access (Picker) -> Receive `Entry` Object -> Perform Operations.
* **Persistent Tokens:** `Entry` objects die on restart. Use `fs.createPersistentToken(entry)` to save a string token in `localStorage`, then redeem via `fs.getEntryForPersistentToken(token)`.
* **Special Schemes:**
    * `plugin:/`: Read-only install folder.
    * `plugin-data:/`: Private read-write storage.
    * `plugin-temp:/`: Temporary storage.



---

## 4. UI & Layout (Flexbox Engine)
* **CSS Layout:** **Flexbox ONLY**. `display: flex` is the standard. No `float`, no `grid`.
* **Units:** Explicit units (`px`, `%`) required.
* **Z-Index Trap:** Native controls (inputs, textareas, WebViews) exist on a higher OS plane. Standard HTML elements cannot overlap them via `z-index`.
* **Spectrum:** * Use **Spectrum Web Components (SWC)** via `enableSWCSupport: true`.
    * Use `@swc-react` wrappers for React to fix synthetic event mapping issues.

---

## 5. Host-Specific APIs
| Application | Logic Model | Key Tooling |
| :--- | :--- | :--- |
| **Photoshop** | **BatchPlay** (JSON descriptors) | **Alchemist Plugin** (Listener/Recorder) |
| **InDesign** | Direct Object-Oriented DOM | Traditional DOM references |
| **Premiere** | Hybrid (UXP UI + ExtendScript logic) | BridgeTalk / Internal Dispatch |

---

## 6. Networking & Data
* **CORS:** Standard browser CORS rules apply. No "disable security" flags. Use server-side proxies.
* **Fetch:** Supports standard `fetch`. 
* **Binary:** Prefers `ArrayBuffer`. `Blob` support is limited; convert to `ArrayBuffer` before sending via XHR.
* **WebSockets:** Connections drop immediately if buffers fill. macOS rejects self-signed certs.

---

## 7. Performance & Debugging
* **Main Thread Yielding:** Use `await new Promise(r => setTimeout(r, 0))` to prevent UI freezing during heavy loops.
* **Tooling:** Use **Adobe UXP Developer Tool (UDT)** for loading, watching, and attaching Chrome DevTools.
* **Logs:** * Mac: `~/Library/Logs/Adobe/UXPLogs`
    * Win: `%AppData%\Local\Temp\UXPLogs`

---

## 8. Common Pitfalls for AI Agents
1.  **Don't** use absolute paths; use the Token system.
2.  **Don't** use `iframe`; use `WebView` (modal only) or `shell.openExternal`.
3.  **Don't** use CSS Grid; use nested Flexbox.
4.  **Don't** use native Node `fs` or `path` modules; use the `uxp` module wrappers.
5.  **Always** use `async/await` for file and network I/O.