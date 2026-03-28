# How to Release a New Version

## One-Time Setup (already done)

1. Add `TAURI_SIGNING_PRIVATE_KEY` secret to GitHub repo settings
   - URL: https://github.com/DrBaron420/Quartermaster/settings/secrets/actions
   - Value: contents of `src-tauri/.tauri-updater-key` (NOT the .pub file)

## Releasing a New Version

### Step 1: Bump the version number

Update the version in **both** of these files:

- `package.json` → `"version": "0.2.0"`
- `src-tauri/tauri.conf.json` → `"version": "0.2.0"`

### Step 2: Commit the version bump

```bash
git add package.json src-tauri/tauri.conf.json
git commit -m "Bump version to 0.2.0"
git push
```

### Step 3: Create and push a tag

```bash
git tag v0.2.0
git push origin v0.2.0
```

### Step 4: Wait

GitHub Actions will automatically:
- Build the app
- Sign the installer
- Create a GitHub Release with the `.exe` attached
- Generate `latest.json` for the auto-updater

Check progress at: https://github.com/DrBaron420/Quartermaster/actions

### Step 5: Done

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
- **Lost the signing key?** It's at `src-tauri/.tauri-updater-key` on your local machine. If you lose it entirely, you'll need to generate a new keypair and users will need to reinstall
