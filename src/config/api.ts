export const API_CONFIG = {
  TAVUS_API_KEY: import.meta.env.VITE_TAVUS_API_KEY || '',
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  TAVUS_REPLICA_ID: import.meta.env.VITE_TAVUS_REPLICA_ID || '',
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '',
};

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
    console.error(`Missing required API keys: ${missingKeys.join(', ')}. Add them to your .env file.`);
    return false;
  }
  return true;
};

export const isConfigured = validateApiKeys();