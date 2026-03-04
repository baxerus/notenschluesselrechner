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

### Step 2 — App Icons `[x]`

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

### Step 3 — manifest.json `[x]`

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

### Step 4 — service-worker.js `[x]`

Cache-first service worker.

- Caches all app shell files on `install` event
- Serves from cache, falls back to network
- Cache is versioned (`CACHE_NAME = 'notenschluessel-v1'`) so updates work
- Files to cache: `index.html`, `manifest.json`, `src/js/*.js`, `src/css/style.css`, all icons

---

## Phase 2: Core Application

### Step 5 — index.html `[x]`

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

### Step 6 — src/js/grading.js `[x]`

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

### Step 7 — src/js/storage.js `[x]`

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

### Step 8 — src/js/app.js `[x]`

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

### Step 9 — src/css/style.css `[x]`

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

### Step 10 — iOS Install Guide UX `[x]`

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

### Step 11 — Playwright Testing `[x]`

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

### Step 12 — WebKit / iOS Safari Check `[x]`

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

### Step 13 — Lint and Initial Commit `[x]`

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

## Phase 4: Decision Follow-Up

### Step 14 — Remove add/remove row controls `[x]`

> Absorbed into Step 16 (editor redesign). The new editor renders exactly 6 fixed rows with no add/remove controls. No separate implementation needed.

---

### Step 15 — Clamp min ≤ max after recalculation `[x]`

> Absorbed into Step 16 (editor redesign). Clamping is specified as part of the updated `recalculate()` algorithm in Step 16. No separate implementation needed.

---

### Step 16 — Editor redesign: Von/Bis semantics + auto-calculation + point-step dropdown `[ ]`

This step redesigns the editor based on confirmed decisions and new requirements.

#### Data model change

The internal row structure changes from `{ min, max, grade }` to:

```js
{ grade: number, von: number, bis: number }
// von = upper bound (editable for grades 1–5; grade 1 von = Maximalpunktzahl)
// bis = lower bound (always auto-calculated, never editable)
// grade 6 von is also auto-calculated
```

**Derivation rules** (applied whenever any input changes):

- Grade 1 `von` is always equal to `Maximalpunktzahl` (locked, shown as read-only).
- For grades 2–5, `von` is user-editable.
- Grade 6 `von` is auto-calculated: `grade5.bis - pointStep` (read-only).
- `bis` for every grade = `nextGrade.von - pointStep` (read-only).
- Grade 6 `bis` is always `0` (locked).
- `pointStep` is the currently selected minimum point difference (see dropdown below).

#### Point-step dropdown

Above the editor table, add a `<select>` labelled **„Mindestpunktabstand"** with options:

| Value | Label        |
| ----- | ------------ |
| `1`   | Ganze Punkte |
| `0.5` | Halbe Punkte |

- Default: `1` (whole points).
- Changing the dropdown immediately re-derives all `bis` values (and grade 6 `von`) and auto-saves.
- `pointStep` is persisted in localStorage under the key `notenschluessel.pointStep`.
- New storage function: `savePointStep(step)`, `loadPointStep()` → returns `1` if not set.

#### Editor table columns

The table now has exactly **3 columns**:

| Note | Von (Pkt.)                      | Bis (Pkt.) |
| ---- | ------------------------------- | ---------- |
| 1    | `[readonly = Maximalpunktzahl]` | `[auto]`   |
| 2    | `[input]`                       | `[auto]`   |
| 3    | `[input]`                       | `[auto]`   |
| 4    | `[input]`                       | `[auto]`   |
| 5    | `[input]`                       | `[auto]`   |
| 6    | `[auto]`                        | 0 (locked) |

Read-only and auto cells are rendered as plain text (no `<input>`), styled with `--color-text-muted` to visually distinguish them from editable fields.

#### Recalculation algorithm update

`recalculate(key, oldMax, newMax)` in `grading.js` now:

1. Scales each `von` value: `newVon = Math.round((row.von / oldMax) * newMax)` (for grades 2–5).
2. Grade 1 `von` is set to `newMax`.
3. Re-derives all `bis` values and grade 6 `von` from the scaled `von` values using `pointStep`.
4. Clamp: if a derived `bis` would go below `0`, clamp to `0`.

`parseKeyFromForm` reads only the 4 user-editable `von` inputs (grades 2–5) plus `Maximalpunktzahl` and `pointStep`, then derives the full key.

#### localStorage key rename

- Old: `notenschluessel.key` (array of `{ min, max, grade }`)
- New: `notenschluessel.key` (array of `{ grade, von, bis }`) — same key name, new shape. On load, if the stored shape is the old format, discard it and fall back to the default key.

#### Default key

Max 60 points, whole points, matching the current default:

```js
[
  { grade: 1, von: 60, bis: 57 },
  { grade: 2, von: 56, bis: 49 },
  { grade: 3, von: 48, bis: 41 },
  { grade: 4, von: 40, bis: 33 },
  { grade: 5, von: 32, bis: 20 },
  { grade: 6, von: 19, bis: 0 },
];
```

---

### Step 17 — Collapse/expand editor after Berechnen `[ ]`

After clicking „Berechnen", the editor section (`#editor-section`) collapses to show only its heading. The user can re-expand it by clicking the heading/toggle.

#### Behaviour

- On „Berechnen": collapse the editor body, show result section.
- The heading row gains a `▶` / `▼` chevron indicating collapsed/expanded state.
- Clicking the heading always toggles expanded ↔ collapsed.
- Collapse state is persisted in localStorage under `notenschluessel.editorCollapsed` (`"true"` / absent).
  - New storage functions: `saveEditorCollapsed(bool)`, `loadEditorCollapsed()` → returns `false` if not set.
- On page load: restore collapse state from localStorage (default: expanded).
- The result section remains visible once calculated, regardless of editor state.

#### CSS

- Editor body content is wrapped in a `<div class="editor-body">` that gets `hidden` when collapsed.
- The section heading becomes a `<button>` (or contains one) for keyboard accessibility.
- Chevron rotates 90° when expanded (`transform: rotate(90deg)`), points right when collapsed.
- Transition: `max-height` or `display` toggle (use `hidden` attribute, consistent with the rest of the app).

---

### Step 18 — Print layout: compact portrait + grid background `[ ]`

Redesign the `@media print` styles for portrait A4/Letter output.

#### Layout

- Remove the `<h2>` heading from print output entirely.
- Keep the `Maximalpunktzahl: N` line.
- Table is compact: smaller font (`0.8rem`), reduced cell padding (`2px 4px`), no box shadows.
- No minimum column widths — let the table shrink to content.
- Page orientation hint: `@page { size: portrait; margin: 15mm; }`.

#### Grid pattern

Below the result table, a full-width faint square grid fills the remaining page space.

- Implemented as a `<div class="print-grid">` element in `index.html`, hidden on screen (`display: none`), shown only in `@media print`.
- Grid is drawn with CSS `background-image` using `repeating-linear-gradient`:
  - Horizontal lines every `5mm`.
  - Vertical lines every `5mm`.
  - Line colour: `#CCCCCC` at `20%` opacity → use `rgba(204, 204, 204, 0.2)`.
  - Line thickness: `0.25pt` (hairline).
- The `div` has `flex: 1` so it expands to fill remaining page height after the table.
- Print container uses `display: flex; flex-direction: column; min-height: 100vh` so the grid div fills all remaining space.

---

### Step 19 — Regression test for Phase 4 `[ ]`

Using the `playwright-cli` skill, verify all Phase 4 changes.

Prerequisite: `python3 -m http.server 3000` must be running.

Test cases:

1. No `+ Zeile hinzufügen` button and no `✕` remove buttons in the DOM
2. Exactly 6 editor rows; only grades 2–5 `Von` cells are `<input>` elements
3. Grade 1 `Von` = Maximalpunktzahl (read-only), grade 6 `Bis` = 0 (locked)
4. `Bis` values are auto-derived on load and after any `Von` input change
5. Changing point-step dropdown to „Halbe Punkte" updates all `Bis` values and persists to localStorage
6. Recalculate (60 → 45 pts): verify scaled `von` values and derived `bis` values
7. Clamping: construct input where scaled `von` would produce `bis < 0`, verify it clamps to `0`
8. Click „Berechnen" → editor collapses; result section visible
9. Click editor heading → editor re-expands
10. Reload → collapse state restored from localStorage
11. Screenshot the compact print layout (portrait, grid pattern visible)

---

## Open Questions / Decisions

| #   | Question                                                                            | Decision                                                                                            |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | How many rows does the default/empty grading key have?                              | Always 6 rows — one per grade 1–6.                                                                  |
| 2   | Should the user be able to add/remove rows, or is it always 6 rows (one per grade)? | Always exactly 6 rows. No add/remove controls.                                                      |
| 3   | What happens if a row's recalculated min > max (rounding edge case)?                | Clamp: set min = max so the row stays valid (single-point grade range). No error shown to the user. |

---

## Notes

- HTTPS is required for PWA install in production. Local `localhost` is a secure context — all PWA features work during development.
- The devcontainer name is `Notenschluesselrechner` (ASCII, Docker-compatible).
- Icons in `assets/icons/` are placeholders — replace with final artwork before publishing.
- Grading key data structure: each row = `{ min: number, max: number, grade: number }` where `grade` is 1–6.
