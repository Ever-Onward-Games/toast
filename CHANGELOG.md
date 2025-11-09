# Changelog

## Version 2.5.0-beta.16 - Package Card Rendering Fix (2025-11-02)

### 🐛 Bug Fixes

**Package Card Rendering:**
- Fixed packages not rendering in Toast Studio UI even though they were loaded
- Corrected Handlebars partial references from full paths to short names
- Changed `{{> "modules/toast/templates/partials/package-card.hbs"}}` to `{{> package-card}}`
- Registered `eq` Handlebars helper for equality comparisons in templates
- Package cards use `{{#eq category "combat"}}` syntax which requires custom helper
- Packages now properly display in the packages tab with all metadata and action buttons

**Files Changed:**
- `templates/partials/packages-tab.hbs` - Fixed partial references
- `src/core/ToastManager.js` - Added registerHandlebarsHelpers() method

---

## Version 2.5.0-beta.15 - Package File Listing Fix (2025-11-02)

### 🐛 Bug Fixes

**Package File Listing:**
- Fixed packages not appearing in Toast Studio after being created
- Removed unnecessary fetch check that was preventing FilePicker.browse() from listing files
- The fetch was returning 404 and throwing errors before FilePicker could list directory contents
- Now goes directly to FilePicker.browse() which properly lists files in existing directories
- Changed error logging from warn to log since missing directories are expected on first run

**Files Changed:**
- `src/packages/PackageManager.js` - Removed fetch check from _listPackageFiles

---

## Version 2.5.0-beta.14 - Package Directory Creation (2025-11-02)

### 🐛 Bug Fixes

**Package Directory Creation:**
- Create package directory before attempting upload if it doesn't exist
- Fixed "Target directory does not exist" error when saving first package
- Use properly namespaced FilePicker: `foundry.applications.apps.FilePicker.implementation`
- Fixes deprecation warning about using global FilePicker
- Gracefully handle EEXIST error if directory already exists
- This was the root cause of packages not being saved to disk

**Files Changed:**
- `src/packages/PackageManager.js` - Added directory creation before upload

---

## Version 2.5.0-beta.13 - FilePicker Upload API (2025-11-02)

### 🐛 Bug Fixes

**Package File Upload:**
- Switched to using FilePicker.upload() API instead of manually constructing FormData
- Foundry's FilePicker API handles all parameter formatting and validation correctly
- Fixes "path argument must be of type string. Received undefined" error
- Simpler, more reliable code that uses Foundry's official upload mechanism

**Files Changed:**
- `src/packages/PackageManager.js` - Use FilePicker.upload() instead of raw fetch

---

## Version 2.5.0-beta.12 - Package Save Error Handling (2025-11-02)

### 🐛 Bug Fixes

**Package Save Error Handling:**
- Added validation to check if file path is null/undefined before attempting save
- Added validation to ensure file path contains directory separator
- Log directory path before upload attempt for debugging
- Better error messages when path validation fails
- Helps diagnose issues where worldId might be null or path construction fails

**Files Changed:**
- `src/packages/PackageManager.js` - Added path validation and debug logging to _savePackage

---

## Version 2.5.0-beta.11 - Package Upload Fix (2025-11-02)

### 🐛 Bug Fixes

**Package File Upload:**
- Fixed package upload using correct FormData field name "upload" instead of "file"
- Foundry's upload endpoint returns 200 OK even on errors with error details in response body
- Now properly checks response body for errors even when HTTP status is 200
- Uses Blob instead of File object for better browser compatibility
- Properly throws errors when upload fails so users see what went wrong
- Previous version would silently fail with "No file was uploaded" error

**Files Changed:**
- `src/packages/PackageManager.js` - Fixed _savePackage to use correct field name and error checking

---

## Version 2.5.0-beta.10 - Package Save Fix (2025-11-02)

### 🐛 Bug Fixes

**Package File Save:**
- Fixed critical bug where packages were created in memory but not saved to disk
- Foundry's upload API requires directory path only, not full file path including filename
- The filename is provided by the File object itself
- Added better error reporting that includes response text when uploads fail
- Packages will now properly persist to disk at `worlds/{worldId}/toast-packages/{packageId}.json`

**Files Changed:**
- `src/packages/PackageManager.js` - Fixed _savePackage to pass directory only to upload API

---

## Version 2.5.0-beta.9 - Packages Toolbar Reorganization (2025-11-02)

### 🎨 UI Improvements

**Packages Toolbar Layout:**
- Reorganized toolbar for better visual grouping
- Line 1: Search input (~50%) + Category filter (200px) + Scope filter (200px)
- Line 2: New Package button + Import button + Refresh button (equally distributed)
- Groups search and filters together on first line
- Groups all action buttons together on second line
- Search input flexibly takes remaining space after filters

**Files Changed:**
- `templates/partials/packages-tab.hbs` - Restructured toolbar with two .toolbar-row divs
- `styles/components/_packages-tab.scss` - Updated flex properties for new layout

---

## Version 2.5.0-beta.8 - Toolbar Controls Height Fix (2025-11-02)

### 🐛 Bug Fixes

**Packages Toolbar Control Height:**
- Fixed text cutoff in toolbar dropdowns and inputs
- Added explicit `height: 36px` to all toolbar controls
- Added `line-height: 1.2` for proper text rendering
- Ensures consistent control height across search input, filter selects, and buttons
- Matches the pattern used in assets toolbar

**Files Changed:**
- `styles/components/_packages-tab.scss` - Added height and line-height to toolbar controls

---

## Version 2.5.0-beta.7 - Packages Toolbar 2-Line Layout (2025-11-02)

### 🎨 UI Improvements

**Packages Toolbar Layout:**
- Refactored packages toolbar to use a 2-line layout (matching images toolbar pattern)
- Line 1: New Package button takes full width
- Line 2: Search, filters, and action buttons equally distributed
- All second-line items now use `flex: 1 1 0` for equal space distribution
- Search input: `min-width: 0` for maximum flexibility
- Filter selects: `min-width: 150px` to prevent over-shrinking
- Action buttons: `min-width: 120px` to maintain readability
- Prevents toolbar items from being squished at smaller window sizes

**Files Changed:**
- `styles/components/_packages-tab.scss` - Converted to 2-line flex layout with column direction

---

## Version 2.5.0-beta.6 - Toolbar Layout Fixes (2025-11-02)

### 🐛 Bug Fixes

**Packages Toolbar Layout:**
- Fixed packages toolbar where components were being crushed and hidden
- Added explicit flex-basis and min-width values to all toolbar items
- Search input: `flex: 1 1 200px` with `min-width: 150px`
- Filter dropdowns: `flex: 0 0 auto` with `min-width: 120px`
- Buttons: `flex: 0 0 auto` to prevent shrinking

**Files Changed:**
- `styles/components/_packages-tab.scss` - Added flex sizing constraints

---

## Version 2.5.0-beta.5 - UI Improvements (2025-11-02)

### 🎨 UI Improvements

**Images Toolbar Layout:**
- Restructured images subtab toolbar to use a 2-line layout
- Search input now has full width on first row
- Filter dropdown and refresh button share second row
- Prevents crowding of search box by fixed-width controls
- Audio toolbar remains single-line as intended

**Files Changed:**
- `templates/partials/images-subtab.hbs` - Added 2-row structure with `images-toolbar-multiline` class
- `styles/components/_assets-tab.scss` - Added `.images-toolbar-multiline` variant styles

---

## Version 2.5.0-beta.4 - Tab Rendering Bug Fix (2025-11-02)

### 🐛 Bug Fixes

**Fixed Packages Tab Not Visible (CSS Class Collision):**
- Fixed critical bug where Packages and Studio tabs were hidden by Foundry's default CSS
- Root cause #1: `getData()` method was passing `tabs` as an object, but template expected an array for `{{#each tabs}}` iteration
- Root cause #2: Tab navigation items used `class="tab"` which collided with Foundry's `.tab[data-tab]:not(.active) { display: none }` rule meant for content panels
- Solution:
  - Provide both `data.tabs` (array for iteration) and `data.tabsByName` (object for property access)
  - Changed navigation items from `class="tab"` to `class="item"` (Foundry's standard for tab navigation)
- Updated partial templates (assets-tab.hbs, packages-tab.hbs, studio-tab.hbs) to use `tabsByName` for active state checks

**Files Changed:**
- `templates/toast-studio.hbs:5` - Changed navigation items from `class="tab"` to `class="item"`
- `src/ui/ToastStudioApp.js:56-86` - Added dual tabs representation
- `src/ui/ToastStudioApp.js:578` - Updated event handler from `.tabs .tab` to `.tabs .item`
- `templates/partials/assets-tab.hbs:2` - Updated to use `tabsByName.assets.active`
- `templates/partials/packages-tab.hbs:2` - Updated to use `tabsByName.packages.active`
- `templates/partials/studio-tab.hbs:2` - Updated to use `tabsByName.studio.active`

**Impact:**
- All three tabs (Assets, Packages, Studio) now render correctly
- Tab navigation fully functional
- Package Manager UI now accessible to users

---

## Version 2.5.0-beta.1 - Polish & Testing Phase (2025-11-02)

### 🎨 Polish & User Experience Improvements (Step 8/9)

**Enhanced Tooltips:**
- Added descriptive tooltips to all toolbar buttons
- Enhanced package card action button tooltips
- Added context-aware tooltip for launch button (shows if tokens required)
- Search input placeholder now more descriptive
- Filter dropdowns have helpful title attributes

**Improved Messages:**
- Better empty state message with API usage hint
- Edit button tooltip directs users to API
- New Package button clarifies API-only status
- All tooltips provide clear context about actions

**Documentation:**
- Updated PHASE-4-2-PLAN with all completed steps
- Marked Steps 1-7 as complete
- Step 7 (Import/Export) was completed as part of Step 5
- Comprehensive delivery summaries for each step

**Phase 4.2 Status:**
- **Steps 1-7: COMPLETED** (78% complete)
- Step 8: In progress (Polish & Testing)
- Step 9: Pending (Final Release)

**What's Working:**
- ✅ Complete package data model with tokens and dependencies
- ✅ Full CRUD operations via PackageManager
- ✅ File I/O with world/global scoping
- ✅ Package Browser UI with search and filtering
- ✅ Import/Export functionality
- ✅ Token mapping dialog for dynamic launches
- ✅ Duplicate, Delete, Refresh operations
- ✅ Interactive event handlers for all buttons

**Ready for Testing:**
- Package persistence across sessions
- World vs global scoping behavior
- Large package collections
- Token replacement accuracy
- Import/export workflows
- Dependency validation

**Beta Status:**
This beta release marks the feature-complete state of Phase 4.2. All core functionality is implemented and ready for community testing. The PackageEditorDialog (visual package creator) is deferred to a future release - users can create packages via the API for now.

**Package Manager Feature Summary:**
Phase 4.2 adds a complete package management system to Toast Studio:
- 📦 Save toast configurations as reusable packages
- 🔍 Browse packages with search and filtering
- 🚀 Quick launch with dynamic token mapping
- 📥📤 Import/Export packages as JSON files
- 🔄 Duplicate, delete, and refresh operations
- 🌍 World-specific and global package scopes
- 🎨 Category organization (combat, social, exploration, custom)
- 🏷️ Tag-based organization and search
- ✅ Dependency validation before launch
- 📊 Package statistics and metadata tracking

**API Available:**
```javascript
// Complete package management API
game.toast.packages.create(config)      // Create new package
game.toast.packages.get(id)             // Get package by ID
game.toast.packages.list(filters)       // List with filters
game.toast.packages.update(id, updates) // Update package
game.toast.packages.delete(id)          // Delete package
game.toast.packages.launch(id, tokens)  // Launch with tokens
game.toast.packages.export(id)          // Export as JSON
game.toast.packages.import(json)        // Import from JSON
game.toast.packages.duplicate(id, name) // Duplicate package
game.toast.packages.refresh()           // Reload from disk
game.toast.packages.getStats()          // Get statistics
```

**Phase 4.2 Complete:**
- 8 of 9 steps completed (88%)
- ~2,300 lines of code added
- 6 new files created
- Module size: 176.6 KB
- Ready for v2.5.0 release after community testing

---

## Version 2.5.0-alpha.6 - Token Mapping Dialog (2025-11-02)

### ✨ New Feature - Dynamic Token Launch (Step 6/9)

**Token Mapping Dialog:**
- Created `TokenMappingDialog` helper class for package launch
- Automatic token detection and form generation
- Support for different token types (string, number, boolean)
- Default values pre-filled from token definitions
- Token descriptions shown as tooltips and hints

**Dialog Features:**
- Clean, user-friendly form interface
- Auto-focus on first input field
- Token placeholder preview at bottom
- Launch and Cancel buttons
- 500px dialog width for comfortable data entry

**Token Type Support:**
- **String tokens:** Text input with placeholder
- **Number tokens:** Number input with validation
- **Boolean tokens:** Dropdown with True/False options
- Default values automatically populated

**User Experience:**
- Informational hint about dynamic tokens
- Token labels with optional question mark tooltips
- Form hints below inputs for additional context
- Token preview showing all placeholder syntax
- Integrated error handling and notifications

**Integration:**
- Updated `_onLaunchPackage` to use TokenMappingDialog
- Handles both token and no-token packages seamlessly
- Launches directly if no tokens present
- Shows dialog if tokens need values

**Styling:**
- Added ~110 lines of SCSS for token dialog
- Foundry VTT theme integration
- Focus states with highlight colors
- Responsive form layout
- Token preview section with code blocks

**Technical Implementation:**
- Static helper class (~220 lines)
- Promise-based dialog workflow
- Form value collection from inputs
- Integration with PackageManager.launch()
- Comprehensive error handling

**Helper Methods:**
- `TokenMappingDialog.show()` - Main entry point
- `_buildFormHtml()` - Dynamic form generation
- `getTokenSuggestions()` - Future canvas token integration

**Example Package with Tokens:**
```javascript
await game.toast.packages.create({
  name: "Boss Defeated",
  category: "combat",
  config: { elements: [
    {
      type: "text",
      text: "{{playerName}} DEFEATS {{bossName}}!",
      fontSize: "80px"
    }
  ]},
  tokens: {
    playerName: {
      label: "Player Name",
      description: "The hero who defeated the boss",
      type: "string",
      default: "Hero"
    },
    bossName: {
      label: "Boss Name",
      description: "The boss that was defeated",
      type: "string",
      default: "Dragon"
    }
  }
});
```

When launched, users are prompted to fill in playerName and bossName values before the toast displays.

---

## Version 2.5.0-alpha.5 - Package CRUD Operations (2025-11-02)

### ✨ New Feature - Interactive Package Management (Step 5/9)

**Event Handlers:**
- Added 10 event handlers for all package UI interactions
- Integrated with ToastStudioApp activateListeners
- Full error handling and user feedback via notifications

**Implemented Functionality:**

**Refresh Packages:**
- Button handler to reload packages from disk
- Calls `PackageManager.refresh()`
- UI automatically updates after refresh

**Search & Filter:**
- Real-time search across package name, description, and tags
- Category filter (All, Combat, Social, Exploration, Custom)
- Scope filter (All, World Only, Global Only)
- Filters can be combined for precise results
- Dynamic package count updates

**Export Package:**
- One-click JSON export to download
- Downloads as `{package-id}.json`
- Preserves all package data including tokens and dependencies

**Import Package:**
- File upload dialog for JSON packages
- Automatic validation and collision handling
- Imported packages added to appropriate scope

**Duplicate Package:**
- Dialog prompt for new package name
- Creates complete copy with new ID
- Default name: "{Original Name} (Copy)"

**Delete Package:**
- Confirmation dialog before deletion
- Removes from both memory and disk
- Clear warning about permanent action

**Launch Package:**
- Quick launch for packages without tokens
- Warning for packages with dynamic tokens (token dialog coming in Step 6)
- Dependency validation before launch

**Placeholders for Future Features:**
- New Package button (PackageEditorDialog in Step 6)
- Edit Package button (PackageEditorDialog in Step 6)
- Helpful messages directing users to API for now

**Technical Implementation:**
- ~340 lines of event handler code
- jQuery for DOM manipulation and filtering
- Blob API for file downloads
- FileReader API for file uploads
- Foundry Dialog integration
- Comprehensive error handling

**User Experience:**
- Toast notifications for all actions
- Confirmation dialogs for destructive actions
- Clear error messages with context
- Smooth UI updates after operations

**API Still Available:**
Users can still use `game.toast.packages` API directly for full programmatic control.

---

## Version 2.5.0-alpha.4 - Package Browser UI (2025-11-02)

### ✨ New Feature - Package Browser Interface (Step 4/9)

**Package Browser UI:**
- Created complete package browsing interface in Toast Studio
- Responsive card-based grid layout for package display
- Visual category indicators with icons (combat, social, exploration, custom)
- Scope badges (world-specific vs global packages)
- Token count indicators for packages with dynamic placeholders

**Package Card Features:**
- Package thumbnail support with fallback category icons
- Name, description, and version display
- Author attribution
- Tag display for easy identification
- Action buttons: Launch, Edit, Duplicate, Export, Delete
- Hover effects and visual feedback

**Toolbar & Controls:**
- "New Package" button for creating packages
- Search bar for text-based filtering
- Category filter dropdown (All, Combat, Social, Exploration, Custom)
- Scope filter dropdown (All, World Only, Global Only)
- Import button for package JSON files
- Refresh button to reload packages from disk

**Statistics Display:**
- Total package count
- World packages count
- Global packages count
- Real-time updates

**Empty State:**
- Helpful empty state when no packages exist
- Clear call-to-action to create first package

**Styling:**
- Complete SCSS component styles
- Foundry VTT theme integration
- Responsive grid (min 320px cards)
- Color-coded categories
- Smooth hover animations and transitions

**Template Files:**
- `templates/partials/packages-tab.hbs` - Main package browser
- `templates/partials/package-card.hbs` - Individual package display
- `styles/components/_packages-tab.scss` - Complete styling system

**Integration:**
- Updated `ToastStudioApp._getPackageData()` to fetch real package data
- Integrated with PackageManager for live data display
- Added package-card.hbs to preloaded templates

**Note:** This release implements the UI layer only. CRUD operations (create, edit, delete, etc.) and event handlers will be implemented in Step 5 (v2.5.0-alpha.5).

---

## Version 2.5.0-alpha.3 - Package System Integration (2025-11-02)

### ✨ New Feature - Package System Integration (Step 3/9)

**ToastManager Integration:**
- Added PackageManager initialization in module ready hook
- Integrated package system with core Toast module
- Automatic package loading on module startup
- Graceful error handling for package loading failures

**Settings:**
- Added package directory settings (world and global)
- Added default package category setting (combat, social, exploration, custom)
- Added default package scope setting (world-specific or global)
- Settings properly scoped (client vs world) for multi-user environments

**API Exposure:**
- Full package API exposed via `game.toast.packages`
- CRUD operations: `create()`, `get()`, `list()`, `update()`, `delete()`
- Launch operations: `launch()` with token mapping
- Import/Export: `import()`, `export()`, `duplicate()`
- Utilities: `refresh()`, `getCategories()`, `getTags()`, `getAuthors()`, `getStats()`

**API Examples:**
```javascript
// Create a new package
const pkg = await game.toast.packages.create({
  name: "Critical Hit",
  category: "combat",
  config: { elements: [...] }
});

// List all combat packages
const combatPkgs = game.toast.packages.list({ category: "combat" });

// Launch a package with tokens
await game.toast.packages.launch("crit-hit", {
  playerName: "Aragorn",
  damage: "42"
});

// Export and import packages
const json = game.toast.packages.export("my-package");
await game.toast.packages.import(json);
```

**Technical Changes:**
- Added `packageManager` static property to ToastManager
- PackageManager initialized after TTS cache
- Optional chaining in API methods for safety
- Console logging for initialization status

---

## Version 2.5.0-alpha.2 - PackageManager Implementation (2025-11-02)

### ✨ New Feature - Package Management System (Step 2/9)

**PackageManager Class Implementation:**
- Complete CRUD operations for package management
- In-memory storage with Map collection (id → Package)
- Automatic loading from disk on initialization
- Support for both world-specific and global packages
- Comprehensive error handling and validation

**CRUD Operations:**
- `create(config)` - Create and save new package
- `get(id)` - Retrieve package by ID
- `list(filters)` - List packages with filtering
- `update(id, updates)` - Update existing package
- `delete(id)` - Remove package from disk and memory

**Search & Filtering:**
- Filter by category (combat, social, exploration, custom)
- Filter by tags (all tags must match)
- Filter by scope (world/global)
- Filter by author
- Text search across name, description, and tags
- Automatic alphabetical sorting

**Package Launch:**
- Launch packages with token mapping
- Dependency validation before launch
- Clear error messages for missing assets
- Integration with ToastManager for display

**Import/Export:**
- Export packages as formatted JSON
- Import packages from JSON with collision handling
- Duplicate packages with new names
- Overwrite option for imports

**File Operations:**
- Load packages from `modules/toast/packages/` (global)
- Load packages from `worlds/{worldId}/toast-packages/` (world)
- Save packages using Foundry's upload API
- Automatic directory handling

**Utility Methods:**
- `refresh()` - Reload all packages from disk
- `getCategories()` - List all unique categories
- `getTags()` - List all unique tags
- `getAuthors()` - List all unique authors
- `getStats()` - Package statistics and counts

**Technical Details:**
- FilePicker integration for directory browsing
- Async initialization pattern
- Loading state management
- Scope validation and enforcement
- FormData creation for file uploads
- Error logging and user notifications

### Files Changed
- `src/packages/PackageManager.js` - Complete PackageManager class (~550 lines)
- `build.js` - Added PackageManager to build order

---

## Version 2.5.0-alpha.1 - Package Class Foundation (2025-11-02)

### ✨ New Feature - Package System (Step 1/9)

**Package Class Implementation:**
- Created `Package` class for reusable toast configurations
- Full schema with metadata, authorship, and organization
- Category system: combat, social, exploration, custom
- Scope support: world-specific or global packages
- Semantic versioning with validation

**Token Replacement System:**
- Dynamic placeholder support with `{{tokenName}}` syntax
- Token metadata: label, description, type, default value
- Runtime token mapping for personalized toasts
- Example: `{{killerName}} DEFEATS {{bossName}}!`

**Dependency Tracking:**
- Auto-extract image and sound dependencies from config
- Validate asset existence before launch
- Return missing dependencies for error handling
- Prevent broken packages from launching

**Validation Methods:**
- Comprehensive schema validation
- Element structure validation (type, id, required fields)
- Category and scope validation with auto-correction
- Semver version format validation

**Utility Methods:**
- `toJSON()` - Serialize for storage
- `fromJSON()` - Deserialize from storage
- `clone()` - Duplicate package with new name
- `extractTokenPlaceholders()` - Find all tokens in text
- `getFilePath()` - Generate storage path by scope

**Technical Details:**
- ID generation from name (sanitized, lowercase, hyphens)
- Immutable fields protection (id, createdAt, author)
- Automatic timestamp management (createdAt, updatedAt)
- Deep cloning for token application (no mutation)
- HEAD request asset validation

### Files Changed
- `src/packages/Package.js` - Complete Package class (~390 lines)
- `build.js` - Added packages layer to build system

---

## Version 2.4.0-beta.4 - Interactive Image Preview (2025-10-31)

### ✨ Enhancement - Advanced Preview Controls

**Restructured images tab layout:**
- Toolbar now only spans the left side (image list area)
- Preview pane is now static on the right side (always visible)
- Image list scrolls independently while preview remains in place
- Fixed-height layout with proper flex/grid constraints
- Better space utilization with 450px preview pane width

**Mousewheel zoom functionality:**
- Scroll to zoom in/out on preview images
- Zoom range: 10% to 500% (0.1x to 5.0x)
- 10% increment per scroll tick
- Real-time zoom percentage display
- Smooth scaling with CSS transforms

**Right-click pan functionality:**
- Right-click and drag to pan around zoomed images
- Visual feedback: cursor changes to grabbing during pan
- Pan offset persists during zoom operations
- Prevents context menu during image manipulation
- Panning ends on mouseup or mouseleave

**Preview Controls:**
- Hint text in header: "Scroll" and "Right-drag" icons
- Live zoom percentage indicator in metadata section
- Transform system centers image before applying zoom/pan
- Image sized to natural dimensions for accurate scaling
- Reset zoom/pan when selecting new image

**Technical Implementation:**
- Added zoom/pan state variables to constructor
- New `_updatePreviewTransform()` method for CSS transforms
- Event listeners: wheel (zoom), contextmenu/mousemove/mouseup (pan)
- Container cloning to remove old event listeners on image change
- Absolute positioning with transform-origin center
- Flexbox layout for static preview pane

**Layout Changes:**
- `.image-list-container` wraps toolbar + image list (left side)
- `.images-split-layout` grid: `1fr 450px` columns
- Layout height: `calc(100vh - 300px)` with min/max constraints
- Left side scrolls independently, right side is static
- Preview image container uses `position: relative` + `overflow: hidden`

**CSS Enhancements:**
- `.preview-image-container` - Grab cursor, panning state
- `#image-preview-img` - Absolute positioning, transform origin center
- `.preview-controls-hint` - Icon-based control hints
- `.preview-zoom` - Highlighted zoom percentage display
- Full-height preview pane with flexbox content management

### Files Changed
- `templates/partials/images-subtab.hbs` - Restructured layout, controls hints
- `src/ui/ToastStudioApp.js` - Zoom/pan state, event listeners, transform logic (~130 lines)
- `styles/components/_assets-tab.scss` - Static preview, scrollable list, zoom/pan styling (~155 lines)

---

## Version 2.4.0-beta.3 - Image Preview Pane (2025-10-31)

### ✨ Enhancement - Integrated Image Preview

**Added side-by-side image preview pane:**
- Images tab now features split layout: image list + preview pane
- Click any image item to preview without popup dialogs
- Preview pane displays full image, filename, dimensions, and file size
- Sticky-positioned preview stays accessible while scrolling
- Selected image item gets highlighted border/glow effect
- Removed separate preview button - entire image item is now clickable

**Preview Pane Features:**
- Large image display (max 400px height, auto-scaled)
- Automatic dimension detection (width × height in pixels)
- File size display via HEAD request (shown in KB)
- Loading spinner during image load
- Error handling for failed image loads
- Placeholder state when no image selected

**User Experience Improvements:**
- 400px fixed-width preview pane on right side
- Responsive grid layout (fluid list, fixed preview)
- Visual feedback on image selection
- Action buttons still functional without triggering preview
- Preview updates instantly on image click

**Technical Implementation:**
- Updated images-subtab.hbs with `.images-split-layout` grid
- New preview pane markup with placeholder and display states
- Replaced `_onImagePreview()` popup with `_onImageSelect()` handler
- New `_updateImagePreview()` method loads and displays image data
- Event delegation prevents button clicks from triggering preview
- Image load handlers for dimension detection
- Fetch API for file size via HEAD request

**CSS Grid Layout:**
- `.images-split-layout` - Two-column grid (1fr + 400px)
- `.image-preview-pane` - Sticky preview panel with header
- `.image-item.selected` - Highlighted selection state with glow
- Preview content styling with placeholder and display modes

### Files Changed
- `templates/partials/images-subtab.hbs` - Split layout with preview pane
- `templates/partials/image-asset-item.hbs` - Removed preview button
- `src/ui/ToastStudioApp.js` - Image selection and preview methods (~65 lines)
- `styles/components/_assets-tab.scss` - Split layout and preview styling (~120 lines)

---

## Version 2.4.0-beta.2 - Directory Column Layout (2025-10-31)

### ✨ Enhancement - Space-Efficient Directory Layout

**Converted directories tab to 3-column grid:**
- Changed from vertical stacking to horizontal columns
- Three equal-width columns: Default | Announcer | Custom
- Significantly reduced vertical scrolling requirements
- Add Directory button now immediately accessible
- Better space utilization on wider screens

**Layout Changes:**
- `.directories-list` → `.directories-grid` with CSS Grid
- Three `.directory-column` containers for each type
- Shortened section descriptions for compactness
- Maintained all functionality while reducing vertical space

**Technical Implementation:**
- Updated directories-subtab.hbs with column structure
- Added `.directories-grid` CSS Grid (3 equal columns, 1rem gap)
- Added `.directory-column` flex containers
- Preserved all directory management features

### Files Changed
- `templates/partials/directories-subtab.hbs` - Column grid layout
- `styles/components/_assets-tab.scss` - Grid styling

---

## Version 2.4.0-beta.1 - FilePicker Directory Management (2025-10-31)

### ✨ Feature Complete - Asset Browser Beta

**Implemented FilePicker UI for directory management:**
- Add custom directories with Foundry's native FilePicker
- Edit directory properties (type and label)
- Full dialog-based workflow with validation
- Professional user experience matching Foundry's UI patterns

**Add Directory Dialog:**
- Browse button opens Foundry's FilePicker (folder mode)
- Directory type selector: Audio Only / Images Only / Audio & Images
- Optional display label input
- Directory path validation before adding
- User-friendly error messages

**Edit Directory Dialog:**
- Edit directory type and label
- Path is read-only (remove and re-add to change path)
- Pre-populated with current values
- Save changes or cancel

**Directory Validation:**
- New `_validateDirectory()` method checks accessibility
- Uses FilePicker.browse() to confirm directory exists
- Prevents adding non-existent or inaccessible directories
- Clear error notifications for invalid paths

**Technical Implementation:**
- Complete _onAddDirectory() implementation (~75 lines)
- Complete _onEditDirectory() implementation (~60 lines)
- Dialog render hooks for FilePicker integration
- Async validation with proper error handling
- Uses jQuery for DOM manipulation (Foundry standard)
- Integrates with existing CRUD methods

**User Experience:**
- Inline Browse button in add dialog
- Form validation with helpful messages
- Success notifications on completion
- Consistent with Foundry's dialog patterns
- Disabled path field in edit dialog (with explanation)

**Beta Status:**
Asset Browser is now feature-complete and ready for testing:
- ✅ Multi-source directory scanning
- ✅ Animated image detection (GIF, WebP, APNG)
- ✅ Audio playback controls
- ✅ Source indicators
- ✅ Filtering by source/animation type
- ✅ FilePicker directory management
- ✅ Full CRUD operations

### Files Changed
- `src/ui/ToastStudioApp.js` - FilePicker dialogs and validation (~150 lines)

---

## Version 2.4.0-alpha.8 - Asset Source Indicators (2025-10-31)

### ✨ Enhancement - Asset Source Display

**Added source badges to all assets:**
- Every audio and image asset now displays its source
- Color-coded badges for easy identification:
  - 🔵 Blue: Default module assets
  - 🟠 Orange: Announcer pack assets
  - 🟢 Green: Custom user directories
- Icons indicate source type (cube/bullhorn/folder-plus)
- Tooltips show full source path on hover

**Visual Design:**
- Inline badges in asset metadata section
- Small, unobtrusive design with icon + label
- Consistent styling across audio and image items
- Semi-transparent backgrounds with colored borders

**Enhanced Filtering:**
- Source filter now fully functional (default/announcer/custom)
- Audio tab: Filter by source type
- Images tab: Filter by source type or animated/static
- Filter logic updated to check source-badge class
- Combined filtering for animated/static criteria

**Badge Colors:**
- Default: Blue (#3498db) - rgba(52, 152, 219, 0.15) background
- Announcer: Orange (#e67e22) - rgba(230, 126, 34, 0.15) background
- Custom: Green (#2ecc71) - rgba(46, 204, 113, 0.15) background

**Technical Implementation:**
- Updated audio-asset-item.hbs with source badge
- Updated image-asset-item.hbs with source badge
- Added .source-badge SCSS with type-specific variants
- Enhanced _onFilterAssets() to handle source filtering
- Conditional rendering based on sourceLabel presence
- Uses sourceType class for filtering logic

### Files Changed
- `templates/partials/audio-asset-item.hbs` - Added source badge
- `templates/partials/image-asset-item.hbs` - Added source badge
- `styles/components/_assets-tab.scss` - Source badge styling (~45 lines)
- `src/ui/ToastStudioApp.js` - Enhanced filter logic (~30 lines)

---

## Version 2.4.0-alpha.7 - APNG Detection Support (2025-10-31)

### ✨ Enhancement - Complete Animated Image Detection

**Added APNG (Animated PNG) detection:**
- PNG files now checked for acTL (animation control) chunk
- Completes support for all major animated image formats: GIF, WebP, APNG
- Badge now displays specific format type (GIF, WebP, or APNG)
- Accurate detection prevents false positives for static PNG files

**New Utility Module:**
- `apng-anim-utils.js` - APNG detection via file header inspection
- `parseAPNG()` - Core check with frame count
- `isAPNG()` - Boolean convenience check
- `isAPNGFromURL()` - Fetch and check PNG from URL
- `apngFrameCountFromURL()` - Get animation frame count
- `isAPNGFromBlob()` - Check from Blob/File object

**Detection Algorithm:**
- Verifies PNG signature (89 50 4E 47 0D 0A 1A 0A)
- Searches for acTL chunk (animation control)
- Reads frame count from acTL data (4 bytes, big-endian)
- Optimization: Returns false if IDAT found before acTL (static PNG)
- Stops at IEND chunk or end of file

**Enhanced Asset Data:**
- Added `animationType` field to image assets
- Values: "gif", "webp", "apng", or null
- Badge displays specific format name instead of generic "GIF"
- Tooltips show format type

**Technical Implementation:**
- Added APNG detection to _createImageAsset()
- New _checkAPNGAnimated() method for PNG inspection
- PNG extension triggers APNG check
- GIF remains instant detection
- WebP uses existing robust detection
- Updated image-asset-item.hbs with dynamic badge text

### Files Changed
- `src/utils/apng-anim-utils.js` - New utility module (~130 lines)
- `src/ui/ToastStudioApp.js` - APNG detection integration (~40 lines)
- `templates/partials/image-asset-item.hbs` - Dynamic badge text
- `build.js` - Added APNG utils to build process

---

## Version 2.4.0-alpha.6 - Robust WebP Animation Detection (2025-10-31)

### ✨ Enhancement - Accurate WebP Animation Detection

**Implemented file header inspection for WebP files:**
- WebP files are now accurately detected as animated or static
- Reads file headers to check for VP8X/ANIM chunks (definitive animation markers)
- GIF files still instantly marked as animated
- No more false positives for static WebP files

**New Utility Module:**
- `webp-anim-utils.js` - Robust WebP animation detection
- `isWebPAnimated()` - Core check from file bytes
- `isWebPAnimatedFromURL()` - Fetch and check from URL
- `isWebPAnimatedFromBlob()` - Check from Blob/File object
- `countWebPFrames()` - Optional frame counting utility

**Detection Algorithm:**
- Reads RIFF/WEBP file headers
- Checks VP8X feature flags (bit 1 = animation)
- Looks for ANIM chunk (definitive animated WebP marker)
- Handles chunk padding correctly
- Graceful error handling with fallback to false

**Technical Changes:**
- Updated `_createImageAsset()` to async method
- New `_checkWebPAnimated()` method for WebP file inspection
- `_scanDirectory()` now uses Promise.all for parallel checks
- Deprecated `_isAnimatedImage()` (kept for compatibility)
- Added webp-anim-utils.js to build process

**Performance:**
- Parallel async checks for all WebP files in directory
- Fetches only necessary file headers (not full images)
- Error handling prevents scan failures from single bad files

### Files Changed
- `src/utils/webp-anim-utils.js` - New utility module (~100 lines)
- `src/ui/ToastStudioApp.js` - Async WebP detection (~50 lines modified)
- `build.js` - Added utils layer to build process

---

## Version 2.4.0-alpha.5 - Animated Image Badges (2025-10-31)

### ✨ Enhancement - Animated Image Detection

**Added visual indicators for animated images:**
- GIF and WebP images now display an "Animated" badge
- Badge appears on thumbnail overlay (top-right corner)
- Additional "Animated" indicator in asset metadata
- Dark magenta color scheme for animated indicators

**Visual Design:**
- Thumbnail badge: Dark magenta background with film icon and "GIF" label
- Metadata indicator: Film icon + "Animated" text in asset info
- Badge positioned absolutely on thumbnail (non-intrusive)
- Shadow effect for better visibility

**Detection Logic:**
- GIF files: Always marked as animated (extension: .gif)
- WebP files: Marked as potentially animated (extension: .webp)
- Note: Not all WebP files are animated, but detected by extension
- APNG: Not detected (uses .png extension, can't distinguish)

**Technical Implementation:**
- Updated `_isAnimatedImage()` to detect GIF and WebP only
- Clarified detection limitations in code comments
- `animated` property already set in Step 3, now visible in UI

**SCSS Additions:**
- `.animated-badge` - Overlay badge on thumbnails
- `.animated-indicator` - Text indicator in metadata
- Dark magenta (#8b008b) theme color

### Files Changed
- `templates/partials/image-asset-item.hbs` - Added badge and indicator
- `src/ui/ToastStudioApp.js` - Refined animated detection
- `styles/components/_assets-tab.scss` - Added badge styling

---

## Version 2.4.0-alpha.4 - Audio Playback Controls (2025-10-31)

### ✨ Enhancement - Audio Preview UI

**Enhanced audio playback controls:**
- Audio preview buttons now toggle between play and stop
- Visual feedback: stop icon appears when audio is playing
- Currently playing audio items are highlighted with accent color
- Play button changes to stop button when audio is playing
- Clicking stop button pauses audio playback
- Automatic cleanup: button resets when audio finishes naturally
- Window close properly resets all audio states

**UI Improvements:**
- Playing audio items get highlighted background and border
- Audio icon changes to accent color when playing
- Stop button has red hover state for clear visual feedback
- Button tooltips update based on state ("Play audio" / "Stop audio")

**Technical Implementation:**
- `_onAudioPreview()` - Handles play/stop toggle logic
- `_updateAudioButton()` - Updates button and item visual states
- `currentAudioButton` - Tracks which button is currently playing
- Enhanced `close()` - Cleans up audio and button states on window close
- Added `playing` class to audio items for CSS styling
- Audio "ended" event listener auto-resets button state

**Template Changes:**
- Updated `audio-asset-item.hbs` with play and stop icons
- Added `data-playing` attribute for state tracking

**SCSS Enhancements:**
- `.asset-item.playing` - Highlighted state with accent background
- `.audio-preview-btn[data-playing="true"]` - Active button styling
- Red hover color (#cc0000) for stop button

### Files Changed
- `templates/partials/audio-asset-item.hbs` - Added stop icon
- `src/ui/ToastStudioApp.js` - Enhanced audio controls (~25 lines)
- `styles/components/_assets-tab.scss` - Added playing state styles

---

## Version 2.4.0-alpha.3 - Multi-Directory Scanning (2025-10-31)

### ✨ New Feature - Phase 4.1.1 Step 3

**Implemented multi-source asset scanning:**
- Audio and Images sub-tabs now populate with files from ALL directory sources
- Default module directories (sounds, images) automatically scanned
- Registered announcer pack directories automatically scanned
- Custom user directories automatically scanned
- Each asset tagged with source information (path, type, label)

**New Scanning Methods:**
- `_scanAllDirectories()` - Aggregates and scans all directory sources
- `_scanDirectory(path, type, sourceType, sourceLabel)` - Scans single directory with source tracking
- `_createAudioAsset()` - Creates audio asset with full source metadata
- `_createImageAsset()` - Creates image asset with source metadata and animated detection
- `_isAnimatedImage()` - Detects potentially animated images (GIF, WebP, APNG)

**Asset Data Structure:**
Each asset now includes:
- `path` - Full file path
- `name` - Filename
- `source` - Source directory path
- `sourceType` - "default", "announcer", or "custom"
- `sourceLabel` - Display label for source
- `category` - Audio category (for audio files)
- `animated` - Boolean flag (for image files)
- `thumbnail` - Thumbnail path (for images)
- `size` - File size (placeholder)

**Technical Implementation:**
- Uses Foundry's `FilePicker.browse()` API for all directory scanning
- Supports "audio", "images", or "both" directory types
- Error handling for inaccessible directories with console warnings
- Maintained backwards compatibility with legacy methods
- Updated `_getAssetData()` to use new scanning system

**Animated Image Support:**
- Detection based on file extension (.gif, .webp, .apng)
- `animated` property added to all image assets
- Ready for UI badges in Step 6

**Next:** Step 4 will enhance animated image display and Step 5 will add FilePicker UI for directory management.

### Files Changed
- `src/ui/ToastStudioApp.js` - Added ~110 lines of multi-directory scanning logic

---

## Version 2.4.0-alpha.2 - Directory Management Backend (2025-10-31)

### ✨ New Feature - Phase 4.1.1 Step 2

**Implemented directory management backend:**
- Sub-tab switching now functional (Directories, Audio, Images)
- Directory data providers for Default, Announcer Packs, Custom
- CRUD operations for custom directories (add, edit, remove)
- Settings integration for persistent directory storage

**New Settings:**
- `assets-default-subtab` (client) - Which sub-tab to show by default
- `custom-asset-directories` (client, hidden) - User's custom directories array

**ToastStudioApp Enhancements:**
- Constructor now loads `activeAssetsSubTab` from settings
- `getData()` populates `assetsSubTab` and `directories` data
- `_getDirectoriesData()` - Fetches all directory types
- `_getDefaultDirectories()` - Returns module's built-in directories
- `_getAnnouncerPackDirectories()` - Gets registered announcer packs
- `_getCustomDirectories()` - Loads user directories from settings
- `addCustomDirectory()` - Add new directory with Foundry path
- `removeCustomDirectory()` - Remove by ID with confirmation
- `editCustomDirectory()` - Update directory properties

**Event Handlers:**
- Sub-tab switching (clicks switch between Directories/Audio/Images)
- Remove directory (with Dialog confirmation)
- Add/Edit directory placeholders (will be implemented in Step 5)

**Technical:**
- All directory methods use Foundry's settings API
- Ready for FilePicker integration in Step 5
- Settings stored per-client (user-specific)
- Directory objects include: id, path, type, label, addedAt

**Next:** Step 3 - Multi-Directory Scanning will scan all directory sources
and populate the Audio/Images sub-tabs with files from all locations.

### Files Changed
- `src/core/ToastManager.js` - Added 2 new settings
- `src/ui/ToastStudioApp.js` - Added ~130 lines of directory management

---

## Version 2.4.0-alpha.1 - Asset Browser Enhancement: Sub-Tabs (2025-10-31)

### ✨ New Feature - Phase 4.1.1 Step 1

**Added sub-tab navigation to Assets tab:**
- Assets tab now split into 3 sub-tabs: Directories, Audio, Images
- Clean organization separating directory management from asset browsing
- Visual tab navigation with icons and active states

**New Template Structure:**
- Created `directories-subtab.hbs` - Manage asset source directories
- Created `audio-subtab.hbs` - Browse audio files with dedicated toolbar
- Created `images-subtab.hbs` - Browse images with animated/static filtering
- Created `directory-item.hbs` - Reusable directory display component

**UI Components:**
- Sub-tab navigation with hover and active states
- Directories sub-tab shows 3 sections: Default, Announcer Packs, Custom
- "+ Add Directory" button for future custom directory support
- Each sub-tab has its own toolbar (search, filter, refresh)
- File count badges on section headers

**SCSS Enhancements:**
- Added comprehensive sub-tab navigation styles
- Directory section and item styles with hover effects
- Add directory button with dashed border styling
- Animated image badge styles (for future use)
- CSS increased from 9.3 KB to 13.5 KB

**Technical:**
- Preloaded 4 new Handlebars partials in ToastManager
- Sub-tabs use display:none/block pattern for show/hide
- All styles properly scoped under #toast-studio

**Note:** This is Step 1 of Phase 4.1.1. Directory management, multi-source
scanning, and animated image support will be implemented in subsequent alphas.

### Files Changed
- `templates/partials/assets-tab.hbs` - Added sub-tab navigation
- Added 4 new template partials
- `styles/components/_assets-tab.scss` - Added ~200 lines of sub-tab styles
- `src/core/ToastManager.js` - Updated preloadTemplatePartials()

---

## Version 2.3.6 - Assets Toolbar Flex Layout Fix v3 (2025-10-30)

### 🐛 Bug Fix

**Fixed assets toolbar flex layout with universal reset:**
- Added `> * { flex: 0 0 auto; }` to neutralize any inherited flex behavior
- Search box overrides with `flex: 1 1 0` and `min-width: 0` to fill remaining space
- Dropdown and button inherit the `flex: 0 0 auto` from universal rule

**Problem:**
Previous attempts didn't account for potential inherited flex behavior from Foundry's
global styles that could interfere with our flex layout.

**Solution:**
Reset all direct children to `flex: 0 0 auto` first, then specifically override the
search box to grow and fill space. This ensures a clean slate regardless of global styles.

**Result:**
- Universal reset neutralizes any inherited flex behavior
- Search box reliably fills remaining horizontal space
- Dropdown stays at 200px width
- Refresh button sized to content

### Files Changed
- `styles/components/_assets-tab.scss` - Added universal child selector reset

---

## Version 2.3.5 - Assets Toolbar Flex Layout Fix v2 (2025-10-30)

### 🐛 Bug Fix

**Fixed assets toolbar flex layout with explicit width constraints:**
- Search box: `flex: 1 1 0` with `min-width: 0` (forces it to fill remaining space)
- Dropdown: `flex: 0 0 200px` with explicit `width: 200px` (locked to 200px)
- Refresh button: `flex: 0 0 auto` (sizes to content)

**Problem:**
The previous fix in v2.3.4 using `flex: 1 1 auto` wasn't working correctly because
flex-basis: auto uses the element's natural content size, which is unpredictable for inputs.

**Solution:**
Using `flex: 1 1 0` with `min-width: 0` forces the search box to be willing to shrink
below its natural size and grow to fill all remaining space. The dropdown now has both
flex-basis and explicit width to ensure it stays exactly 200px.

**Result:**
- Search box truly fills all remaining horizontal space
- Dropdown locked at readable 200px width
- Refresh button sized appropriately to content

### Files Changed
- `styles/components/_assets-tab.scss` - Updated flex properties with explicit constraints

---

## Version 2.3.4 - Assets Toolbar Flex Layout Fix (2025-10-30)

### 🐛 Bug Fix

**Fixed assets toolbar flex layout:**
- Search box now properly grows to fill available space
- Added explicit flex values to all toolbar items
- Search box: `flex: 1 1 auto` (grows to fill remaining space)
- Dropdown: `flex: 0 0 auto` (stays at fixed 200px)
- Refresh button: `flex: 0 0 auto` (stays at content size)

**Before:**
- Search box was too narrow (~5% of row)
- Refresh button was too wide (~75% of row)

**After:**
- Search box takes up majority of horizontal space
- Dropdown and button maintain appropriate fixed sizes

### Files Changed
- `styles/components/_assets-tab.scss` - Added flex values to all toolbar controls

---

## Version 2.3.3 - Foundry v13 Compatibility Fixes (2025-10-30)

### 🐛 Bug Fix

**Fixed Toast Studio compatibility issues with Foundry v13:**
- Fixed deprecated FilePicker API usage - now uses `foundry.applications.apps.FilePicker.implementation`
- Fixed "partial could not be found" error by preloading Handlebars partials on module init
- Fixed bringToTop error by checking if window is rendered before calling method
- Removed deprecation warnings from Foundry console

**Technical Changes:**
- Added `preloadTemplatePartials()` method to load all 6 partials during ready hook
- Updated `_listAudioFiles()` and `_listImageFiles()` to use v13 FilePicker API
- Added `rendered` check in `openStudio()` before calling `bringToTop()`

**Fixes:**
- "You are accessing the global FilePicker..." deprecation warning
- "The partial modules/toast/templates/partials/assets-tab.hbs could not be found" error
- "Failed to execute 'getComputedStyle' on 'Window'" error

### Files Changed
- `src/ui/ToastStudioApp.js` - Updated FilePicker API calls
- `src/core/ToastManager.js` - Added partial preloading and bringToTop safety check

---

## Version 2.3.2 - Assets Toolbar UI Fix (2025-10-30)

### 🐛 Bug Fix

**Fixed assets toolbar control sizing:**
- Text search field now taller (36px height) with better padding for readability
- Dropdown filter wider (200px min-width) and taller (36px height) so text is readable
- Refresh button narrower (reduced horizontal padding) to fit better
- All controls now consistent 36px height with 14px font size
- Improved alignment and visual consistency in toolbar

### Files Changed
- `styles/components/_assets-tab.scss` - Updated toolbar control dimensions

---

## Version 2.3.1 - CSS Scope Fix (2025-10-30)

### 🐛 Bug Fix

**Scoped assets tab styles to prevent CSS collisions:**
- Wrapped all styles in `_assets-tab.scss` under `#toast-studio` selector
- Prevents collision with other modules using generic class names like `.asset-item`, `.asset-list`, etc.
- Matches scoping pattern used in other component files
- Ensures Toast styles only apply within Toast Studio window

### Files Changed
- `styles/components/_assets-tab.scss` - Added `#toast-studio` scope wrapper

---

## Version 2.3.0 - Template & Style Modularization (2025-10-30)

### ✨ Enhancement

**Modularized templates and styles:**
- Split large `toast-studio.hbs` (138 lines) into 7 component partials
- Organized styles into component-specific SCSS files
- Created reusable components (empty-state, asset items)
- Aligned styles with template structure for better maintainability

**New Directory Structure:**
```
templates/
├── toast-studio.hbs (main, 17 lines)
└── partials/
    ├── assets-tab.hbs
    ├── audio-asset-item.hbs
    ├── image-asset-item.hbs
    ├── packages-tab.hbs
    ├── studio-tab.hbs
    └── empty-state.hbs (reusable)

styles/
├── toast.scss (imports all)
└── components/
    ├── _toast-overlay.scss (overlay & animations)
    ├── _toast-studio.scss (studio window & tabs)
    └── _assets-tab.scss (assets tab)
```

**Benefits:**
- Each component's template and styles are logically grouped
- Easier to find and modify specific features
- Reusable components reduce duplication
- Better code organization and maintainability
- Smaller, more focused files

### Files Changed
- `templates/toast-studio.hbs` - Refactored to use partials
- Added 6 new template partials in `templates/partials/`
- `styles/toast.scss` - Now imports component stylesheets
- Added 3 new SCSS component files in `styles/components/`

---

## Version 2.2.0 - SCSS Refactor (2025-10-30)

### ✨ Enhancement

**Migrated from CSS to SCSS:**
- Converted `styles/toast.css` to `styles/toast.scss`
- Improved maintainability with nested selectors and SCSS features
- Added automatic SCSS compilation to build process
- Production builds use compressed CSS, development builds use expanded
- Added `sass` package as dev dependency

**Build Process:**
- SCSS automatically compiles to CSS during build
- Compiled CSS is gitignored (generated from source)
- Source SCSS is version controlled

**Benefits:**
- Cleaner, more maintainable stylesheet code
- Better organization with nesting under `.toast-overlay`
- Easier to align styles with UI template structure
- Smaller production CSS with compression

### Files Changed
- Renamed `styles/toast.css` → `styles/toast.scss`
- `build.js` - Added SCSS compilation step with `sass` package
- `.gitignore` - Added compiled CSS files
- `package.json` - Added `sass` dev dependency

---

## Version 2.1.3 - Close Button (2025-10-30)

### ✨ New Feature

**Close button for toasts:**
- Added "CLOSE" button in bottom-right corner of all toasts
- Users can now dismiss toasts early by clicking the button
- Button has `pointer-events: auto` while overlay maintains clickthrough
- Automatically stops TTS audio when closed
- Cancels auto-remove timers properly

**UX Improvements:**
- Toast overlay maintains `pointer-events: none` for UI clickthrough
- Close button styled with hover and active states
- Smooth fade-out animation when dismissed

### Files Changed
- `styles/toast.css` - Added close button styles
- `src/core/ToastManager.js` - Added close button to `renderToast()` and `renderToastWithTTS()`

---

## Version 2.1.2 - Images Directory Fix (2025-10-30)

### 🐛 Bug Fix

**Toast Studio images directory missing:**
- Added `images/` directory to build INCLUDE list
- Toast Studio can now browse and display image assets
- Fixed "Directory modules/toast/images does not exist" error

### Files Changed
- `build.js` - Added `images/` to INCLUDE array

---

## Version 2.1.1 - Build System Fix (2025-10-30)

### 🐛 Bug Fix

**Build system refactoring:**
- Fixed ToastStudioApp not being included in build output
- Refactored build.js to use single source of truth for module list
- `SOURCE_MODULES` constant now used by all build functions
- Eliminates duplicate module list maintenance

### Files Changed
- `build.js` - Refactored to use centralized `SOURCE_MODULES` and `REQUIRED_CLASSES` constants

---

## Version 2.1.0 - Toast Studio (Phase 4.1) (2025-10-30)

### ✨ New Feature: Toast Studio

Introducing **Toast Studio** - a comprehensive GUI for browsing and managing toast assets!

**Open Toast Studio:**
```javascript
game.toast.studio.open();
```

**Features:**
- 🎵 **Audio Browser** - Browse, preview, and copy code for all audio files in the module
- 🖼️ **Image Browser** - Browse, preview, and use images from the module
- 🔍 **Search & Filter** - Quickly find assets with search and category filters
- 📋 **Copy to Clipboard** - One-click code copying for easy toast creation
- 🎨 **Tabbed Interface** - Clean, organized UI with tabs for Assets, Packages (coming soon), and Studio (coming soon)

**New Files:**
- `src/ui/ToastStudioApp.js` - Main GUI application
- `templates/toast-studio.hbs` - Handlebars template
- Updated CSS with Toast Studio styles

**New API Methods:**
- `game.toast.studio.open(options)` - Open Toast Studio window
- `game.toast.studio.close()` - Close Toast Studio window

**New Settings:**
- **Studio Default Tab** (Client) - Choose which tab opens by default
- **Asset Preview Volume** (Client) - Set default volume for audio previews

**Phase 4.2 Coming Soon:**
- Package Manager for saving and launching toast presentations
- DALL-E 3 integration for image generation
- Visual presentation editor

### Files Changed
- Added `src/ui/ToastStudioApp.js` - Toast Studio application
- Added `templates/toast-studio.hbs` - Studio template
- Updated `styles/toast.css` - Added studio styles
- Updated `src/core/ToastManager.js` - Added studio API and settings
- Updated `build.js` - Added UI files to build process

---

## Version 2.0.3 - Shape Element Fix (2025-10-30)

### 🐛 Bug Fix

**Shape elements not rendering:**
- Fixed shape elements not appearing when using `color` property
- Shape elements now accept both `color` and `backgroundColor` properties
- `color` is now the recommended property name (more intuitive for users)
- `backgroundColor` still supported for backwards compatibility

**Example:**
```javascript
game.toast.show([
  {
    type: "shape",
    shape: "rect",
    color: "#ff0000",  // Now works correctly!
    width: "400px",
    height: "200px"
  }
]);
```

### Files Changed
- `src/core/ToastManager.js` - Updated shape element rendering to accept both `color` and `backgroundColor`

---

## Version 2.0.2 - API Fix (2025-10-30)

### 🐛 Critical Bug Fix

**game.toast.show() API Error:**
- Fixed `TypeError: elements.forEach is not a function`
- `game.toast.show()` now correctly accepts an array of elements
- Removed incorrect config object pattern

**New Clean API Design:**
```javascript
// Simple case
game.toast.show([
  game.toast.sound("first-blood"),
  game.toast.simpleText("VICTORY!")
]);

// Complex case with helper functions
game.toast.show([
  game.toast.sound("dominating"),
  game.toast.simpleText("BOSS DEFEATED!", {
    color: "#FFD700",
    fontSize: "120px",
    fontWeight: "bold"
  }),
  game.toast.tokenImage(token.id, { width: "300px", height: "300px" })
]);

// Or use raw element objects
game.toast.show([
  {
    type: "text",
    text: "Custom",
    color: "#ff0000"
  }
]);
```

### ✨ New Helper Functions

Added convenience methods for creating common elements:
- `game.toast.simpleText(text, options)` - Create text element
- `game.toast.sound(soundName)` - Create sound element
- `game.toast.image(src, options)` - Create image element
- `game.toast.tokenImage(tokenId, options)` - Create token image element
- `game.toast.actorImage(actorId, options)` - Create actor image element

### Files Changed

- `src/core/ToastManager.js` - Fixed API registration and added helpers
- `package.json` - Version bump to 2.0.2
- `module.json` - Version bump to 2.0.2

---

## Version 2.0.1 - Bug Fixes (2025-10-30)

### 🐛 Bug Fixes

**Settings Registration Error:**
- Fixed "object is not iterable" error when opening Foundry Settings menu
- Removed empty `onChange` handlers from all 26 settings registrations
- Improves compatibility with dnd5e and other systems

**CSS Scope Issues:**
- Scoped all CSS selectors to `.toast-overlay` parent
- Prevents Toast styles from affecting Foundry VTT layout
- Fixed CSS bleed into sidebar, chat, and controls
- 10 selectors updated for proper isolation

### 📚 Documentation

**Reorganized Examples:**
- Moved all AI examples from `EXAMPLES.md` to `AI-GENERATION.md`
- Created new `EXAMPLES.md` with 22 basic, non-AI examples
- Covers simple toasts, templates, animations, audio, images
- Practical game examples (initiative, treasure, level up, death saves)
- Clear separation between basic and AI features

### 🔧 Technical Changes

- Removed 26 empty `onChange: () => {}` handlers from settings
- Scoped CSS: `.toast-element` → `.toast-overlay .toast-element`
- Scoped CSS: `.toast-text` → `.toast-overlay .toast-text`
- Scoped CSS: `.toast-glow` → `.toast-overlay .toast-glow`
- And 7 more CSS scoping fixes

### Files Changed

- `src/core/ToastManager.js` - Settings registration fix
- `styles/toast.css` - CSS scoping
- `docs/EXAMPLES.md` - New basic examples (22 examples, 904 lines)
- `docs/AI-GENERATION.md` - Added AI examples (18 examples)
- `package.json` - Version bump
- `module.json` - Version bump

---

## Version 2.0.0 - AI Text Generation (Phase 3)

### 🤖 Major Feature: Dynamic AI-Generated Announcements

Transform your toast notifications with AI-powered text generation! Instead of fixed templates, the AI creates unique, contextual announcements based on game state.

**Before (v1.5.0):**
```javascript
// Fixed template with token replacement
await game.toast.showDynamic("boss-kill", {
  killer: "Alice",
  boss: "Dragon"
});
// Output: "Alice strikes the final blow against Dragon! Victory is yours!"
```

**Now (v2.0.0):**
```javascript
// AI generates unique text from context
await game.toast.showDynamicAI({
  prompt: "[triumphant] Announce this as an epic fantasy narrator",
  actor: { name: "Alice", class: "Paladin", level: 8, weapon: "Holy Avenger" },
  target: { name: "Ancient Dragon", cr: 24 },
  context: "finishing-blow",
  damageDealt: 89
});
// AI Output: "With a mighty swing of her Holy Avenger, Paladin Alice delivers
// a devastating 89 damage blow, bringing the Ancient Dragon crashing down in defeat!"
```

### New Features

#### 🧠 AI Text Generation System
- **Multi-Provider Support**: Choose between Claude (Anthropic) or OpenAI
- **Model Selection**: Claude 3.5 Sonnet, Haiku, Opus, GPT-4o, GPT-4, GPT-3.5 Turbo
- **Custom GPT Support**: Use your trained Custom GPTs via OpenAI Assistants API
- **Fine-tuned Models**: Support for fine-tuned OpenAI models
- **User-Defined Context**: System-agnostic - you define what data matters
- **Free-Text Prompts**: No style presets - craft exact tone you want
- **ElevenLabs v3 Brackets**: Use `[angry]`, `[triumphant]`, `[gentle]` for voice tone

#### 🔑 Hybrid API Key System
**GM Keys (World Settings):**
- GM configures AI API keys (Claude + OpenAI)
- Granular sharing controls: None, All Players, By Role, By Username
- World-level model/temperature settings

**User Override (Client Settings):**
- Players can use their own API keys
- Overrides GM's shared keys
- Own provider, model, and Custom GPT selection

#### ⚠️ Security Warnings
- Prominent warnings on all API key settings
- Transparent about Foundry's lack of module sandboxing
- Best practices documentation
- Recommendations for separate keys with spending limits

#### 📊 Status Window for User Feedback
- Shows "Generating announcement..." with spinner
- 10-second timeout with clear notification
- Retry button on errors/timeout
- Fallback to template option
- Error messages with details

#### 🎯 Permission System
- Respects existing toast permissions
- Additional AI key access check
- Clear error messages for permission issues

### API Methods

**New method: `game.toast.showDynamicAI(config)`**

```javascript
await game.toast.showDynamicAI({
  // Required: Tone/style prompt
  prompt: "Speak as an epic fantasy narrator",

  // Optional: User-defined context (any structure)
  actor: {
    name: "Alice",
    class: "Paladin",
    level: 8,
    hp: 45,
    maxHp: 68,
    weapon: "Holy Avenger"
  },

  target: {
    name: "Ancient Dragon",
    type: "Dragon",
    cr: 24
  },

  // Optional: Additional context
  context: "finishing-blow",
  damageDealt: 89,
  abilityUsed: "Divine Smite",
  location: "Dragon's lair",

  // Optional: Visual elements
  elements: [
    { type: "text", text: "BOSS DEFEATED!", color: "#FFD700", fontSize: "100px" }
  ],

  // Optional: Fallback template if AI fails
  fallbackTemplate: "boss-kill"
});
```

**Features:**
- AI generates text from context
- ElevenLabs converts to speech
- Broadcasts to all players
- Synchronized playback
- Automatic retry/fallback on errors

### Settings Added

**World Settings (14 new settings):**
- Enable AI Text Generation
- AI Provider (Claude/OpenAI)
- Claude API Key (GM)
- OpenAI API Key (GM)
- Share AI Keys With (none/all/role/username)
- AI Keys - Allowed Roles
- AI Keys - Allowed Usernames
- AI Model Selection
- OpenAI Mode (standard/custom-gpt/fine-tuned)
- OpenAI Custom ID
- Max Tokens (default: 150)
- Temperature (default: 0.7)

**Client Settings (5 new settings):**
- Use Own AI API Keys
- AI Provider (Your Keys)
- Claude API Key (Your Key)
- OpenAI API Key (Your Key)
- OpenAI Mode (Your Key)
- OpenAI Custom ID (Your Key)

### Technical Implementation

**AI Provider Architecture:**
- `AIProvider` base class - Interface for all providers
- `ClaudeProvider` - Claude Messages API integration
- `OpenAIProvider` - Chat Completions + Assistants API
- `AIProviderFactory` - Provider routing and instantiation

**Status Window System:**
- `AIStatusWindow` class - User feedback UI
- Generating spinner with CSS animation
- Error/timeout icons
- Retry/fallback/cancel buttons
- Auto-close on success

**Core Flow:**
1. Permission checks (toast + AI key access)
2. API key resolution (user's own or GM's shared)
3. Show status window: "Generating..."
4. 10-second timeout protection
5. AI provider generates text
6. ElevenLabs generates TTS
7. Broadcast to all players
8. Synchronized playback

### Use Cases

**Epic Boss Kills:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator with gravitas",
  actor: { name: "Alice", class: "Paladin", level: 8 },
  target: { name: "Ancient Dragon", cr: 24 },
  context: "finishing-blow",
  damageDealt: 89
});
```

**Clutch Heals:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[gentle] Describe this as a merciful act",
  actor: { name: "Cleric Bob", class: "Life Cleric" },
  target: { name: "Wounded Alice", hp: 2, maxHp: 68 },
  context: "clutch-heal",
  healingAmount: 34
});
```

**Hype Announcements:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[excited] Sports commentator announcing the winning goal!",
  actor: { name: "Charlie", class: "Fighter" },
  target: { name: "Lich King" },
  context: "critical-hit",
  damageDealt: 156,
  wasCritical: true
});
```

### System-Agnostic Design

Works with **any** game system - you define the context:

**D&D 5e:**
```javascript
actor: {
  name: token.name,
  class: token.actor.system.details.class,
  level: token.actor.system.details.level
}
```

**Pathfinder 2e:**
```javascript
actor: {
  name: token.name,
  class: token.actor.system.details.class.value,
  level: token.actor.system.details.level.value
}
```

**Custom Homebrew:**
```javascript
actor: {
  name: "Alice",
  "favorite food": "Pizza",
  "backstory": "Orphaned as a child",
  "secret": "Actually a dragon in disguise"
}
```

### Migration Notes

**Breaking Changes:** None - all changes are backwards compatible

**New Capabilities:**
- Configure AI provider in Module Settings
- Use `game.toast.showDynamicAI()` for AI-generated announcements
- Existing `game.toast.showDynamic()` (template-based) still works
- All v1.5.0 features remain unchanged

**Setup Required:**
1. Enable AI Text Generation in Module Settings (GM)
2. Configure AI provider (Claude or OpenAI)
3. Add API key (GM or individual users)
4. Optionally configure key sharing permissions
5. Start using `game.toast.showDynamicAI()`

**Security Considerations:**
- Review API key security warnings in settings
- Use separate API keys for Foundry
- Set spending limits on API keys
- Monitor API usage regularly
- Only install trusted modules

### Documentation

- Added comprehensive AI generation guide to README
- Added security warning section
- Updated API reference with `showDynamicAI()`
- Added example macros for common scenarios
- System-specific context mapping examples

### File Changes
- `scripts/toast.js`: +917 lines (AI providers, settings, status window, core method)
- `README.md`: Updated with Phase 3 documentation
- `CHANGELOG.md`: v2.0.0 entry
- New file: Example macros for AI generation

---

## Version 1.5.0 - ElevenLabs TTS Integration (Phase 2)

### New Features

#### 🎙️ AI Voice Generation with ElevenLabs
- **Dynamic TTS generation**: Convert templates to AI-generated voice announcements
- **New API method**: `game.toast.showDynamic(templateId, tokens, elements)` - Generate TTS and display toasts
- **ElevenLabs integration**: Uses ElevenLabs API for high-quality text-to-speech
- **Per-user API keys**: Each player configures their own ElevenLabs API key (client-scoped settings)
- **Voice selection**: Choose from 100+ voices in the ElevenLabs voice library
- **Synchronized playback**: All players hear the same generated audio simultaneously

**Example:**
```javascript
// Generates AI voice and displays to all players
await game.toast.showDynamic("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
}, [
  { type: "text", text: "BOSS DEFEATED!", color: "#FFD700", fontSize: "100px" }
]);
```

#### 💾 Smart Caching System
- **IndexedDB caching**: Generated audio cached locally in browser storage
- **Cache key hashing**: Audio cached based on text + voice ID combination
- **LRU eviction**: Oldest items automatically removed when cache exceeds size limit
- **Configurable cache size**: Set maximum cache size (default: 100MB)
- **Cache persistence**: Cached audio survives browser restarts
- **Cache management API**: Clear cache, check size, and count cached items

#### ⚙️ User Settings
- **ElevenLabs API Key** (client-scoped): Personal API key for TTS generation
- **Voice ID** (client-scoped): Selected voice for TTS (default: Rachel)
- **Enable TTS Cache** (client-scoped): Toggle caching on/off (default: on)
- **Cache Size** (client-scoped): Maximum cache size in MB (default: 100MB)

#### 🔒 Security Architecture
- **Triggering user pays**: User who triggers toast generates TTS with their own API key
- **Client-side keys**: API keys never transmitted to server or other clients
- **GM validation**: TTS requests validated by GM before broadcasting
- **Audio broadcast**: Generated audio sent to all clients for synchronized playback

### API Methods

**New method: `game.toast.showDynamic(templateId, tokens, elements)`**
- Renders template with tokens
- Generates TTS audio using user's ElevenLabs API key
- Caches generated audio locally
- Sends to GM for validation
- GM broadcasts to all players
- All players hear synchronized audio

**New namespace: `game.toast.cache`**
- `clear()` - Clear all cached TTS audio
- `getSize()` - Get total cache size in bytes
- `getCount()` - Get number of cached audio files

**Examples:**
```javascript
// Generate TTS toast
await game.toast.showDynamic("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});

// Check cache status
const size = await game.toast.cache.getSize();
const count = await game.toast.cache.getCount();
console.log(`Cache: ${count} files, ${(size / 1024 / 1024).toFixed(2)} MB`);

// Clear cache
await game.toast.cache.clear();
```

### Use Cases
- **Epic boss kills**: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
- **Clutch heals**: "Alice comes in with a clutch heal on Bob, pulling them back from the brink!"
- **Kill streaks**: "Charlie just eliminated three enemies in rapid succession! Unstoppable!"
- **Party achievements**: "The party has completed The Lost Temple! Huzzah!"
- **Personalized moments**: Every announcement unique with player/enemy names

### Technical Changes
- Added `showDynamic(templateId, tokens, elements)` method (scripts/toast.js:949-1035)
- Added `renderToastWithTTS(elements, ttsAudio)` method (scripts/toast.js:1043-1109)
- Added `TTSCacheManager` class with IndexedDB integration (scripts/toast.js:1285-1496)
  - `init()` - Initialize IndexedDB
  - `get(key)` - Retrieve cached audio
  - `set(key, audioData)` - Cache audio data
  - `getSize()` - Calculate total cache size
  - `count()` - Count cached items
  - `clear()` - Clear all cached audio
  - `evictIfNeeded(maxSizeMB)` - LRU cache eviction
  - `generateKey(text, voiceId)` - Hash-based cache key generation
- Added `ElevenLabsAPI` class for TTS generation (scripts/toast.js:1498-1579)
  - `generateTTS(text, apiKey, voiceId)` - Generate TTS via ElevenLabs API
  - `testAPIKey(apiKey)` - Validate API key
- Added TTS socket constants: `SOCKET_TTS_REQUEST`, `SOCKET_TTS_BROADCAST` (scripts/toast.js:9-10)
- Added TTS socket handlers for request/broadcast pattern (scripts/toast.js:537-571)
- Added cache initialization on module ready (scripts/toast.js:32-38)
- Exposed `showDynamic` in global API (scripts/toast.js:581)
- Exposed `game.toast.cache` namespace in API (scripts/toast.js:597-601)
- Added 4 new client-scoped settings for ElevenLabs configuration (scripts/toast.js:93-136)

### Documentation
- Updated "Dynamic TTS Templates" section in README.md
- Added "ElevenLabs Setup" section with configuration instructions
- Added "Cache Management" section with API examples
- Updated API Reference with `showDynamic()` documentation
- Updated API Reference with `game.toast.cache` methods
- Added TTS usage examples throughout documentation
- Removed "Phase 2 coming soon" notes - it's here!

### Migration Notes
**Breaking Changes:** None - all changes are backwards compatible

**New Capabilities:**
- Configure ElevenLabs API key in Module Settings
- Use `game.toast.showDynamic()` for AI voice announcements
- Manage TTS cache via `game.toast.cache` methods
- Templates from v1.4.0 work seamlessly with TTS

**Setup Required:**
1. Sign up at [elevenlabs.io](https://elevenlabs.io) (free tier available)
2. Get your API key from profile settings
3. Configure in Module Settings → Toast → ElevenLabs API Key
4. Optionally choose a voice ID (default: Rachel)

---

## Version 1.4.0 - Dynamic TTS Templates (Phase 1)

### New Features

#### 📝 Template System for Epic Moments
- **Template registration**: Create reusable text templates with `{tokens}` for dynamic content
- **Token replacement**: Automatically replace tokens with actual values at runtime
- **Token validation**: Ensures all required tokens are provided before rendering
- **10 built-in templates**: Pre-made templates for boss kills, clutch heals, kill streaks, and more
- **Template management**: Register, get, list, delete templates via API
- **Tag filtering**: Organize and filter templates by tags (combat, heal, boss, etc.)

**Example:**
```javascript
// Register a template
game.toast.templates.register("boss-kill", {
  template: "{killer} strikes the final blow against {boss}! Victory is yours!",
  tags: ["boss", "victory"],
  duration: 4
});

// Render with tokens
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});
// Returns: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

### Built-in Templates

**Boss/Enemy Defeats:**
- `boss-kill` - Epic boss defeat announcement
- `epic-defeat` - General enemy vanquished

**Healing/Support:**
- `clutch-heal` - Dramatic heal save
- `life-saver` - Party save moment

**Kill Streaks:**
- `triple-kill` - Three rapid eliminations
- `killing-spree` - Rampage announcement

**Critical Moments:**
- `clutch-save` - Party doom prevention
- `perfect-shot` - Incredible skill shot

**Party Achievements:**
- `quest-complete` - Quest completion
- `level-up` - Character level progression

### API Methods

**New namespace: `game.toast.templates`**
- `register(id, config)` - Register a new template
- `render(id, tokens)` - Render template with token values
- `get(id)` - Get template configuration
- `list(tag)` - List all templates (optionally filtered by tag)
- `delete(id)` - Delete a template

### Use Cases
- **Epic moment announcements** - Personalized text for boss kills, clutch saves
- **Player recognition** - Dynamic acknowledgment of player actions
- **Quest milestones** - Custom achievement announcements
- **Combat highlights** - "Play of the Game" moments
- **Foundation for TTS** - Phase 2 will add ElevenLabs audio generation

### Technical Changes
- Added `static templates = {}` storage (scripts/toast.js:10)
- Added `registerTemplate(id, config)` method (scripts/toast.js:254-286)
- Added `extractTokens(template)` helper (scripts/toast.js:293-303)
- Added `renderTemplate(id, tokens)` method (scripts/toast.js:311-338)
- Added `getTemplate(id)` method (scripts/toast.js:345-347)
- Added `listTemplates(tag)` method (scripts/toast.js:354-362)
- Added `deleteTemplate(id)` method (scripts/toast.js:369-376)
- Added `initializeBuiltInTemplates()` method with 10 templates (scripts/toast.js:381-448)
- Exposed `game.toast.templates` namespace in API (scripts/toast.js:506-512)
- Templates initialized on module ready (scripts/toast.js:27)

### Documentation
- Added comprehensive "Dynamic TTS Templates" section to README.md
- Documented all 10 built-in templates
- Added template API reference
- Included usage examples and best practices
- Added note about Phase 2 (ElevenLabs integration coming soon)

### Phase 2 Preview

This release lays the foundation for dynamic TTS generation. Phase 2 will add:
- ElevenLabs API integration
- Per-user API key configuration
- Audio caching system
- `game.toast.showDynamic()` method
- Automatic TTS generation and playback
- Synchronized audio across all clients

**Future API (not yet implemented):**
```javascript
await game.toast.showDynamic("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});
// Will generate TTS and display synchronized audio + visuals
```

### Migration Notes
**Breaking Changes:** None - all changes are backwards compatible

**New Capabilities:**
- Use templates to generate dynamic text for toasts
- Foundation ready for TTS integration in Phase 2

---

## Version 1.3.2 - Module Integration API

### New Features

#### 📦 Announcer Registration API for Modules
- **New API method**: `game.toast.registerAnnouncer(id, config)` - Other modules can register their own announcer packs
- **Automatic detection**: Registered announcers automatically appear in settings dropdown
- **Path flexibility**: Modules can store sounds anywhere in their own directory
- **Dynamic updates**: Settings update immediately when announcers are registered
- **Merge support**: Registered announcers merge with file-based announcers

**Example:**
```javascript
// In another module's ready hook
Hooks.once('ready', () => {
  if (game.toast && game.toast.registerAnnouncer) {
    game.toast.registerAnnouncer('my-epic-announcer', {
      name: 'Epic Movie Announcer',
      path: 'modules/my-module/sounds/announcer'
    });
  }
});
```

### Use Cases
- **Voice pack modules**: Create dedicated announcer pack modules for Toast
- **Game system integration**: Systems can include themed announcers
- **Module bundles**: Bundle relevant sound effects with your module
- **Community content**: Easy distribution of custom announcer packs
- **No file copying**: Users install your module, announcer works automatically

### Technical Changes
- Added `registeredAnnouncers` static property to store module registrations (scripts/toast.js:9)
- Added `registerAnnouncer(id, config)` method for module registration (scripts/toast.js:100-133)
- Added `updateAnnouncerChoices()` to refresh settings dynamically (scripts/toast.js:138-151)
- Added `getRegisteredAnnouncerChoices()` helper (scripts/toast.js:157-163)
- Updated `scanAnnouncerPacks()` to merge registered + file-based announcers (scripts/toast.js:169-209)
- Updated `getAnnouncerSound()` to check registered announcers first (scripts/toast.js:217-242)
- Exposed `registerAnnouncer` in global API (scripts/toast.js:297)

### Documentation
- Added comprehensive "Module Integration" section to README.md
- Complete examples for module developers
- Best practices and troubleshooting guide
- module.json dependency configuration examples
- File organization recommendations
- Added `game.toast.registerAnnouncer()` to API Reference

### Migration Notes
**Breaking Changes:** None - all changes are backwards compatible

**For Module Developers:**
- Call `game.toast.registerAnnouncer()` during your module's `ready` hook
- Mark Toast as optional dependency in your module.json
- See [Module Integration](#module-integration) section for complete guide

---

## Version 1.3.1 - Graceful Failure & Weighted Random API

### New Features

#### 🎯 Weighted Random Sound API
- **New API method**: `game.toast.weightedRandomSound(soundsWithWeights, options)` - Control probability of sound selection
- **Built-in support**: No need to write custom weighted random functions
- **Synchronized**: Like `randomSound()`, selection happens before broadcast for perfect sync
- **Graceful failure**: Automatically filters nulls and invalid sources

**Example:**
```javascript
game.toast.weightedRandomSound([
  { src: "sounds/common-crit.wav", weight: 70 },   // 70% chance
  { src: "sounds/rare-crit.wav", weight: 20 },     // 20% chance
  { src: "sounds/legendary-crit.wav", weight: 10 } // 10% chance
], { volume: 0.9 })
```

### Improvements

#### 🛡️ Graceful Failure for Sound System
- **`getAnnouncerSound()`**: Returns `null` instead of throwing errors when filename is invalid or announcer pack not configured
- **`randomSound()`**: Automatically filters out `null` and invalid sources before selection
- **`weightedRandomSound()`**: Automatically filters out `null`, invalid sources, and invalid weights
- **Sound playback**: Fails silently with console warning if source is missing/invalid - doesn't break toast display
- **Robust error handling**: Missing sound files won't prevent visual elements from displaying

### Use Cases
- **Mix announcer packs**: Combine sounds from different packs safely
  ```javascript
  game.toast.randomSound([
    game.toast.getAnnouncerSound("crit-1.wav"),  // Exists
    game.toast.getAnnouncerSound("crit-2.wav"),  // Doesn't exist - safely filtered
    game.toast.getAnnouncerSound("crit-3.wav")   // Exists
  ])
  ```
- **Conditional sounds**: Add optional sounds without checking existence
- **Development**: Test macros without all sound files present
- **Community packs**: Use incomplete announcer packs without errors

### Technical Changes
- Updated `getAnnouncerSound()` to validate input and return null on failure (scripts/toast.js:139-157)
- Updated `createRandomSoundElement()` to filter nulls/invalid sources (scripts/toast.js:222-248)
- Added `createWeightedRandomSoundElement()` method (scripts/toast.js:250-304)
- Exposed `weightedRandomSound` in global API (scripts/toast.js:210)
- Enhanced `playSound()` validation and error handling (scripts/toast.js:424-470)
- All errors log warnings instead of throwing exceptions

### Documentation
- Added `game.toast.weightedRandomSound()` to API Reference
- Updated `game.toast.randomSound()` docs with graceful failure notes
- Updated `game.toast.getAnnouncerSound()` docs with null return behavior
- Replaced custom weighted random example with built-in API method
- Added examples showing safe mixing of announcer packs

---

## Version 1.3.0 - Announcer Packs

### New Features

#### 🎙️ Announcer Pack System
- **Switchable voice packs**: Organize announcer voice files into folders that can be switched via settings
- **Automatic detection**: Module scans `sounds/announcers/` folder and auto-populates available packs
- **New API method**: `game.toast.getAnnouncerSound(filename)` - Get sound path from active announcer pack
- **GM-controlled**: GMs select which announcer pack is active in Module Settings
- **Macro-friendly**: Write macros once, switch announcers without changing code

#### How It Works
```javascript
// In your macro - works with any announcer pack!
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
    volume: 0.9
  },
  { type: "text", text: "DOUBLE KILL!" }
]);
```

**Folder structure:**
```
sounds/announcers/
├── unreal-tournament/
│   └── double-kill.wav
├── bob-announcerton/
│   └── double-kill.wav
└── murderbot/
    └── double-kill.wav
```

**GM selects the active pack in settings, macros automatically use that pack!**

### Use Cases
- **Multiple languages**: Switch between English, Spanish, Japanese announcers
- **Campaign themes**: Different announcers for fantasy, sci-fi, horror campaigns
- **Voice variety**: Multiple narrators for the same game
- **Community packs**: Share and download custom announcer packs
- **A/B testing**: Try different voice actors without changing macros

### Technical Changes
- Added `announcerPack` setting in `registerSettings()` (scripts/toast.js:76-87)
- Added `scanAnnouncerPacks()` method using FilePicker.browse() (scripts/toast.js:95-132)
- Added `getAnnouncerSound(filename)` method (scripts/toast.js:139-142)
- Exposed `getAnnouncerSound` in global API (scripts/toast.js:195)
- Auto-scans announcer folders on module ready
- Dynamic setting choices based on detected folders

### Documentation
- Added comprehensive "Announcer Packs" section to README.md
- Documented folder structure and naming conventions
- Added examples for multi-language and themed announcers
- Updated API Reference with `getAnnouncerSound()` documentation
- Updated Quick Start and Sample Macros to use announcer system
- Included tips for creating and sharing announcer packs

### Migration Notes
**Breaking Changes:** None - all changes are backwards compatible

**Recommended Updates:**
- Move existing sounds to `sounds/announcers/[pack-name]/` folder structure
- Update macros to use `game.toast.getAnnouncerSound()` for easier announcer switching
- Create multiple announcer packs for variety

**Example Migration:**
```javascript
// Old way (still works)
src: "modules/toast/sounds/double-kill.wav"

// New way (announcer-pack friendly)
src: game.toast.getAnnouncerSound("double-kill.wav")
```

---

## Version 1.2.2 - Random Sound Selection

### New Features

#### 🎲 Synchronized Random Sound Selection
- **New API method**: `game.toast.randomSound()` - Randomly select from multiple sound files
- **Player synchronization**: All players hear the same randomly selected sound
- **Selection before broadcast**: Random selection happens client-side before broadcasting, ensuring consistency
- **Full options support**: Volume, delay, and loop options work with random sounds

#### How It Works
```javascript
game.toast.show([
  // Randomly picks one sound - synchronized across all players
  game.toast.randomSound([
    "sounds/variant-1.wav",
    "sounds/variant-2.wav",
    "sounds/variant-3.wav"
  ], { volume: 0.9 }),
  { type: "text", text: "CRITICAL!" }
]);
```

### Documentation
- **NEW FILE**: `RANDOM-SOUNDS.md` - Complete guide to random sound selection
  - Basic usage examples
  - Advanced techniques (weighted random, conditional selection)
  - Sound variant creation tips
  - File organization best practices
  - Testing and troubleshooting
- Updated `SAMPLE-MACROS.md` with random sound section
- Updated `README.md` with API reference
- Updated build script to include new documentation

### Technical Changes
- Added `createRandomSoundElement()` method to handle random selection
- Exposed `randomSound` in global API (scripts/toast.js:126)
- Selection occurs before socket broadcast, ensuring synchronization

### Use Cases
- Prevent audio repetition fatigue
- Add variety to frequent events (critical hits, level ups)
- Create more dynamic game feel
- Professional game polish

---

## Version 1.2.1 - Bug Fix

### Bug Fixes
- **Fixed overlay stacking issue**: When triggering a toast multiple times in quick succession, the second toast would stack in the upper left corner instead of displaying properly. Now automatically removes any existing overlay before creating a new one, ensuring toasts always display correctly.

### Technical Changes
- Added overlay cleanup logic in `renderToast()` to remove existing overlays before creating new ones
- Prevents duplicate DOM elements with the same ID

---

## Version 1.2.0 - Sound Effects Update

### New Features

#### 🔊 Sound Effect Support
- **New element type**: `sound` - Play audio files with your toasts
- **Volume control**: Set volume from 0.0 to 1.0
- **Delay support**: Delay sound playback for choreographed audio
- **Loop option**: Loop background music or ambient sounds
- **Multiple formats**: Supports MP3, OGG, WAV, WEBM
- **Source flexibility**: Web URLs or Foundry data paths
- **Foundry integration**: Uses AudioHelper when available, falls back to native Audio API

#### Sound Element Properties
```javascript
{
  type: "sound",
  src: "sounds/fanfare.mp3",  // URL or Foundry path
  volume: 0.8,                 // 0.0-1.0 (default: 0.8)
  delay: 0.5,                  // Seconds before playing (default: 0)
  loop: false                  // Loop the sound (default: false)
}
```

### Documentation Updates
- Added sound element documentation to README.md
- Added 5 sound effect examples to EXAMPLES.md
- Added sound file tips and free resource recommendations
- Updated element resolution helper to support sounds

### Technical Changes
- Modified `renderToast()` to handle sound elements separately from visual elements
- Added `playSound()` method with Foundry AudioHelper integration
- Updated `resolveElement()` to validate sound sources
- Enhanced duration calculation to handle sound delays

### Example: Critical Hit with Sound
```javascript
game.toast.show([
  {
    type: "sound",
    src: "sounds/sword-slash.mp3",
    volume: 0.7
  },
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "90px",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 45,
      duration: 1.5
    }
  }
]);
```

---

## Version 1.1.0 - Advanced Features Update

### New Features

#### 🔒 GM Validation System
- **Two-socket architecture**: Request/broadcast pattern for enhanced security
- **Server-side validation**: GM validates all toast requests before broadcasting
- **Permission enforcement**: Prevents unauthorized users from bypassing permissions via console
- When a non-GM user triggers a toast, it sends a request to the GM who validates permissions before broadcasting to all clients

#### ⏱️ Delay Parameter
- **Staggered animations**: Add `delay` (in seconds) to any animation
- **Choreographed sequences**: Create complex multi-element displays that appear in sequence
- **Example**: Background appears first (delay: 0), text follows (delay: 0.3s), icon last (delay: 0.6s)
- Works with both transition-based and CSS keyframe animations

#### 📐 Z-Index Control
- **Layering support**: Use `zIndex` property on any element
- **Visual depth**: Control which elements appear on top of others
- **Flexible stacking**: Combine with delays for professional, layered effects
- Higher values appear on top (e.g., background=1, text=2, icons=3)

#### 🔍 Element Resolution Helper
- **New API method**: `game.toast.resolveElement(element)`
- **Preview content**: Check what will be displayed before triggering
- **Validation**: Verify actor/token IDs are valid
- **Debugging**: Returns `{type, valid, content, error}` for troubleshooting

#### 📺 Local Preview Mode
- **New API method**: `game.toast.showLocal(elements)`
- **Testing tool**: Display toasts only on your screen without broadcasting
- **Development aid**: Perfect for testing layouts and timing

### Technical Improvements

- **Smarter duration calculation**: Auto-removes overlay after longest animation (including delays)
- **Enhanced permission checking**: Separated current user vs arbitrary user permission checks
- **Better error handling**: More descriptive console warnings for permission denials

### API Changes

**New Methods:**
```javascript
game.toast.showLocal(elements)           // Local preview
game.toast.resolveElement(element)       // Validate and preview element
```

**New Element Properties:**
```javascript
{
  zIndex: 10,                            // Layering control
  animation: {
    delay: 0.5                           // Delay in seconds
  }
}
```

**Enhanced Security:**
- `game.toast.show()` now uses request/broadcast pattern
- GM clients validate all incoming requests
- Unauthorized attempts are logged and blocked

### Documentation Updates

- Updated README.md with new features and examples
- Added "Staggered Animation with Layering" example
- Documented security architecture
- Added API reference for new methods
- Updated animation options section

### Example: Staggered Multi-Layer Toast

```javascript
game.toast.show([
  // Layer 1: Background (appears immediately)
  {
    type: "shape",
    width: "600px",
    height: "200px",
    backgroundColor: "#000000",
    borderRadius: "20px",
    opacity: 0.8,
    zIndex: 1,
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 100,
      duration: 0.5,
      delay: 0
    }
  },
  // Layer 2: Text (appears after 0.3s)
  {
    type: "text",
    text: "TRIPLE KILL!",
    color: "#ff0000",
    fontSize: "80px",
    zIndex: 2,
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 40,
      scale: 0.5,
      opacity: 0,
      duration: 0.8,
      delay: 0.3
    }
  },
  // Layer 3: Icon (appears after 0.6s)
  {
    type: "image",
    src: "icons/svg/skull.svg",
    width: "100px",
    height: "100px",
    zIndex: 3,
    animation: {
      startX: window.innerWidth / 2 + 150,
      startY: window.innerHeight / 2 - 50,
      scale: 0,
      duration: 0.5,
      delay: 0.6
    }
  }
]);
```

### Migration Notes

**Breaking Changes:** None - all changes are backwards compatible

**Recommended Updates:**
- Review permission settings if you have multiple GMs
- Test staggered animations in ADVANCED-ANIMATIONS.md
- Use `game.toast.showLocal()` for testing new toasts

---

## Version 1.0.0 - Initial Release

### Features
- Full-screen overlay system
- Multi-element support (text, images, tokens, actors, shapes)
- Socket-based broadcasting
- Permission system (GM-only, role-based, username-based)
- CSS and transition-based animations
- Multi-stage keyframe animations
- FVTT v13 compatibility
