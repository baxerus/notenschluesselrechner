/**
 * grading.js — Pure grading-key calculation functions.
 * No DOM access, no side effects, no imports.
 *
 * Data structure for a grading key row:
 *   { grade: number, von: number, bis: number }
 *   - grade : 1–6 (1 = best, 6 = worst)
 *   - von   : upper bound of the grade's point range (inclusive) — always user-editable
 *   - bis   : lower bound of the grade's point range (inclusive) — always auto-derived
 *
 * Derivation rules (editor):
 *   - All 6 von values are user-editable inputs.
 *   - bis[g] = von[g+1] + pointStep  (auto-derived for grades 1–5)
 *   - bis[6] = 0  (always locked)
 *
 * Recalculation rules (result after Berechnen):
 *   - All 6 von values are scaled proportionally to newMax.
 *   - Grade 1 von is then snapped to newMax exactly.
 *   - All bis values are re-derived from the scaled von values.
 *
 * pointStep: minimum point difference between adjacent grade boundaries.
 *   Supported values: 1 (whole points), 0.5 (half points).
 */

/**
 * Derive the complete 6-row key from all 6 user-supplied von values.
 * Only bis values are calculated — von values are taken as-is.
 *
 * @param {number[]} vonAll   Array of 6 values: von for grades 1–6 (in order)
 * @param {number}   pointStep
 * @returns {Array<{grade: number, von: number, bis: number}>}
 */
export function deriveKey(vonAll, pointStep) {
  return vonAll.map((von, i) => {
    const grade = i + 1;
    let bis;
    if (grade === 6) {
      bis = 0; // always locked
    } else {
      bis = vonAll[i + 1] + pointStep;
    }
    // Clamp: bis must not go below 0
    if (bis < 0) bis = 0;
    // Clamp: von must not go below bis
    if (von < bis) von = bis;
    return { grade, von, bis };
  });
}

/**
 * Check whether a stored key array uses the new { grade, von, bis } shape.
 * Returns false if it looks like the old { grade, min, max } format.
 *
 * @param {Array} key
 * @returns {boolean}
 */
export function isNewKeyFormat(key) {
  if (!Array.isArray(key) || key.length === 0) return false;
  return Object.prototype.hasOwnProperty.call(key[0], "von");
}

/**
 * Recalculate all point thresholds proportionally to a new maximum.
 *
 * Algorithm:
 *   1. Scale all 6 von values proportionally to newMax.
 *   2. Round each scaled value to the nearest newPointStep multiple
 *      using the specified rounding mode ("ceil", "round", "floor").
 *   3. Snap grade 1 von to newMax exactly.
 *   4. Re-derive all bis values via deriveKey.
 *   5. Clamping is handled inside deriveKey (bis ≥ 0, von ≥ bis).
 *
 * @param {Array<{grade: number, von: number, bis: number}>} key
 * @param {number} oldMax      Grade 1 von of the reference key
 * @param {number} newMax      Desired new maximum
 * @param {number} newPointStep  Point step for the result key
 * @param {"ceil"|"round"|"floor"} rounding  Rounding mode
 * @returns {Array<{grade: number, von: number, bis: number}>}
 */
export function recalculate(key, oldMax, newMax, newPointStep, rounding) {
  const sorted = [...key].sort((a, b) => a.grade - b.grade);

  const roundFn =
    rounding === "ceil"
      ? Math.ceil
      : rounding === "floor"
        ? Math.floor
        : Math.round;

  const scaledVon = sorted.map((row) => {
    if (row.grade === 1) return newMax; // snap to new ceiling
    const raw = (row.von / oldMax) * newMax;
    return roundFn(raw / newPointStep) * newPointStep;
  });

  return deriveKey(scaledVon, newPointStep);
}

/**
 * Validate a grading key array (new format).
 *
 * Rules checked:
 * - Exactly 6 rows, one per grade 1–6
 * - All von values are finite and non-negative
 * - von ≥ bis for every row
 * - Von values are strictly descending across grades
 *
 * @param {Array<{grade: number, von: number, bis: number}>} key
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKey(key) {
  const errors = [];

  if (!Array.isArray(key) || key.length !== 6) {
    errors.push("Der Notenschlüssel muss genau 6 Zeilen enthalten.");
    return { valid: false, errors };
  }

  const sorted = [...key].sort((a, b) => a.grade - b.grade);

  sorted.forEach((row) => {
    const label = `Note ${row.grade}`;
    if (!Number.isFinite(row.von) || row.von < 0) {
      errors.push(`${label}: Von-Wert muss eine nicht-negative Zahl sein.`);
    }
    if (!Number.isFinite(row.bis) || row.bis < 0) {
      errors.push(`${label}: Bis-Wert muss eine nicht-negative Zahl sein.`);
    }
    if (
      Number.isFinite(row.von) &&
      Number.isFinite(row.bis) &&
      row.von < row.bis
    ) {
      errors.push(`${label}: Von-Wert darf nicht kleiner als Bis-Wert sein.`);
    }
  });

  // Strictly descending von values
  for (let i = 0; i < sorted.length - 1; i++) {
    if (
      Number.isFinite(sorted[i].von) &&
      Number.isFinite(sorted[i + 1].von) &&
      sorted[i].von <= sorted[i + 1].von
    ) {
      errors.push(
        `Note ${sorted[i].grade}: Von-Wert muss größer sein als der Von-Wert von Note ${sorted[i + 1].grade}.`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse all 6 user-editable von values from a FormData object.
 * Field names: von-1, von-2, von-3, von-4, von-5, von-6
 *
 * @param {FormData} formData
 * @returns {number[]}  [von1, von2, von3, von4, von5, von6]
 */
export function parseVonFromForm(formData) {
  return [1, 2, 3, 4, 5, 6].map((g) => Number(formData.get(`von-${g}`)));
}
