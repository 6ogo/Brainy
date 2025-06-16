import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabase';

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
  private static DEFAULT_MODEL = 'eleven_monolingual_v1';

  // Voice IDs for our personas
  private static VOICE_IDS = {
    'encouraging-emma': 'EXAVITQu4vr4xnSDxMaL',
    'challenge-charlie': 'VR6AewLTigWG4xSOukaG',
    'fun-freddy': 'pNInz6obpgDQGcFmaJgB',
    'professor-patricia': 'ThT5KcBeYPX3keUQqHPh',
    'buddy-ben': 'yoZ06aMxZJJ28mfd3POQ'
  };

  /**
   * Returns the ElevenLabs voice ID for a given persona key.
   * @param persona The persona key (e.g., 'encouraging-emma')
   * @returns The corresponding voice ID string, or undefined if not found.
   */
  static getVoiceId(persona: string): string | undefined {
    return this.VOICE_IDS[persona as keyof typeof this.VOICE_IDS];
  }

  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    try {
      // Check if API key is configured
      if (!API_CONFIG.ELEVENLABS_API_KEY) {
        console.error('ElevenLabs API key not configured');
        throw new Error('Voice service not configured');
      }
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Validate inputs
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (text.length > 5000) {
        throw new Error('Text is too long for speech generation');
      }

      // Get voice ID for persona
      const voiceId = this.getVoiceId(persona) || this.VOICE_IDS['encouraging-emma'];
      
      // Direct API call for development/testing when no edge function is available
      if (process.env.NODE_ENV === 'development' && !supabase.supabaseUrl.includes('functions')) {
        console.log('Using direct ElevenLabs API call for development');
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: this.DEFAULT_MODEL,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
        }

        return await response.blob();
      }

      // Use our secure edge function to proxy the request to ElevenLabs
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/elevenlabs-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          persona
        })
      });

      if (!response.ok) {
        let errorMessage = `ElevenLabs API error: ${response.status}`;
        
        try {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error, use the status text
          errorMessage = `${errorMessage} - ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      
      // Validate that we received audio data
      if (blob.size === 0) {
        throw new Error('Received empty audio response');
      }

      return blob;
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          throw new Error('Premium subscription required for voice features');
        } else if (error.message.includes('429')) {
          throw new Error('Voice generation rate limit exceeded. Please try again later.');
        } else if (error.message.includes('500')) {
          throw new Error('Voice service temporarily unavailable. Please try again later.');
        } else if (error.message.includes('not configured')) {
          throw new Error('Voice service not configured');
        }
      }
      
      throw error;
    }
  }

  /**
   * Play audio from a blob
   */
  static async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (event) => {
          URL.revokeObjectURL(audioUrl);
          const errorMessage = event.target && (event.target as HTMLAudioElement).error 
            ? `Audio error: ${(event.target as HTMLAudioElement).error?.message || 'Unknown audio error'}`
            : 'Failed to play audio: Unknown error';
          reject(new Error(errorMessage));
        };
        
        audio.oncanplaythrough = () => {
          audio.play().catch((playError) => {
            URL.revokeObjectURL(audioUrl);
            const errorMessage = playError instanceof Error 
              ? `Audio playback failed: ${playError.message}`
              : 'Audio playback failed: Unknown error';
            reject(new Error(errorMessage));
          });
        };
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
          if (audio.readyState < 3) { // HAVE_FUTURE_DATA
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Audio loading timeout'));
          }
        }, 10000);
        
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? `Audio setup failed: ${error.message}`
          : 'Audio setup failed: Unknown error';
        reject(new Error(errorMessage));
      }
    });
  }

  /**
   * Check if audio playback is supported
   */
  static isAudioSupported(): boolean {
    try {
      const audio = new Audio();
      return !!(audio.canPlayType && audio.canPlayType('audio/mpeg'));
    } catch {
      return false;
    }
  }
}