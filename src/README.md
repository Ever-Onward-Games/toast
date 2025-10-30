# Toast Module - Source Structure

This directory contains the modular source code for the Toast module. The build script (`build.js`) concatenates these modules into a single `scripts/toast.js` file for distribution.

## Directory Structure

```
src/
├── tts/              # Text-to-Speech functionality
│   ├── TTSCacheManager.js    # IndexedDB audio caching
│   └── ElevenLabsAPI.js      # ElevenLabs API wrapper
│
├── ai/               # AI text generation
│   ├── AIStatusWindow.js     # UI feedback for AI generation
│   ├── AIProvider.js         # Base provider interface
│   ├── ClaudeProvider.js     # Anthropic Claude integration
│   ├── OpenAIProvider.js     # OpenAI GPT integration
│   └── AIProviderFactory.js  # Provider routing
│
├── templates/        # TTS template system
│   └── TemplateManager.js    # Template registration and rendering
│
├── core/             # Core toast functionality
│   ├── ToastManager.js       # Main module logic
│   └── ToastManagerIntegration.js  # Integrates TemplateManager into ToastManager
│
└── index.js          # Entry point (Foundry hooks)
```

## Module Loading Order

The build script concatenates modules in this order to ensure proper dependencies:

1. **TTS Layer** - No dependencies
   - `TTSCacheManager.js`
   - `ElevenLabsAPI.js`

2. **AI Layer** - Depends on TTS layer
   - `AIStatusWindow.js`
   - `AIProvider.js`
   - `ClaudeProvider.js` (extends AIProvider)
   - `OpenAIProvider.js` (extends AIProvider)
   - `AIProviderFactory.js`

3. **Templates Layer** - Independent
   - `TemplateManager.js`

4. **Core Layer** - Depends on all above
   - `ToastManager.js`
   - `ToastManagerIntegration.js` (adds TemplateManager methods to ToastManager)

5. **Entry Point** - Initializes everything
   - `index.js`

## Building

To build the module:

```bash
npm run build
```

This will:
1. Concatenate all source modules into `scripts/toast.js`
2. Copy files to `dist/toast/` for distribution
3. Report the final file size

The concatenated `scripts/toast.js` file is approximately 88 KB (2,850+ lines).

## Development Workflow

### Making Changes

1. **Edit source files** in the `src/` directory
2. **Run build** with `npm run build`
3. **Test** the module in Foundry VTT
4. **Commit** both source files and built `scripts/toast.js`

### Adding New Classes

1. Create the new class file in the appropriate directory
2. Update `build.js` to include it in the `modules` array
3. Place it in the correct dependency order
4. Run `npm run build` to test

### Best Practices

- **Keep classes focused** - Each class should have a single responsibility
- **Document dependencies** - Add comments explaining class dependencies
- **Test after building** - Always test the concatenated output
- **Maintain integration** - If adding core functionality, update `ToastManagerIntegration.js` if needed

## Class Responsibilities

### TTS Layer

**TTSCacheManager**
- IndexedDB management for audio caching
- LRU cache eviction
- Cache size management

**ElevenLabsAPI**
- ElevenLabs API communication
- TTS audio generation
- API key validation

### AI Layer

**AIStatusWindow**
- UI feedback for AI generation
- Progress spinner
- Error handling with retry/fallback buttons
- 10-second timeout UI

**AIProvider** (Base class)
- Interface definition for AI providers
- `generate()` and `testAPIKey()` methods

**ClaudeProvider**
- Anthropic Claude Messages API integration
- System/user prompt construction
- Model selection (Sonnet, Haiku, Opus)

**OpenAIProvider**
- OpenAI Chat Completions API
- OpenAI Assistants API (for Custom GPTs)
- Fine-tuned model support

**AIProviderFactory**
- Provider routing based on user selection
- Unified interface for AI generation

### Templates Layer

**TemplateManager**
- Template registration and storage
- Token extraction from templates
- Template rendering with token replacement
- Built-in template initialization (10 templates)
- Template listing and filtering by tags

### Core Layer

**ToastManager** (~1,670 lines)
- Module initialization and settings
- Socket-based multiplayer broadcasting
- Permission validation (GM-validated)
- Toast rendering and animation
- Element creation (text, images, sounds, shapes)
- Announcer pack management
- Dynamic TTS generation
- AI-powered text generation
- Random sound selection
- Global API registration

**ToastManagerIntegration**
- Adds TemplateManager methods to ToastManager
- Ensures backward compatibility
- Allows `ToastManager.registerTemplate()` etc.

### Entry Point

**index.js**
- Foundry VTT hooks
- Module initialization on `init` hook
- Socket setup on `ready` hook

## File Sizes

Approximate sizes of each module:

- `TTSCacheManager.js`: ~7 KB (217 lines)
- `ElevenLabsAPI.js`: ~2 KB (81 lines)
- `AIStatusWindow.js`: ~7 KB (222 lines)
- `AIProvider.js`: ~1 KB (31 lines)
- `ClaudeProvider.js`: ~4 KB (129 lines)
- `OpenAIProvider.js`: ~7 KB (243 lines)
- `AIProviderFactory.js`: ~1 KB (44 lines)
- `TemplateManager.js`: ~7 KB (211 lines)
- `ToastManager.js`: ~50 KB (1,676 lines)
- `ToastManagerIntegration.js`: ~1 KB (8 lines)
- `index.js`: <1 KB (11 lines)

**Total:** ~88 KB (2,855 lines)

## Why Modular?

### Before (Single File)
- ❌ 2,817 lines in one file
- ❌ Difficult to navigate
- ❌ Hard to find specific functionality
- ❌ Merge conflicts more likely
- ❌ Difficult to test individual components

### After (Modular)
- ✅ Organized by responsibility
- ✅ Easy to find specific functionality
- ✅ Clearer dependencies
- ✅ Individual modules can be tested
- ✅ Easier maintenance
- ✅ Better code organization
- ✅ Same runtime performance (single concatenated file)

## Git Workflow

**Commit both:**
- Source files in `src/`
- Built file `scripts/toast.js`

This ensures:
1. Other developers can edit source modules
2. Users can use the module without building
3. Git history shows changes in readable chunks

## Need Help?

See the main [README.md](../README.md) for module documentation.
