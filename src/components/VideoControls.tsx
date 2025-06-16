import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Video, VideoOff, Image as ImageIcon, StopCircle, Settings, Mic, MicOff, Pause, Play } from 'lucide-react';
import { cn } from '../styles/utils';

const backgrounds = [
  { id: 'classroom', name: 'Classroom' },
  { id: 'library', name: 'Library' },
  { id: 'home-office', name: 'Home Office' },
  { id: 'futuristic', name: 'Futuristic' },
];

export const VideoControls: React.FC = () => {
  const { 
    isVideoEnabled,
    isRecording,
    currentBackground,
    toggleVideo,
    toggleRecording,
    setCurrentBackground,
    voiceMode,
    setVoiceMode,
    isSpeaking
  } = useStore();

  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    // In a real implementation, this would pause/resume the voice chat
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-black/50 rounded-full px-4 py-2">
      <button
        onClick={toggleVideo}
        className={`p-2 rounded-full ${
          isVideoEnabled ? 'bg-primary-500 text-white' : 'bg-gray-600 text-gray-200'
        }`}
        title={isVideoEnabled ? 'Switch to voice-only mode' : 'Enable video mode'}
      >
        {isVideoEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </button>

      {isVideoEnabled && (
        <div className="relative">
          <button
            onClick={() => setShowBackgrounds(!showBackgrounds)}
            className="p-2 rounded-full hover:bg-gray-700/50"
            title="Change background"
          >
            <ImageIcon className="h-5 w-5 text-white" />
          </button>

          {showBackgrounds && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg py-2 min-w-[160px] z-10">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    currentBackground === bg.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => {
                    setCurrentBackground(bg.id as any);
                    setShowBackgrounds(false);
                  }}
                >
                  {bg.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setVoiceMode(voiceMode === 'muted' ? 'push-to-talk' : 'muted')}
        className={`p-2 rounded-full ${
          voiceMode !== 'muted' ? 'bg-primary-500 text-white' : 'bg-gray-600 text-gray-200'
        }`}
        title={voiceMode === 'muted' ? 'Enable microphone' : 'Disable microphone'}
      >
        {voiceMode === 'muted' ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      <button
        onClick={handlePauseResume}
        className={`p-2 rounded-full ${
          isPaused ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
        }`}
        title={isPaused ? 'Resume conversation' : 'Pause conversation'}
      >
        {isPaused ? (
          <Play className="h-5 w-5" />
        ) : (
          <Pause className="h-5 w-5" />
        )}
      </button>

      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full ${
          isRecording ? 'bg-error-500 text-white' : 'hover:bg-gray-700/50 text-white'
        }`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <StopCircle className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
      </button>

      <button
        className="p-2 rounded-full hover:bg-gray-700/50"
        title="Video settings"
      >
        <Settings className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};