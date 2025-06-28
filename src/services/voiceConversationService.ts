import { ElevenLabsService } from './elevenlabsService';
import { GroqService } from './groqService';
import { SecurityUtils } from '../utils/security';
import { API_CONFIG } from '../config/api';

interface VoiceConversationConfig {
  userId: string;
  subject: string;
  avatarPersonality: string;
  difficultyLevel: string;
  onResponse?: (text: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: string) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export class VoiceConversationService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private isProcessing = false;
  private config: VoiceConversationConfig;
  private currentAudio: HTMLAudioElement | null = null;
  private isPaused = false;
  private currentTranscript = '';
  private recognitionLanguage = 'en-US';
  private stream: MediaStream | null = null;
  private processingTimeout: number | null = null;
  private maxSilenceTime = 600; // 0.6 seconds of silence before processing
  private lastSpeechTimestamp = 0;
  private silenceTimer: number | null = null;
  private noiseThreshold = 3; // Minimum characters to consider as valid speech
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;
  private audioVisualizationCallback: ((data: Uint8Array) => void) | null = null;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.config.onError?.('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.recognitionLanguage;

      this.recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        
        // Only process if transcript is longer than noise threshold
        if (transcript.length > this.noiseThreshold) {
          // Update current transcript
          this.currentTranscript = transcript;
          
          // Update last speech timestamp
          this.lastSpeechTimestamp = Date.now();
          
          // Notify about interim results for UI feedback
          this.config.onTranscript?.(transcript, lastResult.isFinal);
          
          // Clear any pending timeout
          if (this.processingTimeout) {
            clearTimeout(this.processingTimeout);
            this.processingTimeout = null;
          }
          
          // Clear any existing silence timer
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          if (lastResult.isFinal && transcript) {
            // Set a shorter delay for final results
            this.processingTimeout = window.setTimeout(() => {
              if (!this.isProcessing && transcript !== '') {
                this.handleUserSpeech(transcript);
              }
              this.processingTimeout = null;
            }, 300); // Reduced from 2000ms to 300ms for faster response
          } else {
            // Start silence detection timer
            this.silenceTimer = window.setTimeout(() => {
              const silenceDuration = Date.now() - this.lastSpeechTimestamp;
              if (silenceDuration >= this.maxSilenceTime && transcript && !this.isProcessing) {
                console.log(`Processing after silence detection (${silenceDuration}ms):`, transcript);
                this.handleUserSpeech(transcript);
              }
            }, this.maxSilenceTime);
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't show error for aborted recognition as it's often part of normal operation
        if (event.error !== 'aborted') {
          this.config.onError?.(`Speech recognition error: ${event.error}`);
        }
        
        this.isListening = false;
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
        
        // If we have a transcript but haven't processed it yet, process it now
        if (this.currentTranscript && this.currentTranscript.length > this.noiseThreshold && !this.isProcessing && !this.isPaused) {
          console.log('Processing transcript on recognition end:', this.currentTranscript);
          this.handleUserSpeech(this.currentTranscript);
          return;
        }
        
        // Restart if we're supposed to be listening continuously
        if (!this.isPaused && this.recognition && !this.isProcessing) {
          try {
            setTimeout(() => {
              if (!this.isPaused && !this.isListening && this.recognition && !this.isProcessing) {
                this.recognition.start();
                this.isListening = true;
                console.log('Restarted speech recognition');
              }
            }, 300); // Small delay to prevent rapid restarts
          } catch (error) {
            console.error('Failed to restart speech recognition:', error);
          }
        }
      };
    }
  }

  async startListening(): Promise<void> {
    if (!this.recognition || this.isListening || this.isProcessing) {
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Save the stream reference to stop it later
      this.stream = stream;
      
      // Connect to audio context for visualization if available
      if (this.audioContext && this.analyser) {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        
        // Start visualization loop
        this.startAudioVisualization();
      }
      
      this.isPaused = false;
      this.isListening = true;
      this.lastSpeechTimestamp = Date.now();
      this.recognition.start();
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.config.onError?.('Failed to access microphone. Please check your browser permissions.');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        // If we have a transcript but haven't processed it yet, process it now
        if (this.currentTranscript && this.currentTranscript.length > this.noiseThreshold && !this.isProcessing && !this.isPaused) {
          console.log('Processing transcript before stopping:', this.currentTranscript);
          this.handleUserSpeech(this.currentTranscript);
        }
        
        this.recognition.stop();
        this.isListening = false;
        console.log('Speech recognition stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Stop the media stream if it exists
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Stop audio visualization
    this.stopAudioVisualization();
    
    // Clear any pending processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    // Clear any silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  pauseConversation(): void {
    this.isPaused = true;
    this.stopListening();
    this.stopSpeaking();
    
    // Clear any pending processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    // Clear any silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    console.log('Conversation paused');
  }

  resumeConversation(): void {
    this.isPaused = false;
    this.startListening();
    console.log('Conversation resumed');
  }

  stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.config.onAudioEnd?.();
    }
    
    // Also stop any browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  setLanguage(languageCode: string): void {
    this.recognitionLanguage = languageCode;
    if (this.recognition) {
      this.recognition.lang = languageCode;
      console.log(`Speech recognition language set to: ${languageCode}`);
    }
  }

  // Set the silence threshold for pause detection
  setSilenceThreshold(milliseconds: number): void {
    if (milliseconds >= 300 && milliseconds <= 2000) {
      this.maxSilenceTime = milliseconds;
      console.log(`Silence threshold set to ${milliseconds}ms`);
    } else {
      console.error('Silence threshold must be between 300ms and 2000ms');
    }
  }

  // Set callback for audio visualization data
  setAudioVisualizationCallback(callback: (data: Uint8Array) => void): void {
    this.audioVisualizationCallback = callback;
  }

  // Start audio visualization loop
  private startAudioVisualization(): void {
    if (!this.analyser || !this.audioDataArray || !this.audioVisualizationCallback) return;
    
    const updateVisualization = () => {
      if (!this.isListening || !this.analyser || !this.audioDataArray) return;
      
      this.analyser.getByteFrequencyData(this.audioDataArray);
      this.audioVisualizationCallback?.(this.audioDataArray);
      
      requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  }

  // Stop audio visualization
  private stopAudioVisualization(): void {
    // Nothing to do here, the loop will stop when isListening is false
  }

  /**
   * Handles the user's speech input by processing the transcript, generating an AI response,
   * and converting it to speech.
   * 
   * @param transcript - The user's speech input as a string.
   */  
  private async handleUserSpeech(transcript: string): Promise<void> {
    if (this.isProcessing || this.isPaused || transcript.length <= this.noiseThreshold) {
      return;
    }

    try {
      this.isProcessing = true;
      console.log('Processing speech input:', transcript);
      
      // Sanitize input
      const sanitizedTranscript = SecurityUtils.sanitizeInput(transcript);
      if (!SecurityUtils.validateInput(sanitizedTranscript, 2000)) {
        throw new Error('Invalid speech input');
      }

      // Generate AI response
      let aiResponse;
      if (!API_CONFIG.GROQ_API_KEY) {
        aiResponse = `I heard you say: "${sanitizedTranscript}". However, I'm currently operating in fallback mode because the AI service is not fully configured. Please check your API keys in the .env file.`;
      } else {
        aiResponse = await GroqService.generateResponse(
          sanitizedTranscript,
          this.config.subject,
          this.config.avatarPersonality,
          this.config.difficultyLevel,
          this.config.userId
        );
      }

      // Notify about text response
      this.config.onResponse?.(aiResponse);

      // Generate and play speech
      this.config.onAudioStart?.();
      
      let audioBlob;
      try {
        // Test audio output before generating speech
        await this.testAudioOutput();
        
        if (!API_CONFIG.ELEVENLABS_API_KEY) {
          // Use fallback if ElevenLabs API key is not configured
          audioBlob = await this.createFallbackAudio(aiResponse);
          console.log('Using fallback speech generation');
        } else {
          audioBlob = await ElevenLabsService.generateSpeech(aiResponse, this.config.avatarPersonality);
          console.log('Speech generated successfully, blob size:', audioBlob?.size);
        }
        
        if (audioBlob) {
          await this.playAudio(audioBlob);
        }
      } catch (audioError) {
        console.error('Audio generation or playback error:', audioError);
        // Use browser's speech synthesis as fallback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiResponse);
          utterance.rate = 1;
          utterance.pitch = 1;
          utterance.volume = 1;
          
          window.speechSynthesis.speak(utterance);
          
          // Wait for speech to complete
          return new Promise<void>((resolve) => {
            utterance.onend = () => {
              this.config.onAudioEnd?.();
              resolve();
            };
            
            // Fallback timeout in case onend doesn't fire
            setTimeout(() => {
              this.config.onAudioEnd?.();
              resolve();
            }, aiResponse.length * 50); // Rough estimate of speech duration
          });
        }
      } finally {
        this.config.onAudioEnd?.();
      }
    } catch (error) {
      console.error('Error in voice conversation:', error);
      this.config.onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.isProcessing = false;
      this.currentTranscript = '';
      
      // Restart listening if in continuous mode and not paused
      if (!this.isPaused && !this.isListening && this.recognition) {
        setTimeout(() => {
          this.startListening();
        }, 500);
      }
    }
  }

  // Test audio output before playing
  private async testAudioOutput(): Promise<void> {
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

  private async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio();
        
        // Set up event handlers before setting the source
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };
        
        audio.onerror = (event) => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          const errorEvent = event as Event;
          const errorTarget = errorEvent.currentTarget as HTMLAudioElement;
          const errorMessage = errorTarget && errorTarget.error 
            ? `Audio error: ${errorTarget.error?.message || 'Unknown audio error'}`
            : 'Failed to play audio: Unknown error';
          reject(new Error(errorMessage));
        };
        
        // Set the source and load the audio
        audio.src = audioUrl;
        this.currentAudio = audio;
        
        // Play the audio
        audio.play().catch((playError) => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          const errorMessage = playError instanceof Error 
            ? `Audio playback failed: ${playError.message}`
            : 'Audio playback failed: Unknown error';
          reject(new Error(errorMessage));
        });
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? `Audio setup failed: ${error.message}`
          : 'Audio setup failed: Unknown error';
        reject(new Error(errorMessage));
      }
    });
  }

  // Create fallback audio for when ElevenLabs is not available
  private async createFallbackAudio(text: string): Promise<Blob> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en-') && voice.localService
        ) || voices.find(voice => 
          voice.lang.startsWith('en-')
        ) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        // Customize based on personality
        switch (this.config.avatarPersonality) {
          case 'encouraging-emma':
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            break;
          case 'challenge-charlie':
            utterance.rate = 1.1;
            utterance.pitch = 0.9;
            break;
          case 'fun-freddy':
            utterance.rate = 1.2;
            utterance.pitch = 1.2;
            break;
          default:
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
        }
        
        // Create a minimal WAV header for silent audio
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
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        // Return the silent audio blob
        resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
      } else {
        // If speech synthesis is not available, return an empty blob
        resolve(new Blob([], { type: 'audio/wav' }));
      }
    });
  }

  isActive(): boolean {
    return this.isListening || this.isProcessing;
  }

  isPauseActive(): boolean {
    return this.isPaused;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  // Force submit current transcript
  forceSubmitTranscript(): void {
    if (this.currentTranscript && this.currentTranscript.length > this.noiseThreshold && !this.isProcessing) {
      // Clear any pending timeout
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
        this.processingTimeout = null;
      }
      
      // Clear any silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      
      // Process the transcript
      this.handleUserSpeech(this.currentTranscript);
    }
  }

  // Get audio visualization data
  getAudioVisualizationData(): Uint8Array | null {
    if (this.analyser && this.audioDataArray) {
      this.analyser.getByteFrequencyData(this.audioDataArray);
      return this.audioDataArray;
    }
    return null;
  }
}