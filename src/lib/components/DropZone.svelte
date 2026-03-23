<script lang="ts">
  let { visible }: { visible: boolean } = $props();
</script>

{#if visible}
  <div class="dropzone">
    <div class="dropzone-inner">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <p>Drop markdown file here</p>
    </div>
  </div>
{/if}

<style>
  .dropzone {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dropzone-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 4rem;
    border: 2px dashed var(--color-accent);
    border-radius: 16px;
    background: var(--color-bg);
    color: var(--color-accent);
  }

  .dropzone-inner p {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
  }
</style>
