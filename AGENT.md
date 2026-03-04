# Notenschlüsselrechner — Agent Guide

## Project Overview

A mobile-first Progressive Web App (PWA) for German teachers.
Target platform: iOS (installed to home screen). Desktop is a nice-to-have.

## Language Policy

| Context                                                        | Language    |
| -------------------------------------------------------------- | ----------- |
| App UI (all user-facing text, labels, messages, install guide) | **German**  |
| Code (variable names, function names, comments)                | **English** |
| Documents (AGENT.md, PLAN.md, other `.md` files)               | **English** |
| Commit messages                                                | **English** |
| Agent communication with the developer                         | **English** |
| Error messages in tooling/scripts (e.g. git hooks)             | **English** |

Teachers enter an existing grading key (Notenschlüssel) — a table mapping
point ranges to grades 1–6. They then enter a new maximum point value and
get the key linearly recalculated. The original key is auto-saved.

## Tech Stack

- **Vanilla JS** (ES modules, no build step, no framework)
- **Plain CSS** (mobile-first, `@media print` for distraction-free printing)
- **HTML5** with all required PWA and iOS meta tags
- **localStorage** for persistence
- **manifest.json** + service worker for PWA/offline support
- **No bundler** — files are served as-is

## File Structure

```
/workspace
├── index.html              # App shell, all meta tags, iOS install guide overlay
├── manifest.json           # PWA manifest
├── service-worker.js       # Cache-first service worker
├── src/
│   ├── js/
│   │   ├── app.js          # UI controller, event wiring, app state
│   │   ├── grading.js      # Pure recalculation functions (no side effects)
│   │   └── storage.js      # localStorage abstraction
│   └── css/
│       └── style.css       # All styles incl. @media print
├── assets/
│   └── icons/
│       ├── apple-touch-icon.png   # 180×180, no transparency (iOS required)
│       ├── icon-192.png           # 192×192 (PWA manifest)
│       └── icon-512.png           # 512×512 (PWA manifest)
├── tools/                  # Helper scripts and one-off utilities (never deleted)
│   └── step-02-generate-placeholder-icons.mjs   # example
├── AGENT.md
└── PLAN.md
```

## Running Locally

No build step required. Serve the workspace root over HTTP:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000` in a browser.

> **Note:** PWA features (service worker, install prompt) require HTTPS in
> production. Locally, `localhost` is treated as a secure context by browsers,
> so all PWA features work during development.

## Coding Conventions

- **ES modules** throughout — use `import`/`export`, not `require()`
- **No global state** — app state lives in `app.js`, pure functions in `grading.js`
- **Prettier** formats all files on save (configured in devcontainer)
- **ESLint** lints `.js` and `.html` files — run `npx eslint .` to check
- **lint-staged** runs both on every commit via Husky pre-commit hook
- No `console.log` left in committed code
- All user-facing strings in German (see Language Policy)
- CSS custom properties for colors — never hardcode hex values in rules

## Color Palette (CSS custom properties)

| Variable               | Value     | Role                         |
| ---------------------- | --------- | ---------------------------- |
| `--color-primary`      | `#3B6FA0` | Main blue, buttons, links    |
| `--color-primary-dark` | `#2C5480` | Hover / active states        |
| `--color-accent`       | `#E8A838` | Warm amber, highlights       |
| `--color-bg`           | `#FAF8F5` | App background               |
| `--color-surface`      | `#FFFFFF` | Cards, inputs                |
| `--color-text`         | `#2D2A26` | Primary text                 |
| `--color-text-muted`   | `#6B6560` | Secondary / placeholder text |
| `--color-success`      | `#4A8C6F` | Valid states                 |
| `--color-error`        | `#C0392B` | Errors                       |

## Recalculation Algorithm

Linear scaling of point thresholds:

```
newThreshold = round((oldThreshold / oldMax) * newMax)
```

Applied to both the min and max of every row. Grade labels (1–6) are
unchanged. Implemented as pure functions in `src/js/grading.js`.

## iOS PWA Requirements

All of the following must be present in `index.html`:

```html
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
<meta name="apple-mobile-web-app-title" content="Notenschlüsselrechner" />
<link rel="manifest" href="manifest.json" />
```

Icon rules: 180×180px, PNG, **no transparency**, no rounded corners
(iOS applies its own rounding). Background color must match `--color-primary`.

The in-app iOS install guide must:

- Detect iOS (user agent check) and non-standalone mode
- Show once on first visit (flag in localStorage)
- Be re-accessible via a persistent `ⓘ` button
- Use plain German text describing the iOS share button (↑) by name

## Print Layout

`@media print` styles must:

- Hide: nav, install-guide button, action buttons, any overlays
- Show only: the recalculated grading key table
- Use `#000` text on `#fff` background
- No box shadows, no background colors on cells
- Set a print title via `<title>` (already the app name)

## Testing with Playwright CLI

The `playwright-cli` skill is available in this environment.
Use it to test the running app during development.

Serve the app first:

```bash
python3 -m http.server 3000
```

Then use the skill:

```bash
playwright-cli open http://localhost:3000
playwright-cli snapshot              # inspect current DOM state
playwright-cli fill e3 "60"          # fill input by element ref
playwright-cli click e7              # click button by element ref
playwright-cli localstorage-list     # verify saved data
playwright-cli close
```

To test with a WebKit engine (closest to iOS Safari):

```bash
playwright-cli open http://localhost:3000
```

Full skill reference: `/home/node/.opencode/skills/playwright-cli/SKILL.md`

## Tools and Helper Scripts

Any intermediate script, generator, checker, or one-off utility created during
development lives in `tools/`. These files are **never deleted** — keep them for
later inspection, re-use, or debugging.

Naming convention: prefix with the relevant plan step and a short description.
Descriptive names are preferred — characters in filenames are cheap.

```
tools/
├── step-02-generate-placeholder-icons.mjs
├── step-11-check-localstorage.mjs
└── step-12-webkit-viewport-check.mjs
```

This applies to everything: generators, data fixers, test helpers, migration
scripts, debug utilities — if you wrote it to get something done, it goes in
`tools/`.

## Commit Guidelines

Commits are linted automatically via Husky + lint-staged on pre-commit.
This runs ESLint and Prettier. If a commit fails, fix lint errors, then retry.
Do NOT use `--no-verify`!

Commit messages are enforced by the Husky `commit-msg` hook.
Format: `<prefix>: <Detail>`

Two valid prefix forms:

- **Word prefix** (no `.` or `/`): must start with an uppercase letter
- **Filename/path prefix** (contains `.` or `/`): any case allowed

The detail (after `": "`) must start with an uppercase letter, digit, or opening quote/paren.

```
Feat: Add grading calculation          ✅ word prefix, uppercase
Fix: Correct rounding edge case        ✅
Docs: Update PLAN.md                   ✅
eslint.config.js: Update rules         ✅ filename prefix, any case
src/js/app.js: Refactor storage calls  ✅ path prefix

feat: add something                    ❌ word prefix must be uppercase
Feat: fix with lowercase detail        ❌ detail must start uppercase
Feat:  Double space                    ❌ exactly one space after colon
```
