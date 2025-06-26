import { API_CONFIG, getVoiceConfig, isElevenLabsConfigured, createFallbackResponse } from '../config/api';

export class ElevenLabsService {
  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    try {
      // Validate inputs
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Check if ElevenLabs is configured
      if (!isElevenLabsConfigured()) {
        console.log('ElevenLabs not configured, using fallback speech synthesis');
        return await createFallbackResponse('elevenlabs', text, persona) as Blob;
      }

      // Try ElevenLabs API first
      try {
        const audioBlob = await this.callElevenLabsAPI(text, persona);
        if (audioBlob && audioBlob.size > 0) {
          console.log(`ElevenLabs speech generated successfully, size: ${audioBlob.size} bytes`);
          return audioBlob;
        }
      } catch (elevenLabsError) {
        console.warn('ElevenLabs API failed, falling back to browser speech:', elevenLabsError);
      }

      // Fallback to browser speech synthesis
      console.log('Using browser speech synthesis fallback');
      return await createFallbackResponse('elevenlabs', text, persona) as Blob;

    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Final fallback to browser speech synthesis
      return await createFallbackResponse('elevenlabs', text, persona) as Blob;
    }
  }

  private static async callElevenLabsAPI(text: string, persona: string): Promise<Blob> {
    // Get voice configuration for the persona
    const voiceConfig = getVoiceConfig(persona);
    
    // Truncate text based on model capabilities
    const maxLength = voiceConfig.model === 'eleven_flash_v2_5' ? 5000 : 
                     voiceConfig.model === 'eleven_multilingual_v2' ? 2500 : 2500;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    console.log(`Calling ElevenLabs API for persona: ${persona}`);
    console.log(`Voice ID: ${voiceConfig.voiceId}, Model: ${voiceConfig.model}`);
    console.log(`Text length: ${truncatedText.length} characters`);

    const requestBody = {
      text: truncatedText.trim(),
      model_id: voiceConfig.model,
      voice_settings: voiceConfig.settings
    };

    console.log('Request settings:', JSON.stringify(voiceConfig.settings, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.ELEVENLABS_TIMEOUT);

    try {
      const response = await fetch(`${API_CONFIG.ELEVENLABS_BASE_URL}/text-to-speech/${voiceConfig.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, response.statusText, errorText);
        
        // Provide specific error messages
        if (response.status === 401) {
          throw new Error('ElevenLabs API key is invalid or expired');
        } else if (response.status === 429) {
          throw new Error('ElevenLabs API rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid request to ElevenLabs API. Check your text and voice settings.');
        } else if (response.status === 422) {
          throw new Error('ElevenLabs validation error. Text may be too long or contain invalid characters.');
        } else {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response from ElevenLabs');
      }

      console.log(`✅ ElevenLabs API success: Generated ${audioBlob.size} bytes of audio for ${persona}`);
      return audioBlob;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('ElevenLabs API request timed out');
      }
      
      throw error;
    }
  }

  static async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Only play actual audio files, not silent compatibility blobs
        if (audioBlob.size > 1000) { 
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log('Audio playback completed');
            resolve();
          };
          
          audio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl);
            console.error('Audio playback error:', e);
            reject(new Error('Failed to play audio'));
          };
          
          audio.play().catch(reject);
        } else {
          // For silent compatibility blobs, just resolve immediately 
          // (browser speech synthesis is handling the actual audio)
          console.log('Using browser speech synthesis for audio playback');
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  static isAudioSupported(): boolean {
    try {
      return !!(new Audio().canPlayType && (
        new Audio().canPlayType('audio/mpeg') || 
        'speechSynthesis' in window
      ));
    } catch {
      return 'speechSynthesis' in window;
    }
  }

  // Utility method to get available voices for debugging
  static getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }

  // Method to test voice generation
  static async testVoice(persona: string, testText: string = "Hello, this is a voice test."): Promise<boolean> {
    try {
      console.log(`Testing voice for persona: ${persona}`);
      const audioBlob = await this.generateSpeech(testText, persona);
      console.log(`Voice test successful: ${audioBlob.size} bytes generated`);
      return true;
    } catch (error) {
      console.error(`Voice test failed for ${persona}:`, error);
      return false;
    }
  }

  // Method to get voice information
  static getVoiceInfo(persona: string) {
    const config = getVoiceConfig(persona);
    return {
      persona,
      voiceId: config.voiceId,
      model: config.model,
      description: config.description,
      settings: config.settings
    };
  }

  // Method to check ElevenLabs API status
  static async checkApiStatus(): Promise<boolean> {
    if (!isElevenLabsConfigured()) {
      console.log('ElevenLabs API key not configured');
      return false;
    }

    try {
      // Try a simple API call to check if the key works
      const response = await fetch(`${API_CONFIG.ELEVENLABS_BASE_URL}/voices`, {
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
        },
      });

      if (response.ok) {
        console.log('✅ ElevenLabs API is working');
        return true;
      } else {
        console.warn(`❌ ElevenLabs API check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.warn('❌ ElevenLabs API check failed:', error);
      return false;
    }
  }
}