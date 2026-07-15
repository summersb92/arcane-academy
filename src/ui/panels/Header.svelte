<script lang="ts">
  import ThemePicker from '../components/ThemePicker.svelte';
  import { systemOpen } from '../stores';
</script>

<header>
  <div class="title">ARCANE ACADEMY <span class="tag">· v0.1 · Act I</span></div>
  <div class="who">
    <span>A nameless stable-hand · Act I</span>
    <ThemePicker />
    <button
      type="button"
      class="sysbtn"
      aria-haspopup="dialog"
      title="Save, load & settings"
      on:click={() => systemOpen.set(true)}
    >⚙ System</button>
  </div>
</header>

<style>
  .sysbtn {
    font-family: inherit;
    font-size: 11.5px;
    color: var(--ink);
    background: var(--hover);
    border: 1px solid var(--edge);
    border-radius: 5px;
    padding: 2px 8px;
    cursor: pointer;
  }
  .sysbtn:hover {
    border-color: var(--accent);
  }
  .sysbtn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
