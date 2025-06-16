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
}

export class VoiceConversationService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private isProcessing = false;
  private config: VoiceConversationConfig;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
    this.initializeAudioContext();
  }

  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.config.onError?.('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript) {
        this.handleUserSpeech(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.config.onError?.(`Speech recognition error: ${event.error}`);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async startListening(): Promise<void> {
    if (!this.recognition || this.isListening || this.isProcessing) {
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.isListening = true;
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.config.onError?.('Failed to access microphone. Please check permissions.');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.config.onAudioEnd?.();
    }
  }

  private async handleUserSpeech(transcript: string): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      
      // Sanitize input
      const sanitizedTranscript = SecurityUtils.sanitizeInput(transcript);
      if (!SecurityUtils.validateInput(sanitizedTranscript, 2000)) {
        throw new Error('Invalid speech input');
      }

      // Generate AI response
      const aiResponse = await GroqService.generateResponse(
        sanitizedTranscript,
        this.config.subject,
        this.config.avatarPersonality,
        this.config.difficultyLevel,
        this.config.userId
      );

      // Notify about text response
      this.config.onResponse?.(aiResponse);

      // Generate and play speech
      this.config.onAudioStart?.();
      const audioBlob = await ElevenLabsService.generateSpeech(aiResponse, this.config.avatarPersonality);
      await this.playAudio(audioBlob);
      this.config.onAudioEnd?.();
    } catch (error) {
      console.error('Error in voice conversation:', error);
      this.config.onError?.(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.isProcessing = false;
    }
  }

  private async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      this.currentAudio = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        resolve();
      };
      
      audio.onerror = (event) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        const errorMessage = event.target && (event.target as HTMLAudioElement).error 
          ? `Audio error: ${(event.target as HTMLAudioElement).error?.message || 'Unknown audio error'}`
          : 'Failed to play audio: Unknown error';
        reject(new Error(errorMessage));
      };
      
      audio.play().catch((playError) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        const errorMessage = playError instanceof Error 
          ? `Audio playback failed: ${playError.message}`
          : 'Audio playback failed: Unknown error';
        reject(new Error(errorMessage));
      });
    });
  }

  isActive(): boolean {
    return this.isListening || this.isProcessing;
  }
}