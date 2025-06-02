import React from 'react';
import { HelpCircle, Lightbulb, PenTool, Repeat } from 'lucide-react';
import { useStore } from '../store/store';
import { ElevenLabsService } from '../services/elevenlabsService';
import { ConversationService } from '../services/conversationService';
import toast from 'react-hot-toast';

export const QuickActionButtons: React.FC = () => {
  const { 
    addMessage, 
    setIsSpeaking, 
    currentAvatar,
    currentSubject
  } = useStore();

  const handleAction = async (action: string) => {
    try {
      // Add user's action as a message
      addMessage(action, 'user');
      setIsSpeaking(true);

      // Get AI response from conversation service
      const response = await ConversationService.generateResponse(
        action,
        currentSubject,
        currentAvatar,
        true // Enable voice
      );

      // Add AI response
      addMessage(response.text, 'ai');

      // Play audio if available
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        await audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(response.audioUrl!);
        };
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      setIsSpeaking(false);
      toast.error('Failed to process action. Please try again.');
    }
  };

  const actions = [
    { 
      label: 'Explain differently', 
      icon: <Repeat className="h-5 w-5" />,
      prompt: "Could you explain this concept in a different way, perhaps using an alternative approach or analogy?"
    },
    { 
      label: 'Give an example', 
      icon: <PenTool className="h-5 w-5" />,
      prompt: "Could you provide a practical, real-world example to illustrate this concept?"
    },
    { 
      label: 'Quiz me', 
      icon: <Lightbulb className="h-5 w-5" />,
      prompt: "I'd like to test my understanding. Could you give me a practice question about what we just discussed?"
    },
    { 
      label: 'Need a hint', 
      icon: <HelpCircle className="h-5 w-5" />,
      prompt: "Could you give me a hint to help me solve this problem without giving away the complete answer?"
    },
  ];

  return (
    <div className="p-3 border-t border-gray-200">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex items-center justify-center space-x-1 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm text-gray-700"
            onClick={() => handleAction(action.prompt)}
          >
            <span className="text-primary-600">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};