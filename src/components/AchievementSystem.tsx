import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Award, 
  Trophy, 
  Star, 
  Target, 
  Clock, 
  Zap,
  BookOpen,
  Brain,
  Flame,
  Filter
} from 'lucide-react';
import Confetti from 'react-confetti';
import { AchievementToast } from './AchievementToast';
import toast from 'react-hot-toast';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  xp_reward: number;
  unlocked_at?: string;
  progress?: number;
  requirement_value: number;
}

export const AchievementSystem: React.FC = () => {
  const { socialStats, unlockAchievement, updateSocialStats } = useStore();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<string | null>(null);

  // Level-based milestone achievements
  const milestoneAchievements = [
    { level: 5, title: "Knowledge Seeker", description: "Reached Level 5" },
    { level: 10, title: "Dedicated Scholar", description: "Reached Level 10" },
    { level: 15, title: "Learning Expert", description: "Reached Level 15" },
    { level: 20, title: "Wisdom Master", description: "Reached Level 20" },
    { level: 30, title: "Knowledge Sage", description: "Reached Level 30" },
    { level: 40, title: "Learning Legend", description: "Reached Level 40" },
    { level: 50, title: "Grand Scholar", description: "Reached Level 50" },
    { level: 60, title: "Enlightened Mind", description: "Reached Level 60" },
    { level: 70, title: "Knowledge Architect", description: "Reached Level 70" },
    { level: 80, title: "Learning Sovereign", description: "Reached Level 80" },
    { level: 90, title: "Wisdom Keeper", description: "Reached Level 90" },
    { level: 100, title: "Ultimate Scholar", description: "Reached Level 100" }
  ];

  // Fetch achievements and check for new ones
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch all available achievements
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*');

        if (achievementsError) throw achievementsError;

        // Fetch user's unlocked achievements
        const { data: userAchievements, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at, progress')
          .eq('user_id', user.id);

        if (userAchievementsError) throw userAchievementsError;

        // Combine data
        const achievementsWithStatus = allAchievements.map((achievement: Achievement) => {
          const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
          return {
            ...achievement,
            unlocked: !!userAchievement,
            unlocked_at: userAchievement?.unlocked_at,
            progress: userAchievement?.progress || 0
          };
        });

        setAchievements(achievementsWithStatus);
        setUnlockedAchievements(achievementsWithStatus.filter((a: any) => a.unlocked));

        // Check for level-based achievements
        checkLevelAchievements();

        setLoading(false);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user, socialStats.level]);

  // Check for level-based achievements
  const checkLevelAchievements = () => {
    const currentLevel = socialStats.level;
    
    milestoneAchievements.forEach(milestone => {
      if (currentLevel >= milestone.level) {
        const achievementId = `level-${milestone.level}`;
        
        // Check if this achievement is already in the user's achievements
        const alreadyUnlocked = socialStats.achievements.some(a => a.id === achievementId);
        
        if (!alreadyUnlocked) {
          // Unlock the achievement
          unlockAchievement(achievementId);
          
          // Update XP (100 XP per level milestone)
          updateSocialStats({
            totalXP: socialStats.totalXP + 100
          });
          
          // Show toast notification
          toast.custom(() => (
            <AchievementToast
              title={milestone.title}
              description={milestone.description}
              xp={100}
            />
          ), { duration: 5000 });
          
          // Show confetti
          setShowConfetti(true);
          setRecentlyUnlocked(achievementId);
          
          // Hide confetti after 5 seconds
          setTimeout(() => {
            setShowConfetti(false);
            setRecentlyUnlocked(null);
          }, 5000);
        }
      }
    });
  };

  // Filter achievements by category
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  // Get icon component based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return <BookOpen className="h-5 w-5" />;
      case 'time': return <Clock className="h-5 w-5" />;
      case 'streak': return <Flame className="h-5 w-5" />;
      case 'subject': return <Brain className="h-5 w-5" />;
      case 'xp': return <Zap className="h-5 w-5" />;
      case 'fun': return <Star className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Achievements', icon: <Trophy className="h-5 w-5" /> },
    { id: 'study', name: 'Study', icon: <BookOpen className="h-5 w-5" /> },
    { id: 'time', name: 'Time', icon: <Clock className="h-5 w-5" /> },
    { id: 'streak', name: 'Streak', icon: <Flame className="h-5 w-5" /> },
    { id: 'subject', name: 'Subject', icon: <Brain className="h-5 w-5" /> },
    { id: 'xp', name: 'XP', icon: <Zap className="h-5 w-5" /> },
    { id: 'fun', name: 'Fun', icon: <Star className="h-5 w-5" /> }
  ];

  return (
    <div id="achievements-section" className="space-y-6">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
      <div className="flex items-center justify-between">
        <h2 className={cn(commonStyles.heading.h2)}>
          Achievements
        </h2>
        
        <div className="relative">
          <button
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            onClick={() => {}}
          >
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter</span>
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 hidden">
            {categories.map(category => (
              <button
                key={category.id}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm flex items-center space-x-2",
                  selectedCategory === category.id
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Level Milestone Achievements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Level Milestones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestoneAchievements.slice(0, 4).map((milestone) => {
            const isUnlocked = socialStats.level >= milestone.level;
            const isRecent = recentlyUnlocked === `level-${milestone.level}`;
            
            return (
              <Card 
                key={`level-${milestone.level}`}
                className={cn(
                  "p-4 border transition-all",
                  isUnlocked 
                    ? isRecent 
                      ? "border-yellow-300 bg-yellow-50 shadow-md" 
                      : "border-green-200 bg-green-50" 
                    : "border-gray-200 bg-gray-50 opacity-60"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    isUnlocked 
                      ? "bg-primary-100 text-primary-600" 
                      : "bg-gray-100 text-gray-400"
                  )}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                    <p className="text-xs text-gray-500">Level {milestone.level}</p>
                    {isUnlocked && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                        <Trophy className="h-3 w-3 mr-1" />
                        Unlocked
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* All Achievements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">All Achievements</h3>
          
          <div className="flex overflow-x-auto space-x-2 py-1">
            {categories.map(category => (
              <button
                key={category.id}
                className={cn(
                  "flex items-center space-x-1 px-3 py-1 rounded-full text-xs whitespace-nowrap",
                  selectedCategory === category.id
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="flex-shrink-0">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-1">No Achievements Found</h4>
            <p className="text-sm text-gray-400">
              {selectedCategory === 'all' 
                ? 'Start learning to earn achievements!' 
                : 'Try selecting a different category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement: any) => {
              const isUnlocked = achievement.unlocked;
              const progress = achievement.progress || 0;
              const progressPercent = Math.min(100, Math.round((progress / achievement.requirement_value) * 100));
              
              return (
                <Card 
                  key={achievement.id}
                  className={cn(
                    "p-4 border",
                    isUnlocked 
                      ? "border-green-200 bg-green-50" 
                      : "border-gray-200"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-full flex-shrink-0",
                      isUnlocked 
                        ? "bg-green-100 text-green-600" 
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {getCategoryIcon(achievement.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                          {achievement.xp_reward} XP
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                      
                      {!isUnlocked && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {isUnlocked && achievement.unlocked_at && (
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          <span>Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Achievement Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {unlockedAchievements.length}
            </div>
            <p className="text-sm text-gray-500">Achievements Unlocked</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {achievements.length > 0 
                ? Math.round((unlockedAchievements.length / achievements.length) * 100) 
                : 0}%
            </div>
            <p className="text-sm text-gray-500">Completion Rate</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {unlockedAchievements.reduce((sum, a: any) => sum + a.xp_reward, 0)}
            </div>
            <p className="text-sm text-gray-500">XP from Achievements</p>
          </div>
        </div>
      </Card>
    </div>
  );
};