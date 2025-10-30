# Phase 4: Toast Studio - Implementation Plan

> **Goal:** Build a comprehensive content creation studio for Toast within Foundry VTT

**Status:** Planning
**Version:** 2.1.0 (target)
**Started:** 2025-10-29

---

## Overview

Phase 4 adds a complete **Toast Studio** GUI that allows users to:
- Browse and preview existing assets (audio, images)
- Generate new assets with AI (DALL-E 3 images)
- Create and edit toast presentations visually
- Save and load toast packages
- Quick launch saved presentations

This transforms Toast from a code-based tool into a full-featured content studio.

---

## Phased Implementation

### Phase 4.1: Asset Browser & File Management ✅ PRIORITY
**Goal:** Browse, preview, and manage existing assets

**New Files:**
- `src/ui/ToastStudioApp.js` - Main GUI application (FormApplication)
- `src/ui/AssetBrowser.js` - Asset browsing component
- `src/ui/AudioPreview.js` - Audio preview player
- `src/ui/ImagePreview.js` - Image preview viewer
- `templates/toast-studio.hbs` - Main Handlebars template
- `templates/asset-browser.hbs` - Asset browser template

**Features:**
1. **GUI Framework**
   - Tabbed interface (Assets, Packages, Studio)
   - Responsive layout
   - Modal/window management

2. **Audio Browser**
   - List all audio files in `sounds/`
   - Preview playback with controls
   - Show file metadata (size, duration, format)
   - Filter by announcer pack
   - Search by filename

3. **Image Browser**
   - List all images in `modules/toast/images/`
   - Thumbnail preview
   - Full-size preview on click
   - Show file metadata (size, dimensions, format)
   - Search by filename

4. **File System Integration**
   - Use Foundry's `FilePicker` API
   - Browse user-uploaded files
   - Handle different file sources (data, public, s3)

**API Design:**
```javascript
// Open Toast Studio
game.toast.studio.open();

// Open to specific tab
game.toast.studio.open({ tab: 'assets' });

// Refresh asset list
game.toast.studio.assets.refresh();
```

**Settings:**
- `studio-default-tab` (client) - Default tab when opening studio

---

### Phase 4.2: Package Manager
**Goal:** Save, load, and launch toast presentations

**New Files:**
- `src/packages/PackageManager.js` - Package CRUD operations
- `src/packages/Package.js` - Package data model
- `templates/package-browser.hbs` - Package list template
- `templates/package-editor.hbs` - Package editor template

**Features:**
1. **Package Creation**
   - Save current toast config as package
   - Name, description, category, tags
   - Include elements, animations, sounds, AI prompts
   - Thumbnail/icon selection

2. **Package Browser**
   - List all saved packages
   - Grid or list view
   - Filter by category/tags
   - Search by name/description
   - Quick launch button

3. **Package Editor**
   - Load package for editing
   - Modify all properties
   - Test/preview changes
   - Save changes

4. **Package Storage**
   - Store as JSON in `Data/modules/toast/packages/`
   - Each package = one `.json` file
   - Server-side file writing via Foundry API

5. **Import/Export**
   - Export package as `.json` download
   - Import package from file upload
   - Share packages with community

**Package Schema:**
```javascript
{
  id: "unique-id",
  name: "Boss Kill - Epic",
  description: "Epic boss kill celebration with dragon theme",
  version: "1.0.0",
  author: "Username",
  category: "combat",
  tags: ["boss", "victory", "epic"],
  thumbnail: "path/to/image.png",
  createdAt: "2025-10-29T12:00:00Z",
  updatedAt: "2025-10-29T12:00:00Z",

  // Toast configuration
  config: {
    // Option 1: Template-based
    type: "template",
    templateId: "boss-kill",
    tokens: {
      killer: "{actor.name}",
      boss: "{target.name}"
    },

    // Option 2: AI-generated
    type: "ai",
    prompt: "[triumphant] Epic fantasy narrator",
    context: {
      actor: "{actor}",
      target: "{target}"
    },

    // Option 3: Static elements
    type: "static",
    elements: [
      { type: "text", text: "VICTORY!", ... }
    ]
  },

  // Visual elements (shared across all types)
  elements: [
    {
      type: "text",
      text: "BOSS DEFEATED!",
      color: "#FFD700",
      fontSize: "100px",
      animation: {
        startX: 640,
        startY: 360,
        duration: 3
      }
    },
    {
      type: "sound",
      src: "modules/toast/sounds/victory.wav",
      volume: 0.9
    }
  ],

  // Asset references (for dependency tracking)
  assets: {
    sounds: ["sounds/victory.wav"],
    images: ["images/dragon.png"]
  }
}
```

**API Design:**
```javascript
// Create new package
const pkg = await game.toast.packages.create({
  name: "My Epic Toast",
  config: { ... }
});

// List all packages
const packages = game.toast.packages.list();

// Get package by ID
const pkg = game.toast.packages.get("package-id");

// Launch package
await game.toast.packages.launch("package-id", {
  actor: token,
  target: targetToken
});

// Update package
await game.toast.packages.update("package-id", {
  name: "New Name"
});

// Delete package
await game.toast.packages.delete("package-id");

// Export package
const json = game.toast.packages.export("package-id");

// Import package
await game.toast.packages.import(jsonData);
```

**Settings:**
- `packages-directory` (world) - Directory for saved packages
- `packages-auto-backup` (world) - Auto-backup packages on save

---

### Phase 4.3: DALL-E 3 Integration
**Goal:** Generate images and save to disk

**New Files:**
- `src/ai/DALLEProvider.js` - DALL-E 3 API wrapper
- `src/ui/ImageGenerator.js` - Image generation UI component
- `templates/image-generator.hbs` - Generation form template

**Features:**
1. **DALL-E 3 API Integration**
   - Generate images from text prompts
   - Size selection (1024x1024, 1792x1024, 1024x1792)
   - Quality selection (standard, hd)
   - Style selection (vivid, natural)
   - API key management (reuse OpenAI key)

2. **Generation UI**
   - Prompt input with examples
   - Size/quality/style selectors
   - Cost estimate display
   - Generate button
   - Preview generated image
   - Regenerate option

3. **Save to Disk**
   - Save generated images to `Data/modules/toast/images/generated/`
   - Auto-generate filename from prompt
   - Option to rename before saving
   - Add to asset browser automatically

4. **Asset Integration**
   - Generated images appear in image browser
   - Can be used immediately in toasts
   - Metadata tracking (prompt, model, timestamp)

**API Design:**
```javascript
// Generate image
const image = await game.toast.assets.generateImage({
  prompt: "Epic dragon breathing fire",
  size: "1024x1024",
  quality: "hd",
  style: "vivid"
});

// Save to disk
await game.toast.assets.saveImage(image, {
  filename: "dragon-fire.png",
  directory: "images/generated"
});

// Get generation history
const history = game.toast.assets.getGenerationHistory();
```

**Settings:**
- `dalle-default-size` (client) - Default image size
- `dalle-default-quality` (client) - Default quality
- `dalle-default-style` (client) - Default style
- `generated-images-directory` (world) - Where to save generated images

**Cost Estimates:**
- Standard 1024x1024: $0.040 per image
- Standard 1024x1792 or 1792x1024: $0.080 per image
- HD 1024x1024: $0.080 per image
- HD 1024x1792 or 1792x1024: $0.120 per image

---

### Phase 4.4: Presentation Studio
**Goal:** Visual editor for creating toasts

**New Files:**
- `src/ui/PresentationStudio.js` - Visual editor component
- `src/ui/ElementEditor.js` - Element property editor
- `src/ui/TimelineEditor.js` - Animation timeline
- `src/ui/CanvasPreview.js` - Live preview canvas
- `templates/presentation-studio.hbs` - Studio template

**Features:**
1. **Canvas Preview**
   - Live preview of toast
   - WYSIWYG editing
   - Grid and guides
   - Zoom in/out
   - Pan and navigate

2. **Element Library**
   - Drag elements onto canvas
   - Text, Image, Shape, Sound
   - Quick add buttons
   - Element templates

3. **Property Editor**
   - Edit selected element
   - Position (X, Y)
   - Size (width, height)
   - Color, font, style
   - Animation properties
   - Real-time preview

4. **Layer Management**
   - List all elements
   - Reorder layers (z-index)
   - Show/hide elements
   - Lock/unlock elements
   - Duplicate elements

5. **Timeline Editor**
   - Visual timeline for animations
   - Keyframe editing
   - Duration adjustment
   - Delay/offset controls
   - Play/pause preview

6. **Test & Preview**
   - Test locally button
   - Test broadcast button (to all players)
   - Preview with different screen sizes
   - Preview with token substitution

**API Design:**
```javascript
// Open studio for new toast
game.toast.studio.create();

// Open studio with existing package
game.toast.studio.edit("package-id");

// Add element to canvas
game.toast.studio.addElement({
  type: "text",
  text: "Hello World"
});

// Update element
game.toast.studio.updateElement("element-id", {
  x: 100,
  y: 200
});

// Preview current toast
game.toast.studio.preview();

// Save as package
await game.toast.studio.saveAsPackage({
  name: "My Toast"
});
```

---

## Technical Architecture

### Module Structure

```
src/
├── ai/
│   ├── AIProvider.js
│   ├── ClaudeProvider.js
│   ├── OpenAIProvider.js
│   ├── AIProviderFactory.js
│   └── DALLEProvider.js          ← NEW (Phase 4.3)
│
├── tts/
│   ├── TTSCacheManager.js
│   └── ElevenLabsAPI.js
│
├── templates/
│   └── TemplateManager.js
│
├── packages/                      ← NEW (Phase 4.2)
│   ├── PackageManager.js
│   └── Package.js
│
├── ui/                            ← NEW (Phase 4.1)
│   ├── ToastStudioApp.js          - Main GUI window
│   ├── AssetBrowser.js            - Asset browsing
│   ├── AudioPreview.js            - Audio playback
│   ├── ImagePreview.js            - Image viewing
│   ├── ImageGenerator.js          - DALL-E UI (Phase 4.3)
│   ├── PresentationStudio.js      - Visual editor (Phase 4.4)
│   ├── ElementEditor.js           - Property editor (Phase 4.4)
│   ├── TimelineEditor.js          - Animation timeline (Phase 4.4)
│   └── CanvasPreview.js           - Live preview (Phase 4.4)
│
├── core/
│   ├── ToastManager.js
│   └── ToastManagerIntegration.js
│
└── index.js
```

### Templates

```
templates/
├── toast-studio.hbs               ← Main studio window
├── asset-browser.hbs              ← Asset list/preview
├── package-browser.hbs            ← Package list
├── package-editor.hbs             ← Package form
├── image-generator.hbs            ← DALL-E interface
└── presentation-studio.hbs        ← Visual editor
```

### Data Storage

```
Data/modules/toast/
├── packages/                      ← Saved toast packages
│   ├── boss-kill-epic.json
│   ├── critical-hit-fire.json
│   └── clutch-heal.json
│
├── images/                        ← Images (existing + generated)
│   ├── generated/                 ← DALL-E generated images
│   │   ├── dragon-fire.png
│   │   └── epic-background.png
│   └── uploads/                   ← User uploads
│
└── sounds/                        ← Audio files (existing)
    └── announcers/
```

---

## API Additions

### Package Management
```javascript
game.toast.packages.create(config)
game.toast.packages.get(id)
game.toast.packages.list(filters)
game.toast.packages.update(id, changes)
game.toast.packages.delete(id)
game.toast.packages.launch(id, context)
game.toast.packages.export(id)
game.toast.packages.import(json)
```

### Asset Management
```javascript
game.toast.assets.listAudio(filters)
game.toast.assets.listImages(filters)
game.toast.assets.previewAudio(path)
game.toast.assets.previewImage(path)
game.toast.assets.generateImage(config)
game.toast.assets.saveImage(data, options)
game.toast.assets.getGenerationHistory()
```

### Studio
```javascript
game.toast.studio.open(options)
game.toast.studio.close()
game.toast.studio.create()
game.toast.studio.edit(packageId)
game.toast.studio.addElement(element)
game.toast.studio.updateElement(id, changes)
game.toast.studio.removeElement(id)
game.toast.studio.preview()
game.toast.studio.saveAsPackage(config)
```

---

## Settings

### Phase 4.1 Settings
- `studio-default-tab` (client) - Default tab: "assets", "packages", "studio"
- `asset-preview-volume` (client) - Default volume for audio preview
- `asset-thumbnail-size` (client) - Thumbnail size for images

### Phase 4.2 Settings
- `packages-directory` (world) - Directory for packages (default: "modules/toast/packages")
- `packages-auto-backup` (world) - Auto-backup on save
- `packages-default-category` (client) - Default category for new packages

### Phase 4.3 Settings
- `dalle-api-key-world` (world) - DALL-E API key (GM shares)
- `dalle-api-key-client` (client) - User's own DALL-E key
- `dalle-use-own-key` (client) - Use own key instead of GM's
- `dalle-default-size` (client) - Default image size
- `dalle-default-quality` (client) - Default quality
- `dalle-default-style` (client) - Default style
- `generated-images-directory` (world) - Save location

### Phase 4.4 Settings
- `studio-grid-size` (client) - Grid snap size
- `studio-show-grid` (client) - Show grid in preview
- `studio-show-guides` (client) - Show alignment guides
- `studio-auto-save` (client) - Auto-save interval (minutes)

---

## UI Mockup

### Main Studio Window

```
┌─────────────────────────────────────────────────────────────┐
│ Toast Studio                                          [X]    │
├─────────────────────────────────────────────────────────────┤
│ [Assets] [Packages] [Studio]                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┬──────────────────────────────────────┐  │
│  │ 🎵 Audio      │ [Search: _____________] [Filter ▼]    │  │
│  │               │                                        │  │
│  │ > Announcers  │ ┌────────────────────────────────┐   │  │
│  │   - Default   │ │ 🔊 critical-hit.wav            │   │  │
│  │   - Epic      │ │ Duration: 2.3s | Size: 45KB    │   │  │
│  │               │ │ [▶ Preview] [Use in Toast]     │   │  │
│  │ > Custom      │ └────────────────────────────────┘   │  │
│  │   - Effects   │                                        │  │
│  │   - Music     │ ┌────────────────────────────────┐   │  │
│  │               │ │ 🔊 boss-kill.wav               │   │  │
│  │ 🖼️ Images     │ │ Duration: 4.1s | Size: 89KB    │   │  │
│  │               │ │ [▶ Preview] [Use in Toast]     │   │  │
│  │ > Generated   │ └────────────────────────────────┘   │  │
│  │ > Uploads     │                                        │  │
│  │               │ [+ Generate Image (DALL-E)]           │  │
│  └───────────────┴──────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Package Browser

```
┌─────────────────────────────────────────────────────────────┐
│ Toast Studio                                          [X]    │
├─────────────────────────────────────────────────────────────┤
│ [Assets] [Packages] [Studio]                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [+ New Package]  [Search: _____] [Category ▼] [Tags ▼]    │
│                                                               │
│  ┌──────────────────┬──────────────────┬──────────────────┐ │
│  │ 🎯 Boss Kill     │ ⚔️ Critical Hit  │ 💚 Clutch Heal   │ │
│  │ Epic Fantasy     │ Fire & Thunder   │ Divine Light     │ │
│  │ by Dynvar        │ by Dynvar        │ by Dynvar        │ │
│  │                  │                  │                  │ │
│  │ [🚀 Launch]      │ [🚀 Launch]      │ [🚀 Launch]      │ │
│  │ [✏️ Edit]        │ [✏️ Edit]        │ [✏️ Edit]        │ │
│  └──────────────────┴──────────────────┴──────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Presentation Studio

```
┌─────────────────────────────────────────────────────────────┐
│ Toast Studio - Boss Kill Epic                        [X]    │
├─────────────────────────────────────────────────────────────┤
│ [Assets] [Packages] [Studio]                                │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┬─────────────────────────────┬──────────────┐   │
│  │Elements│      Canvas Preview         │  Properties  │   │
│  │        │                             │              │   │
│  │□ Text1 │ ┌─────────────────────────┐ │ Element: Text│   │
│  │□ Image │ │                         │ │ Text: BOSS   │   │
│  │□ Sound │ │   [BOSS DEFEATED!]      │ │ Color: Gold  │   │
│  │        │ │                         │ │ Size: 100px  │   │
│  │[+ Add] │ │      [🐉 Dragon]        │ │ X: 640       │   │
│  │  Text  │ │                         │ │ Y: 360       │   │
│  │  Image │ └─────────────────────────┘ │              │   │
│  │  Shape │                             │ Animation:   │   │
│  │  Sound │ Timeline:                   │ Duration: 3s │   │
│  │        │ ├─────────────────────────┤ │ Delay: 0s    │   │
│  │        │ │▓▓▓░░░░░░░░░░░░░░░░░░░░│ │              │   │
│  │        │ └─────────────────────────┘ │ [Preview]    │   │
│  │        │                             │ [Save]       │   │
│  └────────┴─────────────────────────────┴──────────────┘   │
│  [Test Local] [Test Broadcast] [Save as Package]           │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

### Phase 4.1: Asset Browser (Week 1-2)
1. Create `ToastStudioApp` base framework
2. Create asset browser UI
3. Implement audio preview
4. Implement image preview
5. Add search/filter functionality
6. Test and refine

### Phase 4.2: Package Manager (Week 3-4)
1. Create `PackageManager` class
2. Implement package schema
3. Create package browser UI
4. Implement package CRUD operations
5. Add server-side file writing
6. Test save/load/launch
7. Add import/export

### Phase 4.3: DALL-E Integration (Week 5)
1. Create `DALLEProvider` class
2. Implement image generation UI
3. Add save to disk functionality
4. Integrate with asset browser
5. Add generation history
6. Test and refine

### Phase 4.4: Presentation Studio (Week 6-8)
1. Create canvas preview component
2. Implement element editor
3. Add drag-and-drop positioning
4. Create timeline editor
5. Implement live preview
6. Add test functionality
7. Integration with package manager
8. Test and refine

---

## Success Criteria

### Phase 4.1
- ✅ Can browse all audio files in module
- ✅ Can preview audio with playback controls
- ✅ Can browse all images in module
- ✅ Can preview images with zoom
- ✅ Search and filter work correctly

### Phase 4.2
- ✅ Can save toast config as package
- ✅ Can load and edit existing packages
- ✅ Can quick launch packages
- ✅ Packages persist across sessions
- ✅ Can import/export packages

### Phase 4.3
- ✅ Can generate images with DALL-E 3
- ✅ Generated images save to disk
- ✅ Images appear in asset browser
- ✅ Can use generated images in toasts
- ✅ Cost estimates are accurate

### Phase 4.4
- ✅ Can visually create toasts
- ✅ Can position elements with mouse
- ✅ Can edit element properties
- ✅ Can preview animations
- ✅ Can save as package

---

## Questions & Decisions

### Decided ✅
- ✅ Use OpenAI DALL-E 3 for image generation
- ✅ Priority: Asset Browser → Packages → Generation → Studio
- ✅ Storage: JSON files in module directory
- ✅ Defer music generation to future phase

### Decided ✅ (User Input)
- ✅ **Tokens**: User provides token mapping at launch
  - Packages store placeholder keys like `{actorName}`, `{bossName}`
  - At launch, user maps: `{ actorName: token.name, bossName: target.name }`
  - **Maintains system-agnostic design, easy to maintain**

- ✅ **Package Scope**: Both world-specific AND global
  - User chooses when saving package
  - World packages: `Data/worlds/{worldId}/toast-packages/`
  - Global packages: `Data/modules/toast/packages/`
  - **Provides flexibility for different use cases**

- ✅ **Asset Dependencies**: Validation with error messages
  - Validate all asset paths before launching package
  - Show clear error listing missing assets
  - User can fix or remove package
  - **Clean and prevents confusion**

---

## Future Enhancements (Phase 5+)

- 🎵 AI music generation (Suno, Udio)
- 🎬 Video element support
- 🎨 Visual effects library (particles, filters)
- 📦 Package marketplace/sharing
- 🔧 Advanced animation curves (easing functions)
- 🎭 Conditional logic (if/then triggers)
- 🌐 Community package repository
- 📊 Usage analytics (most launched packages)
- 🎮 Game system presets (D&D 5e, PF2e templates)
- 🤝 Collaboration features (share packages in-session)

---

**Ready to begin Phase 4.1!**
