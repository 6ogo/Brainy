import React from 'react';
import { Mic, MicOff, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { VoiceMode } from '../types';

export const VoiceControls: React.FC = () => {
  const { 
    voiceMode, 
    setVoiceMode, 
    isListening,
    setIsSpeaking
  } = useStore();
  
  const { startListening, stopListening } = useVoiceRecognition();

  const handleVoiceModeChange = (mode: VoiceMode) => {
    setVoiceMode(mode);
    if (mode === 'muted') {
      stopListening();
    }
  };

  const handlePushToTalk = (pressed: boolean) => {
    if (voiceMode === 'push-to-talk') {
      if (pressed) {
        startListening();
      } else {
        stopListening();
      }
    }
  };

  const toggleMute = () => {
    setIsSpeaking(false);
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          {/* Voice mode selector */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => handleVoiceModeChange('muted')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                voiceMode === 'muted'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MicOff className="h-4 w-4 mr-1" /> Off
            </button>
            <button
              onClick={() => handleVoiceModeChange('push-to-talk')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                voiceMode === 'push-to-talk'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Mic className="h-4 w-4 mr-1" /> Push-to-Talk
            </button>
            <button
              onClick={() => handleVoiceModeChange('continuous')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                voiceMode === 'continuous'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Volume2 className="h-4 w-4 mr-1" /> Continuous
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Push to talk button */}
          <button
            className={`h-12 w-12 rounded-full flex items-center justify-center focus:outline-none ${
              isListening && voiceMode === 'push-to-talk'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            disabled={voiceMode !== 'push-to-talk'}
            onMouseDown={() => handlePushToTalk(true)}
            onMouseUp={() => handlePushToTalk(false)}
            onTouchStart={() => handlePushToTalk(true)}
            onTouchEnd={() => handlePushToTalk(false)}
            aria-label="Push to talk"
          >
            <Mic className="h-6 w-6" />
          </button>
          
          {/* Volume control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="Mute"
            >
              <VolumeX className="h-5 w-5 text-gray-700" />
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="70"
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              aria-label="Volume"
            />
            
            <Volume2 className="h-5 w-5 text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
};