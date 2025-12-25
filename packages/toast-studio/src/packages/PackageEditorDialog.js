/**
 * Package Editor Dialog
 * Create or edit toast packages
 */
class PackageEditorDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * Create a new PackageEditorDialog
   * @param {Package|null} packageData - Package to edit (null for new)
   * @param {PackageManager} packageManager - Package manager instance
   * @param {Object} options - Application options
   */
  constructor(packageData = null, packageManager, options = {}) {
    super(options);

    this.packageManager = packageManager;
    this.isNew = !packageData;

    // Clone package data to avoid mutating original
    if (packageData) {
      // Handle both Package instances (with toJSON) and plain objects
      const data = typeof packageData.toJSON === 'function'
        ? packageData.toJSON()
        : packageData;
      this.packageData = foundry.utils.deepClone(data);
    } else {
      // Create new package with defaults
      this.packageData = {
        name: "",
        description: "",
        version: "1.0.0",
        category: "custom",
        tags: [],
        thumbnail: "",
        scope: "world",
        config: { elements: [] },
        tokens: {}
      };
    }

    // Track if form has been modified
    this.modified = false;
  }

  /**
   * ApplicationV2 configuration
   */
  static DEFAULT_OPTIONS = {
    id: "package-editor-dialog",
    classes: ["toast-studio", "package-editor"],
    tag: "form",
    form: {
      handler: PackageEditorDialog.#onSubmit,
      closeOnSubmit: false,
      submitOnChange: false
    },
    window: {
      title: "Package Editor",
      resizable: true
    },
    position: {
      width: 600,
      height: "auto"
    },
    actions: {}
  };

  static PARTS = {
    form: {
      template: "modules/toast-studio/templates/partials/package-editor.hbs"
    }
  };

  /**
   * Get dialog title
   */
  get title() {
    return this.isNew ? "Create New Package" : `Edit Package: ${this.packageData.name}`;
  }

  /**
   * Handle form submission
   */
  static async #onSubmit(event, form, formData) {
    // Form submission not used - we use custom save button
  }

  /**
   * Prepare context data for rendering
   */
  async _prepareContext(options) {
    const data = {};

    data.isNew = this.isNew;
    data.package = this.packageData;

    // Category options
    data.categories = [
      { value: "combat", label: "Combat", selected: this.packageData.category === "combat" },
      { value: "social", label: "Social", selected: this.packageData.category === "social" },
      { value: "exploration", label: "Exploration", selected: this.packageData.category === "exploration" },
      { value: "custom", label: "Custom", selected: this.packageData.category === "custom" }
    ];

    // Scope options
    data.scopes = [
      { value: "world", label: "World (This World Only)", selected: this.packageData.scope === "world" },
      { value: "global", label: "Global (All Worlds)", selected: this.packageData.scope === "global" }
    ];

    // Convert tags array to comma-separated string
    data.tagsString = this.packageData.tags.join(", ");

    // Token definitions
    data.tokens = Object.entries(this.packageData.tokens).map(([key, def]) => ({
      key: key,
      label: def.label || key,
      defaultValue: def.default || "",
      type: def.type || "text"
    }));

    // Element summary
    data.elementCount = this.packageData.config?.elements?.length || 0;
    data.hasElements = data.elementCount > 0;

    // Validation state
    data.canSave = this.packageData.name.trim() !== "" && data.elementCount > 0;

    return data;
  }

  /**
   * Activate event listeners
   */
  _onRender(context, options) {
    const html = $(this.element);

    // Track form changes
    html.find("input, select, textarea").on("change", () => {
      this.modified = true;
    });

    // Thumbnail picker
    html.find(".thumbnail-picker").on("click", this._onPickThumbnail.bind(this));

    // Token management
    html.find(".add-token-btn").on("click", this._onAddToken.bind(this));
    html.find(".remove-token-btn").on("click", this._onRemoveToken.bind(this));

    // Element management (placeholder for now)
    html.find(".manage-elements-btn").on("click", this._onManageElements.bind(this));

    // Form buttons
    html.find(".save-package-btn").on("click", this._onSavePackage.bind(this));
    html.find(".cancel-btn").on("click", this._onCancel.bind(this));
  }

  /**
   * Handle thumbnail picker
   */
  async _onPickThumbnail(event) {
    event.preventDefault();

    new foundry.applications.apps.FilePicker({
      type: "image",
      current: this.packageData.thumbnail || "",
      callback: (path) => {
        this.packageData.thumbnail = path;
        this.render();
      }
    }).render(true);
  }

  /**
   * Handle add token button
   */
  async _onAddToken(event) {
    event.preventDefault();

    // Prompt for token key
    const tokenKey = await new Promise((resolve) => {
      new Dialog({
        title: "Add Token",
        content: `
          <form>
            <div class="form-group">
              <label>Token Key (e.g., "playerName"):</label>
              <input type="text" name="key" placeholder="tokenKey" />
            </div>
            <div class="form-group">
              <label>Label (Display Name):</label>
              <input type="text" name="label" placeholder="Player Name" />
            </div>
            <div class="form-group">
              <label>Default Value:</label>
              <input type="text" name="default" placeholder="(optional)" />
            </div>
          </form>
        `,
        buttons: {
          add: {
            icon: '<i class="fas fa-plus"></i>',
            label: "Add Token",
            callback: (html) => {
              const key = html.find("[name='key']").val().trim();
              const label = html.find("[name='label']").val().trim();
              const defaultValue = html.find("[name='default']").val().trim();
              resolve({ key, label, defaultValue });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "add"
      }).render(true);
    });

    if (!tokenKey || !tokenKey.key) return;

    // Validate token key format (alphanumeric + underscores only)
    const keyRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!keyRegex.test(tokenKey.key)) {
      ui.notifications.error("Token key must start with a letter and contain only letters, numbers, and underscores");
      return;
    }

    // Check for duplicate
    if (this.packageData.tokens[tokenKey.key]) {
      ui.notifications.warn(`Token "${tokenKey.key}" already exists`);
      return;
    }

    // Add token
    this.packageData.tokens[tokenKey.key] = {
      label: tokenKey.label || tokenKey.key,
      default: tokenKey.defaultValue || "",
      type: "text"
    };

    this.modified = true;
    this.render();
  }

  /**
   * Handle remove token button
   */
  async _onRemoveToken(event) {
    event.preventDefault();
    const tokenKey = event.currentTarget.dataset.tokenKey;

    if (!tokenKey) return;

    // Confirm deletion
    const confirmed = await Dialog.confirm({
      title: "Remove Token",
      content: `<p>Remove token <strong>${tokenKey}</strong>?</p>`,
      yes: () => true,
      no: () => false
    });

    if (confirmed) {
      delete this.packageData.tokens[tokenKey];
      this.modified = true;
      this.render();
    }
  }

  /**
   * Handle manage elements button
   */
  async _onManageElements(event) {
    event.preventDefault();
    ui.notifications.info("Element editor coming soon! For now, use the Animator tab to create animations, or manually add elements via the API.");
    // TODO: Open element editor or animator
  }

  /**
   * Handle save package button
   */
  async _onSavePackage(event) {
    event.preventDefault();

    try {
      // Get form element and extract data
      const formElement = this.element.querySelector("form");
      const formData = new FormDataExtended(formElement).object;

      // Update package data with form values
      this.packageData.name = formData.name.trim();
      this.packageData.description = formData.description.trim();
      this.packageData.version = formData.version.trim();
      this.packageData.category = formData.category;
      this.packageData.scope = formData.scope;
      this.packageData.thumbnail = formData.thumbnail.trim();

      // Parse tags (comma-separated)
      const tagsString = formData.tags.trim();
      this.packageData.tags = tagsString
        ? tagsString.split(",").map(t => t.trim()).filter(t => t)
        : [];

      // Validate
      if (!this.packageData.name) {
        ui.notifications.error("Package name is required");
        return;
      }

      if (!this.packageData.config?.elements || this.packageData.config.elements.length === 0) {
        ui.notifications.error("Package must have at least one element. Use the Animator tab to create animations.");
        return;
      }

      // Create or update package
      let pkg;
      if (this.isNew) {
        pkg = await this.packageManager.create(this.packageData);
        ui.notifications.info(`Package "${pkg.name}" created successfully`);
      } else {
        // Get original package ID
        const originalId = this.packageData.id;
        pkg = await this.packageManager.update(originalId, this.packageData);
        ui.notifications.info(`Package "${pkg.name}" updated successfully`);
      }

      // Mark as saved
      this.modified = false;

      // Close dialog
      this.close();

      // Refresh parent window if it's ToastStudioApp
      const studioApp = Object.values(ui.windows).find(w => w instanceof ToastStudioApp);
      if (studioApp) {
        studioApp.render();
      }

    } catch (err) {
      console.error("Toast Studio | Failed to save package:", err);
      ui.notifications.error(`Failed to save package: ${err.message}`);
    }
  }

  /**
   * Handle cancel button
   */
  async _onCancel(event) {
    event.preventDefault();

    // Check if modified
    if (this.modified) {
      const confirmed = await Dialog.confirm({
        title: "Discard Changes?",
        content: "<p>You have unsaved changes. Are you sure you want to close without saving?</p>",
        yes: () => true,
        no: () => false,
        defaultYes: false
      });

      if (!confirmed) return;
    }

    this.close();
  }

  /**
   * Override close to check for unsaved changes
   */
  async close(options = {}) {
    if (this.modified && !options.force) {
      const confirmed = await Dialog.confirm({
        title: "Discard Changes?",
        content: "<p>You have unsaved changes. Are you sure you want to close without saving?</p>",
        yes: () => true,
        no: () => false,
        defaultYes: false
      });

      if (!confirmed) return;
    }

    return super.close(options);
  }

  /**
   * Static method to show the editor
   * @param {Package|null} packageData - Package to edit (null for new)
   * @param {PackageManager} packageManager - Package manager instance
   * @returns {PackageEditorDialog} Dialog instance
   */
  static show(packageData, packageManager) {
    return new PackageEditorDialog(packageData, packageManager).render(true);
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PackageEditorDialog;
}
