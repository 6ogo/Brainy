import { API_CONFIG, getVoiceConfig, isElevenLabsConfigured, createFallbackResponse } from '../config/api';

export class ElevenLabsService {
  private static apiCallsInProgress = 0;
  private static maxConcurrentCalls = 3;
  private static requestQueue: Array<() => Promise<any>> = [];
  private static cache: Map<string, Blob> = new Map();
  private static cacheSize = 20; // Maximum number of cached responses
  
  static async generateSpeech(text: string, persona: string): Promise<Blob> {
    try {
      // Validate inputs
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Generate cache key
      const cacheKey = `${persona}:${text.substring(0, 100)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        console.log('Using cached audio response');
        return this.cache.get(cacheKey)!;
      }

      // Check if ElevenLabs is configured
      if (!isElevenLabsConfigured()) {
        console.log('ElevenLabs not configured, using fallback speech synthesis');
        return await createFallbackResponse('elevenlabs', text, persona) as Blob;
      }

      // Queue the request if too many are in progress
      if (this.apiCallsInProgress >= this.maxConcurrentCalls) {
        console.log('Too many API calls in progress, queueing request');
        return new Promise((resolve, reject) => {
          this.requestQueue.push(async () => {
            try {
              const result = await this.callElevenLabsAPI(text, persona);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });
      }

      // Try ElevenLabs API
      try {
        this.apiCallsInProgress++;
        const audioBlob = await this.callElevenLabsAPI(text, persona);
        
        // Cache the result
        if (audioBlob && audioBlob.size > 0) {
          this.addToCache(cacheKey, audioBlob);
        }
        
        return audioBlob;
      } catch (elevenLabsError) {
        console.warn('ElevenLabs API failed, falling back to browser speech:', elevenLabsError);
        return await createFallbackResponse('elevenlabs', text, persona) as Blob;
      } finally {
        this.apiCallsInProgress--;
        this.processQueue();
      }
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
      // Add retry logic
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
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
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('ElevenLabs API request timed out');
          }
          
          // If we've reached max retries, throw the error
          if (retries === maxRetries) {
            throw error;
          }
          
          // Otherwise, retry
          retries++;
          console.log(`Retrying ElevenLabs API call (${retries}/${maxRetries})`);
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
      
      // This should never be reached due to the throw in the loop
      throw new Error('Failed to generate speech after retries');
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Test audio output before playing
        this.testAudioOutput().then(() => {
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
        }).catch(error => {
          console.error('Audio output test failed:', error);
          reject(new Error('Audio output test failed. Please check your audio settings.'));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Test audio output before playing
  static async testAudioOutput(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create a short silent audio for testing
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Set volume to near-silent
        gainNode.gain.value = 0.01;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440; // A4 note
        oscillator.start();
        
        // Stop after 50ms
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
          resolve();
        }, 50);
      } catch (error) {
        console.error('Audio output test failed:', error);
        reject(new Error('Audio output test failed. Please check your audio settings.'));
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

  // Create a silent audio blob for compatibility
  static async createFallbackAudio(text?: string): Promise<Blob> {
    return new Promise((resolve) => {
      if (text && 'speechSynthesis' in window) {
        // Use browser's speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        window.speechSynthesis.speak(utterance);
      }
      
      // Create minimal WAV header for silent audio
      const arrayBuffer = new ArrayBuffer(44);
      const view = new DataView(arrayBuffer);
      
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      // WAV file header
      writeString(0, 'RIFF');
      view.setUint32(4, 36, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 22050, true);
      view.setUint32(28, 44100, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, 0, true);
      
      resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
    });
  }

  // Process the next request in the queue
  private static processQueue(): void {
    if (this.requestQueue.length > 0 && this.apiCallsInProgress < this.maxConcurrentCalls) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        this.apiCallsInProgress++;
        nextRequest().finally(() => {
          this.apiCallsInProgress--;
          this.processQueue();
        });
      }
    }
  }

  // Add response to cache
  private static addToCache(key: string, blob: Blob): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // Add new entry
    this.cache.set(key, blob);
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
  
  // Clear the audio cache
  static clearCache(): void {
    this.cache.clear();
    console.log('ElevenLabs audio cache cleared');
  }
}