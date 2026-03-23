<script lang="ts">
  import { onMount } from "svelte";
  import { EditorView, keymap } from "@codemirror/view";
  import { EditorState, Prec } from "@codemirror/state";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import {
    search,
    SearchQuery,
    setSearchQuery,
    findNext as cmFindNext,
    findPrevious as cmFindPrevious,
    SearchCursor,
  } from "@codemirror/search";
  import { createMarkoraTheme } from "../services/editor-theme.js";

  let {
    content,
    initialPos = -1,
    onContentChange,
    searchQuery = "",
    onSearchResults,
  }: {
    content: string;
    initialPos?: number;
    onContentChange: (content: string) => void;
    searchQuery?: string;
    onSearchResults?: (count: number, current: number) => void;
  } = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined;
  let viewReady = $state(false);

  function getMatchInfo() {
    if (!view || !searchQuery) {
      onSearchResults?.(0, 0);
      return;
    }

    const doc = view.state.doc;
    const cursor = new SearchCursor(
      doc,
      searchQuery,
      0,
      doc.length,
      (s) => s.toLowerCase(),
    );
    let count = 0;
    let current = 0;
    const selFrom = view.state.selection.main.from;
    let foundCurrent = false;

    let result = cursor.next();
    while (!result.done) {
      count++;
      if (!foundCurrent && cursor.value.from >= selFrom) {
        current = count;
        foundCurrent = true;
      }
      result = cursor.next();
    }

    if (!foundCurrent && count > 0) current = 1;
    onSearchResults?.(count, current);
  }

  function applySearchQuery(q: string) {
    if (!view) return;
    if (q) {
      const sq = new SearchQuery({ search: q, caseSensitive: false });
      view.dispatch({ effects: setSearchQuery.of(sq) });
      requestAnimationFrame(() => getMatchInfo());
    } else {
      const sq = new SearchQuery({ search: "", caseSensitive: false });
      view.dispatch({ effects: setSearchQuery.of(sq) });
      onSearchResults?.(0, 0);
    }
  }

  onMount(() => {
    const state = EditorState.create({
      doc: content,
      extensions: [
        EditorView.lineWrapping,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        // Override Mod-f to prevent CM's built-in search panel
        Prec.highest(
          keymap.of([
            {
              key: "Mod-f",
              run: () => true, // swallow the event; App.svelte handles search
            },
          ]),
        ),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        search({ top: true }), // provides match highlighting decorations
        ...createMarkoraTheme(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onContentChange(update.state.doc.toString());
          }
          // Update match info when selection changes (e.g., after findNext)
          if (update.selectionSet && searchQuery) {
            requestAnimationFrame(() => getMatchInfo());
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: container,
    });

    // Scroll to the target position if specified
    if (initialPos >= 0) {
      const pos = Math.min(initialPos, view.state.doc.length);
      view.dispatch({
        selection: { anchor: pos },
        scrollIntoView: true,
      });
    }

    view.focus();
    viewReady = true;

    // Apply initial search query if one exists
    if (searchQuery) {
      applySearchQuery(searchQuery);
    }

    return () => {
      view?.destroy();
      view = undefined;
      viewReady = false;
    };
  });

  // React to searchQuery changes after mount
  $effect(() => {
    const q = searchQuery;
    if (viewReady) {
      applySearchQuery(q);
    }
  });

  // Update content when it changes externally (e.g., file reload)
  $effect(() => {
    if (view && content !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    }
  });

  // Exported methods for App.svelte to call via bind:this
  export function searchNext() {
    if (view) {
      cmFindNext(view);
      requestAnimationFrame(() => getMatchInfo());
    }
  }

  export function searchPrev() {
    if (view) {
      cmFindPrevious(view);
      requestAnimationFrame(() => getMatchInfo());
    }
  }

  export function clearSearch() {
    if (view) {
      const sq = new SearchQuery({ search: "", caseSensitive: false });
      view.dispatch({ effects: setSearchQuery.of(sq) });
    }
    onSearchResults?.(0, 0);
  }
</script>

<div class="editor" bind:this={container}></div>

<style>
  .editor {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .editor :global(.cm-editor) {
    flex: 1;
    outline: none;
  }

  .editor :global(.cm-scroller) {
    scrollbar-width: thin;
    scrollbar-color: var(--color-scrollbar) transparent;
  }

  .editor :global(.cm-scroller::-webkit-scrollbar) {
    width: 8px;
  }

  .editor :global(.cm-scroller::-webkit-scrollbar-track) {
    background: transparent;
  }

  .editor :global(.cm-scroller::-webkit-scrollbar-thumb) {
    background-color: var(--color-scrollbar);
    border-radius: 4px;
  }

  .editor :global(.cm-scroller::-webkit-scrollbar-thumb:hover) {
    background-color: var(--color-scrollbar-hover);
  }

  /* Hide CM's built-in search panel if it ever appears */
  .editor :global(.cm-panels) {
    display: none !important;
  }

  /* Search match styles */
  .editor :global(.cm-searchMatch) {
    background-color: rgba(255, 215, 0, 0.35);
    outline: 1px solid rgba(255, 190, 0, 0.5);
    border-radius: 2px;
  }

  .editor :global(.cm-searchMatch-selected) {
    background-color: rgba(255, 140, 0, 0.5);
    outline: 2px solid rgba(255, 140, 0, 0.8);
  }
</style>
