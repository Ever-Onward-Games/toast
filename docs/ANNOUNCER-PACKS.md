# Announcer Packs Guide

Organize and switch between different voice announcers effortlessly! This guide covers everything about using and creating announcer packs for Toast.

## Table of Contents

- [Overview](#overview)
- [What Are Announcer Packs](#what-are-announcer-packs)
- [Using Announcer Packs](#using-announcer-packs)
- [Creating Custom Packs](#creating-custom-packs)
- [Multiple Languages](#multiple-languages)
- [Themed Announcers](#themed-announcers)
- [Combining with Random Sounds](#combining-with-random-sounds)
- [Tips and Best Practices](#tips-and-best-practices)
- [Finding Voices](#finding-voices)
- [Sharing Your Packs](#sharing-your-packs)

---

## Overview

Announcer packs let you organize voice files from the same narrator into switchable folders. GMs can change announcers without editing macros!

**Key Features:**
- Organize voices by narrator, language, or theme
- Switch announcers instantly from settings
- Works with existing macros automatically
- No macro changes needed when switching
- Perfect for multiple languages or campaigns

**Use Cases:**
- Different narrators for different campaigns
- Multiple language support
- Themed voices (fantasy, sci-fi, horror)
- Character-specific announcers
- Seasonal variations

---

## What Are Announcer Packs

### Concept

An announcer pack is a folder containing voice files from one narrator, organized with consistent filenames.

**Example Structure:**
```
modules/toast/sounds/announcers/
├── unreal-tournament/
│   ├── double-kill.wav
│   ├── triple-kill.wav
│   ├── unstoppable.wav
│   └── dominating.wav
├── bob-announcerton/
│   ├── double-kill.wav
│   ├── triple-kill.wav
│   ├── unstoppable.wav
│   └── dominating.wav
└── murderbot/
    ├── double-kill.wav
    ├── triple-kill.wav
    ├── unstoppable.wav
    └── dominating.wav
```

### How It Works

1. **Macros reference filenames** (not full paths):
   ```javascript
   src: game.toast.getAnnouncerSound("double-kill.wav")
   ```

2. **Module resolves to active pack:**
   - If "unreal-tournament" selected:
     - Returns: `modules/toast/sounds/announcers/unreal-tournament/double-kill.wav`
   - If "bob-announcerton" selected:
     - Returns: `modules/toast/sounds/announcers/bob-announcerton/double-kill.wav`

3. **GMs switch packs** in module settings - macros work automatically!

### Benefits

✅ **No macro editing** when changing announcers
✅ **Instant switching** via settings dropdown
✅ **Organize by theme** (fantasy, sci-fi, etc.)
✅ **Multiple languages** in same world
✅ **Campaign-specific voices**
✅ **Easy to distribute** and share

---

## Using Announcer Packs

### Basic Usage

#### Step 1: Select Announcer Pack

1. Go to **Module Settings** → **Toast - Full Screen Celebrations**
2. Find **Announcer Pack** dropdown
3. Select your preferred pack (e.g., "Unreal Tournament")
4. Save settings

#### Step 2: Use in Macros

Use the helper method `game.toast.getAnnouncerSound()`:

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

**That's it!** The module automatically uses the selected announcer pack.

### Complete Example

```javascript
// This macro works regardless of which announcer is selected!
game.toast.show([
  // Sound from current announcer
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("critical-hit.wav"),
    volume: 0.9
  },
  // Visual element
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

### Graceful Failure Handling

If a file doesn't exist in the selected pack:

```javascript
const sound = game.toast.getAnnouncerSound("missing-file.wav");
// Returns: null

// Safe to use with randomSound (nulls are filtered)
game.toast.randomSound([
  game.toast.getAnnouncerSound("double-kill.wav"),   // exists
  game.toast.getAnnouncerSound("triple-kill.wav"),   // exists
  game.toast.getAnnouncerSound("missing-file.wav")   // null - safely ignored
], { volume: 0.9 });
```

### Switching Announcers

**Mid-Session:**
1. GM opens **Module Settings**
2. Changes **Announcer Pack** dropdown
3. Saves settings
4. Next macro uses new announcer - no reload needed!

**Between Sessions:**
- Switch for different campaigns
- Use different announcer for special events
- Test new voice packs

---

## Creating Custom Packs

### Step 1: Create Folder Structure

Navigate to your Toast module sounds directory:

```
modules/toast/sounds/announcers/
```

Create a new folder for your announcer:

```
modules/toast/sounds/announcers/your-announcer-name/
```

**Naming Conventions:**
- Use lowercase with hyphens (e.g., `epic-narrator`)
- Avoid spaces and special characters
- Be descriptive (e.g., `fantasy-bard`, `robot-announcer`)

**Display Name:**
- Auto-generated from folder name
- `epic-narrator` becomes "Epic Narrator"
- `robot-announcer` becomes "Robot Announcer"

### Step 2: Add Sound Files

Add your voice files with **consistent filenames**:

**Recommended Standard Filenames:**

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
sneak-attack.wav
ability-activated.wav
power-up.wav
```

**Status:**
```
low-health.wav
near-death.wav
death.wav
revival.wav
```

### Step 3: File Requirements

**Audio Format:**
- **Preferred:** WAV (44.1kHz, 16-bit)
- **Supported:** MP3, OGG, WEBM, M4A
- **Avoid:** Exotic formats, DRM-protected files

**File Size:**
- **Target:** Under 500KB each
- **Maximum:** 1MB (for performance)
- **Compress:** Use Audacity or similar

**Audio Quality:**
- **Normalize levels:** Peak at -3dB
- **Remove silence:** Trim start/end
- **Mono vs Stereo:** Mono is fine for voices
- **Sample rate:** 44.1kHz is standard

### Step 4: Test Your Pack

1. **Reload Foundry** to detect new pack
2. **Select your pack** in Module Settings
3. **Test each sound** with macro:

```javascript
game.toast.show([
  {
    type: "sound",
    src: game.toast.getAnnouncerSound("double-kill.wav"),
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

4. **Verify all files work**
5. **Check volume levels** are consistent

### Complete Example Structure

```
modules/toast/sounds/announcers/fantasy-bard/
├── critical-hit.wav        (300KB)
├── double-kill.wav         (350KB)
├── triple-kill.wav         (400KB)
├── killing-spree.wav       (450KB)
├── boss-defeated.wav       (500KB)
├── victory.wav             (380KB)
├── quest-complete.wav      (420KB)
├── level-up.wav            (290KB)
├── spell-cast.wav          (310KB)
└── finishing-blow.wav      (480KB)
```

---

## Multiple Languages

Create announcer packs for different languages!

### Example Structure

```
modules/toast/sounds/announcers/
├── english-narrator/
│   ├── critical-hit.wav    ("Critical hit!")
│   ├── victory.wav         ("Victory!")
│   └── boss-defeated.wav   ("Boss defeated!")
├── spanish-narrator/
│   ├── critical-hit.wav    ("¡Golpe crítico!")
│   ├── victory.wav         ("¡Victoria!")
│   └── boss-defeated.wav   ("¡Jefe derrotado!")
├── japanese-narrator/
│   ├── critical-hit.wav    ("クリティカルヒット！")
│   ├── victory.wav         ("勝利！")
│   └── boss-defeated.wav   ("ボス撃破！")
└── french-narrator/
    ├── critical-hit.wav    ("Coup critique!")
    ├── victory.wav         ("Victoire!")
    └── boss-defeated.wav   ("Boss vaincu!")
```

### Usage

**Your macros stay the same:**
```javascript
{
  type: "sound",
  src: game.toast.getAnnouncerSound("critical-hit.wav")
}
```

**GM just switches language** in settings dropdown!

### Tips for Language Packs

1. **Hire native speakers** for authenticity
2. **Use same voice actor** for all files in pack
3. **Match energy levels** across languages
4. **Provide pronunciation guide** if needed
5. **Test with native speakers**

---

## Themed Announcers

Create different packs for different campaign themes!

### Fantasy Campaign

```
modules/toast/sounds/announcers/fantasy-narrator/
├── spell-cast.wav          ("Arcane power unleashed!")
├── dragon-slain.wav        ("The dragon falls!")
├── critical-hit.wav        ("A mighty blow!")
├── victory.wav             ("Glory to the heroes!")
└── quest-complete.wav      ("Quest fulfilled!")
```

### Sci-Fi Campaign

```
modules/toast/sounds/announcers/sci-fi-computer/
├── ability-activated.wav   ("System online.")
├── target-eliminated.wav   ("Target neutralized.")
├── critical-hit.wav        ("Critical systems hit.")
├── victory.wav             ("Mission complete.")
└── quest-complete.wav      ("Objective achieved.")
```

### Horror Campaign

```
modules/toast/sounds/announcers/horror-whisperer/
├── spell-cast.wav          ("*whispered* Dark power...")
├── monster-killed.wav      ("*evil laugh*")
├── critical-hit.wav        ("*sinister* So much blood...")
├── victory.wav             ("*creepy* For now...")
└── death.wav               ("*whispered* Join us...")
```

### Comedy Campaign

```
modules/toast/sounds/announcers/sarcastic-narrator/
├── critical-hit.wav        ("Oh WOW, you hit something!")
├── critical-miss.wav       ("...really?")
├── victory.wav             ("You barely made it!")
├── death.wav               ("Well that was embarrassing.")
└── level-up.wav            ("You leveled up! Good job not dying!")
```

### Tips for Themed Packs

1. **Match tone to campaign** (serious, funny, dark)
2. **Use appropriate voice filters** (reverb for fantasy, robotic for sci-fi)
3. **Maintain consistency** within theme
4. **Consider background music** or effects
5. **Test with your group** for feedback

---

## Combining with Random Sounds

Use both features for maximum variety!

### Basic Combination

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

### With Weighted Random

```javascript
game.toast.show([
  // More common sounds play more often
  game.toast.weightedRandomSound([
    { src: game.toast.getAnnouncerSound("common-crit.wav"), weight: 70 },
    { src: game.toast.getAnnouncerSound("rare-crit.wav"), weight: 20 },
    { src: game.toast.getAnnouncerSound("legendary-crit.wav"), weight: 10 }
  ], { volume: 0.9 }),
  {
    type: "text",
    text: "CRITICAL!",
    color: "#ff0000",
    fontSize: "100px"
  }
]);
```

### Creating Variants

For each announcer pack, record multiple takes:

```
fantasy-bard/
├── crit-1.wav    (Same phrase, take 1)
├── crit-2.wav    (Same phrase, take 2)
├── crit-3.wav    (Same phrase, take 3)
├── victory-1.wav
├── victory-2.wav
└── victory-3.wav
```

**Benefits:**
- Same announcer, different energy
- Prevents repetition fatigue
- Adds natural variation
- All variants switch with announcer

---

## Tips and Best Practices

### Recording Tips

**Equipment:**
- Good microphone (USB condenser recommended)
- Pop filter (reduces plosives)
- Quiet room (minimal echo)
- Headphones for monitoring

**Recording:**
- Record at 44.1kHz, 16-bit
- Peak at -12dB to -6dB
- Do multiple takes
- Maintain consistent distance from mic
- Use same setup for entire pack

**Post-Processing:**
- Normalize to -3dB peak
- Remove background noise
- Trim silence from start/end
- Add slight compression for consistency
- Export as WAV or MP3

### Organization Tips

1. **Use consistent filenames** across all packs
2. **Create a naming standard** and stick to it
3. **Document your files** (voice actor, date, settings)
4. **Keep source files** separate from exports
5. **Version control** for updates

### Testing Tips

1. **Test every file** in-game before sharing
2. **Check volume levels** are consistent
3. **Verify with headphones** and speakers
4. **Get feedback** from your group
5. **Test different playback speeds**

### Audio Quality Tips

**Normalize Volume:**
```
All files should peak at -3dB to -1dB
Use Audacity: Effect → Normalize → -3dB
```

**Remove Silence:**
```
Trim silence from start (< 0.1s)
Trim silence from end (< 0.1s)
```

**Compress File Size:**
```
WAV: Use 16-bit, not 24-bit or 32-bit
MP3: Use 192kbps or 256kbps, not higher
OGG: Use quality 6-8
```

**Match Loudness:**
```
Use Audacity: Effect → Loudness Normalization
Target: -16 LUFS (for voice)
```

### Distribution Tips

1. **Include README.txt** with:
   - Voice actor credits
   - File list
   - Installation instructions
   - License info

2. **Package as ZIP:**
   ```
   announcer-pack-name.zip
   └── your-announcer-name/
       ├── README.txt
       ├── file1.wav
       ├── file2.wav
       └── ...
   ```

3. **Provide installation instructions:**
   ```
   Extract to: modules/toast/sounds/announcers/
   Reload Foundry
   Select from dropdown
   ```

4. **Share on community forums**

---

## Finding Voices

### Professional Voice Actors

**Fiverr:**
- $5-$50 per pack
- Search: "voice over game announcer"
- Request commercial license

**Voices.com:**
- Professional rates
- High quality
- Rights included

**Reddit r/VoiceActing:**
- Post request
- Many actors offer affordable rates

**Upwork:**
- Hire freelancers
- Set your budget

### Text-to-Speech (TTS)

**ElevenLabs:** (Recommended)
- Realistic AI voices
- Browse voice library
- Generate directly
- Commercial license available

**Azure Cognitive Services:**
- Microsoft TTS
- Many voices
- Pay per character

**Google Cloud TTS:**
- Google voices
- Good quality
- API integration

### Record Yourself

**Free Software:**
- **Audacity** (Windows, Mac, Linux)
- **GarageBand** (Mac)
- **Ocenaudio** (Windows, Mac, Linux)

**Voice Effects:**
- **Pitch shift** for different characters
- **Reverb** for fantasy/echo
- **Robot filter** for sci-fi
- **Whisper effect** for horror

**Tips:**
- Use a quiet room
- Position mic 6-12 inches away
- Use pop filter
- Do multiple takes
- Edit out mistakes

### Community Packs

**FoundryVTT Community:**
- Check Discord #modules channel
- Search Reddit r/FoundryVTT
- Browse official forums

**Share and Trade:**
- Swap packs with other GMs
- Collaborate on packs
- Contribute to community

---

## Sharing Your Packs

### Prepare for Distribution

1. **Create README.txt:**
   ```
   Announcer Pack: [Your Pack Name]
   Voice Actor: [Name or source]
   Created by: [Your name]
   Date: [Date]
   License: [License info]

   Files included:
   - critical-hit.wav
   - double-kill.wav
   - [etc...]

   Installation:
   1. Extract to modules/toast/sounds/announcers/
   2. Reload Foundry VTT
   3. Select from Module Settings dropdown

   Credits:
   [Voice actor credits, sources, etc.]
   ```

2. **Verify licenses:**
   - Ensure you have rights to share
   - Include license information
   - Credit voice actors

3. **Test completely:**
   - Every file works
   - Consistent volume
   - No corrupted files

### Package Your Pack

```
Create ZIP file:
your-pack-name.zip
└── your-pack-name/
    ├── README.txt
    ├── LICENSE.txt (optional)
    ├── sound1.wav
    ├── sound2.wav
    └── ...
```

### Share on Community

**FoundryVTT Discord:**
- #modules-showcase channel
- Post download link
- Include preview/samples

**Reddit r/FoundryVTT:**
- Post with [Resource] flair
- Include description
- Link to download

**GitHub:**
- Create repository
- Releases for versions
- Enable issues for feedback

**Your Own Site:**
- Host on website
- Create landing page
- Collect feedback

### Licensing Considerations

**If using TTS:**
- Check ElevenLabs commercial license
- Verify Azure/Google TTS rights
- Include attribution if required

**If hiring voice actors:**
- Get commercial license
- Include in contract
- Credit in README

**If recording yourself:**
- You own the rights
- Choose your license
- CC-BY or public domain popular

---

## Troubleshooting

### Pack Doesn't Appear in Dropdown

**Solutions:**
1. Verify folder name format (lowercase, hyphens)
2. Ensure folder is in correct location
3. Reload Foundry VTT completely
4. Check console for errors (F12)

### Sounds Don't Play

**Solutions:**
1. Check file exists at expected path
2. Verify filename matches exactly
3. Test file plays in browser
4. Check audio format is supported
5. Verify volume settings

### Inconsistent Volume

**Solutions:**
1. Normalize all files to -3dB peak
2. Use loudness normalization in Audacity
3. Re-export with consistent settings
4. Test with multiple playback devices

### Files Too Large

**Solutions:**
1. Compress to MP3 (192-256kbps)
2. Convert to OGG (quality 6-8)
3. Trim silence aggressively
4. Use mono instead of stereo

---

## Advanced: Module-Provided Packs

For module developers providing packs, see [Module Integration](MODULE-INTEGRATION.md).

---

## Example Packs

### Starter Pack Checklist

Minimum files for a functional pack:

- [ ] critical-hit.wav
- [ ] double-kill.wav
- [ ] triple-kill.wav
- [ ] victory.wav
- [ ] boss-defeated.wav

### Complete Pack Checklist

Full-featured announcer pack:

**Combat:**
- [ ] critical-hit.wav
- [ ] double-kill.wav
- [ ] triple-kill.wav
- [ ] killing-spree.wav
- [ ] unstoppable.wav
- [ ] finishing-blow.wav

**Victory:**
- [ ] victory.wav
- [ ] boss-defeated.wav
- [ ] enemy-eliminated.wav

**Achievements:**
- [ ] quest-complete.wav
- [ ] level-up.wav
- [ ] achievement-unlocked.wav

**Magic/Abilities:**
- [ ] spell-cast.wav
- [ ] ability-activated.wav
- [ ] divine-smite.wav

**Status:**
- [ ] low-health.wav
- [ ] near-death.wav
- [ ] death.wav

---

## Resources

- [Audacity](https://www.audacityteam.org/) - Free audio editor
- [ElevenLabs](https://elevenlabs.io) - AI voice generation
- [Freesound.org](https://freesound.org) - Free sound effects
- [FoundryVTT Discord](https://discord.gg/foundryvtt) - Community support

---

**Create epic announcer packs and share with the community!**
