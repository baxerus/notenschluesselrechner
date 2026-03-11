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
  - Section: grading key editor (input table: min pts / max pts / grade, plus "Maximalpunktanzahl" field)
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

### Step 16 — Editor redesign: Von/Bis semantics + auto-calculation + point-step dropdown `[x]`

This step redesigns the editor based on confirmed decisions and new requirements.

#### Data model change

The internal row structure changes from `{ min, max, grade }` to:

```js
{ grade: number, von: number, bis: number }
// von = upper bound (user-editable for all grades 1–6)
// bis = lower bound (always auto-calculated, never editable; grade 6 bis = 0)
```

**Derivation rules** (applied whenever any input changes):

- All 6 `von` values are user-editable inputs.
- `bis` for grades 1–5 = `nextGrade.von + pointStep` (read-only, auto-derived).
- Grade 6 `bis` is always `0` (locked, read-only).
- `pointStep` is the currently selected minimum point difference (see dropdown below).

> Note: Grade 1 `von` in the **editor** is the user's existing top threshold for grade 1 —
> it is NOT necessarily equal to `Maximalpunktanzahl`. After **recalculation**, grade 1 `von`
> in the **result** is set to `newMax` exactly (all other grades are scaled proportionally).

#### Point-step dropdown

Above the editor table, add a `<select>` labelled **„Mindestpunktabstand"** with options:

| Value | Label        |
| ----- | ------------ |
| `1`   | Ganze Punkte |
| `0.5` | Halbe Punkte |

- Default: `1` (whole points).
- Changing the dropdown immediately re-derives all `bis` values and auto-saves.
- `pointStep` is persisted in localStorage under the key `notenschluessel.pointStep`.
- New storage function: `savePointStep(step)`, `loadPointStep()` → returns `1` if not set.

#### Editor table columns

The table now has exactly **3 columns**:

| Note | Von (Pkt.) | Bis (Pkt.) |
| ---- | ---------- | ---------- |
| 1    | `[input]`  | `[auto]`   |
| 2    | `[input]`  | `[auto]`   |
| 3    | `[input]`  | `[auto]`   |
| 4    | `[input]`  | `[auto]`   |
| 5    | `[input]`  | `[auto]`   |
| 6    | `[input]`  | 0 (locked) |

Only the Bis column is read-only (plain text, styled with `--color-text-muted`). All Von cells are editable `<input>` elements.

#### Recalculation algorithm update

`recalculate(key, oldMax, newMax, pointStep)` in `grading.js` now:

1. Scales all 6 `von` values proportionally: `newVon = Math.round((row.von / oldMax) * newMax)`.
2. Sets grade 1 `von` to `newMax` exactly (snaps to the new ceiling).
3. Re-derives all `bis` values from the scaled `von` values using `pointStep`.
4. Clamp: if a derived `bis` would go below `0`, clamp to `0`.

`parseVonFromForm` reads all 6 `von` inputs (grades 1–6) from the form.

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

### Step 17 — Collapse/expand editor after Berechnen `[x]`

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

### Step 18 — Print layout: compact portrait + grid background `[x]`

Redesign the `@media print` styles for portrait A4/Letter output.

#### Layout

- Remove the `<h2>` heading from print output entirely.
- Keep the `Maximalpunktanzahl: N` line.
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

### Step 19 — Regression test for Phase 4 `[x]`

Using the `playwright-cli` skill, verify all Phase 4 changes.

Prerequisite: `python3 -m http.server 3000` must be running.

Test cases:

1. ✅ No `+ Zeile hinzufügen` button and no `✕` remove buttons in the DOM
2. ✅ Exactly 6 editor rows; all 6 `Von` cells are `<input>` elements (corrected model)
3. ✅ Grade 6 `Bis` = 0 (locked); grade 1 `Von` editable (independent of Maximalpunktanzahl)
4. ✅ `Bis` values are auto-derived on load and after any `Von` input change
5. ✅ Changing point-step dropdown to „Halbe Punkte" updates all `Bis` values and persists to localStorage
6. ✅ Recalculate (60 → 45 pts): verified scaled `von` values and derived `bis` values
7. Clamping: skipped (clamping logic verified in grading.js; edge case not reproduced interactively)
8. ✅ Click „Berechnen" → editor collapses; result section visible
9. ✅ Click editor heading → editor re-expands
10. ✅ Reload → collapse state restored from localStorage
11. ✅ Screenshot saved to `tools/step-19-screen.png`; PDF to `tools/step-19-print-layout.pdf`

---

## Phase 5: Review Fixes & New Features

### Step 20 — Review fixes and UX improvements `[x]`

### Step 21 — Print grid layering fix `[x]`

Fixed the print grid so it appears everywhere on the page without showing through table cells.

#### Problem

The SVG grid was showing through (or behind) the table cells in Chrome's actual print dialog. The root issue: `position: fixed; z-index: 0` (previous approach) caused the grid to appear everywhere including overlapping table text.

#### Solution

- `position: absolute; z-index: -1` on `.print-grid` in `@media print`
- `html { position: relative }` in `@media print` to contain the absolutely-positioned SVG
- `background-color: transparent !important` on `body` and `.container` so they don't block the SVG
- `background: #fff` on `result-table th` and `result-table td` so table cells are opaque (blocking the grid below them)
- `background-color: transparent !important` on `.result-section`
- `#calc-form { display: none !important }` instead of `.editor-section` to hide the full form element in print
- `result-max` uses `background: transparent` (grid reads through to text, text is above the grid)

#### Result

Grid appears on the full page behind all content. Table cells are opaque white so grid lines don't show through table data. Screen view unchanged (SVG is `display: none` on screen).

Fixes and improvements made during user review of Phase 4.

#### Bug fix: Bis derivation formula

`bis[g] = von[g+1] + pointStep` (was incorrectly `− pointStep`).
Fixed in `grading.js` and all comments/docs updated.

#### service-worker.js comment

Added explanatory comment why the file must live at the project root (scope constraint).

#### UI changes (index.html + style.css)

- Section heading renamed: „Notenschlüssel eingeben" → „Referenz Notenschlüssel eingeben"
- Label renamed: „Mindestpunktabstand" → „Mindestpunktabstand in Referenz"
- Removed `(Pkt.)` suffix from table column headers — both editor and result tables now show „Von" / „Bis"
- Table columns: headers and values centered; all three columns equal width (`33.33%`)
- Number inputs inside editor table: text centered
- „Berechnen" button: full width (`flex: 1`), `margin-top` added for spacing above it
- „Neue Maximalpunktanzahl" field moved to below the reference table (above „Berechnen")
- `.field-row` gains `padding-block: var(--space-md)` for vertical breathing room
- Removed the footer entirely (`<footer>` + `.app-footer` CSS)
- `.card` `gap` set to `0`; result section gets its own `gap: var(--space-md)` rule to preserve internal spacing

#### localStorage: persist new max

- `saveNewMax(n)` / `loadNewMax()` added to `storage.js` (`notenschluessel.newMax`)
- Field pre-filled from localStorage on init
- Value saved on every `input` event

#### Auto-calculate on init

If both a saved key and a saved `newMax` exist in localStorage on page load, the result is calculated immediately and the editor is collapsed — no user interaction needed.

#### Neuer Mindestpunktabstand dropdown

A second point-step dropdown for the result key (independent of the reference key).

- Label: „Neuer Mindestpunktabstand"; options: Ganze Punkte / Halbe Punkte
- Persisted to localStorage: `notenschluessel.newPointStep`
- `recalculate()` now receives `newPointStep` (was using the reference `pointStep`)

#### Rundung dropdown

Controls how scaled von values are rounded to the nearest `newPointStep` multiple.

- Label: „Rundung"; placed below „Neuer Mindestpunktabstand"
- Options: „Immer aufrunden" (`ceil`), „Kaufmännisch runden" (`round`), „Immer abrunden" (`floor`)
- Default: `round`
- Persisted to localStorage: `notenschluessel.rounding`
- `recalculate(key, oldMax, newMax, newPointStep, rounding)` — new `rounding` parameter
- Algorithm: `roundFn(raw / newPointStep) * newPointStep` where `roundFn` is `Math.ceil / .round / .floor`

---

## Phase 6: Print Grid Replacement

### Step 22 — Replace SVG print grid with CSS-bordered HTML table `[x]`

#### Goal

The current inline SVG grid is blurry in Chrome's real print dialog due to anti-aliasing when
pattern coordinates don't map cleanly to device pixels at print DPI. Replace it with an HTML
`<table>` whose cells are sized with CSS `mm` units and bordered. This gives:

- **Exact 5mm grid spacing** — CSS `mm` maps to physical millimetres in `@media print`
- **Crisp lines** — cell borders are vector strokes, not rasterized bitmaps
- **No "Print background graphics" required** — borders are element content, not CSS backgrounds
- **Paper-agnostic** — table is over-provisioned (covers A3 landscape and beyond); page boundary
  clips the excess naturally

#### Changes

##### `tools/step-22-generate-grid-table.mjs` (new)

Generator script that writes the `<table class="print-grid">` HTML fragment to stdout.
Dimensions: **80 columns × 110 rows** = 400mm wide × 550mm tall (covers A3 landscape + safety
margin). 8,800 empty `<td>` elements. Script is kept permanently per AGENT.md convention.

##### `index.html`

Replace the `<svg class="print-grid">` element with the generated `<table class="print-grid">`.
The table has no `<thead>`/`<tbody>` — bare `<tr>/<td>` rows only. `aria-hidden="true"` is kept.

```html
<!-- Print grid: HTML table with 5mm×5mm cells. Borders are element content
     (not CSS background) so they print without "Print background graphics".
     CSS mm units give exact physical spacing on any paper size/orientation.
     Over-provisioned to 400×550mm; the page boundary clips the excess.
     position:fixed in @media print anchors it to the printable area origin. -->
<table class="print-grid" aria-hidden="true">
  <!-- 110 rows × 80 columns; generated by tools/step-22-generate-grid-table.mjs -->
  ...
</table>
```

##### `src/css/style.css` — screen styles

```css
/* Hide print grid on screen */
.print-grid {
  display: none;
}
```

##### `src/css/style.css` — `@media print`

Remove `size: portrait` from `@page` — let the user choose orientation in the print dialog.
Remove all SVG-specific `.print-grid` rules and comments.
Add table grid rules:

```css
@page {
  /* No size: portrait — orientation is the user's choice */
  margin: 15mm;
}

/* Print grid table: position:fixed maps to the page box in Chromium's print
   renderer. Cells are 5mm×5mm with a hairline border in physical CSS mm units.
   Over-provisioned; the page boundary clips excess rows/columns. */
.print-grid {
  display: table;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  border-collapse: collapse;
  table-layout: fixed;
}

.print-grid td {
  width: 5mm;
  height: 5mm;
  padding: 0;
  border: 0.25pt solid #ccc;
}
```

All existing z-index layering rules for `.result-table` and `.result-max__label`
(`box-shadow: 0 0 0 8px #fff` halos, `position: relative; z-index: 1`) are **unchanged** —
they work identically with the table grid behind them.

`background-color: transparent !important` on `body` and `.container` is kept (harmless,
ensures no white block can cover the grid in edge cases).

#### Fallback plan — `border-collapse: separate`

If `border-collapse: collapse` on a `position: fixed` table causes a missing or doubled outer
edge in Chrome's real print dialog, switch to:

```css
.print-grid {
  border-collapse: separate;
  border-spacing: 0;
  /* Provide the top and left page edges manually */
  border-top: 0.25pt solid #ccc;
  border-left: 0.25pt solid #ccc;
}

.print-grid td {
  border-right: 0.25pt solid #ccc;
  border-bottom: 0.25pt solid #ccc;
  /* no border-top / border-left — avoids double lines */
}
```

#### Testing

1. Run `tools/step-22-generate-grid-table.mjs` → paste fragment into `index.html`
2. Apply CSS changes in `style.css`
3. Playwright PDF — A4 portrait → `tools/step-22-a4-portrait.pdf`
4. Playwright PDF — A4 landscape → `tools/step-22-a4-landscape.pdf`
5. Verify in **real Chrome** print dialog — crispness and grid alignment on both orientations
6. Verify result table and label still sit above the grid (z-index layering intact)
7. Verify screen view is unchanged (grid not visible on screen)

---

### Step 23 — Input validation fix and test suite `[x]`

#### Problem

Clicking „Berechnen" with an invalid key (e.g. grade 1 Von = 45, grade 2 Von = 50) produced a
result instead of an error. Root cause: `handleCalculate` called `readDerivedKey()` before
validating — `deriveKey()` silently clamps out-of-order values, so `validateKey` never saw the
bad input.

Additionally, `validateKey` lacked the minimum-gap rule: each Von must be at least equal to its
Bis value (Von = Bis is allowed), which — since `bis[g] = von[g+1] + pointStep` — means adjacent
Von values must differ by at least `pointStep` (grades 1–5). Grade 6 Von only needs to be ≥ 0
(covered by the non-negative rule).

#### Changes

##### `src/js/grading.js`

- Replaced `validateKey(key)` (operated on derived/clamped key) with `validateVon(vonAll, pointStep)`
  that operates on the raw array of 6 Von values before any derivation.
- Rules enforced by `validateVon`:
  1. Exactly 6 values
  2. All values are finite numbers (not empty / NaN)
  3. All values are non-negative
  4. Strictly descending: `von[g] > von[g+1]` for all g
  5. Minimum gap: `von[g] >= von[g+1] + pointStep` (grades 1–5) — Von may equal Bis;
     grade 6 has no extra minimum (non-negative rule covers it)
- JSDoc comment is precise and self-contained — no ambiguous reasoning left in comments.

##### `src/js/app.js`

- `handleCalculate` now calls `parseVonFromForm` → `validateVon(vonAll, currentPointStep)` on
  the raw values **first**. Only if valid does it call `deriveKey` and proceed to recalculate.
- Import changed from `validateKey` to `validateVon`.

##### `tools/step-22-validation-tests.mjs` (new)

27-test suite covering all validation rules and edge cases:

- Group 1: Valid inputs (default key, half-point key, Von=Bis cases, exact-minimum cases)
- Group 2: Empty / missing values (NaN, undefined)
- Group 3: Negative values
- Group 4: Out-of-order Von values (the original bug, equal values, reversed)
- Group 5: Minimum gap rule (Von=Bis valid, at-boundary valid, below-boundary invalid)
- Group 6: Wrong array shape (empty, 5 elements, 7 elements, null)

All 27 tests pass: `node tools/step-22-validation-tests.mjs`

**Rule correction (post-initial implementation):** The minimum gap rule was tightened from
`von[g] >= von[g+1] + 2×pointStep` to `von[g] >= von[g+1] + pointStep` after the user clarified
that Von = Bis is valid (e.g. `[5,4,3,2,1,0]` with step=1 is a legal key).

---

### Step 24 — Post-recalculation distinctness validation `[x]`

#### Problem

When the new Maximalpunktanzahl is very small, rounding during recalculation can collapse multiple
grade thresholds to the same value, producing a result key where multiple grades cover the same
point value. Such a key is not useful.

#### Decision

Recalculate as normal, then validate the result Von array with `validateVon`. If invalid, show an
error and do not render the result table. No minimum-value hint is shown — the user must try a
larger value themselves.

#### Changes

##### `src/js/app.js`

- In `handleCalculate`, after `recalculate()` returns, extract the Von values from the result and
  call `validateVon(resultVon, currentNewPointStep)`.
- If invalid, call `showErrors()` with the message:
  _„Die neue Maximalpunktanzahl ist zu klein — der berechnete Notenschlüssel ist nicht eindeutig.
  Bitte wähle einen größeren Wert."_
- `renderResult` and `setEditorCollapsed` are only reached if validation passes.

---

### Step 25 — Dynamic `min`/`max`/`step` on Von inputs + `:invalid` red border `[x]`

#### Problem

The Von inputs in the reference table had no `max` attribute and a static `min="0"`, giving the
browser no information about valid ranges. On mobile (iOS), the numeric keyboard already appeared
correctly, but the stepper arrows on desktop were unbounded and no visual feedback flagged
out-of-range values before the user hit Berechnen.

#### Decision

- Add a `updateVonConstraints()` function that sets `min`, `max`, and `step` on all 6 Von inputs
  dynamically from the current form state and `currentPointStep`.
- Rerun it on every input event (all Von values recomputed each time, so cascading changes are
  handled automatically).
- Use CSS `:invalid` to show a 2px red border (`--color-error`) on any out-of-range input.
  `:invalid` fires immediately — no interaction guard — so fields that are invalid on load are
  flagged straight away.
- The JS validation in `handleCalculate` remains the authoritative guard; the attributes and
  `:invalid` styling are a complementary first line of feedback.

#### Constraints per grade

| Grade | `min`                  | `max`                      |
| ----- | ---------------------- | -------------------------- |
| 1     | `von[2] + pointStep`   | _(none — unbounded above)_ |
| 2–5   | `von[g+1] + pointStep` | `von[g-1] - pointStep`     |
| 6     | `0`                    | `von[5] - pointStep`       |

`step = currentPointStep` for all inputs.

#### Changes

##### `src/js/app.js`

- New `updateVonConstraints()` function: reads all 6 Von values via `FormData`, then sets
  `input.min`, `input.max` (or removes it for grade 1), and `input.step` on each Von input.
- `updateReadonlyCells()` now calls `updateVonConstraints()` at the end — covers all input events
  and point-step changes (which already call `updateReadonlyCells()`).
- `init()` calls `updateVonConstraints()` after `renderEditor()` so constraints are set on first
  load.

##### `src/css/style.css`

- `.editor-table input[type="number"]:invalid` — `border-width: 2px; border-color: var(--color-error)`
- `.editor-table input[type="number"]:invalid:focus` — keeps red border over the blue focus style
- `.field-row input:invalid` — same 2px red border for the "Neue Maximalpunktanzahl" input
- `.field-row input:invalid:focus` — same focus override

---

### Step 26 — GitHub link button (bottom-left FAB) `[x]`

Add a second floating action button in the bottom-left corner, mirroring the existing ⓘ button on the bottom right. It links to the GitHub repository.

#### Element

An `<a>` tag (not `<button>`) — semantically correct for external navigation:

```html
<!-- GitHub link — fixed, always visible -->
<a
  href="https://github.com/baxerus/notenschluesselrechner"
  target="_blank"
  rel="noopener noreferrer"
  class="btn-github"
  aria-label="GitHub-Repository öffnen"
>
  <!-- GitHub mark SVG, 20×20, fill="currentColor" -->
  <svg ...></svg>
</a>
```

Inserted in `index.html` just before the existing `#btn-info` button.

#### CSS (`src/css/style.css`)

New `.btn-github` rule after `.btn-info:hover` — identical shape/shadow/color, but `left` instead of `right`:

```css
.btn-github {
  position: fixed;
  bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
  left: var(--space-lg);
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-surface);
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition);
  z-index: 100;
  text-decoration: none;
}

.btn-github:hover {
  background-color: var(--color-primary-dark);
}
```

Also add `.btn-github` to the `@media print` hide rule alongside `.btn-info`.

#### No JavaScript changes needed.

---

### Step 27 — iOS install guide icon improvements + UX polish `[x]`

Improved the iOS install guide overlay and input keyboard behaviour.

#### iOS install guide — inline SVG icons

Replaced the plain text placeholder `(↑)` with accurate inline SVG icons matching the actual iOS UI:

- **Share icon** (step 1): custom SVG — upward arrow with square tray below, short inward tabs at top corners, `stroke-width="2.5"`, `viewBox="0 0 24 32"` (taller than wide so the square tray has correct proportions), `fill="none"`.
- **Add to Home Screen icon** (step 2): plus sign inside a rounded square, moved inside the opening quote so the layout matches the iOS menu (`„⊞ Zum Home-Bildschirm"`).
- Step 2 label forced onto its own line with `<br>` for readability.
- Trailing `.` removed from all three list items.
- `.install-icon` CSS: `width/height: 1em`, `vertical-align: -0.15em`, `overflow: visible`. No `fill` set in CSS — each SVG controls its own fill via attribute.
- `.install-steps` gap increased from `var(--space-sm)` to `var(--space-md)`.

#### `inputmode="decimal"` on all number inputs

Added `inputmode="decimal"` to all `type="number"` inputs:

- Von inputs in `renderEditor()` (`src/js/app.js`)
- `#new-max` input (`index.html`)

**Rationale:** `type="number"` alone shows the full iOS keyboard (with all letters). `inputmode="decimal"` overrides the keyboard to a clean numeric pad with a decimal key — while keeping `type="number"` for desktop spinner arrows and native browser validation. No JS parsing changes needed.

#### Decimal separator in result table

Added `formatNum(n)` helper in `app.js` that replaces `.` with `,` for display:

```js
function formatNum(n) {
  return String(n).replace(".", ",");
}
```

Applied to `row.von`, `row.bis`, and `newMax` in `renderResult()`. The result table (which is also the print output) now shows German decimal notation (`0,5` instead of `0.5`). Values are never read back from the DOM so this is display-only with no parsing side effects.

---

### Step 28 — iOS splash screens `[x]`

Add `apple-touch-startup-image` splash screens for all current iPhones and iPads.

#### Why explicit PNG files are required

iOS Safari does not auto-generate a splash screen from the manifest. It requires one pre-rendered PNG per device screen size, linked via `<link rel="apple-touch-startup-image" media="...">` tags with `device-width`, `device-height`, and `-webkit-device-pixel-ratio` media queries.

#### Generator script — `tools/step-28-generate-splash-screens.mjs`

Produces 20 PNGs covering all current iPhones (SE gen1 through iPhone 16 Pro Max) and iPads (9.7" through iPad Pro 13"). Each image is the device's actual pixel resolution in portrait orientation.

Design: `#3B6FA0` background, centred `𝄞±` symbol, app name „Notenschlüsselrechner" below.

Output directory: `assets/splash/`

#### `index.html`

20 `<link rel="apple-touch-startup-image">` tags added to `<head>`, grouped by iPhones / iPads with a comment block.

#### `service-worker.js`

All 20 splash PNGs added to `APP_SHELL` pre-cache list. Cache version bumped `v3` → `v4`.

---

### Step 29 — Add subtle gradient to app icons and splash screens `[x]`

Added a subtle diagonal gradient to all app icons and splash screens.

#### Design change

- Background color `#3B6FA0` now has a diagonal linear gradient:
  - Top-left: `#5A8AB8` (~15% lighter)
  - Bottom-right: `#2D5080` (~15% darker)
- Gradient runs from top-left to bottom-right (diagonal)

#### Generator scripts

- `tools/step-02-generate-placeholder-icons-gradient.mjs` — icons with gradient
- `tools/step-28-generate-splash-screens-gradient.mjs` — splash screens with gradient

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
