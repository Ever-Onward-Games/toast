# Toast - Full Screen Celebrations for Foundry VTT

Display stunning full-screen visuals and celebration text to all players. Perfect for critical hits, finishing blows, and other memorable moments in your game!

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Element Types](#element-types)
- [Animation System](#animation-system)
- [Sample Macros](#sample-macros)
- [Advanced Animations](#advanced-animations)
- [Random Sound Selection](#random-sound-selection)
- [Announcer Packs](#announcer-packs)
- [Dynamic TTS Templates](#dynamic-tts-templates)
- [Module Integration](#module-integration)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)
- [Permission Settings](#permission-settings)

---

## Features

- **Full-screen overlays** that display to all connected players
- **GM-validated permissions** - Secure socket-based permission system
- **Flexible permissions** - Control who can trigger toasts by role or username
- **Multiple element types** - Images, text, tokens, actor avatars, shapes, and sounds
- **Sound effects** - Play audio with volume, delay, and loop controls
- **Random sound selection** - Synchronized across all players
- **Customizable animations** - Slide, rotate, scale, and fade effects
- **Staggered animations** - Delay parameter for choreographed multi-element displays
- **Z-index control** - Layer elements precisely for visual depth
- **Socket-based broadcasting** - Real-time synchronization across all clients
- **FVTT v13 Compatible**

---

## Installation

1. Copy the `toast` folder to your Foundry VTT `Data/modules` directory
2. Restart Foundry VTT or reload the modules list
3. Enable the "Toast - Full Screen Celebrations" module in your world

---

## Quick Start

### Basic Usage

```javascript
game.toast.show([
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

### With Sound (Using Announcer Packs)

```javascript
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "DOUBLE KILL!",
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

---

## API Reference

The module exposes a global API at `game.toast`:

### `game.toast.show(elements)`
Show toast to all players (with GM validation)

### `game.toast.showLocal(elements)`
Show toast only on local client (no broadcast) - perfect for testing

### `game.toast.hasPermission()`
Check if current user has permission to trigger toasts
- Returns: `true` or `false`

### `game.toast.resolveElement(element)`
Resolve element to check validity and preview content
- Returns: `{type, valid, content, error}`

### `game.toast.randomSound(sources, options)`
Create a random sound element (synchronized across all players)
- **Parameters:**
  - `sources` (Array<string>) - Array of sound file paths (nulls automatically filtered out)
  - `options` (Object) - Optional: `{volume, delay, loop}`
- **Returns:** Sound element with randomly selected source, or null if no valid sources
- **Graceful Failure:** Returns null if array is empty or all sources are null/invalid

**Example:**
```javascript
game.toast.randomSound([
  "sounds/crit-1.wav",
  "sounds/crit-2.wav",
  "sounds/crit-3.wav"
], { volume: 0.9 });
```

### `game.toast.weightedRandomSound(soundsWithWeights, options)`
Create a random sound element with weighted selection (synchronized across all players)
- **Parameters:**
  - `soundsWithWeights` (Array<Object>) - Array of `{src, weight}` objects (nulls/invalid automatically filtered out)
  - `options` (Object) - Optional: `{volume, delay, loop}`
- **Returns:** Sound element with weighted random selected source, or null if no valid sources
- **Graceful Failure:** Returns null if array is empty or all sources are null/invalid

**Example:**
```javascript
game.toast.weightedRandomSound([
  { src: "sounds/common-crit.wav", weight: 70 },   // 70% chance
  { src: "sounds/rare-crit.wav", weight: 20 },     // 20% chance
  { src: "sounds/legendary-crit.wav", weight: 10 } // 10% chance
], { volume: 0.9 });
```

### `game.toast.getAnnouncerSound(filename)`
Get the path to a sound file from the currently selected announcer pack
- **Parameters:**
  - `filename` (string) - The sound filename (e.g., "double-kill.wav")
- **Returns:** Full path to the sound file in the active announcer pack, or null if invalid
- **Graceful Failure:** Returns null if filename is invalid or no announcer pack is configured

**Example:**
```javascript
// Returns: "modules/toast/sounds/announcers/unreal-tournament/double-kill.wav"
game.toast.getAnnouncerSound("double-kill.wav")

// Safe usage with randomSound (nulls are automatically filtered)
game.toast.randomSound([
  game.toast.getAnnouncerSound("double-kill.wav"),
  game.toast.getAnnouncerSound("triple-kill.wav"),
  game.toast.getAnnouncerSound("missing-file.wav")  // Returns null, but safely filtered
], { volume: 0.9 })
```

See [Announcer Packs](#announcer-packs) for more information.

### `game.toast.registerAnnouncer(id, config)`
Register an announcer pack from another module (for module developers)
- **Parameters:**
  - `id` (string) - Unique identifier for the announcer (e.g., "my-module-announcer")
  - `config` (Object) - Configuration object
    - `name` (string) - Display name shown in settings
    - `path` (string) - Base path to sound files
- **Returns:** `true` if registered successfully, `false` otherwise
- **When to call:** During your module's `ready` hook

**Example:**
```javascript
// In your module's initialization
Hooks.once('ready', () => {
  game.toast.registerAnnouncer('my-epic-announcer', {
    name: 'Epic Movie Announcer',
    path: 'modules/my-module/sounds/announcer'
  });
});
```

See [Module Integration](#module-integration) for complete guide.

### `game.toast.templates.register(id, config)`
Register a dynamic TTS template for epic moments
- **Parameters:**
  - `id` (string) - Unique template identifier (e.g., "boss-kill")
  - `config` (Object) - Template configuration
    - `template` (string) - Template string with {tokens}
    - `tags` (Array<string>) - Optional tags for categorization
    - `duration` (number) - Optional estimated audio duration in seconds
- **Returns:** `true` if registered successfully, `false` otherwise

**Example:**
```javascript
game.toast.templates.register("boss-kill", {
  template: "{killer} strikes the final blow against {boss}! Victory is yours!",
  tags: ["boss", "victory"],
  duration: 4
});
```

### `game.toast.templates.render(id, tokens)`
Render a template with token values
- **Parameters:**
  - `id` (string) - Template ID
  - `tokens` (Object) - Token values (e.g., {killer: "Bob", boss: "Dragon"})
- **Returns:** Rendered text string, or null if template not found or tokens missing

**Example:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});
// Returns: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

### `game.toast.templates.get(id)`
Get a registered template by ID
- **Parameters:**
  - `id` (string) - Template ID
- **Returns:** Template configuration object, or null if not found

### `game.toast.templates.list(tag)`
List all registered templates
- **Parameters:**
  - `tag` (string) - Optional tag filter
- **Returns:** Array of template objects with {id, template, tokens, tags, duration}

**Example:**
```javascript
// List all templates
game.toast.templates.list();

// List only combat templates
game.toast.templates.list("combat");
```

### `game.toast.templates.delete(id)`
Delete a registered template
- **Parameters:**
  - `id` (string) - Template ID to delete
- **Returns:** `true` if deleted, `false` if not found

### Security Note

The module uses a **request/broadcast pattern** for security:
1. When a user calls `game.toast.show()`, it sends a request to the GM
2. The GM validates the user's permissions
3. If approved, the GM broadcasts the toast to all connected clients
4. This prevents unauthorized users from bypassing permissions via browser console

---

## Element Types

### Image from URL
```javascript
{
  type: "image",
  src: "https://example.com/image.png",
  width: "400px",
  height: "400px",
  animation: {
    startX: 100,
    startY: 100,
    endX: 500,
    endY: 100,
    duration: 2
  }
}
```

### Image from Foundry Data
```javascript
{
  type: "image",
  src: "modules/mymodule/assets/critical.png",
  width: "300px",
  animation: {
    startX: window.innerWidth / 2 - 150,
    startY: 50,
    endY: 150,
    duration: 1.5,
    scale: 1.5
  }
}
```

### Token Image
```javascript
{
  type: "tokenImage",
  tokenId: "tokenIdHere",
  width: "200px",
  height: "200px",
  animation: {
    startX: 0,
    endX: 300,
    startY: window.innerHeight / 2 - 100,
    duration: 2
  }
}
```

### Actor Avatar
```javascript
{
  type: "actorImage",
  actorId: "actorIdHere",
  width: "250px",
  height: "250px",
  rotation: 15,
  animation: {
    startX: window.innerWidth - 250,
    startY: 100,
    duration: 3
  }
}
```

### Text
```javascript
{
  type: "text",
  text: "CRITICAL HIT!",
  color: "#ff0000",
  fontSize: "120px",
  fontWeight: "bold",
  textShadow: "0 0 30px #ff0000",
  animation: {
    startX: window.innerWidth / 2 - 300,
    startY: window.innerHeight / 2 - 60,
    duration: 2,
    scale: 1.2,
    opacity: 1
  }
}
```

### Shape (Rectangle, Circle, etc.)
```javascript
{
  type: "shape",
  width: "600px",
  height: "200px",
  backgroundColor: "#000000",
  borderRadius: "20px",  // Use "50%" for circle
  opacity: 0.8,
  zIndex: 1
}
```

### Sound Effect
```javascript
{
  type: "sound",
  src: "sounds/fanfare.mp3",
  volume: 0.8,                   // 0.0 to 1.0 (default: 0.8)
  delay: 0.5,                    // seconds before playing (default: 0)
  loop: false                    // loop the sound (default: false)
}
```

**Sound Sources:**
- **Web URL**: `"https://example.com/sound.mp3"`
- **Foundry Data**: `"sounds/mysound.ogg"`
- **World Folder**: `"sounds/my-sound.wav"` (from `Data/worlds/[your-world]/sounds/`)
- **Module/System**: `"modules/mymodule/sounds/effect.wav"`

**Supported Formats**: MP3, OGG, WAV, WEBM, M4A

**Included Sample**: `modules/toast/sounds/DOUBLE KILL.wav`

---

## Animation System

### Standard Animation (Transition-based)
```javascript
animation: {
  startX: 100,           // Starting X position (pixels)
  startY: 100,           // Starting Y position (pixels)
  endX: 500,             // Ending X position (pixels)
  endY: 100,             // Ending Y position (pixels)
  duration: 2,           // Animation duration (seconds)
  delay: 0.5,            // Delay before starting (seconds)
  scale: 1.5,            // Final scale (e.g., 1.5 = 150%)
  opacity: 0.8,          // Final opacity (0-1)
  easing: "ease-out"     // CSS easing function
}
```

### CSS Keyframe Animation
```javascript
animation: {
  cssAnimation: "toast-slide-left-right",  // CSS keyframe name
  centerX: window.innerWidth / 2 - 200,    // Center position during pause
  centerY: window.innerHeight / 2 - 50,
  duration: 2,                              // Total duration (seconds)
  delay: 0.5,                               // Delay before starting
  easing: "ease-in-out"
}
```

### Built-in CSS Animations

- `toast-slide-left-right` - Slide from left → pause → exit right
- `toast-slide-right-left` - Slide from right → pause → exit left
- `toast-slide-top-bottom` - Slide from top → pause → exit bottom
- `toast-slide-bottom-top` - Slide from bottom → pause → exit top

**Timing** (for 2 second duration):
- 0-0.5s: Slide in
- 0.5-1.5s: Pause in center
- 1.5-2s: Slide out

### Element Options

**Common Properties:**
- `rotation` - Rotation in degrees
- `width` - Element width (CSS value)
- `height` - Element height (CSS value)
- `zIndex` - Layering order (higher = on top)

**Text Properties:**
- `color` - Text color (CSS color)
- `fontSize` - Font size (CSS value)
- `fontFamily` - Font family (CSS value)
- `fontWeight` - Font weight (CSS value)
- `textShadow` - Text shadow (CSS value)

**Shape Properties:**
- `backgroundColor` - Fill color
- `borderRadius` - Corner radius or "50%" for circle
- `border` - Border style
- `boxShadow` - Shadow effect
- `opacity` - Transparency (0-1)

---

## Sample Macros

### 1. Simple Critical Hit
```javascript
game.toast.show([
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff3333",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 40px #ff0000",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

### 2. Critical Hit with Sound (Using Announcer Pack)
```javascript
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #ff0000",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

### 3. Staggered Multi-Layer Toast
```javascript
game.toast.show([
  // Background shape - appears first
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
  // Text appears 0.3s later
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
  // Icon appears 0.6s later
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

### 4. Character Victory with Token
```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Please select a token first!");
} else {
  game.toast.show([
    {
      type: "tokenImage",
      tokenId: token.id,
      width: "300px",
      height: "300px",
      animation: {
        startX: 0,
        endX: window.innerWidth / 2 - 150,
        startY: window.innerHeight / 2 - 150,
        duration: 2
      }
    },
    {
      type: "text",
      text: token.name + " WINS!",
      color: "#FFD700",
      fontSize: "70px",
      fontWeight: "bold",
      textShadow: "0 0 30px #FFD700",
      animation: {
        startX: window.innerWidth / 2 - 200,
        startY: window.innerHeight / 2 + 200,
        duration: 2
      }
    }
  ]);
}
```

### 5. Dual Text Slide
```javascript
game.toast.show([
  // Text from left
  {
    type: "text",
    text: "DOUBLE",
    color: "#ff6b6b",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 30px #ff6b6b",
    animation: {
      startX: -400,
      endX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 45,
      duration: 1.5
    }
  },
  // Text from right
  {
    type: "text",
    text: "KILL!",
    color: "#4ecdc4",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 30px #4ecdc4",
    animation: {
      startX: window.innerWidth + 400,
      endX: window.innerWidth / 2 + 50,
      startY: window.innerHeight / 2 - 45,
      duration: 1.5
    }
  }
]);
```

### 6. Random Color Critical
```javascript
const colors = ["#ff0000", "#ff6b00", "#ffff00", "#00ff00", "#0000ff", "#9d00ff"];
const randomColor = colors[Math.floor(Math.random() * colors.length)];

game.toast.show([
  {
    type: "text",
    text: "CRITICAL!",
    color: randomColor,
    fontSize: "110px",
    fontWeight: "bold",
    textShadow: `0 0 40px ${randomColor}`,
    animation: {
      startX: window.innerWidth / 2 - 280,
      startY: window.innerHeight / 2 - 55,
      duration: 2,
      scale: 1.2
    }
  }
]);
```

### Positioning Helper

Use these formulas for common positioning:

```javascript
// Center of screen
const centerX = window.innerWidth / 2 - (elementWidth / 2);
const centerY = window.innerHeight / 2 - (elementHeight / 2);

// Top center
const topCenterX = window.innerWidth / 2 - (elementWidth / 2);
const topCenterY = 50;

// Bottom center
const bottomCenterX = window.innerWidth / 2 - (elementWidth / 2);
const bottomCenterY = window.innerHeight - elementHeight - 50;

// Offscreen positions
const offscreenLeft = -elementWidth;
const offscreenRight = window.innerWidth;
const offscreenTop = -elementHeight;
const offscreenBottom = window.innerHeight;
```

---

## Advanced Animations

### Multi-Stage CSS Animations

The module includes built-in CSS keyframe animations for complex effects:

#### Example: Slide In → Pause → Slide Out
```javascript
game.toast.show([
  // Red rectangle - slides right to left
  {
    type: "shape",
    width: "800px",
    height: "200px",
    backgroundColor: "#cc0000",
    borderRadius: "20px",
    zIndex: 1,
    animation: {
      cssAnimation: "toast-slide-right-left",
      centerX: window.innerWidth / 2 - 400,
      centerY: window.innerHeight / 2 - 100,
      duration: 2  // 0.5s in, 1s pause, 0.5s out
    }
  },
  // Green text - slides left to right
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#00ff00",
    fontSize: "100px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 30px #00ff00",
    zIndex: 2,
    animation: {
      cssAnimation: "toast-slide-left-right",
      centerX: window.innerWidth / 2 - 320,
      centerY: window.innerHeight / 2 - 50,
      duration: 2,
      delay: 0.1
    }
  }
]);
```

### Creating Custom CSS Animations

Add to your world's CSS:

```css
@keyframes my-custom-animation {
  0% {
    transform: translateX(-100vw) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(100vw) scale(0.5);
    opacity: 0;
  }
}
```

Then use it:

```javascript
{
  animation: {
    cssAnimation: "my-custom-animation",
    centerX: window.innerWidth / 2 - 200,
    centerY: window.innerHeight / 2 - 50,
    duration: 3
  }
}
```

---

## Random Sound Selection

Want variety in your sound effects? Randomize between multiple files while keeping them synchronized across all players!

### Basic Usage

```javascript
game.toast.show([
  // All players hear the same randomly selected sound
  game.toast.randomSound([
    "modules/toast/sounds/critical-1.wav",
    "modules/toast/sounds/critical-2.wav",
    "modules/toast/sounds/critical-3.wav"
  ], { volume: 0.9 }),
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

### How It Works

1. The triggering player calls `game.toast.randomSound()`
2. One sound is randomly selected **on that client**
3. The selected sound is included in the broadcast
4. All players hear the same sound

**Key Point**: Random selection happens **before** broadcasting, ensuring perfect synchronization!

### With Options

```javascript
game.toast.randomSound(
  [
    "sounds/victory-1.mp3",
    "sounds/victory-2.mp3",
    "sounds/victory-3.mp3"
  ],
  {
    volume: 0.9,
    delay: 0.3,
    loop: false
  }
);
```

### Creating Sound Variants

**Option 1: Pitch Shift** (Audacity - Free)
1. Open your sound in Audacity
2. Effect → Pitch and Tempo → Change Pitch
3. Try +15% and -15% to create 3 variants
4. Export each as a separate file

**Option 2: Record Multiple Takes**
- Record the same line 3-4 times with slight variations
- Different emphasis, tone, or energy levels

**Option 3: Mix & Match**
- Combine the base sound with different background effects
- critical-clean.wav, critical-explosion.wav, critical-electric.wav

### Advanced: Conditional Sound Selection

```javascript
function getCriticalSound(damageAmount) {
  if (damageAmount > 100) {
    return game.toast.randomSound([
      "sounds/mega-crit-1.wav",
      "sounds/mega-crit-2.wav"
    ], { volume: 1.0 });
  } else if (damageAmount > 50) {
    return game.toast.randomSound([
      "sounds/crit-1.wav",
      "sounds/crit-2.wav",
      "sounds/crit-3.wav"
    ], { volume: 0.8 });
  } else {
    return game.toast.randomSound([
      "sounds/mini-crit-1.wav",
      "sounds/mini-crit-2.wav"
    ], { volume: 0.6 });
  }
}

// Usage
game.toast.show([
  getCriticalSound(75),
  { type: "text", text: "CRITICAL HIT!" }
]);
```

### Advanced: Weighted Random

For more control over which sounds play most often, use `game.toast.weightedRandomSound()`:

```javascript
// Built-in API method with graceful failure handling
game.toast.show([
  game.toast.weightedRandomSound([
    { src: "sounds/common-crit.wav", weight: 70 },   // 70% chance
    { src: "sounds/rare-crit.wav", weight: 20 },     // 20% chance
    { src: "sounds/legendary-crit.wav", weight: 10 } // 10% chance
  ], { volume: 0.9 }),
  { type: "text", text: "CRITICAL!" }
]);
```

**With Announcer Packs:**
```javascript
game.toast.show([
  game.toast.weightedRandomSound([
    { src: game.toast.getAnnouncerSound("common-crit.wav"), weight: 70 },
    { src: game.toast.getAnnouncerSound("rare-crit.wav"), weight: 20 },
    { src: game.toast.getAnnouncerSound("legendary-crit.wav"), weight: 10 }
  ], { volume: 0.9 }),
  { type: "text", text: "CRITICAL!" }
]);
```

**Graceful Failure:** Nulls and invalid sources are automatically filtered out. If a file doesn't exist in an announcer pack, it's safely skipped.

### File Organization

Keep sounds organized by category:

```
sounds/
├── critical/
│   ├── critical-1.wav
│   ├── critical-2.wav
│   └── critical-3.wav
├── victory/
│   ├── victory-1.mp3
│   └── victory-2.mp3
└── kill-streaks/
    ├── DOUBLE KILL.wav
    └── TRIPLE KILL.wav
```

### Why Randomize?

- **Prevents repetition fatigue** - Same sound gets old fast
- **Adds excitement** - Players never know which version they'll get
- **Professional polish** - Games use this technique extensively
- **Dynamic feel** - Makes frequent events feel fresh

---

## Announcer Packs

Organize announcer voice files into switchable packs! Perfect for different narrators, languages, or game themes.

### What Are Announcer Packs?

Announcer packs let you organize voice files from the same narrator into folders. GMs can switch between different announcers without changing macros.

**Example structure:**
```
modules/toast/sounds/announcers/
├── unreal-tournament/
│   ├── double-kill.wav
│   ├── triple-kill.wav
│   └── unstoppable.wav
├── bob-announcerton/
│   ├── double-kill.wav
│   ├── triple-kill.wav
│   └── unstoppable.wav
└── murderbot/
    ├── double-kill.wav
    ├── triple-kill.wav
    └── unstoppable.wav
```

### Using Announcer Packs

**In your macros, use the helper method:**

```javascript
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "DOUBLE KILL!",
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

**The GM selects the active announcer pack in Module Settings.**

### Creating Custom Announcer Packs

1. **Create folder structure:**
   ```
   modules/toast/sounds/announcers/[your-announcer-name]/
   ```

2. **Add your sound files:**
   - Use consistent filenames across packs (e.g., "double-kill.wav")
   - Normalize audio levels
   - Keep files under 500KB each

3. **Folder naming conventions:**
   - Use lowercase with hyphens (e.g., "robot-announcer")
   - Avoid spaces and special characters
   - Display name auto-generates (e.g., "robot-announcer" → "Robot Announcer")

4. **Reload Foundry:**
   - The module auto-scans for announcer packs on startup
   - New packs appear in Module Settings → Announcer Pack dropdown

### Example: Multiple Languages

Create announcer packs for different languages:

```
announcers/
├── english/
│   ├── critical-hit.wav
│   └── victory.wav
├── spanish/
│   ├── critical-hit.wav  (Spanish recording)
│   └── victory.wav       (Spanish recording)
└── japanese/
    ├── critical-hit.wav  (Japanese recording)
    └── victory.wav       (Japanese recording)
```

**Your macros stay the same:**
```javascript
{
  type: "sound",
  src: game.toast.getAnnouncerSound("critical-hit.wav")
}
```

**GMs just select the language from settings!**

### Example: Themed Announcers

Different announcers for different campaigns:

```
announcers/
├── fantasy-narrator/
│   ├── spell-cast.wav
│   └── dragon-slain.wav
├── sci-fi-computer/
│   ├── spell-cast.wav  (renamed to "ability-activated.wav" in-game)
│   └── dragon-slain.wav (renamed to "target-eliminated.wav" in-game)
└── horror-whisperer/
    ├── spell-cast.wav  (creepy whisper version)
    └── dragon-slain.wav (sinister laugh version)
```

### Combining with Random Sounds

Use both features together for ultimate variety:

```javascript
game.toast.show([
  // Random selection from current announcer pack
  game.toast.randomSound([
    game.toast.getAnnouncerSound("crit-1.wav"),
    game.toast.getAnnouncerSound("crit-2.wav"),
    game.toast.getAnnouncerSound("crit-3.wav")
  ], { volume: 0.9 }),
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "100px"
  }
]);
```

### Tips for Announcer Packs

- **Consistent filenames** - Use the same filename across all packs
- **Audio normalization** - Match volume levels across announcers
- **Test each pack** - Verify all sounds work before sharing
- **Document your packs** - Include a README.txt with voice actor credits
- **Share with community** - Publish your packs for others to use!

### Finding Announcer Voices

- **Voice actors** - Hire on Fiverr, Voices.com
- **Text-to-speech** - ElevenLabs, Azure Cognitive Services
- **Record yourself** - Audacity (free), Adobe Audition
- **Voice filters** - Apply effects to create different characters
- **Community packs** - Check FoundryVTT community for shared packs

---

## Dynamic TTS Templates

**Note:** This is Phase 1 of the dynamic TTS system. Template rendering is fully functional. ElevenLabs API integration (Phase 2) coming soon!

Dynamic TTS templates allow you to create reusable text templates with tokens that can be filled in at runtime. Perfect for epic moments where you want personalized announcements.

### What Are Templates?

Templates are text strings with `{tokens}` that get replaced with actual values when rendered:

```javascript
Template: "{killer} strikes the final blow against {boss}! Victory is yours!"
Tokens: { killer: "Bob", boss: "Ancient Dragon" }
Result: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

### Built-in Templates

The module includes 10 pre-made templates for epic moments:

**Boss/Enemy Defeats:**
- `boss-kill` - "{killer} strikes the final blow against {boss}! Victory is yours!"
- `epic-defeat` - "{player} has vanquished {enemy}! The battle is won!"

**Healing/Support:**
- `clutch-heal` - "{healer} comes in with a clutch heal on {target}, pulling them back from the brink of death!"
- `life-saver` - "When all hope seemed lost, {savior} turned the tide of battle!"

**Kill Streaks:**
- `triple-kill` - "{player} just eliminated {victim1}, {victim2}, and {victim3} in rapid succession! Unstoppable!"
- `killing-spree` - "{player} is on an absolute rampage! {count} enemies down!"

**Critical Moments:**
- `clutch-save` - "{player} saves the party from certain doom!"
- `perfect-shot` - "Incredible! {player} lands the perfect shot on {target}!"

**Party Achievements:**
- `quest-complete` - "The party has completed {quest}! Huzzah!"
- `level-up` - "{player} has reached level {level}! Power increasing!"

### Basic Usage

**Render a template:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});

console.log(text);
// Output: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

**List available templates:**
```javascript
// All templates
const allTemplates = game.toast.templates.list();

// Filter by tag
const combatTemplates = game.toast.templates.list("combat");
const healTemplates = game.toast.templates.list("heal");
```

**Get template details:**
```javascript
const template = game.toast.templates.get("boss-kill");
console.log(template);
// {
//   template: "{killer} strikes the final blow against {boss}!...",
//   tokens: ["killer", "boss"],
//   tags: ["boss", "victory", "combat"],
//   duration: 4
// }
```

### Creating Custom Templates

**Register your own template:**
```javascript
game.toast.templates.register("my-epic-moment", {
  template: "{player} has achieved the impossible against {obstacle}!",
  tags: ["custom", "achievement"],
  duration: 3
});

// Use it
const text = game.toast.templates.render("my-epic-moment", {
  player: "Alice",
  obstacle: "overwhelming odds"
});
```

**Templates with multiple tokens:**
```javascript
game.toast.templates.register("team-victory", {
  template: "{player1}, {player2}, and {player3} worked together to defeat {boss}!",
  tags: ["teamwork", "boss"],
  duration: 5
});

game.toast.templates.render("team-victory", {
  player1: "Alice",
  player2: "Bob",
  player3: "Charlie",
  boss: "the Lich King"
});
```

### Token Validation

Templates automatically validate that all required tokens are provided:

```javascript
// Missing token - returns null
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob"
  // Missing: boss
});
// Console warning: "Missing tokens for template 'boss-kill': boss"
// Returns: null

// All tokens provided - success
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Dragon"
});
// Returns: "Bob strikes the final blow against Dragon! Victory is yours!"
```

### Using Templates in Macros

**Boss kill macro:**
```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target the boss!");
  return;
}

// Render the template
const announcementText = game.toast.templates.render("boss-kill", {
  killer: token.name,
  boss: target.name
});

// Display as regular toast for now (Phase 1)
game.toast.show([
  {
    type: "text",
    text: announcementText,
    color: "#FFD700",
    fontSize: "80px",
    fontWeight: "bold",
    textShadow: "0 0 50px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 400,
      startY: window.innerHeight / 2 - 40,
      duration: 3
    }
  }
]);

// Phase 2 will add: game.toast.showDynamic("boss-kill", {...})
// This will generate TTS audio and display together
```

### Template Management

**Delete a template:**
```javascript
game.toast.templates.delete("my-epic-moment");
```

**Check if template exists:**
```javascript
const exists = game.toast.templates.get("boss-kill") !== null;
```

**List templates by tag:**
```javascript
const bossTemplates = game.toast.templates.list("boss");
const healTemplates = game.toast.templates.list("heal");
const achievementTemplates = game.toast.templates.list("achievement");
```

### Coming in Phase 2: ElevenLabs Integration

**Future functionality (not yet implemented):**
```javascript
// This API will be available in Phase 2
await game.toast.showDynamic("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
}, [
  // Optional visual elements
  { type: "text", text: "BOSS DEFEATED!", ... }
]);

// Will:
// 1. Render template with tokens
// 2. Generate TTS audio with user's ElevenLabs API key
// 3. Cache the audio
// 4. Broadcast to all players
// 5. Play synchronized audio + visuals
```

### Best Practices

1. **Keep templates concise** - 1-2 sentences, under 200 characters
2. **Use descriptive token names** - `{killer}` not `{p1}`
3. **Estimate duration** - Help the system know how long audio will be
4. **Tag appropriately** - Makes filtering easier
5. **Test token combinations** - Ensure grammar works with different values

### Tips

- Templates are case-sensitive: `{player}` ≠ `{Player}`
- Token names can include: letters, numbers, hyphens, underscores
- Extra tokens (not in template) are ignored
- Missing required tokens return null
- Templates persist only during session (not saved between reloads)
- Register custom templates in a macro that runs on world load

---

## Module Integration

Toast provides an API for other modules to register their own announcer packs. This allows module developers to bundle voice packs with their modules without requiring users to manually copy files.

### For Module Developers

#### Registering Your Announcer Pack

Call `game.toast.registerAnnouncer()` during your module's `ready` hook:

```javascript
Hooks.once('ready', () => {
  // Check if Toast module is active
  if (game.toast && game.toast.registerAnnouncer) {
    game.toast.registerAnnouncer('my-fantasy-announcer', {
      name: 'Fantasy Quest Announcer',
      path: 'modules/my-module/sounds/announcer'
    });
  }
});
```

#### Parameters

- **id** (string): Unique identifier for your announcer
  - Use your module name as a prefix (e.g., `"mymodule-epic-announcer"`)
  - Lowercase with hyphens only
  - Must be unique across all modules

- **config.name** (string): Display name shown in Toast settings
  - User-friendly name (e.g., `"Epic Movie Announcer"`)
  - Shows in the GM's Announcer Pack dropdown

- **config.path** (string): Base path to your sound files
  - Path to the folder containing sound files
  - No trailing slash
  - Example: `"modules/my-module/sounds/announcer"`

#### File Organization

Organize your sound files in a consistent structure:

```
modules/my-module/
├── module.json
├── scripts/
│   └── init.js  (registers announcer)
└── sounds/
    └── announcer/
        ├── double-kill.wav
        ├── triple-kill.wav
        ├── critical-hit.wav
        └── victory.wav
```

#### Complete Example

**File: modules/my-module/scripts/init.js**
```javascript
Hooks.once('ready', () => {
  // Check Toast module is available
  if (!game.toast || !game.toast.registerAnnouncer) {
    console.warn("Toast module not found - announcer pack not registered");
    return;
  }

  // Register your announcer pack
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

**File: modules/my-module/module.json**
```json
{
  "id": "my-module",
  "title": "My Awesome Module",
  "version": "1.0.0",
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
  }
}
```

#### Best Practices

1. **Check for Toast**: Always check if Toast is loaded before registering
2. **Unique IDs**: Prefix your announcer ID with your module name
3. **Module Dependencies**: Mark Toast as an optional dependency in your module.json
4. **Consistent Filenames**: Use standard filenames that users expect:
   - `double-kill.wav`, `triple-kill.wav`, `unstoppable.wav`
   - `critical-hit.wav`, `level-up.wav`, `victory.wav`
5. **Documentation**: Tell users your module includes a Toast announcer pack
6. **File Size**: Keep sound files under 500KB each for performance
7. **Audio Format**: Use WAV or MP3 for maximum compatibility

#### Usage by End Users

Once registered, your announcer pack automatically appears in:
- **Module Settings** → **Toast - Full Screen Celebrations** → **Announcer Pack**
- GMs can select it from the dropdown
- All macros using `game.toast.getAnnouncerSound()` will automatically use your pack when selected

#### Providing Sample Macros

Include sample macros that work with your announcer:

```javascript
// Sample macro for your module
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
    volume: 0.9
  },
  {
    type: "text",
    text: "DOUBLE KILL!",
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

#### Troubleshooting

**Announcer not appearing in dropdown:**
- Check console for registration errors
- Verify `ready` hook is being called
- Ensure `game.toast.registerAnnouncer` exists

**Sounds not playing:**
- Verify file paths are correct (no trailing slash in path)
- Check sound files exist at registered path
- Use browser console to test path: `game.toast.getAnnouncerSound("your-file.wav")`

**Module load order issues:**
- Always register during `ready` hook, not `init`
- Toast must be enabled for registration to work
- Registration is safe even if called multiple times

### For Players/GMs

When a module registers an announcer pack with Toast:

1. The announcer automatically appears in **Module Settings** → **Toast** → **Announcer Pack**
2. Select the announcer from the dropdown
3. All existing macros using `game.toast.getAnnouncerSound()` will use the new announcer
4. No macro changes needed - just select and play!

---

## Tips & Best Practices

### Animation Tips
- Keep durations between 1-3 seconds for best impact
- Use `window.innerWidth` and `window.innerHeight` for responsive positioning
- Combine multiple elements for more dramatic effects
- Experiment with different easing functions
- Use text shadows and glows for better visibility

### Sound Tips
- Keep sound files under 500KB each for quick loading
- Normalize volume across all variants
- Start with 2-3 variants before adding more
- Test sounds at different volumes
- Use delays to synchronize with visuals

### Performance Tips
- Limit to 3-4 elements per toast
- Avoid very large images
- Use appropriate image formats (WebP, PNG)
- Keep animation durations reasonable
- Test on slower systems

### Design Tips
- Use contrasting colors for text visibility
- Add glow effects to make text pop
- Layer elements with z-index for depth
- Use shapes as backgrounds for text
- Less is more - don't overwhelm

---

## Troubleshooting

### Toast doesn't display
- Check browser console for errors
- Verify permissions are configured correctly
- Use `game.toast.showLocal()` to test locally
- Ensure module is enabled

### Sound doesn't play
- Verify file path is correct
- Check browser audio permissions
- Test with different volume levels
- Check browser console for errors
- Try different audio format

### Players hear different sounds
- Make sure you're using `game.toast.randomSound()`
- Don't call `Math.random()` on each client
- Let the function handle random selection

### Text is cut off
- Reduce `fontSize`
- Adjust `startX` and `endX` positions
- Use shorter text or split into multiple elements

### Animation looks wrong
- Adjust `duration` (try 1.5-2.5 seconds)
- Try different `easing` values
- Use `delay` to space out elements
- Check `startX`/`startY` values

### Second toast stacks incorrectly
- **Fixed in v1.2.1** - Update to latest version
- Automatically removes existing overlay before creating new one

### Permission Check

Test if you have permission:
```javascript
if (game.toast.hasPermission()) {
  console.log("You can trigger toasts!");
} else {
  console.log("No permission");
}
```

### Element Validation

Check if an element is valid:
```javascript
const result = game.toast.resolveElement({
  type: "sound",
  src: "sounds/test.wav"
});

console.log(result);
// {type: "sound", valid: true, content: "sounds/test.wav", error: null}
```

---

## Permission Settings

Configure permissions in Module Settings:

### Permission Modes

1. **GM Only** (default)
   - Only the GM can trigger toasts
   - Most secure option

2. **By Role**
   - Set minimum role level required
   - Roles: Player, Trusted Player, Assistant GM, Game Master

3. **By Username**
   - Comma-separated list of specific usernames
   - Example: `alice, bob, charlie`

### Changing Permissions

1. Go to **Configure Settings** → **Module Settings**
2. Find "Toast - Full Screen Celebrations"
3. Set **Permission Mode**
4. Configure **Allowed Roles** or **Allowed Usernames** as needed

---

## Sound Resources

### Free Sound Libraries

- **Freesound.org** - Creative Commons sounds
- **Zapsplat.com** - Free sound effects (attribution required)
- **Mixkit.co** - Royalty-free sounds
- **Incompetech.com** - Kevin MacLeod's music
- **BBC Sound Effects** - Free for personal use

### Recommended Sounds

- **Critical Hit**: sword slash, explosion, thunderclap
- **Victory**: fanfare, triumphant horn, celebration
- **Level Up**: chime, ascending notes, sparkle
- **Finishing Blow**: heavy impact, final blow, dramatic boom
- **Kill Streak**: announcer voice, aggressive music sting
- **Achievement**: coin, success chime, power-up

---

## Font Recommendations

For dramatic text effects:

- **Impact** - Bold, attention-grabbing
- **'Arial Black'** - Heavy and readable
- **'Comic Sans MS'** - Fun and playful
- **'Brush Script MT'** - Handwritten style
- **'Cinzel'** - Elegant, theatrical (requires web font)
- **'Bangers'** - Comic book style (requires web font)

---

## Support & Contributing

- **Issues**: Report bugs at [GitHub Issues](https://github.com/yourusername/toast/issues)
- **Feature Requests**: Open an issue with your suggestion
- **Contributions**: Pull requests welcome!

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

**Current Version**: 1.2.2
- Random sound selection
- Synchronized across all players
- Comprehensive documentation

---

## License

MIT License - See LICENSE file for details

---

## Credits

Created by Dynvar

Includes sample audio: "DOUBLE KILL.wav"
