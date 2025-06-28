import { createSilentAudioBlob, generateSpeech } from '../utils/speechSynthesisFallback';
import { VOICE_IDS, VOICE_SETTINGS, API_TIMEOUTS, RETRY_CONFIG, ERROR_MESSAGES } from '../constants/ai';
import { AvatarPersonality } from '../types';

interface VoiceConfig {
  voiceId: string;
  model: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  description: string;
}

export class ElevenLabsService {
  private static apiCallsInProgress = 0;
  private static maxConcurrentCalls = 3;
  private static requestQueue: Array<() => Promise<any>> = [];
  private static cache: Map<string, Blob> = new Map();
  private static cacheSize = 20; // Maximum number of cached responses
  private static quotaExceeded = false;
  private static lastQuotaCheckTime = 0;
  private static quotaCheckInterval = 5 * 60 * 1000; // 5 minutes
  private static apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  private static baseUrl = 'https://api.elevenlabs.io/v1';
  
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
      if (!this.isElevenLabsConfigured()) {
        console.log('ElevenLabs not configured, using fallback speech synthesis');
        return this.useSpeechSynthesisFallback(text, persona as AvatarPersonality);
      }
      
      // If quota was exceeded recently, use fallback directly without trying API
      const now = Date.now();
      if (this.quotaExceeded && (now - this.lastQuotaCheckTime) < this.quotaCheckInterval) {
        console.log('Quota exceeded recently, using fallback directly');
        return this.useSpeechSynthesisFallback(text, persona as AvatarPersonality);
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
        
        // Reset quota exceeded flag if successful
        if (this.quotaExceeded) {
          this.quotaExceeded = false;
          console.log('ElevenLabs API quota appears to be restored');
        }
        
        // Cache the result
        if (audioBlob && audioBlob.size > 0) {
          this.addToCache(cacheKey, audioBlob);
        }
        
        return audioBlob;
      } catch (elevenLabsError) {
        console.warn('ElevenLabs API failed:', elevenLabsError);
        
        // Check if error is due to quota exceeded
        if (elevenLabsError instanceof Error && 
            (elevenLabsError.message.includes('quota_exceeded') || 
             elevenLabsError.message.includes('rate limit'))) {
          // Mark quota as exceeded and record time
          this.quotaExceeded = true;
          this.lastQuotaCheckTime = now;
          console.log('ElevenLabs quota exceeded, will use fallback for next 5 minutes');
        }
        
        // Use browser's speech synthesis as fallback
        return this.useSpeechSynthesisFallback(text, persona as AvatarPersonality);
      } finally {
        this.apiCallsInProgress--;
        this.processQueue();
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Final fallback to browser speech synthesis
      return this.useSpeechSynthesisFallback(text, persona as AvatarPersonality);
    }
  }

  private static async callElevenLabsAPI(text: string, persona: string): Promise<Blob> {
    // Get voice configuration for the persona
    const voiceConfig = this.getVoiceConfig(persona);
    
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
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.ELEVENLABS);

    try {
      // Add retry logic
      let retries = 0;
      const maxRetries = RETRY_CONFIG.MAX_RETRIES;
      
      while (retries <= maxRetries) {
        try {
          const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceConfig.voiceId}`, {
            method: 'POST',
            headers: {
              'xi-api-key': this.apiKey,
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
            
            // Check for quota exceeded error
            if (response.status === 401 && errorText.includes('quota_exceeded')) {
              throw new Error('quota_exceeded: ElevenLabs API quota exceeded');
            }
            
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
          
          // If quota exceeded, don't retry
          if (error instanceof Error && error.message.includes('quota_exceeded')) {
            throw error;
          }
          
          // If we've reached max retries, throw the error
          if (retries === maxRetries) {
            throw error;
          }
          
          // Otherwise, retry
          retries++;
          console.log(`Retrying ElevenLabs API call (${retries}/${maxRetries})`);
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.INITIAL_BACKOFF * Math.pow(2, retries)));
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
    if (text && 'speechSynthesis' in window) {
      // Use browser's speech synthesis
      try {
        await generateSpeech({
          text,
          onError: (error) => console.error('Speech synthesis fallback error:', error)
        });
      } catch (error) {
        console.error('Failed to use speech synthesis fallback:', error);
      }
    }
    
    return createSilentAudioBlob();
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

  // Get voice configuration for a persona
  private static getVoiceConfig(persona: string): VoiceConfig {
    const voiceId = VOICE_IDS[persona as keyof typeof VOICE_IDS] || VOICE_IDS['encouraging-emma'];
    
    return {
      voiceId,
      model: VOICE_SETTINGS.PERSONA_SETTINGS[persona as keyof typeof VOICE_SETTINGS.PERSONA_SETTINGS]?.model || 'eleven_monolingual_v1',
      settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      },
      description: `Voice for ${persona}`
    };
  }

  // Check if ElevenLabs API is configured
  static isElevenLabsConfigured(): boolean {
    return !!this.apiKey;
  }

  // Use speech synthesis fallback
  private static async useSpeechSynthesisFallback(text: string, persona?: AvatarPersonality): Promise<Blob> {
    console.log('Using speech synthesis fallback');
    
    try {
      // Use the centralized speech synthesis utility
      await generateSpeech({
        text,
        persona,
        onError: (error) => console.error('Speech synthesis fallback error:', error)
      });
      
      // Return a silent blob for compatibility with audio interfaces
      return createSilentAudioBlob();
    } catch (error) {
      console.error('Speech synthesis fallback failed:', error);
      return createSilentAudioBlob();
    }
  }

  // Method to check ElevenLabs API status
  static async checkApiStatus(): Promise<boolean> {
    if (!this.isElevenLabsConfigured()) {
      console.log('ElevenLabs API key not configured');
      return false;
    }

    try {
      // Try a simple API call to check if the key works
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (response.ok) {
        console.log('✅ ElevenLabs API is working');
        // Reset quota exceeded flag
        this.quotaExceeded = false;
        return true;
      } else {
        // Check if error is due to quota
        const errorText = await response.text();
        if (response.status === 401 && errorText.includes('quota_exceeded')) {
          this.quotaExceeded = true;
          this.lastQuotaCheckTime = Date.now();
          console.warn('❌ ElevenLabs API quota exceeded');
        } else {
          console.warn(`❌ ElevenLabs API check failed: ${response.status}`);
        }
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
  
  // Reset quota exceeded status
  static resetQuotaStatus(): void {
    this.quotaExceeded = false;
    console.log('ElevenLabs quota status reset');
  }
  
  // Get quota status
  static isQuotaExceeded(): boolean {
    return this.quotaExceeded;
  }
}