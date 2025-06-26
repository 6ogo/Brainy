export const API_CONFIG = {
  // Existing API Keys
  TAVUS_API_KEY: import.meta.env.VITE_TAVUS_API_KEY || '',
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  TAVUS_REPLICA_ID: import.meta.env.VITE_TAVUS_REPLICA_ID || '',
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '',
  
  // Enhanced ElevenLabs Configuration
  ELEVENLABS_BASE_URL: 'https://api.elevenlabs.io/v1',
  ELEVENLABS_TIMEOUT: 10000, // 10 seconds
  
  // ElevenLabs Models - Optimized for different use cases
  ELEVENLABS_MODELS: {
    REAL_TIME: 'eleven_flash_v2_5',      // Ultra-low latency (~75ms) for voice chat
    HIGH_QUALITY: 'eleven_multilingual_v2', // Best quality for important content
    BALANCED: 'eleven_turbo_v2_5'        // Good balance of quality and speed
  },
  
  // Default voice settings for conversational AI
  ELEVENLABS_VOICE_SETTINGS: {
    stability: 0.5,           // Moderate stability for natural variation
    similarity_boost: 0.8,    // High similarity to original voice
    style: 0.6,              // Moderate style amplification
    use_speaker_boost: true   // Enhanced clarity for voice chat
  }
};

// Enhanced Voice Mappings with Personality-Specific Settings
export const VOICE_MAPPINGS = {
  'encouraging-emma': {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, encouraging female voice
    model: API_CONFIG.ELEVENLABS_MODELS.REAL_TIME,
    settings: {
      ...API_CONFIG.ELEVENLABS_VOICE_SETTINGS,
      stability: 0.6, // More stable for encouraging, supportive tone
      style: 0.4,     // Less dramatic for gentle approach
      similarity_boost: 0.85 // High similarity for consistency
    },
    description: 'Warm, supportive female voice perfect for encouragement'
  },
  'challenge-charlie': {
    voiceId: 'VR6AewLTigWG4xSOukaG', // Josh - confident, challenging male voice
    model: API_CONFIG.ELEVENLABS_MODELS.REAL_TIME,
    settings: {
      ...API_CONFIG.ELEVENLABS_VOICE_SETTINGS,
      stability: 0.4, // Less stable for more dynamic, challenging speech
      style: 0.8,     // Higher style for more dramatic delivery
      similarity_boost: 0.9 // Very high similarity for strong personality
    },
    description: 'Confident, dynamic male voice for challenging questions'
  },
  'fun-freddy': {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - energetic, fun male voice
    model: API_CONFIG.ELEVENLABS_MODELS.REAL_TIME,
    settings: {
      ...API_CONFIG.ELEVENLABS_VOICE_SETTINGS,
      stability: 0.3, // Low stability for energetic, animated speech
      style: 0.9,     // Very high style for fun, expressive delivery
      similarity_boost: 0.75 // Moderate similarity for more variation
    },
    description: 'Energetic, animated male voice for engaging learning'
  },
  'professor-patricia': {
    voiceId: 'ThT5KcBeYPX3keUQqHPh', // Professional female voice
    model: API_CONFIG.ELEVENLABS_MODELS.HIGH_QUALITY, // Use high quality for formal education
    settings: {
      ...API_CONFIG.ELEVENLABS_VOICE_SETTINGS,
      stability: 0.8, // Very stable for professional, academic tone
      style: 0.2,     // Minimal style for formal, clear delivery
      similarity_boost: 0.9 // High similarity for consistent professionalism
    },
    description: 'Professional, academic female voice for formal learning'
  },
  'buddy-ben': {
    voiceId: 'yoZ06aMxZJJ28mfd3POQ', // Friendly casual male voice
    model: API_CONFIG.ELEVENLABS_MODELS.BALANCED,
    settings: {
      ...API_CONFIG.ELEVENLABS_VOICE_SETTINGS,
      stability: 0.6, // Balanced stability for friendly conversation
      style: 0.5,     // Moderate style for casual but clear delivery
      similarity_boost: 0.8 // Good similarity for consistency
    },
    description: 'Friendly, casual male voice for peer-to-peer learning'
  }
};

// Default fallback voice configuration
export const DEFAULT_VOICE = VOICE_MAPPINGS['encouraging-emma'];

// Enhanced validation function
export const validateApiKeys = () => {
  const missingKeys = [];
  
  if (!API_CONFIG.TAVUS_API_KEY) {
    missingKeys.push('VITE_TAVUS_API_KEY');
  }
  if (!API_CONFIG.ELEVENLABS_API_KEY) {
    missingKeys.push('VITE_ELEVENLABS_API_KEY');
  }
  if (!API_CONFIG.TAVUS_REPLICA_ID) {
    missingKeys.push('VITE_TAVUS_REPLICA_ID');
  }
  if (!API_CONFIG.GROQ_API_KEY) {
    missingKeys.push('VITE_GROQ_API_KEY');
  }

  if (missingKeys.length > 0) {
    console.warn(`Some API keys are missing: ${missingKeys.join(', ')}. Add them to your .env file for full functionality.`);
    return false;
  }
  return true;
};

// Enhanced fallback function with improved voice handling
export const createFallbackResponse = (service: string, text: string, persona?: string) => {
  console.warn(`Using fallback for ${service} due to missing API key or service error`);
  
  if (service === 'elevenlabs') {
    return new Promise<Blob>((resolve) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Customize voice settings based on persona
        switch (persona) {
          case 'encouraging-emma':
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 0.8;
            break;
          case 'challenge-charlie':
            utterance.rate = 1.1;
            utterance.pitch = 0.9;
            utterance.volume = 0.9;
            break;
          case 'fun-freddy':
            utterance.rate = 1.2;
            utterance.pitch = 1.2;
            utterance.volume = 0.85;
            break;
          case 'professor-patricia':
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            break;
          case 'buddy-ben':
            utterance.rate = 1.0;
            utterance.pitch = 0.95;
            utterance.volume = 0.8;
            break;
          default:
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
        }
        
        // Find the best voice for the persona
        let voices = window.speechSynthesis.getVoices();
        
        // If voices aren't loaded yet, wait for them
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            const selectedVoice = selectVoiceForPersona(voices, persona);
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
          };
        } else {
          const selectedVoice = selectVoiceForPersona(voices, persona);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          window.speechSynthesis.speak(utterance);
        }

        utterance.onstart = () => {
          console.log(`Browser speech synthesis started for ${persona}`);
        };

        utterance.onend = () => {
          console.log(`Browser speech synthesis ended for ${persona}`);
        };

        utterance.onerror = (event) => {
          console.error('Browser speech synthesis error:', event.error);
        };
      }

      // Return a minimal blob for compatibility
      const silentBlob = createSilentAudioBlob();
      resolve(silentBlob);
    });
  }
  
  return null;
};

// Helper function to select the best voice for each persona
function selectVoiceForPersona(voices: SpeechSynthesisVoice[], persona?: string): SpeechSynthesisVoice | null {
  // Persona-specific voice preferences
  const voicePreferences = {
    'encouraging-emma': (voice: SpeechSynthesisVoice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('samantha') || voice.name.toLowerCase().includes('victoria')),
    
    'challenge-charlie': (voice: SpeechSynthesisVoice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('alex') || voice.name.toLowerCase().includes('daniel')),
    
    'fun-freddy': (voice: SpeechSynthesisVoice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('fred') || voice.name.toLowerCase().includes('tom')),
    
    'professor-patricia': (voice: SpeechSynthesisVoice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('karen') || voice.name.toLowerCase().includes('susan')),
    
    'buddy-ben': (voice: SpeechSynthesisVoice) => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark'))
  };

  // Try persona-specific voice first
  if (persona && voicePreferences[persona as keyof typeof voicePreferences]) {
    const preferredVoice = voices.find(voicePreferences[persona as keyof typeof voicePreferences]);
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

// Helper function to create a silent audio blob
function createSilentAudioBlob(): Blob {
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
}

// Utility function to get voice configuration for a persona
export const getVoiceConfig = (persona: string) => {
  return VOICE_MAPPINGS[persona as keyof typeof VOICE_MAPPINGS] || DEFAULT_VOICE;
};

// Check if ElevenLabs is properly configured
export const isElevenLabsConfigured = () => {
  return !!API_CONFIG.ELEVENLABS_API_KEY;
};

// Export the validation result
export const isConfigured = validateApiKeys();