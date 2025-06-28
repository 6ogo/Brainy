import React, { useState } from 'react';
import { useStore } from '../store/store';
import { DifficultyLevel } from '../types';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  BookOpen, 
  Brain, 
  Target, 
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from './Button';
import toast from 'react-hot-toast';

interface DifficultyLevelSelectorProps {
  onClose: () => void;
  className?: string;
}

export const DifficultyLevelSelector: React.FC<DifficultyLevelSelectorProps> = ({
  onClose,
  className
}) => {
  const { difficultyLevel, setDifficultyLevel, currentSubject } = useStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(difficultyLevel);
  const [applyToAllSubjects, setApplyToAllSubjects] = useState(false);
  const [showInfo, setShowInfo] = useState<DifficultyLevel | null>(null);

  const difficultyLevels: Array<{
    id: DifficultyLevel;
    name: string;
    description: string;
    icon: React.ReactNode;
    examples: string[];
  }> = [
    {
      id: 'Elementary',
      name: 'Easy',
      description: 'Basic concepts and straightforward questions',
      icon: <BookOpen className="h-6 w-6 text-green-600" />,
      examples: [
        'Simple explanations with everyday examples',
        'Step-by-step guidance for basic problems',
        'Fundamental concepts with visual aids',
        'Clear, concise language with minimal jargon'
      ]
    },
    {
      id: 'High School',
      name: 'Medium',
      description: 'Moderate complexity with some challenging elements',
      icon: <Brain className="h-6 w-6 text-blue-600" />,
      examples: [
        'More detailed explanations of concepts',
        'Problems requiring multiple steps to solve',
        'Introduction to field-specific terminology',
        'Balance of theory and practical applications'
      ]
    },
    {
      id: 'College',
      name: 'Hard',
      description: 'Advanced concepts and complex problem-solving',
      icon: <Target className="h-6 w-6 text-purple-600" />,
      examples: [
        'In-depth analysis of complex topics',
        'Challenging problems requiring critical thinking',
        'Advanced terminology and theoretical frameworks',
        'Connections between different concepts and domains'
      ]
    }
  ];

  const handleSaveDifficulty = () => {
    setDifficultyLevel(selectedDifficulty);
    
    // In a real implementation, we would save the preference to all subjects if applyToAllSubjects is true
    // For now, we'll just show a toast message
    
    if (applyToAllSubjects) {
      toast.success(`Difficulty set to ${selectedDifficulty} for all subjects`, {
        icon: '📚',
        duration: 3000,
      });
    } else {
      toast.success(`Difficulty set to ${selectedDifficulty} for ${currentSubject}`, {
        icon: '📚',
        duration: 3000,
      });
    }
    
    onClose();
  };

  return (
    <Card className={cn("p-6 max-w-2xl mx-auto", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(commonStyles.heading.h3)}>
          Select Difficulty Level
        </h3>
        <Button
          variant="text"
          onClick={onClose}
          className="p-1"
          aria-label="Close"
        >
          ×
        </Button>
      </div>

      <p className="text-gray-600 mb-6">
        Choose your preferred difficulty level for study materials. This affects the complexity of explanations, examples, and questions.
      </p>

      <div className="space-y-4 mb-6">
        {difficultyLevels.map((level) => (
          <div 
            key={level.id}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-all",
              selectedDifficulty === level.id 
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-50" 
                : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
            )}
            onClick={() => setSelectedDifficulty(level.id)}
          >
            <div className="flex items-start">
              <div className={cn(
                "p-2 rounded-full mr-3 mt-1",
                selectedDifficulty === level.id ? "bg-primary-100" : "bg-gray-100"
              )}>
                {level.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 text-lg">{level.name}</h4>
                  {selectedDifficulty === level.id && (
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  )}
                </div>
                
                <p className="text-gray-600 mb-2">{level.description}</p>
                
                <div className="flex items-center">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(showInfo === level.id ? null : level.id);
                    }}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {showInfo === level.id ? 'Hide examples' : 'Show examples'}
                  </button>
                </div>
                
                {showInfo === level.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2 text-sm">Examples for {level.name} difficulty:</h5>
                    <ul className="space-y-1">
                      {level.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={applyToAllSubjects}
            onChange={() => setApplyToAllSubjects(!applyToAllSubjects)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="text-gray-700">Apply this difficulty setting to all subjects</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSaveDifficulty}
        >
          Save Preferences
        </Button>
      </div>
    </Card>
  );
};

export default DifficultyLevelSelector;