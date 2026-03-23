<script lang="ts">
  import type { Tab } from "../stores/document.svelte.js";

  let {
    tabs,
    activeId,
    onSwitch,
    onClose,
  }: {
    tabs: Tab[];
    activeId: string | null;
    onSwitch: (id: string) => void;
    onClose: (id: string) => void;
  } = $props();

  function handleMiddleClick(e: MouseEvent, id: string) {
    if (e.button === 1) {
      e.preventDefault();
      onClose(id);
    }
  }
</script>

{#if tabs.length > 0}
  <div class="tab-bar">
    {#each tabs as tab (tab.id)}
      <div
        class="tab"
        class:active={tab.id === activeId}
        role="tab"
        tabindex="0"
        onclick={() => onSwitch(tab.id)}
        onauxclick={(e) => handleMiddleClick(e, tab.id)}
        onkeydown={(e) => { if (e.key === 'Enter') onSwitch(tab.id); }}
        title={tab.path}
      >
        <span class="tab-name">{tab.fileName}</span>
        <span
          class="tab-close"
          role="button"
          tabindex="-1"
          onclick={(e) => { e.stopPropagation(); onClose(tab.id); }}
          onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClose(tab.id); } }}
          title="Close tab"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path
              d="M1.5 1.5l7 7M8.5 1.5l-7 7"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
        </span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .tab-bar {
    display: flex;
    align-items: stretch;
    height: 34px;
    background: var(--color-toolbar-bg);
    border-bottom: 1px solid var(--color-border);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .tab-bar::-webkit-scrollbar {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border: none;
    border-right: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.78rem;
    cursor: pointer;
    white-space: nowrap;
    min-width: 0;
    max-width: 180px;
    flex-shrink: 0;
  }

  .tab:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .tab.active {
    background: var(--color-bg);
    color: var(--color-text);
    font-weight: 500;
  }

  .tab-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    opacity: 0;
    flex-shrink: 0;
  }

  .tab:hover .tab-close,
  .tab.active .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }
</style>
