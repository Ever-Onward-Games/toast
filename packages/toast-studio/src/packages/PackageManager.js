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

    // File paths for package collections
    this._globalFilePath = null;
    this._worldFilePath = null;
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
      // Get global packages directory from settings
      const globalDir = game.settings.get("toast", "packages-directory-global") || "toasts";
      this._globalFilePath = `${globalDir}/packages.json`;

      // Set world file path
      if (game?.world?.id) {
        this._worldFilePath = `worlds/${game.world.id}/toast-packages.json`;
      }

      // Load packages from both files
      await this._loadPackagesFromFile(this._globalFilePath, "global");
      if (this._worldFilePath) {
        await this._loadPackagesFromFile(this._worldFilePath, "world");
      }

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
   * Load all packages from a single JSON file
   * @param {string} filePath - Path to packages.json file
   * @param {string} expectedScope - Expected scope for validation
   * @returns {Promise<void>}
   * @private
   */
  async _loadPackagesFromFile(filePath, expectedScope) {
    try {
      console.log(`Toast PackageManager | Loading ${expectedScope} packages from: ${filePath}`);

      const response = await fetch(filePath);
      if (!response.ok) {
        // File doesn't exist yet - that's okay for first time
        console.log(`Toast PackageManager | No ${expectedScope} packages file found (will be created on first save)`);
        return;
      }

      const json = await response.json();

      // Expect an array of package objects
      if (!Array.isArray(json)) {
        console.warn(`Toast PackageManager | Invalid format in ${filePath}: expected array`);
        return;
      }

      let loaded = 0;
      for (const pkgData of json) {
        try {
          const pkg = Package.fromJSON(pkgData);

          // Validate scope matches location
          if (pkg.scope !== expectedScope) {
            console.warn(`Toast PackageManager | Package scope mismatch: ${pkg.id} (expected ${expectedScope}, got ${pkg.scope})`);
          }

          this.packages.set(pkg.id, pkg);
          loaded++;
        } catch (err) {
          console.error(`Toast PackageManager | Failed to load package from ${filePath}:`, err);
        }
      }

      console.log(`Toast PackageManager | Loaded ${loaded} ${expectedScope} packages`);
    } catch (err) {
      console.error(`Toast PackageManager | Failed to load packages from ${filePath}:`, err);
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

    // Add to memory
    this.packages.set(pkg.id, pkg);

    // Save entire collection to disk
    await this._savePackageCollection(pkg.scope);

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

    // Save entire collection to disk
    await this._savePackageCollection(pkg.scope);

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

    const scope = pkg.scope;

    // Remove from memory
    this.packages.delete(id);

    // Save entire collection to disk (without this package)
    await this._savePackageCollection(scope);

    console.log(`Toast PackageManager | Deleted package: ${id}`);
    ui.notifications?.info(`Package "${pkg.name}" deleted successfully`);
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
   * Save all packages of a given scope to their collection file
   * @param {string} scope - Package scope ("global" or "world")
   * @returns {Promise<void>}
   * @private
   */
  async _savePackageCollection(scope) {
    try {
      // Get all packages of this scope
      const packagesArray = Array.from(this.packages.values())
        .filter(pkg => pkg.scope === scope)
        .map(pkg => pkg.toJSON());

      // Determine file path based on scope
      let filePath;
      if (scope === "global") {
        filePath = this._globalFilePath;
      } else if (scope === "world") {
        if (!this._worldFilePath) {
          throw new Error("Cannot save world-scoped packages: no world loaded");
        }
        filePath = this._worldFilePath;
      } else {
        throw new Error(`Invalid package scope: ${scope}`);
      }

      console.log(`Toast PackageManager | Saving ${packagesArray.length} ${scope} packages to: ${filePath}`);

      // Extract directory from file path
      const lastSlashIndex = filePath.lastIndexOf('/');
      const directory = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : "";
      const filename = filePath.substring(lastSlashIndex + 1);

      // Create directory if it doesn't exist
      if (directory) {
        try {
          await foundry.applications.apps.FilePicker.implementation.createDirectory("data", directory, {});
          console.log(`Toast PackageManager | Created directory: ${directory}`);
        } catch (err) {
          // Directory might already exist - that's fine
          if (!err.message?.includes("EEXIST")) {
            console.warn(`Toast PackageManager | Could not create directory:`, err);
          }
        }
      }

      // Create JSON content
      const json = JSON.stringify(packagesArray, null, 2);

      // Create a File object
      const file = new File([json], filename, { type: "application/json" });

      // Upload the file
      const result = await foundry.applications.apps.FilePicker.implementation.upload(
        "data",
        directory || ".",
        file,
        {},
        { notify: false }
      );

      if (!result || !result.path) {
        throw new Error(`Upload failed: No path returned`);
      }

      console.log(`Toast PackageManager | Saved ${scope} packages to: ${result.path}`);
    } catch (err) {
      console.error(`Toast PackageManager | Failed to save ${scope} packages:`, err);
      throw new Error(`Could not save ${scope} packages: ${err.message}`);
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
