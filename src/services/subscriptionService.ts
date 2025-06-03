import { supabase } from '../lib/supabase';
import { products, ProductId } from '../stripe-config';

export const getCurrentSubscription = async () => {
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
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        price_id: product.priceId,
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/pricing`,
        mode: product.mode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    throw error;
  }
};

export const hasAccess = async (entitlementId: string): Promise<boolean> => {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;
    
    return subscription.status === 'active';
  } catch (error) {
    console.error(`Error checking access to ${entitlementId}:`, error);
    return false;
  }
};