import { AvatarPersonality } from '../types';

interface SpeechSynthesisOptions {
  text: string;
  persona?: AvatarPersonality;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface PersonaVoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
}

// Default settings for each persona
const PERSONA_SETTINGS: Record<AvatarPersonality, PersonaVoiceSettings> = {
  'encouraging-emma': { rate: 0.9, pitch: 1.1, volume: 0.8 },
  'challenge-charlie': { rate: 1.1, pitch: 0.9, volume: 0.9 },
  'fun-freddy': { rate: 1.2, pitch: 1.2, volume: 0.85 },
  'professor-patricia': { rate: 0.85, pitch: 1.0, volume: 0.8 },
  'buddy-ben': { rate: 1.0, pitch: 0.95, volume: 0.8 }
};

// Default settings if no persona is specified
const DEFAULT_SETTINGS = {
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  language: 'en-US'
};

/**
 * Generates speech using the browser's SpeechSynthesis API
 * @returns A Promise that resolves when speech ends or rejects on error
 */
export const generateSpeech = (options: SpeechSynthesisOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    if (!options.text || options.text.trim().length === 0) {
      reject(new Error('Text cannot be empty'));
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(options.text);

      // Apply persona-specific settings if available
      if (options.persona && PERSONA_SETTINGS[options.persona]) {
        const settings = PERSONA_SETTINGS[options.persona];
        utterance.rate = options.rate ?? settings.rate;
        utterance.pitch = options.pitch ?? settings.pitch;
        utterance.volume = options.volume ?? settings.volume;
      } else {
        // Apply default or custom settings
        utterance.rate = options.rate ?? DEFAULT_SETTINGS.rate;
        utterance.pitch = options.pitch ?? DEFAULT_SETTINGS.pitch;
        utterance.volume = options.volume ?? DEFAULT_SETTINGS.volume;
      }

      utterance.lang = options.language ?? DEFAULT_SETTINGS.language;

      // Select appropriate voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const selectedVoice = selectVoiceForPersona(voices, options.persona);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // If voices aren't loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
          const availableVoices = window.speechSynthesis.getVoices();
          const selectedVoice = selectVoiceForPersona(availableVoices, options.persona);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          // Speak after voices are loaded
          window.speechSynthesis.speak(utterance);
        };
      }

      // Set up event handlers
      utterance.onstart = () => {
        console.log(`Browser speech synthesis started for ${options.persona || 'default'}`);
        options.onStart?.();
      };

      utterance.onend = () => {
        console.log(`Browser speech synthesis ended for ${options.persona || 'default'}`);
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Browser speech synthesis error:', event);
        const error = new Error(`Speech synthesis error: ${event.error || 'unknown error'}`);
        options.onError?.(error);
        reject(error);
      };

      // Start speaking if voices are already loaded
      if (voices.length > 0) {
        window.speechSynthesis.speak(utterance);
      }

      // Fallback in case onend doesn't fire (happens in some browsers)
      const estimatedDuration = Math.max(3000, options.text.length * 80); // ~80ms per character
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          console.log('Speech synthesis timeout - forcing completion');
          window.speechSynthesis.cancel();
          options.onEnd?.();
          resolve();
        }
      }, estimatedDuration);

    } catch (error) {
      console.error('Speech synthesis error:', error);
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      reject(error);
    }
  });
};

/**
 * Creates a silent audio blob for compatibility with audio interfaces
 * @returns A Blob containing a silent WAV file
 */
export const createSilentAudioBlob = (): Blob => {
  try {
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
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('Failed to create silent audio blob:', error);
    return new Blob([], { type: 'audio/wav' });
  }
};

/**
 * Selects the most appropriate voice for a given persona
 */
function selectVoiceForPersona(voices: SpeechSynthesisVoice[], persona?: AvatarPersonality): SpeechSynthesisVoice | null {
  // Persona-specific voice preferences
  const voicePreferences: Record<string, (voice: SpeechSynthesisVoice) => boolean> = {
    'encouraging-emma': (voice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('samantha') || voice.name.toLowerCase().includes('victoria')),
    
    'challenge-charlie': (voice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('alex') || voice.name.toLowerCase().includes('daniel')),
    
    'fun-freddy': (voice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('fred') || voice.name.toLowerCase().includes('tom')),
    
    'professor-patricia': (voice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('karen') || voice.name.toLowerCase().includes('susan')),
    
    'buddy-ben': (voice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark'))
  };

  // Try persona-specific voice first
  if (persona && voicePreferences[persona]) {
    const preferredVoice = voices.find(voicePreferences[persona]);
    if (preferredVoice) return preferredVoice;
  }

  // Fallback to best English voice
  const priorities = [
    (voice: SpeechSynthesisVoice) => voice.lang.startsWith('en-US') && voice.localService,
    (voice: SpeechSynthesisVoice) => voice.lang.startsWith('en-') && voice.localService,
    (voice: SpeechSynthesisVoice) => voice.lang.startsWith('en-US'),
    (voice: SpeechSynthesisVoice) => voice.lang.startsWith('en-'),
    (voice: SpeechSynthesisVoice) => voice.default
  ];

  for (const priorityFn of priorities) {
    const voice = voices.find(priorityFn);
    if (voice) return voice;
  }

  return voices[0] || null;
}

/**
 * Checks if speech synthesis is supported in the current browser
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

/**
 * Gets all available voices for speech synthesis
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};