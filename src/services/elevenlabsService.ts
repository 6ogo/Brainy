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

interface VoiceCache {
  [key: string]: {
    data: any;
    timestamp: number;
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: VoiceCache = {};

const getCached = (key: string) => {
  const cached = cache[key];
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    delete cache[key];
    return null;
  }
  
  return cached.data;
};

const setCached = (key: string, data: any) => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};

export const ElevenLabsService = {
  async generateSpeech(text: string, voiceId: string) {
    const cacheKey = `speech_${voiceId}_${text}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

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
      setCached(cacheKey, audioBlob);
      return audioBlob;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  async getVoices() {
    const cacheKey = 'voices';
    const cached = getCached(cacheKey);
    if (cached) return cached;

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
      setCached(cacheKey, data.voices);
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }
};