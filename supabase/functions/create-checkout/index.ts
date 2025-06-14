import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!stripeSecret) {
  throw new Error('Missing Stripe secret key');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { price_id, success_url, cancel_url, mode, promotion_code } = await req.json();

    if (!price_id || !success_url || !cancel_url || !mode) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return new Response(JSON.stringify({ error: 'Failed to authenticate user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information from the database', getCustomerError);
      return new Response(JSON.stringify({ error: 'Failed to fetch customer information' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let customerId;

    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      const { error: createCustomerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: newCustomer.id,
        });

      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);
        return new Response(JSON.stringify({ error: 'Failed to create customer mapping' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .insert({
            customer_id: newCustomer.id,
            status: 'not_started',
          });

        if (createSubscriptionError) {
          console.error('Failed to save subscription in the database', createSubscriptionError);
          return new Response(JSON.stringify({ error: 'Failed to create subscription record' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      customerId = newCustomer.id;
    } else {
      customerId = customer.customer_id;
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      allow_promotion_codes: true,
    };

    // Handle coupon/promotion code application
    if (promotion_code && promotion_code.trim()) {
      const trimmedCode = promotion_code.trim();
      console.log(`Attempting to apply coupon/promotion code: ${trimmedCode}`);
      
      try {
        // First, try to find it as a promotion code (case-sensitive)
        const promotionCodes = await stripe.promotionCodes.list({
          code: trimmedCode,
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          console.log(`Found promotion code: ${trimmedCode}`);
          sessionConfig.discounts = [{
            promotion_code: promotionCodes.data[0].id,
          }];
        } else {
          // If not found as promotion code, try as direct coupon
          try {
            const coupon = await stripe.coupons.retrieve(trimmedCode);
            if (coupon && coupon.valid) {
              console.log(`Found direct coupon: ${trimmedCode}`);
              sessionConfig.discounts = [{
                coupon: coupon.id,
              }];
            } else {
              console.log(`Coupon ${trimmedCode} exists but is not valid`);
              return new Response(JSON.stringify({ error: 'Invalid or expired coupon code' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } catch (couponError: any) {
            console.log(`Coupon ${trimmedCode} not found: ${couponError.message}`);
            return new Response(JSON.stringify({ error: 'Invalid or expired coupon code' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error: any) {
        console.error('Error applying coupon/promotion code:', error);
        return new Response(JSON.stringify({ error: 'Failed to apply coupon code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`Created checkout session ${session.id} for customer ${customerId}${promotion_code ? ` with coupon ${promotion_code}` : ''}`);

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});