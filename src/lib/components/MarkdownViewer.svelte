<script lang="ts">
  import { highlightCodeBlocks } from "../services/highlighter.js";
  import { getSettings } from "../stores/settings.svelte.js";
  import { tick } from "svelte";

  let { html }: { html: string } = $props();

  const settings = getSettings();
  let container: HTMLElement;

  async function highlight() {
    await tick();
    if (container && html) {
      const shikiTheme =
        settings.theme === "dark" ? "github-dark" : "github-light";
      highlightCodeBlocks(container, shikiTheme);
    }
  }

  $effect(() => {
    if (html) {
      highlight();
    }
  });
</script>

<div class="viewer" bind:this={container}>
  {#if html}
    <article class="markdown-body">
      {@html html}
    </article>
  {/if}
</div>

<style>
  .viewer {
    flex: 1;
    overflow-y: auto;
    padding: 2rem 3rem;
  }

  .markdown-body {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
