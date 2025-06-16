import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { VoiceConversationService } from '../services/voiceConversationService';
import { useAuth } from '../contexts/AuthContext';
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
    isListening
  } = useStore();
  
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const voiceServiceRef = useRef<VoiceConversationService | null>(null);

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
          addMessage(text, 'ai');
        },
        onAudioStart: () => {
          setIsSpeaking(true);
          setAvatarEmotion('neutral');
        },
        onAudioEnd: () => {
          setIsSpeaking(false);
          setAvatarEmotion('neutral');
        },
        onError: (errorMessage) => {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      });
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      setError('Failed to initialize voice service');
    }

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
        voiceServiceRef.current.stopSpeaking();
      }
    };
  }, [user, currentSubject, currentAvatar, difficultyLevel, addMessage, setIsSpeaking, setAvatarEmotion]);

  // Handle voice mode changes
  useEffect(() => {
    if (!voiceServiceRef.current) return;

    if (voiceMode === 'continuous') {
      startVoiceChat();
    } else if (voiceMode === 'muted') {
      stopVoiceChat();
    }
  }, [voiceMode]);

  // Monitor isListening state to handle user speech
  useEffect(() => {
    if (isListening && voiceServiceRef.current && !isActive) {
      setIsActive(true);
    }
  }, [isListening, isActive]);

  const startVoiceChat = useCallback(async () => {
    if (!voiceServiceRef.current) {
      setError('Voice service not initialized');
      return;
    }

    try {
      await voiceServiceRef.current.startListening();
      setIsActive(true);
      setAvatarEmotion('neutral');
      setError(null);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setError('Failed to start voice chat');
      toast.error('Failed to start voice chat. Please check your microphone permissions.');
    }
  }, [setAvatarEmotion]);

  const stopVoiceChat = useCallback(() => {
    if (!voiceServiceRef.current) return;

    voiceServiceRef.current.stopListening();
    voiceServiceRef.current.stopSpeaking();
    setIsActive(false);
    setIsSpeaking(false);
    setAvatarEmotion('neutral');
  }, [setIsSpeaking, setAvatarEmotion]);

  const toggleVoiceChat = useCallback(() => {
    if (isActive) {
      stopVoiceChat();
      setIsPaused(true);
    } else {
      startVoiceChat();
      setIsPaused(false);
    }
  }, [isActive, startVoiceChat, stopVoiceChat]);

  return {
    isActive,
    isPaused,
    error,
    startVoiceChat,
    stopVoiceChat,
    toggleVoiceChat
  };
};