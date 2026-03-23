<script lang="ts">
  import type { Heading } from "../types/index.js";

  let { headings }: { headings: Heading[] } = $props();

  let activeId = $state<string | null>(null);

  function scrollToHeading(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      activeId = id;
    }
  }

  $effect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
            break;
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  });
</script>

<nav class="outline">
  <h3 class="outline-title">Contents</h3>
  <ul class="outline-list">
    {#each headings as heading}
      <li
        class="outline-item"
        class:active={activeId === heading.id}
        style="padding-left: {(heading.level - 1) * 12}px"
      >
        <button onclick={() => scrollToHeading(heading.id)}>
          {heading.text}
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .outline {
    width: 250px;
    min-width: 200px;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    padding: 1rem;
    background: var(--color-sidebar-bg);
  }

  .outline-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin: 0 0 0.75rem;
    padding: 0 0.5rem;
  }

  .outline-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .outline-item button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    font-size: 0.82rem;
    color: var(--color-text-secondary);
    cursor: pointer;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .outline-item button:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .outline-item.active button {
    color: var(--color-accent);
    font-weight: 500;
  }
</style>
