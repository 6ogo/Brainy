import { API_CONFIG } from '../config/api';

interface TavusCache {
  [key: string]: {
    data: any;
    timestamp: number;
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: TavusCache = {};

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

const setCached = (key: string, data: any) => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};

export const TavusService = {
  async createStudyTipVideo(userId: string, subject: string, learningHistory: any) {
    try {
      const response = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        },
        body: JSON.stringify({
          replica_id: API_CONFIG.TAVUS_REPLICA_ID,
          script: this.generateStudyTipScript(subject, learningHistory)
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Tavus video:', error);
      throw error;
    }
  },

  generateStudyTipScript(subject: string, learningHistory: any) {
    // Generate personalized script based on subject and learning history
    const completedTopics = learningHistory.completedTopics || [];
    const strugglingTopics = learningHistory.strugglingTopics || [];
    const nextTopics = learningHistory.nextTopics || [];

    let script = `Hi! I've been analyzing your progress in ${subject}. `;

    if (completedTopics.length > 0) {
      script += `You've done great with ${completedTopics.join(', ')}. `;
    }

    if (strugglingTopics.length > 0) {
      script += `I noticed you might want to review ${strugglingTopics.join(', ')}. `;
    }

    if (nextTopics.length > 0) {
      script += `I recommend focusing on ${nextTopics[0]} next, as it builds on what you've learned. `;
    }

    script += "Let's keep up the great work!";

    return script;
  },

  async checkEligibilityForTavus(userId: string): Promise<boolean> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
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
  }
};