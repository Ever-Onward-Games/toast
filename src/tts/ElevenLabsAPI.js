/**
 * ElevenLabs API Wrapper
 */
class ElevenLabsAPI {
  static API_BASE = "https://api.elevenlabs.io/v1";

  /**
   * Generate TTS audio from text
   * @param {string} text - Text to convert to speech
   * @param {string} apiKey - ElevenLabs API key
   * @param {string} voiceId - Voice ID to use
   * @returns {Promise<string>} Base64 encoded audio data
   */
  static async generateTTS(text, apiKey, voiceId) {
    if (!text || !apiKey || !voiceId) {
      throw new Error("Missing required parameters: text, apiKey, or voiceId");
    }

    const url = `${this.API_BASE}/text-to-speech/${voiceId}`;

    console.log(`Toast | Generating TTS for: "${text.substring(0, 50)}..." with voice ${voiceId}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Convert response to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const audioData = `data:audio/mpeg;base64,${base64}`;
      console.log(`Toast | TTS generated successfully (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);

      return audioData;
    } catch (err) {
      console.error("Toast | ElevenLabs API error:", err);
      throw err;
    }
  }

  /**
   * Test API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  static async testAPIKey(apiKey) {
    if (!apiKey) return false;

    try {
      const response = await fetch(`${this.API_BASE}/user`, {
        headers: {
          "xi-api-key": apiKey
        }
      });
      return response.ok;
    } catch (err) {
      console.warn("Toast | API key test failed:", err);
      return false;
    }
  }
}
