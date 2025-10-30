# Module Integration Guide

Complete guide for module developers who want to integrate their announcer packs with Toast.

## Table of Contents

- [Overview](#overview)
- [For Module Developers](#for-module-developers)
- [Registering Announcer Packs](#registering-announcer-packs)
- [Parameters and Configuration](#parameters-and-configuration)
- [File Organization](#file-organization)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Usage by End Users](#usage-by-end-users)
- [Providing Sample Macros](#providing-sample-macros)
- [Troubleshooting](#troubleshooting)
- [Publishing Your Module](#publishing-your-module)

---

## Overview

Toast provides a simple API for other modules to register their own announcer packs. This allows you to:

- Bundle voice packs with your module
- Provide themed announcers for your content
- Offer multi-language support
- Integrate seamlessly with Toast
- No manual file copying required by users

**Benefits:**
- ✅ Users get voices automatically with your module
- ✅ No manual installation steps
- ✅ Appears in Toast settings dropdown
- ✅ Works with all Toast features
- ✅ Simple one-time registration

---

## For Module Developers

### Quick Start

1. **Add sound files** to your module
2. **Register during `ready` hook**
3. **Document in your README**
4. **Provide sample macros**

That's it! Users install your module and the announcer appears in Toast settings.

### Compatibility

**Requirements:**
- Toast module v1.3.2 or higher
- Foundry VTT v13+

**Compatibility:**
- Works with any module
- No conflicts with other announcer packs
- Safe to call even if Toast not installed

---

## Registering Announcer Packs

### API Method

```javascript
game.toast.registerAnnouncer(id, config)
```

**Parameters:**
- `id` (string) - Unique identifier for your announcer
- `config` (Object) - Configuration object
  - `name` (string) - Display name shown in settings
  - `path` (string) - Base path to sound files

**Returns:**
- `true` - Successfully registered
- `false` - Registration failed

### Basic Example

```javascript
Hooks.once('ready', () => {
  // Check if Toast is available
  if (game.toast && game.toast.registerAnnouncer) {
    game.toast.registerAnnouncer('my-epic-announcer', {
      name: 'Epic Movie Announcer',
      path: 'modules/my-module/sounds/announcer'
    });
  }
});
```

### With Error Handling

```javascript
Hooks.once('ready', () => {
  // Check Toast module is available
  if (!game.toast || !game.toast.registerAnnouncer) {
    console.warn("My Module | Toast module not found - announcer pack not registered");
    return;
  }

  // Register announcer pack
  const registered = game.toast.registerAnnouncer('mymodule-epic', {
    name: 'Epic Movie Announcer',
    path: 'modules/my-module/sounds/announcer'
  });

  if (registered) {
    console.log("My Module | Successfully registered announcer pack with Toast");
  } else {
    console.error("My Module | Failed to register announcer pack with Toast");
  }
});
```

---

## Parameters and Configuration

### ID Parameter

The unique identifier for your announcer.

**Format:**
- Lowercase letters
- Hyphens for spaces
- No special characters
- No underscores (use hyphens)

**Naming Convention:**
```javascript
// ✅ Good
'mymodule-epic-announcer'
'mymodule-fantasy-bard'
'mymodule-sci-fi-computer'

// ❌ Bad
'MyModuleAnnouncer'        // uppercase
'my_module_announcer'      // underscores
'my module announcer'      // spaces
'announcer'                // no module prefix
```

**Best Practice:**
Prefix with your module name to avoid conflicts:
```javascript
'combat-enhanced-announcer'  // for "combat-enhanced" module
'fantasy-voices-narrator'     // for "fantasy-voices" module
```

### Name Parameter

Display name shown in Toast settings dropdown.

**Format:**
- User-friendly text
- Title case recommended
- Can include spaces and punctuation

**Examples:**
```javascript
name: 'Epic Movie Announcer'
name: 'Fantasy Quest Narrator'
name: 'Sci-Fi Computer Voice'
name: 'Horror Whisperer'
name: 'Comedy Announcer (Sarcastic)'
```

**What Users See:**
```
Module Settings → Toast → Announcer Pack dropdown:
- None
- Unreal Tournament (built-in)
- Epic Movie Announcer      ← Your module
- Fantasy Quest Narrator    ← Another module
```

### Path Parameter

Base path to your sound files folder.

**Format:**
- Relative to Foundry data directory
- No trailing slash
- Typically in your module folder

**Examples:**
```javascript
// Standard location
path: 'modules/my-module/sounds/announcer'

// Nested organization
path: 'modules/my-module/assets/audio/announcer'

// Multiple packs in one module
path: 'modules/my-module/sounds/epic-announcer'
path: 'modules/my-module/sounds/comedy-announcer'
```

**File Resolution:**
When users call:
```javascript
game.toast.getAnnouncerSound("double-kill.wav")
```

Toast resolves to:
```
{path}/double-kill.wav
// Example: modules/my-module/sounds/announcer/double-kill.wav
```

---

## File Organization

### Recommended Structure

```
modules/my-module/
├── module.json
├── README.md
├── scripts/
│   └── init.js              ← Register announcer here
└── sounds/
    └── announcer/
        ├── critical-hit.wav
        ├── double-kill.wav
        ├── triple-kill.wav
        ├── victory.wav
        └── boss-defeated.wav
```

### Multiple Announcers

You can register multiple packs from one module:

```
modules/my-module/
├── module.json
├── scripts/
│   └── init.js
└── sounds/
    ├── epic-announcer/
    │   ├── critical-hit.wav
    │   └── victory.wav
    └── comedy-announcer/
        ├── critical-hit.wav
        └── victory.wav
```

```javascript
Hooks.once('ready', () => {
  if (game.toast && game.toast.registerAnnouncer) {
    // Register first pack
    game.toast.registerAnnouncer('mymodule-epic', {
      name: 'My Module - Epic Voice',
      path: 'modules/my-module/sounds/epic-announcer'
    });

    // Register second pack
    game.toast.registerAnnouncer('mymodule-comedy', {
      name: 'My Module - Comedy Voice',
      path: 'modules/my-module/sounds/comedy-announcer'
    });
  }
});
```

### Standard Filenames

Use consistent filenames for best compatibility:

**Combat Events:**
```
critical-hit.wav
double-kill.wav
triple-kill.wav
killing-spree.wav
unstoppable.wav
dominating.wav
finishing-blow.wav
```

**Achievements:**
```
victory.wav
boss-defeated.wav
quest-complete.wav
level-up.wav
achievement-unlocked.wav
```

**Magic/Abilities:**
```
spell-cast.wav
divine-smite.wav
ability-activated.wav
power-up.wav
```

### File Requirements

**Audio Format:**
- **Preferred:** WAV (44.1kHz, 16-bit)
- **Supported:** MP3, OGG, WEBM, M4A

**File Size:**
- **Target:** Under 500KB each
- **Maximum:** 1MB

**Audio Quality:**
- Normalize to -3dB peak
- Remove silence from start/end
- Consistent volume across all files

---

## Complete Examples

### Example 1: Basic Module

**File: modules/my-module/module.json**
```json
{
  "id": "my-module",
  "title": "My Awesome Module",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "13",
    "verified": "13"
  },
  "esmodules": ["scripts/init.js"],
  "relationships": {
    "optional": [
      {
        "id": "toast",
        "type": "module",
        "compatibility": {
          "minimum": "1.3.2"
        }
      }
    ]
  },
  "authors": [
    {
      "name": "Your Name"
    }
  ],
  "description": "My module with integrated Toast announcer pack"
}
```

**File: modules/my-module/scripts/init.js**
```javascript
Hooks.once('ready', () => {
  console.log("My Module | Initializing...");

  // Register Toast announcer pack (if Toast is available)
  if (game.toast && game.toast.registerAnnouncer) {
    const registered = game.toast.registerAnnouncer('mymodule-announcer', {
      name: 'My Module - Epic Voice',
      path: 'modules/my-module/sounds/announcer'
    });

    if (registered) {
      console.log("My Module | Toast announcer pack registered successfully");
    } else {
      console.warn("My Module | Failed to register Toast announcer pack");
    }
  } else {
    console.log("My Module | Toast module not found (announcer pack not registered)");
  }
});
```

**File: modules/my-module/README.md**
```markdown
# My Awesome Module

## Features
- Cool feature 1
- Cool feature 2
- **Includes Toast announcer pack!**

## Toast Integration

This module includes an Epic Voice announcer pack for the Toast module.

### Setup
1. Install Toast module (optional but recommended)
2. Install this module
3. Enable both modules
4. Go to Module Settings → Toast → Announcer Pack
5. Select "My Module - Epic Voice"

### Included Sounds
- Critical Hit
- Double Kill
- Triple Kill
- Victory
- Boss Defeated

No Toast module? No problem - this module works fine without it!
```

### Example 2: Multi-Language Module

**File: modules/my-module/scripts/init.js**
```javascript
Hooks.once('ready', () => {
  if (game.toast && game.toast.registerAnnouncer) {
    // English announcer
    game.toast.registerAnnouncer('mymodule-en', {
      name: 'My Module - English Voice',
      path: 'modules/my-module/sounds/english'
    });

    // Spanish announcer
    game.toast.registerAnnouncer('mymodule-es', {
      name: 'My Module - Spanish Voice',
      path: 'modules/my-module/sounds/spanish'
    });

    // Japanese announcer
    game.toast.registerAnnouncer('mymodule-ja', {
      name: 'My Module - Japanese Voice',
      path: 'modules/my-module/sounds/japanese'
    });

    console.log("My Module | Registered 3 language announcers with Toast");
  }
});
```

**Folder Structure:**
```
modules/my-module/
└── sounds/
    ├── english/
    │   ├── critical-hit.wav  ("Critical hit!")
    │   └── victory.wav       ("Victory!")
    ├── spanish/
    │   ├── critical-hit.wav  ("¡Golpe crítico!")
    │   └── victory.wav       ("¡Victoria!")
    └── japanese/
        ├── critical-hit.wav  ("クリティカルヒット！")
        └── victory.wav       ("勝利！")
```

### Example 3: Campaign-Specific Module

```javascript
Hooks.once('ready', () => {
  if (game.toast && game.toast.registerAnnouncer) {
    // Fantasy campaign announcer
    game.toast.registerAnnouncer('mycampaign-fantasy', {
      name: 'My Campaign - Fantasy Narrator',
      path: 'modules/my-campaign/sounds/fantasy'
    });

    // Sci-fi campaign announcer
    game.toast.registerAnnouncer('mycampaign-scifi', {
      name: 'My Campaign - Sci-Fi Computer',
      path: 'modules/my-campaign/sounds/scifi'
    });

    // Horror campaign announcer
    game.toast.registerAnnouncer('mycampaign-horror', {
      name: 'My Campaign - Horror Whisperer',
      path: 'modules/my-campaign/sounds/horror'
    });

    ui.notifications.info("My Campaign | 3 themed announcers registered with Toast!");
  }
});
```

---

## Best Practices

### 1. Check for Toast Availability

**Always check** before registering:

```javascript
// ✅ Good
if (game.toast && game.toast.registerAnnouncer) {
  // Register announcer
}

// ❌ Bad
game.toast.registerAnnouncer(...);  // Error if Toast not installed
```

### 2. Use Appropriate Hook

**Register during `ready` hook** (not `init`):

```javascript
// ✅ Good
Hooks.once('ready', () => {
  // Register announcer
});

// ❌ Bad
Hooks.once('init', () => {
  // Toast may not be loaded yet
});
```

### 3. Prefix Your IDs

**Prevent conflicts** with other modules:

```javascript
// ✅ Good
'mymodule-announcer'
'combat-sounds-epic'

// ❌ Bad
'announcer'           // Too generic
'epic-voice'          // Could conflict
```

### 4. Mark Toast as Optional Dependency

In your `module.json`:

```json
"relationships": {
  "optional": [
    {
      "id": "toast",
      "type": "module",
      "compatibility": {
        "minimum": "1.3.2"
      }
    }
  ]
}
```

**Don't make it required** - your module should work without Toast.

### 5. Document Integration

In your README:

```markdown
## Toast Integration

This module includes an announcer pack for the Toast module.

**Setup:**
1. Install Toast module (optional)
2. Go to Module Settings → Toast → Announcer Pack
3. Select "[Your Announcer Name]"

**Note:** Toast is optional. This module works fine without it!
```

### 6. Provide Sample Macros

Include example macros in your documentation:

```javascript
// Sample macro for your announcer
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("critical-hit.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "100px",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

### 7. File Size Optimization

Keep files under 500KB:

```javascript
// Use compression tools
// Audacity: Export as MP3 192kbps
// FFmpeg: ffmpeg -i input.wav -b:a 192k output.mp3
```

### 8. Consistent Audio Levels

Normalize all files:

```javascript
// Audacity: Effect → Normalize → -3dB
// All files should have same peak volume
```

### 9. Graceful Degradation

Your module should work without Toast:

```javascript
// ✅ Good - Silent failure
if (game.toast && game.toast.registerAnnouncer) {
  game.toast.registerAnnouncer(...);
} else {
  console.log("Toast not found - announcer not registered (this is fine)");
}

// ❌ Bad - Throws error
game.toast.registerAnnouncer(...);
```

### 10. Logging

Provide helpful console messages:

```javascript
if (registered) {
  console.log("My Module | Toast announcer registered: Epic Voice");
} else {
  console.warn("My Module | Toast announcer registration failed");
}
```

---

## Usage by End Users

### How Users Experience It

1. **User installs your module**
2. **User installs Toast module** (if not already)
3. **Both modules enabled**
4. **Your announcer appears automatically** in Toast settings dropdown
5. **User selects your announcer**
6. **All Toast macros use your voice**

### User Documentation

Provide clear instructions:

**In Your README:**
```markdown
## Using the Announcer Pack

1. Install and enable Toast module
2. Go to Module Settings → Toast - Full Screen Celebrations
3. Find "Announcer Pack" dropdown
4. Select "My Module - Epic Voice"
5. Run any Toast macro - it will use your announcer!

### Testing

Run this macro to test:
[paste test macro here]
```

### No Setup Required

**The beauty of this system:**
- No manual file copying
- No configuration needed
- Just enable both modules
- Select from dropdown
- Done!

---

## Providing Sample Macros

### Basic Test Macro

Provide a simple test:

```javascript
// Test My Module Announcer
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("critical-hit.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "TESTING!",
    color: "#00ff00",
    fontSize: "80px",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 40,
      duration: 2
    }
  }
]);
```

### Boss Kill Macro

```javascript
// Boss Defeat with My Module Voice
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target the boss!");
  return;
}

game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("boss-defeated.wav"),
    volume: 1.0
  },
  {
    type: "text",
    text: target.name + " DEFEATED!",
    color: "#FFD700",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 400,
      startY: window.innerHeight / 2 - 50,
      duration: 3
    }
  }
]);
```

### Include in Compendium

**Advanced:** Provide macros in a compendium:

```json
// In module.json
"packs": [
  {
    "name": "my-module-macros",
    "label": "My Module - Toast Macros",
    "path": "packs/macros.db",
    "type": "Macro"
  }
]
```

---

## Troubleshooting

### Announcer Not Appearing in Dropdown

**Check:**
1. Toast module is installed and enabled
2. Your module is enabled
3. `ready` hook is firing
4. `game.toast.registerAnnouncer` exists
5. Registration returns `true`
6. Check console for errors (F12)

**Debug:**
```javascript
Hooks.once('ready', () => {
  console.log("Toast available?", game.toast ? "Yes" : "No");
  console.log("Register method?", game.toast?.registerAnnouncer ? "Yes" : "No");

  if (game.toast && game.toast.registerAnnouncer) {
    const result = game.toast.registerAnnouncer('mymodule-test', {
      name: 'Test Announcer',
      path: 'modules/my-module/sounds'
    });
    console.log("Registration result:", result);
  }
});
```

### Sounds Not Playing

**Check:**
1. Files exist at specified path
2. File names match exactly (case-sensitive)
3. Audio format is supported
4. Files aren't corrupted
5. Volume settings

**Test Path:**
```javascript
// In browser console
const path = game.toast.getAnnouncerSound("critical-hit.wav");
console.log("Resolved path:", path);

// Try playing directly
const audio = new Audio(path);
audio.play();
```

### Module Load Order

**Problem:** Toast loads after your module.

**Solution:** Use `ready` hook (not `init`):
```javascript
// ✅ Works - ready hook
Hooks.once('ready', () => {
  // All modules loaded
});

// ❌ Fails - init hook
Hooks.once('init', () => {
  // Toast might not be loaded yet
});
```

### Registration Fails Silently

**Check return value:**
```javascript
const registered = game.toast.registerAnnouncer('mymodule-test', {
  name: 'Test',
  path: 'modules/my-module/sounds'
});

if (!registered) {
  console.error("Registration failed - check ID uniqueness and parameters");
}
```

### ID Conflicts

**Problem:** Another module uses same ID.

**Solution:** Prefix with module name:
```javascript
// ✅ Unique
'mymodule-announcer'

// ❌ May conflict
'announcer'
```

---

## Publishing Your Module

### Module Manifest

Complete example `module.json`:

```json
{
  "id": "my-module",
  "title": "My Awesome Module with Toast Integration",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "13",
    "verified": "13"
  },
  "description": "My module includes an Epic Voice announcer pack for Toast.",
  "authors": [
    {
      "name": "Your Name",
      "url": "https://yourwebsite.com"
    }
  ],
  "esmodules": ["scripts/init.js"],
  "styles": ["styles/my-module.css"],
  "relationships": {
    "optional": [
      {
        "id": "toast",
        "type": "module",
        "compatibility": {
          "minimum": "1.3.2"
        }
      }
    ]
  },
  "url": "https://github.com/yourusername/my-module",
  "manifest": "https://github.com/yourusername/my-module/releases/latest/download/module.json",
  "download": "https://github.com/yourusername/my-module/releases/latest/download/module.zip"
}
```

### README Template

```markdown
# My Awesome Module

[Description of your module]

## Features
- Feature 1
- Feature 2
- **Includes Toast announcer pack!**

## Installation

[Standard installation instructions]

## Toast Integration

This module includes an Epic Voice announcer pack for the Toast module.

### Requirements
- Toast module v1.3.2+ (optional but recommended)

### Setup
1. Install and enable Toast module
2. Go to Module Settings → Toast - Full Screen Celebrations
3. Select "My Module - Epic Voice" from Announcer Pack dropdown
4. Run Toast macros - they'll use your announcer!

### Included Sounds
- Critical Hit
- Double Kill
- Triple Kill
- Victory
- Boss Defeated
- [etc...]

### Sample Macro

Test the announcer with this macro:

\`\`\`javascript
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("critical-hit.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "100px",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
\`\`\`

## Credits

Voice: [Voice actor name or TTS service]
Toast Integration: [Your name]

## License

[Your license]
```

### Changelog

Document Toast integration:

```markdown
# Changelog

## [1.0.0] - 2024-01-15
### Added
- Initial release
- Toast announcer pack integration
- 10 voice files included
```

---

## Support and Community

### Getting Help

**For Toast Integration:**
- Check Toast documentation
- Ask in FoundryVTT Discord #modules
- Open issue on Toast GitHub

**For Your Module:**
- Provide your own support channels
- Document Toast integration clearly
- Include troubleshooting steps

### Sharing Your Work

**FoundryVTT Discord:**
- #modules-showcase channel
- Mention Toast integration

**Reddit r/FoundryVTT:**
- Post with [Module] flair
- Highlight Toast compatibility

**Your Website/GitHub:**
- Showcase the announcer
- Provide audio samples
- Include demo video

---

## Advanced Topics

### Dynamic Registration

Register based on user settings:

```javascript
Hooks.once('ready', () => {
  if (!game.toast || !game.toast.registerAnnouncer) return;

  // Check user's language setting
  const lang = game.settings.get("core", "language");

  if (lang === "en") {
    game.toast.registerAnnouncer('mymodule-en', {
      name: 'My Module - English',
      path: 'modules/my-module/sounds/english'
    });
  } else if (lang === "es") {
    game.toast.registerAnnouncer('mymodule-es', {
      name: 'My Module - Español',
      path: 'modules/my-module/sounds/spanish'
    });
  }
});
```

### Conditional Registration

Register based on other modules:

```javascript
Hooks.once('ready', () => {
  if (!game.toast || !game.toast.registerAnnouncer) return;

  // Register different pack if Combat Enhanced is active
  if (game.modules.get("combat-enhanced")?.active) {
    game.toast.registerAnnouncer('mymodule-combat', {
      name: 'My Module - Combat Enhanced Voice',
      path: 'modules/my-module/sounds/combat-enhanced'
    });
  } else {
    game.toast.registerAnnouncer('mymodule-standard', {
      name: 'My Module - Standard Voice',
      path: 'modules/my-module/sounds/standard'
    });
  }
});
```

### Unregistration

Currently not supported, but modules can:
- Only register when appropriate
- Use setting to enable/disable
- Document that reload required after settings change

---

## Resources

- [Toast Main Documentation](../README.md)
- [Announcer Packs Guide](ANNOUNCER-PACKS.md)
- [FoundryVTT Module Development](https://foundryvtt.com/article/module-development/)
- [FoundryVTT Discord](https://discord.gg/foundryvtt)

---

**Questions?** Open an issue on Toast GitHub or ask in FoundryVTT Discord!

---

**Happy developing!**
