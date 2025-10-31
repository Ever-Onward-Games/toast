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
    data.tabs = {
      assets: {
        id: "assets",
        label: "Assets",
        icon: "fas fa-images",
        active: this.activeTab === "assets"
      },
      packages: {
        id: "packages",
        label: "Packages",
        icon: "fas fa-box",
        active: this.activeTab === "packages"
      },
      studio: {
        id: "studio",
        label: "Studio",
        icon: "fas fa-palette",
        active: this.activeTab === "studio",
        disabled: true // Disabled until Phase 4.4
      }
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
      data.packages = await this._getPackageData();
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
    // TODO: Implement in Phase 4.2
    return {
      packages: [],
      categories: ["combat", "exploration", "social", "other"]
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
    html.find(".tabs .tab").on("click", this._onTabChange.bind(this));

    // Sub-tab switching
    html.find(".assets-subtabs .subtab").on("click", this._onSubTabChange.bind(this));

    // Directory management buttons
    html.find(".add-directory-btn").on("click", this._onAddDirectory.bind(this));
    html.find(".edit-directory-btn").on("click", this._onEditDirectory.bind(this));
    html.find(".remove-directory-btn").on("click", this._onRemoveDirectory.bind(this));

    // Audio preview buttons
    html.find(".audio-preview-btn").on("click", this._onAudioPreview.bind(this));

    // Image preview buttons
    html.find(".image-preview-btn").on("click", this._onImagePreview.bind(this));

    // Use in toast buttons
    html.find(".use-asset-btn").on("click", this._onUseAsset.bind(this));

    // Refresh buttons
    html.find(".refresh-assets-btn").on("click", this._onRefreshAssets.bind(this));

    // Search input
    html.find(".asset-search").on("input", this._onSearchAssets.bind(this));

    // Filter dropdowns
    html.find(".asset-filter").on("change", this._onFilterAssets.bind(this));
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
   * Handle image preview
   */
  async _onImagePreview(event) {
    event.preventDefault();
    const imagePath = event.currentTarget.dataset.path;

    // Create image preview dialog
    new ImagePopout(imagePath, {
      title: imagePath.split("/").pop(),
      shareable: false
    }).render(true);
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
