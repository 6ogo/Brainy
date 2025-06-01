import { useState } from 'react';
import { useStore } from '../store/store';
import { ConversationService } from '../services/conversationService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useConversation = () => {
  const { 
    addMessage, 
    currentSubject,
    currentAvatar,
    setIsSpeaking,
    setAvatarEmotion,
    updateSessionStats,
    sessionStats
  } = useStore();
  
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async (message: string) => {
    try {
      setIsProcessing(true);
      setAvatarEmotion('thinking');
      
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

      // Update session stats
      updateSessionStats({
        ...sessionStats,
        messagesCount: sessionStats.messagesCount + 2,
        xpEarned: sessionStats.xpEarned + 10
      });

      // Save conversation if user is logged in
      if (user) {
        await ConversationService.saveConversation(user.id, message, response.text);
      }

      // Play audio if available
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        await audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          setAvatarEmotion('neutral');
          // Clean up audio URL
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