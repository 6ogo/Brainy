// Application-wide constants

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ONBOARDING: '/onboarding',
  SUBJECTS: '/subjects',
  TEACHERS: '/teachers',
  LEARNING_MODE: '/learning-mode',
  STUDY: '/study',
  STUDY_ADVISOR: '/study-advisor',
  ANALYTICS: '/analytics',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  FAQ: '/faq',
  HELP: '/help',
  BLOG: '/blog',
  CAREERS: '/careers',
  TUTOR: '/tutor',
  PERSONALIZED_LEARNING: '/personalized-learning',
  CONTEXT_ANALYTICS: '/context-analytics'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'brainbud_auth_token',
  USER_ID: 'brainbud_user_id',
  USER_PREFERENCES: 'brainbud_user_preferences',
  VOICE_MODE: 'brainbud_voice_mode',
  VOICE_SETTINGS: 'brainbud_voice_settings',
  THEME: 'brainbud_theme',
  ONBOARDING_COMPLETED: 'brainbud_onboarding_completed',
  LAST_SUBJECT: 'brainbud_last_subject',
  LAST_TEACHER: 'brainbud_last_teacher'
};

// Session Storage Keys
export const SESSION_KEYS = {
  CSRF_TOKEN: 'brainbud_csrf_token',
  SESSION_ID: 'brainbud_session_id',
  TEMP_AUTH: 'brainbud_temp_auth'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  CONVERSATIONS: '/conversations',
  ANALYTICS: '/analytics',
  SUBSCRIPTIONS: '/subscriptions',
  LEARNING_PATHS: '/learning-paths',
  ACHIEVEMENTS: '/achievements'
};

// UI Constants
export const UI = {
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 4000,
  MAX_MOBILE_WIDTH: 768,
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 80,
  DEFAULT_PADDING: 16,
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    FULL: 9999
  }
};

// Time Constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
  
  // Timeouts
  DEBOUNCE_TIMEOUT: 300,
  SEARCH_DEBOUNCE: 500,
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  TOKEN_REFRESH_INTERVAL: 55 * 60 * 1000 // 55 minutes
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ULTIMATE: 'ultimate'
};

// Subscription Limits
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    DAILY_CONVERSATION_MINUTES: 30,
    VIDEO_CALL_MINUTES: 0,
    SUBJECTS: ['Math', 'English'],
    ADVANCED_ANALYTICS: false,
    DOWNLOADABLE_TRANSCRIPTS: false,
    EARLY_ACCESS: false
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    DAILY_CONVERSATION_MINUTES: 240,
    VIDEO_CALL_MINUTES: 30,
    SUBJECTS: ['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'],
    ADVANCED_ANALYTICS: true,
    DOWNLOADABLE_TRANSCRIPTS: true,
    EARLY_ACCESS: false
  },
  [SUBSCRIPTION_TIERS.ULTIMATE]: {
    DAILY_CONVERSATION_MINUTES: -1, // Unlimited
    VIDEO_CALL_MINUTES: 60,
    SUBJECTS: ['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'],
    ADVANCED_ANALYTICS: true,
    DOWNLOADABLE_TRANSCRIPTS: true,
    EARLY_ACCESS: true
  }
};

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'network_error',
  AUTHENTICATION_ERROR: 'auth_error',
  PERMISSION_ERROR: 'permission_error',
  VALIDATION_ERROR: 'validation_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  SERVER_ERROR: 'server_error',
  NOT_FOUND: 'not_found',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown_error'
};

// App Info
export const APP_INFO = {
  NAME: 'Brainbud',
  VERSION: '0.1.0',
  DESCRIPTION: 'Your personal AI tutor for interactive learning',
  COMPANY: 'Brainbud Education, Inc.',
  CONTACT_EMAIL: 'info@learny.se',
  SUPPORT_EMAIL: 'support@learny.se',
  WEBSITE: 'https://brainbud.app',
  SOCIAL: {
    TWITTER: 'https://twitter.com/brainbudapp',
    FACEBOOK: 'https://facebook.com/brainbudapp',
    INSTAGRAM: 'https://instagram.com/brainbudapp',
    LINKEDIN: 'https://linkedin.com/company/brainbudapp'
  },
  COPYRIGHT: `© ${new Date().getFullYear()} Brainbud Education, Inc. All rights reserved.`
};