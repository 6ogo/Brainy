import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/store';

export const useVoiceRecognition = () => {
  const { 
    isListening, 
    voiceMode, 
    toggleListening, 
    addMessage 
  } = useStore();
  
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = voiceMode === 'continuous';
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      setRecognition(recognitionInstance);
      setError(null);
    } else {
      setError('Speech recognition is not supported in this browser');
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [voiceMode]);

  // Configure recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        addMessage(transcript, 'user');
        
        // Mock AI response for demonstration
        setTimeout(() => {
          const responses = [
            "That's a great question about derivatives! Let me explain the concept using a simple example...",
            "I understand your confusion. In mathematics, especially calculus, we often need to visualize the problem. Imagine...",
            "Let's break down this history question. The events leading to World War I were complex, involving...",
            "When analyzing this literature passage, pay attention to the author's use of symbolism...",
          ];
          
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          addMessage(randomResponse, 'ai');
        }, 1500);
      }
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      toggleListening();
    };

    recognition.onend = () => {
      // Auto restart if in continuous mode and still supposed to be listening
      if (voiceMode === 'continuous' && isListening) {
        recognition.start();
      } else if (voiceMode === 'push-to-talk') {
        toggleListening();
      }
    };
  }, [recognition, addMessage, toggleListening, isListening, voiceMode]);

  // Start/stop recognition based on isListening state
  useEffect(() => {
    if (!recognition) return;
    
    if (isListening && voiceMode !== 'muted') {
      try {
        recognition.start();
      } catch (e) {
        // Handle the case where recognition is already started
      }
    } else {
      try {
        recognition.stop();
      } catch (e) {
        // Handle the case where recognition is already stopped
      }
    }
  }, [isListening, recognition, voiceMode]);

  const startListening = useCallback(() => {
    if (!isListening && voiceMode !== 'muted') {
      toggleListening();
    }
  }, [isListening, toggleListening, voiceMode]);

  const stopListening = useCallback(() => {
    if (isListening) {
      toggleListening();
    }
  }, [isListening, toggleListening]);

  return {
    isListening,
    startListening,
    stopListening,
    error,
  };
};