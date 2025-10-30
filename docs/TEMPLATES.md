# Toast Templates Guide

Complete guide to the Toast template system for dynamic TTS announcements.

## Table of Contents

- [What Are Templates?](#what-are-templates)
- [ElevenLabs Setup](#elevenlabs-setup)
- [Built-in Templates](#built-in-templates)
- [Basic Usage](#basic-usage)
- [Creating Custom Templates](#creating-custom-templates)
- [Token Validation](#token-validation)
- [Using Templates in Macros](#using-templates-in-macros)
- [Template Management](#template-management)
- [Cache Management](#cache-management)
- [Best Practices](#best-practices)
- [Tips and Tricks](#tips-and-tricks)

---

## What Are Templates?

Dynamic TTS templates allow you to create reusable text templates with tokens that get filled in at runtime and generate AI voice announcements via ElevenLabs. Perfect for epic moments where you want personalized announcements that everyone can hear!

**How Templates Work:**

Templates are text strings with `{tokens}` that get replaced with actual values when rendered:

```javascript
Template: "{killer} strikes the final blow against {boss}! Victory is yours!"
Tokens: { killer: "Bob", boss: "Ancient Dragon" }
Result: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

**The Complete Flow:**

1. Register a template with token placeholders
2. Call `showDynamic()` with token values
3. Template is rendered with your values
4. Text is sent to ElevenLabs for TTS generation
5. Generated audio is cached locally
6. Audio is broadcast to all players
7. Everyone hears the same personalized announcement!

**Why Use Templates?**

- **Reusable**: Define once, use many times
- **Consistent**: Same structure, different values
- **Cost-effective**: Cached audio minimizes API calls
- **Synchronized**: All players hear the same announcement
- **Personalized**: Token replacement makes each announcement unique

---

## ElevenLabs Setup

To use TTS generation, each player needs their own ElevenLabs API key.

### 1. Get an API Key

**Sign up at [elevenlabs.io](https://elevenlabs.io)**

**Free Tier:**
- 10,000 characters per month
- Access to all voices
- Commercial usage allowed

**Pricing:**
- ~$0.18 per 1000 characters
- 1 announcement ≈ 150 characters ≈ $0.027
- 100 announcements ≈ $2.70

**Get Your Key:**
1. Sign up at https://elevenlabs.io
2. Navigate to your profile
3. Find your API key under "Profile" section
4. Copy the key (starts with `sk_...`)

### 2. Configure Settings

**In Foundry VTT:**

1. Open **Module Settings** → **Toast - Full Screen Celebrations**
2. Enter your **ElevenLabs API Key** (client-side, never shared with other players)
3. Choose a **Voice ID** (default: Rachel - "21m00Tcm4TlvDq8ikWAM")
4. Optional: Configure cache settings

**Finding Voice IDs:**

Browse voices at [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)

**Popular Voices:**
- **Rachel** (21m00Tcm4TlvDq8ikWAM) - Calm, professional female
- **Adam** (pNInz6obpgDQGcFmaJgB) - Deep, authoritative male
- **Antoni** (ErXwobaYiN019PkySvjV) - Well-rounded male
- **Elli** (MF3mGyEYCl7XYWbV9V6O) - Emotional female
- **Josh** (TxGEqnHWrfWFTfGW9XjX) - Young, energetic male
- **Arnold** (VR6AewLTigWG4xSOukaG) - Strong, confident male
- **Sam** (yoZ06aMxZJJ28mfd3POQ) - Raspy, authoritative

### 3. Cache Settings (Optional)

**Enable TTS Cache:** (Default: ON)
- Keeps generated audio to avoid repeated API calls
- Saves money and improves performance
- Stored in browser IndexedDB

**Cache Size:** (Default: 100MB)
- Maximum storage space for cached audio
- Oldest items automatically removed when limit reached
- Can adjust based on your needs

**Important Notes:**

- API key is stored client-side only (never sent to other players)
- User who triggers toast generates TTS with their API key
- Generated audio is cached locally
- Audio is broadcast to all players
- Everyone hears the same voice
- Cache persists across sessions
- Cleared when you clear browser data

---

## Built-in Templates

The module includes 10 pre-made templates for epic moments.

### Boss/Enemy Defeats

#### boss-kill
```
{killer} strikes the final blow against {boss}! Victory is yours!
```
**Tokens:** killer, boss
**Tags:** boss, victory, combat
**Duration:** ~4 seconds

#### epic-defeat
```
{player} has vanquished {enemy}! The battle is won!
```
**Tokens:** player, enemy
**Tags:** victory, combat
**Duration:** ~3 seconds

---

### Healing/Support

#### clutch-heal
```
{healer} comes in with a clutch heal on {target}, pulling them back from the brink of death!
```
**Tokens:** healer, target
**Tags:** heal, clutch, support
**Duration:** ~5 seconds

#### life-saver
```
When all hope seemed lost, {savior} turned the tide of battle!
```
**Tokens:** savior
**Tags:** hero, clutch, support
**Duration:** ~4 seconds

---

### Kill Streaks

#### triple-kill
```
{player} just eliminated {victim1}, {victim2}, and {victim3} in rapid succession! Unstoppable!
```
**Tokens:** player, victim1, victim2, victim3
**Tags:** streak, combat
**Duration:** ~5 seconds

#### killing-spree
```
{player} is on an absolute rampage! {count} enemies down!
```
**Tokens:** player, count
**Tags:** streak, combat
**Duration:** ~3 seconds

---

### Critical Moments

#### clutch-save
```
{player} saves the party from certain doom!
```
**Tokens:** player
**Tags:** clutch, hero
**Duration:** ~3 seconds

#### perfect-shot
```
Incredible! {player} lands the perfect shot on {target}!
```
**Tokens:** player, target
**Tags:** skill, combat
**Duration:** ~3 seconds

---

### Party Achievements

#### quest-complete
```
The party has completed {quest}! Huzzah!
```
**Tokens:** quest
**Tags:** achievement, quest
**Duration:** ~3 seconds

#### level-up
```
{player} has reached level {level}! Power increasing!
```
**Tokens:** player, level
**Tags:** achievement, progression
**Duration:** ~3 seconds

---

## Basic Usage

### Generate TTS Toast

**Recommended Method:**
```javascript
// Generates AI voice and displays to all players
await game.toast.showDynamic("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
}, [
  // Optional visual elements
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

### Render Template Text Only

**Without TTS Generation:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Ancient Dragon"
});

console.log(text);
// Output: "Bob strikes the final blow against Ancient Dragon! Victory is yours!"
```

### List Available Templates

**All Templates:**
```javascript
const allTemplates = game.toast.templates.list();

allTemplates.forEach(t => {
  console.log(`${t.id}: ${t.template}`);
});
```

**Filter by Tag:**
```javascript
// Combat templates
const combatTemplates = game.toast.templates.list("combat");

// Healing templates
const healTemplates = game.toast.templates.list("heal");

// Achievement templates
const achievementTemplates = game.toast.templates.list("achievement");
```

### Get Template Details

**Inspect Template:**
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

---

## Creating Custom Templates

### Register Your Own Template

**Simple Template:**
```javascript
game.toast.templates.register("my-epic-moment", {
  template: "{player} has achieved the impossible against {obstacle}!",
  tags: ["custom", "achievement"],
  duration: 3
});

// Use it
await game.toast.showDynamic("my-epic-moment", {
  player: "Alice",
  obstacle: "overwhelming odds"
});
```

### Templates with Multiple Tokens

**Team Victory:**
```javascript
game.toast.templates.register("team-victory", {
  template: "{player1}, {player2}, and {player3} worked together to defeat {boss}!",
  tags: ["teamwork", "boss"],
  duration: 5
});

await game.toast.showDynamic("team-victory", {
  player1: "Alice",
  player2: "Bob",
  player3: "Charlie",
  boss: "the Lich King"
});
```

**Detailed Combat:**
```javascript
game.toast.templates.register("critical-details", {
  template: "{player} lands a critical hit with {weapon}, dealing {damage} damage to {enemy}!",
  tags: ["combat", "critical"],
  duration: 5
});

await game.toast.showDynamic("critical-details", {
  player: "Alice",
  weapon: "Flaming Sword",
  damage: "89",
  enemy: "Dragon"
});
```

### Template Syntax Rules

**Token Names:**
- Use `{tokenName}` in template string
- Letters, numbers, hyphens, underscores allowed
- Case-sensitive: `{player}` ≠ `{Player}`
- No spaces: `{player name}` is invalid
- Use hyphens or camelCase: `{player-name}` or `{playerName}`

**Template Structure:**
- Keep sentences natural and flowing
- Use punctuation for pacing
- Test with different token values
- Consider grammar with various inputs

**Example:**
```javascript
// Good
"{player} strikes {enemy} with {weapon}!"

// Bad - grammatically awkward
"{player} {weapon} {enemy} strike!"
```

---

## Token Validation

Templates automatically validate that all required tokens are provided.

### Missing Tokens

**Returns Null:**
```javascript
// Missing token - returns null
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob"
  // Missing: boss
});

// Console warning: "Missing tokens for template 'boss-kill': boss"
// Returns: null
```

### All Tokens Provided

**Returns Rendered Text:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Dragon"
});

// Returns: "Bob strikes the final blow against Dragon! Victory is yours!"
```

### Extra Tokens Ignored

**Only Required Tokens Used:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Dragon",
  extra: "ignored"  // This is ignored
});

// Returns: "Bob strikes the final blow against Dragon! Victory is yours!"
// Extra token "extra" is not used
```

### Error Handling in Macros

**Check for Errors:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Dragon"
});

if (!text) {
  ui.notifications.error("Failed to render template - missing tokens");
  return;
}

// Continue with TTS generation
```

---

## Using Templates in Macros

### Boss Kill Macro with TTS

**D&D 5e Example:**
```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target the boss!");
  return;
}

// Generate TTS and display with visuals
await game.toast.showDynamic("boss-kill", {
  killer: token.name,
  boss: target.name
}, [
  {
    type: "text",
    text: "BOSS DEFEATED!",
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
```

### Clutch Heal Macro

**D&D 5e Example:**
```javascript
const healer = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!healer || !target) {
  ui.notifications.warn("Select your healer and target!");
  return;
}

// Check if target is low on HP
const targetHp = target.actor.system.attributes.hp.value;
const targetMaxHp = target.actor.system.attributes.hp.max;

if (targetHp > targetMaxHp * 0.3) {
  ui.notifications.info("Target isn't low enough for clutch heal announcement");
  return;
}

await game.toast.showDynamic("clutch-heal", {
  healer: healer.name,
  target: target.name
});
```

### Triple Kill Macro

**Track Recent Kills:**
```javascript
// Initialize kill tracker if needed
if (!game.toast.recentKills) {
  game.toast.recentKills = [];
}

// Add current kill
const victim = game.user.targets.first();
if (!victim) {
  ui.notifications.warn("Target an enemy!");
  return;
}

game.toast.recentKills.push(victim.name);

// Check for triple kill (within 10 seconds)
if (game.toast.recentKills.length >= 3) {
  await game.toast.showDynamic("triple-kill", {
    player: canvas.tokens.controlled[0].name,
    victim1: game.toast.recentKills[0],
    victim2: game.toast.recentKills[1],
    victim3: game.toast.recentKills[2]
  });

  // Reset tracker
  game.toast.recentKills = [];
}

// Clear old kills after 10 seconds
setTimeout(() => {
  game.toast.recentKills.shift();
}, 10000);
```

### Level Up Macro

**D&D 5e Example:**
```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select your token!");
  return;
}

const level = token.actor.system.details.level;

await game.toast.showDynamic("level-up", {
  player: token.name,
  level: level
}, [
  {
    type: "text",
    text: `LEVEL ${level}!`,
    color: "#FFD700",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 60px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 3
    }
  }
]);
```

### Quest Complete Macro

**Simple Completion:**
```javascript
await game.toast.showDynamic("quest-complete", {
  quest: "The Dragon's Hoard"
}, [
  {
    type: "text",
    text: "QUEST COMPLETE!",
    color: "#00ff00",
    fontSize: "90px",
    animation: {
      startX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 45,
      duration: 3
    }
  }
]);
```

---

## Template Management

### Delete a Template

**Remove Template:**
```javascript
game.toast.templates.delete("my-custom-template");
```

**Warning:** Cannot delete templates while they're being used. Built-in templates can be deleted but will be re-registered on reload.

### Check if Template Exists

**Validate Before Use:**
```javascript
const exists = game.toast.templates.get("boss-kill") !== null;

if (!exists) {
  console.error("Template 'boss-kill' not found!");
}
```

### List Templates by Tag

**Find Related Templates:**
```javascript
// All boss-related templates
const bossTemplates = game.toast.templates.list("boss");

// All heal templates
const healTemplates = game.toast.templates.list("heal");

// All achievement templates
const achievementTemplates = game.toast.templates.list("achievement");

// Display them
healTemplates.forEach(t => {
  console.log(`${t.id}: Tokens = ${t.tokens.join(", ")}`);
});
```

### Register Templates on World Load

**Persist Custom Templates:**
```javascript
// Create a macro that runs on world load
Hooks.once('ready', () => {
  // Register custom templates
  game.toast.templates.register("betrayal", {
    template: "{traitor} has betrayed {victim}! Trust is broken!",
    tags: ["drama", "betrayal"],
    duration: 4
  });

  game.toast.templates.register("last-stand", {
    template: "{hero} makes their final stand against impossible odds!",
    tags: ["hero", "dramatic"],
    duration: 4
  });

  console.log("Custom toast templates registered");
});
```

---

## Cache Management

The TTS system includes built-in caching to minimize API usage and costs.

### How Caching Works

1. Generated audio cached based on text + voice ID
2. Subsequent calls with same text reuse cached audio
3. Cache stored in browser IndexedDB (persists across sessions)
4. Oldest items automatically removed when cache exceeds size limit
5. Each user's cache is independent

### Clear Cache

**Remove All Cached Audio:**
```javascript
await game.toast.cache.clear();
ui.notifications.info("TTS cache cleared");
```

**When to Clear:**
- Changing voice settings
- Testing new pronunciations
- Cache size is too large
- Debugging audio issues

### Check Cache Size

**Get Storage Usage:**
```javascript
const sizeInBytes = await game.toast.cache.getSize();
const sizeMB = (sizeInBytes / 1024 / 1024).toFixed(2);
console.log(`Cache size: ${sizeMB} MB`);
```

### Check Cache Count

**Get Number of Files:**
```javascript
const count = await game.toast.cache.getCount();
console.log(`Cached audio files: ${count}`);
```

### Complete Cache Status

**Monitor Cache:**
```javascript
async function checkCacheStatus() {
  const size = await game.toast.cache.getSize();
  const count = await game.toast.cache.getCount();
  const sizeMB = (size / 1024 / 1024).toFixed(2);

  ui.notifications.info(`Cache: ${count} files, ${sizeMB} MB`);

  // Warn if cache is large
  if (size > 100 * 1024 * 1024) { // > 100 MB
    ui.notifications.warn("Cache is large - consider clearing");
  }
}

checkCacheStatus();
```

### Cache Management Macro

**Clear Cache Button:**
```javascript
// Create a dialog with cache info and clear button
async function manageTTSCache() {
  const size = await game.toast.cache.getSize();
  const count = await game.toast.cache.getCount();
  const sizeMB = (size / 1024 / 1024).toFixed(2);

  new Dialog({
    title: "TTS Cache Manager",
    content: `
      <p><strong>Cached Files:</strong> ${count}</p>
      <p><strong>Cache Size:</strong> ${sizeMB} MB</p>
      <p>Clearing the cache will remove all cached TTS audio. Announcements will need to be regenerated on next use.</p>
    `,
    buttons: {
      clear: {
        label: "Clear Cache",
        callback: async () => {
          await game.toast.cache.clear();
          ui.notifications.info("TTS cache cleared successfully");
        }
      },
      cancel: {
        label: "Cancel"
      }
    }
  }).render(true);
}

manageTTSCache();
```

---

## Best Practices

### Template Design

**1. Keep templates concise**
- 1-2 sentences maximum
- Under 200 characters
- Short announcements are more impactful

```javascript
// Good - concise
"{player} defeats {enemy}!"

// Bad - too long
"{player} engages in combat with {enemy} and after a long battle finally manages to defeat them!"
```

**2. Use descriptive token names**
- `{killer}` not `{p1}`
- `{boss}` not `{e}`
- Clear tokens make templates maintainable

```javascript
// Good
"{killer} defeats {boss}"

// Bad
"{p1} defeats {e1}"
```

**3. Estimate duration accurately**
- Helps system manage audio playback
- ~1 second per 10 words
- Test and adjust

```javascript
game.toast.templates.register("example", {
  template: "Short text",  // ~2 seconds
  duration: 2
});
```

**4. Tag appropriately**
- Makes filtering easier
- Use consistent tag names
- Multiple tags allowed

```javascript
game.toast.templates.register("example", {
  template: "...",
  tags: ["combat", "boss", "victory"]
});
```

**5. Test token combinations**
- Try different values
- Ensure grammar works
- Check for edge cases

```javascript
// Test with different names
game.toast.templates.render("boss-kill", {
  killer: "Alice", boss: "Dragon"
});

game.toast.templates.render("boss-kill", {
  killer: "The Mighty Bob", boss: "Ancient Red Dragon"
});
```

### Cost Optimization

**1. Reuse templates**
- Templates + caching = minimal API usage
- Same text with same voice ID uses cache
- Define templates once, use many times

**2. Set cache size appropriately**
- Default 100MB is usually sufficient
- Increase for heavy usage
- Monitor and adjust

**3. Use shorter announcements**
- ~$0.18 per 1000 characters
- Shorter = cheaper
- More impactful

**4. Monitor API usage**
- Check ElevenLabs dashboard regularly
- Set spending limits
- Track usage patterns

### Performance

**1. Cache management**
- Clear periodically
- Monitor size
- Don't disable caching

**2. Reasonable durations**
- 2-5 seconds ideal
- Very long announcements get old fast
- Short and punchy works best

**3. Limit simultaneous announcements**
- One at a time
- Don't spam toasts
- Space them out

---

## Tips and Tricks

### Template Tokens

**Case-Sensitive:**
```javascript
// These are different tokens
{player}  // lowercase
{Player}  // uppercase
{PLAYER}  // all caps
```

**Allowed Characters:**
- Letters: a-z, A-Z
- Numbers: 0-9
- Hyphens: -
- Underscores: _

```javascript
// Valid
{player-name}
{player_name}
{playerName}
{player1}

// Invalid
{player name}  // space not allowed
{player.name}  // dot not allowed
```

### Extra Tokens Ignored

**Pass More Data:**
```javascript
// Template only uses {killer} and {boss}
game.toast.templates.render("boss-kill", {
  killer: "Bob",
  boss: "Dragon",
  damage: 89,      // ignored
  wasCritical: true // ignored
});

// Extra tokens don't cause errors
```

### Missing Tokens Return Null

**Check Before Using:**
```javascript
const text = game.toast.templates.render("boss-kill", {
  killer: "Bob"
  // Missing: boss
});

if (text === null) {
  console.error("Template render failed");
}
```

### Templates Persist Only During Session

**Re-register on Reload:**
```javascript
// Templates don't persist between reloads
// Register them in a world load script

Hooks.once('ready', () => {
  // Register all custom templates here
  game.toast.templates.register("my-template", {...});
});
```

### Voice Selection

**Choose Appropriate Voices:**
- **Epic moments**: Deep, authoritative voices (Adam, Arnold)
- **Playful moments**: Energetic voices (Josh, Sam)
- **Dramatic moments**: Emotional voices (Elli)
- **Professional**: Clear, neutral voices (Rachel, Antoni)

### Pronunciation Tips

**Common Issues:**
- Names: Test pronunciation first
- Acronyms: Spell out if needed
- Numbers: Use words ("twenty" not "20")
- Symbols: Replace with words

**Example:**
```javascript
// Instead of
template: "{player} deals 89 damage!"

// Try
template: "{player} deals eighty-nine damage!"
```

### Testing Templates

**Test Locally First:**
```javascript
// 1. Render text only
const text = game.toast.templates.render("my-template", {...});
console.log(text);

// 2. Test TTS locally
await game.toast.showDynamic("my-template", {...});

// 3. Verify on all clients
// Have players confirm they hear it correctly
```

### Dynamic Token Values

**Extract from Game State:**
```javascript
const token = canvas.tokens.controlled[0];

await game.toast.showDynamic("level-up", {
  player: token.name,
  level: token.actor.system.details.level  // Dynamic value
});
```

### Conditional Templates

**Choose Template Based on Context:**
```javascript
function getVictoryTemplate(enemyCR) {
  if (enemyCR >= 20) {
    return "boss-kill";  // Epic boss
  } else if (enemyCR >= 10) {
    return "epic-defeat"; // Tough enemy
  } else {
    return "simple-victory"; // Normal enemy
  }
}

const template = getVictoryTemplate(target.actor.system.details.cr);
await game.toast.showDynamic(template, {...});
```

### Multiple Languages

**Register Language Variants:**
```javascript
// English
game.toast.templates.register("boss-kill-en", {
  template: "{killer} strikes the final blow against {boss}!"
});

// Spanish
game.toast.templates.register("boss-kill-es", {
  template: "{killer} asesta el golpe final contra {boss}!"
});

// Use based on setting
const lang = game.settings.get("core", "language");
const templateId = `boss-kill-${lang}`;
```

---

For more information:
- [API-REFERENCE.md](./API-REFERENCE.md) - Complete API documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
