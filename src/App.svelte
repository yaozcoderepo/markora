<script lang="ts">
  import { onMount } from "svelte";
  import { open, save } from "@tauri-apps/plugin-dialog";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import MarkdownViewer from "./lib/components/MarkdownViewer.svelte";
  import MarkdownEditor from "./lib/components/MarkdownEditor.svelte";
  import Outline from "./lib/components/Outline.svelte";
  import Toolbar from "./lib/components/Toolbar.svelte";
  import TabBar from "./lib/components/TabBar.svelte";
  import DropZone from "./lib/components/DropZone.svelte";
  import SearchBar from "./lib/components/SearchBar.svelte";
  import {
    getTabs,
    addTab,
    addNewTab,
    closeTab,
    switchTab,
    updateTabContent,
    updateRawContent,
    setTabMode,
    markSaved,
    setLoading,
    setError,
  } from "./lib/stores/document.svelte.js";
  import { getSettings, initTheme } from "./lib/stores/settings.svelte.js";
  import { isModKey, modKey } from "./lib/utils/platform.js";
  import {
    openFile,
    parseMarkdown,
    saveFile,
    watchFile,
  } from "./lib/services/tauri-commands.js";

  const doc = getTabs();
  const settings = getSettings();

  import type { EditAtInfo } from "./lib/components/MarkdownViewer.svelte";

  let isDragging = $state(false);
  let parseTimeout: ReturnType<typeof setTimeout> | undefined;
  let editAtPos = $state(-1);

  // Search state
  let searchOpen = $state(false);
  let searchQuery = $state("");
  let matchCount = $state(0);
  let currentMatch = $state(0);
  let viewerRef = $state<MarkdownViewer>();
  let editorRef = $state<MarkdownEditor>();
  let viewerScrollContainer = $state<HTMLElement | null>(null);

  async function loadFile(path: string) {
    setLoading(true);
    try {
      const content = await openFile(path);
      const parsed = await parseMarkdown(content);
      addTab(path, content, parsed.html, parsed.headings);
      await watchFile(path);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  async function handleOpenFile() {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd"] }],
    });
    if (selected) {
      await loadFile(selected);
    }
  }

  function handleSwitchTab(id: string) {
    switchTab(id);
  }

  function handleCloseTab(id: string) {
    const tab = doc.list.find((t) => t.id === id);
    if (tab?.isDirty) {
      // Simple confirm for dirty tabs
      if (!confirm(`"${tab.fileName}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }
    closeTab(id);
  }

  function handleContentChange(content: string) {
    const active = doc.active;
    if (!active) return;
    updateRawContent(active.id, content);

    // Debounce markdown parsing for preview
    clearTimeout(parseTimeout);
    parseTimeout = setTimeout(async () => {
      try {
        const parsed = await parseMarkdown(content);
        const tab = doc.active;
        if (tab && tab.rawContent === content) {
          tab.html = parsed.html;
          tab.headings = parsed.headings;
        }
      } catch (_) {
        // Parse errors during typing are expected
      }
    }, 300);
  }

  function handleToggleMode() {
    const active = doc.active;
    if (!active) return;
    const newMode = active.mode === "edit" ? "preview" : "edit";
    if (newMode === "edit") {
      editAtPos = -1;
    }
    setTabMode(active.id, newMode);
  }

  function handleEditAt(info: EditAtInfo) {
    const active = doc.active;
    if (!active) return;

    // Compute exact character position in the raw markdown
    const lines = active.rawContent.split("\n");
    // Get the absolute offset of startLine
    let blockStart = 0;
    for (let i = 0; i < info.startLine - 1 && i < lines.length; i++) {
      blockStart += lines[i].length + 1; // +1 for newline
    }
    // Get the block text (startLine to endLine inclusive)
    const endIdx = Math.min(info.endLine, lines.length);
    const blockLines = lines.slice(info.startLine - 1, endIdx);
    const blockText = blockLines.join("\n");
    // Apply fraction to get offset within block
    const offsetInBlock = Math.round(info.fraction * blockText.length);
    editAtPos = blockStart + Math.min(offsetInBlock, blockText.length);

    setTabMode(active.id, "edit");
  }

  async function handleSave() {
    const active = doc.active;
    if (!active) return;

    let path = active.path;
    if (!path) {
      // New file — show save dialog
      const selected = await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (!selected) return;
      path = selected;
    }

    try {
      await saveFile(path, active.rawContent);
      markSaved(active.id, path);
      // Re-parse to keep preview in sync
      const parsed = await parseMarkdown(active.rawContent);
      active.html = parsed.html;
      active.headings = parsed.headings;
      // Start watching the file if it's newly saved
      if (!active.path || active.path !== path) {
        await watchFile(path);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function handleNewFile() {
    addNewTab();
  }

  function handleToggleSearch() {
    if (searchOpen) {
      handleCloseSearch();
    } else {
      searchOpen = true;
    }
  }

  function handleCloseSearch() {
    searchOpen = false;
    searchQuery = "";
    matchCount = 0;
    currentMatch = 0;
    if (doc.mode === "edit") editorRef?.clearSearch();
    else viewerRef?.clearSearch();
  }

  function handleSearchQuery(query: string) {
    searchQuery = query;
  }

  function handleSearchResults(count: number, current: number) {
    matchCount = count;
    currentMatch = current;
  }

  function handleSearchNext() {
    if (doc.mode === "edit") editorRef?.searchNext();
    else viewerRef?.searchNext();
  }

  function handleSearchPrev() {
    if (doc.mode === "edit") editorRef?.searchPrev();
    else viewerRef?.searchPrev();
  }

  onMount(() => {
    initTheme();

    const handleKeydown = (e: KeyboardEvent) => {
      if (isModKey(e) && e.key === "o") {
        e.preventDefault();
        handleOpenFile();
      } else if (isModKey(e) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (isModKey(e) && e.key === "e") {
        e.preventDefault();
        handleToggleMode();
      } else if (isModKey(e) && e.key === "n") {
        e.preventDefault();
        handleNewFile();
      } else if (isModKey(e) && e.key === "f") {
        e.preventDefault();
        if (!searchOpen && doc.active) {
          searchOpen = true;
        }
      } else if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        handleCloseSearch();
      }
    };
    window.addEventListener("keydown", handleKeydown);

    // Prevent default HTML5 drag behavior
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    // Tauri native drag and drop
    const webview = getCurrentWebviewWindow();
    const unlistenDragDrop = webview.onDragDropEvent((event) => {
      if (event.payload.type === "enter") {
        isDragging = true;
      } else if (event.payload.type === "drop") {
        isDragging = false;
        const paths = event.payload.paths;
        const mdFile = paths.find((p: string) =>
          /\.(md|markdown|mdown|mkd)$/i.test(p),
        );
        if (mdFile) {
          loadFile(mdFile);
        }
      } else if (event.payload.type === "leave") {
        isDragging = false;
      }
    });

    // File change watcher
    const unlistenFileChanged = webview.listen<string>(
      "file-changed",
      async (event) => {
        const path = event.payload;
        try {
          const content = await openFile(path);
          const parsed = await parseMarkdown(content);
          updateTabContent(path, content, parsed.html, parsed.headings);
        } catch (e) {
          console.error("Failed to reload file:", e);
        }
      },
    );

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
      unlistenDragDrop.then((fn) => fn());
      unlistenFileChanged.then((fn) => fn());
      clearTimeout(parseTimeout);
    };
  });
</script>

<div class="app">
  <Toolbar
    fileName={doc.fileName}
    mode={doc.mode}
    isDirty={doc.isDirty}
    hasFile={!doc.isEmpty}
    onOpenFile={handleOpenFile}
    onToggleMode={handleToggleMode}
    onSave={handleSave}
    onNewFile={handleNewFile}
    onToggleSearch={handleToggleSearch}
  />
  <TabBar
    tabs={doc.list}
    activeId={doc.activeId}
    onSwitch={handleSwitchTab}
    onClose={handleCloseTab}
  />

  <div class="main">
    {#if searchOpen && doc.active}
      <SearchBar
        {matchCount}
        {currentMatch}
        onQueryChange={handleSearchQuery}
        onNext={handleSearchNext}
        onPrev={handleSearchPrev}
        onClose={handleCloseSearch}
      />
    {/if}

    {#if settings.outlineVisible && doc.headings.length > 0 && doc.mode !== "edit"}
      <Outline headings={doc.headings} scrollContainer={viewerScrollContainer} />
    {/if}

    {#if doc.isLoading}
      <div class="status">Loading...</div>
    {:else if doc.error}
      <div class="status error">{doc.error}</div>
    {:else if doc.active}
      {#if doc.mode === "edit"}
        {#key doc.activeId}
          <MarkdownEditor
            bind:this={editorRef}
            content={doc.rawContent}
            initialPos={editAtPos}
            onContentChange={handleContentChange}
            searchQuery={searchOpen ? searchQuery : ""}
            onSearchResults={handleSearchResults}
          />
        {/key}
      {:else}
        <MarkdownViewer
          bind:this={viewerRef}
          html={doc.html}
          onEditAt={handleEditAt}
          searchQuery={searchOpen ? searchQuery : ""}
          onSearchResults={handleSearchResults}
          onScrollContainerReady={(el) => (viewerScrollContainer = el)}
        />
      {/if}
    {:else}
      <div class="empty-state">
        <div class="empty-content">
          <h1 class="app-name">Markora</h1>
          <p class="app-tagline">A beautiful markdown viewer & editor</p>
          <div class="empty-actions">
            <button class="open-btn" onclick={handleOpenFile}>
              Open File
            </button>
            <button class="new-btn" onclick={handleNewFile}>
              New File
            </button>
            <p class="shortcut-hint">
              <kbd>{modKey}</kbd>+<kbd>O</kbd> open &middot;
              <kbd>{modKey}</kbd>+<kbd>N</kbd> new &middot;
              <kbd>{modKey}</kbd>+<kbd>E</kbd> edit
            </p>
            <p class="drag-hint">You can also drag & drop a .md file</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <DropZone visible={isDragging} />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
  }

  .main {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .status {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .status.error {
    color: #e53e3e;
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-content {
    text-align: center;
  }

  .app-name {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text);
    letter-spacing: -0.02em;
  }

  .app-tagline {
    font-size: 1rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0 2rem;
  }

  .empty-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .open-btn,
  .new-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }

  .open-btn {
    background: var(--color-accent);
    color: white;
  }

  .new-btn {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .open-btn:hover,
  .new-btn:hover {
    opacity: 0.9;
  }

  .shortcut-hint {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .drag-hint {
    font-size: 0.78rem;
    color: var(--color-text-muted);
    margin: 0;
    opacity: 0.7;
  }

  kbd {
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    background: var(--color-toolbar-bg);
    font-size: 0.75rem;
    font-family: inherit;
  }
</style>
