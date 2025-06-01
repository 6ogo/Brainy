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
  private static API_URL = 'https://api.elevenlabs.io/v1';
  private static DEFAULT_MODEL = 'eleven_monolingual_v1';

  static async generateSpeech(text: string, voiceId: string): Promise<Blob> {
    try {
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

  static async getVoice(voiceId: string): Promise<Voice> {
    try {
      const response = await fetch(`${this.API_URL}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voice:', error);
      throw error;
    }
  }
}