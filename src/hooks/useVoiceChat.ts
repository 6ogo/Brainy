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
    stopListening
  } = useSpeechRecognition();
  
  // For study mode speech processing
  const transcriptTimeoutRef = useRef<number | null>(null);
  const lastProcessedTranscriptRef = useRef<string>('');

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
              if (isStudyMode) {
                // In study mode, wait 2 seconds after user stops speaking
                if (transcriptTimeoutRef.current) {
                  clearTimeout(transcriptTimeoutRef.current);
                }
                
                transcriptTimeoutRef.current = window.setTimeout(() => {
                  if (text !== lastProcessedTranscriptRef.current) {
                    lastProcessedTranscriptRef.current = text;
                    toggleListening(true);
                  }
                }, 2000);
              } else {
                toggleListening(true);
              }
            }
          }
        }
      });
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
              if (isStudyMode) {
                // In study mode, wait 2 seconds after user stops speaking
                if (transcriptTimeoutRef.current) {
                  clearTimeout(transcriptTimeoutRef.current);
                }
                
                transcriptTimeoutRef.current = window.setTimeout(() => {
                  if (text !== lastProcessedTranscriptRef.current) {
                    lastProcessedTranscriptRef.current = text;
                    toggleListening(true);
                  }
                }, 2000);
              } else {
                toggleListening(true);
              }
            }
          }
        }
      });
      
      console.log(`Voice service updated with difficulty level: ${difficultyLevel}`);
    }
  }, [difficultyLevel, user, currentSubject, currentAvatar, addMessage, setIsSpeaking, setAvatarEmotion, toggleListening, isStudyMode]);

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
    toggleVoiceChat
  };
};