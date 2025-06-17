import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, Play, MessageSquare } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VideoControls } from './VideoControls';
import { VoiceControls } from './VoiceControls';
import { TavusService } from '../services/tavusService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../styles/utils';
import { Button } from './Button';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const VideoArea: React.FC = () => {
  const { 
    isListening,
    isSpeaking,
    isVideoEnabled,
    currentBackground,
    avatarEmotion,
    voiceMode,
    difficultyLevel,
    setVoiceMode,
    learningMode,
    setLearningMode
  } = useStore();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: recognitionError, startListening, hasPermission, requestPermission } = useVoiceRecognition();
  const { 
    isActive, 
    error: voiceChatError, 
    isPaused, 
    currentTranscript, 
    startVoiceChat, 
    stopVoiceChat,
    pauseVoiceChat,
    resumeVoiceChat
  } = useVoiceChat();
  
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isEligibleForTavus, setIsEligibleForTavus] = useState(false);
  const [tavusVideoUrl, setTavusVideoUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showStartPrompt, setShowStartPrompt] = useState(true);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const avatarRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check browser support for speech recognition
  useEffect(() => {
    const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsBrowserSupported(isSupported);
  }, []);

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

  const handleStartVoiceChat = async () => {
    if (!isBrowserSupported) {
      toast.error('Voice features are not supported in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Microphone permission is required for voice chat');
        return;
      }
    }
    
    setVoiceMode('continuous');
    setShowStartPrompt(false);
    startVoiceChat();
    toast.success('Voice chat started! You can now speak with your AI tutor');
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video playback error:', e);
    
    // Only retry a few times to avoid infinite loops
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      
      // Set a fallback video with a different URL to force reload
      const fallbackUrls = [
        'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      ];
      
      setTavusVideoUrl(fallbackUrls[retryCount % fallbackUrls.length]);
    } else {
      setTavusVideoUrl(null);
    }
  };

  // If not eligible for Tavus, show a message
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
                    ref={videoRef}
                    src={tavusVideoUrl}
                    autoPlay
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={handleVideoError}
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    {showStartPrompt && !isActive ? (
                      <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center max-w-md">
                        <h3 className="text-xl font-semibold mb-3">Start Voice Conversation</h3>
                        <p className="text-gray-600 mb-4">
                          Click the button below to start a voice conversation with your AI tutor. 
                          You'll be able to speak and hear responses in real-time.
                        </p>
                        <div className="flex flex-col space-y-3">
                          <Button
                            variant="primary"
                            onClick={handleStartVoiceChat}
                            leftIcon={<Mic className="h-5 w-5" />}
                            className="w-full"
                          >
                            Start Voice Chat
                          </Button>
                          
                          {!isBrowserSupported && (
                            <div className="text-red-600 text-sm mt-2">
                              Your browser doesn't support voice features. Please try Chrome, Edge, or Safari.
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowStartPrompt(false);
                              setVoiceMode('muted');
                              setLearningMode('conversational');
                              navigate('/study');
                            }}
                            leftIcon={<MessageSquare className="h-5 w-5" />}
                            className="w-full"
                          >
                            Use Text Chat Instead
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                        
                        {/* Voice activity indicators */}
                        {isSpeaking && (
                          <div className="mt-4 bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center">
                            <Volume2 className="h-4 w-4 mr-2" />
                            <span>AI Speaking...</span>
                          </div>
                        )}
                        
                        {isListening && !isSpeaking && (
                          <div className="mt-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center">
                            <Mic className="h-4 w-4 mr-2" />
                            <span>Listening...</span>
                          </div>
                        )}
                        
                        {isPaused && (
                          <div className="mt-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full flex items-center">
                            <Play className="h-4 w-4 mr-2" />
                            <span>Paused - Click to Resume</span>
                          </div>
                        )}
                        
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
                      </>
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