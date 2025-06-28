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
import { useLocation } from 'react-router-dom';

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
  
  // Get current location to check if we're on the study page
  const location = useLocation();
  const isStudyPage = location.pathname === '/study';
  
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

  // Check microphone permission on mount, but only on study page
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      if (hasCheckedPermission.current || !isStudyPage) return;
      
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
          if (isStudyPage) {
            toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
          }
        }
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          setIsMicrophoneAvailable(permissionStatus.state === 'granted');
          
          // Debounce: Only show granted toast once per session
          if (permissionStatus.state === 'granted' && !window.__mic_granted_toast_shown && isStudyPage) {
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
          } else if (permissionStatus.state === 'denied' && !window.__mic_denied_toast_shown && isStudyPage) {
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
    
    if (browserSupportsSpeechRecognition && isStudyPage) {
      checkMicrophonePermission();
    }
  }, [browserSupportsSpeechRecognition, setVoiceMode, isStudyPage]);

  // Auto-send transcript after a short delay when speech ends
  useEffect(() => {
    // Only process if we have a transcript and we're not being processed and we're on the study page
    if (transcript && 
        transcript.trim().length > noiseThreshold && 
        transcript !== lastTranscriptRef.current && 
        !isStartingListening.current && 
        isStudyPage) {
      
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
            if (voiceMode === 'continuous' && !listening && isStudyPage) {
              startListening();
            }
          }, 500);
          
          transcriptTimeoutRef.current = null;
        }, 1000); // Send after 1 second of silence
      }
    }
  }, [
    transcript, 
    listening, 
    addMessage, 
    resetTranscript, 
    voiceMode, 
    isStudyPage
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
    if (transcript && transcript.trim().length > noiseThreshold && transcript !== lastTranscriptRef.current && isStudyPage) {
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
  }, [listening, transcript, addMessage, resetTranscript, noiseThreshold, isStudyPage]);

  // Start listening with appropriate options
  const startListening = useCallback(async (): Promise<void> => {
    // Only allow microphone access on the study page
    if (!isStudyPage) {
      console.warn('Attempted to start speech recognition outside of study page');
      return;
    }
    
    // Prevent multiple simultaneous start attempts
    if (isStartingListening.current || listening) {
      return;
    }
    
    isStartingListening.current = true;
    
    try {
      if (!browserSupportsSpeechRecognition) {
        if (isStudyPage) {
          toast.error('Your browser does not support speech recognition. Please try Chrome, Edge, or Safari.');
        }
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
          if (isStudyPage) {
            toast.error('Microphone access is required for voice features.');
          }
          return;
        }
      }
      
      if (clearTranscriptOnListen) {
        resetTranscript();
        lastTranscriptRef.current = '';
      }
      
      // Use a timeout to prevent rapid start/stop cycles
      setTimeout(() => {
        if (isStudyPage) {
          SpeechRecognition.startListening({ 
            continuous: voiceMode === 'continuous',
            language: 'en-US',
            interimResults: true
          });
        }
        
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
        if (error.name === 'NotAllowedError' && isStudyPage) {
          toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
        } else if (error.name === 'NotFoundError' && isStudyPage) {
          toast.error('No microphone detected. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError' && isStudyPage) {
          toast.error('Microphone is already in use by another application. Please close other applications using the microphone.');
        } else if (isStudyPage) {
          toast.error(`Error starting speech recognition: ${error.message}`);
        }
      } else if (isStudyPage) {
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
    setIsMicrophoneAvailable,
    isStudyPage
  ]);

  return {
    transcript: isStudyPage ? transcript : '',
    listening: isStudyPage ? listening : false,
    browserSupportsSpeechRecognition: isStudyPage ? browserSupportsSpeechRecognition : false,
    isMicrophoneAvailable: isStudyPage ? isMicrophoneAvailable : false,
    startListening,
    stopListening,
    resetTranscript,
    clearTranscriptOnListen,
    setClearTranscriptOnListen
  };
};