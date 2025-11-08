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
        return result.files.filter(f => f.endsWith('.json'));
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
    return await game.toast.show(config);
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
      // Use Foundry's file delete API (if available)
      // Note: This might require GM permissions
      console.log(`Toast PackageManager | Deleting package file: ${filePath}`);

      // For now, we'll just log this - actual file deletion might need to be
      // handled server-side or via a different API
      ui.notifications?.warn(`Package "${pkg.name}" removed from memory. File may still exist at: ${filePath}`);
    } catch (err) {
      console.error(`Toast PackageManager | Failed to delete package file ${filePath}:`, err);
      throw new Error(`Could not delete package file: ${err.message}`);
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
