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
  private maxSilenceTime = 1500; // 1.5 seconds of silence before processing
  private lastSpeechTimestamp = 0;
  private silenceTimer: number | null = null;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
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
            if (!this.isProcessing && transcript !== '') {
              this.handleUserSpeech(transcript);
            }
            this.processingTimeout = null;
          }, 500); // Reduced from 2000ms to 500ms for faster response
        } else {
          // Start silence detection timer
          this.silenceTimer = window.setTimeout(() => {
            const silenceDuration = Date.now() - this.lastSpeechTimestamp;
            if (silenceDuration >= this.maxSilenceTime && transcript && !this.isProcessing) {
              console.log('Processing after silence detection:', transcript);
              this.handleUserSpeech(transcript);
            }
          }, this.maxSilenceTime);
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
        if (this.currentTranscript && !this.isProcessing && !this.isPaused) {
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
        if (this.currentTranscript && !this.isProcessing && !this.isPaused) {
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

  /**
   * Handles the user's speech input by processing the transcript, generating an AI response,
   * and converting it to speech. This function ensures input is sanitized and validated before
   * generating an AI response. If the response is generated, it attempts to convert the text
   * to speech using ElevenLabs or falls back to the browser's speech synthesis if necessary.
   * 
   * @param transcript - The user's speech input as a string.
   */  
  private async handleUserSpeech(transcript: string): Promise<void> {
    if (this.isProcessing || this.isPaused) {
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
        if (!API_CONFIG.ELEVENLABS_API_KEY) {
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