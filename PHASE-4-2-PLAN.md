# Phase 4.2 - Package Manager Implementation Plan

**Status:** Planning
**Current Version:** 2.4.0-beta.4
**Version Target:** 2.5.0
**Estimated Complexity:** Medium-High
**Dependencies:** Phase 4.1 (Asset Browser - completed)

---

## Progress Summary

**Planning:**
- 🔄 Step 1 - Package schema and data structures
- ⏳ Step 2 - PackageManager class implementation
- ⏳ Step 3 - File I/O and storage
- ⏳ Step 4 - Package browser UI
- ⏳ Step 5 - CRUD operations
- ⏳ Step 6 - Quick launch functionality
- ⏳ Step 7 - Import/export features
- ⏳ Step 8 - Testing & Polish
- ⏳ Step 9 - Release (2.5.0)

---

## Overview

Phase 4.2 adds a **Package Manager** to Toast Studio, allowing users to:
- Save toast configurations as reusable packages
- Browse and organize saved packages
- Quick launch packages with token mapping
- Import/export packages for sharing
- Manage package dependencies (assets)

This transforms Toast from a one-time creation tool into a reusable content library.

---

## Goals

1. **Package Creation** - Save current toast config as a named, reusable package
2. **Package Storage** - Persist packages as JSON files (world or global scope)
3. **Package Browser** - Visual interface to browse, search, and filter packages
4. **Quick Launch** - Launch packages with runtime token mapping
5. **CRUD Operations** - Create, Read, Update, Delete packages
6. **Import/Export** - Share packages as downloadable JSON files
7. **Dependency Tracking** - Validate asset references before launch

---

## Package Schema

### Package Object Structure

```javascript
{
  // Metadata
  id: "boss-kill-epic",                    // Unique identifier
  name: "Boss Kill - Epic Dragon",          // Display name
  description: "Epic celebration for defeating a dragon boss with fire effects",
  version: "1.0.0",                         // Package version (semver)

  // Authorship
  author: "Dynvar",                         // Creator username
  createdAt: "2025-10-31T12:00:00Z",       // ISO timestamp
  updatedAt: "2025-10-31T15:30:00Z",       // Last modified

  // Organization
  category: "combat",                       // Category: combat, social, exploration, custom
  tags: ["boss", "victory", "epic", "dragon"], // Searchable tags

  // Visual
  thumbnail: "modules/toast/images/dragon-thumb.png", // Package icon/preview

  // Scope
  scope: "world",                           // "world" or "global"
  worldId: "my-campaign-world",             // Only if scope=world

  // Toast Configuration
  config: {
    // Duration and display
    duration: 5000,                         // milliseconds
    fadeIn: 1000,
    fadeOut: 1000,

    // Elements array
    elements: [
      {
        id: "text-1",
        type: "text",
        text: "{{killerName}} DEFEATS {{bossName}}!",
        color: "#FFD700",
        fontSize: "100px",
        fontFamily: "Impact",
        textAlign: "center",
        animation: {
          type: "slide",
          from: { x: -200, y: 360 },
          to: { x: 640, y: 360 },
          duration: 1000,
          delay: 0,
          easing: "easeOutBounce"
        }
      },
      {
        id: "image-1",
        type: "image",
        src: "modules/toast/images/dragon.png",
        width: "400px",
        height: "400px",
        animation: {
          type: "fade",
          from: { opacity: 0, scale: 0.5 },
          to: { opacity: 1, scale: 1.2 },
          duration: 1500,
          delay: 500,
          easing: "easeOutElastic"
        }
      },
      {
        id: "sound-1",
        type: "sound",
        src: "modules/toast/sounds/victory.wav",
        volume: 0.8,
        delay: 0
      }
    ]
  },

  // Token Placeholders (what gets replaced at launch)
  tokens: {
    killerName: {
      label: "Killer Name",
      description: "The character who defeated the boss",
      type: "string",
      default: "Hero"
    },
    bossName: {
      label: "Boss Name",
      description: "The boss that was defeated",
      type: "string",
      default: "Dragon"
    }
  },

  // Asset Dependencies (for validation)
  dependencies: {
    images: [
      "modules/toast/images/dragon.png"
    ],
    sounds: [
      "modules/toast/sounds/victory.wav"
    ]
  }
}
```

---

## Data Storage

### File Structure

```
Data/
├── modules/toast/packages/               ← Global packages (all worlds)
│   ├── boss-kill-epic.json
│   ├── critical-hit-fire.json
│   └── clutch-heal.json
│
└── worlds/
    └── my-campaign-world/
        └── toast-packages/               ← World-specific packages
            ├── npc-death-custom.json
            └── quest-complete.json
```

### Storage Strategy

**Global Packages:**
- Stored in `Data/modules/toast/packages/`
- Available in all worlds
- Use for generic/reusable content
- Filename: `{package-id}.json`

**World Packages:**
- Stored in `Data/worlds/{worldId}/toast-packages/`
- Only available in that world
- Use for campaign-specific content
- Filename: `{package-id}.json`

**File Naming:**
- Package ID derived from name: `"Boss Kill - Epic"` → `boss-kill-epic`
- Sanitize: lowercase, replace spaces/special chars with hyphens
- Ensure uniqueness with counter if collision: `boss-kill-epic-2`

---

## API Design

### PackageManager Class

```javascript
class PackageManager {
  constructor() {
    this.packages = new Map(); // id -> Package
    this.loaded = false;
  }

  /**
   * Load all packages from disk (global + world)
   */
  async loadAll() {
    await this._loadGlobalPackages();
    await this._loadWorldPackages();
    this.loaded = true;
  }

  /**
   * Create a new package
   * @param {Object} config - Package configuration
   * @returns {Package} Created package
   */
  async create(config) {
    const pkg = new Package(config);
    await pkg.validate();
    await this._save(pkg);
    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  /**
   * Get package by ID
   * @param {string} id - Package ID
   * @returns {Package|null}
   */
  get(id) {
    return this.packages.get(id) || null;
  }

  /**
   * List all packages with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Package[]}
   */
  list(filters = {}) {
    let packages = Array.from(this.packages.values());

    if (filters.category) {
      packages = packages.filter(p => p.category === filters.category);
    }

    if (filters.tags) {
      packages = packages.filter(p =>
        filters.tags.every(tag => p.tags.includes(tag))
      );
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      packages = packages.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    if (filters.scope) {
      packages = packages.filter(p => p.scope === filters.scope);
    }

    return packages;
  }

  /**
   * Update an existing package
   * @param {string} id - Package ID
   * @param {Object} updates - Properties to update
   * @returns {Package}
   */
  async update(id, updates) {
    const pkg = this.get(id);
    if (!pkg) throw new Error(`Package not found: ${id}`);

    pkg.update(updates);
    await pkg.validate();
    await this._save(pkg);

    return pkg;
  }

  /**
   * Delete a package
   * @param {string} id - Package ID
   */
  async delete(id) {
    const pkg = this.get(id);
    if (!pkg) throw new Error(`Package not found: ${id}`);

    await this._deleteFile(pkg);
    this.packages.delete(id);
  }

  /**
   * Launch a package with token mapping
   * @param {string} id - Package ID
   * @param {Object} tokenMap - Token value mapping
   * @param {Object} options - Launch options
   */
  async launch(id, tokenMap = {}, options = {}) {
    const pkg = this.get(id);
    if (!pkg) throw new Error(`Package not found: ${id}`);

    // Validate dependencies
    const missing = await pkg.validateDependencies();
    if (missing.length > 0) {
      throw new Error(`Missing dependencies: ${missing.join(", ")}`);
    }

    // Apply token replacements
    const config = pkg.applyTokens(tokenMap);

    // Launch the toast
    return await game.toast.show(config);
  }

  /**
   * Export package as JSON
   * @param {string} id - Package ID
   * @returns {string} JSON string
   */
  export(id) {
    const pkg = this.get(id);
    if (!pkg) throw new Error(`Package not found: ${id}`);

    return JSON.stringify(pkg.toJSON(), null, 2);
  }

  /**
   * Import package from JSON
   * @param {string|Object} json - JSON string or parsed object
   * @returns {Package}
   */
  async import(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    // Generate new ID if collision
    let id = data.id;
    let counter = 2;
    while (this.packages.has(id)) {
      id = `${data.id}-${counter}`;
      counter++;
    }

    data.id = id;
    return await this.create(data);
  }

  /**
   * Duplicate an existing package
   * @param {string} id - Package ID to duplicate
   * @param {string} newName - Name for the duplicate
   * @returns {Package}
   */
  async duplicate(id, newName) {
    const original = this.get(id);
    if (!original) throw new Error(`Package not found: ${id}`);

    const data = original.toJSON();
    data.name = newName;
    data.id = this._generateId(newName);
    delete data.createdAt;
    delete data.updatedAt;

    return await this.create(data);
  }

  // Private methods
  async _loadGlobalPackages() { /* ... */ }
  async _loadWorldPackages() { /* ... */ }
  async _save(pkg) { /* ... */ }
  async _deleteFile(pkg) { /* ... */ }
  _generateId(name) { /* ... */ }
}
```

### Package Class

```javascript
class Package {
  constructor(data) {
    this.id = data.id || this._generateId(data.name);
    this.name = data.name;
    this.description = data.description || "";
    this.version = data.version || "1.0.0";

    this.author = data.author || game.user.name;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    this.category = data.category || "custom";
    this.tags = data.tags || [];
    this.thumbnail = data.thumbnail || "";

    this.scope = data.scope || "world";
    this.worldId = data.worldId || game.world.id;

    this.config = data.config;
    this.tokens = data.tokens || {};
    this.dependencies = data.dependencies || { images: [], sounds: [] };
  }

  /**
   * Validate package data
   */
  async validate() {
    if (!this.name) throw new Error("Package name is required");
    if (!this.config) throw new Error("Package config is required");
    if (!this.config.elements) throw new Error("Package must have elements");

    // Validate element structure
    for (const element of this.config.elements) {
      if (!element.type) throw new Error("Element missing type");
      if (!element.id) throw new Error("Element missing id");
    }

    return true;
  }

  /**
   * Validate that all asset dependencies exist
   * @returns {string[]} Array of missing asset paths
   */
  async validateDependencies() {
    const missing = [];

    for (const imagePath of this.dependencies.images) {
      const exists = await this._assetExists(imagePath);
      if (!exists) missing.push(imagePath);
    }

    for (const soundPath of this.dependencies.sounds) {
      const exists = await this._assetExists(soundPath);
      if (!exists) missing.push(soundPath);
    }

    return missing;
  }

  /**
   * Apply token replacements to config
   * @param {Object} tokenMap - Token values
   * @returns {Object} Config with tokens replaced
   */
  applyTokens(tokenMap) {
    const config = foundry.utils.deepClone(this.config);

    // Replace tokens in text elements
    for (const element of config.elements) {
      if (element.type === "text" && element.text) {
        element.text = this._replaceTokens(element.text, tokenMap);
      }
    }

    return config;
  }

  /**
   * Update package properties
   */
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convert to JSON for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      category: this.category,
      tags: this.tags,
      thumbnail: this.thumbnail,
      scope: this.scope,
      worldId: this.worldId,
      config: this.config,
      tokens: this.tokens,
      dependencies: this.dependencies
    };
  }

  // Private methods
  _generateId(name) { /* ... */ }
  async _assetExists(path) { /* ... */ }
  _replaceTokens(text, tokenMap) { /* ... */ }
}
```

### Public API (game.toast.packages)

```javascript
// Initialize
game.toast.packages = new PackageManager();
await game.toast.packages.loadAll();

// Create
const pkg = await game.toast.packages.create({
  name: "Boss Kill - Epic",
  category: "combat",
  config: { elements: [...] }
});

// List
const allPackages = game.toast.packages.list();
const combatPackages = game.toast.packages.list({ category: "combat" });
const searchResults = game.toast.packages.list({ search: "dragon" });

// Get
const pkg = game.toast.packages.get("boss-kill-epic");

// Update
await game.toast.packages.update("boss-kill-epic", {
  description: "Updated description"
});

// Delete
await game.toast.packages.delete("boss-kill-epic");

// Launch
await game.toast.packages.launch("boss-kill-epic", {
  killerName: token.name,
  bossName: target.name
});

// Import/Export
const json = game.toast.packages.export("boss-kill-epic");
const newPkg = await game.toast.packages.import(json);

// Duplicate
const copy = await game.toast.packages.duplicate("boss-kill-epic", "Boss Kill - Fire");
```

---

## UI Components

### 1. Packages Tab in Toast Studio

Replace placeholder content with package browser:

```handlebars
{{!-- templates/partials/packages-tab.hbs --}}
<div class="tab-panel {{#if tabs.packages.active}}active{{/if}}" data-tab="packages">

  <div class="packages-toolbar">
    <button type="button" class="create-package-btn">
      <i class="fas fa-plus"></i> New Package
    </button>

    <input type="text" class="package-search" placeholder="Search packages...">

    <select class="package-category-filter">
      <option value="">All Categories</option>
      <option value="combat">Combat</option>
      <option value="social">Social</option>
      <option value="exploration">Exploration</option>
      <option value="custom">Custom</option>
    </select>

    <select class="package-scope-filter">
      <option value="">All Scopes</option>
      <option value="global">Global</option>
      <option value="world">This World</option>
    </select>

    <button type="button" class="refresh-packages-btn" title="Refresh">
      <i class="fas fa-sync"></i>
    </button>
  </div>

  <div class="packages-grid">
    {{#each packages}}
      {{> "modules/toast/templates/partials/package-card.hbs"}}
    {{else}}
      {{> "modules/toast/templates/partials/empty-state.hbs"
          icon="fas fa-box-open"
          message="No packages found"
          submessage="Create your first toast package to get started"}}
    {{/each}}
  </div>

</div>
```

### 2. Package Card Component

```handlebars
{{!-- templates/partials/package-card.hbs --}}
<div class="package-card" data-package-id="{{id}}">

  <div class="package-thumbnail">
    {{#if thumbnail}}
      <img src="{{thumbnail}}" alt="{{name}}">
    {{else}}
      <div class="package-thumbnail-placeholder">
        <i class="fas fa-box"></i>
      </div>
    {{/if}}

    {{#if scope}}
      <span class="package-scope-badge scope-{{scope}}">
        {{#eq scope "global"}}<i class="fas fa-globe"></i>{{/eq}}
        {{#eq scope "world"}}<i class="fas fa-map"></i>{{/eq}}
      </span>
    {{/if}}
  </div>

  <div class="package-info">
    <h4 class="package-name">{{name}}</h4>
    <p class="package-description">{{description}}</p>

    <div class="package-meta">
      <span class="package-category">
        <i class="fas fa-tag"></i> {{category}}
      </span>
      <span class="package-author">
        <i class="fas fa-user"></i> {{author}}
      </span>
    </div>

    {{#if tags.length}}
      <div class="package-tags">
        {{#each tags}}
          <span class="package-tag">{{this}}</span>
        {{/each}}
      </div>
    {{/if}}
  </div>

  <div class="package-actions">
    <button type="button" class="launch-package-btn" data-package-id="{{id}}" title="Launch">
      <i class="fas fa-rocket"></i> Launch
    </button>
    <button type="button" class="edit-package-btn" data-package-id="{{id}}" title="Edit">
      <i class="fas fa-edit"></i>
    </button>
    <button type="button" class="duplicate-package-btn" data-package-id="{{id}}" title="Duplicate">
      <i class="fas fa-copy"></i>
    </button>
    <button type="button" class="export-package-btn" data-package-id="{{id}}" title="Export">
      <i class="fas fa-download"></i>
    </button>
    <button type="button" class="delete-package-btn" data-package-id="{{id}}" title="Delete">
      <i class="fas fa-trash"></i>
    </button>
  </div>

</div>
```

### 3. Package Editor Dialog

```javascript
// When editing/creating a package
class PackageEditorDialog extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "toast-package-editor",
      title: "Package Editor",
      template: "modules/toast/templates/package-editor.hbs",
      width: 600,
      height: "auto",
      closeOnSubmit: false,
      submitOnChange: false
    });
  }

  async getData() {
    return {
      package: this.object, // Package instance or null for new
      categories: ["combat", "social", "exploration", "custom"],
      scopes: ["global", "world"]
    };
  }

  async _updateObject(event, formData) {
    // Validate and save package
  }
}
```

---

## Implementation Steps

### Step 1: Package Schema & Data Structures (v2.5.0-alpha.1)
- [ ] Define Package class with full schema
- [ ] Add validation methods
- [ ] Add token replacement logic
- [ ] Add dependency tracking
- [ ] Write unit tests for Package class

### Step 2: PackageManager Class (v2.5.0-alpha.2)
- [ ] Create PackageManager skeleton
- [ ] Implement in-memory storage (Map)
- [ ] Add CRUD methods (create, get, list, update, delete)
- [ ] Add filtering and search logic
- [ ] Write unit tests for PackageManager

### Step 3: File I/O & Storage (v2.5.0-alpha.3)
- [ ] Implement _loadGlobalPackages()
- [ ] Implement _loadWorldPackages()
- [ ] Implement _save() with file writing
- [ ] Implement _deleteFile()
- [ ] Add file naming and collision handling
- [ ] Test with multiple packages

### Step 4: Package Browser UI (v2.5.0-alpha.4)
- [ ] Create packages-tab.hbs template
- [ ] Create package-card.hbs component
- [ ] Add SCSS styling for package grid
- [ ] Implement search and filter UI
- [ ] Add empty state handling
- [ ] Test with various screen sizes

### Step 5: CRUD Operations (v2.5.0-alpha.5)
- [ ] Create PackageEditorDialog class
- [ ] Add "New Package" button handler
- [ ] Implement edit package functionality
- [ ] Implement delete with confirmation
- [ ] Add duplicate package feature
- [ ] Refresh UI after changes

### Step 6: Quick Launch (v2.5.0-alpha.6)
- [ ] Create token mapping dialog
- [ ] Implement launch with token replacement
- [ ] Add dependency validation before launch
- [ ] Show error messages for missing assets
- [ ] Test with various token scenarios

### Step 7: Import/Export (v2.5.0-alpha.7)
- [ ] Implement export to JSON download
- [ ] Implement import from file upload
- [ ] Add validation for imported packages
- [ ] Handle ID collisions on import
- [ ] Test with various package formats

### Step 8: Testing & Polish (v2.5.0-beta.1)
- [ ] Test package persistence across sessions
- [ ] Test world vs global scoping
- [ ] Test with large package collections
- [ ] Add tooltips and help text
- [ ] Performance optimization
- [ ] Error handling improvements

### Step 9: Release (v2.5.0)
- [ ] Final testing
- [ ] Update CHANGELOG
- [ ] Update README
- [ ] Create release notes
- [ ] Tag release

---

## Settings

```javascript
// Package storage location (world)
game.settings.register("toast", "packages-directory-world", {
  name: "World Packages Directory",
  hint: "Directory for world-specific packages",
  scope: "world",
  config: false,
  type: String,
  default: "toast-packages"
});

// Package storage location (global)
game.settings.register("toast", "packages-directory-global", {
  name: "Global Packages Directory",
  hint: "Directory for global packages",
  scope: "world",
  config: false,
  type: String,
  default: "modules/toast/packages"
});

// Default category for new packages
game.settings.register("toast", "packages-default-category", {
  name: "Default Package Category",
  hint: "Default category when creating new packages",
  scope: "client",
  config: true,
  type: String,
  choices: {
    "combat": "Combat",
    "social": "Social",
    "exploration": "Exploration",
    "custom": "Custom"
  },
  default: "custom"
});

// Default scope for new packages
game.settings.register("toast", "packages-default-scope", {
  name: "Default Package Scope",
  hint: "Default scope when creating new packages",
  scope: "client",
  config: true,
  type: String,
  choices: {
    "global": "Global (all worlds)",
    "world": "World-specific"
  },
  default: "world"
});
```

---

## Testing Checklist

- [ ] Can create new package
- [ ] Package persists after reload
- [ ] Can edit existing package
- [ ] Can delete package (with confirmation)
- [ ] Can duplicate package
- [ ] Can search packages by name/description
- [ ] Can filter by category
- [ ] Can filter by scope
- [ ] Can launch package with token mapping
- [ ] Dependency validation works correctly
- [ ] Missing assets show clear error
- [ ] Can export package as JSON
- [ ] Can import package from JSON
- [ ] Import handles ID collisions
- [ ] Global packages appear in all worlds
- [ ] World packages only appear in that world
- [ ] Package thumbnails display correctly
- [ ] Tags display and filter correctly

---

## Future Enhancements

- Package versioning and upgrade paths
- Package dependencies (require other packages)
- Package collections/playlists
- Community package repository
- Automatic thumbnail generation from toast preview
- Package usage statistics
- Package ratings and reviews
- Scheduled package launches
- Package triggers (hooks)
- Package templates
- Bulk package operations
- Package backup/restore

---

**Ready to begin Phase 4.2!**
