# Installation Guide

Complete installation instructions for Toast - Full Screen Celebrations module for Foundry VTT.

## Table of Contents

- [Requirements](#requirements)
- [Installation Methods](#installation-methods)
- [Post-Installation Setup](#post-installation-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### System Requirements

- **Foundry VTT**: Version 13 or higher
- **Browser**: Modern browser with JavaScript enabled
  - Chrome/Edge 90+
  - Firefox 88+
  - Safari 14+
- **Connection**: Stable internet connection for all players

### Optional Requirements

For full feature support:

- **ElevenLabs API Key**: For Text-to-Speech (TTS) generation
  - Free tier: 10,000 characters/month
  - Sign up at [elevenlabs.io](https://elevenlabs.io)

- **AI API Keys** (for AI-Generated Announcements):
  - **Claude API Key** from [Anthropic](https://console.anthropic.com/settings/keys)
  - **OR OpenAI API Key** from [OpenAI](https://platform.openai.com/api-keys)

---

## Installation Methods

### Method 1: Manual Installation (Recommended)

1. **Download the Module**
   - Download the latest release from the repository
   - Extract the ZIP file

2. **Copy to Foundry Directory**
   ```
   [Foundry Data]/modules/toast/
   ```

   Where `[Foundry Data]` is your Foundry VTT data directory:
   - **Windows**: `%localappdata%/FoundryVTT/Data`
   - **macOS**: `~/Library/Application Support/FoundryVTT/Data`
   - **Linux**: `~/.local/share/FoundryVTT/Data`

3. **Verify File Structure**

   Ensure your directory looks like this:
   ```
   [Foundry Data]/modules/toast/
   ├── module.json
   ├── scripts/
   ├── styles/
   └── sounds/
   ```

4. **Restart or Reload**
   - Restart Foundry VTT completely
   - OR reload the modules list in your world

### Method 2: Foundry Module Browser

1. Open Foundry VTT
2. Go to **Add-on Modules** tab
3. Click **Install Module**
4. Search for "Toast - Full Screen Celebrations"
5. Click **Install**
6. Wait for installation to complete

### Method 3: Manifest URL

1. Open Foundry VTT
2. Go to **Add-on Modules** tab
3. Click **Install Module**
4. Paste the manifest URL:
   ```
   [Module Manifest URL]
   ```
5. Click **Install**

---

## Post-Installation Setup

### 1. Enable the Module

1. Launch your Foundry VTT world
2. Go to **Game Settings** → **Manage Modules**
3. Find "Toast - Full Screen Celebrations"
4. Check the checkbox to enable it
5. Click **Save Module Settings**
6. Reload the world when prompted

### 2. Configure Permissions (GM)

1. Go to **Configure Settings** → **Module Settings**
2. Find "Toast - Full Screen Celebrations"
3. Configure **Permission Mode**:
   - **GM Only** (default) - Most secure
   - **By Role** - Set minimum role level
   - **By Username** - Comma-separated usernames

### 3. Configure API Keys (Optional)

#### For TTS (Text-to-Speech):

1. Get an ElevenLabs API key from [elevenlabs.io](https://elevenlabs.io)
2. Go to **Module Settings** → **Toast - Full Screen Celebrations**
3. Enter your **ElevenLabs API Key**
4. Select a **Voice ID** (default: Rachel - "21m00Tcm4TlvDq8ikWAM")
5. Browse voices at [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)

#### For AI-Generated Announcements (GM):

**World Settings (GM manages keys):**

1. Go to **Module Settings** → **Toast - Full Screen Celebrations**
2. Enable **AI Text Generation**
3. Select **AI Provider** (Claude or OpenAI)
4. Enter your **Claude API Key (GM)** or **OpenAI API Key (GM)**
5. Configure **Share AI Keys With**:
   - **None (GM Only)** - Only GM pays for generation
   - **All Players** - Everyone can use GM's keys
   - **By Role** - Only certain roles
   - **By Username** - Specific usernames
6. Select **AI Model** (Claude 3.5 Sonnet, GPT-4o, etc.)
7. Adjust **Temperature** (0.7 = balanced, higher = more creative)

**Client Settings (Players using own keys):**

1. Go to **Module Settings** → **Toast - Full Screen Celebrations**
2. Enable **Use Own AI API Keys**
3. Select your **AI Provider**
4. Enter your API key
5. Configure OpenAI mode if needed

### 4. Configure Announcer Packs (Optional)

1. Go to **Module Settings** → **Toast - Full Screen Celebrations**
2. Select **Announcer Pack** from dropdown
3. Default: "Unreal Tournament" (included)
4. Additional packs can be added to:
   ```
   modules/toast/sounds/announcers/[pack-name]/
   ```

---

## Verification

### Test Basic Functionality

Run this macro to test if Toast is working:

```javascript
game.toast.show([
  {
    type: "text",
    text: "TOAST IS WORKING!",
    color: "#00ff00",
    fontSize: "100px",
    fontWeight: "bold",
    textShadow: "0 0 30px #00ff00",
    animation: {
      startX: window.innerWidth / 2 - 300,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

**Expected Result**: Green text "TOAST IS WORKING!" appears in center of screen for 2 seconds.

### Test Permissions

Check if you have permission:

```javascript
if (game.toast.hasPermission()) {
  ui.notifications.info("You can trigger toasts!");
} else {
  ui.notifications.warn("No toast permission");
}
```

### Test Sound

Test with included sample sound:

```javascript
game.toast.show([
  {
    type: "sound",
    src: "modules/toast/sounds/DOUBLE KILL.wav",
    volume: 0.8
  },
  {
    type: "text",
    text: "SOUND TEST!",
    color: "#ffff00",
    fontSize: "100px",
    animation: {
      startX: window.innerWidth / 2 - 250,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

**Expected Result**: You hear "DOUBLE KILL" voice and see yellow text.

### Test TTS (If Configured)

```javascript
await game.toast.showDynamic("boss-kill", {
  killer: "TestPlayer",
  boss: "TestDragon"
});
```

**Expected Result**: AI voice announces the template text.

### Test AI Generation (If Configured)

```javascript
await game.toast.showDynamicAI({
  prompt: "Announce this as an epic narrator",
  actor: { name: "TestHero" },
  target: { name: "TestMonster" },
  context: "test"
});
```

**Expected Result**: AI generates unique text and announces it.

---

## Troubleshooting

### Module Doesn't Appear

**Problem**: Toast doesn't show up in module list.

**Solutions**:
- Verify files are in correct directory: `[Foundry Data]/modules/toast/`
- Check that `module.json` exists in the toast folder
- Restart Foundry VTT completely (not just reload)
- Check Foundry console for errors (F12)

### Module Won't Enable

**Problem**: Checkbox won't stay checked or errors occur.

**Solutions**:
- Check Foundry console for error messages (F12)
- Verify Foundry VTT is version 13 or higher
- Try disabling other modules to check for conflicts
- Reinstall the module completely

### Toasts Don't Display

**Problem**: Macros run but nothing appears on screen.

**Solutions**:
- Check browser console for errors (F12)
- Verify you have permission: `game.toast.hasPermission()`
- Test locally first: `game.toast.showLocal([...])`
- Check if other overlays/modules are blocking display
- Disable browser ad blockers

### Permission Denied

**Problem**: "You don't have permission to trigger toasts" message.

**Solutions**:
- Ask GM to check permission settings
- Verify your username/role matches settings
- GM should check: **Module Settings** → **Toast** → **Permission Mode**

### Sounds Don't Play

**Problem**: Visual elements work but no audio.

**Solutions**:
- Check browser audio permissions
- Verify sound file path is correct
- Test sound file exists: Check in browser console
- Try different audio format (WAV, MP3, OGG)
- Check volume settings in browser and Foundry
- Verify file isn't corrupted

### TTS Not Working

**Problem**: TTS generation fails or doesn't play.

**Solutions**:
- Verify ElevenLabs API key is entered correctly
- Check API key is active at [elevenlabs.io](https://elevenlabs.io)
- Verify you haven't exceeded monthly character limit
- Check browser console for API error messages
- Try clearing TTS cache: `await game.toast.cache.clear()`

### AI Generation Not Working

**Problem**: AI text generation fails.

**Solutions**:
- Verify AI generation is enabled in GM settings
- Check API key is valid and active
- Verify spending limits aren't exceeded
- Check API service status (Claude/OpenAI)
- Ensure you have permission to use AI keys
- Try using fallback template option

### Multiple Toasts Stack Incorrectly

**Problem**: Toasts overlap or don't clear properly.

**Solutions**:
- Update to Toast v1.2.1 or later (fixed in this version)
- Wait for previous toast to complete before triggering new one
- Use appropriate duration settings

### Cache Issues

**Problem**: Old TTS audio plays or cache errors occur.

**Solutions**:
- Clear TTS cache: `await game.toast.cache.clear()`
- Clear browser cache and reload Foundry
- Check cache size: `await game.toast.cache.getSize()`
- Adjust cache size limit in module settings

---

## Uninstallation

If you need to remove Toast:

1. Disable the module in **Manage Modules**
2. Delete the module folder:
   ```
   [Foundry Data]/modules/toast/
   ```
3. Restart Foundry VTT
4. (Optional) Clear browser cache to remove cached TTS audio

---

## Getting Help

If you continue to experience issues:

1. Check the browser console for errors (F12)
2. Review the [Troubleshooting](../README.md#troubleshooting) section
3. Check other documentation files:
   - [Security Guide](SECURITY.md)
   - [AI Generation Guide](AI-GENERATION.md)
   - [Announcer Packs Guide](ANNOUNCER-PACKS.md)
4. Report bugs at [GitHub Issues](https://github.com/yourusername/toast/issues)

---

## Next Steps

After successful installation:

1. Review [Quick Start](../README.md#quick-start) guide
2. Explore [Sample Macros](../README.md#sample-macros)
3. Learn about [AI-Generated Announcements](AI-GENERATION.md)
4. Configure [Announcer Packs](ANNOUNCER-PACKS.md)
5. For module developers: See [Module Integration](MODULE-INTEGRATION.md)

---

**Installation complete!** You're ready to create epic moments in your game.
