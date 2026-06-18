# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Markora is a native markdown viewer/editor for macOS and Windows — a free, open-source Typora alternative. Tauri v2 (Rust backend) + Svelte 5 (TypeScript frontend) + Vite. Markdown parsing runs in Rust (comrak); syntax highlighting runs in JS (Shiki).

## Commands

Package manager is **pnpm** (not npm).

```bash
pnpm install                  # install frontend deps
pnpm tauri dev                # run the app with HMR + incremental Rust rebuilds (primary dev loop)
pnpm tauri build              # production bundle (DMG/.app on macOS, MSI/NSIS on Windows)

pnpm dev                      # frontend only in a browser — Tauri invoke() calls FAIL here; viewer/editor won't load files
pnpm exec tsc --noEmit        # type-check the frontend

cd src-tauri && cargo test    # Rust unit tests (markdown parser lives in src-tauri/src/markdown/parser.rs)
cd src-tauri && cargo test test_gfm_table   # run a single test by name
cd src-tauri && cargo check   # fast Rust type-check without building
```

There is no JS test suite and no linter configured — TypeScript's `tsc --noEmit` is the only frontend check.

## Architecture

### The Rust/JS split — who does what

- **Rust parses markdown, JS highlights code.** `parse_markdown` (comrak) returns `{ html, headings }`. The HTML comes back with `language-*` classes on code blocks but *unhighlighted*. Shiki (`src/lib/services/highlighter.ts`) then post-processes the rendered DOM, replacing `<pre>` blocks with highlighted versions and injecting copy buttons. So code highlighting is a frontend DOM mutation, not part of the parse.
- **Rust owns all file I/O.** `open_file` / `save_file` (`src-tauri/src/commands/file.rs`) plus the file watcher. The frontend never touches the filesystem directly; everything goes through `invoke()` wrappers in `src/lib/services/tauri-commands.ts`.

The five IPC commands are registered in `src-tauri/src/lib.rs`: `open_file`, `save_file`, `parse_markdown`, `watch_file`, `unwatch_file`.

### Two non-obvious mechanisms

**1. `data-sourcepos` drives double-click-to-edit.** The parser sets comrak's `sourcepos: true`, so every rendered block carries `data-sourcepos="startLine:col-endLine:col"`. When a user double-clicks the preview, `App.svelte`'s `handleEditAt` reads that attribute plus a click fraction, maps it back to an exact character offset in the raw markdown, and opens the CodeMirror editor positioned there. Changing parser options or stripping these attributes breaks click-to-edit.

**Heading IDs are injected by string-replacing the rendered HTML** (`parser.rs`): after `format_html`, it searches for `<h{level} data-sourcepos=` and inserts `id="{slug}"`. This is fragile string surgery — it depends on `sourcepos` being on and matches only the first occurrence per heading. Outline anchor links depend on these IDs.

**2. The save-guard prevents reload loops.** A shared `Arc<AtomicBool>` is `manage`d in `lib.rs`. `save_file` sets it true before writing; the file watcher (`watcher.rs`) does `swap(false)` and skips emitting `file-changed` if it was set — so the app's own saves don't trigger a self-reload. The watcher watches the *parent directory* (more reliable than watching the file), debounced 300ms, and emits `file-changed` to the frontend, which reloads unless the tab has unsaved edits (`updateTabContent` bails when `isDirty`).

### Frontend state (Svelte 5 runes)

Stores live in `*.svelte.ts` files (`src/lib/stores/`) and use the **module-level `$state` + getter-object pattern**: state is declared at module scope, and `getTabs()` / `getSettings()` return an object of getters so consumers read reactive values without importing the raw `$state`. Mutations go through exported functions (`addTab`, `closeTab`, `updateRawContent`, etc.), not direct assignment.

`document.svelte.ts` is the core: an array of `Tab` objects (each with `path`, `rawContent`, `html`, `headings`, `mode`, `isDirty`, `scrollTop`) plus `activeTabId`. Each tab is independently in `"edit"` or `"preview"` mode. Opening an already-open path switches to its tab rather than duplicating.

`App.svelte` is the orchestrator — it wires keyboard shortcuts, native Tauri drag-drop, the `file-changed` listener, the 300ms debounced re-parse on edit, and search delegation to either `MarkdownViewer` or `MarkdownEditor` depending on mode.

### Cross-platform conventions

- Modifier keys: never hardcode Cmd/Ctrl. Use `isModKey(e)` and `modKey` from `src/lib/utils/platform.ts` (Cmd on macOS, Ctrl elsewhere). Path basenames: use `extractFileName` (handles both `/` and `\`).
- The frontend `dist/` is committed and is what Tauri bundles (`frontendDist: "../dist"` in `tauri.conf.json`).

See `RELEASING.md` for the GitHub release + Homebrew Cask process.
