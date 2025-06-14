import React, { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { Trophy, Flame, Share2, Award, Star } from 'lucide-react';
import { TwitterShareButton, LinkedinShareButton } from 'react-share';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Achievement, Challenge } from '../types';

export const SocialFeatures: React.FC = () => {
  const { socialStats, messages, currentSubject, updateSocialStats } = useStore();
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('conversations')
          .select('id, user_message, ai_response, duration, timestamp')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(20);
        
        if (achievementsError) throw achievementsError;
        
        // Generate achievements based on conversation data
        const userAchievements = generateAchievements(achievementsData || []);
        setAchievements(userAchievements);
        
        // Update store with achievements
        updateSocialStats({
          ...socialStats,
          achievements: userAchievements
        });
        
        // Generate active challenges
        const activeChallenges = generateChallenges(currentSubject);
        setChallenges(activeChallenges);
        
        // Update store with challenges
        updateSocialStats({
          ...socialStats,
          activeChallenges
        });
        
      } catch (error) {
        console.error('Error fetching social data:', error);
        // Use fallback data if fetch fails
        setAchievements(socialStats.achievements);
        setChallenges(socialStats.activeChallenges);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSocialData();
  }, [user, currentSubject, updateSocialStats]);

  const generateAchievements = (conversations: any[]): Achievement[] => {
    const achievements: Achievement[] = [];
    
    // Check for conversation count achievements
    if (conversations.length >= 5) {
      achievements.push({
        id: 'conversation-starter',
        title: 'Conversation Starter',
        description: 'Completed 5 learning conversations',
        icon: '💬',
        unlockedAt: new Date()
      });
    }
    
    if (conversations.length >= 20) {
      achievements.push({
        id: 'dedicated-learner',
        title: 'Dedicated Learner',
        description: 'Completed 20 learning conversations',
        icon: '📚',
        unlockedAt: new Date()
      });
    }
    
    // Check for long conversations
    const longConversation = conversations.find(c => c.duration >= 600); // 10 minutes
    if (longConversation) {
      achievements.push({
        id: 'deep-diver',
        title: 'Deep Diver',
        description: 'Had a learning conversation lasting over 10 minutes',
        icon: '🏊',
        unlockedAt: new Date(longConversation.timestamp)
      });
    }
    
    // Check for subject diversity
    const subjects = new Set<string>();
    conversations.forEach(c => {
      const text = c.user_message.toLowerCase();
      if (text.includes('math')) subjects.add('Math');
      if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) subjects.add('Science');
      if (text.includes('english') || text.includes('literature')) subjects.add('English');
      if (text.includes('history')) subjects.add('History');
    });
    
    if (subjects.size >= 2) {
      achievements.push({
        id: 'subject-explorer',
        title: 'Subject Explorer',
        description: 'Studied multiple subjects',
        icon: '🔍',
        unlockedAt: new Date()
      });
    }
    
    // Add streak achievement if applicable
    if (socialStats.streak.current >= 3) {
      achievements.push({
        id: 'consistent-learner',
        title: 'Consistent Learner',
        description: `Maintained a ${socialStats.streak.current}-day learning streak`,
        icon: '🔥',
        unlockedAt: new Date()
      });
    }
    
    return achievements;
  };

  const generateChallenges = (subject: string): Challenge[] => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const challenges: Challenge[] = [];
    
    // Subject-specific challenges
    switch (subject) {
      case 'Math':
        challenges.push({
          id: 'math-mastery',
          title: 'Math Mastery',
          description: 'Complete 5 calculus problems',
          subject: 'Math',
          difficulty: 'High School',
          xpReward: 100,
          deadline: tomorrow,
          isCompleted: false
        });
        break;
      case 'Science':
        challenges.push({
          id: 'science-explorer',
          title: 'Science Explorer',
          description: 'Learn about 3 different scientific concepts',
          subject: 'Science',
          difficulty: 'High School',
          xpReward: 120,
          deadline: tomorrow,
          isCompleted: false
        });
        break;
      case 'English':
        challenges.push({
          id: 'grammar-guru',
          title: 'Grammar Guru',
          description: 'Master 5 grammar rules',
          subject: 'English',
          difficulty: 'High School',
          xpReward: 90,
          deadline: tomorrow,
          isCompleted: false
        });
        break;
      default:
        challenges.push({
          id: 'knowledge-seeker',
          title: 'Knowledge Seeker',
          description: `Study ${subject} for 30 minutes`,
          subject: subject,
          difficulty: 'High School',
          xpReward: 80,
          deadline: tomorrow,
          isCompleted: false
        });
    }
    
    // General challenges
    challenges.push({
      id: 'daily-dedication',
      title: 'Daily Dedication',
      description: 'Complete 3 learning sessions today',
      subject: 'All',
      difficulty: 'Elementary',
      xpReward: 50,
      deadline: tomorrow,
      isCompleted: false
    });
    
    return challenges;
  };

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
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          Complete learning activities to earn achievements!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {achievements.slice(0, 4).map((achievement) => (
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
      )}
    </div>
  );

  const renderActiveChallenges = () => (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Active Challenges</h3>
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          No active challenges at the moment.
        </p>
      ) : (
        <div className="space-y-2">
          {challenges.map((challenge) => (
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
      )}
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