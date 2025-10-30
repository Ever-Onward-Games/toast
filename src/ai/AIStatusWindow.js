class AIStatusWindow {
  static currentWindow = null;

  /**
   * Show status window
   * @param {string} status - Status type: "generating", "error", "timeout", "success"
   * @param {string} message - Status message to display
   * @param {Object} options - Additional options (retry callback, fallback callback)
   */
  static show(status, message, options = {}) {
    // Close existing window
    this.close();

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "toast-ai-status";
    overlay.className = "toast-ai-status-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: "Signika", sans-serif;
    `;

    // Create window
    const window = document.createElement("div");
    window.className = "toast-ai-status-window";
    window.style.cssText = `
      background: #2a2a2a;
      border: 2px solid #555;
      border-radius: 10px;
      padding: 30px;
      min-width: 400px;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      color: #fff;
      text-align: center;
    `;

    // Icon and spinner
    let iconHtml = "";
    if (status === "generating") {
      iconHtml = `
        <div style="margin-bottom: 20px;">
          <div class="toast-spinner" style="
            border: 4px solid #444;
            border-top: 4px solid #4a9eff;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: toast-spin 1s linear infinite;
            margin: 0 auto;
          "></div>
          <style>
            @keyframes toast-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;
    } else if (status === "error") {
      iconHtml = `
        <div style="margin-bottom: 20px; font-size: 50px; color: #ff4444;">
          ⚠️
        </div>
      `;
    } else if (status === "timeout") {
      iconHtml = `
        <div style="margin-bottom: 20px; font-size: 50px; color: #ff9944;">
          ⏱️
        </div>
      `;
    } else if (status === "success") {
      iconHtml = `
        <div style="margin-bottom: 20px; font-size: 50px; color: #44ff44;">
          ✓
        </div>
      `;
    }

    // Message
    const messageHtml = `
      <div style="font-size: 18px; margin-bottom: 20px; line-height: 1.4;">
        ${message}
      </div>
    `;

    // Buttons
    let buttonsHtml = "";
    if (status === "error" || status === "timeout") {
      buttonsHtml = `
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
      `;

      if (options.onRetry) {
        buttonsHtml += `
          <button class="toast-retry-btn" style="
            background: #4a9eff;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">
            Retry
          </button>
        `;
      }

      if (options.onFallback) {
        buttonsHtml += `
          <button class="toast-fallback-btn" style="
            background: #ff9944;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">
            Use Template
          </button>
        `;
      }

      buttonsHtml += `
          <button class="toast-close-btn" style="
            background: #666;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">
            Cancel
          </button>
        </div>
      `;
    }

    // Build window content
    window.innerHTML = iconHtml + messageHtml + buttonsHtml;

    // Add event listeners for buttons
    if (status === "error" || status === "timeout") {
      const retryBtn = window.querySelector(".toast-retry-btn");
      if (retryBtn && options.onRetry) {
        retryBtn.addEventListener("click", () => {
          this.close();
          options.onRetry();
        });
      }

      const fallbackBtn = window.querySelector(".toast-fallback-btn");
      if (fallbackBtn && options.onFallback) {
        fallbackBtn.addEventListener("click", () => {
          this.close();
          options.onFallback();
        });
      }

      const closeBtn = window.querySelector(".toast-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.close();
        });
      }
    }

    overlay.appendChild(window);
    document.body.appendChild(overlay);

    this.currentWindow = overlay;

    // Auto-close success after 1 second
    if (status === "success") {
      setTimeout(() => this.close(), 1000);
    }
  }

  /**
   * Close status window
   */
  static close() {
    if (this.currentWindow) {
      this.currentWindow.remove();
      this.currentWindow = null;
    }
  }

  /**
   * Update message in existing window
   * @param {string} message - New message
   */
  static updateMessage(message) {
    if (this.currentWindow) {
      const messageDiv = this.currentWindow.querySelector("div div:nth-child(2)");
      if (messageDiv) {
        messageDiv.innerHTML = message;
      }
    }
  }
}
