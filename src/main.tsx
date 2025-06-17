import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mock global SpeechRecognition for browsers that don't support it
if (typeof window !== 'undefined') {
  if (!('SpeechRecognition' in window)) {
    window.SpeechRecognition = class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = 'en-US';
      onresult = () => {};
      onerror = () => {};
      onend = () => {};
      start() {
        console.warn('SpeechRecognition not supported in this browser');
        if (this.onerror) {
          this.onerror({ error: 'not-supported', message: 'SpeechRecognition not supported in this browser' } as any);
        }
        if (this.onend) {
          this.onend();
        }
      }
      stop() {}
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