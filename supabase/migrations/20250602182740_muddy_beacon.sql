-- Set up admin subscription
INSERT INTO stripe_subscriptions (
  customer_id,
  subscription_id,
  status,
  price_id
)
SELECT 
  c.customer_id,
  'admin_sub_' || gen_random_uuid(),
  'active'::stripe_subscription_status,
  'ultimate_price'
FROM stripe_customers c
JOIN auth.users u ON c.user_id = u.id
WHERE u.id = '5d43e5c0-6023-4127-8913-6309477cf4e9'
ON CONFLICT (customer_id) DO UPDATE
SET 
  status = 'active',
  updated_at = now();