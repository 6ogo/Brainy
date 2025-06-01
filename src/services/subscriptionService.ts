/**
 * Unified Subscription Service for Brainy Educational Platform
 * 
 * This service provides subscription management functionality using:
 * - Stripe: For web-based payments and subscriptions
 * - RevenueCat: For cross-platform subscription management (web + future mobile apps)
 */

import { supabase } from '../lib/supabase';
import { products, ProductId } from '../stripe-config';
import * as RevenueCat from '@revenuecat/purchases-js';

// Platform detection
const isMobile = (): boolean => {
  // Will be true when running in a mobile app wrapper
  return !!window.navigator.userAgent.match(/Mobile|Android|iOS|iPhone|iPad|iPod/i) && 
         window.location.protocol === 'file:'; // Additional check for true native apps
};

// ============== REVENUECAT INTEGRATION (for cross-platform) ===============

// Get the API key from environment variables
// For RevenueCat Web SDK, you must use a Web Billing API key (not the same as other platforms)
const REVENUECAT_WEB_API_KEY = import.meta.env.VITE_REVENUECAT_WEB_API_KEY || import.meta.env.VITE_REVENUECAT_API_KEY;

/**
 * Initialize the RevenueCat SDK
 * @param userId User ID for identification
 */
export const initializeRevenueCat = (userId?: string): void => {
  if (!REVENUECAT_WEB_API_KEY) {
    console.error('RevenueCat Web API key not found in environment variables');
    return;
  }

  // Log key type for debugging (first characters only, not the full key for security)
  console.log(`Initializing RevenueCat with API key type: ${REVENUECAT_WEB_API_KEY.substring(0, 5)}*****`);
  
  try {
    // Initialize the SDK with the API key and required parameters
    // See: https://www.revenuecat.com/docs/web/web-billing/web-sdk
    // For RevenueCat Web SDK, you need a valid API key that starts with one of these prefixes:
    // - 'rcb_' for Web Billing 
    // - 'sk_web_' for older Web Billing integrations
    // - 'pk_' for Paddle integration
    if (userId) {
      // With user ID - must follow parameters order in documentation
      RevenueCat.Purchases.configure(REVENUECAT_WEB_API_KEY, userId);
    } else {
      // Without user ID - the TypeScript definition requires at least a second parameter
      // We pass empty string as the second parameter to satisfy TypeScript
      RevenueCat.Purchases.configure(REVENUECAT_WEB_API_KEY, "");
    }
    console.log('RevenueCat SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    // Display more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error is likely due to incorrect API key format');
      console.error('RevenueCat Web SDK requires a valid API key that starts with "rcb_", "sk_web_", or "pk_"');
    }
  }
};

/**
 * Get available subscription offerings from RevenueCat
 * @param currency Currency code (default: USD)
 */
export const getRevenueCatOfferings = async (currency = 'USD') => {
  try {
    const purchases = RevenueCat.Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings({ currency });
    return offerings;
  } catch (error) {
    console.error('Error getting RevenueCat offerings:', error);
    return { current: null, all: {} };
  }
};

/**
 * Purchase a subscription package via RevenueCat
 * @param packageObject The package object to purchase
 */
export const purchaseWithRevenueCat = async (packageObject: any) => {
  try {
    const purchases = RevenueCat.Purchases.getSharedInstance();
    const result = await purchases.purchase({
      rcPackage: packageObject
    });
    return result;
  } catch (error) {
    console.error('Error purchasing with RevenueCat:', error);
    throw error;
  }
};

/**
 * Get RevenueCat customer info (subscription status)
 */
export const getRevenueCatCustomerInfo = async () => {
  try {
    const purchases = RevenueCat.Purchases.getSharedInstance();
    const customerInfo = await purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting RevenueCat customer info:', error);
    return null;
  }
};

// ================ STRIPE INTEGRATION (for web) ==================

/**
 * Create a checkout session for a Stripe product
 * @param productId The product ID to create a checkout for
 */
export const createStripeCheckout = async (productId: ProductId) => {
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
    return url;
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    throw error;
  }
};

/**
 * Get current subscription from Stripe via Supabase
 */
export const getStripeSubscription = async () => {
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
    console.error('Error fetching Stripe subscription:', error);
    return null;
  }
};

/**
 * Get order history from Stripe via Supabase
 */
export const getStripeOrderHistory = async () => {
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
    console.error('Error fetching Stripe order history:', error);
    return [];
  }
};

// ================ UNIFIED SUBSCRIPTION INTERFACE ==================

/**
 * Synchronize subscriptions between Stripe and RevenueCat
 * This is called after a successful Stripe purchase to update RevenueCat
 * @param stripeSubscriptionData The subscription data from Stripe
 */
export const syncSubscriptions = async (stripeSubscriptionData: any) => {
  try {
    // Call the Supabase edge function to sync the subscriptions
    // Get the current session using the updated Supabase API
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        stripeSubscription: stripeSubscriptionData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync subscriptions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    return null;
  }
};

/**
 * Get current subscription status, using the appropriate service based on platform
 */
export const getCurrentSubscription = async () => {
  if (isMobile()) {
    // Use RevenueCat for mobile apps
    return await getRevenueCatCustomerInfo();
  } else {
    // Use Stripe for web
    return await getStripeSubscription();
  }
};

/**
 * Purchase a subscription using the appropriate service based on platform
 * @param productId The product ID to purchase
 */
export const purchaseSubscription = async (productId: string) => {
  if (isMobile()) {
    // For mobile, use RevenueCat
    const pkg = await findPackageById(productId);
    if (!pkg) {
      throw new Error(`Package ${productId} not found`);
    }
    return await purchaseWithRevenueCat(pkg);
  } else {
    // For web, use Stripe
    return await createStripeCheckout(productId as ProductId);
  }
};

/**
 * Check if user has access to a specific entitlement
 * @param entitlementId The entitlement ID to check
 */
export const hasAccess = async (entitlementId: string): Promise<boolean> => {
  try {
    if (isMobile()) {
      // For mobile, check RevenueCat entitlements
      const customerInfo = await getRevenueCatCustomerInfo();
      if (!customerInfo) return false;
      
      return Object.keys(customerInfo.entitlements.active).includes(entitlementId);
    } else {
      // For web, check Stripe subscription status via Supabase
      const subscription = await getStripeSubscription();
      
      // Map subscription status to entitlements
      // This depends on how you've structured your data
      if (!subscription) return false;
      
      // Check if subscription status is active and the entitlement is included
      return subscription.status === 'active' && 
             subscription.entitlements?.includes(entitlementId);
    }
  } catch (error) {
    console.error(`Error checking access to ${entitlementId}:`, error);
    return false;
  }
};

/**
 * Helper to find a package by identifier in RevenueCat offerings
 * @param packageId The package identifier to find
 */
export const findPackageById = async (packageId: string) => {
  try {
    const offerings = await getRevenueCatOfferings();
    if (!offerings.current) return null;
    
    // Search through all available packages
    const packages = offerings.current.availablePackages;
    for (const pkg of Object.values(packages)) {
      // Use type assertion to handle the unknown type
      const typedPkg = pkg as any;
      if (typedPkg.identifier === packageId) {
        return typedPkg;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error finding package ${packageId}:`, error);
    return null;
  }
};

/**
 * Map Stripe products to RevenueCat products for cross-platform consistency
 * Use this to ensure product IDs are consistent across platforms
 */
export const getProductMapping = () => {
  return {
    // Stripe product ID -> RevenueCat product ID
    'premium': 'premium_monthly',
    'ultimate': 'ultimate_monthly',
    // Add more mappings as needed
  };
};