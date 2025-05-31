import React from 'react';
import { useStore } from '../store/store';
import { Trophy, Flame, Share2, Award, Star } from 'lucide-react';
import { TwitterShareButton, LinkedinShareButton } from 'react-share';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

export const SocialFeatures: React.FC = () => {
  const { socialStats, messages, currentSubject } = useStore();
  const [showConfetti, setShowConfetti] = React.useState(false);

  const shareProgress = () => {
    const shareUrl = window.location.href;
    const shareTitle = `I'm mastering ${currentSubject} with AI Study Buddy! 🚀 Join me and revolutionize your learning journey.`;
    
    navigator.clipboard.writeText(shareTitle + '\n' + shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    });
  };

  const renderStreakBadge = () => (
    <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full">
      <Flame className="h-5 w-5" />
      <span className="font-bold">{socialStats.streak.current} Day Streak!</span>
    </div>
  );

  const renderLevelProgress = () => {
    const progress = (socialStats.totalXP % 1000) / 1000;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Level {socialStats.level}</span>
          <span>{socialStats.totalXP} XP</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const renderAchievements = () => (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Recent Achievements</h3>
      <div className="grid grid-cols-2 gap-2">
        {socialStats.achievements.slice(0, 4).map((achievement) => (
          <div 
            key={achievement.id}
            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
          >
            <Award className="h-5 w-5 text-primary-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">{achievement.title}</div>
              <div className="text-xs text-gray-500">{achievement.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveChallenges = () => (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Active Challenges</h3>
      <div className="space-y-2">
        {socialStats.activeChallenges.map((challenge) => (
          <div 
            key={challenge.id}
            className="p-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{challenge.title}</h4>
                <p className="text-sm text-gray-500">{challenge.description}</p>
              </div>
              <div className="flex items-center space-x-1 text-accent-500">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">{challenge.xpReward} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {showConfetti && <Confetti recycle={false} onComplete={() => setShowConfetti(false)} />}
      
      <div className="flex items-center justify-between">
        {renderStreakBadge()}
        <button
          onClick={shareProgress}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <Share2 className="h-5 w-5" />
          <span>Share Progress</span>
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {renderLevelProgress()}
      </div>

      <div className="border-t border-gray-200 pt-4">
        {renderAchievements()}
      </div>

      <div className="border-t border-gray-200 pt-4">
        {renderActiveChallenges()}
      </div>

      <div className="flex justify-center space-x-4 pt-2">
        <TwitterShareButton
          url={window.location.href}
          title={`I'm mastering ${currentSubject} with AI Study Buddy! 🚀`}
          className="hover:opacity-80"
        >
          <div className="flex items-center space-x-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg">
            <span>Share on Twitter</span>
          </div>
        </TwitterShareButton>

        <LinkedinShareButton
          url={window.location.href}
          title={`Learning ${currentSubject} with AI Study Buddy`}
          className="hover:opacity-80"
        >
          <div className="flex items-center space-x-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg">
            <span>Share on LinkedIn</span>
          </div>
        </LinkedinShareButton>
      </div>
    </div>
  );
};