import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Video, VideoOff, Image as ImageIcon, StopCircle, Settings, Mic, MicOff, Pause, Play } from 'lucide-react';
import { useVoiceChat } from '../hooks/useVoiceChat';
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
    isSpeaking,
    difficultyLevel
  } = useStore();
  
  const { isPaused, pauseVoiceChat, resumeVoiceChat } = useVoiceChat();
  const [showBackgrounds, setShowBackgrounds] = useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-10">
      <button
        onClick={toggleVideo}
        className={cn(
          "p-2.5 rounded-full transition-colors",
          isVideoEnabled 
            ? "bg-primary-500 text-white hover:bg-primary-600" 
            : "bg-gray-600 text-gray-200 hover:bg-gray-700"
        )}
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
            className="p-2.5 rounded-full text-white hover:bg-gray-700/50 transition-colors"
            title="Change background"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {showBackgrounds && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg py-2 min-w-[160px] z-10">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors",
                    currentBackground === bg.id
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-gray-50 text-gray-700"
                  )}
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
        className={cn(
          "p-2.5 rounded-full transition-colors",
          voiceMode !== 'muted' 
            ? "bg-primary-500 text-white hover:bg-primary-600" 
            : "bg-gray-600 text-gray-200 hover:bg-gray-700"
        )}
        title={voiceMode === 'muted' ? 'Enable microphone' : 'Disable microphone'}
      >
        {voiceMode === 'muted' ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      <button
        onClick={isPaused ? resumeVoiceChat : pauseVoiceChat}
        className={cn(
          "p-2.5 rounded-full transition-colors",
          isPaused 
            ? "bg-green-500 text-white hover:bg-green-600" 
            : "bg-gray-600 text-white hover:bg-gray-700"
        )}
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
        className={cn(
          "p-2.5 rounded-full transition-colors",
          isRecording 
            ? "bg-red-500 text-white hover:bg-red-600" 
            : "bg-gray-600 text-white hover:bg-gray-700"
        )}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <StopCircle className={cn("h-5 w-5", isRecording && "animate-pulse")} />
      </button>

      <button
        className="p-2.5 rounded-full text-white hover:bg-gray-700/50 transition-colors"
        title="Video settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  );
};