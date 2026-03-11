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
 * Validate the 6 raw user-supplied Von values before any clamping or derivation.
 *
 * Must be called with the raw form values — NOT after deriveKey(), because
 * deriveKey() silently clamps invalid input and would mask errors.
 *
 * Rules checked (in order):
 *
 * 1. Exactly 6 values.
 * 2. All values are finite numbers (not empty / NaN).
 * 3. All values are non-negative.
 * 4. Von values are strictly descending: von[g] > von[g+1] for all g.
 * 5. Minimum gap rule — Von must be >= its Bis value (Von = Bis is allowed):
 *
 *      bis[g] = von[g+1] + pointStep   (grades 1–5)
 *      bis[6] = 0                       (fixed)
 *
 *      Required: von[g] >= bis[g]
 *
 *      Substituting bis[g] for grades 1–5:
 *        von[g] >= von[g+1] + pointStep
 *
 *      For grade 6:
 *        von[6] >= 0
 *        (already covered by rule 3: non-negative)
 *
 *    In other words: adjacent Von values must differ by at least pointStep
 *    (grades 1–5). Grade 6 Von >= 0 is sufficient.
 *
 * @param {number[]} vonAll    Array of 6 raw von values [von1..von6]
 * @param {number}   pointStep 1 or 0.5
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVon(vonAll, pointStep) {
  const errors = [];

  if (!Array.isArray(vonAll) || vonAll.length !== 6) {
    errors.push("Der Notenschlüssel muss genau 6 Zeilen enthalten.");
    return { valid: false, errors };
  }

  // 1. All values must be finite numbers
  const allFinite = vonAll.every((v) => Number.isFinite(v));
  if (!allFinite) {
    vonAll.forEach((v, i) => {
      if (!Number.isFinite(v)) {
        errors.push(`Note ${i + 1}: Von-Wert fehlt oder ist ungültig.`);
      }
    });
    // Cannot check order rules with non-finite values — stop here
    return { valid: false, errors };
  }

  // 2. All values must be non-negative
  vonAll.forEach((v, i) => {
    if (v < 0) {
      errors.push(`Note ${i + 1}: Von-Wert darf nicht negativ sein.`);
    }
  });

  // 3. Strictly descending (grade 1 > grade 2 > … > grade 6)
  for (let i = 0; i < vonAll.length - 1; i++) {
    if (vonAll[i] <= vonAll[i + 1]) {
      errors.push(
        `Note ${i + 1}: Von-Wert (${vonAll[i]}) muss größer sein als Von-Wert von Note ${i + 2} (${vonAll[i + 1]}).`,
      );
    }
  }

  // 4. Minimum gap: von[g] >= von[g+1] + pointStep  (grades 1–5)
  //    Derived from: von[g] >= bis[g], where bis[g] = von[g+1] + pointStep.
  //    Grade 6: von[6] >= 0 is already covered by rule 3 (non-negative).
  for (let i = 0; i < 5; i++) {
    const grade = i + 1;
    const bis = vonAll[i + 1] + pointStep;
    if (vonAll[i] < bis) {
      errors.push(
        `Note ${grade}: Von-Wert (${vonAll[i]}) muss mindestens ${bis} sein ` +
          `(Bis = ${bis}).`,
      );
    }
  }

  // 5. Divisibility check: Each value must be exactly divisible by pointStep
  vonAll.forEach((v, i) => {
    if (!Number.isInteger(v / pointStep)) {
      errors.push(
        `Note ${i + 1}: Von-Wert (${v}) entspricht nicht dem gewählten Mindestpunktabstand.`,
      );
    }
  });

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
