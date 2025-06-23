import React from 'react';

interface AchievementTrackerProps {
  achievements: { id: string; icon: string; title: string; completed: boolean }[];
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ achievements }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-lg p-3 flex flex-col items-center space-y-2 border border-yellow-100">
      <span className="text-xs font-semibold text-yellow-700 mb-1">Achievements</span>
      <div className="flex space-x-2">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`flex flex-col items-center ${ach.completed ? 'opacity-100' : 'opacity-40'}`}
            title={ach.title}
          >
            <span className="text-2xl">{ach.icon}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementTracker;
