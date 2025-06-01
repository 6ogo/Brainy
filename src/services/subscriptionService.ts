import * as Purchases from '@revenuecat/purchases-js';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;

export const initializeRevenueCat = () => {
  if (!REVENUECAT_API_KEY) {
    console.error('RevenueCat API key not found');
    return;
  }

  Purchases.configure(REVENUECAT_API_KEY);
};

export const purchaseSubscription = async (packageId: string) => {
  try {
    const customerInfo = await Purchases.purchasePackage(packageId);
    return customerInfo;
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    throw error;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

export const getCurrentSubscription = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting subscription info:', error);
    throw error;
  }
};