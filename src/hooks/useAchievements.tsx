import { useCallback, useEffect } from 'react';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { AchievementToast } from '../components/AchievementToast';

export const useAchievements = () => {
  const { socialStats, unlockAchievement, updateSocialStats } = useStore();
  const { user } = useAuth();

  // Check for achievements on component mount
  useEffect(() => {
    if (user) {
      checkForNewAchievements();
    }
  }, [user]);

  // Check for new achievements based on user stats
  const checkForNewAchievements = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all available achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');

      if (achievementsError) throw achievementsError;

      // Fetch user's already unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      // Get IDs of already unlocked achievements
      const unlockedIds = userAchievements?.map(ua => ua.achievement_id) || [];

      // Get user stats for achievement checks
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('count')
        .eq('user_id', user.id)
        .single();

      if (conversationsError && conversationsError.code !== 'PGRST116') throw conversationsError;

      const conversationCount = conversations?.count || 0;

      // Get user usage data
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('conversation_minutes, video_call_minutes')
        .eq('user_id', user.id);

      if (usageError) throw usageError;

      const totalStudyMinutes = usageData?.reduce((sum, day) => 
        sum + (day.conversation_minutes || 0) + (day.video_call_minutes || 0), 0) || 0;

      // Check each achievement to see if it should be unlocked
      for (const achievement of allAchievements || []) {
        // Skip if already unlocked
        if (unlockedIds.includes(achievement.id)) continue;

        let shouldUnlock = false;

        // Check achievement requirements
        switch (achievement.requirement_type) {
          case 'conversations':
            shouldUnlock = conversationCount >= achievement.requirement_value;
            break;
          case 'study_minutes':
            shouldUnlock = totalStudyMinutes >= achievement.requirement_value;
            break;
          case 'streak_days':
            shouldUnlock = socialStats.streak.current >= achievement.requirement_value;
            break;
          case 'total_xp':
            shouldUnlock = socialStats.totalXP >= achievement.requirement_value;
            break;
          // Add more cases for other achievement types
        }

        if (shouldUnlock) {
          // Insert into user_achievements
          const { error: insertError } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id
            });

          if (insertError) {
            // Handle duplicate key constraint violation gracefully
            if (insertError.code === '23505') {
              console.warn(`Achievement ${achievement.id} already exists for user ${user.id}`);
              continue;
            }
            console.error('Error unlocking achievement:', insertError);
            continue;
          }

          // Update local state
          unlockAchievement(achievement.id);
          
          // Update XP
          updateSocialStats({
            totalXP: socialStats.totalXP + achievement.xp_reward
          });

          // Show toast notification
          toast.custom((t) => (
            <AchievementToast
              title={achievement.title}
              description={achievement.description}
              xp={achievement.xp_reward}
            />
          ), { duration: 5000 });
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [user, socialStats, unlockAchievement, updateSocialStats]);

  const checkAndAwardAchievements = useCallback((stats: typeof socialStats) => {
    // Check streak achievements
    if (stats.streak.current >= 7 && !stats.achievements.some(a => a.id === 'week-streak')) {
      unlockAchievement('week-streak');
      toast.custom((t) => (
        <AchievementToast
          title="Week Warrior!"
          description="Maintained a 7-day study streak"
          xp={100}
        />
      ));
    }

    // Check XP milestones
    const xpMilestones = [
      { id: 'xp-1000', xp: 1000, title: 'Knowledge Seeker', description: 'Earned 1,000 XP' },
      { id: 'xp-5000', xp: 5000, title: 'Scholar', description: 'Earned 5,000 XP' },
      { id: 'xp-10000', xp: 10000, title: 'Master Student', description: 'Earned 10,000 XP' }
    ];

    xpMilestones.forEach(milestone => {
      if (stats.totalXP >= milestone.xp && !stats.achievements.some(a => a.id === milestone.id)) {
        unlockAchievement(milestone.id);
        toast.custom((t) => (
          <AchievementToast
            title={milestone.title}
            description={milestone.description}
            xp={milestone.xp / 10}
          />
        ));
      }
    });

    // Check level ups
    const newLevel = Math.floor(stats.totalXP / 1000) + 1;
    if (newLevel > stats.level) {
      updateSocialStats({ level: newLevel });
      toast.custom((t) => (
        <AchievementToast
          title="Level Up!"
          description={`You've reached level ${newLevel}`}
          xp={100}
        />
      ));
    }
  }, [unlockAchievement, updateSocialStats]);

  return { 
    checkAndAwardAchievements,
    checkForNewAchievements
  };
};