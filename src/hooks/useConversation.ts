import { useState } from 'react';
import { useStore } from '../store/store';
import { ConversationService } from '../services/conversationService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from './useAchievements';
import { hasAccess, checkDailyUsageLimit, trackDailyUsage } from '../services/subscriptionService';
import { conversationRateLimiter } from '../utils/rateLimiter';
import { SecurityUtils } from '../utils/security';
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
    learningMode,
    difficultyLevel
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

    // Rate limiting check
    if (!conversationRateLimiter.isAllowed(user.id)) {
      toast.error('Too many messages. Please wait a moment before sending another.');
      return;
    }

    // Input validation and sanitization
    const sanitizedMessage = SecurityUtils.sanitizeInput(message);
    if (!SecurityUtils.validateInput(sanitizedMessage, 2000)) {
      toast.error('Message is too long or contains invalid characters.');
      return;
    }

    if (sanitizedMessage.trim().length === 0) {
      toast.error('Please enter a message.');
      return;
    }

    try {
      // Check daily usage limits
      const canUseConversation = await checkDailyUsageLimit('conversation');
      if (!canUseConversation) {
        toast.error('Daily conversation limit reached. Upgrade your plan for more usage.');
        return;
      }

      // Check if user has premium access for voice features
      if (useVoice) {
        const hasPremiumAccess = await hasAccess('premium');
        if (!hasPremiumAccess) {
          toast.error('Voice features require a premium subscription.');
          return;
        }

        const canUseVideo = await checkDailyUsageLimit('video');
        if (!canUseVideo) {
          toast.error('Daily video call limit reached. Upgrade your plan for more usage.');
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
      addMessage(sanitizedMessage, 'user');

      // Get AI response with optional voice
      const response = await ConversationService.generateResponse(
        sanitizedMessage,
        currentSubject,
        currentAvatar,
        useVoice,
        difficultyLevel
      );

      // Validate AI response
      const sanitizedResponse = SecurityUtils.sanitizeInput(response.text);
      if (!SecurityUtils.validateInput(sanitizedResponse, 5000)) {
        throw new Error('Invalid response from AI service');
      }

      // Add AI response
      addMessage(sanitizedResponse, 'ai');

      // Handle voice playback if available
      if (response.audioBlob && useVoice) {
        setIsSpeaking(true);
        setAvatarEmotion('neutral');
        
        try {
          // Check if audio is supported before playing
          if (!ElevenLabsService.isAudioSupported()) {
            throw new Error('Audio playback not supported in this browser');
          }
          
          await ElevenLabsService.playAudio(response.audioBlob);
        } catch (audioError) {
          console.error('Audio playback error:', audioError);
          
          // Provide specific error messages
          if (audioError instanceof Error) {
            if (audioError.message.includes('not supported')) {
              toast.error('Audio playback not supported in this browser');
            } else if (audioError.message.includes('timeout')) {
              toast.error('Audio loading timeout - please try again');
            } else {
              toast.error('Failed to play audio response');
            }
          } else {
            toast.error('Failed to play audio response');
          }
        } finally {
          setIsSpeaking(false);
          setAvatarEmotion('neutral');
        }
      } else {
        setAvatarEmotion('neutral');
      }

      // Calculate conversation duration and track usage
      const duration = conversationStartTime 
        ? Math.round((Date.now() - conversationStartTime) / 1000)
        : 0;

      const conversationMinutes = Math.ceil(duration / 60);
      const videoMinutes = useVoice ? Math.ceil(duration / 60) : 0;

      // Track daily usage
      try {
        // Format the month_year field correctly (YYYY-MM)
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        await trackDailyUsage(conversationMinutes, videoMinutes);
      } catch (usageError) {
        console.error('Error tracking daily usage:', usageError);
        // Don't fail the conversation if usage tracking fails
      }

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

      // Save conversation with sanitized data
      await ConversationService.saveConversation(
        user.id,
        sanitizedMessage,
        sanitizedResponse,
        duration,
        response.summary ? SecurityUtils.sanitizeInput(response.summary) : undefined
      );

    } catch (error) {
      console.error('Error in conversation:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          toast.error('Too many requests. Please wait a moment.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your connection.');
        } else if (error.message.includes('Invalid response')) {
          toast.error('Received invalid response. Please try again.');
        } else if (error.message.includes('Daily conversation limit')) {
          toast.error('Daily conversation limit reached. Upgrade for more usage.');
        } else if (error.message.includes('Premium subscription required')) {
          toast.error('Voice features require a premium subscription.');
        } else if (error.message.includes('Voice service')) {
          toast.error('Voice service temporarily unavailable. Please try text mode.');
        } else {
          toast.error('Failed to process message. Please try again.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
      
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