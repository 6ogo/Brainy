export const API_CONFIG = {
  TAVUS_API_KEY: import.meta.env.VITE_TAVUS_API_KEY || '',
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
};

export const validateApiKeys = () => {
  if (!API_CONFIG.TAVUS_API_KEY) {
    console.error('Missing Tavus API key. Set VITE_TAVUS_API_KEY in your .env file');
    return false;
  }
  if (!API_CONFIG.ELEVENLABS_API_KEY) {
    console.error('Missing ElevenLabs API key. Set VITE_ELEVENLABS_API_KEY in your .env file');
    return false;
  }
  return true;
};