<script lang="ts">
  // Player tab (character sheet, v0.1.2). The mage's name + earned Title, ★ Renown (its
  // new home — with the hover breakdown tooltip), and the equipped-gear roster with
  // Unequip. BUYING items stays on the Home tab; this tab only shows/manages what's
  // equipped. Driven entirely off UiState (player + resources.renown + home.items);
  // all colour flows through the app.css tokens.
  import { game, activeTab, unequipItem, openTip, hideTooltip, resourceTooltip, homeItemTooltip } from '../stores';
  import { fmt, fmtRate } from '../format';

  $: player = $game.player;
  $: renown = $game.resources.renown;
  $: equipped = $game.home.items.filter((it) => it.equipped);
</script>

<section>
  <h2>Player · Character</h2>
  <div class="sub">Your mage, their standing, and the gear they carry into the work.</div>

  <!-- Identity: name + earned title -->
  <div class="card ident">
    <div class="tt">
      <span class="nm">{player.name || 'A nameless waif'}</span>
      <span class="chip title">the {player.title}</span>
    </div>
    <div class="io flavour">Every Archmage started somewhere. This is your somewhere.</div>
  </div>

  <!-- Renown lives here now (moved off the left panel) -->
  <h2 class="mt">Renown</h2>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="card renown"
    on:mouseenter={(e) => openTip(e, resourceTooltip('renown', '★ Renown'))}
    on:mouseleave={hideTooltip}
  >
    <div class="tt">
      <span class="nm ren">★ Renown</span>
      <span class="rval">
        <span class="vl">{fmt(renown.amount)}</span>
        <span class="rt">{fmtRate(renown.rate)}</span>
      </span>
    </div>
    <div class="io flavour">Your name in the valley's mouth — spend it toward the Founding.</div>
  </div>

  <!-- Equipped gear -->
  <h2 class="mt">
    Equipped <span class="tag" style="font-weight:400">· slots {$game.home.used} / {$game.home.slots}</span>
  </h2>
  {#if equipped.length > 0}
    <div class="hgrid">
      {#each equipped as it (it.id)}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="hcard equipped"
          on:mouseenter={(e) => openTip(e, homeItemTooltip(it))}
          on:mouseleave={hideTooltip}
        >
          <div class="tt">
            <span class="nm">{it.name}</span>
            <span class="chip on">equipped</span>
          </div>
          <div class="io mods">{it.modsSummary}</div>
          <div class="hactions">
            <button
              class="btn"
              title={`Unequip ${it.name}`}
              on:click={() => unequipItem(it.id)}
              on:focus={(e) => openTip(e, homeItemTooltip(it))}
              on:blur={hideTooltip}
            >Unequip</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="card empty">
      <div class="io">No gear equipped yet.</div>
      <button type="button" class="link" on:click={() => activeTab.set('home')}>
        Buy &amp; equip items on the Home tab →
      </button>
    </div>
  {/if}
</section>

<style>
  .ident .tt,
  .renown .tt {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
  }
  .ident .nm {
    color: var(--ink);
    font-weight: 600;
    font-size: 15px;
  }
  .chip.title {
    color: var(--renown);
    border-color: var(--renown);
  }
  .flavour {
    color: var(--faint);
    font-size: 11.5px;
    margin-top: 5px;
    font-style: italic;
  }
  .renown {
    border-left: 3px solid var(--renown);
    cursor: help;
  }
  .renown .nm.ren {
    color: var(--renown);
    font-weight: 600;
    font-size: 13px;
  }
  .rval {
    font-variant-numeric: tabular-nums;
  }
  .rval .vl {
    color: var(--ink);
    font-size: 14px;
  }
  .rval .rt {
    color: var(--ok);
    font-size: 11px;
    margin-left: 6px;
  }
  /* Reuse the Home item-card look for equipped gear. */
  .hgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 10px;
    margin-top: 6px;
  }
  .hcard {
    border: 1px solid var(--edge);
    border-radius: 8px;
    padding: 9px 10px;
    background: var(--card);
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-height: 88px;
  }
  .hcard.equipped {
    border-left: 3px solid var(--ok);
  }
  .hcard .tt {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    align-items: baseline;
  }
  .hcard .nm {
    color: var(--ink);
    font-weight: 600;
    font-size: 12.5px;
  }
  .hcard .mods {
    color: var(--ok);
    font-size: 11px;
  }
  .chip.on {
    color: var(--ok);
    border-color: var(--ok);
  }
  .hactions {
    display: flex;
    gap: 6px;
    margin-top: auto;
    padding-top: 4px;
  }
  .empty .io {
    color: var(--dim);
    font-size: 12.5px;
  }
  .link {
    display: inline-block;
    margin-top: 6px;
    padding: 0;
    background: none;
    border: 0;
    color: var(--accent);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    text-align: left;
  }
  .link:hover {
    text-decoration: underline;
  }
  .link:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
