import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { Subject, AvatarPersonality, DifficultyLevel } from '../types';
import { API_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

interface ConversationResponse {
  text: string;
  audioUrl?: string;
  summary?: string;
}

export class ConversationService {
  static async generateResponse(
    message: string,
    subject: Subject,
    currentAvatar: AvatarPersonality,
    useVoice: boolean = true,
    difficultyLevel: DifficultyLevel = 'High School'
  ): Promise<ConversationResponse> {
    try {
      // Get AI response using Edge Function
      const chatResponse = await fetch(`${API_CONFIG.SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          subject,
          difficultyLevel,
          type: 'chat'
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const { response: aiResponse } = await chatResponse.json();
      
      // Generate audio if voice is enabled
      let audioUrl: string | undefined;
      if (useVoice && API_CONFIG.ELEVENLABS_API_KEY) {
        try {
          const audioBlob = await ElevenLabsService.generateSpeech(aiResponse, currentAvatar);
          audioUrl = URL.createObjectURL(audioBlob);
        } catch (error) {
          console.error('Error generating speech:', error);
          toast.error('Voice generation failed. Using text-only mode.');
        }
      }

      // Get summary using Edge Function
      const summaryResponse = await fetch(`${API_CONFIG.SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'summary',
          subject,
          context: {
            userMessage: message,
            aiResponse
          }
        })
      });

      let summary: string | undefined;
      if (summaryResponse.ok) {
        const { response: summaryText } = await summaryResponse.json();
        summary = summaryText;
      }

      return {
        text: aiResponse,
        audioUrl,
        summary
      };
    } catch (error) {
      console.error('Error in conversation:', error);
      throw error;
    }
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