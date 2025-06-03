import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Groq from 'npm:groq-sdk';
import { ElevenLabs } from 'npm:elevenlabs-node@2.0.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  message: string;
  subject: string;
  difficultyLevel: string;
  type: 'chat' | 'summary';
  useVoice?: boolean;
  voiceId?: string;
  context?: {
    userMessage?: string;
    aiResponse?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const groq = new Groq({
      apiKey: Deno.env.get('GROQ_API_KEY'),
    });

    const voice = new ElevenLabs({
      apiKey: Deno.env.get('ELEVENLABS_API_KEY'),
    });

    const { message, subject, difficultyLevel, type, useVoice, voiceId, context } = await req.json() as ChatRequest;

    if (type === 'chat') {
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

      const textResponse = completion.choices[0]?.message?.content || '';

      // Generate voice if requested
      if (useVoice && voiceId) {
        try {
          const audioBuffer = await voice.textToSpeech({
            text: textResponse,
            voice_id: voiceId,
            model_id: 'eleven_monolingual_v1',
          });

          return new Response(
            JSON.stringify({ 
              response: textResponse,
              audioData: audioBuffer.toString('base64')
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        } catch (voiceError) {
          console.error('Voice generation error:', voiceError);
          // Return text-only response if voice fails
          return new Response(
            JSON.stringify({ response: textResponse }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ response: textResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'summary' && context) {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Generate a concise summary of the learning interaction, highlighting key points and next steps."
          },
          {
            role: "user",
            content: `Summarize this learning interaction in ${subject}:\nQuestion: ${context.userMessage}\nAnswer: ${context.aiResponse}`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 256,
      });

      return new Response(
        JSON.stringify({ response: completion.choices[0]?.message?.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid request type');
  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});