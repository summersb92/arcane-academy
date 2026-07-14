<script lang="ts">
  import { game } from '../stores';
  import { fmt, fmtRate } from '../format';

  function pct(cur: number, max: number): number {
    return max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  }
</script>

<div class="right">
  <h2>Character</h2>
  <div class="row"><span class="nm life">✚ Life</span><span class="vl">{fmt($game.vitals.life.cur)} / {fmt($game.vitals.life.max)}</span></div>
  <div class="mtr"><i style="width:{pct($game.vitals.life.cur, $game.vitals.life.max)}%;background:var(--life)"></i></div>
  <div class="row"><span class="nm stam">⚡ Stamina</span><span class="vl">{fmt($game.vitals.stamina.cur)} / {fmt($game.vitals.stamina.max)}</span></div>
  <div class="mtr"><i style="width:{pct($game.vitals.stamina.cur, $game.vitals.stamina.max)}%;background:var(--stam)"></i></div>
  <div class="row"><span class="nm mana">✦ Mana</span><span class="vl">{fmt($game.vitals.mana.cur)} / {fmt($game.vitals.mana.max)}</span></div>
  <div class="mtr"><i style="width:{pct($game.vitals.mana.cur, $game.vitals.mana.max)}%;background:var(--mana)"></i></div>

  <h2 class="mt">Essence</h2>
  {#each $game.essence as e (e.id)}
    <div class="row" class:dimmed={!e.awakened} title={e.awakened ? '' : `${e.label} — not yet awakened`}>
      <span class="nm {e.cls}">{e.glyph} {e.label}</span>
      <span>
        <span class="vl">{e.awakened ? fmt(e.amount) : '—'}</span>
        <span class="rt">{e.awakened ? fmtRate(e.rate) : ''}</span>
      </span>
    </div>
  {/each}

  <h2 class="mt">Opposed pairs</h2>
  <div class="chron">Fire ↔ Water · Earth ↔ Air · Light ↔ Dark<br />Balance all six → ❖ Prismatic.</div>
</div>
