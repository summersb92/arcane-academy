<script lang="ts">
  import { game } from '../stores';
  import { fmt, fmtRate } from '../format';

  // amber when at/above 90% of a cap (spec §3.14 "Caps in the left column")
  $: insightNearCap =
    $game.resources.insight.cap !== undefined &&
    $game.resources.insight.amount >= $game.resources.insight.cap * 0.9;
  $: goldNearCap =
    $game.resources.gold.cap !== undefined &&
    $game.resources.gold.amount >= $game.resources.gold.cap * 0.9;
</script>

<div class="left">
  <h2>Resources</h2>
  <div class="row">
    <span class="nm g">⦿ Gold</span>
    <span>
      <span
        class="vl"
        class:amber={goldNearCap}
        title={$game.resources.gold.atCap
          ? 'Gold at its cap — income is wasted until you raise it (buy a Coin Pouch / Strongbox on Home)'
          : ''}
      >
        {fmt($game.resources.gold.amount)}{#if $game.resources.gold.cap !== undefined}<span class="lockt"> / {fmt($game.resources.gold.cap)}</span>{/if}
      </span>
      <span class="rt" title={$game.resources.gold.rateTip ?? ''}>{fmtRate($game.resources.gold.rate)}</span>
    </span>
  </div>
  <div class="row">
    <span class="nm ins">◈ Insight</span>
    <span>
      <span
        class="vl"
        class:amber={insightNearCap}
        title={$game.resources.insight.atCap
          ? 'Insight at its cap — Study gains are wasted until you raise the cap (build the Grand Library)'
          : ''}
      >
        {fmt($game.resources.insight.amount)}{#if $game.resources.insight.cap !== undefined}<span class="lockt"> / {fmt($game.resources.insight.cap)}</span>{/if}
      </span>
      <span class="rt" title={$game.resources.insight.rateTip ?? ''}>{fmtRate($game.resources.insight.rate)}</span>
    </span>
  </div>
  <div class="row">
    <span class="nm ren">★ Renown</span>
    <span>
      <span class="vl">{fmt($game.resources.renown.amount)}</span>
      <span class="rt" title={$game.resources.renown.rateTip ?? ''}>{fmtRate($game.resources.renown.rate)}</span>
    </span>
  </div>

  <h2 class="mt">Materials</h2>
  <div class="mat"><span>⚘ Moonpetal</span><span>{fmt($game.materials.moonpetal)}</span></div>
  <div class="mat"><span>⛏ Iron Ore</span><span>{fmt($game.materials.ironOre)}</span></div>
  <div class="mat"><span>✧ Spirit Dust</span><span>{fmt($game.materials.spiritDust)}</span></div>
</div>

<style>
  .rt[title]:not([title='']) {
    cursor: help;
  }
</style>
