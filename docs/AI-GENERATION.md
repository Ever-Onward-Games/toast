# AI-Generated Announcements Guide

Transform your toast notifications with AI-powered text generation! This guide covers everything you need to know about using Claude and GPT to create dynamic, contextual announcements.

## Table of Contents

- [Overview](#overview)
- [What's Different from Templates](#whats-different-from-templates)
- [Setup Guide](#setup-guide)
- [API Configuration](#api-configuration)
- [Full API Documentation](#full-api-documentation)
- [Usage Examples](#usage-examples)
- [Prompt Engineering Tips](#prompt-engineering-tips)
- [System-Agnostic Design](#system-agnostic-design)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Cost Estimates](#cost-estimates)
- [Best Practices](#best-practices)

---

## Overview

**NEW in v2.0.0!** AI-Generated Announcements use Claude (Anthropic) or GPT (OpenAI) to create unique, contextual text based on your game state instead of fixed templates.

**Key Features:**
- Dynamic text generation based on context
- Supports any game system
- ElevenLabs v3 bracket notation for emotion
- Fallback to templates on failure
- Granular permission controls
- 10-second timeout with retry

**Use Cases:**
- Boss defeat announcements
- Critical hit celebrations
- Epic spell casts
- Character achievements
- Dramatic story moments
- Kill streaks
- Clutch saves

---

## What's Different from Templates

### Template-Based Approach (v1.5.0)

**Fixed Output:**
```javascript
await game.toast.showDynamic("boss-kill", {
  killer: "Alice",
  boss: "Dragon"
});

// Always produces:
// "Alice strikes the final blow against Dragon! Victory is yours!"
```

**Characteristics:**
- ✅ Fast and predictable
- ✅ No API costs
- ✅ Works offline
- ❌ Repetitive over time
- ❌ No contextual awareness
- ❌ Same output every time

### AI-Generated Approach (v2.0.0)

**Dynamic Output:**
```javascript
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator",
  actor: {
    name: "Alice",
    class: "Paladin",
    level: 8,
    weapon: "Holy Avenger"
  },
  target: {
    name: "Ancient Dragon",
    cr: 24
  },
  context: "finishing-blow",
  damageDealt: 89
});

// AI generates unique text each time:
// "With a mighty swing of her Holy Avenger, Paladin Alice delivers
//  a devastating 89 damage blow, bringing the Ancient Dragon
//  crashing down in defeat!"
```

**Characteristics:**
- ✅ Unique every time
- ✅ Context-aware
- ✅ Adapts to game state
- ✅ Natural language
- ❌ Requires API key
- ❌ Small cost per call (~$0.001)
- ❌ Requires internet

### When to Use Each

**Use Templates When:**
- You want consistency
- You need offline support
- You're on a tight budget
- Speed is critical
- Simple token replacement is enough

**Use AI Generation When:**
- You want variety
- Context matters
- Natural language is important
- You can afford API costs (~$0.001/call)
- You want dynamic responses

**Best of Both Worlds:**
Use `fallbackTemplate` parameter to have AI try first, then fall back to template if it fails!

---

## Setup Guide

### Step 1: Get API Keys

You need **two types of keys** for full functionality:

1. **AI Key** (Claude OR OpenAI) - For text generation
2. **ElevenLabs Key** - For converting text to speech

#### Option A: Claude (Anthropic)

**Sign Up:**
1. Visit [anthropic.com](https://www.anthropic.com/)
2. Click "Sign Up" or "Get Started"
3. Complete registration

**Get API Key:**
1. Go to [Anthropic Console - API Keys](https://console.anthropic.com/settings/keys)
2. Click "Create Key"
3. Name it "Foundry-Toast"
4. Copy the key (starts with `sk-ant-...`)
5. Save securely (shown only once)

**Set Spending Limits:**
1. Go to [Anthropic Console - Limits](https://console.anthropic.com/settings/limits)
2. Set Monthly Budget (recommended: $5-10)
3. Enable usage alerts (50%, 80%, 100%)
4. Save settings

**Pricing:**
- Free tier: Limited credits
- Pay-as-you-go after free credits
- Claude 3.5 Sonnet: ~$0.001/announcement
- Claude 3.5 Haiku: ~$0.0001/announcement

#### Option B: OpenAI

**Sign Up:**
1. Visit [platform.openai.com](https://platform.openai.com/)
2. Click "Sign up"
3. Complete registration

**Get API Key:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name it "Foundry-Toast"
4. Copy the key (starts with `sk-...`)
5. Save securely (shown only once)

**Set Spending Limits:**
1. Go to [OpenAI Account Limits](https://platform.openai.com/account/limits)
2. Set Monthly Budget (recommended: $5-10)
3. Enable usage alerts
4. Save settings

**Pricing:**
- Free tier: $5 in trial credits
- GPT-4o: ~$0.0015/announcement
- GPT-3.5 Turbo: ~$0.0001/announcement

#### ElevenLabs (For Text-to-Speech)

**Sign Up:**
1. Visit [elevenlabs.io](https://elevenlabs.io)
2. Click "Get Started Free"
3. Complete registration

**Get API Key:**
1. Click your profile picture
2. Go to "Profile"
3. Find your API key
4. Copy and save

**Pricing:**
- Free tier: 10,000 characters/month
- ~$0.027 per announcement (~150 chars)
- Paid tiers: $5-$22/month

### Step 2: Configure Module Settings

#### World Settings (GM Manages Keys)

**Recommended for:**
- Small trusted groups
- GM wants to control costs
- Players without API keys

**Configuration:**
1. Open **Module Settings** → **Toast - Full Screen Celebrations**

2. **Enable AI Text Generation** ✅

3. **Select AI Provider:**
   - Claude (Anthropic) - Recommended
   - OpenAI

4. **Enter API Key:**
   - For Claude: **Claude API Key (GM)**
   - For OpenAI: **OpenAI API Key (GM)**
   - ⚠️ See [Security Guide](SECURITY.md) for best practices

5. **Configure Key Sharing** - Who can use your keys:
   - **None (GM Only)** - Only you pay (most secure)
   - **All Players** - Everyone can use your keys
   - **By Role** - Only certain roles
   - **By Username** - Specific usernames only

6. **Select AI Model:**
   - **Claude 3.5 Sonnet** - Best quality, ~$0.001/call
   - **Claude 3.5 Haiku** - Faster, cheaper, ~$0.0001/call
   - **GPT-4o** - OpenAI's best, ~$0.0015/call
   - **GPT-3.5 Turbo** - Cheaper, ~$0.0001/call

7. **Adjust Temperature:** (0-1)
   - **0.7** - Balanced (recommended)
   - Lower (0.3-0.5) - More consistent
   - Higher (0.8-1.0) - More creative/varied

8. **Configure ElevenLabs:**
   - Enter **ElevenLabs API Key**
   - Select **Voice ID** (default: Rachel)
   - Browse voices: [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)

#### Client Settings (Players Use Own Keys)

**Recommended for:**
- Players who want to pay for themselves
- Public games
- High security needs

**Configuration:**
1. Open **Module Settings** → **Toast - Full Screen Celebrations**

2. **Enable "Use Own AI API Keys"** ✅

3. **Select AI Provider:**
   - Claude (Anthropic)
   - OpenAI

4. **Enter Your API Key:**
   - Your personal API key
   - You pay for your usage

5. **Configure OpenAI Mode** (if using OpenAI):
   - **Standard** - Regular OpenAI API
   - **Custom GPT** - Use a custom GPT
   - **Fine-tuned** - Use a fine-tuned model

6. **Configure ElevenLabs:**
   - Enter your **ElevenLabs API Key**
   - Select your preferred **Voice ID**

### Step 3: Test Configuration

Run this test macro:

```javascript
await game.toast.showDynamicAI({
  prompt: "Announce this as an epic narrator",
  actor: { name: "TestHero" },
  target: { name: "TestMonster" },
  context: "test",
  elements: [
    {
      type: "text",
      text: "AI TEST!",
      color: "#00ff00",
      fontSize: "80px",
      animation: {
        startX: window.innerWidth / 2 - 200,
        startY: window.innerHeight / 2 - 40,
        duration: 2
      }
    }
  ]
});
```

**Expected Result:**
1. Status window shows "Generating announcement..."
2. AI generates unique text (1-3 seconds)
3. ElevenLabs converts to speech
4. Everyone hears the announcement
5. Green "AI TEST!" text displays

---

## API Configuration

### Permission System

AI generation has two permission layers:

**Layer 1: Toast Permission**
- Controls who can trigger toasts at all
- Configured in: **Module Settings** → **Permission Mode**

**Layer 2: AI Key Access**
- Controls who can use AI generation
- Configured in: **Share AI Keys With**

**Both must be satisfied** to use AI generation.

### Key Sharing Options

#### None (GM Only)
```
Who can use: Only GM
Who pays: GM
Security: Highest
Use case: GM-only special moments
```

#### All Players
```
Who can use: Everyone
Who pays: GM
Security: Lowest
Use case: Trusted friend groups
```

#### By Role
```
Who can use: Selected roles (Player, Trusted, Assistant GM, GM)
Who pays: GM
Security: Medium
Use case: Give trusted players access
```

#### By Username
```
Who can use: Comma-separated usernames (e.g., "alice, bob")
Who pays: GM
Security: Medium-High
Use case: Specific known players
```

### Hybrid Configuration

**Best of both worlds:**

1. GM enables AI and sets **Share AI Keys With: None (GM Only)**
2. Players enable **Use Own AI API Keys**

**Result:**
- GM can use their keys
- Players can use their own keys
- Everyone pays for themselves
- Maximum security

---

## Full API Documentation

### `game.toast.showDynamicAI(config)`

Generate AI text, convert to TTS, and show toast to all players.

#### Parameters

**config** (Object) - Configuration object:

```javascript
{
  // REQUIRED: Tone/style prompt for AI
  prompt: string,

  // OPTIONAL: User-defined context (any structure)
  actor: Object,
  target: Object,
  context: string,

  // OPTIONAL: Additional data (any fields you want)
  damageDealt: number,
  abilityUsed: string,
  wasCritical: boolean,
  location: string,
  // ... any other fields

  // OPTIONAL: Visual elements to display
  elements: Array,

  // OPTIONAL: Fallback template if AI fails
  fallbackTemplate: string
}
```

#### Complete Example

```javascript
await game.toast.showDynamicAI({
  // Required: Style/tone prompt
  prompt: "[triumphant] Epic fantasy narrator with gravitas",

  // Optional: Actor context
  actor: {
    name: "Alice",
    class: "Paladin",
    level: 8,
    hp: 45,
    maxHp: 68,
    weapon: "Holy Avenger",
    // Add any custom fields!
    favoriteColor: "Blue"
  },

  // Optional: Target context
  target: {
    name: "Ancient Dragon",
    type: "Dragon",
    cr: 24,
    description: "Terrorizing the village"
  },

  // Optional: What happened
  context: "finishing-blow",

  // Optional: Additional context
  damageDealt: 89,
  abilityUsed: "Divine Smite",
  wasCritical: true,
  location: "Dragon's mountain lair",
  partyMembers: ["Alice", "Bob", "Charlie"],

  // Optional: Visual elements
  elements: [
    {
      type: "text",
      text: "BOSS DEFEATED!",
      color: "#FFD700",
      fontSize: "100px",
      animation: {
        startX: window.innerWidth / 2 - 300,
        startY: window.innerHeight / 2 - 50,
        duration: 3
      }
    }
  ],

  // Optional: Fallback template
  fallbackTemplate: "boss-kill"
});
```

#### Returns

**Promise** - Resolves when complete, rejects on error

#### Requirements

- AI generation enabled in settings
- Valid AI API key (user's or GM's shared)
- Valid ElevenLabs API key for TTS
- User has permission

#### Features

- **10-second timeout** with retry option
- **Status window** for user feedback
- **Automatic fallback** to template on failure
- **Supports ElevenLabs v3 bracket notation** for emotion

---

## Usage Examples
## Basic Examples

### Example 1: Simple Boss Kill

```javascript
// Minimal example with just actor and target names
await game.toast.showDynamicAI({
  prompt: "Announce this as an epic fantasy narrator",
  actor: { name: "Alice" },
  target: { name: "Dragon" },
  context: "boss-kill"
});
```

**Expected Output:**
> "Alice has struck down the mighty Dragon in an epic battle!"

---

### Example 2: Boss Kill with Visuals

```javascript
// Add visual elements to accompany the AI announcement
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator with gravitas",
  actor: { name: "Alice" },
  target: { name: "Ancient Dragon" },
  context: "finishing-blow",
  elements: [
    {
      type: "text",
      text: "BOSS DEFEATED!",
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
  ]
});
```

**Expected Output:**
> "[Triumphant tone] With a mighty blow, Alice has vanquished the Ancient Dragon!"
> (Plus golden "BOSS DEFEATED!" text on screen)

---

### Example 3: Different Tone Styles

```javascript
// Epic Fantasy Narrator
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator describing a heroic victory",
  actor: { name: "Bob" },
  target: { name: "Lich King" },
  context: "boss-kill"
});

// Sports Announcer
await game.toast.showDynamicAI({
  prompt: "[excited] Sports commentator calling the game-winning moment",
  actor: { name: "Bob" },
  target: { name: "Lich King" },
  context: "boss-kill"
});

// Poetic Bard
await game.toast.showDynamicAI({
  prompt: "[gentle] Poetic bard singing about this heroic deed",
  actor: { name: "Bob" },
  target: { name: "Lich King" },
  context: "boss-kill"
});

// Gritty Noir Detective
await game.toast.showDynamicAI({
  prompt: "[low] Gritty noir detective narrating this brutal takedown",
  actor: { name: "Bob" },
  target: { name: "Lich King" },
  context: "boss-kill"
});
```

---

## D&D 5e Examples

### Example 4: Boss Kill (D&D 5e)

```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target the boss!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator with dramatic flair",
  actor: {
    name: token.name,
    class: token.actor.system.details.class,
    level: token.actor.system.details.level,
    race: token.actor.system.details.race
  },
  target: {
    name: target.name,
    type: target.actor.system.details.type,
    cr: target.actor.system.details.cr
  },
  context: "finishing-blow",
  elements: [
    {
      type: "tokenImage",
      tokenId: token.id,
      width: "300px",
      height: "300px",
      animation: {
        startX: window.innerWidth / 2 - 150,
        startY: window.innerHeight / 2 - 150,
        duration: 3
      }
    },
    {
      type: "text",
      text: "BOSS DEFEATED!",
      color: "#FFD700",
      fontSize: "80px",
      fontWeight: "bold",
      textShadow: "0 0 50px #FFD700",
      animation: {
        startX: window.innerWidth / 2 - 350,
        startY: window.innerHeight / 2 + 200,
        duration: 3
      }
    }
  ],
  fallbackTemplate: "boss-kill"
});
```

**Expected Output:**
> "The level 8 Human Paladin Alice delivers the final strike against the CR 24 Ancient Dragon, ending its reign of terror!"

---

### Example 5: Critical Hit (D&D 5e)

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select your token!");
  return;
}

// Get last damage roll from chat
const lastRoll = game.messages.contents[game.messages.size - 1];
const damage = lastRoll?.rolls?.[0]?.total || 0;

await game.toast.showDynamicAI({
  prompt: "[excited] Announce this critical hit with high energy!",
  actor: {
    name: token.name,
    class: token.actor.system.details.class,
    level: token.actor.system.details.level
  },
  context: "critical-hit",
  damageDealt: damage,
  wasCritical: true,
  elements: [
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
  ]
});
```

**Expected Output:**
> "[Excited] Incredible! Alice the Paladin scores a devastating critical hit, dealing 42 damage!"

---

### Example 6: Clutch Heal (D&D 5e)

```javascript
const healer = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!healer || !target) {
  ui.notifications.warn("Select your healer and target!");
  return;
}

const targetHP = target.actor.system.attributes.hp.value;
const targetMaxHP = target.actor.system.attributes.hp.max;
const hpPercent = Math.round((targetHP / targetMaxHP) * 100);

await game.toast.showDynamicAI({
  prompt: "[gentle] Announce this life-saving heal with warmth and relief",
  healer: {
    name: healer.name,
    class: healer.actor.system.details.class
  },
  target: {
    name: target.name,
    currentHP: targetHP,
    maxHP: targetMaxHP,
    percentHP: hpPercent
  },
  context: "clutch-heal",
  elements: [
    {
      type: "text",
      text: "LIFE SAVER!",
      color: "#00ff00",
      fontSize: "80px",
      fontWeight: "bold",
      textShadow: "0 0 40px #00ff00",
      animation: {
        startX: window.innerWidth / 2 - 250,
        startY: window.innerHeight / 2 - 40,
        duration: 2.5
      }
    }
  ],
  fallbackTemplate: "clutch-heal"
});
```

**Expected Output:**
> "[Gentle, relieved tone] Bob the Cleric reaches Alice at the brink, with only 15% health remaining, and channels divine energy to pull her back from death's door!"

---

### Example 7: Spell Cast with Dramatic Effect (D&D 5e)

```javascript
const caster = canvas.tokens.controlled[0];

if (!caster) {
  ui.notifications.warn("Select your spellcaster!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[mystical] Describe this powerful spell being cast with arcane energy",
  caster: {
    name: caster.name,
    class: caster.actor.system.details.class,
    level: caster.actor.system.details.level
  },
  spell: {
    name: "Meteor Swarm",
    level: 9,
    school: "Evocation"
  },
  context: "spell-cast",
  elements: [
    {
      type: "text",
      text: "METEOR SWARM!",
      color: "#ff6600",
      fontSize: "90px",
      fontWeight: "bold",
      textShadow: "0 0 50px #ff6600",
      animation: {
        startX: window.innerWidth / 2 - 350,
        startY: window.innerHeight / 2 - 45,
        duration: 2.5
      }
    }
  ]
});
```

**Expected Output:**
> "[Mystical tone] Gandalf the level 20 Wizard raises his staff and unleashes Meteor Swarm, a devastating 9th-level evocation spell, raining fiery destruction from the heavens!"

---

## Pathfinder 2e Examples

### Example 8: Boss Kill (Pathfinder 2e)

```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator",
  actor: {
    name: token.name,
    class: token.actor.system.details.class.value,
    level: token.actor.system.details.level.value,
    ancestry: token.actor.system.details.ancestry.value
  },
  target: {
    name: target.name,
    level: target.actor.system.details.level.value,
    type: target.actor.system.details.creatureType
  },
  context: "boss-kill",
  elements: [
    {
      type: "text",
      text: "VICTORY!",
      color: "#FFD700",
      fontSize: "100px",
      fontWeight: "bold",
      textShadow: "0 0 50px #FFD700",
      animation: {
        startX: window.innerWidth / 2 - 200,
        startY: window.innerHeight / 2 - 50,
        duration: 3
      }
    }
  ],
  fallbackTemplate: "boss-kill"
});
```

**Expected Output:**
> "Valeros, the level 12 Human Fighter, delivers the finishing blow against the level 15 Dragon, securing victory!"

---

### Example 9: Critical Success (Pathfinder 2e)

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select your token!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[excited] Announce this critical success with enthusiasm!",
  actor: {
    name: token.name,
    class: token.actor.system.details.class.value,
    level: token.actor.system.details.level.value
  },
  context: "critical-success",
  degree: "critical success",
  action: "Strike",
  elements: [
    {
      type: "text",
      text: "CRITICAL SUCCESS!",
      color: "#00ff00",
      fontSize: "90px",
      fontWeight: "bold",
      textShadow: "0 0 40px #00ff00",
      animation: {
        startX: window.innerWidth / 2 - 380,
        startY: window.innerHeight / 2 - 45,
        duration: 2
      }
    }
  ]
});
```

**Expected Output:**
> "[Excited] Incredible! Seoni achieves a critical success on her Strike, far exceeding expectations!"

---

## Custom System Examples

### Example 10: Homebrew System

```javascript
// Custom homebrew system with unique properties
await game.toast.showDynamicAI({
  prompt: "[triumphant] Announce this victory with epic fantasy style",
  actor: {
    name: "Lyra Starshadow",
    faction: "The Silver Ravens",
    rank: "Captain",
    "signature weapon": "Starblade",
    backstory: "Former royal guard seeking redemption"
  },
  target: {
    name: "The Void Leviathan",
    threat_level: "Catastrophic",
    description: "Ancient entity from beyond the stars"
  },
  context: "world-saving-blow",
  location: "The Celestial Observatory",
  witnessCount: "hundreds of citizens",
  elements: [
    {
      type: "text",
      text: "THE WORLD IS SAVED!",
      color: "#00ffff",
      fontSize: "80px",
      fontWeight: "bold",
      textShadow: "0 0 50px #00ffff",
      animation: {
        startX: window.innerWidth / 2 - 400,
        startY: window.innerHeight / 2 - 40,
        duration: 3
      }
    }
  ]
});
```

**Expected Output:**
> "Captain Lyra Starshadow of the Silver Ravens, wielding her legendary Starblade, strikes the final blow against The Void Leviathan at the Celestial Observatory, witnessed by hundreds of citizens. The world is saved!"

---

### Example 11: Sci-Fi System

```javascript
// Space opera / sci-fi game
await game.toast.showDynamicAI({
  prompt: "[dramatic] Sci-fi computer AI announcing mission success",
  pilot: {
    name: "Commander Zhang",
    rank: "Commander",
    ship: "USS Reliant",
    shipClass: "Destroyer"
  },
  target: {
    name: "Dreadnought Nemesis",
    faction: "Borg Collective",
    shieldStatus: "destroyed"
  },
  context: "capital-ship-destroyed",
  weaponUsed: "Photon Torpedoes",
  elements: [
    {
      type: "text",
      text: "TARGET DESTROYED",
      color: "#00ff00",
      fontSize: "90px",
      fontFamily: "Courier New, monospace",
      fontWeight: "bold",
      textShadow: "0 0 30px #00ff00",
      animation: {
        startX: window.innerWidth / 2 - 400,
        startY: window.innerHeight / 2 - 45,
        duration: 2.5
      }
    }
  ]
});
```

**Expected Output:**
> "[Computer AI voice] Commander Zhang, piloting the USS Reliant Destroyer, has successfully destroyed the Dreadnought Nemesis of the Borg Collective using Photon Torpedoes. Target neutralized."

---

## Advanced Examples

### Example 12: With Fallback Template

```javascript
// If AI generation fails, fall back to a template
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic narrator",
  actor: { name: "Alice" },
  target: { name: "Dragon" },
  context: "boss-kill",
  elements: [
    {
      type: "text",
      text: "VICTORY!",
      color: "#FFD700",
      fontSize: "100px",
      animation: {
        startX: window.innerWidth / 2 - 200,
        startY: window.innerHeight / 2 - 50,
        duration: 3
      }
    }
  ],
  // This template will be used if AI generation fails
  fallbackTemplate: "boss-kill"
});
```

---

### Example 13: Rich Context with Chat History

```javascript
// Include recent chat history for context-aware generation
const recentMessages = game.messages.contents
  .slice(-5)
  .map(m => ({ speaker: m.speaker.alias, text: m.content }));

const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target!");
  return;
}

await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic narrator referencing the intense battle",
  actor: {
    name: token.name,
    class: token.actor.system.details.class,
    level: token.actor.system.details.level
  },
  target: {
    name: target.name,
    type: target.actor.system.details.type
  },
  context: "boss-kill-after-long-battle",
  recentChatHistory: recentMessages,
  battleDuration: "3 rounds",
  elements: [
    {
      type: "text",
      text: "FINALLY DEFEATED!",
      color: "#FFD700",
      fontSize: "80px",
      fontWeight: "bold",
      textShadow: "0 0 50px #FFD700",
      animation: {
        startX: window.innerWidth / 2 - 380,
        startY: window.innerHeight / 2 - 40,
        duration: 3
      }
    }
  ]
});
```

**Expected Output:**
> "After a grueling 3-round battle, Alice the Paladin finally brings down the Ancient Dragon with a decisive blow!"

---

### Example 14: Conditional Prompts Based on Damage

```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target!");
  return;
}

const damage = 85; // Get from roll

let prompt;
let visualColor;
let visualText;

if (damage > 100) {
  prompt = "[explosive] Announce this MASSIVE damage with shock and awe!";
  visualColor = "#ff0000";
  visualText = "DEVASTATING BLOW!";
} else if (damage > 50) {
  prompt = "[excited] Announce this heavy hit with energy!";
  visualColor = "#ff6600";
  visualText = "HEAVY HIT!";
} else {
  prompt = "[steady] Announce this solid strike";
  visualColor = "#ffff00";
  visualText = "SOLID HIT!";
}

await game.toast.showDynamicAI({
  prompt: prompt,
  actor: { name: token.name },
  target: { name: target.name },
  damageDealt: damage,
  context: "damage-dealt",
  elements: [
    {
      type: "text",
      text: visualText,
      color: visualColor,
      fontSize: "90px",
      fontWeight: "bold",
      textShadow: `0 0 40px ${visualColor}`,
      animation: {
        startX: window.innerWidth / 2 - 300,
        startY: window.innerHeight / 2 - 45,
        duration: 2
      }
    }
  ]
});
```

---

### Example 15: Team Victory

```javascript
// Multiple party members contributed
const party = canvas.tokens.controlled;

if (party.length === 0) {
  ui.notifications.warn("Select party tokens!");
  return;
}

const partyData = party.map(t => ({
  name: t.name,
  class: t.actor.system.details.class,
  contribution: "dealt massive damage" // Customize per member
}));

await game.toast.showDynamicAI({
  prompt: "[triumphant] Announce this team victory celebrating everyone's contribution",
  party: partyData,
  target: { name: "The Lich King" },
  context: "team-boss-kill",
  elements: [
    {
      type: "text",
      text: "TEAM VICTORY!",
      color: "#FFD700",
      fontSize: "90px",
      fontWeight: "bold",
      textShadow: "0 0 50px #FFD700",
      animation: {
        startX: window.innerWidth / 2 - 300,
        startY: window.innerHeight / 2 - 45,
        duration: 3
      }
    }
  ]
});
```

**Expected Output:**
> "Together, Alice the Paladin, Bob the Wizard, and Charlie the Rogue combined their strengths to bring down The Lich King in an epic team effort!"

---

## Error Handling

### Example 16: Basic Error Handling

```javascript
try {
  await game.toast.showDynamicAI({
    prompt: "[triumphant] Epic narrator",
    actor: { name: "Alice" },
    target: { name: "Dragon" },
    context: "boss-kill",
    fallbackTemplate: "boss-kill" // Will be used if AI fails
  });
} catch (error) {
  console.error("Toast failed:", error);
  ui.notifications.error("Failed to generate announcement");
}
```

---

### Example 17: Checking Permissions First

```javascript
// Check if user has permission before attempting
if (!game.toast.hasPermission()) {
  ui.notifications.warn("You don't have permission to trigger toasts");
  return;
}

// Check if AI generation is enabled
const aiEnabled = game.settings.get("toast", "ai-generation-enabled");
if (!aiEnabled) {
  ui.notifications.warn("AI text generation is not enabled. Ask your GM to enable it.");
  return;
}

// Proceed with toast
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic narrator",
  actor: { name: "Alice" },
  target: { name: "Dragon" },
  context: "boss-kill"
});
```

---

### Example 18: Graceful Degradation

```javascript
const token = canvas.tokens.controlled[0];
const target = game.user.targets.first();

if (!token || !target) {
  ui.notifications.warn("Select your token and target!");
  return;
}

// Try AI generation, but always fall back to template
await game.toast.showDynamicAI({
  prompt: "[triumphant] Epic fantasy narrator",
  actor: {
    name: token.name,
    class: token.actor.system?.details?.class || "Unknown",
    level: token.actor.system?.details?.level || 1
  },
  target: {
    name: target.name,
    type: target.actor.system?.details?.type || "Enemy"
  },
  context: "boss-kill",
  elements: [
    {
      type: "text",
      text: "VICTORY!",
      color: "#FFD700",
      fontSize: "100px",
      animation: {
        startX: window.innerWidth / 2 - 200,
        startY: window.innerHeight / 2 - 50,
        duration: 3
      }
    }
  ],
  // Fallback to template if AI generation fails
  fallbackTemplate: "boss-kill"
});
```

---

## Tips for Writing Prompts

### Tone Control with ElevenLabs v3

Use brackets to control tone:
- `[angry]` - Angry, frustrated
- `[curious]` - Inquisitive, wondering
- `[excited]` - High energy, enthusiastic
- `[gentle]` - Soft, warm
- `[low]` - Deep, serious
- `[mystical]` - Mysterious, magical
- `[triumphant]` - Victorious, celebratory

### Be Specific

**❌ Vague:**
```javascript
prompt: "Say something"
```

**✅ Specific:**
```javascript
prompt: "[triumphant] Announce this as an epic fantasy narrator describing a heroic moment"
```

### Set the Scene

Include context in your prompt:
```javascript
prompt: "[excited] Sports commentator announcing the game-winning goal in overtime"
prompt: "[gentle] Poetic bard singing about this merciful act of kindness"
prompt: "[low] Gritty noir detective narrating a brutal takedown in a dark alley"
```

### Keep It Concise

The AI will generate 1-3 sentences. Don't ask for too much:

**❌ Too much:**
```javascript
prompt: "Write a 10 paragraph epic poem about this victory, including the character's entire backstory, the history of the weapon, and prophecies about the future"
```

**✅ Just right:**
```javascript
prompt: "[triumphant] Epic narrator describing this decisive victory"
```

---

## Cost Estimates

**Per announcement (AI + TTS):**
- Claude 3.5 Sonnet: ~$0.001 + $0.027 = ~$0.028
- GPT-4o: ~$0.0015 + $0.027 = ~$0.029
- Claude 3.5 Haiku: ~$0.0001 + $0.027 = ~$0.027

**For 100 announcements:**
- Total cost: ~$2.70 - $2.90

Set spending limits on your API keys to control costs!

---

## Need Help?

- Check the [README.md](README.md) for full documentation
- See [CHANGELOG.md](CHANGELOG.md) for version history

---

## Prompt Engineering Tips

### Use ElevenLabs v3 Bracket Notation

Control the emotional tone of the voice:

```javascript
// Angry/aggressive
prompt: "[angry] Describe this betrayal with righteous fury"

// Gentle/soft
prompt: "[gentle] Speak softly about this merciful act"

// Excited/energetic
prompt: "[excited] Sports commentator announcing the winning goal!"

// Triumphant/epic
prompt: "[triumphant] Epic victory with gravitas"

// Sad/somber
prompt: "[sad] Mourn this fallen hero"

// Mysterious
prompt: "[mysterious] Whisper about this dark secret"
```

### Be Specific

**❌ Vague:**
```javascript
prompt: "Say something cool"
```

**✅ Specific:**
```javascript
prompt: "Speak as an epic fantasy narrator describing a heroic moment"
```

### Set the Tone

Different narrator styles:

```javascript
// Fantasy
prompt: "Epic fantasy narrator with gravitas and drama"

// Sports
prompt: "Hype sports announcer calling the game-winning play"

// Poetic
prompt: "Poetic bard singing about this merciful act"

// Gritty
prompt: "Gritty noir detective narrating a betrayal"

// Comedic
prompt: "Sarcastic narrator making light of this fumble"

// Dramatic
prompt: "Theatrical Shakespeare-style narrator"

// Scientific
prompt: "Clinical scientist documenting this specimen"

// Dark
prompt: "Sinister villain gloating about this defeat"
```

### Combine Emotion + Style

Get the best of both:

```javascript
prompt: "[triumphant] Epic fantasy narrator celebrating this legendary victory"
prompt: "[angry] Gritty detective exposing this betrayal"
prompt: "[excited] Sports commentator with over-the-top enthusiasm"
prompt: "[gentle] Compassionate healer describing this act of mercy"
```

### Context-Specific Prompts

Tailor to situation:

```javascript
// Boss fights
prompt: "[triumphant] Announce this boss defeat like a legendary achievement"

// Critical hits
prompt: "[excited] High-energy announcer hyping this incredible strike"

// Clutch heals
prompt: "[relieved] Dramatic narrator describing this life-saving moment"

// Betrayals
prompt: "[shocked] Stunned narrator revealing this unexpected betrayal"

// Epic fails
prompt: "[sympathetic] Compassionate narrator consoling this unfortunate mishap"
```

### Length Control

Influence output length:

```javascript
// Short and punchy
prompt: "[excited] Announce this briefly and energetically"

// Detailed
prompt: "[triumphant] Provide a detailed, epic narration of this victory"

// Medium (default)
prompt: "[triumphant] Announce this epic victory"
```

---

## System-Agnostic Design

AI-Generated Announcements work with **any game system** because you define what data matters!

### D&D 5e Example

```javascript
actor: {
  name: token.name,
  class: token.actor.system.details.class,
  level: token.actor.system.details.level,
  race: token.actor.system.details.race
}
```

### Pathfinder 2e Example

```javascript
actor: {
  name: token.name,
  class: token.actor.system.details.class.value,
  level: token.actor.system.details.level.value,
  ancestry: token.actor.system.details.ancestry.value
}
```

### Call of Cthulhu Example

```javascript
actor: {
  name: token.name,
  occupation: token.actor.system.details.occupation,
  sanity: token.actor.system.attributes.sanity.value,
  sanityMax: token.actor.system.attributes.sanity.max
}
```

### Cyberpunk RED Example

```javascript
actor: {
  name: token.name,
  role: token.actor.system.details.role,
  reputation: token.actor.system.reputation,
  cyberware: token.actor.system.cyberware
}
```

### Custom Homebrew Example

```javascript
actor: {
  name: "Alice",
  faction: "The Silver Ravens",
  backstory: "Orphaned princess seeking revenge",
  secret: "Actually a dragon in disguise",
  powerLevel: 9000
}
```

**The AI figures out what matters from your structured data!**

---

## How It Works

### Execution Flow

1. **User triggers macro**
   - Calls `game.toast.showDynamicAI(config)`

2. **Permission checks**
   - Validates toast permission
   - Validates AI key access

3. **Status window displays**
   - Shows "Generating announcement..." to user
   - Provides visual feedback

4. **AI generation request**
   - Sends context to Claude or GPT
   - 10-second timeout protection
   - Retry option on timeout

5. **Text generation**
   - AI analyzes context
   - Generates unique text (1-3 seconds)
   - Returns generated text

6. **TTS conversion**
   - ElevenLabs converts text to speech
   - Applies voice and emotion settings
   - Returns audio data

7. **Broadcast to players**
   - GM validates request
   - Broadcasts to all connected clients
   - Includes audio and visual elements

8. **Synchronized playback**
   - All players hear announcement
   - Visual elements display
   - Perfect synchronization

### Behind the Scenes

**AI Context Construction:**
```json
{
  "prompt": "[triumphant] Epic narrator",
  "context": {
    "actor": {"name": "Alice", "class": "Paladin"},
    "target": {"name": "Dragon", "cr": 24},
    "situation": "finishing-blow",
    "damage": 89
  }
}
```

**AI Response:**
```json
{
  "text": "With a mighty swing, Paladin Alice delivers a devastating 89 damage blow, bringing the Ancient Dragon crashing down!"
}
```

**TTS Processing:**
- Text parsed for ElevenLabs v3 bracket notation
- Voice ID and settings applied
- Audio generated and cached
- Audio blob returned

**Broadcast:**
- Audio + elements sent to all players
- GM validates and forwards
- All clients play synchronized

### Caching System

**TTS Cache:**
- Generated audio cached in IndexedDB
- Cache key: text + voice ID + settings
- Subsequent calls reuse cached audio
- Reduces API costs and latency

**Cache Management:**
```javascript
// Check cache
const size = await game.toast.cache.getSize();
const count = await game.toast.cache.getCount();

// Clear cache
await game.toast.cache.clear();
```

---

## Troubleshooting

### "No AI API key configured"

**Problem:** No valid API key found.

**Solutions:**
1. **Check settings:**
   - Go to **Module Settings** → **Toast**
   - Verify API key is entered correctly

2. **For GMs:**
   - Ensure world-level key is configured
   - Check **AI Provider** matches your key type

3. **For Players:**
   - Enable **Use Own AI API Keys**
   - Enter your personal API key
   - OR ask GM to share their keys

### "AI text generation is not enabled"

**Problem:** GM hasn't enabled AI feature.

**Solutions:**
1. **GMs:**
   - Go to **Module Settings** → **Toast**
   - Enable **AI Text Generation** checkbox

2. **Players:**
   - Ask GM to enable AI generation
   - OR enable **Use Own AI API Keys**

### Request Timed Out

**Problem:** API took longer than 10 seconds.

**Solutions:**
1. **Click "Retry"** in status window
2. **Click "Fallback to Template"** if available
3. **Check internet connection**
4. **Check API service status:**
   - [Anthropic Status](https://status.anthropic.com/)
   - [OpenAI Status](https://status.openai.com/)

### API Error Messages

**Problem:** Various API errors.

**Common Errors:**

**401 Unauthorized:**
- API key is invalid
- Regenerate key in provider dashboard
- Update Foundry settings

**429 Rate Limited:**
- Too many requests
- Wait a few minutes
- Check if spending limit exceeded

**500 Server Error:**
- API provider having issues
- Check status page
- Wait and retry

**Insufficient Credits:**
- API account out of credits
- Add payment method
- Check billing dashboard

### Poor AI Output Quality

**Problem:** AI generates unhelpful or off-topic text.

**Solutions:**
1. **Improve prompt:**
   - Be more specific about tone/style
   - Use ElevenLabs bracket notation
   - Provide better context

2. **Provide more context:**
   - Add more actor/target details
   - Include situation description
   - Add relevant game state

3. **Adjust temperature:**
   - Lower (0.3-0.5) for consistency
   - Higher (0.8-1.0) for creativity

4. **Try different model:**
   - Claude 3.5 Sonnet (better quality)
   - GPT-4o (different style)

### TTS Sounds Wrong

**Problem:** Generated speech has wrong tone/emotion.

**Solutions:**
1. **Use bracket notation:**
   ```javascript
   prompt: "[triumphant] Announce this victory"
   ```

2. **Try different voice:**
   - Browse [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
   - Test different voice IDs

3. **Adjust AI prompt:**
   - Be more specific about desired tone
   - Describe the emotion clearly

### Permission Denied

**Problem:** "You don't have permission" error.

**Solutions:**
1. **Check toast permissions:**
   - GM: **Module Settings** → **Permission Mode**

2. **Check AI key sharing:**
   - GM: **Share AI Keys With**
   - Must allow your role/username

3. **Use own keys:**
   - Enable **Use Own AI API Keys**
   - Enter your personal API key

---

## Cost Estimates

### AI Generation Costs

**Claude (Anthropic):**

| Model | Cost per Announcement | 100 Announcements |
|-------|----------------------|-------------------|
| Claude 3.5 Sonnet | ~$0.001 | ~$0.10 |
| Claude 3.5 Haiku | ~$0.0001 | ~$0.01 |

**OpenAI:**

| Model | Cost per Announcement | 100 Announcements |
|-------|----------------------|-------------------|
| GPT-4o | ~$0.0015 | ~$0.15 |
| GPT-3.5 Turbo | ~$0.0001 | ~$0.01 |

### TTS Costs

**ElevenLabs:**

| Metric | Cost |
|--------|------|
| Per 1000 characters | ~$0.18 |
| Per announcement (~150 chars) | ~$0.027 |
| 100 announcements | ~$2.70 |

### Total Costs (AI + TTS)

**For 100 announcements:**

| Combination | Total Cost |
|-------------|-----------|
| Claude Sonnet + ElevenLabs | ~$2.80 |
| Claude Haiku + ElevenLabs | ~$2.71 |
| GPT-4o + ElevenLabs | ~$2.85 |
| GPT-3.5 + ElevenLabs | ~$2.71 |

### Usage Scenarios

**Light Use** (5 announcements/session, weekly):
- ~20 announcements/month
- ~$0.56/month (Claude Sonnet + ElevenLabs)

**Moderate Use** (15 announcements/session, weekly):
- ~60 announcements/month
- ~$1.68/month (Claude Sonnet + ElevenLabs)

**Heavy Use** (30 announcements/session, weekly):
- ~120 announcements/month
- ~$3.36/month (Claude Sonnet + ElevenLabs)

### Cost Saving Tips

1. **Use caching:**
   - Generated TTS is cached
   - Reusing same text is free

2. **Use cheaper models:**
   - Claude Haiku instead of Sonnet
   - GPT-3.5 instead of GPT-4o

3. **Mix with templates:**
   - Use AI for special moments
   - Use templates for repetitive events

4. **Set spending limits:**
   - Prevent runaway costs
   - Get alerts before limit

5. **Share costs:**
   - Players use own keys
   - Or GM shares with trusted group

---

## Best Practices

### Prompt Design

1. **Start with emotion:** `[triumphant]`
2. **Add narrator style:** "Epic fantasy narrator"
3. **Be specific:** "celebrating this legendary victory"
4. **Keep it concise:** 1-2 sentences

### Context Structure

1. **Include relevant data only**
2. **Use clear field names**
3. **Structure logically**
4. **Don't overload with unnecessary info**

### Error Handling

1. **Always provide fallbackTemplate**
2. **Test prompts before game session**
3. **Have template backup ready**
4. **Monitor API usage**

### Performance

1. **Cache is your friend**
2. **Don't spam API calls**
3. **Test locally first**
4. **Monitor costs regularly**

### Security

1. **Read [Security Guide](SECURITY.md)**
2. **Use separate API keys**
3. **Set spending limits**
4. **Monitor usage**
5. **Rotate keys periodically**

---

## Next Steps

- Read [Security Guide](SECURITY.md) for API key safety
- Explore [Announcer Packs](ANNOUNCER-PACKS.md) for voice variety
- Check [Sample Macros](../README.md#sample-macros) for more examples
- Join community to share your creations!

---

**Create epic, unique moments with AI-powered announcements!**
