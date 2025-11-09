/**
 * Toast Player - Lightweight Playback Engine
 * Entry point and hooks
 */

// Initialize Toast Player on Foundry ready
Hooks.once('ready', async () => {
  console.log('Toast Player | Initializing...');

  // Create global Toast API
  window.game.toast = new ToastManager();

  // Initialize package manager if available
  if (game.user.isGM) {
    try {
      await game.toast.initializePackageManager();
    } catch (err) {
      console.error('Toast Player | Failed to initialize package manager:', err);
    }
  }

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
