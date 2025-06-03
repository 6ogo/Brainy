import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { Subject, AvatarPersonality } from '../types';
import { API_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

interface ConversationResponse {
  text: string;
  audioUrl?: string;
  summary?: string;
}

const MONTHLY_MINUTES_LIMIT = 60; // 1 hour per month for premium users

export class ConversationService {
  static async generateResponse(
    message: string,
    subject: Subject,
    currentAvatar: AvatarPersonality,
    useVoice: boolean = true
  ): Promise<ConversationResponse> {
    try {
      if (!API_CONFIG.ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }

      // Get AI response based on subject and message
      const response = await this.getAIResponse(message, subject);
      
      // Generate audio if voice is enabled
      let audioUrl: string | undefined;
      if (useVoice) {
        try {
          const audioBlob = await ElevenLabsService.generateSpeech(response, currentAvatar);
          audioUrl = URL.createObjectURL(audioBlob);
        } catch (error) {
          console.error('Error generating speech:', error);
          toast.error('Voice generation failed. Using text-only mode.');
        }
      }

      return {
        text: response,
        audioUrl,
        summary: await this.generateSummary(message, response, subject)
      };
    } catch (error) {
      console.error('Error in conversation:', error);
      throw error;
    }
  }

  private static async getAIResponse(message: string, subject: Subject): Promise<string> {
    // Simulated AI response based on subject
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

  private static async generateSummary(
    userMessage: string,
    aiResponse: string,
    subject: Subject
  ): Promise<string> {
    return `
      Topic: ${subject}
      Question: ${userMessage.substring(0, 100)}...
      Key Points Discussed:
      - ${aiResponse.substring(0, 100)}...
      
      Next Steps:
      1. Review the concepts discussed
      2. Practice with similar problems
      3. Connect this topic with previous learning
    `;
  }

  static async saveConversation(
    userId: string,
    userMessage: string,
    aiResponse: string,
    duration: number,
    summary?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
          duration,
          summary,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  static async getConversationHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }
}