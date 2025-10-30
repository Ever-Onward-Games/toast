# Toast Module - Basic Examples

This document provides example macros for using Toast without AI generation. Perfect for getting started with the module or when you want fast, predictable announcements.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Simple Toast Examples](#simple-toast-examples)
- [Template-Based Examples](#template-based-examples)
- [Visual Element Examples](#visual-element-examples)
- [Animation Examples](#animation-examples)
- [Audio Examples](#audio-examples)
- [Token and Actor Images](#token-and-actor-images)
- [Combining Elements](#combining-elements)
- [Practical Game Examples](#practical-game-examples)
- [Helper Functions](#helper-functions)

---

## Prerequisites

Before using these macros, ensure:

1. **Toast module is installed** and enabled in your world
2. You have **permission** to trigger toasts
3. **Audio files are available** (for announcer pack examples)

Test your setup:
```javascript
if (game.toast.hasPermission()) {
  console.log("✅ You have toast permission");
} else {
  console.log("❌ No toast permission");
}
```

---

## Simple Toast Examples

### Example 1: Basic Text Toast

The simplest possible toast - just text:

```javascript
game.toast.show([
  game.toast.sound("dominating"),
  game.toast.simpleText("CRITICAL HIT!")
]);
```

**What it does:**
- Shows "CRITICAL HIT!" in center of screen
- Plays "Dominating" sound from announcer pack
- Displays for 2 seconds (default)
- Fades in and out

---

### Example 2: Custom Text Styling

Customize the appearance using options:

```javascript
game.toast.show([
  game.toast.sound("first-blood"),
  game.toast.simpleText("BOSS DEFEATED!", {
    color: "#FFD700",           // Gold color
    fontSize: "120px",
    fontWeight: "bold",
    textShadow: "0 0 50px #FFD700"
  })
]);
```

**Result:** Large gold text with glowing effect

---

### Example 3: Multiple Text Elements

Show multiple pieces of text:

```javascript
game.toast.show([
  game.toast.sound("holy-shit"),
  {
    type: "text",
    text: "FLAWLESS VICTORY",
    color: "#FFD700",
    fontSize: "100px",
    animation: {
      startX: window.innerWidth / 2 - 400,
      startY: window.innerHeight / 4,
      duration: 3
    }
  },
  {
    type: "text",
    text: "No damage taken!",
    color: "#00ff00",
    fontSize: "60px",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2,
      duration: 3
    }
  }
]);
```

**Result:** Two text elements at different positions

---

## Template-Based Examples

Templates use token replacement for dynamic text without AI.

### Example 4: Register and Use a Template

```javascript
// Register a template (do this once at game start)
game.toast.templates.register("player-kill", {
  text: "{killer} eliminates {victim}!",
  ttsTemplate: "{killer} eliminates {victim}"
});

// Use the template
game.toast.showDynamic("player-kill", {
  killer: "Alice",
  victim: "Bob"
});
```

**Result:** "Alice eliminates Bob!" displayed and spoken

---

### Example 5: Template with Visual Elements

Combine templates with visuals:

```javascript
// Register template
game.toast.templates.register("boss-kill", {
  text: "{killer} defeats {boss}!",
  ttsTemplate: "{killer} has defeated the mighty {boss}"
});

// Use with elements
game.toast.showDynamic("boss-kill",
  {
    killer: "Alice",
    boss: "Ancient Dragon"
  },
  [
    {
      type: "text",
      text: "BOSS DEFEATED!",
      color: "#FFD700",
      fontSize: "100px",
      fontWeight: "bold",
      animation: {
        startX: window.innerWidth / 2 - 350,
        startY: window.innerHeight / 2 - 50,
        duration: 3
      }
    }
  ]
);
```

**Result:** Custom message with gold "BOSS DEFEATED!" text

---

### Example 6: Critical Hit Template

```javascript
// Register
game.toast.templates.register("critical-hit", {
  text: "CRITICAL HIT! {damage} damage!",
  ttsTemplate: "Critical hit for {damage} damage"
});

// Use
const damage = 87; // From your dice roll
game.toast.showDynamic("critical-hit",
  { damage: damage },
  [
    {
      type: "text",
      text: "CRITICAL HIT!",
      color: "#ff0000",
      fontSize: "110px",
      fontWeight: "bold",
      textShadow: "0 0 50px #ff0000",
      animation: {
        startX: window.innerWidth / 2 - 350,
        startY: window.innerHeight / 2 - 55,
        duration: 2
      }
    }
  ],
  "critical"
);
```

**Result:** Red glowing critical hit message with damage

---

## Visual Element Examples

### Example 7: Colored Shapes

Add colored rectangles or circles:

```javascript
game.toast.show([
  {
    type: "shape",
    shape: "rect",
    color: "#ff0000",
    width: "400px",
    height: "200px",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 100,
      duration: 2
    }
  },
  {
    type: "text",
    text: "DANGER!",
    color: "#ffffff",
    fontSize: "80px",
    fontWeight: "bold",
    animation: {
      startX: window.innerWidth / 2 - 150,
      startY: window.innerHeight / 2 - 40,
      duration: 2
    }
  }
]);
```

**Result:** Red rectangle with "DANGER!" text

---

### Example 8: Custom Images

Display custom images:

```javascript
game.toast.show([
  game.toast.image("modules/toast/images/victory.png", {
    width: "400px",
    height: "400px",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 200,
      duration: 3
    }
  })
]);
```

**Result:** Displays your custom victory image

---

## Animation Examples

### Example 9: Slide Animations

Slide text across the screen:

```javascript
game.toast.show([
  game.toast.sound("godlike"),
  {
    type: "text",
    text: "UNSTOPPABLE!",
    color: "#ff00ff",
    fontSize: "100px",
    fontWeight: "bold",
    animation: {
      // Start off-screen left
      startX: -500,
      startY: window.innerHeight / 2 - 50,
      // End off-screen right
      endX: window.innerWidth + 500,
      endY: window.innerHeight / 2 - 50,
      duration: 3,
      easing: "linear"
    }
  }
]);
```

**Result:** Text slides from left to right across screen

---

### Example 10: Scaling Animation

Make text grow and shrink:

```javascript
game.toast.show([
  {
    type: "text",
    text: "BOOM!",
    color: "#ff0000",
    fontSize: "150px",
    fontWeight: "bold",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 75,
      startScale: 0.1,    // Start tiny
      endScale: 2.0,      // End huge
      duration: 1.5
    }
  }
]);
```

**Result:** Text grows from tiny to huge

---

### Example 11: Fade Animation

Fade in and out:

```javascript
game.toast.show([
  {
    type: "text",
    text: "Sneaking...",
    color: "#666666",
    fontSize: "80px",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 40,
      startOpacity: 0,
      endOpacity: 1,
      duration: 2
    }
  }
]);
```

**Result:** Text fades in gradually

---

## Audio Examples

### Example 12: Announcer Pack Sounds

Use built-in announcer sounds:

```javascript
// Single kill
game.toast.show([
  game.toast.sound("first-blood"),
  game.toast.simpleText("First Blood!")
]);

// Double kill
game.toast.show([
  game.toast.sound("double-kill"),
  game.toast.simpleText("Double Kill!")
]);

// Multi-kill
game.toast.show([
  game.toast.sound("multi-kill"),
  game.toast.simpleText("Multi Kill!")
]);

// Killing spree
game.toast.show([
  game.toast.sound("killing-spree"),
  game.toast.simpleText("Killing Spree!")
]);

// Dominating
game.toast.show([
  game.toast.sound("dominating"),
  game.toast.simpleText("DOMINATING!")
]);
```

**Available sounds:** See [ANNOUNCER-PACKS.md](ANNOUNCER-PACKS.md)

---

### Example 13: Custom Sound Files

Use your own audio:

```javascript
game.toast.show([
  game.toast.sound("modules/my-module/sounds/achievement.mp3"),
  game.toast.simpleText("Achievement Unlocked!")
]);
```

**Result:** Plays your custom sound file

---

## Token and Actor Images

### Example 14: Show Token Image

Display the selected token:

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select a token!");
  return;
}

game.toast.show([
  game.toast.sound("dominating"),
  game.toast.tokenImage(token.id, {
    width: "300px",
    height: "300px",
    animation: {
      startX: window.innerWidth / 2 - 150,
      startY: window.innerHeight / 2 - 150,
      duration: 3
    }
  }),
  game.toast.simpleText(token.name, {
    color: "#FFD700",
    fontSize: "80px",
    fontWeight: "bold",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 + 200,
      duration: 3
    }
  })
]);
```

**Result:** Shows token image with name below

---

### Example 15: Show Actor Portrait

Display actor portrait:

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select a token!");
  return;
}

game.toast.show([
  game.toast.sound("holy-shit"),
  game.toast.actorImage(token.actor.id, {
    width: "400px",
    height: "400px",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 200,
      duration: 3
    }
  })
]);
```

**Result:** Shows actor portrait (not token image)

---

### Example 16: Side-by-Side Combatants

Show attacker and defender:

```javascript
const attacker = canvas.tokens.controlled[0];
const defender = game.user.targets.first();

if (!attacker || !defender) {
  ui.notifications.warn("Select your token and target!");
  return;
}

game.toast.show([
  game.toast.sound("dominating"),
  game.toast.tokenImage(attacker.id, {
    width: "250px",
    height: "250px",
    animation: {
      startX: window.innerWidth / 4 - 125,
      startY: window.innerHeight / 2 - 125,
      duration: 3
    }
  }),
  {
    type: "text",
    text: "VS",
    color: "#ff0000",
    fontSize: "100px",
    fontWeight: "bold",
    animation: {
      startX: window.innerWidth / 2 - 50,
      startY: window.innerHeight / 2 - 50,
      duration: 3
    }
  },
  game.toast.tokenImage(defender.id, {
    width: "250px",
    height: "250px",
    animation: {
      startX: (window.innerWidth * 3/4) - 125,
      startY: window.innerHeight / 2 - 125,
      duration: 3
    }
  })
]);
```

**Result:** Shows attacker VS defender with images

---

## Combining Elements

### Example 17: Complex Layout

Combine text, images, and shapes:

```javascript
game.toast.show([
  game.toast.sound("godlike"),
  // Background shape
  {
    type: "shape",
    shape: "rect",
    color: "rgba(0, 0, 0, 0.7)",
    width: "800px",
    height: "400px",
    animation: {
      startX: window.innerWidth / 2 - 400,
      startY: window.innerHeight / 2 - 200,
      duration: 3
    }
  },
  // Title
  {
    type: "text",
    text: "LEGENDARY!",
    color: "#FFD700",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 150,
      duration: 3
    }
  },
  // Subtitle
  {
    type: "text",
    text: "10 Kills Without Dying",
    color: "#ffffff",
    fontSize: "50px",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 3
    }
  }
]);
```

**Result:** Layered announcement with background

---

## Practical Game Examples

### Example 18: Initiative Rolled

Announce initiative:

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select your token!");
  return;
}

// Get initiative roll (adjust for your system)
const initiative = 18;

game.toast.show([
  game.toast.sound("prepare"),
  game.toast.simpleText(`Initiative: ${initiative}`, {
    color: "#00ff00",
    fontSize: "80px",
    fontWeight: "bold",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 40,
      duration: 2
    }
  })
]);
```

---

### Example 19: Treasure Found

Celebrate loot:

```javascript
game.toast.show([
  game.toast.sound("double-kill"),
  {
    type: "text",
    text: "LEGENDARY ITEM FOUND!",
    color: "#ff8800",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 50px #ff8800",
    animation: {
      startX: window.innerWidth / 2 - 450,
      startY: window.innerHeight / 3,
      duration: 3
    }
  },
  {
    type: "text",
    text: "Sword of Ultimate Power",
    color: "#FFD700",
    fontSize: "60px",
    animation: {
      startX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2,
      duration: 3
    }
  }
]);
```

---

### Example 20: Level Up

Celebrate level advancement:

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select your token!");
  return;
}

const newLevel = 5; // Get from actor

game.toast.show([
  game.toast.sound("godlike"),
  game.toast.tokenImage(token.id, {
    width: "250px",
    height: "250px",
    animation: {
      startX: window.innerWidth / 2 - 125,
      startY: window.innerHeight / 3 - 125,
      duration: 3
    }
  }),
  game.toast.simpleText("LEVEL UP!", {
    color: "#FFD700",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 + 100,
      duration: 3
    }
  }),
  game.toast.simpleText(`Now Level ${newLevel}`, {
    color: "#00ff00",
    fontSize: "60px",
    animation: {
      startX: window.innerWidth / 2 - 180,
      startY: window.innerHeight / 2 + 200,
      duration: 3
    }
  })
]);
```

---

### Example 21: Death Save

Dramatic death save announcement:

```javascript
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Select your token!");
  return;
}

const rollResult = 15; // Get from roll
const success = rollResult >= 10;

game.toast.show([
  game.toast.sound(success ? "first-blood" : "prepare"),
  game.toast.simpleText(
    success ? "DEATH SAVE: SUCCESS!" : "DEATH SAVE: FAILURE!",
    {
      color: success ? "#00ff00" : "#ff0000",
      fontSize: "90px",
      fontWeight: "bold",
      textShadow: success ? "0 0 40px #00ff00" : "0 0 40px #ff0000",
      animation: {
        startX: window.innerWidth / 2 - 450,
        startY: window.innerHeight / 2 - 45,
        duration: 2.5
      }
    }
  )
]);
```

---

### Example 22: Combat Round Start

Announce combat rounds:

```javascript
const roundNumber = game.combat?.round || 1;

game.toast.show([
  game.toast.sound("prepare"),
  game.toast.simpleText(`ROUND ${roundNumber}`, {
    color: "#ffffff",
    fontSize: "100px",
    fontWeight: "bold",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }),
  {
    type: "text",
    text: "FIGHT!",
    color: "#ff0000",
    fontSize: "80px",
    fontWeight: "bold",
    textShadow: "0 0 40px #ff0000",
    animation: {
      startX: window.innerWidth / 2 - 150,
      startY: window.innerHeight / 2 + 80,
      startScale: 0.5,
      endScale: 1.5,
      duration: 1.5
    }
  }
]);
```

---

## Helper Functions

Toast provides helper functions to make creating elements easier:

### game.toast.simpleText(text, options)

Creates a text element with default styling:

```javascript
game.toast.simpleText("Hello World")
// Returns: { type: "text", text: "Hello World" }

game.toast.simpleText("Styled Text", {
  color: "#ff0000",
  fontSize: "80px",
  fontWeight: "bold"
})
// Returns: { type: "text", text: "Styled Text", color: "#ff0000", fontSize: "80px", fontWeight: "bold" }
```

### game.toast.sound(soundName)

Creates a sound element:

```javascript
game.toast.sound("dominating")
// Returns: { type: "sound", src: "dominating" }

game.toast.sound("modules/my-module/sounds/custom.mp3")
// Returns: { type: "sound", src: "modules/my-module/sounds/custom.mp3" }
```

### game.toast.image(src, options)

Creates an image element:

```javascript
game.toast.image("modules/toast/images/logo.png", {
  width: "200px",
  height: "200px"
})
// Returns: { type: "image", src: "...", width: "200px", height: "200px" }
```

### game.toast.tokenImage(tokenId, options)

Creates a token image element:

```javascript
const token = canvas.tokens.controlled[0];
game.toast.tokenImage(token.id, {
  width: "300px",
  height: "300px"
})
// Returns: { type: "tokenImage", tokenId: "...", width: "300px", height: "300px" }
```

### game.toast.actorImage(actorId, options)

Creates an actor image element:

```javascript
const token = canvas.tokens.controlled[0];
game.toast.actorImage(token.actor.id, {
  width: "400px",
  height: "400px"
})
// Returns: { type: "actorImage", actorId: "...", width: "400px", height: "400px" }
```

---

## Tips and Best Practices

### Layout Tips

**Centering elements:**
```javascript
// For centering:
startX: window.innerWidth / 2 - (elementWidth / 2)
startY: window.innerHeight / 2 - (elementHeight / 2)
```

**Vertical stacking:**
```javascript
// Element 1 at top
startY: window.innerHeight / 3

// Element 2 in middle
startY: window.innerHeight / 2

// Element 3 at bottom
startY: (window.innerHeight * 2/3)
```

### Animation Tips

**Standard duration:** 2-3 seconds
**Quick flash:** 1-1.5 seconds
**Epic moment:** 3-4 seconds

### Performance Tips

1. **Limit elements:** Keep to 3-5 elements per toast
2. **Reasonable sizes:** Don't exceed 2000x2000 px for images
3. **Test first:** Try announcements solo before using in game
4. **Cache sounds:** Built-in sounds load faster

---

## Need AI-Generated Announcements?

For dynamic, context-aware announcements, see:
- [AI-GENERATION.md](AI-GENERATION.md) - Complete AI guide
- Setup Claude or OpenAI
- Generate unique text for every situation

---

## Need Help?

- [README.md](../README.md) - Full module documentation
- [API-REFERENCE.md](API-REFERENCE.md) - Complete API docs
- [ANNOUNCER-PACKS.md](ANNOUNCER-PACKS.md) - Sound pack guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

Happy gaming! 🎲
