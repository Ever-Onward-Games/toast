/**
 * Toast Module - Full Screen Celebrations for Foundry VTT v13
 */

class ToastManager {
  static MODULE_ID = "toast";
  static SOCKET_REQUEST = "module.toast.request";
  static SOCKET_BROADCAST = "module.toast.broadcast";
  static registeredAnnouncers = {}; // Store for module-registered announcers
  static templates = {}; // Store for dynamic TTS templates

  /**
   * Initialize the Toast module
   */
  static init() {
    console.log("Toast | Initializing module");
    this.registerSettings();
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
      default: "gm-only",
      onChange: () => {}
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
      default: "4",
      onChange: () => {}
    });

    // Allowed usernames setting
    game.settings.register(this.MODULE_ID, "allowedUsernames", {
      name: "Allowed Usernames",
      hint: "Comma-separated list of usernames that can trigger toasts (when Permission Mode is 'By Username').",
      scope: "world",
      config: true,
      type: String,
      default: "",
      onChange: () => {}
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
      default: "unreal-tournament",
      onChange: () => {}
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
   * Register a dynamic TTS template for epic moments
   * @param {string} id - Unique identifier for the template (e.g., "boss-kill")
   * @param {Object} config - Template configuration
   * @param {string} config.template - Template string with {tokens} (e.g., "{player} defeated {boss}!")
   * @param {Array<string>} config.tags - Optional tags for categorization
   * @param {number} config.duration - Optional estimated audio duration in seconds
   * @returns {boolean} True if registered successfully, false otherwise
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
  }

  /**
   * Register the global API for macros
   */
  static registerAPI() {
    game.toast = {
      show: (elements) => this.showToast(elements),
      showLocal: (elements) => this.renderToast(elements),
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
            backgroundColor: element.backgroundColor,
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

    // Add to document
    document.body.appendChild(overlay);

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
    setTimeout(() => {
      overlay.classList.add("toast-fade-out");
      setTimeout(() => overlay.remove(), 500);
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

    // Apply base styles
    if (element.rotation !== undefined) {
      container.style.transform = `rotate(${element.rotation}deg)`;
    }

    // Apply z-index if specified
    if (element.zIndex !== undefined) {
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

    if (element.color) text.style.color = element.color;
    if (element.fontSize) text.style.fontSize = element.fontSize;
    if (element.fontFamily) text.style.fontFamily = element.fontFamily;
    if (element.fontWeight) text.style.fontWeight = element.fontWeight;
    if (element.textShadow) text.style.textShadow = element.textShadow;

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
    if (element.backgroundColor) shape.style.backgroundColor = element.backgroundColor;
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
}

// Initialize module
Hooks.once("init", () => ToastManager.init());
Hooks.once("ready", () => ToastManager.ready());
