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
   * @returns {string} File path relative to data directory (using persistentStorage)
   */
  getFilePath() {
    if (this.scope === "global") {
      return `modules/toast/storage/packages/${this.id}.json`;
    } else {
      return `modules/toast/storage/worlds/${this.worldId}/packages/${this.id}.json`;
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
