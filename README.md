# Markora

A fast, native markdown viewer and editor for macOS, built with [Tauri v2](https://v2.tauri.app/) and [Svelte 5](https://svelte.dev/). Designed as a free, open-source alternative to Typora.

## Features

### Viewing

- **Rich markdown rendering** — headings, tables, task lists, footnotes, strikethrough, and all standard GFM extensions, powered by [comrak](https://github.com/kivikakk/comrak)
- **Syntax-highlighted code blocks** — 100+ languages via [Shiki](https://shiki.matsu.io/)
- **Table of contents** — auto-generated sidebar outline with click-to-scroll and scroll-tracking
- **Live reload** — file changes from external editors are detected and reflected instantly

### Editing

- **Inline editing** — double-click anywhere in preview mode to jump directly into the editor at that exact position
- **CodeMirror 6 editor** — markdown syntax highlighting, line wrapping, full undo/redo history
- **Save** — `Cmd+S` saves to disk; new files prompt a save dialog

### Navigation

- **Tabs** — open multiple files in tabs within a single window; middle-click to close
- **Search** — `Cmd+F` opens a unified search bar that works in both read and write modes, with match highlighting and prev/next navigation
- **Drag and drop** — drop `.md` files from Finder to open them

### Appearance

- **Three themes** — Light, Dark, and Sepia, toggled from the toolbar
- **Native feel** — draggable title bar, native file dialogs, macOS-appropriate styling

### Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd+O` | Open file |
| `Cmd+N` | New file |
| `Cmd+S` | Save |
| `Cmd+E` | Toggle edit / preview mode |
| `Cmd+F` | Search |
| `Escape` | Close search |

## Architecture

```
markora/
├── src/                          # Frontend (Svelte 5 + TypeScript)
│   ├── App.svelte                # Main application shell
│   ├── lib/
│   │   ├── components/           # UI components
│   │   │   ├── MarkdownViewer    # Rendered HTML preview with search highlighting
│   │   │   ├── MarkdownEditor    # CodeMirror 6 editor with markdown support
│   │   │   ├── Outline           # Table of contents sidebar
│   │   │   ├── TabBar            # Multi-tab management
│   │   │   ├── Toolbar           # Top toolbar with actions and theme toggle
│   │   │   ├── SearchBar         # Unified search for read and write modes
│   │   │   └── DropZone          # Drag-and-drop overlay
│   │   ├── services/             # Tauri IPC commands, syntax highlighting, editor theme
│   │   ├── stores/               # Reactive state (document tabs, settings)
│   │   ├── styles/               # Global CSS and theme variables
│   │   └── types/                # TypeScript type definitions
│   └── main.ts                   # Entry point
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── commands/             # Tauri IPC command handlers (file I/O, markdown parsing)
│   │   ├── markdown/             # Comrak-based markdown parser with heading extraction
│   │   ├── watcher.rs            # File system watcher (notify crate)
│   │   ├── lib.rs                # Tauri app builder and plugin registration
│   │   └── main.rs               # Binary entry point
│   ├── Cargo.toml
│   └── tauri.conf.json           # Tauri configuration (window, bundle, permissions)
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Why Tauri?** The markdown parsing runs in Rust (comrak) for speed, while the UI is built with web technologies for rapid iteration. The resulting app is a ~15 MB native binary with no Electron overhead.

## Prerequisites

- **macOS** on Apple Silicon (aarch64) — Intel Macs should also work but are untested
- **Rust** — install via [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** >= 18
- **pnpm** — install via `npm install -g pnpm` or `brew install pnpm`
- **Xcode Command Line Tools** — `xcode-select --install`

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server with hot reload:

```bash
pnpm tauri dev
```

This launches a Tauri window with Vite HMR for the frontend and incremental Rust compilation for the backend. Frontend changes reflect instantly; Rust changes trigger a recompile (~2-5s).

### Running tests

Rust unit tests (markdown parser, etc.):

```bash
cd src-tauri
cargo test
```

### Useful dev commands

```bash
# Frontend only (opens in browser, no Tauri APIs)
pnpm dev

# Type-check the frontend
pnpm exec tsc --noEmit

# Check Rust code without building
cd src-tauri && cargo check
```

## Building for Production

```bash
pnpm tauri build
```

This compiles the frontend (Vite, minified) and the Rust backend (release profile with LTO and stripping), then bundles everything into distributable formats:

| Output | Path |
| --- | --- |
| Binary | `src-tauri/target/release/markora` |
| macOS App | `src-tauri/target/release/bundle/macos/Markora.app` |
| DMG Installer | `src-tauri/target/release/bundle/dmg/Markora_0.1.0_aarch64.dmg` |

To test the production build locally:

```bash
# Run the .app directly
open src-tauri/target/release/bundle/macos/Markora.app

# Or run the binary
./src-tauri/target/release/markora
```

## License

MIT
