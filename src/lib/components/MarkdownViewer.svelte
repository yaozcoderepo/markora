<script lang="ts">
  import { highlightCodeBlocks } from "../services/highlighter.js";
  import { getSettings } from "../stores/settings.svelte.js";
  import { tick } from "svelte";

  export interface EditAtInfo {
    startLine: number;
    endLine: number;
    fraction: number;
  }

  let {
    html,
    onEditAt,
    searchQuery = "",
    onSearchResults,
  }: {
    html: string;
    onEditAt?: (info: EditAtInfo) => void;
    searchQuery?: string;
    onSearchResults?: (count: number, current: number) => void;
  } = $props();

  const settings = getSettings();
  let container: HTMLElement;

  // Search state (plain variables, not reactive — managed internally)
  let marks: HTMLElement[] = [];
  let currentMarkIndex = -1;

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

  // Search: react to query and html changes
  $effect(() => {
    const q = searchQuery;
    const _h = html; // depend on html too so we re-highlight after content changes
    if (q) {
      tick().then(() => highlightMatches(q));
    } else {
      clearHighlights();
      onSearchResults?.(0, 0);
    }
  });

  function clearHighlights() {
    for (const mark of marks) {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
      }
    }
    marks = [];
    currentMarkIndex = -1;
  }

  function highlightMatches(query: string) {
    clearHighlights();
    if (!query || !container) {
      onSearchResults?.(0, 0);
      return;
    }

    const body = container.querySelector(".markdown-body");
    if (!body) {
      onSearchResults?.(0, 0);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    for (const textNode of textNodes) {
      const text = textNode.nodeValue || "";
      const lowerText = text.toLowerCase();

      // Find all match positions in this text node
      const positions: number[] = [];
      let idx = lowerText.indexOf(lowerQuery);
      while (idx !== -1) {
        positions.push(idx);
        idx = lowerText.indexOf(lowerQuery, idx + 1);
      }

      if (positions.length === 0) continue;

      // Process from right to left so earlier positions stay valid
      for (let i = positions.length - 1; i >= 0; i--) {
        const pos = positions[i];
        const range = document.createRange();
        range.setStart(textNode, pos);
        range.setEnd(textNode, pos + query.length);

        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        range.surroundContents(mark);
      }
    }

    // Collect all marks in document order
    marks = Array.from(body.querySelectorAll("mark.search-highlight"));

    if (marks.length > 0) {
      currentMarkIndex = 0;
      marks[0].classList.add("search-highlight-active");
      marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
      onSearchResults?.(marks.length, 1);
    } else {
      onSearchResults?.(0, 0);
    }
  }

  // Exported methods for App.svelte to call via bind:this
  export function searchNext() {
    if (marks.length === 0) return;
    marks[currentMarkIndex].classList.remove("search-highlight-active");
    currentMarkIndex = (currentMarkIndex + 1) % marks.length;
    marks[currentMarkIndex].classList.add("search-highlight-active");
    marks[currentMarkIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    onSearchResults?.(marks.length, currentMarkIndex + 1);
  }

  export function searchPrev() {
    if (marks.length === 0) return;
    marks[currentMarkIndex].classList.remove("search-highlight-active");
    currentMarkIndex = (currentMarkIndex - 1 + marks.length) % marks.length;
    marks[currentMarkIndex].classList.add("search-highlight-active");
    marks[currentMarkIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    onSearchResults?.(marks.length, currentMarkIndex + 1);
  }

  export function clearSearch() {
    clearHighlights();
    onSearchResults?.(0, 0);
  }

  function getTextOffsetInElement(
    el: HTMLElement,
  ): { offset: number; total: number } {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0)
      return { offset: 0, total: el.textContent?.length ?? 0 };

    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.setStart(el, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const offset = preRange.toString().length;
    const total = el.textContent?.length ?? 1;
    return { offset, total: Math.max(total, 1) };
  }

  function parseSourcepos(
    sourcepos: string,
  ): { startLine: number; endLine: number } | null {
    const match = sourcepos.match(/^(\d+):\d+-(\d+):\d+$/);
    if (!match) return null;
    return {
      startLine: parseInt(match[1], 10),
      endLine: parseInt(match[2], 10),
    };
  }

  function handleDblClick(e: MouseEvent) {
    if (!onEditAt) return;

    let el = e.target as HTMLElement | null;
    while (el && el !== container) {
      const sourcepos = el.getAttribute("data-sourcepos");
      if (sourcepos) {
        const parsed = parseSourcepos(sourcepos);
        if (parsed) {
          const { offset, total } = getTextOffsetInElement(el);
          onEditAt({
            startLine: parsed.startLine,
            endLine: parsed.endLine,
            fraction: offset / total,
          });
          return;
        }
      }
      el = el.parentElement;
    }

    onEditAt({ startLine: 1, endLine: 1, fraction: 0 });
  }
</script>

<div
  class="viewer"
  bind:this={container}
  ondblclick={handleDblClick}
  role="presentation"
>
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

  /* Search highlight styles */
  .viewer :global(mark.search-highlight) {
    background-color: rgba(255, 215, 0, 0.4);
    border-radius: 2px;
    padding: 0;
    color: inherit;
  }

  .viewer :global(mark.search-highlight-active) {
    background-color: rgba(255, 140, 0, 0.6);
    outline: 2px solid rgba(255, 140, 0, 0.8);
    border-radius: 2px;
  }
</style>
