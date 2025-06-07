import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Groq from 'npm:groq-sdk';

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const groq = new Groq({
      apiKey: groqApiKey,
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

      // Generate voice if requested and ElevenLabs is available
      if (useVoice && voiceId && elevenLabsApiKey) {
        try {
          const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': elevenLabsApiKey
            },
            body: JSON.stringify({
              text: textResponse,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.5,
                use_speaker_boost: true
              }
            })
          });

          if (voiceResponse.ok) {
            const audioBuffer = await voiceResponse.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

            return new Response(
              JSON.stringify({ 
                response: textResponse,
                audioData: base64Audio
              }),
              { 
                headers: { 
                  ...corsHeaders, 
                  'Content-Type': 'application/json' 
                } 
              }
            );
          } else {
            console.error('ElevenLabs API error:', await voiceResponse.text());
          }
        } catch (voiceError) {
          console.error('Voice generation error:', voiceError);
          // Continue without voice if it fails
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

    return new Response(JSON.stringify({ error: 'Invalid request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});