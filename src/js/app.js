/**
 * app.js — Main app controller.
 * Wires DOM, storage, and grading logic together.
 */

import {
  deriveKey,
  recalculate,
  validateKey,
  parseVonFromForm,
} from "./grading.js";
import {
  saveKey,
  loadKey,
  savePointStep,
  loadPointStep,
  saveNewMax,
  loadNewMax,
  saveNewPointStep,
  loadNewPointStep,
  saveRounding,
  loadRounding,
  saveEditorCollapsed,
  loadEditorCollapsed,
  markInstallGuideSeen,
  hasSeenInstallGuide,
} from "./storage.js";

// ---------------------------------------------------------------------------
// Default grading key (6 rows, one per grade, max 60 whole points)
// ---------------------------------------------------------------------------

const DEFAULT_POINT_STEP = 1;

// Von values for all 6 grades of the default key (bis values are always derived)
const DEFAULT_VON_ALL = [60, 56, 48, 40, 32, 19];

// ---------------------------------------------------------------------------
// DOM references (populated in init())
// ---------------------------------------------------------------------------

let editorBody;
let editorToggleBtn;
let newMaxInput;
let pointStepSelect;
let newPointStepSelect;
let roundingSelect;
let calcForm;
let resultSection;
let resultBody;
let errorBox;
let installOverlay;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Currently active point step (1 or 0.5). Kept in sync with the select. */
let currentPointStep = DEFAULT_POINT_STEP;

/** Point step for the recalculated result (1 or 0.5). */
let currentNewPointStep = DEFAULT_POINT_STEP;

/** Rounding mode for the recalculated result. */
let currentRounding = "round";

/** Whether the editor body is currently collapsed. */
let editorCollapsed = false;

// ---------------------------------------------------------------------------
// Key derivation helpers
// ---------------------------------------------------------------------------

/**
 * Read all 6 editable von inputs from the form
 * and return a fully derived 6-row key.
 *
 * @returns {Array<{grade: number, von: number, bis: number}>}
 */
function readDerivedKey() {
  const fd = new FormData(calcForm);
  const vonAll = parseVonFromForm(fd);
  return deriveKey(vonAll, currentPointStep);
}

// ---------------------------------------------------------------------------
// Editor render
// ---------------------------------------------------------------------------

/**
 * Render the editor table rows from a fully derived key.
 * All 6 Von cells are editable inputs.
 * All Bis cells are read-only plain text.
 *
 * @param {Array<{grade: number, von: number, bis: number}>} key
 */
function renderEditor(key) {
  const sorted = [...key].sort((a, b) => a.grade - b.grade);
  editorBody.innerHTML = "";

  sorted.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="col-grade">${row.grade}</td>
      <td class="col-von"><input type="number" name="von-${row.grade}" value="${row.von}" min="0" step="${currentPointStep}" required aria-label="Von Punkte Note ${row.grade}"></td>
      <td class="col-bis"><span class="cell-readonly">${row.bis}</span></td>
    `;
    editorBody.appendChild(tr);
  });
}

/**
 * Re-derive the Bis values from the current form state
 * and update the read-only Bis cells in-place — without wiping the inputs.
 */
function updateReadonlyCells() {
  const key = readDerivedKey();
  const sorted = [...key].sort((a, b) => a.grade - b.grade);

  const rows = editorBody.querySelectorAll("tr");
  rows.forEach((tr, i) => {
    const row = sorted[i];
    // All Bis cells are read-only — update them
    const bisSpan = tr.querySelector(".col-bis .cell-readonly");
    if (bisSpan) bisSpan.textContent = row.bis;
  });
}

// ---------------------------------------------------------------------------
// Auto-save
// ---------------------------------------------------------------------------

function autoSave() {
  saveKey(readDerivedKey());
}

// ---------------------------------------------------------------------------
// Result table
// ---------------------------------------------------------------------------

/**
 * Render the recalculated result table.
 *
 * @param {Array<{grade: number, von: number, bis: number}>} key
 * @param {number} newMax
 */
function renderResult(key, newMax) {
  const sorted = [...key].sort((a, b) => a.grade - b.grade);
  resultBody.innerHTML = "";

  sorted.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.grade}</td>
      <td>${row.von}</td>
      <td>${row.bis}</td>
    `;
    resultBody.appendChild(tr);
  });

  resultSection.querySelector(".result-max").innerHTML =
    `<span class="result-max__label">Maximalpunktzahl: ${newMax}</span>`;
  resultSection.hidden = false;
}

// ---------------------------------------------------------------------------
// Editor collapse / expand
// ---------------------------------------------------------------------------

function setEditorCollapsed(collapsed) {
  editorCollapsed = collapsed;
  const editorBodyWrapper = document.getElementById("editor-body-wrapper");
  editorBodyWrapper.hidden = collapsed;
  editorToggleBtn.setAttribute("aria-expanded", String(!collapsed));
  editorToggleBtn
    .querySelector(".chevron")
    .classList.toggle("chevron--open", !collapsed);
  saveEditorCollapsed(collapsed);
}

function toggleEditor() {
  setEditorCollapsed(!editorCollapsed);
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

  const key = readDerivedKey();
  const { valid, errors } = validateKey(key);

  if (!valid) {
    showErrors(errors);
    return;
  }

  // oldMax = grade 1 von of the reference key
  const oldMax = key.find((r) => r.grade === 1).von;
  const newMax = Number(newMaxInput.value);

  if (!Number.isFinite(newMax) || newMax <= 0) {
    showErrors(["Bitte gib eine gültige neue Maximalpunktzahl ein."]);
    return;
  }

  const result = recalculate(
    key,
    oldMax,
    newMax,
    currentNewPointStep,
    currentRounding,
  );
  renderResult(result, newMax);
  setEditorCollapsed(true);
}

function handlePointStepChange() {
  currentPointStep = Number(pointStepSelect.value);
  savePointStep(currentPointStep);
  updateReadonlyCells();
  autoSave();
}

function handleNewPointStepChange() {
  currentNewPointStep = Number(newPointStepSelect.value);
  saveNewPointStep(currentNewPointStep);
}

function handleRoundingChange() {
  currentRounding = roundingSelect.value;
  saveRounding(currentRounding);
}

function handleEditorInput() {
  updateReadonlyCells();
  autoSave();
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function init() {
  // Grab DOM references
  editorBody = document.getElementById("editor-body");
  editorToggleBtn = document.getElementById("editor-toggle");
  newMaxInput = document.getElementById("new-max");
  pointStepSelect = document.getElementById("point-step");
  newPointStepSelect = document.getElementById("new-point-step");
  roundingSelect = document.getElementById("rounding");
  calcForm = document.getElementById("calc-form");
  resultSection = document.getElementById("result-section");
  resultBody = document.getElementById("result-body");
  errorBox = document.getElementById("error-box");
  installOverlay = document.getElementById("install-overlay");

  // Restore point steps
  currentPointStep = loadPointStep();
  pointStepSelect.value = String(currentPointStep);
  currentNewPointStep = loadNewPointStep();
  newPointStepSelect.value = String(currentNewPointStep);
  currentRounding = loadRounding();
  roundingSelect.value = currentRounding;

  // Load saved key or fall back to default
  const savedKey = loadKey();
  let activeKey;

  if (savedKey) {
    activeKey = savedKey;
  } else {
    activeKey = deriveKey(DEFAULT_VON_ALL, DEFAULT_POINT_STEP);
    saveKey(activeKey);
  }

  renderEditor(activeKey);

  // Restore new max
  const savedNewMax = loadNewMax();
  if (savedNewMax !== null) {
    newMaxInput.value = String(savedNewMax);
  }

  // Auto-calculate on init if all necessary values are available,
  // then collapse the editor. Otherwise restore the persisted collapse state.
  if (savedKey && savedNewMax !== null) {
    const oldMax = activeKey.find((r) => r.grade === 1).von;
    const result = recalculate(
      activeKey,
      oldMax,
      savedNewMax,
      currentNewPointStep,
      currentRounding,
    );
    renderResult(result, savedNewMax);
    setEditorCollapsed(true);
  } else {
    const collapsed = loadEditorCollapsed();
    const editorBodyWrapper = document.getElementById("editor-body-wrapper");
    editorCollapsed = collapsed;
    editorBodyWrapper.hidden = collapsed;
    editorToggleBtn.setAttribute("aria-expanded", String(!collapsed));
    editorToggleBtn
      .querySelector(".chevron")
      .classList.toggle("chevron--open", !collapsed);
  }

  // Event listeners
  calcForm.addEventListener("submit", handleCalculate);
  pointStepSelect.addEventListener("change", handlePointStepChange);
  editorBody.addEventListener("input", handleEditorInput);
  editorToggleBtn.addEventListener("click", toggleEditor);
  newPointStepSelect.addEventListener("change", handleNewPointStepChange);
  roundingSelect.addEventListener("change", handleRoundingChange);
  newMaxInput.addEventListener("input", () => {
    const v = Number(newMaxInput.value);
    if (Number.isFinite(v) && v > 0) saveNewMax(v);
  });

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

  document.getElementById("btn-guide-dismiss").addEventListener("click", () => {
    markInstallGuideSeen();
    hideInstallOverlay();
  });

  document.getElementById("btn-guide-close").addEventListener("click", () => {
    hideInstallOverlay();
  });

  document.getElementById("btn-info").addEventListener("click", () => {
    showInstallOverlay();
  });
}

document.addEventListener("DOMContentLoaded", init);
