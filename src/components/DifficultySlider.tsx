import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { DifficultyLevel } from '../types';
import { Info } from 'lucide-react';
import { GroqService } from '../services/groqService';
import toast from 'react-hot-toast';

export const DifficultySlider: React.FC = () => {
  const { difficultyLevel, setDifficultyLevel, currentSubject, currentAvatar } = useStore();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [prevDifficulty, setPrevDifficulty] = useState<DifficultyLevel>(difficultyLevel);

  const levels: DifficultyLevel[] = ['Elementary', 'High School', 'College', 'Advanced'];

  // Clear conversation history when difficulty changes
  useEffect(() => {
    if (prevDifficulty !== difficultyLevel) {
      // Get user ID from local storage or session
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'anonymous';
      
      // Clear conversation history for this subject at the previous difficulty level
      GroqService.clearConversationHistory(userId, currentSubject, prevDifficulty);
      
      // Show toast notification
      toast.success(`Difficulty changed to ${difficultyLevel}`, {
        icon: '📚',
        duration: 3000,
      });
      
      // Update previous difficulty
      setPrevDifficulty(difficultyLevel);
    }
  }, [difficultyLevel, currentSubject, prevDifficulty]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    setDifficultyLevel(levels[index]);
  };

  const getCurrentLevelIndex = () => {
    return levels.indexOf(difficultyLevel);
  };

  const getDifficultyDescription = (level: DifficultyLevel) => {
    switch (level) {
      case 'Elementary':
        return `Basic ${currentSubject} concepts with simple explanations and examples suitable for beginners or young learners.`;
      case 'High School':
        return `Standard ${currentSubject} curriculum with practical applications and moderate complexity for teenage students.`;
      case 'College':
        return `Advanced ${currentSubject} concepts with deeper analysis and complex problem-solving for undergraduate level.`;
      case 'Advanced':
        return `Expert-level ${currentSubject} with specialized topics and sophisticated theoretical frameworks for graduate students.`;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Difficulty Level
        </label>
        <span className="text-sm font-medium text-primary-700">{difficultyLevel}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={getCurrentLevelIndex()}
          onChange={handleDifficultyChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        {levels.map((level) => (
          <div 
            key={level}
            className="relative"
            onMouseEnter={() => setShowTooltip(level)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <span 
              className={`${difficultyLevel === level ? 'font-medium text-primary-700' : ''}`}
            >
              {level.charAt(0)}
            </span>
            
            {showTooltip === level && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                <p>{getDifficultyDescription(level)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-2 flex items-start">
        <Info className="h-3.5 w-3.5 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
        <p className="text-xs text-gray-500">
          Changing difficulty will adjust the language complexity and depth of explanations.
        </p>
      </div>
    </div>
  );
};