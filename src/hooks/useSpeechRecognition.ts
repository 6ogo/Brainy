import { useEffect, useState, useCallback, useRef } from 'react';
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
    isListening,
    addMessage,
    setIsSpeaking
  } = useStore();
  
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState<boolean>(false);
  const [clearTranscriptOnListen, setClearTranscriptOnListen] = useState<boolean>(true);
  const hasCheckedPermission = useRef<boolean>(false);
  const isStartingListening = useRef<boolean>(false);
  const lastTranscriptRef = useRef<string>('');
  const transcriptTimeoutRef = useRef<number | null>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable: micAvailable
  } = useReactSpeechRecognition();

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
        } else if (permissionStatus.state === 'denied') {
          setIsMicrophoneAvailable(false);
          toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
        }
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          setIsMicrophoneAvailable(permissionStatus.state === 'granted');
          
          if (permissionStatus.state === 'granted') {
            toast.success('Microphone access granted!');
          } else if (permissionStatus.state === 'denied') {
            toast.error('Microphone access denied.');
            setVoiceMode('muted');
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
    if (!listening && transcript && transcript.trim().length > 0 && 
        transcript !== lastTranscriptRef.current && !isStartingListening.current) {
      
      // Clear any existing timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      
      // Set a timeout to send the transcript
      transcriptTimeoutRef.current = window.setTimeout(() => {
        console.log('Auto-sending transcript:', transcript);
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
  }, [transcript, listening, addMessage, resetTranscript, voiceMode, startListening]);

  // Start listening with appropriate options
  const startListening = useCallback(async () => {
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
          await navigator.mediaDevices.getUserMedia({ audio: true });
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
          language: 'en-US'
        });
        
        // Reset the flag after a delay to prevent rapid toggling
        setTimeout(() => {
          isStartingListening.current = false;
        }, 1000);
      }, 300);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      isStartingListening.current = false;
    }
  }, [
    browserSupportsSpeechRecognition, 
    isMicrophoneAvailable, 
    voiceMode, 
    clearTranscriptOnListen, 
    resetTranscript,
    listening
  ]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!listening) return;
    
    // Clear any pending transcript timeout
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
      transcriptTimeoutRef.current = null;
    }
    
    // If we have a transcript, send it before stopping
    if (transcript && transcript.trim().length > 0 && transcript !== lastTranscriptRef.current) {
      console.log('Sending transcript on stop:', transcript);
      lastTranscriptRef.current = transcript;
      addMessage(transcript, 'user');
      
      // Reset transcript after sending
      setTimeout(() => {
        resetTranscript();
      }, 500);
    }
    
    SpeechRecognition.stopListening();
    
    // Ensure the starting flag is reset
    isStartingListening.current = false;
  }, [listening, transcript, addMessage, resetTranscript]);

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