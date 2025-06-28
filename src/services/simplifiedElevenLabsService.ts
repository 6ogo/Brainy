import { createSilentAudioBlob, generateSpeech } from '../utils/speechSynthesisFallback';
import { VOICE_IDS } from '../constants/ai';
import { AvatarPersonality } from '../types';

export class SimplifiedElevenLabsService {
  private static apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  private static baseUrl = 'https://api.elevenlabs.io/v1';
  
  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    console.log('=== ElevenLabs Speech Generation ===');
    console.log('Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    console.log('Persona:', persona);
    console.log('API Key present:', !!this.apiKey);
    console.log('API Key length:', this.apiKey?.length || 0);
    
    // Validate inputs
    if (!text || text.trim().length === 0) {
      console.error('❌ Text cannot be empty');
      throw new Error('Text cannot be empty');
    }

    // Check if ElevenLabs is configured
    if (!this.apiKey) {
      console.log('❌ ElevenLabs API key not configured, using fallback');
      return this.useFallbackSpeech(text, persona as AvatarPersonality);
    }

    // Get voice ID for persona
    const voiceId = VOICE_IDS[persona as keyof typeof VOICE_IDS] || VOICE_IDS['encouraging-emma'];
    console.log('Voice ID:', voiceId);

    // Prepare request
    const requestBody = {
      text: text.trim(),
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;
    console.log('Request URL:', url);

    try {
      console.log('Making ElevenLabs API request...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API error response:', errorText);
        
        // Provide specific error messages
        if (response.status === 401) {
          if (errorText.includes('quota_exceeded')) {
            console.error('❌ ElevenLabs quota exceeded');
            throw new Error('ElevenLabs quota exceeded');
          } else {
            console.error('❌ ElevenLabs API key invalid');
            throw new Error('ElevenLabs API key is invalid or expired');
          }
        } else if (response.status === 429) {
          console.error('❌ ElevenLabs rate limit exceeded');
          throw new Error('ElevenLabs API rate limit exceeded');
        } else if (response.status === 422) {
          console.error('❌ ElevenLabs validation error');
          throw new Error('ElevenLabs validation error. Text may be too long or contain invalid characters.');
        } else {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      // Get the audio data
      const audioBlob = await response.blob();
      
      console.log('✅ ElevenLabs API success!');
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      console.log('Audio blob type:', audioBlob.type);
      
      if (audioBlob.size === 0) {
        console.error('❌ Received empty audio response');
        throw new Error('Received empty audio response from ElevenLabs');
      }

      if (audioBlob.size < 1000) {
        console.warn('⚠️ Received very small audio blob, might be an error');
      }

      return audioBlob;
      
    } catch (error) {
      console.error('❌ ElevenLabs API call failed:', error);
      
      // Use fallback speech synthesis
      console.log('🔄 Falling back to browser speech synthesis');
      return this.useFallbackSpeech(text, persona as AvatarPersonality);
    }
  }

  private static async useFallbackSpeech(text: string, persona?: AvatarPersonality): Promise<Blob> {
    console.log('🔊 Using browser speech synthesis fallback');
    
    try {
      // Use the browser's speech synthesis
      await generateSpeech({
        text,
        persona,
        onError: (error) => console.error('Speech synthesis error:', error)
      });
      
      // Return a silent blob for compatibility
      console.log('✅ Browser speech synthesis completed');
      return createSilentAudioBlob();
    } catch (error) {
      console.error('❌ Speech synthesis fallback failed:', error);
      return createSilentAudioBlob();
    }
  }

  // Test method to check if ElevenLabs API is working
  static async testAPI(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('❌ No API key configured');
      return false;
    }

    try {
      console.log('🧪 Testing ElevenLabs API...');
      
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      console.log('Test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ElevenLabs API is working');
        console.log('Available voices:', data.voices?.length || 0);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API test failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ ElevenLabs API test error:', error);
      return false;
    }
  }

  // Play audio blob directly (for testing)
  static async playAudioBlob(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔊 Playing audio blob:', audioBlob.size, 'bytes');
      
      if (audioBlob.size <= 1000) {
        console.log('⚠️ Audio blob is very small, might be a silent fallback blob');
        resolve();
        return;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadeddata = () => {
        console.log('✅ Audio loaded, duration:', audio.duration, 'seconds');
      };
      
      audio.onplay = () => {
        console.log('▶️ Audio playback started');
      };
      
      audio.onended = () => {
        console.log('⏹️ Audio playback ended');
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (event) => {
        console.error('❌ Audio playback error:', event);
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      
      audio.volume = 0.8;
      audio.play().catch(error => {
        console.error('❌ Audio play() failed:', error);
        URL.revokeObjectURL(audioUrl);
        reject(error);
      });
    });
  }
}

// Export for console testing
(window as any).testElevenLabs = async () => {
  const isWorking = await SimplifiedElevenLabsService.testAPI();
  if (isWorking) {
    const blob = await SimplifiedElevenLabsService.generateSpeech(
      "Hello, this is a test of the ElevenLabs voice system.", 
      "encouraging-emma"
    );
    if (blob.size > 1000) {
      await SimplifiedElevenLabsService.playAudioBlob(blob);
    }
  }
};
