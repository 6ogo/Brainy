import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { Mic, MicOff, Send, AlertCircle } from 'lucide-react';
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
    pauseThreshold
  } = useVoiceChat();
  
  const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioThreshold, setAudioThreshold] = useState(0.05);
  const [delayAfterSpeaking, setDelayAfterSpeaking] = useState(500); // 500ms delay after AI stops speaking
  
  // Refs for audio processing
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingEndTimeRef = useRef<number>(0);
  const microphoneTrackRef = useRef<MediaStreamTrack | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const aiFrequencyPatternRef = useRef<number[]>([]);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        frequencyDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        microphoneStreamRef.current = stream;
        microphoneTrackRef.current = stream.getAudioTracks()[0];
        
        // Connect microphone to analyzer
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        // Start monitoring audio levels
        requestAnimationFrame(monitorAudioLevels);
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
  
  // Automatically mute microphone when AI is speaking
  useEffect(() => {
    if (isSpeaking && !isMicMuted) {
      muteUserMicrophone();
      
      // Record AI frequency pattern for feedback detection
      if (analyserRef.current && frequencyDataRef.current) {
        analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
        aiFrequencyPatternRef.current = Array.from(frequencyDataRef.current);
      }
    } else if (!isSpeaking && isMicMuted && speakingEndTimeRef.current === 0) {
      // AI just stopped speaking, set a delay before unmuting
      speakingEndTimeRef.current = Date.now();
    }
  }, [isSpeaking, isMicMuted]);
  
  // Monitor audio levels to detect potential feedback
  const monitorAudioLevels = () => {
    if (!analyserRef.current || !frequencyDataRef.current) return;
    
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
    
    // Calculate average volume level
    const average = Array.from(frequencyDataRef.current)
      .reduce((sum, value) => sum + value, 0) / frequencyDataRef.current.length;
    
    // Check if it's time to unmute after AI finished speaking
    if (!isSpeaking && isMicMuted && speakingEndTimeRef.current > 0) {
      const timeSinceAIStopped = Date.now() - speakingEndTimeRef.current;
      
      if (timeSinceAIStopped >= delayAfterSpeaking) {
        unmuteUserMicrophone();
        speakingEndTimeRef.current = 0;
      }
    }
    
    // Check if current audio matches AI frequency pattern (potential feedback)
    if (!isSpeaking && !isMicMuted && aiFrequencyPatternRef.current.length > 0) {
      const similarityScore = calculateFrequencySimilarity(
        frequencyDataRef.current, 
        aiFrequencyPatternRef.current
      );
      
      // If similarity is high and volume is above threshold, it might be feedback
      if (similarityScore > 0.8 && average > audioThreshold * 255) {
        console.log('Potential feedback detected, muting microphone');
        muteUserMicrophone();
        
        // Unmute after a short delay
        setTimeout(() => {
          unmuteUserMicrophone();
        }, 1000);
      }
    }
    
    // Continue monitoring
    requestAnimationFrame(monitorAudioLevels);
  };
  
  // Calculate similarity between current audio and AI voice pattern
  const calculateFrequencySimilarity = (current: Uint8Array, pattern: number[]): number => {
    if (pattern.length === 0) return 0;
    
    let matchCount = 0;
    const threshold = 20; // Tolerance for frequency matching
    
    for (let i = 0; i < Math.min(current.length, pattern.length); i++) {
      if (Math.abs(current[i] - pattern[i]) < threshold) {
        matchCount++;
      }
    }
    
    return matchCount / Math.min(current.length, pattern.length);
  };
  
  // Mute the user's microphone
  const muteUserMicrophone = () => {
    if (microphoneTrackRef.current) {
      microphoneTrackRef.current.enabled = false;
      setIsMicMuted(true);
      
      // Also pause voice chat to prevent processing
      if (isActive && !isPaused) {
        pauseVoiceChat();
      }
    }
  };
  
  // Unmute the user's microphone
  const unmuteUserMicrophone = () => {
    if (microphoneTrackRef.current) {
      microphoneTrackRef.current.enabled = true;
      setIsMicMuted(false);
      
      // Resume voice chat if it was active before
      if (isActive && isPaused) {
        resumeVoiceChat();
      }
    }
  };
  
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
      
      {/* Audio visualization */}
      <div className="mb-3">
        <AudioVisualizer
          audioData={visualizationData || []}
          isActive={isActive && !isMicMuted}
          height={40}
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
      <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
        <p className="font-medium mb-1">Feedback Prevention Active</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Microphone automatically mutes while AI is speaking</li>
          <li>{delayAfterSpeaking}ms delay after AI finishes speaking</li>
          <li>Audio pattern analysis to detect and prevent feedback</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceInputProcessor;