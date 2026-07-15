<script lang="ts">
  import { game, activeTab, dispatchTask, toggleTaskRepeat } from '../stores';
  import type { TaskView } from '../stores';

  // Whole-card click hook (foundation left this for T-004). Defaults to the store dispatcher.
  export let onTask: (t: TaskView) => void = dispatchTask;

  function onKey(e: KeyboardEvent, t: TaskView): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTask(t);
    }
  }

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
        <h2 class="mt">
          Active — slots {$game.slots.used} / {$game.slots.total}
          <span class="tag" style="font-weight:400">(click a card to stop it)</span>
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
              on:click={() => onTask(t)}
              on:keydown={(e) => onKey(e, t)}
            >
              <div class="tt"><span class="nm">{t.name}</span><span class="chip">{t.kind}</span></div>
              {#if t.timed}
                <div class="mtr"><i style="width:{Math.round(t.progress * 100)}%;background:var(--{t.cls})"></i></div>
              {/if}
              <div class="io tag">{t.tag}</div>
              <div class="io">{t.io}</div>
              <div class="io payoff">{t.payoff}</div>
              {#if t.paused && t.pausedReason}
                <div class="io warn">paused — {t.pausedReason}</div>
              {/if}
              {#if t.canRepeat}
                <button
                  class="repeat"
                  class:on={t.repeat}
                  title="Repeat on completion"
                  on:click|stopPropagation={() => toggleTaskRepeat(t.id)}
                  on:keydown={(e) => e.stopPropagation()}
                >↻ {t.repeat ? 'repeat on' : 'repeat off'}</button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <h2 class="mt">
        Available <span class="tag" style="font-weight:400">· click a card to {'start / do it'}</span>
      </h2>
      <div class="tgrid">
        {#each available as t (t.id)}
          <div
            class="tcard"
            class:locked={t.locked}
            class:cant={!t.locked && !t.startable}
            role="button"
            tabindex={t.locked ? -1 : 0}
            aria-disabled={t.locked}
            title={t.locked ? 'Requirements unmet' : t.type === 'instant' ? 'Click to do' : 'Click to start'}
            style="border-left-color:var(--{t.cls})"
            on:click={() => onTask(t)}
            on:keydown={(e) => onKey(e, t)}
          >
            <div class="tt">
              <span class="nm">{#if t.locked}🔒 {/if}{t.name}</span><span class="chip">{t.kind}</span>
            </div>
            <div class="io tag">{t.tag}{#if t.atText} · {t.atText}{/if}</div>
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

<style>
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
  .tcard.cant {
    opacity: 0.85;
  }
  .repeat {
    align-self: flex-start;
    margin-top: 2px;
    font-family: inherit;
    font-size: 10.5px;
    color: var(--dim);
    background: var(--hover);
    border: 1px solid var(--edge);
    border-radius: 10px;
    padding: 1px 8px;
    cursor: pointer;
  }
  .repeat.on {
    color: var(--ink);
    border-color: var(--accent);
  }
  .repeat:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
