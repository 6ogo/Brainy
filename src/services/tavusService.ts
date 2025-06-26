import { API_CONFIG, isTavusConfigured } from '../config/api';
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

interface TavusConversationResponse {
  conversation_id: string;
  conversation_name: string;
  status: string;
  conversation_url: string;
  replica_id: string;
  persona_id: string;
  created_at: string;
}

interface TavusConversationRequest {
  replica_id: string;
  persona_id: string;
  callback_url?: string;
  conversation_name: string;
  conversational_context: string;
  custom_greeting?: string;
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

interface DailyUsage {
  conversation_minutes: number;
  video_call_minutes: number;
  messages_sent: number;
  subscription_level: string;
}

interface VideoCallCheck {
  can_start: boolean;
  max_duration_minutes: number;
  subscription_level: string;
}

export const TavusService = {
  /**
   * Check if user can start a video call
   */
  async checkVideoCallAvailability(userId: string): Promise<VideoCallCheck> {
    try {
      const { data, error } = await supabase.rpc('can_start_video_call', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error checking video call availability:', error);
        return { can_start: false, max_duration_minutes: 0, subscription_level: 'free' };
      }

      return data[0] || { can_start: false, max_duration_minutes: 0, subscription_level: 'free' };
    } catch (error) {
      console.error('Error checking video call availability:', error instanceof Error ? error.message : String(error));
      return { can_start: false, max_duration_minutes: 0, subscription_level: 'free' };
    }
  },

  /**
   * Check daily conversation limits
   */
  async checkDailyConversationLimits(userId: string, estimatedMinutes: number = 30): Promise<{ canStart: boolean; usage: DailyUsage }> {
    try {
      // Check if user can start conversation
      const { data: canStartData, error: canStartError } = await supabase.rpc('can_start_conversation', {
        p_user_id: userId,
        p_estimated_minutes: estimatedMinutes
      });

      if (canStartError) throw canStartError;

      // Get daily usage details
      const { data: usageData, error: usageError } = await supabase.rpc('get_daily_usage', {
        p_user_id: userId
      });

      if (usageError) throw usageError;

      const usage = usageData[0] || {
        conversation_minutes: 0,
        video_call_minutes: 0,
        messages_sent: 0,
        subscription_level: 'free'
      };

      return {
        canStart: canStartData || false,
        usage
      };

    } catch (error) {
      console.error('Error checking daily conversation limits:', error);
      return {
        canStart: false,
        usage: {
          conversation_minutes: 0,
          video_call_minutes: 0,
          messages_sent: 0,
          subscription_level: 'free'
        }
      };
    }
  },

  /**
   * Track conversation time
   */
  async addConversationTime(userId: string, minutes: number, isVideoCall: boolean = false): Promise<void> {
    try {
      const { error } = await supabase.rpc('add_conversation_time', {
        p_user_id: userId,
        p_minutes: minutes,
        p_is_video_call: isVideoCall
      });

      if (error) {
        console.error('Error tracking conversation time:', error);
      }
    } catch (error) {
      console.error('Error tracking conversation time:', error);
    }
  },

  /**
   * Create a Tavus conversation for study advisor
   */
  async createStudyAdvisorSession(userId: string, subject: Subject): Promise<TavusConversationResponse> {
    try {
      // Check if Tavus is configured
      if (!isTavusConfigured()) {
        throw new Error('Video conversations are not configured. Please contact support.');
      }

      // Check video call availability
      const videoCheck = await this.checkVideoCallAvailability(userId);
      if (!videoCheck.can_start) {
        if (videoCheck.subscription_level === 'free') {
          throw new Error('Video calls are not available on the free plan. Upgrade to Premium for 10-minute video sessions or Ultimate for 60-minute sessions.');
        } else {
          throw new Error('Video calls are not available for your subscription level.');
        }
      }

      // Check eligibility (minimum sessions completed)
      const isEligible = await this.checkEligibilityForTavus(userId);
      if (!isEligible) {
        throw new Error('Complete at least 3 study sessions to unlock video conversations.');
      }

      // Get user's learning progress
      const learningProgress = await this.getUserLearningProgress(userId, subject);
      
      // Create conversational context
      const conversationalContext = this.generateConversationalContext(subject, learningProgress);
      
      // Create custom greeting
      const customGreeting = this.generateCustomGreeting(subject, learningProgress);

      // Set video call duration based on subscription
      const maxCallDuration = videoCheck.max_duration_minutes * 60; // Convert to seconds

      // Create the conversation request
      const requestBody: TavusConversationRequest = {
        replica_id: API_CONFIG.TAVUS_REPLICA_ID,
        persona_id: API_CONFIG.TAVUS_PERSONAS.STUDY_ADVISOR,
        conversation_name: `Study Session - ${subject} - ${new Date().toLocaleDateString()}`,
        conversational_context: conversationalContext,
        custom_greeting: customGreeting,
        callback_url: `${window.location.origin}/api/tavus-webhook`,
        properties: {
          ...API_CONFIG.TAVUS_CONVERSATION_DEFAULTS,
          max_call_duration: maxCallDuration,
        }
      };

      console.log('Creating Tavus conversation:', {
        replica_id: requestBody.replica_id,
        persona_id: requestBody.persona_id,
        conversation_name: requestBody.conversation_name,
        max_duration: `${videoCheck.max_duration_minutes} minutes`,
        subscription: videoCheck.subscription_level
      });

      // Make the API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TAVUS_TIMEOUT);

      try {
        const response = await fetch(`${API_CONFIG.TAVUS_BASE_URL}/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_CONFIG.TAVUS_API_KEY
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle specific error codes
          if (response.status === 401) {
            throw new Error('Invalid Tavus API key. Please check your configuration.');
          } else if (response.status === 402) {
            throw new Error('Tavus account has insufficient credits. Please check your billing.');
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

        const data: TavusConversationResponse = await response.json();
        
        if (!data.conversation_url) {
          throw new Error('No conversation URL received from Tavus API');
        }

        console.log('✅ Tavus conversation created successfully:', data.conversation_id);
        
        // Save conversation details
        await this.saveConversationDetails(userId, data.conversation_id, subject, data, videoCheck.max_duration_minutes);

        return data;

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Tavus API request timed out. Please try again.');
        }
        
        throw error;
      }

    } catch (error) {
      console.error('Error creating Tavus study session:', error);
      throw error;
    }
  },

  /**
   * Check if user is eligible for Tavus (minimum 3 conversations)
   */
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

      // User needs at least 3 conversations to access Tavus
      return conversations && conversations.length >= 3;
    } catch (error) {
      console.error('Error checking Tavus eligibility:', error);
      return false;
    }
  },

  /**
   * Get completed session count for eligibility
   */
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

  /**
   * Get user's learning progress for personalization
   */
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

      // Filter conversations related to the subject
      const subjectConversations = conversations.filter(conv => 
        conv.user_message?.toLowerCase().includes(subject.toLowerCase()) ||
        conv.ai_response?.toLowerCase().includes(subject.toLowerCase())
      );

      // Extract topics and analyze progress
      const topics = this.extractTopicsFromConversations(subjectConversations, subject);
      
      // Calculate study time
      const totalStudyTimeMinutes = conversations.reduce((sum, conv) => sum + (conv.duration || 60), 0);
      const totalStudyTimeHours = totalStudyTimeMinutes / 60;

      // Calculate streak
      const currentStreak = this.calculateStreakFromConversations(conversations);

      // Determine completion rate
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

  /**
   * Extract topics from conversations for analysis
   */
  extractTopicsFromConversations(conversations: any[], subject: Subject): {
    completed: string[];
    struggling: string[];
    next: string[];
    strengths: string[];
  } {
    const topicsBySubject: Record<string, string[]> = {
      'Math': ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Linear Algebra', 'Differential Equations'],
      'Science': ['Physics', 'Chemistry', 'Biology', 'Anatomy', 'Astronomy', 'Environmental Science'],
      'English': ['Grammar', 'Literature', 'Writing', 'Reading Comprehension', 'Poetry', 'Creative Writing'],
      'History': ['Ancient History', 'World Wars', 'American History', 'European History', 'Modern History', 'Cultural Studies'],
      'Languages': ['Vocabulary', 'Grammar', 'Conversation', 'Reading', 'Writing', 'Pronunciation'],
      'Test Prep': ['SAT Math', 'SAT English', 'ACT Prep', 'GRE Prep', 'GMAT Prep', 'Study Strategies']
    };

    const topics = topicsBySubject[subject] || ['Fundamentals', 'Intermediate', 'Advanced', 'Applied Concepts'];
    const mentionedTopics = new Set<string>();

    // Analyze conversations for topic mentions
    conversations.forEach(conv => {
      const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
      topics.forEach((topic: string) => {
        if (text.includes(topic.toLowerCase())) {
          mentionedTopics.add(topic);
        }
      });
    });

    const mentioned = Array.from(mentionedTopics);
    const unmentioned = topics.filter((topic: string) => !mentioned.includes(topic));

    return {
      completed: mentioned.slice(0, 3),
      struggling: mentioned.slice(3, 4),
      next: unmentioned.slice(0, 3),
      strengths: mentioned.slice(0, 2)
    };
  },

  /**
   * Calculate current learning streak
   */
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

  /**
   * Generate personalized conversational context
   */
  generateConversationalContext(subject: Subject, progress: UserProgress): string {
    return `You are an expert study advisor specializing in ${subject}. You're speaking with a dedicated student who needs personalized guidance.

STUDENT PROFILE:
- Study time invested: ${progress.totalStudyTimeHours.toFixed(1)} hours
- Learning consistency: ${progress.currentStreak} day streak
- Progress completion: ${progress.completionRate.toFixed(0)}%

LEARNING ANALYSIS:
- Mastered topics: ${progress.completedTopics.join(', ') || 'Building foundations'}
- Challenge areas: ${progress.strugglingTopics.join(', ') || 'None identified yet'}
- Recommended focus: ${progress.nextTopics.slice(0, 2).join(', ') || 'Continue current progress'}
- Key strengths: ${progress.strengths.join(', ') || 'Developing study habits'}

CONVERSATION GOALS:
1. Provide specific, actionable study strategies for ${subject}
2. Address any learning challenges with practical solutions
3. Suggest personalized study schedules and techniques
4. Motivate and encourage continued learning
5. Recommend resources tailored to their current level

Keep responses conversational, encouraging, and focused on practical advice. Ask questions to understand their specific needs and provide customized guidance.`;
  },

  /**
   * Generate personalized greeting message
   */
  generateCustomGreeting(subject: Subject, progress: UserProgress): string {
    if (progress.currentStreak > 7) {
      return `Hi there! I'm incredibly impressed by your ${progress.currentStreak}-day learning streak in ${subject} - that's the kind of consistency that leads to real mastery! I'm here to help you take your learning to the next level.`;
    } else if (progress.totalStudyTimeHours > 10) {
      return `Hello! I can see you've dedicated ${progress.totalStudyTimeHours.toFixed(1)} hours to studying ${subject} - that shows real commitment to your education. Let's talk about how to make your study time even more effective.`;
    } else if (progress.completedTopics.length > 0) {
      return `Hi! I notice you've been working on ${progress.completedTopics[0]} in ${subject}. That's a great foundation! I'm here to help you build on that knowledge and tackle what's next.`;
    } else {
      return `Welcome! I'm your AI study advisor, and I'm excited to help you excel in ${subject}. Based on what I know about effective learning, I have some personalized strategies that can really accelerate your progress.`;
    }
  },

  /**
   * Get default progress for new users
   */
  getDefaultProgress(): UserProgress {
    return {
      completedTopics: [],
      strugglingTopics: [],
      nextTopics: ['Getting Started', 'Basic Concepts', 'Fundamental Skills'],
      strengths: [],
      totalStudyTimeHours: 0,
      completionRate: 0,
      currentStreak: 0
    };
  },

  /**
   * Save conversation details to database
   */
  async saveConversationDetails(
    userId: string, 
    conversationId: string, 
    subject: Subject, 
    conversationData: TavusConversationResponse,
    maxDurationMinutes: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('tavus_conversations')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          subject: subject,
          conversation_url: conversationData.conversation_url,
          replica_id: conversationData.replica_id,
          persona_id: conversationData.persona_id,
          status: conversationData.status,
          duration_seconds: maxDurationMinutes * 60, // Store max allowed duration
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving Tavus conversation details:', error);
      } else {
        console.log('✅ Conversation details saved successfully');
      }
    } catch (error) {
      console.error('Error saving conversation details:', error);
    }
  },

  /**
   * Get user's conversation history
   */
  async getTavusConversationHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tavus_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  },

  /**
   * End a Tavus conversation
   */
  async endConversation(conversationId: string): Promise<boolean> {
    try {
      if (!isTavusConfigured()) {
        console.warn('Tavus not configured, cannot end conversation');
        return false;
      }

      const response = await fetch(`${API_CONFIG.TAVUS_BASE_URL}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': API_CONFIG.TAVUS_API_KEY
        }
      });

      if (response.ok) {
        console.log('✅ Conversation ended successfully');
        return true;
      } else {
        console.error('Failed to end conversation:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      return false;
    }
  }
};

export default TavusService;