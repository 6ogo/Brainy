import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from '../store/store';
import toast from 'react-hot-toast';
import { storage } from '../utils/storage';
import { VoiceMode } from '../types';

// Utility to get error message from error code
function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Microphone access denied.';
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'aborted':
      return 'Speech recognition aborted.';
    case 'audio-capture':
      return 'No microphone found.';
    default:
      return 'An unknown error occurred.';
  }
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  startListening: () => Promise<boolean>;
  stopListening: () => Promise<boolean>;
  error: string | null;
  hasPermission: boolean;
  handleVoiceCommand: (transcript: string) => boolean;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const { 
    isListening,
    voiceMode,
    setVoiceMode,
    toggleListening,
    addMessage,
    isRecording
  }: {
    isListening: boolean;
    voiceMode: VoiceMode;
    setVoiceMode: (mode: VoiceMode) => void;
    toggleListening: (force?: boolean) => void;
    addMessage: (text: string, sender: 'user' | 'ai', isBreakthrough?: boolean) => void;
    isRecording: boolean;
  } = useStore();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const isMounted = useRef(true);
  
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
    };
  }, []);
  
  // Declare startListening and stopListening before using them in voiceCommands
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!hasPermission) {
      setError('Microphone permission not granted.');
      toast.error('Microphone permission not granted.');
      return false;
    }
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      return true;
    } catch (err) {
      setError('Failed to start listening.');
      toast.error('Failed to start listening.');
      return false;
    }
  }, [hasPermission]);

  const stopListening = useCallback(async (): Promise<boolean> => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return true;
    } catch (err) {
      setError('Failed to stop listening.');
      toast.error('Failed to stop listening.');
      return false;
    }
  }, []);

  // Voice commands configuration
  const voiceCommands = useMemo(() => ({
    'mute': () => setVoiceMode('muted'),
    'push to talk': () => setVoiceMode('push-to-talk'),
    'continuous': () => setVoiceMode('continuous'),
    'stop listening': () => stopListening(),
    'start listening': () => startListening(),
  }), [setVoiceMode, startListening, stopListening]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((transcript: string): boolean => {
    if (!transcript) return false;
    
    const command = transcript.toLowerCase().trim();
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

  // Request microphone permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          echoCancellation: true,
          noiseSuppression: true,
        });
        setHasPermission(true);
        
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
        
        // Initialize speech recognition
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognitionInstance = new SpeechRecognition();
          
          recognitionInstance.continuous = voiceMode === 'continuous';
          recognitionInstance.interimResults = false;
          recognitionInstance.lang = 'en-US';
          
          recognitionRef.current = recognitionInstance;
          setError(null);
        } else {
          setError('Speech recognition is not supported in this browser');
        }
      } catch (err) {
        setError('Microphone access denied. Please enable microphone permissions.');
        setHasPermission(false);
        toast.error('Microphone access denied. Please enable microphone permissions.');
      }
    };

    requestPermissions();
    
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [voiceMode]);

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
  }, [isRecording, mediaRecorderRef, hasPermission]);

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
    if (!isMounted.current) return;
    
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
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        addMessage(transcript, 'user'); // isBreakthrough left as undefined
      }
    };
    
    const handleError = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error as string);
      setError(errorMessage);
      toast.error(errorMessage);
      toggleListening(false);
    };
    
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = () => {
      if (voiceMode === 'continuous' && isListening) {
        recognition.start();
      } else if (voiceMode === 'push-to-talk') {
        toggleListening(false);
      }
    };
  }, [initSpeechRecognition, setVoiceMode, toggleListening, addMessage, isListening, voiceMode]);

  const safeStartListening = useCallback(async (): Promise<boolean> => {
    try {
      if (!hasPermission) {
        setError('Microphone permission not granted.');
        toast.error('Microphone permission not granted.');
        return false;
      }
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      return true;
    } catch (err) {
      setError('Failed to start listening.');
      toast.error('Failed to start listening.');
      return false;
    }
  }, [hasPermission, recognitionRef]);

  const safeStopListening = useCallback(async (): Promise<boolean> => {
    try {
      stopListening();
      return true;
    } catch (error) {
      setError(getErrorMessage(error instanceof Error ? error.message : String(error)));
      return false;
    }
  }, [stopListening]);

  return {
    isListening,
    startListening: safeStartListening,
    stopListening: safeStopListening,
    error,
    hasPermission,
    handleVoiceCommand,
  } as const;
};