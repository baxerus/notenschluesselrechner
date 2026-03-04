/**
 * storage.js — localStorage abstraction for Notenschlüsselrechner.
 *
 * Keys used:
 *   notenschluessel.key              — saved grading key (JSON string)
 *   notenschluessel.installGuideSeen — boolean flag ("true" / absent)
 */

const KEY_GRADING = "notenschluessel.key";
const KEY_GUIDE_SEEN = "notenschluessel.installGuideSeen";

/**
 * Persist the grading key to localStorage as a JSON string.
 *
 * @param {Array<{min: number, max: number, grade: number}>} key
 */
export function saveKey(key) {
  localStorage.setItem(KEY_GRADING, JSON.stringify(key));
}

/**
 * Load and parse the grading key from localStorage.
 * Returns null if the key is not found or the stored value is not valid JSON.
 *
 * @returns {Array<{min: number, max: number, grade: number}>|null}
 */
export function loadKey() {
  const raw = localStorage.getItem(KEY_GRADING);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
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
