# Random Sound Selection

This guide explains how to randomize sound effects while keeping them synchronized across all players.

## The Problem

If each player randomly selects their own sound file, different players will hear different sounds. This breaks immersion!

## The Solution

Use `game.toast.randomSound()` to select a sound **before** broadcasting. This ensures all players hear the same randomly selected sound.

## How It Works

1. The triggering player calls `game.toast.randomSound([array of sounds])`
2. One sound is randomly selected **on that client**
3. The selected sound is included in the broadcast to all players
4. All players hear the same sound

## Basic Usage

### Simple Random Sound

```javascript
game.toast.show([
  // Randomly pick one of these sounds - all players will hear the same one
  game.toast.randomSound([
    "modules/toast/sounds/critical-1.wav",
    "modules/toast/sounds/critical-2.wav",
    "modules/toast/sounds/critical-3.wav"
  ]),
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

### Random Sound with Options

```javascript
game.toast.show([
  // Random sound with custom volume and delay
  game.toast.randomSound(
    [
      "sounds/victory-1.mp3",
      "sounds/victory-2.mp3",
      "sounds/victory-3.mp3"
    ],
    {
      volume: 0.9,
      delay: 0.3
    }
  ),
  {
    type: "text",
    text: "VICTORY!",
    color: "#FFD700",
    fontSize: "90px",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 45,
      duration: 2
    }
  }
]);
```

## Complete Examples

### Example 1: Random Critical Hit Sounds

```javascript
// Assumes you have multiple critical hit sound variants
const criticalSounds = [
  "modules/toast/sounds/critical-1.wav",
  "modules/toast/sounds/critical-2.wav",
  "modules/toast/sounds/critical-3.wav",
  "modules/toast/sounds/critical-4.wav"
];

game.toast.show([
  game.toast.randomSound(criticalSounds, { volume: 0.8 }),
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

### Example 2: Random Kill Streak Announcements

```javascript
// Different announcer voices for kill streaks
const killStreakSounds = [
  "modules/toast/sounds/DOUBLE KILL.wav",
  "modules/toast/sounds/TRIPLE KILL.wav",
  "modules/toast/sounds/ULTRA KILL.wav"
];

game.toast.show([
  game.toast.randomSound(killStreakSounds, { volume: 0.9 }),
  {
    type: "text",
    text: "KILL STREAK!",
    color: "#ff0000",
    fontSize: "100px",
    animation: {
      startX: window.innerWidth / 2 - 320,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

### Example 3: Multiple Random Elements

```javascript
// Mix random sounds with random text colors
const impactSounds = [
  "sounds/impact-1.wav",
  "sounds/impact-2.wav",
  "sounds/impact-3.wav"
];

const colors = ["#ff0000", "#ff6b00", "#ffff00", "#00ff00"];
const randomColor = colors[Math.floor(Math.random() * colors.length)];

game.toast.show([
  game.toast.randomSound(impactSounds, { volume: 0.85 }),
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
      duration: 2
    }
  }
]);
```

### Example 4: Conditional Sound Selection

```javascript
// Different sounds based on damage amount
function getCriticalToast(damageAmount) {
  let sounds;
  let text;

  if (damageAmount > 100) {
    sounds = [
      "sounds/mega-crit-1.wav",
      "sounds/mega-crit-2.wav"
    ];
    text = "DEVASTATING CRITICAL!";
  } else if (damageAmount > 50) {
    sounds = [
      "sounds/crit-1.wav",
      "sounds/crit-2.wav",
      "sounds/crit-3.wav"
    ];
    text = "CRITICAL HIT!";
  } else {
    sounds = [
      "sounds/mini-crit-1.wav",
      "sounds/mini-crit-2.wav"
    ];
    text = "Critical!";
  }

  game.toast.show([
    game.toast.randomSound(sounds, { volume: 0.8 }),
    {
      type: "text",
      text: text,
      color: "#ff0000",
      fontSize: "100px",
      animation: {
        startX: window.innerWidth / 2 - 300,
        startY: window.innerHeight / 2 - 50,
        duration: 2
      }
    }
  ]);
}

// Usage
getCriticalToast(75); // Plays a regular critical sound
getCriticalToast(150); // Plays a mega critical sound
```

## Creating Sound Variants

### Option 1: Record Multiple Takes
Record the same line multiple times with slight variations in delivery, tone, or pitch.

### Option 2: Pitch Shifting
Use audio software to create variants:
- Audacity (free): Effect → Pitch and Tempo → Change Pitch
- Try ±10-20% pitch shift for variety

### Option 3: Different Voices
- Record with different people
- Use different voice actors/announcers
- Mix male and female voices

### Option 4: Layered Effects
Combine the same base sound with different background effects:
- `critical-clean.wav` - Just the voice
- `critical-explosion.wav` - Voice + explosion
- `critical-electric.wav` - Voice + electric crackle

## File Organization

Keep your sound files organized:

```
sounds/
├── critical/
│   ├── critical-1.wav
│   ├── critical-2.wav
│   ├── critical-3.wav
│   └── critical-4.wav
├── victory/
│   ├── victory-1.mp3
│   ├── victory-2.mp3
│   └── victory-3.mp3
└── kill-streaks/
    ├── DOUBLE KILL.wav
    ├── TRIPLE KILL.wav
    └── ULTRA KILL.wav
```

Then reference them:
```javascript
const criticals = [
  "modules/toast/sounds/critical/critical-1.wav",
  "modules/toast/sounds/critical/critical-2.wav",
  "modules/toast/sounds/critical/critical-3.wav",
  "modules/toast/sounds/critical/critical-4.wav"
];
```

## Testing

### Test Synchronization

1. Have 2+ people in your Foundry game
2. Trigger a toast with random sounds
3. Ask each player which sound they heard
4. Everyone should report the same sound

### Test Local First

Use `showLocal()` to test without broadcasting:

```javascript
game.toast.showLocal([
  game.toast.randomSound([
    "sounds/test-1.wav",
    "sounds/test-2.wav",
    "sounds/test-3.wav"
  ]),
  { type: "text", text: "Testing..." }
]);
```

Trigger it multiple times to see the randomization working.

## Advanced: Weighted Random Selection

For more control over which sounds play most often:

```javascript
function weightedRandomSound(soundsWithWeights) {
  // soundsWithWeights = [
  //   { src: "common.wav", weight: 70 },
  //   { src: "rare.wav", weight: 20 },
  //   { src: "legendary.wav", weight: 10 }
  // ]

  const totalWeight = soundsWithWeights.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const sound of soundsWithWeights) {
    if (random < sound.weight) {
      return {
        type: "sound",
        src: sound.src,
        volume: 0.8
      };
    }
    random -= sound.weight;
  }

  return soundsWithWeights[0]; // Fallback
}

// Usage
game.toast.show([
  weightedRandomSound([
    { src: "sounds/common-crit.wav", weight: 70 },   // 70% chance
    { src: "sounds/rare-crit.wav", weight: 20 },     // 20% chance
    { src: "sounds/legendary-crit.wav", weight: 10 } // 10% chance
  ]),
  { type: "text", text: "CRITICAL!" }
]);
```

## API Reference

### `game.toast.randomSound(sources, options)`

**Parameters:**
- `sources` (Array<string>) - Array of sound file paths
- `options` (Object) - Optional sound settings
  - `volume` (number) - Volume 0.0-1.0 (default: 0.8)
  - `delay` (number) - Delay in seconds (default: 0)
  - `loop` (boolean) - Loop the sound (default: false)

**Returns:** Sound element object with randomly selected source

**Example:**
```javascript
const sound = game.toast.randomSound(
  ["sound1.wav", "sound2.wav", "sound3.wav"],
  { volume: 0.9, delay: 0.5 }
);

console.log(sound);
// {
//   type: "sound",
//   src: "sound2.wav",  // randomly selected
//   volume: 0.9,
//   delay: 0.5,
//   loop: false
// }
```

## Troubleshooting

**Players hear different sounds:**
- Make sure you're using `game.toast.randomSound()` inside `game.toast.show()`
- Don't call `Math.random()` on each client - let the function handle it

**Same sound plays every time:**
- Check that your array has multiple different sound files
- Verify file paths are correct
- Look for typos in file names

**Sound doesn't play:**
- Verify all sound files exist
- Check browser console for errors
- Test each sound file individually first

## Tips

1. **Start with 2-3 variants** - Don't overwhelm yourself
2. **Keep files small** - Under 500KB each for quick loading
3. **Consistent volume** - Normalize all variants to similar loudness
4. **Test in game** - Different sounds work better in different contexts
5. **Get feedback** - Ask players which sounds they like best
