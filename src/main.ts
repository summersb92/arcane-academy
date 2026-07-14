// Boot. T-001: apply the saved theme, then mount the UI frame.
// T-002 expands this into: load save -> offline catch-up -> start tick -> mount UI.
import './app.css';
import App from './ui/App.svelte';
import { applyTheme, loadTheme } from './ui/theme';

applyTheme(loadTheme());

const target = document.getElementById('app');
if (!target) throw new Error('#app mount point not found');

const app = new App({ target });

export default app;
