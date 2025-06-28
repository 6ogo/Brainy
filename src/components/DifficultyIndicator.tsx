import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Sliders } from 'lucide-react';
import { cn } from '../styles/utils';
import { DifficultyLevelSelector } from './DifficultyLevelSelector';

interface DifficultyIndicatorProps {
  className?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

export const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({
  className,
  showLabel = true,
  onClick
}) => {
  const { difficultyLevel } = useStore();
  const [showSelector, setShowSelector] = useState(false);

  const getDifficultyColor = () => {
    switch (difficultyLevel) {
      case 'Elementary':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'High School':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'College':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyLabel = () => {
    switch (difficultyLevel) {
      case 'Elementary':
        return 'Easy';
      case 'High School':
        return 'Medium';
      case 'College':
        return 'Hard';
      case 'Advanced':
        return 'Expert';
      default:
        return difficultyLevel;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowSelector(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-full border transition-colors",
          getDifficultyColor(),
          className
        )}
      >
        <Sliders className="h-3 w-3" />
        {showLabel && <span className="text-xs font-medium">{getDifficultyLabel()}</span>}
      </button>

      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <DifficultyLevelSelector onClose={() => setShowSelector(false)} />
        </div>
      )}
    </>
  );
};

export default DifficultyIndicator;