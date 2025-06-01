import { supabase } from '../lib/supabase';
import { TavusService } from './tavusService';
import { ElevenLabsService } from './elevenlabsService';
import { Subject } from '../types';

interface ConversationResponse {
  text: string;
  audioUrl?: string;
  videoUrl?: string;
}

export const ConversationService = {
  async generateResponse(
    message: string, 
    subject: Subject,
    useVideo: boolean = true,
    useVoice: boolean = true
  ): Promise<ConversationResponse> {
    try {
      // Get response from GPT (simulated here - replace with actual API call)
      const response = await this.getAIResponse(message, subject);
      
      // Generate speech and video in parallel if enabled
      const [audioUrl, videoUrl] = await Promise.all([
        useVoice ? this.generateSpeech(response) : Promise.resolve(undefined),
        useVideo ? this.generateVideo(response) : Promise.resolve(undefined)
      ]);

      // Save conversation to Supabase
      await this.saveConversation(message, response);

      return {
        text: response,
        audioUrl,
        videoUrl
      };
    } catch (error) {
      console.error('Error in conversation:', error);
      throw error;
    }
  },

  private async getAIResponse(message: string, subject: Subject): Promise<string> {
    // Simulate AI response based on subject
    // Replace with actual AI API integration
    const responses = {
      Math: "Let's solve this step by step. First, let's identify the key components...",
      Science: "This scientific concept is fascinating. Let me explain how it works...",
      English: "When analyzing this text, we should consider the author's intent...",
      History: "This historical event had several important causes and effects...",
      Languages: "In this language, we express this concept using the following structure...",
      'Test Prep': "This type of question often appears on exams. Here's how to approach it..."
    };

    return responses[subject] || "Let me help you understand this better...";
  },

  private async generateSpeech(text: string): Promise<string | undefined> {
    try {
      const voices = await ElevenLabsService.getVoices();
      const voice = voices[0]; // Select appropriate voice
      const audio = await ElevenLabsService.generateSpeech(text, voice.voice_id);
      
      // Convert audio buffer to URL
      const blob = new Blob([audio], { type: 'audio/mpeg' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating speech:', error);
      return undefined;
    }
  },

  private async generateVideo(text: string): Promise<string | undefined> {
    try {
      const video = await TavusService.createVideo(
        process.env.VITE_TAVUS_REPLICA_ID!,
        text
      );
      return video.url;
    } catch (error) {
      console.error('Error generating video:', error);
      return undefined;
    }
  },

  private async saveConversation(
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        user_message: userMessage,
        ai_response: aiResponse,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }
};