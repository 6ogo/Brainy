import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Challenge } from '../types';

interface ChallengeWithStatus extends Challenge {
  timeLeft: number; // seconds
  status: 'active' | 'success' | 'failed';
}

function getStatus(ch: any) {
  if (ch.isCompleted) return 'success';
  if (new Date(ch.deadline) < new Date()) return 'failed';
  return 'active';
}

export function useSupabaseChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setChallenges([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: chErr } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id);
      if (chErr) throw chErr;
      const now = Date.now();
      const mapped = (data || []).map((ch: any) => {
        const deadline = new Date(ch.deadline);
        const timeLeft = Math.max(0, Math.floor((deadline.getTime() - now) / 1000));
        return {
          ...ch,
          timeLeft,
          status: getStatus(ch),
        };
      });
      setChallenges(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return { challenges, loading, error, refetch: fetchChallenges };
}
