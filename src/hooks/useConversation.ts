import { useState } from 'react';
import { useStore } from '../store/store';
import { ConversationService } from '../services/conversationService';
import toast from 'react-hot-toast';

export const useConversation = () => {
  const { 
    addMessage, 
    currentSubject,
    isVideoEnabled,
    setIsSpeaking,
    setAvatarEmotion
  } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async (message: string) => {
    try {
      setIsProcessing(true);
      setAvatarEmotion('thinking');
      
      // Add user message immediately
      addMessage(message, 'user');

      // Get AI response with audio/video
      const response = await ConversationService.generateResponse(
        message,
        currentSubject,
        isVideoEnabled,
        true // Always enable voice for now
      );

      // Start speaking animation
      setIsSpeaking(true);
      setAvatarEmotion('neutral');

      // Add AI response
      addMessage(response.text, 'ai');

      // Play audio if available
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        await audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          setAvatarEmotion('neutral');
        };
      }

      // Update video if available
      if (response.videoUrl) {
        // Handle video update in VideoArea component
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