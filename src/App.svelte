<script lang="ts">
  import { onMount } from "svelte";
  import { open } from "@tauri-apps/plugin-dialog";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import MarkdownViewer from "./lib/components/MarkdownViewer.svelte";
  import Outline from "./lib/components/Outline.svelte";
  import Toolbar from "./lib/components/Toolbar.svelte";
  import TabBar from "./lib/components/TabBar.svelte";
  import DropZone from "./lib/components/DropZone.svelte";
  import {
    getTabs,
    addTab,
    closeTab,
    switchTab,
    updateTabContent,
    setLoading,
    setError,
  } from "./lib/stores/document.svelte.js";
  import { getSettings, initTheme } from "./lib/stores/settings.svelte.js";
  import {
    openFile,
    parseMarkdown,
    watchFile,
  } from "./lib/services/tauri-commands.js";

  const doc = getTabs();
  const settings = getSettings();

  let isDragging = $state(false);

  async function loadFile(path: string) {
    setLoading(true);
    try {
      const content = await openFile(path);
      const parsed = await parseMarkdown(content);
      addTab(path, parsed.html, parsed.headings);
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
    closeTab(id);
  }

  onMount(() => {
    initTheme();

    // Keyboard shortcut: Cmd+O
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "o") {
        e.preventDefault();
        handleOpenFile();
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
        // Reload any open tab with this path
        try {
          const content = await openFile(path);
          const parsed = await parseMarkdown(content);
          updateTabContent(path, parsed.html, parsed.headings);
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
    };
  });
</script>

<div class="app">
  <Toolbar fileName={doc.fileName} onOpenFile={handleOpenFile} />
  <TabBar
    tabs={doc.list}
    activeId={doc.activeId}
    onSwitch={handleSwitchTab}
    onClose={handleCloseTab}
  />

  <div class="main">
    {#if settings.outlineVisible && doc.headings.length > 0}
      <Outline headings={doc.headings} />
    {/if}

    {#if doc.isLoading}
      <div class="status">Loading...</div>
    {:else if doc.error}
      <div class="status error">{doc.error}</div>
    {:else if doc.html}
      <MarkdownViewer html={doc.html} />
    {:else}
      <div class="empty-state">
        <div class="empty-content">
          <h1 class="app-name">Markora</h1>
          <p class="app-tagline">A beautiful markdown viewer</p>
          <div class="empty-actions">
            <button class="open-btn" onclick={handleOpenFile}>
              Open File
            </button>
            <p class="shortcut-hint">or press <kbd>Cmd</kbd> + <kbd>O</kbd></p>
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

  .open-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: var(--color-accent);
    color: white;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }

  .open-btn:hover {
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
