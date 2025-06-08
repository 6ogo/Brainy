import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { Subject, AvatarPersonality, DifficultyLevel } from '../types';

interface ConversationResponse {
  text: string;
  audioBlob?: Blob;
  summary?: string;
}

export class ConversationService {
  static async generateResponse(
    message: string,
    subject: Subject,
    currentAvatar: AvatarPersonality,
    useVoice: boolean = false,
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
          type: 'chat'
        })
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        throw new Error(`Failed to get AI response: ${chatResponse.status} ${errorText}`);
      }

      const data = await chatResponse.json();
      const textResponse = data.response;

      if (!textResponse) {
        throw new Error('No response received from AI');
      }

      let audioBlob: Blob | undefined;

      // Generate voice if requested and ElevenLabs is available
      if (useVoice) {
        try {
          audioBlob = await ElevenLabsService.generateSpeech(textResponse, currentAvatar);
        } catch (voiceError) {
          console.error('Voice generation error:', voiceError);
          // Continue without voice if it fails
        }
      }

      // Get summary
      let summary: string | undefined;
      try {
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
              aiResponse: textResponse
            }
          })
        });

        if (summaryResponse.ok) {
          const { response: summaryText } = await summaryResponse.json();
          summary = summaryText;
        }
      } catch (summaryError) {
        console.error('Summary generation error:', summaryError);
        // Continue without summary if it fails
      }

      return {
        text: textResponse,
        audioBlob,
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