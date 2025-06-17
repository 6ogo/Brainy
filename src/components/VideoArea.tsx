import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VideoControls } from './VideoControls';
import { VoiceControls } from './VoiceControls';
import { TavusService } from '../services/tavusService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../styles/utils';

export const VideoArea: React.FC = () => {
  const { 
    isListening,
    isSpeaking,
    isVideoEnabled,
    currentBackground,
    avatarEmotion,
    voiceMode,
    difficultyLevel
  } = useStore();
  
  const { user } = useAuth();
  const { error: recognitionError } = useVoiceRecognition();
  const { isActive, error: voiceChatError, isPaused, currentTranscript } = useVoiceChat();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isEligibleForTavus, setIsEligibleForTavus] = useState(false);
  const [tavusVideoUrl, setTavusVideoUrl] = useState<string | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 1000);

    // Check Tavus eligibility
    if (user) {
      TavusService.checkEligibilityForTavus(user.id)
        .then(eligible => {
          setIsEligibleForTavus(eligible);
        })
        .catch(error => {
          console.error('Error checking Tavus eligibility:', error);
        });
    }

    return () => clearTimeout(timer);
  }, [user]);

  // Add subtle animation to avatar when speaking
  useEffect(() => {
    if (avatarRef.current) {
      if (isSpeaking && !isPaused) {
        avatarRef.current.classList.add('animate-pulse-slow');
      } else {
        avatarRef.current.classList.remove('animate-pulse-slow');
      }
    }
  }, [isSpeaking, isPaused]);

  if (!isEligibleForTavus) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg p-8 text-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">Complete 3 Learning Sessions</h3>
          <p className="text-gray-600">
            Continue learning through conversations to unlock personalized video sessions with your study counselor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 bg-gray-900 rounded-t-lg overflow-hidden relative">
        {!videoLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {isVideoEnabled ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(https://images.pexels.com/photos/${
                      currentBackground === 'classroom' ? '8471970' :
                      currentBackground === 'library' ? '590493' :
                      currentBackground === 'home-office' ? '4050315' :
                      '7135121'
                    }/pexels-photo-${
                      currentBackground === 'classroom' ? '8471970' :
                      currentBackground === 'library' ? '590493' :
                      currentBackground === 'home-office' ? '4050315' :
                      '7135121'
                    }.jpeg)`
                  }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>

                {tavusVideoUrl ? (
                  <video
                    src={tavusVideoUrl}
                    autoPlay
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div 
                      ref={avatarRef}
                      className={cn(
                        "w-48 h-48 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden transition-transform duration-300",
                        avatarEmotion === 'thinking' ? 'scale-105' :
                        avatarEmotion === 'excited' ? 'scale-110' :
                        'scale-100',
                        isPaused && "opacity-60"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-primary-300 to-primary-600 opacity-50"></div>
                      <div className="w-32 h-32 rounded-full bg-primary-200 flex items-center justify-center z-10">
                        <span className="text-5xl font-bold text-primary-700">AI</span>
                      </div>
                    </div>
                    
                    {/* Live transcript bubble */}
                    {currentTranscript && (
                      <div className="absolute top-full mt-4 max-w-xs bg-white rounded-lg p-3 shadow-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs font-medium text-blue-600">Hearing you say...</span>
                        </div>
                        <p className="text-sm text-gray-800">{currentTranscript}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            )}
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex space-x-2">
          {isListening && voiceMode !== 'muted' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-500 text-white shadow-md">
              <Mic className="w-3 h-3 mr-1" /> Listening
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500 text-white shadow-md">
              <MicOff className="w-3 h-3 mr-1" /> Mic Off
            </span>
          )}
          
          {isSpeaking ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500 text-white shadow-md">
              <Volume2 className="w-3 h-3 mr-1" /> Speaking
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500 text-white shadow-md">
              <VolumeX className="w-3 h-3 mr-1" /> Silent
            </span>
          )}
        </div>
        
        {/* Difficulty level indicator */}
        <div className="absolute top-4 left-4 bg-white/90 text-primary-700 text-xs font-medium rounded-full px-3 py-1 shadow-md">
          {difficultyLevel} Level
        </div>
        
        {(recognitionError || voiceChatError) && (
          <div className="absolute top-14 left-4 bg-error-500 text-white text-xs rounded-md px-3 py-1.5 shadow-md max-w-xs">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{recognitionError || voiceChatError}</span>
            </div>
          </div>
        )}

        <VideoControls />
      </div>
      
      <VoiceControls />
    </div>
  );
};