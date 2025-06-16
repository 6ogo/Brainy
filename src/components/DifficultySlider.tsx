import React, { useState } from 'react';
import { useStore } from '../store/store';
import { DifficultyLevel } from '../types';
import { Info } from 'lucide-react';

export const DifficultySlider: React.FC = () => {
  const { difficultyLevel, setDifficultyLevel, currentSubject } = useStore();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const levels: DifficultyLevel[] = ['Elementary', 'High School', 'College', 'Advanced'];

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
        return `Basic ${currentSubject} concepts with simple explanations`;
      case 'High School':
        return `Standard ${currentSubject} curriculum with practical applications`;
      case 'College':
        return `Advanced ${currentSubject} concepts with deeper analysis`;
      case 'Advanced':
        return `Expert-level ${currentSubject} with specialized topics`;
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Difficulty Level: {difficultyLevel}
      </label>
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
    </div>
  );
};