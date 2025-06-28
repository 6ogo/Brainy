import { useEffect, useState, useCallback, useRef } from 'react';

// Declare custom window properties for toast debouncing
declare global {
  interface Window {
    __mic_granted_toast_shown?: boolean;
    __mic_denied_toast_shown?: boolean;
  }
}
import SpeechRecognition, { useSpeechRecognition as useReactSpeechRecognition } from 'react-speech-recognition';
import { useStore } from '../store/store';
import toast from 'react-hot-toast';
import 'regenerator-runtime/runtime';

interface UseSpeechRecognitionReturn {
  transcript: string;
  listening: boolean;
  browserSupportsSpeechRecognition: boolean;
  isMicrophoneAvailable: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  clearTranscriptOnListen: boolean;
  setClearTranscriptOnListen: (value: boolean) => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const { 
    voiceMode, 
    setVoiceMode, 
    toggleListening,
    addMessage
  } = useStore();
  
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState<boolean>(false);
  const [clearTranscriptOnListen, setClearTranscriptOnListen] = useState<boolean>(true);
  const hasCheckedPermission = useRef<boolean>(false);
  const isStartingListening = useRef<boolean>(false);
  const lastTranscriptRef = useRef<string>('');
  const transcriptTimeoutRef = useRef<number | null>(null);
  const noiseThreshold = 3; // Minimum characters to consider as valid speech
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable: micAvailable
  } = useReactSpeechRecognition() as {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    isMicrophoneAvailable: boolean;
  };

  // Update store listening state when the library's listening state changes
  useEffect(() => {
    toggleListening(listening);
  }, [listening, toggleListening]);

  // Update microphone availability state
  useEffect(() => {
    setIsMicrophoneAvailable(micAvailable);
  }, [micAvailable]);

  // Check microphone permission on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      if (hasCheckedPermission.current) return;
      
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          setIsMicrophoneAvailable(true);
          
          // Initialize audio context for analysis
          if (!audioContextRef.current) {
            try {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
              analyserRef.current = audioContextRef.current.createAnalyser();
              analyserRef.current.fftSize = 256;
            } catch (audioError) {
              console.error('Error initializing audio context:', audioError);
            }
          }
        } else if (permissionStatus.state === 'denied') {
          setIsMicrophoneAvailable(false);
          toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
        }
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          setIsMicrophoneAvailable(permissionStatus.state === 'granted');
          
          // Debounce: Only show granted toast once per session
          if (permissionStatus.state === 'granted' && !window.__mic_granted_toast_shown) {
            toast.success('Microphone access granted!');
            window.__mic_granted_toast_shown = true;
            
            // Initialize audio context for analysis
            if (!audioContextRef.current) {
              try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
              } catch (audioError) {
                console.error('Error initializing audio context:', audioError);
              }
            }
          } else if (permissionStatus.state === 'denied' && !window.__mic_denied_toast_shown) {
            toast.error('Microphone access denied.');
            setVoiceMode('muted');
            window.__mic_denied_toast_shown = true;
          }
        };
        
        hasCheckedPermission.current = true;
      } catch (error) {
        console.error('Error checking microphone permission:', error);
      }
    };
    
    if (browserSupportsSpeechRecognition) {
      checkMicrophonePermission();
    }
  }, [browserSupportsSpeechRecognition, setVoiceMode]);

  // Auto-send transcript after a short delay when speech ends
  useEffect(() => {
    // Only process if we have a transcript that's not being processed
    if (transcript && 
        transcript.trim().length > noiseThreshold && 
        transcript !== lastTranscriptRef.current && 
        !isStartingListening.current) {
      
      // If we're not listening anymore and have a final transcript
      if (!listening) {
        // Clear any existing timeout
        if (transcriptTimeoutRef.current) {
          clearTimeout(transcriptTimeoutRef.current);
        }
        
        // Set a timeout to send the transcript
        transcriptTimeoutRef.current = window.setTimeout(() => {
          console.log('Auto-sending transcript after speech ended:', transcript);
          lastTranscriptRef.current = transcript;
          addMessage(transcript, 'user');
          
          // Reset transcript after sending
          setTimeout(() => {
            resetTranscript();
            
            // Restart listening if in continuous mode
            if (voiceMode === 'continuous' && !listening) {
              startListening();
            }
          }, 500);
          
          transcriptTimeoutRef.current = null;
        }, 1000); // Send after 1 second of silence
      }
    }
  }, [transcript, listening, addMessage, resetTranscript, voiceMode]);

  // Start listening with appropriate options
  const startListening = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous start attempts
    if (isStartingListening.current || listening) {
      return;
    }
    
    isStartingListening.current = true;
    
    try {
      if (!browserSupportsSpeechRecognition) {
        toast.error('Your browser does not support speech recognition. Please try Chrome, Edge, or Safari.');
        return;
      }
      
      if (!isMicrophoneAvailable) {
        try {
          // Try to request microphone access
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          
          // Save the stream for analysis
          microphoneStreamRef.current = stream;
          
          // Connect to audio context for analysis
          if (audioContextRef.current && analyserRef.current) {
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
          }
          
          setIsMicrophoneAvailable(true);
        } catch (error) {
          console.error('Error requesting microphone access:', error);
          toast.error('Microphone access is required for voice features.');
          return;
        }
      }
      
      if (clearTranscriptOnListen) {
        resetTranscript();
        lastTranscriptRef.current = '';
      }
      
      // Use a timeout to prevent rapid start/stop cycles
      setTimeout(() => {
        SpeechRecognition.startListening({ 
          continuous: voiceMode === 'continuous',
          language: 'en-US',
          interimResults: true
        });
        
        // Reset the flag after a delay to prevent rapid toggling
        setTimeout(() => {
          isStartingListening.current = false;
        }, 1000);
      }, 300);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      isStartingListening.current = false;
      
      // Provide specific error messages
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone detected. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          toast.error('Microphone is already in use by another application. Please close other applications using the microphone.');
        } else {
          toast.error(`Error starting speech recognition: ${error.message}`);
        }
      } else {
        toast.error('Failed to start speech recognition. Please try again.');
      }
    }
  }, [
    browserSupportsSpeechRecognition, 
    isMicrophoneAvailable, 
    voiceMode, 
    clearTranscriptOnListen, 
    resetTranscript,
    listening,
    setIsMicrophoneAvailable
  ]);

  // Stop listening callback
  const stopListening = useCallback((): void => {
    if (!listening) return;
    
    // Clear any pending transcript timeout
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
      transcriptTimeoutRef.current = null;
    }
    
    // If we have a transcript, send it before stopping
    if (transcript && transcript.trim().length > noiseThreshold && transcript !== lastTranscriptRef.current) {
      console.log('Sending transcript on stop:', transcript);
      lastTranscriptRef.current = transcript;
      addMessage(transcript, 'user');
      
      // Reset transcript after sending
      setTimeout(() => {
        resetTranscript();
      }, 500);
    }
    
    SpeechRecognition.stopListening();
    
    // Stop microphone stream
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    // Ensure the starting flag is reset
    isStartingListening.current = false;
  }, [listening, transcript, addMessage, resetTranscript, noiseThreshold]);

  return {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    startListening,
    stopListening,
    resetTranscript,
    clearTranscriptOnListen,
    setClearTranscriptOnListen
  };
};