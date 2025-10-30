# Toast Module - Feature Planning

## Completed Features

### ✅ Phase 1: Template System (v1.4.0)
- Template registration with `{token}` replacement
- Built-in templates for common scenarios
- Token validation and rendering
- Template management API

### ✅ Phase 2: ElevenLabs TTS Integration (v1.5.0)
- Text-to-speech generation via ElevenLabs API
- IndexedDB caching system
- Synchronized audio playback
- Per-user API keys
- `game.toast.showDynamic()` API method

---

## Phase 3: AI Text Generation (In Planning)

### Goal
Generate dynamic, contextual announcement text using AI (Claude/GPT) before sending to ElevenLabs TTS.

### Vision
Instead of fixed templates with token replacement, use AI to generate unique, contextual announcements based on:
- Character/actor data
- Combat/action context
- Recent chat/combat history
- Desired narrative style

### Example Use Cases

**Input:**
```javascript
await game.toast.showDynamicAI({
  actor: aliceActor,           // Actor object
  target: dragonActor,         // Target actor object
  context: "finishing-blow",   // What happened
  chatHistory: last5Messages,  // Recent combat log
  style: "epic-narrator"       // Tone/style
});
```

**Possible Outputs (AI-generated):**

**Style: "epic-narrator"**
> "With a mighty blow from her trusted axe, Alice laid the dragon low, and stood over its corpse triumphantly."

**Style: "hype-announcer"**
> "AND ALICE WITH THE FINISHING BLOW ON THE DRAGON! THE FIGHT IS OVER!"

**Style: "tactical-callout"**
> "Target down. Alice eliminated the dragon using her greataxe. Area secure."

**Style: "poetic"**
> "As steel met scale in destiny's dance, Alice claimed victory over the wyrm's final breath."

---

## Technical Design Questions

### 1. AI Provider ✅ DECIDED
**Decision:** Support multiple providers with user selection

**Supported Providers:**
- **Anthropic Claude**
  - Models: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
  - Custom system prompts per style
  - **Prompt caching** for character/campaign context (cost optimization)

- **OpenAI ChatGPT**
  - Models: gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo
  - **Custom GPTs** via Assistants API
  - **Fine-tuned models** via custom model ID

**Implementation:**
- Dropdown to select provider (Claude, OpenAI)
- Model selection dropdown (populated based on provider)
- For OpenAI: Toggle for "Use Custom GPT" or "Use Fine-tuned Model"
- For OpenAI Custom GPT: Assistant ID input
- For OpenAI Fine-tuned: Custom model ID input
- For Claude: Enable prompt caching toggle
- Separate API key per provider (client-scoped)

### 2. API Key Management ✅ DECIDED
**Decision:** Hybrid approach - GM-controlled with optional sharing + user override

**Implementation:**
- **World Settings** (GM only):
  - Claude API Key
  - OpenAI API Key
  - Share AI Keys With: (dropdown: None, All Players, By Role, By Username)
  - If "By Role": Allowed Roles (checkboxes)
  - If "By Username": Allowed Usernames (comma-separated)

- **Client Settings** (per-user):
  - Use Own API Keys (toggle)
  - If enabled: Claude API Key, OpenAI API Key
  - Overrides GM keys if provided

**Permission Flow:**
1. Check if user can trigger toasts (existing permission system)
2. Check if user has access to AI API key:
   - User has own key configured? → Use it
   - GM sharing keys AND user has permission? → Use GM's key
   - Neither? → Cannot use AI generation (fall back to templates)
3. Generate announcement if both checks pass

**Cost Model:**
- GM pays if using GM's shared keys
- User pays if using their own keys
- Clear in UI which key is being used

### 3. Context Building ✅ DECIDED
**Decision:** User-defined context mapping (system-agnostic)

**Rationale:**
- Users know what data matters for their game system
- Makes module work with ANY game system (D&D 5e, PF2e, etc.)
- Avoids complex Foundry data parsing
- Maximum flexibility for custom/homebrew fields
- AI can interpret structured JSON naturally

**Implementation:**
- Users pass plain JavaScript objects with whatever properties they want
- No predefined schema or required fields
- AI receives structured JSON and figures out what matters
- Module just passes data through to AI (no parsing needed)

**Example:**
```javascript
await game.toast.showDynamicAI({
  actor: {
    name: "Alice",
    class: "Paladin",
    level: 8,
    hp: 45,
    maxHp: 68,
    weapon: "Holy Avenger Longsword"
  },
  target: {
    name: "Ancient Red Dragon",
    type: "Dragon",
    cr: 24,
    description: "Terrorizing the village for decades"
  },
  context: "finishing-blow",
  damageDealt: 89,
  abilityUsed: "Divine Smite",
  chatHistory: ["Alice attacks with Divine Smite...", "Critical hit!"],
  location: "Dragon's mountain lair",
  prompt: "[triumphant] Epic fantasy narrator"
});
```

**What the AI receives:**
- Structured JSON with all provided context
- Can reference any field naturally
- Figures out what's important based on context type and prompt

### 4. Prompt/Tone System ✅ DECIDED
**Decision:** Free text prompts passed per-call (no predefined styles)

**Rationale:**
- Maximum flexibility - users craft exact tone/style they want
- Supports ElevenLabs v3 bracket notation: `[angry]`, `[curious]`, `[triumphant]`
- No need to maintain style registry
- Simpler implementation
- Can be context-specific per announcement

**Implementation:**
- `prompt` parameter in `showDynamicAI()` is free text
- Examples:
  - "Speak as an epic fantasy narrator with gravitas"
  - "[triumphant] Announce this as a sports commentator"
  - "Use poetic, flowery language in a bardic style"
  - "[angry] Describe this betrayal with righteous fury"
- Prompt is directly incorporated into AI system/user message

**No Settings Needed:**
- No "Default Style" dropdown
- No style registration API
- Everything is per-call based on context

### 5. Caching Strategy
Should we cache AI-generated text?

**Pros:**
- Faster subsequent calls
- Reduce API costs
- Consistent output

**Cons:**
- Less variety/repetition
- Large cache size (text + audio)
- Need smart cache keys

**Recommendation:** Cache based on (action type + actor names + style), with configurable TTL

### 6. Latency & Status Feedback ✅ DECIDED
**Decision:** Status window for initiator with feedback and timeout

**Implementation:**
- Show status window/modal to **initiating user only** (not all players)
- Immediate feedback messages:
  - "You don't have permission to trigger toasts"
  - "No AI API key configured"
  - "Generating announcement..." (with spinner/progress)
  - "AI generation failed: [error message]"
  - "Request timed out after 10 seconds"
- **10 second timeout** - If AI doesn't respond, show timeout error
- Status window closes automatically on success
- Other players see nothing until toast displays

**UI States:**
1. **Check Permissions** (instant)
   - ❌ "You don't have permission to trigger toasts"
   - ❌ "No AI API key configured or shared"
   - ✅ Proceed to generation

2. **Generating** (0-10 seconds)
   - Show: "Generating announcement..." with spinner
   - User knows it's working

3. **Success** (< 10 seconds)
   - Status window closes
   - Toast broadcasts to all players

4. **Timeout** (> 10 seconds)
   - Show: "Request timed out after 10 seconds. Please try again."
   - Option to retry or cancel

5. **API Error**
   - Show: "AI generation failed: [error details]"
   - Option to retry or fall back to template

### 7. Error Handling & Fallbacks ✅ DECIDED
**Decision:** Graceful fallback to template system

**Fallback Options:**
1. **Permission errors** - Show error, don't proceed
2. **API errors** - Offer retry or fallback to template
3. **Timeout** - Offer retry or fallback to template
4. **No fallback template** - Show error, don't proceed

**Fallback Process:**
- If `fallbackTemplate` provided in config
- User clicks "Use Template" button in error dialog
- Falls back to `game.toast.showDynamic(fallbackTemplate, tokens, elements)`
- No AI generation, just template rendering + TTS

---

## Proposed API

### New Method: `game.toast.showDynamicAI(config)`

```javascript
await game.toast.showDynamicAI({
  // Required: Tone/style prompt (free text)
  prompt: "Speak as an epic fantasy narrator with gravitas",
  // Or with ElevenLabs v3 bracket notation:
  // prompt: "[triumphant] Announce this as a sports commentator"

  // Optional: User-defined context (any structure you want)
  actor: {
    name: "Alice",
    class: "Paladin",
    level: 8,
    hp: 45,
    maxHp: 68,
    weapon: "Holy Avenger"
  },

  target: {
    name: "Ancient Dragon",
    type: "Dragon",
    cr: 24
  },

  // Optional: Additional context (any properties)
  context: "finishing-blow",      // What happened
  damageDealt: 47,
  abilityUsed: "Divine Smite",
  chatHistory: ["msg1", "msg2"],  // Recent messages
  location: "Mountain lair",
  // ... any other data you want

  // Optional: Visual elements
  elements: [
    { type: "text", text: "BOSS DEFEATED!", ... }
  ],

  // Optional: Override template fallback
  fallbackTemplate: "boss-kill"   // If AI fails
});
```

**Key Points:**
- `prompt` is the only truly required field
- All other fields are optional and user-defined
- `actor`, `target`, etc. are plain objects (not Foundry objects)
- Users construct these objects with whatever data matters to them
- AI receives everything as structured JSON

**Examples:**
```javascript
// Example 1: Epic fantasy narrator for boss kill
const aliceToken = canvas.tokens.controlled[0];
const dragonToken = game.user.targets.first();

await game.toast.showDynamicAI({
  prompt: "Speak as an epic fantasy narrator describing this heroic moment",
  actor: {
    name: aliceToken.name,
    class: aliceToken.actor.system.details.class,
    level: aliceToken.actor.system.details.level,
    weapon: aliceToken.actor.items.find(i => i.type === "weapon")?.name
  },
  target: {
    name: dragonToken.name,
    type: dragonToken.actor.system.details.type,
    cr: dragonToken.actor.system.details.cr
  },
  context: "finishing-blow",
  damageDealt: 89
});

// Example 2: Hype sports announcer with ElevenLabs v3 tone
const bobToken = canvas.tokens.controlled[0];

await game.toast.showDynamicAI({
  prompt: "[excited] Announce this like a sports commentator calling the winning goal!",
  actor: {
    name: bobToken.name,
    class: bobToken.actor.system.details.class
  },
  target: {
    name: "Lich King"
  },
  context: "critical-hit",
  damageDealt: 89,
  elements: [
    { type: "text", text: "CRITICAL HIT!", color: "#ff0000", fontSize: "100px" }
  ]
});

// Example 3: Minimal context - AI figures it out
await game.toast.showDynamicAI({
  prompt: "[gentle] Describe this as a bard singing about a merciful act",
  actor: { name: "Cleric Alice" },
  target: { name: "Wounded Bob" },
  context: "clutch-heal",
  healingAmount: 34
});
```

### New Settings

**World Settings (GM only):**
- **Enable AI Text Generation** (toggle, default: off)
- **AI Provider** (dropdown: Claude, OpenAI)
- **Claude API Key** (text input)
- **OpenAI API Key** (text input)
- **Share AI Keys With** (dropdown: None, All Players, By Role, By Username)
  - If "By Role": **Allowed Roles** (checkboxes: Player, Trusted, Assistant GM)
  - If "By Username": **Allowed Usernames** (comma-separated text)
- **Model Selection** (dropdown, populated based on provider):
  - Claude: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229
  - OpenAI: gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo
- **OpenAI Mode** (dropdown: Standard, Custom GPT, Fine-tuned Model)
  - If Custom GPT: **Assistant ID** (text input)
  - If Fine-tuned: **Model ID** (text input, e.g., "ft:gpt-3.5-turbo:...")
- **Max Tokens** (number, default: 150)
- **Temperature** (number 0-2, default: 0.7)

**Client Settings (per-user):**
- **Use Own AI API Keys** (toggle, default: off)
  - If enabled:
    - **AI Provider** (dropdown: Claude, OpenAI)
    - **Claude API Key** (text input)
    - **Claude Enable Prompt Caching** (toggle, default: on)
    - **OpenAI API Key** (text input)
    - **OpenAI Mode** (dropdown: Standard, Custom GPT, Fine-tuned Model)
    - **Assistant ID / Model ID** (text input, shown based on mode)

**Caching:**
- Cache AI-generated text (toggle)
- Text cache size
- Text cache TTL

### No Style Registry Needed

Since prompts are free text passed per-call, there's no need for a style registration system. Users craft their prompts inline based on what they want for that specific moment.

---

## Implementation Plan

### Step 0: AI Provider Architecture
- [ ] Create `AIProvider` base class (interface)
- [ ] Create `ClaudeProvider` class (extends AIProvider)
  - [ ] Standard API calls
  - [ ] Prompt caching support
- [ ] Create `OpenAIProvider` class (extends AIProvider)
  - [ ] Standard API calls (chat completions)
  - [ ] Custom GPT support (Assistants API)
  - [ ] Fine-tuned model support
- [ ] Create `AIProviderFactory` to instantiate correct provider
- [ ] Add provider settings (provider type, API keys, models, modes)

### Step 1: Core AI Integration
- [ ] Create `AITextGenerator` class (uses AIProvider)
- [ ] Implement prompt building system
- [ ] Test basic text generation with each provider
- [ ] Error handling for API failures

### Step 2: Prompt Building
- [ ] Build AI prompt from user-provided context
- [ ] Include user's free-text prompt/tone
- [ ] Serialize context as structured JSON for AI
- [ ] Create system prompt that explains the task

### Step 3: Settings & Permissions
- [ ] Add world settings (GM AI keys, sharing permissions)
- [ ] Add client settings (user override keys)
- [ ] **Add prominent security warnings to all API key settings**
  - [ ] Warning in settings hint text
  - [ ] Warning banner in settings UI
  - [ ] Link to security best practices documentation
- [ ] Implement permission checking (can user use AI keys?)
- [ ] Show which key is being used in UI

### Step 4: Caching Layer
- [ ] Extend cache manager for text caching
- [ ] Implement cache key generation for AI text
- [ ] Add TTL support
- [ ] Cache statistics

### Step 5: Status Window & UX
- [ ] Create status window/modal component
- [ ] Show immediate feedback to initiator
- [ ] Implement 10-second timeout
- [ ] Retry and fallback buttons
- [ ] Progress spinner/animation

### Step 6: Integration with TTS
- [ ] Create `showDynamicAI()` method
- [ ] Connect AI generation → TTS pipeline
- [ ] Implement fallback to templates
- [ ] Permission and key access checks
- [ ] Complete error handling flow

### Step 7: Testing & Polish
- [ ] Test different context types
- [ ] Test both Claude and OpenAI providers
- [ ] Test Custom GPT and fine-tuned models
- [ ] Test timeout and retry flows
- [ ] Performance optimization
- [ ] Documentation and examples
  - [ ] **Add prominent security warning section to README**
  - [ ] API key best practices guide
  - [ ] Example prompts for different tones
  - [ ] System-specific context mapping examples (D&D 5e, PF2e, etc.)
  - [ ] ElevenLabs v3 bracket notation guide

---

## Open Questions

1. **Cost Management:** How to prevent runaway API costs?
   - Per-user daily limits?
   - Warning if generation looks expensive?
   - Display estimated cost before generating?
   - **Decision needed:** Add cost warnings or let users manage their own usage?

2. **Privacy:** What data is safe to send to AI APIs?
   - User controls what data they include (user-defined context)
   - No automatic data collection
   - **Decision:** Assume users know what they're sending (it's their macro)
   - Could add warning: "This will send data to [Provider] API"

3. **Security: API Key Theft Risk** ⚠️ **CRITICAL CONCERN**
   - **Problem:** Foundry modules run in same JavaScript context with full access
   - Malicious modules can read our settings: `game.settings.get("toast", "claude-api-key")`
   - Keys stored in browser memory are vulnerable
   - No sandboxing between modules in Foundry architecture

   **Mitigation Options:**

   **Option A: Server-Side Proxy (Most Secure)**
   - Store GM keys only on Foundry server (not browser)
   - Client sends request to Foundry server
   - Server makes API call with keys
   - Returns result to client
   - **Pros:** Keys never in browser
   - **Cons:** Complex backend, requires Foundry server modification

   **Option B: Warnings + Best Practices (Realistic)**
   - Accept that keys can be stolen by malicious modules
   - Add prominent warnings in settings UI
   - Recommend best practices:
     - Only install trusted modules
     - Use separate API keys for Foundry (not your main keys)
     - Set spending limits on API keys
     - Monitor API usage regularly
     - Rotate keys periodically
   - Document risk in README

   **Option C: Hybrid Approach**
   - GM keys: Server-side proxy (if feasible)
   - User override keys: Client-side with warnings

   **Decision:** ✅ Option B (Warnings + Best Practices)
   - Accept architectural limitation honestly
   - Prominent warnings in settings UI
   - Comprehensive security documentation
   - Best practices guide for users
   - Server-side proxy can be added in v2.1.0 if demanded

   **Implementation Details:**

   **Settings Hint Text:**
   ```
   ⚠️ SECURITY WARNING: API keys stored in Foundry are vulnerable to theft by
   malicious modules. Only install trusted modules. Use a separate API key for
   Foundry with spending limits. Monitor usage regularly.
   ```

   **README Security Section:**
   ```markdown
   ## ⚠️ Security Warning: API Key Safety

   **Important:** Foundry VTT modules run in the same JavaScript context with
   no security isolation. Malicious modules can potentially steal API keys.

   **Best Practices:**
   - ✅ Only install modules from trusted sources
   - ✅ Use separate API keys for Foundry (not your main account keys)
   - ✅ Set spending limits on your API keys
   - ✅ Monitor API usage regularly for suspicious activity
   - ✅ Rotate keys periodically
   - ✅ Review installed modules before adding new ones

   **How to set spending limits:**
   - Claude: https://console.anthropic.com/settings/limits
   - OpenAI: https://platform.openai.com/account/limits
   ```

4. **Temperature Control:**
   - Higher temp = more variety but less consistent
   - Lower temp = more consistent but repetitive
   - **Decision needed:** World setting or per-call parameter?
   - Current plan: World setting (default 0.7)

5. **Documentation Scope:**
   - Example prompts for different tones
   - How to use ElevenLabs v3 bracket notation
   - Prompt engineering tips
   - System-specific examples (D&D 5e, PF2e, etc.)
   - Macro building guide
   - **Decision needed:** How comprehensive should examples be?

---

## Summary of Decisions

### ✅ All Major Decisions Made

1. **AI Providers:**
   - Claude (standard models + prompt caching)
   - OpenAI (standard + Custom GPTs + fine-tuned models)

2. **API Keys:**
   - Hybrid model: GM shares keys + user override
   - Permission-based access control
   - **Security: Warnings + best practices** (accept vulnerability honestly)

3. **Prompts:**
   - Free text per-call (no style registry)
   - Supports ElevenLabs v3 bracket notation

4. **Context:**
   - User-defined mapping (system-agnostic)
   - Plain JavaScript objects
   - AI interprets structured JSON

5. **Status Feedback:**
   - Dedicated status window for initiator
   - 10-second timeout
   - Retry and fallback options

### 🚀 Ready to Implement

The design phase is complete! All major architectural decisions have been made. The implementation plan is clearly defined with 7 steps.

## Next Steps

1. **Begin Implementation:**
   - Start with Step 0: AI Provider Architecture
   - Build provider classes and factory
   - Test with both Claude and OpenAI

2. **Iterate:**
   - Build incrementally following implementation plan
   - Test each component thoroughly
   - Refine based on real-world usage

3. **Document:**
   - Update README with AI generation guide
   - Add comprehensive examples
   - Create CHANGELOG entry for v2.0.0
