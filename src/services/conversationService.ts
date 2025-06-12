import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { SecurityUtils } from '../utils/security';
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

      // Validate and sanitize inputs
      const sanitizedMessage = SecurityUtils.sanitizeInput(message);
      if (!SecurityUtils.validateInput(sanitizedMessage, 2000)) {
        throw new Error('Invalid message format');
      }

      // Get AI response using Edge Function
      const chatResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          subject,
          difficultyLevel,
          type: 'chat'
        })
      });

      if (!chatResponse.ok) {
        if (chatResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment.');
        }
        const errorText = await chatResponse.text();
        throw new Error(`AI service error: ${chatResponse.status}`);
      }

      const data = await chatResponse.json();
      const textResponse = data.response;

      if (!textResponse) {
        throw new Error('No response received from AI');
      }

      // Validate response
      const sanitizedResponse = SecurityUtils.sanitizeInput(textResponse);
      if (!SecurityUtils.validateInput(sanitizedResponse, 5000)) {
        throw new Error('Invalid response from AI service');
      }

      let audioBlob: Blob | undefined;

      // Generate voice if requested and ElevenLabs is available
      if (useVoice) {
        try {
          audioBlob = await ElevenLabsService.generateSpeech(sanitizedResponse, currentAvatar);
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
              userMessage: sanitizedMessage,
              aiResponse: sanitizedResponse
            }
          })
        });

        if (summaryResponse.ok) {
          const { response: summaryText } = await summaryResponse.json();
          summary = SecurityUtils.sanitizeInput(summaryText);
        }
      } catch (summaryError) {
        console.error('Summary generation error:', summaryError);
        // Continue without summary if it fails
      }

      return {
        text: sanitizedResponse,
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
      // Validate and sanitize all inputs
      const sanitizedUserMessage = SecurityUtils.sanitizeInput(userMessage);
      const sanitizedAiResponse = SecurityUtils.sanitizeInput(aiResponse);
      const sanitizedSummary = summary ? SecurityUtils.sanitizeInput(summary) : undefined;

      if (!SecurityUtils.validateInput(sanitizedUserMessage, 2000) ||
          !SecurityUtils.validateInput(sanitizedAiResponse, 5000) ||
          (sanitizedSummary && !SecurityUtils.validateInput(sanitizedSummary, 500))) {
        throw new Error('Invalid conversation data');
      }

      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          user_message: sanitizedUserMessage,
          ai_response: sanitizedAiResponse,
          duration: Math.max(0, Math.min(duration, 86400)), // Limit to 24 hours
          summary: sanitizedSummary,
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
        .order('timestamp', { ascending: false })
        .limit(100); // Limit to prevent excessive data transfer

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }
}