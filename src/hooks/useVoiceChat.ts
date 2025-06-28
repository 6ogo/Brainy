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
    toggleListening,
    isStudyMode
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
    stopListening,
    resetTranscript
  } = useSpeechRecognition();
  
  // For study mode speech processing
  const transcriptTimeoutRef = useRef<number | null>(null);
  const lastProcessedTranscriptRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);
  const pauseThresholdRef = useRef<number>(600); // 0.6 seconds pause threshold
  const [visualizationData, setVisualizationData] = useState<Uint8Array | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<number>(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

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
            // If in study mode, make responses more concise
            if (isStudyMode) {
              // Simplify and shorten the response
              const simplifiedText = simplifyResponse(text);
              addMessage(simplifiedText, 'ai');
            } else {
              addMessage(text, 'ai');
            }
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
            processingRef.current = false;
          }
        },
        onError: (errorMessage) => {
          if (isMounted.current) {
            setError(errorMessage);
            toast.error(errorMessage);
            processingRef.current = false;
          }
        },
        onTranscript: (text, isFinal) => {
          if (isMounted.current) {
            setCurrentTranscript(text);
            
            if (isFinal) {
              if (text.trim().length > 3) {
                if (isStudyMode) {
                  // In study mode, wait for pause threshold after user stops speaking
                  if (transcriptTimeoutRef.current) {
                    clearTimeout(transcriptTimeoutRef.current);
                  }
                  
                  transcriptTimeoutRef.current = window.setTimeout(() => {
                    if (text !== lastProcessedTranscriptRef.current && !processingRef.current) {
                      lastProcessedTranscriptRef.current = text;
                      processingRef.current = true;
                      addMessage(text, 'user');
                    }
                  }, pauseThresholdRef.current);
                } else if (!processingRef.current) {
                  processingRef.current = true;
                  addMessage(text, 'user');
                }
              } else if (text.trim().length > 0) {
                toast('Speech too short. Please try again.', { icon: '🗣️' });
              }
            }
          }
        }
      });

      // Set up audio visualization callback
      if (voiceServiceRef.current) {
        voiceServiceRef.current.setAudioVisualizationCallback((data) => {
          setVisualizationData(data);
          
          // Calculate noise level (average of frequency data)
          if (data.length > 0) {
            const sum = data.reduce((acc, val) => acc + val, 0);
            setNoiseLevel(sum / data.length);
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      setError('Failed to initialize voice service');
    }
  }, [user, currentSubject, currentAvatar, difficultyLevel, addMessage, setIsSpeaking, setAvatarEmotion, toggleListening, isStudyMode]);

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
            // If in study mode, make responses more concise
            if (isStudyMode) {
              // Simplify and shorten the response
              const simplifiedText = simplifyResponse(text);
              addMessage(simplifiedText, 'ai');
            } else {
              addMessage(text, 'ai');
            }
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
            processingRef.current = false;
          }
        },
        onError: (errorMessage) => {
          if (isMounted.current) {
            setError(errorMessage);
            toast.error(errorMessage);
            processingRef.current = false;
          }
        },
        onTranscript: (text, isFinal) => {
          if (isMounted.current) {
            setCurrentTranscript(text);
            if (isFinal && text.trim()) {
              if (isStudyMode) {
                // In study mode, wait for pause threshold after user stops speaking
                if (transcriptTimeoutRef.current) {
                  clearTimeout(transcriptTimeoutRef.current);
                }
                
                transcriptTimeoutRef.current = window.setTimeout(() => {
                  if (text !== lastProcessedTranscriptRef.current && !processingRef.current) {
                    lastProcessedTranscriptRef.current = text;
                    processingRef.current = true;
                    addMessage(text, 'user');
                  }
                }, pauseThresholdRef.current);
              } else if (!processingRef.current) {
                processingRef.current = true;
                addMessage(text, 'user');
              }
            }
          }
        }
      });
      
      // Set up audio visualization callback
      if (voiceServiceRef.current) {
        voiceServiceRef.current.setAudioVisualizationCallback((data) => {
          setVisualizationData(data);
        });
      }
      
      console.log(`Voice service updated with difficulty level: ${difficultyLevel}`);
    }
  }, [difficultyLevel, user, currentSubject, currentAvatar, addMessage, setIsSpeaking, setAvatarEmotion, toggleListening, isStudyMode]);

  // Initialize audio context for noise detection
  useEffect(() => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
      
      return () => {
        context.close().catch(err => {
          console.error('Error closing audio context:', err);
        });
      };
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  const startVoiceChat = useCallback(async () => {
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      toast.error('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.startListening();
      } else {
        throw new Error('Voice service not initialized');
      }
      
      if (isMounted.current) {
        setIsActive(true);
        setIsPaused(false);
        setAvatarEmotion('neutral');
        setError(null);
        processingRef.current = false;
        toast.success('Voice chat started');
      }
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      if (isMounted.current) {
        setError('Failed to start voice chat. Please check your microphone permissions.');
        toast.error('Failed to start voice chat. Please check your microphone permissions.');
      }
    }
  }, [setAvatarEmotion, browserSupportsSpeechRecognition]);

  const stopVoiceChat = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
      voiceServiceRef.current.stopSpeaking();
    }
    
    if (isMounted.current) {
      setIsActive(false);
      setIsPaused(false);
      setIsSpeaking(false);
      setAvatarEmotion('neutral');
      setCurrentTranscript('');
      processingRef.current = false;
    }
  }, [setIsSpeaking, setAvatarEmotion]);

  const pauseVoiceChat = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.pauseConversation();
    }
    
    if (isMounted.current) {
      setIsPaused(true);
      setIsSpeaking(false);
      processingRef.current = false;
      toast.success('Conversation paused');
    }
  }, [setIsSpeaking]);

  const resumeVoiceChat = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.resumeConversation();
    }
    
    if (isMounted.current) {
      setIsPaused(false);
      processingRef.current = false;
      toast.success('Conversation resumed');
    }
  }, []);

  const toggleVoiceChat = useCallback(() => {
    if (isPaused) {
      resumeVoiceChat();
    } else {
      pauseVoiceChat();
    }
  }, [isPaused, pauseVoiceChat, resumeVoiceChat]);
  
  // Force submit current transcript (manual override for pause detection)
  const forceSubmitTranscript = useCallback(() => {
    if (currentTranscript && currentTranscript.trim().length > 3 && !processingRef.current) {
      // Clear any pending timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
        transcriptTimeoutRef.current = null;
      }
      
      // Process the current transcript
      lastProcessedTranscriptRef.current = currentTranscript;
      processingRef.current = true;
      addMessage(currentTranscript, 'user');
      
      // Also force submit in voice service
      if (voiceServiceRef.current) {
        voiceServiceRef.current.forceSubmitTranscript();
      }
      
      toast.success('Manually submitted transcript');
    } else {
      toast.error('No transcript to submit');
    }
  }, [currentTranscript, addMessage]);
  
  // Set pause threshold
  const setPauseThreshold = useCallback((milliseconds: number) => {
    if (milliseconds >= 300 && milliseconds <= 2000) {
      pauseThresholdRef.current = milliseconds;
      
      // Also update the voice service if available
      if (voiceServiceRef.current) {
        voiceServiceRef.current.setSilenceThreshold(milliseconds);
      }
      
      toast.success(`Pause threshold set to ${milliseconds}ms`);
    } else {
      toast.error('Pause threshold must be between 300ms and 2000ms');
    }
  }, []);
  
  // Helper function to simplify and shorten responses for study mode
  const simplifyResponse = (text: string): string => {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // Keep only essential sentences (first, last, and any with key educational terms)
    const keyTerms = ['important', 'key concept', 'remember', 'essential', 'fundamental', 'critical'];
    
    let essentialSentences: string[] = [];
    
    // Always include first sentence
    if (sentences.length > 0) {
      essentialSentences.push(sentences[0]);
    }
    
    // Include sentences with key terms (up to 3 more)
    let keyTermSentences = sentences.filter(sentence => 
      keyTerms.some(term => sentence.toLowerCase().includes(term))
    ).slice(0, 3);
    
    essentialSentences = [...essentialSentences, ...keyTermSentences];
    
    // Include last sentence if we have more than 2 sentences and it's not already included
    if (sentences.length > 2 && !essentialSentences.includes(sentences[sentences.length - 1])) {
      essentialSentences.push(sentences[sentences.length - 1]);
    }
    
    // Remove duplicates and join
    const uniqueSentences = [...new Set(essentialSentences)];
    
    // If we still have a long response, just take first 2-3 sentences
    if (uniqueSentences.join(' ').length > 300 && sentences.length > 3) {
      return sentences.slice(0, 3).join(' ');
    }
    
    return uniqueSentences.join(' ');
  };

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
    pauseThreshold: pauseThresholdRef.current,
    visualizationData,
    noiseLevel
  };
};