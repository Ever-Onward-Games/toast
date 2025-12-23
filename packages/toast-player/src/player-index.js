/**
 * Toast Player - Lightweight Playback Engine
 * Entry point and hooks
 */

// Initialize settings on init
Hooks.once('init', () => {
  ToastManager.init();
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
