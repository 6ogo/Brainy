import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { VoiceConversationService } from '../services/voiceConversationService';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../constants/ai';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export const useVoiceChat = () => {
  const { 
    currentSubject, 
    currentAvatar, 
    difficultyLevel,
    voiceMode,
    setIsSpeaking,
    addMessage,
    setAvatarEmotion,
    isStudyMode
  } = useStore();
  
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const voiceServiceRef = useRef<VoiceConversationService | null>(null);
  const isMounted = useRef(true);
  
  // Simplified settings
  const [pauseThreshold, setPauseThresholdState] = useState(1500);
  const [visualizationData, setVisualizationData] = useState<Uint8Array | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<number>(0);
  const [feedbackPreventionEnabled, setFeedbackPreventionEnabled] = useState(true);
  const [delayAfterSpeaking, setDelayAfterSpeaking] = useState(500);
  
  // Get current location to check if we're on the study page
  const location = useLocation();
  const isStudyPage = location.pathname === '/study';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
        voiceServiceRef.current.stopSpeaking();
        voiceServiceRef.current.dispose();
      }
    };
  }, []);

  // Initialize voice service only on study page
  useEffect(() => {
    if (!user || !isStudyPage) return;

    try {
      console.log('Initializing simplified voice service');
      
      voiceServiceRef.current = new VoiceConversationService({
        userId: user.id,
        subject: currentSubject,
        avatarPersonality: currentAvatar,
        difficultyLevel: difficultyLevel,
        onResponse: (text) => {
          if (isMounted.current) {
            // Add the AI response to messages
            addMessage(text, 'ai');
          }
        },
        onAudioStart: () => {
          if (isMounted.current) {
            setIsSpeaking(true);
            setAvatarEmotion('speaking');
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
            
            // If final transcript, add user message
            if (isFinal && text.trim().length > 2) {
              addMessage(text, 'user');
            }
          }
        }
      });
      
      // Set up audio visualization
      voiceServiceRef.current.setAudioVisualizationCallback((data) => {
        if (isMounted.current) {
          setVisualizationData(data);
          
          // Calculate noise level
          const sum = data.reduce((a, b) => a + b, 0);
          const average = sum / data.length;
          setNoiseLevel(average / 255);
        }
      });
      
      // Apply current settings
      voiceServiceRef.current.setSilenceThreshold(pauseThreshold);
      voiceServiceRef.current.setFeedbackPrevention(feedbackPreventionEnabled);
      voiceServiceRef.current.setDelayAfterSpeaking(delayAfterSpeaking);
      
      console.log('Voice service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      setError('Failed to initialize voice service');
    }
  }, [user, currentSubject, currentAvatar, difficultyLevel, addMessage, setIsSpeaking, setAvatarEmotion, isStudyPage]);

  // Update voice service when difficulty level changes
  useEffect(() => {
    if (voiceServiceRef.current && user && isMounted.current && isStudyPage) {
      console.log('Reinitializing voice service with new difficulty level:', difficultyLevel);
      
      // Dispose of old service
      voiceServiceRef.current.dispose();
      
      // Create new service with updated settings
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
            setAvatarEmotion('speaking');
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
            if (isFinal && text.trim().length > 2) {
              addMessage(text, 'user');
            }
          }
        }
      });
      
      // Reapply settings
      voiceServiceRef.current.setSilenceThreshold(pauseThreshold);
      voiceServiceRef.current.setFeedbackPrevention(feedbackPreventionEnabled);
      voiceServiceRef.current.setDelayAfterSpeaking(delayAfterSpeaking);
      voiceServiceRef.current.setAudioVisualizationCallback((data) => {
        if (isMounted.current) {
          setVisualizationData(data);
          const sum = data.reduce((a, b) => a + b, 0);
          const average = sum / data.length;
          setNoiseLevel(average / 255);
        }
      });
    }
  }, [difficultyLevel, user, currentSubject, currentAvatar, addMessage, setIsSpeaking, setAvatarEmotion, isStudyPage]);

  const startVoiceChat = useCallback(async () => {
    if (!isStudyPage) {
      console.warn('Attempted to start voice chat outside of study page');
      return;
    }
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError(ERROR_MESSAGES.BROWSER_SUPPORT);
      toast.error(ERROR_MESSAGES.BROWSER_SUPPORT);
      return;
    }
    
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.startListening();
        
        if (isMounted.current) {
          setIsActive(true);
          setIsPaused(false);
          setAvatarEmotion('listening');
          setError(null);
          toast.success('Voice chat started - speak naturally');
        }
      }
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      if (isMounted.current) {
        setError(ERROR_MESSAGES.MICROPHONE_ACCESS);
        toast.error(ERROR_MESSAGES.MICROPHONE_ACCESS);
      }
    }
  }, [setAvatarEmotion, isStudyPage]);

  const stopVoiceChat = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    
    if (isMounted.current) {
      setIsActive(false);
      setIsPaused(false);
      setIsSpeaking(false);
      setAvatarEmotion('neutral');
      setCurrentTranscript('');
      toast.success('Voice chat stopped');
    }
  }, [setIsSpeaking, setAvatarEmotion]);

  const pauseVoiceChat = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.pauseConversation();
    }
    
    if (isMounted.current) {
      setIsPaused(true);
      setIsSpeaking(false);
      toast.success('Conversation paused');
    }
  }, [setIsSpeaking]);

  const resumeVoiceChat = useCallback(() => {
    if (voiceServiceRef.current && isStudyPage) {
      voiceServiceRef.current.resumeConversation();
      
      if (isMounted.current) {
        setIsPaused(false);
        toast.success('Conversation resumed');
      }
    }
  }, [isStudyPage]);

  const toggleVoiceChat = useCallback(() => {
    if (isPaused) {
      resumeVoiceChat();
    } else {
      pauseVoiceChat();
    }
  }, [isPaused, pauseVoiceChat, resumeVoiceChat]);
  
  const forceSubmitTranscript = useCallback(() => {
    if (voiceServiceRef.current && isStudyPage) {
      voiceServiceRef.current.forceSubmitTranscript();
      toast.success('Transcript submitted manually');
    }
  }, [isStudyPage]);
  
  const setPauseThreshold = useCallback((milliseconds: number) => {
    if (milliseconds >= 500 && milliseconds <= 3000) {
      setPauseThresholdState(milliseconds);
      
      if (voiceServiceRef.current) {
        voiceServiceRef.current.setSilenceThreshold(milliseconds);
      }
      
      toast.success(`Speech end delay set to ${milliseconds}ms`);
    } else {
      toast.error('Speech end delay must be between 500ms and 3000ms');
    }
  }, []);
  
  const setDelayAfterSpeakingCallback = useCallback((milliseconds: number) => {
    if (milliseconds >= 200 && milliseconds <= 1000) {
      setDelayAfterSpeaking(milliseconds);
      
      if (voiceServiceRef.current) {
        voiceServiceRef.current.setDelayAfterSpeaking(milliseconds);
      }
      
      toast.success(`Delay after speaking set to ${milliseconds}ms`);
    } else {
      toast.error('Delay after speaking must be between 200ms and 1000ms');
    }
  }, []);
  
  const toggleFeedbackPrevention = useCallback(() => {
    const newValue = !feedbackPreventionEnabled;
    setFeedbackPreventionEnabled(newValue);
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.setFeedbackPrevention(newValue);
    }
    
    toast.success(`Feedback prevention ${newValue ? 'enabled' : 'disabled'}`);
  }, [feedbackPreventionEnabled]);

  // Return empty or disabled values when not on study page
  if (!isStudyPage) {
    return {
      isActive: false,
      isPaused: false,
      error: null,
      currentTranscript: '',
      startVoiceChat: async () => {},
      stopVoiceChat: () => {},
      pauseVoiceChat: () => {},
      resumeVoiceChat: () => {},
      toggleVoiceChat: () => {},
      forceSubmitTranscript: () => {},
      setPauseThreshold: () => {},
      setDelayAfterSpeaking: () => {},
      pauseThreshold: 1500,
      delayAfterSpeaking: 500,
      feedbackPreventionEnabled: true,
      toggleFeedbackPrevention: () => {},
      visualizationData: null,
      noiseLevel: 0
    };
  }

  return { 
    isActive,
    isPaused,
    error,
    currentTranscript,
    startVoiceChat,
    stopVoiceChat,
    pauseVoiceChat,
    resumeVoiceChat,
    toggleVoiceChat,
    forceSubmitTranscript,
    setPauseThreshold,
    setDelayAfterSpeaking: setDelayAfterSpeakingCallback,
    pauseThreshold,
    delayAfterSpeaking,
    feedbackPreventionEnabled,
    toggleFeedbackPrevention,
    visualizationData,
    noiseLevel
  };
};
