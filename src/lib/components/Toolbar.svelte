<script lang="ts">
  import type { TabMode } from "../stores/document.svelte.js";
  import {
    getSettings,
    setTheme,
    toggleOutline,
    type Theme,
  } from "../stores/settings.svelte.js";

  let {
    fileName,
    mode,
    isDirty,
    hasFile,
    onOpenFile,
    onToggleMode,
    onSave,
    onNewFile,
  }: {
    fileName: string | null;
    mode: TabMode;
    isDirty: boolean;
    hasFile: boolean;
    onOpenFile: () => void;
    onToggleMode: () => void;
    onSave: () => void;
    onNewFile: () => void;
  } = $props();

  const settings = getSettings();

  const themes: { value: Theme; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "sepia", label: "Sepia" },
  ];

  function cycleTheme() {
    const idx = themes.findIndex((t) => t.value === settings.theme);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.value);
  }
</script>

<header class="toolbar">
  <div class="toolbar-left">
    <button class="toolbar-btn" onclick={toggleOutline} title="Toggle outline">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="2" width="14" height="1.5" rx="0.5" />
        <rect x="1" y="7" width="14" height="1.5" rx="0.5" />
        <rect x="1" y="12" width="14" height="1.5" rx="0.5" />
      </svg>
    </button>
    <span class="file-name">
      {fileName ?? "Markora"}{isDirty ? " \u2022" : ""}
    </span>
  </div>

  <div class="toolbar-right">
    {#if hasFile}
      <!-- Edit/Preview toggle -->
      <button
        class="toolbar-btn"
        onclick={onToggleMode}
        title={mode === "edit" ? "Preview (Cmd+E)" : "Edit (Cmd+E)"}
      >
        {#if mode === "edit"}
          <!-- Eye icon — switch to preview -->
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3.5C4.136 3.5 1.073 6.206.29 7.702a.61.61 0 000 .596C1.073 9.794 4.136 12.5 8 12.5s6.927-2.706 7.71-4.202a.61.61 0 000-.596C14.927 6.206 11.864 3.5 8 3.5zM8 11a3 3 0 110-6 3 3 0 010 6z" />
            <circle cx="8" cy="8" r="1.5" />
          </svg>
        {:else}
          <!-- Pencil icon — switch to edit -->
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.463 11.1a.25.25 0 00-.064.108l-.631 2.208 2.208-.63a.25.25 0 00.108-.064l8.609-8.61a.25.25 0 000-.353l-1.086-1.086z" />
          </svg>
        {/if}
      </button>

      <!-- Save button -->
      {#if isDirty}
        <button class="toolbar-btn" onclick={onSave} title="Save (Cmd+S)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.5 1H2.5A1.5 1.5 0 001 2.5v11A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5V4.5L11.5 1zM8 13a2 2 0 110-4 2 2 0 010 4zM11 5H3V2h8v3z" />
          </svg>
        </button>
      {/if}
    {/if}

    <button class="toolbar-btn" onclick={onNewFile} title="New file (Cmd+N)">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z" />
      </svg>
    </button>
    <button class="toolbar-btn" onclick={onOpenFile} title="Open file (Cmd+O)">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9zM2.5 3a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5H9.62a2.5 2.5 0 01-1.768-.732L6.732 3.146A.5.5 0 006.379 3H2.5z"
        />
      </svg>
    </button>
    <button
      class="toolbar-btn theme-btn"
      onclick={cycleTheme}
      title="Theme: {settings.theme}"
    >
      {#if settings.theme === "dark"}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278z"
          />
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M8 12a4 4 0 100-8 4 4 0 000 8zM8 0a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 0zm0 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 13zm8-5a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zM3 8a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2A.5.5 0 013 8zm10.657-5.657a.5.5 0 010 .707l-1.414 1.415a.5.5 0 11-.707-.708l1.414-1.414a.5.5 0 01.707 0zM4.464 11.536a.5.5 0 010 .707l-1.414 1.414a.5.5 0 01-.707-.707l1.414-1.414a.5.5 0 01.707 0zm9.193 2.121a.5.5 0 01-.707 0l-1.414-1.414a.5.5 0 01.707-.707l1.414 1.414a.5.5 0 010 .707zM4.464 4.465a.5.5 0 01-.707 0L2.343 3.05a.5.5 0 01.707-.707l1.414 1.414a.5.5 0 010 .708z"
          />
        </svg>
      {/if}
    </button>
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 12px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-toolbar-bg);
    -webkit-app-region: drag;
    user-select: none;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    -webkit-app-region: no-drag;
  }

  .file-name {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--color-text);
    -webkit-app-region: drag;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .toolbar-btn:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }
</style>
