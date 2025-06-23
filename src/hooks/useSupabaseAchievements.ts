import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Achievement } from '../types';

interface AchievementWithProgress extends Achievement {
  current_value: number;
  requirement_value: number;
  completed: boolean;
}

export function useSupabaseAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch all achievements
      const { data: allAchievements, error: achErr } = await supabase
        .from('achievements')
        .select('*');
      if (achErr) throw achErr;
      // Fetch progress for user
      const { data: progress, error: progErr } = await supabase
        .from('achievement_progress')
        .select('*')
        .eq('user_id', user.id);
      if (progErr) throw progErr;
      // Merge progress into achievements
      const merged: AchievementWithProgress[] = (allAchievements || []).map((ach: any) => {
        const prog = (progress || []).find((p: any) => p.achievement_id === ach.id);
        const current_value = prog?.current_value || 0;
        const completed = current_value >= (ach.requirement_value || 1);
        return {
          ...ach,
          current_value,
          requirement_value: ach.requirement_value || 1,
          completed,
        };
      });
      setAchievements(merged);
    } catch (err: any) {
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return { achievements, loading, error, refetch: fetchAchievements };
}
