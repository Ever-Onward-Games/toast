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
