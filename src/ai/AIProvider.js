/**
 * Base class for AI text generation providers
 * Defines interface that all providers must implement
 */
class AIProvider {
  /**
   * Generate text from prompt and context
   * @param {Object} config - Generation configuration
   * @param {string} config.apiKey - API key for the provider
   * @param {string} config.model - Model to use
   * @param {string} config.prompt - User's tone/style prompt
   * @param {Object} config.context - User-defined context (actor, target, etc.)
   * @param {number} config.maxTokens - Maximum tokens to generate
   * @param {number} config.temperature - Temperature (0-2)
   * @returns {Promise<string>} Generated text
   */
  static async generate(config) {
    throw new Error("AIProvider.generate() must be implemented by subclass");
  }

  /**
   * Test if API key is valid
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(apiKey) {
    throw new Error("AIProvider.testAPIKey() must be implemented by subclass");
  }
}
