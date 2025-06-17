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

  // Start listening with appropriate options
  const startListening = useCallback(async () => {
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
    }
    
    SpeechRecognition.startListening({ 
      continuous: voiceMode === 'continuous',
      language: 'en-US'
    });
  }, [
    browserSupportsSpeechRecognition, 
    isMicrophoneAvailable, 
    voiceMode, 
    clearTranscriptOnListen, 
    resetTranscript
  ]);

  // Stop listening
  const stopListening = useCallback(() => {
    SpeechRecognition.stopListening();
  }, []);

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