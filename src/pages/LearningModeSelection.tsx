import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { LearningMode } from '../types';
import { ArrowLeft, MessageCircle, Mic } from 'lucide-react';

const modes: Array<{
  id: LearningMode;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    id: 'conversational',
    name: 'Text Chat',
    description: 'Interactive text-based chat with your AI tutor. Great for deep discussions and detailed explanations.',
    icon: MessageCircle,
    color: 'bg-blue-500',
  },
  {
    id: 'videocall',
    name: 'Voice Chat',
    description: 'Talk with your AI tutor using your voice. Perfect for natural conversation and hands-free learning.',
    icon: Mic,
    color: 'bg-purple-500',
  },
];

export const LearningModeSelection: React.FC = () => {
  const { currentSubject, setCurrentAvatar } = useStore();
  const navigate = useNavigate();

  const handleModeSelect = (mode: LearningMode) => {
    setCurrentAvatar(mode);
    navigate('/study'); // Navigate directly to study page instead of learning mode
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Teachers Button */}
        <div className="mb-8">
          <Link 
            to="/teachers" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teachers
          </Link>
        </div>
        
        <div className="text-center mb-12">
          <h1 className={cn(commonStyles.heading.h1, "mb-4")}>
            Choose Your Learning Mode
          </h1>
          <p className={cn(commonStyles.text.lg, "max-w-2xl mx-auto")}>
            How would you like to learn {currentSubject} today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modes.map((mode) => (
            <Card
              key={mode.id}
              variant="interactive"
              className="p-8 h-full flex flex-col"
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className={cn(
                  "p-4 rounded-full text-white mb-6",
                  mode.color
                )}>
                  <mode.icon size={32} />
                </div>
                <h3 className={cn(commonStyles.heading.h2, "mb-4")}>
                  {mode.name}
                </h3>
                <p className={cn(commonStyles.text.lg, "mb-auto")}>
                  {mode.description}
                </p>
                <button 
                  className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Start Learning
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};