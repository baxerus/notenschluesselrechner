# Notenschlüsselrechner

A mobile-first Progressive Web App (PWA) for German teachers to rescale grading keys to a new maximum point value.

## What it does

German teachers create a **Notenschlüssel** — a table mapping point ranges to grades 1–6. When designing a new exam with a different maximum, this app linearly rescales all grade thresholds to the new maximum with a single click.

**Features:**

- Edit a reference grading key (grades 1–6, upper/lower bounds)
- Choose point steps (whole or half points) and rounding mode (ceil / round / floor)
- One-click rescaling to any new maximum
- Auto-saves all settings and last result to `localStorage`
- Print layout with a graph-paper grid for physical grade sheets
- iOS PWA install guide
- Offline support via service worker
