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
    const { data, error } = await supabase
      .from('user_subscription_status')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, user has free subscription
        return {
          subscription_level: 'free',
          subscription_status: null,
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
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
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
    const { error } = await supabase.rpc('track_daily_usage', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id,
      conversation_mins: conversationMinutes,
      video_mins: videoMinutes
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking daily usage:', error);
    throw error;
  }
};

export const getUserSubscriptionLevel = async (): Promise<'free' | 'premium' | 'ultimate'> => {
  try {
    const { data, error } = await supabase.rpc('get_user_subscription_level', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) throw error;
    return data || 'free';
  } catch (error) {
    console.error('Error getting user subscription level:', error);
    return 'free';
  }
};