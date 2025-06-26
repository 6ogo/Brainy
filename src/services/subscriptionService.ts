import { supabase } from '../lib/supabase';
import { products, ProductId } from '../stripe-config';

export interface UserSubscription {
  subscription_level: 'free' | 'premium' | 'ultimate';
  subscription_status: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  daily_conversation_minutes: number;
  video_call_minutes: number;
  subjects_access: string[];
  advanced_analytics: boolean;
  downloadable_transcripts: boolean;
  early_access: boolean;
}

export const getCurrentSubscription = async (): Promise<UserSubscription | null> => {
  try {
    // Get current user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return null;
    }

    console.log('Fetching subscription for user:', user.id);

    // Read from stripe_subscriptions table (source of truth)
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active') // Only get active subscriptions
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching subscription from stripe_subscriptions:', error);
      // Fallback to free subscription
      return getFreeSubscription();
    }

    if (!data || data.length === 0) {
      console.log('No active subscription found in stripe_subscriptions, returning free tier');
      return getFreeSubscription();
    }

    const subscription = data[0];
    console.log('Found subscription in stripe_subscriptions:', subscription);

    // Map stripe subscription to UserSubscription format
    const mappedSubscription: UserSubscription = {
      subscription_level: subscription.subscription_level || 'free',
      subscription_status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      // Set limits based on subscription level
      daily_conversation_minutes: getConversationLimits(subscription.subscription_level),
      video_call_minutes: getVideoCallLimits(subscription.subscription_level),
      subjects_access: getSubjectsAccess(subscription.subscription_level),
      advanced_analytics: hasAdvancedAnalytics(subscription.subscription_level),
      downloadable_transcripts: hasDownloadableTranscripts(subscription.subscription_level),
      early_access: hasEarlyAccess(subscription.subscription_level),
    };

    console.log('Mapped subscription:', mappedSubscription);
    return mappedSubscription;

  } catch (error) {
    console.error('Error in getCurrentSubscription:', error);
    return getFreeSubscription();
  }
};

// Helper function for free subscription
const getFreeSubscription = (): UserSubscription => {
  return {
    subscription_level: 'free',
    subscription_status: 'active',
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: null,
    daily_conversation_minutes: 30,
    video_call_minutes: 0,
    subjects_access: ['Math', 'English'],
    advanced_analytics: false,
    downloadable_transcripts: false,
    early_access: false,
  };
};

// Helper functions to determine limits based on subscription level
const getConversationLimits = (level: string): number => {
  switch (level) {
    case 'ultimate': return -1; // Unlimited
    case 'premium': return 240; // 4 hours
    default: return 30; // 30 minutes
  }
};

const getVideoCallLimits = (level: string): number => {
  switch (level) {
    case 'ultimate': return 60; // 60 minutes
    case 'premium': return 10;  // 10 minutes
    default: return 0; // No video calls
  }
};

const getSubjectsAccess = (level: string): string[] => {
  switch (level) {
    case 'ultimate':
    case 'premium': 
      return ['Math', 'English', 'Science', 'History', 'Languages', 'Test Prep'];
    default: 
      return ['Math', 'English'];
  }
};

const hasAdvancedAnalytics = (level: string): boolean => {
  return level === 'premium' || level === 'ultimate';
};

const hasDownloadableTranscripts = (level: string): boolean => {
  return level === 'premium' || level === 'ultimate';
};

const hasEarlyAccess = (level: string): boolean => {
  return level === 'ultimate';
};

// Add a simplified version that just returns the subscription level
export const getSubscriptionLevel = async (): Promise<'free' | 'premium' | 'ultimate'> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'free';

    // Read directly from stripe_subscriptions for better performance
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('subscription_level')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No active subscription found, returning free');
      return 'free';
    }

    const level = data.subscription_level || 'free';
    console.log('Current subscription level from stripe_subscriptions:', level);
    return level as 'free' | 'premium' | 'ultimate';
  } catch (error) {
    console.error('Error getting subscription level:', error);
    return 'free';
  }
};

// Add a function to refresh/force update subscription
export const refreshSubscription = async (): Promise<UserSubscription | null> => {
  try {
    // Clear any cached data and fetch fresh from stripe_subscriptions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      console.log('No active subscription found during refresh');
      return getFreeSubscription();
    }

    const subscription = data[0];
    console.log('Refreshed subscription from stripe_subscriptions:', subscription);

    // Map to UserSubscription format
    const mappedSubscription: UserSubscription = {
      subscription_level: subscription.subscription_level || 'free',
      subscription_status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      daily_conversation_minutes: getConversationLimits(subscription.subscription_level),
      video_call_minutes: getVideoCallLimits(subscription.subscription_level),
      subjects_access: getSubjectsAccess(subscription.subscription_level),
      advanced_analytics: hasAdvancedAnalytics(subscription.subscription_level),
      downloadable_transcripts: hasDownloadableTranscripts(subscription.subscription_level),
      early_access: hasEarlyAccess(subscription.subscription_level),
    };

    return mappedSubscription;
  } catch (error) {
    console.error('Error in refreshSubscription:', error);
    return null;
  }
};

export const purchaseSubscription = async (productId: ProductId) => {
  const product = products[productId];
  if (!product) {
    throw new Error('Invalid product ID');
  }

  try {
    // Get the current session using the updated Supabase API
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    const apiUrl = new URL('/functions/v1/create-checkout', import.meta.env.VITE_SUPABASE_URL);
    
    const requestBody = {
      price_id: product.priceId,
      success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/pricing`,
      mode: product.mode,
    };
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    if (!url) {
      throw new Error('No checkout URL received');
    }

    window.location.href = url;
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    throw error;
  }
};

export const refreshSubscriptionData = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    // Call RPC function to refresh subscription data
    const { error } = await supabase.rpc('refresh_subscription_data');
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error refreshing subscription data:', error);
    throw error;
  }
};

export const hasAccess = async (entitlementId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('user_has_access', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id,
      feature_name: entitlementId
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error(`Error checking access to ${entitlementId}:`, error);
    return false;
  }
};

export const checkDailyUsageLimit = async (usageType: 'conversation' | 'video'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_daily_usage_limit', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id,
      usage_type: usageType
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error(`Error checking daily usage limit for ${usageType}:`, error);
    return false;
  }
};

export const trackDailyUsage = async (conversationMinutes: number = 0, videoMinutes: number = 0): Promise<void> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get current date in YYYY-MM format for month_year
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Insert or update the user_usage record
    const { error } = await supabase.from('user_usage').upsert({
      user_id: user.id,
      month_year: monthYear,
      date: dateStr,
      conversation_minutes: conversationMinutes,
      video_call_minutes: videoMinutes,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,date'
    });

    if (error) {
      // If there's a conflict, try to update the existing record
      if (error.code === '23505') {
        // Get current values
        const { data: currentUsage } = await supabase
          .from('user_usage')
          .select('conversation_minutes, video_call_minutes')
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .single();
          
        if (currentUsage) {
          // Update with incremented values
          const { error: updateError } = await supabase
            .from('user_usage')
            .update({
              conversation_minutes: (currentUsage.conversation_minutes || 0) + conversationMinutes,
              video_call_minutes: (currentUsage.video_call_minutes || 0) + videoMinutes,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('date', dateStr);
            
          if (updateError) throw updateError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error tracking daily usage:', error);
    throw error;
  }
};

export const getUserSubscriptionLevel = async (): Promise<'free' | 'premium' | 'ultimate'> => {
  try {
    // Use the updated getSubscriptionLevel function that reads from stripe_subscriptions
    return await getSubscriptionLevel();
  } catch (error) {
    console.error('Error getting user subscription level:', error);
    return 'free';
  }
};