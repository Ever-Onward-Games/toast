# Build Instructions

This document explains how to build the Toast module for distribution.

## Quick Start

```bash
# Build the module
npm run build

# Build and create ZIP
npm run build:zip

# Clean build artifacts
npm run clean
```

## Requirements

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

Optional:
- **archiver** package (for automatic ZIP creation)

## Build Commands

### `npm run build`

Creates a distributable version of the module in the `dist/toast/` folder.

**What it does:**
- Cleans the `dist/` directory
- Creates a fresh `dist/toast/` folder
- Copies all module files (scripts, styles, documentation)
- Excludes development files (.git, .idea, node_modules, etc.)

**Output:**
```
dist/
└── toast/
    ├── module.json
    ├── README.md
    ├── CHANGELOG.md
    ├── EXAMPLES.md
    ├── ADVANCED-ANIMATIONS.md
    ├── scripts/
    │   └── toast.js
    └── styles/
        └── toast.css
```

### `npm run build:zip`

Builds the module and creates a `toast.zip` file for easy distribution.

**What it does:**
1. Runs `npm run build`
2. Creates `dist/toast.zip` containing the module

**ZIP Methods (in order of preference):**
1. **archiver** package (if installed) - Best compression
2. **PowerShell Compress-Archive** (Windows fallback)
3. **zip command** (Linux/Mac fallback)
4. **Manual instructions** (if none available)

To install archiver for better compression:
```bash
npm install archiver
```

### `npm run clean`

Removes the entire `dist/` folder and all build artifacts.

## Installation for Development

If you're developing the module locally, you can create a symlink or copy the files:

### Option 1: Copy to Foundry (Recommended)

```bash
npm run build
# Then copy dist/toast/ to your Foundry Data/modules/ directory
```

### Option 2: Direct Development

You can also work directly in your Foundry `Data/modules/toast/` folder without building.

## Distribution

### For GitHub Releases

1. Build the ZIP:
   ```bash
   npm run build:zip
   ```

2. Create a new release on GitHub

3. Upload `dist/toast.zip` as a release asset

4. Update your `module.json` download URL to point to the release

### For Foundry Package Manager

1. Ensure your `module.json` has correct URLs:
   ```json
   {
     "url": "https://github.com/yourusername/toast",
     "manifest": "https://github.com/yourusername/toast/releases/latest/download/module.json",
     "download": "https://github.com/yourusername/toast/releases/latest/download/toast.zip"
   }
   ```

2. Create a release with the ZIP file

3. Submit to Foundry VTT package listings

## File Structure

### Included in Distribution
- `module.json` - Module manifest
- `README.md` - User documentation
- `CHANGELOG.md` - Version history
- `EXAMPLES.md` - Macro examples
- `ADVANCED-ANIMATIONS.md` - Advanced feature guide
- `scripts/toast.js` - Main module code
- `styles/toast.css` - Styling

### Excluded from Distribution
- `.git/` - Git repository
- `.idea/`, `.vscode/` - IDE settings
- `node_modules/` - Development dependencies
- `dist/` - Build output (not recursive)
- `build.js`, `build-zip.js` - Build scripts
- `package.json`, `package-lock.json` - npm config
- `.gitignore` - Git ignore rules
- `.claude/` - Claude Code settings

## Troubleshooting

### "Module directory not found" when running build:zip

Run `npm run build` first before trying to create a ZIP.

### Permission errors on Windows

Run your terminal as Administrator, or check that the `dist/` folder isn't open in File Explorer.

### ZIP creation fails

**Solution 1:** Install archiver
```bash
npm install archiver
npm run build:zip
```

**Solution 2:** Create manually
1. Run `npm run build`
2. Navigate to `dist/`
3. Right-click the `toast` folder
4. Select "Send to > Compressed (zipped) folder"
5. Rename to `toast.zip`

### Build script fails on Linux/Mac

Make sure you have Node.js installed:
```bash
node --version
npm --version
```

If not installed:
- **Ubuntu/Debian**: `sudo apt install nodejs npm`
- **Mac**: `brew install node`

## Development Workflow

1. **Make changes** to source files
2. **Test locally** in your Foundry instance
3. **Run build** when ready to distribute
   ```bash
   npm run build
   ```
4. **Test the dist version** by copying `dist/toast/` to Foundry
5. **Create ZIP** for release
   ```bash
   npm run build:zip
   ```
6. **Commit changes** to Git
7. **Create GitHub release** with the ZIP

## Version Updates

When releasing a new version:

1. Update `version` in `module.json`
2. Update `version` in `package.json`
3. Add entry to `CHANGELOG.md`
4. Commit changes
5. Build and create release
6. Tag the release with version number (e.g., `v1.1.0`)

## Questions?

- Check the [README.md](README.md) for module usage
- Check the [EXAMPLES.md](EXAMPLES.md) for macro examples
- Open an issue on GitHub for build problems
