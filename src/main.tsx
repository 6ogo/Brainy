import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mock global SpeechRecognition for browsers that don't support it
if (typeof window !== 'undefined') {
  if (!('SpeechRecognition' in window)) {
    (window as any).SpeechRecognition = class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = 'en-US';
      onresult = () => {};
      onerror = () => {};
      onend = () => {};
      start() {}
      stop() {}
    };
  }

  if (!('webkitSpeechRecognition' in window)) {
    (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);