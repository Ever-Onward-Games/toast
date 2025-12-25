/**
 * Toast Studio - Animation Studio and Package Manager
 * Entry point and hooks
 * Requires: toast-player module
 */

// Preload template partials on init
Hooks.once('init', async () => {
  console.log('Toast Studio | Preloading templates...');

  const partials = [
    "modules/toast-studio/templates/partials/assets-tab.hbs",
    "modules/toast-studio/templates/partials/directories-subtab.hbs",
    "modules/toast-studio/templates/partials/audio-subtab.hbs",
    "modules/toast-studio/templates/partials/images-subtab.hbs",
    "modules/toast-studio/templates/partials/directory-item.hbs",
    "modules/toast-studio/templates/partials/audio-asset-item.hbs",
    "modules/toast-studio/templates/partials/image-asset-item.hbs",
    "modules/toast-studio/templates/partials/packages-tab.hbs",
    "modules/toast-studio/templates/partials/package-card.hbs",
    "modules/toast-studio/templates/partials/package-editor.hbs",
    "modules/toast-studio/templates/partials/animator-tab.hbs",
    "modules/toast-studio/templates/partials/studio-tab.hbs",
    "modules/toast-studio/templates/partials/empty-state.hbs"
  ];

  try {
    await foundry.applications.handlebars.loadTemplates(partials);
    console.log('Toast Studio | Templates preloaded');
  } catch (err) {
    console.error('Toast Studio | Failed to preload templates:', err);
  }
});

// Initialize Toast Studio on Foundry ready
Hooks.once('ready', async () => {
  console.log('Toast Studio | Initializing...');

  // Verify toast-player is loaded and active
  if (!game.modules.get('toast-player')?.active) {
    console.error('Toast Studio | ERROR: toast-player module is required but not active!');
    ui.notifications.error('Toast Studio requires the Toast Player module to be enabled.');
    return;
  }

  // Verify toast API exists (from toast-player)
  if (!game.toast) {
    console.error('Toast Studio | ERROR: game.toast not found! Is toast-player loaded?');
    ui.notifications.error('Toast Studio failed to initialize. Please check that Toast Player is enabled.');
    return;
  }

  // Register studio API on game.toast
  game.toast.studio = {
    /**
     * Open Toast Studio
     * @returns {ToastStudioApp} The studio application instance
     */
    open: () => {
      return new ToastStudioApp().render(true);
    },

    /**
     * Get the current studio app instance (if open)
     * @returns {ToastStudioApp|null}
     */
    get app() {
      return Object.values(ui.windows).find(w => w instanceof ToastStudioApp) || null;
    }
  };

  // Add studio UI controls (GM only)
  if (game.user.isGM) {
    // Add Toast Studio button to scene controls
    Hooks.on('getSceneControlButtons', (controls) => {
      controls.push({
        name: 'toast-studio',
        title: 'Toast Studio',
        icon: 'fas fa-glass-cheers',
        button: true,
        onClick: () => {
          game.toast.studio.open();
        }
      });
    });
  }

  console.log('Toast Studio | Ready! Use game.toast.studio.open() to launch.');
});
