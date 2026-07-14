// Boot: apply theme -> load save -> offline catch-up -> mount UI -> start tick.
import './app.css';
import App from './ui/App.svelte';
import { applyTheme, loadTheme } from './ui/theme';
import { getState, setState, startLoop } from './ui/stores';
import { newGame } from './engine/state';
import { applyOffline } from './engine/offline';
import { safeLoad, serialize, LOCALSTORAGE_KEY } from './engine/save';
import { AUTOSAVE_INTERVAL_MS } from './content/config';

applyTheme(loadTheme());

// ---- load save (corruption-safe: never silently wipe) ----
let persistBlocked = false;
let raw: string | null = null;
try {
  raw = localStorage.getItem(LOCALSTORAGE_KEY);
} catch {
  /* localStorage unavailable */
}

const loaded = safeLoad(raw);
if (loaded.ok && loaded.state) {
  setState(loaded.state);
  if (loaded.migratedFrom !== undefined) {
    console.info(`[save] migrated from v${loaded.migratedFrom}.`);
  }
} else {
  if (raw) {
    // Existing data failed to load — keep it on disk, run fresh in memory, don't clobber.
    persistBlocked = true;
    console.error(`[save] could not load existing save: ${loaded.error} — starting a temporary new game; your file was NOT overwritten.`);
  }
  setState(newGame());
}

// ---- offline catch-up ----
const summary = applyOffline(getState());
if (summary.appliedMs > 1000 && Object.keys(summary.gains).length > 0) {
  const mins = Math.round(summary.appliedMs / 60000);
  console.info(`[offline] away ~${mins} min${summary.capped ? ' (capped)' : ''}:`, summary.gains);
  // The "While you were away…" panel consumes this summary in T-006.
}

// ---- persistence ----
function save(): void {
  if (persistBlocked) return;
  const state = getState();
  state.lastSaved = Date.now();
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, serialize(state));
  } catch {
    /* quota / unavailable — ignore */
  }
}

setInterval(save, AUTOSAVE_INTERVAL_MS);
window.addEventListener('beforeunload', save);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});

// ---- mount + run ----
const target = document.getElementById('app');
if (!target) throw new Error('#app mount point not found');

const app = new App({ target });
startLoop();

export default app;
