/**
 * grading.js — Pure grading-key calculation functions.
 * No DOM access, no side effects, no imports.
 *
 * Data structure for a grading key row:
 *   { min: number, max: number, grade: number }  // grade is 1–6
 */

/**
 * Recalculate all point thresholds proportionally to a new maximum.
 *
 * @param {Array<{min: number, max: number, grade: number}>} key
 * @param {number} oldMax
 * @param {number} newMax
 * @returns {Array<{min: number, max: number, grade: number}>}
 */
export function recalculate(key, oldMax, newMax) {
  return key.map((row) => ({
    grade: row.grade,
    min: Math.round((row.min / oldMax) * newMax),
    max: Math.round((row.max / oldMax) * newMax),
  }));
}

/**
 * Validate a grading key array.
 *
 * Rules checked:
 * - At least one row
 * - Every row has a grade in 1–6
 * - min and max are non-negative integers
 * - min <= max for each row
 * - No duplicate grade values
 *
 * @param {Array<{min: number, max: number, grade: number}>} key
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKey(key) {
  const errors = [];

  if (!Array.isArray(key) || key.length === 0) {
    errors.push("Der Notenschlüssel muss mindestens eine Zeile enthalten.");
    return { valid: false, errors };
  }

  const seenGrades = new Set();

  key.forEach((row, i) => {
    const label = `Zeile ${i + 1}`;

    if (!Number.isFinite(row.grade) || row.grade < 1 || row.grade > 6) {
      errors.push(`${label}: Note muss zwischen 1 und 6 liegen.`);
    } else if (seenGrades.has(row.grade)) {
      errors.push(`${label}: Note ${row.grade} ist doppelt vorhanden.`);
    } else {
      seenGrades.add(row.grade);
    }

    if (!Number.isFinite(row.min) || row.min < 0) {
      errors.push(
        `${label}: Mindestpunkte müssen eine nicht-negative Zahl sein.`,
      );
    }

    if (!Number.isFinite(row.max) || row.max < 0) {
      errors.push(
        `${label}: Maximalpunkte müssen eine nicht-negative Zahl sein.`,
      );
    }

    if (
      Number.isFinite(row.min) &&
      Number.isFinite(row.max) &&
      row.min > row.max
    ) {
      errors.push(
        `${label}: Mindestpunkte dürfen nicht größer als Maximalpunkte sein.`,
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Parse raw form values from a FormData object into a structured key array.
 * Expects fields named: grade-{i}, min-{i}, max-{i}  (i starting at 0).
 *
 * @param {FormData} formData
 * @returns {Array<{min: number, max: number, grade: number}>}
 */
export function parseKeyFromForm(formData) {
  const key = [];
  let i = 0;

  while (formData.has(`grade-${i}`)) {
    key.push({
      grade: Number(formData.get(`grade-${i}`)),
      min: Number(formData.get(`min-${i}`)),
      max: Number(formData.get(`max-${i}`)),
    });
    i++;
  }

  return key;
}
