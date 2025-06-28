// AI Model Configuration
export const AI_MODELS = {
  GROQ: {
    DEFAULT: 'llama-3.3-70b-versatile',
    FAST: 'llama-3.3-8b-instant',
    BALANCED: 'llama-3.3-8b-versatile'
  },
  ELEVENLABS: {
    REAL_TIME: 'eleven_flash_v2_5',
    HIGH_QUALITY: 'eleven_multilingual_v2',
    BALANCED: 'eleven_turbo_v2_5'
  }
};

// AI Generation Parameters
export const GENERATION_PARAMS = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1024,
  STUDY_MODE_TEMPERATURE: 0.5,
  STUDY_MODE_MAX_TOKENS: 1500,
  SUMMARY_TEMPERATURE: 0.3,
  SUMMARY_MAX_TOKENS: 100
};

// Voice Settings
export const VOICE_SETTINGS = {
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
};

// Voice IDs for ElevenLabs
export const VOICE_IDS = {
  'encouraging-emma': 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, encouraging female voice
  'challenge-charlie': 'VR6AewLTigWG4xSOukaG', // Josh - confident, challenging male voice
  'fun-freddy': 'pNInz6obpgDQGcFmaJgB', // Adam - energetic, fun male voice
  'professor-patricia': 'ThT5KcBeYPX3keUQqHPh', // Professional female voice
  'buddy-ben': 'yoZ06aMxZJJ28mfd3POQ' // Friendly casual male voice
};

// API Timeouts
export const API_TIMEOUTS = {
  ELEVENLABS: 15000, // 15 seconds
  GROQ: 30000, // 30 seconds
  TAVUS: 15000 // 15 seconds
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  INITIAL_BACKOFF: 1000, // 1 second
  MAX_BACKOFF: 5000 // 5 seconds
};

// Rate Limits
export const RATE_LIMITS = {
  CONVERSATION: {
    MAX_REQUESTS: 50,
    WINDOW_MS: 60 * 1000 // 1 minute
  },
  AUTH: {
    MAX_REQUESTS: 5,
    WINDOW_MS: 15 * 60 * 1000 // 15 minutes
  },
  API: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000 // 1 minute
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  UNAUTHORIZED: 'You need to be signed in to access this feature.',
  PERMISSION_DENIED: 'You don\'t have permission to access this resource.',
  SUBSCRIPTION_REQUIRED: 'This feature requires a premium subscription.',
  DAILY_LIMIT_REACHED: 'You\'ve reached your daily usage limit. Upgrade your plan for more.',
  MICROPHONE_ACCESS: 'Microphone access is required for voice features.',
  BROWSER_SUPPORT: 'Your browser doesn\'t support this feature. Please try Chrome, Edge, or Safari.',
  VOICE_SERVICE: 'Voice service is temporarily unavailable. Please try text mode instead.',
  GENERAL: 'Something went wrong. Please try again later.'
};

// Difficulty Levels
export enum DIFFICULTY_LEVEL {
  ELEMENTARY = 'Elementary',
  HIGH_SCHOOL = 'High School',
  COLLEGE = 'College',
  ADVANCED = 'Advanced'
}

// Learning Modes
export enum LEARNING_MODE {
  CONVERSATIONAL = 'conversational',
  VIDEOCALL = 'videocall'
}

// Voice Modes
export enum VOICE_MODE {
  MUTED = 'muted',
  PUSH_TO_TALK = 'push-to-talk',
  CONTINUOUS = 'continuous'
}

// Avatar Personalities
export enum AVATAR_PERSONALITY {
  ENCOURAGING_EMMA = 'encouraging-emma',
  CHALLENGE_CHARLIE = 'challenge-charlie',
  FUN_FREDDY = 'fun-freddy',
  PROFESSOR_PATRICIA = 'professor-patricia',
  BUDDY_BEN = 'buddy-ben'
}

// Avatar Backgrounds
export enum AVATAR_BACKGROUND {
  CLASSROOM = 'classroom',
  LIBRARY = 'library',
  HOME_OFFICE = 'home-office',
  FUTURISTIC = 'futuristic'
}

// Avatar Emotions
export enum AVATAR_EMOTION {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  THINKING = 'thinking',
  EXCITED = 'excited',
  CONCERNED = 'concerned'
}

// Subjects
export enum SUBJECT {
  MATH = 'Math',
  SCIENCE = 'Science',
  ENGLISH = 'English',
  HISTORY = 'History',
  LANGUAGES = 'Languages',
  TEST_PREP = 'Test Prep',
  ALL = 'All'
}