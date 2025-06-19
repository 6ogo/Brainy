import React, { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { Share2, Award, Star } from 'lucide-react';
import { TwitterShareButton, LinkedinShareButton } from 'react-share';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Achievement, Challenge, Subject } from '../types';

const SocialFeatures: React.FC = () => {
  const { socialStats, currentSubject, updateSocialStats } = useStore();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocialData = async () => {
      if (!user) {
        setAchievements([]);
        setChallenges([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      let fetchError = null;
      try {
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
      } catch (err: any) {
        fetchError = err;
        setError('Unable to load data from the server. You may be offline or experiencing connectivity issues.');
        console.error('Error fetching social data:', err);
        // Use fallback data if fetch fails
        setAchievements(socialStats.achievements || []);
        setChallenges(socialStats.activeChallenges || []);
      } finally {
        setLoading(false);
        if (fetchError) {
          toast.error('Could not fetch achievements or challenges. Showing offline data.');
        }
      }
    };
    fetchSocialData();
  }, [user, currentSubject, updateSocialStats, socialStats]);

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
    
    // Add level-based achievements
    if (socialStats.level >= 5) {
      achievements.push({
        id: 'knowledge-seeker',
        title: 'Knowledge Seeker',
        description: 'Reached Level 5',
        icon: '🏆',
        unlockedAt: new Date()
      });
    }
    
    if (socialStats.level >= 10) {
      achievements.push({
        id: 'dedicated-scholar',
        title: 'Dedicated Scholar',
        description: 'Reached Level 10',
        icon: '🎓',
        unlockedAt: new Date()
      });
    }
    
    return achievements;
  };

  const generateChallenges = (subject: Subject): Challenge[] => {
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
      subject: 'All' as Subject,
      difficulty: 'Elementary',
      xpReward: 50,
      deadline: tomorrow,
      isCompleted: false
    });
    
    return challenges;
  };

  const shareProgress = () => {
    const shareUrl = window.location.href;
    const shareTitle = `I'm mastering ${currentSubject} with Brainbud! 🚀 I'm currently Level ${socialStats.level} with ${socialStats.totalXP} XP. Join me and revolutionize your learning journey.`;
    
    navigator.clipboard.writeText(shareTitle + '\n' + shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Award className="h-5 w-5 mr-2 text-yellow-500" /> Achievements
      </h2>
      <div className="mb-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-gray-500 italic">No achievements yet. Start learning to unlock your first badge!</div>
        ) : (
          <ul className="space-y-3">
            {achievements.map(ach => (
              <li key={ach.id} className="flex items-center space-x-3 bg-yellow-50 rounded p-2 border border-yellow-100">
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <div className="font-semibold text-yellow-900">{ach.title}</div>
                  <div className="text-xs text-gray-600">{ach.description}</div>
                  <div className="text-xs text-gray-400">Unlocked: {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : '—'}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* Error fallback UI if offline or fetch failed */}
        {!loading && error && (
          <div className="text-xs text-red-400 mt-2">{error}</div>
        )}
      </div>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Star className="h-5 w-5 mr-2 text-blue-500" /> Active Challenges
      </h2>
      <div className="mb-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-gray-500 italic">No active challenges. Check back soon for new ways to earn XP!</div>
        ) : (
          <ul className="space-y-3">
            {challenges.map(challenge => (
              <li key={challenge.id} className="flex items-center space-x-3 bg-blue-50 rounded p-2 border border-blue-100">
                <span className="text-lg">🏅</span>
                <div>
                  <div className="font-semibold text-blue-900">{challenge.title}</div>
                  <div className="text-xs text-gray-600">{challenge.description}</div>
                  <div className="text-xs text-gray-400">Reward: {challenge.xpReward} XP · Due: {challenge.deadline ? new Date(challenge.deadline).toLocaleDateString() : '—'}</div>
                  {challenge.isCompleted && (
                    <span className="text-green-600 text-xs font-semibold ml-2">Completed!</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* Error fallback UI if offline or fetch failed */}
        {!loading && error && (
          <div className="text-xs text-red-400 mt-2">{error}</div>
        )}
      </div>
      <div className="flex space-x-2 mt-4">
        <button
          onClick={shareProgress}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition flex items-center"
        >
          <Share2 className="h-4 w-4 mr-2" /> Share Progress
        </button>
        <TwitterShareButton url={window.location.href} title="Check out my learning progress on Brainbud! 🚀">
          <button className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition flex items-center">
            <span className="mr-2">🐦</span> Tweet
          </button>
        </TwitterShareButton>

        <LinkedinShareButton
          url={window.location.href}
          title={`Learning ${currentSubject} with Brainbud`}
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

export default SocialFeatures;