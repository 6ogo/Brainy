import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Volume1, VolumeX, Download, AlertCircle, Pause, Play } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VoiceMode } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../styles/utils';

export const VoiceControls: React.FC = () => {
  const { 
    voiceMode, 
    setVoiceMode, 
    isListening,
    setIsSpeaking,
    isRecording,
    toggleRecording,
    learningMode,
    isSpeaking
  } = useStore();
  
  const { 
    startListening, 
    stopListening, 
    hasPermission, 
    requestPermission,
    error: recognitionError 
  } = useVoiceRecognition();
  
  const { isActive, startVoiceChat, stopVoiceChat } = useVoiceChat();
  const [volume, setVolume] = useState(70);
  const [isPaused, setIsPaused] = useState(false);

  // Ensure voice mode is appropriate for learning mode
  useEffect(() => {
    if (learningMode === 'videocall' && voiceMode === 'muted') {
      setVoiceMode('push-to-talk');
    }
  }, [learningMode, voiceMode, setVoiceMode]);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    
    // Apply volume to all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = newVolume / 100;
    });
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      startVoiceChat();
    } else {
      stopVoiceChat();
    }
  };

  return (
    <div className="p-6 bg-white border-t border-gray-200 rounded-b-lg">
      {/* Permission Request Banner */}
      {!hasPermission && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Voice mode selector */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => handleVoiceModeChange('muted')}
              className={`flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                voiceMode === 'muted'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MicOff className="h-4 w-4 mr-2" /> Off
            </button>
            <button
              onClick={() => handleVoiceModeChange('push-to-talk')}
              className={`flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                voiceMode === 'push-to-talk'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={!hasPermission}
            >
              <Mic className="h-4 w-4 mr-2" /> Push-to-Talk
            </button>
            <button
              onClick={() => handleVoiceModeChange('continuous')}
              className={`flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center ${
                voiceMode === 'continuous'
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={!hasPermission}
            >
              <Volume2 className="h-4 w-4 mr-2" /> Continuous
            </button>
          </div>

          {/* Push to talk button */}
          <div className="flex items-center justify-center">
            <button
              className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center focus:outline-none transition-all",
                isListening && voiceMode === 'push-to-talk'
                  ? "bg-primary-500 text-white scale-110 shadow-lg"
                  : hasPermission
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed"
              )}
              disabled={voiceMode !== 'push-to-talk' || !hasPermission}
              onMouseDown={() => handlePushToTalk(true)}
              onMouseUp={() => handlePushToTalk(false)}
              onTouchStart={() => handlePushToTalk(true)}
              onTouchEnd={() => handlePushToTalk(false)}
              aria-label="Push to talk"
            >
              <Mic className="h-8 w-8" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pause/Resume and Recording controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePauseResume}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                isPaused
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isPaused ? 'Resume Conversation' : 'Pause Conversation'}
              disabled={!hasPermission}
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  <span>Pause</span>
                </>
              )}
            </button>
            
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
              <Download className="h-5 w-5 mr-2" />
              <span>{isRecording ? 'Stop Recording' : 'Record'}</span>
            </button>
          </div>
          
          {/* Volume control */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Volume</span>
              <span className="text-sm text-gray-500">{volume}%</span>
            </div>
            <div className="flex items-center space-x-3">
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
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                aria-label="Volume"
              />
              
              <Volume2 className="h-5 w-5 text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-4">
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
          
          {isSpeaking && (
            <span className="flex items-center text-primary-600">
              <div className="w-2 h-2 rounded-full mr-2 bg-primary-500 animate-pulse"></div>
              AI Speaking
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