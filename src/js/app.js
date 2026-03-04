/**
 * app.js — Main app controller.
 * Wires DOM, storage, and grading logic together.
 */

import { recalculate, validateKey, parseKeyFromForm } from "./grading.js";
import {
  saveKey,
  loadKey,
  markInstallGuideSeen,
  hasSeenInstallGuide,
} from "./storage.js";

// ---------------------------------------------------------------------------
// Default grading key (6 rows, one per grade, max 60 points)
// ---------------------------------------------------------------------------

const DEFAULT_MAX = 60;

const DEFAULT_KEY = [
  { grade: 1, min: 57, max: 60 },
  { grade: 2, min: 49, max: 56 },
  { grade: 3, min: 41, max: 48 },
  { grade: 4, min: 33, max: 40 },
  { grade: 5, min: 20, max: 32 },
  { grade: 6, min: 0, max: 19 },
];

// ---------------------------------------------------------------------------
// DOM references (populated in init())
// ---------------------------------------------------------------------------

let editorBody;
let newMaxInput;
let calcForm;
let resultSection;
let resultBody;
let errorBox;
let installOverlay;

// ---------------------------------------------------------------------------
// Grading key editor
// ---------------------------------------------------------------------------

/**
 * Render the grading key editor rows from a key array.
 *
 * @param {Array<{min: number, max: number, grade: number}>} key
 */
function renderEditor(key) {
  editorBody.innerHTML = "";
  key.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="number" name="grade-${i}" value="${row.grade}" min="1" max="6" required aria-label="Note"></td>
      <td><input type="number" name="min-${i}" value="${row.min}" min="0" required aria-label="Von (Punkte)"></td>
      <td><input type="number" name="max-${i}" value="${row.max}" min="0" required aria-label="Bis (Punkte)"></td>
      <td><button type="button" class="btn-remove" data-index="${i}" aria-label="Zeile entfernen">✕</button></td>
    `;
    editorBody.appendChild(tr);
  });
}

/**
 * Read the current editor state into a key array.
 *
 * @returns {Array<{min: number, max: number, grade: number}>}
 */
function readEditorKey() {
  const fd = new FormData(calcForm);
  return parseKeyFromForm(fd);
}

/**
 * Auto-save the current editor state.
 */
function autoSave() {
  saveKey(readEditorKey());
}

// ---------------------------------------------------------------------------
// Result table
// ---------------------------------------------------------------------------

/**
 * Render the recalculated result table.
 *
 * @param {Array<{min: number, max: number, grade: number}>} key
 * @param {number} newMax
 */
function renderResult(key, newMax) {
  resultBody.innerHTML = "";

  // Sort by grade ascending for display
  const sorted = [...key].sort((a, b) => a.grade - b.grade);

  sorted.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.grade}</td>
      <td>${row.min}</td>
      <td>${row.max}</td>
    `;
    resultBody.appendChild(tr);
  });

  resultSection.querySelector(".result-max").textContent =
    `Maximalpunktzahl: ${newMax}`;
  resultSection.hidden = false;
}

// ---------------------------------------------------------------------------
// Error display
// ---------------------------------------------------------------------------

function showErrors(errors) {
  errorBox.innerHTML = errors.map((e) => `<li>${e}</li>`).join("");
  errorBox.hidden = false;
}

function clearErrors() {
  errorBox.innerHTML = "";
  errorBox.hidden = true;
}

// ---------------------------------------------------------------------------
// iOS install guide
// ---------------------------------------------------------------------------

function showInstallOverlay() {
  installOverlay.hidden = false;
}

function hideInstallOverlay() {
  installOverlay.hidden = true;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function handleCalculate(e) {
  e.preventDefault();
  clearErrors();

  const key = readEditorKey();
  const { valid, errors } = validateKey(key);

  if (!valid) {
    showErrors(errors);
    return;
  }

  const oldMax = key.reduce((m, r) => Math.max(m, r.max), 0);
  const newMax = Number(newMaxInput.value);

  if (!Number.isFinite(newMax) || newMax <= 0) {
    showErrors(["Bitte gib eine gültige neue Maximalpunktzahl ein."]);
    return;
  }

  const result = recalculate(key, oldMax, newMax);
  renderResult(result, newMax);
}

function handleAddRow() {
  const key = readEditorKey();
  key.push({ grade: 1, min: 0, max: 0 });
  renderEditor(key);
  autoSave();
}

function handleRemoveRow(index) {
  const key = readEditorKey();
  if (key.length <= 1) return; // keep at least one row
  key.splice(index, 1);
  renderEditor(key);
  autoSave();
}

function handleEditorChange() {
  autoSave();
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function init() {
  // Grab DOM references
  editorBody = document.getElementById("editor-body");
  newMaxInput = document.getElementById("new-max");
  calcForm = document.getElementById("calc-form");
  resultSection = document.getElementById("result-section");
  resultBody = document.getElementById("result-body");
  errorBox = document.getElementById("error-box");
  installOverlay = document.getElementById("install-overlay");

  // Load saved key or fall back to default
  const savedKey = loadKey();
  const activeKey = savedKey ?? DEFAULT_KEY;
  renderEditor(activeKey);

  // Pre-populate newMaxInput from active key
  const activeMax = activeKey.reduce((m, r) => Math.max(m, r.max), 0);
  newMaxInput.value = activeMax;

  // Persist the key immediately so it survives a reload even without any interaction
  if (!savedKey) {
    saveKey(activeKey);
  }

  // Form submission (Berechnen)
  calcForm.addEventListener("submit", handleCalculate);

  // Add row button
  document
    .getElementById("btn-add-row")
    .addEventListener("click", handleAddRow);

  // Remove row (delegated)
  editorBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove");
    if (btn) handleRemoveRow(Number(btn.dataset.index));
  });

  // Auto-save on any editor input change
  editorBody.addEventListener("change", handleEditorChange);
  editorBody.addEventListener("input", handleEditorChange);

  // Print button
  document.getElementById("btn-print").addEventListener("click", () => {
    window.print();
  });

  // iOS install guide
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true;

  if (isIOS && !isStandalone && !hasSeenInstallGuide()) {
    showInstallOverlay();
  }

  // "Nicht mehr anzeigen" — dismiss and set flag
  document.getElementById("btn-guide-dismiss").addEventListener("click", () => {
    markInstallGuideSeen();
    hideInstallOverlay();
  });

  // "Schließen" (×) — dismiss without flag
  document.getElementById("btn-guide-close").addEventListener("click", () => {
    hideInstallOverlay();
  });

  // ⓘ button — always opens guide
  document.getElementById("btn-info").addEventListener("click", () => {
    showInstallOverlay();
  });
}

document.addEventListener("DOMContentLoaded", init);
