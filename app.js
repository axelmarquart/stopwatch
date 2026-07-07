// Stoppuhr-Tracking-App
// Vanilla JS, kein Framework, kein Build-Step.
// Aufbau: DOM-Referenzen -> Stoppuhr-State-Machine -> Persistenz ->
// Liste -> Chart -> Export/Import -> Initialisierung.

// ---------------------------------------------------------------------------
// DOM-Referenzen
// ---------------------------------------------------------------------------
const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const stopBtn = document.getElementById('stopBtn');

const saveForm = document.getElementById('saveForm');
const finalTimeText = document.getElementById('finalTimeText');
const commentInput = document.getElementById('commentInput');
const discardEntryBtn = document.getElementById('discardEntryBtn');

const entriesList = document.getElementById('entriesList');
const entriesEmptyHint = document.getElementById('entriesEmptyHint');

const windowSlider = document.getElementById('windowSlider');
const windowSizeLabel = document.getElementById('windowSizeLabel');
const chartCanvas = document.getElementById('averageChart');
const chartEmptyHint = document.getElementById('chartEmptyHint');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');

const confirmDialog = document.getElementById('confirmDialog');
const confirmDialogText = document.getElementById('confirmDialogText');
const confirmDialogOkBtn = document.getElementById('confirmDialogOkBtn');
const confirmDialogCancelBtn = document.getElementById('confirmDialogCancelBtn');

const importDialog = document.getElementById('importDialog');
const importMergeBtn = document.getElementById('importMergeBtn');
const importReplaceBtn = document.getElementById('importReplaceBtn');
const importCancelBtn = document.getElementById('importCancelBtn');

// ---------------------------------------------------------------------------
// Stoppuhr-State-Machine: idle -> running -> paused -> running -> ... -> stopped
// ---------------------------------------------------------------------------
let state = 'idle';
let accumulatedMs = 0;      // Summe abgeschlossener Running-Segmente
let segmentStartTs = null;  // performance.now() bei Start des aktuellen Segments
let finalMs = 0;            // beim Stopp eingefrorener Wert fuer das Speicher-Formular
let tickIntervalId = null;

function getElapsedMs() {
  if (state === 'running') {
    return accumulatedMs + (performance.now() - segmentStartTs);
  }
  return accumulatedMs;
}

// mm:ss.cs, ab einer Stunde hh:mm:ss (ohne Nachkommastellen)
function formatDuration(ms) {
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad2 = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}.${pad2(centiseconds)}`;
}

function renderTimeDisplay() {
  timeDisplay.textContent = formatDuration(getElapsedMs());
}

function startTick() {
  stopTick();
  tickIntervalId = setInterval(renderTimeDisplay, 100);
}

function stopTick() {
  if (tickIntervalId !== null) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
}

// Zeigt/versteckt Buttons und Formular passend zum aktuellen State.
function updateButtonsForState() {
  const isIdle = state === 'idle';
  const isRunning = state === 'running';
  const isPaused = state === 'paused';
  const isStopped = state === 'stopped';

  startBtn.hidden = !isIdle;
  pauseResumeBtn.hidden = isIdle || isStopped;
  stopBtn.hidden = isIdle || isStopped;
  saveForm.hidden = !isStopped;

  if (isRunning) {
    pauseResumeBtn.textContent = 'Pause';
  } else if (isPaused) {
    pauseResumeBtn.textContent = 'Fortsetzen';
  }
}

function handleStart() {
  accumulatedMs = 0;
  segmentStartTs = performance.now();
  state = 'running';
  startTick();
  renderTimeDisplay();
  updateButtonsForState();
}

function handlePauseResume() {
  if (state === 'running') {
    accumulatedMs += performance.now() - segmentStartTs;
    segmentStartTs = null;
    state = 'paused';
    stopTick();
    renderTimeDisplay();
  } else if (state === 'paused') {
    segmentStartTs = performance.now();
    state = 'running';
    startTick();
  }
  updateButtonsForState();
}

function handleStop() {
  if (state === 'running') {
    accumulatedMs += performance.now() - segmentStartTs;
    segmentStartTs = null;
    stopTick();
  }
  finalMs = accumulatedMs;
  state = 'stopped';
  renderTimeDisplay();
  finalTimeText.textContent = formatDuration(finalMs);
  commentInput.value = '';
  updateButtonsForState();
}

function resetToIdle() {
  accumulatedMs = 0;
  finalMs = 0;
  segmentStartTs = null;
  state = 'idle';
  renderTimeDisplay();
  updateButtonsForState();
}

function handleSaveEntry(event) {
  event.preventDefault();
  addEntry({
    id: createId(),
    timestamp: new Date().toISOString(),
    durationMs: finalMs,
    comment: commentInput.value,
  });
  resetToIdle();
  renderEntriesList();
  renderChart();
}

function handleDiscardEntry() {
  resetToIdle();
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Persistenz (localStorage)
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'stopwatch.entries.v1';

function isValidEntry(entry) {
  return (
    entry &&
    typeof entry.id === 'string' &&
    typeof entry.timestamp === 'string' &&
    !Number.isNaN(new Date(entry.timestamp).getTime()) &&
    typeof entry.durationMs === 'number' &&
    Number.isFinite(entry.durationMs) &&
    entry.durationMs >= 0 &&
    typeof entry.comment === 'string'
  );
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch (err) {
    console.warn('Konnte gespeicherte Einträge nicht laden, starte mit leerer Historie.', err);
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Konnte Einträge nicht speichern (z. B. Speicher voll).', err);
  }
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
}

function deleteEntry(id) {
  const entries = loadEntries().filter((entry) => entry.id !== id);
  saveEntries(entries);
}

function updateEntryComment(id, newComment) {
  const entries = loadEntries();
  const target = entries.find((entry) => entry.id === id);
  if (target) {
    target.comment = newComment;
    saveEntries(entries);
  }
}

function getSortedEntriesAsc() {
  return loadEntries().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getRecentEntriesDesc(limit = 10) {
  return getSortedEntriesAsc().reverse().slice(0, limit);
}

// ---------------------------------------------------------------------------
// Liste der letzten 10 Einträge
// ---------------------------------------------------------------------------
function renderEntriesList() {
  const recentEntries = getRecentEntriesDesc(10);
  entriesList.innerHTML = '';
  entriesEmptyHint.hidden = recentEntries.length > 0;

  for (const entry of recentEntries) {
    entriesList.appendChild(createEntryListItem(entry));
  }
}

function createEntryListItem(entry) {
  const li = document.createElement('li');
  li.className = 'entry-item';

  const main = document.createElement('div');
  main.className = 'entry-main';

  const durationEl = document.createElement('div');
  durationEl.className = 'entry-duration';
  durationEl.textContent = formatDuration(entry.durationMs);

  const timestampEl = document.createElement('div');
  timestampEl.className = 'entry-timestamp';
  timestampEl.textContent = new Date(entry.timestamp).toLocaleString('de-DE');

  const commentEl = document.createElement('input');
  commentEl.type = 'text';
  commentEl.className = 'entry-comment';
  commentEl.placeholder = 'Kommentar hinzufügen...';
  commentEl.value = entry.comment;
  commentEl.addEventListener('change', () => {
    updateEntryComment(entry.id, commentEl.value);
  });

  main.appendChild(durationEl);
  main.appendChild(timestampEl);
  main.appendChild(commentEl);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'entry-delete-btn';
  deleteBtn.setAttribute('aria-label', 'Eintrag löschen');
  deleteBtn.textContent = '🗑';
  deleteBtn.addEventListener('click', () => {
    showConfirmDialog('Diesen Eintrag wirklich löschen?', () => {
      deleteEntry(entry.id);
      renderEntriesList();
      renderChart();
    });
  });

  li.appendChild(main);
  li.appendChild(deleteBtn);
  return li;
}

// ---------------------------------------------------------------------------
// Bestätigungsdialog (wiederverwendet fürs Löschen)
// ---------------------------------------------------------------------------
function showConfirmDialog(text, onConfirm) {
  confirmDialogText.textContent = text;
  confirmDialog.showModal();

  function cleanup() {
    confirmDialogOkBtn.removeEventListener('click', onOk);
    confirmDialogCancelBtn.removeEventListener('click', onCancel);
  }
  function onOk() {
    cleanup();
    confirmDialog.close();
    onConfirm();
  }
  function onCancel() {
    cleanup();
    confirmDialog.close();
  }

  confirmDialogOkBtn.addEventListener('click', onOk);
  confirmDialogCancelBtn.addEventListener('click', onCancel);
}

// ---------------------------------------------------------------------------
// Chart: gleitender Durchschnitt über die gesamte Historie
// ---------------------------------------------------------------------------
let chartInstance = null;

// Zeichnet erst ab einem vollen Fenster von windowSize Werten: jeder
// gelieferte Punkt ist ein echter, konsistenter N-Werte-Durchschnitt.
// Fenster=1 -> jeder Punkt ist der rohe Einzelwert -> Rohkurve.
// Weniger Werte vorhanden als die Fenstergroesse -> leeres Ergebnis-Array.
function computeRollingAverage(values, windowSize) {
  const result = [];
  for (let i = windowSize - 1; i < values.length; i++) {
    const slice = values.slice(i - windowSize + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    result.push(sum / slice.length);
  }
  return result;
}

function renderChart() {
  const entries = getSortedEntriesAsc();
  const windowSize = Number(windowSlider.value);
  const durations = entries.map((entry) => entry.durationMs);
  const averages = computeRollingAverage(durations, windowSize);

  // Zwei Leer-Faelle unterscheiden: gar keine Einträge vs. Einträge
  // vorhanden, aber noch nicht genug fuer die gewaehlte Fenstergroesse.
  if (entries.length === 0) {
    chartEmptyHint.hidden = false;
    chartEmptyHint.textContent = 'Noch keine Daten für das Diagramm.';
  } else if (averages.length === 0) {
    chartEmptyHint.hidden = false;
    chartEmptyHint.textContent = `Noch nicht genug Daten für Fenstergröße ${windowSize}.`;
  } else {
    chartEmptyHint.hidden = true;
  }

  // computeRollingAverage liefert erst ab Index (windowSize - 1) einen Wert,
  // daher muessen Labels/Tooltip-Zuordnung entsprechend versetzt werden.
  const plottedEntries = entries.slice(windowSize - 1);
  const labels = plottedEntries.map((_, index) => String(windowSize + index));

  const chartData = {
    labels,
    datasets: [
      {
        label: `Gleitender Durchschnitt (Fenster ${windowSize})`,
        data: averages,
        borderColor: '#4f46e5',
        backgroundColor: '#4f46e5',
        tension: 0.2,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          callback: (value) => formatDuration(value),
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const entry = plottedEntries[context.dataIndex];
            const avgText = formatDuration(context.parsed.y);
            if (!entry) return avgText;
            const timestampText = new Date(entry.timestamp).toLocaleString('de-DE');
            const commentText = entry.comment ? ` – ${entry.comment}` : '';
            return `Ø ${avgText} (${timestampText}${commentText})`;
          },
        },
      },
    },
  };

  if (chartInstance) {
    chartInstance.data = chartData;
    chartInstance.options = options;
    chartInstance.update();
  } else {
    chartInstance = new Chart(chartCanvas, {
      type: 'line',
      data: chartData,
      options,
    });
  }
}

function handleWindowSliderChange() {
  windowSizeLabel.textContent = windowSlider.value;
  renderChart();
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------
function handleExport() {
  const entries = getSortedEntriesAsc();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `stoppuhr-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportButtonClick() {
  importFileInput.value = '';
  importFileInput.click();
}

function handleImportFileSelected() {
  const file = importFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (err) {
      alert('Die Datei enthält kein gültiges JSON.');
      return;
    }

    if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) {
      alert('Die Datei hat nicht das erwartete Format einer Stoppuhr-Historie.');
      return;
    }

    showImportDialog(parsed);
  };
  reader.readAsText(file);
}

function showImportDialog(importedEntries) {
  importDialog.showModal();

  function cleanup() {
    importMergeBtn.removeEventListener('click', onMerge);
    importReplaceBtn.removeEventListener('click', onReplace);
    importCancelBtn.removeEventListener('click', onCancel);
  }
  function onMerge() {
    cleanup();
    importDialog.close();
    mergeEntries(importedEntries);
  }
  function onReplace() {
    cleanup();
    importDialog.close();
    saveEntries(importedEntries);
    renderEntriesList();
    renderChart();
  }
  function onCancel() {
    cleanup();
    importDialog.close();
  }

  importMergeBtn.addEventListener('click', onMerge);
  importReplaceBtn.addEventListener('click', onReplace);
  importCancelBtn.addEventListener('click', onCancel);
}

// Zusammenführen: lokale Einträge haben bei gleicher id Vorrang, damit ein
// altes Backup keine frischeren lokalen Kommentar-Edits überschreibt.
function mergeEntries(importedEntries) {
  const merged = new Map();
  for (const entry of loadEntries()) {
    merged.set(entry.id, entry);
  }
  for (const entry of importedEntries) {
    if (!merged.has(entry.id)) {
      merged.set(entry.id, entry);
    }
  }
  saveEntries(Array.from(merged.values()));
  renderEntriesList();
  renderChart();
}

// ---------------------------------------------------------------------------
// Initialisierung
// ---------------------------------------------------------------------------
function init() {
  renderTimeDisplay();
  updateButtonsForState();
  renderEntriesList();
  renderChart();

  startBtn.addEventListener('click', handleStart);
  pauseResumeBtn.addEventListener('click', handlePauseResume);
  stopBtn.addEventListener('click', handleStop);
  saveForm.addEventListener('submit', handleSaveEntry);
  discardEntryBtn.addEventListener('click', handleDiscardEntry);

  windowSlider.addEventListener('input', handleWindowSliderChange);

  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', handleImportButtonClick);
  importFileInput.addEventListener('change', handleImportFileSelected);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
}

document.addEventListener('DOMContentLoaded', init);
