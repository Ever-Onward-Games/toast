# Sample Macros for Toast Module

This file contains ready-to-use macros that utilize the included sample sounds.

## Using the Included "DOUBLE KILL.wav" Sound

The module includes a sample sound file at `modules/toast/sounds/DOUBLE KILL.wav` that you can use for testing or in your game.

### 1. Simple Double Kill Announcement

```javascript
game.toast.show([
  {
    type: "sound",
    src: "modules/toast/sounds/DOUBLE KILL.wav",
    volume: 0.9
  },
  {
    type: "text",
    text: "DOUBLE KILL!",
    color: "#ff0000",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 50px #ff0000, 0 0 25px #ff0000",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 2,
      scale: 1.3
    }
  }
]);
```

### 2. Double Kill with Background

```javascript
game.toast.show([
  // Background shape
  {
    type: "shape",
    width: "800px",
    height: "220px",
    backgroundColor: "rgba(139, 0, 0, 0.8)",
    borderRadius: "20px",
    boxShadow: "0 0 60px rgba(255, 0, 0, 0.9)",
    zIndex: 1,
    animation: {
      startX: window.innerWidth / 2 - 400,
      startY: window.innerHeight / 2 - 110,
      scale: 0.5,
      opacity: 0,
      duration: 0.5
    }
  },
  // Sound effect
  {
    type: "sound",
    src: "modules/toast/sounds/DOUBLE KILL.wav",
    volume: 0.9,
    delay: 0.3
  },
  // Text
  {
    type: "text",
    text: "DOUBLE KILL!",
    color: "#ff0000",
    fontSize: "100px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 50px #ff0000, 0 0 25px #ff0000, 3px 3px 8px #000000",
    zIndex: 2,
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      scale: 0.3,
      opacity: 0,
      duration: 0.8,
      delay: 0.3
    }
  }
]);
```

### 3. Multi-Stage Double Kill with CSS Animation

```javascript
game.toast.show([
  // Red background bar - slides right to left
  {
    type: "shape",
    width: "900px",
    height: "250px",
    backgroundColor: "#8B0000",
    borderRadius: "25px",
    boxShadow: "0 0 60px rgba(255, 0, 0, 0.9)",
    opacity: 0.9,
    zIndex: 1,
    animation: {
      cssAnimation: "toast-slide-right-left",
      centerX: window.innerWidth / 2 - 450,
      centerY: window.innerHeight / 2 - 125,
      duration: 2,
      easing: "ease-in-out"
    }
  },
  // Text - slides left to right
  {
    type: "text",
    text: "DOUBLE KILL!",
    color: "#FFD700",
    fontSize: "110px",
    fontFamily: "Impact, Arial Black, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 50px #ff0000, 0 0 25px #ff0000, 4px 4px 10px #000000",
    zIndex: 2,
    animation: {
      cssAnimation: "toast-slide-left-right",
      centerX: window.innerWidth / 2 - 320,
      centerY: window.innerHeight / 2 - 55,
      duration: 2,
      easing: "ease-in-out",
      delay: 0.1
    }
  },
  // Sound - plays when text is centered
  {
    type: "sound",
    src: "modules/toast/sounds/DOUBLE KILL.wav",
    volume: 0.9,
    delay: 0.5
  }
]);
```

### 4. Double Kill with Token Image

```javascript
// Get the first selected token
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn("Please select a token first!");
} else {
  game.toast.show([
    // Sound effect
    {
      type: "sound",
      src: "modules/toast/sounds/DOUBLE KILL.wav",
      volume: 0.9
    },
    // Token image
    {
      type: "tokenImage",
      tokenId: token.id,
      width: "250px",
      height: "250px",
      zIndex: 1,
      animation: {
        startX: -300,
        endX: window.innerWidth / 2 - 400,
        startY: window.innerHeight / 2 - 125,
        duration: 1.5,
        easing: "ease-out"
      }
    },
    // Text
    {
      type: "text",
      text: "DOUBLE KILL!",
      color: "#ff0000",
      fontSize: "90px",
      fontWeight: "bold",
      textShadow: "0 0 50px #ff0000",
      zIndex: 2,
      animation: {
        startX: window.innerWidth,
        endX: window.innerWidth / 2 - 80,
        startY: window.innerHeight / 2 - 45,
        duration: 1.5,
        easing: "ease-out"
      }
    }
  ]);
}
```

### 5. Staggered Double Kill (Dramatic Entrance)

```javascript
game.toast.show([
  // Background appears first
  {
    type: "shape",
    width: "850px",
    height: "220px",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    border: "5px solid #ff0000",
    borderRadius: "20px",
    boxShadow: "0 0 50px rgba(255, 0, 0, 0.7)",
    zIndex: 1,
    animation: {
      startX: window.innerWidth / 2 - 425,
      startY: window.innerHeight / 2 - 110,
      scale: 0.2,
      opacity: 0,
      duration: 0.6,
      delay: 0
    }
  },
  // "DOUBLE" appears 0.4s later
  {
    type: "text",
    text: "DOUBLE",
    color: "#ff6b6b",
    fontSize: "90px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 40px #ff6b6b, 3px 3px 8px #000000",
    zIndex: 2,
    animation: {
      startX: window.innerWidth / 2 - 380,
      startY: window.innerHeight / 2 - 45,
      scale: 0.5,
      opacity: 0,
      duration: 0.6,
      delay: 0.4
    }
  },
  // "KILL!" appears 0.7s later
  {
    type: "text",
    text: "KILL!",
    color: "#4ecdc4",
    fontSize: "90px",
    fontFamily: "Impact, sans-serif",
    fontWeight: "bold",
    textShadow: "0 0 40px #4ecdc4, 3px 3px 8px #000000",
    zIndex: 2,
    animation: {
      startX: window.innerWidth / 2 + 50,
      startY: window.innerHeight / 2 - 45,
      scale: 0.5,
      opacity: 0,
      duration: 0.6,
      delay: 0.7
    }
  },
  // Sound plays when "KILL!" appears
  {
    type: "sound",
    src: "modules/toast/sounds/DOUBLE KILL.wav",
    volume: 1.0,
    delay: 0.7
  }
]);
```

## Creating Your Own Macros

### Tips for Using the Sample Sound

1. **Volume**: The sample is best at 0.8-1.0 volume
2. **Timing**: Works great with 0.3-0.5s delay after visuals start
3. **Duration**: The sound is short, so keep animations to 2-3 seconds max
4. **Layering**: Combine with other sounds for impact effects

### Adding Your Own Sounds

1. Place sound files in `Data/worlds/[your-world]/sounds/`
2. Reference them with: `"sounds/your-sound.mp3"`
3. Or use the module sounds folder: `"modules/toast/sounds/your-sound.mp3"`

### Testing Your Macro

Use the local preview mode to test without broadcasting:

```javascript
game.toast.showLocal([
  // Your elements here
]);
```

This displays only on your screen, perfect for testing layouts and timing!

## Troubleshooting

**Sound doesn't play?**
- Check the file path in the browser console
- Verify the file is in `Data/modules/toast/sounds/` or your world's sounds folder
- Check browser audio permissions
- Try a different volume level

**Text is cut off?**
- Reduce `fontSize` or adjust positioning
- Check `startX` and `endX` values
- Use shorter text or split into multiple elements

**Animation doesn't look right?**
- Adjust `duration` (try 1.5-2.5 seconds)
- Try different `easing` values ("ease-out", "ease-in-out", "linear")
- Use `delay` to space out elements
- Use `showLocal()` to test without broadcasting

## Random Sound Variations (NEW!)

Want variety? Add multiple sound files and randomize between them! **All players will hear the same sound** (synchronized).

### Adding More Sound Variants

1. Create variations of your sound (e.g., record multiple takes, pitch-shift, etc.)
2. Name them: `DOUBLE KILL 1.wav`, `DOUBLE KILL 2.wav`, `DOUBLE KILL 3.wav`
3. Place them in `sounds/` folder

### Random Sound Example

```javascript
// Once you have multiple sound files, use this:
game.toast.show([
  // Randomly picks one - all players hear the same choice!
  game.toast.randomSound([
    "modules/toast/sounds/DOUBLE KILL 1.wav",
    "modules/toast/sounds/DOUBLE KILL 2.wav",
    "modules/toast/sounds/DOUBLE KILL 3.wav"
  ], { volume: 0.9 }),
  {
    type: "text",
    text: "DOUBLE KILL!",
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

### Quick Sound Variants Creation

**Option 1: Pitch Shift** (Audacity - Free)
1. Open your sound in Audacity
2. Effect → Pitch and Tempo → Change Pitch
3. Try +15% and -15% to create 3 variants

**Option 2: Record Multiple Takes**
- Record the same line 3-4 times with slight variations
- Different emphasis, tone, or energy levels

### Why Randomize?

- **Prevents repetition fatigue** - Hearing the same sound gets old fast
- **Adds excitement** - Players never know which version they'll get
- **Professional feel** - Games use this technique extensively

See `RANDOM-SOUNDS.md` for complete guide including weighted random selection, conditional sounds, and advanced techniques!

## More Examples

See `EXAMPLES.md` for 15+ additional macro examples with detailed explanations!
