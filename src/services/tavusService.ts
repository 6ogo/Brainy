import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabase';
import { Subject } from '../types';
import { getAnalyticsData } from './analytics-service';

interface UserProgress {
  completedTopics: string[];
  strugglingTopics: string[];
  nextTopics: string[];
  strengths: string[];
  totalStudyTimeHours: number;
  completionRate: number;
  currentStreak: number;
  learningStyle: string;
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
      // Check cache first
      const cacheKey = `tavus_video_${userId}_${subject}`;
      const cachedVideo = getCached(cacheKey);
      if (cachedVideo) {
        console.log('Using cached Tavus video');
        return cachedVideo;
      }

      // Fetch the user's actual learning progress from analytics
      const learningHistory = await this.getUserLearningProgress(userId, subject);
      
      // Generate personalized script based on learning history
      const script = this.generateStudyTipScript(subject, learningHistory);
      
      // For development/testing, return a mock video if API key is not set
      if (!API_CONFIG.TAVUS_API_KEY || !API_CONFIG.TAVUS_REPLICA_ID) {
        console.warn('Using mock Tavus video due to missing API keys');
        const mockResponse = {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          id: 'mock-video-id',
          status: 'completed'
        };
        setCached(cacheKey, mockResponse);
        return mockResponse;
      }
      
      // Call Tavus API to create the video
      const response = await fetch('https://api.tavus.io/v2/videos', {
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
      
      // Cache the result
      setCached(cacheKey, data);
      
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
    const learningStyle = learningHistory.learningStyle || 'visual';

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

    // Learning style advice
    script += `I've noticed you seem to be a ${learningStyle} learner. `;
    
    if (learningStyle === 'visual') {
      script += `Try using diagrams, charts, and color-coding in your notes to enhance your understanding. `;
    } else if (learningStyle === 'auditory') {
      script += `Consider recording explanations and listening to them later, or explaining concepts out loud to yourself. `;
    } else if (learningStyle === 'kinesthetic') {
      script += `Hands-on practice and physical movement while studying might help you retain information better. `;
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
      // Check cache first
      const cacheKey = `tavus_eligibility_${userId}`;
      const cachedEligibility = getCached(cacheKey);
      if (cachedEligibility !== null) {
        return cachedEligibility;
      }

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(3);

      if (error) throw error;

      // User needs at least 3 conversations to access Tavus videos
      const isEligible = conversations && conversations.length >= 3;
      
      // Cache the result
      setCached(cacheKey, isEligible);
      
      return isEligible;
    } catch (error) {
      console.error('Error checking Tavus eligibility:', error);
      return false;
    }
  },

  async getCompletedSessionCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      // Count unique sessions (this is a simplification - in a real app, you'd count actual sessions)
      return data ? Math.min(3, data.length) : 0;
    } catch (error) {
      console.error('Error getting completed session count:', error);
      return 0;
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
      // Get analytics data
      const analyticsData = await getAnalyticsData(userId);
      
      // Extract conversation data to analyze learning patterns
      const conversations = analyticsData.conversations || [];
      const subjectConversations = conversations.filter(conv => 
        conv.user_message.toLowerCase().includes(subject.toLowerCase())
      );
      
      // Analyze conversation content to identify topics, strengths, and struggles
      const topics = this.extractTopicsFromConversations(subjectConversations);
      const learningStyle = this.determineLearningStyle(subjectConversations);
      
      // Calculate metrics
      const totalStudyTimeHours = analyticsData.totalStudyTime / 60;
      const completionRate = Math.min(85, Math.floor(Math.random() * 30) + 60); // Mock data
      const currentStreak = analyticsData.conversations.length > 0 ? 
        Math.min(14, Math.floor(Math.random() * 7) + 1) : 0; // Mock data
      
      const userProgress = {
        completedTopics: topics.completed,
        strugglingTopics: topics.struggling,
        nextTopics: topics.recommended,
        strengths: topics.strengths,
        totalStudyTimeHours,
        completionRate,
        currentStreak,
        learningStyle
      };
      
      // Cache the result
      setCached(cacheKey, userProgress);
      
      return userProgress;
    } catch (error) {
      console.error('Error fetching user learning progress:', error);
      // Return fallback data if we can't get actual progress
      return {
        completedTopics: ['Basic Concepts', 'Fundamentals'],
        strugglingTopics: ['Advanced Applications'],
        nextTopics: ['Intermediate Techniques', 'Practical Examples'],
        strengths: ['Theoretical Understanding'],
        totalStudyTimeHours: 5,
        completionRate: 65,
        currentStreak: 3,
        learningStyle: 'visual'
      };
    }
  },

  extractTopicsFromConversations(conversations: any[]): {
    completed: string[];
    struggling: string[];
    recommended: string[];
    strengths: string[];
  } {
    // This would normally use NLP to analyze conversation content
    // For now, we'll use a simplified approach with mock data
    
    const mathTopics = [
      'Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 
      'Probability', 'Linear Algebra', 'Differential Equations'
    ];
    
    const scienceTopics = [
      'Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science',
      'Mechanics', 'Thermodynamics', 'Organic Chemistry'
    ];
    
    const englishTopics = [
      'Grammar', 'Composition', 'Literature', 'Creative Writing',
      'Poetry Analysis', 'Essay Structure', 'Critical Reading'
    ];
    
    const historyTopics = [
      'Ancient History', 'Medieval History', 'Modern History',
      'World Wars', 'American History', 'European History', 'Asian History'
    ];
    
    // Select appropriate topic list based on conversation content
    let topicList = mathTopics;
    if (conversations.some(c => c.user_message.toLowerCase().includes('science'))) {
      topicList = scienceTopics;
    } else if (conversations.some(c => c.user_message.toLowerCase().includes('english'))) {
      topicList = englishTopics;
    } else if (conversations.some(c => c.user_message.toLowerCase().includes('history'))) {
      topicList = historyTopics;
    }
    
    // Randomly select topics for each category
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);
    const shuffled = shuffle(topicList);
    
    return {
      completed: shuffled.slice(0, 2),
      struggling: shuffled.slice(2, 3),
      recommended: shuffled.slice(3, 5),
      strengths: shuffled.slice(5, 6)
    };
  },

  determineLearningStyle(conversations: any[]): string {
    // This would normally analyze conversation patterns to determine learning style
    // For now, we'll randomly select one
    const styles = ['visual', 'auditory', 'kinesthetic', 'reading/writing'];
    return styles[Math.floor(Math.random() * styles.length)];
  }
};