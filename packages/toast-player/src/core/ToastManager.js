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
        return options.inverse ? options.inverse(this) : '';
      }
    });

    // Division helper for calculations
    Handlebars.registerHelper('divide', function(a, b) {
      return (a / b).toFixed(2);
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

    // Initialize built-in templates (if method exists)
    if (typeof this.initializeBuiltInTemplates === 'function') {
      this.initializeBuiltInTemplates();
    }

    await this.scanAnnouncerPacks();

    // Initialize TTS cache (if available)
    if (typeof TTSCacheManager !== 'undefined') {
      try {
        await TTSCacheManager.init();
        console.log("Toast | TTS cache initialized");
      } catch (err) {
        console.warn("Toast | Failed to initialize TTS cache:", err);
      }
    }

    // Initialize Package Manager (if available - provided by toast-studio module)
    if (typeof PackageManager !== 'undefined') {
      try {
        this.packageManager = new PackageManager();
        await this.packageManager.initialize();
        console.log("Toast | Package manager initialized");
      } catch (err) {
        console.warn("Toast | Failed to initialize package manager:", err);
      }
    } else {
      console.log("Toast | Package manager not available (install toast-studio module for package features)");
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
      hint: "Select which announcer voice pack to use for sounds. Place announcer folders in modules/toast-player/sounds/announcers/",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "unreal-tournament": "Unreal Tournament"
      },
      default: "unreal-tournament"
    });

    // TTS and AI features are not implemented in this version
    // Users can source their own audio files

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

    // Global Packages Directory
    game.settings.register(this.MODULE_ID, "packages-directory-global", {
      name: "Global Packages Directory",
      hint: "Directory path where packages.json will be stored (relative to Foundry Data folder). All global packages are stored in a single file.",
      scope: "world",
      config: true,
      type: String,
      default: "toasts"
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
      const announcersPath = "modules/toast-player/sounds/announcers";

      // Start with registered announcers
      const allAnnouncerPacks = { ...this.getRegisteredAnnouncerChoices() };

      // Use FilePicker to browse the announcers directory
      const FilePicker = foundry.applications.apps.FilePicker.implementation;
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
      return `modules/toast-player/sounds/announcers/${announcerPack}/${filename}`;
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
    // Expose ToastManager globally for toast-studio access
    window.ToastManager = this;

    game.toast = {
      // Main API methods
      show: (elements) => this.showToast(elements),
      showLocal: (elements) => this.renderToast(elements),

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
      if (cacheEnabled && typeof TTSCacheManager !== 'undefined') {
        const cacheKey = TTSCacheManager.generateKey(renderedText, voiceId);
        console.log(`Toast | Checking cache for key: ${cacheKey}`);
        ttsAudio = await TTSCacheManager.get(cacheKey);

        if (ttsAudio) {
          console.log("Toast | TTS audio found in cache");
        }
      }

      // Generate TTS if not in cache
      if (!ttsAudio) {
        if (typeof ElevenLabsAPI === 'undefined') {
          ui.notifications.error("TTS API not available");
          return;
        }

        console.log("Toast | Generating TTS audio via ElevenLabs API...");
        ui.notifications.info("Generating toast audio...");

        ttsAudio = await ElevenLabsAPI.generateTTS(renderedText, apiKey, voiceId);

        // Cache the result
        if (cacheEnabled && typeof TTSCacheManager !== 'undefined') {
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

    // Check if AI classes are available
    if (typeof AIStatusWindow === 'undefined' || typeof AIProviderFactory === 'undefined') {
      ui.notifications.error("AI generation not available - required modules not loaded");
      return;
    }

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
      if (cacheEnabled && typeof TTSCacheManager !== 'undefined') {
        const cacheKey = TTSCacheManager.generateKey(text, voiceId);
        ttsAudio = await TTSCacheManager.get(cacheKey);

        if (ttsAudio) {
          console.log("Toast | TTS audio found in cache");
        }
      }

      // Generate if not cached
      if (!ttsAudio) {
        if (typeof ElevenLabsAPI === 'undefined') {
          ui.notifications.error("TTS API not available");
          return;
        }

        console.log("Toast | Generating TTS audio...");
        ttsAudio = await ElevenLabsAPI.generateTTS(text, apiKey, voiceId);

        // Cache it
        if (cacheEnabled && typeof TTSCacheManager !== 'undefined') {
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
