export const API_CONFIG = {
  // Existing API Keys
  TAVUS_API_KEY: import.meta.env.VITE_TAVUS_API_KEY || '',
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  TAVUS_REPLICA_ID: import.meta.env.VITE_TAVUS_REPLICA_ID || '',
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '',
  
  // Tavus Configuration
  TAVUS_BASE_URL: 'https://tavusapi.com/v2',
  TAVUS_TIMEOUT: 15000, // 15 seconds
  
  // Tavus Personas for different use cases
  TAVUS_PERSONAS: {
    STUDY_ADVISOR: 'pa0f81e3a6ca', // Main study advisor persona
    STUDENT_COUNSELOR: 'pa0f81e3a6ca', // Student counselor (can be same or different)
    SUBJECT_TUTOR: 'pa0f81e3a6ca', // Subject-specific tutor
  },
  
  // Tavus Conversation Properties
  TAVUS_CONVERSATION_DEFAULTS: {
    participant_left_timeout: 30,
    participant_absent_timeout: 60,
    enable_recording: false, // Privacy by default
    enable_closed_captions: true,
    apply_greenscreen: false,
    language: 'english'
  },
  
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
  },
  
  // Speech synthesis fallback settings
  SPEECH_SYNTHESIS_SETTINGS: {
    DEFAULT_RATE: 1.0,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 0.8,
    PERSONA_SETTINGS: {
      'encouraging-emma': { rate: 0.9, pitch: 1.1, volume: 0.8 },
      'challenge-charlie': { rate: 1.1, pitch: 0.9, volume: 0.9 },
      'fun-freddy': { rate: 1.2, pitch: 1.2, volume: 0.85 },
      'professor-patricia': { rate: 0.85, pitch: 1.0, volume: 0.8 },
      'buddy-ben': { rate: 1.0, pitch: 0.95, volume: 0.8 }
    }
  }
};

// User Limits Configuration
export const USER_LIMITS = {
  // Daily limits based on subscription level
  FREE: {
    daily_conversation_minutes: 30,    // 30 minutes daily conversation
    video_calls_enabled: false,        // No video calls
    video_call_duration_minutes: 0,    // No video call time
    available_subjects: ['Math', 'English'], // Only Math and English
    advanced_analytics: false,         // Basic progress tracking only
    downloadable_transcripts: false,   // No downloadable transcripts
    features: ['basic_chat', 'basic_progress']
  },
  PREMIUM: {
    daily_conversation_minutes: 240,   // 4 hours (240 minutes) daily
    video_calls_enabled: true,         // Video calls available
    video_call_duration_minutes: 10,   // 10 minute video calls
    available_subjects: ['Math', 'English', 'Science', 'History', 'Languages', 'Test Prep'], // All subjects
    advanced_analytics: true,          // Advanced analytics and insights
    downloadable_transcripts: true,    // Can download transcripts
    features: ['advanced_chat', 'video_calls', 'analytics', 'transcripts', 'all_subjects']
  },
  ULTIMATE: {
    daily_conversation_minutes: -1,    // Unlimited (-1 means unlimited)
    video_calls_enabled: true,         // Video calls available
    video_call_duration_minutes: 60,   // 60 minute video calls
    available_subjects: ['Math', 'English', 'Science', 'History', 'Languages', 'Test Prep'], // All subjects
    advanced_analytics: true,          // Advanced analytics and insights
    downloadable_transcripts: true,    // Can download transcripts
    features: ['unlimited_chat', 'extended_video_calls', 'analytics', 'transcripts', 'all_subjects', 'early_access']
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
  const warnings = [];
  
  // Required keys
  if (!API_CONFIG.GROQ_API_KEY) {
    missingKeys.push('VITE_GROQ_API_KEY');
  }
  
  // Optional but recommended keys
  if (!API_CONFIG.TAVUS_API_KEY) {
    warnings.push('VITE_TAVUS_API_KEY - Video conversations will be unavailable');
  }
  if (!API_CONFIG.ELEVENLABS_API_KEY) {
    warnings.push('VITE_ELEVENLABS_API_KEY - Voice features will use browser fallback');
  }
  if (!API_CONFIG.TAVUS_REPLICA_ID) {
    warnings.push('VITE_TAVUS_REPLICA_ID - Video conversations will be unavailable');
  }

  if (missingKeys.length > 0) {
    console.error(`Critical API keys missing: ${missingKeys.join(', ')}. Add them to your .env file.`);
    return false;
  }
  
  if (warnings.length > 0) {
    console.warn(`Optional API keys missing: ${warnings.join(', ')}`);
  }
  
  return true;
};

// Enhanced fallback function with improved voice handling
export const createFallbackResponse = (service: string, text: string, persona?: string) => {
  console.warn(`Using fallback for ${service} due to missing API key or service error`);
  
  if (service === 'elevenlabs') {
    return new Promise<Blob>((resolve) => {
      if ('speechSynthesis' in window && text) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Customize voice settings based on persona
        if (persona && API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS[persona as keyof typeof API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS]) {
          const settings = API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS[persona as keyof typeof API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.PERSONA_SETTINGS];
          utterance.rate = settings.rate;
          utterance.pitch = settings.pitch;
          utterance.volume = settings.volume;
        } else {
          // Default settings
          utterance.rate = API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.DEFAULT_RATE;
          utterance.pitch = API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.DEFAULT_PITCH;
          utterance.volume = API_CONFIG.SPEECH_SYNTHESIS_SETTINGS.DEFAULT_VOLUME;
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
            
            console.log(`Browser speech synthesis started for ${persona || 'default'} voice`);
            window.speechSynthesis.speak(utterance);
          };
        } else {
          const selectedVoice = selectVoiceForPersona(voices, persona);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          console.log(`Browser speech synthesis started for ${persona || 'default'} voice`);
          window.speechSynthesis.speak(utterance);
        }

        utterance.onstart = () => {
          console.log(`Browser speech synthesis started for ${persona || 'default'}`);
        };

        utterance.onend = () => {
          console.log(`Browser speech synthesis ended for ${persona || 'default'}`);
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

// Utility functions
export const getVoiceConfig = (persona: string) => {
  return VOICE_MAPPINGS[persona as keyof typeof VOICE_MAPPINGS] || DEFAULT_VOICE;
};

export const isElevenLabsConfigured = () => {
  return !!API_CONFIG.ELEVENLABS_API_KEY;
};

export const isTavusConfigured = () => {
  return !!(API_CONFIG.TAVUS_API_KEY && API_CONFIG.TAVUS_REPLICA_ID);
};

export const getUserLimits = (subscriptionLevel: string) => {
  const level = subscriptionLevel.toUpperCase() as keyof typeof USER_LIMITS;
  return USER_LIMITS[level] || USER_LIMITS.FREE;
};

export const hasSubjectAccess = (subscriptionLevel: string, subject: string) => {
  const limits = getUserLimits(subscriptionLevel);
  return limits.available_subjects.includes(subject);
};

export const canUseVideoCall = (subscriptionLevel: string) => {
  const limits = getUserLimits(subscriptionLevel);
  return limits.video_calls_enabled;
};

export const getVideoCallDuration = (subscriptionLevel: string) => {
  const limits = getUserLimits(subscriptionLevel);
  return limits.video_call_duration_minutes * 60; // Convert to seconds for Tavus API
};

export const hasAdvancedAnalytics = (subscriptionLevel: string) => {
  const limits = getUserLimits(subscriptionLevel);
  return limits.advanced_analytics;
};

export const canDownloadTranscripts = (subscriptionLevel: string) => {
  const limits = getUserLimits(subscriptionLevel);
  return limits.downloadable_transcripts;
};

// Export the validation result
export const isConfigured = validateApiKeys();