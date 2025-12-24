/**
 * Toast Studio Application
 * Main GUI window for Toast content creation
 *
 * Provides:
 * - Asset browsing (audio, images)
 * - Package management
 * - Visual toast editor (future)
 */
class ToastStudioApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(options = {}) {
    super(options);

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

    // Animator state
    this.animatorElements = [];        // Array of animation elements
    this.currentFrame = 0;              // Current playhead frame
    this.selectedElementId = null;      // ID of selected element
    this.nextElementId = 1;             // Counter for element IDs
    this.animationDuration = 90;        // Total frames (3 seconds at 30fps)
    this.animationFPS = 30;             // Frame rate
  }

  /**
   * ApplicationV2 configuration
   */
  static DEFAULT_OPTIONS = {
    id: "toast-studio",
    tag: "form",
    form: {
      handler: ToastStudioApp.#onSubmit,
      closeOnSubmit: false,
      submitOnChange: false
    },
    window: {
      title: "Toast Studio",
      resizable: true
    },
    position: {
      width: 900,
      height: 700
    },
    actions: {}
  };

  static PARTS = {
    form: {
      template: "modules/toast-studio/templates/toast-studio.hbs"
    }
  };

  /**
   * Handle form submission
   */
  static async #onSubmit(event, form, formData) {
    // Form submission not needed for this application
  }

  /**
   * Prepare context data for rendering
   */
  async _prepareContext(options) {
    const data = {};

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
        id: "animator",
        label: "Animator",
        icon: "fas fa-film",
        active: this.activeTab === "animator",
        disabled: false // Phase 4.4: Enabled!
      }
    ];

    data.tabs = tabsArray; // Array for {{#each tabs}}
    data.tabsByName = {    // Object for {{#if tabsByName.packages.active}}
      assets: tabsArray[0],
      packages: tabsArray[1],
      animator: tabsArray[2]
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

    // Get animator data
    if (this.activeTab === "animator") {
      data.animator = this._getAnimatorData();
    }

    return data;
  }

  /**
   * Get animator data
   */
  _getAnimatorData() {
    const selectedElement = this.animatorElements.find(el => el.id === this.selectedElementId) || null;

    // Extract current property values from selected element
    let properties = {};
    if (selectedElement) {
      // Get properties from first keyframe, or use defaults
      const defaults = {
        x: 960,
        y: 540,
        rotation: 0,
        scale: 1.0,
        opacity: 1.0,
        fontSize: 72,
        color: '#ffffff',
        fontWeight: 'normal',
        width: 200,
        height: 200,
        volume: 0.8
      };

      if (selectedElement.keyframes && selectedElement.keyframes.length > 0) {
        properties = { ...defaults, ...selectedElement.keyframes[0].properties };
      } else {
        properties = defaults;
      }

      // Convert scale and opacity to percentages for display
      properties.scalePercent = Math.round(properties.scale * 100);
      properties.opacityPercent = Math.round(properties.opacity * 100);
    }

    return {
      elements: this.animatorElements.map((el, index) => ({
        ...el,
        index: index,
        selected: el.id === this.selectedElementId
      })),
      currentFrame: this.currentFrame,
      duration: this.animationDuration,
      fps: this.animationFPS,
      selectedElement: selectedElement,
      properties: properties,
      hasElements: this.animatorElements.length > 0
    };
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
        path: "modules/toast-player/sounds",
        type: "audio",
        source: "default",
        label: "Default Sounds"
      },
      {
        path: "modules/toast-player/images",
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
      const target = "modules/toast-player/sounds";

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
      const target = "modules/toast-player/images";

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
  _onRender(context, options) {
    const html = $(this.element);

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

    // Animator: Element management
    html.find(".add-element-btn").on("click", this._onAddAnimatorElement.bind(this));
    html.find(".delete-element-btn").on("click", this._onDeleteAnimatorElement.bind(this));
    html.find(".element-item").on("click", this._onSelectAnimatorElement.bind(this));

    // Animator: Property editing
    html.find(".element-prop").on("change", this._onElementPropertyChange.bind(this));
    html.find(".browse-asset-btn").on("click", this._onBrowseAsset.bind(this));

    // Animator: Actions
    html.find(".save-animation-btn").on("click", this._onSaveAnimation.bind(this));
    html.find(".preview-animation-btn").on("click", this._onPreviewAnimation.bind(this));
    html.find(".clear-animation-btn").on("click", this._onClearAnimation.bind(this));

    // Animator: Initialize canvas if on animator tab
    if (this.activeTab === "animator") {
      this._initializeAnimatorCanvas();
    }
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

    try {
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      // Open the package editor for a new package
      PackageEditorDialog.show(null, packageManager);
    } catch (err) {
      console.error("Toast Studio | Failed to open package editor:", err);
      ui.notifications.error("Failed to open package editor");
    }
  }

  /**
   * Handle edit package button
   */
  async _onEditPackage(event) {
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

      // Open the package editor for editing
      PackageEditorDialog.show(pkg, packageManager);
    } catch (err) {
      console.error("Toast Studio | Failed to open package editor:", err);
      ui.notifications.error("Failed to open package editor");
    }
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

  // ==========================================
  // Animator Methods
  // ==========================================

  /**
   * Initialize the animator canvas
   */
  _initializeAnimatorCanvas() {
    const canvas = this.element.find("#animator-canvas")[0];
    if (!canvas) {
      console.warn("Toast Studio | Animator canvas not found");
      return;
    }

    // Create StudioCanvas instance
    this.studioCanvas = new StudioCanvas(canvas, 1920, 1080);

    // Set initial elements
    this.studioCanvas.setElements(this.animatorElements);
    this.studioCanvas.setFrame(this.currentFrame);
    this.studioCanvas.setSelection(this.selectedElementId ? [this.selectedElementId] : []);
  }

  /**
   * Handle add animator element
   */
  _onAddAnimatorElement(event) {
    event.preventDefault();
    const type = $(event.currentTarget).data("type");

    // Create element ID
    const id = `element-${this.nextElementId++}`;

    // Create element based on type
    let element = {
      id: id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${this.nextElementId - 1}`,
      type: type,
      keyframes: []
    };

    // Add type-specific properties
    switch (type) {
      case 'text':
        element.text = 'New Text';
        element.keyframes = [{
          frame: 0,
          properties: {
            x: 960,
            y: 540,
            rotation: 0,
            scale: 1.0,
            opacity: 1.0,
            fontSize: 72,
            color: '#ffffff',
            fontWeight: 'normal'
          },
          interpolation: 'ease-in-out'
        }];
        break;

      case 'image':
        element.src = '';
        element.keyframes = [{
          frame: 0,
          properties: {
            x: 960,
            y: 540,
            rotation: 0,
            scale: 1.0,
            opacity: 1.0,
            width: 200,
            height: 200
          },
          interpolation: 'ease-in-out'
        }];
        break;

      case 'sound':
        element.src = '';
        element.keyframes = [{
          frame: 0,
          properties: {
            volume: 0.8,
            play: false
          }
        }];
        break;
    }

    // Add to elements array
    this.animatorElements.push(element);

    // Select the new element
    this.selectedElementId = id;

    // Re-render
    this.render();
  }

  /**
   * Handle select animator element
   */
  _onSelectAnimatorElement(event) {
    event.preventDefault();
    const elementId = $(event.currentTarget).data("element-id");

    this.selectedElementId = elementId;

    // Update visual selection state
    this.element.find(".element-item").removeClass("selected");
    $(event.currentTarget).addClass("selected");

    // Update canvas selection
    if (this.studioCanvas) {
      this.studioCanvas.setSelection([elementId]);
    }

    // Re-render to update properties panel
    this.render();
  }

  /**
   * Handle delete animator element
   */
  _onDeleteAnimatorElement(event) {
    event.preventDefault();

    if (!this.selectedElementId) {
      ui.notifications.warn("No element selected");
      return;
    }

    // Find element index
    const index = this.animatorElements.findIndex(el => el.id === this.selectedElementId);
    if (index === -1) {
      ui.notifications.error("Element not found");
      return;
    }

    // Get element name for notification
    const elementName = this.animatorElements[index].name;

    // Remove element
    this.animatorElements.splice(index, 1);

    // Clear selection
    this.selectedElementId = null;

    // Re-render
    this.render();

    ui.notifications.info(`Deleted ${elementName}`);
  }

  /**
   * Handle element property change
   */
  _onElementPropertyChange(event) {
    event.preventDefault();

    if (!this.selectedElementId) return;

    const element = this.animatorElements.find(el => el.id === this.selectedElementId);
    if (!element) return;

    const input = event.currentTarget;
    const propName = input.dataset.prop;
    let value = input.value;

    // Type conversion based on input type
    if (input.type === "number") {
      value = parseFloat(value) || 0;

      // Special handling for percentage values (scale, opacity)
      if (propName === "scale") {
        value = value / 100; // Convert from 0-100 to 0-1
      } else if (propName === "opacity") {
        value = value / 100; // Convert from 0-100 to 0-1
      }
    }

    // Update element property directly (non-keyframe mode for now)
    if (propName === "text" || propName === "src") {
      // Update root-level properties
      element[propName] = value;
    } else {
      // Update keyframe properties
      if (!element.keyframes || element.keyframes.length === 0) {
        // Create first keyframe if none exists
        element.keyframes = [{
          frame: 0,
          properties: {},
          interpolation: 'ease-in-out'
        }];
      }

      // Update first keyframe (simple mode - no animation yet)
      element.keyframes[0].properties[propName] = value;
    }

    // Update canvas immediately
    if (this.studioCanvas) {
      this.studioCanvas.setElements(this.animatorElements);
    }
  }

  /**
   * Handle browse asset button
   */
  _onBrowseAsset(event) {
    event.preventDefault();

    if (!this.selectedElementId) return;

    const element = this.animatorElements.find(el => el.id === this.selectedElementId);
    if (!element) return;

    const assetType = event.currentTarget.dataset.assetType;

    // Open file picker
    new foundry.applications.apps.FilePicker({
      type: assetType === "audio" ? "audio" : "image",
      current: element.src || "",
      callback: (path) => {
        // Update element source
        element.src = path;

        // Update canvas
        if (this.studioCanvas) {
          this.studioCanvas.setElements(this.animatorElements);
        }

        // Re-render to update property field
        this.render();
      }
    }).render(true);
  }

  /**
   * Handle save animation as package
   */
  async _onSaveAnimation(event) {
    event.preventDefault();

    if (this.animatorElements.length === 0) {
      ui.notifications.warn("No elements to save");
      return;
    }

    try {
      // Convert animator elements to Toast package format
      const elements = this.animatorElements.map(el => {
        const baseElement = {
          type: el.type,
          id: el.id
        };

        // Add type-specific properties
        if (el.type === 'text') {
          baseElement.text = el.text || 'Text';
        } else if (el.type === 'image' || el.type === 'sound') {
          baseElement.src = el.src || '';
        }

        // Add animation properties from first keyframe
        if (el.keyframes && el.keyframes.length > 0) {
          const kf = el.keyframes[0];
          if (el.type === 'text' || el.type === 'image') {
            baseElement.animation = {
              startX: kf.properties.x || 960,
              startY: kf.properties.y || 540,
              duration: this.animationDuration / this.animationFPS
            };

            // Add visual properties
            if (el.type === 'text') {
              baseElement.fontSize = kf.properties.fontSize || 72;
              baseElement.color = kf.properties.color || '#ffffff';
              baseElement.fontWeight = kf.properties.fontWeight || 'normal';
            } else if (el.type === 'image') {
              baseElement.width = kf.properties.width || 200;
              baseElement.height = kf.properties.height || 200;
            }

            // Add transform properties
            if (kf.properties.rotation) baseElement.rotation = kf.properties.rotation;
            if (kf.properties.scale && kf.properties.scale !== 1.0) baseElement.scale = kf.properties.scale;
            if (kf.properties.opacity && kf.properties.opacity !== 1.0) baseElement.opacity = kf.properties.opacity;
          } else if (el.type === 'sound') {
            baseElement.volume = kf.properties.volume || 0.8;
          }
        }

        return baseElement;
      });

      // Create package config
      const packageConfig = {
        config: {
          elements: elements
        }
      };

      // Open package editor with this config
      const packageManager = ToastManager.packageManager;
      if (!packageManager) {
        ui.notifications.error("Package manager not initialized");
        return;
      }

      // Show package editor with pre-populated config
      PackageEditorDialog.show(packageConfig, packageManager);

      ui.notifications.info("Opening package editor with your animation");

    } catch (err) {
      console.error("Toast Studio | Failed to save animation:", err);
      ui.notifications.error(`Failed to save animation: ${err.message}`);
    }
  }

  /**
   * Handle preview animation
   */
  async _onPreviewAnimation(event) {
    event.preventDefault();

    if (this.animatorElements.length === 0) {
      ui.notifications.warn("No elements to preview");
      return;
    }

    try {
      // Convert to Toast elements and show locally
      const elements = this.animatorElements.map(el => {
        const baseElement = {
          type: el.type,
          id: el.id
        };

        if (el.type === 'text') {
          baseElement.text = el.text || 'Text';
        } else if (el.type === 'image' || el.type === 'sound') {
          baseElement.src = el.src || '';
        }

        if (el.keyframes && el.keyframes.length > 0) {
          const kf = el.keyframes[0];
          if (el.type === 'text' || el.type === 'image') {
            baseElement.animation = {
              startX: kf.properties.x || 960,
              startY: kf.properties.y || 540,
              duration: this.animationDuration / this.animationFPS
            };

            if (el.type === 'text') {
              baseElement.fontSize = kf.properties.fontSize || 72;
              baseElement.color = kf.properties.color || '#ffffff';
              baseElement.fontWeight = kf.properties.fontWeight || 'normal';
            } else if (el.type === 'image') {
              baseElement.width = kf.properties.width || 200;
              baseElement.height = kf.properties.height || 200;
            }

            if (kf.properties.rotation) baseElement.rotation = kf.properties.rotation;
            if (kf.properties.scale && kf.properties.scale !== 1.0) baseElement.scale = kf.properties.scale;
            if (kf.properties.opacity && kf.properties.opacity !== 1.0) baseElement.opacity = kf.properties.opacity;
          } else if (el.type === 'sound') {
            baseElement.volume = kf.properties.volume || 0.8;
          }
        }

        return baseElement;
      });

      // Show locally (GM only)
      if (game.toast && game.toast.showLocal) {
        await game.toast.showLocal(elements);
        ui.notifications.info("Previewing animation locally");
      } else {
        ui.notifications.error("Toast Player not available");
      }

    } catch (err) {
      console.error("Toast Studio | Failed to preview animation:", err);
      ui.notifications.error(`Failed to preview animation: ${err.message}`);
    }
  }

  /**
   * Handle clear animation
   */
  async _onClearAnimation(event) {
    event.preventDefault();

    if (this.animatorElements.length === 0) return;

    const confirmed = await Dialog.confirm({
      title: "Clear Animation",
      content: "<p>Are you sure you want to clear all elements?</p><p>This action cannot be undone.</p>",
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (confirmed) {
      this.animatorElements = [];
      this.selectedElementId = null;
      this.nextElementId = 1;

      // Clear canvas
      if (this.studioCanvas) {
        this.studioCanvas.clear();
      }

      this.render();
      ui.notifications.info("Animation cleared");
    }
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
