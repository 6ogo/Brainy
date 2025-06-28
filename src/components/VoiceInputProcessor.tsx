import React, { useState, useEffect, useRef } from 'react';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useStore } from '../store/store';
import { AudioVisualizer } from './AudioVisualizer';
import { PauseDetectionIndicator } from './PauseDetectionIndicator';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';
import { Button } from './Button';
import { Mic, MicOff, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../styles/utils';

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
    pauseThreshold
  } = useVoiceChat();
  
  const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Update last speech timestamp when transcript changes
  useEffect(() => {
    if (currentTranscript) {
      setLastSpeechTimestamp(Date.now());
    }
  }, [currentTranscript]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const handleToggleMic = async () => {
    try {
      if (isActive) {
        stopVoiceChat();
      } else {
        await startVoiceChat();
      }
    } catch (err) {
      setError('Failed to toggle microphone. Please check your permissions.');
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
    } finally {
      setIsProcessing(false);
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
      </div>
      
      {/* Audio visualization */}
      <div className="mb-3">
        <AudioVisualizer
          audioData={visualizationData || []}
          isActive={isActive}
          height={40}
        />
      </div>
      
      {/* Transcript display */}
      {currentTranscript && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-blue-700">Current Transcript</span>
            <PauseDetectionIndicator
              isListening={isListening}
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
            disabled={isProcessing}
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
    </div>
  );
};

export default VoiceInputProcessor;