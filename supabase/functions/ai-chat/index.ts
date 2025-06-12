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
  context?: {
    userMessage?: string;
    aiResponse?: string;
  };
}

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Input validation and sanitization
function validateAndSanitizeInput(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  // Basic sanitization - remove potentially harmful characters
  return input.replace(/[<>\"'&]/g, '').trim();
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (userLimit.count >= 50) { // 50 requests per minute
    return false;
  }
  
  userLimit.count++;
  return true;
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
    // Get user ID from auth header for rate limiting
    const authHeader = req.headers.get('authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : 'anonymous';
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const groq = new Groq({
      apiKey: groqApiKey,
    });

    const requestBody = await req.json() as ChatRequest;
    const { message, subject, difficultyLevel, type, context } = requestBody;

    // Validate and sanitize inputs
    if (!message || !subject || !difficultyLevel || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sanitizedMessage = validateAndSanitizeInput(message);
    const sanitizedSubject = validateAndSanitizeInput(subject, 100);
    const sanitizedDifficultyLevel = validateAndSanitizeInput(difficultyLevel, 50);

    if (type === 'chat') {
      const systemPrompt = `You are an expert ${sanitizedSubject} tutor teaching at the ${sanitizedDifficultyLevel} level. 
      Provide clear, accurate, and engaging explanations appropriate for this level.
      Keep responses focused and concise while ensuring accuracy and depth of understanding.
      Be encouraging and supportive in your teaching style.
      Never include harmful, inappropriate, or off-topic content.
      If asked about topics outside your subject area, politely redirect to ${sanitizedSubject}.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: sanitizedMessage
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      const textResponse = completion.choices[0]?.message?.content || '';

      // Validate response length
      if (textResponse.length > 5000) {
        return new Response(JSON.stringify({ error: 'Response too long' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(
        JSON.stringify({ response: textResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'summary' && context) {
      const sanitizedUserMessage = validateAndSanitizeInput(context.userMessage || '', 2000);
      const sanitizedAiResponse = validateAndSanitizeInput(context.aiResponse || '', 5000);

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Generate a concise, educational summary of the learning interaction, highlighting key concepts and learning outcomes. Keep it under 200 characters."
          },
          {
            role: "user",
            content: `Summarize this ${sanitizedSubject} learning interaction:\nQuestion: ${sanitizedUserMessage}\nAnswer: ${sanitizedAiResponse}`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 256,
      });

      const summaryResponse = completion.choices[0]?.message?.content || '';

      return new Response(
        JSON.stringify({ response: summaryResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    // Don't expose internal error details
    const errorMessage = error instanceof Error && error.message.includes('Rate limit') 
      ? 'Rate limit exceeded' 
      : 'Service temporarily unavailable';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});