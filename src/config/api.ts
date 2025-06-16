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
    console.warn(`Some API keys are missing: ${missingKeys.join(', ')}. Add them to your .env file for full functionality.`);
    return false;
  }
  return true;
};

// Create a fallback function to handle missing API keys
export const createFallbackResponse = (service: string, text: string) => {
  console.warn(`Using fallback for ${service} due to missing API key`);
  
  if (service === 'elevenlabs') {
    // Return a simple beep sound or text-to-speech using browser API
    return new Promise<Blob>((resolve) => {
      // Use browser's SpeechSynthesis if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Find a good voice
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.name.includes('Female')
        );
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        speechSynthesis.speak(utterance);
        
        // Create a simple beep sound as a blob
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const mediaStreamDestination = audioContext.createMediaStreamDestination();
        gainNode.connect(mediaStreamDestination);
        
        const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          resolve(audioBlob);
        };
        
        mediaRecorder.start();
        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
          mediaRecorder.stop();
          audioContext.close();
        }, 500);
      } else {
        // If speech synthesis is not available, just create a beep
        const audioBlob = new Blob([], { type: 'audio/wav' });
        resolve(audioBlob);
      }
    });
  }
  
  return null;
};

export const isConfigured = validateApiKeys();