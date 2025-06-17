import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mock global SpeechRecognition for browsers that don't support it
if (typeof window !== 'undefined') {
  if (!('SpeechRecognition' in window)) {
    console.warn('SpeechRecognition not supported in this browser');
    window.SpeechRecognition = class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = 'en-US';
      onresult = null;
      onerror = null;
      onend = null;
      state = 'inactive';
      
      start() {
        console.warn('SpeechRecognition not supported in this browser');
        if (this.onerror) {
          this.onerror({ 
            error: 'not-supported', 
            message: 'SpeechRecognition not supported in this browser' 
          } as SpeechRecognitionErrorEvent);
        }
        if (this.onend) {
          this.onend({} as Event);
        }
      }
      
      stop() {
        if (this.onend) {
          this.onend({} as Event);
        }
      }
    } as any;
  }

  if (!('webkitSpeechRecognition' in window)) {
    window.webkitSpeechRecognition = window.SpeechRecognition;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);