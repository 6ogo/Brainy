// Follow Deno and Oak conventions for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Groq } from "https://esm.sh/groq-sdk@0.3.1";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Groq client
const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";
const groq = new Groq({ apiKey: groqApiKey });

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { message, subject, difficultyLevel, type, context } = await req.json();

    // Rate limiting check
    const rateLimitKey = `rate_limit:${user.id}`;
    const { data: rateLimit } = await supabase
      .from("rate_limits")
      .select("count, last_reset")
      .eq("key", rateLimitKey)
      .single();

    const now = new Date();
    const resetTime = rateLimit?.last_reset ? new Date(rateLimit.last_reset) : new Date(0);
    resetTime.setHours(resetTime.getHours() + 1);

    if (resetTime < now) {
      // Reset rate limit if an hour has passed
      await supabase
        .from("rate_limits")
        .upsert({ key: rateLimitKey, count: 1, last_reset: now.toISOString() });
    } else if (rateLimit && rateLimit.count >= 100) {
      // Rate limit exceeded
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Increment rate limit counter
      await supabase
        .from("rate_limits")
        .upsert({
          key: rateLimitKey,
          count: (rateLimit?.count || 0) + 1,
          last_reset: rateLimit?.last_reset || now.toISOString(),
        });
    }

    // Check subscription limits
    const { data: subscription } = await supabase
      .from("user_subscription_status")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Handle different request types
    let response;
    if (type === "chat") {
      // Create system prompt based on subject and difficulty
      const systemPrompt = createSystemPrompt(subject, difficultyLevel);

      // Get conversation history
      const { data: history } = await supabase
        .from("conversations")
        .select("user_message, ai_response")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(5);

      // Build messages array
      const messages = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history
      if (history && history.length > 0) {
        for (const item of history.reverse()) {
          messages.push({ role: "user", content: item.user_message });
          messages.push({ role: "assistant", content: item.ai_response });
        }
      }

      // Add current message
      messages.push({ role: "user", content: message });

      // Call Groq API
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      response = completion.choices[0]?.message?.content || "";
    } else if (type === "summary") {
      // Generate summary of conversation
      const systemPrompt = `You are an AI assistant that creates concise summaries of educational conversations. 
      Create a brief 1-2 sentence summary of the key learning points from this conversation.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User question: ${context.userMessage}\n\nAI response: ${context.aiResponse}` }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 100,
      });

      response = completion.choices[0]?.message?.content || "";
    } else {
      return new Response(JSON.stringify({ error: "Invalid request type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function createSystemPrompt(subject: string, difficultyLevel: string): string {
  return `You are an expert ${subject} tutor teaching at the ${difficultyLevel} level. Your role is to:

1. Provide clear, accurate explanations appropriate for ${difficultyLevel} students
2. Ask follow-up questions to check understanding
3. Break down complex concepts into digestible parts
4. Use examples and analogies relevant to the student's level
5. Encourage active learning and critical thinking
6. Adapt your teaching style based on the student's responses
7. Stay focused on ${subject} topics
8. Be patient and supportive while maintaining academic rigor

Guidelines:
- Keep responses conversational and engaging
- Use the student's name when appropriate
- Provide step-by-step explanations for problem-solving
- Encourage questions and curiosity
- Celebrate progress and learning milestones
- If a student seems confused, try explaining the concept differently
- Always maintain a positive, encouraging tone

Remember: You're not just providing answers, you're facilitating learning and understanding.`;
}