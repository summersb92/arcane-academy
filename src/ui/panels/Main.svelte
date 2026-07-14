<script lang="ts">
  import { game, activeTab } from '../stores';
  import type { TaskView } from '../stores';

  // Task actions land in T-004; for now the card is a real button that no-ops.
  export let onTask: (t: TaskView) => void = () => {};

  $: active = $game.tasks.filter((t) => t.active);
  $: available = $game.tasks.filter((t) => !t.active);
</script>

<main>
  {#if $activeTab === 'main'}
    <section>
      <h2>Main · Activity</h2>
      <div class="sub">
        Tasks are what your mage does. Continuous tasks fill Activity slots; instant tasks fire once. A cost you
        can't pay auto-pauses the task until you can.
      </div>

      {#if active.length > 0}
        <h2 class="mt">Active <span class="tag" style="font-weight:400">(click a card to stop it)</span></h2>
        <div class="tgrid">
          {#each active as t (t.id)}
            <button
              class="tcard active"
              class:paused={t.paused}
              style="border-left-color:var(--{t.cls})"
              on:click={() => onTask(t)}
            >
              <div class="tt"><span class="nm">{t.name}</span><span class="chip">{t.kind}</span></div>
              <div class="mtr"><i style="width:{Math.round(t.progress * 100)}%;background:var(--{t.cls})"></i></div>
              <div class="io tag">{t.tag}{#if t.paused} · paused{/if}</div>
              <div class="io">{t.io}</div>
            </button>
          {/each}
        </div>
      {/if}

      <h2 class="mt">Available <span class="tag" style="font-weight:400">· click a card to start it</span></h2>
      <div class="tgrid">
        {#each available as t (t.id)}
          <button
            class="tcard"
            class:locked={t.locked}
            style="border-left-color:var(--{t.cls})"
            disabled={t.locked}
            on:click={() => onTask(t)}
          >
            <div class="tt"><span class="nm">{#if t.locked}🔒 {/if}{t.name}</span><span class="chip">{t.kind}</span></div>
            <div class="io tag">{t.tag}</div>
            <div class="io" class:lockt={t.locked}>{t.locked ? (t.lockText ?? '') : t.io}</div>
          </button>
        {/each}
      </div>

      <h2 class="mt">Chronicle</h2>
      <ul class="chron">
        {#each $game.chronicle as c}
          <li>
            <span class="t">{c.t}</span>
            <span class:ev={c.kind === 'ev'} class:found={c.kind === 'found'}>{c.text}</span>
          </li>
        {/each}
      </ul>
    </section>
  {:else if $activeTab === 'skills'}
    <section>
      <h2>Skills</h2>
      <div class="sub">The cantrip web. Spend ◈ Insight to learn cantrips; awakening an element starts its trickle. (T-005)</div>
    </section>
  {:else if $activeTab === 'home'}
    <section>
      <h2>Home</h2>
      <div class="sub">Your lair. Furnish fixtures for passive bonuses; hosts the Founding progress. (T-006)</div>
    </section>
  {:else}
    <section>
      <h2>{$activeTab}</h2>
      <div class="sub">Coming soon.</div>
    </section>
  {/if}
</main>
