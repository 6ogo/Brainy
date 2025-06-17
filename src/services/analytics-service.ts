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

export interface AnalyticsData {
  conversations: any[];
  usage: any[];
  totalStudyTime: number;
  totalConversations: number;
  averageSessionLength: number;
  weeklyProgress: number[];
  subjectDistribution: Record<string, number>;
}

/**
 * Get comprehensive analytics data for a user with caching
 */
export const getAnalyticsData = async (userId: string): Promise<AnalyticsData> => {
  try {
    // Fetch conversations
    const { data: conversations, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (conversationError) {
      throw new Error(`Failed to fetch conversations: ${conversationError.message}`);
    }

    // Fetch usage data
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (usageError) {
      throw new Error(`Failed to fetch usage data: ${usageError.message}`);
    }

    // Calculate metrics
    const totalConversations = conversations?.length || 0;
    const totalStudyTime = usage?.reduce((sum, day) => 
      sum + (day.conversation_minutes || 0) + (day.video_call_minutes || 0), 0) || 0;
    
    const averageSessionLength = totalConversations > 0 
      ? Math.round(conversations.reduce((sum, conv) => sum + (conv.duration || 0), 0) / totalConversations / 60)
      : 0;

    // Calculate weekly progress (last 4 weeks)
    const weeklyProgress = Array.from({ length: 4 }, (_, weekIndex) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekIndex + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return usage?.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= weekStart && dayDate < weekEnd;
      }).reduce((sum, day) => sum + (day.conversation_minutes || 0) + (day.video_call_minutes || 0), 0) || 0;
    }).reverse();

    // Calculate subject distribution (mock data for now)
    const subjectDistribution = {
      'Math': Math.floor(totalConversations * 0.4),
      'Science': Math.floor(totalConversations * 0.3),
      'English': Math.floor(totalConversations * 0.2),
      'History': Math.floor(totalConversations * 0.1),
    };

    return {
      conversations: conversations || [],
      usage: usage || [],
      totalStudyTime,
      totalConversations,
      averageSessionLength,
      weeklyProgress,
      subjectDistribution,
    };
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    throw error;
  }
};

/**
 * Save a study session to the database
 */
export const saveStudySession = async (userId: string, sessionData: SessionStats, subject: string, avatar: string, learningMode: string) => {
  try {
    // For now, we'll save this as a conversation record since we don't have a study_sessions table
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        user_message: `Study session: ${subject}`,
        ai_response: `Completed ${sessionData.messagesCount} interactions`,
        duration: sessionData.duration,
        summary: `${sessionData.xpEarned} XP earned in ${subject} session`
      });

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
 * Get user statistics summary
 */
export const getUserStats = async (userId: string) => {
  try {
    const analyticsData = await getAnalyticsData(userId);
    
    return {
      totalSessions: analyticsData.totalConversations,
      totalStudyTime: analyticsData.totalStudyTime,
      totalXP: analyticsData.conversations.reduce((sum) => sum + 10, 0), // 10 XP per conversation
      uniqueSubjects: Object.keys(analyticsData.subjectDistribution),
      averageSessionLength: analyticsData.averageSessionLength,
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    throw error;
  }
};

/**
 * End the current study session and save it
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
  
  // Save to database
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

/**
 * Clear analytics cache
 */
export const clearAnalyticsCache = () => {
  try {
    localStorage.removeItem('learning_analytics_cache');
  } catch (error) {
    console.error('Failed to clear analytics cache:', error);
  }
};

/**
 * Export analytics data to JSON
 */
export const exportAnalyticsData = async (userId: string) => {
  try {
    const data = await getAnalyticsData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export analytics data:', error);
    throw error;
  }
};