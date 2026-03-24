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

## Releasing

### GitHub Releases (recommended)

1. **Tag a version:**

   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

2. **Build the production artifacts:**

   ```bash
   pnpm tauri build
   ```

3. **Create a GitHub release** and attach the DMG:

   ```bash
   gh release create v0.1.0 \
     "src-tauri/target/release/bundle/dmg/Markora_0.1.0_aarch64.dmg" \
     --title "Markora v0.1.0" \
     --notes "Initial release"
   ```

   Users download the `.dmg`, open it, and drag `Markora.app` into `/Applications`.

### Homebrew Cask

Homebrew Cask lets macOS users install Markora with a single command. This requires a **Homebrew tap** — a separate GitHub repository that hosts your cask formula.

#### Step 1: Create a GitHub release

Make sure you've completed the [GitHub Releases](#github-releases-recommended) steps above. You need a public DMG download URL like:

```
https://github.com/yaozcoderepo/markora/releases/download/v0.1.0/Markora_0.1.0_aarch64.dmg
```

#### Step 2: Create a Homebrew tap repository

A tap is a GitHub repo named `homebrew-<name>`. Create one called `homebrew-tap`:

```bash
# Create the repo on GitHub
gh repo create homebrew-tap --public --clone
cd homebrew-tap

# Create the required directory structure
mkdir -p Casks
```

#### Step 3: Generate the DMG checksum

Homebrew verifies downloads by SHA-256 hash:

```bash
shasum -a 256 /path/to/markora/src-tauri/target/release/bundle/dmg/Markora_0.1.0_aarch64.dmg
```

This outputs something like:

```
a1b2c3d4e5f6...  Markora_0.1.0_aarch64.dmg
```

Copy the hash for the next step.

#### Step 4: Write the cask formula

Create `Casks/markora.rb` in your `homebrew-tap` repo:

```ruby
cask "markora" do
  version "0.1.0"
  sha256 "a1b2c3d4e5f6..."  # Replace with actual hash from Step 3

  url "https://github.com/yaozcoderepo/markora/releases/download/v#{version}/Markora_#{version}_aarch64.dmg"
  name "Markora"
  desc "A fast, native markdown viewer and editor"
  homepage "https://github.com/yaozcoderepo/markora"

  depends_on macos: ">= :monterey"

  app "Markora.app"

  uninstall quit: "com.markora.dev"

  zap trash: [
    "~/Library/Preferences/com.markora.dev.plist",
    "~/Library/WebKit/com.markora.dev",
    "~/Library/Caches/com.markora.dev",
    "~/Library/Saved Application State/com.markora.dev.savedState",
  ]
end
```

Key fields explained:

| Field | Purpose |
| --- | --- |
| `version` | Must match the release tag (without the `v` prefix) |
| `sha256` | Integrity check — Homebrew rejects the download if this doesn't match |
| `url` | Download URL; `#{version}` is interpolated from the `version` field |
| `depends_on` | Minimum macOS version required |
| `app` | The `.app` bundle name inside the DMG — Homebrew copies it to `/Applications` |
| `uninstall quit` | Quits the app before uninstalling (uses the bundle identifier from `tauri.conf.json`) |
| `zap trash` | Files to clean up when the user runs `brew zap markora` |

#### Step 5: Publish the tap

```bash
cd homebrew-tap
git add Casks/markora.rb
git commit -m "Add markora cask v0.1.0"
git push origin main
```

#### Step 6: Install

Users can now install Markora with:

```bash
brew tap yaozcoderepo/tap
brew install --cask markora
```

This downloads the DMG, verifies the checksum, extracts `Markora.app`, and copies it to `/Applications`.

Other commands that work after installation:

```bash
brew upgrade --cask markora    # Upgrade to a newer version
brew uninstall --cask markora  # Remove the app from /Applications
brew zap markora               # Remove app + all associated data
```

#### Updating the cask for a new release

See the [Releasing a New Version](#releasing-a-new-version) section below — step 5 covers updating the cask.

### Releasing a New Version

This is the complete end-to-end workflow for releasing a new version. The example below releases `0.2.0` — replace with your actual version number.

#### Step 1: Bump the version

Update the version in all three files:

```bash
# package.json
sed -i '' 's/"version": "0.1.0"/"version": "0.2.0"/' package.json

# src-tauri/tauri.conf.json
sed -i '' 's/"version": "0.1.0"/"version": "0.2.0"/' src-tauri/tauri.conf.json

# src-tauri/Cargo.toml
sed -i '' 's/^version = "0.1.0"/version = "0.2.0"/' src-tauri/Cargo.toml
```

#### Step 2: Commit, tag, and push

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

#### Step 3: Build the production DMG

```bash
pnpm tauri build
```

The DMG is written to `src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg`.

#### Step 4: Create the GitHub release

```bash
gh release create v0.2.0 \
  "src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg" \
  --title "Markora v0.2.0" \
  --notes "Release notes here"
```

#### Step 5: Update the Homebrew Cask

```bash
# Get the new checksum
shasum -a 256 src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg

# Clone the tap repo and update the formula
cd /tmp && git clone https://github.com/yaozcoderepo/homebrew-tap.git && cd homebrew-tap

# Replace NEW_SHA below with the hash from the shasum command above
sed -i '' 's/version "0.1.0"/version "0.2.0"/' Casks/markora.rb
sed -i '' 's/sha256 ".*"/sha256 "NEW_SHA"/' Casks/markora.rb

# Commit and push
git add Casks/markora.rb
git commit -m "Update markora to v0.2.0"
git push origin main
```

Users then pick up the update with:

```bash
brew update && brew upgrade --cask markora
```

### CI/CD with GitHub Actions

For automated builds on every tagged release, add `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags: ["v*"]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - uses: dtolnay/rust-toolchain@stable

      - run: pnpm install

      - run: pnpm tauri build

      - uses: softprops/action-gh-release@v2
        with:
          files: src-tauri/target/release/bundle/dmg/*.dmg
```

This builds and uploads the DMG to GitHub Releases automatically whenever you push a version tag. You still need to manually update the Homebrew cask (step 5 above) after the CI release completes.

## License

MIT
