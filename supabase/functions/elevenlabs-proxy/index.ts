// Follow Deno and Oak conventions for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ElevenLabs API key
const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || "";
const elevenLabsApiUrl = "https://api.elevenlabs.io/v1";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Voice IDs for our personas
const VOICE_IDS: Record<string, string> = {
  'encouraging-emma': 'EXAVITQu4vr4xnSDxMaL',
  'challenge-charlie': 'VR6AewLTigWG4xSOukaG',
  'fun-freddy': 'pNInz6obpgDQGcFmaJgB',
  'professor-patricia': 'ThT5KcBeYPX3keUQqHPh',
  'buddy-ben': 'yoZ06aMxZJJ28mfd3POQ'
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

    // Check if user has premium access
    const { data: subscription } = await supabase
      .from("user_subscription_status")
      .select("subscription_level")
      .eq("user_id", user.id)
      .single();

    const hasPremiumAccess = subscription?.subscription_level === "premium" || 
                            subscription?.subscription_level === "ultimate";

    if (!hasPremiumAccess) {
      return new Response(JSON.stringify({ error: "Premium subscription required for voice features" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { text, persona } = await req.json();

    if (!text || !persona) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate text length
    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: "Text too long for speech generation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if ElevenLabs API key is configured
    if (!elevenLabsApiKey) {
      console.error("ElevenLabs API key not configured");
      return new Response(JSON.stringify({ error: "Voice service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get voice ID for persona
    const voiceId = VOICE_IDS[persona] || VOICE_IDS['encouraging-emma'];

    console.log(`Generating speech for persona: ${persona}, voice: ${voiceId}, text length: ${text.length}`);

    // Call ElevenLabs API with improved error handling
    const elevenLabsResponse = await fetch(`${elevenLabsApiUrl}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error(`ElevenLabs API error: ${elevenLabsResponse.status} - ${errorText}`);
      
      // Provide more specific error messages
      let errorMessage = "Voice generation failed";
      if (elevenLabsResponse.status === 401) {
        errorMessage = "Voice service authentication failed";
      } else if (elevenLabsResponse.status === 429) {
        errorMessage = "Voice generation rate limit exceeded";
      } else if (elevenLabsResponse.status === 500) {
        errorMessage = "Voice service temporarily unavailable";
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: elevenLabsResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the audio data
    const audioData = await elevenLabsResponse.arrayBuffer();
    
    if (audioData.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Empty audio response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully generated speech: ${audioData.byteLength} bytes`);
    
    // Return audio data
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Length": audioData.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});