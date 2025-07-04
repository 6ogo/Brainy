import { ElevenLabsService } from './elevenlabsService';
import { GroqService } from './groqService';
import { SecurityUtils } from '../utils/security';

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
  
  // Simplified timing variables
  private speechEndTimer: number | null = null;
  private speechEndDelay = 1500; // Wait 1.5 seconds after user stops speaking
  private minTranscriptLength = 3;
  private lastProcessedTranscript = '';
  
  // Audio context for visualization
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private audioVisualizationCallback: ((data: Uint8Array) => void) | null = null;
  
  // Feedback prevention
  private feedbackPrevention = true;
  private delayAfterSpeaking = 500;
  private isAISpeaking = false;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
    this.initializeAudioContext();
  }

  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    
    if (this.speechEndTimer) {
      clearTimeout(this.speechEndTimer);
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error('Error closing audio context:', err);
      });
    }
    
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
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event) => {
        // Skip if AI is currently speaking to prevent feedback
        if (this.isAISpeaking) {
          return;
        }
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update current transcript with either final or interim
        const currentText = finalTranscript || interimTranscript;
        this.currentTranscript = currentText.trim();
        
        // Notify UI about transcript updates
        this.config.onTranscript?.(this.currentTranscript, !!finalTranscript);
        
        // Clear any existing timer
        if (this.speechEndTimer) {
          clearTimeout(this.speechEndTimer);
          this.speechEndTimer = null;
        }
        
        // If we have a final result, process it immediately
        if (finalTranscript && finalTranscript.trim().length >= this.minTranscriptLength) {
          console.log('Processing final transcript:', finalTranscript.trim());
          this.processTranscript(finalTranscript.trim());
          return;
        }
        
        // If we have interim results, set a timer to process after user stops speaking
        if (this.currentTranscript.length >= this.minTranscriptLength) {
          this.speechEndTimer = window.setTimeout(() => {
            if (this.currentTranscript && 
                this.currentTranscript.length >= this.minTranscriptLength && 
                !this.isProcessing &&
                this.currentTranscript !== this.lastProcessedTranscript) {
              console.log('Processing transcript after speech end delay:', this.currentTranscript);
              this.processTranscript(this.currentTranscript);
            }
          }, this.speechEndDelay);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          this.config.onError?.('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, continuing...');
          // Don't show error for no-speech as it's normal
        } else if (event.error !== 'aborted') {
          this.config.onError?.(`Speech recognition error: ${event.error}`);
        }
        
        this.isListening = false;
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
        
        // Process any remaining transcript
        if (this.currentTranscript && 
            this.currentTranscript.length >= this.minTranscriptLength && 
            !this.isProcessing && 
            !this.isPaused &&
            !this.isAISpeaking &&
            this.currentTranscript !== this.lastProcessedTranscript) {
          console.log('Processing remaining transcript on recognition end:', this.currentTranscript);
          this.processTranscript(this.currentTranscript);
          return;
        }
        
        // Auto-restart if we should still be listening
        if (!this.isPaused && !this.isAISpeaking && !this.isProcessing) {
          setTimeout(() => {
            if (!this.isPaused && !this.isAISpeaking && !this.isListening && this.recognition) {
              try {
                this.recognition.start();
                this.isListening = true;
                console.log('Auto-restarted speech recognition');
              } catch (error) {
                console.error('Failed to restart speech recognition:', error);
              }
            }
          }, 100);
        }
      };

      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.isListening = true;
      };
    }
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('Audio context initialized successfully');
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
        
        if (this.audioVisualizationCallback) {
          this.audioVisualizationCallback(this.audioDataArray);
        }
        
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
      
      this.stream = stream;
      
      // Connect to audio context for visualization
      if (this.audioContext && this.analyser) {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        console.log('Audio recording started');
      }
      
      this.isPaused = false;
      this.isAISpeaking = false;
      this.recognition.start();
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.config.onError?.('Failed to access microphone. Please check your browser permissions.');
    }
  }

  stopListening(): void {
    if (this.speechEndTimer) {
      clearTimeout(this.speechEndTimer);
      this.speechEndTimer = null;
    }
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        console.log('Speech recognition stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  pauseConversation(): void {
    this.isPaused = true;
    this.stopListening();
    this.stopSpeaking();
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
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    this.isAISpeaking = false;
    this.config.onAudioEnd?.();
  }

  forceSubmitTranscript(): void {
    if (this.currentTranscript && 
        this.currentTranscript.length >= this.minTranscriptLength && 
        !this.isProcessing &&
        this.currentTranscript !== this.lastProcessedTranscript) {
      console.log('Force submitting transcript:', this.currentTranscript);
      this.processTranscript(this.currentTranscript);
    }
  }

  private async processTranscript(transcript: string): Promise<void> {
    if (this.isProcessing || this.isPaused || transcript.length < this.minTranscriptLength) {
      return;
    }

    try {
      this.isProcessing = true;
      this.lastProcessedTranscript = transcript;
      this.currentTranscript = '';
      
      // Clear any pending timer
      if (this.speechEndTimer) {
        clearTimeout(this.speechEndTimer);
        this.speechEndTimer = null;
      }
      
      console.log('Processing speech input:', transcript);
      
      // Stop listening while processing if feedback prevention is enabled
      if (this.feedbackPrevention) {
        this.pauseRecognition();
      }
      
      // Sanitize input
      const sanitizedTranscript = SecurityUtils.sanitizeInput(transcript);
      if (!SecurityUtils.validateInput(sanitizedTranscript, 2000)) {
        throw new Error('Invalid speech input');
      }

      // Generate AI response
      let aiResponse;
      if (!import.meta.env.VITE_GROQ_API_KEY) {
        aiResponse = `I heard you say: "${sanitizedTranscript}". However, I'm currently operating in fallback mode because the AI service is not fully configured.`;
      } else {
        aiResponse = await GroqService.generateResponse(
          sanitizedTranscript,
          this.config.subject,
          this.config.avatarPersonality,
          this.config.difficultyLevel,
          this.config.userId,
          true
        );
      }

      // Notify about text response
      this.config.onResponse?.(aiResponse);

      // Generate and play speech
      await this.playAIResponse(aiResponse);

    } catch (error) {
      console.error('Error processing transcript:', error);
      this.config.onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.isProcessing = false;
      
      // Resume listening after a short delay
      if (!this.isPaused) {
        setTimeout(() => {
          this.resumeRecognition();
        }, this.delayAfterSpeaking);
      }
    }
  }

  private async playAIResponse(text: string): Promise<void> {
    this.isAISpeaking = true;
    this.config.onAudioStart?.();
    
    try {
      if (!import.meta.env.VITE_ELEVENLABS_API_KEY) {
        // Use browser speech synthesis as fallback
        await this.useBrowserSpeech(text);
      } else {
        // Try ElevenLabs first, fall back to browser speech
        try {
          const audioBlob = await ElevenLabsService.generateSpeech(text, this.config.avatarPersonality);
          if (audioBlob && audioBlob.size > 1000) {
            await this.playAudioBlob(audioBlob);
          } else {
            await this.useBrowserSpeech(text);
          }
        } catch (elevenLabsError) {
          console.error('ElevenLabs failed, using browser speech:', elevenLabsError);
          await this.useBrowserSpeech(text);
        }
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      this.config.onError?.('Voice output failed. Please check your audio settings.');
    } finally {
      this.isAISpeaking = false;
      this.config.onAudioEnd?.();
    }
  }

  private async playAudioBlob(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        resolve();
      };
      
      audio.onerror = (event) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        reject(new Error('Audio playback failed'));
      };
      
      this.currentAudio = audio;
      audio.play().catch(reject);
    });
  }

  private async useBrowserSpeech(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      
      window.speechSynthesis.speak(utterance);
    });
  }

  private pauseRecognition(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        console.log('Paused recognition for AI speaking');
      } catch (error) {
        console.error('Error pausing recognition:', error);
      }
    }
  }

  private resumeRecognition(): void {
    if (!this.isPaused && !this.isListening && this.recognition && !this.isAISpeaking) {
      try {
        this.recognition.start();
        console.log('Resumed recognition after AI finished');
      } catch (error) {
        console.error('Error resuming recognition:', error);
      }
    }
  }

  // Configuration methods
  setSilenceThreshold(milliseconds: number): void {
    this.speechEndDelay = Math.max(500, Math.min(3000, milliseconds));
    console.log(`Speech end delay set to: ${this.speechEndDelay}ms`);
  }

  setFeedbackPrevention(enabled: boolean): void {
    this.feedbackPrevention = enabled;
    console.log(`Feedback prevention ${enabled ? 'enabled' : 'disabled'}`);
  }

  setDelayAfterSpeaking(milliseconds: number): void {
    this.delayAfterSpeaking = Math.max(200, Math.min(1000, milliseconds));
    console.log(`Delay after speaking set to: ${this.delayAfterSpeaking}ms`);
  }

  setAudioVisualizationCallback(callback: (data: Uint8Array) => void): void {
    this.audioVisualizationCallback = callback;
  }

  setLanguage(languageCode: string): void {
    this.recognitionLanguage = languageCode;
    if (this.recognition) {
      this.recognition.lang = languageCode;
      console.log(`Speech recognition language set to: ${languageCode}`);
    }
  }

  // Status methods
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
