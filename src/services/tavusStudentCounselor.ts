import { supabase } from '../lib/supabase';

/**
 * Fetches the user's context summary from the summary table.
 */
export async function getUserContextSummary(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_context_summaries')
    .select('summary')
    .eq('user_id', userId)
    .single();
  if (error) {
    console.error('Error fetching user context summary:', error);
    return null;
  }
  return data?.summary || null;
}

/**
 * Starts a Tavus video conversation with Olivia, the student counselor persona.
 * Returns the Tavus conversation_url for embedding in the UI.
 */
export async function startOliviaCounselorConversation({
  userId,
  conversationName,
  callbackUrl,
  apiKey,
  customGreeting = 'Hi there! I’m Olivia, your student counselor. How can I help you today?',
  properties = {}
}: {
  userId: string;
  conversationName: string;
  callbackUrl: string;
  apiKey: string;
  customGreeting?: string;
  properties?: Record<string, any>;
}): Promise<string | null> {
  const summary = await getUserContextSummary(userId);
  if (!summary) {
    throw new Error('No user context summary available.');
  }

  const body = {
    replica_id: 'rc2146c13e81',
    persona_id: 'pa0f81e3a6ca',
    callback_url: callbackUrl,
    conversation_name: conversationName,
    conversational_context: summary,
    custom_greeting: customGreeting,
    properties: {
      max_call_duration: 3600,
      participant_left_timeout: 60,
      participant_absent_timeout: 300,
      enable_recording: true,
      enable_closed_captions: true,
      apply_greenscreen: false,
      language: 'english',
      ...properties
    }
  };

  const response = await fetch('https://tavusapi.com/v2/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to start Tavus conversation');
  }

  const data = await response.json();
  return data.conversation_url || null;
}
