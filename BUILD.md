# Toast Module - Build System Documentation

Comprehensive guide to building, validating, and packaging the Toast module for distribution.

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Quick Start](#quick-start)
4. [NPM Scripts Reference](#npm-scripts-reference)
5. [Build Flags](#build-flags)
6. [Build Validation](#build-validation)
7. [File Structure](#file-structure)
8. [Build Process Flow](#build-process-flow)
9. [Development Workflow](#development-workflow)
10. [Release Process](#release-process)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Toast build system provides a comprehensive, automated workflow for creating distributable packages of the module. It handles:

- **Module Concatenation**: Combines modular source files from `src/` into a single `scripts/toast.js` file
- **Validation**: Ensures version consistency, required files, and proper module structure
- **Distribution Creation**: Builds a clean `dist/toast/` folder ready for installation
- **ZIP Packaging**: Creates compressed archives for GitHub releases and manual installation
- **Quality Assurance**: Validates build output to ensure all required classes and hooks are present

The build system is designed to catch errors early, maintain code quality, and streamline the release process.

---

## Requirements

### Required
- **Node.js** v14 or higher
- **npm** (comes with Node.js)

### Optional (Recommended)
- **archiver** package - For optimal ZIP compression
  ```bash
  npm install archiver
  ```

### Verify Installation
```bash
node --version
npm --version
```

---

## Quick Start

### Build the Module
```bash
npm run build
```

### Build with Validation (Production)
```bash
npm run build:production
```

### Build and Create Release ZIP
```bash
npm run build:release
```

### Clean Build Artifacts
```bash
npm run clean
```

---

## NPM Scripts Reference

### Core Build Scripts

#### `npm run build`
**Standard development build**

Creates a distributable version in `dist/toast/` with basic validation.

- Validates version consistency
- Validates source modules exist
- Validates required files exist
- Concatenates source modules into `scripts/toast.js`
- Validates build output
- Copies distribution files to `dist/toast/`

**Use when:** Developing locally or testing builds

**Example:**
```bash
npm run build
```

---

#### `npm run build:production`
**Production build with strict validation**

Same as standard build, but with stricter validation requirements.

- Enforces CHANGELOG entries for current version
- Fails build if CHANGELOG is missing version entry
- Recommended before creating releases

**Use when:** Preparing for a release

**Example:**
```bash
npm run build:production
```

---

#### `npm run build:verbose`
**Build with detailed logging**

Shows verbose output including:
- Individual file operations
- Module concatenation details
- Validation checks for each file
- Build statistics

**Use when:** Debugging build issues or understanding the build process

**Example:**
```bash
npm run build:verbose
```

---

### ZIP Creation Scripts

#### `npm run build:zip`
**Build and create generic ZIP**

Creates `dist/toast.zip` for distribution.

- Runs standard build first
- Validates module directory
- Creates `toast.zip` in dist folder

**Use when:** Creating a ZIP for manual installation or testing

**Example:**
```bash
npm run build:zip
```

**Output:** `dist/toast.zip`

---

#### `npm run build:zip:version`
**Build and create versioned ZIP**

Creates `dist/toast-v{version}.zip` using the version from `module.json`.

- Runs standard build first
- Validates module directory
- Creates versioned ZIP (e.g., `toast-v2.0.0.zip`)

**Use when:** Creating release archives with version in filename

**Example:**
```bash
npm run build:zip:version
```

**Output:** `dist/toast-v2.0.0.zip`

---

#### `npm run build:zip:verbose`
**Create ZIP with detailed logging**

Shows verbose output during ZIP creation:
- Each file being added to archive
- Compression statistics
- File sizes

**Use when:** Debugging ZIP creation issues

**Example:**
```bash
npm run build:zip:verbose
```

---

#### `npm run build:release`
**Complete production release build**

The recommended command for creating release packages. Combines:
- Production build with strict validation
- Versioned ZIP creation

**Use when:** Creating official releases

**Example:**
```bash
npm run build:release
```

**Output:** `dist/toast-v2.0.0.zip` (production-validated)

---

### Utility Scripts

#### `npm run clean`
**Remove all build artifacts**

Deletes the entire `dist/` directory and all its contents.

**Use when:**
- Starting a fresh build
- Cleaning up after testing
- Troubleshooting build issues

**Example:**
```bash
npm run clean
```

---

## Build Flags

Build scripts accept command-line flags for customization:

### `--production`
**Strict production mode validation**

Enables strict validation rules:
- Requires CHANGELOG entry for current version
- Fails build if validation errors occur
- Recommended for releases

**Usage:**
```bash
node build.js --production
```

**Available in:** `build.js` (via `npm run build:production`)

---

### `--skip-validation`
**Skip all validation checks**

Bypasses all validation steps:
- Version consistency checks
- Source module validation
- Required files validation
- CHANGELOG validation
- Output validation

**Warning:** Only use for testing or development. Never for releases.

**Usage:**
```bash
node build.js --skip-validation
```

**Use when:** Testing build process without full project setup

---

### `--verbose`
**Enable detailed logging**

Prints additional information:
- Individual file operations
- Validation details for each file
- Module concatenation progress
- Build statistics
- ZIP archive file list

**Usage:**
```bash
node build.js --verbose
node build-zip.js --verbose
```

**Available in:** Both `build.js` and `build-zip.js` (via `npm run build:verbose`, `npm run build:zip:verbose`)

---

### `--version`
**Include version in ZIP filename**

Creates versioned ZIP archives:
- `toast.zip` becomes `toast-v2.0.0.zip`
- Version read from `module.json`

**Usage:**
```bash
node build-zip.js --version
```

**Available in:** `build-zip.js` (via `npm run build:zip:version`, `npm run build:release`)

---

## Build Validation

The build system performs comprehensive validation to ensure quality and consistency.

### Version Consistency Check

**What it validates:**
- `package.json` version matches `module.json` version
- Both files use semantic versioning (e.g., `2.0.0`)

**When it runs:** Pre-build (all builds except `--skip-validation`)

**Failure scenario:**
```
❌ Version mismatch!
  package.json: 2.0.0
  module.json:  1.9.0

Please update both files to the same version.
```

**Fix:** Update both files to the same version number.

---

### Source Modules Check

**What it validates:**
- All required source modules exist in `src/` directory
- Modules are in correct subdirectories

**Required modules:**
```
src/
├── tts/
│   ├── TTSCacheManager.js
│   └── ElevenLabsAPI.js
├── ai/
│   ├── AIStatusWindow.js
│   ├── AIProvider.js
│   ├── ClaudeProvider.js
│   ├── OpenAIProvider.js
│   └── AIProviderFactory.js
├── templates/
│   └── TemplateManager.js
├── core/
│   ├── ToastManager.js
│   └── ToastManagerIntegration.js
└── index.js
```

**When it runs:** Pre-build (all builds except `--skip-validation`)

**Failure scenario:**
```
❌ Missing source modules:
  - src/ai/ClaudeProvider.js
```

**Fix:** Ensure all source modules are present in the `src/` directory.

---

### Required Files Check

**What it validates:**
- Essential distribution files exist in the project root

**Required files:**
- `module.json` - Module manifest
- `package.json` - npm configuration
- `README.md` - User documentation
- `CHANGELOG.md` - Version history
- `styles/toast.css` - Module styles

**When it runs:** Pre-build (all builds except `--skip-validation`)

**Failure scenario:**
```
❌ Missing required files:
  - CHANGELOG.md
```

**Fix:** Create the missing file(s).

---

### CHANGELOG Validation

**What it validates:**
- `CHANGELOG.md` contains an entry for the current version
- Matches patterns: `## 2.0.0`, `## [2.0.0]`, `## Version 2.0.0`, `## v2.0.0`

**When it runs:** Pre-build (standard builds: warning, production builds: error)

**Warning scenario (standard build):**
```
⚠️  CHANGELOG.md does not contain an entry for version 2.0.0
Consider adding a changelog entry before releasing.
```

**Error scenario (production build):**
```
❌ Production builds require CHANGELOG entries. Use --skip-validation to bypass.
```

**Fix:** Add a version entry to `CHANGELOG.md`:
```markdown
## [2.0.0] - 2025-01-15

### Added
- New features here
```

---

### Build Output Validation

**What it validates:**
- Concatenated `scripts/toast.js` file exists
- All required classes are present in output
- Foundry VTT hooks are present

**Required classes:**
- `TTSCacheManager`
- `ElevenLabsAPI`
- `AIStatusWindow`
- `AIProvider`
- `ClaudeProvider`
- `OpenAIProvider`
- `AIProviderFactory`
- `TemplateManager`
- `ToastManager`

**Required hooks:**
- `Hooks.once("init")`
- `Hooks.once("ready")`

**When it runs:** Post-concatenation (all builds except `--skip-validation`)

**Failure scenario:**
```
❌ Missing classes in output:
  - ClaudeProvider
  - OpenAIProvider
```

**Fix:** Ensure all source modules are properly formatted and contain the expected class definitions.

---

### ZIP Validation

**What it validates:**
- Module directory exists in `dist/toast/`
- Required files are present in distribution

**Required files in dist:**
- `module.json`
- `README.md`
- `scripts/toast.js`
- `styles/toast.css`

**When it runs:** Before ZIP creation (all ZIP builds)

**Failure scenario:**
```
❌ Module directory not found.
Run "npm run build" first.
```

**Fix:** Run `npm run build` before creating a ZIP.

---

## File Structure

### Source Structure

```
toast/
├── src/                          # Source modules (not in dist)
│   ├── tts/
│   │   ├── TTSCacheManager.js
│   │   └── ElevenLabsAPI.js
│   ├── ai/
│   │   ├── AIStatusWindow.js
│   │   ├── AIProvider.js
│   │   ├── ClaudeProvider.js
│   │   ├── OpenAIProvider.js
│   │   └── AIProviderFactory.js
│   ├── templates/
│   │   └── TemplateManager.js
│   ├── core/
│   │   ├── ToastManager.js
│   │   └── ToastManagerIntegration.js
│   └── index.js
├── scripts/
│   └── toast.js                  # Generated (concatenated)
├── styles/
│   └── toast.css
├── sounds/                       # Optional audio files
├── module.json
├── README.md
├── CHANGELOG.md
├── package.json
├── build.js
└── build-zip.js
```

### Distribution Structure

```
dist/
├── toast/                        # Module directory
│   ├── module.json
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── scripts/
│   │   └── toast.js
│   ├── styles/
│   │   └── toast.css
│   └── sounds/                   # If present
└── toast.zip                     # Or toast-v2.0.0.zip
```

---

### Files Included in Distribution

The build system includes these files and directories:

#### Core Files
- `module.json` - Module manifest (required by Foundry VTT)
- `README.md` - User documentation
- `CHANGELOG.md` - Version history

#### Module Assets
- `scripts/` - JavaScript files (toast.js)
- `styles/` - CSS files (toast.css)
- `sounds/` - Audio files (if present)

---

### Files Excluded from Distribution

The build system excludes development files:

#### Version Control
- `.git/` - Git repository
- `.gitignore` - Git ignore rules

#### IDE Settings
- `.idea/` - JetBrains IDEs
- `.vscode/` - Visual Studio Code
- `.claude/` - Claude Code settings

#### Build System
- `build.js` - Build script
- `build-zip.js` - ZIP creation script
- `package.json` - npm configuration
- `package-lock.json` - npm lockfile

#### Development Files
- `node_modules/` - npm dependencies
- `dist/` - Build output (not recursive)
- `src/` - Source modules (concatenated into scripts/toast.js)

#### Documentation (Internal)
- `PLANNING.md` - Development planning
- `PHASE-4-PLAN.md` - Phase planning documents
- `docs/` - Internal documentation

---

## Build Process Flow

Understanding the build process helps troubleshoot issues and optimize workflows.

### Standard Build Process (`npm run build`)

```
┌─────────────────────────────────────┐
│ 1. Pre-Build Validation            │
├─────────────────────────────────────┤
│ • Check version consistency         │
│   (package.json vs module.json)     │
│ • Verify source modules exist       │
│   (11 files in src/)                │
│ • Verify required files exist       │
│   (module.json, README.md, etc.)    │
│ • Validate CHANGELOG entry          │
│   (warning only in standard mode)   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Module Concatenation             │
├─────────────────────────────────────┤
│ • Read source modules in order:     │
│   1. TTS Layer (2 files)            │
│   2. AI Layer (5 files)             │
│   3. Templates Layer (1 file)       │
│   4. Core Layer (2 files)           │
│   5. Entry Point (1 file)           │
│ • Concatenate into scripts/toast.js │
│ • Calculate size and line count     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Output Validation                │
├─────────────────────────────────────┤
│ • Verify scripts/toast.js exists    │
│ • Check for required classes (9)    │
│ • Check for Foundry hooks           │
│   (Hooks.once("init"), etc.)        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Clean Distribution               │
├─────────────────────────────────────┤
│ • Remove existing dist/ directory   │
│ • Create fresh dist/toast/ folder   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Copy Files                       │
├─────────────────────────────────────┤
│ • Copy module.json                  │
│ • Copy README.md                    │
│ • Copy CHANGELOG.md                 │
│ • Copy scripts/ directory           │
│ • Copy styles/ directory            │
│ • Copy sounds/ directory (if exists)│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 6. Build Summary                    │
├─────────────────────────────────────┤
│ • Display version number            │
│ • Display source module count       │
│ • Display output size               │
│ • Display output line count         │
│ • Display files/directories copied  │
│ • Display build time                │
│ • Display output location           │
└─────────────────────────────────────┘
```

**Total Time:** Typically 0.5-2 seconds

---

### Production Build Process (`npm run build:production`)

Same as standard build, with these differences:

**Stricter Validation:**
- CHANGELOG validation becomes an **error** (not just warning)
- Build fails if CHANGELOG entry is missing

**Additional Output:**
```
🎯 Production build complete!
   Next steps:
   1. Test the module in Foundry VTT
   2. Run "npm run build:zip" to create release package
   3. Create a GitHub release with the ZIP file
```

---

### ZIP Creation Process (`npm run build:zip`)

```
┌─────────────────────────────────────┐
│ 1. Pre-ZIP Validation               │
├─────────────────────────────────────┤
│ • Verify dist/toast/ exists         │
│ • Check for required files:         │
│   - module.json                     │
│   - README.md                       │
│   - scripts/toast.js                │
│   - styles/toast.css                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Determine ZIP Method             │
├─────────────────────────────────────┤
│ Try in order:                       │
│ 1. archiver package (best)          │
│ 2. PowerShell Compress-Archive (Win)│
│ 3. zip command (Linux/Mac)          │
│ 4. Manual instructions (fallback)   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Create ZIP Archive               │
├─────────────────────────────────────┤
│ • Remove existing ZIP (if present)  │
│ • Create new ZIP file:              │
│   - toast.zip (standard)            │
│   - toast-v2.0.0.zip (--version)    │
│ • Add toast/ directory recursively  │
│ • Calculate compressed size         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. ZIP Summary                      │
├─────────────────────────────────────┤
│ • Display filename                  │
│ • Display location                  │
│ • Display creation time             │
│ • Show next steps                   │
└─────────────────────────────────────┘
```

**Total Time:** Typically 0.5-3 seconds

---

### Release Build Process (`npm run build:release`)

Combines production build + versioned ZIP:

```
npm run build:production
              ↓
   (Production build with
    strict validation)
              ↓
npm run build:zip:version
              ↓
   (Versioned ZIP creation)
              ↓
Output: dist/toast-v2.0.0.zip
```

**Total Time:** Typically 1-5 seconds

---

## Development Workflow

### Daily Development

```bash
# 1. Make changes to source files in src/
# 2. Test locally in your Foundry instance
# 3. Periodically build to test concatenation
npm run build

# 4. Test the dist version
# Copy dist/toast/ to Foundry Data/modules/
```

---

### Pre-Commit Workflow

```bash
# 1. Ensure versions are in sync
# Edit module.json and package.json if needed

# 2. Update CHANGELOG.md
# Add entry for current version

# 3. Run production build to catch issues
npm run build:production

# 4. Test in Foundry VTT
# Copy dist/toast/ to modules directory

# 5. Commit changes
git add .
git commit -m "Description of changes"
```

---

### Testing Build Output

```bash
# Build with verbose output
npm run build:verbose

# Check the output
cd dist/toast
dir  # Windows
ls   # Linux/Mac

# Test concatenated file
# Open scripts/toast.js and verify all classes are present

# Test in Foundry
# Copy dist/toast/ to Foundry Data/modules/toast/
# Restart Foundry
# Enable module in world
```

---

### Creating Test ZIPs

```bash
# Clean start
npm run clean

# Build and create standard ZIP
npm run build:zip

# Or build and create versioned ZIP
npm run build:zip:version

# Test installation
# 1. Open Foundry VTT
# 2. Go to Add-on Modules
# 3. Click "Install Module"
# 4. Use the manifest URL or install from ZIP
```

---

## Release Process

Complete step-by-step process for creating official releases.

### Pre-Release Checklist

- [ ] All features are complete and tested
- [ ] Version number is decided (following semantic versioning)
- [ ] CHANGELOG.md is updated with version entry
- [ ] README.md reflects current features
- [ ] module.json has correct metadata

---

### Version Number Update

**1. Update module.json**
```json
{
  "id": "toast",
  "version": "2.0.0",
  ...
}
```

**2. Update package.json**
```json
{
  "name": "toast",
  "version": "2.0.0",
  ...
}
```

**3. Ensure versions match**
```bash
npm run build:production
```

If versions don't match, build will fail with clear error.

---

### CHANGELOG Update

Add an entry for the new version:

```markdown
## [2.0.0] - 2025-01-15

### Added
- AI-powered toast message generation
- Template system for reusable toasts
- Text-to-speech support with ElevenLabs

### Changed
- Improved animation performance
- Refactored modular architecture

### Fixed
- Sound playback issues on Firefox
- Z-index conflicts with other modules

### Breaking Changes
- Removed deprecated `showToast()` method
- Changed config structure for animations
```

---

### Build and Validate

```bash
# Clean any previous builds
npm run clean

# Create production build with validation
npm run build:production
```

**Expected output:**
```
🔨 Building Toast module...

🔍 Validating versions...
🔍 Validating source modules...
🔍 Validating required files...
🔍 Validating CHANGELOG...

🔧 Concatenating source modules...
✅ Created scripts/toast.js (45.2 KB, 1523 lines)

🔍 Validating build output...

🧹 Cleaning dist directory...
📁 Creating module directory...
📦 Copying files...

✅ Build complete!

📊 Build Summary:
   Version: 2.0.0
   Source modules: 11
   Output size: 45.2 KB
   Output lines: 1523
   Files copied: 3
   Directories copied: 3
   Build time: 0.85s

📍 Output: C:\Users\...\toast\dist\toast

🎯 Production build complete!
   Next steps:
   1. Test the module in Foundry VTT
   2. Run "npm run build:zip" to create release package
   3. Create a GitHub release with the ZIP file
```

---

### Test Distribution Build

```bash
# Copy dist/toast/ to Foundry Data/modules/toast/
# (Replace existing if present)

# 1. Restart Foundry VTT
# 2. Create/open a test world
# 3. Enable Toast module
# 4. Test all features thoroughly
```

---

### Create Release Package

```bash
# Create versioned ZIP for release
npm run build:zip:version
```

**Expected output:**
```
📦 Creating ZIP archive...

🔍 Validating module directory...

✅ Created toast-v2.0.0.zip (38.5 KB)

✅ ZIP creation complete!

📊 Summary:
   File: toast-v2.0.0.zip
   Location: C:\Users\...\toast\dist
   Build time: 1.23s

📦 Release package ready!

Next steps:
  1. Test installation from ZIP in Foundry VTT
  2. Create a GitHub release
  3. Upload the ZIP as a release asset
```

---

### Test ZIP Installation

```bash
# 1. Remove current toast module from Foundry Data/modules/
# 2. In Foundry, go to Add-on Modules
# 3. Click "Install Module"
# 4. Click "Install from File"
# 5. Select dist/toast-v2.0.0.zip
# 6. Verify installation and test all features
```

---

### Commit Changes

```bash
# Add all changes
git add .

# Commit with version tag
git commit -m "Release v2.0.0

- AI-powered toast generation
- Template system
- TTS support
- Performance improvements"

# Tag the release
git tag -a v2.0.0 -m "Release version 2.0.0"

# Push commits and tags
git push origin master
git push origin v2.0.0
```

---

### Create GitHub Release

**1. Go to GitHub repository**
```
https://github.com/yourusername/toast/releases/new
```

**2. Fill in release details:**
- **Tag:** Select `v2.0.0` (or create new tag)
- **Release title:** `Toast v2.0.0`
- **Description:** Copy from CHANGELOG.md

**3. Upload release asset:**
- Click "Attach binaries"
- Upload `dist/toast-v2.0.0.zip`

**4. Optional: Upload module.json**
- Upload `dist/toast/module.json` as second asset
- This allows direct manifest URL in Foundry

**5. Publish release**

---

### Update Module Manifest URLs

**module.json should have:**
```json
{
  "url": "https://github.com/yourusername/toast",
  "manifest": "https://github.com/yourusername/toast/releases/latest/download/module.json",
  "download": "https://github.com/yourusername/toast/releases/latest/download/toast-v2.0.0.zip"
}
```

**Note:** Using `/latest/download/` allows users to always get the newest version.

---

### Post-Release

**1. Announce the release**
- Reddit: r/FoundryVTT
- Discord: FoundryVTT server
- GitHub Discussions

**2. Monitor for issues**
- Watch GitHub issues
- Check FoundryVTT Discord for feedback

**3. Update documentation**
- Ensure README.md is current
- Update wiki if applicable

---

### Quick Release Command

For streamlined releases, use the combined command:

```bash
npm run build:release
```

This runs:
1. `npm run build:production` (strict validation)
2. `npm run build:zip:version` (versioned ZIP)

Then:
```bash
git add .
git commit -m "Release v2.0.0"
git tag v2.0.0
git push origin master --tags
```

Upload `dist/toast-v2.0.0.zip` to GitHub release.

---

## Troubleshooting

### Build Issues

#### Version Mismatch Error

**Error:**
```
❌ Version mismatch!
  package.json: 2.0.0
  module.json:  1.9.0

Please update both files to the same version.
```

**Fix:**
1. Open `module.json`
2. Update `"version": "2.0.0"`
3. Ensure it matches `package.json`
4. Run build again

---

#### Missing Source Modules

**Error:**
```
❌ Missing source modules:
  - src/ai/ClaudeProvider.js
```

**Fix:**
1. Check if file exists in `src/ai/` directory
2. Verify filename matches exactly (case-sensitive)
3. If missing, restore from Git or recreate
4. Run build again

---

#### CHANGELOG Validation Failed

**Error (Production mode):**
```
⚠️  CHANGELOG.md does not contain an entry for version 2.0.0
❌ Production builds require CHANGELOG entries. Use --skip-validation to bypass.
```

**Fix:**
1. Open `CHANGELOG.md`
2. Add version entry:
   ```markdown
   ## [2.0.0] - 2025-01-15

   ### Added
   - Feature description
   ```
3. Run build again

**Temporary bypass (not recommended):**
```bash
node build.js --production --skip-validation
```

---

#### Missing Output Classes

**Error:**
```
❌ Missing classes in output:
  - ClaudeProvider
  - OpenAIProvider
```

**Fix:**
1. Check source files contain class definitions:
   ```javascript
   class ClaudeProvider extends AIProvider {
   ```
2. Ensure files are in correct location
3. Verify no syntax errors in source files
4. Run build again

---

### ZIP Creation Issues

#### Module Directory Not Found

**Error:**
```
❌ Module directory not found.
Run "npm run build" first.
```

**Fix:**
```bash
npm run build
npm run build:zip
```

Or use combined command:
```bash
npm run build:zip
```
(This runs build automatically)

---

#### archiver Not Installed

**Message:**
```
ℹ️  archiver not installed, using fallback method...
```

**Fix (Recommended):**
```bash
npm install archiver
npm run build:zip
```

**Alternative:** Continue with fallback (PowerShell/zip command)

---

#### PowerShell Compress-Archive Fails (Windows)

**Error:**
```
❌ ZIP creation failed: ...
```

**Fix:**
1. Run PowerShell as Administrator
2. Or install archiver:
   ```bash
   npm install archiver
   npm run build:zip
   ```

---

#### zip Command Not Found (Linux/Mac)

**Error:**
```
❌ ZIP creation failed: zip: command not found
```

**Fix:**
- **Ubuntu/Debian:**
  ```bash
  sudo apt install zip
  npm run build:zip
  ```
- **Mac:**
  ```bash
  brew install zip
  npm run build:zip
  ```
- **Or install archiver:**
  ```bash
  npm install archiver
  npm run build:zip
  ```

---

#### Manual ZIP Creation

If all methods fail:

**1. Build the module:**
```bash
npm run build
```

**2. Navigate to dist folder:**
```bash
cd dist
```

**3. Create ZIP manually:**

**Windows:**
- Right-click the `toast` folder
- Select "Send to > Compressed (zipped) folder"
- Rename to `toast.zip` or `toast-v2.0.0.zip`

**Mac:**
- Right-click the `toast` folder
- Select "Compress 'toast'"
- Rename to `toast.zip` or `toast-v2.0.0.zip`

**Linux:**
```bash
zip -r toast.zip toast/
```

---

### Installation Issues

#### Module Not Appearing in Foundry

**Check:**
1. Module is in correct location: `Data/modules/toast/`
2. `module.json` is in the root of the module folder
3. Restart Foundry VTT
4. Check Foundry console (F12) for errors

---

#### Module Disabled After Update

**Fix:**
1. Disable module in world settings
2. Re-enable module
3. Refresh browser (F5)

---

#### "Module is incompatible" Error

**Check:**
1. `module.json` has correct `compatibility`:
   ```json
   "compatibility": {
     "minimum": "11",
     "verified": "12"
   }
   ```
2. Update compatibility versions if needed
3. Rebuild and reinstall

---

### Common Questions

#### Q: Do I need to run `npm install`?

**A:** Only if you want the `archiver` package for optimal ZIP compression:
```bash
npm install archiver
```

Otherwise, build system uses fallback methods.

---

#### Q: Can I build without validation?

**A:** Yes, for testing only:
```bash
node build.js --skip-validation
```

Never use `--skip-validation` for releases.

---

#### Q: How do I update the version number?

**A:** Update both files:
1. `module.json`: `"version": "2.1.0"`
2. `package.json`: `"version": "2.1.0"`
3. Add CHANGELOG entry
4. Run `npm run build:production` to validate

---

#### Q: Can I customize what gets included in the build?

**A:** Yes, edit the `INCLUDE` array in `build.js`:
```javascript
const INCLUDE = [
  'module.json',
  'README.md',
  'CHANGELOG.md',
  'scripts/',
  'styles/',
  'sounds/',
  'my-custom-file.txt'  // Add custom files
];
```

---

#### Q: How do I test the build without installing to Foundry?

**A:** Inspect the `dist/toast/` folder:
```bash
npm run build
cd dist/toast
dir   # Windows
ls    # Linux/Mac

# Check concatenated file
cat scripts/toast.js
```

---

#### Q: What if I only want to build, not create a ZIP?

**A:** Use the build-only command:
```bash
npm run build
```

ZIP creation is optional.

---

#### Q: Can I run builds in parallel?

**A:** No, build scripts should run sequentially. However, `npm run build:zip` automatically runs build first.

---

## Additional Resources

### Related Documentation
- **README.md** - User guide for the Toast module
- **CHANGELOG.md** - Version history and changes
- **module.json** - Module manifest and metadata

### Foundry VTT Resources
- [Module Development Guide](https://foundryvtt.com/article/module-development/)
- [Package Manifest Specification](https://foundryvtt.com/article/module-manifest/)
- [Foundry VTT Package API](https://foundryvtt.com/api/)

### Build System Details
- **build.js** - Main build script source
- **build-zip.js** - ZIP creation script source
- **package.json** - NPM script definitions

---

## Support

### Getting Help

**Build Issues:**
- Check this BUILD.md document
- Review error messages carefully
- Run with `--verbose` for detailed output
- Check [GitHub Issues](https://github.com/yourusername/toast/issues)

**Module Issues:**
- Check README.md
- Review CHANGELOG.md for known issues
- Search existing GitHub issues
- Open new issue with details

**Community Support:**
- r/FoundryVTT on Reddit
- FoundryVTT Discord server
- GitHub Discussions

---

## License

The Toast module and build system are released under the MIT License.

---

**Last Updated:** 2025-01-15
**Build System Version:** 2.0.0
**Minimum Node.js:** v14.0.0
