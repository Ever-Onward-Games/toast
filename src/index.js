/**
 * Toast Module - Main Entry Point
 * This file includes all module dependencies and initializes the module
 */

// Note: All class files will be concatenated by the build script in this order:
// 1. TTS Layer (TTSCacheManager, ElevenLabsAPI)
// 2. AI Layer (AIStatusWindow, AIProvider, ClaudeProvider, OpenAIProvider, AIProviderFactory)
// 3. Templates Layer (TemplateManager)
// 4. Core Layer (ToastManager, Integration)

// Initialize Foundry VTT hooks
Hooks.once("init", () => ToastManager.init());
Hooks.once("ready", () => ToastManager.ready());
