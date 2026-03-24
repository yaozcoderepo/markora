# Releasing Markora

This guide covers publishing Markora — from a first release to ongoing version updates.

## GitHub Releases

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

## Homebrew Cask

Homebrew Cask lets macOS users install Markora with a single command. This requires a **Homebrew tap** — a separate GitHub repository that hosts your cask formula.

### Step 1: Create a GitHub release

Make sure you've completed the [GitHub Releases](#github-releases) steps above. You need a public DMG download URL like:

```
https://github.com/yaozcoderepo/markora/releases/download/v0.1.0/Markora_0.1.0_aarch64.dmg
```

### Step 2: Create a Homebrew tap repository

A tap is a GitHub repo named `homebrew-<name>`. Create one called `homebrew-tap`:

```bash
# Create the repo on GitHub
gh repo create homebrew-tap --public --clone
cd homebrew-tap

# Create the required directory structure
mkdir -p Casks
```

### Step 3: Generate the DMG checksum

Homebrew verifies downloads by SHA-256 hash:

```bash
shasum -a 256 /path/to/markora/src-tauri/target/release/bundle/dmg/Markora_0.1.0_aarch64.dmg
```

This outputs something like:

```
a1b2c3d4e5f6...  Markora_0.1.0_aarch64.dmg
```

Copy the hash for the next step.

### Step 4: Write the cask formula

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

### Step 5: Publish the tap

```bash
cd homebrew-tap
git add Casks/markora.rb
git commit -m "Add markora cask v0.1.0"
git push origin main
```

### Step 6: Install

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

## Releasing a New Version

This is the complete end-to-end workflow for releasing a new version. The example below upgrades from `0.1.0` to `0.2.0` — replace both the old and new version numbers with your actual values.

### Step 1: Bump the version

The version must be updated in **three files** to stay in sync. Missing any one of them will cause build errors or mismatched version strings in the app.

| File | Field | What it controls |
| --- | --- | --- |
| `package.json` | `"version"` | Frontend version, shown in `pnpm` and npm metadata |
| `src-tauri/tauri.conf.json` | `"version"` | Tauri bundle version — used in the `.app` `Info.plist`, DMG filename, and macOS "About" dialog |
| `src-tauri/Cargo.toml` | `version` | Rust crate version — must match `tauri.conf.json` or the build fails |

Run the following (replace `0.1.0` and `0.2.0` with your current and new versions):

```bash
# package.json — update the "version" field
sed -i '' 's/"version": "0.1.0"/"version": "0.2.0"/' package.json

# src-tauri/tauri.conf.json — update the "version" field
sed -i '' 's/"version": "0.1.0"/"version": "0.2.0"/' src-tauri/tauri.conf.json

# src-tauri/Cargo.toml — update the version key (anchored to line start to avoid replacing dependency versions)
sed -i '' 's/^version = "0.1.0"/version = "0.2.0"/' src-tauri/Cargo.toml
```

Verify the changes look correct:

```bash
grep '"version"' package.json src-tauri/tauri.conf.json
grep '^version' src-tauri/Cargo.toml
```

All three should show `0.2.0`.

### Step 2: Commit, tag, and push

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

> **Why tag before building?** The tag marks the exact source that produced the release. If the build fails, delete the tag with `git tag -d v0.2.0 && git push origin :refs/tags/v0.2.0` and try again.

### Step 3: Build the production DMG

```bash
pnpm tauri build
```

This compiles the Svelte frontend (minified via Vite) and the Rust backend (release profile with optimizations), then packages everything into a `.dmg`. Build time is typically 1–3 minutes.

The output DMG is at:

```
src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg
```

Verify it launches correctly before publishing:

```bash
open src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg
```

This mounts the DMG — drag `Markora.app` to a temporary location and run it to confirm the new version works.

### Step 4: Create the GitHub release

```bash
gh release create v0.2.0 \
  "src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg" \
  --title "Markora v0.2.0" \
  --notes "Describe what changed in this release"
```

This uploads the DMG and creates a release page at `https://github.com/yaozcoderepo/markora/releases/tag/v0.2.0`. Verify the page loads and the DMG download link works before proceeding.

### Step 5: Update the Homebrew Cask

The Homebrew cask formula in your tap repo must be updated with the new version and checksum. If you skip this, `brew upgrade` won't see the new version.

**5a.** Generate the SHA-256 checksum of the new DMG:

```bash
shasum -a 256 src-tauri/target/release/bundle/dmg/Markora_0.2.0_aarch64.dmg
```

This outputs something like:

```
e3b0c44298fc1c149afbf4c8996fb924...  Markora_0.2.0_aarch64.dmg
```

Copy **only the hex string** (the part before the two spaces).

**5b.** Clone the tap repo and update the formula:

```bash
cd /tmp
git clone https://github.com/yaozcoderepo/homebrew-tap.git
cd homebrew-tap
```

**5c.** Update the version and checksum in the cask file (replace `NEW_SHA` with the hex string from step 5a):

```bash
sed -i '' 's/version "0.1.0"/version "0.2.0"/' Casks/markora.rb
sed -i '' 's/sha256 ".*"/sha256 "NEW_SHA"/' Casks/markora.rb
```

**5d.** Verify the file looks right:

```bash
cat Casks/markora.rb
```

Confirm the `version` line says `"0.2.0"` and the `sha256` line has the new hash. The `url` field uses `#{version}` interpolation so it updates automatically.

**5e.** Commit and push:

```bash
git add Casks/markora.rb
git commit -m "Update markora to v0.2.0"
git push origin main
```

**5f.** Users can now upgrade with:

```bash
brew update && brew upgrade --cask markora
```

## CI/CD with GitHub Actions

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
