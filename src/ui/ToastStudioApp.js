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
    return {
      audioFiles: await this._listAudioFiles(),
      imageFiles: await this._listImageFiles(),
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
   * Activate event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Tab switching
    html.find(".tabs .tab").on("click", this._onTabChange.bind(this));

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
   * Handle audio preview
   */
  async _onAudioPreview(event) {
    event.preventDefault();
    const audioPath = event.currentTarget.dataset.path;

    // Stop any currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Play the audio
    try {
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.volume = game.settings.get("toast", "asset-preview-volume") || 0.5;
      await this.currentAudio.play();

      ui.notifications.info(`Playing: ${audioPath.split("/").pop()}`);
    } catch (err) {
      console.error("Toast Studio | Error playing audio:", err);
      ui.notifications.error("Failed to play audio file");
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
      const category = $item.data("category")?.toString().toLowerCase() || "";

      if (category.includes(filterValue)) {
        $item.show();
      } else {
        $item.hide();
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
    // Stop any playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    return super.close(options);
  }
}
