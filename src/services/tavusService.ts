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
  conversation_url: string;
  conversation_id: string;
  status: string;
}

interface TavusConversationRequest {
  replica_id: string;
  persona_id?: string;
  conversation_name: string;
  conversational_context: string;
  custom_greeting?: string;
  callback_url?: string;
  properties?: {
    max_call_duration?: number;
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
    enable_recording?: boolean;
    enable_closed_captions?: boolean;
    apply_greenscreen?: boolean;
    language?: string;
  };
}

export const TavusService = {
  async createStudyAdvisorSession(userId: string, subject: Subject): Promise<TavusVideoResponse> {
    try {
      if (!API_CONFIG.TAVUS_API_KEY) {
        throw new Error('Tavus API key is not configured. Please add VITE_TAVUS_API_KEY to your environment variables.');
      }

      if (!API_CONFIG.TAVUS_REPLICA_ID) {
        throw new Error('Tavus Replica ID is not configured. Please add VITE_TAVUS_REPLICA_ID to your environment variables.');
      }

      // Get user's learning progress to create personalized context
      const learningHistory = await this.getUserLearningProgress(userId, subject);
      
      // Create conversational context based on user's progress
      const conversationalContext = this.generateConversationalContext(subject, learningHistory, userId);
      
      // Create the conversation request
      const requestBody: TavusConversationRequest = {
        replica_id: API_CONFIG.TAVUS_REPLICA_ID,
        persona_id: 'pa0f81e3a6ca', // Study advisor persona
        conversation_name: `Study Session - ${subject} - ${new Date().toISOString()}`,
        conversational_context: conversationalContext,
        custom_greeting: this.generateCustomGreeting(subject, learningHistory),
        callback_url: `${window.location.origin}/api/tavus-webhook`,
        properties: {
          max_call_duration: 300, // 5 minutes
          participant_left_timeout: 30,
          participant_absent_timeout: 60,
          enable_recording: false,
          enable_closed_captions: true,
          apply_greenscreen: false,
          language: 'english'
        }
      };

      console.log('Creating Tavus conversation with:', { 
        replica_id: requestBody.replica_id, 
        persona_id: requestBody.persona_id,
        conversation_name: requestBody.conversation_name 
      });

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid Tavus API key. Please check your VITE_TAVUS_API_KEY environment variable.');
        } else if (response.status === 402) {
          throw new Error('Tavus account has insufficient credits. Please check your Tavus account billing.');
        } else if (response.status === 403) {
          throw new Error('Tavus API access forbidden. Please check your account permissions.');
        } else if (response.status === 404) {
          throw new Error('Tavus replica not found. Please check your VITE_TAVUS_REPLICA_ID.');
        } else if (response.status === 429) {
          throw new Error('Tavus API rate limit exceeded. Please try again in a few minutes.');
        } else {
          throw new Error(`Tavus API error (${response.status}): ${errorData.error || response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.conversation_url) {
        throw new Error('No conversation URL received from Tavus API');
      }

      console.log('Tavus conversation created successfully:', data.conversation_id);
      
      // Save the conversation details for tracking
      await this.saveConversationDetails(userId, data.conversation_id, subject);

      return {
        conversation_url: data.conversation_url,
        conversation_id: data.conversation_id,
        status: data.status || 'created'
      };

    } catch (error) {
      console.error('Error creating Tavus study session:', error);
      throw error;
    }
  },

  async checkEligibilityForTavus(userId: string): Promise<boolean> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error checking Tavus eligibility:', error);
        return false;
      }

      // User needs at least 3 conversations to access Tavus videos
      return conversations && conversations.length >= 3;
    } catch (error) {
      console.error('Error checking Tavus eligibility:', error);
      return false;
    }
  },

  async getCompletedSessionCount(userId: string): Promise<number> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting session count:', error);
        return 0;
      }

      return conversations?.length || 0;
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  },

  async getUserLearningProgress(userId: string, subject: Subject): Promise<UserProgress> {
    try {
      // Get user's conversations to analyze progress
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('user_message, ai_response, timestamp, duration')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!conversations || conversations.length === 0) {
        return this.getDefaultProgress();
      }

      // Analyze conversations to determine progress
      const subjectConversations = conversations.filter(conv => 
        conv.user_message.toLowerCase().includes(subject.toLowerCase()) ||
        conv.ai_response.toLowerCase().includes(subject.toLowerCase())
      );

      // Extract topics from conversations
      const topics = this.extractTopicsFromConversations(subjectConversations, subject);
      
      // Calculate study time
      const totalStudyTimeMinutes = conversations.reduce((sum, conv) => sum + (conv.duration || 60), 0);
      const totalStudyTimeHours = totalStudyTimeMinutes / 60;

      // Calculate streak
      const currentStreak = this.calculateStreakFromConversations(conversations);

      // Determine completion rate based on activity
      const completionRate = Math.min(100, (conversations.length / 20) * 100);

      return {
        completedTopics: topics.completed,
        strugglingTopics: topics.struggling,
        nextTopics: topics.next,
        strengths: topics.strengths,
        totalStudyTimeHours,
        completionRate,
        currentStreak
      };

    } catch (error) {
      console.error('Error fetching user learning progress:', error);
      return this.getDefaultProgress();
    }
  },

  extractTopicsFromConversations(conversations: any[], subject: Subject): {
    completed: string[];
    struggling: string[];
    next: string[];
    strengths: string[];
  } {
    const topicsBySubject = {
      'Math': ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics'],
      'Science': ['Physics', 'Chemistry', 'Biology', 'Anatomy', 'Astronomy'],
      'English': ['Grammar', 'Literature', 'Writing', 'Reading Comprehension', 'Poetry'],
      'History': ['Ancient History', 'World Wars', 'American History', 'European History', 'Modern History'],
      'Languages': ['Vocabulary', 'Grammar', 'Conversation', 'Reading', 'Writing'],
      'Test Prep': ['SAT Math', 'SAT English', 'ACT Prep', 'GRE Prep', 'Study Strategies'],
      'All': [] // Add this if needed
    };

    const topics = topicsBySubject[subject] || ['Fundamentals', 'Intermediate', 'Advanced'];
    const mentionedTopics = new Set<string>();

    // Analyze conversations for topic mentions
    conversations.forEach(conv => {
      const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
      topics.forEach(topic => {
        if (text.includes(topic.toLowerCase())) {
          mentionedTopics.add(topic);
        }
      });
    });

    const mentioned = Array.from(mentionedTopics);
    const unmentioned = topics.filter(topic => !mentioned.includes(topic));

    return {
      completed: mentioned.slice(0, 2),
      struggling: mentioned.slice(2, 3),
      next: unmentioned.slice(0, 3),
      strengths: mentioned.slice(0, 1)
    };
  },

  calculateStreakFromConversations(conversations: any[]): number {
    if (!conversations.length) return 0;
    
    const dates = conversations.map(conv => {
      const date = new Date(conv.timestamp);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split('T')[0];
    });

    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    
    let streak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (uniqueDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  },

  generateConversationalContext(subject: Subject, progress: UserProgress, userId: string): string {
    const context = `You are speaking with a student who is learning ${subject}. 

Student Profile:
- Current study time: ${progress.totalStudyTimeHours.toFixed(1)} hours
- Learning streak: ${progress.currentStreak} days
- Completion rate: ${progress.completionRate}%

Progress Analysis:
- Completed topics: ${progress.completedTopics.join(', ') || 'Getting started'}
- Struggling with: ${progress.strugglingTopics.join(', ') || 'None identified yet'}
- Recommended next: ${progress.nextTopics.join(', ') || 'Continue current pace'}
- Key strengths: ${progress.strengths.join(', ') || 'Building foundations'}

Please provide personalized study advice, encouragement, and specific recommendations to help this student improve their ${subject} learning. Keep the conversation focused on actionable study tips and motivation.`;

    return context;
  },

  generateCustomGreeting(subject: Subject, progress: UserProgress): string {
    if (progress.currentStreak > 5) {
      return `Hi there! I can see you've been consistently studying ${subject} for ${progress.currentStreak} days straight - that's fantastic dedication! Let's talk about how to make your learning even more effective.`;
    } else if (progress.totalStudyTimeHours > 5) {
      return `Hello! I notice you've put in ${progress.totalStudyTimeHours.toFixed(1)} hours studying ${subject}. That shows real commitment. I'm here to help you get even more out of your study time.`;
    } else {
      return `Hi! I'm your AI study advisor, and I'm excited to help you excel in ${subject}. Based on your learning patterns, I have some personalized tips that can really boost your progress.`;
    }
  },

  getDefaultProgress(): UserProgress {
    return {
      completedTopics: [],
      strugglingTopics: [],
      nextTopics: ['Getting Started', 'Fundamentals'],
      strengths: [],
      totalStudyTimeHours: 0,
      completionRate: 0,
      currentStreak: 0
    };
  },

  async saveConversationDetails(userId: string, conversationId: string, subject: Subject): Promise<void> {
    try {
      const { error } = await supabase
        .from('tavus_conversations')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          subject: subject,
          created_at: new Date().toISOString(),
          status: 'active'
        });

      if (error) {
        console.error('Error saving Tavus conversation details:', error);
      }
    } catch (error) {
      console.error('Error saving conversation details:', error);
    }
  },

  async createStudyTipVideo(userId: string, subject: Subject): Promise<any> {
    // This method creates a pre-recorded video tip rather than a live conversation
    try {
      if (!API_CONFIG.TAVUS_API_KEY || !API_CONFIG.TAVUS_REPLICA_ID) {
        throw new Error('Tavus API configuration missing');
      }

      const progress = await this.getUserLearningProgress(userId, subject);
      const script = this.generateStudyTipScript(subject, progress);

      const response = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        },
        body: JSON.stringify({
          replica_id: API_CONFIG.TAVUS_REPLICA_ID,
          script: script,
          video_name: `Study Tips for ${subject} - ${new Date().toISOString()}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus video API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Tavus video:', error);
      throw error;
    }
  },

  generateStudyTipScript(subject: Subject, progress: UserProgress): string {
    let script = `Hi! I'm here to give you some personalized study tips for ${subject}. `;

    if (progress.currentStreak > 0) {
      script += `First, congratulations on your ${progress.currentStreak}-day study streak! `;
    }

    if (progress.completedTopics.length > 0) {
      script += `You've made great progress with ${progress.completedTopics.join(' and ')}. `;
    }

    if (progress.strugglingTopics.length > 0) {
      script += `I notice you might need some extra practice with ${progress.strugglingTopics[0]}. Here's my tip: break it down into smaller parts and practice one concept at a time. `;
    }

    if (progress.nextTopics.length > 0) {
      script += `Next, I recommend focusing on ${progress.nextTopics[0]} - it builds nicely on what you already know. `;
    }

    script += `Remember, consistency is key. Even 15 minutes of focused study daily is better than cramming. Keep up the great work!`;

    return script;
  }
};

export default TavusService;