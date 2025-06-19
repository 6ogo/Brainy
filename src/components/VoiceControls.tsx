import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Volume1, VolumeX, Download, AlertCircle, Pause, Play, MessageSquare } from 'lucide-react';
import { useStore } from '../store/store';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VoiceMode } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../styles/utils';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const VoiceControls: React.FC = () => {
  const { 
    voiceMode, 
    setVoiceMode, 
    setIsSpeaking,
    isRecording,
    toggleRecording,
    learningMode,
    isSpeaking,
    setLearningMode
  } = useStore();
  
  const navigate = useNavigate();
  
  const { 
    transcript,
    listening,
    isMicrophoneAvailable,
    startListening,
    stopListening
  } = useSpeechRecognition();
  
  const { 
    isActive, 
    isPaused, 
    startVoiceChat, 
    stopVoiceChat, 
    pauseVoiceChat, 
    resumeVoiceChat
  } = useVoiceChat();
  
  const [volume, setVolume] = useState(70);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState(!isMicrophoneAvailable);
  const [showVoiceGuide, setShowVoiceGuide] = useState(true);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Check browser support for speech recognition
  useEffect(() => {
    const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsBrowserSupported(isSupported);
    
    if (!isSupported) {
      toast.error('Your browser does not support voice recognition. Please try Chrome, Edge, or Safari.');
    }
  }, []);

  // Ensure voice mode is appropriate for learning mode
  useEffect(() => {
    if (learningMode === 'videocall' && voiceMode === 'muted') {
      setVoiceMode('push-to-talk');
    }
  }, [learningMode, voiceMode, setVoiceMode]);

  // Hide permission banner after successful permission grant
  useEffect(() => {
    if (isMicrophoneAvailable) {
      setShowPermissionBanner(false);
    }
  }, [isMicrophoneAvailable]);

  const handleVoiceModeChange = async (mode: VoiceMode) => {
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
      stopListening();
      stopVoiceChat();
      toast.success('Voice mode turned off');
    } else if (mode === 'continuous') {
      startVoiceChat();
      toast.success('Continuous voice mode activated - speak freely');
    } else {
      toast.success('Push-to-talk mode activated - press and hold to speak');
    }
  };

  const handlePushToTalk = async (pressed: boolean) => {
    if (!isBrowserSupported) {
      toast.error('Voice features are not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (!isMicrophoneAvailable) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }
    
    if (voiceMode === 'push-to-talk') {
      if (pressed && !listening) {
        startListening();
      } else if (!pressed && listening) {
        stopListening();
      }
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  const toggleMute = () => {
    setIsSpeaking(false);
    stopVoiceChat();
    toast.success('AI voice muted');
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

  const handleSwitchToTextChat = () => {
    setLearningMode('conversational');
    setVoiceMode('muted');
    navigate('/study');
  };

  return (
    <div className="p-6 bg-white border-t border-gray-200 rounded-b-lg">
      {/* Browser Support Warning */}
      {!isBrowserSupported && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">
                Browser Not Supported
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Your browser doesn't support voice recognition. For the best experience, please use Chrome, Edge, or Safari.
              </p>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToTextChat}
                >
                  Switch to Text-Only Mode
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Request Banner */}
      {showPermissionBanner && isBrowserSupported && (
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

      {/* Voice Guide */}
      {showVoiceGuide && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Volume2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800">
                Voice Chat Guide
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Choose a voice mode below to start talking with your AI tutor. You can use push-to-talk (press and hold to speak) or continuous mode (speak freely).
              </p>
              <div className="mt-2 flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceGuide(false)}
                  className="ml-auto"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => handleVoiceModeChange('push-to-talk')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center transition-colors",
                  voiceMode === 'push-to-talk'
                    ? "bg-white shadow-sm text-gray-800"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                )}
                disabled={!isBrowserSupported}
              >
                <Mic className="h-4 w-4 mr-2" /> Push-to-Talk
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
                <Volume2 className="h-4 w-4 mr-2" /> Continuous
              </button>
            </div>
          </div>

          {/* Push to talk button */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2">Push to Talk</p>
            <button
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center focus:outline-none transition-all",
                listening && voiceMode === 'push-to-talk'
                  ? "bg-primary-500 text-white scale-110 shadow-lg"
                  : isMicrophoneAvailable && isBrowserSupported
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
              )}
              disabled={voiceMode !== 'push-to-talk' || !isMicrophoneAvailable || !isBrowserSupported}
              onMouseDown={() => handlePushToTalk(true)}
              onMouseUp={() => handlePushToTalk(false)}
              onTouchStart={() => handlePushToTalk(true)}
              onTouchEnd={() => handlePushToTalk(false)}
              aria-label="Push to talk"
              tabIndex={0}
              onKeyDown={e => {
                if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                  handlePushToTalk(true);
                }
              }}
              onKeyUp={e => {
                if ((e.key === ' ' || e.key === 'Enter')) {
                  handlePushToTalk(false);
                }
              }}
            >
              <Mic className="h-10 w-10" />
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {listening ? "Release to stop" : "Press and hold to speak"}
            </p>
            
            {/* Live transcript */}
            {showTranscript && transcript && (
              <div 
                ref={transcriptContainerRef}
                className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-500">Hearing:</p>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Pause/Resume and Recording controls */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Call Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={isPaused ? "primary" : "secondary"}
                onClick={isPaused ? resumeVoiceChat : pauseVoiceChat}
                leftIcon={isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                disabled={!isMicrophoneAvailable || !isActive || !isBrowserSupported}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                variant={isRecording ? "primary" : "secondary"}
                onClick={() => toggleRecording()}
                leftIcon={<Download className="h-5 w-5" />}
                disabled={!isMicrophoneAvailable || !isBrowserSupported}
              >
                {isRecording ? 'Stop Recording' : 'Record'}
              </Button>
            </div>
          </div>
          
          {/* Volume control */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Volume Control</h3>
              <span className="text-sm text-gray-500">{volume}%</span>
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
                aria-label={isSpeaking ? "Mute" : "Unmute"}
              >
                {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
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
              
              <div className="w-8 text-center">
                {volume > 66 ? (
                  <Volume2 className="h-5 w-5 text-gray-700 mx-auto" />
                ) : volume > 33 ? (
                  <Volume1 className="h-5 w-5 text-gray-700 mx-auto" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-700 mx-auto" />
                )}
              </div>
            </div>
          </div>
          
          {/* Switch to text chat button */}
          <Button
            variant="outline"
            onClick={handleSwitchToTextChat}
            leftIcon={<MessageSquare className="h-5 w-5" />}
            className="w-full"
          >
            Switch to Text Chat
          </Button>
          
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
      {/* Visually hidden live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="voice-status-live-region">
        {listening ? 'Listening' : isSpeaking ? 'AI Speaking' : isPaused ? 'Conversation Paused' : isMicrophoneAvailable ? 'Microphone Ready' : 'Microphone Access Needed'}
      </div>

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
          
          {voiceMode !== 'muted' && isMicrophoneAvailable && isBrowserSupported && (
            <span className={cn(
              "flex items-center",
              listening ? "text-blue-600" : "text-gray-500"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                listening ? "bg-blue-500 animate-pulse" : "bg-gray-400"
              )}></div>
              {listening ? 'Listening...' : 'Ready to Listen'}
            </span>
          )}
          
          {isSpeaking && (
            <span className="flex items-center text-primary-600">
              <div className="w-2 h-2 rounded-full mr-2 bg-primary-500 animate-pulse"></div>
              AI Speaking
            </span>
          )}
          
          {isPaused && (
            <span className="flex items-center text-amber-600">
              <div className="w-2 h-2 rounded-full mr-2 bg-amber-500"></div>
              Conversation Paused
            </span>
          )}
        </div>
        
        <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
          Mode: {voiceMode === 'muted' ? 'Off' : voiceMode === 'push-to-talk' ? 'Push-to-Talk' : 'Continuous'}
        </div>
      </div>
    </div>
  );
};