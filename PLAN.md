# Notenschlüsselrechner — Project Plan

This document is the central source of truth for project status.
Both the developer and the AI agent read and update it.
Reference steps in all communications:

- "Please implement step 3"
- "I changed something in step 5, please review"
- "I tested step 6 and found an issue with XYZ"

## Status Legend

| Symbol | Meaning                                          |
| ------ | ------------------------------------------------ |
| `[ ]`  | Not started                                      |
| `[~]`  | In progress                                      |
| `[x]`  | Done                                             |
| `[!]`  | Blocked / has an issue — describe below the step |

---

## Phase 1: Project Foundation

### Step 1 — AGENT.md and PLAN.md `[x]`

Create the two coordination documents.

- `AGENT.md`: agent instructions, conventions, algorithms, color palette, iOS checklist
- `PLAN.md`: this file

---

### Step 2 — App Icons `[ ]`

Generate placeholder PNG icons programmatically using a Node.js Canvas script.

Symbol: `𝄞±` (G-clef + plus-minus — a German pun on "Notenschlüssel")
Background: `#3B6FA0` (primary blue), text: white

Files to produce:

- `assets/icons/apple-touch-icon.png` — 180×180 (required for iOS home screen)
- `assets/icons/icon-192.png` — 192×192 (PWA manifest, Android)
- `assets/icons/icon-512.png` — 512×512 (PWA manifest, splash screens)

Rules:

- PNG format, no transparency
- No rounded corners (iOS applies its own mask)
- The generator script is kept at `tools/step-02-generate-placeholder-icons.mjs`

> These are placeholder icons. Replace with final artwork before publishing.

---

### Step 3 — manifest.json `[ ]`

PWA manifest file.

```json
{
  "name": "Notenschlüsselrechner",
  "short_name": "Notenschlüssel",
  "display": "standalone",
  "background_color": "#3B6FA0",
  "theme_color": "#3B6FA0",
  "start_url": "/",
  "icons": [ 192px and 512px entries ]
}
```

---

### Step 4 — service-worker.js `[ ]`

Cache-first service worker.

- Caches all app shell files on `install` event
- Serves from cache, falls back to network
- Cache is versioned (`CACHE_NAME = 'notenschluessel-v1'`) so updates work
- Files to cache: `index.html`, `manifest.json`, `src/js/*.js`, `src/css/style.css`, all icons

---

## Phase 2: Core Application

### Step 5 — index.html `[ ]`

App shell. All text in German.

Must include:

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="apple-mobile-web-app-title" content="Notenschlüsselrechner">`
- `<link rel="manifest" href="manifest.json">`
- Service worker registration (inline `<script>` at end of `<body>`)

Semantic structure:

- `<header>` — app title
- `<main>`
  - Section: grading key editor (input table: min pts / max pts / grade, plus "Maximalpunktzahl" field)
  - Section: result display (recalculated table, hidden until calculation is triggered)
- `<footer>` — minimal
- iOS install guide overlay (hidden by default, shown via JS)
- `ⓘ` button (fixed position, always visible, opens install guide)

---

### Step 6 — src/js/grading.js `[ ]`

Pure calculation functions — no DOM access, no side effects.

```js
// Recalculate all thresholds proportionally
recalculate(key, oldMax, newMax) → key[]

// Validate a key array before saving/calculating
validateKey(key) → { valid: boolean, errors: string[] }

// Parse raw form values into a structured key array
parseKeyFromForm(formData) → key[]
```

Data structure for a grading key row:

```js
{ min: number, max: number, grade: number }  // grade is 1–6
```

Algorithm:

```
newMin = Math.round((row.min / oldMax) * newMax)
newMax = Math.round((row.max / oldMax) * newMax)
```

---

### Step 7 — src/js/storage.js `[ ]`

localStorage abstraction.

```js
saveKey(key); // saves grading key as JSON string
loadKey(); // loads and parses; returns null if not found or invalid
markInstallGuideSeen(); // sets boolean flag
hasSeenInstallGuide(); // returns boolean
```

localStorage keys used:

- `notenschluessel.key` — the saved grading key (JSON)
- `notenschluessel.installGuideSeen` — boolean flag

---

### Step 8 — src/js/app.js `[ ]`

Main app controller — wires DOM, storage, and grading logic together.

Responsibilities:

- On load: call `loadKey()`, populate the editor input table
- On any key input change: call `saveKey()` (auto-save)
- On "Berechnen" button click: validate key, run `recalculate()`, render result table
- On "Drucken" button click: `window.print()`
- iOS install guide: detect iOS + non-standalone on load, show overlay if not seen before
- `ⓘ` button: always opens the install guide overlay regardless of seen-flag

iOS detection:

```js
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.navigator.standalone === true;
```

---

### Step 9 — src/css/style.css `[ ]`

All styles. No inline styles in HTML. Structure:

1. CSS custom properties (color palette, spacing, typography scale)
2. Reset / base (box-sizing, margin/padding reset, font)
3. Layout (mobile-first, centered container, max-width ~480px on desktop)
4. Header
5. Grading key editor (input grid, add/remove row controls)
6. Result table (read-only, clean display)
7. Buttons (primary, secondary, icon button)
8. iOS install guide overlay (full-screen modal style)
9. `@media print` — hide everything except result table, black on white
10. `@media (min-width: 768px)` — optional desktop polish

---

## Phase 3: Polish and Testing

### Step 10 — iOS Install Guide UX `[ ]`

Full content and behavior of the install guide overlay.

Content (German):

1. Tippe auf das **Teilen**-Symbol (↑) in der Menüleiste von Safari
2. Scrolle nach unten und tippe auf **„Zum Home-Bildschirm"**
3. Tippe oben rechts auf **„Hinzufügen"**

Behavior:

- Shown automatically on first visit on iOS in Safari (non-standalone)
- "Nicht mehr anzeigen" button — dismisses and sets `installGuideSeen` flag
- "Schließen" (×) button — dismisses without setting flag (will show again next time)
- `ⓘ` button (fixed, bottom-right corner) — always re-opens the guide

---

### Step 11 — Playwright Testing `[ ]`

Using the `playwright-cli` skill, test the full user flow.

Prerequisite: `python3 -m http.server 3000` must be running.

Test cases:

1. App loads without errors
2. Enter a sample grading key (e.g., 6 rows, max 60 pts)
3. Enter new max (e.g., 45 pts) and click "Berechnen"
4. Verify the result table shows correct recalculated values
5. Verify localStorage contains the saved key
6. Reload the page — verify key is restored in the editor
7. Screenshot the print layout

---

### Step 12 — WebKit / iOS Safari Check `[ ]`

Test with Chrome engine (webkit would be closest to iOS Safari behavior, but webkit is not working with playwright-cli in the moment):

```bash
playwright-cli open http://localhost:3000
```

Check:

- Layout and font sizes on mobile viewport (375×812)
- Touch target sizes (min 44×44px)
- No horizontal overflow
- Install guide overlay displays correctly
- `apple-touch-icon` is referenced correctly (viewable in browser dev tools)

---

### Step 13 — Lint and Initial Commit `[ ]`

```bash
npx eslint .
npx prettier --check .
git add .
git commit -m "Feat: Initial implementation of Notenschlüsselrechner PWA"
```

Fix any lint or formatting errors before committing.
The Husky pre-commit hook will run lint-staged automatically.
The Husky commit-msg hook enforces the message format `<prefix>: <Detail>`:

- Prefix must contain at least one letter
- Exactly one space after the colon
- First character of the detail must be an uppercase letter, digit, or opening quote/paren

---

## Open Questions / Decisions

| #   | Question                                                                            | Decision |
| --- | ----------------------------------------------------------------------------------- | -------- |
| 1   | How many rows does the default/empty grading key have?                              | TBD      |
| 2   | Should the user be able to add/remove rows, or is it always 6 rows (one per grade)? | TBD      |
| 3   | What happens if a row's recalculated min > max (rounding edge case)?                | TBD      |

---

## Notes

- HTTPS is required for PWA install in production. Local `localhost` is a secure context — all PWA features work during development.
- The devcontainer name is `Notenschluesselrechner` (ASCII, Docker-compatible).
- Icons in `assets/icons/` are placeholders — replace with final artwork before publishing.
- Grading key data structure: each row = `{ min: number, max: number, grade: number }` where `grade` is 1–6.
