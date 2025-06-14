import React from 'react';
import { Mic, MicOff, Volume2, Volume1, VolumeX, Download, AlertCircle } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VoiceMode } from '../types';
import toast from 'react-hot-toast';

export const VoiceControls: React.FC = () => {
  const { 
    voiceMode, 
    setVoiceMode, 
    isListening,
    setIsSpeaking,
    isRecording,
    toggleRecording
  } = useStore();
  
  const { 
    startListening, 
    stopListening, 
    hasPermission, 
    requestPermission,
    error: recognitionError 
  } = useVoiceRecognition();
  const { isActive, startVoiceChat, stopVoiceChat } = useVoiceChat();

  const handleVoiceModeChange = async (mode: VoiceMode) => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Microphone permission required for voice features');
        return;
      }
    }
    
    setVoiceMode(mode);
    if (mode === 'muted') {
      stopListening();
      stopVoiceChat();
    } else if (mode === 'continuous') {
      startVoiceChat();
    }
  };

  const handlePushToTalk = async (pressed: boolean) => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }
    
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
    stopVoiceChat();
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Microphone access granted! You can now use voice features.');
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
      {/* Permission Request Banner */}
      {!hasPermission && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                Microphone Access Required
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Enable microphone access to use voice features like speech recognition and voice commands.
              </p>
              <button
                onClick={handleRequestPermission}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
              >
                Enable Microphone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {recognitionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{recognitionError}</p>
              {recognitionError.includes('denied') && (
                <button
                  onClick={handleRequestPermission}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
              disabled={!hasPermission}
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
              disabled={!hasPermission}
            >
              <Volume2 className="h-4 w-4 mr-1" /> Continuous
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Recording control */}
          <button
            onClick={() => toggleRecording()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            disabled={!hasPermission}
          >
            <Download className="h-5 w-5" />
            <span>{isRecording ? 'Stop Recording' : 'Record'}</span>
          </button>

          {/* Push to talk button */}
          <button
            className={`h-12 w-12 rounded-full flex items-center justify-center focus:outline-none transition-all ${
              isListening && voiceMode === 'push-to-talk'
                ? 'bg-primary-500 text-white scale-110'
                : hasPermission
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            disabled={voiceMode !== 'push-to-talk' || !hasPermission}
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

      {/* Status indicators */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className={`flex items-center ${hasPermission ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {hasPermission ? 'Microphone Ready' : 'Microphone Access Needed'}
          </span>
          
          {voiceMode !== 'muted' && hasPermission && (
            <span className={`flex items-center ${isListening ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
              {isListening ? 'Listening...' : 'Ready to Listen'}
            </span>
          )}
        </div>
        
        <div className="text-xs">
          Mode: {voiceMode === 'muted' ? 'Off' : voiceMode === 'push-to-talk' ? 'Push-to-Talk' : 'Continuous'}
        </div>
      </div>
    </div>
  );
};