import { supabase } from '../lib/supabase';
import { ElevenLabsService } from './elevenlabsService';
import { Subject, AvatarPersonality, DifficultyLevel } from '../types';
import { API_CONFIG } from '../config/api';
import toast from 'react-hot-toast';
import Groq from 'groq-sdk';

interface ConversationResponse {
  text: string;
  audioUrl?: string;
  summary?: string;
}

const groq = new Groq({
  apiKey: API_CONFIG.GROQ_API_KEY,
});

export class ConversationService {
  static async generateResponse(
    message: string,
    subject: Subject,
    currentAvatar: AvatarPersonality,
    useVoice: boolean = true,
    difficultyLevel: DifficultyLevel = 'High School'
  ): Promise<ConversationResponse> {
    try {
      if (!API_CONFIG.GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
      }

      // Get AI response using Groq
      const response = await this.getAIResponse(message, subject, difficultyLevel);
      
      // Generate audio if voice is enabled
      let audioUrl: string | undefined;
      if (useVoice && API_CONFIG.ELEVENLABS_API_KEY) {
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

  private static async getAIResponse(
    message: string, 
    subject: Subject,
    difficultyLevel: DifficultyLevel
  ): Promise<string> {
    const systemPrompt = `You are an expert ${subject} tutor teaching at the ${difficultyLevel} level. 
    Provide clear, accurate, and engaging explanations appropriate for this level.
    Keep responses focused and concise while ensuring accuracy and depth of understanding.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  }

  private static async generateSummary(
    userMessage: string,
    aiResponse: string,
    subject: Subject
  ): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Generate a concise summary of the learning interaction, highlighting key points and next steps."
        },
        {
          role: "user",
          content: `Summarize this learning interaction in ${subject}:\nQuestion: ${userMessage}\nAnswer: ${aiResponse}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 256,
    });

    return completion.choices[0]?.message?.content || "Summary not available.";
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