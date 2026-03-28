# How to Release a New Version

## Branch Strategy

- **`testing`** — where you develop and test changes
- **`main`** — the stable release branch, what users download
- Releases only build from `main`

## One-Time Setup (already done)

1. Add `TAURI_SIGNING_PRIVATE_KEY` secret to GitHub repo settings
   - URL: https://github.com/DrBaron420/Quartermaster/settings/secrets/actions
   - Value: contents of `src-tauri/.tauri-updater-key` (NOT the .pub file)

## Releasing a New Version

### Step 1: Make sure testing is ready

Test everything on the `testing` branch first. Make sure it builds and runs.

### Step 2: Bump the version number (on testing)

Update the version in **all three** of these:

- `package.json` → `"version": "0.2.0"`
- `src-tauri/tauri.conf.json` → `"version": "0.2.0"`
- `src/core/settings/SettingsPage.tsx` → `const APP_VERSION = "0.2.0"`

Commit and push to testing.

### Step 3: Merge testing into main

```bash
git checkout main
git merge testing
git push
```

### Step 4: Create and push a tag (from main)

```bash
git tag v0.2.0
git push origin v0.2.0
```

### Step 5: Go back to testing

```bash
git checkout testing
```

### Step 6: Wait

GitHub Actions will automatically:
- Build the app from `main`
- Sign the installer
- Create a GitHub Release with the `.exe` attached
- Generate `latest.json` for the auto-updater

Check progress at: https://github.com/DrBaron420/Quartermaster/actions

### Step 7: Done

Users with the app installed will see an update prompt next time they open it.

## Version Number Format

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major redesign
- **MINOR** (0.1.0 → 0.2.0): New features, new modules
- **PATCH** (0.1.0 → 0.1.1): Bug fixes, small tweaks

## If Something Goes Wrong

- **Build failed?** Check the Actions tab for error logs
- **Secret missing?** Re-add `TAURI_SIGNING_PRIVATE_KEY` in repo settings
- **Wrong version?** Delete the tag (`git tag -d v0.2.0 && git push origin :v0.2.0`), fix, re-tag
- **Accidentally released from testing?** The workflow always checks out `main`, so it won't build testing code even if triggered
- **Lost the signing key?** It's at `src-tauri/.tauri-updater-key` on your local machine. If you lose it entirely, you'll need to generate a new keypair and users will need to reinstall
