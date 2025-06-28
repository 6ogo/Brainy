import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { Mic, MicOff, Send, AlertCircle, Shield, Headphones } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../styles/utils';
import { AudioVisualizer } from './AudioVisualizer';
import { PauseDetectionIndicator } from './PauseDetectionIndicator';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';
import toast from 'react-hot-toast';

interface VoiceInputProcessorProps {
  onSubmit?: (text: string) => void;
  className?: string;
}

export const VoiceInputProcessor: React.FC<VoiceInputProcessorProps> = ({
  onSubmit,
  className
}) => {
  const { 
    isListening, 
    isSpeaking, 
    voiceMode,
    setVoiceMode
  } = useStore();
  
  const {
    isActive,
    isPaused,
    currentTranscript,
    startVoiceChat,
    stopVoiceChat,
    forceSubmitTranscript,
    visualizationData,
    pauseThreshold,
    feedbackPreventionEnabled,
    toggleFeedbackPrevention
  } = useVoiceChat();
  
  const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isUsingHeadphones, setIsUsingHeadphones] = useState(false);
  const [showAIFilterIndicator, setShowAIFilterIndicator] = useState(true);
  
  // Refs for audio processing
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        microphoneStreamRef.current = stream;
        
        // Connect microphone to analyzer
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      } catch (error) {
        console.error('Error initializing audio:', error);
        setError('Failed to initialize audio. Please check your microphone permissions.');
      }
    };
    
    initializeAudio();
    
    return () => {
      // Clean up
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error('Error closing audio context:', err));
      }
    };
  }, []);
  
  // Update last speech timestamp when transcript changes
  useEffect(() => {
    if (currentTranscript) {
      setLastSpeechTimestamp(Date.now());
    }
  }, [currentTranscript]);
  
  // Show AI filter indicator when AI is speaking
  useEffect(() => {
    setShowAIFilterIndicator(isSpeaking && feedbackPreventionEnabled);
  }, [isSpeaking, feedbackPreventionEnabled]);
  
  const handleToggleMic = async () => {
    try {
      if (isActive) {
        stopVoiceChat();
      } else {
        await startVoiceChat();
      }
    } catch (err) {
      setError('Failed to toggle microphone. Please check your permissions.');
      toast.error('Failed to toggle microphone. Please check your permissions.');
    }
  };
  
  const handleSubmit = () => {
    if (!currentTranscript || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Submit the transcript
      forceSubmitTranscript();
      
      // Also call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit(currentTranscript);
      }
    } catch (err) {
      setError('Failed to process voice input');
      toast.error('Failed to process voice input');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleHeadphonesMode = () => {
    setIsUsingHeadphones(!isUsingHeadphones);
    
    // If enabling headphones mode, we can disable feedback prevention
    if (!isUsingHeadphones && feedbackPreventionEnabled) {
      toggleFeedbackPrevention();
      toast.success('Headphones mode enabled - feedback prevention adjusted');
    } else {
      toast.success(`Headphones mode ${isUsingHeadphones ? 'disabled' : 'enabled'}`);
    }
  };
  
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Error display */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="flex justify-center mb-3">
        <VoiceStatusIndicator
          isListening={isListening}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
        />
        {isMicMuted && (
          <div className="ml-2 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
            Mic Muted
          </div>
        )}
      </div>
      
      {/* Headphones toggle */}
      <div className="flex justify-center mb-3">
        <Button
          variant={isUsingHeadphones ? "primary" : "outline"}
          size="sm"
          onClick={toggleHeadphonesMode}
          leftIcon={<Headphones className="h-4 w-4" />}
        >
          {isUsingHeadphones ? "Using Headphones" : "Using Speakers"}
        </Button>
      </div>
      
      {/* Audio visualization */}
      <div className="mb-3">
        <AudioVisualizer
          audioData={visualizationData || []}
          isActive={isActive && !isMicMuted}
          height={40}
          showAIFilter={showAIFilterIndicator}
        />
      </div>
      
      {/* Transcript display */}
      {currentTranscript && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-blue-700">Current Transcript</span>
            <PauseDetectionIndicator
              isListening={isListening && !isMicMuted}
              pauseThreshold={pauseThreshold}
              lastSpeechTimestamp={lastSpeechTimestamp}
            />
          </div>
          <p className="text-sm text-blue-800">{currentTranscript}</p>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant={isActive ? "secondary" : "primary"}
          onClick={handleToggleMic}
          className="flex-1"
          leftIcon={isActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        >
          {isActive ? "Stop Listening" : "Start Listening"}
        </Button>
        
        {currentTranscript && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isProcessing || isMicMuted}
            isLoading={isProcessing}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Submit
          </Button>
        )}
      </div>
      
      {/* Voice mode explanation */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {voiceMode === 'continuous' ? (
          <p>Continuous mode: Speak freely, pauses will be detected automatically</p>
        ) : voiceMode === 'push-to-talk' ? (
          <p>Push-to-talk mode: Press and hold the mic button to speak</p>
        ) : (
          <p>Voice mode is currently disabled</p>
        )}
      </div>
      
      {/* Feedback prevention info */}
      {feedbackPreventionEnabled && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <p className="font-medium">AI Audio Filtering Active</p>
          </div>
          <p className="ml-6">
            The system is actively filtering out AI-generated audio from your microphone input.
            Only your voice will be processed for transcription.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceInputProcessor;