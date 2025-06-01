import { supabase } from '../lib/supabase';
import { products, ProductId } from '../stripe-config';

export async function createCheckoutSession(productId: ProductId) {
  const product = products[productId];
  if (!product) {
    throw new Error('Invalid product ID');
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
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
    return url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
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