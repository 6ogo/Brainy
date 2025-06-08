import { useState } from 'react';
import { useStore } from '../store/store';
import { ConversationService } from '../services/conversationService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from './useAchievements';
import { hasAccess } from '../services/subscriptionService';
import toast from 'react-hot-toast';

export const useConversation = () => {
  const { 
    addMessage, 
    currentSubject,
    currentAvatar,
    setIsSpeaking,
    setAvatarEmotion,
    updateSessionStats,
    sessionStats,
    socialStats,
    updateSocialStats,
    learningMode
  } = useStore();
  
  const { user } = useAuth();
  const { checkAndAwardAchievements } = useAchievements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);

  const sendMessage = async (message: string, useVoice: boolean = false) => {
    if (!user) {
      toast.error('Please sign in to continue.');
      return;
    }

    try {
      // Check if user has premium access for voice features
      if (useVoice) {
        const hasPremiumAccess = await hasAccess('premium');
        if (!hasPremiumAccess) {
          toast.error('Voice features require a premium subscription.');
          return;
        }
      }

      setIsProcessing(true);
      setAvatarEmotion('thinking');
      
      // Start timing the conversation
      if (!conversationStartTime) {
        setConversationStartTime(Date.now());
      }

      // Add user message immediately
      addMessage(message, 'user');

      // Get AI response with optional voice
      const response = await ConversationService.generateResponse(
        message,
        currentSubject,
        currentAvatar,
        useVoice
      );

      // Add AI response
      addMessage(response.text, 'ai');

      // Handle voice playback if available
      if (response.audioBlob && useVoice) {
        setIsSpeaking(true);
        setAvatarEmotion('neutral');
        
        try {
          await ElevenLabsService.playAudio(response.audioBlob);
        } catch (audioError) {
          console.error('Audio playback error:', audioError);
          toast.error('Failed to play audio response');
        } finally {
          setIsSpeaking(false);
          setAvatarEmotion('neutral');
        }
      } else {
        setAvatarEmotion('neutral');
      }

      // Calculate conversation duration
      const duration = conversationStartTime 
        ? Math.round((Date.now() - conversationStartTime) / 1000)
        : 0;

      // Update session and social stats
      const newXP = 10;
      const updatedSessionStats = {
        ...sessionStats,
        messagesCount: sessionStats.messagesCount + 2,
        xpEarned: sessionStats.xpEarned + newXP
      };
      
      updateSessionStats(updatedSessionStats);
      updateSocialStats({
        ...socialStats,
        totalXP: socialStats.totalXP + newXP
      });

      // Check for achievements
      checkAndAwardAchievements({
        ...socialStats,
        totalXP: socialStats.totalXP + newXP
      });

      // Save conversation
      await ConversationService.saveConversation(
        user.id,
        message,
        response.text,
        duration,
        response.summary
      );

    } catch (error) {
      console.error('Error in conversation:', error);
      toast.error('Failed to process message. Please try again.');
      setIsSpeaking(false);
      setAvatarEmotion('neutral');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendMessage,
    isProcessing
  };
};