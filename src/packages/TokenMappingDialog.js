/**
 * Token Mapping Dialog Helper
 * Creates a dialog for mapping token values before launching a package
 */
class TokenMappingDialog {
  /**
   * Show token mapping dialog and launch package with mapped values
   * @param {Package} pkg - Package to launch
   * @param {PackageManager} packageManager - Package manager instance
   * @returns {Promise<void>}
   */
  static async show(pkg, packageManager) {
    if (!pkg || !packageManager) {
      throw new Error("Package and PackageManager are required");
    }

    const tokens = pkg.tokens || {};
    const tokenKeys = Object.keys(tokens);

    if (tokenKeys.length === 0) {
      // No tokens, launch directly
      await packageManager.launch(pkg.id);
      return;
    }

    // Build form HTML
    const formHtml = this._buildFormHtml(tokens);

    // Show dialog
    return new Promise((resolve, reject) => {
      new Dialog({
        title: `Launch: ${pkg.name}`,
        content: formHtml,
        buttons: {
          launch: {
            icon: '<i class="fas fa-rocket"></i>',
            label: "Launch",
            callback: async (html) => {
              try {
                // Collect token values from form
                const tokenMap = {};
                for (const key of tokenKeys) {
                  const input = html.find(`[name="token-${key}"]`);
                  tokenMap[key] = input.val() || tokens[key].default || "";
                }

                // Launch with token mapping
                await packageManager.launch(pkg.id, tokenMap);
                ui.notifications.info(`Package "${pkg.name}" launched`);
                resolve();
              } catch (err) {
                console.error("Token Mapping Dialog | Launch failed:", err);
                ui.notifications.error("Failed to launch package: " + err.message);
                reject(err);
              }
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve()
          }
        },
        default: "launch",
        render: (html) => {
          // Auto-focus first input
          html.find("input[type='text']").first().focus();
        }
      }, {
        width: 500,
        classes: ["toast-token-mapping-dialog"]
      }).render(true);
    });
  }

  /**
   * Build form HTML for token inputs
   * @param {Object} tokens - Token definitions
   * @returns {string} HTML string
   * @private
   */
  static _buildFormHtml(tokens) {
    const tokenKeys = Object.keys(tokens);

    let html = `
      <form class="token-mapping-form">
        <p class="dialog-hint">
          <i class="fas fa-info-circle"></i>
          This package uses dynamic tokens. Fill in the values below to customize the toast.
        </p>
    `;

    for (const key of tokenKeys) {
      const token = tokens[key];
      const label = token.label || key;
      const description = token.description || "";
      const defaultValue = token.default || "";
      const type = token.type || "string";

      html += `
        <div class="form-group">
          <label for="token-${key}">
            ${label}
            ${description ? `<i class="fas fa-question-circle" title="${description}"></i>` : ""}
          </label>
      `;

      // Render input based on token type
      switch (type) {
        case "number":
          html += `
            <input
              type="number"
              name="token-${key}"
              id="token-${key}"
              value="${defaultValue}"
              placeholder="${label}"
            />
          `;
          break;

        case "boolean":
          html += `
            <select name="token-${key}" id="token-${key}">
              <option value="true" ${defaultValue === "true" ? "selected" : ""}>True</option>
              <option value="false" ${defaultValue === "false" ? "selected" : ""}>False</option>
            </select>
          `;
          break;

        case "string":
        default:
          html += `
            <input
              type="text"
              name="token-${key}"
              id="token-${key}"
              value="${defaultValue}"
              placeholder="${label}"
            />
          `;
          break;
      }

      if (description) {
        html += `<small class="form-hint">${description}</small>`;
      }

      html += `</div>`;
    }

    html += `
        <div class="token-preview">
          <strong>Token Placeholders:</strong>
          <div class="token-list">
    `;

    for (const key of tokenKeys) {
      html += `<code>{{${key}}}</code>`;
    }

    html += `
          </div>
        </div>
      </form>
    `;

    return html;
  }

  /**
   * Get token values from selected tokens (if any)
   * Helper for future token picker integration
   * @param {Token[]} selectedTokens - Selected canvas tokens
   * @returns {Object} Token value suggestions
   */
  static getTokenSuggestions(selectedTokens = []) {
    if (!selectedTokens || selectedTokens.length === 0) {
      return {};
    }

    const suggestions = {};
    const token = selectedTokens[0];

    // Common token attributes that might be useful
    if (token.actor) {
      suggestions.actorName = token.actor.name;
      suggestions.characterName = token.actor.name;
      suggestions.playerName = token.actor.name;
    }

    if (token.name) {
      suggestions.tokenName = token.name;
    }

    // HP values
    if (token.actor?.system?.attributes?.hp) {
      const hp = token.actor.system.attributes.hp;
      suggestions.currentHP = hp.value;
      suggestions.maxHP = hp.max;
    }

    return suggestions;
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenMappingDialog;
}
