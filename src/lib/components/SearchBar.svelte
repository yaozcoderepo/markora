<script lang="ts">
  import { onMount, tick } from "svelte";

  let {
    matchCount = 0,
    currentMatch = 0,
    onQueryChange,
    onNext,
    onPrev,
    onClose,
  }: {
    matchCount: number;
    currentMatch: number;
    onQueryChange: (query: string) => void;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
  } = $props();

  let query = $state("");
  let inputEl: HTMLInputElement;

  onMount(async () => {
    await tick();
    inputEl?.focus();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="search-bar" onkeydown={handleKeydown} role="search">
  <div class="search-input-wrap">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"
      />
    </svg>
    <input
      bind:this={inputEl}
      type="text"
      class="search-input"
      placeholder="Search..."
      value={query}
      oninput={(e) => {
        query = e.currentTarget.value;
        onQueryChange(query);
      }}
    />
    {#if query}
      <span class="match-info">
        {matchCount > 0 ? `${currentMatch} of ${matchCount}` : "No results"}
      </span>
    {/if}
  </div>
  <button
    class="search-btn"
    onclick={onPrev}
    title="Previous (Shift+Enter)"
    disabled={matchCount === 0}
  >
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M3.22 9.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L8 6.06 4.28 9.78a.75.75 0 01-1.06 0z"
      />
    </svg>
  </button>
  <button
    class="search-btn"
    onclick={onNext}
    title="Next (Enter)"
    disabled={matchCount === 0}
  >
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z"
      />
    </svg>
  </button>
  <button class="search-btn close-btn" onclick={onClose} title="Close (Escape)">
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"
      />
    </svg>
  </button>
</div>

<style>
  .search-bar {
    position: absolute;
    top: 0;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    background: var(--color-toolbar-bg);
    border: 1px solid var(--color-border);
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    z-index: 100;
  }

  .search-input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 0 8px;
  }

  .search-input-wrap:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.15);
  }

  .search-icon {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .search-input {
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.85rem;
    padding: 5px 0;
    width: 200px;
    font-family: inherit;
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .match-info {
    font-size: 0.72rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
  }

  .search-btn:hover:not(:disabled) {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .search-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .close-btn {
    margin-left: 2px;
  }
</style>
