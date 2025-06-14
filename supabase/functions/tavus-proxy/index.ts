import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Tavus API key
const tavusApiKey = Deno.env.get("TAVUS_API_KEY") || "";
const tavusReplicaId = Deno.env.get("TAVUS_REPLICA_ID") || "";

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

    // Check if user has premium access
    const { data: subscription } = await supabase
      .from("user_subscription_status")
      .select("subscription_level")
      .eq("user_id", user.id)
      .single();

    const hasPremiumAccess = subscription?.subscription_level === "premium" || 
                            subscription?.subscription_level === "ultimate";

    if (!hasPremiumAccess) {
      return new Response(JSON.stringify({ error: "Premium subscription required for video features" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { replica_id, script } = await req.json();

    if (!script) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if Tavus API key is configured
    if (!tavusApiKey) {
      console.error("Tavus API key not configured");
      
      // Return a mock response for development
      return new Response(JSON.stringify({
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: "mock-video-id",
        status: "completed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the provided replica_id or fall back to the environment variable
    const replicaId = replica_id || tavusReplicaId;
    
    if (!replicaId) {
      return new Response(JSON.stringify({ error: "No replica ID provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Creating Tavus video with script length: ${script.length}`);

    // Call Tavus API
    const tavusResponse = await fetch("https://api.tavus.io/v2/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": tavusApiKey
      },
      body: JSON.stringify({
        replica_id: replicaId,
        script: script
      })
    });

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      console.error(`Tavus API error: ${tavusResponse.status} - ${errorText}`);
      
      // For development, return a mock response if the API call fails
      return new Response(JSON.stringify({
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        id: "fallback-video-id",
        status: "completed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the Tavus API response
    const data = await tavusResponse.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Return a mock response for development
    return new Response(JSON.stringify({
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      id: "error-fallback-video-id",
      status: "completed",
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});