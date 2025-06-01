import { Voice } from 'elevenlabs-node';
import { API_CONFIG } from '../config/api';

const elevenlabs = new Voice({
  apiKey: API_CONFIG.ELEVENLABS_API_KEY
});

export const ElevenLabsService = {
  async generateSpeech(text: string, voiceId: string) {
    try {
      const audio = await elevenlabs.textToSpeech(voiceId, {
        text,
        modelId: 'eleven_monolingual_v1',
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75
        }
      });
      return audio;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  async getVoices() {
    try {
      const voices = await elevenlabs.getVoices();
      return voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }
};