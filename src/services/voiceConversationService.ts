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
  private useBrowserSpeechSynthesis = false;
  private consecutiveApiFailures = 0;
  private maxConsecutiveFailures = 3;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private feedbackDetectionThreshold = 0.7;
  private microphoneGainNode: GainNode | null = null;
  private speakerOutputNode: GainNode | null = null;
  private audioLevelHistory: number[] = [];
  private audioLevelHistorySize = 10;
  private feedbackOccurrences = 0;
  private maxFeedbackOccurrences = 3;
  private lastFeedbackTime = 0;
  private feedbackCooldown = 2000; // 2 seconds cooldown between feedback detections
  private isAISpeaking = false;
  private voiceActivityDetector: AnalyserNode | null = null;
  private voiceActivityThreshold = 0.05;
  private voiceActivityHistory: boolean[] = [];
  private voiceActivityHistorySize = 10;
  private aiAudioFingerprint: Float32Array | null = null;
  private audioFingerprinter: ScriptProcessorNode | null = null;
  private isUserSpeaking = false;
  private isAIAudioPlaying = false;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
    this.initializeAudioContext();
    
    // Check if ElevenLabs is already in quota exceeded state
    if (ElevenLabsService.isQuotaExceeded()) {
      this.useBrowserSpeechSynthesis = true;
      console.log('ElevenLabs quota already exceeded, using browser speech synthesis');
    }
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized successfully');
      
      // Create analyzer for visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024; // Higher resolution for better visualization
      this.analyser.smoothingTimeConstant = 0.8; // Smoother transitions
      this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Create gain nodes for volume control
      this.microphoneGainNode = this.audioContext.createGain();
      this.speakerOutputNode = this.audioContext.createGain();
      
      // Set initial volume
      this.microphoneGainNode.gain.value = 1.0;
      this.speakerOutputNode.gain.value = 0.8;
      
      // Create voice activity detector
      this.voiceActivityDetector = this.audioContext.createAnalyser();
      this.voiceActivityDetector.fftSize = 256;
      
      // Try to use AudioWorklet for better performance if supported
      if ('audioWorklet' in this.audioContext) {
        try {
          // Create a blob URL for the worklet processor code
          const workletCode = `
            class FeedbackDetectionProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.lastSamples = new Float32Array(1024).fill(0);
                this.currentSamples = new Float32Array(1024);
                this.threshold = 0.8;
                this.feedbackDetected = false;
                this.cooldownCounter = 0;
                this.cooldownPeriod = 128; // About 3 seconds at 44.1kHz
                this.isAISpeaking = false;
                this.aiAudioFingerprint = null;
                this.userVoiceFingerprint = null;
                
                // Listen for messages from the main thread
                this.port.onmessage = (event) => {
                  if (event.data.type === 'aiSpeaking') {
                    this.isAISpeaking = event.data.value;
                  } else if (event.data.type === 'aiFingerprint') {
                    this.aiAudioFingerprint = event.data.fingerprint;
                  }
                };
              }
              
              process(inputs, outputs, parameters) {
                const input = inputs[0][0];
                if (!input) return true;
                
                // Store current samples
                this.currentSamples.set(input);
                
                // Skip processing during cooldown
                if (this.cooldownCounter > 0) {
                  this.cooldownCounter--;
                  this.port.postMessage({ feedbackDetected: false, level: 0 });
                  return true;
                }
                
                // Calculate correlation between current and last samples
                let correlation = 0;
                let power = 0;
                
                for (let i = 0; i < input.length; i++) {
                  correlation += this.currentSamples[i] * this.lastSamples[i];
                  power += this.currentSamples[i] * this.currentSamples[i];
                }
                
                // Normalize correlation
                const normalizedCorrelation = power > 0 ? Math.abs(correlation / power) : 0;
                
                // Calculate audio fingerprint similarity if AI is speaking
                let aiSimilarity = 0;
                if (this.isAISpeaking && this.aiAudioFingerprint) {
                  let similaritySum = 0;
                  let count = 0;
                  
                  for (let i = 0; i < Math.min(input.length, this.aiAudioFingerprint.length); i++) {
                    // Compare frequency patterns
                    const diff = Math.abs(input[i] - this.aiAudioFingerprint[i]);
                    similaritySum += 1 - Math.min(1, diff);
                    count++;
                  }
                  
                  aiSimilarity = count > 0 ? similaritySum / count : 0;
                  
                  // If high similarity to AI audio and AI is speaking, likely feedback
                  if (aiSimilarity > 0.7 && power > 0.01) {
                    this.feedbackDetected = true;
                    this.cooldownCounter = this.cooldownPeriod;
                    this.port.postMessage({ 
                      feedbackDetected: true, 
                      level: aiSimilarity,
                      power: power,
                      isAIAudio: true
                    });
                    
                    // Store AI audio fingerprint for future comparison
                    if (!this.aiAudioFingerprint) {
                      this.aiAudioFingerprint = new Float32Array(input.length);
                      this.aiAudioFingerprint.set(input);
                    }
                    
                    return true;
                  }
                }
                
                // Detect feedback if correlation is above threshold
                if (normalizedCorrelation > this.threshold && power > 0.01) {
                  this.feedbackDetected = true;
                  this.cooldownCounter = this.cooldownPeriod;
                  this.port.postMessage({ 
                    feedbackDetected: true, 
                    level: normalizedCorrelation,
                    power: power,
                    isAIAudio: false
                  });
                } else {
                  this.port.postMessage({ 
                    feedbackDetected: false, 
                    level: normalizedCorrelation,
                    power: power,
                    aiSimilarity: aiSimilarity
                  });
                }
                
                // Store current samples for next comparison
                this.lastSamples.set(this.currentSamples);
                
                return true;
              }
            }
            
            registerProcessor('feedback-detection-processor', FeedbackDetectionProcessor);
          `;
          
          const blob = new Blob([workletCode], { type: 'application/javascript' });
          const workletUrl = URL.createObjectURL(blob);
          
          // Load the worklet
          await this.audioContext.audioWorklet.addModule(workletUrl);
          
          // Create worklet node
          this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'feedback-detection-processor');
          
          // Listen for messages from the worklet
          this.audioWorkletNode.port.onmessage = (event) => {
            const { feedbackDetected, level, power, isAIAudio } = event.data;
            
            if (feedbackDetected) {
              console.log(`Feedback detected! Level: ${level.toFixed(2)}, Power: ${power.toFixed(2)}, AI Audio: ${isAIAudio}`);
              this.handleFeedbackDetection();
            }
          };
          
          console.log('AudioWorklet initialized for feedback detection');
        } catch (workletError) {
          console.warn('Failed to initialize AudioWorklet, falling back to ScriptProcessorNode:', workletError);
          this.initializeScriptProcessor();
        }
      } else {
        console.log('AudioWorklet not supported, using ScriptProcessorNode');
        this.initializeScriptProcessor();
      }
      
      // Create audio fingerprinter for AI voice detection
      this.audioFingerprinter = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioFingerprinter.onaudioprocess = this.createAudioFingerprint.bind(this);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private initializeScriptProcessor(): void {
    if (!this.audioContext) return;
    
    // Create script processor for audio analysis
    this.noiseDetector = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.noiseDetector.onaudioprocess = this.detectNoise.bind(this);
    
    console.log('ScriptProcessorNode initialized for feedback detection');
  }
  
  private createAudioFingerprint(event: AudioProcessingEvent): void {
    if (!this.isAIAudioPlaying) return;
    
    const input = event.inputBuffer.getChannelData(0);
    
    // Create a fingerprint of the AI audio
    if (!this.aiAudioFingerprint) {
      this.aiAudioFingerprint = new Float32Array(input.length);
    }
    
    // Update fingerprint with a weighted average
    for (let i = 0; i < input.length; i++) {
      if (this.aiAudioFingerprint) {
        // 80% old data, 20% new data for smooth updates
        this.aiAudioFingerprint[i] = this.aiAudioFingerprint[i] * 0.8 + input[i] * 0.2;
      }
    }
    
    // Send fingerprint to AudioWorklet if available
    if (this.audioWorkletNode) {
      this.audioWorkletNode.port.postMessage({
        type: 'aiFingerprint',
        fingerprint: this.aiAudioFingerprint
      });
    }
  }

  private detectNoise(event: AudioProcessingEvent): void {
    if (!this.noiseDetectionEnabled) return;
    
    const input = event.inputBuffer.getChannelData(0);
    let sum = 0;
    
    // Calculate RMS (root mean square) of the audio buffer
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * input[i];
    }
    
    const rms = Math.sqrt(sum / input.length);
    const db = 20 * Math.log10(Math.max(rms, 1e-10));
    
    // Detect voice activity
    const isVoiceActive = db > -50; // Adjust threshold as needed
    
    // Update voice activity history
    this.voiceActivityHistory.push(isVoiceActive);
    if (this.voiceActivityHistory.length > this.voiceActivityHistorySize) {
      this.voiceActivityHistory.shift();
    }
    
    // Determine if user is speaking based on recent history
    const activeFrames = this.voiceActivityHistory.filter(active => active).length;
    this.isUserSpeaking = activeFrames > this.voiceActivityHistorySize / 3;
    
    // If sound level is above threshold and not AI speaking, update last speech timestamp
    if (isVoiceActive && !this.isAISpeaking) {
      this.lastSpeechTimestamp = Date.now();
    }
    
    // Track audio levels for feedback detection
    this.audioLevelHistory.push(rms);
    if (this.audioLevelHistory.length > this.audioLevelHistorySize) {
      this.audioLevelHistory.shift();
    }
    
    // Check for potential feedback by analyzing audio level patterns
    if (this.feedbackPreventionEnabled && this.audioLevelHistory.length === this.audioLevelHistorySize) {
      const increasing = this.isAudioLevelIncreasing();
      const highLevel = rms > 0.1; // Threshold for high audio level
      
      // If audio levels are consistently increasing and high, it might be feedback
      if (increasing && highLevel && Date.now() - this.lastFeedbackTime > this.feedbackCooldown) {
        this.feedbackOccurrences++;
        this.lastFeedbackTime = Date.now();
        
        if (this.feedbackOccurrences >= this.maxFeedbackOccurrences) {
          console.log('Feedback loop detected, muting microphone');
          this.handleFeedbackDetection();
          this.feedbackOccurrences = 0;
        }
      } else if (!highLevel) {
        // Reset counter if levels are normal
        this.feedbackOccurrences = Math.max(0, this.feedbackOccurrences - 1);
      }
    }
    
    // If AI is speaking, check for AI audio in the microphone input
    if (this.isAISpeaking && this.aiAudioFingerprint && this.feedbackPreventionEnabled) {
      // Compare current audio with AI fingerprint
      let similaritySum = 0;
      let count = 0;
      
      for (let i = 0; i < Math.min(input.length, this.aiAudioFingerprint.length); i++) {
        // Compare frequency patterns
        const diff = Math.abs(input[i] - this.aiAudioFingerprint[i]);
        similaritySum += 1 - Math.min(1, diff);
        count++;
      }
      
      const similarity = count > 0 ? similaritySum / count : 0;
      
      // If similarity is high, it might be feedback
      if (similarity > this.feedbackDetectionThreshold && rms > 0.05) {
        console.log(`AI audio detected in microphone input, similarity: ${similarity.toFixed(2)}, rms: ${rms.toFixed(2)}`);
        this.handleFeedbackDetection();
      }
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
        if (similarityScore > this.feedbackDetectionThreshold && db > -40) {
          console.log(`Potential feedback detected, similarity: ${similarityScore.toFixed(2)}, db: ${db.toFixed(2)}`);
          this.handleFeedbackDetection();
        }
      }
      
      // Send visualization data
      if (this.audioVisualizationCallback) {
        this.audioVisualizationCallback(this.audioDataArray);
      }
    }
  }

  private isAudioLevelIncreasing(): boolean {
    if (this.audioLevelHistory.length < 3) return false;
    
    // Check if audio levels are consistently increasing
    for (let i = 2; i < this.audioLevelHistory.length; i++) {
      if (this.audioLevelHistory[i] <= this.audioLevelHistory[i-1] || 
          this.audioLevelHistory[i-1] <= this.audioLevelHistory[i-2]) {
        return false;
      }
    }
    
    return true;
  }

  private handleFeedbackDetection(): void {
    // Mute microphone immediately
    this.muteUserMicrophone();
    
    // Reduce speaker volume temporarily
    if (this.speakerOutputNode) {
      const currentVolume = this.speakerOutputNode.gain.value;
      this.speakerOutputNode.gain.setValueAtTime(currentVolume * 0.5, this.audioContext?.currentTime || 0);
      
      // Restore volume after a delay
      setTimeout(() => {
        if (this.speakerOutputNode) {
          this.speakerOutputNode.gain.linearRampToValueAtTime(
            currentVolume,
            (this.audioContext?.currentTime || 0) + 1
          );
        }
      }, 1000);
    }
    
    // Unmute after a longer delay to ensure feedback is broken
    setTimeout(() => {
      if (!this.isAISpeaking) {
        this.unmuteUserMicrophone();
      }
    }, 2000);
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
          // Skip processing if AI is speaking (to prevent feedback)
          if (this.isAISpeaking && this.feedbackPreventionEnabled) {
            console.log('Skipping transcript processing while AI is speaking:', transcript);
            return;
          }
          
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
              if (!this.isProcessing && transcript !== '' && !this.isAISpeaking) {
                this.handleUserSpeech(transcript);
              }
              this.processingTimeout = null;
            }, 300); // Reduced from 2000ms to 300ms for faster response
          } else {
            // Start silence detection timer
            this.silenceTimer = window.setTimeout(() => {
              const silenceDuration = Date.now() - this.lastSpeechTimestamp;
              if (silenceDuration >= this.maxSilenceTime && transcript && !this.isProcessing && !this.isAISpeaking) {
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
        if (this.currentTranscript && 
            this.currentTranscript.length > this.noiseThreshold && 
            !this.isProcessing && 
            !this.isPaused && 
            !this.isAISpeaking) {
          console.log('Processing transcript on recognition end:', this.currentTranscript);
          this.handleUserSpeech(this.currentTranscript);
          return;
        }
        
        // Restart if we're supposed to be listening continuously
        if (!this.isPaused && this.recognition && !this.isProcessing && !this.isAISpeaking) {
          try {
            setTimeout(() => {
              if (!this.isPaused && !this.isListening && this.recognition && !this.isProcessing && !this.isAISpeaking) {
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
      
      // Connect to audio context for visualization and feedback prevention
      if (this.audioContext && this.analyser) {
        const source = this.audioContext.createMediaStreamSource(stream);
        
        // Connect through gain node for volume control
        if (this.microphoneGainNode) {
          source.connect(this.microphoneGainNode);
          this.microphoneGainNode.connect(this.analyser);
          
          // Connect to feedback detection
          if (this.audioWorkletNode) {
            this.microphoneGainNode.connect(this.audioWorkletNode);
          } else if (this.noiseDetector) {
            this.microphoneGainNode.connect(this.noiseDetector);
            this.noiseDetector.connect(this.audioContext.destination);
          }
          
          // Connect to voice activity detector
          if (this.voiceActivityDetector) {
            this.microphoneGainNode.connect(this.voiceActivityDetector);
          }
          
          // Connect to audio fingerprinter
          if (this.audioFingerprinter) {
            this.microphoneGainNode.connect(this.audioFingerprinter);
            this.audioFingerprinter.connect(this.audioContext.destination);
          }
        } else {
          source.connect(this.analyser);
          
          // Connect to feedback detection
          if (this.audioWorkletNode) {
            source.connect(this.audioWorkletNode);
          } else if (this.noiseDetector) {
            source.connect(this.noiseDetector);
            this.noiseDetector.connect(this.audioContext.destination);
          }
          
          // Connect to voice activity detector
          if (this.voiceActivityDetector) {
            source.connect(this.voiceActivityDetector);
          }
          
          // Connect to audio fingerprinter
          if (this.audioFingerprinter) {
            source.connect(this.audioFingerprinter);
            this.audioFingerprinter.connect(this.audioContext.destination);
          }
        }
        
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
        if (this.currentTranscript && 
            this.currentTranscript.length > this.noiseThreshold && 
            !this.isProcessing && 
            !this.isPaused && 
            !this.isAISpeaking) {
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
    
    // Disconnect audio nodes
    this.disconnectAudioNodes();
    
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

  private disconnectAudioNodes(): void {
    // Disconnect all audio nodes
    if (this.audioContext) {
      if (this.noiseDetector) {
        try {
          this.noiseDetector.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (this.audioWorkletNode) {
        try {
          this.audioWorkletNode.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (this.analyser) {
        try {
          this.analyser.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (this.microphoneGainNode) {
        try {
          this.microphoneGainNode.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (this.speakerOutputNode) {
        try {
          this.speakerOutputNode.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (this.voiceActivityDetector) {
        try {
          this.voiceActivityDetector.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
      
      if (this.audioFingerprinter) {
        try {
          this.audioFingerprinter.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      }
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
    
    // Reset AI speaking state
    this.isAISpeaking = false;
    this.isAIAudioPlaying = false;
    
    // Notify AudioWorklet
    if (this.audioWorkletNode) {
      this.audioWorkletNode.port.postMessage({
        type: 'aiSpeaking',
        value: false
      });
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

  // Set feedback prevention
  setFeedbackPrevention(enabled: boolean): void {
    this.feedbackPreventionEnabled = enabled;
    console.log(`Feedback prevention ${enabled ? 'enabled' : 'disabled'}`);
    
    // Reset feedback detection counters
    this.feedbackOccurrences = 0;
    this.lastFeedbackTime = 0;
    
    // If enabling, immediately mute if AI is speaking
    if (enabled && this.isAISpeaking) {
      this.muteUserMicrophone();
    } else if (!enabled && this.isAISpeaking) {
      // If disabling while AI is speaking, unmute
      this.unmuteUserMicrophone();
    }
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
    
    // Also reduce gain if gain node is available
    if (this.microphoneGainNode) {
      const currentTime = this.audioContext?.currentTime || 0;
      this.microphoneGainNode.gain.setValueAtTime(0, currentTime);
    }
  }
  
  // Unmute the user's microphone
  private unmuteUserMicrophone(): void {
    if (this.microphoneTrack) {
      this.microphoneTrack.enabled = true;
      console.log('Microphone unmuted');
    }
    
    // Gradually restore gain to prevent sudden noise
    if (this.microphoneGainNode && this.audioContext) {
      const currentTime = this.audioContext.currentTime;
      this.microphoneGainNode.gain.setValueAtTime(0, currentTime);
      this.microphoneGainNode.gain.linearRampToValueAtTime(1.0, currentTime + 0.1);
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

    // Skip processing if AI is speaking to prevent feedback
    if (this.isAISpeaking && this.feedbackPreventionEnabled) {
      console.log('Skipping processing while AI is speaking');
      return;
    }

    try {
      this.isProcessing = true;
      console.log('Processing speech input:', transcript);
      
      // Mute microphone during processing to prevent feedback
      if (this.feedbackPreventionEnabled) {
        this.muteUserMicrophone();
      }
      
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
      
      // Set AI speaking state
      this.isAISpeaking = true;
      this.isAIAudioPlaying = true;
      
      // Notify AudioWorklet
      if (this.audioWorkletNode) {
        this.audioWorkletNode.port.postMessage({
          type: 'aiSpeaking',
          value: true
        });
      }
      
      // Record AI frequency pattern for feedback detection
      if (this.analyser && this.audioDataArray) {
        this.analyser.getByteFrequencyData(this.audioDataArray);
        this.aiFrequencyPattern = Array.from(this.audioDataArray);
      }
      
      try {
        // Test audio output before generating speech
        await this.testAudioOutput();
        
        // If we've had multiple consecutive API failures or quota is exceeded, use browser speech synthesis directly
        if (this.useBrowserSpeechSynthesis || this.consecutiveApiFailures >= this.maxConsecutiveFailures) {
          await this.useBrowserSpeech(aiResponse);
        } else {
          // Split long responses into chunks for better streaming
          const chunks = this.splitResponseIntoChunks(aiResponse);
          
          let apiFailedForAllChunks = true;
          
          for (const chunk of chunks) {
            try {
              const audioBlob = await ElevenLabsService.generateSpeech(chunk, this.config.avatarPersonality);
              console.log(`Speech generated successfully for chunk, blob size: ${audioBlob?.size}`);
              
              // If we get a successful response, reset the consecutive failures counter
              this.consecutiveApiFailures = 0;
              apiFailedForAllChunks = false;
              
              // Add to queue and play
              this.queueAudio(audioBlob);
            } catch (chunkError) {
              console.error('Error generating speech for chunk:', chunkError);
              
              // If this is a quota error, use browser speech for this and future chunks
              if (chunkError instanceof Error && 
                  (chunkError.message.includes('quota_exceeded') || 
                   chunkError.message.includes('rate limit'))) {
                this.useBrowserSpeechSynthesis = true;
                await this.useBrowserSpeech(chunk);
                apiFailedForAllChunks = false;
                break;
              }
              
              // Continue with next chunk
            }
          }
          
          // If all chunks failed with API, increment failure counter and use browser speech
          if (apiFailedForAllChunks) {
            this.consecutiveApiFailures++;
            console.log(`All chunks failed with API, consecutive failures: ${this.consecutiveApiFailures}`);
            
            if (this.consecutiveApiFailures >= this.maxConsecutiveFailures) {
              console.log(`Switching to browser speech synthesis after ${this.maxConsecutiveFailures} consecutive failures`);
              this.useBrowserSpeechSynthesis = true;
            }
            
            await this.useBrowserSpeech(aiResponse);
          }
        }
      } catch (audioError) {
        console.error('Audio generation or playback error:', audioError);
        
        // Use browser's speech synthesis as fallback
        await this.useBrowserSpeech(aiResponse);
      } finally {
        // Reset AI speaking state
        this.isAISpeaking = false;
        this.isAIAudioPlaying = false;
        
        // Notify AudioWorklet
        if (this.audioWorkletNode) {
          this.audioWorkletNode.port.postMessage({
            type: 'aiSpeaking',
            value: false
          });
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
          if (this.feedbackPreventionEnabled && !this.isAISpeaking) {
            this.unmuteUserMicrophone();
          }
          setTimeout(() => {
            this.startListening();
          }, 300);
        } else if (this.feedbackPreventionEnabled && !this.isAISpeaking) {
          this.unmuteUserMicrophone();
        }
      }, this.delayAfterSpeaking);
    }
  }

  // Use browser speech synthesis
  private async useBrowserSpeech(text: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported in this browser');
        reject(new Error('Speech synthesis not supported in this browser'));
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get voice settings for persona
      const settings = API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS[this.config.avatarPersonality as keyof typeof API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS] || 
                       API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS['encouraging-emma'];
      
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Find a suitable voice
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en-') && voice.localService
        ) || voices.find(voice => 
          voice.lang.startsWith('en-')
        ) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log('Browser speech synthesis started');
        this.isAISpeaking = true;
        this.isAIAudioPlaying = true;
        
        // Notify AudioWorklet
        if (this.audioWorkletNode) {
          this.audioWorkletNode.port.postMessage({
            type: 'aiSpeaking',
            value: true
          });
        }
        
        // Mute microphone to prevent feedback
        if (this.feedbackPreventionEnabled) {
          this.muteUserMicrophone();
        }
      };
      
      utterance.onend = () => {
        console.log('Browser speech synthesis ended');
        this.isAISpeaking = false;
        this.isAIAudioPlaying = false;
        
        // Notify AudioWorklet
        if (this.audioWorkletNode) {
          this.audioWorkletNode.port.postMessage({
            type: 'aiSpeaking',
            value: false
          });
        }
        
        // Set speaking end time for delayed unmuting
        this.speakingEndTime = Date.now();
        
        // Unmute after delay
        setTimeout(() => {
          if (this.feedbackPreventionEnabled && !this.isAISpeaking) {
            this.unmuteUserMicrophone();
          }
        }, this.delayAfterSpeaking);
        
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Browser speech synthesis error:', event.error);
        this.isAISpeaking = false;
        this.isAIAudioPlaying = false;
        
        // Notify AudioWorklet
        if (this.audioWorkletNode) {
          this.audioWorkletNode.port.postMessage({
            type: 'aiSpeaking',
            value: false
          });
        }
        
        // Unmute microphone
        if (this.feedbackPreventionEnabled) {
          this.unmuteUserMicrophone();
        }
        
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
      // Create a silent audio blob for compatibility
      this.createFallbackAudio().then(blob => {
        this.queueAudio(blob);
      });
    });
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
      
      // Reset AI speaking state
      this.isAISpeaking = false;
      this.isAIAudioPlaying = false;
      
      // Notify AudioWorklet
      if (this.audioWorkletNode) {
        this.audioWorkletNode.port.postMessage({
          type: 'aiSpeaking',
          value: false
        });
      }
      
      // Unmute after delay
      setTimeout(() => {
        if (this.feedbackPreventionEnabled && !this.isAISpeaking) {
          this.unmuteUserMicrophone();
        }
      }, this.delayAfterSpeaking);
      
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
        
        // Set AI speaking state
        this.isAISpeaking = true;
        this.isAIAudioPlaying = true;
        
        // Notify AudioWorklet
        if (this.audioWorkletNode) {
          this.audioWorkletNode.port.postMessage({
            type: 'aiSpeaking',
            value: true
          });
        }
        
        // Mute microphone to prevent feedback
        if (this.feedbackPreventionEnabled) {
          this.muteUserMicrophone();
        }
        
        // Set the current audio
        this.currentAudio = audio;
        
        // Apply volume control
        if (this.speakerOutputNode && this.audioContext) {
          try {
            // Create media element source
            const source = this.audioContext.createMediaElementSource(audio);
            
            // Connect through gain node for volume control
            source.connect(this.speakerOutputNode);
            this.speakerOutputNode.connect(this.audioContext.destination);
            
            // Connect to audio fingerprinter
            if (this.audioFingerprinter) {
              source.connect(this.audioFingerprinter);
            }
          } catch (error) {
            console.warn('Failed to connect audio to volume control:', error);
            // Fall back to direct volume control
            audio.volume = this.speakerOutputNode.gain.value;
          }
        }
        
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
  private async createFallbackAudio(text?: string): Promise<Blob> {
    return new Promise((resolve) => {
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
      
      // Return the silent audio blob
      resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
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
    if (this.currentTranscript && 
        this.currentTranscript.length > this.noiseThreshold && 
        !this.isProcessing && 
        !this.isAISpeaking) {
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
  
  // Reset browser speech synthesis fallback
  resetBrowserSpeechSynthesisFallback(): void {
    this.useBrowserSpeechSynthesis = false;
    this.consecutiveApiFailures = 0;
    console.log('Reset browser speech synthesis fallback');
  }
  
  // Set feedback detection threshold
  setFeedbackDetectionThreshold(threshold: number): void {
    if (threshold >= 0.5 && threshold <= 0.95) {
      this.feedbackDetectionThreshold = threshold;
      console.log(`Feedback detection threshold set to ${threshold}`);
    } else {
      console.error('Feedback detection threshold must be between 0.5 and 0.95');
    }
  }
  
  // Clean up resources
  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    
    // Clean up audio context
    this.disconnectAudioNodes();
    
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error('Error closing audio context:', err);
      });
    }
  }
}