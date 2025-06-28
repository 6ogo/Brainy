import { generateSpeech } from '../utils/speechSynthesisFallback';
import { ElevenLabsService } from './elevenlabsService';
import { GroqService } from './groqService';
import { SecurityUtils } from '../utils/security';
import { ERROR_MESSAGES, VOICE_SETTINGS } from '../constants/ai';

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
  private silenceThreshold = 600; // Default 600ms of silence before processing
  private lastSpeechTimestamp = 0;
  private silenceTimer: number | null = null;
  private noiseThreshold = 3; // Minimum characters to consider as valid speech
  private feedbackPrevention = true; // Default to enabled
  private delayAfterSpeaking = 500; // 500ms delay after AI stops speaking before unmuting
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioVisualizationCallback: ((data: Uint8Array) => void) | null = null;
  private audioDataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private aiAudioFingerprint: Float32Array | null = null; // For AI audio detection
  private aiSpeakingDetector: AnalyserNode | null = null;
  private microphoneGainNode: GainNode | null = null;
  private isMicrophoneMuted = false;
  private lastProcessedTranscript = '';
  private recognitionPaused = false;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
    this.initializeAudioContext();
  }

  /**
   * Updates the configuration of the voice conversation service
   * @param newConfig Updated configuration parameters
   */
  updateConfiguration(newConfig: Partial<VoiceConversationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Voice conversation service configuration updated:', newConfig);
  }

  /**
   * Cleans up resources when the service is no longer needed
   */
  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    
    // Stop visualization loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error('Error closing audio context:', err);
      });
    }
    
    // Clear callbacks
    this.audioVisualizationCallback = null;
    
    console.log('Voice conversation service disposed');
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
        // Skip processing if microphone is muted to prevent feedback
        if (this.isMicrophoneMuted) {
          console.log('Skipping recognition result because microphone is muted');
          return;
        }
        
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
          
          // Clear any existing timeout
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
              if (!this.isProcessing && transcript !== '' && transcript !== this.lastProcessedTranscript) {
                this.lastProcessedTranscript = transcript;
                this.handleUserSpeech(transcript);
              }
              this.processingTimeout = null;
            }, 500); // Reduced from 2000ms to 500ms for faster response
          } else {
            // Start silence detection timer
            this.silenceTimer = window.setTimeout(() => {
              const silenceDuration = Date.now() - this.lastSpeechTimestamp;
              if (silenceDuration >= this.silenceThreshold && transcript && !this.isProcessing && transcript !== this.lastProcessedTranscript) {
                console.log('Processing after silence detection:', transcript);
                this.lastProcessedTranscript = transcript;
                this.handleUserSpeech(transcript);
              }
            }, this.silenceThreshold);
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
        if (this.currentTranscript && 
            this.currentTranscript.length > this.noiseThreshold && 
            !this.isProcessing && 
            !this.isPaused && 
            !this.isMicrophoneMuted && 
            this.currentTranscript !== this.lastProcessedTranscript) {
          console.log('Processing transcript on recognition end:', this.currentTranscript);
          this.lastProcessedTranscript = this.currentTranscript;
          this.handleUserSpeech(this.currentTranscript);
          return;
        }
        
        // Restart if we're supposed to be listening continuously
        if (!this.isPaused && !this.recognitionPaused && this.recognition && !this.isProcessing && !this.isMicrophoneMuted) {
          try {
            setTimeout(() => {
              if (!this.isPaused && !this.recognitionPaused && !this.isListening && this.recognition && !this.isProcessing && !this.isMicrophoneMuted) {
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

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Create a gain node for microphone control
      this.microphoneGainNode = this.audioContext.createGain();
      this.microphoneGainNode.gain.value = 1.0; // Default gain
      
      // Create an analyzer specifically for detecting AI audio
      this.aiSpeakingDetector = this.audioContext.createAnalyser();
      this.aiSpeakingDetector.fftSize = 1024;
      
      console.log('Audio context initialized successfully');
      
      // Start visualization loop
      this.startVisualization();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private startVisualization(): void {
    if (!this.analyser || !this.audioDataArray) return;
    
    const updateVisualization = () => {
      if (this.analyser && this.audioDataArray) {
        this.analyser.getByteFrequencyData(this.audioDataArray);
        
        // Call the visualization callback if set
        if (this.audioVisualizationCallback) {
          this.audioVisualizationCallback(this.audioDataArray);
        }
        
        // Continue the loop
        this.animationFrameId = requestAnimationFrame(updateVisualization);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(updateVisualization);
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
      
      // Connect microphone to audio context for visualization
      if (this.audioContext && this.analyser && this.microphoneGainNode) {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.microphoneGainNode);
        this.microphoneGainNode.connect(this.analyser);
        console.log('Audio recording started');
        
        // Detect if there's sound
        const checkForSound = () => {
          if (this.audioDataArray) {
            this.analyser?.getByteFrequencyData(this.audioDataArray);
            const average = Array.from(this.audioDataArray).reduce((sum, value) => sum + value, 0) / this.audioDataArray.length;
            
            if (average > 10) {
              console.log('Sound detected');
              return true;
            }
          }
          return false;
        };
        
        // Check for sound after a short delay
        setTimeout(() => {
          if (checkForSound()) {
            console.log('Speech started');
          }
        }, 500);
      }
      
      this.isPaused = false;
      this.recognitionPaused = false;
      this.isMicrophoneMuted = false;
      this.isListening = true;
      this.lastSpeechTimestamp = Date.now();
      this.recognition.start();
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.config.onError?.(ERROR_MESSAGES.MICROPHONE_ACCESS);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        // If we have a transcript but haven't processed it yet, process it now
        if (this.currentTranscript && 
            this.currentTranscript.length > this.noiseThreshold && 
            !this.isProcessing && 
            !this.isPaused && 
            !this.isMicrophoneMuted &&
            this.currentTranscript !== this.lastProcessedTranscript) {
          console.log('Processing transcript before stopping:', this.currentTranscript);
          this.lastProcessedTranscript = this.currentTranscript;
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

  setSilenceThreshold(milliseconds: number): void {
    if (milliseconds >= 300 && milliseconds <= 2000) {
      this.silenceThreshold = milliseconds;
      console.log(`Silence threshold set to: ${milliseconds}ms`);
    }
  }

  setFeedbackPrevention(enabled: boolean): void {
    this.feedbackPrevention = enabled;
    console.log(`Feedback prevention ${enabled ? 'enabled' : 'disabled'}`);
    
    // If enabled, set up audio fingerprinting for AI voice
    if (enabled && this.audioContext && this.aiSpeakingDetector) {
      // This would be where we'd set up more sophisticated AI voice detection
      // For now, we'll just use the simple muting approach
    }
  }

  setDelayAfterSpeaking(milliseconds: number): void {
    if (milliseconds >= 200 && milliseconds <= 1000) {
      this.delayAfterSpeaking = milliseconds;
      console.log(`Delay after speaking set to: ${milliseconds}ms`);
    }
  }

  setAudioVisualizationCallback(callback: (data: Uint8Array) => void): void {
    this.audioVisualizationCallback = callback;
  }

  forceSubmitTranscript(): void {
    if (this.currentTranscript && 
        this.currentTranscript.length > this.noiseThreshold && 
        !this.isProcessing &&
        this.currentTranscript !== this.lastProcessedTranscript) {
      console.log('Forcing transcript submission:', this.currentTranscript);
      this.lastProcessedTranscript = this.currentTranscript;
      this.handleUserSpeech(this.currentTranscript);
    }
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
      
      // Mute microphone to prevent feedback
      if (this.feedbackPrevention) {
        console.log('Feedback prevention enabled');
        this.muteRecognition();
      }
      
      // Sanitize input
      const sanitizedTranscript = SecurityUtils.sanitizeInput(transcript);
      if (!SecurityUtils.validateInput(sanitizedTranscript, 2000)) {
        throw new Error('Invalid speech input');
      }

      // Generate AI response
      let aiResponse;
      if (!import.meta.env.VITE_GROQ_API_KEY) {
        aiResponse = `I heard you say: "${sanitizedTranscript}". However, I'm currently operating in fallback mode because the AI service is not fully configured. Please check your API keys in the .env file.`;
      } else {
        aiResponse = await GroqService.generateResponse(
          sanitizedTranscript,
          this.config.subject,
          this.config.avatarPersonality,
          this.config.difficultyLevel,
          this.config.userId,
          true // Use study mode for deeper educational insights
        );
      }

      // Notify about text response
      this.config.onResponse?.(aiResponse);

      // Generate and play speech
      this.config.onAudioStart?.();
      
      let audioBlob;
      try {
        if (!import.meta.env.VITE_ELEVENLABS_API_KEY) {
          // Use fallback if ElevenLabs API key is not configured
          audioBlob = await ElevenLabsService.createFallbackAudio(aiResponse);
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
        try {
          await generateSpeech({
            text: aiResponse,
            persona: this.config.avatarPersonality as any,
            onStart: () => console.log('Browser speech synthesis started'),
            onEnd: () => {
              this.config.onAudioEnd?.();
              
              // Keep microphone muted for a short delay after AI stops speaking
              if (this.feedbackPrevention) {
                setTimeout(() => {
                  this.unmuteRecognition();
                }, this.delayAfterSpeaking);
              }
            },
            onError: (error) => console.error('Browser speech synthesis error:', error)
          });
        } catch (synthError) {
          console.error('Speech synthesis fallback failed:', synthError);
          this.config.onError?.('Voice output failed. Please check your audio settings.');
        }
      } finally {
        this.config.onAudioEnd?.();
        
        // Keep microphone muted for a short delay after AI stops speaking
        if (this.feedbackPrevention) {
          setTimeout(() => {
            this.unmuteRecognition();
            console.log('Microphone unmuted after AI finished speaking');
          }, this.delayAfterSpeaking);
        }
      }
    } catch (error) {
      console.error('Error in voice conversation:', error);
      this.config.onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.isProcessing = false;
      this.currentTranscript = '';
      
      // Restart listening if in continuous mode and not paused
      if (!this.isPaused && !this.isListening && this.recognition && !this.isMicrophoneMuted) {
        setTimeout(() => {
          this.startListening();
        }, 500);
      }
    }
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

  private muteRecognition(): void {
    // Stop recognition to prevent feedback
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        this.recognitionPaused = true;
        this.isMicrophoneMuted = true;
        console.log('Microphone muted to prevent feedback');
      } catch (error) {
        console.error('Error muting recognition:', error);
      }
    }
    
    // Also mute the microphone gain if available
    if (this.microphoneGainNode && this.audioContext) {
      // Gradually reduce gain to avoid clicks
      const currentTime = this.audioContext.currentTime;
      this.microphoneGainNode.gain.setValueAtTime(this.microphoneGainNode.gain.value, currentTime);
      this.microphoneGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
    }
  }

  private unmuteRecognition(): void {
    // Only unmute if we're not paused
    if (!this.isPaused) {
      this.isMicrophoneMuted = false;
      this.recognitionPaused = false;
      
      // Restart recognition if it was stopped
      if (this.recognition && !this.isListening) {
        try {
          this.recognition.start();
          this.isListening = true;
          console.log('Microphone unmuted after AI finished speaking');
        } catch (error) {
          console.error('Error unmuting recognition:', error);
        }
      }
      
      // Also restore microphone gain if available
      if (this.microphoneGainNode && this.audioContext) {
        // Gradually increase gain to avoid clicks
        const currentTime = this.audioContext.currentTime;
        this.microphoneGainNode.gain.setValueAtTime(0.001, currentTime);
        this.microphoneGainNode.gain.exponentialRampToValueAtTime(1.0, currentTime + 0.1);
      }
    }
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
}