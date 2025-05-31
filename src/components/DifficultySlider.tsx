import React from 'react';
import { useStore } from '../store/store';
import { DifficultyLevel } from '../types';

export const DifficultySlider: React.FC = () => {
  const { difficultyLevel, setDifficultyLevel } = useStore();

  const levels: DifficultyLevel[] = ['Elementary', 'High School', 'College', 'Advanced'];

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    setDifficultyLevel(levels[index]);
  };

  const getCurrentLevelIndex = () => {
    return levels.indexOf(difficultyLevel);
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
          <span 
            key={level}
            className={`${difficultyLevel === level ? 'font-medium text-primary-700' : ''}`}
          >
            {level.charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );
};