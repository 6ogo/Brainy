import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker
registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Mock global SpeechRecognition for browsers that don't support it
if (!('SpeechRecognition' in window)) {
  window.SpeechRecognition = class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = 'en-US';
    onresult = () => {};
    onerror = () => {};
    onend = () => {};
    start() {}
    stop() {}
  } as unknown as typeof window.SpeechRecognition;
}

if (!('webkitSpeechRecognition' in window)) {
  window.webkitSpeechRecognition = window.SpeechRecognition;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);