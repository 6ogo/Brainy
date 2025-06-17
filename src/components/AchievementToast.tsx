import React from 'react';
import { Trophy } from 'lucide-react';

interface AchievementToastProps {
  title: string;
  description: string;
  xp?: number;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ title, description, xp }) => {
  return (
    <div className="flex items-center bg-white rounded-lg shadow-lg border border-primary-200 p-4 max-w-md">
      <div className="flex-shrink-0 mr-4">
        <div className="bg-primary-100 rounded-full p-2">
          <Trophy className="h-6 w-6 text-primary-600" />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        {xp && (
          <p className="text-sm font-medium text-primary-600 mt-1">
            +{xp} XP
          </p>
        )}
      </div>
    </div>
  );
};