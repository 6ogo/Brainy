import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/store';
import toast from 'react-hot-toast';

export const useVoiceRecognition = () => {
  const { 
    isListening, 
    voiceMode, 
    toggleListening, 
    addMessage,
    isRecording,
    toggleRecording
  } = useStore();
  
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Request microphone permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        
        // Initialize MediaRecorder for recording functionality
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setAudioChunks(chunks => [...chunks, e.data]);
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
        
        setMediaRecorder(recorder);
        
        // Initialize speech recognition
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognitionInstance = new SpeechRecognition();
          
          recognitionInstance.continuous = voiceMode === 'continuous';
          recognitionInstance.interimResults = false;
          recognitionInstance.lang = 'en-US';
          
          setRecognition(recognitionInstance);
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
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [voiceMode]);

  // Handle recording state changes
  useEffect(() => {
    if (!mediaRecorder || !hasPermission) return;
    
    if (isRecording && mediaRecorder.state === 'inactive') {
      setAudioChunks([]);
      mediaRecorder.start();
      toast.success('Recording started');
    } else if (!isRecording && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      toast.success('Recording saved! Check your downloads.');
    }
  }, [isRecording, mediaRecorder, hasPermission]);

  // Configure recognition event handlers
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        addMessage(transcript, 'user');
      }
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      toggleListening();
    };

    recognition.onend = () => {
      if (voiceMode === 'continuous' && isListening) {
        recognition.start();
      } else if (voiceMode === 'push-to-talk') {
        toggleListening();
      }
    };
  }, [recognition, addMessage, toggleListening, isListening, voiceMode]);

  // Start/stop recognition based on isListening state
  useEffect(() => {
    if (!recognition || !hasPermission) return;
    
    if (isListening && voiceMode !== 'muted') {
      try {
        recognition.start();
      } catch (e) {
        // Handle the case where recognition is already started
      }
    } else {
      try {
        recognition.stop();
      } catch (e) {
        // Handle the case where recognition is already stopped
      }
    }
  }, [isListening, recognition, voiceMode, hasPermission]);

  const startListening = useCallback(() => {
    if (!hasPermission) {
      toast.error('Please enable microphone access to use voice features');
      return;
    }
    if (!isListening && voiceMode !== 'muted') {
      toggleListening();
    }
  }, [isListening, toggleListening, voiceMode, hasPermission]);

  const stopListening = useCallback(() => {
    if (isListening) {
      toggleListening();
    }
  }, [isListening, toggleListening]);

  return {
    isListening,
    startListening,
    stopListening,
    error,
    hasPermission
  };
};