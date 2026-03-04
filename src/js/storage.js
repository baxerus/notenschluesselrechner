/**
 * Keys used:
 *   notenschluessel.key              — saved grading key (JSON, new format { grade, von, bis })
 *   notenschluessel.pointStep        — minimum point distance (number: 1 or 0.5)
 *   notenschluessel.newMax           — new maximum point value (number)
 *   notenschluessel.newPointStep     — minimum point distance for result (number: 1 or 0.5)
 *   notenschluessel.rounding         — rounding mode for result ("ceil", "round", "floor")
 *   notenschluessel.editorCollapsed  — boolean flag ("true" / absent)
 *   notenschluessel.installGuideSeen — boolean flag ("true" / absent)
 */

const KEY_GRADING = "notenschluessel.key";
const KEY_POINT_STEP = "notenschluessel.pointStep";
const KEY_NEW_MAX = "notenschluessel.newMax";
const KEY_NEW_POINT_STEP = "notenschluessel.newPointStep";
const KEY_ROUNDING = "notenschluessel.rounding";
const KEY_EDITOR_COLLAPSED = "notenschluessel.editorCollapsed";
const KEY_GUIDE_SEEN = "notenschluessel.installGuideSeen";

/**
 * Persist the grading key to localStorage as a JSON string.
 *
 * @param {Array<{grade: number, von: number, bis: number}>} key
 */
export function saveKey(key) {
  localStorage.setItem(KEY_GRADING, JSON.stringify(key));
}

/**
 * Load and parse the grading key from localStorage.
 * Returns null if not found, not valid JSON, not an array,
 * or if the stored data uses the old { min, max, grade } format.
 *
 * @returns {Array<{grade: number, von: number, bis: number}>|null}
 */
export function loadKey() {
  const raw = localStorage.getItem(KEY_GRADING);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Discard old format silently
    if (!Object.prototype.hasOwnProperty.call(parsed[0], "von")) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the minimum point step.
 *
 * @param {number} step  1 or 0.5
 */
export function savePointStep(step) {
  localStorage.setItem(KEY_POINT_STEP, String(step));
}

/**
 * Load the minimum point step from localStorage.
 * Returns 1 (whole points) if not set or the stored value is not a recognised option.
 *
 * @returns {number}
 */
export function loadPointStep() {
  const raw = localStorage.getItem(KEY_POINT_STEP);
  const n = Number(raw);
  return n === 0.5 ? 0.5 : 1;
}

/**
 * Persist the new maximum point value.
 *
 * @param {number} newMax
 */
export function saveNewMax(newMax) {
  localStorage.setItem(KEY_NEW_MAX, String(newMax));
}

/**
 * Load the new maximum point value from localStorage.
 * Returns null if not set or not a valid positive number.
 *
 * @returns {number|null}
 */
export function loadNewMax() {
  const raw = localStorage.getItem(KEY_NEW_MAX);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Persist the minimum point step for the recalculated result.
 *
 * @param {number} step  1 or 0.5
 */
export function saveNewPointStep(step) {
  localStorage.setItem(KEY_NEW_POINT_STEP, String(step));
}

/**
 * Load the minimum point step for the recalculated result.
 * Returns 1 (whole points) if not set or not a recognised option.
 *
 * @returns {number}
 */
export function loadNewPointStep() {
  const raw = localStorage.getItem(KEY_NEW_POINT_STEP);
  const n = Number(raw);
  return n === 0.5 ? 0.5 : 1;
}

/**
 * Persist the rounding mode.
 *
 * @param {"ceil"|"round"|"floor"} mode
 */
export function saveRounding(mode) {
  localStorage.setItem(KEY_ROUNDING, mode);
}

/**
 * Load the rounding mode.
 * Returns "round" (kaufmännisch) if not set or unrecognised.
 *
 * @returns {"ceil"|"round"|"floor"}
 */
export function loadRounding() {
  const raw = localStorage.getItem(KEY_ROUNDING);
  return raw === "ceil" || raw === "floor" ? raw : "round";
}

/**
 * Persist the editor collapsed state.
 *
 * @param {boolean} collapsed
 */
export function saveEditorCollapsed(collapsed) {
  if (collapsed) {
    localStorage.setItem(KEY_EDITOR_COLLAPSED, "true");
  } else {
    localStorage.removeItem(KEY_EDITOR_COLLAPSED);
  }
}

/**
 * Load the editor collapsed state.
 * Returns false (expanded) if not set.
 *
 * @returns {boolean}
 */
export function loadEditorCollapsed() {
  return localStorage.getItem(KEY_EDITOR_COLLAPSED) === "true";
}

/**
 * Mark the iOS install guide as seen (persists across sessions).
 */
export function markInstallGuideSeen() {
  localStorage.setItem(KEY_GUIDE_SEEN, "true");
}

/**
 * Returns true if the iOS install guide has previously been dismissed
 * with "Nicht mehr anzeigen".
 *
 * @returns {boolean}
 */
export function hasSeenInstallGuide() {
  return localStorage.getItem(KEY_GUIDE_SEEN) === "true";
}
