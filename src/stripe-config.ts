export const products = {
  premium: {
    id: 'premium',
    priceId: 'price_1RVHwmE0tB4GMirf5kR0lhaB',
    name: 'Premium',
    description: '4 hours daily conversation, 30 minute video calls, All subjects and specializations, Advanced analytics and insights, Downloadable conversation transcripts',
    mode: 'subscription',
    price: 19.99,
  },
  ultimate: {
    id: 'ultimate',
    priceId: 'price_1RVHznE0tB4GMirfRUpHNtxo',
    name: 'Ultimate',
    description: 'Increased conversation time, 60 minutes video calls, All subjects and specializations, Advanced analytics and insights, Downloadable conversation transcripts, Early access to new features',
    mode: 'subscription',
    price: 69.00,
  },
} as const;

export type ProductId = keyof typeof products;