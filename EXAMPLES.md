# Toast Module - Macro Examples

This file contains ready-to-use macro examples for the Toast module.

## Quick Start Macros

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

### 2. Slide Text from Left
```javascript
game.toast.show([
  {
    type: "text",
    text: "FINISHING BLOW!",
    color: "#FFD700",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 30px #FFD700",
    animation: {
      startX: -500,
      endX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 45,
      duration: 1.5,
      easing: "ease-out"
    }
  }
]);
```

### 3. Bounce Text from Top
```javascript
game.toast.show([
  {
    type: "text",
    text: "VICTORY!",
    color: "#00ff00",
    fontSize: "120px",
    fontWeight: "bold",
    textShadow: "0 0 50px #00ff00",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: -150,
      endY: window.innerHeight / 2 - 60,
      duration: 2,
      easing: "ease-out"
    }
  }
]);
```

### 4. Image Explosion Effect
```javascript
game.toast.show([
  {
    type: "image",
    src: "https://i.imgur.com/example.gif", // Replace with your image URL
    width: "500px",
    height: "500px",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 250,
      duration: 2,
      scale: 1.5,
      opacity: 0.9
    }
  }
]);
```

## Advanced Macros

### 5. Multi-Element Combo
```javascript
game.toast.show([
  // Text sliding from left
  {
    type: "text",
    text: "LEGENDARY STRIKE!",
    color: "#9d4edd",
    fontSize: "80px",
    fontWeight: "bold",
    textShadow: "0 0 40px #9d4edd",
    animation: {
      startX: -600,
      endX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 100,
      duration: 2,
      easing: "ease-out"
    }
  },
  // Image spinning in
  {
    type: "image",
    src: "modules/toast/assets/star.png", // Add your own image
    width: "200px",
    height: "200px",
    rotation: 360,
    animation: {
      startX: window.innerWidth / 2 - 100,
      startY: window.innerHeight / 2 + 150,
      duration: 2,
      scale: 2
    }
  }
]);
```

### 6. Selected Token Celebration
```javascript
// Get the currently selected token
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

### 7. Actor Avatar Showcase
```javascript
// Get actor by name
const actorName = "Your Character Name"; // Change this
const actor = game.actors.getName(actorName);

if (!actor) {
  ui.notifications.warn(`Actor "${actorName}" not found!`);
} else {
  game.toast.show([
    {
      type: "actorImage",
      actorId: actor.id,
      width: "400px",
      height: "400px",
      animation: {
        startX: window.innerWidth,
        endX: window.innerWidth / 2 - 200,
        startY: window.innerHeight / 2 - 200,
        duration: 2.5,
        easing: "ease-in-out"
      }
    },
    {
      type: "text",
      text: actor.name,
      color: "#ffffff",
      fontSize: "60px",
      fontWeight: "bold",
      textShadow: "0 0 20px #000000",
      animation: {
        startX: window.innerWidth / 2 - 150,
        startY: -100,
        endY: 100,
        duration: 2,
        easing: "ease-out"
      }
    }
  ]);
}
```

### 8. Dual Text Slide
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

### 9. Centered Fade and Scale
```javascript
game.toast.show([
  {
    type: "text",
    text: "LEVEL UP!",
    color: "#ffd700",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #ffd700, 0 0 20px #ffd700",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 50,
      duration: 2,
      scale: 1.5,
      opacity: 0.8
    }
  }
]);
```

### 10. Random Color Critical
```javascript
// Generate random color
const colors = ["#ff0000", "#ff6b00", "#ffff00", "#00ff00", "#0000ff", "#9d00ff"];
const randomColor = colors[Math.floor(Math.random() * colors.length)];

game.toast.show([
  {
    type: "text",
    text: "CRITICAL!",
    color: randomColor,
    fontSize: "110px",
    fontWeight: "bold",
    textShadow: `0 0 40px ${randomColor}, 0 0 20px ${randomColor}`,
    animation: {
      startX: window.innerWidth / 2 - 280,
      startY: window.innerHeight / 2 - 55,
      duration: 2,
      scale: 1.2
    }
  }
]);
```

## Sound Effect Examples

### 11. Simple Sound Effect
```javascript
game.toast.show([
  {
    type: "sound",
    src: "sounds/fanfare.mp3",
    volume: 0.8
  },
  {
    type: "text",
    text: "QUEST COMPLETE!",
    color: "#FFD700",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 40px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 45,
      duration: 2
    }
  }
]);
```

### 12. Delayed Sound Effect
```javascript
game.toast.show([
  // Text appears first
  {
    type: "text",
    text: "INCOMING!",
    color: "#ff0000",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 40px #ff0000",
    animation: {
      startX: window.innerWidth / 2 - 280,
      startY: window.innerHeight / 2 - 50,
      duration: 1.5
    }
  },
  // Sound plays 1 second later
  {
    type: "sound",
    src: "sounds/explosion.mp3",
    volume: 1.0,
    delay: 1.0
  }
]);
```

### 13. Multiple Sound Effects
```javascript
game.toast.show([
  // Whoosh sound as text slides in
  {
    type: "sound",
    src: "sounds/whoosh.mp3",
    volume: 0.6
  },
  {
    type: "text",
    text: "ULTRA COMBO!",
    color: "#ff00ff",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 40px #ff00ff",
    animation: {
      startX: -600,
      endX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 45,
      duration: 1.0,
      easing: "ease-out"
    }
  },
  // Impact sound when text arrives
  {
    type: "sound",
    src: "sounds/impact.wav",
    volume: 0.8,
    delay: 1.0
  }
]);
```

### 14. Critical Hit with Layered Sounds
```javascript
game.toast.show([
  // Sword slash sound
  {
    type: "sound",
    src: "sounds/sword-slash.mp3",
    volume: 0.7
  },
  // Background shape
  {
    type: "shape",
    width: "700px",
    height: "180px",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    borderRadius: "20px",
    zIndex: 1,
    animation: {
      startX: window.innerWidth / 2 - 350,
      startY: window.innerHeight / 2 - 90,
      duration: 0.5
    }
  },
  // Text
  {
    type: "text",
    text: "CRITICAL HIT!",
    color: "#ff0000",
    fontSize: "90px",
    fontWeight: "bold",
    textShadow: "0 0 40px #ff0000",
    zIndex: 2,
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 45,
      scale: 0.5,
      duration: 0.8,
      delay: 0.2
    }
  },
  // Impact/hit confirm sound
  {
    type: "sound",
    src: "sounds/hit-confirm.wav",
    volume: 0.9,
    delay: 0.5
  }
]);
```

### 15. Victory Fanfare with Music Loop
```javascript
game.toast.show([
  // Victory music (loops)
  {
    type: "sound",
    src: "sounds/victory-music.mp3",
    volume: 0.5,
    loop: true  // Music will keep playing
  },
  // Victory text
  {
    type: "text",
    text: "VICTORY!",
    color: "#FFD700",
    fontSize: "120px",
    fontWeight: "bold",
    textShadow: "0 0 50px #FFD700",
    animation: {
      startX: window.innerWidth / 2 - 280,
      startY: -150,
      endY: window.innerHeight / 2 - 60,
      duration: 2,
      easing: "ease-out"
    }
  }
]);

// Note: Looping sounds will continue until you reload or manually stop them
// To stop: game.audio.playing.forEach(s => s.stop())
```

## Sound File Tips

### Where to Put Sound Files
- **World-specific**: `Data/worlds/[your-world]/sounds/`
- **Module**: Create a `toast/sounds/` folder in your module
- **System**: `Data/systems/[your-system]/sounds/`

### Free Sound Resources
- **Freesound.org** - Creative Commons sounds
- **Zapsplat.com** - Free sound effects (attribution required)
- **Mixkit.co** - Royalty-free sounds
- **Incompetech.com** - Kevin MacLeod's music
- **BBC Sound Effects** - Free for personal use

### Recommended Sounds for Common Events
- **Critical Hit**: sword slash, explosion, thunderclap
- **Victory**: fanfare, triumphant horn, celebration
- **Level Up**: chime, ascending notes, sparkle
- **Finishing Blow**: heavy impact, final blow, dramatic boom
- **Kill Streak**: announcer voice, aggressive music sting
- **Achievement**: coin, success chime, power-up

### Format Recommendations
- **MP3** - Best browser compatibility, good compression
- **OGG** - Open format, good quality
- **WAV** - Uncompressed, larger files, best quality
- **WEBM** - Modern format, not all browsers support

Keep sounds under 5 seconds for best performance (except background music).

## Positioning Helper

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

// Offscreen left
const offscreenLeftX = -elementWidth;

// Offscreen right
const offscreenRightX = window.innerWidth;

// Offscreen top
const offscreenTopY = -elementHeight;

// Offscreen bottom
const offscreenBottomY = window.innerHeight;
```

## Permission Check

Before showing a toast, you can check if the user has permission:

```javascript
if (game.toast.hasPermission()) {
  game.toast.show([
    // Your elements here
  ]);
} else {
  ui.notifications.warn("You don't have permission to trigger toasts.");
}
```

## Tips for Creating Great Toasts

1. **Keep it short**: 1-3 seconds is usually enough
2. **Use contrasting colors**: Make text readable against any background
3. **Add glow effects**: Text shadows make text pop
4. **Combine elements**: Mix text and images for impact
5. **Test positioning**: Use `console.log(window.innerWidth, window.innerHeight)` to check screen size
6. **Entrance and exit**: Start elements off-screen for dramatic entrances
7. **Timing**: Coordinate multiple elements with similar durations
8. **Less is more**: Don't overwhelm with too many elements at once
