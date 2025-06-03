import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabase';
import { Subject } from '../types';

interface UserProgress {
  completedTopics: string[];
  strugglingTopics: string[];
  nextTopics: string[];
  strengths: string[];
  totalStudyTimeHours: number;
  completionRate: number;
  currentStreak: number;
}

interface TavusVideoResponse {
  url: string;
  id: string;
  status: string;
}

// Optional caching layer for performance optimization
interface TavusCache {
  [key: string]: {
    data: any;
    timestamp: number;
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: TavusCache = {};

// Get data from cache if available and not expired
const getCached = (key: string) => {
  const cached = cache[key];
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    delete cache[key];
    return null;
  }
  
  return cached.data;
};

// Store data in cache with timestamp
const setCached = (key: string, data: any) => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};

export const TavusService = {
  async createStudyTipVideo(userId: string, subject: Subject): Promise<TavusVideoResponse> {
    try {
      // Fetch the user's actual learning progress from the database
      const learningHistory = await this.getUserLearningProgress(userId, subject);
      
      // Generate personalized script based on learning history
      const script = this.generateStudyTipScript(subject, learningHistory);
      
      // Call Tavus API to create the video
      const response = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        },
        body: JSON.stringify({
          replica_id: API_CONFIG.TAVUS_REPLICA_ID,
          script: script
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as TavusVideoResponse;
    } catch (error) {
      console.error('Error creating Tavus video:', error);
      throw error;
    }
  },

  generateStudyTipScript(subject: string, learningHistory: UserProgress): string {
    // Extract relevant data from learning history
    const completedTopics = learningHistory.completedTopics || [];
    const strugglingTopics = learningHistory.strugglingTopics || [];
    const nextTopics = learningHistory.nextTopics || [];
    const strengths = learningHistory.strengths || [];
    const studyTime = learningHistory.totalStudyTimeHours || 0;
    const completionRate = learningHistory.completionRate || 0;
    const streak = learningHistory.currentStreak || 0;

    let script = `Hi! I've been analyzing your progress in ${subject}. `;

    // Personalized greeting based on study time and streak
    if (streak > 5) {
      script += `First, great job on maintaining a ${streak}-day learning streak! That's impressive consistency. `;
    }

    if (studyTime > 10) {
      script += `You've already invested ${studyTime} hours in your learning journey, which shows real dedication. `;
    }

    // Highlight accomplishments
    if (completedTopics.length > 0) {
      script += `You've shown mastery in ${completedTopics.join(', ')}. `;
      
      if (strengths.length > 0) {
        script += `Your particular strengths are in ${strengths.join(', ')}. `;
      }
    }

    // Provide targeted advice on struggling areas
    if (strugglingTopics.length > 0) {
      script += `I've noticed you might benefit from reviewing ${strugglingTopics.join(', ')}. `;
      
      // Add specific advice for the first struggling topic
      if (strugglingTopics[0]) {
        script += `For ${strugglingTopics[0]}, try breaking it down into smaller parts and practice with simpler examples first. `;
      }
    }

    // Recommend next steps with rationale
    if (nextTopics.length > 0) {
      script += `Based on your learning pattern, I recommend focusing on ${nextTopics[0]} next, as it builds on concepts you've already mastered and will help you progress further. `;
      
      if (nextTopics.length > 1) {
        script += `After that, ${nextTopics[1]} would be a natural progression. `;
      }
    }

    // Completion rate feedback
    if (completionRate > 0) {
      if (completionRate > 80) {
        script += `Your completion rate of ${completionRate}% is excellent! Keep up the great work. `;
      } else if (completionRate > 50) {
        script += `You're making good progress with a ${completionRate}% completion rate. Let's aim to build on that. `;
      } else {
        script += `I see your completion rate is at ${completionRate}%. Let's work on strategies to help you complete more of your learning goals. `;
      }
    }

    // Encouraging closing
    script += "Remember, consistent practice is key to mastery. I'm here to support your learning journey every step of the way!";

    return script;
  },

  async checkEligibilityForTavus(userId: string): Promise<boolean> {
    try {
      const { data: conversations, error } = await supabase
        .from('public_bolt.conversations')
        .select('id')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(3);

      if (error) throw error;

      // User needs at least 3 conversations to access Tavus videos
      return conversations && conversations.length >= 3;
    } catch (error) {
      console.error('Error checking Tavus eligibility:', error);
      return false;
    }
  },

  async getUserLearningProgress(userId: string, subject: Subject): Promise<UserProgress> {
    // Try to get cached data first
    const cacheKey = `progress_${userId}_${subject}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return cachedData as UserProgress;
    }
    try {
      // Get completed topics
      const { data: completedData, error: completedError } = await supabase
        .from('public_bolt.completed_topics')
        .select('topic_name, proficiency_score, completed_at')
        .eq('user_id', userId)
        .eq('subject', subject)
        .order('completed_at', { ascending: false });

      if (completedError) throw completedError;
      
      // Get topics in progress with low scores (struggling)
      const { data: strugglingData, error: strugglingError } = await supabase
        .from('public_bolt.topic_progress')
        .select('topic_name, proficiency_score, last_attempt_at')
        .eq('user_id', userId)
        .eq('subject', subject)
        .lt('proficiency_score', 60) // Topics with less than 60% proficiency
        .order('last_attempt_at', { ascending: false });
      
      if (strugglingError) throw strugglingError;
      
      // Get recommended next topics based on curriculum
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('public_bolt.subject_curriculum')
        .select('topic_name, topic_order')
        .eq('subject', subject)
        .order('topic_order', { ascending: true });
      
      if (curriculumError) throw curriculumError;
      
      // Get user's strengths (topics with highest proficiency)
      const { data: strengthsData, error: strengthsError } = await supabase
        .from('public_bolt.completed_topics')
        .select('topic_name, proficiency_score')
        .eq('user_id', userId)
        .eq('subject', subject)
        .gte('proficiency_score', 90) // Topics with 90% or higher proficiency
        .order('proficiency_score', { ascending: false })
        .limit(3);
      
      if (strengthsError) throw strengthsError;
      
      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from('public_bolt.user_stats')
        .select('total_study_time_hours, completion_rate, current_streak')
        .eq('user_id', userId)
        .single();
      
      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      
      // Determine next topics (topics in curriculum not yet completed)
      const completedTopicNames = completedData?.map(t => t.topic_name) || [];
      const nextTopics = curriculumData
        ?.filter(t => !completedTopicNames.includes(t.topic_name))
        ?.map(t => t.topic_name) || [];
      
      const userProgress = {
        completedTopics: completedData?.map(t => t.topic_name) || [],
        strugglingTopics: strugglingData?.map(t => t.topic_name) || [],
        nextTopics: nextTopics.slice(0, 3), // Get first 3 recommended topics
        strengths: strengthsData?.map(t => t.topic_name) || [],
        totalStudyTimeHours: userStats?.total_study_time_hours || 0,
        completionRate: userStats?.completion_rate || 0,
        currentStreak: userStats?.current_streak || 0
      };
      
      // Cache the result
      setCached(cacheKey, userProgress);
      
      return userProgress;
    } catch (error) {
      console.error('Error fetching user learning progress:', error);
      // Return fallback data if we can't get actual progress
      return {
        completedTopics: [],
        strugglingTopics: [],
        nextTopics: [],
        strengths: [],
        totalStudyTimeHours: 0,
        completionRate: 0,
        currentStreak: 0
      };
    }
  }
};