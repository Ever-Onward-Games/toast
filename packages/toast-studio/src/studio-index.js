/**
 * Toast Studio - Animation Studio and Package Manager
 * Entry point and hooks
 * Requires: toast-player module
 */

// Verify toast-player is loaded
if (!game.modules.get('toast-player')?.active) {
  console.error('Toast Studio | ERROR: toast-player module is required but not active!');
  ui.notifications.error('Toast Studio requires the Toast Player module to be enabled.');
}

// Initialize Toast Studio on Foundry ready
Hooks.once('ready', async () => {
  console.log('Toast Studio | Initializing...');

  // Verify toast API exists (from toast-player)
  if (!game.toast) {
    console.error('Toast Studio | ERROR: game.toast not found! Is toast-player loaded?');
    ui.notifications.error('Toast Studio failed to initialize. Please check that Toast Player is enabled.');
    return;
  }

  // Add studio UI controls (GM only)
  if (game.user.isGM) {
    // Add Toast Studio button to sidebar
    Hooks.on('getSceneControlButtons', (controls) => {
      controls.push({
        name: 'toast-studio',
        title: 'Toast Studio',
        icon: 'fas fa-glass-cheers',
        button: true,
        onClick: () => {
          new ToastStudioApp().render(true);
        }
      });
    });
  }

  console.log('Toast Studio | Ready!');
});
