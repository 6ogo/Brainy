import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from '../store/store';
import toast from 'react-hot-toast';
import { storage } from '../utils/storage';
import { VoiceMode } from '../types';
import { useConversation } from './useConversation';

// Utility to get error message from error code
function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Microphone access denied. Please enable microphone permissions in your browser settings.';
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'aborted':
      return 'Speech recognition aborted.';
    case 'audio-capture':
      return 'No microphone found. Please check your microphone connection.';
    case 'network':
      return 'Network error occurred during speech recognition.';
    default:
      return 'An unknown error occurred with speech recognition.';
  }
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  startListening: () => Promise<boolean>;
  stopListening: () => Promise<boolean>;
  error: string | null;
  hasPermission: boolean;
  handleVoiceCommand: (transcript: string) => boolean;
  requestPermission: () => Promise<boolean>;
  transcript: string;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const { 
    isListening,
    voiceMode,
    setVoiceMode,
    toggleListening,
    addMessage,
    isRecording
  } = useStore();
  
  const { sendMessage } = useConversation();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const isMounted = useRef(true);
  const [transcript, setTranscript] = useState<string>('');
  const [isFinalTranscript, setIsFinalTranscript] = useState<boolean>(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      // Check if we already have permission
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(permission.state);
        
        if (permission.state === 'granted') {
          setHasPermission(true);
          return true;
        } else if (permission.state === 'denied') {
          setHasPermission(false);
          setError('Microphone access denied. Please enable microphone permissions in your browser settings.');
          return false;
        }
      }

      // Request permission by trying to access the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionState('granted');
      setError(null);
      
      // Initialize MediaRecorder for recording functionality
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `recording-${new Date().toISOString()}.wav`;
        a.click();
        
        // Clean up
        URL.revokeObjectURL(audioUrl);
        setAudioChunks([]);
      };
      
      mediaRecorderRef.current = recorder;
      
      toast.success('Microphone access granted!');
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone access denied. Please enable microphone permissions in your browser settings.');
      setHasPermission(false);
      setPermissionState('denied');
      
      // Show helpful toast with instructions
      toast.error('Microphone access required for voice features. Please check your browser permissions.', {
        duration: 5000,
      });
      
      return false;
    }
  }, []);
  
  // Declare startListening and stopListening before using them in voiceCommands
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    }
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        toggleListening(true);
        setError(null);
        console.log('Speech recognition started');
      }
      return true;
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start listening.');
      toast.error('Failed to start voice recognition.');
      return false;
    }
  }, [hasPermission, requestPermission, toggleListening]);

  const stopListening = useCallback(async (): Promise<boolean> => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      toggleListening(false);
      setError(null);
      console.log('Speech recognition stopped');
      return true;
    } catch (err) {
      console.error('Failed to stop listening:', err);
      setError('Failed to stop listening.');
      return false;
    }
  }, [toggleListening]);

  // Voice commands configuration
  const voiceCommands = useMemo(() => ({
    'mute': () => setVoiceMode('muted'),
    'push to talk': () => setVoiceMode('push-to-talk'),
    'continuous': () => setVoiceMode('continuous'),
    'stop listening': () => stopListening(),
    'start listening': () => startListening(),
  }), [setVoiceMode, startListening, stopListening]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((text: string): boolean => {
    if (!text) return false;
    
    const command = text.toLowerCase().trim();
    const matchedCommand = Object.keys(voiceCommands).find(cmd => 
      command.includes(cmd)
    ) as keyof typeof voiceCommands | undefined;
    
    if (matchedCommand) {
      voiceCommands[matchedCommand]!();
      toast.success(`Command: ${matchedCommand}`);
      return true;
    }
    return false;
  }, [voiceCommands]);

  // Process final transcript
  useEffect(() => {
    if (isFinalTranscript && transcript) {
      // Check if it's a voice command
      const isCommand = handleVoiceCommand(transcript);
      
      // If not a command, send as a message
      if (!isCommand) {
        console.log('Sending voice message:', transcript);
        addMessage(transcript, 'user');
        sendMessage(transcript, true);
      }
      
      // Reset transcript
      setTranscript('');
      setIsFinalTranscript(false);
    }
  }, [transcript, isFinalTranscript, handleVoiceCommand, addMessage, sendMessage]);

  // Handle recording state changes
  useEffect(() => {
    if (!mediaRecorderRef.current || !hasPermission) return;
    
    if (isRecording && mediaRecorderRef.current.state === 'inactive') {
      setAudioChunks([]);
      mediaRecorderRef.current.start();
      toast.success('Recording started');
    } else if (!isRecording && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      toast.success('Recording saved! Check your downloads.');
    }
  }, [isRecording, hasPermission]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback((): SpeechRecognition | null => {
    if (typeof window === 'undefined') return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    return recognition;
  }, []);

  // Configure recognition event handlers
  useEffect(() => {
    if (!isMounted.current || !hasPermission) return;
    
    const recognition = initSpeechRecognition();
    if (!recognition) return;
    
    recognitionRef.current = recognition;
    
    // Load saved voice mode
    try {
      const savedVoiceMode = storage.get<VoiceMode>('voiceMode', 'muted');
      if (savedVoiceMode) {
        setVoiceMode(savedVoiceMode);
        if (savedVoiceMode === 'continuous') {
          toggleListening(true);
        }
      }
    } catch (error) {
      console.error('Error loading voice mode:', error);
    }
    
    const handleResult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      
      if (latestResult && latestResult[0]) {
        const newTranscript = latestResult[0].transcript;
        setTranscript(newTranscript);
        console.log('Speech recognized:', newTranscript);
        
        // If this is a final result
        if (latestResult.isFinal) {
          setIsFinalTranscript(true);
        }
      }
    };
    
    const handleError = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error as string);
      setError(errorMessage);
      
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        setPermissionState('denied');
      }
      
      toast.error(errorMessage);
      toggleListening(false);
    };
    
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = () => {
      if (voiceMode === 'continuous' && isListening) {
        try {
          setTimeout(() => {
            if (recognition && voiceMode === 'continuous' && isListening) {
              recognition.start();
              console.log('Restarted continuous recognition');
            }
          }, 300); // Small delay to prevent rapid restarts
        } catch (error) {
          console.error('Failed to restart continuous recognition:', error);
        }
      } else if (voiceMode === 'push-to-talk') {
        toggleListening(false);
      }
    };
  }, [initSpeechRecognition, setVoiceMode, toggleListening, isListening, voiceMode, hasPermission]);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permission.state);
          setHasPermission(permission.state === 'granted');
          
          // Listen for permission changes
          permission.onchange = () => {
            setPermissionState(permission.state);
            setHasPermission(permission.state === 'granted');
          };
        } catch (error) {
          console.error('Error checking microphone permission:', error);
        }
      }
    };
    
    checkPermission();
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    error,
    hasPermission,
    handleVoiceCommand,
    requestPermission,
    transcript
  } as const;
};