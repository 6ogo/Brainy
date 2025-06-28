import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Send, 
  Zap, 
  MessageSquare,
  AlertCircle,
  Pause,
  Play,
  Shield,
  Headphones
} from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VoiceMode } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../styles/utils';
import { Button } from './Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { AudioVisualizer } from './AudioVisualizer';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';

interface SimplifiedVoiceControlsProps {
  onSwitchToText?: () => void;
  className?: string;
}

export const SimplifiedVoiceControls: React.FC<SimplifiedVoiceControlsProps> = ({ 
  onSwitchToText,
  className
}) => {
  const { 
    voiceMode, 
    setVoiceMode, 
    setIsSpeaking,
    learningMode,
    isSpeaking,
    setLearningMode
  } = useStore();
  
  const navigate = useNavigate();
  const location = useLocation();
  const isStudyPage = location.pathname === '/study';
  
  const { 
    isActive, 
    isPaused, 
    currentTranscript,
    startVoiceChat, 
    stopVoiceChat, 
    pauseVoiceChat, 
    resumeVoiceChat,
    forceSubmitTranscript,
    setPauseThreshold,
    pauseThreshold,
    visualizationData,
    feedbackPreventionEnabled,
    toggleFeedbackPrevention,
    delayAfterSpeaking,
    setDelayAfterSpeaking
  } = useVoiceChat();
  
  const [volume, setVolume] = useState(0.8);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [isUsingHeadphones, setIsUsingHeadphones] = useState(false);
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false);

  // Check browser support and microphone availability
  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support
      const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setIsBrowserSupported(isSupported);
      
      if (!isSupported && isStudyPage) {
        toast.error('Your browser does not support voice recognition. Please try Chrome, Edge, or Safari.');
        return;
      }
      
      // Check microphone permission
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setIsMicrophoneAvailable(permissionStatus.state === 'granted');
        setShowPermissionBanner(permissionStatus.state === 'prompt');
        
        permissionStatus.onchange = () => {
          setIsMicrophoneAvailable(permissionStatus.state === 'granted');
          setShowPermissionBanner(permissionStatus.state === 'prompt');
          
          if (permissionStatus.state === 'denied') {
            setVoiceMode('muted');
            toast.error('Microphone access denied');
          }
        };
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        setShowPermissionBanner(true);
      }
    };
    
    if (isStudyPage) {
      checkSupport();
    }
  }, [isStudyPage, setVoiceMode]);

  // Ensure voice mode is appropriate for learning mode
  useEffect(() => {
    if (learningMode === 'videocall' && voiceMode === 'muted') {
      setVoiceMode('continuous');
    }
  }, [learningMode, voiceMode, setVoiceMode]);

  const handleVoiceModeChange = async (mode: VoiceMode) => {
    if (!isStudyPage) {
      console.warn('Attempted to change voice mode outside of study page');
      return;
    }
    
    if (!isBrowserSupported && mode !== 'muted') {
      toast.error('Voice features are not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (!isMicrophoneAvailable && mode !== 'muted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Microphone permission required for voice features');
        return;
      }
    }
    
    setVoiceMode(mode);
    
    if (mode === 'muted') {
      stopVoiceChat();
      toast.success('Voice mode turned off');
    } else if (mode === 'continuous') {
      await startVoiceChat();
      toast.success('Continuous voice mode activated - speak naturally');
    } else {
      toast.success('Push-to-talk mode activated');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setIsMicrophoneAvailable(true);
      setShowPermissionBanner(false);
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone detected. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          toast.error('Microphone is already in use by another application.');
        } else {
          toast.error('Failed to access microphone: ' + error.message);
        }
      } else {
        toast.error('Failed to access microphone. Please check your browser permissions.');
      }
      
      return false;
    }
  };

  const toggleMute = () => {
    setIsSpeaking(false);
    stopVoiceChat();
    toast.success('AI voice muted');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Apply volume to all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = newVolume;
    });
  };

  const handlePauseThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPauseThreshold(value);
  };

  const handleSwitchToTextChat = () => {
    setLearningMode('conversational');
    setVoiceMode('muted');
    
    if (onSwitchToText) {
      onSwitchToText();
    } else {
      navigate('/study');
    }
  };

  const toggleHeadphonesMode = () => {
    if (!isStudyPage) return;
    
    setIsUsingHeadphones(!isUsingHeadphones);
    
    if (!isUsingHeadphones) {
      setDelayAfterSpeaking(300);
      toast.success('Headphones mode enabled - reduced delay');
    } else {
      setDelayAfterSpeaking(500);
      toast.success('Headphones mode disabled');
    }
  };

  // If not on study page, don't render the component
  if (!isStudyPage) {
    return null;
  }

  return (
    <div className={cn("p-6 bg-white border-t border-gray-200 rounded-b-lg", className)}>
      {/* Browser Support Warning */}
      {!isBrowserSupported && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Browser Not Supported</h4>
              <p className="text-sm text-red-700 mt-1">
                Your browser doesn't support voice recognition. For the best experience, please use Chrome, Edge, or Safari.
              </p>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleSwitchToTextChat}>
                  Switch to Text-Only Mode
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Permission Banner */}
      {showPermissionBanner && isBrowserSupported && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">Microphone Access Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Enable microphone access to use voice features like speech recognition and voice commands.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={requestPermission}
                className="mt-2"
              >
                Enable Microphone
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Headphones Mode Toggle */}
      <div className="flex justify-center mb-4">
        <Button
          variant={isUsingHeadphones ? "primary" : "outline"}
          size="sm"
          onClick={toggleHeadphonesMode}
          leftIcon={<Headphones className="h-4 w-4" />}
        >
          {isUsingHeadphones ? "Using Headphones" : "Not Using Headphones"}
        </Button>
      </div>

      {/* Voice Status Indicator */}
      <div className="flex justify-center mb-4">
        <VoiceStatusIndicator 
          isListening={isActive && !isPaused} 
          isSpeaking={isSpeaking} 
          isPaused={isPaused} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Voice mode selector */}
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Voice Mode</h3>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => handleVoiceModeChange('muted')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center transition-colors",
                  voiceMode === 'muted'
                    ? "bg-white shadow-sm text-gray-800"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <MicOff className="h-4 w-4 mr-2" /> Off
              </button>
              <button
                onClick={() => handleVoiceModeChange('continuous')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center transition-colors",
                  voiceMode === 'continuous'
                    ? "bg-white shadow-sm text-gray-800"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                )}
                disabled={!isBrowserSupported}
              >
                <Volume2 className="h-4 w-4 mr-2" /> Voice Chat
              </button>
            </div>
            
            {voiceMode === 'continuous' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  🎤 Speak naturally - the AI will respond when you pause for {pauseThreshold}ms
                </p>
              </div>
            )}
          </div>

          {/* Audio visualization */}
          <div className="mb-4">
            <AudioVisualizer 
              audioData={visualizationData || new Uint8Array(128).fill(0)}
              isActive={isActive && !isPaused}
              height={40}
              showAIFilter={isSpeaking && feedbackPreventionEnabled}
            />
          </div>

          {/* Voice controls */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2">Voice Controls</p>
            
            {/* Main voice button */}
            <button
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center focus:outline-none transition-all",
                isActive && !isPaused
                  ? "bg-primary-500 text-white scale-110 shadow-lg animate-pulse"
                  : isMicrophoneAvailable && isBrowserSupported
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
              )}
              disabled={!isMicrophoneAvailable || !isBrowserSupported}
              onClick={async () => {
                if (voiceMode === 'muted') {
                  await handleVoiceModeChange('continuous');
                } else if (isActive && !isPaused) {
                  pauseVoiceChat();
                } else if (isPaused) {
                  resumeVoiceChat();
                } else {
                  await startVoiceChat();
                }
              }}
              aria-label="Toggle voice chat"
            >
              {isActive && !isPaused ? (
                <Mic className="h-10 w-10" />
              ) : isPaused ? (
                <Play className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isActive && !isPaused ? "Listening..." : 
               isPaused ? "Click to resume" : 
               "Click to start voice chat"}
            </p>
            
            {/* Force submit button */}
            {currentTranscript && (
              <Button
                variant="outline"
                size="sm"
                onClick={forceSubmitTranscript}
                className="mt-3"
                leftIcon={<Send className="h-3 w-3" />}
              >
                Submit Now
              </Button>
            )}
            
            {/* Live transcript */}
            {showTranscript && currentTranscript && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-xs">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-500">Hearing:</p>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{currentTranscript}</p>
                
                {/* AI audio filtering indicator */}
                {isSpeaking && feedbackPreventionEnabled && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center text-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>AI audio filtered</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Call Controls */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={isPaused ? "primary" : "secondary"}
                onClick={isPaused ? resumeVoiceChat : pauseVoiceChat}
                leftIcon={isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                disabled={!isMicrophoneAvailable || !isBrowserSupported || !isActive}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleSwitchToTextChat}
                leftIcon={<MessageSquare className="h-5 w-5" />}
              >
                Text Chat
              </Button>
            </div>
          </div>
          
          {/* Feedback Prevention */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Feedback Prevention</h3>
              <Button
                variant={feedbackPreventionEnabled ? "primary" : "outline"}
                size="sm"
                onClick={toggleFeedbackPrevention}
                leftIcon={<Shield className="h-4 w-4" />}
              >
                {feedbackPreventionEnabled ? "On" : "Off"}
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              Prevents audio feedback by muting microphone while AI speaks
            </p>
          </div>
          
          {/* Speech timing control */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Speech Timing</h3>
              <span className="text-sm text-gray-500">{pauseThreshold}ms</span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={pauseThreshold}
                onChange={handlePauseThresholdChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #F59E0B 0%, #F59E0B ' + 
                    ((pauseThreshold - 500) / 25) + '%, #E5E7EB ' + 
                    ((pauseThreshold - 500) / 25) + '%, #E5E7EB 100%)'
                }}
              />
              <Zap className="h-5 w-5 text-amber-700" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              How long to wait after you stop speaking before processing
            </p>
          </div>
          
          {/* Volume control */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">AI Voice Volume</h3>
              <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isSpeaking 
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                    : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                )}
              >
                {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #3B82F6 0%, #3B82F6 ' + 
                    (volume * 100) + '%, #E5E7EB ' + 
                    (volume * 100) + '%, #E5E7EB 100%)'
                }}
              />
              
              <div className="w-8 text-center">
                {volume > 0.66 ? (
                  <Volume2 className="h-5 w-5 text-gray-700 mx-auto" />
                ) : volume > 0.33 ? (
                  <Volume1 className="h-5 w-5 text-gray-700 mx-auto" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-700 mx-auto" />
                )}
              </div>
            </div>
          </div>
          
          {/* Transcript toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </button>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-4">
        <div className="flex flex-wrap items-center gap-4">
          {!isBrowserSupported ? (
            <span className="flex items-center text-red-600">
              <div className="w-2 h-2 rounded-full mr-2 bg-red-500"></div>
              Browser Not Supported
            </span>
          ) : (
            <span className={cn(
              "flex items-center",
              isMicrophoneAvailable ? "text-green-600" : "text-red-600"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                isMicrophoneAvailable ? "bg-green-500" : "bg-red-500"
              )}></div>
              {isMicrophoneAvailable ? 'Microphone Ready' : 'Microphone Access Needed'}
            </span>
          )}
          
          {isActive && (
            <span className={cn(
              "flex items-center",
              !isPaused ? "text-blue-600" : "text-amber-600"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                !isPaused ? "bg-blue-500 animate-pulse" : "bg-amber-500"
              )}></div>
              {!isPaused ? 'Voice Chat Active' : 'Voice Chat Paused'}
            </span>
          )}
          
          {isSpeaking && (
            <span className="flex items-center text-primary-600">
              <div className="w-2 h-2 rounded-full mr-2 bg-primary-500 animate-pulse"></div>
              AI Speaking
            </span>
          )}
          
          {feedbackPreventionEnabled && (
            <span className="flex items-center text-green-600">
              <Shield className="h-4 w-4 mr-1" />
              Feedback Prevention On
            </span>
          )}
          
          {isUsingHeadphones && (
            <span className="flex items-center text-blue-600">
              <Headphones className="h-4 w-4 mr-1" />
              Headphones Mode
            </span>
          )}
        </div>
        
        <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
          {voiceMode === 'muted' ? 'Voice Off' : 'Voice Chat'}
        </div>
      </div>
    </div>
  );
};
