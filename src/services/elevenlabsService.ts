import { API_CONFIG } from '../config/api';

interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface TextToSpeechRequest {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}

export class ElevenLabsService {
  /**
   * Returns the ElevenLabs voice ID for a given persona key.
   * @param persona The persona key (e.g., 'encouraging-emma')
   * @returns The corresponding voice ID string, or undefined if not found.
   */
  static getVoiceId(persona: string): string | undefined {
    return this.VOICE_IDS[persona as keyof typeof this.VOICE_IDS];
  }
  private static API_URL = 'https://api.elevenlabs.io/v1';
  private static DEFAULT_MODEL = 'eleven_monolingual_v1';

  // Voice IDs for our personas
  private static VOICE_IDS = {
    'encouraging-emma': 'EXAVITQu4vr4xnSDxMaL',
    'challenge-charlie': 'VR6AewLTigWG4xSOukaG',
    'fun-freddy': 'pNInz6obpgDQGcFmaJgB',
    'professor-patricia': 'ThT5KcBeYPX3keUQqHPh',
    'buddy-ben': 'yoZ06aMxZJJ28mfd3POQ'
  };

  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    try {
      const voiceId = this.VOICE_IDS[persona as keyof typeof this.VOICE_IDS];
      if (!voiceId) {
        throw new Error('Invalid persona');
      }

      const response = await fetch(`${this.API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: this.DEFAULT_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        } as TextToSpeechRequest)
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  static async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${this.API_URL}/voices`, {
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
}