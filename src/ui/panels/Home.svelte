<script lang="ts">
  import { game, dispatchTask } from '../stores';
  import type { TaskView } from '../stores';
  import { fmt } from '../format';

  function onKey(e: KeyboardEvent, t: TaskView): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!t.locked) dispatchTask(t);
    }
  }

  $: homeTasks = $game.tasks.filter((t) => t.panel === 'home');
  $: active = homeTasks.filter((t) => t.active);
  $: fixtures = homeTasks.filter((t) => !t.active && t.group === 'Fixture');
  $: founding = homeTasks.filter((t) => !t.active && t.group === 'Founding');
  $: f = $game.founding;
</script>

<section>
  <h2>Home · The Lair</h2>
  <div class="sub">
    Your dwelling and livelihoods. Furnish fixtures for passive bonuses, then work toward the Founding — the
    goal that ends Act I.
  </div>

  <!-- The persistent Founding progress card (spec §3.10): the goal is always visible. -->
  <div class="card found" class:done={f.founded}>
    <div class="tt">
      <span class="nm">The Founding</span>
      <span class="chip">{f.founded ? 'complete ★' : `${f.metCount}/${f.total} ready`}</span>
    </div>
    {#if f.founded}
      <div class="io big">Your Academy stands. Act II — students, faculty, the Research web — arrives in v0.2.</div>
    {:else}
      <div class="io">Meet all four to found your Academy:</div>
      <ul class="reqs">
        {#each f.reqs as r}
          <li class:met={r.met}>
            <span class="mark">{r.met ? '✓' : '○'}</span>
            <span class="rl">{r.label}</span>
            <span class="rd">
              {#if r.have !== undefined && r.need !== undefined}
                {fmt(r.have)} / {fmt(r.need)}
              {:else}
                {r.note}
              {/if}
            </span>
          </li>
        {/each}
      </ul>
      {#if f.canFound}
        <div class="io ready">All requirements met — begin “Found the Academy” below.</div>
      {/if}
    {/if}
  </div>

  {#if active.length > 0}
    <h2 class="mt">
      Building — slots {$game.slots.used} / {$game.slots.total}
      <span class="tag" style="font-weight:400">(click to stop)</span>
    </h2>
    <div class="tgrid">
      {#each active as t (t.id)}
        <div
          class="tcard active"
          class:paused={t.paused}
          role="button"
          tabindex="0"
          title="Click to stop"
          style="border-left-color:var(--{t.cls})"
          on:click={() => dispatchTask(t)}
          on:keydown={(e) => onKey(e, t)}
        >
          <div class="tt"><span class="nm">{t.name}</span><span class="chip">{t.kind}</span></div>
          {#if t.timed}
            <div class="mtr"><i style="width:{Math.round(t.progress * 100)}%;background:var(--{t.cls})"></i></div>
          {/if}
          <div class="io tag">{t.tag}</div>
          <div class="io">{t.io}</div>
          <div class="io payoff">{t.payoff}</div>
        </div>
      {/each}
    </div>
  {/if}

  <h2 class="mt">Fixtures <span class="tag" style="font-weight:400">· click a card to build / upgrade</span></h2>
  <div class="tgrid">
    {#each fixtures as t (t.id)}
      <div
        class="tcard"
        class:locked={t.locked}
        class:cant={!t.locked && !t.startable}
        role="button"
        tabindex={t.locked ? -1 : 0}
        aria-disabled={t.locked}
        title={t.locked ? 'Requirements unmet' : 'Click to build'}
        style="border-left-color:var(--{t.cls})"
        on:click={() => dispatchTask(t)}
        on:keydown={(e) => onKey(e, t)}
      >
        <div class="tt">
          <span class="nm">{#if t.locked}🔒 {/if}{t.name}</span><span class="chip">{t.kind}</span>
        </div>
        <div class="io tag">{t.tag}</div>
        {#if t.locked}
          <div class="io lockt">{t.lockText ?? ''}</div>
        {:else}
          <div class="io">{t.io}{#if t.capMark}<span class="cap" title={t.capNote}>{t.capMark}</span>{/if}</div>
          <div class="io payoff" class:cantpay={!t.affordable}>
            {t.payoff}{#if !t.affordable} · can't afford{/if}
          </div>
          {#if t.slotNote}<div class="io warn">{t.slotNote}</div>{/if}
        {/if}
      </div>
    {/each}
  </div>

  <h2 class="mt">The Founding <span class="tag" style="font-weight:400">· acquire a Charter &amp; Site, then found</span></h2>
  <div class="tgrid">
    {#each founding as t (t.id)}
      <div
        class="tcard"
        class:locked={t.locked}
        class:cant={!t.locked && !t.startable}
        role="button"
        tabindex={t.locked ? -1 : 0}
        aria-disabled={t.locked}
        title={t.locked ? 'Requirements unmet' : 'Click to begin'}
        style="border-left-color:var(--{t.cls})"
        on:click={() => dispatchTask(t)}
        on:keydown={(e) => onKey(e, t)}
      >
        <div class="tt">
          <span class="nm">{#if t.locked}🔒 {/if}{t.name}</span><span class="chip">{t.kind}</span>
        </div>
        <div class="io tag">{t.tag}</div>
        {#if t.locked}
          <div class="io lockt">{t.lockText ?? ''}</div>
        {:else}
          <div class="io">{t.io}</div>
          <div class="io payoff" class:cantpay={!t.affordable}>
            {t.payoff}{#if !t.affordable} · can't afford{/if}
          </div>
          {#if t.slotNote}<div class="io warn">{t.slotNote}</div>{/if}
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .found {
    border-left: 3px solid var(--renown);
  }
  .found.done {
    border-left-color: var(--ok);
  }
  .found .big {
    color: var(--renown);
    margin-top: 4px;
  }
  .found .ready {
    color: var(--ok);
    margin-top: 6px;
  }
  ul.reqs {
    list-style: none;
    padding: 0;
    margin: 6px 0 0;
  }
  ul.reqs li {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 12.5px;
    padding: 1px 0;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
  }
  ul.reqs li.met {
    color: var(--ink);
  }
  ul.reqs .mark {
    color: var(--faint);
    width: 1em;
  }
  ul.reqs li.met .mark {
    color: var(--ok);
  }
  ul.reqs .rl {
    flex: 1;
  }
  ul.reqs .rd {
    color: var(--label);
  }
  .payoff {
    color: var(--ok);
    font-size: 11px;
  }
  .payoff.cantpay {
    color: var(--faint);
  }
  .warn {
    color: var(--life);
    font-size: 11px;
  }
  .cap {
    color: var(--gold);
    font-weight: 700;
    cursor: help;
  }
  .tcard.cant {
    opacity: 0.85;
  }
</style>
