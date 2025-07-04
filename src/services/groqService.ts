import { AI_MODELS, GENERATION_PARAMS, ERROR_MESSAGES } from '../constants/ai';
import { SecurityUtils } from '../utils/security';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class GroqService {
  private static API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static conversationHistory = new Map<string, GroqMessage[]>();
  private static apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

  static async generateResponse(
    message: string,
    subject: string,
    avatarPersonality: string,
    difficultyLevel: string,
    userId: string,
    isStudyMode: boolean = false
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('GROQ API key not configured');
      }

      // Sanitize input
      const sanitizedMessage = SecurityUtils.sanitizeInput(message);
      if (!SecurityUtils.validateInput(sanitizedMessage, 2000)) {
        throw new Error('Invalid message format');
      }

      // Get or create conversation history
      const conversationKey = `${userId}-${subject}-${difficultyLevel}`;
      let history = this.conversationHistory.get(conversationKey) || [];

      // Create system prompt based on avatar personality, subject and difficulty level
      const systemPrompt = this.createSystemPrompt(subject, avatarPersonality, difficultyLevel, isStudyMode);

      // Build messages array
      const messages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: sanitizedMessage }
      ];

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_MODELS.GROQ.DEFAULT,
          messages,
          temperature: isStudyMode ? GENERATION_PARAMS.STUDY_MODE_TEMPERATURE : GENERATION_PARAMS.DEFAULT_TEMPERATURE,
          max_tokens: isStudyMode ? GENERATION_PARAMS.STUDY_MODE_MAX_TOKENS : GENERATION_PARAMS.DEFAULT_MAX_TOKENS,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GROQ API error: ${response.status} - ${errorText}`);
        
        // Provide specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your GROQ API key configuration.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid request parameters. Please check your input.');
        } else if (response.status === 500) {
          throw new Error('GROQ service error. Please try again later.');
        } else {
          throw new Error(`GROQ API error: ${response.status} - ${errorText}`);
        }
      }

      const data: GroqResponse = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';

      if (!aiResponse) {
        throw new Error('No response received from GROQ');
      }

      // Update conversation history
      history.push(
        { role: 'user', content: sanitizedMessage },
        { role: 'assistant', content: aiResponse }
      );
      
      // Keep only last 20 messages to prevent memory issues
      if (history.length > 20) {
        history = history.slice(-20);
      }
      
      this.conversationHistory.set(conversationKey, history);

      return aiResponse;
    } catch (error) {
      console.error('GROQ Service error:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('AI service configuration error. Please contact support.');
        } else if (error.message.includes('Rate limit')) {
          throw new Error(ERROR_MESSAGES.RATE_LIMIT);
        } else if (error.message.includes('Invalid request')) {
          throw new Error('Invalid request. Please try a different question.');
        } else if (error.message.includes('GROQ service error')) {
          throw new Error(ERROR_MESSAGES.VOICE_SERVICE);
        } else {
          throw new Error(ERROR_MESSAGES.GENERAL);
        }
      } else {
        throw new Error(ERROR_MESSAGES.GENERAL);
      }
    }
  }

  static async generateSummary(
    userMessage: string,
    aiResponse: string
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('GROQ API key not configured');
      }

      const systemPrompt = `You are an AI assistant that creates concise summaries of educational conversations. 
      Create a brief 1-2 sentence summary of the key learning points from this conversation.`;

      const messages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User question: ${userMessage}\n\nAI response: ${aiResponse}` }
      ];

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_MODELS.GROQ.DEFAULT,
          messages,
          temperature: GENERATION_PARAMS.SUMMARY_TEMPERATURE,
          max_tokens: GENERATION_PARAMS.SUMMARY_MAX_TOKENS,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GROQ API error during summary generation: ${response.status} - ${errorText}`);
        return '';
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  static createSystemPrompt(
    subject: string,
    avatarPersonality: string,
    difficultyLevel: string,
    isStudyMode: boolean = false
  ): string {
    const personalityTraits = {
      'encouraging-emma': 'You are Emma, a warm, supportive, and patient tutor. Use encouraging language, celebrate small wins, and help build confidence. Always be positive and understanding.',
      'challenge-charlie': 'You are Charlie, a direct and challenging tutor who pushes students to think critically. Ask probing questions, present alternative viewpoints, and encourage deep analysis.',
      'fun-freddy': 'You are Freddy, an enthusiastic and creative tutor who makes learning fun. Use humor, analogies, games, and creative examples to make concepts memorable and engaging.',
      'professor-patricia': 'You are Professor Patricia, a formal academic tutor with deep expertise. Provide detailed, scholarly explanations with proper terminology and comprehensive coverage of topics.',
      'buddy-ben': 'You are Ben, a friendly peer-like tutor who explains things casually. Use simple language, relate to student experiences, and create a comfortable learning environment.'
    };

    const difficultyGuidelines = {
      'Elementary': 'Use simple vocabulary and basic concepts. Explain everything in very clear, straightforward terms with many examples. Avoid technical terminology. Use short sentences and simple explanations suitable for young learners or beginners.',
      'High School': 'Use moderate vocabulary and introduce some field-specific terms with explanations. Provide clear examples and analogies. Balance depth with accessibility. Suitable for teenage students or adults with basic knowledge.',
      'College': 'Use proper terminology and more complex concepts. Provide detailed explanations with academic rigor. Assume some background knowledge but still explain specialized concepts. Suitable for undergraduate level.',
      'Advanced': 'Use specialized terminology and sophisticated concepts. Provide in-depth analysis and nuanced explanations. Assume strong background knowledge. Suitable for graduate level or professional specialists.'
    };

    const personality = personalityTraits[avatarPersonality as keyof typeof personalityTraits] || personalityTraits['encouraging-emma'];
    const difficultyGuideline = difficultyGuidelines[difficultyLevel as keyof typeof difficultyGuidelines] || difficultyGuidelines['High School'];

    // Base prompt
    let prompt = `${personality}

You are an expert ${subject} tutor teaching at the ${difficultyLevel} level. Your role is to:

1. Provide clear, accurate explanations appropriate for ${difficultyLevel} students
2. Ask follow-up questions to check understanding
3. Break down complex concepts into digestible parts
4. Use examples and analogies relevant to the student's level
5. Encourage active learning and critical thinking
6. Adapt your teaching style based on the student's responses
7. Stay focused on ${subject} topics
8. Be patient and supportive while maintaining academic rigor

Difficulty Level Guidelines:
${difficultyGuideline}

Guidelines:
- Keep responses conversational and engaging
- Use the student's name when appropriate
- Provide step-by-step explanations for problem-solving
- Encourage questions and curiosity
- Celebrate progress and learning milestones
- If a student seems confused, try explaining the concept differently
- Always maintain a positive, encouraging tone

Remember: You're not just providing answers, you're facilitating learning and understanding.`;

    // Add study mode enhancements if enabled
    if (isStudyMode) {
      prompt += `

STUDY MODE ACTIVATED:
You are now in Study Mode, which means you should provide deeper educational insights and more structured learning. In this mode:

1. Treat each interaction as a focused learning session
2. Provide more comprehensive explanations with educational depth
3. Include relevant theoretical background when appropriate
4. Offer structured learning paths for complex topics
5. Suggest practice exercises or problems to reinforce learning
6. Provide clear, step-by-step explanations for problem-solving
7. Reference academic frameworks or methodologies when relevant
8. Offer study tips specific to the topic being discussed

When responding in Study Mode:
- Begin with a clear explanation of the concept or topic
- Include relevant examples that illustrate the concept
- Highlight key points or takeaways
- Suggest ways to apply this knowledge
- Provide context for how this fits into the broader subject
- End with a check for understanding or follow-up question

Your goal is to create a rich, educational experience that helps the student develop a deep understanding of ${subject}.`;
    }

    return prompt;
  }

  static clearConversationHistory(userId: string, subject?: string, difficultyLevel?: string): void {
    if (subject && difficultyLevel) {
      const conversationKey = `${userId}-${subject}-${difficultyLevel}`;
      this.conversationHistory.delete(conversationKey);
    } else if (subject) {
      // Clear all conversations for the user and subject across difficulty levels
      const keysToDelete = Array.from(this.conversationHistory.keys())
        .filter(key => key.startsWith(`${userId}-${subject}`));
      keysToDelete.forEach(key => this.conversationHistory.delete(key));
    } else {
      // Clear all conversations for the user
      const keysToDelete = Array.from(this.conversationHistory.keys())
        .filter(key => key.startsWith(`${userId}-`));
      keysToDelete.forEach(key => this.conversationHistory.delete(key));
    }
  }

  static getConversationHistory(userId: string, subject: string, difficultyLevel: string): GroqMessage[] {
    const conversationKey = `${userId}-${subject}-${difficultyLevel}`;
    return this.conversationHistory.get(conversationKey) || [];
  }
}