-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public_bolt;

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS public_bolt.stripe_customers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT null
);

-- Create subscription status enum
CREATE TYPE public_bolt.stripe_subscription_status AS ENUM (
  'not_started',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

-- Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS public_bolt.stripe_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id text UNIQUE NOT NULL,
  subscription_id text DEFAULT null,
  price_id text DEFAULT null,
  current_period_start bigint DEFAULT null,
  current_period_end bigint DEFAULT null,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text DEFAULT null,
  payment_method_last4 text DEFAULT null,
  status public_bolt.stripe_subscription_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT null
);

-- Create order status enum
CREATE TYPE public_bolt.stripe_order_status AS ENUM (
  'pending',
  'completed',
  'canceled'
);

-- Create stripe_orders table
CREATE TABLE IF NOT EXISTS public_bolt.stripe_orders (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  checkout_session_id text NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text NOT NULL,
  amount_subtotal bigint NOT NULL,
  amount_total bigint NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status public_bolt.stripe_order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT null
);

-- Enable RLS
ALTER TABLE public_bolt.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_bolt.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_bolt.stripe_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own customer data"
  ON public_bolt.stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can view their own subscription data"
  ON public_bolt.stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM public_bolt.stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can view their own order data"
  ON public_bolt.stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM public_bolt.stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- Create views
CREATE OR REPLACE VIEW public_bolt.stripe_user_subscriptions
WITH (security_invoker = true)
AS
SELECT
  c.customer_id,
  s.subscription_id,
  s.status as subscription_status,
  s.price_id,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.payment_method_brand,
  s.payment_method_last4
FROM public_bolt.stripe_customers c
LEFT JOIN public_bolt.stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

CREATE OR REPLACE VIEW public_bolt.stripe_user_orders
WITH (security_invoker = true)
AS
SELECT
  c.customer_id,
  o.id as order_id,
  o.checkout_session_id,
  o.payment_intent_id,
  o.amount_subtotal,
  o.amount_total,
  o.currency,
  o.payment_status,
  o.status as order_status,
  o.created_at as order_date
FROM public_bolt.stripe_customers c
LEFT JOIN public_bolt.stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON public_bolt.stripe_user_subscriptions TO authenticated;
GRANT SELECT ON public_bolt.stripe_user_orders TO authenticated;