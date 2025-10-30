# Toast Module - Release Checklist

> **Use this checklist when preparing a new release**

---

## Pre-Release Checklist

### 1. Version Update

- [ ] Update version in `package.json`
- [ ] Update version in `module.json`
- [ ] Verify versions match: `npm run build` (will error if mismatch)

### 2. Documentation

- [ ] Update `CHANGELOG.md` with release notes
  - [ ] Add version number and date
  - [ ] List new features
  - [ ] List bug fixes
  - [ ] List breaking changes (if any)
  - [ ] List deprecations (if any)

- [ ] Update `README.md` if needed
  - [ ] Update version badges
  - [ ] Update feature list
  - [ ] Add new examples if applicable

- [ ] Review all documentation in `docs/`
  - [ ] Verify examples work with new version
  - [ ] Update API documentation if changed
  - [ ] Fix any broken links

### 3. Code Quality

- [ ] All source files in `src/` are clean and commented
- [ ] No `console.log` debugging statements left in code
- [ ] No TODO comments remain (or document them)
- [ ] Code follows established patterns
- [ ] All new features have inline documentation

### 4. Testing

- [ ] Test in Foundry VTT v13
- [ ] Test basic toast display
- [ ] Test AI generation (if applicable)
  - [ ] Test with Claude
  - [ ] Test with OpenAI
  - [ ] Test API key validation
- [ ] Test TTS templates
  - [ ] Test built-in templates
  - [ ] Test custom templates
  - [ ] Test cache functionality
- [ ] Test announcer packs
  - [ ] Test default pack
  - [ ] Test pack switching
- [ ] Test permissions system
  - [ ] Test GM-only mode
  - [ ] Test by role
  - [ ] Test by username
- [ ] Test on different browsers
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari (if possible)

### 5. Security Review

- [ ] Review API key handling
- [ ] Verify no keys hardcoded in source
- [ ] Security warnings present in docs
- [ ] Permission validation works correctly
- [ ] GM validation works for broadcasts

---

## Build Process

### 1. Clean Build

```bash
npm run clean
```

- [ ] `dist/` directory removed

### 2. Production Build

```bash
npm run build:production
```

Expected output:
- [ ] ✅ Version validation passes
- [ ] ✅ Source modules validation passes
- [ ] ✅ Required files validation passes
- [ ] ✅ CHANGELOG validation passes
- [ ] ✅ Build output validation passes
- [ ] ✅ `dist/toast/` created successfully

Review build summary:
- [ ] Version number is correct
- [ ] Source modules count: 11
- [ ] Output size reasonable (~88 KB)
- [ ] All files copied

### 3. Manual Verification

Navigate to `dist/toast/` and verify:

- [ ] `module.json` present and correct
- [ ] `README.md` present
- [ ] `CHANGELOG.md` present
- [ ] `scripts/toast.js` present (~88 KB)
- [ ] `styles/toast.css` present
- [ ] `sounds/` directory present with audio files
- [ ] No `src/` directory (should be excluded)
- [ ] No `docs/` directory (should be excluded)
- [ ] No `node_modules/` (should be excluded)
- [ ] No build scripts (should be excluded)

### 4. Create Release Package

```bash
npm run build:release
```

Or for versioned ZIP:

```bash
npm run build:zip:version
```

Expected output:
- [ ] ✅ ZIP created: `dist/toast.zip` or `dist/toast-v{version}.zip`
- [ ] ZIP size reasonable (usually 100-500 KB depending on sounds)

---

## Installation Testing

### 1. Test Manual Installation

- [ ] Copy `dist/toast/` to Foundry `Data/modules/`
- [ ] Restart Foundry VTT
- [ ] Module appears in module list
- [ ] Module enables without errors
- [ ] Create test world and enable module
- [ ] Test basic functionality (simple toast)

### 2. Test ZIP Installation

- [ ] Install from ZIP using Foundry's "Install Module" interface
- [ ] Module installs successfully
- [ ] Module enables without errors
- [ ] Test basic functionality

---

## Release Publication

### 1. Git Preparation

- [ ] All changes committed
- [ ] Working directory clean: `git status`
- [ ] Create release branch (optional): `git checkout -b release/v{version}`

### 2. Git Tag

```bash
git tag -a v{version} -m "Release v{version}"
git push origin v{version}
```

- [ ] Tag created locally
- [ ] Tag pushed to GitHub

### 3. GitHub Release

- [ ] Go to GitHub repository
- [ ] Click "Releases" → "Draft a new release"
- [ ] Select the tag created above
- [ ] Release title: `v{version}` (e.g., "v2.0.0")
- [ ] Copy CHANGELOG entry to release description
- [ ] Upload `dist/toast-v{version}.zip` as release asset
- [ ] Mark as pre-release if applicable
- [ ] Publish release

### 4. Update module.json URLs (if needed)

If first public release, update in `module.json`:

```json
{
  "url": "https://github.com/yourusername/toast",
  "manifest": "https://github.com/yourusername/toast/releases/latest/download/module.json",
  "download": "https://github.com/yourusername/toast/releases/latest/download/toast.zip"
}
```

- [ ] URLs point to correct repository
- [ ] `manifest` URL is correct
- [ ] `download` URL is correct

### 5. Manifest File for Foundry

Create a standalone `module.json` in the release:

- [ ] Add `module.json` from `dist/toast/` as separate asset
- [ ] Or ensure it's accessible via `manifest` URL

---

## Post-Release

### 1. Announcement

- [ ] Post to Foundry VTT Discord (if public release)
- [ ] Post to r/FoundryVTT subreddit (if public release)
- [ ] Update any relevant forum posts

### 2. Documentation

- [ ] Update README badges if needed
- [ ] Update any external documentation links
- [ ] Submit to Foundry package list (if first public release)

### 3. Monitoring

- [ ] Watch for GitHub issues
- [ ] Monitor Discord for feedback
- [ ] Track download counts

---

## Versioning Guide

Follow [Semantic Versioning](https://semver.org/):

- **Major (x.0.0)**: Breaking changes, incompatible API changes
- **Minor (1.x.0)**: New features, backwards compatible
- **Patch (1.0.x)**: Bug fixes, backwards compatible

### Examples:

- `2.0.0` → `2.0.1`: Bug fix, patch version
- `2.0.0` → `2.1.0`: New feature (Phase 4), minor version
- `2.0.0` → `3.0.0`: Breaking changes, major version

---

## Quick Release Commands

```bash
# Standard release process
npm run clean
npm run build:production
npm run build:zip:version

# Or all-in-one
npm run build:release

# Test installation
# (Copy dist/toast/ to Foundry modules/)

# Git tag and push
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0

# Create GitHub release and upload ZIP
```

---

## Rollback Procedure

If a release has critical issues:

### 1. Immediate Response

- [ ] Mark GitHub release as "pre-release"
- [ ] Add warning to release notes
- [ ] Post warning in announcement channels

### 2. Fix

- [ ] Create hotfix branch
- [ ] Fix critical issues
- [ ] Test thoroughly
- [ ] Increment patch version
- [ ] Follow release checklist again

### 3. Hotfix Release

- [ ] Build and test hotfix version
- [ ] Create new release
- [ ] Update announcements

---

## Release History

| Version | Date       | Type  | Notes |
|---------|------------|-------|-------|
| 2.0.0   | 2025-10-29 | Major | AI generation, modular refactor |
| 1.5.0   | (previous) | Minor | ElevenLabs TTS integration |
| ...     | ...        | ...   | ... |

---

## Notes

- Always test in a clean Foundry installation before releasing
- Keep old releases available on GitHub for rollback purposes
- Document breaking changes clearly in CHANGELOG
- Consider a beta release for major versions
- Internal releases (pre-Phase 4) don't need public announcement

---

**Last Updated:** 2025-10-29
**Current Version:** 2.0.0
