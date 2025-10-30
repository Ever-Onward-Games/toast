# Toast Troubleshooting Guide

Complete troubleshooting guide for the Toast module for Foundry VTT.

## Table of Contents

- [Common Issues](#common-issues)
  - [Toast Doesn't Display](#toast-doesnt-display)
  - [Players Hear Different Sounds](#players-hear-different-sounds)
  - [Second Toast Stacks Incorrectly](#second-toast-stacks-incorrectly)
- [Permission Problems](#permission-problems)
  - [Permission Check Failed](#permission-check-failed)
  - [Players Can't Trigger Toasts](#players-cant-trigger-toasts)
  - [Console Shows Permission Errors](#console-shows-permission-errors)
- [Sound Issues](#sound-issues)
  - [Sound Doesn't Play](#sound-doesnt-play)
  - [Sound Plays But Can't Hear It](#sound-plays-but-cant-hear-it)
  - [Wrong Sound Plays](#wrong-sound-plays)
  - [Sound Cuts Off Early](#sound-cuts-off-early)
  - [Announcer Pack Sounds Not Working](#announcer-pack-sounds-not-working)
- [Visual Issues](#visual-issues)
  - [Text Is Cut Off](#text-is-cut-off)
  - [Elements Not Positioned Correctly](#elements-not-positioned-correctly)
  - [Images Not Loading](#images-not-loading)
  - [Token/Actor Images Not Showing](#tokenactor-images-not-showing)
- [Animation Problems](#animation-problems)
  - [Animation Looks Wrong](#animation-looks-wrong)
  - [Animation Too Fast/Slow](#animation-too-fastslow)
  - [Elements Don't Appear Staggered](#elements-dont-appear-staggered)
  - [CSS Animation Not Working](#css-animation-not-working)
- [AI Generation Errors](#ai-generation-errors)
  - [No AI API Key Configured](#no-ai-api-key-configured)
  - [AI Text Generation Not Enabled](#ai-text-generation-not-enabled)
  - [Request Timed Out](#request-timed-out)
  - [AI API Error Messages](#ai-api-error-messages)
  - [Permission Denied for AI](#permission-denied-for-ai)
- [TTS Errors](#tts-errors)
  - [No ElevenLabs API Key](#no-elevenlabs-api-key)
  - [TTS Generation Failed](#tts-generation-failed)
  - [Cached Audio Won't Play](#cached-audio-wont-play)
  - [Voice Sounds Wrong](#voice-sounds-wrong)
- [Template Errors](#template-errors)
  - [Template Not Found](#template-not-found)
  - [Missing Tokens Error](#missing-tokens-error)
  - [Template Won't Register](#template-wont-register)
  - [Template Renders Incorrectly](#template-renders-incorrectly)
- [Cache Issues](#cache-issues)
  - [Cache Growing Too Large](#cache-growing-too-large)
  - [Cache Won't Clear](#cache-wont-clear)
  - [Regenerating Audio After Cache Clear](#regenerating-audio-after-cache-clear)
- [Module Conflicts](#module-conflicts)
  - [Toast Module Not Loading](#toast-module-not-loading)
  - [game.toast Is Undefined](#gametoast-is-undefined)
  - [Conflicts with Other Modules](#conflicts-with-other-modules)
- [Diagnostic Commands](#diagnostic-commands)
- [Getting Help](#getting-help)

---

## Common Issues

### Toast Doesn't Display

**Symptoms:**
- Macro runs without errors
- Nothing appears on screen
- No visual elements show

**Solutions:**

1. **Check browser console for errors**
   ```javascript
   // Press F12 to open developer console
   // Look for red error messages
   ```

2. **Verify permissions**
   ```javascript
   // Run this to check permissions
   if (game.toast.hasPermission()) {
     console.log("You have permission");
   } else {
     console.log("No permission - check Module Settings");
   }
   ```

3. **Test locally first**
   ```javascript
   // Use showLocal to test without permissions
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

4. **Ensure module is enabled**
   - Go to **Manage Modules**
   - Check "Toast - Full Screen Celebrations" is enabled
   - Reload if needed

5. **Check element visibility**
   ```javascript
   // Make sure elements are on screen
   const centerX = window.innerWidth / 2 - 200;
   const centerY = window.innerHeight / 2 - 50;

   game.toast.showLocal([
     {
       type: "text",
       text: "CENTER SCREEN",
       fontSize: "80px",
       animation: { startX: centerX, startY: centerY, duration: 2 }
     }
   ]);
   ```

---

### Players Hear Different Sounds

**Symptoms:**
- Each player hears a different random sound
- Sounds not synchronized

**Problem:**
Using `Math.random()` on each client instead of `game.toast.randomSound()`.

**Wrong Way:**
```javascript
// DON'T DO THIS - each client picks randomly
const sounds = ["sound1.wav", "sound2.wav", "sound3.wav"];
const randomIndex = Math.floor(Math.random() * sounds.length);

game.toast.show([
  { type: "sound", src: sounds[randomIndex] }  // Different on each client!
]);
```

**Correct Way:**
```javascript
// DO THIS - selection happens before broadcast
game.toast.show([
  game.toast.randomSound([
    "sound1.wav",
    "sound2.wav",
    "sound3.wav"
  ], { volume: 0.9 })
]);
```

**Why This Matters:**
- `randomSound()` selects on triggering client
- Selected sound is included in broadcast
- All players hear the same sound
- Perfect synchronization

---

### Second Toast Stacks Incorrectly

**Symptoms:**
- New toast appears on top of old one
- Multiple overlays visible at once

**Solution:**
**Fixed in v1.2.1** - Update to the latest version.

The module automatically removes existing overlays before creating new ones.

**Manual Workaround (if needed):**
```javascript
// Clear existing toasts before showing new one
const existingOverlay = document.getElementById("toast-overlay");
if (existingOverlay) {
  existingOverlay.remove();
}

game.toast.show([...]);
```

---

## Permission Problems

### Permission Check Failed

**Symptoms:**
- Error: "You don't have permission to trigger toasts"
- `hasPermission()` returns false

**Solutions:**

1. **Check permission mode**
   - Open **Module Settings** → **Toast**
   - Check **Permission Mode** setting
   - Adjust as needed

2. **For "By Role" mode**
   - Check your role in **Configure Players**
   - Ensure your role meets minimum requirement
   - Contact GM to adjust allowed roles

3. **For "By Username" mode**
   - Check spelling of your username
   - Usernames are case-sensitive
   - Contact GM to add your username

4. **Verify your permission**
   ```javascript
   console.log("User:", game.user.name);
   console.log("Role:", game.user.role);
   console.log("Has Permission:", game.toast.hasPermission());
   ```

---

### Players Can't Trigger Toasts

**Symptoms:**
- GM can trigger toasts
- Players get permission errors

**Solutions:**

1. **GM: Configure permissions**
   - Open **Module Settings** → **Toast**
   - Change **Permission Mode** from "GM Only"
   - Select "By Role" or "By Username"
   - Configure allowed roles/usernames

2. **Verify settings saved**
   - Changes should save automatically
   - Refresh page if needed
   - Have players reload

3. **Test permission**
   ```javascript
   // Player runs this
   if (game.toast.hasPermission()) {
     game.toast.show([
       { type: "text", text: "Permission works!" }
     ]);
   } else {
     ui.notifications.error("Still no permission");
   }
   ```

---

### Console Shows Permission Errors

**Symptoms:**
- Red errors in console
- "Socket request denied"
- "Invalid permission"

**Solutions:**

1. **Don't bypass security**
   - Always use `game.toast.show()`
   - Don't manipulate sockets directly
   - Don't try to bypass permission checks

2. **Check GM is online**
   - Permission validation requires GM
   - GM must be connected
   - Wait for GM to join

3. **Verify module settings**
   - GM should check settings are correct
   - Ensure permissions properly configured
   - Test with known working configuration

---

## Sound Issues

### Sound Doesn't Play

**Symptoms:**
- Toast displays but no audio
- No errors in console

**Solutions:**

1. **Verify file path**
   ```javascript
   // Test if file exists
   const audio = new Audio("sounds/test.wav");
   audio.play().then(() => {
     console.log("Sound file works!");
   }).catch(err => {
     console.error("Sound file not found:", err);
   });
   ```

2. **Check file format**
   - Supported: MP3, OGG, WAV, WEBM, M4A
   - Convert if needed
   - Test different format

3. **Verify path syntax**
   ```javascript
   // Correct paths
   "sounds/mysound.wav"                    // World folder
   "modules/toast/sounds/sample.wav"       // Module folder
   "modules/mymodule/sounds/effect.wav"    // Other module

   // Check for typos
   "sounds/mysound.wav"  // correct
   "sound/mysound.wav"   // wrong - missing 's'
   "sounds\\mysound.wav" // wrong on web - use forward slashes
   ```

4. **Test with known working sound**
   ```javascript
   // Test with included sample
   game.toast.show([
     {
       type: "sound",
       src: "modules/toast/sounds/DOUBLE KILL.wav",
       volume: 0.9
     }
   ]);
   ```

---

### Sound Plays But Can't Hear It

**Symptoms:**
- Console shows sound playing
- No audio output

**Solutions:**

1. **Check browser audio permissions**
   - Click lock icon in address bar
   - Ensure sound is allowed
   - Reload page

2. **Check volume levels**
   ```javascript
   // Test with max volume
   game.toast.show([
     {
       type: "sound",
       src: "sounds/test.wav",
       volume: 1.0  // Maximum volume
     }
   ]);
   ```

3. **Check Foundry audio settings**
   - Open **Settings** → **Configure Audio**
   - Check Interface volume
   - Check system sound is not muted

4. **Check system audio**
   - Verify speakers/headphones working
   - Check system volume
   - Test with other applications

5. **Browser audio policy**
   - Some browsers block autoplay
   - Interact with page first (click something)
   - Then trigger toast

---

### Wrong Sound Plays

**Symptoms:**
- Different sound than expected
- Old sound plays instead of new one

**Solutions:**

1. **Check file path**
   ```javascript
   // Verify exact path
   console.log("Playing:", "sounds/mysound.wav");
   ```

2. **Clear browser cache**
   - Press Ctrl+Shift+R (hard refresh)
   - Or clear browser cache in settings
   - Reload Foundry

3. **Check file was uploaded**
   - Verify file exists in expected location
   - Check File Browser in Foundry
   - Re-upload if needed

4. **Check for filename conflicts**
   - Multiple files with same name
   - In different folders
   - Use full path to be specific

---

### Sound Cuts Off Early

**Symptoms:**
- Sound starts playing
- Stops before finishing

**Solutions:**

1. **Check animation duration**
   ```javascript
   // Make sure toast displays long enough
   game.toast.show([
     {
       type: "sound",
       src: "sounds/long-sound.wav"  // 5 second sound
     },
     {
       type: "text",
       text: "TEXT",
       animation: {
         duration: 6  // Longer than sound duration
       }
     }
   ]);
   ```

2. **Use delay for multiple sounds**
   ```javascript
   game.toast.show([
     { type: "sound", src: "sound1.wav" },
     { type: "sound", src: "sound2.wav", delay: 3 }  // Wait 3 seconds
   ]);
   ```

3. **Check file integrity**
   - File may be corrupted
   - Test in audio player
   - Re-export/re-encode

---

### Announcer Pack Sounds Not Working

**Symptoms:**
- `getAnnouncerSound()` returns null
- Announcer pack sounds won't play

**Solutions:**

1. **Check announcer pack selected**
   ```javascript
   // Check what's selected
   const pack = game.settings.get("toast", "announcer-pack");
   console.log("Selected pack:", pack);
   ```

2. **Verify file exists**
   ```javascript
   // Test if file is found
   const path = game.toast.getAnnouncerSound("double-kill.wav");
   console.log("Resolved path:", path);

   if (path === null) {
     console.error("File not found in announcer pack");
   }
   ```

3. **Check file structure**
   ```
   modules/toast/sounds/announcers/
   └── your-pack-name/
       ├── double-kill.wav  ← Must exist
       ├── triple-kill.wav
       └── ...
   ```

4. **Reload Foundry**
   - Announcer packs scanned on startup
   - Changes require reload
   - Check packs appear in settings

---

## Visual Issues

### Text Is Cut Off

**Symptoms:**
- Text appears but is truncated
- Edge of text off screen

**Solutions:**

1. **Reduce font size**
   ```javascript
   {
     type: "text",
     text: "VERY LONG TEXT HERE",
     fontSize: "60px"  // Smaller size
   }
   ```

2. **Adjust position**
   ```javascript
   // Center text properly
   const textWidth = 600;  // Estimate text width
   const centerX = window.innerWidth / 2 - (textWidth / 2);

   {
     animation: {
       startX: centerX,
       startY: window.innerHeight / 2
     }
   }
   ```

3. **Split into multiple elements**
   ```javascript
   game.toast.show([
     {
       type: "text",
       text: "DOUBLE",
       fontSize: "90px",
       animation: {
         startX: window.innerWidth / 2 - 300,
         startY: window.innerHeight / 2
       }
     },
     {
       type: "text",
       text: "KILL!",
       fontSize: "90px",
       animation: {
         startX: window.innerWidth / 2 + 50,
         startY: window.innerHeight / 2
       }
     }
   ]);
   ```

4. **Use shorter text**
   ```javascript
   // Instead of
   "This is a very long announcement text!"

   // Use
   "ANNOUNCEMENT!"
   ```

---

### Elements Not Positioned Correctly

**Symptoms:**
- Elements off screen
- Wrong position

**Solutions:**

1. **Use positioning helpers**
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
   ```

2. **Test with showLocal**
   ```javascript
   // Test positioning locally first
   game.toast.showLocal([
     {
       type: "text",
       text: "TEST POSITION",
       fontSize: "80px",
       animation: {
         startX: window.innerWidth / 2 - 300,
         startY: window.innerHeight / 2 - 40
       }
     }
   ]);
   ```

3. **Account for element size**
   ```javascript
   // For 600px wide element
   const elementWidth = 600;
   const startX = window.innerWidth / 2 - (elementWidth / 2);
   ```

---

### Images Not Loading

**Symptoms:**
- Broken image icon
- Image doesn't appear

**Solutions:**

1. **Verify image path**
   ```javascript
   // Test if image loads
   const img = new Image();
   img.src = "path/to/image.png";
   img.onload = () => console.log("Image loaded!");
   img.onerror = () => console.error("Image not found!");
   ```

2. **Check image format**
   - Supported: PNG, JPG, WebP, GIF, SVG
   - Convert if needed
   - Verify file not corrupted

3. **Check CORS for external images**
   ```javascript
   // External images may have CORS restrictions
   // Use images hosted on same domain
   // Or host images in Foundry
   ```

4. **Use relative paths**
   ```javascript
   // Good
   "modules/toast/images/icon.png"
   "worlds/myworld/images/logo.png"

   // Bad (absolute paths may not work)
   "C:/Users/name/foundry/images/icon.png"
   ```

---

### Token/Actor Images Not Showing

**Symptoms:**
- tokenImage or actorImage element doesn't appear
- Error about invalid token/actor

**Solutions:**

1. **Verify token exists**
   ```javascript
   const token = canvas.tokens.controlled[0];
   if (!token) {
     console.error("No token selected!");
     return;
   }

   console.log("Token ID:", token.id);
   ```

2. **Validate before using**
   ```javascript
   const result = game.toast.resolveElement({
     type: "tokenImage",
     tokenId: token.id
   });

   console.log("Valid:", result.valid);
   console.log("Error:", result.error);
   ```

3. **Check actor exists**
   ```javascript
   const actor = game.actors.get("actorIdHere");
   if (!actor) {
     console.error("Actor not found!");
   }
   ```

4. **Use correct ID**
   ```javascript
   // Token ID (for tokens on canvas)
   const tokenId = token.id;  // or token.document.id

   // Actor ID (for actors in sidebar)
   const actorId = actor.id;
   ```

---

## Animation Problems

### Animation Looks Wrong

**Symptoms:**
- Elements move incorrectly
- Animation doesn't match expectation

**Solutions:**

1. **Check start/end positions**
   ```javascript
   {
     animation: {
       startX: 0,           // Left edge
       endX: window.innerWidth / 2,  // Center
       startY: window.innerHeight / 2,
       duration: 2
     }
   }
   ```

2. **Try different easing**
   ```javascript
   {
     animation: {
       easing: "ease-out"    // Try: ease-in, ease-out, ease-in-out, linear
     }
   }
   ```

3. **Test with showLocal**
   ```javascript
   // Iterate quickly with local testing
   game.toast.showLocal([...]);
   ```

4. **Simplify animation**
   ```javascript
   // Start simple
   {
     animation: {
       startX: window.innerWidth / 2 - 200,
       startY: window.innerHeight / 2 - 50,
       duration: 2
     }
   }

   // Then add complexity
   {
     animation: {
       startX: -400,
       endX: window.innerWidth / 2 - 200,
       startY: window.innerHeight / 2 - 50,
       scale: 1.2,
       duration: 2,
       easing: "ease-out"
     }
   }
   ```

---

### Animation Too Fast/Slow

**Symptoms:**
- Animation completes too quickly or slowly

**Solutions:**

1. **Adjust duration**
   ```javascript
   {
     animation: {
       duration: 3  // Try different values: 1, 2, 3, 4, 5
     }
   }
   ```

2. **Use standard durations**
   ```javascript
   // Fast impact
   duration: 1

   // Standard
   duration: 2

   // Dramatic
   duration: 3-4

   // Very slow (not recommended)
   duration: 5+
   ```

3. **Match sound duration**
   ```javascript
   // If sound is 4 seconds, animation should be 4+ seconds
   game.toast.show([
     { type: "sound", src: "4-second-sound.wav" },
     { type: "text", text: "TEXT", animation: { duration: 4 } }
   ]);
   ```

---

### Elements Don't Appear Staggered

**Symptoms:**
- All elements appear at once
- Stagger timing not working

**Solutions:**

1. **Use delay parameter**
   ```javascript
   game.toast.show([
     // First element - no delay
     {
       type: "shape",
       animation: { delay: 0, duration: 0.5 }
     },
     // Second element - appears 0.3s later
     {
       type: "text",
       animation: { delay: 0.3, duration: 0.8 }
     },
     // Third element - appears 0.6s later
     {
       type: "image",
       animation: { delay: 0.6, duration: 0.5 }
     }
   ]);
   ```

2. **Increment delays**
   ```javascript
   // Each element 0.2s apart
   const elements = ["ONE", "TWO", "THREE"].map((text, index) => ({
     type: "text",
     text: text,
     animation: {
       startX: 100,
       startY: 100 + (index * 80),
       delay: index * 0.2,  // 0s, 0.2s, 0.4s
       duration: 1
     }
   }));

   game.toast.show(elements);
   ```

---

### CSS Animation Not Working

**Symptoms:**
- Custom CSS animation doesn't play
- Built-in CSS animations not working

**Solutions:**

1. **Verify animation name**
   ```javascript
   {
     animation: {
       cssAnimation: "toast-slide-left-right"  // Must match exactly
     }
   }
   ```

2. **Check built-in animations**
   - `toast-slide-left-right`
   - `toast-slide-right-left`
   - `toast-slide-top-bottom`
   - `toast-slide-bottom-top`

3. **For custom animations, verify CSS loaded**
   ```css
   /* Must be defined in your CSS */
   @keyframes my-custom-animation {
     0% { transform: translateX(-100vw); }
     50% { transform: translateX(0); }
     100% { transform: translateX(100vw); }
   }
   ```

4. **Provide centerX and centerY**
   ```javascript
   {
     animation: {
       cssAnimation: "toast-slide-left-right",
       centerX: window.innerWidth / 2 - 200,  // Required!
       centerY: window.innerHeight / 2 - 50,  // Required!
       duration: 2
     }
   }
   ```

---

## AI Generation Errors

### No AI API Key Configured

**Error Message:**
"No AI API key configured"

**Solutions:**

1. **Configure your own API key**
   - Open **Module Settings** → **Toast**
   - Enable **Use Own AI API Keys**
   - Select **AI Provider**
   - Enter your **API Key**

2. **Ask GM to share keys**
   - GM needs to enable **AI Text Generation**
   - GM must configure **Share AI Keys With**
   - Check you meet sharing criteria (role/username)

3. **Verify settings saved**
   - Save settings
   - Reload page
   - Try again

---

### AI Text Generation Not Enabled

**Error Message:**
"AI text generation is not enabled"

**Solutions:**

1. **GM must enable AI generation**
   - Open **Module Settings** → **Toast**
   - Enable **AI Text Generation** (world setting)
   - Configure AI provider and key

2. **Check world settings vs client settings**
   - World settings = GM controls
   - Client settings = individual users
   - Both must be configured appropriately

---

### Request Timed Out

**Error Message:**
"AI request timed out after 10 seconds"

**Solutions:**

1. **Click "Retry"**
   - API may have been slow
   - Try one more time
   - Usually works on retry

2. **Use fallback template**
   - Provide `fallbackTemplate` in config
   - Falls back automatically on timeout
   ```javascript
   await game.toast.showDynamicAI({
     prompt: "...",
     actor: {...},
     fallbackTemplate: "boss-kill"  // Use this if AI fails
   });
   ```

3. **Check API service status**
   - Anthropic status: https://status.anthropic.com
   - OpenAI status: https://status.openai.com
   - May be temporary outage

4. **Simplify prompt**
   ```javascript
   // Instead of complex prompt
   prompt: "Describe this in detail with multiple sentences and elaborate context"

   // Try simple prompt
   prompt: "Epic fantasy narrator"
   ```

---

### AI API Error Messages

**Common Errors:**

**"Invalid API key"**
- Check key is correct
- No extra spaces
- Key not expired
- Key has proper permissions

**"Rate limit exceeded"**
- Too many requests
- Wait a few minutes
- Check API dashboard for limits

**"Insufficient credits"**
- Account out of credits
- Add payment method
- Check billing dashboard

**"Model not available"**
- Selected model may not exist
- Try different model
- Check provider documentation

**Solutions:**

1. **Verify API key**
   ```javascript
   // Check key format
   // Claude: starts with "sk-ant-"
   // OpenAI: starts with "sk-"
   ```

2. **Check API dashboard**
   - Claude: https://console.anthropic.com
   - OpenAI: https://platform.openai.com
   - Verify credits, limits, status

3. **Set spending limits**
   - Claude: https://console.anthropic.com/settings/limits
   - OpenAI: https://platform.openai.com/account/limits

4. **Use fallback template**
   - Always provide fallback for production use
   ```javascript
   fallbackTemplate: "boss-kill"
   ```

---

### Permission Denied for AI

**Error Message:**
"You don't have permission to use AI text generation"

**Solutions:**

1. **Use own API keys**
   - Configure your own keys in client settings
   - Don't rely on GM's shared keys

2. **Ask GM to grant access**
   - GM controls **Share AI Keys With** setting
   - May need to add your role/username

3. **Verify role/username**
   - Check you meet sharing criteria
   - Case-sensitive username matching

---

## TTS Errors

### No ElevenLabs API Key

**Error Message:**
"No ElevenLabs API key configured"

**Solutions:**

1. **Get API key**
   - Sign up at https://elevenlabs.io
   - Navigate to Profile
   - Copy your API key

2. **Configure in settings**
   - Open **Module Settings** → **Toast**
   - Enter **ElevenLabs API Key**
   - Save settings

3. **Verify key is valid**
   - Test on ElevenLabs website
   - Check not expired
   - Check has credits

---

### TTS Generation Failed

**Error Message:**
"Failed to generate TTS audio"

**Solutions:**

1. **Check API key**
   - Verify key is correct
   - No extra spaces
   - Not expired

2. **Check voice ID**
   - Verify voice ID is valid
   - Test different voice
   - Default: "21m00Tcm4TlvDq8ikWAM" (Rachel)

3. **Check text length**
   - ElevenLabs has character limits
   - Keep announcements under 5000 characters
   - Usually use 100-200 characters

4. **Check credits**
   - Free tier: 10,000 characters/month
   - Check usage on ElevenLabs dashboard
   - Add payment method if needed

5. **Check network**
   - Firewall may block API
   - Try different network
   - Check browser network tab

---

### Cached Audio Won't Play

**Symptoms:**
- TTS generates successfully
- Cached audio doesn't play on subsequent use

**Solutions:**

1. **Clear cache and regenerate**
   ```javascript
   await game.toast.cache.clear();
   // Then trigger toast again
   ```

2. **Check cache size**
   ```javascript
   const size = await game.toast.cache.getSize();
   const count = await game.toast.cache.getCount();
   console.log(`Cache: ${count} files, ${size} bytes`);
   ```

3. **Check browser storage**
   - Browser may have storage limits
   - Clear browser data
   - Reload Foundry

4. **Disable cache temporarily**
   - Settings → Toast → Disable TTS Cache
   - Test if works without caching
   - Re-enable after testing

---

### Voice Sounds Wrong

**Symptoms:**
- Voice doesn't match expected
- Wrong accent/tone
- Pronunciation issues

**Solutions:**

1. **Change voice ID**
   - Browse https://elevenlabs.io/voice-library
   - Copy voice ID you want
   - Update in settings

2. **Test pronunciation**
   ```javascript
   // Try spelling out numbers
   "eighty-nine damage" instead of "89 damage"

   // Try phonetic spelling
   "Aahlice" instead of "Alice" if mispronounced
   ```

3. **Use ElevenLabs v3 bracket notation**
   ```javascript
   prompt: "[angry] Announce this with fury"
   prompt: "[gentle] Speak softly"
   prompt: "[excited] Sports announcer style"
   ```

4. **Adjust template text**
   - Simpler sentences
   - Remove special characters
   - Use common words

---

## Template Errors

### Template Not Found

**Error Message:**
"Template 'template-id' not found"

**Solutions:**

1. **List available templates**
   ```javascript
   const templates = game.toast.templates.list();
   console.log("Available templates:", templates.map(t => t.id));
   ```

2. **Check template ID spelling**
   - Case-sensitive
   - Check for typos
   - Use exact ID

3. **Register template first**
   ```javascript
   // Must register before using
   game.toast.templates.register("my-template", {
     template: "...",
     tags: ["custom"],
     duration: 3
   });

   // Then use it
   await game.toast.showDynamic("my-template", {...});
   ```

4. **Built-in templates**
   - `boss-kill`
   - `epic-defeat`
   - `clutch-heal`
   - `life-saver`
   - `triple-kill`
   - `killing-spree`
   - `clutch-save`
   - `perfect-shot`
   - `quest-complete`
   - `level-up`

---

### Missing Tokens Error

**Error Message:**
"Missing tokens for template 'template-id': token1, token2"

**Solutions:**

1. **Check template tokens**
   ```javascript
   const template = game.toast.templates.get("boss-kill");
   console.log("Required tokens:", template.tokens);
   ```

2. **Provide all required tokens**
   ```javascript
   // Boss-kill needs: killer, boss
   await game.toast.showDynamic("boss-kill", {
     killer: "Bob",  // ✓
     boss: "Dragon"  // ✓
   });
   ```

3. **Check token names**
   - Case-sensitive
   - Exact spelling
   - No extra spaces

4. **Use render to test**
   ```javascript
   const text = game.toast.templates.render("boss-kill", {
     killer: "Bob",
     boss: "Dragon"
   });

   if (text === null) {
     console.error("Missing tokens!");
   } else {
     console.log("Rendered:", text);
   }
   ```

---

### Template Won't Register

**Symptoms:**
- `register()` returns false
- Template doesn't appear in list

**Solutions:**

1. **Check template ID**
   - Must be unique
   - Can't register same ID twice
   - Delete old one first

2. **Verify template structure**
   ```javascript
   game.toast.templates.register("my-template", {
     template: "Text with {token}",  // Required
     tags: ["tag1", "tag2"],         // Optional
     duration: 3                     // Optional
   });
   ```

3. **Delete and re-register**
   ```javascript
   game.toast.templates.delete("my-template");
   game.toast.templates.register("my-template", {...});
   ```

---

### Template Renders Incorrectly

**Symptoms:**
- Tokens not replaced
- {token} appears in output
- Grammar issues

**Solutions:**

1. **Check token syntax**
   ```javascript
   // Correct
   "{player} defeats {enemy}"

   // Wrong - no curly braces
   "player defeats enemy"

   // Wrong - spaces in token name
   "{player name} defeats {enemy}"
   ```

2. **Verify token names match**
   ```javascript
   // Template
   template: "{killer} defeats {boss}"

   // Tokens must match exactly
   tokens: {
     killer: "Bob",    // ✓ matches
     boss: "Dragon"    // ✓ matches
   }

   // Wrong - doesn't match
   tokens: {
     player: "Bob",    // ✗ template expects "killer"
     enemy: "Dragon"   // ✗ template expects "boss"
   }
   ```

---

## Cache Issues

### Cache Growing Too Large

**Symptoms:**
- Cache size over 100 MB
- Storage warnings in console

**Solutions:**

1. **Clear cache**
   ```javascript
   await game.toast.cache.clear();
   ui.notifications.info("Cache cleared");
   ```

2. **Check cache size**
   ```javascript
   const size = await game.toast.cache.getSize();
   const sizeMB = (size / 1024 / 1024).toFixed(2);
   console.log(`Cache: ${sizeMB} MB`);
   ```

3. **Adjust cache size limit**
   - Settings → Toast → Cache Size
   - Increase limit if you have storage
   - Or decrease to force cleanup

4. **Clear periodically**
   - Clear cache monthly
   - Or after major campaign milestones
   - Cache will rebuild automatically

---

### Cache Won't Clear

**Symptoms:**
- `cache.clear()` doesn't reduce size
- Cache size stays the same

**Solutions:**

1. **Clear browser data**
   - Browser settings → Clear data
   - Select "Indexed DB" or "Site data"
   - Reload Foundry

2. **Use browser devtools**
   - F12 → Application tab
   - IndexedDB → toast-tts
   - Right-click → Delete database

3. **Try different browser**
   - Test in another browser
   - May be browser-specific issue

---

### Regenerating Audio After Cache Clear

**Symptoms:**
- After clearing cache, TTS must regenerate
- Costs API credits again

**Expected Behavior:**
- Cache clear removes all cached audio
- Next use will regenerate and re-cache
- This is normal

**To Minimize:**
- Only clear cache when necessary
- Don't clear unless troubleshooting
- Cache saves money long-term

---

## Module Conflicts

### Toast Module Not Loading

**Symptoms:**
- Module not in module list
- Can't enable module

**Solutions:**

1. **Check installation**
   - Verify `toast` folder in `Data/modules`
   - Check `module.json` exists
   - Restart Foundry

2. **Check Foundry version**
   - Requires FVTT v13+
   - Update Foundry if needed

3. **Check console for errors**
   - Look for module load errors
   - May conflict with another module

---

### game.toast Is Undefined

**Symptoms:**
- `game.toast` is undefined
- Console error: "Cannot read property 'show' of undefined"

**Solutions:**

1. **Ensure module is enabled**
   - Manage Modules → Enable Toast
   - Reload world

2. **Check timing**
   ```javascript
   // Run after ready
   Hooks.once('ready', () => {
     console.log("Toast API:", game.toast);  // Should exist
   });
   ```

3. **Module load order**
   - Toast registers on `ready` hook
   - Don't call before `ready`

---

### Conflicts with Other Modules

**Symptoms:**
- Toast works alone but not with other modules
- Errors when other modules enabled

**Solutions:**

1. **Disable modules one by one**
   - Identify conflicting module
   - Report to module developers

2. **Check console for conflicts**
   - Look for JavaScript errors
   - May show conflicting module name

3. **Update all modules**
   - Outdated modules may conflict
   - Update to latest versions

---

## Diagnostic Commands

Run these in console (F12) to diagnose issues:

**Check Permission:**
```javascript
console.log("Has Permission:", game.toast.hasPermission());
console.log("User:", game.user.name);
console.log("Role:", game.user.role);
```

**List Templates:**
```javascript
const templates = game.toast.templates.list();
console.table(templates);
```

**Check Cache:**
```javascript
const size = await game.toast.cache.getSize();
const count = await game.toast.cache.getCount();
console.log(`Cache: ${count} files, ${(size/1024/1024).toFixed(2)} MB`);
```

**Test Element:**
```javascript
const result = game.toast.resolveElement({
  type: "sound",
  src: "sounds/test.wav"
});
console.log("Valid:", result.valid);
console.log("Error:", result.error);
```

**Test Announcer Sound:**
```javascript
const path = game.toast.getAnnouncerSound("double-kill.wav");
console.log("Resolved path:", path);
```

**Test Local Toast:**
```javascript
game.toast.showLocal([
  {
    type: "text",
    text: "TEST",
    fontSize: "100px",
    color: "#ff0000",
    animation: {
      startX: window.innerWidth / 2 - 200,
      startY: window.innerHeight / 2 - 50,
      duration: 2
    }
  }
]);
```

---

## Getting Help

### Before Asking for Help

1. **Check browser console for errors** (F12)
2. **Try with `showLocal()` to isolate issue**
3. **Verify module is enabled and updated**
4. **Try disabling other modules**
5. **Check this troubleshooting guide**

### When Asking for Help

**Provide:**
- Foundry VTT version
- Toast module version
- Browser and version
- Console errors (screenshot or text)
- Macro code you're running
- Steps to reproduce

**Where to Ask:**
- GitHub Issues: https://github.com/yourusername/toast/issues
- FoundryVTT Discord: #module-discussion
- FoundryVTT Reddit: /r/FoundryVTT

### Reporting Bugs

**Include:**
1. **Description:** What's wrong?
2. **Expected:** What should happen?
3. **Actual:** What actually happens?
4. **Steps:** How to reproduce?
5. **Errors:** Console errors?
6. **Environment:** Foundry version, browser, OS?

**Example Good Bug Report:**
```
Title: Toast doesn't display on second trigger

Description: First toast works fine, but second toast in same session
doesn't appear.

Expected: Each toast should display regardless of previous toasts.

Actual: Only first toast displays. Subsequent toasts don't show.

Steps:
1. Enable Toast module
2. Run macro with game.toast.show()
3. Wait for toast to finish
4. Run macro again
5. No toast appears

Errors: None in console

Environment:
- Foundry VTT v13.331
- Toast v2.0.0
- Chrome 120
- Windows 11
```

---

For more information:
- [API-REFERENCE.md](./API-REFERENCE.md) - Complete API documentation
- [TEMPLATES.md](./TEMPLATES.md) - Template system guide
- Main [README.md](../README.md) - Full module documentation
