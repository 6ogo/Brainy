import { supabase } from '../lib/supabase';
import { useStore } from '../store/store';
import { SessionStats } from '../types';

export interface StudySessionData {
  user_id: string;
  subject: string;
  duration: number;
  messages_count: number;
  topics_discussed: string[];
  xp_earned: number;
  avatar_used: string;
  learning_mode: string;
}

/**
 * Save a study session to Supabase
 */
export const saveStudySession = async (userId: string, sessionData: SessionStats, subject: string, avatar: string, learningMode: string) => {
  try {
    const studySessionData: StudySessionData = {
      user_id: userId,
      subject: subject,
      duration: sessionData.duration,
      messages_count: sessionData.messagesCount,
      topics_discussed: sessionData.topicsDiscussed,
      xp_earned: sessionData.xpEarned,
      avatar_used: avatar,
      learning_mode: learningMode
    };

    const { data, error } = await supabase
      .from('public_bolt.study_sessions')
      .insert(studySessionData);

    if (error) {
      console.error('Error saving study session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save study session:', error);
    throw error;
  }
};

/**
 * Get all study sessions for a user
 */
export const getStudySessions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('public_bolt.study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching study sessions:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch study sessions:', error);
    throw error;
  }
};

/**
 * Get summary statistics for a user
 */
export const getUserStats = async (userId: string) => {
  try {
    const { data: sessions, error } = await supabase
      .from('public_bolt.study_sessions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }

    // Calculate total study time in seconds
    const totalStudyTime = sessions?.reduce((total, session) => 
      total + (session.duration || 0), 0) || 0;

    // Calculate total XP earned
    const totalXP = sessions?.reduce((total, session) => 
      total + (session.xp_earned || 0), 0) || 0;

    // Count unique subjects studied
    const subjects = new Set(sessions?.map(session => session.subject));

    return {
      totalSessions: sessions?.length || 0,
      totalStudyTime,
      totalXP,
      uniqueSubjects: Array.from(subjects),
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    throw error;
  }
};

/**
 * End the current study session and save it to Supabase
 */
export const endStudySession = async (userId: string) => {
  const store = useStore.getState();
  const { sessionStats, currentSubject, currentAvatar, learningMode } = store;
  
  // Update session duration
  const endTime = new Date();
  const startTime = sessionStats.startTime;
  const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  
  const updatedStats = {
    ...sessionStats,
    duration: durationInSeconds
  };
  
  // Save to Supabase
  try {
    await saveStudySession(userId, updatedStats, currentSubject, currentAvatar, learningMode);
    
    // Update streak
    store.updateStreak();
    
    // Reset session stats for next time
    store.updateSessionStats({
      startTime: new Date(),
      duration: 0,
      messagesCount: 0,
      topicsDiscussed: [],
      xpEarned: 0,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to end and save study session:', error);
    return false;
  }
};