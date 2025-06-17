import React from 'react';
import { useStore } from '../store/store';
import { cn } from '../styles/utils';
import { Award, Zap } from 'lucide-react';

interface LevelProgressBarProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ 
  className,
  showDetails = true,
  compact = false
}) => {
  const { socialStats } = useStore();
  
  // Calculate level progress
  const currentXP = socialStats.totalXP;
  const currentLevel = socialStats.level;
  const nextLevelXP = (currentLevel + 1) * 1000;
  const prevLevelXP = currentLevel * 1000;
  const xpForCurrentLevel = currentXP - prevLevelXP;
  const xpRequiredForNextLevel = nextLevelXP - prevLevelXP;
  const progressPercent = Math.round((xpForCurrentLevel / xpRequiredForNextLevel) * 100);
  
  // Calculate estimated time to next level
  const xpNeeded = nextLevelXP - currentXP;
  const learningVelocity = 50; // Placeholder XP/hour - in a real app, calculate from user data
  const hoursToNextLevel = learningVelocity > 0 ? Math.ceil(xpNeeded / learningVelocity) : 0;
  
  return (
    <div className={cn("w-full", className)}>
      {showDetails && !compact && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div className="p-1.5 bg-primary-100 rounded-full mr-2">
              <Zap className="h-4 w-4 text-primary-600" />
            </div>
            <span className="font-medium text-gray-900">Level {currentLevel}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Next: Level {currentLevel + 1}</span>
            <Award className="h-4 w-4 text-primary-600" />
          </div>
        </div>
      )}
      
      {compact && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Level {currentLevel}</span>
          <span className="text-xs text-gray-500">{progressPercent}%</span>
        </div>
      )}
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {showDetails && !compact && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{xpForCurrentLevel} / {xpRequiredForNextLevel} XP</span>
          {hoursToNextLevel > 0 && (
            <span>~{hoursToNextLevel} hours to next level</span>
          )}
        </div>
      )}
      
      {compact && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{currentXP} XP total</span>
          <span className="text-xs text-gray-500">{xpNeeded} XP needed</span>
        </div>
      )}
    </div>
  );
};