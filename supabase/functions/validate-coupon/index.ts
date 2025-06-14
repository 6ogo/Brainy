import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecret) {
  throw new Error('Missing Stripe secret key');
}

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

    const { coupon_code } = await req.json();

    if (!coupon_code) {
      return new Response(JSON.stringify({ error: 'Missing coupon code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Check if it's a promotion code
      const promotionCodes = await stripe.promotionCodes.list({
        code: coupon_code,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length > 0) {
        const promotionCode = promotionCodes.data[0];
        const coupon = promotionCode.coupon;
        
        // Check if the coupon is still valid
        const isValid = coupon.valid && 
          (!coupon.redeem_by || coupon.redeem_by > Math.floor(Date.now() / 1000)) &&
          (!coupon.max_redemptions || coupon.times_redeemed < coupon.max_redemptions);

        return new Response(JSON.stringify({ 
          valid: isValid,
          coupon: isValid ? {
            id: coupon.id,
            name: coupon.name,
            percent_off: coupon.percent_off,
            amount_off: coupon.amount_off,
            currency: coupon.currency,
            duration: coupon.duration,
            duration_in_months: coupon.duration_in_months,
          } : null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if it's a direct coupon
      try {
        const coupon = await stripe.coupons.retrieve(coupon_code);
        
        const isValid = coupon.valid && 
          (!coupon.redeem_by || coupon.redeem_by > Math.floor(Date.now() / 1000)) &&
          (!coupon.max_redemptions || coupon.times_redeemed < coupon.max_redemptions);

        return new Response(JSON.stringify({ 
          valid: isValid,
          coupon: isValid ? {
            id: coupon.id,
            name: coupon.name,
            percent_off: coupon.percent_off,
            amount_off: coupon.amount_off,
            currency: coupon.currency,
            duration: coupon.duration,
            duration_in_months: coupon.duration_in_months,
          } : null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (couponError) {
        // Coupon doesn't exist
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (error) {
      console.error('Error validating coupon:', error);
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});