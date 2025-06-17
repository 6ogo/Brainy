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
      onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
      onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null;
      onend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      
      start() {
        console.warn('SpeechRecognition not supported in this browser');
        if (this.onerror) {
          const errorEvent = new Event('error') as SpeechRecognitionErrorEvent;
          (errorEvent as any).error = 'not-supported';
          (errorEvent as any).message = 'SpeechRecognition not supported in this browser';
          this.onerror(errorEvent);
        }
        if (this.onend) {
          this.onend(new Event('end'));
        }
      }
      
      stop() {
        if (this.onend) {
          this.onend(new Event('end'));
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