# Toast API Reference

Complete API documentation for the Toast module for Foundry VTT.

## Table of Contents

- [Core Methods](#core-methods)
  - [show()](#gametoastshowelements)
  - [showLocal()](#gametoastshowlocalelements)
  - [hasPermission()](#gametoasthaspermission)
  - [resolveElement()](#gametoastresolveelement)
- [Dynamic TTS](#dynamic-tts)
  - [showDynamic()](#gametoastshowdynamictemplateid-tokens-elements)
  - [showDynamicAI()](#gametoastshowdynamicaiconfig)
- [AI Generation](#ai-generation)
  - [AI Configuration](#ai-configuration)
  - [AI Examples](#ai-examples)
- [Templates](#templates)
  - [templates.register()](#gametoasttemplatesregisterid-config)
  - [templates.render()](#gametoasttemplatesrenderid-tokens)
  - [templates.get()](#gametoasttemplatesgetid)
  - [templates.list()](#gametoasttemplateslisttag)
  - [templates.delete()](#gametoasttemplatesdeleteid)
- [Cache Management](#cache-management)
  - [cache.clear()](#gametoastcacheclear)
  - [cache.getSize()](#gametoastcachegetsize)
  - [cache.getCount()](#gametoastcachegetcount)
- [Sound Utilities](#sound-utilities)
  - [randomSound()](#gametoastrandomsoundsources-options)
  - [weightedRandomSound()](#gametoastweightedrandomsoundsoundswithweights-options)
  - [getAnnouncerSound()](#gametoastgetannouncersoundfilename)
  - [registerAnnouncer()](#gametoastregisterannouncerid-config)
- [Security Notes](#security-notes)

---

## Core Methods

### `game.toast.show(elements)`

Show toast to all players with GM validation.

**Parameters:**
- `elements` (Array) - Array of element objects to display

**Returns:** void

**Description:**
This is the primary method for displaying toasts. It uses a secure request/broadcast pattern:
1. Sends request to GM with permission validation
2. GM validates user permissions
3. If approved, broadcasts to all connected clients
4. Prevents unauthorized console access

**Example:**
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

**Example with Sound:**
```javascript
game.toast.show([
  {
    type: "sound",
    src: "sounds/fanfare.mp3",
    volume: 0.9
  },
  {
    type: "text",
    text: "VICTORY!",
    color: "#FFD700",
    fontSize: "120px",
    fontWeight: "bold",
    textShadow: "0 0 40px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 60,
      duration: 2.5
    }
  }
]);
```

**Example with Multiple Elements:**
```javascript
game.toast.show([
  // Background shape
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
      duration: 0.5
    }
  },
  // Foreground text
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
  }
]);
```

---

### `game.toast.showLocal(elements)`

Show toast only on the local client without broadcasting to other players.

**Parameters:**
- `elements` (Array) - Array of element objects to display

**Returns:** void

**Description:**
Perfect for testing and previewing toasts before broadcasting. Does not require permissions or GM validation. Only displays on your screen.

**Example:**
```javascript
// Test locally before broadcasting
game.toast.showLocal([
  {
    type: "text",
    text: "Testing...",
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

**Use Cases:**
- Testing new toast designs
- Previewing animations and timing
- Debugging element positioning
- Development and iteration

---

### `game.toast.hasPermission()`

Check if the current user has permission to trigger toasts.

**Parameters:** None

**Returns:** Boolean - `true` if user has permission, `false` otherwise

**Description:**
Validates permissions based on configured settings (GM only, by role, or by username).

**Example:**
```javascript
if (game.toast.hasPermission()) {
  game.toast.show([
    { type: "text", text: "You have permission!" }
  ]);
} else {
  ui.notifications.warn("You don't have permission to trigger toasts");
}
```

**Permission Modes:**
- **GM Only**: Only GMs can trigger toasts
- **By Role**: Minimum role level required
- **By Username**: Specific usernames allowed

---

### `game.toast.resolveElement(element)`

Resolve and validate an element before display.

**Parameters:**
- `element` (Object) - Element object to validate

**Returns:** Object with properties:
- `type` (string) - Element type
- `valid` (boolean) - Whether element is valid
- `content` (string) - Resolved content (path, text, etc.)
- `error` (string|null) - Error message if invalid

**Description:**
Validates element structure and resolves content references (tokens, actors, etc.).

**Example:**
```javascript
// Validate a sound element
const result = game.toast.resolveElement({
  type: "sound",
  src: "sounds/test.wav"
});

console.log(result);
// {type: "sound", valid: true, content: "sounds/test.wav", error: null}

// Validate a token image
const token = canvas.tokens.controlled[0];
const result = game.toast.resolveElement({
  type: "tokenImage",
  tokenId: token.id
});

console.log(result);
// {type: "tokenImage", valid: true, content: "path/to/token.png", error: null}
```

**Use Cases:**
- Pre-validate elements before broadcasting
- Debug element configuration
- Check if token/actor IDs are valid
- Verify file paths exist

---

## Dynamic TTS

### `game.toast.showDynamic(templateId, tokens, elements)`

Generate TTS audio from template and show toast to all players.

**Parameters:**
- `templateId` (string) - ID of registered template
- `tokens` (Object) - Token values to fill in template
- `elements` (Array) - Optional visual elements to display

**Returns:** Promise that resolves when TTS is generated and broadcast

**Description:**
Generates AI voice using ElevenLabs TTS and displays with optional visual elements. Audio is cached locally to minimize API usage.

**Requirements:**
- ElevenLabs API key configured in user settings
- Template registered with `game.toast.templates.register()`

**Example:**
```javascript
await game.toast.showDynamic("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
}, [
  {
    type: "text",
    text: "BOSS DEFEATED!",
    color: "#FFD700",
    fontSize: "100px",
    animation: {
      startX: window.innerWidth / 2 - 400,
      startY: window.innerHeight / 2 - 50,
      duration: 3
    }
  }
]);
```

**Example with Token:**
```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target!");
  return;
}

await game.toast.showDynamic("boss-kill", {
  killer: token.name,
  boss: target.name
});
```

**Caching Behavior:**
- Audio is cached based on text + voice ID
- Subsequent calls with same text reuse cached audio
- Cache persists across sessions (IndexedDB)
- Minimizes API usage and costs

---

### `game.toast.showDynamicAI(config)`

Generate AI text, convert to TTS, and show toast to all players.

**Parameters:**
- `config` (Object) - Configuration object:
  - `prompt` (string) **REQUIRED** - Tone/style prompt for AI
  - `actor` (Object) - User-defined actor context
  - `target` (Object) - User-defined target context
  - `context` (string) - What happened (e.g., "finishing-blow")
  - `elements` (Array) - Visual elements to display
  - `fallbackTemplate` (string) - Template ID if AI fails
  - `...` (any) - Any other user-defined context data

**Returns:** Promise that resolves when AI+TTS is generated and broadcast

**Description:**
The most powerful method - generates unique, contextual announcements using AI (Claude or GPT), converts to voice, and displays to all players.

**Requirements:**
- AI generation enabled in settings
- AI API key (user's own or GM's shared)
- ElevenLabs API key for TTS

**Features:**
- 10-second timeout with retry option
- Status window for user feedback
- Automatic fallback to template on failure
- Supports ElevenLabs v3 bracket notation `[angry]`, `[gentle]`, etc.

**Basic Example:**
```javascript
await game.toast.showDynamicAI({
  prompt: "Announce this as an epic fantasy narrator",
  actor: { name: "Alice" },
  target: { name: "Dragon" },
  context: "boss-kill"
});
```

**Complete Example:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator with gravitas",
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
    cr: 24,
    description: "Terrorizing the village"
  },
  context: "finishing-blow",
  damageDealt: 89,
  abilityUsed: "Divine Smite",
  wasCritical: true,
  location: "Dragon's mountain lair",
  elements: [
    {
      type: "text",
      text: "BOSS DEFEATED!",
      color: "#FFD700",
      fontSize: "100px",
      animation: {
        startX: window.innerWidth / 2 - 300,
        startY: window.innerHeight / 2 - 50,
        duration: 2
      }
    }
  ],
  fallbackTemplate: "boss-kill"
});
```

**D&D 5e Boss Kill Macro:**
```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target the boss!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[triumphant] Announce this as an epic fantasy narrator",
  actor: {
    name: token.name,
    class: token.actor.system.details.class,
    level: token.actor.system.details.level
  },
  target: {
    name: target.name,
    type: target.actor.system.details.type,
    cr: target.actor.system.details.cr
  },
  context: "finishing-blow",
  elements: [
    { type: "text", text: "BOSS DEFEATED!", color: "#FFD700", fontSize: "100px" }
  ],
  fallbackTemplate: "boss-kill"
});
```

**ElevenLabs v3 Bracket Notation:**
```javascript
// Angry tone
prompt: "[angry] Describe this betrayal with righteous fury"

// Gentle tone
prompt: "[gentle] Speak softly about this merciful act"

// Excited tone
prompt: "[excited] Sports commentator announcing the winning goal!"

// Triumphant tone
prompt: "[triumphant] Epic victory with gravitas"
```

**System-Agnostic Design:**
Works with any game system - just pass the data that matters:

```javascript
// Pathfinder 2e
actor: {
  name: token.name,
  class: token.actor.system.details.class.value,
  level: token.actor.system.details.level.value
}

// Custom Homebrew
actor: {
  name: "Alice",
  faction: "The Silver Ravens",
  backstory: "Orphaned princess seeking revenge"
}
```

---

## AI Generation

### AI Configuration

**World Settings (GM):**
1. Open **Module Settings** → **Toast - Full Screen Celebrations**
2. Enable **AI Text Generation**
3. Select **AI Provider** (Claude or OpenAI)
4. Enter **API Key**
5. Choose **Share AI Keys With**:
   - **None (GM Only)** - Only GM pays
   - **All Players** - Everyone can use GM keys
   - **By Role** - Specific roles only
   - **By Username** - Specific usernames only
6. Select **AI Model**
7. Adjust **Temperature** (0.7 = balanced)

**Client Settings (Optional):**
1. Enable **Use Own AI API Keys**
2. Select **AI Provider**
3. Enter **API Key**
4. Configure OpenAI mode if needed

### AI Examples

**Critical Hit:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[excited] Sports commentator style",
  actor: { name: token.name, class: "Fighter" },
  target: { name: target.name },
  context: "critical-hit",
  damageDealt: 45,
  wasCritical: true
});
```

**Clutch Heal:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[gentle] Describe this heroic healing moment",
  actor: { name: healer.name, class: "Cleric" },
  target: { name: target.name, hp: 3, maxHp: 50 },
  context: "clutch-heal",
  healingAmount: 25
});
```

**Betrayal:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[angry] Dramatic betrayal announcement",
  actor: { name: traitor.name },
  target: { name: victim.name },
  context: "betrayal",
  relationship: "former ally"
});
```

---

## Templates

### `game.toast.templates.register(id, config)`

Register a dynamic TTS template for reuse.

**Parameters:**
- `id` (string) - Unique template identifier
- `config` (Object) - Template configuration:
  - `template` (string) - Template string with `{tokens}`
  - `tags` (Array<string>) - Optional tags for categorization
  - `duration` (number) - Optional estimated audio duration in seconds

**Returns:** Boolean - `true` if registered successfully, `false` otherwise

**Description:**
Register reusable text templates with token replacement for TTS generation.

**Example:**
```javascript
game.toast.templates.register("boss-kill", {
  template: "{killer} strikes the final blow against {boss}! Victory is yours!",
  tags: ["boss", "victory"],
  duration: 4
});
```

**Example with Multiple Tokens:**
```javascript
game.toast.templates.register("team-victory", {
  template: "{player1}, {player2}, and {player3} worked together to defeat {boss}!",
  tags: ["teamwork", "boss"],
  duration: 5
});
```

**Token Syntax:**
- Use `{tokenName}` in template string
- Token names: letters, numbers, hyphens, underscores
- Case-sensitive: `{player}` ≠ `{Player}`

---

### `game.toast.templates.render(id, tokens)`

Render a template with token values.

**Parameters:**
- `id` (string) - Template ID
- `tokens` (Object) - Token values to replace

**Returns:** String - Rendered text, or null if template not found or tokens missing

**Description:**
Replace tokens in template with actual values. Returns null if required tokens are missing.

**Example:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});

console.log(text);
// "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

**Error Handling:**
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
// Returns: rendered text
```

---

### `game.toast.templates.get(id)`

Get a registered template by ID.

**Parameters:**
- `id` (string) - Template ID

**Returns:** Object - Template configuration, or null if not found

**Description:**
Retrieve template details including tokens, tags, and duration.

**Example:**
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

**Check if Template Exists:**
```javascript
const exists = game.toast.templates.get("boss-kill") !== null;
```

---

### `game.toast.templates.list(tag)`

List all registered templates, optionally filtered by tag.

**Parameters:**
- `tag` (string) - Optional tag filter

**Returns:** Array<Object> - Array of template objects with `{id, template, tokens, tags, duration}`

**Description:**
List all available templates or filter by tag.

**Example:**
```javascript
// List all templates
const allTemplates = game.toast.templates.list();

// List combat templates
const combatTemplates = game.toast.templates.list("combat");

// List healing templates
const healTemplates = game.toast.templates.list("heal");

// Display template info
allTemplates.forEach(t => {
  console.log(`${t.id}: ${t.template}`);
  console.log(`Tokens: ${t.tokens.join(", ")}`);
  console.log(`Tags: ${t.tags.join(", ")}`);
});
```

**Built-in Templates:**
- `boss-kill` - Boss defeat announcement
- `epic-defeat` - Epic enemy defeat
- `clutch-heal` - Clutch healing moment
- `life-saver` - Life-saving action
- `triple-kill` - Triple kill announcement
- `killing-spree` - Killing spree announcement
- `clutch-save` - Party save moment
- `perfect-shot` - Perfect shot/attack
- `quest-complete` - Quest completion
- `level-up` - Level up announcement

---

### `game.toast.templates.delete(id)`

Delete a registered template.

**Parameters:**
- `id` (string) - Template ID to delete

**Returns:** Boolean - `true` if deleted, `false` if not found

**Description:**
Remove a template from the registry.

**Example:**
```javascript
game.toast.templates.delete("my-custom-template");
```

**Warning:** Cannot delete templates while they're being used. Built-in templates can be deleted but will be re-registered on reload.

---

## Cache Management

### `game.toast.cache.clear()`

Clear all cached TTS audio files.

**Parameters:** None

**Returns:** Promise - Resolves when cache is cleared

**Description:**
Removes all locally cached TTS audio from IndexedDB. Use this if you need to free up space or regenerate audio.

**Example:**
```javascript
await game.toast.cache.clear();
ui.notifications.info("TTS cache cleared");
```

---

### `game.toast.cache.getSize()`

Get total cache size in bytes.

**Parameters:** None

**Returns:** Promise<number> - Total size of cached audio in bytes

**Description:**
Check how much storage space the TTS cache is using.

**Example:**
```javascript
const sizeInBytes = await game.toast.cache.getSize();
const sizeMB = (sizeInBytes / 1024 / 1024).toFixed(2);
console.log(`Cache size: ${sizeMB} MB`);
```

---

### `game.toast.cache.getCount()`

Get number of cached audio files.

**Parameters:** None

**Returns:** Promise<number> - Count of cached audio files

**Description:**
Check how many TTS audio files are cached.

**Example:**
```javascript
const count = await game.toast.cache.getCount();
console.log(`Cached audio files: ${count}`);
```

**Complete Cache Status:**
```javascript
async function checkCacheStatus() {
  const size = await game.toast.cache.getSize();
  const count = await game.toast.cache.getCount();
  const sizeMB = (size / 1024 / 1024).toFixed(2);

  console.log(`Cache: ${count} files, ${sizeMB} MB`);

  if (size > 100 * 1024 * 1024) { // > 100 MB
    console.warn("Cache is large, consider clearing");
    await game.toast.cache.clear();
  }
}

checkCacheStatus();
```

**How Caching Works:**
1. Audio cached based on text + voice ID
2. Subsequent calls with same text reuse cached audio
3. Cache stored in browser IndexedDB (persists across sessions)
4. Oldest items removed when cache exceeds size limit
5. Each user's cache is independent

---

## Sound Utilities

### `game.toast.randomSound(sources, options)`

Create a random sound element synchronized across all players.

**Parameters:**
- `sources` (Array<string>) - Array of sound file paths
- `options` (Object) - Optional sound options:
  - `volume` (number) - Volume 0.0 to 1.0 (default: 0.8)
  - `delay` (number) - Delay in seconds (default: 0)
  - `loop` (boolean) - Loop sound (default: false)

**Returns:** Object - Sound element with randomly selected source, or null if no valid sources

**Description:**
Randomly selects one sound from array. Selection happens on triggering client and is broadcast to all players, ensuring perfect synchronization.

**Example:**
```javascript
game.toast.show([
  game.toast.randomSound([
    "sounds/critical-1.wav",
    "sounds/critical-2.wav",
    "sounds/critical-3.wav"
  ], { volume: 0.9 }),
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "100px"
  }
]);
```

**With Announcer Packs:**
```javascript
game.toast.show([
  game.toast.randomSound([
    game.toast.getAnnouncerSound("crit-1.wav"),
    game.toast.getAnnouncerSound("crit-2.wav"),
    game.toast.getAnnouncerSound("crit-3.wav")
  ], { volume: 0.9 }),
  { type: "text", text: "CRITICAL!" }
]);
```

**Graceful Failure:**
- Automatically filters out null/invalid sources
- Returns null if no valid sources remain
- Safely handles missing files

---

### `game.toast.weightedRandomSound(soundsWithWeights, options)`

Create a weighted random sound element synchronized across all players.

**Parameters:**
- `soundsWithWeights` (Array<Object>) - Array of `{src, weight}` objects
- `options` (Object) - Optional sound options:
  - `volume` (number) - Volume 0.0 to 1.0 (default: 0.8)
  - `delay` (number) - Delay in seconds (default: 0)
  - `loop` (boolean) - Loop sound (default: false)

**Returns:** Object - Sound element with weighted random selected source, or null if no valid sources

**Description:**
Randomly selects sound based on weights. Higher weight = higher chance of selection.

**Example:**
```javascript
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
game.toast.weightedRandomSound([
  { src: game.toast.getAnnouncerSound("common.wav"), weight: 70 },
  { src: game.toast.getAnnouncerSound("rare.wav"), weight: 20 },
  { src: game.toast.getAnnouncerSound("legendary.wav"), weight: 10 }
], { volume: 0.9 })
```

**How Weights Work:**
- Total weight: 70 + 20 + 10 = 100
- Common: 70/100 = 70% chance
- Rare: 20/100 = 20% chance
- Legendary: 10/100 = 10% chance

**Graceful Failure:**
- Automatically filters out null/invalid sources
- Returns null if no valid sources remain
- Safely handles missing files

---

### `game.toast.getAnnouncerSound(filename)`

Get path to sound file from currently selected announcer pack.

**Parameters:**
- `filename` (string) - Sound filename (e.g., "double-kill.wav")

**Returns:** String - Full path to sound file, or null if invalid

**Description:**
Retrieves sound from active announcer pack. GMs can switch packs in settings without changing macros.

**Example:**
```javascript
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
    volume: 0.9
  },
  { type: "text", text: "DOUBLE KILL!" }
]);
```

**Returns:**
```javascript
// Returns: "modules/toast/sounds/announcers/unreal-tournament/double-kill.wav"
game.toast.getAnnouncerSound("double-kill.wav")
```

**Safe Usage with randomSound:**
```javascript
// Nulls are automatically filtered out
game.toast.randomSound([
  game.toast.getAnnouncerSound("double-kill.wav"),
  game.toast.getAnnouncerSound("triple-kill.wav"),
  game.toast.getAnnouncerSound("missing-file.wav")  // Returns null, safely filtered
], { volume: 0.9 })
```

**Graceful Failure:**
- Returns null if filename is invalid
- Returns null if no announcer pack configured
- Safe to use with randomSound (nulls filtered)

---

### `game.toast.registerAnnouncer(id, config)`

Register an announcer pack from another module (for module developers).

**Parameters:**
- `id` (string) - Unique announcer identifier
- `config` (Object) - Configuration:
  - `name` (string) - Display name in settings
  - `path` (string) - Base path to sound files

**Returns:** Boolean - `true` if registered successfully, `false` otherwise

**Description:**
Allows modules to register announcer packs that appear in Toast settings.

**Example:**
```javascript
// In your module's ready hook
Hooks.once('ready', () => {
  if (game.toast && game.toast.registerAnnouncer) {
    game.toast.registerAnnouncer('my-epic-announcer', {
      name: 'Epic Movie Announcer',
      path: 'modules/my-module/sounds/announcer'
    });
  }
});
```

**Complete Module Integration:**
```javascript
Hooks.once('ready', () => {
  // Check Toast is available
  if (!game.toast || !game.toast.registerAnnouncer) {
    console.warn("Toast module not found - announcer not registered");
    return;
  }

  // Register announcer
  const registered = game.toast.registerAnnouncer('mymodule-epic', {
    name: 'Epic Movie Announcer',
    path: 'modules/my-module/sounds/announcer'
  });

  if (registered) {
    console.log("Successfully registered announcer pack");
  } else {
    console.error("Failed to register announcer pack");
  }
});
```

**Best Practices:**
- Prefix ID with module name: `"mymodule-announcer"`
- Use lowercase with hyphens only
- Register during `ready` hook (not `init`)
- Check if Toast exists before registering
- Mark Toast as optional dependency in module.json

---

## Security Notes

### Request/Broadcast Pattern

The module uses a secure permission system:

1. **Client Request**: User calls `game.toast.show()`
2. **GM Validation**: Request sent to GM via socket
3. **Permission Check**: GM validates user permissions
4. **Broadcast**: If approved, GM broadcasts to all clients
5. **Display**: All clients display the toast

**Why This Matters:**
- Prevents console exploitation
- GM always controls who can trigger toasts
- Users can't bypass permissions with browser devtools
- Centralized permission validation

**Example Flow:**
```
Player calls game.toast.show()
    ↓
Request sent to GM socket
    ↓
GM validates: Does player have permission?
    ↓ YES                    ↓ NO
Broadcast to all     Reject (no display)
    ↓
All players see toast
```

### API Key Security

**Warning:** Foundry modules run in the same JavaScript context with no isolation.

**Best Practices:**
1. **Only install trusted modules**
2. **Use separate API keys for Foundry**
3. **Set spending limits on API keys**
4. **Monitor API usage regularly**
5. **Rotate keys periodically**
6. **Review installed modules**

**Setting Spending Limits:**
- Claude: https://console.anthropic.com/settings/limits
- OpenAI: https://platform.openai.com/account/limits

### Permission Modes

**GM Only (Default):**
- Most secure
- Only GM can trigger toasts

**By Role:**
- Set minimum role required
- Roles: Player, Trusted Player, Assistant GM, Game Master

**By Username:**
- Comma-separated usernames
- Example: `alice, bob, charlie`

---

## Complete Working Examples

### Example 1: Critical Hit with Random Sound

```javascript
game.toast.show([
  // Random sound from 3 variants
  game.toast.randomSound([
    "sounds/critical-1.wav",
    "sounds/critical-2.wav",
    "sounds/critical-3.wav"
  ], { volume: 0.9 }),

  // Background shape
  {
    type: "shape",
    width: "700px",
    height: "200px",
    backgroundColor: "#000000",
    borderRadius: "20px",
    opacity: 0.8,
    zIndex: 1,
    animation: {
      startX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 100,
      duration: 0.5
    }
  },

  // Text
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #ff0000",
    zIndex: 2,
    animation: {
      startX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 50,
      scale: 0.5,
      opacity: 0,
      duration: 0.8,
      delay: 0.3
    }
  }
]);
```

### Example 2: Boss Kill with AI + TTS

```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target the boss!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator announcing a heroic boss kill",
  actor: {
    name: token.name,
    class: token.actor.system.details.class,
    level: token.actor.system.details.level,
    weapon: token.actor.system.attributes.weapon?.name || "their weapon"
  },
  target: {
    name: target.name,
    type: target.actor.system.details.type,
    cr: target.actor.system.details.cr,
    description: "Terrorizing the realm"
  },
  context: "finishing-blow",
  damageDealt: 89,
  wasCritical: true,
  elements: [
    {
      type: "text",
      text: "BOSS DEFEATED!",
      color: "#FFD700",
      fontSize: "100px",
      fontWeight: "bold",
      textShadow: "0 0 60px #FFD700",
      animation: {
        startX: window.innerWidth / 2 - 400,
        startY: window.innerHeight / 2 - 50,
        duration: 3
      }
    }
  ],
  fallbackTemplate: "boss-kill"
});
```

### Example 3: Weighted Random Legendary Moment

```javascript
game.toast.show([
  // Weighted random: 70% common, 20% rare, 10% legendary
  game.toast.weightedRandomSound([
    { src: game.toast.getAnnouncerSound("common-crit.wav"), weight: 70 },
    { src: game.toast.getAnnouncerSound("rare-crit.wav"), weight: 20 },
    { src: game.toast.getAnnouncerSound("legendary-crit.wav"), weight: 10 }
  ], { volume: 0.9 }),

  {
    type: "text",
    text: "LEGENDARY CRITICAL!",
    color: "#ff6600",
    fontSize: "110px",
    fontWeight: "bold",
    textShadow: "0 0 70px #ff6600",
    animation: {
      startX: window.innerWidth / 2 - 450,
      startY: window.innerHeight / 2 - 55,
      duration: 2.5,
      scale: 1.2
    }
  }
]);
```

### Example 4: Template with Fallback

```javascript
// Register custom template
game.toast.templates.register("clutch-save", {
  template: "{player} saves the party from certain doom with {ability}!",
  tags: ["clutch", "save"],
  duration: 4
});

// Use template with TTS
await game.toast.showDynamic("clutch-save", {
  player: "Alice",
  ability: "Divine Intervention"
}, [
  {
    type: "text",
    text: "CLUTCH SAVE!",
    color: "#00ff00",
    fontSize: "90px",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 45,
      duration: 2
    }
  }
]);
```

---

## Quick Reference

**Show toast to all:**
```javascript
game.toast.show([elements])
```

**Test locally:**
```javascript
game.toast.showLocal([elements])
```

**TTS from template:**
```javascript
await game.toast.showDynamic(templateId, tokens, [elements])
```

**AI + TTS:**
```javascript
await game.toast.showDynamicAI({ prompt, actor, target, context })
```

**Random sound:**
```javascript
game.toast.randomSound([paths], {volume})
```

**Weighted random:**
```javascript
game.toast.weightedRandomSound([{src, weight}], {volume})
```

**Announcer sound:**
```javascript
game.toast.getAnnouncerSound(filename)
```

**Register template:**
```javascript
game.toast.templates.register(id, {template, tags, duration})
```

**Clear cache:**
```javascript
await game.toast.cache.clear()
```

---

For more examples and guides, see:
- [TEMPLATES.md](./TEMPLATES.md) - Template system guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
