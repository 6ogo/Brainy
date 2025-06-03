export const products = {
  premium: {
    id: 'premium',
    priceId: 'price_1RVHwmE0tB4GMirf5kR0lhaB',
    name: 'Premium',
    description: '4 hours daily conversation, 30 minute video calls, All subjects and specializations, Advanced analytics and insights, Downloadable conversation transcripts',
    mode: 'subscription' as const,
    price: 19.99,
    features: [
      '4 hours daily conversation',
      '30 minute video calls',
      'All subjects and specializations',
      'Advanced analytics and insights',
      'Downloadable conversation transcripts'
    ]
  },
  ultimate: {
    id: 'ultimate',
    priceId: 'price_1RVHznE0tB4GMirfRUpHNtxo',
    name: 'Ultimate',
    description: 'Unlimited conversation time, 60 minutes video calls, All subjects and specializations, Advanced analytics and insights, Downloadable conversation transcripts, Early access to new features',
    mode: 'subscription' as const,
    price: 69.00,
    features: [
      'Unlimited conversation time',
      '60 minutes video calls',
      'All subjects and specializations',
      'Advanced analytics and insights',
      'Downloadable conversation transcripts',
      'Early access to new features'
    ]
  },
} as const;

export type ProductId = keyof typeof products;