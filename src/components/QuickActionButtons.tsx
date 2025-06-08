import React from 'react';
import { HelpCircle, Lightbulb, PenTool, Repeat, Phone, MessageSquare } from 'lucide-react';
import { useStore } from '../store/store';
import { useConversation } from '../hooks/useConversation';
import toast from 'react-hot-toast';

export const QuickActionButtons: React.FC = () => {
  const { currentSubject } = useStore();
  const { sendMessage, isProcessing } = useConversation();

  const handleAction = async (prompt: string, useVoice: boolean = false) => {
    if (isProcessing) {
      toast.error('Please wait for the current response to complete');
      return;
    }

    try {
      await sendMessage(prompt, useVoice);
    } catch (error) {
      console.error('Error handling quick action:', error);
      toast.error('Failed to process action. Please try again.');
    }
  };

  const actions = [
    { 
      label: 'Explain differently', 
      icon: <Repeat className="h-5 w-5" />,
      prompt: "Could you explain this concept in a different way, perhaps using an alternative approach or analogy?",
      color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
    },
    { 
      label: 'Give an example', 
      icon: <PenTool className="h-5 w-5" />,
      prompt: "Could you provide a practical, real-world example to illustrate this concept?",
      color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
    },
    { 
      label: 'Quiz me', 
      icon: <Lightbulb className="h-5 w-5" />,
      prompt: "I'd like to test my understanding. Could you give me a practice question about what we just discussed?",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
    },
    { 
      label: 'Need a hint', 
      icon: <HelpCircle className="h-5 w-5" />,
      prompt: "Could you give me a hint to help me solve this problem without giving away the complete answer?",
      color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
    },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Quick Actions
      </h3>
      
      {/* Text/Voice Mode Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleAction("Let's continue our discussion about " + currentSubject, false)}
          className="flex items-center justify-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors text-sm text-gray-700"
          disabled={isProcessing}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Text Chat</span>
        </button>
        
        <button
          onClick={() => handleAction("Let's have a voice conversation about " + currentSubject, true)}
          className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors text-sm text-green-700"
          disabled={isProcessing}
        >
          <Phone className="h-4 w-4" />
          <span>Voice Call</span>
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className={`flex items-center justify-center space-x-2 p-3 border rounded-md transition-colors text-sm ${action.color}`}
            onClick={() => handleAction(action.prompt, false)}
            disabled={isProcessing}
          >
            <span className="flex-shrink-0">{action.icon}</span>
            <span className="text-center">{action.label}</span>
          </button>
        ))}
      </div>
      
      {/* Voice Action Buttons */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Voice Actions (Premium)</p>
        <div className="grid grid-cols-2 gap-2">
          {actions.slice(0, 2).map((action) => (
            <button
              key={`voice-${action.label}`}
              className="flex items-center justify-center space-x-1 p-2 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors text-xs text-green-700"
              onClick={() => handleAction(action.prompt, true)}
              disabled={isProcessing}
            >
              <Phone className="h-3 w-3" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};