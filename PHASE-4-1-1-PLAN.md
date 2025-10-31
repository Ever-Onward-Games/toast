# Phase 4.1.1 - Asset Browser Enhancement

**Status:** In Progress (Step 2 Complete)
**Current Version:** 2.4.0-alpha.2
**Version Target:** 2.4.0
**Estimated Complexity:** Medium
**Dependencies:** Phase 4.1 (Toast Studio - completed)

---

## Progress Summary

**Completed:**
- ✅ Step 1 (v2.4.0-alpha.1) - Template Structure with sub-tabs and directory listings
- ✅ Step 2 (v2.4.0-alpha.2) - Directory Management Backend with CRUD operations

**Next:**
- 🔄 Step 3 (v2.4.0-alpha.3) - Multi-Directory Scanning to populate Audio/Images tabs

**Remaining:**
- Step 4 - Animated Image Support
- Step 5 - UI/UX Implementation (FilePicker integration)
- Step 6 - Asset Display Enhancement
- Step 7 - Testing & Polish (Beta)
- Step 8 - Release (2.4.0)

---

## Overview

Enhance the Assets tab in Toast Studio with sub-tabs for better organization and add support for custom asset directories and animated images.

## Goals

1. Add sub-tab navigation within Assets tab (Directories, Images, Audio)
2. Implement custom directory management for user-added asset locations
3. Automatically include default directories and registered announcer packs
4. Support animated image formats (GIF, WebP with animation, APNG)
5. Improve asset discovery across multiple directory sources

---

## Current State

**What Exists:**
- Assets tab in Toast Studio (single view)
- Audio file browsing from `modules/toast/sounds`
- Image file browsing from `modules/toast/images`
- Registered announcer pack system
- File type detection for static images and audio

**Limitations:**
- No way to browse user's own asset directories
- Audio and images mixed in single tab
- No support for animated images
- Limited to module's built-in directories

---

## Proposed Solution

### 1. Sub-Tab Navigation Structure

```
Toast Studio
├── Assets Tab ← (Main tab)
│   ├── Directories Sub-Tab
│   │   ├── Default directories (read-only, shown for reference)
│   │   ├── Registered announcer packs (read-only)
│   │   └── Custom directories (user-managed, CRUD operations)
│   ├── Audio Sub-Tab
│   │   └── All audio files from all sources
│   └── Images Sub-Tab
│       └── All images (static + animated) from all sources
├── Packages Tab
└── Studio Tab
```

### 2. Directory Management Features

**Directory Types:**
1. **Default Directories** (Auto-included, shown for info)
   - `modules/toast/sounds` (audio)
   - `modules/toast/images` (images)
   - Read-only, cannot be removed

2. **Registered Announcer Packs** (Auto-included from API)
   - Any packs registered via `game.toast.registerAnnouncer()`
   - Read-only, managed by modules
   - Show which module registered them

3. **Custom Directories** (User-managed)
   - User can add any accessible directory path
   - Stored in client settings (per-user)
   - Full CRUD: Add, Edit, Remove
   - Optional nickname/label per directory
   - Type filtering: Audio, Images, or Both

**Directory Management UI:**
- Button: "+ Add Directory"
- Directory picker dialog using FilePicker
- Each entry shows: path, type (audio/images/both), actions (edit, remove)
- Validation: Check if directory exists and is accessible
- Preview: Show file count after adding

### 3. Enhanced File Discovery

**Asset Scanning:**
- Scan all directory sources when Assets tab opens
- Cache results during session
- Refresh button to rescan all sources
- Show loading indicator during scan
- Display total counts per type

**File Filtering:**
- Search box filters across ALL sources
- Category filter includes source type (default, announcer, custom)
- Visual indicator showing which directory each asset comes from

### 4. Animated Image Support

**Supported Formats:**
- `.gif` - Animated GIF (already readable by browsers)
- `.webp` - Animated WebP
- `.apng` - Animated PNG (if browser supports)

**Display:**
- Thumbnails show animation in asset list
- Preview plays animation
- Visual indicator (icon/badge) for animated images
- Fallback to first frame if animation fails

**Detection:**
- Check file extension
- Optional: Inspect file headers to confirm animation frames
- Mark in asset metadata: `{ animated: true }`

---

## Technical Implementation

### A. Template Changes

**1. Add Sub-Tab Navigation to Assets Tab**

`templates/partials/assets-tab.hbs` - Add sub-tabs:
```handlebars
<div class="tab-panel {{#if tabs.assets.active}}active{{/if}}" data-tab="assets">
  <div class="assets-container">

    {{!-- Sub-Tab Navigation --}}
    <nav class="assets-subtabs" data-group="assets-subtabs">
      <a class="subtab {{#if assetsSubTab.directories.active}}active{{/if}}"
         data-subtab="directories">
        <i class="fas fa-folder"></i> Directories
      </a>
      <a class="subtab {{#if assetsSubTab.audio.active}}active{{/if}}"
         data-subtab="audio">
        <i class="fas fa-music"></i> Audio
      </a>
      <a class="subtab {{#if assetsSubTab.images.active}}active{{/if}}"
         data-subtab="images">
        <i class="fas fa-image"></i> Images
      </a>
    </nav>

    {{!-- Sub-Tab Content --}}
    <div class="assets-subtab-content">
      {{> "modules/toast/templates/partials/directories-subtab.hbs"}}
      {{> "modules/toast/templates/partials/audio-subtab.hbs"}}
      {{> "modules/toast/templates/partials/images-subtab.hbs"}}
    </div>

  </div>
</div>
```

**2. Create New Partials**

`templates/partials/directories-subtab.hbs`:
- List of default directories (read-only)
- List of registered announcer packs (read-only)
- List of custom directories with CRUD controls
- "+ Add Directory" button

`templates/partials/audio-subtab.hbs`:
- Toolbar (search, filter, refresh)
- Audio file list from all sources
- Source indicator per item

`templates/partials/images-subtab.hbs`:
- Toolbar (search, filter by animated/static, refresh)
- Image grid/list from all sources
- Animated badge for animated images
- Source indicator per item

**3. New Component Partials**

`templates/partials/directory-item.hbs`:
- Display directory info (path, type, source)
- Edit/Remove buttons for custom directories
- File count badge

### B. JavaScript Changes

**1. Update ToastStudioApp.js**

```javascript
class ToastStudioApp extends FormApplication {
  constructor(options = {}) {
    super({}, options);
    this.activeTab = options.tab || "assets";
    this.activeAssetsSubTab = options.assetsSubTab || "audio"; // Default to audio
    this.customDirectories = []; // Load from settings
  }

  async getData() {
    const data = await super.getData();

    if (this.activeTab === "assets") {
      data.assetsSubTab = {
        directories: {
          id: "directories",
          active: this.activeAssetsSubTab === "directories"
        },
        audio: {
          id: "audio",
          active: this.activeAssetsSubTab === "audio"
        },
        images: {
          id: "images",
          active: this.activeAssetsSubTab === "images"
        }
      };

      data.directories = await this._getDirectoriesData();
      data.assets = await this._getAssetData();
    }

    return data;
  }

  async _getDirectoriesData() {
    return {
      default: this._getDefaultDirectories(),
      announcers: this._getAnnouncerPackDirectories(),
      custom: this._getCustomDirectories()
    };
  }

  _getDefaultDirectories() {
    return [
      { path: "modules/toast/sounds", type: "audio", source: "default" },
      { path: "modules/toast/images", type: "images", source: "default" }
    ];
  }

  _getAnnouncerPackDirectories() {
    // Get from ToastManager.registeredAnnouncers
    const announcers = [];
    for (const [id, config] of Object.entries(ToastManager.registeredAnnouncers || {})) {
      announcers.push({
        id: id,
        path: config.path,
        name: config.name,
        type: "audio",
        source: "announcer"
      });
    }
    return announcers;
  }

  _getCustomDirectories() {
    // Load from client settings
    return game.settings.get("toast", "custom-asset-directories") || [];
  }

  async _scanAllDirectories() {
    const directories = await this._getDirectoriesData();
    const allDirs = [
      ...directories.default,
      ...directories.announcers,
      ...directories.custom
    ];

    const results = {
      audio: [],
      images: []
    };

    for (const dir of allDirs) {
      if (dir.type === "audio" || dir.type === "both") {
        const audioFiles = await this._scanDirectory(dir.path, "audio");
        results.audio.push(...audioFiles);
      }
      if (dir.type === "images" || dir.type === "both") {
        const imageFiles = await this._scanDirectory(dir.path, "images");
        results.images.push(...imageFiles);
      }
    }

    return results;
  }

  async _scanDirectory(path, type) {
    const files = [];
    try {
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      const result = await FilePicker.browse("data", path);

      if (result.files) {
        for (const file of result.files) {
          if (type === "audio" && this._isAudioFile(file)) {
            files.push(this._createAudioAsset(file, path));
          } else if (type === "images" && this._isImageFile(file)) {
            files.push(this._createImageAsset(file, path));
          }
        }
      }
    } catch (err) {
      console.warn(`Toast Studio | Error scanning directory ${path}:`, err);
    }
    return files;
  }

  _isImageFile(path) {
    const ext = path.split(".").pop().toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "svg", "apng"].includes(ext);
  }

  _isAnimatedImage(path) {
    const ext = path.split(".").pop().toLowerCase();
    // Note: Can't definitively determine without reading file
    // This is a heuristic based on extension
    return ["gif", "webp", "apng"].includes(ext);
  }

  _createImageAsset(path, sourcePath) {
    return {
      path: path,
      name: path.split("/").pop(),
      source: sourcePath,
      thumbnail: path,
      animated: this._isAnimatedImage(path)
    };
  }

  _createAudioAsset(path, sourcePath) {
    return {
      path: path,
      name: path.split("/").pop(),
      source: sourcePath,
      category: this._getAudioCategory(path)
    };
  }

  // Directory CRUD operations
  async addCustomDirectory(dirPath, type, label) {
    const directories = this._getCustomDirectories();
    directories.push({
      id: foundry.utils.randomID(),
      path: dirPath,
      type: type,
      label: label || dirPath,
      addedAt: Date.now()
    });
    await game.settings.set("toast", "custom-asset-directories", directories);
    this.render();
  }

  async removeCustomDirectory(id) {
    const directories = this._getCustomDirectories();
    const filtered = directories.filter(d => d.id !== id);
    await game.settings.set("toast", "custom-asset-directories", filtered);
    this.render();
  }

  async editCustomDirectory(id, updates) {
    const directories = this._getCustomDirectories();
    const index = directories.findIndex(d => d.id === id);
    if (index >= 0) {
      directories[index] = { ...directories[index], ...updates };
      await game.settings.set("toast", "custom-asset-directories", directories);
      this.render();
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Sub-tab navigation
    html.find(".assets-subtabs .subtab").click(this._onSubTabClick.bind(this));

    // Directory management
    html.find(".add-directory-btn").click(this._onAddDirectory.bind(this));
    html.find(".edit-directory-btn").click(this._onEditDirectory.bind(this));
    html.find(".remove-directory-btn").click(this._onRemoveDirectory.bind(this));
  }

  _onSubTabClick(event) {
    event.preventDefault();
    const subtab = event.currentTarget.dataset.subtab;
    this.activeAssetsSubTab = subtab;
    this.render();
  }

  async _onAddDirectory(event) {
    event.preventDefault();

    // Show directory picker dialog
    // Could use FilePicker or custom dialog

    // For now, simple prompt (enhance later)
    const path = await this._promptForDirectory();
    if (!path) return;

    const type = await this._promptForDirectoryType();
    if (!type) return;

    const label = await this._promptForDirectoryLabel(path);

    await this.addCustomDirectory(path, type, label);
  }

  async _onEditDirectory(event) {
    event.preventDefault();
    const id = event.currentTarget.closest(".directory-item").dataset.directoryId;
    // Show edit dialog
    // ... implementation
  }

  async _onRemoveDirectory(event) {
    event.preventDefault();
    const id = event.currentTarget.closest(".directory-item").dataset.directoryId;

    const confirmed = await Dialog.confirm({
      title: "Remove Directory",
      content: "<p>Remove this directory from asset scanning?</p>",
      yes: () => true,
      no: () => false
    });

    if (confirmed) {
      await this.removeCustomDirectory(id);
    }
  }
}
```

**2. Add New Settings**

In `ToastManager.js` `registerSettings()`:

```javascript
// Custom Asset Directories (Client-scoped)
game.settings.register(this.MODULE_ID, "custom-asset-directories", {
  name: "Custom Asset Directories",
  hint: "User-added directories for custom audio and image assets.",
  scope: "client",
  config: false, // Hidden - managed via Toast Studio
  type: Array,
  default: []
});

// Assets Default Sub-Tab (Client-scoped)
game.settings.register(this.MODULE_ID, "assets-default-subtab", {
  name: "Assets Default Sub-Tab",
  hint: "Which sub-tab to show when opening Assets tab.",
  scope: "client",
  config: true,
  type: String,
  choices: {
    "directories": "Directories",
    "audio": "Audio",
    "images": "Images"
  },
  default: "audio"
});
```

### C. SCSS Styling Changes

**1. Add Sub-Tab Styles**

`styles/components/_assets-tab.scss`:

```scss
#toast-studio {
  // Assets Sub-Tabs
  .assets-subtabs {
    display: flex;
    border-bottom: 2px solid var(--color-border-dark);
    margin-bottom: 1rem;
    gap: 0;

    .subtab {
      flex: 1;
      padding: 0.5rem 1rem;
      background: var(--color-bg-option);
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      font-weight: 500;
      color: var(--color-text-dark-secondary);

      &:hover {
        background: var(--color-bg-btn);
        color: var(--color-text-dark-primary);
      }

      &.active {
        background: var(--color-bg);
        border-bottom-color: var(--color-border-highlight);
        color: var(--color-text-dark-primary);
      }

      i {
        margin-right: 0.5rem;
      }
    }
  }

  .assets-subtab-content {
    .subtab-panel {
      display: none;

      &.active {
        display: block;
      }
    }
  }

  // Directories Sub-Tab
  .directories-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .directory-section {
    h4 {
      color: var(--color-text-dark-primary);
      margin-bottom: 0.5rem;
      font-size: 1rem;
      border-bottom: 1px solid var(--color-border-dark);
      padding-bottom: 0.25rem;
    }
  }

  .directory-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border-dark);
    border-radius: 4px;

    .directory-icon {
      font-size: 1.5rem;
      color: var(--color-border-highlight);
    }

    .directory-info {
      flex: 1;
      min-width: 0;

      .directory-label {
        font-weight: 600;
        color: var(--color-text-dark-primary);
      }

      .directory-path {
        font-size: 0.85rem;
        color: var(--color-text-dark-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .directory-meta {
        font-size: 0.75rem;
        color: var(--color-text-dark-secondary);
        margin-top: 0.25rem;
      }
    }

    .directory-actions {
      display: flex;
      gap: 0.5rem;

      button {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-bg-btn);
        border: 1px solid var(--color-border-dark);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--color-border-highlight);
          color: white;
        }
      }
    }
  }

  // Add Directory Button
  .add-directory-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-bg-btn);
    border: 1px dashed var(--color-border-dark);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;

    &:hover {
      border-color: var(--color-border-highlight);
      background: var(--color-bg-option);
    }

    i {
      margin-right: 0.5rem;
    }
  }

  // Animated Image Badge
  .animated-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }
}
```

---

## Implementation Steps

### Step 1: Template Structure (2.4.0-alpha.1) ✅ COMPLETE
- [x] Add sub-tab navigation to assets-tab.hbs
- [x] Create directories-subtab.hbs partial
- [x] Create audio-subtab.hbs partial
- [x] Create images-subtab.hbs partial
- [x] Create directory-item.hbs component
- [x] Update SCSS with sub-tab styles
- [x] Preload new partials in ToastManager

### Step 2: Directory Management Backend (2.4.0-alpha.2) ✅ COMPLETE
- [x] Add custom-asset-directories setting
- [x] Add assets-default-subtab setting
- [x] Implement _getDirectoriesData() method
- [x] Implement _getDefaultDirectories() method
- [x] Implement _getAnnouncerPackDirectories() method
- [x] Implement _getCustomDirectories() method
- [x] Add directory CRUD methods to ToastStudioApp

### Step 3: Multi-Directory Scanning (2.4.0-alpha.3)
- [ ] Implement _scanAllDirectories() method
- [ ] Implement _scanDirectory() with source tracking
- [ ] Update _createAudioAsset() to include source
- [ ] Update _createImageAsset() to include source
- [ ] Add loading indicators during scan
- [ ] Cache scan results during session

### Step 4: Animated Image Support (2.4.0-alpha.4)
- [ ] Update _isImageFile() to include animated formats
- [ ] Implement _isAnimatedImage() detection
- [ ] Add animated property to image assets
- [ ] Add animated badge to image thumbnails
- [ ] Update image-asset-item.hbs to show badge
- [ ] Test GIF, WebP, APNG playback

### Step 5: UI/UX Implementation (2.4.0-alpha.5)
- [ ] Implement sub-tab switching
- [ ] Add "+ Add Directory" button and dialog
- [ ] Implement directory picker using FilePicker
- [ ] Add directory type selection dialog
- [ ] Add directory label input dialog
- [ ] Implement edit directory functionality
- [ ] Implement remove directory with confirmation
- [ ] Add directory validation and error handling

### Step 6: Asset Display Enhancement (2.4.0-alpha.6)
- [ ] Add source indicator to asset items
- [ ] Update filter to include source type
- [ ] Show total asset counts per sub-tab
- [ ] Add "source" badge to each asset
- [ ] Update search to work across all sources
- [ ] Add per-source collapse/expand (optional)

### Step 7: Testing & Polish (2.4.0-beta)
- [ ] Test with multiple custom directories
- [ ] Test with registered announcer packs
- [ ] Test animated image detection and display
- [ ] Test directory CRUD operations
- [ ] Test performance with large asset counts
- [ ] Add error handling for inaccessible directories
- [ ] Add tooltips and help text
- [ ] Update user documentation

### Step 8: Release (2.4.0)
- [ ] Final testing
- [ ] Update CHANGELOG
- [ ] Update README with new features
- [ ] Create release notes
- [ ] Tag release

---

## Data Structures

### Custom Directory Object
```javascript
{
  id: "abc123",                    // Unique ID
  path: "worlds/my-world/audio",   // Directory path
  type: "audio" | "images" | "both", // Content type
  label: "My Campaign Audio",      // Display label
  addedAt: 1234567890              // Timestamp
}
```

### Asset Object (Enhanced)
```javascript
{
  path: "full/path/to/file.png",
  name: "file.png",
  source: "modules/toast/images",  // Source directory
  sourceType: "default" | "announcer" | "custom",
  thumbnail: "path/to/thumbnail",
  animated: true,                  // For images only
  category: "Combat"               // For audio only
}
```

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Toast Studio                                      [X]   │
├─────────────────────────────────────────────────────────┤
│ [Assets] [Packages] [Studio]                            │
├─────────────────────────────────────────────────────────┤
│ Assets                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Directories] [Audio] [Images]                      │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ Audio Sub-Tab                                       │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ [Search...      ] [Category ▼] [Refresh]        │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │ Audio Files (127 files)                            │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ 🎵 double-kill.wav         [🔊] [📋]          │  │ │
│ │ │ Source: modules/toast/sounds                   │  │ │
│ │ ├───────────────────────────────────────────────┤  │ │
│ │ │ 🎵 epic-win.mp3            [🔊] [📋]          │  │ │
│ │ │ Source: worlds/my-world/audio                  │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Sub-tabs switch correctly
- [ ] Default directories appear in Directories tab
- [ ] Registered announcer packs appear in Directories tab
- [ ] Can add custom directory
- [ ] Can edit custom directory
- [ ] Can remove custom directory
- [ ] Audio files from all sources appear in Audio tab
- [ ] Images from all sources appear in Images tab
- [ ] Animated GIFs display correctly
- [ ] Animated WebP displays correctly
- [ ] Source indicator shows on each asset
- [ ] Search works across all sources
- [ ] Filter works correctly
- [ ] Refresh rescans all directories
- [ ] Settings persist across sessions
- [ ] Performance acceptable with 500+ assets

---

## Future Enhancements (Post 2.4.0)

- Recursive directory scanning (include subdirectories)
- Drag-and-drop directory adding
- Directory groups/favorites
- Asset tagging system
- Asset collections/playlists
- Cloud storage integration (S3, Google Drive)
- Asset preview with waveform (audio) / animation controls (images)
- Bulk operations (import, export, delete)
- Asset metadata editor
- Search by file size, date added, etc.
