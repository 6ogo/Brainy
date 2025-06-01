import { API_CONFIG } from '../config/api';

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
}

interface TextToSpeechRequest {
  text: string;
  modelId: string;
  voiceSettings: VoiceSettings;
}

export const ElevenLabsService = {
  async generateSpeech(text: string, voiceId: string) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        } as TextToSpeechRequest)
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return audioBlob;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  async getVoices() {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }
};