import React from 'react';
import { HelpCircle, Lightbulb, PenTool, Repeat } from 'lucide-react';
import { useStore } from '../store/store';

export const QuickActionButtons: React.FC = () => {
  const { addMessage, setIsSpeaking } = useStore();

  const handleAction = (action: string) => {
    addMessage(action, 'user');
    
    // Simulate AI response
    setIsSpeaking(true);
    setTimeout(() => {
      let response = '';
      
      switch (action) {
        case 'Explain differently':
          response = "Let me try a different approach. Instead of focusing on the formulas, let's think about the concept visually...";
          break;
        case 'Give an example':
          response = "Here's a concrete example to illustrate this concept: imagine you're calculating the speed of a car...";
          break;
        case 'Quiz me':
          response = "Let's test your understanding with a practice question: If f(x) = x², what is the derivative of f(x)?";
          break;
        case 'Need a hint':
          response = "Think about what we discussed regarding the power rule for derivatives. Remember that when differentiating x^n...";
          break;
      }
      
      addMessage(response, 'ai');
      setIsSpeaking(false);
    }, 1500);
  };

  const actions = [
    { label: 'Explain differently', icon: <Repeat className="h-5 w-5" /> },
    { label: 'Give an example', icon: <PenTool className="h-5 w-5" /> },
    { label: 'Quiz me', icon: <Lightbulb className="h-5 w-5" /> },
    { label: 'Need a hint', icon: <HelpCircle className="h-5 w-5" /> },
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
            onClick={() => handleAction(action.label)}
          >
            <span className="text-primary-600">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};