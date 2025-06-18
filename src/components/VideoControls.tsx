import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Video, VideoOff, Image as ImageIcon, StopCircle, Settings, Mic, MicOff, Pause, Play, MessageSquare } from 'lucide-react';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { cn } from '../styles/utils';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { StudyModeToggle } from './StudyModeToggle';
import { StudyModeIndicator } from './StudyModeIndicator';

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
    setLearningMode,
    isStudyMode
  } = useStore();
  
  const navigate = useNavigate();
  const { isPaused, pauseVoiceChat, resumeVoiceChat } = useVoiceChat();
  const [showBackgrounds, setShowBackgrounds] = useState(false);

  const handleSwitchToTextChat = () => {
    setLearningMode('conversational');
    setVoiceMode('muted');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant={isVideoEnabled ? "primary" : "secondary"}
            size="sm"
            onClick={toggleVideo}
            className="rounded-full"
            title={isVideoEnabled ? 'Switch to voice-only mode' : 'Enable video mode'}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          {isVideoEnabled && (
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBackgrounds(!showBackgrounds)}
                className="rounded-full"
                title="Change background"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

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

          <Button
            variant={voiceMode !== 'muted' ? "primary" : "secondary"}
            size="sm"
            onClick={() => setVoiceMode(voiceMode === 'muted' ? 'continuous' : 'muted')}
            className="rounded-full"
            title={voiceMode === 'muted' ? 'Enable microphone' : 'Disable microphone'}
          >
            {voiceMode === 'muted' ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isPaused ? "primary" : "secondary"}
            size="sm"
            onClick={isPaused ? resumeVoiceChat : pauseVoiceChat}
            className="rounded-full"
            title={isPaused ? 'Resume conversation' : 'Pause conversation'}
          >
            {isPaused ? (
              <Play className="h-5 w-5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isRecording ? "primary" : "secondary"}
            size="sm"
            onClick={toggleRecording}
            className="rounded-full"
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <StopCircle className={cn("h-5 w-5", isRecording && "animate-pulse")} />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          {isStudyMode && <StudyModeIndicator />}
          
          <StudyModeToggle />
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSwitchToTextChat}
            className="rounded-full"
            title="Switch to text chat"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};