import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { VoiceConversationService } from '../services/voiceConversationService';
import { SimplifiedElevenLabsService } from '../services/simplifiedElevenLabsService';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../constants/ai';
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

  // Initialize voice service when needed
  useEffect(() => {
    if (!user || !currentSubject || !currentAvatar) return;

    try {
      console.log('🎤 Initializing voice service');
      
      voiceServiceRef.current = new VoiceConversationService({
        userId: user.id,
        subject: currentSubject,
        avatarPersonality: currentAvatar,
        difficultyLevel: difficultyLevel,
        onResponse: (text) => {
          if (isMounted.current) {
            console.log('📝 AI Response received:', text.substring(0, 50) + '...');
            addMessage(text, 'ai');
          }
        },
        onAudioStart: () => {
          if (isMounted.current) {
            console.log('🔊 Audio playback started');
            setIsSpeaking(true);
            setAvatarEmotion('speaking');
          }
        },
        onAudioEnd: () => {
          if (isMounted.current) {
            console.log('🔇 Audio playback ended');
            setIsSpeaking(false);
            setAvatarEmotion('neutral');
          }
        },
        onError: (errorMessage) => {
          if (isMounted.current) {
            console.error('❌ Voice service error:', errorMessage);
            setError(errorMessage);
            toast.error(errorMessage);
          }
        },
        onTranscript: (text, isFinal) => {
          if (isMounted.current) {
            console.log('🎙️ Transcript update:', text, 'Final:', isFinal);
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
      
      console.log('✅ Voice service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
      setError('Failed to initialize voice service');
    }
  }, [user, currentSubject, currentAvatar, difficultyLevel, addMessage, setIsSpeaking, setAvatarEmotion]);

  // Update voice service when difficulty level changes
  useEffect(() => {
    if (voiceServiceRef.current && user && isMounted.current) {
      console.log('🔄 Updating voice service with new difficulty level:', difficultyLevel);
      
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
  }, [difficultyLevel, user, currentSubject, currentAvatar, addMessage, setIsSpeaking, setAvatarEmotion]);

  const startVoiceChat = useCallback(async () => {
    console.log('🎤 Starting voice chat...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorMsg = ERROR_MESSAGES.BROWSER_SUPPORT;
      setError(errorMsg);
      toast.error(errorMsg);
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
          toast.success('🎤 Voice chat started - speak naturally');
        }
      } else {
        throw new Error('Voice service not initialized');
      }
    } catch (error) {
      console.error('❌ Failed to start voice chat:', error);
      if (isMounted.current) {
        const errorMsg = ERROR_MESSAGES.MICROPHONE_ACCESS;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  }, [setAvatarEmotion]);

  const stopVoiceChat = useCallback(() => {
    console.log('🛑 Stopping voice chat...');
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    
    if (isMounted.current) {
      setIsActive(false);
      setIsPaused(false);
      setIsSpeaking(false);
      setAvatarEmotion('neutral');
      setCurrentTranscript('');
      toast.success('🛑 Voice chat stopped');
    }
  }, [setIsSpeaking, setAvatarEmotion]);

  const pauseVoiceChat = useCallback(() => {
    console.log('⏸️ Pausing voice chat...');
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.pauseConversation();
    }
    
    if (isMounted.current) {
      setIsPaused(true);
      setIsSpeaking(false);
      toast.success('⏸️ Conversation paused');
    }
  }, [setIsSpeaking]);

  const resumeVoiceChat = useCallback(() => {
    console.log('▶️ Resuming voice chat...');
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.resumeConversation();
      
      if (isMounted.current) {
        setIsPaused(false);
        toast.success('▶️ Conversation resumed');
      }
    }
  }, []);

  const toggleVoiceChat = useCallback(() => {
    if (isPaused) {
      resumeVoiceChat();
    } else {
      pauseVoiceChat();
    }
  }, [isPaused, pauseVoiceChat, resumeVoiceChat]);
  
  const forceSubmitTranscript = useCallback(() => {
    console.log('📤 Force submitting transcript...');
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.forceSubmitTranscript();
      toast.success('📤 Transcript submitted manually');
    }
  }, []);
  
  const setPauseThreshold = useCallback((milliseconds: number) => {
    if (milliseconds >= 500 && milliseconds <= 3000) {
      setPauseThresholdState(milliseconds);
      
      if (voiceServiceRef.current) {
        voiceServiceRef.current.setSilenceThreshold(milliseconds);
      }
      
      toast.success(`⏱️ Speech end delay set to ${milliseconds}ms`);
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
      
      toast.success(`⏱️ Delay after speaking set to ${milliseconds}ms`);
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
    
    toast.success(`🛡️ Feedback prevention ${newValue ? 'enabled' : 'disabled'}`);
  }, [feedbackPreventionEnabled]);

  // Test function for debugging ElevenLabs
  const testElevenLabsVoice = useCallback(async () => {
    try {
      console.log('🧪 Testing ElevenLabs voice...');
      toast.loading('Testing ElevenLabs voice...');
      
      // Test API status first
      const isWorking = await SimplifiedElevenLabsService.testAPI();
      if (!isWorking) {
        toast.error('❌ ElevenLabs API test failed');
        return;
      }
      
      // Test voice generation
      const testText = "Hello, this is a test of the ElevenLabs voice system.";
      const audioBlob = await SimplifiedElevenLabsService.generateSpeech(testText, currentAvatar);
      
      if (audioBlob && audioBlob.size > 1000) {
        await SimplifiedElevenLabsService.playAudioBlob(audioBlob);
        toast.success('✅ ElevenLabs voice test successful!');
      } else {
        toast.warning('⚠️ ElevenLabs returned fallback audio');
      }
    } catch (error) {
      console.error('❌ ElevenLabs test failed:', error);
      toast.error('❌ ElevenLabs test failed: ' + (error as Error).message);
    }
  }, [currentAvatar]);

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
    noiseLevel,
    testElevenLabsVoice
  };
};
