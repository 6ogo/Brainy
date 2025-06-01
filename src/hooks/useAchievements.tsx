import { useCallback } from 'react';
import { useStore } from '../store/store';
import toast from 'react-hot-toast';
import { AchievementToast } from '../components/AchievementToast';

export const useAchievements = () => {
  const { socialStats, unlockAchievement, updateSocialStats } = useStore();

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

  return { checkAndAwardAchievements };
};