import { useState } from 'react';
import { useStore } from '../store/store';
import { ConversationService } from '../services/conversationService';
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
    updateSocialStats
  } = useStore();
  
  const { user } = useAuth();
  const { checkAndAwardAchievements } = useAchievements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);

  const sendMessage = async (message: string) => {
    if (!user) {
      toast.error('Please sign in to continue.');
      return;
    }

    try {
      // Check if user has premium access
      const hasPremiumAccess = await hasAccess('premium');
      if (!hasPremiumAccess) {
        toast.error('This feature requires a premium subscription.');
        return;
      }

      // Check monthly usage limit
      const hasRemainingTime = await ConversationService.checkMonthlyUsage(user.id);
      if (!hasRemainingTime) {
        toast.error('You have reached your monthly usage limit.');
        return;
      }

      setIsProcessing(true);
      setAvatarEmotion('thinking');
      
      // Start timing the conversation
      if (!conversationStartTime) {
        setConversationStartTime(Date.now());
      }

      // Add user message immediately
      addMessage(message, 'user');

      // Get AI response with audio
      const response = await ConversationService.generateResponse(
        message,
        currentSubject,
        currentAvatar,
        true // Enable voice
      );

      // Start speaking animation
      setIsSpeaking(true);
      setAvatarEmotion('neutral');

      // Add AI response
      addMessage(response.text, 'ai');

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
        duration
      );

      // Play audio if available
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        await audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          setAvatarEmotion('neutral');
          URL.revokeObjectURL(response.audioUrl!);
        };
      } else {
        setIsSpeaking(false);
        setAvatarEmotion('neutral');
      }

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