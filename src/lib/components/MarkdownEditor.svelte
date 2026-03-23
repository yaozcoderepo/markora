<script lang="ts">
  import { onMount } from "svelte";
  import { EditorView, keymap } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { createMarkoraTheme } from "../services/editor-theme.js";

  let {
    content,
    onContentChange,
  }: {
    content: string;
    onContentChange: (content: string) => void;
  } = $props();

  let container: HTMLDivElement;
  let view: EditorView;

  onMount(() => {
    const state = EditorState.create({
      doc: content,
      extensions: [
        EditorView.lineWrapping,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        ...createMarkoraTheme(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onContentChange(update.state.doc.toString());
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: container,
    });

    view.focus();

    return () => {
      view.destroy();
    };
  });

  // Update content when it changes externally (e.g., file reload)
  $effect(() => {
    if (view && content !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    }
  });
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
</style>
