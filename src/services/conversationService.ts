import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { Subject } from '../types';
import { API_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

interface ConversationResponse {
  text: string;
  audioUrl?: string;
}

const MONTHLY_MINUTES_LIMIT = 60; // 1 hour per month for premium users

export class ConversationService {
  private static voiceIds: Record<string, string> = {
    'encouraging-emma': 'EXAVITQu4vr4xnSDxMaL',
    'challenge-charlie': 'VR6AewLTigWG4xSOukaG',
    'fun-freddy': 'pNInz6obpgDQGcFmaJgB',
    'professor-patricia': 'ThT5KcBeYPX3keUQqHPh',
    'buddy-ben': 'yoZ06aMxZJJ28mfd3POQ'
  };

  static async checkMonthlyUsage(userId: string): Promise<boolean> {
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const { data: usage, error } = await supabase
      .from('user_usage')
      .select('minutes_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    const minutesUsed = usage?.minutes_used || 0;
    return minutesUsed < MONTHLY_MINUTES_LIMIT;
  }

  static async updateUsage(userId: string, durationInSeconds: number): Promise<void> {
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const durationInMinutes = Math.ceil(durationInSeconds / 60);

    const { data: existing } = await supabase
      .from('user_usage')
      .select('id, minutes_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();

    if (existing) {
      await supabase
        .from('user_usage')
        .update({ 
          minutes_used: existing.minutes_used + durationInMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          month_year: monthYear,
          minutes_used: durationInMinutes
        });
    }
  }

  static async generateResponse(
    message: string,
    subject: Subject,
    currentAvatar: string,
    useVoice: boolean = true
  ): Promise<ConversationResponse> {
    try {
      if (!API_CONFIG.ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }

      // Get AI response based on subject and message
      const response = await this.getAIResponse(message, subject);

      let audioUrl: string | undefined;

      if (useVoice) {
        try {
          const voiceId = this.voiceIds[currentAvatar];
          const audioBlob = await ElevenLabsService.generateSpeech(response, voiceId);
          audioUrl = URL.createObjectURL(audioBlob);
        } catch (error) {
          console.error('Error generating speech:', error);
          toast.error('Voice generation failed. Using text-only mode.');
        }
      }

      return {
        text: response,
        audioUrl
      };
    } catch (error) {
      console.error('Error in conversation:', error);
      throw error;
    }
  }

  private static async getAIResponse(message: string, subject: Subject): Promise<string> {
    // TODO: Replace with actual AI integration (e.g., OpenAI)
    const responses = {
      Math: "Let's solve this step by step. First, let's identify the key components...",
      Science: "This scientific concept is fascinating. Let me explain how it works...",
      English: "When analyzing this text, we should consider the author's intent...",
      History: "This historical event had several important causes and effects...",
      Languages: "In this language, we express this concept using the following structure...",
      'Test Prep': "This type of question often appears on exams. Here's how to approach it..."
    };

    return responses[subject] || "Let me help you understand this better...";
  }

  static async saveConversation(
    userId: string, 
    userMessage: string, 
    aiResponse: string,
    duration: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
          duration,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Update usage tracking
      await this.updateUsage(userId, duration);
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }
}