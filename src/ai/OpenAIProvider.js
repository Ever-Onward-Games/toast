/**
 * OpenAI AI provider
 * Supports standard models, Custom GPTs, and fine-tuned models
 */
class OpenAIProvider extends AIProvider {
  static API_BASE = "https://api.openai.com/v1";

  /**
   * Generate text using OpenAI API
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async generate(config) {
    const { apiKey, model, prompt, context, maxTokens, temperature, mode, assistantId } = config;

    if (!apiKey || !model || !prompt) {
      throw new Error("Missing required parameters: apiKey, model, or prompt");
    }

    // Route to appropriate generation method based on mode
    if (mode === "custom-gpt" && assistantId) {
      return await this._generateWithCustomGPT(config);
    } else {
      return await this._generateWithChatCompletion(config);
    }
  }

  /**
   * Generate using standard chat completions (includes fine-tuned models)
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async _generateWithChatCompletion(config) {
    const { apiKey, model, prompt, context, maxTokens, temperature } = config;

    const systemPrompt = this._buildSystemPrompt();
    const userMessage = this._buildUserMessage(prompt, context);

    console.log(`Toast | Generating text with OpenAI model: ${model}`);

    try {
      const response = await fetch(`${this.API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens || 150,
          temperature: temperature !== undefined ? temperature : 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenAI API returned no choices");
      }

      const generatedText = data.choices[0].message.content;
      console.log(`Toast | OpenAI generated text: "${generatedText.substring(0, 100)}..."`);

      return generatedText;

    } catch (err) {
      console.error("Toast | OpenAI API error:", err);
      throw err;
    }
  }

  /**
   * Generate using Custom GPT (Assistants API)
   * @param {Object} config - Generation configuration
   * @returns {Promise<string>} Generated text
   */
  static async _generateWithCustomGPT(config) {
    const { apiKey, assistantId, prompt, context } = config;

    console.log(`Toast | Generating text with Custom GPT: ${assistantId}`);

    try {
      // Create a thread
      const threadResponse = await fetch(`${this.API_BASE}/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        throw new Error(`OpenAI Threads API error: ${threadResponse.status} - ${errorText}`);
      }

      const threadData = await threadResponse.json();
      const threadId = threadData.id;

      // Add message to thread
      const userMessage = this._buildUserMessage(prompt, context);

      await fetch(`${this.API_BASE}/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          role: "user",
          content: userMessage
        })
      });

      // Run the assistant
      const runResponse = await fetch(`${this.API_BASE}/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`OpenAI Runs API error: ${runResponse.status} - ${errorText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;

      // Poll for completion
      let run = runData;
      while (run.status === "queued" || run.status === "in_progress") {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(`${this.API_BASE}/threads/${threadId}/runs/${runId}`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2"
          }
        });

        run = await statusResponse.json();
      }

      if (run.status !== "completed") {
        throw new Error(`Assistant run failed with status: ${run.status}`);
      }

      // Get messages
      const messagesResponse = await fetch(`${this.API_BASE}/threads/${threadId}/messages`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });

      const messagesData = await messagesResponse.json();

      if (!messagesData.data || messagesData.data.length === 0) {
        throw new Error("No messages returned from assistant");
      }

      // Get the last assistant message
      const assistantMessage = messagesData.data.find(msg => msg.role === "assistant");
      if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
        throw new Error("No content in assistant message");
      }

      const generatedText = assistantMessage.content[0].text.value;
      console.log(`Toast | Custom GPT generated text: "${generatedText.substring(0, 100)}..."`);

      return generatedText;

    } catch (err) {
      console.error("Toast | Custom GPT API error:", err);
      throw err;
    }
  }

  /**
   * Test OpenAI API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid
   */
  static async testAPIKey(apiKey) {
    if (!apiKey) return false;

    try {
      // Make a minimal API call to test the key
      const response = await fetch(`${this.API_BASE}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      return response.ok;
    } catch (err) {
      console.warn("Toast | OpenAI API key test failed:", err);
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
