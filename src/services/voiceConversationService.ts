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
  private maxSilenceTime = 600; // 0.6 seconds pause threshold
  private lastSpeechTimestamp = 0;
  private silenceTimer: number | null = null;
  private noiseThreshold = 3; // Minimum characters to consider as valid speech
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;
  private audioVisualizationCallback: ((data: Uint8Array) => void) | null = null;
  private noiseDetector: ScriptProcessorNode | null = null;
  private noiseDetectionEnabled = true;
  private retryCount = 0;
  private maxRetries = 3;
  private audioQueue: Blob[] = [];
  private isPlayingQueue = false;
  private feedbackPreventionEnabled = true;
  private microphoneTrack: MediaStreamTrack | null = null;
  private aiFrequencyPattern: number[] = [];
  private speakingEndTime = 0;
  private delayAfterSpeaking = 500; // 500ms delay after AI stops speaking

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
      
      // Create noise detector
      this.noiseDetector = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.noiseDetector.onaudioprocess = this.detectNoise.bind(this);
      
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private detectNoise(event: AudioProcessingEvent): void {
    if (!this.noiseDetectionEnabled || !this.isListening || this.isProcessing) return;
    
    const input = event.inputBuffer.getChannelData(0);
    let sum = 0;
    
    // Calculate RMS (root mean square) of the audio buffer
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * input[i];
    }
    
    const rms = Math.sqrt(sum / input.length);
    const db = 20 * Math.log10(rms);
    
    // If sound level is above threshold, update last speech timestamp
    if (db > -50) { // Adjust threshold as needed
      this.lastSpeechTimestamp = Date.now();
    }
    
    // If AI is speaking, record the frequency pattern
    if (this.config.onAudioStart && this.analyser && this.audioDataArray) {
      this.analyser.getByteFrequencyData(this.audioDataArray);
      
      // Check for potential feedback
      if (this.feedbackPreventionEnabled && this.aiFrequencyPattern.length > 0) {
        const similarityScore = this.calculateFrequencySimilarity(
          Array.from(this.audioDataArray),
          this.aiFrequencyPattern
        );
        
        // If similarity is high, it might be feedback
        if (similarityScore > 0.7 && db > -40) {
          console.log('Potential feedback detected, muting microphone');
          this.muteUserMicrophone();
          
          // Unmute after a short delay
          setTimeout(() => {
            this.unmuteUserMicrophone();
          }, 1000);
        }
      }
      
      // Send visualization data
      if (this.audioVisualizationCallback) {
        this.audioVisualizationCallback(this.audioDataArray);
      }
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
      
      // Increase max alternatives for better accuracy
      this.recognition.maxAlternatives = 3;

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
          // Provide more specific error messages
          let errorMessage = `Speech recognition error: ${event.error}`;
          
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error occurred. Please check your connection.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please enable microphone permissions.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone detected. Please connect a microphone.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not allowed. Try using a different browser.';
              break;
          }
          
          this.config.onError?.(errorMessage);
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
      
      // Add additional event handlers for better debugging
      this.recognition.onaudiostart = () => {
        console.log('Audio recording started');
      };
      
      this.recognition.onaudioend = () => {
        console.log('Audio recording ended');
      };
      
      this.recognition.onsoundstart = () => {
        console.log('Sound detected');
      };
      
      this.recognition.onsoundend = () => {
        console.log('Sound ended');
      };
      
      this.recognition.onspeechstart = () => {
        console.log('Speech started');
        this.lastSpeechTimestamp = Date.now();
      };
      
      this.recognition.onspeechend = () => {
        console.log('Speech ended');
        // Start silence timer
        const silenceDuration = Date.now() - this.lastSpeechTimestamp;
        console.log(`Silence duration: ${silenceDuration}ms`);
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
      this.microphoneTrack = stream.getAudioTracks()[0];
      
      // Connect to audio context for visualization if available
      if (this.audioContext && this.analyser && this.noiseDetector) {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        source.connect(this.noiseDetector);
        this.noiseDetector.connect(this.audioContext.destination);
        
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
      
      // Provide specific error message based on error type
      let errorMessage = 'Failed to access microphone. Please check your browser permissions.';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone detected. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application. Please close other applications using the microphone.';
        }
      }
      
      this.config.onError?.(errorMessage);
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
    
    // Disconnect noise detector
    if (this.noiseDetector) {
      this.noiseDetector.disconnect();
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
    // Stop current audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Clear audio queue
    this.audioQueue = [];
    this.isPlayingQueue = false;
    
    // Also stop any browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Notify that audio has ended
    this.config.onAudioEnd?.();
    
    // Reset AI frequency pattern
    this.aiFrequencyPattern = [];
    
    // Reset speaking end time
    this.speakingEndTime = 0;
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
  
  // Set the delay after AI stops speaking
  setDelayAfterSpeaking(milliseconds: number): void {
    if (milliseconds >= 200 && milliseconds <= 1000) {
      this.delayAfterSpeaking = milliseconds;
      console.log(`Delay after speaking set to ${milliseconds}ms`);
    } else {
      console.error('Delay after speaking must be between 200ms and 1000ms');
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
  
  // Mute the user's microphone
  private muteUserMicrophone(): void {
    if (this.microphoneTrack) {
      this.microphoneTrack.enabled = false;
      console.log('Microphone muted to prevent feedback');
    }
  }
  
  // Unmute the user's microphone
  private unmuteUserMicrophone(): void {
    if (this.microphoneTrack) {
      this.microphoneTrack.enabled = true;
      console.log('Microphone unmuted');
    }
  }
  
  // Calculate similarity between current audio and AI voice pattern
  private calculateFrequencySimilarity(current: number[], pattern: number[]): number {
    if (pattern.length === 0) return 0;
    
    let matchCount = 0;
    const threshold = 20; // Tolerance for frequency matching
    
    for (let i = 0; i < Math.min(current.length, pattern.length); i++) {
      if (Math.abs(current[i] - pattern[i]) < threshold) {
        matchCount++;
      }
    }
    
    return matchCount / Math.min(current.length, pattern.length);
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
      
      // Mute microphone during processing to prevent feedback
      this.muteUserMicrophone();
      
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
          this.config.userId,
          false // isStudyMode
        );
      }

      // Notify about text response
      this.config.onResponse?.(aiResponse);

      // Generate and play speech
      this.config.onAudioStart?.();
      
      // Record AI frequency pattern for feedback detection
      if (this.analyser && this.audioDataArray) {
        this.analyser.getByteFrequencyData(this.audioDataArray);
        this.aiFrequencyPattern = Array.from(this.audioDataArray);
      }
      
      try {
        // Test audio output before generating speech
        await this.testAudioOutput();
        
        if (!API_CONFIG.ELEVENLABS_API_KEY) {
          // Use fallback if ElevenLabs API key is not configured
          const audioBlob = await this.createFallbackAudio(aiResponse);
          console.log('Using fallback speech generation');
          
          // Add to queue and play
          this.queueAudio(audioBlob);
        } else {
          // Split long responses into chunks for better streaming
          const chunks = this.splitResponseIntoChunks(aiResponse);
          
          for (const chunk of chunks) {
            try {
              const audioBlob = await ElevenLabsService.generateSpeech(chunk, this.config.avatarPersonality);
              console.log(`Speech generated successfully for chunk, blob size: ${audioBlob?.size}`);
              
              // Add to queue and play
              this.queueAudio(audioBlob);
            } catch (chunkError) {
              console.error('Error generating speech for chunk:', chunkError);
              // Continue with next chunk
            }
          }
        }
      } catch (audioError) {
        console.error('Audio generation or playback error:', audioError);
        
        // Retry with fallback
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying with fallback (attempt ${this.retryCount}/${this.maxRetries})`);
          
          try {
            const fallbackBlob = await this.createFallbackAudio(aiResponse);
            this.queueAudio(fallbackBlob);
          } catch (fallbackError) {
            console.error('Fallback audio generation failed:', fallbackError);
            this.config.onError?.('Voice generation failed. Falling back to text-only mode.');
          }
        } else {
          // Use browser's speech synthesis as last resort
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
        }
      }
    } catch (error) {
      console.error('Error in voice conversation:', error);
      
      // Provide specific error message based on error type
      let errorMessage = 'An error occurred during voice conversation.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'API key is missing or invalid. Please check your configuration.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.config.onError?.(errorMessage);
    } finally {
      this.isProcessing = false;
      this.currentTranscript = '';
      
      // Reset retry count
      this.retryCount = 0;
      
      // Keep microphone muted for a short delay after processing
      // to prevent immediate feedback
      setTimeout(() => {
        // Restart listening if in continuous mode and not paused
        if (!this.isPaused && !this.isListening && this.recognition) {
          this.unmuteUserMicrophone();
          setTimeout(() => {
            this.startListening();
          }, 300);
        } else {
          this.unmuteUserMicrophone();
        }
      }, this.delayAfterSpeaking);
    }
  }

  // Split long responses into chunks for better streaming
  private splitResponseIntoChunks(text: string): string[] {
    // Split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence would make the chunk too long, start a new chunk
      if (currentChunk.length + sentence.length > 300) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  // Queue audio for sequential playback
  private queueAudio(audioBlob: Blob): void {
    this.audioQueue.push(audioBlob);
    
    if (!this.isPlayingQueue) {
      this.playNextInQueue();
    }
  }

  // Play next audio in queue
  private async playNextInQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingQueue = false;
      this.config.onAudioEnd?.();
      
      // Set speaking end time for delayed unmuting
      this.speakingEndTime = Date.now();
      
      return;
    }
    
    this.isPlayingQueue = true;
    const nextBlob = this.audioQueue.shift();
    
    if (nextBlob) {
      try {
        await this.playAudio(nextBlob);
        this.playNextInQueue();
      } catch (error) {
        console.error('Error playing audio from queue:', error);
        this.playNextInQueue(); // Skip to next item in queue
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
        const audio = new Audio(audioUrl);
        
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
        
        // Set the current audio
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
  
  // Enable/disable noise detection
  setNoiseDetection(enabled: boolean): void {
    this.noiseDetectionEnabled = enabled;
    console.log(`Noise detection ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Enable/disable feedback prevention
  setFeedbackPrevention(enabled: boolean): void {
    this.feedbackPreventionEnabled = enabled;
    console.log(`Feedback prevention ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Clean up resources
  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    
    // Clean up audio context
    if (this.audioContext) {
      if (this.noiseDetector) {
        this.noiseDetector.disconnect();
      }
      
      if (this.analyser) {
        this.analyser.disconnect();
      }
      
      this.audioContext.close().catch(err => {
        console.error('Error closing audio context:', err);
      });
    }
  }
}