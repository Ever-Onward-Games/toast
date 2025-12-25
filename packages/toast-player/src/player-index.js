/**
 * Toast Player - Lightweight Playback Engine
 * Entry point and hooks
 */

// Initialize settings and templates on init
Hooks.once('init', async () => {
  ToastManager.init();

  // Preload template partials for Toast Studio
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
    console.log('Toast Player | Template partials preloaded');
  } catch (err) {
    console.log('Toast Player | Template partials not loaded (toast-studio not installed)');
  }
});

// Initialize Toast Player on Foundry ready
Hooks.once('ready', async () => {
  console.log('Toast Player | Initializing...');

  // Set up Toast API, sockets, and package manager
  await ToastManager.ready();

  console.log('Toast Player | Ready!');
});

// Socket handling
Hooks.on('ready', () => {
  game.socket.on('module.toast-player', async (data) => {
    if (!game.toast) return;

    switch (data.action) {
      case 'play':
        await game.toast.play(data.elements, data.options);
        break;

      case 'playPackage':
        await game.toast.playPackage(data.packageId, data.tokenMap, data.options);
        break;

      default:
        console.warn(`Toast Player | Unknown socket action: ${data.action}`);
    }
  });
});
