import React, { useEffect, useState, useRef } from 'react';
import { Mic, MessageSquare, Volume2, VolumeX, Play, MicOff } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { TavusService } from '../services/tavusService';
import { startOliviaCounselorConversation } from '../services/tavusStudentCounselor';
import { VideoControls } from './VideoControls';
import { VoiceControls } from './VoiceControls';
import { VoiceChat } from './VoiceChat';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../styles/utils';
import { Button } from './Button';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { StudyModeIndicator } from './StudyModeIndicator';
import { AlertCircle } from 'lucide-react';

export const VideoArea: React.FC = () => {
  const { 
    isListening,
    isSpeaking,
    isVideoEnabled,
    currentBackground,
    voiceMode,
    setVoiceMode,
    learningMode,
    setLearningMode,
    isStudyMode,
    avatarEmotion = 'neutral', // Default to neutral if not in store
    difficultyLevel = 'High School' // Default to High School if not in store
  } = useStore();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    isActive, 
    error: voiceChatError, 
    isPaused, 
    currentTranscript, 
    stopVoiceChat,
    pauseVoiceChat,
    resumeVoiceChat
  } = useVoiceChat();
  
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    startListening,
    stopListening
  } = useSpeechRecognition();
  
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isEligibleForTavus, setIsEligibleForTavus] = useState(false);
  const [tavusVideoUrl, setTavusVideoUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showStartPrompt, setShowStartPrompt] = useState(true);

  // Tavus Olivia video call state
  const [oliviaConversationUrl, setOliviaConversationUrl] = useState<string | null>(null);
  const [oliviaLoading, setOliviaLoading] = useState(false);
  const [oliviaError, setOliviaError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fallback videos to use if the main video fails
  const fallbackVideos = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  ];

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
    if (!browserSupportsSpeechRecognition) {
      toast.error('Your browser does not support speech recognition. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (!isMicrophoneAvailable) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        toast.success('Microphone access granted!');
      } catch (error) {
        toast.error('Microphone permission is required for voice chat');
        return;
      }
    }
    
    setVoiceMode('continuous');
    setShowStartPrompt(false);
    startListening();
    toast.success('Voice chat started! You can now speak with your AI tutor');
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video playback error:', e);
    
    // Only retry a few times to avoid infinite loops
    if (retryCount < fallbackVideos.length) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      const errorMsg = `Error playing video. Trying fallback... (${nextRetry}/${fallbackVideos.length})`;
      setVideoError(errorMsg);
      setTavusVideoUrl(fallbackVideos[nextRetry % fallbackVideos.length]);
      toast.error(errorMsg);
    } else {
      const errorMsg = 'Unable to play video. Please try again later or use text chat instead.';
      setTavusVideoUrl(null);
      setVideoError(errorMsg);
      toast.error(errorMsg);
    }
  };
  
  // Function to manually retry video loading
  const retryVideoLoad = () => {
    if (retryCount < fallbackVideos.length) {
      setTavusVideoUrl(fallbackVideos[retryCount % fallbackVideos.length]);
      setVideoError(null);
    } else {
      setVideoError('No more fallback videos available. Please try again later.');
    }
  };

  const handleSwitchToTextChat = () => {
    setLearningMode('conversational');
    setVoiceMode('muted');
    navigate('/study');
  };

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

  // If Olivia video call is active, render iframe
  if (oliviaConversationUrl) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Live Video Call with Olivia</h3>
        <iframe
          src={oliviaConversationUrl}
          title="Olivia Video Call"
          allow="camera; microphone; fullscreen; speaker"
          className="w-full max-w-2xl h-[600px] rounded-lg shadow-lg border"
        />
        <Button className="mt-6" variant="outline" onClick={() => setOliviaConversationUrl(null)}>
          End Call
        </Button>
      </div>
    );
  }

  // Start Tavus Olivia video call
  const handleStartOliviaCall = async () => {
    if (!user) {
      toast.error('You must be logged in to start a video call.');
      return;
    }
    setOliviaLoading(true);
    setOliviaError(null);
    try {
      const displayName = (user as any).name || user.email || user.id || 'Student';
      const conversationName = `${displayName}'s Session with Olivia`;
      const callbackUrl = window.location.origin + '/api/tavus-webhook';
      const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
      const url = await startOliviaCounselorConversation({
        userId: user.id,
        conversationName,
        callbackUrl,
        apiKey,
        customGreeting: `Hi ${displayName}, I’m Olivia, your student counselor. How can I help you today?`
      });
      if (!url) throw new Error('No conversation URL returned');
      setOliviaConversationUrl(url);
    } catch (err: any) {
      setOliviaError(err.message || 'Failed to start Olivia video call.');
      toast.error(err.message || 'Failed to start Olivia video call.');
    } finally {
      setOliviaLoading(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Voice Chat Status Bar */}
      {learningMode === 'videocall' && (
        <div className="bg-gray-800 text-white text-sm p-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                {isListening ? (
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                ) : isSpeaking ? (
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                )}
                <span>
                  {isListening ? 'Listening...' : isSpeaking ? 'AI is speaking' : 'Voice chat ready'}
                </span>
              </div>

              {/* Unified Voice Controls */}
              <div className="pl-4">
                <VoiceControls />
              </div>
            </div>

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="max-w-md truncate text-gray-300 italic">
                {currentTranscript}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 bg-gray-900 rounded-t-lg overflow-hidden relative">
        {/* Study Mode Indicator */}
        {isStudyMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <StudyModeIndicator />
          </div>
        )}
        
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
                <div className="absolute inset-0 w-full h-full">
                  {/* Error message and retry button */}
                  {(videoError || retryCount > 0) && (
                    <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-r from-red-50 to-yellow-50 border-b border-red-200 text-red-700 text-sm flex items-center justify-between z-10">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{videoError || `Video playback issues detected. Using fallback video ${retryCount}/${fallbackVideos.length}`}</span>
                        </div>
                        <button 
                          onClick={retryVideoLoad}
                          className="ml-4 px-3 py-1 bg-white text-red-700 text-xs font-medium rounded border border-red-200 hover:bg-red-50 transition-colors"
                          aria-label="Retry video"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    
                    <video
                      ref={videoRef}
                      src={tavusVideoUrl}
                      autoPlay
                      controls
                      className="w-full h-full object-cover"
                      onError={handleVideoError}
                      poster="/white_circle_360x360.png"
                    />
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    {showStartPrompt && !isActive ? (
                      <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center max-w-md">
                        <h3 className="text-xl font-semibold mb-3">Start a Session</h3>
                        <p className="text-gray-600 mb-4">
                          Choose how you want to talk to your AI study counselor.
                        </p>
                        <div className="flex flex-col space-y-3">
                          <Button
                            variant="primary"
                            onClick={handleStartVoiceChat}
                            leftIcon={<Mic className="h-5 w-5" />}
                            className="w-full"
                            disabled={!browserSupportsSpeechRecognition}
                          >
                            Start Voice Chat
                          </Button>

                          <Button
                            variant="outline"
                            onClick={handleStartOliviaCall}
                            leftIcon={<Play className="h-5 w-5" />}
                            className="w-full"
                            isLoading={oliviaLoading}
                            disabled={oliviaLoading}
                          >
                            {oliviaLoading ? 'Starting Olivia Video Call...' : 'Start Video Call with Olivia'}
                          </Button>

                          {oliviaError && (
                            <div className="text-red-600 text-sm mt-2">
                              {oliviaError}
                            </div>
                          )}

                          {!browserSupportsSpeechRecognition && (
                            <div className="text-red-600 text-sm mt-2">
                              Your browser doesn't support voice features. Please try Chrome, Edge, or Safari.
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={handleSwitchToTextChat}
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
                        
                        {listening && !isSpeaking && (
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
                        {transcript && (
                          <div className="absolute top-full mt-4 max-w-xs bg-white rounded-lg p-3 shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs font-medium text-blue-600">Hearing you say...</span>
                            </div>
                            <p className="text-sm text-gray-800">{transcript}</p>
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
          {listening && voiceMode !== 'muted' ? (
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
        
        {voiceChatError && (
          <div className="absolute top-14 left-4 bg-error-500 text-white text-xs rounded-md px-3 py-1.5 shadow-md max-w-xs">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{voiceChatError}</span>
            </div>
          </div>
        )}

        <VideoControls />
      </div>
      
      <VoiceChat onSwitchToText={handleSwitchToTextChat} />
    </div>
  );
};