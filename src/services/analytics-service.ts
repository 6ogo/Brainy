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
  learningStyle: string;
  peakStudyTime: string;
  consistencyRating: string;
  retentionRate: number;
  topicsAnalysis: {
    mastered: string[];
    inProgress: string[];
    struggling: string[];
    recommended: string[];
  };
}

// Cache for analytics data
let analyticsCache: Record<string, { data: AnalyticsData; timestamp: number }> = {};

/**
 * Get comprehensive analytics data for a user with caching
 */
export const getAnalyticsData = async (userId: string): Promise<AnalyticsData> => {
  // Check cache first (valid for 5 minutes)
  const now = Date.now();
  const cacheKey = `analytics_${userId}`;
  const cachedData = analyticsCache[cacheKey];
  
  if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
    return cachedData.data;
  }

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

    // Determine learning style based on conversation patterns
    const learningStyle = determineLearningStyle(conversations || []);
    
    // Determine peak study time
    const peakStudyTime = determinePeakStudyTime(conversations || []);
    
    // Calculate consistency rating
    const consistencyRating = calculateConsistencyRating(usage || []);
    
    // Calculate retention rate (mock data for now)
    const retentionRate = calculateRetentionRate(conversations || []);
    
    // Analyze topics
    const topicsAnalysis = analyzeTopics(conversations || [], userId);

    // Calculate subject distribution
    const subjectDistribution = calculateSubjectDistribution(conversations || []);

    const analyticsData: AnalyticsData = {
      conversations: conversations || [],
      usage: usage || [],
      totalStudyTime,
      totalConversations,
      averageSessionLength,
      weeklyProgress,
      subjectDistribution,
      learningStyle,
      peakStudyTime,
      consistencyRating,
      retentionRate,
      topicsAnalysis
    };

    // Cache the results
    analyticsCache[cacheKey] = {
      data: analyticsData,
      timestamp: now
    };

    return analyticsData;
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

    // Update user analytics
    await updateUserAnalytics(userId, {
      subject,
      sessionDuration: sessionData.duration,
      messagesCount: sessionData.messagesCount,
      xpEarned: sessionData.xpEarned
    });

    return data;
  } catch (error) {
    console.error('Failed to save study session:', error);
    throw error;
  }
};

/**
 * Update user analytics data
 */
const updateUserAnalytics = async (userId: string, sessionData: {
  subject: string;
  sessionDuration: number;
  messagesCount: number;
  xpEarned: number;
}) => {
  try {
    // Get existing analytics
    const { data: existingAnalytics, error: getError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (getError && getError.code !== 'PGRST116') {
      throw getError;
    }
    
    // Calculate learning velocity (XP per hour)
    const sessionHours = sessionData.sessionDuration / 3600;
    const velocity = sessionHours > 0 ? Math.round(sessionData.xpEarned / sessionHours) : 0;
    
    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round((sessionData.messagesCount / Math.max(1, sessionHours * 10)) * 100));
    
    // Determine peak study time
    const now = new Date();
    const hour = now.getHours();
    let peakTime = existingAnalytics?.peak_study_time || '';
    
    if (hour >= 5 && hour < 12) {
      peakTime = 'Morning';
    } else if (hour >= 12 && hour < 17) {
      peakTime = 'Afternoon';
    } else if (hour >= 17 && hour < 22) {
      peakTime = 'Evening';
    } else {
      peakTime = 'Night';
    }
    
    // Update or insert analytics
    const { error: upsertError } = await supabase
      .from('user_analytics')
      .upsert({
        user_id: userId,
        learning_velocity: velocity,
        engagement_score: engagementScore,
        peak_study_time: peakTime,
        updated_at: new Date().toISOString()
      });
    
    if (upsertError) {
      throw upsertError;
    }
    
    // Clear cache for this user
    clearAnalyticsCacheForUser(userId);
    
  } catch (error) {
    console.error('Failed to update user analytics:', error);
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
      learningStyle: analyticsData.learningStyle,
      peakStudyTime: analyticsData.peakStudyTime,
      consistencyRating: analyticsData.consistencyRating,
      retentionRate: analyticsData.retentionRate,
      topicsAnalysis: analyticsData.topicsAnalysis
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
  analyticsCache = {};
};

/**
 * Clear analytics cache for a specific user
 */
const clearAnalyticsCacheForUser = (userId: string) => {
  const cacheKey = `analytics_${userId}`;
  delete analyticsCache[cacheKey];
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

/**
 * Determine learning style based on conversation patterns
 */
const determineLearningStyle = (conversations: any[]): string => {
  // Count keywords associated with different learning styles
  let visual = 0, auditory = 0, kinesthetic = 0, reading = 0;
  
  conversations.forEach(conv => {
    const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
    
    // Visual keywords
    if (text.includes('see') || text.includes('look') || text.includes('show') || 
        text.includes('picture') || text.includes('image') || text.includes('diagram')) {
      visual++;
    }
    
    // Auditory keywords
    if (text.includes('hear') || text.includes('listen') || text.includes('sound') || 
        text.includes('tell') || text.includes('explain') || text.includes('discuss')) {
      auditory++;
    }
    
    // Kinesthetic keywords
    if (text.includes('feel') || text.includes('touch') || text.includes('do') || 
        text.includes('practice') || text.includes('try') || text.includes('experience')) {
      kinesthetic++;
    }
    
    // Reading/writing keywords
    if (text.includes('read') || text.includes('write') || text.includes('note') || 
        text.includes('text') || text.includes('list') || text.includes('word')) {
      reading++;
    }
  });
  
  // Determine dominant style
  const styles = [
    { name: 'visual', count: visual },
    { name: 'auditory', count: auditory },
    { name: 'kinesthetic', count: kinesthetic },
    { name: 'reading/writing', count: reading }
  ];
  
  const dominantStyle = styles.sort((a, b) => b.count - a.count)[0];
  return dominantStyle.name;
};

/**
 * Determine peak study time based on conversation timestamps
 */
const determinePeakStudyTime = (conversations: any[]): string => {
  const hourCounts: Record<string, number> = {
    'Morning': 0,
    'Afternoon': 0,
    'Evening': 0,
    'Night': 0
  };
  
  conversations.forEach(conv => {
    const date = new Date(conv.timestamp);
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) {
      hourCounts['Morning']++;
    } else if (hour >= 12 && hour < 17) {
      hourCounts['Afternoon']++;
    } else if (hour >= 17 && hour < 22) {
      hourCounts['Evening']++;
    } else {
      hourCounts['Night']++;
    }
  });
  
  // Find the time with the most conversations
  let peakTime = 'Afternoon'; // Default
  let maxCount = 0;
  
  Object.entries(hourCounts).forEach(([time, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakTime = time;
    }
  });
  
  return peakTime;
};

/**
 * Calculate consistency rating based on usage patterns
 */
const calculateConsistencyRating = (usage: any[]): string => {
  if (usage.length === 0) return 'Building';
  
  // Sort by date
  const sortedUsage = [...usage].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Count consecutive days
  let maxStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedUsage.length; i++) {
    const prevDate = new Date(sortedUsage[i-1].date);
    const currDate = new Date(sortedUsage[i].date);
    
    // Check if dates are consecutive
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  maxStreak = Math.max(maxStreak, currentStreak);
  
  // Determine rating
  if (maxStreak >= 7) return 'Excellent';
  if (maxStreak >= 3) return 'Good';
  return 'Building';
};

/**
 * Calculate retention rate based on conversation patterns
 */
const calculateRetentionRate = (conversations: any[]): number => {
  if (conversations.length < 5) return 0;
  
  // This is a simplified model - in a real app, you'd use more sophisticated methods
  // like testing for repeated concepts, tracking quiz performance, etc.
  
  // For now, we'll use a heuristic based on:
  // 1. Conversation frequency
  // 2. Message complexity
  // 3. Topic repetition
  
  // Group by day
  const conversationsByDay: Record<string, any[]> = {};
  
  conversations.forEach(conv => {
    const date = new Date(conv.timestamp).toISOString().split('T')[0];
    if (!conversationsByDay[date]) {
      conversationsByDay[date] = [];
    }
    conversationsByDay[date].push(conv);
  });
  
  // Calculate average messages per day (engagement)
  const daysCount = Object.keys(conversationsByDay).length;
  const avgMessagesPerDay = conversations.length / Math.max(1, daysCount);
  
  // Calculate message complexity (proxy for depth of learning)
  const avgMessageLength = conversations.reduce((sum, conv) => 
    sum + (conv.user_message?.length || 0) + (conv.ai_response?.length || 0), 0
  ) / (conversations.length * 2);
  
  // Normalize factors to 0-100 scale
  const frequencyFactor = Math.min(100, avgMessagesPerDay * 20);
  const complexityFactor = Math.min(100, avgMessageLength / 20);
  
  // Combine factors (weighted average)
  const retentionRate = Math.round(
    (frequencyFactor * 0.4) + 
    (complexityFactor * 0.6)
  );
  
  return Math.min(100, retentionRate);
};

/**
 * Analyze topics from conversations
 */
const analyzeTopics = (conversations: any[], userId: string) => {
  // Extract topics from conversations
  const topicMentions: Record<string, number> = {};
  const topicSuccesses: Record<string, number> = {};
  const topicStruggles: Record<string, number> = {};
  
  conversations.forEach(conv => {
    const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
    
    // Extract potential topics (this is a simplified approach)
    const potentialTopics = extractTopicsFromText(text);
    
    potentialTopics.forEach(topic => {
      // Count mentions
      topicMentions[topic] = (topicMentions[topic] || 0) + 1;
      
      // Analyze for success/struggle indicators
      if (text.includes('understand') || text.includes('got it') || 
          text.includes('makes sense') || text.includes('clear now')) {
        topicSuccesses[topic] = (topicSuccesses[topic] || 0) + 1;
      }
      
      if (text.includes('confused') || text.includes('don\'t understand') || 
          text.includes('difficult') || text.includes('struggling') ||
          text.includes('help me with')) {
        topicStruggles[topic] = (topicStruggles[topic] || 0) + 1;
      }
    });
  });
  
  // Determine mastered topics (mentioned multiple times with success indicators)
  const mastered = Object.entries(topicMentions)
    .filter(([topic, mentions]) => 
      mentions >= 3 && (topicSuccesses[topic] || 0) > (topicStruggles[topic] || 0)
    )
    .map(([topic]) => topic)
    .slice(0, 5);
  
  // Determine in-progress topics (mentioned but not clearly mastered)
  const inProgress = Object.entries(topicMentions)
    .filter(([topic, mentions]) => 
      mentions >= 2 && !mastered.includes(topic) &&
      (topicSuccesses[topic] || 0) >= (topicStruggles[topic] || 0)
    )
    .map(([topic]) => topic)
    .slice(0, 5);
  
  // Determine struggling topics (mentioned with struggle indicators)
  const struggling = Object.entries(topicMentions)
    .filter(([topic]) => 
      (topicStruggles[topic] || 0) > (topicSuccesses[topic] || 0)
    )
    .map(([topic]) => topic)
    .slice(0, 3);
  
  // Determine recommended topics (not yet mastered or mentioned less frequently)
  const allTopics = new Set([...Object.keys(topicMentions), ...getCommonTopics()]);
  const coveredTopics = new Set([...mastered, ...inProgress, ...struggling]);
  const recommended = Array.from(allTopics)
    .filter(topic => !coveredTopics.has(topic))
    .slice(0, 5);
  
  return {
    mastered,
    inProgress,
    struggling,
    recommended
  };
};

/**
 * Extract topics from text
 */
const extractTopicsFromText = (text: string): string[] => {
  // This is a simplified approach - in a real app, you'd use NLP or a predefined topic list
  const commonTopics = getCommonTopics();
  
  return commonTopics.filter(topic => 
    text.includes(topic.toLowerCase())
  );
};

/**
 * Get common topics across subjects
 */
const getCommonTopics = (): string[] => {
  return [
    // Math topics
    'Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 
    'Probability', 'Linear Algebra', 'Differential Equations',
    
    // Science topics
    'Physics', 'Chemistry', 'Biology', 'Astronomy', 'Ecology',
    'Genetics', 'Thermodynamics', 'Quantum Mechanics',
    
    // English topics
    'Grammar', 'Literature', 'Writing', 'Poetry', 'Rhetoric',
    'Shakespeare', 'Essay Writing', 'Creative Writing',
    
    // History topics
    'Ancient History', 'World Wars', 'Renaissance', 'Middle Ages',
    'American History', 'European History', 'Cold War', 'Civil Rights',
    
    // Language topics
    'Vocabulary', 'Conjugation', 'Grammar Rules', 'Conversation',
    'Reading', 'Writing', 'Pronunciation', 'Idioms'
  ];
};

/**
 * Calculate subject distribution from conversations
 */
const calculateSubjectDistribution = (conversations: any[]): Record<string, number> => {
  const subjects: Record<string, number> = {
    'Math': 0,
    'Science': 0,
    'English': 0,
    'History': 0,
    'Languages': 0,
    'Test Prep': 0
  };
  
  conversations.forEach(conv => {
    const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
    
    if (text.includes('math') || text.includes('algebra') || text.includes('calculus')) {
      subjects['Math']++;
    } else if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) {
      subjects['Science']++;
    } else if (text.includes('english') || text.includes('literature') || text.includes('writing')) {
      subjects['English']++;
    } else if (text.includes('history')) {
      subjects['History']++;
    } else if (text.includes('language') || text.includes('spanish') || text.includes('french')) {
      subjects['Languages']++;
    } else if (text.includes('test') || text.includes('exam') || text.includes('sat')) {
      subjects['Test Prep']++;
    } else {
      // Default to Math if no subject is detected
      subjects['Math']++;
    }
  });
  
  return subjects;
};