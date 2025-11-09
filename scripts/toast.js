/**
 * TTS Cache Manager - IndexedDB-based audio caching
 */
class TTSCacheManager {
  static DB_NAME = "toast-tts-cache";
  static STORE_NAME = "audio";
  static DB_VERSION = 1;
  static db = null;

  /**
   * Initialize IndexedDB
   */
  static async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("Toast | Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("Toast | IndexedDB initialized");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: "key" });
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("size", "size", { unique: false });
          console.log("Toast | Created IndexedDB object store");
        }
      };
    });
  }

  /**
   * Generate cache key from text and voice ID
   */
  static generateKey(text, voiceId) {
    const combined = `${text}|${voiceId}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `tts_${Math.abs(hash)}`;
  }

  /**
   * Get audio from cache
   */
  static async get(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`Toast | Cache hit: ${key}`);
          resolve(request.result.audio);
        } else {
          console.log(`Toast | Cache miss: ${key}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn("Toast | Cache get error:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save audio to cache
   */
  static async set(key, audioData) {
    if (!this.db) await this.init();

    const entry = {
      key: key,
      audio: audioData,
      timestamp: Date.now(),
      size: audioData.length
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        console.log(`Toast | Cached audio: ${key} (${(audioData.length / 1024).toFixed(1)} KB)`);
        resolve();
      };

      request.onerror = () => {
        console.warn("Toast | Cache set error:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get total cache size in bytes
   */
  static async getSize() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, entry) => sum + entry.size, 0);
        resolve(totalSize);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get number of cached entries
   */
  static async count() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cache
   */
  static async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("Toast | Cache cleared");
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Evict old entries if cache size exceeds limit
   */
  static async evictIfNeeded(maxSizeMB) {
    if (!this.db) await this.init();

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const currentSize = await this.getSize();

    if (currentSize <= maxSizeBytes) return;

    console.log(`Toast | Cache size (${(currentSize / 1024 / 1024).toFixed(1)} MB) exceeds limit (${maxSizeMB} MB), evicting old entries`);

    // Get all entries sorted by timestamp
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index("timestamp");
      const request = index.openCursor();

      const entries = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          entries.push({ key: cursor.value.key, size: cursor.value.size });
          cursor.continue();
        } else {
          // Delete oldest entries until under limit
          let deletedSize = 0;
          let i = 0;
          while (deletedSize + currentSize > maxSizeBytes && i < entries.length) {
            store.delete(entries[i].key);
            deletedSize += entries[i].size;
            i++;
          }
          console.log(`Toast | Evicted ${i} old entries (${(deletedSize / 1024 / 1024).toFixed(1)} MB)`);
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}


/**
 * ElevenLabs API Wrapper
 */
class ElevenLabsAPI {
  static API_BASE = "https://api.elevenlabs.io/v1";

  /**
   * Generate TTS audio from text
   * @param {string} text - Text to convert to speech
   * @param {string} apiKey - ElevenLabs API key
   * @param {string} voiceId - Voice ID to use
   * @returns {Promise<string>} Base64 encoded audio data
   */
  static async generateTTS(text, apiKey, voiceId) {
    if (!text || !apiKey || !voiceId) {
      throw new Error("Missing required parameters: text, apiKey, or voiceId");
    }

    const url = `${this.API_BASE}/text-to-speech/${voiceId}`;

    console.log(`Toast | Generating TTS for: "${text.substring(0, 50)}..." with voice ${voiceId}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Convert response to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const audioData = `data:audio/mpeg;base64,${base64}`;
      console.log(`Toast | TTS generated successfully (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);

      return audioData;
    } catch (err) {
      console.error("Toast | ElevenLabs API error:", err);
      throw err;
    }
  }

  /**
   * Test API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  static async testAPIKey(apiKey) {
    if (!apiKey) return false;

    try {
      const response = await fetch(`${this.API_BASE}/user`, {
        headers: {
          "xi-api-key": apiKey
        }
      });
      return response.ok;
    } catch (err) {
      console.warn("Toast | API key test failed:", err);
      return false;
    }
  }
}


class AIStatusWindow {
  static currentWindow = null;

  /**
   * Show status window
   * @param {string} status - Status type: "generating", "error", "timeout", "success"
   * @param {string} message - Status message to display
   * @param {Object} options - Additional options (retry callback, fallback callback)
   */
  static show(status, message, options = {}) {
    // Close existing window
    this.close();

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "toast-ai-status";
    overlay.className = "toast-ai-status-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: "Signika", sans-serif;
    `;

    // Create window
    const window = document.createElement("div");
    window.className = "toast-ai-status-window";
    window.style.cssText = `
      background: #2a2a2a;
      border: 2px solid #555;
      border-radius: 10px;
      padding: 30px;
      min-width: 400px;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      color: #fff;
      text-align: center;
    `;

    // Icon and spinner
    let iconHtml = "";
    if (status === "generating") {
      iconHtml = `
        <div style="margin-bottom: 20px;">
          <div class="toast-spinner" style="
            border: 4px solid #444;
            border-top: 4px solid #4a9eff;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: toast-spin 1s linear infinite;
            margin: 0 auto;
          "></div>
          <style>
            @keyframes toast-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;
    } else if (status === "error") {
      iconHtml = `
        <div style="margin-bottom: 20px; font-size: 50px; color: #ff4444;">
          ⚠️
        </div>
      `;
    } else if (status === "timeout") {
      iconHtml = `
        <div style="margin-bottom: 20px; font-size: 50px; color: #ff9944;">
          ⏱️
        </div>
      `;
    } else if (status === "success") {
      iconHtml = `
        <div style="margin-bottom: 20px; font-size: 50px; color: #44ff44;">
          ✓
        </div>
      `;
    }

    // Message
    const messageHtml = `
      <div style="font-size: 18px; margin-bottom: 20px; line-height: 1.4;">
        ${message}
      </div>
    `;

    // Buttons
    let buttonsHtml = "";
    if (status === "error" || status === "timeout") {
      buttonsHtml = `
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
      `;

      if (options.onRetry) {
        buttonsHtml += `
          <button class="toast-retry-btn" style="
            background: #4a9eff;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">
            Retry
          </button>
        `;
      }

      if (options.onFallback) {
        buttonsHtml += `
          <button class="toast-fallback-btn" style="
            background: #ff9944;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">
            Use Template
          </button>
        `;
      }

      buttonsHtml += `
          <button class="toast-close-btn" style="
            background: #666;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">
            Cancel
          </button>
        </div>
      `;
    }

    // Build window content
    window.innerHTML = iconHtml + messageHtml + buttonsHtml;

    // Add event listeners for buttons
    if (status === "error" || status === "timeout") {
      const retryBtn = window.querySelector(".toast-retry-btn");
      if (retryBtn && options.onRetry) {
        retryBtn.addEventListener("click", () => {
          this.close();
          options.onRetry();
        });
      }

      const fallbackBtn = window.querySelector(".toast-fallback-btn");
      if (fallbackBtn && options.onFallback) {
        fallbackBtn.addEventListener("click", () => {
          this.close();
          options.onFallback();
        });
      }

      const closeBtn = window.querySelector(".toast-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.close();
        });
      }
    }

    overlay.appendChild(window);
    document.body.appendChild(overlay);

    this.currentWindow = overlay;

    // Auto-close success after 1 second
    if (status === "success") {
      setTimeout(() => this.close(), 1000);
    }
  }

  /**
   * Close status window
   */
  static close() {
    if (this.currentWindow) {
      this.currentWindow.remove();
      this.currentWindow = null;
    }
  }

  /**
   * Update message in existing window
   * @param {string} message - New message
   */
  static updateMessage(message) {
    if (this.currentWindow) {
      const messageDiv = this.currentWindow.querySelector("div div:nth-child(2)");
      if (messageDiv) {
        messageDiv.innerHTML = message;
      }
    }
  }
}


/**
 * Base class for AI text generation providers
 * Defines interface that all providers must implement
 */
class AIProvider {
  /**
   * Generate text from prompt and context
   * @param {Object} config - Generation configuration
   * @param {string} config.apiKey - API key for the provider
   * @param {string} config.model - Model to use
   * @param {string} config.prompt - User's tone/style prompt
   * @param {Object} config.context - User-defined context (actor, target, etc.)
   * @param {number} config.maxTokens - Maximum tokens to generate
   * @param {number} config.temperature - Temperature (0-2)
   * @returns {Promise<string>} Generated text
   */
  static async generate(config) {
    throw new Error("AIProvider.generate() must be implemented by subclass");
  }

  /**
   * Test if API key is valid
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(apiKey) {
    throw new Error("AIProvider.testAPIKey() must be implemented by subclass");
  }
}


/**
 * Claude (Anthropic) AI provider
 * Supports standard models and prompt caching
 */
class ClaudeProvider extends AIProvider {
  static API_BASE = "https://api.anthropic.com/v1";
  static API_VERSION = "2023-06-01";

  /**
   * Generate text using Claude API
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async generate(config) {
    const { apiKey, model, prompt, context, maxTokens, temperature } = config;

    if (!apiKey || !model || !prompt) {
      throw new Error("Missing required parameters: apiKey, model, or prompt");
    }

    // Build system prompt
    const systemPrompt = this._buildSystemPrompt();

    // Build user message with context
    const userMessage = this._buildUserMessage(prompt, context);

    console.log(`Toast | Generating text with Claude model: ${model}`);

    try {
      const response = await fetch(`${this.API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.API_VERSION
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens || 150,
          temperature: temperature !== undefined ? temperature : 0.7,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error("Claude API returned no content");
      }

      const generatedText = data.content[0].text;
      console.log(`Toast | Claude generated text: "${generatedText.substring(0, 100)}..."`);

      return generatedText;

    } catch (err) {
      console.error("Toast | Claude API error:", err);
      throw err;
    }
  }

  /**
   * Test Claude API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(apiKey) {
    if (!apiKey) return false;

    try {
      // Make a minimal API call to test the key
      const response = await fetch(`${this.API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.API_VERSION
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 10,
          messages: [
            { role: "user", content: "Hi" }
          ]
        })
      });

      return response.ok;
    } catch (err) {
      console.warn("Toast | Claude API key test failed:", err);
      return false;
    }
  }

  /**
   * Build system prompt that explains the task
   * @returns {string} System prompt
   */
  static _buildSystemPrompt() {
    return `You are a narrator for a tabletop RPG game. Generate a single dramatic announcement (1-2 sentences, under 200 characters) based on the game context provided. Follow the user's tone/style instructions exactly. Do not add commentary, explanations, or extra text - just the announcement itself.`;
  }

  /**
   * Build user message with prompt and context
   * @param {string} prompt - User's tone/style prompt
   * @param {Object} context - User-defined context
   * @returns {string} Formatted user message
   */
  static _buildUserMessage(prompt, context) {
    let message = `${prompt}\n\n`;
    message += `Game Context:\n`;
    message += JSON.stringify(context, null, 2);
    message += `\n\nGenerate the announcement now:`;
    return message;
  }
}


/**
 * OpenAI AI provider
 * Supports standard models, Custom GPTs, and fine-tuned models
 */
class OpenAIProvider extends AIProvider {
  static API_BASE = "https://api.openai.com/v1";

  /**
   * Generate text using OpenAI API
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async generate(config) {
    const { apiKey, model, prompt, context, maxTokens, temperature, mode, assistantId } = config;

    if (!apiKey || !model || !prompt) {
      throw new Error("Missing required parameters: apiKey, model, or prompt");
    }

    // Route to appropriate generation method based on mode
    if (mode === "custom-gpt" && assistantId) {
      return await this._generateWithCustomGPT(config);
    } else {
      return await this._generateWithChatCompletion(config);
    }
  }

  /**
   * Generate using standard chat completions (includes fine-tuned models)
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async _generateWithChatCompletion(config) {
    const { apiKey, model, prompt, context, maxTokens, temperature } = config;

    const systemPrompt = this._buildSystemPrompt();
    const userMessage = this._buildUserMessage(prompt, context);

    console.log(`Toast | Generating text with OpenAI model: ${model}`);

    try {
      const response = await fetch(`${this.API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens || 150,
          temperature: temperature !== undefined ? temperature : 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenAI API returned no choices");
      }

      const generatedText = data.choices[0].message.content;
      console.log(`Toast | OpenAI generated text: "${generatedText.substring(0, 100)}..."`);

      return generatedText;

    } catch (err) {
      console.error("Toast | OpenAI API error:", err);
      throw err;
    }
  }

  /**
   * Generate using Custom GPT (Assistants API)
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async _generateWithCustomGPT(config) {
    const { apiKey, assistantId, prompt, context } = config;

    console.log(`Toast | Generating text with Custom GPT: ${assistantId}`);

    try {
      // Create a thread
      const threadResponse = await fetch(`${this.API_BASE}/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        throw new Error(`OpenAI Threads API error: ${threadResponse.status} - ${errorText}`);
      }

      const threadData = await threadResponse.json();
      const threadId = threadData.id;

      // Add message to thread
      const userMessage = this._buildUserMessage(prompt, context);

      await fetch(`${this.API_BASE}/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          role: "user",
          content: userMessage
        })
      });

      // Run the assistant
      const runResponse = await fetch(`${this.API_BASE}/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`OpenAI Runs API error: ${runResponse.status} - ${errorText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;

      // Poll for completion
      let run = runData;
      while (run.status === "queued" || run.status === "in_progress") {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(`${this.API_BASE}/threads/${threadId}/runs/${runId}`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2"
          }
        });

        run = await statusResponse.json();
      }

      if (run.status !== "completed") {
        throw new Error(`Assistant run failed with status: ${run.status}`);
      }

      // Get messages
      const messagesResponse = await fetch(`${this.API_BASE}/threads/${threadId}/messages`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });

      const messagesData = await messagesResponse.json();

      if (!messagesData.data || messagesData.data.length === 0) {
        throw new Error("No messages returned from assistant");
      }

      // Get the last assistant message
      const assistantMessage = messagesData.data.find(msg => msg.role === "assistant");
      if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
        throw new Error("No content in assistant message");
      }

      const generatedText = assistantMessage.content[0].text.value;
      console.log(`Toast | Custom GPT generated text: "${generatedText.substring(0, 100)}..."`);

      return generatedText;

    } catch (err) {
      console.error("Toast | Custom GPT API error:", err);
      throw err;
    }
  }

  /**
   * Test OpenAI API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(apiKey) {
    if (!apiKey) return false;

    try {
      // Make a minimal API call to test the key
      const response = await fetch(`${this.API_BASE}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      return response.ok;
    } catch (err) {
      console.warn("Toast | OpenAI API key test failed:", err);
      return false;
    }
  }

  /**
   * Build system prompt that explains the task
   * @returns {string} System prompt
   */
  static _buildSystemPrompt() {
    return `You are a narrator for a tabletop RPG game. Generate a single dramatic announcement (1-2 sentences, under 200 characters) based on the game context provided. Follow the user's tone/style instructions exactly. Do not add commentary, explanations, or extra text - just the announcement itself.`;
  }

  /**
   * Build user message with prompt and context
   * @param {string} prompt - User's tone/style prompt
   * @param {Object} context - User-defined context
   * @returns {string} Formatted user message
   */
  static _buildUserMessage(prompt, context) {
    let message = `${prompt}\n\n`;
    message += `Game Context:\n`;
    message += JSON.stringify(context, null, 2);
    message += `\n\nGenerate the announcement now:`;
    return message;
  }
}


/**
 * Factory for creating AI provider instances
 */
class AIProviderFactory {
  /**
   * Get the appropriate AI provider class based on provider name
   * @param {string} provider - Provider name ("claude" or "openai")
   * @returns {Class} Provider class
   */
  static getProvider(provider) {
    switch (provider.toLowerCase()) {
      case "claude":
        return ClaudeProvider;
      case "openai":
        return OpenAIProvider;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  /**
   * Generate text using the specified provider
   * @param {string} provider - Provider name
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async generate(provider, config) {
    const ProviderClass = this.getProvider(provider);
    return await ProviderClass.generate(config);
  }

  /**
   * Test API key for the specified provider
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(provider, apiKey) {
    const ProviderClass = this.getProvider(provider);
    return await ProviderClass.testAPIKey(apiKey);
  }
}


/**
 * Template Manager for dynamic TTS templates
 */
class TemplateManager {
  static templates = {}; // Store for dynamic TTS templates

  /**
   * Register a dynamic TTS template
   * @param {string} id - Unique template identifier
   * @param {Object} config - Template configuration {template, tags, duration}
   * @returns {boolean} True if registered successfully
   */
  static registerTemplate(id, config) {
    try {
      if (!id || typeof id !== "string") {
        console.error("Toast | registerTemplate: Invalid template ID");
        return false;
      }

      if (!config || !config.template || typeof config.template !== "string") {
        console.error("Toast | registerTemplate: Config must include 'template' string");
        return false;
      }

      if (this.templates[id]) {
        console.warn(`Toast | Template "${id}" is already registered, overwriting`);
      }

      // Extract tokens from template
      const tokens = this.extractTokens(config.template);

      this.templates[id] = {
        template: config.template,
        tokens: tokens,
        tags: config.tags || [],
        duration: config.duration || 4
      };

      console.log(`Toast | Registered template: ${id} with tokens: ${tokens.join(', ')}`);
      return true;
    } catch (err) {
      console.error("Toast | Failed to register template:", err);
      return false;
    }
  }

  /**
   * Extract token names from a template string
   * @param {string} template - Template string (e.g., "{player} defeated {boss}!")
   * @returns {Array<string>} Array of token names (e.g., ["player", "boss"])
   */
  static extractTokens(template) {
    const tokenRegex = /\{([a-zA-Z0-9_-]+)\}/g;
    const tokens = [];
    let match;
    while ((match = tokenRegex.exec(template)) !== null) {
      if (!tokens.includes(match[1])) {
        tokens.push(match[1]);
      }
    }
    return tokens;
  }

  /**
   * Render a template with provided token values
   * @param {string} templateId - ID of registered template
   * @param {Object} tokens - Token values (e.g., {player: "Bob", boss: "Dragon"})
   * @returns {string|null} Rendered text, or null if template not found or tokens missing
   */
  static renderTemplate(templateId, tokens = {}) {
    try {
      const template = this.templates[templateId];
      if (!template) {
        console.warn(`Toast | Template not found: ${templateId}`);
        return null;
      }

      // Validate all required tokens are provided
      const missingTokens = template.tokens.filter(token => !(token in tokens));
      if (missingTokens.length > 0) {
        console.warn(`Toast | Missing tokens for template "${templateId}": ${missingTokens.join(', ')}`);
        return null;
      }

      // Replace tokens in template
      let rendered = template.template;
      for (const [key, value] of Object.entries(tokens)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        rendered = rendered.replace(regex, value);
      }

      return rendered;
    } catch (err) {
      console.error("Toast | Failed to render template:", err);
      return null;
    }
  }

  /**
   * Get a registered template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} Template configuration, or null if not found
   */
  static getTemplate(templateId) {
    return this.templates[templateId] || null;
  }

  /**
   * List all registered templates
   * @param {string} tag - Optional tag filter
   * @returns {Array<Object>} Array of {id, template, tokens, tags, duration}
   */
  static listTemplates(tag = null) {
    const list = [];
    for (const [id, config] of Object.entries(this.templates)) {
      if (tag === null || config.tags.includes(tag)) {
        list.push({ id, ...config });
      }
    }
    return list;
  }

  /**
   * Delete a registered template
   * @param {string} templateId - Template ID to delete
   * @returns {boolean} True if deleted, false if not found
   */
  static deleteTemplate(templateId) {
    if (this.templates[templateId]) {
      delete this.templates[templateId];
      console.log(`Toast | Deleted template: ${templateId}`);
      return true;
    }
    return false;
  }

  /**
   * Initialize built-in epic moment templates
   */
  static initializeBuiltInTemplates() {
    // Boss/Enemy Defeats
    this.registerTemplate("boss-kill", {
      template: "{killer} strikes the final blow against {boss}! Victory is yours!",
      tags: ["boss", "victory", "combat"],
      duration: 4
    });

    this.registerTemplate("epic-defeat", {
      template: "{player} has vanquished {enemy}! The battle is won!",
      tags: ["combat", "victory"],
      duration: 3
    });

    // Healing/Support
    this.registerTemplate("clutch-heal", {
      template: "{healer} comes in with a clutch heal on {target}, pulling them back from the brink of death!",
      tags: ["heal", "dramatic", "support"],
      duration: 5
    });

    this.registerTemplate("life-saver", {
      template: "When all hope seemed lost, {savior} turned the tide of battle!",
      tags: ["dramatic", "save", "support"],
      duration: 4
    });

    // Kill Streaks
    this.registerTemplate("triple-kill", {
      template: "{player} just eliminated {victim1}, {victim2}, and {victim3} in rapid succession! Unstoppable!",
      tags: ["kill-streak", "combat"],
      duration: 6
    });

    this.registerTemplate("killing-spree", {
      template: "{player} is on an absolute rampage! {count} enemies down!",
      tags: ["kill-streak", "combat"],
      duration: 4
    });

    // Critical Moments
    this.registerTemplate("clutch-save", {
      template: "{player} saves the party from certain doom!",
      tags: ["dramatic", "save"],
      duration: 3
    });

    this.registerTemplate("perfect-shot", {
      template: "Incredible! {player} lands the perfect shot on {target}!",
      tags: ["combat", "skill"],
      duration: 3
    });

    // Party Achievements
    this.registerTemplate("quest-complete", {
      template: "The party has completed {quest}! Huzzah!",
      tags: ["quest", "achievement"],
      duration: 3
    });

    this.registerTemplate("level-up", {
      template: "{player} has reached level {level}! Power increasing!",
      tags: ["progression", "achievement"],
      duration: 3
    });

    console.log(`Toast | Initialized ${Object.keys(this.templates).length} built-in templates`);
  }
}


/**
 * WebP Animation Detection Utilities
 *
 * Provides robust detection of animated WebP files by reading file headers
 * rather than relying on file extension alone.
 */

/**
 * Convert bytes to ASCII string
 * @private
 */
function _str(bytes, off, len) {
  // Avoid allocating TextDecoder repeatedly; tiny enough for convenience:
  return new TextDecoder("ascii").decode(bytes.subarray(off, off + len));
}

/**
 * Core check from a Uint8Array of the file contents
 * @param {Uint8Array} bytes - The file contents
 * @returns {boolean} True if the WebP is animated
 */
export function isWebPAnimated(bytes) {
  if (bytes.length < 12) return false;
  if (_str(bytes, 0, 4) !== "RIFF" || _str(bytes, 8, 4) !== "WEBP") return false;

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 12;
  while (i + 8 <= bytes.length) {
    const fourcc = _str(bytes, i, 4);
    const size = dv.getUint32(i + 4, true);
    const start = i + 8;

    // VP8X feature flags (byte 0 of payload). Bit 1 (0x02) = animation.
    if (fourcc === "VP8X" && size >= 1) {
      const features = bytes[start];
      if (features & 0x02) return true;
    }
    // ANIM chunk definitively indicates an animated WebP
    if (fourcc === "ANIM") return true;

    // chunks are padded to even sizes
    i = start + size + (size & 1);
  }
  return false;
}

/**
 * Optional: count frames (ANMF chunk occurrences)
 * @param {Uint8Array} bytes - The file contents
 * @returns {number} Number of animation frames
 */
export function countWebPFrames(bytes) {
  if (_str(bytes, 0, 4) !== "RIFF" || _str(bytes, 8, 4) !== "WEBP") return 0;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 12, frames = 0;
  while (i + 8 <= bytes.length) {
    const fourcc = _str(bytes, i, 4);
    const size = dv.getUint32(i + 4, true);
    if (fourcc === "ANMF") frames += 1;
    i = i + 8 + size + (size & 1);
  }
  return frames;
}

/**
 * From a URL that Foundry serves (e.g., token/tiles artwork)
 * @param {string} src - The URL to fetch
 * @returns {Promise<boolean>} True if the WebP is animated
 */
export async function isWebPAnimatedFromURL(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`Toast | Failed to fetch ${src}: ${res.status}`);
      return false;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return isWebPAnimated(buf);
  } catch (err) {
    console.warn(`Toast | Error checking WebP animation for ${src}:`, err);
    return false;
  }
}

/**
 * From a Blob/File (e.g., from FilePicker onChange)
 * @param {Blob} blob - The blob/file to check
 * @returns {Promise<boolean>} True if the WebP is animated
 */
export async function isWebPAnimatedFromBlob(blob) {
  try {
    const buf = new Uint8Array(await blob.arrayBuffer());
    return isWebPAnimated(buf);
  } catch (err) {
    console.warn(`Toast | Error checking WebP animation from blob:`, err);
    return false;
  }
}


/**
 * APNG (Animated PNG) Detection Utilities
 *
 * Provides robust detection of animated PNG files by reading file headers
 * and checking for the acTL (animation control) chunk.
 */

const PNG_SIG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

/**
 * Check if bytes match PNG signature
 * @private
 */
function _eqSig(bytes, off = 0) {
  if (bytes.length < off + 8) return false;
  for (let i = 0; i < 8; i++) if (bytes[off + i] !== PNG_SIG[i]) return false;
  return true;
}

/**
 * Convert chunk type bytes to string
 * @private
 */
function _typeToStr(bytes, off) {
  return String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
}

/**
 * Core: tell if a PNG byte array is APNG; optionally return frame count.
 * @param {Uint8Array} bytes - The file contents
 * @returns {{isAPNG: boolean, frames: number}} Detection result with frame count
 */
export function parseAPNG(bytes) {
  if (!_eqSig(bytes, 0)) return { isAPNG: false, frames: 0 };

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 8; // after signature
  let isAPNG = false;
  let frames = 0;

  while (p + 12 <= bytes.length) {
    const length = dv.getUint32(p, false);      // big-endian
    const typeOff = p + 4;
    const type = _typeToStr(bytes, typeOff);
    const dataOff = p + 8;
    const next = dataOff + length + 4; // skip CRC

    // Safety
    if (next > bytes.length) break;

    if (type === 'acTL') {
      isAPNG = true;
      // num_frames is first 4 bytes of acTL data
      if (length >= 4) frames = dv.getUint32(dataOff, false);
      // We could continue to confirm, but acTL presence is definitive
      return { isAPNG, frames };
    }

    // Optimization: if we hit IDAT before seeing acTL, it's a normal PNG
    if (type === 'IDAT') {
      return { isAPNG: false, frames: 0 };
    }

    if (type === 'IEND') break;
    p = next;
  }

  return { isAPNG: false, frames: 0 };
}

/**
 * Convenience: boolean-only check from bytes
 * @param {Uint8Array} bytes - The file contents
 * @returns {boolean} True if the PNG is animated
 */
export function isAPNG(bytes) {
  return parseAPNG(bytes).isAPNG;
}

/**
 * From a URL that Foundry serves (tiles, tokens, etc.)
 * @param {string} src - The URL to fetch
 * @returns {Promise<boolean>} True if the PNG is animated
 */
export async function isAPNGFromURL(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`Toast | Failed to fetch ${src}: ${res.status}`);
      return false;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return isAPNG(buf);
  } catch (err) {
    console.warn(`Toast | Error checking APNG for ${src}:`, err);
    return false;
  }
}

/**
 * Get APNG frame count (0 for non-APNG) from URL
 * @param {string} src - The URL to fetch
 * @returns {Promise<number>} Number of animation frames (0 if not animated)
 */
export async function apngFrameCountFromURL(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`Toast | Failed to fetch ${src}: ${res.status}`);
      return 0;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return parseAPNG(buf).frames;
  } catch (err) {
    console.warn(`Toast | Error checking APNG frame count for ${src}:`, err);
    return 0;
  }
}

/**
 * From a Blob/File (e.g., FilePicker)
 * @param {Blob} blob - The blob/file to check
 * @returns {Promise<boolean>} True if the PNG is animated
 */
export async function isAPNGFromBlob(blob) {
  try {
    const buf = new Uint8Array(await blob.arrayBuffer());
    return isAPNG(buf);
  } catch (err) {
    console.warn(`Toast | Error checking APNG from blob:`, err);
    return false;
  }
}


/**
 * Package Class
 * Represents a reusable toast presentation configuration
 */
class Package {
  /**
   * Create a new Package
   * @param {Object} data - Package configuration data
   */
  constructor(data = {}) {
    // Metadata
    this.id = data.id || this._generateId(data.name || "Untitled");
    this.name = data.name || "Untitled Package";
    this.description = data.description || "";
    this.version = data.version || "1.0.0";

    // Authorship
    this.author = data.author || (game?.user?.name || "Unknown");
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    // Organization
    this.category = data.category || "custom";
    this.tags = data.tags || [];
    this.thumbnail = data.thumbnail || "";

    // Scope
    this.scope = data.scope || "world";
    this.worldId = data.worldId || (game?.world?.id || null);

    // Toast configuration
    this.config = data.config || { elements: [] };

    // Token placeholders
    this.tokens = data.tokens || {};

    // Asset dependencies
    this.dependencies = data.dependencies || { images: [], sounds: [] };

    // Auto-extract dependencies from config if not provided
    if (Object.keys(this.dependencies.images).length === 0 &&
        Object.keys(this.dependencies.sounds).length === 0) {
      this._extractDependencies();
    }
  }

  /**
   * Generate a package ID from the name
   * @param {string} name - Package name
   * @returns {string} Sanitized ID
   * @private
   */
  _generateId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) || 'package-' + foundry.utils.randomID(8);
  }

  /**
   * Extract asset dependencies from config
   * @private
   */
  _extractDependencies() {
    if (!this.config || !this.config.elements) return;

    const images = new Set();
    const sounds = new Set();

    for (const element of this.config.elements) {
      if (element.type === "image" && element.src) {
        images.add(element.src);
      } else if (element.type === "sound" && element.src) {
        sounds.add(element.src);
      }
    }

    this.dependencies.images = Array.from(images);
    this.dependencies.sounds = Array.from(sounds);
  }

  /**
   * Validate package data structure
   * @returns {Promise<boolean>} True if valid
   * @throws {Error} If validation fails
   */
  async validate() {
    // Basic required fields
    if (!this.name || this.name.trim() === "") {
      throw new Error("Package name is required");
    }

    if (!this.id || this.id.trim() === "") {
      throw new Error("Package ID is required");
    }

    if (!this.config) {
      throw new Error("Package config is required");
    }

    if (!this.config.elements || !Array.isArray(this.config.elements)) {
      throw new Error("Package must have an elements array");
    }

    if (this.config.elements.length === 0) {
      throw new Error("Package must have at least one element");
    }

    // Validate each element
    for (let i = 0; i < this.config.elements.length; i++) {
      const element = this.config.elements[i];

      if (!element.type) {
        throw new Error(`Element ${i} is missing type property`);
      }

      if (!element.id) {
        throw new Error(`Element ${i} is missing id property`);
      }

      // Type-specific validation
      if (element.type === "text" && !element.text) {
        throw new Error(`Text element ${element.id} is missing text property`);
      }

      if (element.type === "image" && !element.src) {
        throw new Error(`Image element ${element.id} is missing src property`);
      }

      if (element.type === "sound" && !element.src) {
        throw new Error(`Sound element ${element.id} is missing src property`);
      }
    }

    // Validate category
    const validCategories = ["combat", "social", "exploration", "custom"];
    if (!validCategories.includes(this.category)) {
      console.warn(`Invalid category "${this.category}", using "custom"`);
      this.category = "custom";
    }

    // Validate scope
    const validScopes = ["world", "global"];
    if (!validScopes.includes(this.scope)) {
      console.warn(`Invalid scope "${this.scope}", using "world"`);
      this.scope = "world";
    }

    // Validate version format (basic semver check)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(this.version)) {
      console.warn(`Invalid version "${this.version}", using "1.0.0"`);
      this.version = "1.0.0";
    }

    return true;
  }

  /**
   * Validate that all asset dependencies exist
   * @returns {Promise<Object>} Object with missing arrays: { images: [], sounds: [] }
   */
  async validateDependencies() {
    const missing = {
      images: [],
      sounds: []
    };

    // Check image dependencies
    for (const imagePath of this.dependencies.images) {
      const exists = await this._assetExists(imagePath);
      if (!exists) {
        missing.images.push(imagePath);
      }
    }

    // Check sound dependencies
    for (const soundPath of this.dependencies.sounds) {
      const exists = await this._assetExists(soundPath);
      if (!exists) {
        missing.sounds.push(soundPath);
      }
    }

    return missing;
  }

  /**
   * Check if an asset file exists
   * @param {string} path - Asset path
   * @returns {Promise<boolean>} True if exists
   * @private
   */
  async _assetExists(path) {
    try {
      // Try to fetch the file header
      const response = await fetch(path, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      console.warn(`Toast Package | Could not verify asset: ${path}`, err);
      return false;
    }
  }

  /**
   * Apply token replacements to config
   * @param {Object} tokenMap - Token value mapping { tokenName: value }
   * @returns {Object} Config with tokens replaced
   */
  applyTokens(tokenMap = {}) {
    // Deep clone config to avoid mutating original
    const config = foundry.utils.deepClone(this.config);

    // Merge with default token values
    const finalTokens = {};
    for (const [key, tokenDef] of Object.entries(this.tokens)) {
      finalTokens[key] = tokenMap[key] !== undefined
        ? tokenMap[key]
        : (tokenDef.default || "");
    }

    // Replace tokens in all text elements
    for (const element of config.elements) {
      if (element.type === "text" && element.text) {
        element.text = this._replaceTokens(element.text, finalTokens);
      }
    }

    return config;
  }

  /**
   * Replace token placeholders in text
   * @param {string} text - Text with token placeholders
   * @param {Object} tokenMap - Token values
   * @returns {string} Text with replacements
   * @private
   */
  _replaceTokens(text, tokenMap) {
    let result = text;

    for (const [key, value] of Object.entries(tokenMap)) {
      // Replace {{tokenName}} with value
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Update package properties
   * @param {Object} updates - Properties to update
   */
  update(updates) {
    // Prevent updating certain immutable fields
    const immutableFields = ['id', 'createdAt', 'author'];

    for (const [key, value] of Object.entries(updates)) {
      if (immutableFields.includes(key)) {
        console.warn(`Toast Package | Cannot update immutable field: ${key}`);
        continue;
      }

      this[key] = value;
    }

    // Update timestamp
    this.updatedAt = new Date().toISOString();

    // Re-extract dependencies if config changed
    if (updates.config) {
      this._extractDependencies();
    }
  }

  /**
   * Convert package to JSON for storage
   * @returns {Object} JSON-serializable object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      category: this.category,
      tags: this.tags,
      thumbnail: this.thumbnail,
      scope: this.scope,
      worldId: this.worldId,
      config: this.config,
      tokens: this.tokens,
      dependencies: this.dependencies
    };
  }

  /**
   * Create a Package from JSON data
   * @param {Object} json - JSON data
   * @returns {Package} Package instance
   */
  static fromJSON(json) {
    return new Package(json);
  }

  /**
   * Get a human-readable summary
   * @returns {string} Package summary
   */
  toString() {
    const elementCount = this.config?.elements?.length || 0;
    const tokenCount = Object.keys(this.tokens).length;

    return `Package "${this.name}" (${this.id})
  Category: ${this.category}
  Scope: ${this.scope}
  Elements: ${elementCount}
  Tokens: ${tokenCount}
  Author: ${this.author}
  Version: ${this.version}`;
  }

  /**
   * Get the file path for this package
   * @returns {string} File path relative to data directory
   */
  getFilePath() {
    if (this.scope === "global") {
      return `modules/toast/packages/${this.id}.json`;
    } else {
      return `worlds/${this.worldId}/toast-packages/${this.id}.json`;
    }
  }

  /**
   * Extract all token placeholders from config
   * @returns {string[]} Array of unique token names found in text
   */
  extractTokenPlaceholders() {
    const tokens = new Set();
    const tokenRegex = /\{\{([^}]+)\}\}/g;

    if (!this.config || !this.config.elements) return [];

    for (const element of this.config.elements) {
      if (element.type === "text" && element.text) {
        let match;
        while ((match = tokenRegex.exec(element.text)) !== null) {
          tokens.add(match[1]);
        }
      }
    }

    return Array.from(tokens);
  }

  /**
   * Clone this package with a new name
   * @param {string} newName - Name for the clone
   * @returns {Package} New package instance
   */
  clone(newName) {
    const data = this.toJSON();

    // Remove temporal fields
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    // Set new name
    data.name = newName;

    return new Package(data);
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Package;
}


/**
 * PackageManager Class
 * Manages toast packages - loading, saving, CRUD operations
 */
class PackageManager {
  /**
   * Create a new PackageManager
   */
  constructor() {
    // In-memory package storage: id -> Package
    this.packages = new Map();

    // Loading state
    this.loaded = false;
    this.loading = false;

    // Cache directory paths
    this._globalDir = "modules/toast/packages";
    this._worldDir = null;
  }

  /**
   * Initialize and load all packages from disk
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.loaded || this.loading) {
      console.log("Toast PackageManager | Already initialized or loading");
      return;
    }

    this.loading = true;
    console.log("Toast PackageManager | Initializing...");

    try {
      // Set world directory
      if (game?.world?.id) {
        this._worldDir = `worlds/${game.world.id}/toast-packages`;
      }

      // Load packages from both locations
      await this._loadGlobalPackages();
      await this._loadWorldPackages();

      this.loaded = true;
      this.loading = false;

      console.log(`Toast PackageManager | Loaded ${this.packages.size} packages`);
    } catch (err) {
      this.loading = false;
      console.error("Toast PackageManager | Initialization failed:", err);
      throw err;
    }
  }

  /**
   * Load packages from global directory
   * @returns {Promise<void>}
   * @private
   */
  async _loadGlobalPackages() {
    try {
      const files = await this._listPackageFiles(this._globalDir);
      console.log(`Toast PackageManager | Found ${files.length} global packages`);

      for (const filePath of files) {
        await this._loadPackageFile(filePath, "global");
      }
    } catch (err) {
      // Directory might not exist yet - that's okay
      console.log("Toast PackageManager | No global packages directory:", err.message);
    }
  }

  /**
   * Load packages from world directory
   * @returns {Promise<void>}
   * @private
   */
  async _loadWorldPackages() {
    if (!this._worldDir) {
      console.log("Toast PackageManager | No world directory configured");
      return;
    }

    try {
      const files = await this._listPackageFiles(this._worldDir);
      console.log(`Toast PackageManager | Found ${files.length} world packages`);

      for (const filePath of files) {
        await this._loadPackageFile(filePath, "world");
      }
    } catch (err) {
      // Directory might not exist yet - that's okay
      console.log("Toast PackageManager | No world packages directory:", err.message);
    }
  }

  /**
   * List all .json files in a directory
   * @param {string} directory - Directory path
   * @returns {Promise<string[]>} Array of file paths
   * @private
   */
  async _listPackageFiles(directory) {
    try {
      // Browse the directory using FilePicker
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      const result = await FilePicker.browse("data", directory);

      if (result.files) {
        // Filter: must end with .json AND must not be archived
        return result.files.filter(f => f.endsWith('.json') && !f.includes('.archived.'));
      }

      return [];
    } catch (err) {
      // Directory might not exist - that's okay, just return empty array
      console.log(`Toast PackageManager | Directory does not exist or is empty: ${directory}`);
      return [];
    }
  }

  /**
   * Load a single package file
   * @param {string} filePath - File path
   * @param {string} expectedScope - Expected scope for validation
   * @returns {Promise<void>}
   * @private
   */
  async _loadPackageFile(filePath, expectedScope) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Could not fetch ${filePath}`);
      }

      const json = await response.json();
      const pkg = Package.fromJSON(json);

      // Validate scope matches location
      if (pkg.scope !== expectedScope) {
        console.warn(`Toast PackageManager | Package scope mismatch: ${pkg.id} (expected ${expectedScope}, got ${pkg.scope})`);
      }

      this.packages.set(pkg.id, pkg);
      console.log(`Toast PackageManager | Loaded package: ${pkg.id}`);
    } catch (err) {
      console.error(`Toast PackageManager | Failed to load package ${filePath}:`, err);
    }
  }

  /**
   * Create a new package
   * @param {Object} config - Package configuration
   * @returns {Promise<Package>} Created package
   */
  async create(config) {
    // Ensure initialized
    if (!this.loaded) {
      await this.initialize();
    }

    // Create package instance
    const pkg = new Package(config);

    // Validate package
    await pkg.validate();

    // Check for ID collision
    if (this.packages.has(pkg.id)) {
      throw new Error(`Package with ID "${pkg.id}" already exists. Use update() to modify existing packages.`);
    }

    // Save to disk
    await this._savePackage(pkg);

    // Add to memory
    this.packages.set(pkg.id, pkg);

    console.log(`Toast PackageManager | Created package: ${pkg.id}`);
    return pkg;
  }

  /**
   * Get a package by ID
   * @param {string} id - Package ID
   * @returns {Package|null} Package instance or null
   */
  get(id) {
    return this.packages.get(id) || null;
  }

  /**
   * List all packages with optional filters
   * @param {Object} filters - Filter options
   * @param {string} [filters.category] - Filter by category
   * @param {string[]} [filters.tags] - Filter by tags (all must match)
   * @param {string} [filters.search] - Search in name/description
   * @param {string} [filters.scope] - Filter by scope (world/global)
   * @param {string} [filters.author] - Filter by author
   * @returns {Package[]} Array of matching packages
   */
  list(filters = {}) {
    let packages = Array.from(this.packages.values());

    // Filter by category
    if (filters.category) {
      packages = packages.filter(p => p.category === filters.category);
    }

    // Filter by tags (all tags must be present)
    if (filters.tags && filters.tags.length > 0) {
      packages = packages.filter(p =>
        filters.tags.every(tag => p.tags.includes(tag))
      );
    }

    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      packages = packages.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by scope
    if (filters.scope) {
      packages = packages.filter(p => p.scope === filters.scope);
    }

    // Filter by author
    if (filters.author) {
      packages = packages.filter(p => p.author === filters.author);
    }

    // Sort by name (default)
    packages.sort((a, b) => a.name.localeCompare(b.name));

    return packages;
  }

  /**
   * Update an existing package
   * @param {string} id - Package ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<Package>} Updated package
   */
  async update(id, updates) {
    const pkg = this.get(id);
    if (!pkg) {
      throw new Error(`Package not found: ${id}`);
    }

    // Apply updates
    pkg.update(updates);

    // Validate updated package
    await pkg.validate();

    // Save to disk
    await this._savePackage(pkg);

    console.log(`Toast PackageManager | Updated package: ${id}`);
    return pkg;
  }

  /**
   * Delete a package
   * @param {string} id - Package ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const pkg = this.get(id);
    if (!pkg) {
      throw new Error(`Package not found: ${id}`);
    }

    // Delete file from disk
    await this._deletePackageFile(pkg);

    // Remove from memory
    this.packages.delete(id);

    console.log(`Toast PackageManager | Deleted package: ${id}`);
  }

  /**
   * Launch a package with token mapping
   * @param {string} id - Package ID
   * @param {Object} tokenMap - Token value mapping
   * @param {Object} options - Launch options
   * @returns {Promise<void>}
   */
  async launch(id, tokenMap = {}, options = {}) {
    const pkg = this.get(id);
    if (!pkg) {
      throw new Error(`Package not found: ${id}`);
    }

    // Validate dependencies
    const missing = await pkg.validateDependencies();
    const hasMissing = missing.images.length > 0 || missing.sounds.length > 0;

    if (hasMissing) {
      const missingList = [...missing.images, ...missing.sounds];
      throw new Error(`Package "${pkg.name}" has missing dependencies:\n${missingList.join('\n')}`);
    }

    // Apply token replacements
    const config = pkg.applyTokens(tokenMap);

    // Launch the toast via ToastManager
    if (!game.toast || !game.toast.show) {
      throw new Error("Toast system not available");
    }

    console.log(`Toast PackageManager | Launching package: ${pkg.name}`);
    return await game.toast.show(config.elements);
  }

  /**
   * Export a package as JSON string
   * @param {string} id - Package ID
   * @returns {string} JSON string
   */
  export(id) {
    const pkg = this.get(id);
    if (!pkg) {
      throw new Error(`Package not found: ${id}`);
    }

    return JSON.stringify(pkg.toJSON(), null, 2);
  }

  /**
   * Import a package from JSON
   * @param {string|Object} json - JSON string or parsed object
   * @param {Object} options - Import options
   * @param {boolean} [options.overwrite=false] - Overwrite if exists
   * @returns {Promise<Package>} Imported package
   */
  async import(json, options = {}) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    // Check for ID collision
    let finalId = data.id;
    if (this.packages.has(finalId)) {
      if (options.overwrite) {
        // Delete existing package
        await this.delete(finalId);
      } else {
        // Generate new unique ID
        let counter = 2;
        while (this.packages.has(`${data.id}-${counter}`)) {
          counter++;
        }
        finalId = `${data.id}-${counter}`;
        console.log(`Toast PackageManager | ID collision, using: ${finalId}`);
      }
    }

    // Set final ID
    data.id = finalId;

    // Reset timestamps for imported packages
    delete data.createdAt;
    delete data.updatedAt;

    // Create package
    return await this.create(data);
  }

  /**
   * Duplicate an existing package
   * @param {string} id - Package ID to duplicate
   * @param {string} newName - Name for the duplicate
   * @returns {Promise<Package>} Duplicated package
   */
  async duplicate(id, newName) {
    const original = this.get(id);
    if (!original) {
      throw new Error(`Package not found: ${id}`);
    }

    // Clone the package
    const duplicate = original.clone(newName);

    // Create the new package
    return await this.create(duplicate.toJSON());
  }

  /**
   * Refresh packages from disk (reload)
   * @returns {Promise<void>}
   */
  async refresh() {
    console.log("Toast PackageManager | Refreshing packages...");

    // Clear current packages
    this.packages.clear();
    this.loaded = false;

    // Reload from disk
    await this.initialize();
  }

  /**
   * Get all unique categories from loaded packages
   * @returns {string[]} Array of category names
   */
  getCategories() {
    const categories = new Set();
    for (const pkg of this.packages.values()) {
      categories.add(pkg.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * Get all unique tags from loaded packages
   * @returns {string[]} Array of tag names
   */
  getTags() {
    const tags = new Set();
    for (const pkg of this.packages.values()) {
      for (const tag of pkg.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }

  /**
   * Get all unique authors from loaded packages
   * @returns {string[]} Array of author names
   */
  getAuthors() {
    const authors = new Set();
    for (const pkg of this.packages.values()) {
      authors.add(pkg.author);
    }
    return Array.from(authors).sort();
  }

  /**
   * Save a package to disk
   * @param {Package} pkg - Package to save
   * @returns {Promise<void>}
   * @private
   */
  async _savePackage(pkg) {
    const filePath = pkg.getFilePath();
    const json = JSON.stringify(pkg.toJSON(), null, 2);

    try {
      // Validate file path
      if (!filePath) {
        throw new Error("Package getFilePath() returned null/undefined");
      }

      // Extract directory from file path (Foundry's upload expects directory only)
      const lastSlashIndex = filePath.lastIndexOf('/');
      if (lastSlashIndex === -1) {
        throw new Error(`Invalid file path (no directory separator): ${filePath}`);
      }

      const directory = filePath.substring(0, lastSlashIndex);

      console.log(`Toast PackageManager | Saving package ${pkg.id} to directory: ${directory}`);

      // Create directory if it doesn't exist
      try {
        await foundry.applications.apps.FilePicker.implementation.createDirectory("data", directory, {});
        console.log(`Toast PackageManager | Created directory: ${directory}`);
      } catch (err) {
        // Directory might already exist - that's fine
        if (!err.message?.includes("EEXIST")) {
          console.warn(`Toast PackageManager | Could not create directory:`, err);
        }
      }

      // Create a File object with the JSON content
      const file = new File([json], `${pkg.id}.json`, { type: "application/json" });

      // Use FilePicker.upload instead of raw fetch
      const result = await foundry.applications.apps.FilePicker.implementation.upload("data", directory, file, {}, { notify: false });

      if (!result || !result.path) {
        throw new Error(`Upload failed: No path returned`);
      }

      console.log(`Toast PackageManager | Saved package to: ${result.path}`);
    } catch (err) {
      console.error(`Toast PackageManager | Failed to save package ${pkg.id}:`, err);
      throw new Error(`Could not save package: ${err.message}`);
    }
  }

  /**
   * Delete a package file from disk
   * @param {Package} pkg - Package to delete
   * @returns {Promise<void>}
   * @private
   */
  async _deletePackageFile(pkg) {
    const filePath = pkg.getFilePath();

    try {
      console.log(`Toast PackageManager | Deleting package file: ${filePath}`);

      // Since deletion might not be available, try renaming to .archived
      // This allows us to filter out archived files when loading
      const archivedPath = await this._archivePackageFile(filePath);

      if (archivedPath) {
        console.log(`Toast PackageManager | Archived package: ${filePath} -> ${archivedPath}`);
        ui.notifications?.info(`Package "${pkg.name}" deleted successfully`);
      } else {
        ui.notifications?.warn(`Package "${pkg.name}" removed from library. File may still exist at: ${filePath}`);
      }
    } catch (err) {
      console.error(`Toast PackageManager | Failed to archive package file ${filePath}:`, err);
      ui.notifications?.warn(`Package removed from library, but file archival failed. File may still exist at: ${filePath}`);
    }
  }

  /**
   * Archive a package file by renaming it with .archived.#.json extension
   * @param {string} filePath - Original file path
   * @returns {Promise<string|null>} New archived path, or null if failed
   * @private
   */
  async _archivePackageFile(filePath) {
    try {
      // Generate archived filename
      const basePath = filePath.replace(/\.json$/, '');
      let archivedPath = `${basePath}.archived.1.json`;
      let counter = 1;

      // Find next available archived filename
      const directory = filePath.substring(0, filePath.lastIndexOf('/'));
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      const result = await FilePicker.browse("data", directory);

      if (result.files) {
        const existingArchived = result.files.filter(f => f.startsWith(basePath + '.archived.'));
        while (existingArchived.includes(archivedPath)) {
          counter++;
          archivedPath = `${basePath}.archived.${counter}.json`;
        }
      }

      // Try to rename the file using fetch to a rename endpoint
      const renameResponse = await fetch('/rename', {
        method: 'POST',
        body: new URLSearchParams({
          source: 'data',
          target: filePath,
          newName: archivedPath.substring(archivedPath.lastIndexOf('/') + 1)
        })
      });

      if (renameResponse.ok) {
        return archivedPath;
      }

      // If rename endpoint doesn't work, try reading and re-uploading with new name
      console.log(`Toast PackageManager | Rename endpoint not available, trying copy-and-upload method`);

      // Read the original file
      const fileResponse = await fetch(filePath);
      if (!fileResponse.ok) {
        throw new Error(`Could not read file: ${filePath}`);
      }

      const content = await fileResponse.text();

      // Upload with new archived name
      const file = new File([content], archivedPath.substring(archivedPath.lastIndexOf('/') + 1), { type: "application/json" });
      const uploadResult = await FilePicker.upload("data", directory, file, {}, { notify: false });

      if (uploadResult && uploadResult.path) {
        console.log(`Toast PackageManager | Created archived copy: ${uploadResult.path}`);
        // Original file still exists, but we'll filter it out when loading
        return uploadResult.path;
      }

      return null;
    } catch (err) {
      console.error(`Toast PackageManager | Failed to archive file:`, err);
      return null;
    }
  }

  /**
   * Get statistics about loaded packages
   * @returns {Object} Package statistics
   */
  getStats() {
    const stats = {
      total: this.packages.size,
      byScope: { world: 0, global: 0 },
      byCategory: {},
      totalElements: 0,
      totalTokens: 0
    };

    for (const pkg of this.packages.values()) {
      // Scope counts
      stats.byScope[pkg.scope] = (stats.byScope[pkg.scope] || 0) + 1;

      // Category counts
      stats.byCategory[pkg.category] = (stats.byCategory[pkg.category] || 0) + 1;

      // Element counts
      stats.totalElements += pkg.config?.elements?.length || 0;

      // Token counts
      stats.totalTokens += Object.keys(pkg.tokens).length;
    }

    return stats;
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PackageManager;
}


/**
 * Token Mapping Dialog Helper
 * Creates a dialog for mapping token values before launching a package
 */
class TokenMappingDialog {
  /**
   * Show token mapping dialog and launch package with mapped values
   * @param {Package} pkg - Package to launch
   * @param {PackageManager} packageManager - Package manager instance
   * @returns {Promise<void>}
   */
  static async show(pkg, packageManager) {
    if (!pkg || !packageManager) {
      throw new Error("Package and PackageManager are required");
    }

    const tokens = pkg.tokens || {};
    const tokenKeys = Object.keys(tokens);

    if (tokenKeys.length === 0) {
      // No tokens, launch directly
      await packageManager.launch(pkg.id);
      return;
    }

    // Build form HTML
    const formHtml = this._buildFormHtml(tokens);

    // Show dialog
    return new Promise((resolve, reject) => {
      new Dialog({
        title: `Launch: ${pkg.name}`,
        content: formHtml,
        buttons: {
          launch: {
            icon: '<i class="fas fa-rocket"></i>',
            label: "Launch",
            callback: async (html) => {
              try {
                // Collect token values from form
                const tokenMap = {};
                for (const key of tokenKeys) {
                  const input = html.find(`[name="token-${key}"]`);
                  tokenMap[key] = input.val() || tokens[key].default || "";
                }

                // Launch with token mapping
                await packageManager.launch(pkg.id, tokenMap);
                ui.notifications.info(`Package "${pkg.name}" launched`);
                resolve();
              } catch (err) {
                console.error("Token Mapping Dialog | Launch failed:", err);
                ui.notifications.error("Failed to launch package: " + err.message);
                reject(err);
              }
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve()
          }
        },
        default: "launch",
        render: (html) => {
          // Auto-focus first input
          html.find("input[type='text']").first().focus();
        }
      }, {
        width: 500,
        classes: ["toast-token-mapping-dialog"]
      }).render(true);
    });
  }

  /**
   * Build form HTML for token inputs
   * @param {Object} tokens - Token definitions
   * @returns {string} HTML string
   * @private
   */
  static _buildFormHtml(tokens) {
    const tokenKeys = Object.keys(tokens);

    let html = `
      <form class="token-mapping-form">
        <p class="dialog-hint">
          <i class="fas fa-info-circle"></i>
          This package uses dynamic tokens. Fill in the values below to customize the toast.
        </p>
    `;

    for (const key of tokenKeys) {
      const token = tokens[key];
      const label = token.label || key;
      const description = token.description || "";
      const defaultValue = token.default || "";
      const type = token.type || "string";

      html += `
        <div class="form-group">
          <label for="token-${key}">
            ${label}
            ${description ? `<i class="fas fa-question-circle" title="${description}"></i>` : ""}
          </label>
      `;

      // Render input based on token type
      switch (type) {
        case "number":
          html += `
            <input
              type="number"
              name="token-${key}"
              id="token-${key}"
              value="${defaultValue}"
              placeholder="${label}"
            />
          `;
          break;

        case "boolean":
          html += `
            <select name="token-${key}" id="token-${key}">
              <option value="true" ${defaultValue === "true" ? "selected" : ""}>True</option>
              <option value="false" ${defaultValue === "false" ? "selected" : ""}>False</option>
            </select>
          `;
          break;

        case "string":
        default:
          html += `
            <input
              type="text"
              name="token-${key}"
              id="token-${key}"
              value="${defaultValue}"
              placeholder="${label}"
            />
          `;
          break;
      }

      if (description) {
        html += `<small class="form-hint">${description}</small>`;
      }

      html += `</div>`;
    }

    html += `
        <div class="token-preview">
          <strong>Token Placeholders:</strong>
          <div class="token-list">
    `;

    for (const key of tokenKeys) {
      html += `<code>{{${key}}}</code>`;
    }

    html += `
          </div>
        </div>
      </form>
    `;

    return html;
  }

  /**
   * Get token values from selected tokens (if any)
   * Helper for future token picker integration
   * @param {Token[]} selectedTokens - Selected canvas tokens
   * @returns {Object} Token value suggestions
   */
  static getTokenSuggestions(selectedTokens = []) {
    if (!selectedTokens || selectedTokens.length === 0) {
      return {};
    }

    const suggestions = {};
    const token = selectedTokens[0];

    // Common token attributes that might be useful
    if (token.actor) {
      suggestions.actorName = token.actor.name;
      suggestions.characterName = token.actor.name;
      suggestions.playerName = token.actor.name;
    }

    if (token.name) {
      suggestions.tokenName = token.name;
    }

    // HP values
    if (token.actor?.system?.attributes?.hp) {
      const hp = token.actor.system.attributes.hp;
      suggestions.currentHP = hp.value;
      suggestions.maxHP = hp.max;
    }

    return suggestions;
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenMappingDialog;
}


/**
 * Toast Studio Application
 * Main GUI window for Toast content creation
 *
 * Provides:
 * - Asset browsing (audio, images)
 * - Package management
 * - Visual toast editor (future)
 */
class ToastStudioApp extends FormApplication {
  constructor(options = {}) {
    super({}, options);

    this.activeTab = options.tab || game.settings.get("toast", "studio-default-tab") || "assets";
    this.activeAssetsSubTab = options.assetsSubTab || game.settings.get("toast", "assets-default-subtab") || "audio";
    this.assetBrowser = null;

    // Image preview zoom/pan state
    this.previewZoom = 1.0;
    this.previewPanX = 0;
    this.previewPanY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
  }

  /**
   * FormApplication configuration
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "toast-studio",
      title: "Toast Studio",
      template: "modules/toast/templates/toast-studio.hbs",
      width: 900,
      height: 700,
      resizable: true,
      closeOnSubmit: false,
      submitOnChange: false,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".tab-content",
          initial: "assets"
        }
      ]
    });
  }

  /**
   * Get data for template rendering
   */
  async getData() {
    const data = await super.getData();

    data.activeTab = this.activeTab;

    // Provide tabs as both array (for iteration) and object (for property access)
    const tabsArray = [
      {
        id: "assets",
        label: "Assets",
        icon: "fas fa-images",
        active: this.activeTab === "assets"
      },
      {
        id: "packages",
        label: "Packages",
        icon: "fas fa-box",
        active: this.activeTab === "packages"
      },
      {
        id: "studio",
        label: "Studio",
        icon: "fas fa-palette",
        active: this.activeTab === "studio",
        disabled: true // Disabled until Phase 4.4
      }
    ];

    data.tabs = tabsArray; // Array for {{#each tabs}}
    data.tabsByName = {    // Object for {{#if tabsByName.packages.active}}
      assets: tabsArray[0],
      packages: tabsArray[1],
      studio: tabsArray[2]
    };

    // Get asset data
    if (this.activeTab === "assets") {
      // Sub-tab data
      data.assetsSubTab = {
        directories: {
          id: "directories",
          active: this.activeAssetsSubTab === "directories"
        },
        audio: {
          id: "audio",
          active: this.activeAssetsSubTab === "audio"
        },
        images: {
          id: "images",
          active: this.activeAssetsSubTab === "images"
        }
      };

      // Get directories and assets
      data.directories = await this._getDirectoriesData();
      data.assets = await this._getAssetData();
    }

    // Get package data
    if (this.activeTab === "packages") {
      const packageData = await this._getPackageData();
      data.packages = packageData.packages;
      data.packageStats = packageData.packageStats;
    }

    return data;
  }

  /**
   * Get asset browser data
   */
  async _getAssetData() {
    const scannedAssets = await this._scanAllDirectories();
    return {
      audioFiles: scannedAssets.audio,
      imageFiles: scannedAssets.images,
      selectedCategory: "audio"
    };
  }

  /**
   * Get package browser data
   */
  async _getPackageData() {
    // Get all packages from PackageManager
    const packageManager = ToastManager.packageManager;

    if (!packageManager || !packageManager.loaded) {
      console.warn("Toast Studio | PackageManager not initialized");
      return {
        packages: [],
        packageStats: null
      };
    }

    // Get all packages
    const packages = packageManager.list();

    // Transform packages for template
    const packageData = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      version: pkg.version,
      author: pkg.author,
      category: pkg.category,
      tags: pkg.tags || [],
      thumbnail: pkg.thumbnail || null,
      scope: pkg.scope,
      tokenCount: Object.keys(pkg.tokens || {}).length,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    }));

    // Get statistics
    const stats = packageManager.getStats();

    return {
      packages: packageData,
      packageStats: stats
    };
  }

  /**
   * Get directories data for all types
   */
  async _getDirectoriesData() {
    return {
      default: this._getDefaultDirectories(),
      announcers: this._getAnnouncerPackDirectories(),
      custom: this._getCustomDirectories()
    };
  }

  /**
   * Get default module directories
   */
  _getDefaultDirectories() {
    return [
      {
        path: "modules/toast/sounds",
        type: "audio",
        source: "default",
        label: "Default Sounds"
      },
      {
        path: "modules/toast/images",
        type: "images",
        source: "default",
        label: "Default Images"
      }
    ];
  }

  /**
   * Get registered announcer pack directories
   */
  _getAnnouncerPackDirectories() {
    const announcers = [];
    const registered = ToastManager.registeredAnnouncers || {};

    for (const [id, config] of Object.entries(registered)) {
      announcers.push({
        id: id,
        path: config.path,
        name: config.name,
        type: "audio",
        source: "announcer",
        label: config.name
      });
    }

    return announcers;
  }

  /**
   * Get custom user directories from settings
   */
  _getCustomDirectories() {
    return game.settings.get("toast", "custom-asset-directories") || [];
  }

  // ==========================================
  // Multi-Directory Scanning Methods
  // ==========================================

  /**
   * Scan all directories (default, announcer, custom) for assets
   */
  async _scanAllDirectories() {
    const directories = await this._getDirectoriesData();

    // Flatten all directories into a single array with source tracking
    const allDirs = [
      ...directories.default,
      ...directories.announcers,
      ...directories.custom
    ];

    const results = {
      audio: [],
      images: []
    };

    // Scan each directory based on its type
    for (const dir of allDirs) {
      const dirSource = dir.source || "custom";

      if (dir.type === "audio" || dir.type === "both") {
        const audioFiles = await this._scanDirectory(dir.path, "audio", dirSource, dir.label || dir.name);
        results.audio.push(...audioFiles);
      }

      if (dir.type === "images" || dir.type === "both") {
        const imageFiles = await this._scanDirectory(dir.path, "images", dirSource, dir.label || dir.name);
        results.images.push(...imageFiles);
      }
    }

    return results;
  }

  /**
   * Scan a single directory for files of a specific type
   */
  async _scanDirectory(path, type, sourceType, sourceLabel) {
    const files = [];

    try {
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      const result = await FilePicker.browse("data", path);

      if (result.files) {
        // Collect promises for async operations (WebP animation detection)
        const filePromises = [];

        for (const file of result.files) {
          if (type === "audio" && this._isAudioFile(file)) {
            files.push(this._createAudioAsset(file, path, sourceType, sourceLabel));
          } else if (type === "images" && this._isImageFile(file)) {
            filePromises.push(this._createImageAsset(file, path, sourceType, sourceLabel));
          }
        }

        // Wait for all async image asset creation to complete
        const imageAssets = await Promise.all(filePromises);
        files.push(...imageAssets);
      }
    } catch (err) {
      console.warn(`Toast Studio | Error scanning directory ${path}:`, err);
    }

    return files;
  }

  /**
   * Create audio asset object with source tracking
   */
  _createAudioAsset(path, sourcePath, sourceType, sourceLabel) {
    return {
      path: path,
      name: path.split("/").pop(),
      source: sourcePath,
      sourceType: sourceType,
      sourceLabel: sourceLabel,
      category: this._getAudioCategory(path),
      size: "Unknown" // Placeholder - requires server-side API
    };
  }

  /**
   * Create image asset object with source tracking
   * @async - Performs WebP and APNG animation detection for accurate results
   */
  async _createImageAsset(path, sourcePath, sourceType, sourceLabel) {
    const ext = path.split(".").pop().toLowerCase();
    let animated = false;
    let animationType = null;

    // Determine if image is animated
    if (ext === "gif") {
      // GIF files are always considered animated
      animated = true;
      animationType = "gif";
    } else if (ext === "webp") {
      // For WebP, check the actual file to determine if it's animated
      animated = await this._checkWebPAnimated(path);
      if (animated) animationType = "webp";
    } else if (ext === "png") {
      // For PNG, check if it's actually an APNG
      animated = await this._checkAPNGAnimated(path);
      if (animated) animationType = "apng";
    }

    return {
      path: path,
      name: path.split("/").pop(),
      source: sourcePath,
      sourceType: sourceType,
      sourceLabel: sourceLabel,
      thumbnail: path,
      animated: animated,
      animationType: animationType, // "gif", "webp", "apng", or null
      size: "Unknown" // Placeholder - requires server-side API
    };
  }

  /**
   * Check if a WebP file is actually animated
   * Uses robust file header inspection rather than extension alone
   */
  async _checkWebPAnimated(path) {
    try {
      // isWebPAnimatedFromURL is provided by webp-anim-utils.js
      return await isWebPAnimatedFromURL(path);
    } catch (err) {
      console.warn(`Toast Studio | Error checking WebP animation for ${path}:`, err);
      // Default to false if we can't determine
      return false;
    }
  }

  /**
   * Check if a PNG file is actually an APNG (Animated PNG)
   * Uses robust file header inspection to detect acTL chunk
   */
  async _checkAPNGAnimated(path) {
    try {
      // isAPNGFromURL is provided by apng-anim-utils.js
      return await isAPNGFromURL(path);
    } catch (err) {
      console.warn(`Toast Studio | Error checking APNG for ${path}:`, err);
      // Default to false if we can't determine
      return false;
    }
  }

  /**
   * Check if image file is potentially animated (quick extension check)
   * @deprecated - Use _checkWebPAnimated for accurate WebP detection
   */
  _isAnimatedImage(path) {
    const ext = path.split(".").pop().toLowerCase();
    // Note: This is a quick heuristic check
    // For accurate WebP detection, use _checkWebPAnimated
    // GIF: Always animated capability
    // WebP: Can be animated (requires file inspection to know for sure)
    return ["gif", "webp"].includes(ext);
  }

  // ==========================================
  // Legacy Methods (kept for backwards compatibility)
  // ==========================================

  /**
   * List all audio files in the module
   */
  async _listAudioFiles() {
    const audioFiles = [];

    try {
      // Get files from module sounds directory
      const source = "data";
      const target = "modules/toast/sounds";

      // Use FilePicker to browse directory (v13 API)
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      const result = await FilePicker.browse(source, target);

      if (result.files) {
        for (const file of result.files) {
          // Only include audio files
          if (this._isAudioFile(file)) {
            audioFiles.push({
              path: file,
              name: file.split("/").pop(),
              category: this._getAudioCategory(file),
              size: await this._getFileSize(file)
            });
          }
        }
      }
    } catch (err) {
      console.warn("Toast Studio | Error listing audio files:", err);
    }

    return audioFiles;
  }

  /**
   * List all image files in the module
   */
  async _listImageFiles() {
    const imageFiles = [];

    try {
      // Get files from module images directory
      const source = "data";
      const target = "modules/toast/images";

      // Use FilePicker to browse directory (v13 API)
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      const result = await FilePicker.browse(source, target);

      if (result.files) {
        for (const file of result.files) {
          // Only include image files
          if (this._isImageFile(file)) {
            imageFiles.push({
              path: file,
              name: file.split("/").pop(),
              size: await this._getFileSize(file),
              thumbnail: file // Use the image itself as thumbnail
            });
          }
        }
      }
    } catch (err) {
      console.warn("Toast Studio | Error listing image files:", err);
    }

    return imageFiles;
  }

  /**
   * Check if file is an audio file
   */
  _isAudioFile(path) {
    const ext = path.split(".").pop().toLowerCase();
    return ["mp3", "wav", "ogg", "webm", "flac", "m4a"].includes(ext);
  }

  /**
   * Check if file is an image file
   */
  _isImageFile(path) {
    const ext = path.split(".").pop().toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  }

  /**
   * Get audio file category from path
   */
  _getAudioCategory(path) {
    if (path.includes("/announcers/")) {
      const parts = path.split("/announcers/");
      if (parts.length > 1) {
        const packName = parts[1].split("/")[0];
        return `Announcer: ${packName}`;
      }
    }
    return "Custom";
  }

  /**
   * Get file size (placeholder - actual size requires server-side API)
   */
  async _getFileSize(path) {
    // TODO: Implement server-side file size API
    return "Unknown";
  }

  /**
   * Validate that a directory exists and is accessible
   */
  async _validateDirectory(path) {
    try {
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
      // Try to browse the directory - if it fails, it doesn't exist or isn't accessible
      const result = await FilePicker.browse("data", path);
      return result && (result.files || result.dirs);
    } catch (err) {
      console.warn(`Toast Studio | Error validating directory ${path}:`, err);
      return false;
    }
  }

  // ==========================================
  // Directory Management CRUD Methods
  // ==========================================

  /**
   * Add a custom directory
   */
  async addCustomDirectory(dirPath, type, label) {
    const directories = this._getCustomDirectories();
    directories.push({
      id: foundry.utils.randomID(),
      path: dirPath,
      type: type,
      label: label || dirPath,
      addedAt: Date.now()
    });
    await game.settings.set("toast", "custom-asset-directories", directories);
    this.render();
  }

  /**
   * Remove a custom directory
   */
  async removeCustomDirectory(id) {
    const directories = this._getCustomDirectories();
    const filtered = directories.filter(d => d.id !== id);
    await game.settings.set("toast", "custom-asset-directories", filtered);
    this.render();
  }

  /**
   * Edit a custom directory
   */
  async editCustomDirectory(id, updates) {
    const directories = this._getCustomDirectories();
    const index = directories.findIndex(d => d.id === id);
    if (index >= 0) {
      directories[index] = { ...directories[index], ...updates };
      await game.settings.set("toast", "custom-asset-directories", directories);
      this.render();
    }
  }

  /**
   * Activate event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Tab switching
    html.find(".tabs .item").on("click", this._onTabChange.bind(this));

    // Sub-tab switching
    html.find(".assets-subtabs .subtab").on("click", this._onSubTabChange.bind(this));

    // Directory management buttons
    html.find(".add-directory-btn").on("click", this._onAddDirectory.bind(this));
    html.find(".edit-directory-btn").on("click", this._onEditDirectory.bind(this));
    html.find(".remove-directory-btn").on("click", this._onRemoveDirectory.bind(this));

    // Audio preview buttons
    html.find(".audio-preview-btn").on("click", this._onAudioPreview.bind(this));

    // Image item selection for preview pane
    html.find(".image-item").on("click", this._onImageSelect.bind(this));

    // Use in toast buttons
    html.find(".use-asset-btn").on("click", this._onUseAsset.bind(this));

    // Refresh buttons
    html.find(".refresh-assets-btn").on("click", this._onRefreshAssets.bind(this));

    // Search input
    html.find(".asset-search").on("input", this._onSearchAssets.bind(this));

    // Filter dropdowns
    html.find(".asset-filter").on("change", this._onFilterAssets.bind(this));

    // Package management buttons
    html.find(".new-package-btn").on("click", this._onNewPackage.bind(this));
    html.find(".import-package-btn").on("click", this._onImportPackage.bind(this));
    html.find(".refresh-packages-btn").on("click", this._onRefreshPackages.bind(this));

    // Package search and filters
    html.find(".package-search").on("input", this._onSearchPackages.bind(this));
    html.find(".package-filter-category").on("change", this._onFilterPackages.bind(this));
    html.find(".package-filter-scope").on("change", this._onFilterPackages.bind(this));

    // Package card actions
    html.find(".launch-package-btn").on("click", this._onLaunchPackage.bind(this));
    html.find(".edit-package-btn").on("click", this._onEditPackage.bind(this));
    html.find(".duplicate-package-btn").on("click", this._onDuplicatePackage.bind(this));
    html.find(".export-package-btn").on("click", this._onExportPackage.bind(this));
    html.find(".delete-package-btn").on("click", this._onDeletePackage.bind(this));
  }

  /**
   * Handle tab change
   */
  async _onTabChange(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.tab;

    // Don't switch to disabled tabs
    if (event.currentTarget.classList.contains("disabled")) {
      ui.notifications.info("This feature is coming in a future update!");
      return;
    }

    this.activeTab = tab;
    await this.render(true);
  }

  /**
   * Handle sub-tab change
   */
  async _onSubTabChange(event) {
    event.preventDefault();
    const subtab = event.currentTarget.dataset.subtab;
    this.activeAssetsSubTab = subtab;
    await this.render(true);
  }

  /**
   * Handle add directory button
   */
  async _onAddDirectory(event) {
    event.preventDefault();

    // Create dialog for directory configuration
    new Dialog({
      title: "Add Custom Directory",
      content: `
        <form>
          <div class="form-group">
            <label>Directory Path:</label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" name="path" id="directory-path" placeholder="Select a directory..." style="flex: 1;" />
              <button type="button" id="browse-directory" style="width: auto; padding: 0 1rem;">
                <i class="fas fa-folder-open"></i> Browse
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Directory Type:</label>
            <select name="type" id="directory-type">
              <option value="audio">Audio Only</option>
              <option value="images">Images Only</option>
              <option value="both">Audio & Images</option>
            </select>
          </div>
          <div class="form-group">
            <label>Display Label (optional):</label>
            <input type="text" name="label" id="directory-label" placeholder="e.g., My Campaign Assets" />
          </div>
        </form>
      `,
      buttons: {
        add: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Add Directory",
          callback: async (html) => {
            const path = html.find("#directory-path").val().trim();
            const type = html.find("#directory-type").val();
            const label = html.find("#directory-label").val().trim();

            if (!path) {
              ui.notifications.warn("Please select a directory path");
              return;
            }

            // Validate directory exists
            const isValid = await this._validateDirectory(path);
            if (!isValid) {
              ui.notifications.error("Directory does not exist or is not accessible");
              return;
            }

            await this.addCustomDirectory(path, type, label || path.split("/").pop());
            ui.notifications.info("Directory added successfully");
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "add",
      render: (html) => {
        // Add FilePicker button handler
        html.find("#browse-directory").on("click", async () => {
          const FilePicker = foundry.applications.apps.FilePicker.implementation;
          const current = html.find("#directory-path").val() || "";

          new FilePicker({
            type: "folder",
            current: current,
            callback: (path) => {
              html.find("#directory-path").val(path);
            }
          }).render(true);
        });
      }
    }).render(true);
  }

  /**
   * Handle edit directory button
   */
  async _onEditDirectory(event) {
    event.preventDefault();
    const id = event.currentTarget.dataset.directoryId;
    const directories = this._getCustomDirectories();
    const directory = directories.find(d => d.id === id);

    if (!directory) {
      ui.notifications.error("Directory not found");
      return;
    }

    // Create dialog for directory editing
    new Dialog({
      title: "Edit Directory",
      content: `
        <form>
          <div class="form-group">
            <label>Directory Path:</label>
            <input type="text" value="${directory.path}" disabled style="background: var(--color-bg-option);" />
            <p style="font-size: 0.85rem; color: var(--color-text-dark-secondary); margin-top: 0.25rem;">
              Path cannot be changed. Remove and re-add to change the directory.
            </p>
          </div>
          <div class="form-group">
            <label>Directory Type:</label>
            <select name="type" id="edit-directory-type">
              <option value="audio" ${directory.type === "audio" ? "selected" : ""}>Audio Only</option>
              <option value="images" ${directory.type === "images" ? "selected" : ""}>Images Only</option>
              <option value="both" ${directory.type === "both" ? "selected" : ""}>Audio & Images</option>
            </select>
          </div>
          <div class="form-group">
            <label>Display Label:</label>
            <input type="text" name="label" id="edit-directory-label" value="${directory.label || ''}" placeholder="e.g., My Campaign Assets" />
          </div>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Save Changes",
          callback: async (html) => {
            const type = html.find("#edit-directory-type").val();
            const label = html.find("#edit-directory-label").val().trim();

            await this.editCustomDirectory(id, {
              type: type,
              label: label || directory.path.split("/").pop()
            });
            ui.notifications.info("Directory updated successfully");
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "save"
    }).render(true);
  }

  /**
   * Handle remove directory button
   */
  async _onRemoveDirectory(event) {
    event.preventDefault();
    const id = event.currentTarget.dataset.directoryId;

    const confirmed = await Dialog.confirm({
      title: "Remove Directory",
      content: "<p>Remove this directory from asset scanning?</p>",
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (confirmed) {
      await this.removeCustomDirectory(id);
      ui.notifications.info("Directory removed");
    }
  }

  /**
   * Handle audio preview (play/stop toggle)
   */
  async _onAudioPreview(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const audioPath = button.dataset.path;
    const isPlaying = button.dataset.playing === "true";

    // If this audio is currently playing, stop it
    if (isPlaying && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this._updateAudioButton(button, false);
      return;
    }

    // Stop any other currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      // Reset the previous button
      if (this.currentAudioButton) {
        this._updateAudioButton(this.currentAudioButton, false);
      }
    }

    // Play the new audio
    try {
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.volume = game.settings.get("toast", "asset-preview-volume") || 0.5;

      // When audio ends naturally, reset button
      this.currentAudio.addEventListener("ended", () => {
        this._updateAudioButton(button, false);
        this.currentAudio = null;
        this.currentAudioButton = null;
      });

      await this.currentAudio.play();
      this.currentAudioButton = button;
      this._updateAudioButton(button, true);

      ui.notifications.info(`Playing: ${audioPath.split("/").pop()}`);
    } catch (err) {
      console.error("Toast Studio | Error playing audio:", err);
      ui.notifications.error("Failed to play audio file");
      this._updateAudioButton(button, false);
    }
  }

  /**
   * Update audio button visual state
   */
  _updateAudioButton(button, isPlaying) {
    const playIcon = button.querySelector(".play-icon");
    const stopIcon = button.querySelector(".stop-icon");
    const audioItem = button.closest(".audio-item");

    if (isPlaying) {
      button.dataset.playing = "true";
      button.title = "Stop audio";
      playIcon.style.display = "none";
      stopIcon.style.display = "inline-block";
      audioItem?.classList.add("playing");
    } else {
      button.dataset.playing = "false";
      button.title = "Play audio";
      playIcon.style.display = "inline-block";
      stopIcon.style.display = "none";
      audioItem?.classList.remove("playing");
    }
  }

  /**
   * Handle image selection for preview pane
   */
  async _onImageSelect(event) {
    // Don't intercept clicks on action buttons
    if ($(event.target).closest(".asset-actions, .use-asset-btn").length > 0) {
      return;
    }

    event.preventDefault();
    const imageItem = $(event.currentTarget);
    const imagePath = imageItem.find(".use-asset-btn").data("path");

    // Update selected state
    this.element.find(".image-item").removeClass("selected");
    imageItem.addClass("selected");

    // Update preview pane
    this._updateImagePreview(imagePath);
  }

  /**
   * Update the image preview pane
   */
  async _updateImagePreview(imagePath) {
    const previewPane = this.element.find(".image-preview-pane");
    const placeholder = previewPane.find(".preview-placeholder");
    const display = previewPane.find(".preview-display");
    const container = display.find(".preview-image-container");
    const previewImg = display.find("#image-preview-img");
    const filename = display.find(".preview-filename");
    const dimensions = display.find(".preview-dimensions");
    const size = display.find(".preview-size");
    const zoomDisplay = display.find(".preview-zoom");

    // Reset zoom and pan
    this.previewZoom = 1.0;
    this.previewPanX = 0;
    this.previewPanY = 0;

    // Show loading state
    placeholder.hide();
    display.show();
    previewImg.attr("src", imagePath);
    filename.text(imagePath.split("/").pop());
    dimensions.html('<i class="fas fa-spinner fa-spin"></i> Loading...');
    size.text("");
    zoomDisplay.text("Zoom: 100%");

    // Remove existing event listeners by cloning
    const newContainer = container.clone(false);
    container.replaceWith(newContainer);
    const finalContainer = display.find(".preview-image-container");
    const finalImg = finalContainer.find("#image-preview-img");

    // Load image to get dimensions and set up zoom/pan
    const img = new Image();
    img.onload = () => {
      dimensions.html(`<i class="fas fa-ruler-combined"></i> ${img.naturalWidth} × ${img.naturalHeight}px`);

      // Set initial image size and position
      this._updatePreviewTransform();

      // Set up mousewheel zoom
      finalContainer[0].addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.previewZoom = Math.max(0.1, Math.min(5.0, this.previewZoom + delta));
        this._updatePreviewTransform();
      }, { passive: false });

      // Set up right-click pan
      finalContainer[0].addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.isPanning = true;
        this.panStartX = e.clientX - this.previewPanX;
        this.panStartY = e.clientY - this.previewPanY;
        finalContainer.addClass('panning');
      });

      finalContainer[0].addEventListener('mousemove', (e) => {
        if (this.isPanning) {
          this.previewPanX = e.clientX - this.panStartX;
          this.previewPanY = e.clientY - this.panStartY;
          this._updatePreviewTransform();
        }
      });

      finalContainer[0].addEventListener('mouseup', (e) => {
        if (e.button === 2 || this.isPanning) {
          this.isPanning = false;
          finalContainer.removeClass('panning');
        }
      });

      finalContainer[0].addEventListener('mouseleave', () => {
        this.isPanning = false;
        finalContainer.removeClass('panning');
      });

      // Try to get file size if available
      fetch(imagePath, { method: 'HEAD' })
        .then(response => {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            const sizeKB = (parseInt(contentLength) / 1024).toFixed(1);
            size.html(`<i class="fas fa-file"></i> ${sizeKB} KB`);
          }
        })
        .catch(err => {
          console.warn("Could not fetch file size:", err);
        });
    };
    img.onerror = () => {
      dimensions.html('<i class="fas fa-exclamation-triangle"></i> Error loading image');
    };
    img.src = imagePath;
  }

  /**
   * Update the preview image transform (zoom and pan)
   */
  _updatePreviewTransform() {
    const display = this.element.find(".preview-display");
    const previewImg = display.find("#image-preview-img");
    const zoomDisplay = display.find(".preview-zoom");

    if (previewImg.length === 0) return;

    // Get actual image dimensions
    const img = previewImg[0];
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight) return;

    // Apply transform: scale from center, then translate for pan
    const transform = `translate(-50%, -50%) translate(${this.previewPanX}px, ${this.previewPanY}px) scale(${this.previewZoom})`;
    previewImg.css({
      'transform': transform,
      'width': `${naturalWidth}px`,
      'height': `${naturalHeight}px`
    });

    // Update zoom display
    zoomDisplay.text(`Zoom: ${Math.round(this.previewZoom * 100)}%`);
  }

  /**
   * Handle use asset in toast
   */
  async _onUseAsset(event) {
    event.preventDefault();
    const assetPath = event.currentTarget.dataset.path;
    const assetType = event.currentTarget.dataset.type;

    // Copy element code to clipboard
    let code = "";
    if (assetType === "audio") {
      code = `{
  type: "sound",
  src: "${assetPath}"
}`;
    } else if (assetType === "image") {
      code = `game.toast.image("${assetPath}", {
  width: "300px",
  height: "300px"
})`;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(code).then(() => {
      ui.notifications.info("Element code copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy to clipboard:", err);
      ui.notifications.warn("Failed to copy to clipboard");
    });
  }

  /**
   * Handle refresh assets
   */
  async _onRefreshAssets(event) {
    event.preventDefault();
    await this.render(true);
    ui.notifications.info("Assets refreshed");
  }

  /**
   * Handle search assets
   */
  _onSearchAssets(event) {
    const searchTerm = event.currentTarget.value.toLowerCase();
    const assetList = $(event.currentTarget).closest(".tab-panel").find(".asset-list");

    assetList.find(".asset-item").each((i, item) => {
      const $item = $(item);
      const name = $item.find(".asset-name").text().toLowerCase();

      if (name.includes(searchTerm)) {
        $item.show();
      } else {
        $item.hide();
      }
    });
  }

  /**
   * Handle filter assets
   */
  _onFilterAssets(event) {
    const filterValue = event.currentTarget.value.toLowerCase();
    const assetList = $(event.currentTarget).closest(".tab-panel").find(".asset-list");

    if (!filterValue || filterValue === "all") {
      assetList.find(".asset-item").show();
      return;
    }

    assetList.find(".asset-item").each((i, item) => {
      const $item = $(item);

      // Get source badge element to check sourceType
      const sourceBadge = $item.find(".source-badge");
      const sourceType = sourceBadge.length > 0
        ? sourceBadge.attr("class").match(/source-(\w+)/)?.[1] || ""
        : "";

      // Check if filtering by source type
      if (["default", "announcer", "custom"].includes(filterValue)) {
        if (sourceType === filterValue) {
          $item.show();
        } else {
          $item.hide();
        }
      } else {
        // Check if filtering by other criteria (animated/static)
        const category = $item.data("category")?.toString().toLowerCase() || "";
        const isAnimated = $item.find(".animated-indicator").length > 0;

        if (filterValue === "animated" && isAnimated) {
          $item.show();
        } else if (filterValue === "static" && !isAnimated) {
          $item.show();
        } else if (category.includes(filterValue)) {
          $item.show();
        } else {
          $item.hide();
        }
      }
    });
  }

  // ==========================================
  // Package Management Event Handlers
  // ==========================================

  /**
   * Handle refresh packages button
   */
  async _onRefreshPackages(event) {
    event.preventDefault();

    try {
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      await packageManager.refresh();
      await this.render(true);
      ui.notifications.info("Packages refreshed");
    } catch (err) {
      console.error("Toast Studio | Failed to refresh packages:", err);
      ui.notifications.error("Failed to refresh packages");
    }
  }

  /**
   * Handle package search input
   */
  async _onSearchPackages(event) {
    event.preventDefault();
    const searchTerm = event.currentTarget.value.toLowerCase();

    // Get all package cards
    const packageCards = this.element.find(".package-card");

    packageCards.each((i, card) => {
      const $card = $(card);
      const name = $card.find(".package-name").text().toLowerCase();
      const description = $card.find(".package-description").text().toLowerCase();
      const tags = $card.find(".package-tag").map((j, tag) => $(tag).text().toLowerCase()).get().join(" ");

      // Show/hide based on search
      if (name.includes(searchTerm) || description.includes(searchTerm) || tags.includes(searchTerm)) {
        $card.show();
      } else {
        $card.hide();
      }
    });

    // Update visible count
    const visibleCount = packageCards.filter(":visible").length;
    this.element.find(".packages-stats strong").first().text(visibleCount);
  }

  /**
   * Handle package filter change
   */
  async _onFilterPackages(event) {
    event.preventDefault();

    const categoryFilter = this.element.find(".package-filter-category").val();
    const scopeFilter = this.element.find(".package-filter-scope").val();

    // Get all package cards
    const packageCards = this.element.find(".package-card");

    packageCards.each((i, card) => {
      const $card = $(card);
      const category = $card.data("category");
      const scope = $card.data("scope");

      let show = true;

      // Apply category filter
      if (categoryFilter !== "all" && category !== categoryFilter) {
        show = false;
      }

      // Apply scope filter
      if (scopeFilter === "world" && scope !== "world") {
        show = false;
      } else if (scopeFilter === "global" && scope !== "global") {
        show = false;
      }

      // Show/hide card
      if (show) {
        $card.show();
      } else {
        $card.hide();
      }
    });

    // Update visible count
    const visibleCount = packageCards.filter(":visible").length;
    this.element.find(".packages-stats strong").first().text(visibleCount);
  }

  /**
   * Handle export package button
   */
  async _onExportPackage(event) {
    event.preventDefault();
    const packageId = event.currentTarget.dataset.packageId;

    try {
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      const pkg = packageManager.get(packageId);
      if (!pkg) {
        ui.notifications.error("Package not found");
        return;
      }

      // Export as JSON
      const json = packageManager.export(packageId);

      // Create download
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pkg.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      ui.notifications.info(`Package "${pkg.name}" exported`);
    } catch (err) {
      console.error("Toast Studio | Failed to export package:", err);
      ui.notifications.error("Failed to export package");
    }
  }

  /**
   * Handle duplicate package button
   */
  async _onDuplicatePackage(event) {
    event.preventDefault();
    const packageId = event.currentTarget.dataset.packageId;

    try {
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      const original = packageManager.get(packageId);
      if (!original) {
        ui.notifications.error("Package not found");
        return;
      }

      // Prompt for new name
      const newName = await new Promise((resolve) => {
        new Dialog({
          title: "Duplicate Package",
          content: `
            <form>
              <div class="form-group">
                <label>New Package Name:</label>
                <input type="text" name="name" value="${original.name} (Copy)" />
              </div>
            </form>
          `,
          buttons: {
            duplicate: {
              icon: '<i class="fas fa-copy"></i>',
              label: "Duplicate",
              callback: (html) => resolve(html.find("[name='name']").val())
            },
            cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: "Cancel",
              callback: () => resolve(null)
            }
          },
          default: "duplicate"
        }).render(true);
      });

      if (!newName) return;

      // Duplicate the package
      const duplicate = await packageManager.duplicate(packageId, newName);
      await this.render(true);
      ui.notifications.info(`Package duplicated as "${duplicate.name}"`);
    } catch (err) {
      console.error("Toast Studio | Failed to duplicate package:", err);
      ui.notifications.error("Failed to duplicate package");
    }
  }

  /**
   * Handle delete package button
   */
  async _onDeletePackage(event) {
    event.preventDefault();
    const packageId = event.currentTarget.dataset.packageId;

    try {
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      const pkg = packageManager.get(packageId);
      if (!pkg) {
        ui.notifications.error("Package not found");
        return;
      }

      // Confirm deletion
      const confirmed = await Dialog.confirm({
        title: "Delete Package",
        content: `<p>Are you sure you want to delete the package <strong>"${pkg.name}"</strong>?</p><p>This action cannot be undone.</p>`,
        yes: () => true,
        no: () => false
      });

      if (!confirmed) return;

      // Delete the package
      await packageManager.delete(packageId);
      await this.render(true);
      ui.notifications.info(`Package "${pkg.name}" deleted`);
    } catch (err) {
      console.error("Toast Studio | Failed to delete package:", err);
      ui.notifications.error("Failed to delete package");
    }
  }

  /**
   * Handle import package button
   */
  async _onImportPackage(event) {
    event.preventDefault();

    try {
      // Create file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const json = JSON.parse(text);

          const packageManager = ToastManager.packageManager;
          if (!packageManager) {
            ui.notifications.error("Package manager not initialized");
            return;
          }

          // Import the package
          const pkg = await packageManager.import(json);
          await this.render(true);
          ui.notifications.info(`Package "${pkg.name}" imported`);
        } catch (err) {
          console.error("Toast Studio | Failed to import package:", err);
          ui.notifications.error("Failed to import package: " + err.message);
        }
      };

      input.click();
    } catch (err) {
      console.error("Toast Studio | Failed to open import dialog:", err);
      ui.notifications.error("Failed to open import dialog");
    }
  }

  /**
   * Handle new package button
   */
  async _onNewPackage(event) {
    event.preventDefault();
    ui.notifications.warn("Package editor coming in next update! Use the API for now: game.toast.packages.create()");
    // TODO: Open PackageEditorDialog
  }

  /**
   * Handle edit package button
   */
  async _onEditPackage(event) {
    event.preventDefault();
    const packageId = event.currentTarget.dataset.packageId;
    ui.notifications.warn("Package editor coming in next update! Use the API for now: game.toast.packages.update()");
    // TODO: Open PackageEditorDialog with package data
  }

  /**
   * Handle launch package button
   */
  async _onLaunchPackage(event) {
    event.preventDefault();
    const packageId = event.currentTarget.dataset.packageId;

    try {
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      const pkg = packageManager.get(packageId);
      if (!pkg) {
        ui.notifications.error("Package not found");
        return;
      }

      // Use TokenMappingDialog for all launches
      // It handles both token and no-token packages
      await TokenMappingDialog.show(pkg, packageManager);
    } catch (err) {
      console.error("Toast Studio | Failed to launch package:", err);
      ui.notifications.error("Failed to launch package: " + err.message);
    }
  }

  /**
   * Handle form submission (not used, but required by FormApplication)
   */
  async _updateObject(event, formData) {
    // Not needed for this application
  }

  /**
   * Close handler - cleanup
   */
  async close(options) {
    // Stop any playing audio and reset button state
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.currentAudioButton) {
      this._updateAudioButton(this.currentAudioButton, false);
      this.currentAudioButton = null;
    }

    return super.close(options);
  }
}


/**
 * Toast Module - Full Screen Celebrations for Foundry VTT v13
 */

class ToastManager {
  static MODULE_ID = "toast";
  static SOCKET_REQUEST = "module.toast.request";
  static SOCKET_BROADCAST = "module.toast.broadcast";
  static SOCKET_TTS_REQUEST = "module.toast.tts-request";
  static SOCKET_TTS_BROADCAST = "module.toast.tts-broadcast";
  static registeredAnnouncers = {}; // Store for module-registered announcers
  static templates = {}; // Store for dynamic TTS templates
  static packageManager = null; // Package manager instance

  /**
   * Initialize the Toast module
   */
  static init() {
    console.log("Toast | Initializing module");
    this.registerSettings();
    this.registerHandlebarsHelpers();
  }

  /**
   * Register Handlebars helpers for templates
   */
  static registerHandlebarsHelpers() {
    // Equality helper for comparisons in templates
    Handlebars.registerHelper('eq', function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    console.log("Toast | Handlebars helpers registered");
  }

  /**
   * Setup module after Foundry is ready
   */
  static async ready() {
    console.log("Toast | Module ready");
    this.setupSocket();
    this.registerAPI();
    this.initializeBuiltInTemplates();
    await this.scanAnnouncerPacks();

    // Initialize TTS cache
    try {
      await TTSCacheManager.init();
      console.log("Toast | TTS cache initialized");
    } catch (err) {
      console.warn("Toast | Failed to initialize TTS cache:", err);
    }

    // Initialize Package Manager
    try {
      this.packageManager = new PackageManager();
      await this.packageManager.initialize();
      console.log("Toast | Package manager initialized");
    } catch (err) {
      console.warn("Toast | Failed to initialize package manager:", err);
    }

    // Preload template partials
    await this.preloadTemplatePartials();
  }

  /**
   * Preload Handlebars template partials
   * Required for partials to be available during rendering
   */
  static async preloadTemplatePartials() {
    const partials = [
      "modules/toast/templates/partials/assets-tab.hbs",
      "modules/toast/templates/partials/directories-subtab.hbs",
      "modules/toast/templates/partials/audio-subtab.hbs",
      "modules/toast/templates/partials/images-subtab.hbs",
      "modules/toast/templates/partials/directory-item.hbs",
      "modules/toast/templates/partials/audio-asset-item.hbs",
      "modules/toast/templates/partials/image-asset-item.hbs",
      "modules/toast/templates/partials/packages-tab.hbs",
      "modules/toast/templates/partials/package-card.hbs",
      "modules/toast/templates/partials/studio-tab.hbs",
      "modules/toast/templates/partials/empty-state.hbs"
    ];

    try {
      await loadTemplates(partials);
      console.log("Toast | Template partials preloaded");
    } catch (err) {
      console.warn("Toast | Failed to preload template partials:", err);
    }
  }

  /**
   * Register module settings
   */
  static registerSettings() {
    // Permission mode setting
    game.settings.register(this.MODULE_ID, "permissionMode", {
      name: "Permission Mode",
      hint: "Choose how to control who can trigger toast notifications.",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "gm-only": "GM Only",
        "role": "By Role",
        "username": "By Username"
      },
      default: "gm-only"
    });

    // Allowed roles setting
    game.settings.register(this.MODULE_ID, "allowedRoles", {
      name: "Allowed Roles",
      hint: "Select which roles can trigger toasts (when Permission Mode is 'By Role').",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "1": "Player",
        "2": "Trusted Player",
        "3": "Assistant GM",
        "4": "Game Master"
      },
      default: "4"
    });

    // Allowed usernames setting
    game.settings.register(this.MODULE_ID, "allowedUsernames", {
      name: "Allowed Usernames",
      hint: "Comma-separated list of usernames that can trigger toasts (when Permission Mode is 'By Username').",
      scope: "world",
      config: true,
      type: String,
      default: ""
    });

    // Announcer pack setting
    game.settings.register(this.MODULE_ID, "announcerPack", {
      name: "Announcer Pack",
      hint: "Select which announcer voice pack to use for sounds. Place announcer folders in modules/toast/sounds/announcers/",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "unreal-tournament": "Unreal Tournament"
      },
      default: "unreal-tournament"
    });

    // ElevenLabs API Key (client-side, user-specific)
    game.settings.register(this.MODULE_ID, "elevenlabs-api-key", {
      name: "ElevenLabs API Key",
      hint: "Your personal ElevenLabs API key for dynamic TTS generation. Get one at https://elevenlabs.io",
      scope: "client",
      config: true,
      type: String,
      default: ""
    });

    // ElevenLabs Voice ID (client-side, user-specific)
    game.settings.register(this.MODULE_ID, "elevenlabs-voice-id", {
      name: "ElevenLabs Voice ID",
      hint: "The voice ID to use for TTS generation (e.g., '21m00Tcm4TlvDq8ikWAM'). Find voices at https://elevenlabs.io/voice-library",
      scope: "client",
      config: true,
      type: String,
      default: "21m00Tcm4TlvDq8ikWAM" // Default: Rachel
    });

    // TTS Cache Enabled
    game.settings.register(this.MODULE_ID, "tts-cache-enabled", {
      name: "Enable TTS Cache",
      hint: "Cache generated audio to avoid repeated API calls. Recommended to keep enabled.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true
    });

    // TTS Cache Size
    game.settings.register(this.MODULE_ID, "tts-cache-size-mb", {
      name: "TTS Cache Size (MB)",
      hint: "Maximum cache size in megabytes. Older entries are removed when limit is reached.",
      scope: "client",
      config: true,
      type: Number,
      default: 100
    });

    // ===== AI GENERATION SETTINGS (World - GM Only) =====

    // Enable AI Text Generation
    game.settings.register(this.MODULE_ID, "ai-generation-enabled", {
      name: "Enable AI Text Generation",
      hint: "Enable dynamic text generation using AI before TTS. Requires API keys.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });

    // AI Provider
    game.settings.register(this.MODULE_ID, "ai-provider", {
      name: "AI Provider",
      hint: "Select which AI provider to use for text generation.",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "claude": "Claude (Anthropic)",
        "openai": "OpenAI"
      },
      default: "claude"
    });

    // Claude API Key (World)
    game.settings.register(this.MODULE_ID, "ai-claude-api-key-world", {
      name: "Claude API Key (GM)",
      hint: "⚠️ SECURITY WARNING: API keys stored in Foundry are vulnerable to theft by malicious modules. Only install trusted modules. Use a separate API key for Foundry with spending limits. Monitor usage regularly.",
      scope: "world",
      config: true,
      type: String,
      default: ""
    });

    // OpenAI API Key (World)
    game.settings.register(this.MODULE_ID, "ai-openai-api-key-world", {
      name: "OpenAI API Key (GM)",
      hint: "⚠️ SECURITY WARNING: API keys stored in Foundry are vulnerable to theft by malicious modules. Only install trusted modules. Use a separate API key for Foundry with spending limits. Monitor usage regularly.",
      scope: "world",
      config: true,
      type: String,
      default: ""
    });

    // Share AI Keys With
    game.settings.register(this.MODULE_ID, "ai-share-keys-mode", {
      name: "Share AI Keys With",
      hint: "Choose who can use GM's AI API keys for generation.",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "none": "None (GM Only)",
        "all": "All Players",
        "role": "By Role",
        "username": "By Username"
      },
      default: "none",
    });

    // Allowed Roles for AI Keys
    game.settings.register(this.MODULE_ID, "ai-allowed-roles", {
      name: "AI Keys - Allowed Roles",
      hint: "Select which roles can use GM's AI keys (when Share Mode is 'By Role').",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "1": "Player",
        "2": "Trusted Player",
        "3": "Assistant GM",
        "4": "Game Master"
      },
      default: "4",
    });

    // Allowed Usernames for AI Keys
    game.settings.register(this.MODULE_ID, "ai-allowed-usernames", {
      name: "AI Keys - Allowed Usernames",
      hint: "Comma-separated list of usernames that can use GM's AI keys (when Share Mode is 'By Username').",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });

    // AI Model Selection
    game.settings.register(this.MODULE_ID, "ai-model", {
      name: "AI Model",
      hint: "Select which AI model to use for text generation.",
      scope: "world",
      config: true,
      type: String,
      choices: {
        // Claude models
        "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
        "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
        "claude-3-opus-20240229": "Claude 3 Opus",
        // OpenAI models
        "gpt-4o": "GPT-4o",
        "gpt-4-turbo": "GPT-4 Turbo",
        "gpt-4": "GPT-4",
        "gpt-3.5-turbo": "GPT-3.5 Turbo"
      },
      default: "claude-3-5-sonnet-20241022",
    });

    // OpenAI Mode
    game.settings.register(this.MODULE_ID, "ai-openai-mode", {
      name: "OpenAI Mode",
      hint: "Select OpenAI mode (only applies when AI Provider is OpenAI).",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "standard": "Standard",
        "custom-gpt": "Custom GPT",
        "fine-tuned": "Fine-tuned Model"
      },
      default: "standard",
    });

    // OpenAI Assistant/Model ID
    game.settings.register(this.MODULE_ID, "ai-openai-custom-id", {
      name: "OpenAI Custom ID",
      hint: "Assistant ID (for Custom GPT) or Model ID (for Fine-tuned). Example: 'asst_...' or 'ft:gpt-3.5-turbo:...'",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });

    // Max Tokens
    game.settings.register(this.MODULE_ID, "ai-max-tokens", {
      name: "Max Tokens",
      hint: "Maximum tokens to generate. 1-2 sentences typically needs 50-150 tokens.",
      scope: "world",
      config: true,
      type: Number,
      default: 150,
    });

    // Temperature
    game.settings.register(this.MODULE_ID, "ai-temperature", {
      name: "Temperature",
      hint: "Creativity level (0-2). Higher = more creative/varied, Lower = more consistent. Default: 0.7",
      scope: "world",
      config: true,
      type: Number,
      default: 0.7,
    });

    // ===== AI GENERATION SETTINGS (Client - User Override) =====

    // Use Own API Keys
    game.settings.register(this.MODULE_ID, "ai-use-own-keys", {
      name: "Use Own AI API Keys",
      hint: "Enable to use your own AI API keys instead of GM's shared keys.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
    });

    // AI Provider (Client)
    game.settings.register(this.MODULE_ID, "ai-provider-client", {
      name: "AI Provider (Your Keys)",
      hint: "Select which AI provider to use with your own API keys.",
      scope: "client",
      config: true,
      type: String,
      choices: {
        "claude": "Claude (Anthropic)",
        "openai": "OpenAI"
      },
      default: "claude",
    });

    // Claude API Key (Client)
    game.settings.register(this.MODULE_ID, "ai-claude-api-key-client", {
      name: "Claude API Key (Your Key)",
      hint: "⚠️ SECURITY WARNING: API keys stored in Foundry are vulnerable to theft by malicious modules. Only install trusted modules. Use a separate API key for Foundry with spending limits. Monitor usage regularly.",
      scope: "client",
      config: true,
      type: String,
      default: "",
    });

    // OpenAI API Key (Client)
    game.settings.register(this.MODULE_ID, "ai-openai-api-key-client", {
      name: "OpenAI API Key (Your Key)",
      hint: "⚠️ SECURITY WARNING: API keys stored in Foundry are vulnerable to theft by malicious modules. Only install trusted modules. Use a separate API key for Foundry with spending limits. Monitor usage regularly.",
      scope: "client",
      config: true,
      type: String,
      default: "",
    });

    // OpenAI Mode (Client)
    game.settings.register(this.MODULE_ID, "ai-openai-mode-client", {
      name: "OpenAI Mode (Your Key)",
      hint: "Select OpenAI mode for your own API key.",
      scope: "client",
      config: true,
      type: String,
      choices: {
        "standard": "Standard",
        "custom-gpt": "Custom GPT",
        "fine-tuned": "Fine-tuned Model"
      },
      default: "standard",
    });

    // OpenAI Custom ID (Client)
    game.settings.register(this.MODULE_ID, "ai-openai-custom-id-client", {
      name: "OpenAI Custom ID (Your Key)",
      hint: "Assistant ID (for Custom GPT) or Model ID (for Fine-tuned). Example: 'asst_...' or 'ft:gpt-3.5-turbo:...'",
      scope: "client",
      config: true,
      type: String,
      default: "",
    });

    // ===== TOAST STUDIO SETTINGS =====

    // Studio Default Tab
    game.settings.register(this.MODULE_ID, "studio-default-tab", {
      name: "Studio Default Tab",
      hint: "Which tab to show when opening Toast Studio.",
      scope: "client",
      config: true,
      type: String,
      choices: {
        "assets": "Assets",
        "packages": "Packages",
        "studio": "Studio"
      },
      default: "assets"
    });

    // Assets Default Sub-Tab
    game.settings.register(this.MODULE_ID, "assets-default-subtab", {
      name: "Assets Default Sub-Tab",
      hint: "Which sub-tab to show when opening the Assets tab.",
      scope: "client",
      config: true,
      type: String,
      choices: {
        "directories": "Directories",
        "audio": "Audio",
        "images": "Images"
      },
      default: "audio"
    });

    // Custom Asset Directories
    game.settings.register(this.MODULE_ID, "custom-asset-directories", {
      name: "Custom Asset Directories",
      hint: "User-added directories for custom audio and image assets.",
      scope: "client",
      config: false, // Hidden - managed via Toast Studio
      type: Array,
      default: []
    });

    // Package Directories (World)
    game.settings.register(this.MODULE_ID, "packages-directory-world", {
      name: "World Packages Directory",
      hint: "Directory for world-specific packages.",
      scope: "world",
      config: false, // Hidden - managed internally
      type: String,
      default: "toast-packages"
    });

    // Package Directories (Global)
    game.settings.register(this.MODULE_ID, "packages-directory-global", {
      name: "Global Packages Directory",
      hint: "Directory for global packages.",
      scope: "world",
      config: false, // Hidden - managed internally
      type: String,
      default: "modules/toast/packages"
    });

    // Default Package Category
    game.settings.register(this.MODULE_ID, "packages-default-category", {
      name: "Default Package Category",
      hint: "Default category when creating new packages.",
      scope: "client",
      config: true,
      type: String,
      choices: {
        "combat": "Combat",
        "social": "Social",
        "exploration": "Exploration",
        "custom": "Custom"
      },
      default: "custom"
    });

    // Default Package Scope
    game.settings.register(this.MODULE_ID, "packages-default-scope", {
      name: "Default Package Scope",
      hint: "Default scope when creating new packages.",
      scope: "client",
      config: true,
      type: String,
      choices: {
        "global": "Global (all worlds)",
        "world": "World-specific"
      },
      default: "world"
    });

    // Asset Preview Volume
    game.settings.register(this.MODULE_ID, "asset-preview-volume", {
      name: "Asset Preview Volume",
      hint: "Default volume for audio preview in Toast Studio (0.0 to 1.0).",
      scope: "client",
      config: true,
      type: Number,
      range: {
        min: 0,
        max: 1,
        step: 0.1
      },
      default: 0.5
    });
  }

  /**
   * Register an announcer pack from another module
   * @param {string} id - Unique identifier for the announcer (e.g., "my-custom-pack")
   * @param {Object} config - Announcer configuration
   * @param {string} config.name - Display name for the announcer
   * @param {string} config.path - Base path to sound files (e.g., "modules/my-module/sounds/announcer")
   * @returns {boolean} True if registered successfully, false otherwise
   */
  static registerAnnouncer(id, config) {
    try {
      if (!id || typeof id !== "string") {
        console.error("Toast | registerAnnouncer: Invalid announcer ID");
        return false;
      }

      if (!config || !config.name || !config.path) {
        console.error("Toast | registerAnnouncer: Config must include 'name' and 'path'");
        return false;
      }

      if (this.registeredAnnouncers[id]) {
        console.warn(`Toast | Announcer "${id}" is already registered, overwriting`);
      }

      this.registeredAnnouncers[id] = {
        name: config.name,
        path: config.path
      };

      console.log(`Toast | Registered announcer pack: ${id} (${config.name}) at ${config.path}`);

      // Refresh announcer choices if settings are already initialized
      if (game.settings && game.settings.settings) {
        this.updateAnnouncerChoices();
      }

      return true;
    } catch (err) {
      console.error("Toast | Failed to register announcer:", err);
      return false;
    }
  }

  /**
   * Update the announcer pack setting choices with all available announcers
   */
  static updateAnnouncerChoices() {
    try {
      const setting = game.settings.settings.get("toast.announcerPack");
      if (!setting) return;

      // Merge registered announcers with existing choices
      const allChoices = { ...setting.choices, ...this.getRegisteredAnnouncerChoices() };
      setting.choices = allChoices;

      console.log("Toast | Updated announcer choices:", allChoices);
    } catch (err) {
      console.warn("Toast | Failed to update announcer choices:", err);
    }
  }

  /**
   * Get registered announcers as choices object
   * @returns {Object} Choices object with {id: name} format
   */
  static getRegisteredAnnouncerChoices() {
    const choices = {};
    for (const [id, config] of Object.entries(this.registeredAnnouncers)) {
      choices[id] = config.name;
    }
    return choices;
  }

  /**
   * Scan for available announcer packs in sounds/announcers/ folder
   * Updates the announcer pack setting with available choices (merged with registered announcers)
   */
  static async scanAnnouncerPacks() {
    try {
      const announcersPath = "modules/toast/sounds/announcers";

      // Start with registered announcers
      const allAnnouncerPacks = { ...this.getRegisteredAnnouncerChoices() };

      // Use FilePicker to browse the announcers directory
      const browse = await FilePicker.browse("data", announcersPath);

      if (browse && browse.dirs && browse.dirs.length > 0) {
        // Extract folder names from full paths
        browse.dirs.forEach(dirPath => {
          const folderName = dirPath.split('/').pop();
          // Don't include folders that start with . or _
          if (!folderName.startsWith('.') && !folderName.startsWith('_')) {
            // Convert folder name to display name (e.g., "unreal-tournament" -> "Unreal Tournament")
            const displayName = folderName
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            allAnnouncerPacks[folderName] = displayName;
          }
        });

        console.log("Toast | Found file-based announcer packs in", announcersPath);
      } else {
        console.log("Toast | No file-based announcer packs found in", announcersPath);
      }

      // Update the setting with merged choices (registered + file-based)
      if (Object.keys(allAnnouncerPacks).length > 0) {
        console.log("Toast | All available announcer packs:", allAnnouncerPacks);
        game.settings.settings.get("toast.announcerPack").choices = allAnnouncerPacks;
      } else {
        console.warn("Toast | No announcer packs available");
      }
    } catch (err) {
      console.warn("Toast | Failed to scan announcer packs:", err);
    }
  }

  /**
   * Get the path to a sound file from the active announcer pack
   * Checks both registered announcers (from other modules) and file-based announcers
   * @param {string} filename - The sound filename (e.g., "double-kill.wav")
   * @returns {string|null} Full path to the sound file, or null if invalid
   */
  static getAnnouncerSound(filename) {
    try {
      if (!filename || typeof filename !== "string") {
        console.warn("Toast | getAnnouncerSound: Invalid filename provided");
        return null;
      }

      const announcerPack = game.settings.get(this.MODULE_ID, "announcerPack");
      if (!announcerPack) {
        console.warn("Toast | getAnnouncerSound: No announcer pack configured");
        return null;
      }

      // Check if this is a registered announcer from another module
      if (this.registeredAnnouncers[announcerPack]) {
        const registeredPath = this.registeredAnnouncers[announcerPack].path;
        return `${registeredPath}/${filename}`;
      }

      // Default to file-based announcer in Toast's directory
      return `modules/toast/sounds/announcers/${announcerPack}/${filename}`;
    } catch (err) {
      console.warn("Toast | getAnnouncerSound failed:", err);
      return null;
    }
  }

  /**
   * Setup socket for broadcasting toasts
   * Uses a request/broadcast pattern where GM validates permissions
   */
  static setupSocket() {
    // All clients listen for validated broadcasts
    game.socket.on(this.SOCKET_BROADCAST, (data) => {
      console.log("Toast | Received broadcast:", data);
      this.renderToast(data.elements);
    });

    // Only GM handles incoming requests and validates them
    game.socket.on(this.SOCKET_REQUEST, (data) => {
      if (!game.user.isGM) return;

      console.log("Toast | GM received request from:", data.userId);

      // Validate permission
      const requestingUser = game.users.get(data.userId);
      if (!requestingUser) {
        console.warn("Toast | Unknown user requested toast:", data.userId);
        return;
      }

      if (!this.checkUserPermission(requestingUser)) {
        console.warn("Toast | User lacks permission:", requestingUser.name);
        ui.notifications.warn(`${requestingUser.name} tried to trigger a toast but lacks permission.`);
        return;
      }

      // Permission granted - broadcast to all clients
      console.log("Toast | Broadcasting validated toast");
      game.socket.emit(this.SOCKET_BROADCAST, {
        elements: data.elements
      });

      // Also render locally on GM's client
      this.renderToast(data.elements);
    });

    // TTS: All clients listen for TTS broadcasts
    game.socket.on(this.SOCKET_TTS_BROADCAST, (data) => {
      console.log("Toast | Received TTS broadcast");
      this.renderToastWithTTS(data.elements, data.ttsAudio);
    });

    // TTS: Only GM handles TTS requests and validates them
    game.socket.on(this.SOCKET_TTS_REQUEST, (data) => {
      if (!game.user.isGM) return;

      console.log("Toast | GM received TTS request from:", data.userId);

      // Validate permission
      const requestingUser = game.users.get(data.userId);
      if (!requestingUser) {
        console.warn("Toast | Unknown user requested TTS toast:", data.userId);
        return;
      }

      if (!this.checkUserPermission(requestingUser)) {
        console.warn("Toast | User lacks permission:", requestingUser.name);
        ui.notifications.warn(`${requestingUser.name} tried to trigger a TTS toast but lacks permission.`);
        return;
      }

      // Permission granted - broadcast to all clients
      console.log("Toast | Broadcasting validated TTS toast");
      game.socket.emit(this.SOCKET_TTS_BROADCAST, {
        elements: data.elements,
        ttsAudio: data.ttsAudio
      });

      // Also render locally on GM's client
      this.renderToastWithTTS(data.elements, data.ttsAudio);
    });
  }

  /**
   * Register the global API for macros
   */
  static registerAPI() {
    game.toast = {
      // Main API methods
      show: (elements) => this.showToast(elements),
      showLocal: (elements) => this.renderToast(elements),
      showDynamic: (templateId, tokens, elements) => this.showDynamic(templateId, tokens, elements),
      showDynamicAI: (config) => this.showDynamicAI(config),

      // Helper functions for creating common elements
      simpleText: (text, options = {}) => ({
        type: "text",
        text: text,
        ...options
      }),
      sound: (soundName) => ({
        type: "sound",
        src: soundName
      }),
      image: (src, options = {}) => ({
        type: "image",
        src: src,
        ...options
      }),
      tokenImage: (tokenId, options = {}) => ({
        type: "tokenImage",
        tokenId: tokenId,
        ...options
      }),
      actorImage: (actorId, options = {}) => ({
        type: "actorImage",
        actorId: actorId,
        ...options
      }),

      // Utility methods
      hasPermission: () => this.hasPermission(),
      resolveElement: (element) => this.resolveElement(element),
      randomSound: (sources, options = {}) => this.createRandomSoundElement(sources, options),
      weightedRandomSound: (soundsWithWeights, options = {}) => this.createWeightedRandomSoundElement(soundsWithWeights, options),
      getAnnouncerSound: (filename) => this.getAnnouncerSound(filename),
      registerAnnouncer: (id, config) => this.registerAnnouncer(id, config),
      // Template methods
      templates: {
        register: (id, config) => this.registerTemplate(id, config),
        get: (id) => this.getTemplate(id),
        list: (tag = null) => this.listTemplates(tag),
        delete: (id) => this.deleteTemplate(id),
        render: (id, tokens) => this.renderTemplate(id, tokens)
      },
      // TTS Cache management
      cache: {
        clear: () => TTSCacheManager.clear(),
        getSize: () => TTSCacheManager.getSize(),
        getCount: () => TTSCacheManager.count()
      },
      // Toast Studio
      studio: {
        open: (options = {}) => this.openStudio(options),
        close: () => this.closeStudio()
      },
      // Package Manager
      packages: {
        create: (config) => this.packageManager?.create(config),
        get: (id) => this.packageManager?.get(id),
        list: (filters) => this.packageManager?.list(filters),
        update: (id, updates) => this.packageManager?.update(id, updates),
        delete: (id) => this.packageManager?.delete(id),
        launch: (id, tokenMap, options) => this.packageManager?.launch(id, tokenMap, options),
        export: (id) => this.packageManager?.export(id),
        import: (json, options) => this.packageManager?.import(json, options),
        duplicate: (id, newName) => this.packageManager?.duplicate(id, newName),
        refresh: () => this.packageManager?.refresh(),
        getCategories: () => this.packageManager?.getCategories(),
        getTags: () => this.packageManager?.getTags(),
        getAuthors: () => this.packageManager?.getAuthors(),
        getStats: () => this.packageManager?.getStats()
      }
    };
    console.log("Toast | API registered at game.toast");
  }

  /**
   * Create a sound element with a randomly selected source
   * This ensures all players hear the same sound (selection happens before broadcast)
   * @param {Array<string>} sources - Array of sound file paths (nulls will be filtered out)
   * @param {Object} options - Sound options (volume, delay, loop)
   * @returns {Object|null} Sound element with randomly selected source, or null if no valid sources
   */
  static createRandomSoundElement(sources, options = {}) {
    if (!Array.isArray(sources)) {
      console.warn("Toast | randomSound requires an array of sound sources");
      return null;
    }

    // Filter out nulls and invalid values
    const validSources = sources.filter(src => src !== null && src !== undefined && src !== "");

    if (validSources.length === 0) {
      console.warn("Toast | randomSound: No valid sound sources provided");
      return null;
    }

    // Pick a random source
    const selectedSource = validSources[Math.floor(Math.random() * validSources.length)];
    console.log(`Toast | Selected random sound: ${selectedSource} (from ${validSources.length} valid options)`);

    // Return a sound element with the selected source
    return {
      type: "sound",
      src: selectedSource,
      volume: options.volume !== undefined ? options.volume : 0.8,
      delay: options.delay || 0,
      loop: options.loop || false
    };
  }

  /**
   * Create a sound element with weighted random selection
   * Higher weight = more likely to be selected
   * @param {Array<Object>} soundsWithWeights - Array of {src, weight} objects (nulls/invalid will be filtered)
   * @param {Object} options - Sound options (volume, delay, loop)
   * @returns {Object|null} Sound element with weighted random selected source, or null if no valid sources
   */
  static createWeightedRandomSoundElement(soundsWithWeights, options = {}) {
    if (!Array.isArray(soundsWithWeights)) {
      console.warn("Toast | weightedRandomSound requires an array of sound objects");
      return null;
    }

    // Filter out nulls, invalid sources, and invalid weights
    const validSounds = soundsWithWeights.filter(sound =>
      sound &&
      sound.src !== null &&
      sound.src !== undefined &&
      sound.src !== "" &&
      typeof sound.weight === "number" &&
      sound.weight > 0
    );

    if (validSounds.length === 0) {
      console.warn("Toast | weightedRandomSound: No valid sound sources provided");
      return null;
    }

    // Calculate total weight
    const totalWeight = validSounds.reduce((sum, sound) => sum + sound.weight, 0);

    // Pick a random value between 0 and totalWeight
    let random = Math.random() * totalWeight;

    // Select sound based on weight
    let selectedSource = validSounds[0].src; // Fallback
    for (const sound of validSounds) {
      if (random < sound.weight) {
        selectedSource = sound.src;
        break;
      }
      random -= sound.weight;
    }

    console.log(`Toast | Selected weighted random sound: ${selectedSource} (from ${validSounds.length} valid options)`);

    // Return a sound element with the selected source
    return {
      type: "sound",
      src: selectedSource,
      volume: options.volume !== undefined ? options.volume : 0.8,
      delay: options.delay || 0,
      loop: options.loop || false
    };
  }

  /**
   * Check if a specific user has permission to trigger toasts
   * @param {User} user - The user to check
   * @returns {Boolean}
   */
  static checkUserPermission(user) {
    // GM always has permission
    if (user.isGM) return true;

    const mode = game.settings.get(this.MODULE_ID, "permissionMode");

    if (mode === "gm-only") {
      return false;
    }

    if (mode === "role") {
      const allowedRole = parseInt(game.settings.get(this.MODULE_ID, "allowedRoles"));
      return user.role >= allowedRole;
    }

    if (mode === "username") {
      const allowedUsernames = game.settings.get(this.MODULE_ID, "allowedUsernames")
        .split(",")
        .map(u => u.trim())
        .filter(u => u.length > 0);
      return allowedUsernames.includes(user.name);
    }

    return false;
  }

  /**
   * Check if current user has permission to trigger toasts
   */
  static hasPermission() {
    return this.checkUserPermission(game.user);
  }

  /**
   * Resolve an element configuration to its actual content/source
   * Useful for previewing what will be displayed
   * @param {Object} element - Element configuration
   * @returns {Object} Resolved element info with type and src/content
   */
  static resolveElement(element) {
    const result = {
      type: element.type,
      valid: false,
      content: null,
      error: null
    };

    try {
      switch (element.type) {
        case "image":
        case "imageUrl":
          result.content = element.src;
          result.valid = !!element.src;
          if (!result.valid) result.error = "No image source provided";
          break;

        case "tokenImage":
          const token = canvas.tokens?.get(element.tokenId);
          if (token) {
            result.content = token.document.texture.src;
            result.valid = true;
          } else {
            result.error = `Token not found: ${element.tokenId}`;
          }
          break;

        case "actorImage":
          const actor = game.actors.get(element.actorId);
          if (actor) {
            result.content = actor.img;
            result.valid = true;
          } else {
            result.error = `Actor not found: ${element.actorId}`;
          }
          break;

        case "text":
          result.content = element.text;
          result.valid = !!element.text;
          if (!result.valid) result.error = "No text provided";
          break;

        case "shape":
          result.content = {
            backgroundColor: element.color || element.backgroundColor,
            width: element.width,
            height: element.height
          };
          result.valid = true;
          break;

        case "sound":
          result.content = element.src;
          result.valid = !!element.src;
          if (!result.valid) result.error = "No sound source provided";
          break;

        default:
          result.error = `Unknown element type: ${element.type}`;
      }
    } catch (err) {
      result.error = err.message;
    }

    return result;
  }

  /**
   * Play a sound effect
   * Fails gracefully if source is invalid or missing
   * @param {Object} element - Sound element configuration
   */
  static playSound(element) {
    // Validate element and source
    if (!element || !element.src || element.src === null || element.src === "") {
      console.warn("Toast | Sound element missing or invalid src, skipping playback");
      return;
    }

    const delay = (element.delay || 0) * 1000;
    const volume = element.volume !== undefined ? element.volume : 0.8;
    const loop = element.loop || false;

    const playSoundNow = () => {
      try {
        // Use Foundry's AudioHelper if available
        if (typeof AudioHelper !== "undefined" && AudioHelper.play) {
          AudioHelper.play({
            src: element.src,
            volume: volume,
            loop: loop
          }, true).catch(err => {
            // Fail gracefully - log warning but don't throw
            console.warn(`Toast | Failed to play sound "${element.src}":`, err.message);
          });
        } else {
          // Fallback to native Audio API
          const audio = new Audio(element.src);
          audio.volume = volume;
          audio.loop = loop;
          audio.play().catch(err => {
            // Fail gracefully - log warning but don't throw
            console.warn(`Toast | Failed to play sound "${element.src}":`, err.message);
          });
        }

        console.log("Toast | Playing sound:", element.src);
      } catch (err) {
        // Fail gracefully - log warning but don't throw
        console.warn(`Toast | Error playing sound "${element.src}":`, err.message);
      }
    };

    if (delay > 0) {
      setTimeout(playSoundNow, delay);
    } else {
      playSoundNow();
    }
  }

  /**
   * Show a toast notification to all connected players
   * Sends a request to GM for validation, then GM broadcasts to all
   * @param {Array} elements - Array of element configurations
   */
  static showToast(elements) {
    if (!this.hasPermission()) {
      ui.notifications.warn("You do not have permission to trigger toast notifications.");
      return;
    }

    console.log("Toast | Requesting toast with elements:", elements);

    // If we're the GM, validate and broadcast immediately
    if (game.user.isGM) {
      game.socket.emit(this.SOCKET_BROADCAST, {
        elements: elements
      });
      this.renderToast(elements);
    } else {
      // Send request to GM for validation
      game.socket.emit(this.SOCKET_REQUEST, {
        userId: game.user.id,
        elements: elements
      });
    }
  }

  /**
   * Render the toast overlay with elements
   * @param {Array} elements - Array of element configurations
   */
  static renderToast(elements) {
    // Remove any existing overlay to prevent stacking
    const existingOverlay = document.getElementById("toast-overlay");
    if (existingOverlay) {
      console.log("Toast | Removing existing overlay");
      existingOverlay.remove();
    }

    // Create overlay container
    const overlay = document.createElement("div");
    overlay.id = "toast-overlay";
    overlay.className = "toast-overlay";

    // Process visual elements
    elements.forEach((element, index) => {
      // Handle sound elements separately
      if (element.type === "sound") {
        this.playSound(element);
        return;
      }

      const el = this.createElementNode(element, index);
      if (el) {
        overlay.appendChild(el);
      }
    });

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.className = "toast-close-button";
    closeButton.textContent = "Close";
    closeButton.setAttribute("title", "Dismiss this toast");
    overlay.appendChild(closeButton);

    // Add to document
    document.body.appendChild(overlay);

    // Helper function to dismiss toast
    const dismissToast = () => {
      if (autoRemoveTimeout) {
        clearTimeout(autoRemoveTimeout);
      }
      if (fadeOutTimeout) {
        clearTimeout(fadeOutTimeout);
      }
      overlay.classList.add("toast-fade-out");
      setTimeout(() => overlay.remove(), 500);
    };

    // Close button event listener
    closeButton.addEventListener("click", dismissToast);

    // Start animations for visual elements
    requestAnimationFrame(() => {
      elements.forEach((element, index) => {
        if (element.type !== "sound") {
          this.animateElement(element, index);
        }
      });
    });

    // Auto-remove after animation completes (including delays)
    const maxDuration = Math.max(...elements.map(e => {
      if (e.type === "sound") {
        // For sounds, only count the delay (not the sound duration)
        return (e.delay || 0) * 1000;
      }
      const duration = (e.animation?.duration || 2) * 1000;
      const delay = (e.animation?.delay || 0) * 1000;
      return duration + delay;
    })) + 1000;

    let autoRemoveTimeout, fadeOutTimeout;
    autoRemoveTimeout = setTimeout(() => {
      overlay.classList.add("toast-fade-out");
      fadeOutTimeout = setTimeout(() => overlay.remove(), 500);
    }, maxDuration);
  }

  /**
   * Show a dynamic TTS toast notification with template rendering
   * Generates TTS audio, caches it, and broadcasts to all players
   * @param {string} templateId - ID of the registered template
   * @param {Object} tokens - Token values to replace in the template (e.g., {killer: "Bob", boss: "Dragon"})
   * @param {Array} elements - Additional visual elements to display (optional)
   */
  static async showDynamic(templateId, tokens = {}, elements = []) {
    if (!this.hasPermission()) {
      ui.notifications.warn("You do not have permission to trigger toast notifications.");
      return;
    }

    console.log(`Toast | showDynamic called with template: ${templateId}`, tokens);

    // Render the template
    const renderedText = this.renderTemplate(templateId, tokens);
    if (!renderedText) {
      ui.notifications.error(`Failed to render template: ${templateId}`);
      return;
    }

    console.log(`Toast | Rendered text: "${renderedText}"`);

    // Get user's TTS settings
    const apiKey = game.settings.get(this.MODULE_ID, "elevenlabs-api-key");
    const voiceId = game.settings.get(this.MODULE_ID, "elevenlabs-voice-id");
    const cacheEnabled = game.settings.get(this.MODULE_ID, "tts-cache-enabled");

    if (!apiKey) {
      ui.notifications.error("ElevenLabs API key not configured. Please set your API key in module settings.");
      return;
    }

    if (!voiceId) {
      ui.notifications.error("ElevenLabs voice ID not configured. Please set your voice ID in module settings.");
      return;
    }

    let ttsAudio = null;

    try {
      // Check cache first
      if (cacheEnabled) {
        const cacheKey = TTSCacheManager.generateKey(renderedText, voiceId);
        console.log(`Toast | Checking cache for key: ${cacheKey}`);
        ttsAudio = await TTSCacheManager.get(cacheKey);

        if (ttsAudio) {
          console.log("Toast | TTS audio found in cache");
        }
      }

      // Generate TTS if not in cache
      if (!ttsAudio) {
        console.log("Toast | Generating TTS audio via ElevenLabs API...");
        ui.notifications.info("Generating toast audio...");

        ttsAudio = await ElevenLabsAPI.generateTTS(renderedText, apiKey, voiceId);

        // Cache the result
        if (cacheEnabled) {
          const cacheKey = TTSCacheManager.generateKey(renderedText, voiceId);
          const maxCacheSizeMB = game.settings.get(this.MODULE_ID, "tts-cache-size-mb");
          await TTSCacheManager.set(cacheKey, ttsAudio);
          await TTSCacheManager.evictIfNeeded(maxCacheSizeMB);
          console.log("Toast | TTS audio cached");
        }
      }

      // Send TTS request to GM for validation and broadcast
      if (game.user.isGM) {
        // GM broadcasts immediately
        game.socket.emit(this.SOCKET_TTS_BROADCAST, {
          elements: elements,
          ttsAudio: ttsAudio
        });
        this.renderToastWithTTS(elements, ttsAudio);
      } else {
        // Non-GM sends request to GM
        game.socket.emit(this.SOCKET_TTS_REQUEST, {
          userId: game.user.id,
          elements: elements,
          ttsAudio: ttsAudio
        });
      }

      console.log("Toast | TTS toast request sent");

    } catch (err) {
      console.error("Toast | Failed to generate TTS:", err);
      ui.notifications.error(`Failed to generate toast audio: ${err.message}`);
    }
  }

  /**
   * Show a dynamic AI-generated TTS toast notification
   * Generates text via AI, then TTS audio, and broadcasts to all players
   * @param {Object} config - Configuration object
   * @param {string} config.prompt - User's tone/style prompt (required)
   * @param {Object} config.actor - Actor context (user-defined object)
   * @param {Object} config.target - Target context (user-defined object)
   * @param {string} config.context - What happened (e.g., "finishing-blow")
   * @param {Array} config.elements - Visual elements to display
   * @param {string} config.fallbackTemplate - Template ID to use if AI fails
   * @param {*} config.* - Any other user-defined context data
   */
  static async showDynamicAI(config) {
    const { prompt, elements = [], fallbackTemplate, ...context } = config;

    // Validate prompt
    if (!prompt) {
      AIStatusWindow.show("error", "No prompt provided. Please specify a tone/style prompt.");
      return;
    }

    // Check toast permission
    if (!this.hasPermission()) {
      AIStatusWindow.show("error", "You do not have permission to trigger toast notifications.");
      return;
    }

    // Check if AI generation is enabled
    const aiEnabled = game.settings.get(this.MODULE_ID, "ai-generation-enabled");
    if (!aiEnabled) {
      AIStatusWindow.show("error", "AI text generation is not enabled. Ask your GM to enable it in module settings.");
      return;
    }

    // Get API key configuration
    const apiConfig = this._getAIAPIConfig();
    if (!apiConfig) {
      AIStatusWindow.show("error", "No AI API key configured. Configure your own key in module settings, or ask your GM to share theirs.");
      return;
    }

    // Show generating status
    AIStatusWindow.show("generating", "Generating announcement with AI...");

    // Set up timeout
    const timeoutMs = 10000; // 10 seconds
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      AIStatusWindow.show("timeout", "Request timed out after 10 seconds.", {
        onRetry: () => this.showDynamicAI(config),
        onFallback: fallbackTemplate ? () => this._fallbackToTemplate(fallbackTemplate, context, elements) : null
      });
    }, timeoutMs);

    try {
      // Generate text with AI
      const generatedText = await AIProviderFactory.generate(apiConfig.provider, {
        apiKey: apiConfig.apiKey,
        model: apiConfig.model,
        prompt: prompt,
        context: context,
        maxTokens: apiConfig.maxTokens,
        temperature: apiConfig.temperature,
        mode: apiConfig.mode,
        assistantId: apiConfig.assistantId
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Check if already timed out
      if (timedOut) {
        console.log("Toast | AI generation completed but already timed out");
        return;
      }

      console.log(`Toast | AI generated text: "${generatedText}"`);

      // Close generating status
      AIStatusWindow.close();

      // Now generate TTS from the AI text
      await this._generateAndBroadcastTTS(generatedText, elements);

    } catch (err) {
      clearTimeout(timeoutId);

      if (timedOut) {
        return; // Already showing timeout message
      }

      console.error("Toast | AI generation failed:", err);

      AIStatusWindow.show("error", `AI generation failed: ${err.message}`, {
        onRetry: () => this.showDynamicAI(config),
        onFallback: fallbackTemplate ? () => this._fallbackToTemplate(fallbackTemplate, context, elements) : null
      });
    }
  }

  /**
   * Get AI API configuration (either user's own or GM's shared)
   * @returns {Object|null} API configuration or null if not available
   */
  static _getAIAPIConfig() {
    // Check if user wants to use their own keys
    const useOwnKeys = game.settings.get(this.MODULE_ID, "ai-use-own-keys");

    if (useOwnKeys) {
      // Use client's own keys
      const provider = game.settings.get(this.MODULE_ID, "ai-provider-client");
      const claudeKey = game.settings.get(this.MODULE_ID, "ai-claude-api-key-client");
      const openaiKey = game.settings.get(this.MODULE_ID, "ai-openai-api-key-client");
      const mode = game.settings.get(this.MODULE_ID, "ai-openai-mode-client");
      const customId = game.settings.get(this.MODULE_ID, "ai-openai-custom-id-client");

      const apiKey = provider === "claude" ? claudeKey : openaiKey;

      if (!apiKey) {
        return null;
      }

      // Get world settings for model/temperature (or use defaults)
      const model = game.settings.get(this.MODULE_ID, "ai-model");
      const maxTokens = game.settings.get(this.MODULE_ID, "ai-max-tokens");
      const temperature = game.settings.get(this.MODULE_ID, "ai-temperature");

      return {
        provider: provider,
        apiKey: apiKey,
        model: model,
        maxTokens: maxTokens,
        temperature: temperature,
        mode: mode,
        assistantId: mode === "custom-gpt" || mode === "fine-tuned" ? customId : null
      };
    } else {
      // Check if user has access to GM's keys
      const shareMode = game.settings.get(this.MODULE_ID, "ai-share-keys-mode");

      if (shareMode === "none") {
        return null; // GM not sharing
      }

      if (shareMode === "all") {
        // Everyone has access
      } else if (shareMode === "role") {
        const allowedRole = parseInt(game.settings.get(this.MODULE_ID, "ai-allowed-roles"));
        if (game.user.role < allowedRole) {
          return null; // User's role too low
        }
      } else if (shareMode === "username") {
        const allowedUsernames = game.settings.get(this.MODULE_ID, "ai-allowed-usernames");
        const usernameList = allowedUsernames.split(",").map(u => u.trim().toLowerCase());
        if (!usernameList.includes(game.user.name.toLowerCase())) {
          return null; // User not in allowed list
        }
      }

      // User has access - use GM's keys
      const provider = game.settings.get(this.MODULE_ID, "ai-provider");
      const claudeKey = game.settings.get(this.MODULE_ID, "ai-claude-api-key-world");
      const openaiKey = game.settings.get(this.MODULE_ID, "ai-openai-api-key-world");
      const model = game.settings.get(this.MODULE_ID, "ai-model");
      const maxTokens = game.settings.get(this.MODULE_ID, "ai-max-tokens");
      const temperature = game.settings.get(this.MODULE_ID, "ai-temperature");
      const mode = game.settings.get(this.MODULE_ID, "ai-openai-mode");
      const customId = game.settings.get(this.MODULE_ID, "ai-openai-custom-id");

      const apiKey = provider === "claude" ? claudeKey : openaiKey;

      if (!apiKey) {
        return null;
      }

      return {
        provider: provider,
        apiKey: apiKey,
        model: model,
        maxTokens: maxTokens,
        temperature: temperature,
        mode: mode,
        assistantId: mode === "custom-gpt" || mode === "fine-tuned" ? customId : null
      };
    }
  }

  /**
   * Generate TTS and broadcast to all players
   * @param {string} text - Text to convert to speech
   * @param {Array} elements - Visual elements
   */
  static async _generateAndBroadcastTTS(text, elements) {
    // Get ElevenLabs settings
    const apiKey = game.settings.get(this.MODULE_ID, "elevenlabs-api-key");
    const voiceId = game.settings.get(this.MODULE_ID, "elevenlabs-voice-id");
    const cacheEnabled = game.settings.get(this.MODULE_ID, "tts-cache-enabled");

    if (!apiKey) {
      ui.notifications.error("ElevenLabs API key not configured.");
      return;
    }

    let ttsAudio = null;

    try {
      // Check cache
      if (cacheEnabled) {
        const cacheKey = TTSCacheManager.generateKey(text, voiceId);
        ttsAudio = await TTSCacheManager.get(cacheKey);

        if (ttsAudio) {
          console.log("Toast | TTS audio found in cache");
        }
      }

      // Generate if not cached
      if (!ttsAudio) {
        console.log("Toast | Generating TTS audio...");
        ttsAudio = await ElevenLabsAPI.generateTTS(text, apiKey, voiceId);

        // Cache it
        if (cacheEnabled) {
          const cacheKey = TTSCacheManager.generateKey(text, voiceId);
          const maxCacheSizeMB = game.settings.get(this.MODULE_ID, "tts-cache-size-mb");
          await TTSCacheManager.set(cacheKey, ttsAudio);
          await TTSCacheManager.evictIfNeeded(maxCacheSizeMB);
        }
      }

      // Broadcast to all players
      if (game.user.isGM) {
        game.socket.emit(this.SOCKET_TTS_BROADCAST, {
          elements: elements,
          ttsAudio: ttsAudio
        });
        this.renderToastWithTTS(elements, ttsAudio);
      } else {
        game.socket.emit(this.SOCKET_TTS_REQUEST, {
          userId: game.user.id,
          elements: elements,
          ttsAudio: ttsAudio
        });
      }

    } catch (err) {
      console.error("Toast | TTS generation failed:", err);
      ui.notifications.error(`TTS generation failed: ${err.message}`);
    }
  }

  /**
   * Fallback to template-based TTS
   * @param {string} templateId - Template ID
   * @param {Object} context - Context with token values
   * @param {Array} elements - Visual elements
   */
  static async _fallbackToTemplate(templateId, context, elements) {
    console.log(`Toast | Falling back to template: ${templateId}`);

    // Extract tokens from context (actor.name, target.name, etc.)
    const tokens = {};
    if (context.actor && context.actor.name) tokens.actor = context.actor.name;
    if (context.target && context.target.name) tokens.target = context.target.name;
    // Add other common token mappings as needed

    // Use the template-based method
    await this.showDynamic(templateId, tokens, elements);
  }

  /**
   * Render a toast with TTS audio playback
   * Similar to renderToast but plays TTS audio instead of sound elements
   * @param {Array} elements - Array of visual element configurations
   * @param {string} ttsAudio - Base64-encoded audio data (data:audio/mpeg;base64,...)
   */
  static renderToastWithTTS(elements, ttsAudio) {
    // Remove any existing overlay to prevent stacking
    const existingOverlay = document.getElementById("toast-overlay");
    if (existingOverlay) {
      console.log("Toast | Removing existing overlay");
      existingOverlay.remove();
    }

    // Create overlay container
    const overlay = document.createElement("div");
    overlay.id = "toast-overlay";
    overlay.className = "toast-overlay";

    // Process visual elements (skip sound elements for TTS toasts)
    elements.forEach((element, index) => {
      if (element.type === "sound") {
        console.warn("Toast | Sound elements are ignored in TTS toasts");
        return;
      }

      const el = this.createElementNode(element, index);
      if (el) {
        overlay.appendChild(el);
      }
    });

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.className = "toast-close-button";
    closeButton.textContent = "Close";
    closeButton.setAttribute("title", "Dismiss this toast");
    overlay.appendChild(closeButton);

    // Add to document
    document.body.appendChild(overlay);

    // Play TTS audio
    let ttsAudioElement = null;
    if (ttsAudio) {
      try {
        ttsAudioElement = new Audio(ttsAudio);
        ttsAudioElement.volume = 0.8; // Default volume
        ttsAudioElement.play().catch(err => {
          console.warn("Toast | Failed to play TTS audio:", err.message);
        });
        console.log("Toast | Playing TTS audio");
      } catch (err) {
        console.warn("Toast | Error creating TTS audio element:", err.message);
      }
    }

    // Helper function to dismiss toast
    const dismissToast = () => {
      if (autoRemoveTimeout) {
        clearTimeout(autoRemoveTimeout);
      }
      if (fadeOutTimeout) {
        clearTimeout(fadeOutTimeout);
      }
      if (ttsAudioElement) {
        ttsAudioElement.pause();
        ttsAudioElement.currentTime = 0;
      }
      overlay.classList.add("toast-fade-out");
      setTimeout(() => overlay.remove(), 500);
    };

    // Close button event listener
    closeButton.addEventListener("click", dismissToast);

    // Start animations for visual elements
    requestAnimationFrame(() => {
      elements.forEach((element, index) => {
        if (element.type !== "sound") {
          this.animateElement(element, index);
        }
      });
    });

    // Auto-remove after animation completes (including delays)
    const maxDuration = Math.max(...elements.map(e => {
      if (e.type === "sound") {
        return 0; // Ignore sound elements
      }
      const duration = (e.animation?.duration || 2) * 1000;
      const delay = (e.animation?.delay || 0) * 1000;
      return duration + delay;
    }), 5000) + 1000; // Minimum 5 seconds for TTS audio

    let autoRemoveTimeout, fadeOutTimeout;
    autoRemoveTimeout = setTimeout(() => {
      overlay.classList.add("toast-fade-out");
      fadeOutTimeout = setTimeout(() => overlay.remove(), 500);
    }, maxDuration);
  }

  /**
   * Create a DOM element from element configuration
   * @param {Object} element - Element configuration
   * @param {Number} index - Element index
   */
  static createElementNode(element, index) {
    const container = document.createElement("div");
    container.className = "toast-element";
    container.id = `toast-element-${index}`;

    // Apply positioning and layout styles from element.style to container
    if (element.style && typeof element.style === 'object') {
      // Position-related properties that should be on the container
      const containerProps = ['position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'transform', 'zIndex'];
      containerProps.forEach(prop => {
        if (element.style[prop] !== undefined) {
          container.style[prop] = element.style[prop];
        }
      });
    }

    // Apply base styles (legacy support)
    if (element.rotation !== undefined && !element.style?.transform) {
      container.style.transform = `rotate(${element.rotation}deg)`;
    }

    // Apply z-index if specified (legacy support)
    if (element.zIndex !== undefined && !element.style?.zIndex) {
      container.style.zIndex = element.zIndex;
    }

    // Handle different element types
    switch (element.type) {
      case "image":
      case "imageUrl":
        return this.createImageElement(element, container);

      case "tokenImage":
        return this.createTokenImageElement(element, container);

      case "actorImage":
        return this.createActorImageElement(element, container);

      case "text":
        return this.createTextElement(element, container);

      case "shape":
        return this.createShapeElement(element, container);

      default:
        console.warn(`Toast | Unknown element type: ${element.type}`);
        return null;
    }
  }

  /**
   * Create an image element
   */
  static createImageElement(element, container) {
    const img = document.createElement("img");
    img.src = element.src;
    img.className = "toast-image";

    if (element.width) img.style.width = element.width;
    if (element.height) img.style.height = element.height;

    container.appendChild(img);
    return container;
  }

  /**
   * Create a token image element
   */
  static createTokenImageElement(element, container) {
    const token = canvas.tokens.get(element.tokenId);
    if (!token) {
      console.warn(`Toast | Token not found: ${element.tokenId}`);
      return null;
    }

    const img = document.createElement("img");
    img.src = token.document.texture.src;
    img.className = "toast-image toast-token";

    if (element.width) img.style.width = element.width;
    if (element.height) img.style.height = element.height;

    container.appendChild(img);
    return container;
  }

  /**
   * Create an actor image element
   */
  static createActorImageElement(element, container) {
    const actor = game.actors.get(element.actorId);
    if (!actor) {
      console.warn(`Toast | Actor not found: ${element.actorId}`);
      return null;
    }

    const img = document.createElement("img");
    img.src = actor.img;
    img.className = "toast-image toast-actor";

    if (element.width) img.style.width = element.width;
    if (element.height) img.style.height = element.height;

    container.appendChild(img);
    return container;
  }

  /**
   * Create a text element
   */
  static createTextElement(element, container) {
    const text = document.createElement("div");
    text.className = "toast-text";
    text.textContent = element.text;

    // Support both direct properties and nested style object
    const styles = element.style || element;

    // Apply all styles from style object
    if (element.style && typeof element.style === 'object') {
      Object.assign(text.style, element.style);
    } else {
      // Legacy: apply individual properties directly on element
      if (styles.color) text.style.color = styles.color;
      if (styles.fontSize) text.style.fontSize = styles.fontSize;
      if (styles.fontFamily) text.style.fontFamily = styles.fontFamily;
      if (styles.fontWeight) text.style.fontWeight = styles.fontWeight;
      if (styles.textShadow) text.style.textShadow = styles.textShadow;
    }

    container.appendChild(text);
    return container;
  }

  /**
   * Create a shape element (rectangle, circle, etc.)
   */
  static createShapeElement(element, container) {
    const shape = document.createElement("div");
    shape.className = "toast-shape";

    // Apply dimensions
    if (element.width) container.style.width = element.width;
    if (element.height) container.style.height = element.height;

    // Apply styling
    const bgColor = element.color || element.backgroundColor;
    if (bgColor) shape.style.backgroundColor = bgColor;
    if (element.borderRadius) shape.style.borderRadius = element.borderRadius;
    if (element.border) shape.style.border = element.border;
    if (element.boxShadow) shape.style.boxShadow = element.boxShadow;
    if (element.opacity) shape.style.opacity = element.opacity;

    container.appendChild(shape);
    return container;
  }

  /**
   * Animate an element
   * @param {Object} element - Element configuration
   * @param {Number} index - Element index
   */
  static animateElement(element, index) {
    if (!element.animation) return;

    const node = document.getElementById(`toast-element-${index}`);
    if (!node) return;

    const anim = element.animation;
    const duration = (anim.duration || 2) * 1000;
    const delay = (anim.delay || 0) * 1000;

    // Wrap animation in delay if specified
    const runAnimation = () => {
      // Check if using CSS animation instead of transition
      if (anim.cssAnimation) {
        // Position element at center coordinates if provided
        if (anim.centerX !== undefined) {
          node.style.left = `${anim.centerX}px`;
        }
        if (anim.centerY !== undefined) {
          node.style.top = `${anim.centerY}px`;
        }
        node.style.position = "absolute";

        // Apply CSS animation
        node.style.animation = `${anim.cssAnimation} ${duration}ms ${anim.easing || "linear"} forwards`;
        return;
      }

      // Standard transition-based animation
      // Set initial position
      const startX = anim.startX || 0;
      const startY = anim.startY || 0;
      node.style.left = `${startX}px`;
      node.style.top = `${startY}px`;
      node.style.position = "absolute";

      // Apply transition
      node.style.transition = `all ${duration}ms ${anim.easing || "ease-out"}`;

      // Trigger animation
      requestAnimationFrame(() => {
        const endX = anim.endX !== undefined ? anim.endX : startX;
        const endY = anim.endY !== undefined ? anim.endY : startY;

        node.style.left = `${endX}px`;
        node.style.top = `${endY}px`;

        if (anim.scale !== undefined) {
          const currentTransform = node.style.transform || "";
          node.style.transform = `${currentTransform} scale(${anim.scale})`;
        }

        if (anim.opacity !== undefined) {
          node.style.opacity = anim.opacity;
        }
      });
    };

    // Run immediately or after delay
    if (delay > 0) {
      setTimeout(runAnimation, delay);
    } else {
      runAnimation();
    }
  }

  /**
   * Open Toast Studio window
   * @param {Object} options - Studio options
   * @param {String} options.tab - Initial tab to open ("assets", "packages", "studio")
   */
  static openStudio(options = {}) {
    // Check if studio is already open
    if (this.studioApp && this.studioApp.rendered) {
      this.studioApp.bringToTop();
      return this.studioApp;
    }

    // Create new studio instance
    this.studioApp = new ToastStudioApp(options);
    this.studioApp.render(true);

    console.log("Toast Studio | Opened");
    return this.studioApp;
  }

  /**
   * Close Toast Studio window
   */
  static closeStudio() {
    if (this.studioApp) {
      this.studioApp.close();
      this.studioApp = null;
      console.log("Toast Studio | Closed");
    }
  }
}


/**
 * Integration layer - adds TemplateManager methods to ToastManager
 * This allows ToastManager to access template functionality
 */

// Add TemplateManager methods to ToastManager
ToastManager.templates = TemplateManager.templates;
ToastManager.registerTemplate = TemplateManager.registerTemplate.bind(TemplateManager);
ToastManager.extractTokens = TemplateManager.extractTokens.bind(TemplateManager);
ToastManager.renderTemplate = TemplateManager.renderTemplate.bind(TemplateManager);
ToastManager.getTemplate = TemplateManager.getTemplate.bind(TemplateManager);
ToastManager.listTemplates = TemplateManager.listTemplates.bind(TemplateManager);
ToastManager.deleteTemplate = TemplateManager.deleteTemplate.bind(TemplateManager);
ToastManager.initializeBuiltInTemplates = TemplateManager.initializeBuiltInTemplates.bind(TemplateManager);


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


