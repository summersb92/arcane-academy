<script lang="ts">
  import Header from './panels/Header.svelte';
  import Tabs from './panels/Tabs.svelte';
  import Resources from './panels/Resources.svelte';
  import Character from './panels/Character.svelte';
  import Main from './panels/Main.svelte';
</script>

<div class="wrap">
  <Header />
  <Tabs />
  <div class="body">
    <Resources />
    <Main />
    <Character />
  </div>
  <div class="foot">
    <span>Left = resources · top = tabs · right = your character. Theme picker in the header.</span>
    <span>Arcanum-style solo mage · idle-first · no server</span>
  </div>
</div>
