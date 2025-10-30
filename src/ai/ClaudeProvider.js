/**
 * Claude (Anthropic) AI provider
 * Supports standard models and prompt caching
 */
class ClaudeProvider extends AIProvider {
  static API_BASE = "https://api.anthropic.com/v1";
  static API_VERSION = "2023-06-01";

  /**
   * Generate text using Claude API
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async generate(config) {
    const { apiKey, model, prompt, context, maxTokens, temperature } = config;

    if (!apiKey || !model || !prompt) {
      throw new Error("Missing required parameters: apiKey, model, or prompt");
    }

    // Build system prompt
    const systemPrompt = this._buildSystemPrompt();

    // Build user message with context
    const userMessage = this._buildUserMessage(prompt, context);

    console.log(`Toast | Generating text with Claude model: ${model}`);

    try {
      const response = await fetch(`${this.API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.API_VERSION
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens || 150,
          temperature: temperature !== undefined ? temperature : 0.7,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error("Claude API returned no content");
      }

      const generatedText = data.content[0].text;
      console.log(`Toast | Claude generated text: "${generatedText.substring(0, 100)}..."`);

      return generatedText;

    } catch (err) {
      console.error("Toast | Claude API error:", err);
      throw err;
    }
  }

  /**
   * Test Claude API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(apiKey) {
    if (!apiKey) return false;

    try {
      // Make a minimal API call to test the key
      const response = await fetch(`${this.API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.API_VERSION
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 10,
          messages: [
            { role: "user", content: "Hi" }
          ]
        })
      });

      return response.ok;
    } catch (err) {
      console.warn("Toast | Claude API key test failed:", err);
      return false;
    }
  }

  /**
   * Build system prompt that explains the task
   * @returns {string} System prompt
   */
  static _buildSystemPrompt() {
    return `You are a narrator for a tabletop RPG game. Generate a single dramatic announcement (1-2 sentences, under 200 characters) based on the game context provided. Follow the user's tone/style instructions exactly. Do not add commentary, explanations, or extra text - just the announcement itself.`;
  }

  /**
   * Build user message with prompt and context
   * @param {string} prompt - User's tone/style prompt
   * @param {Object} context - User-defined context
   * @returns {string} Formatted user message
   */
  static _buildUserMessage(prompt, context) {
    let message = `${prompt}\n\n`;
    message += `Game Context:\n`;
    message += JSON.stringify(context, null, 2);
    message += `\n\nGenerate the announcement now:`;
    return message;
  }
}
