import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { VoiceConversationService } from '../services/voiceConversationService';
import { useAuth } from '../contexts/AuthContext';
import { useSpeechRecognition } from './useSpeechRecognition';
import toast from 'react-hot-toast';

export const useVoiceChat = () => {
  const { 
    currentSubject, 
    currentAvatar, 
    difficultyLevel,
    voiceMode,
    setIsSpeaking,
    addMessage,
    setAvatarEmotion,
    isListening,
    toggleListening
  } = useStore();
  
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const voiceServiceRef = useRef<VoiceConversationService | null>(null);
  const isMounted = useRef(true);
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening
  } = useSpeechRecognition();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
        voiceServiceRef.current.stopSpeaking();
      }
    };
  }, []);

  // Initialize voice service
  useEffect(() => {
    if (!user) return;

    try {
      voiceServiceRef.current = new VoiceConversationService({
        userId: user.id,
        subject: currentSubject,
        avatarPersonality: currentAvatar,
        difficultyLevel: difficultyLevel,
        onResponse: (text) => {
          if (isMounted.current) {
            addMessage(text, 'ai');
          }
        },
        onAudioStart: () => {
          if (isMounted.current) {
            setIsSpeaking(true);
            setAvatarEmotion('neutral');
          }
        },
        onAudioEnd: () => {
          if (isMounted.current) {
            setIsSpeaking(false);
            setAvatarEmotion('neutral');
          }
        },
        onError: (errorMessage) => {
          if (isMounted.current) {
            setError(errorMessage);
            toast.error(errorMessage);
          }
        },
        onTranscript: (text, isFinal) => {
          if (isMounted.current) {
            setCurrentTranscript(text);
            if (isFinal && text.trim()) {
              toggleListening(true);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      setError('Failed to initialize voice service');
    }
  }, [user, currentSubject, currentAvatar, difficultyLevel, addMessage, setIsSpeaking, setAvatarEmotion, toggleListening]);

  // Update voice service when difficulty level changes
  useEffect(() => {
    if (voiceServiceRef.current && user && isMounted.current) {
      // Reinitialize the service with the new difficulty level
      voiceServiceRef.current = new VoiceConversationService({
        userId: user.id,
        subject: currentSubject,
        avatarPersonality: currentAvatar,
        difficultyLevel: difficultyLevel,
        onResponse: (text) => {
          if (isMounted.current) {
            addMessage(text, 'ai');
          }
        },
        onAudioStart: () => {
          if (isMounted.current) {
            setIsSpeaking(true);
            setAvatarEmotion('neutral');
          }
        },
        onAudioEnd: () => {
          if (isMounted.current) {
            setIsSpeaking(false);
            setAvatarEmotion('neutral');
          }
        },
        onError: (errorMessage) => {
          if (isMounted.current) {
            setError(errorMessage);
            toast.error(errorMessage);
          }
        },
        onTranscript: (text, isFinal) => {
          if (isMounted.current) {
            setCurrentTranscript(text);
            if (isFinal && text.trim()) {
              toggleListening(true);
            }
          }
        }
      });
      
      console.log(`Voice service updated with difficulty level: ${difficultyLevel}`);
    }
  }, [difficultyLevel, user, currentSubject, currentAvatar, addMessage, setIsSpeaking, setAvatarEmotion, toggleListening]);

  const startVoiceChat = useCallback(async () => {
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      toast.error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    try {
      if (!listening) {
        await startListening();
      }
      
      if (isMounted.current) {
        setIsActive(true);
        setIsPaused(false);
        setAvatarEmotion('neutral');
        setError(null);
        toast.success('Voice chat started');
      }
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      if (isMounted.current) {
        setError('Failed to start voice chat. Please check your microphone permissions.');
        toast.error('Failed to start voice chat. Please check your microphone permissions.');
      }
    }
  }, [setAvatarEmotion, browserSupportsSpeechRecognition, listening, startListening]);

  const stopVoiceChat = useCallback(() => {
    stopListening();
    
    if (isMounted.current) {
      setIsActive(false);
      setIsPaused(false);
      setIsSpeaking(false);
      setAvatarEmotion('neutral');
      setCurrentTranscript('');
    }
  }, [setIsSpeaking, setAvatarEmotion, stopListening]);

  const pauseVoiceChat = useCallback(() => {
    stopListening();
    
    if (isMounted.current) {
      setIsPaused(true);
      setIsSpeaking(false);
      toast.success('Conversation paused');
    }
  }, [setIsSpeaking, stopListening]);

  const resumeVoiceChat = useCallback(() => {
    if (isMounted.current) {
      setIsPaused(false);
      startListening();
      toast.success('Conversation resumed');
    }
  }, [startListening]);

  const toggleVoiceChat = useCallback(() => {
    if (isPaused) {
      resumeVoiceChat();
    } else {
      pauseVoiceChat();
    }
  }, [isPaused, pauseVoiceChat, resumeVoiceChat]);

  return {
    isActive,
    isPaused,
    error,
    currentTranscript,
    startVoiceChat,
    stopVoiceChat,
    pauseVoiceChat,
    resumeVoiceChat,
    toggleVoiceChat
  };
};