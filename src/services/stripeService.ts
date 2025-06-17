import { supabase } from '../lib/supabase';
import { products, ProductId } from '../stripe-config';

export async function createCheckoutSession(productId: ProductId) {
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
}

export async function createPortalSession(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    const apiUrl = new URL('/functions/v1/create-portal', import.meta.env.VITE_SUPABASE_URL);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

export async function getCurrentSubscription() {
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

export async function getOrderHistory() {
  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching order history:', error);
    throw error;
  }
}

export async function validateCoupon(couponCode: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const apiUrl = new URL('/functions/v1/validate-coupon', import.meta.env.VITE_SUPABASE_URL);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        coupon_code: couponCode,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const { valid } = await response.json();
    return valid;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return false;
  }
}

export async function verifyCheckoutSession(sessionId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const apiUrl = new URL('/functions/v1/verify-checkout', import.meta.env.VITE_SUPABASE_URL);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const { valid } = await response.json();
    return valid;
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return false;
  }
}