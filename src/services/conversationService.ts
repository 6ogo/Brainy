import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { Subject, AvatarPersonality, DifficultyLevel } from '../types';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get AI response using Edge Function
      const chatResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          subject,
          difficultyLevel,
          type: 'chat',
          useVoice,
          voiceId: useVoice ? ElevenLabsService.getVoiceId(currentAvatar) : undefined
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await chatResponse.json();
      
      // Convert base64 audio to blob URL if available
      let audioUrl: string | undefined;
      if (data.audioData) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        audioUrl = URL.createObjectURL(audioBlob);
      }

      // Get summary
      const summaryResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'summary',
          subject,
          context: {
            userMessage: message,
            aiResponse: data.response
          }
        })
      });

      let summary: string | undefined;
      if (summaryResponse.ok) {
        const { response: summaryText } = await summaryResponse.json();
        summary = summaryText;
      }

      return {
        text: data.response,
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
        .from('public_bolt.conversations')
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
        .from('public_bolt.conversations')
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