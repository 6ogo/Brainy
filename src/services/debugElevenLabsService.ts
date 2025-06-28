// Enhanced ElevenLabs Service with Better Debugging
// src/services/debugElevenLabsService.ts

import { createSilentAudioBlob, generateSpeech } from '../utils/speechSynthesisFallback';
import { VOICE_IDS } from '../constants/ai';
import { AvatarPersonality } from '../types';

export class DebugElevenLabsService {
  private static apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  private static baseUrl = 'https://api.elevenlabs.io/v1';
  
  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    console.log('=== ENHANCED ELEVENLABS DEBUG ===');
    console.log('1. Input validation:');
    console.log('   - Text length:', text.length);
    console.log('   - Text preview:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    console.log('   - Persona:', persona);
    
    console.log('2. Environment check:');
    console.log('   - API Key present:', !!this.apiKey);
    console.log('   - API Key length:', this.apiKey?.length || 0);
    console.log('   - API Key preview:', this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET');
    
    // Enhanced validation
    if (!text || text.trim().length === 0) {
      console.error('❌ Text validation failed: empty text');
      throw new Error('Text cannot be empty');
    }

    if (!this.apiKey) {
      console.error('❌ API key validation failed');
      console.log('🔄 Using fallback speech synthesis');
      return this.useFallbackSpeech(text, persona as AvatarPersonality);
    }

    // Get voice ID for persona
    const voiceId = VOICE_IDS[persona as keyof typeof VOICE_IDS] || VOICE_IDS['encouraging-emma'];
    console.log('3. Voice configuration:');
    console.log('   - Voice ID:', voiceId);
    console.log('   - Available personas:', Object.keys(VOICE_IDS));

    // Prepare request with enhanced logging
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

    console.log('4. Request preparation:');
    console.log('   - Model:', requestBody.model_id);
    console.log('   - Voice settings:', JSON.stringify(requestBody.voice_settings, null, 2));

    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;
    console.log('   - Request URL:', url);

    // Test API connectivity first
    console.log('5. Testing API connectivity...');
    try {
      const testResponse = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      console.log('   - API connectivity test:', testResponse.status, testResponse.statusText);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('   - API test error:', errorText);
        
        if (testResponse.status === 401) {
          console.error('❌ API key is invalid or expired');
          throw new Error('ElevenLabs API key is invalid or expired');
        }
      } else {
        console.log('✅ API connectivity test passed');
      }
    } catch (connectError) {
      console.error('❌ API connectivity test failed:', connectError);
      return this.useFallbackSpeech(text, persona as AvatarPersonality);
    }

    // Make the actual request
    console.log('6. Making speech generation request...');
    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      console.log('   - Response time:', responseTime + 'ms');
      console.log('   - Response status:', response.status, response.statusText);
      console.log('   - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API error response:', errorText);
        
        // Enhanced error handling
        if (response.status === 401) {
          const error = errorText.includes('quota_exceeded') ? 
            'ElevenLabs quota exceeded' : 
            'ElevenLabs API key is invalid or expired';
          console.error('❌', error);
          throw new Error(error);
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

      // Process the audio response
      console.log('7. Processing audio response...');
      const audioBlob = await response.blob();
      
      console.log('✅ ElevenLabs API success!');
      console.log('   - Audio blob size:', audioBlob.size, 'bytes');
      console.log('   - Audio blob type:', audioBlob.type);
      
      // Enhanced validation
      if (audioBlob.size === 0) {
        console.error('❌ Received empty audio response');
        throw new Error('Received empty audio response from ElevenLabs');
      }

      if (audioBlob.size < 1000) {
        console.warn('⚠️ Received very small audio blob (' + audioBlob.size + ' bytes), might be an error');
      }

      if (!audioBlob.type || !audioBlob.type.includes('audio')) {
        console.warn('⚠️ Audio blob has unexpected type:', audioBlob.type);
      }

      // Test audio blob before returning
      console.log('8. Testing audio blob validity...');
      try {
        const testUrl = URL.createObjectURL(audioBlob);
        const testAudio = new Audio(testUrl);
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio test timeout'));
          }, 5000);
          
          testAudio.onloadeddata = () => {
            console.log('✅ Audio blob is valid, duration:', testAudio.duration + 's');
            clearTimeout(timeout);
            URL.revokeObjectURL(testUrl);
            resolve(void 0);
          };
          
          testAudio.onerror = (e) => {
            console.error('❌ Audio blob validation failed:', e);
            clearTimeout(timeout);
            URL.revokeObjectURL(testUrl);
            reject(new Error('Invalid audio blob'));
          };
        });
      } catch (testError) {
        console.error('❌ Audio blob test failed:', testError);
        // Don't throw here, return the blob anyway as it might still work
      }

      console.log('9. Returning audio blob for playback');
      return audioBlob;
      
    } catch (error) {
      console.error('❌ ElevenLabs API call failed:', error);
      
      // Use fallback speech synthesis
      console.log('🔄 Falling back to browser speech synthesis');
      return this.useFallbackSpeech(text, persona as AvatarPersonality);
    }
  }

  private static async useFallbackSpeech(text: string, persona?: AvatarPersonality): Promise<Blob> {
    console.log('=== SPEECH SYNTHESIS FALLBACK ===');
    console.log('Using browser speech synthesis for:', text.substring(0, 50) + '...');
    
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

  // Enhanced test method
  static async runDiagnostics(): Promise<void> {
    console.log('=== ELEVENLABS DIAGNOSTICS ===');
    
    // Test 1: API Key
    console.log('1. API Key Test:');
    console.log('   - Present:', !!this.apiKey);
    console.log('   - Length:', this.apiKey?.length || 0);
    
    if (!this.apiKey) {
      console.error('❌ No API key found. Please set VITE_ELEVENLABS_API_KEY in your environment.');
      return;
    }

    // Test 2: API Connectivity
    console.log('2. API Connectivity Test:');
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connectivity successful');
        console.log('   - Available voices:', data.voices?.length || 0);
      } else {
        const errorText = await response.text();
        console.error('❌ API connectivity failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ API connectivity error:', error);
    }

    // Test 3: Voice Generation
    console.log('3. Voice Generation Test:');
    try {
      const testBlob = await this.generateSpeech(
        "This is a test of the ElevenLabs voice system.",
        "encouraging-emma"
      );
      
      if (testBlob && testBlob.size > 1000) {
        console.log('✅ Voice generation successful');
        
        // Test 4: Audio Playback
        console.log('4. Audio Playback Test:');
        try {
          await this.playAudioBlob(testBlob);
          console.log('✅ Audio playback successful');
        } catch (playError) {
          console.error('❌ Audio playback failed:', playError);
        }
      } else {
        console.warn('⚠️ Voice generation returned small/fallback blob');
      }
    } catch (genError) {
      console.error('❌ Voice generation failed:', genError);
    }
  }

  // Test audio playback
  static async playAudioBlob(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔊 Testing audio playback:', audioBlob.size, 'bytes');
      
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
(window as any).debugElevenLabs = {
  test: () => DebugElevenLabsService.runDiagnostics(),
  generate: (text: string, persona: string = "encouraging-emma") => 
    DebugElevenLabsService.generateSpeech(text, persona),
  play: (blob: Blob) => DebugElevenLabsService.playAudioBlob(blob)
};
