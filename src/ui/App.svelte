<script lang="ts">
  import Header from './panels/Header.svelte';
  import Tabs from './panels/Tabs.svelte';
  import Resources from './panels/Resources.svelte';
  import Chronicle from './panels/Chronicle.svelte';
  import Character from './panels/Character.svelte';
  import Main from './panels/Main.svelte';
  import System from './panels/System.svelte';
  import OfflinePanel from './components/OfflinePanel.svelte';
</script>

<div class="wrap">
  <Header />
  <Tabs />
  <div class="body">
    <Resources />
    <Main />
    <aside class="right">
      <Chronicle />
      <Character />
    </aside>
  </div>
  <div class="foot">
    <span>Left = resources · top = tabs · right = the Chronicle &amp; your character. Theme &amp; System in the header.</span>
    <span>Arcanum-style solo mage · idle-first · no server</span>
  </div>
</div>

<!-- Overlays: shown on load after an idle gap / opened from the header. -->
<OfflinePanel />
<System />
