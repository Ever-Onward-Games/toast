# AI-Generated Announcement Examples

This document provides example macros using the AI text generation features introduced in Toast v2.0.0.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Basic Examples](#basic-examples)
- [D&D 5e Examples](#dd-5e-examples)
- [Pathfinder 2e Examples](#pathfinder-2e-examples)
- [Custom System Examples](#custom-system-examples)
- [Advanced Examples](#advanced-examples)
- [Error Handling](#error-handling)

---

## Prerequisites

Before using these macros, ensure:

1. **AI Generation is enabled** in Module Settings (World Settings)
2. **API keys are configured** (either GM's shared keys or your own)
3. **ElevenLabs API key** is configured for TTS generation
4. You have **permission** to trigger toasts

Test your setup:
```javascript
if (game.toast.hasPermission()) {
  console.log("✅ You have toast permission");
} else {
  console.log("❌ No toast permission");
}
```

---

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
- Review [PLANNING.md](PLANNING.md) for design decisions
- Report issues at [GitHub Issues](https://github.com/yourusername/toast/issues)

---

Happy gaming! 🎲
