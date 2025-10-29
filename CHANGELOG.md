# Changelog

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
