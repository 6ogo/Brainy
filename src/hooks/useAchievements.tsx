import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  achievement: Achievement;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all achievements
  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
    }
  };

  // Fetch user's unlocked achievements
  const fetchUserAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (err) {
      console.error('Error fetching user achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user achievements');
    }
  };

  // Check and unlock achievements based on user stats
  const checkAchievements = async (stats: {
    totalConversations: number;
    totalStudyMinutes: number;
    currentStreak: number;
    totalXP: number;
    subjectCounts?: Record<string, number>;
  }) => {
    if (!user) return;

    try {
      // Get all achievements that user hasn't unlocked yet
      const unlockedIds = userAchievements.map(ua => ua.achievement_id);
      const availableAchievements = achievements.filter(a => !unlockedIds.includes(a.id));

      const newlyUnlocked: string[] = [];

      for (const achievement of availableAchievements) {
        let shouldUnlock = false;

        switch (achievement.requirement_type) {
          case 'conversations':
            shouldUnlock = stats.totalConversations >= achievement.requirement_value;
            break;
          case 'study_minutes':
            shouldUnlock = stats.totalStudyMinutes >= achievement.requirement_value;
            break;
          case 'streak_days':
            shouldUnlock = stats.currentStreak >= achievement.requirement_value;
            break;
          case 'total_xp':
            shouldUnlock = stats.totalXP >= achievement.requirement_value;
            break;
          case 'subject_conversations_math':
            shouldUnlock = (stats.subjectCounts?.['Math'] || 0) >= achievement.requirement_value;
            break;
          case 'subject_conversations_science':
            shouldUnlock = (stats.subjectCounts?.['Science'] || 0) >= achievement.requirement_value;
            break;
          case 'subject_conversations_language':
            shouldUnlock = (stats.subjectCounts?.['Languages'] || 0) >= achievement.requirement_value;
            break;
          case 'subject_conversations_history':
            shouldUnlock = (stats.subjectCounts?.['History'] || 0) >= achievement.requirement_value;
            break;
          case 'long_session':
            // This would need to be checked when a session ends
            break;
          case 'late_night_study':
          case 'early_morning_study':
          case 'weekend_study':
            // These would need to be checked based on session timing
            break;
        }

        if (shouldUnlock) {
          // Unlock the achievement
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
              progress: achievement.requirement_value
            });

          if (!error) {
            newlyUnlocked.push(achievement.id);
          }
        }
      }

      if (newlyUnlocked.length > 0) {
        // Refresh user achievements
        await fetchUserAchievements();
        return newlyUnlocked;
      }
    } catch (err) {
      console.error('Error checking achievements:', err);
    }

    return [];
  };

  // Get achievement progress for display
  const getAchievementProgress = (achievement: Achievement, stats: any) => {
    switch (achievement.requirement_type) {
      case 'conversations':
        return Math.min(stats.totalConversations, achievement.requirement_value);
      case 'study_minutes':
        return Math.min(stats.totalStudyMinutes, achievement.requirement_value);
      case 'streak_days':
        return Math.min(stats.currentStreak, achievement.requirement_value);
      case 'total_xp':
        return Math.min(stats.totalXP, achievement.requirement_value);
      default:
        return 0;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAchievements(), fetchUserAchievements()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    achievements,
    userAchievements,
    loading,
    error,
    checkAchievements,
    getAchievementProgress,
    refetch: () => Promise.all([fetchAchievements(), fetchUserAchievements()])
  };
};