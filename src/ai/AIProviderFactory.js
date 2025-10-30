/**
 * Factory for creating AI provider instances
 */
class AIProviderFactory {
  /**
   * Get the appropriate AI provider class based on provider name
   * @param {string} provider - Provider name ("claude" or "openai")
   * @returns {Class} Provider class
   */
  static getProvider(provider) {
    switch (provider.toLowerCase()) {
      case "claude":
        return ClaudeProvider;
      case "openai":
        return OpenAIProvider;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  /**
   * Generate text using the specified provider
   * @param {string} provider - Provider name
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async generate(provider, config) {
    const ProviderClass = this.getProvider(provider);
    return await ProviderClass.generate(config);
  }

  /**
   * Test API key for the specified provider
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(provider, apiKey) {
    const ProviderClass = this.getProvider(provider);
    return await ProviderClass.testAPIKey(apiKey);
  }
}
