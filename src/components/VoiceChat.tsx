import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { useConversation } from '../hooks/useConversation';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, MessageSquare, Send, Zap, Shield, Headphones } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';
import 'regenerator-runtime/runtime';
import { StudyModeIndicator } from './StudyModeIndicator';
import { AudioVisualizer } from './AudioVisualizer';
import { PauseDetectionIndicator } from './PauseDetectionIndicator';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';

interface VoiceChatProps {
  onSwitchToText?: () => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ onSwitchToText }) => {
  const { 
    voiceMode, 
    setVoiceMode, 
    isSpeaking, 
    setIsSpeaking,
    addMessage,
    isStudyMode
  } = useStore();
  
  const { sendMessage, isProcessing } = useConversation();
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
    feedbackPreventionEnabled,
    toggleFeedbackPrevention,
    visualizationData
  } = useVoiceChat();
  
  const [volume, setVolume] = useState(0.8);
  const [showTranscript, setShowTranscript] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const processingTranscriptRef = useRef<boolean>(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState(0);
  const [isUsingHeadphones, setIsUsingHeadphones] = useState(false);
  
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Update last speech timestamp when transcript changes
  useEffect(() => {
    if (transcript) {
      setLastSpeechTimestamp(Date.now());
    }
  }, [transcript]);

  // Process transcript when it changes
  useEffect(() => {
    const processFinalTranscript = async () => {
      // Only process if we have a transcript and we're not already processing
      if (transcript && 
          !isProcessing && 
          !isSpeaking && 
          transcript !== lastTranscriptRef.current && 
          !processingTranscriptRef.current) {
        
        processingTranscriptRef.current = true;
        lastTranscriptRef.current = transcript;
        
        try {
          // Send to AI and get response
          await sendMessage(transcript, true);
          
          // Reset transcript after processing
          resetTranscript();
        } catch (error) {
          console.error('Error processing transcript:', error);
          toast.error('Failed to process your message. Please try again.');
        } finally {
          processingTranscriptRef.current = false;
          
          // Restart listening if in continuous mode and not paused
          if (voiceMode === 'continuous' && !isPaused && !listening) {
            setTimeout(() => {
              startListening();
            }, 1000);
          }
        }
      }
    };
    
    // Process transcript after a short delay to allow for corrections
    if (transcript && transcript.trim().length > 0 && !processingTranscriptRef.current) {
      const timer = setTimeout(() => {
        processFinalTranscript();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [
    transcript, 
    listening, 
    isProcessing, 
    isSpeaking, 
    addMessage, 
    sendMessage, 
    resetTranscript, 
    voiceMode, 
    isPaused, 
    startListening
  ]);

  const handleVoiceModeChange = async (mode: 'muted' | 'push-to-talk' | 'continuous') => {
    if (!browserSupportsSpeechRecognition && mode !== 'muted') {
      toast.error('Your browser does not support speech recognition. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    setVoiceMode(mode);
    
    if (mode === 'muted') {
      stopListening();
      stopSpeaking();
      toast.success('Voice mode turned off');
    } else if (mode === 'continuous') {
      if (!listening && !processingTranscriptRef.current) {
        startListening();
      }
      toast.success('Continuous voice mode activated - speak freely');
    } else {
      toast.success('Push-to-talk mode activated - press and hold to speak');
    }
  };

  const handlePushToTalk = async (pressed: boolean) => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('Your browser does not support speech recognition. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (!isMicrophoneAvailable) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        toast.success('Microphone access granted!');
      } catch (error) {
        toast.error('Microphone permission denied. Please check your browser settings.');
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

  const pauseConversation = () => {
    pauseVoiceChat();
    stopListening();
    stopSpeaking();
    toast.success('Conversation paused');
  };

  const resumeConversation = () => {
    resumeVoiceChat();
    if (voiceMode === 'continuous' && !processingTranscriptRef.current) {
      startListening();
    }
    toast.success('Conversation resumed');
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    // Also stop any browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
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

  const handleSwitchToTextChat = () => {
    setVoiceMode('muted');
    stopListening();
    stopSpeaking();
    
    if (onSwitchToText) {
      onSwitchToText();
    }
  };

  const handlePauseThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPauseThreshold(value);
  };

  const toggleHeadphonesMode = () => {
    setIsUsingHeadphones(!isUsingHeadphones);
    
    // If enabling headphones mode, we can adjust feedback prevention settings
    if (!isUsingHeadphones) {
      // Disable feedback prevention for headphones users
      if (feedbackPreventionEnabled) {
        toggleFeedbackPrevention();
      }
      toast.success('Headphones mode enabled - feedback prevention disabled');
    } else {
      // Re-enable feedback prevention for speakers
      if (!feedbackPreventionEnabled) {
        toggleFeedbackPrevention();
      }
      toast.success('Headphones mode disabled - feedback prevention enabled');
    }
  };

  return (
    <div className="p-6 bg-white border-t border-gray-200 rounded-b-lg">
      {/* Study Mode Indicator */}
      {isStudyMode && (
        <div className="mb-4 flex justify-center">
          <StudyModeIndicator />
        </div>
      )}

      {/* Browser Support Warning */}
      {!browserSupportsSpeechRecognition && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-red-600 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
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
          isListening={listening} 
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
                onClick={() => handleVoiceModeChange('push-to-talk')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center transition-colors",
                  voiceMode === 'push-to-talk'
                    ? "bg-white shadow-sm text-gray-800"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                )}
                disabled={!browserSupportsSpeechRecognition}
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
                disabled={!browserSupportsSpeechRecognition}
              >
                <Volume2 className="h-4 w-4 mr-2" /> Continuous
              </button>
            </div>
          </div>

          {/* Audio visualization */}
          <div className="mb-4">
            <AudioVisualizer 
              audioData={visualizationData || []}
              isActive={listening}
              height={40}
              showAIFilter={isSpeaking && feedbackPreventionEnabled}
            />
          </div>

          {/* Push to talk button */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2">Push to Talk</p>
            <button
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center focus:outline-none transition-all",
                listening && voiceMode === 'push-to-talk'
                  ? "bg-primary-500 text-white scale-110 shadow-lg"
                  : isMicrophoneAvailable && browserSupportsSpeechRecognition
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
              )}
              disabled={voiceMode !== 'push-to-talk' || !isMicrophoneAvailable || !browserSupportsSpeechRecognition}
              onMouseDown={() => handlePushToTalk(true)}
              onMouseUp={() => handlePushToTalk(false)}
              onTouchStart={() => handlePushToTalk(true)}
              onTouchEnd={() => handlePushToTalk(false)}
              aria-label="Push to talk"
            >
              <Mic className="h-10 w-10" />
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {listening ? "Release to stop" : "Press and hold to speak"}
            </p>
            
            {/* Pause detection indicator */}
            <PauseDetectionIndicator 
              isListening={listening}
              pauseThreshold={pauseThreshold}
              lastSpeechTimestamp={lastSpeechTimestamp}
              className="mt-2"
            />
            
            {/* Force submit button */}
            {transcript && (
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
                
                {/* AI audio filtering indicator */}
                {isSpeaking && feedbackPreventionEnabled && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center text-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>AI audio filtered out</span>
                    </div>
                    <span className="text-gray-500">Only your voice processed</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Pause/Resume controls */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Call Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={isPaused ? "primary" : "secondary"}
                onClick={isPaused ? resumeConversation : pauseConversation}
                leftIcon={isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                disabled={!isMicrophoneAvailable || !browserSupportsSpeechRecognition}
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
          
          {/* Feedback Prevention Controls */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Feedback Prevention</h3>
              <Button
                variant={feedbackPreventionEnabled ? "primary" : "outline"}
                size="sm"
                onClick={toggleFeedbackPrevention}
                leftIcon={<Shield className="h-4 w-4" />}
              >
                {feedbackPreventionEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            {feedbackPreventionEnabled && (
              <div className="text-xs text-gray-600 mb-2">
                <p>Microphone will automatically mute while AI is speaking to prevent feedback loops.</p>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Prevents audio feedback loops</span>
            </div>
          </div>
          
          {/* Pause threshold control */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Pause Threshold</h3>
              <span className="text-sm text-gray-500">{pauseThreshold}ms</span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <input
                type="range"
                min="300"
                max="2000"
                step="100"
                value={pauseThreshold}
                onChange={handlePauseThresholdChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <Zap className="h-5 w-5 text-amber-700" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Adjust how long to wait after you stop speaking before processing your input.
              Lower values (left) are more responsive but may cut you off. Higher values (right) give you more time to think.
            </p>
          </div>
          
          {/* Volume control */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Volume Control</h3>
              <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={stopSpeaking}
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
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              
              <div className="w-8 text-center">
                {volume > 0.66 ? (
                  <Volume2 className="h-5 w-5 text-gray-700 mx-auto" />
                ) : volume > 0.33 ? (
                  <Volume2 className="h-5 w-5 text-gray-700 mx-auto" />
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
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-4">
        <div className="flex flex-wrap items-center gap-4">
          {!browserSupportsSpeechRecognition ? (
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
          
          {voiceMode !== 'muted' && isMicrophoneAvailable && browserSupportsSpeechRecognition && (
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
          
          {feedbackPreventionEnabled && (
            <span className="flex items-center text-green-600">
              <Shield className="h-4 w-4 mr-1" />
              AI Audio Filtered
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
          Mode: {voiceMode === 'muted' ? 'Off' : voiceMode === 'push-to-talk' ? 'Push-to-Talk' : 'Continuous'}
        </div>
      </div>

      {/* Visually hidden live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="voice-status-live-region">
        {listening ? 'Listening' : isSpeaking ? 'AI Speaking' : isPaused ? 'Conversation Paused' : isMicrophoneAvailable ? 'Microphone Ready' : 'Microphone Access Needed'}
      </div>
    </div>
  );
};