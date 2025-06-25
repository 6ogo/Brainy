import { API_CONFIG } from '../config/api';

export class ElevenLabsService {
  private static DEFAULT_MODEL = 'eleven_monolingual_v1';

  // Voice IDs for our personas - using real ElevenLabs voice IDs
  private static VOICE_IDS = {
    'encouraging-emma': 'EXAVITQu4vr4xnSDxMaL', // Bella - warm female voice
    'challenge-charlie': 'VR6AewLTigWG4xSOukaG', // Josh - confident male voice  
    'fun-freddy': 'pNInz6obpgDQGcFmaJgB', // Adam - energetic male voice
    'default': 'EXAVITQu4vr4xnSDxMaL'
  };

  static getVoiceId(persona: string): string {
    return this.VOICE_IDS[persona as keyof typeof this.VOICE_IDS] || this.VOICE_IDS['default'];
  }

  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    try {
      // Validate inputs
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (!API_CONFIG.ELEVENLABS_API_KEY) {
        console.warn('ElevenLabs API key not configured, using fallback');
        return await this.createFallbackAudio(text);
      }

      // Truncate text if too long
      const truncatedText = text.length > 2500 ? text.substring(0, 2500) + '...' : text;
      const voiceId = this.getVoiceId(persona);

      console.log(`Generating speech for persona: ${persona}, voice: ${voiceId}`);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: truncatedText.trim(),
          model_id: this.DEFAULT_MODEL,
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Invalid ElevenLabs API key');
        } else if (response.status === 429) {
          throw new Error('ElevenLabs API rate limit exceeded');
        } else {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }

      console.log(`Speech generated successfully, size: ${audioBlob.size} bytes`);
      return audioBlob;

    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Return fallback audio instead of throwing
      return await this.createFallbackAudio(text);
    }
  }

  static async createFallbackAudio(text?: string): Promise<Blob> {
    return new Promise((resolve) => {
      try {
        // Use browser's speech synthesis as primary fallback
        if ('speechSynthesis' in window && text) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          
          // Find a good English voice
          const voices = window.speechSynthesis.getVoices();
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && !voice.name.includes('Google')
          ) || voices.find(voice => voice.lang.startsWith('en'));
          
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
          
          // Speak the text
          window.speechSynthesis.speak(utterance);
        }

        // Create a minimal audio blob for the return value
        this.createSilentAudioBlob().then(resolve);
        
      } catch (error) {
        console.error('Fallback audio creation failed:', error);
        this.createSilentAudioBlob().then(resolve);
      }
    });
  }

  private static createSilentAudioBlob(): Promise<Blob> {
    return new Promise((resolve) => {
      try {
        // Create a very short silent audio blob
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const length = audioContext.sampleRate * 0.1; // 0.1 seconds
        
        // Buffer is already silent (zeros)
        
        // Convert to blob
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, audioContext.sampleRate, true);
        view.setUint32(28, audioContext.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        audioContext.close();
        resolve(blob);
      } catch (error) {
        console.error('Failed to create silent audio blob:', error);
        resolve(new Blob([], { type: 'audio/wav' }));
      }
    });
  }

  static async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Failed to play audio'));
        };
        
        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  static isAudioSupported(): boolean {
    try {
      return !!(new Audio().canPlayType && new Audio().canPlayType('audio/mpeg'));
    } catch {
      return false;
    }
  }
}