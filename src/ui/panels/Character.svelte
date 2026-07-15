<script lang="ts">
  import { game } from '../stores';
  import { fmt, fmtRate } from '../format';

  function pct(cur: number, max: number): number {
    return max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  }
</script>

<div class="char">
  <h2>Character</h2>

  <div class="row">
    <span class="nm life">✚ Life</span>
    <span>
      <span class="vl">{fmt($game.vitals.life.cur)} / {fmt($game.vitals.life.max)}</span>
      <span class="rt reg" title="Life recovers {fmt($game.vitals.life.regen)}/s toward its max">{fmtRate($game.vitals.life.regen)}</span>
    </span>
  </div>
  <div class="mtr"><i style="width:{pct($game.vitals.life.cur, $game.vitals.life.max)}%;background:var(--life)"></i></div>

  <div class="row">
    <span class="nm stam">⚡ Stamina</span>
    <span>
      <span class="vl">{fmt($game.vitals.stamina.cur)} / {fmt($game.vitals.stamina.max)}</span>
      <span class="rt reg" title="Stamina recovers {fmt($game.vitals.stamina.regen)}/s (raised by the Mend cantrip)">{fmtRate($game.vitals.stamina.regen)}</span>
    </span>
  </div>
  <div class="mtr"><i style="width:{pct($game.vitals.stamina.cur, $game.vitals.stamina.max)}%;background:var(--stam)"></i></div>

  {#if $game.vitals.mana.max > 0}
    <div class="row">
      <span class="nm mana">✦ Mana</span>
      <span>
        <span class="vl">{fmt($game.vitals.mana.cur)} / {fmt($game.vitals.mana.max)}</span>
        <span class="rt reg" title="Mana recovers {fmt($game.vitals.mana.regen)}/s toward its max">{fmtRate($game.vitals.mana.regen)}</span>
      </span>
    </div>
    <div class="mtr"><i style="width:{pct($game.vitals.mana.cur, $game.vitals.mana.max)}%;background:var(--mana)"></i></div>
  {:else}
    <div class="row dimmed" title="Mana is sealed — learn the Inner Wellspring cantrip to open your wellspring">
      <span class="nm mana">✦ Mana</span>
      <span><span class="vl">— locked</span></span>
    </div>
    <div class="mtr locked"></div>
  {/if}

  <h2 class="mt">Essence</h2>
  {#each $game.essence as e (e.id)}
    <div class="row ess" class:dimmed={!e.awakened} title={e.awakened ? '' : `${e.label} — not yet awakened (learn a cantrip)`}>
      <span class="essnm {e.cls}"><span class="dot {e.cls}"></span>{e.glyph} {e.label}</span>
      <span>
        <span class="vl">{e.awakened ? fmt(e.amount) : '—'}</span>
        <span class="rt" title={e.rateTip ?? ''}>{e.awakened ? fmtRate(e.rate) : ''}</span>
      </span>
    </div>
  {/each}

  <h2 class="mt">Opposed pairs</h2>
  <div class="chron">Fire ↔ Water · Earth ↔ Air · Light ↔ Dark<br />Balance all six → ❖ Prismatic.</div>
</div>

<style>
  .reg {
    color: var(--faint);
    cursor: help;
  }
  .rt[title]:not([title='']) {
    cursor: help;
  }
  /* Essence rows are colour-coded by element. The name span carries the element class
     (.fire/.water/… map to tokens in app.css), so its text + the swatch pick up the
     element colour; the dot fills from currentColor so it works in all three themes. */
  .essnm {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 600;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: currentColor;
    flex: none;
    box-shadow: 0 0 0 1px var(--edge);
  }
  /* Sealed Mana: an empty dashed meter mirroring the dimmed-essence pattern. */
  .mtr.locked {
    background: transparent;
    border: 1px dashed var(--edge);
    height: 5px;
    border-radius: 3px;
    margin: 2px 0 6px;
  }
</style>
