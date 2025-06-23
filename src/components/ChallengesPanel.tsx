import React from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  deadline: Date;
  isCompleted: boolean;
  timeLeft: number; // seconds
  status: 'active' | 'success' | 'failed';
}

interface ChallengesPanelProps {
  challenges: Challenge[];
  onClaim?: (challengeId: string) => void;
}

const ChallengesPanel: React.FC<ChallengesPanelProps> = ({ challenges, onClaim }) => {
  return (
    <div className="challenges-panel bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">Active Challenges</h3>
      <ul className="space-y-2">
        {challenges.map((ch) => (
          <li key={ch.id} className={`p-3 rounded border flex flex-col md:flex-row md:items-center md:justify-between ${ch.status === 'success' ? 'border-green-400 bg-green-50' : ch.status === 'failed' ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <div>
              <div className="font-semibold text-blue-900 flex items-center">
                {ch.title}
                {ch.status === 'success' && <span className="ml-2 text-green-600 text-xs font-bold">Completed!</span>}
                {ch.status === 'failed' && <span className="ml-2 text-red-600 text-xs font-bold">Failed</span>}
              </div>
              <div className="text-xs text-gray-600">{ch.description}</div>
              <div className="text-xs text-gray-400 mt-1">Reward: {ch.xpReward} XP · Time left: {ch.status === 'active' ? `${Math.floor(ch.timeLeft/60)}m ${ch.timeLeft%60}s` : '--'}</div>
            </div>
            {ch.status === 'success' && onClaim && (
              <button
                onClick={() => onClaim(ch.id)}
                className="mt-2 md:mt-0 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
              >
                Claim XP
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChallengesPanel;
